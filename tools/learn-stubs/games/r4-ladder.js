// Stub-spel voor de R4-hub-test: speelt 20 goede antwoorden en wint meteen.
export default {
  id: 'r4-ladder', name: 'Regenboogladder (stub)', emoji: '🌈', color: '#06b6d4', desc: 'stub', tags: ['bordspel'], minutes: 5, duo: false,
  create(host, env) {
    const qs = env.pick(20); qs.forEach((q) => env.report({ q, ok: true, ms: 500 }));
    const t = setTimeout(() => env.end({ score: 500, win: true, stats: { correct: 20, wrong: 0, bestStreak: 20 }, summary: 'Stub klaar' }), 5);
    globalThis.__r4stub = { kit: env.kit, level: env.level, seed: env.seed };
    return { destroy() { clearTimeout(t); } };
  },
};
