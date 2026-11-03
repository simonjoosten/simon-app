// Kleur: 109 kleurplaten (35 + 74 nieuwe) (getekende plaatjes, mandala's, pixelkunst) met emmer, gum, pipet, ongedaan/opnieuw, achtergrond, 8 kleursets en eigen paletten,
// plus een Kleurlab (kleurenwiel, harmonieën, palet-generator, verlopen, contrast, kleurenblind, kleuren uit een foto) en vier kleurspelletjes.
// Opslag van kleurplaten blijft hetzelfde: localStorage `kleur:<uid>:art` = { plaatId: { vormIndex: kleur, bg?: kleur } }.

import { PLATEN_EXTRA } from './kleur-art.js?v=1';
import { PLATEN_R4, GROEPEN_R4 } from './creatief-r4-kleur.js?v=1';
import { shareBlob, svgToPng, printSvg, download, safeName } from './creatief-r4-share.js?v=1';
import * as K from './kleur-color.js?v=1';
import { mountLab } from './kleur-lab.js?v=1';
import { mountGames } from './kleur-games.js?v=1';
import { styleTag, gearHtml, wireGear, worldSelectHtml, hero, icon, GFX, playScene, copyText } from './apps3-ui.js?v=1';

const PALETTE = K.SETS[0].colors;

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

const PLATEN_OLD = [
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


export const PLATEN = [...PLATEN_OLD, ...PLATEN_EXTRA, ...PLATEN_R4];

// ---- SVG opbouwen ----
export function svgString(plaat, kleuren = {}, { id = false } = {}) {
  const bg = /^#[0-9a-f]{6}$/i.test(kleuren.bg || '') ? kleuren.bg : '#ffffff';
  const body = plaat.shapes.map((s, i) => s.replace(/^<(\w+)/, `<$1${id ? ` data-i="${i}"` : ''} fill="${kleuren[i] || '#ffffff'}" stroke="#000" stroke-width="${plaat.shapes.length > 60 ? 2 : 4}" stroke-linejoin="round" stroke-linecap="round" style="cursor:pointer"`)).join('');
  const decor = plaat.decor.map((s) => s.replace(/^<(\w+)/, '<$1 fill="none" stroke="#000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"')).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><rect ${id ? 'data-bg="1" ' : ''}width="400" height="400" fill="${bg}"${id ? '' : ' pointer-events="none"'}/>${body}${decor}</svg>`;
}

const GROEPEN = [
  ['alles', 'Alles', null],
  ['dieren', 'Dieren', ['kat', 'hond', 'vis', 'dino', 'vlinder', 'uil', 'schildpad', 'pinguin', 'olifant']],
  ['voertuigen', 'Voertuigen', ['auto', 'raket', 'boot', 'vrachtwagen', 'ufo']],
  ['natuur', 'Natuur', ['bloem', 'boom', 'zon', 'regenboog', 'paddenstoel', 'appel', 'planeet']],
  ['gebouwen', 'Gebouwen', ['huis', 'kasteel', 'vuurtoren']],
  ['fun', 'Leuk', ['ballon', 'ijsje', 'sneeuwman', 'robot', 'cupcake', 'vlieger']],
  ['mandala', 'Mandala & pixels', ['mandala1', 'mandala2', 'mandala3', 'mandala4', 'pixels']],
  ...GROEPEN_R4,
];
const countFilled = (k) => Object.keys(k || {}).filter((x) => x !== 'bg').length;

const CSS = `<style>
.kl-flex{display:flex;gap:.8rem;flex-wrap:wrap;align-items:center}
.kl-row{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin:.45rem 0}
.kl-col{display:flex;flex-direction:column;gap:.3rem}
.kl-big{border-radius:14px;padding:.8rem;text-align:center;font-weight:800;font-size:calc(1.1rem*var(--f));margin:.4rem 0}
.kl-strip{display:flex;gap:4px;margin:.4rem 0;flex-wrap:wrap}
.kl-sw{flex:1;min-width:calc(46px*var(--s));min-height:calc(54px*var(--s));border-radius:10px;border:1px solid #0003;cursor:pointer;display:flex;align-items:flex-end;justify-content:center;padding:2px}
.kl-pal{display:flex;gap:4px;height:calc(200px*var(--s));margin:.2rem 0 .6rem}
.kl-pc{flex:1;border-radius:12px;display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:.3rem 0;min-width:0}
.kl-pc button{background:transparent;border:0;min-height:calc(40px*var(--s));padding:0 .1rem}
.kl-hexb{flex-direction:column;font-size:calc(.8rem*var(--f))}
.kl-grad{height:calc(150px*var(--s));border-radius:14px;margin:.4rem 0;border:1px solid var(--line)}
.kl-prev{border-radius:14px;padding:1rem;margin:.6rem 0;border:1px solid var(--line)}
.kl-badge{padding:.2rem .5rem;border-radius:99px;font-size:.8rem;font-weight:700}
.kl-badge.ok{background:#bbf7d0;color:#14532d}.kl-badge.no{background:#fecaca;color:#7f1d1d}
.kl-saved{display:flex;gap:.5rem;align-items:center;padding:.4rem 0;border-top:1px solid var(--line)}
.kl-btn{display:inline-flex;align-items:center;gap:.4rem;padding:.5rem 1rem;border-radius:12px;border:1px solid var(--line);cursor:pointer;font-weight:700}
.kl-btn.on{background:var(--accent);color:#fff;border-color:var(--accent)}
.kl-games{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(160px*var(--s)),1fr));gap:.6rem}
.kl-games button{flex-direction:column;padding:.8rem;text-align:center;line-height:1.25}
.kl-duel{display:grid;grid-template-columns:1fr 1fr;gap:.6rem;margin:.5rem 0}
.kl-odd{display:grid;gap:6px;max-width:calc(420px*var(--s));margin:.6rem auto}
.kl-odd button{aspect-ratio:1;min-height:0;border:0;border-radius:12px;padding:0}
.kl-timebar{height:10px;background:rgba(128,128,128,.25);border-radius:6px;overflow:hidden;margin:.3rem 0}
.kl-timebar i{display:block;height:100%;background:var(--accent);transition:width .25s linear}
.kl-simon{display:grid;grid-template-columns:1fr 1fr;gap:.6rem;max-width:calc(360px*var(--s));margin:.8rem auto}
.kl-simon button{aspect-ratio:1;min-height:0;border:0;border-radius:24px;opacity:.55;transition:opacity .08s,transform .08s}
.kl-simon button.lit{opacity:1;transform:scale(1.05);box-shadow:0 0 28px 6px #fff8}
.kl-gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(110px*var(--s)),1fr));gap:.5rem;margin-top:.6rem}
.kl-gal button{padding:.3rem;display:flex;flex-direction:column;align-items:center;gap:.2rem;background:var(--card);border:1px solid var(--line);border-radius:12px;min-height:calc(40px*var(--s))}
.kl-gal .th{width:100%;aspect-ratio:1;background:#fff;border-radius:8px;overflow:hidden;pointer-events:none}
.kl-gal .bar{width:100%;height:5px;background:rgba(128,128,128,.25);border-radius:3px;overflow:hidden}.kl-gal .bar i{display:block;height:100%;background:#22c55e}
.kl-art{width:100%;max-width:520px;margin:0 auto;background:#fff;border:1px solid var(--line);border-radius:14px;overflow:auto;touch-action:manipulation;user-select:none;-webkit-user-select:none;max-height:75vh}
.kl-pg{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:.5rem 0}
.kl-pg button{aspect-ratio:1;border-radius:11px;padding:0;min-height:calc(40px*var(--s))}
.kl-rec{display:flex;gap:5px;flex-wrap:wrap;margin:.3rem 0}.kl-rec button{width:calc(34px*var(--s));height:calc(34px*var(--s));min-height:0;border-radius:50%;padding:0}
</style>`;

// ctx: { view, esc, uid, addCleanup }
export function kleurView(ctx) {
  const { view, esc, uid, addCleanup } = ctx;
  const KEY = `kleur:${uid}:art`, DKEY = `kleur:${uid}:done`;
  const rd = (k, d) => { try { const o = JSON.parse(localStorage.getItem(k) || 'null'); return o == null ? d : o; } catch { return d; } };
  const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  const readAll = () => { const o = rd(KEY, {}); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; };
  const writeAll = (o) => wr(KEY, o);

  let tab = 'plates', cur = null, kleuren = {}, color = PALETTE[8], tool = 'fill', undo = [], redo = [], confirmClear = false, msg = '', disposed = false, groep = 'alles', setId = 'regenboog', zoom = 100, heroCtl = null, lab = null, games = null, curColor = '#e53935';
  let recent = rd(`kleur:${uid}:recent`, []); if (!Array.isArray(recent)) recent = [];
  let pals = K.cleanPalettes(rd(`kleur:${uid}:pal`, []));
  let customSet = null;
  addCleanup && addCleanup(() => { disposed = true; try { heroCtl && heroCtl.dispose(); } catch { /* stil */ } try { lab && lab.dispose(); games && games.dispose(); } catch { /* stil */ } });
  const $ = (s) => view.querySelector(s);
  const say = (t) => { msg = t; const e = $('#kl-msg'); if (e) e.innerHTML = t ? `<small class="err" style="color:inherit">${esc(t)}</small>` : ''; };

  const save = () => { const all = readAll(); if (Object.keys(kleuren).length) all[cur.id] = kleuren; else delete all[cur.id]; if (!writeAll(all)) msg = 'Opslaan lukt niet (opslag vol of geblokkeerd).'; };
  const snap = () => { undo.push({ ...kleuren }); if (undo.length > 80) undo.shift(); redo = []; };
  const sets = () => [...K.SETS, ...pals.map((p, i) => ({ id: 'u' + i, name: '⭐ ' + p.name, colors: p.colors })), ...(customSet ? [customSet] : [])];
  const curSet = () => sets().find((s) => s.id === setId) || K.SETS[0];
  const pushRecent = (c) => { recent = [c, ...recent.filter((x) => x !== c)].slice(0, 8); wr(`kleur:${uid}:recent`, recent); };
  const labApi = {
    esc, say: (t) => say(t), copy: copyText, pals: () => pals, setPals: (a) => { pals = K.cleanPalettes(a); wr(`kleur:${uid}:pal`, pals); },
    toColoring: (colors, name) => { customSet = { id: 'custom', name: '🎨 ' + (name || 'Mijn palet'), colors: colors.slice(0, 24) }; setId = 'custom'; color = customSet.colors[0]; tab = 'plates'; cur ? draw() : menu(); renderTabs(); say(`Palet “${customSet.name}” staat klaar bij het kleuren.`); },
    cur: () => curColor, setCur: (c) => { curColor = c; },
  };

  function build() {
    view.innerHTML = `${styleTag()}${CSS}<div class="ap" id="kl"><div id="kl-hero"></div><div class="tabs2" id="kl-tabs"></div><div id="kl-body"></div><div id="kl-msg" class="msg"></div></div>`;
    heroCtl = hero($('#kl-hero'), { gameId: 'kleur', height: 96, title: `${icon('paint', { size: 30 })} Kleur`, rightHtml: `${worldSelectHtml('kleur')}${gearHtml()}` });
    $('#ap-world').onchange = (e) => heroCtl.setWorld(e.target.value);
    wireGear(view, (t) => say(t));
    renderTabs(); route();
  }
  function renderTabs() {
    const t = $('#kl-tabs'); if (!t) return;
    t.innerHTML = [['plates', '🎨 Kleurplaten'], ['lab', '🌈 Kleurlab'], ['games', '🎯 Spelletjes']].map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('');
    t.onclick = (e) => { const b = e.target.closest('[data-tab]'); if (!b) return; tab = b.dataset.tab; renderTabs(); route(); };
  }
  function route() {
    if (lab) { lab.dispose(); lab = null; } if (games) { games.dispose(); games = null; } msg = '';
    const body = $('#kl-body'); body.onclick = null;
    if (tab === 'lab') { body.innerHTML = '<div id="kl-labhost"></div>'; lab = mountLab($('#kl-labhost'), labApi); }
    else if (tab === 'games') { body.innerHTML = '<div id="kl-gamehost"></div>'; games = mountGames($('#kl-gamehost'), { esc, rd: (k, d) => rd(`kleur:${uid}:${k}`, d), wr: (k, v) => wr(`kleur:${uid}:${k}`, v), say, scene: (id, o) => playScene(view, id, o) }); }
    else if (cur) draw(); else menu();
  }

  // ===== galerij =====
  function menu() {
    cur = null; confirmClear = false; msg = '';
    const all = readAll(), done = rd(DKEY, {}), g = GROEPEN.find((x) => x[0] === groep) || GROEPEN[0];
    const list = PLATEN.filter((p) => !g[2] || g[2].includes(p.id));
    const dayIdx = Math.floor(Date.now() / 86400000) % PLATEN.length, daily = PLATEN[dayIdx];
    const totalDone = PLATEN.filter((p) => done[p.id]).length;
    $('#kl-body').innerHTML = `<div class="card"><b>${icon('paint', { size: 28 })} Kies een plaatje</b> <small class="mute">${PLATEN.length} plaatjes · ${totalDone} af</small>
      <div class="kl-row" style="margin-bottom:0"><button data-id="${daily.id}" class="on" style="flex:1">⭐ Plaatje van de dag: ${esc(daily.naam)}</button></div>
      <div class="tabs2" style="margin-top:.5rem">${GROEPEN.map(([k, l]) => `<button data-grp="${k}" class="${k === groep ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="kl-gal">${list.map((p) => { const k = all[p.id] || {}, n = countFilled(k), pct = Math.min(100, Math.round(n / p.shapes.length * 100)); return `<button data-id="${p.id}"><span class="th">${svgString(p, k).replace('width="400" height="400"', 'width="100%" height="100%"')}</span><small>${esc(p.naam)}${done[p.id] ? ' ✓' : ''}</small><span class="bar"><i style="width:${pct}%"></i></span></button>`; }).join('')}</div></div>`;
    view.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => open(b.dataset.id)));
    view.querySelectorAll('[data-grp]').forEach((b) => b.addEventListener('click', () => { groep = b.dataset.grp; menu(); }));
  }

  function open(id) {
    cur = PLATEN.find((p) => p.id === id); if (!cur) return;
    const saved = readAll()[id]; kleuren = saved && typeof saved === 'object' ? { ...saved } : {}; undo = []; redo = []; confirmClear = false; msg = ''; zoom = 100;
    draw();
  }

  // ===== kleuren =====
  function draw() {
    if (disposed) return;
    const valid = /^#[0-9a-f]{6}$/i.test(color) ? color : '#000000', S = sets(), cs = curSet(), n = countFilled(kleuren), pct = Math.min(100, Math.round(n / cur.shapes.length * 100)), tips = K.harmony(valid, 'analoog').concat(K.harmony(valid, 'compl')[1]);
    $('#kl-body').innerHTML = `<div class="card" style="padding:.7rem">
      <div class="kl-row" style="margin-top:0"><button id="kl-back" style="min-height:calc(42px*var(--s))">← Plaatjes</button><b style="flex:1;text-align:center">${esc(cur.emoji + ' ' + cur.naam)}</b><button id="kl-rnd" style="min-height:calc(42px*var(--s))">🎲 Verras me</button></div>
      <div class="kl-timebar" title="${pct}% ingekleurd"><i style="width:${pct}%;transition:none"></i></div>
      <div id="kl-art" class="kl-art"><div id="kl-svg" style="width:${zoom}%">${svgString(cur, kleuren, { id: true }).replace('width="400" height="400"', 'width="100%" height="100%" style="display:block"')}</div></div>
      <div class="kl-row"><span>🔍</span><input type="range" id="kl-zoom" min="100" max="300" step="25" value="${zoom}" style="flex:1" aria-label="Inzoomen"><b>${zoom}%</b></div>
      <div class="kl-row"><button data-tool="fill" class="${tool === 'fill' ? 'on' : ''}">🪣 Emmer</button><button data-tool="erase" class="${tool === 'erase' ? 'on' : ''}">🧽 Gum</button><button data-tool="pipet" class="${tool === 'pipet' ? 'on' : ''}">💧 Pipet</button><button data-tool="bg" class="${tool === 'bg' ? 'on' : ''}">🖼 Achtergrond</button>
        <button id="kl-undo" ${undo.length ? '' : 'disabled'}>↶</button><button id="kl-redo" ${redo.length ? '' : 'disabled'}>↷</button></div>
      <div class="kl-row"><select id="kl-set" aria-label="Kleurenset" style="flex:1">${S.map((x) => `<option value="${x.id}"${x.id === cs.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
        <input type="color" id="kl-custom" value="${valid}" style="width:3.2rem;height:46px;padding:0;border:0;background:none" aria-label="Eigen kleur"></div>
      <div class="kl-pg">${cs.colors.map((c) => `<button data-col="${c}" aria-label="Kleur ${c}" style="background:${c};border:${c === color ? '4px solid var(--accent)' : '1px solid var(--line)'}"></button>`).join('')}</div>
      ${recent.length ? `<small class="mute">Laatst gebruikt</small><div class="kl-rec">${recent.map((c) => `<button data-col="${c}" aria-label="Kleur ${c}" style="background:${c};border:${c === color ? '3px solid var(--accent)' : '1px solid var(--line)'}"></button>`).join('')}</div>` : ''}
      <small class="mute">Past erbij (${esc(K.colorName(valid))}):</small><div class="kl-rec">${tips.map((c) => `<button data-col="${c}" aria-label="Kleur ${c}" style="background:${c};border:1px solid var(--line)"></button>`).join('')}</div>
      <div class="kl-row">${confirmClear ? '<small>Alles wissen?</small><button id="kl-yes" class="on">Ja, wis alles</button><button id="kl-no">Nee</button>' : '<button id="kl-clear">🗑 Alles wissen</button>'}<button id="kl-png" class="on">⬇ Bewaar als plaatje</button><button id="kl-share">📤 Deel</button><button id="kl-svg">⬇ SVG</button><button id="kl-print">🖨 Print</button></div></div>`;
    const art = $('#kl-art'), undoBtn = $('#kl-undo');
    const refresh = () => { const n2 = countFilled(kleuren), p2 = Math.min(100, Math.round(n2 / cur.shapes.length * 100)), bar = view.querySelector('.kl-timebar i'); if (bar) bar.style.width = p2 + '%'; $('#kl-undo').disabled = !undo.length; $('#kl-redo').disabled = !redo.length; };
    art.addEventListener('pointerdown', (e) => {
      const el = e.target.closest && e.target.closest('[data-i],[data-bg]'); if (!el) return; e.preventDefault();
      const isBg = el.hasAttribute('data-bg'), key = isBg ? 'bg' : el.dataset.i;
      if (tool === 'pipet') { const c = isBg ? (kleuren.bg || '#ffffff') : (kleuren[key] || '#ffffff'); color = c; tool = 'fill'; draw(); return; }
      if (isBg && tool !== 'bg' && tool !== 'erase') return;   // de achtergrond kleur je alleen met het achtergrond-gereedschap
      const nieuw = tool === 'erase' ? null : color;
      if (tool === 'bg' || isBg) { if ((kleuren.bg || null) === (tool === 'erase' ? null : color)) return; snap(); if (tool === 'erase') delete kleuren.bg; else kleuren.bg = color; draw(); save(); return; }
      if ((kleuren[key] || null) === nieuw) return;
      snap(); if (nieuw) { kleuren[key] = nieuw; pushRecent(nieuw); } else delete kleuren[key];
      el.setAttribute('fill', nieuw || '#ffffff'); save(); refresh();
      if (nieuw && countFilled(kleuren) >= cur.shapes.length) {
        const done = rd(DKEY, {}); if (!done[cur.id]) { done[cur.id] = 1; wr(DKEY, done); heroCtl && heroCtl.burst(160, 60, { kind: 'confetti', n: 24 }); playScene(view, 'victory', { title: 'Mooi gekleurd!', sub: cur.naam }); }
      }
    });
    $('#kl-back').onclick = menu;
    $('#kl-rnd').onclick = () => {
      snap(); const pal = K.generatePalette({ mode: ['willekeurig', 'analoog', 'triade', 'split'][K.rand(4)], n: 5 });
      cur.shapes.forEach((_, i) => { kleuren[i] = pal[K.rand(pal.length)]; }); confirmClear = false; save(); draw();
    };
    view.querySelectorAll('[data-tool]').forEach((b) => b.onclick = () => { tool = b.dataset.tool; draw(); });
    view.querySelectorAll('[data-col]').forEach((b) => b.onclick = () => { color = b.dataset.col; if (tool === 'erase' || tool === 'pipet') tool = 'fill'; draw(); });
    $('#kl-set').onchange = (e) => { setId = e.target.value; draw(); };
    $('#kl-zoom').oninput = (e) => { zoom = +e.target.value; $('#kl-svg').style.width = zoom + '%'; e.target.nextElementSibling.textContent = zoom + '%'; };
    const cust = $('#kl-custom');
    cust.addEventListener('input', () => { color = cust.value; tool = 'fill'; });
    cust.addEventListener('change', () => { color = cust.value; tool = 'fill'; draw(); });
    undoBtn.onclick = () => { if (!undo.length) return; redo.push({ ...kleuren }); kleuren = undo.pop(); save(); draw(); };
    $('#kl-redo').onclick = () => { if (!redo.length) return; undo.push({ ...kleuren }); kleuren = redo.pop(); save(); draw(); };
    const cl = $('#kl-clear'); if (cl) cl.onclick = () => { confirmClear = true; draw(); };
    const no = $('#kl-no'); if (no) no.onclick = () => { confirmClear = false; draw(); };
    const yes = $('#kl-yes'); if (yes) yes.onclick = () => { if (Object.keys(kleuren).length) snap(); kleuren = {}; confirmClear = false; save(); draw(); };
    $('#kl-png').onclick = () => {
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
    const R4svg = () => svgString(cur, kleuren);
    $('#kl-share').onclick = async () => { try { const r = await shareBlob(await svgToPng(R4svg(), 800), `kleurplaat-${safeName(cur.id)}.png`, cur.naam); say(r === 'shared' ? 'Gedeeld!' : r === 'downloaded' ? 'Plaatje bewaard (delen kan niet op dit apparaat).' : ''); } catch { say('Delen is mislukt.'); } };
    $('#kl-svg').onclick = () => { try { download(new Blob([R4svg()], { type: 'image/svg+xml' }), `kleurplaat-${safeName(cur.id)}.svg`); } catch { say('Bewaren is mislukt.'); } };
    $('#kl-print').onclick = () => { if (!printSvg(R4svg(), cur.naam)) say('Afdrukken kon niet. Sta pop-ups toe.'); };
    if (msg) say(msg);
  }

  build();
}
