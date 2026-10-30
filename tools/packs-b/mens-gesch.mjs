// Mens- en Geschiedenis-packs.
import { kit } from './lib.mjs';

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const yr = (n) => (n < 0 ? `${-n} v.Chr.` : String(n));

/* ---------------- MENS ---------------- */
function lichaam() {
  const K = kit({ id: 'mens-lichaam', name: 'Mijn lichaam', emoji: '🧍', group: 'Mens', desc: 'Lichaamsdelen, tanden, huid en hoe je lijf werkt.' });
  K.mcs([
    ['Hoeveel vingers heb je aan beide handen samen?', '10', ['8', '12', '5'], ''],
    ['Hoeveel tenen heb je aan beide voeten samen?', '10', ['8', '12', '5'], ''],
    ['Hoeveel tanden heeft een kind met een volledig melkgebit?', '20', ['32', '28', '16'], ''],
    ['Hoeveel tanden heeft een volwassene met een volledig gebit (met verstandskiezen)?', '32', ['20', '28', '36'], ''],
    ['Hoe heet de eerste set tanden die uitvalt?', 'melkgebit', ['kunstgebit', 'verstandsgebit', 'blijvend gebit'], ''],
    ['Hoe vaak per dag moet je je tanden poetsen?', '2 keer', ['1 keer per week', '5 keer', 'nooit'], 'Poets elke ochtend en avond, ongeveer 2 minuten.'],
    ['Wat is het grootste orgaan van je lichaam?', 'de huid', ['het hart', 'de long', 'de lever'], ''],
    ['Wat doet je huid?', 'beschermt je lichaam', ['maakt je sneller', 'zorgt voor geluid', 'maakt stroom'], ''],
    ['Hoeveel graden is de normale lichaamstemperatuur?', 'ongeveer 37', ['ongeveer 20', 'ongeveer 50', 'ongeveer 10'], ''],
    ['Wat is koorts?', 'een te hoge lichaamstemperatuur', ['een te lage temperatuur', 'een soort hoest', 'een snijwond'], 'Vanaf ongeveer 38 graden spreek je van koorts.'],
    ['Wat gebeurt er met je hartslag als je rent?', 'hij gaat omhoog', ['hij gaat omlaag', 'hij stopt', 'hij verandert niet'], ''],
    ['Waarvoor gebruik je je spieren?', 'om te bewegen', ['om te horen', 'om te ruiken', 'om te proeven'], ''],
    ['Hoeveel uur slaap hebben kinderen van 6 tot 12 jaar ongeveer nodig?', '9 tot 11 uur', ['4 tot 5 uur', '14 tot 16 uur', '2 uur'], ''],
    ['Waarom moet je handen wassen met zeep?', 'om bacteriën en virussen weg te halen', ['om je handen blauw te maken', 'omdat het leuk is', 'om ze droog te maken'], ''],
    ['Wat kun je doen als je niezen moet?', 'in je elleboog niezen', ['in je hand niezen', 'op iemand niezen', 'je adem inhouden'], ''],
    ['Welk lichaamsdeel zit tussen je hand en elleboog?', 'de onderarm', ['de bovenarm', 'de schouder', 'de pols'], ''],
    ['Welk lichaamsdeel zit tussen je knie en voet?', 'de onderbeen (scheenbeen en kuit)', ['de dij', 'de heup', 'de elleboog'], ''],
    ['Hoe heet het gewricht in het midden van je been?', 'de knie', ['de elleboog', 'de pols', 'de enkel'], ''],
    ['Hoe heet het gewricht in het midden van je arm?', 'de elleboog', ['de knie', 'de enkel', 'de heup'], ''],
    ['Wat zit er in je mond waarmee je proeft?', 'de tong', ['de tand', 'het gehemelte alleen', 'de wang'], ''],
    ['Waar zitten je vingerafdrukken?', 'op de toppen van je vingers', ['op je voeten alleen', 'op je rug', 'in je oren'], ''],
    ['Wat is een blauwe plek?', 'bloed onder je huid na een stoot', ['een soort verf', 'een brandwond', 'een bacterie'], ''],
    ['Wat gebeurt er als je een wond hebt en het stopt met bloeden?', 'er vormt zich een korstje', ['de wond groeit dicht met haar', 'het bloed wordt blauw', 'er gebeurt niets'], ''],
    ['Wat is een allergie?', 'je lichaam reageert sterk op iets onschuldigs', ['een soort sport', 'een kleur', 'een gewricht'], ''],
    ['Waarom heb je haar op je hoofd?', 'het beschermt tegen zon en kou', ['om te horen', 'om te ruiken', 'om te rennen'], ''],
    ['Hoeveel procent van je lichaam is ongeveer water?', 'ongeveer 60%', ['ongeveer 10%', 'ongeveer 25%', 'ongeveer 100%'], ''],
    ['Hoeveel liter water moet je ongeveer per dag drinken (kind)?', 'ongeveer 1 tot 1,5 liter', ['ongeveer 10 liter', 'ongeveer 0,1 liter', 'helemaal niets'], ''],
  ]);
  K.groups({ 'zit op je hoofd': ['oor', 'neus', 'wenkbrauw', 'wang', 'kin', 'voorhoofd', 'mond'], 'zit aan je arm of hand': ['elleboog', 'pols', 'duim', 'vinger', 'schouder'], 'zit aan je been of voet': ['knie', 'enkel', 'teen', 'hiel', 'dij', 'kuit'] }, { which: (it) => `Waar zit je ${it}?`, tfq: (it, c) => `Je ${it} ${c}.`, multi: (n) => `Welke lichaamsdelen ${n}? (kies alle goede)`, reps: 4, d: 1 });
  K.tfs([['Je hebt twee longen.', true], ['Je hart is ongeveer zo groot als je vuist.', true], ['Je hebt vier ogen.', false], ['Je ademt met je lever.', false, 'Je ademt met je longen.'], ['Een volwassene heeft 206 botten.', true], ['Je tong helpt je proeven.', true], ['Slapen is niet belangrijk.', false], ['Je moet elke dag water drinken.', true], ['Je huid groeit nooit meer dicht als je hem schaaft.', false], ['Je hebt vijf vingers aan elke hand.', true]]);
  return K.out();
}

function botten() {
  const K = kit({ id: 'mens-botten-organen', name: 'Botten en organen', emoji: '🦴', group: 'Mens', desc: 'Het skelet en wat de organen in je lichaam doen.' });
  K.facts([['de schedel', 'beschermt je hersenen'], ['de ribben', 'beschermen je hart en longen'], ['de wervelkolom', 'houdt je rug rechtop en beschermt het ruggenmerg'], ['het dijbeen', 'het langste bot'], ['het borstbeen', 'het platte bot midden op je borst'], ['het sleutelbeen', 'verbindt je schouder met je borstbeen'], ['de kniescheibe', 'beschermt je knie'], ['de stijgbeugel', 'het kleinste bot, in je oor'], ['het bekken', 'het bot waar je op zit'], ['de onderkaak', 'het enige beweegbare bot in je gezicht']].map((r) => [r[0], r[1], '', {}]), { f: (k) => `Wat weet je over ${k}?`, r: (v) => `Over welk bot gaat dit: ${v}?`, t: (k, v) => `${cap(k)}: ${v}.`, type: false, typeMax: 0, d: 2 });
  K.facts([['het hart', 'pompt bloed rond', '', { e: '🫀', d: 1 }], ['de longen', 'ademen zuurstof in', '', { e: '🫁', d: 1 }], ['de maag', 'verteert eten met maagzuur', '', { d: 2 }], ['de hersenen', 'sturen je lichaam aan en laten je denken', '', { e: '🧠', d: 1 }], ['de nieren', 'filteren je bloed en maken plas', '', { d: 2 }], ['de lever', 'maakt gal en reinigt je bloed', '', { d: 3 }], ['de dunne darm', 'neemt voedingsstoffen op', '', { d: 3 }], ['de dikke darm', 'haalt water uit restafval', '', { d: 3 }], ['de blaas', 'bewaart plas', '', { d: 2 }], ['de slokdarm', 'brengt eten naar je maag', '', { d: 2 }], ['de luchtpijp', 'brengt lucht naar je longen', '', { d: 2 }], ['de alvleesklier', 'maakt insuline en verteringssap', '', { d: 3 }], ['de milt', 'filtert oud bloed', '', { d: 3 }], ['de spieren', 'laten je bewegen', '', { d: 1 }], ['de huid', 'beschermt je lichaam', '', { d: 1 }]].map((r) => [r[0], r[1], '', r[3]]), { f: (k) => `Wat is de taak van ${k}?`, r: (v) => `Welk lichaamsdeel doet dit: "${v}"?`, t: (k, v) => `${cap(k)}: ${v}.`, type: false, typeMax: 0, d: 2 });
  K.mcs([
    ['Hoeveel botten heeft een volwassene ongeveer?', '206', ['106', '300', '50'], ''],
    ['Hebben baby\'s meer of minder botten dan volwassenen?', 'meer', ['minder', 'precies evenveel', 'geen botten'], 'Veel botten groeien later aan elkaar vast.'],
    ['Hoe heet de plek waar twee botten samenkomen?', 'een gewricht', ['een spier', 'een pees', 'een huid'], ''],
    ['Waaruit bestaat een spier-verbinding naar het bot?', 'een pees', ['een zenuw', 'een ader', 'een kraakbeen'], ''],
    ['Wat vervoert bloed door je lichaam?', 'zuurstof en voedingsstoffen', ['alleen water', 'alleen lucht', 'alleen warmte'], ''],
    ['Hoe heten de buizen waarin bloed wegstroomt van je hart?', 'slagaders', ['aders', 'darmen', 'zenuwen'], 'Terug naar het hart gaat het door aders.'],
    ['Hoe voel je je hartslag?', 'bij je pols of hals', ['bij je knie', 'bij je oor', 'bij je teen'], ''],
    ['Hoe vaak klopt je hart in rust ongeveer per minuut (kind)?', '70 tot 100 keer', ['10 keer', '300 keer', '1000 keer'], ''],
    ['Wat is de belangrijkste taak van rode bloedcellen?', 'zuurstof vervoeren', ['ziektes doden', 'het bloed stollen', 'eten verteren'], ''],
    ['Wat doen witte bloedcellen?', 'ze bestrijden ziektekiemen', ['ze vervoeren zuurstof', 'ze maken botten', 'ze maken spieren'], ''],
    ['Welk orgaan zit in je borstkas links van het midden (grotendeels)?', 'het hart', ['de maag', 'de lever', 'de blaas'], ''],
    ['Hoeveel longen heb je?', '2', ['1', '3', '4'], ''],
    ['Wat adem je in?', 'zuurstof', ['koolstofdioxide', 'stikstof alleen', 'rook'], 'Je ademt zuurstof in en CO₂ uit.'],
    ['Wat adem je uit?', 'koolstofdioxide (CO₂)', ['zuurstof alleen', 'stikstof alleen', 'rook'], ''],
    ['Hoe heet de weg van eten door je lichaam?', 'het spijsverteringsstelsel', ['het ademhalingsstelsel', 'het zenuwstelsel', 'het skelet'], ''],
    ['Waar begint de vertering van eten?', 'in je mond', ['in je maag', 'in je darm', 'in je neus'], 'Daar kauw je en zit speeksel.'],
    ['Hoe heet het sap in je mond dat helpt bij de vertering?', 'speeksel', ['gal', 'maagzuur', 'bloed'], ''],
    ['Welk orgaan maakt bij mensen plas?', 'de nieren', ['de lever', 'de maag', 'de milt'], ''],
    ['Wat stuurt berichten door je lichaam?', 'zenuwen', ['aders', 'darmen', 'botten'], ''],
    ['Waar liggen je hersenen?', 'in je hoofd', ['in je buik', 'in je borst', 'in je knie'], ''],
  ]);
  K.tfs([['Het langste bot zit in je been.', true], ['Het hart pompt bloed.', true], ['De hersenen liggen in de buik.', false], ['Je hebt een ruggengraat.', true], ['Een gebroken bot kan weer aan elkaar groeien.', true], ['Je ribben beschermen je darmen.', false, 'Ze beschermen hart en longen.'], ['Je maag verteert je eten.', true], ['Zenuwen sturen berichten naar je hersenen.', true]]);
  K.num('Ongeveer hoeveel botten heeft een volwassene?', 206, { d: 3, tol: 5 });
  K.num('Hoeveel longen heeft een mens?', 2, { d: 1 });
  K.order('Zet de weg van je eten in volgorde', ['mond', 'slokdarm', 'maag', 'dunne darm', 'dikke darm'], { d: 2 });
  K.fill('Je hart pompt het ___ door je lichaam.', 'bloed', ['bloed', 'water', 'eten', 'lucht'], { d: 1 });
  K.type('Welk orgaan gebruik je om te denken?', 'hersenen', ['de hersenen', 'brein'], { d: 1 });
  return K.out();
}

function zintuigen() {
  const K = kit({ id: 'mens-zintuigen', name: 'Zintuigen', emoji: '👀', group: 'Mens', desc: 'Zien, horen, ruiken, proeven en voelen: hoe werken je zintuigen?' });
  K.facts([['zien', 'de ogen', '', { e: '👁️', d: 1 }], ['horen', 'de oren', '', { e: '👂', d: 1 }], ['ruiken', 'de neus', '', { e: '👃', d: 1 }], ['proeven', 'de tong', '', { e: '👅', d: 1 }], ['voelen', 'de huid', '', { e: '🖐️', d: 1 }]].map((r) => [r[0], r[1], '', r[3]]), { f: (k) => `Welk lichaamsdeel gebruik je om te ${k}?`, r: (v) => `Wat doe je vooral met ${v}?`, t: (k, v) => `Om te ${k} gebruik je ${v}.`, pool: ['de ogen', 'de oren', 'de neus', 'de tong', 'de huid'], d: 1, type: false });
  K.mcs([
    ['Hoeveel zintuigen heb je (de bekendste)?', '5', ['3', '4', '7'], 'Zien, horen, ruiken, proeven en voelen.'],
    ['Welke smaken kun je met je tong proeven?', 'zoet, zuur, zout en bitter', ['alleen zoet', 'rood en blauw', 'warm en koud'], 'Ook umami (hartig).'],
    ['Wat is het zwarte rondje in het midden van je oog?', 'de pupil', ['de iris', 'het netvlies', 'het ooglid'], ''],
    ['Wat is het gekleurde deel van je oog?', 'de iris', ['de pupil', 'het ooglid', 'de wimper'], ''],
    ['Wat gebeurt er met je pupil in fel licht?', 'hij wordt kleiner', ['hij wordt groter', 'hij verdwijnt', 'niets'], ''],
    ['Waar komt het beeld in je oog terecht?', 'op het netvlies', ['op het ooglid', 'op de wimper', 'op de wenkbrauw'], ''],
    ['Wat doet het oor behalve horen?', 'helpt bij je evenwicht', ['helpt je ruiken', 'helpt je proeven', 'helpt je zien'], ''],
    ['Hoe heet het deel van het oor dat je aan de buitenkant ziet?', 'de oorschelp', ['het trommelvlies', 'de oorbel', 'de gehoorgang'], ''],
    ['Wat trilt in je oor door geluid?', 'het trommelvlies', ['de oorschelp', 'de neusbrug', 'het ooglid'], ''],
    ['Waardoor zie je een kleur?', 'door licht dat terugkaatst in je ogen', ['door geluid', 'door geur', 'door wind'], ''],
    ['Wat is de kleine, gevoelige huid op je vingertoppen goed in?', 'voelen', ['zien', 'horen', 'ruiken'], ''],
    ['Wat is braille?', 'leesschrift met bultjes voor blinden', ['een soort muziek', 'een kleur', 'een taal met geluiden'], ''],
    ['Wat is gebarentaal?', 'een taal met handbewegingen, voor mensen die niet horen', ['een taal met geluiden', 'een soort dans', 'een soort tekening'], ''],
    ['Hoe heten glazen die helpen beter te zien?', 'een bril', ['een hoed', 'een masker', 'een helm'], ''],
    ['Waarom heb je twee ogen?', 'om diepte te zien', ['om dubbel te zien', 'voor de kleur', 'om te huilen'], ''],
    ['Wat is kleurenblind?', 'sommige kleuren moeilijk kunnen onderscheiden', ['alleen zwart-wit zien altijd', 'niets zien', 'in het donker zien'], ''],
    ['Hoe heten de haartjes in je oor die geluid doorgeven?', 'trilhaartjes', ['wimpers', 'snorharen', 'oorhaar'], ''],
    ['Welk zintuig gebruik je het meest om gevaar te zien?', 'ogen', ['tong', 'neus', 'huid'], ''],
    ['Welk dier ruikt veel beter dan een mens?', 'de hond', ['de mens', 'de vis', 'de vogel'], ''],
    ['Welk dier kan in het donker goed horen met geluidsgolven (echo)?', 'de vleermuis', ['de koe', 'de kip', 'de koala'], ''],
    ['Wat voel je als je een hete pan aanraakt?', 'pijn en hitte', ['kou', 'niets', 'geluid'], 'Haal je hand snel weg en koel de plek.'],
  ]);
  K.groups({ zien: ['kleur', 'licht', 'vorm', 'schaduw', 'regenboog'], horen: ['muziek', 'stem', 'knal', 'fluit', 'donder'], ruiken: ['parfum', 'rook', 'bloemengeur', 'vers brood', 'zeep'], proeven: ['zoet', 'zuur', 'zout', 'bitter', 'hartig'], voelen: ['warm', 'koud', 'zacht', 'ruw', 'nat'] }, { which: (it) => `Met welk zintuig neem je "${it}" vooral waar?`, tfq: (it, c) => `"${cap(it)}" neem je vooral waar door ${c}.`, multi: (n) => `Welke dingen nemen je via ${n}? (kies alle goede)`, reps: 3, d: 1 });
  K.tfs([['Je ogen werken ook in het volledig donker.', false], ['Je neus helpt je proeven.', true, 'Een verstopte neus maakt eten minder lekker.'], ['Je huid is een zintuig.', true], ['Je oren helpen je evenwicht.', true], ['Sommige dieren kunnen beter ruiken dan wij.', true], ['Je tong kan zoet proeven.', true]]);
  return K.out();
}

function gezondEten() {
  const K = kit({ id: 'mens-gezond-eten', name: 'Gezond eten', emoji: '🥦', group: 'Mens', desc: 'Groente, fruit, de Schijf van Vijf en slimme keuzes.' });
  K.groups({ 'groente en fruit': ['appel', 'banaan', 'wortel', 'broccoli', 'tomaat', 'komkommer', 'sinaasappel', 'aardbei', 'sla'], 'brood, graan en aardappelen': ['brood', 'rijst', 'pasta', 'aardappel', 'havermout', 'cornflakes'], 'zuivel': ['melk', 'yoghurt', 'kaas', 'kwark', 'karnemelk'], 'vlees, vis, ei, noten': ['kip', 'vis', 'ei', 'noten', 'bonen', 'rundvlees'], 'snacks (liever weinig)': ['chips', 'snoep', 'frikandel', 'koek', 'cola', 'limonade'] }, {
    which: (it) => `Waar hoort ${it} bij?`, tfq: (it, c) => `${cap(it)} hoort bij: ${c}.`, multi: (n) => `Welke horen bij "${n}"? (kies alle goede)`, reps: 4, d: 1,
    e: { appel: '🍎', banaan: '🍌', wortel: '🥕', broccoli: '🥦', tomaat: '🍅', komkommer: '🥒', sinaasappel: '🍊', aardbei: '🍓', brood: '🍞', rijst: '🍚', pasta: '🍝', aardappel: '🥔', melk: '🥛', kaas: '🧀', ei: '🥚', vis: '🐟', chips: '🥔', snoep: '🍬', cola: '🥤' },
  });
  K.facts([['vitamine C', 'sinaasappel en kiwi'], ['calcium', 'melk en kaas'], ['eiwitten', 'vlees, vis en ei'], ['vezels', 'volkoren brood en groente'], ['ijzer', 'vlees en groene bladgroente'], ['vitamine D', 'vette vis'], ['koolhydraten', 'brood, rijst en pasta'], ['vitamine A', 'wortelen']].map((r) => [r[0], r[1], '', {}]), { f: (k) => `Waar zit veel ${k} in?`, t: (k, v) => `In ${v} zit veel ${k}.`, typeMax: 0, type: false, d: 3 });
  K.facts([['calcium', 'sterke botten en tanden'], ['eiwitten', 'groei en herstel van spieren'], ['vezels', 'een goede spijsvertering'], ['water', 'dorst lessen en je lichaam gezond houden'], ['vitamine C', 'weerstand tegen ziektes'], ['ijzer', 'gezond bloed'], ['koolhydraten', 'energie']].map((r) => [r[0], r[1], '', {}]), { f: (k) => `Waar is ${k} goed voor?`, t: (k, v) => `${cap(k)} is goed voor ${v}.`, typeMax: 0, type: false, d: 3 });
  K.mcs([
    ['Hoeveel stuks fruit eet je per dag liefst minstens (richtlijn)?', '2', ['0', '1 per week', '10'], 'Eet elke dag groente en fruit.'],
    ['Wat is een goede drank bij je eten?', 'water', ['cola', 'energy drink', 'siroop met veel suiker'], ''],
    ['Wat moet je maar weinig eten?', 'snoep en chips', ['groente', 'fruit', 'volkorenbrood'], ''],
    ['Waarom is ontbijten belangrijk?', 'je krijgt energie voor de dag', ['je hoeft niet te slapen', 'je wordt kleiner', 'dan krijg je geen honger meer later'], ''],
    ['Wat is een gezonde tussendoortje?', 'een appel', ['een reep chocolade', 'een zak chips', 'een blikje cola'], ''],
    ['Waarom is suiker slecht voor je tanden?', 'het zorgt voor gaatjes', ['het maakt tanden blauw', 'het maakt tanden zachter, maar sterker', 'het is niet slecht'], ''],
    ['Wat is een allergie voor noten?', 'je lichaam reageert sterk op noten', ['een voorliefde voor noten', 'een soort vitamine', 'een kleur van noten'], ''],
    ['Hoe heet een eetpatroon zonder vlees?', 'vegetarisch', ['carnivoor', 'omnivoor', 'koolhydraatarm'], ''],
    ['Wat is vegan?', 'geen enkel dierlijk product eten', ['alleen vis eten', 'geen groente eten', 'alleen snoep eten'], ''],
    ['Wat is de Schijf van Vijf?', 'een gids voor gezond eten in vijf vakken', ['een bord met vijf lepels', 'een spel', 'een sport'], 'Gemaakt door het Voedingscentrum.'],
    ['Waarom moet je voor het eten je handen wassen?', 'om bacteriën weg te halen', ['om ze leuk te maken', 'om ze koud te maken', 'omdat het moet van de hond'], ''],
    ['Waarom moet vlees goed gebakken zijn?', 'om ziekmakende bacteriën te doden', ['zodat het harder wordt', 'zodat het blauw wordt', 'zodat het kleiner wordt'], ''],
    ['Hoe lang moet je tanden poetsen?', 'ongeveer 2 minuten', ['10 seconden', '10 minuten', '1 uur'], ''],
    ['Welk product is gemaakt van melk?', 'kaas', ['brood', 'appelsap', 'rijst'], ''],
    ['Welk product is gemaakt van tarwe?', 'brood', ['kaas', 'jam', 'appelsap'], ''],
    ['Welke vis is rijk aan gezonde vetten?', 'zalm', ['kabeljauw alleen', 'de goudvis', 'geen enkele'], ''],
    ['Wat is vitamine C goed voor?', 'je weerstand', ['je haargroei alleen', 'je haarkleur', 'je lengte'], ''],
    ['Wat drink je het liefst als je dorst hebt?', 'water', ['frisdrank', 'koffie', 'melk met suiker'], ''],
  ]);
  K.tfs([['Fruit bevat vitamines.', true], ['Snoep is een volwaardige maaltijd.', false], ['Je moet elke dag water drinken.', true], ['Groenten zijn gezond.', true], ['Frisdrank bevat vaak veel suiker.', true], ['Vezels zitten vooral in snoep.', false], ['Melk bevat calcium.', true], ['Ontbijt overslaan is altijd een goed plan.', false]]);
  return K.out();
}

function sport() {
  const K = kit({ id: 'mens-sport-gezondheid', name: 'Bewegen en gezond blijven', emoji: '🏃', group: 'Mens', desc: 'Sporten, slapen, hygiëne en eerste hulp.' });
  K.mcs([
    ['Hoeveel minuten per dag moet je minstens bewegen (richtlijn voor kinderen)?', '60 minuten', ['5 minuten', '10 minuten', '3 uur'], ''],
    ['Wat gebeurt er met je hartslag tijdens sporten?', 'die gaat omhoog', ['die gaat omlaag', 'die stopt', 'die blijft altijd gelijk'], ''],
    ['Waarom doe je een warming-up?', 'om je spieren op te warmen', ['om moe te worden', 'om koud te worden', 'om te winnen'], ''],
    ['Wat moet je doen na het sporten?', 'drinken en uitrusten', ['direct slapen', 'niet drinken', 'ijs eten'], ''],
    ['Waarom is het slim om je bij sporten te drinken?', 'je verliest water door zweten', ['om zwaar te worden', 'om koud te worden', 'omdat het moet van de regels'], ''],
    ['Welke sport doe je met een helm op de fiets?', 'fietsen', ['zwemmen', 'turnen', 'dammen'], ''],
    ['Welk nummer bel je bij een noodgeval?', '112', ['911', '100', '0900'], ''],
    ['Hoe lang koel je een brandwond met koud stromend water?', 'ongeveer 10 minuten', ['10 seconden', 'een uur', 'helemaal niet'], ''],
    ['Wat doe je als iemand erg bloedt?', 'druk op de wond en roep hulp', ['wegrennen', 'wachten', 'een boterham eten'], ''],
    ['Wat is een virus?', 'een heel kleine ziektekiem', ['een soort plant', 'een soort spier', 'een soort vitamine'], ''],
    ['Waartegen helpt een antibioticum?', 'bacteriën', ['virussen', 'verkoudheid', 'stress'], 'Bij een verkoudheid (virus) werkt een antibioticum niet.'],
    ['Wat doet een vaccinatie?', 'je lichaam leert ziektes te bestrijden', ['je wordt groter', 'je wordt ziek', 'je krijgt een spier'], ''],
    ['Waarom smeer je jezelf in met zonnebrand?', 'tegen verbranden door de zon', ['om koud te worden', 'om sneller te rennen', 'om te zwemmen'], ''],
    ['Hoeveel slaap heb je als kind nodig?', 'ongeveer 9 tot 11 uur', ['2 uur', '5 uur', '16 uur'], ''],
    ['Waarom is slapen belangrijk?', 'je lichaam en hersenen herstellen', ['om groter te worden in je kamer', 'om honger te krijgen', 'het is niet nodig'], ''],
    ['Welke sport is goed voor je uithoudingsvermogen?', 'hardlopen', ['schaken', 'puzzelen', 'lezen'], ''],
    ['Wat is een hartslagmeter?', 'een apparaat dat laat zien hoe snel je hart klopt', ['een soort klok', 'een soort bal', 'een soort bril'], ''],
    ['Wat is een goede houding bij het zitten aan een bureau?', 'rug recht, voeten op de grond', ['onderuit hangen', 'op je hoofd staan', 'liggen op je buik'], ''],
    ['Hoe lang mag je maximaal achter elkaar op een scherm zitten zonder pauze?', 'liever niet langer dan een uur', ['acht uur', 'de hele dag', 'het maakt niet uit'], ''],
    ['Wat is een goede manier om stress te verminderen?', 'bewegen of rustig ademhalen', ['alleen snoep eten', 'ruziemaken', 'niet slapen'], ''],
    ['Wat is een EHBO-doos?', 'een doos met spullen voor eerste hulp', ['een doos met speelgoed', 'een doos met eten', 'een doos met sokken'], ''],
    ['Waarom draag je een fietshelm?', 'om je hoofd te beschermen als je valt', ['voor de kleur', 'om sneller te gaan', 'omdat het warm is'], ''],
    ['Wat doe je als je een teek op je huid vindt?', 'hem voorzichtig verwijderen met een tekentang en wassen', ['hem laten zitten', 'hem fijnknijpen', 'hem doorspoelen'], ''],
    ['Wat moet je doen bij het niezen of hoesten?', 'in je elleboog hoesten', ['in je handen hoesten', 'recht in iemands gezicht', 'je adem inhouden'], ''],
  ]);
  K.groups({ 'teamsport': ['voetbal', 'hockey', 'basketbal', 'volleybal', 'korfbal', 'handbal'], 'sport voor jezelf': ['zwemmen', 'hardlopen', 'turnen', 'schaatsen', 'judo', 'tennis'] }, { which: (it) => `Is ${it} een teamsport?`, names: ['teamsport', 'sport voor jezelf'], tfq: (it, c) => `${cap(it)} is ${c === 'teamsport' ? 'een teamsport' : 'vooral een sport voor jezelf'}.`, multi: (n) => `Welke zijn een ${n}? (kies alle goede)`, reps: 4, d: 2 });
  K.tfs([['Bewegen is goed voor je hart.', true], ['Je mag in de zon zonder zonnebrand zitten, ook uren.', false], ['Een fietshelm kan je hoofd beschermen.', true], ['Bij brand bel je 112.', true], ['Handen wassen helpt tegen ziektes.', true], ['Je hoeft nooit te slapen als je sport.', false], ['Bacteriën kunnen ziek maken.', true], ['Elke bacterie is slecht.', false, 'Veel bacteriën zijn nuttig, bijvoorbeeld in je darmen.']]);
  K.mcs([
    ['Welke sport is goed voor je spieren en je balans?', 'turnen', ['dammen', 'puzzelen', 'tv kijken'], ''],
    ['Welke vitamine maakt je lichaam met zonlicht aan?', 'vitamine D', ['vitamine C', 'vitamine A', 'vitamine B'], ''],
    ['Hoe lang moet je ongeveer je handen wassen?', 'minstens 20 seconden', ['2 seconden', '5 seconden', '5 minuten'], ''],
    ['Hoe weet je dat je lichaam moe is?', 'je krijgt zin om te rusten of te slapen', ['je wordt sneller', 'je krijgt meer energie', 'je krijgt honger naar niets'], ''],
    ['Wat is een goede manier om warm te worden voor het sporten?', 'een paar minuten rustig bewegen', ['meteen sprinten', 'stilzitten', 'koud douchen'], ''],
    ['Wat kun je doen bij een neusbloeding?', 'rechtop zitten en je neus dichtknijpen', ['je hoofd achterover leggen', 'liggen met je benen omhoog', 'je neus schoonblazen'], ''],
    ['Wat doe je bij een kleine wond?', 'schoonmaken en een pleister erop', ['er zand op doen', 'laten bloeden', 'niets doen'], ''],
    ['Wat is een goede houding bij het tillen van iets zwaars?', 'door je knieën buigen', ['met een bolle rug tillen', 'heel snel tillen', 'op één been staan'], ''],
    ['Wat is verstandig bij heet weer?', 'veel water drinken en in de schaduw blijven', ['de hele dag in de zon rennen', 'geen water drinken', 'een dikke jas dragen'], ''],
    ['Waarom is bewegen goed voor je humeur?', 'je voelt je er vrolijker door', ['je wordt er boos van', 'je krijgt er honger van', 'het heeft geen effect'], ''],
    ['Wat betekent "rust nemen" na ziek zijn?', 'je lichaam de tijd geven te herstellen', ['meteen weer alles doen', 'niets eten', 'harder trainen'], ''],
    ['Wat is een gezonde manier om met boosheid om te gaan?', 'diep ademhalen en erover praten', ['gooien met spullen', 'anderen pijn doen', 'alles opkroppen'], ''],
  ]);
  K.tfs([['Huiswerk maken met regelmatig pauzes is verstandig.', true], ['Een gezonde snack is bijvoorbeeld een stuk fruit.', true], ['Zwemmen is goede beweging voor het hele lichaam.', true], ['Je mag zonder zonnebrand de hele dag in de zon zitten.', false], ['Een warming-up kan blessures voorkomen.', true], ['Slapen helpt je hersenen te herstellen.', true]]);
  return K.out();
}

/* ---------------- GESCHIEDENIS ---------------- */
function nlTijdlijn() {
  const K = kit({ id: 'nl-tijdlijn', name: 'Nederlandse geschiedenis', emoji: '🏰', group: 'Geschiedenis', desc: 'Jaartallen en gebeurtenissen uit de Nederlandse geschiedenis, en op volgorde zetten.' });
  const E = [
    ['de Tachtigjarige Oorlog begint', 1568], ['de Watergeuzen veroveren Den Briel', 1572], ['de Nederlanders verklaren zich onafhankelijk van Spanje (Plakkaat van Verlatinghe)', 1581], ['Willem van Oranje wordt vermoord in Delft', 1584], ['de VOC wordt opgericht', 1602], ['de WIC wordt opgericht', 1621], ['de tulpenmanie bereikt haar hoogtepunt', 1637], ['de Vrede van Münster beëindigt de Tachtigjarige Oorlog', 1648], ['Michiel de Ruyter vaart de Theems en de Medway op (Tocht naar Chatham)', 1667], ['de Bataafse Republiek ontstaat', 1795], ['Lodewijk Napoleon wordt koning van Holland', 1806], ['Willem I wordt koning van het Koninkrijk der Nederlanden', 1815], ['Thorbecke maakt de nieuwe Grondwet', 1848], ['slavernij wordt afgeschaft in Suriname en op de Antillen', 1863], ['Wilhelmina wordt koningin', 1890], ['de Afsluitdijk wordt gesloten', 1932], ['Duitsland valt Nederland binnen', 1940], ['Operatie Market Garden bij Arnhem', 1944], ['Nederland wordt bevrijd', 1945], ['Nederland draagt de soevereiniteit over aan Indonesië', 1949], ['de watersnoodramp in Zeeland', 1953], ['Suriname wordt onafhankelijk', 1975], ['Beatrix wordt koningin', 1980], ['Flevoland wordt een provincie', 1986], ['de euro komt in Nederland als echt geld', 2002], ['Willem-Alexander wordt koning', 2013],
  ];
  for (const [ev, y] of E) {
    const near = K.near(y, 6, { step: [1568, 1572, 1581, 1584, 1602, 1621, 1637, 1648].includes(y) ? 5 : 3, min: 1000 }).map(String).filter((z) => Number(z) <= 2026);
    K.mc(`In welk jaar gebeurde dit: ${ev}?`, String(y), near, { d: y < 1700 ? 3 : 2, x: `${cap(ev)}: ${y}.`, c: 'true', cf: 'skip' });
    K.num(`In welk jaar gebeurde dit: ${ev}? (typ het jaartal)`, y, { d: 3, x: `${cap(ev)}: ${y}.` });
    const w = y + (y % 2 ? 3 : -4);
    K.tf(`${cap(ev)} in ${y}.`, true, { d: 2 });
    K.tf(`${cap(ev)} in ${w}.`, false, { d: 2, x: `Het was ${y}.` });
  }
  for (let m = 0; m < 24; m++) {
    const picks = K.shuf(E).slice(0, 4).sort((a, b) => a[1] - b[1]);
    if (new Set(picks.map((p) => p[1])).size === 4) K.order('Zet de gebeurtenissen in de goede volgorde (oud naar nieuw)', picks.map((p) => cap(p[0].length > 50 ? p[0].slice(0, 50) + '…' : p[0])), { d: 2, x: picks.map((p) => `${p[1]}: ${p[0]}`).join('; ') });
  }
  K.mcs([
    ['Wie is "Vader des Vaderlands"?', 'Willem van Oranje', ['Willem-Alexander', 'Michiel de Ruyter', 'Johan Cruijff'], ''],
    ['Welke schilder maakte De Nachtwacht?', 'Rembrandt', ['Van Gogh', 'Vermeer', 'Mondriaan'], ''],
    ['Welke eeuw heet de Gouden Eeuw?', 'de 17e eeuw', ['de 15e eeuw', 'de 19e eeuw', 'de 21e eeuw'], 'Nederland was toen rijk door handel.'],
    ['Wat was de VOC?', 'de Vereenigde Oostindische Compagnie, een handelsbedrijf', ['een voetbalclub', 'een leger', 'een school'], ''],
    ['Welke vrouw schreef een dagboek tijdens de Tweede Wereldoorlog?', 'Anne Frank', ['Wilhelmina', 'Beatrix', 'Máxima'], ''],
    ['Op welke dag vieren we Bevrijdingsdag?', '5 mei', ['4 mei', '27 april', '1 januari'], ''],
    ['Op welke dag herdenken we de doden van de oorlog?', '4 mei', ['5 mei', '27 april', '5 december'], ''],
    ['Op welke dag is Koningsdag?', '27 april', ['30 april', '5 mei', '1 juni'], 'Sinds 2014 is Koningsdag op 27 april.'],
    ['Wat was de Hongerwinter?', 'de winter van 1944-1945 met veel honger', ['een extreem koude zomer', 'een Kerstfeest', 'een ijsfeest'], ''],
    ['Wat gebeurde er in 1953 in Zeeland?', 'de watersnoodramp', ['een brand', 'een oorlog', 'een vulkaanuitbarsting'], ''],
    ['Welke werken zijn gebouwd na de ramp van 1953?', 'de Deltawerken', ['de Afsluitdijk', 'de Betuwelijn', 'het Noordzeekanaal'], ''],
    ['Welk volk bouwde de hunebedden?', 'mensen uit de prehistorie (de Trechterbekercultuur)', ['de Romeinen', 'de ridders', 'de Vikingen'], 'Ze zijn zo\'n 5000 jaar oud.'],
    ['Welk volk bouwde de limes aan de Rijn?', 'de Romeinen', ['de Vikingen', 'de Saksen', 'de Spanjaarden'], ''],
    ['Hoe heet het huidige Koningshuis?', 'Oranje-Nassau', ['Habsburg', 'Bourbon', 'Windsor'], ''],
    ['Wat was de Tachtigjarige Oorlog?', 'de strijd van de Nederlanden tegen Spanje', ['een oorlog tegen Frankrijk', 'een oorlog tegen Duitsland', 'een oorlog tegen Engeland'], ''],
    ['Welke Nederlandse admiraal is een bekende zeeheld?', 'Michiel de Ruyter', ['Willem Barentsz is geen admiraal', 'Piet Hein is geen zeeheld', 'Jan Pieterszoon Coen'], 'Michiel de Ruyter leefde van 1607 tot 1676.'],
    ['Wie zocht in 1596 de noordelijke doorvaart en overwinterde op Nova Zembla?', 'Willem Barentsz', ['Michiel de Ruyter', 'Abel Tasman', 'Piet Hein'], ''],
    ['Welke Nederlander ontdekte in 1642 Tasmanië?', 'Abel Tasman', ['Willem Barentsz', 'Piet Hein', 'Peter Stuyvesant'], ''],
    ['Welke stad heette vroeger Nieuw-Amsterdam?', 'New York', ['Boston', 'Washington D.C.', 'Chicago'], ''],
  ].filter((r) => !r[0].includes('admiraal')));
  K.mcs([['Welke Nederlandse admiraal versloeg in 1667 de Engelsen bij Chatham?', 'Michiel de Ruyter', ['Willem Barentsz', 'Abel Tasman', 'Piet Hein'], '']]);
  K.tfs([['Nederland was in de Tweede Wereldoorlog bezet door Duitsland.', true], ['Nederland is een republiek.', false, 'Nederland is een koninkrijk.'], ['Amsterdam is de hoofdstad van Nederland.', true], ['De gouden eeuw was de 17e eeuw.', true], ['De Romeinen woonden nooit in Nederland.', false], ['Rembrandt was een Nederlandse schilder.', true]]);
  return K.out();
}

function wereldGesch() {
  const K = kit({ id: 'wereldgeschiedenis', name: 'Wereldgeschiedenis', emoji: '🌐', group: 'Geschiedenis', desc: 'Belangrijke gebeurtenissen en personen uit de wereldgeschiedenis.' });
  const E = [['Rome wordt volgens de legende gesticht', -753], ['Julius Caesar wordt vermoord', -44], ['het West-Romeinse Rijk valt', 476], ['de Slag bij Hastings (Willem de Veroveraar in Engeland)', 1066], ['Gutenberg ontwikkelt de boekdrukkunst (ongeveer)', 1450], ['Columbus bereikt Amerika', 1492], ['de eerste reis om de wereld begint (Magellaan)', 1519], ['de Amerikaanse onafhankelijkheid', 1776], ['de Franse Revolutie begint', 1789], ['Napoleon wordt verslagen bij Waterloo', 1815], ['de slavernij wordt afgeschaft in de Verenigde Staten', 1865], ['de gebroeders Wright maken de eerste vlucht', 1903], ['de Titanic zinkt', 1912], ['de Eerste Wereldoorlog begint', 1914], ['de Eerste Wereldoorlog eindigt', 1918], ['de Tweede Wereldoorlog begint', 1939], ['de Tweede Wereldoorlog eindigt', 1945], ['de Berlijnse Muur wordt gebouwd', 1961], ['de eerste mens op de maan', 1969], ['de Berlijnse Muur valt', 1989], ['Nelson Mandela wordt president van Zuid-Afrika', 1994]];
  for (const [ev, y] of E) {
    const nears = K.near(y, 6, { step: Math.abs(y) < 1000 ? 10 : 5, min: -1000 }).filter((v) => v !== 0).map((v) => yr(v));
    K.mc(`In welk jaar: ${ev}?`, yr(y), nears, { d: 3, x: `${cap(ev)}: ${yr(y)}.`, c: 'true', cf: 'skip' });
    K.tf(`${cap(ev)} in ${yr(y)}.`, true, { d: 2 });
    const w = y < 0 ? y + 20 : y + (y % 2 ? 7 : -9);
    K.tf(`${cap(ev)} in ${yr(w)}.`, false, { d: 2, x: `Het was ${yr(y)}.` });
  }
  for (let m = 0; m < 22; m++) {
    const picks = K.shuf(E).slice(0, 4).sort((a, b) => a[1] - b[1]);
    K.order('Zet in de goede volgorde (oud naar nieuw)', picks.map((p) => cap(p[0].length > 55 ? p[0].slice(0, 55) + '…' : p[0])), { d: 2 });
  }
  K.facts([['Julius Caesar', 'een Romeinse veldheer en leider'], ['Cleopatra', 'de laatste farao van Egypte'], ['Alexander de Grote', 'een Macedonische koning die een enorm rijk veroverde'], ['Napoleon', 'een Franse keizer'], ['Christoffel Columbus', 'de ontdekkingsreiziger die in 1492 Amerika bereikte'], ['Leonardo da Vinci', 'schilder én uitvinder uit Italië'], ['Marco Polo', 'een Venetiaanse reiziger naar China'], ['Karel de Grote', 'een middeleeuwse keizer'], ['Nelson Mandela', 'de eerste zwarte president van Zuid-Afrika'], ['Abraham Lincoln', 'president van de VS die de slavernij hielp afschaffen'], ['Martin Luther King', 'een leider in de strijd voor gelijke rechten van zwarte Amerikanen'], ['Anne Frank', 'een Joods meisje dat een beroemd dagboek schreef'], ['Gandhi', 'leider van de vreedzame Indiase onafhankelijkheidsstrijd'], ['Genghis Khan', 'de stichter van het Mongoolse Rijk']].map((r) => [r[0], r[1], '', {}]), { f: (k) => `Wie of wat was ${k}?`, r: (v) => `Wie was ${v}?`, t: (k, v) => `${k} was ${v}.`, typeMax: 0, type: false, d: 3 });
  K.mcs([
    ['Hoe heten de Egyptische graftombes in de vorm van een driehoek?', 'piramides', ['kastelen', 'tempels van hout', 'hunebedden'], ''],
    ['Wat is de prehistorie?', 'de tijd vóór het schrift', ['de tijd van de ridders', 'de tijd van de computers', 'de tijd van de Romeinen'], ''],
    ['Welke tijd komt na de prehistorie?', 'de oudheid', ['de middeleeuwen', 'de nieuwe tijd', 'de moderne tijd'], ''],
    ['Welke volgorde klopt voor de tijdvakken?', 'oudheid, middeleeuwen, nieuwe tijd', ['middeleeuwen, oudheid, nieuwe tijd', 'nieuwe tijd, oudheid, middeleeuwen', 'oudheid, nieuwe tijd, middeleeuwen'], ''],
    ['Wat was de ijstijd?', 'een tijd met veel ijs en sneeuw op aarde', ['een tijd met veel regen', 'een warme periode', 'een tijd van oorlog'], ''],
    ['Welk volk bouwde de Chinese Muur (grotendeels)?', 'de Chinezen', ['de Romeinen', 'de Egyptenaren', 'de Mongolen'], ''],
    ['Wat was de Zwarte Dood?', 'een enorme pestepidemie in de middeleeuwen', ['een vulkaanuitbarsting', 'een oorlog', 'een hongersnood alleen'], ''],
    ['Wat is de Renaissance?', 'de wedergeboorte van kunst en wetenschap (ca. 1400-1600)', ['een oorlog', 'een koning', 'een uitvinding'], ''],
    ['Waarvoor was de industriële revolutie bekend?', 'machines en fabrieken', ['ridders en kastelen', 'piramides', 'zeilschepen alleen'], ''],
    ['Wat was de Koude Oorlog?', 'een spanning tussen de VS en de Sovjet-Unie zonder directe oorlog', ['een oorlog in de sneeuw', 'een oorlog tussen Nederland en Spanje', 'een koude winter'], ''],
    ['Wat was de Sovjet-Unie?', 'een groot communistisch land (nu Rusland en andere landen)', ['een oud Romeins rijk', 'een eiland', 'een oorlog'], ''],
    ['Wat is een revolutie?', 'een grote, vaak plotselinge verandering van bestuur', ['een soort reis', 'een soort wijn', 'een dans'], ''],
    ['Wat is slavernij?', 'mensen die als bezit van anderen worden gezien en moeten werken', ['een soort schoolsysteem', 'een beroep', 'een spel'], ''],
    ['Wat is democratie?', 'het volk kiest wie het land bestuurt', ['één koning beslist alles', 'alleen leger beslist', 'niemand beslist'], 'Het begrip komt uit het oude Griekenland.'],
    ['Welk land is de bakermat van de democratie?', 'Griekenland', ['Egypte', 'China', 'Peru'], ''],
    ['Welke uitvinding maakte boeken goedkoper?', 'de boekdrukkunst', ['de telefoon', 'het vliegtuig', 'de computer'], ''],
  ]);
  K.tfs([['Columbus bereikte Amerika in 1492.', true], ['De Tweede Wereldoorlog begon in 1914.', false, 'Dat was de Eerste; de Tweede begon in 1939.'], ['Julius Caesar was Romeins.', true], ['Napoleon was een Franse keizer.', true], ['De middeleeuwen komen na de nieuwe tijd.', false], ['Cleopatra was farao van Egypte.', true]]);
  return K.out();
}

function uitvinders() {
  const K = kit({ id: 'uitvinders', name: 'Uitvinders en uitvindingen', emoji: '💡', group: 'Geschiedenis', desc: 'Wie vond de telefoon, gloeilamp of boekdrukkunst uit?' });
  K.facts([['de telefoon', 'Alexander Graham Bell'], ['de gloeilamp', 'Thomas Edison'], ['de radio', 'Guglielmo Marconi'], ['het vliegtuig', 'de gebroeders Wright'], ['de boekdrukkunst', 'Johannes Gutenberg'], ['de verbeterde stoommachine', 'James Watt'], ['de telescoop (patent)', 'Hans Lipperhey'], ['het slingeruurwerk', 'Christiaan Huygens'], ['de penicilline', 'Alexander Fleming'], ['het pokkenvaccin', 'Edward Jenner'], ['dynamiet', 'Alfred Nobel'], ['de relativiteitstheorie', 'Albert Einstein'], ['de wetten van de zwaartekracht', 'Isaac Newton'], ['het world wide web', 'Tim Berners-Lee'], ['de benzineauto', 'Karl Benz'], ['de morsecode', 'Samuel Morse'], ['de batterij', 'Alessandro Volta'], ['het pasteuriseren', 'Louis Pasteur'], ['de radioactiviteit (onderzoek)', 'Marie Curie'], ['de microscoop-ontdekkingen van bacteriën', 'Antoni van Leeuwenhoek'], ['de analytische machine (voorloper van de computer)', 'Charles Babbage'], ['het wisselstroomsysteem', 'Nikola Tesla']].map((r) => [r[0], r[1], r[0].includes('telescoop') ? 'Hans Lipperhey uit Middelburg vroeg in 1608 een patent aan.' : r[0].includes('gloeilamp') ? 'Edison maakte de eerste praktische gloeilamp.' : '', { d: 2 }]), {
    f: (k) => `Wie wordt gezien als uitvinder van ${k}?`, r: (v) => `Waarvan is ${v} bekend?`, t: (k, v) => `${cap(k)} wordt vooral toegeschreven aan ${v}.`, typeMax: 0, type: false, d: 2, matchQ: 'Verbind de uitvinding met de uitvinder', matches: 4,
  });
  K.mcs([
    ['Welk volk vond papier uit?', 'de Chinezen', ['de Romeinen', 'de Vikingen', 'de Azteken'], ''],
    ['Welk volk vond het kompas (als navigatiemiddel) vroeg uit?', 'de Chinezen', ['de Grieken', 'de Egyptenaren', 'de Inca\'s'], ''],
    ['Wat is een patent?', 'een bewijs dat jij een uitvinding bedacht hebt', ['een soort lampje', 'een soort pen', 'een soort boek'], ''],
    ['Wat was de eerste computer ongeveer?', 'groot als een kamer', ['zo klein als een munt', 'zo klein als een telefoon', 'zo klein als een knikker'], ''],
    ['Welke uitvinding zorgde ervoor dat we \'s avonds licht hebben zonder kaars?', 'de gloeilamp', ['de magnetron', 'de kachel', 'de radio'], ''],
    ['Welke uitvinding maakte het mogelijk om van ver met elkaar te praten?', 'de telefoon', ['de typemachine', 'de fiets', 'de schaar'], ''],
    ['Welke uitvinding bracht de mens naar de maan?', 'de raket', ['de tractor', 'de trein', 'de boot'], ''],
    ['Wat is een uitvinder?', 'iemand die iets nieuws bedenkt en maakt', ['iemand die oude dingen weggooit', 'iemand die alleen spelletjes speelt', 'iemand die alleen leest'], ''],
    ['Wat maakte de stoommachine mogelijk?', 'treinen en fabrieken', ['internet', 'vliegtuigen', 'mobiele telefoons'], ''],
    ['Wat is de windmolen vooral gebruikt voor in Nederland?', 'water wegpompen en graan malen', ['stroom voor telefoons', 'treinen aandrijven', 'ijs maken'], ''],
    ['Wie schreef het eerste computerprogramma (voor de machine van Babbage)?', 'Ada Lovelace', ['Isaac Newton', 'Marie Curie', 'Albert Einstein'], ''],
  ]);
  K.tfs([['Thomas Edison wordt vaak de gloeilamp toegeschreven.', true], ['De telefoon is bedacht door Marconi.', false, 'Alexander Graham Bell wordt genoemd; Marconi staat voor de radio.'], ['Gutenberg vond de boekdrukkunst in Europa uit.', true], ['Antoni van Leeuwenhoek was een Nederlandse onderzoeker met de microscoop.', true], ['Het world wide web is bedacht door Tim Berners-Lee.', true], ['Alfred Nobel vond dynamiet uit.', true], ['Alexander Fleming ontdekte penicilline.', true]]);
  return K.out();
}

function egypte() {
  const K = kit({ id: 'oude-egypte', name: 'Het oude Egypte', emoji: '🔺', group: 'Geschiedenis', desc: 'Farao\'s, piramides, mummies en hiërogliefen.' });
  K.facts([['de farao', 'de koning van Egypte', '', { d: 1 }], ['de piramide', 'een grafmonument voor een farao', '', { e: '🔺', d: 1 }], ['de mummie', 'een gebalsemd lichaam', '', { d: 1 }], ['de Nijl', 'de rivier waaraan Egypte ligt', '', { d: 1 }], ['de hiërogliefen', 'het schrift met plaatjes', '', { d: 1 }], ['de papyrus', 'papier gemaakt van een rietplant', '', { d: 2 }], ['de sfinx', 'een beeld met leeuwenlijf en mensenhoofd', '', { d: 2 }], ['de schrijver (schrijfster)', 'iemand die kon lezen en schrijven', '', { d: 2 }], ['de Rosetta-steen', 'de steen waarmee hiërogliefen ontcijferd werden', '', { d: 3 }], ['de Vallei der Koningen', 'de plek met geheime graven van farao\'s', '', { d: 3 }], ['Toetanchamon', 'de jonge farao met de gouden dodenmasker', '', { e: '👑', d: 2 }], ['Ramses II', 'een machtige farao die heel lang regeerde', '', { d: 3 }], ['Hatsjepsoet', 'een vrouwelijke farao', '', { d: 3 }], ['Cleopatra', 'de laatste farao van Egypte', '', { d: 2 }], ['de scarabee', 'een heilige kever als amulet', '', { d: 3 }], ['de kanopen', 'kruiken voor de organen van de mummie', '', { d: 3 }]].map((r) => [r[0], r[1], '', r[3]]), { f: (k) => `Wat is ${k}?`.replace('Wat is Toetanchamon?', 'Wie was Toetanchamon?').replace('Wat is Ramses II?', 'Wie was Ramses II?').replace('Wat is Hatsjepsoet?', 'Wie was Hatsjepsoet?').replace('Wat is Cleopatra?', 'Wie was Cleopatra?').replace('Wat is de farao?', 'Wie is de farao?'), r: (v) => `Waar of wie gaat dit over: ${v}?`, t: (k, v) => `${cap(k)}: ${v}.`, type: false, typeMax: 0, d: 2, matchQ: 'Verbind het begrip met de uitleg', matches: 4 });
  K.facts([['Ra', 'de zonnegod'], ['Anubis', 'de god met een jakhalskop, god van de mummificatie'], ['Isis', 'godin van de magie en moeder'], ['Osiris', 'god van de onderwereld'], ['Horus', 'de god met een valkenkop'], ['Bastet', 'de godin met een kattenkop'], ['Thoth', 'de god van het schrift en wijsheid']].map((r) => [r[0], r[1], '', { d: 3 }]), { f: (k) => `Wie of wat was ${k}?`, r: (v) => `Welke Egyptische god is dit: ${v}?`, t: (k, v) => `${k} was ${v}.`, type: false, typeMax: 0, d: 3 });
  K.mcs([
    ['Waar ligt Egypte?', 'in Afrika', ['in Azië', 'in Europa', 'in Zuid-Amerika'], ''],
    ['Welke piramides zijn het bekendst?', 'die van Gizeh', ['die van Rome', 'die van Parijs', 'die van Londen'], ''],
    ['Waarom bouwden de Egyptenaren piramides?', 'als graf voor de farao', ['als huis voor het volk', 'als school', 'als markt'], ''],
    ['Waarom overstroomde de Nijl elk jaar?', 'dat bracht vruchtbare modder voor de akkers', ['om het volk te straffen', 'omdat de zee te dichtbij was', 'het deed hij nooit'], ''],
    ['Wat is mummificeren?', 'een dood lichaam bewaren door het te drogen en in doeken te wikkelen', ['een lichaam verbranden', 'een lichaam begraven in zand alleen', 'een lichaam in water leggen'], ''],
    ['Hoe lang duurde het mummificeren ongeveer?', 'ongeveer 70 dagen', ['1 dag', '1 jaar', '1 uur'], ''],
    ['Waarvan werd papyrus gemaakt?', 'van een riet dat langs de Nijl groeide', ['van schapenwol', 'van boomschors', 'van zand'], ''],
    ['Hoe heten de plaatjes in het Egyptische schrift?', 'hiërogliefen', ['letters', 'cijfers', 'emoji'], ''],
    ['Wie bestuurde Egypte?', 'de farao', ['de keizer', 'de sultan', 'de ridder'], ''],
    ['Wat droegen farao\'s vaak op hun hoofd?', 'een kroon of hoofdtooi', ['een helm van staal', 'een muts van wol', 'niets'], ''],
    ['Wat was het belangrijkste voedsel in Egypte?', 'brood en bier', ['pizza en cola', 'rijst en soja', 'taart'], ''],
    ['Welke Egyptische godin had een kattenkop?', 'Bastet', ['Isis', 'Anubis', 'Ra'], ''],
    ['Welke Egyptische god heeft de kop van een jakhals?', 'Anubis', ['Ra', 'Horus', 'Isis'], ''],
    ['Welk beroep had een schrijver in Egypte?', 'schrijven en rekenen voor de farao', ['soldaat', 'boer', 'bouwer van piramides'], ''],
    ['Waarvan werden de bouwstenen van de piramide gemaakt?', 'van kalksteen', ['van hout', 'van glas', 'van ijzer'], ''],
    ['Wat is een obelisk?', 'een hoge smalle steen met een punt', ['een soort boot', 'een soort schrift', 'een soort kleding'], ''],
    ['Waar vond men veel schatten en dodenmasker van Toetanchamon?', 'in zijn graf', ['in de zee', 'op de markt', 'in de Nijl'], ''],
    ['Wat is een sarcofaag?', 'een kist voor een mummie', ['een soort tempel', 'een soort tent', 'een soort boot'], ''],
  ]);
  K.tfs([['De piramides staan in Egypte.', true], ['De Egyptenaren schreven met letters zoals wij.', false, 'Ze gebruikten hiërogliefen.'], ['Mummies zijn gebalsemd.', true], ['Cleopatra was de laatste farao.', true], ['De Nijl stroomt door Egypte.', true], ['Egypte ligt in Europa.', false], ['Een sfinx heeft het lijf van een leeuw.', true], ['Toetanchamon was een oude farao.', false, 'Hij werd al jong koning en stierf jong.']]);
  return K.out();
}

function romeinen() {
  const K = kit({ id: 'romeinen', name: 'De Romeinen', emoji: '🏛️', group: 'Geschiedenis', desc: 'Legioenen, gladiatoren, Romeinse cijfers en het leven in Rome.' });
  const R = [['I', 1], ['V', 5], ['X', 10], ['L', 50], ['C', 100], ['D', 500], ['M', 1000]];
  for (const [r, n] of R) K.mc(`Welk getal is het Romeinse cijfer ${r}?`, String(n), [1, 5, 10, 50, 100, 500, 1000].filter((v) => v !== n).map(String), { d: 1 });
  const toRoman = (n) => { const m = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, r] of m) while (n >= v) { s += r; n -= v; } return s; };
  for (let n = 1; n <= 40; n++) K.num(`Welk getal is ${toRoman(n)} (Romeins)?`, n, { d: n <= 12 ? 1 : 2 });
  for (const n of [49, 50, 64, 90, 99, 100, 144, 400, 500, 900, 1000, 1999, 2024]) K.num(`Welk getal is ${toRoman(n)} (Romeins)?`, n, { d: 3 });
  for (const n of [4, 9, 14, 19, 24, 29, 49, 99]) K.type(`Hoe schrijf je ${n} met Romeinse cijfers?`, toRoman(n), [], { d: 3 });
  K.facts([['de legioensoldaat', 'een Romeinse soldaat'], ['de gladiator', 'een vechter in de arena'], ['het Colosseum', 'de grote arena in Rome'], ['het aquaduct', 'een brug die water vervoert'], ['de toga', 'het kledingstuk van een Romeinse burger'], ['de thermen', 'Romeinse badhuizen'], ['het forum', 'het plein midden in de stad'], ['de villa', 'een groot landhuis'], ['Latijn', 'de taal van de Romeinen'], ['de senaat', 'de raad van oudere Romeinse bestuurders'], ['de limes', 'de grens van het Romeinse Rijk langs de Rijn'], ['een centurio', 'de commandant van ongeveer honderd soldaten'], ['Julius Caesar', 'een beroemde Romeinse veldheer'], ['Augustus', 'de eerste Romeinse keizer'], ['Nero', 'een Romeinse keizer'], ['Hannibal', 'de vijand uit Karthago die met olifanten over de Alpen trok']].map((r) => [r[0], r[1], '', { d: 2 }]), { f: (k) => `Wat of wie is ${k}?`.replace('Wat of wie is Latijn?', 'Wat is Latijn?'), r: (v) => `Welk begrip hoort bij: ${v}?`, t: (k, v) => `${cap(k)}: ${v}.`, typeMax: 0, type: false, d: 2, matchQ: 'Verbind het begrip met de uitleg', matches: 4 });
  K.mcs([
    ['Welke stad was de hoofdstad van het Romeinse Rijk?', 'Rome', ['Athene', 'Parijs', 'Londen'], ''],
    ['Hoe heette het Romeinse kledingstuk voor mannen?', 'toga', ['sari', 'kimono', 'jas'], ''],
    ['Wat gebeurde er in 79 na Christus in Pompeii?', 'de Vesuvius barstte uit', ['een grote oorlog', 'een aardbeving in Egypte', 'een zondvloed'], ''],
    ['Welke stad in Nederland is de oudste en was Romeins (Noviomagus)?', 'Nijmegen', ['Amsterdam', 'Utrecht', 'Groningen'], 'Nijmegen noemt zich de oudste stad van Nederland.'],
    ['Wat is de limes in Nederland?', 'de Romeinse grens langs de Rijn', ['een Romeinse school', 'een dijk in Zeeland', 'een tuin'], ''],
    ['Wie volgens de legende stichtten Rome?', 'Romulus en Remus', ['Julius en Augustus', 'Nero en Caligula', 'Hannibal en Scipio'], 'Ze werden volgens het verhaal door een wolvin gezoogd.'],
    ['Welke taal sprak men in het oude Rome?', 'Latijn', ['Grieks', 'Frans', 'Italiaans'], ''],
    ['Welke moderne talen komen uit het Latijn?', 'Frans, Spaans en Italiaans', ['Engels en Nederlands', 'Duits en Pools', 'Chinees en Japans'], ''],
    ['Hoe heet een Romeinse legerplaats?', 'castrum (kamp)', ['colosseum', 'forum', 'villa'], ''],
    ['Welk dier was het symbool van de Romeinse legioenen?', 'de adelaar', ['de leeuw', 'de beer', 'de haai'], ''],
    ['Wat deed een aquaduct?', 'water naar de stad brengen', ['soldaten vervoeren', 'bier brouwen', 'brood bakken'], ''],
    ['Wie ging bij de gladiatoren vechten?', 'meestal slaven en krijgsgevangenen', ['alle burgers', 'alleen kinderen', 'alleen de keizer'], ''],
  ]);
  K.tfs([['Een Romeinse soldaat droeg een helm en schild.', true], ['De Romeinen spraken Chinees.', false], ['Het Colosseum staat in Rome.', true], ['Romeinse cijfers: X is 10.', true], ['Romeinse cijfers: V is 10.', false, 'V is 5.'], ['De Romeinen bouwden wegen en aquaducten.', true], ['Gladiatoren vochten in een arena.', true], ['Julius Caesar was een Griekse koning.', false]]);
  return K.out();
}

function ridders() {
  const K = kit({ id: 'ridders', name: 'Ridders en kastelen', emoji: '🏰', group: 'Geschiedenis', desc: 'Middeleeuwse ridders, kastelen, toernooien en het leven van toen.' });
  K.facts([['het harnas', 'een pantser van metaal'], ['de maliënkolder', 'een hemd van ijzeren ringetjes'], ['het toernooi', 'een wedstrijd tussen ridders'], ['de ophaalbrug', 'een brug die je kunt optrekken'], ['de slotgracht', 'een gracht met water rond het kasteel'], ['de donjon', 'de hoofdtoren van een kasteel'], ['het wapenschild', 'het embleem van een ridderfamilie'], ['de jonkvrouw', 'een jonge adellijke vrouw'], ['de schildknaap', 'de hulp van een ridder'], ['de lans', 'een lange speer voor een toernooi'], ['de burchtheer', 'de heer van het kasteel'], ['de monnik', 'een man in een klooster'], ['de kruistocht', 'een lange heilige oorlogsreis'], ['de katapult (belegeringswapen)', 'een machine die stenen wegschiet'], ['het leenstelsel', 'de koning geeft land aan edelen, die dienen hem'], ['de burcht', 'een versterkt middeleeuws huis'], ['de hofnar', 'de grappenmaker van de koning'], ['de heraut', 'iemand die berichten van de koning verkondigt']].map((r) => [r[0].replace('de katapult (belegeringswapen)', 'de katapult'), r[1], '', { d: 2 }]), { f: (k) => `Wat is ${k}?`, r: (v) => `Welk woord hoort bij: ${v}?`, t: (k, v) => `${cap(k)}: ${v}.`, typeMax: 0, type: false, d: 2, matchQ: 'Verbind het woord met de uitleg', matches: 4 });
  K.order('Zet in volgorde: de weg naar ridder', ['page', 'schildknaap', 'ridder'], { d: 2, x: 'Eerst page (jongen aan het hof), dan schildknaap, dan ridder.' });
  K.order('Zet in volgorde: dit gebeurt bij een kasteelbelegering', ['de vijand omsingelt het kasteel', 'de katapult schiet stenen', 'de muur raakt beschadigd', 'de verdedigers geven zich over of vechten door'], { d: 3 });
  K.mcs([
    ['In welke periode leefden de ridders?', 'in de middeleeuwen', ['in de prehistorie', 'in de moderne tijd', 'in de oudheid'], ''],
    ['Waarom hadden kastelen een slotgracht?', 'om vijanden tegen te houden', ['om te vissen', 'voor het zwemmen', 'voor planten'], ''],
    ['Waarom hadden kastelen dikke muren?', 'om aanvallers tegen te houden', ['voor mooie kleuren', 'om warm te blijven alleen', 'omdat steen goedkoop was'], ''],
    ['Wat droeg een ridder om zich te beschermen?', 'een harnas', ['een trui', 'een badpak', 'een regenjas'], ''],
    ['Wat is de rol van de koning?', 'hij bestuurt het land', ['hij kookt voor het volk', 'hij bouwt huizen', 'hij verkoopt brood'], ''],
    ['Wie woonden in het kasteel?', 'de heer, zijn familie en bedienden', ['alleen draken', 'alle boeren', 'niemand'], ''],
    ['Wie werkte op het land rond het kasteel?', 'de boeren', ['de ridders', 'de koning', 'de monniken alleen'], ''],
    ['Waar woonden monniken?', 'in een klooster', ['in een kasteel', 'in een hut', 'in een boot'], ''],
    ['Wat is een toernooi vooral (bij ridders)?', 'een wedstrijd met lansen en zwaarden', ['een soort feest met dans alleen', 'een kookwedstrijd', 'een schaakwedstrijd'], ''],
    ['Wie is de bekende ridder uit de legende van koning Arthur?', 'Lancelot', ['Robin Hood', 'Gandalf', 'Hannibal'], ''],
    ['Wie zou volgens de legende de rijken beroofd hebben om de armen te helpen?', 'Robin Hood', ['Koning Arthur', 'Lancelot', 'Merlijn'], 'Dit is een legende, geen bewezen feit.'],
    ['Wat is een legende?', 'een oud verhaal dat deels verzonnen is', ['een feit uit het nieuws', 'een wiskundesom', 'een spel'], ''],
    ['Wat is een draak in een ridderverhaal?', 'een fantasiedier', ['een echt dier', 'een soort paard', 'een soort vis'], ''],
    ['Hoe heette de beroemde ronde tafel in de legende?', 'de Ronde Tafel van koning Arthur', ['de Vierkante Tafel', 'de Gouden Tafel van Rome', 'de Zwarte Tafel'], ''],
    ['Wat is een belegering?', 'een aanval waarbij je een kasteel of stad omsingelt', ['een soort feest', 'een soort school', 'een soort bruiloft'], ''],
    ['Welke kleding droeg een gewoon burgerkind in de middeleeuwen?', 'een eenvoudige tuniek', ['een harnas', 'een toga', 'een smoking'], ''],
    ['Waaruit bestond vaak een maaltijd van boeren?', 'brood, pap en groenten', ['pizza en cola', 'pasta met pesto', 'sushi'], ''],
  ]);
  K.tfs([['Ridders leefden in de middeleeuwen.', true], ['Een slotgracht is gevuld met water.', true], ['Alle ridders waren vrouwen.', false], ['Een ophaalbrug kan omhoog gehesen worden.', true], ['Kastelen werden gebouwd van piepschuim.', false], ['Een ridder had vaak een paard.', true], ['Monniken woonden in kloosters.', true], ['Een harnas was van papier.', false]]);
  return K.out();
}

export const builders = [lichaam, botten, zintuigen, gezondEten, sport, nlTijdlijn, wereldGesch, uitvinders, egypte, romeinen, ridders];
