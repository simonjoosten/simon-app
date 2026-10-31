"""Runner voor batch a.  Gebruik:
  Blender -b --python shorts_a_run.py -- stills tpl1 tpl2 ...     (proefstills van eerste job per sjabloon -> scratch)
  Blender -b --python shorts_a_run.py -- render s001 s002 ...      (volledige render naar docs/shorts)
  Blender -b --python shorts_a_run.py -- renderrange s001 s010"""
import sys, os, importlib, json
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import bpy
import shorts_a_lib as L
import shorts_common as sc
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
mode = args[0]; rest = args[1:]
import shorts_a_jobs as J
JOBS = J.JOBS
TPL = J.TPL
SCR = os.environ.get('SCR', '/tmp')
CRF = os.environ.get('CRF', 'LOW')
def render_lo(S, vid, crf):
    sc_ = S.sc; mp4 = os.path.join(sc.OUT, vid + '.mp4')
    sc_.render.image_settings.file_format = 'FFMPEG'; sc_.render.ffmpeg.format = 'MPEG4'; sc_.render.ffmpeg.codec = 'H264'
    sc_.render.ffmpeg.constant_rate_factor = crf; sc_.render.ffmpeg.ffmpeg_preset = 'GOOD'; sc_.render.ffmpeg.audio_codec = 'NONE'
    sc_.render.filepath = mp4; sc_.render.use_file_extension = False
    bpy.ops.render.render(animation=True)
    sc_.render.image_settings.file_format = 'JPEG'; sc_.render.image_settings.quality = 78
    sc_.frame_set(S.frames // 2); sc_.render.filepath = os.path.join(sc.OUT, vid + '.jpg'); bpy.ops.render.render(write_still=True)

def build(job):
    fn = TPL[job['tpl']]
    def make(S): fn(S, job['t'], **job.get('p', {}))
    return make

if mode == 'meta':
    out = [dict(id=j['id'], t=j['t'], c=j['c'], tags=j['tags'], s=j.get('s', 10)) for j in JOBS]
    json.dump(out, open(os.path.join(HERE, '..', 'shorts', 'meta-a.json'), 'w'), ensure_ascii=False, indent=1)
elif mode == 'stills':
    sc.OUT = SCR
    seen = set(); sel = []
    for job in JOBS:
        if rest:
            if job['id'] in rest or job['t'] in rest: sel.append(job)
            elif job['tpl'] in rest and job['tpl'] not in seen: seen.add(job['tpl']); sel.append(job)
        elif job['tpl'] not in seen: seen.add(job['tpl']); sel.append(job)
    for job in sel:
        L._mc.clear()
        S = sc.Short(job.get('s', 10), job['bg'], floor=job.get('floor'))
        build(job)(S)
        for fr in (job.get('frames') or (int(S.frames * .12), int(S.frames * .45), int(S.frames * .8))):
            S.sc.frame_set(fr); S.sc.render.image_settings.file_format = 'JPEG'; S.sc.render.image_settings.quality = 70
            S.sc.render.filepath = os.path.join(SCR, 'v_%s_%d.jpg' % (job['id'], fr)); bpy.ops.render.render(write_still=True)
        print('VARIANT', job['id'], job['t'], flush=True)
else:
    ids = rest
    if mode == 'renderrange':
        a, b = rest; ids = [j['id'] for j in JOBS if a <= j['id'] <= b]
    for job in JOBS:
        if job['id'] not in ids: continue
        L._mc.clear()
        S = sc.Short(job.get('s', 10), job['bg'], floor=job.get('floor'))
        build(job)(S); render_lo(S, job['id'], job.get('crf', CRF))
        print('DONE', job['id'], flush=True)
