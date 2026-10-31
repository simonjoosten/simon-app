// Test voor foto-icons.js (stickers, wereld-kaders), foto-collage-styles-extra.js (30 stijlen) en emoji3d.js.  node tools/test-foto-extra.mjs
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };
const I = await import('../docs/foto-icons.js');
const { ICONS } = await import('../docs/gfx/icons.js');
const E3 = await import('../docs/emoji3d.js');
const X = await import('../docs/foto-collage-styles-extra.js');

// stickers: alle iconen zitten in precies een categorie
const names = I.allStickerNames();
ok(names.length === Object.keys(ICONS).length, 'alle iconen in categorien ' + names.length);
ok(I.STICKER_CATS.length === 8, '8 categorieen ' + I.STICKER_CATS.length);
ok(I.STICKER_CATS.every((c) => c.items.length > 5), 'categorie niet leeg');
ok(new Set(names).size === names.length, 'geen dubbele iconen');
// wereld-kaders
const ws = I.worlds();
ok(ws.length >= 18, 'werelden ' + ws.length);
const calls = []; const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }) }, { get: (t, k) => (k in t ? t[k] : (...a) => { calls.push(k); }), set: () => true });
const helpers = { layPad: (f) => (w, h, p) => { const q = Math.round(p * f); return { W: w + 2 * q, H: h + 2 * q, ix: q, iy: q, iw: w, ih: h }; }, putImg: () => calls.push('img') };
for (const w of ws) {
  const d = I.worldFrameDef(w, helpers); const L = d.lay(400, 300, 20);
  ok(L.W === 400 + 2 * 48 && L.ix === 48, 'lay ' + w.id);
  calls.length = 0; d.draw(ctx, L, 20, d.def, {});
  ok(calls.includes('img') && calls.includes('fillRect'), 'draw ' + w.id);
  ok(w.deco.length > 2, 'deco ' + w.id);
}
const sp = I.edgeSpots(0, 0, 100, 60, 20);
ok(sp.length === 2 * 5 + 2 * 3, 'edgeSpots aantal ' + sp.length);
ok(sp.every((p) => p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 60), 'edgeSpots binnen');
ok(I.edgeSpots(0, 0, 0, 10, 5).length === 0 && I.edgeSpots(0, 0, 10, 10, 0).length === 0, 'edgeSpots rand');

// extra stijlen
ok(X.WORLD_STYLES.length === 18, '18 werelden');
const h = { mkSlot: (b, o) => ({ ...b, ...o }), inset: (c, g) => c, solids: () => [{}], rnd: () => ({}), grad: () => ({}), gridCells: (n) => Array.from({ length: n }, (_, i) => ({ x: i, y: 0, w: 1, h: 1 })), rowsFill: () => [], T: () => ({}), RECT: {}, clamp: Math.min };
const defs = X.makeExtraDefs(h);
ok(defs.length === 30, '30 extra stijlen ' + defs.length);
ok(new Set(defs.map((d) => d[0])).size === 30, 'unieke namen');
ok(defs.every((d) => typeof d[3] === 'function' && X.EXTRA_GROUPS.includes(d[2])), 'vorm van definities');

// emoji -> 3D
ok(E3.iconForEmoji('🪙') === 'coin' && E3.iconForEmoji('⭐') === 'star', 'iconForEmoji');
ok(E3.iconForEmoji('❤️') === 'heart' && E3.iconForEmoji('❤') === 'heart', 'variantselector');
ok(E3.iconForEmoji('🙂') === null, 'onbekende emoji blijft emoji');
const parts = E3.splitEmoji('Pak 🪙 en ⭐ nu');
ok(parts.length === 5 && parts[1].n === 'coin' && parts[3].n === 'star' && parts[0].t === 'Pak ', 'splitEmoji ' + JSON.stringify(parts));
ok(E3.splitEmoji('geen emoji').length === 1 && E3.splitEmoji('').length === 0, 'splitEmoji leeg');
ok(E3.splitEmoji('🙂🪙')[0].t === '🙂', 'splitEmoji gemengd');
console.log(fails ? fails + ' FOUTEN' : 'ALLES OK');
process.exit(fails ? 1 : 0);
