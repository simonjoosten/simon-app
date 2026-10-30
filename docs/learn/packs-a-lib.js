// Gedeelde bouwstenen voor de taal- en spellingpacks (PACKS-A). Puur, deterministisch, geen DOM, geen core-afhankelijkheid.
// Elk pack-bestand: import { vocab } from '../packs-a-lib.js?v=1'; export default vocab({...});
// Regelformaten: velden gescheiden door '|', lijsten binnen een veld door ';'.

export const LANG_NAME = { en: 'Engels', de: 'Duits', fr: 'Frans', es: 'Spaans', nl: 'Nederlands' };
export const LANG_ADJ = { en: 'Engelse', de: 'Duitse', fr: 'Franse', es: 'Spaanse', nl: 'Nederlandse' };

/* ---------- deterministische hulpjes ---------- */
function hash(s) { let x = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
function rnd(seed) {
  let a = hash(seed);
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function shuf(arr, seed) { const r = rnd(seed); const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const norm = (s) => String(s).trim().toLowerCase();
export function uniq(list) { const seen = new Set(); return list.filter((x) => { const k = norm(x); if (seen.has(k)) return false; seen.add(k); return true; }); }
function lines(src) { return (Array.isArray(src) ? src : String(src).split('\n')).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')); }
const list = (s) => (s ? String(s).split(';').map((x) => x.trim()).filter(Boolean) : []);
const ART = /^(?:(?:the|an?|to|der|die|das|ein|eine|le|la|les|un|une|el|los|las|una)\s+|l')/i;
export const stripArt = (s) => String(s).replace(ART, '');
const artOf = (s) => { const m = String(s).match(/^(\S+)[\s']/); return m ? m[1].toLowerCase() : ''; };
const clean = (s) => String(s).replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();

/* kies n foute opties uit pool (willekeurig maar vast, met voorkeur via sim) */
export function wrongFrom(pool, n, seed, avoid = [], sim = null) {
  const av = new Set(avoid.map(norm)); const r = rnd(seed);
  const c = uniq(pool).filter((x) => !av.has(norm(x))).map((x) => ({ x, s: (sim ? sim(x) : 0) + r() * 1.6 }));
  c.sort((a, b) => b.s - a.s);
  return c.slice(0, n).map((o) => o.x);
}

/* ---------- vraagbouwers (ook handig in pack-bestanden) ---------- */
export function MC(q, a, wrongs, extra = {}) {
  const w = uniq([a, ...wrongs]).slice(1);
  return { t: 'mc', q, a, o: shuf([a, ...w], q + '|' + a), ...extra };
}
export function TF(q, a, extra = {}) { return { t: 'tf', q, a: !!a, ...extra }; }
export function TYPE(q, a, alt, extra = {}) { const o = { t: 'type', q, a, ...extra }; if (alt && alt.length) o.alt = alt; return o; }
export function FILL(q, a, wrongs, extra = {}) {
  if (wrongs && wrongs.length) { const w = uniq([a, ...wrongs]).slice(1); return { t: 'fill', q, a, o: shuf([a, ...w], q + '|' + a), ...extra }; }
  return { t: 'fill', q, a, ...extra };
}
export function MULTI(q, o, a, extra = {}) { return { t: 'multi', q, o: shuf(o, q + '|' + a.join(',')), a, ...extra }; }
export function MATCH(q, pairs, extra = {}) { return { t: 'match', q, a: pairs, ...extra }; }
export function ORDER(q, items, extra = {}) { return { t: 'order', q, a: items, ...extra }; }
const clip = (o) => { for (const k of Object.keys(o)) if (o[k] === undefined || o[k] === '') delete o[k]; return o; };

/* maakt groepjes van n paren met unieke linker- en rechterkant */
function matchGroups(pairs, size, seed) {
  const sh = shuf(pairs, seed); const out = []; let rest = sh;
  while (rest.length >= 3) {
    const grp = []; const L = new Set(); const R = new Set(); const left = [];
    for (const p of rest) {
      if (grp.length < size && !L.has(norm(p[0])) && !R.has(norm(p[1]))) { grp.push(p); L.add(norm(p[0])); R.add(norm(p[1])); } else left.push(p);
    }
    if (grp.length < 3) break;
    out.push(grp); rest = left;
  }
  return out;
}

/* ---------- pack-omhulsel ---------- */
export function pack(c, gen) {
  return {
    id: c.id, name: c.name, emoji: c.emoji, group: c.group || 'Talen', desc: c.desc, lang: c.lang,
    build() {
      let qs = (typeof gen === 'function' ? gen() : gen).map(clip);
      const seen = new Set(); qs = qs.filter((q) => { const k = q.t + '|' + q.q + '|' + JSON.stringify(q.a); if (seen.has(k)) return false; seen.add(k); return true; });
      if (qs.length > 400) qs = qs.slice(0, 400);
      return { id: c.id, name: c.name, emoji: c.emoji, desc: c.desc, lang: c.lang, group: c.group || 'Talen', qs };
    },
  };
}

/* ---------- woordjes: nl|doeltaal|emoji|alt1;alt2 ---------- */
export function vocab(c) {
  const L = c.lang, lname = LANG_NAME[L], adj = LANG_ADJ[L];
  const g = c.g || c.name;
  return pack(c, () => {
    const W = lines(c.words).map((l) => { const p = l.split('|'); const tl = p[1].trim(); const alts = uniq([...list(p[3]), stripArt(tl)].filter((x) => norm(x) !== norm(tl))); return { nl: p[0].trim(), tl, e: (p[2] || '').trim(), alts }; });
    const tls = W.map((w) => w.tl), nls = W.map((w) => w.nl);
    const qs = [];
    W.forEach((w, i) => {
      const core = stripArt(w.tl).length; const d = core <= 4 ? 1 : (core <= 8 ? 2 : 3);
      const base = { lang: L, g, x: `${w.tl} = ${w.nl}` };
      const sim = (x) => (artOf(x) === artOf(w.tl) ? 1 : 0) + (x[0] === w.tl[0] ? 0.4 : 0);
      qs.push(MC(`Wat is het ${lname} voor "${w.nl}"?`, w.tl, wrongFrom(tls, 3, c.id + i + 'a', [w.tl, ...w.alts], sim), { ...base, e: w.e, d }));
      qs.push(MC(`Wat betekent "${w.tl}"?`, w.nl, wrongFrom(nls, 3, c.id + i + 'b', [w.nl]), { ...base, say: w.tl, d: Math.max(1, d - 1) }));
      qs.push(TYPE(`Typ het ${lname}: "${w.nl}"`, w.tl, w.alts, { ...base, e: w.e, d: Math.min(3, d + 1) }));
      if (i % 2 === 0) qs.push(TF(`"${w.tl}" betekent "${w.nl}".`, true, { ...base, say: w.tl, d: 1 }));
      else { const wr = wrongFrom(nls, 1, c.id + i + 'f', [w.nl])[0]; qs.push(TF(`"${w.tl}" betekent "${wr}".`, false, { ...base, say: w.tl, d: 1 })); }
      qs.push(TYPE('Luister en typ wat je hoort.', w.tl, w.alts, { ...base, say: w.tl, listen: true, d: Math.min(3, d + 1) }));
    });
    matchGroups(W.map((w) => [w.tl, w.nl]), 4, c.id + 'm').forEach((grp, i) => {
      qs.push(MATCH(`Verbind de ${adj} woorden met het Nederlands.`, grp, { lang: L, g, d: 2 }));
      void i;
    });
    return qs.concat(c.more || []);
  });
}

/* ---------- zinnetjes: zin met ___|antwoord|fout1;fout2|vertaling ---------- */
export function sents(c) {
  const L = c.lang || 'en';
  const g = c.g || c.name;
  return pack(c, () => {
    const S = lines(c.items).map((l) => { const p = l.split('|'); return { s: p[0].trim(), a: p[1].trim(), w: list(p[2]), nl: (p[3] || '').trim() }; });
    const qs = [];
    S.forEach((it, i) => {
      const full = it.s.replace('___', it.a);
      const bad = it.s.replace('___', it.w[0]);
      const base = { lang: L, g, say: full, x: `${full}${it.nl ? ' = ' + it.nl : ''}` };
      const hint = it.nl ? ' (' + it.nl + ')' : '';
      qs.push(FILL(it.s + hint, it.a, it.w, { ...base, d: 1 }));
      qs.push(FILL(`${it.s}${it.nl ? ' (' + it.nl + ')' : ''}`, it.a, null, { ...base, strict: true, d: 2 }));
      const tq = c.tfNl && it.nl ? `Dit betekent: "${it.nl}". Klopt deze zin?` : 'Klopt deze zin?';
      qs.push(TF(`${tq} "${full}"`, true, { ...base, d: 1 }));
      qs.push(TF(`${tq} "${bad}"`, false, { ...base, say: bad, d: 2 }));
      const words = full.split(' ');
      if (words.length >= 3 && words.length <= 6 && new Set(words.map(norm)).size === words.length) qs.push(ORDER(`Zet de woorden in de goede volgorde${it.nl ? ' (' + it.nl + ')' : ''}.`, words, { lang: L, g, say: full, d: 2 }));
      if (it.nl) qs.push(MC(`Wat betekent: "${full}"?`, it.nl, wrongFrom(S.map((z) => z.nl).filter(Boolean), 3, c.id + 'tr' + i, [it.nl]), { lang: 'nl', say: full, g, x: base.x, d: 2 }));
    });
    return qs.concat(c.more || []);
  });
}

/* ---------- onregelmatige werkwoorden: inf|verleden|deelwoord|nl  (alternatieven met ;) ---------- */
export function irreg(c) {
  const g = c.g || c.name;
  return pack(c, () => {
    const V = lines(c.verbs).map((l) => { const p = l.split('|'); const a = list(p[1]), b = list(p[2]); return { inf: p[0].trim(), past: a[0], pa: a.slice(1), part: b[0], pta: b.slice(1), nl: p[3].trim() }; });
    const pasts = V.map((v) => v.past), parts = V.map((v) => v.part);
    const reg = (inf) => (inf.endsWith('e') ? inf + 'd' : inf + 'ed');
    const qs = [];
    V.forEach((v, i) => {
      const base = { lang: 'en', g, x: `${v.inf} - ${v.past} - ${v.part}${v.pa.length || v.pta.length ? ' (ook: ' + [...v.pa, ...v.pta].join(', ') + ')' : ''}` };
      const same = v.inf === v.past && v.past === v.part;
      const wp = uniq([reg(v.inf), ...wrongFrom([...pasts, ...parts], 3, c.id + 'p' + i, [v.past, ...v.pa, v.inf])]).filter((x) => x !== v.past && !v.pa.includes(x)).slice(0, 3);
      const wq = uniq([reg(v.inf), ...wrongFrom([...pasts, ...parts], 3, c.id + 'q' + i, [v.part, ...v.pta, v.inf])]).filter((x) => x !== v.part && !v.pta.includes(x)).slice(0, 3);
      qs.push(MC(`Wat is de verleden tijd van "${v.inf}" (${v.nl})?`, v.past, wp, { ...base, say: v.inf, d: 2 }));
      qs.push(MC(`Wat is het voltooid deelwoord van "${v.inf}" (${v.nl})?`, v.part, wq, { ...base, say: v.inf, d: 2 }));
      qs.push(TYPE(`Typ de verleden tijd van "${v.inf}" (${v.nl}).`, v.past, v.pa, { ...base, strict: true, d: 3 }));
      qs.push(TYPE(`Typ het voltooid deelwoord van "${v.inf}" (${v.nl}).`, v.part, v.pta, { ...base, strict: true, d: 3 }));
      qs.push(TF(`"${v.inf} - ${v.past} - ${v.part}" is een goed rijtje.`, true, { ...base, d: 1 }));
      const other = V[(i + 7 + (i % 5)) % V.length];
      const wrongPart = other.part !== v.part ? other.part : reg(v.inf);
      qs.push(TF(`"${v.inf} - ${v.past} - ${wrongPart}" is een goed rijtje.`, false, { ...base, d: 2 }));
      if (!same && new Set([v.inf, v.past, v.part]).size === 3) qs.push(ORDER(`Zet het rijtje van "${v.inf}" (${v.nl}) in volgorde: infinitief, verleden tijd, voltooid deelwoord.`, [v.inf, v.past, v.part], { lang: 'en', g, d: 2 }));
    });
    matchGroups(V.map((v) => [v.inf, v.past]), 4, c.id + 'm1').forEach((grp) => qs.push(MATCH('Verbind het werkwoord met de verleden tijd.', grp, { lang: 'en', g, d: 2 })));
    matchGroups(V.map((v) => [v.inf, v.part]), 4, c.id + 'm2').forEach((grp) => qs.push(MATCH('Verbind het werkwoord met het voltooid deelwoord.', grp, { lang: 'en', g, d: 3 })));
    return qs.concat(c.more || []);
  });
}

/* ---------- keuzevragen: stem|goed|fout1;fout2|uitleg ----------
   stem met ___ => invulvraag met keuzes (en optioneel typen); zonder ___ => meerkeuze. */
export function choice(c) {
  const g = c.g || c.name; const d0 = c.d || 2;
  return pack(c, () => {
    const I = lines(c.items).map((l) => { const p = l.split('|'); return { stem: p[0].trim(), a: p[1].trim(), w: list(p[2]), x: (p[3] || '').trim() }; });
    const qs = [];
    I.forEach((it) => {
      const gap = it.stem.includes('___');
      const text = clean(gap ? it.stem.replace('___', it.a) : it.a);
      const bad = clean(gap ? it.stem.replace('___', it.w[0]) : it.w[0]);
      const base = { g, x: it.x, lang: 'nl' };
      if (gap) {
        qs.push(FILL(it.stem, it.a, it.w, { ...base, d: d0 }));
        if (c.typed) qs.push(FILL(it.stem, it.a, null, { ...base, strict: true, d: Math.min(3, d0 + 1) }));
      } else qs.push(MC(it.stem, it.a, it.w, { ...base, d: d0 }));
      const tfq = c.tfq || 'Is dit goed?';
      qs.push(TF(`${tfq} "${text}"`, true, { ...base, d: 1 }));
      qs.push(TF(`${tfq} "${bad}"`, false, { ...base, d: Math.min(3, d0) }));
      if (c.listen && gap) qs.push(TYPE('Luister en schrijf de zin op.', text, null, { ...base, say: text, listen: true, strict: true, d: 3 }));
      else if (c.listen) qs.push(TYPE('Luister en schrijf het woord op.', it.a, null, { ...base, say: it.a, listen: true, strict: true, d: 3 }));
    });
    return qs.concat(c.more || []);
  });
}

/* ---------- gaatjeswoorden: tr[ei]n|ij  (voor/na de haken = woord, in haken = goed, na | = fout(en), ; gescheiden) ---------- */
export function gapWords(c) {
  const g = c.g || c.name;
  return pack(c, () => {
    const I = lines(c.items).map((l) => { const [w, wr] = l.split('|'); const m = w.match(/^(.*)\[(.+)\](.*)$/); return { pre: m[1], a: m[2], post: m[3], wr: list(wr), word: m[1] + m[2] + m[3] }; });
    const qs = [];
    I.forEach((it) => {
      const wrongWord = it.pre + it.wr[0] + it.post;
      const base = { g, lang: 'nl', x: `Je schrijft ${it.word} met ${it.a}.` };
      qs.push(FILL(`Welke letters ontbreken? ${it.pre}___${it.post}`, it.a, it.wr, { ...base, say: it.word, d: 1 }));
      qs.push(MC('Hoe schrijf je dit woord goed?', it.word, [wrongWord, ...it.wr.slice(1).map((x) => it.pre + x + it.post)], { ...base, say: it.word, d: 2 }));
      qs.push(TF(`Je schrijft "${it.word}" met ${it.a}.`, true, { ...base, say: it.word, d: 1 }));
      qs.push(TF(`Je schrijft "${it.word}" met ${it.wr[0]}.`, false, { ...base, say: it.word, d: 1 }));
      qs.push(TYPE('Luister en schrijf het woord op.', it.word, null, { ...base, say: it.word, listen: true, strict: true, d: 3 }));
    });
    // multi: welke woorden schrijf je met X?
    const kinds = uniq(I.map((i) => i.a));
    const r = rnd(c.id + 'multi'); const used = new Set();
    for (let n = 0; n < 14; n++) {
      const A = kinds[n % kinds.length];
      const others = kinds.filter((k) => k !== A);
      const pa = I.filter((i) => i.a === A && !others.some((k) => i.word.includes(k) && k !== A));
      const pb = I.filter((i) => i.a !== A && !i.word.includes(A));
      if (pa.length < 2 || pb.length < 2) continue;
      const pick = (arr) => arr[Math.floor(r() * arr.length)];
      const a1 = pick(pa); let a2 = pick(pa); let t = 0; while (a2 === a1 && t++ < 20) a2 = pick(pa);
      const b1 = pick(pb); let b2 = pick(pb); t = 0; while (b2 === b1 && t++ < 20) b2 = pick(pb);
      const key = [a1.word, a2.word, b1.word, b2.word].sort().join(',') + A;
      if (a1 === a2 || b1 === b2 || used.has(key)) continue; used.add(key);
      qs.push(MULTI(`Welke woorden schrijf je met "${A}"?`, [a1.word, a2.word, b1.word, b2.word], [a1.word, a2.word], { g, lang: 'nl', d: 2, x: `Met ${A}: ${a1.word}, ${a2.word}.` }));
    }
    return qs.concat(c.more || []);
  });
}

/* ---------- de/het: woord|de|emoji|uitleg ---------- */
export function deHet(c) {
  const g = c.g || c.name;
  return pack(c, () => {
    const I = lines(c.items).map((l) => { const p = l.split('|'); return { w: p[0].trim(), art: p[1].trim(), e: (p[2] || '').trim(), x: (p[3] || '').trim() }; });
    const qs = [];
    I.forEach((it) => {
      const other = it.art === 'de' ? 'het' : 'de';
      const x = it.x || `${it.art} ${it.w}`;
      const base = { g, lang: 'nl', x, say: undefined };
      qs.push(MC(`Welk lidwoord hoort bij "${it.w}"?`, it.art, [other], { ...base, e: it.e, d: 1 }));
      qs.push(FILL(`Dat is ___ ${it.w}.`, it.art, [other], { ...base, e: it.e, d: 2 }));
      qs.push(TF(`Je zegt "${it.art} ${it.w}".`, true, { ...base, d: 1 }));
      qs.push(TF(`Je zegt "${other} ${it.w}".`, false, { ...base, d: 1 }));
      qs.push(FILL(`Typ het lidwoord: ___ ${it.w}`, it.art, null, { ...base, strict: true, d: 2 }));
    });
    const r = rnd(c.id + 'dh');
    ['het', 'de'].forEach((A, ai) => {
      const pa = I.filter((i) => i.art === A), pb = I.filter((i) => i.art !== A);
      const sa = shuf(pa, c.id + A), sb = shuf(pb, c.id + 'x' + A);
      for (let n = 0; n < 9; n++) {
        const a = sa.slice(n * 2, n * 2 + 2).map((i) => i.w), b = sb.slice(n * 3, n * 3 + 3).map((i) => i.w);
        if (a.length < 2 || b.length < 3) break;
        qs.push(MULTI(`Welke woorden zijn ${A}-woorden?`, [...a, ...b], a, { g, lang: 'nl', d: 2, x: `${A}: ${a.join(', ')}` }));
      }
      void r; void ai;
    });
    return qs.concat(c.more || []);
  });
}

/* ---------- verkleinwoorden / meervouden: basis|goed|fout1;fout2|uitleg ---------- */
export function inflect(c) {
  const dim = c.kind === 'verkleinwoord';
  const g = c.g || c.name;
  const auto = (b) => (dim ? [b + 'je', b + 'tje', b + 'etje', b + 'pje', b + 'kje'] : [b + 's', b + 'en', b + "'s", b + 'n', b + 'ens']);
  return pack(c, () => {
    const I = lines(c.items).map((l) => { const p = l.split('|'); const b = p[0].trim(), a = p[1].trim(); let w = list(p[2]); if (w.length < 3) w = uniq([...w, ...auto(b)]).filter((x) => norm(x) !== norm(a)).slice(0, 3); return { b, a, w, x: (p[3] || '').trim() }; });
    const qs = [];
    I.forEach((it) => {
      const base = { g, lang: 'nl', x: it.x || `${it.b} > ${it.a}` };
      qs.push(MC(`Wat is het ${c.kind} van "${it.b}"?`, it.a, it.w, { ...base, d: 2 }));
      qs.push(TYPE(`Typ het ${c.kind} van "${it.b}".`, it.a, null, { ...base, strict: true, d: 3 }));
      qs.push(TF(`Het ${c.kind} van "${it.b}" is "${it.a}".`, true, { ...base, d: 1 }));
      qs.push(TF(`Het ${c.kind} van "${it.b}" is "${it.w[0]}".`, false, { ...base, d: 2 }));
      qs.push(TYPE('Luister en schrijf het woord op.', it.a, null, { ...base, say: it.a, listen: true, strict: true, d: 3 }));
      if (!dim) qs.push(FILL(`Eén ${it.b}, twee ___.`, it.a, null, { ...base, strict: true, d: 2 }));
      else qs.push(FILL(`${it.b} > ___ (verkleinwoord)`, it.a, it.w, { ...base, d: 2 }));
    });
    return qs.concat(c.more || []);
  });
}

/* ---------- tegenstellingen / synoniemen: a|b|alt(;)  ---------- */
export function wordPairs(c) {
  const opp = c.kind === 'tegen';
  const g = c.g || c.name;
  return pack(c, () => {
    const P = lines(c.pairs).map((l) => { const p = l.split('|'); return { a: p[0].trim(), b: p[1].trim(), alt: list(p[2]) }; });
    const As = P.map((p) => p.a), Bs = P.map((p) => p.b);
    const qs = [];
    const ask = (w) => (opp ? `Wat is het tegenovergestelde van "${w}"?` : `Welk woord betekent ongeveer hetzelfde als "${w}"?`);
    P.forEach((p, i) => {
      const base = { g, lang: 'nl', x: opp ? `${p.a} <-> ${p.b}` : `${p.a} = ${p.b}` };
      qs.push(MC(ask(p.a), p.b, wrongFrom([...Bs, ...As], 3, c.id + 'a' + i, [p.a, p.b, ...p.alt]), { ...base, d: 2 }));
      qs.push(MC(ask(p.b), p.a, wrongFrom([...As, ...Bs], 3, c.id + 'b' + i, [p.a, p.b, ...p.alt]), { ...base, d: 2 }));
      if (opp) {
        qs.push(TYPE(`Typ het tegenovergestelde van "${p.a}".`, p.b, p.alt, { ...base, d: 3 }));
        qs.push(TYPE(`Typ het tegenovergestelde van "${p.b}".`, p.a, null, { ...base, d: 3 }));
      }
      qs.push(TF(opp ? `"${p.a}" en "${p.b}" zijn tegenovergesteld.` : `"${p.a}" en "${p.b}" betekenen ongeveer hetzelfde.`, true, { ...base, d: 1 }));
      const wr = wrongFrom(Bs, 1, c.id + 'f' + i, [p.a, p.b, ...p.alt])[0];
      qs.push(TF(opp ? `"${p.a}" en "${wr}" zijn tegenovergesteld.` : `"${p.a}" en "${wr}" betekenen ongeveer hetzelfde.`, false, { ...base, d: 2 }));
    });
    matchGroups(P.map((p) => [p.a, p.b]), 4, c.id + 'm').forEach((grp) => qs.push(MATCH(opp ? 'Verbind de woorden die het tegenovergestelde zijn.' : 'Verbind de woorden die hetzelfde betekenen.', grp, { g, lang: 'nl', d: 2 })));
    return qs.concat(c.more || []);
  });
}

/* ---------- rijmen: groepen "kat,rat,mat" per regel ---------- */
export function rhymes(c) {
  const g = c.g || c.name;
  return pack(c, () => {
    const G = lines(c.groups).map((l) => l.split(',').map((x) => x.trim()).filter(Boolean));
    const all = G.map((grp, gi) => grp.map((w) => ({ w, gi }))).flat();
    const qs = [];
    G.forEach((grp, gi) => {
      const outs = all.filter((o) => o.gi !== gi).map((o) => o.w);
      grp.forEach((t, ti) => {
        const mate = grp[(ti + 1) % grp.length];
        const base = { g, lang: 'nl', x: `${t} rijmt op ${grp.filter((w) => w !== t).join(', ')}.` };
        qs.push(MC(`Welk woord rijmt op "${t}"?`, mate, wrongFrom(outs, 3, c.id + t, grp), { ...base, say: t, d: 1 }));
        qs.push(TF(`"${t}" rijmt op "${mate}".`, true, { ...base, say: `${t}, ${mate}`, d: 1 }));
        const no = wrongFrom(outs, 1, c.id + 'n' + t, grp)[0];
        qs.push(TF(`"${t}" rijmt op "${no}".`, false, { ...base, say: `${t}, ${no}`, d: 1 }));
      });
      for (let k = 0; k < Math.min(2, grp.length); k++) {
        const t = grp[k]; const mates = grp.filter((w) => w !== t).slice(0, 2);
        const outs2 = wrongFrom(outs, 2, c.id + 'mm' + t, grp);
        if (mates.length >= 1 && outs2.length >= 2) qs.push(MULTI(`Welke woorden rijmen op "${t}"?`, [...mates, ...outs2], mates, { ...base0(g), say: t, x: `${t} rijmt op ${mates.join(' en ')}.`, d: 2 }));
      }
    });
    matchGroups(G.map((grp, gi) => [grp[0], grp[1 + (gi % (grp.length - 1))]]), 4, c.id + 'mg').forEach((grp) => qs.push(MATCH('Verbind de woorden die rijmen.', grp, { g, lang: 'nl', d: 2 })));
    return qs.concat(c.more || []);
  });
}
const base0 = (g) => ({ g, lang: 'nl' });

/* ---------- woordsoorten / indelen: woord|klasse ---------- */
export function classify(c) {
  const g = c.g || c.name; const classes = c.classes;
  return pack(c, () => {
    const I = lines(c.items).map((l) => { const p = l.split('|'); return { w: p[0].trim(), k: p[1].trim(), x: (p[2] || '').trim() }; });
    const qs = [];
    I.forEach((it, i) => {
      const others = classes.filter((k) => k !== it.k);
      const wr = shuf(others, c.id + i).slice(0, 3);
      const base = { g, lang: 'nl', x: it.x || `"${it.w}" is een ${it.k}.` };
      qs.push(MC(`Wat voor soort woord is "${it.w}"?`, it.k, wr, { ...base, d: 2 }));
      qs.push(TF(`"${it.w}" is een ${it.k}.`, true, { ...base, d: 1 }));
      qs.push(TF(`"${it.w}" is een ${wr[0]}.`, false, { ...base, d: 1 }));
    });
    const used = new Set();
    classes.forEach((k) => {
      const inK = shuf(I.filter((i) => i.k === k), c.id + 'in' + k), notK = shuf(I.filter((i) => i.k !== k), c.id + 'out' + k);
      for (let n = 0; n < 6; n++) {
        const a = inK.slice(n * 2, n * 2 + 2).map((i) => i.w), b = notK.slice(n * 2, n * 2 + 2).map((i) => i.w);
        if (a.length < 2 || b.length < 2) break;
        const key = k + [...a, ...b].sort().join(',');
        if (used.has(key)) continue; used.add(key);
        qs.push(MULTI(`Welke woorden zijn een ${k}?`, [...a, ...b], a, { g, lang: 'nl', d: 2 }));
      }
    });
    return qs.concat(c.more || []);
  });
}

/* ---------- spreekwoorden: begin|einde|fout1;fout2;fout3|betekenis ---------- */
export function proverbs(c) {
  const g = c.g || c.name;
  return pack(c, () => {
    const I = lines(c.items).map((l) => { const p = l.split('|'); return { b: p[0].trim(), e: p[1].trim(), w: list(p[2]), m: p[3].trim() }; });
    const ms = I.map((i) => i.m), fulls = I.map((i) => `${i.b} ${i.e}`);
    const qs = [];
    I.forEach((it, i) => {
      const full = fulls[i];
      const base = { g, lang: 'nl', x: `"${full}" betekent: ${it.m}` };
      qs.push(FILL(`Maak het spreekwoord af: ${it.b} ___`, it.e, it.w, { ...base, d: 2 }));
      qs.push(MC(`Wat betekent het spreekwoord "${full}"?`, it.m, wrongFrom(ms, 3, c.id + 'm' + i, [it.m]), { ...base, say: full, d: 2 }));
      qs.push(MC(`Welk spreekwoord past bij: ${it.m}`, full, wrongFrom(fulls, 3, c.id + 'f' + i, [full]), { ...base, d: 3 }));
      qs.push(TF(`Het spreekwoord "${full}" betekent: ${it.m}`, true, { ...base, say: full, d: 2 }));
      const wm = wrongFrom(ms, 1, c.id + 't' + i, [it.m])[0];
      qs.push(TF(`Het spreekwoord "${full}" betekent: ${wm}`, false, { ...base, say: full, d: 2 }));
    });
    return qs.concat(c.more || []);
  });
}

/* ---------- hoofdletters: goede zin|woord met hoofdletter|uitleg  (+ c.punct = keuzeregels voor leestekens) ---------- */
export function caps(c) {
  const g = c.g || c.name;
  return pack(c, () => {
    const I = lines(c.items).map((l) => { const p = l.split('|'); return { s: p[0].trim(), t: p[1].trim(), x: (p[2] || '').trim() }; });
    const qs = [];
    const targets = new Set(I.map((i) => i.t.toLowerCase()));
    const filler = [];
    I.forEach((it) => {
      const err = it.s.replace(it.t, it.t.toLowerCase());
      const words = err.replace(/[.,!?:"]/g, '').split(' ').filter(Boolean);
      const others = words.slice(1).filter((w) => !it.t.toLowerCase().split(' ').includes(w) && !targets.has(w) && w.length > 2);
      filler.push(...others);
      const base = { g, lang: 'nl', x: it.x || `Hier hoort een hoofdletter: ${it.t}.` };
      const shown = it.t.toLowerCase().split(' ')[0];
      const wr = wrongFrom(uniq([...others, ...words.slice(1)]).filter((w) => !it.t.toLowerCase().split(' ').includes(w)), 3, c.id + it.s, []);
      if (wr.length >= 2) qs.push(MC(`Welk woord in deze zin mist een hoofdletter? "${err}"`, shown, wr, { ...base, d: 2 }));
      qs.push(TF(`Is dit goed geschreven? "${it.s}"`, true, { ...base, d: 1 }));
      qs.push(TF(`Is dit goed geschreven? "${err}"`, false, { ...base, d: 2 }));
    });
    const fl = uniq(filler);
    const tg = uniq(I.map((i) => i.t.toLowerCase().split(' ')[0]));
    for (let n = 0; n < Math.min(14, tg.length); n++) {
      const a = shuf(tg, c.id + 'ma' + n).slice(0, 2);
      const b = shuf(fl, c.id + 'mb' + n).slice(0, 2);
      if (a.length === 2 && b.length === 2) qs.push(MULTI('Welke van deze woorden schrijf je met een hoofdletter (in een zin)?', [...a, ...b], a, { g, lang: 'nl', d: 2, x: `Met hoofdletter: ${a.map((w) => w[0].toUpperCase() + w.slice(1)).join(', ')}.` }));
    }
    const pun = choice({ id: c.id, name: c.name, emoji: c.emoji, desc: c.desc, tfq: c.tfq, items: c.punct, g }).build().qs;
    return qs.concat(pun, c.more || []);
  });
}
