// Node-test voor docs/shorts-logic.js (feed-volgorde, filters, opslag, lui laden). Gebruik: node tools/test-shorts.mjs
import assert from 'node:assert/strict';
import { CATS, CAT, norm, mulberry, sanitizeState, serialize, mergeStates, createStore, searchMatch, filterList, baseOrder, mixOrder, buildFeed, windowRange, createLazy, dataMode, defaultState, MAX_DATA, CLOUD_EVERY } from '../docs/shorts-logic.js';

const memLS = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };
const mk = (n) => Array.from({ length: n }, (_, i) => ({ id: 's' + String(i + 1).padStart(3, '0'), t: 'Filmpje ' + (i + 1), c: CATS[i % 10].id, tags: ['tag' + (i % 4)], s: 10, kb: 200 }));
let n = 0; const ok = (name, f) => { f(); n++; };

ok('categorieen', () => { assert.equal(CATS.length, 10); assert.ok(CAT.ruimte && CAT.quiz); });
ok('norm/zoeken', () => {
  assert.equal(norm('  Één  Cirkel!! '), 'een cirkel');
  const it = { id: 's1', t: 'Hoe snel is een Cheeta?', c: 'dieren', tags: ['snelheid', 'katachtig'] };
  assert.ok(searchMatch(it, 'cheeta')); assert.ok(searchMatch(it, 'SNEL cheeta')); assert.ok(searchMatch(it, 'dieren')); assert.ok(searchMatch(it, 'katachtig'));
  assert.ok(!searchMatch(it, 'vis')); assert.ok(searchMatch(it, ''));
});
ok('sanitize: oude/kapotte data', () => {
  assert.deepEqual(sanitizeState(null), defaultState()); assert.deepEqual(sanitizeState('x'), defaultState());
  const s = sanitizeState({ fav: ['s001', 's001', 5, '../x'], seen: { s002: 3, bad: -1, 's 3': 2, s004: '2.9' }, opt: { order: 'kapot', mix: false, data: 'zuinig' }, u: 12 });
  assert.deepEqual(s.fav, ['s001']); assert.deepEqual(s.seen, { s002: 3, s004: 2 }); assert.equal(s.opt.order, 'nieuw'); assert.equal(s.opt.mix, false); assert.equal(s.opt.data, 'zuinig'); assert.equal(s.u, 12);
});
ok('serialize blijft <= 20000', () => {
  const s = defaultState(); for (let i = 0; i < 1900; i++) s.seen['a' + String(i).padStart(10, '0')] = 123;
  const out = serialize(s); assert.ok(out.length <= MAX_DATA); assert.ok(JSON.parse(out).v === 1);
});
ok('merge: nieuwste wint, bekeken = max', () => {
  const a = { fav: ['s1'], seen: { s1: 2, s2: 1 }, opt: { order: 'id' }, u: 10 }, b = { fav: ['s9'], seen: { s1: 1, s3: 5 }, opt: { order: 'random' }, u: 20 };
  const m = mergeStates(a, b); assert.deepEqual(m.fav, ['s9']); assert.deepEqual(m.seen, { s1: 2, s2: 1, s3: 5 }); assert.equal(m.opt.order, 'random'); assert.equal(m.u, 20);
});
ok('store: lokaal opslaan en herladen', () => {
  const ls = memLS(); let t = 1000;
  const s1 = createStore('u1', { ls, now: () => t++ });
  assert.equal(s1.toggleFav('s001'), true); s1.markSeen('s002'); s1.markSeen('s002'); s1.setOpt({ order: 'random', data: 'zuinig', mix: false });
  const s2 = createStore('u1', { ls });
  assert.ok(s2.isFav('s001')); assert.equal(s2.views('s002'), 2); assert.equal(s2.state.opt.order, 'random'); assert.equal(s2.state.opt.data, 'zuinig'); assert.equal(s2.state.opt.mix, false);
  assert.equal(s2.toggleFav('s001'), false); assert.ok(!s2.isFav('s001'));
  assert.equal(createStore('ander', { ls }).state.fav.length, 0); // per uid gescheiden
  assert.equal(s1.key, 'shorts:state:u1'); assert.equal(s1.docId, 'shorts-state__u1');
  const kapot = memLS(); kapot.setItem('shorts:state:x', '{{{'); assert.deepEqual(createStore('x', { ls: kapot }).state.fav, []);
  const dood = { getItem() { throw new Error('nee'); }, setItem() { throw new Error('nee'); } }; const s3 = createStore('z', { ls: dood }); s3.toggleFav('s5'); assert.ok(s3.isFav('s5'));
});
await (async () => {
  // cloud: exact velden, gespaard, nieuwste wint
  const docs = new Map(), writes = []; let timers = []; let t = 5000;
  const cloud = { db: 'DB', doc: (db, ...p) => ({ p: p.join('/') }), getDoc: async (r) => ({ exists: () => docs.has(r.p), data: () => docs.get(r.p) }), setDoc: async (r, d) => { writes.push([r.p, d]); docs.set(r.p, d); } };
  const env = { ls: memLS(), cloud, now: () => t, setTimeout: (f, ms) => { const o = { f, ms }; timers.push(o); return o; }, clearTimeout: (o) => { timers = timers.filter((x) => x !== o); } };
  const st = createStore('u9', env);
  st.toggleFav('s001'); st.toggleFav('s002'); st.markSeen('s003');
  assert.equal(timers.length, 1, 'cloud-schrijven gebundeld in 1 timer'); assert.equal(writes.length, 0);
  assert.equal(await st.flush(), true);
  assert.equal(writes.length, 1); const [path, doc] = writes[0];
  assert.equal(path, 'gamesaves/shorts-state__u9'); assert.deepEqual(Object.keys(doc).sort(), ['data', 'game', 'uid', 'updated']);
  assert.equal(doc.game, 'shorts-state'); assert.equal(doc.uid, 'u9'); assert.equal(typeof doc.data, 'string'); assert.ok(doc.data.length <= 20000); assert.equal(typeof doc.updated, 'number');
  assert.deepEqual(JSON.parse(doc.data).fav, ['s001', 's002']);
  assert.equal(await st.flush(), false, 'niets gewijzigd: niet nog eens schrijven');
  // tweede apparaat met nieuwere cloud-data
  docs.set('gamesaves/shorts-state__u8', { game: 'shorts-state', uid: 'u8', data: JSON.stringify({ v: 1, fav: ['s007'], seen: { s010: 4 }, opt: { order: 'id', mix: true, data: 'auto' }, u: 9e12 }), updated: 9e12 });
  const e2 = { ls: memLS(), cloud, now: () => t, setTimeout: env.setTimeout, clearTimeout: env.clearTimeout };
  const loc = createStore('u8', e2); loc.toggleFav('s001'); let changed = 0; loc.onChange(() => changed++);
  assert.equal(await loc.loadCloud(), true);
  assert.deepEqual(loc.state.fav, ['s007']); assert.equal(loc.views('s010'), 4); assert.equal(loc.state.opt.order, 'id');
  // cloud stuk: geen crash
  const bad = createStore('u7', { ls: memLS(), cloud: { ...cloud, getDoc: async () => { throw new Error('x'); } } }); assert.equal(await bad.loadCloud(), false);
  const bad2 = createStore('u6', { ls: memLS(), cloud: { ...cloud, setDoc: async () => { throw new Error('x'); } }, setTimeout: env.setTimeout, clearTimeout: env.clearTimeout }); bad2.toggleFav('s1'); assert.equal(await bad2.flush(), false); assert.ok(bad2.isFav('s1'));
  assert.ok(CLOUD_EVERY >= 20000);
  n++;
})();
ok('filters', () => {
  const all = mk(30), ls = memLS(), store = createStore('f', { ls });
  store.toggleFav('s003'); store.toggleFav('s011'); store.markSeen('s001');
  assert.equal(filterList(all, { cat: 'all' }, store).length, 30);
  assert.deepEqual(filterList(all, { cat: 'fav' }, store).map((x) => x.id), ['s003', 's011']);
  assert.equal(filterList(all, { cat: 'new' }, store).length, 29);
  assert.ok(filterList(all, { cat: 'dieren' }, store).every((x) => x.c === 'dieren')); assert.equal(filterList(all, { cat: 'dieren' }, store).length, 3);
  assert.equal(filterList(all, { cat: 'all', q: 'filmpje 12' }, store).length, 1);
  assert.equal(filterList(all, { cat: 'dieren', q: 'tag1' }, store).every((x) => x.c === 'dieren' && x.tags.includes('tag1')), true);
  assert.deepEqual(filterList([], { cat: 'all' }, store), []);
});
ok('volgorde: nieuw eerst, id, random (seed), mix', () => {
  const all = mk(40), views = (id) => (id <= 's005' ? 2 : id === 's010' ? 1 : 0);
  const nw = baseOrder(all, 'nieuw', views);
  assert.equal(nw[0].id, 's006'); assert.equal(nw[nw.length - 1].id, 's005'); assert.ok(nw.slice(-6, -5)[0].id === 's010' || nw.findIndex((x) => x.id === 's010') > nw.findIndex((x) => x.id === 's040'));
  assert.deepEqual(baseOrder(all.slice().reverse(), 'id').map((x) => x.id), all.map((x) => x.id));
  const r1 = baseOrder(all, 'random', views, mulberry(7)), r2 = baseOrder(all, 'random', views, mulberry(7)), r3 = baseOrder(all, 'random', views, mulberry(8));
  assert.deepEqual(r1.map((x) => x.id), r2.map((x) => x.id)); assert.notDeepEqual(r1.map((x) => x.id), r3.map((x) => x.id));
  assert.deepEqual(r1.map((x) => x.id).sort(), all.map((x) => x.id)); // niets kwijt, geen dubbele
  const mx = mixOrder(nw); assert.equal(mx.length, 40); assert.equal(new Set(mx.map((x) => x.id)).size, 40);
  for (let i = 1; i < mx.length; i++) assert.notEqual(mx[i].c, mx[i - 1].c, 'nooit 2x dezelfde categorie');
  let sameGroup = 0; for (let i = 1; i < mx.length; i++) if (CAT[mx[i].c].group === CAT[mx[i - 1].c].group) sameGroup++;
  assert.ok(sameGroup < 20, 'groepen worden afgewisseld: ' + sameGroup);
  // ongelijke verdeling: toch compleet
  const skew = mk(10).map((x, i) => ({ ...x, c: i < 8 ? 'sport' : 'quiz' })); assert.equal(mixOrder(skew).length, 10);
  assert.deepEqual(mixOrder([]), []);
});
ok('buildFeed: nieuwe filmpjes eerst, na bekijken achteraan', () => {
  const all = mk(20), store = createStore('b', { ls: memLS() });
  store.setOpt({ mix: false });
  assert.equal(buildFeed(all, { cat: 'all' }, store)[0].id, 's001');
  store.markSeen('s001'); store.markSeen('s002');
  const f = buildFeed(all, { cat: 'all' }, store); assert.equal(f[0].id, 's003'); assert.deepEqual(f.slice(-2).map((x) => x.id), ['s001', 's002']);
  store.setOpt({ mix: true, order: 'id' }); const m = buildFeed(all, { cat: 'all' }, store); assert.equal(m.length, 20);
  assert.equal(buildFeed(all, { cat: 'sport' }, store).every((x) => x.c === 'sport'), true);
  assert.deepEqual(buildFeed([], { cat: 'all' }, store), []);
  assert.equal(buildFeed(mk(1), { cat: 'all' }, store).length, 1);
  assert.equal(buildFeed(all, { cat: 'all', q: 'bestaatniet' }, store).length, 0);
  const sr = buildFeed(all, { cat: 'all' }, store, { order: 'random' }, mulberry(3)); assert.equal(sr.length, 20);
});
ok('lui laden: alleen huidig +-1', () => {
  assert.deepEqual(windowRange(0, 10, 1), [0, 1]); assert.deepEqual(windowRange(5, 10, 1), [4, 5, 6]); assert.deepEqual(windowRange(9, 10, 1), [8, 9]); assert.deepEqual(windowRange(0, 0, 1), []); assert.deepEqual(windowRange(3, 10, 0), [3]);
  const log = []; const lz = createLazy({ radius: 1, attach: (i) => log.push('+' + i), detach: (i) => log.push('-' + i) });
  lz.move(0, 300); assert.deepEqual(lz.active, [0, 1]);
  lz.move(1, 300); assert.deepEqual(lz.active, [0, 1, 2]); lz.move(2, 300); assert.deepEqual(lz.active, [1, 2, 3]);
  lz.move(2, 300);
  assert.deepEqual(log, ['+0', '+1', '+2', '-0', '+3']); // geen dubbele attach
  lz.move(200, 300); assert.deepEqual(lz.active, [199, 200, 201]); assert.ok(log.filter((x) => x[0] === '+').length - log.filter((x) => x[0] === '-').length === 3);
  lz.setRadius(0); lz.move(200, 300); assert.deepEqual(lz.active, [200]);
  lz.clear(); assert.deepEqual(lz.active, []);
  const l2 = createLazy({ attach() {}, detach() {} }); l2.move(0, 0); assert.deepEqual(l2.active, []); // lege lijst
});
ok('mobiele data', () => {
  assert.equal(dataMode({}, 'auto').zuinig, false); assert.equal(dataMode(undefined, 'auto').zuinig, false);
  assert.deepEqual(dataMode({ connection: { type: 'cellular' } }, 'auto'), { zuinig: true, reason: 'mobiel' });
  assert.equal(dataMode({ connection: { saveData: true } }, 'auto').reason, 'databesparing');
  assert.equal(dataMode({ connection: { effectiveType: '2g' } }, 'auto').reason, 'traag');
  assert.equal(dataMode({ connection: { effectiveType: '4g', type: 'wifi' } }, 'auto').zuinig, false);
  assert.equal(dataMode({ connection: { type: 'cellular' } }, 'normaal').zuinig, false); assert.equal(dataMode({}, 'zuinig').zuinig, true);
});
console.log('test-shorts: ' + n + ' groepen OK');
