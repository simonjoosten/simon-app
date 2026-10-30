// Node-loader voor de hub-tests: leidt core.js / q.js (stubs), de Firebase-URL (nep-Firestore) en enkele spelbestanden (stubs) om.
// Met LEARN_REAL=1 worden de echte core.js en q.js gebruikt (als ze bestaan).
import { existsSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
const REAL = !!process.env.LEARN_REAL;
const REALCORE = process.env.LEARN_CORE === 'real';   // echte core.js, maar nog wel de stub-q en stub-spellen
export async function resolve(spec, ctx, next) {
  const m = /(?:^|\/)learn\/(core|q)\.js(\?|$)|^\.\/(core|q)\.js(\?|$)/.exec(spec);
  if (m && !REAL && !(REALCORE && (m[1] || m[3]) === 'core')) return { url: pathToFileURL(path.join(here, (m[1] || m[3]) + '.js')).href, shortCircuit: true };
  if (spec.startsWith('https://www.gstatic.com/firebasejs/')) return { url: pathToFileURL(path.join(here, '..', '..', 'docs', 'games', 'fake-firestore.js')).href, shortCircuit: true };
  const g = /^\.\/games\/([^/?]+)\.js(\?|$)/.exec(spec);
  if (g && !REAL && existsSync(path.join(here, 'games', g[1] + '.js'))) return { url: pathToFileURL(path.join(here, 'games', g[1] + '.js')).href, shortCircuit: true };
  // zonder LEARN_REAL bestaan alleen de stub-spellen en _demo: andere spelbestanden tellen als 'ontbreekt'
  if (g && !REAL && g[1] !== '_demo') { const e = new Error(`Cannot find module './games/${g[1]}.js'`); e.code = 'ERR_MODULE_NOT_FOUND'; throw e; }
  return next(spec, ctx);
}
