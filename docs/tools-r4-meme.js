// Meme-maker, ronde 4: extra inhoud die meme-core.js erbij zet: 8 achtergronden, 14 sjablonen, 6 filters, 2 stickergroepen en 24 grappige teksten.
// Geen import van meme-core (voorkomt een kringverwijzing): sjablonen verwijzen naar achtergrond-nummers vanaf R4_BG_START (= aantal bestaande achtergronden, 20).
export const R4_BG_START = 20;

const lin = (c, w, h, a, b, ang = 0.6) => { const g = c.createLinearGradient(0, 0, w * Math.cos(ang), h * Math.sin(ang) + h * 0.4); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, w, h); };
const rnd = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export const R4_BGS = [
  ['Schaakbord', (c, w, h) => { const s = 120; for (let y = 0; y * s < h; y++) for (let x = 0; x * s < w; x++) { c.fillStyle = (x + y) % 2 ? '#111827' : '#f9fafb'; c.fillRect(x * s, y * s, s, s); } }],
  ['Confetti', (c, w, h) => { c.fillStyle = '#fef3c7'; c.fillRect(0, 0, w, h); const r = rnd(21), cols = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899']; for (let i = 0; i < 90; i++) { c.fillStyle = cols[i % cols.length]; c.fillRect(r() * w, r() * h, 14 + r() * 22, 8 + r() * 12); } }],
  ['Neon', (c, w, h) => { lin(c, w, h, '#be185d', '#1d4ed8', 1.0); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 6; for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(0, h * i / 6); c.lineTo(w, h * i / 6); c.stroke(); } }],
  ['Karton', (c, w, h) => { c.fillStyle = '#c8955a'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(120,70,30,.35)'; c.lineWidth = 3; for (let y = 20; y < h; y += 26) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } }],
  ['Golven', (c, w, h) => { lin(c, w, h, '#22d3ee', '#1e40af', 1.3); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 8; for (let k = 0; k < 7; k++) { c.beginPath(); for (let x = 0; x <= w; x += 20) { const y = h * (k + 1) / 8 + Math.sin(x / 90 + k) * 24; if (x === 0) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke(); } }],
  ['Radar', (c, w, h) => { c.fillStyle = '#052e16'; c.fillRect(0, 0, w, h); c.strokeStyle = '#4ade80'; c.lineWidth = 4; for (let i = 1; i <= 5; i++) { c.beginPath(); c.arc(w / 2, h / 2, Math.min(w, h) * i / 11, 0, Math.PI * 2); c.stroke(); } c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke(); }],
  ['Vulkaan', (c, w, h) => lin(c, w, h, '#fde047', '#7f1d1d', 1.5)],
  ['Roze wolkjes', (c, w, h) => { lin(c, w, h, '#fbcfe8', '#c4b5fd', 1.2); c.fillStyle = 'rgba(255,255,255,.7)'; const r = rnd(9); for (let i = 0; i < 9; i++) { const x = r() * w, y = r() * h, s = 40 + r() * 50; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x + k * s * 0.7, y + (k % 2) * s * 0.2, s, 0, Math.PI * 2); c.fill(); } } }],
];

const T = (x, y, text, size = 90, extra = {}) => ({ kind: 'text', x, y, text, size, ...extra });
const S = (x, y, icon, size = 300, extra = {}) => ({ kind: 'sticker', x, y, icon, size, ...extra });
const B = (x, y, text, size = 60, extra = {}) => ({ kind: 'bubble', x, y, text, size, ...extra });
const G = R4_BG_START;
export const R4_TEMPLATES = [
  { name: 'Chips-alarm', bg: G + 6, top: 'Wie heeft de chips opgegeten?', bottom: 'Ik niet, zei de hond', layers: [S(0.5, 0.5, 'dog', 460), S(0.2, 0.75, 'fries', 190)] },
  { name: 'Pannenkoektoren', bg: G + 7, top: 'Mijn ontbijt', bottom: 'Nog één, zei ik 7 keer', layers: [S(0.5, 0.55, 'pie', 430), S(0.5, 0.2, 'crown', 200)] },
  { name: 'Robot-huiswerk', bg: G + 5, top: 'Mijn robot maakt mijn huiswerk', bottom: 'Hij kreeg een 4', layers: [S(0.5, 0.5, 'robot', 460), S(0.8, 0.8, 'pencil', 170)] },
  { name: 'Spook-ontbijt', bg: G + 2, top: 'Boe! Wat is er te eten?', bottom: 'Alleen spookeieren', layers: [S(0.5, 0.45, 'ghost', 450), S(0.78, 0.75, 'egg', 190)] },
  { name: 'Kampioen!', bg: G + 1, top: 'Wij hebben gewonnen', bottom: 'Bijna... toch?', layers: [S(0.5, 0.45, 'trophy', 400), S(0.15, 0.2, 'star', 120), S(0.85, 0.2, 'star', 120), S(0.5, 0.82, 'medal', 170)] },
  { name: 'Dino-mail', bg: G + 3, top: 'Nieuwe mail van de dino', bottom: 'Onderwerp: RAAAAWR', layers: [S(0.5, 0.52, 'dino', 480)] },
  { name: 'Sleutelmoment', bg: G + 4, top: 'Waar is mijn sleutel?', bottom: 'In mijn andere broek, bleek', layers: [S(0.5, 0.5, 'key', 380), S(0.2, 0.2, 'house', 170)] },
  { name: 'Zeeheld', bg: G + 4, top: 'Kapitein van de badkuip', bottom: 'Alle eenden aan dek!', layers: [S(0.5, 0.5, 'ship', 440), S(0.2, 0.78, 'duck', 190), S(0.8, 0.78, 'duck', 190)] },
  { name: 'Brief aan de maan', bg: G + 2, top: 'Lieve maan,', bottom: 'Mag ik nog 5 minuutjes?', layers: [S(0.5, 0.5, 'moon', 440), S(0.2, 0.2, 'star', 120), S(0.82, 0.3, 'star', 100)] },
  { name: 'Stroopwafel-ruzie', bg: G + 3, top: 'Er is er maar één over', bottom: 'Dit wordt oorlog', layers: [S(0.5, 0.5, 'cookie', 420), S(0.18, 0.78, 'sword', 200), S(0.82, 0.78, 'shield', 200)] },
  { name: 'Aardappel-tips', bg: G + 7, top: 'Tip van de dag', bottom: 'Eet je aardappels op', layers: [S(0.5, 0.5, 'potion', 330), S(0.5, 0.82, 'carrot', 200)] },
  { name: 'Regenjas-race', bg: G + 4, top: 'Regen? Geen probleem', bottom: 'Behalve voor mijn sokken', layers: [S(0.5, 0.55, 'rain', 400), S(0.5, 0.16, 'cloud', 240)] },
  { name: 'Foto-mislukt', bg: G + 1, top: 'Ik wil een mooie foto', bottom: 'Het werd alleen mijn duim', layers: [S(0.5, 0.5, 'camera', 420), B(0.5, 0.14, 'Zeg kaas!', 56)] },
  { name: 'Pinguïn-baas', bg: G + 6, top: 'Boze pinguïn zegt:', bottom: 'Niet mijn vis aanraken', layers: [S(0.5, 0.52, 'penguin', 470), S(0.8, 0.8, 'fish', 170)] },
];

// ---------- extra filters ----------
export const R4_FILTERS = [['sunset', 'Zonsondergang'], ['matrix', 'Matrix'], ['gold', 'Goud'], ['thermo', 'Warmtecamera'], ['pastel', 'Pastel'], ['popart', 'Pop-art']];
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const mixv = (a, b, t) => a + (b - a) * t;
/** Past een extra filter toe op img.data; geeft true als het filter bestaat. */
export function applyR4Filter(img, id) {
  const d = img.data; let f;
  if (id === 'sunset') f = (r, g, b) => { const t = lum(r, g, b) / 255; return [mixv(60, 255, t) * 1.05, mixv(10, 140, t), mixv(90, 120, t * 0.8)]; };
  else if (id === 'matrix') f = (r, g, b) => { const L = lum(r, g, b); return [L * 0.15, L * 1.1 + 12, L * 0.25]; };
  else if (id === 'gold') f = (r, g, b) => { const t = lum(r, g, b) / 255; return [mixv(40, 255, t), mixv(25, 215, t), mixv(0, 120, t * t)]; };
  else if (id === 'thermo') f = (r, g, b) => { const t = lum(r, g, b) / 255; return t < 0.25 ? [0, t * 4 * 120, 160 + t * 4 * 95] : t < 0.5 ? [0, 120 + (t - 0.25) * 4 * 135, 255 - (t - 0.25) * 4 * 255] : t < 0.75 ? [(t - 0.5) * 4 * 255, 255, 0] : [255, 255 - (t - 0.75) * 4 * 255, 0]; };
  else if (id === 'pastel') f = (r, g, b) => { const L = lum(r, g, b); return [mixv(L, r, 0.55) * 0.7 + 85, mixv(L, g, 0.55) * 0.7 + 85, mixv(L, b, 0.55) * 0.7 + 90]; };
  else if (id === 'popart') f = (r, g, b) => { const L = lum(r, g, b), q = L < 85 ? 0 : L < 170 ? 1 : 2, pal = [[30, 20, 90], [240, 60, 140], [255, 225, 40]]; return pal[q]; };
  else return false;
  const cl = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
  for (let i = 0; i < d.length; i += 4) { const o = f(d[i], d[i + 1], d[i + 2]); d[i] = cl(o[0]); d[i + 1] = cl(o[1]); d[i + 2] = cl(o[2]); }
  return true;
}

// ---------- extra stickers en teksten ----------
export const R4_STICKER_GROUPS = [
  ['Zee en strand', ['whale', 'shark', 'octopus', 'jellyfish', 'crab', 'turtle', 'fish', 'shell', 'submarine', 'wave', 'boat', 'lighthouse', 'palm', 'mermaid']],
  ['Feest en spel', ['balloon', 'cake', 'cupcake', 'gift', 'candy', 'lollipop', 'icecream', 'dice', 'puzzle', 'carousel', 'ferriswheel', 'rollercoaster', 'unicorn', 'rainbow', 'wand', 'crown']],
];
export const R4_FUNNY = [
  ['Mijn plan was simpel', 'Het plan had andere plannen'], ['Ik ben niet lui', 'Ik ben in energiebesparende modus'], ['Wat ik beloofde', 'Wat ik deed: een dutje'],
  ['Kleine stapjes', 'Dat is ook vooruit, zei de slak'], ['Het is geen bug', 'Het is een verrassing'], ['Kijk mama, geen handen!', 'Kijk mama, geen tanden'],
  ['Ik dacht: één chip', 'De zak is leeg, hoe kan dat?'], ['De bel gaat', 'Ik: nog even kijken'], ['Eerst kijken, dan klikken', 'Ik: klikt toch maar'],
  ['Dinsdag 8:15', 'Mijn hersenen zijn nog niet aangesloten'], ['Mijn spreekbeurt', 'Ik zou het kunnen uitleggen met een tekening'], ['Ik help met koken', 'Ik proef alles. Voor de veiligheid.'],
  ['Niemand: echt niemand', 'Mijn buik om 10 uur: eten!'], ['Schaakmat?', 'Nee, de kat zat op het bord'], ['Als je denkt dat je klaar bent', 'Er komt een tweede bladzijde'],
  ['Ik spaar voor een raket', 'Kreeg 2 euro, nog 99.998 te gaan'], ['Als de wifi terugkomt', 'Alles tegelijk updaten'], ['Weekend-modus', 'Aan, en niemand kan me stoppen'],
  ['Spaghetti-ongelukje', 'Het shirt was toch al rood'], ['Ik zei: één minuutje', 'Dat was een uur geleden'], ['De vakantie is voorbij', 'Mijn koffer: nog ongeopend'],
  ['Pizza voor ontbijt?', 'Dat is gewoon vroeg diner'], ['Jaarlijkse vraag', 'Mag er een hond bij?'], ['Heldendaad van de dag', 'Zelf mijn jas aangetrokken'],
];
