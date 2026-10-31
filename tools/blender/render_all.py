"""Render alle (of de genoemde) icoontjes.  Gebruik:
  ~/Applications/Blender.app/Contents/MacOS/Blender -b --python tools/blender/render_all.py -- [naam ...]
Een model-functie staat in models_a.py of models_b.py (dict MODELS = {naam: functie}); de functie bouwt het object in de lege scene.
Een model mag een dict teruggeven met opties voor finish_and_render: {'rot_z':-25,'tilt':0,'fit':1.0}.
Na afloop wordt docs/art/manifest.js bijgewerkt met alle PNG's die bestaan."""
import sys, os, json, importlib, traceback
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
ROOT = os.path.abspath(os.path.join(HERE, '..', '..')); OUT = os.path.join(ROOT, 'docs', 'art', '3d'); os.makedirs(OUT, exist_ok=True)
import common
models = {}
for modname in ('models_a', 'models_b'):
    try: models.update(importlib.import_module(modname).MODELS)
    except Exception: print('!! kon', modname, 'niet laden'); traceback.print_exc()
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
names = args or sorted(models)
bad = []
for n in names:
    if n not in models: print('onbekend model', n); bad.append(n); continue
    try:
        common.reset(); opt = models[n]() or {}
        common.finish_and_render(os.path.join(OUT, n + '.png'), **{k: v for k, v in opt.items() if k in ('rot_z', 'tilt', 'fit')})
        print('ok', n)
    except Exception:
        print('!! fout bij', n); traceback.print_exc(); bad.append(n)
have = sorted(f[:-4] for f in os.listdir(OUT) if f.endswith('.png'))
with open(os.path.join(ROOT, 'docs', 'art', 'manifest.js'), 'w') as f:
    f.write('// Gegenereerd door tools/blender/render_all.py\nexport const ART3D = ' + json.dumps({'v': 1, 'names': have}) + ';\n')
print('KLAAR', len(have), 'plaatjes;', 'mislukt:', bad)
