// huisdier-more.js - extra inhoud voor het Huisdier: +14 etenswaren, +4 speeltjes, +24 meubels (3D-iconen), seizoenen en evenementen.
// Pure data en kleine functies, GEEN imports (testbaar in node). De 3D-plaatjes komen via urlOf(naam) van huisdier-gfx.js.
// Bestaande saves blijven kloppen: nieuwe id's worden alleen toegevoegd; een onbekend id wordt zoals voorheen genegeerd.

// ---- eten: { id, e (emoji-terugval), n, p (prijs), sv (verkoopwaarde), f: [honger, geluk, energie, schoon], lv (niveau), ic (3D-icoon) }
export const MORE_FOODS = [
  { id: 'hamburger', e: '🍔', n: 'Hamburger', p: 11, sv: 5, f: [32, 8, 2, -4], lv: 4, ic: 'burger' },
  { id: 'hotdog', e: '🌭', n: 'Hotdog', p: 9, sv: 4, f: [26, 8, 0, -3], lv: 4, ic: 'hotdog' },
  { id: 'cupcake', e: '🧁', n: 'Cupcake', p: 7, sv: 3, f: [10, 18, 0, -2], lv: 2, ic: 'cupcake' },
  { id: 'snoepje', e: '🍬', n: 'Snoepje', p: 3, sv: 1, f: [3, 12, 4, -1], lv: 1, ic: 'candy' },
  { id: 'lolly', e: '🍭', n: 'Lolly', p: 4, sv: 2, f: [3, 14, 2, -2], lv: 1, ic: 'lollipop' },
  { id: 'eitje', e: '🥚', n: 'Eitje', p: 4, sv: 2, f: [14, 2, 6, 0], lv: 2, ic: 'egg' },
  { id: 'watermeloen', e: '🍉', n: 'Watermeloen', p: 6, sv: 3, f: [16, 6, 4, 4], lv: 3, ic: 'watermelon' },
  { id: 'pannenkoek', e: '🥞', n: 'Pannenkoek', p: 8, sv: 4, f: [24, 10, 2, -2], lv: 3 },
  { id: 'wafel', e: '🧇', n: 'Wafel', p: 8, sv: 4, f: [20, 14, 0, -3], lv: 5 },
  { id: 'kersen', e: '🍒', n: 'Kersen', p: 6, sv: 3, f: [12, 10, 2, 0], lv: 2 },
  { id: 'ananas', e: '🍍', n: 'Ananas', p: 7, sv: 3, f: [16, 8, 6, 2], lv: 6 },
  { id: 'chocolade', e: '🍫', n: 'Chocolade', p: 6, sv: 3, f: [8, 20, 6, -2], lv: 3 },
  { id: 'kiwi', e: '🥝', n: 'Kiwi', p: 5, sv: 2, f: [12, 4, 8, 2], lv: 5 },
  { id: 'mango', e: '🥭', n: 'Mango', p: 8, sv: 4, f: [18, 10, 6, 0], lv: 7 },
];

// ---- speelgoed voor cadeaus: [id, emoji, naam, icoon]
export const MORE_TOYS = [
  ['dobbel', '🎲', 'Dobbelsteen', 'dice'], ['drum', '🥁', 'Trommel', 'drum'], ['gitaar2', '🎸', 'Gitaar', 'guitar'], ['sterretje', '⭐', 'Sterretje', 'star'],
];

// ---- meubels: [id, naam, kamer (id in huisdier-art-rooms.js), prijs, niveau, 3D-icoon, emoji-terugval]
export const MORE_FURN = [
  ['i-trofee', 'Trofee', 'woonkamer', 60, 4, 'trophy', '🏆'], ['i-aardbol', 'Aardbol', 'woonkamer', 75, 5, 'earth', '🌍'], ['i-kasteel', 'Modelkasteel', 'woonkamer', 120, 9, 'castle', '🏰'],
  ['i-pianootje', 'Pianootje', 'woonkamer', 95, 6, 'piano', '🎹'], ['i-lamp', 'Gloeilamp', 'woonkamer', 35, 2, 'lightbulb', '💡'],
  ['i-taart', 'Taartstandaard', 'keuken', 45, 3, 'cake', '🎂'], ['i-koffie', 'Koffiekop', 'keuken', 25, 2, 'coffee', '☕'], ['i-brood', 'Brood op plank', 'keuken', 30, 2, 'bread', '🍞'],
  ['i-maan', 'Maan', 'slaapkamer', 55, 4, 'moon', '🌙'], ['i-beer', 'Knuffelbeer', 'slaapkamer', 40, 2, 'bear', '🐻'], ['i-ster', 'Sterrenlicht', 'slaapkamer', 35, 2, 'star', '⭐'],
  ['i-schelp', 'Grote schelp', 'badkamer', 25, 2, 'shell', '🐚'], ['i-eend', 'Badeend', 'badkamer', 35, 2, 'duck', '🦆'], ['i-vis', 'Zeepvis', 'badkamer', 30, 2, 'fish', '🐟'],
  ['i-boom', 'Grote boom', 'tuin', 60, 3, 'tree', '🌳'], ['i-palm', 'Palmboom', 'tuin', 55, 3, 'palm', '🌴'], ['i-tent', 'Kampeertent', 'tuin', 85, 5, 'tent', '⛺'], ['i-vuurtoren', 'Vuurtoren', 'tuin', 130, 10, 'lighthouse', '🗼'],
  ['i-draak', 'Draak', 'speelkamer', 110, 8, 'dragon', '🐉'], ['i-robot', 'Robot', 'speelkamer', 90, 6, 'robot', '🤖'], ['i-carrousel', 'Draaimolen', 'speelkamer', 150, 10, 'carousel', '🎠'],
  ['i-raket', 'Raket', 'speelkamer', 100, 7, 'rocket', '🚀'], ['i-trein', 'Speelgoedtrein', 'speelkamer', 80, 5, 'train', '🚆'], ['i-dobbel', 'Reuzendobbelsteen', 'speelkamer', 20, 1, 'dice', '🎲'],
];
export const FURN_META = Object.fromEntries(MORE_FURN.map(([id, name, room, price, minLevel, ic, e]) => [id, { id, name, room, price, minLevel, ic, e }]));
export const extraFurniture = () => MORE_FURN.map(([id, name, room, price, minLevel]) => ({ id, name, room, price, minLevel, extra: true }));
export const isExtraFurn = (id) => Object.prototype.hasOwnProperty.call(FURN_META, id);

const xmlEsc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// SVG voor een extra meubel in hetzelfde formaat als furnitureSVG() uit huisdier-art-rooms.js (viewBox -6 -8 112 112)
export function furnitureSvg(id, size, urlOf) {
  const m = FURN_META[id]; if (!m) return '';
  const url = urlOf ? urlOf(m.ic) : null;
  const sz = size ? ` width="${size}" height="${size}"` : '';
  const body = url
    ? `<ellipse cx="50" cy="90" rx="30" ry="6" fill="rgba(60,40,80,.22)"/><image href="${xmlEsc(url)}" x="8" y="4" width="84" height="84" preserveAspectRatio="xMidYMid meet"/>`
    : `<ellipse cx="50" cy="90" rx="28" ry="6" fill="rgba(60,40,80,.2)"/><text x="50" y="68" font-size="64" text-anchor="middle" font-family="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif">${m.e}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -8 112 112" overflow="visible"${sz} role="img" aria-label="${xmlEsc(m.name)}">${body}</svg>`;
}
// Uitbreiden van de module huisdier-art-rooms.js zonder die te wijzigen: geeft een nieuw object met extra meubels.
export function extendRooms(m, urlOf) {
  const ext = Object.assign({}, m);
  ext.FURNITURE = (m.FURNITURE || []).concat(extraFurniture());
  ext.furnitureSVG = (id, size, o) => (isExtraFurn(id) ? furnitureSvg(id, size, urlOf) : m.furnitureSVG(id, size, o));
  return ext;
}
// Overlay-plaatjes voor geplaatste extra meubels in de kamer (de kamer-SVG kent ze niet): [{id, x, y, w}] in % van de kamer
export function overlaySpots(fp, slotPos, roomArt) {
  const out = [];
  (fp || []).forEach((id, i) => {
    const m = id && FURN_META[id]; if (!m || m.room !== roomArt) return;
    const p = (slotPos || [])[i]; if (!p) return;
    out.push({ id, i, x: p.x, y: p.y, w: Math.round(26 * (p.s || 1) * 10) / 10 });
  });
  return out;
}

// ---------------------------------------------------------------- seizoenen en evenementen
export const SEASONS = {
  lente: { id: 'lente', name: 'Lente', ic: 'flower', e: '🌸', particles: ['flower', 'butterfly', 'bee'] },
  zomer: { id: 'zomer', name: 'Zomer', ic: 'sun', e: '☀️', particles: ['sun', 'butterfly', 'icecream'] },
  herfst: { id: 'herfst', name: 'Herfst', ic: 'leaf', e: '🍂', particles: ['leaf', 'mushroom', 'leaf'] },
  winter: { id: 'winter', name: 'Winter', ic: 'snowflake', e: '❄️', particles: ['snowflake', 'snowflake', 'star'] },
};
export function seasonOf(date) {
  const m = date.getMonth() + 1, d = date.getDate(), md = m * 100 + d;
  if (md >= 320 && md < 621) return SEASONS.lente;
  if (md >= 621 && md < 923) return SEASONS.zomer;
  if (md >= 923 && md < 1221) return SEASONS.herfst;
  return SEASONS.winter;
}
export function easterDate(y) { // Gregoriaans, [maand, dag]
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return [month, day];
}
const dayNo = (y, m, d) => Math.round(Date.UTC(y, m - 1, d) / 86400000);
// vaste evenementen: id, naam, begin [m,d], einde [m,d] (zelfde jaar), icoon, emoji, bonus munten, tekst
const FIXED_EVENTS = [
  { id: 'nieuwjaar', n: 'Nieuwjaar', from: [1, 1], to: [1, 1], ic: 'balloon', e: '🎆', bonus: 25, say: 'Gelukkig nieuwjaar!' },
  { id: 'valentijn', n: 'Valentijnsdag', from: [2, 14], to: [2, 14], ic: 'heart', e: '💘', bonus: 20, say: 'Ik heb je zo lief!' },
  { id: 'koningsdag', n: 'Koningsdag', from: [4, 27], to: [4, 27], ic: 'crown', e: '👑', bonus: 25, say: 'Oranje boven!' },
  { id: 'zomerdag', n: 'Langste dag', from: [6, 21], to: [6, 21], ic: 'sun', e: '🌞', bonus: 15, say: 'Het is de langste dag!' },
  { id: 'halloween', n: 'Halloween', from: [10, 31], to: [10, 31], ic: 'ghost', e: '🎃', bonus: 25, say: 'Boe! Grapje, hoor.' },
  { id: 'sint', n: 'Sinterklaas', from: [12, 5], to: [12, 5], ic: 'gift', e: '🎁', bonus: 30, say: 'Heb jij je schoen gezet?' },
  { id: 'kerst', n: 'Kerst', from: [12, 24], to: [12, 26], ic: 'pine', e: '🎄', bonus: 40, say: 'Fijne kerst!' },
];
export function eventsOn(date, bornMs) {
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate(), today = dayNo(y, m, d), out = [];
  for (const ev of FIXED_EVENTS) if (today >= dayNo(y, ev.from[0], ev.from[1]) && today <= dayNo(y, ev.to[0], ev.to[1])) out.push(ev);
  const [em, ed] = easterDate(y), e0 = dayNo(y, em, ed);
  if (today === e0 || today === e0 + 1) out.push({ id: 'pasen', n: 'Pasen', ic: 'egg', e: '🐣', bonus: 25, say: 'Zoek je mee naar eitjes?' });
  if (bornMs) {
    const b = new Date(bornMs);
    if (b.getMonth() + 1 === m && b.getDate() === d && y > b.getFullYear()) out.push({ id: 'verjaardag', n: 'Verjaardag!', ic: 'cake', e: '🎂', bonus: 50, say: 'Ik ben jarig!', age: y - b.getFullYear() });
  }
  return out;
}
export const eventKey = (ev, date) => `${ev.id}:${date.getFullYear()}`;
export function cleanClaims(arr) { return Array.isArray(arr) ? arr.filter((s) => typeof s === 'string' && /^[a-z]{3,12}:\d{4}$/.test(s)).slice(-40) : []; }
export function claimable(events, claimed, date) { return events.filter((ev) => !claimed.includes(eventKey(ev, date))); }
export function addClaim(claimed, ev, date) { const k = eventKey(ev, date); return claimed.includes(k) ? claimed : cleanClaims(claimed.concat(k)); }

// Deeltjes van het seizoen/evenement boven de kamer: aantal hangt af van kwaliteit (q 0|1|2) en 'reduce' (dan niets).
export function particlePlan(season, events, q, reduce, rand = Math.random) {
  if (reduce) return [];
  const n = [3, 6, 10][Math.max(0, Math.min(2, q | 0))], names = (events[0] ? [events[0].ic].concat(season.particles) : season.particles), out = [];
  for (let i = 0; i < n; i++) out.push({ ic: names[i % names.length], left: Math.round(rand() * 92), size: 18 + Math.round(rand() * 14), delay: Math.round(rand() * 80) / 10, dur: 7 + Math.round(rand() * 60) / 10 });
  return out;
}

// Nieuwe minigames (zie huisdier-minigames.js) krijgen hun id hier zodat de opslag van scores (hs) ze herkent
export const MORE_GAME_IDS = ['sterrenregen', 'lekkerbah', 'iconmemory', 'snelletik'];
