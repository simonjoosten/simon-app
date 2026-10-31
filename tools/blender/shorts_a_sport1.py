"""Sjablonen sport deel 1: basketbal, penalty, bowlen."""
from shorts_a_lib import *
N = 240

def ball_bball(c='#f97316', r=.38):
    o = sphere(r, M(c, .5, coat=.2), seg=24)
    ln = M('#431407', .6)
    for rot in ((90, 0, 0), (0, 90, 0), (0, 0, 0)):
        t = torus(r * .995, .012, ln, (0, 0, 0), rot=rot, seg=40, minor=6); t.parent = o
    return o

def flight(p0, p1, apex, T, f):
    a = apex - p0[2]; b = apex - p1[2]; g = 2 * ((math.sqrt(a) + math.sqrt(b)) / T) ** 2; vz = math.sqrt(2 * g * a); t = f
    return (lerp(p0[0], p1[0], t / T), 0, p0[2] + vz * t - .5 * g * t * t), (g, vz)

# ============ BASKETBAL ============
def hoop(S, name, shots=((-2.4, -2.0, 3.8, '+2'), (-2.7, -3.6, 4.4, '+3'), (-1.4, -2.9, 3.4, '+2'), (-2.6, -.6, 3.9, '+2')), ballc='#f97316', court='#9a3412', T=34, bgfloor=True):
    cam_look(S, 0, 90, (0, 0, 0))
    fz = -4.5
    base_cube((9, 3, .4), M(court, .5, coat=.3), (0, 0, fz - .4))
    hx = 1.45; hz = .5; rr = .5
    cyl(.1, 5.2, M('#475569', .4, metal=.6), (3.0, 0, fz + 2.6), seg=12)
    base_cube((.9, .15, .15), M('#475569', .4, metal=.6), (2.55, 0, hz - .05))
    base_cube((.12, .3, 1.9), M('#f8fafc', .2, coat=.8), (2.1, 0, hz - .4))
    base_cube((.14, .2, .8), M('#ef4444', .3), (2.04, 0, hz - .2), bevel=0)
    torus(rr, .045, M('#ea580c', .3, metal=.3), (hx + .1, 0, hz), seg=40, minor=8)
    net = empty((hx + .1, 0, hz))
    for i in range(10):
        a = 2 * math.pi * i / 10; b = a + .5
        l = link((rr * math.cos(a), rr * math.sin(a), 0), (.3 * math.cos(b), .3 * math.sin(b), -.65), .012, M('#f8fafc', .5), 4); l.parent = net
    torus(.3, .012, M('#f8fafc', .5), (0, 0, -.65), seg=24, minor=4).parent = net
    appear(label(S, '', (0, 0, 0)), 1) if False else None
    n = len(shots); Tc = N // n
    r = .38
    for k, (x0, z0, ap, lab) in enumerate(shots):
        c0 = 1 + k * Tc
        o = ball_bball(ballc, r); fs = c0 + 6
        p0 = (x0, 0, z0); p1 = (hx + .1, 0, hz + .15)
        K(o, 1, loc=(x0, 0, z0), scl=.001)
        appear(o, c0 + 2, 5, 1)
        for f in range(fs - 3, fs + 1): K(o, f, loc=p0)
        # worp
        for fr in range(0, T + 1):
            (pos, (g, vz)) = flight(p0, p1, ap, T, fr)
            K(o, fs + fr, loc=pos, rot=(0, -fr * 14, 0))
        # val door het net, stuiter op de grond
        vend = vz - g * T; ser = drop_series(p1[2], fz + r, 1, Tc * 2, e=.5, g=24., vz0=vend * 24 * .6)
        fi = fs + T
        for j in range(1, Tc - 6):
            f = fi + j
            if f > N: break
            if f - fi >= 0:
                K(o, f, loc=(p1[0] - .0 - .02 * j if j > 3 else p1[0], 0, ser.get(1 + j, fz + r)), rot=(0, -T * 14 - j * 8, 0))
        if k < n - 1: vanish(o, c0 + Tc - 3, 4, 1)
        # net pulse + label
        K(net, max(1, fi - 2), scl=(1, 1, 1)); K(net, fi + 2, scl=(1.18, 1.18, .78)); K(net, fi + 7, scl=(.9, .9, 1.15)); K(net, fi + 12, scl=(1, 1, 1))
        label(S, lab, (-.5, 0, 2.5), size=1.1, color='#fde047', start=fi, end=fi + 24)
    title(S, name)

# ============ PENALTY ============
def keeper(col='#f97316'):
    G = empty((0, 0, 0)); sk = M('#fcd9b6', .5); jm = M(col, .5); sh = M('#1f2937', .5); gl = M('#facc15', .4)
    cyl(.28, .85, jm, (0, 0, 1.0), seg=16).parent = G
    sphere(.22, sk, (0, 0, 1.7), seg=16).parent = G
    cyl(.28, .3, sh, (0, 0, .5), seg=16).parent = G
    for sx in (-.14, .14): cyl(.1, .5, sk, (sx, 0, .2), seg=10).parent = G
    for sx in (-1, 1):
        ar = empty((sx * .3, 0, 1.4)); ar.parent = G
        cyl(.08, .7, jm, (sx * .2, 0, .3), rot=(0, sx * 30, 0), seg=10).parent = ar
        sphere(.13, gl, (sx * .4, 0, .62), seg=10).parent = ar
    return G

def penalty(S, name, shots=((-1.7, 2.1, 1), (1.9, .5, -1), (0, 2.2, -1)), shirt='#f97316', ballc='#f8fafc', grass=('#15803d', '#16a34a')):
    cam_look(S, 0, 90, (0, 0, 0))
    base_cube((10, 3, 4.6), M(grass[0], .7), (0, 2, -5.4))
    for i in range(4): base_cube((10, 2.5, .5), M(grass[1], .7), (0, 1.0, -5.3 + i * 1.0 + .1))
    pm = M('#f8fafc', .25, coat=.5); gz0 = -.2; gh = 2.7; gw = 2.5
    for sx in (-1, 1):
        cyl(.1, gh + .1, pm, (sx * gw, .6, gz0 + gh / 2), seg=14)
    cyl(.1, gw * 2 + .1, pm, (0, .6, gz0 + gh), rot=(0, 90, 0), seg=14)
    nm = M('#e2e8f0', .5)
    for i in range(0, 17): x = -gw + i * gw / 8; link((x, 1.2, gz0), (x, 1.2, gz0 + gh), .014, nm, 4)
    for j in range(0, 9): z = gz0 + j * gh / 8; link((-gw, 1.2, z), (gw, 1.2, z), .014, nm, 4)
    base_cube((gw * 2, .1, .12), M('#e2e8f0', .5), (0, .55, gz0 - .1), bevel=0)
    sphere(.16, M('#ffffff', .4, emit=.6), (0, .6, -3.8), scale=(1, 1, .5), seg=12)
    n = len(shots); Tc = N // n
    kp = keeper(shirt); kp.location = (0, .8, gz0 + .2); 
    cols = ['#ef4444', '#fde047', '#38bdf8', '#a855f7', '#22c55e', '#f472b6']
    for k, (tx, tz, kside) in enumerate(shots):
        c0 = 1 + k * Tc; fk = c0 + 14; T = 22; tz_ = gz0 + tz
        o = sphere(.38, M(ballc, .4, coat=.3), seg=24)
        ln = M('#111827', .5)
        for rot in ((90, 0, 0), (0, 90, 0)): torus(.375, .02, ln, (0, 0, 0), rot=rot, seg=24, minor=4).parent = o
        K(o, 1, loc=(0, -1.0, -3.4), scl=.001); appear(o, c0 + 2, 5, 1.25)
        K(o, fk, loc=(0, -1.0, -3.4), rot=(0, 0, 0), scl=1.25)
        for fr in range(1, T + 1):
            u = fr / T; e = u ** 1.4
            K(o, fk + fr, loc=(lerp(0, tx, e), -1.0 if u < 1 else .4, lerp(-3.4, tz_, e) + 0.5 * math.sin(math.pi * u)), rot=(fr * 20, 0, fr * 25), scl=lerp(1.25, .8, e))
        fi = fk + T
        for j in range(1, 20):
            K(o, fi + j, loc=(tx * (1 - .1 * j / 20) + 0, .4 + j * .02, max(gz0 + .38, tz_ - .02 * j * j * .6)), rot=(fk * 0 + T * 20 + j * 10, 0, 0), scl=.8)
        vanish(o, c0 + Tc - 4, 4, .8)
        # keeper
        K(kp, c0, loc=(0, .8, gz0 + .2), rot=(0, 0, 0)) if k > 0 else None
        K(kp, max(1, fk - 1), loc=(0, .8, gz0 + .2), rot=(0, 0, 0))
        kx = kside * 1.5; K(kp, fk + 14, loc=(kx, .8, gz0 + .2 + 1.0 * min(1, abs(tz) / 2)), rot=(0, kside * 70, 0))
        K(kp, fk + 34, loc=(kx, .8, gz0 + .2), rot=(0, kside * 85, 0)); K(kp, c0 + Tc - 2, loc=(0, .8, gz0 + .2), rot=(0, 0, 0))
        # confetti
        for q in range(14):
            ang = q / 14 * 2 * math.pi + k; cf = cube((.12, .12, .05), M(cols[q % 6], .4, emit=.4), (tx, .2, tz_), bevel=0)
            K(cf, 1, scl=.001); K(cf, fi, loc=(tx, .2, tz_), scl=.001); K(cf, fi + 1, loc=(tx, .2, tz_), scl=1)
            for j in range(2, 26, 2):
                K(cf, fi + j, loc=(tx + math.cos(ang) * j * .09, .2, tz_ + math.sin(ang) * j * .09 - .004 * j * j), rot=(j * 20, j * 30, 0), scl=1)
            K(cf, fi + 27, scl=.001)
        label(S, 'DOELPUNT!', (0, 0, -1.9), size=.95, color='#fde047', start=fi + 2, end=fi + 30)
    title(S, name)

# ============ BOWLEN ============
def pin_obj():
    G = empty((0, 0, 0))
    lathe([(0, 0), (.16, 0), (.19, .12), (.2, .3), (.15, .5), (.09, .7), (.1, .82), (.14, .93), (.14, 1.05), (0, 1.1)], M('#f8fafc', .25, coat=.6), seg=20).parent = G
    cyl(.108, .07, M('#ef4444', .4), (0, 0, .76), seg=18).parent = G
    return G

def bowling(S, name, sets=(None, None), ballc='#2563eb', curve=.5, lane='#b45309', throws=((0.05, 'STRIKE!'), (-0.1, 'STRIKE!')), seed=2):
    cam_look(S, 0, 55, (0, 4.5, 0)); rnd = random.Random(seed)
    base_cube((3.4, 24, .3), M(lane, .55, coat=.1), (0, 1, -.3))
    for sx in (-1, 1): base_cube((.45, 24, .15), M('#1f2937', .6), (sx * 1.9, 1, -.3)); base_cube((.08, 24, .1), M('#e5e7eb', .4), (sx * 1.7, 1, -.15), bevel=0)
    for i in range(7): base_cube((.1, .6, .01), M('#78350f', .6), (-1.0 + i * .33, -1.5, -.14), bevel=0) if False else None
    base_cube((3.4, 3, .6), M('#111827', .7), (0, 9.3, -.5))
    pins = []
    for row in range(4):
        for j in range(row + 1):
            x = (j - row / 2) * .62; y = 5.4 + row * .62; pins.append((x, y))
    P = []
    for i, (x, y) in enumerate(pins):
        g = pin_obj(); g.location = (x, y, 0); P.append(g)
    n = len(throws); Tc = N // n; ball_r = .42
    standing = set(range(10)); 
    for k, (xe, lab) in enumerate(throws):
        c0 = 1 + k * Tc; f0 = c0 + 6; T = 30
        b = sphere(ball_r, M(ballc, .1, coat=.9, metal=.2), seg=24)
        for dx, dy in ((.12, .1), (-.12, .1), (0, .22)):
            sphere(.06, M('#0f172a', .5), (dx * 1.0, -ball_r * .96, .1 * (1 if dy < .2 else 1) + dy * .0 + (.12 if dy > .2 else .0)), seg=8).parent = b
        K(b, 1, loc=(0, -5.0, ball_r), scl=.001); appear(b, c0 + 2, 4, 1)
        x0 = rnd.uniform(-.7, .7)
        hitf = {}
        for fr in range(0, T + 1):
            u = fr / T; y = lerp(-5.0, 5.0, u); x = lerp(x0, xe, u * u) + curve * math.sin(u * math.pi) * (-1 if x0 > 0 else 1) * 0
            K(b, f0 + fr, loc=(x, y, ball_r), rot=(-math.degrees(y / ball_r), 0, 0))
        for fr in range(1, 14): K(b, f0 + T + fr, loc=(lerp(xe, xe * 1.5, fr / 14), 5.0 + fr * .55, ball_r), rot=(-math.degrees((5.0 + fr * .55) / ball_r), 0, 0))
        vanish(b, f0 + T + 14, 3, 1)
        fh = f0 + T - 2
        hit = [i for i in standing if (sets[k] is None or i in sets[k])] if sets and sets[k] is not None else list(standing)
        for i in hit:
            x, y = pins[i]; d = (x - xe * .5, 1.0 + (y - 5.4) * .5); dl = math.hypot(*d); d = (d[0] / dl + rnd.uniform(-.25, .25), d[1] / dl); dl = math.hypot(*d); d = (d[0] / dl, d[1] / dl)
            delay = int((y - 5.4) * 3 + abs(x - xe) * 2) + rnd.randint(0, 2); dist = rnd.uniform(1.0, 2.4) + (y - 5.4) * .5
            ft = fh + delay; g = P[i]
            q0 = Quaternion((0, 0, 1), 0); ax = (-d[1], d[0], 0)
            K(g, max(1, ft - 1), loc=(x, y, 0), quat=Quaternion((0, 0, 1), 0))
            for j in range(1, 17):
                u = j / 16; q = Quaternion(ax, math.radians(88 * smooth(u * 1.15))); s = dist * (1 - (1 - u) ** 2)
                K(g, ft + j, loc=(x + d[0] * s, y + d[1] * s, .19 * math.sin(math.radians(88 * smooth(u * 1.15)))), quat=q)
            standing.discard(i)
            sweep = c0 + Tc - 12
            K(g, sweep, scl=1); K(g, sweep + 4, scl=.001)
        label(S, lab, (0, 3.2, 2.2), size=1.1, color='#fde047', start=fh + 6, end=fh + 38)
    title(S, name)
TPL = dict(hoop=hoop, penalty=penalty, bowling=bowling)
