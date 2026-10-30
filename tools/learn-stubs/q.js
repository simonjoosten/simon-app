// Stub van docs/learn/q.js: lost meteen op. globalThis.__askOk = false laat alles fout gaan.
export function ask(host, q, o = {}) {
  (globalThis.__askLog || (globalThis.__askLog = [])).push({ q: q.q, o });
  return { promise: Promise.resolve({ ok: globalThis.__askOk !== false, ms: 500, given: 'x' }), cancel() {} };
}
export const renderQ = ask;
