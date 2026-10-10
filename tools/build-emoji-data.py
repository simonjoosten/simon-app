#!/usr/bin/env python3
"""Bouwt docs/emoji-data.json uit de openbare emoji-kitchen metadata (xsalazar/emoji-kitchen-backend).
Gebruik: python3 tools/build-emoji-data.py /pad/naar/metadata.json"""
import json, sys, os
SETS = {
 '🙂 Gezichten': [('😀','grijns'),('😂','lachbui'),('😍','hartjesoog'),('😎','coolbril'),('🥳','feestbeest'),('😴','slaapkop'),('🤔','denker'),('😱','gillen'),('🤪','gekkie'),('🥶','ijsblok'),('🤢','misselijk'),('😡','boosaard'),('🤠','cowboy'),('👻','spook'),('🤖','robot'),('👽','marsman'),('💩','drolletje'),('🤡','clown'),('😈','duiveltje'),('🥺','smekende'),('😊','blij'),('😅','zweetdruppel'),('😭','huilebalk'),('🥰','verliefdgezicht'),('🤩','sterrenogen'),('😇','engeltje'),('🤗','knuffelaar'),('🙄','oogrol'),('😬','grimas'),('🤯','explosiehoofd'),('🥵','zweethoofd'),('🤧','niezer'),('🤑','geldogen'),('🤐','ritssluiting'),('😏','gniffelaar'),('😤','stoomneus'),('💀','doodshoofd'),('🤓','nerd'),('🧐','monocle'),('🫠','smeltkop'),('😋','smulpaap'),('🤮','spugert')],
 '🐶 Dieren': [('🐶','hond'),('🐱','poes'),('🐭','muis'),('🐹','hamster'),('🐰','konijn'),('🦊','vos'),('🐻','beer'),('🐼','panda'),('🐨','koala'),('🐯','tijger'),('🦁','leeuw'),('🐮','koe'),('🐷','varken'),('🐸','kikker'),('🐵','aap'),('🐔','kip'),('🐧','pinguïn'),('🦆','eend'),('🦄','eenhoorn'),('🐢','schildpad'),('🐙','inktvis'),('🦈','haai'),('🐬','dolfijn'),('🦖','dino'),('🐝','bij'),('🦋','vlinder'),('🐌','slak'),('🕷️','spin'),('🦉','uil'),('🐴','paard'),('🐺','wolf'),('🦝','wasbeer'),('🦒','giraf'),('🐘','olifant'),('🦓','zebra'),('🐊','krokodil'),('🦀','krab'),('🐞','lieveheersbeestje'),('🐑','schaap'),('🦔','egel'),('🦥','luiaard'),('🐳','walvis'),('🦜','papegaai'),('🦢','zwaan'),('🐜','mier'),('🐍','slang'),('🐓','haan'),('🦇','vleermuis')],
 '🍕 Eten': [('🍕','pizza'),('🍔','hamburger'),('🍟','friet'),('🌭','worstje'),('🍿','popcorn'),('🍩','donut'),('🍪','koekje'),('🍫','chocola'),('🍦','ijsje'),('🍎','appel'),('🍌','banaan'),('🍓','aardbei'),('🍉','meloen'),('🥕','wortel'),('🥑','avocado'),('🌮','taco'),('🍣','sushi'),('🧀','kaas'),('🥞','pannenkoek'),('☕','koffie'),('🍺','biertje'),('🧁','cupcake'),('🥨','krakeling'),('🍇','druiven'),('🍒','kersen'),('🍑','perzik'),('🥐','croissant'),('🥓','spek'),('🍳','spiegelei'),('🍰','taartje'),('🍭','lolly'),('🥝','kiwi'),('🍋','citroen'),('🥦','broccoli'),('🥔','aardappel'),('🍄','paddenstoel'),('🌽','maïs'),('🍍','ananas')],
 '🚗 Dingen': [('🚗','auto'),('🚀','raket'),('✈️','vliegtuig'),('🚲','fiets'),('⚽','voetbal'),('🏀','basketbal'),('🎮','spelcomputer'),('🎸','gitaar'),('📱','telefoon'),('💡','lamp'),('🔥','vuurtje'),('⭐','sterretje'),('🌈','regenboog'),('☀️','zonnetje'),('🌧️','regenwolk'),('⚡','bliksem'),('🎈','ballon'),('🎁','cadeautje'),('👑','kroontje'),('💎','diamant'),('🧲','magneet'),('🔔','bel'),('🌵','cactus'),('🌻','zonnebloem'),('🎃','pompoen'),('⛄','sneeuwpop'),('🎲','dobbelsteen'),('🧸','teddybeer'),('🔮','kristallen bol'),('🚁','helikopter'),('🚂','trein'),('🛸','ufo'),('🌙','maantje'),('🌍','aarde'),('🌊','golf'),('❄️','sneeuwvlok'),('🎄','kerstboom'),('🎷','saxofoon'),('🥁','trommel'),('📚','boeken'),('⏰','wekker'),('🔑','sleutel'),('💣','bom'),('🏆','beker'),('🧠','hersenen'),('👀','ogen'),('👅','tong'),('👍','duimpje'),('❤️','hartje'),('💔','gebroken hart'),('💯','honderd')],
}
src = sys.argv[1]
d = json.load(open(src))['data']
def code(e): return '-'.join(f'{ord(c):x}' for c in e)
def find(e):
    c = code(e)
    if c in d: return c
    c2 = c.replace('-fe0f', '')
    return c2 if c2 in d else None
emojis, names, cat_of = [], [], []
sets = {}
for cat, items in SETS.items():
    sets[cat] = []
    for e, n in items:
        c = find(e)
        if not c or any(x[2] == c for x in emojis if len(x) > 2) : continue
        emojis.append((e, n, c)); sets[cat].append([e, n, c])
codes = {c: i for i, (e, n, c) in enumerate(emojis)}
dates, flat, seen = [], [], set()
for e, n, c in emojis:
    for other, lst in d[c]['combinations'].items():
        if other not in codes: continue
        for ent in lst:
            if not ent.get('isLatest'): continue
            l, r, dt = ent['leftEmojiCodepoint'], ent['rightEmojiCodepoint'], ent['date']
            if l not in codes or r not in codes or (l, r) in seen: continue
            seen.add((l, r))
            if dt not in dates: dates.append(dt)
            flat += [codes[l], codes[r], dates.index(dt)]
out = {'sets': sets, 'codes': [c for _, _, c in emojis], 'dates': dates, 'flat': flat}
path = os.path.join(os.path.dirname(__file__), '..', 'docs', 'emoji-data.json')
json.dump(out, open(path, 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(emojis), 'emoji,', len(flat) // 3, 'mixen,', os.path.getsize(path) // 1024, 'KB')
