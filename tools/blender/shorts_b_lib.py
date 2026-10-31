"""Batch b: gedeelde hulpfuncties voor shorts s101-s200 (dieren, eten, natuur)."""
import os, sys, math, random
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import bpy
import shorts_common as sc
from shorts_common import mat, sphere, cube, cyl, cone, torus, ico, plane, lathe, extrude_poly, curve_tube, group
from mathutils import Vector

PI = math.pi
def M(c, r=.35, m=0, coat=.3, emit=0): return mat(c, r, m, emit, coat)
def glow(c, s=3): return mat(c, .4, 0, s, 0)
def amat(c, a, rough=.1, emit=0):
    m = mat(c, rough, 0, emit, .5, alpha=a)
    try: m.surface_render_method = 'BLENDED'
    except Exception:
        try: m.blend_method = 'BLEND'
        except Exception: pass
    return m
def ss(x): x = max(0., min(1., x)); return x * x * (3 - 2 * x)
def lerp(a, b, u): return a + (b - a) * u
def pw(t, pts):
    """Zachte interpolatie door [(tijd, waarde), ...]."""
    if t <= pts[0][0]: return pts[0][1]
    for (t0, v0), (t1, v1) in zip(pts, pts[1:]):
        if t < t1: return lerp(v0, v1, ss((t - t0) / (t1 - t0)))
    return pts[-1][1]

def newshort(seconds, bg, tilt=10, ortho=10.7):
    bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR'
    S = sc.Short(seconds, bg); t = math.radians(tilt)
    S.cam.data.ortho_scale = ortho
    S.cam.location = (0, -14 * math.cos(t), 14 * math.sin(t)); S.cam.rotation_euler = (math.radians(90) - t, 0, 0)
    S.tilt = tilt; S.sc.eevee.taa_render_samples = 12
    return S

def bbox(o):
    bpy.context.view_layer.update()
    mn = Vector((1e9,) * 3); mx = Vector((-1e9,) * 3)
    for c in [o] + list(o.children_recursive):
        if c.type in ('MESH', 'CURVE', 'FONT'):
            for v in c.bound_box:
                w = c.matrix_world @ Vector(v)
                for i in range(3): mn[i] = min(mn[i], w[i]); mx[i] = max(mx[i], w[i])
    return mn, mx

def rig(loc=(0, 0, 0)):
    r = bpy.data.objects.new('rig', None); bpy.context.collection.objects.link(r); r.location = loc; return r

def put(S, name, size=2.0, rz=-15, loc=(0, 0, 0)):
    """Icoonmodel in een rig; voeten (onderkant) op rig-oorsprong, gecentreerd, max afmeting = size."""
    e = S.spawn(name, 1.0, rot_z=rz); r = rig()
    e.parent = r
    mn, mx = bbox(e); s = size / max(mx.x - mn.x, mx.z - mn.z, .001)
    e.scale = (s,) * 3; mn, mx = bbox(e)
    e.location = (-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, -mn.z)
    r.location = loc; r['h'] = mx.z - mn.z; r['w'] = mx.x - mn.x
    return r

def drive(o, fn, S, step=1, f0=1, f1=None):
    f1 = f1 or S.frames; f = f0
    while True:
        t = (f - 1) / S.fps; d = fn(t)
        if 'loc' in d: o.location = d['loc']; o.keyframe_insert('location', frame=f)
        if 'rot' in d: o.rotation_euler = tuple(math.radians(v) for v in d['rot']); o.keyframe_insert('rotation_euler', frame=f)
        if 'scale' in d:
            s = d['scale']; o.scale = (s,) * 3 if not hasattr(s, '__len__') else tuple(s); o.keyframe_insert('scale', frame=f)
        if f >= f1: break
        f = min(f + step, f1)

def label(S, s, z=4.3, size=.95, start=1, end=None, color='#ffffff', x=0):
    lines = s.split('\n'); n = max(len(l) for l in lines)
    size = min(size, 5.5 / (.6 * n))
    return S.text(s, (x, 0, z), size=size, color=color, start=start, end=end)

def ground(S, color='#4ade80', ztop=-3.4, w=7.2, d=3.4, h=2.4, y=0, bevel=.3, r=.5):
    return cube((w, d, h), M(color, r, 0, .15), loc=(0, y, ztop - h / 2), bevel=bevel)

def blob(S, loc, r=1.0):
    return cyl(r, .02, amat('#000000', .28, 1), loc=loc, seg=24)

def bokeh(S, n=12, colors=('#ffffff',), seed=1, zr=(-4.5, 3.2), a=.28, T=None):
    rn = random.Random(seed); T = T or S.seconds
    for i in range(n):
        c = rn.choice(colors); r = rn.uniform(.12, .38)
        o = sphere(r, amat(c, a, .5, emit=1.2), loc=(0, 2.5, 0), seg=10)
        x0 = rn.uniform(-3, 3); z0 = rn.uniform(*zr); ph = rn.uniform(0, 2 * PI); ax = rn.uniform(.1, .5); az = rn.uniform(.2, .8)
        drive(o, lambda t, x0=x0, z0=z0, ph=ph, ax=ax, az=az, r=r: {'loc': (x0 + ax * math.sin(2 * PI * t / T + ph), 2.5, z0 + az * math.sin(2 * PI * t / T * 2 + ph)),
              'scale': 1 + .25 * math.sin(2 * PI * t / T * 3 + ph)}, S, step=3)

def rising(S, n, xr, z0, H, T, mkobj, seed=5, wob=.25, t0=0):
    """n deeltjes die steeds opstijgen (loop). mkobj(i)->object."""
    rn = random.Random(seed)
    for i in range(n):
        o = mkobj(i); x0 = rn.uniform(*xr); ph = rn.random(); y0 = rn.uniform(-.5, .5); w = rn.uniform(.5, 1) * wob
        drive(o, lambda t, x0=x0, ph=ph, y0=y0, w=w: (lambda u: {'loc': (x0 + w * math.sin(u * 2 * PI * 2), y0, z0 + u * H), 'scale': max(.001, math.sin(PI * u) ** .5)})(((t - t0) / T + ph) % 1), S, step=2)

def drop_seq(S, o, t_land, zland, zfrom=8, dur=.55, bounce=.25, x=None, y=None):
    """Object valt van zfrom naar zland rond t_land, stuitert 1x, met squash. o = rig/object. Retourneert drive-fn voor loc/scale."""
    def f(t):
        if t < t_land - dur: return {'scale': .001, 'loc': (o.location[0], o.location[1], zfrom)}
        u = (t - (t_land - dur)) / dur
        if u < 1:
            z = lerp(zfrom, zland, u * u); return {'scale': 1, 'loc': (o.location[0], o.location[1], z)}
        v = t - t_land
        if v < .45:
            hh = bounce * 4 * (v / .45) * (1 - v / .45); sq = max(0, 1 - v * 10)
            return {'scale': (1 + .15 * sq, 1 + .15 * sq, 1 - .25 * sq), 'loc': (o.location[0], o.location[1], zland + hh)}
        return {'scale': 1, 'loc': (o.location[0], o.location[1], zland)}
    return f

def squash(c, k=.25): return (1 + k * .6 * c, 1 + k * .6 * c, 1 - k * c)

# =============== DIEREN ===============
GZ = -3.4

def t_bounce(S, P):
    ground(S, P.get('ground', '#4ade80')); r = put(S, P['a'], P.get('size', 3.4), rz=P.get('rz', -15))
    sh = blob(S, (0, 0, GZ + .02), 1.5); T = P.get('T', 1.0); H = P.get('H', 2.6)
    def f(t):
        ph = (t % T) / T; h = H * 4 * ph * (1 - ph); c = max(max(0, 1 - ph * 7), max(0, 1 - (1 - ph) * 7))
        return {'loc': (P.get('sway', 0) * math.sin(2 * PI * t / S.seconds), 0, GZ + h), 'scale': squash(c), 'rot': (0, 0, 14 * math.sin(2 * PI * t / S.seconds * 2))}
    drive(r, f, S)
    drive(sh, lambda t: (lambda ph: {'loc': (P.get('sway', 0) * math.sin(2 * PI * t / S.seconds), 0, GZ + .02), 'scale': 1 - .45 * 4 * ph * (1 - ph)})((t % T) / T), S)
    label(S, P['t1'], start=6, end=int(S.frames * .5));
    if P.get('t2'): label(S, P['t2'], start=int(S.frames * .55), color=P.get('tc', '#fde047'))

def t_dance(S, P):
    A = P['as']; n = len(A); ground(S, P.get('ground', '#a78bfa'))
    pos = []
    if n <= 3: pos = [(x, 0, GZ) for x in ([0] if n == 1 else [-1.9, 1.9] if n == 2 else [-2, 0, 2])]
    else:
        ground(S, P.get('step', '#8b5cf6'), ztop=-1.0, w=7.2, d=2, h=2.4, y=1.8)
        k = n - 2; pos = [(-1.9, -.6, GZ), (1.9, -.6, GZ)] + [(-2.0 + 4.0 * i / max(1, k - 1) if k > 1 else 0, 1.8, -1.0) for i in range(k)]
    for i, (a, p) in enumerate(zip(A, pos)):
        r = put(S, a, P.get('size', 1.9) if n > 1 else 3.6, rz=-10 + 10 * (i % 3) * (1 if i % 2 else -1), loc=p)
        beat = P.get('beat', .75); lag = P.get('lag', .9)
        drive(r, lambda t, i=i, p=p: (lambda ph: {'loc': (p[0], p[1], p[2] + .5 * abs(math.sin(ph))), 'rot': (0, 16 * math.sin(ph), 0),
              'scale': squash(max(0, 1 - 6 * abs(math.sin(ph)) ) * .6)})(2 * PI * t / (2 * beat) + i * lag), S)
    label(S, P['t1'], start=4)
    bokeh(S, 10, P.get('bok', ('#ffffff', '#fde047')), seed=P.get('seed', 3))

def t_race(S, P):
    S.cam.rotation_euler = (math.radians(90 - 32), 0, 0); t = math.radians(32)
    S.cam.location = (0, -14 * math.cos(t), 14 * math.sin(t) + .4)
    A = P['as']; order = P['order']  # order[i] = rang van dier i (0 = winnaar)
    cube((7.6, 8.4, .6), M(P.get('track', '#fb923c'), .7, 0, 0), loc=(0, 0, -.6), bevel=.2)
    ys = [-2.4 + 2.4 * i for i in range(len(A))]
    for i, y in enumerate(ys): cube((7, 1.9, .05), M(['#fdba74', '#fed7aa'][i % 2], .8, 0, 0), loc=(0, y, -.28), bevel=0)
    for k in range(8):
        for j in range(2): cube((.25, .55, .05), M('#ffffff' if (k + j) % 2 == 0 else '#111827', .6, 0, 0), loc=(2.9, -3.3 + k * .95 * 0.0 + (k % 8) * .0 + 0, -.25)) if False else None
    for k in range(9): cube((.3, .9, .06), M('#ffffff' if k % 2 == 0 else '#111827', .6, 0, 0), loc=(2.75, -3.6 + k * .9, -.25), bevel=0)
    top = None
    for i, a in enumerate(A):
        r = put(S, a, P.get('size', 1.7), rz=P.get('rz', 40), loc=(-2.5, ys[i], -.3)); T = 6.2 + order[i] * .45
        def f(t, i=i, T=T, r=r):
            u = ss(min(1, max(0, (t - 1.2) / (T - 1.2)))) * .55 + min(1, max(0, (t - 1.2) / (T - 1.2))) * .45
            x = -2.5 + 5.0 * u; run = 0 < u < 1
            hop = .3 * abs(math.sin(2 * PI * (t * 2.4 + i * .3))) if run else (.7 * abs(math.sin(2 * PI * t * 1.6 + i)) if u >= 1 else 0)
            return {'loc': (x, ys[i], -.3 + hop), 'rot': (0, 0, 0), 'scale': squash(.0)}
        drive(r, f, S)
        if order[i] == 0:
            top = r
            c = S.spawn('crown', 1.0); c.scale = (.8,) * 3; c.parent = r; c.location = (0, 0, r['h'] * 1.15 + .6)
            c.scale = (.0001,) * 3; c.keyframe_insert('scale', frame=1); c.keyframe_insert('scale', frame=int(T * 24)); c.scale = (.9,) * 3; c.keyframe_insert('scale', frame=int(T * 24) + 8)
    label(S, P.get('t1', 'Wie wint?'), start=3, end=int(5.5 * 24)); label(S, P.get('t2', 'Winnaar!'), start=int(7.2 * 24), color='#fde047')
    bokeh(S, 8, ('#ffffff', '#fde047'), seed=4)

def bush(S, x=0, y=-1.2, z=GZ, col='#16a34a', w=1.0, berry='#ef4444'):
    g = []; rn = random.Random(7)
    for dx, dz, rr in ((-1.0, .5, .95), (0, .85, 1.15), (1.0, .5, .95), (-.4, 1.3, .8), (.5, 1.2, .75)):
        g.append(sphere(rr * w, M(col, .6, 0, .1), loc=(x + dx * w, y, z + dz * w), seg=20))
    for k in range(7): g.append(sphere(.12, M(berry, .3), loc=(x + rn.uniform(-1.6, 1.6) * w, y - .85 * w, z + rn.uniform(.5, 1.6) * w), seg=10))
    return g

def t_hide(S, P):
    ground(S, P.get('ground', '#86efac')); bush(S, col=P.get('bush', '#15803d'))
    size = P.get('size', 3.2); r = put(S, P['a'], size, rz=-8, loc=(0, .4, GZ - size - .2))
    K = P.get('seq', [(0, 0, -1), (1.8, 0, -1), (2.5, 0, -.35), (3.4, 0, -.35), (4.0, 0, -1), (4.6, 0, -1), (4.9, -2.1, -1), (5.6, -2.1, 0), (7.4, -2.1, 0), (8.0, -2.1, -1)])
    def f(t):
        xs = [(a, b) for a, b, c in K]; zs = [(a, c) for a, b, c in K]
        k = pw(t, zs); x = pw(t, xs)
        return {'loc': (x, .4, GZ + k * size - (0 if k > -.99 else .2)), 'rot': (0, 4 * math.sin(t * 5) * (1 if k > -.9 else 0), 0)}
    drive(r, f, S)
    label(S, P.get('t1', 'Verstoppertje'), start=3, end=int(2.5 * 24)); label(S, P.get('t2', 'Boe!'), start=int(5.5 * 24), end=int(8.2 * 24), color='#fde047')
    bokeh(S, 8, ('#ffffff', '#bbf7d0'), seed=2)

def t_ballchase(S, P):
    ground(S, P.get('ground', '#4ade80')); size = P.get('size', 2.6); r = put(S, P['a'], size, rz=60, loc=(0, 0, GZ))
    bc = P.get('ball', '#f43f5e'); ball = rig(); b1 = sphere(.62, M(bc, .25, 0, .7), seg=24); b2 = torus(.62, .07, M('#ffffff', .3), rot=(90, 0, 0)); b1.parent = ball; b2.parent = ball
    Tp = P.get('T', 5.0); sh = blob(S, (0, 0, GZ + .02), .6)
    def bx(t): return 2.1 * math.sin(2 * PI * t / Tp)
    def bz(t): h = abs(math.sin(2 * PI * t * 0.8 / 1.0 * 1)); return GZ + .55 + 2.4 * h * h ** .15 * (1 if True else 0)
    def bf(t): return {'loc': (bx(t), -1.0, GZ + .62 + 2.6 * abs(math.sin(2 * PI * t / (Tp / 3.0))) ** 1.0 ), 'rot': (t * 200, 0, 0)}
    # bal-object is de laatste bol; zoek hem
    ball.name = 'ball'; drive(ball, bf, S)
    drive(sh, lambda t: {'loc': (bx(t), 0, GZ + .02), 'scale': max(.3, 1 - .1 * abs(math.sin(2 * PI * t / (Tp / 3.0))) * 3)}, S)
    def rf(t):
        tt = t - .5; x = 1.6 * math.sin(2 * PI * tt / Tp); hop = .5 * abs(math.sin(2 * PI * t * 2.2))
        face = 70 * math.tanh(3 * math.cos(2 * PI * tt / Tp))
        return {'loc': (x, 0, GZ + hop), 'rot': (0, 0, face), 'scale': squash(max(0, 1 - 8 * abs(math.sin(2 * PI * t * 2.2))) * .5)}
    drive(r, rf, S)
    label(S, P.get('t1', 'Achter de bal!'), start=3); bokeh(S, 8, ('#ffffff', '#fde68a'), seed=5)

def seaweed(S, x, z0, h, col, ph, y=0.4):
    pts = [(x + .05 * math.sin(i), y, z0 + h * i / 6) for i in range(7)]
    o = curve_tube(pts, .09, M(col, .5)); return o

def t_swim(S, P):
    cube((7.4, 6, 1.2), M('#fde68a', .9, 0, 0), loc=(0, 0, -4.5), bevel=.2)
    for A in range(P.get('weeds', 5)):
        x = -3 + A * 1.5; o = seaweed(S, x, -3.9, 1.7 + .5 * (A % 2), P.get('weed', '#22c55e'), A)
        o.rotation_euler = (0, 0, 0); drive(o, lambda t, A=A: {'rot': (0, 4 * math.sin(2 * PI * t / 3 + A), 0)}, S, step=3)
    for j, a in enumerate(P['as']):
        z0 = P.get('zs', [0.3, -1.7, 2.3])[j]; r = put(S, a, P.get('size', 2.0), rz=0, loc=(0, 0, z0)); sp = P.get('sp', [1, -1, 1])[j]; Tp = P.get('T', 6.0) * (1 + .15 * j)
        def f(t, z0=z0, sp=sp, Tp=Tp, j=j):
            w = 2 * PI * t / Tp + j * 2
            return {'loc': (2.2 * math.sin(w) * sp, 0, z0 + .5 * math.sin(w * 2.3)), 'rot': (0, 6 * math.sin(w * 6), 80 * math.tanh(4 * math.cos(w)) * sp + 0)}
        drive(r, f, S)
    cube((7.4, 1, 8.5), amat(P.get('water', '#7dd3fc'), .2, .05), loc=(0, -1.3, -.6), bevel=.1)
    rising(S, 14, (-3, 3), -4.2, 7.5, 5.0, lambda i: sphere(.14 + .05 * (i % 3), amat('#e0f2fe', .55, .05, emit=.4), loc=(0, -.9, 0), seg=10), seed=P.get('seed', 3))
    label(S, P.get('t1', 'Plons!'), start=4); bokeh(S, 6, ('#bae6fd',), seed=9)

def t_tower(S, P):
    A = P['as']; ground(S, P.get('ground', '#fbbf24')); sz = P.get('size', 1.55); y = GZ
    for i, a in enumerate(A):
        r = put(S, a, sz, rz=-8 + 10 * (i % 2), loc=(0, 0, 0)); h = r['h']; z = y; y += h * .86
        tl = 1.2 + i * 1.1
        fn = drop_seq(S, r, tl, z, zfrom=9, dur=.5, bounce=.18)
        def f(t, fn=fn, i=i, z=z):
            d = fn(t); lx = .12 * (i + 1) * math.sin(2 * PI * t / 3 + i) * ss((t - 7.2) / 1.0)
            d['loc'] = (lx, 0, d['loc'][2]); d['rot'] = (0, 5 * math.sin(2 * PI * t / 2.2 + i) * ss((t - 7.2)), 0); return d
        drive(r, f, S)
    n = len(A)
    for k in range(n): label(S, str(k + 1), z=0, size=.001, start=1) if False else None
    label(S, P.get('t1', 'Toren!'), start=int(1.1 * 24 * (n)) // 2 + 2, z=4.5)
    bokeh(S, 8, ('#ffffff',), seed=6)

def t_look(S, P):
    ground(S, P.get('ground', '#4ade80')); size = P.get('size', 4.0); r = put(S, P['a'], size, rz=0, loc=(0, 0, GZ))
    tr = put(S, P.get('track', 'butterfly'), 1.0, rz=0, loc=(0, -1, 2)); Tp = 6.0
    def tf(t): return (2.3 * math.sin(2 * PI * t / Tp), -1, 1.5 + 1.6 * math.sin(2 * PI * t * 2 / Tp + .6) + (3.2 if False else 0))
    drive(tr, lambda t: {'loc': tf(t), 'rot': (0, 12 * math.sin(t * 7), 0)}, S)
    drive(r, lambda t: {'rot': (0, 0, -35 * math.sin(2 * PI * t / Tp)), 'loc': (0, 0, GZ + .15 * abs(math.sin(2 * PI * t / Tp * 2))), 'scale': 1 + .02 * math.sin(t * 5)}, S)
    label(S, P.get('t1', 'Ik zie je!'), start=3); bokeh(S, 8, ('#ffffff',), seed=8)

def t_pads(S, P):
    cube((7.4, 5, 3.2), amat(P.get('water', '#38bdf8'), .9, .05), loc=(0, 0, -3.0), bevel=.2)
    xs = [-2.25, -.75, .75, 2.25];
    for x in xs:
        cyl(.62, .12, M('#22c55e', .5, 0, .2), loc=(x, 0, -1.4), seg=24)
        if x in (-.75, 2.25): sphere(.2, M('#f472b6'), loc=(x + .2, -.1, -1.25), seg=12)
    r = put(S, P['a'], P.get('size', 2.0), rz=0, loc=(xs[0], 0, -1.35)); hopT = 1.1
    def f(t):
        k = t / hopT; i = int(k); ph = k - i; seq = [0, 1, 2, 3, 2, 1]; a = seq[i % 6]; b = seq[(i + 1) % 6]
        x = lerp(xs[a], xs[b], ss(ph * 1.15 - .08)) ; h = 1.4 * 4 * ph * (1 - ph); c = max(max(0, 1 - ph * 6), max(0, 1 - (1 - ph) * 6))
        return {'loc': (x, 0, -1.35 + h), 'scale': squash(c, .3), 'rot': (0, 0, 55 * (1 if b > a else -1))}
    drive(r, f, S)
    cube((7.4, 1, 3.6), amat(P.get('water', '#38bdf8'), .3, .05), loc=(0, -1.3, -2.7), bevel=.1)
    label(S, P.get('t1', 'Hop hop hop!'), start=4)
    rising(S, 5, (-3, 3), -1.3, 4, 4, lambda i: sphere(.12, amat('#e0f2fe', .6), loc=(0, -.9, 0), seg=8), seed=3)
    bokeh(S, 8, ('#ffffff', '#bae6fd'), seed=3)

def t_parade(S, P):
    ground(S, P.get('ground', '#34d399'), ztop=GZ, d=5)
    A = P['as']; n = len(A)
    for i, a in enumerate(A):
        row = i % 2; r = put(S, a, P.get('size', 1.6), rz=88 * P.get('dir', 1), loc=(0, -.6 if row == 0 else 1.2, GZ + (0 if row == 0 else 0)))
        T = P.get('T', 10.0); off = i / n
        def f(t, i=i, row=row, off=off):
            u = ((t / T) + off) % 1; x = lerp(-5, 5, u) * P.get('dir', 1)
            return {'loc': (x, -.6 if row == 0 else 1.3, GZ + .35 * abs(math.sin(2 * PI * (t * 1.9 + i * .37)))), 'rot': (0, 7 * math.sin(2 * PI * (t * 1.9 + i * .37)), 0)}
        drive(r, f, S)
    label(S, P.get('t1', 'Parade!'), start=3); bokeh(S, 10, ('#ffffff', '#fde047', '#fb7185'), seed=11)

def t_whack(S, P):
    gz = GZ; ground(S, P.get('ground', '#a16207'), ztop=gz, d=3.0, h=1.6)
    A = P['as']; rn = random.Random(P.get('seed', 4)); size = P.get('size', 2.2)
    xs = [-2.0, 0, 2.0]
    cube((7.4, 1.2, 3.4), M(P.get('front', '#65a30d'), .8, 0, 0), loc=(0, -1.0, gz + .35 - 1.7), bevel=.3)
    for i, x in enumerate(xs):
        cyl(.95, .06, M('#1c1917', .9, 0, 0), loc=(x, -.35, gz + .6 + .0), seg=24, rot=(0, 0, 0)) if False else None
    for i, x in enumerate(xs):
        a = A[i % len(A)]; r = put(S, a, size, rz=-6 * (i - 1), loc=(x, .1, gz - size - 1))
        ts = [(rn.uniform(.5, 2.5) + k * 3.0, rn.uniform(.9, 1.5)) for k in range(3)]
        ts = [((i * .9) + .8 + k * 3.0, 1.3) for k in range(3)]
        def f(t, ts=ts):
            h = 0
            for t0, dd in ts:
                u = (t - t0) / dd
                if 0 <= u <= 1: h = max(h, min(1, ss(u * 5), ss((1 - u) * 5)))
            return {'loc': (r.location[0], .1, gz - size * (1 - h) + .0 + (.2 if h > 0 else -.5)), 'rot': (0, 0, 0)}
        drive(r, f, S)
    label(S, P.get('t1', 'Kiekeboe!'), start=3); bokeh(S, 8, ('#ffffff', '#fde68a'), seed=2)

def t_sleep(S, P):
    ground(S, P.get('ground', '#6366f1')); size = P.get('size', 3.4); r = put(S, P['a'], size, rz=-12, loc=(0, 0, GZ))
    drive(r, lambda t: {'scale': (1 + .03 * math.sin(2 * PI * t / 3), 1 + .03 * math.sin(2 * PI * t / 3), 1 + .05 * math.sin(2 * PI * t / 3 + .3)), 'rot': (0, 2 * math.sin(2 * PI * t / 6), 0)}, S)
    mo = put(S, 'moon', 1.8, rz=0, loc=(-2.0, 2, 1.6)); drive(mo, lambda t: {'rot': (0, 5 * math.sin(t * 2), 0), 'loc': (-2.0, 2, 1.8 + .15 * math.sin(2 * PI * t / 4))}, S, step=2)
    for k in range(6):
        st = put(S, 'star', .45 + .15 * (k % 2), rz=0, loc=(1.0 + (k % 3) * .8 - 1.8, 2, 1.0 + (k // 3) * 1.2 + (k % 2) * .6))
        drive(st, lambda t, k=k: {'scale': 1 + .35 * math.sin(2 * PI * t / 2 + k), 'rot': (0, 40 * t + k * 40, 0), 'loc': st.location}, S, step=3)
    def mk(i):
        o = S.text('Z', (0, -.3, 0), size=.9, color='#e0e7ff', start=1, extrude=.08); return o
    # Z-tjes die opstijgen
    for i in range(5):
        o = bpy.data.objects.new('z', bpy.data.curves.new('z', 'FONT')); o.data.body = 'Z'; o.data.size = .7 + .2 * (i % 3); o.data.extrude = .08; o.data.align_x = 'CENTER'
        bpy.context.collection.objects.link(o); o.rotation_euler = (PI / 2, 0, 0); o.data.materials.append(M('#e0e7ff', .4, 0, .3))
        ph = i / 5.0
        drive(o, lambda t, ph=ph, o=o: (lambda u: {'loc': (.9 + .5 * math.sin(u * 5), -.4, GZ + size * .75 + u * 3.2), 'scale': max(.001, math.sin(PI * u) ** .6)})(((t / 4.0) + ph) % 1), S, step=2)
    label(S, P.get('t1', 'Slaap lekker'), start=3);

def t_love(S, P):
    ground(S, P.get('ground', '#fda4af'), ztop=GZ); a, b = P['a'], P['b']; sz = P.get('size', 2.8)
    ra = put(S, a, sz, rz=50, loc=(-1.9, 0, GZ)); rb = put(S, b, sz, rz=-50, loc=(1.9, 0, GZ))
    for k, (r, s) in enumerate(((ra, -1), (rb, 1))):
        drive(r, lambda t, s=s, k=k: (lambda u: {'loc': (s * (1.9 - .7 * ss(math.sin(2 * PI * t / 4) * 1.5)), 0, GZ + .35 * abs(math.sin(2 * PI * t / 2 + k)) ), 'scale': 1}) (0), S)
    def mk(i):
        o = put(S, 'heart', .6 + .2 * (i % 3), rz=0); return o
    rising(S, 9, (-.6, .6), -.4, 4.2, 4.5, mk, seed=2, wob=.5)
    label(S, P.get('t1', 'Beste vrienden'), start=3); bokeh(S, 10, ('#ffffff', '#fecdd3'), seed=7)

def t_carousel(S, P):
    S.cam.rotation_euler = (math.radians(90 - 18), 0, 0); t = math.radians(18); S.cam.location = (0, -14 * math.cos(t), 14 * math.sin(t))
    cyl(2.9, .5, M(P.get('base', '#f9a8d4'), .5), loc=(0, 0, -3.6), seg=48); cyl(.28, 6, M('#fde047', .3, .6), loc=(0, 0, -.5), seg=16)
    cone(3.1, .0, 1.6, M(P.get('roof', '#f472b6'), .5), loc=(0, 0, 3.0), seg=48); cyl(3.0, .25, M('#fde047', .3, .5), loc=(0, 0, 2.15), seg=48)
    cen = rig((0, 0, 0)); A = P['as']; n = len(A)
    for i, a in enumerate(A):
        ang = 2 * PI * i / n; r = put(S, a, 2.0, rz=0, loc=(0, 0, 0)); r.parent = cen
        cyl(.05, 4.5, M('#fef3c7', .3, .6), loc=(2.0 * math.cos(ang), 2.0 * math.sin(ang), 0), seg=8).parent = cen
        drive(r, lambda t, ang=ang, i=i: {'loc': (2.0 * math.cos(ang), 2.0 * math.sin(ang), -1.7 + .7 * (.5 + .5 * math.sin(2 * PI * t / 2.25 + i * 1.5))), 'rot': (0, 0, math.degrees(ang) - 90 + 180)}, S, step=2)
    cen.rotation_euler = (0, 0, 0); cen.keyframe_insert('rotation_euler', frame=1); cen.rotation_euler = (0, 0, 2 * PI); cen.keyframe_insert('rotation_euler', frame=S.frames)
    drive(cen, lambda t: {'rot': (0, 0, -360 * t / S.seconds)}, S, step=3)
    label(S, P.get('t1', 'Rondjes draaien'), start=3, z=4.5); bokeh(S, 10, ('#ffffff', '#fde047'), seed=5)

def t_grow(S, P):
    ground(S, P.get('ground', '#4ade80')); a = P['a']; n = 3; labs = P.get('labs', ['Klein', 'Groter', 'Reus!']); sizes = [1.3, 2.3, 3.6]; xs = [-2.2, -.3, 1.7]
    xs = [-2.1, -.6, 1.4]
    for i in range(3):
        r = put(S, a, sizes[i], rz=-10, loc=(xs[i], 0, GZ)); tl = 1.2 + i * 1.7
        def f(t, i=i, tl=tl):
            u = t - tl
            if u < 0: return {'scale': .001, 'loc': (xs[i], 0, GZ)}
            s = 1 + .25 * math.sin(min(u, .6) * PI / .6) * (1 if u < .6 else 0)
            hop = .5 * abs(math.sin(2 * PI * (t - 6.5) / 1.2)) * (1 if t > 6.5 else 0)
            return {'scale': (s, s, s), 'loc': (xs[i] + (.0), 0, GZ + hop)}
        drive(r, f, S)
        label(S, labs[i], z=GZ - .0 + 8.4 if False else 4.3, start=int((tl + .1) * 24), end=int((tl + 1.6) * 24), color='#fde047')
    label(S, P.get('t1', 'Familie!'), start=int(6.6 * 24)); bokeh(S, 8, ('#ffffff',), seed=1)

def t_rain(S, P):
    ground(S, P.get('ground', '#60a5fa')); A = P['as']; rn = random.Random(P.get('seed', 3)); n = P.get('n', 8)
    xs = [-2.3, -1.2, 0, 1.2, 2.3, -.6, .6, 1.8][:n]; row = [0, 0, 0, 0, 0, 1, 1, 1]
    for i in range(n):
        a = A[i % len(A)]; sz = 1.4 + .2 * (i % 3); r = put(S, a, sz, rz=rn.uniform(-30, 30), loc=(xs[i], .2 * row[i], 0)); zl = GZ + row[i] * 1.5 + (0 if row[i] == 0 else 0)
        # rij 2 staat op rij 1 (alleen visueel hoger)
        if row[i]: zl = GZ + 1.3
        tl = 1.0 + i * .75; fn = drop_seq(S, r, tl, zl, zfrom=8.5, dur=.6, bounce=.6)
        def f(t, fn=fn, i=i):
            d = fn(t); d['rot'] = (0, 0, 0); return d
        drive(r, f, S)
    label(S, P.get('t1', 'Het regent dieren'), start=3); bokeh(S, 8, ('#ffffff',), seed=4)

T_DIEREN = {k[2:]: v for k, v in list(globals().items()) if k.startswith('t_')}

# =============== RUNNER ===============
def render_spec(spec, preview=None, only=None):
    vid, title, cat, tags, tpl, P, bg, secs = spec
    S = newshort(secs, bg, P.get('tilt', 10)); TEMPLATES[tpl](S, P)
    if preview:
        sc_ = S.sc; sc_.render.image_settings.file_format = 'JPEG'; sc_.render.image_settings.quality = 80
        sc_.frame_set(preview); pd = os.path.join(sc.ROOT, 'tools', 'shorts', 'preview'); os.makedirs(pd, exist_ok=True)
        sc_.render.filepath = os.path.join(pd, vid + '.jpg'); bpy.ops.render.render(write_still=True)
    else:
        sc_ = S.sc; mp4 = os.path.join(sc.OUT, vid + '.mp4')
        sc_.render.image_settings.file_format = 'FFMPEG'; sc_.render.ffmpeg.format = 'MPEG4'; sc_.render.ffmpeg.codec = 'H264'
        sc_.render.ffmpeg.constant_rate_factor = P.get('crf', 'LOW'); sc_.render.ffmpeg.ffmpeg_preset = 'GOOD'; sc_.render.ffmpeg.audio_codec = 'NONE'
        sc_.render.filepath = mp4; sc_.render.use_file_extension = False
        bpy.ops.render.render(animation=True)
        sc_.render.image_settings.file_format = 'JPEG'; sc_.render.image_settings.quality = 78
        sc_.frame_set(S.frames // 2); sc_.render.filepath = os.path.join(sc.OUT, vid + '.jpg'); bpy.ops.render.render(write_still=True)

TEMPLATES = {}
TEMPLATES.update(T_DIEREN)
