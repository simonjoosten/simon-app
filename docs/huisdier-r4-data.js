// huisdier-r4-data.js - Ronde 4 voor het Huisdier: 9 nieuwe dieren (3D-iconen, 6 kleuren), 10 speciale kleurlagen (salon), 20 nieuwe kledingstukken,
// 3 nieuwe kamers met 24 meubels, 56 plaatjes voor het verzamelalbum, 10 trucjes, 11 extra feestdagen/evenementen en 30 prestaties.
// Pure data en kleine functies; ALLEEN een import van huisdier-more.js (zonder DOM), dus testbaar in node.
// Opslag: alles zit in bestaande velden van de huisdier-save: s.type (nieuw dier), s.hue (kleur), s.own/s.wr (kleding), s.fp (nieuwe kamers),
// s.st (kleine tellers met letters-sleutels: albaa, albab, albclm, albday, packs, tint, tints, kzit...) en s.hs (highscores). Oude saves blijven geldig.
import { easterDate } from './huisdier-more.js?v=1';

const OL = '#3b2a47';
const S = (fill, w = 2.4) => `fill="${fill}" stroke="${OL}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const LN = (stroke, w = 2.4, extra = '') => `fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}`;

/* =====================================================================
   1. NIEUWE DIEREN (3D-icoon + kleurfilter)
   ===================================================================== */
const rot = (hex, deg) => { // hue-rotatie van een hex-kleur (voor de kleurstaaltjes)
  const h = hex.replace('#', ''); let [r, g, b] = [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16) / 255);
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const m = [0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
    0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283,
    0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072];
  const o = [m[0] * r + m[1] * g + m[2] * b, m[3] * r + m[4] * g + m[5] * b, m[6] * r + m[7] * g + m[8] * b];
  return '#' + o.map((v) => Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, '0')).join('');
};
const HUES = [0, 38, 110, 185, 255, 312];
const FILTERS = ['none', 'hue-rotate(38deg) saturate(1.15)', 'hue-rotate(110deg)', 'hue-rotate(185deg)', 'hue-rotate(255deg)', 'hue-rotate(312deg) saturate(1.1)'];
// id, emoji, naam, 3D-icoon, basiskleur (staal), geluid-soort (bestaande stemmen), 6 kleurnamen
const SP = [
  ['pinguin', '🐧', 'Pinguïn', 'penguin', '#5a6b8a', 'eend', ['Klassiek', 'Zonnetje', 'Muntijs', 'Poolblauw', 'Lila ijs', 'Roze ijs']],
  ['vos', '🦊', 'Vos', 'fox', '#f08a3c', 'hond', ['Rode vos', 'Gouden vos', 'Bosvos', 'IJsvos', 'Nachtvos', 'Roze vos']],
  ['uil', '🦉', 'Uil', 'owl', '#a47a4f', 'eend', ['Bruine uil', 'Gele uil', 'Groene uil', 'Blauwe uil', 'Paarse uil', 'Roze uil']],
  ['schildpad', '🐢', 'Schildpad', 'turtle', '#5aa86a', 'kikker', ['Groen', 'Zandkleur', 'Mos', 'Zeeschildpad', 'Lila schild', 'Roze schild']],
  ['leeuw', '🦁', 'Leeuw', 'lion', '#e9a23b', 'kat', ['Savanne', 'Zonneleeuw', 'Jungle', 'Zeeleeuw', 'Koningsblauw', 'Roze mane']],
  ['olifant', '🐘', 'Olifant', 'elephant', '#8d9bb8', 'draak', ['Grijs', 'Zand', 'Mintgroen', 'Hemelsblauw', 'Lila slurf', 'Snoeproze']],
  ['aapje', '🐵', 'Aapje', 'monkey', '#a8703d', 'konijn', ['Bruin aapje', 'Banaangeel', 'Jungle-aapje', 'Blauw aapje', 'Paars aapje', 'Roze aapje']],
  ['dino', '🦖', 'Dino', 'dino', '#6cc04a', 'draak', ['Groene dino', 'Gele dino', 'Mintdino', 'Zeedino', 'Lila dino', 'Roze dino']],
  ['robotje', '🤖', 'Robotje', 'robot', '#9aa6c0', 'panda', ['Zilver', 'Goud', 'Mint', 'Staalblauw', 'Paarse chip', 'Roze chip']],
];
export const R4_SPECIES = SP.map(([id, e, n, ic, base, snd, names]) => ({
  id, e, n, ic, snd,
  pal: names.map((pn, i) => ({ n: pn, f: FILTERS[i], c: [rot(base, HUES[i]), rot(base, HUES[i] + 25)] })),
}));
export const R4_SPECIES_BY = Object.fromEntries(R4_SPECIES.map((s) => [s.id, s]));
export const isR4Species = (t) => Object.prototype.hasOwnProperty.call(R4_SPECIES_BY, t);
export const r4SpeciesFilter = (t, hue) => { const s = R4_SPECIES_BY[t]; return s ? s.pal[Math.max(0, Math.min(5, hue | 0))].f : 'none'; };
// Plaatje van een nieuw dier als HTML; ico = 3D-url of null (dan emoji). Past in .hd-mixwrap (zelfde vlak als het Mix-huisdier).
export function r4AvatarInner(t, hue, iconUrl) {
  const s = R4_SPECIES_BY[t]; if (!s) return '';
  const f = r4SpeciesFilter(t, hue);
  if (iconUrl) return `<img class="hd-r4i" src="${iconUrl}" alt="" draggable="false" style="${f === 'none' ? '' : `filter:${f}`}">`;
  return `<span class="hd-r4e" style="${f === 'none' ? '' : `filter:${f}`}">${s.e}</span>`;
}

/* =====================================================================
   2. SPECIALE KLEURLAGEN (salon) - voor alle dieren
   ===================================================================== */
export const R4_TINTS = [
  { id: 'goud', n: 'Goud', e: '🥇', p: 90, lv: 6, f: 'sepia(1) saturate(3.2) hue-rotate(-8deg) brightness(1.08)' },
  { id: 'regenboog', n: 'Regenboog', e: '🌈', p: 150, lv: 9, f: 'hue-rotate(0deg) saturate(1.5)', anim: 1 },
  { id: 'nacht', n: 'Nachtblauw', e: '🌙', p: 60, lv: 4, f: 'hue-rotate(205deg) brightness(.62) saturate(1.4)' },
  { id: 'pastel', n: 'Pastel', e: '🍬', p: 40, lv: 2, f: 'saturate(.55) brightness(1.18)' },
  { id: 'neon', n: 'Neon', e: '⚡', p: 80, lv: 5, f: 'saturate(2.6) contrast(1.15) brightness(1.1)' },
  { id: 'ijs', n: 'IJsblauw', e: '🧊', p: 70, lv: 4, f: 'hue-rotate(170deg) saturate(.85) brightness(1.2)' },
  { id: 'lava', n: 'Lava', e: '🌋', p: 110, lv: 7, f: 'hue-rotate(-32deg) saturate(2.1) contrast(1.1)' },
  { id: 'spook', n: 'Spookje', e: '👻', p: 100, lv: 8, f: 'opacity(.72) brightness(1.3) saturate(.45)' },
  { id: 'zwartwit', n: 'Zwart-wit', e: '🎞️', p: 30, lv: 1, f: 'grayscale(1) contrast(1.1)' },
  { id: 'oudfoto', n: 'Oude foto', e: '📜', p: 35, lv: 1, f: 'sepia(.85) contrast(.95)' },
];
export const R4_TINT_BY = Object.fromEntries(R4_TINTS.map((t) => [t.id, t]));
// st.tint = 0 (geen) of index+1; st.tints = bitmasker van gekochte lagen
export const tintOf = (st) => { const i = ((st && st.tint) | 0) - 1; return R4_TINTS[i] || null; };
export const tintClass = (st) => { const t = tintOf(st); return t ? `r4-t-${t.id}` : ''; };
export const tintOwned = (st, i) => !!(((st && st.tints) | 0) & (1 << i));
export const tintCount = (st) => R4_TINTS.filter((_, i) => tintOwned(st, i)).length;

/* =====================================================================
   3. NIEUWE KLEDING (20 stuks, ook voor Mix en de nieuwe dieren)
   ===================================================================== */
const star = (r, ri = r * 0.45, n = 5) => { let d = ''; for (let i = 0; i < n * 2; i++) { const a = (Math.PI * i) / n - Math.PI / 2, rr = i % 2 ? ri : r; d += (i ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(1) + ',' + (Math.sin(a) * rr).toFixed(1); } return d + 'Z'; };
const circ = (x, y, r, f) => `<circle cx="${x}" cy="${y}" r="${r}" ${S(f, 2)}/>`;
const A = (slot, id, name, price, minLevel, vb, draw) => ({ slot, id, name, price, minLevel, vb, draw });
export const R4_ACC = [
  // hoeden: oorsprong = top van het hoofd, tekening groeit omhoog
  A('hat', 'r4-ridderhelm', 'Ridderhelm', 90, 5, [-60, -80, 120, 100], () => ({ back: '', front:
    `<path d="M0,-42 C12,-72 34,-68 31,-52 C26,-58 14,-56 6,-44Z" ${S('#ef476f', 2)}/><path d="M-38,10 C-44,-30 -20,-44 0,-44 C20,-44 44,-30 38,10Z" ${S('#cfd6e4')}/><rect x="-30" y="-10" width="60" height="8" rx="3" ${S('#7b86a1', 2)}/><path d="M-22,-34 Q-10,-40 -4,-38" ${LN('#fff', 3, 'opacity=".7"')}/>` })),
  A('hat', 'r4-astronaut', 'Astronautenhelm', 140, 8, [-70, -30, 140, 150], () => ({ back: '', front:
    `<ellipse cx="0" cy="44" rx="62" ry="64" fill="#bfe8ff" fill-opacity=".26" stroke="#fff" stroke-width="3.6"/><path d="M-40,12 Q-24,-8 4,-12" ${LN('#fff', 4.5, 'opacity=".8"')}/><rect x="-44" y="96" width="88" height="12" rx="6" ${S('#e8eef7', 2.2)}/>` })),
  A('hat', 'r4-zonnehoed', 'Strandhoed', 40, 2, [-62, -50, 124, 80], () => ({ back: '', front:
    `<path d="M-26,6 C-26,-30 26,-30 26,6Z" ${S('#f6dc8c')}/><ellipse cx="0" cy="6" rx="55" ry="11" ${S('#f2cf6d')}/><path d="M-26,0 Q0,8 26,0 L26,-8 Q0,0 -26,-8Z" ${S('#ff6b6b', 2)}/>` })),
  A('hat', 'r4-vuurhoed', 'Vlammenhoed', 120, 7, [-50, -78, 100, 96], () => ({ back: '', front:
    `<path d="M-30,10 C-40,-20 -14,-30 -18,-58 C-6,-46 0,-62 4,-74 C10,-50 34,-40 30,-6 C30,2 28,6 24,10Z" ${S('#ff8a30')}/><path d="M-14,8 C-20,-8 -4,-14 -4,-30 C4,-22 14,-18 12,-2 C12,4 10,6 8,8Z" ${S('#ffd23f', 2)}/>` })),
  A('hat', 'r4-regenboogpet', 'Regenboogpet', 70, 3, [-52, -48, 104, 64], () => {
    const cols = ['#ff5d5d', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa']; let s = '';
    cols.forEach((c, i) => { const r = 40 - i * 6; s += `<path d="M${-r},10 C${-r},${-r * 0.8} ${r},${-r * 0.8} ${r},10Z" fill="${c}" stroke="${OL}" stroke-width="1.2"/>`; });
    return { back: '', front: s + `<rect x="-42" y="6" width="84" height="8" rx="4" ${S('#fff', 2)}/>` };
  }),
  A('hat', 'r4-ijskroon', 'IJskroon', 110, 6, [-52, -50, 104, 66], () => ({ back: '', front:
    `<path d="M-36,10 L-38,-14 L-20,0 L0,-34 L20,0 L38,-14 L36,10Z" ${S('#c4ecff')}/><path d="M-20,0 L-12,8 M20,0 L12,8 M0,-34 L0,6" ${LN('#fff', 2, 'opacity=".8"')}/><path transform="translate(0 -44) scale(.5)" d="${star(14, 4, 4)}" ${S('#fff', 2.4)}/>` })),
  // brillen: oorsprong = midden tussen de ogen, ogen op x=+-22
  A('glasses', 'r4-vrbril', 'VR-bril', 100, 6, [-60, -40, 120, 80], () => ({ back: '', front:
    `<rect x="-36" y="-15" width="72" height="30" rx="11" ${S('#3a3a5a')}/><rect x="-31" y="-10" width="62" height="20" rx="8" fill="#0d1b2a"/><path d="M-24,0 H24" ${LN('#4dd6ff', 3, 'opacity=".9"')}/><path d="M-36,-4 H-50 M36,-4 H50" ${LN(OL, 4)}/>` })),
  A('glasses', 'r4-zwembril', 'Zwembril', 45, 2, [-60, -40, 120, 80], () => ({ back: '', front:
    `<circle cx="-22" cy="0" r="15" fill="#8fd8ff" fill-opacity=".5" stroke="#2f80ed" stroke-width="4"/><circle cx="22" cy="0" r="15" fill="#8fd8ff" fill-opacity=".5" stroke="#2f80ed" stroke-width="4"/><path d="M-7,0 H7" ${LN('#2f80ed', 4)}/><path d="M-37,-2 L-54,-6 M37,-2 L54,-6" ${LN('#2f80ed', 3.4)}/>` })),
  A('glasses', 'r4-regenboogbril', 'Regenboogbril', 65, 3, [-60, -40, 120, 80], () => ({ back: '', front:
    `<circle cx="-22" cy="0" r="15" fill="#ffd6ec" fill-opacity=".4" stroke="#ff5d8f" stroke-width="4"/><circle cx="22" cy="0" r="15" fill="#d6ecff" fill-opacity=".4" stroke="#4dabf7" stroke-width="4"/><circle cx="-22" cy="0" r="9.5" ${LN('#ffe066', 2.6)}/><circle cx="22" cy="0" r="9.5" ${LN('#69db7c', 2.6)}/><path d="M-7,-2 Q0,-6 7,-2" ${LN(OL, 3)}/>` })),
  A('glasses', 'r4-neonbril', 'Neonbril', 55, 4, [-60, -40, 120, 80], () => ({ back: '', front:
    `<rect x="-39" y="-14" width="34" height="28" rx="9" fill="#2b1055" fill-opacity=".55" stroke="#39ff14" stroke-width="4"/><rect x="5" y="-14" width="34" height="28" rx="9" fill="#2b1055" fill-opacity=".55" stroke="#ff2fd1" stroke-width="4"/><path d="M-5,0 H5" ${LN(OL, 3)}/>` })),
  // hals: oorsprong = midden van de nek
  A('neck', 'r4-gouden-ketting', 'Gouden ketting', 80, 5, [-50, -20, 100, 90], () => ({ back: '', front:
    `<path d="M-32,-10 Q0,34 32,-10" ${LN('#f2b705', 4.2)}/><path d="M-32,-10 Q0,34 32,-10" ${LN('#ffe066', 1.6)}/><g transform="translate(0 24)"><path d="${star(12, 5)}" ${S('#ffd23f', 2)}/></g>` })),
  A('neck', 'r4-lint', 'Prijslint', 45, 2, [-44, -16, 88, 90], () => ({ back: '', front:
    `<path d="M-6,4 L-16,44 L-4,36 L0,46 L0,6Z" ${S('#3b82f6', 2)}/><path d="M6,4 L16,44 L4,36 L0,46 L0,6Z" ${S('#ef4444', 2)}/><circle cx="0" cy="2" r="10" ${S('#ffd23f', 2.2)}/><circle cx="0" cy="2" r="5" fill="#f2b705"/>` })),
  A('neck', 'r4-hoofdtelefoon', 'Koptelefoon', 60, 3, [-54, -34, 108, 76], () => ({ back: '', front:
    `<path d="M-32,6 Q0,-26 32,6" ${LN('#2d2d44', 5)}/><rect x="-42" y="-2" width="16" height="26" rx="7" ${S('#ff5d8f')}/><rect x="26" y="-2" width="16" height="26" rx="7" ${S('#ff5d8f')}/>` })),
  A('neck', 'r4-bloemenslinger', 'Bloemenslinger', 35, 1, [-50, -20, 100, 80], () => {
    const cols = ['#ff7aa8', '#ffd23f', '#9b8cff', '#ff9f5a', '#6fd3a8']; let s = `<path d="M-34,-6 Q0,30 34,-6" ${LN('#4caf50', 3)}/>`;
    for (let i = 0; i < 5; i++) { const t = i / 4, x = -32 + 64 * t, y = -6 + Math.sin(t * Math.PI) * 24; s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" ${S(cols[i], 1.8)}/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4" fill="#fff6c9"/>`; }
    return { back: '', front: s };
  }),
  A('neck', 'r4-ridderkraag', 'Ridderkraag', 70, 5, [-50, -20, 100, 70], () => {
    let s = ''; for (let i = 0; i < 7; i++) s += `<circle cx="${-30 + i * 10}" cy="${6 + Math.sin((i / 6) * Math.PI) * 12}" r="7" ${S('#d9dfeb', 1.8)}/>`;
    return { back: '', front: s };
  }),
  // lijf: oorsprong = midden van het lijf
  A('body', 'r4-ruimtepak', 'Ruimtepak', 130, 8, [-52, -44, 104, 90], () => ({ back: '', front:
    `<ellipse cx="0" cy="0" rx="41" ry="33" ${S('#f4f6fb')}/><rect x="-26" y="-6" width="52" height="8" fill="#ff8a30"/><rect x="-26" y="8" width="52" height="5" fill="#3b82f6"/><circle cx="-14" cy="-20" r="6" ${S('#4dd6ff', 2)}/><rect x="6" y="-24" width="16" height="10" rx="2" ${S('#334', 1.6)}/><circle cx="10" cy="-19" r="2" fill="#ff4d4d"/><circle cx="17" cy="-19" r="2" fill="#4dff88"/>` })),
  A('body', 'r4-ridderpantser', 'Ridderpantser', 120, 6, [-52, -44, 104, 90], () => ({ back: '', front:
    `<path d="M-38,-8 C-38,-34 38,-34 38,-8 C38,24 22,34 0,34 C-22,34 -38,24 -38,-8Z" ${S('#cfd6e4')}/><path d="M0,-28 V30 M-26,0 H26" ${LN('#9aa4bd', 3)}/><path d="M-6,-8 H6 V-14 H-6Z M-3,-8 V10 M3,-8 V10" ${LN('#ef476f', 3.4)}/>` })),
  A('body', 'r4-regenbogentutu', 'Regenboogtutu', 75, 4, [-62, -32, 124, 80], () => {
    const cols = ['#ff5d5d', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa']; let s = '';
    cols.forEach((c, i) => { s += `<ellipse cx="0" cy="${6 + i * 3}" rx="${46 - i * 2}" ry="${12 - i}" ${S(c, 1.6)} fill-opacity=".92"/>`; });
    return { back: '', front: s };
  }),
  A('body', 'r4-wolkenvest', 'Wolkenvest', 55, 3, [-56, -40, 112, 84], () => ({ back: '', front:
    `<g ${S('#fff', 2.4)}><circle cx="-24" cy="4" r="16"/><circle cx="-8" cy="-8" r="18"/><circle cx="12" cy="-6" r="18"/><circle cx="28" cy="6" r="15"/><ellipse cx="2" cy="10" rx="34" ry="16" stroke="none"/></g><ellipse cx="0" cy="8" rx="30" ry="12" fill="#fff"/>` })),
  A('body', 'r4-engelenvleugels', 'Engelenvleugels', 150, 10, [-120, -80, 240, 150], () => {
    const w = (sx) => `<g transform="scale(${sx} 1)"><path d="M18,-4 C40,-44 82,-48 90,-30 C80,-30 74,-24 72,-18 C82,-16 78,-4 66,-6 C70,2 60,8 50,4 C46,14 30,16 18,6Z" ${S('#fff', 2.4)}/><path d="M34,-10 C48,-26 66,-30 78,-26 M32,0 C46,-12 60,-14 68,-12" ${LN('#cfe3ff', 2)}/></g>`;
    return { back: `<g transform="translate(0 -8) scale(1.22)">${w(1)}${w(-1)}</g>`, front: '' };
  }),
];
export const R4_ACC_BY = Object.fromEntries(R4_ACC.map((a) => [a.id, a]));
export const R4_SLOTS = ['hat', 'glasses', 'neck', 'body'];
const BASE_A = { hx: 100, hatY: 41, hatS: 1, eyeY: 92, eyeDX: 24, neckY: 136, neckW: 34, chestY: 152, bodyW: 40 };
const place = (slot, a) => {
  if (slot === 'hat') return `translate(${a.hx} ${a.hatY}) scale(${Math.round(a.hatS * 100) / 100})`;
  if (slot === 'glasses') return `translate(100 ${a.eyeY}) scale(${Math.round((a.eyeDX / 22) * 100) / 100})`;
  if (slot === 'neck') return `translate(100 ${a.neckY}) scale(${Math.round((a.neckW / 34) * 100) / 100})`;
  return `translate(100 ${a.chestY}) scale(${Math.round((a.bodyW / 40) * 100) / 100})`;
};
// Wikkelt de tekenmodule (huisdier-art-pets.js): nieuwe kleding wordt in dezelfde SVG gezet; de rest blijft zoals het was.
export function wrapArt(m) {
  if (!m) return m;
  const ACCESSORIES = {};
  for (const sl of R4_SLOTS) ACCESSORIES[sl] = ((m.ACCESSORIES && m.ACCESSORIES[sl]) || []).concat(R4_ACC.filter((a) => a.slot === sl).map(({ id, name, price, minLevel }) => ({ id, name, price, minLevel })));
  const out = Object.assign({}, m, { ACCESSORIES });
  out.petSVG = (sid, o) => {
    const opts = o || {}, outfit = opts.outfit || {}, mine = {}, rest = {};
    for (const sl of R4_SLOTS) { const id = outfit[sl]; if (!id) continue; if (R4_ACC_BY[id] && R4_ACC_BY[id].slot === sl) mine[sl] = id; else rest[sl] = id; }
    const svg = m.petSVG(sid, Object.assign({}, opts, { outfit: rest }));
    if (!Object.keys(mine).length || opts.stage === 'ei') return svg;
    const an = Object.assign({}, BASE_A, typeof m.anchorsOf === 'function' ? m.anchorsOf(sid) : {});
    let back = '', front = '';
    for (const sl of ['body', 'neck', 'glasses', 'hat']) {
      const a = mine[sl] && R4_ACC_BY[mine[sl]]; if (!a) continue;
      const d = a.draw(), tf = place(sl, an);
      if (d.back) back += `<g transform="${tf}">${d.back}</g>`;
      if (d.front) front += `<g transform="${tf}">${d.front}</g>`;
    }
    let res = svg;
    if (back) res = res.replace(/(<g class="pet-body[^>]*>)/, `$1${back}`);
    const end = '</g></g></svg>';
    if (front) res = res.endsWith(end) ? res.slice(0, -end.length) + front + end : res.replace(/<\/svg>\s*$/, `${front}</svg>`);
    return res;
  };
  out.accessorySVG = (slot, id, size = 100) => {
    const a = R4_ACC_BY[id];
    if (!a || a.slot !== slot) return m.accessorySVG(slot, id, size);
    const d = a.draw();
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${a.vb.join(' ')}" width="${size}" height="${size}" role="img" aria-label="${a.name}">${d.back || ''}${d.front || ''}</svg>`;
  };
  return out;
}

/* =====================================================================
   4. NIEUWE KAMERS (met meubels van 3D-iconen)
   ===================================================================== */
// id = sleutel in de state, a = id voor de tekenmodule; w/f/sp = kleurverloop; decor = [icoon, x%, y%, breedte%, alpha]
export const R4_ROOMS = [
  { id: 'zolder', a: 'zolderkamer', e: '🕯️', n: 'Zolder', w: '#e8d2b0', f: '#b98a5a', sp: 64,
    bg: 'linear-gradient(180deg,#5b4636 0,#7a5c43 40%,#8a6a4c 64%,#b98a5a 64%,#a67a4c 100%)',
    decor: [['moon', 78, 20, 17, 1], ['star', 66, 12, 6, 0.9], ['star', 90, 30, 5, 0.9], ['owl', 14, 40, 10, 0.95], ['lightbulb', 42, 8, 8, 0.9]] },
  { id: 'strand', a: 'strandje', e: '🏖️', n: 'Strand', w: '#bfe9ff', f: '#f6dfa4', sp: 58,
    bg: 'linear-gradient(180deg,#8fd3ff 0,#c9efff 34%,#5db7e8 34%,#7fd0f2 58%,#f6dfa4 58%,#efd08a 100%)',
    decor: [['sun', 80, 12, 15, 1], ['cloud', 22, 12, 16, 0.95], ['boat', 60, 36, 11, 0.95], ['wave', 36, 50, 14, 0.85], ['palm', 8, 52, 17, 1]] },
  { id: 'ruimte', a: 'sterrenwacht', e: '🔭', n: 'Sterrenwacht', w: '#2a2a5c', f: '#3c3c7a', sp: 66,
    bg: 'radial-gradient(circle at 70% 24%,#4b3aa0 0,#1d1b4d 55%,#0d0c2b 100%)',
    decor: [['planet', 18, 18, 15, 1], ['comet', 74, 14, 12, 1], ['star', 44, 10, 6, 1], ['star', 90, 40, 5, 0.9], ['earth', 52, 36, 10, 0.95], ['satellite', 30, 44, 9, 0.9]] },
];
export const R4_ROOM_BY = Object.fromEntries(R4_ROOMS.map((r) => [r.id, r]));
// meubels: [id, naam, kamer (art-id), prijs, niveau, 3D-icoon, emoji]
export const R4_FURN = [
  ['r4-schatkist', 'Schatkist', 'zolderkamer', 60, 3, 'chest', '🧰'], ['r4-oudekaart', 'Oude kaart', 'zolderkamer', 35, 2, 'map', '🗺️'], ['r4-zandloper', 'Zandloper', 'zolderkamer', 30, 1, 'hourglass', '⏳'],
  ['r4-toverboek', 'Toverboek', 'zolderkamer', 55, 4, 'book', '📖'], ['r4-spookje', 'Vriendelijk spookje', 'zolderkamer', 70, 5, 'ghost', '👻'], ['r4-kristal', 'Kristal', 'zolderkamer', 90, 7, 'crystal', '🔮'],
  ['r4-sleutel', 'Gouden sleutel', 'zolderkamer', 45, 3, 'key', '🗝️'], ['r4-toverstaf', 'Toverstaf', 'zolderkamer', 80, 6, 'wand', '🪄'],
  ['r4-palmpje', 'Palmpje', 'strandje', 40, 1, 'palm', '🌴'], ['r4-krab', 'Krab', 'strandje', 30, 1, 'crab', '🦀'], ['r4-zeilboot', 'Zeilbootje', 'strandje', 65, 3, 'boat', '⛵'],
  ['r4-golf', 'Golf', 'strandje', 25, 1, 'wave', '🌊'], ['r4-strandschelp', 'Parelschelp', 'strandje', 35, 2, 'shell', '🐚'], ['r4-walvis', 'Walvis', 'strandje', 100, 7, 'whale', '🐳'],
  ['r4-zeemeermin', 'Zeemeermin', 'strandje', 120, 9, 'mermaid', '🧜'], ['r4-kwal', 'Kwal', 'strandje', 50, 4, 'jellyfish', '🪼'],
  ['r4-planeet', 'Planeet', 'sterrenwacht', 80, 5, 'planet', '🪐'], ['r4-komeet', 'Komeet', 'sterrenwacht', 70, 4, 'comet', '☄️'], ['r4-astronaut', 'Astronaut', 'sterrenwacht', 110, 8, 'astronaut', '🧑‍🚀'],
  ['r4-ufo', 'Ufo', 'sterrenwacht', 130, 10, 'ufo', '🛸'], ['r4-alien', 'Vriendelijke alien', 'sterrenwacht', 90, 6, 'alien', '👽'], ['r4-satelliet', 'Satelliet', 'sterrenwacht', 75, 5, 'satellite', '🛰️'],
  ['r4-ruimteraket', 'Ruimteraket', 'sterrenwacht', 140, 11, 'rocket', '🚀'], ['r4-maanvlag', 'Maanvlag', 'sterrenwacht', 40, 2, 'flag', '🚩'],
];
// Zet de extra meubels in de bestaande tabellen van huisdier-more.js (MORE_FURN en FURN_META worden dezelfde objecten gedeeld).
export function registerR4Furniture(moreFurn, furnMeta) {
  for (const f of R4_FURN) {
    if (moreFurn.some((x) => x[0] === f[0])) continue;
    moreFurn.push(f);
    furnMeta[f[0]] = { id: f[0], name: f[1], room: f[2], price: f[3], minLevel: f[4], ic: f[5], e: f[6] };
  }
}
// Breidt de kamer-module uit met de nieuwe kamers (plekken en vloerhoogte); bestaande kamers blijven gelijk.
export function extendRoomsR4(ar) {
  if (!ar) return ar;
  const out = Object.assign({}, ar);
  out.SLOT_POS = Object.assign({}, ar.SLOT_POS); out.FLOOR_Y = Object.assign({}, ar.FLOOR_Y);
  const base = (ar.SLOT_POS && ar.SLOT_POS.speelkamer) || [];
  for (const r of R4_ROOMS) { out.SLOT_POS[r.a] = base.map((p) => ({ ...p })); out.FLOOR_Y[r.a] = 78; }
  return out;
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Achtergrond van een nieuwe kamer als HTML-laag over de standaard kamer-SVG; urlOf(naam) geeft 3D-url of null.
export function roomBackdropHTML(roomId, urlOf, emojiOf) {
  const r = R4_ROOM_BY[roomId]; if (!r) return '';
  const deco = r.decor.map(([ic, x, y, w, al]) => {
    const u = urlOf ? urlOf(ic) : null;
    const inner = u ? `<img src="${esc(u)}" alt="" draggable="false" style="width:100%;height:auto;display:block">` : `<span style="font-size:${Math.max(14, w * 3)}px">${esc(emojiOf ? emojiOf(ic) : '⭐')}</span>`;
    return `<div class="hd-r4d" style="left:${x}%;top:${y}%;width:${w}%;opacity:${al}">${inner}</div>`;
  }).join('');
  return `<div class="hd-r4bg" style="background:${r.bg}">${deco}</div>`;
}

/* =====================================================================
   5. VERZAMELALBUM: 7 sets x 8 plaatjes
   ===================================================================== */
export const ALBUM_SETS = [
  { id: 'boer', n: 'Boerderij', ic: 'barn', items: [['cow', 'Koe'], ['pig', 'Varken'], ['chicken', 'Kip'], ['sheep', 'Schaap'], ['horse', 'Paard'], ['barn', 'Schuur'], ['tractor', 'Tractor'], ['windmill', 'Molen']] },
  { id: 'bos', n: 'Bos', ic: 'pine', items: [['fox', 'Vos'], ['owl', 'Uil'], ['bear', 'Beer'], ['tree', 'Boom'], ['mushroom', 'Paddenstoel'], ['pine', 'Dennenboom'], ['leaf', 'Blad'], ['snail', 'Slak']] },
  { id: 'zee', n: 'Oceaan', ic: 'whale', items: [['fish', 'Vis'], ['shark', 'Haai'], ['crab', 'Krab'], ['whale', 'Walvis'], ['octopus', 'Octopus'], ['jellyfish', 'Kwal'], ['turtle', 'Schildpad'], ['shell', 'Schelp']] },
  { id: 'safari', n: 'Safari', ic: 'lion', items: [['lion', 'Leeuw'], ['elephant', 'Olifant'], ['monkey', 'Aap'], ['panda', 'Panda'], ['frog', 'Kikker'], ['duck', 'Eend'], ['cactus', 'Cactus'], ['sun', 'Zon']] },
  { id: 'fantasie', n: 'Fantasie', ic: 'unicorn', items: [['unicorn', 'Eenhoorn'], ['dragon', 'Draak'], ['wizard', 'Tovenaar'], ['fairy', 'Fee'], ['mermaid', 'Zeemeermin'], ['ghost', 'Spookje'], ['robot', 'Robot'], ['dino', 'Dino']] },
  { id: 'ruimte', n: 'Ruimte', ic: 'rocket', items: [['rocket', 'Raket'], ['planet', 'Planeet'], ['comet', 'Komeet'], ['astronaut', 'Astronaut'], ['ufo', 'Ufo'], ['satellite', 'Satelliet'], ['moon', 'Maan'], ['alien', 'Alien']] },
  { id: 'feest', n: 'Feestdagen', ic: 'gift', items: [['gift', 'Cadeau'], ['balloon', 'Ballon'], ['cake', 'Taart'], ['egg', 'Paasei'], ['crown', 'Kroon'], ['heart', 'Hartje'], ['snowflake', 'Sneeuwvlok'], ['flame', 'Kampvuur']] },
];
export const ALBUM = ALBUM_SETS.flatMap((s, si) => s.items.map(([ic, n], i) => ({ idx: si * 8 + i, set: s.id, ic, n, rare: i >= 6 })));
export const ALBUM_N = ALBUM.length; // 56
const akey = (i) => (i < 28 ? 'albaa' : 'albab');
export const albumHas = (st, i) => !!((((st && st[akey(i)]) | 0) >> (i % 28)) & 1);
export const albumCount = (st) => { let n = 0; for (let i = 0; i < ALBUM_N; i++) if (albumHas(st, i)) n++; return n; };
export const albumSetCount = (st, si) => { let n = 0; for (let i = 0; i < 8; i++) if (albumHas(st, si * 8 + i)) n++; return n; };
export const setComplete = (st, si) => albumSetCount(st, si) === 8;
export const setsDone = (st) => ALBUM_SETS.reduce((a, _, si) => a + (setComplete(st, si) ? 1 : 0), 0);
export const setClaimed = (st, si) => !!((((st && st.albclm) | 0) >> si) & 1);
export function albumAdd(st, i) { // schrijft in st (kopie door de aanroeper); geeft true als nieuw
  if (!(i >= 0 && i < ALBUM_N) || albumHas(st, i)) return false;
  st[akey(i)] = ((st[akey(i)] | 0) | (1 << (i % 28))) >>> 0; return true;
}
// Trek n plaatjes. Rare plaatjes komen half zo vaak. Minstens één nieuw plaatje per pakje zolang het album niet vol is.
export function drawStickers(n, st, rnd = Math.random) {
  const pick = (pool) => { const w = pool.map((i) => (ALBUM[i].rare ? 0.5 : 1)); let x = rnd() * w.reduce((a, b) => a + b, 0); for (let k = 0; k < pool.length; k++) { if (x < w[k]) return pool[k]; x -= w[k]; } return pool[pool.length - 1]; };
  const all = ALBUM.map((a) => a.idx), missing = all.filter((i) => !albumHas(st, i)), out = [];
  for (let k = 0; k < n; k++) out.push(pick(k === 0 && missing.length ? missing : all));
  return out;
}
export const PACK_COST = 20, PACK_PER_DAY_FREE = 1, SET_BONUS = 25, PACKS_MAX = 5;
export const dayInt = (d) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

/* =====================================================================
   6. TRUCJES
   ===================================================================== */
export const TRICKS = [
  { id: 'zit', n: 'Zit', e: '🪑', lv: 1, d: 'Netjes blijven zitten.' }, { id: 'poot', n: 'Pootje geven', e: '🤝', lv: 1, d: 'Een pootje voor jou.' },
  { id: 'rol', n: 'Rol rond', e: '🌀', lv: 2, d: 'Een hele rol over de grond.' }, { id: 'spring', n: 'Hoge sprong', e: '🦘', lv: 3, d: 'Boing! Hoog de lucht in.' },
  { id: 'dans', n: 'Dansje', e: '💃', lv: 4, d: 'Op de maat van de muziek.' }, { id: 'draai', n: 'Pirouette', e: '🩰', lv: 5, d: 'Een sierlijke draai.' },
  { id: 'zing', n: 'Liedje zingen', e: '🎤', lv: 6, d: 'Een heel eigen liedje.' }, { id: 'hand', n: 'Handstand', e: '🤸', lv: 7, d: 'Op zijn kop, maar blij!' },
  { id: 'salto', n: 'Salto', e: '🎪', lv: 9, d: 'Een dubbele draai in de lucht.' }, { id: 'tover', n: 'Toverkunst', e: '🎩', lv: 12, d: 'Abracadabra!' },
];
export const TRICK_BY = Object.fromEntries(TRICKS.map((t) => [t.id, t]));
export const TRICK_STEPS = [3, 8, 15]; // geslaagde oefeningen voor 1, 2 en 3 sterren
export const trickKey = (id) => 'k' + id;
export const trickCount = (st, id) => (st && st[trickKey(id)]) | 0;
export const trickStars = (st, id) => { const n = trickCount(st, id); return TRICK_STEPS.filter((s) => n >= s).length; };
export const trickTotalStars = (st) => TRICKS.reduce((a, t) => a + trickStars(st, t.id), 0);
export const tricksKnown = (st) => TRICKS.filter((t) => trickStars(st, t.id) >= 1).length;
export const trickLen = (st, id) => 3 + trickStars(st, id); // lengte van de oefenreeks
export const SHOW_PER_DAY = 3;
export const showReward = (stars) => Math.min(15, Math.max(0, stars) * 2);

/* =====================================================================
   7. EXTRA EVENEMENTEN (naast huisdier-more.js)
   ===================================================================== */
const dn = (y, m, d) => Math.round(Date.UTC(y, m - 1, d) / 86400000);
const nthSunday = (y, m, n) => { const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); return 1 + ((7 - first) % 7) + 7 * (n - 1); };
// ids: alleen letters (3-12) want ze worden als `id:jaar` bewaard
const FIXED_R4 = [
  { id: 'knuffeldag', n: 'Knuffeldag', from: [1, 21], to: [1, 21], ic: 'heart', e: '🤗', bonus: 15, say: 'Geef me een knuffel!' },
  { id: 'pidag', n: 'Taartdag', from: [3, 14], to: [3, 14], ic: 'pie', e: '🥧', bonus: 15, say: 'Taart voor iedereen!' },
  { id: 'lentedag', n: 'Eerste lentedag', from: [3, 20], to: [3, 20], ic: 'flower', e: '🌷', bonus: 15, say: 'De lente begint!' },
  { id: 'aardedag', n: 'Dag van de Aarde', from: [4, 22], to: [4, 22], ic: 'earth', e: '🌍', bonus: 20, say: 'Zorg goed voor de wereld!' },
  { id: 'dierendag', n: 'Dierendag', from: [10, 4], to: [10, 4], ic: 'dog', e: '🐾', bonus: 30, say: 'Het is onze dag!' },
  { id: 'sintmaarten', n: 'Sint-Maarten', from: [11, 11], to: [11, 11], ic: 'lightbulb', e: '🏮', bonus: 25, say: 'Sint-Maarten, Sint-Maarten, de koeien hebben staarten!' },
  { id: 'oudnieuw', n: 'Oud en nieuw', from: [12, 31], to: [12, 31], ic: 'balloon', e: '🎆', bonus: 30, say: 'Tien, negen, acht…' },
];
export function r4EventsOn(date) {
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate(), today = dn(y, m, d), out = [];
  for (const ev of FIXED_R4) if (today >= dn(y, ev.from[0], ev.from[1]) && today <= dn(y, ev.to[0], ev.to[1])) out.push({ ...ev });
  if (m === 5 && d === nthSunday(y, 5, 2)) out.push({ id: 'moederdag', n: 'Moederdag', ic: 'flower', e: '💐', bonus: 20, say: 'Voor de liefste mama!' });
  if (m === 6 && d === nthSunday(y, 6, 3)) out.push({ id: 'vaderdag', n: 'Vaderdag', ic: 'trophy', e: '🏆', bonus: 20, say: 'Voor de beste papa!' });
  const [em, ed] = easterDate(y), e0 = dn(y, em, ed);
  if (today >= e0 - 49 && today <= e0 - 47) out.push({ id: 'carnaval', n: 'Carnaval', ic: 'balloon', e: '🎭', bonus: 25, say: 'Alaaf! Wat een feest!' });
  if (today === e0 + 49 || today === e0 + 50) out.push({ id: 'pinksteren', n: 'Pinksteren', ic: 'sun', e: '🕊️', bonus: 20, say: 'Fijne Pinksteren!' });
  return out;
}
// Lijst met de eerstvolgende feestdagen (voor de kalender): [{id,n,e,days,date}] gesorteerd, binnen 400 dagen
export function upcomingEvents(from, evOn, n = 8) {
  const out = [], seen = new Set();
  for (let k = 0; k < 400 && out.length < n; k++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + k, 12);
    for (const ev of evOn(d)) { const key = ev.id; if (seen.has(key) || ev.id === 'verjaardag') continue; seen.add(key); out.push({ id: ev.id, n: ev.n, e: ev.e, ic: ev.ic, bonus: ev.bonus, days: k, date: d }); }
  }
  return out;
}

/* =====================================================================
   8. PRESTATIES (30) - [id, emoji, naam, uitleg, test(s, x)]; x = { age, lv, placed, clothes, furn }
   ===================================================================== */
const stn = (s, k) => (s.st && s.st[k]) | 0;
const hsMax = (s) => Math.max(0, ...Object.values(s.hs || {}));
export const R4_GAME_IDS = ['molletjes', 'hindernis', 'patroon', 'ballonpop', 'fruitmand', 'sorteer'];
const roomPlaced = (s, rooms) => rooms.some((r) => ((s.fp && s.fp[r]) || []).some(Boolean));
export const R4_ACH = [
  ['alb8', '📒', 'Plakboek', '8 plaatjes in je album', (s) => albumCount(s.st) >= 8],
  ['alb24', '📗', 'Verzamelaar', '24 plaatjes in je album', (s) => albumCount(s.st) >= 24],
  ['alb40', '📘', 'Bijna vol', '40 plaatjes in je album', (s) => albumCount(s.st) >= 40],
  ['alb56', '📚', 'Complete collectie', 'Alle 56 plaatjes verzameld', (s) => albumCount(s.st) >= ALBUM_N],
  ['set1', '🧩', 'Eerste set', 'Een hele set in je album vol', (s) => setsDone(s.st) >= 1],
  ['set4', '🏅', 'Setkampioen', '4 sets vol', (s) => setsDone(s.st) >= 4],
  ['set7', '🥇', 'Alle sets vol', 'Alle 7 sets vol', (s) => setsDone(s.st) >= 7],
  ['trick1', '🎓', 'Eerste trucje', 'Je huisdier kent een trucje', (s) => tricksKnown(s.st) >= 1],
  ['trick5', '🐕‍🦺', 'Goed getraind', '5 trucjes geleerd', (s) => tricksKnown(s.st) >= 5],
  ['trick10', '🎪', 'Circusster', 'Alle 10 trucjes geleerd', (s) => tricksKnown(s.st) >= 10],
  ['stars10', '⭐', 'Sterrentraining', '10 trucje-sterren', (s) => trickTotalStars(s.st) >= 10],
  ['stars30', '🌟', 'Meester-dresseur', 'Alle 30 trucje-sterren', (s) => trickTotalStars(s.st) >= 30],
  ['show5', '🎭', 'Op het podium', '5 optredens gegeven', (s) => stn(s, 'shown') >= 5],
  ['show25', '🎬', 'Showster', '25 optredens gegeven', (s) => stn(s, 'shown') >= 25],
  ['tint1', '🎨', 'Verfbeurt', 'Een speciale kleurlaag gekocht', (s) => tintCount(s.st) >= 1],
  ['tint5', '🌈', 'Kleurenkoning', '5 kleurlagen gekocht', (s) => tintCount(s.st) >= 5],
  ['newsp', '🦊', 'Nieuw soort', 'Een huisdier van de nieuwe soorten', (s) => isR4Species(s.type)],
  ['acc4', '🎩', 'Modeshow', '4 nieuwe kledingstukken bezitten', (s) => (s.own || []).filter((i) => R4_ACC_BY[i]).length >= 4],
  ['acc12', '👑', 'Garderobe vol', '12 nieuwe kledingstukken bezitten', (s) => (s.own || []).filter((i) => R4_ACC_BY[i]).length >= 12],
  ['attic', '🕯️', 'Zolderkamer', 'Een meubel op de zolder gezet', (s) => roomPlaced(s, ['zolder'])],
  ['beach', '🏖️', 'Strandwacht', 'Een meubel op het strand gezet', (s) => roomPlaced(s, ['strand'])],
  ['stars', '🔭', 'Sterrenkijker', 'Een meubel in de sterrenwacht gezet', (s) => roomPlaced(s, ['ruimte'])],
  ['rooms3', '🏘️', 'Huis vol kamers', 'In alle drie de nieuwe kamers meubels gezet', (s) => roomPlaced(s, ['zolder']) && roomPlaced(s, ['strand']) && roomPlaced(s, ['ruimte'])],
  ['rg10', '🕹️', 'Spelletjesfan', '10 nieuwe spelletjes gespeeld', (s) => stn(s, 'rgame') >= 10],
  ['rg50', '🎮', 'Spelletjesheld', '50 nieuwe spelletjes gespeeld', (s) => stn(s, 'rgame') >= 50],
  ['rgall', '🧭', 'Alles geprobeerd', 'Alle 6 nieuwe spelletjes gespeeld', (s) => R4_GAME_IDS.every((g) => (s.hs && s.hs[g] > 0))],
  ['hs80', '🎯', 'Topscore', 'Ergens 80 punten of meer gehaald', (s) => hsMax(s) >= 80],
  ['hs100', '💯', 'Perfect!', 'Een spelletje met 100 punten', (s) => hsMax(s) >= 100],
  ['cal', '📅', 'Feestkalender', 'De feestkalender bekeken', (s) => stn(s, 'calvis') >= 1],
  ['packs20', '🎁', 'Pakjesfan', '20 plaatjespakjes geopend', (s) => stn(s, 'packsop') >= 20],
].map(([id, e, n, d, t]) => ({ id: 'r4' + id, e, n, d, t }));

/* =====================================================================
   9. CSS voor de nieuwe onderdelen
   ===================================================================== */
const tsel = (id) => ['svg', '.hd-mixwrap', '.hd-sc'].map((c) => `.r4-t-${id}>${c},.r4-t-${id}>span>${c}`).join(',');
export const R4_CSS = `
.hd-r4bg{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.hd-r4d{position:absolute;transform:translate(-50%,-50%);pointer-events:none}
.hd-r4i{position:absolute;left:4%;top:4%;width:92%;height:92%;object-fit:contain;pointer-events:none}.hd-r4e{position:absolute;inset:8% 0 0 0;font-size:min(34vw,170px);line-height:1;text-align:center}
${R4_TINTS.map((t) => `${tsel(t.id)}{filter:${t.f}}`).join('')}
@keyframes r4-rb{from{filter:hue-rotate(0deg) saturate(1.5)}to{filter:hue-rotate(360deg) saturate(1.5)}}
${tsel('regenboog')}{animation:r4-rb 6s linear infinite}
@keyframes r4-a-zit{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.86) translateY(6%)}}
@keyframes r4-a-poot{0%,100%{transform:rotate(0)}30%{transform:rotate(-10deg)}60%{transform:rotate(8deg)}}
@keyframes r4-a-rol{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes r4-a-spring{0%,100%{transform:translateY(0)}45%{transform:translateY(-38%)}}
@keyframes r4-a-dans{0%,100%{transform:translateX(0) rotate(0)}25%{transform:translateX(-12%) rotate(-8deg)}75%{transform:translateX(12%) rotate(8deg)}}
@keyframes r4-a-draai{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}
@keyframes r4-a-zing{0%,100%{transform:scale(1)}50%{transform:scale(1.12) rotate(-3deg)}}
@keyframes r4-a-hand{0%,100%{transform:rotate(0)}40%,70%{transform:rotate(180deg)}}
@keyframes r4-a-salto{0%{transform:translateY(0) rotate(0)}50%{transform:translateY(-40%) rotate(-180deg)}100%{transform:translateY(0) rotate(-360deg)}}
@keyframes r4-a-tover{0%,100%{transform:scale(1);filter:none}50%{transform:scale(1.2);filter:brightness(1.4) hue-rotate(60deg)}}
${TRICKS.map((t) => `.r4-do-${t.id}{animation:r4-a-${t.id} 1.1s ease-in-out 2}`).join('')}
@media (prefers-reduced-motion:reduce){${tsel('regenboog')}{animation:none}${TRICKS.map((t) => `.r4-do-${t.id}`).join(',')}{animation:none!important}}
`;
