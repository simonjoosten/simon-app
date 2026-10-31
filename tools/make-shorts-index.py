#!/usr/bin/env python3
"""Bouwt docs/shorts/index.js uit tools/shorts/meta-*.json.

Controleert dat docs/shorts/<id>.mp4 en <id>.jpg bestaan en schrijft
`export const SHORTS = [{id,t,c,tags,s,kb}]` (kb = mp4-grootte in KB), gesorteerd op id.
Werkt met 0 bestanden en kan opnieuw gedraaid worden (overschrijft index.js).
"""
import glob, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
META = os.path.join(ROOT, 'tools', 'shorts')
OUT_DIR = os.path.join(ROOT, 'docs', 'shorts')
CATS = {'satisfying', 'techniek', 'sport', 'dieren', 'eten', 'natuur', 'weetjes', 'quiz', 'ruimte', 'fantasie'}


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    items, skipped = {}, []
    for f in sorted(glob.glob(os.path.join(META, 'meta-*.json'))):
        try:
            with open(f, encoding='utf-8') as fh:
                data = json.load(fh)
        except Exception as e:  # kapotte of half geschreven meta: overslaan
            print('WAARSCHUWING: %s onleesbaar (%s)' % (os.path.basename(f), e), file=sys.stderr)
            continue
        if not isinstance(data, list):
            continue
        for m in data:
            if not isinstance(m, dict):
                continue
            sid = str(m.get('id', ''))
            if not re.fullmatch(r'[A-Za-z0-9_-]+', sid):
                continue
            mp4 = os.path.join(OUT_DIR, sid + '.mp4')
            jpg = os.path.join(OUT_DIR, sid + '.jpg')
            if not (os.path.isfile(mp4) and os.path.isfile(jpg)):
                skipped.append(sid)
                continue
            c = m.get('c')
            if c not in CATS:
                print('WAARSCHUWING: %s heeft onbekende categorie %r' % (sid, c), file=sys.stderr)
                continue
            tags = [str(t) for t in (m.get('tags') or []) if str(t).strip()]
            try:
                s = int(round(float(m.get('s', 10))))
            except Exception:
                s = 10
            items[sid] = {'id': sid, 't': str(m.get('t', sid)), 'c': c, 'tags': tags, 's': s,
                          'kb': max(1, int(round(os.path.getsize(mp4) / 1024)))}
    out = [items[k] for k in sorted(items)]
    body = ',\n'.join('  ' + json.dumps(o, ensure_ascii=False, separators=(',', ':')) for o in out)
    js = '// Gegenereerd door tools/make-shorts-index.py - niet met de hand aanpassen.\nexport const SHORTS = [%s];\n' % (('\n' + body + '\n') if out else '')
    with open(os.path.join(OUT_DIR, 'index.js'), 'w', encoding='utf-8') as fh:
        fh.write(js)
    tot = sum(o['kb'] for o in out)
    print('%d filmpjes in index (%d KB totaal); %d overgeslagen (mp4/jpg ontbreekt)' % (len(out), tot, len(skipped)))


if __name__ == '__main__':
    main()
