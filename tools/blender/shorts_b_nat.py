"""Batch b: sjablonen voor 'natuur'."""
from shorts_b_lib import *
import shorts_b_lib as L
from shorts_b_food import lin, keycol, child

def tiltcam(S, deg):
    t = math.radians(deg); S.cam.rotation_euler = (math.radians(90 - deg), 0, 0); S.cam.location = (0, -14 * math.cos(t), 14 * math.sin(t))

def island(S, grass, soil='#7c4a21', r=2.8, z=0):
    isl = rig((0, 0, z)); cyl(r, .5, M(grass, .6, 0, .1), loc=(0, 0, 0), seg=48, bevel=.06).parent = isl
    cone(r * .98, r * .25, 2.0, M(soil, .8, 0, 0), loc=(0, 0, -1.25), rot=(0, 0, 0), seg=40).parent = isl
    return isl

def elastic(u):
    if u <= 0: return .001
    if u >= 1.6: return 1.0
    return max(.001, 1 - math.exp(-6 * u) * math.cos(11 * u))

def falling(S, n, xr, ztop, zbot, T, mkobj, seed=4, sway=.3, win=None):
    rn = random.Random(seed)
    for i in range(n):
        o = mkobj(i); x0 = rn.uniform(*xr); ph = rn.random(); y0 = rn.uniform(-.8, .6); w = rn.uniform(.4, 1) * sway; sp = rn.uniform(-200, 200)
        def f(t, x0=x0, ph=ph, y0=y0, w=w, sp=sp):
            u = (t / T + ph) % 1; on = 1.0
            if win: on = ss((t - win[0]) / .5) * (1 - ss((t - win[1]) / .5))
            return {'loc': (x0 + w * math.sin(u * 2 * PI * 2 + ph * 6), y0, lerp(ztop, zbot, u)), 'scale': max(.001, min(1, ss(u * 8)) * on), 'rot': (sp * u, 0, sp * u)}
        drive(o, f, S, step=2)

# ---------------- seizoenen ----------------
def t_seasons(S, P):
    tiltcam(S, 14); isl = island(S, '#4ade80', r=3.0, z=-3.2); gm = isl.children[0].data.materials[0]
    tr = rig(); tr.parent = isl; tr.location = (0, 0, .25)
    cyl(.32, 2.4, M('#7c4a21', .8), loc=(0, 0, 1.2), seg=16).parent = tr
    for k in range(3): curve_tube([(0, 0, 1.8 + k * .15), (.5 * (k - 1), 0, 2.4), (.9 * (k - 1), 0, 2.8)], .07, M('#7c4a21', .8)).parent = tr
    cm = M('#86efac', .6, 0, .2); pos = [(0, 0, 3.7, 1.35), (-.95, .1, 3.2, 1.0), (.95, .1, 3.2, 1.0), (-.5, -.4, 4.3, .9), (.55, -.35, 4.2, .85), (0, -.5, 3.1, .85)]
    for x, y, z, r in pos: sphere(r, cm, loc=(x, y, z), seg=20).parent = tr
    seas = P.get('seas', [('Lente', '#86efac', '#4ade80'), ('Zomer', '#16a34a', '#22c55e'), ('Herfst', '#f97316', '#ca8a04'), ('Winter', '#e2e8f0', '#f1f5f9')])
    q = S.seconds / 4
    for i, (nm, cc, gc) in enumerate(seas):
        keycol(cm, int(i * q * 24) + 1, cc); keycol(gm, int(i * q * 24) + 1, gc)
        keycol(cm, int((i + 1) * q * 24 - 8), cc); keycol(gm, int((i + 1) * q * 24 - 8), gc)
        label(S, nm, z=4.8, start=int(i * q * 24) + 4, end=int((i + 1) * q * 24 - 6), color='#ffffff')
    keycol(cm, S.frames, seas[0][1]); keycol(gm, S.frames, seas[0][2])
    rn = random.Random(2)
    for k in range(14):
        a = rn.uniform(0, 6.28); b = rn.uniform(.1, 1.0); o = sphere(.17, M('#f9a8d4', .4, 0, .3), loc=(1.5 * math.cos(a) * b, -1.2 * b - .2 if False else -.6 - 1.0 * b, 3.4 + 1.5 * math.sin(a) * b), seg=10); o.parent = tr
        drive(o, lambda t, o=o: {'scale': ss((t - .2) / .5) * (1 - ss((t - q + .3) / .5)) + .001, 'loc': tuple(o.location)}, S, step=3)
    sun = put(S, 'sun', 1.8, rz=0, loc=(2.0, 1.5, 3.2)); drive(sun, lambda t: {'scale': ss((t - q * 1) / .5) * (1 - ss((t - q * 2 + .3) / .5)) + .001, 'rot': (0, t * 60, 0), 'loc': (2.0, 1.5, 3.2)}, S, step=3)
    falling(S, 12, (-2.5, 2.5), 5, -2.5, 3.0, lambda i: sphere(.16, M('#fb923c', .5), scale=(1, .3, 1), seg=8), seed=3, win=(q * 2 + .2, q * 3 - .2))
    falling(S, 22, (-2.8, 2.8), 5.2, -2.8, 4.0, lambda i: sphere(.11, M('#ffffff', .9, 0, 0, 1.0 if False else 0), seg=8), seed=5, win=(q * 3 + .2, S.seconds))
    bokeh(S, 6, ('#ffffff',), seed=2, zr=(-4, 3))
    drive(isl, lambda t: {'rot': (0, 0, 20 * math.sin(2 * PI * t / S.seconds)), 'loc': (0, 0, -3.2 + .12 * math.sin(2 * PI * t / 3))}, S, step=3)

# ---------------- bloemen ----------------
def flower(S, x, hgt, col, ps, petals, center, t_grow, t_open, ctr_r=.3, rz=0):
    base = rig((x, 0, GZ)); st = rig(); st.parent = base
    cyl(.1, hgt, M('#16a34a', .5), loc=(0, 0, hgt / 2), seg=12).parent = st
    for sgn in (-1, 1):
        lf = sphere(.5, M('#22c55e', .45), loc=(sgn * .5, 0, hgt * .4), scale=(1, .1, .35), rot=(0, sgn * -30, 0)); lf.parent = st
    head = rig(); head.parent = base; pm = M(col, .35, 0, .4)
    for i in range(petals):
        o1 = rig(); o1.parent = head; o1.rotation_euler = (0, 2 * PI * i / petals, 0); i1 = rig(); i1.parent = o1
        sphere(.45 * ps, pm, loc=(0, -.02 * (i % 2), 1.0 * ps), scale=(.42, .1, 1.0)).parent = i1
        S._petals = getattr(S, '_petals', []); S._petals.append((i1, t_open))
        drive(i1, lambda t, t_open=t_open: {'rot': (pw(t, [(t_open, 82), (t_open + 1.6, 6)]), 0, 0)}, S, step=2)
    sphere(ctr_r, M(center, .6), loc=(0, -.12, 0), scale=(1, .5, 1), seg=16).parent = head
    def gf(t):
        s = elastic((t - t_grow) / 1.2) if t >= t_grow else .001
        return {'scale': (1, 1, s)}
    drive(st, gf, S, step=2)
    def hf(t):
        s = elastic((t - t_grow) / 1.2) if t >= t_grow else .001
        op = ss((t - t_open) / 1.6)
        return {'loc': (0, 0, hgt * s), 'rot': (-80 * (1 - op), 0, 0), 'scale': max(.001, s)}
    drive(head, hf, S, step=1)
    return base

def t_flowers(S, P):
    ground(S, P.get('ground', '#4ade80')); rn = random.Random(3); cols = P['cols']
    hs = P.get('hs', [2.8, 3.8, 2.4]); xs = P.get('xs', [-1.9, 0, 1.9])
    for i in range(len(cols)):
        flower(S, xs[i], hs[i], cols[i], P.get('ps', .85), P.get('petals', 9), P.get('center', '#fde047'), t_grow=.6 + i * .9, t_open=2.6 + i * .9, ctr_r=P.get('cr', .32))
    for k in range(10):
        x = -3 + k * .65; cone(.14, 0, .6, M('#15803d', .6), loc=(x, -1.0, GZ + .3), seg=6)
    sun = put(S, 'sun', 1.6, rz=0, loc=(2.2, 2, 3.3)); drive(sun, lambda t: {'rot': (0, t * 50, 0), 'scale': 1 + .06 * math.sin(t * 3), 'loc': (2.2, 2, 3.3)}, S, step=3)
    bf = put(S, 'butterfly', .9, rz=0, loc=(0, -1, 2))
    drive(bf, lambda t: {'loc': (2.4 * math.sin(2 * PI * t / 6 + 1), -1.2, GZ + 3.4 + 1.2 * math.sin(2 * PI * t / 3)), 'rot': (0, 15 * math.sin(t * 9), 0), 'scale': ss((t - 4) / .8) + .001}, S, step=2)
    label(S, P.get('t1', 'Bloemen gaan open'), z=4.8, start=3); bokeh(S, 8, ('#ffffff', '#fde68a'), seed=4, zr=(-4, 2))

# ---------------- weer-diorama ----------------
def t_weather(S, P):
    tiltcam(S, 14); isl = island(S, P.get('grass', '#4ade80'), r=3.1, z=-3.1)
    for nm, x, sz in P.get('obj', [('tree', -1.1, 2.6), ('house', 1.2, 2.2)]):
        o = put(S, nm, sz, rz=-10, loc=(x, 0, .25)); o.parent = isl
    rb = put(S, 'rainbow', 5.6, rz=0, loc=(0, 2.2, -2.0)); drive(rb, lambda t: {'scale': elastic((t - 6.2) / 1.0) if t > 6.2 else .001, 'loc': (0, 2.2, -2.0)}, S, step=2)
    sun = put(S, 'sun', 2.2, rz=0, loc=(1.9, 1.5, 3.2))
    drive(sun, lambda t: {'scale': (ss(t / .6) * (1 - ss((t - 2.4) / .6)) + ss((t - 8.0) / .6) * (1 - ss((t - 8.6) / .01))) + .001, 'rot': (0, t * 60, 0), 'loc': (1.9, 1.5, 3.2)}, S, step=2)
    cl = put(S, 'cloud', 3.8, rz=0, loc=(0, -.6, 3.0))
    drive(cl, lambda t: {'loc': (lerp(-5, 0, ss((t - 2.0) / 1.2)) if t < 6.3 else lerp(0, 5, ss((t - 6.3) / 1.2)), -.6, 3.0 + .15 * math.sin(t * 2)), 'scale': 1}, S, step=2)
    def mk(i): return sphere(.13, M('#38bdf8', .2, 0, .8), scale=(.6, .6, 1.7), loc=(0, -.5, 0), seg=10)
    rn = random.Random(5)
    for i in range(20):
        o = mk(i); x0 = rn.uniform(-1.6, 1.6); ph = rn.random()
        drive(o, lambda t, x0=x0, ph=ph: (lambda u, on: {'loc': (x0, -.4, lerp(2.4, -1.4, u)), 'scale': max(.001, on * math.sin(PI * u) ** .5)})((t / .9 + ph) % 1, ss((t - 3.2) / .3) * (1 - ss((t - 6.0) / .3))), S, step=1)
    label(S, P.get('t1', 'Het weer'), z=4.8, start=3, end=int(2.2 * 24)); label(S, 'Zon...', z=4.8, start=int(2.4 * 24) , end=int(3.4 * 24)) if False else None
    label(S, P.get('t2', 'Regen'), z=4.8, start=int(3.0 * 24), end=int(6.0 * 24)); label(S, P.get('t3', 'Regenboog!'), z=4.8, start=int(6.3 * 24), color='#fde047')
    drive(isl, lambda t: {'loc': (0, 0, -3.1 + .15 * math.sin(2 * PI * t / 4)), 'rot': (0, 0, 15 * math.sin(2 * PI * t / S.seconds))}, S, step=3)
    bokeh(S, 6, ('#ffffff',), seed=6, zr=(-4, 2))

# ---------------- vulkaan ----------------
def t_volcano(S, P):
    gz = -3.6; ground(S, P.get('ground', '#57534e'), ztop=gz); v = put(S, 'volcano', 6.2, rz=0, loc=(0, 0, gz)); ztop = gz + v['h'] * .92
    lc = P.get('lava', '#ff6a00'); lm = M(lc, .4, 0, 0, 4.0)
    lm = mat(lc, .4, 0, 6.0, 0)
    bursts = P.get('bursts', [1.5, 4.0, 6.5]); rn = random.Random(P.get('seed', 3))
    for tb in bursts:
        for i in range(12):
            r = rn.uniform(.14, .3); o = sphere(r, lm, seg=10); ang = rn.uniform(-75, 75); sp = rn.uniform(6.0, 9.0); vx = sp * math.sin(math.radians(ang)) * .55; vz = sp * math.cos(math.radians(ang)); dl = rn.uniform(0, .25)
            def f(t, tb=tb, vx=vx, vz=vz, dl=dl):
                u = t - tb - dl
                if u < 0 or u > 2.2: return {'scale': .001, 'loc': (0, 0, ztop)}
                return {'scale': 1 - ss((u - 1.6) / .6), 'loc': (vx * u, -.4, ztop + vz * u - 6.0 * u * u)}
            drive(o, f, S)
    for tb in bursts: label(S, P.get('boem', 'BOEM!'), z=4.6, start=int(tb * 24), end=int((tb + 1.3) * 24), color='#fde047', size=1.2)
    rising(S, 12, (-.4, .4), ztop, 5.0, 3.5, lambda i: sphere(.45, amat('#a8a29e', .6, .9), loc=(0, .5, 0), seg=12), seed=5, wob=.6)
    gl = bpy.data.lights.new('lava', 'POINT'); go = bpy.data.objects.new('lava', gl); bpy.context.collection.objects.link(go); go.location = (0, -2, ztop + 1); gl.color = lin(lc)
    def gf(t): return max([max(0, 1 - abs(t - tb - .3) * 1.2) for tb in bursts] + [.2])
    for f in range(1, S.frames + 1, 2): gl.energy = 900 * gf((f - 1) / 24); gl.keyframe_insert('energy', frame=f)
    drive(v, lambda t: {'loc': (0, 0, gz), 'rot': (0, 1.2 * math.sin(t * 50) * max([max(0, 1 - abs(t - tb) * 2) for tb in bursts]), 0)}, S)
    label(S, P.get('t1', 'Vulkaan!'), z=4.6, start=2, end=int(1.4 * 24)); bokeh(S, 6, ('#fdba74',), seed=3, zr=(-4, 2))

# ---------------- sneeuwpop ----------------
def t_snowman(S, P):
    ground(S, P.get('ground', '#e0f2fe'), ztop=GZ, bevel=.4, r=.8); sm = M('#ffffff', .8, 0, .2); sn = rig((0, 0, GZ))
    specs = [(1.45, 1.45), (1.05, 3.5), (.75, 5.0)]; zs = [1.35, 3.2, 4.6]; zs = [1.4, 3.35, 4.75]
    parts = []
    for i, (r, _) in enumerate(specs):
        b = rig(); b.parent = sn; sphere(r, sm, seg=28).parent = b; zc = zs[i] - .1 if False else [1.4, 3.2, 4.45][i]
        b.location = (0, 0, zc); tl = 1.2 + i * 1.3
        def f(t, tl=tl, zc=zc, b=b):
            u = (t - tl) / .6
            if u < 0: return {'scale': .001, 'loc': (0, 0, 9)}
            d = {'scale': 1, 'loc': (0, 0, lerp(9, zc, min(1, u) ** 2))}
            v = t - tl - .6
            if 0 <= v < .5: sq = math.sin(PI * v / .5) * .15; d['scale'] = (1 + .5 * sq, 1 + .5 * sq, 1 - sq)
            return d
        drive(b, f, S)
    top = [1.4, 3.2, 4.45]; hz = top[2]
    def pop(o, tl): drive(o, lambda t, tl=tl, o=o: {'scale': elastic((t - tl) / .7) if t > tl else .001, 'loc': tuple(o.location)}, S, step=1)
    for sx in (-.26, .26): o = sphere(.09, M('#111827', .3), loc=(sx, -.62, hz + .22), seg=10); o.parent = sn; pop(o, 4.9)
    nz = cone(.12, 0, .7, M('#fb923c', .4), loc=(0, -.72, hz - .02), rot=(90, 0, 0), seg=12); nz.parent = sn; pop(nz, 5.1)
    for k in range(3): o = sphere(.1, M('#111827', .3), loc=(0, -1.02 + k * 0 - 0, 3.2 + .45 - k * .45), seg=10); o.parent = sn; pop(o, 5.3 + k * .15)
    sc_ = torus(.78, .16, M(P.get('scarf', '#ef4444'), .6), loc=(0, 0, hz - .75), seg=28, minor=10); sc_.parent = sn; pop(sc_, 5.6)
    tail = cube((.3, .12, .8), M(P.get('scarf', '#ef4444'), .6), loc=(.45, -.8, hz - 1.1), rot=(0, 15, 0)); tail.parent = sn; pop(tail, 5.7)
    hat = rig(); hat.parent = sn; cyl(.62, .08, M(P.get('hat', '#1f2937'), .4), loc=(0, 0, 0), seg=24).parent = hat; cyl(.42, .62, M(P.get('hat', '#1f2937'), .4), loc=(0, 0, .35), seg=24).parent = hat
    cyl(.43, .12, M('#ef4444', .4), loc=(0, 0, .12), seg=24).parent = hat; hat.location = (0, 0, hz + .7)
    drive(hat, lambda t: {'scale': 1 if t > 6.1 else .001, 'loc': (0, 0, hz + .7 + (lerp(4, 0, min(1, (t - 5.7) / .4) ** 2) if t < 6.1 else 0) if t > 5.7 else 9), 'rot': (0, 4 * math.sin(t * 5) * ss((t - 6.5)), 0)}, S, step=1)
    for sgn in (-1, 1):
        a = curve_tube([(0, 0, 0), (sgn * .5, 0, .35), (sgn * 1.0, 0, .3), (sgn * 1.3, 0, .6)], .06, M('#78350f', .8)); r = rig((sgn * .95, 0, 3.3)); a.parent = r; r.parent = sn
        drive(r, lambda t, sgn=sgn: {'scale': ss((t - 5.8) / .4) + .001, 'rot': (0, sgn * (-35 + 35 * math.sin(2 * PI * (t - 6.5) / 1.1)) * ss((t - 6.5)), 0), 'loc': (sgn * .95, 0, 3.3)}, S, step=2)
    drive(sn, lambda t: {'loc': (0, 0, GZ + .0 + abs(math.sin(2 * PI * (t - 7) / 1.2)) * .35 * ss((t - 7))), 'rot': (0, 0, 10 * math.sin(2 * PI * (t - 7) / 2.4) * ss(t - 7))}, S, step=1)
    falling(S, 30, (-3, 3), 5.5, -3.6, 4.0, lambda i: sphere(.1 + .03 * (i % 3), M('#ffffff', .9, 0, 1), loc=(0, 0, 0), seg=8), seed=5, sway=.4)
    label(S, P.get('t1', 'Sneeuwpop bouwen'), z=4.8, start=3); bokeh(S, 4, ('#bfdbfe',), seed=6, zr=(-4, 2))

# ---------------- golven + boot ----------------
def t_waves(S, P):
    tiltcam(S, 22); cm = P.get('sea', '#06b6d4')
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=90, y_subdivisions=30, size=1); w = bpy.context.object; w.scale = (9, 6, 1); bpy.ops.object.transform_apply(scale=True)
    w.location = (0, 0, -2.6); w.data.materials.append(M(cm, .12, 0, .8)); w.data.polygons.foreach_set('use_smooth', [True] * len(w.data.polygons))
    md = w.modifiers.new('wave', 'WAVE'); md.use_x = True; md.use_y = False; md.height = P.get('h', .4); md.width = P.get('width', 1.6); md.narrowness = 2.0; md.speed = P.get('speed', .3); md.start_position_x = -4.5; md.time_offset = 0; md.damping_time = 0
    cube((9, 6, 4), M(P.get('deep', '#0e7490'), .3, 0, .4), loc=(0, 0, -5.0), bevel=.05)
    bt = put(S, P.get('boat', 'boat'), 2.8, rz=0, loc=(0, 0, -2.3))
    drive(bt, lambda t: {'loc': (.4 * math.sin(2 * PI * t / S.seconds), 0, -2.35 + .22 * math.sin(2 * PI * t / 2.4)), 'rot': (0, 7 * math.sin(2 * PI * t / 2.4 + 1), 0)}, S, step=1)
    sun = put(S, 'sun', 2.6, rz=0, loc=(1.8, 3, 1.8)); drive(sun, lambda t: {'rot': (0, t * 40, 0), 'loc': (1.8, 3, 1.8 + .15 * math.sin(t * 1.2))}, S, step=3)
    for k, (cx, cz, sz) in enumerate(((-2.0, 2.2, 2.2), (2.3, 3.0, 1.6))):
        c = put(S, 'cloud', sz, rz=0, loc=(cx, 2, cz)); drive(c, lambda t, cx=cx, cz=cz, k=k: {'loc': (cx + .5 * math.sin(2 * PI * t / S.seconds + k), 2, cz)}, S, step=3)
    fish = put(S, P.get('fish', 'fish'), 1.1, rz=40, loc=(0, 0, -3))
    for tj, x0 in ((2.0, -2.2), (6.0, 2.0)):
        pass
    def ff(t):
        for tj, x0, dr in ((2.2, -2.3, 1), (6.2, 2.3, -1)):
            u = (t - tj) / 1.3
            if 0 <= u <= 1: return {'loc': (x0 + dr * 1.4 * u, -.8, -2.9 + 2.2 * 4 * u * (1 - u)), 'rot': (0, -dr * (45 - 90 * u) * -1 * 0.0, 0), 'scale': 1}
        return {'scale': .001, 'loc': (0, 0, -9)}
    drive(fish, ff, S)
    label(S, P.get('t1', 'Op de golven'), z=4.8, start=3); bokeh(S, 6, ('#ffffff',), seed=7, zr=(-4, 3))

# ---------------- paddenstoelenbos ----------------
def mushroom(capc, sp, s, spots=True):
    r = rig(); stem = cone(.34 * s, .22 * s, 1.0 * s, M('#fef3c7', .6), loc=(0, 0, .5 * s), seg=16); stem.parent = r
    cap = lathe([(.001, 0), (1.0 * s, 0), (1.06 * s, .1 * s), (.92 * s, .5 * s), (.5 * s, .85 * s), (.001, .95 * s)], mat(capc, .35, 0, .5, .3)); cap.location = (0, 0, .8 * s); cap.parent = r
    rn = random.Random(int(s * 100))
    if spots:
        for k in range(7):
            rr = .62 * s * math.sqrt(rn.random()); a = rn.uniform(0, 6.28); z = .8 * s + .95 * s * math.sqrt(max(0, 1 - (rr / (1.06 * s)) ** 2)) * .86
            sphere(.11 * s, M(sp, .5), loc=(rr * math.cos(a), rr * math.sin(a), z), scale=(1, 1, .5), seg=8).parent = r
    return r

def t_mushrooms(S, P):
    tiltcam(S, 12); ground(S, P.get('ground', '#14532d'), ztop=GZ, h=3.0, bevel=.4); rn = random.Random(P.get('seed', 4)); caps = P['caps']
    pts = [(-1.9, -.6, .8), (0, -.9, 1.2), (1.9, -.5, .9), (-1.0, .9, 1.4), (1.1, 1.0, 1.1), (-2.4, 1.6, .9), (2.4, 1.7, 1.2), (.1, 2.4, 1.5)]
    for i, (x, y, s) in enumerate(pts):
        m = mushroom(caps[i % len(caps)], P.get('spot', '#ffffff'), s); m.location = (x, y, GZ); tl = .6 + i * .85
        drive(m, lambda t, tl=tl, x=x, y=y: {'scale': elastic((t - tl) / .9) if t > tl else .001, 'loc': (x, y, GZ), 'rot': (0, 0, 0)}, S, step=1)
    for i in range(14):
        o = sphere(.07, glow(P.get('fire', '#fde047'), 6), seg=8); ph = rn.uniform(0, 6.28); cx = rn.uniform(-2.8, 2.8); cz = rn.uniform(-2.5, 3.0); ax = rn.uniform(.3, .9); az = rn.uniform(.3, .8)
        drive(o, lambda t, ph=ph, cx=cx, cz=cz, ax=ax, az=az: {'loc': (cx + ax * math.sin(2 * PI * t / S.seconds * 2 + ph), -1.4, cz + az * math.sin(2 * PI * t / S.seconds * 3 + ph * 2)), 'scale': .6 + .6 * (.5 + .5 * math.sin(t * 4 + ph * 3))}, S, step=2)
    label(S, P.get('t1', 'Paddenstoelenbos'), z=4.8, start=3); bokeh(S, 6, ('#a7f3d0',), seed=8, zr=(-4, 3))

# ---------------- dag en nacht ----------------
def t_daynight(S, P):
    tiltcam(S, 12); isl = island(S, P.get('grass', '#4ade80'), r=3.1, z=-3.0)
    hm = rig(); hm.parent = isl; hm.location = (-.9, 0, .25)
    cube((2.4, 1.8, 1.7), M('#fde68a', .6), loc=(0, 0, .85), bevel=.06).parent = hm
    cone(1.95, 0, 1.2, M('#dc2626', .5), loc=(0, 0, 2.3), rot=(0, 0, 45), seg=4).parent = hm
    wm = mat('#fff3b0', .3, 0, 0.0, 0)
    for sx in (-.65, .65):
        cube((.5, .1, .55), wm, loc=(sx, -.93, 1.05), bevel=0).parent = hm
    ems = wm.node_tree.nodes['Principled BSDF'].inputs
    cube((.5, .1, .9), M('#7c3f0e', .6), loc=(0, -.93, .45), bevel=0).parent = hm
    for tx, h in ((1.6, 2.4), (2.2, 1.7)):
        pn = rig((tx, .2, .25)); pn.parent = isl
        cone(.55 * h / 2, 0, h, M('#166534', .6), loc=(0, 0, h / 2 + .3), seg=14).parent = pn; cyl(.1, .4, M('#7c4a21', .8), loc=(0, 0, .2), seg=8).parent = pn
    orb = rig((0, 3.0, -1.6)); sun = put(S, 'sun', 2.3, rz=0); moon = put(S, 'moon', 2.0, rz=0); sun.parent = orb; moon.parent = orb; sun.location = (4.5, 0, 0); moon.location = (-4.5, 0, 0)
    drive(orb, lambda t: {'rot': (0, -360 * t / S.seconds, 0)}, S, step=2)
    drive(sun, lambda t: {'rot': (0, 0, 0), 'loc': (4.5, 0, 0)}, S, step=24); drive(moon, lambda t: {'loc': (-4.5, 0, 0)}, S, step=24)
    def counter(o, base=(0, 0, 0)):
        drive(o, lambda t: {'rot': (0, 360 * t / S.seconds, 0)}, S, step=2)
    counter(sun); counter(moon)
    def night(t): return ss(math.sin(2 * PI * t / S.seconds + PI / 2 * 0 + PI) * 4 + 0) if False else ss(.5 + 1.8 * math.sin(2 * PI * t / S.seconds - PI) * -1 * -1)
    def nf(t): u = (t / S.seconds) % 1; return ss((u - .42) / .12) * (1 - ss((u - .92) / .08))
    for k in range(10):
        st = put(S, 'star', .5 + .2 * (k % 2), rz=0, loc=(-2.6 + k * .6, 2.5, 1.2 + (k * 7 % 5) * .8))
        drive(st, lambda t, k=k, st=st: {'scale': (.001 + nf(t) * (1 + .3 * math.sin(t * 4 + k))), 'rot': (0, t * 50, 0), 'loc': tuple(st.location)}, S, step=2)
    for f in range(1, S.frames + 1, 3):
        t = (f - 1) / 24; n = nf(t); ems['Emission Color'].default_value = (1, .85, .4, 1); ems['Emission Strength'].default_value = 5 * n; ems['Emission Strength'].keyframe_insert('default_value', frame=f)
    lights = [o for o in bpy.data.objects if o.type == 'LIGHT']; base = [o.data.energy for o in lights]
    wn = S.sc.world.node_tree.nodes['Background']
    for f in range(1, S.frames + 1, 3):
        t = (f - 1) / 24; n = nf(t)
        for o, b in zip(lights, base): o.data.energy = b * (1 - .75 * n); o.data.keyframe_insert('energy', frame=f)
        wn.inputs['Strength'].default_value = 1 - .65 * n; wn.inputs['Strength'].keyframe_insert('default_value', frame=f)
    drive(isl, lambda t: {'loc': (0, 0, -3.0 + .1 * math.sin(2 * PI * t / 3)), 'rot': (0, 0, 8 * math.sin(2 * PI * t / S.seconds))}, S, step=3)
    label(S, P.get('t1', 'Dag en nacht'), z=4.8, start=3)

# ---------------- moestuin ----------------
def t_garden(S, P):
    ground(S, P.get('ground', '#a16207')); ground(S, P.get('step', '#854d0e'), ztop=-1.0, w=7.2, d=2, h=2.4, y=1.8)
    pl = P['plants']; pos = [(-1.9, -.5, GZ), (0, -.5, GZ), (1.9, -.5, GZ), (-1.9, 1.8, -1.0), (0, 1.8, -1.0), (1.9, 1.8, -1.0)]
    for i, nm in enumerate(pl[:6]):
        x, y, z = pos[i]; r = put(S, nm, 2.0 + (.3 if i > 2 else 0), rz=-10, loc=(x, y, z)); tl = 1.0 + i * 1.0
        for k in range(3): cone(.12, 0, .5, M('#15803d', .6), loc=(x - .6 + k * .6, y - .9, z + .25), seg=6)
        drive(r, lambda t, tl=tl, x=x, y=y, z=z: {'scale': elastic((t - tl) / .9) if t > tl else .001, 'loc': (x, y, z), 'rot': (0, 4 * math.sin(2 * PI * t / 3 + x) * ss(t - tl - 1), 0)}, S, step=1)
    sun = put(S, 'sun', 1.5, rz=0, loc=(2.5, 2.5, 3.0)); drive(sun, lambda t: {'rot': (0, t * 50, 0), 'loc': (2.5, 2.5, 3.0), 'scale': 1 + .05 * math.sin(t * 3)}, S, step=3)
    rn = random.Random(3)
    for i in range(14):
        o = sphere(.11, M('#38bdf8', .2, 0, .8), scale=(.6, .6, 1.6), seg=8); x0 = rn.uniform(-3, 3); ph = rn.random()
        drive(o, lambda t, x0=x0, ph=ph: (lambda u, on: {'loc': (x0, -1.2, lerp(5, -3, u)), 'scale': max(.001, on)})((t / 1.0 + ph) % 1, ss((t - .1) / .2) * (1 - ss((t - 2.6) / .3))), S, step=1)
    label(S, P.get('t1', 'Moestuin'), z=4.8 + 0, start=3, x=-.4); bokeh(S, 6, ('#ffffff',), seed=2, zr=(-4, 2))

# ---------------- noorderlicht ----------------
def t_aurora(S, P):
    ground(S, '#e0f2fe', ztop=GZ, bevel=.5, r=.8); cols = P.get('cols', ['#4ade80', '#22d3ee', '#a78bfa'])
    rn = random.Random(P.get('seed', 3)); N = 60
    for layer in range(2):
        for i in range(N):
            x = -3.4 + i * 6.8 / (N - 1); ph = i * .45 + layer * 1.7; y = 2.2 + layer * 1.2
            r = rig((x, y, 0));
            for k, c in enumerate(cols):
                b = cube((.14, .12, .8), amat(c, .6 - layer * .15, .5, emit=1.0), loc=(0, 0, 0 + k * .0), bevel=0); b.parent = r; b.location = (0, 0, k * .8 + .4)
            def f(t, ph=ph, x=x, r=r):
                zb = 1.2 + .9 * math.sin(x * .8 + t * .9 + ph * .3) + .4 * math.sin(x * 2 + t * 1.7)
                hh = 1.0 + .5 * math.sin(x * 1.3 - t * 1.1 + ph)
                return {'loc': (x, r.location[1], zb), 'scale': (1, 1, max(.2, hh))}
            drive(r, f, S, step=2)
    for tx, h, y in ((-2.4, 3.0, .3), (-1.3, 2.2, -.6), (2.2, 3.2, .4), (1.2, 2.0, -.7), (2.9, 2.0, -.8)):
        pn = rig((tx, y, GZ))
        for k in range(3): cone(.9 - k * .2, 0, h * .45, M('#166534', .6), loc=(0, 0, .5 + k * h * .26 + h * .2), seg=12).parent = pn
        cyl(.1, .5, M('#7c4a21', .8), loc=(0, 0, .25), seg=8).parent = pn
    for k in range(26):
        o = sphere(.05, glow('#ffffff', 5), seg=6); x = rn.uniform(-3, 3); z = rn.uniform(-.5, 4.0); ph = rn.uniform(0, 6)
        drive(o, lambda t, x=x, z=z, ph=ph: {'loc': (x, 4.0, z), 'scale': .6 + .6 * (.5 + .5 * math.sin(t * 3 + ph))}, S, step=3)
    sh = sphere(.09, glow('#ffffff', 8), seg=8)
    drive(sh, lambda t: (lambda u: {'loc': (lerp(-3, 2.5, u), 3.5, lerp(5, 2.5, u)), 'scale': math.sin(PI * u) + .001})(((t - 3) / 1.2) if 3 < t < 4.2 else (((t - 7.2) / 1.2) if 7.2 < t < 8.4 else -1) if False else (((t - 3) / 1.2) % 1 if (t % 4.2) > 3.0 else 0)), S, step=1)
    label(S, P.get('t1', 'Noorderlicht'), z=4.8, start=3)

# ---------------- zonnebloemen volgen de zon ----------------
def t_sunflowers(S, P):
    ground(S, P.get('ground', '#4ade80')); nm = P.get('flower', 'sunflower'); xs = [-2.0, 0, 2.0]; hs = [3.2, 3.9, 2.8]
    sun = put(S, 'sun', 2.0, rz=0, loc=(0, 2.5, 3.0)); T = S.seconds
    def sx(t): return 2.6 * math.sin(2 * PI * t / T)
    drive(sun, lambda t: {'loc': (sx(t), 2.5, 3.2 + .9 * math.cos(2 * PI * t / T) * .6), 'rot': (0, t * 40, 0)}, S, step=2)
    for i in range(3):
        r = put(S, nm, hs[i], rz=0, loc=(xs[i], 0, GZ))
        drive(r, lambda t, i=i: {'rot': (0, 2 * math.sin(t * 2 + i), 45 * math.sin(2 * PI * t / T) - 8 * i + 8), 'loc': (xs[i], 0, GZ)}, S, step=2)
    for k in range(P.get('bees', 2)):
        b = put(S, 'bee', .8, rz=0, loc=(0, -1.2, 0)); ph = k * 2.2
        drive(b, lambda t, ph=ph: {'loc': (2.4 * math.sin(2 * PI * t / 4 + ph), -1.4, GZ + 2.2 + 1.2 * math.sin(2 * PI * t / 2 + ph * 2)), 'rot': (0, 10 * math.sin(t * 20), 0)}, S, step=1)
    label(S, P.get('t1', 'Zon volgen'), z=4.8, start=3); bokeh(S, 6, ('#ffffff', '#fde68a'), seed=2, zr=(-4, 2))

for _k, _v in list(globals().items()):
    if _k.startswith('t_'): L.TEMPLATES[_k[2:]] = _v
