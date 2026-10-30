// Stub-spel: speelt 3 vragen en eindigt meteen (voor de hub-test).
export default {
  id: 'klassiek', name: 'Klassiek (stub)', emoji: '💰', color: '#6366f1', desc: 'stub', tags: ['geld', 'solo'], minutes: 4, duo: true,
  create(host, env) {
    const qs = env.pick(3);
    qs.forEach((q, i) => env.report({ q, ok: i !== 1, ms: 800 }));
    const t = setTimeout(() => { env.end({ score: 120, win: true, stats: { correct: 2, wrong: 1, bestStreak: 1 }, summary: 'Stub klaar' }); env.end({ score: 999 }); }, 5);
    return { destroy() { clearTimeout(t); } };
  },
};
