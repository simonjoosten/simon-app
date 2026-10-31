// PACKS-C (deel a): EHBO, muziektheorie, religies en feesten, sterrenbeelden, beroepen, verkeersborden.
import { kit } from '../packs-b/lib.mjs';
const cap = (s) => s[0].toUpperCase() + s.slice(1);

function ehbo() {
  const K = kit({ id: 'ehbo', name: 'Eerste hulp (EHBO)', emoji: '🩹', group: 'Mens', desc: 'Wat doe je bij een bloedneus, brandwond of als iemand niet ademt? Eerste hulp voor kinderen.' });
  K.facts([
    ['je een bloedneus hebt', 'voorover buigen en je neus dichtknijpen', 'Buig je hoofd naar voren en knijp zacht in het zachte deel van je neus, ongeveer 10 minuten.', { e: '👃' }],
    ['je een brandwond hebt', 'koelen met lauw stromend water', 'Koel de wond minstens 10 minuten met lauw water, niet met ijs.', { e: '🔥' }],
    ['je een schaafwond hebt', 'schoonmaken met water en er een pleister op doen', '', { e: '🩹' }],
    ['een bij je steekt', 'de angel eruit schrapen en de plek koelen', 'Schraap de angel er met een pasje of kaart uit en koel de plek.', { e: '🐝' }],
    ['je een enkel verstuikt hebt', 'rust nemen, koelen en je voet omhoog leggen', '', { e: '🦶' }],
    ['iemand zich verslikt en hoest', 'blijven aanmoedigen om te hoesten', 'Zolang iemand kan hoesten, haalt hij nog adem. Laat hem zelf hoesten.', { e: '😮' }],
    ['iemand zich verslikt en niet meer kan hoesten of ademen', 'vijf stevige klappen tussen de schouderbladen geven', '', { e: '😮' }],
    ['iemand niet ademt en niet wakker wordt', '112 bellen en beginnen met reanimeren', '', { e: '🚑' }],
    ['je diep in je vinger hebt gesneden en het bloedt flink', 'stevig afdrukken met een schone doek', '', { e: '✂️' }],
    ['je een splinter hebt', 'de splinter met een pincet eruit trekken', '', { e: '🪵' }],
    ['je een teek op je huid vindt', 'de teek met een tekentang of pincet verwijderen', 'Pak de teek dicht bij de huid en trek hem recht omhoog.', { e: '🕷️' }],
    ['er iets in je oog komt', 'je oog spoelen met schoon water', '', { e: '👁️' }],
    ['iemand erg koud en onderkoeld is', 'hem warm inpakken in een deken', '', { e: '🥶' }],
    ['je een zonnesteek hebt', 'naar de schaduw gaan, koelen en water drinken', '', { e: '☀️' }],
    ['je een gebroken arm vermoedt', 'de arm stil laten houden en hulp halen', 'Beweeg de arm niet en laat een volwassene bellen.', { e: '💪' }],
    ['iemand flauwvalt maar wel ademt', 'hem plat neerleggen met de benen omhoog', '', { e: '😵' }],
    ['iemand bewusteloos is maar wel ademt', 'hem in de stabiele zijligging leggen', '', { e: '🛌' }],
    ['je een open wond hebt', 'eerst je handen wassen en de wond schoonmaken', '', { e: '🧼' }],
  ], { f: (k) => `Wat moet je doen als ${k}?`, t: (k, v) => `Als ${k}, moet je ${v}.`, fx: (k, v) => `Het goede antwoord: ${v}.`, d: 2, typeMax: 0, matchQ: 'Welke aanpak hoort bij welke situatie?', matchN: 4, matches: 4 });
  K.facts([
    ['Wat is het alarmnummer in Nederland?', '112'], ['Welk nummer bel je als het geen spoed is, maar je wel een huisarts nodig hebt (buiten kantooruren)?', 'het nummer van de huisartsenpost'],
  ].map((r) => [r[0], r[1], '', { noRev: true, noTf: true, noFill: true, noMatch: true }]), { f: (k) => k, mc: true, type: false, r: null, d: 1, pool: ['112', '911', '110', '999', '0900', 'het nummer van de huisartsenpost', 'het nummer van de politie', 'het nummer van de brandweer'] });
  K.mcs([
    ['Hoe vaak druk je per minuut op de borst bij reanimatie?', '100 tot 120 keer', ['20 tot 40 keer', '50 tot 60 keer', '200 keer'], ''],
    ['Wat is de verhouding van borstcompressies en beademingen bij reanimatie van een volwassene?', '30 keer drukken, 2 keer beademen', ['2 keer drukken, 30 keer beademen', '10 keer drukken, 10 keer beademen', '5 keer drukken, 1 keer beademen'], ''],
    ['Waar druk je bij een reanimatie?', 'midden op de borstkas', ['op de buik', 'op de schouder', 'op de bovenarm'], ''],
    ['Wat is een AED?', 'een apparaat dat het hart met een schok weer op gang kan helpen', ['een soort pleister', 'een medicijn tegen koorts', 'een draagverband'], 'AED staat voor automatische externe defibrillator.'],
    ['Wat is een mitella?', 'een driehoekige doek om een arm te ondersteunen', ['een soort pleister', 'een thermometer', 'een hartmonitor'], ''],
    ['Wat hoort NIET in een EHBO-trommel?', 'een hamer', ['pleisters', 'een verbandschaar', 'steriel gaas'], ''],
    ['Wat doe je NIET bij een brandwond?', 'er boter of zalf op smeren', ['koelen met lauw water', 'een schone doek erop leggen', 'hulp halen bij grote wonden'], 'Boter houdt de hitte vast en kan infectie geven.'],
    ['Wat is het eerste wat je doet bij een ongeluk?', 'zorgen dat het veilig is voor jezelf en anderen', ['meteen het slachtoffer verplaatsen', 'foto’s maken', 'weglopen'], ''],
    ['Hoe lang koel je een brandwond?', 'minstens 10 minuten', ['10 seconden', 'een uur met ijs', 'helemaal niet'], ''],
    ['Welke kleur heeft het EHBO-teken meestal?', 'een wit kruis op een groene achtergrond', ['een zwart kruis op rood', 'een blauw rondje', 'een gele driehoek'], 'In Nederland is het EHBO-teken een wit kruis op groen.'],
  ]);
  K.tfs([
    ['Bij een bloedneus moet je je hoofd achterover houden.', false, 'Buig juist voorover, anders loopt het bloed in je keel.'],
    ['Bij een brandwond leg je er ijs op.', false, 'Koel met lauw stromend water. IJs kan de huid extra beschadigen.'],
    ['Je mag een splinter met een pincet verwijderen.', true], ['Bij elk ongeluk bel je zo nodig 112.', true], ['Als iemand niet ademt, hoef je niets te doen.', false, 'Bel 112 en begin met reanimeren.'],
    ['Een AED kan iedereen gebruiken, de apparaten praten je erdoorheen.', true], ['Je wast een open wond eerst met water.', true], ['Bij een gebroken arm beweeg je de arm zoveel mogelijk.', false, 'Laat de arm juist stil houden.'],
    ['Een pleister hoort op een schone, droge wond.', true], ['Een kind dat zich verslikt en niet meer kan hoesten, krijgt klappen tussen de schouderbladen.', true],
  ]);
  K.order('Zet de stappen goed: wat doe je bij een ongeluk?', ['Zorg dat het veilig is', 'Kijk of iemand reageert', 'Bel 112 of laat bellen', 'Help tot de hulp er is']);
  K.order('Zet de stappen bij een brandwond in de goede volgorde.', ['Haal de kleding weg die er niet aan vastzit', 'Koel 10 minuten met lauw water', 'Dek de wond af met een schone doek', 'Haal hulp bij een grote wond']);
  return K.out();
}

function muziektheorie() {
  const K = kit({ id: 'muziektheorie', name: 'Muziektheorie', emoji: '🎼', group: 'Creatief', desc: 'Noten, tellen, tempo en toonladders: de taal van de muziek.' });
  const S = (k, v, x, g, e) => [k, v, x || '', { g, ...(e ? { e } : {}) }];
  K.facts([
    S('een hele noot', '4 tellen', '', 'noot'), S('een halve noot', '2 tellen', '', 'noot'), S('een kwartnoot', '1 tel', '', 'noot'), S('een achtste noot', 'een halve tel', '', 'noot'), S('een halve noot met een punt', '3 tellen', 'Een punt achter de noot maakt hem de helft langer.', 'noot'),
  ], { f: (k) => `Hoe lang duurt ${k} in een 4/4-maat?`, t: (k, v) => `${cap(k)} duurt ${v}.`, d: 2, typeMax: 0, pool: ['4 tellen', '2 tellen', '1 tel', 'een halve tel', '3 tellen', '8 tellen', 'een kwart tel'] });
  K.facts([
    S('de vioolsleutel', 'voor hoge tonen', '', 'teken', '🎻'), S('de bassleutel', 'voor lage tonen', '', 'teken'), S('het kruis (♯)', 'maakt een toon een halve toon hoger', '', 'teken'), S('de mol (♭)', 'maakt een toon een halve toon lager', '', 'teken'), S('het herstellingsteken (♮)', 'maakt een kruis of een mol ongedaan', '', 'teken'),
    S('de notenbalk', 'bestaat uit vijf lijnen', '', 'teken'), S('de dubbele streep', 'laat het einde van een deel of stuk zien', '', 'teken'), S('de rust', 'een moment van stilte in de muziek', '', 'teken'), S('de boogvormige streep (legatoboog)', 'noten aan elkaar spelen', '', 'teken'),
  ], { f: (k) => `Wat betekent ${k}?`, r: (v) => `Bij welk teken hoort: ${v}?`, t: (k, v) => `${cap(k)}: ${v}.`, d: 2, typeMax: 0, matchQ: 'Verbind het teken met de betekenis.', matchN: 4, matches: 2 });
  K.facts([
    S('forte (f)', 'luid', '', 'dyn'), S('piano (p)', 'zacht', '', 'dyn'), S('crescendo', 'steeds luider', '', 'dyn'), S('decrescendo', 'steeds zachter', '', 'dyn'), S('allegro', 'vlug', '', 'tempo'), S('adagio', 'langzaam', '', 'tempo'), S('andante', 'rustig gaand, in wandeltempo', '', 'tempo'), S('ritardando', 'steeds langzamer', '', 'tempo'), S('staccato', 'kort en los', '', 'spel'), S('legato', 'aan elkaar gebonden', '', 'spel'),
  ], { f: (k) => `Wat betekent "${k}" in de muziek?`, r: (v) => `Welk muziekwoord betekent: ${v}?`, t: (k, v) => `"${cap(k)}" betekent ${v}.`, d: 2, typeMax: 0 });
  K.facts([
    S('melodie', 'het deuntje dat je kunt meezingen'), S('ritme', 'het patroon van lange en korte tonen'), S('akkoord', 'drie of meer tonen die tegelijk klinken'), S('toonladder', 'een rij tonen die netjes oploopt'), S('octaaf', 'de afstand van een toon naar dezelfde toon, acht tonen verder'), S('tempo', 'de snelheid van de muziek'), S('dirigent', 'iemand die een orkest leidt'), S('partituur', 'het geschreven stuk met alle stemmen'), S('majeur', 'klinkt vaak vrolijk'), S('mineur', 'klinkt vaak droevig'), S('maatsoort', 'bepaalt hoeveel tellen er in een maat zitten'), S('refrein', 'het deel dat steeds terugkomt in een lied'),
  ].map((r) => [r[0], r[1], r[2], { g: 'begrip' }]), { f: (k) => `Wat is ${k}?`, r: (v) => `Welk woord hoort bij: ${v}?`, t: (k, v) => `${cap(k)}: ${v}.`, d: 2, typeMax: 0 });
  K.mcs([
    ['Hoeveel tellen heeft een 3/4-maat (walsmaat)?', '3', ['2', '4', '6'], ''], ['Hoeveel tellen heeft een 4/4-maat?', '4', ['2', '3', '6'], ''],
    ['Welke letters gebruiken we voor de witte pianotoetsen?', 'C, D, E, F, G, A, B', ['A tot en met H', 'P, Q, R, S, T, U, V', 'X, Y, Z'], ''],
    ['Welke toon komt na G in de reeks?', 'A', ['H', 'B', 'C'], 'De reeks is C D E F G A B en dan weer C.'],
    ['Hoeveel lijnen heeft een notenbalk?', '5', ['4', '6', '3'], ''], ['Hoeveel witte toetsen zitten er in één octaaf?', '7', ['5', '8', '12'], ''],
    ['Welk instrument stemt een orkest vaak op: de toon...', 'a (kamertoon)', ['c', 'g', 'e'], 'De hobo geeft meestal de a aan.'],
    ['Wat is een solo?', 'een stuk dat één persoon speelt of zingt', ['een stuk voor een groot koor', 'een soort dans', 'een muziekinstrument'], ''],
    ['Wat is een duet?', 'muziek voor twee personen', ['muziek voor vier personen', 'een stuk zonder muziek', 'een luide toon'], ''],
    ['Wat is een kwartet?', 'een groep van vier muzikanten', ['een groep van twee muzikanten', 'een groep van acht muzikanten', 'een soort fluit'], ''],
    ['Wat is een koor?', 'een groep mensen die samen zingt', ['een groep gitaren', 'een muziekschool', 'een soort drum'], ''],
    ['Hoe heet het zingen zonder instrumenten?', 'a capella', ['crescendo', 'staccato', 'allegro'], ''],
  ]);
  K.tfs([['Een halve noot duurt langer dan een kwartnoot.', true], ['Forte betekent zacht.', false, 'Forte betekent luid; piano is zacht.'], ['Een mol maakt een toon lager.', true], ['Een kruis maakt een toon lager.', false, 'Een kruis maakt een toon hoger.'], ['Een dirigent speelt altijd het belangrijkste instrument.', false], ['Een octaaf heeft acht tonen, van C tot de volgende C.', true], ['Een akkoord bestaat uit één toon.', false, 'Een akkoord heeft minstens drie tonen.'], ['Adagio is een snel tempo.', false, 'Adagio is langzaam.']]);
  K.order('Zet de noten van kort naar lang.', ['achtste noot', 'kwartnoot', 'halve noot', 'hele noot']);
  K.order('Zet de dynamiek van zacht naar luid.', ['pianissimo (pp)', 'piano (p)', 'forte (f)', 'fortissimo (ff)']);
  K.order('Zet de tempo-woorden van langzaam naar vlug.', ['adagio', 'andante', 'allegro', 'presto']);
  K.order('Zet de pianotonen op volgorde, van C naar de volgende C.', ['C', 'D', 'E', 'F', 'G']);
  return K.out();
}

function religies() {
  const K = kit({ id: 'religies-feesten', name: 'Wereldreligies en feesten', emoji: '🕊️', group: 'Wereld', desc: 'Kerk, moskee, synagoge of tempel? En wat vieren mensen met Pasen, Diwali of het Suikerfeest?' });
  K.facts([
    ['christenen', 'de kerk', '', { g: 'huis' }], ['moslims', 'de moskee', '', { g: 'huis' }], ['joden', 'de synagoge', '', { g: 'huis' }], ['hindoes', 'de mandir (hindoetempel)', '', { g: 'huis' }], ['sikhs', 'de gurdwara', '', { g: 'huis' }], ['boeddhisten', 'de boeddhistische tempel', '', { g: 'huis' }],
  ], { f: (k) => `Waar komen ${k} vooral bijeen om te bidden?`, r: (v) => `Voor welke gelovigen is dit een gebedshuis: ${v}?`, t: (k, v) => `${cap(k)} komen bijeen in ${v}.`, d: 1, typeMax: 0 });
  K.facts([
    ['christenen', 'de Bijbel', '', { g: 'boek' }], ['moslims', 'de Koran', '', { g: 'boek' }], ['joden', 'de Tora', '', { g: 'boek' }], ['sikhs', 'de Guru Granth Sahib', '', { g: 'boek' }], ['hindoes', 'de Veda’s', '', { g: 'boek' }], ['boeddhisten', 'de Tripitaka', '', { g: 'boek' }],
  ], { f: (k) => `Welk heilig boek hoort bij ${k}?`, r: (v) => `Bij welke gelovigen hoort dit heilige boek: ${v}?`, t: (k, v) => `Voor ${k} is ${v} een heilig boek.`, d: 2, typeMax: 0 });
  K.facts([
    ['Kerstmis', 'de geboorte van Jezus', '', { e: '🎄' }], ['Pasen', 'de opstanding van Jezus', '', { e: '🐣' }], ['Pinksteren', 'de komst van de Heilige Geest', '', { e: '🕊️' }], ['het Suikerfeest', 'het einde van de vastenmaand ramadan', '', { e: '🍬' }], ['het Offerfeest', 'het verhaal van Ibrahim die bereid was zijn zoon op te offeren', '', { e: '🐑' }],
    ['Chanoeka', 'het lichtjesfeest van de joden', '', { e: '🕎' }], ['Pesach', 'de uittocht van de joden uit Egypte', '', { e: '🍞' }], ['Diwali', 'het lichtjesfeest van de hindoes', '', { e: '🪔' }], ['Holi', 'het kleurenfeest van de hindoes', '', { e: '🎨' }], ['Wesak (Vesak)', 'de geboorte, verlichting en dood van Boeddha', '', { e: '🪷' }], ['Jom Kippoer', 'de joodse verzoendag', '', { e: '🕯️' }], ['Rosj Hasjana', 'het joodse nieuwjaar', '', { e: '🍎' }],
  ], { f: (k) => `Wat wordt gevierd met ${k}?`, r: (v) => `Welk feest hoort bij: ${v}?`, t: (k, v) => `Met ${k} vieren mensen ${v}.`, d: 2, typeMax: 0, matchQ: 'Welk feest hoort bij welke betekenis?', matchN: 4, matches: 3 });
  K.facts([
    ['ramadan', 'een maand waarin moslims overdag vasten', '', { g: 'b' }], ['de sabbat', 'de joodse rustdag, van vrijdagavond tot zaterdagavond', '', { g: 'b' }], ['de zondag', 'de rustdag van de meeste christenen', '', { g: 'b' }], ['een imam', 'de voorganger in een moskee', '', { g: 'p' }], ['een rabbijn', 'een joodse geestelijke en leraar', '', { g: 'p' }], ['een pastoor', 'een katholieke priester', '', { g: 'p' }], ['de paus', 'de leider van de rooms-katholieke kerk', '', { g: 'p' }], ['de dalai lama', 'een geestelijk leider van de Tibetaanse boeddhisten', '', { g: 'p' }],
    ['Mekka', 'de heilige stad van de islam, in Saoedi-Arabië', '', { g: 'pl' }], ['Jeruzalem', 'een heilige stad voor joden, christenen en moslims', '', { g: 'pl' }], ['Varanasi', 'een heilige stad van de hindoes aan de rivier de Ganges', '', { g: 'pl' }], ['Rome (Vaticaanstad)', 'het centrum van de rooms-katholieke kerk', '', { g: 'pl' }],
  ], { f: (k) => `Wat is ${k}?`, r: (v) => `Wat hoort bij: ${v}?`, t: (k, v) => `${cap(k)} is ${v}.`, d: 2, typeMax: 0 });
  K.mcs([
    ['Hoeveel zuilen heeft de islam?', '5', ['3', '7', '10'], 'De vijf zuilen zijn geloofsbelijdenis, gebed, aalmoes, vasten en bedevaart.'],
    ['Hoeveel geboden staan er in de Tien Geboden?', '10', ['5', '7', '12'], ''],
    ['Welke religie is de oudste van de grote wereldreligies?', 'het hindoeïsme', ['de islam', 'het christendom', 'het sikhisme'], 'Het hindoeïsme is duizenden jaren oud.'],
    ['Wie was Siddhartha Gautama?', 'de Boeddha', ['de eerste paus', 'de profeet Mohammed', 'een Griekse god'], ''],
    ['Wat is een pelgrimstocht?', 'een reis naar een heilige plek', ['een soort feest', 'een vorm van vasten', 'een gebed'], ''],
    ['Op welke dag is het eerste kerstdag?', '25 december', ['24 december', '1 januari', '6 januari'], ''],
    ['Hoe heet het kerkgebouw van de katholieken dat de leider heeft in Rome?', 'de Sint-Pieter', ['de Notre-Dame', 'de Domkerk in Utrecht', 'de Oude Kerk'], 'De Sint-Pietersbasiliek staat in Vaticaanstad.'],
    ['Wat is het grootste godsdienst ter wereld (aantal gelovigen)?', 'het christendom', ['het boeddhisme', 'het jodendom', 'het sikhisme'], 'Daarna volgt de islam, daarna het hindoeïsme.'],
    ['Wat doen moslims vijf keer per dag?', 'bidden', ['vasten', 'offeren', 'naar Mekka reizen'], ''],
    ['Wat is een hoofddoek, kippa of tulband vooral?', 'een hoofdbedekking die bij een geloof kan horen', ['een soort schoen', 'een sieraad', 'een schooluniform'], 'Veel gelovigen dragen een hoofdbedekking uit respect, bijvoorbeeld een kippa (joods), hoofddoek (islam) of tulband (sikhisme).'],
  ]);
  K.tfs([['Een moskee is een gebedshuis van moslims.', true], ['Joden vieren Pasen zoals christenen dat doen.', false, 'Joden vieren Pesach, christenen vieren Pasen. Ze lijken wel op elkaar.'], ['Diwali is een feest met veel licht.', true], ['Het Suikerfeest wordt gevierd na de ramadan.', true], ['Alle mensen geloven in dezelfde god.', false, 'Mensen geloven op heel verschillende manieren, of helemaal niet.'], ['Respect voor elkaars geloof is belangrijk.', true]]);
  return K.out();
}

function sterrenbeelden() {
  const K = kit({ id: 'sterrenbeelden', name: 'Sterrenbeelden', emoji: '♈', group: 'Natuur', desc: 'De twaalf sterrenbeelden van de dierenriem, hun symbolen en periodes, plus beroemde sterrenbeelden aan de hemel.' });
  const Z = [['de Ram', '♈', 'ongeveer 21 maart tot 19 april', '10 april', 'vuur'], ['de Stier', '♉', 'ongeveer 20 april tot 20 mei', '5 mei', 'aarde'], ['de Tweelingen', '♊', 'ongeveer 21 mei tot 20 juni', '10 juni', 'lucht'], ['de Kreeft', '♋', 'ongeveer 21 juni tot 22 juli', '10 juli', 'water'], ['de Leeuw', '♌', 'ongeveer 23 juli tot 22 augustus', '5 augustus', 'vuur'], ['de Maagd', '♍', 'ongeveer 23 augustus tot 22 september', '10 september', 'aarde'],
    ['de Weegschaal', '♎', 'ongeveer 23 september tot 22 oktober', '5 oktober', 'lucht'], ['de Schorpioen', '♏', 'ongeveer 23 oktober tot 21 november', '10 november', 'water'], ['de Boogschutter', '♐', 'ongeveer 22 november tot 21 december', '10 december', 'vuur'], ['de Steenbok', '♑', 'ongeveer 22 december tot 19 januari', '5 januari', 'aarde'], ['de Waterman', '♒', 'ongeveer 20 januari tot 18 februari', '5 februari', 'lucht'], ['de Vissen', '♓', 'ongeveer 19 februari tot 20 maart', '5 maart', 'water']];
  const names = Z.map((z) => z[0]);
  K.facts(Z.map((z) => [z[0], z[2], '', { e: z[1], d: 3 }]), { f: (k) => `In welke periode loopt ${k}?`, t: (k, v) => `${cap(k)} loopt van ${v.replace('ongeveer ', 'ongeveer ')}.`, typeMax: 0, d: 3 });
  K.facts(Z.map((z) => [`je jarig bent op ${z[3]}`, z[0], `${z[0].replace('de ', 'De ')} loopt ${z[2]}.`, { e: z[1], d: 2, alt: [z[0].slice(3)] }]), { f: (k) => `Welk sterrenbeeld heb je als ${k}?`, t: (k, v) => `Als ${k}, is je sterrenbeeld ${v}.`, pool: names, typeMax: 0, d: 2 });
  K.facts(Z.map((z) => [z[1], z[0], '', { d: 1, alt: [z[0].slice(3)] }]), { f: (k) => `Bij welk sterrenbeeld hoort het teken ${k}?`, t: (k, v) => `Het teken ${k} hoort bij ${v}.`, pool: names, typeMax: 0, d: 2 });
  const el = { vuur: ['de Ram', 'de Leeuw', 'de Boogschutter'], aarde: ['de Stier', 'de Maagd', 'de Steenbok'], lucht: ['de Tweelingen', 'de Weegschaal', 'de Waterman'], water: ['de Kreeft', 'de Schorpioen', 'de Vissen'] };
  K.groups(el, { which: (it) => `Bij welk element wordt ${it} meestal gerekend?`, names: Object.keys(el), tfq: (it, c) => `${cap(it)} hoort bij het element ${c}.`, multi: (n) => `Welke sterrenbeelden horen bij het element ${n}?`, reps: 2 });
  K.mcs([
    ['Hoeveel sterrenbeelden heeft de dierenriem?', '12', ['10', '8', '14'], ''], ['Wat is een sterrenbeeld?', 'een patroon van sterren aan de hemel', ['een soort planeet', 'een standbeeld van een ster', 'een satelliet'], ''],
    ['Welk sterrenbeeld heet ook wel de Grote Wagen of Steelpan?', 'de Grote Beer', ['Orion', 'de Zwaan', 'de Leeuw'], 'De Grote Wagen is een deel van de Grote Beer.'],
    ['Welke ster helpt je het noorden te vinden?', 'de Poolster', ['de Zon', 'Sirius', 'de Maan'], ''], ['Welk sterrenbeeld heeft drie sterren in een rij als een gordel?', 'Orion', ['de Kleine Beer', 'Cassiopeia', 'de Zwaan'], ''],
    ['Welke is de helderste ster aan onze nachtelijke hemel?', 'Sirius', ['de Poolster', 'Betelgeuze', 'Alpha Centauri'], ''],
    ['Wat is de zon eigenlijk?', 'een ster', ['een planeet', 'een komeet', 'een maan'], 'De zon is de dichtstbijzijnde ster.'],
    ['Wat is de dierenriem?', 'de baan waarlangs zon en planeten langs de sterrenbeelden lijken te gaan', ['een lijst met dieren', 'een riem voor dieren', 'een planeet'], ''],
    ['Op welk halfrond zie je het Zuiderkruis?', 'het zuidelijk halfrond', ['het noordelijk halfrond', 'alleen op de noordpool', 'nergens'], ''],
  ]);
  K.tfs([['De Steenbok is een sterrenbeeld.', true], ['Sterrenbeelden kunnen voorspellen wat er gaat gebeuren.', false, 'Sterrenwichelarij (astrologie) is geen wetenschap. Sterrenkunde (astronomie) wel.'], ['De sterren in een sterrenbeeld staan vlak bij elkaar in de ruimte.', false, 'Ze liggen vaak enorm ver uit elkaar, ze lijken alleen bij elkaar vanaf de aarde.'], ['De Poolster staat bijna precies boven de noordpool.', true], ['Een Tweeling is een sterrenbeeld.', true], ['Een Schorpioen is een sterrenbeeld.', true], ['De Maan is een ster.', false, 'De Maan draait om de aarde en is geen ster.']]);
  K.order('Zet de sterrenbeelden op volgorde van het jaar, beginnend met de Ram (maart).', ['de Ram', 'de Stier', 'de Tweelingen', 'de Kreeft', 'de Leeuw']);
  K.order('Zet deze sterrenbeelden op volgorde van het jaar.', ['de Weegschaal', 'de Schorpioen', 'de Boogschutter', 'de Steenbok']);
  return K.out();
}

function beroepen() {
  const K = kit({ id: 'beroepen-nl', name: 'Beroepen en wat ze doen', emoji: '👷', group: 'Wereld', desc: 'Wat doet een loodgieter, een rechter of een meteoroloog? En welk gereedschap hoort erbij?' });
  const B = [['de brandweerman', 'blust branden en redt mensen', '🧑‍🚒'], ['de huisarts', 'stelt vast wat je mankeert en schrijft zo nodig medicijnen voor', '🩺'], ['de tandarts', 'zorgt voor je tanden en kiezen', '🦷'], ['de bakker', 'bakt brood en taarten', '🥖'], ['de slager', 'verkoopt vlees', '🥩'], ['de loodgieter', 'repareert leidingen en kranen', '🔧'], ['de timmerman', 'maakt dingen van hout', '🪚'],
    ['de schilder', 'verft muren en deuren', '🖌️'], ['de elektricien', 'legt stroomdraden aan', '💡'], ['de piloot', 'bestuurt een vliegtuig', '✈️'], ['de machinist', 'bestuurt een trein', '🚆'], ['de agent', 'zorgt voor veiligheid op straat', '👮'], ['de rechter', 'beslist wat er moet gebeuren als iemand de wet overtreedt', '⚖️'], ['de advocaat', 'verdedigt iemand bij de rechter', '👩‍⚖️'],
    ['de dierenarts', 'helpt zieke dieren', '🐕'], ['de kapper', 'knipt haar', '💇'], ['de boer', 'verbouwt gewassen of houdt dieren', '🧑‍🌾'], ['de visser', 'vangt vis op zee', '🎣'], ['de leraar', 'geeft les op school', '🧑‍🏫'], ['de bibliothecaris', 'helpt je boeken vinden', '📚'], ['de journalist', 'schrijft over het nieuws', '📰'], ['de architect', 'ontwerpt gebouwen', '🏛️'],
    ['de verpleegkundige', 'verzorgt patiënten, bijvoorbeeld in een ziekenhuis', '🧑‍⚕️'], ['de postbode', 'bezorgt brieven en pakjes', '📮'], ['de kok', 'maakt eten in een restaurant', '👨‍🍳'], ['de apotheker', 'geeft medicijnen mee', '💊'], ['de archeoloog', 'onderzoekt oude spullen uit de grond', '🏺'], ['de meteoroloog', 'voorspelt het weer', '⛅'], ['de programmeur', 'schrijft computerprogramma’s', '💻'], ['de fotograaf', 'maakt foto’s', '📷']];
  K.facts(B.map((b) => [b[0], b[1], '', { e: b[2], d: 1 }]), { f: (k) => `Wat doet ${k}?`, r: (v) => `Welk beroep past bij: ${v}?`, t: (k, v) => `${cap(k)} ${v}.`, typeMax: 0, d: 1, matchQ: 'Welk beroep hoort bij wat hij of zij doet?', matchN: 4, matches: 5 });
  K.facts([['de dokter', 'een stethoscoop'], ['de kapper', 'een schaar'], ['de schilder', 'een kwast'], ['de timmerman', 'een zaag'], ['de brandweerman', 'een brandslang'], ['de visser', 'een net'], ['de fotograaf', 'een camera'], ['de kok', 'een pollepel'], ['de metselaar', 'een troffel'], ['de tuinman', 'een schoffel'], ['de tandarts', 'een spiegeltje'], ['de piloot', 'een stuurknuppel']].map((r) => [r[0], r[1], '', { g: 'gereedschap', d: 2 }]), { f: (k) => `Welk gereedschap hoort bij ${k}?`, r: (v) => `Bij welk beroep hoort ${v}?`, t: (k, v) => `${cap(k)} gebruikt ${v}.`, typeMax: 0, matchQ: 'Verbind het beroep met het gereedschap.', matchN: 4, matches: 2 });
  K.mcs([['Wie werkt vaak in een ziekenhuis?', 'een chirurg', ['een bakker', 'een kapper', 'een visser'], ''], ['Wie leert kinderen op de basisschool?', 'de juf of meester', ['de loodgieter', 'de piloot', 'de slager'], ''], ['Hoe heet iemand die huizen bouwt met stenen?', 'een metselaar', ['een tuinman', 'een bibliothecaris', 'een kok'], ''], ['Wie zorgt ervoor dat je in het vliegtuig veilig aankomt?', 'de piloot', ['de kapper', 'de bakker', 'de postbode'], ''], ['Hoe heet een mevrouw of meneer die op boten werkt en het schip bestuurt?', 'de kapitein', ['de piloot', 'de machinist', 'de architect'], ''], ['Hoe heet iemand die in de ruimte reist?', 'astronaut', ['archeoloog', 'architect', 'apotheker'], '']]);
  K.tfs([['Een loodgieter repareert waterleidingen.', true], ['Een bakker verft muren.', false, 'Een schilder verft muren, een bakker bakt brood.'], ['Een architect ontwerpt gebouwen.', true], ['Een archeoloog onderzoekt oude voorwerpen uit de grond.', true], ['Een rechter verkoopt vlees.', false], ['Een meteoroloog voorspelt het weer.', true]]);
  return K.out();
}

function verkeersborden() {
  const K = kit({ id: 'verkeersborden', name: 'Verkeersborden', emoji: '🛑', group: 'Wereld', desc: 'Wat betekent een rood achtkant, een gele ruit of een blauw bord met een fiets?' });
  K.facts([
    ['een rood achtkant met het woord STOP', 'stoppen en voorrang verlenen', '', { e: '🛑' }], ['een driehoek met de punt naar beneden en een rode rand', 'voorrang verlenen', '', { e: '🔻' }], ['een gele ruit met een witte rand', 'je rijdt op een voorrangsweg', '', { e: '🔶' }], ['een rond bord met rode rand en het getal 30', 'je mag niet harder dan 30 kilometer per uur', '', { e: '3️⃣' }],
    ['een rond rood bord met een witte horizontale balk', 'verboden in te rijden', '', { e: '⛔' }], ['een blauw vierkant bord met een witte P', 'hier mag je parkeren', '', { e: '🅿️' }], ['een rond bord met rode rand en een fiets', 'verboden voor fietsers', '', { e: '🚲' }], ['een rond blauw bord met een witte fiets', 'verplicht fietspad', '', { e: '🚲' }],
    ['een driehoek met rode rand en twee kinderen', 'pas op, hier kunnen kinderen oversteken of spelen', '', { e: '🧒' }], ['een rond bord met rode rand en twee autootjes naast elkaar', 'inhalen is verboden', '', { e: '🚗' }], ['een blauw vierkant bord met een lopend mannetje op een zebrapad', 'hier kunnen voetgangers oversteken', '', { e: '🚶' }], ['een blauw rond bord met rode rand en een rode schuine streep', 'parkeren is verboden', '', { e: '🚫' }],
    ['een blauw rond bord met een witte pijl omhoog', 'je moet rechtdoor', '', { e: '⬆️' }], ['een blauw rond bord met een witte pijl naar rechts', 'je moet rechtsaf', '', { e: '➡️' }], ['een driehoek met rode rand en een zwart kruis', 'pas op voor een kruising met gelijke wegen', '', { e: '✖️' }], ['een driehoek met rode rand en slagbomen', 'pas op voor een spoorwegovergang', '', { e: '🚧' }],
  ], { f: (k) => `Wat betekent ${k}?`, r: (v) => `Bij welk bord past: ${v}?`, t: (k, v) => `Bij ${k} geldt: ${v}.`, typeMax: 0, d: 2, matchQ: 'Welk bord hoort bij welke betekenis?', matchN: 4, matches: 3 });
  K.facts([
    ['rood', 'stoppen', '', { g: 'l' }], ['groen', 'doorrijden als de weg vrij is', '', { g: 'l' }], ['oranje (geel)', 'stoppen, tenzij je al te dicht bij het stoplicht bent', '', { g: 'l' }],
  ], { f: (k) => `Wat moet je doen bij een ${k} verkeerslicht?`, t: (k, v) => `Bij een ${k} verkeerslicht moet je ${v}.`, typeMax: 0, d: 1, e: false });
  K.mcs([
    ['Wie heeft voorrang op een kruispunt zonder borden en verkeerslichten?', 'verkeer van rechts', ['verkeer van links', 'de grootste auto', 'de snelste auto'], ''],
    ['Hoe hard mag je meestal in de bebouwde kom?', '50 kilometer per uur', ['30 kilometer per uur', '80 kilometer per uur', '100 kilometer per uur'], 'Soms is het lager, bijvoorbeeld 30 bij scholen.'],
    ['Hoe laat je als fietser zien dat je rechtsaf gaat?', 'je steekt je rechterarm uit', ['je toetert', 'je knippert met je licht', 'je zwaait met je linkerarm'], ''],
    ['Wat betekent een zebrapad?', 'voetgangers hebben er voorrang', ['auto’s hebben er voorrang', 'je mag er parkeren', 'je mag er niet lopen'], ''],
    ['Waar moet je als voetganger lopen als er geen stoep is?', 'aan de kant van de weg, het liefst links', ['midden op de weg', 'op het fietspad', 'op de rijbaan rechts'], 'Zo zie je het verkeer op je af komen.'],
    ['Wat doe je voor je een straat oversteekt?', 'kijk links, rechts en nog eens links', ['sluit je ogen', 'ren zo snel mogelijk', 'bel iemand op'], ''],
    ['Wat is de kleur van de meeste waarschuwingsborden?', 'wit met een rode rand, in een driehoek', ['blauw en rond', 'groen en vierkant', 'geel en achthoekig'], ''],
    ['Mag je met je fiets door rood licht?', 'nee, je moet stoppen', ['ja, als het rustig is', 'ja, als je haast hebt', 'ja, als je belt'], ''],
  ]);
  K.tfs([['Een stopbord heeft de vorm van een achthoek.', true], ['Een rond blauw bord met een wit symbool is een gebod.', true], ['Een rond bord met rode rand is meestal een verbod.', true], ['Op een zebrapad moeten voetgangers wachten tot de auto’s weg zijn.', false, 'Auto’s moeten voetgangers op het zebrapad laten oversteken.'], ['Voorrangsweg: een gele ruit met een witte rand.', true]]);
  return K.out();
}

export const builders = [ehbo, muziektheorie, religies, sterrenbeelden, beroepen, verkeersborden];
