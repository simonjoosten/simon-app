"""Schrijft tools/shorts/meta-c.json voor alle klaar gerenderde shorts van batch c (mp4 > 1 KB en jpg aanwezig). Draai opnieuw na afloop van run_c_all.sh."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..', '..')
sys.path.insert(0, os.path.join(ROOT, 'tools', 'blender')); import shorts_c_data as D
out = os.path.join(ROOT, 'docs', 'shorts'); m = []
for d in D.S:
    mp = os.path.join(out, d['id'] + '.mp4')
    if os.path.exists(mp) and os.path.getsize(mp) > 1000 and os.path.exists(os.path.join(out, d['id'] + '.jpg')):
        m.append({'id': d['id'], 't': d['t'], 'c': d['c'], 'tags': d['tags'], 's': d['s']})
json.dump(m, open(os.path.join(HERE, 'meta-c.json'), 'w'), ensure_ascii=False, indent=1); print(len(m))
