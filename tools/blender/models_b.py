"""Groep B: gebouwen, voertuigen, natuur, fantasie, ruimte, gereedschap, muziek."""
import math
import common
from common import *
def M(c, *a, **k):
    if isinstance(c, str) and len(c) == 4: c = '#' + ''.join(ch * 2 for ch in c[1:])
    return mat(c, *a, **k)
S2 = math.sqrt(2)
def _wrap(f):
    def g():
        r = f()
        for o in list(bpy.context.scene.objects):
            if o.hide_render: bpy.data.objects.remove(o, do_unlink=True)
        return r
    return g

NAMES = set(['house', 'castle', 'tower', 'tent', 'barn', 'windmill', 'lighthouse', 'ferriswheel', 'rollercoaster', 'carousel', 'shop', 'school', 'hospital', 'factory', 'skyscraper', 'fountain', 'bridge', 'igloo', 'pyramid', 'car', 'truck', 'bus', 'train', 'plane', 'boat', 'ship', 'tractor', 'foodtruck', 'helicopter', 'bike', 'submarine', 'rocket', 'ufo', 'satellite', 'tree', 'pine', 'palm', 'flower', 'sunflower', 'mushroom', 'cactus', 'rock', 'sun', 'moon', 'cloud', 'rain', 'snowflake', 'flame', 'volcano', 'wave', 'rainbow', 'leaf', 'dragon', 'slime', 'ghost', 'robot', 'alien', 'skull', 'unicorn', 'wizard', 'fairy', 'planet', 'earth', 'comet', 'astronaut', 'dino', 'mermaid', 'hammer', 'pickaxe', 'gear', 'wand', 'map', 'compass', 'flask', 'microscope', 'paint', 'pencil', 'camera', 'piano', 'guitar', 'drum', 'microphone', 'headphones', 'note', 'globe'])

def glass(c, a=0.45):
    m = mat(c, rough=0.05, coat=1.0, alpha=a)
    try: m.surface_render_method = 'BLENDED'
    except Exception: pass
    return m

def eyes(x, y, z, sp=0.2, r=0.12, pup='#1a1a2e'):
    out = []
    for s in (-1, 1):
        out.append(sphere(r, M('#ffffff', 0.2, coat=1), loc=(x + s * sp, y, z)))
        out.append(sphere(r * 0.62, M(pup, 0.1, coat=1), loc=(x + s * sp, y - r * 0.55, z - r * 0.05)))
        out.append(sphere(r * 0.2, M('#ffffff', 0.1, emit=1), loc=(x + s * sp + r * 0.2, y - r * 1.0, z + r * 0.25)))
    return out

def smile(x, y, z, w=0.2, col='#3a1a1a', r=0.025):
    pts = [(x + w * math.cos(math.pi * (1 - t / 8)), y, z - w * 0.7 * math.sin(math.pi * t / 8)) for t in range(9)]
    return curve_tube(pts, r, M(col, 0.4))

def blush(x, y, z, sp=0.3, r=0.07):
    for s in (-1, 1): sphere(r, M('#ff8fa3', 0.5), loc=(x + s * sp, y, z), scale=(1, 0.4, 0.7))

def base(r=1.3, c='#7ed957', z=-0.05):
    cyl(r, 0.1, M(c, 0.7), loc=(0, 0, z), bevel=0.03)

def hip(w, d, h, z, m, over=0.15):
    """pyramidedak, onderkant op z"""
    o = cone(0.7071, 0, h, m, loc=(0, 0, z + h / 2), rot=(0, 0, 45), seg=4); o.scale = (w + over * 2, d + over * 2, 1); return o

def window(x, y, z, w=0.26, h=0.3, c='#8fd8ff', frame='#ffffff'):
    cube((w + 0.07, 0.04, h + 0.07), M(frame, 0.4), loc=(x, y + 0.01, z), bevel=0.02)
    cube((w, 0.04, h), M(c, 0.1, coat=1, emit=0.25), loc=(x, y - 0.015, z), bevel=0.02)

def door(x, y, z, w=0.3, h=0.5, c='#8b4a2b'):
    cube((w, 0.06, h), M(c, 0.4), loc=(x, y, z), bevel=0.04)
    sphere(0.03, M('#ffd23f', 0.2, 1), loc=(x + w * 0.3, y - 0.04, z))

def wheel(x, y, z, r=0.3, w=0.18, tire='#2b2b35', hub='#d9d9e3'):
    cyl(r, w, M(tire, 0.6), loc=(x, y, z), rot=(90, 0, 0), bevel=0.04)
    cyl(r * 0.55, w + 0.03, M(hub, 0.25, 0.6), loc=(x, y, z), rot=(90, 0, 0))

def star_pts(n=5, ro=1, ri=0.45):
    return [((ro if i % 2 == 0 else ri) * math.cos(math.pi * i / n + math.pi / 2), (ro if i % 2 == 0 else ri) * math.sin(math.pi * i / n + math.pi / 2)) for i in range(2 * n)]

def puff(x, y, z, r=0.3, c='#ffffff'): return sphere(r, M(c, 0.8), loc=(x, y, z))

# ===================== GEBOUWEN =====================
def house():
    base(1.4)
    cube((1.4, 1.1, 0.9), M('#fff1c9', 0.6), loc=(0, 0, 0.45), bevel=0.06)
    hip(1.4, 1.1, 0.8, 0.9, M('#e8503a', 0.35, coat=0.6), 0.15)
    cube((0.2, 0.2, 0.5), M('#a85a3a', 0.6), loc=(0.4, 0.15, 1.45), bevel=0.02)
    door(-0.3, -0.56, 0.28); window(0.3, -0.56, 0.5); window(-0.5, -0.56, 0.62, 0.0001, 0.0001) if False else None
    window(0.52, -0.2, 0.5) if False else None
    cube((0.04, 0.3, 0.3), M('#8fd8ff', 0.1, coat=1), loc=(0.72, 0, 0.5), bevel=0.02)
    for x in (-1.0, 0.95): sphere(0.22, M('#4caf50', 0.6), loc=(x, -0.7, 0.2))
    return {'rot_z': -30, 'fit': 1.12}

def castle():
    base(1.7, '#7ed957')
    st = M('#cfd6e6', 0.5); rf = M('#e0457b', 0.3, coat=0.6)
    cube((1.5, 0.9, 1.2), st, loc=(0, 0, 0.6), bevel=0.05)
    for i in range(5): cube((0.2, 0.2, 0.2), st, loc=(-0.65 + i * 0.325, -0.4, 1.3), bevel=0.02)
    cyl(0.28, 1.8, st, loc=(0, 0.05, 0.9 + 0.5), seg=24); cone(0.4, 0, 0.7, rf, loc=(0, 0.05, 2.15))
    for sx in (-1, 1):
        for sy in (-0.45, 0.45):
            cyl(0.3, 1.6, st, loc=(sx * 0.85, sy, 0.8), seg=24)
            cone(0.42, 0, 0.7, rf, loc=(sx * 0.85, sy, 1.95))
            window(0, 0, 0, 0.0001, 0.0001) if False else None
    cube((0.4, 0.06, 0.75), M('#5a3523', 0.5), loc=(0, -0.47, 0.37), bevel=0.04)
    sphere(0.2, M('#5a3523', 0.5), loc=(0, -0.47, 0.75), scale=(1, 0.3, 1))
    cyl(0.02, 0.4, M('#444'), loc=(0, 0.05, 2.7))
    extrude_poly([(0, 0), (0.35, 0.12), (0, 0.25)], 0.03, M('#ffd23f', 0.4), loc=(0.02, 0.05, 2.5), bevel=0)
    for sx in (-1, 1): window(sx * 0.85, -0.78, 1.0, 0.14, 0.25) if False else None
    for sx in (-1, 1): cube((0.1, 0.04, 0.28), M('#2b3350'), loc=(sx * 0.85, -0.77, 1.1), bevel=0.02)
    return {'rot_z': -25, 'tilt': 0}

def tower():
    base(1.2, '#7ed957')
    cone(0.8, 0.12, 2.2, M('#ff5a3c', 0.35, coat=0.6), loc=(0, 0, 1.1))
    for z, r in ((0.7, 0.58), (1.35, 0.4)): cyl(r, 0.18, M('#ffffff', 0.4, coat=0.5), loc=(0, 0, z))
    cyl(0.5, 0.15, M('#ffffff', 0.4), loc=(0, 0, 1.75)); 
    cyl(0.32, 0.5, M('#ff5a3c', 0.35, coat=0.6), loc=(0, 0, 2.05))
    cone(0.36, 0, 0.5, M('#ffffff', 0.4), loc=(0, 0, 2.55)); cyl(0.025, 0.6, M('#888', 0.3, 1), loc=(0, 0, 3.0))
    sphere(0.06, M('#ff2020', 0.2, emit=3), loc=(0, 0, 3.32))
    for a in range(0, 360, 90): cube((0.04, 0.04, 0.12), M('#ffd23f', 0.2, emit=2), loc=(0.31 * math.cos(math.radians(a + 45)), 0.31 * math.sin(math.radians(a + 45)), 2.1))
    return {'rot_z': -20}

def tent():
    base(1.4, '#a0e060')
    cyl(0.9, 0.5, M('#fff6e0', 0.6), loc=(0, 0, 0.25), seg=24)
    c1 = M('#ff4d6d', 0.4, coat=0.5); c2 = M('#fff6e0', 0.5)
    for i in range(8):
        a = i * 45
        o = cone(1.0, 0, 0.9, c1 if i % 2 == 0 else c2, loc=(0, 0, 0.95), seg=8)
    # strepen als wiggen
    for i in range(8):
        a = math.radians(i * 45 + 22.5)
        if i % 2 == 0:
            ob = extrude_poly([(-0.01, 0), (0.36, 0), (0.0, 0.9)], 0.02, c2, loc=(0, 0, 0), bevel=0)
            ob.rotation_euler = (math.radians(0), 0, 0); ob.location = (0, 0, 0)
            ob.hide_render = True
    cone(1.03, 0, 0.92, c1, loc=(0, 0, 0.96), seg=8)
    for i in range(0, 8, 2):
        a = math.radians(i * 45)
        cone(0.4, 0, 0.92 * 0.4, c2, loc=(0.0, 0, 0), seg=3).hide_render = True
    cyl(0.915, 0.12, c1, loc=(0, 0, 0.55), seg=24)
    cube((0.05, 0.5, 0.5), M('#3a2a5a'), loc=(0, 0, 0)).hide_render = True
    ob = extrude_poly([(-0.25, 0), (0.25, 0), (0, 0.5)], 0.06, M('#3a2a5a'), loc=(0, -0.88, 0.02)); ob.scale = (1, 1, 1)
    cyl(0.02, 0.5, M('#555'), loc=(0, 0, 1.65)); extrude_poly([(0, 0), (0.4, 0.12), (0, 0.24)], 0.04, M('#ffd23f'), loc=(0.02, 0, 1.75), bevel=0)
    return {'rot_z': -15}

def barn():
    base(1.5, '#a0e060')
    red = M('#d8362f', 0.45, coat=0.4)
    extrude_poly([(-0.8, 0), (0.8, 0), (0.8, 0.7), (0, 1.3), (-0.8, 0.7)], 1.5, red, loc=(0, 0, 0), bevel=0.04)
    wh = M('#ffffff', 0.4)
    cube((0.6, 0.06, 0.8), wh, loc=(0, -0.77, 0.4), bevel=0.03)
    cube((0.5, 0.07, 0.7), red, loc=(0, -0.78, 0.4), bevel=0.02)
    for a in (35, -35): cube((0.04, 0.08, 0.8), wh, loc=(0, -0.8, 0.4), rot=(0, a, 0))
    cube((0.04, 0.08, 0.68), wh, loc=(0, -0.8, 0.4)); 
    sphere(0.13, M('#ffe9a0', 0.3, emit=0.6), loc=(0, -0.78, 1.0), scale=(1, 0.3, 1))
    cyl(0.3, 0.9, M('#c9ccd6', 0.3, 0.8), loc=(0.95, 0.2, 0.45), seg=24); sphere(0.3, M('#c9ccd6', 0.3, 0.8), loc=(0.95, 0.2, 0.9))
    return {'rot_z': -35, 'fit': 1.12}

def windmill():
    base(1.4, '#a0e060')
    cone(0.65, 0.42, 1.4, M('#fff1d0', 0.6), loc=(0, 0, 0.7), seg=32)
    cone(0.6, 0, 0.6, M('#c0452e', 0.4, coat=0.5), loc=(0, 0, 1.7), seg=32)
    door(0, -0.62, 0.22, 0.3, 0.42)
    window(0, -0.5, 0.95, 0.18, 0.22)
    sphere(0.13, M('#7a4a2a', 0.4), loc=(0, -0.55, 1.5))
    sail = M('#ffffff', 0.5); wood = M('#8b5a33', 0.5)
    for a in (0, 90, 180, 270):
        t = a + 20; ar = math.radians(t); dx, dz = math.sin(ar), math.cos(ar); px, pz = dz, -dx
        cube((0.1, 0.06, 1.3), wood, loc=(dx * 0.65, -0.55, 1.5 + dz * 0.65), rot=(0, t, 0), bevel=0.01)
        cube((0.36, 0.04, 0.7), sail, loc=(dx * 0.85 + px * 0.2, -0.6, 1.5 + dz * 0.85 + pz * 0.2), rot=(0, t, 0), bevel=0.01)
    return {'rot_z': -15}

def lighthouse():
    cyl(1.3, 0.2, M('#3aa7e8', 0.2, coat=1), loc=(0, 0, -0.1)); 
    sphere(0.7, M('#8d8f9c', 0.7), loc=(0.3, 0.2, 0.0), scale=(1.4, 1, 0.6))
    cs = [('#ff4040', 0.0), ('#ffffff', 0.5), ('#ff4040', 1.0), ('#ffffff', 1.5)]
    for i, (c, z) in enumerate(cs):
        r1 = 0.55 - i * 0.07; r2 = r1 - 0.07
        cone(r1, r2, 0.52, M(c, 0.4, coat=0.6), loc=(0, 0, 0.26 + z))
    cyl(0.5, 0.1, M('#333a4a', 0.4, 0.5), loc=(0, 0, 2.05)); torus(0.45, 0.03, M('#333a4a', 0.4), loc=(0, 0, 2.2))
    cyl(0.28, 0.35, M('#ffe36a', 0.1, emit=4), loc=(0, 0, 2.27))
    cone(0.42, 0, 0.45, M('#ff4040', 0.35, coat=0.6), loc=(0, 0, 2.7)); sphere(0.06, M('#333'), loc=(0, 0, 2.97))
    cube((0.14, 0.05, 0.3), M('#8f4a2b'), loc=(0, -0.54, 0.2), bevel=0.02)
    return {'rot_z': -20, 'fit': 0.95}

def ferriswheel():
    base(1.6, '#a0e060')
    cols = ['#ff5a5a', '#ffd23f', '#4cc9f0', '#7bd957', '#c77dff', '#ff9f43']
    torus(1.1, 0.05, M('#ffffff', 0.3, coat=1), loc=(0, 0, 1.4), rot=(90, 0, 0)); torus(0.9, 0.03, M('#ffffff', 0.3), loc=(0, 0, 1.4), rot=(90, 0, 0))
    for i in range(12):
        a = math.radians(i * 30)
        cube((0.03, 0.03, 1.1), M('#e8e8f0', 0.3, 0.5), loc=(0.55 * math.cos(a), 0, 1.4 + 0.55 * math.sin(a)), rot=(0, -(i * 30 - 90) % 360, 0), bevel=0)
    for i in range(6):
        a = math.radians(i * 60 + 15); x = 1.1 * math.cos(a); z = 1.4 + 1.1 * math.sin(a)
        sphere(0.2, M(cols[i], 0.25, coat=1), loc=(x, 0, z - 0.15), scale=(1.1, 0.9, 1))
        cube((0.4, 0.04, 0.03), M('#444'), loc=(x, 0, z + 0.06)) if False else None
    cyl(0.16, 0.5, M('#ffd23f', 0.3, coat=1), loc=(0, 0, 1.4), rot=(90, 0, 0))
    for s in (-1, 1):
        for y in (-0.22, 0.22):
            cube((0.1, 0.1, 1.75), M('#4a5fc1', 0.35, coat=0.5), loc=(s * 0.55, y, 0.7), rot=(0, s * -18, 0), bevel=0.02)
    return {'rot_z': -25, 'fit': 0.95}

def rollercoaster():
    base(1.9, '#a0e060')
    pts = []
    for i in range(0, 41):
        x = -1.6 + i * 0.08
        z = 0.45 + 1.0 * math.exp(-((x + 0.8) ** 2) / 0.18) + 1.35 * math.exp(-((x - 0.45) ** 2) / 0.16)
        pts.append((x, 0, z + 0.1))
    curve_tube(pts, 0.1, M('#e63946', 0.3, coat=1))
    for dy in (-0.14, 0.14): curve_tube([(x, dy, z - 0.1) for x, _, z in pts], 0.035, M('#555a6e', 0.4, 0.5))
    for i in range(1, 40, 2):
        x, _, z = pts[i]
        cube((0.09, 0.09, z - 0.1), M('#ffd23f', 0.4, coat=0.5), loc=(x, 0, (z - 0.1) / 2), bevel=0.02)
    for i in range(1, 40, 6):
        x, _, z = pts[i]; cube((0.07, 0.4, 0.07), M('#ffd23f', 0.4), loc=(x, 0, z - 0.1))
    for i, c in enumerate(('#4cc9f0', '#ff9f43', '#c77dff')):
        x, _, z = pts[27 - i * 3]
        sl = (pts[28 - i * 3][2] - pts[26 - i * 3][2]) / 0.16
        cube((0.3, 0.3, 0.22), M(c, 0.25, coat=1), loc=(x, 0, z + 0.2), rot=(0, -math.degrees(math.atan(sl)), 0), bevel=0.07)
    return {'rot_z': -15, 'tilt': 4}

def carousel():
    base(1.6, '#a0e060')
    cyl(1.15, 0.2, M('#ffd23f', 0.3, coat=1), loc=(0, 0, 0.1))
    cyl(0.18, 1.5, M('#ffffff', 0.3, coat=1), loc=(0, 0, 0.9))
    c1 = M('#ff4d6d', 0.35, coat=0.6)
    cone(1.35, 0.1, 0.7, c1, loc=(0, 0, 1.95))
    torus(1.3, 0.06, M('#ffffff', 0.3, coat=1), loc=(0, 0, 1.62))
    for i in range(8):
        a = math.radians(i * 45); sphere(0.07, M('#ffd23f', 0.2, emit=1.5), loc=(1.3 * math.cos(a), 1.3 * math.sin(a), 1.55))
    sphere(0.12, M('#ffd23f', 0.2, 1), loc=(0, 0, 2.35))
    cols = ['#4cc9f0', '#7bd957', '#c77dff', '#ff9f43']
    for i in range(4):
        a = math.radians(i * 90 + 45); x, y = 0.78 * math.cos(a), 0.78 * math.sin(a)
        cyl(0.03, 1.4, M('#f1f1ff', 0.2, 1), loc=(x, y, 0.85))
        sphere(0.2, M(cols[i], 0.25, coat=1), loc=(x, y, 0.75), scale=(0.9, 1.2, 0.9)); sphere(0.12, M(cols[i], 0.25, coat=1), loc=(x, y, 1.0))
    return {'rot_z': -25, 'tilt': 0}

def shop():
    base(1.5)
    cube((1.6, 1.0, 1.0), M('#ffe4a8', 0.6), loc=(0, 0, 0.5), bevel=0.06)
    cube((1.7, 1.1, 0.14), M('#7a5aa8', 0.4), loc=(0, 0, 1.05), bevel=0.04)
    for i in range(8):
        c = '#ff4d6d' if i % 2 == 0 else '#ffffff'
        cube((0.21, 0.5, 0.05), M(c, 0.5, coat=0.4), loc=(-0.735 + i * 0.21, -0.75, 0.88), rot=(-24, 0, 0), bevel=0.01)
    for i in range(8):
        c = '#ff4d6d' if i % 2 == 0 else '#ffffff'
        sphere(0.105, M(c, 0.5), loc=(-0.735 + i * 0.21, -0.97, 0.76), scale=(1, 0.5, 0.7))
    cube((0.8, 0.04, 0.45), M('#8fd8ff', 0.1, coat=1, emit=0.3), loc=(-0.3, -0.52, 0.42), bevel=0.02)
    door(0.55, -0.52, 0.32, 0.3, 0.6)
    cube((0.7, 0.06, 0.22), M('#ffd23f', 0.3, coat=1), loc=(0, -0.57, 1.3), bevel=0.04)
    sphere(0.07, M('#ff4d6d'), loc=(0, -0.62, 1.3)) 
    return {'rot_z': -30, 'fit': 1.12}

def school():
    base(1.8)
    cube((2.0, 0.9, 0.85), M('#ffb27a', 0.6), loc=(0, 0, 0.425), bevel=0.05)
    cube((2.1, 1.0, 0.1), M('#a85a3a', 0.5), loc=(0, 0, 0.9), bevel=0.03)
    cube((0.6, 0.6, 1.5), M('#ffb27a', 0.6), loc=(0, 0, 0.75), bevel=0.05)
    hip(0.6, 0.6, 0.5, 1.5, M('#3b82f6', 0.35, coat=0.6), 0.1)
    cyl(0.19, 0.04, M('#ffffff', 0.3), loc=(0, -0.32, 1.2), rot=(90, 0, 0)); cube((0.02, 0.02, 0.12), M('#222'), loc=(0, -0.35, 1.23)); cube((0.1, 0.02, 0.02), M('#222'), loc=(0.04, -0.35, 1.2))
    for x in (-0.75, -0.45, 0.45, 0.75): window(x, -0.46, 0.5, 0.2, 0.3, frame='#fff')
    door(0, -0.31, 0.25, 0.3, 0.5, '#3b82f6')
    cyl(0.015, 0.7, M('#888', 0.3, 1), loc=(0.9, 0.1, 1.25)); extrude_poly([(0, 0), (0.3, 0.1), (0, 0.2)], 0.03, M('#ff4040'), loc=(0.92, 0.1, 1.45), bevel=0)
    return {'rot_z': -25, 'fit': 1.12}

def hospital():
    base(1.7)
    w = M('#ffffff', 0.4, coat=0.5); red = M('#e63946', 0.3, coat=1)
    cube((2.0, 0.9, 0.8), w, loc=(0, 0, 0.4), bevel=0.06)
    cube((0.9, 1.0, 1.4), w, loc=(0, -0.02, 0.7), bevel=0.06)
    cube((0.95, 1.05, 0.1), M('#ff8fa3', 0.4), loc=(0, -0.02, 1.43), bevel=0.02)
    cube((0.52, 0.06, 0.15), red, loc=(0, -0.53, 1.05), bevel=0.01); cube((0.15, 0.06, 0.52), red, loc=(0, -0.53, 1.05), bevel=0.01)
    for x in (-0.7, 0.7):
        for z in (0.55,): window(x, -0.46, z, 0.26, 0.28, frame='#cfe8ff')
    door(0, -0.52, 0.3, 0.42, 0.55, '#8fd8ff')
    cube((0.5, 0.12, 0.06), M('#ff8fa3'), loc=(0, -0.6, 0.62), bevel=0.01)
    return {'rot_z': -28, 'fit': 1.2}

def factory():
    base(1.8, '#b0b8c8')
    cube((1.9, 1.0, 0.8), M('#c9714a', 0.6), loc=(0, 0, 0.4), bevel=0.05)
    for i in range(3):
        x = -0.6 + i * 0.6
        extrude_poly([(-0.3, 0), (0.3, 0), (0.3, 0.45)], 1.0, M('#8a8fa8', 0.4, 0.3, coat=0.4), loc=(x, 0, 0.8), bevel=0.02)
        cube((0.3, 0.04, 0.3), M('#8fd8ff', 0.1, emit=0.3), loc=(x, -0.52, 0.45), bevel=0.02)
    for i, x in enumerate((0.75, 0.45)):
        h = 1.2 - i * 0.3
        cyl(0.14, h, M('#d95b3b', 0.4), loc=(x, 0.3, 0.7 + h / 2)); cyl(0.17, 0.1, M('#333a4a'), loc=(x, 0.3, 0.75 + h))
    for x, z, r in ((0.8, 2.15, 0.2), (0.95, 2.45, 0.27), (1.1, 2.85, 0.33)): puff(x + 0.1, 0.3, z - 0.1, r, '#ececf4')
    door(-0.75, -0.51, 0.25, 0.3, 0.5, '#444a68')
    return {'rot_z': -28, 'fit': 1.12}

def skyscraper():
    cyl(1.0, 0.1, M('#cdd3e0', 0.7), loc=(0, 0, -0.05), bevel=0.03)
    cube((1.0, 0.9, 3.0), M('#5a7ad8', 0.15, 0.4, coat=1), loc=(0, 0, 1.5), bevel=0.06)
    cube((0.7, 0.7, 0.3), M('#4863b8', 0.2, 0.4, coat=1), loc=(0, 0, 3.1), bevel=0.04)
    for r in range(8):
        for c in range(3):
            lit = (r * 3 + c * 5) % 4 != 0
            cube((0.22, 0.04, 0.2), M('#ffe58a' if lit else '#cfe8ff', 0.1, emit=1.5 if lit else 0), loc=(-0.3 + c * 0.3, -0.455, 0.3 + r * 0.33), bevel=0.01)
            cube((0.04, 0.2, 0.2), M('#ffe58a' if lit else '#cfe8ff', 0.1, emit=1.5 if lit else 0), loc=(0.505, -0.2 + (c - 1) * 0.25 + 0.1 * 0, 0.3 + r * 0.33), bevel=0.01) if c < 2 else None
    cyl(0.02, 0.6, M('#ddd', 0.2, 1), loc=(0, 0, 3.55)); sphere(0.05, M('#ff2020', 0.2, emit=4), loc=(0, 0, 3.87))
    return {'rot_z': -35, 'tilt': -2, 'fit': 1.0}

def fountain():
    stone = M('#d9d9e8', 0.4, coat=0.4); wat = M('#5bc8ff', 0.05, coat=1, emit=0.3)
    cyl(1.4, 0.35, stone, loc=(0, 0, 0.17), bevel=0.08); cyl(1.25, 0.2, wat, loc=(0, 0, 0.3))
    cyl(0.18, 1.0, stone, loc=(0, 0, 0.8)); cyl(0.7, 0.18, stone, loc=(0, 0, 0.95), bevel=0.06); cyl(0.6, 0.12, wat, loc=(0, 0, 1.02))
    cyl(0.1, 0.5, stone, loc=(0, 0, 1.25)); sphere(0.22, wat, loc=(0, 0, 1.6))
    for i in range(8):
        a = math.radians(i * 45)
        pts = [(0.15 * math.cos(a) * t * 1, 0, 0) for t in range(1)]
        p = [(0.0, 0, 1.6)]
        for t in range(1, 9):
            u = t / 8; p.append((math.cos(a) * 0.9 * u, math.sin(a) * 0.9 * u, 1.6 + 0.5 * math.sin(math.pi * u * 0.85) - 0.3 * u * u * 0))
        for k in range(len(p)): p[k] = (p[k][0], p[k][1], p[k][2])
        curve_tube(p, 0.045, wat)
        sphere(0.07, wat, loc=p[-1])
    return {'rot_z': -20, 'tilt': 5}

def bridge():
    cyl(1.9, 0.2, M('#3aa7e8', 0.15, coat=1), loc=(0, 0, -0.3))
    red = M('#e8452c', 0.35, coat=0.6)
    cube((3.2, 0.5, 0.14), red, loc=(0, 0, 0.35), bevel=0.04)
    for x in (-1.0, 1.0):
        for y in (-0.2, 0.2): cube((0.14, 0.14, 1.9), red, loc=(x, y, 0.95), bevel=0.04)
        cube((0.16, 0.6, 0.12), red, loc=(x, 0, 1.55), bevel=0.03); cube((0.16, 0.6, 0.12), red, loc=(x, 0, 1.15), bevel=0.03)
    for y in (-0.2, 0.2):
        p = []
        for i in range(21):
            x = -1.6 + i * 0.16
            z = 0.4 + 1.1 * ((x / 1.0) ** 2) if abs(x) > 1.0 else 0.5 + 1.1 * (1 - 1) + 0.0
            if abs(x) <= 1.0: z = 0.6 + 0.9 * (x ** 2)
            else: z = 0.6 + 0.9 * 1.0 - 1.05 * (abs(x) - 1.0) ** 1 * 0.8
            p.append((x, y, z))
        curve_tube(p, 0.03, red)
        for i in range(0, 21, 2):
            x, _, z = p[i]; 
            if z > 0.45: cube((0.015, 0.015, z - 0.4), M('#ccc'), loc=(x, y, (z + 0.4) / 2), bevel=0)
    return {'rot_z': -22, 'tilt': 3, 'fit': 1.05}

def igloo():
    cyl(1.6, 0.15, M('#bfe0ff', 0.4, coat=0.5), loc=(0, 0, -0.07), bevel=0.05)
    ice = M('#ffffff', 0.3, coat=0.8)
    prof = [(1.1 * math.cos(math.radians(a)), 1.0 * math.sin(math.radians(a))) for a in range(0, 91, 10)]
    lathe(prof, ice, loc=(0, 0.1, 0), seg=48).scale = (1, 1, 1.25)
    for z in (0.3, 0.6, 0.85):
        r = math.sqrt(max(1 - z ** 2, 0)) * 1.1
        torus(r, 0.02, M('#9cc4ee', 0.5), loc=(0, 0.1, z * 1.25), seg=48, minor=6).scale = (1, 1, 1)
    lathe([(0.55 * math.cos(math.radians(a)), 0.55 * math.sin(math.radians(a))) for a in range(0, 91, 15)], ice, loc=(0, -0.85, 0), seg=32).scale = (1, 1.3, 1)
    sphere(0.3, M('#1d2a4a', 0.6), loc=(0, -1.38, 0.17), scale=(1, 0.25, 1.1))
    for x, y in ((-1.1, -0.7), (1.1, -0.5)): ico(0.2, M('#9fd8ff', 0.15, coat=1), loc=(x, y, 0.1), smooth=False)
    return {'rot_z': -25, 'fit': 1.1}

def pyramid():
    cyl(1.7, 0.15, M('#f2d28b', 0.9), loc=(0, 0, -0.07), bevel=0.05)
    o = cone(0.7071, 0, 1.6, M('#f0b94a', 0.6), loc=(0, 0, 0.8), rot=(0, 0, 45), seg=4); o.scale = (2.0, 2.0, 1)
    for i in range(1, 5):
        z = i * 0.28; s = 2.0 * (1 - z / 1.6)
        c = cube((s + 0.01, s + 0.01, 0.025), M('#d89a2f', 0.7), loc=(0, 0, z), bevel=0.005)
    cube((0.3, 0.06, 0.4), M('#3a2a1a'), loc=(0, -0.97 + 0.02, 0.2)).rotation_euler = (math.radians(-27 * 0), 0, 0)
    puff(1.35, -0.5, 0.0, 0.0001)
    cyl(0.07, 0.5, M('#4caf50', 0.6), loc=(1.35, -0.7, 0.25)); cyl(0.05, 0.25, M('#4caf50', 0.6), loc=(1.5, -0.7, 0.3), rot=(0, 90, 0))
    return {'rot_z': -30}

# ===================== VOERTUIGEN =====================
def car():
    red = M('#ef476f', 0.2, coat=1)
    cube((2.2, 1.05, 0.5), red, loc=(0, 0, 0.5), bevel=0.15)
    cube((1.25, 0.95, 0.5), red, loc=(-0.1, 0, 0.95), bevel=0.18)
    gl = M('#9fe0ff', 0.05, coat=1, emit=0.2)
    cube((0.5, 1.0, 0.32), gl, loc=(-0.45, 0, 0.98), bevel=0.06); cube((0.42, 1.0, 0.32), gl, loc=(0.2, 0, 0.98), bevel=0.06)
    for s in (-1, 1):
        sphere(0.14, M('#fff6b0', 0.1, emit=4), loc=(1.1, s * 0.33, 0.55), scale=(0.5, 1, 1))
        sphere(0.1, M('#ff3030', 0.1, emit=2), loc=(-1.1, s * 0.35, 0.55), scale=(0.5, 1, 1))
    cube((0.1, 0.9, 0.12), M('#cfd3e6', 0.2, 1), loc=(1.12, 0, 0.32), bevel=0.02)
    for x in (-0.7, 0.7):
        for y in (-0.52, 0.52): wheel(x, y, 0.3, 0.32, 0.2)
    return {'rot_z': -35, 'fit': 1.05}

def truck():
    cube((1.3, 1.1, 1.3), M('#2f6fe4', 0.25, coat=0.8), loc=(-0.15, 0, 0), bevel=0.05).hide_render = True
    cube((1.5, 1.1, 0.12), M('#3a3f55', 0.5), loc=(0, 0, 0.42), bevel=0.03)
    cube((1.7, 1.1, 1.0), M('#ffd23f', 0.3, coat=0.8), loc=(-0.55, 0, 1.0), bevel=0.06)
    cube((0.9, 1.1, 0.7), M('#2f6fe4', 0.25, coat=0.8), loc=(0.95, 0, 0.8), bevel=0.1)
    cube((0.5, 1.12, 0.3), M('#9fe0ff', 0.05, coat=1, emit=0.2), loc=(1.05, 0, 1.0), bevel=0.05)
    cube((0.4, 1.0, 0.3), M('#2f6fe4', 0.25, coat=0.8), loc=(1.4, 0, 0.55), bevel=0.05)
    sphere(0.13, M('#fff6b0', 0.1, emit=4), loc=(1.4, -0.35, 0.6)); sphere(0.13, M('#fff6b0', 0.1, emit=4), loc=(1.4, 0.35, 0.6))
    for x in (-1.0, -0.4, 0.95):
        for y in (-0.55, 0.55): wheel(x, y, 0.3, 0.34, 0.22)
    cube((1.2, 0.04, 0.5), M('#ffffff', 0.4), loc=(-0.55, -0.55, 1.0), bevel=0.01); 
    cube((0.3, 0.05, 0.3), M('#ef476f', 0.3), loc=(-0.55, -0.57, 1.0), bevel=0.01)
    return {'rot_z': -35, 'fit': 1.05}

def bus():
    y = M('#ffc233', 0.25, coat=1)
    cube((3.0, 1.05, 1.1), y, loc=(0, 0, 0.8), bevel=0.15)
    cube((3.02, 1.07, 0.1), M('#e8851c', 0.4), loc=(0, 0, 0.5), bevel=0.02)
    gl = M('#9fe0ff', 0.05, coat=1, emit=0.2)
    for i in range(5): cube((0.38, 1.1, 0.4), gl, loc=(-1.0 + i * 0.5, 0, 1.0), bevel=0.05)
    cube((0.05, 0.85, 0.5), gl, loc=(1.5, 0, 0.95), bevel=0.02)
    for s in (-1, 1): sphere(0.12, M('#fff6b0', 0.1, emit=4), loc=(1.5, s * 0.35, 0.58), scale=(0.5, 1, 1))
    for x in (-0.9, 0.9):
        for y_ in (-0.52, 0.52): wheel(x, y_, 0.3, 0.33, 0.2)
    return {'rot_z': -35, 'fit': 1.1}

def train():
    cube((3, 1, 0.1), M('#555a6e', 0.5), loc=(0, 0, 0.1)).hide_render = True
    cyl(0.5, 1.5, M('#3a8dde', 0.25, coat=1), loc=(0.5, 0, 0.85), rot=(0, 90, 0), seg=32)
    cyl(0.52, 0.12, M('#ffd23f', 0.3, 0.5), loc=(1.25, 0, 0.85), rot=(0, 90, 0)); cyl(0.2, 0.05, M('#ffe9a0', 0.1, emit=3), loc=(1.27, 0, 0.9), rot=(0, 90, 0))
    cube((0.95, 1.0, 1.2), M('#e63946', 0.25, coat=1), loc=(-0.55, 0, 0.95), bevel=0.1)
    cube((1.05, 1.08, 0.1), M('#3a3f55', 0.4), loc=(-0.55, 0, 1.6), bevel=0.03)
    cube((0.5, 1.02, 0.4), M('#9fe0ff', 0.05, coat=1, emit=0.2), loc=(-0.55, 0, 1.05), bevel=0.05)
    cyl(0.15, 0.5, M('#2b2b35', 0.4), loc=(0.95, 0, 1.5)); cone(0.25, 0.15, 0.2, M('#2b2b35', 0.4), loc=(0.95, 0, 1.8))
    puff(0.95, 0, 2.1, 0.22); puff(0.75, 0, 2.4, 0.3)
    cone(0.55, 0.0, 0.5, M('#ffd23f', 0.3), loc=(1.35, 0, 0.45), rot=(0, 90, 0)).hide_render = True
    cube((0.3, 0.9, 0.3), M('#3a3f55'), loc=(1.35, 0, 0.35), bevel=0.04)
    for x in (-0.7, -0.15, 0.4, 0.95):
        for y in (-0.52, 0.52): wheel(x, y, 0.3, 0.26 if x < 0 else 0.3, 0.12, '#444a62', '#ffd23f')
    cube((3, 0.05, 0.05), M('#999'), loc=(0.1, -0.52, 0.28)).hide_render = True
    return {'rot_z': -35, 'fit': 1.05}

def plane():
    cyl(0.4, 1.8, M('#ffffff', 0.2, coat=1), loc=(0, 0, 0), rot=(0, 90, 0)).hide_render = True
    sphere(0.45, M('#ffffff', 0.2, coat=1), loc=(0, 0, 0), scale=(2.2, 1, 1))
    sphere(0.28, M('#2f6fe4', 0.2, coat=1), loc=(0.65, -0.18, 0.2), scale=(1.1, 0.8, 0.85)).hide_render = True
    cube((0.3, 0.7, 0.28), M('#9fe0ff', 0.05, coat=1, emit=0.3), loc=(0.55, 0, 0.22), bevel=0.1)
    cube((0.5, 3.0, 0.08), M('#ef476f', 0.25, coat=1), loc=(0.05, 0, -0.05), bevel=0.04)
    cube((0.3, 1.2, 0.06), M('#ef476f', 0.25, coat=1), loc=(-0.85, 0, 0.0), bevel=0.03)
    extrude_poly([(-0.2, 0), (0.15, 0), (-0.15, 0.7)], 0.07, M('#2f6fe4', 0.25, coat=1), loc=(-0.85, 0, 0.3))
    cyl(0.06, 0.1, M('#222'), loc=(1.0, 0, 0), rot=(0, 90, 0)); sphere(0.12, M('#ffd23f', 0.2, coat=1), loc=(1.0, 0, 0))
    cube((0.04, 0.12, 1.0), M('#444'), loc=(1.07, 0, 0), bevel=0.01)
    for i in (-1, 1):
        for x in (0.45, 0.0, -0.45): sphere(0.07, M('#9fe0ff', 0.1, emit=0.5), loc=(x, -0.43, 0.08), scale=(1, 0.3, 1)) if i == 1 else None
    return {'rot_z': -30, 'tilt': 12}

def boat():
    cyl(1.6, 0.2, M('#3aa7e8', 0.1, coat=1), loc=(0, 0, 0.0))
    extrude_poly([(-0.9, 0.3), (0.9, 0.3), (0.65, -0.1), (-0.65, -0.1)], 0.7, M('#ef476f', 0.25, coat=1), loc=(0, 0, 0.0), bevel=0.08)
    cube((1.8, 0.72, 0.06), M('#ffffff', 0.4), loc=(0, 0, 0.3), bevel=0.02)
    cyl(0.04, 2.0, M('#8b5a33', 0.5), loc=(0, 0, 1.3))
    extrude_poly([(0, 0), (0, 1.7), (0.7, 0.0)], 0.05, M('#ffffff', 0.5), loc=(0.07, 0, 0.45), bevel=0.01)
    extrude_poly([(0, 0), (0, 1.3), (-0.55, 0.0)], 0.05, M('#ffd23f', 0.5), loc=(-0.07, 0.0, 0.45), bevel=0.01)
    extrude_poly([(0, 0), (0.3, 0.1), (0, 0.2)], 0.04, M('#ef476f'), loc=(0.0, 0, 2.2), bevel=0)
    return {'rot_z': -25, 'fit': 1.05}

def ship():
    cyl(2.0, 0.2, M('#3aa7e8', 0.1, coat=1), loc=(0, 0, -0.05))
    extrude_poly([(-1.2, 0.5), (1.4, 0.5), (1.0, -0.2), (-1.0, -0.2)], 0.9, M('#2b3a6a', 0.3, coat=1), loc=(0, 0, 0.0), bevel=0.08)
    cube((2.6, 0.92, 0.1), M('#ffffff', 0.4), loc=(0.1, 0, 0.5), bevel=0.02)
    cube((1.4, 0.7, 0.45), M('#ffffff', 0.3, coat=0.6), loc=(-0.15, 0, 0.78), bevel=0.06)
    cube((0.8, 0.6, 0.35), M('#ffffff', 0.3, coat=0.6), loc=(-0.1, 0, 1.15), bevel=0.06)
    for i in range(5): sphere(0.07, M('#9fe0ff', 0.1, emit=0.5), loc=(-0.65 + i * 0.28, -0.36, 0.8), scale=(1, 0.3, 1))
    for x in (-0.25, 0.05): cube((0.14, 0.04, 0.12), M('#9fe0ff', 0.1, emit=0.5), loc=(x, -0.31, 1.17), bevel=0.01)
    for x, c in ((0.75, '#ef476f'), (1.1, '#ffd23f')): cube((0.3, 0.6, 0.35), M(c, 0.3, coat=1), loc=(x, 0, 0.72), bevel=0.04)
    cyl(0.17, 0.5, M('#ef476f', 0.3, coat=1), loc=(-0.15, 0, 1.55)); cyl(0.175, 0.1, M('#222a3a'), loc=(-0.15, 0, 1.8))
    for z in (-0.02, 0.5): pass
    return {'rot_z': -30, 'fit': 1.1}

def tractor():
    gr = M('#3fae4a', 0.25, coat=1)
    cube((1.1, 0.8, 0.5), gr, loc=(0.5, 0, 0.8), bevel=0.1)
    cube((0.8, 0.85, 0.6), gr, loc=(-0.45, 0, 0.95), bevel=0.1).hide_render = True
    cube((0.9, 0.8, 0.1), M('#3a3f55'), loc=(-0.45, 0, 1.75), bevel=0.03)
    for sx in (-1, 1):
        for sy in (-1, 1): cube((0.06, 0.06, 0.7), M('#3a3f55'), loc=(-0.45 + sx * 0.4, sy * 0.38, 1.4))
    cube((0.8, 0.8, 0.8), gr, loc=(-0.45, 0, 1.05), bevel=0.08).hide_render = True
    cube((0.72, 0.62, 0.6), M('#9fe0ff', 0.05, coat=1, emit=0.15), loc=(-0.45, 0, 1.4), bevel=0.05)
    cyl(0.07, 0.5, M('#555a6e', 0.3, 0.6), loc=(0.8, 0.0, 1.35)); 
    wheel(-0.5, -0.5, 0.55, 0.6, 0.35, '#2b2b35', '#ffd23f'); wheel(-0.5, 0.5, 0.55, 0.6, 0.35, '#2b2b35', '#ffd23f')
    wheel(0.85, -0.5, 0.3, 0.32, 0.2, '#2b2b35', '#ffd23f'); wheel(0.85, 0.5, 0.3, 0.32, 0.2, '#2b2b35', '#ffd23f')
    for s in (-1, 1): sphere(0.1, M('#fff6b0', 0.1, emit=4), loc=(1.05, s * 0.28, 0.85), scale=(0.5, 1, 1))
    return {'rot_z': -35, 'fit': 1.05}

def foodtruck():
    c = M('#ff7a45', 0.25, coat=1)
    cube((2.4, 1.1, 1.3), c, loc=(0, 0, 0.9), bevel=0.15)
    cube((0.9, 1.0, 0.8), c, loc=(1.4, 0, 0.7), bevel=0.12)
    cube((0.4, 1.02, 0.35), M('#9fe0ff', 0.05, coat=1, emit=0.2), loc=(1.45, 0, 1.0), bevel=0.05)
    cube((1.2, 0.04, 0.6), M('#2b2b35', 0.5), loc=(-0.25, -0.56, 1.0), bevel=0.02)
    for i in range(6):
        cube((0.22, 0.5, 0.05), M('#ffffff' if i % 2 else '#ef476f', 0.5), loc=(-0.78 + i * 0.22 + 0.0, -0.8, 1.45), rot=(-22, 0, 0), bevel=0.01)
    cube((0.7, 0.05, 0.18), M('#ffd23f', 0.3, coat=1), loc=(-0.25, -0.58, 0.55), bevel=0.02)
    sphere(0.28, M('#ffc0e0', 0.4), loc=(-0.25, 0, 1.95)); cone(0.2, 0.0, 0.4, M('#f0b05a', 0.5), loc=(-0.25, 0, 1.6), rot=(180, 0, 0)).hide_render = True
    cone(0.22, 0.0, 0.45, M('#f0b05a', 0.5), loc=(-0.25, 0, 1.75), rot=(180, 0, 0)); sphere(0.07, M('#ef476f'), loc=(-0.25, 0, 2.2))
    sphere(0.09, M('#ef476f', 0.3), loc=(-0.25, 0, 2.23)).hide_render = True
    for x in (-0.7, 1.35):
        for y in (-0.52, 0.52): wheel(x, y, 0.3, 0.33, 0.2)
    sphere(0.12, M('#fff6b0', 0.1, emit=4), loc=(1.86, -0.3, 0.55), scale=(0.5, 1, 1))
    return {'rot_z': -35, 'fit': 1.0}

def helicopter():
    r = M('#ef476f', 0.2, coat=1)
    sphere(0.8, r, loc=(0, 0, 0.2), scale=(1.1, 0.8, 0.9))
    sphere(0.55, M('#9fe0ff', 0.05, coat=1, emit=0.25), loc=(0.5, -0.1, 0.3), scale=(0.8, 0.8, 0.8))
    cone(0.25, 0.1, 1.5, r, loc=(-1.3, 0, 0.45), rot=(0, -90, 0))
    cube((0.1, 0.05, 0.5), r, loc=(-2.0, 0, 0.7), bevel=0.01).hide_render = True
    cube((0.3, 0.06, 0.4), r, loc=(-1.95, 0, 0.6), rot=(0, -25, 0), bevel=0.02)
    cyl(0.07, 0.4, M('#444'), loc=(0, 0, 1.2)); 
    for a in (20, 110, 200, 290):
        ar = math.radians(a); cube((1.5, 0.15, 0.04), M('#ffd23f', 0.3, coat=1), loc=(math.cos(ar) * 0.7, math.sin(ar) * 0.7, 1.42), rot=(0, 0, a), bevel=0.01)
    sphere(0.1, M('#444'), loc=(0, 0, 1.43))
    for y in (-0.5, 0.5):
        cyl(0.04, 1.5, M('#555a6e', 0.4, 0.5), loc=(0.1, y, -0.5), rot=(0, 90, 0))
        for x in (-0.3, 0.5): cyl(0.03, 0.4, M('#555a6e', 0.4, 0.5), loc=(x, y * 0.85, -0.35))
    return {'rot_z': -30, 'tilt': 10}

def bike():
    for x in (-0.9, 0.9):
        torus(0.55, 0.06, M('#2b2b35', 0.6), loc=(x, 0, 0.55), rot=(90, 0, 0)); torus(0.42, 0.015, M('#d9d9e3', 0.2, 1), loc=(x, 0, 0.55), rot=(90, 0, 0), minor=6)
        sphere(0.07, M('#d9d9e3', 0.2, 1), loc=(x, 0, 0.55))
    fr = M('#ef476f', 0.2, coat=1)
    for pts in ([(-0.9, 0, 0.55), (-0.25, 0, 0.55), (0.25, 0, 1.15)], [(-0.25, 0, 0.55), (-0.45, 0, 1.15), (0.25, 0, 1.15)], [(-0.25, 0, 0.55), (0.25, 0, 1.15), (0.55, 0, 0.55)], [(-0.45, 0, 1.15), (-0.9, 0, 0.55)], [(0.25, 0, 1.15), (0.9, 0, 0.55)]):
        curve_tube(pts, 0.05, fr)
    curve_tube([(0.25, 0, 1.15), (0.3, 0, 1.4), (0.2, 0, 1.45)], 0.04, M('#2b2b35')); cube((0.05, 0.7, 0.05), M('#2b2b35'), loc=(0.3, 0, 1.45))
    cube((0.35, 0.16, 0.08), M('#ffd23f', 0.3, coat=1), loc=(-0.5, 0, 1.25), bevel=0.03)
    cyl(0.14, 0.05, M('#d9d9e3', 0.2, 1), loc=(-0.25, 0, 0.55), rot=(90, 0, 0))
    cube((0.1, 0.06, 0.04), M('#2b2b35'), loc=(-0.25, -0.12, 0.55)) 
    sphere(0.09, M('#fff6b0', 0.1, emit=3), loc=(0.35, -0.1, 1.5)) if False else None
    cyl(0.1, 0.12, M('#fff6b0', 0.1, emit=3), loc=(0.6, 0, 1.2), rot=(0, 90, 0)) if False else None
    return {'rot_z': -35, 'fit': 1.0}

def submarine():
    cyl(1.9, 0.2, M('#3aa7e8', 0.1, coat=1), loc=(0, 0, -0.9)).hide_render = True
    y = M('#ffc233', 0.2, coat=1)
    sphere(1.0, y, loc=(0, 0, 0), scale=(1.4, 0.8, 0.75))
    cyl(0.2, 0.5, y, loc=(0.1, 0, 0.7)); cube((0.5, 0.35, 0.06), y, loc=(0.1, 0, 0.98), bevel=0.02) if False else None
    cyl(0.025, 0.4, M('#555a6e', 0.3, 1), loc=(0.35, 0, 1.1)); cyl(0.025, 0.2, M('#555a6e', 0.3, 1), loc=(0.45, 0, 1.28), rot=(0, 90, 0))
    cyl(0.12, 0.08, y, loc=(0.1, 0, 0.97))
    for x in (-0.7, -0.15, 0.7):
        sphere(0.2, M('#ffffff', 0.2, 0.5), loc=(x, -0.56, 0.05), scale=(1, 0.4, 1)); sphere(0.15, M('#9fe0ff', 0.05, coat=1, emit=0.5), loc=(x, -0.61, 0.05), scale=(1, 0.3, 1))
    sphere(0.16, M('#ef476f', 0.3, coat=1), loc=(-1.45, 0, 0), scale=(1, 1, 1))
    for a in (0, 90): cube((0.08, 0.5, 0.12), M('#ef476f', 0.3, coat=1), loc=(-1.5, 0, 0), rot=(a, 0, 0))
    for z in (0.4, -0.4): cube((0.3, 0.05, 0.3), M('#ef476f', 0.3, coat=1), loc=(-1.1, 0, z * 0.8)).hide_render = True
    return {'rot_z': -25, 'tilt': 4, 'fit': 1.12}

def rocket():
    body = lathe([(0.0, -0.9), (0.45, -0.85), (0.62, -0.4), (0.62, 0.3), (0.5, 0.9), (0.25, 1.35), (0.0, 1.55)], M('#ffffff', 0.15, coat=1))
    cone(0.5, 0.0, 0.8, M('#ef476f', 0.2, coat=1), loc=(0, 0, 1.5)).hide_render = True
    lathe([(0.0, 1.0), (0.4, 1.0), (0.24, 1.42), (0.12, 1.58), (0.0, 1.62)], M('#ef476f', 0.2, coat=1), seg=40) if False else None
    cyl(0.28, 0.1, M('#ffd23f', 0.2, 0.6), loc=(0, -0.45, 0.45), rot=(90, 0, 0)).hide_render = True
    torus(0.27, 0.07, M('#ffd23f', 0.2, 0.5), loc=(0, -0.6, 0.55), rot=(90, 0, 0))
    sphere(0.24, M('#6fd3ff', 0.05, coat=1, emit=0.4), loc=(0, -0.57, 0.55), scale=(1, 0.5, 1))
    for a in (90, 210, 330):
        ar = math.radians(a)
        o = extrude_poly([(0, 0), (0.5, -0.1), (0.5, -0.5), (0, 0.5)], 0.08, M('#ef476f', 0.2, coat=1), loc=(0, 0, -0.35)); o.location = (0, 0, -0.35)
        o.rotation_euler = (0, 0, ar); 
        o.parent = None
        o.location = (0.55 * math.cos(ar) - 0.04 * -math.sin(ar), 0.55 * math.sin(ar), -0.35)
    # vlam
    cone(0.35, 0.0, 0.9, M('#ffb020', 0.3, emit=3), loc=(0, 0, -1.4), rot=(180, 0, 0)); cone(0.2, 0.0, 0.6, M('#fff2a0', 0.3, emit=4), loc=(0, 0, -1.2), rot=(180, 0, 0))
    cyl(0.3, 0.2, M('#555a6e', 0.3, 0.8), loc=(0, 0, -0.95))
    return {'rot_z': -20, 'tilt': -3}

def ufo():
    body = lathe([(0.0, -0.4), (0.5, -0.42), (1.2, -0.25), (1.5, 0.05), (1.2, 0.3), (0.6, 0.42), (0.0, 0.28)], M('#8a7cff', 0.15, 0.5, coat=1))
    sphere(0.6, M('#7ee8a8', 0.05, coat=1, emit=0.5), loc=(0, 0, 0.25), scale=(1, 1, 0.9))
    eyes(0, -0.45, 0.35, 0.18, 0.09) if False else None
    sphere(0.22, M('#5ccf7a', 0.4), loc=(0, 0, 0.3), scale=(1, 1, 1.1)); 
    for s in (-1, 1): sphere(0.07, M('#111'), loc=(s * 0.09, -0.17, 0.35), scale=(1, 0.5, 1.4))
    for i in range(8):
        a = math.radians(i * 45 + 20); c = ['#ff4d6d', '#ffd23f', '#4cc9f0', '#7bd957'][i % 4]
        sphere(0.1, M(c, 0.2, emit=3), loc=(1.18 * math.cos(a), 1.18 * math.sin(a), 0.0))
    for a in (90, 210, 330): sphere(0.1, M('#8a90a8', 0.3, 0.8), loc=(0.55 * math.cos(math.radians(a)), 0.55 * math.sin(math.radians(a)), -0.4)); cyl(0.03, 0.3, M('#8a90a8', 0.3, 0.8), loc=(0.55 * math.cos(math.radians(a)), 0.55 * math.sin(math.radians(a)), -0.3))
    return {'rot_z': -20, 'tilt': 22, 'fit': 1.12}

def satellite():
    gold = M('#ffcf40', 0.25, 0.9, coat=1)
    cube((0.8, 0.8, 0.9), gold, loc=(0, 0, 0), bevel=0.08)
    for s in (-1, 1):
        cube((1.1, 0.05, 0.75), M('#2c5fdd', 0.1, 0.4, coat=1), loc=(s * 1.45, 0, 0), bevel=0.02)
        cube((0.02, 0.06, 0.75), M('#9fd0ff', 0.2), loc=(s * 1.45 + 0.37, -0.03, 0), bevel=0).hide_render = True
        for i in (-1, 0, 1): cube((0.03, 0.06, 0.75), M('#d6e6ff', 0.2), loc=(s * 1.45 + i * 0.36, -0.03, 0), bevel=0)
        cube((0.9, 0.06, 0.03), M('#d6e6ff', 0.2), loc=(s * 1.45, -0.03, 0))
        cyl(0.04, 0.4, M('#aaa', 0.3, 1), loc=(s * 0.7, 0, 0), rot=(0, 90, 0))
    cyl(0.05, 0.3, M('#aaa', 0.3, 1), loc=(0, 0, 0.6))
    cone(0.45, 0.05, 0.3, M('#e8ecf8', 0.2, 0.5, coat=1), loc=(0, -0.55, 0.15), rot=(90, 0, 0)).hide_render = True
    cyl(0.35, 0.1, M('#e8ecf8', 0.2, 0.5, coat=1), loc=(0, -0.5, 0.0), rot=(90, 0, 0)); sphere(0.08, M('#ff4040', 0.2, emit=4), loc=(0, -0.56, 0.0))
    sphere(0.08, M('#ff4040', 0.2, emit=3), loc=(0, 0, 0.78))
    return {'rot_z': -30, 'tilt': 10}

# ===================== NATUUR & WEER =====================
def crescent(R, ri, d, n=28):
    x = (R * R - ri * ri + d * d) / (2 * d); z = math.sqrt(R * R - x * x)
    th = math.atan2(z, x); ph = math.atan2(z, x - d)
    pts = [(R * math.cos(th + (2 * math.pi - 2 * th) * i / n), R * math.sin(th + (2 * math.pi - 2 * th) * i / n)) for i in range(n + 1)]
    pts += [(d + ri * math.cos(2 * math.pi - ph - (2 * math.pi - 2 * ph) * i / n), ri * math.sin(2 * math.pi - ph - (2 * math.pi - 2 * ph) * i / n)) for i in range(1, n)]
    return pts

def tree():
    base(1.3, '#8ee06a')
    cyl(0.2, 1.1, M('#8b5a33', 0.7), loc=(0, 0, 0.55), scale=(1, 1, 1)); cone(0.3, 0.2, 0.2, M('#8b5a33', 0.7), loc=(0, 0, 0.1))
    g = ['#3fbf4a', '#4fd35a', '#35aa42']
    for (x, y, z, r, c) in ((0, 0, 1.55, 0.85, 0), (-0.55, 0.05, 1.3, 0.55, 2), (0.55, 0.0, 1.3, 0.55, 1), (0.1, 0.25, 2.05, 0.55, 1), (0, -0.35, 1.3, 0.55, 0)):
        sphere(r, M(g[c], 0.5, coat=0.3), loc=(x, y, z))
    for x, z in ((-0.35, 1.2), (0.4, 1.65), (0.1, 2.0)): sphere(0.09, M('#ff4040', 0.2, coat=1), loc=(x, -0.62 - (0.05 if z > 1.9 else 0) * 0, z - 0.0))
    return {'rot_z': -20, 'fit': 1.0}

def pine():
    base(1.2, '#a8e8ff') if False else base(1.2, '#8ee06a')
    cyl(0.18, 0.5, M('#8b5a33', 0.7), loc=(0, 0, 0.25))
    for i, (r, z) in enumerate(((0.95, 0.55), (0.75, 1.1), (0.55, 1.6))):
        cone(r, 0.0, 0.95, M(['#2a9d5c', '#33b36b', '#3fc778'][i], 0.5, coat=0.3), loc=(0, 0, z + 0.4))
    sphere(0.12, M('#ffd23f', 0.2, emit=2), loc=(0, 0, 2.5))
    for x, y, z in ((0.3, -0.55, 0.9), (-0.35, -0.4, 1.45), (0.15, -0.35, 1.95)): sphere(0.08, M('#ff5a5a', 0.2, coat=1), loc=(x, y, z))
    return {'rot_z': -20}

def palm():
    cyl(1.3, 0.15, M('#ffe08a', 0.9), loc=(0, 0, -0.07), bevel=0.04)
    pts = [(0, 0, 0), (0.1, 0, 0.6), (0.35, 0, 1.2), (0.55, 0, 1.8)]
    curve_tube(pts, 0.2, M('#a87a4a', 0.7))
    for i in range(5): torus(0.14, 0.03, M('#8b5a33', 0.7), loc=(0.07 + 0.12 * i, 0, 0.35 + 0.3 * i + 0.0), rot=(0, 0, 0))
    top = (0.55, 0, 1.85)
    for k in range(7):
        a = k * 360 / 7 + 10; ar = math.radians(a); p = 30
        L = 0.9
        cx = top[0] + math.cos(ar) * L * math.cos(math.radians(p)); cy = math.sin(ar) * L * math.cos(math.radians(p)); cz = top[2] - L * math.sin(math.radians(p)) + 0.05
        sphere(1, M(['#2fb54a', '#3fc95a'][k % 2], 0.5), loc=(cx, cy, cz), scale=(1.0, 0.3, 0.06), rot=(0, p, a))
    for k in range(2): sphere(0.14, M('#8b5a33', 0.6), loc=(0.55 + 0.1 * k, -0.15 * (k + 1), 1.72))
    return {'rot_z': -20, 'fit': 1.1}

def flower():
    base(1.1, '#8ee06a')
    curve_tube([(0, 0, 0), (0.05, 0, 0.6), (0, 0, 1.2)], 0.07, M('#3fbf4a', 0.5))
    for s in (-1, 1): sphere(1, M('#4fd35a', 0.5), loc=(s * 0.3, 0, 0.55), scale=(0.3, 0.08, 0.12), rot=(0, -s * 30, 0))
    for i in range(7):
        a = math.radians(i * 360 / 7 + 10)
        sphere(0.33, M('#ff6fa5', 0.3, coat=0.8), loc=(0.5 * math.cos(a), -0.02, 1.4 + 0.5 * math.sin(a)), scale=(1, 0.5, 1))
    sphere(0.3, M('#ffd23f', 0.35, coat=0.6), loc=(0, -0.1, 1.4), scale=(1, 0.7, 1))
    return {'rot_z': -15, 'fit': 1.0}

def sunflower():
    base(1.1, '#8ee06a')
    curve_tube([(0, 0, 0), (0.0, 0, 0.7), (0, 0, 1.3)], 0.08, M('#3fbf4a', 0.5))
    for s in (-1, 1): sphere(1, M('#4fd35a', 0.5), loc=(s * 0.35, 0, 0.5), scale=(0.36, 0.08, 0.16), rot=(0, -s * 30, 0))
    for layer, (n, rad, off) in enumerate(((16, 0.62, 0), (16, 0.55, 11))):
        for i in range(n):
            a = math.radians(i * 360 / n + off)
            sphere(0.3, M('#ffc61a' if layer == 0 else '#ffd84a', 0.3, coat=0.6), loc=(rad * math.cos(a), -0.05 + layer * 0.04 * -1, 1.45 + rad * math.sin(a)), scale=(1, 0.3, 0.4), rot=(0, -math.degrees(a), 0))
    sphere(0.4, M('#6b3a1e', 0.6), loc=(0, -0.12, 1.45), scale=(1, 0.5, 1))
    for i in range(10):
        a = math.radians(i * 137.5); rr = 0.06 + 0.032 * i
        sphere(0.04, M('#3d1f0e', 0.5), loc=(rr * math.cos(a) * 1.0, -0.3, 1.45 + rr * math.sin(a)))
    return {'rot_z': -15, 'fit': 1.0}

def mushroom():
    cyl(1.2, 0.12, M('#8ee06a', 0.7), loc=(0, 0, -0.06), bevel=0.04)
    lathe([(0.0, 0.0), (0.42, 0.0), (0.33, 0.3), (0.28, 0.8), (0.0, 0.85)], M('#fff0d0', 0.5))
    sphere(1.0, M('#ee3a3a', 0.25, coat=1), loc=(0, 0, 0.95), scale=(1, 1, 0.7))
    cyl(0.98, 0.04, M('#ffe3b0', 0.5), loc=(0, 0, 0.93)).hide_render = True
    for (x, y, r) in ((-0.35, -0.55, 0.18), (0.4, -0.5, 0.16), (0.0, -0.2, 0.2), (-0.15, -0.8, 0.0001), (0.65, -0.1, 0.13), (-0.65, -0.1, 0.14), (0.15, 0.5, 0.18)):
        z = 0.95 + 0.7 * math.sqrt(max(1 - x * x - y * y, 0))
        sphere(r, M('#ffffff', 0.3, coat=0.5), loc=(x, y, z - 0.03), scale=(1, 1, 0.5))
    eyes(0, -0.29, 0.55, 0.12, 0.07); smile(0, -0.3, 0.42, 0.08)
    return {'rot_z': -15, 'tilt': 5}

def cactus():
    pot = lathe([(0.0, 0.0), (0.45, 0.0), (0.58, 0.45), (0.65, 0.5), (0.65, 0.58), (0.0, 0.58)], M('#e07a4a', 0.6), loc=(0, 0, 0))
    g = M('#3fbf5a', 0.45, coat=0.4)
    cyl(0.42, 1.2, g, loc=(0, 0, 1.15), seg=24); sphere(0.42, g, loc=(0, 0, 1.75))
    for s in (-1, 1):
        curve_tube([(s * 0.35, 0, 1.0), (s * 0.7, 0, 1.0), (s * 0.78, 0, 1.45)], 0.17, g); sphere(0.17, g, loc=(s * 0.78, 0, 1.47)); sphere(0.17, g, loc=(s * 0.7, 0, 1.0)) if False else None
    for i in range(4):
        sphere(0.025, M('#fff3b0', 0.4), loc=(0, 0, 0)).hide_render = True
    eyes(0, -0.38, 1.35, 0.17, 0.09); smile(0, -0.4, 1.2, 0.1)
    for s in (-1, 1): sphere(0.08, M('#ff8fa3', 0.5), loc=(s * 0.3, -0.38, 1.2), scale=(1, 0.4, 0.7))
    sphere(0.16, M('#ff5a9d', 0.3, coat=1), loc=(0, 0, 2.15), scale=(1, 1, 0.8)); sphere(0.07, M('#ffd23f'), loc=(0, 0, 2.2))
    return {'rot_z': -15, 'fit': 1.0}

def rock():
    cyl(1.4, 0.12, M('#8ee06a', 0.8), loc=(0, 0, -0.06), bevel=0.04)
    for (x, y, z, r, sc, rz, c) in ((0, 0, 0.55, 0.95, (1.1, 1, 0.8), 20, '#9aa3b8'), (-0.85, -0.2, 0.3, 0.5, (1, 1, 0.8), 70, '#8a93a8'), (0.8, -0.35, 0.28, 0.45, (1, 1, 0.8), 10, '#aab2c6'), (0.35, 0.6, 0.35, 0.4, (1, 1, 0.9), 0, '#8a93a8')):
        ico(r, M(c, 0.7), loc=(x, y, z), sub=2, scale=sc, rot=(10, 0, rz))
    sphere(0.3, M('#5fc457', 0.7), loc=(0.0, -0.3, 1.05), scale=(1.2, 1, 0.5)); 
    return {'rot_z': -20, 'fit': 1.0}

def sun():
    for i in range(12):
        a = math.radians(i * 30); L = 0.55
        cone(0.2, 0.0, L, M('#ffb020', 0.3, emit=1.5), loc=(1.25 * math.sin(a), 0, 1.25 * math.cos(a)), rot=(0, math.degrees(a), 0))
    sphere(1.0, M('#ffd21f', 0.3, coat=0.8, emit=1.0), loc=(0, 0, 0))
    eyes(0, -0.88, 0.15, 0.32, 0.14); smile(0, -0.94, -0.2, 0.28)
    for s in (-1, 1): sphere(0.11, M('#ff8a5c', 0.5), loc=(s * 0.58, -0.82, -0.12), scale=(1, 0.4, 0.7))
    return {'rot_z': 0, 'fit': 1.0}

def moon():
    pts = crescent(1.0, 0.82, 0.5)
    extrude_poly(pts, 0.55, M('#ffe58a', 0.3, coat=1, emit=0.8), loc=(0, 0, 0), bevel=0.14)
    for x, z, r in ((0.55, 0.65, 0.17), (0.85, -0.1, 0.12), (0.75, -0.6, 0.18)): pass
    extrude_poly([(x * 0.22, y * 0.22) for x, y in star_pts()], 0.14, M('#fff6b0', 0.2, emit=3), loc=(0.55, -0.1, 0.35), bevel=0.02)
    extrude_poly([(x * 0.14, y * 0.14) for x, y in star_pts()], 0.12, M('#fff6b0', 0.2, emit=3), loc=(0.3, -0.1, -0.5), bevel=0.02)
    eyes(-0.62, -0.32, 0.2, 0.0, 0.0001) if False else None
    sphere(0.06, M('#4a3a1a'), loc=(-0.72, -0.3, 0.2), scale=(1, 0.4, 1.3)); smile(-0.72, -0.3, -0.05, 0.1)
    return {'rot_z': 0, 'fit': 1.0}

def cloud():
    w = M('#ffffff', 0.5, coat=0.4)
    for x, z, r in ((-0.7, -0.05, 0.5), (-0.25, 0.3, 0.65), (0.4, 0.2, 0.7), (0.85, -0.1, 0.45), (0.1, -0.15, 0.55)): sphere(r, w, loc=(x, 0, z))
    eyes(0.05, -0.55, 0.0, 0.25, 0.1); smile(0.05, -0.6, -0.18, 0.12)
    for s in (-1, 1): sphere(0.09, M('#ffb0c0', 0.5), loc=(0.05 + s * 0.45, -0.55, -0.12), scale=(1, 0.4, 0.7))
    return {'rot_z': 0, 'fit': 1.0}

def rain():
    w = M('#b8c4dc', 0.5, coat=0.4)
    for x, z, r in ((-0.7, 0.55, 0.45), (-0.25, 0.9, 0.58), (0.4, 0.8, 0.6), (0.85, 0.5, 0.42), (0.1, 0.5, 0.5)): sphere(r, w, loc=(x, 0, z))
    for x, z in ((-0.7, -0.1), (-0.25, -0.6), (0.2, -0.05), (0.6, -0.6), (-0.4, 0.0 - 1.0 * 0)):
        d = M('#3aa7ff', 0.1, coat=1, emit=0.4)
        sphere(0.14, d, loc=(x, -0.1, z), scale=(1, 0.8, 1.1)); cone(0.11, 0.0, 0.26, d, loc=(x, -0.1, z + 0.2))
    return {'rot_z': 0, 'fit': 1.0}

def snowflake():
    ice = M('#bfe8ff', 0.15, coat=1, emit=0.5)
    for ang in (0, 60, 120):
        cube((2.0, 0.16, 0.16), ice, loc=(0, 0, 0), rot=(0, ang, 0), bevel=0.05)
        th = math.radians(ang)
        for sg in (-1, 1):
            for t in (0.45, 0.8):
                px, pz = math.cos(th) * t * sg, -math.sin(th) * t * sg
                for bb in (55, -55):
                    ph = math.radians(ang + bb); bx, bz = math.cos(ph) * sg, -math.sin(ph) * sg
                    L = 0.5 if t < 0.6 else 0.36
                    cube((L, 0.13, 0.13), ice, loc=(px + bx * L / 2, 0, pz + bz * L / 2), rot=(0, ang + bb if sg > 0 else ang + bb, 0), bevel=0.04)
    cyl(0.32, 0.2, M('#ffffff', 0.2, coat=1, emit=0.5), loc=(0, 0, 0), rot=(90, 0, 0), seg=6)
    return {'rot_z': 0, 'fit': 1.0}

def flame():
    def fl(prof, c, e, loc=(0, 0, 0), sc=(1, 0.65, 1), rot=(0, 0, 0)):
        o = lathe(prof, M(c, 0.3, coat=1, emit=e), loc=loc, rot=rot); o.scale = sc; return o
    fl([(0.0, 0.0), (0.45, 0.05), (0.7, 0.5), (0.6, 1.0), (0.35, 1.5), (0.0, 2.2)], '#ff4d1a', 1.0)
    fl([(0.0, 0.0), (0.25, 0.05), (0.38, 0.4), (0.25, 0.85), (0.0, 1.35)], '#ff6a1a', 1.2, loc=(-0.62, -0.05, 0.1), rot=(0, 18, 0))
    fl([(0.0, 0.0), (0.25, 0.05), (0.38, 0.4), (0.25, 0.85), (0.0, 1.2)], '#ff6a1a', 1.2, loc=(0.62, -0.05, 0.1), rot=(0, -18, 0))
    fl([(0.0, 0.02), (0.38, 0.08), (0.52, 0.45), (0.4, 0.9), (0.15, 1.35), (0.0, 1.65)], '#ffa41a', 2, loc=(0, -0.2, 0))
    fl([(0.0, 0.05), (0.24, 0.1), (0.32, 0.35), (0.2, 0.7), (0.0, 0.95)], '#ffe45a', 3, loc=(0, -0.38, 0))
    eyes(0, -0.62, 0.62, 0.12, 0.09)
    return {'rot_z': 0, 'fit': 1.0}

def volcano():
    cyl(1.8, 0.15, M('#8ee06a', 0.8), loc=(0, 0, -0.07), bevel=0.04)
    cone(1.5, 0.55, 1.5, M('#8a5a44', 0.7), loc=(0, 0, 0.75))
    cyl(0.55, 0.12, M('#ff5a1a', 0.2, emit=4), loc=(0, 0, 1.5))
    sphere(0.5, M('#ff7a1a', 0.2, emit=3), loc=(0, 0, 1.52), scale=(1, 1, 0.35))
    curve_tube([(0.25, -0.35, 1.5), (0.5, -0.65, 1.0), (0.6, -0.95, 0.5), (0.65, -1.2, 0.08)], 0.11, M('#ff6a1a', 0.2, emit=3))
    curve_tube([(-0.25, -0.3, 1.5), (-0.5, -0.5, 1.1), (-0.8, -0.8, 0.6)], 0.08, M('#ff6a1a', 0.2, emit=3))
    for x, z, r in ((0.0, 2.0, 0.28), (-0.25, 2.35, 0.36), (0.1, 2.8, 0.42)): puff(x, 0.1, z, r, '#9aa0b0')
    for x, z in ((-0.3, 1.9), (0.4, 2.1)): sphere(0.1, M('#ff7a1a', 0.2, emit=4), loc=(x, 0, z))
    return {'rot_z': -20, 'fit': 1.12}

def wave():
    sphere(1.0, M('#2a7de1', 0.15, coat=1), loc=(0, 0, -0.55), scale=(1.4, 0.9, 0.45))
    pts = crescent(1.15, 0.8, 0.55)
    ang = math.radians(-20)
    pts = [(x * math.cos(ang) - z * math.sin(ang), x * math.sin(ang) + z * math.cos(ang) + 0.2) for x, z in pts]
    extrude_poly(pts, 0.9, M('#2f9bff', 0.1, coat=1), loc=(0, 0, 0), bevel=0.12)
    for x, z, r in ((-1.05, 0.55, 0.22), (-0.8, 0.9, 0.2), (-1.2, 0.2, 0.17), (-0.35, 1.2, 0.17)): sphere(r, M('#ffffff', 0.4), loc=(x, -0.3, z))
    for x, z in ((0.2, -0.5), (0.7, -0.45)): sphere(0.14, M('#ffffff', 0.4), loc=(x, -0.7, z), scale=(1.2, 1, 0.7))
    return {'rot_z': -10, 'fit': 1.0}

def rainbow():
    cols = ['#ff4040', '#ff9f1a', '#ffd93a', '#4cd964', '#3aa7ff', '#8a5cff']
    for i, c in enumerate(cols):
        ro = 1.5 - i * 0.2; ri = ro - 0.2; n = 24
        pts = [(ro * math.cos(math.pi * k / n), ro * math.sin(math.pi * k / n)) for k in range(n + 1)] + [(ri * math.cos(math.pi * (n - k) / n), ri * math.sin(math.pi * (n - k) / n)) for k in range(n + 1)]
        extrude_poly(pts, 0.3 + i * 0.01, M(c, 0.25, coat=1, emit=0.3), loc=(0, 0, 0), bevel=0.02)
    for s in (-1, 1):
        for x, z, r in ((0.0, 0.0, 0.32), (0.3, -0.05, 0.3), (-0.2, -0.05, 0.28), (0.1, 0.25, 0.28)):
            sphere(r, M('#ffffff', 0.5, coat=0.4), loc=(s * 1.05 + x * s, -0.2, z - 0.1))
    return {'rot_z': 0, 'fit': 1.0}

def leaf():
    n = 24; pts = []
    for k in range(n + 1):
        t = k / n; w = 0.62 * math.sin(math.pi * t) ** 0.8 * (1.0 - 0.15 * t) ; pts.append((w, t * 2 - 1))
    pts += [(-w, z) for (w, z) in reversed(pts[1:-1])]
    extrude_poly(pts, 0.1, M('#ff8a1a', 0.35, coat=0.8), loc=(0, 0, 0.1), bevel=0.04)
    cube((0.06, 0.04, 1.8), M('#c0431a', 0.4), loc=(0, -0.07, 0.1), bevel=0.01)
    for t in (-0.5, -0.1, 0.3):
        for s in (-1, 1): cube((0.5, 0.03, 0.05), M('#c0431a', 0.4), loc=(s * 0.22, -0.065, 0.1 + t), rot=(0, s * 35, 0), bevel=0.005)
    curve_tube([(0, 0, -0.9), (0.05, 0, -1.2), (0.18, 0, -1.45)], 0.05, M('#a8481a', 0.5))
    return {'rot_z': 0, 'tilt': 0, 'fit': 1.0}

# ===================== FANTASIE & RUIMTE =====================
def aim(v):
    return tuple(math.degrees(a) for a in Vector(v).normalized().to_track_quat('Z', 'Y').to_euler())

def surf(center, R, az, el, size, m, flat=0.3, sub=0.0):
    a, e = math.radians(az), math.radians(el)
    n = Vector((math.cos(e) * math.cos(a), math.cos(e) * math.sin(a), math.sin(e)))
    p = Vector(center) + n * R
    return sphere(size, m, loc=tuple(p), scale=(1, 1, flat), rot=aim(n))

def mark(): return set(bpy.context.scene.objects)
def spin(before, ang):
    objs = [o for o in bpy.context.scene.objects if o not in before and o.parent is None]
    e = bpy.data.objects.new('e', None); bpy.context.collection.objects.link(e)
    for o in objs: o.parent = e
    e.rotation_euler = (0, math.radians(ang), 0); bpy.context.view_layer.update()
    for o in objs:
        mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
    bpy.data.objects.remove(e)

def dragon():
    g = M('#3fcf6a', 0.3, coat=0.8); lg = M('#c8f5a0', 0.4, coat=0.5); org = M('#ff9f1a', 0.3, coat=0.6)
    sphere(0.8, g, loc=(0, 0.1, 0.8), scale=(1, 0.95, 1.05))
    sphere(0.6, lg, loc=(0, -0.35, 0.7), scale=(0.85, 0.5, 0.95))
    sphere(0.75, g, loc=(0, -0.1, 1.85), scale=(1.05, 0.95, 0.95))
    sphere(0.38, g, loc=(0, -0.7, 1.65), scale=(1, 0.8, 0.7))
    for s_ in (-1, 1): sphere(0.05, M('#2a6a3a'), loc=(s_ * 0.13, -1.02, 1.72), scale=(1, 0.5, 1))
    eyes(0, -0.58, 2.05, 0.3, 0.19, '#0b1a2e')
    smile(0, -1.0, 1.55, 0.2) if False else None
    for s_ in (-1, 1):
        cone(0.12, 0.0, 0.5, M('#fff1c9', 0.3, coat=1), loc=(s_ * 0.38, -0.05, 2.65), rot=(0, s_ * 18, 0))
        sphere(0.2, g, loc=(s_ * 0.55, 0.0, 2.0), scale=(0.6, 0.5, 1)).hide_render = True
        sphere(0.22, g, loc=(s_ * 0.55, -0.45, 0.2), scale=(1, 1.4, 0.55))
        sphere(0.17, g, loc=(s_ * 0.8, -0.35, 0.95))
        sphere(0.1, lg, loc=(s_ * 0.2, -0.78, 1.46)) if False else None
        o = extrude_poly([(0, 0), (0.5, 0.55), (1.0, 0.85), (1.0, 0.35), (0.85, 0.2), (0.85, -0.15), (0.55, -0.05), (0.4, -0.35)], 0.06, M('#a56bff', 0.3, coat=1), loc=(0, 0.45, 0.0))
        o.location = (s_ * 0.5, 0.45, 1.05); o.scale = (s_, 1, 1)
    for i, (y, z, r) in enumerate(((0.55, 1.5, 0.16), (0.8, 1.05, 0.15), (0.9, 0.6, 0.13))): cone(r, 0.0, r * 2.2, org, loc=(0, y, z), rot=(-35, 0, 0))
    curve_tube([(0, 0.6, 0.4), (0, 1.1, 0.3), (0.3, 1.5, 0.45), (0.7, 1.6, 0.9)], 0.17, g)
    cone(0.2, 0.0, 0.4, org, loc=(0.75, 1.6, 1.05), rot=(0, 0, 0))
    return {'rot_z': -15, 'fit': 1.0}

def slime():
    gl = M('#6be34f', 0.12, coat=1, emit=0.15)
    o = lathe([(0.0, 0.0), (0.95, 0.0), (1.08, 0.25), (0.98, 0.7), (0.68, 1.2), (0.3, 1.45), (0.0, 1.5)], gl, seg=40)
    for a, r in ((20, 0.2), (100, 0.14), (200, 0.17), (300, 0.12)): sphere(r, gl, loc=(1.05 * math.cos(math.radians(a)), 1.05 * math.sin(math.radians(a)), 0.08), scale=(1, 1, 0.6))
    sphere(0.2, gl, loc=(0.1, -0.2, 1.62)).hide_render = True
    eyes(0, -0.82, 0.75, 0.32, 0.22); smile(0, -0.9, 0.4, 0.25)
    for s_ in (-1, 1): sphere(0.1, M('#ff8fa3', 0.4), loc=(s_ * 0.62, -0.78, 0.45), scale=(1, 0.4, 0.7))
    sphere(0.13, M('#ffffff', 0.1, emit=2), loc=(-0.45, -0.7, 1.15), scale=(1, 0.5, 1.4))
    return {'rot_z': 0, 'fit': 1.0}

def ghost():
    w = M('#ffffff', 0.3, coat=0.6, emit=0.25)
    lathe([(0.0, 0.2), (0.62, 0.2), (0.88, 0.5), (0.88, 1.1), (0.65, 1.7), (0.0, 2.0)], w, seg=40)
    for i in range(7):
        a = math.radians(i * 360 / 7 + 10)
        sphere(0.26, w, loc=(0.66 * math.cos(a), 0.66 * math.sin(a), 0.22))
    for s_ in (-1, 1): sphere(0.2, w, loc=(s_ * 0.95, -0.15, 0.95), scale=(1, 0.7, 0.55), rot=(0, s_ * 35, 0))
    eyes(0, -0.78, 1.25, 0.28, 0.0001) if False else None
    for s_ in (-1, 1):
        sphere(0.16, M('#1a1a2e', 0.1, coat=1), loc=(s_ * 0.3, -0.8, 1.3), scale=(0.8, 0.5, 1.3)); sphere(0.05, M('#fff', 0.1, emit=2), loc=(s_ * 0.3 + 0.04, -0.87, 1.4))
        sphere(0.1, M('#ffb0c8', 0.5), loc=(s_ * 0.55, -0.75, 1.0), scale=(1, 0.4, 0.7))
    sphere(0.12, M('#1a1a2e', 0.2), loc=(0, -0.84, 0.95), scale=(1, 0.5, 1.2))
    return {'rot_z': 0, 'fit': 1.0}

def robot():
    gr = M('#cfd6e8', 0.2, 0.7, coat=1); bl = M('#3a7bff', 0.25, coat=1)
    cube((1.2, 0.85, 0.95), gr, loc=(0, 0, 1.75), bevel=0.2)
    cube((0.95, 0.1, 0.5), M('#1a1f35', 0.1, coat=1), loc=(0, -0.43, 1.78), bevel=0.1)
    for s_ in (-1, 1): sphere(0.14, M('#4cf0ff', 0.1, emit=6), loc=(s_ * 0.26, -0.5, 1.8), scale=(1, 0.4, 1.1))
    cube((0.35, 0.05, 0.04), M('#4cf0ff', 0.1, emit=4), loc=(0, -0.5, 1.58), bevel=0.0) if False else None
    cyl(0.04, 0.35, M('#555a6e', 0.3, 1), loc=(0, 0, 2.4)); sphere(0.12, M('#ff4d6d', 0.2, emit=3), loc=(0, 0, 2.62))
    for s_ in (-1, 1): cyl(0.15, 0.2, bl, loc=(s_ * 0.66, 0, 1.75), rot=(0, 90, 0))
    cube((1.0, 0.7, 0.9), bl, loc=(0, 0, 0.85), bevel=0.18)
    cube((0.5, 0.05, 0.4), M('#e8ecf8', 0.3), loc=(0, -0.36, 0.9), bevel=0.04)
    for i, c in enumerate(('#ff4d6d', '#ffd23f', '#4cd964')): sphere(0.07, M(c, 0.2, emit=2), loc=(-0.15 + i * 0.15, -0.4, 0.95), scale=(1, 0.4, 1))
    for s_ in (-1, 1):
        cyl(0.1, 0.55, gr, loc=(s_ * 0.72, 0, 0.95), rot=(0, s_ * 15, 0)); sphere(0.17, M('#ffd23f', 0.3, 0.5, coat=1), loc=(s_ * 0.82, 0, 0.65))
        cyl(0.13, 0.35, gr, loc=(s_ * 0.3, 0, 0.18)); cube((0.38, 0.55, 0.16), bl, loc=(s_ * 0.3, -0.08, 0.0), bevel=0.06)
    return {'rot_z': -15, 'fit': 1.0}

def alien():
    g = M('#7cf06a', 0.2, coat=1)
    sphere(1.0, g, loc=(0, 0, 1.35), scale=(1.0, 0.85, 1.0)); sphere(0.55, g, loc=(0, 0.0, 0.75), scale=(0.9, 0.8, 0.7)).hide_render = True
    cone(0.5, 0.2, 0.9, M('#4a7bff', 0.3, coat=1), loc=(0, 0, 0.3)); 
    for s_ in (-1, 1):
        sphere(0.3, M('#111a22', 0.05, coat=1), loc=(s_ * 0.42, -0.65, 1.35), scale=(0.9, 0.6, 1.5), rot=(0, s_ * 25, 0))
        sphere(0.09, M('#ffffff', 0.1, emit=3), loc=(s_ * 0.42 + 0.06, -0.93, 1.55))
        curve_tube([(s_ * 0.3, 0, 2.2), (s_ * 0.55, 0, 2.6), (s_ * 0.5, 0, 2.85)], 0.04, g); sphere(0.13, M('#ffd23f', 0.2, emit=2), loc=(s_ * 0.5, 0, 2.9))
        sphere(0.14, g, loc=(s_ * 0.6, -0.1, 0.5))
    smile(0, -0.82, 0.95, 0.15)
    for s_ in (-1, 1): sphere(0.05, M('#2a7a2a'), loc=(s_ * 0.08, -0.84, 1.1), scale=(1, 0.5, 1))
    return {'rot_z': -15, 'fit': 1.0}

def skull():
    b = M('#fff4dc', 0.4, coat=0.5); dk = M('#1a1020', 0.5)
    for a in (35, -35): cyl(0.1, 2.3, b, loc=(0, 0.5, -0.1), rot=(0, a, 0)); 
    for a in (35, -35):
        for s_ in (-1, 1): sphere(0.17, b, loc=(math.sin(math.radians(a)) * 1.15 * s_, 0.5, -0.1 + math.cos(math.radians(a)) * 1.15 * s_))
    sphere(0.95, b, loc=(0, 0, 0.5), scale=(1, 0.9, 0.95))
    cube((0.8, 0.6, 0.35), b, loc=(0, -0.05, -0.18), bevel=0.12)
    for s_ in (-1, 1):
        sphere(0.27, dk, loc=(s_ * 0.38, -0.72, 0.5), scale=(1, 0.5, 1.1)); sphere(0.06, M('#ff3030', 0.2, emit=5), loc=(s_ * 0.38, -0.88, 0.5))
    cone(0.1, 0.02, 0.22, dk, loc=(0, -0.78, 0.2), rot=(-90, 0, 0)).hide_render = True
    sphere(0.1, dk, loc=(0, -0.88, 0.2), scale=(1, 0.4, 1.2))
    for i in range(4): cube((0.02, 0.04, 0.3), dk, loc=(-0.24 + i * 0.16, -0.36, -0.2), bevel=0)
    return {'rot_z': 0, 'tilt': 0, 'fit': 1.0}

def unicorn():
    w = M('#ffffff', 0.3, coat=0.8)
    cyl(0.5, 1.0, w, loc=(0, 0.35, 0.0), rot=(0, 0, 0))
    sphere(1.0, w, loc=(0, 0, 0.9), scale=(0.88, 0.85, 1.0))
    sphere(0.5, M('#fff0f6', 0.4, coat=0.5), loc=(0, -0.62, 0.4), scale=(0.8, 0.9, 1.0))
    for s_ in (-1, 1):
        sphere(0.06, M('#b0407a'), loc=(s_ * 0.17, -1.04, 0.42), scale=(1, 0.5, 1.2))
        cone(0.2, 0.0, 0.55, w, loc=(s_ * 0.5, 0.0, 1.95), rot=(0, s_ * 15, 0)); cone(0.1, 0.0, 0.4, M('#ffc0d8'), loc=(s_ * 0.5, -0.07, 1.93), rot=(0, s_ * 15, 0))
        sphere(0.2, M('#ffffff', 0.1, emit=1.5), loc=(s_ * 0.4, -0.78, 1.0), scale=(1, 0.6, 1.4)) if False else None
    for s_ in (-1, 1):
        sphere(0.24, M('#ffffff', 0.1), loc=(s_ * 0.38, -0.7, 0.95), scale=(0.9, 0.5, 1.2))
        sphere(0.15, M('#5a2a8a', 0.1, coat=1), loc=(s_ * 0.38, -0.88, 0.93), scale=(0.9, 0.5, 1.2)); sphere(0.05, M('#fff', 0.1, emit=2), loc=(s_ * 0.38 + 0.04, -0.95, 1.02))
        sphere(0.1, M('#ffb0d0', 0.5), loc=(s_ * 0.6, -0.7, 0.62), scale=(1, 0.4, 0.7))
    cone(0.2, 0.0, 1.0, M('#ffd23f', 0.15, 0.9, coat=1), loc=(0, -0.1, 2.3), rot=(0, 0, 0))
    for z in (2.0, 2.25, 2.5): torus(0.2 - (z - 2.0) * 0.2, 0.03, M('#ffb020', 0.2, 0.9), loc=(0, -0.1, z), minor=8)
    cols = ['#ff4d6d', '#ff9f1a', '#ffd93a', '#4cd964', '#3aa7ff', '#8a5cff']
    for i, c in enumerate(cols):
        for s_ in (-1, 1): sphere(0.26, M(c, 0.3, coat=1), loc=(s_ * (0.82 + 0.0), 0.1 + 0.0, 1.5 - i * 0.22), scale=(0.8, 1.1, 1))
    for i, c in enumerate(cols[:4]): sphere(0.25, M(c, 0.3, coat=1), loc=(0.0 + (i - 1.5) * 0.28, -0.35 - 0.0, 1.85 + (0.0 if i in (1, 2) else -0.1)), scale=(1, 0.8, 1))
    extrude_poly([(x * 0.12, y * 0.12) for x, y in star_pts()], 0.05, M('#ffd23f', 0.2, emit=2), loc=(0.0, -0.9, 0.05), bevel=0).hide_render = True
    return {'rot_z': -12, 'fit': 1.0}

def wizard():
    rb = M('#5b4bd8', 0.4, coat=0.6)
    cone(0.95, 0.35, 1.6, rb, loc=(0, 0, 0.8))
    for s_ in (-1, 1): cyl(0.18, 0.8, rb, loc=(s_ * 0.55, -0.2, 1.0), rot=(0, s_ * 20, 0)); sphere(0.17, M('#ffd9b0', 0.5), loc=(s_ * 0.68, -0.25, 0.6))
    cube((0.2, 0.05, 0.9), M('#ffd23f', 0.3, 0.6), loc=(0, -0.55, 0.85), bevel=0.01).hide_render = True
    sphere(0.5, M('#ffd9b0', 0.5), loc=(0, 0, 1.95))
    cone(0.5, 0.0, 1.0, M('#ffffff', 0.7), loc=(0, -0.25, 1.35), rot=(180, 0, 0)); sphere(0.3, M('#ffffff', 0.7), loc=(0, -0.3, 1.75), scale=(1.3, 0.8, 0.8))
    sphere(0.13, M('#ffb090', 0.5), loc=(0, -0.5, 1.95))
    for s_ in (-1, 1): sphere(0.06, M('#1a1a2e', 0.1, coat=1), loc=(s_ * 0.17, -0.45, 2.08))
    cyl(0.85, 0.08, rb, loc=(0, 0, 2.3), bevel=0.02)
    cone(0.55, 0.12, 1.1, rb, loc=(0, 0, 2.85))
    curve_tube([(0, 0, 3.3), (0.2, 0, 3.55), (0.5, 0, 3.55)], 0.1, rb).hide_render = True
    cyl(0.56, 0.1, M('#ffd23f', 0.2, 0.6, coat=1), loc=(0, 0, 2.4))
    for x, z in ((-0.1, 2.9), (0.15, 2.65), (0.0, 3.2)): extrude_poly([(a * 0.12, b * 0.12) for a, b in star_pts()], 0.05, M('#ffd23f', 0.2, emit=3), loc=(x, -0.4, z), bevel=0)
    cyl(0.04, 2.0, M('#8b5a33', 0.5), loc=(0.95, -0.4, 1.0)); sphere(0.2, M('#4cf0ff', 0.1, emit=4), loc=(0.95, -0.4, 2.1))
    return {'rot_z': -10, 'fit': 1.0}

def fairy():
    sk = M('#ffd9b0', 0.5)
    for s_ in (-1, 1):
        sphere(1, M('#bfe8ff', 0.1, coat=1, emit=1.0), loc=(s_ * 0.55, 0.3, 1.25), scale=(0.35, 0.06, 0.7), rot=(0, s_ * 25, 0))
        sphere(1, M('#e0c8ff', 0.1, coat=1, emit=1.0), loc=(s_ * 0.45, 0.3, 0.55), scale=(0.28, 0.06, 0.45), rot=(0, -s_ * 25, 0))
    cone(0.48, 0.12, 0.9, M('#ff6fa5', 0.3, coat=1), loc=(0, 0, 0.75))
    for s_ in (-1, 1): cyl(0.05, 0.4, sk, loc=(s_ * 0.12, 0, 0.1)); sphere(0.09, M('#ff6fa5'), loc=(s_ * 0.12, -0.03, -0.1), scale=(1, 1.3, 0.7)); cyl(0.07, 0.4, sk, loc=(s_ * 0.45, -0.1, 1.0), rot=(0, s_ * 40, 0))
    sphere(0.55, M('#ffcc4d', 0.4, coat=0.5), loc=(0, 0.1, 1.75)); sphere(0.3, M('#ffcc4d', 0.4, coat=0.5), loc=(0, 0.15, 2.3))
    sphere(0.5, sk, loc=(0, -0.05, 1.65))
    eyes(0, -0.42, 1.7, 0.2, 0.1, '#3a2a5a'); smile(0, -0.5, 1.5, 0.1)
    for s_ in (-1, 1): sphere(0.07, M('#ff8fa3', 0.5), loc=(s_ * 0.33, -0.43, 1.52), scale=(1, 0.4, 0.7))
    cyl(0.03, 0.9, M('#ffe58a', 0.2, 0.6), loc=(0.82, -0.3, 1.3), rot=(0, 25, 0)); extrude_poly([(x * 0.22, y * 0.22) for x, y in star_pts()], 0.07, M('#ffd23f', 0.2, emit=3), loc=(0.98, -0.3, 1.8), bevel=0.01)
    extrude_poly([(x * 0.1, y * 0.1) for x, y in star_pts()], 0.04, M('#fff6b0', 0.2, emit=3), loc=(-0.9, -0.2, 2.1), bevel=0)
    return {'rot_z': -10, 'fit': 1.0}

def planet():
    sphere(1.0, M('#ff9f43', 0.3, coat=1), loc=(0, 0, 0))
    for z, c, w in ((0.45, '#ffcf8a', 0.09), (0.0, '#e8703a', 0.12), (-0.5, '#ffcf8a', 0.09)):
        r = math.sqrt(1 - z * z) * 1.005
        t = torus(r, w, M(c, 0.3, coat=1), loc=(0, 0, z), seg=48, minor=10); t.scale = (1, 1, 1)
    o = lathe([(1.3, -0.04), (1.9, -0.04), (1.9, 0.04), (1.3, 0.04)], M('#8fd8ff', 0.3, coat=1), seg=64); o.rotation_euler = (math.radians(20), 0, math.radians(-15))
    o2 = lathe([(1.5, 0.045), (1.65, 0.045), (1.65, 0.05), (1.5, 0.05)], M('#ffffff', 0.3), seg=64); o2.rotation_euler = (math.radians(20), 0, math.radians(-15))
    for z in (0.5, -0.15): pass
    return {'rot_z': 0, 'tilt': 0, 'fit': 1.0}

def earth():
    sphere(1.0, M('#2f7de1', 0.15, coat=1), loc=(0, 0, 0))
    gm = M('#4cc95a', 0.5)
    for az, el, r in ((-115, 15, 0.42), (-75, 30, 0.3), (-95, -35, 0.3), (-40, 0, 0.25), (-155, -10, 0.25), (-120, 55, 0.2)): surf((0, 0, 0), 0.98, az, el, r, gm, 0.35)
    wm = M('#ffffff', 0.4)
    for az, el, r in ((-70, -15, 0.18), (-135, 40, 0.16), (-100, -60, 0.2), (-55, 55, 0.13)): surf((0, 0, 0), 1.0, az, el, r, wm, 0.3)
    return {'rot_z': 0, 'tilt': 10, 'fit': 1.0}

def comet():
    for i, (r, c, L) in enumerate(((0.55, '#ff6a1a', 2.2), (0.4, '#ffb020', 1.9), (0.22, '#fff2a0', 1.5))):
        d = Vector((-1, 0, -0.9)).normalized(); head = Vector((0.7, 0, 0.7))
        cen = head + d * (L / 2 * 0.95)
        cone(r, 0.0, L, M(c, 0.3, emit=2.5), loc=tuple(cen), rot=aim(-d * -1)) if False else None
        o = cone(r, 0.0, L, M(c, 0.3, emit=2.5), loc=tuple(cen)); o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    sphere(0.7, M('#bfe8ff', 0.2, coat=1, emit=0.4), loc=(0.7, 0, 0.7))
    eyes(0.7, -0.6, 0.78, 0.22, 0.13, '#1a2a4a'); smile(0.7, -0.66, 0.55, 0.14)
    for x, z in ((-1.2, 0.8), (0.2, 1.7), (1.7, -0.2)): extrude_poly([(a * 0.2, b * 0.2) for a, b in star_pts()], 0.06, M('#ffffff', 0.2, emit=3), loc=(x, -0.2, z), bevel=0)
    return {'rot_z': 0, 'fit': 1.0}

def astronaut():
    w = M('#ffffff', 0.25, coat=1)
    cube((0.7, 0.4, 0.8), M('#c8d0e8', 0.4, 0.3), loc=(0, 0.45, 1.05), bevel=0.1)
    cyl(0.5, 0.9, w, loc=(0, 0, 0.95), seg=32); sphere(0.5, w, loc=(0, 0, 0.5)).hide_render = True
    cube((0.4, 0.05, 0.3), M('#3a4a6a', 0.3), loc=(0, -0.5, 1.0), bevel=0.03)
    for i, c in enumerate(('#ff4d6d', '#4cd964', '#ffd23f')): sphere(0.05, M(c, 0.2, emit=2), loc=(-0.12 + i * 0.12, -0.54, 1.0), scale=(1, 0.4, 1))
    sphere(0.78, w, loc=(0, -0.05, 1.95))
    sphere(0.6, M('#1a2a55', 0.03, 0.8, coat=1), loc=(0, -0.62, 1.95), scale=(0.95, 0.55, 0.8))
    sphere(0.12, M('#ffffff', 0.1, emit=3), loc=(-0.25, -0.93, 2.2), scale=(1, 0.4, 0.6))
    sphere(0.55, M('#6a9aff', 0.1, 0.5, coat=1, emit=0.4), loc=(0.1, -0.5, 1.8), scale=(0.35, 0.2, 0.3)).hide_render = True
    for s_ in (-1, 1):
        cyl(0.14, 0.7, w, loc=(s_ * 0.62, -0.15, 1.0), rot=(-25, s_ * 25, 0)); sphere(0.17, M('#ff6a3a', 0.3, coat=1), loc=(s_ * 0.76, -0.38, 0.72))
        cyl(0.17, 0.6, w, loc=(s_ * 0.25, 0, 0.3)); cyl(0.2, 0.2, M('#ff6a3a', 0.3, coat=1), loc=(s_ * 0.25, -0.03, 0.0))
    cyl(0.505, 0.1, M('#ff6a3a', 0.3, coat=1), loc=(0, 0, 0.65)); extrude_poly([(0, 0), (0.25, 0), (0.25, 0.14), (0, 0.14)], 0.03, M('#2f7de1', 0.3), loc=(0.25, -0.5, 1.2), bevel=0)
    return {'rot_z': -15, 'tilt': 5, 'fit': 1.0}

def dino():
    g = M('#59d36a', 0.3, coat=0.8); lg = M('#d8f5a0', 0.4); org = M('#ff9f1a', 0.3, coat=0.5)
    sphere(0.9, g, loc=(0, 0.2, 0.95), scale=(0.85, 1.0, 1.0)); sphere(0.6, lg, loc=(0, -0.38, 0.8), scale=(0.7, 0.5, 0.9))
    cone(0.5, 0.0, 2.0, g, loc=(0, 1.75, 0.55), rot=aim((0, 1, -0.35)))
    sphere(0.75, g, loc=(0, -0.65, 1.8), scale=(0.95, 1.0, 0.85)); sphere(0.5, g, loc=(0, -1.2, 1.65), scale=(0.9, 1.0, 0.7))
    sphere(0.4, g, loc=(0, -0.9, 1.35), scale=(0.9, 1.0, 0.45)) if False else None
    eyes(0, -0.95, 2.1, 0.33, 0.17, '#1a2a1a')
    for s_ in (-1, 1): sphere(0.05, M('#2a5a2a'), loc=(s_ * 0.14, -1.62, 1.8), scale=(1, 0.5, 1))
    for i in range(4): cone(0.07, 0.0, 0.16, M('#ffffff', 0.3), loc=(-0.3 + i * 0.2, -1.4, 1.42), rot=(180, 0, 0))
    for i, (y, z, r) in enumerate(((-0.2, 2.1, 0.13), (0.15, 1.95, 0.16), (0.5, 1.7, 0.16), (0.85, 1.35, 0.14))): cone(r, 0.0, r * 2, org, loc=(0, y + 0.3, z), rot=(-30, 0, 0))
    for s_ in (-1, 1):
        sphere(0.24, g, loc=(s_ * 0.55, 0.0, 0.25), scale=(1, 1.5, 0.6)); cyl(0.27, 0.5, g, loc=(s_ * 0.52, 0.1, 0.55))
        cyl(0.07, 0.35, g, loc=(s_ * 0.5, -0.65, 1.0), rot=(60, 0, 0)); sphere(0.07, lg, loc=(s_ * 0.5, -0.8, 0.88))
    sphere(0.12, g, loc=(0, 1.7, 0.0)).hide_render = True
    return {'rot_z': -35, 'fit': 1.0}

def mermaid():
    sk = M('#ffd9b0', 0.5); tl = M('#2ec4b6', 0.2, coat=1)
    for i in range(13):
        t = i / 12
        sphere(0.5 - 0.22 * t, tl, loc=(0.9 * t ** 1.6, 0, 0.9 - 1.9 * t), scale=(1, 0.8, 1.15))
    for sg in (-1, 1): sphere(0.5, M('#f06aa8', 0.3, coat=1), loc=(1.05 + sg * 0.05, 0, -1.2 + sg * 0.35), scale=(0.9, 0.25, 0.9), rot=(0, sg * 40, 0))
    cone(0.5, 0.38, 0.8, sk, loc=(0, 0, 1.3)); 
    for s_ in (-1, 1): sphere(0.17, M('#ff8fa3', 0.2, coat=1), loc=(s_ * 0.22, -0.3, 1.45), scale=(1, 0.6, 0.8)); cyl(0.09, 0.6, sk, loc=(s_ * 0.5, -0.05, 1.15), rot=(0, s_ * 25, 0))
    sphere(0.7, M('#ff7a3a', 0.35, coat=0.6), loc=(0, 0.2, 2.1)); cone(0.6, 0.15, 1.2, M('#ff7a3a', 0.35, coat=0.6), loc=(0, 0.4, 1.4)).hide_render = True
    sphere(0.55, sk, loc=(0, -0.08, 2.05))
    eyes(0, -0.47, 2.1, 0.2, 0.1, '#1a3a5a'); smile(0, -0.52, 1.9, 0.1)
    for s_ in (-1, 1): sphere(0.07, M('#ff8fa3', 0.5), loc=(s_ * 0.34, -0.47, 1.92), scale=(1, 0.4, 0.7))
    sphere(0.1, M('#ff4d6d'), loc=(0.3, -0.3, 2.5))
    return {'rot_z': -10, 'fit': 1.0}

# ===================== GEREEDSCHAP, MUZIEK, SCHOOL =====================
def hammer():
    b = mark()
    wd = M('#c98a4a', 0.4, coat=0.6); st = M('#aab4c8', 0.2, 0.9, coat=1)
    cyl(0.12, 2.0, wd, loc=(0, 0, -0.1), bevel=0.03)
    for z in (-0.8, -0.6, -0.4): cyl(0.135, 0.08, M('#e63946', 0.4), loc=(0, 0, z))
    sphere(0.14, wd, loc=(0, 0, -1.1))
    cube((1.3, 0.5, 0.5), st, loc=(0, 0, 1.15), bevel=0.1)
    cube((0.2, 0.52, 0.52), M('#7d889e', 0.25, 0.9), loc=(-0.55, 0, 1.15), bevel=0.04)
    cone(0.22, 0.08, 0.5, st, loc=(0.9, 0, 1.15), rot=(0, 90, 0)).hide_render = False
    spin(b, 35)
    return {'rot_z': 0, 'fit': 1.0}

def pickaxe():
    b = mark()
    wd = M('#c98a4a', 0.4, coat=0.6); st = M('#aab4c8', 0.2, 0.9, coat=1)
    cyl(0.1, 2.3, wd, loc=(0, 0, 0), bevel=0.03)
    pts = [(1.2 * math.sin(math.radians(a)), 0, 1.0 + 0.55 * math.cos(math.radians(a)) - 0.3 + 0.2 * 0) for a in range(-80, 81, 10)]
    pts = [(1.25 * math.sin(math.radians(a)), 0, 1.15 + 0.5 * math.cos(math.radians(a)) - 0.35) for a in range(-75, 76, 15)]
    curve_tube(pts, 0.15, st)
    for s_ in (-1, 1): cone(0.15, 0.0, 0.5, st, loc=(s_ * 1.37, 0, 0.55), rot=(0, s_ * 130, 0))
    cyl(0.17, 0.3, M('#7d889e', 0.25, 0.9), loc=(0, 0, 1.15))
    spin(b, 30)
    return {'rot_z': 0, 'fit': 1.0}

def gear():
    o = M('#ff9f1a', 0.25, 0.4, coat=1); bl = M('#3a7bff', 0.25, 0.4, coat=1)
    def mk(x, z, R, n, c, ph=0):
        cyl(R, 0.35, c, loc=(x, 0, z), rot=(90, 0, 0), bevel=0.03)
        for i in range(n):
            a = math.radians(i * 360 / n + ph)
            cube((R * 0.35, 0.35, R * 0.3), c, loc=(x + (R + R * 0.08) * math.cos(a), 0, z + (R + R * 0.08) * math.sin(a)), rot=(0, -math.degrees(a), 0), bevel=0.04)
        cyl(R * 0.4, 0.4, M('#2a2f45', 0.4), loc=(x, 0.0, z), rot=(90, 0, 0))
        torus(R * 0.4, R * 0.07, M('#fff1c9', 0.2, 0.8, coat=1), loc=(x, -0.2, z), rot=(90, 0, 0), minor=10)
        cyl(R * 0.2, 0.55, M('#ffe08a', 0.2, 0.8), loc=(x, 0.0, z), rot=(90, 0, 0)).hide_render = True
    mk(-0.35, -0.1, 0.85, 10, o, 0); mk(1.05, 0.9, 0.5, 7, bl, 15)
    return {'rot_z': 0, 'fit': 1.0}

def wand():
    b = mark()
    cyl(0.1, 2.0, M('#2b2340', 0.2, coat=1), loc=(0, 0, 0))
    for z in (-1.0, 1.0): cyl(0.12, 0.35, M('#fff6e0', 0.3, coat=1), loc=(0, 0, z * 0.92))
    extrude_poly([(x * 0.7, y * 0.7) for x, y in star_pts()], 0.25, M('#ffd23f', 0.15, 0.3, coat=1, emit=1.0), loc=(0, 0, 1.55), bevel=0.06)
    spin(b, 35)
    for x, z, r in ((-0.9, 1.3, 0.25), (1.1, 0.3, 0.2), (-0.5, -0.4, 0.17), (0.5, 1.7, 0.15)):
        extrude_poly([(a * r, c * r) for a, c in star_pts(4, 1, 0.3)], 0.06, M('#fff6b0', 0.2, emit=3), loc=(x, -0.2, z), bevel=0)
    return {'rot_z': 0, 'fit': 1.0}

def map():
    pc = M('#f3dca0', 0.7); dk = M('#d9b872', 0.7)
    for i, (x, ang) in enumerate(((-0.58, 7), (0.0, -7), (0.58, 7))):
        cube((0.6, 0.05, 1.5), pc if i != 1 else M('#f7e4b0', 0.7), loc=(x, 0.0, 0.0), rot=(0, 0, 0), bevel=0.02).rotation_euler = (0, 0, math.radians(ang * 0))
    for i in range(2):
        cube((0.03, 0.06, 1.5), dk, loc=(-0.29 + i * 0.58, -0.02, 0.0), bevel=0)
    sphere(0.3, M('#7fd16a', 0.6), loc=(-0.45, -0.04, -0.3), scale=(1.3, 0.2, 0.8)); sphere(0.25, M('#7fd16a', 0.6), loc=(0.45, -0.04, 0.4), scale=(1.2, 0.2, 0.7))
    sphere(0.3, M('#7ec8ff', 0.4), loc=(0.35, -0.04, -0.4), scale=(1.4, 0.15, 0.7)); sphere(0.2, M('#7ec8ff', 0.4), loc=(-0.4, -0.04, 0.45), scale=(1.4, 0.15, 0.7))
    pts = [(-0.45, 0, -0.3), (-0.2, 0, -0.1), (0.0, 0, -0.4), (0.25, 0, 0.0), (0.45, 0, 0.4)]
    for (x0, _, z0), (x1, _, z1) in zip(pts, pts[1:]):
        for t in (0.15, 0.55): sphere(0.035, M('#c0392b', 0.4), loc=(x0 + (x1 - x0) * t, -0.07, z0 + (z1 - z0) * t))
    for a in (45, -45): cube((0.45, 0.05, 0.1), M('#e63946', 0.3, coat=1), loc=(0.45, -0.08, 0.45), rot=(0, a, 0), bevel=0.02)
    for z in (-0.77, 0.77): cyl(0.07, 1.9, M('#c98a4a', 0.4), loc=(0, 0, z), rot=(0, 90, 0))
    return {'rot_z': -10, 'tilt': 8, 'fit': 1.0}

def compass():
    gd = M('#ffcf40', 0.2, 0.9, coat=1)
    torus(0.95, 0.12, gd, loc=(0, 0, 0), rot=(90, 0, 0)); cyl(0.9, 0.12, M('#fff6e0', 0.3, coat=1), loc=(0, 0.03, 0), rot=(90, 0, 0))
    torus(0.22, 0.07, gd, loc=(0, 0.1, 1.2), rot=(90, 0, 0)); cyl(0.1, 0.2, gd, loc=(0, 0.05, 1.0))
    for i in range(12):
        a = math.radians(i * 30); L = 0.14 if i % 3 == 0 else 0.08
        cube((0.04, 0.03, L), M('#2a3350', 0.4), loc=(0.76 * math.sin(a), -0.04, 0.76 * math.cos(a)), rot=(0, math.degrees(a), 0), bevel=0)
    o = cone(0.17, 0.0, 0.8, M('#ff3b3b', 0.2, coat=1), loc=(0, -0.08, 0.4), rot=(0, 0, 0)); o.scale = (1, 0.3, 1)
    o = cone(0.17, 0.0, 0.8, M('#ffffff', 0.2, coat=1), loc=(0, -0.08, -0.4), rot=(180, 0, 0)); o.scale = (1, 0.3, 1)
    sphere(0.08, gd, loc=(0, -0.12, 0))
    o = lathe([(0.0, 0.0)], None) if False else None
    return {'rot_z': -15, 'tilt': 8, 'fit': 1.0}

def flask():
    gl = glass('#bfe8ff', 0.4)
    prof = [(0.0, 0.0), (0.7, 0.0), (0.82, 0.12), (0.7, 0.5), (0.3, 1.05), (0.26, 1.7), (0.34, 1.78)]
    lathe(prof, gl, seg=40)
    lathe([(0.0, 0.03), (0.66, 0.03), (0.78, 0.14), (0.7, 0.45), (0.58, 0.62), (0.0, 0.62)], M('#b24dff', 0.1, coat=1, emit=0.8), seg=40)
    cyl(0.3, 0.3, M('#c98a4a', 0.6), loc=(0, 0, 1.82))
    for x, y, z, r in ((-0.2, -0.1, 0.9, 0.12), (0.1, -0.1, 1.2, 0.08), (0.2, -0.2, 1.0, 0.1), (-0.1, -0.2, 1.35, 0.07)): sphere(r, M('#e8b8ff', 0.1, coat=1, emit=1.5), loc=(x, y, z))
    sphere(0.1, M('#ffffff', 0.1, emit=2), loc=(-0.4, -0.55, 0.3), scale=(0.6, 0.3, 1.6))
    return {'rot_z': -10, 'fit': 1.0}

def microscope():
    gy = M('#e8ecf8', 0.2, 0.2, coat=1); bl = M('#3a7bff', 0.2, 0.3, coat=1); br = M('#ffcf40', 0.2, 0.9, coat=1)
    cube((1.5, 1.0, 0.2), bl, loc=(0, 0, 0.1), bevel=0.06)
    curve_tube([(0.5, 0.0, 0.15), (0.85, 0, 0.7), (0.8, 0, 1.4), (0.35, 0, 1.8)], 0.17, gy)
    cyl(0.2, 1.3, gy, loc=(-0.1, 0, 1.55), rot=(0, 20, 0))
    cyl(0.14, 0.4, bl, loc=(-0.35, 0, 2.3), rot=(0, 20, 0)); cyl(0.1, 0.4, br, loc=(0.0, 0, 0.95), rot=(0, 20, 0))
    cyl(0.2, 0.1, bl, loc=(-0.45, 0, 2.5), rot=(0, 20, 0)).hide_render = True
    cube((0.8, 0.6, 0.08), M('#555a6e', 0.3, 0.7), loc=(-0.1, 0, 0.55), bevel=0.02)
    cube((0.4, 0.2, 0.03), M('#bfe8ff', 0.1, coat=1), loc=(-0.1, 0, 0.62)); 
    sphere(0.2, br, loc=(0.6, -0.2, 0.9), scale=(0.7, 0.4, 0.7)); 
    sphere(0.15, br, loc=(0.3, -0.5, 0.2)) if False else None
    return {'rot_z': -20, 'fit': 1.0}

def paint():
    pal = M('#e9b97a', 0.4, coat=0.7)
    sphere(1.0, pal, loc=(0, 0, 0), scale=(1.35, 0.14, 1.0))
    sphere(0.2, M('#2a2f45', 0.5), loc=(-0.55, -0.1, -0.5), scale=(1, 0.3, 1))
    for (x, z, c) in ((-0.8, 0.35, '#ff4d6d'), (-0.4, 0.65, '#ffd23f'), (0.1, 0.7, '#4cd964'), (0.6, 0.45, '#3aa7ff'), (0.85, 0.0, '#8a5cff'), (0.55, -0.4, '#ff9f1a')):
        sphere(0.24, M(c, 0.1, coat=1), loc=(x, -0.12, z), scale=(1, 0.5, 0.8))
    b = mark()
    cyl(0.07, 1.7, M('#3a7bff', 0.3, coat=1), loc=(0, -0.4, 0.2)); cyl(0.1, 0.4, M('#cfd6e8', 0.2, 0.9), loc=(0, -0.4, 1.2)); cone(0.1, 0.0, 0.4, M('#ff4d6d', 0.3), loc=(0, -0.4, 1.6))
    spin(b, -35)
    for o in bpy.context.scene.objects:
        if o not in b and o.parent is None and o.location.y == -0.4: pass
    return {'rot_z': 0, 'tilt': 0, 'fit': 1.0}

def pencil():
    b = mark()
    cyl(0.25, 1.7, M('#ffcc1a', 0.3, coat=1), loc=(0, 0, 0.1), seg=6)
    cone(0.25, 0.04, 0.6, M('#f2c690', 0.5), loc=(0, 0, -1.05), rot=(180, 0, 0), seg=6) if False else None
    o = cone(0.25, 0.04, 0.55, M('#f2c690', 0.5), loc=(0, 0, -1.0), seg=6); o.rotation_euler = (math.pi, 0, 0)
    cone(0.07, 0.0, 0.18, M('#2a2f45', 0.4), loc=(0, 0, -1.37), rot=(180, 0, 0))
    cyl(0.27, 0.22, M('#cfd6e8', 0.2, 0.9, coat=1), loc=(0, 0, 1.05), seg=24)
    cyl(0.25, 0.3, M('#ff8fa3', 0.5), loc=(0, 0, 1.3), seg=24); sphere(0.25, M('#ff8fa3', 0.5), loc=(0, 0, 1.43)) if False else None
    spin(b, 40)
    return {'rot_z': 0, 'fit': 1.0}

def camera():
    dk = M('#2a2f45', 0.3, coat=1); rd = M('#ef476f', 0.25, coat=1)
    cube((1.8, 0.75, 1.1), rd, loc=(0, 0, 0), bevel=0.2)
    cube((1.82, 0.77, 0.35), M('#f4f4fa', 0.3, coat=1), loc=(0, 0, 0.3), bevel=0.12).hide_render = True
    cube((1.8, 0.4, 0.5), M('#e8ecf8', 0.3, coat=1), loc=(0, 0.2, -0.25), bevel=0.1).hide_render = True
    cube((0.6, 0.35, 0.28), dk, loc=(0.0, 0, 0.7), bevel=0.08); cube((0.3, 0.2, 0.15), M('#ffd23f', 0.3), loc=(-0.5, -0.1, 0.65), bevel=0.04)
    torus(0.52, 0.09, M('#cfd6e8', 0.2, 0.9, coat=1), loc=(0, -0.4, -0.05), rot=(90, 0, 0)); cyl(0.46, 0.35, dk, loc=(0, -0.45, -0.05), rot=(90, 0, 0))
    sphere(0.36, M('#3a6bd8', 0.03, 0.3, coat=1, emit=0.3), loc=(0, -0.55, -0.05), scale=(1, 0.5, 1)); sphere(0.1, M('#ffffff', 0.1, emit=3), loc=(-0.12, -0.7, 0.07))
    sphere(0.1, M('#fff6b0', 0.2, emit=4), loc=(0.65, -0.4, 0.35), scale=(1, 0.4, 1)); cyl(0.1, 0.1, M('#ffd23f', 0.3, 0.8), loc=(-0.7, 0, 0.62)).hide_render = True
    return {'rot_z': -25, 'tilt': 5, 'fit': 1.0}

def piano():
    blk = M('#1e2030', 0.15, coat=1)
    cube((2.3, 1.0, 0.7), blk, loc=(0, 0.2, 0.35), bevel=0.06)
    cube((2.3, 0.2, 1.0), blk, loc=(0, 0.6, 1.0), bevel=0.06)
    cube((2.1, 0.9, 0.12), blk, loc=(0, -0.35, 0.7), bevel=0.02).hide_render = True
    for i in range(8): cube((0.25, 0.8, 0.08), M('#ffffff', 0.2, coat=1), loc=(-0.88 + i * 0.25, -0.15, 0.75), bevel=0.015)
    for i in (0, 1, 3, 4, 5): cube((0.14, 0.5, 0.1), blk, loc=(-0.76 + i * 0.25, -0.02, 0.83), bevel=0.01)
    cube((0.9, 0.04, 0.5), M('#3a3f55', 0.4), loc=(0, 0.45, 1.1)).hide_render = True
    cube((1.0, 0.05, 0.5), M('#fff6e0', 0.5), loc=(0, 0.46, 1.25), rot=(-15, 0, 0), bevel=0.01)
    for s_ in (-1, 1): cyl(0.08, 0.5, blk, loc=(s_ * 1.0, -0.15, 0.0))
    return {'rot_z': -25, 'tilt': 20, 'fit': 1.0}

def guitar():
    b = mark()
    wd = M('#e0802a', 0.2, coat=1); dk = M('#5a2e10', 0.4)
    sphere(0.8, wd, loc=(0, 0, -0.6), scale=(1, 0.3, 0.95)); sphere(0.6, wd, loc=(0, 0, 0.15), scale=(1, 0.3, 0.9))
    cyl(0.28, 0.1, M('#2a1a10', 0.5), loc=(0, -0.28, -0.05), rot=(90, 0, 0)); torus(0.3, 0.035, M('#ffd9a0', 0.3), loc=(0, -0.29, -0.05), rot=(90, 0, 0), minor=8)
    cube((0.5, 0.1, 0.1), dk, loc=(0, -0.28, -0.7), bevel=0.02)
    cube((0.2, 0.1, 1.5), M('#6b3a1e', 0.4), loc=(0, -0.05, 1.2), bevel=0.03)
    cube((0.3, 0.1, 0.45), dk, loc=(0, -0.05, 2.15), bevel=0.04)
    for z in (0.4, 0.75, 1.1, 1.45): cube((0.2, 0.12, 0.025), M('#cfd6e8', 0.2, 1), loc=(0, -0.1, z))
    for s_ in (-1, 1):
        for z in (2.05, 2.25): sphere(0.05, M('#cfd6e8', 0.2, 1), loc=(s_ * 0.2, -0.05, z))
    for x in (-0.06, 0.0, 0.06): cube((0.012, 0.012, 2.6), M('#f0f0f0', 0.2, 1), loc=(x, -0.31 + 0.2, 0.55)).hide_render = True
    spin(b, 30)
    return {'rot_z': 0, 'fit': 1.0}

def drum():
    rd = M('#ef476f', 0.2, coat=1); sv = M('#cfd6e8', 0.2, 0.9, coat=1)
    cyl(0.95, 0.9, rd, loc=(0, 0, 0.45), seg=40)
    for z in (0.02, 0.9): torus(0.95, 0.06, sv, loc=(0, 0, z), seg=48, minor=10)
    cyl(0.93, 0.05, M('#fff6e0', 0.3, coat=0.5), loc=(0, 0, 0.92), seg=48)
    for i in range(10):
        a = math.radians(i * 36 + 10); cube((0.08, 0.04, 0.8), sv, loc=(0.97 * math.cos(a), 0.97 * math.sin(a), 0.45), rot=(0, 0, math.degrees(a) + 90), bevel=0.01)
        sphere(0.06, sv, loc=(0.96 * math.cos(a), 0.96 * math.sin(a), 0.9))
    for s_ in (-1, 1):
        cyl(0.05, 1.5, M('#ffd23f', 0.3, coat=1), loc=(s_ * 0.2, -0.1, 1.2), rot=(0, 0, 0)).rotation_euler = (math.radians(70), 0, math.radians(s_ * 35))
        sphere(0.08, M('#ffd23f', 0.3, coat=1), loc=(s_ * 0.9, -0.55, 1.45))
    return {'rot_z': -15, 'tilt': 12, 'fit': 1.0}

def microphone():
    b = mark()
    sphere(0.6, M('#aab4c8', 0.6, 0.8), loc=(0, 0, 0.9))
    for z in (0.7, 0.9, 1.1): torus(math.sqrt(0.36 - (z - 0.9) ** 2) * 1.01, 0.02, M('#7d889e', 0.4, 0.9), loc=(0, 0, z), minor=6)
    torus(0.58, 0.07, M('#ef476f', 0.25, coat=1), loc=(0, 0, 0.3))
    cone(0.32, 0.17, 1.5, M('#2a2f45', 0.2, coat=1), loc=(0, 0, -0.6))
    cyl(0.18, 0.15, M('#ef476f', 0.25, coat=1), loc=(0, 0, 0.15))
    sphere(0.12, M('#4cd964', 0.2, emit=2), loc=(0, -0.28, -0.35), scale=(1, 0.4, 1))
    spin(b, 22)
    return {'rot_z': 0, 'fit': 1.0}

def headphones():
    rd = M('#ef476f', 0.25, coat=1); dk = M('#2a2f45', 0.3, coat=1)
    pts = [(1.0 * math.cos(math.radians(a)), 0, 0.2 + 1.2 * math.sin(math.radians(a))) for a in range(0, 181, 10)]
    curve_tube(pts, 0.12, dk)
    for s_ in (-1, 1):
        cyl(0.52, 0.35, rd, loc=(s_ * 1.0, 0, 0.0), rot=(0, 90, 0)); torus(0.5, 0.14, M('#fff6e0', 0.6), loc=(s_ * 1.2, 0, 0.0), rot=(0, 90, 0)) if False else None
        torus(0.5, 0.13, M('#fff6e0', 0.7), loc=(s_ * 1.2 if False else s_ * 1.0 - s_ * 0.0, 0, 0.0), rot=(0, 90, 0)).hide_render = True
        cyl(0.4, 0.15, M('#fff6e0', 0.7), loc=(s_ * 0.85, 0, 0.0), rot=(0, 90, 0))
        cyl(0.3, 0.1, M('#ffd23f', 0.2, 0.8, coat=1), loc=(s_ * 1.2, 0, 0.0), rot=(0, 90, 0))
    return {'rot_z': -20, 'tilt': 5, 'fit': 1.0}

def note():
    gl = M('#8a5cff', 0.15, coat=1, emit=0.2)
    for x in (-0.65, 0.65):
        sphere(0.38, gl, loc=(x, 0, -0.9), scale=(1.15, 0.8, 0.85), rot=(0, -25, 0)); cube((0.14, 0.2, 1.9), gl, loc=(x + 0.4, 0, 0.1), bevel=0.04)
    extrude_poly([(-0.25, 0.55), (1.05, 1.05), (1.05, 0.65), (-0.25, 0.15)], 0.22, M('#ff4d6d', 0.15, coat=1, emit=0.2), loc=(0, 0, 0.35), bevel=0.05).location = (0.0, -0.11, 0.35)
    for z in (-0.1,): pass
    return {'rot_z': 0, 'fit': 1.0}

def globe():
    sphere(0.95, M('#2f7de1', 0.12, coat=1), loc=(0, 0, 0.1))
    gm = M('#4cc95a', 0.5)
    for az, el, r in ((-105, 20, 0.4), (-60, 35, 0.28), (-85, -30, 0.3), (-135, -5, 0.25), (-35, -5, 0.22)): surf((0, 0, 0.1), 0.92, az, el, r, gm, 0.35)
    torus(1.08, 0.045, M('#ffcf40', 0.2, 0.9, coat=1), loc=(0, 0, 0.1), rot=(90, 0, 0), minor=10)
    cyl(0.04, 0.4, M('#ffcf40', 0.2, 0.9), loc=(0, 0, 1.3)).hide_render = True
    cyl(0.7, 0.12, M('#ffcf40', 0.2, 0.9, coat=1), loc=(0, 0, -1.2), bevel=0.03); cyl(0.12, 0.4, M('#ffcf40', 0.2, 0.9), loc=(0, 0, -0.98))
    return {'rot_z': 0, 'tilt': 8, 'fit': 1.0}
# ---- MODELS
MODELS = {n: _wrap(f) for n, f in list(globals().items()) if callable(f) and n in NAMES}
