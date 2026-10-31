"""Sjablonen techniek deel 1."""
from shorts_a_lib import *
N = 240

def cloud(loc, s=1., col='#ffffff', parent_=None):
    g = empty(loc)
    for dx, dz, r in ((0, 0, .5), (.55, .1, .42), (-.55, -.05, .38), (.2, .3, .36)):
        o = sphere(r * s, M(col, .9), (dx * s, 0, dz * s), seg=12); o.parent = g
    if parent_: g.parent = parent_
    return g

# ============ HEUVELRIT ============
def roadtrip(S, name, model='car', P=12., zb=-2.4, hue_g='#15803d', car_scale=1.25, rot_z=0, dz=.05, amp=1.0, sky=None, mount='#6366f1', dx=0.):
    cam_look(S, 0, 90, (0, 0, 0))
    h = lambda x: amp * (.8 * math.sin(2 * math.pi * x / P) + .4 * math.sin(4 * math.pi * x / P + 1.0))
    dh = lambda x: amp * (.8 * (2 * math.pi / P) * math.cos(2 * math.pi * x / P) + .4 * (4 * math.pi / P) * math.cos(4 * math.pi * x / P + 1.0))
    # bergen (traag)
    mt = scroll(P / 2, 1)
    for k in range(-8, 12):
        hh = 2.2 + 1.3 * ((k * 7) % 3) / 2
        c = cone(1.9 + .4 * ((k * 5) % 2), 0, hh, M(mix(mount, '#ffffff', .15 * (k % 2)), .8), (k * 1.7, 4.5, zb + 1.2 + hh / 2 + 1.0), seg=5); c.parent = mt
    cl = scroll(P / 4, 1)
    for k in range(-8, 12): cloud((k * 2.6, 3.0, 2.8 + .5 * ((k * 3) % 3)), 1.0, '#ffffffcc'[:7], cl)
    rd = scroll(P, 1)
    xs = [-4 + i * .25 for i in range(int((P + 8) / .25) + 1)]
    ex = ribbon([(x, zb + h(x) - .3) for x in xs], [(x, -9) for x in xs], .8, M(hue_g, .7), y0=-.2); ex.parent = rd
    rdp = ribbon([(x, zb + h(x) + .03) for x in xs], [(x, zb + h(x) - .3) for x in xs], .5, M('#374151', .6), y0=-.7); rdp.parent = rd
    for i in range(-6, int(P / .9) + 8):
        x = -4 + i * .9
        if x > P + 4: break
        d = base_cube((.45, .1, .05), M('#fde047', .5, emit=.6), (x, -.62, zb + h(x) - .08), bevel=0); d.rotation_euler = (0, math.atan(-dh(x)), 0); d.parent = rd
    # bomen langs de weg
    for k in range(-1, 9):
        x = k * P / 6 + .7 * ((k % 3) - 1) + 3.0
        if x < -4 or x > P + 4: continue
        z0 = zb + h(x) - .1
        t = cyl(.1, .5, M('#78350f', .8), (x, .5, z0 + .25), seg=8); t.parent = rd
        for j in range(2):
            c = cone(.55 - j * .12, 0, .9, M('#166534', .7), (x, .5, z0 + .8 + j * .5), seg=8); c.parent = rd
    base_cube((40, 1, 6), M('#86efac', .8), (0, 6, zb - 5.6))
    holder = empty((0, 0, zb))
    car = S.spawn(model, car_scale, (0, 0, dz), rot_z); car.parent = holder
    for f in range(1, N + 1):
        s = P * (f - 1) / N
        z = zb + h(s + dx); ang = math.atan(-dh(s + dx))
        holder.location = (0, 0, z + .03 * math.sin(f * .9)); holder.rotation_euler = (0, ang, 0)
        holder.keyframe_insert('location', frame=f); holder.keyframe_insert('rotation_euler', frame=f)
    title(S, name)

# ============ TREIN OVER BRUG ============
def bridge(S, name, wagons=(('#ef4444'), ('#f59e0b'), ('#22c55e')), loco='#2563eb', zd=-1.4, night=False):
    cam_look(S, 0, 90, (0, 0, 0))
    Pb = 4.18879; r = .25
    if night:
        stars(S, 70, 3, spread=(3, 5), y=8)
    else:
        sun = sphere(.9, M('#fde68a', .5, emit=1.5), (2.0, 7, 3.0), seg=24)
    cl = scroll(7, 1)
    for k in range(-3, 8): cloud((k * 2.9, 6, 3.3 + .4 * (k % 3)), 1.2, '#ffffff', cl)
    sg = scroll(Pb, 3)
    for k in range(-3, 6):
        x = k * Pb
        # boog
        Ro = Pb / 2 - .1; Ri = Ro - .35; pts = []
        for i in range(0, 25): a = math.pi + math.pi * i / 24; pts.append((x + Ro * math.cos(a), zd - .3 + Ro * math.sin(a)))
        for i in range(24, -1, -1): a = math.pi + math.pi * i / 24; pts.append((x + Ri * math.cos(a), zd - .3 + Ri * math.sin(a)))
        a_ = extrude_poly(pts, .8, M('#a8a29e', .8), bevel=0); a_.parent = sg
        p = base_cube((.5, .9, 3.2), M('#78716c', .8), (x - Pb / 2, 0, -4.9)); p.parent = sg
        for j in range(4):
            po = base_cube((.07, .07, .5), M('#e5e7eb', .4), (x + (j - 1.5) * Pb / 4, -.45, zd + .55), bevel=0); po.parent = sg
        for j in range(3):
            fo = base_cube((.5, .06, .1), M('#ffffff', .4, emit=.5), (x + j * Pb / 3 - .3, -.2, -4.62), bevel=0); fo.parent = sg
    base_cube((26, .9, .5), M('#57534e', .7), (0, 0, zd - .55))
    base_cube((26, .07, .07), M('#e5e7eb', .4), (0, -.45, zd + .95), bevel=0)
    # rails
    base_cube((26, .5, .08), M('#44403c', .6), (0, 0, zd - .05), bevel=0)
    # water
    base_cube((30, 4, 1.2), M('#0ea5e9', .15, coat=.8), (0, 2, -6.0))
    # trein
    T = empty((0, 0, zd)); wheels = []
    def part(x, col, ln, hgt=.9, loco_=False):
        b = base_cube((ln, .85, hgt), M(col, .3, coat=.4), (x, 0, .25)); b.parent = T
        for wx in (-ln * .32, ln * .32):
            w = cyl(r, .12, M('#1f2937', .4), (x + wx, -.47, .25), rot=(90, 0, 0), seg=20); w.parent = T; wheels.append(w)
            w2 = cyl(r * .45, .14, M('#e5e7eb', .3, metal=.6), (x + wx, -.47, .25), rot=(90, 0, 0), seg=12); w2.parent = T; wheels.append(w2)
        return b
    xs = [2.0, .0, -1.55, -3.1]
    part(1.85, loco, 1.9, .9)
    cyl(.42, 1.1, M(mix(loco, '#000000', .2), .3, coat=.4), (2.15, 0, 1.0), rot=(0, 90, 0), seg=24).parent = T
    cyl(.15, .45, M('#111827', .5), (2.5, 0, 1.5), seg=12).parent = T
    base_cube((.8, .9, .55), M(mix(loco, '#ffffff', .2), .3), (1.1, 0, 1.15)).parent = T
    cone(.45, 0, .5, M('#fde047', .3, emit=.6), (2.9, 0, .7), rot=(0, 90, 0)).parent = T
    for i, c in enumerate(wagons):
        xw = .35 - i * 1.55 - .1; part(xw, c, 1.4, 1.05)
    smoke = []
    for i in range(7):
        o = sphere(.3, M('#f1f5f9', .9), (0, 0, 0), seg=10); smoke.append(o)
    sp = Pb * 3 / N
    for f in range(1, N + 1):
        T.location = (0, 0, zd + .07 + .012 * math.sin(f * .8)); T.keyframe_insert('location', frame=f)
    for w in wheels:
        for f in (1, N + 1): pass
        K(w, 1, rot=(90, 0, 0)); K(w, N + 1, rot=(90, 0, -360 * 8)); lin(w)
    for i, o in enumerate(smoke):
        for f in range(1, N + 1, 2):
            u = ((f - 1) / 48 + i / 7) % 1
            K(o, f, loc=(2.5 - u * 2.4, -.2, zd + 1.9 + u * 1.4), scl=(.2 + .9 * u) * (1 - u ** 3))
    title(S, name)

# ============ HELIKOPTER ============
def heli(S, name, body='#ef4444', payload=None, city='#334155', night=False, speed=1):
    cam_look(S, 0, 90, (0, 0, 0))
    if night: stars(S, 60, 7, spread=(3, 5), y=9)
    cl = scroll(8, 1)
    for k in range(-3, 6): cloud((k * 3.2, 6, 2 + .8 * (k % 3) - .5), 1.1, '#ffffff', cl)
    for L, (per, col, zb, hmax) in enumerate(((6., mix(city, '#6366f1', .2), -4.0, 2.4), (6., city, -4.4, 1.6))):
        sg = scroll(per, 2 if L == 0 else 3)
        rnd = random.Random(L + 1)
        for k in range(-6, 14):
            hh = hmax * (.4 + .6 * ((k * 5 + L * 3) % 7) / 6); w = .9
            b = base_cube((w, .8, hh), M(col, .7), (k * 1.0 * per / 6, 3 - L * 1.5, zb)); b.parent = sg
            for j in range(int(hh / .5)):
                wnd = base_cube((.15, .05, .2), M('#fde68a', .4, emit=1.2 if night else .3), (k * per / 6 + .15 * ((j + k) % 3 - 1), 3 - L * 1.5 - .42, zb + .35 + j * .5), bevel=0); wnd.parent = sg
    G = empty((0, 0, 0.0)); mb = M(body, .25, coat=.6); dk = M('#1f2937', .4)
    sphere(.9, mb, (0, 0, 0), scale=(1.55, .8, .85)).parent = G
    sphere(.6, M('#93c5fd', .1, coat=1., emit=.2), (.8, -.22, .12), scale=(.8, .6, .75)).parent = G
    cone(.42, .1, 2.6, mb, (-2.1, 0, .2), rot=(0, 90, 0)).parent = G
    base_cube((.12, .25, .8), mb, (-3.3, 0, .05)).parent = G
    cyl(.1, .35, dk, (0, 0, 1.0), seg=12).parent = G
    for sy in (-.5, .5):
        cyl(.05, 2.6, dk, (0, sy, -1.05), rot=(0, 90, 0), seg=8).parent = G
        for sx in (-.6, .6): cyl(.04, .6, dk, (sx, sy, -.8), seg=6).parent = G
    R = empty((0, 0, 1.2)); R.parent = G
    for ang in (0, 90):
        b = cube((3.8, .14, .04), dk, (0, 0, 0), rot=(0, 0, ang), bevel=0); b.parent = R
    TR = empty((-3.3, -.18, .35)); TR.parent = G
    cube((.55, .03, .08), dk, (0, 0, 0), bevel=0).parent = TR; cube((.08, .03, .55), dk, (0, 0, 0), bevel=0).parent = TR
    K(R, 1, rot=(0, 0, 0)); K(R, N + 1, rot=(0, 0, -25 * N)); lin(R)
    K(TR, 1, rot=(0, 0, 0)); K(TR, N + 1, rot=(0, 55 * N, 0)); lin(TR)
    G.scale = (.82,) * 3
    if payload:
        Pv = empty((0, 0, -.8)); Pv.parent = G
        link((0, 0, 0), (0, 0, -1.5), .03, dk, 6).parent = Pv
        ic = S.spawn(payload, .8, (0, 0, -2.2), 0); ic.parent = Pv
        for f in range(1, N + 1, 2):
            Pv.rotation_euler = (0, math.radians(-14 * speed - 8 * math.sin(2 * math.pi * 2 * (f - 1) / N)), 0); Pv.keyframe_insert('rotation_euler', frame=f)
    for f in range(1, N + 1):
        t = (f - 1) / N * 2 * math.pi
        x = .9 * math.sin(t); z = 1.1 + .45 * math.sin(2 * t)
        G.location = (x, 0, z); G.keyframe_insert('location', frame=f)
        G.rotation_euler = (0, math.radians(-8 + 4 * math.cos(t)), 0); G.keyframe_insert('rotation_euler', frame=f)
    title(S, name)

# ============ KRAAN ============
def crane(S, name, cols=('#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'), n=6, body='#facc15'):
    cam_look(S, 0, 90, (0, 0, 0)); gz = -4.6
    base_cube((9, 2.5, .4), M('#475569', .8), (0, 0, gz - .4))
    mb = M(body, .4, coat=.3)
    base_cube((.5, .5, 8.0), mb, (-2.7, 0, gz)); 
    for i in range(8):
        link((-2.95, .3, gz + i), (-2.45, .3, gz + i + 1), .04, mb, 6); link((-2.45, .3, gz + i), (-2.95, .3, gz + i + 1), .04, mb, 6)
    jz = 3.1
    base_cube((7.2, .45, .35), mb, (0.2, 0, jz)); base_cube((1.0, .6, .8), M('#64748b', .6), (-3.6, 0, jz - .6))
    link((-2.7, 0, jz + 1.0), (3.4, 0, jz + .3), .03, M('#cbd5e1', .4), 6)
    cab = base_cube((.7, .55, .6), M('#e2e8f0', .3), (-2.7, 0, jz + .35))
    tr = base_cube((.5, .5, .3), M('#1f2937', .5), (0, 0, jz - .3))
    cb = cyl(.02, 1, M('#111827', .5), seg=6); hook = torus(.14, .04, M('#111827', .4), rot=(90, 0, 0)); hb = base_cube((.3, .3, .16), M('#e5e7eb', .3), (0, 0, 0))
    xp, xs_ = -.9, 1.6; bh = .62; T = 40
    wps = []
    def hook_pos(k, f):
        c0 = 1 + T * k; topz_prev = gz + bh * k; topz = gz + bh * (k + 1)
        W = [(c0 - 1, xs_, topz_prev + bh + .9), (c0 + 7, xp, 1.2), (c0 + 15, xp, gz + bh + .62), (c0 + 19, xp, gz + bh + .62), (c0 + 27, xp, 1.2), (c0 + 33, xs_, 1.0), (c0 + 38, xs_, topz + .62), (c0 + 40, xs_, topz + .62)]
        return track(W, f)
    blocks = []
    for k in range(n):
        o = base_cube((1.2, .8, bh - .03), M(cols[k % len(cols)], .3, coat=.5), (xp, 0, gz)); blocks.append(o)
        c0 = 1 + T * k; appear(o, c0 + 2, 5, 1)
    for f in range(1, N + 1):
        k = min(n - 1, (f - 1) // T); xt, hz = hook_pos(k, f)
        if f > 1 + T * n: xt, hz = hook_pos(n - 1, 1 + T * n - 1)[0], hook_pos(n - 1, N)[1]
        tr.location = (xt, 0, jz - .3); tr.keyframe_insert('location', frame=f)
        hook.location = (xt, 0, hz + .2); hook.keyframe_insert('location', frame=f)
        hb.location = (xt, 0, hz - .02); hb.keyframe_insert('location', frame=f)
        set_link(cb, (xt, 0, jz - .4), (xt, 0, hz + .35), f)
        for kk, o in enumerate(blocks):
            c0 = 1 + T * kk
            if f < c0 + 17: continue
            if f <= c0 + 38:
                hx_, hz_ = hook_pos(kk, f); o.location = (hx_, 0, hz_ - bh - .05 + .3 if False else hz_ - bh - .02); o.keyframe_insert('location', frame=f)
            elif f == c0 + 39:
                o.location = (xs_, 0, gz + kk * bh); o.keyframe_insert('location', frame=f)
    for kk, o in enumerate(blocks):
        K(o, 1 + T * kk + 2, loc=(xp, 0, gz)); K(o, 1 + T * kk + 16, loc=(xp, 0, gz))
    title(S, name)

# ============ RAKET ============
def rocket(S, name, scale=1.7, count=True, hue='#e2e8f0', model='rocket', rz=0, nz=0.):
    cam_look(S, 0, 90, (0, 0, 0)); cam = S.cam
    stars(S, 150, 5, spread=(3.2, 5), y=9, z0=0)
    rnd = random.Random(2)
    for i in range(160): sphere(.03 + .03 * rnd.random(), M('#ffffff', .5, emit=2.0), (rnd.uniform(-3.2, 3.2), 9, rnd.uniform(-5, 90)), seg=6)
    moon = sphere(1.0, M('#fef9c3', .8, emit=.6), (2.3, 9.5, 2.3), seg=24)
    # pad
    base_cube((4.5, 3, .5), M('#475569', .7), (0, 0, -4.9))
    base_cube((.6, .6, 6.5), M('#ef4444', .5), (-2.2, 0, -4.4)); base_cube((1.8, .35, .3), M('#ef4444', .5), (-1.4, 0, 1.0))
    for i in range(6): link((-2.45, .3, -4.4 + i), (-1.95, .3, -3.4 + i), .03, M('#fca5a5', .5), 6)
    R = empty((0, 0, -2.1)); r = S.spawn(model, scale, (0, 0, 0), rz); r.parent = R
    fl = cone(.35 * scale * .6, 0, 1.6, M('#fb923c', .4, emit=6.0), (0, 0, -1.25 * scale), rot=(180, 0, 0), seg=16); fl.parent = R
    fl2 = cone(.2 * scale * .6, 0, 1.0, M('#fef08a', .4, emit=8.0), (0, 0, -1.0 * scale), rot=(180, 0, 0), seg=16); fl2.parent = R
    lights_follow(S); lo = 74; g = .0027
    for f in range(1, N + 1):
        t = max(0, f - lo)
        z = -2.1 + .5 * g * t * t * (1 + t / 150.)
        jit = .03 * math.sin(f * 2.3) if f > 30 and f < lo + 20 else 0
        R.location = (jit, 0, z); R.keyframe_insert('location', frame=f)
        on = 1 if f > lo - 6 else .001
        s = on * (1 + .15 * math.sin(f * 1.7)); fl.scale = (1, 1, s if on > .01 else .001); fl.keyframe_insert('scale', frame=f)
        fl2.scale = (1, 1, s if on > .01 else .001); fl2.keyframe_insert('scale', frame=f)
        cz = max(0, z + 2.1 - 1.2) * 1.0
        cam.location.z = cam.location.z if False else 0
    # camera volgt
    for f in range(1, N + 1, 2):
        t = max(0, f - lo); z = -2.1 + .5 * g * t * t * (1 + t / 150.)
        cam.location = (0, cam.location.y, max(0, z + 2.1 - 1.0)); cam.keyframe_insert('location', frame=f)
    # rook
    for i in range(30):
        f0 = lo - 6 + i * 3; x = rnd.uniform(-.5, .5)
        o = sphere(.5, M('#e5e7eb', .95), (x, -.5, -4.2), seg=12)
        K(o, 1, scl=.001); K(o, max(1, f0 - 1), loc=(x, -.5, -4.2), scl=.001)
        K(o, f0 + 14, loc=(x * 4 + rnd.uniform(-1.5, 1.5), -.5, -4.0 + rnd.uniform(.0, .5)), scl=1.5 + rnd.random()); K(o, f0 + 40, loc=(x * 6 + rnd.uniform(-2, 2), -.5, -3.8), scl=.001)
    if count:
        for i, tx in enumerate(('3', '2', '1', 'START!')):
            f0 = 8 + i * 17
            lb = label(S, tx, (0, -1.0, 1.6), size=1.6 if i < 3 else 1.1, color='#fde047', start=f0, end=f0 + 15)
    title(S, name, y=4.55)

# ============ ROBOTARM ============
def robot(S, name, cols=('#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7'), arm='#f59e0b', n=5):
    cam_look(S, 0, 90, (0, 0, -1.4)); fz = -4.6
    B = (0.0, -1.2); L1, L2 = 2.3, 2.1; T = 48
    base_cube((7, 2.4, .5), M('#334155', .7), (0, 0, fz - .5))
    base_cube((1.2, 1.2, 1.4), M('#475569', .5), (0, 0, fz)); cyl(.4, 1.2, M('#64748b', .4, metal=.5), (0, 0, B[1] - .3), seg=24)
    base_cube((.15, .15, 1.2), M('#475569', .5), (0, 0, fz + 1.4))
    # band rechts
    belt = base_cube((3.2, 1.4, .3), M('#1f2937', .6), (2.4, 0, -4.1))
    for i in range(-8, 8):
        p = scroll(.5, 1) if False else None
    sg = scroll(.5, int(.05 * N * 0 + 12) if False else 6, N)
    for i in range(-2, 14): base_cube((.12, 1.4, .02), M('#6b7280', .6), (1.0 + i * .5, 0, -3.79), bevel=0).parent = sg
    # bak links
    bx = -2.3
    base_cube((1.7, 1.2, .12), M('#94a3b8', .4), (bx, 0, fz + .1)); base_cube((.1, 1.2, 1.1), M('#94a3b8', .4), (bx - .8, 0, fz + .1)); base_cube((.1, 1.2, 1.1), M('#94a3b8', .4), (bx + .8, 0, fz + .1))
    am = M(arm, .3, coat=.5); jm = M('#e2e8f0', .2, metal=.7)
    l1 = cyl(.2, 1, am, seg=14); l2 = cyl(.17, 1, am, seg=14)
    j0 = sphere(.3, jm, (B[0], 0, B[1]), seg=16); j1 = sphere(.26, jm, seg=16); j2 = sphere(.2, jm, seg=16)
    gA = base_cube((.5, .14, .12), M('#475569', .5), (0, 0, 0)); gB = base_cube((.5, .14, .12), M('#475569', .5), (0, 0, 0))
    blocks = []
    pick = (1.95, -3.35); drop0 = (bx, -1.9)
    def EP(k, f):
        c0 = 1 + T * k
        W = [(c0 - 1, bx, -1.7), (c0 + 10, 1.95, -2.3), (c0 + 17, 1.95, -3.2), (c0 + 22, 1.95, -3.2), (c0 + 30, 1.9, -1.8), (c0 + 40, bx, -1.55), (c0 + 44, bx, -1.55), (c0 + 47, bx, -1.7)]
        return track(W, f)
    slots = [(bx - .38, fz + .5), (bx + .38, fz + .5), (bx, fz + 1.1), (bx - .38, fz + 1.7), (bx + .38, fz + 1.7), (bx, fz + 2.3)]
    for k in range(n):
        o = cube((.62, .62, .62), M(cols[k % len(cols)], .3, coat=.5), (4.2, 0, -3.8)); blocks.append(o)
        c0 = 1 + T * k
        K(o, 1, loc=(4.2, 0, -3.8)); K(o, c0 - 1 + 1, loc=(4.2, 0, -3.8)); K(o, c0 + 1, loc=(4.2, 0, -3.8)); K(o, c0 + 16, loc=(pick[0], 0, -3.5 + .31))
        o.keyframe_insert('location', frame=c0 + 17)
    for f in range(1, N + 1):
        k = min(n - 1, (f - 1) // T)
        E = EP(k, f); El, Ep = ik2(B, E, L1, L2, True)
        set_link(l1, (B[0], 0, B[1]), (El[0], 0, El[1]), f); set_link(l2, (El[0], 0, El[1]), (Ep[0], 0, Ep[1]), f)
        K(j1, f, loc=(El[0], 0, El[1]))
        K(j2, f, loc=(Ep[0], 0, Ep[1]))
        ang = math.atan2(Ep[1] - El[1], Ep[0] - El[0])
        K(gA, f, loc=(Ep[0] + math.cos(ang) * .2 + math.sin(ang) * .18, 0, Ep[1] + math.sin(ang) * .2 - math.cos(ang) * .18), rot=(0, -math.degrees(ang), 0))
        K(gB, f, loc=(Ep[0] + math.cos(ang) * .2 - math.sin(ang) * .18, 0, Ep[1] + math.sin(ang) * .2 + math.cos(ang) * .18), rot=(0, -math.degrees(ang), 0))
        for kk, o in enumerate(blocks):
            c0 = 1 + T * kk
            if c0 + 18 <= f <= c0 + 43:
                e = EP(kk, f); o.location = (e[0] + math.cos(ang) * .45 * 0, 0, e[1] - .0); o.keyframe_insert('location', frame=f)
            if f == c0 + 44:
                sl = slots[kk % len(slots)]; o.location = (sl[0], 0, sl[1] + .3); o.keyframe_insert('location', frame=f)
    title(S, name)

# ============ WINDMOLENS ============
def turbines(S, name, dutch=False, sky=None, n=4, bladecol='#f8fafc', seed=1):
    cam_look(S, 0, 90, (0, 0, -.8))
    sphere(.9, M('#fde68a', .4, emit=1.5), (-1.8, 9, 3.6), seg=24)
    cl = scroll(8, 1)
    for k in range(-3, 6): cloud((k * 3.3, 8, 3.0 + .7 * (k % 3)), 1.2, '#ffffff', cl)
    sphere(1, M('#22c55e', .8), (-3.5, 3, -9.5), scale=(8, 4, 5.8), seg=32)
    sphere(1, M('#16a34a', .8), (4.0, 1, -10.6), scale=(8, 4, 6.5), seg=32)
    sphere(1, M('#15803d', .8), (0, -1, -11.2), scale=(11, 4, 6.5), seg=32)
    rnd = random.Random(seed)
    spots = [(-2.0, -3.4, .5), (2.1, -3.5, .45), (.1, -3.9, .6), (-1.5, -4.4, .75)][:n] if not dutch else [(-1.3, -3.7, .55), (1.5, -4.1, .72)]
    for i, (x, zb, sc_) in enumerate(spots):
        if not dutch:
            H = 4.2 * sc_
            cone(.2 * sc_ * 1.2, .1 * sc_, H, M('#f1f5f9', .4), (x, 0, zb + H / 2), seg=16)
            hub = (x, -.25, zb + H); cube((.4 * sc_, .6 * sc_, .3 * sc_), M('#e2e8f0', .4), (x, 0, zb + H + .05), bevel=.05)
            sphere(.16 * sc_, M('#ef4444', .3), (x, -.35 * sc_, zb + H), seg=16)
            R = empty((x, -.4 * sc_, zb + H)); 
            for j in range(3):
                Bl = empty((0, 0, 0)); Bl.parent = R; Bl.rotation_euler = (0, math.radians(120 * j), 0)
                b = sphere(1, M(bladecol, .35, coat=.3), (0, 0, 1.0 * sc_ * 1.35), scale=(.12 * sc_, .03, 1.35 * sc_), seg=16); b.parent = Bl
            sgn = 1 if i % 2 == 0 else -1
            K(R, 1, rot=(0, 0, 0)); K(R, N + 1, rot=(0, sgn * 360 * (2 + i % 2), 0)); lin(R)
        else:
            H = 3.4 * sc_
            lathe([(.75 * sc_, 0), (.7 * sc_, .2 * sc_), (.45 * sc_, H), (.0, H)], M('#e7e5e4', .7), (x, 0, zb))
            lathe([(.62 * sc_, H - .1), (.6 * sc_, H + .25 * sc_), (0, H + .75 * sc_)], M('#7c2d12', .7), (x, 0, zb))
            base_cube((.3 * sc_, .25, .5 * sc_), M('#78350f', .6), (x, -.7 * sc_, zb + .02))
            R = empty((x, -.75 * sc_, zb + H + .15)); sphere(.14 * sc_, M('#7c2d12', .5), (0, 0, 0), seg=12).parent = R
            for j in range(4):
                Bl = empty((0, 0, 0)); Bl.parent = R; Bl.rotation_euler = (0, math.radians(90 * j), 0)
                cube((.07, .05, 2.6 * sc_ * 1.1), M('#78350f', .6), (0, 0, 1.45 * sc_ * 1.1), bevel=0).parent = Bl
                cube((.42 * sc_, .03, 1.5 * sc_), M('#fef3c7', .7), (.23 * sc_, -.03, 1.7 * sc_ * 1.1), bevel=0).parent = Bl
            K(R, 1, rot=(0, 0, 0)); K(R, N + 1, rot=(0, 360 * 1, 0)); lin(R)
    if dutch:
        for i in range(34):
            x = -3 + (i % 17) * .36; z = -4.7 + (i // 17) * .32; c = ('#ef4444', '#facc15', '#f472b6', '#f97316')[i % 4]
            cone(.09, 0, .28, M(c, .4), (x + rnd.random() * .1, -1.6, z + .5), seg=8); cyl(.015, .35, M('#16a34a', .5), (x, -1.6, z + .3), seg=6)
    title(S, name)
TPL = dict(roadtrip=roadtrip, bridge=bridge, heli=heli, crane=crane, rocket=rocket, robot=robot, turbines=turbines)
