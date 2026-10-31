"""Gedeelde hulpfuncties voor batch 'a' (shorts s001-s100)."""
import bpy, math, random, colorsys, os, sys
from mathutils import Vector, Quaternion, Euler, Matrix
import shorts_common as sc
from shorts_common import mat, sphere, cube, cyl, cone, torus, ico, plane, lathe, extrude_poly, curve_tube, group

_mc = {}
def M(c, r=.35, **kw):
    k = (c, r, tuple(sorted(kw.items())))
    if k not in _mc: _mc[k] = mat(c, r, **kw)
    return _mc[k]

def rgb(h, s=.75, v=.95):
    r, g, b = colorsys.hsv_to_rgb(h % 1, s, v); return '#%02x%02x%02x' % (int(r * 255), int(g * 255), int(b * 255))
def hx(c): c = c.lstrip('#'); return tuple(int(c[i:i + 2], 16) / 255 for i in (0, 2, 4))
def mix(a, b, t):
    A, B = hx(a), hx(b); return '#%02x%02x%02x' % tuple(int((A[i] + (B[i] - A[i]) * t) * 255) for i in range(3))
def clamp(x, a=0., b=1.): return max(a, min(b, x))
def smooth(x): x = clamp(x); return x * x * (3 - 2 * x)
def lerp(a, b, t): return a + (b - a) * t
def lerp3(a, b, t): return tuple(lerp(a[i], b[i], t) for i in range(3))

# ---------- keyframes ----------
def K(o, f, loc=None, rot=None, scl=None, quat=None):
    if loc is not None: o.location = loc; o.keyframe_insert('location', frame=f)
    if rot is not None: o.rotation_euler = tuple(math.radians(a) for a in rot); o.keyframe_insert('rotation_euler', frame=f)
    if quat is not None: o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = quat; o.keyframe_insert('rotation_quaternion', frame=f)
    if scl is not None: o.scale = scl if hasattr(scl, '__len__') else (scl,) * 3; o.keyframe_insert('scale', frame=f)

def anim(o, fn, N, step=1, f0=1):
    """fn(f) -> dict(loc=,rot=,scl=,quat=). Keyt elk `step` frames."""
    f = f0
    while f <= N:
        K(o, f, **fn(f)); f += step
    if (f - step) != N: K(o, N, **fn(N))

def hide(o, f0, f1=None):
    """Onzichtbaar (schaal 0) van f0 tot f1."""
    pass

def appear(o, f, dur=6, s=None):
    s = s if s is not None else (o.scale[0] or 1)
    K(o, max(1, f - 1), scl=0.001); K(o, f + dur // 2, scl=s * 1.12); K(o, f + dur, scl=s)

def vanish(o, f, dur=5, s=None):
    s = s if s is not None else (o.scale[0] or 1)
    K(o, f, scl=s); K(o, f + dur, scl=0.001)

def quat_between(a, b):
    return Vector((0, 0, 1)).rotation_difference(Vector(b) - Vector(a) if True else None)

def link(a, b, r=.06, m=None, seg=10):
    """Cilinder (eenheidslengte) tussen punten; geef object terug; gebruik set_link om te animeren."""
    o = cyl(r, 1, m, seg=seg); set_link(o, a, b); return o
def set_link(o, a, b, f=None):
    a = Vector(a); b = Vector(b); d = b - a; L = max(d.length, 1e-4)
    loc = (a + b) / 2; q = Vector((0, 0, 1)).rotation_difference(d)
    sc_ = (1, 1, L)
    if f is None:
        o.location = loc; o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = q; o.scale = sc_
    else:
        o.rotation_mode = 'QUATERNION'; K(o, f, loc=tuple(loc), quat=q, scl=sc_)

def base_cube(size, m, loc=(0, 0, 0), bevel=0.03):
    """Kubus waarvan de oorsprong onderaan het midden ligt."""
    o = cube(size, m, loc, bevel=bevel)
    o.data.transform(Matrix.Translation((0, 0, size[2] / 2))); return o

def empty(loc=(0, 0, 0), name='e'):
    e = bpy.data.objects.new(name, None); bpy.context.collection.objects.link(e); e.location = loc; return e

def parent(o, p):
    o.parent = p; return o

# ---------- camera & titel ----------
def cam_look(S, az=0, pitch=90, target=(0, 0, 0), scale=10.7):
    cam = S.cam; cam.rotation_euler = (math.radians(pitch), 0, math.radians(az))
    d = cam.rotation_euler.to_matrix() @ Vector((0, 0, -1))
    cam.location = Vector(target) - d * 25; cam.data.ortho_scale = scale; cam.data.clip_end = 100

def title(S, s, color='#ffffff', start=4, size=None, y=4.55, end=None):
    n = max(len(s), 1); size = size or min(0.78, 5.5 / (0.56 * n))
    cu = bpy.data.curves.new('t', 'FONT'); cu.body = s; cu.size = size; cu.extrude = 0.05; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
    o = bpy.data.objects.new('title', cu); bpy.context.collection.objects.link(o)
    o.data.materials.append(M(color, .5, emit=1.0))
    o.parent = S.cam; o.location = (0, y, -10); o.rotation_euler = (0, 0, 0)
    S.pop(o, start, end, 8); return o

def label(S, s, loc, size=.6, color='#ffffff', start=1, end=None, emit=1.0):
    """Wereldtekst die recht naar de camera kijkt."""
    cu = bpy.data.curves.new('t', 'FONT'); cu.body = s; cu.size = size; cu.extrude = 0.04; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
    o = bpy.data.objects.new('label', cu); bpy.context.collection.objects.link(o)
    o.data.materials.append(M(color, .5, emit=emit)); o.rotation_euler = S.cam.rotation_euler.copy(); o.location = loc
    S.pop(o, start, end, 6); return o

# ---------- fysica ----------
def drop_series(z0, zl, f_start, nframes, e=.42, g=22., vz0=0., fps=24):
    """Vrije val met stuiter: geeft dict frame->z (vanaf f_start tot nframes)."""
    out = {}; z = z0; v = vz0; sub = 4; rest = False
    for f in range(f_start, nframes + 1):
        out[f] = z
        if rest: continue
        for _ in range(sub):
            v -= g / fps / sub; z += v / fps / sub
            if z <= zl:
                z = zl; v = -v * e
                if abs(v) < 1.2: v = 0; rest = True; z = zl; break
    return out

def parab(p0, p1, T, g, f):
    """Positie op worp van p0 naar p1 in T frames met zwaartekracht g (eenh/frame^2) op frame-offset f."""
    t = f; x = lerp(p0[0], p1[0], t / T); y = lerp(p0[1], p1[1], t / T)
    vz = (p1[2] - p0[2] + .5 * g * T * T) / T
    return (x, y, p0[2] + vz * t - .5 * g * t * t)

# ---------- uitvoeren ----------
def run(vid, make, bg, seconds=10, floor=None):
    _mc.clear()
    S = sc.Short(seconds, bg, floor=floor); make(S); return S.render(vid)

def stars(S, n=60, seed=1, spread=(3, 5.4), y=8, size=.04, z0=0):
    rnd = random.Random(seed); out = []
    for i in range(n):
        o = sphere(size * rnd.uniform(.6, 1.6), M('#ffffff', .5, emit=2.0), (rnd.uniform(-spread[0], spread[0]), y, z0 + rnd.uniform(-spread[1], spread[1])), seg=6)
        out.append(o)
    return out

# ---------- extra ----------
def lin(o):
    ad = o.animation_data
    if ad and ad.action:
        for fc in ad.action.fcurves:
            for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'

def scroll(period, m=1, n=240, y=0, z=0):
    """Lege parent die in n frames m perioden naar links schuift (naadloze lus)."""
    E = empty((0, y, z)); K(E, 1, loc=(0, y, z)); K(E, n + 1, loc=(-period * m, y, z)); lin(E); return E

def track(wps, f):
    """wps = [(frame, v1, v2,...)]; zachte interpolatie tussen waypoints."""
    if f <= wps[0][0]: return wps[0][1:]
    for a, b in zip(wps, wps[1:]):
        if f <= b[0]:
            t = smooth((f - a[0]) / max(1, (b[0] - a[0]))); return tuple(lerp(a[i], b[i], t) for i in range(1, len(a)))
    return wps[-1][1:]

def ik2(B, E, L1, L2, up=True):
    dx, dz = E[0] - B[0], E[1] - B[1]; d = max(1e-3, min(math.hypot(dx, dz), L1 + L2 - 1e-3, ))
    a = math.atan2(dz, dx); c = clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1); al = math.acos(c)
    t1 = a + al if up else a - al
    El = (B[0] + L1 * math.cos(t1), B[1] + L1 * math.sin(t1))
    return El, (B[0] + d * math.cos(a), B[1] + d * math.sin(a))

def ribbon(top, bot, depth, m, y0=0.):
    """Gesloten massieve strook tussen twee (x,z)-lijnen, y van y0 tot y0+depth."""
    import bmesh
    me = bpy.data.meshes.new('rb'); o = bpy.data.objects.new('rb', me); bpy.context.collection.objects.link(o)
    bm = bmesh.new(); n = len(top)
    vf_t = [bm.verts.new((x, y0, z)) for x, z in top]; vf_b = [bm.verts.new((x, y0, z)) for x, z in bot]
    vb_t = [bm.verts.new((x, y0 + depth, z)) for x, z in top]; vb_b = [bm.verts.new((x, y0 + depth, z)) for x, z in bot]
    for i in range(n - 1):
        bm.faces.new((vf_t[i], vf_t[i + 1], vf_b[i + 1], vf_b[i])); bm.faces.new((vb_t[i], vb_t[i + 1], vb_b[i + 1], vb_b[i]))
        bm.faces.new((vf_t[i], vf_t[i + 1], vb_t[i + 1], vb_t[i])); bm.faces.new((vf_b[i], vf_b[i + 1], vb_b[i + 1], vb_b[i]))
    bm.faces.new((vf_t[0], vf_b[0], vb_b[0], vb_t[0])); bm.faces.new((vf_t[-1], vf_b[-1], vb_b[-1], vb_t[-1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
    o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = False
    return o

def lights_follow(S):
    cam = S.cam; bpy.context.view_layer.update()
    for o in list(bpy.data.objects):
        if o.type == 'LIGHT':
            mw = o.matrix_world.copy(); o.parent = cam; o.matrix_parent_inverse = cam.matrix_world.inverted()
