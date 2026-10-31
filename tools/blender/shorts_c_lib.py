"""Bibliotheek voor batch c: weetjes, quiz, ruimte, fantasie. Sjablonen als functies met parameters."""
import bpy, math, os, sys, random
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import shorts_common as sc
from shorts_common import mat, sphere, cube, cyl, cone, torus, ico, plane, lathe, extrude_poly, group
PI = math.pi

# ---------------- basis ----------------
def txt(S, s, loc=(0, 0, 0), size=.7, color='#ffffff', start=1, end=None, maxw=5.5, extrude=.08, align='CENTER', pop=True, fit=True):
    cu = bpy.data.curves.new('t', 'FONT'); cu.body = s; cu.size = size; cu.extrude = extrude; cu.align_x = align; cu.align_y = 'CENTER'; cu.bevel_depth = .01
    o = bpy.data.objects.new('t', cu); bpy.context.collection.objects.link(o); o.rotation_euler = (PI / 2, 0, 0); o.location = loc
    mc = S.__dict__.setdefault('_mc', {})
    if color not in mc: mc[color] = mat(color, .4, coat=.3, emit=.9)
    o.data.materials.append(mc[color])
    if fit:
        bpy.context.view_layer.update(); w = o.dimensions.x
        if w > maxw: k = maxw / w; o.scale = (k, k, k)
    if pop: S.pop(o, start, end, 8)
    return o

def txt_block(S, lines, zs, size=.8, color='#ffffff', accent='#ffd23f', start=20, gap=22, end=None, maxw=5.4, x=0):
    """Regels in beeld na elkaar; '*' vooraan = accentkleur. Gelijke schaal voor alle regels."""
    objs = []; ks = []
    for ln, z in zip(lines, zs):
        c = accent if '*' in ln else color; ln = ln.replace('*', '')
        o = txt(S, ln, (x, 0, z), size, c, pop=False, fit=False); objs.append(o)
    bpy.context.view_layer.update()
    k = min(1.0, min(maxw / o.dimensions.x for o in objs))
    for i, o in enumerate(objs):
        o.scale = (k, k, k); S.pop(o, start + i * gap, end, 8)
    return objs

def path(S, o, fn, f0, f1, step=2, prop='location'):
    f = f0
    while True:
        setattr(o, prop, fn((f - f0) / (f1 - f0))); o.keyframe_insert(prop, frame=f)
        if f >= f1: break
        f = min(f + step, f1)
    for fc in o.animation_data.action.fcurves:
        if fc.data_path == prop:
            for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'

def wobble(S, o, axis, amp, period, base=None, prop='rotation_euler', start=1, end=None):
    """Zachte sinus-beweging. rotation in graden."""
    end = end or S.frames; v0 = list(getattr(o, prop)); 
    if prop == 'rotation_euler': v0 = [math.degrees(x) for x in v0]
    if base is not None: v0[axis] = base
    t = start; q = period / 4.0
    while t <= end + 1e-6:
        v = list(v0); v[axis] += amp * math.sin(2 * PI * (t - start) / period)
        S.key(o, prop, int(round(t)), tuple(v), 'ease'); t += q

def halo(S, loc, r=2.0, color='#ffd23f', n=3, turns=1, y=1.5):
    parts = [torus(r, .04, mat(color, .3, emit=1.5), rot=(90, 0, 0), minor=8)]
    for i in range(n):
        a = 2 * PI * i / n; parts.append(ico(.14, mat(color, .3, emit=3), loc=(r * math.cos(a), 0, r * math.sin(a)), sub=1))
    g = group(parts, 'halo'); g.location = (loc[0], y, loc[2]); S.spin(g, axis=1, turns=turns); return g

def sparkles(S, n=14, seed=1, colors=('#ffffff', '#ffd23f'), z0=-5, z1=5, rise=3.0, size=.09, x=3.0):
    rnd = random.Random(seed)
    for i in range(n):
        c = rnd.choice(colors); o = ico(size * rnd.uniform(.5, 1.5), mat(c, .3, emit=2.5), sub=1)
        x0 = rnd.uniform(-x, x); zz = rnd.uniform(z0, z1); y = rnd.uniform(1, 3)
        path(S, o, lambda t, x0=x0, zz=zz, y=y: (x0 + .2 * math.sin(t * 6 + x0), y, zz + rise * t), 1, S.frames, 6)

def burst(S, center, f, n=26, colors=('#ffd23f', '#ffffff', '#ff6bd6', '#6be3ff'), rmin=1.4, rmax=3.6, size=.13, seed=0, dur=22):
    rnd = random.Random(seed); ms = [mat(c, .3, emit=4) for c in colors]
    for i in range(n):
        a = rnd.uniform(0, 2 * PI); r = rnd.uniform(rmin, rmax); dx, dz = math.cos(a), math.sin(a)
        o = ico(size * rnd.uniform(.6, 1.5), rnd.choice(ms), loc=center, sub=1)
        S.key(o, 'scale', 1, .001); S.key(o, 'scale', f - 1, .001); S.key(o, 'scale', f + 1, 1.0); S.key(o, 'scale', f + dur, .001)
        S.key(o, 'location', 1, center); S.key(o, 'location', f - 1, center)
        S.key(o, 'location', f + dur // 2, (center[0] + dx * r * .75, center[1] - .3, center[2] + dz * r * .75 + .5))
        S.key(o, 'location', f + dur, (center[0] + dx * r, center[1] - .3, center[2] + dz * r - 1.0))
    t = torus(.5, .025, mat('#ffd23f', .3, emit=4), loc=center, rot=(90, 0, 0), minor=8)
    S.key(t, 'scale', 1, .001); S.key(t, 'scale', f - 1, .001); S.key(t, 'scale', f + 2, 1.0); S.key(t, 'scale', f + 16, 7.0); S.key(t, 'scale', f + 17, .001)

def confetti(S, f, n=34, seed=0, dur=70):
    rnd = random.Random(seed); cols = ['#ff4d6d', '#ffd23f', '#4ade80', '#38bdf8', '#c084fc', '#ffffff']
    for i in range(n):
        o = cube((.16, .03, .26), mat(rnd.choice(cols), .4, emit=.6), bevel=0)
        x0 = rnd.uniform(-3, 3); st = f + rnd.randint(0, 14)
        o.location = (x0, .5, 6.2); o.keyframe_insert('location', frame=1); o.keyframe_insert('location', frame=st)
        S.key(o, 'location', st + dur, (x0 + rnd.uniform(-1.2, 1.2), .5, -6.2), 'linear')
        S.key(o, 'rotation_euler', 1, (0, 0, 0)); S.key(o, 'rotation_euler', st, (0, 0, 0), 'linear')
        S.key(o, 'rotation_euler', st + dur, (rnd.uniform(360, 900), rnd.uniform(-300, 300), rnd.uniform(-200, 200)), 'linear')

BG = {  # (boven, onder)
 'paars': ('#7c3aed', '#1e1b4b'), 'blauw': ('#2563eb', '#0f172a'), 'groen': ('#059669', '#052e2b'), 'rood': ('#e11d48', '#3b0a1e'),
 'oranje': ('#f97316', '#431407'), 'turq': ('#0891b2', '#082f49'), 'roze': ('#db2777', '#2e1065'), 'nacht': ('#1e3a8a', '#020617'),
 'goud': ('#d97706', '#1c1917'), 'lime': ('#65a30d', '#1a2e05'), 'ruimte': ('#312e81', '#02010a'), 'diep': ('#0e7490', '#042f2e')}

def hero_motion(S, e, motion, period=48):
    if motion == 'spin': S.spin(e, 2, 1); S.loop_bob(e, .15, period)
    elif motion == 'sway': wobble(S, e, 2, 28, 96); S.loop_bob(e, .2, period)
    elif motion == 'bob': S.loop_bob(e, .3, period); wobble(S, e, 2, 10, 96)
    elif motion == 'tumble': S.spin(e, 2, 1); wobble(S, e, 0, 18, 96)
    elif motion == 'pulse':
        s = e.scale[0]; t = 1
        while t <= S.frames: S.key(e, 'scale', t, s * (1 + .08 * math.sin(2 * PI * t / 36))); t += 9

# ---------------- weetjes ----------------
def _zs_top(n, z0=-.9, st=1.1): return [z0 - st * i for i in range(n)]
def _zs_bot(n, z0=3.9, st=1.1): return [z0 - st * i for i in range(n)]

def weetje(S, icon, lines, accent='#ffd23f', motion='spin', layout='top', extra=None, scale=1.3, tag='WIST JE DAT?', halo_on=True, seed=1, rot_z=-20, spark=True):
    """Held-icoon + feit in grote 3D-tekst. extra=(icoonnaam, n): rijtje kleine iconen dat één voor één verschijnt."""
    n = len(lines)
    if spark: sparkles(S, 14, seed, ('#ffffff', accent))
    txt(S, tag, (0, 0, 4.95), .42, accent, start=2, maxw=5)
    if layout == 'top':
        hz = 2.6 if not extra else 3.2; lz = _zs_top(n, -.9 if not extra else -1.0)
        if extra: hz = 2.95
    else:
        hz = -2.55; lz = _zs_bot(n)
    sc_ = scale * (0.75 if extra else 1.0)
    if halo_on: halo(S, (0, 0, hz), 1.9 if not extra else 1.6, accent, 3, 1 if seed % 2 else -1)
    e = S.spawn(icon, sc_, (0, 0, hz), rot_z); S.pop(e, 1, None, 10); hero_motion(S, e, motion)
    if extra:
        nm, k = extra; xs = [(i - (k - 1) / 2) * min(1.25, 4.8 / k) for i in range(k)]
        for i, x in enumerate(xs):
            m = S.spawn(nm, .5, (x, 0, .85), 0); S.pop(m, 14 + i * 9, None, 8); S.loop_bob(m, .12, 36, 14 + i * 9)
    txt_block(S, lines, lz, .8, '#ffffff', accent, start=20 if not extra else 22 + (extra[1]) * 5, gap=22 if n < 4 else 20)

def weetje_num(S, num, lines, icon=None, accent='#ffd23f', ncolor=None, seed=2, tag='WIST JE DAT?', size=2.6):
    sparkles(S, 12, seed, ('#ffffff', accent)); txt(S, tag, (0, 0, 4.95), .42, accent, start=2, maxw=5)
    o = txt(S, num, (0, 0, 2.7), size, ncolor or accent, start=3, maxw=5.0, extrude=.25)
    wobble(S, o, 2, 4, 72)
    if icon:
        e = S.spawn(icon, .5, (0, 0, 2.7), -15); S.pop(e, 14, None, 8)
        path(S, e, lambda t: (2.4 * math.cos(2 * PI * t + 2) , -.5 + 1.5 * math.sin(2 * PI * t + 2), 2.7 + 1.0 * math.sin(2 * PI * t + 2) + .6 * math.cos(2 * PI * t)), 1, S.frames, 2)
    txt_block(S, lines, _zs_top(len(lines), -.1, 1.1), .8, '#ffffff', accent, start=24, gap=22)

def weetje_bars(S, bars, lines, accent='#ffd23f', seed=3, tag='WIST JE DAT?', hmax=3.3):
    """bars = [(icoon, waarde, kleur)]. Staafdiagram dat groeit, met icoon bovenop."""
    sparkles(S, 12, seed, ('#ffffff', accent)); txt(S, tag, (0, 0, 4.95), .42, accent, start=2, maxw=5)
    n = len(bars); mx = max(b[1] for b in bars); base = -.15; sp = 5.0 / n * (1 if n > 2 else .75)
    for i, (ic, v, col) in enumerate(bars):
        x = (i - (n - 1) / 2) * sp; h = max(.25, hmax * v / mx); f0 = 8 + i * 14
        pivot = bpy.data.objects.new('p', None); bpy.context.collection.objects.link(pivot); pivot.location = (x, 0, base)
        c = cube((1.2, 1.0, 1.0), mat(col, .3, coat=.5), loc=(0, 0, .5), bevel=.06); c.parent = pivot
        S.key(pivot, 'scale', 1, (1, 1, .001)); S.key(pivot, 'scale', f0, (1, 1, .001)); S.key(pivot, 'scale', f0 + 26, (1, 1, h), 'BACK')
        e = S.spawn(ic, .62, (x, 0, base + .9), -15)
        S.key(e, 'location', 1, (x, 0, base + .5)); S.key(e, 'location', f0, (x, 0, base + .5)); S.key(e, 'location', f0 + 26, (x, 0, base + h + .85), 'BACK')
        S.key(e, 'scale', 1, .001); S.key(e, 'scale', f0, .001); S.key(e, 'scale', f0 + 6, .62); S.spin(e, 2, 1)
    txt_block(S, lines, _zs_top(len(lines), -1.3, 1.05), .78, '#ffffff', accent, start=8 + n * 14 + 20, gap=20)

# ---------------- quiz ----------------
CARDC = [('#2563eb', '#16a34a'), ('#db2777', '#16a34a'), ('#d97706', '#16a34a')]

def quiz(S, q, answers, correct, expl, icon=None, iscale=.45, style='clock', reveal='sparks', seed=0, accent='#ffd23f', ccols=None):
    """q: lijst vraagregels; answers: 3 teksten; correct: 0/1/2; expl: lijst uitlegregels."""
    R = 144; C0 = 72; F = S.frames; rnd = random.Random(seed)
    if icon:
        e = S.spawn(icon, iscale, (0, 0, 4.35), -15); S.pop(e, 1, None, 10); wobble(S, e, 2, 20, 72); S.loop_bob(e, .12, 48)
    nq = len(q); qz = {1: [2.5], 2: [2.9, 2.1], 3: [3.2, 2.4, 1.6]}[nq]
    txt_block(S, q, qz, .72 if nq <= 2 else .62, '#ffffff', accent, start=4, gap=8, end=R, maxw=5.5)
    zs = [.15, -1.3, -2.75]; cols = ccols or ['#2563eb', '#db2777', '#d97706']; letters = 'ABC'
    for i in range(3):
        card = pyobj = bpy.data.objects.new('card', None); bpy.context.collection.objects.link(card)
        m = mat(cols[i], .3, coat=.6); b = m.node_tree.nodes['Principled BSDF'].inputs['Base Color']
        body = cube((5.4, .3, 1.15), m, bevel=.18); body.parent = card
        bad = cyl(.4, .1, mat('#0b0b1e', .3, coat=.5), loc=(-2.2, -.2, 0), rot=(90, 0, 0)); bad.parent = card
        l = txt(S, letters[i], (-2.2, -.28, 0), .55, '#ffffff', pop=False); l.parent = card
        a = txt(S, answers[i], (.35, -.22, 0), .5, '#ffffff', pop=False, maxw=3.7); a.parent = card
        side = -1 if i % 2 == 0 else 1; f0 = 22 + i * 10; z = zs[i]
        S.key(card, 'location', 1, (side * 9, 0, z)); S.key(card, 'location', f0, (side * 9, 0, z)); S.key(card, 'location', f0 + 16, (0, 0, z), 'BACK')
        if i == correct:
            b.default_value = (*sc._hex(cols[i]), 1); b.keyframe_insert('default_value', frame=R - 1)
            b.default_value = (*sc._hex('#16a34a'), 1); b.keyframe_insert('default_value', frame=R + 5)
            S.key(card, 'scale', 1, 1.0); S.key(card, 'scale', R - 1, 1.0); S.key(card, 'scale', R + 8, 1.1, 'BACK'); 
            cc = (0, 0, z)
            for k in range(0, F - R, 24):
                pass
        else:
            S.key(card, 'location', R, (0, 0, z)); S.key(card, 'location', R + 16, (side * 1.5, 0, z - 9), 'ease')
            S.key(card, 'rotation_euler', 1, (0, 0, 0)); S.key(card, 'rotation_euler', R, (0, 0, 0)); S.key(card, 'rotation_euler', R + 16, (0, 0, side * 30))
    # aftellen
    if style == 'clock':
        cz = -4.25
        parts = [torus(.72, .07, mat(accent, .3, emit=1.2), rot=(90, 0, 0), minor=10), cyl(.68, .1, mat('#0b0b1e', .4), rot=(90, 0, 0))]
        piv = bpy.data.objects.new('hp', None); bpy.context.collection.objects.link(piv); piv.location = (0, -.12, 0)
        hand = cube((.07, .05, .52), mat('#ff4d6d', .3, emit=1.5), loc=(0, 0, .26), bevel=.01); hand.parent = piv
        S.key(piv, 'rotation_euler', C0, (0, 0, 0), 'linear'); S.key(piv, 'rotation_euler', C0 + 72, (0, -1080, 0), 'linear')
        g = group(parts + [piv], 'clock'); g.location = (-1.9, 0, cz)
        for k, nm in enumerate('321'):
            txt(S, nm, (-1.9, -.12, cz), 1.0, '#ffffff', start=C0 + k * 24, end=C0 + k * 24 + 23, extrude=.15)
        S.pop(g, C0 - 6, R, 8)
        lab = txt(S, 'Denk na...', (1.0, 0, cz), .5, accent, start=C0, end=R, maxw=3.0)
    else:
        cz = -4.75
        tr = cube((4.6, .1, .3), mat('#0b0b1e', .4), loc=(0, .05, cz), bevel=.1)
        piv = bpy.data.objects.new('bp', None); bpy.context.collection.objects.link(piv); piv.location = (-2.3, -.1, cz)
        fl = cube((4.6, .1, .22), mat(accent, .3, emit=1.2), loc=(2.3, 0, 0), bevel=.08); fl.parent = piv
        S.key(piv, 'scale', C0, (1, 1, 1), 'linear'); S.key(piv, 'scale', C0 + 72, (.001, 1, 1), 'linear')
        for o in (tr, piv): S.pop(o, C0 - 6, R, 6) if o is tr else None
        S.key(piv, 'scale', 1, (.001, 1, .001)); S.key(piv, 'scale', C0 - 1, (.001, 1, .001)); S.key(piv, 'scale', C0, (1, 1, 1), 'linear')
        S.key(piv, 'scale', R, (.001, 1, 1))
        for k, nm in enumerate('321'):
            txt(S, nm, (0, 0, -4.0), 1.15, '#ffffff', start=C0 + k * 24, end=C0 + k * 24 + 23, extrude=.15)
    # onthulling
    zc = zs[correct]
    if reveal == 'confetti': confetti(S, R, 34, seed)
    burst(S, (0, -.5, zc), R, 26 if reveal == 'sparks' else 16, seed=seed)
    txt(S, 'Antwoord %s!' % letters[correct], (0, 0, -4.4), .85, accent, start=R + 4, extrude=.12)
    txt_block(S, expl, {1: [2.5], 2: [2.9, 2.1], 3: [3.2, 2.4, 1.6]}[len(expl)], .6, '#ffffff', '#86efac', start=R + 8, gap=14, maxw=5.5)

LEVELS = ['LOW', 'VERYLOW', 'LOWEST']
def render_c(vid, make, bg=('#6366f1', '#1e1b4b'), seconds=8, floor=None, limit=330000):
    """Render mp4+jpg; verlaagt kwaliteit automatisch als het bestand te groot is. STILLS=frames,... in env -> alleen stills naar scratch."""
    S = sc.Short(seconds, bg, floor=floor); make(S)
    st = os.environ.get('STILLS')
    if st:
        out = os.environ['STILLDIR']; S.sc.render.image_settings.file_format = 'JPEG'; S.sc.render.image_settings.quality = 80
        for f in st.split(','):
            S.sc.frame_set(int(f)); S.sc.render.filepath = os.path.join(out, '%s_%s.jpg' % (vid, f)); bpy.ops.render.render(write_still=True)
        return
    mp4 = os.path.join(sc.OUT, vid + '.mp4'); S0 = S.sc
    for lv in LEVELS:
        S0.render.image_settings.file_format = 'FFMPEG'; S0.render.ffmpeg.format = 'MPEG4'; S0.render.ffmpeg.codec = 'H264'
        S0.render.ffmpeg.constant_rate_factor = lv; S0.render.ffmpeg.ffmpeg_preset = 'GOOD'; S0.render.ffmpeg.audio_codec = 'NONE'
        S0.render.filepath = mp4; S0.render.use_file_extension = False
        bpy.ops.render.render(animation=True)
        if os.path.getsize(mp4) <= limit: break
    S0.render.image_settings.file_format = 'JPEG'; S0.render.image_settings.quality = 78
    S0.frame_set(S.frames // 2); S0.render.filepath = os.path.join(sc.OUT, vid + '.jpg'); bpy.ops.render.render(write_still=True)
    print('DONE', vid, os.path.getsize(mp4), flush=True)

# ---------------- ruimte ----------------
PCOL = {'mercurius': '#a8a29e', 'venus': '#f1c27d', 'mars': '#e0553a', 'jupiter': '#e3a46b', 'saturnus': '#f2d58a', 'uranus': '#8be3e8', 'neptunus': '#3b64f0', 'maan': '#d6d3d1', 'aarde': '#2f7de1'}

def planet(name, r, loc=(0, 0, 0)):
    parts = [sphere(r, mat(PCOL[name], .5, coat=.3))]
    if name == 'aarde':
        for d, sx in (((-.3, -1, .4), .38), ((.45, -1, -.1), .3), ((-.5, -.9, -.35), .28)):
            n = math.sqrt(sum(c * c for c in d)); p = tuple(c / n * r * .97 for c in d)
            parts.append(sphere(r * sx, mat('#4cc95a', .5), loc=p, scale=(1, .35, .85)))
    if name == 'jupiter':
        for lat, c in ((-.45, '#b9784a'), (-.05, '#f6dcb4'), (.4, '#b9784a')):
            parts.append(torus(r * math.cos(lat) * 1.004, r * .07, mat(c, .5), loc=(0, 0, r * math.sin(lat)), minor=8))
    if name == 'saturnus':
        t = torus(r * 1.75, r * .16, mat('#d9b96a', .4), rot=(17, 0, 0), minor=8); t.scale = (1, 1, .12); parts.append(t)
    if name == 'uranus':
        t = torus(r * 1.5, r * .05, mat('#cffafe', .4), rot=(8, 0, 82), minor=6); parts.append(t)
    if name == 'mars':
        parts.append(sphere(r * .3, mat('#a13b27', .6), loc=(-r * .35, -r * .9, r * .2), scale=(1, .3, .7)))
    if name == 'maan':
        for x, z, s in ((-.3, .2, .22), (.35, -.25, .28), (.1, .55, .15)):
            parts.append(sphere(r * s, mat('#9ca3af', .8), loc=(x * r, -r * .94, z * r), scale=(1, .3, 1)))
    g = group(parts, name); g.location = loc; return g

def sunball(r=.8, loc=(0, 0, 0)):
    parts = [sphere(r, mat('#ffb300', .4, emit=3)), sphere(r * 1.18, mat('#ff9800', .5, emit=1.5))]
    g = group(parts, 'zon'); g.location = loc; return g

def starfield(S, n=40, seed=5, twinkle=10):
    rnd = random.Random(seed)
    for i in range(n):
        o = ico(rnd.uniform(.025, .065), mat('#ffffff', .3, emit=3), loc=(rnd.uniform(-3.2, 3.2), 5, rnd.uniform(-5.6, 5.6)), sub=1)
        if i < twinkle:
            ph = rnd.randint(0, 30); t = 1 + ph
            while t < S.frames: S.key(o, 'scale', t, 1.0 if ((t - ph) // 18) % 2 == 0 else .3); t += 18

def lines_top(S, lines, size=.8, z0=4.5, st=1.0, start=10, gap=18, accent='#ffd23f', **k):
    return txt_block(S, lines, [z0 - st * i for i in range(len(lines))], size, '#ffffff', accent, start=start, gap=gap, **k)

def lines_bot(S, lines, size=.8, z0=-2.7, st=1.0, start=10, gap=18, accent='#ffd23f', **k):
    return txt_block(S, lines, [z0 - st * i for i in range(len(lines))], size, '#ffffff', accent, start=start, gap=gap, **k)

def r_orbit(S, planets, lines, sun=True, cz=-1.0, k=.5, seed=1, accent='#ffd23f', where='top', size=.8):
    """planets: [(naam, straal, baanstraal, omwentelingen, fase)]."""
    starfield(S, 40, seed)
    (lines_top if where == 'top' else lines_bot)(S, lines, size, start=8, accent=accent) if where == 'top' else lines_bot(S, lines, size, z0=-3.3, start=8, accent=accent)
    if sun:
        s = sunball(.85, (0, 0, cz)); S.spin(s, 2, 1); S.pop(s, 1, None, 10)
    for (nm, r, R, revs, ph) in planets:
        o = torus(R, .018, mat('#ffffff', .5, emit=.6), loc=(0, .3, cz), rot=(90, 0, 0), minor=6); o.scale = (1, k, 1)
        p = planet(nm, r); S.spin(p, 2, 2)
        path(S, p, lambda t, R=R, revs=revs, ph=ph: (R * math.cos(2 * PI * revs * t + ph), R * math.sin(2 * PI * revs * t + ph) * .8, cz + k * R * math.sin(2 * PI * revs * t + ph)), 1, S.frames, 2)

def r_trip(S, planets, lines, seed=2, accent='#ffd23f', rz=-1.4, rscale=.95, where='top'):
    """Raket stijgt; planeten (naam, straal, x, startframe, duur) schuiven voorbij."""
    rnd = random.Random(seed); starfield(S, 25, seed, 6)
    for i in range(14):
        x = rnd.uniform(-3, 3); st0 = rnd.randint(1, 20); L = rnd.uniform(.5, 1.1); sp = rnd.randint(16, 26); t = st0 - sp + 8 * 0
        while t < S.frames:
            o = cube((.025, .025, L), mat('#cfe3ff', .3, emit=3), loc=(x, 4, 7), bevel=0)
            S.key(o, 'scale', 1, .001); 
            a = max(1, t); S.key(o, 'scale', a, .001) if t > 1 else None
            S.key(o, 'scale', max(1, t) + 1, 1.0); S.key(o, 'scale', t + sp, 1.0); S.key(o, 'scale', t + sp + 1, .001)
            S.key(o, 'location', max(1, t), (x, 4, 6.5 + L), 'linear'); S.key(o, 'location', t + sp, (x, 4, -6.5 - L), 'linear')
            t += sp + rnd.randint(0, 14)
    for (nm, r, x, f0, dur) in planets:
        p = planet(nm, r); S.spin(p, 2, 1)
        path(S, p, lambda t, x=x, r=r: (x, 2.5, 6.8 + r - t * (13.6 + 2 * r)), f0, f0 + dur, 3)
        S.key(p, 'location', 1, (x, 2.5, 8 + r)); S.key(p, 'location', f0 - 1, (x, 2.5, 8 + r))
        lb = txt(S, nm.capitalize(), (x, 0, 0), .5, '#ffffff', pop=False, maxw=2.6)
        lb2 = lb; path(S, lb2, lambda t, x=x, r=r: (x + (-1 if x > 0 else 1) * 0 , -.5, 6.8 + r - t * (13.6 + 2 * r) - r - .5), f0, f0 + dur, 3)
        S.key(lb2, 'location', 1, (x, -.5, 9)); S.key(lb2, 'location', f0 - 1, (x, -.5, 9))
    rk = S.spawn('rocket', rscale, (0, 0, rz), 0); S.pop(rk, 1, None, 10); S.loop_bob(rk, .06, 8, axis=0); S.loop_bob(rk, .15, 48)
    fm = mat('#ffb703', .3, emit=4)
    fl = cone(.28, 0, 1.3, fm, loc=(0, -.2, rz - 1.9), rot=(180, 0, 0))
    t = 1
    while t < S.frames: S.key(fl, 'scale', t, (1, 1, .7 + .5 * ((t // 3) % 2))); t += 3
    (lines_top(S, lines, .8, z0=4.5, start=6, accent=accent) if where == 'top' else lines_bot(S, lines, .8, z0=-3.6, start=6, accent=accent))

def lander():
    g = mat('#e5b34a', .3, .8, coat=.3); w = mat('#f1f5f9', .3, coat=.5); d = mat('#6b7280', .4, .6)
    parts = [cyl(.75, .8, g, loc=(0, 0, .4), seg=8), cyl(.55, .5, w, loc=(0, 0, 1.0), seg=8), sphere(.2, mat('#38bdf8', .1, coat=1), loc=(0, -.5, 1.05)), cone(.3, .12, .4, d, loc=(0, 0, -.1))]
    for sx in (-1, 1):
        parts.append(cube((.08, .08, 1.15), d, loc=(sx * .88, 0, -.2), rot=(0, sx * 30, 0), bevel=0)); parts.append(cyl(.24, .05, d, loc=(sx * 1.25, 0, -.75)))
    return group(parts, 'lander')

def r_land(S, lines, seed=3, accent='#ffd23f', flag='#ef4444'):
    starfield(S, 45, seed); lines_top(S, lines, .8, z0=4.5, start=8, accent=accent)
    gr = sphere(5.2, mat('#a8a29e', .9), loc=(0, 0, -5.5), scale=(1.4, 1, .33))
    for x, z, s in ((-2.3, -4.1, .55), (1.6, -4.5, .7), (3.0, -5.0, .5), (-1.0, -5.1, .6), (-3.3, -5.3, .45)):
        y = -5.2 * math.sqrt(max(.05, 1 - (x / 7.28) ** 2 - ((z + 5.5) / 1.72) ** 2))
        sphere(s, mat('#78716c', .9), loc=(x, y + .05, z), scale=(1, .25, .6))
    Z = -3.78 + .75 * 1.5; L = lander(); L.scale = (1.5,) * 3; L.location = (0, .8, 6.5); S.pop(L, 1, None, 6)
    S.key(L, 'location', 1, (0, .8, 6.5)); S.key(L, 'location', 40, (0, .8, 3.0), 'ease'); S.key(L, 'location', 120, (0, .8, Z + .4)); S.key(L, 'location', 132, (0, .8, Z), 'ease')
    fm = mat('#ffd166', .3, emit=4); fl = cone(.3, 0, 1.4, fm, loc=(0, .6, 5.5), rot=(180, 0, 0))
    t = 1
    while t < 132: path(S, fl, lambda u: (0, .6, 0), 1, 2, 1) if False else None; t += 100
    # vlam volgt lander
    for t in range(1, 133, 3):
        z = L.location[2]
    def Lz(f):
        import numpy
        return None
    fl.parent = None
    fr = [(1, 6.5), (40, 3.0), (120, Z + .4), (132, Z)]
    def lz_at(f):
        for (a, za), (b, zb) in zip(fr, fr[1:]):
            if a <= f <= b:
                u = (f - a) / (b - a); u = u * u * (3 - 2 * u); return za + (zb - za) * u
        return fr[-1][1]
    for t in range(1, 133, 3):
        fl.location = (0, .6, lz_at(t) - 1.2); fl.scale = (1, 1, .7 + .5 * ((t // 3) % 2)); fl.keyframe_insert('location', frame=t); fl.keyframe_insert('scale', frame=t)
    fl.scale = (.001,) * 3; fl.keyframe_insert('scale', frame=134)
    for i in range(10):
        a = PI * (i + .5) / 10 * (1 if i % 2 else 1); sx = 1 if i < 5 else -1; dx = (i % 5 + 1) * .55
        o = sphere(.18, mat('#d6d3d1', .9), loc=(0, .5, Z - .6)); S.key(o, 'scale', 1, .001); S.key(o, 'scale', 130, .001); S.key(o, 'scale', 134, 1.0); S.key(o, 'scale', 170, .001)
        S.key(o, 'location', 130, (0, .5, Z - .6)); S.key(o, 'location', 170, (sx * dx * 1.2, .5, Z - .5 + .15 * (i % 3)), 'ease')
    fp = cyl(.04, 1.5, mat('#e5e7eb', .3, .8), loc=(2.1, .2, -3.0), scale=(1, 1, 1)); fp.rotation_euler = (0, 0, 0); cl = cube((.8, .05, .5), mat(flag, .6), loc=(2.5, .2, -2.45), bevel=.02)
    for o in (fp, cl): S.pop(o, 150, None, 8)
    S.spin(L, 2, 0) if False else None

def r_astro(S, lines, planet_name='aarde', seed=4, accent='#ffd23f', where='bot'):
    starfield(S, 45, seed)
    if planet_name == 'aarde': pl = S.spawn('earth', .9, (2.0, 3, 4.0), 0)
    else: pl = planet(planet_name, .8, (2.0, 3, 4.0))
    S.spin(pl, 2, 1); S.pop(pl, 1, None, 10)
    a = S.spawn('astronaut', 1.7, (-.6, 0, .6), -15); S.pop(a, 4, None, 10)
    path(S, a, lambda t: (-.6 + .8 * math.sin(2 * PI * t), 0, .6 + .5 * math.sin(4 * PI * t)), 5, S.frames, 4)
    wobble(S, a, 0, 14, 96); wobble(S, a, 2, 25, 144, base=-15)
    lines_bot(S, lines, .8, z0=-2.6, start=14, accent=accent, gap=20)

def r_comet(S, lines, seed=5, accent='#ffd23f', n=3):
    rnd = random.Random(seed); starfield(S, 40, seed)
    lines_bot(S, lines, .8, z0=-2.2, start=10, accent=accent)
    for c in range(n):
        f0 = 4 + c * 46; z0 = rnd.uniform(4.4, 5.6); x0 = 4.4
        dx, dz = -8.8, -6.0; nr = math.hypot(dx, dz); ux, uz = dx / nr, dz / nr
        parts = [sphere(.4, mat('#e0f2fe', .2, emit=1.5))]
        for i in range(1, 12):
            parts.append(sphere(.38 * (1 - i / 13), mat('#7dd3fc' if i % 2 else '#bae6fd', .4, emit=2), loc=(-ux * i * .38, 0, -uz * i * .38)))
        g = group(parts, 'comet'); g.location = (x0, 1, z0)
        S.key(g, 'location', 1, (x0, 1, z0)); path(S, g, lambda t, x0=x0, z0=z0: (x0 + dx * t, 1, z0 + dz * t), f0, f0 + 90, 3)
        S.key(g, 'location', f0 + 92, (x0 + dx * 1.1, 1, z0 + dz * 1.1))

def r_scale(S, items, lines, seed=6, accent='#ffd23f', z0=-3.2):
    """items: [(naam, straal, x, z, label)] - planeten naast elkaar; verschijnen na elkaar."""
    starfield(S, 40, seed)
    for i, (nm, r, x, z, lb) in enumerate(items):
        p = planet(nm, r, (x, 0, z)); S.pop(p, 6 + i * 18, None, 10); S.spin(p, 2, 1)
        txt(S, lb, (x, -.3, z - max(r, .3) - .55), .55, '#ffffff', start=14 + i * 18, maxw=2.8)
    lines_top(S, lines, .8, z0=4.6, start=50, accent=accent, gap=18)

def r_hole(S, lines, seed=7, accent='#ffd23f', cz=1.7, where='bot'):
    starfield(S, 45, seed); F = S.frames
    bh = sphere(1.15, mat('#000000', 1.0), loc=(0, 0, cz)); S.pop(bh, 1, None, 10)
    acc = torus(2.1, .34, mat('#ff8a1f', .4, emit=3.5), loc=(0, 0, cz), rot=(16, 0, 0), minor=10); acc.scale = (1, 1, .22)
    torus(1.45, .06, mat('#ffd9a0', .3, emit=4), loc=(0, -.3, cz), rot=(90, 0, 0), minor=8)
    rnd = random.Random(seed); T = 96
    for i in range(22):
        ph0 = rnd.uniform(0, 2 * PI); off = rnd.randint(0, T - 1); col = rnd.choice(['#ffffff', '#a5f3fc', '#fde68a', '#fca5a5']); t0 = 1 - off
        while t0 < F:
            a_ = max(1, t0); b_ = min(F, t0 + T)
            if b_ - a_ >= 8:
                o = ico(.19, mat(col, .3, emit=3), sub=1)
                if t0 >= 1: S.key(o, 'scale', 1, .001); S.key(o, 'scale', max(1, a_ - 1), .001); S.key(o, 'scale', a_ + 3, 1.0)
                else: S.key(o, 'scale', 1, 1.0)
                if b_ < F: S.key(o, 'scale', b_ - 8, 1.0); S.key(o, 'scale', b_, .001)
                def fn(u, a_=a_, b_=b_, t0=t0, ph0=ph0):
                    f = ((a_ + u * (b_ - a_)) - t0) / T; r = 4.4 * (1 - f) + .6; g = ph0 + 2 * PI * 1.7 * f ** .75
                    return (r * math.cos(g), r * math.sin(g), cz + .42 * r * math.sin(g))
                path(S, o, fn, a_, b_, 2)
            t0 += T
    lines_bot(S, lines, .8, z0=-2.6, start=10, accent=accent, gap=20)

def r_sat(S, lines, seed=8, accent='#ffd23f', n=2):
    starfield(S, 40, seed); e = S.spawn('earth', 1.35, (0, 0, 1.2), 0); S.spin(e, 2, 1); S.pop(e, 1, None, 10)
    cz = 1.2
    o = torus(2.9, .02, mat('#ffffff', .5, emit=.6), loc=(0, .2, cz), rot=(90, 0, 0), minor=6); o.scale = (1, .3, 1)
    for i in range(n):
        s = S.spawn('satellite', .95, (0, 0, cz), 0); ph = 2 * PI * i / n; S.pop(s, 4, None, 8)
        path(S, s, lambda t, ph=ph: (2.9 * math.cos(2 * PI * t + ph), 2.9 * math.sin(2 * PI * t + ph) * .9, cz + .3 * 2.9 * math.sin(2 * PI * t + ph)), 5, S.frames, 2)
        S.spin(s, 2, 1)
    lines_bot(S, lines, .8, z0=-2.6, start=12, accent=accent, gap=20)

# ---------------- fantasie ----------------
def flame_puff(S, o, f, dur, p0, p1, s1=1.6):
    S.key(o, 'scale', 1, .001); S.key(o, 'scale', max(2, f - 1), .001); S.key(o, 'scale', f + 4, 1.0); S.key(o, 'scale', f + dur, s1 * 1.3 if False else .001)
    S.key(o, 'location', 1, p0); S.key(o, 'location', max(2, f - 1), p0); S.key(o, 'location', f + dur, p1, 'linear')

MOUTH = (.2, -.6, .9)
def f_dragon(S, lines, target='pizza', fire=('#ff7a00', '#ffd23f'), seed=1, accent='#ffd23f', rot_z=75, bursts=((14, 60), (88, 134), (160, 190))):
    sparkles(S, 12, seed, ('#ffffff', fire[1]))
    dr = S.spawn('dragon', 1.5, (-1.5, 0, -1.8), rot_z); S.pop(dr, 1, None, 10); S.loop_bob(dr, .15, 48); wobble(S, dr, 1, 4, 72)
    mouth = MOUTH; fm = [mat(fire[0], .4, emit=4), mat(fire[1], .4, emit=5)]; rnd = random.Random(seed)
    for (a, b) in bursts:
        for f in range(a, b, 2):
            o = ico(.22, fm[(f // 2) % 2], loc=mouth, sub=1)
            p1 = (mouth[0] + 3.4, mouth[1] - .3, mouth[2] + rnd.uniform(-.4, .3))
            S.key(o, 'scale', 1, .001); S.key(o, 'scale', max(2, f - 1), .001); S.key(o, 'scale', f + 4, 1.0); S.key(o, 'scale', f + 18, 3.0); S.key(o, 'scale', f + 19, .001)
            S.key(o, 'location', 1, mouth); S.key(o, 'location', max(2, f - 1), mouth); S.key(o, 'location', f + 18, p1, 'linear')
    tg = S.spawn(target, 1.0, (2.0, 0, .2), 0); S.pop(tg, 6, None, 10); S.loop_bob(tg, .1, 36)
    lines_top(S, lines, .8, z0=4.5, start=10, accent=accent, gap=22)

def f_wand(S, lines, items, seed=2, accent='#ffd23f', cz=-.6, fcol=('#ffffff', '#ffd23f', '#ff6bd6', '#6be3ff')):
    sparkles(S, 14, seed, fcol)
    w = S.spawn('wand', 1.5, (1.5, 0, -3.2), 0); S.pop(w, 1, None, 8); wobble(S, w, 1, 30, 36); S.loop_bob(w, .1, 36)
    n = len(items); step = (S.frames - 20) // n
    for i, it in enumerate(items):
        f = 14 + i * step; e = S.spawn(it, 1.6, (0, 0, cz), -15)
        S.key(e, 'scale', 1, .001); S.key(e, 'scale', f - 1, .001); S.key(e, 'scale', f + 8, 1.6 * 1.15); S.key(e, 'scale', f + 14, 1.6)
        S.key(e, 'scale', f + step - 8, 1.6); S.key(e, 'scale', f + step - 2, .001)
        S.spin(e, 2, 1, f, f + step); burst(S, (0, -.5, cz), f, 22, fcol, 1.2, 3.0, seed=seed + i)
    lines_top(S, lines, .8, z0=4.5, start=10, accent=accent, gap=22)

def chest():
    wd = mat('#8b5a2b', .5, coat=.3); gd = mat('#ffc61a', .22, 1.0, coat=.3)
    base = [cube((2.6, 1.6, 1.3), wd, loc=(0, 0, 0), bevel=.1), cube((2.7, .15, 1.35), gd, loc=(0, -.78, 0), bevel=.02)]
    for x in (-1.0, 1.0): base.append(cube((.25, 1.7, 1.35), gd, loc=(x, 0, 0), bevel=.03))
    lid = [cube((2.6, 1.6, .55), wd, loc=(0, -.8, .28), bevel=.1)]
    for x in (-1.0, 1.0): lid.append(cube((.25, 1.7, .6), gd, loc=(x, -.8, .28), bevel=.03))
    lid.append(cube((.35, .1, .4), gd, loc=(0, -1.65, 0), bevel=.03))
    lg = group(lid, 'lid'); lg.location = (0, .8, .65)
    return group(base, 'base'), lg

def f_chest(S, lines, items, seed=3, accent='#ffd23f', cz=-1.0):
    sparkles(S, 12, seed, ('#ffffff', '#ffd23f'))
    b, lid = chest(); b.location = (0, 0, cz); lid.parent = b; lid.location = (0, .8, .65)
    b.rotation_euler = (0, 0, math.radians(-10)); S.pop(b, 1, None, 10)
    S.key(lid, 'rotation_euler', 1, (0, 0, 0)); S.key(lid, 'rotation_euler', 40, (0, 0, 0)); S.key(lid, 'rotation_euler', 58, (-115, 0, 0), 'BACK')
    glow_ = cone(.7, .15, 2.2, mat('#ffe27a', .3, emit=1.2), loc=(0, .3, cz + 1.7), seg=24)
    S.key(glow_, 'scale', 1, .001); S.key(glow_, 'scale', 46, .001); S.key(glow_, 'scale', 62, (1, 1, 1)); S.key(glow_, 'scale', 120, (1.1, 1.1, 1.0)); S.key(glow_, 'scale', S.frames, (1.0, 1.0, 1.0))
    burst(S, (0, -.5, cz + .8), 50, 24, ('#ffd23f', '#ffffff', '#ff6bd6', '#6be3ff'), 1.5, 3.4, seed=seed)
    n = len(items)
    for i, it in enumerate(items):
        a = 2 * PI * i / n; tx = (i - (n - 1) / 2) * 1.6; tz = 2.6 + (i % 2) * .9; f = 52 + i * 6
        e = S.spawn(it, .8, (0, 0, cz + .8), -15)
        S.key(e, 'scale', 1, .001); S.key(e, 'scale', f - 1, .001); S.key(e, 'scale', f + 12, .8, 'BACK')
        S.key(e, 'location', 1, (0, 0, cz + .8)); S.key(e, 'location', f - 1, (0, 0, cz + .8)); S.key(e, 'location', f + 24, (tx, -.2, tz), 'BACK')
        S.spin(e, 2, 2, f, S.frames)
        t = f + 24
        while t < S.frames:
            S.key(e, 'location', t + 12, (tx, -.2, tz + .25), 'ease'); S.key(e, 'location', t + 24, (tx, -.2, tz), 'ease'); t += 24
    lines_bot(S, lines, .8, z0=-3.9, st=.95, start=20, accent=accent, gap=26)

def f_castle(S, lines, seed=4, accent='#ffffff', motion=True, rainbow=True):
    rnd = random.Random(seed)
    if rainbow:
        rb = S.spawn('rainbow', 1.8, (0, 2.5, 0), 0); S.pop(rb, 1, None, 10)
    c = S.spawn('castle', 1.6, (0, 0, 1.0), -10); S.pop(c, 1, None, 10); S.loop_bob(c, .18, 72); wobble(S, c, 2, 8, 144)
    for i in range(7):
        x0 = -6 + i * 2.1; z = rnd.uniform(-1.0, 1.0) + (.2 if i % 2 else -.3) + (-.2 if i < 3 or i > 4 else .9 * 0)
        if 2 <= i <= 4: z = .35 + (i - 3) * .1
        s = S.spawn('cloud', rnd.uniform(.9, 1.3), (x0, -.4 if 2 <= i <= 4 else 1.5, z - (.3 if 2 <= i <= 4 else 0)), 0)
        sp = rnd.uniform(.6, 1.2)
        path(S, s, lambda t, x0=x0, z=z, sp=sp, y=s.location[1]: (x0 + 2.4 * sp * math.sin(2 * PI * t), y, z - (.3 if 2 <= i <= 4 else 0)), 1, S.frames, 6) if False else None
        zz = s.location[2]; yy = s.location[1]
        path(S, s, lambda t, x0=x0, sp=sp, y=yy, zz=zz: (x0 + 1.2 * sp * math.sin(2 * PI * t), y, zz), 1, S.frames, 6)
    lines_bot(S, lines, .8, z0=-3.6, st=1.0, start=16, accent=accent, gap=24)

def cauldron():
    pot = lathe([(.001, 0), (.8, .02), (1.2, .5), (1.4, 1.0), (1.3, 1.5), (1.45, 1.6), (1.3, 1.62)], mat('#1f2937', .3, .6, coat=.5), seg=36)
    parts = [pot] + [sphere(.2, mat('#111827', .4), loc=(x, y, -.1)) for x, y in ((-.7, -.4), (.7, -.4), (0, .8))]
    return group(parts, 'cauldron')

def f_potion(S, lines, ingredients, colors, seed=5, accent='#ffd23f', final='dragon', pz=-2.6):
    sparkles(S, 10, seed, ('#ffffff', '#c084fc'))
    c = cauldron(); c.location = (0, 0, pz); c.scale = (1.25,) * 3; S.pop(c, 1, None, 10)
    liq = sphere(1.7, mat(colors[0], .2, coat=1, emit=.6), loc=(0, 0, pz + 1.95), scale=(1, 1, .3)); b = liq.data.materials[0].node_tree.nodes['Principled BSDF']
    ec = b.inputs['Emission Color']; bc = b.inputs['Base Color']
    n = len(ingredients); T0 = 22; st = (S.frames - 70) // n
    for i in range(n + 1):
        f = T0 + (i + 1) * st - 4; col = colors[min(i, len(colors) - 1)] if i < len(colors) else colors[-1]
        v = (*sc._hex(col), 1); bc.default_value = v; ec.default_value = v; bc.keyframe_insert('default_value', frame=max(1, f)); ec.keyframe_insert('default_value', frame=max(1, f))
    for i, it in enumerate(ingredients):
        f = T0 + i * st; e = S.spawn(it, .65, (0, 0, 6), -15)
        S.key(e, 'location', 1, (-.3 + .3 * i, -.2, 6.2)); S.key(e, 'location', f, (-.3 + .3 * i, -.2, 6.2)); S.key(e, 'location', f + 22, (0, -.2, pz + 2.5), 'ease')
        S.key(e, 'scale', 1, .001); S.key(e, 'scale', f, .001); S.key(e, 'scale', f + 2, .65); S.key(e, 'scale', f + 21, .65); S.key(e, 'scale', f + 24, .001)
        S.spin(e, 2, 1, f, f + 22)
        burst(S, (0, -.5, pz + 2.3), f + 22, 10, (colors[min(i + 1, len(colors) - 1)], '#ffffff'), .5, 1.6, size=.1, seed=seed + i, dur=14)
    # bellen en stoom
    rnd = random.Random(seed)
    for i in range(10):
        x = rnd.uniform(-.9, .9); ph = rnd.randint(0, 40); o = sphere(rnd.uniform(.08, .16), mat('#ffffff', .1, emit=.8), loc=(x, -.3, pz + 2.1))
        t = 1 + ph
        while t < S.frames - 18:
            S.key(o, 'scale', t, .001); S.key(o, 'scale', t + 3, 1.0); S.key(o, 'scale', t + 17, 1.0); S.key(o, 'scale', t + 18, .001)
            S.key(o, 'location', t, (x, -.3, pz + 2.1), 'linear'); S.key(o, 'location', t + 18, (x + rnd.uniform(-.3, .3), -.3, pz + 3.1), 'linear'); t += 24 + rnd.randint(-4, 6)
    fe = S.frames - 66
    burst(S, (0, -.5, pz + 2.6), fe, 30, (colors[-1], '#ffffff', '#ffd23f'), 1.6, 3.6, seed=seed + 9)
    d = S.spawn(final, .85, (0, -.2, pz + 2.6), -15); S.key(d, 'scale', 1, .001); S.key(d, 'scale', fe, .001); S.key(d, 'scale', fe + 14, 1.05, 'BACK')
    S.key(d, 'scale', fe + 24, .85); S.key(d, 'rotation_euler', fe, (0, 0, 0)); S.key(d, 'rotation_euler', S.frames, (0, 0, 360), 'ease')
    S.key(d, 'location', fe, (0, -.2, pz + 2.4)); S.key(d, 'location', fe + 20, (0, -.2, pz + 3.0), 'BACK'); S.key(d, 'location', S.frames, (0, -.2, pz + 3.3), 'ease')
    lines_top(S, lines, .8, z0=4.5, start=8, accent=accent, gap=20)
    return

def f_unicorn(S, lines, seed=6, accent='#ffffff', items=('heart', 'star')):
    sparkles(S, 16, seed, ('#ffffff', '#ff9ee8', '#a5f3fc', '#fde68a'))
    rb = S.spawn('rainbow', 2.0, (0, 2.5, -1.2), 0); S.pop(rb, 1, None, 10)
    u = S.spawn('unicorn', 1.15, (-1.6, 0, -.8), -15); S.pop(u, 1, None, 8)
    T = 48; t = 1
    while t <= S.frames:
        x = -1.6 + 3.2 * (.5 - .5 * math.cos(2 * PI * (t - 1) / 96)); z = -.8 + abs(math.sin(2 * PI * (t - 1) / T)) * 1.0
        S.key(u, 'location', t, (x, 0, z), 'linear'); t += 4
    wobble(S, u, 2, 10, T, base=-15)
    rnd = random.Random(seed)
    for i in range(9):
        it = items[i % len(items)]; x = rnd.uniform(-2.4, 2.4); f = 6 + i * 18
        e = S.spawn(it, .35, (x, 0, -2), 0)
        S.key(e, 'scale', 1, .001); S.key(e, 'scale', f, .001); S.key(e, 'scale', f + 6, .35); S.key(e, 'scale', f + 50, .35); S.key(e, 'scale', f + 56, .001)
        S.key(e, 'location', 1, (x, 0, -2)); S.key(e, 'location', f, (x, 0, -2.5)); S.key(e, 'location', f + 56, (x + rnd.uniform(-.6, .6), 0, 3.6), 'linear')
        S.spin(e, 2, 1, f, f + 56)
    lines_bot(S, lines, .8, z0=-3.4, st=1.0, start=16, accent='#ffe66d', gap=24)
