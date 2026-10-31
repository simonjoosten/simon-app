// Node-test voor docs/chat-core.js. Gebruik: node tools/test-chat.mjs
import assert from 'node:assert/strict';
import * as C from '../docs/chat-core.js';
import { ICONS } from '../docs/gfx/icons.js';

assert.equal(C.pairId('b', 'a'), 'a_b');
// opmaak
const t = (text, extra = {}) => ({ id: 'm' + Math.random().toString(36).slice(2, 9), type: 'text', text, from: 'a', created: 1, ...extra });
assert.deepEqual(C.parseMsg(t('⟦st:coin⟧')), { kind: 'sticker', name: 'coin' });
assert.equal(C.parseMsg(t('⟦re:abc123XYZ:❤️⟧')).kind, 'reaction'); assert.equal(C.parseMsg(t('⟦re:abc123XYZ:❤️⟧')).emoji, '❤️'); assert.equal(C.parseMsg(t('⟦re:abc123XYZ:⟧')).emoji, '');
const q = C.parseMsg(t(C.replyText('abc123XYZ', 'Ja hoor'))); assert.equal(q.kind, 'text'); assert.equal(q.text, 'Ja hoor'); assert.equal(q.quote, 'abc123XYZ');
assert.equal(C.parseMsg(t('gewoon ⟦st:coin⟧ tekst')).kind, 'text');
assert.equal(C.parseMsg({ type: 'image' }).kind, 'image'); assert.equal(C.parseMsg({ type: 'gif' }).kind, 'gif');
assert.equal(C.parseMsg({ type: 'video', mime: 'audio/webm;codecs=opus', parts: 1 }).kind, 'voice'); assert.equal(C.parseMsg({ type: 'video', mime: 'video/mp4' }).kind, 'video');
assert(C.replyText('x'.repeat(10), 'y'.repeat(3000)).length <= 2000);
// reacties
const m1 = t('hoi', { id: 'msg111111', created: 1, from: 'b' });
const r = (uid, emoji, created) => t(C.reactionText('msg111111', emoji), { from: uid, created });
const list = [m1, r('a', '❤️', 2), r('b', '❤️', 3), r('a', '👍', 4), r('b', '', 5)];
const rm = C.reactionsMap(list); assert.deepEqual(rm.get('msg111111'), [{ emoji: '👍', uids: ['a'] }]);
assert.equal(C.myReaction(rm, 'msg111111', 'a'), '👍'); assert.equal(C.myReaction(rm, 'msg111111', 'b'), ''); assert.equal(C.myReaction(rm, 'nope', 'a'), '');
assert.equal(C.visibleMessages(list).length, 1);
const both = C.reactionsMap([m1, r('a', '😂', 2), r('b', '😂', 3)]).get('msg111111'); assert.equal(both[0].uids.length, 2);
assert(C.REACTIONS.length >= 5);
// voorbeeld/preview
assert.equal(C.previewOf(t('⟦st:coin⟧')), 'Sticker'); assert.equal(C.previewOf({ type: 'image' }), '📷 Foto'); assert.equal(C.previewOf({ type: 'video', mime: 'audio/mp4' }), '🎤 Spraakbericht'); assert.equal(C.previewOf(t('a\n b')), 'a b');
assert.equal(C.cleanLast('⟦st:coin⟧'), 'Sticker'); assert.equal(C.cleanLast('hoi'), 'hoi'); assert.equal(C.cleanLast(null), '');
// gelezen
assert.equal(C.receipt({ created: 10 }, 20), 'gelezen'); assert.equal(C.receipt({ created: 30 }, 20), 'verzonden'); assert.equal(C.receipt({ created: 5 }, undefined), 'verzonden');
// dagen en indeling
const now = new Date(2026, 9, 31, 12).getTime();
assert.equal(C.dayLabel(now - 3600e3, now), 'Vandaag'); assert.equal(C.dayLabel(now - 86400e3, now), 'Gisteren'); assert(/okt/.test(C.dayLabel(now - 5 * 86400e3, now)));
const T0 = now - 3600e3; const lm = [{ id: '1', from: 'a', created: T0 }, { id: '2', from: 'a', created: T0 + 60e3 }, { id: '3', from: 'b', created: T0 + 120e3 }, { id: '4', from: 'b', created: T0 + 20 * 60e3 }];
const rows = C.layout(lm, { me: 'a', unreadAfter: T0 + 90e3, now });
assert.equal(rows[0].sep, 'Vandaag'); assert.equal(rows[1].first, true); assert.equal(rows[1].last, false); assert.equal(rows[2].first, false); assert.equal(rows[2].last, true);
const ix = rows.findIndex((x) => x.fresh); assert(ix > 0); assert.equal(rows[ix + 1].m.id, '3'); assert.equal(rows[ix + 1].first, true); assert.equal(rows[ix + 2].first, true); // 20 min later: nieuwe groep
assert.equal(rows.filter((x) => x.fresh).length, 1); assert.equal(C.layout(lm, { me: 'a', unreadAfter: null, now }).filter((x) => x.fresh).length, 0);
assert.equal(C.layout([{ id: 'x', from: 'b', created: T0 }], { me: 'a', unreadAfter: T0 + 5, now }).filter((x) => x.fresh).length, 0);
assert.equal(C.layout([{ id: 'x', from: 'a', created: T0 }, { id: 'y', from: 'a', created: now - 2 * 86400e3 }].sort((a, b) => a.created - b.created), { me: 'a', now }).filter((x) => x.sep).length, 2);
// zoeken
const sl = [t('Hallo wereld'), t('⟦st:coin⟧'), t('Tot straks'), { type: 'image' }];
assert.equal(C.searchMessages(sl, 'wereld').length, 1); assert.equal(C.searchMessages(sl, '').length, 4); assert.equal(C.searchMessages(sl, 'coin').length, 0);
assert.equal(C.highlight('Hallo wereld', 'wer'), 'Hallo <mark>wer</mark>eld'); assert.equal(C.highlight('a.b', '.'), 'a<mark>.</mark>b'); assert.equal(C.highlight('x', ''), 'x');
assert(C.emojiOnly('😀😀')); assert(!C.emojiOnly('hoi 😀')); assert(!C.emojiOnly('12')); assert(!C.emojiOnly(''));
// avatars en thema's
assert.equal(C.initial('anna'), 'A'); assert.equal(C.initial(''), '?'); assert.equal(C.avatarColor('Sam'), C.avatarColor('Sam')); assert.notEqual(C.avatarColor('Sam'), C.avatarColor('Eva'));
assert(C.THEMES.length >= 10); assert.equal(C.themeOf('rommel').id, 'standaard'); assert.equal(new Set(C.THEMES.map((x) => x.id)).size, C.THEMES.length);
for (const th of C.THEMES) { assert(ICONS[th.ic], th.ic); assert(/^#/.test(th.mine[0]) && th.bg.length === 2); }
// stickers
assert(C.STICKER_PACKS.length >= 8); let n = 0; for (const p of C.STICKER_PACKS) { assert(ICONS[p.ic], p.ic); for (const s of p.items) { assert(ICONS[s], `sticker ${s}`); assert(/^[a-z0-9-]{1,30}$/.test(s)); n++; } }
assert(n >= 100);
assert.deepEqual(C.pushRecent(['a', 'b', 'c'], 'b'), ['b', 'a', 'c']); assert.equal(C.pushRecent(Array.from({ length: 12 }, (_, i) => 's' + i), 'z').length, 12);
// spraak
assert.equal(C.pickVoiceMime((m) => m === 'audio/webm'), 'audio/webm'); assert.equal(C.pickVoiceMime(() => false), ''); assert.equal(C.pickVoiceMime(() => { throw new Error('x'); }), '');
assert.equal(C.partsFor(450000), 1); assert.equal(C.partsFor(450001), 2); assert(C.fitsChat(1e6)); assert(!C.fitsChat(25 * 450000)); assert(!C.fitsChat(0));
assert.equal(C.fmtDur(75), '1:15'); assert.equal(C.fmtDur(5), '0:05');
// elk gegenereerd bericht past binnen de Firestore-regels voor tekst (<= 2000)
assert(C.reactionText('a'.repeat(20), '🧑‍🤝‍🧑').length < 2000);
console.log('chat: alle tests ok');
