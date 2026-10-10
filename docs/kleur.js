// Kleurplaten: 21 plaatjes als inline SVG om in te kleuren (emmer, gum, ongedaan maken, PNG-download, per plaatje onthouden).

const PALETTE = ['#000000', '#4b5563', '#9ca3af', '#ffffff', '#7c2d12', '#b45309', '#d97706', '#fcd9b6', '#ef4444', '#f43f5e', '#ec4899', '#a855f7', '#6366f1', '#3b82f6', '#06b6d4', '#14b8a6', '#22c55e', '#84cc16', '#facc15', '#fde68a', '#f97316', '#bae6fd', '#bbf7d0', '#fbcfe8'];

// ---- tekenhulpjes: elk geeft één sluitend SVG-element (zonder fill/stroke) ----
const C = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
const E = (x, y, a, b, rot = 0) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}"${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ''}/>`;
const R = (x, y, w, h, r = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${r ? ` rx="${r}"` : ''}/>`;
const P = (pts) => `<polygon points="${pts}"/>`;
const D = (d) => `<path d="${d}"/>`;
const CL = (x, y, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0,0 C-30,0 -35,-35 -8,-38 C-5,-65 45,-70 55,-45 C85,-50 95,-5 65,0 Z"/>`;
const star = (cx, cy, r) => P(Array.from({ length: 10 }, (_, k) => { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`; }).join(' '));
const L = (d) => `<path d="${d}"/>`; // decor-lijn (niet aantikbaar)

const ring = (n, f) => Array.from({ length: n }, (_, k) => f(k, (k / n) * Math.PI * 2));

function rainbow() {
  const radii = [170, 148, 126, 104, 82, 60], inner = 38, out = [];
  radii.forEach((ro, k) => { const ri = k + 1 < radii.length ? radii[k + 1] : inner; out.push(D(`M${200 - ro},300 A${ro},${ro} 0 0 1 ${200 + ro},300 L${200 + ri},300 A${ri},${ri} 0 0 0 ${200 - ri},300 Z`)); });
  out.push(D(`M${200 - inner},300 A${inner},${inner} 0 0 1 ${200 + inner},300 Z`));
  out.push(CL(20, 345, 1.3), CL(270, 345, 1.3));
  return out;
}

export const PLATEN = [
  { id: 'huis', naam: 'Huis', emoji: '🏠',
    shapes: [C(340, 60, 30), R(260, 100, 30, 70), R(90, 190, 220, 170), P('70,195 200,85 330,195'), R(110, 215, 50, 50), R(240, 215, 50, 50), R(175, 270, 50, 90), C(213, 318, 4), E(55, 355, 40, 24), E(350, 355, 40, 24), C(200, 150, 18)],
    decor: [L('M135,215 V265 M110,240 H160 M265,215 V265 M240,240 H290')] },
  { id: 'kat', naam: 'Kat', emoji: '🐱',
    shapes: [D('M290,320 C350,320 370,260 340,220 L325,230 C345,260 330,295 290,295 Z'), E(200, 300, 95, 70), E(150, 365, 30, 16), E(250, 365, 30, 16), P('140,135 150,70 190,115'), P('260,135 250,70 210,115'), C(200, 170, 70), P('152,120 154,92 175,112'), P('248,120 246,92 225,112'), E(172, 165, 12, 16), E(228, 165, 12, 16), P('190,190 210,190 200,203'), E(200, 320, 40, 40)],
    decor: [L('M200,203 V215 M200,215 Q185,225 175,215 M200,215 Q215,225 225,215 M150,200 L100,190 M150,210 L100,215 M250,200 L300,190 M250,210 L300,215')] },
  { id: 'hond', naam: 'Hond', emoji: '🐶',
    shapes: [D('M95,260 Q50,230 60,190 L80,195 Q75,225 110,245 Z'), R(110, 320, 35, 60, 12), R(160, 330, 35, 50, 12), R(240, 330, 35, 50, 12), R(285, 320, 35, 60, 12), E(190, 290, 100, 65), E(222, 150, 24, 50, 25), E(318, 150, 24, 50, -25), C(270, 170, 60), E(282, 200, 40, 28), C(300, 190, 10), E(290, 232, 10, 16), C(255, 160, 9), C(295, 155, 9)],
    decor: [L('M282,200 V212 M262,215 Q282,225 302,215')] },
  { id: 'vis', naam: 'Vis', emoji: '🐟',
    shapes: [P('310,200 380,140 380,260'), D('M150,135 Q200,70 250,130 Z'), D('M180,270 Q200,320 240,268 Z'), E(200, 200, 125, 80), D('M215,124 Q245,200 215,276 L255,272 Q285,200 255,128 Z'), E(210, 220, 35, 18, -20), C(120, 185, 14), C(120, 185, 6), C(70, 120, 12), C(50, 80, 8), C(85, 60, 6)],
    decor: [L('M78,215 Q100,228 115,215')] },
  { id: 'auto', naam: 'Auto', emoji: '🚗',
    shapes: [R(0, 318, 400, 40), D('M40,270 L40,230 Q40,210 70,205 L130,200 L165,150 Q175,140 195,140 L270,140 Q290,142 300,160 L325,200 Q370,205 370,240 L370,270 Z'), P('145,200 172,158 200,158 200,200'), P('215,200 215,158 268,158 290,200'), C(352, 235, 10), C(110, 275, 38), C(110, 275, 18), C(295, 275, 38), C(295, 275, 18), C(60, 235, 8)],
    decor: [L('M207,205 V245 M200,245 H212')] },
  { id: 'bloem', naam: 'Bloem', emoji: '🌸',
    shapes: [R(192, 190, 16, 150), E(150, 300, 40, 16, -30), E(250, 270, 40, 16, 30), ...ring(8, (k, a) => E(+(200 + 62 * Math.cos(a)).toFixed(1), +(150 + 62 * Math.sin(a)).toFixed(1), 36, 20, Math.round(a * 180 / Math.PI))), C(200, 150, 40), P('145,345 255,345 240,395 160,395'), R(138, 332, 124, 20, 6)],
    decor: [] },
  { id: 'raket', naam: 'Raket', emoji: '🚀',
    shapes: [star(60, 80, 22), star(340, 140, 18), star(330, 50, 14), D('M170,272 Q200,390 230,272 Z'), D('M185,272 Q200,340 215,272 Z'), D('M138,200 L85,280 L85,320 L138,270 Z'), D('M262,200 L315,280 L315,320 L262,270 Z'), D('M200,40 Q270,110 262,250 L138,250 Q130,110 200,40 Z'), D('M200,40 Q235,70 247,110 L153,110 Q165,70 200,40 Z'), C(200, 160, 30), R(165, 250, 70, 22, 4)],
    decor: [] },
  { id: 'dino', naam: 'Dino', emoji: '🦕',
    shapes: [D('M85,260 Q40,280 20,340 Q70,310 100,310 Z'), P('120,215 140,170 160,208'), P('165,205 190,155 215,203'), P('220,205 245,165 262,215'), R(110, 310, 38, 70, 10), R(160, 320, 38, 60, 10), R(220, 320, 38, 60, 10), R(260, 310, 38, 70, 10), D('M250,235 Q290,200 285,120 L335,120 Q340,210 300,285 Z'), E(190, 270, 110, 65), E(320, 100, 40, 25, -8), C(332, 94, 5), C(170, 265, 14), C(225, 285, 10), C(140, 290, 9)],
    decor: [L('M300,110 Q315,118 330,108')] },
  { id: 'boom', naam: 'Boom', emoji: '🌳',
    shapes: [E(200, 392, 160, 12), P('175,392 185,240 215,240 225,392'), C(200, 130, 80), C(130, 190, 55), C(270, 190, 55), C(200, 205, 58), C(160, 120, 10), C(240, 150, 10), C(190, 200, 10), C(120, 200, 9), C(275, 195, 9)],
    decor: [] },
  { id: 'zon', naam: 'Zon en wolken', emoji: '⛅',
    shapes: [...ring(12, (k, a) => { const c = Math.cos(a), s = Math.sin(a), pc = Math.cos(a + Math.PI / 2), ps = Math.sin(a + Math.PI / 2); const f = (r, o) => `${(200 + r * c + o * pc).toFixed(1)},${(180 + r * s + o * ps).toFixed(1)}`; return P(`${f(88, -14)} ${f(135, 0)} ${f(88, 14)}`); }), C(200, 180, 70), CL(40, 330, 1.5), CL(250, 90, 1), CL(260, 370, 1.1)],
    decor: [L('M175,170 V182 M225,170 V182 M170,205 Q200,230 230,205')] },
  { id: 'kasteel', naam: 'Kasteel', emoji: '🏰',
    shapes: [R(125, 178, 30, 24), R(185, 178, 30, 24), R(245, 178, 30, 24), R(125, 200, 150, 170), R(55, 160, 70, 210), R(275, 160, 70, 210), P('45,165 90,90 135,165'), P('265,165 310,90 355,165'), P('90,50 125,63 90,76'), D('M170,370 L170,300 Q200,255 230,300 L230,370 Z'), D('M75,250 L75,235 Q90,215 105,235 L105,250 Z'), D('M295,250 L295,235 Q310,215 325,235 L325,250 Z'), D('M185,255 L185,240 Q200,222 215,240 L215,255 Z')],
    decor: [L('M90,90 V50')] },
  { id: 'vlinder', naam: 'Vlinder', emoji: '🦋',
    shapes: [E(135, 150, 72, 52, -25), E(265, 150, 72, 52, 25), E(150, 265, 52, 40, 25), E(250, 265, 52, 40, -25), C(125, 145, 18), C(275, 145, 18), C(150, 270, 14), C(250, 270, 14), E(200, 210, 14, 75), C(200, 125, 16), C(165, 60, 6), C(235, 60, 6)],
    decor: [L('M194,112 Q180,80 165,66 M206,112 Q220,80 235,66')] },
  { id: 'ballon', naam: 'Ballonnen', emoji: '🎈',
    shapes: [E(120, 150, 45, 58), E(280, 150, 45, 58), E(200, 110, 45, 58), P('112,216 128,216 120,206'), P('272,216 288,216 280,206'), P('192,176 208,176 200,166'), R(160, 340, 80, 55, 4), R(194, 340, 12, 55), E(185, 335, 18, 10, -20), E(215, 335, 18, 10, 20)],
    decor: [L('M120,216 Q150,290 200,340 M280,216 Q250,290 200,340 M200,176 Q215,260 200,340')] },
  { id: 'ijsje', naam: 'IJsje', emoji: '🍦',
    shapes: [P('140,235 260,235 200,385'), E(200, 230, 75, 30), C(200, 160, 62), C(200, 82, 18)],
    decor: [L('M165,245 L215,330 M200,240 L190,360 M235,245 L185,325 M150,265 L250,265 M165,300 L235,300 M200,66 Q210,40 235,30')] },
  { id: 'appel', naam: 'Appel', emoji: '🍎',
    shapes: [D('M200,120 C150,80 70,110 75,230 C80,330 150,380 200,360 C250,380 320,330 325,230 C330,110 250,80 200,120 Z'), D('M195,125 Q195,85 215,55 L228,62 Q212,90 212,125 Z'), D('M225,85 C245,40 290,35 315,55 C300,95 255,110 225,85 Z'), D('M115,170 Q120,140 150,125 Q130,150 130,190 Z')],
    decor: [] },
  { id: 'boot', naam: 'Boot', emoji: '⛵',
    shapes: [C(330, 80, 35), R(95, 90, 10, 140), P('105,95 105,215 40,215'), P('105,90 145,103 105,116'), R(160, 170, 100, 60, 4), C(190, 200, 14), C(230, 200, 14), D('M40,230 L360,230 L320,320 Q315,335 295,335 L100,335 Q80,335 75,320 Z'), D('M52,262 L348,262 L338,288 L62,288 Z'), D('M0,335 Q25,310 50,335 T100,335 T150,335 T200,335 T250,335 T300,335 T350,335 T400,335 L400,400 L0,400 Z')],
    decor: [] },
  { id: 'regenboog', naam: 'Regenboog', emoji: '🌈', shapes: rainbow(), decor: [] },
  { id: 'vrachtwagen', naam: 'Vrachtwagen', emoji: '🚚',
    shapes: [R(0, 335, 400, 45), R(30, 120, 215, 160, 6), star(137, 200, 40), D('M250,280 L250,170 L305,170 L345,215 L375,225 Q380,225 380,235 L380,280 Z'), P('265,182 300,182 325,213 265,213'), R(25, 276, 355, 18, 4), C(80, 305, 30), C(80, 305, 12), C(150, 305, 30), C(150, 305, 12), C(310, 305, 30), C(310, 305, 12), C(368, 245, 8)],
    decor: [] },
  { id: 'uil', naam: 'Uil', emoji: '🦉',
    shapes: [R(40, 362, 320, 24, 10), P('120,140 135,70 175,115'), P('280,140 265,70 225,115'), E(200, 240, 95, 125), D('M110,220 Q60,290 105,350 Q130,300 125,230 Z'), D('M290,220 Q340,290 295,350 Q270,300 275,230 Z'), E(200, 292, 58, 72), C(160, 170, 38), C(240, 170, 38), C(165, 172, 16), C(235, 172, 16), P('185,198 215,198 200,232'), E(170, 372, 24, 10), E(230, 372, 24, 10)],
    decor: [L('M175,265 q10,10 20,0 M205,265 q10,10 20,0 M165,300 q10,10 20,0 M195,300 q10,10 20,0 M225,300 q10,10 20,0 M185,335 q10,10 20,0 M215,335 q10,10 20,0')] },
  { id: 'schildpad', naam: 'Schildpad', emoji: '🐢',
    shapes: [P('85,270 50,290 90,290'), E(140, 288, 26, 22), E(280, 288, 26, 22), E(350, 242, 34, 30), D('M90,275 C90,150 150,110 210,110 C270,110 330,150 330,275 Z'), P('190,160 230,160 250,195 230,230 190,230 170,195'), P('170,195 190,160 175,135 130,170 105,215'), P('250,195 230,160 245,135 290,170 315,215'), P('170,195 190,230 170,272 100,272 105,215'), P('250,195 230,230 250,272 320,272 315,215'), P('190,160 230,160 240,130 180,130'), P('190,230 230,230 240,272 180,272'), C(362, 234, 5)],
    decor: [L('M345,255 Q355,258 365,252')] },
  { id: 'sneeuwman', naam: 'Sneeuwpop', emoji: '⛄',
    shapes: [C(200, 315, 80), C(200, 205, 60), C(200, 115, 45), R(168, 15, 64, 50, 3), R(150, 62, 100, 14, 4), P('200,112 258,120 200,128'), C(185, 105, 5), C(215, 105, 5), C(200, 190, 7), C(200, 215, 7), C(200, 240, 7), E(130, 190, 14, 45, 60), E(270, 190, 14, 45, -60)],
    decor: [L('M180,130 Q200,142 220,130')] },
];

// ---- SVG opbouwen ----
export function svgString(plaat, kleuren = {}, { id = false } = {}) {
  const body = plaat.shapes.map((s, i) => s.replace(/^<(\w+)/, `<$1${id ? ` data-i="${i}"` : ''} fill="${kleuren[i] || '#ffffff'}" stroke="#000" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" style="cursor:pointer"`)).join('');
  const decor = plaat.decor.map((s) => s.replace(/^<(\w+)/, '<$1 fill="none" stroke="#000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"')).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><rect width="400" height="400" fill="#ffffff" pointer-events="none"/>${body}${decor}</svg>`;
}

// ctx: { view, esc, uid, addCleanup }
export function kleurView(ctx) {
  const { view, esc, uid, addCleanup } = ctx;
  const KEY = `kleur:${uid}:art`;
  const readAll = () => { try { const o = JSON.parse(localStorage.getItem(KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch { return {}; } };
  const writeAll = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); return true; } catch { return false; } };

  let cur = null, kleuren = {}, color = PALETTE[8], tool = 'fill', undo = [], confirmClear = false, msg = '', disposed = false;
  addCleanup && addCleanup(() => { disposed = true; });

  const save = () => { const all = readAll(); if (Object.keys(kleuren).length) all[cur.id] = kleuren; else delete all[cur.id]; if (!writeAll(all)) msg = 'Opslaan lukt niet (opslag vol of geblokkeerd).'; };
  const snap = () => { undo.push({ ...kleuren }); if (undo.length > 60) undo.shift(); };

  function menu() {
    cur = null; confirmClear = false; msg = '';
    const all = readAll();
    view.innerHTML = `<div class="box"><b>🎨 Kleurplaten</b><br><small>Kies een plaatje om in te kleuren. Je kleuren worden onthouden.</small>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-top:.6rem">${PLATEN.map((p) => `<button data-id="${p.id}" style="padding:.3rem;min-height:40px;display:flex;flex-direction:column;align-items:center;gap:.2rem;background:var(--card);border:1px solid var(--line);border-radius:10px"><span style="width:100%;aspect-ratio:1;display:block;background:#fff;border-radius:6px;overflow:hidden;pointer-events:none">${svgString(p, all[p.id] || {}).replace('width="400" height="400"', 'width="100%" height="100%"')}</span><small>${esc(p.naam)}${all[p.id] && Object.keys(all[p.id]).length ? ' ✓' : ''}</small></button>`).join('')}</div></div>`;
    view.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => open(b.dataset.id)));
  }

  function open(id) {
    cur = PLATEN.find((p) => p.id === id); if (!cur) return;
    const saved = readAll()[id]; kleuren = saved && typeof saved === 'object' ? { ...saved } : {}; undo = []; confirmClear = false; msg = '';
    draw();
  }

  function draw() {
    if (disposed) return;
    const valid = /^#[0-9a-f]{6}$/i.test(color) ? color : '#000000';
    view.innerHTML = `<div class="box" style="padding:.7rem">
      <div class="row wrap" style="margin:0 0 .5rem"><button id="kl-back" style="min-height:40px">← Plaatjes</button><b style="flex:1;text-align:center">${esc(cur.emoji + ' ' + cur.naam)}</b><button id="kl-rnd" style="min-height:40px">🎲 Verras me</button></div>
      <div id="kl-art" style="width:100%;max-width:460px;margin:0 auto;aspect-ratio:1;background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden;touch-action:manipulation;user-select:none;-webkit-user-select:none">${svgString(cur, kleuren, { id: true }).replace('width="400" height="400"', 'width="100%" height="100%" style="display:block"')}</div>
      <div class="row wrap" style="margin:.6rem 0 0"><button data-tool="fill" class="${tool === 'fill' ? 'pri' : ''}" style="min-height:40px">🪣 Emmer</button><button data-tool="erase" class="${tool === 'erase' ? 'pri' : ''}" style="min-height:40px">🧽 Gum</button><button id="kl-undo" style="min-height:40px" ${undo.length ? '' : 'disabled'}>↶ Ongedaan</button></div>
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:.6rem 0">${PALETTE.map((c) => `<button data-col="${c}" aria-label="Kleur ${c}" style="min-height:40px;aspect-ratio:1;border-radius:9px;padding:0;background:${c};border:${c === color ? '4px solid var(--accent)' : '1px solid var(--line)'}"></button>`).join('')}</div>
      <div class="row"><label style="display:flex;gap:.5rem;align-items:center"><small>Eigen kleur</small><input type="color" id="kl-custom" value="${valid}" style="width:3rem;height:2.5rem;padding:0;border:0;background:none"></label></div>
      <div class="row wrap">${confirmClear ? '<small>Alles wissen?</small><button id="kl-yes" class="pri" style="min-height:40px">Ja, wis alles</button><button id="kl-no" style="min-height:40px">Nee</button>' : '<button id="kl-clear" style="min-height:40px">🗑 Alles wissen</button>'}<button id="kl-png" class="pri" style="min-height:40px">⬇ Bewaar als plaatje</button></div>
      <div id="kl-msg">${msg ? `<small class="err">${esc(msg)}</small>` : ''}</div></div>`;
    const art = view.querySelector('#kl-art');
    const undoBtn = view.querySelector('#kl-undo');
    const msgEl = view.querySelector('#kl-msg');
    const say = (t) => { msg = t; msgEl.innerHTML = t ? `<small class="err">${esc(t)}</small>` : ''; };

    art.addEventListener('pointerdown', (e) => {
      const el = e.target.closest && e.target.closest('[data-i]'); if (!el) return;
      e.preventDefault();
      const i = el.dataset.i, nieuw = tool === 'erase' ? null : color;
      if ((kleuren[i] || null) === nieuw) return;
      snap(); if (nieuw) kleuren[i] = nieuw; else delete kleuren[i];
      el.setAttribute('fill', nieuw || '#ffffff'); undoBtn.disabled = false; save(); if (msg) say(msg);
    });
    view.querySelector('#kl-back').onclick = menu;
    view.querySelector('#kl-rnd').onclick = () => {
      snap(); const pal = PALETTE.filter((c) => c !== '#000000');
      cur.shapes.forEach((_, i) => { kleuren[i] = pal[Math.floor(Math.random() * pal.length)]; }); confirmClear = false; save(); draw();
    };
    view.querySelectorAll('[data-tool]').forEach((b) => b.onclick = () => { tool = b.dataset.tool; draw(); });
    view.querySelectorAll('[data-col]').forEach((b) => b.onclick = () => { color = b.dataset.col; tool = 'fill'; draw(); });
    const cust = view.querySelector('#kl-custom');
    cust.addEventListener('input', () => { color = cust.value; tool = 'fill'; });
    cust.addEventListener('change', () => { color = cust.value; tool = 'fill'; draw(); });
    undoBtn.onclick = () => { if (!undo.length) return; kleuren = undo.pop(); save(); draw(); };
    const cl = view.querySelector('#kl-clear'); if (cl) cl.onclick = () => { confirmClear = true; draw(); };
    const no = view.querySelector('#kl-no'); if (no) no.onclick = () => { confirmClear = false; draw(); };
    const yes = view.querySelector('#kl-yes'); if (yes) yes.onclick = () => { if (Object.keys(kleuren).length) snap(); kleuren = {}; confirmClear = false; save(); draw(); };
    view.querySelector('#kl-png').onclick = () => {
      const url = URL.createObjectURL(new Blob([svgString(cur, kleuren)], { type: 'image/svg+xml;charset=utf-8' }));
      const img = new Image();
      img.onload = () => {
        try {
          const cv = document.createElement('canvas'); cv.width = cv.height = 800; const c = cv.getContext('2d');
          c.fillStyle = '#ffffff'; c.fillRect(0, 0, 800, 800); c.drawImage(img, 0, 0, 800, 800); URL.revokeObjectURL(url);
          cv.toBlob((b) => {
            if (!b) return say('Plaatje maken is mislukt.');
            const u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = `kleurplaat-${cur.id}.png`;
            document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000);
          }, 'image/png');
        } catch { say('Plaatje maken is mislukt.'); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); say('Plaatje maken is mislukt.'); };
      img.src = url;
    };
  }

  menu();
}
