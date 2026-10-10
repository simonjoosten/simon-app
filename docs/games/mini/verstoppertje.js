const el = (p, css, txt) => { const d = document.createElement('div'); d.style.cssText = css || ''; if (txt != null) d.textContent = txt; if (p) p.appendChild(d); return d; };
const TARGETS = ['🦄', '🐝', '🍄', '🐙', '🎁', '🔑', '🐢', '🦉', '🍕', '⭐', '🐞', '🎈'];
const DECOY = ['🌲', '🌳', '🌿', '🍃', '🌱', '🌾', '🪨', '🌼', '🌻', '🍂'];

export default {
  id: 'verstoppertje', name: 'Verstoppertje', emoji: '🔦', hint: 'Beweeg het zoeklicht en tik de verborgen emoji',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#2e4d2c';
    host.style.fontFamily = 'system-ui,sans-serif';
    host.style.cursor = 'crosshair';
    const W = api.w, H = api.h, TOP = 84;
    const field = el(host, 'position:absolute;left:0;right:0;top:' + TOP + 'px;bottom:0;overflow:hidden;background:#3f6b3a');
    const dark = el(host, 'position:absolute;left:0;right:0;top:' + TOP + 'px;bottom:0;pointer-events:none;z-index:3');
    const hud = el(host, 'position:absolute;left:0;right:0;top:0;height:' + TOP + 'px;background:#1b2a1a;display:flex;flex-direction:column;justify-content:center;gap:4px;padding:0 14px;color:#fff;z-index:4;font-weight:800');
    const row1 = el(hud, 'display:flex;justify-content:space-between;font-size:19px');
    const tTxt = el(row1, '', ''), sTxt = el(row1, '', '');
    const want = el(hud, 'font-size:26px;letter-spacing:4px;min-height:34px');
    const fb = el(host, 'position:absolute;left:0;right:0;top:' + (TOP + 10) + 'px;text-align:center;color:#fff;font-size:24px;font-weight:900;text-shadow:0 2px 6px #000;z-index:5;pointer-events:none;opacity:0;transition:opacity .25s');
    const FH = H - TOP, R = 80;
    let dead = false, ended = false, level = 0, found = 0, left = 45, lx = W / 2, ly = FH / 2, targets = [];
    const timers = [];
    function light() {
      dark.style.background = 'radial-gradient(circle at ' + lx + 'px ' + ly + 'px, transparent ' + (R - 20) + 'px, rgba(0,0,0,.94) ' + (R + 18) + 'px)';
    }
    function say(t) { fb.textContent = t; fb.style.opacity = '1'; timers.push(setTimeout(() => { fb.style.opacity = '0'; }, 800)); }
    function showWant() { want.textContent = targets.map(t => (t.got ? '✅' : t.emoji)).join(' '); }
    function setup() {
      level++;
      field.innerHTML = '';
      const nT = Math.min(8, 2 + level);
      const pool = TARGETS.slice().sort(() => Math.random() - 0.5);
      const total = 60 + level * 8;
      for (let i = 0; i < total; i++) {
        const sz = 24 + Math.random() * 20;
        el(field, 'position:absolute;pointer-events:none;line-height:1;font-size:' + sz + 'px;left:' + (Math.random() * (W - 36)) + 'px;top:' + (Math.random() * (FH - 36)) + 'px;transform:rotate(' + (Math.random() * 60 - 30) + 'deg)', DECOY[Math.floor(Math.random() * DECOY.length)]);
      }
      targets = [];
      for (let i = 0; i < nT; i++) {
        const x = 24 + Math.random() * (W - 48), y = 24 + Math.random() * (FH - 48);
        const d = el(field, 'position:absolute;pointer-events:none;line-height:1;font-size:' + Math.max(22, 34 - level) + 'px;left:' + (x - 17) + 'px;top:' + (y - 17) + 'px', pool[i % pool.length]);
        targets.push({ x, y, emoji: pool[i % pool.length], d, got: false });
      }
      showWant();
    }
    function grab() {
      if (ended) return;
      let best = null, bd = 1e9;
      targets.forEach(t => { if (!t.got) { const d = Math.hypot(t.x - lx, t.y - ly); if (d < bd) { bd = d; best = t; } } });
      if (best && bd < 34) {
        best.got = true; best.d.style.background = '#ffeb3b88'; best.d.style.borderRadius = '50%';
        found++; api.score(found); left = Math.min(60, left + 3); showWant(); say('Gevonden! +3s');
        if (targets.every(t => t.got)) { left = Math.min(60, left + 6); say('Alles gevonden! +6s'); timers.push(setTimeout(() => { if (!dead && !ended) setup(); }, 700)); }
      } else { left -= 2; say('Mis! -2s'); }
      upd();
    }
    function upd() { tTxt.textContent = '⏱ ' + Math.max(0, left).toFixed(1) + 's'; sTxt.textContent = '🔦 ' + found; }
    function pos(e) {
      const r = host.getBoundingClientRect();
      lx = e.clientX - r.left; ly = e.clientY - r.top - TOP - (e.pointerType === 'touch' ? 60 : 0);
      lx = Math.max(0, Math.min(W, lx)); ly = Math.max(0, Math.min(FH, ly)); light();
    }
    const pm = e => { if (e.pointerType !== 'touch' || e.buttons || e.pressure > 0) pos(e); };
    const pdn = e => { e.preventDefault(); pos(e); grab(); };
    host.addEventListener('pointermove', pm); host.addEventListener('pointerdown', pdn);
    const kd = e => {
      const s = 30;
      if (e.key === 'ArrowLeft') lx -= s; else if (e.key === 'ArrowRight') lx += s; else if (e.key === 'ArrowUp') ly -= s; else if (e.key === 'ArrowDown') ly += s; else if (e.key === ' ' || e.key === 'Enter') { grab(); return; } else return;
      lx = Math.max(0, Math.min(W, lx)); ly = Math.max(0, Math.min(FH, ly)); light();
    };
    window.addEventListener('keydown', kd);
    const iv = setInterval(() => {
      if (dead || ended) return;
      left -= 0.1;
      if (left <= 0) {
        left = 0; ended = true; upd(); dark.style.background = 'rgba(0,0,0,.5)'; say('Tijd om!');
        timers.push(setTimeout(() => { if (!dead) api.end(found); }, 1200));
      } else upd();
    }, 100);
    api.score(0); setup(); light(); upd();
    return { destroy() {
      dead = true; clearInterval(iv); timers.forEach(clearTimeout);
      host.removeEventListener('pointermove', pm); host.removeEventListener('pointerdown', pdn); window.removeEventListener('keydown', kd);
      host.innerHTML = '';
    } };
  },
};
