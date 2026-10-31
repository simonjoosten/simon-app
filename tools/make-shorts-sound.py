#!/usr/bin/env python3
"""Maakt het geluid voor de shorts: docs/shorts/<id>.m4a (mono, AAC ~30 kbps) voor elk id uit tools/shorts/meta-*.json.

Gebruik:
  python3 tools/make-shorts-sound.py                 # alles wat nieuw of veranderd is (incrementeel)
  python3 tools/make-shorts-sound.py s001 s010       # alleen deze id's (forceert opnieuw)
  python3 tools/make-shorts-sound.py --force         # alles opnieuw
  python3 tools/make-shorts-sound.py --jobs 4        # aantal processen (standaard 3)
  python3 tools/make-shorts-sound.py --check         # alleen kwaliteitscontrole van bestaande m4a's
  python3 tools/make-shorts-sound.py --events        # alleen events-a/b/c.json schrijven

Geen numpy/ffmpeg nodig: pure-Python synthesizer (tools/shorts/sound/*.py) + /usr/bin/afconvert.
Events (geluidsmomenten) worden uit de scenescripts afgeleid (tools/shorts/sound/events.py), dus de
effecten lopen synchroon met de beelden. Incrementeel: een hash van events + code + instellingen per id
staat in tools/shorts/sound/.state.json.
"""
import hashlib, json, math, os, subprocess, sys, tempfile, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SND = os.path.join(ROOT, 'tools', 'shorts', 'sound')
OUT = os.path.join(ROOT, 'docs', 'shorts')
STATE = os.path.join(SND, '.state.json')
sys.path.insert(0, SND)

BITRATES = [30000, 26000, 22000]
MAX_KB = 45
TOTAL_MAX_MB = 14


def code_hash():
    h = hashlib.sha1()
    for f in ('synth.py', 'music.py', 'events.py'):
        h.update(open(os.path.join(SND, f), 'rb').read())
    h.update(repr(BITRATES).encode())
    return h.hexdigest()[:12]


def short_hash(sh, ch):
    d = json.dumps([sh['id'], sh['c'], sh['s'], sh['tpl'], sh['ev'], sh['meta']], sort_keys=True, default=str)
    return hashlib.sha1((d + ch).encode()).hexdigest()[:16]


def encode(wav, m4a):
    for br in BITRATES:
        r = subprocess.run(['/usr/bin/afconvert', '-f', 'm4af', '-d', 'aac', '-b', str(br), wav, m4a], capture_output=True, text=True)
        if r.returncode != 0:
            raise RuntimeError('afconvert: ' + r.stderr[:200])
        if os.path.getsize(m4a) <= MAX_KB * 1024:
            return br
    return BITRATES[-1]


def work(sh):
    import music, synth as S
    t0 = time.time()
    out, c = music.render_short(sh)
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, sh['id'] + '.wav')
        S.write_wav(wav, out)
        tmp = os.path.join(OUT, '.' + sh['id'] + '.tmp.m4a')
        br = encode(wav, tmp)
        os.replace(tmp, os.path.join(OUT, sh['id'] + '.m4a'))
    return sh['id'], round(time.time() - t0, 1), br


# ------------------------------------------------------------------ controle
def decode(m4a, wav):
    r = subprocess.run(['/usr/bin/afconvert', '-f', 'WAVE', '-d', 'LEI16', m4a, wav], capture_output=True, text=True)
    return r.returncode == 0


def read_wav(path):
    """Leest 16-bit mono PCM-wav (ook WAVE_FORMAT_EXTENSIBLE van afconvert) -> (sr, n, bytes)."""
    import struct
    b = open(path, 'rb').read()
    pos, sr, ch = 12, 16000, 1
    while pos + 8 <= len(b):
        cid = b[pos:pos + 4]
        size = struct.unpack('<I', b[pos + 4:pos + 8])[0]
        if cid == b'fmt ':
            ch, sr = struct.unpack('<HI', b[pos + 10:pos + 16])
        elif cid == b'data':
            raw = b[pos + 8:pos + 8 + size]
            if ch == 2:
                raw = b''.join(raw[i:i + 2] for i in range(0, len(raw), 4))
            return sr, len(raw) // 2, raw[:len(raw) // 2 * 2]
        pos += 8 + size + (size & 1)
    raise RuntimeError('geen data in wav')


def analyze(m4a, expect_s):
    import struct
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, 'x.wav')
        if not decode(m4a, wav):
            return {'ok': False, 'err': 'decode mislukt'}
        sr, n, raw = read_wav(wav)
    x = [v / 32768.0 for v in struct.unpack('<%dh' % n, raw)]
    dur = n / sr
    pk = max(max(x), -min(x))
    rms = math.sqrt(sum(v * v for v in x) / n)
    win = int(0.05 * sr)
    rm = [math.sqrt(sum(v * v for v in x[i:i + win]) / win) for i in range(0, n - win, win)]
    thr = 10 ** (-60 / 20.0)
    run = best = 0
    first_quiet = None
    for i, r in enumerate(rm):
        if r < thr:
            run += 1
            best = max(best, run)
        else:
            run = 0
    longest_silence = best * 0.05
    # stilte alleen midden in tellen (niet begin/einde): bepaal eerste en laatste hoorbare venster
    aud = [i for i, r in enumerate(rm) if r >= thr]
    mid_silence = 0.0
    if aud:
        run = 0
        for i in range(aud[0], aud[-1] + 1):
            if rm[i] < thr:
                run += 1
                mid_silence = max(mid_silence, run * 0.05)
            else:
                run = 0
    a0 = abs(x[0]) if x else 0
    a1 = max(abs(v) for v in x[-int(0.004 * sr):]) if x else 0
    # grove spectrale verdeling: laag (<400 Hz) en hoog (>3 kHz) aandeel via eenpolige filters
    def lp(sig, fc):
        a = min(1.0, 2 * math.pi * fc / sr)
        y = 0.0
        out = []
        for v in sig:
            y += a * (v - y)
            out.append(y)
        return out
    l300 = lp(x, 300)
    l1200 = lp(x, 1200)
    low_rms = math.sqrt(sum(v * v for v in l300) / n)
    mid_rms = math.sqrt(sum((p - q) ** 2 for p, q in zip(l1200, l300)) / n)
    hi_rms = math.sqrt(sum((p - q) ** 2 for p, q in zip(x, l1200)) / n)
    curve = [round(20 * math.log10(max(math.sqrt(sum(v * v for v in x[i:i + sr // 2]) / (sr // 2)), 1e-6)), 1) for i in range(0, n - sr // 2 + 1, sr // 2)]
    return {'ok': True, 'dur': round(dur, 3), 'peak': round(pk, 4), 'peak_db': round(20 * math.log10(max(pk, 1e-9)), 2), 'rms_db': round(20 * math.log10(max(rms, 1e-9)), 2),
            'mid_silence_s': round(mid_silence, 2), 'start_abs': round(a0, 4), 'end_abs': round(a1, 4),
            'low_db': round(20 * math.log10(max(low_rms, 1e-9)), 1), 'mid_db': round(20 * math.log10(max(mid_rms, 1e-9)), 1), 'hi_db': round(20 * math.log10(max(hi_rms, 1e-9)), 1), 'curve': curve,
            'dur_ok': abs(dur - expect_s) < 0.12}


def _an(args):
    return analyze(*args)


def check(shorts, jobs=3):
    rows = {}
    bad = []
    tot = 0
    have = [sh for sh in shorts if os.path.isfile(os.path.join(OUT, sh['id'] + '.m4a'))]
    for sh in shorts:
        if sh not in have:
            bad.append((sh['id'], 'ontbreekt'))
    import multiprocessing as mp
    with mp.Pool(jobs) as pool:
        res = pool.map(_an, [(os.path.join(OUT, sh['id'] + '.m4a'), sh['s']) for sh in have])
    for sh, a in zip(have, res):
        p = os.path.join(OUT, sh['id'] + '.m4a')
        kb = os.path.getsize(p) / 1024.0
        tot += os.path.getsize(p)
        a['kb'] = round(kb, 1)
        a['ddev'] = round(abs(a.get('dur', 0) - sh['s']), 3)
        rows[sh['id']] = a
        if not a.get('ok'):
            bad.append((sh['id'], a.get('err')))
            continue
        if a['peak'] >= 0.999:
            bad.append((sh['id'], 'clipping %.3f' % a['peak']))
        if not a['dur_ok']:
            bad.append((sh['id'], 'lengte %.2f != %.1f' % (a['dur'], sh['s'])))
        if a['mid_silence_s'] > 3.0:
            bad.append((sh['id'], 'stilte midden %.1f s' % a['mid_silence_s']))
        if a['start_abs'] > 0.02 or a['end_abs'] > 0.02:
            bad.append((sh['id'], 'klik bij lus start=%.3f eind=%.3f' % (a['start_abs'], a['end_abs'])))
        if kb > MAX_KB:
            bad.append((sh['id'], 'te groot %.1f KB' % kb))
    ok = [r for r in rows.values() if r.get('ok')]
    summ = {'aantal': len(rows), 'totaal_mb': round(tot / 1048576.0, 2), 'problemen': bad}
    if ok:
        summ.update({'kb_max': max(r['kb'] for r in ok), 'kb_gem': round(sum(r['kb'] for r in ok) / len(ok), 1),
                     'peak_db_max': max(r['peak_db'] for r in ok), 'rms_db_min': min(r['rms_db'] for r in ok), 'rms_db_max': max(r['rms_db'] for r in ok),
                     'dur_afwijking_max_s': max(r['ddev'] for r in ok),
                     'mid_silence_max_s': max(r['mid_silence_s'] for r in ok)})
    json.dump({'summary': summ, 'rows': rows}, open(os.path.join(SND, 'qc-report.json'), 'w'), indent=0)
    return summ


def main():
    argv = sys.argv[1:]
    jobs = 3
    force = '--force' in argv
    if '--jobs' in argv:
        jobs = int(argv[argv.index('--jobs') + 1])
    ids = [a for a in argv if a.startswith('s') and a[1:].isdigit()]
    import events
    shorts = events.all_shorts()
    if '--events' in argv:
        events_main = True
        for b in 'abc':
            sel = {r['id']: {'t': r['t'], 'tpl': r['tpl'], 's': r['s'], 'meta': r['meta'], 'ev': r['ev']} for r in shorts if r['batch'] == b}
            json.dump(sel, open(os.path.join(SND, 'events-%s.json' % b), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
        print('events-a/b/c.json geschreven (%d shorts)' % len(shorts))
        return
    if '--check' in argv:
        s = check(shorts)
        print(json.dumps(s, indent=1, ensure_ascii=False))
        return
    os.makedirs(OUT, exist_ok=True)
    try:
        state = json.load(open(STATE))
    except Exception:
        state = {}
    ch = code_hash()
    todo = []
    for sh in shorts:
        if ids and sh['id'] not in ids:
            continue
        hsh = short_hash(sh, ch)
        have = os.path.isfile(os.path.join(OUT, sh['id'] + '.m4a'))
        if force or ids or not have or state.get(sh['id']) != hsh:
            todo.append((sh, hsh))
    print('%d shorts in totaal, %d te maken' % (len(shorts), len(todo)), flush=True)
    if not todo:
        return
    t0 = time.time()
    done = 0
    if jobs <= 1:
        results = (work(sh) for sh, _ in todo)
    else:
        import multiprocessing as mp
        pool = mp.Pool(jobs)
        results = pool.imap_unordered(work, [sh for sh, _ in todo])
    hmap = {sh['id']: h for sh, h in todo}
    for sid, dt, br in results:
        done += 1
        state[sid] = hmap[sid]
        if done % 10 == 0 or done == len(todo):
            json.dump(state, open(STATE, 'w'))
            print('  %d/%d (%s %.1fs, %d kbps) na %.0f s' % (done, len(todo), sid, dt, br // 1000, time.time() - t0), flush=True)
    json.dump(state, open(STATE, 'w'))
    if jobs > 1:
        pool.close()
        pool.join()
    tot = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT) if f.endswith('.m4a') and not f.startswith('.'))
    print('klaar: %d bestanden, totaal %.2f MB' % (len([f for f in os.listdir(OUT) if f.endswith('.m4a') and not f.startswith('.')]), tot / 1048576.0))
    if tot > TOTAL_MAX_MB * 1048576:
        print('WAARSCHUWING: totaal boven %d MB' % TOTAL_MAX_MB)


if __name__ == '__main__':
    main()
