// Ronde 4 – kits B: Dierenrecords, Wereldwonderen, Spaans huis/school, Raadsels en rijtjes, Afronden en schatten.
import { Q } from './r4-packs.js?v=1';
const { mc, tf, num, ty, fill, ord, mt } = Q;

const records = [
  mc('Wat is het snelste landdier?', 'de cheetah', 'de leeuw', 'het paard', 'de hond'),
  mc('Wat is het grootste dier ter wereld?', 'de blauwe vinvis', 'de olifant', 'de haai', 'de giraf'),
  mc('Wat is het langste landdier?', 'de giraf', 'de olifant', 'de neushoorn', 'de kameel'),
  mc('Wat is het zwaarste landdier?', 'de olifant', 'de giraf', 'de nijlpaard', 'de leeuw', 'Een Afrikaanse olifant kan wel 6000 kilo wegen.'),
  mc('Welke vogel duikt het snelst als hij op een prooi jaagt?', 'de slechtvalk', 'de mus', 'de pinguïn', 'de kip'),
  mc('Welke vogel is de grootste ter wereld?', 'de struisvogel', 'de adelaar', 'de ooievaar', 'de pelikaan'),
  mc('Welke vogel is de kleinste ter wereld?', 'de kolibrie', 'de mus', 'de merel', 'de duif'),
  mc('Welk zoogdier beweegt zich het langzaamst?', 'de luiaard', 'de olifant', 'de koe', 'de egel'),
  tf('De vleermuis is het enige zoogdier dat echt kan vliegen.', true),
  tf('Een dolfijn is een vis.', false, 'Een dolfijn is een zoogdier: hij ademt lucht en geeft melk aan zijn jong.'),
  tf('Een pinguïn kan vliegen.', false, 'Een pinguïn zwemt juist heel goed.'),
  tf('In de bult van een kameel zit vooral vet.', true, 'Niet water, maar vet als voorraad.'),
  tf('Een blauwe vinvis is groter en zwaarder dan elke dinosaurus ooit was.', true),
  tf('Een vlinder kan met zijn voeten proeven.', true),
  num('Hoeveel poten heeft een spin?', 8),
  num('Hoeveel poten heeft een insect?', 6),
  num('Hoeveel hartjes heeft een octopus?', 3),
  num('Hoeveel nekwervels heeft een giraf? (net zoveel als een mens)', 7),
  mc('Welk dier kan het langst leven op het land?', 'de reuzenschildpad', 'de hond', 'de muis', 'de kat'),
  mc('Hoe heet het jong van een kikker?', 'dikkopje', 'lammetje', 'kalfje', 'veulen'),
  mc('Welk dier slaapt het meeste van de dag?', 'de koala', 'de giraf', 'het paard', 'de kip'),
  mc('Welk dier is in verhouding tot zijn gewicht het sterkst?', 'de mestkever', 'de olifant', 'de beer', 'de haai'),
  mc('Welk dier kan zijn kop ongeveer 270 graden draaien?', 'de uil', 'de hond', 'de koe', 'de eend'),
  mc('Welk zoogdier leeft in de zee en is de grootste tandwalvis?', 'de potvis', 'de dolfijn', 'de zeehond', 'de zeekoe'),
  ord('Zet op volgorde van klein naar groot', ['mier', 'kat', 'paard', 'olifant']),
  ord('Zet op volgorde van langzaam naar snel', ['slak', 'mens', 'paard', 'cheetah']),
  mt('Verbind het dier met het record', [['cheetah', 'snelste op land'], ['giraf', 'langste hals'], ['luiaard', 'traagste zoogdier'], ['kolibrie', 'kleinste vogel']]),
  mt('Hoeveel poten?', [['spin', '8'], ['kat', '4'], ['vogel', '2'], ['bij', '6']]),
  fill('De ___ is het grootste dier ter wereld.', 'blauwe vinvis', ['blauwe vinvis', 'olifant', 'haai', 'giraf']),
  ty('Welk Afrikaans dier heeft zwarte en witte strepen?', 'zebra'),
];

const wonderen = [
  mc('In welk land staat de Eiffeltoren?', 'Frankrijk', 'Italië', 'Spanje', 'Engeland'),
  mc('In welk land staan de piramides van Gizeh?', 'Egypte', 'India', 'Mexico', 'China'),
  mc('In welk land staat de Taj Mahal?', 'India', 'China', 'Egypte', 'Turkije'),
  mc('In welke stad staat het Colosseum?', 'Rome', 'Athene', 'Parijs', 'Madrid'),
  mc('In welk land ligt Machu Picchu?', 'Peru', 'Spanje', 'Egypte', 'Mongolië'),
  mc('In welk land staat Christus de Verlosser op een berg?', 'Brazilië', 'Argentinië', 'Mexico', 'Spanje'),
  mc('In welke stad staat het Vrijheidsbeeld?', 'New York', 'Londen', 'Parijs', 'Sydney'),
  mc('In welke stad staat de Big Ben?', 'Londen', 'Berlijn', 'Dublin', 'Brussel'),
  mc('In welke stad staat de Sagrada Familia?', 'Barcelona', 'Madrid', 'Lissabon', 'Rome'),
  mc('Welk gebouw in Dubai is het hoogste ter wereld?', 'de Burj Khalifa', 'de Eiffeltoren', 'de Big Ben', 'het Atomium'),
  mc('In welke stad staat het Opera House met de zeilen?', 'Sydney', 'Tokio', 'Moskou', 'Wenen'),
  mc('Wat is de hoogste berg ter wereld?', 'de Mount Everest', 'de Mont Blanc', 'de Kilimanjaro', 'de Vaalserberg'),
  mc('In welk land staat de scheve toren van Pisa?', 'Italië', 'Frankrijk', 'Griekenland', 'Portugal'),
  mc('In welk land staat Stonehenge?', 'Engeland', 'Spanje', 'Duitsland', 'Noorwegen'),
  mc('In welke stad staat het Atomium?', 'Brussel', 'Amsterdam', 'Parijs', 'Luxemburg'),
  mc('Welke stad heeft de Akropolis?', 'Athene', 'Rome', 'Istanbul', 'Cairo'),
  mc('Waar ligt het Great Barrier Reef, het grootste koraalrif?', 'Australië', 'Egypte', 'Spanje', 'Canada'),
  mc('Waarvoor werd de Chinese Muur oorspronkelijk gebouwd?', 'om aanvallers tegen te houden', 'als snelweg', 'als dierentuin', 'als school'),
  tf('De Eiffeltoren staat in Londen.', false, 'Hij staat in Parijs.'),
  tf('De scheve toren van Pisa staat een beetje scheef.', true),
  tf('De Grand Canyon ligt in de Verenigde Staten.', true),
  tf('Het Colosseum werd gebouwd door de Romeinen.', true),
  tf('De Chinese Muur is vanuit de ruimte met het blote oog gemakkelijk te zien.', false, 'Dat is een mythe: hij is veel te smal.'),
  ord('Zet op volgorde van laag naar hoog', ['een huis', 'de Eiffeltoren', 'de Burj Khalifa', 'de Mount Everest']),
  mt('Verbind het bouwwerk met het land', [['Taj Mahal', 'India'], ['Colosseum', 'Italië'], ['Eiffeltoren', 'Frankrijk'], ['Machu Picchu', 'Peru']]),
  mt('Verbind het bouwwerk met de stad', [['Big Ben', 'Londen'], ['Vrijheidsbeeld', 'New York'], ['Atomium', 'Brussel'], ['Sagrada Familia', 'Barcelona']]),
  fill('De hoogste berg ter wereld heet de ___.', 'Mount Everest', ['Mount Everest', 'Vaalserberg', 'Mont Blanc', 'Matterhorn']),
  num('Hoe hoog is de Mount Everest ongeveer in kilometers (afgerond op hele kilometers)?', 9, 'Ruim 8,8 km.', 0.6),
];

const spaans = [
  mc('Wat betekent "casa"?', 'huis', 'auto', 'kat', 'deur'),
  mc('Wat betekent "puerta"?', 'deur', 'raam', 'tafel', 'stoel'),
  mc('Wat betekent "ventana"?', 'raam', 'deur', 'bed', 'dak'),
  mc('Wat betekent "mesa"?', 'tafel', 'stoel', 'kast', 'bord'),
  mc('Wat betekent "silla"?', 'stoel', 'tafel', 'bed', 'lamp'),
  mc('Wat betekent "cama"?', 'bed', 'kast', 'bad', 'tafel'),
  mc('Wat betekent "cocina"?', 'keuken', 'badkamer', 'tuin', 'slaapkamer'),
  mc('Wat betekent "baño"?', 'badkamer', 'keuken', 'zolder', 'gang'),
  mc('Wat betekent "jardín"?', 'tuin', 'huis', 'straat', 'kamer'),
  mc('Wat betekent "escuela"?', 'school', 'winkel', 'ziekenhuis', 'bakker'),
  mc('Wat betekent "libro"?', 'boek', 'pen', 'tas', 'schrift'),
  mc('Wat betekent "lápiz"?', 'potlood', 'gum', 'liniaal', 'schaar'),
  mc('Wat betekent "mochila"?', 'rugzak', 'jas', 'schoen', 'bril'),
  mc('Wat betekent "cuaderno"?', 'schrift', 'boek', 'bord', 'tas'),
  mc('Wat betekent "pizarra"?', 'schoolbord', 'tafel', 'krijt', 'raam'),
  mc('Wat betekent "maestro"?', 'leraar', 'leerling', 'dokter', 'bakker'),
  mc('Wat betekent "goma"?', 'gum', 'pen', 'lijm', 'tas'),
  mc('Wat betekent "regla"?', 'liniaal', 'schaar', 'potlood', 'schrift'),
  ty('Hoe zeg je "huis" in het Spaans?', 'casa'),
  ty('Hoe zeg je "boek" in het Spaans?', 'libro'),
  ty('Hoe zeg je "deur" in het Spaans?', 'puerta'),
  ty('Hoe zeg je "tafel" in het Spaans?', 'mesa'),
  ty('Hoe zeg je "stoel" in het Spaans?', 'silla'),
  ty('Hoe zeg je "school" in het Spaans?', 'escuela'),
  mt('Verbind het Spaanse woord met het Nederlandse', [['casa', 'huis'], ['libro', 'boek'], ['mesa', 'tafel'], ['ventana', 'raam']]),
  mt('Verbind het Spaanse woord met het Nederlandse', [['cama', 'bed'], ['cocina', 'keuken'], ['escuela', 'school'], ['lápiz', 'potlood']]),
  fill('La ___ es grande. (het huis)', 'casa', ['casa', 'mesa', 'silla', 'goma']),
  fill('Abro la ___. (de deur)', 'puerta', ['puerta', 'cama', 'mochila', 'regla']),
].map((q) => ({ ...q, lang: 'es' }));

const logica = [
  num('Welk getal komt hierna? 2, 4, 8, 16, ...', 32, 'Het getal wordt steeds verdubbeld.'),
  num('Welk getal komt hierna? 1, 1, 2, 3, 5, 8, ...', 13, 'Elk getal is de som van de vorige twee.'),
  num('Welk getal komt hierna? 3, 6, 9, 12, ...', 15),
  num('Welk getal komt hierna? 100, 90, 80, ...', 70),
  num('Welk getal komt hierna? 1, 4, 9, 16, ...', 25, 'Het zijn kwadraten: 1×1, 2×2, 3×3, 4×4, 5×5.'),
  ty('Welke letter komt hierna? A, C, E, G, ...', 'I', ['i']),
  mc('Wat heeft vier poten maar kan niet lopen?', 'een tafel', 'een hond', 'een kat', 'een paard'),
  mc('Wat wordt natter naarmate het meer droogt?', 'een handdoek', 'een spons', 'een zeep', 'een kam'),
  mc('Wat gaat elk jaar omhoog maar nooit omlaag?', 'je leeftijd', 'de temperatuur', 'de zon', 'een lift'),
  mc('Hoeveel maanden hebben 28 dagen?', 'alle twaalf', 'maar één', 'twee', 'geen enkele'),
  mc('Wat weegt meer: een kilo veren of een kilo ijzer?', 'ze wegen even veel', 'een kilo veren', 'een kilo ijzer', 'dat kun je niet weten'),
  mc('Een boer heeft 17 schapen. Alle behalve 9 lopen weg. Hoeveel schapen houdt hij?', '9', '8', '17', '0'),
  mc('Welke past er niet bij? appel, peer, banaan, wortel', 'wortel', 'appel', 'peer', 'banaan', 'De wortel is een groente, de rest is fruit.'),
  mc('Welke past er niet bij? hond, kat, vis, tafel', 'tafel', 'hond', 'kat', 'vis', 'Een tafel is geen dier.'),
  mc('Welke past er niet bij? rood, blauw, groen, vierkant', 'vierkant', 'rood', 'blauw', 'groen', 'Vierkant is een vorm, de rest zijn kleuren.'),
  mc('Wat komt hierna? maandag, dinsdag, woensdag, ...', 'donderdag', 'vrijdag', 'zondag', 'maandag'),
  mc('Welke maand heeft de minste dagen?', 'februari', 'januari', 'april', 'juni'),
  mc('Wat is zwaarder? Een emmer water of een emmer lucht?', 'de emmer water', 'de emmer lucht', 'ze wegen even veel', 'dat kan niet'),
  tf('Een kwartier is 15 minuten.', true),
  tf('Een rechthoek heeft vijf hoeken.', false, 'Een rechthoek heeft vier hoeken.'),
  tf('De helft van 50 is 25.', true),
  num('Hoeveel hoeken heeft een driehoek?', 3),
  num('Hoeveel is de helft van de helft van 100?', 25),
  num('Hoeveel dagen zitten er in een week?', 7),
  num('Je hebt 3 zakjes met elk 4 knikkers. Hoeveel knikkers heb je samen?', 12),
  ord('Zet op volgorde van klein naar groot', ['1/4', '1/2', '3/4', '1']),
  ord('Zet de getallen van klein naar groot', ['9', '19', '90', '109']),
  mt('Verbind de vorm met het aantal zijden', [['driehoek', '3'], ['vierkant', '4'], ['vijfhoek', '5'], ['zeshoek', '6']]),
  mt('Verbind de som met het antwoord', [['6 + 6', '12'], ['5 × 3', '15'], ['20 - 9', '11'], ['18 : 3', '6']]),
];

// Afronden en schatten: antwoorden worden uitgerekend, dus altijd kloppend
function afronden() {
  const out = [];
  const tens = [23, 47, 65, 82, 38, 51, 94, 76];
  for (const n of tens) out.push(Q.num(`Rond ${n} af op tientallen.`, Math.round(n / 10) * 10, n % 10 === 5 ? 'Bij een 5 ronden we naar boven af.' : `${n} ligt het dichtst bij ${Math.round(n / 10) * 10}.`));
  const hunds = [340, 468, 725, 190, 852, 610];
  for (const n of hunds) out.push(Q.num(`Rond ${n} af op honderdtallen.`, Math.round(n / 100) * 100, `${n} ligt het dichtst bij ${Math.round(n / 100) * 100}.`));
  const halves = [36, 58, 84, 120, 46];
  for (const n of halves) out.push(Q.num(`Wat is de helft van ${n}?`, n / 2));
  const dubs = [17, 25, 45, 38];
  for (const n of dubs) out.push(Q.num(`Wat is het dubbele van ${n}?`, n * 2));
  const pcts = [[10, 250], [50, 80], [10, 90], [25, 100]];
  for (const [p, n] of pcts) out.push(Q.num(`Hoeveel is ${p}% van ${n}?`, (p * n) / 100));
  out.push(Q.mc('Schat: 49 + 51 is ongeveer...', '100', '50', '150', '200'));
  out.push(Q.mc('Schat: 98 + 103 is ongeveer...', '200', '100', '300', '400'));
  out.push(Q.tf('Als je 45 afrondt op tientallen krijg je 50.', true, 'Een 5 rond je naar boven af.'));
  out.push(Q.tf('Als je 31 afrondt op tientallen krijg je 40.', false, '31 rond je af naar 30.'));
  return out;
}

export default { records, wonderen, spaans, logica, afronden: afronden() };
