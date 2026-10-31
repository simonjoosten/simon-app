"""Sjablonen techniek deel 2: lopende band, zuigers, reuzenrad."""
from shorts_a_lib import *
N = 240

def glass(c, a=.35):
    m = mat(c, .1, alpha=a, emit=0.8)
    try: m.surface_render_method = 'BLENDED'
    except Exception: pass
    return m

def conveyor(S, name, icons=('apple', 'banana', 'strawberry', 'cake', 'gem', 'star'), isc=1.05, belt='#374151', scan='#22c55e', v=.05, spin=True, dz=.55):
    cam_look(S, -24, 60, (0, 0, .3)); S.floor('#1e1b4b', z=-1.9, size=90)
    base_cube((10, 1.9, .35), M(belt, .6), (0, 0, -1.55)); base_cube((10, .12, .35), M('#94a3b8', .3, metal=.6), (0, -1.0, -1.5)); base_cube((10, .12, .35), M('#94a3b8', .3, metal=.6), (0, 1.0, -1.5))
    sg = scroll(.5, int(v * N / .5))
    for i in range(-10, 44): base_cube((.1, 1.7, .02), M('#6b7280', .6), (-5 + i * .5, 0, -1.19), bevel=0).parent = sg
    for sx in range(-4, 5): cyl(.2, .5, M('#475569', .5, metal=.5), (sx * 1.1, -1.2, -1.7), rot=(90, 0, 0), seg=16)
    for sy in (-1.05, 1.05):
        base_cube((.18, .18, 1.6 + dz * 2), M('#64748b', .4, metal=.5), (0, sy, -1.2)); 
    base_cube((.2, 2.3, .18), M('#64748b', .4, metal=.5), (0, 0, 1.0 + dz * 2))
    bm = glass(scan, .3); beam = cube((.04, 1.9, 1.6 + dz * 2), bm, (0, 0, -.15 + dz), bevel=0)
    for f in range(1, N + 1, 2):
        s_ = 1 + .04 * math.sin(f * .5); K(beam, f, scl=(1, 1, s_))
    sphere(.12, M(scan, .3, emit=5.0), (0, -1.0, 1.1 + dz * 2), seg=12)
    items = []
    gap = 1.7
    for m in range(-8, 4):
        x0 = -3.4 + gap * m; x1 = x0 + v * N
        if x1 < -4.9 or x0 > 4.9: continue
        ic = icons[m % len(icons)]
        o = S.spawn(ic, isc, (x0, 0, 0), 0); items.append((o, x0, ic, m))
    for o, x0, ic, m in items:
        for f in range(1, N + 1):
            x = x0 + v * (f - 1); e = max(0., 1 - abs(x) / .9)
            K(o, f, loc=(x, 0, -1.0 + dz + .45 * e * math.sin(e * 1.57)), rot=(0, 0, 20 + (f * 2.2 if spin else 0) % 360 if not spin else 20 + 360 * (f - 1) / N * 2), scl=isc * (1 + .3 * e))
    title(S, name)

def pistons(S, name, cols=2, rows=3, hue=0., span=.8, turns=3, r=.42, Lr=1.4, sc_=.88):
    cam_look(S, 0, 90, (0, 0, -.4))
    k = 0
    for ci in range(cols):
        for ri in range(rows):
            cx = (ci - (cols - 1) / 2) * 2.9; cz = -3.6 + ri * 2.6
            c = rgb(hue + span * k / (cols * rows), .75, .95); ph = k * 70.; k += 1
            G = empty((cx, 0, cz)); G.scale = (sc_,) * 3
            sgn = 1 if (ci + ri) % 2 == 0 else -1
            wheel = cyl(.62, .22, M(c, .25, coat=.5), (0, 0, 0), rot=(90, 0, 0), seg=40); wheel.parent = G
            hub = cyl(.2, .3, M('#e2e8f0', .2, metal=.8), (0, -.12, 0), rot=(90, 0, 0), seg=20); hub.parent = G
            hole = cyl(.3, .06, M(mix(c, '#000000', .45), .4), (0, -.12, 0), rot=(90, 0, 0), seg=32); hole.parent = G
            pin = cyl(.1, .24, M('#fde047', .3, metal=.6), (0, -.24, 0), rot=(90, 0, 0), seg=14); pin.parent = G
            for sx in (-.36, .36):
                base_cube((.07, .5, 1.4), M('#94a3b8', .3, metal=.7), (sx, .1, .85)).parent = G
            base_cube((.9, .5, .16), M('#64748b', .4, metal=.6), (0, .1, 2.25)).parent = G
            pis = base_cube((.56, .36, .34), M('#f1f5f9', .2, metal=.8), (0, 0, 0)); pis.parent = G
            rod = cyl(.07, 1, M('#cbd5e1', .3, metal=.8), seg=10); rod.parent = G
            for f in range(1, N + 1):
                th = math.radians(ph + sgn * 360 * turns * (f - 1) / N)
                px, pz = r * math.cos(th), r * math.sin(th); zp = r * math.sin(th) + math.sqrt(Lr ** 2 - (r * math.cos(th)) ** 2)
                pin.location = (px, -.24, pz); pin.keyframe_insert('location', frame=f)
                pis.location = (0, -.05, zp - .1); pis.keyframe_insert('location', frame=f)
                set_link(rod, (px, -.2, pz), (0, -.2, zp), f)
                wheel.rotation_euler = (math.radians(90), math.radians(-math.degrees(th)) * 0 + th, 0) if False else (math.radians(90), 0, 0)
            K(wheel, 1, rot=(90, 0, 0))
    title(S, name)

def ferris(S, name, nb=10, hue=0., span=.9, R=2.55, turns=1, night=True):
    cam_look(S, 0, 90, (0, 0, 0)); cz = -.5
    if night: stars(S, 80, 4, spread=(3, 5), y=9)
    sphere(.8, M('#fef9c3', .8, emit=.8), (-2.2, 9, 3.4), seg=24)
    base_cube((9, 3, .6), M('#14532d', .8), (0, 0, -4.9))
    mm = M('#e2e8f0', .3, metal=.6)
    for sx in (-1, 1):
        link((sx * 1.6, 0, -4.6), (0, .0, cz), .12, mm, 8)
    sphere(.35, M('#fbbf24', .3, metal=.6), (0, -.1, cz), seg=20)
    W = empty((0, 0, cz))
    torus(R, .08, M('#f8fafc', .3, metal=.5), (0, 0, 0), rot=(90, 0, 0), seg=64, minor=10).parent = W
    t2 = torus(R * .5, .06, M('#f8fafc', .3, metal=.5), (0, 0, 0), rot=(90, 0, 0), seg=48, minor=8); t2.parent = W
    for i in range(nb):
        a = 2 * math.pi * i / nb
        l = link((0, 0, 0), (R * math.cos(a), 0, R * math.sin(a)), .05, mm, 8); l.parent = W
        set_link(l, (0, 0, 0), (R * math.cos(a), 0, R * math.sin(a)))
    for i in range(nb * 2):
        a = 2 * math.pi * (i + .5) / (nb * 2); c = rgb(hue + .12 * (i % 3), .5, 1.) if False else ('#fde047' if i % 2 else '#f472b6')
        sphere(.1, M(c, .3, emit=3.0), (R * math.cos(a), -.1, R * math.sin(a)), seg=8).parent = W
    K(W, 1, rot=(0, 0, 0)); K(W, N + 1, rot=(0, -360 * turns, 0)); lin(W)
    gs = []
    for i in range(nb):
        c = rgb(hue + span * i / nb, .7, .95)
        g = empty((0, -.2, 0)); b = base_cube((.7, .5, .5), M(c, .3, coat=.4), (0, 0, -.85)); b.parent = g
        cone(.5, 0, .3, M(mix(c, '#ffffff', .3), .3), (0, 0, -.3), seg=4, rot=(0, 0, 45)).parent = g
        cube((.6, .1, .22), M('#bae6fd', .2, emit=.4), (0, -.26, -.72), bevel=0).parent = g
        link((0, 0, 0), (0, 0, -.35), .03, mm, 6).parent = g
        gs.append(g)
    for f in range(1, N + 1, 2):
        th = 2 * math.pi * turns * (f - 1) / N
        for i, g in enumerate(gs):
            a = 2 * math.pi * i / nb + th; g.location = (R * math.cos(a), -.2, cz + R * math.sin(a)); g.keyframe_insert('location', frame=f)
    title(S, name)
TPL = dict(conveyor=conveyor, pistons=pistons, ferris=ferris)
