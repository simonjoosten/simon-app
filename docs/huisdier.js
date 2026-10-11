// Huisdier 2.0: een rustig, schattig maatje met eieren, levensfases, getekende huisdieren, huizen en kamers, tuin, koken, kleding, geluid, spelletjes en vrienden.
// Nooit dood: hooguit moe, verdrietig of ziek (dan helpt medicijn of de dierenarts).
// Firestore: pets/{uid} = { data: <JSON-string, max 18000 tekens>, updated: ms }
// Losse modules (dynamisch geladen, allemaal optioneel): huisdier-art-pets.js, huisdier-art-rooms.js, huisdier-sound.js, huisdier-games.js,
// huisdier-extra.js (Steun, Uitlaten, Camera), huisdier-koken.js, huisdier-social.js (vrienden, cadeaus, evenement, hulp).
import { doc, getDoc, setDoc }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

/* =====================================================================
   1. DATA
   ===================================================================== */
const MIN = 60000;
const H = 3600000;
const DAY = 86400000;
const MAX_OFFLINE = 24 * H;   // maximaal 24 uur aftrek
const FLOOR = 15;             // daarna (door tijd) nooit lager dan 15
const EGG_MS = 2 * MIN;       // ei komt de eerste keer uit na 2 minuten
const SICK_AFTER = 12 * H;    // twee behoeften zo lang heel laag (onderaan, <16) -> ziek
const MAX_DATA = 18000;
const MAXLV = 50;
const NEEDS = ['hunger', 'happy', 'energy', 'clean'];
const RATES = { hunger: 4, happy: 3, energy: 2, clean: 3 }; // punten per uur
const NEED_LABEL = { hunger: '🍎 Honger', happy: '💛 Geluk', energy: '⚡ Energie', clean: '🫧 Schoon' };

const TYPES = { kat: '🐱', hond: '🐶', konijn: '🐰', panda: '🐼', eend: '🦆', kikker: '🐸', eenhoorn: '🦄', draakje: '🐲' };
const TYPE_NL = { kat: 'Kat', hond: 'Hond', konijn: 'Konijn', panda: 'Panda', eend: 'Eend', kikker: 'Kikker', eenhoorn: 'Eenhoorn', draakje: 'Draakje', mix: 'Mix-huisdier' };
// minstens 24 dieren/wezens voor het mix-huisdier (allemaal met officiële Emoji Kitchen-mixen)
const MIXLIST = ['🐱', '🐶', '🐰', '🐼', '🐸', '🦄', '🐻', '🦊', '🐵', '🐷', '🐮', '🐔', '🐧', '🐢', '🐙', '🦋', '🐝', '🐞', '🦉', '🦁', '🐯', '🐨', '🐭', '🐳', '🦈', '👻', '🤖', '👽'];
const NPAL = 6;                                   // 6 paletten per soort; `hue` in de state is de paletindex
const SPECIES_ID = (t) => (t === 'draakje' ? 'draak' : t); // id in huisdier-art-pets.js
const PAL_FALLBACK = ['Natuurlijk', 'Zonnig', 'Mint', 'Zee', 'Lila', 'Roze'];

const STAGES = { ei: { n: 'Ei', sc: 0.9 }, baby: { n: 'Baby', sc: 0.6 }, kind: { n: 'Kind', sc: 0.8 }, tiener: { n: 'Tiener', sc: 0.95 }, volwassen: { n: 'Volwassen', sc: 1.1 } };

// Persoonlijkheden: m = daalsnelheid-factor per behoefte, fav/hate = eten, say = eigen zinnen per stemming (met | gescheiden)
const PERS = {
  speels: { n: 'Speels', e: '🎾', m: { hunger: 1, happy: 1.3, energy: 1.2, clean: 1.1 }, fav: ['koekje', 'ijsje', 'popcorn'], hate: ['broccoli', 'aubergine'],
    say: { blij: 'Zullen we wat spelen?|Ik heb zin in een spelletje!', blijblij: 'Huppakee, wat een feest!|Ik kan wel dansen van geluk!', hongerig: 'Eerst een hapje, dan spelen!|Mijn buik wil ook meedoen…', moe: 'Even uitrusten, dan spelen we verder.|Ik ben bijna te moe om te stuiteren…', vies: 'Ik heb te veel rondgerold, haha.|Een badje? Met bubbels?', verdrietig: 'Niemand wil met me spelen…|Zin in een spelletje samen?', slaap: 'Zzz… ik win het spelletje…|Zzz… *rolt een balletje*', ziek: 'Spelen lukt even niet…|Ik voel me knorrig en slap.', boos: 'Hé! Ik was net aan het dromen van een bal!|Pfff, nu mis ik mijn spelletje.' } },
  slaperig: { n: 'Slaperig', e: '😴', m: { hunger: 0.9, happy: 0.9, energy: 1.4, clean: 1 }, fav: ['melk', 'honing', 'taart'], hate: ['popcorn', 'mais'],
    say: { blij: 'Heerlijk rustig, hè…|*geeuw* Wat een fijne dag.', blijblij: 'Ik ben zó tevreden, bijna slaperig.|Alles is zacht en warm. Fijn!', hongerig: 'Eten en dan slapen, graag.|Mijn buik rommelt me wakker…', moe: 'Mag ik een dutje? Alsjeblieft?|Mijn oogjes vallen al dicht…', vies: 'Ik ben te slaperig om me te wassen…|Een warm badje en dan slapen?', verdrietig: 'Ik voel me wat somber en moe…|Een knuffel bij het kussen?', slaap: 'Zzz… zzz… zzz…|Zzz… dromen over wolkjes…', ziek: 'Ik wil alleen maar slapen…|Mijn hoofdje is zo zwaar.', boos: 'Mmpf… laat me slapen!|Waarom word je me wakker? Brom.' } },
  gulzig: { n: 'Gulzig', e: '🍔', m: { hunger: 1.4, happy: 1, energy: 0.9, clean: 1 }, fav: ['pizza', 'brood', 'stoof'], hate: ['druif', 'salade'],
    say: { blij: 'Is het al etenstijd?|Ik ruik iets lekkers!', blijblij: 'Mijn buik is vol en mijn hart ook!|Dit is de beste dag, na de lunch.', hongerig: 'Mijn buik is leeg als een trommel!|Eten, eten, eten, alsjeblieft!', moe: 'Ik ben moe van het lekker zijn.|Een dutje na het eten, ja?', vies: 'Ik zit onder de kruimels…|Even afspoelen na het snoepen.', verdrietig: 'Ik mis iets lekkers en iemand erbij…|Een koekje zou me opvrolijken.', slaap: 'Zzz… mmm… taart…|Zzz… *smakt zachtjes*', ziek: 'Zelfs eten lijkt even niet leuk…|Mijn buikje voelt raar.', boos: 'Ik droomde van pizza!|Grrr, mijn droomtaart is weg.' } },
  netjes: { n: 'Netjes', e: '✨', m: { hunger: 0.9, happy: 1, energy: 1, clean: 1.5 }, fav: ['appel', 'wortel', 'salade'], hate: ['ijsje', 'donut'],
    say: { blij: 'Alles is lekker opgeruimd.|Wat zit mijn vacht mooi!', blijblij: 'Alles glimt en ik ook!|Wat een nette, prachtige dag.', hongerig: 'Een nette maaltijd graag.|Mijn buikje wil iets gezonds.', moe: 'Even mijn bedje opschudden en dan slapen.|Rustig aan, ik ben moe.', vies: 'Help, ik ben vies! Een bad, snel!|Ik voel me helemaal niet fris…', verdrietig: 'Het is hier zo rommelig in mijn hoofd…|Wil je me even opvrolijken?', slaap: 'Zzz… netjes gevouwen dromen…|Zzz… zzz… alles op zijn plek.', ziek: 'Ik voel me niet schoon of gezond…|Mijn neusje is verkouden.', boos: 'Mijn slaaprituaal is verstoord!|Mijn vacht zit nu in de war…' } },
  nieuwsgierig: { n: 'Nieuwsgierig', e: '🔍', m: { hunger: 1, happy: 1.3, energy: 1, clean: 1.2 }, fav: ['sushi', 'mais', 'taco'], hate: ['brood', 'appel'],
    say: { blij: 'Wat zou daar achter dat raam zijn?|Vertel eens wat nieuws!', blijblij: 'Ik ontdek zóveel leuke dingen!|Wat een geweldige dag vol verrassingen!', hongerig: 'Wat is er vandaag voor lekkers?|Zou jij iets eetbaars kunnen vinden?', moe: 'Even uitrusten, morgen ontdek ik meer.|Mijn oogjes kijken niet meer scherp…', vies: 'Ik heb overal in gekeken, kijk mij nu…|Wat zit er op mijn neus?', verdrietig: 'Het is zo stil, ik wil iets ontdekken…|Heb je een nieuw spelletje voor me?', slaap: 'Zzz… ik droom van nieuwe kamers…|Zzz… wat is dat voor geluid…', ziek: 'Ik vraag me af wat ik heb…|Dokter, wat is dit voor kriebel?', boos: 'Ik was net iets aan het ontdekken in mijn droom!|Hmm! Wat gebeurde er?!' } },
  lief: { n: 'Lief', e: '💗', m: { hunger: 0.9, happy: 0.8, energy: 0.9, clean: 0.9 }, fav: ['aardbei', 'taart', 'honing'], hate: ['kaas', 'aubergine'],
    say: { blij: 'Wat fijn dat jij er bent!|Je bent zo lief voor me.', blijblij: 'Ik hou zóveel van jou!|Mijn hartje danst van blijdschap.', hongerig: 'Als het mag, lust ik wel een hapje.|Zou ik misschien iets te eten krijgen?', moe: 'Ik ben een beetje moe, maar het geeft niet.|Een zacht plekje om te slapen, graag.', vies: 'Sorry, ik ben een beetje vies geworden.|Mag ik een badje, alsjeblieft?', verdrietig: 'Ik mis je een beetje…|Een knuffeltje zou fijn zijn.', slaap: 'Zzz… lieve dromen…|Zzz… jij bent erin, zzz.', ziek: 'Maak je geen zorgen, ik word wel beter.|Ik voel me wat zwak, maar jij bent er.', boos: 'Oh… ik sliep zo lekker. Maar het is oké.|Hmm, een beetje chagrijnig. Sorry!' } },
};
const PERS_KEYS = Object.keys(PERS);

// gemeenschappelijke zinnen per stemming (minstens 4)
const SAY = {
  blijblij: ['Ik ben super blij! 🥰', 'Wat een heerlijke dag!', 'Jij bent de allerbeste!', 'Alles is gewoon fijn.'],
  blij: ['Hoi! Fijn dat je er bent.', 'Alles is lekker rustig.', 'Zullen we iets doen?', 'Wat een gezellige kamer.'],
  hongerig: ['Mijn buikje rommelt…', 'Heb je iets lekkers voor me?', 'Ik heb wel zin in een hapje.', 'Wat zou er in de keuken zijn?'],
  moe: ['Ik ben een beetje slaperig…', 'Een dutje zou fijn zijn.', '*geeuw*', 'Mijn oogjes zijn zo zwaar…'],
  vies: ['Ik voel me wat plakkerig…', 'Een badje zou lekker zijn!', 'Hmm, ik ruik een beetje.', 'Bubbels! Ik wil bubbels!'],
  verdrietig: ['Ik voel me een beetje alleen…', 'Zin om te spelen?', 'Een knuffel of spelletje helpt!', 'Blijf je even bij me?'],
  slaap: ['Zzz… zzz…', 'Zzz… dromen over koekjes…', 'Zzz… *zacht gesnurk*', 'Zzz… wolkjes en sterren…'],
  ziek: ['Ik voel me niet zo lekker…', 'Een medicijntje zou helpen.', 'Ik heb het zo warm en koud…', 'Blijf je even bij me?'],
  boos: ['Hmpf! Ik sliep nog!', 'Grrr… ik ben chagrijnig.', 'Laat me nog even slapen…', 'Pfff, dat was niet aardig.'],
  ei: ['…', '*tik tik*', '*beweegt zachtjes*', 'Iets warms in het ei…'],
};
const MOOD_EMO = { blijblij: '✨', blij: '😊', hongerig: '🍽️', moe: '💤', vies: '💦', verdrietig: '😢', slaap: '😴', ziek: '🤒', boos: '😤', ei: '🥚' };
const MOOD_NL = { blijblij: 'dolgelukkig', blij: 'blij', hongerig: 'hongerig', moe: 'moe', vies: 'vies', verdrietig: 'verdrietig', slaap: 'slaapt', ziek: 'ziek', boos: 'chagrijnig', ei: 'in het ei' };

// Eten: f = [honger, geluk, energie, schoon], p = winkelprijs (0 = niet te koop), sv = verkoopwaarde
const FOODS = [
  { id: 'appel', e: '🍎', n: 'Appel', p: 3, sv: 2, f: [15, 2, 0, 0] },
  { id: 'banaan', e: '🍌', n: 'Banaan', p: 4, sv: 2, f: [18, 2, 4, 0] },
  { id: 'brood', e: '🍞', n: 'Brood', p: 5, sv: 3, f: [22, 0, 0, 0] },
  { id: 'kaas', e: '🧀', n: 'Kaas', p: 6, sv: 3, f: [18, 4, 0, 0] },
  { id: 'koekje', e: '🍪', n: 'Koekje', p: 5, sv: 3, f: [8, 12, 0, 0] },
  { id: 'ijsje', e: '🍦', n: 'IJsje', p: 8, sv: 4, f: [6, 18, 0, -3] },
  { id: 'donut', e: '🍩', n: 'Donut', p: 6, sv: 3, f: [10, 12, 0, -3] },
  { id: 'popcorn', e: '🍿', n: 'Popcorn', p: 6, sv: 3, f: [10, 10, 0, 0] },
  { id: 'melk', e: '🥛', n: 'Melk', p: 4, sv: 2, f: [10, 0, 10, 0] },
  { id: 'honing', e: '🍯', n: 'Honing', p: 7, sv: 4, f: [12, 10, 8, -2] },
  { id: 'pizza', e: '🍕', n: 'Pizza', p: 10, sv: 5, f: [30, 8, 0, -4], lv: 2 },
  { id: 'sushi', e: '🍣', n: 'Sushi', p: 12, sv: 6, f: [26, 10, 0, 0], lv: 3 },
  { id: 'taart', e: '🍰', n: 'Taart', p: 14, sv: 7, f: [14, 22, 0, -3], lv: 3 },
  // gewassen uit de tuin
  { id: 'aardbei', e: '🍓', n: 'Aardbei', p: 0, sv: 3, f: [10, 6, 0, 0] },
  { id: 'tomaat', e: '🍅', n: 'Tomaat', p: 0, sv: 4, f: [12, 3, 0, 0] },
  { id: 'wortel', e: '🥕', n: 'Wortel', p: 0, sv: 4, f: [14, 2, 0, 0] },
  { id: 'mais', e: '🌽', n: 'Maïs', p: 0, sv: 5, f: [16, 3, 3, 0] },
  { id: 'aardappel', e: '🥔', n: 'Aardappel', p: 0, sv: 4, f: [14, 0, 0, -1] },
  { id: 'broccoli', e: '🥦', n: 'Broccoli', p: 0, sv: 6, f: [16, 0, 6, 2] },
  { id: 'aubergine', e: '🍆', n: 'Aubergine', p: 0, sv: 7, f: [16, 2, 4, 0] },
  { id: 'druif', e: '🍇', n: 'Druiven', p: 0, sv: 8, f: [14, 8, 2, 0] },
  { id: 'ui', e: '🧅', n: 'Ui', p: 0, sv: 3, f: [8, 0, 0, 0] },
  { id: 'paprika', e: '🫑', n: 'Paprika', p: 0, sv: 5, f: [12, 3, 2, 0] },
  { id: 'spinazie', e: '🥬', n: 'Spinazie', p: 0, sv: 5, f: [12, 0, 8, 2] },
  { id: 'courgette', e: '🥒', n: 'Courgette', p: 0, sv: 5, f: [13, 1, 3, 0] },
  // gerechten (koken)
  { id: 'stoof', e: '🥘', n: 'Stoofpotje', p: 0, sv: 12, f: [42, 12, 8, -2], dish: 1 },
  { id: 'honingappel', e: '🍮', n: 'Honingappel', p: 0, sv: 10, f: [24, 24, 6, -2], dish: 1 },
  { id: 'shake', e: '🥤', n: 'Aardbeienshake', p: 0, sv: 10, f: [22, 20, 12, 0], dish: 1 },
  { id: 'bananashake', e: '🧋', n: 'Bananenshake', p: 0, sv: 10, f: [24, 16, 14, 0], dish: 1 },
  { id: 'tosti', e: '🥪', n: 'Tosti', p: 0, sv: 9, f: [34, 10, 0, -1], dish: 1 },
  { id: 'bruschetta', e: '🥖', n: 'Bruschetta', p: 0, sv: 10, f: [30, 12, 4, 0], dish: 1 },
  { id: 'taco', e: '🌮', n: 'Mais-kaas-taco', p: 0, sv: 12, f: [36, 14, 4, -2], dish: 1 },
  { id: 'salade', e: '🥗', n: 'Groentesalade', p: 0, sv: 11, f: [30, 8, 14, 6], dish: 1 },
  { id: 'fruitijs', e: '🍧', n: 'Fruitijs', p: 0, sv: 9, f: [16, 26, 4, -2], dish: 1 },
  { id: 'coupe', e: '🍨', n: 'IJscoupe', p: 0, sv: 11, f: [16, 30, 0, -4], dish: 1 },
  { id: 'pasta', e: '🍝', n: 'Aubergine-pasta', p: 0, sv: 13, f: [44, 12, 6, -3], dish: 1 },
  { id: 'friet', e: '🍟', n: 'Kaasfriet', p: 0, sv: 11, f: [32, 18, 0, -4], dish: 1 },
  { id: 'fruittaart', e: '🥧', n: 'Fruittaartje', p: 0, sv: 14, f: [26, 28, 6, -2], dish: 1 },
];
const FOOD = Object.fromEntries(FOODS.map((i) => [i.id, i]));
const RECIPES = {
  'aardappel+wortel': 'stoof', 'appel+honing': 'honingappel', 'aardbei+melk': 'shake', 'banaan+melk': 'bananashake',
  'brood+kaas': 'tosti', 'brood+tomaat': 'bruschetta', 'kaas+mais': 'taco', 'broccoli+wortel': 'salade',
  'aardbei+banaan': 'fruitijs', 'ijsje+koekje': 'coupe', 'aubergine+tomaat': 'pasta', 'aardappel+kaas': 'friet', 'appel+druif': 'fruittaart',
};

// Zaadjes: g = groeitijd (ms), y = opbrengst
const SEEDS = [
  { id: 'aardbei', p: 6, g: 2 * MIN, y: 2, lv: 1 },
  { id: 'tomaat', p: 8, g: 10 * MIN, y: 2, lv: 1 },
  { id: 'wortel', p: 9, g: 20 * MIN, y: 3, lv: 2 },
  { id: 'mais', p: 12, g: 45 * MIN, y: 3, lv: 3 },
  { id: 'aardappel', p: 10, g: 1 * H, y: 3, lv: 3 },
  { id: 'broccoli', p: 14, g: 2 * H, y: 3, lv: 4 },
  { id: 'aubergine', p: 16, g: 3 * H, y: 3, lv: 5 },
  { id: 'druif', p: 22, g: 4 * H, y: 4, lv: 6 },
  { id: 'appel', p: 28, g: 6 * H, y: 5, lv: 7 },
  { id: 'spinazie', p: 11, g: 25 * MIN, y: 3, lv: 2 },
  { id: 'ui', p: 8, g: 30 * MIN, y: 3, lv: 2 },
  { id: 'paprika', p: 14, g: 90 * MIN, y: 3, lv: 4 },
  { id: 'courgette', p: 15, g: 150 * MIN, y: 3, lv: 5 },
];
const SEED = Object.fromEntries(SEEDS.map((i) => [i.id, i]));

const MEDS = [
  { id: 'med', e: '💊', n: 'Medicijn', p: 25, lv: 1, cure: 1, d: 'Maakt een ziek huisdier beter' },
  { id: 'thee', e: '🍵', n: 'Kruidenthee', p: 40, lv: 3, cure: 1, f: [0, 15, 10, 0], d: 'Maakt beter en geeft een warm gevoel' },
  { id: 'vitamine', e: '🍬', n: 'Vitamientje', p: 12, lv: 1, f: [5, 5, 20, 0], d: 'Een beetje extra energie' },
];
const MED = Object.fromEntries(MEDS.map((i) => [i.id, i]));

// Oude (2.0-emoji) meubels en kleding: alleen nog nodig om oude saves te migreren (oude meubels geven hun prijs terug als munten).
const OLD_FURN_P = { bank: 30, stoel: 12, plant: 10, schilder: 18, kaars: 8, tv: 40, klok: 20, boeken: 14, spiegel: 24, mand: 10, raam: 22, teddy: 16, piano: 60, gitaar: 45, bed: 35, ballon: 8, puzzel: 12, ezel: 28, vlieger: 12, fontein: 55, badkuip: 40, douche: 35, zeep: 6, eend: 10, boom: 20, zonnebloem: 20, paddo: 10, tent: 38, lantaarn: 18, regenboog: 40, maan: 25, ster: 15, vis: 30, strand: 50, spelcomputer: 48, bal: 10, lamp: 12, boeket: 14, taartje: 20, cadeau: 15 };
// oude kleding-id -> nieuwe accessoire-id (null = geen tegenhanger: prijs terug als munten)
const OLD_CLOTH_MAP = {
  hoed: 'hogehoed', kroon: 'kroon', pet: 'baret', feest: 'feesthoed', pet2: 'petje', strohoed: 'cowboyhoed', helm: 'helm', bloem: 'bloemenkrans', kerstmuts: 'pompommuts',
  bril: 'zonnebril', bril2: 'rond', duikbril: 'skibril', masker: 'masker', vermomming: 'nerdbril', mondkap: null,
  sjaal: 'sjaal', strik: 'vlinderdas', medaille: 'medaille', ketting: 'hartketting', belletje: 'belletje', vlinder: 'vlinderdas',
  shirt: 'trui', jas: 'jasje', jurk: 'tutu', sport: 'hoodie', hesje: 'regenjas', badpak: 'zwemband', kimono: 'cape', doktersjas: 'schort',
};
const OLD_CLOTH_P = { mondkap: 15 };

// Kleding: 4 plekken. De state gebruikt korte sleutels (h/f/n/b), de tekenmodule lange (hat/glasses/neck/body).
const SLOTS = ['h', 'f', 'n', 'b'];
const SK = { hat: 'h', glasses: 'f', neck: 'n', body: 'b' };
const KS = { h: 'hat', f: 'glasses', n: 'neck', b: 'body' };
const SLOT_NL = { hat: 'Hoed', glasses: 'Bril', neck: 'Hals', body: 'Lijf' };
const SLOT_EMO = { hat: '🎩', glasses: '🕶️', neck: '🧣', body: '👕' };
const ART_SLOTS = ['hat', 'glasses', 'neck', 'body'];

// Kamers: id = korte sleutel in de state; a = id in huisdier-art-rooms.js. w/f/sp = kleurverloop als de tekenmodule ontbreekt.
const ROOMS = [
  { id: 'woon', a: 'woonkamer', e: '🛋️', n: 'Woonkamer', w: '#ffe9d6', f: '#efcfa6', sp: 62 },
  { id: 'keuken', a: 'keuken', e: '🍳', n: 'Keuken', w: '#fff6cf', f: '#e6d5a6', sp: 62 },
  { id: 'slaap', a: 'slaapkamer', e: '🛏️', n: 'Slaapkamer', w: '#e9e1fb', f: '#cdc2ee', sp: 62 },
  { id: 'bad', a: 'badkamer', e: '🛁', n: 'Badkamer', w: '#d9f1f8', f: '#b6dde8', sp: 62 },
  { id: 'tuin', a: 'tuin', e: '🌳', n: 'Tuin', w: '#d3effc', f: '#a9d98b', sp: 55 },
  { id: 'speel', a: 'speelkamer', e: '🎾', n: 'Speelkamer', w: '#ffe1ee', f: '#f6c8da', sp: 62 },
].map((r) => ({ ...r, bg: `linear-gradient(180deg,${r.w} 0,${r.w} ${r.sp}%,${r.f} ${r.sp}%,${r.f} 100%)` }));
const ROOM = Object.fromEntries(ROOMS.map((r) => [r.id, r]));
const RID = /^[a-z0-9-]{1,24}$/;   // veilige id's (meubels, kleding, huizen, recepten) in de state
const ING_CROPS = new Set(['aardbei', 'tomaat', 'wortel', 'mais', 'aardappel', 'broccoli', 'appel', 'ui', 'paprika', 'spinazie', 'courgette']); // oogst die ook als ingrediënt (i_<id>) bestaat

// Dagelijkse opdrachten (sjablonen): k = teller, t = [min, max], r = munten
const QUEST_TPL = [
  { id: 'feed', k: 'feed', t: [3, 5], r: 12, txt: (n) => `Voer je huisdier ${n} keer` },
  { id: 'game', k: 'game', t: [1, 2], r: 15, txt: (n) => `Speel ${n} spelletje${n > 1 ? 's' : ''}` },
  { id: 'harv', k: 'harv', t: [2, 4], r: 14, txt: (n) => `Oogst ${n} gewassen` },
  { id: 'wash', k: 'wash', t: [1, 2], r: 10, txt: (n) => `Was je huisdier ${n} keer` },
  { id: 'cook', k: 'cook', t: [1, 2], r: 14, txt: (n) => `Kook ${n} gerecht${n > 1 ? 'en' : ''}` },
  { id: 'nap', k: 'nap', t: [1, 1], r: 8, txt: () => 'Laat je huisdier een dutje doen' },
  { id: 'pet', k: 'pet', t: [3, 6], r: 10, txt: (n) => `Geef ${n} aaitjes` },
  { id: 'water', k: 'water', t: [2, 4], r: 10, txt: (n) => `Geef ${n} plantjes water` },
  { id: 'plant', k: 'plant', t: [2, 3], r: 10, txt: (n) => `Zaai ${n} zaadjes` },
  { id: 'buy', k: 'buy', t: [1, 1], r: 8, txt: () => 'Koop iets in de winkel' },
  { id: 'ball', k: 'ball', t: [2, 4], r: 10, txt: (n) => `Speel ${n} keer met de bal` },
  { id: 'walk', k: 'walk', t: [1, 1], r: 12, txt: () => 'Maak een wandeling' },
  { id: 'checkin', k: 'checkin', t: [1, 1], r: 10, txt: () => 'Check even in' },
];
const QUEST_BY = Object.fromEntries(QUEST_TPL.map((q) => [q.id, q]));

// Prestaties (minstens 24): [id, emoji, naam, uitleg, test(s, x)] met x = { age (dagen), lv, placed, clothes }
const ACH = [
  ['egg', '🥚', 'Eerste ei', 'Je hebt een huisdier geadopteerd', () => true],
  ['hatch', '🐣', 'Uit het ei', 'Je ei is uitgekomen', (s) => !!s.h],
  ['age1', '🍼', 'Eén dag oud', 'Je huisdier is een dag oud', (s, x) => x.age >= 1],
  ['age7', '🎂', '7 dagen oud', 'Een hele week samen', (s, x) => x.age >= 7],
  ['age30', '🎉', '30 dagen oud', 'Een maand vol liefde', (s, x) => x.age >= 30],
  ['lv5', '⭐', 'Niveau 5', 'Bereik niveau 5', (s, x) => x.lv >= 5],
  ['lv10', '🌟', 'Niveau 10', 'Bereik niveau 10', (s, x) => x.lv >= 10],
  ['lv20', '💫', 'Niveau 20', 'Bereik niveau 20', (s, x) => x.lv >= 20],
  ['feed10', '🍽️', 'Hapjes', '10 keer gevoerd', (s) => c(s, 'feed') >= 10],
  ['feed100', '🍔', 'Smulpaap', '100 keer gevoerd', (s) => c(s, 'feed') >= 100],
  ['cook1', '🧑‍🍳', 'Kok', 'Je eerste gerecht gekookt', (s) => (s.rc || []).length >= 1],
  ['cook10', '🍳', 'Chef-kok', '10 keer gekookt', (s) => c(s, 'cook') >= 10],
  ['rec8', '📖', 'Receptenboek', '8 verschillende gerechten ontdekt', (s) => (s.rc || []).length >= 8],
  ['harv1', '🌱', 'Groene vingers', 'Je eerste gewas geoogst', (s) => c(s, 'harv') >= 1],
  ['harv50', '🧺', 'Moestuinier', '50 gewassen geoogst', (s) => c(s, 'harv') >= 50],
  ['game1', '🎮', 'Speelkind', 'Je eerste spelletje gespeeld', (s) => c(s, 'game') >= 1],
  ['game20', '🕹️', 'Gamer', '20 spelletjes gespeeld', (s) => c(s, 'game') >= 20],
  ['rich', '💰', 'Spaarvarken', '200 munten tegelijk', (s) => s.coins >= 200],
  ['spent', '🛍️', 'Shopper', '100 munten uitgegeven', (s) => c(s, 'spent') >= 100],
  ['decor', '🛋️', 'Interieurontwerper', '6 meubels geplaatst', (s, x) => x.placed >= 6],
  ['fash', '👗', 'Modeheld', '5 kledingstukken bezitten', (s, x) => x.clothes >= 5],
  ['dress', '🎩', 'Volledig aangekleed', 'Draag op alle 4 plekken iets', (s) => SLOTS.every((k) => s.wr && s.wr[k])],
  ['streak3', '🔥', 'Drie op een rij', '3 dagen achter elkaar beloning', (s) => (s.sk || 0) >= 3],
  ['streak7', '💖', 'Trouwe vriend', '7 dagen achter elkaar beloning', (s) => (s.sk || 0) >= 7],
  ['gift1', '🎁', 'Gulle gever', 'Je eerste cadeautje verstuurd', (s) => c(s, 'gift') >= 1],
  ['hug10', '🤗', 'Knuffelaar', '10 aaitjes gegeven', (s) => c(s, 'pet') >= 10],
  ['cure', '🩺', 'Dokter', 'Je huisdier beter gemaakt', (s) => c(s, 'cure') >= 1],
  ['nap5', '😴', 'Slaapkop', '5 dutjes gedaan', (s) => c(s, 'nap') >= 5],
  ['bond', '💞', 'Beste vrienden', 'Maximale band bereikt', (s) => s.bond >= 100],
  ['top', '🏆', 'Ranglijst-eerste', 'Nummer 1 op de ranglijst', (s) => c(s, 'top') >= 1],
  ['wake', '🌙', 'Nachtbraker', 'Je huisdier midden in de nacht wakker gemaakt', (s) => c(s, 'wake') >= 1],
  ['photo', '📸', 'Fotograaf', 'Een foto gemaakt', (s) => c(s, 'photo') >= 1],
  ['quest10', '📋', 'Klusjesheld', '10 dagelijkse opdrachten afgerond', (s) => c(s, 'quest') >= 10],
  ['visit', '🏡', 'Op bezoek', 'Een vriend bezocht', (s) => c(s, 'visit') >= 1],
  ['walk10', '🥾', 'Wandelaar', '10 km samen gewandeld', (s) => walkKm(s) >= 10],
  ['cam', '📸', 'Fotomodel', 'De camera gebruikt met je huisdier', (s) => c(s, 'cam') >= 1],
  ['hide', '🙈', 'Verstoppertje-kampioen', 'Verstoppertje uitgespeeld met je huisdier', (s) => c(s, 'hide') >= 1],
  ['rest', '💛', 'Rustpunt', '5 keer even ingecheckt', (s) => c(s, 'checkin') >= 5],
  ['move', '🏠', 'Verhuizer', 'Een nieuw huis gekocht', (s) => (s.hu || []).length >= 2],
].map(([id, e, n, d, t]) => ({ id, e, n, d, t }));
function c(s, k) { return (s.st && s.st[k]) || 0; }

const TOYS = [['bal', '⚽', 'Bal'], ['teddy', '🧸', 'Teddy'], ['vlieger', '🪁', 'Vlieger'], ['ballon', '🎈', 'Ballon'], ['puzzel', '🧩', 'Puzzel']];
const GIFT_COST = { food: 5, toy: 8, hug: 0 };
const GAME_DAY_CAP = 60;   // munten per dag uit spelletjes
const GAME_MAX = 15;       // munten per spel
const X_MAX = 3000;       // totaal aantal tekens voor de gegevens van modules (state `x`)
function walkKm(s) { const w = s.x && s.x.walk; if (!w) return 0; return Math.max(Number(w.km) || 0, (Number(w.m) || 0) / 1000); }

/* =====================================================================
   2. PURE FUNCTIES (getest in node)
   ===================================================================== */
const clamp = (v) => Math.max(0, Math.min(100, v));
const num = (v, d) => (Number.isFinite(v) ? v : d);
const int = (v, d = 0) => Math.max(0, Math.floor(num(Number(v), d)));
const pad2 = (n) => String(n).padStart(2, '0');
export const dayKey = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
export const prevDay = (key) => { const [y, m, d] = key.split('-').map(Number); return dayKey(new Date(y, m - 1, d - 1, 12).getTime()); };

// 22:00 - 07:00 slaapt het huisdier
export function isNight(ms) { const h = new Date(ms).getHours(); return h >= 22 || h < 7; }
// verdeelt een tijdspanne in uren wakker/slapend (stappen van 15 minuten)
export function nightSplit(from, to) {
  let awake = 0, asleep = 0;
  for (let t = from; t < to; t += 15 * MIN) {
    const len = Math.min(15 * MIN, to - t);
    if (isNight(t + len / 2)) asleep += len / H; else awake += len / H;
  }
  return { awake, asleep };
}
const persMult = (s, k) => (PERS[s.pe] ? PERS[s.pe].m[k] : 1);

// Waarden dalen langzaam met echte tijd. Max 24 uur aftrek; door tijd zakt een waarde niet onder 15
// (was hij al lager, dan blijft hij gelijk). 's Nachts daalt het minder en komt energie terug.
export function decay(state, nowMs) {
  const last = Number.isFinite(state.last) ? state.last : nowMs;
  const span = Math.min(Math.max(0, nowMs - last), MAX_OFFLINE);
  const { awake, asleep } = nightSplit(nowMs - span, nowMs);
  const out = { ...state };
  for (const k of NEEDS) {
    const old = clamp(num(state[k], 70));
    const rate = RATES[k] * persMult(state, k);
    const down = rate * (awake + (k === 'energy' ? 0 : asleep * 0.4));
    let v = Math.max(old - down, Math.min(old, FLOOR));
    if (k === 'energy') v += 8 * asleep;
    out[k] = clamp(v);
  }
  out.last = nowMs;
  return out;
}

export function moodOf(s) {
  const low = [['hongerig', s.hunger], ['moe', s.energy], ['vies', s.clean], ['verdrietig', s.happy]].sort((a, b) => a[1] - b[1])[0];
  if (low[1] < 35) return low[0];
  if (s.hunger >= 70 && s.happy >= 70 && s.energy >= 70 && s.clean >= 70) return 'blijblij';
  return 'blij';
}

export const lowCount = (s, lim = 16) => NEEDS.filter((k) => s[k] < lim).length;

// Tijd waarop de tweede behoefte tot de ondergrens zakte (schatting over de afwezige periode)
function estimateLow(before, now) {
  const last = Number.isFinite(before.last) ? before.last : now;
  const ts = NEEDS.map((k) => {
    const v = clamp(num(before[k], 70));
    if (v < 16) return last;
    return last + ((v - 16) / (RATES[k] * persMult(before, k))) * H;
  }).sort((a, b) => a - b);
  return Math.min(now, Math.max(last, ts[1]));
}

// decay + ziek-worden. Een ei verandert niet. Nooit dood.
export function applyTime(s, now) {
  if (!s.h) return { ...s, last: now };
  const out = decay(s, now);
  if (out.ill) { out.lw = 0; return out; }
  if (lowCount(out) >= 2) {
    if (!out.lw) out.lw = estimateLow(s, now);
    if (now - out.lw >= SICK_AFTER) { out.ill = now; out.lw = 0; }
  } else out.lw = 0;
  return out;
}

export function ageDays(s, now) { return s.h ? Math.max(0, (now - s.h) / DAY) : 0; }
export function stageOf(s, now) {
  if (!s.h) return 'ei';
  const d = ageDays(s, now);
  return d < 1 ? 'baby' : d < 3 ? 'kind' : d < 7 ? 'tiener' : 'volwassen';
}
export const hatchDue = (s, now) => !s.h && now - s.born >= EGG_MS;

// XP -> niveau. Niveau L begint bij 25*(L-1)*L xp.
export const levelXp = (lv) => 25 * (lv - 1) * lv;
export function levelOf(xp) {
  xp = Math.max(0, Math.floor(num(xp, 0)));
  let lv = 1;
  while (lv < MAXLV && xp >= levelXp(lv + 1)) lv++;
  const a = levelXp(lv), b = levelXp(lv + 1);
  return { lv, cur: xp - a, need: lv >= MAXLV ? 0 : b - a, frac: lv >= MAXLV ? 1 : (xp - a) / (b - a) };
}
export const levelReward = (lv) => 10 + 2 * lv;

export const sleepingNow = (s, now) => !!s.h && (now < (s.nap || 0) || (isNight(now) && now >= (s.aw || 0)));
export function moodNow(s, now) {
  if (!s.h) return 'ei';
  if (s.ill) return 'ziek';
  if (sleepingNow(s, now)) return 'slaap';
  if (now < (s.grump || 0)) return 'boos';
  return moodOf(s);
}

// Koken: twee ingrediënten -> gerecht-id of null
export function cook(a, b) {
  if (!a || !b || a === b) return null;
  return RECIPES[[a, b].sort().join('+')] || null;
}

// Groei van een plek { s: zaad, t: geplant, w: water gegeven op (0 = nee) }
export function growth(plot, now) {
  const sd = plot && SEED[plot.s];
  if (!sd) return null;
  const G = sd.g, t = plot.t, w = plot.w || 0;
  let readyAt = t + G, frac;
  if (w && w >= t) {
    const rem = Math.max(0, G - (w - t));
    readyAt = w + rem / 2;
    if (now < w) frac = (now - t) / G;
    else {
      const base = Math.min(1, (w - t) / G);
      frac = rem <= 0 ? 1 : base + (1 - base) * Math.min(1, (now - w) / (rem / 2));
    }
  } else frac = (now - t) / G;
  frac = Math.max(0, Math.min(1, frac));
  const ready = now >= readyAt;
  return { frac: ready ? 1 : frac, readyAt, ready, left: Math.max(0, readyAt - now), watered: !!w };
}

// Dagelijkse opdrachten, deterministisch per dag en gebruiker
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function questsFor(day, seed, skip = []) {
  const r = rng(hash(`${day}|${seed}`));
  const pool = QUEST_TPL.filter((q) => !skip.includes(q.id));
  const out = [];
  while (out.length < 3 && pool.length) {
    const q = pool.splice(Math.floor(r() * pool.length), 1)[0];
    const t = q.t[0] + Math.floor(r() * (q.t[1] - q.t[0] + 1));
    out.push({ i: q.id, t, p: 0, d: 0, r: q.r + t });
  }
  return out;
}
export function questProgress(q) {
  const tpl = QUEST_BY[q.i];
  const target = Math.max(1, q.t || 1), cur = Math.min(target, Math.max(0, q.p || 0));
  return { text: tpl ? tpl.txt(target) : '?', cur, target, frac: cur / target, done: cur >= target, claimed: !!q.d, reward: q.r || 0 };
}

export const dailyReward = (streak) => 10 + Math.min(streak, 14) * 3 + (streak > 0 && streak % 7 === 0 ? 25 : 0);
export function nextStreak(lastDay, today, streak) {
  if (lastDay === today) return streak;
  return lastDay && lastDay === prevDay(today) ? streak + 1 : 1;
}

// Spelbeloning: munten = min(15, round(0.15 * score)), daggrens 60 munten uit spelletjes. Scores lopen van 0 tot 100.
export function gameReward(score, earnedToday) {
  const s = Math.max(0, Number(score) || 0);
  const base = s > 0 ? Math.min(GAME_MAX, Math.round(0.15 * s)) : 0;
  const room = Math.max(0, GAME_DAY_CAP - Math.max(0, earnedToday || 0));
  const coins = Math.min(base, room);
  return { coins, xp: s > 0 ? Math.min(25, 5 + Math.round(s / 10)) : 1, capped: coins < base };
}

export function foodEffect(s, id) {
  const f = FOOD[id]; if (!f) return null;
  const p = PERS[s.pe];
  const fav = !!p && p.fav.includes(id), hate = !!p && p.hate.includes(id);
  const [a, b, d, e] = f.f;
  return { hunger: hate ? Math.round(a / 2) : a, happy: b + (fav ? 8 : 0) - (hate ? 6 : 0), energy: d, clean: e, fav, hate };
}

/* ----- nieuw huisdier, migratie en opslag ----- */
const OLD_CLOTH = { hoed: 'hoed', kroon: 'kroon', pet: 'pet', feest: 'feest', bril: 'bril', sjaal: 'sjaal', strik: 'strik', bloem: 'bloem' };
const OLD_CLOTH_SLOT = { hoed: 'h', kroon: 'h', pet: 'h', feest: 'h', bloem: 'h', bril: 'f', sjaal: 'n', strik: 'n' };
const OLD_BG = { 'bg-regenboog': 'regenboog', 'bg-nacht': 'maan', 'bg-strand': 'strand', 'bg-bos': 'boom' };
const idList = (a, max) => [...new Set((Array.isArray(a) ? a : []).filter((i) => typeof i === 'string' && RID.test(i)))].slice(0, max);
const clampInt = (v, lo, hi) => Math.max(lo, Math.min(hi, int(v, lo)));

export function newPet(o, now = Date.now()) {
  const pe = o.pe && PERS[o.pe] ? o.pe : PERS_KEYS[Math.floor(Math.random() * PERS_KEYS.length)];
  return {
    v: 3, name: String(o.name || 'Maatje').slice(0, 16), type: o.type === 'mix' ? 'mix' : (TYPES[o.type] ? o.type : 'kat'),
    mix: o.type === 'mix' && Array.isArray(o.mix) ? o.mix.slice(0, 2) : 0, hue: int(o.hue) % NPAL, pe,
    born: now, h: 0, last: now, hunger: 80, happy: 80, energy: 80, clean: 80, bond: 10, xp: 0, coins: 20,
    ill: 0, lw: 0, nap: 0, aw: 0, iv: {}, own: [], wr: {}, fp: {}, gd: [0, 0, 0, 0, 0, 0],
    sk: 0, sd: '', qd: '', ql: [], ach: [], st: {}, hs: {}, gc: { d: '', n: 0 }, rc: [], rm: 'woon', lvl: 1,
    hu: ['huisje'], hc: 'huisje', x: {}, dh: [],
  };
}

// Oude saves (v1/v2: emoji-meubels en emoji-kleding) -> v3: kleding naar de nieuwe tegenhanger, oude meubels geven hun prijs terug als munten.
function migrateOld(s) {
  let refund = 0;
  const own = new Set(), wr = {};
  for (const id of s.own) {
    if (Object.prototype.hasOwnProperty.call(OLD_CLOTH_MAP, id)) { const n = OLD_CLOTH_MAP[id]; if (n) own.add(n); else refund += OLD_CLOTH_P[id] || 0; }
    else if (OLD_FURN_P[id] != null) refund += OLD_FURN_P[id];
  }
  for (const k of SLOTS) { const n = OLD_CLOTH_MAP[s.wr[k]]; if (n) { own.add(n); wr[k] = n; } }
  s.own = [...own]; s.wr = wr; s.fp = {};
  s.coins += refund; s.mg = Math.max(1, refund);
}

// Leest 3.0-data en de oudere structuren ({type,name,hunger,happy,energy,clean,coins,owned,worn,bg,born,last} = 1.0, v:2 = 2.0 met emoji-meubels)
export function parseState(raw) {
  try {
    const x = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!x || typeof x !== 'object') return null;
    const isMix = x.type === 'mix' && Array.isArray(x.mix) && x.mix.length === 2 && x.mix.every((e) => MIXLIST.includes(e));
    if (!isMix && !TYPES[x.type]) return null;
    const now = Date.now();
    const ver = x.v === 3 ? 3 : x.v === 2 ? 2 : 1;
    const s = newPet({ type: x.type, name: x.name, mix: x.mix, hue: x.hue, pe: x.pe && PERS[x.pe] ? x.pe : PERS_KEYS[hash(String(x.name || '')) % PERS_KEYS.length] }, now);
    s.born = num(x.born, now); s.last = num(x.last, now);
    s.h = ver === 1 ? s.born : int(x.h);
    for (const k of NEEDS) s[k] = clamp(num(x[k], 70));
    s.bond = clamp(num(x.bond, ver === 1 ? 30 : 10)); s.coins = int(x.coins);
    s.xp = int(x.xp, 0);
    if (ver === 1) s.xp = Math.min(300, Math.floor(Math.max(0, (now - s.born) / DAY) * 10));
    s.lvl = levelOf(s.xp).lv;
    s.ill = int(x.ill); s.lw = int(x.lw); s.nap = int(x.nap); s.aw = int(x.aw);
    if (ver === 1) {
      const own = new Set(), wr = {};
      for (const id of Array.isArray(x.owned) ? x.owned : []) { const n = OLD_CLOTH[id] || OLD_BG[id]; if (n) own.add(n); }
      for (const id of Array.isArray(x.worn) ? x.worn : []) { const n = OLD_CLOTH[id]; if (n) { own.add(n); wr[OLD_CLOTH_SLOT[n]] = n; } }
      s.own = [...own]; s.wr = wr;
      migrateOld(s);
      return s;
    }
    s.iv = {};
    if (x.iv && typeof x.iv === 'object') for (const [k, v] of Object.entries(x.iv)) if ((FOOD[k] || MED[k] || (k.startsWith('z_') && SEED[k.slice(2)]) || /^i_[a-z]{2,16}$/.test(k)) && int(v) > 0) s.iv[k] = Math.min(999, int(v));
    s.own = idList(x.own, 300);
    s.wr = {};
    if (x.wr && typeof x.wr === 'object') for (const k of SLOTS) if (typeof x.wr[k] === 'string' && RID.test(x.wr[k])) s.wr[k] = x.wr[k];
    if (ver === 2) migrateOld(s);
    else {
      s.fp = {};
      if (x.fp && typeof x.fp === 'object') for (const r of ROOMS) {
        const a = Array.isArray(x.fp[r.id]) ? x.fp[r.id] : [];
        s.fp[r.id] = Array.from({ length: 6 }, (_, i) => (typeof a[i] === 'string' && RID.test(a[i]) ? a[i] : 0));
      }
      s.mg = int(x.mg);
    }
    s.gd = Array.from({ length: 6 }, (_, i) => { const p = Array.isArray(x.gd) ? x.gd[i] : 0; return Array.isArray(p) && SEED[p[0]] ? [p[0], num(p[1], now), num(p[2], 0)] : 0; });
    s.sk = int(x.sk); s.sd = typeof x.sd === 'string' ? x.sd : ''; s.qd = typeof x.qd === 'string' ? x.qd : '';
    s.ql = (Array.isArray(x.ql) ? x.ql : []).filter((q) => q && QUEST_BY[q.i]).slice(0, 3).map((q) => ({ i: q.i, t: Math.max(1, int(q.t, 1)), p: int(q.p), d: q.d ? 1 : 0, r: int(q.r) }));
    const known = new Set(ACH.map((a) => a.id));
    s.ach = (Array.isArray(x.ach) ? x.ach : []).filter((i) => known.has(i));
    s.st = {};
    if (x.st && typeof x.st === 'object') for (const [k, v] of Object.entries(x.st)) if (/^[a-z]{2,8}$/.test(k)) s.st[k] = int(v);
    s.hs = {};
    if (x.hs && typeof x.hs === 'object') for (const [k, v] of Object.entries(x.hs)) if (/^[a-z0-9-]{1,30}$/.test(k)) s.hs[k] = int(v);
    s.gc = x.gc && typeof x.gc.d === 'string' ? { d: x.gc.d, n: int(x.gc.n) } : { d: '', n: 0 };
    s.rc = idList(x.rc, 80);
    s.rm = ROOM[x.rm] ? x.rm : 'woon';
    s.lvl = Math.max(1, Math.min(int(x.lvl, 1), levelOf(s.xp).lv));
    // huizen, extra's (wandelen, koken: kleine gegevens van de modules, totaal max 3000 tekens) en gerechten
    s.hu = ver === 3 ? idList(x.hu, 12) : [];
    if (!s.hu.includes('huisje')) s.hu.unshift('huisje');
    s.hc = ver === 3 && typeof x.hc === 'string' && s.hu.includes(x.hc) ? x.hc : 'huisje';
    s.x = {};
    if (x.x && typeof x.x === 'object' && !Array.isArray(x.x)) {
      for (const [k, v] of Object.entries(x.x)) if (/^[a-z]{2,10}$/.test(k) && v && typeof v === 'object') s.x[k] = v;
      if (JSON.stringify(s.x).length > X_MAX) s.x = {};
    }
    s.dh = (Array.isArray(x.dh) ? x.dh : []).filter((d) => d && typeof d.r === 'string' && RID.test(d.r)).slice(-30).map((d) => ({ r: d.r, s: clampInt(d.s, 1, 3), q: clampInt(d.q, 0, 100) }));
    return s;
  } catch { return null; }
}

// Compacte JSON-string (max 18000 tekens)
export function packState(s) {
  const o = { ...s };
  const empty = (v) => v === 0 || v === '' || (Array.isArray(v) && !v.length) || (v && typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length);
  for (const k of ['mix', 'ill', 'lw', 'nap', 'aw', 'iv', 'own', 'wr', 'fp', 'ql', 'ach', 'st', 'hs', 'rc', 'sk', 'sd', 'qd', 'grump', 'x', 'dh', 'mg']) if (empty(o[k])) delete o[k];
  const r = (v) => (typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 10) / 10 : v);
  for (const k of NEEDS) o[k] = r(o[k]);
  let str = JSON.stringify(o);
  for (const k of ['st', 'hs', 'rc', 'dh', 'x']) { if (str.length <= MAX_DATA) break; delete o[k]; str = JSON.stringify(o); }
  return str.slice(0, MAX_DATA);
}

// Voor de badge op het homescherm: heeft het huisdier aandacht nodig?
export function needsAttention(dataString, nowMs = Date.now()) {
  try {
    const p = parseState(dataString);
    if (!p) return false;
    if (hatchDue(p, nowMs)) return true;
    if (!p.h) return false;
    const s = applyTime(p, nowMs);
    if (s.ill) return true;
    if (sleepingNow(s, nowMs)) return false;
    return NEEDS.some((k) => s[k] < 25);
  } catch { return false; }
}


/* =====================================================================
   3. EMOJI-MIXEN (officiële Emoji Kitchen-plaatjes, zie emoji.js)
   ===================================================================== */
let MIX = null, mixPromise = null;
const mixUrlFor = (date, l, r) => { const u = (x) => 'u' + x.split('-').join('-u'); return `https://www.gstatic.com/android/keyboard/emojikitchen/${date}/${u(l)}/${u(l)}_${u(r)}.png`; };
function loadMix() {
  if (MIX) return Promise.resolve(MIX);
  if (!mixPromise) {
    mixPromise = fetch('./emoji-data.json').then((r) => r.json()).then((data) => {
      const code = new Map();
      for (const items of Object.values(data.sets)) for (const [e, , cd] of items) if (MIXLIST.includes(e)) code.set(e, cd);
      const mix = new Map();
      for (let i = 0; i < data.flat.length; i += 3) mix.set(`${data.codes[data.flat[i]]}|${data.codes[data.flat[i + 1]]}`, data.dates[data.flat[i + 2]]);
      MIX = {
        official(x, y) {
          const a = code.get(x), b = code.get(y); if (!a || !b) return null;
          if (mix.has(`${a}|${b}`)) return mixUrlFor(mix.get(`${a}|${b}`), a, b);
          if (mix.has(`${b}|${a}`)) return mixUrlFor(mix.get(`${b}|${a}`), b, a);
          return null;
        },
      };
      return MIX;
    }).catch(() => { mixPromise = null; return null; });
  }
  return mixPromise;
}
const mixUrl = (a, b) => (MIX ? MIX.official(a, b) : null);

/* =====================================================================
   4. STIJL
   ===================================================================== */
const CSS = `
.hd-root{position:relative;padding-bottom:30px}
.hd-top{display:flex;align-items:center;gap:8px;margin-bottom:8px}.hd-top .hd-who{flex:1;min-width:0}.hd-top b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hd-xp{height:6px;border-radius:4px;background:var(--line);overflow:hidden;margin-top:3px}.hd-xp i{display:block;height:100%;background:var(--accent);border-radius:4px;transition:width .6s}
.hd-nav{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;scrollbar-width:none}.hd-nav::-webkit-scrollbar{display:none}
.hd-nav button,.hd-roombar button{flex:0 0 auto;padding:8px 12px;white-space:nowrap;position:relative}
.hd-roombar{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;scrollbar-width:none}.hd-roombar::-webkit-scrollbar{display:none}
.hd-dot{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:9px;background:#f58a9e;color:#fff;font-size:11px;line-height:18px;text-align:center;padding:0 4px}
.hd-banner{background:linear-gradient(90deg,#ffe9a8,#ffd1e0);color:#6b4a00;border-radius:14px;padding:8px 12px;margin-bottom:8px;font-size:14px;text-align:center}
.hd-stage{position:relative;width:100%;aspect-ratio:6/5;border-radius:20px;border:1px solid var(--line);overflow:hidden;margin-bottom:8px;user-select:none;-webkit-user-select:none}
.hd-roomsvg{position:absolute;inset:0}.hd-roomsvg svg{display:block;width:100%;height:100%}
.hd-spot{position:absolute;transform:translate(-50%,-100%);width:15%;aspect-ratio:1/1;padding:2px;box-sizing:border-box;border:2px dashed rgba(90,70,120,.55);border-radius:12px;background:rgba(255,255,255,.45);font-size:24px;line-height:1;display:flex;align-items:center;justify-content:center;color:rgba(90,70,120,.85);z-index:3}
.hd-spot svg{width:100%;height:100%;display:block}
.hd-walk{--pw:38%;position:absolute;width:var(--pw);aspect-ratio:1/1;left:calc(50% - var(--pw) / 2);top:calc(var(--fy,78) * 1%);margin-top:calc(var(--pw) * -0.925);animation:hd-walk 26s ease-in-out infinite;z-index:2;cursor:pointer}
.hd-walk.hd-still{animation:none}
.hd-flip{width:100%;height:100%;animation:hd-flip 26s steps(1) infinite}
.hd-walk.hd-still .hd-flip{animation:none}
.hd-pet{position:relative;width:100%;height:100%}
.hd-pet>svg{display:block;width:100%;height:100%;overflow:visible}
.hd-hug .pet-body{animation:hd-hop .5s ease-in-out 4!important}
.hd-sc{position:absolute;inset:0;transform:scale(var(--sc,1));transform-origin:50% 100%}
.hd-em{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:80px;line-height:1}
.hd-mixwrap{position:absolute;inset:0;transform-origin:50% 100%}
.hd-mixi{position:absolute;left:4%;top:4%;width:92%;height:92%;object-fit:contain;pointer-events:none}
.hd-mixfb{position:relative;display:block;width:100%;height:100%;font-size:60px;line-height:1}
.hd-mixfb span:first-child{position:absolute;left:0;top:20%}.hd-mixfb span:last-child{position:absolute;right:0;top:34%;font-size:52px;opacity:.92}
.hd-ov{position:absolute;pointer-events:none;transform:translateY(-50%)}.hd-ov svg{display:block;width:100%;height:auto}
.hd-mood{position:absolute;top:-2%;left:-2%;font-size:22px;animation:hd-float 2.4s ease-in-out infinite;pointer-events:none}
.hd-m-slaap .hd-mood{left:auto;right:-2%}
.hd-egg .hd-eggfb{display:block;width:100%;text-align:center;font-size:80px;line-height:1.3;animation:hd-eggwob 2.8s ease-in-out infinite;transform-origin:50% 90%}
.pet-idle .pet-body{animation:pet-breath 4.2s ease-in-out infinite}
.pet-idle .pet-tail{animation:pet-wag 2.2s ease-in-out infinite}
.pet-idle .pet-ears{animation:pet-ear 5.5s ease-in-out infinite}
.pet-idle .pet-wings{animation:pet-flap 3s ease-in-out infinite}
.pet-idle.hd-m-blijblij .pet-body{animation:hd-hop 1.2s ease-in-out infinite}
.pet-idle.hd-m-slaap .pet-body{animation:pet-sleep 4.5s ease-in-out infinite}
.pet-idle.hd-m-slaap .pet-tail,.pet-idle.hd-m-slaap .pet-ears,.pet-idle.hd-m-ziek .pet-tail,.pet-idle.hd-m-verdrietig .pet-tail{animation:none}
.pet-idle.hd-m-boos .pet-body{animation:hd-grump .5s ease-in-out 6}
.hd-mini{width:72px;height:72px;flex:none;position:relative}
.hd-it{position:absolute;left:50%;line-height:1;pointer-events:none;transform:translateX(-50%);white-space:nowrap}
.hd-bubble{position:absolute;top:8px;left:50%;transform:translateX(-50%);background:#fff;color:#444;border-radius:14px;padding:6px 12px;font-size:14px;max-width:84%;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.12);z-index:5;transition:opacity .4s}
.hd-bubble:after{content:"";position:absolute;bottom:-6px;left:50%;margin-left:-6px;border:6px solid transparent;border-bottom:0;border-top-color:#fff}
.hd-night{position:absolute;inset:0;z-index:4;pointer-events:none;display:flex;justify-content:flex-end;padding:10px 16px;font-size:26px}
.hd-night span{animation:hd-float 3s ease-in-out infinite;opacity:.9}
.hd-fx{position:absolute;inset:0;pointer-events:none;z-index:6;overflow:hidden}
.hd-fxi{position:absolute;bottom:30%;font-size:28px;animation:hd-up 1.4s ease-out forwards}
.hd-bars{margin:8px 0}.hd-bar{display:flex;align-items:center;gap:8px;margin:5px 0}.hd-bar span:first-child{width:92px;font-size:14px}
.hd-bar i{flex:1;height:10px;border-radius:6px;background:var(--line);overflow:hidden;display:block}.hd-bar b{display:block;height:100%;background:var(--accent);border-radius:6px;transition:width .6s}
.hd-bar b.low{background:#f2a65a}
.hd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(98px,1fr));gap:8px}
.hd-grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.hd-grid3{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.hd-card{border:1px solid var(--line);background:var(--card);border-radius:14px;padding:8px;text-align:center;font-size:13px}
.hd-card .em{font-size:32px;line-height:1.2}.hd-card button{width:100%;margin-top:6px;padding:6px 4px}
.hd-card .th{display:flex;align-items:center;justify-content:center;height:68px;margin-bottom:2px}.hd-card .th svg{display:block;width:64px;height:64px;max-width:100%}
.hd-card .thw{margin-bottom:4px}.hd-card .thw svg{display:block;width:100%;height:auto;border-radius:12px}
.hd-card.off{opacity:.45;filter:grayscale(.7)}
.hd-card.on{outline:2px solid var(--accent)}
.hd-prev{display:flex;align-items:center;gap:12px;margin:6px 0 10px}.hd-prev .pv{width:120px;height:120px;flex:none;background:linear-gradient(180deg,#f4edff,#fde9f1);border-radius:18px;padding:4px;box-sizing:border-box}
.hd-acts{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}.hd-acts button{flex:1 1 40%;padding:11px 6px}
.hd-types{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:8px 0}.hd-types button{font-size:26px;padding:4px 0;display:flex;align-items:center;justify-content:center;height:52px}.hd-types button svg{width:44px;height:44px;display:block}.hd-types button.pri{outline:2px solid var(--accent)}
.hd-sw{display:inline-block;width:20px;height:20px;border-radius:50%;border:2px solid rgba(0,0,0,.25);vertical-align:middle}
.hd-plots{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.hd-plot{border-radius:14px;background:#d9c19a;border:2px solid #bda47c;padding:6px;text-align:center;min-height:104px;font-size:12px;color:#4d3b1e}
.hd-plot .em{font-size:34px;line-height:1.2}.hd-plot button{width:100%;padding:5px 2px;margin-top:4px;font-size:12px}
.hd-plot i{display:block;height:6px;border-radius:4px;background:rgba(0,0,0,.15);overflow:hidden;margin-top:4px}.hd-plot i b{display:block;height:100%;background:#58b368}
.hd-modal{position:fixed;inset:0;background:rgba(40,30,60,.45);z-index:50;display:flex;align-items:center;justify-content:center;padding:16px}
.hd-modal>div{background:var(--card);color:var(--ink);border-radius:20px;padding:16px;max-width:420px;width:100%;max-height:82vh;overflow:auto;box-shadow:0 8px 30px rgba(0,0,0,.25);text-align:center}
.hd-modal .hd-pet{width:140px;height:140px;margin:0 auto}
.hd-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#4b3f6b;color:#fff;border-radius:16px;padding:9px 16px;font-size:14px;z-index:60;max-width:88%;text-align:center;animation:hd-pop .25s ease-out;box-shadow:0 4px 16px rgba(0,0,0,.25)}
.hd-gamehost{margin:0 auto;border-radius:16px;overflow:hidden;background:#111;position:relative;touch-action:none}
.hd-exhost{margin:0 auto;border-radius:16px;overflow:hidden;background:var(--card);border:1px solid var(--line);position:relative}
.hd-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)}.hd-row:last-child{border:0}.hd-row .grow{flex:1;min-width:0}
.hd-ach{opacity:.4;filter:grayscale(1)}.hd-ach.got{opacity:1;filter:none}
.hd-sub{display:flex;gap:6px;margin:6px 0;flex-wrap:wrap}.hd-sub button{flex:1;padding:8px 4px;min-width:70px}
.hd-conf span{position:absolute;font-size:24px;animation:hd-up 2.2s ease-out forwards}
input.hd-in,select.hd-in{width:100%;box-sizing:border-box}
input[type=range].hd-in{padding:0}
@keyframes hd-walk{0%{transform:translateX(-70%)}45%{transform:translateX(70%)}50%{transform:translateX(70%)}95%{transform:translateX(-70%)}100%{transform:translateX(-70%)}}
@keyframes hd-flip{0%{transform:scaleX(1)}50%{transform:scaleX(-1)}100%{transform:scaleX(1)}}
@keyframes pet-breath{0%,100%{transform:scale(1,1)}50%{transform:scale(1.018,.982)}}
@keyframes pet-sleep{0%,100%{transform:scale(1)}50%{transform:scale(1.03,.98)}}
@keyframes pet-wag{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(7deg)}}
@keyframes pet-ear{0%,86%,100%{transform:rotate(0)}91%{transform:rotate(-3deg)}96%{transform:rotate(2deg)}}
@keyframes pet-flap{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.93)}}
@keyframes hd-hop{0%,100%{transform:translateY(0)}50%{transform:translateY(-6%)}}
@keyframes hd-grump{0%,100%{transform:translateX(0)}25%{transform:translateX(-3%)}75%{transform:translateX(3%)}}
@keyframes hd-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes hd-up{from{transform:translateY(0) scale(.6);opacity:1}to{transform:translateY(-110px) scale(1.2);opacity:0}}
@keyframes hd-pop{from{transform:translateX(-50%) scale(.7);opacity:0}to{transform:translateX(-50%) scale(1);opacity:1}}
@keyframes hd-eggwob{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
@media (prefers-reduced-motion:reduce){.hd-walk,.hd-flip,.hd-mood,.hd-eggfb,.pet-idle .pet-body,.pet-idle .pet-tail,.pet-idle .pet-ears,.pet-idle .pet-wings{animation:none!important}}
`;

/* =====================================================================
   5. WEERGAVE VAN HET HUISDIER
   Getekend met petSVG (huisdier-art-pets.js). Zonder die module: emoji. Het Mix-huisdier blijft het Emoji-Kitchen-plaatje.
   ===================================================================== */
let ART = null;      // { petSVG, eggSVG, accessorySVG, ACCESSORIES, MOODS } zodra huisdier-art-pets.js geladen is
const ACC = {};      // accessoire-id -> { id, name, price, minLevel, slot }
function setArt(m) {
  ART = m;
  if (m && m.ACCESSORIES) for (const sl of ART_SLOTS) for (const a of m.ACCESSORIES[sl] || []) ACC[a.id] = { ...a, slot: sl };
}
const MIX_CLOTHES = true; // kleding als overlay op het Emoji-Kitchen-plaatje (zet op false als het niet mooi staat)
const MIX_ANCHOR = { // middelpunt (% van het plaatje) en breedte van de overlay
  h: { cy: 9, w: 46 }, f: { cy: 38, w: 38 }, n: { cy: 62, w: 42 }, b: { cy: 78, w: 56 },
};
const ART_MOOD = { blijblij: 'blijblij', blij: 'blij', hongerig: 'hongerig', moe: 'moe', vies: 'vies', verdrietig: 'verdrietig', slaap: 'slaap', ziek: 'ziek', boos: 'neutraal', liefde: 'liefde', neutraal: 'neutraal' };
const artMood = (m) => ART_MOOD[m] || (ART && ART.MOODS && ART.MOODS.includes(m) ? m : 'blij');
const outfitOf = (s) => ({ hat: s.wr && s.wr.h, glasses: s.wr && s.wr.f, neck: s.wr && s.wr.n, body: s.wr && s.wr.b });
const mixFallback = (a, b) => `<span class="hd-mixfb"><span>${a}</span><span>${b}</span></span>`;

function mixOverlay(s) {
  if (!ART || !MIX_CLOTHES || !s.wr) return '';
  return ['b', 'n', 'f', 'h'].map((k) => {
    const id = s.wr[k], a = id && ACC[id], an = MIX_ANCHOR[k];
    if (!a || a.slot !== KS[k]) return '';
    let svg = ''; try { svg = ART.accessorySVG(a.slot, id, 100); } catch { return ''; }
    return `<span class="hd-ov" style="left:${(100 - an.w) / 2}%;top:${an.cy}%;width:${an.w}%">${svg}</span>`;
  }).join('');
}

// binnenkant van het huisdier-vlak (vierkant): SVG, mix-plaatje of emoji
function avatarHTML(s, stage, mood, o = {}) {
  if (s.type === 'mix' && s.mix) {
    const u = mixUrl(s.mix[0], s.mix[1]);
    const img = u ? `<img class="hd-mixi" src="${u}" data-a="${s.mix[0]}" data-b="${s.mix[1]}" crossorigin="anonymous" alt="" draggable="false">` : mixFallback(s.mix[0], s.mix[1]);
    return `<div class="hd-mixwrap" style="transform:scale(${(STAGES[stage] || STAGES.volwassen).sc})">${img}${mixOverlay(s)}</div>`;
  }
  if (ART) {
    try { return ART.petSVG(SPECIES_ID(s.type), { palette: s.hue || 0, stage, mood: artMood(o.love ? 'liefde' : mood), outfit: outfitOf(s), size: o.size || 200 }); } catch (e) { console.error(e); }
  }
  return `<div class="hd-sc" style="--sc:${(STAGES[stage] || STAGES.volwassen).sc}"><span class="hd-em">${TYPES[s.type] || '🐱'}</span></div>`;
}
const eggHTML = (p) => {
  if (ART) { try { return ART.eggSVG(200, Math.max(0, Math.min(1, p))); } catch (e) { console.error(e); } }
  return '<span class="hd-eggfb">🥚</span>';
};

// Het huisdier (met kleding) als HTML. o: { mood, cls, love, hatching }
function petHTML(s, now, o = {}) {
  const stage = stageOf(s, now);
  if (stage === 'ei') return `<div class="hd-pet hd-egg ${o.cls || ''}">${eggHTML(o.hatching ? 1 : (now - s.born) / EGG_MS)}</div>`;
  const mood = o.mood || moodNow(s, now);
  return `<div class="hd-pet pet-idle hd-m-${mood} ${o.cls || ''}">${avatarHTML(s, stage, mood, o)}<span class="hd-mood">${MOOD_EMO[mood] || ''}</span></div>`;
}
// Los plaatje zonder stemmingsicoon (voor spelletjes, extra's, modal)
function plainPetHTML(s, now, size, mood) {
  const stage = stageOf(s, now) === 'ei' ? 'volwassen' : stageOf(s, now);
  return `<span class="pet-idle hd-m-${mood || 'blij'}" style="display:inline-block;position:relative;width:${size}px;height:${size}px;line-height:0;vertical-align:top">${avatarHTML(s, stage, mood || 'blij', { size })}</span>`;
}

// Zinnen: eigen karakter + algemeen
function phraseFor(s, mood) {
  const own = PERS[s.pe] && PERS[s.pe].say[mood] ? PERS[s.pe].say[mood].split('|') : [];
  const all = [...own, ...(SAY[mood] || SAY.blij)];
  return all[Math.floor(Math.random() * all.length)];
}

const fmtTime = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s >= 3600) return `${Math.floor(s / 3600)}u ${pad2(Math.floor((s % 3600) / 60))}m`;
  return `${Math.floor(s / 60)}:${pad2(s % 60)}`;
};
const fmtAway = (ms) => {
  const m = Math.round(ms / MIN);
  if (m < 60) return `${m} minuten`;
  const h = Math.round(ms / H * 10) / 10;
  return h >= 48 ? `${Math.round(h / 24)} dagen` : `${h} uur`.replace('.', ',');
};


/* =====================================================================
   6. DE VIEW
   ===================================================================== */
export async function huisdierView(ctx) {
  const { db, me, esc, view, addCleanup } = ctx;
  const ref = doc(db, 'pets', me.uid);
  const lsKey = `huisdier:${me.uid}`;
  const timers = new Set();
  let alive = true;
  let S = null; // de staat van het huisdier (altijd een kopie van parseState/newPet/applyTime)
  let tab = 'home', sub = '', edit = false, shopTab = 'eten', ftab = 'vrienden', rankBy = 'age', room = 'woon';
  let gm = null, gmErr = '', soc = null, socErr = '', ev = null, away = null, loadErr = '';
  let ar = null, snd = null, ex = null, kk = null, extraErr = '', kookErr = '';   // optionele modules
  let saveT = null, dirty = false, lastDecay = Date.now(), wasSleep = false, wasNight = false, hatching = false, lastEv = 0, lastHelp = 0;
  let sayText = '', sayUntil = 0, phrase = '', phraseAt = 0, phraseMood = '', petKey = '', checking = false, loveUntil = 0;
  let toastQ = [], toastBusy = false, game = null;
  let ad = { type: 'kat', a: '🐱', b: '🐼', slot: 'a', hue: 0, name: '' };
  let cookSel = [], plantFor = -1, vet = null, visit = null, visitRoom = 'woon';
  let shopRoom = 'woon', clothSlot = 'hat', prevAcc = '';
  let extraOpen = '', extraInst = null, cookInst = null;
  let myPerms = null, helpLines = [], migNote = 0;
  const permCache = {};
  const cache = { pets: null, petsErr: '', inbox: null, inboxErr: '', admin: null, adminErr: '' };
  const gates = {};
  const visited = new Set();
  const FURN_A = {}, HOUSE_A = {};   // meubel- en huis-info uit huisdier-art-rooms.js
  let pref = { on: true, vol: 0.8 };
  try {
    const v = localStorage.getItem('huisdier:snd');
    if (v && v[0] === '{') { const o = JSON.parse(v); pref = { on: !(o.on === 0 || o.on === false), vol: Math.max(0, Math.min(1, Number(o.vol) >= 0 ? Number(o.vol) : 0.8)) }; } else pref.on = v !== '0';
  } catch { /* standaard */ }

  if (!document.getElementById('hd2-css')) { const st = document.createElement('style'); st.id = 'hd2-css'; st.textContent = CSS; document.head.appendChild(st); }

  /* ---------- kleine helpers ---------- */
  const $ = (sel) => view.querySelector(sel);
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms); timers.add(t); return t; };
  const every = (fn, ms) => { const t = setInterval(() => { if (alive) fn(); }, ms); timers.add(t); return t; };
  const gate = (k, ms = 500) => { const n = Date.now(); if (n < (gates[k] || 0)) return false; gates[k] = n + ms; return true; };
  const mult = () => (ev && ev.until > Date.now() ? Number(ev.mult) || 1 : 1);
  const cp = (n, lim = 100) => Math.max(0, Math.min(lim, n));
  const stock = (id) => (S.iv && S.iv[id]) || 0;
  const addStock = (id, n) => { S.iv = S.iv || {}; const v = Math.max(0, stock(id) + n); if (v) S.iv[id] = v; else delete S.iv[id]; };
  const level = () => levelOf(S.xp).lv;

  /* ---------- opslag ---------- */
  const pack = () => ({ data: packState(S), updated: Date.now() });
  function saveLocal() { try { if (S) localStorage.setItem(lsKey, JSON.stringify(pack())); } catch { /* vol of geweigerd */ } }
  async function flush() {
    if (saveT) { clearTimeout(saveT); saveT = null; }
    if (!dirty || !S) return;
    dirty = false;
    const p = pack();
    try { localStorage.setItem(lsKey, JSON.stringify(p)); } catch { /* ok */ }
    try { await setDoc(ref, p); } catch (e) { console.error(e); dirty = true; }
  }
  function changed() { dirty = true; if (S) saveLocal(); if (saveT) clearTimeout(saveT); saveT = setTimeout(flush, 2000); }
  const onPageHide = () => { flush(); };

  async function load() {
    let loc = null, rem = null, remEmpty = false;
    try { const l = JSON.parse(localStorage.getItem(lsKey) || 'null'); if (l && l.data) { const s = parseState(l.data); if (s) loc = { u: num(l.updated, 0), s }; } } catch { /* leeg */ }
    try {
      const sn = await getDoc(ref);
      if (sn.exists()) { const d = sn.data() || {}; remEmpty = !d.data; rem = { u: num(d.updated, 0), s: d.data ? parseState(d.data) : null }; }
    } catch (e) { console.error(e); loadErr = 'Kon de online opslag niet bereiken, ik gebruik wat op dit apparaat staat.'; }
    let best = [loc, rem].filter((x) => x && x.s).sort((a, b) => b.u - a.u)[0];
    if (rem && remEmpty && loc && rem.u >= loc.u) best = null; // opnieuw begonnen op een ander apparaat
    if (!best) return;
    const now = Date.now();
    const before = best.s;
    S = applyTime(before, now);
    if (before.h && now - before.last >= 10 * MIN) away = awaySummary(before, S, now);
    lastDecay = now;
    changed();
  }

  function awaySummary(a, b, now) {
    const deltas = NEEDS.map((k) => [k, Math.round(b[k] - a[k])]).filter(([, d]) => Math.abs(d) >= 3);
    const ready = (a.gd || []).filter((p) => p && growth({ s: p[0], t: p[1], w: p[2] }, now).ready).length;
    return { ms: now - a.last, deltas, ready, ill: !a.ill && !!b.ill, slept: nightSplit(Math.max(a.last, now - MAX_OFFLINE), now).asleep > 0.5 };
  }

  /* ---------- geluid (huisdier-sound.js) ---------- */
  // oude korte namen -> geluidsnamen van de module
  const SFX_MAP = { tap: 'tik', eat: 'eten', yay: 'klaar', buy: 'koop', water: 'drinken', pet: 'knuffel', bad: 'fout', crack: 'kraak', zzz: 'slaap' };
  function sfx(name, opts) {
    if (!snd) return;
    try { snd.play(SFX_MAP[name] || name, opts); } catch { /* geen geluid */ }
  }
  const speciesNow = () => (S && S.type !== 'mix' ? SPECIES_ID(S.type) : undefined);
  function voice() { sfx('stem', { species: speciesNow(), mood: artMood(S ? moodNow(S, Date.now()) : 'blij') }); }
  function savePref() { try { localStorage.setItem('huisdier:snd', JSON.stringify({ on: pref.on ? 1 : 0, vol: Math.round(pref.vol * 100) / 100 })); } catch { /* ok */ } }
  const loopsOn = new Set();
  function wantLoops() {
    const w = new Set();
    if (snd && alive && S && S.h && tab === 'home') {
      const now = Date.now();
      if (isNight(now) || (room === 'slaap' && now < S.nap)) w.add('wiegenlied');
      else if (room === 'tuin') w.add('tuin');
    }
    return w;
  }
  function syncLoops() {
    if (!snd) return;
    const w = wantLoops();
    for (const n of [...loopsOn]) if (!w.has(n)) { try { snd.stopLoop(n); } catch { /* ok */ } loopsOn.delete(n); }
    for (const n of w) if (!loopsOn.has(n)) { try { snd.startLoop(n); } catch { /* ok */ } loopsOn.add(n); }
  }
  function stopLoops() { for (const n of [...loopsOn]) { try { if (snd) snd.stopLoop(n); } catch { /* ok */ } } loopsOn.clear(); }
  const onFirstTap = () => { if (snd) { try { snd.unlock(); } catch { /* ok */ } } };
  view.addEventListener('pointerdown', onFirstTap, { capture: true });


  /* ---------- melding, tekstballon, effecten ---------- */
  function toast(msg) { toastQ.push(msg); if (!toastBusy) nextToast(); }
  function nextToast() {
    const root = $('.hd-root'); const msg = toastQ.shift();
    if (msg === undefined || !root) { toastBusy = false; toastQ = []; return; }
    toastBusy = true;
    let el = $('#hd-toast');
    if (!el) { el = document.createElement('div'); el.id = 'hd-toast'; el.className = 'hd-toast'; root.appendChild(el); }
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    el.textContent = msg; el.hidden = false;
    later(() => { const e = $('#hd-toast'); if (e) e.hidden = true; later(nextToast, 150); }, 2400);
  }
  function say(t, ms = 4000) { sayText = t; sayUntil = Date.now() + ms; const b = $('#hd-bub'); if (b) b.textContent = t; }
  function fx(emoji, n = 1) {
    const box = $('#hd-fx'); if (!box) return;
    for (let i = 0; i < n; i++) {
      const sp = document.createElement('span'); sp.className = 'hd-fxi'; sp.textContent = emoji;
      sp.style.left = `${38 + Math.random() * 24}%`; sp.style.animationDelay = `${i * 0.15}s`;
      box.appendChild(sp); later(() => sp.remove(), 1700 + i * 150);
    }
  }
  function modal(html) {
    let m = $('#hd-modal');
    if (!m) { m = document.createElement('div'); m.id = 'hd-modal'; m.className = 'hd-modal'; ($('.hd-root') || view).appendChild(m); }
    m.innerHTML = `<div>${html}</div>`; m.hidden = false;
  }
  const closeModal = () => { const m = $('#hd-modal'); if (m) { m.hidden = true; m.innerHTML = ''; } };
  const confetti = () => `<div class="hd-conf" style="position:relative;height:0">${Array.from({ length: 9 }, (_, i) => `<span style="left:${8 + i * 10}%;top:20px;animation-delay:${i * 0.12}s">${['🎉', '✨', '💛', '⭐', '🎈'][i % 5]}</span>`).join('')}</div>`;

  /* ---------- XP, munten, voortgang ---------- */
  function earn(n, opts = {}) {
    const v = Math.round(n * (opts.noMult ? 1 : mult()));
    S.coins += v; return v;
  }
  function unlocksAt(lv) {
    const all = [...Object.values(FURN_A).filter((i) => i.minLevel === lv).map((i) => '🛋️'), ...Object.values(ACC).filter((i) => i.minLevel === lv).map((i) => SLOT_EMO[i.slot]), ...Object.values(HOUSE_A).filter((i) => i.minLevel === lv).map(() => '🏠'),
      ...MEDS.filter((i) => i.lv === lv).map((i) => i.e), ...FOODS.filter((f) => f.p && f.lv === lv).map((i) => i.e)];
    SEEDS.filter((z) => z.lv === lv).forEach((z) => all.push(FOOD[z.id].e + '🌱'));
    return [...new Set(all)];
  }
  function addXp(n) {
    S.xp += Math.max(0, Math.round(n));
    const nl = levelOf(S.xp).lv; const ups = [];
    while (S.lvl < nl) { S.lvl++; const r = levelReward(S.lvl); S.coins += r; ups.push([S.lvl, r]); }
    if (ups.length) {
      sfx('level');
      const [lv, r] = ups[ups.length - 1];
      const un = ups.flatMap(([l]) => unlocksAt(l));
      modal(`${confetti()}<div style="font-size:48px">🌟</div><h3>Niveau ${lv}!</h3><p>${esc(S.name)} is gegroeid. Je krijgt <b>${ups.reduce((a, u) => a + u[1], 0)} 🪙</b>${ups.length > 1 ? ' (alle niveaus samen)' : ` (${r})`}.</p>${un.length ? `<p>Nieuw in de winkel: ${un.slice(0, 14).join(' ')}</p>` : ''}<button class="pri" data-do="close">Fijn!</button>`);
    }
    checkAch();
  }
  function bump(kind, n = 1) {
    S.st = S.st || {}; S.st[kind] = (S.st[kind] || 0) + n;
    for (const q of S.ql) if (QUEST_BY[q.i] && QUEST_BY[q.i].k === kind && !q.d) q.p = Math.min(q.t, (q.p || 0) + n);
    checkAch();
  }
  function achCtx() {
    const now = Date.now();
    const placed = Object.values(S.fp || {}).reduce((a, arr) => a + arr.filter(Boolean).length, 0);
    return { age: ageDays(S, now), lv: levelOf(S.xp).lv, placed, clothes: S.own.filter((i) => ACC[i]).length };
  }
  function checkAch() {
    if (checking || !S) return [];
    checking = true; const got = [];
    try {
      const x = achCtx();
      for (const a of ACH) if (!S.ach.includes(a.id) && a.t(S, x)) { S.ach.push(a.id); S.coins += 10; S.xp += 15; got.push(a); }
      for (const a of got) toast(`🏆 ${a.n}! +10 🪙`);
      if (got.length) sfx('prestatie');
    } finally { checking = false; }
    return got;
  }
  function ensureDaily() {
    const today = dayKey(Date.now());
    if (S.qd !== today) { S.qd = today; S.ql = questsFor(today, me.uid, [...(gm && gm.GAMES && gm.GAMES.length ? [] : ['game']), ...(ex ? [] : ['walk', 'checkin'])]); changed(); }
  }
  const spend = (n) => { S.coins -= n; S.st = S.st || {}; S.st.spent = (S.st.spent || 0) + n; };
  const hasReward = () => (S.sd !== dayKey(Date.now())) + S.ql.filter((q) => questProgress(q).done && !q.d).length;

  /* ---------- chrome: bovenbalk, navigatie, banner ---------- */
  function paintTop() {
    const t = $('#hd-top'); if (!t) return;
    if (!S) { t.innerHTML = ''; t.dataset.h = ''; return; }
    const L = levelOf(S.xp);
    const html = `<div class="hd-who"><b>${esc(S.name)} <small>· niveau ${L.lv}</small></b><div class="hd-xp"><i style="width:${Math.round(L.frac * 100)}%"></i></div></div><span class="chip">🪙 ${S.coins}</span><button data-do="snd" title="Geluid" aria-label="Geluid aan of uit">${pref.on ? '🔊' : '🔇'}</button>`;
    if (t.dataset.h !== html) { t.dataset.h = html; t.innerHTML = html; }
  }
  function paintNav() {
    const n = $('#hd-nav'); if (!n) return;
    if (!S) { n.innerHTML = ''; n.dataset.h = ''; return; }
    const inbox = cache.inbox ? cache.inbox.filter((g) => !g.claimed).length : 0;
    const tabs = [['home', '🏠 Thuis', 0], ['shop', '🛍️ Winkel', 0], ['games', '🎮 Spelletjes', 0], ['extra', '🌈 Extra', 0], ['goals', '🏆 Doelen', hasReward()], ['friends', '👥 Vrienden', inbox]];
    if (me.admin) tabs.push(['admin', '🛠️ Admin', 0]);
    tabs.push(['settings', '⚙️', 0]);
    const html = tabs.map(([k, l, cnt]) => `<button data-do="tab" data-v="${k}" class="${tab === k ? 'pri' : ''}">${l}${cnt ? `<span class="hd-dot">${cnt}</span>` : ''}</button>`).join('');
    if (n.dataset.h !== html) { n.dataset.h = html; n.innerHTML = html; }
  }
  function paintBanner() {
    const b = $('#hd-banner'); if (!b) return;
    if (ev && ev.until > Date.now()) b.innerHTML = `<div class="hd-banner">🎉 <b>${esc(ev.title)}</b>: munten ×${Number(ev.mult) || 1} tot ${new Date(ev.until).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}</div>`;
    else b.innerHTML = '';
  }
  const paintChrome = () => { paintTop(); paintNav(); paintBanner(); };

  function render() {
    if (!alive) return;
    const body = $('#hd-body'); if (!body) return;
    paintChrome();
    if (!S) return renderAdopt(body);
    if (tab === 'extra' && extraInst && extraOpen && $('#hd-xh')) { syncLoops(); return; } // een geopend onderdeel blijft staan
    ({ home: renderHome, shop: renderShop, games: renderGames, extra: renderExtra, goals: renderGoals, friends: renderFriends, admin: renderAdmin, settings: renderSettings }[tab] || renderHome)(body);
    syncLoops();
  }
  /* ---------- adopteren ---------- */
  const palName = (type, i) => { const sp = ART && ART.SPECIES && ART.SPECIES.find((x) => x.id === SPECIES_ID(type)); return sp && sp.palettes[i] ? sp.palettes[i].name : PAL_FALLBACK[i]; };
  const palColors = (type, i) => { const sp = ART && ART.SPECIES && ART.SPECIES.find((x) => x.id === SPECIES_ID(type)); const p = sp && sp.palettes[i]; return p ? [p.main, p.accent] : ['#ddd', '#bbb']; };
  const speciesThumb = (k) => { if (ART) { try { return ART.petSVG(SPECIES_ID(k), { palette: 0, stage: 'volwassen', mood: 'blij', size: 44 }); } catch { /* emoji */ } } return TYPES[k]; };
  function adoptPreview() {
    if (ad.type === 'mix') {
      const u = mixUrl(ad.a, ad.b);
      return u ? `<img class="hd-mixi" src="${u}" data-a="${ad.a}" data-b="${ad.b}" crossorigin="anonymous" alt="" style="left:0;top:0;width:100%;height:100%">` : mixFallback(ad.a, ad.b);
    }
    return avatarHTML({ type: ad.type, hue: ad.hue, wr: {} }, 'volwassen', 'blij');
  }
  function renderAdopt(body) {
    const mix = ad.type === 'mix';
    body.innerHTML = `<div class="box center"><h3>Kies je huisdier</h3>
      <p><small>Je begint met een ei. Na 2 minuten komt het uit!</small></p>
      <div class="hd-types">${Object.keys(TYPES).map((k) => `<button data-do="atype" data-v="${k}" class="${k === ad.type ? 'pri' : ''}" title="${TYPE_NL[k]}" aria-label="${TYPE_NL[k]}">${speciesThumb(k)}</button>`).join('')}<button data-do="atype" data-v="mix" class="${mix ? 'pri' : ''}" title="Mix-huisdier" aria-label="Mix-huisdier">🧬</button></div>
      <div style="display:flex;justify-content:center;margin:6px 0" id="hd-apv"><div class="hd-pet" style="width:150px;height:150px">${adoptPreview()}</div></div>
      <p><small>${TYPE_NL[ad.type]}${mix ? '' : ' · ' + esc(palName(ad.type, ad.hue))}</small></p>
      ${mix ? `<div><small>Kies twee dieren (eerst links, dan rechts):</small>
        <div class="row" style="justify-content:center;margin:6px 0"><button data-do="aslot" data-v="a" class="${ad.slot === 'a' ? 'pri' : ''}" style="font-size:26px">${ad.a}</button><span>＋</span><button data-do="aslot" data-v="b" class="${ad.slot === 'b' ? 'pri' : ''}" style="font-size:26px">${ad.b}</button></div>
        <div style="display:flex;flex-wrap:wrap;gap:2px;justify-content:center">${MIXLIST.map((e) => `<button data-do="apick" data-v="${e}" style="border:0;background:none;font-size:26px;padding:4px">${e}</button>`).join('')}</div>
        ${MIX && !mixUrl(ad.a, ad.b) ? '<p><small>Voor deze twee bestaat geen officieel plaatje; je krijgt ze naast elkaar.</small></p>' : ''}</div>`
    : `<div class="row wrap" style="justify-content:center"><small>Kleur:</small>${Array.from({ length: NPAL }, (_, i) => { const [m, a] = palColors(ad.type, i); return `<button data-do="ahue" data-v="${i}" class="${i === ad.hue ? 'pri' : ''}" style="padding:6px 8px" title="${esc(palName(ad.type, i))}" aria-label="${esc(palName(ad.type, i))}"><span class="hd-sw" style="background:linear-gradient(135deg,${m} 55%,${a} 55%)"></span></button>`; }).join('')}</div>`}
      <div class="row" style="margin-top:10px"><input id="hd-name" class="hd-in" data-in="aname" maxlength="16" placeholder="Hoe heet hij of zij?" value="${esc(ad.name)}" style="flex:1"><button class="pri" data-do="adopt">Adopteren 💛</button></div>
      ${loadErr ? `<p class="err">${esc(loadErr)}</p>` : ''}</div>`;
    if (mix && !MIX) loadMix().then((m) => { if (m && alive && !S && tab) { const k = ad.type; if (k === 'mix') renderAdopt($('#hd-body')); } });
  }


  const sleepingNowS = () => !!S && sleepingNow(S, Date.now());
  const fyOf = (roomId) => (ar && ar.FLOOR_Y && ar.FLOOR_Y[ROOM[roomId].a]) || 78;
  const nightOf = (s, now) => isNight(now) || sleepingNow(s, now);   // 's nachts of tijdens het slapen is de kamer donker
  const fpOf = (r) => { S.fp = S.fp || {}; if (!Array.isArray(S.fp[r])) S.fp[r] = [0, 0, 0, 0, 0, 0]; return S.fp[r]; };
  function roomSvg(houseId, roomId, furn, night) {
    if (!ar) return '';
    try { return ar.roomSVG(houseId, ROOM[roomId].a, { night, furniture: furn, width: '100%', height: '100%' }); } catch (e) { console.error(e); return ''; }
  }
  // inrichten: een knop op elke plek van de kamer
  function spotsHTML(s, roomId, editMode) {
    if (!editMode || !ar || !ar.SLOT_POS) return '';
    const arr = (s.fp && s.fp[roomId]) || [];
    const pos = ar.SLOT_POS[ROOM[roomId].a] || [];
    return pos.map((p, i) => `<button class="hd-spot" style="left:${p.x}%;top:${p.y}%" data-do="spot" data-i="${i}" aria-label="Plek ${i + 1}">${arr[i] && FURN_A[arr[i]] ? furnSvg(arr[i], 44) : '＋'}</button>`).join('');
  }
  function furnSvg(id, size) { if (!ar) return ''; try { return ar.furnitureSVG(id, size); } catch (e) { console.error(e); return ''; } }
  function accSvg(slot, id, size) { if (!ART) return ''; try { return ART.accessorySVG(slot, id, size); } catch (e) { console.error(e); return ''; } }
  function bar(k, label, v) { return `<div class="hd-bar"><span>${label}</span><i><b data-bar="${k}" style="width:${Math.round(v)}%"></b></i></div>`; }

  function awayBoxHTML() {
    if (!away && !helpLines.length && !migNote) return '';
    const parts = [];
    if (away) {
      parts.push(`${away.deltas.map(([k, d]) => `${NEED_LABEL[k].slice(0, 2)} ${d > 0 ? '+' : '−'}${Math.abs(d)}`).join(' · ') || 'Alles bleef rustig.'}${away.slept ? '<br>😴 Er is lekker geslapen.' : ''}${away.ready ? `<br>🌱 ${away.ready} gewas${away.ready > 1 ? 'sen zijn' : ' is'} klaar in de tuin.` : ''}${away.ill ? '<br>🤒 Er is wat ziekte; medicijn helpt.' : ''}`);
    }
    for (const l of helpLines) parts.push(esc(l));
    if (migNote) parts.push(`🛋️ Nieuw: getekende huisdieren, meubels en kleding! Je oude spullen hebben een nieuwe plek gekregen${migNote > 1 ? `; je kreeg ${migNote} 🪙 terug voor oude meubels` : ''}.`);
    return `<div class="box" style="background:linear-gradient(135deg,#fff3d6,#ffe3ee);color:#5b4636"><b>🌙 Terwijl je weg was</b>${away ? ` <small>(${fmtAway(away.ms)})</small>` : ''}
      <div style="margin:4px 0;font-size:14px">${parts.join('<br>')}</div>
      <button data-do="awayok" style="padding:5px 12px">Ok, bedankt</button></div>`;
  }

  function renderHome(body) {
    destroyCook(); if (sub === 'koken') sub = '';
    if (!S.h) return renderEgg(body);
    const R = ROOM[room] || ROOMS[0];
    const now = Date.now();
    const sl = sleepingNowS();
    body.innerHTML = `<div class="hd-roombar">${ROOMS.map((r) => `<button data-do="room" data-v="${r.id}" class="${r.id === room ? 'pri' : ''}">${r.e} ${r.n}</button>`).join('')}</div>${awayBoxHTML()}
      <div class="hd-stage" id="hd-stage" style="background:${R.bg}">
        <div class="hd-roomsvg" id="hd-room">${roomSvg(S.hc, room, fpOf(room), nightOf(S, now))}</div>
        ${spotsHTML(S, room, edit)}
        <div class="hd-bubble" id="hd-bub"></div>
        <div class="hd-walk" id="hd-walk" style="--fy:${fyOf(room)}" data-do="petvoice"><div class="hd-flip" id="hd-pet"></div></div>
        ${sl ? '<div class="hd-night" id="hd-night"><span>💤</span></div>' : ''}
        <div class="hd-fx" id="hd-fx"></div>
      </div>
      <div class="center"><b>${esc(S.name)}</b> <small>· ${stageName()} · ${PERS[S.pe].e} ${PERS[S.pe].n} · <span id="hd-mn"></span></small></div>
      <div class="hd-bars" id="hd-bars">${NEEDS.map((k) => bar(k, NEED_LABEL[k], S[k])).join('')}${bar('bond', '💞 Band', S.bond)}</div>
      <div id="hd-panel"></div>`;
    petKey = '';
    paintPet(true); paintLive(); renderPanel();
  }
  const stageName = () => STAGES[stageOf(S, Date.now())].n;

  function renderEgg(body) {
    const now = Date.now();
    body.innerHTML = `<div class="hd-stage" id="hd-stage" style="background:${ROOMS[0].bg}">
        <div class="hd-roomsvg" id="hd-room">${roomSvg(S.hc, 'woon', fpOf('woon'), nightOf(S, now))}</div>
        <div class="hd-bubble" id="hd-bub"></div>
        <div class="hd-walk hd-still" id="hd-walk" style="--fy:${fyOf('woon')}" data-do="eggtap"><div class="hd-flip" id="hd-pet"></div></div>
        <div class="hd-fx" id="hd-fx"></div></div>
      <div class="box center"><b>${esc(S.name)}</b> <small>is nog in het ei</small>
        <p id="hd-eggt" style="font-size:20px;margin:6px 0"></p>
        <small>Houd het ei warm: kom straks terug. Je mag er zachtjes op tikken.</small></div>
      <div id="hd-panel"></div>`;
    petKey = ''; paintPet(true); paintLive();
  }

  // Alleen het huisdier-element bijwerken als er iets verandert (animaties blijven soepel)
  function paintPet(force) {
    const el = $('#hd-pet'); if (!el || !S) return;
    const now = Date.now(); const mood = moodNow(S, now); const stage = stageOf(S, now);
    const love = now < loveUntil && mood !== 'slaap' && mood !== 'ziek';
    const key = [S.type, S.mix && S.mix.join(''), S.hue, stage, mood, SLOTS.map((k) => (S.wr && S.wr[k]) || '').join(','), !!MIX, !!ART, love, hatching, stage === 'ei' ? Math.floor(Math.max(0, Math.min(1, (now - S.born) / EGG_MS)) * 10) : ''].join('|');
    if (force || key !== petKey) { petKey = key; el.innerHTML = petHTML(S, now, { mood, love, hatching }); }
    const w = $('#hd-walk'); if (w) w.classList.toggle('hd-still', !S.h || mood === 'slaap' || edit || hatching);
  }

  function paintLive() {
    if (!S || !alive) return;
    const now = Date.now();
    paintTop();
    if (tab !== 'home') return;
    const mood = moodNow(S, now);
    if (!S.h) {
      const t = $('#hd-eggt');
      if (t) t.textContent = hatching ? '🐣 Het ei kraakt!' : `Komt uit over ${fmtTime(S.born + EGG_MS - now)}`;
    } else {
      for (const k of [...NEEDS, 'bond']) { const b = view.querySelector(`[data-bar="${k}"]`); if (b) { b.style.width = `${Math.round(S[k])}%`; b.classList.toggle('low', S[k] < 25); } }
      const mn = $('#hd-mn'); if (mn) mn.textContent = MOOD_NL[mood];
      const nb = $('[data-nap]'); if (nb && S.nap > now) nb.textContent = `😴 Slaapt… ${fmtTime(S.nap - now)}`;
      tickPlots(now);
    }
    if (now > sayUntil && (mood !== phraseMood || now - phraseAt > 15000 || !phrase)) {
      phraseMood = mood; phraseAt = now;
      phrase = mood === 'ei' ? SAY.ei[Math.floor(Math.random() * SAY.ei.length)] : phraseFor(S, mood);
    }
    const bub = $('#hd-bub'); if (bub) bub.textContent = now < sayUntil ? sayText : phrase;
    paintPet(false);
  }
  function tickPlots(now) {
    view.querySelectorAll('.hd-plot[data-i]').forEach((el) => {
      const p = S.gd[Number(el.dataset.i)]; if (!p) return;
      const g = growth({ s: p[0], t: p[1], w: p[2] }, now);
      if (g.ready !== (el.dataset.rdy === '1')) { renderPanel(); return; }
      const pb = el.querySelector('.pb'); if (pb) pb.style.width = `${Math.round(g.frac * 100)}%`;
      const pt = el.querySelector('.pt'); if (pt) pt.textContent = g.ready ? 'Klaar!' : fmtTime(g.left);
      const em = el.querySelector('.em'); if (em && !g.ready) em.textContent = g.frac < 0.35 ? '🌱' : '🌿';
    });
  }

  /* ---------- panelen onder de kamer ---------- */
  const b = (label, act, data = '', cls = '') => `<button class="${cls}" data-do="${act}" ${data}>${label}</button>`;
  const editBtn = () => b(`🪑 ${edit ? 'Klaar met inrichten' : 'Inrichten'}`, 'edit');

  function renderPanel() {
    const p = $('#hd-panel'); if (!p || !S || !S.h) return;
    if (cookInst && sub === 'koken') return;   // het kookscherm beheert zichzelf
    destroyCook();
    p.innerHTML = panelHTML();
    if (sub === 'koken') mountCook();
  }
  function illHTML() {
    if (!S.ill) return '';
    return `<div class="box" style="background:#ffe9ea;color:#6b3a40"><b>🤒 ${esc(S.name)} is ziek</b><br><small>Geen zorgen, met medicijn of een bezoekje aan de dierenarts wordt het weer beter.</small>
      <div class="hd-acts">${MEDS.filter((m) => m.cure).map((m) => b(`${m.e} ${m.n} (${stock(m.id)})`, 'use', `data-v="${m.id}"`, stock(m.id) ? 'pri' : '')).join('')}${b('🩺 Dierenarts', 'vet', '', 'pri')}</div></div>`;
  }
  function panelHTML() {
    if (sub === 'vet') return vetHTML();
    let h = illHTML();
    if (sleepingNowS()) {
      const night = isNight(Date.now());
      return `${h}<div class="box center">😴 <b>${esc(S.name)} slaapt</b><br><small>${night ? 'Het is nacht (22:00 tot 07:00). Rustig maar, tot morgen!' : 'Een klein dutje.'}</small><div class="hd-acts">${b(`😠 Wakker maken`, 'wake')}${editBtn()}</div></div>`;
    }
    if (room === 'woon') {
      if (sub === 'wardrobe') return h + wardrobeHTML();
      return `${h}<div class="hd-acts">${b('🤚 Aaien', 'pet')}${b('💬 Praten', 'talk')}${b('👕 Aankleden', 'sub', 'data-v="wardrobe"')}${editBtn()}${b('📸 Foto', 'photo')}</div>${medCabinet()}`;
    }
    if (room === 'keuken') return h + kitchenHTML();
    if (room === 'slaap') return `${h}<div class="hd-acts">${b(`<span data-nap>😴 Dutje doen</span>`, 'nap')}${editBtn()}</div><p class="center"><small>Van 22:00 tot 07:00 slaapt ${esc(S.name)} vanzelf. Overdag kan een dutje altijd.</small></p>`;
    if (room === 'bad') return `${h}<div class="hd-acts">${b('🛁 Wassen', 'wash')}${editBtn()}</div><p class="center"><small>Een schoon huisdier is een blij huisdier. 🫧</small></p>`;
    if (room === 'tuin') return h + gardenHTML();
    return `${h}<div class="hd-acts">${b('🎾 Met de bal spelen', 'ball')}${b('🤚 Aaien', 'pet')}${b('🎮 Spelletjes', 'tab', 'data-v="games"', 'pri')}${editBtn()}</div>`;
  }
  function medCabinet() {
    const have = MEDS.filter((m) => stock(m.id));
    if (!have.length) return '';
    return `<div class="box"><b>🧰 Medicijnkastje</b><div class="hd-grid" style="margin-top:6px">${have.map((m) => `<div class="hd-card"><div class="em">${m.e}</div>${m.n} ×${stock(m.id)}${b(m.cure ? 'Geef (alleen als ziek)' : 'Geef', 'use', `data-v="${m.id}"`)}</div>`).join('')}</div></div>`;
  }

  /* keuken: eten geven, gerechten geven, koken (huisdier-koken.js), snel mengen */
  const foodCount = (id) => stock(id) + stock('i_' + id);                                  // eetbare voorraad: oud id of i_<id>
  const takeFood = (id) => { if (stock(id) > 0) addStock(id, -1); else addStock('i_' + id, -1); };
  const foodIds = () => { const set = new Set(); for (const k of Object.keys(S.iv || {})) { if (FOOD[k]) set.add(k); else if (k.startsWith('i_') && FOOD[k.slice(2)]) set.add(k.slice(2)); } return [...set]; };
  const invFor = (id) => stock('i_' + id) + (FOOD[id] && !FOOD[id].dish ? stock(id) : 0); // voorraad voor het koken
  const KR = () => (kk && Array.isArray(kk.RECIPES) ? Object.fromEntries(kk.RECIPES.map((r) => [r.id, r])) : {});
  const ING = () => (kk && Array.isArray(kk.INGREDIENTS) ? Object.fromEntries(kk.INGREDIENTS.map((r) => [r.id, r])) : {});
  function dishEffect(d) {
    const r = KR()[d.r];
    const base = (r && r.base) || { hunger: 15, happy: 6, energy: 5, health: 2 };
    const m = { 1: 0.7, 2: 1, 3: 1.4 }[d.s] || 1;
    const e = { hunger: Math.round((base.hunger || 0) * m), happy: Math.round((base.happy || 0) * m), energy: Math.round((base.energy || 0) * m), health: Math.round((base.health || 0) * m), fav: false, hate: false };
    const p = PERS[S.pe], ings = r && r.ingredients ? Object.keys(r.ingredients) : [];
    if (p && ings.some((i) => p.fav.includes(i))) { e.fav = true; e.happy += 6; }
    if (p && ings.some((i) => p.hate.includes(i))) { e.hate = true; e.hunger = Math.round(e.hunger / 2); e.happy = Math.max(0, e.happy - 4); }
    return e;
  }
  function dishesHTML() {
    if (!kk && !kookErr) ensureKoken().then(() => { if (alive && sub === 'dish') renderPanel(); });
    if (!S.dh.length) return '<div class="box center"><small>Nog geen gerechten. Ga koken met 🧑‍🍳 Koken!</small></div>';
    const R = KR();
    return `<div class="hd-grid">${S.dh.map((d, i) => {
      const r = R[d.r], e = dishEffect(d);
      return `<div class="hd-card"><div class="em">${r ? r.emoji : '🍽️'}</div>${esc(r ? r.name : d.r)}${e.fav ? ' ❤️' : e.hate ? ' 👎' : ''}<br><small>${'⭐'.repeat(d.s)}</small><br><small>🍎${e.hunger} 💛${e.happy}${e.energy ? ' ⚡' + e.energy : ''}</small>${b('Geef', 'dishfeed', `data-i="${i}"`, 'pri')}</div>`;
    }).join('')}</div>`;
  }
  function kitchenHTML() {
    const tabs = `<div class="hd-sub">${b('🍽️ Eten', 'sub', 'data-v=""', sub === '' ? 'pri' : '')}${b(`🍲 Gerechten${S.dh.length ? ` (${S.dh.length})` : ''}`, 'sub', 'data-v="dish"', sub === 'dish' ? 'pri' : '')}${b('🧑‍🍳 Koken', 'cookopen', '', sub === 'koken' ? 'pri' : '')}${b('⚡ Mengen', 'sub', 'data-v="cook"', sub === 'cook' ? 'pri' : '')}</div>`;
    if (sub === 'koken') return `${tabs}<div id="hd-cookw"><div id="hd-cookh" class="hd-exhost"></div></div><p class="center"><small>Kook echte gerechten met je ingrediënten. Die koop je in de winkel of oogst je in de tuin.</small></p>`;
    if (sub === 'dish') return tabs + dishesHTML();
    const ids = foodIds();
    if (sub === 'cook') {
      const ing = ids.filter((k) => !FOOD[k].dish);
      const a = cookSel[0], bb = cookSel[1];
      const res = a && bb ? cook(a, bb) : null;
      return `${tabs}<div class="box"><b>Kies twee ingrediënten</b> <small>(snel mengen)</small>
        ${ing.length ? `<div class="hd-grid" style="margin:8px 0">${ing.map((k) => `<div class="hd-card ${cookSel.includes(k) ? 'on' : ''}" data-do="csel" data-v="${k}" style="cursor:pointer"><div class="em">${FOOD[k].e}</div>${FOOD[k].n} ×${foodCount(k)}</div>`).join('')}</div>` : '<p><small>Je hebt geen ingrediënten. Koop eten in de winkel of oogst in de tuin.</small></p>'}
        <div class="center" style="font-size:30px">${a ? FOOD[a].e : '❔'} ＋ ${bb ? FOOD[bb].e : '❔'}</div>
        <div class="hd-acts">${b('🍳 Mengen!', 'cookgo', cookSel.length === 2 ? '' : 'disabled', 'pri')}${b('Leeg maken', 'cookclear')}</div>
        ${res ? '<p class="center"><small>Dit lijkt een bekende combinatie…</small></p>' : ''}</div>
        <div class="box"><b>📖 Receptenboek</b> <small>(${Object.keys(RECIPES).filter((k) => S.rc.includes(RECIPES[k])).length}/${Object.keys(RECIPES).length})</small>
        ${Object.entries(RECIPES).map(([k, d]) => { const f = FOOD[d]; const got = S.rc.includes(d); const [x, y] = k.split('+'); return `<div class="hd-row"><span style="font-size:26px">${got ? f.e : '❓'}</span><div class="grow">${got ? `<b>${f.n}</b><br><small>${FOOD[x].e} + ${FOOD[y].e}</small>` : '<small>Nog niet ontdekt</small>'}</div></div>`; }).join('')}</div>`;
    }
    const pantry = Object.keys(S.iv || {}).filter((k) => k.startsWith('i_') && !FOOD[k.slice(2)]);
    const ingMap = ING();
    const pantryHTML = pantry.length ? `<div class="box"><b>🧺 Voorraadkast</b><div style="margin-top:4px">${pantry.map((k) => `<span class="chip" style="margin:2px">${(ingMap[k.slice(2)] || {}).emoji || '📦'} ${esc((ingMap[k.slice(2)] || {}).name || k.slice(2))} ×${stock(k)}</span>`).join('')}</div><small>Daar kook je mee.</small></div>` : '';
    if (!ids.length) return `${tabs}<div class="box center"><small>Er is niets om rechtstreeks te geven. Koop eten in het winkeltje 🛍️, laat iets groeien in de tuin 🌳 of kook iets lekkers.</small></div>${pantryHTML}`;
    return `${tabs}<div class="hd-grid">${ids.map((k) => {
      const f = FOOD[k], p = PERS[S.pe];
      const tag = p.fav.includes(k) ? ' ❤️' : p.hate.includes(k) ? ' 👎' : '';
      return `<div class="hd-card"><div class="em">${f.e}</div>${f.n}${tag}<br><small>×${foodCount(k)}</small>${b('Geef', 'feed', `data-v="${k}"`, 'pri')}<button data-do="sell" data-v="${k}" style="font-size:11px">Verkoop 🪙${f.sv}</button></div>`;
    }).join('')}</div>${pantryHTML}${editBtn()}`;
  }

  /* garderobe */
  function previewPet(override, size = 112) {
    const s2 = { ...S, wr: { ...(S.wr || {}), ...override } };
    return plainPetHTML(s2, Date.now(), size, 'blij');
  }
  function wardrobeHTML() {
    if (!ART) return `<div class="box"><div class="row" style="justify-content:space-between"><b>👕 Garderobe</b>${b('Klaar', 'sub', 'data-v=""')}</div><p><small>De kleding is er nu even niet.</small></p></div>`;
    const mine = (slot) => Object.values(ACC).filter((a) => a.slot === slot && S.own.includes(a.id));
    const any = Object.values(ACC).some((a) => S.own.includes(a.id));
    return `<div class="box"><div class="row" style="justify-content:space-between"><b>👕 Garderobe</b>${b('Klaar', 'sub', 'data-v=""')}</div>
      <div class="hd-prev"><div class="pv">${previewPet({})}</div><small>Tik op iets om het aan of uit te doen.</small></div>
      ${any ? ART_SLOTS.map((sl) => `<p style="margin:8px 0 2px"><small>${SLOT_NL[sl]}</small></p><div class="hd-grid">${mine(sl).map((a) => `<div class="hd-card ${S.wr[SK[sl]] === a.id ? 'on' : ''}" data-do="wear" data-v="${a.id}" style="cursor:pointer"><div class="th">${accSvg(sl, a.id, 64)}</div>${esc(a.name)}</div>`).join('') || '<small>Nog niets</small>'}</div>`).join('') : '<p><small>Je hebt nog geen kleding. Kijk in het winkeltje 🛍️!</small></p>'}</div>`;
  }

  /* tuin */
  function gardenHTML() {
    const now = Date.now();
    const cells = S.gd.map((p, i) => {
      if (!p) return `<div class="hd-plot"><div class="em">🟫</div>${b('Zaaien', 'plantat', `data-i="${i}"`)}</div>`;
      const g = growth({ s: p[0], t: p[1], w: p[2] }, now); const f = FOOD[p[0]];
      return `<div class="hd-plot" data-i="${i}" data-rdy="${g.ready ? 1 : 0}"><div class="em">${g.ready ? f.e : g.frac < 0.35 ? '🌱' : '🌿'}</div><div>${f.n}</div><i><b class="pb" style="width:${Math.round(g.frac * 100)}%"></b></i><small class="pt">${g.ready ? 'Klaar!' : fmtTime(g.left)}</small>
        ${g.ready ? b('✂️ Oogsten', 'harvest', `data-i="${i}"`, 'pri') : g.watered ? '<small>💧 water gehad</small>' : b('💧 Water', 'water', `data-i="${i}"`)}</div>`;
    }).join('');
    let picker = '';
    if (plantFor >= 0 && !S.gd[plantFor]) {
      const seeds = SEEDS.filter((z) => stock('z_' + z.id));
      picker = `<div class="box"><b>Welk zaadje?</b>${seeds.length ? `<div class="hd-grid" style="margin-top:6px">${seeds.map((z) => `<div class="hd-card"><div class="em">${FOOD[z.id].e}</div>${FOOD[z.id].n}<br><small>×${stock('z_' + z.id)} · ${fmtTime(z.g)}</small>${b('Zaai', 'sow', `data-v="${z.id}"`, 'pri')}</div>`).join('')}</div>` : '<p><small>Je hebt geen zaadjes. Koop ze in de winkel (tab Zaadjes).</small></p>'}${b('Annuleren', 'plantat', 'data-i="-1"')}</div>`;
    }
    return `<div class="hd-plots">${cells}</div>${picker}<p class="center"><small>Water geven maakt de wachttijd één keer half zo kort. Geoogste gewassen vind je in de keuken.</small></p><div class="hd-acts">${editBtn()}</div>`;
  }

  /* dierenarts-spelletje: onthoud de volgorde */
  const VET_ICONS = ['🩺', '💊', '🍯', '🩹', '🌡️', '🧸'];
  function vetStart() {
    const seq = Array.from({ length: 3 }, () => Math.floor(Math.random() * VET_ICONS.length));
    vet = { seq, phase: 'show', input: [] };
    sub = 'vet'; renderPanel();
    later(() => { if (vet) { vet.phase = 'input'; if (sub === 'vet') renderPanel(); } }, 2800);
  }
  function vetHTML() {
    if (!vet) return `<div class="box center">${b('Terug', 'sub', 'data-v=""')}</div>`;
    if (vet.phase === 'show') return `<div class="box center"><b>🩺 Bij de dierenarts</b><p>Onthoud deze volgorde:</p><div style="font-size:40px">${vet.seq.map((i) => VET_ICONS[i]).join(' → ')}</div></div>`;
    return `<div class="box center"><b>🩺 Bij de dierenarts</b><p>Tik de volgorde na (${vet.input.length}/3):</p><div style="font-size:30px;min-height:40px">${vet.input.map((i) => VET_ICONS[i]).join(' ')}</div>
      <div class="hd-grid2" style="margin-top:8px">${VET_ICONS.map((ic, i) => `<button data-do="vetpick" data-i="${i}" style="font-size:30px">${ic}</button>`).join('')}</div><p>${b('Stoppen', 'vetstop')}</p></div>`;
  }

  /* ---------- winkel ---------- */
  const houseSvg = (id) => { if (!ar) return ''; try { return ar.houseExteriorSVG(id, { width: '100%' }); } catch (e) { console.error(e); return ''; } };
  const ingPrice = (i) => { const p = Math.round(Number(i.price)); return p >= 1 ? p : 4; };
  function renderShop(body) {
    const L = level(), now = Date.now();
    const tabs = [['eten', '🍎 Eten'], ['ingr', '🥕 Ingrediënten'], ['meubels', '🛋️ Meubels'], ['kleding', '👕 Kleding'], ['huizen', '🏠 Huizen'], ['zaad', '🌱 Zaadjes'], ['med', '💊 Medicijn']];
    const lock = (lv) => lv && lv > L;
    const card = (th, name, price, lv, have, buyAct, extra = '', cls = '') => {
      const lk = lock(lv);
      return `<div class="hd-card ${lk ? 'off' : ''} ${cls}">${th}${name}${have}<br>${lk ? `<small>🔒 niveau ${lv}</small>` : `<small>🪙 ${price}</small>`}${extra}${lk ? '' : buyAct}</div>`;
    };
    const emo = (e) => `<div class="em">${e}</div>`;
    const buyBtn = (kind, id, price, n = 1) => b(n > 1 ? `×${n} (🪙${price * n})` : 'Koop', 'buy', `data-k="${kind}" data-v="${id}" data-n="${n}" ${S.coins < price * n ? 'disabled' : ''}`, 'pri');
    let inner = '';
    if (shopTab === 'eten') inner = `<div class="hd-grid">${FOODS.filter((f) => f.p).map((f) => card(emo(f.e), f.n, f.p, f.lv, foodCount(f.id) ? ` <small>(×${foodCount(f.id)})</small>` : '', buyBtn('food', f.id, f.p), `<br><small>${f.f[0] ? '🍎' + f.f[0] : ''} ${f.f[1] ? '💛' + f.f[1] : ''} ${f.f[2] ? '⚡' + f.f[2] : ''}</small>`)).join('')}</div>`;
    else if (shopTab === 'ingr') {
      if (!kk) {
        if (!kookErr) ensureKoken().then(() => { if (alive && tab === 'shop' && shopTab === 'ingr') renderShop($('#hd-body')); });
        inner = `<div class="box center"><small>${kookErr ? esc(kookErr) : 'Ingrediënten laden…'}</small></div>`;
      } else inner = `<div class="hd-grid">${kk.INGREDIENTS.map((i) => { const pr = ingPrice(i); return card(emo(i.emoji), esc(i.name), pr, 0, invFor(i.id) ? ` <small>(×${invFor(i.id)})</small>` : '', `<div class="row" style="gap:4px">${buyBtn('ing', i.id, pr)}${buyBtn('ing', i.id, pr, 5)}</div>`); }).join('')}</div><p class="center"><small>Hiermee kook je echte gerechten in de keuken. 🧑‍🍳</small></p>`;
    } else if (shopTab === 'meubels') {
      if (!ar) inner = '<div class="box center"><small>De meubels zijn er nu even niet.</small></div>';
      else {
        const R = ROOM[shopRoom] || ROOMS[0];
        const list = ar.FURNITURE.filter((f) => f.room === R.a);
        inner = `<div class="hd-roombar">${ROOMS.map((r) => `<button data-do="srm" data-v="${r.id}" class="${r.id === R.id ? 'pri' : ''}">${r.e} ${r.n}</button>`).join('')}</div>
          <div class="hd-grid">${list.map((f) => (S.own.includes(f.id)
    ? `<div class="hd-card on"><div class="th">${furnSvg(f.id, 64)}</div>${esc(f.name)}<br><small>✓ van jou</small></div>`
    : card(`<div class="th">${furnSvg(f.id, 64)}</div>`, esc(f.name), f.price, f.minLevel, '', buyBtn('furn', f.id, f.price)))).join('')}</div><p class="center"><small>Plaats meubels via 🪑 Inrichten in de kamer.</small></p>`;
      }
    } else if (shopTab === 'kleding') {
      if (!ART) inner = '<div class="box center"><small>De kleding is er nu even niet.</small></div>';
      else {
        const items = ART.ACCESSORIES[clothSlot] || [];
        const sel = prevAcc && ACC[prevAcc] && ACC[prevAcc].slot === clothSlot ? prevAcc : '';
        const ov = sel ? { [SK[clothSlot]]: sel } : {};
        inner = `<div class="hd-sub">${ART_SLOTS.map((sl) => b(`${SLOT_EMO[sl]} ${SLOT_NL[sl]}`, 'cslot', `data-v="${sl}"`, sl === clothSlot ? 'pri' : '')).join('')}</div>
          <div class="hd-prev"><div class="pv" id="hd-cprev">${previewPet(ov)}</div><div><b>${sel ? esc(ACC[sel].name) : 'Jouw outfit'}</b><br><small>${sel ? `Zo past het bij ${esc(S.name)}.` : 'Tik op een plaatje om het te passen.'}</small></div></div>
          <div class="hd-grid">${items.map((a) => {
    const own = S.own.includes(a.id), on = S.wr[SK[clothSlot]] === a.id, lk = a.minLevel > L;
    return `<div class="hd-card ${sel === a.id ? 'on' : ''} ${lk && !own ? 'off' : ''}"><div class="th" data-do="prev" data-v="${a.id}" style="cursor:pointer">${accSvg(clothSlot, a.id, 64)}</div>${esc(a.name)}<br>${own ? '<small>✓ van jou</small>' : lk ? `<small>🔒 niveau ${a.minLevel}</small>` : `<small>🪙 ${a.price}</small>`}${own ? b(on ? 'Uit doen' : 'Aan doen', 'wear', `data-v="${a.id}"`, on ? '' : 'pri') : lk ? '' : buyBtn('cloth', a.id, a.price)}</div>`;
  }).join('')}</div>`;
      }
    } else if (shopTab === 'huizen') {
      if (!ar) inner = '<div class="box center"><small>De huizen zijn er nu even niet.</small></div>';
      else inner = `<div class="hd-grid3">${ar.HOUSES.map((h) => {
        const own = S.hu.includes(h.id), here = S.hc === h.id, lk = h.minLevel > L;
        return `<div class="hd-card ${lk && !own ? 'off' : ''} ${here ? 'on' : ''}"><div class="thw">${houseSvg(h.id)}</div><b>${esc(h.name)}</b><br><small>${esc(h.desc)}</small><br>${own ? (here ? '<small>🏡 Hier woon je</small>' : b('Verhuis hierheen', 'move', `data-v="${h.id}"`, 'pri')) : lk ? `<small>🔒 niveau ${h.minLevel}</small>` : `<small>🪙 ${h.price}</small>${buyBtn('house', h.id, h.price)}`}</div>`;
      }).join('')}</div><p class="center"><small>Je meubels verhuizen mee naar je nieuwe huis.</small></p>`;
    } else if (shopTab === 'zaad') inner = `<div class="hd-grid">${SEEDS.map((z) => card(emo(FOOD[z.id].e), `${FOOD[z.id].n}-zaadje`, z.p, z.lv, stock('z_' + z.id) ? ` <small>(×${stock('z_' + z.id)})</small>` : '', buyBtn('seed', z.id, z.p), `<br><small>⏱️ ${fmtTime(z.g)} · ×${z.y}</small>`)).join('')}</div>`;
    else inner = `<div class="hd-grid2">${MEDS.map((m) => card(emo(m.e), m.n, m.p, m.lv, stock(m.id) ? ` <small>(×${stock(m.id)})</small>` : '', buyBtn('med', m.id, m.p), `<br><small>${m.d}</small>`)).join('')}</div>`;
    void now;
    body.innerHTML = `<div class="row" style="justify-content:space-between"><b>🛍️ Winkeltje</b><span class="chip">🪙 ${S.coins}</span></div>
      <div class="hd-nav">${tabs.map(([k, l]) => `<button data-do="stab" data-v="${k}" class="${shopTab === k ? 'pri' : ''}">${l}</button>`).join('')}</div>${inner}`;
  }


  /* ---------- doelen: dagelijkse beloning, opdrachten, prestaties ---------- */
  function renderGoals(body) {
    const today = dayKey(Date.now());
    const can = S.sd !== today;
    const nx = nextStreak(S.sd, today, S.sk);
    body.innerHTML = `<div class="box center"><b>🎁 Dagelijkse beloning</b>
      <p>Reeks: <b>${S.sk}</b> dag${S.sk === 1 ? '' : 'en'} 🔥</p>
      ${can ? `<p>Vandaag: <b>${dailyReward(nx)} 🪙</b>${mult() > 1 ? ` <small>(×${mult()} evenement)</small>` : ''} <small>· reeks ${nx}</small></p>${b('Ophalen', 'daily', '', 'pri')}` : '<p><small>Vandaag al opgehaald. Tot morgen! 🌙</small></p>'}
      <small>Elke 7e dag op rij is er een extra bonus.</small></div>
      <div class="box"><b>📋 Opdrachten van vandaag</b>${S.ql.map((q, i) => {
        const p = questProgress(q);
        return `<div class="hd-row"><div class="grow">${p.done ? '✅' : '⬜'} ${esc(p.text)}<div class="hd-xp"><i style="width:${Math.round(p.frac * 100)}%"></i></div><small>${p.cur}/${p.target} · 🪙 ${p.reward}</small></div>${p.claimed ? '<small>Gehaald</small>' : p.done ? b('Ophalen', 'quest', `data-i="${i}"`, 'pri') : ''}</div>`;
      }).join('') || '<p><small>Geen opdrachten.</small></p>'}<small>Elke dag nieuwe opdrachten.</small></div>
      <div class="box"><b>🏅 Prestaties</b> <small>(${S.ach.length}/${ACH.length})</small>
        <div class="hd-grid" style="margin-top:8px">${ACH.map((a) => `<div class="hd-card hd-ach ${S.ach.includes(a.id) ? 'got' : ''}"><div class="em">${a.e}</div><b>${a.n}</b><br><small>${a.d}</small></div>`).join('')}</div></div>`;
  }

  /* ---------- spelletjes: speel met je huisdier ---------- */
  const hsKey = (id) => String(id).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
  const liveGames = new Set();
  function destroyGame(g) {
    if (!g || !g.inst) return;
    const i = g.inst; g.inst = null; liveGames.delete(i);
    try { if (i.destroy) i.destroy(); } catch (e) { console.error(e); }
  }
  // api.pet voor spelletjes, extra's en koken: { name, species, html(size, mood) }
  const petApi = () => ({ name: S.name, species: speciesNow(), html: (size, mood) => plainPetHTML(S, Date.now(), Math.max(16, Math.round(Number(size) || 80)), mood) });
  // score 0-100 -> munten min(15, round(0.15 * score)) (dagplafond 60), geluk 0.3 * fun, band, xp, opdrachten
  function rewardGame(g, score, fun) {
    const today = dayKey(Date.now());
    if (S.gc.d !== today) S.gc = { d: today, n: 0 };
    const r = gameReward(score, S.gc.n);
    S.gc.n += r.coins;
    const coins = earn(r.coins);
    const key = hsKey(g.g.id);
    const rec = score > (S.hs[key] || 0);
    if (rec) S.hs[key] = Math.floor(score);
    const f = Number.isFinite(Number(fun)) ? Math.max(0, Math.min(100, Number(fun))) : score;
    const joy = Math.round(0.3 * f);
    S.happy = cp(S.happy + joy); S.energy = cp(S.energy - 4); S.bond = cp(S.bond + 1 + (score >= 70 ? 1 : 0));
    bump('game'); addXp(r.xp); changed(); paintTop();
    return { coins, xp: r.xp, rec, capped: r.capped, joy };
  }
  function endGame(award) {
    const g = game; if (!g) return;
    game = null;
    if (award && !g.done && g.score > 0 && S) { g.done = true; const r = rewardGame(g, g.score); toast(`${g.g.emoji} Score ${g.score}: +${r.coins} 🪙`); }
    destroyGame(g);
  }
  function renderGames(body) {
    if (game) return renderGamePlay(body);
    if (!gm || !Array.isArray(gm.GAMES) || !gm.GAMES.length) {
      body.innerHTML = `<div class="box center"><div style="font-size:40px">🎮</div><p>De spelletjes zijn er nu even niet.</p><small>${esc(gmErr || 'Probeer het later nog eens.')}</small></div>`;
      return;
    }
    const left = S.gc.d === dayKey(Date.now()) ? Math.max(0, GAME_DAY_CAP - S.gc.n) : GAME_DAY_CAP;
    body.innerHTML = `<div class="box center"><b>🎮 Speel met je huisdier</b><br><small>${esc(S.name)} speelt gezellig mee! Je verdient een paar munten, ervaring en ${esc(S.name)} wordt er blijer van. Vandaag nog tot ${left} 🪙 te verdienen.${mult() > 1 ? ` Evenement: ×${mult()}!` : ''}</small></div>
      <div class="box">${gm.GAMES.map((g) => `<div class="hd-row"><span style="font-size:34px">${esc(g.emoji || '🎮')}</span><div class="grow"><b>${esc(g.name)}</b><br><small>${esc(g.desc || '')}</small><br><small>🏆 Beste: ${S.hs[hsKey(g.id)] || 0}</small></div>${b('Speel', 'play', `data-id="${esc(g.id)}"`, 'pri')}</div>`).join('')}</div>`;
  }
  function hostSize(body) {
    const w = Math.max(240, Math.min(400, body.clientWidth || 360));
    const h = Math.max(300, Math.min(Math.round(w * 16 / 9), Math.round((window.innerHeight || 700) * 0.7)));
    return [w, h];
  }
  function renderGamePlay(body) {
    const g = game.g;
    body.innerHTML = `<div class="box"><div class="row" style="justify-content:space-between"><b>${esc(g.emoji || '🎮')} ${esc(g.name)}</b><span class="chip" id="hd-gs">Score ${game.score}</span>${b('Stop', 'gstop')}</div></div>
      <div id="hd-gw"><div id="hd-gh" class="hd-gamehost"></div></div><p class="center"><small>${esc(g.desc || '')}</small></p>`;
    const host = $('#hd-gh'), cur = game;
    const [w, h] = hostSize(body);
    host.style.width = `${w}px`; host.style.height = `${h}px`;
    const api = {
      w, h, pet: petApi(),
      score(n) { if (game !== cur || cur.done) return; cur.score = Math.max(0, Math.floor(Number(n) || 0)); const e = $('#hd-gs'); if (e) e.textContent = `Score ${cur.score}`; },
      end(n, o) { finishGame(cur, n, o && o.fun); },
    };
    try {
      const inst = g.create(host, api);
      if (cur.done) { if (inst && inst.destroy) try { inst.destroy(); } catch (e) { console.error(e); } }
      else if (inst) { cur.inst = inst; liveGames.add(inst); }
    } catch (e) {
      console.error(e); game = null;
      body.innerHTML = '<div class="box center"><p>Dit spelletje wil nu niet starten. 😔</p><button data-do="tab" data-v="games">Terug</button></div>';
    }
  }
  function finishGame(cur, score, fun) {
    if (cur.done) return;
    cur.done = true;
    let sc = Number(score); if (!Number.isFinite(sc)) sc = cur.score || 0;
    sc = Math.max(0, Math.floor(sc));
    const r = rewardGame(cur, sc, fun);
    if (game === cur) game = null;
    const inst = cur.inst; cur.inst = null;
    setTimeout(() => { if (inst) { liveGames.delete(inst); try { if (inst.destroy) inst.destroy(); } catch (e) { console.error(e); } } }, 0);
    sfx(r.coins ? 'munt' : 'tap');
    if (alive && tab === 'games') {
      const body = $('#hd-body'); if (!body) return;
      body.innerHTML = `<div class="box center">${confetti()}<div style="font-size:44px">${esc(cur.g.emoji || '🎮')}</div><h3>Klaar!</h3><p>Score: <b>${sc}</b>${r.rec ? ' 🎉 nieuw record!' : ''}</p>
        <p>+${r.coins} 🪙 · +${r.xp} xp · 💛 +${r.joy}${mult() > 1 ? ` <small>(×${mult()} evenement)</small>` : ''}</p>${r.capped ? '<small>De daggrens voor munten uit spelletjes is bereikt, morgen weer!</small>' : ''}
        <div class="hd-acts">${b('Nog een keer', 'play', `data-id="${esc(cur.g.id)}"`, 'pri')}${b('Andere spelletjes', 'tab', 'data-v="games"')}</div></div>`;
    }
  }

  /* ---------- extra: Steun, Uitlaten, Camera (huisdier-extra.js) en koken (huisdier-koken.js) ---------- */
  const loadModule = (key, url, set, errSet) => import(url).then((m) => { set(m); return m; }).catch((e) => { console.error(e); errSet(); return null; });
  let exP = null, kkP = null;
  const ensureExtra = () => exP || (exP = ex ? Promise.resolve(ex) : loadModule('ex', './huisdier-extra.js?v=1', (m) => { ex = m; }, () => { extraErr = 'Dit onderdeel kon niet geladen worden.'; exP = null; }));
  const ensureKoken = () => kkP || (kkP = kk ? Promise.resolve(kk) : loadModule('kk', './huisdier-koken.js?v=1', (m) => { kk = m; }, () => { kookErr = 'Koken kon niet geladen worden.'; kkP = null; }));
  function destroyExtra() { const i = extraInst; extraInst = null; if (i) try { if (i.destroy) i.destroy(); } catch (e) { console.error(e); } }
  function destroyCook() { const i = cookInst; cookInst = null; if (i) try { if (i.destroy) i.destroy(); } catch (e) { console.error(e); } }

  // award van modules: begrensd per aanroep (xp 40, munten 15, geluk/band/energie 25)
  function awardMod(a, who) {
    if (!S || !a || typeof a !== 'object') return;
    const n = (v) => { const x = Math.round(Number(v)); return Number.isFinite(x) ? x : 0; };
    const lim = (v, m) => Math.max(-m, Math.min(m, n(v)));
    const xp = Math.max(0, Math.min(40, n(a.xp))), coins = Math.max(0, Math.min(15, n(a.coins)));
    S.happy = cp(S.happy + lim(a.happy, 25)); S.bond = cp(S.bond + lim(a.bond, 25)); S.energy = cp(S.energy + lim(a.energy, 25));
    if (coins) earn(coins);
    if (who === 'wandelen' && (xp || coins)) bump('walk');
    if (who === 'steun') { const day = Number(dayKey(Date.now()).replace(/-/g, '')); if (c(S, 'cid') !== day) { S.st.cid = day; bump('checkin'); } }
    if (who === 'camera' && xp >= 20) { bump('hide'); if (!c(S, 'cam')) bump('cam'); }
    if (xp) addXp(xp);
    changed(); paintTop(); paintLive();
  }
  // gegevens van modules: S.x[key], totaal max 3000 tekens (de rest wordt weggeknipt)
  function loadX(key) {
    const v = S && S.x && /^[a-z]{2,10}$/.test(String(key)) ? S.x[key] : null;
    try { return v ? JSON.parse(JSON.stringify(v)) : null; } catch { return null; }
  }
  function saveX(key, obj) {
    if (!S || !/^[a-z]{2,10}$/.test(String(key))) return;
    let v; try { v = JSON.parse(JSON.stringify(obj)); } catch { return; }
    if (!v || typeof v !== 'object' || JSON.stringify({ [key]: v }).length > X_MAX) return;
    const x = { ...(S.x || {}), [key]: v };
    const size = () => JSON.stringify(x).length;
    const others = Object.keys(x).filter((k) => k !== key).sort((a, b2) => JSON.stringify(x[b2]).length - JSON.stringify(x[a]).length);
    while (size() > X_MAX && others.length) delete x[others.shift()];
    S.x = x; checkAch(); changed();
  }
  function modApi(who, w, h) {
    return {
      w, h, uid: me.uid, level: level(), pet: petApi(),
      getState: () => ({ personality: PERS[S.pe].n, name: S.name, level: level(), mood: moodNow(S, Date.now()), hunger: S.hunger, happy: S.happy, energy: S.energy, clean: S.clean, bond: S.bond }),
      award: (a) => { try { awardMod(a, who); } catch (e) { console.error(e); } },
      loadExtra: loadX, saveExtra: saveX,
      toast: (m) => { if (alive) toast(String(m).slice(0, 120)); },
      sound: (n, o) => { sfx(String(n), o); if (who === 'camera' && n === 'klaar' && S && !c(S, 'cam')) { bump('cam'); changed(); } },
    };
  }
  function renderExtra(body) {
    if (extraOpen) return mountExtra(body);
    destroyExtra();
    if (!ex) {
      if (!extraErr) ensureExtra().then(() => { if (alive && tab === 'extra') render(); });
      body.innerHTML = `<div class="box center"><div style="font-size:40px">🌈</div><p>${extraErr ? esc(extraErr) : 'Even laden…'}</p></div>`;
      return;
    }
    body.innerHTML = `<div class="box center"><b>🌈 Extra met ${esc(S.name)}</b><br><small>Een rustig momentje, samen wandelen of kijken door de camera.</small></div>
      <div class="hd-grid3">${ex.EXTRAS.map((x) => `<div class="hd-card"><div class="em">${x.emoji}</div><b>${esc(x.name)}</b><br><small>${esc(x.desc || '')}</small>${b('Open', 'xopen', `data-v="${esc(x.id)}"`, 'pri')}</div>`).join('')}</div>`;
  }
  function mountExtra(body) {
    const x = ex && ex.EXTRAS.find((e) => e.id === extraOpen);
    if (!x) { extraOpen = ''; return renderExtra(body); }
    destroyExtra();
    body.innerHTML = `<div class="row" style="justify-content:space-between;margin-bottom:6px">${b('← Terug', 'xback')}<b>${x.emoji} ${esc(x.name)}</b><span></span></div><div id="hd-xw"><div id="hd-xh" class="hd-exhost"></div></div>`;
    const host = $('#hd-xh'); const [w, h] = hostSize(body);
    host.style.width = `${w}px`; host.style.height = `${h}px`;
    try { extraInst = x.create(host, modApi(x.id, w, h)) || null; }
    catch (e) { console.error(e); extraOpen = ''; toast('Dit onderdeel wil nu niet starten 😔'); renderExtra(body); }
  }
  async function mountCook() {
    const host = $('#hd-cookh'); if (!host) return;
    await ensureKoken();
    if (!alive || !kk || sub !== 'koken' || !$('#hd-cookh') || cookInst) { if (!kk && alive && sub === 'koken') { sub = ''; toast(kookErr || 'Koken is er nu even niet'); renderPanel(); } return; }
    const h0 = $('#hd-cookh'); const [w, h] = hostSize($('#hd-body'));
    h0.style.width = `${w}px`; h0.style.height = `${h}px`;
    const api = modApi('koken', w, h);
    api.getInventory = () => { const o = {}; for (const i of kk.INGREDIENTS) { const n = invFor(i.id); if (n > 0) o[i.id] = n; } return o; };
    api.consume = (obj) => {
      if (!obj || typeof obj !== 'object') return false;
      const need = Object.entries(obj).map(([id, n]) => [String(id), Math.max(0, Math.floor(Number(n) || 0))]);
      if (need.some(([id, n]) => invFor(id) < n)) return false;
      for (const [id, n] of need) for (let i = 0; i < n; i++) { if (stock('i_' + id) > 0) addStock('i_' + id, -1); else addStock(id, -1); }
      changed(); return true;
    };
    api.addDish = (d) => {
      if (!d || typeof d !== 'object' || !RID.test(String(d.recipeId))) return;
      const dish = { r: String(d.recipeId), s: clampInt(d.stars, 1, 3), q: clampInt(d.quality, 0, 100) };
      if (S.dh.length >= 30) { let k = 0; S.dh.forEach((x, i) => { if (x.s < S.dh[k].s) k = i; }); S.dh.splice(k, 1); }
      S.dh.push(dish);
      if (!S.rc.includes(dish.r)) { S.rc.push(dish.r); S.coins += 5; toast(`🎉 Nieuw gerecht: ${d.emoji || ''} ${d.name || ''}! +5 🪙`); }
      bump('cook'); sfx('koken'); changed(); paintTop();
    };
    api.level = level();
    try { cookInst = kk.createCooking(h0, api) || null; }
    catch (e) { console.error(e); sub = ''; toast('Koken wil nu niet starten 😔'); renderPanel(); }
  }


  /* ---------- vrienden ---------- */
  const hasSoc = () => !!(soc && typeof soc.listPets === 'function');
  async function fetchPets() {
    try {
      const list = await soc.listPets(db);
      if (!alive) return;
      cache.pets = (list || []).map((p) => ({ uid: p.uid, name: p.name || 'Onbekend', s: parseState(p.data) })).filter((p) => p.s);
      cache.petsErr = '';
    } catch (e) { console.error(e); cache.pets = []; cache.petsErr = 'Het lukte niet om de huisdieren te laden.'; }
    if (alive && (tab === 'friends' || tab === 'admin')) render();
  }
  async function fetchInbox() {
    if (!hasSoc() || !soc.listInbox) return;
    try { const l = await soc.listInbox(db, me); if (!alive) return; cache.inbox = l || []; cache.inboxErr = ''; }
    catch (e) { console.error(e); cache.inbox = cache.inbox || []; cache.inboxErr = 'Het lukte niet om je post te laden.'; }
    if (alive) { paintNav(); if (tab === 'friends') render(); }
  }
  async function fetchAdmin() {
    try {
      const list = await soc.listAllPetsForAdmin(db);
      if (!alive) return;
      cache.admin = (list || []).map((p) => ({ uid: p.uid, name: p.name || 'Onbekend', s: parseState(p.data) }));
      cache.adminErr = '';
    } catch (e) { console.error(e); cache.admin = []; cache.adminErr = 'Het lukte niet om de huisdieren te laden.'; }
    if (alive && tab === 'admin') render();
  }
  function refreshEvent() {
    lastEv = Date.now();
    if (!hasSoc() || typeof soc.getEvent !== 'function') return;
    soc.getEvent(db).then((e) => { if (!alive) return; ev = e && e.until > Date.now() ? e : null; paintBanner(); }).catch(() => {});
  }
  const miniPet = (s, now) => `<div class="hd-mini">${petHTML(s, now)}</div>`;

  /* hulp van vrienden: eigenaar kiest wie mag helpen (petperms), vrienden sturen hulp (pethelps) */
  const HELP = {
    feed: { l: 'voeren', e: '🍎', v: 'gevoerd', fx: { hunger: 25, happy: 5 } },
    play: { l: 'spelen', e: '⚽', v: 'mee gespeeld', fx: { happy: 20, energy: -10 } },
    wash: { l: 'wassen', e: '🛁', v: 'gewassen', fx: { clean: 30 } },
    sleep: { l: 'slapen', e: '🌙', v: 'in bed gestopt', fx: { energy: 20 } },
    pet: { l: 'aaien', e: '💗', v: 'geaaid', fx: { bond: 5, happy: 10 } },
  };
  const HELP_MAX = 3;      // per vriend per dag (client-side)
  const helpKey = `huisdier:help:${me.uid}`;
  function helpUsed(uid) {
    try { const o = JSON.parse(localStorage.getItem(helpKey) || 'null'); if (o && o.d === dayKey(Date.now()) && o.c) return Math.max(0, Number(o.c[uid]) || 0); } catch { /* leeg */ }
    return 0;
  }
  function helpCount(uid) {
    const d = dayKey(Date.now()); let o = null;
    try { o = JSON.parse(localStorage.getItem(helpKey) || 'null'); } catch { /* leeg */ }
    if (!o || o.d !== d || !o.c) o = { d, c: {} };
    o.c[uid] = (Number(o.c[uid]) || 0) + 1;
    try { localStorage.setItem(helpKey, JSON.stringify(o)); } catch { /* vol */ }
  }
  let permLoading = false, permsErr = '';
  async function loadMyPerms() {
    if (permLoading || myPerms !== null || !soc || !soc.getPerms) return;
    permLoading = true; permsErr = '';
    try { const r = await soc.getPerms(db, me.uid); myPerms = Array.isArray(r && r.allow) ? r.allow.map(String) : []; }
    catch (e) { console.error(e); permsErr = 'Het lukte niet om de lijst te laden.'; }
    permLoading = false;
    if (alive && tab === 'friends' && !visit) render();
  }
  function permsHTML(others) {
    if (!soc.getPerms || !soc.setPerms) return '';
    const head = '<b>🤝 Wie mag mijn huisdier helpen?</b>';
    if (myPerms === null) {
      if (!permsErr) { loadMyPerms(); return `<div class="box">${head}<p class="center"><small>Even laden…</small></p></div>`; }
      return `<div class="box">${head}<p class="err">${esc(permsErr)}</p>${b('Opnieuw proberen', 'permretry')}</div>`;
    }
    return `<div class="box">${head}<br><small>Wie een vinkje krijgt, mag ${esc(S.name)} voeren, mee spelen, wassen, in bed stoppen of aaien. Je ziet het terug als je weer terugkomt. Maximaal 10 vrienden.</small>
      ${others.map((p) => { const on = myPerms.includes(p.uid); return `<div class="hd-row"><div class="grow"><b>${esc(p.name)}</b></div>${b(on ? '✅ Mag helpen' : '⬜ Nee', 'permtoggle', `data-uid="${esc(p.uid)}"`, on ? 'pri' : '')}</div>`; }).join('') || '<p><small>Er zijn nog geen anderen.</small></p>'}</div>`;
  }

  function renderFriends(body) {
    if (!hasSoc()) { body.innerHTML = `<div class="box center"><div style="font-size:40px">👥</div><p>Vrienden zijn er nu even niet.</p><small>${esc(socErr || 'Probeer het later nog eens.')}</small></div>`; return; }
    if (visit) return renderVisit(body);
    const un = cache.inbox ? cache.inbox.filter((g) => !g.claimed).length : 0;
    const nav = `<div class="hd-sub">${[['vrienden', '👥 Vrienden'], ['inbox', `📬 Post${un ? ` (${un})` : ''}`], ['rang', '🏅 Ranglijst']].map(([k, l]) => b(l, 'ftab', `data-v="${k}"`, ftab === k ? 'pri' : '')).join('')}</div>`;
    if (cache.pets === null && ftab !== 'inbox') { body.innerHTML = `${nav}<p class="center"><small>Even kijken wie er thuis is…</small></p>`; if (gate('fp', 2000)) fetchPets(); return; }
    const now = Date.now();
    if (ftab === 'inbox') {
      if (cache.inbox === null) { body.innerHTML = `${nav}<p class="center"><small>Post ophalen…</small></p>`; fetchInbox(); return; }
      const list = cache.inbox.slice(0, 30);
      body.innerHTML = `${nav}${cache.inboxErr ? `<p class="err">${esc(cache.inboxErr)}</p>` : ''}<div class="box">${un ? b('Alles ophalen', 'claimall', '', 'pri') : ''}
        ${list.map((g) => `<div class="hd-row"><span style="font-size:30px">${g.kind === 'coins' ? '🪙' : g.kind === 'toy' ? '🧸' : g.kind === 'hug' ? '🤗' : '🍎'}</span><div class="grow"><b>${esc(g.label || 'Cadeautje')}</b><br><small>van ${esc(g.fromName || 'iemand')}${g.created ? ' · ' + new Date(g.created).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : ''}</small></div>${g.claimed ? '<small>Opgehaald</small>' : b('Ophalen', 'claim', `data-id="${esc(g.id)}"`, 'pri')}</div>`).join('') || '<p class="center"><small>Nog geen post. 💌</small></p>'}</div>`;
      return;
    }
    if (ftab === 'rang') return renderRank(body, nav, now);
    const others = (cache.pets || []).filter((p) => p.uid !== me.uid);
    body.innerHTML = `${nav}${cache.petsErr ? `<p class="err">${esc(cache.petsErr)}</p>` : ''}${permsHTML(others)}<div class="box">${others.map((p, i) => {
      const s = applyTime(p.s, now); const mood = moodNow(s, now);
      return `<div class="hd-row">${miniPet(s, now)}<div class="grow"><b>${esc(s.name)}</b> <small>van ${esc(p.name)}</small><br><small>${STAGES[stageOf(s, now)].n} · niveau ${levelOf(s.xp).lv} · ${MOOD_NL[mood]}</small></div>${b('Bezoek', 'visit', `data-i="${i}"`, 'pri')}</div>`;
    }).join('') || '<p class="center"><small>Er zijn nog geen andere huisdieren. 🐾</small></p>'}${b('↻ Vernieuwen', 'frefresh')}</div>`;
  }
  function renderRank(body, nav, now) {
    const mk = (owner, s, isMe) => ({ name: s.name, owner, age: ageDays(s, now), lv: levelOf(s.xp).lv, xp: s.xp, ach: s.ach.length, me: isMe, s });
    const rows = (cache.pets || []).filter((p) => p.uid !== me.uid).map((p) => mk(p.name, p.s, false));
    rows.push(mk(me.name, S, true));
    const key = rankBy === 'age' ? 'age' : rankBy === 'lv' ? 'xp' : 'ach';
    rows.sort((x, y) => y[key] - x[key]);
    if (rows.length >= 2 && rows[0].me && rows[0][key] > rows[1][key] && !c(S, 'top')) { bump('top'); changed(); }
    const val = (r) => (rankBy === 'age' ? `${Math.floor(r.age)} dagen` : rankBy === 'lv' ? `niveau ${r.lv}` : `${r.ach} 🏅`);
    body.innerHTML = `${nav}<div class="hd-sub">${[['age', '🎂 Leeftijd'], ['lv', '⭐ Niveau'], ['ach', '🏅 Prestaties']].map(([k, l]) => b(l, 'rankby', `data-v="${k}"`, rankBy === k ? 'pri' : '')).join('')}</div>
      <div class="box">${rows.map((r, i) => `<div class="hd-row"><span style="font-size:26px;width:34px">${['🥇', '🥈', '🥉'][i] || i + 1}</span><div class="grow"><b>${esc(r.name)}${r.me ? ' (jij)' : ''}</b><br><small>van ${esc(r.owner)}</small></div><b>${val(r)}</b></div>`).join('')}</div>`;
  }
  async function loadVisitPerm(p) {
    if (!soc || !soc.getPerms) { permCache[p.uid] = false; return; }
    try { const r = await soc.getPerms(db, p.uid); permCache[p.uid] = !!(r && Array.isArray(r.allow) && r.allow.includes(me.uid)); }
    catch (e) { console.error(e); permCache[p.uid] = false; }
    if (alive && visit === p && tab === 'friends') render();
  }
  function visitHelpHTML(p, s, st) {
    if (!soc.sendHelp) return '';
    const perm = permCache[p.uid];
    if (perm === undefined) { permCache[p.uid] = null; loadVisitPerm(p); }
    if (perm === undefined || perm === null) return '<p class="center"><small>Even kijken of je mag helpen…</small></p>';
    if (!perm) return '<p class="center"><small>Vraag je vriend of je mag helpen 💬</small></p>';
    if (st === 'ei') return '<p class="center"><small>Het ei heeft nog geen hulp nodig. 🥚</small></p>';
    const left = Math.max(0, HELP_MAX - helpUsed(p.uid));
    return `<p style="margin:8px 0 2px"><b>🤝 Help ${esc(s.name)}</b><br><small>${esc(p.name)} vindt het fijn als je meehelpt! Vandaag mag je nog ${left} keer helpen.</small></p>
      <div class="hd-acts">${Object.entries(HELP).map(([k, h]) => b(`${h.e} Help: ${h.l}`, 'help', `data-v="${k}" ${left ? '' : 'disabled'}`)).join('')}</div>`;
  }
  function renderVisit(body) {
    const p = visit, now = Date.now();
    const s = applyTime(p.s, now); const mood = moodNow(s, now); const st = stageOf(s, now);
    if (s.type === 'mix' && !MIX) loadMix().then(() => { if (alive && visit === p && tab === 'friends') render(); });
    const R = ROOM[visitRoom] || ROOMS[0];
    const hc = s.hc || 'huisje';
    const night = nightOf(s, now);
    const house = HOUSE_A[hc];
    body.innerHTML = `<p>${b('← Terug', 'vback')}</p>
      <div class="hd-roombar">${ROOMS.map((r) => `<button data-do="vroom" data-v="${r.id}" class="${r.id === R.id ? 'pri' : ''}">${r.e} ${r.n}</button>`).join('')}</div>
      <div class="hd-stage" style="background:${R.bg}"><div class="hd-roomsvg">${roomSvg(hc, R.id, (s.fp && s.fp[R.id]) || [], night)}</div>
        <div class="hd-bubble">${esc(phraseFor(s, mood))}</div>
        <div class="hd-walk ${mood === 'slaap' || st === 'ei' ? 'hd-still' : ''}" style="--fy:${fyOf(R.id)}"><div class="hd-flip" id="hd-vpet">${petHTML(s, now, { mood })}</div></div>
        ${mood === 'slaap' ? '<div class="hd-night"><span>💤</span></div>' : ''}<div class="hd-fx" id="hd-fx"></div></div>
      <div class="box center"><b>${esc(s.name)}</b> <small>van ${esc(p.name)}</small><br><small>${STAGES[st].n} · ${PERS[s.pe].e} ${PERS[s.pe].n} · ${MOOD_NL[mood]}${house ? ` · 🏠 ${esc(house.name)}` : ''}</small>
        <p>⭐ Niveau ${levelOf(s.xp).lv} · 🏅 ${s.ach.length} prestaties · 🎂 ${Math.floor(ageDays(s, now))} dagen</p>
        <div class="hd-acts">${b('🤗 Knuffel', 'vhug')}${b('🎁 Stuur cadeautje', 'giftopen', '', 'pri')}</div>
        ${visitHelpHTML(p, s, st)}
        <small>Je kijkt alleen mee; aan het huisdier zelf verandert er niets${permCache[p.uid] ? ' (behalve als je helpt)' : ''}.</small></div>`;
  }

  /* ---------- admin ---------- */
  function renderAdmin(body) {
    if (!me.admin) { body.innerHTML = '<div class="box center">Alleen voor Simon.</div>'; return; }
    if (!hasSoc()) { body.innerHTML = `<div class="box center"><p>De beheerfuncties zijn er nu niet.</p><small>${esc(socErr)}</small></div>`; return; }
    if (cache.admin === null) { body.innerHTML = '<p class="center"><small>Huisdieren laden…</small></p>'; if (gate('fa', 2000)) fetchAdmin(); return; }
    const now = Date.now();
    const until = new Date(now + 3 * DAY); const ds = dayKey(until.getTime());
    body.innerHTML = `<div class="box"><b>🎉 Evenement</b>
      ${ev && ev.until > now ? `<p>Nu actief: <b>${esc(ev.title)}</b> (×${Number(ev.mult) || 1}) tot ${new Date(ev.until).toLocaleDateString('nl-NL')} ${b('Stoppen', 'evstop')}</p>` : '<p><small>Er is nu geen evenement.</small></p>'}
      <input id="hd-ev-t" class="hd-in" maxlength="60" placeholder="Titel, bv. Weekendfeest" style="margin:4px 0">
      <div class="row"><select id="hd-ev-m" class="hd-in"><option value="2">2× munten</option><option value="3">3× munten</option></select><input id="hd-ev-d" class="hd-in" type="date" value="${ds}"></div>
      <p>${b('Evenement starten', 'evsave', '', 'pri')}</p></div>
      <div class="box"><b>🐾 Alle huisdieren</b> ${b('↻', 'adminrefresh')}${cache.adminErr ? `<p class="err">${esc(cache.adminErr)}</p>` : ''}
      ${cache.admin.map((p, i) => {
        if (!p.s) return `<div class="hd-row"><div class="grow"><b>${esc(p.name)}</b><br><small>Nog geen huisdier</small></div></div>`;
        const s = applyTime(p.s, now); const mood = moodNow(s, now);
        return `<div class="hd-row"><div class="grow"><b>${esc(s.name)}</b> <small>van ${esc(p.name)}</small><br><small>${STAGES[stageOf(s, now)].n} · niveau ${levelOf(s.xp).lv} · ${MOOD_NL[mood]} · 🪙 ${s.coins}</small>
          <div class="row" style="margin-top:4px"><input type="number" min="1" max="500" value="50" id="hd-ac-${i}" class="hd-in" style="width:80px">${b('Stuur munten', 'acoins', `data-i="${i}"`)}</div></div></div>`;
      }).join('') || '<p><small>Geen huisdieren.</small></p>'}</div>`;
  }

  /* ---------- instellingen ---------- */
  function renderSettings(body) {
    const now = Date.now();
    body.innerHTML = `<div class="box"><b>⚙️ Instellingen</b>
      <p style="margin:8px 0 2px"><small>Naam</small></p><div class="row"><input id="hd-rename" class="hd-in" maxlength="16" value="${esc(S.name)}" style="flex:1">${b('Opslaan', 'rename', '', 'pri')}</div>
      ${S.type !== 'mix' ? `<p style="margin:10px 0 2px"><small>Kleur</small></p><div class="row wrap">${Array.from({ length: NPAL }, (_, i) => { const [m, a] = palColors(S.type, i); return `<button data-do="hue" data-v="${i}" class="${(S.hue || 0) === i ? 'pri' : ''}" title="${esc(palName(S.type, i))}" aria-label="${esc(palName(S.type, i))}"><span class="hd-sw" style="background:linear-gradient(135deg,${m} 55%,${a} 55%)"></span> <small>${esc(palName(S.type, i))}</small></button>`; }).join('')}</div>` : ''}
      <p style="margin:10px 0 2px"><small>Geluid</small></p>
      <div class="row">${b(pref.on ? '🔊 Aan' : '🔇 Uit', 'snd')}<input id="hd-vol" class="hd-in" type="range" min="0" max="100" step="5" value="${Math.round(pref.vol * 100)}" data-in="vol" aria-label="Volume" style="flex:1"${snd ? '' : ' disabled'}></div>
      ${snd ? '' : '<small>Geluid is er nu even niet.</small>'}
    </div>
    <div class="box"><b>Over ${esc(S.name)}</b><p><small>${S.type === 'mix' && S.mix ? `Mix van ${S.mix[0]} en ${S.mix[1]}` : TYPE_NL[S.type]} · ${PERS[S.pe].e} ${PERS[S.pe].n}${S.h ? ` · ${STAGES[stageOf(S, now)].n}, ${Math.floor(ageDays(S, now))} dagen oud` : ' · nog in het ei'}<br>Lievelingseten: ${PERS[S.pe].fav.map((i) => FOOD[i].e).join(' ')} · Lust niet: ${PERS[S.pe].hate.map((i) => FOOD[i].e).join(' ')}<br>Niveau ${level()} · ${S.xp} xp</small></p></div>
    <div class="box"><b>Opnieuw beginnen</b><p><small>Dan krijg je een nieuw ei. Je huidige huisdier, munten en spullen verdwijnen.</small></p>${b('🥚 Opnieuw beginnen', 'restart')}</div>`;
  }

  /* ---------- acties ---------- */
  const needAwake = () => { if (sleepingNowS()) { say('Sst… ik slaap!'); return false; } return true; };
  function commit(panel = true) { changed(); paintTop(); paintLive(); if (panel) renderPanel(); }
  function refreshLook() { if (tab === 'shop') renderShop($('#hd-body')); else if (tab === 'home') { paintPet(true); renderPanel(); } }

  function applyFood(f) {
    if (!f) return;
    S.hunger = cp(S.hunger + f[0]); S.happy = cp(S.happy + f[1]); S.energy = cp(S.energy + f[2]); S.clean = cp(S.clean + f[3]);
  }
  function cure() {
    S.ill = 0; S.lw = 0; S.happy = cp(S.happy + 10);
    bump('cure'); addXp(10); say('Ik voel me veel beter! 💖'); sfx('yay'); fx('💖', 3); toast(`💖 ${S.name} is weer beter!`);
  }
  function applyGift(g) {
    const from = g.fromName || 'iemand';
    if (g.kind === 'coins') {
      const n = Math.max(0, Math.min(500, int(g.amount, 0)));
      S.coins += n; toast(`🪙 +${n} munten van ${from}!`);
    } else if (g.kind === 'food') {
      const f = FOOD[g.item] || FOODS.find((x) => x.e === g.item) || FOOD.koekje;
      addStock(f.id, 1); toast(`${f.e} ${f.n} van ${from}: staat in de voorraad!`);
    } else if (g.kind === 'toy') {
      S.happy = cp(S.happy + 15); S.bond = cp(S.bond + 2); say('Oooh, een cadeautje! 🎁'); fx('🎁'); toast(`🧸 Speelgoed van ${from}: ${S.name} is blij!`);
    } else {
      S.happy = cp(S.happy + 6); S.bond = cp(S.bond + 2); say('Een knuffelkaart! 🤗'); fx('🤗'); toast(`🤗 Knuffelkaart van ${from}`);
    }
    addXp(3); sfx('pet');
  }
  async function claimOne(id) {
    const g = cache.inbox && cache.inbox.find((x) => x.id === id);
    if (!g || g.claimed) return false;
    try { await soc.claimGift(db, me, id); }
    catch (e) { console.error(e); if (/al opgehaald|bestaat niet/.test(String(e && e.message))) g.claimed = true; toast('Dit cadeautje kon niet opgehaald worden'); return false; }
    g.claimed = true; applyGift(g); changed(); paintTop(); return true;
  }

  async function takePhoto() {
    if (!gate('photo', 3000)) return;
    const W = 720, HH = 600, now = Date.now();
    const R = ROOM[room] || ROOMS[0];
    const font = (px) => `${Math.round(px)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    const loadImg = (url) => new Promise((res, rej) => {
      const im = new Image(); im.crossOrigin = 'anonymous';
      const t = setTimeout(() => rej(new Error('te traag')), 4000);
      im.onload = () => { clearTimeout(t); res(im); }; im.onerror = () => { clearTimeout(t); rej(new Error('geen plaatje')); }; im.src = url;
    });
    const svgImg = (svg) => loadImg(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
    const draw = async (withImg) => {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = HH;
      const g = cv.getContext('2d');
      g.fillStyle = R.w; g.fillRect(0, 0, W, HH); g.fillStyle = R.f; g.fillRect(0, HH * R.sp / 100, W, HH);
      if (withImg && ar) g.drawImage(await svgImg(ar.roomSVG(S.hc, R.a, { night: nightOf(S, now), furniture: fpOf(room), width: W, height: HH })), 0, 0, W, HH);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const size = W * 0.38, px = W / 2 - size / 2, py = HH * fyOf(room) / 100 - size * 0.925;
      const stage = stageOf(S, now), mood = moodNow(S, now);
      if (S.type === 'mix' && S.mix) {
        const u = mixUrl(S.mix[0], S.mix[1]);
        if (u && withImg) { const im = await loadImg(u); g.drawImage(im, px + size * 0.04, py + size * 0.04, size * 0.92, size * 0.92); }
        else { g.font = font(size * 0.6); g.fillText(S.mix[0], px + size * 0.3, py + size * 0.5); g.font = font(size * 0.5); g.fillText(S.mix[1], px + size * 0.74, py + size * 0.6); }
      } else if (withImg && ART) {
        const svg = ART.petSVG(SPECIES_ID(S.type), { palette: S.hue || 0, stage: stage === 'ei' ? 'volwassen' : stage, mood: artMood(mood), outfit: outfitOf(S), size: 400 });
        g.drawImage(await svgImg(svg), px, py, size, size);
      } else { g.font = font(size * 0.8); g.fillText(TYPES[S.type] || '🐱', px + size / 2, py + size / 2); }
      g.font = 'bold 26px sans-serif'; g.fillStyle = 'rgba(70,50,90,.8)';
      g.fillText(`${S.name} · ${R.n} · ${new Date().toLocaleDateString('nl-NL')}`, W / 2, 30);
      return cv;
    };
    const toBlob = (cv) => new Promise((res, rej) => cv.toBlob((bl) => (bl ? res(bl) : rej(new Error('leeg'))), 'image/png'));
    try {
      let blob;
      try { blob = await toBlob(await draw(true)); } catch { blob = await toBlob(await draw(false)); }
      const u = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = u; a.download = `${S.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'huisdier'}-${room}.png`;
      document.body.appendChild(a); a.click(); a.remove(); later(() => URL.revokeObjectURL(u), 5000);
      bump('photo'); addXp(2); toast('📸 Foto opgeslagen!'); sfx('klaar'); changed();
    } catch (e) { console.error(e); toast('De foto maken lukte niet 😔'); }
  }

  const A = {
    snd() {
      pref.on = !pref.on;
      if (snd) { try { snd.setEnabled(pref.on); snd.unlock(); } catch { /* ok */ } }
      savePref(); sfx('tik'); paintTop(); if (tab === 'settings') render();
    },
    close() { closeModal(); },
    tab(el) {
      const v = el.dataset.v; if (game) endGame(true);
      destroyExtra(); destroyCook(); extraOpen = '';
      tab = v; sub = ''; edit = false; visit = null; plantFor = -1; closeModal();
      if (v === 'friends') { cache.inbox = null; fetchInbox(); }
      if (v === 'admin') cache.admin = null;
      if (v === 'games') refreshEvent();
      render();
    },
    awayok() { away = null; helpLines = []; migNote = 0; render(); },
    room(el) { destroyCook(); room = el.dataset.v; S.rm = room; sub = ''; edit = false; plantFor = -1; vet = null; render(); },
    edit() { edit = !edit; render(); },
    sub(el) { sub = el.dataset.v || ''; cookSel = []; renderPanel(); },
    cookopen() { if (!needAwake()) return; sub = 'koken'; cookSel = []; destroyCook(); sfx('tik'); renderPanel(); },
    eggtap() {
      const p = $('#hd-pet .hd-pet');
      if (p && !hatching) { p.classList.remove('hd-hug'); void p.offsetWidth; p.classList.add('hd-hug'); later(() => p.classList.remove('hd-hug'), 2200); }
      say('*tik tik* Het ei is lekker warm.', 2500); sfx('tik'); fx('💛');
    },
    petvoice() {
      if (!S.h) return;
      if (sleepingNowS()) { say('Zzz…', 2000); return; }
      if (!gate('pv', 700)) return;
      const now = Date.now();
      loveUntil = now + 2200;
      say(phraseFor(S, moodNow(S, now)), 3500); voice(); fx('💗'); paintPet(false);
    },
    // adopteren
    atype(el) { ad.type = el.dataset.v; if (ad.type === 'mix') loadMix(); sfx('tap'); renderAdopt($('#hd-body')); },
    ahue(el) { ad.hue = Number(el.dataset.v) || 0; renderAdopt($('#hd-body')); },
    aslot(el) { ad.slot = el.dataset.v; renderAdopt($('#hd-body')); },
    apick(el) { ad[ad.slot] = el.dataset.v; ad.slot = ad.slot === 'a' ? 'b' : 'a'; renderAdopt($('#hd-body')); },
    adopt() {
      const inp = $('#hd-name'); const name = (inp ? inp.value : ad.name).trim().slice(0, 16);
      if (!name) { toast('Geef je huisdier eerst een naam 💛'); if (inp) inp.focus(); return; }
      S = newPet({ type: ad.type, mix: [ad.a, ad.b], hue: ad.hue, name });
      lastDecay = Date.now(); wasSleep = false; wasNight = false; room = 'woon'; tab = 'home';
      ensureDaily(); checkAch(); changed(); flush(); sfx('yay'); render();
      toast(`🥚 ${name} is nog een ei. Over 2 minuten komt het uit!`);
    },
    // verzorgen
    feed(el) {
      const id = el.dataset.v; if (!S.h || !needAwake() || !FOOD[id] || !foodCount(id) || !gate('feed', 700)) return;
      if (S.hunger >= 97) return say('Ik zit helemaal vol, dankjewel!');
      const e = foodEffect(S, id); const f = FOOD[id];
      S.hunger = cp(S.hunger + e.hunger); S.happy = cp(S.happy + e.happy); S.energy = cp(S.energy + e.energy); S.clean = cp(S.clean + e.clean);
      takeFood(id); S.bond = cp(S.bond + (e.fav ? 3 : 1)); bump('feed');
      say(e.fav ? 'Mijn lievelingseten! 🥰' : e.hate ? 'Bleh… niet mijn favoriet. 😖' : 'Mmm, lekker! 😋');
      fx(f.e, e.fav ? 3 : 1); if (e.fav) fx('💕'); sfx(e.hate ? 'bad' : 'eat');
      addXp(4 + (f.dish ? 4 : 0) + (e.fav ? 3 : 0)); commit();
    },
    async dishfeed(el) {
      const i = Number(el.dataset.i); const d = S.dh[i];
      if (!d || !S.h || !needAwake() || !gate('dish', 700)) return;
      await ensureKoken();
      if (!alive || S.dh[i] !== d) return;
      if (S.hunger >= 97) return say('Ik zit helemaal vol, dankjewel!');
      const e = dishEffect(d), r = KR()[d.r];
      S.hunger = cp(S.hunger + e.hunger); S.happy = cp(S.happy + e.happy); S.energy = cp(S.energy + e.energy);
      if (e.health) { const low = NEEDS.reduce((m, k) => (S[k] < S[m] ? k : m), 'hunger'); S[low] = cp(S[low] + e.health); }
      S.dh.splice(i, 1); S.bond = cp(S.bond + (e.fav ? 3 : 1)); bump('feed');
      say(e.fav ? 'Mijn lievelingseten! 🥰' : e.hate ? 'Hmm… niet helemaal mijn smaak. 😖' : 'Mmm, wat een heerlijk gerecht! 😋');
      fx(r ? r.emoji : '🍽️', e.fav ? 3 : 2); sfx(e.hate ? 'bad' : 'eat');
      addXp(4 + d.s * 2 + (e.fav ? 3 : 0)); commit();
    },
    sell(el) {
      const id = el.dataset.v; const f = FOOD[id]; if (!f || !foodCount(id) || !gate('sell', 400)) return;
      takeFood(id); S.coins += f.sv; bump('sold'); sfx('munt'); toast(`${f.e} verkocht voor ${f.sv} 🪙`); commit();
    },
    csel(el) {
      const id = el.dataset.v;
      if (cookSel.includes(id)) cookSel = cookSel.filter((x) => x !== id);
      else if (cookSel.length < 2) cookSel.push(id);
      else cookSel = [cookSel[1], id];
      sfx('tap'); renderPanel();
    },
    cookclear() { cookSel = []; renderPanel(); },
    cookgo() {
      if (cookSel.length !== 2 || !needAwake() || !gate('cook', 800)) return;
      const [x, y] = cookSel;
      if (foodCount(x) < 1 || foodCount(y) < 1) { cookSel = []; toast('Dat ingrediënt is op'); return renderPanel(); }
      const d = cook(x, y);
      takeFood(x); takeFood(y);
      if (d) {
        const f = FOOD[d]; addStock(d, 1);
        const first = !S.rc.includes(d); if (first) { S.rc.push(d); S.coins += 5; }
        bump('cook'); addXp(8 + (first ? 10 : 0)); fx(f.e, 2); sfx('koken');
        toast(first ? `🎉 Nieuw gerecht: ${f.e} ${f.n}! +5 🪙` : `${f.e} ${f.n} is klaar!`); say('Mmm, dat ruikt lekker!');
      } else {
        S.coins += 2; addXp(1); sfx('bad'); toast('Mislukt 🫠 Troostprijs: 2 🪙'); say('Hm, dat ziet er raar uit…');
      }
      cookSel = []; commit();
    },
    pet() {
      if (!needAwake() || !gate('pet', 600)) return;
      S.happy = cp(S.happy + 3); S.bond = cp(S.bond + 1); bump('pet'); addXp(1); loveUntil = Date.now() + 2500;
      say(['Dat is fijn! 🥰', 'Mmm, nog een beetje!', 'Jij bent zo lief.', '*spint zachtjes*'][Math.floor(Math.random() * 4)], 3000); fx('💗'); sfx('knuffel'); commit(false); paintPet(false);
    },
    talk() { if (!needAwake()) return; say(phraseFor(S, moodNow(S, Date.now())), 5000); voice(); },
    wash() {
      if (!needAwake() || !gate('wash', 1200)) return;
      S.clean = cp(S.clean + 35); S.happy = cp(S.happy + 2); S.bond = cp(S.bond + 1); bump('wash'); addXp(4);
      say('Schoon en fris! 🫧'); fx('🫧', 4); sfx('plons'); later(() => sfx('poets'), 450); commit(false);
    },
    ball() {
      if (!needAwake() || !gate('ball', 1500)) return;
      if (S.ill) return say('Ik voel me te beroerd om te spelen…');
      if (S.energy < 12) return say('Ik ben te moe om te spelen… eerst een dutje?');
      S.happy = cp(S.happy + 20); S.energy = cp(S.energy - 10); S.clean = cp(S.clean - 3); S.bond = cp(S.bond + 1);
      bump('ball'); addXp(5); say('Wheee! Wat leuk! 🎾'); fx('🎾', 2); sfx('klaar'); commit(false);
    },
    nap() {
      if (sleepingNowS() || !gate('nap', 1000)) return;
      if (S.energy >= 95) return say('Ik ben helemaal uitgerust!');
      S.nap = Date.now() + 60000; S.energy = cp(S.energy + 40); S.happy = cp(S.happy + 2);
      bump('nap'); addXp(3); sfx('slaap'); changed(); render();
    },
    wake() {
      if (!sleepingNowS()) return;
      const now = Date.now();
      if (isNight(now)) { S.aw = now + 20 * MIN; bump('wake'); }
      S.nap = 0; S.happy = cp(S.happy - 8); S.grump = now + 45000;
      sfx('wakker'); changed(); render(); say(phraseFor(S, 'boos'), 5000);
    },
    use(el) {
      const id = el.dataset.v; const m = MED[id]; if (!m) return;
      if (!stock(id)) { toast(`Geen ${m.n} meer. Koop in de winkel (tab Medicijn).`); return; }
      if (m.cure && !S.ill) return say('Ik ben helemaal niet ziek!');
      if (!needAwake()) return;
      addStock(id, -1); applyFood(m.f); if (m.cure) cure(); else { say('Dankjewel, dat helpt!'); fx('💪'); sfx('eten'); }
      changed(); render();
    },
    vet() { if (!needAwake()) return; vetStart(); },
    vetpick(el) {
      if (!vet || vet.phase !== 'input') return;
      vet.input.push(Number(el.dataset.i)); sfx('tap');
      if (vet.input.length < 3) return renderPanel();
      if (vet.input.every((v, i) => v === vet.seq[i])) { vet = null; sub = ''; cure(); changed(); render(); }
      else { toast('Bijna! Probeer het nog eens 😊'); vetStart(); }
    },
    vetstop() { vet = null; sub = ''; renderPanel(); },
    photo() { takePhoto(); },
    // garderobe, meubels
    wear(el) {
      const it = ACC[el.dataset.v]; if (!it || !S.own.includes(it.id)) return;
      const k = SK[it.slot];
      if (S.wr[k] === it.id) delete S.wr[k]; else S.wr[k] = it.id;
      sfx('tik'); changed(); checkAch(); refreshLook();
    },
    prev(el) { const id = el.dataset.v; prevAcc = prevAcc === id ? '' : id; sfx('tik'); if (tab === 'shop') renderShop($('#hd-body')); },
    cslot(el) { clothSlot = el.dataset.v; prevAcc = ''; if (tab === 'shop') renderShop($('#hd-body')); },
    srm(el) { shopRoom = el.dataset.v; if (tab === 'shop') renderShop($('#hd-body')); },
    spot(el) {
      if (!ar) return;
      const i = Number(el.dataset.i); const arr = fpOf(room); const R = ROOM[room];
      const mine = ar.FURNITURE.filter((f) => f.room === R.a && S.own.includes(f.id));
      modal(`<b>Plek ${i + 1} in de ${R.n.toLowerCase()}</b>
        ${mine.length ? `<div class="hd-grid" style="margin:10px 0">${mine.map((f) => { const at = arr.indexOf(f.id); return `<div class="hd-card ${arr[i] === f.id ? 'on' : ''}" data-do="place" data-i="${i}" data-v="${f.id}" style="cursor:pointer"><div class="th">${furnSvg(f.id, 64)}</div>${esc(f.name)}${at >= 0 && at !== i ? `<br><small>nu op plek ${at + 1}</small>` : ''}</div>`; }).join('')}</div>` : '<p><small>Je hebt voor deze kamer nog geen meubels. Koop ze in het winkeltje 🛍️ (tab Meubels).</small></p>'}
        <div class="hd-acts">${b('Leeg maken', 'place', `data-i="${i}" data-v=""`)}${b('Sluiten', 'close')}</div>`);
    },
    place(el) {
      const i = Number(el.dataset.i), id = el.dataset.v; const arr = fpOf(room);
      if (!(i >= 0 && i < 6)) return;
      if (id && !(S.own.includes(id) && FURN_A[id] && FURN_A[id].room === ROOM[room].a)) return;
      if (id) arr.forEach((x, k) => { if (x === id) arr[k] = 0; });
      arr[i] = id || 0;
      closeModal(); sfx('meubel'); changed(); checkAch(); render();
    },
    // tuin
    plantat(el) { plantFor = Number(el.dataset.i); renderPanel(); },
    sow(el) {
      const id = el.dataset.v;
      if (plantFor < 0 || S.gd[plantFor] || !SEED[id] || !stock('z_' + id)) return;
      S.gd[plantFor] = [id, Date.now(), 0]; addStock('z_' + id, -1); plantFor = -1;
      bump('plant'); addXp(2); sfx('plant'); fx('🌱'); commit();
    },
    water(el) {
      const p = S.gd[Number(el.dataset.i)]; if (!p || p[2]) return;
      const g = growth({ s: p[0], t: p[1], w: 0 }, Date.now()); if (g.ready) return;
      p[2] = Date.now(); bump('water'); addXp(1); fx('💧', 3); sfx('drinken'); say('Slurp, lekker water! 💧'); commit();
    },
    harvest(el) {
      const i = Number(el.dataset.i); const p = S.gd[i]; if (!p) return;
      const g = growth({ s: p[0], t: p[1], w: p[2] }, Date.now()); if (!g.ready) return;
      const sd = SEED[p[0]], n = sd.y;
      addStock(ING_CROPS.has(p[0]) ? 'i_' + p[0] : p[0], n); S.gd[i] = 0; bump('harv', n); addXp(2 + n); fx(FOOD[p[0]].e, 3); sfx('oogst');
      toast(`${FOOD[p[0]].e} ×${n} geoogst! Je vindt ze in de keuken.`); commit();
    },
    // winkel
    stab(el) { shopTab = el.dataset.v; renderShop($('#hd-body')); },
    buy(el) {
      const k = el.dataset.k, id = el.dataset.v;
      let it = null, price = 0, lv = 0, label = '';
      if (k === 'food') { it = FOOD[id]; price = it ? it.p : 0; lv = it ? it.lv : 0; label = it ? it.e : ''; }
      else if (k === 'furn') { it = FURN_A[id]; price = it ? it.price : 0; lv = it ? it.minLevel : 0; label = it ? `🛋️ ${it.name}` : ''; }
      else if (k === 'cloth') { it = ACC[id]; price = it ? it.price : 0; lv = it ? it.minLevel : 0; label = it ? `${SLOT_EMO[it.slot]} ${it.name}` : ''; }
      else if (k === 'house') { it = HOUSE_A[id]; price = it ? it.price : 0; lv = it ? it.minLevel : 0; label = it ? `🏠 ${it.name}` : ''; }
      else if (k === 'seed') { it = SEED[id]; price = it ? it.p : 0; lv = it ? it.lv : 0; label = it ? FOOD[id].e : ''; }
      else if (k === 'med') { it = MED[id]; price = it ? it.p : 0; lv = it ? it.lv : 0; label = it ? it.e : ''; }
      else if (k === 'ing') { const i = ING()[id]; it = i; price = i ? ingPrice(i) : 0; label = i ? i.emoji : ''; }
      if (!it || !price || !gate('buy', 400)) return;
      const qty = k === 'ing' ? Math.max(1, Math.min(10, Math.floor(Number(el.dataset.n)) || 1)) : 1;
      if (lv && lv > level()) return toast(`Dit is er vanaf niveau ${lv}`);
      if (((k === 'furn' || k === 'cloth') && S.own.includes(id)) || (k === 'house' && S.hu.includes(id))) return;
      const total = price * qty;
      if (S.coins < total) return toast('Te weinig munten 🪙');
      spend(total);
      if (k === 'furn') S.own.push(id);
      else if (k === 'cloth') { S.own.push(id); S.wr[SK[it.slot]] = id; }
      else if (k === 'house') S.hu.push(id);
      else if (k === 'seed') addStock('z_' + id, 1);
      else if (k === 'ing') addStock('i_' + id, qty);
      else addStock(id, 1);
      bump('buy'); addXp(1); sfx(k === 'furn' || k === 'house' ? 'meubel' : 'koop');
      toast(k === 'house' ? `${label} is van jou! Verhuis hierheen wanneer je wilt.` : `${label}${qty > 1 ? ` ×${qty}` : ''} gekocht!`);
      changed(); paintTop(); render();
    },
    move(el) {
      const id = el.dataset.v; if (!S.hu.includes(id) || S.hc === id) return;
      S.hc = id; sfx('meubel'); toast(`🏠 ${(HOUSE_A[id] || {}).name || 'Nieuw huis'}: welkom thuis!`); changed(); checkAch(); render();
    },
    // doelen
    daily() {
      const today = dayKey(Date.now()); if (S.sd === today) return;
      S.sk = nextStreak(S.sd, today, S.sk); S.sd = today;
      const n = earn(dailyReward(S.sk)); addXp(10); bump('daily', 0);
      sfx('munt'); toast(`🎁 +${n} 🪙 · reeks ${S.sk} dag${S.sk === 1 ? '' : 'en'}!`); changed(); render();
    },
    quest(el) {
      const q = S.ql[Number(el.dataset.i)]; if (!q || q.d || !questProgress(q).done) return;
      q.d = 1; const n = earn(q.r); addXp(15); bump('quest'); sfx('munt'); toast(`📋 Opdracht gehaald: +${n} 🪙`); changed(); render();
    },
    // spelletjes en extra
    play(el) {
      if (!gm || !Array.isArray(gm.GAMES)) return;
      const g = gm.GAMES.find((x) => x.id === el.dataset.id); if (!g) return;
      if (game) endGame(false);
      tab = 'games'; game = { g, score: 0, done: false, inst: null }; render();
    },
    gstop() { if (game) endGame(true); render(); },
    xopen(el) { if (!ex || !ex.EXTRAS.some((x) => x.id === el.dataset.v)) return; extraOpen = el.dataset.v; sfx('tik'); render(); },
    xback() { destroyExtra(); extraOpen = ''; sfx('terug'); render(); },
    // vrienden
    ftab(el) { ftab = el.dataset.v; if (ftab === 'inbox') cache.inbox = null; render(); },
    rankby(el) { rankBy = el.dataset.v; render(); },
    frefresh() { cache.pets = null; render(); },
    permretry() { permsErr = ''; myPerms = null; render(); },
    async permtoggle(el) {
      const uid = el.dataset.uid; if (!uid || myPerms === null || !gate('perm', 600)) return;
      const next = myPerms.includes(uid) ? myPerms.filter((x) => x !== uid) : [...myPerms, uid];
      try { await soc.setPerms(db, me, next); myPerms = next; sfx('tik'); }
      catch (e) { console.error(e); toast(/Maximaal/.test(String(e && e.message)) ? 'Je kunt maximaal 10 vrienden kiezen' : 'Opslaan lukte niet 😔'); }
      if (alive && tab === 'friends' && !visit) render();
    },
    visit(el) {
      const others = (cache.pets || []).filter((p) => p.uid !== me.uid); const p = others[Number(el.dataset.i)]; if (!p) return;
      visit = p; visitRoom = 'woon'; delete permCache[p.uid];
      if (!visited.has(p.uid)) { visited.add(p.uid); bump('visit'); changed(); }
      render();
    },
    vback() { visit = null; render(); },
    vroom(el) { visitRoom = ROOM[el.dataset.v] ? el.dataset.v : 'woon'; render(); },
    vhug() {
      const p = $('#hd-vpet .hd-pet'); if (!p || !gate('vhug', 1500)) return;
      p.classList.remove('hd-hug'); void p.offsetWidth; p.classList.add('hd-hug'); fx('🤗'); fx('💛', 2); sfx('knuffel');
      later(() => p.classList.remove('hd-hug'), 2200);
    },
    async help(el) {
      const act = el.dataset.v, h = HELP[act];
      if (!visit || !h || !soc || !soc.sendHelp || !gate('help', 1500)) return;
      const p = visit;
      if (permCache[p.uid] !== true) return;
      if (helpUsed(p.uid) >= HELP_MAX) return toast('Vandaag heb je genoeg geholpen 💛 Morgen weer!');
      try { await soc.sendHelp(db, me, p.uid, p.name, act, h.e); }
      catch (e) {
        console.error(e);
        const denied = /toestemming/.test(String(e && e.message));
        if (denied) permCache[p.uid] = false;
        toast(denied ? 'Je mag niet (meer) helpen bij dit huisdier' : 'Helpen lukte niet 😔');
        if (alive && visit === p && tab === 'friends') render();
        return;
      }
      helpCount(p.uid); S.bond = cp(S.bond + 1); addXp(2); sfx('help'); changed(); paintTop();
      toast(`${h.e} Je hebt ${p.s.name} ${h.v}!`);
      if (alive && visit === p && tab === 'friends') render();
    },
    giftopen() {
      if (!visit) return;
      const food = FOODS.filter((f) => f.p && !f.lv);
      const dis = (cost) => (S.coins < cost ? 'disabled' : '');
      modal(`<b>🎁 Cadeautje voor ${esc(visit.s.name)}</b><p><small>Je hebt ${S.coins} 🪙</small></p>
        <p style="margin:8px 0 2px"><b>Eten</b> <small>(${GIFT_COST.food} 🪙)</small></p><div class="hd-grid">${food.map((f) => `<button data-do="giftsend" data-k="food" data-v="${f.id}" ${dis(GIFT_COST.food)} style="font-size:26px">${f.e}</button>`).join('')}</div>
        <p style="margin:8px 0 2px"><b>Speelgoed</b> <small>(${GIFT_COST.toy} 🪙)</small></p><div class="hd-grid">${TOYS.map(([id, e]) => `<button data-do="giftsend" data-k="toy" data-v="${id}" ${dis(GIFT_COST.toy)} style="font-size:26px">${e}</button>`).join('')}</div>
        <p style="margin:8px 0 2px"><b>Knuffelkaart</b> <small>(gratis)</small></p><button data-do="giftsend" data-k="hug" data-v="hug" style="font-size:26px">🤗</button>
        <p>${b('Sluiten', 'close')}</p>`);
    },
    async giftsend(el) {
      const k = el.dataset.k, id = el.dataset.v; const cost = GIFT_COST[k];
      if (!visit || cost === undefined || !gate('gift', 1500)) return;
      if (S.coins < cost) return toast('Te weinig munten 🪙');
      let label = '🤗 Knuffelkaart';
      if (k === 'food' && FOOD[id]) label = `${FOOD[id].e} ${FOOD[id].n}`;
      else if (k === 'toy') { const t = TOYS.find((x) => x[0] === id); if (!t) return; label = `${t[1]} ${t[2]}`; }
      const target = visit;
      closeModal();
      try { await soc.sendGift(db, me, target.uid, target.name, { kind: k, item: id, label }); }
      catch (e) { console.error(e); toast('Het cadeautje versturen lukte niet 😔'); return; }
      S.coins -= cost; bump('gift'); addXp(5); sfx('cadeau'); toast(`🎁 Cadeautje voor ${target.s.name} is onderweg!`); changed(); paintTop();
    },
    async claim(el) { if (await claimOne(el.dataset.id)) { render(); } },
    async claimall() {
      if (!cache.inbox) return;
      let n = 0;
      for (const g of cache.inbox.filter((x) => !x.claimed)) { if (await claimOne(g.id)) n++; if (!alive) return; }
      if (n) sfx('cadeau');
      render();
    },
    // admin
    adminrefresh() { cache.admin = null; render(); },
    async acoins(el) {
      const p = (cache.admin || [])[Number(el.dataset.i)]; if (!p || !me.admin) return;
      const inp = $(`#hd-ac-${el.dataset.i}`); const n = Math.floor(Number(inp && inp.value));
      if (!(n >= 1 && n <= 500)) return toast('Kies een aantal van 1 tot 500');
      if (!gate('acoins', 1000)) return;
      try { await soc.adminCoins(db, me, p.uid, p.name, n); toast(`🪙 ${n} munten gestuurd naar ${p.name}`); }
      catch (e) { console.error(e); toast('Munten sturen lukte niet'); }
    },
    async evsave() {
      const title = ($('#hd-ev-t') || {}).value ? $('#hd-ev-t').value.trim() : '';
      const m = Number($('#hd-ev-m').value); const d = $('#hd-ev-d').value;
      if (!title) return toast('Geef het evenement een titel');
      const until = new Date(`${d}T23:59:59`).getTime();
      if (!Number.isFinite(until) || until < Date.now()) return toast('Kies een einddatum in de toekomst');
      try { await soc.setEvent(db, me, { title, mult: m, until }); ev = { title, mult: m, until }; toast('🎉 Evenement gestart!'); render(); }
      catch (e) { console.error(e); toast('Het evenement opslaan lukte niet'); }
    },
    async evstop() {
      try { await soc.setEvent(db, me, null); ev = null; toast('Evenement gestopt'); render(); }
      catch (e) { console.error(e); toast('Stoppen lukte niet'); }
    },
    // instellingen
    rename() {
      const v = ($('#hd-rename').value || '').trim().slice(0, 16);
      if (!v) return toast('Een naam is nodig');
      S.name = v; changed(); paintTop(); toast('Naam opgeslagen ✓');
    },
    hue(el) { S.hue = (Number(el.dataset.v) || 0) % NPAL; changed(); sfx('tap'); render(); },
    restart() {
      modal(`<div style="font-size:40px">🥚</div><b>Opnieuw beginnen?</b><p><small>${esc(S.name)}, je munten en al je spullen verdwijnen. Dit kan niet ongedaan gemaakt worden.</small></p><div class="hd-acts">${b('Ja, opnieuw', 'restartgo')}${b('Nee, laat maar', 'close', '', 'pri')}</div>`);
    },
    async restartgo() {
      closeModal(); destroyCook(); destroyExtra(); extraOpen = ''; stopLoops();
      if (saveT) { clearTimeout(saveT); saveT = null; }
      dirty = false; S = null; away = null; helpLines = []; migNote = 0; tab = 'home'; sub = ''; edit = false; room = 'woon'; ad = { type: 'kat', a: '🐱', b: '🐼', slot: 'a', hue: 0, name: '' };
      try { localStorage.removeItem(lsKey); } catch { /* ok */ }
      try { await setDoc(ref, { data: '', updated: Date.now() }); } catch (e) { console.error(e); }
      render();
    },
  };

  /* ---------- eieren uitbroeden ---------- */
  function startHatch() {
    if (hatching || S.h) return;
    hatching = true; sfx('kraak'); say('*krak krak*', 2600); paintPet(true);
    later(finishHatch, 2500);
  }
  function finishHatch() {
    hatching = false;
    if (!S || S.h) return;
    const now = Date.now();
    S.h = now; S.last = now; S.hunger = S.happy = S.energy = S.clean = 80;
    S.coins += 15; addXp(20); checkAch(); sfx('uitgekomen'); changed(); wasSleep = sleepingNowS(); wasNight = nightOf(S, now);
    if (tab === 'home') render();
    const p = PERS[S.pe];
    modal(`${confetti()}<div style="font-size:54px">🐣</div><h3>${esc(S.name)} is uitgekomen!</h3>
      <div style="width:140px;height:140px;margin:0 auto">${petHTML(S, now, { mood: 'blij' })}</div>
      <p>Karakter: <b>${p.e} ${p.n}</b><br><small>Lievelingseten: ${p.fav.map((i) => FOOD[i].e).join(' ')} · Lust liever niet: ${p.hate.map((i) => FOOD[i].e).join(' ')}</small></p>
      <p>+15 🪙 en +20 xp als welkomstcadeau!</p><button class="pri" data-do="close">Hoi ${esc(S.name)}! 💛</button>`);
  }


  /* ---------- klok ---------- */
  let lastFlush = Date.now();
  function tick() {
    if (!S) return;
    const now = Date.now();
    if (!S.h) { if (hatchDue(S, now) && !hatching) startHatch(); paintLive(); return; }
    if (now - lastDecay >= 20000) {
      const was = S; S = applyTime(S, now); lastDecay = now;
      dirty = true; saveLocal();
      if (S.ill && !was.ill) { sfx('ziek'); toast(`🤒 ${S.name} voelt zich niet zo lekker. Medicijn of de dierenarts helpt!`); if (tab === 'home') render(); }
    }
    if (dirty && now - lastFlush > 180000) { lastFlush = now; flush(); }
    if (S.qd !== dayKey(now)) { ensureDaily(); paintNav(); if (tab === 'goals') render(); }
    const sl = sleepingNowS(), nt = nightOf(S, now);
    if (sl !== wasSleep || nt !== wasNight) {
      const woke = wasSleep && !sl;
      wasSleep = sl; wasNight = nt;
      if (woke) { say('Lekker geslapen! ☀️', 5000); sfx('wakker'); }
      else if (sl) sfx('slaap');
      if (tab === 'home') render();
    }
    syncLoops();
    if (now - lastEv > 5 * MIN) refreshEvent();
    if (now - lastHelp > 5 * MIN) applyHelps();
    paintLive();
  }

  /* ---------- hulp van vrienden toepassen ("Terwijl je weg was") ---------- */
  async function applyHelps() {
    lastHelp = Date.now();
    if (!S || !S.h || !hasSoc() || typeof soc.listHelps !== 'function') return;
    let list;
    try { list = await soc.listHelps(db, me); } catch (e) { console.error(e); return; }
    if (!alive || !S || !S.h || !Array.isArray(list) || !list.length) return;
    let n = 0;
    for (const hp of list.slice(0, 6)) {
      const h = HELP[hp.action];
      if (!h) { try { await soc.markHelpApplied(db, me, hp.id); } catch (e) { console.error(e); } continue; }
      for (const [k, v] of Object.entries(h.fx)) S[k] = cp(S[k] + v);
      helpLines.push(`${String(hp.fromName || 'Iemand').slice(0, 20)} heeft ${S.name} ${h.v} ${h.e}`);
      n++;
      try { await soc.markHelpApplied(db, me, hp.id); } catch (e) { console.error(e); }
      if (!alive || !S) return;
    }
    if (n) { sfx('help'); changed(); paintTop(); if (tab === 'home' && S.h) render(); }
  }

  /* ---------- koppelen ---------- */
  view.onclick = (e) => {
    onFirstTap();
    if (e.target && e.target.id === 'hd-modal') return closeModal();
    const el = e.target.closest && e.target.closest('[data-do]');
    if (!el || el.disabled || !view.contains(el)) return;
    const fn = A[el.dataset.do]; if (!fn) return;
    try { const r = fn(el); if (r && typeof r.catch === 'function') r.catch((err) => { console.error(err); toast('Oeps, dat lukte niet'); }); }
    catch (err) { console.error(err); toast('Oeps, dat lukte niet'); }
  };
  view.oninput = (e) => {
    const t = e.target; if (!t || !t.dataset) return;
    if (t.dataset.in === 'aname') ad.name = t.value;
    else if (t.dataset.in === 'vol') { pref.vol = Math.max(0, Math.min(1, (Number(t.value) || 0) / 100)); if (snd) { try { snd.setVolume(pref.vol); } catch { /* ok */ } } savePref(); }
  };
  view.onchange = (e) => { const t = e.target; if (t && t.dataset && t.dataset.in === 'vol') { onFirstTap(); sfx('munt'); } };
  view.onkeydown = (e) => { if (e.key === 'Enter' && e.target && e.target.id === 'hd-name') A.adopt(); };
  const onImgErr = (e) => {
    const t = e.target;
    if (t && t.tagName === 'IMG' && t.classList.contains('hd-mixi')) {
      const w = document.createElement('span'); w.innerHTML = mixFallback(t.dataset.a, t.dataset.b); t.replaceWith(w.firstChild);
    }
  };
  view.addEventListener('error', onImgErr, true);
  const onVisible = () => { if (document.visibilityState === 'visible') tick(); else flush(); };
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('pagehide', onPageHide);
  addCleanup(() => {
    alive = false;
    timers.forEach((t) => { clearTimeout(t); clearInterval(t); }); timers.clear();
    try { endGame(true); } catch (e) { console.error(e); }
    for (const i of [...liveGames]) { try { if (i.destroy) i.destroy(); } catch (e) { console.error(e); } }
    liveGames.clear();
    destroyExtra(); destroyCook(); stopLoops();
    document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('pagehide', onPageHide);
    view.removeEventListener('error', onImgErr, true); view.removeEventListener('pointerdown', onFirstTap, true);
    view.onclick = null; view.oninput = null; view.onchange = null; view.onkeydown = null;
    if (snd) { try { snd.destroy(); } catch { /* ok */ } snd = null; }
    flush();
  });

  /* ---------- start ---------- */
  view.innerHTML = '<div class="hd-root"><div id="hd-top" class="hd-top"></div><div id="hd-banner"></div><div id="hd-nav" class="hd-nav"></div><div id="hd-body"><p class="center"><small>Laden…</small></p></div></div>';
  await Promise.all([
    load(),
    import('./huisdier-games.js?v=1').then((m) => { gm = m; }).catch((e) => { console.error(e); gmErr = 'De spelletjes konden niet geladen worden.'; }),
    import('./huisdier-social.js?v=1').then((m) => { soc = m; }).catch((e) => { console.error(e); socErr = 'De vriendenfunctie kon niet geladen worden.'; }),
    import('./huisdier-art-pets.js?v=1').then((m) => { setArt(m); }).catch((e) => { console.error(e); }),
    import('./huisdier-art-rooms.js?v=1').then((m) => { ar = m; for (const f of m.FURNITURE || []) FURN_A[f.id] = f; for (const h of m.HOUSES || []) HOUSE_A[h.id] = h; }).catch((e) => { console.error(e); }),
    import('./huisdier-sound.js?v=1').then((m) => { snd = m.createSound(); snd.setEnabled(pref.on); snd.setVolume(pref.vol); }).catch((e) => { console.error(e); snd = null; }),
    ensureExtra(),
  ]);
  if (!alive) return;
  if (S) {
    if (S.mg) { migNote = S.mg; S.mg = 0; }
    ensureDaily();
    const got = checkAch();
    if (got.length > 2) toast(`🏆 ${got.length} prestaties vrijgespeeld!`);
    wasSleep = sleepingNowS(); wasNight = nightOf(S, Date.now());
    if (S.type === 'mix') loadMix();
    room = S.rm && ROOM[S.rm] ? S.rm : 'woon';
    changed();
  }
  refreshEvent();
  if (hasSoc()) fetchInbox();
  render();
  every(tick, 1000);
  applyHelps();
}
