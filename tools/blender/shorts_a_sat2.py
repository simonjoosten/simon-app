"""Sjablonen satisfying deel 2."""
from shorts_a_lib import *
N = 240

def _emit(o, series, x, y, f0, zstart):
    K(o, 1, loc=(x, y, zstart)); K(o, max(1, f0), loc=(x, y, zstart))
    last = None; same = 0
    for f in sorted(series):
        if f < f0: continue
        z = series[f]; K(o, f, loc=(x, y, z))
        if last is not None and abs(z - last) < 1e-4:
            same += 1
            if same > 2: break
        else: same = 0
        last = z

def _shape(kind, m, r, loc=(0, 0, 0)):
    if kind == 'cube': return cube((r * 1.7,) * 3, m, loc, bevel=.04)
    if kind == 'cone': return cone(r * 1.1, 0, r * 2.2, m, loc, seg=20)
    if kind == 'ico': return ico(r * 1.15, m, loc, sub=2)
    return sphere(r, m, loc, seg=20)

# ===== bakjes / pot vullen =====
def bins(S, name, nb=4, per=8, hue=0., span=.75, shape='ball', seed=1, mode='bins', floor='#111827'):
    cam_look(S, 0, 90); rnd = random.Random(seed)
    items = []
    if mode == 'bins':
        bw = 1.3; sp = 1.42; r = .27; zb = -4.6
        for b in range(nb):
            bx = (b - (nb - 1) / 2) * sp; c = rgb(hue + span * b / nb, .75, .95)
            wm = M(mix(c, '#ffffff', .1), .15, coat=.5)
            base_cube((bw + .1, .8, .14), wm, (bx, 0, zb - .14))
            for sx in (-1, 1): base_cube((.07, .8, 3.7), M(mix(c, '#000000', .1), .2, coat=.5), (bx + sx * (bw / 2 + .03), 0, zb - .14), bevel=.02)
            base_cube((bw, .06, 3.7), M(mix(c, '#000000', .6), .5), (bx, .45, zb - .14), bevel=0)
        order = [b for b in range(nb) for _ in range(per)]; rnd.shuffle(order); cnt = [0] * nb
        for b in order:
            k = cnt[b]; cnt[b] += 1; row = k // 3 * 2 + (0 if k % 3 < 2 else 1)
            sl = k % 3
            if sl < 2: dx = (-.29, .29)[sl]; z = zb + r + row // 2 * .98
            else: dx = 0; z = zb + r + (row // 2) * .98 + .49
            bx = (b - (nb - 1) / 2) * sp; c = rgb(hue + span * b / nb, .8, 1.)
            kind = shape if shape != 'mix' else ('ball', 'cube', 'cone', 'ico')[b % 4]
            items.append((bx + dx, z, c, kind, r))
        zs0 = 3.6
    else:  # pot met lagen
        cols = 8; r = .27; pw = cols * 2 * r + .2; zb = -4.6; rows = per
        base_cube((pw + .1, .8, .12), M('#cbd5e1', .2, coat=.5), (0, 0, zb - .12))
        for sx in (-1, 1): base_cube((.07, .8, rows * .47 + .6), M('#e2e8f0', .15, coat=.6), (sx * (pw / 2 + .03), 0, zb - .12), bevel=.02)
        base_cube((pw, .06, rows * .47 + .5), M('#334155', .5), (0, .45, zb - .12), bevel=0)
        for row in range(rows):
            nc = cols if row % 2 == 0 else cols - 1
            xs = [(i - (nc - 1) / 2) * 2 * r * 1.0 for i in range(nc)]; rnd.shuffle(xs)
            for x in xs: items.append((x, zb + r + row * .47, rgb(hue + span * row / rows, .8, 1.), shape if shape != 'mix' else 'ball', r))
        zs0 = 3.6
    n = len(items); d = max(1.2, (N - 62) / n)
    for i, (x, z, c, kind, r) in enumerate(items):
        o = _shape(kind, M(c, .15, coat=.6), r)
        f0 = 6 + int(i * d); ser = drop_series(zs0, z, f0, N, e=.32, g=22.)
        _emit(o, ser, x, 0, f0, zs0 + 3)
        appear(o, f0, 4, 1)
        if kind in ('cube', 'cone', 'ico'):
            K(o, f0, rot=(0, 0, rnd.uniform(0, 90))) if False else None
    title(S, name)

# ===== sorteren =====
def sortbars(S, name, n=10, hue=0., span=.8, seed=3, floor='#0f172a', lo=1.3, hi=4.8):
    cam_look(S, 0, 90, (0, 0, 0))
    rnd = random.Random(seed)
    while True:
        perm = list(range(n)); rnd.shuffle(perm)
        # bubble sort swaps
        a = perm[:]; sw = []
        ch = True
        while ch:
            ch = False
            for i in range(n - 1):
                if a[i] > a[i + 1]: a[i], a[i + 1] = a[i + 1], a[i]; sw.append(i); ch = True
        if 16 <= len(sw) <= 26: break
    D = max(5, min(9, int((N - 70) / len(sw))))
    pitch = .58; zb = -4.6; bars = {}
    for v in range(n):
        h = lo + (hi - lo) * v / (n - 1); c = rgb(hue + span * v / (n - 1), .75, .95)
        bars[v] = (base_cube((.5, .5, h), M(c, .25, coat=.5), (0, 0, zb)), h)
    slot = perm[:]  # slot -> value
    def xp(s): return (s - (n - 1) / 2) * pitch
    for v in range(n): K(bars[v][0], 1, loc=(xp(slot.index(v)), 0, zb), scl=1)
    f = 14
    for i in sw:
        va, vb = slot[i], slot[i + 1]; oa, ob = bars[va][0], bars[vb][0]
        for o, v, s0, s1, sg in ((oa, va, i, i + 1, 1), (ob, vb, i + 1, i, -1)):
            K(o, f, loc=(xp(s0), 0, zb)); K(o, f + D // 2, loc=((xp(s0) + xp(s1)) / 2, -.55 * sg, zb + .25)); K(o, f + D, loc=(xp(s1), 0, zb))
        slot[i], slot[i + 1] = vb, va; f += D
    # klaar: golf
    for v in range(n):
        o, h = bars[v]; s = slot.index(v)
        for k in range(0, 3):
            ff = f + 6 + s * 2 + k * 3
            if ff > N: break
            K(o, ff, scl=(1, 1, 1 if k != 1 else 1.12))
        K(o, N, scl=1)
    title(S, name)

# ===== pixelpatroon laten vallen =====
def _heart(u, v):
    x = u * 1.25; y = v * 1.2 + .12; return 'a' if (x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0 else None
def _star(u, v):
    r = math.hypot(u, v); t = math.degrees(math.atan2(v, u)) - 90 + 18
    dd = abs(((t) % 72) - 36) / 36; return 'a' if r <= .38 + .66 * (1 - dd) ** 1.0 * .98 + 0 and r <= .42 + .62 * dd else None
def _smiley(u, v):
    r = math.hypot(u, v)
    if r > 1: return None
    if math.hypot(u - .38, v - .3) < .17 or math.hypot(u + .38, v - .3) < .17: return 'b'
    if .55 < math.hypot(u, v + .05) < .78 and v < -.15: return 'b'
    return 'a'
def _flower(u, v):
    r = math.hypot(u, v); t = math.atan2(v, u)
    if r < .24: return 'b'
    return 'a' if r <= .45 + .55 * abs(math.cos(2.5 * t)) ** .8 * .98 and r < 1 else None
def _target(u, v):
    r = math.hypot(u, v)
    if r > 1: return None
    return 'a' if int(r * 5) % 2 == 0 else 'b'
def _diamond(u, v):
    return None if abs(u) + abs(v) > 1.05 else ('a' if (abs(u) + abs(v)) < .5 else 'b')
def _house(u, v):
    if v < .1 and abs(u) < .75 and v > -.95:
        return 'b' if (abs(u) < .22 and v < -.25) else 'a'
    if v >= .1 and v < .95 and abs(u) < (.95 - v) * 1.0 + .0: return 'c'
    return None
def _tree(u, v):
    if v < -.6: return 'b' if abs(u) < .16 else None
    if v >= -.6:
        for (cy, w) in ((-.45, .8), (0., .62), (.45, .42)):
            if v >= cy - .1 and v <= cy + .5 and abs(u) < w * (1 - (v - (cy - .1)) / .6) + .12: return 'a'
    return None
def _spiral(u, v):
    r = math.hypot(u, v); t = math.atan2(v, u)
    if r > 1: return None
    return 'a' if ((t / (2 * math.pi) + r * 2.5) % 1) < .5 else 'b'
def _rocket(u, v):
    if abs(u) < .3 and -.7 < v < .5: return 'a'
    if abs(u) < .3 * (1 - (v - .5) / .5) and .5 <= v < 1: return 'c'
    if -.75 < v < -.2 and .3 <= abs(u) < .3 + (-.2 - v) * .9 and abs(u) < .75: return 'c'
    if abs(u) < .3 and v < -.7 and v > -.95: return 'b'
    if abs(u) < .12 and .1 < v < .35: return 'b'
    return None
SHAPES = dict(heart=(_heart, dict(a='#ef4444')), star=(_star, dict(a='#facc15')), smiley=(_smiley, dict(a='#facc15', b='#1f2937')),
    flower=(_flower, dict(a='#f472b6', b='#fde047')), target=(_target, dict(a='#ef4444', b='#f8fafc')), diamond=(_diamond, dict(a='#38bdf8', b='#1d4ed8')),
    house=(_house, dict(a='#fbbf24', b='#78350f', c='#ef4444')), tree=(_tree, dict(a='#22c55e', b='#92400e')), spiral=(_spiral, dict(a='#a855f7', b='#22d3ee')),
    rocket=(_rocket, dict(a='#f1f5f9', b='#f97316', c='#ef4444')))

def patterndrop(S, name, shape='heart', pal=None, kind='ball', grad=False, cols=11, rows=11):
    cam_look(S, 0, 90, (0, -.3, 0)); fn, pl = SHAPES[shape]; pl = dict(pl); pl.update(pal or {})
    pitch = 5.7 / cols; r = pitch * .47; cells = []
    for j in range(rows):
        for i in range(cols):
            u = (i - (cols - 1) / 2) / (cols / 2); v = (j - (rows - 1) / 2) / (rows / 2)
            k = fn(u, v)
            if k: cells.append((i, j, k))
    n = len(cells); rnd = random.Random(5); d = (N - 90) / n
    objs = []
    cells.sort(key=lambda c: (c[1], rnd.random()))
    for idx, (i, j, k) in enumerate(cells):
        x = (i - (cols - 1) / 2) * pitch; z = (j - (rows - 1) / 2) * pitch - .5
        c = pl[k]
        if grad: c = mix(c, '#ffffff', (j / rows) * .35)
        o = _shape(kind, M(c, .2, coat=.5), r)
        f0 = 4 + int(idx * d); ser = drop_series(6.3, z, f0, N, e=.34, g=24.)
        _emit(o, ser, x, 0, f0, 6.3); objs.append((o, x, z))
    for o, x, z in objs:
        for f in range(170, N + 1, 2):
            a = clamp((f - 170) / 20.); s = 1 + .16 * a * math.sin((f - 170) / 24 * 2 * math.pi - (x + z) * .9)
            K(o, f, scl=s)
    title(S, name)

# ===== slingergolf =====
def pendwave(S, name, n=14, c0=10, hue=0., span=.85, A=14, shape='ball', az=26, floor='#0f172a'):
    cam_look(S, az, 76, (0, 0, .2), 12); S.floor(floor, z=-4.3, size=90)
    top = 3.9; Lmax = 7.3; sp = .38; mb = M('#e2e8f0', .2, metal=.8)
    for sx in (-1, 1): cyl(.07, Lmax + .8, mb, (sx * (n * sp / 2 + .2), 0, top - (Lmax + .8) / 2 + .3), seg=12)
    cyl(.07, n * sp + .4, mb, (0, 0, top + .3), rot=(0, 90, 0), seg=12)
    cyl(.07, n * sp + .4, mb, (0, 0, top + .3), rot=(0, 90, 0), seg=12)
    for i in range(n):
        x = (i - (n - 1) / 2) * sp; L = Lmax * (c0 / (c0 + i)) ** 2
        c = rgb(hue + span * i / (n - 1), .8, 1.)
        P = empty((x, 0, top))
        b = _shape(shape, M(c, .12, coat=.7), .2, (0, 0, -L)); b.parent = P
        st = cyl(.012, L, M('#e2e8f0', .5), (0, 0, -L / 2), seg=6); st.parent = P
        for f in range(1, N + 1):
            P.rotation_euler = (math.radians(A * math.cos(2 * math.pi * (c0 + i) * (f - 1) / N)), 0, 0); P.keyframe_insert('rotation_euler', frame=f)
    title(S, name)

# ===== draaitoren =====
def twist(S, name, seg=4, n=16, D=9., hue=0., span=.8, counter=False, taper=0., r0=1.6, turns=1):
    cam_look(S, 0, 68, (0, 0, -.6)); S.floor('#111827', z=-4.0, size=90)
    plates = []
    for i in range(n):
        r = r0 * (1 - taper * i / n); c = rgb(hue + span * i / (n - 1), .75, .95)
        rot0 = 45 if seg == 4 else 0
        o = cyl(r, .3, M(c, .25, coat=.5), (0, 0, -3.8 + i * .34), seg=seg, bevel=.04); plates.append(o)
    for f in range(1, N + 1, 2):
        a = D * math.sin(2 * math.pi * turns * (f - 1) / N)
        for i, o in enumerate(plates):
            ang = i * a * (1 if not counter or i % 2 == 0 else -1) if not counter else (a * i * (1 if i % 2 == 0 else -1) * .5)
            o.rotation_euler = (0, 0, math.radians(ang + (45 if seg == 4 else 0))); o.keyframe_insert('rotation_euler', frame=f)
    title(S, name)

# ===== stuiterende rij / cirkel =====
def bouncewave(S, name, mode='row', P=30, hue=0., span=.85, n=12, rows=3, H=1.5, kind='ball'):
    objs = []
    if mode == 'row':
        cam_look(S, 0, 90, (0, 0, 0))
        for rw in range(rows):
            z0 = -3.9 + rw * 2.9
            base_cube((5.8, .8, .14), M('#e2e8f0', .3), (0, 0, z0 - .22))
            for i in range(n):
                x = (i - (n - 1) / 2) * (5.3 / (n - 1)); c = rgb(hue + span * i / n + rw * .08, .8, 1.)
                o = _shape(kind, M(c, .12, coat=.7), .22); objs.append((o, x, 0, z0, i / n * (1 if rw % 2 == 0 else -1), c))
    else:
        cam_look(S, 0, 52, (0, 0, 0)); S.floor('#111827', z=-.3, size=90)
        for rng, (R, m) in enumerate(((1.2, 8), (2.0, 14), (2.8, 20))):
            for i in range(m):
                a = 2 * math.pi * i / m; c = rgb(hue + span * i / m, .8, 1.)
                o = _shape(kind, M(c, .12, coat=.7), .2 + .02 * rng); objs.append((o, R * math.cos(a), R * math.sin(a), 0, (i / m) * (1 if rng % 2 == 0 else -1), c))
    for o, x, y, z0, ph, c in objs:
        for f in range(1, N + 1):
            u = ((f - 1) / P - ph * 1.0) % 1.0
            zz = 4 * H * u * (1 - u) + .22
            sq = 1.0; sx = 1.0
            if u < .07 or u > .93: sq = .78; sx = 1.12
            K(o, f, loc=(x, y, z0 + zz - (0 if sq == 1 else .04)), scl=(sx, sx, sq))
    title(S, name)

# ===== fyllotaxis =====
def phyllo(S, name, n=260, c=.18, hue=0., span=1.2, k=2, turns=1, sat=.75):
    cam_look(S, 0, 0, (0, -.3, 0)); 
    root = empty((0, 0, 0))
    ga = math.radians(137.508); objs = []
    for i in range(n):
        r = c * math.sqrt(i + .5); a = i * ga
        col = rgb(hue + span * i / n, sat, 1.)
        o = sphere(.14, M(col, .25, coat=.4, emit=.1), (r * math.cos(a), r * math.sin(a), 0), seg=10); o.parent = root; objs.append((o, r, a))
    for f in range(1, N + 1, 2):
        root.rotation_euler = (0, 0, math.radians(-360 * turns * (f - 1) / N)); root.keyframe_insert('rotation_euler', frame=f)
        for o, r, a in objs:
            s = .25 + .75 * (.5 + .5 * math.sin(r * 2.0 - 2 * math.pi * k * (f - 1) / N)); K(o, f, scl=s)
    title(S, name)

# ===== tegels omdraaien =====
def tileflip(S, name, cols=6, rows=10, hueA=0., hueB=.5, grad=.35, delay=2.2, floor='#0f172a'):
    cam_look(S, 0, 50, (0, -.2, 0)); S.floor(floor, z=-.2, size=90)
    pitch = .95
    for i in range(cols):
        for j in range(rows):
            x = (i - (cols - 1) / 2) * pitch; y = (j - (rows - 1) / 2) * pitch
            cA = rgb(hueA + grad * j / rows, .75, .95); cB = rgb(hueB + grad * j / rows, .75, .95)
            P = empty((x, y, .08))
            a = cube((.86, .86, .08), M(cA, .3, coat=.4), (0, 0, .04), bevel=.02); a.parent = P
            b = cube((.86, .86, .08), M(cB, .3, coat=.4), (0, 0, -.04), bevel=.02); b.parent = P
            dl = (i + j) * delay
            for f in range(1, N + 1, 2):
                ang = 0
                for t0 in (dl + 6, dl + 126):
                    ang += 180 * smooth((f - t0) / 22.)
                P.rotation_euler = (math.radians(ang), 0, 0); P.location = (x, y, .08 + .35 * abs(math.sin(math.radians(ang))))
                P.keyframe_insert('rotation_euler', frame=f); P.keyframe_insert('location', frame=f)
    title(S, name)

# ===== gyroscoop-ringen =====
def rings(S, name, n=7, hue=0., span=.85, turns=1, thick=.09, rmax=2.7, phi=24, bead=True):
    cam_look(S, 0, 90, (0, -.2, 0))
    sphere(.35, M('#ffffff', .3, emit=2.0), (0, 0, 0), seg=24)
    for i in range(n):
        R = .7 + (rmax - .7) * i / (n - 1); c = rgb(hue + span * i / n, .8, 1.)
        Pp = empty((0, 0, 0)); Pp.rotation_euler = (0, 0, math.radians(phi * i))
        E = empty((0, 0, 0)); E.parent = Pp
        t = torus(R, thick, M(c, .2, coat=.6, emit=.15), (0, 0, 0), seg=64, minor=10); t.parent = E
        if bead:
            b = sphere(thick * 2.2, M('#ffffff', .3, emit=2.0), (R, 0, 0), seg=12); b.parent = E
        sg = 1 if i % 2 == 0 else -1; tn = turns * (1 + (i % 2))
        for f in range(1, N + 1, 2):
            E.rotation_euler = (math.radians(sg * 360 * tn * (f - 1) / N), 0, 0); E.keyframe_insert('rotation_euler', frame=f)
    title(S, name)

TPL = dict(bins=bins, sortbars=sortbars, patterndrop=patterndrop, pendwave=pendwave, twist=twist, bouncewave=bouncewave, phyllo=phyllo, tileflip=tileflip, rings=rings)
