/* connect.js: the map of how the repos connect, and the thread filter on the list. */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const THREADS = {
    forgetting: { name: 'Forgetting', hue: 172, x: 205, y: 70 },
    world: { name: 'World models', hue: 214, x: 715, y: 40 },
    real: { name: 'Is it real?', hue: 62, x: 470, y: 312 },
    tooling: { name: 'Tooling', hue: 190, x: 880, y: 300 },
    foundation: { name: 'Foundation', hue: 295, x: 95, y: 312 }
  };

  // Repo -> threads, and where its node sits on the map.
  const NODES = {
    'how-networks-forget': { t: ['forgetting'], x: 210, y: 115, label: 'how-networks-forget' },
    'continual-learning-experiments': { t: ['forgetting'], x: 120, y: 185, label: 'continual-learning' },
    'sleep': { t: ['forgetting'], x: 250, y: 235, label: 'sleep' },
    'world-model-adaptation-vs-retention': { t: ['forgetting', 'world'], x: 455, y: 165, label: 'adaptation-vs-retention' },
    'world-model-adaptation': { t: ['world'], x: 640, y: 90, label: 'world-model-adaptation' },
    'flow-policy-noise-carry': { t: ['world'], x: 815, y: 120, label: 'flow-policy' },
    'transfer': { t: ['world'], x: 650, y: 200, label: 'transfer' },
    'so101-slow-roll': { t: ['world'], x: 805, y: 225, label: 'so101-slow-roll' },
    'llm-introspection-probes': { t: ['real'], x: 360, y: 360, label: 'introspection-probes' },
    'stress-testing-weight-space-programming': { t: ['real'], x: 520, y: 395, label: 'weight-space' },
    'falsifiable-dl-math': { t: ['real'], x: 655, y: 350, label: 'falsifiable-dl-math' },
    'auto-sci-harness': { t: ['tooling'], x: 875, y: 360, label: 'auto-sci-harness' },
    'physics': { t: ['foundation'], x: 70, y: 360, label: 'physics' },
    'attempt-at-the-hard-problem': { t: ['foundation'], x: 185, y: 400, label: 'hard-problem' }
  };

  const H = 'how-networks-forget', CL = 'continual-learning-experiments', SL = 'sleep', VR = 'world-model-adaptation-vs-retention',
    WA = 'world-model-adaptation', FP = 'flow-policy-noise-carry', TR = 'transfer', SO = 'so101-slow-roll',
    PR = 'llm-introspection-probes', WS = 'stress-testing-weight-space-programming', AH = 'auto-sci-harness', HP = 'attempt-at-the-hard-problem';

  // [from, to, finding, dashed]
  const EDGES = [
    [H, VR, '1'], [CL, VR, '1'], [VR, TR, '1'],
    [H, PR, '2'], [PR, WS, '2'], [WA, VR, '2'], [HP, PR, '2'], [HP, H, '2'],
    [H, AH, '3'], [PR, AH, '3'], [WS, AH, '3'], [VR, AH, '3'], [FP, AH, '3'],
    [FP, VR, '4'], [FP, SO, '4'],
    [H, SL, 'next', true], [TR, SO, 'next', true], [PR, SL, 'next', true]
  ];
  const FINDING_NODES = {
    '1': [H, CL, VR, TR],
    '2': [H, WA, VR, PR, WS, HP],
    '3': [H, PR, WS, VR, FP, AH],
    '4': [FP, VR, SO],
    next: [SL, H, PR, VR, TR, SO]
  };

  /* ---------- Map ---------- */
  const svg = document.getElementById('connect-map');
  const mk = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  if (svg) {
    const gEdges = mk('g', { class: 'map__edges' }, svg);
    const gNodes = mk('g', { class: 'map__nodes' }, svg);
    const gLabels = mk('g', { class: 'map__threads' }, svg);

    for (const key in THREADS) {
      const t = THREADS[key];
      const lab = mk('text', { x: t.x, y: t.y, class: 'map__thread', 'text-anchor': 'middle', style: `--hue:${t.hue}` }, gLabels);
      lab.textContent = t.name;
    }

    EDGES.forEach(([a, b, f, dashed]) => {
      const A = NODES[a], B = NODES[b];
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      const dx = B.x - A.x, dy = B.y - A.y;
      const bend = 0.18;
      const cx = mx - dy * bend, cy = my + dx * bend;
      mk('path', {
        d: `M${A.x},${A.y} Q${cx},${cy} ${B.x},${B.y}`,
        class: 'map__edge' + (dashed ? ' is-dashed' : ''),
        'data-finding': f
      }, gEdges);
    });

    for (const id in NODES) {
      const n = NODES[id];
      const hue = THREADS[n.t[0]].hue;
      const g = mk('g', { class: 'map__node', 'data-repo': id, tabindex: '0', role: 'link', 'aria-label': `${id}: jump to the project`, style: `--hue:${hue}` }, gNodes);
      mk('circle', { cx: n.x, cy: n.y, r: 14, class: 'map__halo' }, g);
      mk('circle', { cx: n.x, cy: n.y, r: 5, class: 'map__dot' }, g);
      const right = n.x < 480;
      const text = mk('text', { x: n.x + (right ? 11 : -11), y: n.y + 4, class: 'map__label', 'text-anchor': right ? 'start' : 'end' }, g);
      text.textContent = n.label;
      const go = () => {
        setFilter('all');
        const row = document.getElementById('p-' + id);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          row.classList.add('is-pinged');
          setTimeout(() => row.classList.remove('is-pinged'), 1600);
        }
      };
      g.addEventListener('click', go);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      g.addEventListener('pointerenter', () => highlightRepo(id));
      g.addEventListener('pointerleave', () => highlight(null));
    }
  }

  function highlight(f) {
    if (!svg) return;
    svg.classList.toggle('has-focus', Boolean(f));
    svg.querySelectorAll('.map__edge').forEach((e) => e.classList.toggle('is-on', e.dataset.finding === f));
    const on = new Set(f ? FINDING_NODES[f] : []);
    svg.querySelectorAll('.map__node').forEach((n) => n.classList.toggle('is-on', on.has(n.dataset.repo)));
    document.querySelectorAll('[data-finding]').forEach((c) => {
      if (c.tagName !== 'path') c.classList.toggle('is-on', c.dataset.finding === f);
    });
  }
  function highlightRepo(id) {
    svg.classList.add('has-focus');
    svg.querySelectorAll('.map__edge').forEach((e) => e.classList.remove('is-on'));
    EDGES.forEach(([a, b], i) => {
      if (a === id || b === id) svg.querySelectorAll('.map__edge')[i].classList.add('is-on');
    });
    svg.querySelectorAll('.map__node').forEach((n) => {
      const r = n.dataset.repo;
      n.classList.toggle('is-on', r === id || EDGES.some(([a, b]) => (a === id && b === r) || (b === id && a === r)));
    });
  }

  document.querySelectorAll('.finding, .connect__next').forEach((card) => {
    const f = card.dataset.finding;
    card.addEventListener('pointerenter', () => highlight(f));
    card.addEventListener('pointerleave', () => highlight(null));
    card.addEventListener('focus', () => highlight(f));
    card.addEventListener('blur', () => highlight(null));
  });

  /* ---------- Thread labels and filter on the project list ---------- */
  const list = document.getElementById('projects');
  let filterBar = null;
  function setFilter(key) {
    if (!list) return;
    list.querySelectorAll('.project').forEach((row) => {
      const ts = (row.dataset.threads || '').split(' ');
      row.hidden = !(key === 'all' || ts.includes(key));
    });
    if (filterBar) filterBar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.key === key)));
  }

  function decorate() {
    if (!list) return;
    const rows = list.querySelectorAll('.project');
    if (!rows.length) return false;
    rows.forEach((row) => {
      const a = row.querySelector('.project__link');
      if (!a) return;
      const m = a.href.match(/github\.com\/meta-lucky-builds\/([^/?#]+)|meta-lucky-builds\.github\.io\/([^/?#]+)/);
      const repo = m ? decodeURIComponent(m[1] || m[2]) : '';
      const node = NODES[repo];
      if (!node) return;
      row.id = 'p-' + repo;
      row.dataset.threads = node.t.join(' ');
      const tags = row.querySelector('.project__tags');
      if (tags && !tags.querySelector('.project__thread')) {
        node.t.slice().reverse().forEach((k) => {
          const s = document.createElement('span');
          s.className = 'project__tag project__thread';
          s.style.setProperty('--thue', THREADS[k].hue);
          s.textContent = THREADS[k].name;
          tags.prepend(s);
        });
      }
    });
    filterBar = document.createElement('div');
    filterBar.className = 'threadbar';
    filterBar.setAttribute('role', 'group');
    filterBar.setAttribute('aria-label', 'Show projects by thread');
    const keys = [['all', 'All']].concat(Object.keys(THREADS).map((k) => [k, THREADS[k].name]));
    keys.forEach(([k, name]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.key = k;
      b.textContent = name;
      if (k !== 'all') b.style.setProperty('--thue', THREADS[k].hue);
      b.addEventListener('click', () => setFilter(k));
      filterBar.appendChild(b);
    });
    const head = document.querySelector('.index-head');
    (head || list).before(filterBar);
    setFilter('all');
    return true;
  }
  if (!decorate()) window.addEventListener('load', decorate, { once: true });
})();
