// Learn Study: pure logica (geen DOM, geen imports). Parsers, generatoren, kit-code, Leitner-wachtrij, cijfers.
// Alles hier is los testbaar: tools/test-learn-study.mjs

/* ---------- kleine hulpjes ---------- */
export function mulberry(seed) {
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function hashStr(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function shuf(arr, rand = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pk = (r, arr) => arr[Math.floor(r() * arr.length)];
export const clip = (s, n) => { s = String(s == null ? '' : s).trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
export const nl = (n) => String(parseFloat(Number(n).toFixed(4))).replace('.', ',');
const isNumStr = (s) => /^-?\d+([.,]\d+)?$/.test(String(s).trim());
const toNum = (s) => parseFloat(String(s).trim().replace(/\s/g, '').replace(',', '.'));
export const MAX_Q = 500, MAX_QLEN = 400;
export const TYPES = { mc: 'Meerkeuze', type: 'Typen', tf: 'Waar/onwaar', order: 'Volgorde', match: 'Paren', fill: 'Invullen', num: 'Getal', multi: 'Meerdere goed' };
export const TYPE_EMOJI = { mc: '🔘', type: '⌨️', tf: '✔️', order: '🔢', match: '🔗', fill: '🕳️', num: '#️⃣', multi: '☑️' };
export const fmtTime = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

/* ---------- vraag opschonen (zelfde contract als core.normalizeQ, los van core) ---------- */
export function cleanQ(q) {
  if (!q || typeof q !== 'object' || !TYPES[q.t]) return null;
  const t = q.t;
  const text = clip(q.q, MAX_QLEN);
  if (!text) return null;
  const out = { t, q: text };
  const strs = (arr, max = 6, cs = false) => { const seen = new Set(); const r = []; for (const x of Array.isArray(arr) ? arr : []) { const s = clip(x, 120); const k = cs ? s : s.toLowerCase(); if (s && !seen.has(k)) { seen.add(k); r.push(s); } } return r.slice(0, max); };
  if (t === 'mc') {
    const a = clip(q.a, 120); const o = strs(q.o, 6, true);
    if (!a) return null;
    if (!o.includes(a)) o.push(a);
    if (o.length < 2) return null;
    out.a = a; out.o = o.slice(0, 6);
    if (!out.o.includes(out.a)) out.o[out.o.length - 1] = out.a;
  } else if (t === 'type' || t === 'fill') {
    const a = clip(q.a, 200); if (!a) return null;
    if (t === 'fill' && !text.includes('___')) return null;
    out.a = a;
    const alt = strs(q.alt, 8).filter((x) => x.toLowerCase() !== a.toLowerCase()); if (alt.length) out.alt = alt;
    if (t === 'fill' && q.o) { const o = strs(q.o); if (!o.some((x) => x.toLowerCase() === a.toLowerCase())) o.push(a); if (o.length >= 2) out.o = o; }
  } else if (t === 'tf') {
    if (typeof q.a === 'boolean') out.a = q.a; else if (/^(waar|true|ja|1)$/i.test(String(q.a))) out.a = true; else if (/^(onwaar|false|nee|0)$/i.test(String(q.a))) out.a = false; else return null;
  } else if (t === 'order') {
    const a = strs(q.a, 8); if (a.length < 2) return null; out.a = a;
  } else if (t === 'match') {
    const a = []; for (const p of Array.isArray(q.a) ? q.a : []) { if (Array.isArray(p) && p.length >= 2) { const l = clip(p[0], 80), r = clip(p[1], 80); if (l && r) a.push([l, r]); } }
    if (a.length < 2) return null; out.a = a.slice(0, 6);
  } else if (t === 'multi') {
    const o = strs(q.o), a = strs(q.a).filter((x) => o.some((y) => y.toLowerCase() === x.toLowerCase()));
    if (o.length < 3 || !a.length) return null; out.o = o; out.a = a.map((x) => o.find((y) => y.toLowerCase() === x.toLowerCase()));
  } else if (t === 'num') {
    const n = typeof q.a === 'number' ? q.a : toNum(q.a); if (!Number.isFinite(n)) return null; out.a = n;
    const alt = (Array.isArray(q.alt) ? q.alt : []).map((x) => (typeof x === 'number' ? x : toNum(x))).filter((x) => Number.isFinite(x) && x !== n); if (alt.length) out.alt = alt.slice(0, 6);
    if (Number.isFinite(q.tol) && q.tol > 0) out.tol = q.tol;
  }
  if (q.e) out.e = clip(q.e, 16);
  if (q.say) out.say = clip(q.say, 300);
  if (q.lang && /^(nl|en|de|fr|es)$/.test(q.lang)) out.lang = q.lang;
  if (q.x) out.x = clip(q.x, 300);
  if (q.g) out.g = clip(q.g, 40);
  const d = Math.round(Number(q.d)); out.d = d >= 1 && d <= 3 ? d : 2;
  return out;
}
export function cleanKit(kit, { max = MAX_Q } = {}) {
  const qs = []; let dropped = 0;
  for (const q of (kit && Array.isArray(kit.qs) ? kit.qs : [])) { const c = cleanQ(q); if (c && qs.length < max) qs.push(c); else dropped++; }
  return { kit: { id: kit && kit.id, name: clip((kit && kit.name) || 'Naamloze kit', 60), emoji: clip((kit && kit.emoji) || '📘', 8), desc: clip((kit && kit.desc) || '', 200), lang: kit && /^(nl|en|de|fr|es)$/.test(kit.lang || '') ? kit.lang : undefined, group: kit && kit.group ? clip(kit.group, 30) : undefined, src: (kit && kit.src) || 'user', qs }, dropped };
}

/* ---------- plak-import ---------- */
const HEADER_WORDS = new Set(['term', 'definition', 'definitie', 'woord', 'vertaling', 'vraag', 'antwoord', 'question', 'answer', 'nederlands', 'engels', 'duits', 'frans', 'spaans', 'dutch', 'english', 'front', 'back', 'voorkant', 'achterkant', 'begrip', 'uitleg']);
export function parseCsvLine(line, sep = ',') {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"' && cur === '') q = true;
    else if (c === sep) { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur); return out.map((s) => s.trim());
}
const DELIMS = [
  ['tab', (l) => l.includes('\t'), (l) => l.split('\t').map((s) => s.trim())],
  ['semi', (l) => l.includes(';'), (l) => parseCsvLine(l, ';')],
  ['qmark', (l) => /\?\s+\S/.test(l), (l) => { const m = /^(.*?\?)\s+(\S[\s\S]*)$/.exec(l); return m ? [m[1], m[2].replace(/^[-–—:=>\s]+/, '')] : [l]; }],
  ['eq', (l) => /\s=\s|[^<>=!]=[^=]/.test(l), (l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)].map((s) => s.trim()); }],
  ['arrow', (l) => /\s(->|=>|→|>)\s/.test(l), (l) => l.split(/\s(?:->|=>|→|>)\s/).map((s) => s.trim())],
  ['dash', (l) => /\s[-–—−]\s/.test(l), (l) => { const m = /^(.*?)\s[-–—−]\s+([\s\S]*)$/.exec(l); return m ? [m[1], m[2]] : [l]; }],
  ['csv', (l) => l.includes(','), (l) => parseCsvLine(l, ',')],
  ['colon', (l) => /:\s*\S/.test(l), (l) => { const i = l.indexOf(':'); return [l.slice(0, i), l.slice(i + 1)].map((s) => s.trim()); }],
];
export const FORMAT_NAMES = { tab: 'tab (spreadsheet)', semi: 'puntkomma', qmark: 'vraag? antwoord', eq: 'is-gelijk-teken', arrow: 'pijl', dash: 'streepje', csv: 'CSV (komma)', colon: 'dubbele punt', alternate: 'om-en-om regels', none: 'geen paren gevonden' };
export function splitLines(text) { return String(text == null ? '' : text).replace(/^﻿/, '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean); }
function stripNumbering(lines) {
  const re = /^\(?\d{1,3}[.)]\s+/; const hit = lines.filter((l) => re.test(l)).length;
  return hit >= Math.max(2, lines.length * 0.7) ? lines.map((l) => l.replace(re, '')) : lines;
}
export function detectFormat(lines) {
  lines = stripNumbering(lines);
  if (!lines.length) return 'none';
  for (const [name, test] of DELIMS) { const hit = lines.filter(test).length; if (hit >= Math.max(1, Math.ceil(lines.length * 0.6))) return name; }
  if (lines.length >= 2 && lines.length % 2 === 0) return 'alternate';
  return 'none';
}
export function parsePaste(text, o = {}) {
  let lines = stripNumbering(splitLines(text));
  const format = o.format && o.format !== 'auto' ? o.format : detectFormat(lines);
  const pairs = []; const skipped = []; let header = false;
  const mk = (q, a, x) => {
    q = (q || '').trim(); a = (a || '').trim();
    if (!q || !a) return false;
    const parts = a.split(/\s+[|/]\s+/).map((s) => s.trim()).filter(Boolean);
    const p = { q: clip(q, MAX_QLEN), a: clip(parts[0] || a, 200) }; if (parts.length > 1) p.alt = parts.slice(1, 6).map((s) => clip(s, 200));
    if (x) p.x = clip(x, 300); pairs.push(p); return true;
  };
  if (format === 'alternate') {
    for (let i = 0; i + 1 < lines.length; i += 2) mk(lines[i], lines[i + 1]);
    if (lines.length % 2) skipped.push(lines[lines.length - 1]);
  } else if (format !== 'none') {
    const d = DELIMS.find((x) => x[0] === format);
    lines.forEach((l, i) => {
      const f = d[2](l);
      if (i === 0 && f.length >= 2 && HEADER_WORDS.has(f[0].toLowerCase()) && HEADER_WORDS.has(f[1].toLowerCase())) { header = true; return; }
      if (f.length >= 2 && mk(f[0], f[1], f[2])) return;
      skipped.push(l);
    });
  } else lines.forEach((l) => skipped.push(l));
  return { format, formatName: FORMAT_NAMES[format] || format, pairs, skipped, header };
}

/* ---------- afleiders / meerkeuzeopties ---------- */
export function numericDistractors(c, rand = Math.random) {
  const s = String(c).trim(); const n = toNum(s); if (!Number.isFinite(n)) return [];
  const dec = (s.split(/[.,]/)[1] || '').length; const comma = s.includes(',');
  const fmtN = (v) => { const t = v.toFixed(dec); return comma ? t.replace('.', ',') : t; };
  const step = dec ? Math.pow(10, -dec) : 1;
  const c0 = [n + step, n - step, n + 2 * step, n - 2 * step, n + 10 * step, n - 10 * step, n + 5 * step, n - 5 * step];
  if (!dec && Number.isInteger(n) && n > 9 && n < 100) { const sw = Number(String(Math.abs(n)).split('').reverse().join('')); if (sw !== n) c0.push(sw); }
  if (!dec && n !== 0 && Math.abs(n) < 1000) c0.push(n * 10); if (!dec && n > 9 && n % 10 === 0) c0.push(n / 10);
  return shuf(c0.filter((v) => v !== n && (n < 0 || v >= 0)), rand).map(fmtN).filter((v) => v !== s);
}
export function pickDistractors(correct, pool, n = 3, rand = Math.random) {
  const c = String(correct).trim(); const seen = new Set([c.toLowerCase()]); const cands = [];
  for (const p of pool || []) { const s = String(p).trim(); const k = s.toLowerCase(); if (!s || seen.has(k)) continue; seen.add(k); cands.push(s); }
  const cn = isNumStr(c); const out = [];
  if (cn) for (const s of numericDistractors(c, rand).slice(0, 2)) { if (!out.includes(s) && s.toLowerCase() !== c.toLowerCase()) { out.push(s); seen.add(s.toLowerCase()); } }
  const sc = cands.filter((s) => !out.includes(s)).map((s) => ({ s, score: (isNumStr(s) === cn ? 0 : 3) + (Math.abs(s.length - c.length) / Math.max(4, c.length)) * 2 + (s[0] && c[0] && s[0].toLowerCase() === c[0].toLowerCase() ? -0.5 : 0) + rand() * 1.2 }));
  sc.sort((a, b) => a.score - b.score);
  for (const x of sc) { if (out.length >= n) break; out.push(x.s); }
  if (cn && out.length < n) for (const s of numericDistractors(c, rand)) { if (out.length >= n) break; if (!out.includes(s) && !seen.has(s.toLowerCase())) { out.push(s); seen.add(s.toLowerCase()); } }
  return out.slice(0, n);
}
const answerText = (q) => (q.t === 'num' ? nl(q.a) : typeof q.a === 'string' ? q.a : '');
export function makeMc(q, pool, rand = Math.random, n = 4) {
  if (!q) return null;
  if (q.t === 'mc') return q;
  if (!['type', 'fill', 'num'].includes(q.t)) return null;
  const a = answerText(q); if (!a) return null;
  const cands = [];
  for (const p of pool || []) { if (p === q || !['type', 'fill', 'num', 'mc'].includes(p.t)) continue; const t = answerText(p); if (t && t.length <= 60) cands.push({ t, same: (p.g || '') === (q.g || '') && (p.lang || '') === (q.lang || '') }); }
  const sameG = cands.filter((c) => c.same).map((c) => c.t); const others = cands.filter((c) => !c.same).map((c) => c.t);
  let ds = pickDistractors(a, sameG, n - 1, rand);
  if (ds.length < n - 1) ds = ds.concat(pickDistractors(a, others.filter((t) => !ds.includes(t)), n - 1 - ds.length, rand));
  if (ds.length < 2) return null;
  const o = shuf([a, ...ds], rand);
  const r = { ...q, t: 'mc', a, o }; delete r.alt; delete r.tol; return r;
}

/* ---------- paren -> vragen ---------- */
export function pairsToQuestions(pairs, o = {}) {
  const rand = o.rand || (o.seed != null ? mulberry(o.seed) : Math.random);
  const types = o.types && o.types.length ? o.types : ['type'];
  const dirs = o.dir === 'both' ? ['fwd', 'rev'] : [o.dir === 'rev' ? 'rev' : 'fwd'];
  const lang = o.lang && o.lang !== 'nl' ? o.lang : undefined;
  const out = [];
  const base = (q, a, alt, x, dir) => {
    const num = isNumStr(a) && (!alt || alt.every(isNumStr));
    const b = num ? { t: 'num', q, a: toNum(a) } : { t: 'type', q, a };
    if (alt && alt.length) b.alt = num ? alt.map(toNum) : alt; if (x) b.x = x; if (o.g) b.g = o.g;
    if (lang) { b.lang = lang; if (dir === 'rev') b.say = q; }
    return b;
  };
  for (const dir of dirs) {
    const P = pairs.map((p) => (dir === 'fwd' ? { q: p.q, a: p.a, alt: p.alt, x: p.x } : { q: p.a, a: p.q, alt: undefined, x: p.x }));
    const pool = P.map((p) => p.a);
    P.forEach((p, i) => {
      for (const t of types) {
        if (t === 'type') out.push(base(p.q, p.a, p.alt, p.x, dir));
        else if (t === 'mc') {
          const ds = pickDistractors(p.a, pool, 3, rand); if (ds.length < 2) continue;
          const b = base(p.q, p.a, p.alt, p.x, dir);
          out.push({ ...b, t: 'mc', a: String(p.a), o: shuf([String(p.a), ...ds], rand), alt: undefined });
        } else if (t === 'tf') {
          const wrong = i % 2 === 1 && P.length > 1; let shown = p.a;
          if (wrong) { const ds = pickDistractors(p.a, pool, 1, rand); if (!ds.length) continue; shown = ds[0]; }
          const q = { t: 'tf', q: clip(`„${p.q}” hoort bij „${shown}”.`, MAX_QLEN), a: !wrong, x: wrong ? `Het goede antwoord is „${p.a}”.` : p.x };
          if (!q.x) delete q.x; if (o.g) q.g = o.g; if (lang) q.lang = lang; out.push(q);
        } else if (t === 'listen' && lang && dir === 'fwd') {
          out.push({ t: 'type', q: '🔊 Luister en typ wat je hoort', say: p.a, a: p.a, lang, g: 'luister', e: '🎧', d: 3 });
        } else if (t === 'fill' && p.q.length > 8 && p.q.toLowerCase().includes(String(p.a).toLowerCase()) && !isNumStr(p.a)) {
          const re = new RegExp(String(p.a).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          out.push({ t: 'fill', q: p.q.replace(re, '___'), a: p.a, ...(o.g ? { g: o.g } : {}), ...(lang ? { lang } : {}) });
        }
      }
    });
    if (types.includes('match')) {
      const size = P.length >= 8 ? 4 : Math.min(5, Math.max(3, P.length));
      for (let i = 0; i + 2 <= P.length; i += size) { const grp = P.slice(i, i + size); if (grp.length >= 3 || (P.length >= 2 && i === 0)) out.push({ t: 'match', q: 'Verbind de paren', a: grp.map((p) => [p.q, p.a]), ...(o.g ? { g: o.g } : {}), ...(lang ? { lang } : {}) }); }
    }
  }
  const res = []; const seen = new Set();
  for (const q of out) { const c = cleanQ(q); if (!c) continue; const k = c.t + '|' + c.q + '|' + JSON.stringify(c.a); if (seen.has(k)) continue; seen.add(k); res.push(c); }
  return res;
}

/* ---------- tekst -> vragen ---------- */
const STOP = new Set('de het een en van in op te dat die dit deze met voor aan als maar ook nog bij naar uit door over onder zijn haar hun ons ons werd waren worden wordt heeft hebben had kunnen zoals tussen vanaf omdat doordat daarom hierdoor sommige verschillende meestal altijd vaak soms bijna ongeveer waarin waarbij waarvan zodat terwijl tijdens binnen buiten tegen zonder'.split(' '));
const ABBR = ['bijv', 'enz', 'ca', 'nr', 'dr', 'mr', 'prof', 'bv', 'o.a', 'd.w.z', 'vgl', 'blz', 'max', 'min', 'st', 'jr', 'sr'];
export function splitSentences(text) {
  let t = String(text || '').replace(/\s+/g, ' ').trim();
  t = t.replace(/(\d)\.(\d)/g, '$1\u0001$2').replace(/(\d),(\d)/g, '$1\u0002$2');
  for (const a of ABBR) t = t.replace(new RegExp('\\b' + a.replace(/\./g, '\\.') + '\\.', 'gi'), (m) => m.replace(/\./g, '\u0003'));
  const parts = t.match(/[^.!?]+[.!?]+["”')]*(?:\s|$)|[^.!?]+$/g) || [];
  return parts.map((s) => s.replace(/\u0001/g, '.').replace(/\u0002/g, ',').replace(/\u0003/g, '.').trim()).filter(Boolean);
}
function findTargets(sentence) {
  const res = [];
  const re = /\d[\d.,]*\d|\d/g; let m;
  while ((m = re.exec(sentence))) { if (m.index === 0) continue; res.push({ cat: 'num', text: m[0].replace(/[.,]$/, ''), at: m.index }); }
  const words = [...sentence.matchAll(/[A-Za-zÀ-ÿ'’-]+/g)];
  for (let i = 1; i < words.length; i++) {
    const w = words[i][0];
    if (/^[A-ZÀ-Ý]/.test(w) && w.length > 1 && !(w === 'Ik')) {
      let end = i; while (end + 1 < words.length && /^[A-ZÀ-Ý]/.test(words[end + 1][0]) && words[end + 1].index === words[end].index + words[end][0].length + 1) end++;
      const start = words[i].index, last = words[end]; res.push({ cat: 'name', text: sentence.slice(start, last.index + last[0].length), at: start }); i = end;
    }
  }
  let best = null;
  for (const w of words) { const lw = w[0].toLowerCase(); if (lw.length >= 7 && !STOP.has(lw) && /^[a-zà-ÿ]/.test(w[0]) && (!best || lw.length > best[0].length)) best = w; }
  if (best) res.push({ cat: 'word', text: best[0], at: best.index });
  return res;
}
const gapped = (s, tg) => s.slice(0, tg.at) + '___' + s.slice(tg.at + tg.text.length);
export function textToQuestions(text, o = {}) {
  const rand = o.rand || (o.seed != null ? mulberry(o.seed) : Math.random);
  const kinds = o.kinds || ['fill', 'mc', 'tf'];
  const sents = splitSentences(text).filter((s) => s.length >= 25 && s.length <= 300 && s.split(' ').length >= 4);
  const info = sents.map((s) => ({ s, tg: findTargets(s) }));
  const pools = { num: [], name: [], word: [] };
  for (const i of info) for (const t of i.tg) pools[t.cat].push(t.text);
  const cands = []; let id = 0;
  info.forEach((it, idx) => {
    const pref = idx % 2 === 0 ? ['num', 'name', 'word'] : ['name', 'num', 'word']; let tg = null;
    for (const c of pref) { tg = it.tg.find((t) => t.cat === c); if (tg) break; }
    if (!tg) return;
    const q = gapped(it.s, tg); const g = o.g;
    const add = (kind, qq) => { const c = cleanQ(g ? { ...qq, g } : qq); if (c) cands.push({ id: id++, kind, sentence: it.s, q: c, keep: true }); };
    if (kinds.includes('fill')) add('fill', { t: 'fill', q, a: tg.text });
    if (kinds.includes('mc')) {
      let ds = pickDistractors(tg.text, pools[tg.cat].filter((x) => x.toLowerCase() !== tg.text.toLowerCase()), 3, rand);
      if (tg.cat === 'num' && ds.length < 3) ds = pickDistractors(tg.text, [...ds, ...numericDistractors(tg.text, rand)], 3, rand);
      if (ds.length >= 2) add('mc', { t: 'mc', q, a: tg.text, o: shuf([tg.text, ...ds], rand) });
    }
    if (kinds.includes('tf')) {
      const makeFalse = idx % 2 === 0;
      if (makeFalse && tg.cat !== 'word') {
        const ds = tg.cat === 'num' ? numericDistractors(tg.text, rand) : pickDistractors(tg.text, pools[tg.cat], 1, rand);
        if (ds.length) { add('tf', { t: 'tf', q: it.s.slice(0, tg.at) + ds[0] + it.s.slice(tg.at + tg.text.length), a: false, x: `Het klopt zo: „${it.s}”` }); return; }
      }
      add('tf', { t: 'tf', q: it.s, a: true });
    }
  });
  const lim = o.max || 60;
  return { sentences: sents.length, cands: cands.slice(0, lim) };
}

/* ---------- vraag <-> formulier (kit-maker) ---------- */
const lines = (s) => String(s || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
export function fieldsToQ(f, rand = Math.random) {
  const t = f.t; const q = { t, q: String(f.q || '').trim() };
  const a = String(f.a == null ? '' : f.a).trim();
  if (!q.q) return { error: 'Vul de vraag in.' };
  if (t === 'mc') { const w = lines(f.opts); if (!a) return { error: 'Vul het goede antwoord in.' }; if (!w.length) return { error: 'Geef minstens 1 fout antwoord (één per regel).' }; q.a = a; q.o = shuf([a, ...w], rand); }
  else if (t === 'type') { if (!a) return { error: 'Vul het antwoord in.' }; q.a = a; const alt = lines(String(f.alt || '').replace(/[,;]/g, '\n')); if (alt.length) q.alt = alt; }
  else if (t === 'fill') { if (!q.q.includes('___')) return { error: 'Zet ___ (drie streepjes onder) op de plek van het gat.' }; if (!a) return { error: 'Vul het ontbrekende woord in.' }; q.a = a; const w = lines(f.opts); if (w.length) q.o = shuf([a, ...w], rand); const alt = lines(String(f.alt || '').replace(/[,;]/g, '\n')); if (alt.length) q.alt = alt; }
  else if (t === 'tf') q.a = /^(waar|true|ja|1)/i.test(a);
  else if (t === 'num') { const n = toNum(a); if (!Number.isFinite(n)) return { error: 'Het antwoord moet een getal zijn.' }; q.a = n; const alt = String(f.alt || '').split(/[;|]/).map(toNum).filter(Number.isFinite); if (alt.length) q.alt = alt; const tol = toNum(f.tol); if (Number.isFinite(tol) && tol > 0) q.tol = tol; }
  else if (t === 'order') { const it = lines(f.opts); if (it.length < 3) return { error: 'Zet minstens 3 items onder elkaar, in de goede volgorde.' }; q.a = it; }
  else if (t === 'match') { const ps = lines(f.opts).map((l) => { const m = /^(.*?)\s*(?:=|->|→|:|\s-\s)\s*(.+)$/.exec(l); return m ? [m[1].trim(), m[2].trim()] : null; }).filter((p) => p && p[0] && p[1]); if (ps.length < 3) return { error: 'Schrijf minstens 3 paren, één per regel: links = rechts.' }; q.a = ps; }
  else if (t === 'multi') { const raw = lines(f.opts); const good = raw.filter((l) => /^[*+]/.test(l)).map((l) => l.replace(/^[*+]\s*/, '')); const o = raw.map((l) => l.replace(/^[*+]\s*/, '')); if (o.length < 3) return { error: 'Geef minstens 3 opties.' }; if (!good.length) return { error: 'Zet een * voor de goede opties.' }; q.o = o; q.a = good; }
  else return { error: 'Onbekend vraagtype.' };
  if (f.e) q.e = f.e; if (f.x) q.x = f.x; if (f.g) q.g = f.g; if (f.say) q.say = f.say; if (f.lang) q.lang = f.lang;
  const d = Math.round(Number(f.d)); if (d >= 1 && d <= 3) q.d = d;
  const c = cleanQ(q); if (!c) return { error: 'Deze vraag klopt nog niet helemaal.' };
  return { q: c };
}
export function qToFields(q) {
  const f = { t: q.t, q: q.q || '', a: '', opts: '', alt: '', e: q.e || '', x: q.x || '', g: q.g || '', d: q.d || 2, say: q.say || '', lang: q.lang || '', tol: q.tol || '' };
  if (q.t === 'mc') { f.a = q.a; f.opts = (q.o || []).filter((o) => o !== q.a).join('\n'); }
  else if (q.t === 'type' || q.t === 'fill') { f.a = q.a; f.alt = (q.alt || []).join(', '); f.opts = q.o ? q.o.filter((o) => o !== q.a).join('\n') : ''; }
  else if (q.t === 'tf') f.a = q.a ? 'waar' : 'onwaar';
  else if (q.t === 'num') { f.a = nl(q.a); f.alt = (q.alt || []).map(nl).join('; '); }
  else if (q.t === 'order') f.opts = (q.a || []).join('\n');
  else if (q.t === 'match') f.opts = (q.a || []).map((p) => p[0] + ' = ' + p[1]).join('\n');
  else if (q.t === 'multi') f.opts = (q.o || []).map((o) => (q.a.includes(o) ? '* ' : '') + o).join('\n');
  return f;
}
export function qSummary(q) {
  const a = q.t === 'tf' ? (q.a ? 'waar' : 'onwaar') : q.t === 'num' ? nl(q.a) : q.t === 'match' ? q.a.map((p) => p[0] + '=' + p[1]).join(', ') : Array.isArray(q.a) ? q.a.join(' · ') : String(q.a);
  return { q: q.q, a: clip(a, 80) };
}

/* ---------- kaarten (flitskaarten / leerkaart) ---------- */
export function cardText(q) {
  const strip = (s) => String(s);
  let back;
  if (q.t === 'tf') back = q.a ? 'Waar' : 'Onwaar';
  else if (q.t === 'num') back = [nl(q.a), ...(q.alt || []).map(nl)].join(' / ');
  else if (q.t === 'order') back = q.a.map((x, i) => `${i + 1}. ${x}`).join('\n');
  else if (q.t === 'match') back = q.a.map((p) => `${p[0]} → ${p[1]}`).join('\n');
  else if (q.t === 'multi') back = q.a.join('\n');
  else back = strip(q.a) + (q.alt && q.alt.length ? ' / ' + q.alt.join(' / ') : '');
  let front = q.t === 'fill' ? q.q.replace('___', '＿＿＿') : q.q;
  // bij een onwaar-vraag leer je de goede bewering (uit de uitleg), niet de foute
  if (q.t === 'tf' && !q.a && q.x && q.x.length < 160) return { front: q.x, back: 'Waar ✓', x: '', e: q.e || '' };
  return { front, back, x: q.x || '', e: q.e || '' };
}
export class FlashDeck {
  constructor(items, rand = Math.random) { this.rand = rand; this.all = items.slice(); this.items = shuf(items, rand); this.i = 0; this.known = []; this.unknown = []; this.round = 1; }
  get done() { return this.i >= this.items.length; }
  current() { return this.items[this.i] || null; }
  mark(known) { const c = this.current(); if (!c) return null; (known ? this.known : this.unknown).push(c); this.i++; return c; }
  nextRound() { if (!this.unknown.length) return false; this.items = shuf(this.unknown, this.rand); this.unknown = []; this.i = 0; this.round++; return true; }
  get left() { return this.items.length - this.i; }
}

/* ---------- Leitner-leersessie ---------- */
export function stepsFor(q, box) {
  const simple = q.t === 'mc' || q.t === 'type' || q.t === 'fill' || q.t === 'num';
  if (!simple) return box <= 0 ? ['card', 'real'] : ['real'];
  if (box <= 0) return q.t === 'num' ? ['card', 'real'] : ['card', 'mc', 'type'];
  if (box === 1) return q.t === 'num' ? ['real'] : ['mc', 'type'];
  return ['type'];
}
export class LearnQueue {
  constructor(items, { maxRetries = 3 } = {}) { this.q = items.map((it) => ({ ...it, steps: it.steps.slice(), i: 0, missed: false, tries: 0, recorded: false })); this.total = this.q.length; this.finished = 0; this.maxRetries = maxRetries; this.correct = 0; this.wrong = 0; this.log = []; }
  get done() { return this.q.length === 0; }
  current() { const it = this.q[0]; return it ? { item: it, step: it.steps[it.i], retry: it.tries > 0 } : null; }
  // ok wordt genegeerd bij 'card'/'see'. Geeft { record: null|true|false, finished: bool }
  advance(ok) {
    const it = this.q[0]; if (!it) return null;
    const step = it.steps[it.i]; const info = step === 'card' || step === 'see'; let record = null;
    if (!info) {
      if (ok) { this.correct++; it.i++; }
      else {
        this.wrong++; if (!it.recorded) { record = false; it.recorded = true; } it.missed = true; it.tries++;
        this.q.shift();
        if (it.tries <= this.maxRetries) { const qs = it.steps.filter((s) => s !== 'card' && s !== 'see'); it.steps = qs.length > 2 ? qs.slice(-2) : qs; it.i = 0; this.q.splice(Math.min(this.q.length, 2 + it.tries), 0, it); }
        else this.finished++;
        this.log.push({ id: it.id, ok: false }); return { record, finished: false };
      }
    } else it.i++;
    if (it.i >= it.steps.length) {
      this.q.shift(); this.finished++;
      if (!it.missed && !it.recorded) { record = true; it.recorded = true; }
      this.log.push({ id: it.id, ok: !it.missed }); return { record, finished: true };
    }
    return { record, finished: false };
  }
  progress() { return { done: this.finished, total: this.total }; }
}

/* ---------- Levens-modus ---------- */
export class LivesState {
  constructor({ lives = 3, shield = 0 } = {}) { this.lives = lives; this.max = lives; this.shield = shield; this.streak = 0; this.best = 0; this.score = 0; this.correct = 0; this.wrong = 0; this.saved = 0; }
  get over() { return this.lives <= 0; }
  step(ok, bonus = 0) {
    if (this.over) return this;
    if (ok) { this.streak++; this.best = Math.max(this.best, this.streak); this.correct++; this.score += 10 + Math.min(this.streak - 1, 20) * 2 + bonus; if (this.streak > 0 && this.streak % 10 === 0 && this.lives < this.max + 2) this.lives++; }
    else { this.wrong++; this.streak = 0; if (this.shield > 0) { this.shield--; this.saved++; } else this.lives--; }
    return this;
  }
}

/* ---------- cijfers & beloning ---------- */
export function gradeFor(score, total, cesuur = 0.55) {
  if (!total) return 1;
  const p = Math.max(0, Math.min(1, score / total));
  const g = p >= cesuur ? 5.5 + (4.5 * (p - cesuur)) / (1 - cesuur) : 1 + (4.5 * p) / cesuur;
  return Math.round(g * 10) / 10;
}
export function gradeLabel(g) { return g >= 9 ? 'Geweldig! 🌟' : g >= 7.5 ? 'Heel goed! 🎉' : g >= 6 ? 'Voldoende 👍' : g >= 5.5 ? 'Bijna! 💪' : 'Blijf oefenen, je kunt dit! 🌱'; }
export function rewardFor({ correct = 0, wrong = 0, mode = 'oefen', grade = 0, best = 0 } = {}) {
  let xp = correct * 3 + wrong; let coins = Math.ceil(correct / 2);
  if (mode === 'toets' && grade >= 5.5) { xp += Math.round(grade * 2); coins += Math.round(grade); }
  if (mode === 'levens') { xp += best; coins += Math.floor(best / 3); }
  if (mode === 'leren') { xp += 5; coins += 2; }
  return { xp: Math.min(xp, 400), coins: Math.min(coins, 150) };
}

/* ---------- talen (woordjes in fasen) ---------- */
export const PHASES = ['see', 'choose', 'type', 'listen'];
export const PHASE_NAMES = { see: 'Zien + horen', choose: 'Kiezen', type: 'Typen', listen: 'Luisteren en typen' };
export function phaseStepsForBox(box) { return box <= 0 ? ['see', 'choose', 'type'] : box === 1 ? ['choose', 'type'] : box === 2 ? ['type', 'listen'] : ['listen']; }
export function wordsOf(kit) {
  const out = []; const lang = kit && kit.lang;
  for (const q of (kit && kit.qs) || []) {
    if (!['type', 'mc'].includes(q.t) || typeof q.a !== 'string') continue;
    if (q.q.length > 60 || q.a.length > 60 || q.g === 'luister') continue;
    const fl = q.lang || lang; if (!fl || fl === 'nl') continue;
    out.push({ q, nl: q.q.replace(/^(Wat is|Vertaal)\s+/i, '').replace(/[?:]\s*$/, ''), fo: q.a, alt: q.alt || [], lang: fl, x: q.x, e: q.e });
  }
  return out;
}
export function dirOf(dir, w) { return dir === 'mix' ? (hashStr(w.nl) % 2 ? 'xx2nl' : 'nl2xx') : dir; }
export function langQuestion(w, phase, dir, pool, rand = Math.random) {
  const d = dirOf(dir, w); const LN = { en: 'het Engels', de: 'het Duits', fr: 'het Frans', es: 'het Spaans' }[w.lang] || 'de taal';
  const toFo = d === 'nl2xx';
  const prompt = toFo ? w.nl : w.fo; const ans = toFo ? w.fo : w.nl; const alt = toFo ? w.alt : [];
  const label = toFo ? `Vertaal naar ${LN}` : 'Vertaal naar het Nederlands';
  if (phase === 'listen') return { t: 'type', q: '🔊 Luister en typ wat je hoort', say: w.fo, a: w.fo, alt: w.alt, lang: w.lang, e: '🎧', g: 'luister' };
  const base = { q: `${label}: ${prompt}`, e: w.e, x: w.x, lang: toFo ? w.lang : 'nl', g: 'woord' };
  if (phase === 'choose') {
    const poolA = (pool || []).map((p) => (toFo ? p.fo : p.nl));
    const ds = pickDistractors(ans, poolA, 3, rand);
    if (ds.length >= 2) return { ...base, t: 'mc', a: ans, o: shuf([ans, ...ds], rand) };
  }
  return { ...base, t: 'type', a: ans, ...(alt.length ? { alt } : {}) };
}

/* ---------- kit-code delen ---------- */
function lzwEnc(bytes) {
  const dict = new Map(); let next = 256; const out = []; let acc = 0, nb = 0;
  const bitlen = (x) => Math.max(9, 32 - Math.clz32(x));
  const put = (code) => { const w = bitlen(next); acc += code * Math.pow(2, nb); nb += w; while (nb >= 8) { out.push(acc % 256); acc = Math.floor(acc / 256); nb -= 8; } };
  let w = '';
  for (let i = 0; i < bytes.length; i++) {
    const c = String.fromCharCode(bytes[i]); const wc = w + c;
    if (wc.length === 1 || dict.has(wc)) { w = wc; continue; }
    put(w.length === 1 ? w.charCodeAt(0) : dict.get(w)); dict.set(wc, next++); w = c;
  }
  if (w) put(w.length === 1 ? w.charCodeAt(0) : dict.get(w));
  if (nb > 0) out.push(acc % 256);
  return Uint8Array.from(out);
}
function lzwDec(data, count) {
  const dict = []; for (let i = 0; i < 256; i++) dict[i] = String.fromCharCode(i);
  let next = 256; let acc = 0, nb = 0, p = 0; const res = [];
  const bitlen = (x) => Math.max(9, 32 - Math.clz32(x));
  const get = (w) => { while (nb < w) { if (p >= data.length) return -1; acc += data[p++] * Math.pow(2, nb); nb += 8; } const v = acc % Math.pow(2, w); acc = Math.floor(acc / Math.pow(2, w)); nb -= w; return v; };
  let prev = null; let first = true;
  for (;;) {
    const w = bitlen(first ? next : next + 1);
    const code = get(w); if (code < 0 || code >= next + 1) { if (code < 0) break; throw new Error('kapotte code'); }
    let entry;
    if (code < next) entry = dict[code]; else if (prev !== null) entry = prev + prev[0]; else throw new Error('kapotte code');
    res.push(entry);
    if (prev !== null) dict[next++] = prev + entry[0];
    prev = entry; first = false;
    if (res.length > 4e6) throw new Error('te groot');
  }
  const s = res.join(''); const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b;
}
const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64 = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
export function encodeKit(kit) {
  const c = cleanKit(kit).kit;
  const payload = { v: 1, n: c.name, e: c.emoji, d: c.desc || undefined, l: c.lang, g: c.group, q: c.qs.map((q) => { const r = { ...q }; if (r.d === 2) delete r.d; return r; }) };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  if (bytes.length <= 60000) { const z = lzwEnc(bytes); const code = 'LK2.' + b64(z); const plain = 'LK1.' + b64(bytes); return code.length < plain.length ? code : plain; }
  return 'LK1.' + b64(bytes);
}
export function decodeKit(code) {
  try {
    const t = String(code || '').replace(/\s+/g, ''); const m = /^(LK[12])\.([A-Za-z0-9_-]+)$/.exec(t);
    if (!m) return { error: 'Dit lijkt geen kit-code (die begint met LK2.).' };
    let bytes = unb64(m[2]); if (m[1] === 'LK2') bytes = lzwDec(bytes);
    const p = JSON.parse(new TextDecoder().decode(bytes));
    if (!p || !Array.isArray(p.q)) return { error: 'De code bevat geen vragen.' };
    const { kit, dropped } = cleanKit({ name: p.n, emoji: p.e, desc: p.d, lang: p.l, group: p.g, qs: p.q, src: 'user' });
    if (!kit.qs.length) return { error: 'Geen bruikbare vragen in de code.' };
    return { kit, dropped };
  } catch (e) { return { error: 'De code is beschadigd of niet compleet.' }; }
}
export function kitToText(kit) {
  const out = [];
  for (const q of kit.qs) {
    if ((q.t === 'type' || q.t === 'mc' || q.t === 'fill') && typeof q.a === 'string' && !/[\n=]/.test(q.q + q.a)) out.push(`${q.q.replace(/\s*-\s*/g, ' ')} - ${q.a}${q.alt && q.alt.length ? ' / ' + q.alt.join(' / ') : ''}`);
    else if (q.t === 'num') out.push(`${q.q} = ${nl(q.a)}`);
  }
  return out.join('\n');
}

/* ---------- kit-lijsten ---------- */
export function filterKits(list, { q = '', lang = '', group = '' } = {}) {
  const s = q.trim().toLowerCase();
  return list.filter((k) => (!lang || (k.lang || 'nl') === lang) && (!group || (k.group || 'Overig') === group) && (!s || (k.name + ' ' + (k.group || '') + ' ' + (k.desc || '')).toLowerCase().includes(s)));
}
export function groupKits(list, order = ['Talen', 'Spelling', 'Rekenen', 'Wereld', 'Natuur', 'Mens', 'Geschiedenis', 'Creatief', 'Technologie']) {
  const m = new Map(); for (const k of list) { const g = k.group || 'Overig'; if (!m.has(g)) m.set(g, []); m.get(g).push(k); }
  return [...m.entries()].sort((a, b) => { const ia = order.indexOf(a[0]), ib = order.indexOf(b[0]); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a[0].localeCompare(b[0]); }).map(([group, kits]) => ({ group, kits: kits.sort((x, y) => x.name.localeCompare(y.name, 'nl')) }));
}
export function pushRecent(list, id, max = 8) { return [id, ...(list || []).filter((x) => x !== id)].slice(0, max); }

/* ---------- generatoren (wizard) ---------- */
const DAYS = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
const MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
const NAMES = ['Anna', 'Tim', 'Sophie', 'Daan', 'Lotte', 'Max', 'Eva', 'Jesse', 'Noa', 'Finn', 'Mila', 'Sem'];
const PLACES = ['Amsterdam', 'Utrecht', 'Spanje', 'Frankrijk', 'Rotterdam', 'Groningen', 'Nederland', 'Zeeland', 'Belgie', 'Duitsland'];
export function timeWords(h, m) {
  const hn = (x) => ((x % 12) || 12);
  switch (m) {
    case 0: return `${hn(h)} uur`; case 5: return `vijf over ${hn(h)}`; case 10: return `tien over ${hn(h)}`; case 15: return `kwart over ${hn(h)}`;
    case 20: return `tien voor half ${hn(h + 1)}`; case 25: return `vijf voor half ${hn(h + 1)}`; case 30: return `half ${hn(h + 1)}`; case 35: return `vijf over half ${hn(h + 1)}`;
    case 40: return `tien over half ${hn(h + 1)}`; case 45: return `kwart voor ${hn(h + 1)}`; case 50: return `tien voor ${hn(h + 1)}`; case 55: return `vijf voor ${hn(h + 1)}`;
    default: return `${hn(h)}:${String(m).padStart(2, '0')}`;
  }
}
export const timeDigital = (h, m) => `${(h % 12) || 12}:${String(m).padStart(2, '0')}`;
const CLK_H = ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚'];
const CLK_HALF = ['🕧', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦'];
function numQ(q, a, extra = {}, rand = Math.random, mcChance = 0, pool = []) {
  if (mcChance && rand() < mcChance) {
    const s = nl(a); const ds = pickDistractors(s, pool.map((x) => nl(x)), 3, rand);
    if (ds.length >= 3) return { t: 'mc', q, a: s, o: shuf([s, ...ds], rand), ...extra };
  }
  return { t: 'num', q, a, ...extra };
}
function dedupe(qs, count, withType = false) { const seen = new Set(); const out = []; for (const q of qs) { if (!q) continue; const k = (withType ? q.t + '|' : '') + q.q + '|' + (Array.isArray(q.a) ? JSON.stringify(q.a) : String(q.a)); if (seen.has(k)) continue; seen.add(k); out.push(q); if (out.length >= count) break; } return out; }

export const GENERATORS = [
  { kind: 'tables', name: 'Tafels', emoji: '✖️', desc: 'Maal- en deelsommen van de tafels die je kiest.',
    params: [{ key: 'tables', label: 'Welke tafels?', type: 'multi', options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({ v: n, l: String(n) })), def: [2, 3, 4, 5, 10] }, { key: 'ops', label: 'Soort', type: 'select', options: [{ v: 'mul', l: 'Maalsommen' }, { v: 'div', l: 'Deelsommen' }, { v: 'both', l: 'Allebei' }], def: 'both' }, { key: 'mc', label: 'Meerkeuze erbij', type: 'select', options: [{ v: 0, l: 'Alleen typen' }, { v: 0.4, l: 'Een beetje' }, { v: 0.8, l: 'Veel' }], def: 0.4 }] },
  { kind: 'multiply', name: 'Grote maalsommen', emoji: '🧮', desc: 'Maalsommen met grotere getallen.', params: [{ key: 'level', label: 'Niveau', type: 'select', options: [{ v: 1, l: '2 cijfers × 1 cijfer' }, { v: 2, l: '3 cijfers × 1 cijfer' }, { v: 3, l: '2 cijfers × 2 cijfers' }, { v: 4, l: 'Met tientallen/honderdtallen (30 × 400)' }], def: 1 }] },
  { kind: 'addsub', name: 'Optellen en aftrekken', emoji: '➕', desc: 'Plus- en minsommen op jouw niveau.', params: [{ key: 'op', label: 'Soort', type: 'select', options: [{ v: 'add', l: 'Optellen' }, { v: 'sub', l: 'Aftrekken' }, { v: 'both', l: 'Allebei' }], def: 'both' }, { key: 'level', label: 'Niveau', type: 'select', options: [{ v: 1, l: 'tot 20' }, { v: 2, l: 'tot 100' }, { v: 3, l: 'tot 1000' }, { v: 4, l: 'tot 10.000' }, { v: 5, l: 'met komma' }], def: 2 }] },
  { kind: 'divide', name: 'Delen', emoji: '➗', desc: 'Deelsommen, ook met rest en staartdeling.', params: [{ key: 'level', label: 'Niveau', type: 'select', options: [{ v: 1, l: 'Tafels (tot 100)' }, { v: 2, l: '2 cijfers : 1 cijfer' }, { v: 3, l: 'Met rest' }, { v: 4, l: '3 cijfers : 1 cijfer' }, { v: 5, l: '4 cijfers : 2 cijfers' }], def: 2 }] },
  { kind: 'clock', name: 'Klok kijken', emoji: '🕒', desc: 'Hoe laat is het? Hele uren tot vijf minuten.', params: [{ key: 'level', label: 'Niveau', type: 'select', options: [{ v: 1, l: 'Hele en halve uren' }, { v: 2, l: 'Kwartieren' }, { v: 3, l: 'Per 5 minuten' }], def: 2 }] },
  { kind: 'money', name: 'Geld', emoji: '💶', desc: 'Munten tellen, wisselgeld en winkelsommen.', params: [{ key: 'level', label: 'Niveau', type: 'select', options: [{ v: 1, l: 'Munten tellen' }, { v: 2, l: 'Wisselgeld' }, { v: 3, l: 'Winkelen (meer dingen)' }], def: 2 }] },
  { kind: 'fractions', name: 'Breuken', emoji: '🍕', desc: 'Stukjes van een geheel: deel van, groter dan, gelijk.', params: [{ key: 'level', label: 'Niveau', type: 'select', options: [{ v: 1, l: 'Helft en kwart' }, { v: 2, l: 'Alle simpele breuken' }, { v: 3, l: 'Vergelijken en gelijk' }], def: 2 }] },
  { kind: 'percent', name: 'Procenten', emoji: '💯', desc: 'Procent van, korting en hoeveel procent.', params: [{ key: 'level', label: 'Niveau', type: 'select', options: [{ v: 1, l: '10%, 50%, 25%' }, { v: 2, l: '5%, 20%, 75%' }, { v: 3, l: 'Korting' }, { v: 4, l: 'Hoeveel procent is…' }], def: 2 }] },
  { kind: 'caps', name: 'Hoofdletters en leestekens', emoji: '🔠', desc: 'Welke zin is goed geschreven?', params: [] },
  { kind: 'wordpairs', name: 'Woordjes-paren', emoji: '🗣', desc: 'Plak woordparen en krijg meteen kiezen, typen en luisteren.', params: [{ key: 'text', label: 'Woordjes (woord - vertaling, één per regel)', type: 'text', def: '' }, { key: 'lang', label: 'Taal van de vertaling', type: 'select', options: [{ v: 'en', l: 'Engels' }, { v: 'de', l: 'Duits' }, { v: 'fr', l: 'Frans' }, { v: 'es', l: 'Spaans' }, { v: 'nl', l: 'Nederlands' }], def: 'en' }, { key: 'dir', label: 'Richting', type: 'select', options: [{ v: 'fwd', l: 'NL → taal' }, { v: 'rev', l: 'taal → NL' }, { v: 'both', l: 'Allebei' }], def: 'both' }] },
];
export function defaultParams(kind) { const g = GENERATORS.find((x) => x.kind === kind); const o = {}; for (const p of (g && g.params) || []) o[p.key] = p.def; return o; }

export function generate(kind, params = {}, count = 20, seed = 1) {
  const rand = mulberry(seed); const P = { ...defaultParams(kind), ...params }; const raw = [];
  const tries = count * 8;
  if (kind === 'tables') {
    const tabs = (P.tables && P.tables.length ? P.tables : [2, 3, 4, 5, 10]).map(Number);
    const all = []; for (const t of tabs) for (let m = 1; m <= 10; m++) all.push({ t, m });
    const poolAns = all.map((x) => x.t * x.m);
    for (let i = 0; i < tries; i++) {
      const { t, m } = pk(rand, all); const swap = rand() < 0.5; const div = P.ops === 'div' || (P.ops === 'both' && rand() < 0.4);
      const d = [2, 5, 10].includes(t) ? 1 : t >= 7 ? 3 : 2; const g = 'tafel ' + t;
      if (div) raw.push(numQ(`Hoeveel is ${t * m} : ${t}?`, m, { g, d }, rand, Number(P.mc), all.map((x) => x.m)));
      else raw.push(numQ(`Hoeveel is ${swap ? m : t} × ${swap ? t : m}?`, t * m, { g, d }, rand, Number(P.mc), poolAns));
    }
  } else if (kind === 'multiply') {
    for (let i = 0; i < tries; i++) {
      let a, b; const l = Number(P.level);
      if (l === 1) { a = ri(rand, 12, 99); b = ri(rand, 2, 9); } else if (l === 2) { a = ri(rand, 101, 999); b = ri(rand, 2, 9); } else if (l === 3) { a = ri(rand, 11, 60); b = ri(rand, 11, 40); } else { a = ri(rand, 2, 9) * pk(rand, [10, 100]); b = ri(rand, 2, 9) * pk(rand, [10, 100, 1000]); }
      raw.push({ t: 'num', q: `Hoeveel is ${a} × ${b}?`, a: a * b, d: Math.min(3, l), g: 'maal' });
    }
  } else if (kind === 'addsub') {
    for (let i = 0; i < tries; i++) {
      const l = Number(P.level); const sub = P.op === 'sub' || (P.op === 'both' && rand() < 0.5); let a, b;
      if (l === 1) { a = ri(rand, 2, 20); b = ri(rand, 1, 20); } else if (l === 2) { a = ri(rand, 10, 99); b = ri(rand, 5, 99); } else if (l === 3) { a = ri(rand, 100, 999); b = ri(rand, 50, 999); } else if (l === 4) { a = ri(rand, 1000, 9999); b = ri(rand, 500, 9999); }
      else { a = ri(rand, 10, 300) / 10; b = ri(rand, 5, 200) / 10; }
      if (sub) { if (b > a) [a, b] = [b, a]; if (a === b) continue; }
      const r = sub ? a - b : a + b; raw.push({ t: 'num', q: `Hoeveel is ${nl(a)} ${sub ? '−' : '+'} ${nl(b)}?`, a: parseFloat(r.toFixed(2)), d: l >= 4 ? 3 : l >= 2 ? 2 : 1, g: sub ? 'min' : 'plus' });
    }
  } else if (kind === 'divide') {
    for (let i = 0; i < tries; i++) {
      const l = Number(P.level); let a, b, qn, an;
      if (l === 1) { b = ri(rand, 2, 10); const m = ri(rand, 1, 10); a = b * m; an = m; qn = `Hoeveel is ${a} : ${b}?`; }
      else if (l === 2) { b = ri(rand, 2, 9); const m = ri(rand, 5, 20); a = b * m; an = m; qn = `Hoeveel is ${a} : ${b}?`; }
      else if (l === 3) { b = ri(rand, 2, 9); a = ri(rand, 11, 99); if (a % b === 0) continue; if (rand() < 0.5) { an = Math.floor(a / b); qn = `${a} : ${b} = … Hoeveel keer past ${b} in ${a}? (hele getal)`; } else { an = a % b; qn = `${a} : ${b}. Hoeveel blijft er over (de rest)?`; } }
      else if (l === 4) { b = ri(rand, 2, 9); const m = ri(rand, 30, 150); a = b * m; an = m; qn = `Hoeveel is ${a} : ${b}?`; }
      else { b = ri(rand, 11, 30); const m = ri(rand, 12, 90); a = b * m; an = m; qn = `Hoeveel is ${a} : ${b}?`; }
      raw.push({ t: 'num', q: qn, a: an, d: Math.min(3, Math.ceil(l / 2)), g: 'delen' });
    }
  } else if (kind === 'clock') {
    const l = Number(P.level); const mins = l === 1 ? [0, 30] : l === 2 ? [0, 15, 30, 45] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    for (let i = 0; i < tries; i++) {
      const h = ri(rand, 1, 12); const m = pk(rand, mins); const dig = timeDigital(h, m); const words = timeWords(h, m);
      const alt = [dig.replace(':', '.'), dig.replace(':', ''), String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'), (h + 12) + ':' + String(m).padStart(2, '0')];
      const kind2 = rand();
      if (l === 1 && kind2 < 0.5) raw.push({ t: 'type', q: 'Hoe laat is het? (bijvoorbeeld 3:30)', e: m === 0 ? CLK_H[h % 12] : CLK_HALF[h % 12], a: dig, alt, d: 1, g: 'klok' });
      else if (kind2 < 0.4) raw.push({ t: 'type', q: `Het is ${words}. Hoe schrijf je dat digitaal? (bijvoorbeeld 3:15)`, a: dig, alt, d: l, g: 'klok', ...(m === 0 || m === 30 ? { e: m === 0 ? CLK_H[h % 12] : CLK_HALF[h % 12] } : {}) });
      else { const pool = []; for (let k = 0; k < 8; k++) pool.push(timeWords(ri(rand, 1, 12), pk(rand, mins))); const ds = pickDistractors(words, pool, 3, rand); if (ds.length >= 3) raw.push({ t: 'mc', q: `Hoe zeg je ${dig} met woorden?`, a: words, o: shuf([words, ...ds], rand), d: l, g: 'klok' }); }
    }
  } else if (kind === 'money') {
    const l = Number(P.level); const eur = (c) => nl(c / 100);
    for (let i = 0; i < tries; i++) {
      if (l === 1) {
        const coins = [5, 10, 20, 50, 100, 200]; const n1 = ri(rand, 1, 4), c1 = pk(rand, coins), n2 = ri(rand, 1, 3), c2 = pk(rand, coins.filter((c) => c !== c1)); const nm = (c) => (c >= 100 ? `${c / 100} euro` : `${c} cent`);
        raw.push({ t: 'num', q: `Je hebt ${n1} munt${n1 > 1 ? 'en' : ''} van ${nm(c1)} en ${n2} munt${n2 > 1 ? 'en' : ''} van ${nm(c2)}. Hoeveel cent is dat samen?`, a: n1 * c1 + n2 * c2, e: '🪙', d: 1, g: 'geld' });
      } else if (l === 2) {
        const price = ri(rand, 25, 900) - (ri(rand, 0, 1) ? 0 : 0); const p5 = Math.round(price / 5) * 5; const pay = pk(rand, [500, 1000, 2000].filter((x) => x > p5)) || 1000; const ch = pay - p5;
        raw.push({ t: 'num', q: `Je koopt iets van € ${eur(p5)} en betaalt met € ${eur(pay)}. Hoeveel wisselgeld krijg je (in euro)?`, a: ch / 100, e: '🛍️', d: 2, g: 'geld' });
      } else {
        const n = ri(rand, 2, 6); const pr = ri(rand, 45, 450); const p5 = Math.round(pr / 5) * 5; const item = pk(rand, ['broodjes', 'ijsjes', 'boeken', 'pennen', 'stickers', 'appels']);
        raw.push({ t: 'num', q: `${n} ${item} kosten elk € ${eur(p5)}. Hoeveel betaal je samen (in euro)?`, a: (n * p5) / 100, e: '🛒', d: 3, g: 'geld' });
      }
    }
  } else if (kind === 'fractions') {
    const l = Number(P.level);
    for (let i = 0; i < tries; i++) {
      if (l === 1) { const f = pk(rand, [[1, 2], [1, 4], [3, 4]]); const m = ri(rand, 1, 10) * 4; raw.push({ t: 'num', q: `Wat is ${f[0]}/${f[1]} van ${m}?`, a: (m / f[1]) * f[0], e: '🍕', d: 1, g: 'breuken' }); }
      else if (l === 2) { const d = pk(rand, [2, 3, 4, 5, 6, 8, 10]); const n = ri(rand, 1, d - 1); const m = d * ri(rand, 1, 8); raw.push({ t: 'num', q: `Wat is ${n}/${d} van ${m}?`, a: (m / d) * n, d: 2, g: 'breuken' }); }
      else {
        if (rand() < 0.5) { const eq = pk(rand, [[1, 2], [1, 3], [1, 4], [2, 3], [3, 4], [1, 5]]); const k = ri(rand, 2, 4); const shown = `${eq[0] * k}/${eq[1] * k}`; const right = `${eq[0]}/${eq[1]}`; const pool = []; for (let z = 0; z < 8; z++) pool.push(`${ri(rand, 1, 4)}/${ri(rand, 2, 6)}`); const ds = pickDistractors(right, pool.filter((p) => { const [a, b] = p.split('/').map(Number); return a < b && a * eq[1] !== b * eq[0]; }), 3, rand); if (ds.length >= 3) raw.push({ t: 'mc', q: `Welke breuk is hetzelfde als ${shown}?`, a: right, o: shuf([right, ...ds], rand), d: 3, g: 'breuken' }); }
        else { const a = [ri(rand, 1, 5), ri(rand, 2, 8)], b = [ri(rand, 1, 5), ri(rand, 2, 8)]; if (a[0] >= a[1] || b[0] >= b[1] || a[0] * b[1] === b[0] * a[1]) continue; const bigger = a[0] * b[1] > b[0] * a[1] ? a : b; const sa = `${a[0]}/${a[1]}`, sb = `${b[0]}/${b[1]}`; raw.push({ t: 'mc', q: `Welke breuk is groter: ${sa} of ${sb}?`, a: `${bigger[0]}/${bigger[1]}`, o: shuf([sa, sb, 'Ze zijn even groot', 'Dat kun je niet zien'], rand), d: 3, g: 'breuken' }); }
      }
    }
  } else if (kind === 'percent') {
    const l = Number(P.level);
    for (let i = 0; i < tries; i++) {
      if (l <= 2) { const ps = l === 1 ? [10, 50, 25, 100] : [5, 20, 75, 30, 40]; const p = pk(rand, ps); const base = p % 25 === 0 ? ri(rand, 1, 10) * 40 : p === 5 ? ri(rand, 1, 10) * 20 : ri(rand, 1, 10) * 10; raw.push({ t: 'num', q: `Wat is ${p}% van ${base}?`, a: (base * p) / 100, d: l, g: 'procent' }); }
      else if (l === 3) { const p = pk(rand, [10, 20, 25, 50]); const pr = ri(rand, 2, 20) * 10; const item = pk(rand, ['jas', 'fiets', 'spel', 'tas', 'boek']); raw.push({ t: 'num', q: `Een ${item} kost € ${pr}. Er is ${p}% korting. Hoeveel betaal je (in euro)?`, a: pr - (pr * p) / 100, d: 3, g: 'procent', e: '🏷️' }); }
      else { const p = pk(rand, [10, 20, 25, 50, 75]); const whole = pk(rand, [20, 40, 60, 80, 100, 200]); raw.push({ t: 'num', q: `Hoeveel procent is ${(whole * p) / 100} van ${whole}?`, a: p, d: 3, g: 'procent' }); }
    }
  } else if (kind === 'caps') {
    const T = [
      (r) => { const n = pk(r, NAMES), p = pk(r, PLACES); return { s: `${n} woont in ${p}.`, names: [n, p], q: false }; },
      (r) => { const n = pk(r, NAMES); return { s: `Waar woont ${n}?`, names: [n], q: true }; },
      (r) => { const n = pk(r, NAMES), p = pk(r, PLACES), d = pk(r, DAYS); return { s: `Op ${d} gaat ${n} naar ${p}.`, names: [n, p], q: false, day: d }; },
      (r) => { const n = pk(r, NAMES), m = pk(r, MONTHS); return { s: `In ${m} heeft ${n} verjaardag.`, names: [n], q: false, month: m }; },
      (r) => { const n = pk(r, NAMES), n2 = pk(r, NAMES.filter((x) => x !== n)); return { s: `${n} en ${n2} spelen met de hond.`, names: [n, n2], q: false }; },
      (r) => { const d = pk(r, DAYS); return { s: `Wat doe jij op ${d}?`, names: [], q: true, day: d }; },
      (r) => { const n = pk(r, NAMES), p = pk(r, PLACES); return { s: `Mijn vriend ${n} komt uit ${p}.`, names: [n, p], q: false }; },
    ];
    for (let i = 0; i < tries; i++) {
      const t = pk(rand, T)(rand); const good = t.s; const bad = [];
      const lowerStart = good[0].toLowerCase() + good.slice(1); if (lowerStart !== good) bad.push(lowerStart);
      let ln = good; for (const n of t.names) ln = ln.replace(n, n.toLowerCase()); if (t.names.length && ln !== good) bad.push(ln);
      if (t.names.length > 1) { const one = good.replace(t.names[t.names.length - 1], t.names[t.names.length - 1].toLowerCase()); if (one !== good) bad.push(one); }
      const w = t.day || t.month; if (w) bad.push(good.replace(w, w[0].toUpperCase() + w.slice(1)));
      bad.push(good.replace(/[.?]$/, t.q ? '.' : '?')); bad.push(good.replace(/[.?]$/, ''));
      const uniq = [...new Set(bad)].filter((b) => b !== good); if (uniq.length < 3) continue;
      const ds = shuf(uniq, rand).slice(0, 3);
      raw.push({ t: 'mc', q: 'Welke zin is goed geschreven?', a: good, o: shuf([good, ...ds], rand), d: w ? 3 : 2, g: 'hoofdletters', x: w ? 'Dagen en maanden schrijf je met een kleine letter.' : 'Een zin begint met een hoofdletter, namen ook, en aan het eind komt een punt of vraagteken.' });
    }
  } else if (kind === 'wordpairs') {
    const { pairs } = parsePaste(P.text || ''); const qs = pairsToQuestions(pairs, { types: ['mc', 'type', 'listen'], lang: P.lang, dir: P.dir, rand }); return dedupe(shuf(qs, rand), Math.max(count, qs.length), true).slice(0, MAX_Q);
  }
  return dedupe(raw.map(cleanQ), count);
}

/* ---------- kit maken van generator ---------- */
export function kitFromQs(name, emoji, qs, extra = {}) { return cleanKit({ name, emoji, qs, src: 'user', ...extra }).kit; }

/* ---------- sessie-planning (Leren / Talen) ---------- */
// items: [{ q, box }] al gesorteerd op prioriteit (te herhalen eerst). Geeft max n items: herhalen eerst, daarna nieuwe (max ~5).
export function planSession(items, n = 10, { maxNew = 5 } = {}) {
  const learned = items.filter((x) => x.box >= 1), fresh = items.filter((x) => !(x.box >= 1));
  let newN = Math.min(fresh.length, maxNew, n); const rest = n - newN; const learnedN = Math.min(learned.length, rest);
  if (learnedN < rest) newN = Math.min(fresh.length, newN + (rest - learnedN), n);
  return [...learned.slice(0, learnedN), ...fresh.slice(0, newN)];
}
export function givenText(q, given) {
  if (given === undefined || given === null || given === '') return '—';
  if (typeof given === 'boolean') return given ? 'Waar' : 'Onwaar';
  if (typeof given === 'number') return nl(given);
  if (Array.isArray(given)) return given.map((g) => (Array.isArray(g) ? g.join(' → ') : String(g))).join(' · ');
  return String(given);
}
export function typesIn(qs) { const c = {}; for (const q of qs) c[q.t] = (c[q.t] || 0) + 1; return c; }
