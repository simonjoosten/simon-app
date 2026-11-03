// Ronde 4 – Learn: 'Kit uit foto'. Pure logica (GEEN DOM): OCR-tekst opschonen, in paren splitsen, kit-vragen maken, foto-pixels opschonen.
// Getest met tools/test-r4-ocr.mjs. De UI staat in r4-ocr.js.
import { pairsToQuestions, mulberry, shuf, clip, pickDistractors, cleanKit, MAX_Q } from './study-logic.js?v=2';

export const OCR_LANGS = [['nld', 'Nederlands'], ['eng', 'Engels'], ['fra', 'Frans'], ['deu', 'Duits'], ['spa', 'Spaans']];
export const KIT_LANGS = [['nl', 'Nederlands'], ['en', 'Engels'], ['fr', 'Frans'], ['de', 'Duits'], ['es', 'Spaans']];
export const KINDS = [['woordjes', '🔤 Woordjes', 'Taal A → taal B'], ['begrippen', '📖 Begrippen', 'Term → uitleg'], ['rijtje', '🔢 Rijtje', 'Alleen een lijst']];
export const MAX_SIDE = 1800;

/* ---------- foto's: afmeting en pixels ---------- */
export function fitSize(w, h, max = MAX_SIDE) {
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  const m = Math.max(w, h); if (m <= max) return { w, h, scale: 1 };
  const s = max / m; return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)), scale: s };
}
// Grijswaarden + schaduw wegwerken (achtergrond per blok schatten) + contrast oprekken. Werkt op RGBA-data (Uint8ClampedArray), zonder ctx.filter.
export function enhanceGray(d, w, h) {
  const n = w * h; const g = new Uint8Array(n);
  for (let i = 0, p = 0; i < n; i++, p += 4) g[i] = (d[p] * 77 + d[p + 1] * 151 + d[p + 2] * 28) >> 8;
  const bs = Math.max(16, Math.round(Math.max(w, h) / 40)); const bw = Math.ceil(w / bs), bh = Math.ceil(h / bs);
  let bg = new Float32Array(bw * bh);
  for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) {
    const hist = new Uint32Array(256); let cnt = 0;
    const y1 = Math.min(h, (by + 1) * bs), x1 = Math.min(w, (bx + 1) * bs);
    for (let y = by * bs; y < y1; y++) for (let x = bx * bs; x < x1; x++) { hist[g[y * w + x]]++; cnt++; }
    let acc = 0, v = 255; const target = cnt * 0.9; for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc >= target) { v = i; break; } }
    bg[by * bw + bx] = Math.max(v, 40);
  }
  const sm = new Float32Array(bw * bh); // 3x3 gemiddelde tegen uitschieters
  for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) { let s = 0, c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = by + dy, xx = bx + dx; if (yy >= 0 && yy < bh && xx >= 0 && xx < bw) { s += bg[yy * bw + xx]; c++; } } sm[by * bw + bx] = s / c; }
  bg = sm;
  const out = new Uint8Array(n); const hist2 = new Uint32Array(256);
  for (let y = 0; y < h; y++) {
    const fy = Math.min(bh - 1, Math.max(0, (y + 0.5) / bs - 0.5)); const y0 = Math.floor(fy), y1 = Math.min(bh - 1, y0 + 1), ty = fy - y0;
    for (let x = 0; x < w; x++) {
      const fx = Math.min(bw - 1, Math.max(0, (x + 0.5) / bs - 0.5)); const x0 = Math.floor(fx), x1 = Math.min(bw - 1, x0 + 1), tx = fx - x0;
      const b = (bg[y0 * bw + x0] * (1 - tx) + bg[y0 * bw + x1] * tx) * (1 - ty) + (bg[y1 * bw + x0] * (1 - tx) + bg[y1 * bw + x1] * tx) * ty;
      const v = Math.min(255, Math.round((g[y * w + x] * 255) / b)); out[y * w + x] = v; hist2[v]++;
    }
  }
  let lo = 0, hi = 255, acc = 0; for (let i = 0; i < 256; i++) { acc += hist2[i]; if (acc >= n * 0.01) { lo = i; break; } }
  acc = 0; for (let i = 255; i >= 0; i--) { acc += hist2[i]; if (acc >= n * 0.3) { hi = i; break; } } // lichtste 30% = papier
  hi = Math.max(hi, lo + 30);
  for (let i = 0, p = 0; i < n; i++, p += 4) { const v = Math.max(0, Math.min(255, Math.round(((out[i] - lo) * 255) / (hi - lo)))); d[p] = d[p + 1] = d[p + 2] = v; d[p + 3] = 255; }
  return { lo, hi };
}

/* ---------- regels opschonen ---------- */
function normChars(s) {
  return String(s == null ? '' : s)
    .replace(/[  -  　]/g, ' ').replace(/[​-‍﻿­]/g, '')
    .replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl').replace(/ﬀ/g, 'ff')
    .replace(/[‘’`´]/g, "'").replace(/[“”„«»]/g, '"').replace(/[‒–—―−]/g, '–').replace(/…/g, '...')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
}
// herkenfouten in één woord: b00k -> book, hu1s -> hulS; 1O -> 10, l5 -> 15
function fixToken(tok) {
  const letters = (tok.match(/\p{L}/gu) || []).length; const digits = (tok.match(/\d/g) || []).length;
  if (digits && tok.length >= 2 && /^[\dOolI|.,]+$/.test(tok)) {
    tok = tok.replace(/[Oo]/g, '0').replace(/[lI|]/g, '1');
  } else if (digits && letters >= 2) {
    tok = tok.replace(/(\p{L})([01]+)(?=\p{L})/gu, (m, a, run) => a + run.replace(/0/g, 'o').replace(/1/g, 'l'));
    if (letters >= 3) tok = tok.replace(/(\p{L})([01])$/u, (m, a, r) => a + (r === '0' ? 'o' : 'l'));
  }
  return tok;
}
// een regel opschonen; geeft '' als er niets bruikbaars in zit
export function cleanLine(raw) {
  let s = normChars(raw).replace(/\r/g, '');
  s = s.replace(/^[\s•·●○◦▪■□►▶*°~_'"|!¦]+(?=[\p{L}\p{N}(])/u, '');      // opsommingstekens / losse streepjes voor het woord
  s = s.replace(/[\s|¦!_~]+$/u, '');                                      // rommel achteraan
  // '|' tegen letters aan is een l ("scho|" -> "schol"); met spaties eromheen is het een kolomstreep
  s = s.replace(/(\p{L})[|¦](?=\p{L})/gu, '$1l').replace(/(\p{L})[|¦](?=[\s.,;:)]|$)/gu, '$1l');
  s = s.replace(/(\s)[|¦](?=\p{L})/gu, '$1l');                             // " |earn" -> " learn"
  s = s.replace(/\s*[|¦]\s*/g, ' | ');
  s = s.replace(/\t+/g, '\t').replace(/ *\t */g, '\t').replace(/ {3,}/g, '  ');
  s = s.split(/(\s+)/).map((t) => (/\s/.test(t) ? t : fixToken(t))).join('');
  s = s.replace(/^\s+|\s+$/g, '');
  if (s.replace(/[\s|]/g, '').length < 2) return '';
  const letters = (s.match(/\p{L}/gu) || []).length; const nonSp = s.replace(/\s/g, '').length;
  if (!letters || letters / nonSp < 0.4) return '';
  return s;
}
// tekst -> schone regels (afgebroken woorden aan elkaar, ruis weg, nummering weg)
export function cleanLines(text) {
  const raw = normChars(text).split(/\n/).map((l) => l.replace(/\r/g, '').replace(/ +$/, ''));
  const joined = [];
  for (let i = 0; i < raw.length; i++) {
    let l = raw[i];
    while (/\p{L}-$/u.test(l) && i + 1 < raw.length && /^\s*\p{Ll}/u.test(raw[i + 1])) { l = l.slice(0, -1) + raw[i + 1].replace(/^\s+/, ''); i++; }
    joined.push(l);
  }
  let lines = joined.map(cleanLine).filter(Boolean);
  const numRe = /^\(?(?:\d{1,3}|[lI|])[.)]\s+/; const hit = lines.filter((l) => numRe.test(l)).length;
  if (hit >= Math.max(2, lines.length * 0.6)) lines = lines.map((l) => l.replace(numRe, ''));
  else { const re2 = /^\d{1,3}\s+(?=\p{L})/u; const h2 = lines.filter((l) => re2.test(l)).length; if (h2 >= Math.max(3, lines.length * 0.7)) lines = lines.map((l) => l.replace(re2, '')); }
  return lines;
}
const trimCell = (s) => String(s == null ? '' : s).replace(/^[\s,;:.\-–|]+/, '').replace(/[\s,;:\-–|]+$/, '').replace(/\s+/g, ' ').trim();

/* ---------- splitsen in paren ---------- */
const SEPS = [
  ['tab', /\t+/],
  ['eq', /\s*=\s*/],
  ['arrow', /\s*(?:→|⇒|-->|->|=>)\s*/],
  ['dash', /\s+–\s+|\s+-\s+/],
  ['pipe', /\s+\|\s+/],
  ['colon', /\s*:\s+/],
  ['semi', /\s*;\s*/],
  ['gap', /\s{2,}/],
];
export const SEP_NAMES = { tab: 'tab', eq: 'is-gelijk-teken', arrow: 'pijltje', dash: 'streepje', pipe: 'lijntje', colon: 'dubbele punt', semi: 'puntkomma', gap: 'ruimte tussen kolommen', none: 'geen scheiding' };
const sepRe = (name) => SEPS.find((x) => x[0] === name)[1];
const hasSep = (line, name) => { const m = line.match(sepRe(name)); if (!m) return false; const l = line.slice(0, m.index).trim(), r = line.slice(m.index + m[0].length).trim(); return !!(l && r && /\p{L}/u.test(l) && /[\p{L}\p{N}]/u.test(r)); };
function splitOnce(line, name) {
  const m = line.match(sepRe(name)); if (!m) return null;
  const l = trimCell(line.slice(0, m.index)), r = trimCell(line.slice(m.index + m[0].length));
  if (!l || !r) return null;
  if (name === 'colon' && (l.split(' ').length > 6 || l.length > 45)) return null;
  return { q: l, a: r };
}
// spaties rond een scheidingsteken vastzetten zodat '  =  ' niet voor een kolomgat wordt aangezien
const pinSeps = (line) => line.replace(/\s+([=→⇒|–:])\s+/g, ' $1 ').replace(/\s+(->|=>|-->)\s+/g, ' $1 ');
// één regel -> lijst paren (meerdere bij twee-kolommen-uitvoer), of null
function splitLine(line, dom) {
  const L = pinSeps(line);
  const tryName = (name) => {
    if (name === 'tab' || name === 'gap') {
      const cells = L.split(name === 'tab' ? /\t+/ : /\s{2,}/).map(trimCell).filter(Boolean);
      if (cells.length < 2) return null;
      if (cells.length === 2) return [{ q: cells[0], a: cells[1] }];
      if (cells.length === 3) return [{ q: cells[0], a: cells[1], x: cells[2] }];
      const out = []; for (let i = 0; i + 1 < cells.length; i += 2) out.push({ q: cells[i], a: cells[i + 1] });
      if (cells.length % 2) out[out.length - 1].a += ' ' + cells[cells.length - 1];
      return out;
    }
    const cells = L.split(/\s{2,}|\t+/).filter((c) => c.trim());
    if (cells.length >= 2 && cells.every((c) => hasSep(c, name))) { const ps = cells.map((c) => splitOnce(c, name)); if (ps.every(Boolean)) return ps; }
    const p = splitOnce(L, name); return p ? [p] : null;
  };
  if (dom && dom !== 'none') { const r = tryName(dom); if (r) return r; }
  for (const [name] of SEPS) { if (name === 'gap' || name === dom) continue; if (name === 'tab' && !L.includes('\t')) continue; const r = tryName(name); if (r) return r; }
  return null;
}
export function detectSep(lines) {
  let best = 'none', bestN = 0;
  for (const [name] of SEPS) { const n = lines.filter((l) => hasSep(pinSeps(l), name)).length; if (n > bestN) { best = name; bestN = n; } }
  const need = Math.max(1, Math.ceil(lines.length * 0.3));
  return bestN >= need ? { sep: best, count: bestN } : { sep: 'none', count: 0 };
}
export const MODES = [['auto', 'Automatisch'], ['single', 'Elke regel los'], ['alternate', 'Om-en-om regels'], ['halves', 'Eerste helft = tweede helft']];

// text -> { rows:[{q,a}], sep, sepName, mode, suggest, lines }
export function parseOcr(text, o = {}) {
  const lines = Array.isArray(text) ? text.map(cleanLine).filter(Boolean) : cleanLines(text);
  const mode = o.mode || 'auto';
  const det = detectSep(lines); const rows = [];
  const base = { lines, sep: det.sep, sepName: SEP_NAMES[det.sep], mode };
  if (mode === 'single') return { ...base, rows: lines.map((q) => ({ q: trimCell(q), a: '' })).filter((r) => r.q), sep: 'none', sepName: SEP_NAMES.none, suggest: null };
  if (mode === 'alternate') { for (let i = 0; i < lines.length; i += 2) rows.push({ q: trimCell(lines[i]), a: trimCell(lines[i + 1] || '') }); return { ...base, rows, sep: 'none', sepName: 'om-en-om regels', suggest: null }; }
  if (mode === 'halves') { const n = Math.floor(lines.length / 2); for (let i = 0; i < n; i++) rows.push({ q: trimCell(lines[i]), a: trimCell(lines[n + i]) }); if (lines.length % 2) rows.push({ q: trimCell(lines[lines.length - 1]), a: '' }); return { ...base, rows, sep: 'none', sepName: 'twee kolommen onder elkaar', suggest: null }; }
  if (det.sep === 'none') {
    const even = lines.length >= 4 && lines.length % 2 === 0;
    return { ...base, rows: lines.map((q) => ({ q: trimCell(q), a: '' })).filter((r) => r.q), suggest: even ? 'alternate' : null };
  }
  for (const line of lines) {
    const ps = splitLine(line, det.sep);
    if (ps) { for (const p of ps) if (p.q && p.a) rows.push(p); continue; }
    const t = trimCell(line); if (!t) continue;
    const prev = rows[rows.length - 1];
    if (prev && prev.a && /^\p{Ll}/u.test(t)) prev.a += ' ' + t;      // regel loopt door
    else rows.push({ q: t, a: '' });
  }
  return { ...base, rows, suggest: null };
}

// meerdere foto's/blokken: elk blok krijgt zijn eigen scheidingsteken (foto 1 met streepjes, foto 2 met kolommen)
export function parseBlocks(blocks, o = {}) {
  const parts = (blocks || []).map((b) => parseOcr(b, o)).filter((r) => r.lines.length);
  if (!parts.length) return parseOcr('', o);
  if (parts.length === 1) return parts[0];
  const names = [...new Set(parts.map((r) => r.sepName))];
  return { lines: [].concat(...parts.map((r) => r.lines)), rows: [].concat(...parts.map((r) => r.rows)), sep: parts.find((r) => r.sep !== 'none') ? parts.find((r) => r.sep !== 'none').sep : 'none', sepName: names.join(' / '), mode: o.mode || 'auto', suggest: parts.every((r) => r.suggest) ? 'alternate' : null };
}

/* ---------- rijen bewerken ---------- */
const key = (r) => (r.q + '\u0001' + r.a).toLowerCase().replace(/[\s.,;:!?]+/g, ' ').trim();
export function dedupeRows(rows) {
  const seen = new Set(); const out = []; let removed = 0;
  for (const r of rows) { const k = key(r); if (!k.replace('\u0001', '').trim() || seen.has(k)) { removed++; continue; } seen.add(k); out.push(r); }
  return { rows: out, removed };
}
export const swapRow = (r) => ({ ...r, q: r.a, a: r.q });
export const swapAll = (rows) => rows.map(swapRow);
export function mergeRows(rows, i) { // rij i samenvoegen met rij i+1
  if (i < 0 || i + 1 >= rows.length) return rows;
  const a = rows[i], b = rows[i + 1]; const j = (x, y) => [x, y].filter(Boolean).join(' ');
  return [...rows.slice(0, i), { q: j(a.q, b.q), a: j(a.a, b.a) }, ...rows.slice(i + 2)];
}
export function removeRow(rows, i) { return rows.filter((_, k) => k !== i); }
export const rowsToText = (rows) => rows.map((r) => (r.a ? `${r.q}\t${r.a}` : r.q)).join('\n');
export function suggestName(rows, kind) { const r = rows.find((x) => x.q) || { q: '' }; const w = r.q.split(/\s+/).slice(0, 3).join(' '); return clip(w ? `${kind === 'woordjes' ? 'Woordjes' : kind === 'begrippen' ? 'Begrippen' : 'Rijtje'}: ${w}` : 'Kit uit foto', 60); }

/* ---------- vragen maken ---------- */
const altSplit = (r) => { const parts = String(r.a).split(/\s+\/\s+/).map((s) => s.trim()).filter(Boolean); const o = parts.length > 1 ? { q: r.q, a: parts[0], alt: parts.slice(1, 6) } : { q: r.q, a: r.a }; if (r.x) o.x = r.x; return o; };
// kind: woordjes | begrippen | rijtje. rows: [{q,a}]. o: { langA, langB, both, seed }. -> { qs, lang, used, dropped }
export function buildQuestions(kind, rows, o = {}) {
  const rand = mulberry(o.seed != null ? o.seed : 11);
  const clean = rows.map((r) => ({ q: trimCell(r.q), a: trimCell(r.a), x: r.x })).filter((r) => r.q);
  if (kind === 'rijtje') return buildRijtje(clean.map((r) => [r.q, r.a].filter(Boolean).join(' ')), rand);
  const pairs = clean.filter((r) => r.a); const dropped = clean.length - pairs.length;
  if (kind === 'begrippen') {
    const P = pairs.map(altSplit);
    const fwd = pairsToQuestions(P, { types: ['mc', 'tf', 'match'], dir: 'fwd', rand });
    for (const q of fwd) if (q.t === 'mc') q.q = clip(`Wat is „${q.q}”?`, 400);
    const rev = pairsToQuestions(P, { types: ['mc'], dir: 'rev', rand }); for (const q of rev) q.q = clip(`Welk begrip hoort hierbij: ${q.q}`, 400);
    return { qs: fwd.concat(rev).slice(0, MAX_Q), lang: undefined, used: pairs.length, dropped };
  }
  // woordjes: q = Nederlands (of linkerkolom), a = vreemde taal, kit-taal = vreemde taal
  const A = o.langA || 'nl', B = o.langB || 'en'; let P = pairs; let lang;
  if (A === 'nl' && B !== 'nl') lang = B; else if (B === 'nl' && A !== 'nl') { P = pairs.map((r) => ({ q: r.a, a: r.q, x: r.x })); lang = A; } else lang = B !== 'nl' ? B : undefined;
  P = P.map(altSplit);
  const types = ['mc', 'type'].concat(lang ? ['listen'] : []);
  const qs = pairsToQuestions(P, { types, dir: o.both ? 'both' : 'fwd', lang, rand });
  return { qs: qs.slice(0, MAX_Q), lang, used: pairs.length, dropped };
}
function buildRijtje(items, rand) {
  const seen = new Set(); const it = items.filter((s) => { const k = s.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  const qs = [];
  for (let i = 0; i + 1 < it.length; i++) {
    const a = it[i + 1]; const ds = pickDistractors(a, it.filter((x) => x !== a && x !== it[i]), 3, rand);
    const q = clip(`Wat komt er na „${it[i]}” in het rijtje?`, 400);
    if (it.length >= 4 && ds.length >= 2) qs.push({ t: 'mc', q, a, o: shuf([a, ...ds], rand) }); else qs.push({ t: 'type', q, a });
  }
  if (it.length >= 4) { const ds = pickDistractors(it[0], it.slice(1), 3, rand); if (ds.length >= 2) qs.push({ t: 'mc', q: 'Wat staat er als eerste in het rijtje?', a: it[0], o: shuf([it[0], ...ds], rand) }); }
  for (let i = 0; i < it.length; i += 5) { const grp = it.slice(i, i + 5); if (grp.length >= 3) qs.push({ t: 'order', q: 'Zet het rijtje in de goede volgorde', a: grp }); }
  return { qs: qs.slice(0, MAX_Q), lang: undefined, used: it.length, dropped: 0 };
}
// klaar om op te slaan (zelfde datamodel als de handmatige maker)
export function makeKit({ name, emoji, kind, rows, langA, langB, both, seed }) {
  const r = buildQuestions(kind, rows, { langA, langB, both, seed });
  const { kit } = cleanKit({ name: name || suggestName(rows, kind), emoji: emoji || '📷', lang: r.lang, qs: r.qs, src: 'user', desc: 'Gemaakt van een foto' });
  return { kit, ...r };
}
