"""Hulpmiddelen voor korte (≈10 s) verticale Blender-animaties (shorts). Gebruik in een scriptbestand:

    import shorts_common as sc
    def make(S):                      # S = sc.Short(...)
        coin = S.spawn('coin')       # bouwt een icoonmodel uit models_a/models_b als één object (lege parent)
        coin.location = (0, 0, 3)
        S.key(coin, 'location', 0, (0, 0, 3)); S.key(coin, 'location', 24, (0, 0, 0), ease='BOUNCE')
        S.text('Hoi!', (0, 0, 4), size=0.8, color='#ffffff', start=10)
    sc.render_short('sc-001', make, bg=('#7c3aed', '#1e1b4b'), seconds=10)

Uitvoer: docs/shorts/<id>.mp4 (H.264, 360x640, 24 fps, zonder geluid) + docs/shorts/<id>.jpg (poster, frame midden).
Wereld: z omhoog, camera kijkt naar +Y vanuit -Y. Zichtbaar kader ≈ x∈[-3,3], z∈[-5.3,5.3] bij y=0 (portret 9:16)."""
import bpy, math, os, sys, subprocess, importlib
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
ROOT = os.path.abspath(os.path.join(HERE, '..', '..')); OUT = os.path.join(ROOT, 'docs', 'shorts'); os.makedirs(OUT, exist_ok=True)
import common
from common import mat, sphere, cube, cyl, cone, torus, ico, plane, lathe, extrude_poly, curve_tube, group

FPS = 24; W = 360; H = 640

_models = {}
def _load_models():
    if _models: return
    for m in ('models_a', 'models_b'):
        _models.update(importlib.import_module(m).MODELS)

def _hex(c):
    c = c.lstrip('#'); return tuple(pow(int(c[i:i+2], 16) / 255, 2.2) for i in (0, 2, 4))

class Short:
    def __init__(self, seconds=10, bg=('#6366f1', '#1e1b4b'), fps=FPS, floor=None):
        self.fps = fps; self.frames = int(seconds * fps); self.seconds = seconds
        sc = common.reset(); self.sc = sc
        sc.render.resolution_x = W; sc.render.resolution_y = H
        sc.frame_start = 1; sc.frame_end = self.frames; sc.render.fps = fps
        sc.eevee.taa_render_samples = 16
        sc.render.film_transparent = False
        self._background(bg)
        self._camera(); self._lights()
        if floor: self.floor(floor)

    # ---------- opbouw ----------
    def _background(self, bg):
        w = self.sc.world; nt = w.node_tree; nt.nodes.clear()
        out = nt.nodes.new('ShaderNodeOutputWorld'); bgn = nt.nodes.new('ShaderNodeBackground')
        tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); ramp = nt.nodes.new('ShaderNodeValToRGB')
        mp = nt.nodes.new('ShaderNodeMapRange')
        nt.links.new(tc.outputs['Window'], sep.inputs[0])
        # verloop op schermhoogte (Window.y 0=onder 1=boven) -> werkt voor camera-achtergrond
        nt.links.new(sep.outputs['Y'], ramp.inputs['Fac'])
        ramp.color_ramp.elements[0].color = (*_hex(bg[1]), 1); ramp.color_ramp.elements[1].color = (*_hex(bg[0]), 1)
        nt.links.new(ramp.outputs['Color'], bgn.inputs['Color']); bgn.inputs['Strength'].default_value = 1.0
        nt.links.new(bgn.outputs['Background'], out.inputs['Surface'])
    def _camera(self):
        bpy.ops.object.camera_add(location=(0, -14, 0), rotation=(math.radians(90), 0, 0)); cam = bpy.context.object
        cam.data.type = 'ORTHO'; cam.data.ortho_scale = 10.7  # hoogte-gebaseerd: breedte = 6.0 bij 9:16
        self.cam = cam; self.sc.camera = cam
    def _lights(self):
        def lamp(kind, loc, e, size, col=(1, 1, 1)):
            bpy.ops.object.light_add(type=kind, location=loc); l = bpy.context.object; l.data.energy = e; l.data.color = col
            if kind == 'AREA': l.data.size = size
            l.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); return l
        lamp('AREA', (4, -8, 8), 1100, 6, (1, .96, .9)); lamp('AREA', (-6, -5, 3), 450, 6, (.8, .9, 1)); lamp('AREA', (0, 6, 5), 500, 5)
    def floor(self, color='#312e81', z=-4.6, size=30):
        o = plane((size, size), mat(color, .6), loc=(0, 0, z), rot=(90, 0, 0)); o.rotation_euler = (0, 0, 0); o.location = (0, 0, z); return o

    # ---------- objecten ----------
    def spawn(self, name, scale=1.0, loc=(0, 0, 0), rot_z=-20):
        """Bouw icoonmodel `name` en geef de lege parent terug (draaien/schalen/animeren kan direct)."""
        _load_models(); before = set(bpy.data.objects)
        opt = _models[name]() or {}
        new = [o for o in bpy.data.objects if o not in before and o.parent is None]
        e = bpy.data.objects.new(name, None); bpy.context.collection.objects.link(e)
        for o in new: o.parent = e
        e.rotation_euler = (0, 0, math.radians(rot_z)); e.scale = (scale,) * 3; e.location = loc
        # model rond oorsprong centreren (bounding box)
        bpy.context.view_layer.update()
        mn = Vector((1e9,) * 3); mx = Vector((-1e9,) * 3)
        for o in new:
            if o.type not in ('MESH', 'CURVE'): continue
            for c in o.bound_box:
                w = o.matrix_world @ Vector(c)
                for i in range(3): mn[i] = min(mn[i], w[i]); mx[i] = max(mx[i], w[i])
        return e
    def text(self, s, loc=(0, 0, 0), size=0.7, color='#ffffff', start=1, end=None, extrude=0.08, align='CENTER', pop=8, font_scale=1.0):
        """3D-tekst. Verschijnt met een veer-pop op frame `start`; verdwijnt op `end` (of blijft)."""
        cu = bpy.data.curves.new('t', 'FONT'); cu.body = s; cu.size = size; cu.extrude = extrude; cu.align_x = align; cu.bevel_depth = 0.01
        o = bpy.data.objects.new('t', cu); bpy.context.collection.objects.link(o); o.rotation_euler = (math.radians(90), 0, 0); o.location = loc
        o.data.materials.append(mat(color, .4, coat=0.3))
        self.pop(o, start, end, pop); return o
    def pop(self, o, start=1, end=None, dur=8, scale=1.0):
        s = o.scale[0] * scale if o.scale[0] else scale
        o.scale = (0.001,) * 3; o.keyframe_insert('scale', frame=max(1, start - 1))
        o.scale = (s * 1.15,) * 3; o.keyframe_insert('scale', frame=start + dur // 2)
        o.scale = (s,) * 3; o.keyframe_insert('scale', frame=start + dur)
        if end:
            o.keyframe_insert('scale', frame=end); o.scale = (0.001,) * 3; o.keyframe_insert('scale', frame=end + 6)
        self._interp(o)
    def key(self, o, prop, frame, value, ease='ease'):
        """Keyframe. prop: 'location'|'rotation_euler' (waarden in GRADEN)|'scale'. ease: 'ease','linear','BOUNCE','ELASTIC','BACK'."""
        if prop == 'rotation_euler': value = tuple(math.radians(v) for v in value)
        if prop == 'scale' and not hasattr(value, '__len__'): value = (value,) * 3
        setattr(o, prop, value); o.keyframe_insert(prop, frame=frame)
        self._ease(o, prop, frame, ease)
    def _ease(self, o, prop, frame, ease):
        ad = o.animation_data
        if not ad or not ad.action: return
        for fc in ad.action.fcurves:
            if not fc.data_path.startswith(prop): continue
            for kp in fc.keyframe_points:
                if int(kp.co[0]) == frame:
                    if ease == 'linear': kp.interpolation = 'LINEAR'
                    elif ease in ('BOUNCE', 'ELASTIC', 'BACK'): kp.interpolation = ease; kp.easing = 'EASE_OUT'
                    else: kp.interpolation = 'BEZIER'
    def _interp(self, o):
        if o.animation_data and o.animation_data.action:
            for fc in o.animation_data.action.fcurves:
                for kp in fc.keyframe_points: kp.interpolation = 'BEZIER'
    def spin(self, o, axis=2, turns=1, start=1, end=None, ease='linear'):
        end = end or self.frames; a0 = list(o.rotation_euler)
        self.key(o, 'rotation_euler', start, tuple(math.degrees(v) for v in a0), ease)
        a1 = [math.degrees(v) for v in a0]; a1[axis] += 360 * turns; self.key(o, 'rotation_euler', end, tuple(a1), ease)
    def loop_bob(self, o, amp=0.3, period=24, start=1, end=None, axis=2):
        end = end or self.frames; base = list(o.location); t = start
        while t <= end:
            v = list(base); v[axis] += amp * math.sin(2 * math.pi * (t - start) / period); self.key(o, 'location', t, tuple(v), 'ease'); t += period // 4

    # ---------- render ----------
    def render(self, vid, poster=True):
        sc = self.sc; mp4 = os.path.join(OUT, vid + '.mp4')
        sc.render.image_settings.file_format = 'FFMPEG'; sc.render.ffmpeg.format = 'MPEG4'; sc.render.ffmpeg.codec = 'H264'
        sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'; sc.render.ffmpeg.ffmpeg_preset = 'GOOD'; sc.render.ffmpeg.audio_codec = 'NONE'
        sc.render.filepath = mp4; sc.render.use_file_extension = False
        bpy.ops.render.render(animation=True)
        if poster:
            sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 78
            sc.frame_set(self.frames // 2); sc.render.filepath = os.path.join(OUT, vid + '.jpg'); bpy.ops.render.render(write_still=True)
        return mp4

def render_short(vid, make, bg=('#6366f1', '#1e1b4b'), seconds=10, floor=None):
    S = Short(seconds, bg, floor=floor); make(S); return S.render(vid)
