// Gedeelde bouwstenen voor de PACKS-B generator (tools/make-packs-b.mjs).
// kit(meta) geeft een bouwer met hulpfuncties (mc, tf, type, num, fill, order, match, multi, facts, ...).
// Alles is deterministisch: de seed komt uit het pack-id.

export function hash(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
export function mulberry32(a) {
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const norm = (s) => { const n = String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); return n || String(s); };
export const nl = (n) => String(n).replace('.', ',');
export const eur = (cents) => '€ ' + (cents / 100).toFixed(2).replace('.', ',');
export const eurShort = (cents) => (cents % 100 === 0 ? '€ ' + cents / 100 : eur(cents));

export function kit(meta) {
  const rand = mulberry32(hash(meta.id));
  const lang = meta.lang || 'nl';
  const qs = [];
  const chk = [];
  const seen = new Set();
  const warn = [];
  const ri = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const rpick = (arr) => arr[Math.floor(rand() * arr.length)];
  const shuf = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const clean = (o) => { const r = {}; for (const k of Object.keys(o)) if (o[k] !== undefined && o[k] !== null && o[k] !== '') r[k] = o[k]; return r; };
  const ex = (e) => (typeof e === 'string' ? { x: e } : (e || {}));

  function push(q, e) {
    const { c, cf, ...rest } = ex(e);
    const o = clean({ ...q, ...rest });
    if (lang !== 'nl' && !o.lang) o.lang = lang;
    if (!o.d) o.d = 2;
    const fam = ['mc', 'type', 'fill', 'num'].includes(o.t) ? 'a' : o.t; // zoals core.qkey: mc/type/fill/num zijn dezelfde vraag
    const key = fam + '|' + o.q + '|' + (o.t === 'multi' ? JSON.stringify([...o.a].sort()) : (fam === 'a' ? String(o.a) : JSON.stringify(o.a)));
    if (seen.has(key)) return false;
    seen.add(key);
    qs.push(o);
    if (c !== undefined) chk.push({ i: qs.length - 1, c: String(c), cf: cf || '' });
    return true;
  }

  // plausibele foute getallen
  function near(p, n = 3, o = {}) {
    const min = o.min !== undefined ? o.min : (p >= 0 ? 0 : -Infinity);
    const st = o.step || 1;
    const dec = o.dec || 0;
    const cand = [p + st, p - st, p + 2 * st, p - 2 * st, p + 10, p - 10, p + 1, p - 1, p + 5, p - 5, p * 2, Math.round(p / 2), p + 3 * st, p - 3 * st, p + 100, p - 100];
    const uniq = [];
    for (const c0 of cand) {
      const c = dec ? Math.round(c0 * 10 ** dec) / 10 ** dec : Math.round(c0);
      if (c !== p && c >= min && !uniq.includes(c) && !(o.avoid || []).includes(c)) uniq.push(c);
    }
    // eerst de dichtstbijzijnde, met wat willekeur
    uniq.sort((a, b) => Math.abs(a - p) - Math.abs(b - p));
    const head = uniq.slice(0, Math.max(n + 3, 6));
    return shuf(head).slice(0, n);
  }

  const api = {
    meta, qs, chk, warn, rand, ri, rpick, shuf, near, push,
    mc(q, a, wrongs, e) {
      a = String(a);
      const s = new Set([norm(a)]);
      const alts = (ex(e).alt || []).map(norm);
      let w = [];
      for (const x of shuf(wrongs.map(String))) { const k = norm(x); if (!s.has(k) && !alts.includes(k)) { s.add(k); w.push(x); } }
      w = w.slice(0, ex(e).n || 3);
      if (w.length < 2) { warn.push('mc te weinig foute opties: ' + q); return false; }
      const e2 = { ...ex(e) }; delete e2.n; delete e2.alt;
      return push({ t: 'mc', q, a, o: shuf([a, ...w]) }, e2);
    },
    tf(q, b, e) { return push({ t: 'tf', q, a: !!b }, e); },
    type(q, a, alt, e) { const o = { t: 'type', q, a: String(a) }; if (alt && alt.length) o.alt = alt.map(String); return push(o, e); },
    num(q, a, e) { const o = { t: 'num', q, a }; const E = ex(e); if (E.alt) o.alt = E.alt; if (E.tol) o.tol = E.tol; const e2 = { ...E }; delete e2.alt; delete e2.tol; return push(o, e2); },
    fill(q, a, opts, e) {
      a = String(a);
      const o = { t: 'fill', q, a };
      if (opts && opts.length) {
        const s = new Set([norm(a)]); const w = [];
        for (const x of shuf(opts.map(String))) { const k = norm(x); if (!s.has(k)) { s.add(k); w.push(x); } }
        if (w.length < 2) { warn.push('fill te weinig opties: ' + q); return false; }
        o.o = shuf([a, ...w.slice(0, 3)]);
      }
      const E = ex(e); if (E.alt) o.alt = E.alt; const e2 = { ...E }; delete e2.alt;
      return push(o, e2);
    },
    order(q, items, e) { return push({ t: 'order', q, a: items.map(String) }, e); },
    match(q, pairs, e) { return push({ t: 'match', q, a: pairs.map((p) => [String(p[0]), String(p[1])]) }, e); },
    multi(q, opts, correct, e) { return push({ t: 'multi', q, o: opts.map(String), a: correct.map(String) }, e); },

    // lijsten met korte notatie
    mcs(list) { for (const r of list) api.mc(r[0], r[1], r[2], r[3]); },
    tfs(list) { for (const r of list) api.tf(r[0], r[1], r[2]); },
    types(list) { for (const r of list) api.type(r[0], r[1], r[2], r[3]); },
    nums(list) { for (const r of list) api.num(r[0], r[1], r[2]); },

    // feitentabel -> veel vraagvormen. rows: [k, v, x?, {e, alt, g, d, noType, noRev, noFill, noTf}?]
    facts(rows, T) {
      const R = rows.map((r) => ({ k: r[0], v: String(r[1]), x: r[2] || '', ...(r[3] || {}) }));
      const vcount = {}; for (const r of R) vcount[norm(r.v)] = (vcount[norm(r.v)] || 0) + 1;
      const kcount = {}; for (const r of R) kcount[norm(r.k)] = (kcount[norm(r.k)] || 0) + 1;
      const same = (a, b) => norm(a.v) === norm(b.v) || (a.alt || []).map(norm).includes(norm(b.v)) || (b.alt || []).map(norm).includes(norm(a.v));
      const wrongV = (r, n) => {
        let pool = T.pool ? T.pool.map((v) => ({ v })) : R;
        let cand = pool.filter((z) => !same(r, z) && (T.pool || !r.g || z.g === r.g));
        let uv = [...new Set(cand.map((z) => z.v))];
        if (uv.length < n) { uv = [...new Set(pool.filter((z) => !same(r, z)).map((z) => z.v))]; }
        return shuf(uv).slice(0, n);
      };
      const wrongK = (r, n) => {
        let cand = R.filter((z) => norm(z.k) !== norm(r.k) && (!r.g || z.g === r.g)); let uk = [...new Set(cand.map((z) => z.k))];
        if (uk.length < n) uk = [...new Set(R.filter((z) => norm(z.k) !== norm(r.k)).map((z) => z.k))];
        return shuf(uk).slice(0, n);
      };
      const typeMax = T.typeMax || 14;
      for (const r of R) {
        const d = r.d || T.d || 2;
        const E = (extra) => ({ x: r.x || (T.x ? T.x(r.k, r.v, r) : ''), d, ...(r.e && T.e !== false ? { e: r.e } : {}), ...(r.say ? { say: r.say } : {}), ...extra });
        if (T.f) {
          const q = T.f(r.k, r);
          if (T.mc !== false) api.mc(q, r.v, wrongV(r, 3), E({}));
          if (T.type !== false && !r.noType && r.v.length <= typeMax) api.type(T.mc !== false ? q.replace(/\?$/, '? (typ het antwoord)') : q, r.v, r.alt, E({ d: Math.min(3, d + 1) }));
        }
        if (T.r && vcount[norm(r.v)] === 1 && !r.noRev) {
          const q = T.r(r.v, r);
          if (kcount[norm(r.k)] === 1) {
            api.mc(q, r.k, wrongK(r, 3), { x: r.x || '', d, ...(T.rE ? { e: r.e } : {}) });
            if (T.rType && r.k.length <= typeMax) api.type(q, r.k, r.altK, { x: r.x || '', d: Math.min(3, d + 1) });
          }
        }
        if (T.t && !r.noTf) {
          api.tf(T.t(r.k, r.v, r), true, E({ d: Math.max(1, d - 1) }));
          const w = wrongV(r, 1)[0];
          if (w !== undefined) api.tf(T.t(r.k, w, r), false, E({ x: T.fx ? T.fx(r.k, r.v, r) : (r.x || `Het juiste antwoord is ${r.v}.`), d }));
        }
        if (T.fill && !r.noFill) {
          api.fill(T.fill(r.k, r.v, r), r.v, T.fillType ? null : wrongV(r, 3).concat([r.v]), E({ alt: r.alt }));
        }
      }
      if (T.match !== false && T.matchQ) {
        const n = T.matchN || 4;
        const cnt = T.matches !== undefined ? T.matches : Math.min(10, Math.floor(R.length / n));
        const pool = R.filter((r) => vcount[norm(r.v)] === 1 && kcount[norm(r.k)] === 1 && !r.noMatch);
        for (let m = 0; m < cnt; m++) {
          const s = shuf(pool);
          const pick = [];
          const vs = new Set();
          for (const r of s) { if (!vs.has(norm(r.v))) { vs.add(norm(r.v)); pick.push(r); } if (pick.length >= n) break; }
          if (pick.length >= 3) api.match(T.matchQ, pick.map((r) => [r.k, r.v]), { d: T.d || 2 });
        }
      }
      return api;
    },

    // groepen -> "kies alle ..." (multi) en "tot welke groep hoort ..." (mc)
    // groups: { naam: [items] }
    groups(groups, T) {
      const names = Object.keys(groups);
      const owner = {}; for (const n of names) for (const it of groups[n]) owner[it] = n;
      const all = Object.keys(owner);
      if (T.which) {
        for (const it of all) {
          const wr = names.filter((n) => n !== owner[it]);
          const wr2 = T.names ? T.names.filter((n) => n !== owner[it]) : wr;
          if (wr2.length >= 2) api.mc(T.which(it), owner[it], wr2, { d: T.d || 2, ...(T.e && T.e[it] ? { e: T.e[it] } : {}), x: T.wx ? T.wx(it, owner[it]) : '' });
          if (T.tfq) {
            api.tf(T.tfq(it, owner[it]), true, { d: 1 });
            const o2 = shuf(names.filter((n) => n !== owner[it]))[0];
            api.tf(T.tfq(it, o2), false, { d: 2, x: `${it}: ${owner[it]}.` });
          }
        }
      }
      if (T.multi) {
        const reps = T.reps || 3;
        for (const n of names) {
          for (let k = 0; k < reps; k++) {
            const good = shuf(groups[n]).slice(0, ri(2, Math.min(3, groups[n].length)));
            const bad = shuf(all.filter((z) => owner[z] !== n)).slice(0, ri(2, 3));
            if (good.length < 2 || bad.length < 2) continue;
            api.multi(T.multi(n), shuf([...good, ...bad]), good, { d: 3 });
          }
        }
      }
      return api;
    },

    // volgorde-vragen uit een geordende lijst: n items uit de lijst, in stijgende volgorde
    orders(list, qtext, count, e, size = 4) {
      for (let k = 0; k < count; k++) {
        if (list.length < size) break;
        const idxs = shuf(list.map((_, i) => i)).slice(0, size).sort((a, b) => a - b);
        api.order(qtext, idxs.map((i) => list[i]), e);
      }
    },

    out() {
      return { meta, qs, chk, warn };
    },
  };
  return api;
}
