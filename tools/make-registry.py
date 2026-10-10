#!/usr/bin/env python3
"""Maakt docs/games/registry.js met alle spel- en clipbestanden."""
import os, sys
root = os.path.join(os.path.dirname(__file__), '..', 'docs', 'games')
def files(d):
    p = os.path.join(root, d)
    return sorted(f[:-3] for f in os.listdir(p) if f.endswith('.js') and not f.startswith('_'))
out = ['// Automatisch gemaakt door tools/make-registry.py, niet met de hand aanpassen.']
for var, d in (('MINIS', 'mini'), ('BIGS', 'big'), ('CLIP_FILES', 'clips')):
    out.append(f'export const {var} = [')
    for f in files(d):
        out.append(f"  () => import('./{d}/{f}.js'),")
    out.append('];')
open(os.path.join(root, 'registry.js'), 'w').write('\n'.join(out) + '\n')
print({d: len(files(d)) for d in ('mini', 'big', 'clips')})
