// Rekenen: rekenmachine, eenheden, valuta, procent, fooi & rekening delen, datum.
// Geen eval(), geen externe libs. Pure functies (evaluate, convert, daysBetween) zijn geëxporteerd voor tests.

/* ---------- Rekenmachine: veilige expressie-parser (recursive descent) ---------- */
const OPS = { '+': '+', '-': '-', '−': '-', '–': '-', '*': '*', '×': '*', x: '*', X: '*', '·': '*', '/': '/', '÷': '/', ':': '/', '%': '%', '(': '(', ')': ')' };

function tokenize(src) {
  const out = []; const num = /\d+(?:[.,]\d*)?|[.,]\d+/y; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    num.lastIndex = i; const m = num.exec(src);
    if (m) { out.push({ t: 'n', v: parseFloat(m[0].replace(',', '.')) }); i += m[0].length; continue; }
    if (OPS[c]) { out.push({ t: OPS[c] }); i++; continue; }
    throw new Error(`Ongeldig teken: "${c}"`);
  }
  return out;
}

export function evaluate(expr) {
  if (typeof expr !== 'string' || !expr.trim()) throw new Error('Voer eerst een berekening in');
  const tk = tokenize(expr); let p = 0;
  const peek = () => (p < tk.length ? tk[p].t : null);
  const bad = () => new Error('Ongeldige berekening');
  function sum() {
    let l = prod();
    while (peek() === '+' || peek() === '-') {
      const op = tk[p++].t; const r = prod();
      // rekenmachine-gedrag: 200 + 10% = 200 + 10% van 200
      const rv = r.pct ? l.v * r.v : r.v;
      l = { v: op === '+' ? l.v + rv : l.v - rv, pct: false };
    }
    return l;
  }
  function prod() {
    let l = unary();
    while (peek() === '*' || peek() === '/' || peek() === '(') {
      let op = '*'; if (peek() !== '(') op = tk[p++].t;   // 2(3) = 2×3
      const r = unary();
      if (op === '/') { if (r.v === 0) throw new Error('Kan niet delen door nul'); l = { v: l.v / r.v, pct: false }; }
      else l = { v: l.v * r.v, pct: false };
    }
    return l;
  }
  function unary() {
    if (peek() === '-') { p++; return { v: -unary().v, pct: false }; }
    if (peek() === '+') { p++; return unary(); }
    return post();
  }
  function post() {
    let r = prim();
    while (peek() === '%') { p++; r = { v: r.v / 100, pct: true }; }
    return r;
  }
  function prim() {
    const t = tk[p];
    if (!t) throw new Error('Berekening is niet af');
    if (t.t === 'n') { p++; return { v: t.v, pct: false }; }
    if (t.t === '(') {
      p++; const r = sum();
      if (peek() !== ')') throw new Error('Haakje sluiten ontbreekt');
      p++; return { v: r.v, pct: false };
    }
    if (t.t === ')') throw new Error('Haakje sluiten zonder openen');
    throw bad();
  }
  const res = sum();
  if (p < tk.length) { if (tk[p].t === ')') throw new Error('Haakje sluiten zonder openen'); throw bad(); }
  if (!Number.isFinite(res.v)) throw new Error('Resultaat is te groot');
  return Number(res.v.toPrecision(12));
}

/* ---------- Eenheden ---------- */
export const CATS = {
  lengte: { label: 'Lengte', def: ['km', 'mijl'], u: { mm: 0.001, cm: 0.01, m: 1, km: 1000, inch: 0.0254, voet: 0.3048, yard: 0.9144, mijl: 1609.344, zeemijl: 1852 } },
  gewicht: { label: 'Gewicht', def: ['kg', 'lb'], u: { mg: 1e-6, g: 0.001, kg: 1, ton: 1000, ons: 0.1, oz: 0.028349523125, lb: 0.45359237, stone: 6.35029318 } },
  temperatuur: { label: 'Temperatuur', def: ['°C', '°F'], u: { '°C': 1, '°F': 1, K: 1 } },
  inhoud: { label: 'Inhoud', def: ['l', 'gallon (VS)'], u: { ml: 0.001, cl: 0.01, dl: 0.1, l: 1, 'm³': 1000, theelepel: 0.005, eetlepel: 0.015, kopje: 0.25, 'fl oz (VS)': 0.0295735295625, 'pint (VS)': 0.473176473, 'gallon (VS)': 3.785411784 } },
  snelheid: { label: 'Snelheid', def: ['km/u', 'mph'], u: { 'm/s': 1, 'km/u': 1 / 3.6, mph: 0.44704, knoop: 1852 / 3600 } },
  oppervlakte: { label: 'Oppervlakte', def: ['m²', 'ft²'], u: { 'cm²': 1e-4, 'm²': 1, are: 100, ha: 1e4, 'km²': 1e6, 'in²': 0.00064516, 'ft²': 0.09290304, acre: 4046.8564224 } },
  tijd: { label: 'Tijd', def: ['uur', 'minuut'], u: { milliseconde: 0.001, seconde: 1, minuut: 60, uur: 3600, dag: 86400, week: 604800, maand: 2629746, jaar: 31556952 } },
  opslag: { label: 'Digitale opslag', def: ['GB', 'MB'], u: { bit: 0.125, B: 1, kB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12, KiB: 1024, MiB: 1048576, GiB: 1073741824 } },
};
// Alias-namen voor gemak in tests/gebruik
const ALIAS = { uur: 'uur', minuten: 'minuut', min: 'minuut', uren: 'uur', seconden: 'seconde', s: 'seconde', dagen: 'dag', km: 'km', mijl: 'mijl', mile: 'mijl', C: '°C', F: '°F' };

function tToC(v, u) { return u === '°F' ? (v - 32) * 5 / 9 : u === 'K' ? v - 273.15 : v; }
function tFromC(c, u) { return u === '°F' ? c * 9 / 5 + 32 : u === 'K' ? c + 273.15 : c; }

export function convert(value, from, to, category) {
  const v = Number(value);
  if (!Number.isFinite(v)) throw new Error('Ongeldig getal');
  const norm = (u) => ALIAS[u] || u;
  from = norm(from); to = norm(to);
  let cat = category && CATS[category];
  if (!cat) cat = Object.values(CATS).find((c) => from in c.u && to in c.u);
  if (!cat || !(from in cat.u) || !(to in cat.u)) throw new Error('Onbekende eenheid');
  if (cat === CATS.temperatuur) return Number(tFromC(tToC(v, from), to).toPrecision(12));
  return Number((v * cat.u[from] / cat.u[to]).toPrecision(12));
}

/* ---------- Datums (UTC, zodat zomertijd geen dagen verschuift) ---------- */
export const DAY = 864e5;
export function toUTC(d) {
  if (d instanceof Date) return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d));
  if (!m) throw new Error('Ongeldige datum');
  return Date.UTC(+m[1], +m[2] - 1, +m[3]);
}
export function daysBetween(a, b) { return Math.round((toUTC(b) - toUTC(a)) / DAY); }
export function addDays(d, n) { return new Date(toUTC(d) + n * DAY).toISOString().slice(0, 10); }
export function ageBetween(birth, on) {
  const b = new Date(toUTC(birth)), t = new Date(toUTC(on));
  let y = t.getUTCFullYear() - b.getUTCFullYear(), m = t.getUTCMonth() - b.getUTCMonth(), d = t.getUTCDate() - b.getUTCDate();
  if (d < 0) { m--; d += new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 0)).getUTCDate(); }
  if (m < 0) { y--; m += 12; }
  return { jaren: y, maanden: m, dagen: d };
}

