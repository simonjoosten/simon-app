"""Kleine pure-Python synthesizer voor de shorts-geluiden (geen numpy nodig).

Alle klankfuncties geven een lijst floats (mono, SR Hz) terug; `Mixer` zet ze op een tijdlijn
(met een apart 'galm-zend'-kanaal) en `Mixer.finish()` levert de uiteindelijke, genormaliseerde mix.
Alles is deterministisch: willekeur komt uit `random.Random(seed)`.
"""
import math, random, struct, wave

SR = 16000
TAU = 2 * math.pi


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def _n(dur):
    return max(1, int(dur * SR))


# ------------------------------------------------------------------ basis
def noise(n, rng):
    r = rng.random
    return [r() * 2 - 1 for _ in range(n)]


def lowpass(x, fc):
    a = 1.0 - math.exp(-TAU * fc / SR)
    y = 0.0
    out = []
    ap = out.append
    for v in x:
        y += a * (v - y)
        ap(y)
    return out


def highpass(x, fc):
    a = 1.0 - math.exp(-TAU * fc / SR)
    y = 0.0
    out = []
    ap = out.append
    for v in x:
        y += a * (v - y)
        ap(v - y)
    return out


def sweep_bandpass(x, f0, f1, q=2.0):
    """Bandpass (2-polig HP + 2-polig LP, altijd stabiel) waarvan de middenfrequentie exponentieel van f0 naar f1 loopt."""
    n = len(x)
    w = 1.0 + 1.5 / max(0.3, q)
    r = (f1 / f0) ** (1.0 / max(1, n - 1))
    fc = f0
    l1 = l2 = h1 = h2 = 0.0
    out = []
    ap = out.append
    k = TAU / SR
    for v in x:
        al = min(1.0, k * fc * w)
        ah = min(1.0, k * fc / w)
        l1 += al * (v - l1)
        l2 += al * (l1 - l2)
        h1 += ah * (l2 - h1)
        h2 += ah * (h1 - h2)
        ap((l2 - h2) * 2.2)
        fc *= r
    return out


def bandpass(x, fc, q=2.0):
    return sweep_bandpass(x, fc, fc, q)


def envelope(n, attack=0.005, decay=None, hold=0.0):
    """Lineaire attack, daarna exponentiele uitsterving (decay = per seconde)."""
    a = max(1, int(attack * SR))
    h = int(hold * SR)
    out = []
    e = 1.0
    d = math.exp(-(decay or 0) / SR)
    for i in range(n):
        g = min(1.0, (i + 1) / a)
        out.append(g * e)
        if i >= a + h:
            e *= d
    return out


def apply_env(x, env):
    return [a * b for a, b in zip(x, env)]


def fade(x, fin=0.0, fout=0.0):
    n = len(x)
    a = int(fin * SR)
    b = int(fout * SR)
    for i in range(min(a, n)):
        x[i] *= i / a
    for i in range(min(b, n)):
        x[n - 1 - i] *= i / b
    return x


def scale(x, g):
    return [v * g for v in x]


def tail_trim(x, thr=0.0008):
    n = len(x)
    while n > 1 and abs(x[n - 1]) < thr:
        n -= 1
    return x[:n]


# ------------------------------------------------------------------ oscillatoren
def partials(freq, dur, parts, attack=0.003, rel=0.01):
    """Opgetelde sinussen: parts = [(verhouding, amp, uitsterving/s)]. Recurrente sinus (snel)."""
    n = _n(dur)
    out = [0.0] * n
    for ratio, amp, dec in parts:
        fr = freq * ratio
        if fr >= SR * 0.46 or amp == 0:
            continue
        w = TAU * fr / SR
        c = 2 * math.cos(w)
        y1 = 0.0
        y2 = -math.sin(w)
        e = amp
        d = math.exp(-dec / SR)
        for k in range(n):
            y = c * y1 - y2
            y2 = y1
            y1 = y
            out[k] += y * e
            e *= d
    a = max(1, int(attack * SR))
    for i in range(min(a, n)):
        out[i] *= i / a
    r = min(n, max(1, int(rel * SR)))
    for i in range(r):
        out[n - 1 - i] *= i / r
    return out


def tone_sweep(f0, f1, dur, curve=4.0, wave='sine', decay=6.0, vib=0.0, vib_hz=6.0, attack=0.004):
    """Toon met glijdende toonhoogte f0 -> f1 (exp. curve), uitsterving `decay`."""
    n = _n(dur)
    ph = 0.0
    out = []
    ap = out.append
    for i in range(n):
        t = i / SR
        u = math.exp(-curve * t / dur) if dur > 0 else 0
        f = f1 + (f0 - f1) * u
        if vib:
            f *= 1 + vib * math.sin(TAU * vib_hz * t)
        ph += TAU * f / SR
        if wave == 'sine':
            s = math.sin(ph)
        elif wave == 'tri':
            s = 2 / math.pi * math.asin(math.sin(ph))
        elif wave == 'sq':
            s = 1.0 if math.sin(ph) > 0 else -1.0
            s *= 0.6
        else:  # saw
            s = ((ph / TAU) % 1.0) * 2 - 1
            s *= 0.7
        ap(s * math.exp(-decay * t) * min(1.0, i / max(1, attack * SR)))
    return out


def organ(freq, dur, harm=(1.0, 0.5, 0.25, 0.12), attack=0.02, release=0.08, vib=0.0):
    """Aanhoudende toon (pad/orgel/strijkers-achtig) met zachte aan/uit."""
    n = _n(dur)
    out = [0.0] * n
    for h, amp in enumerate(harm, 1):
        fr = freq * h
        if fr >= SR * 0.45:
            break
        w = TAU * fr / SR
        c = 2 * math.cos(w)
        y1 = 0.0
        y2 = -math.sin(w)
        for k in range(n):
            y = c * y1 - y2
            y2 = y1
            y1 = y
            out[k] += y * amp
    a = max(1, int(attack * SR))
    r = max(1, int(release * SR))
    for i in range(min(a, n)):
        out[i] *= i / a
    for i in range(min(r, n)):
        out[n - 1 - i] *= i / r
    if vib:
        lfo = TAU * 5.2 / SR
        for k in range(n):
            out[k] *= 1 + vib * math.sin(lfo * k)
    return out


def karplus(freq, dur, rng, decay=0.996, bright=0.5, gain=1.0):
    """Gitaar/ukelele/pizzicato (Karplus-Strong)."""
    L = max(2, int(SR / freq))
    buf = [(rng.random() * 2 - 1) for _ in range(L)]
    # zachte aanslag: eerst even filteren
    for _ in range(int((1 - bright) * 3)):
        buf = [(buf[i] + buf[(i + 1) % L]) * 0.5 for i in range(L)]
    n = _n(dur)
    out = []
    ap = out.append
    i = 0
    for _ in range(n):
        j = i + 1
        if j == L:
            j = 0
        v = buf[i]
        ap(v * gain)
        buf[i] = (v + buf[j]) * 0.5 * decay
        i = j
    r = min(n, int(0.02 * SR))
    for k in range(r):
        out[n - 1 - k] *= k / r
    return out


# ------------------------------------------------------------------ instrumenten (noten)
_cache = {}


def _memo(key, fn):
    v = _cache.get(key)
    if v is None:
        if len(_cache) > 600:
            _cache.clear()
        v = _cache[key] = fn()
    return v


def marimba(m, dur=0.6):
    f = mtof(m)
    return _memo(('mar', m, round(dur, 2)), lambda: partials(f, dur, [(1, 1.0, 7), (3.9, 0.35, 22), (9.2, 0.1, 45)], 0.002))


def xylophone(m, dur=0.45):
    f = mtof(m)
    return _memo(('xyl', m, round(dur, 2)), lambda: partials(f, dur, [(1, 1.0, 11), (3.0, 0.5, 30), (6.0, 0.2, 60)], 0.0015))


def bell(m, dur=1.0, bright=1.0):
    f = mtof(m)
    return _memo(('bel', m, round(dur, 2), bright), lambda: partials(f, dur, [(1, 1.0, 3.5), (2.0, 0.5, 5), (2.76, 0.4 * bright, 7), (5.4, 0.2 * bright, 12), (8.9, 0.08 * bright, 20)], 0.002))


def glock(m, dur=0.9):
    f = mtof(m)
    return _memo(('glo', m, round(dur, 2)), lambda: partials(f, dur, [(1, 1.0, 4), (2.76, 0.25, 8), (5.4, 0.1, 16)], 0.001))


def sinepluck(m, dur=0.5):
    f = mtof(m)
    return _memo(('sp', m, round(dur, 2)), lambda: partials(f, dur, [(1, 1.0, 6), (2, 0.3, 10), (3, 0.1, 14)], 0.004))


def bassnote(m, dur=0.4, punch=1.0):
    f = mtof(m)
    return _memo(('bas', m, round(dur, 2), punch), lambda: partials(f, dur, [(1, 1.0, 4.0 / max(0.15, dur)), (2, 0.45 * punch, 9), (3, 0.2 * punch, 14)], 0.004, 0.03))


def subbass(m, dur=0.6):
    f = mtof(m)
    return _memo(('sub', m, round(dur, 2)), lambda: partials(f, dur, [(1, 1.0, 2.5), (2, 0.12, 6)], 0.01, 0.05))


def synth_lead(m, dur=0.3):
    f = mtof(m)
    return _memo(('led', m, round(dur, 2)), lambda: organ(f, dur, (1.0, 0.0, 0.33, 0.0, 0.2, 0.0, 0.14, 0.0, 0.1), 0.006, 0.06))


def brass(m, dur=0.5):
    f = mtof(m)
    return _memo(('brs', m, round(dur, 2)), lambda: organ(f, dur, (1.0, 0.8, 0.6, 0.45, 0.3, 0.2, 0.12), 0.03, 0.08))


def pad_note(m, dur=2.0):
    f = mtof(m)

    def mk():
        a = organ(f, dur, (1.0, 0.35, 0.12), min(0.5, dur * 0.4), min(0.6, dur * 0.4), 0.0)
        b = organ(f * 1.004, dur, (1.0, 0.3, 0.1), min(0.5, dur * 0.4), min(0.6, dur * 0.4), 0.0)
        return [(x + y) * 0.5 for x, y in zip(a, b)]
    return _memo(('pad', m, round(dur, 1)), mk)


def flute(m, dur=0.5):
    f = mtof(m)
    return _memo(('flu', m, round(dur, 2)), lambda: organ(f, dur, (1.0, 0.2, 0.06), 0.04, 0.12, 0.012))


def pizz(m, dur=0.3, seed=0):
    f = mtof(m)
    return _memo(('piz', m, round(dur, 2)), lambda: karplus(f, dur, random.Random(m * 31 + 1), 0.985, 0.35))


def ukulele(m, dur=0.7):
    f = mtof(m)
    return _memo(('uku', m, round(dur, 2)), lambda: karplus(f, dur, random.Random(m * 17 + 5), 0.994, 0.55))


def harp(m, dur=1.0):
    f = mtof(m)
    return _memo(('hrp', m, round(dur, 2)), lambda: karplus(f, dur, random.Random(m * 13 + 9), 0.9965, 0.8))


INSTR = {
    'marimba': marimba, 'xylophone': xylophone, 'bell': bell, 'glock': glock, 'sinepluck': sinepluck,
    'bass': bassnote, 'sub': subbass, 'lead': synth_lead, 'brass': brass, 'pad': pad_note, 'flute': flute,
    'pizz': pizz, 'uke': ukulele, 'harp': harp,
}


# ------------------------------------------------------------------ percussie
def kick(g=1.0):
    def mk():
        n = _n(0.32)
        ph = 0.0
        out = []
        for i in range(n):
            t = i / SR
            f = 42 + 110 * math.exp(-t * 32)
            ph += TAU * f / SR
            out.append(math.sin(ph) * math.exp(-t * 9) * min(1.0, i / 12))
        return out
    return scale(_memo(('kick',), mk), g)


def snare(rng, g=1.0):
    def mk():
        r = random.Random(77)
        n = _n(0.22)
        nz = highpass(noise(n, r), 1200)
        out = []
        ph = 0.0
        for i in range(n):
            t = i / SR
            ph += TAU * 185 / SR
            out.append(nz[i] * math.exp(-t * 21) * 0.7 + math.sin(ph) * math.exp(-t * 28) * 0.5)
        return out
    return scale(_memo(('snare',), mk), g)


def hat(rng=None, g=1.0, open_=False):
    def mk():
        r = random.Random(5 if not open_ else 6)
        n = _n(0.22 if open_ else 0.05)
        nz = highpass(noise(n, r), 3500)
        dec = 14 if open_ else 90
        return [nz[i] * math.exp(-i / SR * dec) for i in range(n)]
    return scale(_memo(('hat', open_), mk), g)


def clap(g=1.0):
    def mk():
        r = random.Random(9)
        n = _n(0.2)
        nz = bandpass(noise(n, r), 1500, 1.2)
        out = [0.0] * n
        for off, a in ((0, 0.8), (0.011, 0.7), (0.023, 0.8), (0.035, 1.0)):
            i0 = int(off * SR)
            for i in range(n - i0):
                out[i0 + i] += nz[i] * a * math.exp(-i / SR * (110 if off < 0.035 else 22))
        return [v * 0.25 for v in out]
    return scale(_memo(('clap',), mk), g)


def shaker(g=1.0):
    def mk():
        r = random.Random(11)
        n = _n(0.09)
        nz = highpass(noise(n, r), 4500)
        return [nz[i] * math.sin(math.pi * i / n) ** 2 for i in range(n)]
    return scale(_memo(('shaker',), mk), g)


def tik(freq=1700, g=1.0, dec=160):
    return scale(_memo(('tik', freq, dec), lambda: partials(freq, 0.08, [(1, 1.0, dec), (2.3, 0.3, dec * 1.5)], 0.0005)), g)


def tok(freq=700, g=1.0):
    return scale(_memo(('tok', freq), lambda: partials(freq, 0.1, [(1, 1.0, 90), (1.6, 0.4, 130)], 0.0008)), g)


def woodblock(freq=900, g=1.0):
    return scale(_memo(('wb', freq), lambda: partials(freq, 0.12, [(1, 1.0, 55), (2.4, 0.5, 90), (4.1, 0.2, 130)], 0.0005)), g)


# ------------------------------------------------------------------ geluidseffecten
def _rng(seed):
    return random.Random(seed)


def sfx_boing(seed=1, f0=240, g=1.0):
    n = _n(0.5)
    out = []
    ph = 0.0
    for i in range(n):
        t = i / SR
        f = f0 * (1 + 1.2 * math.exp(-t * 7) + 0.35 * math.sin(TAU * 13 * t) * math.exp(-t * 6))
        ph += TAU * f / SR
        out.append((math.sin(ph) + 0.35 * math.sin(2 * ph)) * math.exp(-t * 6) * min(1.0, i / 30))
    return scale(out, 0.55 * g)


def sfx_pop(seed=1, f0=350, g=1.0):
    n = _n(0.11)
    out = []
    ph = 0.0
    for i in range(n):
        t = i / SR
        f = f0 + 900 * (1 - math.exp(-t * 90))
        ph += TAU * f / SR
        out.append(math.sin(ph) * math.exp(-t * 48) * min(1.0, i / 12))
    return scale(out, 0.9 * g)


def sfx_bloep(seed=1, f0=300, g=1.0):
    n = _n(0.2)
    out = []
    ph = 0.0
    for i in range(n):
        t = i / SR
        f = f0 + 450 * (1 - math.exp(-t * 22))
        ph += TAU * f / SR
        out.append(math.sin(ph) * math.exp(-t * 17) * min(1.0, i / 16))
    return scale(out, 0.8 * g)


def sfx_ding(m=84, g=1.0, dur=0.9):
    return scale(bell(m, dur, 0.7), 0.5 * g)


def sfx_tring(m=88, g=1.0):
    a = bell(m, 0.9, 0.8)
    b = bell(m + 7, 1.2, 0.8)
    out = [0.0] * len(b)
    for i, v in enumerate(a):
        out[i] += v * 0.4
    off = int(0.08 * SR)
    for i, v in enumerate(b):
        if i + off < len(out):
            out[i + off] += v * 0.45
    return out


def sfx_coin(m=83, g=1.0):
    a = partials(mtof(m), 0.07, [(1, 1.0, 20), (2, 0.5, 30), (3, 0.3, 40)], 0.001)
    b = partials(mtof(m + 5), 0.5, [(1, 1.0, 7), (2, 0.5, 10), (3, 0.3, 14)], 0.001)
    out = [0.0] * (len(b) + int(0.07 * SR))
    for i, v in enumerate(a):
        out[i] += v * 0.4
    off = int(0.065 * SR)
    for i, v in enumerate(b):
        out[off + i] += v * 0.4
    return scale(out, g)


def sfx_whoosh(dur=0.7, seed=1, f0=300, f1=2500, g=1.0, peak=0.45):
    rng = _rng(seed)
    n = _n(dur)
    x = sweep_bandpass(noise(n, rng), f0, f1, 1.1)
    out = []
    for i in range(n):
        u = i / n
        u2 = u / peak if u < peak else (1 - u) / (1 - peak)
        out.append(x[i] * (math.sin(math.pi / 2 * max(0.0, u2)) ** 1.5))
    return scale(out, 1.5 * g)


def sfx_thud(seed=1, f=75, g=1.0, dur=0.3):
    rng = _rng(seed)
    n = _n(dur)
    nz = lowpass(noise(n, rng), 600)
    out = []
    ph = 0.0
    for i in range(n):
        t = i / SR
        ph += TAU * (f + 60 * math.exp(-t * 40)) / SR
        out.append(math.sin(ph) * math.exp(-t * 14) * min(1.0, i / 10) + nz[i] * math.exp(-t * 60) * 0.6)
    return scale(out, 1.1 * g)


def sfx_splash(seed=1, g=1.0):
    rng = _rng(seed)
    n = _n(0.5)
    nz = lowpass(noise(n, rng), 3200)
    out = []
    ph = 0.0
    for i in range(n):
        t = i / SR
        ph += TAU * (900 - 650 * (1 - math.exp(-t * 9))) / SR
        out.append(nz[i] * math.exp(-t * 7) * 0.5 + math.sin(ph) * math.exp(-t * 12) * 0.5)
    return scale(out, g)


def sfx_plop(seed=1, f0=420, g=1.0):
    return sfx_bloep(seed, f0, g)


def sfx_splat(seed=1, g=1.0):
    rng = _rng(seed)
    n = _n(0.25)
    nz = lowpass(noise(n, rng), 1800)
    out = [nz[i] * math.exp(-i / SR * 18) * 1.6 for i in range(n)]
    th = sfx_thud(seed, 90, 0.8, 0.2)
    for i, v in enumerate(th):
        out[i] += v
    return scale(out, g)


def sfx_crunch(seed=1, g=1.0):
    rng = _rng(seed)
    n = _n(0.3)
    out = [0.0] * n
    for k in range(6):
        i0 = int((k * 0.035 + rng.random() * 0.02) * SR)
        m = int(0.02 * SR)
        nz = highpass(noise(m, rng), 900)
        for i in range(min(m, n - i0)):
            out[i0 + i] += nz[i] * math.exp(-i / SR * 150) * (1.0 - k * 0.1)
    return scale(out, 1.4 * g)


def sfx_clack(seed=1, f=2200, g=1.0):
    return scale(partials(f, 0.12, [(1, 1.0, 90), (1.5, 0.5, 120), (2.7, 0.3, 170)], 0.0004), 0.9 * g)


def sfx_bang(seed=1, g=1.0):
    rng = _rng(seed)
    n = _n(0.6)
    nz = lowpass(noise(n, rng), 2500)
    out = []
    ph = 0.0
    for i in range(n):
        t = i / SR
        ph += TAU * (55 + 80 * math.exp(-t * 30)) / SR
        out.append(nz[i] * math.exp(-t * 11) * 0.9 + math.sin(ph) * math.exp(-t * 7))
    return scale(out, 0.9 * g)


def sfx_rattle(seed=1, g=1.0, dur=0.5, count=16):
    rng = _rng(seed)
    n = _n(dur)
    out = [0.0] * n
    for k in range(count):
        t0 = (k / count) ** 0.8 * dur * 0.9 + rng.random() * 0.012
        c = sfx_clack(seed + k, 900 + rng.random() * 1800, 0.7)
        i0 = int(t0 * SR)
        a = (1 - k / count * 0.6)
        for i, v in enumerate(c):
            if i0 + i < n:
                out[i0 + i] += v * a
    return scale(out, g)


def sfx_spark(seed=1, g=1.0, dur=0.6):
    rng = _rng(seed)
    n = _n(dur)
    out = [0.0] * n
    for k in range(7):
        f = 2800 + rng.random() * 3600
        t0 = rng.random() * dur * 0.7
        c = partials(f, 0.12, [(1, 1.0, 40)], 0.001)
        i0 = int(t0 * SR)
        for i, v in enumerate(c):
            if i0 + i < n:
                out[i0 + i] += v * 0.35
    return scale(out, g)


def sfx_step(seed=1, g=1.0):
    rng = _rng(seed)
    n = _n(0.12)
    nz = lowpass(noise(n, rng), 900)
    return [nz[i] * math.exp(-i / SR * 38) * 2.0 * g for i in range(n)]


def sfx_squeak(seed=1, f0=900, g=1.0):
    n = _n(0.16)
    out = []
    ph = 0.0
    for i in range(n):
        t = i / SR
        ph += TAU * (f0 + 700 * min(1.0, t / 0.07)) / SR
        out.append(math.sin(ph) * math.sin(math.pi * i / n) ** 0.7)
    return scale(out, 0.5 * g)


def sfx_whistle(seed=1, g=1.0, dur=0.45):
    rng = _rng(seed)
    n = _n(dur)
    nz = bandpass(noise(n, rng), 2500, 5)
    out = []
    ph = 0.0
    for i in range(n):
        t = i / SR
        ph += TAU * (2350 + 70 * math.sin(TAU * 34 * t)) / SR
        out.append((math.sin(ph) * 0.8 + nz[i] * 1.5) * min(1.0, i / 120) * (1 if i < n - 400 else (n - i) / 400))
    return scale(out, 0.55 * g)


def sfx_rumble(dur=2.0, seed=1, g=1.0, shape='flat', f=140):
    rng = _rng(seed)
    n = _n(dur)
    nz = lowpass(noise(n, rng), f)
    out = []
    ph = 0.0
    for i in range(n):
        u = i / n
        if shape == 'rise':
            a = u ** 1.6
        elif shape == 'fall':
            a = (1 - u) ** 1.4
        elif shape == 'swell':
            a = math.sin(math.pi * u) ** 1.3
        else:
            a = min(1.0, u * 8, (1 - u) * 8)
        ph += TAU * (38 + 14 * math.sin(TAU * 0.9 * i / SR)) / SR
        out.append((nz[i] * 5 + math.sin(ph) * 0.6) * a)
    return scale(out, g)


def sfx_engine(dur=3.0, seed=1, g=1.0, f=62):
    n = _n(dur)
    out = []
    ph = 0.0
    for i in range(n):
        t = i / SR
        ff = f * (1 + 0.04 * math.sin(TAU * 0.7 * t) + 0.015 * math.sin(TAU * 9 * t))
        ph += TAU * ff / SR
        s = math.sin(ph) + 0.5 * math.sin(2 * ph) + 0.3 * math.sin(3 * ph) + 0.15 * math.sin(5 * ph)
        out.append(s * min(1.0, t / 0.2, (dur - t) / 0.3))
    return scale(out, 0.35 * g)


def sfx_rocket(dur=6.0, seed=1, g=1.0):
    rng = _rng(seed)
    n = _n(dur)
    nz = noise(n, rng)
    lp = lowpass(nz, 700)
    lp2 = lowpass(nz, 2200)
    out = []
    for i in range(n):
        u = i / n
        a = min(1.0, u * 6) * (0.4 + 0.6 * u)
        out.append((lp[i] * (1 - 0.5 * u) + lp2[i] * 0.35 * u) * a * 4)
    return scale(out, g)


def sfx_fire(dur=1.0, seed=1, g=1.0):
    rng = _rng(seed)
    n = _n(dur)
    nz = bandpass(noise(n, rng), 700, 0.9)
    lo = lowpass(noise(n, rng), 250)
    out = []
    for i in range(n):
        u = i / n
        a = min(1.0, u * 12, (1 - u) * 6) * (0.8 + 0.2 * math.sin(TAU * 17 * i / SR))
        out.append((nz[i] * 1.6 + lo[i] * 3.0) * a)
    return scale(out, 0.8 * g)


def sfx_wind(dur=4.0, seed=1, g=1.0):
    rng = _rng(seed)
    n = _n(dur)
    nz = noise(n, rng)
    x = sweep_bandpass(nz, 350, 900, 0.8)
    out = []
    p1, p2 = rng.random() * 6, rng.random() * 6
    for i in range(n):
        t = i / SR
        a = 0.55 + 0.45 * math.sin(TAU * 0.33 * t + p1) * math.sin(TAU * 0.19 * t + p2)
        out.append(x[i] * a * min(1.0, t / 0.4, (dur - t) / 0.4))
    return scale(out, 2.0 * g)


def sfx_surf(dur=4.0, seed=1, g=1.0):
    rng = _rng(seed)
    n = _n(dur)
    nz = lowpass(noise(n, rng), 1800)
    out = []
    for i in range(n):
        t = i / SR
        a = (0.5 + 0.5 * math.sin(TAU * 0.22 * t - 1.0)) ** 1.5
        out.append(nz[i] * a * min(1.0, t / 0.4, (dur - t) / 0.4))
    return scale(out, 2.4 * g)


def sfx_rain(dur=3.0, seed=1, g=1.0, density=1.0):
    rng = _rng(seed)
    n = _n(dur)
    nz = highpass(noise(n, rng), 2500)
    out = []
    for i in range(n):
        t = i / SR
        out.append(nz[i] * 0.35 * min(1.0, t / 0.3, (dur - t) / 0.3))
    for k in range(int(dur * 25 * density)):
        i0 = int(rng.random() * max(1, n - 600))
        c = partials(900 + rng.random() * 1800, 0.03, [(1, 1.0, 130)], 0.0005)
        for i, v in enumerate(c):
            if i0 + i < n:
                out[i0 + i] += v * 0.25
    return scale(out, g)


def sfx_chirp(seed=1, g=1.0, base=3200):
    rng = _rng(seed)
    out = []
    t_total = 0.0
    k = 3 + int(rng.random() * 3)
    seq = []
    for j in range(k):
        f0 = base * (0.85 + rng.random() * 0.4)
        c = tone_sweep(f0 * 1.25, f0 * 0.85, 0.07, 3.0, 'sine', 8.0, 0.02, 40, 0.004)
        seq.append((t_total, c))
        t_total += 0.09 + rng.random() * 0.05
    n = _n(t_total + 0.12)
    out = [0.0] * n
    for t0, c in seq:
        i0 = int(t0 * SR)
        for i, v in enumerate(c):
            if i0 + i < n:
                out[i0 + i] += v
    return scale(out, 0.38 * g)


def sfx_chuff(seed=1, g=1.0):
    rng = _rng(seed)
    n = _n(0.13)
    nz = lowpass(noise(n, rng), 1500)
    return [nz[i] * math.exp(-i / SR * 28) * min(1.0, i / 40) * 1.8 * g for i in range(n)]


def sfx_chop(seed=1, g=1.0):
    n = _n(0.09)
    rng = _rng(seed)
    nz = lowpass(noise(n, rng), 500)
    out = []
    ph = 0.0
    for i in range(n):
        t = i / SR
        ph += TAU * 85 / SR
        out.append((math.sin(ph) * 0.9 + nz[i] * 2) * math.exp(-t * 38) * min(1.0, i / 25))
    return scale(out, g)


def sfx_servo(seed=1, g=1.0, dur=0.35, f0=260, f1=420):
    return scale(tone_sweep(f0, f1, dur, -2.0, 'saw', 3.0, 0.03, 18, 0.03), 0.3 * g)


def sfx_creak(seed=1, g=1.0, dur=0.8):
    rng = _rng(seed)
    n = _n(dur)
    out = []
    ph = 0.0
    for i in range(n):
        t = i / SR
        ph += TAU * (160 + 140 * (t / dur) + 30 * math.sin(TAU * 11 * t)) / SR
        s = ((ph / TAU) % 1.0) * 2 - 1
        out.append(s * (0.5 + 0.5 * math.sin(TAU * 23 * t)) * math.sin(math.pi * t / dur) * 0.5)
    return scale(lowpass(out, 900), 1.5 * g)


def sfx_bliep(seed=1, g=1.0, f=1400):
    n = _n(0.14)
    out = []
    for i in range(n):
        t = i / SR
        out.append(math.sin(TAU * f * t + 2.0 * math.sin(TAU * f * 0.5 * t) * math.exp(-t * 30)) * math.exp(-t * 18) * min(1.0, i / 12))
    return scale(out, 0.5 * g)


def sfx_zoom(dur=0.8, seed=1, g=1.0, f=210):
    n = _n(dur)
    out = []
    ph = 0.0
    for i in range(n):
        t = i / SR
        ph += TAU * f * (1 + 0.05 * math.sin(TAU * 25 * t)) / SR
        s = ((ph / TAU) % 1.0) * 2 - 1
        out.append(s * math.sin(math.pi * i / n) ** 0.6)
    return scale(lowpass(out, 1400), 0.5 * g)


def sfx_applause(dur=1.6, seed=1, g=1.0):
    rng = _rng(seed)
    n = _n(dur)
    out = [0.0] * n
    nz = bandpass(noise(n, rng), 2200, 0.8)
    for k in range(int(dur * 70)):
        t0 = rng.random() * dur
        i0 = int(t0 * SR)
        m = int(0.025 * SR)
        a = (0.5 + 0.5 * rng.random()) * min(1.0, t0 / 0.15, (dur - t0) / 0.5)
        for i in range(min(m, n - i0)):
            out[i0 + i] += nz[i0 + i] * math.exp(-i / SR * 110) * a
    return scale(out, 3.2 * g)


def sfx_cheer(dur=1.4, seed=1, g=1.0):
    ap = sfx_applause(dur, seed, 0.8)
    rng = _rng(seed + 5)
    n = len(ap)
    nz = noise(n, rng)
    v = sweep_bandpass(nz, 700, 1100, 3.0)
    for i in range(n):
        u = i / n
        ap[i] += v[i] * math.sin(math.pi * u) ** 1.5 * 0.9
    return scale(ap, g)


def sfx_fanfare(m=72, g=1.0):
    notes = [(0.0, 0, 0.14), (0.14, 4, 0.14), (0.28, 7, 0.14), (0.42, 12, 0.7)]
    out = [0.0] * _n(1.3)
    for t0, iv, d in notes:
        c = brass(m + iv, d + 0.1)
        i0 = int(t0 * SR)
        for i, v in enumerate(c):
            out[i0 + i] += v * 0.28
    c = brass(m + 16, 0.7)
    i0 = int(0.42 * SR)
    for i, v in enumerate(c):
        out[i0 + i] += v * 0.2
    return scale(out, g)


def sfx_magic(m=76, g=1.0, dur=0.9):
    rng = _rng(m)
    n = _n(dur)
    out = [0.0] * n
    degs = [0, 2, 4, 7, 9, 12, 14, 16]
    for k, d in enumerate(degs):
        c = glock(m + d, 0.5)
        i0 = int(k * 0.055 * SR)
        for i, v in enumerate(c):
            if i0 + i < n:
                out[i0 + i] += v * 0.3
    sp = sfx_spark(m, 0.7, 0.8)
    for i, v in enumerate(sp):
        if i + int(0.1 * SR) < n:
            out[i + int(0.1 * SR)] += v
    return scale(out, g)


def sfx_rise(dur=0.6, f0=300, f1=1200, g=1.0):
    n = _n(dur)
    out = []
    ph = 0.0
    for i in range(n):
        u = i / n
        ph += TAU * (f0 * (f1 / f0) ** u) / SR
        out.append((math.sin(ph) + 0.3 * math.sin(2 * ph)) * min(1.0, i / 200) * (1 - u ** 3) * 0.5)
    return scale(out, g)


def sfx_swish(seed=1, g=1.0):
    return sfx_whoosh(0.28, seed, 1500, 4500, 0.7 * g, 0.35)


def sfx_kick_ball(seed=1, g=1.0):
    return sfx_thud(seed, 95, 1.0 * g, 0.2)


def sfx_clock_tick(g=1.0):
    return scale(partials(1500, 0.06, [(1, 1.0, 140), (2.2, 0.4, 190)], 0.0004), 0.9 * g)


def sfx_clock_tock(g=1.0):
    return scale(partials(1000, 0.07, [(1, 1.0, 120), (2.2, 0.4, 170)], 0.0004), 0.9 * g)


def sfx_beep(m=76, g=1.0, dur=0.22):
    return scale(organ(mtof(m), dur, (1.0, 0.0, 0.3, 0.0, 0.15), 0.004, 0.03), 0.28 * g)


def sfx_cymbal(dur=1.5, seed=1, g=1.0):
    rng = _rng(seed)
    n = _n(dur)
    nz = highpass(noise(n, rng), 3800)
    return [nz[i] * math.exp(-i / SR * 3.2) * min(1.0, i / 120) * 0.9 * g for i in range(n)]


def sfx_swell(dur=1.0, seed=1, g=1.0):
    return sfx_whoosh(dur, seed, 400, 5000, 0.8 * g, 0.9)


def sfx_down(dur=0.7, seed=1, g=1.0):
    return sfx_whoosh(dur, seed, 3000, 300, 0.9 * g, 0.2)


def sfx_zing(seed=1, g=1.0):
    return sfx_rise(0.25, 800, 3000, 0.6 * g)


def sfx_thunder(dur=2.0, seed=1, g=1.0):
    return sfx_rumble(dur, seed, 1.4 * g, 'fall', 260)


def sfx_cricket(seed=1, g=1.0, dur=1.2):
    n = _n(dur)
    out = []
    for i in range(n):
        t = i / SR
        pulse = 1.0 if (t * 14) % 1.0 < 0.45 else 0.0
        out.append(math.sin(TAU * 3900 * t) * pulse * min(1.0, t / 0.05, (dur - t) / 0.1) * 0.25)
    return scale(out, g)


def sfx_shimmer(dur=2.0, seed=1, g=1.0, m=84):
    rng = _rng(seed)
    n = _n(dur)
    out = [0.0] * n
    for k in range(10):
        c = glock(m + rng.choice([0, 4, 7, 12]), 0.8)
        i0 = int(rng.random() * (dur - 0.5) * SR)
        for i, v in enumerate(c):
            if i0 + i < n:
                out[i0 + i] += v * 0.15
    return scale(out, g)


def sfx_hum(dur=3.0, f=110, g=1.0, vib=0.01):
    return scale(organ(f, dur, (1.0, 0.4, 0.2, 0.1), 0.3, 0.5, vib), 0.3 * g)


def sfx_swirl(dur=3.0, seed=1, g=1.0):
    rng = _rng(seed)
    n = _n(dur)
    nz = noise(n, rng)
    x = sweep_bandpass(nz, 150, 700, 3.0)
    out = []
    for i in range(n):
        t = i / SR
        out.append(x[i] * (0.6 + 0.4 * math.sin(TAU * 0.8 * t)) * min(1.0, t / 0.5, (dur - t) / 0.5))
    return scale(out, 2.2 * g)


# ------------------------------------------------------------------ galm & mixer
class Reverb:
    def __init__(self, size=1.0, fb=0.78, damp=0.35):
        k = SR / 44100.0
        self.combs = [int(d * k * size) for d in (1307, 1637, 1811, 1999)]
        self.aps = [int(d * k) for d in (225, 556)]
        self.fb = fb
        self.damp = damp

    def process(self, x):
        n = len(x)
        outs = [0.0] * n
        for d in self.combs:
            buf = [0.0] * d
            i = 0
            lp = 0.0
            fb = self.fb
            dm = self.damp
            for k in range(n):
                v = buf[i]
                lp += dm * (v - lp)
                buf[i] = x[k] + lp * fb
                outs[k] += v
                i += 1
                if i == d:
                    i = 0
        y = [v * 0.25 for v in outs]
        for d in self.aps:
            buf = [0.0] * d
            i = 0
            res = [0.0] * n
            for k in range(n):
                b = buf[i]
                v = y[k] + b * 0.5
                res[k] = b - v * 0.5
                buf[i] = v
                i += 1
                if i == d:
                    i = 0
            y = res
        return y


class Mixer:
    def __init__(self, seconds):
        self.n = int(round(seconds * SR))
        self.dry = [0.0] * self.n
        self.wet = [0.0] * self.n

    def put(self, samples, t, g=1.0, wet=0.0):
        i0 = int(round(t * SR))
        if i0 >= self.n or not samples:
            return
        if i0 < 0:
            samples = samples[-i0:]
            i0 = 0
        m = min(len(samples), self.n - i0)
        d = self.dry
        if g:
            seg = samples[:m]
            d[i0:i0 + m] = [a + b * g for a, b in zip(d[i0:i0 + m], seg)]
            if wet:
                w = self.wet
                w[i0:i0 + m] = [a + b * g * wet for a, b in zip(w[i0:i0 + m], seg)]

    def finish(self, reverb=1.0, size=1.0, fb=0.78, peak=0.72, fade_in=0.015, fade_out=0.18, lp_hz=None, rms_target=0.13):
        """Geeft (samples, stats): galm erbij, zacht begrenzen, normaliseren, in- en uitfaden."""
        out = self.dry
        if reverb and any(abs(v) > 1e-5 for v in self.wet):
            rv = Reverb(size, fb).process(self.wet)
            out = [a + b * reverb for a, b in zip(out, rv)]
        if lp_hz:
            out = lowpass(out, lp_hz)
        # gelijkspanning weg, op gelijke luidheid (RMS) brengen, zacht begrenzen (nooit boven `peak`)
        mean = sum(out) / len(out)
        out = [v - mean for v in out]
        rms = math.sqrt(sum(v * v for v in out) / len(out)) or 1e-6
        k = rms_target / rms
        th = math.tanh
        out = [peak * th(v * k / peak) for v in out]
        fade(out, fade_in, fade_out)
        return out


def _norm(x, rms):
    if not x:
        return x
    r = math.sqrt(sum(v * v for v in x) / len(x)) or 1e-9
    k = rms / r
    return [v * k for v in x]


def _wrap(name, rms):
    f = globals()[name]

    def g(*a, **k):
        return _norm(f(*a, **k), rms)
    g.__name__ = name
    globals()[name] = g


# luidheid van geluiden gelijktrekken (RMS over de hele klank); de gains in music.py bouwen hierop voort
for _wn, _wr in {'sfx_applause': 0.20, 'sfx_cheer': 0.20, 'sfx_down': 0.15, 'sfx_fire': 0.20, 'sfx_rocket': 0.22, 'sfx_rumble': 0.20, 'sfx_surf': 0.16,
               'sfx_swell': 0.15, 'sfx_swirl': 0.14, 'sfx_swish': 0.14, 'sfx_thunder': 0.22, 'sfx_whistle': 0.16, 'sfx_whoosh': 0.14,
               'sfx_wind': 0.12, 'sfx_rain': 0.08, 'sfx_fanfare': 0.20, 'sfx_engine': 0.14, 'sfx_hum': 0.12, 'sfx_cymbal': 0.18, 'sfx_splat': 0.2,
               'brass': 0.22, 'synth_lead': 0.22, 'sfx_bang': 0.22, 'sfx_creak': 0.14, 'sfx_zoom': 0.14}.items():
    _wrap(_wn, _wr)
INSTR.update({'brass': brass, 'lead': synth_lead})


def write_wav(path, samples):
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', max(-32767, min(32767, int(v * 32767)))) for v in samples))
