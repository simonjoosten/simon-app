// PACKS-C (deel c): water en klimaat, dieren in Nederland, beroemde Nederlanders, Griekse mythologie, ontdekkingsreizigers, robots en AI, gesteenten, rekentaal, eten uit de wereld, fruit en groente.
import { kit } from '../packs-b/lib.mjs';
const cap = (s) => s[0].toUpperCase() + s.slice(1);

function water() {
  const K = kit({ id: 'waterkringloop-klimaat', name: 'Waterkringloop en klimaat', emoji: '💧', group: 'Natuur', desc: 'Verdampen, wolken, regen en het broeikaseffect: hoe water rondgaat en hoe het klimaat verandert.' });
  K.facts([
    ['verdamping', 'water wordt waterdamp door de warmte van de zon'], ['condensatie', 'waterdamp wordt weer kleine druppeltjes'], ['neerslag', 'regen, sneeuw of hagel die uit wolken valt'], ['afstroming', 'water dat over de grond naar rivieren en zee stroomt'], ['grondwater', 'water dat in de bodem zit'], ['transpiratie', 'planten dampen water uit via hun bladeren'], ['een wolk', 'veel kleine waterdruppeltjes of ijskristallen in de lucht'],
    ['hagel', 'stukjes ijs die uit onweerswolken vallen'], ['mist', 'een wolk vlak boven de grond'], ['dauw', 'waterdruppeltjes die ’s nachts op gras ontstaan'], ['de waterkringloop', 'de eindeloze reis van water van zee naar lucht naar land en terug'], ['een gletsjer', 'een rivier van langzaam stromend ijs'], ['een bron', 'een plek waar grondwater uit de grond komt'], ['een delta', 'een gebied waar een rivier in zee uitmondt'],
  ], { f: (k) => `Wat is ${k}?`, r: (v) => `Welk woord hoort bij: ${v}?`, t: (k, v) => `${cap(k)}: ${v}.`, typeMax: 0, d: 2, matchQ: 'Verbind het woord met de uitleg.', matchN: 4, matches: 3 });
  K.facts([
    ['het broeikaseffect', 'gassen in de lucht houden warmte vast rond de aarde'], ['CO₂ (koolstofdioxide)', 'een broeikasgas dat vrijkomt bij verbranding'], ['klimaatverandering', 'de aarde wordt gemiddeld steeds warmer'], ['zeespiegelstijging', 'smeltend ijs en warmer water laten de zee stijgen'], ['fossiele brandstoffen', 'olie, gas en steenkool'], ['duurzame energie', 'energie van zon, wind en water'], ['de ozonlaag', 'een laag hoog in de lucht die schadelijke zonnestraling tegenhoudt'], ['recyclen', 'afval opnieuw gebruiken als grondstof'],
  ], { f: (k) => `Wat is ${k}?`, r: (v) => `Welk begrip past bij: ${v}?`, t: (k, v) => `${cap(k)}: ${v}.`, typeMax: 0, d: 2 });
  K.mcs([
    ['Bij welke temperatuur kookt water?', '100 graden Celsius', ['0 graden Celsius', '50 graden Celsius', '212 graden Celsius'], ''], ['Bij welke temperatuur bevriest water?', '0 graden Celsius', ['10 graden Celsius', '-10 graden Celsius', '100 graden Celsius'], ''],
    ['Welk deel van het water op aarde is zout?', 'bijna alles (ongeveer 97%)', ['ongeveer de helft', 'ongeveer een kwart', 'bijna niets'], ''], ['Waar zit het meeste zoete water op aarde?', 'als ijs op de polen en in gletsjers', ['in rivieren', 'in meren', 'in de wolken'], ''],
    ['Wat gebeurt er met water als je het verwarmt tot het kookt?', 'het verdampt en wordt waterdamp', ['het verdwijnt voor altijd', 'het wordt ijs', 'het wordt zout'], ''], ['Wat gebeurt er met waterdamp in de koude lucht hoog boven de grond?', 'het wordt wolkdruppeltjes', ['het wordt zout', 'het wordt zand', 'het verdwijnt'], ''],
    ['Welke vorm van water is ijs?', 'vast', ['vloeibaar', 'gasvormig', 'zout'], ''], ['Welke vorm van water is waterdamp?', 'gasvormig', ['vast', 'vloeibaar', 'zout'], ''],
    ['Wat kun je zelf doen om water te besparen?', 'korter douchen', ['de kraan open laten staan', 'langer in bad liggen', 'water weggooien'], ''], ['Wat is het grootste gevolg van smeltende poolijskappen?', 'de zeespiegel stijgt', ['het wordt droger', 'er komt meer land', 'de zee wordt zoet'], ''],
    ['Hoe heet het land dat voor een groot deel onder de zeespiegel ligt?', 'Nederland', ['Zwitserland', 'Oostenrijk', 'Spanje'], 'Ongeveer een kwart van Nederland ligt onder zeeniveau.'],
  ]);
  K.tfs([['Water gaat altijd rond in de waterkringloop.', true], ['Wolken bestaan uit waterdruppeltjes of ijskristallen.', true], ['Regen valt omhoog uit de grond.', false, 'Regen valt uit wolken naar beneden.'], ['IJs is water in vaste vorm.', true], ['Zeewater is zoet.', false, 'Zeewater is zout.'], ['Het klimaat wordt gemiddeld warmer.', true]]);
  K.order('Zet de waterkringloop in de goede volgorde.', ['Water verdampt uit zee', 'Waterdamp stijgt op', 'Wolken vormen zich', 'Er valt regen']);
  K.order('Zet de watertoestanden van koud naar warm.', ['ijs', 'water', 'waterdamp']);
  return K.out();
}

function dierenNL() {
  const K = kit({ id: 'dieren-nederland', name: 'Dieren en natuur in Nederland', emoji: '🦌', group: 'Natuur', desc: 'Egels, ooievaars, edelherten en zeehonden: wilde dieren en natuurgebieden in Nederland.' });
  K.facts([
    ['de ooievaar', 'een grote witte vogel met rode snavel en poten die op een nest bovenop een paal broedt', '🦩'], ['de egel', 'een stekelig zoogdier dat een winterslaap houdt', '🦔'], ['de vos', 'een slim roofdier met een rode vacht en pluimstaart', '🦊'], ['de ree', 'een kleine hertensoort', '🦌'], ['het edelhert', 'een groot hert dat op de Veluwe leeft', '🦌'], ['het wilde zwijn', 'een bosdier dat met zijn snuit in de grond wroet', '🐗'], ['de zeehond', 'een zoogdier dat je op de zandbanken van de Waddenzee ziet', '🦭'],
    ['de bever', 'een knaagdier dat dammen bouwt en bomen omknaagt', '🦫'], ['de otter', 'een zwemmende marterachtige die vis eet', '🦦'], ['de blauwe reiger', 'een grote vogel die roerloos in het water staat te vissen', '🐦'], ['de kievit', 'een weidevogel met een kuifje', '🐦'], ['de grutto', 'een weidevogel met een lange snavel, de nationale vogel van Nederland', '🐦'], ['de mol', 'een dier dat gangen graaft in de grond en molshopen maakt', '🐭'], ['de wolf', 'een grote hondachtige die sinds kort weer in Nederland leeft', '🐺'],
  ].map((r) => [r[0], r[1], '', { e: r[2], d: 2 }]), { f: (k) => `Wat is ${k}?`, r: (v) => `Welk dier is dit: ${v}?`, t: (k, v) => `${cap(k)}: ${v}.`, typeMax: 0, d: 2, matchQ: 'Welk dier hoort bij welke beschrijving?', matchN: 4, matches: 3 });
  K.facts([
    ['de Waddenzee', 'een ondiepe zee met wad en zandbanken in het noorden, werelderfgoed'], ['de Veluwe', 'een bosrijk natuurgebied in Gelderland met edelherten en wilde zwijnen'], ['de Biesbosch', 'een groot natuurgebied met rivieren en moerasbos bij Brabant en Zuid-Holland'], ['de Oostvaardersplassen', 'een natuurgebied in Flevoland met grote grazers en veel vogels'], ['de duinen', 'zandheuvels langs de kust'], ['het Nationaal Park Hoge Veluwe', 'een park met het Kröller-Müller Museum'], ['de Weerribben', 'een moerasgebied in Overijssel met riet en waterlopen'],
  ], { f: (k) => `Wat is ${k}?`, r: (v) => `Welke plek is dit: ${v}?`, t: (k, v) => `${cap(k)} is ${v}.`, typeMax: 0, d: 3 });
  K.mcs([
    ['Welke vogel is de nationale vogel van Nederland?', 'de grutto', ['de kievit', 'de ooievaar', 'de merel'], ''], ['Waar houdt een egel zijn winterslaap?', 'in een hoop bladeren of takken', ['in het water', 'in de lucht', 'in een zandbank'], ''], ['Wat eet een egel graag?', 'slakken, wormen en insecten', ['bladeren en gras', 'vis', 'honing'], ''],
    ['Hoe heet het jong van een ree?', 'een reekalf', ['een veulen', 'een welp', 'een lam'], ''], ['Wat doet een bever met bomen?', 'ze omknagen voor een dam of burcht', ['ze planten', 'ze eten de wortels op', 'ze schilderen'], ''], ['Wat betekent "getijden" bij de Waddenzee?', 'eb en vloed', ['storm en regen', 'ijs en sneeuw', 'zout en zoet'], ''],
    ['Welk zoogdier zie je vaak op de zandbanken van de Waddenzee?', 'de zeehond', ['de ijsbeer', 'de pinguïn', 'de walrus'], ''], ['Wat doen kievieten graag?', 'broeden in weilanden', ['in bomen nestelen', 'in rivieren zwemmen', 'in de duinen graven'], ''],
    ['Hoe heet een groep wilde zwijnen?', 'een rot of roedel', ['een koppel', 'een zwerm', 'een kudde schapen'], ''],
  ]);
  K.tfs([['De egel houdt een winterslaap.', true], ['In Nederland leven wilde olifanten.', false], ['De Waddenzee is een werelderfgoed.', true], ['De bever is terug in Nederland.', true], ['Ooievaars bouwen graag een nest op een paal.', true], ['Een mol leeft in bomen.', false, 'Een mol leeft in de grond.']]);
  return K.out();
}

function beroemdeNL() {
  const K = kit({ id: 'beroemde-nederlanders', name: 'Beroemde Nederlanders', emoji: '🇳🇱', group: 'Geschiedenis', desc: 'Rembrandt, Anne Frank, Van Gogh, Cruijff en meer: wie waren zij en wat deden ze?' });
  K.facts([
    ['Rembrandt van Rijn', 'schilder van De Nachtwacht'], ['Vincent van Gogh', 'schilder van de Zonnebloemen'], ['Johannes Vermeer', 'schilder van Het meisje met de parel'], ['Piet Mondriaan', 'schilder van vlakken in rood, geel, blauw en zwart'], ['M.C. Escher', 'tekenaar van onmogelijke figuren en trappen'], ['Anne Frank', 'schreef een dagboek in haar schuilplaats in Amsterdam'], ['Erasmus', 'geleerde die het boek Lof der Zotheid schreef'], ['Christiaan Huygens', 'bedacht het slingeruurwerk'],
    ['Antoni van Leeuwenhoek', 'ontdekte met zijn microscoop de kleine diertjes in een druppel water'], ['Willem van Oranje', 'leider van de Opstand tegen Spanje, Vader des Vaderlands'], ['Michiel de Ruyter', 'zeeheld uit de Gouden Eeuw'], ['Johan Cruijff', 'voetballer met rugnummer 14'], ['Dick Bruna', 'maker van Nijntje'], ['Annie M.G. Schmidt', 'schrijfster van Jip en Janneke'], ['Max Verstappen', 'Formule 1-wereldkampioen in 2021'], ['Multatuli', 'schreef het boek Max Havelaar'],
    ['Hugo de Groot', 'schreef over het recht tussen landen (volkenrecht)'], ['Spinoza', 'filosoof uit Amsterdam'], ['Aletta Jacobs', 'eerste vrouwelijke arts en strijdster voor het vrouwenkiesrecht'], ['Edsger Dijkstra', 'beroemd informaticus, bedacht een manier om de kortste route te vinden'],
  ], { f: (k) => `Wie was of is ${k}?`, r: (v) => `Wie is dit: ${v}?`, t: (k, v) => `${k}: ${v}.`, typeMax: 0, d: 2, matchQ: 'Welke persoon hoort bij wat hij of zij deed?', matchN: 4, matches: 5 });
  K.mcs([
    ['Welk schilderij van Rembrandt hangt in het Rijksmuseum?', 'De Nachtwacht', ['De Zonnebloemen', 'Meisje met de parel', 'De Schreeuw'], ''], ['In welk museum hangen veel werken van Van Gogh in Amsterdam?', 'het Van Gogh Museum', ['het Stedelijk Museum', 'het Scheepvaartmuseum', 'Artis'], ''], ['In welk huis verstopte Anne Frank zich?', 'het Achterhuis aan de Prinsengracht', ['een kasteel', 'een boerderij', 'een boot'], ''],
    ['In welke eeuw leefden Rembrandt en Vermeer?', 'de 17e eeuw (Gouden Eeuw)', ['de 12e eeuw', 'de 20e eeuw', 'de 15e eeuw'], ''], ['Welk dier is de hoofdpersoon van Dick Bruna?', 'een konijntje (Nijntje)', ['een muis', 'een beer', 'een poes'], ''],
  ]);
  K.tfs([['Rembrandt schilderde De Nachtwacht.', true], ['Vincent van Gogh was een Franse schilder.', false, 'Van Gogh was Nederlander.'], ['Anne Frank schreef een dagboek.', true], ['Johan Cruijff was een bekende schaatser.', false, 'Cruijff was voetballer.'], ['Christiaan Huygens was een uitvinder.', true], ['Willem van Oranje leefde in de Gouden Eeuw (1600-1700).', false, 'Hij leefde in de 16e eeuw, tijdens de Opstand tegen Spanje.'], ['Max Verstappen is Formule 1-coureur.', true]]);
  K.order('Zet de personen op volgorde van wanneer ze leefden (oud naar nieuw).', ['Willem van Oranje', 'Rembrandt', 'Vincent van Gogh', 'Anne Frank']);
  return K.out();
}

function grieks() {
  const K = kit({ id: 'griekse-mythologie', name: 'Griekse goden en mythen', emoji: '⚡', group: 'Geschiedenis', desc: 'Zeus, Poseidon, Medusa en Herakles: de goden en helden van het oude Griekenland.' });
  K.facts([
    ['Zeus', 'de oppergod, god van de bliksem en de hemel', '⚡'], ['Poseidon', 'de god van de zee', '🔱'], ['Hades', 'de god van de onderwereld', '💀'], ['Athena', 'de godin van de wijsheid', '🦉'], ['Apollo', 'de god van muziek en de zon', '🎶'], ['Artemis', 'de godin van de jacht en de maan', '🏹'], ['Ares', 'de god van de oorlog', '⚔️'], ['Aphrodite', 'de godin van de liefde', '💕'],
    ['Hermes', 'de boodschapper van de goden', '👟'], ['Hephaistos', 'de smid van de goden', '🔨'], ['Demeter', 'de godin van de oogst', '🌾'], ['Hera', 'de vrouw van Zeus en godin van het huwelijk', '👑'], ['Dionysos', 'de god van de wijn en het feest', '🍇'],
  ].map((r) => [r[0], r[1], '', { e: r[2], d: 2 }]), { f: (k) => `Wie is ${k} in de Griekse mythen?`, r: (v) => `Welke god of godin is dit: ${v}?`, t: (k, v) => `${k} is ${v}.`, typeMax: 0, d: 2, matchQ: 'Welke god of godin hoort bij welke taak?', matchN: 4, matches: 3 });
  K.facts([
    ['Medusa', 'een monster met slangen als haar dat mensen in steen veranderde', '🐍'], ['de Minotaurus', 'een stiermens in het labyrint op Kreta', '🐂'], ['Pegasus', 'het gevleugelde paard', '🐎'], ['Cerberus', 'de driekoppige hond die de onderwereld bewaakt', '🐕'], ['de Cycloop', 'een reus met één oog', '👁️'], ['Herakles (Hercules)', 'een held die twaalf moeilijke opdrachten uitvoerde', '💪'], ['Odysseus', 'de held die het Trojaanse paard bedacht en lang naar huis zwierf', '⛵'],
    ['Achilles', 'de held die alleen aan zijn hiel kwetsbaar was', '🦶'], ['Icarus', 'de jongen die met vleugels van was te dicht bij de zon vloog', '🪽'], ['Pandora', 'het meisje dat een doos opende waaruit allerlei ellende ontsnapte', '📦'], ['Prometheus', 'de titaan die het vuur stal en aan de mensen gaf', '🔥'], ['Perseus', 'de held die Medusa versloeg', '🛡️'], ['de Sirenen', 'wezens wier zang zeelieden naar de rotsen lokte', '🧜'],
  ].map((r) => [r[0], r[1], '', { e: r[2], d: 2 }]), { f: (k) => `Wie of wat is ${k}?`, r: (v) => `Wie of wat is dit: ${v}?`, t: (k, v) => `${cap(k)} is ${v}.`, typeMax: 0, d: 2, matchQ: 'Welke figuur hoort bij welke beschrijving?', matchN: 4, matches: 3 });
  K.facts([
    ['Zeus', 'Jupiter'], ['Poseidon', 'Neptunus'], ['Hades', 'Pluto'], ['Athena', 'Minerva'], ['Aphrodite', 'Venus'], ['Ares', 'Mars'], ['Hermes', 'Mercurius'], ['Hera', 'Juno'], ['Artemis', 'Diana'],
  ].map((r) => [r[0], r[1], 'De Romeinen namen de goden over en gaven ze andere namen.', { g: 'romeins', d: 3 }]), { f: (k) => `Hoe heet de Griekse god ${k} bij de Romeinen?`, r: (v) => `Welke Griekse god heet bij de Romeinen ${v}?`, t: (k, v) => `${k} heet bij de Romeinen ${v}.`, typeMax: 0, d: 3 });
  K.mcs([
    ['Waar woonden de Griekse goden volgens de mythen?', 'op de berg Olympus', ['op de Mont Blanc', 'in de Alpen', 'op een eiland'], ''], ['Wat gebruikte Zeus als wapen?', 'bliksemschichten', ['een zwaard', 'een boog', 'een speer'], ''], ['Welk gereedschap draagt Poseidon?', 'een drietand', ['een zwaard', 'een hamer', 'een zeis'], ''],
    ['Waarmee kwamen de Grieken Troje binnen?', 'met een groot houten paard', ['met een schip', 'met een leger olifanten', 'met een luchtballon'], ''], ['Hoeveel opdrachten moest Herakles uitvoeren?', '12', ['5', '7', '10'], ''], ['Welke planeet is vernoemd naar de Romeinse naam van Zeus?', 'Jupiter', ['Mars', 'Venus', 'Saturnus'], ''],
    ['Welk dier is heilig voor Athena?', 'de uil', ['de adelaar', 'de leeuw', 'de slang'], ''], ['Waar spelen de Griekse mythen zich af?', 'het oude Griekenland', ['het oude Egypte', 'Rome', 'China'], ''], ['Wat is een mythe?', 'een oud verhaal over goden en helden', ['een wetenschappelijk experiment', 'een krantenartikel', 'een recept'], ''],
    ['Welk beroep had Hephaistos?', 'smid', ['bakker', 'visser', 'dokter'], ''], ['Welke stad is genoemd naar de godin Athena?', 'Athene', ['Rome', 'Sparta', 'Delphi'], ''],
  ]);
  K.tfs([['Zeus was de oppergod.', true], ['Poseidon was de god van de onderwereld.', false, 'Poseidon was god van de zee, Hades van de onderwereld.'], ['Medusa had slangen als haar.', true], ['De Minotaurus woonde in een labyrint.', true], ['Achilles was overal kwetsbaar.', false, 'Alleen zijn hiel was kwetsbaar.'], ['De Olympische Spelen komen uit het oude Griekenland.', true]]);
  return K.out();
}

function ontdekkers() {
  const K = kit({ id: 'ontdekkingsreizigers', name: 'Ontdekkingsreizigers', emoji: '🧭', group: 'Geschiedenis', desc: 'Columbus, Magellaan, Tasman, Amundsen en meer: reizen over zee, naar de polen en de ruimte.' });
  K.facts([
    ['Christoffel Columbus', 'bereikte in 1492 Amerika in dienst van Spanje'], ['Vasco da Gama', 'vond in 1498 de zeeweg rond Afrika naar India'], ['Ferdinand Magellaan', 'zijn expeditie was de eerste die rond de wereld zeilde'], ['Marco Polo', 'Venetiaanse koopman die naar China reisde'], ['Abel Tasman', 'Nederlandse zeevaarder die Tasmanië en Nieuw-Zeeland ontdekte (1642)'], ['Willem Barentsz', 'overwinterde bij Nova Zembla op zoek naar de noordoostelijke doorvaart'], ['James Cook', 'Engelse kapitein die de oostkust van Australië in kaart bracht'], ['Roald Amundsen', 'Noorse poolreiziger die in 1911 als eerste de Zuidpool bereikte'],
    ['Edmund Hillary en Tenzing Norgay', 'beklommen in 1953 als eersten de Mount Everest'], ['Neil Armstrong', 'zette in 1969 als eerste mens voet op de maan'], ['Thor Heyerdahl', 'voer met het vlot Kon-Tiki over de Stille Oceaan'], ['Leif Eriksson', 'Viking die rond het jaar 1000 Noord-Amerika bereikte'], ['Ibn Battuta', 'Marokkaanse reiziger die zeer ver door de wereld trok'], ['Zheng He', 'Chinese admiraal met een enorme vloot schepen'], ['Cornelis de Houtman', 'leidde de eerste Nederlandse reis naar Indië (1595)'], ['Willem Janszoon', 'eerste Europeaan die Australië zag (1606) met de Duyfken'],
  ], { f: (k) => `Wat is er bekend over ${k}?`, r: (v) => `Wie is dit: ${v}?`, t: (k, v) => `${k}: ${v}.`, typeMax: 0, d: 2, matchQ: 'Welke ontdekkingsreiziger hoort bij welke ontdekking?', matchN: 4, matches: 5 });
  K.facts([
    ['een kompas', 'wijst altijd naar het noorden'], ['een astrolabium', 'meet de hoogte van sterren om je plek te bepalen'], ['een karveel', 'een snel zeilschip uit de tijd van de ontdekkingsreizen'], ['de VOC', 'het handelsbedrijf dat in 1602 werd opgericht'], ['Nova Zembla', 'een Russisch poolgebied waar Barentsz overwinterde'], ['de Noordpool', 'het noordelijkste punt van de aarde'], ['de Zuidpool', 'het zuidelijkste punt van de aarde'], ['een kaap', 'een stuk land dat in zee uitsteekt'],
  ], { f: (k) => `Wat is ${k}?`, r: (v) => `Waar gaat dit over: ${v}?`, t: (k, v) => `${cap(k)}: ${v}.`, typeMax: 0, d: 2 });
  K.mcs([
    ['In welk jaar bereikte Columbus Amerika?', '1492', ['1402', '1592', '1292'], ''], ['In welk jaar landde de eerste mens op de maan?', '1969', ['1959', '1979', '1949'], ''], ['Welk land sponsorde de reis van Columbus?', 'Spanje', ['Engeland', 'Nederland', 'Frankrijk'], ''],
    ['Wat dacht Columbus te vinden toen hij naar het westen zeilde?', 'een weg naar India', ['een nieuwe maan', 'de Noordpool', 'Afrika'], ''], ['Wie won de race naar de Zuidpool?', 'Roald Amundsen', ['Robert Scott', 'James Cook', 'Marco Polo'], 'Robert Scott kwam een maand later aan.'],
    ['Welk handelsbedrijf werd in 1602 opgericht voor de handel op Azië?', 'de VOC', ['de WIC', 'de KLM', 'de Hanze'], ''],
    ['Welke berg is de hoogste ter wereld?', 'Mount Everest', ['K2', 'Mont Blanc', 'Kilimanjaro'], ''], ['Wie was Neil Armstrong?', 'de eerste mens op de maan', ['de eerste pilot', 'de eerste zeiler om de wereld', 'de eerste mens op de Zuidpool'], ''],
  ]);
  K.tfs([['Columbus was Nederlands.', false, 'Columbus kwam uit Genua (Italië) en reisde voor Spanje.'], ['Magellaan zelf overleefde de reis rond de wereld niet.', true, 'Hij overleed in 1521 op de Filipijnen; zijn expeditie voltooide de reis.'], ['Abel Tasman was een Nederlander.', true], ['De Kon-Tiki was een vlot.', true], ['Amundsen bereikte de Noordpool als eerste.', false, 'Amundsen bereikte in 1911 de Zuidpool.'], ['Marco Polo reisde naar China.', true]]);
  K.order('Zet de gebeurtenissen op volgorde van het jaar.', ['Vikingen in Noord-Amerika (rond 1000)', 'Columbus in Amerika (1492)', 'Tasman bij Tasmanië (1642)', 'Amundsen bij de Zuidpool (1911)', 'Armstrong op de maan (1969)']);
  return K.out();
}

function robots() {
  const K = kit({ id: 'robots-ai', name: 'Robots en kunstmatige intelligentie', emoji: '🤖', group: 'Technologie', desc: 'Sensoren, algoritmen, machine learning en chatbots: hoe denken en bewegen computers en robots?' });
  K.facts([
    ['een robot', 'een machine die zelf taken kan uitvoeren'], ['een sensor', 'een onderdeel dat iets meet of waarneemt'], ['een algoritme', 'een reeks stappen om een probleem op te lossen'], ['kunstmatige intelligentie (AI)', 'computers die dingen doen waar je normaal slim voor moet zijn'], ['machine learning', 'computers die leren van voorbeelden'], ['een chatbot', 'een programma waarmee je kunt praten of chatten'], ['een drone', 'een onbemand vliegtuigje'], ['data', 'gegevens, zoals getallen, teksten en foto’s'],
    ['een bug', 'een fout in een programma'], ['een actuator', 'een onderdeel dat beweegt, zoals een motor'], ['een spraakassistent', 'een programma dat je met je stem bedient'], ['een zelfrijdende auto', 'een auto die met sensoren en software zelf stuurt'], ['een deepfake', 'een nep-foto of -video gemaakt met AI'], ['een Mars-rover', 'een robotwagentje dat op Mars rondrijdt'], ['trainingsdata', 'de voorbeelden waarmee een AI leert'], ['een prompt', 'de tekst of vraag die je aan een AI geeft'],
  ], { f: (k) => `Wat is ${k}?`, r: (v) => `Welk begrip hoort bij: ${v}?`, t: (k, v) => `${cap(k)}: ${v}.`, typeMax: 0, d: 2, matchQ: 'Verbind het begrip met de uitleg.', matchN: 4, matches: 4 });
  K.mcs([
    ['Uit welke taal komt het woord "robot"?', 'Tsjechisch', ['Engels', 'Japans', 'Latijn'], 'Het komt van "robota", dwangarbeid, uit een toneelstuk van Karel Čapek uit 1920.'], ['Welke computer versloeg in 1997 schaakkampioen Kasparov?', 'Deep Blue', ['Alexa', 'Siri', 'AlphaGo'], ''], ['Wat gebruikt een robot om om zich heen te kijken?', 'camera’s en sensoren', ['een kompas alleen', 'een bril', 'oren van papier'], ''],
    ['Kan een AI zich vergissen?', 'ja, een AI kan fouten maken', ['nee, nooit', 'alleen op zondag', 'alleen bij kinderen'], 'Controleer belangrijke dingen altijd.'], ['Wat is slim om te doen met je wachtwoord als je met een AI of app praat?', 'het geheim houden', ['het delen', 'het opschrijven op school', 'het aan vreemden geven'], ''],
    ['Welk landje is bekend om zijn robots en high-tech?', 'Japan', ['IJsland', 'Nepal', 'Chili'], ''], ['Wat doet een robotstofzuiger?', 'zelf de vloer stofzuigen', ['zelf koken', 'zelf lopen', 'zelf zingen'], ''], ['Wat betekent "autonoom"?', 'zelfstandig, zonder dat iemand het stuurt', ['heel snel', 'heel zwaar', 'heel groot'], ''],
  ]);
  K.tfs([['Een robot kan alleen in een fabriek werken.', false, 'Robots werken ook in huizen, ziekenhuizen en de ruimte.'], ['AI leert van voorbeelden.', true], ['Alles wat een AI zegt is altijd waar.', false, 'AI kan fouten maken of dingen verzinnen.'], ['Een algoritme is een reeks stappen.', true], ['Een chatbot is een mens die typt.', false, 'Een chatbot is een programma.'], ['Je zet foto’s van anderen zonder te vragen niet in een AI.', true]]);
  K.order('Zet de stappen van een algoritme voor thee zetten in de goede volgorde.', ['Water koken', 'Theezakje in de kop doen', 'Water in de kop gieten', 'Drie minuten wachten']);
  return K.out();
}

function gesteenten() {
  const K = kit({ id: 'gesteenten-mineralen', name: 'Gesteenten en mineralen', emoji: '💎', group: 'Natuur', desc: 'Graniet, marmer, diamant en vuursteen: soorten gesteente, edelstenen en hoe ze ontstaan.' });
  const G = { 'stollingsgesteente': ['graniet', 'basalt', 'puimsteen', 'obsidiaan'], 'afzettingsgesteente': ['zandsteen', 'kalksteen', 'krijt', 'steenkool'], 'metamorf gesteente': ['marmer', 'leisteen', 'gneis', 'kwartsiet'] };
  K.groups(G, { which: (it) => `Tot welke groep hoort ${it}?`, names: Object.keys(G), tfq: (it, c) => `${cap(it)} is een ${c}.`, multi: (n) => `Welke gesteenten zijn ${n}? (kies alle goede)`, reps: 3 });
  K.facts([
    ['een stollingsgesteente', 'ontstaat uit afgekoeld magma of lava'], ['een afzettingsgesteente', 'ontstaat uit lagen zand, klei of schelpjes die samen worden gedrukt'], ['een metamorf gesteente', 'is door hitte en druk veranderd in een ander gesteente'], ['een fossiel', 'een versteend overblijfsel van een dier of plant'], ['erosie', 'het langzaam wegslijten van gesteente door wind en water'], ['een mineraal', 'een natuurlijke stof waar gesteenten uit bestaan'],
    ['de Mohs-schaal', 'meet hoe hard een mineraal is, van 1 tot en met 10'], ['een edelsteen', 'een zeldzame, mooie steen, vaak gebruikt voor sieraden'], ['een kristal', 'een steen met regelmatige vlakke zijden'], ['een erts', 'gesteente waar je metaal uit kunt halen'],
  ], { f: (k) => `Wat is ${k}?`, r: (v) => `Waar gaat dit over: ${v}?`, t: (k, v) => `${cap(k)}: ${v}.`, typeMax: 0, d: 2 });
  K.facts([
    ['de diamant', 'de hardste natuurlijke stof', '💎'], ['de robijn', 'een rode edelsteen', '❤️'], ['de smaragd', 'een groene edelsteen', '💚'], ['de saffier', 'een blauwe edelsteen', '💙'], ['de amethist', 'een paarse edelsteen', '💜'], ['barnsteen', 'versteende hars van oude bomen', '🟠'], ['bergkristal', 'een heldere kwartssoort', '🔮'], ['marmer', 'een gesteente dat uit kalksteen ontstaat en gebruikt wordt voor beelden', '🏛️'], ['vuursteen', 'een harde steen waarmee je vonken kunt maken', '🔥'], ['leisteen', 'een gesteente dat in dunne platen splijt en op daken ligt', '🏠'],
  ].map((r) => [r[0], r[1], '', { e: r[2], d: 2 }]), { f: (k) => `Wat weet je over ${k}?`, r: (v) => `Welke steen is dit: ${v}?`, t: (k, v) => `${cap(k)} is ${v}.`, typeMax: 0 });
  K.mcs([
    ['Waar is een diamant van gemaakt?', 'koolstof', ['ijzer', 'zand', 'glas'], ''], ['Welk getal op de Mohs-schaal heeft diamant?', '10', ['1', '5', '7'], ''], ['Welk mineraal is het zachtst (nummer 1 op de Mohs-schaal)?', 'talk', ['kwarts', 'diamant', 'topaas'], ''], ['Welk gesteente drijft op water omdat het zoveel luchtbelletjes heeft?', 'puimsteen', ['graniet', 'marmer', 'basalt'], ''],
    ['Waar vind je veel fossielen?', 'in afzettingsgesteente', ['in verse lava', 'in diamant', 'in glas'], ''], ['Hoe heet gesmolten gesteente onder de grond?', 'magma', ['lava', 'as', 'zand'], 'Als het buiten de vulkaan stroomt, heet het lava.'], ['Wat gebeurt er met een rots door regen en wind in duizenden jaren?', 'hij slijt langzaam weg', ['hij groeit', 'hij wordt een diamant', 'hij verandert in hout'], ''],
  ]);
  K.tfs([['Graniet is een stollingsgesteente.', true], ['Marmer is een afzettingsgesteente.', false, 'Marmer is metamorf: het ontstaat uit kalksteen.'], ['Diamant is de hardste natuurlijke stof.', true], ['Robijnen zijn groen.', false, 'Robijnen zijn rood; smaragden zijn groen.'], ['Barnsteen is versteende hars.', true], ['Zand ontstaat door slijtage van gesteenten.', true]]);
  K.order('Zet de mineralen op volgorde van zacht naar hard (Mohs).', ['talk', 'gips', 'kwarts', 'diamant']);
  return K.out();
}

function rekentaal() {
  const K = kit({ id: 'rekentaal', name: 'Rekentaal: som, product, factor', emoji: '🔠', group: 'Rekenen', desc: 'De woorden van het rekenen: som, verschil, product, noemer, omtrek, oppervlakte en meer.' });
  K.facts([
    ['de som', 'de uitkomst van een optelling'], ['het verschil', 'de uitkomst van een aftrekking'], ['het product', 'de uitkomst van een vermenigvuldiging'], ['het quotiënt', 'de uitkomst van een deling'], ['een term', 'een getal dat je optelt'], ['een factor', 'een getal dat je vermenigvuldigt'], ['de deler', 'het getal waardoor je deelt'], ['de noemer', 'het getal onder de breukstreep'], ['de teller', 'het getal boven de breukstreep'], ['een even getal', 'een getal dat deelbaar is door 2'],
    ['een oneven getal', 'een getal dat niet deelbaar is door 2'], ['een priemgetal', 'een getal dat alleen deelbaar is door 1 en door zichzelf'], ['de omtrek', 'de afstand rondom een vorm'], ['de oppervlakte', 'hoeveel vlak een vorm bedekt'], ['de inhoud', 'hoeveel er in een ruimte past'], ['de diameter', 'de afstand dwars door het midden van een cirkel'], ['de straal', 'de afstand van het midden van een cirkel tot de rand'], ['een rechte hoek', 'een hoek van 90 graden'],
    ['evenwijdige lijnen', 'lijnen die altijd even ver uit elkaar blijven'], ['loodrechte lijnen', 'lijnen die een rechte hoek met elkaar maken'], ['het gemiddelde', 'alles bij elkaar opgeteld gedeeld door het aantal'], ['een kwadraat', 'een getal keer zichzelf'], ['afronden', 'een getal vervangen door een eenvoudiger getal in de buurt'], ['een procent', 'een honderdste deel'], ['schatten', 'ongeveer bepalen zonder precies te rekenen'],
  ], { f: (k) => `Wat betekent ${k} in de wiskunde?`, r: (v) => `Welk rekenwoord past bij: ${v}?`, t: (k, v) => `${cap(k)}: ${v}.`, typeMax: 0, d: 2, matchQ: 'Verbind het rekenwoord met de betekenis.', matchN: 4, matches: 6 });
  for (const [a, b] of [[12, 7], [25, 14], [9, 8], [36, 17], [48, 15], [63, 21], [8, 6], [7, 9]]) {
    K.num(`Wat is de som van ${a} en ${b}?`, a + b, { d: 1, c: `${a}+${b}` }); K.num(`Wat is het verschil van ${a} en ${b}? (groot min klein)`, Math.abs(a - b), { d: 1, c: `Math.abs(${a}-${b})` }); K.num(`Wat is het product van ${a} en ${b}?`, a * b, { d: 2, c: `${a}*${b}` });
  }
  for (const [a, b] of [[48, 6], [56, 7], [81, 9], [72, 8], [45, 5], [96, 12]]) K.num(`Wat is het quotiënt van ${a} gedeeld door ${b}?`, a / b, { d: 2, c: `${a}/${b}` });
  K.mcs([['Wat is de omtrek van een vierkant met zijde 5?', '20', ['10', '25', '15'], ''], ['Wat is de oppervlakte van een rechthoek van 4 bij 6?', '24', ['10', '20', '14'], ''], ['Hoe groot is de diameter als de straal 5 is?', '10', ['5', '15', '25'], ''], ['Wat is het gemiddelde van 4, 6 en 8?', '6', ['5', '7', '8'], ''], ['Welk getal is een priemgetal?', '13', ['15', '21', '27'], ''], ['Welk getal is geen priemgetal?', '9', ['2', '7', '11'], '']]);
  K.tfs([['De som is de uitkomst van een optelling.', true], ['Het product is de uitkomst van een deling.', false, 'Het product is de uitkomst van een vermenigvuldiging.'], ['0 is een even getal.', true], ['1 is een priemgetal.', false, 'Een priemgetal heeft precies twee delers; 1 heeft er maar één.'], ['De diameter is twee keer de straal.', true]]);
  return K.out();
}

function etenWereld() {
  const K = kit({ id: 'eten-wereld', name: 'Eten uit de hele wereld', emoji: '🍜', group: 'Wereld', desc: 'Pizza, sushi, taco’s en stroopwafels: uit welk land komt welk gerecht?' });
  K.facts([
    ['pizza', 'Italië', '🍕'], ['pasta', 'Italië', '🍝'], ['sushi', 'Japan', '🍣'], ['paella', 'Spanje', '🥘'], ['churros', 'Spanje', '🥖'], ['croissant', 'Frankrijk', '🥐'], ['ratatouille', 'Frankrijk', '🍆'], ['taco', 'Mexico', '🌮'], ['guacamole', 'Mexico', '🥑'], ['kimchi', 'Zuid-Korea', '🥬'], ['couscous', 'Marokko', '🍲'], ['nasi goreng', 'Indonesië', '🍛'], ['gado-gado', 'Indonesië', '🥜'],
    ['moussaka', 'Griekenland', '🍆'], ['pad thai', 'Thailand', '🍜'], ['pho', 'Vietnam', '🍲'], ['dim sum', 'China', '🥟'], ['pekingeend', 'China', '🦆'], ['bratwurst', 'Duitsland', '🌭'], ['pretzel', 'Duitsland', '🥨'], ['wiener schnitzel', 'Oostenrijk', '🥩'], ['fish and chips', 'Engeland', '🍟'], ['pierogi', 'Polen', '🥟'], ['goulash', 'Hongarije', '🍲'], ['stroopwafel', 'Nederland', '🧇'], ['stamppot', 'Nederland', '🥔'], ['haring', 'Nederland', '🐟'], ['poffertjes', 'Nederland', '🥞'],
    ['Belgische wafel', 'België', '🧇'], ['moules-frites', 'België', '🦪'], ['poutine', 'Canada', '🍟'],
  ].map((r) => [r[0], r[1], '', { e: r[2], d: 2, }]), { f: (k) => `Uit welk land komt ${k}?`, t: (k, v) => `${cap(k)} komt uit ${v}.`, typeMax: 20, d: 2, mc: true });
  K.groups({ 'Italië': ['pizza', 'pasta', 'lasagne', 'risotto'], 'Frankrijk': ['croissant', 'ratatouille', 'quiche', 'crêpe'], 'Spanje': ['paella', 'churros', 'tapas', 'gazpacho'], 'Nederland': ['stroopwafel', 'stamppot', 'haring', 'poffertjes'] }, { multi: (n) => `Welke gerechten horen bij ${n}? (kies alle goede)`, reps: 3 });
  K.mcs([['Welk eten maak je van gekookt rijst en rauwe vis?', 'sushi', ['pizza', 'pasta', 'taco'], ''], ['Hoe heet het Italiaanse gerecht met deeg, tomaat en kaas?', 'pizza', ['sushi', 'paella', 'kimchi'], ''], ['Welk eten komt uit Mexico en heeft een maïs- of tarwetortilla?', 'taco', ['croissant', 'pizza', 'sushi'], ''], ['Wat eet je in Nederland rond Sinterklaas?', 'pepernoten', ['sushi', 'taco’s', 'baguette'], ''], ['Welk gerecht eet je bij oud en nieuw in Nederland?', 'oliebollen', ['sushi', 'pizza', 'hamburgers'], '']]);
  K.tfs([['Sushi komt uit Japan.', true], ['Een croissant komt uit Mexico.', false, 'Croissants worden vooral met Frankrijk (en Oostenrijk) verbonden.'], ['Pasta is typisch Italiaans.', true], ['Stroopwafels komen uit Nederland.', true], ['Paella komt uit Duitsland.', false, 'Paella komt uit Spanje.']]);
  return K.out();
}

function fruitGroente() {
  const K = kit({ id: 'fruit-groente', name: 'Fruit en groente: wat groeit waar?', emoji: '🥕', group: 'Natuur', desc: 'Wat groeit onder de grond, aan een boom of aan een struik? Seizoenen, herkomst en vitamines.' });
  const G = { 'onder de grond': ['wortel', 'aardappel', 'ui', 'radijs', 'biet', 'knolselderij'], 'aan een boom': ['appel', 'peer', 'kers', 'pruim', 'perzik', 'sinaasappel'], 'aan een struik': ['framboos', 'bosbes', 'aalbes', 'kruisbes'], 'als bladgroente boven de grond': ['sla', 'spinazie', 'boerenkool', 'andijvie'], 'aan een klimplant of ranke': ['erwten', 'bonen', 'komkommer', 'pompoen'] };
  K.groups(G, { which: (it) => `Waar groeit (of groeien) ${it}?`, names: Object.keys(G), tfq: (it, c) => `${cap(it)} groeit ${c}.`, multi: (n) => `Wat groeit ${n}? (kies alle goede)`, reps: 3 });
  K.facts([
    ['de aardappel', 'Zuid-Amerika'], ['de banaan', 'Zuidoost-Azië'], ['de appel', 'Centraal-Azië'], ['de kiwi', 'China'], ['de ananas', 'Zuid-Amerika'], ['de aubergine', 'India'], ['de mango', 'India'],
  ].map((r) => [r[0], r[1], '', { g: 'herkomst', d: 3 }]), { f: (k) => `Uit welk gebied komt ${k} oorspronkelijk?`, t: (k, v) => `${cap(k)} komt oorspronkelijk uit ${v}.`, typeMax: 0, d: 3 });
  K.mcs([
    ['Welke vitamine zit veel in sinaasappels?', 'vitamine C', ['vitamine D', 'vitamine K', 'vitamine B12'], ''], ['Waarom is een tomaat eigenlijk een vrucht?', 'omdat hij zaadjes bevat en uit een bloem groeit', ['omdat hij rood is', 'omdat hij groeit', 'omdat hij zacht is'], ''], ['Welke is een peulvrucht?', 'erwt', ['wortel', 'appel', 'sla'], ''], ['Welk deel van een wortel eet je?', 'de wortel zelf (onder de grond)', ['het blad', 'de bloem', 'het zaad'], ''],
    ['Wat is een bloemkool eigenlijk?', 'een bloeiwijze (nog niet uitgebloeide bloemetjes)', ['een knol', 'een zaad', 'een wortel'], ''], ['Hoeveel groente per dag adviseert het Voedingscentrum ongeveer?', 'ongeveer 250 gram', ['1 stukje', 'ongeveer 25 gram', '2 kilo'], ''], ['Wat is een pit in een kers?', 'de steen met het zaad', ['het blad', 'de steel', 'de schil'], ''], ['Welk fruit is geel en krom?', 'banaan', ['kiwi', 'peer', 'druif'], ''],
    ['Welke groente is een knol die onder de grond groeit en vaak wordt gestampt?', 'aardappel', ['sla', 'spruitjes', 'erwten'], ''], ['Welke kleur heeft een rijpe banaan?', 'geel', ['blauw', 'zwart', 'rood'], ''],
  ]);
  K.tfs([['Een wortel groeit onder de grond.', true], ['Een appel groeit aan een struik.', false, 'Een appel groeit aan een boom.'], ['Aardbeien zijn in de zomer in Nederland het lekkerst.', true], ['De tomaat is een vrucht.', true], ['Spinazie groeit aan een boom.', false], ['Een aardappel komt oorspronkelijk uit Zuid-Amerika.', true]]);
  K.order('Zet de seizoenen op volgorde met de lente eerst.', ['lente', 'zomer', 'herfst', 'winter']);
  return K.out();
}

export const builders = [water, dierenNL, beroemdeNL, grieks, ontdekkers, robots, gesteenten, rekentaal, etenWereld, fruitGroente];
