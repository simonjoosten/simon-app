"""Render batch c.  Blender -b --python shorts_c_run.py -- s201 s210   (inclusief bereik; zonder args: alles)
Env: STILLS=frames,.. STILLDIR=map  -> alleen proefplaatjes; FORCE=1 -> bestaande overschrijven."""
import sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shorts_c_lib import *
import shorts_c_data as D

def build(d):
    a = dict(d['a']); t = d['tpl']
    def mk(S):
        if t == 'weetje': weetje(S, **a)
        elif t == 'num': weetje_num(S, a.pop('num'), a.pop('lines'), a.pop('icon'), **a)
        elif t == 'bars': weetje_bars(S, **a)
        elif t == 'quiz': quiz(S, **a)
        else: globals()[{'orbit': 'r_orbit', 'trip': 'r_trip', 'land': 'r_land', 'astro': 'r_astro', 'comet': 'r_comet', 'scale': 'r_scale', 'hole': 'r_hole',
                         'sat': 'r_sat', 'dragon': 'f_dragon', 'wand': 'f_wand', 'chest': 'f_chest', 'castle': 'f_castle', 'potion': 'f_potion', 'unicorn': 'f_unicorn'}[t]](S, **a)
    return mk

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
lo = args[0] if args else 's201'; hi = args[1] if len(args) > 1 else (args[0] if args else 's300')
for d in D.S:
    if not (lo <= d['id'] <= hi): continue
    if not os.environ.get('STILLS') and not os.environ.get('FORCE') and os.path.exists(os.path.join(sc.OUT, d['id'] + '.mp4')): continue
    t0 = time.time(); render_c(d['id'], build(d), BG[d['bg']], d['s']); print('TIME', d['id'], round(time.time() - t0), flush=True)
