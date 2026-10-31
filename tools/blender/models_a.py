"""Groep A: schatten & spelobjecten, eten, dieren."""
import math
from common import *

# ---------- helpers ----------
def M(c, r=0.3, m=0.0, coat=0.4, e=0.0): return mat(c, r, m, e, coat)
GOLD = lambda: mat('#ffc61a', 0.22, 1.0, 0, 0.3)
WHITE = lambda: M('#ffffff', 0.25, 0, 0.5)
BLACK = lambda: M('#16161e', 0.2, 0, 0.8)
def glow(c, s=2.0): return mat(c, 0.3, 0, s, 0.3)

def star_pts(n=5, ro=1.0, ri=0.45, rot=90):
    pts = []
    for i in range(n * 2):
        a = math.radians(rot + i * 180 / n); r = ro if i % 2 == 0 else ri
        pts.append((r * math.cos(a), r * math.sin(a)))
    return pts

def heart_pts(s=1.0, n=40):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x = 16 * math.sin(t) ** 3; z = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((x / 17 * s, (z + 2) / 17 * s))
    return pts[::-1] if False else pts

def arc_pts(r, a0, a1, n=24, sx=1.0, sz=1.0):
    return [(r * sx * math.cos(math.radians(a0 + (a1 - a0) * i / n)), r * sz * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]

def eye(x, y, z, r=0.17, look=(0, 0)):
    sphere(r, WHITE(), (x, y, z), seg=24)
    sphere(r * 0.64, BLACK(), (x + look[0] * r * 0.2, y - r * 0.48, z + look[1] * r * 0.2), seg=20)
    sphere(r * 0.2, glow('#ffffff', 3), (x + r * 0.22, y - r * 1.0, z + r * 0.26), seg=10)

def eyes(dx, y, z, r=0.17, look=(0, 0)):
    eye(-dx, y, z, r, look); eye(dx, y, z, r, look)

def smile(x, y, z, w=0.2, h=0.1, r=0.03, c='#3b1a1a', n=10):
    pts = [(x + w * t, y, z - h * (1 - t * t)) for t in [(-1 + 2 * i / n) for i in range(n + 1)]]
    return curve_tube(pts, r, M(c, 0.4, 0, 0.2))

def blush(dx, y, z, r=0.1, c='#ff8fa3'):
    for s in (-1, 1): sphere(r, M(c, 0.6, 0, 0), (s * dx, y, z), scale=(1, 0.3, 0.7))

def ang(objs, rx=0, ry=0, rz=0):
    g = group(objs); g.rotation_euler = (math.radians(rx), math.radians(ry), math.radians(rz)); return g

def seg_pts(p, q, n=2):
    return [(p[0] + (q[0] - p[0]) * i / n, p[1] + (q[1] - p[1]) * i / n, p[2] + (q[2] - p[2]) * i / n) for i in range(n + 1)]

MODELS = {}
def reg(f):
    MODELS[f.__name__[2:]] = f; return f

# ======================= SCHATTEN & SPELOBJECTEN =======================
@reg
def m_coin():
    g = GOLD(); d = mat('#e29a00', 0.25, 1.0, 0, 0.3)
    cyl(0.95, 0.22, d, rot=(90, 0, 0), bevel=0.04, seg=48)
    torus(0.88, 0.1, g, rot=(90, 0, 0), loc=(0, -0.1, 0))
    cyl(0.78, 0.04, g, rot=(90, 0, 0), loc=(0, -0.11, 0), seg=48)
    extrude_poly(star_pts(5, 0.52, 0.24), 0.07, GOLD(), loc=(0, -0.14, 0.0), bevel=0.02)
    return {'rot_z': -22, 'tilt': 8}

@reg
def m_gem():
    ico(1.0, M('#27b8ff', 0.05, 0.0, 0.9), sub=1, scale=(1, 1, 0.85))
    ico(0.55, glow('#9be8ff', 1.2), sub=1, scale=(1, 1, 0.85), loc=(0, 0, 0))
    ico(1.02, M('#27b8ff', 0.04, 0.1, 1.0), sub=1, scale=(1, 1, 0.85), rot=(0, 0, 0))
    return {'rot_z': 15, 'tilt': 10}

@reg
def m_star():
    extrude_poly(star_pts(5, 1.0, 0.5), 0.45, M('#ffcf1f', 0.2, 0.2, 0.9), bevel=0.12)
    eyes(0.2, -0.3, 0.05, 0.1); smile(0, -0.3, -0.12, 0.13, 0.07)
    return {'rot_z': -15}

@reg
def m_heart():
    extrude_poly(heart_pts(1.05), 0.7, M('#ff2e5f', 0.15, 0, 1.0), bevel=0.15)
    sphere(0.12, glow('#ffffff', 2), (-0.45, -0.5, 0.55), scale=(1, 0.4, 1.6), rot=(0, 30, 0))
    return {'rot_z': -15}

@reg
def m_trophy():
    g = GOLD()
    lathe([(0.0, 0.35), (0.35, 0.35), (0.45, 0.6), (0.9, 1.35), (0.95, 1.7), (0.85, 1.75), (0.0, 1.0)], g, loc=(0, 0, -0.95))
    lathe([(0.25, 0.3), (0.12, 0.6), (0.18, 0.9), (0.4, 1.0)], g, loc=(0, 0, -0.95))
    cyl(0.6, 0.18, g, loc=(0, 0, -0.78), bevel=0.04)
    cube((1.0, 0.7, 0.3), M('#6b3f1c', 0.4), loc=(0, 0, -1.0), bevel=0.06)
    for s in (-1, 1): torus(0.38, 0.07, g, loc=(s * 0.98, 0, 0.35), rot=(90, 0, 0))
    sphere(0.28, GOLD(), (0, -0.7, 0.2), scale=(1, 0.3, 1))
    extrude_poly(star_pts(5, 0.25, 0.11), 0.06, M('#fff2a0', 0.2), loc=(0, -0.82, 0.2), bevel=0.01)
    return {'rot_z': -20}

@reg
def m_crown():
    g = GOLD()
    lathe([(0.95, -0.55), (1.0, -0.4), (1.0, 0.0), (0.92, 0.0)], g)
    torus(0.97, 0.08, g, loc=(0, 0, -0.5)); 
    for i in range(5):
        a = math.radians(i * 72)
        x, y = 0.9 * math.cos(a), 0.9 * math.sin(a)
        cone(0.28, 0.0, 0.8, g, loc=(x, y, 0.35))
        sphere(0.14, M('#ff3355', 0.1, 0, 1), (x, y, 0.8))
    for i in range(5):
        a = math.radians(i * 72 + 36); sphere(0.12, M(['#2ad4ff', '#40e070'][i % 2], 0.1, 0, 1), (0.99 * math.cos(a), 0.99 * math.sin(a), -0.2))
    return {'rot_z': 10, 'tilt': 12}

@reg
def m_medal():
    r = M('#e8334a', 0.4)
    extrude_poly([(-0.55, 1.1), (-0.15, 1.1), (0.45, 0.2), (0.0, 0.2)], 0.1, r, loc=(0, 0.1, 0.0), bevel=0.02)
    extrude_poly([(0.55, 1.1), (0.15, 1.1), (-0.45, 0.2), (0.0, 0.2)], 0.1, M('#2f6df0', 0.4), loc=(0, 0.1, 0.0), bevel=0.02)
    g = GOLD()
    cyl(0.78, 0.2, g, rot=(90, 0, 0), loc=(0, 0, -0.5), seg=48, bevel=0.03)
    torus(0.7, 0.07, mat('#e29a00', 0.25, 1), rot=(90, 0, 0), loc=(0, -0.1, -0.5))
    extrude_poly(star_pts(5, 0.45, 0.2), 0.06, M('#fff3b0', 0.2, 0.5), loc=(0, -0.13, -0.5), bevel=0.015)
    return {'rot_z': -15}

@reg
def m_gift():
    c = M('#ff3d6e', 0.3); rb = M('#ffd21f', 0.25, 0.2)
    cube((1.5, 1.5, 1.1), c, loc=(0, 0, -0.35), bevel=0.06)
    cube((1.64, 1.64, 0.4), M('#ff5a86', 0.3), loc=(0, 0, 0.3), bevel=0.06)
    cube((0.34, 1.68, 1.5), rb, loc=(0, 0, -0.1), bevel=0.04)
    cube((1.68, 0.34, 1.5), rb, loc=(0, 0, -0.1), bevel=0.04)
    for s in (-1, 1):
        torus(0.38, 0.12, rb, loc=(s * 0.4, 0, 0.78), rot=(0, 0, 0)).scale = (1, 1, 1)
        o = torus(0.34, 0.11, rb, loc=(s * 0.38, 0, 0.82), rot=(80, 25 * s, 0))
    sphere(0.2, rb, (0, 0, 0.62))
    return {'rot_z': -30, 'tilt': 5}

@reg
def m_chest():
    wood = M('#9a5a26', 0.55, 0, 0.1); g = GOLD(); dk = M('#6e3a14', 0.6)
    cube((1.8, 1.2, 0.9), wood, loc=(0, 0, -0.5), bevel=0.06)
    lid = cyl(0.6, 1.8, wood, rot=(0, 90, 0), loc=(0, 0, 0.0), scale=(1, 1.0, 1)); lid.scale = (1, 1.0, 1)
    lid.scale = (0.99, 1.0, 1.0)
    bpy_lid = lid
    # half cylinder: hide lower half inside box (box top at -0.05)
    for x in (-0.7, 0.7):
        cube((0.22, 1.28, 0.95), g, loc=(x, 0, -0.5), bevel=0.04)
        cyl(0.63, 0.22, g, rot=(0, 90, 0), loc=(x, 0, 0.0), bevel=0.0)
    cube((0.4, 0.14, 0.45), g, loc=(0, -0.62, -0.1), bevel=0.04)
    sphere(0.07, BLACK(), (0, -0.7, -0.1), scale=(1, 0.5, 1))
    # coins peeking
    cube((1.7, 1.1, 0.12), GOLD(), loc=(0, 0, -0.04), bevel=0.02)
    return {'rot_z': -30, 'tilt': 10}

@reg
def m_key():
    g = GOLD(); parts = []
    parts.append(torus(0.5, 0.17, g, loc=(0, 0, 0.9), rot=(90, 0, 0)))
    parts.append(cyl(0.13, 1.7, g, loc=(0, 0, -0.1)))
    parts.append(cube((0.4, 0.2, 0.17), g, loc=(0.25, 0, -0.75), bevel=0.04))
    parts.append(cube((0.3, 0.2, 0.17), g, loc=(0.22, 0, -0.45), bevel=0.04))
    parts.append(sphere(0.26, g, (0, 0, 0.9), scale=(1, 0.4, 1)))
    ang(parts, 0, 35, 0)
    return {'rot_z': -10}

@reg
def m_lock():
    g = mat('#ffc61a', 0.22, 1, 0, 0.3)
    torus(0.55, 0.14, mat('#c9d1dc', 0.15, 1), loc=(0, 0, 0.5), rot=(90, 0, 0)).scale = (1, 1, 1.15)
    cube((1.7, 0.95, 1.3), g, loc=(0, 0, -0.45), bevel=0.2)
    sphere(0.17, BLACK(), (0, -0.5, -0.3), scale=(1, 0.4, 1))
    cube((0.1, 0.06, 0.38), BLACK(), loc=(0, -0.52, -0.55), bevel=0.01)
    return {'rot_z': -20}

@reg
def m_bomb():
    sphere(0.95, M('#2b2b3a', 0.18, 0.2, 0.9), (0, 0, -0.15), seg=40)
    sphere(0.17, glow('#ffffff', 2), (-0.4, -0.75, 0.2), scale=(1, 0.4, 1.5), rot=(0, 30, 0))
    cyl(0.28, 0.25, M('#555566', 0.3, 1), loc=(0, 0, 0.82), bevel=0.04)
    curve_tube([(0, 0, 0.9), (0.1, 0, 1.15), (0.3, 0, 1.3), (0.5, 0, 1.25)], 0.05, M('#c9a46a', 0.7))
    ico(0.22, glow('#ffd21f', 5), loc=(0.55, 0, 1.28), sub=1)
    ico(0.12, glow('#ff6a1f', 5), loc=(0.55, 0, 1.28), sub=1)
    for a in (20, 100, 200, 300):
        r = math.radians(a); ico(0.07, glow('#ffe066', 5), loc=(0.55 + 0.35 * math.cos(r), 0, 1.28 + 0.35 * math.sin(r)), sub=1)
    return {'rot_z': -15}



@reg
def m_shield():
    pts = [(-0.9, 1.0), (0.9, 1.0), (0.9, 0.1), (0.7, -0.5), (0.0, -1.2), (-0.7, -0.5), (-0.9, 0.1)]
    extrude_poly(pts, 0.3, mat('#ffc61a', 0.22, 1, 0, 0.3), bevel=0.08)
    pts2 = [(x * 0.78, z * 0.78 + (0.0 if z > 0 else 0.03)) for x, z in pts]
    extrude_poly(pts2, 0.3, M('#2f6df0', 0.25, 0, 0.9), loc=(0, -0.08, 0.02), bevel=0.05)
    extrude_poly(star_pts(5, 0.42, 0.19), 0.1, M('#ffd21f', 0.2, 0.3), loc=(0, -0.28, 0.1), bevel=0.02)
    return {'rot_z': -20}




@reg
def m_book():
    c = M('#2f6df0', 0.35, 0, 0.6)
    cube((1.5, 0.45, 1.9), M('#fff6dc', 0.7), loc=(0.05, 0.0, 0), bevel=0.03)
    cube((1.6, 0.14, 2.0), c, loc=(0.0, -0.3, 0), bevel=0.05)
    cube((1.6, 0.14, 2.0), c, loc=(0.0, 0.3, 0), bevel=0.05)
    cube((0.2, 0.74, 2.0), M('#1f4fc0', 0.35, 0, 0.6), loc=(-0.78, 0, 0), bevel=0.05)
    extrude_poly(star_pts(5, 0.33, 0.15), 0.05, GOLD(), loc=(0.0, -0.4, 0.2), bevel=0.01)
    cube((0.85, 0.03, 0.12), GOLD(), loc=(0.0, -0.38, -0.35), bevel=0.01)
    return {'rot_z': -35, 'tilt': 5}

@reg
def m_scroll():
    p = M('#fbe9b5', 0.65); e = M('#c98a3b', 0.5)
    cube((1.5, 0.05, 1.7), p, loc=(0, 0, 0), bevel=0.02)
    for z in (-1, 1):
        cyl(0.22, 1.7, p, rot=(0, 90, 0), loc=(0, 0, z * 0.9))
        cyl(0.25, 0.12, e, rot=(0, 90, 0), loc=(0.85, 0, z * 0.9)); cyl(0.25, 0.12, e, rot=(0, 90, 0), loc=(-0.85, 0, z * 0.9))
    for i, w in enumerate((1.0, 1.15, 0.9, 1.1)):
        cube((w, 0.02, 0.07), M('#8a5a2a', 0.6), loc=(0, -0.04, 0.4 - i * 0.28), bevel=0.0)
    cyl(0.14, 0.04, M('#e8334a', 0.4), rot=(90, 0, 0), loc=(0.5, -0.06, -0.55))
    return {'rot_z': -25}

@reg
def m_flag():
    cyl(0.07, 2.4, M('#d8dde6', 0.2, 1), loc=(-0.7, 0, 0))
    sphere(0.14, GOLD(), (-0.7, 0, 1.25))
    extrude_poly([(-0.7, 1.0), (0.2, 1.1), (0.9, 0.95), (0.6, 0.55), (0.9, 0.1), (0.2, 0.25), (-0.7, 0.1)][:0] or [(-0.65, 1.1), (0.0, 1.15), (0.5, 1.05), (1.0, 1.1), (1.0, 0.1), (0.5, 0.2), (0.0, 0.15), (-0.65, 0.1)], 0.1, M('#ff3d4f', 0.35, 0, 0.7), bevel=0.03)
    extrude_poly(star_pts(5, 0.25, 0.11), 0.05, M('#ffffff', 0.3), loc=(0.2, -0.07, 0.62), bevel=0.01)
    cyl(0.25, 0.15, M('#8a4b1f', 0.5), loc=(-0.7, 0, -1.2), bevel=0.04)
    return {'rot_z': -20}



@reg
def m_bell():
    g = GOLD()
    lathe([(0.0, 1.0), (0.3, 0.95), (0.6, 0.6), (0.7, 0.0), (0.9, -0.5), (1.0, -0.7), (0.9, -0.75), (0.0, -0.75)], g, loc=(0, 0, 0), seg=48)
    sphere(0.2, g, (0, 0, 1.05)); torus(0.2, 0.06, g, loc=(0, 0, 1.2), rot=(90, 0, 0))
    sphere(0.28, mat('#e29a00', 0.25, 1), (0, 0, -0.8))
    return {'rot_z': -15}

@reg
def m_balloon():
    sphere(0.95, M('#ff3355', 0.12, 0, 1.0), (0, 0, 0.45), scale=(1, 1, 1.15), seg=40)
    cone(0.18, 0.0, 0.35, M('#ff3355', 0.2), loc=(0, 0, -0.75), rot=(180, 0, 0))
    sphere(0.17, glow('#ffffff', 2), (-0.4, -0.78, 0.9), scale=(1, 0.4, 1.8), rot=(0, 30, 0))
    curve_tube([(0, 0, -0.9), (0.15, 0, -1.2), (-0.1, 0, -1.5), (0.1, 0, -1.8)], 0.03, M('#f4efe0', 0.5))
    return {'rot_z': -15}

@reg
def m_dice():
    cube((1.5, 1.5, 1.5), M('#fffdf5', 0.25, 0, 0.7), bevel=0.22)
    k = BLACK(); o = 0.76
    lay = {1: [(0, 0)], 2: [(-.35, .35), (.35, -.35)], 3: [(-.38, .38), (0, 0), (.38, -.38)], 4: [(-.38, .38), (.38, .38), (-.38, -.38), (.38, -.38)],
           5: [(-.38, .38), (.38, .38), (0, 0), (-.38, -.38), (.38, -.38)], 6: [(-.38, .4), (.38, .4), (-.38, 0), (.38, 0), (-.38, -.4), (.38, -.4)]}
    for u, v in lay[5]: sphere(0.12, k, (u, -o, v), scale=(1, 0.35, 1))
    for u, v in lay[3]: sphere(0.12, k, (u, v, o), scale=(1, 1, 0.35))
    for u, v in lay[2]: sphere(0.12, k, (o, u, v), scale=(0.35, 1, 1))
    for u, v in lay[4]: sphere(0.12, k, (-o, u, v), scale=(0.35, 1, 1))
    for u, v in lay[1]: sphere(0.12, k, (u, o, v), scale=(1, 0.35, 1))
    for u, v in lay[6]: sphere(0.12, k, (u, v, -o), scale=(1, 1, 0.35))
    return {'rot_z': -35, 'tilt': 25}


@reg
def m_target():
    cols = ['#ffffff', '#e8334a', '#ffffff', '#e8334a', '#ffd21f']
    for i, rr in enumerate([1.1, 0.9, 0.68, 0.46, 0.22]):
        cyl(rr, 0.2 + i * 0.03, M(cols[i], 0.3, 0, 0.6), rot=(90, 0, 0), loc=(0, -0.0 - i * 0.015, 0), seg=48)
    parts = [cyl(0.04, 1.3, M('#c9a46a', 0.5), rot=(0, 0, 0), loc=(0, 0, 0)),]
    a = cyl(0.04, 1.5, M('#c9a46a', 0.5), rot=(90, 0, 0), loc=(0.15, -0.9, 0.1)); a.rotation_euler = (math.radians(90 - 20), math.radians(0), math.radians(-15))
    a.location = (0.15, -0.65, 0.1)
    for dz in (-1, 1):
        f = cube((0.02, 0.4, 0.18), M('#2f6df0', 0.4), loc=(0.15 + 0.0, -1.35, 0.1), bevel=0.0)
        f.rotation_euler = (math.radians(70), 0, math.radians(-15))
    return {'rot_z': -25, 'tilt': -5}


@reg
def m_bolt():
    extrude_poly([(0.2, 1.2), (-0.7, -0.1), (-0.05, -0.1), (-0.3, -1.2), (0.7, 0.2), (0.05, 0.2), (0.5, 1.2)], 0.45, M('#ffb800', 0.2, 0, 0.9), bevel=0.08)
    return {'rot_z': -15, 'tilt': 5}


@reg
def m_bow():
    w = M('#8a4b1f', 0.4, 0, 0.3)
    curve_tube([(0.35 - 0.7 * (1 - (i / 8) ** 2), 0, 1.2 * i / 8) for i in range(-8, 9)], 0.1, w)
    curve_tube([(0.35, 0, 1.2), (0.65, 0, 0), (0.35, 0, -1.2)], 0.03, M('#f4efe0', 0.5))
    cyl(0.05, 2.1, M('#c9a46a', 0.5), rot=(0, 90, 0), loc=(-0.3, -0.12, 0))
    cone(0.16, 0, 0.4, mat('#c9d1dc', 0.2, 1), rot=(0, -90, 0), loc=(-1.5, -0.12, 0))
    for dz in (-0.12, 0.12): cube((0.4, 0.02, 0.1), M('#e8334a', 0.4), loc=(0.62, -0.12, dz), bevel=0.0)
    return {'rot_z': -15}

@reg
def m_potion():
    sphere(0.95, M('#a24bff', 0.08, 0, 1.0), (0, 0, -0.35), seg=40)
    sphere(0.8, glow('#c47bff', 0.5), (0, 0, -0.35), seg=30)
    cyl(0.32, 0.8, M('#d6f4ff', 0.05, 0, 1.0), loc=(0, 0, 0.55))
    torus(0.34, 0.07, M('#d6f4ff', 0.05, 0, 1.0), loc=(0, 0, 0.95))
    cyl(0.27, 0.35, M('#b57339', 0.7), loc=(0, 0, 1.15), bevel=0.04)
    sphere(0.2, glow('#ffffff', 1.5), (-0.45, -0.7, 0.0), scale=(1, 0.4, 1.7), rot=(0, 30, 0))
    for p in [(0.3, -0.85, -0.5, 0.11), (0.05, -0.9, -0.15, 0.07)]: sphere(p[3], glow('#ffffff', 1.5), (p[0], p[1], p[2]))
    return {'rot_z': -15}

@reg
def m_magnet():
    r = M('#e8334a', 0.25, 0, 0.8)
    pts = [(math.cos(math.radians(a)) * 0.85, 0, -math.sin(math.radians(a)) * 0.85) for a in range(0, 181, 10)]
    pts = [(0.85, 0, 0.9)] + pts + [(-0.85, 0, 0.9)]
    pts = pts[::-1]
    curve_tube(pts, 0.25, r)
    for x in (-0.85, 0.85):
        cyl(0.28, 0.5, mat('#dfe6f0', 0.15, 1), loc=(x, 0, 1.0)); cyl(0.3, 0.08, M('#ffffff', 0.2), loc=(x, 0, 0.78))
    return {'rot_z': -20, 'tilt': 5}

@reg
def m_lightbulb():
    sphere(0.9, M('#ffd83a', 0.05, 0, 1.0, 0.4), (0, 0, 0.35), seg=40)
    sphere(0.75, glow('#ffd21f', 0.9), (0, 0, 0.35), seg=30)
    cone(0.5, 0.78, 0.3, M('#ffd83a', 0.05, 0, 1.0), loc=(0, 0, -0.45))
    for i in range(3): torus(0.46, 0.07, mat('#aeb6c4', 0.25, 1), loc=(0, 0, -0.7 - i * 0.16))
    cyl(0.25, 0.1, M('#555566', 0.4), loc=(0, 0, -1.2))
    curve_tube([(-0.25, -0.2, 0.2), (-0.12, -0.2, 0.55), (0, -0.2, 0.2), (0.12, -0.2, 0.55), (0.25, -0.2, 0.2)], 0.03, mat('#ff7a1a', 0.4))
    sphere(0.15, glow('#ffffff', 2), (-0.45, -0.7, 0.75), scale=(1, 0.4, 1.8), rot=(0, 30, 0))
    return {'rot_z': -15}

@reg
def m_puzzle():
    c = M('#2fcf6a', 0.3, 0, 0.7)
    cube((1.6, 0.5, 1.6), c, loc=(0, 0, 0), bevel=0.1)
    cube((0.3, 0.5, 0.3), c, loc=(0, 0, 0.82), bevel=0.04); cube((0.3, 0.5, 0.3), c, loc=(0.82, 0, 0), bevel=0.04)
    sphere(0.34, c, (0, 0, 1.08), scale=(1, 0.74, 1)); sphere(0.34, c, (1.08, 0, 0), scale=(1, 0.74, 1))
    cube((0.3, 0.3, 0.3), M('#1d9c4d', 0.4), loc=(-0.78, -0.2, 0), bevel=0.05)
    return {'rot_z': -25, 'tilt': 12}

@reg
def m_hourglass():
    wood = M('#8a4b1f', 0.5); gl = M('#cfeeff', 0.05, 0, 1.0); sand = M('#ffb81f', 0.6)
    for z in (-1.0, 1.0): cyl(0.85, 0.2, wood, loc=(0, 0, z), bevel=0.05)
    for a in (45, 135, 225, 315):
        r = math.radians(a); cyl(0.07, 2.0, wood, loc=(0.78 * math.cos(r), 0.78 * math.sin(r), 0))
    lathe([(0.0, 0.88), (0.6, 0.88), (0.68, 0.5), (0.5, 0.1), (0.1, 0.0)], gl, seg=32)
    lathe([(0.1, 0.0), (0.5, -0.1), (0.68, -0.5), (0.6, -0.88), (0.0, -0.88)], gl, seg=32)
    cone(0.62, 0.05, 0.75, sand, loc=(0, 0, -0.5), rot=(180, 0, 0))
    cone(0.4, 0.0, 0.3, sand, loc=(0, 0, 0.72))
    cyl(0.04, 0.8, sand, loc=(0, 0, 0.0))
    return {'rot_z': -20, 'fit': 0.88}

@reg
def m_sword():
    parts = []; s = mat('#e4ebf5', 0.12, 1)
    parts.append(cube((0.5, 0.14, 1.7), s, loc=(0, 0, 0.55), bevel=0.05))
    parts.append(cone(0.35, 0.0, 0.5, s, loc=(0, 0, 1.65), seg=4, rot=(0, 0, 45)))
    parts.append(cube((0.2, 0.05, 1.5), mat('#ffffff', 0.1, 1), loc=(0.0, -0.08, 0.5), bevel=0.01))
    parts.append(cube((1.3, 0.3, 0.26), GOLD(), loc=(0, 0, -0.35), bevel=0.08))
    parts.append(cyl(0.13, 0.6, M('#a03030', 0.5), loc=(0, 0, -0.8)))
    parts.append(sphere(0.22, GOLD(), (0, 0, -1.15)))
    parts.append(sphere(0.12, M('#ff3355', 0.1, 0, 1), (0, -0.16, -0.35)))
    ang(parts, 0, 35, 0)
    return {'rot_z': -10}

# ======================= MORE SCHATTEN =======================
@reg
def m_ticket():
    c = M('#ff8a1f', 0.35, 0, 0.6)
    cube((2.0, 0.2, 1.2), c, bevel=0.12)
    for s in (-1, 1): sphere(0.16, M('#eeeeee', 0.9), (s * 1.0, -0.1, 0), scale=(1, 0.5, 1))
    for i in range(5): cube((0.05, 0.05, 0.14), M('#ffffff', 0.4), loc=(0.55, -0.11, 0.4 - i * 0.2), bevel=0.0)
    extrude_poly(star_pts(5, 0.38, 0.17), 0.06, M('#fff2a0', 0.3), loc=(-0.3, -0.12, 0.0), bevel=0.015)
    cube((0.6, 0.04, 0.1), M('#ffffff', 0.4), loc=(0.0, -0.11, -0.42), bevel=0.0)
    return {'rot_z': -25, 'tilt': 10}

@reg
def m_money():
    g = M('#3cc46a', 0.45); d = M('#1f8a47', 0.5); l = M('#c8f7d3', 0.5)
    for k, (dx, dz, rz) in enumerate([(0.15, 0.2, 8), (-0.1, -0.15, -6)]):
        cube((2.0, 0.1, 1.1), g, loc=(dx, k * -0.12, dz), rot=(0, 0, rz), bevel=0.04)
    cube((1.8, 0.02, 0.9), d, loc=(-0.1, -0.2, -0.15), rot=(0, 0, -6), bevel=0.0)
    cyl(0.32, 0.04, l, rot=(90, 0, 0), loc=(-0.1, -0.23, -0.15))
    cyl(0.2, 0.05, d, rot=(90, 0, 0), loc=(-0.1, -0.25, -0.15))
    return {'rot_z': -15, 'tilt': 20}

@reg
def m_bag():
    b = M('#c98a3b', 0.7)
    lathe([(0.0, -0.95), (0.7, -0.88), (1.0, -0.4), (0.85, 0.2), (0.45, 0.6), (0.3, 0.75), (0.35, 0.9), (0.6, 1.1), (0.0, 1.1)], b, seg=40, loc=(0, 0, 0))
    torus(0.38, 0.1, M('#8a5a2a', 0.6), loc=(0, 0, 0.82))
    cyl(0.38, 0.5, b, loc=(0, 0, 1.0)).scale = (1, 1, 0.01)
    cyl(0.4, 0.2, GOLD(), rot=(90, 0, 0), loc=(0, -0.85, -0.25), seg=40)
    extrude_poly(star_pts(5, 0.25, 0.11), 0.05, M('#e29a00', 0.3, 1), loc=(0, -0.97, -0.25), bevel=0.01)
    return {'rot_z': -15}


@reg
def m_crystal():
    g = GOLD()
    sphere(1.0, M('#9a5bff', 0.03, 0, 1.0, 1), (0, 0, 0.3), seg=40)
    sphere(0.8, glow('#6a3bff', 0.6), (0, 0, 0.3), seg=30)
    lathe([(0.0, -0.85), (0.7, -0.85), (0.8, -0.7), (0.5, -0.55), (0.55, -0.4), (0.0, -0.3)], g, seg=32)
    sphere(0.22, glow('#ffffff', 2), (-0.45, -0.75, 0.75), scale=(1, 0.4, 1.8), rot=(0, 30, 0))
    for p in [(0.2, -0.85, 0.2, 0.12), (-0.2, -0.9, -0.1, 0.07), (0.4, -0.8, 0.7, 0.06)]:
        ico(p[3], glow('#ffe9ff', 4), loc=(p[0], p[1], p[2]), sub=1)
    return {'rot_z': -15}


@reg
def m_clover():
    g = M('#2fcf5a', 0.3, 0, 0.8); dg = M('#1e9a3e', 0.3)
    for a in (0, 90, 180, 270):
        r = math.radians(a)
        extrude_poly(heart_pts(0.62), 0.25, g, loc=(0.62 * math.sin(r), 0, 0.62 * math.cos(r)), rot=(0, a, 0), bevel=0.06)
    curve_tube([(0, 0, 0), (0.3, 0, -0.7), (0.7, 0, -1.3)], 0.07, dg)
    sphere(0.12, dg, (0, -0.12, 0))
    return {'rot_z': -10, 'tilt': 5}

@reg
def m_shell():
    pink = M('#ffb0c0', 0.3, 0, 0.8); dk = M('#ff8fa8', 0.35, 0, 0.8)
    n = 11
    for i in range(n):
        a = -75 + 150 * i / (n - 1); r = math.radians(a)
        sphere(0.3, pink if i % 2 else dk, (0.8 * math.sin(r), -0.04 * abs(a) / 70, -0.8 + 0.8 * math.cos(r)), scale=(1.1, 0.5, 2.6), rot=(0, a, 0))
    sphere(0.5, dk, (0, 0, -0.75), scale=(1.5, 0.8, 0.6))
    return {'rot_z': -10, 'tilt': 10}

@reg
def m_ring():
    g = GOLD()
    torus(0.9, 0.2, g, rot=(90, 0, 0), loc=(0, 0, -0.2))
    cyl(0.28, 0.15, g, loc=(0, 0, 0.7))
    ico(0.55, M('#27d8ff', 0.04, 0, 1), loc=(0, 0, 1.05), sub=1)
    return {'rot_z': -25, 'tilt': 5}

# ======================= ETEN =======================
@reg
def m_apple():
    sphere(0.95, M('#ee2b2b', 0.18, 0, 0.9), (0, 0, -0.1), scale=(1, 0.95, 0.92), seg=40)
    sphere(0.5, M('#d41f2a', 0.2, 0, 0.9), (0.2, -0.05, -0.15), scale=(1, 1, 1)).scale = (1, 1, 1)
    sphere(0.95, M('#ee2b2b', 0.18, 0, 0.9), (0, 0, -0.1), scale=(1, 0.95, 0.92), seg=40)
    curve_tube([(0, 0, 0.7), (0.05, 0, 0.95), (0.15, 0, 1.15)], 0.07, M('#7a4a22', 0.6))
    sphere(0.3, M('#3fc23f', 0.3, 0, 0.7), (0.42, 0, 1.05), scale=(1, 0.3, 0.5), rot=(0, -25, 0))
    sphere(0.17, glow('#ffffff', 2), (-0.45, -0.75, 0.35), scale=(1, 0.4, 1.8), rot=(0, 30, 0))
    return {'rot_z': -20}

@reg
def m_banana():
    y = M('#ffd21f', 0.3, 0, 0.7); b = M('#6e4a22', 0.6)
    for k, (dy, dz, w) in enumerate([(0.3, 0.12, 0.2), (0, 0, 0.23)]):
        pts = [(1.15 * math.cos(math.radians(a)), dy, 1.15 * math.sin(math.radians(a)) + 0.75 + dz) for a in range(205, 336, 8)]
        curve_tube(pts, w, y)
        p0, p1 = pts[0], pts[-1]
        sphere(w * 0.9, b, (p1[0], p1[1], p1[2]))
        cyl(0.11, 0.3, b, loc=(p0[0] - 0.04, p0[1], p0[2] + 0.12), rot=(0, 25, 0))
    return {'rot_z': -15, 'tilt': 10}

@reg
def m_carrot():
    parts = []; o = M('#ff8a1f', 0.35, 0, 0.6)
    parts.append(cone(0.5, 0.05, 2.0, o, loc=(0, 0, -0.3), rot=(180, 0, 0)))
    for z in (0.3, -0.2, -0.7): parts.append(torus(0.5 * (z + 1.3) / 2.0 * 0.97, 0.03, M('#d96a10', 0.4), loc=(0, 0, z)))
    for a, t in ((0, 0), (25, 120), (-25, 240)):
        r = math.radians(a)
        parts.append(cone(0.2, 0.0, 1.0, M('#3fc23f', 0.4), loc=(0.35 * math.sin(r), 0, 1.15 + 0.0), rot=(0, a, 0)))
    parts.append(sphere(0.52, o, (0, 0, 0.7), scale=(1, 1, 0.35)))
    ang(parts, 0, 35, 0)
    return {'rot_z': -10}

@reg
def m_wheat():
    parts = []
    gold = M('#f2b640', 0.5, 0, 0.3)
    for a, h in ((-22, 1.0), (0, 1.15), (22, 1.0)):
        sub = []
        sub.append(cyl(0.04, 2.0, M('#c9a24a', 0.5), loc=(0, 0, -0.1)))
        for i in range(7):
            z = 0.4 + i * 0.22; s = 1 - i * 0.07
            for sx in (-1, 1):
                sub.append(sphere(0.13 * s + 0.02, gold, (sx * 0.11 * s, 0, z), scale=(0.7, 0.7, 1.7), rot=(0, sx * 22, 0)))
        sub.append(sphere(0.1, gold, (0, 0, 2.0), scale=(0.6, 0.6, 1.8)))
        g = group(sub); g.rotation_euler = (0, math.radians(a), 0); g.location = (a * 0.012, 0, -1.0); parts.append(g)
    cyl(0.1, 0.3, M('#c0392b', 0.5), loc=(0, 0, -0.95)).scale = (1.6, 1.0, 1.0)
    return {'rot_z': -10}

@reg
def m_corn():
    parts = []
    prof = [(0.0, -1.0), (0.3, -0.95), (0.5, -0.6), (0.57, 0), (0.5, 0.6), (0.3, 0.95), (0.0, 1.05)]
    def R(z):
        for (r1, z1), (r2, z2) in zip(prof, prof[1:]):
            if z1 <= z <= z2: return r1 + (r2 - r1) * (z - z1) / (z2 - z1)
        return 0.1
    yel = M('#ffd21f', 0.3, 0, 0.7)
    parts.append(lathe(prof, M('#f2b21f', 0.4), seg=24))
    for row in range(10):
        z = -0.7 + row * 0.16
        for k in range(10):
            a = 2 * math.pi * (k + 0.5 * (row % 2)) / 10
            rr = R(z)
            parts.append(sphere(0.13, yel, (rr * math.cos(a), rr * math.sin(a), z), scale=(1, 1, 0.95), seg=10))
    gm = M('#3fb33f', 0.4)
    for a in (110, 230, 350):
        r = math.radians(a)
        parts.append(sphere(0.42, gm, (0.55 * math.cos(r), 0.55 * math.sin(r), -0.65), scale=(0.3, 0.9, 1.6) if False else (0.5, 0.2, 1.7), rot=(0, 0, a + 90)))
    ang(parts, 0, 0, 0).rotation_euler = (0, math.radians(30), 0)
    return {'rot_z': -10}

@reg
def m_tomato():
    sphere(1.0, M('#ee2b2b', 0.15, 0, 1.0), (0, 0, -0.05), scale=(1.05, 1.0, 0.88), seg=40)
    g = M('#2fa840', 0.35)
    for i in range(5):
        a = i * 72; r = math.radians(a)
        sphere(0.3, g, (0.25 * math.cos(r), 0.25 * math.sin(r), 0.8), scale=(1.3, 0.35, 0.25), rot=(0, 0, a))
    cyl(0.07, 0.3, g, loc=(0, 0, 0.9))
    sphere(0.17, glow('#ffffff', 2), (-0.5, -0.7, 0.3), scale=(1, 0.4, 1.8), rot=(0, 30, 0))
    return {'rot_z': -15, 'tilt': 10}

@reg
def m_strawberry():
    prof = [(0.0, 1.0), (0.5, 0.95), (0.85, 0.55), (0.92, 0.0), (0.7, -0.55), (0.3, -0.95), (0.0, -1.1)]
    def R(z):
        for (r1, z1), (r2, z2) in zip(prof[::-1], prof[::-1][1:]):
            if z1 <= z <= z2: return r1 + (r2 - r1) * (z - z1) / (z2 - z1)
        return 0.1
    lathe(prof, M('#ee2b3a', 0.2, 0, 0.9), seg=40)
    sd = M('#ffe27a', 0.4)
    import random; rg = random.Random(7)
    for i in range(60):
        z = -0.85 + 1.6 * rg.random(); a = rg.random() * 6.283
        x = R(z) * math.cos(a); y = R(z) * math.sin(a)
        if y < 0.1: sphere(0.065, sd, (x * 1.0, y * 1.0, z), scale=(1, 1, 1.4), seg=8)
    g = M('#2fb040', 0.35)
    for i in range(6):
        a = i * 60; r = math.radians(a)
        sphere(0.3, g, (0.3 * math.cos(r), 0.3 * math.sin(r), 0.95), scale=(1.2, 0.3, 0.2), rot=(0, 0, a))
    cyl(0.07, 0.3, g, loc=(0, 0, 1.1))
    return {'rot_z': -15, 'tilt': 5}

@reg
def m_grapes():
    p = M('#8a3bd8', 0.12, 0, 1.0)
    pos = [(0, 0.8)]
    for layer, (n, rad, z) in enumerate([(3, 0.32, 0.55), (4, 0.5, 0.15), (3, 0.38, -0.3), (2, 0.2, -0.75)]):
        for k in range(n): pos.append((rad * math.cos(2 * math.pi * k / n + layer), z, rad * math.sin(2 * math.pi * k / n + layer)))
    for (x, z, y) in [(0, 0.55, 0)] + [(p_[0], p_[1], p_[2]) for p_ in pos[1:]]:
        sphere(0.36, p, (x, -y * 0.8, z), seg=24)
        sphere(0.07, glow('#ffffff', 2), (x - 0.15, -y * 0.8 - 0.3, z + 0.15))
    curve_tube([(0, 0, 0.8), (0.05, 0, 1.1), (0.2, 0, 1.3)], 0.07, M('#7a4a22', 0.6))
    sphere(0.5, M('#3fc23f', 0.3), (0.5, 0.05, 1.15), scale=(1, 0.2, 0.6), rot=(0, -30, 0))
    return {'rot_z': -15}

@reg
def m_watermelon():
    def arc(r, cz): return [(r * math.cos(math.radians(a)), cz + r * math.sin(math.radians(a))) for a in range(180, 361, 10)]
    extrude_poly(arc(1.1, 0.5), 0.55, M('#2fa840', 0.3, 0, 0.6), bevel=0.05)
    extrude_poly(arc(1.0, 0.5), 0.6, M('#f1fff0', 0.4), bevel=0.02)
    extrude_poly(arc(0.9, 0.5), 0.64, M('#ff3d55', 0.25, 0, 0.8), bevel=0.03)
    for (x, z) in [(-0.5, 0.15), (0.0, 0.05), (0.5, 0.15), (-0.25, -0.3), (0.25, -0.3), (0.0, -0.55)]:
        sphere(0.07, BLACK(), (x, -0.33, z), scale=(0.9, 0.5, 1.5))
    return {'rot_z': -20, 'tilt': 5}

@reg
def m_pizza():
    extrude_poly([(-1.0, 0.8), (1.0, 0.8), (0, -1.2)], 0.22, M('#ffc83a', 0.3, 0, 0.6), bevel=0.06)
    cyl(0.2, 2.1, M('#d9964a', 0.5), rot=(0, 90, 0), loc=(0, 0, 0.82))
    sphere(0.2, M('#d9964a', 0.5), (1.05, 0, 0.82)); sphere(0.2, M('#d9964a', 0.5), (-1.05, 0, 0.82))
    r = M('#d9382b', 0.3, 0, 0.6)
    for (x, z, s) in [(-0.4, 0.4, 0.25), (0.35, 0.35, 0.24), (0.0, -0.1, 0.23), (-0.1, -0.6, 0.16)]:
        cyl(s, 0.08, r, rot=(90, 0, 0), loc=(x, -0.15, z))
    for (x, z) in [(0.1, 0.55), (-0.25, 0.0), (0.4, -0.05)]:
        sphere(0.07, M('#2fa840', 0.4), (x, -0.13, z), scale=(1, 0.4, 1))
    return {'rot_z': -15, 'tilt': -5}

@reg
def m_burger():
    t = M('#e0a050', 0.4, 0, 0.5)
    cyl(0.95, 0.3, t, loc=(0, 0, -0.9), bevel=0.1)
    cyl(1.0, 0.32, M('#7a4020', 0.5), loc=(0, 0, -0.62), bevel=0.1)
    cube((1.8, 1.8, 0.07), M('#ffc42a', 0.3), loc=(0, 0, -0.4), rot=(0, 0, 45), bevel=0.02)
    cyl(0.95, 0.18, M('#ee3b2b', 0.3), loc=(0, 0, -0.28), bevel=0.05)
    torus(0.95, 0.13, M('#4fc23f', 0.4), loc=(0, 0, -0.12))
    lathe([(1.0, 0.0), (1.02, 0.15), (0.95, 0.5), (0.7, 0.85), (0.3, 1.02), (0.0, 1.05)], t, loc=(0, 0, 0.0), seg=40)
    for k, (x, y, z) in enumerate([(-0.4, -0.5, 0.78), (0.3, -0.55, 0.75), (0, -0.2, 0.98), (-0.6, -0.1, 0.8), (0.6, -0.1, 0.72), (0.0, -0.85, 0.45)]):
        sphere(0.07, M('#fff2d0', 0.4), (x, y, z), scale=(1.4, 1, 0.7), rot=(0, 0, k * 40))
    return {'rot_z': -15, 'tilt': 12, 'fit': 0.95}

@reg
def m_fries():
    cone(0.66, 0.9, 1.1, M('#e8334a', 0.35, 0, 0.6), loc=(0, 0, -0.55), seg=4, rot=(0, 0, 45))
    sphere(0.3, M('#ffd21f', 0.3), (0, -0.62, -0.5), scale=(1, 0.2, 0.7))
    rng = [(-0.6, 0.0, 0.9, 5), (-0.3, 0.2, 1.3, -4), (0.0, -0.1, 1.15, 3), (0.3, 0.25, 1.4, 6), (0.55, 0.0, 1.0, -5), (-0.45, -0.3, 0.85, -3), (0.2, -0.35, 0.8, 2), (-0.1, 0.35, 1.5, -2), (0.45, -0.3, 0.9, 4)]
    for (x, y, h, rz) in rng:
        cube((0.21, 0.21, 1.2), M('#ffd04a', 0.45, 0, 0.3), loc=(x * 0.9, y, h - 0.15), rot=(rz, rz * 0.7, 0), bevel=0.03)
    return {'rot_z': -15, 'fit': 0.9}

@reg
def m_hotdog():
    bun = M('#e0a050', 0.45, 0, 0.4)
    sphere(0.5, bun, (0, 0.28, -0.1), scale=(2.1, 0.8, 0.9))
    sphere(0.45, M('#d6432b', 0.25, 0, 0.8), (0, 0, 0.12), scale=(2.35, 0.9, 0.9))
    sphere(0.5, bun, (0, -0.28, -0.12), scale=(2.05, 0.7, 0.75))
    pts = [(-1.3 + i * 0.22, -0.05 + (0.12 if i % 2 else -0.12) , 0.58) for i in range(13)]
    curve_tube(pts, 0.06, M('#ffcc1f', 0.3))
    sphere(0.12, glow('#ffffff', 2), (-0.6, -0.4, 0.2), scale=(2, 0.4, 0.5))
    return {'rot_z': -20, 'tilt': 12}

@reg
def m_icecream():
    cone(0.62, 0.04, 1.5, M('#e8b25a', 0.5), loc=(0, 0, -0.85), rot=(180, 0, 0), seg=24)
    for z in (-0.4, -0.8, -1.2): torus(0.62 * (z + 1.6) / 1.5 * 0.97, 0.035, M('#c98a3b', 0.5), loc=(0, 0, z))
    sphere(0.72, M('#ff9ec7', 0.2, 0, 0.8), (0, 0, 0.0), seg=36)
    torus(0.66, 0.1, M('#ff9ec7', 0.2, 0, 0.8), loc=(0, 0, -0.15))
    sphere(0.6, M('#8de8c8', 0.2, 0, 0.8), (0, 0, 0.8), seg=36)
    sphere(0.16, M('#e8203a', 0.12, 0, 1), (0, 0, 1.45))
    curve_tube([(0, 0, 1.55), (0.1, 0, 1.8), (0.3, 0, 1.9)], 0.03, M('#3a8a2a', 0.5))
    sphere(0.14, glow('#ffffff', 2), (-0.3, -0.5, 1.0), scale=(1, 0.4, 1.8), rot=(0, 30, 0))
    return {'rot_z': -15}

@reg
def m_donut():
    torus(0.72, 0.38, M('#e8a04a', 0.45, 0, 0.3), seg=48, minor=24)
    torus(0.72, 0.36, M('#ff7eb6', 0.15, 0, 1.0), loc=(0, 0, 0.2), seg=48, minor=24).scale = (1.02, 1.02, 0.7)
    import random; rg = random.Random(3)
    cols = ['#ffffff', '#ffe14a', '#5ad0ff', '#7affb0', '#a366ff']
    for i in range(16):
        a = rg.random() * 6.28; rr = 0.72 + (rg.random() - 0.5) * 0.45
        cyl(0.035, 0.18, M(cols[i % 5], 0.4), loc=(rr * math.cos(a), rr * math.sin(a), 0.47), rot=(rg.random() * 60 - 30, 90, rg.random() * 180), seg=8)
    return {'rot_z': -15, 'tilt': 50}

@reg
def m_cake():
    pk = M('#ff9ec7', 0.3, 0, 0.7); cr = M('#fff2e0', 0.35, 0, 0.5); wh = M('#ffffff', 0.25, 0, 0.7)
    cyl(1.15, 0.7, pk, loc=(0, 0, -0.6), bevel=0.1)
    cyl(0.8, 0.6, cr, loc=(0, 0, 0.05), bevel=0.1)
    torus(1.12, 0.1, wh, loc=(0, 0, -0.25)); torus(0.78, 0.1, wh, loc=(0, 0, 0.35))
    for k in range(10):
        a = k * 36 * math.pi / 180; sphere(0.13, wh, (1.1 * math.cos(a), 1.1 * math.sin(a), -0.33), scale=(1, 1, 1.5))
    for k in range(3):
        a = (k * 120 + 30) * math.pi / 180
        cyl(0.07, 0.5, M(['#5ad0ff', '#ffd21f', '#7affb0'][k], 0.4), loc=(0.35 * math.cos(a), 0.35 * math.sin(a), 0.65))
        sphere(0.09, glow('#ffb01f', 4), (0.35 * math.cos(a), 0.35 * math.sin(a), 1.0), scale=(1, 1, 1.5))
    sphere(0.14, M('#e8203a', 0.12, 0, 1), (0, -0.0, 0.4))
    return {'rot_z': -15, 'tilt': 15}

@reg
def m_cookie():
    cyl(1.05, 0.32, M('#d9964a', 0.55, 0, 0.3), bevel=0.1, seg=48)
    import random; rg = random.Random(5)
    for i in range(9):
        a = rg.random() * 6.28; rr = (rg.random() ** 0.5) * 0.7
        sphere(0.17, M('#4a2a1a', 0.35, 0, 0.5), (rr * math.cos(a), rr * math.sin(a), 0.16), scale=(1, 1, 0.55), rot=(0, 0, rg.random() * 90))
    return {'rot_z': -15, 'tilt': 50}

@reg
def m_candy():
    sphere(0.62, M('#ff4f8b', 0.15, 0, 1.0), scale=(1.2, 1, 1), seg=32)
    for x in (-0.2, 0.1): torus(0.6, 0.06, M('#ffffff', 0.3), loc=(x, 0, 0), rot=(0, 90, 0), seg=32).scale = (1, 1, 1)
    w = M('#7a5cff', 0.25, 0, 0.8)
    for s in (-1, 1):
        cone(0.45, 0.1, 0.7, w, loc=(s * 0.95, 0, 0), rot=(0, s * -90, 0))
        for k in range(5):
            a = k * 72; r = math.radians(a)
            cone(0.18, 0.02, 0.5, w, loc=(s * 1.38, 0.3 * math.cos(r), 0.3 * math.sin(r)), rot=(0, s * -90, 0))
    sphere(0.14, glow('#ffffff', 2), (-0.3, -0.5, 0.3), scale=(1, 0.4, 1.8), rot=(0, 30, 0))
    return {'rot_z': -20, 'tilt': 10}

@reg
def m_lollipop():
    cyl(0.08, 1.6, M('#e8d2a8', 0.4), loc=(0, 0, -1.1))
    for i, (rr, c) in enumerate([(1.0, '#ff4f8b'), (0.8, '#ffffff'), (0.6, '#ff4f8b'), (0.4, '#ffffff'), (0.2, '#ff4f8b')]):
        cyl(rr, 0.26 + i * 0.03, M(c, 0.15, 0, 1.0), rot=(90, 0, 0), loc=(0, 0, 0.45), seg=48)
    sphere(0.16, glow('#ffffff', 2), (-0.55, -0.28, 0.95), scale=(1, 0.3, 1.8), rot=(0, 30, 0))
    return {'rot_z': -20}

@reg
def m_egg():
    sphere(0.9, M('#fff4e0', 0.25, 0, 0.8), scale=(0.82, 0.82, 1.05), seg=40, rot=(0, 10, 0))
    eyes(0.28, -0.68, 0.1, 0.13); smile(0, -0.74, -0.08, 0.14, 0.07); blush(0.46, -0.64, -0.1, 0.1)
    return {'rot_z': -10}


@reg
def m_cheese():
    c = M('#ffc933', 0.3, 0, 0.6); h = M('#e0a010', 0.5)
    pts = [(-1.0, -0.8)] + [(-1.0 + 2.5 * math.cos(math.radians(a)), -0.8 + 2.5 * math.sin(math.radians(a))) for a in range(5, 56, 5)]
    extrude_poly(pts, 0.9, c, bevel=0.07)
    for (x, z, s) in [(0.2, -0.1, 0.2), (0.6, 0.45, 0.16), (-0.1, 0.1, 0.13), (0.55, -0.35, 0.12), (0.1, 0.45, 0.1)]:
        sphere(s, h, (x, -0.46, z), scale=(1, 0.3, 1))
    return {'rot_z': -15, 'tilt': 10}

@reg
def m_bread():
    def lobes():
        p = [(-0.9, -1.0), (0.9, -1.0)]
        p += [(0.45 + 0.45 * math.cos(math.radians(a)), 0.45 + 0.5 * math.sin(math.radians(a))) for a in range(0, 181, 15)]
        p += [(-0.45 + 0.45 * math.cos(math.radians(a)), 0.45 + 0.5 * math.sin(math.radians(a))) for a in range(0, 181, 15)]
        return p
    extrude_poly(lobes(), 0.42, M('#c9803a', 0.5, 0, 0.3), bevel=0.1)
    extrude_poly([(x * 0.82, (z + 0.2) * 0.82 - 0.2) for x, z in lobes()], 0.5, M('#ffe3a3', 0.6), bevel=0.04)
    for (x, z) in [(-0.4, 0.1), (0.2, 0.2), (-0.1, -0.4), (0.4, -0.3)]: sphere(0.05, M('#e8c070', 0.7), (x, -0.27, z), scale=(1, 0.3, 1))
    return {'rot_z': -20, 'tilt': 5}

@reg
def m_cupcake():
    cone(0.5, 0.8, 1.0, M('#4aa3ff', 0.35, 0, 0.5), loc=(0, 0, -0.65), seg=14)
    torus(0.8, 0.06, M('#2f6df0', 0.35), loc=(0, 0, -0.15))
    pk = M('#ff9ec7', 0.2, 0, 0.9)
    torus(0.62, 0.3, pk, loc=(0, 0, 0.12)); torus(0.42, 0.27, pk, loc=(0, 0, 0.5)); sphere(0.33, pk, (0, 0, 0.78))
    sphere(0.17, M('#e8203a', 0.12, 0, 1), (0, 0, 1.2))
    import random; rg = random.Random(2)
    for i in range(10):
        a = rg.random() * 6.28; sphere(0.04, M(['#ffffff', '#ffe14a', '#5ad0ff'][i % 3], 0.4), (0.7 * math.cos(a) * 0.9, -0.5 - rg.random() * 0.1, 0.15 + rg.random() * 0.5), scale=(1, 1, 1))
    return {'rot_z': -15, 'tilt': 5}

@reg
def m_coffee():
    w = M('#ffffff', 0.2, 0, 0.7)
    lathe([(0.0, -0.75), (0.5, -0.75), (0.75, -0.3), (0.85, 0.3), (0.85, 0.5), (0.0, 0.5)], w, seg=40)
    lathe([(0.0, -0.95), (1.2, -0.95), (1.35, -0.85), (1.2, -0.8), (0.0, -0.78)], w, seg=40)
    cyl(0.8, 0.05, M('#5a2e12', 0.15, 0, 0.9), loc=(0, 0, 0.44), seg=40)
    torus(0.8, 0.06, w, loc=(0, 0, 0.5))
    torus(0.38, 0.1, w, loc=(0.95, 0, -0.05), rot=(90, 0, 0))
    sphere(0.12, glow('#ffffff', 2), (-0.5, -0.65, 0.2), scale=(1, 0.3, 1.8), rot=(0, 30, 0))
    for x in (-0.25, 0.25):
        curve_tube([(x, 0, 0.7), (x + 0.15, 0, 0.95), (x - 0.1, 0, 1.2), (x + 0.1, 0, 1.45)], 0.06, M('#f0f4ff', 0.6))
    return {'rot_z': -20, 'tilt': 10}

@reg
def m_milk():
    cube((1.15, 1.15, 1.4), M('#ffffff', 0.35, 0, 0.5), loc=(0, 0, -0.35), bevel=0.05)
    extrude_poly([(-0.575, 0.0), (0.575, 0.0), (0.575, 0.2), (0.0, 0.8), (-0.575, 0.2)], 1.15, M('#4aa3ff', 0.3, 0, 0.5), loc=(0, 0, 0.35), bevel=0.04)
    cube((1.17, 1.17, 0.4), M('#4aa3ff', 0.3, 0, 0.5), loc=(0, 0, -0.8), bevel=0.04)
    sphere(0.3, M('#4aa3ff', 0.2, 0, 0.9), (0, -0.58, -0.15), scale=(1, 0.2, 1))
    cone(0.22, 0.0, 0.4, M('#4aa3ff', 0.2, 0, 0.9), loc=(0, -0.58, 0.18), rot=(90, 0, 0)).scale = (1, 0.3, 1)
    return {'rot_z': -25, 'tilt': 5}

@reg
def m_pie():
    g = M('#e3a24a', 0.5, 0, 0.3)
    cone(0.85, 1.05, 0.45, g, loc=(0, 0, -0.3), seg=40)
    torus(1.03, 0.15, g, loc=(0, 0, -0.07), seg=40)
    cyl(0.95, 0.08, M('#c7352a', 0.25, 0, 0.8), loc=(0, 0, -0.08), seg=40)
    for th, zz in ((45, 0.02), (-45, 0.1)):
        t = math.radians(th)
        for off in (-0.6, -0.2, 0.2, 0.6):
            L = 2 * math.sqrt(0.95 ** 2 - off ** 2) * 0.97
            cube((L, 0.17, 0.08), g, loc=(-math.sin(t) * off, math.cos(t) * off, zz), rot=(0, 0, th), bevel=0.03)
    torus(1.0, 0.1, g, loc=(0, 0, 0.1), seg=40)
    return {'rot_z': -15, 'tilt': 40}

# ======================= DIEREN =======================
def nose(x, y, z, r=0.1, c='#2a1a1a'): return sphere(r, M(c, 0.25, 0, 0.8), (x, y, z), scale=(1.2, 0.8, 0.9))
def ell(cx, cz, rx, rz, n=28, a0=0, a1=360):
    return [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cz + rz * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n)]

@reg
def m_fish():
    o = M('#ff8a2a', 0.2, 0, 0.9); l = M('#ffc27a', 0.3, 0, 0.7)
    sphere(1.0, o, (0, 0, 0), scale=(1.15, 0.62, 0.85), seg=40)
    sphere(0.8, l, (0.1, -0.05, -0.28), scale=(1.15, 0.6, 0.5), seg=32)
    extrude_poly([(-0.9, 0.0), (-1.75, 0.8), (-1.5, 0.0), (-1.75, -0.8)], 0.18, M('#ff6a1a', 0.3, 0, 0.7), bevel=0.05)
    extrude_poly([(-0.3, 0.6), (0.2, 1.1), (0.6, 0.5)], 0.14, M('#ff6a1a', 0.3, 0, 0.7), bevel=0.04)
    extrude_poly([(-0.1, -0.55), (0.3, -1.0), (0.45, -0.5)], 0.14, M('#ff6a1a', 0.3, 0, 0.7), bevel=0.04)
    for x in (-0.15, -0.65): sphere(0.1, WHITE(), (x, 0, 0.1), scale=(1, 6.0, 7.5) if False else (1, 5.6, 7.2))
    eye(0.65, -0.46, 0.2, 0.22); smile(1.0, -0.4, -0.15, 0.1, 0.05, 0.03)
    return {'rot_z': -12, 'tilt': 5}

@reg
def m_shark():
    b = M('#6f96c2', 0.25, 0, 0.8)
    sphere(1.0, b, (0, 0, 0), scale=(1.5, 0.72, 0.7), seg=40)
    sphere(0.9, M('#f2f7ff', 0.3, 0, 0.6), (0.1, -0.12, -0.28), scale=(1.45, 0.6, 0.42), seg=32)
    extrude_poly([(-1.1, 0.0), (-2.0, 0.95), (-1.8, 0.1), (-2.0, -0.7)], 0.2, b, bevel=0.05)
    extrude_poly([(-0.3, 0.55), (0.1, 1.3), (0.5, 0.5)], 0.18, b, bevel=0.05)
    extrude_poly([(0.2, -0.5), (0.0, -1.0), (0.6, -0.5)], 0.14, b, bevel=0.05)
    eye(0.8, -0.58, 0.18, 0.18)
    smile(0.95, -0.62, -0.18, 0.36, 0.14, 0.035, '#5a1a2a')
    for t in (-0.2, 0.05, 0.3): cone(0.06, 0.0, 0.14, WHITE(), loc=(0.95 + t * 1.15, -0.64, -0.25 + 0.0 + (0.14 * (1 - t * t)) * 0.0), rot=(0, 0, 180)) if False else None
    for i in range(3): cube((0.025, 0.02, 0.2), M('#4a6a92', 0.4), loc=(0.35 - i * 0.12, -0.7, 0.0), bevel=0)
    return {'rot_z': -12, 'tilt': 5}

@reg
def m_crab():
    r = M('#ee3b2b', 0.2, 0, 0.9); dr = M('#c92a22', 0.3, 0, 0.6)
    sphere(1.0, r, (0, 0, -0.1), scale=(1.3, 0.85, 0.65), seg=40)
    for s in (-1, 1):
        for k in range(3):
            curve_tube([(s * 1.1, 0.0, -0.1 - k * 0.05), (s * (1.5 + k * 0.1), -0.05 - k * 0.12, -0.35 - k * 0.12), (s * (1.65 + k * 0.1), -0.05 - k * 0.12, -0.8 - k * 0.1)], 0.07, dr)
        curve_tube([(s * 1.1, -0.2, 0.2), (s * 1.45, -0.3, 0.6)], 0.09, r)
        sphere(0.5, r, (s * 1.55, -0.35, 0.9), scale=(1.0, 0.6, 0.9))
        cone(0.2, 0.0, 0.45, r, loc=(s * 1.5 - s * 0.08, -0.35, 1.35), rot=(0, s * -12, 0))
        sphere(0.2, dr, (s * 1.8, -0.35, 1.25), scale=(1, 0.7, 1.4))
        cyl(0.06, 0.4, dr, loc=(s * 0.35, -0.3, 0.45))
        eye(s * 0.35, -0.35, 0.78, 0.2)
    smile(0, -0.78, -0.12, 0.2, 0.09, 0.03)
    return {'rot_z': -10, 'tilt': 10}

@reg
def m_whale():
    b = M('#3f8fe8', 0.2, 0, 0.9)
    sphere(1.0, b, (0, 0, 0), scale=(1.4, 0.85, 0.88), seg=40)
    sphere(0.9, M('#c8e6ff', 0.3, 0, 0.6), (0.15, -0.15, -0.3), scale=(1.3, 0.7, 0.5), seg=32)
    cone(0.45, 0.18, 1.0, b, loc=(-1.35, 0, 0.2), rot=(0, 55, 0))
    extrude_poly([(-1.5, 0.45), (-1.3, 1.45), (-1.0, 0.7), (-0.75, 1.35), (-0.85, 0.3)], 0.2, b, bevel=0.05)
    extrude_poly([(0.1, -0.6), (-0.3, -1.1), (0.5, -0.6)], 0.14, b, bevel=0.04)
    eye(0.85, -0.7, 0.2, 0.18); smile(0.95, -0.82, -0.05, 0.3, 0.1, 0.03, '#10305a'); blush(0.0, -0.8, 0.0, 0.1) if False else None
    for dx in (-0.12, 0.12): curve_tube([(0.1, 0, 0.85), (0.1 + dx * 2, 0, 1.3), (0.1 + dx * 4, 0, 1.15)], 0.045, M('#9fd8ff', 0.1, 0, 1))
    for (x, z) in [(0.0, 1.45), (0.5, 1.35), (-0.3, 1.5)]: sphere(0.07, M('#9fd8ff', 0.1, 0, 1), (x, 0, z))
    return {'rot_z': -12, 'tilt': 5}

@reg
def m_octopus():
    p = M('#b05be8', 0.2, 0, 0.9); lp = M('#d79bff', 0.3, 0, 0.6)
    sphere(1.0, p, (0, 0, 0.35), scale=(1.0, 0.95, 1.05), seg=40)
    for i in range(8):
        a = math.radians(i * 45 + 22)
        x0, y0 = 0.55 * math.cos(a), 0.55 * math.sin(a)
        pts = [(x0, y0, -0.45), (x0 * 1.6, y0 * 1.6, -0.85), (x0 * 2.1 + math.sin(i) * 0.2, y0 * 2.1, -1.1), (x0 * 2.1 + 0.3 * (1 if i % 2 else -1), y0 * 2.1, -1.35)]
        curve_tube(pts, 0.16, p); sphere(0.16, p, pts[-1])
    eyes(0.38, -0.82, 0.5, 0.25); smile(0, -0.95, 0.0, 0.22, 0.1, 0.035, '#4a1060'); blush(0.62, -0.8, 0.15, 0.12, '#ff8fc0')
    return {'rot_z': -12, 'tilt': 5}

@reg
def m_jellyfish():
    p = M('#ff8fd0', 0.12, 0, 1.0); lp = M('#ffc0e8', 0.3, 0, 0.8)
    sphere(1.0, p, (0, 0, 0.35), scale=(1.15, 1.1, 0.88), seg=40)
    torus(1.0, 0.12, lp, loc=(0, 0, -0.38)).scale = (1.12, 1.07, 1.0)
    for i in range(5):
        a = math.radians(i * 72 + 20); x0, y0 = 0.7 * math.cos(a), 0.7 * math.sin(a)
        curve_tube([(x0, y0, -0.4), (x0 * 1.05 + 0.15, y0, -0.8), (x0 * 0.9 - 0.15, y0, -1.2), (x0 + 0.1, y0, -1.55)], 0.07, lp)
    eyes(0.33, -0.95, 0.35, 0.18); smile(0, -1.0, 0.02, 0.18, 0.08, 0.03, '#6a1a4a'); blush(0.6, -0.9, 0.1, 0.1, '#ff6fa0')
    return {'rot_z': -12, 'tilt': 5}

@reg
def m_turtle():
    sh = M('#3fae4a', 0.25, 0, 0.8); tl = M('#2a8a3a', 0.3, 0, 0.7); sk = M('#a6e06a', 0.35, 0, 0.5)
    sphere(1.0, sh, (0, 0.1, 0.2), scale=(1.25, 1.05, 0.62), seg=40)
    sphere(1.0, M('#e8d28a', 0.5), (0, 0.1, -0.05), scale=(1.2, 1.0, 0.4), seg=32)
    for (x, y) in [(0, 0.1), (0.6, 0.1), (-0.6, 0.1), (0.3, 0.6), (-0.3, 0.6), (0.3, -0.4), (-0.3, -0.4)]:
        z = 0.2 + 0.62 * math.sqrt(max(0, 1 - (x / 1.25) ** 2 - ((y - 0.1) / 1.05) ** 2)) * 1.0
        sphere(0.26, tl, (x, y, z - 0.02), scale=(1, 1, 0.3), seg=12)
    sphere(0.5, sk, (0, -1.15, 0.25), scale=(1, 1.0, 0.95)); eyes(0.2, -1.55, 0.4, 0.11); smile(0, -1.6, 0.15, 0.1, 0.05, 0.02)
    for sx in (-1, 1):
        for sy in (-1, 1): sphere(0.3, sk, (sx * 0.95, 0.1 + sy * 0.6, -0.1), scale=(1, 1.3, 0.6))
    cone(0.15, 0.0, 0.4, sk, loc=(0, 1.2, 0.0), rot=(-90, 0, 0))
    return {'rot_z': -25, 'tilt': 25}

@reg
def m_cow():
    w = M('#ffffff', 0.35, 0, 0.5); k = M('#2a2a33', 0.4); pk = M('#ffb0c0', 0.35, 0, 0.5)
    sphere(1.0, w, (0, 0, 0), scale=(1.0, 0.9, 0.95), seg=40)
    sphere(0.42, k, (-0.55, -0.45, 0.45), scale=(1, 0.6, 1)); sphere(0.3, k, (0.55, -0.65, 0.5), scale=(1, 0.5, 0.8))
    for s in (-1, 1):
        sphere(0.35, w if s > 0 else k, (s * 1.05, 0.0, 0.3), scale=(1.1, 0.35, 0.6), rot=(0, 0, s * -20))
        cone(0.16, 0.05, 0.5, M('#fff0cc', 0.3), loc=(s * 0.55, 0.0, 0.95), rot=(0, s * 20, 0))
    sphere(0.6, pk, (0, -0.55, -0.4), scale=(1.1, 0.7, 0.7)); 
    for s in (-1, 1): sphere(0.07, M('#c06080', 0.4), (s * 0.2, -1.02, -0.4), scale=(1, 0.5, 1.4))
    eyes(0.42, -0.8, 0.22, 0.16); smile(0, -1.08, -0.62, 0.22, 0.07, 0.025, '#802040')
    return {'rot_z': -15}

@reg
def m_pig():
    p = M('#ffa6bd', 0.3, 0, 0.7); dp = M('#ff7f9f', 0.35, 0, 0.6)
    sphere(1.0, p, scale=(1.05, 0.9, 0.95), seg=40)
    for s in (-1, 1): cone(0.4, 0.0, 0.6, p, loc=(s * 0.7, 0, 0.88), rot=(15, s * 28, 0), seg=3)
    cyl(0.42, 0.45, dp, rot=(90, 0, 0), loc=(0, -0.85, -0.2), bevel=0.04)
    for s in (-1, 1): sphere(0.09, M('#a04060', 0.4), (s * 0.15, -1.1, -0.2), scale=(0.8, 0.5, 1.5))
    eyes(0.42, -0.82, 0.38, 0.15); blush(0.68, -0.78, -0.05, 0.14, '#ff6f95')
    return {'rot_z': -15}

@reg
def m_chicken():
    w = M('#ffffff', 0.35, 0, 0.5); rd = M('#ee2b3a', 0.25, 0, 0.8); o = M('#ffb01f', 0.3, 0, 0.7)
    sphere(1.0, w, (0, 0, 0), scale=(0.95, 0.9, 1.0), seg=40)
    for (x, z, s) in [(-0.3, 1.0, 0.25), (0, 1.15, 0.3), (0.3, 1.0, 0.25)]: sphere(s, rd, (x, -0.05, z))
    cone(0.22, 0.0, 0.5, o, loc=(0, -1.0, 0.0), rot=(90, 0, 0)).scale = (1.0, 1.0, 1.0)
    sphere(0.18, rd, (0, -0.85, -0.38), scale=(0.8, 0.6, 1.3))
    eyes(0.38, -0.82, 0.3, 0.15)
    for s in (-1, 1): sphere(0.4, M('#f0f4ff', 0.4), (s * 0.95, 0.1, -0.15), scale=(0.4, 0.9, 1.1), rot=(0, 0, s * 12))
    for s in (-1, 1):
        cyl(0.06, 0.4, o, loc=(s * 0.35, -0.1, -1.05)); sphere(0.18, o, (s * 0.35, -0.25, -1.28), scale=(1.2, 1.5, 0.4))
    blush(0.6, -0.78, 0.0, 0.1, '#ffb0a0')
    return {'rot_z': -15}

@reg
def m_sheep():
    wl = M('#fff6e8', 0.55, 0, 0.2); dk = M('#3a3a46', 0.4, 0, 0.5)
    import random; rg = random.Random(4)
    sphere(1.0, wl, (0, 0.25, 0.1), seg=24)
    for i in range(14):
        a = i * 2 * math.pi / 14
        sphere(0.45, wl, (1.0 * math.cos(a), 0.1, 0.1 + 1.0 * math.sin(a)), seg=16)
    for (x, z) in [(-0.45, 0.95), (0.0, 1.05), (0.45, 0.95), (-0.3, 0.75), (0.3, 0.75)]: sphere(0.38, wl, (x, -0.4, z), seg=16)
    sphere(0.62, dk, (0, -0.72, -0.1), scale=(0.9, 0.85, 1.1))
    for s in (-1, 1): sphere(0.3, dk, (s * 0.72, -0.5, 0.0), scale=(1.3, 0.4, 0.55), rot=(0, 0, s * -20))
    eyes(0.25, -1.2, 0.0, 0.15); smile(0, -1.3, -0.35, 0.15, 0.06, 0.025, '#e8a0b0')
    return {'rot_z': -15}


@reg
def m_dog():
    t = M('#e0a866', 0.3, 0, 0.7); br = M('#7a4a22', 0.35, 0, 0.6)
    sphere(1.0, t, scale=(1.05, 0.95, 0.95), seg=40)
    for s in (-1, 1): sphere(0.5, br, (s * 1.0, -0.05, 0.0), scale=(0.5, 0.45, 1.3), rot=(0, 0, s * -12))
    sphere(0.5, M('#fff4e0', 0.3, 0, 0.6), (0, -0.65, -0.3), scale=(1.1, 0.8, 0.8))
    nose(0, -1.08, -0.1, 0.17)
    sphere(0.25, M('#ff7f9f', 0.3), (0, -0.88, -0.68), scale=(0.9, 0.5, 1.0))
    sphere(0.3, br, (0.5, -0.6, 0.3), scale=(1, 0.5, 1))
    eyes(0.42, -0.82, 0.22, 0.17); smile(0, -1.0, -0.45, 0.3, 0.1, 0.03)
    return {'rot_z': -15}

@reg
def m_cat():
    o = M('#ff9a3c', 0.3, 0, 0.7)
    sphere(1.0, o, scale=(1.1, 0.9, 0.9), seg=40)
    for s in (-1, 1):
        cone(0.45, 0.0, 0.75, o, loc=(s * 0.72, 0.0, 0.95), rot=(0, s * 14, 0), seg=4)
        cone(0.28, 0.0, 0.5, M('#ffb0c0', 0.4), loc=(s * 0.7, -0.14, 0.88), rot=(0, s * 14, 0), seg=4)
    sphere(0.4, M('#fff4e0', 0.3, 0, 0.6), (0, -0.7, -0.35), scale=(1.1, 0.7, 0.8))
    nose(0, -0.98, -0.12, 0.09, '#ff6f95'); smile(-0.13, -0.97, -0.38, 0.13, 0.06, 0.022, '#4a2a2a'); smile(0.13, -0.97, -0.38, 0.13, 0.06, 0.022, '#4a2a2a')
    eyes(0.42, -0.78, 0.18, 0.18)
    for s in (-1, 1):
        for k, z in enumerate((-0.2, -0.3)): cyl(0.012, 0.7, M('#f4f4f4', 0.4), loc=(s * 0.85, -0.78, z - 0.05 * k), rot=(0, 90, s * (-8 + 15 * k)))
    for x in (-0.2, 0, 0.2): cube((0.07, 0.04, 0.3 if x == 0 else 0.22), M('#a85a14', 0.4), loc=(x, -0.9, 0.7), bevel=0.01)
    return {'rot_z': -15}

@reg
def m_rabbit():
    w = M('#ffffff', 0.35, 0, 0.5); pk = M('#ffb0c0', 0.4)
    sphere(1.0, w, (0, 0, -0.3), scale=(1.0, 0.9, 0.9), seg=40)
    for s in (-1, 1):
        sphere(0.38, w, (s * 0.38, 0.0, 1.2), scale=(0.55, 0.35, 1.75), rot=(0, s * 6, 0))
        sphere(0.25, pk, (s * 0.38, -0.1, 1.2), scale=(0.5, 0.3, 1.55), rot=(0, s * 6, 0))
    nose(0, -0.88, -0.3, 0.09, '#ff6f95')
    for s in (-1, 1): cube((0.14, 0.05, 0.2), WHITE(), loc=(s * 0.07, -0.88, -0.56), bevel=0.02)
    sphere(0.3, w, (-0.28, -0.7, -0.45), scale=(1, 0.5, 0.8)); sphere(0.3, w, (0.28, -0.7, -0.45), scale=(1, 0.5, 0.8))
    eyes(0.4, -0.74, -0.02, 0.15); smile(-0.1, -0.88, -0.4, 0.1, 0.04, 0.02); blush(0.6, -0.72, -0.28, 0.12)
    return {'rot_z': -15}

@reg
def m_bear():
    b = M('#a8673a', 0.4, 0, 0.5)
    sphere(1.0, b, scale=(1.05, 0.95, 0.92), seg=40)
    for s in (-1, 1): sphere(0.38, b, (s * 0.72, 0.0, 0.8)); sphere(0.2, M('#d89a62', 0.4), (s * 0.72, -0.2, 0.8), scale=(1, 0.5, 1))
    sphere(0.45, M('#e8c08a', 0.4, 0, 0.5), (0, -0.7, -0.3), scale=(1.1, 0.7, 0.85))
    nose(0, -1.05, -0.12, 0.14); smile(0, -1.0, -0.42, 0.2, 0.08, 0.025)
    eyes(0.4, -0.84, 0.25, 0.13)
    return {'rot_z': -15}

@reg
def m_penguin():
    b = M('#2b3a5c', 0.2, 0, 0.8); o = M('#ff9f1f', 0.3, 0, 0.6)
    sphere(1.0, b, (0, 0.05, 0), scale=(0.95, 0.85, 1.25), seg=40)
    sphere(0.9, WHITE(), (0, -0.2, -0.2), scale=(0.8, 0.7, 1.05), seg=32)
    sphere(0.4, WHITE(), (-0.28, -0.6, 0.62), scale=(1, 0.5, 1)); sphere(0.4, WHITE(), (0.28, -0.6, 0.62), scale=(1, 0.5, 1))
    cone(0.18, 0.0, 0.4, o, loc=(0, -0.92, 0.45), rot=(90, 0, 0))
    eyes(0.3, -0.78, 0.72, 0.13)
    for s in (-1, 1):
        sphere(0.4, b, (s * 0.95, -0.05, -0.1), scale=(0.28, 0.6, 1.1), rot=(0, 0, s * 15))
        sphere(0.3, o, (s * 0.35, -0.55, -1.4), scale=(1.2, 1.6, 0.4))
    blush(0.55, -0.74, 0.5, 0.08)
    return {'rot_z': -15}

@reg
def m_lion():
    mane = M('#c9701f', 0.5, 0, 0.3); f = M('#ffc766', 0.3, 0, 0.6)
    for i in range(18):
        a = i * 2 * math.pi / 18
        sphere(0.45, mane if i % 2 else M('#a8561a', 0.5), (1.0 * math.cos(a), 0.15, 1.0 * math.sin(a)), seg=16)
    sphere(1.1, mane, (0, 0.3, 0), scale=(1, 0.6, 1), seg=24)
    sphere(0.85, f, (0, -0.2, 0), scale=(1, 0.9, 0.95), seg=36)
    for s in (-1, 1): sphere(0.3, f, (s * 0.55, -0.1, 0.8), scale=(1, 0.5, 1)); sphere(0.17, M('#ff9aa8', 0.4), (s * 0.55, -0.22, 0.8), scale=(1, 0.4, 1))
    sphere(0.4, M('#fff4e0', 0.3, 0, 0.6), (0, -0.82, -0.3), scale=(1.1, 0.7, 0.8))
    nose(0, -1.14, -0.1, 0.13, '#5a2a1a'); smile(0, -1.08, -0.4, 0.2, 0.08, 0.025)
    eyes(0.36, -0.88, 0.2, 0.14)
    return {'rot_z': -15, 'fit': 0.95}

@reg
def m_frog():
    g = M('#5ad04a', 0.2, 0, 0.8)
    sphere(1.0, g, (0, 0, -0.1), scale=(1.25, 0.95, 0.85), seg=40)
    sphere(0.7, M('#d8f7a0', 0.3, 0, 0.5), (0, -0.4, -0.55), scale=(1.2, 0.6, 0.55), seg=24)
    for s in (-1, 1):
        sphere(0.42, g, (s * 0.65, -0.1, 0.72), seg=24)
        eye(s * 0.65, -0.46, 0.8, 0.26)
    smile(0, -0.9, -0.15, 0.75, 0.25, 0.04, '#2a5a1a')
    for s in (-1, 1): sphere(0.05, M('#2a5a1a', 0.4), (s * 0.18, -0.93, 0.25)); blush(0.0, 0, 0, 0) if False else None
    blush(0.9, -0.8, -0.2, 0.13, '#ff8f90')
    return {'rot_z': -15, 'tilt': 5}

@reg
def m_duck():
    y = M('#ffd21f', 0.15, 0, 1.0); o = M('#ff8a1f', 0.25, 0, 0.8)
    sphere(1.0, y, (0, 0.1, -0.45), scale=(1.1, 1.15, 0.78), seg=40)
    sphere(0.7, y, (0, -0.1, 0.55), seg=32)
    sphere(0.28, o, (0, -0.75, 0.38), scale=(1.4, 1.2, 0.5))
    sphere(0.28, o, (0, -0.82, 0.36), scale=(1.0, 1.0, 0.35)) if False else None
    cone(0.2, 0.0, 0.55, y, loc=(0, 1.15, -0.2), rot=(-70, 0, 0))
    for s in (-1, 1): sphere(0.5, M('#ffbf1f', 0.2, 0, 0.9), (s * 0.95, 0.15, -0.4), scale=(0.3, 0.9, 0.6), rot=(0, 0, s * 20))
    eyes(0.3, -0.58, 0.72, 0.12); blush(0.45, -0.55, 0.5, 0.1, '#ff9a60')
    sphere(0.12, glow('#ffffff', 2), (-0.5, -0.65, -0.1)) if False else None
    return {'rot_z': -30}

@reg
def m_owl():
    b = M('#9a6a3a', 0.4, 0, 0.5); c = M('#f0d9a8', 0.5)
    sphere(1.0, b, (0, 0.1, 0), scale=(0.95, 0.85, 1.15), seg=40)
    sphere(0.8, c, (0, -0.2, -0.38), scale=(0.8, 0.6, 0.85), seg=32)
    for s in (-1, 1):
        cone(0.3, 0.0, 0.5, b, loc=(s * 0.6, 0.0, 1.1), rot=(0, s * 20, 0), seg=4)
        sphere(0.46, c, (s * 0.38, -0.55, 0.45), scale=(1, 0.35, 1)); eye(s * 0.38, -0.7, 0.45, 0.28)
        sphere(0.4, b, (s * 0.95, 0.15, -0.2), scale=(0.28, 0.65, 1.0), rot=(0, 0, s * 10))
        sphere(0.25, M('#ff9f1f', 0.3), (s * 0.35, -0.55, -1.15), scale=(1.3, 1.5, 0.35))
    cone(0.14, 0.0, 0.35, M('#ff9f1f', 0.3), loc=(0, -0.95, 0.15), rot=(90, 0, 0))
    for (x, z) in [(-0.2, -0.3), (0.2, -0.3), (0, -0.6), (-0.3, -0.8), (0.3, -0.8)]: sphere(0.1, M('#c9a46a', 0.5), (x, -0.78, z), scale=(1, 0.3, 1.3))
    return {'rot_z': -15}

@reg
def m_bee():
    y = M('#ffd21f', 0.2, 0, 0.8); k = M('#2a2a33', 0.3, 0, 0.6)
    sphere(1.0, y, (-0.3, 0, 0), scale=(1.1, 0.8, 0.8), seg=40)
    for x in (-0.15, -0.65): sphere(0.5, k, (x, 0, 0), scale=(0.28, 0.82, 0.82)) if False else None
    for x in (-0.05, -0.55): sphere(1.0, k, (x, 0, 0), scale=(0.16, 0.76, 0.78), seg=24)
    cone(0.2, 0.0, 0.5, k, loc=(-1.6, 0, 0), rot=(0, -90, 0))
    sphere(0.7, y, (0.95, 0, 0.1), seg=32)
    eye(1.15, -0.5, 0.25, 0.2); smile(1.35, -0.45, -0.1, 0.1, 0.05, 0.022); blush(0.0, 0, 0, 0) if False else None
    for s in (0.7, 1.0): curve_tube([(1.0 + (s - 0.7) * 0.5, 0, 0.7), (1.2 + (s - 0.7) * 0.5, 0, 1.1), (1.4 + (s - 0.7) * 0.5, 0, 1.2)], 0.03, k)
    for sx in (1.4, 1.65): sphere(0.07, k, (sx, 0, 1.2 if sx < 1.5 else 1.3)) if False else None
    for dx in (-0.2, -0.6):
        sphere(0.5, M('#d6f1ff', 0.1, 0, 1.0), (dx, 0.1, 0.9), scale=(0.7, 0.18, 1.2), rot=(0, 25 if dx > -0.4 else 10, 0))
    return {'rot_z': -15, 'tilt': 8}

@reg
def m_butterfly():
    a = M('#ff8a2a', 0.25, 0, 0.8); b = M('#ffc84a', 0.25, 0, 0.8); sp = M('#7a4cff', 0.25, 0, 0.8); k = M('#2a2a33', 0.35, 0, 0.6)
    for s in (-1, 1):
        extrude_poly([(s * x, z) for x, z in ell(0.9, 0.5, 0.9, 0.8)], 0.1, a, bevel=0.04)
        extrude_poly([(s * x, z) for x, z in ell(0.6, -0.55, 0.55, 0.6)], 0.1, b, bevel=0.04)
        cyl(0.3, 0.14, sp, rot=(90, 0, 0), loc=(s * 1.05, -0.06, 0.6)); cyl(0.12, 0.16, WHITE(), rot=(90, 0, 0), loc=(s * 1.05, -0.07, 0.6))
        cyl(0.18, 0.14, sp, rot=(90, 0, 0), loc=(s * 0.7, -0.06, -0.6))
        curve_tube([(s * 0.08, -0.1, 0.95), (s * 0.3, -0.1, 1.4), (s * 0.55, -0.1, 1.5)], 0.03, k); sphere(0.07, k, (s * 0.55, -0.1, 1.5))
    sphere(0.22, k, (0, -0.05, 0.0), scale=(1, 1, 3.0)) if False else None
    cyl(0.14, 1.7, k, loc=(0, -0.08, -0.05), bevel=0.05)
    sphere(0.22, k, (0, -0.1, 0.9)); eyes(0.09, -0.3, 0.92, 0.07); 
    return {'rot_z': -15, 'tilt': 5}

@reg
def m_snail():
    sk = M('#f5d28a', 0.3, 0, 0.6); sh = M('#e0883a', 0.2, 0, 0.9); dk = M('#a85a1a', 0.3, 0, 0.8)
    sphere(1.0, sk, (0.2, 0, -0.85), scale=(1.8, 0.5, 0.35), seg=32)
    sphere(0.45, sk, (1.45, 0, -0.5), scale=(1, 0.8, 1.2))
    for s in (0, 1):
        x = 1.3 + 0.3 * s
        curve_tube([(x, -0.05, -0.2), (x + 0.1, -0.1, 0.25), (x + 0.2 + s * 0.1, -0.1, 0.55)], 0.06, sk)
        eye(x + 0.2 + s * 0.1, -0.12, 0.6, 0.15)
    smile(1.7, -0.3, -0.62, 0.12, 0.05, 0.02)
    sphere(1.0, sh, (-0.2, 0, 0.1), scale=(1, 0.6, 1), seg=40)
    pts = []
    for i in range(41):
        t = i / 40 * 4.0 * math.pi; R = 0.05 + 0.68 * (t / (4.0 * math.pi))
        x, z = R * math.cos(t), R * math.sin(t)
        yy = -0.6 * math.sqrt(max(0.02, 1 - (x * x + z * z))) - 0.02
        pts.append((x - 0.2, yy, z + 0.1))
    curve_tube(pts, 0.07, dk)
    return {'rot_z': -12, 'tilt': 5}

@reg
def m_elephant():
    g = M('#a4b0d0', 0.35, 0, 0.6); pk = M('#ffb0c0', 0.4)
    for s in (-1, 1):
        sphere(0.9, g, (s * 1.0, 0.2, 0.15), scale=(0.95, 0.2, 1.05), seg=32); sphere(0.65, pk, (s * 1.0, 0.1, 0.15), scale=(0.9, 0.2, 1.0))
    sphere(1.0, g, scale=(0.95, 0.9, 0.95), seg=40)
    curve_tube([(0, -0.8, -0.1), (0, -1.15, -0.5), (0, -1.1, -1.0), (0.2, -1.25, -1.45)], 0.3, g)
    sphere(0.3, g, (0.2, -1.25, -1.5), scale=(1, 1.1, 0.8))
    for s in (-1, 1): cone(0.1, 0.0, 0.5, M('#fffaf0', 0.3), loc=(s * 0.5, -0.95, -0.7), rot=(-110, 0, 0))
    eyes(0.42, -0.82, 0.3, 0.14); blush(0.62, -0.78, -0.1, 0.11)
    for a in range(-1, 2): cube((0.02, 0.02, 0.01), g, loc=(0, 0, 0)) if False else None
    return {'rot_z': -15}

@reg
def m_monkey():
    b = M('#8a5a2e', 0.5, 0, 0.4); f = M('#f0c898', 0.35, 0, 0.6)
    sphere(1.0, b, scale=(1.0, 0.9, 0.92), seg=40)
    for s in (-1, 1): sphere(0.42, b, (s * 1.02, 0.0, 0.1)); sphere(0.26, f, (s * 1.02, -0.2, 0.1), scale=(1, 0.5, 1))
    sphere(0.55, f, (-0.3, -0.62, 0.22), scale=(1, 0.5, 0.95)); sphere(0.55, f, (0.3, -0.62, 0.22), scale=(1, 0.5, 0.95))
    sphere(0.55, f, (0, -0.55, -0.28), scale=(1.1, 0.7, 0.85))
    for s in (-1, 1): sphere(0.04, M('#5a3a1a', 0.4), (s * 0.08, -1.0, -0.2), scale=(1, 0.5, 1.5))
    smile(0, -0.98, -0.48, 0.3, 0.09, 0.025, '#5a2a1a')
    eyes(0.3, -0.84, 0.28, 0.14)
    for x in (-0.15, 0, 0.15): sphere(0.14, b, (x, -0.3, 0.92), scale=(0.8, 0.8, 1.2), rot=(0, x * 100, 0))
    return {'rot_z': -15}

@reg
def m_fox():
    o = M('#ff7a1f', 0.3, 0, 0.7); w = M('#ffffff', 0.35, 0, 0.5); k = M('#2a2a33', 0.4)
    sphere(1.0, o, scale=(1.1, 0.88, 0.85), seg=40)
    for s in (-1, 1):
        cone(0.45, 0.0, 0.95, o, loc=(s * 0.7, 0, 0.98), rot=(0, s * 14, 0), seg=4)
        cone(0.25, 0.0, 0.5, k, loc=(s * 0.77, -0.05, 1.28), rot=(0, s * 14, 0), seg=4)
        sphere(0.45, w, (s * 0.62, -0.5, -0.3), scale=(1, 0.6, 0.6), rot=(0, 0, s * -20))
    sphere(0.42, w, (0, -0.7, -0.4), scale=(0.95, 0.8, 0.8))
    nose(0, -1.0, -0.2, 0.12); smile(0, -1.0, -0.55, 0.2, 0.07, 0.022)
    eyes(0.4, -0.78, 0.22, 0.15)
    return {'rot_z': -15}

@reg
def m_panda():
    w = M('#ffffff', 0.35, 0, 0.5); k = M('#25252d', 0.35, 0, 0.5)
    sphere(1.0, w, scale=(1.08, 0.92, 0.92), seg=40)
    for s in (-1, 1):
        sphere(0.38, k, (s * 0.8, 0.0, 0.78))
        sphere(0.3, k, (s * 0.4, -0.78, 0.2), scale=(0.9, 0.45, 1.3), rot=(0, 0, s * 25))
        eye(s * 0.4, -0.88, 0.24, 0.1)
    sphere(0.3, w, (0, -0.72, -0.3), scale=(1.2, 0.7, 0.8))
    nose(0, -1.0, -0.15, 0.12, '#25252d'); smile(0, -0.97, -0.42, 0.18, 0.07, 0.025, '#25252d')
    blush(0.7, -0.75, -0.2, 0.1)
    return {'rot_z': -15}

@reg
def m_horse():
    b = M('#b9733a', 0.3, 0, 0.7); mn = M('#4a2a14', 0.4, 0, 0.6); lt = M('#d89a62', 0.3, 0, 0.6)
    cyl(0.62, 1.7, b, loc=(-0.75, 0.1, -0.55), rot=(0, 28, 0))
    for i in range(6): sphere(0.3, mn, (-1.25 - i * 0.0 + (5 - i) * 0.0 - 0.15 * 0 + (-0.05 * i), 0.1, 0.35 - i * 0.28 + 0.0), scale=(0.7, 0.6, 0.8)) if False else None
    for i in range(6): sphere(0.3, mn, (-0.95 - i * 0.16, 0.1, 0.35 - i * 0.3), scale=(0.7, 0.6, 0.8))
    parts = []
    parts.append(sphere(0.8, b, (0, 0, 0), scale=(1.0, 0.8, 0.95), seg=32))
    parts.append(cyl(0.45, 1.0, lt, loc=(0.8, 0, -0.1), rot=(0, 90, 0)))
    parts.append(sphere(0.45, lt, (1.3, 0, -0.1)))
    parts.append(sphere(0.07, mn, (1.7, -0.22, -0.02), scale=(0.7, 0.8, 1.4)))
    parts.append(sphere(0.07, mn, (1.74, 0.1, -0.02), scale=(0.7, 0.8, 1.4)))
    for s in (0, 1): parts.append(cone(0.22, 0.0, 0.7, b, loc=(-0.25 - s * 0.1, -0.2 + s * 0.35, 0.95), rot=(0, 15, 0)))
    parts.append(sphere(0.3, mn, (0.2, 0.0, 0.8), scale=(1.1, 0.8, 1.0)))
    ang(parts, 0, 20, 0).location = (0.0, 0, 0.5)
    eye(0.7, -0.7, 0.83, 0.17); smile(1.1, -0.42, -0.27, 0.18, 0.04, 0.02, '#4a2a14')
    return {'rot_z': -12, 'tilt': 5}
