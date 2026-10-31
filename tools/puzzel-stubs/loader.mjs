// Loader voor tools/test-puzzel-ui.mjs: Firebase-URL -> nep-Firestore, spelmodule -> stub-spel.
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
export async function resolve(spec, ctx, next) {
  if (spec.startsWith('https://www.gstatic.com/firebasejs/')) return { url: pathToFileURL(path.join(here, '..', '..', 'docs', 'games', 'fake-firestore.js')).href, shortCircuit: true };
  if (/^\.\/games\/mini\/[a-z]+\.js/.test(spec)) return { url: pathToFileURL(path.join(here, 'game.mjs')).href, shortCircuit: true };
  return next(spec, ctx);
}
