// Node-loader: leidt ./core.js?v=1 en ./q.js?v=1 (vanuit docs/learn/study*.js) om naar de stubs.
const here = new URL('./', import.meta.url);
export function resolve(specifier, context, next) {
  if (context.parentURL && /\/docs\/learn\/study[^/]*\.js/.test(context.parentURL)) {
    if (specifier === './core.js?v=1') return { url: new URL('./core-stub.mjs', here).href, shortCircuit: true };
    if (specifier === './q.js?v=1') return { url: new URL('./q-stub.mjs', here).href, shortCircuit: true };
  }
  return next(specifier, context);
}
