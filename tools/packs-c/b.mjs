// PACKS-C (deel b): taal en dialecten, gezegden, vulkanen, Olympische sporten, Nederlandse feestdagen, dagen en maanden.
import { kit } from '../packs-b/lib.mjs';
const cap = (s) => s[0].toUpperCase() + s.slice(1);

function dialecten() {
  const K = kit({ id: 'nl-dialecten', name: 'Talen en dialecten in Nederland', emoji: '🗨️', group: 'Spelling', desc: 'Fries, Limburgs, Vlaams, Afrikaans en meer: wie spreekt welke taal of streektaal?' });
  K.facts([
    ['Goeie moarn', 'goedemorgen'], ['Dankewol', 'dank u wel'], ['Heit', 'vader'], ['Mem', 'moeder'], ['Hûs', 'huis'], ['Tsjerke', 'kerk'], ['Skoalle', 'school'], ['Wetter', 'water'], ['Fisk', 'vis'], ['Kâld', 'koud'], ['Ik hâld fan dy', 'ik hou van jou'], ['Sinne', 'zon'],
  ].map((r) => [r[0], r[1], '', { g: 'fries' }]), { f: (k) => `Wat betekent het Friese "${k}" in het Nederlands?`, r: (v) => `Hoe zeg je "${v}" in het Fries?`, t: (k, v) => `Het Friese "${k}" betekent "${v}".`, typeMax: 20, d: 2, matchQ: 'Verbind het Friese woord met de Nederlandse betekenis.', matchN: 4, matches: 3 });
  K.facts([
    ['Papiaments', 'Aruba, Bonaire en Curaçao', '', { e: '🏝️' }], ['Sranan Tongo', 'Suriname', '', { e: '🌴' }], ['Afrikaans', 'Zuid-Afrika', 'Afrikaans is ontstaan uit het Nederlands van de zeventiende eeuw.', { e: '🇿🇦' }], ['Vlaams', 'België (Vlaanderen)', 'In Vlaanderen spreken ze een eigen variant van het Nederlands.', { e: '🇧🇪' }], ['Zeeuws', 'Zeeland', '', { e: '🦪' }], ['Gronings', 'Groningen', '', { e: '🌾' }],
  ], { f: (k) => `Waar hoor je vooral ${k}?`, r: (v) => `Welke taal of streektaal hoort bij ${v}?`, t: (k, v) => `${cap(k)} wordt vooral gesproken in ${v}.`, typeMax: 16, d: 2 });
  K.mcs([
    ['In welke provincie is Fries een officiële taal?', 'Friesland', ['Groningen', 'Zeeland', 'Limburg'], 'Fries is een officiële taal in Nederland, naast het Nederlands.'],
    ['Wat is een dialect?', 'een streekeigen manier van praten', ['een soort schrijfletter', 'een vreemde taal die niemand kent', 'een telefoonnummer'], 'Een dialect heeft eigen woorden en klanken.'],
    ['Hoe heet het Nederlands dat overal begrepen wordt?', 'Standaardnederlands (ABN)', ['Brabants', 'Fries', 'Vlaams'], ''],
    ['Welke taal is naast het Nederlands officieel in Nederland?', 'Fries', ['Duits', 'Frans', 'Engels'], ''],
    ['Welk woord gebruiken mensen in Brabant en Vlaanderen vaak voor "jij"?', 'gij', ['wij', 'zij', 'ik'], ''],
    ['Hoe heet de taal die op Curaçao, Aruba en Bonaire veel gesproken wordt?', 'Papiaments', ['Fries', 'Limburgs', 'Zeeuws'], ''],
    ['Wat is "Houdoe" in veel zuidelijke dialecten?', 'een groet bij het afscheid', ['een soort eten', 'een dier', 'een plaats'], 'Houdoe betekent ongeveer "houd je goed", dus tot ziens.'],
  ]);
  K.tfs([['In Friesland is Fries een officiële taal.', true], ['Afrikaans is ontstaan uit het Nederlands.', true], ['Iedereen in Nederland spreekt precies hetzelfde.', false, 'Er zijn veel dialecten en streektalen.'], ['Een dialect is een foute manier van praten.', false, 'Een dialect is gewoon een streekeigen manier van praten.'], ['Papiaments wordt gesproken op de Antillen.', true], ['Standaardnederlands wordt overal in het land als gemeenschappelijke taal gebruikt.', true]]);
  return K.out();
}

function gezegden() {
  const K = kit({ id: 'nl-gezegden', name: 'Gezegden en uitdrukkingen', emoji: '💬', group: 'Spelling', desc: 'Wat betekent "met de deur in huis vallen" of "de kat uit de boom kijken"?' });
  K.facts([
    ['met de deur in huis vallen', 'meteen zeggen waar het om gaat'], ['een spijker op laag water zoeken', 'zeuren over een kleinigheid'], ['door het oog van de naald kruipen', 'maar net ontsnappen'], ['de kat uit de boom kijken', 'eerst even afwachten'], ['het regent pijpenstelen', 'het regent heel hard'], ['iemand een poets bakken', 'een grap met iemand uithalen'], ['uit zijn dak gaan', 'door het dolle heen zijn'],
    ['zo gek als een deur', 'heel erg gek'], ['in het water vallen', 'niet doorgaan'], ['geen blad voor de mond nemen', 'eerlijk zeggen wat je denkt'], ['hoge bomen vangen veel wind', 'belangrijke mensen krijgen veel kritiek'], ['er geen gras over laten groeien', 'er snel iets aan doen'], ['de kogel is door de kerk', 'er is een besluit genomen'], ['water naar de zee dragen', 'iets nutteloos doen'],
    ['tussen wal en schip vallen', 'door twee partijen niet geholpen worden'], ['het ei van Columbus', 'een simpele oplossing voor een lastig probleem'], ['een bok schieten', 'een grote fout maken'], ['iemand in de maling nemen', 'iemand voor de gek houden'], ['van de hak op de tak springen', 'steeds van onderwerp veranderen'], ['een gat in de lucht springen', 'heel blij zijn'], ['een appeltje voor de dorst', 'een reserve voor later'], ['met de mantel der liefde bedekken', 'iets vergevingsgezind negeren'],
  ], { f: (k) => `Wat betekent "${k}"?`, r: (v) => `Welke uitdrukking past bij: ${v}?`, t: (k, v) => `"${cap(k)}" betekent: ${v}.`, typeMax: 0, d: 2, matchQ: 'Verbind het gezegde met de betekenis.', matchN: 4, matches: 5 });
  K.facts([
    ['Als de kat van huis is,', 'dansen de muizen op tafel'], ['Eigen haard is', 'goud waard'], ['Wie niet waagt,', 'die niet wint'], ['Al doende', 'leert men'], ['Een gegeven paard', 'kijk je niet in de bek'], ['Wie de schoen past,', 'trekke hem aan'], ['Oost, west,', 'thuis best'], ['Geen rook zonder', 'vuur'], ['Zoals de waard is,', 'vertrouwt hij zijn gasten'], ['Beter laat dan', 'nooit'], ['Een goed begin is', 'het halve werk'], ['Het gras is altijd groener', 'aan de overkant'],
  ].map((r) => [r[0], r[1], '', { g: 'afmaken', noTf: true, noRev: true }]), { f: (k) => `Maak het gezegde af: "${k} ..."`, t: (k, v) => `${k} ${v}.`, typeMax: 24, d: 2, type: true });
  K.mcs([
    ['Wat betekent "geen koe uit de wei halen"?', 'zich niet druk maken', ['een koe verkopen', 'op het platteland wonen', 'hard werken'], ''],
    ['Iemand "in de wolken zijn" betekent dat hij of zij...', 'heel blij is', ['in een vliegtuig zit', 'verdrietig is', 'ziek is'], ''],
    ['Wat betekent "iets aan de kaak stellen"?', 'openlijk kritiek op iets geven', ['iets opruimen', 'iets verbergen', 'iets repareren'], ''],
    ['Wat betekent "de handdoek in de ring gooien"?', 'opgeven', ['gaan zwemmen', 'gaan boksen om te winnen', 'schoonmaken'], ''],
    ['Wat betekent "mijn hart sloeg een slag over"?', 'ik schrok erg', ['ik had hartpijn', 'ik werd boos', 'ik viel in slaap'], ''],
  ]);
  K.tfs([['"Het regent pijpenstelen" betekent dat het hard regent.', true], ['"Een bok schieten" gaat over jagen.', false, 'Het betekent een grote fout maken.'], ['"Geen blad voor de mond nemen" betekent eerlijk zeggen wat je denkt.', true], ['"Uit je dak gaan" betekent dat je dak kapot is.', false, 'Het betekent door het dolle heen zijn.']]);
  return K.out();
}

function vulkanen() {
  const K = kit({ id: 'vulkanen', name: 'Vulkanen en aardbevingen', emoji: '🌋', group: 'Natuur', desc: 'Magma, lava, kraters en beroemde vulkanen: Vesuvius, Etna, Krakatau en meer.' });
  K.facts([
    ['magma', 'gesmolten gesteente onder de grond', '', { g: 'begrip' }], ['lava', 'gesmolten gesteente dat buiten de vulkaan stroomt', '', { g: 'begrip' }], ['de krater', 'de opening boven op een vulkaan', '', { g: 'begrip' }], ['vulkanische as', 'fijne stukjes gesteente die de lucht in worden geblazen', '', { g: 'begrip' }], ['de magmakamer', 'de ruimte onder de vulkaan waar magma zich verzamelt', '', { g: 'begrip' }],
    ['een actieve vulkaan', 'een vulkaan die regelmatig of recent is uitgebarsten', '', { g: 'begrip' }], ['een slapende vulkaan', 'een vulkaan die al lang niet uitbarstte maar dat nog kan doen', '', { g: 'begrip' }], ['een geiser', 'een bron die heet water de lucht in spuit', '', { g: 'begrip' }], ['een caldera', 'een grote kuil die ontstaat na een enorme uitbarsting', '', { g: 'begrip' }], ['de vuurgordel (Ring of Fire)', 'een gebied rond de Grote Oceaan met veel vulkanen en aardbevingen', '', { g: 'begrip' }], ['een tektonische plaat', 'een enorm stuk van de aardkorst dat heel langzaam beweegt', '', { g: 'begrip' }],
  ], { f: (k) => `Wat is ${k}?`, r: (v) => `Wat is dit: ${v}?`, t: (k, v) => `${cap(k)}: ${v}.`, typeMax: 0, d: 2, matchQ: 'Welke betekenis hoort bij welk woord?', matchN: 4, matches: 3 });
  K.facts([
    ['de Etna', 'Sicilië (Italië)', '', { e: '🌋' }], ['de Vesuvius', 'bij Napels (Italië)', 'In het jaar 79 begroef de Vesuvius de stad Pompeï onder de as.', { e: '🌋' }], ['de Krakatau', 'Indonesië', 'De uitbarsting van 1883 was op duizenden kilometers te horen.', { e: '🌋' }], ['de Mauna Loa', 'Hawaï (Verenigde Staten)', '', { e: '🌋' }], ['de Fuji (Fuji-san)', 'Japan', '', { e: '🗻' }], ['de Pinatubo', 'de Filipijnen', '', { e: '🌋' }],
    ['de Stromboli', 'een eiland bij Italië', '', { e: '🌋' }], ['de Kilimanjaro', 'Tanzania (Afrika)', 'De Kilimanjaro is de hoogste berg van Afrika en een slapende vulkaan.', { e: '⛰️' }], ['de Popocatépetl', 'Mexico', '', { e: '🌋' }], ['de Eyjafjallajökull', 'IJsland', 'In 2010 legde zijn aswolk het vliegverkeer in Europa dagenlang stil.', { e: '🇮🇸' }], ['de Olympus Mons', 'de planeet Mars', 'Dit is de grootste vulkaan van het hele zonnestelsel.', { e: '🔴' }],
  ], { f: (k) => `Waar staat ${k}?`, r: (v) => `Welke vulkaan staat in of bij ${v}?`, t: (k, v) => `${cap(k)} staat in of bij ${v}.`, typeMax: 0, d: 3, matchQ: 'Verbind de vulkaan met de plek.', matchN: 4, matches: 2 });
  K.mcs([
    ['Uit welke drie lagen bestaat de aarde?', 'korst, mantel en kern', ['wolk, regen en zon', 'zand, klei en gras', 'water, lucht en vuur'], ''], ['Welke laag van de aarde is het heetst?', 'de kern', ['de korst', 'de mantel', 'de atmosfeer'], ''],
    ['Wat is het verschil tussen magma en lava?', 'magma zit onder de grond, lava stroomt buiten', ['ze zijn precies hetzelfde', 'lava is koud', 'magma is een soort as'], ''], ['Welke stad werd in het jaar 79 door as bedolven?', 'Pompeï', ['Athene', 'Parijs', 'Amsterdam'], ''],
    ['In welk land liggen veel vulkanen en geisers en warmwaterbronnen?', 'IJsland', ['Nederland', 'Denemarken', 'Portugal'], ''], ['Hoe heet het apparaat dat aardbevingen meet?', 'een seismograaf', ['een thermometer', 'een barometer', 'een kompas'], ''],
    ['Waardoor ontstaat vaak een aardbeving?', 'doordat platen van de aardkorst langs elkaar schuiven', ['door heel veel regen', 'door een storm', 'door de maan'], ''], ['Wat is een tsunami?', 'een enorme zeegolf, vaak na een zeebeving', ['een hevige storm', 'een soort vulkaan', 'een koude zeestroom'], ''],
    ['Hoe heet een vulkaan met steile hellingen opgebouwd uit lagen as en lava?', 'een stratovulkaan', ['een schildvulkaan', 'een zandvulkaan', 'een ijsvulkaan'], ''], ['Op Hawaï zijn de vulkanen breed en laag met vloeibare lava. Hoe heet dat type?', 'schildvulkaan', ['stratovulkaan', 'kratervulkaan', 'ijsvulkaan'], ''],
    ['Wat kan er na een uitbarsting vruchtbaarder worden?', 'de grond rond de vulkaan', ['de lucht', 'de zee', 'het weer'], 'Vulkanische as bevat veel mineralen waar planten van groeien.'],
  ]);
  K.tfs([['Lava is gesmolten gesteente dat buiten de vulkaan stroomt.', true], ['Alle vulkanen zijn berg-vormig en hoog.', false, 'Sommige vulkanen zijn laag, breed of liggen onder water.'], ['In Nederland staan actieve vulkanen.', false, 'Nederland heeft geen actieve vulkanen.'], ['De Vesuvius begroef Pompeï onder de as.', true], ['Aardbevingen en vulkanen komen vaak voor bij randen van tektonische platen.', true], ['De Olympus Mons staat op de aarde.', false, 'Hij staat op Mars.']]);
  K.order('Zet de lagen van de aarde van buiten naar binnen.', ['korst', 'mantel', 'buitenkern', 'binnenkern']);
  K.order('Zet in de goede volgorde: hoe barst een vulkaan uit?', ['Magma verzamelt in de magmakamer', 'De druk wordt groter', 'Het magma stijgt door de schoorsteen', 'Lava en as komen uit de krater']);
  return K.out();
}

function olympisch() {
  const K = kit({ id: 'olympische-spelen', name: 'Olympische Spelen en sporten', emoji: '🏅', group: 'Creatief', desc: 'Ringen, medailles, zomersporten en wintersporten: alles over de Olympische Spelen.' });
  K.facts([
    ['zwemmen', 'je gaat zo snel mogelijk door het water', '🏊'], ['turnen', 'je doet oefeningen op toestellen zoals ringen en brug', '🤸'], ['judo', 'een Japanse worstelsport waarbij je je tegenstander werpt', '🥋'], ['boogschieten', 'je schiet met pijl en boog op een schietschijf', '🏹'], ['schermen', 'je vecht met een degen, floret of sabel', '🤺'], ['speerwerpen', 'je gooit een speer zo ver mogelijk', '🗡️'], ['hordenlopen', 'je rent en springt over obstakels', '🏃'],
    ['polsstokhoogspringen', 'je springt met een lange stok over een lat', '🏑'], ['kogelstoten', 'je stoot een zware bal zo ver mogelijk weg', '⚫'], ['roeien', 'je beweegt een boot met riemen over het water', '🚣'], ['zeilen', 'je vaart op de wind in een boot met zeil', '⛵'], ['wielrennen', 'je fietst op een racefiets, op de weg of de baan', '🚴'], ['schaatsen', 'je glijdt op een ijsbaan zo snel mogelijk rond', '⛸️'], ['curling', 'je schuift stenen over het ijs naar een doel', '🥌'],
    ['bobsleeën', 'je racet in een slee door een ijsgoot', '🛷'], ['langlaufen', 'je skiet over een lang parcours door de sneeuw', '⛷️'], ['schansspringen', 'je skiet van een schans zo ver mogelijk', '🎿'], ['snowboarden', 'je glijdt op één plank door de sneeuw', '🏂'], ['biatlon', 'je combineert langlaufen met schieten', '🎯'], ['ijshockey', 'je speelt hockey op het ijs met een puck', '🏒'], ['hockey', 'je slaat een bal met een stick in het doel', '🏑'], ['tafeltennis', 'je slaat een klein balletje over een net op tafel', '🏓'],
  ].map((r) => [r[0], r[1], '', { e: r[2], d: 2 }]), { f: (k) => `Wat doe je bij ${k}?`, r: (v) => `Welke sport is dit: ${v}?`, t: (k, v) => `Bij ${k}: ${v}.`, typeMax: 0, matchQ: 'Welke sport hoort bij welke omschrijving?', matchN: 4, matches: 4 });
  const W = ['schaatsen', 'curling', 'bobsleeën', 'langlaufen', 'schansspringen', 'snowboarden', 'biatlon', 'ijshockey'];
  const Zo = ['zwemmen', 'turnen', 'judo', 'boogschieten', 'schermen', 'speerwerpen', 'hordenlopen', 'roeien', 'zeilen', 'wielrennen', 'kogelstoten', 'tafeltennis'];
  K.groups({ 'Winterspelen': W, 'Zomerspelen': Zo }, { which: (it) => `Bij welke Spelen hoort ${it}?`, names: ['Winterspelen', 'Zomerspelen'], tfq: (it, c) => `${cap(it)} hoort bij de ${c}.`, multi: (n) => `Welke sporten horen bij de ${n}? (kies alle goede)`, reps: 4 });
  K.mcs([
    ['Hoe vaak worden de Olympische Zomerspelen gehouden?', 'elke vier jaar', ['elk jaar', 'elke twee jaar', 'elke tien jaar'], ''], ['Hoeveel ringen heeft de Olympische vlag?', '5', ['3', '4', '7'], 'De ringen staan voor vijf werelddelen die samen sporten.'],
    ['Welke kleuren hebben de olympische ringen?', 'blauw, geel, zwart, groen en rood', ['rood, wit en blauw', 'alleen goud', 'rood, oranje en geel'], ''], ['In welk land begonnen de oude Olympische Spelen?', 'Griekenland', ['Italië', 'Egypte', 'Nederland'], 'De oude Spelen waren in Olympia.'],
    ['In welke stad waren de eerste moderne Olympische Spelen (1896)?', 'Athene', ['Parijs', 'Londen', 'Rome'], ''], ['Welke medaille krijgt de winnaar?', 'goud', ['zilver', 'brons', 'platina'], ''], ['Welke medaille krijgt nummer drie?', 'brons', ['goud', 'zilver', 'koper'], ''],
    ['Wat brandt er tijdens de Olympische Spelen?', 'de Olympische vlam', ['een vuurwerk', 'een kampvuur', 'een kaars'], ''], ['In welke Nederlandse stad waren in 1928 de Olympische Spelen?', 'Amsterdam', ['Rotterdam', 'Den Haag', 'Eindhoven'], ''],
    ['Wat is het motto van de Spelen: "Sneller, hoger, ..."?', 'sterker', ['groter', 'mooier', 'blijer'], 'Citius, Altius, Fortius: sneller, hoger, sterker.'], ['Wat zijn de Paralympische Spelen?', 'Spelen voor sporters met een beperking', ['Spelen voor dieren', 'Spelen voor schaken', 'Spelen voor kinderen'], ''],
  ]);
  K.tfs([['Zwemmen is een Olympische sport.', true], ['Curling hoort bij de Zomerspelen.', false, 'Curling is een wintersport.'], ['Elke vier jaar zijn er Zomerspelen.', true], ['De Spelen zijn begonnen in het oude Griekenland.', true], ['Bij de Spelen krijgt nummer twee een gouden medaille.', false, 'Nummer twee krijgt zilver.'], ['Epke Zonderland won goud bij het turnen (rekstok).', true]]);
  K.order('Zet de medailles van meest naar minst waard.', ['goud', 'zilver', 'brons']);
  return K.out();
}

function feestdagen() {
  const K = kit({ id: 'nl-feestdagen', name: 'Nederlandse feestdagen en tradities', emoji: '🎉', group: 'Wereld', desc: 'Koningsdag, Sinterklaas, Prinsjesdag, Sint-Maarten en meer: wanneer vieren we wat?' });
  K.facts([
    ['Koningsdag', '27 april'], ['Dodenherdenking', '4 mei'], ['Bevrijdingsdag', '5 mei'], ['Sinterklaasavond (pakjesavond)', '5 december'], ['eerste kerstdag', '25 december'], ['Oudjaarsavond', '31 december'], ['Sint-Maarten', '11 november'], ['Nieuwjaarsdag', '1 januari'], ['Valentijnsdag', '14 februari'], ['Aankomst van Sinterklaas', 'half november'],
    ['Prinsjesdag', 'de derde dinsdag van september'], ['Moederdag', 'de tweede zondag van mei'], ['Vaderdag', 'de derde zondag van juni'],
  ].map((r) => [r[0], r[1], '', { d: 1 }]), { f: (k) => `Wanneer is ${k}?`, r: (v) => `Welk feest of welke dag is op ${v}?`, t: (k, v) => `${cap(k)} is op ${v}.`, typeMax: 0, d: 1, matchQ: 'Welke dag hoort bij welke datum?', matchN: 4, matches: 3 });
  K.facts([
    ['Koningsdag', 'de verjaardag van de koning, met vrijmarkten en oranje', ''], ['Dodenherdenking', 'twee minuten stilte voor de slachtoffers van oorlogen', ''], ['Bevrijdingsdag', 'de bevrijding van Nederland in 1945', ''], ['Sint-Maarten', 'kinderen lopen met lampionnen langs de deuren en zingen', ''], ['Carnaval', 'een uitbundig feest in het zuiden met verkleedpartijen', ''], ['Prinsjesdag', 'de koning leest de troonrede in de Ridderzaal voor', ''],
    ['Sinterklaas', 'de goedheiligman die cadeautjes brengt', ''], ['Oud en nieuw', 'het vieren van de jaarwisseling met oliebollen en vuurwerk', ''], ['Pasen', 'een voorjaarsfeest met paaseieren', ''],
  ].map((r) => [r[0], r[1], r[2], { d: 2 }]), { f: (k) => `Wat gebeurt er bij ${k}?`, r: (v) => `Welk feest hoort bij: ${v}?`, t: (k, v) => `Bij ${k}: ${v}.`, typeMax: 0, d: 2, e: false });
  K.mcs([
    ['Met welke kleur zijn we verbonden tijdens Koningsdag?', 'oranje', ['groen', 'paars', 'zwart'], 'Oranje komt van het koningshuis Oranje-Nassau.'], ['Hoe heet het kasteel waar de koning de troonrede uitspreekt op Prinsjesdag?', 'de Ridderzaal', ['Slot Loevestein', 'Kasteel de Haar', 'Paleis Het Loo'], 'De Ridderzaal staat op het Binnenhof in Den Haag.'],
    ['Waarmee komt Sinterklaas volgens het verhaal naar Nederland?', 'met een stoomboot uit Spanje', ['met een vliegtuig', 'met een kameel', 'met een auto'], ''], ['Welk gebak eet je vaak bij oud en nieuw?', 'oliebollen', ['stroopwafels', 'poffertjes', 'appelflappen'], ''],
    ['Hoeveel minuten stilte is er op 4 mei om 20.00 uur?', '2', ['1', '5', '10'], ''], ['Welke schaatstocht door Friesland is 200 kilometer lang?', 'de Elfstedentocht', ['de Weissensee', 'de Alternatieve Elfstedentocht', 'de Marathon van Amsterdam'], ''],
    ['Waar is het bloemencorso bekend om?', 'de Bollenstreek', ['Limburg', 'Groningen', 'Texel'], ''], ['Waar viert men vooral carnaval?', 'in het zuiden (Brabant en Limburg)', ['in het noorden', 'op de Waddeneilanden', 'in Flevoland'], ''],
  ]);
  K.tfs([['Koningsdag is op 27 april.', true], ['Bevrijdingsdag is op 4 mei.', false, 'Op 4 mei is Dodenherdenking; Bevrijdingsdag is op 5 mei.'], ['Prinsjesdag is in september.', true], ['Sinterklaas wordt in Nederland gevierd op 25 december.', false, 'Sinterklaas is op 5 december; 25 december is eerste kerstdag.'], ['Sint-Maarten wordt gevierd met lampionnen.', true], ['Moederdag is altijd op 1 januari.', false]]);
  K.order('Zet de feestdagen op volgorde van het jaar.', ['Nieuwjaarsdag', 'Koningsdag', 'Sinterklaasavond', 'Oudjaarsavond']);
  K.order('Zet de feestdagen in de goede volgorde.', ['Koningsdag', 'Dodenherdenking', 'Bevrijdingsdag', 'Sint-Maarten']);
  return K.out();
}

function dagenMaanden() {
  const K = kit({ id: 'dagen-maanden', name: 'Dagen, maanden en jaargetijden', emoji: '📅', group: 'Rekenen', desc: 'De kalender: weekdagen, maanden, seizoenen, schrikkeljaren en hoe lang een jaar of eeuw duurt.' });
  const M = [['januari', 31], ['februari', 28], ['maart', 31], ['april', 30], ['mei', 31], ['juni', 30], ['juli', 31], ['augustus', 31], ['september', 30], ['oktober', 31], ['november', 30], ['december', 31]];
  for (const [m, d] of M) K.num(`Hoeveel dagen heeft ${m} (in een gewoon jaar)?`, d, { d: 1, x: m === 'februari' ? 'In een schrikkeljaar heeft februari 29 dagen.' : '', e: '📅' });
  for (const [m, d] of M) { K.tf(`${cap(m)} heeft ${d} dagen.`, true, { d: 1, ...(m === 'februari' ? { x: 'In een schrikkeljaar zijn het er 29.' } : {}) }); K.tf(`${cap(m)} heeft ${d === 31 ? 30 : 31} dagen.`, false, { d: 2, x: `${cap(m)} heeft ${d} dagen.` }); }
  M.forEach(([m], i) => { K.mc(`Welke maand is de ${i + 1}e maand van het jaar?`, m, M.map((x) => x[0]).filter((x) => x !== m), { d: 1 }); K.num(`De ${m === 'maart' ? 'maand maart' : 'maand ' + m} is de hoeveelste maand van het jaar?`, i + 1, { d: 2 }); });
  K.mcs([
    ['Welke maanden hebben 30 dagen?', 'april, juni, september, november', ['januari, maart, mei, juli', 'februari, april, juni', 'augustus, oktober, december'], 'Een ezelsbruggetje: 30 dagen heeft september, april, juni en november.'],
    ['Hoeveel dagen heeft een gewoon jaar?', '365', ['360', '366', '350'], ''], ['Hoeveel dagen heeft een schrikkeljaar?', '366', ['365', '364', '367'], ''], ['Hoe vaak is er een schrikkeljaar?', 'elke vier jaar', ['elk jaar', 'elke twee jaar', 'elke tien jaar'], ''], ['Hoeveel weken heeft een jaar ongeveer?', '52', ['48', '50', '60'], ''],
    ['Hoeveel dagen heeft een week?', '7', ['5', '6', '8'], ''], ['Welke dag komt na vrijdag?', 'zaterdag', ['zondag', 'donderdag', 'maandag'], ''], ['Welke dag komt voor woensdag?', 'dinsdag', ['donderdag', 'maandag', 'vrijdag'], ''],
    ['Welke dag is de eerste dag van de week in Nederland?', 'maandag', ['zondag', 'zaterdag', 'dinsdag'], 'In de agenda begint de week meestal op maandag.'], ['Welke maand komt na juli?', 'augustus', ['juni', 'september', 'oktober'], ''],
    ['In welk seizoen begint de zomer (astronomisch)?', 'rond 21 juni', ['rond 21 maart', 'rond 23 september', 'rond 21 december'], ''], ['Wat is een eeuw?', '100 jaar', ['10 jaar', '1000 jaar', '50 jaar'], ''], ['Wat is een decennium?', '10 jaar', ['100 jaar', '5 jaar', '12 jaar'], ''], ['Wat is een millennium?', '1000 jaar', ['100 jaar', '10.000 jaar', '500 jaar'], ''],
    ['Welk seizoen komt na de winter?', 'de lente', ['de zomer', 'de herfst', 'weer winter'], ''], ['Welke maanden vormen de meteorologische zomer in Nederland?', 'juni, juli en augustus', ['maart, april en mei', 'september, oktober en november', 'december, januari en februari'], ''],
    ['Welke maand heeft de minste dagen?', 'februari', ['januari', 'juni', 'november'], ''], ['Hoeveel maanden heeft een jaar?', '12', ['10', '11', '13'], ''], ['Hoeveel uren heeft een dag?', '24', ['12', '48', '60'], ''], ['Hoeveel dagen is twee weken?', '14', ['10', '12', '16'], ''],
  ]);
  K.nums([['Hoeveel dagen zitten er in 3 weken?', 21, { d: 1 }], ['Hoeveel maanden zitten er in 2 jaar?', 24, { d: 1 }], ['Hoeveel weken zitten er in 4 maanden ongeveer (4 weken per maand)?', 16, { d: 2 }], ['Hoeveel jaar zijn twee eeuwen?', 200, { d: 1 }], ['Hoeveel dagen heb je als je van 1 tot en met 30 april telt?', 30, { d: 1 }], ['Hoeveel dagen heeft een week twee keer?', 14, { d: 1 }], ['Hoeveel uur zitten er in 2 dagen?', 48, { d: 1 }], ['Hoeveel jaar zitten er in 5 decennia?', 50, { d: 2 }]]);
  K.tfs([['Februari heeft in een gewoon jaar 28 dagen.', true], ['Een schrikkeljaar heeft 365 dagen.', false, 'Een schrikkeljaar heeft 366 dagen.'], ['Een eeuw is 100 jaar.', true], ['Augustus komt voor juli.', false, 'Juli komt voor augustus.'], ['De week bestaat uit zeven dagen.', true], ['December heeft 30 dagen.', false, 'December heeft 31 dagen.'], ['Het jaar 2024 was een schrikkeljaar.', true], ['Het jaar 2026 is een schrikkeljaar.', false, '2024 was het laatste schrikkeljaar; het volgende is 2028.']]);
  K.order('Zet de weekdagen op volgorde, beginnend met maandag.', ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag']);
  K.order('Zet de maanden van het voorjaar en de zomer op volgorde.', ['maart', 'april', 'mei', 'juni', 'juli']);
  K.order('Zet de maanden van de herfst en winter op volgorde.', ['september', 'oktober', 'november', 'december', 'januari']);
  K.order('Zet de jaargetijden op volgorde, beginnend met de lente.', ['lente', 'zomer', 'herfst', 'winter']);
  return K.out();
}

export const builders = [dialecten, gezegden, vulkanen, olympisch, feestdagen, dagenMaanden];
