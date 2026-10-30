// Learn – kern: vraag-model, antwoordcontrole, kits, voortgang (Leitner), profiel (upgrades/XP/opdrachten/prestaties), voorlezen, geluid, opslag.
// Contract: docs/learn/SPEC.md. Alles is local-first (localStorage `learn:<uid>:<naam>`) met cloud (Firestore gamesaves/<game>__<uid>) als aanvulling.
// Extra's boven het contract staan bij de export vermeld ("extra").

/* ============================== basis ============================== */
export const LANGS = {
  nl: { name: 'Nederlands', speech: 'nl-NL', flag: '🇳🇱' },
  en: { name: 'Engels', speech: 'en-GB', flag: '🇬🇧' },
  de: { name: 'Duits', speech: 'de-DE', flag: '🇩🇪' },
  fr: { name: 'Frans', speech: 'fr-FR', flag: '🇫🇷' },
  es: { name: 'Spaans', speech: 'es-ES', flag: '🇪🇸' },
};

function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507); h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507); h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export function rng(seed) {
  let a;
  if (typeof seed === 'number' && isFinite(seed)) a = (Math.floor(seed) ^ Math.floor((seed % 1) * 4294967296)) >>> 0;
  else if (seed === undefined || seed === null) a = (Date.now() ^ (Math.random() * 4294967296)) >>> 0;
  else a = cyrb53(String(seed)) >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr, rand = Math.random) {
  const a = Array.from(arr || []);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function fmt(n) {
  n = Number(n);
  if (!isFinite(n)) return '0';
  const neg = n < 0 ? '-' : '';
  n = Math.abs(n);
  if (n < 1000) return neg + String(Math.round(n * 10) / 10).replace('.', ',');
  const units = ['K', 'M', 'B', 'T'];
  let i = -1, v = n;
  while (v >= 1000 && i < units.length - 1) { v /= 1000; i++; }
  let s = Math.round(v * 10) / 10;
  if (s >= 1000 && i < units.length - 1) { s = Math.round(s / 100) / 10; i++; }
  return neg + String(s).replace('.', ',') + units[i];
}

const pad2 = (n) => (n < 10 ? '0' : '') + n;
export function dayKey(ts) { const d = new Date(ts); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
export function todayKey() { return dayKey(Date.now()); }
function addDays(key, n) { const [y, m, d] = key.split('-').map(Number); const dt = new Date(y, m - 1, d + n, 12); return dayKey(dt.getTime()); }

function fmtNum(n) {
  if (!isFinite(n)) return String(n);
  return String(+Number(n).toFixed(6)).replace('.', ',');
}

/* ============================== vraag-model ============================== */
const TYPES = ['mc', 'type', 'tf', 'order', 'match', 'fill', 'num', 'multi'];
const str = (x) => (x === undefined || x === null ? '' : String(x)).trim();

function parseNum(v) {
  if (typeof v === 'number') return isFinite(v) ? v : NaN;
  let s = str(v).replace(/[€%\s ]/g, '').replace(/^\+/, '');
  if (!s) return NaN;
  const fr = /^(-?\d+)\/(\d+)$/.exec(s);
  if (fr) return Number(fr[2]) ? Number(fr[1]) / Number(fr[2]) : NaN;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
  else s = s.replace(',', '.');
  if (/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return Number(s);
  return NaN;
}
function extractNum(v) {
  const s = str(v);
  const m = s.match(/-?\d+(?:[.,]\d+)?/g);
  if (!m || m.length !== 1) return NaN;
  return parseNum(m[0]);
}

function strList(x, max = 12) {
  if (!Array.isArray(x)) return [];
  const out = [];
  for (const v of x) { const s = str(v).slice(0, 200); if (s && !out.includes(s)) out.push(s); if (out.length >= max) break; }
  return out;
}
function boolish(a) {
  if (typeof a === 'boolean') return a;
  const s = str(a).toLowerCase();
  if (['true', 'waar', 'ja', 'yes', 'juist', '1', 'wahr', 'vrai', 'verdadero', 'richtig'].includes(s)) return true;
  if (['false', 'onwaar', 'nee', 'no', 'onjuist', 'niet waar', '0', 'falsch', 'faux', 'falso', 'fout'].includes(s)) return false;
  return null;
}

export function normalizeQ(q) {
  try {
    if (!q || typeof q !== 'object') return null;
    let t = TYPES.includes(q.t) ? q.t : (Array.isArray(q.o) && q.o.length > 1 ? 'mc' : (typeof q.a === 'boolean' ? 'tf' : (typeof q.a === 'number' ? 'num' : 'type')));
    let text = str(q.q).slice(0, 400);
    const out = { t, q: text };
    if (t === 'mc') {
      let o = strList(q.o, 6);
      let a = str(typeof q.a === 'number' && q.o && q.o[q.a] !== undefined && !o.includes(String(q.a)) ? q.o[q.a] : q.a);
      if (!a) return null;
      const hit = o.find((x) => x.toLowerCase() === a.toLowerCase());
      if (hit) a = hit; else { if (o.length >= 6) o.pop(); o.push(a); }
      if (o.length < 2) return null;
      out.a = a; out.o = o;
    } else if (t === 'type') {
      const a = str(q.a); if (!a) return null;
      out.a = a.slice(0, 200);
      const alt = strList(q.alt).filter((x) => x !== a); if (alt.length) out.alt = alt;
    } else if (t === 'tf') {
      const b = boolish(q.a); if (b === null) return null;
      out.a = b;
    } else if (t === 'order') {
      const a = strList(q.a, 8); if (a.length < 2) return null;
      out.a = a; if (!text) out.q = 'Zet in de goede volgorde';
    } else if (t === 'match') {
      const pairs = [];
      if (Array.isArray(q.a)) for (const p of q.a) { if (Array.isArray(p) && str(p[0]) && str(p[1])) pairs.push([str(p[0]).slice(0, 120), str(p[1]).slice(0, 120)]); if (pairs.length >= 6) break; }
      if (pairs.length < 2) return null;
      out.a = pairs; if (!text) out.q = 'Verbind de paren';
    } else if (t === 'fill') {
      const a = str(q.a); if (!a) return null;
      out.a = a.slice(0, 200);
      if (!text.includes('___')) {
        const i = text.toLowerCase().indexOf(a.toLowerCase());
        out.q = i >= 0 ? text.slice(0, i) + '___' + text.slice(i + a.length) : (text ? text + ' ___' : '___');
      }
      const o = strList(q.o, 6);
      if (o.length) { const hit = o.find((x) => x.toLowerCase() === a.toLowerCase()); if (hit) out.a = hit; else { if (o.length >= 6) o.pop(); o.push(a); } if (o.length >= 2) out.o = o; }
      const alt = strList(q.alt).filter((x) => x !== out.a); if (alt.length) out.alt = alt;
    } else if (t === 'num') {
      const a = parseNum(q.a); if (!isFinite(a)) return null;
      out.a = a;
      const alt = (Array.isArray(q.alt) ? q.alt : []).map(parseNum).filter((x) => isFinite(x) && x !== a).slice(0, 6); if (alt.length) out.alt = alt;
      const tol = Number(q.tol); if (isFinite(tol) && tol > 0) out.tol = tol;
    } else if (t === 'multi') {
      const o = strList(q.o, 8);
      const a = strList(Array.isArray(q.a) ? q.a : [q.a], 8).map((x) => o.find((y) => y.toLowerCase() === x.toLowerCase()) || x);
      for (const x of a) if (!o.includes(x)) { if (o.length >= 8) return null; o.push(x); }
      if (o.length < 2 || !a.length) return null;
      out.o = o; out.a = a;
    }
    if (!out.q) return null;
    const e = str(q.e).slice(0, 16); if (e) out.e = e;
    const say = str(q.say).slice(0, 400); if (say) out.say = say;
    if (q.lang && LANGS[q.lang]) out.lang = q.lang;
    const x = str(q.x).slice(0, 400); if (x) out.x = x;
    const g = str(q.g).slice(0, 40); if (g) out.g = g;
    if (q.strict === true) out.strict = true;
    if (q.listen === true) out.listen = true;
    out.d = clamp(Math.round(Number(q.d)) || 2, 1, 3);
    return out;
  } catch (e) { return null; }
}

// Sleutel is bewust niet afhankelijk van mc/type/fill/num: dezelfde vraag+antwoord geeft dezelfde sleutel (voortgang telt mee als je de vraag omzet).
function ansCanon(q) {
  switch (q.t) {
    case 'tf': return q.a ? 'T' : 'F';
    case 'order': return (q.a || []).join('\u0001');
    case 'match': return (q.a || []).map((p) => p.join('\u0002')).sort().join('\u0001');
    case 'multi': return (q.a || []).slice().sort().join('\u0001');
    case 'num': return fmtNum(Number(q.a));
    default: return str(q.a).toLowerCase();
  }
}
export function qkey(q) {
  if (!q) return '0';
  const fam = ['mc', 'type', 'fill', 'num'].includes(q.t) ? 'a' : q.t;
  const s = fam + '|' + str(q.q).toLowerCase() + '|' + ansCanon(q);
  return (cyrb53(s) % 2821109907456).toString(36).padStart(8, '0');
}

/* ---------- tekst-vergelijking ---------- */
const ARTICLES = {
  nl: ['de', 'het', 'een', "'t", 't'],
  en: ['the', 'a', 'an', 'to'],
  de: ['der', 'die', 'das', 'ein', 'eine', 'den', 'dem'],
  fr: ['le', 'la', 'les', 'un', 'une', 'l', 'du', 'des'],
  es: ['el', 'la', 'los', 'las', 'un', 'una'],
};
const SPECIAL = { œ: 'oe', æ: 'ae', ø: 'o', ł: 'l', đ: 'd', ð: 'd', þ: 'th' };

function foldOne(s, mode) { // mode 'plain' of 'de' (umlauten uitschrijven)
  let r = s;
  if (mode === 'de') r = r.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue');
  r = r.replace(/ß/g, 'ss').replace(/[œæøłđðþ]/g, (c) => SPECIAL[c] || c);
  try { r = r.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) { /* oud */ }
  r = r.replace(/['’‘`´]/g, '');
  r = r.replace(/[^a-z0-9À-ɏͰ-ϿЀ-ӿ\s]/g, ' ');
  return r.replace(/\s+/g, ' ').trim();
}
function forms(s, lang, strict) {
  s = str(s).replace(/\s+/g, ' ');
  if (strict) return { full: [s], noArt: [s] };
  let base = s.normalize ? s.normalize('NFKC') : s;
  base = base.toLowerCase().replace(/[’‘`´]/g, "'").replace(/^(l|d)'/, '$1 ');
  const full = [foldOne(base, 'plain')];
  if (/[äöü]/.test(base)) full.push(foldOne(base, 'de'));
  const arts = ARTICLES[lang] || ARTICLES.nl;
  const noArt = full.map((f) => {
    const w = f.split(' ');
    if (w.length > 1 && arts.includes(w[0])) return w.slice(1).join(' ');
    return f;
  });
  return { full: [...new Set(full)], noArt: [...new Set(noArt)] };
}
function lev(a, b) { // Damerau (OSA): een verwisseling telt als 1
  const n = a.length, m = b.length;
  if (Math.abs(n - m) > 2) return 3;
  const d = [];
  for (let i = 0; i <= n; i++) { d[i] = [i]; }
  for (let j = 0; j <= m; j++) d[0][j] = j;
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    const c = a[i - 1] === b[j - 1] ? 0 : 1;
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[n][m];
}
function expandAnswers(a, alt) {
  const out = [];
  const add = (s) => { s = str(s); if (s && !out.includes(s)) out.push(s); };
  for (const raw of [a, ...(alt || [])]) {
    let parts = [str(raw)];
    if (/\s\/\s|\||;/.test(parts[0])) parts = parts[0].split(/\s+\/\s+|\||;/);
    for (const p of parts) {
      add(p);
      if (/\(.*\)/.test(p)) { add(p.replace(/\([^)]*\)/g, ' ')); add(p.replace(/[()]/g, '')); }
    }
  }
  return out;
}
// -> { ok, typo?, article? }
function matchText(given, answers, lang, strict) {
  const g = str(given);
  if (!g) return { ok: false };
  if (strict) {
    const gs = g.replace(/\s+/g, ' ');
    return { ok: answers.some((a) => str(a).replace(/\s+/g, ' ') === gs) };
  }
  const gf = forms(g, lang);
  let typo = false, article = false;
  for (const a of answers) {
    const af = forms(a, lang);
    const eq = (x, y) => x === y || x.replace(/ /g, '') === y.replace(/ /g, '');
    for (const x of gf.full) for (const y of af.full) if (eq(x, y)) return { ok: true };
    for (const x of gf.noArt) for (const y of af.full) if (x && eq(x, y)) return { ok: true };
    for (const x of gf.full) for (const y of af.noArt) if (x && eq(x, y)) { if (lang === 'nl' || lang === 'en') return { ok: true }; article = true; }
    if (!typo) {
      for (const x of gf.noArt) for (const y of af.noArt) {
        if (y.length >= 5 && !/\d/.test(y) && x.length >= 4 && lev(x, y) <= 1) typo = true;
      }
      for (const x of gf.full) for (const y of af.full) {
        if (y.length >= 5 && !/\d/.test(y) && x.length >= 4 && lev(x, y) <= 1) typo = true;
      }
    }
  }
  if (typo) return { ok: true, typo: true };
  if (article) return { ok: false, article: true };
  return { ok: false };
}

function correctText(q) {
  switch (q.t) {
    case 'tf': return q.a ? 'Waar' : 'Onwaar';
    case 'order': return q.a.join(' → ');
    case 'match': return q.a.map((p) => p[0] + ' = ' + p[1]).join('; ');
    case 'num': return fmtNum(Number(q.a));
    case 'multi': return q.a.join(', ');
    default: return str(q.a);
  }
}

export function checkAnswer(q, given, opts = {}) {
  const res = { ok: false, correct: '' };
  try {
    if (!q) return res;
    res.correct = correctText(q);
    const strict = opts.strict === true || q.strict === true;
    const lang = q.lang || 'nl';
    switch (q.t) {
      case 'mc': {
        let g = given;
        if (typeof g === 'number' && q.o && q.o[g] !== undefined) g = q.o[g];
        res.ok = str(g).toLowerCase() === str(q.a).toLowerCase();
        break;
      }
      case 'tf': { const b = boolish(given); res.ok = b !== null && b === !!q.a; break; }
      case 'type': case 'fill': {
        if (q.t === 'fill' && q.o && given !== undefined && str(given).toLowerCase() === str(q.a).toLowerCase()) { res.ok = true; break; }
        const m = matchText(given, expandAnswers(q.a, q.alt), lang, strict);
        res.ok = m.ok;
        if (m.typo) res.typo = true;
        if (m.article) res.partial = 0.75;
        if (!m.ok && !m.article && q.t === 'fill' && q.o) res.ok = false;
        break;
      }
      case 'num': {
        let v = parseNum(given);
        if (!isFinite(v)) v = extractNum(given);
        if (!isFinite(v)) break;
        const targets = [q.a, ...(q.alt || [])];
        for (const a of targets) {
          const tol = q.tol !== undefined ? q.tol : (Number.isInteger(a) ? 1e-9 : Math.max(0.005, Math.abs(a) * 0.002));
          if (Math.abs(v - a) <= tol + 1e-12) { res.ok = true; break; }
        }
        break;
      }
      case 'order': {
        const g = Array.isArray(given) ? given : [];
        const n = q.a.length;
        let hits = 0;
        for (let i = 0; i < n; i++) if (g[i] !== undefined && str(g[i]).toLowerCase() === str(q.a[i]).toLowerCase()) hits++;
        res.ok = hits === n && g.length === n;
        if (!res.ok) res.partial = hits / n;
        break;
      }
      case 'match': {
        const g = Array.isArray(given) ? given : [];
        let hits = 0;
        for (const [l, r] of q.a) if (g.some((p) => Array.isArray(p) && str(p[0]).toLowerCase() === l.toLowerCase() && str(p[1]).toLowerCase() === r.toLowerCase())) hits++;
        const n = q.a.length;
        res.ok = hits === n && g.length === n;
        if (!res.ok) res.partial = hits / n;
        break;
      }
      case 'multi': {
        const g = new Set((Array.isArray(given) ? given : []).map((x) => str(x).toLowerCase()));
        const a = new Set(q.a.map((x) => x.toLowerCase()));
        let hit = 0, bad = 0;
        for (const x of g) if (a.has(x)) hit++; else bad++;
        res.ok = hit === a.size && bad === 0;
        if (!res.ok) res.partial = clamp((hit - bad) / a.size, 0, 1);
        break;
      }
      default: break;
    }
  } catch (e) { /* nooit gooien */ }
  return res;
}

function isNumText(s) { return isFinite(parseNum(s)) && /^-?[\d.,\s]+$/.test(str(s)); }
function poolAns(p) {
  if (!p) return '';
  if (p.t === 'num') return fmtNum(Number(p.a));
  if (['mc', 'type', 'fill'].includes(p.t)) return str(p.a);
  return '';
}
function numDistractors(ansText, rand) {
  const a = parseNum(ansText);
  if (!isFinite(a)) return [];
  const dec = (ansText.split(/[.,]/)[1] || '').length;
  const step = dec ? Math.pow(10, -dec) : 1;
  const cand = [];
  if (!dec) {
    cand.push(a + 1, a - 1, a + 2, a - 2, a + 10, a - 10, Math.round(a * 1.1), Math.round(a * 0.9), a * 2, Math.round(a / 2), a + 5, a - 5, a + 100, a - 100);
    if (Math.abs(a) >= 10) { const r = Number(String(Math.abs(a)).split('').reverse().join('')); cand.push(a < 0 ? -r : r); }
  } else cand.push(a + step, a - step, a + 2 * step, a - 2 * step, a * 10, a / 10, a + 10 * step, a - 10 * step);
  const seen = new Set([fmtNum(a)]);
  const out = [];
  for (const c of cand) {
    if (!isFinite(c)) continue;
    if (a >= 0 && c < 0) continue;
    const t = fmtNum(Math.round(c / step) * step);
    if (seen.has(t)) continue;
    seen.add(t); out.push({ t, d: Math.abs(c - a) });
  }
  // dichtbije waarden eerst, met een beetje willekeur
  out.sort((x, y) => x.d * (0.7 + rand() * 0.6) - y.d * (0.7 + rand() * 0.6));
  return out.map((x) => x.t);
}
function mutateWord(s, rand) {
  if (s.length < 4 || /\s/.test(s)) return null;
  const ch = s.split('');
  const i = 1 + Math.floor(rand() * (ch.length - 2));
  if (ch[i] !== ch[i + 1] && i + 1 < ch.length) { const t = ch[i]; ch[i] = ch[i + 1]; ch[i + 1] = t; }
  else { const v = 'aeiou'; const k = v.indexOf(ch[i].toLowerCase()); ch[i] = k >= 0 ? v[(k + 1) % 5] : ch[i]; }
  const r = ch.join('');
  return r === s ? null : r;
}

export function makeOptions(q, pool, n = 4, rand = Math.random) {
  const base = normalizeQ(q) || (q ? { ...q } : null);
  if (!base) return base;
  n = clamp(Math.round(n) || 4, 2, 6);
  const t = base.t;
  if (t === 'order' || t === 'match' || t === 'multi') return { ...base };
  if (t === 'tf') return { ...base, t: 'mc', a: base.a ? 'Waar' : 'Onwaar', o: ['Waar', 'Onwaar'] };
  const ansText = t === 'num' ? fmtNum(Number(base.a)) : str(base.a);
  const takenN = new Set([ansText.toLowerCase()]);
  for (const al of base.alt || []) takenN.add((t === 'num' ? fmtNum(Number(al)) : str(al)).toLowerCase());
  let keep = [];
  if ((t === 'mc' || t === 'fill') && Array.isArray(base.o)) {
    keep = base.o.filter((x) => x.toLowerCase() !== ansText.toLowerCase());
    if (base.o.length === n) return { ...base };
    keep = shuffle(keep, rand);
  }
  const need = n - 1;
  const chosen = keep.slice(0, need);
  const have = new Set([...chosen.map((x) => x.toLowerCase()), ...takenN]);
  const numeric = t === 'num' || isNumText(ansText);
  if (chosen.length < need && numeric) {
    for (const d of numDistractors(ansText, rand)) { if (chosen.length >= Math.min(need, 3)) break; if (!have.has(d.toLowerCase())) { have.add(d.toLowerCase()); chosen.push(d); } }
  }
  if (chosen.length < need) {
    const bl = (base.q || '').toLowerCase();
    const cands = [];
    for (const p of pool || []) {
      if (!p || p === q) continue;
      const pa = poolAns(p);
      if (!pa || have.has(pa.toLowerCase()) || str(p.q).toLowerCase() === bl) continue;
      let sc = rand();
      if (base.g && p.g === base.g) sc += 3;
      if ((base.lang || '') === (p.lang || '')) sc += 2;
      if (p.t === base.t) sc += 0.8;
      if (isNumText(pa) === numeric) sc += 2; else sc -= 3;
      sc += (pa.split(' ').length === ansText.split(' ').length ? 1.5 : 0);
      sc -= Math.abs(pa.length - ansText.length) / Math.max(6, ansText.length);
      if ((pa[0] === pa[0].toUpperCase()) === (ansText[0] === ansText[0].toUpperCase())) sc += 0.5;
      cands.push({ pa, sc });
    }
    cands.sort((x, y) => y.sc - x.sc);
    for (const c of cands) { if (chosen.length >= need) break; const k = c.pa.toLowerCase(); if (have.has(k)) continue; have.add(k); chosen.push(c.pa); }
  }
  if (chosen.length < need && numeric) {
    for (const d of numDistractors(ansText, rand)) { if (chosen.length >= need) break; if (!have.has(d.toLowerCase())) { have.add(d.toLowerCase()); chosen.push(d); } }
  }
  if (chosen.length < need) {
    for (let k = 0; k < 6 && chosen.length < Math.min(need, 3); k++) {
      const m = mutateWord(ansText, rand);
      if (m && !have.has(m.toLowerCase())) { have.add(m.toLowerCase()); chosen.push(m); }
    }
  }
  if (!chosen.length) return { ...base };
  const o = shuffle([ansText, ...chosen], rand);
  if (t === 'fill') return { ...base, o, a: ansText };
  const out = { ...base, t: 'mc', a: ansText, o };
  delete out.alt; delete out.tol;
  return out;
}

export function toTypeQ(q) {
  if (!q) return q;
  if (q.t === 'mc') { const out = { ...q, t: 'type' }; delete out.o; return out; }
  if (q.t === 'fill' && q.o) { const out = { ...q }; delete out.o; return out; }
  return { ...q };
}

/* ============================== kits kiezen ============================== */
function weightedOrder(items, weights, rand) {
  return items.map((it, i) => ({ it, k: Math.pow(Math.max(rand(), 1e-12), 1 / Math.max(weights[i], 1e-6)) })).sort((a, b) => b.k - a.k).map((x) => x.it);
}
const BOX_W = [3, 2.6, 2.1, 1.4, 0.8, 0.45];
function diffW(d, hard) {
  d = d || 2;
  if (d === hard) return 1.5;
  if (d < hard) return hard - d === 1 ? 0.55 : 0.25;
  return d - hard === 1 ? 0.3 : 0.08;
}

export function pick(kit, n, o = {}) {
  const qs = ((kit && kit.qs) || []).filter(Boolean);
  n = Math.max(0, Math.floor(n) || 0);
  if (!qs.length || !n) return [];
  const rand = o.seed !== undefined && o.seed !== null ? rng(o.seed) : Math.random;
  const types = Array.isArray(o.types) && o.types.length ? o.types : null;
  const kitId = o.kitId || (kit && kit.id);
  let items = [];
  if (types) {
    for (const q of qs) {
      if (types.includes(q.t)) items.push(q);
      else if (o.convert !== false && types.includes('mc') && ['type', 'num', 'fill', 'tf'].includes(q.t) && qs.length >= 3) items.push(makeOptions(q, qs, 4, rand));
      else if (o.convert !== false && types.includes('type') && (q.t === 'mc' || (q.t === 'fill' && q.o))) items.push(toTypeQ(q));
    }
    if (!items.length) items = qs.slice();
  } else items = qs.slice();
  const avoid = o.avoid instanceof Set ? o.avoid : null;
  const out = [];
  let cycle = 0;
  let last = null;
  while (out.length < n) {
    const w = items.map((q) => {
      let x = 1;
      if (o.hard) x *= diffW(q.d, clamp(o.hard, 1, 3));
      if (cycle === 0) {
        if (o.weakFirst && kitId) { const k = qkey(q); x *= BOX_W[Prog.box(kitId, k)] * (Prog.isDue(kitId, k) ? 1.6 : 1); }
        if (avoid && avoid.has(qkey(q))) x *= 0.001;
      }
      return x;
    });
    let ord = weightedOrder(items, w, rand);
    if (cycle > 0 && last && ord.length > 1 && ord[0] === last) { const t = ord[0]; ord[0] = ord[1]; ord[1] = t; }
    for (const q of ord) { out.push(q); last = q; if (out.length >= n) break; }
    cycle++;
    if (cycle > 1000) break;
  }
  return out;
}

/* ============================== opslag (lokaal + cloud) ============================== */
const ENV = { uid: 'anon', db: null, me: null, fs: null, fsFail: 0 };
const mem = new Map();
function LS() { try { return globalThis.localStorage || null; } catch (e) { return null; } }
function lsGet(k) { try { const s = LS(); if (s) return s.getItem(k); } catch (e) { /* privémodus */ } return mem.has(k) ? mem.get(k) : null; }
function lsSet(k, v) { try { const s = LS(); if (s) { s.setItem(k, v); return true; } } catch (e) { /* vol */ } mem.set(k, v); return false; }
const lk = (name) => `learn:${ENV.uid}:${name}`;
const jparse = (s) => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const withTimeout = (p, ms, fb = null) => Promise.race([p, sleep(ms).then(() => fb)]);

async function getFs() {
  if (ENV.fs) return ENV.fs;
  if (ENV.fsFail && Date.now() - ENV.fsFail < 60000) return null;
  try { ENV.fs = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js'); return ENV.fs; } catch (e) { ENV.fsFail = Date.now(); return null; }
}
const cloudOn = () => !!(ENV.db && ENV.uid && ENV.uid !== 'anon');
async function cloudGet(game) {
  if (!cloudOn()) return null;
  const fs = await getFs(); if (!fs) return null;
  try {
    const s = await withTimeout(fs.getDoc(fs.doc(ENV.db, 'gamesaves', game + '__' + ENV.uid)), 8000, null);
    if (!s || !s.exists()) return null;
    const d = s.data();
    if (!d || typeof d.data !== 'string') return null;
    return { data: d.data, updated: Number(d.updated) || 0 };
  } catch (e) { return null; }
}
async function cloudSet(game, data, updated) {
  if (!cloudOn() || typeof data !== 'string' || data.length > 18000) return false;
  const fs = await getFs(); if (!fs) return false;
  try {
    await withTimeout(fs.setDoc(fs.doc(ENV.db, 'gamesaves', game + '__' + ENV.uid), { game, uid: ENV.uid, data, updated: Number(updated) || Date.now() }), 10000, null);
    return true;
  } catch (e) { return false; }
}

const DOMS = {}; // naam -> { ser(), cloud() -> [{game,data,updated}] }
const SYNC = { dirty: new Set(), last: {}, lastData: {}, timer: null, localTimer: null, localDirty: new Set(), wired: false };
export const CLOUD_MIN_MS = 30000;

function writeLocal() {
  SYNC.localTimer = null;
  for (const n of SYNC.localDirty) { try { if (DOMS[n]) lsSet(lk(n), DOMS[n].ser()); } catch (e) { /* stil */ } }
  SYNC.localDirty.clear();
}
async function cloudFlush(name) {
  SYNC.dirty.delete(name);
  SYNC.last[name] = Date.now();
  if (!cloudOn() || !DOMS[name]) return;
  let parts = [];
  try { parts = DOMS[name].cloud(); } catch (e) { return; }
  for (const p of parts) {
    const key = ENV.uid + '|' + p.game;
    if (SYNC.lastData[key] === p.data) continue;
    if (await cloudSet(p.game, p.data, p.updated)) SYNC.lastData[key] = p.data;
  }
}
function cloudSchedule() {
  if (SYNC.timer || !SYNC.dirty.size || !cloudOn()) return;
  let due = Infinity;
  for (const n of SYNC.dirty) due = Math.min(due, Math.max(Date.now() + 1500, (SYNC.last[n] || 0) + CLOUD_MIN_MS));
  SYNC.timer = setTimeout(async () => {
    SYNC.timer = null;
    const now = Date.now();
    for (const n of [...SYNC.dirty]) if (now >= (SYNC.last[n] || 0) + CLOUD_MIN_MS) await cloudFlush(n);
    cloudSchedule();
  }, Math.max(0, due - Date.now()));
}
function touch(name, cloud = true) {
  SYNC.localDirty.add(name);
  if (!SYNC.localTimer) SYNC.localTimer = setTimeout(writeLocal, 250);
  if (cloud && cloudOn()) { SYNC.dirty.add(name); cloudSchedule(); }
}
export async function flushAll() { // bij sluiten / wisselen van scherm
  if (SYNC.localTimer) { clearTimeout(SYNC.localTimer); SYNC.localTimer = null; }
  writeLocal();
  for (const n of [...SYNC.dirty]) await cloudFlush(n);
}
function wire() {
  if (SYNC.wired) return;
  SYNC.wired = true;
  try {
    if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('pagehide', () => { flushAll(); });
    if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('visibilitychange', () => { if (document.hidden) flushAll(); });
  } catch (e) { /* geen DOM */ }
}

export function bindCtx(ctx) {
  ctx = ctx || {};
  const uid = String(ctx.uid || (ctx.me && (ctx.me.uid || ctx.me.id)) || 'anon');
  if (uid !== ENV.uid) {
    writeLocal();
    ENV.uid = uid;
    ST.prog = ST.profile = ST.kits = null; ST.loads = {}; kitCache.clear();
    SYNC.dirty.clear();
  }
  if (ctx.db && !ENV.db) ST.loads = {}; // cloud komt er later bij: opnieuw samenvoegen
  ENV.db = ctx.db || null;
  ENV.me = ctx.me || null;
  wire();
  loadSettings();
}
export function unbindCtx() { return flushAll(); } // extra

const ST = { prog: null, profile: null, kits: null, loads: {} };
const listeners = { kits: new Set(), profile: new Set() };
const emit = (set, ev) => { for (const f of [...set]) { try { f(ev); } catch (e) { /* luisteraar */ } } };

/* ============================== instellingen (voorlezen/geluid) ============================== */
const SET = { tts: false, rate: 1, snd: true, voices: {} };
let setLoaded = false;
function loadSettings() {
  const s = jparse(lsGet('learn:_:settings'));
  if (s && typeof s === 'object') {
    SET.tts = !!s.tts; SET.rate = clamp(Number(s.rate) || 1, 0.5, 1.6); SET.snd = s.snd !== false; SET.voices = s.voices && typeof s.voices === 'object' ? s.voices : {};
  }
  setLoaded = true;
  TTS.on = SET.tts; TTS.rate = SET.rate; Snd.on = SET.snd;
}
function saveSettings() { lsSet('learn:_:settings', JSON.stringify(SET)); }

/* ============================== kits (eigen) ============================== */
const MAX_KITS = 60, MAX_QS = 500;
const kitCache = new Map();
function cleanKit(k, keepUpd) {
  if (!k || typeof k !== 'object') return null;
  const qs = [];
  for (const q of Array.isArray(k.qs) ? k.qs : []) { const n = normalizeQ(q); if (n) qs.push(n); if (qs.length >= MAX_QS) break; }
  const now = Date.now();
  const out = {
    id: str(k.id) || Kits.newId(),
    name: str(k.name).slice(0, 60) || 'Mijn kit',
    emoji: str(k.emoji).slice(0, 8) || '📘',
    desc: str(k.desc).slice(0, 200),
    qs, src: 'user',
    upd: keepUpd ? (Number(k.upd) || now) : now,
    created: Number(k.created) || now,
  };
  if (k.lang && LANGS[k.lang]) out.lang = k.lang;
  const g = str(k.group).slice(0, 30); if (g) out.group = g;
  return out;
}
function ensureKits() {
  if (ST.kits) return ST.kits;
  const raw = jparse(lsGet(lk('kits')));
  const s = { v: 1, kits: [], dead: {} };
  if (raw && typeof raw === 'object') {
    for (const k of Array.isArray(raw.kits) ? raw.kits : []) { const c = cleanKit(k, true); if (c) s.kits.push(c); }
    if (raw.dead && typeof raw.dead === 'object') s.dead = raw.dead;
  }
  ST.kits = s;
  return s;
}
function mergeKitStates(a, b) {
  const dead = { ...a.dead };
  for (const [id, ts] of Object.entries(b.dead || {})) dead[id] = Math.max(dead[id] || 0, Number(ts) || 0);
  const map = new Map();
  for (const k of [...a.kits, ...b.kits]) { const o = map.get(k.id); if (!o || k.upd > o.upd) map.set(k.id, k); }
  const kits = [...map.values()].filter((k) => !(dead[k.id] && dead[k.id] >= k.upd));
  for (const id of Object.keys(dead)) if (Date.now() - dead[id] > 90 * 86400000) delete dead[id];
  return { v: 1, kits, dead };
}
function kitBlocks(s) {
  const blocks = [0, 1, 2, 3, 4].map(() => ({ kits: [], len: 40 }));
  blocks[0].dead = s.dead; blocks[0].len += JSON.stringify(s.dead).length;
  const sorted = s.kits.slice().sort((a, b) => a.created - b.created);
  const skipped = [];
  for (const k of sorted) {
    const js = JSON.stringify(k);
    const b = blocks.find((x) => x.len + js.length + 1 <= 17400);
    if (b) { b.kits.push(k); b.len += js.length + 1; } else skipped.push(k.id);
  }
  return { blocks, skipped };
}
DOMS.kits = {
  ser: () => JSON.stringify(ensureKits()),
  cloud: () => {
    const s = ensureKits();
    const { blocks } = kitBlocks(s);
    return blocks.map((b, i) => ({ game: 'learn-kits-' + i, data: JSON.stringify({ v: 1, kits: b.kits, dead: i === 0 ? s.dead : undefined }), updated: Date.now() }));
  },
};
export const Kits = {
  async load() {
    ensureKits();
    if (ST.loads.kits) return ST.loads.kits;
    ST.loads.kits = (async () => {
      if (cloudOn()) {
        try {
          const rs = await Promise.all([0, 1, 2, 3, 4].map((i) => cloudGet('learn-kits-' + i)));
          let merged = ensureKits(), changed = false;
          for (const r of rs) {
            if (!r) continue;
            const j = jparse(r.data);
            if (!j || typeof j !== 'object') continue;
            const rem = { v: 1, kits: (Array.isArray(j.kits) ? j.kits : []).map((k) => cleanKit(k, true)).filter(Boolean), dead: j.dead || {} };
            merged = mergeKitStates(merged, rem); changed = true;
          }
          if (changed) {
            ST.kits = merged;
            touch('kits'); // lokaal bijwerken; cloud alleen als er iets nieuws is (zie lastData)
            emit(listeners.kits, { type: 'load' });
          }
        } catch (e) { /* stil */ }
      }
      return Kits.list();
    })();
    return ST.loads.kits;
  },
  list() { return ensureKits().kits.slice().sort((a, b) => b.upd - a.upd); },
  get(id) { const k = ensureKits().kits.find((x) => x.id === id); return k || null; },
  newId() { return 'k' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36).padStart(3, '0'); },
  save(kit) {
    const s = ensureKits();
    const isNew = !(kit && kit.id && s.kits.some((x) => x.id === kit.id));
    const c = cleanKit(kit, false);
    if (!c) return null;
    if (!isNew) { const old = s.kits.find((x) => x.id === c.id); c.created = old.created; }
    if (isNew && s.kits.length >= MAX_KITS) return null;
    s.kits = s.kits.filter((x) => x.id !== c.id);
    s.kits.push(c);
    delete s.dead[c.id];
    kitCache.set(c.id, c);
    if (isNew) Profile.stat('kits', 1);
    touch('kits');
    emit(listeners.kits, { type: 'save', id: c.id });
    return c;
  },
  remove(id) {
    const s = ensureKits();
    if (!s.kits.some((x) => x.id === id)) return false;
    s.kits = s.kits.filter((x) => x.id !== id);
    s.dead[id] = Date.now();
    kitCache.delete(id);
    touch('kits');
    emit(listeners.kits, { type: 'remove', id });
    return true;
  },
  onChange(fn) { listeners.kits.add(fn); return () => listeners.kits.delete(fn); },
  cloudSkipped() { return kitBlocks(ensureKits()).skipped; }, // extra: kits die te groot zijn voor de cloud (blijven lokaal)
};

let packList = null;
async function getPacks() {
  if (packList) return packList;
  try { const m = await import('./packs/index.js?v=1'); packList = Array.isArray(m.PACKS) ? m.PACKS : []; } catch (e) { packList = []; }
  return packList;
}
const packKits = new Map();
async function loadPack(p) {
  if (packKits.has(p.id)) return packKits.get(p.id);
  let kit = null;
  try {
    const raw = await p.load();
    if (raw) {
      const qs = [];
      for (const q of raw.qs || []) { const n = normalizeQ(q); if (n) qs.push(n); }
      kit = { id: p.id, name: raw.name || p.name, emoji: raw.emoji || p.emoji, desc: raw.desc || p.desc || '', lang: raw.lang || p.lang, group: raw.group || p.group, qs, src: 'pack' };
    }
  } catch (e) { kit = null; }
  if (kit) { packKits.set(p.id, kit); kitCache.set(p.id, kit); }
  return kit;
}
export async function allKits() {
  await withTimeout(Kits.load(), 2500, null);
  const mine = Kits.list().map((k) => ({ id: k.id, name: k.name, emoji: k.emoji, group: k.group || 'Eigen', count: k.qs.length, lang: k.lang, src: 'user', load: async () => Kits.get(k.id) }));
  const packs = (await getPacks()).map((p) => ({ id: p.id, name: p.name, emoji: p.emoji, group: p.group, count: p.count || (packKits.get(p.id) ? packKits.get(p.id).qs.length : 0), lang: p.lang, src: 'pack', load: () => loadPack(p) }));
  return [...mine, ...packs];
}
export async function getKit(id) {
  if (!id) return null;
  const k = Kits.get(id);
  if (k) { kitCache.set(id, k); return k; }
  const p = (await getPacks()).find((x) => x.id === id);
  return p ? loadPack(p) : null;
}

/* ============================== voortgang (Leitner) ============================== */
const HOUR = 3600000, EPOCH = Date.UTC(2024, 0, 1);
const hoursNow = () => Math.floor((Date.now() - EPOCH) / HOUR);
const INTERVAL_H = [0, 0, 18, 66, 160, 480]; // box -> uren voordat herhalen weer nodig is
const defProg = () => ({ v: 1, upd: 0, k: {}, days: {}, streak: 0, best: 0, last: '', goal: 20 });
function migrateProg(r) {
  const p = defProg();
  if (!r || typeof r !== 'object') return p;
  p.upd = Number(r.upd) || 0;
  if (r.k && typeof r.k === 'object') for (const [id, kk] of Object.entries(r.k)) {
    const q = {};
    if (kk && kk.q && typeof kk.q === 'object') for (const [key, e] of Object.entries(kk.q)) if (Array.isArray(e)) q[key] = [clamp(e[0] | 0, 0, 5), e[1] | 0, e[2] | 0, e[3] | 0];
    p.k[id] = { q, h: Array.isArray(kk && kk.h) ? kk.h.slice(-12) : [] };
  }
  if (r.days && typeof r.days === 'object') for (const [d, v] of Object.entries(r.days)) if (Array.isArray(v)) p.days[d] = [v[0] | 0, v[1] | 0, v[2] | 0];
  p.streak = r.streak | 0; p.best = r.best | 0; p.last = str(r.last); p.goal = clamp(r.goal | 0 || 20, 1, 500);
  return p;
}
function mergeProg(a, b) {
  const out = defProg();
  out.upd = Math.max(a.upd, b.upd);
  const ids = new Set([...Object.keys(a.k), ...Object.keys(b.k)]);
  for (const id of ids) {
    const x = a.k[id] || { q: {}, h: [] }, y = b.k[id] || { q: {}, h: [] };
    const q = { ...x.q };
    for (const [key, e] of Object.entries(y.q)) { const o = q[key]; if (!o || e[1] > o[1] || (e[1] === o[1] && e[2] > o[2])) q[key] = e; }
    const hm = new Map();
    for (const h of [...x.h, ...y.h]) hm.set(h && h.ts ? h.ts : JSON.stringify(h), h);
    out.k[id] = { q, h: [...hm.values()].sort((m, n) => (m.ts || 0) - (n.ts || 0)).slice(-12) };
  }
  const days = new Set([...Object.keys(a.days), ...Object.keys(b.days)]);
  for (const d of days) { const x = a.days[d] || [0, 0, 0], y = b.days[d] || [0, 0, 0]; out.days[d] = [Math.max(x[0], y[0]), Math.max(x[1], y[1]), Math.max(x[2], y[2])]; }
  const newer = a.last >= b.last ? a : b;
  out.streak = newer.streak; out.last = newer.last; out.best = Math.max(a.best, b.best, out.streak);
  out.goal = (a.upd >= b.upd ? a : b).goal;
  return out;
}
function pruneProgForCloud(p) {
  const clone = JSON.parse(JSON.stringify(p));
  let s = JSON.stringify(clone);
  const lim = 17500;
  if (s.length <= lim) return s;
  for (const k of Object.values(clone.k)) k.h = k.h.slice(-4);
  const days = Object.keys(clone.days).sort(); for (const d of days.slice(0, Math.max(0, days.length - 21))) delete clone.days[d];
  s = JSON.stringify(clone); if (s.length <= lim) return s;
  const all = [];
  for (const [id, k] of Object.entries(clone.k)) for (const [key, e] of Object.entries(k.q)) all.push({ id, key, score: (e[0] === 0 && e[2] <= 1 ? -1e9 : 0) + e[1] });
  all.sort((x, y) => x.score - y.score);
  let i = 0;
  while (s.length > lim && i < all.length) {
    const cut = Math.max(20, Math.ceil(all.length * 0.05));
    for (let j = 0; j < cut && i < all.length; j++, i++) delete clone.k[all[i].id].q[all[i].key];
    s = JSON.stringify(clone);
  }
  return s.length <= 18000 ? s : JSON.stringify({ ...clone, k: {} });
}
function ensureProg() {
  if (!ST.prog) ST.prog = migrateProg(jparse(lsGet(lk('prog'))));
  return ST.prog;
}
DOMS.prog = { ser: () => JSON.stringify(ensureProg()), cloud: () => { const p = ensureProg(); return [{ game: 'learn-prog', data: pruneProgForCloud(p), updated: p.upd }]; } };
const kq = (q) => (typeof q === 'string' ? q : qkey(q));
function kitProg(id, make) { const p = ensureProg(); if (!p.k[id] && make) p.k[id] = { q: {}, h: [] }; return p.k[id]; }
function dayRow(p, key) { return p.days[key] || (p.days[key] = [0, 0, 0]); }
function streakNow(p) { const t = todayKey(); return p.last === t || p.last === addDays(t, -1) ? p.streak : 0; }

export const Prog = {
  INTERVAL_H,
  async load() {
    ensureProg();
    if (ST.loads.prog) return ST.loads.prog;
    ST.loads.prog = (async () => {
      if (cloudOn()) {
        const r = await cloudGet('learn-prog');
        if (r) {
          const j = jparse(r.data);
          if (j) {
            const merged = mergeProg(ensureProg(), migrateProg(j));
            const had = ST.prog;
            ST.prog = merged;
            void had;
            touch('prog');
          }
        }
      }
      return true;
    })();
    return ST.loads.prog;
  },
  box(kitId, q) { const k = kitProg(kitId); const e = k && k.q[kq(q)]; return e ? e[0] : 0; },
  seen(kitId, q) { const k = kitProg(kitId); const e = k && k.q[kq(q)]; return e ? e[2] : 0; }, // extra
  isDue(kitId, q) { // extra
    const k = kitProg(kitId); const e = k && k.q[kq(q)];
    if (!e) return true;
    if (e[0] <= 1) return true;
    return hoursNow() - e[1] >= INTERVAL_H[e[0]];
  },
  dueInHours(kitId, q) { const k = kitProg(kitId); const e = k && k.q[kq(q)]; if (!e || e[0] <= 1) return 0; return Math.max(0, INTERVAL_H[e[0]] - (hoursNow() - e[1])); }, // extra
  record(kitId, q, ok, ms) {
    const key = kq(q);
    const p = ensureProg();
    const k = kitProg(kitId || '_', true);
    const now = hoursNow();
    const e = k.q[key] || (k.q[key] = [0, now, 0, 0]);
    const prev = e[0];
    const due = prev <= 1 || now - e[1] >= INTERVAL_H[prev];
    if (ok) { if (due) { e[0] = Math.min(5, prev + 1); e[1] = now; } e[3]++; }
    else { e[0] = prev <= 1 ? 0 : prev - 2; e[1] = now; }
    e[2]++;
    const day = todayKey();
    if (p.last !== day) { p.streak = p.last === addDays(day, -1) ? p.streak + 1 : 1; p.last = day; p.best = Math.max(p.best, p.streak); }
    const row = dayRow(p, day); row[0]++; if (ok) row[1]++;
    const keys = Object.keys(p.days);
    if (keys.length > 60) for (const d of keys.sort().slice(0, keys.length - 45)) delete p.days[d];
    p.upd = Date.now();
    touch('prog');
    Profile._answer(!!ok, Number(ms) || 0);
    return { box: e[0], prev, promoted: e[0] > prev };
  },
  _dayXp(n) { const p = ensureProg(); dayRow(p, todayKey())[2] += n; p.upd = Date.now(); touch('prog'); },
  dueFirst(kit) {
    const qs = ((kit && kit.qs) || []).filter(Boolean);
    const id = kit && kit.id;
    const now = hoursNow();
    const k = id ? kitProg(id) : null;
    const rank = qs.map((q, i) => {
      const e = k && k.q[qkey(q)];
      if (!e) return { q, i, g: 2, s: 0 };
      const overdue = e[0] <= 1 ? 1e6 : (now - e[1]) / Math.max(1, INTERVAL_H[e[0]]);
      if (e[0] <= 1) return { q, i, g: 0, s: e[0] };
      if (overdue >= 1) return { q, i, g: 1, s: -overdue };
      return { q, i, g: 3, s: INTERVAL_H[e[0]] - (now - e[1]) };
    });
    rank.sort((a, b) => a.g - b.g || a.s - b.s || a.i - b.i);
    return rank.map((r) => r.q);
  },
  weak(kitId, n = 10, kit) {
    const k = kitProg(kitId);
    kit = kit || kitCache.get(kitId) || Kits.get(kitId) || packKits.get(kitId);
    if (!k || !kit) return [];
    const list = [];
    for (const q of kit.qs || []) {
      const e = k.q[qkey(q)];
      if (!e || e[2] === 0) continue;
      const wrong = e[2] - e[3];
      if (e[0] >= 4 && wrong === 0) continue;
      list.push({ q, s: e[0] * 10 - wrong * 3 - (e[2] ? (e[3] / e[2]) * 5 : 0) });
    }
    list.sort((a, b) => a.s - b.s);
    return list.slice(0, n).map((x) => x.q);
  },
  mastery(kitId, kit) {
    const k = kitProg(kitId);
    const qs = ((kit && kit.qs) || []).filter(Boolean);
    let known = 0, learning = 0, fresh = 0, sum = 0;
    for (const q of qs) {
      const e = k && k.q[qkey(q)];
      if (!e || !e[2]) { fresh++; continue; }
      if (e[0] >= 4) known++; else learning++;
      sum += e[0] / 5;
    }
    const total = qs.length;
    return { pct: total ? Math.round((sum / total) * 100) : 0, known, learning, new: fresh, total };
  },
  history(kitId) { const k = kitProg(kitId); return k ? k.h.slice() : []; },
  addResult(kitId, res) {
    const k = kitProg(kitId || '_', true);
    const r = { ts: Date.now(), ...(res || {}) };
    k.h.push(r); if (k.h.length > 12) k.h = k.h.slice(-12);
    ensureProg().upd = Date.now(); touch('prog');
    return r;
  },
  stats() {
    const p = ensureProg();
    const t = todayKey();
    const row = p.days[t] || [0, 0, 0];
    const week = [];
    for (let i = 6; i >= 0; i--) { const d = addDays(t, -i); const r = p.days[d] || [0, 0, 0]; week.push({ day: d, answers: r[0], correct: r[1], xp: r[2] }); }
    let total = 0; for (const r of Object.values(p.days)) total += r[0];
    return { streak: streakNow(p), today: { answers: row[0], correct: row[1], xp: row[2] }, goal: p.goal, best: Math.max(p.best, streakNow(p)), week, total };
  },
  setGoal(n) { const p = ensureProg(); p.goal = clamp(Math.round(n) || 20, 1, 500); p.upd = Date.now(); touch('prog'); }, // extra
  reset(kitId) { const p = ensureProg(); delete p.k[kitId]; p.upd = Date.now(); touch('prog'); }, // extra
};

/* ============================== profiel ============================== */
const COSM = {
  avatar: ['🙂', '😎', '🤓', '🦊', '🐼', '🐸', '🐵', '🦁', '🐯', '🐨', '🐰', '🐙', '🦄', '🐲', '🤖', '👽', '👻', '🧙', '🥷', '🦸', '🧑‍🚀', '🐢', '🦉', '🐧'],
  hat: ['', '🧢', '🎩', '👑', '🎓', '👒', '⛑️', '🪖', '🎀', '🌸', '⭐', '🎧'],
  bg: ['sky', 'mint', 'sunset', 'candy', 'ocean', 'forest', 'night', 'lava', 'aurora', 'gold'],
};
const BG_CSS = {
  sky: 'linear-gradient(135deg,#7dd3fc,#818cf8)', mint: 'linear-gradient(135deg,#6ee7b7,#38bdf8)', sunset: 'linear-gradient(135deg,#fda4af,#fdba74)',
  candy: 'linear-gradient(135deg,#f9a8d4,#c4b5fd)', ocean: 'linear-gradient(135deg,#0ea5e9,#1e3a8a)', forest: 'linear-gradient(135deg,#4ade80,#166534)',
  night: 'linear-gradient(135deg,#312e81,#0f172a)', lava: 'linear-gradient(135deg,#f97316,#7f1d1d)', aurora: 'linear-gradient(135deg,#22d3ee,#a855f7,#22c55e)', gold: 'linear-gradient(135deg,#fde047,#d97706)',
};
const COSM_COST = { avatar: [0, 0, 0, 0, 0, 0, 40, 60, 60, 80, 80, 100, 150, 200, 250, 250, 300, 350, 400, 500, 600, 400, 450, 500], hat: [0, 30, 60, 150, 90, 70, 80, 120, 50, 60, 100, 140], bg: [0, 0, 40, 60, 80, 100, 120, 200, 300, 400] };
export const COSMETICS = {
  avatar: COSM.avatar.map((e, i) => ({ id: e, name: e, emoji: e, cost: COSM_COST.avatar[i] })),
  hat: COSM.hat.map((e, i) => ({ id: e, name: e || 'Geen hoed', emoji: e, cost: COSM_COST.hat[i] })),
  bg: COSM.bg.map((id, i) => ({ id, name: id[0].toUpperCase() + id.slice(1), css: BG_CSS[id], cost: COSM_COST.bg[i] })),
};

const defProfile = () => ({
  v: 1, upd: 0, name: '', xp: 0, level: 1, coins: 0, stars: 0,
  avatar: { emoji: '🙂', hat: '', bg: 'sky' }, up: {}, ach: {}, own: { avatar: [], hat: [], bg: [] },
  quests: { day: '', list: [], bonus: false }, stats: {},
});
function migrateProfile(r) {
  const p = defProfile();
  if (!r || typeof r !== 'object') return p;
  p.upd = Number(r.upd) || 0;
  p.name = str(r.name).slice(0, 20);
  p.xp = Math.max(0, r.xp | 0); p.coins = Math.max(0, r.coins | 0); p.stars = Math.max(0, r.stars | 0);
  if (r.avatar && typeof r.avatar === 'object') p.avatar = { emoji: str(r.avatar.emoji) || '🙂', hat: str(r.avatar.hat), bg: str(r.avatar.bg) || 'sky' };
  if (r.up && typeof r.up === 'object') for (const [k, v] of Object.entries(r.up)) p.up[k] = Math.max(0, v | 0);
  if (r.ach && typeof r.ach === 'object') p.ach = { ...r.ach };
  if (r.own && typeof r.own === 'object') for (const k of ['avatar', 'hat', 'bg']) p.own[k] = Array.isArray(r.own[k]) ? r.own[k].map(String) : [];
  if (r.quests && typeof r.quests === 'object') p.quests = { day: str(r.quests.day), list: Array.isArray(r.quests.list) ? r.quests.list.filter((x) => x && x.id) : [], bonus: !!r.quests.bonus };
  if (r.stats && typeof r.stats === 'object') for (const [k, v] of Object.entries(r.stats)) if (typeof v === 'number') p.stats[k] = v;
  p.level = levelOf(p.xp);
  return p;
}
function ensureProfile() {
  if (!ST.profile) ST.profile = migrateProfile(jparse(lsGet(lk('profile'))));
  return ST.profile;
}
DOMS.profile = { ser: () => JSON.stringify(ensureProfile()), cloud: () => { const p = ensureProfile(); return [{ game: 'learn-profile', data: JSON.stringify(p).slice(0, 18000), updated: p.upd }]; } };
const saveProfile = (ev) => { const p = ensureProfile(); p.upd = Date.now(); touch('profile'); if (ev) emit(listeners.profile, ev); };

// level-curve: kosten om van level L naar L+1 te gaan
const MAX_LEVEL = 100;
const needFor = (L) => Math.round(40 + 18 * L + 2.2 * L * L);
const CUM = [0, 0];
for (let L = 1; L < MAX_LEVEL; L++) CUM[L + 1] = CUM[L] + needFor(L);
function levelOf(xp) { let L = 1; while (L < MAX_LEVEL && xp >= CUM[L + 1]) L++; return L; }

export const UPGRADES = [];
{
  const U = (id, name, emoji, desc, max, base, growth, fx) => UPGRADES.push({
    id, name, emoji, desc, max,
    cost: (level) => (level >= max ? Infinity : Math.max(5, Math.round((base * Math.pow(growth, level)) / 5) * 5)),
    fx,
  });
  U('slimme-start', 'Slimme start', '🚀', 'Begin elk spel met extra startgeld.', 8, 40, 1.45, (l) => ({ startCash: 25 * l }));
  U('geldmagneet', 'Geldmagneet', '🧲', 'Elk goed antwoord levert meer geld op (+10% per level).', 10, 50, 1.4, (l) => ({ cashMult: 0.1 * l }));
  U('reeks', 'Reeks-kampioen', '🔥', 'Een reeks goede antwoorden telt extra mee.', 8, 60, 1.45, (l) => ({ streakBonus: 0.05 * l }));
  U('extra-leven', 'Extra leven', '❤️', 'Een extra leven in spellen met levens.', 5, 120, 1.9, (l) => ({ extraLives: l }));
  U('tijd-erbij', 'Tijd erbij', '⏱️', 'Elke vraag met tijdslimiet krijgt 2 seconden extra per level.', 8, 70, 1.4, (l) => ({ timeBonus: 2 * l }));
  U('hint-hulp', 'Hint-hulp', '💡', 'Hints bij vragen: op level 1, 3 en 5 krijg je er een bij.', 5, 90, 1.7, (l) => ({ hints: (l >= 1) + (l >= 3) + (l >= 5) }));
  U('schild', 'Schild', '🛡️', 'Een fout antwoord per spel telt niet (per level een schild).', 5, 140, 1.8, (l) => ({ shield: l }));
  U('dubbele-xp', 'Dubbele XP', '⭐', 'Meer XP voor alles wat je doet (+10% per level).', 10, 55, 1.4, (l) => ({ xpMult: 0.1 * l }));
  U('muntenregen', 'Muntenregen', '🪙', 'Meer munten aan het einde van elk spel (+10% per level).', 10, 65, 1.42, (l) => ({ coinMult: 0.1 * l }));
  U('geluksster', 'Geluksster', '🍀', 'Meer kans op bonussen en schatten in spellen.', 10, 60, 1.4, (l) => ({ luck: 0.04 * l }));
  U('snelle-denker', 'Snelle denker', '🧠', 'Snelle antwoorden leveren meer bonus op en je mag langer nadenken zonder verlies.', 6, 80, 1.5, (l) => ({ speedBonus: 0.08 * l, grace: l }));
  U('voorlees-helper', 'Voorlees-helper', '🔊', 'Vragen worden automatisch voorgelezen en iets rustiger.', 3, 45, 2, (l) => ({ tts: l >= 1, ttsRate: -0.05 * l }));
  U('tweede-kans', 'Tweede kans', '🔁', 'Per spel mag je een fout antwoord opnieuw proberen.', 3, 160, 2, (l) => ({ retry: l }));
  U('reeks-redder', 'Reeks-redder', '🧷', 'Een fout antwoord breekt je reeks niet (per spel een keer per level).', 5, 100, 1.7, (l) => ({ comboSave: l }));
  U('beloningszak', 'Beloningszak', '🎁', 'Elk spel geeft een vast aantal bonusmunten (+3 per level).', 8, 45, 1.38, (l) => ({ coinBonus: 3 * l }));
  U('level-boost', 'Level-boost', '🪄', 'Level-ups geven grotere beloningen (+20% per level).', 5, 80, 1.6, (l) => ({ levelBoost: 0.2 * l }));
  U('studieheld', 'Studieheld', '📖', 'Een extra beloning als je een toets of leersessie haalt.', 5, 70, 1.5, (l) => ({ studyBonus: 5 * l }));
}

function effectsOf(up) {
  const e = { startCash: 0, cashMult: 1, streakBonus: 0, extraLives: 0, timeBonus: 0, hints: 0, shield: 0, xpMult: 1, coinMult: 1, luck: 0, speedBonus: 0, grace: 0, tts: false, ttsRate: 0, retry: 0, comboSave: 0, coinBonus: 0, levelBoost: 1, studyBonus: 0 };
  for (const u of UPGRADES) {
    const l = Math.min(u.max, up[u.id] | 0);
    if (!l) continue;
    const f = u.fx(l);
    for (const [k, v] of Object.entries(f)) { if (typeof v === 'boolean') e[k] = e[k] || v; else e[k] += v; }
  }
  e.luck = clamp(e.luck, 0, 0.9);
  for (const k of ['cashMult', 'xpMult', 'coinMult', 'levelBoost']) e[k] = Math.round(e[k] * 1000) / 1000;
  return e;
}

// dagopdrachten
const QT = [
  { kind: 'answers', auto: true, goals: [10, 15, 20, 30], text: (n) => `Beantwoord ${n} vragen`, rw: (n) => Math.round(5 + n * 0.8) },
  { kind: 'correct', auto: true, goals: [8, 12, 16, 25], text: (n) => `Heb ${n} antwoorden goed`, rw: (n) => 5 + n },
  { kind: 'streak', auto: true, goals: [3, 5, 8, 10], text: (n) => `Haal een reeks van ${n} goede antwoorden`, rw: (n) => 8 + n * 3 },
  { kind: 'xp', auto: true, goals: [30, 50, 80, 120], text: (n) => `Verdien ${n} XP`, rw: (n) => Math.round(8 + n * 0.4) },
  { kind: 'fast', auto: true, goals: [3, 5, 8], text: (n) => `Geef ${n} snelle goede antwoorden (onder 3 seconden)`, rw: (n) => 10 + n * 3 },
  { kind: 'games', goals: [1, 2, 3], text: (n) => `Speel ${n} leerspel${n > 1 ? 'len' : ''}`, rw: (n) => 15 * n },
  { kind: 'wins', goals: [1, 2], text: (n) => `Win ${n} spel${n > 1 ? 'len' : ''}`, rw: (n) => 25 * n },
  { kind: 'tests', goals: [1], text: () => 'Maak een toets', rw: () => 30 },
  { kind: 'learn', goals: [1, 2], text: (n) => `Doe ${n} leersessie${n > 1 ? 's' : ''}`, rw: (n) => 20 * n },
  { kind: 'perfect', goals: [1], text: () => 'Rond iets foutloos af', rw: () => 35 },
  { kind: 'flash', goals: [10, 15, 20], text: (n) => `Draai ${n} flitskaarten om`, rw: (n) => 5 + n },
  { kind: 'lang', goals: [8, 12, 20], text: (n) => `Oefen ${n} woordjes`, rw: (n) => 5 + n },
];
const AUTO_KINDS = new Set(['answers', 'correct', 'xp', 'fast', 'streak']);
function ensureQuests() {
  const p = ensureProfile();
  const day = todayKey();
  if (p.quests.day === day && p.quests.list.length) return p.quests;
  const r = rng('learn-quests-' + day);
  const auto = shuffle(QT.filter((t) => t.auto), r).slice(0, 3);
  const man = shuffle(QT.filter((t) => !t.auto), r).slice(0, 2);
  const list = shuffle([...auto, ...man], r).map((t) => {
    const goal = t.goals[Math.floor(r() * t.goals.length)];
    const reward = t.rw(goal);
    return { id: day + ':' + t.kind, kind: t.kind, goal, prog: 0, claimed: false, text: t.text(goal), reward, xp: Math.round(reward * 0.6) };
  });
  p.quests = { day, list, bonus: false };
  saveProfile();
  return p.quests;
}
function questBump(kind, n, mode) {
  const qs = ensureQuests();
  let ch = false;
  for (const q of qs.list) if (q.kind === kind && q.prog < q.goal) {
    const v = mode === 'max' ? Math.max(q.prog, n) : q.prog + n;
    q.prog = Math.min(q.goal, v); ch = true;
  }
  if (ch) saveProfile({ type: 'quest' });
}

// prestaties: [id, naam, emoji, uitleg, waarde(stats, profiel), doel, munten]
const S = (k) => (s) => s[k] || 0;
const ACH_ROWS = [
  ['ans-1', 'Eerste antwoord', '🌱', 'Beantwoord je eerste vraag', S('answers'), 1, 10],
  ['ans-50', 'Op gang', '🚲', 'Beantwoord 50 vragen', S('answers'), 50, 25],
  ['ans-250', 'Doorzetter', '💪', 'Beantwoord 250 vragen', S('answers'), 250, 50],
  ['ans-1000', 'Vraagbaak', '📚', 'Beantwoord 1000 vragen', S('answers'), 1000, 120],
  ['ans-5000', 'Kennisfabriek', '🏭', 'Beantwoord 5000 vragen', S('answers'), 5000, 400],
  ['cor-25', 'Goed bezig', '👍', 'Heb 25 antwoorden goed', S('correct'), 25, 20],
  ['cor-250', 'Slimmerik', '🧠', 'Heb 250 antwoorden goed', S('correct'), 250, 60],
  ['cor-1500', 'Genie', '🎓', 'Heb 1500 antwoorden goed', S('correct'), 1500, 250],
  ['run-5', 'Hete reeks', '🔥', '5 goede antwoorden achter elkaar', S('bestRun'), 5, 15],
  ['run-10', 'Vuurzee', '🌋', '10 goede antwoorden achter elkaar', S('bestRun'), 10, 35],
  ['run-25', 'Onstopbaar', '🚀', '25 goede antwoorden achter elkaar', S('bestRun'), 25, 90],
  ['run-50', 'Legende', '🐉', '50 goede antwoorden achter elkaar', S('bestRun'), 50, 200],
  ['fast-25', 'Bliksemsnel', '⚡', '25 goede antwoorden in minder dan 3 seconden', S('fast'), 25, 30],
  ['fast-200', 'Flitsmeester', '🌩️', '200 snelle goede antwoorden', S('fast'), 200, 120],
  ['day-3', 'Drie dagen op rij', '📅', 'Leer 3 dagen achter elkaar', (s, p, g) => g.bestDays, 3, 30],
  ['day-7', 'Een hele week', '🗓️', 'Leer 7 dagen achter elkaar', (s, p, g) => g.bestDays, 7, 80],
  ['day-14', 'Twee weken vol', '🌈', 'Leer 14 dagen achter elkaar', (s, p, g) => g.bestDays, 14, 160],
  ['day-30', 'Maandmeester', '🏆', 'Leer 30 dagen achter elkaar', (s, p, g) => g.bestDays, 30, 400],
  ['lvl-5', 'Level 5', '⭐', 'Bereik level 5', (s, p) => p.level, 5, 40],
  ['lvl-10', 'Level 10', '🌟', 'Bereik level 10', (s, p) => p.level, 10, 100],
  ['lvl-20', 'Level 20', '💫', 'Bereik level 20', (s, p) => p.level, 20, 250],
  ['lvl-30', 'Level 30', '👑', 'Bereik level 30', (s, p) => p.level, 30, 500],
  ['games-1', 'Eerste spel', '🎮', 'Speel een leerspel', S('games'), 1, 15],
  ['games-10', 'Speler', '🕹️', 'Speel 10 leerspellen', S('games'), 10, 50],
  ['games-50', 'Arcade-held', '🏟️', 'Speel 50 leerspellen', S('games'), 50, 200],
  ['wins-1', 'Winnaar', '🥇', 'Win een spel', S('wins'), 1, 25],
  ['wins-10', 'Kampioen', '🏅', 'Win 10 spellen', S('wins'), 10, 100],
  ['tests-1', 'Eerste toets', '✍️', 'Maak een toets', S('tests'), 1, 20],
  ['tests-10', 'Toetsmeester', '📝', 'Maak 10 toetsen', S('tests'), 10, 100],
  ['perfect-1', 'Foutloos', '💯', 'Rond iets af zonder fouten', S('perfect'), 1, 40],
  ['perfect-5', 'Perfectionist', '💎', 'Rond 5 keer iets foutloos af', S('perfect'), 5, 150],
  ['learn-1', 'Eerste leersessie', '🎒', 'Doe een leersessie', S('learn'), 1, 20],
  ['learn-10', 'Studiebol', '🧑‍🎓', 'Doe 10 leersessies', S('learn'), 10, 100],
  ['flash-50', 'Kaartenkoning', '🃏', 'Draai 50 flitskaarten om', S('flash'), 50, 40],
  ['lang-50', 'Talenknobbel', '🗣️', 'Oefen 50 woordjes', S('lang'), 50, 60],
  ['qd-1', 'Dagopdracht', '✅', 'Haal een dagopdracht', S('qd'), 1, 15],
  ['qd-10', 'Opdrachtjager', '🧾', 'Haal 10 dagopdrachten', S('qd'), 10, 80],
  ['qd-50', 'Opdrachtenmeester', '📜', 'Haal 50 dagopdrachten', S('qd'), 50, 300],
  ['up-1', 'Eerste upgrade', '⬆️', 'Koop een upgrade', (s, p) => Object.values(p.up).reduce((a, b) => a + b, 0), 1, 20],
  ['up-15', 'Sterker en sterker', '🦾', 'Koop 15 upgrade-levels', (s, p) => Object.values(p.up).reduce((a, b) => a + b, 0), 15, 100],
  ['up-max', 'Maxed out', '🧬', 'Zet een upgrade op het hoogste level', (s, p) => (UPGRADES.some((u) => (p.up[u.id] | 0) >= u.max) ? 1 : 0), 1, 150],
  ['coin-500', 'Muntenvanger', '🪙', 'Verdien 500 munten', S('coinsEarned'), 500, 25],
  ['coin-5000', 'Rijkaard', '💰', 'Verdien 5000 munten', S('coinsEarned'), 5000, 100],
  ['kit-1', 'Kitmaker', '🧩', 'Maak een eigen kit', S('kits'), 1, 30],
  ['kit-5', 'Kitbouwer', '🏗️', 'Maak 5 eigen kits', S('kits'), 5, 100],
  ['tts-10', 'Luisteraar', '🔊', 'Laat 10 keer iets voorlezen', S('tts'), 10, 25],
  ['cos-3', 'Mooi gekleed', '🎩', 'Koop 3 uiterlijk-spullen', (s, p) => p.own.avatar.length + p.own.hat.length + p.own.bg.length, 3, 40],
  ['name', 'Naam gekozen', '✏️', 'Kies een eigen naam', (s, p) => (p.name ? 1 : 0), 1, 10],
];
const ACHS = ACH_ROWS.map(([id, name, emoji, desc, val, goal, coins]) => ({ id, name, emoji, desc, val, goal, coins }));

export const Profile = {
  UPGRADES,
  COSMETICS,
  BG_CSS,
  async load() {
    ensureProfile();
    if (ST.loads.profile) return ST.loads.profile;
    ST.loads.profile = (async () => {
      const p = ensureProfile();
      if (cloudOn()) {
        const r = await cloudGet('learn-profile');
        if (r) {
          const c = migrateProfile(jparse(r.data));
          if (c.upd > p.upd) { ST.profile = c; touch('profile', false); emit(listeners.profile, { type: 'load' }); } else if (p.upd > c.upd) touch('profile');
        } else if (p.upd) touch('profile');
      }
      const q = ensureProfile();
      if (!q.name && ENV.me) { const nm = str(ENV.me.name || ENV.me.displayName || '').slice(0, 20); if (nm) { q.name = nm; saveProfile(); } }
      ensureQuests();
      return q;
    })();
    return ST.loads.profile;
  },
  get() {
    const p = ensureProfile();
    p.level = levelOf(p.xp);
    p.streak = streakNow(ensureProg());
    return p;
  },
  setName(n) { ensureProfile().name = str(n).slice(0, 20); saveProfile({ type: 'name' }); },
  levelInfo() {
    const p = ensureProfile();
    const level = levelOf(p.xp);
    const cur = level >= MAX_LEVEL ? 0 : p.xp - CUM[level];
    const next = level >= MAX_LEVEL ? 0 : needFor(level);
    return { level, cur, next, pct: next ? cur / next : 1, totalXp: p.xp };
  },
  xpForLevel(level) { return CUM[clamp(level | 0, 1, MAX_LEVEL)]; }, // extra
  addXp(n) {
    n = Math.floor(Number(n) || 0);
    const p = ensureProfile();
    if (n <= 0) return { gained: 0, level: levelOf(p.xp), levels: [], coins: 0 };
    const before = levelOf(p.xp);
    p.xp += n;
    Prog._dayXp(n);
    questBump('xp', n);
    const after = levelOf(p.xp);
    p.level = after;
    const levels = [];
    let coins = 0;
    const boost = effectsOf(p.up).levelBoost;
    for (let L = before + 1; L <= after; L++) {
      const c = Math.round((15 + 5 * L) * boost);
      const stars = L % 5 === 0 ? 1 : 0;
      p.coins += c; p.stars += stars; coins += c;
      p.stats.coinsEarned = (p.stats.coinsEarned || 0) + c;
      levels.push({ level: L, coins: c, stars });
    }
    saveProfile(levels.length ? { type: 'level', level: after, levels } : { type: 'xp' });
    return { gained: n, level: after, levels, coins };
  },
  addCoins(n) {
    n = Math.floor(Number(n) || 0);
    const p = ensureProfile();
    if (n <= 0) return p.coins;
    p.coins += n; p.stats.coinsEarned = (p.stats.coinsEarned || 0) + n;
    saveProfile({ type: 'coins' });
    return p.coins;
  },
  spend(n) {
    n = Math.floor(Number(n) || 0);
    const p = ensureProfile();
    if (n < 0 || p.coins < n) return false;
    p.coins -= n; saveProfile({ type: 'coins' });
    return true;
  },
  addStars(n) { const p = ensureProfile(); p.stars = Math.max(0, p.stars + (n | 0)); saveProfile({ type: 'stars' }); return p.stars; }, // extra
  upgradeLevel(id) { return ensureProfile().up[id] | 0; },
  upgradeCost(id) { const u = UPGRADES.find((x) => x.id === id); return u ? u.cost(ensureProfile().up[id] | 0) : Infinity; }, // extra
  buyUpgrade(id) {
    const u = UPGRADES.find((x) => x.id === id);
    if (!u) return false;
    const p = ensureProfile();
    const l = p.up[id] | 0;
    if (l >= u.max) return false;
    if (!Profile.spend(u.cost(l))) return false;
    p.up[id] = l + 1;
    saveProfile({ type: 'upgrade', id });
    return true;
  },
  effects() { return effectsOf(ensureProfile().up); },
  setAvatar(o) {
    const p = ensureProfile();
    o = o || {};
    if (o.emoji !== undefined) p.avatar.emoji = str(o.emoji).slice(0, 8) || '🙂';
    if (o.hat !== undefined) p.avatar.hat = str(o.hat).slice(0, 8);
    if (o.bg !== undefined) p.avatar.bg = str(o.bg).slice(0, 20) || 'sky';
    saveProfile({ type: 'avatar' });
    return p.avatar;
  },
  owns(kind, id) { // extra
    const list = COSMETICS[kind]; if (!list) return false;
    const it = list.find((x) => x.id === id);
    return !!it && (it.cost === 0 || ensureProfile().own[kind].includes(id));
  },
  buyCosmetic(kind, id) { // extra
    const list = COSMETICS[kind]; if (!list) return false;
    const it = list.find((x) => x.id === id);
    if (!it) return false;
    if (Profile.owns(kind, id)) return true;
    if (!Profile.spend(it.cost)) return false;
    ensureProfile().own[kind].push(id);
    saveProfile({ type: 'cosmetic' });
    return true;
  },
  bgCss(id) { return BG_CSS[id] || BG_CSS.sky; }, // extra
  stat(name, n = 1) { const p = ensureProfile(); p.stats[name] = (p.stats[name] || 0) + n; saveProfile(); }, // extra
  statMax(name, v) { const p = ensureProfile(); if (v > (p.stats[name] || 0)) { p.stats[name] = v; saveProfile(); } }, // extra
  // wordt door Prog.record aangeroepen
  _answer(ok, ms) {
    const p = ensureProfile(); const s = p.stats;
    s.answers = (s.answers || 0) + 1;
    if (ok) {
      s.correct = (s.correct || 0) + 1; s.run = (s.run || 0) + 1; s.bestRun = Math.max(s.bestRun || 0, s.run);
      if (ms > 0 && ms < 3000) { s.fast = (s.fast || 0) + 1; questBump('fast', 1); }
      questBump('correct', 1);
      questBump('streak', s.run, 'max');
    } else s.run = 0;
    questBump('answers', 1);
    saveProfile();
  },
  quests() {
    const q = ensureQuests();
    return q.list.map((x) => ({ ...x, done: x.prog >= x.goal }));
  },
  // kinds: games, wins, streak (hoogste reeks), tests, learn, perfect, flash, lang. 'answers','correct','xp','fast' gaan automatisch via Prog.record/addXp en worden hier genegeerd.
  bumpQuest(kind, n = 1) {
    if (kind === 'answers' || kind === 'correct' || kind === 'xp' || kind === 'fast') return;
    n = Number(n) || 0;
    if (n <= 0) return;
    if (kind === 'streak') { questBump('streak', n, 'max'); Profile.statMax('bestRun', n); return; }
    Profile.stat(kind, n);
    questBump(kind, n);
  },
  claimQuest(id) {
    const qs = ensureQuests();
    const q = qs.list.find((x) => x.id === id);
    if (!q || q.claimed || q.prog < q.goal) return false;
    q.claimed = true;
    const p = ensureProfile();
    p.stats.qd = (p.stats.qd || 0) + 1;
    Profile.addCoins(q.reward);
    const xp = Profile.addXp(q.xp);
    const out = { coins: q.reward, xp: q.xp, levels: xp.levels };
    if (!qs.bonus && qs.list.every((x) => x.claimed)) { qs.bonus = true; Profile.addCoins(50); p.stars += 1; out.bonus = { coins: 50, stars: 1 }; }
    saveProfile({ type: 'quest' });
    return out;
  },
  achievements() {
    const p = ensureProfile();
    const g = { bestDays: Math.max(ensureProg().best, streakNow(ensureProg())) };
    p.level = levelOf(p.xp);
    return ACHS.map((a) => ({ id: a.id, name: a.name, emoji: a.emoji, desc: a.desc, done: !!p.ach[a.id], prog: Math.min(a.goal, Math.floor(a.val(p.stats, p, g))), goal: a.goal, coins: a.coins }));
  },
  checkAch() {
    const p = ensureProfile();
    const g = { bestDays: Math.max(ensureProg().best, streakNow(ensureProg())) };
    p.level = levelOf(p.xp);
    const fresh = [];
    for (const a of ACHS) {
      if (p.ach[a.id]) continue;
      if (a.val(p.stats, p, g) >= a.goal) { p.ach[a.id] = Date.now(); p.coins += a.coins; p.stats.coinsEarned = (p.stats.coinsEarned || 0) + a.coins; p.stars += 1; fresh.push({ id: a.id, name: a.name, emoji: a.emoji, desc: a.desc, done: true, coins: a.coins }); }
    }
    if (fresh.length) saveProfile({ type: 'ach', list: fresh });
    return fresh;
  },
  // extra: standaardbeloning voor een afgerond spel/toets (vermenigvuldigers zijn al verwerkt)
  reward({ correct = 0, wrong = 0, win = false, level = 2, bonus = 0 } = {}) {
    const fx = effectsOf(ensureProfile().up);
    const baseXp = correct * (4 + level) + wrong * 1 + (win ? 15 : 0) + bonus;
    const baseCoins = correct * 2 + (win ? 10 : 0) + Math.round(bonus / 2);
    return { xp: Math.round(baseXp * fx.xpMult), coins: Math.round(baseCoins * fx.coinMult) + (correct > 0 ? fx.coinBonus : 0) };
  },
  onChange(fn) { listeners.profile.add(fn); return () => listeners.profile.delete(fn); }, // extra
};

/* ============================== voorlezen ============================== */
const TTSS = { cur: null, done: null, timer: null, cache: null };
function synth() { try { return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined' ? speechSynthesis : null; } catch (e) { return null; } }
function voiceScore(v) {
  let s = 0;
  const n = (v.name || '') + ' ' + (v.voiceURI || '');
  if (/premium|enhanced|natural|neural|siri/i.test(n)) s += 5;
  if (v.localService) s += 2;
  if (/google/i.test(n)) s += 3;
  if (/novelty|fred|zarvox|bells|boing|whisper|trinoids|albert|junior|ralph|kathy|bad news|good news|cellos|organ|bubbles|jester|superstar|wobble/i.test(n)) s -= 8;
  return s;
}
export const TTS = {
  on: false,
  rate: 1,
  supported() { return !!synth(); },
  setOn(b) { TTS.on = !!b; SET.tts = TTS.on; saveSettings(); if (!TTS.on) TTS.stop(); },
  setRate(r) { TTS.rate = clamp(Number(r) || 1, 0.5, 1.6); SET.rate = TTS.rate; saveSettings(); },
  voices(lang) {
    const sy = synth(); if (!sy) return [];
    let vs = [];
    try { vs = sy.getVoices() || []; } catch (e) { vs = []; }
    const l = lang && LANGS[lang] ? lang : null;
    const list = l ? vs.filter((v) => (v.lang || '').toLowerCase().replace('_', '-').startsWith(l)) : vs.slice();
    return list.sort((a, b) => voiceScore(b) - voiceScore(a));
  },
  setVoice(lang, uri) { if (uri) SET.voices[lang] = uri; else delete SET.voices[lang]; saveSettings(); }, // extra
  voiceFor(lang) {
    const vs = TTS.voices(lang);
    const want = SET.voices[lang];
    return (want && vs.find((v) => v.voiceURI === want || v.name === want)) || vs[0] || null;
  }, // extra
  speak(text, lang = 'nl', o = {}) {
    const sy = synth();
    text = str(text).replace(/_{2,}/g, ' … ');
    if (!sy || !text) return Promise.resolve();
    TTS.stop();
    Profile.stat('tts', 1);
    return new Promise((resolve) => {
      let finished = false;
      const finish = () => { if (finished) return; finished = true; if (TTSS.timer) { clearTimeout(TTSS.timer); TTSS.timer = null; } if (TTSS.done === finish) { TTSS.done = null; TTSS.cur = null; } resolve(); };
      try {
        const u = new SpeechSynthesisUtterance(text);
        const L = LANGS[lang] || LANGS.nl;
        u.lang = L.speech;
        const v = TTS.voiceFor(LANGS[lang] ? lang : 'nl');
        if (v) u.voice = v;
        u.rate = clamp(o.rate !== undefined ? o.rate : TTS.rate, 0.4, 2);
        u.pitch = o.pitch || 1;
        u.onend = finish; u.onerror = finish;
        TTSS.cur = u; TTSS.done = finish;
        TTSS.timer = setTimeout(finish, Math.max(3000, (text.length * 95) / u.rate + 2500));
        try { sy.resume(); } catch (e) { /* oud */ }
        sy.speak(u);
      } catch (e) { finish(); }
    });
  },
  stop() {
    const sy = synth();
    const d = TTSS.done;
    try { if (sy) sy.cancel(); } catch (e) { /* stil */ }
    if (d) d();
    TTSS.cur = null; TTSS.done = null;
  },
};

/* ============================== geluid ============================== */
// noot: [freq, start(s), duur(s), golfvorm, volume(0..1), eindfreq?]
const SOUNDS = {
  goed: [[660, 0, 0.09, 'sine', 0.9], [880, 0.08, 0.16, 'sine', 0.9]],
  fout: [[240, 0, 0.14, 'sawtooth', 0.45], [170, 0.11, 0.24, 'sawtooth', 0.45]],
  klik: [[520, 0, 0.04, 'square', 0.3]],
  munt: [[1175, 0, 0.07, 'triangle', 0.7], [1568, 0.07, 0.18, 'triangle', 0.7]],
  level: [[523, 0, 0.12, 'triangle', 0.8], [659, 0.1, 0.12, 'triangle', 0.8], [784, 0.2, 0.12, 'triangle', 0.8], [1047, 0.3, 0.34, 'triangle', 0.8]],
  win: [[523, 0, 0.12, 'triangle', 0.8], [523, 0.14, 0.12, 'triangle', 0.8], [659, 0.28, 0.12, 'triangle', 0.8], [784, 0.42, 0.14, 'triangle', 0.8], [1047, 0.58, 0.4, 'triangle', 0.9]],
  lose: [[392, 0, 0.2, 'sine', 0.7], [349, 0.2, 0.2, 'sine', 0.7], [294, 0.4, 0.42, 'sine', 0.7]],
  tik: [[900, 0, 0.03, 'square', 0.22]],
  power: [[300, 0, 0.32, 'sawtooth', 0.4, 1200], [1200, 0.3, 0.12, 'triangle', 0.5]],
};
let ac = null, lastPlay = {};
export const Snd = {
  on: true,
  volume: 0.16,
  names: Object.keys(SOUNDS),
  setOn(b) { Snd.on = !!b; SET.snd = Snd.on; saveSettings(); },
  play(name) {
    if (!Snd.on) return false;
    const notes = SOUNDS[name];
    if (!notes) return false;
    try {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return false;
      const now = Date.now();
      if (lastPlay[name] && now - lastPlay[name] < 40) return false;
      lastPlay[name] = now;
      if (!ac) ac = new AC();
      if (ac.state === 'suspended' && ac.resume) { try { ac.resume(); } catch (e) { /* stil */ } }
      const t0 = ac.currentTime;
      for (const [f, st, du, type, vol, f1] of notes) {
        const osc = ac.createOscillator(); const g = ac.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(f, t0 + st);
        if (f1) osc.frequency.exponentialRampToValueAtTime(f1, t0 + st + du);
        g.gain.setValueAtTime(0.0001, t0 + st);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, Snd.volume * (vol || 1)), t0 + st + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + st + du);
        osc.connect(g); g.connect(ac.destination);
        osc.start(t0 + st); osc.stop(t0 + st + du + 0.03);
      }
      return true;
    } catch (e) { return false; }
  },
};

loadSettings();
