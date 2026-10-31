"""Batch b: sjablonen voor 'eten'."""
from shorts_b_lib import *
import shorts_b_lib as L

def lin(c):
    c = c.lstrip('#'); return tuple(pow(int(c[i:i + 2], 16) / 255, 2.2) for i in (0, 2, 4))
def keycol(m, frame, c):
    b = m.node_tree.nodes['Principled BSDF'].inputs['Base Color']; b.default_value = (*lin(c), 1); b.keyframe_insert('default_value', frame=frame)
def child(o, parent): o.parent = parent; return o
def parent_all(objs, r):
    for o in objs: o.parent = r
    return r
def cnorm(S, o): return o

# ---------------- donut ----------------
def t_donut(S, P):
    tr = rig((0, 0, .2)); tr.rotation_euler = (math.radians(P.get('lean', 62)), 0, 0)
    sp = rig(); sp.parent = tr
    dough = M(P.get('dough', '#e8a65a'), .5, 0, .1); gl = M(P['glaze'], .22, 0, .8)
    child(torus(1.55, .66, dough, seg=48, minor=24), sp); g = child(torus(1.55, .63, gl, seg=48, minor=24, loc=(0, 0, .16)), sp); g.scale = (1.0, 1.0, .62)
    for i in range(14):
        a = 2 * PI * i / 14; d = child(sphere(.17, gl, loc=(1.55 * math.cos(a) * 1.0, 1.55 * math.sin(a), -.35), seg=10), sp); d.scale = (1, 1, 1.5)
    rn = random.Random(P.get('seed', 3)); cols = P.get('sprink', ['#ffffff', '#fde047', '#22d3ee', '#a3e635', '#f43f5e'])
    n = P.get('n', 40)
    for i in range(n):
        a = rn.uniform(0, 2 * PI); rr = 1.55 + rn.uniform(-.36, .36); z = .16 + .63 * .62 * math.sqrt(max(0, 1 - ((rr - 1.55) / .63) ** 2)) + .02
        o = child(cyl(.045, .3, M(rn.choice(cols), .4, 0, .2), seg=8, rot=(90, 0, math.degrees(a) + rn.uniform(-90, 90))), sp)
        tl = 1.2 + i * (5.0 / n)
        def f(t, a=a, rr=rr, z=z, tl=tl):
            u = (t - tl) / .45
            if u < 0: return {'scale': .001, 'loc': (rr * math.cos(a), rr * math.sin(a), 4)}
            return {'scale': 1, 'loc': (rr * math.cos(a), rr * math.sin(a), lerp(4, z, min(1, u) ** 2))}
        drive(o, f, S)
    if P.get('glaze2'): keycol(gl, int(5.5 * 24), P['glaze']); keycol(gl, int(7 * 24), P['glaze2'])
    drive(sp, lambda t: {'rot': (0, 0, 40 * t)}, S, step=3)
    drive(tr, lambda t: {'loc': (0, 0, .2 + .25 * math.sin(2 * PI * t / 3)), 'rot': (P.get('lean', 62) + 6 * math.sin(2 * PI * t / 4.5), 0, 4 * math.sin(2 * PI * t / 4.5))}, S, step=2)
    label(S, P.get('t1', 'Donut!'), z=4.5, start=3); bokeh(S, 10, ('#ffffff', '#fde68a', '#fbcfe8'), seed=2)

# ---------------- pizza ----------------
def topping(kind, rn):
    r = rig()
    if kind == 'pepperoni':
        cyl(.4, .1, M('#b91c1c', .35), seg=20, rot=(90, 0, 0)).parent = r
        for k in range(3): cyl(.06, .04, M('#7f1d1d', .5), loc=(rn.uniform(-.2, .2), -.06, rn.uniform(-.2, .2)), rot=(90, 0, 0), seg=8).parent = r
    elif kind == 'olive': torus(.18, .08, M('#18181b', .3), rot=(90, 0, 0), seg=20, minor=10).parent = r
    elif kind == 'mushroom':
        sphere(.3, M('#f5ead0', .5), scale=(1, .6, .8)).parent = r; cyl(.12, .3, M('#e5d5b0', .5), loc=(0, .05, -.22), rot=(90, 0, 0), seg=10).parent = r
    elif kind == 'pepper': torus(.28, .07, M('#22c55e', .35), rot=(90, 0, 0), seg=20, minor=10).parent = r
    elif kind == 'tomato':
        cyl(.34, .08, M('#ef4444', .3), seg=20, rot=(90, 0, 0)).parent = r; cyl(.22, .09, M('#fca5a5', .3), seg=20, rot=(90, 0, 0), loc=(0, -.02, 0)).parent = r
    elif kind == 'basil': sphere(.3, M('#16a34a', .4), scale=(1, .12, .6), rot=(0, rn.uniform(0, 180), 0)).parent = r
    elif kind == 'corn': sphere(.16, M('#facc15', .3), scale=(1, .8, 1)).parent = r
    return r

def t_pizza(S, P):
    pz = rig((0, 0, 0)); rn = random.Random(P.get('seed', 3))
    def D(r, h, c, y, ro=.0): o = cyl(r, h, M(c, .55, 0, .1), rot=(90, 0, 0), loc=(0, y, 0), seg=48, bevel=.03); o.parent = pz; return o
    D(2.6, .36, P.get('dough', '#e9b872'), 0); cr = torus(2.5, .24, M(P.get('dough', '#e9b872'), .5), loc=(0, -.12, 0), rot=(90, 0, 0), seg=48); cr.parent = pz
    sa = D(2.25, .1, P.get('sauce', '#dc2626'), -.2); ch = D(2.1, .1, P.get('cheese', '#fcd34d'), -.27)
    for o, t0 in ((sa, .3), (ch, 1.0)): drive(o, lambda t, t0=t0: {'scale': (max(.001, ss((t - t0) / .8)),) * 2 + (1,)}, S, step=3)
    kinds = P['top']; n = P.get('n', 16)
    for i in range(n):
        k = kinds[i % len(kinds)]; r = topping(k, rn); r.parent = pz
        a = i * 2.39996; rr = 1.75 * math.sqrt((i + .5) / n); x = rr * math.cos(a); z = rr * math.sin(a)
        r.location = (x, -.42, z); r.rotation_euler = (0, rn.uniform(0, 6), 0)
        tl = 1.9 + i * .3
        def f(t, r=r, x=x, z=z, tl=tl):
            u = (t - tl) / .5
            if u < 0: return {'scale': .001, 'loc': (x, -.42, 7)}
            h = max(0, 1 - (t - tl - .5) * 6) * .15 if t > tl + .5 else 0
            return {'scale': 1 + (0 if u >= 1 else 0), 'loc': (x, -.42, lerp(7, z, min(1, u) ** 2) + (.3 * math.sin(PI * min(1, max(0, (t - tl - .5) / .3))) if t > tl + .5 else 0))}
        drive(r, f, S)
    drive(pz, lambda t: {'rot': (0, 360 * ss((t - 7.0) / 2.0) * .9 + 8 * math.sin(t * 2) * (1 if t < 7 else 0), 0), 'loc': (0, 0, .3 + .12 * math.sin(2 * PI * t / 3))}, S, step=2)
    label(S, P.get('t1', 'Pizza!'), z=4.6, start=3); bokeh(S, 8, ('#ffffff', '#fde68a'), seed=3)

# ---------------- taart ----------------
def t_cake(S, P):
    S.cam.rotation_euler = (math.radians(90 - 18), 0, 0); t = math.radians(18); S.cam.location = (0, -14 * math.cos(t), 14 * math.sin(t))
    ck = rig((0, 0, -3.3)); cols = P['cols']; rn = random.Random(P.get('seed', 2))
    cyl(2.9, .22, M('#ffffff', .25), loc=(0, 0, .1), seg=48).parent = ck
    z = .22; rads = [2.5, 1.85, 1.2]; hs = [1.5, 1.3, 1.1]; tops = []
    for i in range(3):
        r = rig(); r.parent = ck; R = rads[i]; h = hs[i]
        cyl(R, h, M(cols[i], .5, 0, .15), loc=(0, 0, h / 2), seg=48, bevel=.05).parent = r
        cyl(R + .04, .22, M('#fff7ed', .35, 0, .3), loc=(0, 0, h - .08), seg=48).parent = r
        for k in range(12):
            a = 2 * PI * k / 12 + i; dh = .35 + .3 * ((k * 7) % 3) / 2
            cyl(.13, dh, M('#fff7ed', .35, 0, .3), loc=((R + .06) * math.cos(a), (R + .06) * math.sin(a), h - .1 - dh / 2), seg=10).parent = r
            sphere(.13, M('#fff7ed', .35, 0, .3), loc=((R + .06) * math.cos(a), (R + .06) * math.sin(a), h - .1 - dh), seg=10).parent = r
        for k in range(10):
            a = 2 * PI * k / 10 + .3; s = sphere(.12, M(rn.choice(P.get('pearls', ['#f43f5e', '#fde047', '#38bdf8'])), .3, 0, .3), loc=((R - .05) * math.cos(a), (R - .05) * math.sin(a) - .05, h * .45), seg=10)
            s.parent = r; tl = 4.2 + i * .5 + k * .12
            drive(s, lambda t, tl=tl, s=s: {'scale': max(.001, ss((t - tl) / .25))}, S, step=2)
        r.location = (0, 0, z); tl = 1.2 + i * 1.3; fn = drop_seq(S, r, tl, z, zfrom=8, dur=.5, bounce=.25); drive(r, fn, S); z += h * .95; tops.append(z)
    zt = tops[-1] + .1
    for k in range(3):
        a = 2 * PI * k / 3 + .5; c = rig(); c.parent = ck
        sphere(.3, M('#dc2626', .2, 0, .8), seg=14).parent = c; curve_tube([(0, 0, .2), (.05, 0, .5), (.18, 0, .7)], .03, M('#166534', .5)).parent = c
        c.location = (.55 * math.cos(a), .55 * math.sin(a), zt + .3); fn = drop_seq(S, c, 5.3 + k * .35, zt + .3, zfrom=8, dur=.5, bounce=.4); drive(c, fn, S)
    for k in range(P.get('candles', 3)):
        x = -.5 + k * .5 - (P.get('candles', 3) - 1) * .25; c = rig(); c.parent = ck
        cyl(.07, .9, M(['#38bdf8', '#fde047', '#f472b6'][k % 3], .4), loc=(0, 0, .45), seg=10).parent = c
        fl = sphere(.14, glow('#ffb703', 5), loc=(0, 0, 1.05), scale=(1, 1, 1.5), seg=10); fl.parent = c
        c.location = (x * 1.0, .0, zt + .25 + 1.45 + .0 - 1.45 + 0.5); tl = 6.6 + k * .25
        c.location = (x, 0, zt + .55)
        drive(c, lambda t, tl=tl, x=x: {'scale': max(.001, ss((t - tl) / .3)), 'loc': (x, 0, zt + .55)}, S, step=2)
        drive(fl, lambda t, k=k: {'scale': (1 + .15 * math.sin(t * 17 + k), 1, 1.5 + .35 * math.sin(t * 23 + k))}, S)
    drive(ck, lambda t: {'rot': (0, 0, -360 * t / S.seconds)}, S, step=3)
    label(S, P.get('t1', 'Taart!'), z=4.5, start=3); bokeh(S, 10, ('#ffffff', '#fecdd3'), seed=4)

# ---------------- ijsjes ----------------
def t_icecream(S, P):
    ic = rig((0, 0, -4.7)); cols = P['cols']
    cn = cone(.95, .0, 2.6, M('#d9a55c', .6, 0, .1), loc=(0, 0, 1.3), rot=(180, 0, 0), seg=32); cn.parent = ic
    for i in range(5):
        zz = .5 + i * .45; torus(.95 * (zz / 2.6) + .01, .05, M('#b9803a', .6), loc=(0, 0, zz + 0.0), seg=32, minor=8).parent = ic
    z = 2.6 + .3; n = len(cols)
    for i, c in enumerate(cols):
        r = rig(); r.parent = ic; m = M(c, .3, 0, .5)
        sphere(.98, m, loc=(0, 0, .35)).parent = r; sk = torus(.88, .22, m, loc=(0, 0, -.2), seg=32, minor=12); sk.scale = (1, 1, .7); sk.parent = r
        for k in range(6): sphere(.17, m, loc=(.9 * math.cos(k * 1.05), .9 * math.sin(k * 1.05), -.35), seg=10, scale=(1, 1, 1.3)).parent = r
        zc = 2.6 + .55 + i * 1.12; r.location = (0, 0, zc)
        fn = drop_seq(S, r, 1.3 + i * 1.5, zc, zfrom=11, dur=.5, bounce=.3); drive(r, fn, S)
    zt = 2.6 + .55 + (n - 1) * 1.12 + 1.0; c = rig(); c.parent = ic
    sphere(.32, M('#dc2626', .2, 0, .8), seg=14).parent = c; curve_tube([(0, 0, .25), (.05, 0, .6), (.2, 0, .85)], .035, M('#166534', .5)).parent = c
    c.location = (0, 0, zt); drive(c, drop_seq(S, c, 1.3 + n * 1.5 + .2, zt, zfrom=11, dur=.4, bounce=.4), S)
    drive(ic, lambda t: {'rot': (0, 3.5 * math.sin(2 * PI * t / 2.4) * ss((t - 1.3 - n * 1.5) / 1) , 0), 'loc': (0, 0, -4.7)}, S, step=2)
    label(S, P.get('t1', 'IJsjes stapelen'), z=4.6, start=3); bokeh(S, 10, ('#ffffff', '#bae6fd', '#fecdd3'), seed=7)

# ---------------- burger ----------------
def piece(kind, rn):
    r = rig(); Q = lambda o: (setattr(o, 'parent', r), o)[1]
    if kind == 'bun_b': Q(lathe([(.001, 0), (1.35, 0), (1.55, .12), (1.62, .35), (1.5, .52), (.001, .52)], M('#e8a24a', .45, 0, .3))); h = .52
    elif kind == 'bun_t':
        Q(lathe([(.001, 0), (1.55, 0), (1.62, .22), (1.5, .75), (1.0, 1.18), (.4, 1.38), (.001, 1.42)], M('#e8a24a', .45, 0, .3))); h = 1.0
        for k in range(14):
            rr = 1.05 * math.sqrt(rn.random()); a = rn.uniform(0, 6.28); z = 1.40 * math.sqrt(max(0, 1 - (rr / 1.64) ** 2)) + .02
            Q(sphere(.09, M('#fff3d6', .4), loc=(rr * math.cos(a), rr * math.sin(a), z), scale=(1, 1, .5), seg=8))
    elif kind == 'patty': Q(cyl(1.55, .5, M('#6b3a1e', .7, 0, .1), loc=(0, 0, .25), bevel=.12, seg=40)); h = .45
    elif kind == 'cheese': Q(cube((2.9, 2.9, .09), M('#fbbf24', .35, 0, .5), loc=(0, 0, .05), rot=(0, 0, 45), bevel=.02)); h = .1
    elif kind == 'lettuce':
        for k in range(2): Q(torus(1.5 - k * .15, .2, M('#4ade80', .5), loc=(0, 0, .12 + k * .06), seg=36, minor=10)).scale = (1.05, 1.05, .6)
        Q(cyl(1.45, .06, M('#4ade80', .5), loc=(0, 0, .1), seg=36)); h = .3
    elif kind == 'tomato': Q(cyl(1.4, .22, M('#ef4444', .3, 0, .5), loc=(0, 0, .11), seg=36)); Q(cyl(1.0, .24, M('#fca5a5', .3, 0, .5), loc=(0, 0, .11), seg=36)); h = .22
    elif kind == 'onion': Q(torus(1.2, .06, M('#e9d5ff', .3), loc=(0, 0, .06), seg=32, minor=8)); Q(torus(.8, .06, M('#e9d5ff', .3), loc=(0, 0, .06), seg=32, minor=8)); h = .12
    elif kind == 'bacon':
        for k in range(2): Q(cube((3.2, .7, .08), M('#b91c1c', .5), loc=(0, 0, .06), rot=(0, 0, 25 + k * 70), bevel=.02))
        h = .12
    elif kind == 'pickle':
        for k in range(3): Q(cyl(.5, .09, M('#4d7c0f', .4), loc=(-.9 + k * .9, -.2 + (k % 2) * .5, .06), seg=20))
        h = .1
    return r, h

def t_burger(S, P):
    S.cam.rotation_euler = (math.radians(90 - 16), 0, 0); t = math.radians(16); S.cam.location = (0, -14 * math.cos(t), 14 * math.sin(t))
    bg = rig((0, 0, -3.5)); rn = random.Random(P.get('seed', 3))
    cyl(2.3, .2, M('#ffffff', .25, 0, .4), loc=(0, 0, -.1), seg=40).parent = bg
    z = 0; order = P['order']
    for i, k in enumerate(order):
        r, h = piece(k, rn); r.parent = bg; zl = z; z += h * 1.0; sc_ = P.get('k', 1.0)
        r.location = (0, 0, zl); fn = drop_seq(S, r, 1.0 + i * .75, zl, zfrom=9, dur=.45, bounce=.2); drive(r, fn, S)
    drive(bg, lambda t: {'rot': (0, 2.5 * math.sin(2 * PI * t / 2) * ss((t - 1 - len(order) * .75) / .6), 360 * t / S.seconds * 1.0), 'loc': (0, 0, -3.5), 'scale': 1.15}, S, step=3)
    label(S, P.get('t1', 'Burger bouwen'), z=4.6, start=3); bokeh(S, 10, ('#ffffff', '#fde68a'), seed=5)

# ---------------- fruit sorteren ----------------
def t_fruitsort(S, P):
    bins = P['bins']; xs = [-2.1, 0, 2.1]; rn = random.Random(P.get('seed', 5)); S.sorted = []
    for x, (col, items) in zip(xs, bins):
        cube((1.9, 1.7, 1.6), M(col, .5, 0, .2), loc=(x, 0, -4.1), bevel=.15)
    jobs = []
    for bi, (col, items) in enumerate(bins):
        for ii, name in enumerate(items): jobs.append((bi, ii, name))
    rn.shuffle(jobs)
    for k, (bi, ii, name) in enumerate(jobs):
        x = xs[bi]; r = put(S, name, 1.1, rz=-15, loc=(x, 0, 0)); zl = -3.3 + ii * .95
        fn = drop_seq(S, r, 1.5 + k * .7, zl, zfrom=7.5, dur=.7, bounce=.3)
        def f(t, fn=fn, k=k): d = fn(t); d['rot'] = (0, 15 * math.sin(t * 5 + k) * (1 if t < 1.5 + k * .7 else 0), 0); return d
        drive(r, f, S)
    label(S, P.get('t1', 'Sorteer op kleur'), z=4.6, start=3); bokeh(S, 8, ('#ffffff',), seed=2)

# ---------------- rij met lekkernijen ----------------
def t_cupwave(S, P):
    items = P['items']; cols = P.get('cols', 3); rows = P.get('rows', 3); xs = [-2.0 + 2.0 * i for i in range(cols)] if cols == 3 else [-1.5, 1.5]
    n = 0
    for rw in range(rows):
        z0 = -3.0 + rw * 2.5
        cube((6.8, 1.4, .25), M(P.get('shelf', '#fbcfe8'), .5, 0, .2), loc=(0, 0, z0 - .12), bevel=.08)
        for ci, x in enumerate(xs):
            name = items[(rw * cols + ci) % len(items)]; r = put(S, name, 1.7 if cols == 3 else 1.9, rz=-12 + (n % 3) * 12, loc=(x, 0, z0)); n += 1
            def f(t, x=x, z0=z0, ci=ci, rw=rw, r=r):
                ph = 2 * PI * (t / 2.4 - (ci + rw) / 6.0); u = max(0, math.sin(ph)); tl = .6 + (rw * cols + ci) * .13
                s = max(.001, ss((t - tl) / .4)) * (1 + .0)
                c = max(0, 1 - 6 * abs(math.sin(ph / 2)) ) if False else 0
                return {'loc': (x, 0, z0 + .55 * u), 'scale': (s * (1 - .05 * u), s * (1 - .05 * u), s * (1 + .12 * u)), 'rot': (0, 8 * math.sin(ph), 0)}
            drive(r, f, S)
    label(S, P.get('t1', 'Zoete golf'), z=4.7, start=3); bokeh(S, 8, ('#ffffff',), seed=6)

# ---------------- popcorn ----------------
def kernel(rn):
    r = rig(); m = M('#fff4c9', .6, 0, .1); m2 = M('#f7d774', .5)
    for dx, dz, rr, mm in ((0, 0, .26, m), (.2, .08, .2, m), (-.18, .1, .2, m), (.02, .22, .18, m2), (.1, -.14, .16, m2)):
        ico(rr, mm, loc=(dx, 0, dz), sub=1, smooth=True).parent = r
    return r

def t_popcorn(S, P):
    gz = -3.45; pot = rig((0, 0, -3.9)); rn = random.Random(P.get('seed', 4)); pc = P.get('pot', '#ef4444')
    cyl(1.5, 1.7, M(pc, .35, 0, .4), loc=(0, 0, .85), seg=40, bevel=.06).parent = pot; torus(1.52, .1, M('#fca5a5', .3), loc=(0, 0, 1.7), seg=40).parent = pot
    for sgn in (-1, 1): cyl(.08, .8, M('#44403c', .4), loc=(sgn * 1.75, 0, 1.1), rot=(0, 90, 0), seg=10).parent = pot
    n = P.get('n', 34); tt = []
    for i in range(n):
        ts = 1.0 + i * (S.seconds - 3.0) / n + rn.uniform(0, .15); vx = rn.uniform(-1.9, 1.9); vz = rn.uniform(5.5, 8.5); xl = rn.uniform(-2.8, 2.8)
        k = kernel(rn); zg = gz + rn.uniform(0, .5); yy = rn.uniform(-1.0, 0.5); tt.append(ts)
        sp = rn.uniform(-300, 300)
        def f(t, ts=ts, vx=vx, vz=vz, zg=zg, yy=yy, sp=sp):
            if t < ts: return {'scale': .001, 'loc': (0, 0, -2)}
            u = t - ts; Tl = (vz + math.sqrt(vz * vz + 19.6 * (-2.1 - zg))) / 9.8; uu = min(u, Tl)
            return {'scale': ss(u / .1), 'loc': (vx * uu * .55, yy, -2.1 + vz * uu - 4.9 * uu * uu), 'rot': (0, sp * uu, sp * uu * .6)}
        drive(k, f, S)
    drive(pot, lambda t: (lambda p: {'loc': (0, 0, -3.9), 'rot': (0, 4 * math.sin(t * 30) * (p), 0), 'scale': (1 + .08 * p, 1, 1 - .08 * p)})(max([max(0, 1 - (t - ts) * 4) for ts in tt if t >= ts] + [0])), S)
    for k in range(6):
        ts = 1.4 + k * 1.2; x = rn.choice([-1.6, 1.6]) + rn.uniform(-.5, .5)
        label(S, 'POP!', z=rn.uniform(1.5, 3.4), size=1.0, start=int(ts * 24), end=int((ts + .5) * 24), color=['#fde047', '#fb923c', '#ffffff'][k % 3], x=x)
    label(S, P.get('t1', 'Popcorn!'), z=4.7, start=3); bokeh(S, 8, ('#ffffff', '#fde047'), seed=3)

# ---------------- chocolade-toren ----------------
def t_choc(S, P):
    S.cam.rotation_euler = (math.radians(90 - 16), 0, 0); t = math.radians(16); S.cam.location = (0, -14 * math.cos(t), 14 * math.sin(t))
    tw = rig((0, 0, -3.6)); n = P.get('n', 10); cc = P.get('choc', '#5b2a14'); cs = P.get('sq', '#7a3b1d')
    cyl(2.4, .2, M('#ffffff', .3), loc=(0, 0, -.1), seg=40).parent = tw
    for i in range(n):
        r = rig(); r.parent = tw; ang = 90 * (i % 2)
        cube((3.4, 1.15, .4), M(cc, .4, 0, .5), loc=(0, 0, .2), bevel=.05).parent = r
        for a in range(4):
            for b in range(2): cube((.62, .4, .07), M(cs, .35, 0, .6), loc=(-1.2 + a * .8, -.28 + b * .56, .42), bevel=.02).parent = r
        r.rotation_euler = (0, 0, math.radians(ang)); zl = i * .42; r.location = (0, 0, zl)
        fn = drop_seq(S, r, 1.0 + i * .68, zl, zfrom=9, dur=.45, bounce=.15)
        def f(t, fn=fn, ang=ang): d = fn(t); d['rot'] = (0, 0, ang); return d
        drive(r, f, S)
    zt = n * .42; sb = put(S, P.get('top', 'strawberry'), 1.3, rz=0)
    sb.parent = tw; sb.location = (0, 0, zt)
    drive(sb, drop_seq(S, sb, 1.0 + n * .68 + .3, zt, zfrom=9, dur=.5, bounce=.4), S)
    drive(tw, lambda t: {'rot': (0, 4 * math.sin(2 * PI * t / 2.5) * ss((t - 8) / .8), -360 * ss((t - 7.0) / 2.0)), 'loc': (0, 0, -3.6)}, S, step=3)
    label(S, P.get('t1', 'Chocolade-toren'), z=4.7, start=3); bokeh(S, 8, ('#ffffff', '#fde68a'), seed=9)

# ---------------- sap / vloeibaar ----------------
def t_juice(S, P):
    jc = P['juice']; gl = rig((0, 0, -4.4))
    amat('#ffffff', .2)
    jm = M(jc, .2, 0, .6); j = cyl(1.45, 3.4, jm, loc=(0, 0, 1.75), seg=32); j.parent = gl
    drive(j, lambda t: {'scale': (1, 1, max(.001, ss((t - 3.6) / 2.4))), 'loc': (0, 0, .05 + 1.75 * max(.001, ss((t - 3.6) / 2.4)))}, S, step=2)
    cyl(1.62, 3.9, amat('#e0f2fe', .22, .05), loc=(0, -.1, 2.0), seg=32).parent = gl
    cyl(1.7, .12, M('#ffffff', .2, 0, .5), loc=(0, 0, .0), seg=32).parent = gl; torus(1.62, .06, M('#ffffff', .2), loc=(0, 0, 3.95), seg=32, minor=8).parent = gl
    fr = put(S, P['fruit'], 2.6, rz=-15, loc=(0, 0, 0)); fz = 1.6
    def ff(t):
        sh = 8 * math.sin(t * 40) * ss((t - 1.8) / .3) * (1 - ss((t - 3.0) / .2)); s = (1 - ss((t - 3.0) / .25)) * (1 + .15 * ss((t - 2.0) / 1.0))
        return {'loc': (0, 0, fz + .25 * math.sin(2 * PI * t / 2.5)), 'rot': (0, sh, 0), 'scale': max(.001, s)}
    drive(fr, ff, S)
    rn = random.Random(3)
    for i in range(30):
        t0 = 2.95 + rn.uniform(0, .3); vx = rn.uniform(-2.4, 2.4); vz = rn.uniform(.5, 3.2); r = rn.uniform(.1, .22)
        o = sphere(r, jm, seg=10); p0 = (0, fz + 1.3); pm = (vx, p0[1] + vz); pe = (rn.uniform(-.7, .7), -.3)
        def f(t, t0=t0, p0=p0, pm=pm, pe=pe):
            u = (t - t0) / 1.5
            if u < 0 or u > 1: return {'scale': .001, 'loc': (0, 0, 9)}
            a = (1 - u) ** 2; b = 2 * (1 - u) * u; c = u * u
            return {'scale': 1, 'loc': (a * p0[0] + b * pm[0] + c * pe[0], -.3, a * p0[1] + b * pm[1] + c * pe[1])}
        drive(o, f, S)
    st = cyl(.08, 4.6, M('#f43f5e', .3), loc=(.5, 0, 4.4 - 4.4 + 2.4), rot=(0, 10, 0), seg=10); st.parent = gl
    drive(st, lambda t: {'scale': max(.001, ss((t - 6.5) / .4)), 'loc': (.5, 0, 2.4)}, S, step=2)
    sl = put(S, P['fruit'], 1.0, rz=-10, loc=(1.6, 0, 3.8)); sl.parent = gl; sl.location = (1.4, 0, 4.0)
    drive(sl, lambda t: {'scale': max(.001, ss((t - 7.0) / .4)) , 'loc': (1.4, 0, 4.0)}, S, step=2)
    rising(S, 8, (-1.0, 1.0), -3.6, 2.8, 2.0, lambda i: sphere(.09, amat('#ffffff', .5), loc=(0, -.4, 0), seg=8), seed=2, t0=4.0)
    label(S, P.get('t1', 'Vers sap!'), z=4.7, start=3); bokeh(S, 8, ('#ffffff',), seed=11)

# ---------------- snoeppot ----------------
def t_jar(S, P):
    jr = rig((0, 0, 0)); cols = P['cols']; rn = random.Random(P.get('seed', 3))
    ztop = -4.0; zb = -4.3
    cyl(2.0, .2, M('#ffffff', .2, 0, .5), loc=(0, 0, zb), seg=32).parent = jr
    cyl(2.0, 5.4, amat('#e0f2fe', .14, .05), loc=(0, -.2, zb + 2.7), seg=40).parent = jr
    cnt = 0; layers = 8; per = [5, 5]
    jobs = []
    for k in range(layers):
        for i in range(5):
            for d in range(2):
                x = -1.5 + i * .75 + (.37 if (k % 2) else 0) - (.0); x = max(-1.55, min(1.55, x)); y = -.3 + d * .6
                z = zb + .28 + .45 + k * .6; jobs.append((k, x, y, z))
    n = len(jobs)
    for idx, (k, x, y, z) in enumerate(jobs):
        c = rn.choice(cols); r = rig((x, y, z)); r.parent = jr
        sphere(.37, M(c, .2, 0, .8), seg=14).parent = r
        if rn.random() < .35: torus(.37, .045, M('#ffffff', .3), rot=(rn.uniform(0, 90), 0, 0), seg=24, minor=6).parent = r
        tl = .8 + idx * (7.0 / n)
        fn = drop_seq(S, r, tl, z, zfrom=7.5, dur=.35, bounce=.12)
        def f(t, fn=fn, x=x, y=y): d = fn(t); d['loc'] = (x, y, d['loc'][2]); return d
        drive(r, f, S, step=1)
    lid = rig((0, 0, 1.4)); lid.parent = jr
    cyl(2.1, .35, M(P.get('lid', '#ef4444'), .3, 0, .5), loc=(0, 0, 0), seg=32, bevel=.04).parent = lid; sphere(.35, M(P.get('lid', '#ef4444'), .3, 0, .5), loc=(0, 0, .35), seg=14).parent = lid
    zl = zb + 5.5 + .2; lid.location = (0, 0, zl); drive(lid, drop_seq(S, lid, 8.0, zl, zfrom=9, dur=.4, bounce=.25), S)
    drive(jr, lambda t: {'rot': (0, 3 * math.sin(2 * PI * t / 3) * ss((t - 8.2)), 0)}, S, step=3)
    label(S, P.get('t1', 'Snoeppot vullen'), z=4.7, start=3); bokeh(S, 10, ('#ffffff', '#fde047', '#f9a8d4'), seed=12)

for _k, _v in list(globals().items()):
    if _k.startswith('t_'): L.TEMPLATES[_k[2:]] = _v
