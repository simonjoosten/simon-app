// Huisdier 2.0 - spelletjesmodule. Zelfstandige ES-module, geen imports.
// Contract: GAMES[i].create(host, api) -> { destroy() }; api = { w, h, score(n), end(n) }.
// Alle scores zijn hele getallen 0-100 (zie scaleScore).

export function scaleScore(raw, max) {
  const r = Number(raw), m = Number(max);
  if (!isFinite(r) || !isFinite(m) || m <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((r / m) * 100)));
}

const FONT = 'system-ui,-apple-system,"Segoe UI","Apple Color Emoji","Noto Color Emoji",sans-serif';
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// Gedeelde bouwstenen: opruimen, timers, lus, geluid, eindscherm.
function kit(host, api, bg) {
  const W = api.w || host.clientWidth || 360;
  const H = api.h || host.clientHeight || 480;
  const removers = [];
  const timers = new Set();
  let dead = false, ended = false, raf = 0, loopFn = null, last = 0, actx = null;
  host.style.touchAction = 'none';
  host.style.userSelect = 'none';
  host.style.background = bg;
  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;overflow:hidden;font-family:' + FONT + ';color:#5a4a6a;-webkit-user-select:none;user-select:none';
  host.appendChild(root);

  const k = {
    W, H, root,
    get over() { return ended || dead; },
    mk(parent, css, text) {
      const d = document.createElement('div');
      d.style.cssText = css || '';
      if (text != null) d.textContent = text;
      (parent || root).appendChild(d);
      return d;
    },
    on(target, type, fn, opts) {
      target.addEventListener(type, fn, opts);
      removers.push(() => { try { target.removeEventListener(type, fn, opts); } catch (e) {} });
    },
    pos(e) {
      let r = null;
      try { r = root.getBoundingClientRect(); } catch (err) {}
      if (!r || !r.width) r = { left: 0, top: 0, width: W, height: H };
      return { x: ((e.clientX || 0) - r.left) * (W / r.width), y: ((e.clientY || 0) - r.top) * (H / r.height) };
    },
    timeout(fn, ms) {
      const id = setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms);
      timers.add(id);
      return id;
    },
    clear(id) { clearTimeout(id); timers.delete(id); },
    loop(fn) {
      loopFn = fn; last = 0;
      const tick = (ts) => {
        if (dead) return;
        raf = requestAnimationFrame(tick);
        if (!last) last = ts;
        const dt = Math.min(0.05, Math.max(0, (ts - last) / 1000));
        last = ts;
        if (loopFn) loopFn(dt);
      };
      raf = requestAnimationFrame(tick);
    },
    canvas() {
      const dpr = Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, 2);
      const cv = document.createElement('canvas');
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
      root.appendChild(cv);
      const ctx = cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return ctx;
    },
    hud(css) {
      return k.mk(root, 'position:absolute;left:0;right:0;top:8px;text-align:center;font-weight:700;font-size:15px;color:#7a5f8f;pointer-events:none;z-index:5;' + (css || ''));
    },
    beep(freq, dur, type, vol, delay) {
      try {
        if (dead) return;
        if (!actx) {
          const AC = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
          if (!AC) return;
          actx = new AC();
        }
        if (actx.state === 'suspended' && actx.resume) actx.resume();
        const t0 = actx.currentTime + (delay || 0);
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type || 'sine';
        o.frequency.value = freq;
        const d = dur || 0.15, v = vol == null ? 0.07 : vol;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(v, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
        o.connect(g); g.connect(actx.destination);
        o.start(t0); o.stop(t0 + d + 0.05);
      } catch (e) {}
    },
    pling() { k.beep(660, 0.12, 'sine', 0.06); k.beep(880, 0.16, 'sine', 0.05, 0.08); },
    soft() { k.beep(220, 0.18, 'triangle', 0.05); },
    petHtml(size, mood) {
      try { if (api.pet && api.pet.html) return api.pet.html(size, mood); } catch (e) {}
      return '<span style="font-size:' + Math.round(size * 0.8) + 'px;line-height:1;display:inline-block">\u{1F43E}</span>';
    },
    pet(parent, css, size, mood) {
      const el = k.mk(parent, css);
      el._s = size; el._m = null; el._base = mood;
      k.mood(el, mood);
      return el;
    },
    mood(el, m, ms) {
      if (el._m !== m) { el._m = m; try { el.innerHTML = k.petHtml(el._s, m); } catch (e) {} }
      if (ms) {
        if (el._rt) k.clear(el._rt);
        el._rt = k.timeout(() => { k.mood(el, el._base); }, ms);
      }
    },
    live(raw, max) { try { api.score(scaleScore(raw, max)); } catch (e) {} },
    finish(raw, max, line) {
      if (ended || dead) return;
      ended = true;
      const s = scaleScore(raw, max);
      try { api.score(s); } catch (e) {}
      const ov = k.mk(root, 'position:absolute;left:0;top:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,248,252,0.82);z-index:20;text-align:center');
      k.mk(ov, 'font-size:56px', '\u{1F31F}');
      k.mk(ov, 'font-size:28px;font-weight:800;color:#8a63b5;margin-top:6px', 'Goed gedaan!');
      k.mk(ov, 'font-size:16px;margin-top:8px;color:#7a5f8f;padding:0 24px', line || 'Wat was dat gezellig!');
      k.mk(ov, 'font-size:20px;font-weight:700;margin-top:10px;color:#e0719a', 'Score: ' + s);
      k.timeout(() => { try { api.end(s, { fun: Math.min(100, Math.round(30 + s * 0.7)) }); } catch (e) {} }, 1800);
    },
    destroy() {
      if (dead) return;
      dead = true;
      if (raf) { try { cancelAnimationFrame(raf); } catch (e) {} }
      timers.forEach((id) => clearTimeout(id));
      timers.clear();
      removers.forEach((f) => f());
      removers.length = 0;
      loopFn = null;
      if (actx) { try { actx.close(); } catch (e) {} actx = null; }
      try { if (root.parentNode) root.parentNode.removeChild(root); } catch (e) {}
    },
  };
  return k;
}

function emo(ctx, ch, x, y, size, alpha) {
  ctx.save();
  if (alpha != null) ctx.globalAlpha = alpha;
  ctx.font = size + 'px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ch, x, y);
  ctx.restore();
}
function floatText(ctx, f) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - f.t / 0.9);
  ctx.font = '700 18px ' + FONT;
  ctx.textAlign = 'center';
  ctx.fillStyle = f.c || '#e0719a';
  ctx.fillText(f.s, f.x, f.y - f.t * 40);
  ctx.restore();
}
function stepFloats(list, dt) {
  for (let i = list.length - 1; i >= 0; i--) {
    list[i].t += dt;
    if (list[i].t > 0.9) list.splice(i, 1);
  }
}

// ---------------------------------------------------------------- 1. Vang de bal
function createVangbal(host, api) {
  const k = kit(host, api, 'linear-gradient(#cfeaff,#fff1f7)');
  const { W, H } = k;
  const ctx = k.canvas();
  const hud = k.hud();
  const pet = k.pet(k.root, 'position:absolute;left:0;top:' + (H - 120) + 'px;pointer-events:none;z-index:3;will-change:transform', 70, 'blij');
  const DUR = 45, MAXRAW = 55;
  let t = 0, score = 0, spawn = 0.6, bx = W / 2, tx = W / 2;
  const balls = [], floats = [];
  const normals = ['⚽', '\u{1F3C0}', '\u{1F3BE}', '\u{1F534}', '\u{1F7E3}'];
  const move = (e) => { tx = k.pos(e).x; };
  k.on(host, 'pointerdown', move);
  k.on(host, 'pointermove', move);

  k.loop((dt) => {
    if (k.over) return;
    t += dt;
    bx += (tx - bx) * Math.min(1, dt * 14);
    bx = Math.max(35, Math.min(W - 35, bx));
    spawn -= dt;
    if (spawn <= 0 && t < DUR - 1.5) {
      spawn = Math.max(0.42, 1.1 - (t / DUR) * 0.7) * rnd(0.8, 1.2);
      const gold = t > 4 && Math.random() < 0.13;
      const dive = !gold && t > 10 && Math.random() < 0.25;
      balls.push({
        x: rnd(30, W - 30), y: dive ? H * 0.28 : -20, r: gold ? 20 : 17,
        vy: (110 + t * 3.4) * (dive ? 1.25 : 1) * rnd(0.9, 1.1),
        gold, dive, grow: dive ? 0 : 1, e: gold ? '\u{1F31F}' : pick(normals),
        wob: rnd(0, 6), wa: t > 18 && Math.random() < 0.3 ? 28 : 0,
      });
    }
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      b.y += b.vy * dt; b.wob += dt * 4;
      if (b.grow < 1) b.grow = Math.min(1, b.grow + dt * 3);
      const x = b.x + Math.sin(b.wob) * b.wa;
      if (b.y > H - 78 && b.y < H - 42 && Math.abs(x - bx) < 34 + b.r * 0.4) {
        const pts = b.gold ? 5 : 1;
        score += pts;
        floats.push({ x, y: H - 90, t: 0, s: '+' + pts, c: b.gold ? '#e8a900' : '#e0719a' });
        k.mood(pet, b.gold ? 'liefde' : 'blijblij', 600);
        if (b.gold) k.pling(); else k.beep(600 + Math.random() * 200, 0.08, 'sine', 0.05);
        k.live(score, MAXRAW);
        balls.splice(i, 1);
      } else if (b.y > H + 30) { balls.splice(i, 1); k.mood(pet, 'neutraal', 500); }
    }
    stepFloats(floats, dt);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#c8f0cf';
    ctx.fillRect(0, H - 34, W, 34);
    emo(ctx, '☁️', ((t * 12) % (W + 100)) - 50, 70, 54, 0.8);
    for (const b of balls) {
      const x = b.x + Math.sin(b.wob) * b.wa;
      if (b.gold) {
        ctx.fillStyle = 'rgba(255,225,120,0.45)';
        ctx.beginPath(); ctx.arc(x, b.y, 26, 0, 7); ctx.fill();
      }
      emo(ctx, b.e, x, b.y, b.r * 2 * b.grow + 2);
    }
    emo(ctx, '\u{1F9FA}', bx, H - 40, 52);
    pet.style.transform = 'translate(' + Math.round(bx - 35) + 'px,0)';
    for (const f of floats) floatText(ctx, f);
    const left = Math.max(0, Math.ceil(DUR - t));
    hud.textContent = '⏱ ' + left + 's   ⭐ ' + score;
    if (t >= DUR) k.finish(score, MAXRAW, 'Wat een mooie vangst!');
  });
  return { destroy: k.destroy };
}

// ---------------------------------------------------------------- 2. Memory
function createMemory(host, api) {
  const k = kit(host, api, 'linear-gradient(#fff3d6,#ffe3ee)');
  const { W, H } = k;
  const hud = k.hud();
  const ANIMALS = ['\u{1F436}', '\u{1F431}', '\u{1F430}', '\u{1F43B}', '\u{1F43C}', '\u{1F438}', '\u{1F435}', '\u{1F437}', '\u{1F98A}', '\u{1F42F}', '\u{1F42E}', '\u{1F425}'];
  const ROUNDS = 3, PEEK = [2400, 1700, 1100], MAXRAW = 26;
  const msg = k.mk(k.root, 'position:absolute;left:84px;right:8px;bottom:24px;text-align:left;font-size:17px;font-weight:700;color:#8a63b5;pointer-events:none');
  const pet = k.pet(k.root, 'position:absolute;left:10px;bottom:6px;pointer-events:none', 64, 'neutraal');
  const gridW = W - 28, gridH = H - 150;
  const grid = k.mk(k.root, 'position:absolute;left:14px;top:44px;width:' + gridW + 'px;height:' + gridH + 'px;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,1fr);gap:8px');
  let round = 0, raw = 0, mistakes = 0, found = 0, lock = true, first = null;
  let cards = [];

  function show(c, up) {
    c.up = up;
    c.el.textContent = up ? c.e : '❓';
    c.el.style.background = c.done ? '#d7f5dc' : (up ? '#ffffff' : '#f3d9ff');
    c.el.style.transform = up ? 'scale(1.04)' : 'scale(1)';
  }
  function setup() {
    grid.innerHTML = '';
    grid.textContent = '';
    const picks = shuffle(ANIMALS).slice(0, 6);
    const deck = shuffle(picks.concat(picks));
    cards = deck.map((e, i) => {
      const el = k.mk(grid, 'display:flex;align-items:center;justify-content:center;font-size:38px;border-radius:16px;box-shadow:0 3px 0 rgba(160,120,190,0.25);transition:transform .15s,background .15s;cursor:pointer');
      const c = { e, el, done: false, up: false, i };
      k.on(el, 'pointerdown', (ev) => { if (ev.preventDefault) ev.preventDefault(); tap(c); });
      show(c, true);
      return c;
    });
    mistakes = 0; found = 0; first = null; lock = true;
    msg.textContent = 'Kijk goed naar de dieren!';
    pet._base = 'neutraal'; k.mood(pet, 'neutraal');
    hud.textContent = 'Ronde ' + (round + 1) + ' / ' + ROUNDS + '   ⭐ ' + raw;
    k.timeout(() => {
      cards.forEach((c) => show(c, false));
      msg.textContent = 'Zoek de paartjes!';
      lock = false;
    }, PEEK[round]);
  }
  function tap(c) {
    if (lock || c.done || c.up || k.over) return;
    show(c, true);
    k.beep(500 + c.i * 20, 0.08, 'sine', 0.05);
    if (!first) { first = c; return; }
    const a = first; first = null;
    if (a.e === c.e) {
      a.done = c.done = true;
      show(a, true); show(c, true);
      found++; raw += 1;
      k.mood(pet, 'blijblij', 900);
      k.pling();
      k.live(raw, MAXRAW);
      hud.textContent = 'Ronde ' + (round + 1) + ' / ' + ROUNDS + '   ⭐ ' + raw;
      if (found === 6) {
        const bonus = Math.max(1, 5 - mistakes);
        raw += bonus; k.live(raw, MAXRAW);
        msg.textContent = 'Mooi gedaan! +' + bonus + ' \u{1F389}';
        pet._base = 'liefde'; k.mood(pet, 'liefde');
        lock = true;
        k.timeout(() => {
          round++;
          if (round >= ROUNDS) k.finish(raw, MAXRAW, 'Wat een goed geheugen!');
          else setup();
        }, 1100);
      }
    } else {
      mistakes++;
      lock = true;
      k.mood(pet, 'verdrietig', 800);
      k.soft();
      k.timeout(() => { show(a, false); show(c, false); lock = false; }, 700);
    }
  }
  setup();
  k.timeout(() => {
    lock = true;
    k.finish(raw, MAXRAW, 'De tijd is om, maar wat deed je het fijn!');
  }, 60000);
  return { destroy: k.destroy };
}

// ---------------------------------------------------------------- 3. Bubbels knallen
function createBubbels(host, api) {
  const k = kit(host, api, 'linear-gradient(#d9f3ff,#f1e4ff)');
  const { W, H } = k;
  const ctx = k.canvas();
  const hud = k.hud();
  const pet = k.pet(k.root, 'position:absolute;left:0;top:0;pointer-events:none;z-index:3;will-change:transform', 56, 'blij');
  let petX = W / 2, petY = H - 100, ptx = W / 2, pty = H - 100, petBack = 0;
  const DUR = 50, MAXRAW = 60;
  let t = 0, score = 0, wave = 0, idle = 0, gap = 0, shake = 0, note = '', noteT = 0;
  let bubbles = [];
  const floats = [], parts = [];

  function newWave() {
    const n = Math.min(6, 3 + Math.floor(wave / 2));
    const spikes = wave >= 2 ? (wave >= 5 ? 2 : 1) : 0;
    const slots = shuffle(Array.from({ length: n + spikes }, (_, i) => i));
    const list = [];
    for (let i = 0; i < n + spikes; i++) {
      const spiky = i >= n;
      const r = spiky ? 30 : 16 + (i * 30) / Math.max(1, n - 1);
      const sw = (W - 70) / (n + spikes);
      list.push({
        x: 35 + sw * (slots[i] + 0.5) + rnd(-6, 6), y: rnd(H * 0.3, H * 0.85), r, spiky,
        vy: -(26 + wave * 3 + rnd(0, 10)), ph: rnd(0, 6), a: 0, sh: 0,
      });
    }
    bubbles = list; wave++; idle = 0;
  }
  function target() {
    let best = null;
    for (const b of bubbles) if (!b.spiky && (!best || b.r < best.r)) best = b;
    return best;
  }
  function say(s) { note = s; noteT = 1.6; }
  function burst(b) {
    for (let i = 0; i < 8; i++) parts.push({ x: b.x, y: b.y, vx: rnd(-90, 90), vy: rnd(-90, 90), t: 0 });
  }
  k.on(host, 'pointerdown', (e) => {
    if (k.over || gap > 0) return;
    const p = k.pos(e);
    let hit = null, hd = 1e9;
    for (const b of bubbles) {
      const d = Math.hypot(p.x - b.x, p.y - b.y);
      if (d <= b.r + 10 && d < hd) { hit = b; hd = d; }
    }
    if (!hit) return;
    idle = 0;
    if (hit.spiky) {
      hit.sh = 0.5; score = Math.max(0, score - 1); k.soft(); k.mood(pet, 'vies', 900); ptx = hit.x; pty = H - 100; petBack = 0.3; say('Au, stekelig! \u{1F994}');
      k.live(score, MAXRAW);
      return;
    }
    if (hit === target()) {
      bubbles.splice(bubbles.indexOf(hit), 1);
      burst(hit); score++; ptx = hit.x; pty = Math.min(H - 100, hit.y + 30); petBack = 0.5; k.mood(pet, 'blijblij', 700);
      floats.push({ x: hit.x, y: hit.y, t: 0, s: '+1' });
      k.beep(500 + (20 - hit.r) * -8 + 200, 0.1, 'sine', 0.06);
      if (!target()) {
        score += 2; bubbles = []; gap = 0.8;
        floats.push({ x: W / 2, y: H / 2, t: 0, s: 'Super! +2', c: '#8a63b5' });
        k.pling(); k.mood(pet, 'liefde', 1200);
      }
      k.live(score, MAXRAW);
    } else {
      hit.sh = 0.5; k.soft(); k.mood(pet, 'neutraal', 700); say('Eerst de kleinste! \u{1F4A1}');
    }
  });

  newWave();
  k.loop((dt) => {
    if (k.over) return;
    t += dt; idle += dt; noteT -= dt;
    if (gap > 0) { gap -= dt; if (gap <= 0 && t < DUR) newWave(); }
    for (const b of bubbles) {
      b.y += b.vy * dt; b.ph += dt * 2; b.a = Math.min(1, b.a + dt * 2); b.sh = Math.max(0, b.sh - dt);
      if (b.y < -b.r) b.y = H + b.r;
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.t > 0.5) parts.splice(i, 1);
    }
    stepFloats(floats, dt);

    ctx.clearRect(0, 0, W, H);
    const tg = target();
    for (const b of bubbles) {
      const x = b.x + Math.sin(b.ph) * 8 + (b.sh > 0 ? Math.sin(b.sh * 60) * 5 : 0);
      ctx.save();
      ctx.globalAlpha = b.a;
      if (b.spiky) {
        ctx.fillStyle = '#ffc2d4'; ctx.strokeStyle = '#f08aa8'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 16; i++) {
          const ang = (i / 16) * Math.PI * 2, rr = i % 2 ? b.r * 0.82 : b.r * 1.12;
          ctx.lineTo(x + Math.cos(ang) * rr, b.y + Math.sin(ang) * rr);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        emo(ctx, '\u{1F994}', x, b.y, b.r * 1.2);
      } else {
        const g = ctx.createRadialGradient(x - b.r * 0.3, b.y - b.r * 0.3, 2, x, b.y, b.r);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(1, 'rgba(170,215,255,0.65)');
        ctx.fillStyle = g; ctx.strokeStyle = 'rgba(140,190,240,0.9)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (b === tg && idle > 4) {
          ctx.strokeStyle = 'rgba(255,170,200,' + (0.5 + 0.5 * Math.sin(t * 6)) + ')'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(x, b.y, b.r + 6, 0, Math.PI * 2); ctx.stroke();
        }
      }
      ctx.restore();
    }
    petBack -= dt; if (petBack <= 0) { pty = H - 100; }
    petX += (ptx - petX) * Math.min(1, dt * 12); petY += (pty - petY) * Math.min(1, dt * 12);
    pet.style.transform = 'translate(' + Math.round(petX - 28) + 'px,' + Math.round(petY - 28) + 'px)';
    for (const p of parts) emo(ctx, '✨', p.x, p.y, 14, 1 - p.t * 2);
    for (const f of floats) floatText(ctx, f);
    if (noteT > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, noteT);
      ctx.fillStyle = '#8a63b5'; ctx.font = '700 17px ' + FONT; ctx.textAlign = 'center';
      ctx.fillText(note, W / 2, H - 20); ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(122,95,143,0.8)'; ctx.font = '600 14px ' + FONT; ctx.textAlign = 'center';
      ctx.fillText('Knal van klein naar groot. Mijd de stekelige!', W / 2, H - 20);
    }
    hud.textContent = '⏱ ' + Math.max(0, Math.ceil(DUR - t)) + 's   ⭐ ' + score;
    if (t >= DUR) k.finish(score, MAXRAW, 'Wat een mooie bellenknaller!');
  });
  return { destroy: k.destroy };
}

// ---------------------------------------------------------------- 4. Ren-spel
function createRennen(host, api) {
  const k = kit(host, api, 'linear-gradient(#d4efff,#fff0f6 70%)');
  const { W, H } = k;
  const ctx = k.canvas();
  const hud = k.hud();
  const DUR = 45, MAXRAW = 45;
  const gy = Math.round(H * 0.74), px = 78;
  const pet = k.pet(k.root, 'position:absolute;left:0;top:0;pointer-events:none;z-index:3;will-change:transform', 60, 'blij');
  let heartT = 0;
  let t = 0, py = 0, pv = 0, onG = true, stumble = 0, hearts = 0, clean = 0, nextObs = 260;
  const obs = [], hs = [], floats = [];

  function jump() {
    if (k.over) return;
    if (onG && stumble < 0.35) { pv = -560; onG = false; k.beep(520, 0.1, 'sine', 0.05); }
  }
  k.on(host, 'pointerdown', jump);

  k.loop((dt) => {
    if (k.over) return;
    t += dt; heartT -= dt;
    const speed = (150 + t * 3.2) * (stumble > 0 ? 0.6 : 1);
    stumble = Math.max(0, stumble - dt);
    if (!onG) {
      pv += 1500 * dt; py += pv * dt;
      if (py >= 0) { py = 0; pv = 0; onG = true; }
    }
    nextObs -= speed * dt;
    if (nextObs <= 0 && t < DUR - 2) {
      const flower = Math.random() < 0.5;
      const ox = W + 40;
      obs.push({ x: ox, flower, done: false });
      if (Math.random() < 0.7) {
        const high = Math.random() < 0.5;
        const hx = ox + 120;
        for (let i = 0; i < 3; i++) hs.push({ x: hx + i * 34, y: high ? gy - 105 + Math.abs(i - 1) * 14 : gy - 28 });
      }
      nextObs = 240 + rnd(0, 140) + speed * 0.4;
    }
    for (let i = obs.length - 1; i >= 0; i--) {
      const o = obs[i]; o.x -= speed * dt;
      if (!o.done && Math.abs(o.x - px) < 28 && py > -24) {
        o.done = true; stumble = 0.8; k.soft();
        floats.push({ x: px, y: gy - 60, t: 0, s: 'Oeps!', c: '#8a63b5' });
      } else if (!o.done && o.x < px - 30) {
        o.done = true; clean++;
        floats.push({ x: px, y: gy - 60 + py, t: 0, s: '+1' });
        k.live(hearts + clean, MAXRAW);
      }
      if (o.x < -50) obs.splice(i, 1);
    }
    for (let i = hs.length - 1; i >= 0; i--) {
      const h = hs[i]; h.x -= speed * dt;
      if (Math.hypot(h.x - px, h.y - (gy + py - 22)) < 30) {
        hearts++; hs.splice(i, 1); k.pling(); heartT = 0.6;
        floats.push({ x: px, y: gy - 70 + py, t: 0, s: '+1' });
        k.live(hearts + clean, MAXRAW);
      } else if (h.x < -30) hs.splice(i, 1);
    }
    stepFloats(floats, dt);

    ctx.clearRect(0, 0, W, H);
    emo(ctx, '☁️', W - ((t * 20) % (W + 120)), 80, 56, 0.85);
    emo(ctx, '☁️', W - (((t * 12) + 200) % (W + 120)), 140, 40, 0.7);
    ctx.fillStyle = '#c9f0c8'; ctx.fillRect(0, gy, W, H - gy);
    ctx.fillStyle = '#b3e5b4';
    const off = (t * speed) % 60;
    for (let x = -off; x < W; x += 60) ctx.fillRect(x, gy + 22, 28, 5);
    for (const o of obs) {
      if (o.flower) emo(ctx, '\u{1FAB4}', o.x, gy - 14, 40);
      else {
        ctx.fillStyle = 'rgba(130,190,240,0.85)';
        ctx.beginPath(); ctx.ellipse(o.x, gy + 5, 28, 9, 0, 0, Math.PI * 2); ctx.fill();
        emo(ctx, '\u{1F4A7}', o.x, gy - 6, 24);
      }
    }
    for (const h of hs) emo(ctx, '\u{1F496}', h.x, h.y, 28);
    const bob = onG ? Math.sin(t * 16) * 2 : 0;
    const blink = stumble > 0 && Math.floor(t * 12) % 2 === 0 ? 0.4 : 1;
    ctx.fillStyle = 'rgba(120,100,140,0.15)';
    ctx.beginPath(); ctx.ellipse(px, gy + 3, 22 - Math.min(10, -py / 8), 6, 0, 0, Math.PI * 2); ctx.fill();
    k.mood(pet, stumble > 0 ? 'verdrietig' : (heartT > 0 ? 'liefde' : (onG ? 'blij' : 'blijblij')));
    pet.style.opacity = String(blink);
    pet.style.transform = 'translate(' + (px - 30) + 'px,' + Math.round(gy + py - 54 + bob) + 'px)';
    for (const f of floats) floatText(ctx, f);
    ctx.fillStyle = 'rgba(122,95,143,0.8)'; ctx.font = '600 14px ' + FONT; ctx.textAlign = 'center';
    ctx.fillText('Tik om te springen!', W / 2, H - 16);
    hud.textContent = '⏱ ' + Math.max(0, Math.ceil(DUR - t)) + 's   \u{1F496} ' + hearts + '   ⭐ ' + (hearts + clean);
    if (t >= DUR) k.finish(hearts + clean, MAXRAW, 'Wat rende jij lekker!');
  });
  return { destroy: k.destroy };
}

// ---------------------------------------------------------------- 5. Kleuren-volgorde
function createKleuren(host, api) {
  const k = kit(host, api, 'linear-gradient(#f4e8ff,#e4f7ff)');
  const { W, H } = k;
  const MAXLEN = 10, MAXRAW = MAXLEN - 1;
  const FREQ = [330, 392, 494, 587];
  const COL = ['#a8e6b0', '#ffadb5', '#fff0a0', '#a9d3ff'];
  const FACE = ['\u{1F438}', '\u{1F437}', '\u{1F425}', '\u{1F433}'];
  const hud = k.hud();
  const pet = k.pet(k.root, 'position:absolute;left:50%;top:26px;margin-left:-32px;pointer-events:none;transition:transform .15s', 64, 'blij');
  const msg = k.mk(k.root, 'position:absolute;left:0;right:0;top:94px;text-align:center;font-size:19px;font-weight:800;color:#8a63b5;pointer-events:none');
  const size = Math.min(W - 40, H - 154) / 2 - 6;
  const gridSize = size * 2 + 12;
  const wrap = k.mk(k.root, 'position:absolute;left:' + Math.round((W - gridSize) / 2) + 'px;top:' + Math.round(134 + (H - 144 - gridSize) / 2) + 'px;width:' + gridSize + 'px;height:' + gridSize + 'px;display:grid;grid-template-columns:1fr 1fr;gap:12px');
  const pads = COL.map((c, i) => {
    const el = k.mk(wrap, 'display:flex;align-items:center;justify-content:center;font-size:' + Math.round(size * 0.42) + 'px;border-radius:26px;background:' + c + ';box-shadow:0 5px 0 rgba(120,100,150,0.25);transition:transform .08s,filter .08s;cursor:pointer', FACE[i]);
    k.on(el, 'pointerdown', (e) => { if (e.preventDefault) e.preventDefault(); press(i); });
    return el;
  });
  let seq = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)];
  let state = 'wait', idx = 0, rounds = 0, lives = 3;

  function flash(p, ms) {
    const el = pads[p];
    el.style.filter = 'brightness(1.1) saturate(1.8)';
    el.style.transform = 'scale(1.07)';
    k.beep(FREQ[p], ms / 1000 + 0.1, 'sine', 0.09);
    pet.style.transform = 'translateX(' + Math.round((p - 1.5) * 60) + 'px) rotate(' + (p % 2 ? 14 : -14) + 'deg)';
    k.mood(pet, 'blijblij');
    k.timeout(() => { pet.style.transform = ''; }, ms);
    k.timeout(() => { el.style.filter = ''; el.style.transform = ''; }, ms);
  }
  function stats() {
    hud.textContent = 'Ronde ' + (rounds + 1) + '   ' + '\u{1F49B}'.repeat(lives) + '\u{1F90D}'.repeat(3 - lives);
  }
  function play() {
    state = 'show'; stats();
    msg.textContent = 'Kijk goed! \u{1F440}';
    const dur = Math.max(260, 520 - seq.length * 22);
    let i = 0;
    const step = () => {
      if (i >= seq.length) { state = 'input'; idx = 0; msg.textContent = 'Jouw beurt! \u{1F449}'; return; }
      flash(seq[i], dur); i++;
      k.timeout(step, dur + 170);
    };
    k.timeout(step, 800);
  }
  function press(p) {
    if (state !== 'input' || k.over) return;
    flash(p, 200);
    if (p === seq[idx]) {
      idx++;
      if (idx >= seq.length) {
        rounds++; state = 'wait';
        k.live(rounds, MAXRAW);
        if (seq.length >= MAXLEN) { k.timeout(() => k.finish(rounds, MAXRAW, 'Wat een supergeheugen!'), 700); return; }
        msg.textContent = 'Super! \u{1F389}'; k.mood(pet, 'liefde', 1100);
        k.timeout(() => k.pling(), 300);
        seq.push(Math.floor(Math.random() * 4));
        k.timeout(play, 1200);
      }
    } else {
      lives--; state = 'wait'; stats(); k.mood(pet, 'verdrietig', 1200);
      k.timeout(() => k.beep(196, 0.3, 'triangle', 0.06), 150);
      if (lives <= 0) { msg.textContent = 'Lekker bezig! \u{1F49B}'; k.timeout(() => k.finish(rounds, MAXRAW, 'Je deed het hartstikke goed!'), 1000); return; }
      msg.textContent = 'Oeps! Kijk nog eens \u{1F642}';
      k.timeout(play, 1400);
    }
  }
  play();
  k.timeout(() => { state = 'wait'; k.finish(rounds, MAXRAW, 'Tijd om! Je deed het super!'); }, 70000);
  return { destroy: k.destroy };
}

// ---------------------------------------------------------------- 6. Verstoppertje
function createVerstop(host, api) {
  const k = kit(host, api, 'linear-gradient(#e6f7e0,#fff5dd)');
  const { W, H } = k;
  const SPOTS = ['\u{1F333}', '\u{1FAB4}', '\u{1F4E6}', '\u{1F6CB}️', '\u{1F9FA}', '\u{1F6AA}', '\u{1F3E0}', '⛺', '\u{1FAA3}', '\u{1F33B}', '\u{1F6CF}️', '\u{1FA91}'];
  const PETS = ['\u{1F436}', '\u{1F431}', '\u{1F430}', '\u{1F43C}', '\u{1F43B}'];
  const ROUNDS = 5, MAXRAW = 25;
  const hud = k.hud();
  const msg = k.mk(k.root, 'position:absolute;left:0;right:0;top:36px;text-align:center;font-size:20px;font-weight:800;color:#8a63b5;pointer-events:none', '');
  const pet = k.pet(k.root, 'position:absolute;left:12px;top:28px;pointer-events:none;z-index:3', 46, 'blij');
  const gridH = H - 130;
  const grid = k.mk(k.root, 'position:absolute;left:14px;top:80px;width:' + (W - 28) + 'px;height:' + gridH + 'px;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,1fr);gap:8px');
  let round = 0, raw = 0, tries = 0, hide = 0, lock = true, last = -1;
  const cells = SPOTS.map((e, i) => {
    const el = k.mk(grid, 'display:flex;align-items:center;justify-content:center;font-size:40px;border-radius:18px;background:#ffffff;box-shadow:0 3px 0 rgba(120,150,110,0.3);transition:background .2s,transform .2s;cursor:pointer;position:relative', e);
    k.on(el, 'pointerdown', (ev) => { if (ev.preventDefault) ev.preventDefault(); tap(i); });
    return { el, e, tried: false };
  });
  function heat(d, coarse) {
    if (coarse) return d < 2.5 ? ['Warm \u{1F525}', '#ffd2a8'] : ['Koud \u{1F976}', '#cfe6ff'];
    if (d < 1.5) return ['Gloeiend heet! \u{1F525}', '#ff9d8a'];
    if (d < 2.3) return ['Warm ☀️', '#ffd2a8'];
    if (d < 3.2) return ['Lauw \u{1F324}️', '#fff0b8'];
    return ['IJskoud ❄️', '#cfe6ff'];
  }
  function newRound() {
    do { hide = Math.floor(Math.random() * 12); } while (hide === last);
    last = hide; tries = 0;
    cells.forEach((c) => { c.tried = false; c.el.textContent = c.e; c.el.style.background = '#ffffff'; c.el.style.transform = ''; });
    pet.style.display = 'block'; k.mood(pet, 'blij');
    msg.textContent = 'Ik ga me verstoppen! Even tellen...';
    lock = true;
    k.timeout(() => { pet.style.display = 'none'; lock = false; msg.textContent = 'Waar zit mijn huisdier? \u{1F50D}'; }, 1200);
    hud.textContent = 'Ronde ' + (round + 1) + ' / ' + ROUNDS + '   ⭐ ' + raw;
  }
  function tap(i) {
    if (lock || k.over || cells[i].tried) return;
    tries++;
    if (i === hide) {
      lock = true;
      const pts = Math.max(1, 6 - tries);
      raw += pts; k.live(raw, MAXRAW);
      cells[i].el.innerHTML = k.petHtml(46, tries === 1 ? 'liefde' : 'blijblij');
      cells[i].el.style.background = '#ffd9ea';
      cells[i].el.style.transform = 'scale(1.12)';
      msg.textContent = 'Gevonden! +' + pts + ' \u{1F496}';
      k.beep(1200, 0.08, 'square', 0.03); k.beep(1500, 0.08, 'square', 0.03, 0.12);
      k.pling();
      hud.textContent = 'Ronde ' + (round + 1) + ' / ' + ROUNDS + '   ⭐ ' + raw;
      k.timeout(() => {
        round++;
        if (round >= ROUNDS) k.finish(raw, MAXRAW, 'Wat ben jij goed in zoeken!');
        else newRound();
      }, 1400);
      return;
    }
    cells[i].tried = true;
    const dx = (i % 4) - (hide % 4), dy = Math.floor(i / 4) - Math.floor(hide / 4);
    const h = heat(Math.hypot(dx, dy), round >= 3);
    cells[i].el.style.background = h[1];
    cells[i].el.textContent = h[0].split(' ').pop();
    msg.textContent = h[0] + ' *piep*';
    k.beep(1300, 0.06, 'square', 0.025);
    k.beep(round >= 3 ? 300 : 300 + (3.6 - Math.hypot(dx, dy)) * 120, 0.12, 'sine', 0.05);
  }
  newRound();
  return { destroy: k.destroy };
}

// ---------------------------------------------------------------- 7. Kook-timing
function createKoken(host, api) {
  const k = kit(host, api, 'linear-gradient(#fff0d9,#ffe0ec)');
  const { W, H } = k;
  const DISHES = [['\u{1F373}', 'Gebakken ei'], ['\u{1F355}', 'Pizza'], ['\u{1F35C}', 'Noedels'], ['\u{1F9C1}', 'Cupcake'], ['\u{1F95E}', 'Pannenkoeken']];
  const ZW = [0.34, 0.27, 0.21, 0.16, 0.12], MAXRAW = 17;
  const hud = k.hud();
  const title = k.mk(k.root, 'position:absolute;left:0;right:0;top:44px;text-align:center;font-size:20px;font-weight:800;color:#8a63b5');
  const pet = k.pet(k.root, 'position:absolute;left:20px;top:110px;pointer-events:none;transition:transform .2s', 76, 'hongerig');
  const dish = k.mk(k.root, 'position:absolute;left:0;right:0;top:90px;text-align:center;font-size:90px;transition:transform .2s');
  const msg = k.mk(k.root, 'position:absolute;left:0;right:0;top:215px;text-align:center;font-size:20px;font-weight:800;color:#e0719a;min-height:26px');
  const trackW = W - 60;
  const track = k.mk(k.root, 'position:absolute;left:30px;top:270px;width:' + trackW + 'px;height:34px;border-radius:17px;background:#fff;box-shadow:inset 0 2px 4px rgba(150,110,150,0.25)');
  const zone = k.mk(track, 'position:absolute;top:0;height:100%;border-radius:17px;background:#9be3a6');
  const marker = k.mk(track, 'position:absolute;top:-6px;width:10px;height:46px;border-radius:5px;background:#e0719a;box-shadow:0 2px 4px rgba(0,0,0,0.2)');
  const btn = k.mk(k.root, 'position:absolute;left:50%;top:340px;width:160px;margin-left:-80px;height:64px;border-radius:32px;background:#ffb3d1;box-shadow:0 5px 0 #e68db1;color:#fff;font-size:24px;font-weight:800;display:flex;align-items:center;justify-content:center;cursor:pointer', 'Tik! \u{1F44D}');
  const triesEl = k.mk(k.root, 'position:absolute;left:0;right:0;top:418px;text-align:center;font-size:20px');
  let di = 0, tries = 0, raw = 0, zx = 0, ph = 0, state = 'play', t = 0;

  function start() {
    state = 'play'; tries = 0;
    zx = rnd(0.05, 0.95 - ZW[di]);
    zone.style.left = Math.round(zx * trackW) + 'px';
    zone.style.width = Math.round(ZW[di] * trackW) + 'px';
    dish.textContent = '\u{1F372}';
    dish.style.transform = '';
    pet._base = 'hongerig'; k.mood(pet, 'hongerig');
    title.textContent = 'Gerecht ' + (di + 1) + ' / 5: ' + DISHES[di][1];
    msg.textContent = 'Tik als de streep in het groen is!';
    stats();
  }
  function stats() {
    hud.textContent = '⭐ ' + raw;
    triesEl.textContent = '\u{1F49B}'.repeat(3 - tries) + '\u{1F90D}'.repeat(tries);
  }
  function next() {
    di++;
    if (di >= DISHES.length) k.finish(raw, MAXRAW, 'Wat een lekker menu!');
    else start();
  }
  function hit() {
    if (state !== 'play' || k.over) return;
    const p = marker._p || 0;
    const z0 = zx, z1 = zx + ZW[di], c = zx + ZW[di] / 2;
    if (p >= z0 && p <= z1) {
      const centered = Math.abs(p - c) < ZW[di] * 0.2;
      const pts = Math.max(1, 3 - tries) + (centered ? 1 : 0);
      raw += pts; state = 'done'; k.live(raw, MAXRAW);
      dish.textContent = DISHES[di][0];
      dish.style.transform = 'scale(1.2)';
      k.mood(pet, centered ? 'liefde' : 'blijblij'); pet.style.transform = 'scale(1.12)';
      msg.textContent = (centered ? 'Perfect! ' : 'Lekker! ') + '+' + pts + ' \u{1F60B}';
      stats(); k.pling();
      k.timeout(next, 1300);
    } else {
      tries++;
      const near = p > z0 - ZW[di] * 0.5 && p < z1 + ZW[di] * 0.5;
      k.soft(); k.mood(pet, near ? 'neutraal' : 'vies', 900);
      if (tries >= 3) {
        k.mood(pet, 'verdrietig');
        state = 'done'; msg.textContent = 'Volgende keer lukt het vast! \u{1F49B}'; stats();
        k.timeout(next, 1400);
      } else {
        msg.textContent = near ? 'Bijna! Nog eens \u{1F642}' : 'Net niet, probeer opnieuw!';
        stats();
      }
    }
  }
  k.on(host, 'pointerdown', hit);
  start();
  k.loop((dt) => {
    if (k.over) return;
    t += dt;
    if (state === 'play') {
      ph += dt * (0.55 + di * 0.17);
      const f = ph % 2;
      const p = f < 1 ? f : 2 - f;
      marker._p = p;
      marker.style.left = Math.round(p * (trackW - 10)) + 'px';
    }
  });
  k.timeout(() => k.finish(raw, MAXRAW, 'Tijd om! Wat een kokkin!'), 70000);
  return { destroy: k.destroy };
}

// ---------------------------------------------------------------- 8. Dierenarts
function createDokter(host, api) {
  const k = kit(host, api, 'linear-gradient(#e0f7f4,#fdeaf4)');
  const { W, H } = k;
  const TOOLS = { p: ['\u{1FA79}', 'Pleister'], t: ['\u{1F321}️', 'Thermometer'], m: ['\u{1F48A}', 'Medicijn'] };
  const PAT = ['\u{1F436}', '\u{1F431}', '\u{1F430}', '\u{1F43B}', '\u{1F43C}', '\u{1F439}', '\u{1F98A}', '\u{1F42F}'];
  const CASES = [
    ['p'], ['t'], ['t', 'm'], ['p', 'm'], ['t', 'p'],
    ['t', 'p', 'm'], ['p', 't', 'm'], ['t', 'm', 'p'],
  ];
  const MAXRAW = 24;
  const hud = k.hud();
  const bubble = k.mk(k.root, 'position:absolute;left:20px;right:20px;top:34px;min-height:60px;border-radius:20px;background:#fff;box-shadow:0 3px 0 rgba(150,120,170,0.25);display:flex;align-items:center;justify-content:center;gap:10px;font-size:30px;padding:6px');
  const patient = k.pet(k.root, 'position:absolute;left:0;right:0;top:110px;text-align:center;transition:transform .15s', 110, 'ziek');
  const msg = k.mk(k.root, 'position:absolute;left:0;right:0;top:230px;text-align:center;font-size:19px;font-weight:800;color:#8a63b5;min-height:24px');
  const toolsTop = H - 150;
  const toolEls = {};
  const tw = Math.floor((W - 40 - 24) / 3);
  Object.keys(TOOLS).forEach((key, i) => {
    const el = k.mk(k.root, 'position:absolute;left:' + (20 + i * (tw + 12)) + 'px;top:' + toolsTop + 'px;width:' + tw + 'px;height:120px;border-radius:22px;background:#fff;box-shadow:0 5px 0 rgba(150,120,170,0.3);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer');
    k.mk(el, 'font-size:48px', TOOLS[key][0]);
    k.mk(el, 'font-size:13px;font-weight:700;margin-top:4px', TOOLS[key][1]);
    toolEls[key] = el;
    k.on(el, 'pointerdown', (e) => down(e, key));
  });
  let idx = 0, raw = 0, step = 0, mistakes = 0, locked = true, hideT = 0;
  let drag = null, ghost = null;

  function render() {
    bubble.textContent = '';
    const c = CASES[idx];
    if (!c) return;
    const hidden = idx >= 5 && hideT <= 0;
    c.forEach((key, i) => {
      const done = i < step;
      const s = k.mk(bubble, 'display:flex;align-items:center;gap:2px;opacity:' + (done ? '0.45' : '1'));
      k.mk(s, '', hidden && !done ? '❓' : TOOLS[key][0]);
      if (done) k.mk(s, 'font-size:20px', '✅');
      if (i < c.length - 1) k.mk(bubble, 'font-size:22px;color:#b79ac9', '➡️');
    });
    hud.textContent = 'Patient ' + (idx + 1) + ' / ' + CASES.length + '   ⭐ ' + raw;
  }
  function newPatient() {
    step = 0; mistakes = 0; locked = false; hideT = 0;
    patient._base = idx % 2 ? 'moe' : 'ziek'; k.mood(patient, patient._base);
    patient.style.transform = '';
    msg.textContent = idx < 5 ? 'Help het diertje in de goede volgorde!' : 'Onthoud de volgorde!';
    render();
    if (idx >= 5) {
      hideT = 1;
      const my = idx; k.timeout(() => { if (idx === my) { hideT = 0; render(); } }, 3500);
    }
  }
  function use(key) {
    if (locked || k.over) return;
    const c = CASES[idx];
    if (c[step] === key) {
      step++; k.beep(660 + step * 100, 0.12, 'sine', 0.06);
      if (step < c.length) { patient._base = 'neutraal'; k.mood(patient, 'neutraal'); }
      patient.style.transform = 'scale(1.08)';
      k.timeout(() => { patient.style.transform = ''; }, 150);
      if (step >= c.length) {
        locked = true;
        const pts = Math.max(1, 3 - mistakes);
        raw += pts; k.live(raw, MAXRAW);
        patient._base = 'liefde'; k.mood(patient, 'liefde');
        msg.textContent = 'Beter! +' + pts + ' \u{1F496}';
        render(); k.pling();
        k.timeout(() => {
          idx++;
          if (idx >= CASES.length) k.finish(raw, MAXRAW, 'Alle diertjes zijn beter!');
          else newPatient();
        }, 1300);
      } else { msg.textContent = 'Goed zo! En dan?'; render(); }
    } else {
      mistakes++; k.soft(); k.mood(patient, 'verdrietig', 900);
      msg.textContent = 'Hmm, probeer iets anders \u{1F914}';
      patient.style.transform = 'translateX(8px)';
      k.timeout(() => { patient.style.transform = ''; }, 150);
      if (idx >= 5) { hideT = 1; render(); const my = idx; k.timeout(() => { if (idx === my) { hideT = 0; render(); } }, 2500); }
    }
  }
  function down(e, key) {
    if (locked || drag) return;
    if (e.preventDefault) e.preventDefault();
    const p = k.pos(e);
    drag = { key, x0: p.x, y0: p.y, moved: false };
    ghost = k.mk(k.root, 'position:absolute;font-size:52px;pointer-events:none;z-index:9;transform:translate(-50%,-50%);display:none', TOOLS[key][0]);
  }
  function mv(e) {
    if (!drag) return;
    const p = k.pos(e);
    if (Math.hypot(p.x - drag.x0, p.y - drag.y0) > 12) drag.moved = true;
    if (drag.moved && ghost) {
      ghost.style.display = 'block';
      ghost.style.left = p.x + 'px'; ghost.style.top = p.y + 'px';
    }
  }
  function up(e) {
    if (!drag) return;
    const p = k.pos(e), d = drag;
    drag = null;
    if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
    ghost = null;
    if (!d.moved || p.y < toolsTop - 10) use(d.key);
  }
  k.on(host, 'pointermove', mv);
  k.on(host, 'pointerup', up);
  k.on(host, 'pointercancel', () => {
    drag = null;
    if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
    ghost = null;
  });
  newPatient();
  k.timeout(() => k.finish(raw, MAXRAW, 'Tijd om! Wat een lieve dierenarts!'), 90000);
  return { destroy: k.destroy };
}

export const GAMES = [
  { id: 'vangbal', name: 'Vang de bal', emoji: '\u{1F9FA}', desc: 'Vang de vallende ballen in je mandje. Gouden ballen zijn extra veel waard!', create: createVangbal },
  { id: 'memory', name: 'Memory', emoji: '\u{1F43C}', desc: 'Zoek de paartjes schattige dieren. Drie rondes, steeds sneller weg!', create: createMemory },
  { id: 'bubbels', name: 'Bubbels knallen', emoji: '\u{1FAE7}', desc: 'Knal de bellen van klein naar groot en blijf weg bij de stekelige.', create: createBubbels },
  { id: 'rennen', name: 'Ren-spel', emoji: '\u{1F415}', desc: 'Tik om over plasjes en bloempotten te springen en pak de hartjes.', create: createRennen },
  { id: 'kleuren', name: 'Kleuren-volgorde', emoji: '\u{1F3A8}', desc: 'Onthoud de volgorde van de kleuren en speel hem na.', create: createKleuren },
  { id: 'verstop', name: 'Verstoppertje', emoji: '\u{1F648}', desc: 'Waar zit je huisdier? Warm of koud, zoek hem op!', create: createVerstop },
  { id: 'koken', name: 'Kook-timing', emoji: '\u{1F373}', desc: 'Tik als de streep in het groene gebied is en maak vijf lekkere gerechten.', create: createKoken },
  { id: 'dokter', name: 'Dierenarts', emoji: '\u{1FA7A}', desc: 'Help de patientjes met pleister, thermometer en medicijn in de goede volgorde.', create: createDokter },
];
