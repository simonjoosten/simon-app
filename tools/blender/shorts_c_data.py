"""Data (zonder bpy) voor batch c: s201..s300. Elke short: id, categorie, titel, tags, seconden, sjabloon, argumenten."""
import random
S = []
def add(c, t, tags, tpl, bg, secs=8, **a): S.append(dict(c=c, t=t, tags=tags, tpl=tpl, bg=bg, s=secs, a=a))

# ---------------- weetjes (35) ----------------
add('weetjes', 'Octopus heeft drie harten', ['octopus', 'dieren', 'hart'], 'weetje', 'turq', icon='octopus', lines=['Een octopus', 'heeft', '*drie harten'], extra=('heart', 3), motion='sway', accent='#ffd23f')
add('weetjes', 'Zwaarste dier ter wereld', ['vinvis', 'gewicht', 'dieren'], 'bars', 'blauw', bars=[('whale', 150, '#38bdf8'), ('elephant', 6, '#94a3b8'), ('dog', .5, '#f59e0b')], lines=['De blauwe vinvis weegt', 'zo veel als', '*25 olifanten'])
add('weetjes', 'Bijen dansen', ['bij', 'dansen', 'dieren'], 'weetje', 'goud', icon='bee', lines=['Bijen dansen om', 'te laten zien waar', '*bloemen zijn'], motion='bob', layout='bottom', accent='#fde047')
add('weetjes', 'Olifanten kunnen niet springen', ['olifant', 'springen', 'dieren'], 'weetje', 'groen', icon='elephant', lines=['Een olifant', 'kan niet', '*springen'], motion='sway', accent='#fde047')
add('weetjes', 'Kikker drinkt door zijn huid', ['kikker', 'huid', 'dieren'], 'weetje', 'lime', icon='frog', lines=['Een kikker drinkt', 'met zijn *huid', 'in plaats van mond'], motion='bob', accent='#fef08a')
add('weetjes', 'Katten slapen veel', ['kat', 'slapen', 'dieren'], 'num', 'paars', num='16', icon='cat', lines=['uur per dag kan', 'een kat *slapen'], accent='#f9a8d4')
add('weetjes', 'Uil draait zijn kop', ['uil', 'kop', 'dieren'], 'weetje', 'nacht', icon='owl', lines=['Een uil kan zijn', 'kop bijna helemaal', '*omdraaien'], motion='sway', accent='#fcd34d')
add('weetjes', 'Oude schildpadden', ['schildpad', 'oud', 'dieren'], 'num', 'diep', num='150+', icon='turtle', lines=['jaar kan een', 'reuzenschildpad', '*worden'], accent='#86efac')
add('weetjes', 'Haai ouder dan bomen', ['haai', 'bomen', 'dieren'], 'weetje', 'blauw', icon='shark', lines=['Haaien leefden al', 'vóór er *bomen', 'bestonden'], motion='tumble', accent='#7dd3fc')
add('weetjes', 'Slak heeft veel tandjes', ['slak', 'tanden', 'dieren'], 'weetje', 'roze', icon='snail', lines=['Een slak heeft', '*duizenden', 'tandjes'], motion='bob', layout='bottom', accent='#fde68a')
add('weetjes', 'Aarde is vooral water', ['aarde', 'water', 'aardrijkskunde'], 'num', 'blauw', num='71%', icon='globe', lines=['van de aarde', 'is *bedekt', 'met water'], accent='#67e8f9')
add('weetjes', 'Nederland onder zeeniveau', ['nederland', 'zeeniveau', 'aardrijkskunde'], 'weetje', 'oranje', icon='windmill', lines=['Een kwart van', 'Nederland ligt', '*onder zeeniveau'], motion='spin', accent='#fde047')
add('weetjes', 'Piramide van Gizeh', ['piramide', 'egypte', 'geschiedenis'], 'num', 'goud', num='4500', icon='pyramid', lines=['jaar oud is de', 'piramide van', '*Gizeh'], accent='#fef08a', ncolor='#fde047')
add('weetjes', 'Dino\'s verdwenen', ['dinosaurus', 'uitsterven', 'geschiedenis'], 'num', 'groen', num='66', icon='dino', lines=['miljoen jaar geleden', 'stierven de dino\'s', '*uit'], accent='#fde047')
add('weetjes', 'Lava is superheet', ['vulkaan', 'lava', 'aardrijkskunde'], 'num', 'rood', num='700+', icon='volcano', lines=['graden of meer is', 'lava *heet'], accent='#fdba74')
add('weetjes', 'Dobbelsteen is altijd 7', ['dobbelsteen', 'wiskunde', 'zeven'], 'weetje', 'paars', icon='dice', lines=['Tegenover elkaar', 'tellen de ogen op', 'tot *7'], motion='tumble', accent='#fde047')
add('weetjes', 'Seconden in een dag', ['tijd', 'seconden', 'wiskunde'], 'num', 'nacht', num='86400', icon='hourglass', lines=['seconden heeft', 'één *dag'], accent='#a5b4fc', size=2.2)
add('weetjes', 'Het getal pi', ['pi', 'cirkel', 'wiskunde'], 'weetje', 'turq', icon='target', lines=['Om elke cirkel past', '*3,14 keer', 'zijn breedte'], motion='spin', accent='#fde047')
add('weetjes', 'Hoeken van een driehoek', ['driehoek', 'hoeken', 'wiskunde'], 'num', 'diep', num='180', icon='pencil', lines=['graden: de hoeken', 'van een driehoek', '*samen'], accent='#fde047')
add('weetjes', 'Talen op aarde', ['talen', 'taal', 'wereld'], 'num', 'roze', num='7000', icon='book', lines=['talen worden er', 'op aarde', '*gesproken'], accent='#fde68a')
add('weetjes', 'Palindroom', ['taal', 'woorden', 'palindroom'], 'weetje', 'groen', icon='scroll', lines=['Een palindroom', 'leest hetzelfde', 'achterstevoren:', '*LEPEL, RADAR'], motion='bob', accent='#fde047')
add('weetjes', 'Aardbei is geen bes', ['aardbei', 'fruit', 'planten'], 'weetje', 'rood', icon='strawberry', lines=['Een banaan is een', 'bes, een aardbei', '*niet!'], motion='spin', accent='#fde047', scale=1.4)
add('weetjes', 'Wortels waren paars', ['wortel', 'groente', 'geschiedenis'], 'weetje', 'oranje', icon='carrot', lines=['Wortels waren', 'vroeger vaak', '*paars of geel'], motion='tumble', accent='#fef08a')
add('weetjes', 'Appels drijven', ['appel', 'drijven', 'natuurkunde'], 'weetje', 'lime', icon='apple', lines=['Appels drijven:', 'ze bestaan voor', '*een kwart uit lucht'], motion='bob', layout='bottom', accent='#fef08a')
add('weetjes', 'Watermeloen is water', ['watermeloen', 'water', 'fruit'], 'num', 'roze', num='92%', icon='watermelon', lines=['van een watermeloen', 'is *water'], accent='#fde047')
add('weetjes', 'Hart klopt vaak', ['hart', 'lichaam', 'mens'], 'num', 'rood', num='100.000', icon='heart', lines=['keer per dag klopt', 'jouw *hart'], accent='#fde68a', size=2.0)
add('weetjes', 'Botten van een mens', ['botten', 'lichaam', 'skelet'], 'num', 'groen', num='206', icon='skull', lines=['botten heeft een', 'volwassen *mens'], accent='#fde047')
add('weetjes', 'Hersenen als lampje', ['hersenen', 'energie', 'lichaam'], 'weetje', 'goud', icon='lightbulb', lines=['Je hersenen', 'gebruiken evenveel', 'energie als een', '*zwak lampje'], motion='bob', accent='#fde047')
add('weetjes', 'Regenboog is een cirkel', ['regenboog', 'cirkel', 'natuur'], 'weetje', 'blauw', icon='rainbow', lines=['Een regenboog is', 'eigenlijk een', '*hele cirkel'], motion='sway', accent='#fde047')
add('weetjes', 'Sneeuwvlok heeft zes armen', ['sneeuwvlok', 'sneeuw', 'natuur'], 'num', 'diep', num='6', icon='snowflake', lines=['armen heeft', 'elke *sneeuwvlok'], accent='#bae6fd', ncolor='#e0f2fe')
add('weetjes', 'Bliksem is heet', ['bliksem', 'onweer', 'natuur'], 'weetje', 'nacht', icon='bolt', lines=['Bliksem is', '*5 keer heter', 'dan de zon'], motion='tumble', accent='#fde047')
add('weetjes', 'Zonnebloem draait mee', ['zonnebloem', 'zon', 'planten'], 'weetje', 'turq', icon='sunflower', lines=['Jonge zonnebloemen', 'draaien mee', 'met de *zon'], motion='sway', accent='#fde047')
add('weetjes', 'Toetsen van een piano', ['piano', 'muziek', 'toetsen'], 'num', 'paars', num='88', icon='piano', lines=['toetsen heeft', 'een *piano'], accent='#fde047')
add('weetjes', 'Eerste Olympische Spelen', ['olympische spelen', 'geschiedenis', 'sport'], 'num', 'goud', num='2700+', icon='trophy', lines=['jaar geleden waren', 'de eerste', '*Spelen'], accent='#fef08a', ncolor='#fde047')
add('weetjes', 'Pinguïns hebben knieën', ['pinguïn', 'knieën', 'dieren'], 'weetje', 'blauw', icon='penguin', lines=['Een pinguïn heeft', '*knieën!', 'Ze zitten onder', 'zijn veren'], motion='sway', accent='#fde047')

# ---------------- quiz (30) ----------------
Q = [
 (['Hoeveel poten', 'heeft een spin?'], '8', '6', '10', ['Spinnen hebben 8 poten.', 'Insecten hebben er 6.'], None),
 (['Welke planeet heet', 'de rode planeet?'], 'Mars', 'Venus', 'Jupiter', ['Mars is rood door', 'roestig stof.'], 'planet'),
 (['Wat is de hoofdstad', 'van Spanje?'], 'Madrid', 'Barcelona', 'Lissabon', ['Madrid is de hoofdstad', 'van Spanje.'], 'globe'),
 (['Hoeveel dagen heeft', 'een schrikkeljaar?'], '366', '365', '364', ['Een schrikkeljaar heeft', 'één extra dag: 366.'], 'hourglass'),
 (['Welk dier is het', 'zwaarst ter wereld?'], 'Blauwe vinvis', 'Olifant', 'Giraffe', ['De blauwe vinvis weegt', 'wel 150.000 kilo.'], 'whale'),
 (['Hoeveel is', '7 x 8?'], '56', '54', '64', ['7 x 8 = 56.', 'Ezelsbrug: 5-6-7-8!'], 'dice'),
 (['Welke kleur krijg je', 'bij blauw + geel?'], 'Groen', 'Oranje', 'Paars', ['Blauw en geel', 'maken samen groen.'], 'paint'),
 (['Welk werelddeel is', 'het grootst?'], 'Azië', 'Afrika', 'Europa', ['Azië is het grootste', 'werelddeel.'], 'earth'),
 (['Welk gas hebben we', 'nodig om te ademen?'], 'Zuurstof', 'Stikstof', 'Helium', ['We ademen zuurstof in.', 'Planten maken het.'], 'tree'),
 (['In welk land staan', 'de piramides van Gizeh?'], 'Egypte', 'Mexico', 'India', ['De piramides van', 'Gizeh staan in Egypte.'], 'pyramid'),
 (['Hoeveel snaren heeft', 'een gewone gitaar?'], '6', '4', '5', ['Een gewone gitaar', 'heeft 6 snaren.'], 'guitar'),
 (['Welke oceaan is', 'de grootste?'], 'Stille Oceaan', 'Atlantische', 'Indische', ['De Stille Oceaan is', 'veruit de grootste.'], 'wave'),
 (['Hoe heet het sterren-', 'stelsel van de aarde?'], 'Melkweg', 'Andromeda', 'Orion', ['Onze zon hoort bij', 'de Melkweg.'], 'comet'),
 (['Wat eet een panda', 'vooral?'], 'Bamboe', 'Vis', 'Vlees', ['Panda\'s eten bijna', 'alleen bamboe.'], 'panda'),
 (['Hoeveel kleuren', 'heeft een regenboog?'], '7', '5', '6', ['Een regenboog heeft', '7 kleuren.'], 'rainbow'),
 (['Welk zoogdier legt', 'eieren?'], 'Vogelbekdier', 'Egel', 'Vleermuis', ['Het vogelbekdier legt', 'eieren, al is het', 'een zoogdier.'], 'egg'),
 (['Wat is H2O?'], 'Water', 'Zout', 'Lucht', ['H2O is de formule', 'van water.'], 'flask'),
 (['Wie schilderde', 'De Nachtwacht?'], 'Rembrandt', 'Van Gogh', 'Vermeer', ['Rembrandt maakte', 'De Nachtwacht in 1642.'], 'paint'),
 (['Hoeveel graden', 'is een rechte hoek?'], '90', '45', '180', ['Een rechte hoek', 'is 90 graden.'], 'pencil'),
 (['Welk landdier is', 'het snelst?'], 'Cheeta', 'Leeuw', 'Paard', ['De cheeta haalt', 'ruim 100 km per uur.'], 'lion'),
 (['Welk product maakt', 'een bij?'], 'Honing', 'Melk', 'Suiker', ['Bijen maken honing', 'van nectar.'], 'bee'),
 (['Hoeveel hoeken', 'heeft een zeshoek?'], '6', '5', '8', ['Zes-hoek: zes hoeken', 'en zes zijden.'], 'puzzle'),
 (['Hoeveel is de', 'helft van 250?'], '125', '150', '100', ['250 gedeeld door 2', 'is 125.'], 'target'),
 (['Welke planeet is', 'de grootste?'], 'Jupiter', 'Saturnus', 'Neptunus', ['Jupiter is de grootste', 'planeet van allemaal.'], 'planet'),
 (['Wie was de eerste', 'mens op de maan?'], 'Neil Armstrong', 'Buzz Aldrin', 'Yuri Gagarin', ['Neil Armstrong zette', 'in 1969 de eerste stap.'], 'moon'),
 (['Welke vogel kan', 'achteruit vliegen?'], 'Kolibrie', 'Uil', 'Adelaar', ['De kolibrie is de enige', 'vogel die dat kan.'], None),
 (['Hoeveel tanden heeft', 'een volwassene (alles)?'], '32', '28', '36', ['Met verstandskiezen', 'zijn het er 32.'], 'skull'),
 (['Wat is de langste', 'rivier van Europa?'], 'Wolga', 'Rijn', 'Donau', ['De Wolga in Rusland', 'is ruim 3500 km lang.'], 'map'),
 (['Welk getal is een', 'priemgetal?'], '11', '9', '15', ['11 is alleen deelbaar', 'door 1 en 11.'], 'gem'),
]
rnd = random.Random(11); pos = [0] * 10 + [1] * 10 + [2] * 10
while True:
    rnd.shuffle(pos)
    if all(not (pos[i] == pos[i + 1] == pos[i + 2]) for i in range(28)): break
BGQ = ['paars', 'blauw', 'roze', 'turq', 'oranje', 'groen', 'nacht', 'rood', 'diep', 'goud']
for i, (q, ok, w1, w2, ex, ic) in enumerate(Q):
    ans = [None] * 3; ans[pos[i]] = ok; ws = [w1, w2]
    for k in range(3):
        if ans[k] is None: ans[k] = ws.pop(0)
    add('quiz', 'Quiz: ' + ' '.join(q), ['quiz', 'vraag', 'kennis'], 'quiz', BGQ[i % 10], 10, q=q, answers=ans, correct=pos[i], expl=ex, icon=ic,
        style='clock' if i % 3 != 2 else 'bar', reveal='sparks' if i % 2 == 0 else 'confetti', seed=i)

# ---------------- ruimte (20) ----------------
RU = 'ruimte'
add('ruimte', 'Acht planeten', ['planeten', 'zonnestelsel'], 'orbit', RU, planets=[('mercurius', .16, 1.1, 8, 0), ('venus', .26, 1.6, 5, 2), ('aarde', .28, 2.1, 3, 4), ('mars', .22, 2.6, 2, 1)], lines=['De zon heeft', '*acht planeten'])
add('ruimte', 'Zonlicht onderweg', ['zon', 'licht', 'aarde'], 'orbit', RU, planets=[('aarde', .35, 2.4, 1, 0)], lines=['Zonlicht doet er', '*8 minuten over', 'naar de aarde'], seed=2)
add('ruimte', 'Een jaar op Neptunus', ['neptunus', 'jaar', 'planeten'], 'orbit', 'blauw', planets=[('aarde', .26, 1.5, 8, 1), ('neptunus', .4, 2.7, 1, 3)], lines=['Een jaar op Neptunus', 'duurt *165 aardse', 'jaren'], seed=3, size=.72)
add('ruimte', 'Venus: dag langer dan jaar', ['venus', 'dag', 'jaar'], 'orbit', 'ruimte', planets=[('venus', .45, 2.3, 3, 0)], lines=['Op Venus duurt een', 'dag *langer', 'dan een jaar'], seed=4)
add('ruimte', 'Mercurius is de kleinste', ['mercurius', 'kleinste', 'planeet'], 'orbit', 'nacht', planets=[('mercurius', .3, 1.6, 6, 0), ('mars', .22, 2.6, 2, 2)], lines=['Mercurius is de', '*kleinste planeet', 'van allemaal'], seed=5)
add('ruimte', 'Naar Mars', ['mars', 'raket', 'reis'], 'trip', 'ruimte', planets=[('mars', 1.0, -1.7, 40, 100), ('maan', .5, 1.8, 130, 70)], lines=['Naar Mars reizen', 'duurt ongeveer', '*7 maanden'], seed=6)
add('ruimte', 'Jupiter de grootste', ['jupiter', 'raket', 'planeten'], 'trip', 'diep', planets=[('mars', .6, -1.9, 20, 70), ('jupiter', 1.7, 1.2, 60, 100), ('saturnus', .9, -1.7, 130, 80)], lines=['Jupiter is groter', 'dan alle andere', '*planeten samen'], seed=7)
add('ruimte', 'Saturnus drijft', ['saturnus', 'drijven', 'planeet'], 'trip', 'roze', planets=[('saturnus', 1.0, 1.5, 20, 100), ('uranus', .8, -1.8, 100, 80)], lines=['Saturnus zou in', 'water *drijven'], seed=8, rscale=1.0)
add('ruimte', 'Hoogste vulkaan op Mars', ['mars', 'vulkaan', 'planeet'], 'trip', 'rood', planets=[('mars', 1.5, -1.3, 20, 110), ('venus', .7, 1.9, 120, 70)], lines=['Op Mars staat de', 'grootste vulkaan:', '*22 km hoog'], seed=9)
add('ruimte', 'Eerste mens op de maan', ['maan', 'maanlanding', 'armstrong'], 'land', 'ruimte', lines=['De eerste mens', 'op de maan was', '*Neil Armstrong'], seed=1)
add('ruimte', 'Op de maan weeg je minder', ['maan', 'zwaartekracht', 'gewicht'], 'land', 'nacht', lines=['Op de maan weeg', 'je *6x minder'], flag='#3b82f6', seed=2)
add('ruimte', 'Voetstappen op de maan', ['maan', 'voetstappen', 'wind'], 'land', 'blauw', lines=['Geen wind op de maan:', 'voetstappen blijven', '*heel lang'], flag='#22c55e', seed=3)
add('ruimte', 'Astronauten worden langer', ['astronaut', 'ruimte', 'lichaam'], 'astro', 'ruimte', lines=['Astronauten worden', 'in de ruimte', '*iets langer'])
add('ruimte', 'Astronauten vallen', ['astronaut', 'zweven', 'baan'], 'astro', 'diep', lines=['Astronauten zweven,', 'want ze *vallen', 'steeds om de aarde'], seed=5)
add('ruimte', 'Geen geluid in de ruimte', ['geluid', 'ruimte', 'vacuüm'], 'astro', 'nacht', planet_name='maan', lines=['In de ruimte is', 'het doodstil:', '*geen geluid'], seed=6)
add('ruimte', 'Staart van een komeet', ['komeet', 'staart', 'zon'], 'comet', 'ruimte', lines=['De staart van een', 'komeet wijst altijd', '*van de zon af'])
add('ruimte', 'Komeet is vuile sneeuwbal', ['komeet', 'ijs', 'stof'], 'comet', 'paars', lines=['Een komeet is een', 'bal van *ijs', 'en stof'], seed=6, n=2)
add('ruimte', 'Jupiter versus aarde', ['jupiter', 'aarde', 'grootte'], 'scale', 'ruimte', items=[('aarde', .17, -2.4, -1.2, 'Aarde'), ('jupiter', 1.9, .6, -1.0, 'Jupiter')], lines=['Jupiter is 11x', 'zo breed als', 'de *aarde'])
add('ruimte', 'Zwart gat', ['zwart gat', 'licht', 'zwaartekracht'], 'hole', 'ruimte', lines=['Uit een zwart gat', 'ontsnapt zelfs', '*licht niet'])
add('ruimte', 'ISS draait rond', ['iss', 'ruimtestation', 'aarde'], 'sat', 'ruimte', lines=['Het ISS draait', 'zo\'n 16 keer per dag', '*om de aarde'])
add('ruimte', 'Satelliet in een baan', ['satelliet', 'baan', 'aarde'], 'sat', 'nacht', lines=['Satellieten vliegen', 'in een *baan', 'rond de aarde'], n=3, seed=3)

# ---------------- fantasie (15) ----------------
add('fantasie', 'Draak bakt pizza', ['draak', 'vuur', 'pizza'], 'dragon', 'rood', lines=['De draak bakt', 'een *pizza!'])
add('fantasie', 'Draak en de taart', ['draak', 'vuur', 'taart'], 'dragon', 'blauw', lines=['Een draak bakt', 'een *taart', 'voor jou!'], target='cake', fire=('#22d3ee', '#a7f3d0'), seed=2)
add('fantasie', 'Pas op, vuurspuwer', ['draak', 'vuur', 'kasteel'], 'dragon', 'nacht', lines=['Pas op voor', 'de *vuurspuwer!'], target='castle', fire=('#a855f7', '#f0abfc'), seed=3)
add('fantasie', 'Abracadabra', ['toverstaf', 'magie', 'vonken'], 'wand', 'paars', lines=['Abracadabra!', '*Alles verandert'], items=['frog', 'carrot', 'cake', 'dog'])
add('fantasie', 'Hocus pocus', ['toverstaf', 'magie', 'vonken'], 'wand', 'turq', lines=['Hocus Pocus!', 'Zie je het?'], items=['apple', 'gem', 'bell', 'horse'], seed=3)
add('fantasie', 'Simsalabim', ['toverstaf', 'magie', 'dieren'], 'wand', 'roze', lines=['Simsalabim!', '*Tover mee'], items=['egg', 'bee', 'penguin', 'star'], seed=4)
add('fantasie', 'Schatkist gaat open', ['schatkist', 'goud', 'schat'], 'chest', 'goud', lines=['De schatkist', 'gaat open!'], items=['gem', 'coin', 'crown', 'star'])
add('fantasie', 'Wat zit er in de kist', ['schatkist', 'raadsel', 'schat'], 'chest', 'diep', lines=['Wat zit er', 'in de kist?'], items=['key', 'trophy', 'medal', 'ring'], seed=4)
add('fantasie', 'Kasteel in de wolken', ['kasteel', 'wolken', 'sprookje'], 'castle', 'blauw', lines=['Een kasteel', 'in de *wolken'])
add('fantasie', 'Hoog in de lucht', ['kasteel', 'koning', 'wolken'], 'castle', 'roze', lines=['Hoog in de lucht', 'woont een *koning'], rainbow=False, seed=5)
add('fantasie', 'Toverdrank', ['toverdrank', 'tovenaar', 'magie'], 'potion', 'groen', lines=['De toverdrank', 'is *klaar!'], ingredients=['frog', 'mushroom', 'star'], colors=['#22c55e', '#a855f7', '#38bdf8', '#f472b6'])
add('fantasie', 'Tovenaar mengt drank', ['toverdrank', 'tovenaar', 'eenhoorn'], 'potion', 'paars', lines=['Een tovenaar', 'mengt een drank'], ingredients=['mushroom', 'heart', 'bee'], colors=['#a855f7', '#f472b6', '#fde047', '#38bdf8'], final='unicorn', seed=6)
add('fantasie', 'Kikker plus ster', ['toverdrank', 'kikker', 'fee'], 'potion', 'blauw', lines=['Kikker + ster', '= *magie!'], ingredients=['frog', 'star', 'gem'], colors=['#38bdf8', '#22c55e', '#f59e0b', '#c084fc'], final='fairy', seed=7)
add('fantasie', 'Eenhoorn regenboog', ['eenhoorn', 'regenboog', 'sprookje'], 'unicorn', 'roze', lines=['Hoppa!', 'Een *regenboog'])
add('fantasie', 'Eenhoorn rent', ['eenhoorn', 'regenboog', 'sterren'], 'unicorn', 'paars', lines=['Een eenhoorn', 'rent over de', '*regenboog'], items=('heart', 'star', 'butterfly'), seed=7)

for i, d in enumerate(S): d['id'] = 's%03d' % (201 + i)
assert len(S) == 100, len(S)
