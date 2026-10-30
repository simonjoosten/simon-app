// Stub van docs/learn/q.js: beantwoordt automatisch volgens globalThis.__ASK.
import { checkAnswer } from './core-stub.mjs';
export function answerFor(q) { if (q.t === 'match') return q.a; if (q.t === 'multi') return q.a; return q.t === 'num' ? q.a : q.a; }
export function ask(host, q, o = {}) {
  const mode = (globalThis.__ASK && globalThis.__ASK.mode) || 'correct'; globalThis.__ASKED = (globalThis.__ASKED || []); globalThis.__ASKED.push({ q, o });
  let wrong = mode === 'wrong' || (mode === 'mix' && (globalThis.__ASKED.length % 3 === 0));
  const given = wrong ? (q.t === 'tf' ? !q.a : q.t === 'num' ? q.a + 1 : q.t === 'mc' ? q.o.find((x) => x !== q.a) : Array.isArray(q.a) ? [] : 'zzz') : answerFor(q);
  const r = checkAnswer(q, given);
  host.textContent = 'ASK:' + q.q;
  let cancelled = false;
  return { promise: new Promise((res) => setTimeout(() => { if (!cancelled) res({ ok: r.ok, ms: 100, given }); else res({ ok: false, ms: 0 }); }, 0)), cancel() { cancelled = true; } };
}
export const renderQ = ask;
