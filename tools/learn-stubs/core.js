// Stub van docs/learn/core.js voor de hub-tests (volgt het contract in SPEC §2, zonder opslag).
export const LANGS = { nl: { name: 'Nederlands', speech: 'nl-NL' } };
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function shuffle(arr, r = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function qkey(q) { const s = q.t + '|' + q.q + '|' + JSON.stringify(q.a); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); }
export function pick(kit, n, o = {}) {
  let qs = kit.qs.slice();
  if (o.types && o.types.length) qs = qs.filter((q) => o.types.includes(q.t));
  const avoid = o.avoid || new Set();
  let pool = shuffle(qs, rng(o.seed || 1)).filter((q) => !avoid.has(qkey(q)));
  if (!pool.length) pool = shuffle(qs, rng(o.seed || 1));
  const out = []; while (out.length < n && pool.length) { for (const q of pool) { if (out.length < n) out.push(q); } }
  return out;
}
export const Kits = { async load() {}, list: () => [], get: () => null, save(k) { Kits.saved = (Kits.saved || []).concat([k]); }, remove() {}, newId: () => 'k-new', onChange: () => () => {} };
export async function allKits() { return (globalThis.__kits || []).map((k) => ({ id: k.id, name: k.name, emoji: k.emoji, group: k.group, count: k.qs.length, lang: 'nl', src: k.src || 'pack', load: async () => k })); }
export async function getKit(id) { return (globalThis.__kits || []).find((k) => k.id === id) || null; }
export const Prog = { recorded: [], async load() {}, record(kitId, q, ok, ms) { Prog.recorded.push([kitId, q.q, ok, ms]); Profile._bump('answers', 1); if (ok) Profile._bump('correct', 1); } };
export function todayKey() { return '2026-10-30'; }
export function fmt(n) { n = +n || 0; if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + 'M'; if (n >= 1e3) return (n / 1e3).toFixed(1).replace('.', ',') + 'K'; return String(Math.round(n)); }
export function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
export function bindCtx(c) { bindCtx.last = c; }
export const Snd = { on: true, played: [], play(n) { Snd.played.push(n); }, setOn(b) { Snd.on = !!b; } };
export const TTS = { on: false, supported: () => true, speak: async () => {}, stop() {}, setOn(b) { TTS.on = !!b; }, rate: 1, setRate() {}, voices: () => [] };

const st = { name: 'Tester', xp: 0, level: 1, coins: 100, stars: 0, streak: 2, avatar: { emoji: '🙂', hat: '', bg: 'sky' }, up: {}, ach: {}, quests: {}, stats: {} };
const need = (l) => 50 + 25 * (l - 1);
export const Profile = {
  st,
  async load() {},
  get: () => st,
  setName(n) { st.name = String(n).slice(0, 20); },
  addXp(n) { st.xp += n; const levels = []; while (st.xp >= need(st.level)) { st.xp -= need(st.level); st.level++; const c = 15 + 5 * st.level; st.coins += c; levels.push({ level: st.level, coins: c, stars: 0 }); } return { gained: n, level: st.level, levels, coins: 0 }; },
  addCoins(n) { st.coins += n; },
  spend(n) { if (st.coins < n) return false; st.coins -= n; return true; },
  levelInfo: () => ({ level: st.level, cur: st.xp, next: need(st.level) }),
  UPGRADES: ['startCash', 'cashMult', 'streakBonus', 'extraLives', 'timeBonus', 'hints', 'shield', 'xpMult', 'coinMult', 'luck', 'startCash2', 'hints2', 'shield2'].map((id, i) => ({
    id, name: 'Upgrade ' + id, emoji: '⚡', desc: 'Test ' + id, max: 5, cost: (l) => 20 + 15 * l, fx: (l) => ({ [id.replace(/\d$/, '')]: l * (id.startsWith('cash') || id.endsWith('Mult') ? 0.1 : 1) }),
  })),
  buyUpgrade(id) { const u = Profile.UPGRADES.find((x) => x.id === id); const l = st.up[id] || 0; if (!u || l >= u.max || !Profile.spend(u.cost(l))) return false; st.up[id] = l + 1; return true; },
  effects() { const e = { startCash: 0, cashMult: 1, streakBonus: 0, extraLives: 0, timeBonus: 0, hints: 0, shield: 0, xpMult: 1, coinMult: 1, luck: 0 }; for (const u of Profile.UPGRADES) { const l = st.up[u.id] || 0; if (l) Object.assign(e, u.fx(l)); } return e; },
  setAvatar(o) { st.avatar = { ...st.avatar, ...o }; },
  _q: [{ id: 'q1', text: 'Speel 2 spellen', goal: 2, prog: 0, reward: 20, claimed: false, kind: 'games' }, { id: 'q2', text: 'Geef 5 goede antwoorden', goal: 5, prog: 0, reward: 15, claimed: false, kind: 'correct' }],
  quests() { return Profile._q.map((q) => ({ ...q, done: q.prog >= q.goal })); },
  _bump(kind, n) { for (const q of Profile._q) if (q.kind === kind) q.prog = Math.min(q.goal, q.prog + n); },
  bumpQuest(kind, n) { if (['answers', 'correct', 'xp', 'fast'].includes(kind)) return; Profile._bump(kind, n); },
  claimQuest(id) { const q = Profile._q.find((x) => x.id === id); if (!q || q.claimed || q.prog < q.goal) return false; q.claimed = true; Profile.addCoins(q.reward); return { coins: q.reward, xp: 0, levels: [] }; },
  achievements: () => [{ id: 'c1', name: 'Kern-prestatie', emoji: '🎖️', done: false }],
  checkAch() { return []; },
};
