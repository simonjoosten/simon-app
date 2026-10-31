"""Gedeelde Blender-helpers voor alle 3D-icoontjes. Gebruik:
   Blender -b --python tools/blender/render_all.py -- [naam ...]
Elke modelfunctie bouwt één object in de lege scene (alles binnen ~2 eenheden rond de oorsprong, voorkant = -Y)
en roept helpers hieronder aan. De renderer zet camera, licht en achtergrond (transparant) en schrijft docs/art/3d/<naam>.png."""
import bpy, math, bmesh
from mathutils import Vector

SIZE = 192

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE_NEXT'
    sc.render.resolution_x = SIZE; sc.render.resolution_y = SIZE; sc.render.resolution_percentage = 100
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'; sc.render.image_settings.compression = 90
    sc.eevee.taa_render_samples = 48
    try: sc.eevee.use_gtao = True
    except Exception: pass
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    # zachte wereldverlichting
    w = bpy.data.worlds.new('w'); w.use_nodes = True; sc.world = w
    bg = w.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0.9, 0.93, 1.0, 1); bg.inputs['Strength'].default_value = 0.9
    return sc

def mat(color, rough=0.4, metal=0.0, emit=0.0, coat=0.0, alpha=1.0, name=None):
    """Materiaal. color = (r,g,b) 0..1 of '#rrggbb'."""
    if isinstance(color, str):
        c = color.lstrip('#'); color = tuple(int(c[i:i+2], 16) / 255 for i in (0, 2, 4))
        color = tuple(pow(x, 2.2) for x in color)  # sRGB -> lineair
    m = bpy.data.materials.new(name or 'm'); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (color[0], color[1], color[2], 1)
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if coat:
        for k in ('Coat Weight', 'Clearcoat'):
            if k in b.inputs: b.inputs[k].default_value = coat; break
    if emit:
        for k in ('Emission Strength',):
            if k in b.inputs: b.inputs[k].default_value = emit
        if 'Emission Color' in b.inputs: b.inputs['Emission Color'].default_value = (color[0], color[1], color[2], 1)
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
    return m

def _fin(o, m, smooth=True, loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
    o.location = loc; o.rotation_euler = tuple(math.radians(r) for r in rot); o.scale = scale
    if m is not None: o.data.materials.append(m)
    if smooth:
        for p in o.data.polygons: p.use_smooth = True
    return o

def sphere(r=1, m=None, loc=(0, 0, 0), scale=(1, 1, 1), rot=(0, 0, 0), seg=32):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=seg // 2); return _fin(bpy.context.object, m, True, loc, rot, scale)
def cube(size=(1, 1, 1), m=None, loc=(0, 0, 0), rot=(0, 0, 0), bevel=0.05):
    bpy.ops.mesh.primitive_cube_add(size=1); o = bpy.context.object; o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        bm = o.modifiers.new('b', 'BEVEL'); bm.width = bevel; bm.segments = 4
    return _fin(o, m, True, loc, rot)
def cyl(r=1, d=1, m=None, loc=(0, 0, 0), rot=(0, 0, 0), seg=32, bevel=0.0, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d, vertices=seg); o = bpy.context.object
    if bevel:
        bm = o.modifiers.new('b', 'BEVEL'); bm.width = bevel; bm.segments = 4
    return _fin(o, m, True, loc, rot, scale)
def cone(r1=1, r2=0, d=1, m=None, loc=(0, 0, 0), rot=(0, 0, 0), seg=32):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=d, vertices=seg); return _fin(bpy.context.object, m, True, loc, rot)
def torus(R=1, r=0.25, m=None, loc=(0, 0, 0), rot=(0, 0, 0), seg=48, minor=16):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=seg, minor_segments=minor); return _fin(bpy.context.object, m, True, loc, rot)
def ico(r=1, m=None, loc=(0, 0, 0), sub=2, rot=(0, 0, 0), scale=(1, 1, 1), smooth=False):
    bpy.ops.mesh.primitive_ico_sphere_add(radius=r, subdivisions=sub); return _fin(bpy.context.object, m, smooth, loc, rot, scale)
def plane(size=(1, 1), m=None, loc=(0, 0, 0), rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_plane_add(size=1); o = bpy.context.object; o.scale = (size[0], size[1], 1); bpy.ops.object.transform_apply(scale=True); return _fin(o, m, False, loc, rot)

def extrude_poly(points, depth=0.3, m=None, loc=(0, 0, 0), rot=(0, 0, 0), bevel=0.04):
    """Vlak veelhoek in XZ-vlak (x,z) naar voren (-Y) en achteren uitgetrokken. Handig voor sterren, harten, bliksem, vlaggen."""
    me = bpy.data.meshes.new('p'); o = bpy.data.objects.new('p', me); bpy.context.collection.objects.link(o)
    bm = bmesh.new(); vs = [bm.verts.new((x, 0, z)) for x, z in points]; bm.faces.new(vs)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    r = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces)); vv = [e for e in r['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, depth, 0), verts=vv); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free(); o.location = (loc[0], loc[1] - depth / 2, loc[2]); o.rotation_euler = tuple(math.radians(r) for r in rot)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    if bevel:
        mod = o.modifiers.new('b', 'BEVEL'); mod.width = bevel; mod.segments = 4
    if m is not None: o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = False
    return o

def curve_tube(points, r=0.08, m=None, closed=False):
    """Buis langs een 3D-pad (lijst van (x,y,z))."""
    cu = bpy.data.curves.new('c', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = r; cu.bevel_resolution = 6; cu.use_fill_caps = True
    sp = cu.splines.new('POLY'); sp.points.add(len(points) - 1)
    for i, p in enumerate(points): sp.points[i].co = (p[0], p[1], p[2], 1)
    sp.use_cyclic_u = closed
    o = bpy.data.objects.new('c', cu); bpy.context.collection.objects.link(o)
    if m is not None: o.data.materials.append(m)
    return o

def lathe(profile, m=None, loc=(0, 0, 0), seg=40, rot=(0, 0, 0)):
    """Draaivorm: profile = lijst (straal, hoogte) -> vaas, kop, fles, taart, ..."""
    me = bpy.data.meshes.new('l'); o = bpy.data.objects.new('l', me); bpy.context.collection.objects.link(o)
    bm = bmesh.new(); prev = None; rings = []
    for (rr, z) in profile:
        rings.append([bm.verts.new((rr * math.cos(2 * math.pi * i / seg), rr * math.sin(2 * math.pi * i / seg), z)) for i in range(seg)])
    for a, b in zip(rings, rings[1:]):
        for i in range(seg):
            j = (i + 1) % seg
            try: bm.faces.new((a[i], a[j], b[j], b[i]))
            except ValueError: pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
    o.location = loc; o.rotation_euler = tuple(math.radians(r) for r in rot)
    sub = o.modifiers.new('s', 'SUBSURF'); sub.levels = 1; sub.render_levels = 2
    if m is not None: o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = True
    return o

def group(objs, name='g'):
    """Zet objecten onder één lege parent zodat je ze samen kunt draaien/schalen."""
    e = bpy.data.objects.new(name, None); bpy.context.collection.objects.link(e)
    for o in objs: o.parent = e
    return e

def finish_and_render(path, rot_z=-25, tilt=0, fit=1.0):
    """Camera + licht + render. Past automatisch de camera aan zodat het object de beeldhoek vult."""
    sc = bpy.context.scene
    objs = [o for o in bpy.context.scene.objects if o.type in ('MESH', 'CURVE', 'SURFACE', 'META', 'FONT')]
    root = bpy.data.objects.new('root', None); bpy.context.collection.objects.link(root)
    for o in objs:
        if o.parent is None: o.parent = root
    root.rotation_euler = (math.radians(tilt), 0, math.radians(rot_z))
    bpy.context.view_layer.update()
    # bounding box in wereldruimte
    mn = Vector((1e9, 1e9, 1e9)); mx = Vector((-1e9, -1e9, -1e9))
    for o in objs:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            for i in range(3): mn[i] = min(mn[i], w[i]); mx[i] = max(mx[i], w[i])
    ctr = (mn + mx) / 2; ext = max(mx.x - mn.x, mx.z - mn.z, (mx.y - mn.y) * 0.8, 0.001)
    root.location = (-ctr.x, -ctr.y, -ctr.z)
    bpy.ops.object.camera_add(location=(0, -10, 2.2), rotation=(math.radians(77), 0, 0)); cam = bpy.context.object
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = ext * 1.18 / fit; sc.camera = cam
    # drie-puntsbelichting
    def lamp(kind, loc, energy, size, color=(1, 1, 1)):
        bpy.ops.object.light_add(type=kind, location=loc); l = bpy.context.object
        l.data.energy = energy; l.data.color = color
        if kind == 'AREA': l.data.size = size
        l.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        return l
    lamp('AREA', (4, -6, 7), 900, 5, (1.0, 0.96, 0.9)); lamp('AREA', (-6, -3, 3), 350, 5, (0.8, 0.9, 1.0)); lamp('AREA', (0, 6, 5), 500, 4, (1, 1, 1))
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)
