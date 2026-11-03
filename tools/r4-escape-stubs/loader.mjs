// Loader voor tools/test-r4-escape.mjs: Firebase-URL -> nep-Firestore in het geheugen.
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
export async function resolve(spec, ctx, next) {
  if (spec.startsWith('https://www.gstatic.com/firebasejs/')) return { url: pathToFileURL(path.join(here, '..', '..', 'docs', 'games', 'fake-firestore.js')).href, shortCircuit: true };
  return next(spec, ctx);
}
