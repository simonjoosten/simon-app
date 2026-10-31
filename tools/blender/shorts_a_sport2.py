"""Sjablonen sport deel 2: darts, golf, tafeltennis, skate."""
from shorts_a_lib import *
N = 240
SEC = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
RAD = dict(S=1.65, s=.75, T=1.2, D=2.1, B=0., b=.3)
MUL = dict(S=1, s=1, T=3, D=2)

def darts(S, name, darts_=((20, 'T'), (20, 'T'), (20, 'S'), (19, 'T'), (3, 'D'), ('B', 'B')), arrive=(34, 64, 94, 138, 168, 198), flightc=('#ef4444', '#3b82f6')):
    cam_look(S, -24, 84, (0, 0, .3), 9.8); bm = M('#111827', .5); cm = M('#f5e6c8', .5)
    cyl(2.7, .3, M('#7c2d12', .6), (0, .2, 0), rot=(90, 0, 0), seg=48)
    cyl(2.5, .1, M('#0f172a', .5), (0, .05, 0), rot=(90, 0, 0), seg=48)
    for i in range(20):
        t0 = math.radians(90 - i * 18 + 9); t1 = math.radians(90 - i * 18 - 9)
        for (ri, ro, kind) in ((.4, 1.1, 's'), (1.1, 1.3, 'T'), (1.3, 2.0, 'S'), (2.0, 2.2, 'D')):
            if kind in 'sS': m = bm if i % 2 == 0 else cm
            else: m = M('#dc2626', .45) if i % 2 == 0 else M('#16a34a', .45)
            pts = [(ro * math.cos(t0 + (t1 - t0) * j / 4), ro * math.sin(t0 + (t1 - t0) * j / 4)) for j in range(5)] + [(ri * math.cos(t0 + (t1 - t0) * j / 4), ri * math.sin(t0 + (t1 - t0) * j / 4)) for j in range(4, -1, -1)]
            extrude_poly(pts, .1, m, (0, .05, 0), bevel=0)
    cyl(.4, .1, M('#16a34a', .45), (0, .02, 0), rot=(90, 0, 0), seg=32); cyl(.2, .1, M('#dc2626', .45), (0, -.01, 0), rot=(90, 0, 0), seg=24)
    tot = 0
    for k, ((sec, band), fa) in enumerate(zip(darts_, arrive)):
        if band == 'B': tx, tz, pts = 0.03, 0.02, 50
        else:
            i = SEC.index(sec); th = math.radians(90 - i * 18); r = RAD[band]; tx, tz = r * math.cos(th), r * math.sin(th); pts = sec * MUL[band]
        tz += .0; tot += pts
        G = empty((0, 0, 0)); fc = flightc[(k // 3) % 2]
        for rot in (0, 120, 240):
            Fn = cube((.015, .33, .3), M(fc, .4), (0, -.95, 0), bevel=0); Fn.parent = G
            Fn.rotation_euler = (0, math.radians(rot), 0); Fn.location = (0, -.95, 0)
            # vleugel in de lengterichting: verplaats radiaal
            Fn.location = (.12 * math.sin(math.radians(rot)), -.95, .12 * math.cos(math.radians(rot)))
        cyl(.07, .8, M('#e2e8f0', .2, metal=.9), (0, -.4, 0), rot=(90, 0, 0), seg=12).parent = G
        cone(.07, 0, .45, M('#94a3b8', .2, metal=.9), (0, .05, 0), rot=(-90, 0, 0), seg=12).parent = G
        K(G, 1, scl=.001, loc=(tx, -9, tz)); K(G, fa - 17, loc=(tx * .6, -8, tz - 2.5), scl=1.6)
        K(G, fa - 16, loc=(tx * .6, -8, tz - 2.5), scl=1.6)
        for j in range(1, 17):
            u = (j / 16) ** 1.5
            K(G, fa - 16 + j, loc=(lerp(tx * .6, tx, u), lerp(-8, .15, u), lerp(tz - 2.5, tz, u)), rot=(lerp(-8, 0, u), 0, 0), scl=1.6)
        for j in range(1, 14):
            a = 7 * math.exp(-j / 4.) * math.sin(j * 1.6)
            K(G, fa + j, loc=(tx, .15, tz), rot=(a, 0, a * .7), scl=1.6)
        label(S, str(pts) if band != 'B' else 'BULLSEYE!', (tx * .8, -1.2, tz + .95 if tz < 1.4 else tz - .95), size=.7 if band != 'B' else .5, color='#fde047', start=fa + 2, end=fa + 30)
    label(S, 'TOTAAL ' + str(tot), (0, -1.2, -3.55), size=.8, color='#4ade80', start=210)
    title(S, name)

# ============ GOLF ============
def golf(S, name, X=34., shots=((14.5, 15.7, 6.2, 32), (31.5, 32.8, 5.0, 28)), putt_T=26, shirt='#ef4444', grass=('#22c55e', '#4ade80'), sky_clouds=True, label_txt='BIRDIE!'):
    cam = S.cam; cam_look(S, 0, 90, (0, 0, .4)); zg = -3.3; R = .26
    def h(x):
        raw = .75 * math.sin(x * .28) + .35 * math.sin(x * .73 + 1)
        a = smooth((x - (X - 8)) / 5.); b = smooth(1 - x / 3.)
        return raw * (1 - a) * (1 - b * .9)
    xs = [-8 + i * .3 for i in range(int((X + 14 + 8) / .3))]
    ribbon([(x, zg + h(x) - .25) for x in xs], [(x, -14) for x in xs], 1.0, M('#78350f', .8), y0=-.3)
    ribbon([(x, zg + h(x)) for x in xs], [(x, zg + h(x) - .25) for x in xs], 1.0, M(grass[0], .6), y0=-.35)
    rnd = random.Random(4)
    for k in range(-3, int(X / 3) + 6):
        x = k * 3.1 + rnd.uniform(-.4, .4)
        if abs(x - X) < 2.5: continue
        t = cyl(.1, .6, M('#78350f', .8), (x, 1.0, zg + h(x) + .3), seg=8)
        for j in range(3): cone(.55 - j * .1, 0, .8, M('#15803d', .7), (x, 1.0, zg + h(x) + .9 + j * .45), seg=8)
    for k in range(-2, int(X / 5) + 5):
        cone(2.2 + rnd.random(), 0, 2.4 + rnd.random() * 1.4, M('#818cf8', .8), (k * 5.5 + rnd.uniform(-1, 1), 5, zg + 1.6 + 1.2), seg=5)
    for k in range(-2, int(X / 7) + 5): cloud = None
    from shorts_a_tech1 import cloud as mkcloud
    for k in range(-2, int(X / 6) + 4): mkcloud((k * 7. + rnd.uniform(-1, 1), 3.5, 2.6 + rnd.random() * 1.4), 1.1)
    # vlag
    hz = zg + h(X)
    cyl(.04, 2.0, M('#f8fafc', .4), (X, .1, hz + 1.0), seg=8)
    fl = extrude_poly([(0, 0), (.9, -.28), (0, -.55)], .05, M('#ef4444', .5), (X + .05, .1, hz + 1.98), bevel=0)
    cyl(.28, .05, M('#111827', .8), (X, -.05, hz + .01), seg=16)
    # bal
    ball = sphere(R, M('#ffffff', .3, coat=.5), seg=20)
    pos = {}; ground = lambda x: zg + h(x) + R
    t = 1; x_cur = 0.; contacts = []; relocs = []
    for f in range(1, 34): pos[f] = (x_cur, ground(x_cur))
    t = 34
    stands = [x_cur]
    for (xl, xr, ap, T) in shots:
        contacts.append((t, 1.0)); x0 = x_cur
        p0 = (x0, 0, ground(x0)); p1 = (xl, 0, ground(xl))
        for fr in range(0, T + 1):
            (p, _) = _flt(p0, p1, zg + ap + 1.5, T, fr); pos[t + fr] = (p[0], p[2])
        t += T
        for j in range(1, 9):
            u = j / 8; x = lerp(xl, xl + .5, u); pos[t + j] = (x, ground(x) + .55 * 4 * u * (1 - u))
        t += 8
        for j in range(1, 15):
            u = j / 14; x = lerp(xl + .5, xr, 1 - (1 - u) ** 2); pos[t + j] = (x, ground(x))
        t += 14; x_cur = xr; relocs.append((t - 6, t + 16)); t += 22; stands.append(x_cur)
    contacts.append((t, .45)); x0 = x_cur
    for j in range(0, putt_T + 1):
        u = j / putt_T; x = lerp(x0, X, 1 - (1 - u) ** 2); pos[t + j] = (x, ground(x))
    t += putt_T
    for j in range(1, 10):
        u = j / 9; pos[t + j] = (X, ground(X) - u * .5)
    tdrop = t; t += 10
    last = pos[max(pos)]
    for f in range(1, N + 1):
        p = pos.get(f, last)
        K(ball, f, loc=(p[0], 0, p[1]), scl=(1 if f < tdrop + 8 else max(.001, 1 - (f - tdrop - 8) * .5)))
    # golfer
    G = empty((0, 0, 0)); sk = M('#fcd9b6', .5); jm = M(shirt, .5)
    for sx in (-.12, .12): cyl(.09, .9, M('#1e3a8a', .5), (sx * .5, sx, .45), seg=10).parent = G
    cyl(.26, .8, jm, (0, 0, 1.3), seg=14).parent = G
    sphere(.23, sk, (0, 0, 1.95), seg=14).parent = G
    cone(.25, .2, .22, M('#f8fafc', .5), (0, 0, 2.2), seg=12).parent = G
    Hn = (.28, -.22, 1.0); sh = (0, -.12, 1.55)
    link(sh, Hn, .07, jm, 8).parent = G
    shaft = cyl(.025, 1, M('#cbd5e1', .3, metal=.8), seg=6); shaft.parent = G
    head = cube((.28, .12, .1), M('#475569', .3, metal=.8), (0, 0, 0), bevel=.02); head.parent = G
    def alpha(f, amp):
        a = 10.
        for (fc, sc_) in contacts:
            if fc - 30 <= f <= fc + 24:
                W = [(fc - 30, 10), (fc - 12, -120 * sc_ * amp), (fc - 3, -20), (fc, 14), (fc + 10, 120 * sc_ * amp), (fc + 24, 10)]
                a = track(W, f)[0]
        return a
    for f in range(1, N + 1):
        gx = stands[0] - .6
        for i, (a, b) in enumerate(relocs):
            gx0 = stands[i] - .6; gx1 = stands[i + 1] - .6
            if f >= b: gx = gx1
            elif f >= a: gx = lerp(gx0, gx1, smooth((f - a) / (b - a)))
            elif f >= 1 and gx == stands[0] - .6 and f > relocs[i - 1][1 if i else 0] if False else False: pass
        # kies juiste positie
        idx = sum(1 for (a, b) in relocs if f >= b); gx = stands[idx] - .6
        for i, (a, b) in enumerate(relocs):
            if a <= f < b: gx = lerp(stands[i] - .6, stands[i + 1] - .6, smooth((f - a) / (b - a)))
        al = math.radians(alpha(f, 1.0)); L = 1.45
        hd = (Hn[0] + L * math.sin(al), -.22, Hn[2] - L * math.cos(al))
        gz = zg + h(gx + .6) + .0
        K(G, f, loc=(gx, 0, gz))
        set_link(shaft, Hn, hd, f); K(head, f, loc=(hd[0], hd[1], hd[2]), rot=(0, -math.degrees(al), 0))
    # camera volgt de bal
    cx = 0.
    for f in range(1, N + 1):
        p = pos.get(f, last); tgt = max(0., p[0] + .9); cx += (tgt - cx) * .12
        cam.location = (cx, cam.location.y, cam.location.z); cam.keyframe_insert('location', frame=f)
    lights_follow(S) if False else None
    for f in (1,):
        pass
    label(S, label_txt, (X - 2.3, 0, 1.4), size=.9, color='#fde047', start=tdrop + 10)
    title(S, name)

def _flt(p0, p1, apex, T, f):
    a = apex - p0[2]; b = apex - p1[2]; g = 2 * ((math.sqrt(a) + math.sqrt(b)) / T) ** 2; vz = math.sqrt(2 * g * a)
    return (lerp(p0[0], p1[0], f / T), 0, p0[2] + vz * f - .5 * g * f * f), (g, vz)

# ============ TAFELTENNIS ============
def pingpong(S, name, P=24, table='#1d4ed8', ballc='#fb923c', pad=('#dc2626', '#111827')):
    cam_look(S, -20, 80, (0, 0, .5)); zt = -.9; r = .17
    base_cube((6.3, 2.0, .14), M(table, .35, coat=.5), (0, 0, zt - .14)); base_cube((.04, 1.9, .02), M('#f8fafc', .4), (0, 0, zt), bevel=0) if False else None
    base_cube((6.3, .03, .015), M('#f8fafc', .4), (0, 0, zt + .002), bevel=0)
    for sx in (-2.7, 2.7):
        base_cube((.14, .14, 3.2), M('#334155', .5), (sx, -.8, -4.8)); base_cube((.14, .14, 3.2), M('#334155', .5), (sx, .8, -4.8))
    base_cube((.05, 2.0, .6), M('#f8fafc', .6), (0, 0, zt)); base_cube((.05, 2.0, .06), M('#e5e7eb', .4), (0, 0, zt + .56), bevel=0)
    for sy in (-1.05, 1.05): base_cube((.08, .08, .72), M('#475569', .4), (0, sy, zt - .02))
    xs = [-2.7, 2.7]
    padl = []
    for i, px in enumerate(xs):
        G = empty((px, 0, 0)); sg = 1 if i == 0 else -1
        cyl(.5, .07, M(pad[i], .5, coat=.3), (0, 0, 0), rot=(0, 90, 0), seg=28).parent = G
        cyl(.5, .04, M(pad[1 - i], .5), (0 - sg * .04, 0, 0), rot=(0, 90, 0), seg=28).parent = G
        base_cube((.07, .1, .45), M('#b45309', .5), (0, 0, -.75)).parent = G
        padl.append(G)
    ball = sphere(r, M(ballc, .3, coat=.6), seg=20)
    g = .06 * (30. / P) ** 2; nk = N // P + 1; pts = []
    for k in range(-1, nk + 1):
        a = k % 2; xh = xs[a] + (.3 if a == 0 else -.3); xb = -xs[a] * .38; xr = xs[1 - a] + (.3 if a == 1 else -.3)
        zh = zt + .75 + .2 * math.sin(k * 1.7); zr = zt + .7 + .2 * math.sin((k + 1) * 1.7)
        t0 = 6 + P * k; T1 = int(P * .46); T2 = P - T1
        for fr in range(0, T1 + 1):
            p = parab((xh, 0, zh), (xb, 0, zt + r), T1, g * 1.0, fr); pts.append((t0 + fr, p))
        for fr in range(1, T2 + 1):
            p = parab((xb, 0, zt + r), (xr, 0, zr), T2, g * 1.0, fr); pts.append((t0 + T1 + fr, p))
    for f, p in pts:
        if 1 <= f <= N: K(ball, f, loc=p, rot=(f * 20, f * 14, 0))
    for i, G in enumerate(padl):
        for k in range(-1, nk + 1):
            if k % 2 != i: continue
            t0 = 6 + P * k; zh = zt + .75 + .2 * math.sin(k * 1.7); sg = 1 if i == 0 else -1
            for fr, (dz, rot) in ((-P + 3, (-.55, 0)), (-4, (-.35, -sg * 25)), (0, (0, sg * 20)), (4, (.05, sg * 10)), (P - 6, (-.55, 0))):
                f = t0 + fr
                if 1 <= f <= N: K(G, f, loc=(xs[i] + sg * (.0 if fr == 0 else .0) , 0, zh + dz - .0) if False else (xs[i] + (.3 if i == 0 else -.3) * (1 if fr == 0 else .3), 0, zh + dz), rot=(0, rot, 0))
    # tellers
    cnt = N // P
    for k in range(cnt):
        t0 = 6 + P * k
        label(S, str(k + 1), (0, 0, 3.0), size=1.7, color='#fde047', start=t0, end=t0 + P - 2, emit=1.0)
    title(S, name)

# ============ SKATE ============
def skate(S, name, R=2.4, Tp=60, spins=1, board='#f97316', shirt='#3b82f6', pipe='#64748b', wall=('#0ea5e9', '#7dd3fc')):
    cam_look(S, 0, 90, (0, 0, 0)); zc = -.9; zr = zc + 1.1
    pts = [(-R - .55, zr), (-R - .55, zc)]
    for i in range(1, 36): a = math.pi + math.pi * i / 36; pts.append(((R + .55) * math.cos(a), zc + (R + .55) * math.sin(a)))
    pts += [(R + .55, zc), (R + .55, zr), (R, zr), (R, zc)]
    for i in range(35, 0, -1): a = math.pi + math.pi * i / 36; pts.append((R * math.cos(a), zc + R * math.sin(a)))
    pts += [(-R, zc), (-R, zr)]
    extrude_poly(pts, 2.0, M(pipe, .45, coat=.3), (0, 0, 0), bevel=0)
    rr = random.Random(3)
    for k in range(-4, 5):
        hh = 2.5 + rr.random() * 3.0
        base_cube((.9, .5, hh), M(mix(wall[0], '#1e1b4b', .75), .7), (k * .95, 3.0, -4.3), bevel=0)
    sphere(1.1, M('#fde68a', .5, emit=1.5), (1.6, 6, 1.2), seg=24)
    G = empty((0, 0, 0)); bm = M(board, .3, coat=.5)
    base_cube((1.05, .3, .09), bm, (0, 0, .08)).parent = G
    for wx in (-.35, .35): sphere(.1, M('#f1f5f9', .3), (wx, -.1, .04), seg=10).parent = G; sphere(.1, M('#f1f5f9', .3), (wx, .1, .04), seg=10).parent = G
    Rd = empty((0, 0, .17)); Rd.parent = G
    for sx in (-.2, .2): cyl(.08, .8, M('#1e293b', .5), (sx, 0, .4), seg=10).parent = Rd
    cyl(.24, .7, M(shirt, .5), (0, 0, 1.05), seg=14).parent = Rd
    sphere(.2, M('#fcd9b6', .5), (0, 0, 1.6), seg=14).parent = Rd
    cone(.22, .1, .22, M('#fde047', .4), (0, 0, 1.78), seg=12).parent = Rd
    for sx in (-1, 1): link((sx * .2, 0, 1.3), (sx * .55, 0, 1.0), .06, M(shirt, .5), 8).parent = Rd
    smax = math.pi * R / 2 + 2.1; thr = math.pi * R / 2 + .25
    ss = []; w = []
    for f in range(1, N + 1):
        s = smax * math.sin(2 * math.pi * (f - 1) / Tp); ss.append(s); w.append(max(0., abs(s) - thr))
    psi = []; cur = 0.; tot = None
    # normaliseer per luchtvenster
    wins = []; run = []
    for i, x in enumerate(w + [0]):
        if x > 0: run.append(i)
        elif run: wins.append(run); run = []
    psis = [0.] * len(w); acc = 0.
    for run in wins:
        sm = sum(w[i] for i in run); c = 0.
        for i in range(len(w)):
            if i in run: c += w[i]; psis[i] = acc + 360 * spins * c / sm
            elif i > run[-1] and i <= run[-1] + 1 or False: pass
        acc += 360 * spins
    cur = 0.; out = []
    for i in range(len(w)):
        for run in wins:
            if i > run[-1]: cur = max(cur, 0)
        out.append(0.)
    # cumulatief opbouwen
    cum = 0.; k = 0; res = []
    run_sum = [sum(w[i] for i in run) for run in wins]; wi = 0
    for i in range(len(w)):
        in_run = [j for j, run in enumerate(wins) if i in run]
        if in_run:
            j = in_run[0]; cum_ = sum(w[x] for x in wins[j] if x <= i)
            res.append(360 * spins * (j + cum_ / run_sum[j]))
        else:
            done = sum(1 for run in wins if run[-1] < i); res.append(360 * spins * done)
    for f in range(1, N + 1):
        s = ss[f - 1]; a = abs(s)
        if a <= math.pi * R / 2:
            ph = s / R; x = R * math.sin(ph); z = zc - R * math.cos(ph); tilt = math.degrees(ph)
        else:
            sg = 1 if s > 0 else -1; x = sg * R; z = zc + (a - math.pi * R / 2); tilt = sg * 90
            air = clamp((a - math.pi * R / 2) / .5); tilt = tilt * (1 - air)
        sg = 1 if s >= 0 else -1
        G.location = (x - (sg * .12 if a > math.pi * R / 2 else 0), 0, z + .02); G.rotation_euler = (0, math.radians(-tilt), 0); G.keyframe_insert('location', frame=f); G.keyframe_insert('rotation_euler', frame=f)
        Rd.rotation_euler = (0, 0, math.radians(res[f - 1])); Rd.keyframe_insert('rotation_euler', frame=f)
    title(S, name)
TPL = dict(darts=darts, golf=golf, pingpong=pingpong, skate=skate)
