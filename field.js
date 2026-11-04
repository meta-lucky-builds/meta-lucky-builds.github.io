/* field.js: contour lines of a slowly drifting scalar field, drawn on #field. */
(function () {
  'use strict';

  // The API exists from the start; start() swaps in the real handlers if it can draw.
  let setHueImpl = function () {};
  let pulseImpl = function () {};
  window.Field = {
    setHue: function (h) { setHueImpl(h); },
    pulse: function () { pulseImpl(); }
  };

  const MAX_DPR = 1.5;
  const FRAME_MS = 1000 / 30;
  const MAX_NODES = 11000;
  const RESIZE_DEBOUNCE_MS = 160;

  const LEVELS = 10;
  const LEVEL_LOW = -0.45;
  const LEVEL_STEP = 0.1;
  const INDEX_EVERY = 3;

  const BASE = [136, 158, 142]; // muted sage
  const BONE = [232, 226, 212];
  const ALPHA_LINE = 0.12;
  const ALPHA_INDEX = 0.23;

  const DENT_DEPTH = 0.27;
  const RIPPLE_AMP = 0.085;
  const RIPPLE_WIDTH = 64;
  const RIPPLE_REACH = 640;
  const RIPPLE_SECONDS = 1.05;
  const TINT_TAU = 0.2; // seconds; reaches about 95% in 600 ms

  // Octaves of flow noise: gradients rotate in place, and each layer slides slowly.
  const OCTAVES = [
    { scale: 1, amp: 1, angle: 0.3, ox: 11.3, oy: 4.7, vx: 0.011, vy: 0.006, seed: 0 },
    { scale: 0.5, amp: 0.42, angle: 1.4, ox: 37.1, oy: 91.9, vx: -0.012, vy: 0.015, seed: 71 },
    { scale: 0.25, amp: 0.15, angle: 2.5, ox: 5.9, oy: 53.2, vx: 0.017, vy: -0.019, seed: 149 }
  ];

  // Fixed seed, so the composition is the same on every load.
  let seedState = 1337;
  function rand() {
    seedState = (seedState * 1664525 + 1013904223) >>> 0;
    return seedState / 4294967296;
  }

  const PERM = new Uint8Array(512);
  const GRAD_ANGLE = new Float32Array(256);
  const GRAD_SPEED = new Float32Array(256);
  const GX = new Float32Array(256);
  const GY = new Float32Array(256);

  (function seedTables() {
    const order = [];
    for (let i = 0; i < 256; i++) order.push(i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const swap = order[i];
      order[i] = order[j];
      order[j] = swap;
    }
    for (let i = 0; i < 512; i++) PERM[i] = order[i & 255];
    for (let i = 0; i < 256; i++) {
      GRAD_ANGLE[i] = rand() * Math.PI * 2;
      GRAD_SPEED[i] = (rand() < 0.5 ? -1 : 1) * (0.04 + rand() * 0.07);
    }
  })();

  // Start and end edge per marching-squares case. Edges: 0 top, 1 right, 2 bottom, 3 left.
  // Each pair runs the same way round the high side, so segments chain along a row.
  const SEG_START = [-1, 3, 0, 3, 1, -1, 0, 3, 2, 2, -1, 2, 1, 1, 0, -1];
  const SEG_END = [-1, 0, 1, 1, 2, -1, 2, 2, 3, 0, -1, 1, 3, 0, 3, -1];

  function hslToRgb(h, s, l) {
    const a = s * Math.min(l, 1 - l);
    const f = function (n) {
      const k = (n + h / 30) % 12;
      return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
    };
    return [f(0), f(8), f(4)];
  }

  function mix(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  function rgba(c, alpha) {
    return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + alpha.toFixed(3) + ')';
  }

  function start() {
    const canvas = document.getElementById('field');
    if (!canvas || !canvas.getContext) return;
    let ctx = null;
    try { ctx = canvas.getContext('2d'); } catch (e) { ctx = null; }
    if (!ctx) return;

    const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    let reduced = !!(motionQuery && motionQuery.matches);

    // Grid and view
    let width = 0, height = 0, dpr = 1;
    let originX = 0, originY = 0;
    let cell = 18, cols = 0, rows = 0, stride = 0;
    let wavelength = 460, dentSigma = 140;
    let field = new Float32Array(0);
    let cellPenalty = 0; // grows if frames run long

    // Time and loop
    let time = 40; // start part-way in, so the first frame is not a special case
    let raf = 0, lastFrame = 0, workAvg = 0, slowFrames = 0;
    let resizeTimer = 0;

    // Pointer: raw target, then two lerps in a row so the dent starts and stops softly
    let hasPointer = false; // any pointer, including touch; used as the ripple origin
    let pointerX = 0, pointerY = 0;
    let targetX = 0, targetY = 0;
    let midX = 0, midY = 0;
    let dentX = 0, dentY = 0;
    let presence = 0, presenceTarget = 0;

    // Colour
    let tint = BASE.slice();
    let tintTarget = BASE.slice();
    let tintAmount = 0, tintAmountTarget = 0;

    const ripples = [];

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.round(rect.width) || window.innerWidth || 0;
      height = Math.round(rect.height) || window.innerHeight || 0;
      originX = rect.left;
      originY = rect.top;
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      cell = 18 + cellPenalty;
      while ((Math.ceil(width / cell) + 2) * (Math.ceil(height / cell) + 2) > MAX_NODES) cell += 2;
      cols = Math.ceil(width / cell) + 1;
      rows = Math.ceil(height / cell) + 1;
      stride = cols + 1;
      const size = stride * (rows + 1);
      if (field.length !== size) field = new Float32Array(size);

      wavelength = width < 700 ? 300 : 460;
      dentSigma = Math.max(90, Math.min(145, width * 0.13));
    }

    // Fill the grid with noise at the current time.
    function sampleNoise() {
      for (let i = 0; i < 256; i++) {
        const a = GRAD_ANGLE[i] + time * GRAD_SPEED[i];
        GX[i] = Math.cos(a);
        GY[i] = Math.sin(a);
      }
      field.fill(0);

      for (let o = 0; o < OCTAVES.length; o++) {
        const oct = OCTAVES[o];
        const freq = 1 / (wavelength * oct.scale);
        const cs = Math.cos(oct.angle) * freq;
        const sn = Math.sin(oct.angle) * freq;
        const offX = oct.ox + time * oct.vx;
        const offY = oct.oy + time * oct.vy;
        const stepU = cell * cs;
        const stepV = cell * sn;
        const amp = oct.amp;
        const seed = oct.seed;
        let idx = 0;

        for (let j = 0; j <= rows; j++) {
          const y = j * cell;
          let u = offX - y * sn;
          let v = offY + y * cs;
          for (let i = 0; i <= cols; i++, idx++, u += stepU, v += stepV) {
            const xf = Math.floor(u);
            const yf = Math.floor(v);
            const fx = u - xf;
            const fy = v - yf;
            const X = xf & 255;
            const Y = yf & 255;
            const px0 = PERM[X];
            const px1 = PERM[X + 1];
            const g00 = (PERM[px0 + Y] + seed) & 255;
            const g10 = (PERM[px1 + Y] + seed) & 255;
            const g01 = (PERM[px0 + Y + 1] + seed) & 255;
            const g11 = (PERM[px1 + Y + 1] + seed) & 255;
            const n00 = GX[g00] * fx + GY[g00] * fy;
            const n10 = GX[g10] * (fx - 1) + GY[g10] * fy;
            const n01 = GX[g01] * fx + GY[g01] * (fy - 1);
            const n11 = GX[g11] * (fx - 1) + GY[g11] * (fy - 1);
            const sx = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
            const sy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
            const top = n00 + (n10 - n00) * sx;
            const bot = n01 + (n11 - n01) * sx;
            field[idx] += amp * (top + (bot - top) * sy);
          }
        }
      }
    }

    // Press the Gaussian basin into the grid, only where it is visible.
    function applyDent() {
      if (presence < 0.002) return;
      const depth = DENT_DEPTH * presence;
      const reach = dentSigma * 3;
      const inv = 1 / (2 * dentSigma * dentSigma);
      const i0 = Math.max(0, Math.floor((dentX - reach) / cell));
      const i1 = Math.min(cols, Math.ceil((dentX + reach) / cell));
      const j0 = Math.max(0, Math.floor((dentY - reach) / cell));
      const j1 = Math.min(rows, Math.ceil((dentY + reach) / cell));
      for (let j = j0; j <= j1; j++) {
        const dy = j * cell - dentY;
        for (let i = i0; i <= i1; i++) {
          const dx = i * cell - dentX;
          field[j * stride + i] -= depth * Math.exp(-(dx * dx + dy * dy) * inv);
        }
      }
    }

    function applyRipples() {
      const inv = 1 / (2 * RIPPLE_WIDTH * RIPPLE_WIDTH);
      for (let r = 0; r < ripples.length; r++) {
        const rip = ripples[r];
        const age = rip.age / RIPPLE_SECONDS;
        const fall = 1 - age;
        const radius = RIPPLE_REACH * (1 - fall * fall);
        const amp = RIPPLE_AMP * Math.min(age / 0.14, 1) * fall * fall;
        for (let j = 0; j <= rows; j++) {
          const dy = j * cell - rip.y;
          for (let i = 0; i <= cols; i++) {
            const dx = i * cell - rip.x;
            const d = Math.sqrt(dx * dx + dy * dy) - radius;
            field[j * stride + i] += amp * Math.exp(-d * d * inv);
          }
        }
      }
    }

    // Marching squares for one iso level, adding its segments to the current path.
    // Current cell during tracing; kept out here so no closures are allocated per cell.
    let level = 0, x = 0, y = 0;
    let a = 0, b = 0, cc = 0, dd = 0;
    let endX = NaN, endY = NaN;

    // Where the level crosses an edge
    function edgeX(e) {
      if (e === 0) return x + cell * (level - a) / (b - a);
      if (e === 2) return x + cell * (level - dd) / (cc - dd);
      return e === 1 ? x + cell : x;
    }

    function edgeY(e) {
      if (e === 1) return y + cell * (level - b) / (cc - b);
      if (e === 3) return y + cell * (level - a) / (dd - a);
      return e === 2 ? y + cell : y;
    }

    function seg(s, e) {
      const sx = edgeX(s), sy = edgeY(s);
      if (sx !== endX || sy !== endY) ctx.moveTo(sx, sy);
      endX = edgeX(e);
      endY = edgeY(e);
      ctx.lineTo(endX, endY);
    }

    function traceLevel(iso) {
      const f = field;
      level = iso;
      endX = endY = NaN;

      for (let j = 0; j < rows; j++) {
        const row = j * stride;
        y = j * cell;
        for (let i = 0; i < cols; i++) {
          const n = row + i;
          a = f[n];
          b = f[n + 1];
          dd = f[n + stride];
          cc = f[n + stride + 1];
          const code = (a >= iso ? 1 : 0) | (b >= iso ? 2 : 0) | (cc >= iso ? 4 : 0) | (dd >= iso ? 8 : 0);
          if (code === 0 || code === 15) continue;
          x = i * cell;

          if (code === 5) {
            // Saddles: the cell centre decides which corners connect
            if ((a + b + cc + dd) * 0.25 >= iso) { seg(1, 0); seg(3, 2); }
            else { seg(3, 0); seg(1, 2); }
          } else if (code === 10) {
            if ((a + b + cc + dd) * 0.25 >= iso) { seg(0, 3); seg(2, 1); }
            else { seg(0, 1); seg(2, 3); }
          } else {
            seg(SEG_START[code], SEG_END[code]);
          }
        }
      }
    }

    // Stroke style: flat when no pointer is near, a soft radial lift around it otherwise.
    function strokeFor(baseAlpha, lift) {
      const near = presence;
      const farMix = tintAmount * (1 - 0.55 * near);
      const far = mix(BASE, tint, farMix);
      const farAlpha = baseAlpha * (1 + 0.45 * tintAmount);
      if (near < 0.01) return rgba(far, farAlpha);

      // Near the pointer, the tint is at full strength; untinted lines warm slightly to bone.
      const closeBase = mix(mix(BASE, BONE, 0.3 * near), tint, tintAmount * near);
      const closeAlpha = farAlpha + lift * near * (1 + 0.5 * tintAmount);
      const radius = dentSigma * 2.7;
      const g = ctx.createRadialGradient(dentX, dentY, 0, dentX, dentY, radius);
      g.addColorStop(0, rgba(closeBase, closeAlpha));
      g.addColorStop(0.45, rgba(mix(far, closeBase, 0.5), farAlpha + (closeAlpha - farAlpha) * 0.42));
      g.addColorStop(1, rgba(far, farAlpha));
      return g;
    }

    function draw() {
      sampleNoise();
      applyDent();
      applyRipples();

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'round';

      const lineStroke = strokeFor(ALPHA_LINE, 0.15);
      const indexStroke = strokeFor(ALPHA_INDEX, 0.2);
      for (let l = 0; l < LEVELS; l++) {
        const isIndex = l % INDEX_EVERY === 1;
        ctx.beginPath();
        traceLevel(LEVEL_LOW + l * LEVEL_STEP);
        ctx.strokeStyle = isIndex ? indexStroke : lineStroke;
        ctx.lineWidth = isIndex ? 1.1 : 0.9;
        ctx.stroke();
      }
    }

    // Advance everything that moves.
    function step(dt) {
      time += dt;

      const follow = 1 - Math.exp(-dt * 5);
      midX += (targetX - midX) * follow;
      midY += (targetY - midY) * follow;
      dentX += (midX - dentX) * follow;
      dentY += (midY - dentY) * follow;
      presence += (presenceTarget - presence) * (1 - Math.exp(-dt * 2.4));

      const ease = 1 - Math.exp(-dt / TINT_TAU);
      tintAmount += (tintAmountTarget - tintAmount) * ease;
      tint = mix(tint, tintTarget, ease);

      for (let r = ripples.length - 1; r >= 0; r--) {
        ripples[r].age += dt;
        if (ripples[r].age >= RIPPLE_SECONDS) ripples.splice(r, 1);
      }
    }

    // If frames stay expensive, trade grid detail for smoothness.
    function watchCost(ms) {
      workAvg += (ms - workAvg) * 0.08;
      slowFrames = workAvg > 13 ? slowFrames + 1 : 0;
      if (slowFrames > 45 && cellPenalty < 12) {
        cellPenalty += 4;
        slowFrames = 0;
        workAvg = 0;
        resize();
        draw(); // setting the canvas size cleared it
      }
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      const elapsed = now - lastFrame;
      if (elapsed < FRAME_MS - 2) return; // about 30 fps, with slack for timer jitter
      lastFrame = now;
      const began = performance.now();
      step(Math.min(elapsed / 1000, 0.1));
      draw();
      watchCost(performance.now() - began);
    }

    function play() {
      if (raf || reduced || document.hidden) return;
      lastFrame = performance.now() - FRAME_MS;
      raf = requestAnimationFrame(frame);
    }

    function pause() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function clearMotion() {
      ripples.length = 0;
      presence = presenceTarget = 0;
      tintAmount = tintAmountTarget = 0;
    }

    function onPointer(e) {
      pointerX = e.clientX - originX;
      pointerY = e.clientY - originY;
      hasPointer = true;
      if (e.pointerType === 'touch' || reduced) return; // touch only sets the ripple origin
      targetX = pointerX;
      targetY = pointerY;
      if (presence < 0.02) {
        // Arrive in place instead of sliding in from wherever the dent last was
        midX = dentX = targetX;
        midY = dentY = targetY;
      }
      presenceTarget = 1;
    }

    function onLeave() {
      presenceTarget = 0;
    }

    setHueImpl = function (h) {
      if (reduced) return;
      if (typeof h !== 'number' || !isFinite(h)) {
        tintAmountTarget = 0;
        return;
      }
      tintTarget = hslToRgb(((h % 360) + 360) % 360, 0.45, 0.65);
      if (tintAmount < 0.02) tint = tintTarget.slice(); // nothing showing yet, so no need to blend colours
      tintAmountTarget = 1;
    };

    pulseImpl = function () {
      if (reduced || document.hidden) return;
      if (ripples.length >= 3) ripples.shift();
      ripples.push({
        x: hasPointer ? pointerX : width / 2,
        y: hasPointer ? pointerY : height / 2,
        age: 0
      });
    };

    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerdown', onPointer, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    window.addEventListener('blur', onLeave);

    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resize();
        draw(); // setting the canvas size cleared it
      }, RESIZE_DEBOUNCE_MS);
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause();
      else play();
    });

    if (motionQuery) {
      const onMotionChange = function (e) {
        reduced = e.matches;
        if (reduced) {
          pause();
          clearMotion();
          draw();
        } else {
          play();
        }
      };
      if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);
      else if (motionQuery.addListener) motionQuery.addListener(onMotionChange);
    }

    resize();
    draw();
    play();
  }

  function safeStart() {
    try {
      start();
    } catch (e) {
      // The field is decoration; the page must carry on without it.
      setHueImpl = function () {};
      pulseImpl = function () {};
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', safeStart);
  else safeStart();
})();
