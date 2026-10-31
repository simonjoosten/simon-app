"""Sjablonen satisfying deel 1: domino, trappenbal, tandwielen, newton-wieg, golfrooster."""
from shorts_a_lib import *

N = 240

# ============ DOMINO ============
def _resample(pts, sp):
    out = []; acc = 0.; nxt = 0.
    for a, b in zip(pts, pts[1:]):
        d = math.hypot(b[0] - a[0], b[1] - a[1])
        while nxt <= acc + d:
            t = (nxt - acc) / d if d else 0
            out.append((lerp(a[0], b[0], t), lerp(a[1], b[1], t), math.atan2(b[1] - a[1], b[0] - a[0]))); nxt += sp
        acc += d
    return out

def _path(kind):
    P = []
    if kind == 'serp':
        R = 6; ys = [-4.3 + k * 1.65 for k in range(R)]; w = 1.5
        for k, y in enumerate(ys):
            xs = (-w, w) if k % 2 == 0 else (w, -w)
            P += [(xs[0], y), (xs[1], y)]
            if k < R - 1:
                sgn = 1 if k % 2 == 0 else -1
                for j in range(1, 13):
                    a = math.pi * j / 12; P.append((sgn * w + sgn * 0.825 * math.sin(a), y + 0.825 - 0.825 * math.cos(a)))
    elif kind == 'spiral':
        for i in range(0, 1200):
            t = i / 1200 * 6 * math.pi; r = 3.0 - 2.6 * i / 1200
            P.append((r * math.cos(t), r * math.sin(t) - .2))
    elif kind == 'wave':
        for i in range(0, 400):
            y = -6.3 + 11.8 * i / 400; P.append((2.1 * math.sin(y * 1.1) * (1 if True else 1), y))
    elif kind == 'zig':
        pts = [(-2.2, -6), (2.2, -4.2), (-2.2, -2.4), (2.2, -0.6), (-2.2, 1.2), (2.2, 3.0), (-2.2, 4.8)]
        # afgeronde hoeken
        for a, b in zip(pts, pts[1:]):
            for j in range(0, 20): P.append((lerp(a[0], b[0], j / 20), lerp(a[1], b[1], j / 20)))
    return P

def domino(S, name, kind='serp', hue=0., span=.85, sat=.7, floor='#1e293b', spacing=.46, lean=True):
    cam_look(S, 0, 42, (0, -.3, 0)); S.floor(floor, z=0)
    P = _resample(_path(kind), spacing); n = len(P)
    d = max(1.6, (N - 62) / n)
    h = .88
    # Bal die de eerste domino aanstoot
    x0, y0, a0 = P[0]
    ball = sphere(.32, M('#fbbf24', .25, metal=.4), seg=16)
    bx, by = x0 - math.cos(a0) * .7, y0 - math.sin(a0) * .7
    ser = drop_series(3.5, .32, 1, 14, e=.3)
    for f in range(1, 14): K(ball, f, loc=(bx, by, ser[f]))
    for f in range(14, 40): K(ball, f, loc=(bx + math.cos(a0) * (f - 13) * .08, by + math.sin(a0) * (f - 13) * .08, .32))
    K(ball, 41, scl=1); K(ball, 50, scl=.001)
    t0 = 14
    for i, (x, y, a) in enumerate(P):
        c = rgb(hue + span * i / n, sat, .95)
        o = base_cube((.5, .1, h), M(c, .3, coat=.4), (x, y, 0), bevel=.02)
        yaw = math.degrees(a) - 90
        ti = t0 + i * d
        fr = sorted(set([1, max(1, int(ti) - 1)] + list(range(int(ti), int(ti) + 13)) + [N]))
        for f in fr:
            ang = 78 * (clamp((f - ti) / 11.) ** 1.7)
            o.rotation_euler = (math.radians(-ang), 0, math.radians(yaw)); o.keyframe_insert('rotation_euler', frame=f)
    title(S, name, '#ffffff')

# ============ TRAPPENBAL ============
def stairs(S, name, n=7, hue=0., span=.8, bg_floor=None, ballc='#fde047', hop=1.1, flat=False):
    cam_look(S, 0, 90, (0, 0, 0))
    hops = 2 * (n - 1); T = N // hops
    zs = [3.2 - i * (6.6 / (n - 1)) for i in range(n)]
    xs = [(-1.5 if i % 2 == 0 else 1.5) for i in range(n)]
    plats = []
    for i in range(n):
        c = rgb(hue + span * i / n, .75, .95)
        base_cube((.5, .3, 6 + zs[i]), M(mix(c, '#000000', .55), .5), (xs[i], .6, -6.2), bevel=.02)
        p = base_cube((1.7, .9, .28), M(c, .3, coat=.3), (xs[i], 0, zs[i] - .28)); plats.append((p, c))
    # blok-achtergrond: smalle staafjes tussen de platforms
    ball = sphere(.3, M(ballc, .2, metal=.3, emit=.15), seg=24)
    seq = list(range(n)) + list(range(n - 2, 0, -1)); seq = seq + [0]
    rings = {}
    for h in range(hops):
        i0, i1 = seq[h], seq[h + 1]
        for k in range(T):
            f = 1 + h * T + k
            u = k / T
            x = lerp(xs[i0], xs[i1], u); z = lerp(zs[i0], zs[i1], u) + .3 + 4 * hop * u * (1 - u)
            # squash bij landing/start
            sq = 1.0; sx = 1.0
            if k <= 1: sq, sx = .72 + .14 * k, 1.18 - .09 * k
            K(ball, f, loc=(x, 0, z), scl=(sx, sx, sq))
        # landing op i1
        fl = 1 + (h + 1) * T
        p, c = plats[i1]
        if fl <= N + 4:
            ring = torus(.4, .035, M(c, .3, emit=1.0), (xs[i1], -.1, zs[i1] + .02), rot=(90, 0, 0), seg=40, minor=8)
            K(ring, max(1, fl - 1), scl=.001); K(ring, fl, scl=.4); K(ring, fl + 10, scl=1.9); K(ring, fl + 11, scl=.001)
            K(p, max(1, fl - 2), loc=(xs[i1], 0, zs[i1] - .28)); K(p, fl, loc=(xs[i1], 0, zs[i1] - .28 - .1)); K(p, fl + 6, loc=(xs[i1], 0, zs[i1] - .28))
    # laatste frame sluiten op begin
    K(ball, N, loc=(xs[0], 0, zs[0] + .3), scl=1)
    title(S, name)

# ============ TANDWIELEN ============
def gear_obj(n, r, m_body, m_plate, m_hole, depth=.35):
    r0 = r - .095 * r / (n * .08) * 1.0; r1 = r + .07 * 1.0 * r / (n * .08)
    # tandhoogte evenredig met module (r = n*mod/2)
    mod = r / (n * .5); r0 = r - 1.15 * mod * .5; r1 = r + .9 * mod * .5
    d = 2 * math.pi / n; pts = []
    for k in range(n):
        a = k * d
        for da, rr in ((-.30, r0), (-.17, r1), (.17, r1), (.30, r0), (.5, r0 * .995)):
            aa = a + da * d; pts.append((rr * math.cos(aa), rr * math.sin(aa)))
    g = extrude_poly(pts, depth, m_body, bevel=.025 * r)
    plate = cyl(r0 - .18 * r, .06, m_plate, (0, -.02, 0), rot=(90, 0, 0), seg=48); plate.parent = g; plate.location = (0, -.015, 0)
    plate.rotation_euler = (math.radians(90), 0, 0)
    hub = cyl(.22 * r, depth + .14, m_hole, (0, 0, 0), rot=(90, 0, 0), seg=24); hub.parent = g; hub.location = (0, depth / 2, 0)
    nh = 5 if r > .7 else 3
    for j in range(nh):
        a = 2 * math.pi * j / nh
        hh = cyl(.12 * r, .08, m_hole, (0, 0, 0), rot=(90, 0, 0), seg=16); hh.parent = g
        hh.location = (.58 * r * math.cos(a), -.045, .58 * r * math.sin(a))
    return g

def gears(S, name, teeth=(12, 16, 12, 20, 14, 18), hue=.55, span=.9, turns=2, sat=.65, metal=False):
    cam_look(S, 0, 90, (0, 0, 0))
    ph = [-38, -142]; mod = .16
    rs = [t * mod / 2 for t in teeth]
    pos = [(0., 0.)]; phis = []
    for i in range(1, len(teeth)):
        a = math.radians(ph[(i - 1) % 2]); dd = rs[i] + rs[i - 1]
        x, z = pos[-1]; pos.append((x + dd * math.cos(a), z + dd * math.sin(a))); phis.append(a)
    xs = [p[0] for p in pos]; zs = [p[1] for p in pos]
    wx = max(x + r for x, r in zip(xs, rs)) - min(x - r for x, r in zip(xs, rs)); hz = max(z + r for z, r in zip(zs, rs)) - min(z - r for z, r in zip(zs, rs))
    s = min(5.5 / wx, 8.0 / hz, 1.5)
    cx = (max(x + r for x, r in zip(xs, rs)) + min(x - r for x, r in zip(xs, rs))) / 2; cz = (max(z + r for z, r in zip(zs, rs)) + min(z - r for z, r in zip(zs, rs))) / 2 + .3
    objs = []
    for i, t in enumerate(teeth):
        c = rgb(hue + span * i / len(teeth), sat, .92)
        g = gear_obj(t, rs[i] * s, M(c, .25, metal=.5 if metal else .1, coat=.3), M(mix(c, '#000000', .25), .3, metal=.3), M('#1e293b', .5))
        g.location = ((pos[i][0] - cx) * s, 0, (pos[i][1] - cz) * s); objs.append(g)
    # animatie
    th0 = math.radians(7)
    for f in range(1, N + 1):
        t = f - 1
        th = [0.] * len(teeth); th[0] = th0 + 2 * math.pi * turns * t / N
        for i in range(1, len(teeth)):
            phi = phis[i - 1]; dP = 2 * math.pi / teeth[i - 1]; dC = 2 * math.pi / teeth[i]
            th[i] = phi + math.pi - dC * (.5 - (phi - th[i - 1]) / dP)
        for i, g in enumerate(objs):
            g.rotation_euler = (0, -th[i], 0); g.keyframe_insert('rotation_euler', frame=f)
    title(S, name)

# ============ NEWTON-WIEG ============
def newton(S, name, n=5, k=1, T=80, hue=.0, span=.8, A=22, wood='#92400e', metal=True, rnd_col=False):
    cam_look(S, -16, 84, (0, .2, .9), 11.2)
    L = 3.7; top = 3.3; R = .4
    wm = M(wood, .5, coat=.2); bm = M('#e2e8f0', .15, metal=.9)
    base = base_cube((n * .82 + 1.4, 2.2, .35), wm, (0, 0, -2.7)); base.location = (0, 0, -2.7)
    for sx in (-1, 1):
        p = cyl(.09, top + 2.7, bm, (sx * (n * .41 + .35), .6, (top - 2.35) / 2), seg=16); p2 = cyl(.09, top + 2.7, bm, (sx * (n * .41 + .35), -.6, (top - 2.35) / 2), seg=16)
    cyl(.09, 1.2, bm, (-(n * .41 + .35), 0, top), rot=(90, 0, 0), seg=16)
    cyl(.09, 1.2, bm, ((n * .41 + .35), 0, top), rot=(90, 0, 0), seg=16)
    for sy in (-.6, .6):
        cyl(.09, n * .82 + .9, bm, (0, sy, top), rot=(0, 90, 0), seg=16)
    sm = M('#cbd5e1', .3, metal=.5)
    piv = []
    for i in range(n):
        x = (i - (n - 1) / 2) * .82
        c = rgb(hue + span * i / max(1, n - 1), .6, .95)
        P = empty((x, 0, top))
        b = sphere(R, M(c, .12, metal=.85, coat=.5), (0, 0, -L), seg=32); b.parent = P
        for sy in (-.6, .6):
            l = link((0, sy, 0), (0, 0, -L + R * .9), .022, sm, seg=6); l.parent = P
            set_link(l, (0, sy, 0), (0, 0, -L + R * .9))
        piv.append(P)
    for f in range(1, N + 1):
        ph = 2 * math.pi * (f - 1) / T
        c_ = math.cos(ph)
        for i, P in enumerate(piv):
            ang = 0.
            if i < k: ang = A * max(0., c_)
            if i >= n - k: ang = -A * max(0., -c_)
            P.rotation_euler = (0, math.radians(ang), 0); P.keyframe_insert('rotation_euler', frame=f)
    title(S, name)

# ============ GOLFROOSTER ============
def wavegrid(S, name, mode='radial', cols=9, rows=12, sp=.62, hue=.55, span=.6, amp=1.9, k=2, base=.25, sat=.7, floor='#0f172a', kind='cube'):
    cam_look(S, 0, 60, (0, -.2, 0)); S.floor(floor, z=-.001)
    objs = []
    for i in range(cols):
        for j in range(rows):
            x = (i - (cols - 1) / 2) * sp; y = (j - (rows - 1) / 2) * sp
            r = math.hypot(x, y); ang = math.atan2(y, x)
            if mode == 'radial': ph = r * 1.5; hu = hue + span * (r / 5.5)
            elif mode == 'diag': ph = (x + y) * 1.2; hu = hue + span * ((x + y) / 10 + .5)
            elif mode == 'rows': ph = y * 1.4; hu = hue + span * ((y + 5) / 10)
            elif mode == 'spiral': ph = ang * 2 + r * .9; hu = hue + span * ((ang / math.pi + 1) / 2)
            elif mode == 'two':
                r1 = math.hypot(x - 1.8, y - 3.5); r2 = math.hypot(x + 1.8, y + 3.5)
                ph = (r1 + r2) * 1.1 - 0; hu = hue + span * min(1, (r1 + r2) / 12)
            elif mode == 'checker':
                ph = (i + j) * 1.0 * math.pi * 0.5 + (math.pi if (i + j) % 2 else 0); hu = hue + span * (((i + j) % 2) * .5 + j / rows * .5)
            else: ph = x * 1.6 + y * .4; hu = hue + span * (x / 6 + .5)
            c = rgb(hu, sat, .96)
            if kind == 'cyl': o = cyl(sp * .42, 1, M(c, .3, coat=.3), (x, y, 0), seg=20, bevel=.02); o.data.transform(Matrix.Translation((0, 0, .5)))
            else: o = base_cube((sp * .84, sp * .84, 1), M(c, .3, coat=.3), (x, y, 0), bevel=.03)
            objs.append((o, ph))
    for f in range(1, N + 1, 2):
        w = 2 * math.pi * k * (f - 1) / N
        for o, ph in objs:
            hgt = base + amp * (.5 + .5 * math.sin(ph - w)) ** 1.0
            o.scale = (1, 1, hgt); o.keyframe_insert('scale', frame=f)
    title(S, name)

TPL = {'domino': domino, 'stairs': stairs, 'gears': gears, 'newton': newton, 'wavegrid': wavegrid}
