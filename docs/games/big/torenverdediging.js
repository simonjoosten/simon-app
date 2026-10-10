// Torenverdediging: plaats torens langs het pad, versla golven, upgrade en verdien geld tussen rondes.
const fmt = (n) => {
  n = Math.floor(n);
  if (n < 1000) return String(n);
  const u = ['K', 'M', 'B', 'T'];
  let i = -1, v = n;
  while (v >= 1000 && i < 3) { v /= 1000; i++; }
  return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : v.toFixed(0)).replace('.', ',') + u[i];
};
const H = (tag, css, txt, p) => {
  const e = document.createElement(tag);
  if (css) e.style.cssText = css;
  if (txt != null) e.textContent = txt;
  if (p) p.appendChild(e);
  return e;
};
const BTN = 'min-height:44px;padding:8px 12px;border:0;border-radius:12px;font:600 14px system-ui;color:#fff;background:linear-gradient(135deg,#2563eb,#0891b2);cursor:pointer;';
const B = (txt, fn, p, css, dis) => {
  const b = H('button', BTN + (css || '') + (dis ? 'opacity:.4;' : ''), txt, p);
  b.onclick = () => { if (!dis) fn(); };
  return b;
};

const CELL = 40, COLS = 9, ROWS = 11;
const WP = [[-1, 1], [7, 1], [7, 4], [1, 4], [1, 7], [7, 7], [7, 10]];
const TYPES = [
  { n: 'Boogschutter', e: '🏹', cost: 50, dmg: 8, rate: 0.5, range: 95, col: '#16a34a' },
  { n: 'Kanon', e: '💣', cost: 100, dmg: 26, rate: 1.4, range: 85, splash: 42, col: '#ea580c' },
  { n: 'IJstoren', e: '❄️', cost: 80, dmg: 3, rate: 0.8, range: 85, slow: 0.5, col: '#0ea5e9' },
];
const FOES = ['🐛', '🐀', '🐗', '🦂', '👹'];

export default {
  id: 'torenverdediging', name: 'Torenverdediging', emoji: '🏰', desc: 'Plaats torens, versla golven en upgrade je verdediging.',
  async create(host, api) {
    const def = { gold: 120, lives: 20, wave: 1, towers: [], best: 0, gems: 0, m1: 0, m2: 0, last: Date.now() };
    let S = Object.assign({}, def, (await api.load()) || {});
    let alive = true, raf = 0, lastT = 0, hudT = 0;
    let enemies = [], proj = [], fx = [], waveActive = false, spawnLeft = 0, spawnT = 0, spawned = 0;
    let sel = -1, pick = 0, speed = 1, over = false, msg = '';
    host.style.cssText += ';background:linear-gradient(#10261a,#0a1710);color:#eafff0;font-family:system-ui,sans-serif;';
    const root = H('div', 'max-width:430px;margin:0 auto;padding:10px;box-sizing:border-box;', null, host);
    const save = () => { S.last = Date.now(); api.save(S); };

    // padgeometrie
    const pts = WP.map(([c, r]) => [c * CELL + CELL / 2, r * CELL + CELL / 2]);
    const segLen = [];
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      segLen.push(l); total += l;
    }
    const pathCells = new Set();
    for (let i = 0; i < WP.length - 1; i++) {
      const [a, b] = [WP[i], WP[i + 1]];
      const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
      for (let k = 0; k <= n; k++) {
        pathCells.add(Math.round(a[0] + ((b[0] - a[0]) * k) / n) + ',' + Math.round(a[1] + ((b[1] - a[1]) * k) / n));
      }
    }
    function posAt(d) {
      let i = 0;
      while (i < segLen.length - 1 && d > segLen[i]) { d -= segLen[i]; i++; }
      const f = Math.min(1, d / segLen[i]);
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
    }

    const dmgMul = () => 1 + 0.08 * S.m2;
    const tDmg = (t) => TYPES[t.k].dmg * (1 + 0.45 * (t.lv - 1)) * dmgMul();
    const tRange = (t) => TYPES[t.k].range + 6 * (t.lv - 1);
    const upCost = (t) => Math.round(TYPES[t.k].cost * 0.7 * t.lv);
    const waveSpec = (w) => {
      const boss = w % 5 === 0;
      return { count: boss ? 1 + Math.floor(w / 5) : Math.min(40, 6 + w * 2), hp: 12 * Math.pow(1.17, w) * (boss ? 8 : 1), spd: Math.min(95, 38 + w * 1.5) * (boss ? 0.65 : 1), boss, e: boss ? '🐲' : FOES[w % FOES.length], rew: 4 + Math.floor(w / 3) + (boss ? 25 : 0) };
    };
    let spec = waveSpec(S.wave);

    // DOM
    const top = H('div', 'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;', null, root);
    H('div', 'font:800 19px system-ui;', '🏰 Torenverdediging', top);
    const hud = H('div', 'font:700 14px system-ui;background:#0006;padding:5px 10px;border-radius:16px;', '', top);
    const cv = H('canvas', 'width:100%;border-radius:12px;display:block;touch-action:manipulation;', null, root);
    cv.width = COLS * CELL; cv.height = ROWS * CELL;
    const ctx = cv.getContext('2d');
    const ctrl = H('div', 'margin-top:8px;', null, root);

    function updHud() {
      hud.textContent = '🪙 ' + fmt(S.gold) + '  ❤️ ' + S.lives + '  🌊 ' + S.wave;
    }
    function panel() {
      ctrl.innerHTML = '';
      if (msg) { H('div', 'background:#0006;border-radius:10px;padding:6px 10px;margin-bottom:6px;font-size:13px;', msg, ctrl); }
      if (over) {
        const o = H('div', 'background:#3b1111;border-radius:14px;padding:12px;', null, ctrl);
        H('div', 'font:800 18px system-ui;', '💀 Het kasteel is gevallen!', o);
        H('div', 'margin:4px 0;font-size:14px;', 'Je haalde golf ' + S.wave + '. Beste: ' + S.best + '. Je hebt ' + S.gems + ' 💎.', o);
        const c1 = 5 * (S.m1 + 1), c2 = 8 * (S.m2 + 1);
        B('Startgoud +25 (' + c1 + ' 💎) · nu +' + S.m1 * 25, () => { S.gems -= c1; S.m1++; save(); panel(); }, o, 'width:100%;margin-top:4px;font-size:13px;', S.gems < c1);
        B('Torenkracht +8% (' + c2 + ' 💎) · nu +' + S.m2 * 8 + '%', () => { S.gems -= c2; S.m2++; save(); panel(); }, o, 'width:100%;margin-top:4px;font-size:13px;', S.gems < c2);
        B('🔄 Opnieuw beginnen', restart, o, 'width:100%;margin-top:8px;background:linear-gradient(135deg,#16a34a,#0d9488);');
        return;
      }
      const row = H('div', 'display:flex;gap:6px;margin-bottom:6px;', null, ctrl);
      TYPES.forEach((t, i) => B(t.e + ' ' + t.cost, () => { pick = i; sel = -1; panel(); }, row, 'flex:1;' + (pick === i && sel < 0 ? 'outline:3px solid #fde047;' : 'background:#1e3a8a;'), S.gold < t.cost && false));
      H('div', 'font-size:12px;opacity:.85;margin-bottom:6px;', pick >= 0 && sel < 0 ? TYPES[pick].e + ' ' + TYPES[pick].n + ': tik op een leeg vak om te bouwen. Tik op een toren om te upgraden.' : '', ctrl);
      if (sel >= 0 && S.towers[sel]) {
        const t = S.towers[sel], T = TYPES[t.k];
        const p = H('div', 'background:#0006;border-radius:12px;padding:8px;margin-bottom:6px;', null, ctrl);
        H('div', 'font-weight:700;', T.e + ' ' + T.n + ' niveau ' + t.lv + ' · schade ' + tDmg(t).toFixed(1) + ' · bereik ' + Math.round(tRange(t)), p);
        const r2 = H('div', 'display:flex;gap:6px;margin-top:6px;', null, p);
        const uc = upCost(t);
        B(t.lv >= 6 ? 'Max niveau' : 'Upgrade 🪙' + uc, () => { S.gold -= uc; t.lv++; t.inv += uc; save(); panel(); }, r2, 'flex:1;', t.lv >= 6 || S.gold < uc);
        B('Verkoop 🪙' + Math.round(t.inv * 0.7), () => { S.gold += Math.round(t.inv * 0.7); S.towers.splice(sel, 1); sel = -1; save(); panel(); }, r2, 'flex:1;background:#7f1d1d;');
      }
      const r3 = H('div', 'display:flex;gap:6px;', null, ctrl);
      B(waveActive ? 'Golf bezig...' : '▶ Start golf ' + S.wave + (spec.boss ? ' (BAAS!)' : ''), startWave, r3, 'flex:2;background:linear-gradient(135deg,#16a34a,#0d9488);', waveActive);
      B('⏩ x' + speed, () => { speed = speed === 1 ? 2 : speed === 2 ? 3 : 1; panel(); }, r3, 'flex:1;background:#475569;');
      H('div', 'font-size:12px;opacity:.7;margin-top:6px;', 'Volgende golf: ' + spec.count + ' x ' + spec.e + ' (' + fmt(spec.hp) + ' HP) · beste golf: ' + S.best + ' · 💎 ' + S.gems, ctrl);
    }
    function startWave() {
      if (waveActive || over) return;
      waveActive = true; spawnLeft = spec.count; spawnT = 0; spawned = 0; msg = ''; panel();
    }
    function restart() {
      S.gold = 120 + 25 * S.m1; S.lives = 20; S.wave = 1; S.towers = [];
      enemies = []; proj = []; fx = []; waveActive = false; over = false; sel = -1; msg = '';
      spec = waveSpec(1); save(); updHud(); panel();
    }
    function gameOver() {
      over = true; waveActive = false;
      if (S.wave > S.best) S.best = S.wave;
      S.gems += S.wave; // permanente beloning
      save(); panel();
    }

    function onTap(ev) {
      if (over) return;
      const rc = cv.getBoundingClientRect();
      const x = ((ev.clientX - rc.left) / rc.width) * cv.width, y = ((ev.clientY - rc.top) / rc.height) * cv.height;
      const c = Math.floor(x / CELL), r = Math.floor(y / CELL);
      if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return;
      const ti = S.towers.findIndex((t) => t.c === c && t.r === r);
      if (ti >= 0) { sel = ti; panel(); return; }
      if (pathCells.has(c + ',' + r)) { msg = 'Op het pad kun je niet bouwen.'; panel(); return; }
      const T = TYPES[pick];
      if (S.gold < T.cost) { msg = 'Te weinig goud voor ' + T.n + '.'; panel(); return; }
      S.gold -= T.cost; S.towers.push({ c, r, k: pick, lv: 1, cd: 0, inv: T.cost }); sel = S.towers.length - 1; msg = '';
      save(); updHud(); panel();
    }
    cv.addEventListener('pointerdown', onTap);

    function step(dt) {
      if (waveActive) {
        spawnT -= dt;
        if (spawnLeft > 0 && spawnT <= 0) {
          spawnLeft--; spawned++; spawnT = spec.boss ? 1.6 : 0.75;
          enemies.push({ d: 0, hp: spec.hp, max: spec.hp, spd: spec.spd, slow: 0, e: spec.e, boss: spec.boss, rew: spec.rew });
        }
      }
      enemies.forEach((en) => {
        en.slow = Math.max(0, en.slow - dt);
        en.d += en.spd * (en.slow > 0 ? 0.5 : 1) * dt;
      });
      for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].d >= total) {
          S.lives -= enemies[i].boss ? 5 : 1; enemies.splice(i, 1);
          fx.push({ t: 0.4, x: 330, y: 410, s: '💔' });
          if (S.lives <= 0) { S.lives = 0; updHud(); gameOver(); return; }
        }
      }
      S.towers.forEach((t) => {
        t.cd -= dt;
        if (t.cd > 0) return;
        const T = TYPES[t.k], tx = t.c * CELL + CELL / 2, ty = t.r * CELL + CELL / 2, rg = tRange(t);
        let best = null;
        enemies.forEach((en) => {
          const [ex, ey] = posAt(en.d);
          if (Math.hypot(ex - tx, ey - ty) <= rg && (!best || en.d > best.d)) best = en;
        });
        if (best) {
          t.cd = T.rate * Math.pow(0.93, t.lv - 1);
          proj.push({ x: tx, y: ty, tg: best, dmg: tDmg(t), splash: T.splash || 0, slow: !!T.slow, col: T.col });
        }
      });
      for (let i = proj.length - 1; i >= 0; i--) {
        const p = proj[i];
        if (p.tg.hp <= 0) { proj.splice(i, 1); continue; }
        const [ex, ey] = posAt(p.tg.d);
        const dx = ex - p.x, dy = ey - p.y, dist = Math.hypot(dx, dy), mv = 300 * dt;
        if (dist <= mv + 4) {
          if (p.splash) {
            enemies.forEach((en) => { const [qx, qy] = posAt(en.d); if (Math.hypot(qx - ex, qy - ey) <= p.splash) en.hp -= p.dmg; });
            fx.push({ t: 0.25, x: ex, y: ey, s: '💥' });
          } else { p.tg.hp -= p.dmg; if (p.slow) p.tg.slow = 1.5; }
          proj.splice(i, 1);
        } else { p.x += (dx / dist) * mv; p.y += (dy / dist) * mv; }
      }
      for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].hp <= 0) {
          S.gold += enemies[i].rew; const [ex, ey] = posAt(enemies[i].d);
          fx.push({ t: 0.5, x: ex, y: ey, s: '+' + enemies[i].rew });
          enemies.splice(i, 1);
        }
      }
      fx.forEach((f) => { f.t -= dt; f.y -= 20 * dt; });
      fx = fx.filter((f) => f.t > 0);
      if (waveActive && spawnLeft <= 0 && enemies.length === 0) {
        waveActive = false;
        const bonus = 20 + S.wave * 6;
        S.gold += bonus; msg = '🌊 Golf ' + S.wave + ' gehaald! Bonus 🪙' + bonus;
        S.wave++; if (S.wave - 1 > S.best) S.best = S.wave - 1;
        spec = waveSpec(S.wave); save(); panel();
      }
    }

    function draw() {
      ctx.fillStyle = '#2f5d2f'; ctx.fillRect(0, 0, cv.width, cv.height);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        ctx.fillStyle = pathCells.has(c + ',' + r) ? '#b08a5a' : (c + r) % 2 ? '#376b37' : '#2f5d2f';
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
      }
      ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🏰', 7 * CELL + CELL / 2, 10 * CELL + CELL / 2);
      S.towers.forEach((t, i) => {
        const x = t.c * CELL + CELL / 2, y = t.r * CELL + CELL / 2;
        if (i === sel) { ctx.strokeStyle = '#fde04788'; ctx.fillStyle = '#ffffff22'; ctx.beginPath(); ctx.arc(x, y, tRange(t), 0, 6.283); ctx.fill(); ctx.stroke(); }
        ctx.fillStyle = TYPES[t.k].col; ctx.beginPath(); ctx.arc(x, y, 17, 0, 6.283); ctx.fill();
        ctx.font = '22px serif'; ctx.fillStyle = '#fff'; ctx.fillText(TYPES[t.k].e, x, y + 1);
        ctx.font = '700 10px system-ui'; ctx.fillText('★'.repeat(Math.min(6, t.lv)), x, y + 17);
      });
      enemies.forEach((en) => {
        const [x, y] = posAt(en.d);
        ctx.font = (en.boss ? 34 : 24) + 'px serif'; ctx.fillText(en.e, x, y);
        ctx.fillStyle = '#000a'; ctx.fillRect(x - 14, y - 22, 28, 4);
        ctx.fillStyle = en.slow > 0 ? '#38bdf8' : '#ef4444'; ctx.fillRect(x - 14, y - 22, 28 * Math.max(0, en.hp / en.max), 4);
      });
      proj.forEach((p) => { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, 6.283); ctx.fill(); });
      fx.forEach((f) => { ctx.globalAlpha = Math.min(1, f.t * 3); ctx.font = '700 14px system-ui'; ctx.fillStyle = '#fde047'; ctx.fillText(f.s, f.x, f.y); ctx.globalAlpha = 1; });
    }

    function loop(ts) {
      if (!alive) return;
      const dt = Math.min(0.05, (ts - (lastT || ts)) / 1000);
      lastT = ts;
      if (!over) for (let k = 0; k < speed; k++) { step(dt); if (over) break; }
      draw();
      hudT += dt;
      if (hudT > 0.2) { hudT = 0; updHud(); }
      raf = requestAnimationFrame(loop);
    }

    if (S.lives <= 0) { over = true; }
    updHud(); panel();
    raf = requestAnimationFrame(loop);
    const iv = setInterval(() => { if (alive) save(); }, 10000);
    return { destroy() { alive = false; cancelAnimationFrame(raf); clearInterval(iv); cv.removeEventListener('pointerdown', onTap); save(); } };
  },
};
