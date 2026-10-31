"""Leidt per short (s001..s300) een lijst geluidsmomenten ('events') af uit de scenescripts.

De tijden komen uit dezelfde parameters als de Blender-scripts (keyframes: frame/24 s).  Blender zelf
wordt NIET gestart: de scripts van batch a worden alleen met `ast` gelezen (parameters + standaardwaarden),
batch b en c hebben pure-Python datamodules.  Resultaat per short:
    {'id','c','t','tpl','s','ev':[{'t':sec,'k':soort,...}], 'meta':{...}}
`python3 tools/shorts/sound/events.py` schrijft ook events-a.json / events-b.json / events-c.json.
"""
import ast, json, math, os, random, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
BL = os.path.join(ROOT, 'tools', 'blender')
META = os.path.join(ROOT, 'tools', 'shorts')
FPS = 24.0


def F(f):
    """Frame (Blender: 1-gebaseerd) naar seconden."""
    return (f - 1) / FPS


class Ev:
    def __init__(self):
        self.l = []

    def add(self, t, k, **kw):
        if t < -0.01:
            return
        d = {'t': round(max(0.0, t), 3), 'k': k}
        d.update(kw)
        self.l.append(d)

    def pops(self, frames, k='pop', **kw):
        for i, f in enumerate(frames):
            self.add(F(f), k, n=i, **kw)


# ------------------------------------------------------------------ batch a: ast
def _ns(srcfile, names, extra=None):
    ns = {'math': math, 'random': random}
    ns['lerp'] = lambda a, b, t: a + (b - a) * t
    ns['clamp'] = lambda x, a=0., b=1.: max(a, min(b, x))
    ns['smooth'] = lambda x: (lambda y: y * y * (3 - 2 * y))(max(0., min(1., x)))
    if extra:
        ns.update(extra)
    tree = ast.parse(open(srcfile, encoding='utf-8').read())
    for node in tree.body:
        if isinstance(node, ast.FunctionDef) and node.name in names:
            exec(compile(ast.Module([node], []), srcfile, 'exec'), ns)
    return ns


_A_FILES = ['shorts_a_sat1.py', 'shorts_a_sat2.py', 'shorts_a_tech1.py', 'shorts_a_tech2.py', 'shorts_a_sport1.py', 'shorts_a_sport2.py']


def _a_defaults():
    out = {}
    for fn in _A_FILES:
        tree = ast.parse(open(os.path.join(BL, fn), encoding='utf-8').read())
        for node in tree.body:
            if isinstance(node, ast.FunctionDef):
                a = node.args
                names = [x.arg for x in a.args]
                defs = a.defaults
                d = {}
                for nm, df in zip(names[len(names) - len(defs):], defs):
                    try:
                        d[nm] = eval(compile(ast.Expression(df), '', 'eval'), {'math': math})
                    except Exception:
                        pass
                out[node.name] = d
    return out


def load_a_jobs():
    src = open(os.path.join(BL, 'shorts_a_jobs.py'), encoding='utf-8').read()
    tree = ast.parse(src)
    env = {'dict': dict, 'SA': 'satisfying', 'TE': 'techniek', 'SP': 'sport'}
    jobs = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and getattr(node.func, 'id', None) == 'J':
            ev = lambda n: eval(compile(ast.Expression(n), '', 'eval'), env)
            pos = [ev(a) for a in node.args]
            kw = {k.arg: ev(k.value) for k in node.keywords}
            names = ['t', 'c', 'tags', 'tpl', 'bg', 'p', 's']
            d = dict(zip(names, pos))
            d.update(kw)
            d.setdefault('p', {})
            d['p'] = d['p'] or {}
            jobs.append(d)
    return jobs


# --- batch a: gebeurtenissen per sjabloon (p = parameters met standaardwaarden)
def a_domino(p, L, rnd):
    ns = _ns(os.path.join(BL, 'shorts_a_sat1.py'), ('_resample', '_path'))
    P = ns['_resample'](ns['_path'](p['kind']), p['spacing'])
    n = len(P)
    d = max(1.6, (240 - 62) / n)
    e = Ev()
    e.add(F(14), 'thud', g=0.7)
    for i in range(n):
        t = F(14 + i * d + 7)
        e.add(t, 'tik', n=i, g=0.5)
        if i % 3 == 0:
            e.add(t, 'note', n=int(i / n * 11), o=0, g=0.8)
    e.add(F(14 + n * d + 12), 'ding', n=7, g=0.8)
    return e.l


def a_stairs(p, L, rnd):
    n = p['n']
    hops = 2 * (n - 1)
    T = 240 // hops
    seq = list(range(n)) + list(range(n - 2, 0, -1)) + [0]
    e = Ev()
    for h in range(hops):
        fl = 1 + (h + 1) * T
        if fl <= 244:
            e.add(F(fl), 'land', n=seq[h + 1] * 1.0, g=0.9)
    return e.l


def a_gears(p, L, rnd):
    t0 = p['teeth'][0]
    rate = t0 * p['turns'] / L
    e = Ev()
    k = 0
    while k / rate < L - 0.1:
        e.add(k / rate, 'tick', n=k, g=0.35)
        k += 1
    e.add(0.05, 'servo', g=0.4, d=0.5)
    return e.l


def a_newton(p, L, rnd):
    Tsec = p['T'] / FPS
    e = Ev()
    k = 0
    while True:
        t = Tsec * (0.25 + 0.5 * k)
        if t > L - 0.05:
            break
        e.add(t, 'clack', n=p['k'], g=0.9, side=k % 2)
        k += 1
    return e.l


def a_wavegrid(p, L, rnd):
    e = Ev()
    k = p['k']
    for i in range(k):
        t = L * (i + 0.5) / k
        e.add(t, 'bloep', g=0.5, p=i * 2)
        e.add(t, 'note', n=i * 2, o=-1, g=0.7)
    e.add(0.05, 'whoosh', d=1.2, g=0.3)
    return e.l


def _drop_fall(z0, zl, g=22.0):
    return math.sqrt(2 * max(0.01, z0 - zl) / g)


def a_bins(p, L, rnd):
    nb, per, mode = p['nb'], p['per'], p['mode']
    e = Ev()
    if mode == 'bins':
        n = nb * per
        d = max(1.2, (240 - 62) / n)
        rr = random.Random(p['seed'])
        order = [b for b in range(nb) for _ in range(per)]
        rr.shuffle(order)
        cnt = [0] * nb
        for i, b in enumerate(order):
            k = cnt[b]
            cnt[b] += 1
            z = -4.6 + 0.27 + (k // 3) * 0.98 + (0.49 if k % 3 == 2 else 0)
            t = F(6 + int(i * d)) + _drop_fall(3.6, z, 22)
            e.add(t, 'plop', n=b * 2 + (k % 2), g=0.55)
    else:
        rows = per
        n = 0
        for row in range(rows):
            nc = 8 if row % 2 == 0 else 7
            n += nc
        d = max(1.2, (240 - 62) / n)
        i = 0
        for row in range(rows):
            nc = 8 if row % 2 == 0 else 7
            z = -4.6 + 0.27 + row * 0.47
            for c in range(nc):
                e.add(F(6 + int(i * d)) + _drop_fall(3.6, z, 22), 'plop', n=row + (c % 3), g=0.5)
                i += 1
    return e.l


def a_sortbars(p, L, rnd):
    n = p['n']
    rr = random.Random(p['seed'])
    while True:
        perm = list(range(n))
        rr.shuffle(perm)
        a = perm[:]
        sw = []
        ch = True
        while ch:
            ch = False
            for i in range(n - 1):
                if a[i] > a[i + 1]:
                    a[i], a[i + 1] = a[i + 1], a[i]
                    sw.append(i)
                    ch = True
        if 16 <= len(sw) <= 26:
            break
    D = max(5, min(9, int((240 - 70) / len(sw))))
    e = Ev()
    f = 14
    for i in sw:
        e.add(F(f + D // 2), 'note', n=i * 0.9, o=0, g=0.75)
        e.add(F(f + D // 2), 'tik', n=i, g=0.4)
        f += D
    for s in range(n):
        ff = f + 6 + s * 2 + 3
        e.add(F(ff), 'note', n=s, o=1, g=0.6)
    e.add(F(f + 6 + n * 2 + 6), 'tring', g=0.7)
    return e.l


def a_patterndrop(p, L, rnd):
    ns = _ns(os.path.join(BL, 'shorts_a_sat2.py'), ('_heart', '_star', '_smiley', '_flower', '_target', '_diamond', '_house', '_tree', '_spiral', '_rocket'))
    fn = ns['_' + p['shape']]
    cols = rows = 11
    n = 0
    for j in range(rows):
        for i in range(cols):
            u = (i - (cols - 1) / 2) / (cols / 2)
            v = (j - (rows - 1) / 2) / (rows / 2)
            if fn(u, v):
                n += 1
    d = (240 - 90) / max(1, n)
    e = Ev()
    for idx in range(n):
        t = F(4 + int(idx * d)) + 0.55
        e.add(t, 'plop', n=idx % 7 + int(idx / n * 8), g=0.45)
    e.add(F(170), 'swell', d=2.0, g=0.4)
    return e.l


def a_pendwave(p, L, rnd):
    n, c0 = p['n'], p['c0']
    e = Ev()
    rr = random.Random(11)
    for i in range(n):
        cyc = c0 + i
        for k in range(cyc):
            t = L * (k + 0.0) / cyc
            if rr.random() < 2.4 / (n * 0.55):
                e.add(t, 'note', n=i, o=0, g=0.45)
    return e.l


def a_twist(p, L, rnd):
    e = Ev()
    turns = p['turns']
    per = L / turns
    k = 0
    while k * per / 2 < L:
        t = k * per / 2 + per / 4
        if t < L - 0.2:
            e.add(t - 0.35, 'whoosh', d=0.7, g=0.3)
            e.add(t, 'note', n=k * 2, o=0, g=0.6)
        k += 1
    return e.l


def a_bouncewave(p, L, rnd):
    P = p['P']
    e = Ev()
    mode = p['mode']
    rr = random.Random(5)
    if mode == 'row':
        n, rows = p['n'], p['rows']
        items = [(i, rw) for rw in range(rows) for i in range(n)]
        for i, rw in items:
            ph = (i / n) * (1 if rw % 2 == 0 else -1)
            k = 0
            while True:
                t = ((ph % 1.0) + k) * P / FPS
                if t > L - 0.05:
                    break
                if rr.random() < 0.3:
                    e.add(t, 'note', n=i * 0.7 + rw * 2, o=-1, g=0.4)
                k += 1
    else:
        for rng_, m in enumerate((8, 14, 20)):
            for i in range(m):
                ph = (i / m) * (1 if rng_ % 2 == 0 else -1)
                k = 0
                while True:
                    t = ((ph % 1.0) + k) * P / FPS
                    if t > L - 0.05:
                        break
                    if rr.random() < 0.3:
                        e.add(t, 'note', n=(i % 8) * 0.9 + rng_, o=-1, g=0.4)
                    k += 1
    return e.l


def a_phyllo(p, L, rnd):
    e = Ev()
    k = p['k']
    for i in range(k * 3):
        t = L * i / (k * 3)
        e.add(t + 0.2, 'bloep', g=0.35, p=i * 3)
        e.add(t + 0.2, 'note', n=(i * 2) % 9, o=0, g=0.6)
    return e.l


def a_tileflip(p, L, rnd):
    cols, rows, delay = p['cols'], p['rows'], p['delay']
    e = Ev()
    dmax = cols + rows - 2
    for rnd_t in (6, 126):
        for dd in range(dmax + 1):
            cnt = min(dd, cols - 1) - max(0, dd - rows + 1) + 1
            t = F(dd * delay + rnd_t + 11)
            if t < L - 0.1 and cnt > 0:
                e.add(t, 'flip', n=dd, g=min(1.0, 0.35 + cnt * 0.12))
                if dd % 2 == 0:
                    e.add(t, 'note', n=dd // 2 + (3 if rnd_t > 6 else 0), o=0, g=0.5)
    return e.l


def a_rings(p, L, rnd):
    e = Ev()
    n = p['n']
    for i in range(n):
        tn = p['turns'] * (1 + (i % 2))
        for k in range(tn):
            e.add(L * (k + 0.5) / tn + i * 0.05, 'note', n=i, o=1, g=0.4)
    e.add(0.2, 'swell', d=2.5, g=0.4)
    return e.l


def a_roadtrip(p, L, rnd):
    e = Ev()
    e.add(0.0, 'engine', d=L, g=0.8)
    e.add(2.6, 'honk', g=0.8)
    e.add(7.0, 'honk', g=0.6)
    for i in range(3):
        e.add(1.5 + i * 3.1, 'chirp', g=0.5)
    return e.l


def a_bridge(p, L, rnd):
    e = Ev()
    t = 0.0
    k = 0
    while t < L - 0.1:
        e.add(t, 'chuff', g=0.55 if k % 4 == 0 else 0.4)
        t += 0.25
        k += 1
    e.add(1.2, 'whistle', g=0.8, d=0.9)
    e.add(7.2, 'whistle', g=0.8, d=0.6)
    return e.l


def a_heli(p, L, rnd):
    e = Ev()
    t = 0.0
    while t < L - 0.1:
        e.add(t, 'chop', g=0.5)
        t += 0.3
    e.add(0.0, 'wind', d=L, g=0.35)
    return e.l


def a_crane(p, L, rnd):
    n = p['n']
    T = 40
    e = Ev()
    for k in range(n):
        c0 = 1 + T * k
        e.add(F(c0 + 17), 'clunk', g=0.7)
        e.add(F(c0 + 3), 'servo', g=0.4, d=0.4)
        e.add(F(c0 + 21), 'servo', g=0.4, d=0.7, f0=200, f1=330)
        e.add(F(c0 + 39), 'land', n=k * 1.0, g=0.9)
    return e.l


def a_rocket(p, L, rnd):
    e = Ev()
    for i in range(4):
        f0 = 8 + i * 17
        e.add(F(f0), 'count', n=i, g=0.9)
    lo = 74
    e.add(F(lo - 6), 'rocket', d=L - F(lo - 6), g=0.95)
    e.add(F(lo - 4), 'bang', g=0.55)
    e.add(F(lo + 10), 'whoosh', d=1.5, g=0.5)
    return e.l


def a_robot(p, L, rnd):
    n = p['n']
    T = 48
    e = Ev()
    for k in range(n):
        c0 = 1 + T * k
        e.add(F(c0 + 3), 'servo', g=0.4, d=0.4, f0=240, f1=380)
        e.add(F(c0 + 17), 'clunk', g=0.6)
        e.add(F(c0 + 24), 'servo', g=0.4, d=0.5, f0=380, f1=250)
        e.add(F(c0 + 44), 'land', n=k * 1.0, g=0.85)
    e.add(0.0, 'hum', d=L, g=0.3)
    return e.l


def a_turbines(p, L, rnd):
    e = Ev()
    e.add(0.0, 'wind', d=L, g=0.8)
    t = 0.3
    k = 0
    while t < L - 0.5:
        e.add(t, 'whoosh', d=0.5, g=0.18, f0=150, f1=500)
        t += 0.8 + (k % 3) * 0.1
        k += 1
    for i in range(3):
        e.add(1.8 + i * 3.2, 'chirp', g=0.5)
    return e.l


def a_conveyor(p, L, rnd):
    v = 0.05
    gap = 1.7
    e = Ev()
    for m in range(-8, 4):
        x0 = -3.4 + gap * m
        if x0 + v * 240 < -4.9 or x0 > 4.9:
            continue
        f = 1 - x0 / v
        if 3 < f < 238:
            e.add(F(f), 'beep', n=m % 5, g=0.7)
            e.add(F(f), 'pop', n=0, g=0.4)
    e.add(0.0, 'hum', d=L, g=0.35)
    return e.l


def a_pistons(p, L, rnd):
    cols, rows, turns = p['cols'], p['rows'], p['turns']
    e = Ev()
    k = 0
    for ci in range(cols):
        for ri in range(rows):
            ph = k * 70.0
            sgn = 1 if (ci + ri) % 2 == 0 else -1
            k += 1
            for j in range(turns + 1):
                # theta = ph + sgn*360*turns*(f-1)/N = 90 (mod 360)
                for q in range(-1, turns + 1):
                    deg = 90 + 360 * q
                    fr = (deg - ph) / (sgn * 360.0 * turns)
                    t = fr * L
                    if 0.02 < t < L - 0.05 and (j == 0):
                        e.add(t, 'chuff', g=0.3)
    e.add(0.0, 'hum', d=L, g=0.4)
    return e.l


def a_ferris(p, L, rnd):
    nb, turns = p['nb'], p['turns']
    e = Ev()
    for i in range(nb * turns):
        t = L * (i + 0.5) / (nb * turns)
        e.add(t, 'bell', n=i % 7, g=0.5)
    e.add(0.0, 'hum', d=L, g=0.25)
    return e.l


def a_hoop(p, L, rnd):
    shots = p['shots']
    n = len(shots)
    Tc = 240 // n
    T = p['T']
    e = Ev()
    for k, (x0, z0, ap, lab) in enumerate(shots):
        c0 = 1 + k * Tc
        fs = c0 + 6
        fi = fs + T
        e.add(F(fs), 'swish', g=0.5)
        e.add(F(fi), 'net', g=0.9)
        e.add(F(fi + 1), 'ding', n=4 + (2 if '3' in lab else 0), g=0.7)
        e.add(F(fi + 2), 'cheer', d=0.9, g=0.35)
        e.add(F(fi + 17), 'bounce', g=0.8)
        e.add(F(fi + 31), 'bounce', g=0.5)
        e.add(F(fi + 41), 'bounce', g=0.3)
    return e.l


def a_penalty(p, L, rnd):
    shots = p['shots']
    n = len(shots)
    Tc = 240 // n
    e = Ev()
    for k in range(n):
        c0 = 1 + k * Tc
        fk = c0 + 14
        T = 22
        fi = fk + T
        e.add(F(fk - 6), 'whistle', g=0.5, d=0.25)
        e.add(F(fk), 'kick', g=0.9)
        e.add(F(fi), 'net', g=0.8)
        e.add(F(fi + 2), 'fanfare', g=0.55)
        e.add(F(fi + 2), 'cheer', d=1.3, g=0.5)
        e.add(F(fk + 14), 'step', g=0.5)
    return e.l


def a_bowling(p, L, rnd):
    throws = p['throws']
    n = len(throws)
    Tc = 240 // n
    e = Ev()
    for k in range(n):
        c0 = 1 + k * Tc
        f0 = c0 + 6
        T = 30
        fh = f0 + T - 2
        e.add(F(f0), 'thud', g=0.5)
        e.add(F(f0 + 2), 'roll', d=T / FPS - 0.1, g=0.6)
        e.add(F(fh), 'rattle', g=1.0, d=0.7, count=22)
        e.add(F(fh + 3), 'bang', g=0.5)
        e.add(F(fh + 8), 'ding', n=7, g=0.7)
        e.add(F(fh + 8), 'cheer', d=1.1, g=0.4)
        e.add(F(c0 + Tc - 12), 'whoosh', d=0.4, g=0.4)
    return e.l


def a_darts(p, L, rnd):
    arrive = p['arrive']
    darts_ = p['darts_']
    e = Ev()
    for k, fa in enumerate(arrive[:len(darts_)]):
        e.add(F(fa - 16), 'whoosh', d=0.55, g=0.3, f0=900, f1=3000)
        e.add(F(fa), 'thud', g=0.6, f=140)
        band = darts_[k][1]
        e.add(F(fa + 2), 'ding' if band != 'B' else 'tring', n=3 + k, g=0.7)
    e.add(F(210), 'fanfare', g=0.6)
    return e.l


def a_golf(p, L, rnd):
    e = Ev()
    t = 34
    for (xl, xr, ap, T) in p['shots']:
        e.add(F(t), 'club', g=0.9)
        e.add(F(t) + 0.0, 'swish', g=0.4)
        t += T
        e.add(F(t), 'bounce', g=0.6)
        e.add(F(t + 8), 'bounce', g=0.3)
        t += 8 + 14 + 22
    e.add(F(t), 'club', g=0.55)
    t += p['putt_T']
    e.add(F(t + 1), 'plop', n=0, g=0.9)
    e.add(F(t + 10), 'tring', g=0.8)
    e.add(F(t + 10), 'applause', d=1.4, g=0.35)
    return e.l


def a_pingpong(p, L, rnd):
    P = p['P']
    e = Ev()
    nk = 240 // P + 1
    T1 = int(P * 0.46)
    for k in range(0, nk + 1):
        t0 = 6 + P * k
        if t0 < 244:
            e.add(F(t0), 'tok', g=0.9)
            e.add(F(t0), 'ding', n=2 + (k % 3), g=0.35)
        if t0 + T1 < 244:
            e.add(F(t0 + T1), 'tik', n=k, g=0.9)
    return e.l


def a_skate(p, L, rnd):
    Tp = p['Tp']
    e = Ev()
    e.add(0.0, 'roll', d=L, g=0.35)
    k = 0
    while True:
        f = 1 + Tp / 4.0 + k * Tp / 2.0
        if f > 242:
            break
        e.add(F(f), 'tok', g=0.7)
        e.add(F(f - Tp / 8.0), 'whoosh', d=0.35, g=0.35)
        if p['spins'] > 0 and k % 2 == 1:
            e.add(F(f + Tp / 8.0), 'spin', g=0.5)
        e.add(F(f + Tp / 4.0), 'land', n=k % 5, g=0.6)
        k += 1
    return e.l


A_FUNCS = {'domino': a_domino, 'stairs': a_stairs, 'gears': a_gears, 'newton': a_newton, 'wavegrid': a_wavegrid, 'bins': a_bins, 'sortbars': a_sortbars,
           'patterndrop': a_patterndrop, 'pendwave': a_pendwave, 'twist': a_twist, 'bouncewave': a_bouncewave, 'phyllo': a_phyllo, 'tileflip': a_tileflip,
           'rings': a_rings, 'roadtrip': a_roadtrip, 'bridge': a_bridge, 'heli': a_heli, 'crane': a_crane, 'rocket': a_rocket, 'robot': a_robot,
           'turbines': a_turbines, 'conveyor': a_conveyor, 'pistons': a_pistons, 'ferris': a_ferris, 'hoop': a_hoop, 'penalty': a_penalty,
           'bowling': a_bowling, 'darts': a_darts, 'golf': a_golf, 'pingpong': a_pingpong, 'skate': a_skate}


# ------------------------------------------------------------------ batch b (dieren, eten, natuur)
def b_title(e, P, key='t1', f=3, k='pop'):
    e.add(F(f), k, n=0)


def b_bounce(P, L, rnd):
    T = P.get('T', 1.0)
    e = Ev()
    k = 0
    while k * T < L - 0.1:
        e.add(k * T, 'boing', g=0.8, p=(k % 3) * 2)
        k += 1
    e.add(F(6), 'pop')
    e.add(L * 0.55, 'ding', n=4, g=0.8)
    return e.l, {'beat': T / 2}


def b_dance(P, L, rnd):
    A = P['as']
    beat = P.get('beat', 0.75)
    lag = P.get('lag', 0.9)
    e = Ev()
    for i in range(len(A)):
        k = 1
        while True:
            t = (k * math.pi - i * lag) * beat / math.pi
            if t > L - 0.1:
                break
            if t > 0.05:
                e.add(t, 'step', g=0.5)
                if k % 2 == 0:
                    e.add(t, 'note', n=i * 2 + 1, o=0, g=0.5)
            k += 1
    e.add(F(4), 'pop')
    return e.l, {'beat': beat}


def b_race(P, L, rnd):
    A = P['as']
    order = P['order']
    e = Ev()
    e.add(1.0, 'whistle', g=0.8)
    for i in range(len(A)):
        T = 6.2 + order[i] * 0.45
        t = 1.2
        while t < T:
            e.add(t, 'step', g=0.3)
            t += 0.42
        if order[i] == 0:
            e.add(T, 'tring', g=0.9)
            e.add(T, 'fanfare', g=0.6)
            e.add(T + 0.1, 'applause', d=2.0, g=0.5)
    e.add(F(3), 'pop')
    e.add(7.2, 'ding', n=6, g=0.9)
    return e.l, {}


def b_hide(P, L, rnd):
    K = P.get('seq', [(0, 0, -1), (1.8, 0, -1), (2.5, 0, -.35), (3.4, 0, -.35), (4.0, 0, -1), (4.6, 0, -1), (4.9, -2.1, -1), (5.6, -2.1, 0), (7.4, -2.1, 0), (8.0, -2.1, -1)])
    e = Ev()
    for (a, x0, z0), (b, x1, z1) in zip(K, K[1:]):
        if abs(z1 - z0) > 0.4:
            e.add((a + b) / 2, 'swish', g=0.4)
            e.add(b - 0.1 if z1 > z0 else a + 0.2, 'squeak', g=0.5)
        if abs(x1 - x0) > 0.5:
            for j in range(3):
                e.add(a + (b - a) * j / 3, 'step', g=0.3)
    e.add(F(3), 'pop')
    e.add(5.6, 'boing', g=0.9)
    e.add(5.5, 'pop', n=2)
    return e.l, {}


def b_ballchase(P, L, rnd):
    Tp = P.get('T', 5.0)
    e = Ev()
    m = 1
    while m * Tp / 6 < L - 0.1:
        e.add(m * Tp / 6, 'boing', g=0.5, p=(m % 4) * 2)
        m += 1
    e.add(F(3), 'pop')
    return e.l, {}


def b_swim(P, L, rnd):
    e = Ev()
    e.add(0.1, 'splash', g=0.7)
    rr = random.Random(3)
    t = 0.5
    while t < L - 0.3:
        e.add(t, 'bloep', g=0.35, p=rr.randint(0, 8))
        t += 0.35 + rr.random() * 0.6
    e.add(F(4), 'pop')
    return e.l, {}


def b_tower(P, L, rnd):
    n = len(P['as'])
    e = Ev()
    for i in range(n):
        tl = 1.2 + i * 1.1
        e.add(tl, 'land', n=i * 1.0, g=0.85)
        e.add(tl + 0.4, 'thud', g=0.3)
    e.add(1.2 + n * 1.1, 'tring', g=0.9)
    e.add((1.1 * 24 * n // 2 + 2 - 1) / FPS, 'pop')
    return e.l, {}


def b_look(P, L, rnd):
    Tp = 6.0
    e = Ev()
    k = 0
    while Tp / 4 * (1 + 2 * k) < L:
        t = Tp / 4 * (1 + 2 * k)
        e.add(t, 'squeak', g=0.5)
        k += 1
    t = 0.5
    while t < L - 0.3:
        e.add(t, 'note', n=int(t * 2) % 5, o=1, g=0.4)
        t += 0.75
    e.add(F(3), 'pop')
    return e.l, {}


def b_sleep(P, L, rnd):
    e = Ev()
    for i in range(5):
        k = 0
        while True:
            t = (k - i / 5.0) * 4.0
            if t > L - 0.5:
                break
            if t > 0.1:
                e.add(t, 'bloep', g=0.3, p=-6 + i)
            k += 1
    for k in range(6):
        e.add(1.0 + k * 1.3, 'note', n=k % 5, o=2, g=0.35)
    e.add(F(3), 'pop')
    return e.l, {'mood': 'lullaby'}


def b_pads(P, L, rnd):
    e = Ev()
    hop = 1.1
    seq = [0, 1, 2, 3, 2, 1]
    k = 1
    while k * hop < L - 0.1:
        e.add(k * hop, 'plop', n=seq[k % 6] * 2, g=0.6)
        e.add(k * hop - 0.35, 'squeak', g=0.3)
        k += 1
    e.add(F(4), 'pop')
    return e.l, {'beat': hop}


def b_parade(P, L, rnd):
    A = P['as']
    e = Ev()
    for i in range(len(A)):
        k = 0
        while True:
            t = (k - i * 0.37) / 1.9
            if t > L - 0.1:
                break
            if t > 0.05:
                e.add(t, 'step', g=0.25)
            k += 1
    e.add(F(3), 'pop')
    return e.l, {'beat': 1 / 1.9}


def b_whack(P, L, rnd):
    e = Ev()
    for i in range(3):
        for k in range(3):
            t0 = i * 0.9 + 0.8 + k * 3.0
            e.add(t0 + 0.05, 'pop', n=i, g=0.8)
            e.add(t0 + 0.1, 'squeak', g=0.4, p=i * 3)
            e.add(t0 + 1.2, 'swish', g=0.3)
    e.add(F(3), 'ding', n=5, g=0.7)
    return e.l, {}


def b_love(P, L, rnd):
    e = Ev()
    for t in (1.0, 5.0, 9.0):
        if t < L - 0.2:
            e.add(t, 'tring', g=0.6)
            e.add(t, 'squeak', g=0.4)
    for i in range(9):
        t = i * 0.5 + 0.3
        e.add(t % 4.5 + 0.5, 'bloep', g=0.25, p=6 + i % 4)
    e.add(F(3), 'pop')
    return e.l, {'mood': 'sweet'}


def b_carousel(P, L, rnd):
    e = Ev()
    t = 0.0
    while t < L - 0.2:
        e.add(t, 'bell', n=int(t / 2.25) % 5, g=0.5)
        t += 2.25 / 2
    e.add(F(3), 'pop')
    return e.l, {'beat': 2.25 / 4}


def b_grow(P, L, rnd):
    e = Ev()
    for i in range(3):
        tl = 1.2 + i * 1.7
        e.add(tl, 'boing', g=0.8, p=(2 - i) * 3)
        e.add(tl + 0.1, 'ding', n=2 + i * 2, g=0.7)
    t = 6.5
    while t < L - 0.1:
        e.add(t, 'step', g=0.5)
        t += 1.2 / 2
    e.add(6.6, 'tring', g=0.8)
    e.add(6.6, 'fanfare', g=0.4)
    return e.l, {}


def b_rain(P, L, rnd):
    n = P.get('n', 8)
    e = Ev()
    for i in range(n):
        tl = 1.0 + i * 0.75
        e.add(tl, 'boing', g=0.8, p=(i % 4) * 2)
        e.add(tl + 0.45, 'thud', g=0.3)
    e.add(0.0, 'rain', d=L, g=0.5)
    e.add(F(3), 'pop')
    return e.l, {}


# --- eten
def b_donut(P, L, rnd):
    n = P.get('n', 40)
    e = Ev()
    for i in range(n):
        e.add(1.2 + i * 5.0 / n + 0.45, 'tik', n=i % 7, g=0.35)
    e.add(1.0, 'swish', g=0.4)
    e.add(5.5, 'swell', d=1.5, g=0.4)
    e.add(7.0, 'tring', g=0.7)
    e.add(F(3), 'pop')
    return e.l, {}


def b_pizza(P, L, rnd):
    n = P.get('n', 16)
    e = Ev()
    e.add(0.3, 'swish', g=0.5)
    e.add(1.0, 'swish', g=0.5)
    for i in range(n):
        e.add(1.9 + i * 0.3 + 0.5, 'plof', n=i % 7, g=0.5)
    e.add(7.0, 'whoosh', d=1.6, g=0.5)
    e.add(7.2, 'tring', g=0.8)
    e.add(F(3), 'pop')
    return e.l, {}


def b_cake(P, L, rnd):
    e = Ev()
    for i in range(3):
        e.add(1.2 + i * 1.3, 'land', n=i * 2.0, g=0.8)
    for i in range(3):
        for k in range(10):
            e.add(4.2 + i * 0.5 + k * 0.12 + 0.12, 'tik', n=k % 5, g=0.3)
    for k in range(3):
        e.add(5.3 + k * 0.35, 'plof', n=k * 2, g=0.6)
    for k in range(P.get('candles', 3)):
        e.add(6.6 + k * 0.25, 'pop', n=k, g=0.7)
    e.add(7.6, 'tring', g=0.8)
    e.add(7.6, 'applause', d=1.2, g=0.35)
    e.add(F(3), 'pop')
    return e.l, {}


def b_icecream(P, L, rnd):
    n = len(P['cols'])
    e = Ev()
    for i in range(n):
        e.add(1.3 + i * 1.5, 'plof', n=i * 2, g=0.8)
        e.add(1.3 + i * 1.5 + 0.45, 'squeak', g=0.25, p=i)
    e.add(1.3 + n * 1.5 + 0.2, 'plof', n=n * 2, g=0.9)
    e.add(1.3 + n * 1.5 + 0.6, 'tring', g=0.8)
    e.add(F(3), 'pop')
    return e.l, {}


def b_burger(P, L, rnd):
    n = len(P['order'])
    e = Ev()
    for i in range(n):
        e.add(1.0 + i * 0.75, 'plof', n=i % 7, g=0.7)
    e.add(1.0 + n * 0.75 + 0.2, 'tring', g=0.8)
    e.add(F(3), 'pop')
    return e.l, {}


def b_fruitsort(P, L, rnd):
    n = sum(len(b[1]) for b in P['bins'])
    e = Ev()
    for k in range(n):
        e.add(1.5 + k * 0.7 + 0.5, 'plop', n=k % 6, g=0.6)
    e.add(1.5 + n * 0.7 + 0.5, 'tring', g=0.8)
    e.add(F(3), 'pop')
    return e.l, {}


def b_cupwave(P, L, rnd):
    cols = P.get('cols', 3)
    rows = P.get('rows', 3)
    e = Ev()
    for rw in range(rows):
        for ci in range(cols):
            tl = 0.6 + (rw * cols + ci) * 0.13
            e.add(tl + 0.1, 'pop', n=ci, g=0.35)
    t = 0.6
    k = 0
    while t < L - 0.3:
        e.add(t, 'note', n=k % 6, o=0, g=0.5)
        t += 2.4 / 3
        k += 1
    e.add(F(3), 'ding', n=4)
    return e.l, {'beat': 2.4 / 6}


def b_popcorn(P, L, rnd):
    rn = random.Random(P.get('seed', 4))
    n = P.get('n', 34)
    e = Ev()
    for i in range(n):
        ts = 1.0 + i * (L - 3.0) / n + rn.uniform(0, .15)
        e.add(ts, 'popcorn', g=0.6, p=rn.randint(-3, 5))
    for k in range(6):
        e.add(1.4 + k * 1.2, 'ding', n=3 + k % 3, g=0.5)
    e.add(0.0, 'hum', d=1.0, g=0.1)
    e.add(F(3), 'pop')
    return e.l, {}


def b_choc(P, L, rnd):
    n = P.get('n', 10)
    e = Ev()
    for i in range(n):
        e.add(1.0 + i * 0.68, 'land', n=i * 0.8, g=0.75)
    e.add(1.0 + n * 0.68 + 0.3, 'tring', g=0.8)
    e.add(7.0, 'whoosh', d=1.6, g=0.35)
    e.add(F(3), 'pop')
    return e.l, {}


def b_juice(P, L, rnd):
    e = Ev()
    e.add(1.8, 'rattle', d=1.2, g=0.4, count=12)
    e.add(3.0, 'splash', g=0.9)
    e.add(3.6, 'rise', d=2.4, g=0.4, f0=220, f1=520)
    for k in range(6):
        e.add(2.95 + k * 0.1, 'plop', n=k, g=0.5)
    e.add(6.5, 'ding', n=5, g=0.7)
    e.add(7.0, 'tring', g=0.8)
    e.add(F(3), 'pop')
    return e.l, {}


def b_jar(P, L, rnd):
    n = 80
    e = Ev()
    for idx in range(n):
        tl = 0.8 + idx * (7.0 / n)
        e.add(tl, 'tik', n=idx % 7, g=0.35)
        if idx % 4 == 0:
            e.add(tl, 'plop', n=idx // 8, g=0.35)
    e.add(8.0, 'thud', g=0.8)
    e.add(8.3, 'tring', g=0.9)
    e.add(F(3), 'pop')
    return e.l, {}


# --- natuur
def b_seasons(P, L, rnd):
    q = L / 4
    e = Ev()
    e.add(0.0, 'wind', d=L, g=0.3)
    for i in range(4):
        e.add(F(int(i * q * 24) + 4), 'pop', n=i, g=0.8)
        e.add(F(int(i * q * 24) + 4), 'ding', n=2 + i, g=0.5)
    e.add(0.4, 'chirp', g=0.7)
    e.add(1.4, 'chirp', g=0.5)
    e.add(q * 1 + 0.4, 'chirp', g=0.6)
    e.add(q * 1 + 1.4, 'cricket', g=0.5)
    e.add(q * 2 + 0.5, 'wind', d=q - 0.5, g=0.5)
    e.add(q * 3 + 0.5, 'swirl', d=q - 0.5, g=0.4)
    e.add(q * 3 + 0.5, 'shimmer', d=q - 0.5, g=0.5)
    return e.l, {'mood': 'ambient'}


def b_flowers(P, L, rnd):
    e = Ev()
    for i in range(3):
        e.add(1.5 + i * 1.5, 'bloem', n=i, g=0.7)
    for k in range(4):
        e.add(0.5 + k * 2.0, 'chirp', g=0.5)
    e.add(4.0, 'squeak', g=0.3, p=4)
    e.add(0.0, 'wind', d=L, g=0.2)
    e.add(F(3), 'pop')
    return e.l, {'mood': 'ambient'}


def b_weather(P, L, rnd):
    e = Ev()
    e.add(0.0, 'chirp', g=0.5)
    e.add(1.2, 'chirp', g=0.4)
    e.add(2.0, 'wind', d=1.2, g=0.4)
    e.add(3.0, 'rain', d=3.0, g=0.9)
    e.add(3.2, 'thunder', d=2.0, g=0.5)
    e.add(6.3, 'magic', g=0.9)
    e.add(6.3, 'tring', g=0.6)
    e.add(8.0, 'chirp', g=0.5)
    e.add(F(3), 'pop')
    e.add(3.0, 'ding', n=3)
    e.add(6.3, 'ding', n=6)
    return e.l, {'mood': 'ambient'}


def b_volcano(P, L, rnd):
    bursts = P.get('bursts', [1.5, 4.0, 6.5])
    e = Ev()
    e.add(0.0, 'rumble', d=L, g=0.5, shape='swell')
    for tb in bursts:
        e.add(tb, 'bang', g=0.9)
        e.add(tb, 'rumble', d=1.6, g=0.7, shape='fall')
        e.add(tb + 0.1, 'pop', n=1, g=0.6)
        e.add(tb + 0.4, 'whoosh', d=1.2, g=0.4, f0=500, f1=2500)
    e.add(F(2), 'pop')
    return e.l, {'mood': 'rumble'}


def b_snowman(P, L, rnd):
    e = Ev()
    for i in range(3):
        e.add(1.2 + i * 1.3, 'land', n=i * 1.0, g=0.7)
    e.add(5.7 + 0.4, 'plof', g=0.7, n=3)
    e.add(5.8, 'pop', n=2)
    e.add(6.1, 'tring', g=0.7)
    t = 7.0
    while t < L - 0.1:
        e.add(t, 'step', g=0.3)
        t += 1.2 / 2
    e.add(0.0, 'wind', d=L, g=0.25)
    e.add(F(3), 'pop')
    return e.l, {'mood': 'ambient'}


def b_waves(P, L, rnd):
    e = Ev()
    e.add(0.0, 'surf', d=L, g=0.8)
    t = 0.4
    while t < L - 0.5:
        e.add(t, 'bell', n=int(t) % 5, g=0.35)
        t += 2.4
    e.add(1.0, 'chirp', g=0.35, f0=0)
    e.add(F(3), 'pop')
    return e.l, {'mood': 'ambient'}


def b_mushrooms(P, L, rnd):
    e = Ev()
    for i in range(7):
        e.add(0.6 + i * 0.85 + 0.15, 'plof', n=i % 7, g=0.5)
        e.add(0.6 + i * 0.85 + 0.15, 'boing', g=0.35, p=i % 5)
    e.add(0.0, 'wind', d=L, g=0.15)
    e.add(F(3), 'pop')
    return e.l, {'mood': 'ambient'}


def b_daynight(P, L, rnd):
    e = Ev()
    e.add(0.5, 'chirp', g=0.5)
    e.add(1.5, 'chirp', g=0.4)
    e.add(L * 0.42, 'cricket', g=0.5, d=2.0)
    e.add(L * 0.6, 'shimmer', d=2.0, g=0.5)
    e.add(L * 0.85, 'chirp', g=0.5)
    e.add(F(3), 'pop')
    e.add(0.0, 'wind', d=L, g=0.2)
    return e.l, {'mood': 'ambient'}


def b_garden(P, L, rnd):
    e = Ev()
    for i in range(5):
        e.add(1.0 + i * 1.0 + 0.3, 'plop', n=i, g=0.6)
    for k in range(5):
        e.add(0.5 + k * 1.7, 'chirp', g=0.5)
    e.add(F(3), 'pop')
    return e.l, {'mood': 'ambient'}


def b_aurora(P, L, rnd):
    e = Ev()
    e.add(0.2, 'shimmer', d=L - 0.5, g=0.8)
    e.add(0.0, 'swirl', d=L, g=0.35)
    e.add(F(3), 'pop')
    return e.l, {'mood': 'ambient'}


def b_sunflowers(P, L, rnd):
    e = Ev()
    e.add(0.0, 'wind', d=L, g=0.2)
    for k in range(5):
        e.add(0.4 + k * 1.8, 'chirp', g=0.5)
    for k in range(4):
        e.add(1.0 + k * 2.2, 'note', n=k, o=1, g=0.5)
    e.add(F(3), 'pop')
    return e.l, {'mood': 'ambient'}


B_FUNCS = {'bounce': b_bounce, 'dance': b_dance, 'race': b_race, 'hide': b_hide, 'ballchase': b_ballchase, 'swim': b_swim, 'tower': b_tower,
           'look': b_look, 'sleep': b_sleep, 'pads': b_pads, 'parade': b_parade, 'whack': b_whack, 'love': b_love, 'carousel': b_carousel,
           'grow': b_grow, 'rain': b_rain, 'donut': b_donut, 'pizza': b_pizza, 'cake': b_cake, 'icecream': b_icecream, 'burger': b_burger,
           'fruitsort': b_fruitsort, 'cupwave': b_cupwave, 'popcorn': b_popcorn, 'choc': b_choc, 'juice': b_juice, 'jar': b_jar,
           'seasons': b_seasons, 'flowers': b_flowers, 'weather': b_weather, 'volcano': b_volcano, 'snowman': b_snowman, 'waves': b_waves,
           'mushrooms': b_mushrooms, 'daynight': b_daynight, 'garden': b_garden, 'aurora': b_aurora, 'sunflowers': b_sunflowers}


# ------------------------------------------------------------------ batch c
def _lines(e, n, start, gap, lines, k_acc='tring'):
    for i in range(n):
        acc = '*' in lines[i]
        e.add(F(start + i * gap), k_acc if acc else 'ding', n=i + (2 if acc else 0), g=0.75 if acc else 0.6)


def c_weetje(d, L):
    a = d['a']
    lines = a['lines']
    n = len(lines)
    extra = a.get('extra')
    e = Ev()
    e.add(F(2), 'pop', n=0, g=0.5)
    e.add(F(1), 'boing', g=0.7, p=3)
    if extra:
        for i in range(extra[1]):
            e.add(F(14 + i * 9), 'plop', n=i, g=0.5)
    start = 20 if not extra else 22 + extra[1] * 5
    gap = 22 if n < 4 else 20
    _lines(e, n, start, gap, lines)
    e.add(0.0, 'shimmer', d=2.5, g=0.35)
    return e.l, {}


def c_num(d, L):
    a = d['a']
    lines = a['lines']
    e = Ev()
    e.add(F(2), 'pop', n=0, g=0.5)
    e.add(F(3), 'boing', g=0.9, p=6)
    e.add(F(3), 'tring', g=0.8)
    if a.get('icon'):
        e.add(F(14), 'plop', n=3, g=0.5)
    _lines(e, len(lines), 24, 22, lines)
    return e.l, {}


def c_bars(d, L):
    a = d['a']
    bars = a['bars']
    lines = a['lines']
    n = len(bars)
    e = Ev()
    e.add(F(2), 'pop', n=0, g=0.5)
    for i in range(n):
        f0 = 8 + i * 14
        e.add(F(f0), 'rise', d=26 / FPS, g=0.6, f0=250 + i * 60, f1=700 + i * 150)
        e.add(F(f0 + 26), 'thud', g=0.45, f=110)
        e.add(F(f0 + 26), 'ding', n=2 + i * 2, g=0.5)
    _lines(e, len(lines), 8 + n * 14 + 20, 20, lines)
    return e.l, {}


def c_quiz(d, L):
    a = d['a']
    q = a['q']
    e = Ev()
    R = 144
    C0 = 72
    if a.get('icon'):
        e.add(F(1), 'pop', n=2, g=0.6)
    for i in range(len(q)):
        e.add(F(4 + i * 8), 'pop', n=i, g=0.6)
    for i in range(3):
        f0 = 22 + i * 10
        e.add(F(f0), 'whoosh', d=0.5, g=0.45, f0=500, f1=2800)
        e.add(F(f0 + 16), 'tok', g=0.7)
    for k in range(3):
        e.add(F(C0 + k * 24), 'count', n=k, g=0.8, q=1)
        e.add(F(C0 + k * 24 + 12), 'tock', g=0.6)
    e.add(F(C0 - 6), 'pop', n=5, g=0.3)
    e.add(F(R - 22), 'rise', d=22 / FPS, g=0.7, f0=300, f1=1300)
    e.add(F(R), 'reveal', g=1.0)
    e.add(F(R), 'down', d=0.7, g=0.6)
    if a.get('reveal') == 'confetti':
        e.add(F(R + 2), 'applause', d=2.2, g=0.45)
    else:
        e.add(F(R + 2), 'spark', g=0.8)
    e.add(F(R + 4), 'ding', n=4, g=0.8)
    for i in range(len(a['expl'])):
        e.add(F(R + 8 + i * 14), 'pop', n=i, g=0.5)
    return e.l, {'quiz': (F(C0), F(R))}


def c_orbit(d, L):
    a = d['a']
    e = Ev()
    _lines(e, len(a['lines']), 8, 18, a['lines'])
    for i, pl in enumerate(a['planets']):
        e.add(0.4 + i * 1.3, 'bliep', g=0.4, f=1000 + i * 250)
    e.add(0.0, 'hum', d=L, g=0.3)
    return e.l, {'mood': 'space'}


def c_trip(d, L):
    a = d['a']
    e = Ev()
    e.add(0.0, 'rocket', d=L, g=0.45)
    for (nm, r, x, f0, dur) in a['planets']:
        e.add(F(f0), 'whoosh', d=dur / FPS, g=0.5, f0=200, f1=900)
        e.add(F(f0 + 6), 'bliep', g=0.45)
    _lines(e, len(a['lines']), 6, 18, a['lines'])
    return e.l, {'mood': 'space'}


def c_land(d, L):
    a = d['a']
    e = Ev()
    e.add(F(1), 'rocket', d=F(128), g=0.4)
    e.add(F(40), 'bliep', g=0.4)
    e.add(F(132), 'thud', g=0.9, f=60)
    e.add(F(132), 'puff', g=0.5)
    e.add(F(135), 'tring', g=0.6)
    e.add(F(130), 'step', g=0.4)
    _lines(e, len(a['lines']), 8, 18, a['lines'])
    return e.l, {'mood': 'space'}


def c_astro(d, L):
    a = d['a']
    e = Ev()
    _lines(e, len(a['lines']), 14, 20, a['lines'])
    e.add(1.0, 'bliep', g=0.4)
    e.add(0.0, 'hum', d=L, g=0.3)
    return e.l, {'mood': 'space'}


def c_comet(d, L):
    a = d['a']
    e = Ev()
    for c in range(a.get('n', 3)):
        f0 = 4 + c * 46
        e.add(F(f0), 'whoosh', d=1.8, g=0.6, f0=400, f1=2500, peak=0.3)
        e.add(F(f0 + 8), 'zing', g=0.4)
    _lines(e, len(a['lines']), 10, 18, a['lines'])
    return e.l, {'mood': 'space'}


def c_scale(d, L):
    a = d['a']
    e = Ev()
    for i in range(len(a['items'])):
        e.add(F(14 + i * 18), 'pop', n=i, g=0.7)
    e.add(F(24), 'boing', g=0.5, p=6)
    _lines(e, len(a['lines']), 50, 18, a['lines'])
    return e.l, {'mood': 'space'}


def c_hole(d, L):
    a = d['a']
    e = Ev()
    e.add(0.0, 'swirl', d=L, g=0.9)
    e.add(0.0, 'rumble', d=L, g=0.4, shape='swell')
    _lines(e, len(a['lines']), 10, 20, a['lines'])
    return e.l, {'mood': 'space'}


def c_sat(d, L):
    a = d['a']
    e = Ev()
    for i in range(a.get('n', 2)):
        e.add(0.8 + i * 1.7, 'bliep', g=0.5, f=1500)
    _lines(e, len(a['lines']), 12, 20, a['lines'])
    e.add(0.0, 'hum', d=L, g=0.3)
    return e.l, {'mood': 'space'}


def c_dragon(d, L):
    a = d['a']
    e = Ev()
    for (x, y) in a.get('bursts', ((14, 60), (88, 134), (160, 190))):
        e.add(F(x), 'fire', d=(y - x + 18) / FPS, g=0.9)
        e.add(F(x), 'bang', g=0.35)
    e.add(F(6), 'pop', n=1)
    e.add(F(1), 'boing', g=0.6, p=-3)
    _lines(e, len(a['lines']), 10, 22, a['lines'])
    return e.l, {'mood': 'magic'}


def c_wand(d, L):
    a = d['a']
    items = a['items']
    n = len(items)
    step = (L * 24 - 20) // n
    e = Ev()
    for i in range(n):
        f = 14 + i * step
        e.add(F(f), 'magic', g=0.9, n=i)
        e.add(F(f + 8), 'pop', n=i, g=0.6)
        e.add(F(f + 6), 'boing', g=0.4, p=4)
    _lines(e, len(a['lines']), 10, 22, a['lines'])
    return e.l, {'mood': 'magic'}


def c_chest(d, L):
    a = d['a']
    e = Ev()
    e.add(F(40), 'creak', g=0.9, d=0.8)
    e.add(F(58), 'thud', g=0.6)
    e.add(F(50), 'magic', g=0.9)
    e.add(F(50), 'tring', g=0.7)
    for i in range(len(a['items'])):
        e.add(F(52 + i * 6 + 12), 'coin', n=i, g=0.7)
    e.add(F(52 + 24), 'applause', d=1.6, g=0.25)
    _lines(e, len(a['lines']), 20, 26, a['lines'])
    return e.l, {'mood': 'magic'}


def c_castle(d, L):
    a = d['a']
    e = Ev()
    e.add(0.0, 'wind', d=L, g=0.4)
    e.add(F(3), 'pop', n=0)
    e.add(F(10), 'magic', g=0.7)
    for k in range(3):
        e.add(1.5 + k * 2.2, 'bell', n=k * 2, g=0.5)
    _lines(e, len(a['lines']), 16, 24, a['lines'])
    if a.get('rainbow', True):
        e.add(4.5, 'magic', g=0.8)
    return e.l, {'mood': 'magic'}


def c_potion(d, L):
    a = d['a']
    ing = a['ingredients']
    n = len(ing)
    st = (L * 24 - 70) // n
    e = Ev()
    rr = random.Random(5)
    for i in range(n):
        f = 22 + i * st
        e.add(F(f), 'whoosh', d=0.7, g=0.3, f0=1500, f1=300)
        e.add(F(f + 22), 'splash', g=0.7)
        e.add(F(f + 24), 'bloep', g=0.5, p=i * 3)
    for i in range(8):
        e.add(0.5 + i * (L - 1.5) / 8 + rr.random() * 0.3, 'bloep', g=0.35, p=rr.randint(0, 9))
    fe = L * 24 - 66
    e.add(F(fe), 'bang', g=0.5)
    e.add(F(fe), 'magic', g=1.0)
    e.add(F(fe + 2), 'fanfare', g=0.45)
    _lines(e, len(a['lines']), 8, 20, a['lines'])
    return e.l, {'mood': 'magic'}


def c_unicorn(d, L):
    a = d['a']
    e = Ev()
    e.add(F(1), 'magic', g=0.7)
    e.add(0.0, 'hop', d=L, g=0.0)
    t = 0.0
    k = 0
    while t < L - 0.1:
        e.add(t + 0.5, 'step', g=0.4)
        t += 0.5
    for i in range(9):
        e.add(F(6 + i * 18), 'bloep', g=0.3, p=i % 6)
        e.add(F(6 + i * 18), 'note', n=i % 7, o=1, g=0.5)
    _lines(e, len(a['lines']), 16, 24, a['lines'])
    return e.l, {'mood': 'magic', 'beat': 0.5}


C_FUNCS = {'weetje': c_weetje, 'num': c_num, 'bars': c_bars, 'quiz': c_quiz, 'orbit': c_orbit, 'trip': c_trip, 'land': c_land, 'astro': c_astro,
           'comet': c_comet, 'scale': c_scale, 'hole': c_hole, 'sat': c_sat, 'dragon': c_dragon, 'wand': c_wand, 'chest': c_chest, 'castle': c_castle,
           'potion': c_potion, 'unicorn': c_unicorn}


# ------------------------------------------------------------------ alles
def load_meta():
    out = {}
    for f in sorted(os.listdir(META)):
        if f.startswith('meta-') and f.endswith('.json'):
            try:
                for m in json.load(open(os.path.join(META, f), encoding='utf-8')):
                    out[m['id']] = m
            except Exception:
                pass
    return out


def all_shorts():
    """Lijst dicts: id, c, t, s, tpl, ev, meta, batch. Alleen shorts waarvan de scenedefinitie bestaat."""
    meta = load_meta()
    res = []
    # a
    defaults = _a_defaults()
    jobs = {j['t']: j for j in load_a_jobs()}
    for sid, m in sorted(meta.items()):
        if sid > 's100':
            continue
        j = jobs.get(m['t'])
        if not j:
            continue
        p = dict(defaults.get(j['tpl'], {}))
        p.update(j['p'])
        L = 10.0
        res.append({'id': sid, 'c': m['c'], 't': m['t'], 's': L, 'tpl': j['tpl'], 'ev': A_FUNCS[j['tpl']](p, L, None), 'meta': {}, 'batch': 'a'})
    # b
    sys.path.insert(0, BL)
    try:
        from shorts_b_specs import SP
    except Exception:
        SP = []
    for s in SP:
        sid, title, cat, tags, tpl, P, bg, secs = s
        if sid not in meta:
            continue
        L = float(secs)
        ev, mt = B_FUNCS[tpl](P, L, None)
        res.append({'id': sid, 'c': cat, 't': title, 's': L, 'tpl': tpl, 'ev': ev, 'meta': mt, 'batch': 'b'})
    # c
    try:
        import shorts_c_data as D
        for d in D.S:
            sid = d['id']
            if sid not in meta:
                continue
            L = float(d['s'])
            ev, mt = C_FUNCS[d['tpl']](d, L)
            res.append({'id': sid, 'c': d['c'], 't': d['t'], 's': L, 'tpl': d['tpl'], 'ev': ev, 'meta': mt, 'batch': 'c'})
    except ImportError:
        pass
    res.sort(key=lambda x: x['id'])
    for r in res:
        r['ev'] = [x for x in r['ev'] if x['t'] < r['s'] - 0.02]
        r['ev'].sort(key=lambda x: (x['t'], x['k']))
    return res


if __name__ == '__main__':
    al = all_shorts()
    for b in 'abc':
        sel = {r['id']: {'t': r['t'], 'tpl': r['tpl'], 's': r['s'], 'meta': r['meta'], 'ev': r['ev']} for r in al if r['batch'] == b}
        json.dump(sel, open(os.path.join(HERE, 'events-%s.json' % b), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print('%d shorts, %d events totaal' % (len(al), sum(len(r['ev']) for r in al)))
