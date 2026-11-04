/* Renders the project list and drives its interactions. */
(() => {
  'use strict';

  const OWNER = 'meta-lucky-builds';
  const CLEAR_DELAY = 80;   // ms before a leave or blur takes effect
  const LERP = 0.18;        // cursor tag follow, per 60 Hz frame
  const NUDGE = 4;          // px of travel needed to switch rows
  const SETTLE_MS = 260;    // reveals are moving rows for roughly this long
  const SETTLE_NUDGE = 24;  // px of travel needed to switch rows meanwhile

  const list = document.getElementById('projects');
  const count = document.getElementById('project-count');
  const tag = document.getElementById('cursor-tag');
  const projects = Array.isArray(window.PROJECTS) ? window.PROJECTS : [];

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const callField = (method, arg) => {
    const field = window.Field;
    if (field && typeof field[method] === 'function') field[method](arg);
  };

  const el = (tagName, className, text) => {
    const node = document.createElement(tagName);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  /* ---------- Render ---------- */

  const hues = new Map();

  const renderRow = (project, index) => {
    const repo = String(project.repo);
    const li = el('li', 'project');
    li.style.setProperty('--hue', project.hue);
    li.style.setProperty('--i', index);
    hues.set(li, project.hue);

    const link = el('a', 'project__link');
    link.href = `https://github.com/${OWNER}/${encodeURIComponent(repo)}`;
    link.target = '_blank';
    link.rel = 'noopener';

    const headline = el('span', 'project__headline');
    headline.append(el('em', 'project__lead', project.lead), ` ${project.rest}`);

    const outcome = el('span', 'project__outcome');
    outcome.append(el('span', 'project__outcome-label', project.outcomeLabel), ` ${project.outcome}`);

    const inner = el('span', 'project__reveal-inner');
    inner.append(el('span', 'project__detail', project.detail), outcome);

    const reveal = el('span', 'project__reveal');
    reveal.append(inner);

    const body = el('span', 'project__body');
    body.append(
      headline,
      el('span', 'project__standout', project.standout),
      reveal,
      el('span', 'project__url', `github.com/${OWNER}/${repo}`)
    );

    const tags = el('span', 'project__tags');
    (project.tags || []).forEach((name) => tags.append(el('span', 'project__tag', name)));

    const arrow = el('span', 'project__arrow', '↗');
    arrow.setAttribute('aria-hidden', 'true');

    link.append(
      el('span', 'project__num', String(index + 1).padStart(2, '0')),
      body,
      tags,
      arrow
    );
    li.append(link);
    return li;
  };

  if (list) list.append(...projects.map(renderRow));
  if (count && projects.length) count.textContent = String(projects.length);

  // Two frames, so the first style pass sees the pre-entrance state. The timer
  // keeps the rows from staying hidden where frames do not run, as in a
  // background capture.
  const markReady = () => document.documentElement.classList.add('is-ready');
  requestAnimationFrame(() => requestAnimationFrame(markReady));
  setTimeout(markReady, 400);

  if (!list || !projects.length) return;

  /* ---------- State ---------- */

  let active = null;      // the one is-active row
  let pointerRow = null;  // row activated by the pointer
  let focusRow = null;    // row activated by the keyboard
  let clearTimer = 0;
  let recheckTimer = 0;

  let lastX = null;       // last real pointer position, null when unknown
  let lastY = null;
  let anchorX = 0;        // where the pointer last switched rows
  let anchorY = 0;
  let switchedAt = 0;

  let raf = 0;
  let prevTime = 0;
  let spotRow = null;     // row waiting for a --mx/--my write
  let needsSync = false;  // cursor tag visibility needs a fresh look
  let tagShown = false;
  let tagX = 0;
  let tagY = 0;
  let goalX = 0;
  let goalY = 0;

  /* ---------- Activation ---------- */

  const setActive = (row) => {
    clearTimeout(clearTimer);
    if (row === active) return;
    if (active) active.classList.remove('is-active');
    active = row;
    if (row) row.classList.add('is-active');
    list.classList.toggle('has-active', Boolean(row));
    callField('setHue', row && Number.isFinite(hues.get(row)) ? hues.get(row) : null);
    requestSync();
  };

  // Delayed, so moving between rows or tabbing onward does not flicker.
  const release = () => {
    clearTimeout(clearTimer);
    clearTimer = setTimeout(() => setActive(pointerRow || focusRow), CLEAR_DELAY);
  };

  const rowAt = (x, y) => {
    if (x === null) return null;
    const hit = document.elementFromPoint(x, y);
    return hit ? hit.closest('.project') : null;
  };

  const pointerTo = (row) => {
    clearTimeout(recheckTimer);

    if (row === active) {
      pointerRow = row;
      clearTimeout(clearTimer);
      return;
    }
    if (!row) {
      if (pointerRow) {
        pointerRow = null;
        release();
      }
      return;
    }

    // A row that just opened moves its neighbours under the pointer, so a
    // small movement right after a switch is not yet a request for a new row.
    if (active && active === pointerRow) {
      const left = SETTLE_MS - (performance.now() - switchedAt);
      const need = left > 0 ? SETTLE_NUDGE : NUDGE;
      if (Math.hypot(lastX - anchorX, lastY - anchorY) < need) {
        // Do not strand the row if the pointer comes to rest here.
        if (left > 0) recheckTimer = setTimeout(() => pointerTo(rowAt(lastX, lastY)), left);
        return;
      }
    }

    pointerRow = row;
    anchorX = lastX;
    anchorY = lastY;
    switchedAt = performance.now();
    setActive(row);
  };

  // Browsers replay enter and leave after layout changes with the same
  // coordinates, so only a changed position counts as the pointer moving.
  const onPointer = (event) => {
    if (event.pointerType === 'touch') return;
    if (event.clientX === lastX && event.clientY === lastY) return;
    lastX = event.clientX;
    lastY = event.clientY;
    goalX = lastX;  // styles.css offsets the tag from the pointer with a margin
    goalY = lastY;

    const row = event.target instanceof Element ? event.target.closest('.project') : null;
    if (row) spotRow = row;
    pointerTo(row);
    requestSync();
  };

  list.querySelectorAll('.project').forEach((row) => {
    row.addEventListener('pointerenter', onPointer);
  });
  document.addEventListener('pointermove', onPointer, { passive: true });

  // The pointer left the window, which no replayed event can fake.
  document.documentElement.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'touch') return;
    clearTimeout(recheckTimer);
    lastX = lastY = null;
    pointerRow = null;
    release();
    requestSync();
  });

  // Keyboard focus only: a click also focuses the link, and that focus comes
  // back when the visitor returns from the new tab.
  list.addEventListener('focusin', (event) => {
    const link = event.target.closest('.project__link');
    if (!link || !link.matches(':focus-visible')) return;
    focusRow = link.closest('.project');
    pointerRow = null;
    setActive(focusRow);
  });

  list.addEventListener('focusout', () => {
    if (!focusRow) return;
    focusRow = null;
    release();
  });

  // The link opens normally in a new tab.
  list.addEventListener('click', (event) => {
    if (event.target.closest('.project__link')) callField('pulse');
  });

  /* ---------- Frame loop: --mx/--my and the cursor tag ---------- */

  function schedule() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function requestSync() {
    needsSync = true;
    schedule();
  }

  const writeTag = () => {
    tag.style.transform = `translate3d(${tagX}px, ${tagY}px, 0)`;
  };

  // The tag shows only while the pointer is really over the active row, which
  // scrolling or a layout change can end without any pointer movement.
  const syncTag = () => {
    if (!tag) return;
    const show = Boolean(active) && fine.matches && rowAt(lastX, lastY) === active;
    if (show && !tagShown) {
      // Appear at the pointer rather than flying in from the last position.
      tagX = goalX;
      tagY = goalY;
      writeTag();
    }
    tagShown = show;
    tag.classList.toggle('is-visible', show);
  };

  // Returns true while the tag still has distance to cover.
  const stepTag = (dt) => {
    if (reduced.matches) {
      tagX = goalX;
      tagY = goalY;
    } else {
      const k = 1 - Math.pow(1 - LERP, Math.min(dt, 50) / (1000 / 60));
      tagX += (goalX - tagX) * k;
      tagY += (goalY - tagY) * k;
      if (Math.abs(goalX - tagX) < 0.1 && Math.abs(goalY - tagY) < 0.1) {
        tagX = goalX;
        tagY = goalY;
      }
    }
    writeTag();
    return tagX !== goalX || tagY !== goalY;
  };

  function frame(now) {
    raf = 0;
    const dt = prevTime ? now - prevTime : 1000 / 60;
    prevTime = now;

    if (spotRow) {
      const rect = spotRow.getBoundingClientRect();
      spotRow.style.setProperty('--mx', `${lastX - rect.left}px`);
      spotRow.style.setProperty('--my', `${lastY - rect.top}px`);
      spotRow = null;
    }
    if (needsSync) {
      needsSync = false;
      syncTag();
    }
    if (tagShown && stepTag(dt)) schedule();
    else prevTime = 0;
  }

  // Replayed events are ignored for activation but still mean the row under
  // the pointer may have changed, as do scrolling and a finished reveal.
  document.addEventListener('pointerover', requestSync, { passive: true });
  window.addEventListener('scroll', requestSync, { passive: true, capture: true });
  list.addEventListener('transitionend', requestSync);
  if (fine.addEventListener) fine.addEventListener('change', requestSync);
})();
