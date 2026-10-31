"""Gebruik: Blender -b --python shorts_b_run.py -- <preview-frame|0> [id ...]   (zonder id's: alles). Schrijft ook tools/shorts/meta-b.json."""
import sys, os, json, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import shorts_b_lib as L, shorts_b_food, shorts_b_nat
from shorts_b_specs import SP
a = sys.argv[sys.argv.index('--') + 1:]; fr = int(a[0]); ids = a[1:]
meta = [{'id': s[0], 't': s[1], 'c': s[2], 'tags': s[3], 's': s[7]} for s in SP]
json.dump(meta, open(os.path.join(L.sc.ROOT, 'tools', 'shorts', 'meta-b.json'), 'w'), ensure_ascii=False, indent=1)
for s in SP:
    if ids and s[0] not in ids: continue
    t0 = time.time()
    try: L.render_spec(s, preview=fr or None)
    except Exception as e:
        import traceback; traceback.print_exc(); print('FOUT', s[0]); continue
    print('KLAAR', s[0], round(time.time() - t0), 's', flush=True)
