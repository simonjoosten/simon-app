// Rekenen: pure logica (geen DOM). Vragen per onderwerp en niveau, antwoord-controle, voortgang, badges,
// dagelijkse uitdaging, race-bots en puzzel-generatoren. Alles is deterministisch met een zaadje (rng) en daardoor testbaar.
import { evaluate } from './rekenen-calc.js?v=1';

/* ---------- toeval ---------- */
export function rng(seed) {
  let a = (typeof seed === 'string' ? hashStr(seed) : seed >>> 0) || 1;
  const f = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return f;
}
export function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
export function shuffle(r, arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const lcm = (a, b) => a / gcd(a, b) * b;

/* ---------- opmaak ---------- */
export const fmtNum = (n) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(4))).replace('.', ','));
const eurS = (n) => '€ ' + (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
const frac = (n, d) => `${n}/${d}`;
export function reduce(n, d) { const g = gcd(n, d); return [n / g, d / g]; }
export function fracStr(n, d) { [n, d] = reduce(n, d); return d === 1 ? String(n) : `${n}/${d}`; }

/* ---------- onderwerpen ---------- */
export const TOPICS = [
  { id: 'tafels', name: 'Tafels', icon: 'star', color: '#f59e0b', desc: 'Maal- en deeltafels', levels: ['2, 5 en 10', '3 en 4', '6 en 7', '8 en 9', 'Alle tafels'] },
  { id: 'optellen', name: 'Plus en min', icon: 'apple', color: '#ef4444', desc: 'Optellen en aftrekken', levels: ['Tot 20', 'Tot 100', 'Over de tien', 'Tot 1000', 'Tot 10.000'] },
  { id: 'groot', name: 'Maal en deel', icon: 'rocket', color: '#8b5cf6', desc: 'Grote vermenigvuldigingen en delingen', levels: ['Tientallen', 'x10, x100', 'Twee-cijferig', 'Delen', 'Grote sommen'] },
  { id: 'breuken', name: 'Breuken', icon: 'pie', color: '#ec4899', desc: 'Taartpunten en breuken', levels: ['Vergelijken', 'Vereenvoudigen', 'Optellen', 'Ongelijke noemers', 'Vermenigvuldigen'] },
  { id: 'procenten', name: 'Procenten', icon: 'money', color: '#10b981', desc: 'Korting, deel van het geheel', levels: ['10%, 50%', '25% en 20%', 'Hoeveel %?', 'Korting', 'BTW en meer'] },
  { id: 'meetkunde', name: 'Meetkunde', icon: 'pyramid', color: '#0ea5e9', desc: 'Omtrek, oppervlakte, hoeken', levels: ['Omtrek', 'Oppervlakte', 'Hoeken', 'Inhoud', 'Cirkels'] },
  { id: 'trucs', name: 'Hoofdrekenen', icon: 'lightbulb', color: '#eab308', desc: 'Slimme trucs', levels: ['Dubbel en half', 'x9, x5, x11', 'x25 en 99', 'Kwadraten', 'Wortels'] },
  { id: 'negatief', name: 'Min en machten', icon: 'bolt', color: '#6366f1', desc: 'Negatieve getallen, machten', levels: ['Boven nul', 'Onder nul', 'Min keer min', 'Machten', 'Volgorde'] },
  { id: 'geld', name: 'Geldzaken', icon: 'bag', color: '#14b8a6', desc: 'Winkelen en sparen', levels: ['Wisselgeld', 'Boodschappen', 'Per stuk', 'Sparen', 'Rente en korting'] },
  { id: 'woord', name: 'Woordsommen', icon: 'book', color: '#f97316', desc: 'Verhaaltjes', levels: ['Eenvoudig', 'Groepjes', 'Twee stappen', 'Tijd en afstand', 'Slim bedenken'] },
  { id: 'reeksen', name: 'Reeksen', icon: 'comet', color: '#a855f7', desc: 'Het patroon vinden', levels: ['Optellen', 'Aftrekken en dubbel', 'Wisselend', 'Bijzonder', 'Uitdaging'] },
];
export const TOPIC = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
export const MAXLEVEL = 5;
const NAMES = ['Sam', 'Noor', 'Daan', 'Lotte', 'Mees', 'Fleur', 'Jesse', 'Lina', 'Tim', 'Sara', 'Finn', 'Yara', 'Bram', 'Eva', 'Milan', 'Zoë'];
const THINGS = [['appels', 'appel'], ['stickers', 'sticker'], ['knikkers', 'knikker'], ['koekjes', 'koekje'], ['kaarten', 'kaart'], ['munten', 'munt'], ['boeken', 'boek'], ['ballonnen', 'ballon']];

/* ---------- vraag-generatoren ---------- */
// Elke generator geeft { q, a (string), kind, expr?, hint, expl, fact?, dec?, needReduced?, choices? }
const num = (q, a, extra = {}) => ({ q, a: typeof a === 'number' ? fmtNum(a) : a, kind: 'num', ...extra });
const choice = (r, q, correct, wrongs, extra = {}) => {
  const set = [correct]; for (const w of wrongs) if (!set.includes(w)) set.push(w);
  return { q, a: correct, kind: 'choice', choices: shuffle(r, set), ...extra };
};

const GEN = {
  tafels(L, r) {
    const sets = [[2, 5, 10], [3, 4], [6, 7], [8, 9], [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]];
    const t = pick(r, sets[L - 1]), m = L === 5 ? ri(r, 2, 12) : ri(r, 1, 10), p = t * m;
    const fact = `${Math.min(t, m)}x${Math.max(t, m)}`;
    const kinds = L <= 2 ? [0] : L === 3 ? [0, 0, 1] : [0, 0, 1, 2];
    const k = pick(r, kinds);
    if (k === 1) return num(`${p} ÷ ${t} = ?`, m, { expr: `${p}/${t}`, fact, hint: `Welke keer ${t} is ${p}?`, expl: `${t} × ${m} = ${p}, dus ${p} ÷ ${t} = ${m}.` });
    if (k === 2) return num(`${t} × ? = ${p}`, m, { expr: `${p}/${t}`, fact, hint: `Deel ${p} door ${t}.`, expl: `${t} × ${m} = ${p}.` });
    return num(`${t} × ${m} = ?`, p, { expr: `${t}*${m}`, fact, hint: m > 1 ? `${t} × ${m - 1} = ${t * (m - 1)}, tel er ${t} bij.` : '', expl: `${t} × ${m} = ${p}.` });
  },
  optellen(L, r) {
    let a, b, op = r() < 0.5 ? '+' : '−';
    if (L === 1) { a = ri(r, 1, 19); b = ri(r, 1, 20 - (op === '+' ? a : 0)); if (op === '−') { a = ri(r, 2, 20); b = ri(r, 1, a); } }
    else if (L === 2) { if (op === '+') { const t1 = ri(r, 1, 8), t2 = ri(r, 1, 9 - t1), e1 = ri(r, 0, 4), e2 = ri(r, 0, 5 - e1 > 0 ? 5 - e1 : 0); a = t1 * 10 + e1; b = t2 * 10 + e2; } else { a = ri(r, 20, 99); b = ri(r, 10, a - 1); } }
    else if (L === 3) {
      if (op === '+') { const ea = ri(r, 4, 9), eb = ri(r, 10 - ea, 9), ta = ri(r, 1, 6), tb = ri(r, 1, 8 - ta); a = ta * 10 + ea; b = tb * 10 + eb; }
      else { const ea = ri(r, 0, 4), eb = ri(r, ea + 1, 9), ta = ri(r, 3, 9), tb = ri(r, 1, ta - 1); a = ta * 10 + ea; b = tb * 10 + eb; }
    }
    else if (L === 4) { a = ri(r, 100, 899); b = ri(r, 50, 999 - (op === '+' ? a : 0)); if (op === '−') { a = ri(r, 200, 999); b = ri(r, 100, a - 1); } }
    else { a = ri(r, 1000, 8999); b = ri(r, 500, 9999 - (op === '+' ? a : 0)); if (op === '−') { a = ri(r, 2000, 9999); b = ri(r, 1000, a - 1); } }
    const v = op === '+' ? a + b : a - b;
    return num(`${a} ${op} ${b} = ?`, v, { expr: op === '+' ? `${a}+${b}` : `${a}-${b}`, hint: L >= 3 ? 'Splits het getal: eerst de tientallen, dan de rest.' : 'Tel stap voor stap.', expl: `${a} ${op} ${b} = ${v}.` });
  },
  groot(L, r) {
    if (L === 1) { const a = ri(r, 2, 9) * 10, b = ri(r, 2, 9); return num(`${a} × ${b} = ?`, a * b, { expr: `${a}*${b}`, hint: `Reken ${a / 10} × ${b} en zet er een 0 achter.`, expl: `${a / 10} × ${b} = ${a / 10 * b}, dus ${a * b}.` }); }
    if (L === 2) { const a = ri(r, 2, 99), m = pick(r, [10, 100]), d = r() < 0.4; if (d) return num(`${a * m} ÷ ${m} = ?`, a, { expr: `${a * m}/${m}`, hint: `Haal ${m === 10 ? 'één' : 'twee'} ${m === 10 ? 'nul' : 'nullen'} weg.`, expl: `${a * m} ÷ ${m} = ${a}.` }); return num(`${a} × ${m} = ?`, a * m, { expr: `${a}*${m}`, hint: `Zet er ${m === 10 ? 'een 0' : 'twee nullen'} achter.`, expl: `${a} × ${m} = ${a * m}.` }); }
    if (L === 3) { const a = ri(r, 11, 25), b = ri(r, 11, 19); return num(`${a} × ${b} = ?`, a * b, { expr: `${a}*${b}`, hint: `${a} × 10 + ${a} × ${b - 10}`, expl: `${a} × 10 = ${a * 10} en ${a} × ${b - 10} = ${a * (b - 10)}; samen ${a * b}.` }); }
    if (L === 4) { const d = ri(r, 3, 12), q = ri(r, 12, 99), p = d * q; return num(`${p} ÷ ${d} = ?`, q, { expr: `${p}/${d}`, hint: 'Hoe vaak past het getal erin?', expl: `${d} × ${q} = ${p}.` }); }
    const a = ri(r, 101, 499), b = ri(r, 3, 9); return num(`${a} × ${b} = ?`, a * b, { expr: `${a}*${b}`, hint: 'Splits: honderdtallen, tientallen en eenheden.', expl: `${a} × ${b} = ${a * b}.` });
  },
  breuken(L, r) {
    if (L === 1) {
      const pairs = [[1, 2, 1, 3], [1, 4, 1, 3], [2, 3, 3, 4], [3, 5, 1, 2], [2, 5, 1, 4], [3, 8, 1, 3], [5, 6, 3, 4], [4, 7, 1, 2], [1, 6, 1, 8]];
      let [a, b, c, d] = pick(r, pairs); if (r() < 0.5) [a, b, c, d] = [c, d, a, b];
      const A = frac(a, b), B = frac(c, d), big = a / b > c / d ? A : B;
      return choice(r, `Welke breuk is groter?`, big, [a / b > c / d ? B : A], { hint: 'Maak de noemers gelijk.', expl: `${A} = ${(a / b).toFixed(2).replace('.', ',')} en ${B} = ${(c / d).toFixed(2).replace('.', ',')}.`, pie: [[a, b], [c, d]] });
    }
    if (L === 2) { const g = ri(r, 2, 6), [n, d] = pick(r, [[1, 2], [1, 3], [2, 3], [3, 4], [1, 4], [2, 5], [3, 5], [5, 6], [3, 8], [4, 5], [7, 8]]); return { q: `${frac(n * g, d * g)} vereenvoudigd = ?`, a: fracStr(n, d), kind: 'frac', needReduced: true, hint: `Deel boven en onder door ${g}.`, expl: `${n * g}/${d * g} = ${n}/${d}.` }; }
    if (L === 3) { const d = ri(r, 3, 12), a = ri(r, 1, d - 2), b = ri(r, 1, d - a - 1 || 1), s = r() < 0.7; const aa = s ? a : a + b, bb = b; const n = s ? a + b : aa - bb; return { q: `${frac(aa, d)} ${s ? '+' : '−'} ${frac(bb, d)} = ?`, a: fracStr(n, d), kind: 'frac', hint: 'De noemer blijft gelijk, tel de tellers.', expl: `${n}/${d} = ${fracStr(n, d)}.` }; }
    if (L === 4) { const dn = pick(r, [[2, 3], [2, 4], [3, 6], [4, 8], [2, 5], [3, 4], [2, 6], [4, 6]]); const [d1, d2] = dn; const n1 = ri(r, 1, d1 - 1), n2 = ri(r, 1, d2 - 1); const l = lcm(d1, d2); const n = n1 * (l / d1) + n2 * (l / d2); return { q: `${frac(n1, d1)} + ${frac(n2, d2)} = ?`, a: fracStr(n, l), kind: 'frac', hint: `Maak de noemers allebei ${l}.`, expl: `${n1 * (l / d1)}/${l} + ${n2 * (l / d2)}/${l} = ${fracStr(n, l)}.` }; }
    if (r() < 0.5) { const [n, d] = pick(r, [[1, 2], [1, 3], [2, 3], [3, 4], [1, 4], [2, 5], [3, 5]]), w = d * ri(r, 2, 6); return num(`${frac(n, d)} van ${w} = ?`, w / d * n, { hint: `Deel door ${d}, maal ${n}.`, expl: `${w} ÷ ${d} = ${w / d}, × ${n} = ${w / d * n}.` }); }
    const [n1, d1] = pick(r, [[1, 2], [2, 3], [3, 4], [1, 3], [2, 5]]), [n2, d2] = pick(r, [[1, 2], [1, 3], [3, 4], [1, 4], [2, 3]]);
    return { q: `${frac(n1, d1)} × ${frac(n2, d2)} = ?`, a: fracStr(n1 * n2, d1 * d2), kind: 'frac', hint: 'Teller keer teller, noemer keer noemer.', expl: `${n1 * n2}/${d1 * d2} = ${fracStr(n1 * n2, d1 * d2)}.` };
  },
  procenten(L, r) {
    if (L === 1) { const p = pick(r, [10, 50, 100, 10, 50]), w = ri(r, 1, 20) * 10; return num(`${p}% van ${w} = ?`, w * p / 100, { hint: p === 10 ? 'Deel door 10.' : p === 50 ? 'Neem de helft.' : '100% is alles.', expl: `${p}% van ${w} is ${w * p / 100}.` }); }
    if (L === 2) { const p = pick(r, [25, 20, 75, 5, 1, 20, 25]), base = p === 25 || p === 75 ? ri(r, 1, 20) * 4 : p === 5 || p === 20 ? ri(r, 1, 20) * 20 : ri(r, 1, 30) * 100; return num(`${p}% van ${base} = ?`, base * p / 100, { hint: p === 25 ? 'Een kwart: deel door 4.' : p === 20 ? 'Eerst 10% en dan keer 2.' : p === 75 ? '3 kwart: deel door 4, keer 3.' : p === 5 ? 'Eerst 10%, dan de helft.' : 'Deel door 100.', expl: `${p}% van ${base} = ${base * p / 100}.` }); }
    if (L === 3) { const y = pick(r, [20, 40, 50, 60, 80, 100, 200]), pc = pick(r, [10, 20, 25, 50, 75]), x = y * pc / 100; if (!Number.isInteger(x)) return GEN.procenten(3, r); return num(`${fmtNum(x)} is hoeveel % van ${y}?`, pc, { hint: `Deel ${fmtNum(x)} door ${y} en maal 100.`, expl: `${fmtNum(x)} ÷ ${y} = ${pc / 100}, dus ${pc}%.` }); }
    if (L === 4) { const price = ri(r, 2, 20) * 10, p = pick(r, [10, 20, 25, 50]), n = price * (100 - p) / 100; return num(`Een jas kost €${price}. Nu ${p}% korting. Wat kost de jas nu (in euro)?`, n, { dec: true, hint: `Reken eerst de korting uit: ${p}% van ${price}.`, expl: `Korting ${price * p / 100}, dus ${price} − ${price * p / 100} = ${n}.` }); }
    const price = ri(r, 1, 10) * 100, v = pick(r, [10, 21, 5, 20, 50]); return num(`Een prijs van ${price} wordt ${v}% duurder. Nieuwe prijs?`, price * (100 + v) / 100, { dec: true, hint: `${v}% van ${price} komt erbij.`, expl: `${price} + ${price * v / 100} = ${price * (100 + v) / 100}.` });
  },
  meetkunde(L, r) {
    if (L === 1) { if (r() < 0.5) { const s = ri(r, 2, 15); return num(`Een vierkant met zijde ${s} cm. Wat is de omtrek (cm)?`, 4 * s, { hint: 'Vier gelijke zijden.', expl: `4 × ${s} = ${4 * s}.`, shape: ['rect', s, s] }); } const l = ri(r, 3, 20), b = ri(r, 2, l); return num(`Een rechthoek van ${l} bij ${b} cm. Wat is de omtrek (cm)?`, 2 * (l + b), { hint: 'Tel alle vier de zijden op.', expl: `2 × (${l} + ${b}) = ${2 * (l + b)}.`, shape: ['rect', l, b] }); }
    if (L === 2) { if (r() < 0.4) { const s = ri(r, 2, 15); return num(`Een vierkant met zijde ${s} cm. Wat is de oppervlakte (cm²)?`, s * s, { hint: 'Zijde keer zijde.', expl: `${s} × ${s} = ${s * s}.`, shape: ['rect', s, s] }); } const l = ri(r, 3, 20), b = ri(r, 2, 12); return num(`Een rechthoek van ${l} bij ${b} cm. Wat is de oppervlakte (cm²)?`, l * b, { hint: 'Lengte keer breedte.', expl: `${l} × ${b} = ${l * b}.`, shape: ['rect', l, b] }); }
    if (L === 3) { const k = pick(r, [0, 1, 2]); if (k === 0) { const a = ri(r, 30, 80), b = ri(r, 30, 90 - 1); return num(`Twee hoeken van een driehoek zijn ${a}° en ${b}°. Hoe groot is de derde hoek (°)?`, 180 - a - b, { hint: 'Samen is een driehoek 180°.', expl: `180 − ${a} − ${b} = ${180 - a - b}.` }); } if (k === 1) { const bs = ri(r, 2, 12) * 2, h = ri(r, 2, 15); return num(`Een driehoek met basis ${bs} cm en hoogte ${h} cm. Wat is de oppervlakte (cm²)?`, bs * h / 2, { hint: 'Basis keer hoogte gedeeld door 2.', expl: `${bs} × ${h} ÷ 2 = ${bs * h / 2}.` }); } const a = ri(r, 60, 120), b = ri(r, 60, 120), c = ri(r, 40, 100); return num(`Drie hoeken van een vierhoek: ${a}°, ${b}° en ${c}°. De vierde hoek (°)?`, 360 - a - b - c, { hint: 'Een vierhoek heeft samen 360°.', expl: `360 − ${a} − ${b} − ${c} = ${360 - a - b - c}.` }); }
    if (L === 4) { if (r() < 0.4) { const s = ri(r, 2, 10); return num(`Een kubus met ribbe ${s} cm. Wat is de inhoud (cm³)?`, s ** 3, { hint: 'Ribbe × ribbe × ribbe.', expl: `${s} × ${s} × ${s} = ${s ** 3}.` }); } const l = ri(r, 2, 12), b = ri(r, 2, 10), h = ri(r, 2, 9); return num(`Een balk van ${l} × ${b} × ${h} cm. Wat is de inhoud (cm³)?`, l * b * h, { hint: 'Lengte × breedte × hoogte.', expl: `${l} × ${b} × ${h} = ${l * b * h}.` }); }
    const rr = ri(r, 1, 10); if (r() < 0.5) return num(`Een cirkel met straal ${rr} cm. Omtrek (cm)? Gebruik π = 3,14.`, Number((2 * 3.14 * rr).toFixed(2)), { dec: true, hint: '2 × 3,14 × straal.', expl: `2 × 3,14 × ${rr} = ${fmtNum(Number((2 * 3.14 * rr).toFixed(2)))}.` });
    return num(`Een cirkel met straal ${rr} cm. Oppervlakte (cm²)? Gebruik π = 3,14.`, Number((3.14 * rr * rr).toFixed(2)), { dec: true, hint: '3,14 × straal × straal.', expl: `3,14 × ${rr} × ${rr} = ${fmtNum(Number((3.14 * rr * rr).toFixed(2)))}.` });
  },
  trucs(L, r) {
    if (L === 1) { if (r() < 0.5) { const a = ri(r, 12, 99); return num(`Het dubbele van ${a} = ?`, a * 2, { expr: `${a}*2`, hint: 'Dubbel de tientallen en de eenheden apart.', expl: `${a} × 2 = ${a * 2}.` }); } const a = ri(r, 6, 49) * 2; return num(`De helft van ${a} = ?`, a / 2, { expr: `${a}/2`, hint: 'Halveer eerst de tientallen.', expl: `${a} ÷ 2 = ${a / 2}.` }); }
    if (L === 2) { const k = pick(r, [9, 5, 11]), a = k === 11 ? ri(r, 12, 45) : ri(r, 3, 30); return num(`${a} × ${k} = ?`, a * k, { expr: `${a}*${k}`, hint: k === 9 ? `${a} × 10 − ${a}` : k === 5 ? `${a} × 10 gedeeld door 2` : 'Schrijf de cijfers uit elkaar en zet hun som ertussen.', expl: `${a} × ${k} = ${a * k}.` }); }
    if (L === 3) { const k = pick(r, [25, 50, 99, 101]), a = k === 25 || k === 50 ? ri(r, 2, 24) * 2 : ri(r, 3, 40); return num(`${a} × ${k} = ?`, a * k, { expr: `${a}*${k}`, hint: k === 25 ? `${a} × 100 gedeeld door 4` : k === 50 ? `${a} × 100 gedeeld door 2` : k === 99 ? `${a} × 100 − ${a}` : `${a} × 100 + ${a}`, expl: `${a} × ${k} = ${a * k}.` }); }
    if (L === 4) { const a = ri(r, 6, 25); return num(`${a} × ${a} = ?`, a * a, { expr: `${a}*${a}`, hint: a % 10 === 5 ? 'Eindigt op 5: tientallen × (tientallen + 1), dan 25.' : 'Gebruik (a − 1)(a + 1) + 1.', expl: `${a}² = ${a * a}.` }); }
    const s = ri(r, 2, 15); if (r() < 0.6) return num(`√${s * s} = ?`, s, { hint: 'Welk getal keer zichzelf is dit?', expl: `${s} × ${s} = ${s * s}.` });
    const a = ri(r, 12, 40) * 4, k = pick(r, [25, 125, 5]); return num(`${a} × ${k === 125 ? '12,5' : k} = ?`, a * (k === 125 ? 12.5 : k), { dec: true, hint: k === 125 ? `${a} × 100 gedeeld door 8` : 'Slim splitsen.', expl: `Uitkomst ${fmtNum(a * (k === 125 ? 12.5 : k))}.` });
  },
  negatief(L, r) {
    if (L === 1) { const a = ri(r, 1, 15), b = ri(r, 1, 20), c = ri(r, 1, Math.min(a + b, 9)); return num(`${a} + ${b} − ${c} = ?`, a + b - c, { expr: `${a}+${b}-${c}`, hint: 'Van links naar rechts.', expl: `${a} + ${b} = ${a + b}, min ${c} is ${a + b - c}.` }); }
    if (L === 2) { const a = ri(r, 1, 12), b = ri(r, a + 1, a + 14); const k = r() < 0.5; if (k) return num(`${a} − ${b} = ?`, a - b, { expr: `${a}-${b}`, hint: `Je gaat ${b - a} onder nul.`, expl: `${a} − ${b} = ${a - b}.` }); return num(`−${a} − ${b} = ?`, -a - b, { expr: `-${a}-${b}`, hint: 'Nog verder onder nul.', expl: `−${a} − ${b} = ${-a - b}.` }); }
    if (L === 3) { const a = ri(r, 2, 12), b = ri(r, 2, 9), k = pick(r, [0, 1, 2, 3]); if (k === 0) return num(`−${a} × ${b} = ?`, -a * b, { expr: `-${a}*${b}`, hint: 'Min keer plus is min.', expl: `−${a * b}.` }); if (k === 1) return num(`−${a} × −${b} = ?`, a * b, { expr: `(-${a})*(-${b})`, hint: 'Min keer min is plus.', expl: `+${a * b}.` }); if (k === 2) return num(`−${a * b} ÷ ${b} = ?`, -a, { expr: `-${a * b}/${b}`, hint: 'Min gedeeld door plus is min.', expl: `−${a}.` }); return num(`−${a * b} ÷ −${b} = ?`, a, { expr: `(-${a * b})/(-${b})`, hint: 'Min gedeeld door min is plus.', expl: `+${a}.` }); }
    if (L === 4) { const k = pick(r, [0, 1, 2]); if (k === 0) { const e = ri(r, 2, 10); return num(`2 tot de macht ${e} = ?`, 2 ** e, { hint: `Dubbel ${e} keer, begin bij 1.`, expl: `2^${e} = ${2 ** e}.` }); } if (k === 1) { const b = ri(r, 2, 6), e = ri(r, 2, 3); return num(`${b}${e === 2 ? '²' : '³'} = ?`, b ** e, { expr: Array(e).fill(b).join('*'), hint: `${b} keer zichzelf${e === 3 ? ' en nog een keer' : ''}.`, expl: `${b ** e}.` }); } const e = ri(r, 2, 5); return num(`10^${e} = ?`, 10 ** e, { hint: `Een 1 met ${e} nullen.`, expl: `${10 ** e}.` }); }
    const a = ri(r, 2, 9), b = ri(r, 2, 9), c = ri(r, 2, 9), k = pick(r, [0, 1, 2]);
    if (k === 0) return num(`${a} + ${b} × ${c} = ?`, a + b * c, { expr: `${a}+${b}*${c}`, hint: 'Keer gaat voor plus.', expl: `${b} × ${c} = ${b * c}, plus ${a} = ${a + b * c}.` });
    if (k === 1) return num(`(${a} + ${b}) × ${c} = ?`, (a + b) * c, { expr: `(${a}+${b})*${c}`, hint: 'Eerst het haakje.', expl: `${a + b} × ${c} = ${(a + b) * c}.` });
    return num(`${a * c} − ${b} × ${c} + ${a} = ?`, a * c - b * c + a, { expr: `${a * c}-${b}*${c}+${a}`, hint: 'Keer eerst, dan van links naar rechts.', expl: `${a * c} − ${b * c} + ${a} = ${a * c - b * c + a}.` });
  },
  geld(L, r) {
    if (L === 1) { const pay = pick(r, [5, 10, 20]), cents = ri(r, 1, pay * 20 - 1) * 5, price = cents / 100; return num(`Je koopt iets van ${eurS(price)} en betaalt met €${pay}. Hoeveel wisselgeld (in euro)?`, Number((pay - price).toFixed(2)), { dec: true, hint: 'Tel op vanaf de prijs tot het betaalde bedrag.', expl: `${pay} − ${fmtNum(price)} = ${fmtNum(Number((pay - price).toFixed(2)))}.` }); }
    if (L === 2) { const a = ri(r, 1, 9) * 50 + ri(r, 0, 1) * 25, b = ri(r, 1, 9) * 25, c = ri(r, 1, 5) * 100; const s = (a + b + c) / 100; return num(`Brood ${eurS(a / 100)}, kaas ${eurS(b / 100)}, melk ${eurS(c / 100)}. Samen (in euro)?`, Number(s.toFixed(2)), { dec: true, hint: 'Tel eerst de euro’s, dan de centen.', expl: `Samen ${fmtNum(Number(s.toFixed(2)))}.` }); }
    if (L === 3) { const n = ri(r, 3, 10), each = ri(r, 2, 9) * 5 / 100; return num(`${n} koekjes kosten samen ${eurS(n * each)}. Wat kost één koekje (in euro)?`, Number(each.toFixed(2)), { dec: true, hint: 'Deel de prijs door het aantal.', expl: `${fmtNum(Number((n * each).toFixed(2)))} ÷ ${n} = ${fmtNum(Number(each.toFixed(2)))}.` }); }
    if (L === 4) { const w = ri(r, 2, 10) * 0.5, wk = ri(r, 4, 20), n = w * wk; return num(`Je spaart elke week €${fmtNum(w)}. Hoeveel (in euro) heb je na ${wk} weken?`, n, { dec: true, hint: 'Weekgeld keer aantal weken.', expl: `${fmtNum(w)} × ${wk} = ${fmtNum(n)}.` }); }
    if (r() < 0.5) { const m = ri(r, 1, 10) * 100, p = pick(r, [1, 2, 5, 10]); return num(`Op €${m} krijg je ${p}% rente per jaar. Hoeveel rente is dat (in euro)?`, m * p / 100, { dec: true, hint: `${p}% van ${m}.`, expl: `${m * p / 100}.` }); }
    const p = ri(r, 2, 15) * 10, k = pick(r, [10, 20, 25, 50]); return num(`Je betaalt €${p} met ${k}% korting. Hoeveel bespaar je (in euro)?`, p * k / 100, { dec: true, hint: `${k}% van ${p}.`, expl: `${p * k / 100}.` });
  },
  woord(L, r) {
    const [nm, nm2] = shuffle(r, NAMES), [pl, sg] = pick(r, THINGS);
    if (L === 1) { const a = ri(r, 4, 30), b = ri(r, 2, a - 1); return r() < 0.5 ? num(`${nm} heeft ${a} ${pl}. ${nm2} geeft nog ${b} ${pl}. Hoeveel heeft ${nm} nu?`, a + b, { expr: `${a}+${b}`, hint: 'Erbij: plus.', expl: `${a} + ${b} = ${a + b}.` }) : num(`${nm} heeft ${a} ${pl} en geeft er ${b} weg. Hoeveel houdt ${nm} over?`, a - b, { expr: `${a}-${b}`, hint: 'Weg: min.', expl: `${a} − ${b} = ${a - b}.` }); }
    if (L === 2) { const g = ri(r, 3, 9), n = ri(r, 3, 9); return r() < 0.5 ? num(`${nm} heeft ${g} zakjes met ${n} ${pl}. Hoeveel ${pl} zijn dat samen?`, g * n, { expr: `${g}*${n}`, hint: 'Groepjes: keer.', expl: `${g} × ${n} = ${g * n}.` }) : num(`${nm} verdeelt ${g * n} ${pl} eerlijk over ${g} vriendjes. Hoeveel krijgt ieder?`, n, { expr: `${g * n}/${g}`, hint: 'Verdelen: delen.', expl: `${g * n} ÷ ${g} = ${n}.` }); }
    if (L === 3) { const a = ri(r, 3, 8), p = ri(r, 2, 9), b = ri(r, 2, 20); const k = r() < 0.5; return k ? num(`${nm} koopt ${a} ${pl} van ${p} euro per stuk en betaalt met ${a * p + b} euro. Hoeveel euro krijgt ${nm} terug?`, b, { expr: `${a * p + b}-${a}*${p}`, hint: 'Eerst de totaalprijs.', expl: `${a} × ${p} = ${a * p}; ${a * p + b} − ${a * p} = ${b}.` }) : num(`In een bus zitten ${a * 6} mensen. Bij de halte stappen er ${b} uit en ${p} in. Hoeveel mensen zitten er nu?`, a * 6 - b + p, { expr: `${a * 6}-${b}+${p}`, hint: 'Uit: min. In: plus.', expl: `${a * 6} − ${b} + ${p} = ${a * 6 - b + p}.` }); }
    if (L === 4) { const v = ri(r, 4, 12) * 10, t = ri(r, 2, 6); if (r() < 0.5) return num(`Een trein rijdt ${v} km per uur. Hoeveel km rijdt hij in ${t} uur?`, v * t, { expr: `${v}*${t}`, hint: 'Snelheid keer tijd.', expl: `${v} × ${t} = ${v * t}.` }); return num(`Je fietst ${v * t / 10} km in ${t} uur, steeds even snel. Hoeveel km per uur?`, v / 10, { dec: true, hint: 'Afstand gedeeld door tijd.', expl: `${v * t / 10} ÷ ${t} = ${fmtNum(v / 10)}.` }); }
    const a = ri(r, 2, 9), b = ri(r, 3, 9);
    if (r() < 0.5) return num(`${nm} is ${a} jaar. ${nm2} is ${b} keer zo oud. Hoe oud is ${nm2} over ${a} jaar?`, a * b + a, { expr: `${a}*${b}+${a}`, hint: `Eerst de leeftijd van ${nm2} nu.`, expl: `${a} × ${b} = ${a * b}, plus ${a} = ${a * b + a}.` });
    const som = 2 * a * b + 10; return num(`Twee getallen zijn samen ${som} en hun verschil is 10. Wat is het grootste?`, som / 2 + 5, { expr: `${som}/2+5`, hint: 'Het grootste is de helft van de som plus de helft van het verschil.', expl: `${som} ÷ 2 = ${som / 2}, plus 5 = ${som / 2 + 5}.` });
  },
  reeksen(L, r) {
    const show = (arr, a) => num(`${arr.join(', ')}, ?`, a, { hint: 'Kijk naar het verschil tussen de getallen.' });
    if (L === 1) { const s = ri(r, 1, 20), d = pick(r, [2, 3, 4, 5, 10]); const seq = [0, 1, 2, 3, 4].map((i) => s + i * d); return { ...show(seq, s + 5 * d), expl: `Telkens +${d}.` }; }
    if (L === 2) { if (r() < 0.5) { const d = pick(r, [2, 3, 5, 7]), s = ri(r, 40, 90); const seq = [0, 1, 2, 3, 4].map((i) => s - i * d); return { ...show(seq, s - 5 * d), expl: `Telkens −${d}.` }; } const s = ri(r, 1, 5); const seq = [0, 1, 2, 3, 4].map((i) => s * 2 ** i); return { ...show(seq, s * 32), expl: 'Telkens ×2.' }; }
    if (L === 3) { const s = ri(r, 1, 10), a = ri(r, 1, 4), b = ri(r, 5, 8); const seq = [s]; for (let i = 0; i < 5; i++) seq.push(seq[i] + (i % 2 ? b : a)); return { ...show(seq.slice(0, 6), seq[5] + (5 % 2 ? b : a)), expl: `Om en om +${a} en +${b}.` }; }
    if (L === 4) { const k = pick(r, [0, 1, 2]); if (k === 0) return { ...show([1, 4, 9, 16, 25], 36), expl: 'Kwadraatgetallen: 6 × 6.' }; if (k === 1) return { ...show([1, 1, 2, 3, 5, 8], 13), expl: 'Fibonacci: de twee vorige samen.' }; return { ...show([1, 3, 6, 10, 15], 21), expl: 'Driehoeksgetallen: +2, +3, +4, +5, +6.' }; }
    const s = ri(r, 1, 4); if (r() < 0.5) { const seq = [0, 1, 2, 3, 4].map((i) => s * 3 ** i); return { ...show(seq, s * 243), expl: 'Telkens ×3.' }; }
    const seq = [s]; for (let i = 0; i < 5; i++) seq.push(seq[i] + 2 * (i + 1) + 1); return { ...show(seq.slice(0, 5), seq[5]), expl: 'Het verschil wordt telkens 2 groter.' };
  },
};

/** Maak één vraag. Zorgt voor veilige herhaling bij ongeldige uitkomst. */
export function makeQuestion(topic, level, r = Math.random) {
  const L = Math.min(MAXLEVEL, Math.max(1, level | 0 || 1));
  for (let i = 0; i < 12; i++) {
    const q = GEN[topic](L, r);
    if (q && q.q && q.a != null && q.a !== 'NaN' && q.a !== 'Infinity' && !/undefined|NaN/.test(q.q)) return { topic, level: L, ...q };
  }
  return { topic, level: L, q: '2 + 2 = ?', a: '4', kind: 'num' };
}

/** Maak een reeks vragen zonder dubbele vragen. */
export function makeSet(topic, level, n, r = Math.random) {
  const out = [], seen = new Set();
  for (let i = 0; i < n * 8 && out.length < n; i++) { const q = makeQuestion(topic, level, r); if (seen.has(q.q)) continue; seen.add(q.q); out.push(q); }
  while (out.length < n) out.push(makeQuestion(topic, level, r));
  return out;
}

/* ---------- antwoorden ---------- */
export function parseNumber(s) {
  s = String(s ?? '').trim().replace(/\s/g, '').replace(/[−–]/g, '-').replace(/€/g, '');
  if (!s || !/^-?\d*[,.]?\d*$/.test(s) || !/\d/.test(s)) return NaN;
  return Number(s.replace(',', '.'));
}
export function parseFrac(s) {
  s = String(s ?? '').trim().replace(/\s/g, '').replace(/[−–]/g, '-');
  const m = /^(-?\d+)(?:\/(\d+))?$/.exec(s);
  if (!m) return null;
  const n = +m[1], d = m[2] == null ? 1 : +m[2];
  if (!d) return null;
  return [n, d];
}
export function checkAnswer(q, input) {
  if (!q) return false;
  if (q.kind === 'choice') return String(input) === String(q.a);
  if (q.kind === 'frac') {
    const u = parseFrac(input), a = parseFrac(q.a); if (!u || !a) return false;
    if (q.needReduced) { const [rn, rd] = reduce(u[0], u[1]); return rn === u[0] && rd === u[1] && u[0] === a[0] && u[1] === a[1]; }
    return u[0] * a[1] === a[0] * u[1];
  }
  const v = parseNumber(input), a = parseNumber(q.a);
  return Number.isFinite(v) && Math.abs(v - a) < 0.0051;
}

/* ---------- voortgang ---------- */
export function newState() {
  return { v: 2, xp: 0, coins: 0, topics: {}, facts: {}, daily: { last: '', streak: 0, best: 0, scores: {} }, records: {}, puzzles: {}, badges: [], total: { right: 0, wrong: 0, sessions: 0, perfect: 0, bestStreak: 0 }, world: '' };
}
export function topicState(s, id) { return (s.topics[id] ||= { stars: [0, 0, 0, 0, 0], right: 0, total: 0 }); }
export const playerLevel = (xp) => Math.floor(Math.sqrt(Math.max(0, xp) / 60)) + 1;
export const xpForLevel = (lv) => (lv - 1) ** 2 * 60;
export function starsFor(right, total) { if (!total) return 0; const p = right / total; return p >= 0.9 ? 3 : p >= 0.75 ? 2 : p >= 0.6 ? 1 : 0; }
export function unlockedLevel(s, id) { const st = topicState(s, id).stars; let l = 1; while (l < MAXLEVEL && st[l - 1] >= 1) l++; return l; }

export const BADGES = [
  { id: 'start', name: 'Eerste stap', icon: 'flag', desc: 'Maak je eerste oefening af', test: (s) => s.total.sessions >= 1 },
  { id: 'perfect', name: 'Foutloos', icon: 'star', desc: 'Een oefening zonder fouten', test: (s) => s.total.perfect >= 1 },
  { id: 'perfect5', name: 'Vijf keer foutloos', icon: 'medal', desc: '5 foutloze oefeningen', test: (s) => s.total.perfect >= 5 },
  { id: 'r100', name: 'Honderd goed', icon: 'coin', desc: '100 goede antwoorden', test: (s) => s.total.right >= 100 },
  { id: 'r500', name: 'Vijfhonderd goed', icon: 'gem', desc: '500 goede antwoorden', test: (s) => s.total.right >= 500 },
  { id: 'r2000', name: 'Rekenmeester', icon: 'crown', desc: '2000 goede antwoorden', test: (s) => s.total.right >= 2000 },
  { id: 'streak10', name: 'Op dreef', icon: 'flame', desc: '10 goed achter elkaar', test: (s) => s.total.bestStreak >= 10 },
  { id: 'streak25', name: 'Onstopbaar', icon: 'bolt', desc: '25 goed achter elkaar', test: (s) => s.total.bestStreak >= 25 },
  { id: 'daily3', name: 'Drie dagen op rij', icon: 'bell', desc: '3 dagen achter elkaar de dagelijkse uitdaging', test: (s) => s.daily.best >= 3 },
  { id: 'daily7', name: 'Een hele week', icon: 'gift', desc: '7 dagen achter elkaar', test: (s) => s.daily.best >= 7 },
  { id: 'tafelmeester', name: 'Tafelmeester', icon: 'trophy', desc: 'Alle 5 de tafel-niveaus met 2+ sterren', test: (s) => (s.topics.tafels ? s.topics.tafels.stars.every((x) => x >= 2) : false) },
  { id: 'breukenheld', name: 'Breukenheld', icon: 'pie', desc: 'Breuken niveau 3 gehaald', test: (s) => (s.topics.breuken ? s.topics.breuken.stars[2] >= 1 : false) },
  { id: 'alles', name: 'Alleskunner', icon: 'chest', desc: 'Elk onderwerp minstens niveau 2 gehaald', test: (s) => TOPICS.every((t) => s.topics[t.id] && s.topics[t.id].stars[1] >= 1) },
  { id: 'racer', name: 'Racekampioen', icon: 'car', desc: 'Eerste plaats in een race', test: (s) => (s.records.race && s.records.race.wins >= 1) || false },
  { id: 'drakendoder', name: 'Drakendoder', icon: 'dragon', desc: 'Een monster verslagen', test: (s) => (s.records.boss && s.records.boss.wins >= 1) || false },
  { id: 'puzzelaar', name: 'Puzzelaar', icon: 'puzzle', desc: '10 puzzels opgelost', test: (s) => Object.values(s.puzzles).reduce((a, p) => a + (p.solved || 0), 0) >= 10 },
  { id: 'lvl5', name: 'Level 5', icon: 'rocket', desc: 'Speler-level 5 bereikt', test: (s) => playerLevel(s.xp) >= 5 },
  { id: 'lvl10', name: 'Level 10', icon: 'planet', desc: 'Speler-level 10 bereikt', test: (s) => playerLevel(s.xp) >= 10 },
];
export function earnedBadges(s) { return BADGES.filter((b) => b.test(s)).map((b) => b.id); }

/**
 * Verwerk een afgeronde oefening in de voortgang.
 * result = { topic, level, answers:[{q, ok, ms}], mode }. Geeft een samenvatting terug (en past s aan).
 */
export function applySession(s, result) {
  const { topic, level, answers = [], mode = 'oefen' } = result;
  const right = answers.filter((a) => a.ok).length, total = answers.length, wrong = total - right;
  const before = playerLevel(s.xp), beforeBadges = new Set(s.badges);
  let xp = 0, streak = 0, best = 0;
  for (const a of answers) {
    if (a.ok) { xp += 10 + (a.ms && a.ms < 4000 ? 5 : 0); streak++; best = Math.max(best, streak); } else streak = 0;
    const f = a.q && a.q.fact; if (f) { const e = (s.facts[f] ||= [0, 0]); e[a.ok ? 0 : 1]++; }
  }
  const stars = starsFor(right, total), perfect = total > 0 && wrong === 0;
  let coins = right + (perfect ? 5 : 0), unlocked = null;
  if (topic && TOPIC[topic] && mode === 'oefen') {
    const ts = topicState(s, topic), oldU = unlockedLevel(s, topic);
    ts.right += right; ts.total += total;
    if (stars > ts.stars[level - 1]) { ts.stars[level - 1] = stars; xp += 20 * stars; }
    if (unlockedLevel(s, topic) > oldU) unlocked = unlockedLevel(s, topic);
  }
  s.xp += xp; s.coins += coins;
  s.total.right += right; s.total.wrong += wrong; s.total.sessions++; if (perfect) s.total.perfect++;
  s.total.bestStreak = Math.max(s.total.bestStreak, best);
  const now = earnedBadges(s); s.badges = Array.from(new Set([...s.badges, ...now]));
  const newBadges = s.badges.filter((b) => !beforeBadges.has(b));
  const after = playerLevel(s.xp);
  return { right, total, wrong, stars, perfect, xp, coins, bestStreak: best, unlocked, levelUp: after > before ? after : 0, newBadges };
}

/* ---------- tafels-heatmap ---------- */
export function factScore(s, key) { const e = s.facts[key]; if (!e) return null; const t = e[0] + e[1]; return t ? e[0] / t : null; }
/** Zwakste sommen (lage score of veel fouten) als lijst van [a,b]. */
export function weakFacts(s, limit = 12) {
  const rows = Object.entries(s.facts).map(([k, e]) => ({ k, e, t: e[0] + e[1], sc: (e[0] + 1) / (e[0] + e[1] + 2) })).filter((x) => x.e[1] > 0).sort((a, b) => a.sc - b.sc || b.t - a.t);
  return rows.slice(0, limit).map((x) => x.k.split('x').map(Number));
}
export function factQuestion(a, b, r = Math.random) {
  const [x, y] = r() < 0.5 ? [a, b] : [b, a], fact = `${Math.min(a, b)}x${Math.max(a, b)}`;
  return num(`${x} × ${y} = ?`, x * y, { expr: `${x}*${y}`, fact, topic: 'tafels', level: 3, hint: `${x} × ${y - 1 || 1} + ${x}`, expl: `${x} × ${y} = ${x * y}.` });
}
/** Oefenset voor een lijst tafels (bv. [3,7]) of de zwakke plekken. */
export function tableSet(tables, n, r = Math.random) {
  const out = [], seen = new Set();
  for (let i = 0; i < n * 10 && out.length < n; i++) {
    const t = pick(r, tables), m = ri(r, 1, 10), k = `${t}x${m}`; if (seen.has(k) && i < n * 5) continue; seen.add(k);
    out.push(r() < 0.25 ? makeFactDiv(t, m) : factQuestion(t, m, r));
  }
  return out;
}
function makeFactDiv(t, m) { const p = t * m; return num(`${p} ÷ ${t} = ?`, m, { expr: `${p}/${t}`, fact: `${Math.min(t, m)}x${Math.max(t, m)}`, topic: 'tafels', level: 3, hint: `Welke keer ${t} is ${p}?`, expl: `${t} × ${m} = ${p}.` }); }

/* ---------- dagelijkse uitdaging ---------- */
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function dailyQuestions(date, s) {
  const r = rng('dag-' + date), ids = shuffle(r, TOPICS.map((t) => t.id)).slice(0, 8), out = [];
  for (const id of ids) { const lv = Math.max(1, Math.min(4, unlockedLevel(s, id))); out.push(makeQuestion(id, Math.max(1, lv - (r() < 0.4 ? 1 : 0)), r)); }
  return out;
}
export function prevDay(date) { const [y, m, d] = date.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d - 1)); return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`; }
export function applyDaily(s, date, score) {
  const d = s.daily; if (d.scores[date] != null) return { first: false, streak: d.streak };
  d.scores[date] = score; const keys = Object.keys(d.scores).sort(); if (keys.length > 30) delete d.scores[keys[0]];
  d.streak = d.last === prevDay(date) ? d.streak + 1 : 1; d.last = date; d.best = Math.max(d.best, d.streak);
  const bonus = 10 + Math.min(d.streak, 7) * 3; s.coins += bonus; s.xp += 30;
  s.badges = Array.from(new Set([...s.badges, ...earnedBadges(s)]));
  return { first: true, streak: d.streak, bonus };
}

/* ---------- race en monster ---------- */
export const BOTS = [{ name: 'Slak-Sjoerd', icon: 'snail', rate: 0.22 }, { name: 'Fiets-Fien', icon: 'bike', rate: 0.34 }, { name: 'Raket-Rob', icon: 'rocket', rate: 0.46 }];
/** Voortgang (0..1) van een bot na t seconden (parcours = goals antwoorden). */
export const botProgress = (bot, t, goals = 20, skill = 1) => Math.min(1, (bot.rate * skill * t) / goals);
export function raceRanking(playerProg, t, goals = 20, skill = 1) {
  const all = [{ name: 'Jij', me: true, p: playerProg }, ...BOTS.map((b) => ({ name: b.name, icon: b.icon, p: botProgress(b, t, goals, skill) }))];
  return all.sort((a, b) => b.p - a.p);
}
export const MONSTERS = [
  { id: 'slime', name: 'Slijmbal', icon: 'slime', hp: 8, world: 'bos' }, { id: 'ghost', name: 'Spookje', icon: 'ghost', hp: 10, world: 'neon' },
  { id: 'robot', name: 'Blikken Bob', icon: 'robot', hp: 12, world: 'robots' }, { id: 'alien', name: 'Alien Alex', icon: 'alien', hp: 14, world: 'ruimte' },
  { id: 'dragon', name: 'Vuurdraak', icon: 'dragon', hp: 18, world: 'vulkaan' },
];

/* ---------- Puzzel: magisch vierkant ---------- */
const MAGIC = [[2, 7, 6], [9, 5, 1], [4, 3, 8]];
export function makeMagic(level, r = Math.random) {
  let g = MAGIC.map((x) => x.slice());
  const rot = ri(r, 0, 3); for (let i = 0; i < rot; i++) g = g[0].map((_, c) => g.map((row) => row[c]).reverse());
  if (r() < 0.5) g = g.map((row) => row.slice().reverse());
  const add = level === 1 ? 0 : ri(r, 1, 10) * (level === 3 ? 3 : 1), mul = level === 3 ? pick(r, [1, 2, 3]) : 1;
  const sol = g.flat().map((v) => v * mul + add), S = 15 * mul + 3 * add;
  const blanks = [3, 4, 5][level - 1] || 4, idx = shuffle(r, [0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, blanks);
  const given = sol.map((v, i) => (idx.includes(i) ? null : v));
  return { sol, given, sum: S, size: 3 };
}
export function checkMagic(p, cells) {
  const g = cells.map((v, i) => (p.given[i] != null ? p.given[i] : Number(v)));
  if (g.some((v) => !Number.isFinite(v))) return false;
  const s = p.sum, at = (i) => g[i];
  const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  return lines.every((l) => l.reduce((a, i) => a + at(i), 0) === s) && new Set(g).size === 9;
}

/* ---------- Puzzel: getallenpiramide ---------- */
export function makePyramid(level, r = Math.random) {
  const n = level + 2 > 5 ? 5 : level + 2; // 3,4,5 rijen
  const bottom = Array.from({ length: n }, () => ri(r, 1, level === 1 ? 6 : level === 2 ? 12 : 20));
  const rows = [bottom];
  while (rows[rows.length - 1].length > 1) { const p = rows[rows.length - 1]; rows.push(p.slice(1).map((_, i) => p[i] + p[i + 1])); }
  // rows[0] = onderste rij; cellen van boven naar onder
  const top = rows.slice().reverse(); // top[0] = 1 cel
  const cells = [];
  top.forEach((row, ri2) => row.forEach((v, ci) => cells.push({ r: ri2, c: ci, v })));
  const hide = Math.max(2, Math.round(cells.length * (0.35 + level * 0.07)));
  const hidden = new Set();
  const order = shuffle(r, cells.map((_, i) => i));
  // verberg cellen zodat de piramide oplosbaar blijft: laat altijd minstens n-1 cellen zichtbaar die samen alles bepalen -> controleer met oplosser
  for (const i of order) { if (hidden.size >= hide) break; hidden.add(i); if (!pyramidSolvable(top, cells, hidden)) hidden.delete(i); }
  return { rows: top.map((row) => row.slice()), cells: cells.map((c, i) => ({ ...c, given: hidden.has(i) ? null : c.v })) };
}
function pyramidSolvable(top, cells, hidden) {
  const g = top.map((row) => row.map(() => null));
  cells.forEach((c, i) => { if (!hidden.has(i)) g[c.r][c.c] = c.v; });
  let ch = true;
  while (ch) {
    ch = false;
    for (let y = 0; y < g.length - 1; y++) for (let x = 0; x < g[y].length; x++) {
      const a = g[y][x], l = g[y + 1][x], rr = g[y + 1][x + 1];
      if (a == null && l != null && rr != null) { g[y][x] = l + rr; ch = true; }
      else if (a != null && l == null && rr != null) { g[y + 1][x] = a - rr; ch = true; }
      else if (a != null && l != null && rr == null) { g[y + 1][x + 1] = a - l; ch = true; }
    }
  }
  return g.every((row) => row.every((v) => v != null));
}
export function checkPyramid(p, vals) {
  const g = p.rows.map((row) => row.map(() => 0));
  p.cells.forEach((c, i) => { g[c.r][c.c] = c.given != null ? c.given : Number(vals[i]); });
  if (g.flat().some((v) => !Number.isFinite(v))) return false;
  for (let y = 0; y < g.length - 1; y++) for (let x = 0; x < g[y].length; x++) if (g[y][x] !== g[y + 1][x] + g[y + 1][x + 1]) return false;
  return true;
}

/* ---------- Puzzel: Maak 24 (of een ander doel) ---------- */
export function solve24(nums, target = 24) {
  const eps = 1e-6;
  function rec(items) {
    if (items.length === 1) return Math.abs(items[0].v - target) < eps ? items[0].e : null;
    for (let i = 0; i < items.length; i++) for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      const rest = items.filter((_, k) => k !== i && k !== j), a = items[i], b = items[j];
      const cands = [{ v: a.v + b.v, e: `(${a.e}+${b.e})` }, { v: a.v * b.v, e: `(${a.e}*${b.e})` }, { v: a.v - b.v, e: `(${a.e}-${b.e})` }];
      if (Math.abs(b.v) > eps) cands.push({ v: a.v / b.v, e: `(${a.e}/${b.e})` });
      for (const c of cands) { const r = rec([...rest, c]); if (r) return r; }
    }
    return null;
  }
  const res = rec(nums.map((n) => ({ v: n, e: String(n) })));
  return res ? res.replace(/^\((.*)\)$/, '$1') : null;
}
export function makeTwentyFour(level, r = Math.random) {
  const max = level === 1 ? 6 : level === 2 ? 9 : 12, target = level === 3 ? pick(r, [24, 24, 30, 36]) : 24;
  for (let i = 0; i < 200; i++) { const nums = [ri(r, 1, max), ri(r, 1, max), ri(r, 1, max), ri(r, 1, max)]; const sol = solve24(nums, target); if (sol) return { nums, target, sol }; }
  return { nums: [3, 3, 8, 8], target: 24, sol: '8/(3-8/3)' };
}
export function checkTwentyFour(p, expr) {
  const used = (String(expr).match(/\d+/g) || []).map(Number).sort((a, b) => a - b), need = p.nums.slice().sort((a, b) => a - b);
  if (used.length !== need.length || used.some((v, i) => v !== need[i])) return { ok: false, why: 'Gebruik elk getal precies één keer.' };
  try { const v = evaluate(expr); return Math.abs(v - p.target) < 1e-9 ? { ok: true, v } : { ok: false, why: `Dat is ${fmtNum(v)}, het moet ${p.target} zijn.` }; } catch (e) { return { ok: false, why: e.message }; }
}

/* ---------- Puzzel: Ik ben een getal ---------- */
const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const digSum = (n) => String(n).split('').reduce((a, c) => a + +c, 0);
export function makeRiddle(level, r = Math.random) {
  const hi = level === 1 ? 50 : level === 2 ? 100 : 200;
  const N = ri(r, 6, hi), pool = [];
  for (const k of [2, 3, 4, 5, 6, 7, 9, 11]) if (N % k === 0) pool.push({ t: `Ik ben deelbaar door ${k}.`, f: (n) => n % k === 0 });
  pool.push({ t: N % 2 ? 'Ik ben oneven.' : 'Ik ben even.', f: (n) => (n % 2 === 1) === !!(N % 2) });
  if (isPrime(N)) pool.push({ t: 'Ik ben een priemgetal.', f: isPrime }); else pool.push({ t: 'Ik ben geen priemgetal.', f: (n) => !isPrime(n) });
  if (Math.sqrt(N) % 1 === 0) pool.push({ t: 'Ik ben een kwadraat.', f: (n) => Math.sqrt(n) % 1 === 0 });
  const lo = Math.max(1, N - ri(r, 3, 20)), up = N + ri(r, 3, 20);
  pool.push({ t: `Ik ben groter dan ${lo}.`, f: (n) => n > lo }, { t: `Ik ben kleiner dan ${up}.`, f: (n) => n < up });
  pool.push({ t: `De som van mijn cijfers is ${digSum(N)}.`, f: (n) => digSum(n) === digSum(N) });
  if (level >= 2) pool.push({ t: `Mijn laatste cijfer is ${N % 10}.`, f: (n) => n % 10 === N % 10 });
  const clues = [], cand = Array.from({ length: hi + 30 }, (_, i) => i + 1);
  let rest = cand;
  for (const c of shuffle(r, pool)) { const nr = rest.filter(c.f); if (nr.length < rest.length) { clues.push(c.t); rest = nr; } if (rest.length === 1) break; }
  while (rest.length > 1) {
    const below = rest.filter((x) => x < N), above = rest.filter((x) => x > N);
    if (below.length) { const m = Math.max(...below); clues.push(`Ik ben groter dan ${m}.`); rest = rest.filter((x) => x > m); }
    else { const m = Math.min(...above); clues.push(`Ik ben kleiner dan ${m}.`); rest = rest.filter((x) => x < m); }
  }
  return { clues, answer: N, unique: rest.length === 1, max: hi + 30 };
}

/* ---------- Puzzel: Balans / vergelijking ---------- */
export function makeEquation(level, r = Math.random) {
  const x = ri(r, 2, level === 1 ? 12 : 20);
  if (level === 1) { const a = ri(r, 2, 15); return r() < 0.5 ? { q: `x + ${a} = ${x + a}`, x } : { q: `x − ${a} = ${x - a}`, x }; }
  if (level === 2) { const k = ri(r, 2, 9), b = ri(r, 1, 15); return r() < 0.5 ? { q: `${k}x = ${k * x}`, x } : { q: `${k}x + ${b} = ${k * x + b}`, x }; }
  if (level === 3) { const k = ri(r, 2, 6), b = ri(r, 1, 12); return r() < 0.5 ? { q: `${k}x − ${b} = ${k * x - b}`, x } : { q: `x ÷ ${k} = ${x}`, x: x * k }; }
  const k = ri(r, 2, 5), b = ri(r, 1, 10), c = ri(r, 1, k - 1); return { q: `${k}x + ${b} = ${c}x + ${(k - c) * x + b}`, x };
}

/* ---------- Puzzel: mini-sudoku 4x4 ---------- */
export function makeSudoku4(level, r = Math.random) {
  const base = [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]];
  const perm = shuffle(r, [1, 2, 3, 4]);
  let g = base.map((row) => row.map((v) => perm[v - 1]));
  // rijen binnen een band en banden onderling wisselen; kolommen idem
  const bands = r() < 0.5 ? [0, 1] : [1, 0];
  const sw1 = r() < 0.5, sw2 = r() < 0.5, rowOrd = [bands[0] * 2 + (sw1 ? 1 : 0), bands[0] * 2 + (sw1 ? 0 : 1), bands[1] * 2 + (sw2 ? 1 : 0), bands[1] * 2 + (sw2 ? 0 : 1)];
  g = rowOrd.map((i) => g[i]);
  if (r() < 0.5) g = g[0].map((_, c) => g.map((row) => row[c]));
  const sol = g.flat(), blanks = [5, 7, 9][level - 1] || 7, idx = shuffle(r, Array.from({ length: 16 }, (_, i) => i)).slice(0, blanks);
  return { sol, given: sol.map((v, i) => (idx.includes(i) ? null : v)) };
}
export function checkSudoku4(p, cells) {
  const g = cells.map((v, i) => (p.given[i] != null ? p.given[i] : Number(v)));
  if (g.some((v) => !(v >= 1 && v <= 4))) return false;
  const ok = (arr) => new Set(arr.map((i) => g[i])).size === 4;
  for (let k = 0; k < 4; k++) { if (!ok([0, 1, 2, 3].map((c) => k * 4 + c)) || !ok([0, 1, 2, 3].map((rr) => rr * 4 + k))) return false; }
  for (const br of [0, 2]) for (const bc of [0, 2]) if (!ok([[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => (br + a) * 4 + bc + b))) return false;
  return true;
}

/* ---------- beloningen buiten oefeningen (puzzels, spellen) ---------- */
export function award(s, coins = 0, xp = 0) {
  const before = playerLevel(s.xp), had = new Set(s.badges);
  s.coins += coins; s.xp += xp;
  s.badges = Array.from(new Set([...s.badges, ...earnedBadges(s)]));
  const after = playerLevel(s.xp);
  return { levelUp: after > before ? after : 0, newBadges: s.badges.filter((b) => !had.has(b)) };
}
export const PUZZLES = [
  { id: 'magic', name: 'Magisch vierkant', icon: 'crystal', desc: 'Elke rij, kolom en diagonaal heeft dezelfde som', levels: 3 },
  { id: 'pyramid', name: 'Getallenpiramide', icon: 'pyramid', desc: 'Twee blokjes samen vormen het blokje erboven', levels: 3 },
  { id: 'make24', name: 'Maak 24', icon: 'target', desc: 'Gebruik alle vier de getallen één keer', levels: 3 },
  { id: 'riddle', name: 'Ik ben een getal', icon: 'scroll', desc: 'Raad het getal met de aanwijzingen', levels: 3 },
  { id: 'balance', name: 'Balans', icon: 'sword', desc: 'Welke waarde heeft de x?', levels: 4 },
  { id: 'sudoku', name: 'Mini-sudoku', icon: 'puzzle', desc: '1 tot 4 in elke rij, kolom en vakje', levels: 3 },
];
export function puzzleSolved(s, type, level) {
  const p = (s.puzzles[type] ||= { solved: 0, best: 0 });
  p.solved++; p.best = Math.max(p.best, level);
  return award(s, 3 * level, 15 * level);
}
