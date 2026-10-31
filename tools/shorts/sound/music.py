"""Muziek-bedden per categorie + afspelen van de events. Gebruikt synth.py.

render_short(short) -> lijst samples (mono, synth.SR) met precies s seconden.
Deterministisch: alles volgt uit het id (seed), de categorie en de eventlijst.
"""
import math, random
import synth as S

MODES = {
    'major': [0, 2, 4, 5, 7, 9, 11], 'minor': [0, 2, 3, 5, 7, 8, 10], 'dorian': [0, 2, 3, 5, 7, 9, 10],
    'lydian': [0, 2, 4, 6, 7, 9, 11], 'mixo': [0, 2, 4, 5, 7, 9, 10],
}
PENT = {'major': [0, 1, 2, 4, 5], 'lydian': [0, 1, 2, 4, 5], 'mixo': [0, 1, 2, 4, 5], 'minor': [0, 2, 3, 4, 6], 'dorian': [0, 2, 3, 4, 6]}
PROGS = [[0, 4, 5, 3], [0, 5, 3, 4], [5, 3, 0, 4], [0, 3, 4, 3], [0, 2, 3, 4], [5, 4, 3, 4], [0, 3, 5, 4], [3, 4, 0, 5]]

# per categorie: toonsoorten, tempo-venster (bpm), melodie-instrument voor 'note'-events
STYLE = {
    'satisfying': dict(modes=['major', 'lydian', 'major', 'dorian'], bpm=(64, 96), inst='marimba'),
    'techniek': dict(modes=['minor', 'dorian', 'minor', 'major'], bpm=(100, 128), inst='sinepluck'),
    'sport': dict(modes=['major', 'mixo', 'major'], bpm=(116, 140), inst='xylophone'),
    'dieren': dict(modes=['major', 'lydian', 'major'], bpm=(100, 126), inst='pizz'),
    'eten': dict(modes=['major', 'mixo', 'lydian'], bpm=(96, 118), inst='xylophone'),
    'natuur': dict(modes=['lydian', 'major', 'dorian'], bpm=(56, 84), inst='glock'),
    'weetjes': dict(modes=['major', 'lydian', 'dorian'], bpm=(80, 100), inst='glock'),
    'quiz': dict(modes=['minor', 'dorian'], bpm=(90, 116), inst='marimba'),
    'ruimte': dict(modes=['lydian', 'minor', 'dorian'], bpm=(54, 78), inst='bell'),
    'fantasie': dict(modes=['lydian', 'major', 'dorian'], bpm=(84, 108), inst='harp'),
}


class Ctx:
    def __init__(self, sh):
        self.id = sh['id']
        self.c = sh['c']
        self.L = float(sh['s'])
        self.tpl = sh['tpl']
        self.ev = sh['ev']
        self.meta = sh.get('meta') or {}
        seed = int(self.id[1:])
        self.seed = seed
        self.rng = random.Random(seed * 7919 + 13)
        st = STYLE[self.c]
        self.st = st
        self.mode_name = self.rng.choice(st['modes'])
        if self.meta.get('mood') in ('lullaby', 'sweet'):
            self.mode_name = 'major'
        if self.meta.get('mood') == 'rumble':
            self.mode_name = 'minor'
        self.mode = MODES[self.mode_name]
        self.pent = PENT[self.mode_name]
        self.root = 45 + self.rng.randint(0, 11)  # A2..G#3
        self.minorish = self.mode_name in ('minor', 'dorian')
        self.mx = S.Mixer(self.L)
        self.prog = list(self.rng.choice(PROGS))
        if self.minorish:
            self.prog = [{0: 0, 4: 4, 5: 5, 3: 3, 2: 2}.get(x, x) for x in self.prog]
        # tempo
        lo, hi = st['bpm']
        hint = self.meta.get('beat')
        if hint:
            b = float(hint)
            while b < 60.0 / hi * 0.8:
                b *= 2
            while b > 60.0 / lo * 1.15:
                b /= 2
            self.beat = b
            self.nb = max(4, int(self.L / b))
        else:
            opts = [nb for nb in range(8, 29, 4) if lo <= nb * 60.0 / self.L <= hi]
            if not opts:
                mid = (lo + hi) / 2
                opts = [min(range(8, 29, 4), key=lambda nb: abs(nb * 60.0 / self.L - mid))]
            self.nb = self.rng.choice(opts)
            self.beat = self.L / self.nb
        self.bars = max(1, -(-self.nb // 4))

    # --- toonhoogtes
    def midi(self, deg, o=0):
        deg = int(round(deg))
        oc, i = divmod(deg, 7)
        return self.root + 12 * (oc + o) + self.mode[i]

    def pm(self, n, o=0):
        """Pentatonische noot n (kan negatief) -> midi, rond root+12."""
        n = int(round(n))
        oc, i = divmod(n, 5)
        return self.root + 12 * (oc + o + 1) + self.mode[self.pent[i]]

    def chord(self, bar):
        r = self.prog[bar % len(self.prog)]
        return [r, r + 2, r + 4]

    def inst(self, name):
        return S.INSTR[name]

    def put(self, samples, t, g=1.0, wet=0.0):
        self.mx.put(samples, t, g, wet)


# ------------------------------------------------------------------ muziekbedden
def _pad(c, g=0.10, wet=0.5, o=0):
    bl = c.beat * 4
    for b in range(c.bars):
        for d in c.chord(b):
            c.put(S.pad_note(c.midi(d, o), bl + 0.35), b * bl, g, wet)


def _bass(c, g=0.3, kind='bass', pattern='root'):
    bl = c.beat * 4
    for b in range(c.bars):
        r = c.chord(b)[0]
        low = c.midi(r, -1) if c.midi(r, -1) >= 33 else c.midi(r, 0)
        fifth = c.midi(r + 4, -1)
        t0 = b * bl
        if pattern == 'root':
            c.put(S.INSTR[kind](low, c.beat * 1.8), t0, g, 0.1)
            c.put(S.INSTR[kind](fifth, c.beat * 1.4), t0 + c.beat * 2, g * 0.8, 0.1)
        elif pattern == '8th':
            seq = [low, low, fifth, low, low, fifth + 2, fifth, low + 12]
            for i, m in enumerate(seq):
                c.put(S.INSTR[kind](m, c.beat * 0.45), t0 + i * c.beat / 2, g * (1.0 if i % 2 == 0 else 0.7), 0.05)
        elif pattern == 'pump':
            for i in range(4):
                c.put(S.INSTR[kind](low if i % 2 == 0 else fifth, c.beat * 0.8), t0 + i * c.beat, g, 0.05)


def _arp(c, inst, g=0.2, wet=0.3, step=0.5, o=1, rest=0.2, pat=None):
    pats = [[0, 1, 2, 3, 2, 1, 2, 1], [0, 2, 1, 3, 2, 3, 1, 2], [0, 1, 2, 1, 3, 2, 1, 2], [0, 2, 3, 2, 1, 2, 3, 2], [3, 2, 1, 0, 1, 2, 1, 2]]
    pat = pat or c.rng.choice(pats)
    bl = c.beat * 4
    n = int(4 / step)
    for b in range(c.bars):
        ch = c.chord(b)
        tones = ch + [ch[0] + 7]
        for i in range(n):
            if c.rng.random() < rest:
                continue
            m = c.midi(tones[pat[i % len(pat)]], o)
            acc = 1.0 if i % 4 == 0 else 0.7
            c.put(S.INSTR[inst](m, c.beat * step * 1.6), b * bl + i * c.beat * step, g * acc, wet)


def _motif(c, length_beats=8):
    """Korte melodie: lijst (beat, pentatonische noot, duur in beats)."""
    rr = c.rng
    rhy = rr.choice([[1, 1, 0.5, 0.5, 1, 1, 1, 1, 1], [0.5, 0.5, 1, 0.5, 0.5, 1, 1, 1, 1, 1], [1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1, 1], [1.5, 0.5, 1, 1, 1.5, 0.5, 1, 1]])
    out = []
    t = 0.0
    n = rr.randint(2, 4)
    k = 0
    while t < length_beats - 0.01:
        d = rhy[k % len(rhy)]
        if t + d > length_beats:
            d = length_beats - t
        if rr.random() > 0.15:
            out.append((t, n, d))
        n = max(0, min(9, n + rr.choice([-2, -1, -1, 0, 1, 1, 2])))
        t += d
        k += 1
    return out


def _melody(c, inst, g=0.2, wet=0.25, o=0, dur_k=0.9, every=2):
    """Motief van 2 bars, herhaald met variatie."""
    mot = _motif(c, 8)
    bl = c.beat * 4
    for rep in range(0, c.bars, every):
        for (tb, n, db) in mot:
            if tb >= (c.bars - rep) * 4:
                break
            nn = n + (2 if (rep // every) % 2 == 1 and tb >= 4 else 0)
            c.put(S.INSTR[inst](c.pm(nn, o), max(0.12, db * c.beat * dur_k)), rep * bl + tb * c.beat, g, wet)


def _drums(c, kick=0.5, snare=0.3, hat=0.16, clap=False, pattern='four', open_hat=True):
    bl = c.beat * 4
    rr = c.rng
    for b in range(c.bars):
        t0 = b * bl
        for i in range(4):
            t = t0 + i * c.beat
            if kick:
                if pattern == 'four' or (pattern == 'half' and i in (0, 2)) or (pattern == 'break' and i in (0, 2, 3 if b % 2 else 0)):
                    c.put(S.kick(kick), t, 1.0)
            if snare and i in (1, 3):
                c.put(S.clap(snare) if clap else S.snare(None, snare), t, 1.0, 0.1)
            if hat:
                c.put(S.hat(None, hat), t, 1.0)
                c.put(S.hat(None, hat * 0.6, open_=(open_hat and i == 3 and b % 2 == 1)), t + c.beat / 2, 1.0)


def bed_satisfying(c, dense_events):
    _pad(c, 0.11, 0.55)
    _bass(c, 0.22, 'sub', 'root')
    _arp(c, 'marimba', 0.13 if dense_events else 0.24, 0.35, 0.5, 1, 0.25)
    if c.rng.random() < 0.5:
        for i in range(c.nb * 2):
            c.put(S.shaker(0.08), i * c.beat / 2 + c.beat / 4, 1.0)


def bed_techniek(c, dense_events):
    pat = c.rng.choice(['four', 'four', 'half', 'break'])
    _drums(c, 0.5 if pat != 'half' else 0.45, 0.28, 0.14, clap=c.rng.random() < 0.5, pattern=pat)
    _bass(c, 0.30, 'bass', c.rng.choice(['8th', 'pump', '8th']))
    _arp(c, 'lead', 0.06, 0.25, 0.25, 1, 0.3)
    _pad(c, 0.06, 0.4)
    if c.rng.random() < 0.6:
        _melody(c, 'sinepluck', 0.16, 0.3, 1, 0.6, 2)


def bed_sport(c, dense_events):
    _drums(c, 0.55, 0.32, 0.17, clap=True, pattern=c.rng.choice(['four', 'half', 'break']))
    _bass(c, 0.30, 'bass', 'pump')
    bl = c.beat * 4
    for b in range(c.bars):  # koper-stabs op de tegenmaat
        ch = c.chord(b)
        for i in (1, 3):
            for d in ch:
                c.put(S.brass(c.midi(d, 1), c.beat * 0.28), b * bl + i * c.beat + c.beat * 0.5, 0.055, 0.15)
    _melody(c, 'xylophone', 0.2, 0.25, 1, 0.6, 2)


def bed_dieren(c, dense_events):
    bl = c.beat * 4
    _bass(c, 0.30, 'pizz', 'root')
    _melody(c, 'pizz', 0.30, 0.25, 1, 0.5, 2)
    _arp(c, 'xylophone', 0.06, 0.2, 1.0, 2, 0.5)
    for i in range(c.nb):
        c.put(S.woodblock(1000 if i % 2 else 760, 0.10), i * c.beat + c.beat / 2, 1.0)
    if c.rng.random() < 0.6:
        for i in range(c.nb * 2):
            c.put(S.shaker(0.06), i * c.beat / 2, 1.0)


def bed_eten(c, dense_events):
    bl = c.beat * 4
    for b in range(c.bars):  # ukelele-strums
        ch = c.chord(b)
        tones = [c.midi(ch[0], 0), c.midi(ch[1], 0), c.midi(ch[2], 0), c.midi(ch[0], 1)]
        for i, (dn, vel) in enumerate([(0, 1.0), (1, 0.55), (2, 0.9), (2.5, 0.6), (3, 0.8), (3.5, 0.5)]):
            tt = b * bl + dn * c.beat
            order = tones if i % 2 == 0 or i == 0 else tones[::-1]
            for j, m in enumerate(order):
                c.put(S.ukulele(m + 12, 0.5), tt + j * 0.012, 0.10 * vel, 0.2)
    _bass(c, 0.26, 'pizz', 'root')
    _melody(c, 'xylophone', 0.22, 0.25, 1, 0.6, 2)
    for i in range(c.nb * 2):
        c.put(S.shaker(0.07), i * c.beat / 2 + (c.beat / 2 if i % 2 else 0) * 0, 1.0)


def bed_natuur(c, dense_events):
    mood = c.meta.get('mood')
    L = c.L
    half = L / 2
    for k in range(2):
        ch = c.chord(k)
        for d in ch:
            c.put(S.pad_note(c.midi(d, -0 if mood != 'rumble' else -1), half + 0.8), k * half, 0.14, 0.7)
    c.put(S.subbass(c.midi(c.chord(0)[0], -1), L * 0.5), 0, 0.2, 0.1)
    rr = c.rng
    t = 0.6 + rr.random() * 0.6
    while t < L - 0.9 and mood != 'rumble':
        n = rr.choice([0, 1, 2, 3, 4, 5, 6, 7])
        c.put(S.glock(c.pm(n, 1), 1.0), t, 0.16, 0.7)
        t += 0.8 + rr.random() * 1.6
    if mood == 'rumble':
        _arp(c, 'sinepluck', 0.08, 0.5, 1.0, 0, 0.3)


def bed_weetjes(c, dense_events):
    _pad(c, 0.09, 0.5)
    _bass(c, 0.20, 'sinepluck', 'root')
    _arp(c, 'glock', 0.07 if dense_events else 0.10, 0.5, 1.0, 1, 0.2)
    for i in range(c.nb):
        c.put(S.tik(1900, 0.05), i * c.beat, 1.0)
    if c.rng.random() < 0.5:
        _melody(c, 'marimba', 0.12, 0.35, 0, 0.8, 2)


def bed_quiz(c, dense_events):
    t_count, t_rev = c.meta.get('quiz', (3.0, 6.0))
    L = c.L
    b = c.beat
    # fase 1: speels, nieuwsgierig (0 - t_count)
    root = c.midi(0, -1)
    n1 = int(t_count / (b / 2))
    for i in range(n1):
        m = c.midi([0, 2, 4, 2, 0, 3, 4, 2][i % 8], 1)
        c.put(S.marimba(m, 0.3), i * b / 2, 0.16 if i % 2 == 0 else 0.10, 0.25)
    for i in range(int(t_count / b)):
        c.put(S.bassnote(root if i % 2 == 0 else root + 7, b * 0.8), i * b, 0.28)
    c.put(S.pad_note(c.midi(0, 0), t_count + 0.5), 0, 0.09, 0.5)
    # fase 2: spanning (t_count - t_rev): ostinato van dezelfde noot, stijgend, zware drone
    n2 = int((t_rev - t_count) / (b / 2))
    for i in range(n2):
        u = i / max(1, n2)
        m = c.midi(0, -1) + (0 if u < 0.5 else (1 if u < 0.8 else 3))
        c.put(S.bassnote(m, b * 0.4), t_count + i * b / 2, 0.30 * (0.7 + 0.5 * u))
        if i % 2 == 1:
            c.put(S.hat(None, 0.10 + 0.12 * u), t_count + i * b / 2, 1.0)
    c.put(S.organ(c.midi(0, -2), t_rev - t_count + 0.3, (1.0, 0.5, 0.25), 0.4, 0.05), t_count, 0.2, 0.2)
    c.put(S.organ(c.midi(1, 0) + 1, t_rev - t_count + 0.3, (1.0, 0.3), 0.8, 0.05), t_count, 0.07, 0.4)
    # fase 3: feest (t_rev - L): majeur akkoord, vrolijk arpeggio
    tonic = c.root
    maj = [0, 4, 7, 12, 16, 12, 7, 4]
    k = 0
    t = t_rev + 0.1
    while t < L - 0.2:
        c.put(S.marimba(tonic + 24 + maj[k % 8], 0.45), t, 0.2 if k % 2 == 0 else 0.14, 0.3)
        t += b / 2
        k += 1
    for m in (0, 4, 7):
        c.put(S.pad_note(tonic + 12 + m, L - t_rev + 0.2), t_rev, 0.11, 0.5)
    t = t_rev
    while t < L - 0.3:
        c.put(S.kick(0.5), t, 1.0)
        c.put(S.bassnote(tonic - 12 if int((t - t_rev) / b) % 2 == 0 else tonic - 5, b * 0.8), t, 0.28)
        c.put(S.shaker(0.1), t + b / 2, 1.0)
        t += b


def bed_ruimte(c, dense_events):
    L = c.L
    seg = L / 3
    for k in range(3):
        ch = c.chord(k)
        for d in ch:
            c.put(S.pad_note(c.midi(d, 0), seg + 1.0), k * seg, 0.12, 0.8)
    c.put(S.subbass(c.midi(c.chord(0)[0], -2), L * 0.6), 0, 0.2, 0.0)
    c.put(S.subbass(c.midi(c.chord(2)[0], -2), L * 0.4), L * 0.6, 0.18, 0.0)
    rr = c.rng
    n = 0
    t = 0.3 + rr.random() * 0.5
    while t < L - 0.8:
        c.put(S.bell(c.pm(rr.choice([0, 1, 2, 3, 4, 5, 6]), 1), 1.4, 0.7), t, 0.13, 0.9)
        t += c.beat * rr.choice([1, 1.5, 2])


def bed_fantasie(c, dense_events):
    _pad(c, 0.09, 0.6)
    _bass(c, 0.14, 'sub', 'root')
    bl = c.beat * 4
    rr = c.rng
    for b in range(c.bars):
        ch = c.chord(b)
        tones = [c.midi(d, 1) for d in ch] + [c.midi(ch[0], 2)]
        for i in range(8):
            m = tones[[0, 1, 2, 3, 2, 1, 2, 3][i]]
            c.put(S.harp(m, 0.9), b * bl + i * c.beat / 2, 0.2 if i % 4 == 0 else 0.14, 0.45)
        for j in range(3):
            c.put(S.glock(c.pm(rr.randint(5, 9), 1), 0.6), b * bl + rr.random() * bl, 0.07, 0.7)
    c.put(S.bassnote(c.midi(0, -1), c.beat), 0, 0.0)


def bed_lullaby(c, dense_events):
    # muziekdoos: langzaam wiegeliedje
    bl = c.beat * 4
    notes = [0, 2, 4, 2, 1, 3, 2, 0]
    for i, n in enumerate(notes * 3):
        t = i * c.beat
        if t > c.L - 0.4:
            break
        c.put(S.glock(c.pm(n, 1), 0.9), t, 0.2, 0.7)
    _pad(c, 0.08, 0.6)
    _bass(c, 0.14, 'sub', 'root')


BEDS = {'satisfying': bed_satisfying, 'techniek': bed_techniek, 'sport': bed_sport, 'dieren': bed_dieren, 'eten': bed_eten,
        'natuur': bed_natuur, 'weetjes': bed_weetjes, 'quiz': bed_quiz, 'ruimte': bed_ruimte, 'fantasie': bed_fantasie}

# ------------------------------------------------------------------ events afspelen
_MIN_GAP = {'tik': 0.06, 'note': 0.09, 'plop': 0.07, 'step': 0.09, 'bloep': 0.12, 'popcorn': 0.06, 'flip': 0.08, 'tick': 0.1, 'plof': 0.08, 'chuff': 0.1, 'chop': 0.1}


def _thin(events):
    last = {}
    out = []
    for e in events:
        gap = _MIN_GAP.get(e['k'])
        if gap is not None:
            lt = last.get(e['k'], -9)
            if e['t'] - lt < gap:
                continue
            last[e['k']] = e['t']
        out.append(e)
    return out


def _memo(key, fn):
    return S._memo(('sfx',) + key, fn)


def honk(c, g):
    a = S.organ(S.mtof(c.root + 12), 0.2, (1, 0.5, 0.35, 0.2), 0.01, 0.04)
    b = S.organ(S.mtof(c.root + 16), 0.35, (1, 0.5, 0.35, 0.2), 0.01, 0.1)
    out = [0.0] * (len(b) + int(0.22 * S.SR))
    for i, v in enumerate(a):
        out[i] += v * 0.25
    for i, v in enumerate(b):
        out[i + int(0.22 * S.SR)] += v * 0.25
    return S.scale(out, g)


def play_events(c):
    evs = _thin(c.ev)
    rr = random.Random(c.seed + 99)
    inst = c.st['inst']
    for idx, e in enumerate(evs):
        k = e['k']
        t = e['t']
        g = float(e.get('g', 1.0))
        n = e.get('n', 0)
        sd = c.seed * 31 + idx
        put = c.put
        if k == 'note':
            m = c.pm(n, e.get('o', 0))
            put(c.inst(inst)(m, 0.55), t, 0.30 * g, 0.35)
        elif k == 'tik':
            put(S.tik(1400 + (int(n) % 8) * 110, 0.5), t, g * 0.45)
        elif k == 'tick':
            put(S.tik(900 + (int(n) % 3) * 200, 0.5, 120), t, g * 0.5)
        elif k == 'thud':
            put(S.sfx_thud(sd, e.get('f', 75), 0.9), t, g * 0.7)
        elif k == 'ding':
            m = min(96, c.pm(n + 5, 1))
            put(S.sfx_ding(m, 1.0), t, g * 0.8, 0.4)
        elif k == 'tring':
            put(S.sfx_tring(c.root + 12 * 3 + 4 + (0 if rr.random() < 0.5 else 3)), t, g * 0.75, 0.5)
        elif k == 'land':
            put(S.sfx_thud(sd, 85, 0.7, 0.2), t, g * 0.45)
            put(c.inst('marimba' if c.c in ('satisfying', 'techniek') else inst)(c.pm(n, 0), 0.6), t, g * 0.4, 0.35)
        elif k == 'plop':
            put(S.sfx_plop(sd, 330 + (int(n) % 8) * 70, 0.9), t, g * 0.6, 0.2)
        elif k == 'plof':
            put(S.sfx_bloep(sd, 200 + (int(n) % 8) * 40, 0.9), t, g * 0.7, 0.15)
            put(S.sfx_thud(sd, 90, 0.4, 0.15), t, g * 0.3)
        elif k == 'flip':
            put(S.tik(1800 + (int(n) % 6) * 90, 0.5, 130), t, g * 0.5)
            put(S.sfx_whoosh(0.16, sd, 1200, 3500, 0.5, 0.4), t - 0.05, g * 0.3)
        elif k == 'bloep':
            put(S.sfx_bloep(sd, 320 + int(e.get('p', 0)) * 40, 0.9), t, g * 0.5, 0.3)
        elif k == 'whoosh':
            d = float(e.get('d', 0.6))
            put(_memo(('wh', round(d, 2), int(e.get('f0', 300)), int(e.get('f1', 2500)), e.get('peak', 0.45), sd % 5), lambda: S.sfx_whoosh(d, sd, e.get('f0', 300), e.get('f1', 2500), 1.0, e.get('peak', 0.45))), t, g * 0.5, 0.2)
        elif k == 'swish':
            put(S.sfx_swish(sd % 4, 0.9), t, g * 0.5, 0.15)
        elif k == 'clack':
            nb = int(e.get('n', 1))
            side = e.get('side', 0)
            hi = 2400 if side == 0 else 2800
            put(S.sfx_clack(sd, hi, 0.9), t, g * 0.6, 0.1)
            for j in range(nb):
                put(S.sfx_clack(sd + j, hi * (1 - 0.03 * j), 0.7), t + 0.035 * (j + 1) * (1 if side else 1), g * 0.35, 0.1)
        elif k == 'servo':
            put(S.sfx_servo(sd, 0.8, float(e.get('d', 0.35)), float(e.get('f0', 260)), float(e.get('f1', 420))), t, g * 0.5)
        elif k == 'hum':
            d = float(e.get('d', 3.0))
            put(S.sfx_hum(min(d, c.L - t), S.mtof(c.root - 12), 0.8), t, g * 0.5, 0.2)
        elif k == 'engine':
            d = min(float(e.get('d', 3.0)), c.L - t)
            put(_memo(('eng', round(d, 1), c.root % 5), lambda: S.sfx_engine(d, sd, 1.0, 55 + (c.root % 5) * 3)), t, g * 0.5)
        elif k == 'honk':
            put(honk(c, 1.0), t, g * 0.7, 0.2)
        elif k == 'chirp':
            put(S.sfx_chirp(sd, 0.9, 2600 + (sd % 5) * 300), t, g * 0.7, 0.4)
        elif k == 'chuff':
            put(S.sfx_chuff(sd % 3, 0.9), t, g * 0.5)
        elif k == 'chop':
            put(S.sfx_chop(sd % 3, 0.9), t, g * 0.5)
        elif k == 'whistle':
            put(S.sfx_whistle(sd, 0.9, float(e.get('d', 0.45))), t, g * 0.5, 0.2)
        elif k == 'wind':
            d = min(float(e.get('d', 4.0)), c.L - t)
            put(_memo(('wind', round(d, 1), sd % 3), lambda: S.sfx_wind(d, sd % 3, 1.0)), t, g * 0.4, 0.2)
        elif k == 'surf':
            d = min(float(e.get('d', 4.0)), c.L - t)
            put(_memo(('surf', round(d, 1), sd % 3), lambda: S.sfx_surf(d, sd % 3, 1.0)), t, g * 0.4, 0.2)
        elif k == 'rain':
            d = min(float(e.get('d', 3.0)), c.L - t)
            put(_memo(('rain', round(d, 1), sd % 3), lambda: S.sfx_rain(d, sd % 3, 1.0)), t, g * 0.4, 0.1)
        elif k == 'rumble':
            d = min(float(e.get('d', 2.0)), c.L - t)
            sh = e.get('shape', 'flat')
            put(_memo(('rum', round(d, 1), sh), lambda: S.sfx_rumble(d, 1, 1.0, sh)), t, g * 0.5)
        elif k == 'rocket':
            d = min(float(e.get('d', 5.0)), c.L - t)
            put(_memo(('rock', round(d, 1)), lambda: S.sfx_rocket(d, 1, 1.0)), t, g * 0.55, 0.15)
        elif k == 'bang':
            put(S.sfx_bang(sd % 3, 0.9), t, g * 0.6, 0.3)
        elif k == 'clunk':
            put(S.sfx_thud(sd, 150, 0.8, 0.14), t, g * 0.5)
            put(S.tik(1100, 0.6, 100), t, g * 0.4)
        elif k == 'count':
            nn = int(n)
            if e.get('q'):
                put(S.sfx_beep(c.root + 24 + [0, 2, 4][nn % 3], 0.9, 0.2), t, g * 0.8, 0.2)
            elif nn < 3:
                put(S.sfx_beep(c.root + 24, 0.9, 0.15), t, g * 0.8, 0.2)
            else:
                put(S.sfx_beep(c.root + 36, 1.0, 0.6), t, g * 0.9, 0.3)
        elif k == 'beep':
            put(S.sfx_beep(c.root + 24 + int(n) * 2, 0.9, 0.12), t, g * 0.7, 0.2)
        elif k == 'pop':
            put(S.sfx_pop(sd, 330 + (int(n) % 6) * 60, 0.9), t, g * 0.7, 0.15)
        elif k == 'bell':
            put(S.bell(c.pm(n, 1), 1.3, 0.6), t, g * 0.3, 0.6)
        elif k == 'tok':
            put(S.tok(600 + (sd % 3) * 80, 0.9), t, g * 0.7, 0.1)
        elif k == 'tock':
            put(S.sfx_clock_tock(0.9), t, g * 0.55)
        elif k == 'net':
            put(S.sfx_swish(sd % 4, 0.8), t, g * 0.5, 0.2)
            put(S.tik(2200, 0.4, 70), t, g * 0.3)
        elif k == 'cheer':
            d = min(float(e.get('d', 1.2)), c.L - t)
            put(_memo(('cheer', round(d, 1), sd % 3), lambda: S.sfx_cheer(d, sd % 3, 1.0)), t, g * 0.45, 0.3)
        elif k == 'applause':
            d = min(float(e.get('d', 1.6)), c.L - t)
            put(_memo(('appl', round(d, 1), sd % 3), lambda: S.sfx_applause(d, sd % 3, 1.0)), t, g * 0.45, 0.25)
        elif k == 'bounce':
            put(S.sfx_thud(sd, 105, 0.7, 0.16), t, g * 0.55)
        elif k == 'kick':
            put(S.sfx_thud(sd, 95, 1.0, 0.2), t, g * 0.8)
            put(S.sfx_swish(sd % 3, 0.5), t - 0.04, g * 0.3)
        elif k == 'step':
            put(S.sfx_step(sd % 4, 0.9), t, g * 0.45)
        elif k == 'fanfare':
            put(S.sfx_fanfare(c.root + 24, 0.9), t, g * 0.5, 0.3)
        elif k == 'roll':
            d = float(e.get('d', 0.5))
            put(_memo(('roll', round(d, 1)), lambda: S.sfx_rumble(d, 3, 1.0, 'flat', 350)), t, g * 0.4)
        elif k == 'rattle':
            put(S.sfx_rattle(sd, 1.0, float(e.get('d', 0.5)), int(e.get('count', 16))), t, g * 0.6, 0.2)
        elif k == 'club':
            put(S.tok(520, 1.0), t, g * 0.6)
            put(S.sfx_swish(sd % 3, 0.8), t - 0.05, g * 0.4)
        elif k == 'spin':
            put(S.sfx_whoosh(0.4, sd, 600, 3500, 0.8, 0.5), t, g * 0.4, 0.2)
        elif k == 'boing':
            put(S.sfx_boing(sd, 200 + int(e.get('p', 0)) * 22, 0.9), t, g * 0.55, 0.2)
        elif k == 'squeak':
            put(S.sfx_squeak(sd, 800 + int(e.get('p', 0)) * 60, 0.9), t, g * 0.5, 0.2)
        elif k == 'splash':
            put(S.sfx_splash(sd % 4, 0.9), t, g * 0.55, 0.3)
        elif k == 'bloem':
            for j in range(3):
                put(S.glock(c.pm(int(n) * 2 + j * 2 + 3, 1), 0.7), t + j * 0.09, g * 0.28, 0.5)
            put(S.sfx_pop(sd, 300, 0.8), t, g * 0.4)
        elif k == 'thunder':
            d = min(float(e.get('d', 2.0)), c.L - t)
            put(_memo(('thun', round(d, 1)), lambda: S.sfx_thunder(d, 2, 1.0)), t, g * 0.5, 0.3)
        elif k == 'magic':
            put(S.sfx_magic(c.root + 24 + (int(n) % 3) * 2, 0.9), t, g * 0.55, 0.5)
        elif k == 'swell':
            d = float(e.get('d', 1.0))
            put(_memo(('swell', round(d, 1)), lambda: S.sfx_swell(d, 4, 1.0)), t, g * 0.3, 0.3)
        elif k == 'swirl':
            d = min(float(e.get('d', 3.0)), c.L - t)
            put(_memo(('swirl', round(d, 1)), lambda: S.sfx_swirl(d, 6, 1.0)), t, g * 0.35, 0.3)
        elif k == 'shimmer':
            d = min(float(e.get('d', 2.0)), c.L - t)
            put(_memo(('shim', round(d, 1), c.root % 12), lambda: S.sfx_shimmer(d, 3, 1.0, c.root + 36)), t, g * 0.6, 0.7)
        elif k == 'cricket':
            put(S.sfx_cricket(sd, 0.9, min(float(e.get('d', 1.2)), c.L - t)), t, g * 0.4, 0.2)
        elif k == 'popcorn':
            put(S.sfx_pop(sd, 380 + int(e.get('p', 0)) * 40, 0.9), t, g * 0.6, 0.15)
            put(S.tik(2000, 0.3, 100), t, g * 0.2)
        elif k == 'puff':
            put(S.sfx_whoosh(0.3, sd, 250, 900, 0.7, 0.25), t, g * 0.5)
        elif k == 'down':
            put(S.sfx_down(float(e.get('d', 0.7)), sd, 0.9), t, g * 0.5, 0.2)
        elif k == 'rise':
            put(S.sfx_rise(float(e.get('d', 0.6)), float(e.get('f0', 300)), float(e.get('f1', 1200)), 0.9), t, g * 0.5, 0.25)
        elif k == 'zing':
            put(S.sfx_zing(sd, 0.9), t, g * 0.5, 0.4)
        elif k == 'reveal':
            put(S.sfx_cymbal(1.6, sd, 0.9), t, g * 0.4, 0.3)
            put(S.sfx_tring(c.root + 36), t, g * 0.9, 0.5)
            for m in (0, 4, 7):
                put(S.brass(c.root + 24 + m, 0.9), t, g * 0.07, 0.4)
            put(S.sfx_fanfare(c.root + 24, 0.8), t + 0.05, g * 0.5, 0.3)
        elif k == 'spark':
            put(S.sfx_spark(sd, 1.0, 0.6), t, g * 0.8, 0.4)
        elif k == 'bliep':
            put(S.sfx_bliep(sd, 0.9, float(e.get('f', 1400))), t, g * 0.55, 0.6)
        elif k == 'fire':
            d = min(float(e.get('d', 1.0)), c.L - t)
            put(_memo(('fire', round(d, 2), sd % 3), lambda: S.sfx_fire(d, sd % 3, 1.0)), t, g * 0.55, 0.2)
        elif k == 'coin':
            put(S.sfx_coin(c.root + 36 + int(n) * 2, 0.9), t, g * 0.6, 0.4)
        elif k == 'creak':
            put(S.sfx_creak(sd, 0.9, float(e.get('d', 0.8))), t, g * 0.6, 0.2)
        # 'hop' e.d.: bewust stil


def render_short(sh):
    c = Ctx(sh)
    dense = sum(1 for e in c.ev if e['k'] in ('note', 'tik', 'plop', 'land', 'flip')) > 24
    if c.meta.get('mood') == 'lullaby':
        bed_lullaby(c, dense)
    else:
        BEDS[c.c](c, dense)
    play_events(c)
    rv = {'satisfying': 0.6, 'techniek': 0.35, 'sport': 0.3, 'dieren': 0.4, 'eten': 0.4, 'natuur': 0.8, 'weetjes': 0.5, 'quiz': 0.45, 'ruimte': 1.1, 'fantasie': 0.8}[c.c]
    size = 1.6 if c.c == 'ruimte' else (1.2 if c.c in ('natuur', 'fantasie') else 1.0)
    out = c.mx.finish(reverb=rv, size=size, fade_in=0.012, fade_out=0.2)
    return out, c
