/* manifold.js: a breathing surface seen in perspective. The cursor is a mass that
   bends it, particles stream downhill across it, and each essay reshapes it. */
(function () {
  'use strict';

  const canvas = document.getElementById('manifold');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const note = document.getElementById('surface-note');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const MAX_DPR = 1.5;
  const FRAME_MS = 1000 / 40;
  const X0 = -2.8, X1 = 2.8, Z0 = -0.55, Z1 = 4.2;

  // Camera: above the surface, looking down and forward.
  const CAM_Y = 1.25, CAM_Z = -1.1, PITCH = 0.42;
  const SP = Math.sin(PITCH), CP = Math.cos(PITCH);

  // ---------- Shapes: height fields over (x, z), roughly in [-0.7, 0.7] ----------
  const g = (x, z, cx, cz, s) => Math.exp(-((x - cx) * (x - cx) + (z - cz) * (z - cz)) / s);
  const SHAPES = {
    hero: (x, z, t) => 0.32 * g(x, z, -1.1, 2.4, 0.5) + 0.22 * g(x, z, 0.9, 1.8, 0.35) + 0.18 * g(x, z, 0.2, 3.3, 0.6)
      - 0.12 * g(x, z, 0.1, 1.2, 0.25) + 0.05 * Math.sin(x * 2.1 + t * 0.4) * Math.cos(z * 1.7 - t * 0.3),
    peaks: (x, z, t) => 0.55 * g(x, z, -0.9, 2.2, 0.28) + 0.4 * g(x, z, 0.8, 1.6, 0.22) + 0.62 * g(x, z, 0.4, 3.1, 0.35)
      + 0.03 * Math.sin(x * 3 + t * 0.5),
    terrain: (x, z, t) => 0.13 * Math.sin(x * 2.6 + z * 1.4 + t * 0.15) + 0.09 * Math.sin(x * 5.1 - z * 2.3)
      + 0.12 * (z - 1.6) + 0.04 * Math.sin(z * 6 + t * 0.3),
    terrace: (x, z, t) => 0.42 / (1 + Math.exp(-(z - 2.1 - 0.25 * Math.sin(x * 1.3 + t * 0.2)) * 6)) - 0.2
      + 0.03 * Math.sin(x * 4 + t * 0.4),
    funnel: (x, z, t) => -0.55 * g(x, z, 0.3, 2.3, 0.45) + 0.07 * Math.sin(x * 7.3) * Math.sin(z * 6.1 + t * 0.2)
      + 0.05 * Math.sin(x * 11.0 + z * 3.0) + 0.1,
    twin: (x, z, t) => 0.5 * g(x, z, -0.55, 2.3, 0.2) + 0.51 * g(x, z, 0.55, 2.3, 0.2) + 0.02 * Math.sin(t * 0.5 + x),
    fold: (x, z, t) => 0.32 * Math.sin(x * 2.0 + 1.6 * Math.sin(z * 1.5 + t * 0.25)) * Math.cos((z - 2.2) * 0.9),
    well: (x, z, t) => {
      const depth = 0.75 * (0.5 + 0.5 * Math.cos(t * 0.22)); // deep, then flattening, then deep again
      return -depth * g(x, z, 0.2, 2.2, 0.35) + 0.04 * Math.sin(x * 2 + z);
    },
    nested: (x, z, t) => {
      const r = Math.hypot(x - 0.2, (z - 2.3) * 1.15);
      const b = 0.03 * Math.sin(t * 0.4);
      return 0.34 * Math.exp(-((r - 1.35 - b) ** 2) / 0.03) + 0.24 * Math.exp(-((r - 0.62 - b) ** 2) / 0.012)
        + 0.14 * Math.exp(-((r - 0.27) ** 2) / 0.004) + 0.08 * Math.exp(-(r * r) / 0.004) - 0.05;
    }
  };
  const HUES = { hero: 150, peaks: 62, terrain: 120, terrace: 190, funnel: 260, twin: 30, fold: 300, well: 345, nested: 210 };
  const NAMES = Object.keys(SHAPES);
  const weight = {}; NAMES.forEach(n => { weight[n] = n === 'hero' ? 1 : 0; });
  let target = 'hero';
  let hue = HUES.hero;

  // ---------- Sizing ----------
  let W = 0, H = 0, dpr = 1, focal = 1, cx = 0, cy = 0, NX = 64, NZ = 40, NP = 260;
  let gx, gz, sx, sy, sd;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    focal = Math.max(W, H * 1.2) * 0.62;
    cx = W * 0.5; cy = H * 0.34;
    const small = W < 700;
    NX = small ? 40 : 64; NZ = small ? 26 : 40; NP = small ? 120 : 260;
    gx = new Float32Array(NX * NZ); gz = new Float32Array(NX * NZ);
    sx = new Float32Array(NX * NZ); sy = new Float32Array(NX * NZ); sd = new Float32Array(NX * NZ);
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
      const k = j * NX + i;
      gx[k] = X0 + (X1 - X0) * i / (NX - 1);
      gz[k] = Z0 + (Z1 - Z0) * j / (NZ - 1);
    }
    seedParticles();
  }

  // ---------- Projection ----------
  let outX = 0, outY = 0, outD = 1;
  function project(x, y, z) {
    const Y = y - CAM_Y, Z = z - CAM_Z;
    const depth = -Y * SP + Z * CP;
    const vert = Y * CP + Z * SP;
    outD = depth;
    outX = cx + x * focal / depth;
    outY = cy - vert * focal / depth;
  }

  // ---------- Cursor mass (screen space, smoothed) ----------
  let mx = -1e4, my = -1e4, tmx = -1e4, tmy = -1e4, mass = 0, tmass = 0;
  window.addEventListener('pointermove', e => { tmx = e.clientX; tmy = e.clientY; tmass = 1; }, { passive: true });
  document.addEventListener('pointerleave', () => { tmass = 0; });
  window.addEventListener('blur', () => { tmass = 0; });

  function base(x, z, t) {
    let h = 0;
    for (let n = 0; n < NAMES.length; n++) {
      const w = weight[NAMES[n]];
      if (w > 0.003) h += w * SHAPES[NAMES[n]](x, z, t);
    }
    return h * 1.45;
  }
  function height(x, z, t) {
    let h = base(x, z, t);
    if (mass > 0.01) {
      project(x, h, z);
      const R = Math.min(W, H) * 0.24;
      const dx = outX - mx, dy = outY - my;
      h -= 0.6 * mass * Math.exp(-(dx * dx + dy * dy) / (R * R));
    }
    return h;
  }

  // ---------- Flux particles ----------
  let px, pz, ppx, ppy, age, life;
  function spawn(k) {
    px[k] = X0 + Math.random() * (X1 - X0);
    pz[k] = Z0 + Math.random() * (Z1 - Z0);
    age[k] = 0; life[k] = 4 + Math.random() * 6; ppx[k] = NaN;
  }
  function seedParticles() {
    px = new Float32Array(NP); pz = new Float32Array(NP); ppx = new Float32Array(NP); ppy = new Float32Array(NP);
    age = new Float32Array(NP); life = new Float32Array(NP);
    for (let k = 0; k < NP; k++) { spawn(k); age[k] = Math.random() * life[k]; }
  }

  // ---------- Scroll: which essay is in view ----------
  const essays = Array.from(document.querySelectorAll('[data-shape]'));
  let dim = 1;
  function onScroll() {
    let active = null;
    const line = H * 0.55;
    for (const el of essays) {
      const r = el.getBoundingClientRect();
      if (r.top < line && r.bottom > H * 0.2) active = el;
    }
    const next = active ? active.dataset.shape : 'hero';
    if (next !== target) {
      target = next;
      if (note) {
        note.style.opacity = '0';
        setTimeout(() => { note.textContent = active ? 'surface: ' + active.dataset.note : ''; note.style.opacity = '1'; }, 300);
      }
    }
    dim = window.scrollY < H * 0.5 ? 1 : 0.62;
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---------- Draw ----------
  let last = 0, t0 = performance.now(), alphaNow = 1;
  function frame(now) {
    if (!reduce) requestAnimationFrame(frame);
    if (!reduce && now - last < FRAME_MS) return;
    const dt = Math.min(0.1, (now - (last || now)) / 1000);
    last = now;
    const t = (now - t0) / 1000;

    // ease weights, hue, cursor, dimming
    const k = reduce ? 1 : 1 - Math.exp(-dt / 0.9);
    for (const n of NAMES) weight[n] += ((n === target ? 1 : 0) - weight[n]) * k;
    let dh = HUES[target] - hue; if (dh > 180) dh -= 360; if (dh < -180) dh += 360;
    hue = (hue + dh * k + 360) % 360;
    const km = 1 - Math.exp(-dt / 0.12);
    mx += (tmx - mx) * (mx < -1e3 ? 1 : km); my += (tmy - my) * (my < -1e3 ? 1 : km);
    mass += (tmass - mass) * (1 - Math.exp(-dt / 0.35));
    alphaNow += (dim - alphaNow) * (1 - Math.exp(-dt / 0.5));

    ctx.clearRect(0, 0, W, H);

    // project the grid
    for (let i = 0; i < NX * NZ; i++) {
      const y = height(gx[i], gz[i], t);
      project(gx[i], y, gz[i]);
      sx[i] = outX; sy[i] = outY; sd[i] = outD;
    }

    // grid lines, far rows first, fading with depth
    const line = `hsla(${hue.toFixed(0)}, 48%, 70%,`;
    ctx.lineWidth = 1;
    for (let j = NZ - 1; j >= 0; j--) {
      const fade = 1 - j / (NZ - 1);
      ctx.strokeStyle = line + (alphaNow * (0.035 + 0.2 * fade * fade)).toFixed(3) + ')';
      ctx.beginPath();
      for (let i = 0; i < NX; i++) {
        const q = j * NX + i;
        if (i === 0) ctx.moveTo(sx[q], sy[q]); else ctx.lineTo(sx[q], sy[q]);
      }
      ctx.stroke();
    }
    for (let i = 0; i < NX; i += 2) {
      ctx.beginPath();
      for (let j = 0; j < NZ; j++) {
        const q = j * NX + i;
        if (j === 0) ctx.moveTo(sx[q], sy[q]); else ctx.lineTo(sx[q], sy[q]);
      }
      ctx.strokeStyle = line + (alphaNow * 0.07).toFixed(3) + ')';
      ctx.stroke();
    }

    // flux: particles move downhill with a little swirl, drawn as short streaks
    const e = 0.03;
    ctx.lineCap = 'round';
    for (let p = 0; p < NP; p++) {
      const x = px[p], z = pz[p];
      const hx = (height(x + e, z, t) - height(x - e, z, t)) / (2 * e);
      const hz = (height(x, z + e, t) - height(x, z - e, t)) / (2 * e);
      const sp = reduce ? 0 : 0.3, sw = reduce ? 0 : 0.75;
      px[p] = x + (-hx * sp - hz * sw) * dt * 1.6 + 0.02 * dt;
      pz[p] = z + (-hz * sp + hx * sw) * dt * 1.6;
      age[p] += dt;
      if (px[p] < X0 || px[p] > X1 || pz[p] < Z0 || pz[p] > Z1 || age[p] > life[p]) { spawn(p); continue; }
      const y = height(px[p], pz[p], t);
      project(px[p], y, pz[p]);
      const fx = outX, fy = outY;
      const near = 1 - (pz[p] - Z0) / (Z1 - Z0);
      const life01 = Math.sin(Math.PI * age[p] / life[p]);
      if (!Number.isNaN(ppx[p])) {
        let vx = fx - ppx[p], vy = fy - ppy[p];
        const len = Math.hypot(vx, vy), cap = 2 + 5 * near;
        if (len > cap) { vx *= cap / len; vy *= cap / len; }
        ctx.strokeStyle = `hsla(${hue.toFixed(0)}, 60%, 84%, ${(alphaNow * life01 * (0.15 + 0.55 * near)).toFixed(3)})`;
        ctx.lineWidth = 0.6 + 1.4 * near;
        ctx.beginPath();
        ctx.moveTo(fx - vx * 2.2, fy - vy * 2.2);
        ctx.lineTo(fx, fy);
        ctx.stroke();
      }
      ppx[p] = fx; ppy[p] = fy;
    }
  }

  let resizeTimer = 0;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { resize(); if (reduce) frame(performance.now()); }, 160); });
  document.addEventListener('visibilitychange', () => { last = 0; });

  resize();
  onScroll();
  if (reduce) {
    // one still frame per shape change
    frame(performance.now());
    window.addEventListener('scroll', () => requestAnimationFrame(() => frame(performance.now())), { passive: true });
  } else {
    requestAnimationFrame(frame);
  }
})();
