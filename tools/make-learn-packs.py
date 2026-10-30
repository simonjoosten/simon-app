#!/usr/bin/env python3
"""Genereert docs/learn/packs/index.js uit docs/learn/packs/*.js.

Elk pack-bestand (export default { id, name, emoji, group, desc, lang?, build() }) wordt in node geimporteerd;
id/name/emoji/group/desc/lang en het aantal vragen (build().qs.length) komen in PACKS terecht.
Draaien:  python3 tools/make-learn-packs.py
"""
import json, os, subprocess, sys, textwrap

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACKS = os.path.join(ROOT, 'docs', 'learn', 'packs')
OUT = os.path.join(PACKS, 'index.js')

PROBE = r"""
import { pathToFileURL } from 'node:url';
const files = JSON.parse(process.argv[1]);
const out = [];
for (const f of files) {
  try {
    const m = await import(pathToFileURL(f).href);
    const p = m.default;
    if (!p || !p.id || typeof p.build !== 'function') { out.push({ file: f, error: 'geen geldig pack (id/build ontbreekt)' }); continue; }
    let count = 0;
    try { const k = await p.build(); count = Array.isArray(k && k.qs) ? k.qs.length : 0; } catch (e) { out.push({ file: f, error: 'build() faalde: ' + e.message }); continue; }
    out.push({ file: f, id: String(p.id), name: String(p.name || p.id), emoji: String(p.emoji || '📘'), group: String(p.group || 'Wereld'), desc: String(p.desc || ''), lang: p.lang ? String(p.lang) : '', count });
  } catch (e) { out.push({ file: f, error: 'import faalde: ' + e.message }); }
}
console.log('@@JSON@@' + JSON.stringify(out));
"""

HEADER = r"""// GEGENEREERD door tools/make-learn-packs.py -- niet met de hand aanpassen (draai het script opnieuw).
// PACKS: lijst met kant-en-klare kits. `load()` laadt het pack-bestand lui en geeft de kit terug ({ id, name, emoji, desc, lang, qs }).
// 'tafels-demo' is ingebouwd (geen apart bestand nodig), zodat er altijd minimaal een kit is.

function buildTafelsDemo() {
  const qs = [];
  const near = (n, p, b) => { // plausibele foute opties bij een tafelsom
    const c = [p + b, p - b, p + 1, p - 1, p + 10, p - 10, (n + 1) * b, (n - 1) * b, p + 2, p - 2];
    return [...new Set(c.filter((x) => x > 0 && x !== p))];
  };
  for (let a = 2; a <= 10; a++) {
    for (let b = 2; b <= 10; b++) {
      const p = a * b;
      const d = [2, 5, 10].includes(a) || [2, 5, 10].includes(b) ? 1 : (a >= 7 || b >= 7 ? 3 : 2);
      const k = (a * 7 + b * 3) % 3;
      if (k === 0) {
        const wrong = near(a, p, b).filter((_, i) => (i + a + b) % 2 === 0 || i < 3).slice(0, 3).map(String);
        qs.push({ t: 'mc', q: `${a} × ${b} = ?`, a: String(p), o: [String(p), ...wrong], g: `tafel van ${a}`, d, x: `${a} × ${b} = ${p}` });
      } else if (k === 1) {
        qs.push({ t: 'num', q: `${a} × ${b} = ?`, a: p, g: `tafel van ${a}`, d, x: `${a} × ${b} = ${p}` });
      } else {
        qs.push({ t: 'tf', q: `${a} × ${b} = ${(a + b) % 2 ? p : p + (a % 3) + 1}`, a: (a + b) % 2 === 1, g: `tafel van ${a}`, d, x: `${a} × ${b} = ${p}` });
      }
    }
  }
  for (let p = 2; p <= 10; p++) {
    qs.push({ t: 'order', q: `Zet de tafel van ${p} in de goede volgorde`, a: [1, 2, 3, 4].map((i) => String(p * i)), g: `tafel van ${p}`, d: 1 });
  }
  return { id: 'tafels-demo', name: 'Tafels (demo)', emoji: '✖️', desc: 'De tafels van 2 tot en met 10.', lang: 'nl', group: 'Rekenen', qs };
}

export const PACKS = [
  { id: 'tafels-demo', name: 'Tafels (demo)', emoji: '✖️', group: 'Rekenen', desc: 'De tafels van 2 tot en met 10.', lang: 'nl', count: 90, load: async () => buildTafelsDemo() },
"""

FOOT = "];\n"


def main():
    files = sorted(f for f in os.listdir(PACKS) if f.endswith('.js') and f != 'index.js') if os.path.isdir(PACKS) else []
    paths = [os.path.join(PACKS, f) for f in files]
    items = []
    if paths:
        r = subprocess.run(['node', '--input-type=module', '-e', PROBE, json.dumps(paths)], capture_output=True, text=True, cwd=ROOT)
        line = next((l for l in r.stdout.splitlines() if l.startswith('@@JSON@@')), None)
        if not line:
            print('node gaf geen resultaat:', r.stderr[:500], file=sys.stderr)
            sys.exit(1)
        items = json.loads(line[len('@@JSON@@'):])
    seen = {'tafels-demo'}
    rows = []
    bad = 0
    for it in items:
        name = os.path.basename(it['file'])
        if 'error' in it:
            print('OVERGESLAGEN', name, '-', it['error'], file=sys.stderr); bad += 1; continue
        if it['id'] in seen:
            print('OVERGESLAGEN', name, '- dubbel id', it['id'], file=sys.stderr); bad += 1; continue
        seen.add(it['id'])
        rows.append((name, it))
    rows.sort(key=lambda r: (r[1]['group'], r[1]['name'].lower()))
    out = [HEADER]
    for name, it in rows:
        meta = {k: it[k] for k in ('id', 'name', 'emoji', 'group', 'desc')}
        if it['lang']:
            meta['lang'] = it['lang']
        meta['count'] = it['count']
        js = json.dumps(meta, ensure_ascii=False)[:-1]
        out.append("  %s, load: () => import('./%s?v=1').then((m) => m.default.build()) },\n" % (js, name))
    out.append(FOOT)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(''.join(out))
    print('index.js geschreven: %d packs + ingebouwd (%d overgeslagen)' % (len(rows), bad))


if __name__ == '__main__':
    main()
