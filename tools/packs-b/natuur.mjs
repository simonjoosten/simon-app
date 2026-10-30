// Natuur-packs: dieren, planten, weer, ruimte, aarde, dinosaurussen, oceaan, insecten, energie, materialen.
import { kit } from './lib.mjs';

const cap = (s) => s[0].toUpperCase() + s.slice(1);

function geluiden() {
  const K = kit({ id: 'dieren-geluiden', name: 'Dieren en hun geluiden', emoji: '🐮', group: 'Natuur', desc: 'Welk dier loeit, blaat, hinnikt of kraait? Dierengeluiden.' });
  const V = ['loeit', 'blaat', 'hinnikt', 'knort', 'miauwt', 'blaft', 'kraait', 'kakelt', 'kwaakt', 'hoeit', 'brult', 'trompettert', 'sist', 'zoemt', 'tjilpt', 'koert', 'balkt', 'mekkert', 'piept', 'huilt', 'fluit', 'tjirpt', 'klokt', 'snatert', 'gromt', 'krast'];
  K.facts([['de koe', 'loeit', '', { e: '🐮', d: 1 }], ['het schaap', 'blaat', '', { e: '🐑', d: 1 }], ['het paard', 'hinnikt', '', { e: '🐴', d: 1 }], ['het varken', 'knort', '', { e: '🐷', d: 1 }], ['de kat', 'miauwt', '', { e: '🐱', d: 1 }], ['de hond', 'blaft', '', { e: '🐶', d: 1 }], ['de haan', 'kraait', '', { e: '🐓', d: 1 }], ['de kip', 'kakelt', '', { e: '🐔', d: 1 }], ['de eend', 'kwaakt', '', { e: '🦆', d: 1 }], ['de kikker', 'kwaakt', '', { e: '🐸', d: 1 }], ['de uil', 'hoeit', '', { e: '🦉', d: 2 }], ['de leeuw', 'brult', '', { e: '🦁', d: 1 }], ['de tijger', 'brult', '', { e: '🐯', d: 2 }], ['de olifant', 'trompettert', '', { e: '🐘', d: 2 }], ['de slang', 'sist', '', { e: '🐍', d: 2 }], ['de bij', 'zoemt', '', { e: '🐝', d: 1 }], ['de mug', 'zoemt', '', { d: 2 }], ['de mus', 'tjilpt', '', { d: 2 }], ['de duif', 'koert', '', { e: '🕊️', d: 3 }], ['de ezel', 'balkt', '', { e: '🫏', d: 2 }], ['de geit', 'mekkert', '', { e: '🐐', d: 2 }], ['de muis', 'piept', '', { e: '🐭', d: 2 }], ['de wolf', 'huilt', '', { e: '🐺', d: 2 }], ['de vogel', 'fluit', '', { e: '🐦', d: 2 }], ['de krekel', 'tjirpt', '', { d: 3 }], ['de kalkoen', 'klokt', '', { e: '🦃', d: 3 }], ['de gans', 'snatert', '', { d: 3 }], ['de beer', 'gromt', '', { e: '🐻', d: 2 }], ['de kraai', 'krast', '', { d: 3 }]].map((r) => [r[0], r[1], '', r[3]]), {
    f: (k) => `Welk werkwoord hoort bij het geluid van ${k}?`, r: (v) => `Welk dier doet dit: "${v}"?`, rE: false, t: (k, v) => `${cap(k)} ${v}.`, fill: (k) => `${cap(k)} ___.`, pool: V, typeMax: 12, d: 1,
  });
  K.facts([['de koe', 'Boe', '', { e: '🐮' }], ['de hond', 'Woef', '', { e: '🐶' }], ['de kat', 'Miauw', '', { e: '🐱' }], ['de eend', 'Kwak', '', { e: '🦆' }], ['het schaap', 'Mè', '', { e: '🐑', alt: ['Meh', 'Bè'] }], ['het varken', 'Knor', '', { e: '🐷' }], ['de kip', 'Tok', '', { e: '🐔' }], ['de haan', 'Kukeleku', '', { e: '🐓' }], ['het paard', 'Hihihi', '', { e: '🐴', alt: ['Hiehie'] }], ['de uil', 'Oehoe', '', { e: '🦉' }], ['de slang', 'Ssss', '', { e: '🐍' }], ['de bij', 'Bzzz', '', { e: '🐝' }], ['de ezel', 'Ia-ia', '', { e: '🫏', alt: ['Ia ia', 'IJ-aa'] }]], { f: (k) => `Hoe klinkt het geluid van ${k}?`, r: (v) => `Welk dier zegt "${v}"?`, rE: false, d: 1, typeMax: 12, type: false });
  K.mcs([['Welk dier zegt "muu"?', 'de koe', ['het schaap', 'de geit', 'het paard'], ''], ['Welk dier kan "kukeleku" roepen?', 'de haan', ['de kip', 'de eend', 'de kalkoen'], ''], ['Welk dier hoor je als het begint te "tsjilpen" in de tuin?', 'de mus', ['de koe', 'de leeuw', 'de olifant'], ''], ['Welk dier heeft een bijnaam als "koning van de jungle" en brult?', 'de leeuw', ['de ezel', 'de muis', 'de kat'], '']]);
  K.tfs([['Een koe loeit.', true], ['Een paard blaft.', false, 'Een hond blaft; een paard hinnikt.'], ['Een haan kraait in de ochtend.', true], ['Een kat kwaakt.', false, 'Een kat miauwt; een eend of kikker kwaakt.'], ['Een slang sist.', true], ['Een olifant trompettert.', true], ['Een varken blaat.', false, 'Een varken knort; een schaap blaat.']]);
  return K.out();
}

function klassen() {
  const K = kit({ id: 'dieren-klassen', name: 'Soorten dieren', emoji: '🐾', group: 'Natuur', desc: 'Zoogdier, vogel, reptiel, amfibie, vis of insect? En kenmerken van dieren.' });
  const G = {
    zoogdier: ['walvis', 'dolfijn', 'vleermuis', 'olifant', 'hond', 'kat', 'paard', 'koe', 'egel', 'eekhoorn', 'zeehond', 'giraffe', 'kangoeroe', 'leeuw', 'ijsbeer', 'konijn', 'aap', 'mol'],
    vogel: ['pinguïn', 'struisvogel', 'uil', 'adelaar', 'kip', 'meeuw', 'ooievaar', 'papegaai', 'zwaan', 'kiwi', 'mus', 'flamingo'],
    reptiel: ['slang', 'schildpad', 'krokodil', 'hagedis', 'kameleon', 'gekko', 'leguaan'],
    amfibie: ['kikker', 'pad', 'salamander', 'watersalamander'],
    vis: ['haai', 'zalm', 'tonijn', 'zeepaardje', 'goudvis', 'paling', 'kabeljauw', 'snoek'],
    insect: ['vlinder', 'mier', 'bij', 'lieveheersbeestje', 'libelle', 'sprinkhaan', 'mug', 'vlieg', 'wesp', 'kever'],
    spinachtige: ['spin', 'schorpioen', 'hooiwagen'],
    weekdier: ['octopus', 'inktvis', 'slak', 'mossel', 'oester'],
    schaaldier: ['krab', 'kreeft', 'garnaal'],
  };
  const E = { walvis: '🐋', dolfijn: '🐬', olifant: '🐘', hond: '🐶', kat: '🐱', paard: '🐴', koe: '🐮', egel: '🦔', eekhoorn: '🐿️', giraffe: '🦒', kangoeroe: '🦘', leeuw: '🦁', ijsbeer: '🐻‍❄️', konijn: '🐰', aap: '🐒', pinguïn: '🐧', struisvogel: '🪶', uil: '🦉', kip: '🐔', zwaan: '🦢', papegaai: '🦜', flamingo: '🦩', slang: '🐍', schildpad: '🐢', krokodil: '🐊', hagedis: '🦎', kikker: '🐸', haai: '🦈', tonijn: '🐟', zeepaardje: '🐠', goudvis: '🐠', vlinder: '🦋', mier: '🐜', bij: '🐝', lieveheersbeestje: '🐞', sprinkhaan: '🦗', mug: '🦟', vlieg: '🪰', kever: '🪲', spin: '🕷️', schorpioen: '🦂', octopus: '🐙', slak: '🐌', krab: '🦀', kreeft: '🦞', garnaal: '🦐', mossel: '🦪', oester: '🦪', vleermuis: '🦇', ooievaar: '🦩', meeuw: '🕊️' };
  const PL = { zoogdier: 'zoogdieren', vogel: 'vogels', reptiel: 'reptielen', amfibie: 'amfibieën', vis: 'vissen', insect: 'insecten', spinachtige: 'spinachtigen', weekdier: 'weekdieren', schaaldier: 'schaaldieren' };
  const names = Object.keys(G);
  K.groups(G, {
    which: (it) => `Tot welke groep dieren hoort: ${it}?`, names, e: E, tfq: (it, c) => `Een ${it} is een ${c}.`,
    wx: (it, c) => ({ vleermuis: 'De vleermuis is het enige zoogdier dat echt kan vliegen.', walvis: 'Een walvis is geen vis maar een zoogdier: hij ademt lucht en geeft melk.', dolfijn: 'Een dolfijn ademt lucht en geeft melk: een zoogdier.', pinguïn: 'Een pinguïn is een vogel die niet kan vliegen maar wel kan zwemmen.', kiwi: 'Een kiwi is een vogel die niet kan vliegen.', zeepaardje: 'Het zeepaardje is een vis, met kieuwen.', kikker: 'Een kikker leeft als kikkervisje in water en later ook op land.', spin: 'Een spin heeft 8 poten en is dus geen insect (die hebben 6).', schorpioen: 'Een schorpioen heeft 8 poten: een spinachtige.', octopus: 'Een octopus heeft geen skelet: een weekdier.', slak: 'Een slak heeft een zacht lichaam: een weekdier.' }[it] || ''),
    multi: (n) => `Welke van deze dieren zijn ${PL[n]}? (kies alle goede)`, reps: 4,
  });
  K.mcs([
    ['Welk dier geeft melk aan zijn jongen?', 'het zoogdier', ['de vis', 'het reptiel', 'het insect'], 'Zoogdieren zoals koeien, honden en mensen geven melk.'],
    ['Welk dier heeft veren?', 'de vogel', ['het reptiel', 'de amfibie', 'de vis'], ''],
    ['Welk dier heeft schubben en is koudbloedig?', 'het reptiel', ['de vogel', 'het zoogdier', 'het insect'], ''],
    ['Waarmee ademt een vis onder water?', 'met kieuwen', ['met longen', 'met de huid alleen', 'met een snuit'], ''],
    ['Wat heeft een insect altijd?', 'zes poten', ['vier poten', 'acht poten', 'twee poten'], ''],
    ['Hoeveel lichaamsdelen heeft een insect?', '3', ['2', '4', '5'], 'Kop, borststuk en achterlijf.'],
    ['Hoeveel poten heeft een spin?', '8', ['6', '10', '4'], ''],
    ['Welke dieren leggen eieren?', 'vogels', ['zoogdieren (meestal niet)', 'geen enkel dier', 'alleen vissen'], 'Vogels, reptielen, vissen en insecten leggen eieren.'],
    ['Wat is een kikkervisje?', 'het jong van een kikker', ['een kleine vis', 'een soort slak', 'een insect'], ''],
    ['Wat wordt een rups later?', 'een vlinder', ['een kever', 'een mug', 'een slak'], ''],
    ['Welk zoogdier leeft in de zee en is het grootste dier ter wereld?', 'de blauwe vinvis', ['de haai', 'de dolfijn', 'de orka'], 'De blauwe vinvis wordt wel 30 meter lang.'],
    ['Welk dier kan zijn kleur veranderen?', 'de kameleon', ['de leeuw', 'de egel', 'de uil'], ''],
    ['Welk dier slaapt in de winter een lange winterslaap?', 'de egel', ['de kat', 'de koe', 'de mus'], ''],
    ['Wat is een koudbloedig dier?', 'een dier dat zijn lichaamstemperatuur niet zelf warm houdt', ['een dier dat in de sneeuw leeft', 'een dier met blauw bloed', 'een dier dat nooit warm wordt'], ''],
  ]);
  K.facts([['de spin', '8'], ['het insect', '6'], ['de hond', '4'], ['de kip', '2'], ['de mier', '6'], ['de vlinder', '6'], ['de kikker', '4'], ['de schorpioen', '8'], ['de krab', '10'], ['de kreeft', '10'], ['de mens', '2'], ['het paard', '4'], ['de bij', '6'], ['de slak', '0'], ['de slang', '0']].map((r) => [r[0], r[1], r[0] === 'de krab' ? 'Een krab heeft 10 poten (de twee voorste zijn scharen).' : '', {}]), { f: (k) => `Hoeveel poten heeft ${k}?`, pool: ['0', '2', '4', '6', '8', '10'], type: false, d: 2, t: (k, v) => `${cap(k)} heeft ${v} poten.` });
  return K.out();
}

function jongen() {
  const K = kit({ id: 'dieren-jongen', name: 'Jongen, mannetjes en groepen', emoji: '🐣', group: 'Natuur', desc: 'Hoe heet het jong van een dier? En het mannetje, en een groep dieren?' });
  K.facts([['de koe', 'kalf', '', { e: '🐮', d: 1 }], ['het paard', 'veulen', '', { e: '🐴', d: 1 }], ['het schaap', 'lam', '', { e: '🐑', d: 1 }], ['het varken', 'big', '', { e: '🐷', d: 1 }], ['de kip', 'kuiken', '', { e: '🐔', d: 1 }], ['de hond', 'puppy', '', { e: '🐶', d: 1, alt: ['pup'] }], ['de kat', 'kitten', '', { e: '🐱', d: 1 }], ['de vos', 'welp', '', { e: '🦊' }], ['de leeuw', 'welp', '', { e: '🦁' }], ['de beer', 'welp', '', { e: '🐻' }], ['de wolf', 'welp', '', { e: '🐺' }], ['het hert', 'kalf', 'Ook wel hertenkalf.', { e: '🦌', alt: ['hertenkalf'] }], ['de kikker', 'kikkervisje', 'Ook wel dikkopje genoemd.', { e: '🐸', alt: ['dikkopje'] }], ['de vlinder', 'rups', '', { e: '🦋', d: 1 }], ['de olifant', 'kalf', '', { e: '🐘' }], ['de zwaan', 'kuiken', '', { e: '🦢' }], ['de ezel', 'veulen', '', { e: '🫏' }], ['de giraffe', 'kalf', '', { e: '🦒' }], ['de walvis', 'kalf', '', { e: '🐋' }], ['de dolfijn', 'kalf', '', { e: '🐬' }], ['het konijn', 'konijntje', '', { e: '🐰', d: 1 }], ['de eend', 'eendje', '', { e: '🦆', d: 1, alt: ['kuiken'] }], ['de geit', 'geitje', '', { e: '🐐', d: 1 }], ['de zeehond', 'pup', '', { e: '🦭' }]].map((r) => [r[0], r[1], r[2] || '', r[3]]), {
    f: (k) => `Hoe heet het jong van ${k}?`, r: (v) => `${cap(v)} is het jong van welk dier?`, t: (k, v) => `Het jong van ${k} heet een ${v}.`, fill: (k) => `Het jong van ${k} heet een ___.`, typeMax: 12, d: 2, matchQ: 'Verbind het dier met zijn jong', matches: 4,
  });
  K.facts([['koe', 'stier'], ['hen', 'haan'], ['ooi', 'ram'], ['merrie', 'hengst'], ['zeug', 'beer'], ['teef', 'reu'], ['poes', 'kater'], ['geit', 'bok'], ['eend', 'woerd'], ['gans', 'gent'], ['hinde', 'hert']].map((r) => [r[0], r[1], r[0] === 'zeug' ? 'Het mannetje van het varken is een beer (niet de bruine beer!).' : '', {}]), {
    f: (k) => `Hoe heet het mannetje van de ${k}?`, r: (v) => `${cap(v)} is het mannetje van de ...?`, t: (k, v) => `Het mannetje van de ${k} heet ${v}.`, fill: (k) => `Het mannetje van de ${k} heet ___.`, typeMax: 12, d: 3, matchQ: 'Verbind het vrouwtje met het mannetje', matches: 2,
  });
  K.facts([['wolven', 'roedel'], ['vissen', 'school'], ['bijen', 'zwerm'], ['koeien', 'kudde'], ['schapen', 'kudde'], ['olifanten', 'kudde'], ['mieren', 'kolonie'], ['apen', 'troep'], ['honden', 'roedel'], ['leeuwen', 'troep']].map((r) => [r[0], r[1], '', {}]), { f: (k) => `Hoe noem je een groep ${k}?`, t: (k, v) => `Een groep ${k} noem je een ${v}.`, fill: (k) => `Een groep ${k} noem je een ___.`, pool: ['roedel', 'school', 'zwerm', 'kudde', 'kolonie', 'troep', 'vlucht'], type: false, d: 2 });
  K.tfs([['Het jong van een kat heet een kitten.', true], ['Het jong van een paard heet een kalf.', false, 'Een paard krijgt een veulen.'], ['Een lam is het jong van een schaap.', true], ['Een big is het jong van een koe.', false, 'Een big is het jong van een varken.'], ['Een rups verandert in een vlinder.', true]]);
  return K.out();
}

function eten() {
  const K = kit({ id: 'dieren-eten', name: 'Wat eten dieren?', emoji: '🍖', group: 'Natuur', desc: 'Planteneters, vleeseters, alleseters en het lievelingseten van dieren.' });
  K.facts([['de koe', 'planteneter', '', { e: '🐮', d: 1 }], ['het schaap', 'planteneter', '', { e: '🐑', d: 1 }], ['het paard', 'planteneter', '', { e: '🐴' }], ['het konijn', 'planteneter', '', { e: '🐰' }], ['de giraffe', 'planteneter', '', { e: '🦒' }], ['de olifant', 'planteneter', '', { e: '🐘', d: 1 }], ['de panda', 'planteneter', 'Panda\'s eten vooral bamboe.', { e: '🐼' }], ['de koala', 'planteneter', 'Koala\'s eten eucalyptusbladeren.', { e: '🐨' }], ['het nijlpaard', 'planteneter', '', { e: '🦛', d: 3 }], ['de zebra', 'planteneter', '', { e: '🦓' }], ['de leeuw', 'vleeseter', '', { e: '🦁', d: 1 }], ['de tijger', 'vleeseter', '', { e: '🐯' }], ['de wolf', 'vleeseter', '', { e: '🐺' }], ['de haai', 'vleeseter', '', { e: '🦈' }], ['de adelaar', 'vleeseter', '', { d: 2 }], ['de krokodil', 'vleeseter', '', { e: '🐊' }], ['de uil', 'vleeseter', '', { e: '🦉' }], ['de slang', 'vleeseter', '', { e: '🐍' }], ['de orka', 'vleeseter', '', { d: 3 }], ['de beer', 'alleseter', 'Een bruine beer eet bessen, vis en vlees.', { e: '🐻' }], ['de mens', 'alleseter', '', { d: 1 }], ['het varken', 'alleseter', '', { e: '🐷' }], ['de kip', 'alleseter', 'Kippen eten graan, zaden en insecten.', { e: '🐔' }], ['de rat', 'alleseter', '', { e: '🐀' }], ['de wasbeer', 'alleseter', '', { e: '🦝', d: 3 }], ['de miereneter', 'insecteneter', 'Hij eet mieren en termieten.', { d: 2 }], ['de kameleon', 'insecteneter', '', { e: '🦎', d: 3 }], ['de egel', 'insecteneter', 'Een egel eet vooral insecten, wormen en slakken.', { e: '🦔', d: 2 }]].map((r) => [r[0], r[1], r[2] || '', r[3]]), {
    f: (k) => `Wat voor eter is ${k}?`, t: (k, v) => `${cap(k)} is een ${v}.`, fill: (k) => `${cap(k)} is een ___.`, pool: ['planteneter', 'vleeseter', 'alleseter', 'insecteneter'], type: false, d: 2,
  });
  K.facts([['de panda', 'bamboe', '', { e: '🐼' }], ['de koala', 'eucalyptusbladeren', '', { e: '🐨', noType: true }], ['de giraffe', 'bladeren van bomen', '', { e: '🦒', noType: true }], ['de bij', 'nectar van bloemen', '', { e: '🐝', noType: true }], ['de ijsbeer', 'zeehonden', '', { e: '🐻‍❄️' }], ['de pinguïn', 'vis', '', { e: '🐧', d: 1 }], ['de koe', 'gras', '', { e: '🐮', d: 1 }], ['het paard', 'gras en hooi', '', { e: '🐴', noType: true }], ['de eekhoorn', 'noten', '', { e: '🐿️' }], ['het konijn', 'wortels en gras', '', { e: '🐰', noType: true }], ['de kikker', 'insecten', '', { e: '🐸' }], ['de miereneter', 'mieren', '', { d: 2 }], ['de spin', 'insecten', '', { e: '🕷️' }], ['de rups', 'bladeren', '', { e: '🐛', d: 1 }], ['de zeester', 'mosselen en schelpdieren', '', { e: '⭐', d: 3, noType: true }], ['de lieveheersbeestje', 'bladluizen', '', { e: '🐞', d: 3 }], ['de haas', 'gras en kruiden', '', { d: 2, noType: true }], ['de aap', 'fruit en bladeren', '', { e: '🐒', noType: true }], ['de wolf', 'vlees', '', { e: '🐺', d: 1 }], ['de olifant', 'gras en bladeren', '', { e: '🐘', noType: true }]].map((r) => [r[0].replace('de lieveheersbeestje', 'het lieveheersbeestje').replace('de haas', 'de haas'), r[1], r[2] || '', r[3]]), {
    f: (k) => `Wat eet ${k} het liefst?`, t: (k, v) => `${cap(k)} eet vooral ${v}.`, fill: (k) => `${cap(k)} eet vooral ___.`, typeMax: 16, d: 2,
  });
  K.mcs([['Wat is een herbivoor?', 'een planteneter', ['een vleeseter', 'een alleseter', 'een insect'], ''], ['Wat is een carnivoor?', 'een vleeseter', ['een planteneter', 'een alleseter', 'een vogel'], ''], ['Wat is een omnivoor?', 'een alleseter', ['een vleeseter', 'een planteneter', 'een vis'], ''], ['Wat is een prooi?', 'een dier dat door een ander dier gegeten wordt', ['een dier dat jaagt', 'een dier dat slaapt', 'een huisdier'], ''], ['Wat is een roofdier?', 'een dier dat andere dieren jaagt en eet', ['een dier dat gras eet', 'een dier dat nooit eet', 'een dier dat in een nest woont'], ''], ['Wat is een voedselketen?', 'wie wie opeet, bijvoorbeeld gras → konijn → vos', ['een lange rij supermarkten', 'een ketting van een fiets', 'een soort recept'], ''], ['Wat eet een herbivoor NIET?', 'vlees', ['gras', 'bladeren', 'fruit'], '']]);
  K.order('Zet de voedselketen in de goede volgorde', ['gras', 'konijn', 'vos'], { d: 2 });
  K.order('Zet de voedselketen in de goede volgorde', ['plankton', 'kleine vis', 'grote vis', 'haai'], { d: 3 });
  K.order('Zet de voedselketen in de goede volgorde', ['zon', 'plant', 'rups', 'mees'], { d: 3 });
  return K.out();
}

function leefgebied() {
  const K = kit({ id: 'dieren-leefgebied', name: 'Waar leven dieren?', emoji: '🏞️', group: 'Natuur', desc: 'Poolgebied, woestijn, regenwoud, savanne of zee: waar woont welk dier?' });
  const H = ['bij de polen (sneeuw en ijs)', 'in de woestijn', 'in het regenwoud', 'in de savanne', 'in het bos', 'in de bergen', 'in de zee', 'op de boerderij', 'in en langs rivieren en meren'];
  K.facts([['de ijsbeer', H[0], '', { e: '🐻‍❄️', d: 1 }], ['de pinguïn', H[0], '', { e: '🐧', d: 1 }], ['de poolvos', H[0], '', { d: 2 }], ['de rendier', H[0], '', { e: '🦌', d: 3 }], ['de kameel', H[1], '', { e: '🐪', d: 1 }], ['de schorpioen', H[1], '', { e: '🦂', d: 2 }], ['de fennek (woestijnvos)', H[1], '', { d: 3 }], ['de gorilla', H[2], '', { e: '🦍', d: 2 }], ['de toekan', H[2], '', { e: '🦜', d: 2 }], ['de luiaard', H[2], '', { e: '🦥', d: 2 }], ['de jaguar', H[2], '', { e: '🐆', d: 3 }], ['de leeuw', H[3], '', { e: '🦁', d: 1 }], ['de giraffe', H[3], '', { e: '🦒', d: 1 }], ['de zebra', H[3], '', { e: '🦓', d: 1 }], ['de olifant', H[3], '', { e: '🐘', d: 2 }], ['de eekhoorn', H[4], '', { e: '🐿️', d: 1 }], ['de uil', H[4], '', { e: '🦉', d: 2 }], ['het hert', H[4], '', { e: '🦌', d: 2 }], ['de wolf', H[4], '', { e: '🐺', d: 2 }], ['de beer', H[4], '', { e: '🐻', d: 2 }], ['de steenbok', H[5], '', { d: 3 }], ['de gems', H[5], '', { d: 3 }], ['de marmot', H[5], '', { d: 3 }], ['de walvis', H[6], '', { e: '🐋', d: 1 }], ['de dolfijn', H[6], '', { e: '🐬', d: 1 }], ['de haai', H[6], '', { e: '🦈', d: 1 }], ['de octopus', H[6], '', { e: '🐙', d: 2 }], ['de koe', H[7], '', { e: '🐮', d: 1 }], ['het varken', H[7], '', { e: '🐷', d: 1 }], ['het schaap', H[7], '', { e: '🐑', d: 1 }], ['de kip', H[7], '', { e: '🐔', d: 1 }], ['de bever', H[8], '', { e: '🦫', d: 2 }], ['de otter', H[8], '', { e: '🦦', d: 2 }], ['de kikker', H[8], '', { e: '🐸', d: 2 }], ['de nijlpaard', H[8], '', { e: '🦛', d: 3 }]].map((r) => [r[0].replace('de nijlpaard', 'het nijlpaard').replace('de rendier', 'het rendier'), r[1], '', r[3]]), {
    f: (k) => `Waar leeft ${k}?`, t: (k, v) => `${cap(k)} leeft ${v}.`, pool: H, type: false, d: 2, fill: (k) => `${cap(k)} leeft ___.`,
  });
  K.mcs([['Hoe heet het huis van een bij?', 'korf of bijenkast', ['stal', 'hol', 'nest'], ''], ['Hoe heet het huis van een vogel?', 'nest', ['hol', 'korf', 'stal'], ''], ['Hoe heet het huis van een konijn?', 'hol', ['nest', 'korf', 'stal'], ''], ['Hoe heet het huis van een bever?', 'burcht', ['nest', 'korf', 'schuur'], 'Een bever bouwt een burcht van takken en modder.'], ['Waar slaapt een vleermuis overdag?', 'in een grot of op zolder', ['in een nest', 'in de zee', 'in het gras'], ''], ['Waar leeft de mol?', 'onder de grond', ['in de bomen', 'in de zee', 'in de lucht'], ''], ['Hoe heet het huis van een paard?', 'stal', ['hol', 'nest', 'burcht'], ''], ['Welk dier bouwt dammen in rivieren?', 'de bever', ['de otter', 'de vos', 'de mol'], '']]);
  return K.out();
}

function planten() {
  const K = kit({ id: 'planten-bomen', name: 'Planten, bloemen en bomen', emoji: '🌳', group: 'Natuur', desc: 'Bomen, bloemen, fruit en hoe een plant groeit.' });
  K.facts([['de eik', 'eikels', '', { e: '🌳', d: 1 }], ['de beuk', 'beukennootjes', '', { d: 3, noType: true }], ['de kastanjeboom', 'kastanjes', '', { d: 2 }], ['de esdoorn', 'zaden met vleugels (helikoptertjes)', '', { d: 3, noType: true }], ['de spar', 'naalden en kegels', '', { e: '🎄', d: 2, noType: true }], ['de berk', 'een witte stam', '', { d: 2, noType: true }], ['de appelboom', 'appels', '', { e: '🍎', d: 1 }], ['de perenboom', 'peren', '', { e: '🍐', d: 1 }], ['de kersenboom', 'kersen', '', { e: '🍒', d: 1 }], ['de walnootboom', 'walnoten', '', { d: 2 }], ['de pruimenboom', 'pruimen', '', { d: 2 }], ['de palmboom', 'kokosnoten of dadels', '', { e: '🌴', d: 2, noType: true }], ['de treurwilg', 'hangende takken langs het water', '', { d: 3, noType: true }]].map((r) => [r[0], r[1], '', r[3]]), { f: (k) => `Waaraan herken je ${k}?`, r: (v) => `Welke boom hoort bij: ${v}?`, t: (k, v) => `${cap(k)} heeft ${v}.`, typeMax: 18, d: 2 });
  K.facts([['de tulp', 'Nederland', 'Tulpen groeien uit bollen en horen bij Nederland.', { e: '🌷', d: 1 }], ['de zonnebloem', 'grote gele bloem die de zon volgt', '', { e: '🌻', d: 1, noType: true }], ['de roos', 'doornen', '', { e: '🌹', d: 1 }], ['de klaproos', 'rode bloem in het veld', '', { d: 3, noType: true }], ['de narcis', 'gele bloem in het voorjaar', '', { e: '🌼', d: 2, noType: true }], ['de lavendel', 'paarse bloem die lekker ruikt', '', { d: 3, noType: true }], ['de paardenbloem', 'gele bloem die verandert in een pluizenbol', '', { e: '🌼', d: 2, noType: true }], ['het madeliefje', 'klein wit bloempje in het gras', '', { d: 2, noType: true }], ['de lotus', 'waterbloem', '', { d: 3 }], ['de cactus', 'stekels en bewaart water', '', { e: '🌵', d: 1, noType: true }], ['de brandnetel', 'prikt en brandt', '', { d: 2 }], ['het viooltje', 'kleine bloem in veel kleuren', '', { d: 3, noType: true }]].map((r) => [r[0], r[1], r[2] || '', r[3]]), { f: (k) => `Waar staat ${k} om bekend?`, t: (k, v) => `${cap(k)}: ${v}.`, typeMax: 14, d: 2 });
  K.groups({ fruit: ['appel', 'peer', 'banaan', 'aardbei', 'druif', 'sinaasappel', 'kers', 'framboos', 'ananas', 'mango', 'watermeloen'], groente: ['wortel', 'spinazie', 'sla', 'komkommer', 'broccoli', 'ui', 'bloemkool', 'prei', 'radijs', 'boerenkool', 'spruitjes'] }, { which: (it) => `Is ${it} fruit of groente?`, tfq: (it, c) => `${cap(it)} is ${c === 'fruit' ? 'een fruitsoort' : 'een groente'}.`, e: { appel: '🍎', peer: '🍐', banaan: '🍌', aardbei: '🍓', druif: '🍇', sinaasappel: '🍊', kers: '🍒', ananas: '🍍', mango: '🥭', watermeloen: '🍉', wortel: '🥕', komkommer: '🥒', broccoli: '🥦', ui: '🧅' }, multi: (n) => `Welke van deze zijn ${n === 'fruit' ? 'fruit' : 'groente'}? (kies alle goede)`, reps: 4, d: 1 });
  K.mcs([
    ['Wat nemen de wortels van een plant op?', 'water en voedingsstoffen', ['licht', 'geluid', 'warmte alleen'], ''],
    ['Welke kleur is bladgroen?', 'groen', ['rood', 'geel', 'blauw'], 'Bladgroen vangt zonlicht op.'],
    ['Wat heeft een plant nodig om te groeien?', 'water, licht en lucht', ['alleen koude', 'alleen zand', 'alleen schaduw'], ''],
    ['Welk gas ademen planten in en maken ze zuurstof van (fotosynthese)?', 'koolstofdioxide (CO₂)', ['stikstof', 'helium', 'waterstof'], 'Planten nemen CO₂ op en geven zuurstof af.'],
    ['Wat geven planten aan de lucht af dat wij nodig hebben?', 'zuurstof', ['stikstof', 'rook', 'stof'], ''],
    ['Hoe heet het bovenste deel van een plant waar de bloem zit?', 'de bloem', ['de wortel', 'de steel', 'de knol'], ''],
    ['Waar zit het zaad van een appel?', 'in het klokhuis', ['in de schil', 'in de steel', 'in de wortel'], ''],
    ['Wat is een bij nodig voor een plant?', 'bestuiving', ['bladeren', 'wortels', 'sneeuw'], 'Bijen brengen stuifmeel van bloem naar bloem.'],
    ['Wat doet een bloem om een bij aan te trekken?', 'nectar maken', ['gillen', 'bijten', 'regenen'], ''],
    ['Welke bomen verliezen in de herfst hun bladeren?', 'loofbomen', ['naaldbomen', 'alle bomen', 'geen enkele boom'], ''],
    ['Welke bomen blijven het hele jaar groen?', 'naaldbomen', ['loofbomen', 'alleen de eik', 'geen enkele'], 'De meeste naaldbomen behouden hun naalden.'],
    ['Hoe weet je hoe oud een boom is?', 'door de jaarringen te tellen', ['aan de bladeren', 'aan de wortels', 'aan de kleur van de bast'], ''],
    ['Wat is een paddenstoel?', 'geen plant, maar een schimmel', ['een bloem', 'een boom', 'een dier'], ''],
    ['Welke plant eet insecten?', 'de vleesetende plant (zoals de Venusvliegenval)', ['de tulp', 'de roos', 'de eik'], ''],
    ['Waar bewaart een cactus zijn water?', 'in zijn dikke stengel', ['in zijn wortels alleen', 'in zijn doornen', 'in zijn bloem'], ''],
    ['Wat is de eerste stap als een zaadje groeit?', 'kiemen', ['bloeien', 'afvallen', 'bestuiven'], ''],
    ['Wat doen de stekels van een roos?', 'ze beschermen de plant', ['ze maken geluid', 'ze geven geur', 'ze houden bijen weg'], ''],
    ['Hoe heet het deel van een plant dat hem vasthoudt in de grond?', 'wortel', ['blad', 'bloem', 'steel'], ''],
  ]);
  K.order('Zet de groei van een plant in de goede volgorde', ['zaadje', 'kiem', 'plantje', 'bloem'], { d: 1 });
  K.order('Zet de groei van een boom in de goede volgorde', ['zaadje', 'jong boompje', 'grote boom', 'boom met vruchten'], { d: 1 });
  K.tfs([['Een tomaat is botanisch gezien een vrucht.', true], ['Planten hebben licht nodig.', true], ['Een paddenstoel is een plant.', false], ['Een cactus groeit vooral in de woestijn.', true], ['Alle bladeren zijn rood.', false]]);
  return K.out();
}

function weer() {
  const K = kit({ id: 'weer', name: 'Weer en seizoenen', emoji: '🌦️', group: 'Natuur', desc: 'Wolken, regen, onweer, seizoenen en de kringloop van het water.' });
  K.facts([['bliksem', 'een lichtflits bij onweer'], ['donder', 'het geluid dat je na de bliksem hoort'], ['hagel', 'ijskorrels die uit de lucht vallen'], ['mist', 'een wolk vlak boven de grond'], ['dauw', 'waterdruppeltjes op het gras in de ochtend'], ['vorst', 'het vriest, onder 0 graden'], ['sneeuw', 'bevroren waterdruppels die in vlokken vallen'], ['een tornado', 'een draaiende windhoos'], ['een orkaan', 'een zware tropische storm'], ['een regenboog', 'kleuren door zonlicht en regendruppels'], ['een windvlaag', 'een korte, sterke windstoot'], ['een bui', 'korte regen of hagel'], ['droogte', 'lange tijd zonder regen'], ['smog', 'vervuilde mist'], ['een hittegolf', 'meerdere warme dagen achter elkaar'], ['een storm', 'heel harde wind'], ['een plensbui', 'heel veel regen in korte tijd'], ['motregen', 'heel fijne regen']].map((r) => [r[0], r[1], '', {}]), {
    f: (k) => `Wat is ${k}?`, r: (v) => `Welk weer past bij: ${v}?`, t: (k, v) => `${cap(k)} is ${v}.`, typeMax: 0, d: 2,
  });
  K.facts([['thermometer', 'temperatuur'], ['regenmeter', 'hoeveel regen er valt'], ['windmeter (anemometer)', 'de windsnelheid'], ['barometer', 'de luchtdruk'], ['windvaan', 'de windrichting'], ['hygrometer', 'de luchtvochtigheid']].map((r) => [r[0], r[1], '', {}]), { f: (k) => `Wat meet een ${k}?`, r: (v) => `Welk instrument meet ${v}?`, typeMax: 0, d: 3, t: (k, v) => `Een ${k} meet ${v}.` });
  K.mcs([
    ['Hoeveel seizoenen heeft een jaar?', '4', ['3', '5', '6'], 'Lente, zomer, herfst en winter.'],
    ['Welk seizoen komt na de winter?', 'lente', ['zomer', 'herfst', 'winter'], ''],
    ['Welk seizoen komt na de zomer?', 'herfst', ['winter', 'lente', 'zomer'], ''],
    ['In welk seizoen vallen de bladeren van de bomen?', 'herfst', ['lente', 'zomer', 'winter'], ''],
    ['In welk seizoen komen de lammetjes (vaak)?', 'lente', ['herfst', 'winter', 'zomer'], ''],
    ['Wanneer begint de lente (ongeveer)?', '21 maart', ['21 juni', '23 september', '21 december'], ''],
    ['Wanneer begint de zomer (ongeveer)?', '21 juni', ['21 maart', '23 september', '21 december'], ''],
    ['Wanneer begint de herfst (ongeveer)?', '23 september', ['21 maart', '21 juni', '21 december'], ''],
    ['Wanneer begint de winter (ongeveer)?', '21 december', ['21 maart', '21 juni', '23 september'], ''],
    ['Waardoor zijn er seizoenen?', 'de aardas staat schuin terwijl de aarde om de zon draait', ['de maan wordt groter', 'de zon wordt kleiner', 'de wind draait'], ''],
    ['Wat zie je eerst bij onweer: bliksem of donder?', 'bliksem', ['donder', 'allebei tegelijk', 'geen van beide'], 'Licht reist sneller dan geluid.'],
    ['Waaruit bestaat een wolk?', 'kleine waterdruppeltjes of ijskristallen', ['rook', 'stof', 'gas'], ''],
    ['Hoe ontstaat een regenboog?', 'zonlicht schijnt door regendruppels', ['door wind', 'door de maan', 'door sneeuw'], ''],
    ['Hoeveel kleuren heeft een regenboog meestal (genoemd)?', '7', ['3', '5', '9'], 'Rood, oranje, geel, groen, blauw, indigo, violet.'],
    ['Hoe heet het verdampen van water door de zon?', 'verdamping', ['condensatie', 'neerslag', 'smelten'], ''],
    ['Wat is neerslag?', 'regen, sneeuw of hagel die naar beneden valt', ['wolken', 'wind', 'de zon'], ''],
    ['Bij welke temperatuur bevriest water?', '0 graden', ['10 graden', '-10 graden', '100 graden'], ''],
    ['Bij welke temperatuur kookt water?', '100 graden', ['50 graden', '0 graden', '200 graden'], ''],
    ['Welk weer is er bij een lage luchtdruk vaak?', 'regenachtig weer', ['zonnig weer', 'altijd mist', 'geen wind'], ''],
    ['Welke wolken zijn dun, hoog en wit als vederlichte sluiers?', 'cirrus (sluierwolken)', ['cumulus (stapelwolken)', 'onweerswolken', 'mistwolken'], ''],
    ['Welke wolken zien er uit als witte bloemkool?', 'cumulus (stapelwolken)', ['cirrus', 'sluierwolken', 'nevel'], ''],
    ['Wat gebeurt er met water in een wolk als het te zwaar wordt?', 'het valt als regen naar beneden', ['het wordt rook', 'het verdwijnt', 'het gaat omhoog'], ''],
    ['Welke wind waait er meestal in Nederland?', 'de zuidwestenwind', ['de noordoostenwind', 'de oostenwind', 'geen wind'], 'De zuidwestenwind brengt vaak regen van de zee.'],
  ]);
  K.order('Zet de waterkringloop in de goede volgorde', ['verdampen', 'wolken vormen', 'regen', 'water stroomt terug naar zee'], { d: 2 });
  K.order('Zet de seizoenen in volgorde, beginnend bij de lente', ['lente', 'zomer', 'herfst', 'winter'], { d: 1 });
  K.order('Zet de seizoenen in volgorde, beginnend bij de winter', ['winter', 'lente', 'zomer', 'herfst'], { d: 1 });
  K.order('Zet de regenboogkleuren in volgorde (van buiten naar binnen)', ['rood', 'oranje', 'geel', 'groen', 'blauw'], { d: 2 });
  K.tfs([['Bij 0 graden bevriest water.', true], ['Het regent altijd als het bewolkt is.', false], ['Een zonnebril helpt tegen fel zonlicht.', true], ['Sneeuw is bevroren water.', true], ['Een thermometer meet de wind.', false, 'Een thermometer meet de temperatuur.'], ['In de zomer is het in Nederland meestal warmer dan in de winter.', true], ['Hagel is hetzelfde als sneeuw.', false], ['Warme lucht stijgt op.', true]]);
  const mnd = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  mnd.forEach((m, i) => K.mc(`Welke maand komt na ${m}?`, mnd[(i + 1) % 12], mnd.filter((z, j) => j !== (i + 1) % 12 && j !== i), { d: 1 }));
  return K.out();
}

function ruimte() {
  const K = kit({ id: 'ruimte-planeten', name: 'Ruimte en planeten', emoji: '🪐', group: 'Natuur', desc: 'Zon, maan, planeten, sterren en ruimtevaart.' });
  const P = ['Mercurius', 'Venus', 'Aarde', 'Mars', 'Jupiter', 'Saturnus', 'Uranus', 'Neptunus'];
  P.forEach((p, i) => {
    K.mc(`De ${i + 1}e planeet vanaf de zon is ...`, p, P.filter((z) => z !== p), { d: i < 4 ? 1 : 2 });
    K.mc(`Welke planeet staat op plek ${i + 1} vanaf de zon?`, p, P.filter((z) => z !== p), { d: 2 });
    K.tf(`${p} is planeet nummer ${i + 1} vanaf de zon.`, true, { d: 1 });
    K.tf(`${p} is planeet nummer ${(i + 2) % 8 + 1} vanaf de zon.`, false, { d: 2, x: `${p} is nummer ${i + 1}.` });
  });
  K.order('Zet de planeten op volgorde vanaf de zon', P.slice(0, 4), { d: 1 });
  K.order('Zet de planeten op volgorde vanaf de zon', ['Mars', 'Jupiter', 'Saturnus', 'Uranus'], { d: 2 });
  K.order('Zet de planeten op volgorde vanaf de zon', ['Aarde', 'Mars', 'Jupiter', 'Neptunus'], { d: 2 });
  K.order('Zet de planeten op volgorde vanaf de zon', P.slice(0, 6), { d: 3 });
  K.facts([['Mercurius', 'de kleinste planeet'], ['Venus', 'de heetste planeet'], ['Aarde', 'de planeet waar wij wonen'], ['Mars', 'de rode planeet'], ['Jupiter', 'de grootste planeet'], ['Saturnus', 'de planeet met de bekendste ringen'], ['Uranus', 'een ijsreus die op zijn zij draait'], ['Neptunus', 'de planeet het verst van de zon']].map((r) => [r[0], r[1], '', {}]), { f: (k) => `Welke omschrijving hoort bij ${k}?`, r: (v) => `Welke planeet is ${v}?`, t: (k, v) => `${k} is ${v}.`, d: 2, type: false, typeMax: 0 });
  K.mcs([
    ['Wat is de zon?', 'een ster', ['een planeet', 'een maan', 'een komeet'], ''],
    ['Waar draait de aarde omheen?', 'de zon', ['de maan', 'Mars', 'Jupiter'], ''],
    ['Waar draait de maan omheen?', 'de aarde', ['de zon', 'Mars', 'Venus'], ''],
    ['Hoeveel planeten heeft ons zonnestelsel?', '8', ['7', '9', '10'], 'Pluto is sinds 2006 een dwergplaneet.'],
    ['Wat is Pluto tegenwoordig?', 'een dwergplaneet', ['een ster', 'een komeet', 'een maan'], ''],
    ['Hoe heet ons sterrenstelsel?', 'de Melkweg', ['de Grote Beer', 'het Zonnestelsel', 'de Andromeda alleen'], ''],
    ['Hoe lang duurt het ongeveer voor de aarde om één keer om de zon te draaien?', 'een jaar (365 dagen)', ['een dag', 'een maand', 'een week'], ''],
    ['Hoe lang duurt één draai van de aarde om haar as?', 'een dag (24 uur)', ['een jaar', 'een uur', 'een maand'], ''],
    ['Hoeveel manen heeft de aarde?', '1', ['2', '0', '3'], ''],
    ['Hoeveel manen heeft Mars?', '2', ['0', '1', '4'], 'Phobos en Deimos.'],
    ['Welke planeten hebben geen maan?', 'Mercurius en Venus', ['Mars en Jupiter', 'Aarde en Mars', 'Saturnus en Neptunus'], ''],
    ['Wie was de eerste mens op de maan?', 'Neil Armstrong', ['Yuri Gagarin', 'Buzz Lightyear', 'Louis Armstrong'], 'In 1969, met Apollo 11.'],
    ['Welk jaar landde de eerste mens op de maan?', '1969', ['1959', '1979', '1989'], ''],
    ['Wie was de eerste mens in de ruimte?', 'Yuri Gagarin', ['Neil Armstrong', 'Buzz Aldrin', 'André Kuipers'], 'In 1961.'],
    ['Welke Nederlandse astronaut werkte op het ruimtestation?', 'André Kuipers', ['Max Verstappen', 'Johan Cruijff', 'Dick Bruna'], 'André Kuipers vloog twee keer naar de ruimte.'],
    ['Wat is het ISS?', 'het internationale ruimtestation', ['een soort raket', 'een planeet', 'een telescoop op aarde'], ''],
    ['Wat is een komeet?', 'een bal van ijs en stof met een staart', ['een ster', 'een maan', 'een soort vliegtuig'], ''],
    ['Wat is een asteroïde?', 'een rotsblok in de ruimte', ['een ster', 'een planeet', 'een wolk'], ''],
    ['Waarom heeft de maan fasen?', 'omdat we steeds een ander deel van de belichte maan zien', ['omdat de maan krimpt', 'omdat de aarde de maan opeet', 'door wolken'], ''],
    ['Hoe lang duurt het ongeveer voordat de maan alle fasen heeft doorlopen?', 'een maand', ['een dag', 'een week', 'een jaar'], ''],
    ['Hoe heet het als de maan voor de zon schuift?', 'een zonsverduistering', ['een maansverduistering', 'een regenboog', 'een eclips van Mars'], ''],
    ['Hoe heet het als de aarde tussen de zon en de maan staat?', 'een maansverduistering', ['een zonsverduistering', 'een nieuwe maan', 'een komeet'], ''],
    ['Waaraan herken je de Poolster?', 'hij staat bijna altijd in het noorden', ['hij is rood', 'hij beweegt snel', 'hij staat in het zuiden'], ''],
    ['Hoe lang doet licht van de zon er ongeveer over om de aarde te bereiken?', '8 minuten', ['8 seconden', '8 uur', '8 dagen'], ''],
    ['Hoe heet het kleine voertuig dat over Mars rijdt en foto\'s maakt?', 'een marsrover', ['een ruimtebus', 'een satelliet', 'een komeet'], ''],
    ['Wat is een satelliet?', 'een voorwerp dat om de aarde draait', ['een planeet', 'een soort vuurwerk', 'een ster'], ''],
    ['Welke planeet is het dichtst bij de zon?', 'Mercurius', ['Venus', 'Mars', 'Aarde'], ''],
    ['Wat voel je minder in de ruimte?', 'zwaartekracht', ['honger', 'kou', 'tijd'], ''],
    ['Hoe heet de baan van een planeet om de zon?', 'omloopbaan', ['wolkenbaan', 'sterrenbaan', 'raketbaan'], ''],
    ['Welke planeet heeft de Grote Rode Vlek (een grote storm)?', 'Jupiter', ['Mars', 'Venus', 'Saturnus'], ''],
    ['Wat is zwaartekracht?', 'de kracht die dingen naar beneden trekt', ['de wind', 'de warmte', 'het licht'], ''],
    ['Is de zwaartekracht op de maan groter of kleiner dan op aarde?', 'kleiner', ['groter', 'precies gelijk', 'er is geen zwaartekracht'], 'Op de maan weeg je ongeveer een zesde.'],
  ]);
  K.tfs([['De zon is een planeet.', false], ['Jupiter is de grootste planeet.', true], ['Op Mars zijn mensen al geweest.', false, 'Alleen rovers en sondes zijn er geweest.'], ['De maan geeft zelf licht.', false, 'De maan weerkaatst het licht van de zon.'], ['De aarde is de derde planeet van de zon.', true], ['Sterren zijn grote bollen heet gas.', true], ['In de ruimte kun je geluid horen.', false, 'In de lege ruimte is geen lucht, dus geen geluid.'], ['Saturnus heeft ringen.', true]]);
  return K.out();
}

function aarde() {
  const K = kit({ id: 'aarde', name: 'De aarde', emoji: '🌋', group: 'Natuur', desc: 'Lagen van de aarde, vulkanen, gesteenten, water en het milieu.' });
  K.mcs([
    ['Hoe heet de buitenste laag van de aarde?', 'de korst', ['de mantel', 'de kern', 'de lucht'], ''],
    ['Hoe heet de laag onder de korst?', 'de mantel', ['de kern', 'de korst', 'de atmosfeer'], ''],
    ['Hoe heet het middelpunt van de aarde?', 'de kern', ['de korst', 'de mantel', 'de rand'], ''],
    ['Wat stroomt er uit een vulkaan?', 'lava', ['water', 'modder alleen', 'sneeuw'], ''],
    ['Hoe heet gloeiend vloeibaar gesteente onder de grond?', 'magma', ['lava', 'zand', 'klei'], 'Boven de grond heet het lava.'],
    ['Hoe noem je het trillen van de aarde?', 'een aardbeving', ['een storm', 'een vloed', 'een bui'], ''],
    ['Hoeveel procent van de aarde is ongeveer water?', 'ongeveer 70%', ['ongeveer 10%', 'ongeveer 30%', 'ongeveer 100%'], 'Ongeveer 71% van het aardoppervlak is water.'],
    ['Is het meeste water op aarde zout of zoet?', 'zout', ['zoet', 'precies de helft', 'geen water'], 'De zeeën en oceanen bevatten zout water.'],
    ['Wat zit er in de lucht dat we nodig hebben om te ademen?', 'zuurstof', ['helium', 'waterstof', 'chloor'], ''],
    ['Welk gas zit er het meeste in de lucht?', 'stikstof', ['zuurstof', 'koolstofdioxide', 'helium'], 'Ongeveer 78% is stikstof.'],
    ['Hoeveel procent zuurstof zit er ongeveer in de lucht?', '21%', ['5%', '50%', '78%'], ''],
    ['Wat beschermt ons tegen te veel zonnestralen?', 'de ozonlaag', ['de maan', 'de wolken alleen', 'de wind'], ''],
    ['Hoe heet de laag lucht rond de aarde?', 'de atmosfeer', ['de korst', 'de oceaan', 'de ruimte'], ''],
    ['Wat veroorzaakt eb en vloed?', 'de aantrekkingskracht van de maan', ['de wind', 'de zon alleen', 'vissen'], ''],
    ['Hoe vaak is er eb en vloed ongeveer per dag?', '2 keer', ['1 keer', '4 keer', '10 keer'], ''],
    ['Wat is een fossiel?', 'een versteend overblijfsel van een oud dier of plant', ['een soort vulkaan', 'een edelsteen', 'een planeet'], ''],
    ['Hoe heet het schuiven van delen van de aardkorst?', 'platentektoniek', ['erosie', 'condensatie', 'fotosynthese'], ''],
    ['Welke steen ontstaat uit afgekoeld magma?', 'stollingsgesteente (zoals basalt)', ['zandsteen', 'krijt', 'klei'], ''],
    ['Waar komt kolen vandaan?', 'van planten die miljoenen jaren geleden leefden', ['uit de zee', 'uit vulkanen', 'van sterren'], ''],
    ['Wat doet het broeikaseffect?', 'het houdt warmte vast rond de aarde', ['het koelt de aarde af', 'het maakt regen', 'het maakt zout'], ''],
    ['Wat kun je doen om afval te verminderen?', 'afval scheiden en hergebruiken', ['alles weggooien', 'verbranden in de tuin', 'in het water gooien'], ''],
    ['In welke bak gaat een glazen pot?', 'de glasbak', ['de papierbak', 'de plastic zak', 'de gft-bak'], ''],
    ['Wat is erosie?', 'het langzaam wegslijten van gesteente door wind en water', ['het groeien van een berg', 'een soort storm', 'een vulkaanuitbarsting'], ''],
    ['Wat is een delta?', 'waar een rivier in zee stroomt en zich vertakt', ['een berg', 'een woestijn', 'een soort vulkaan'], ''],
    ['Wat is een oase?', 'een plek met water in de woestijn', ['een berg in de sneeuw', 'een zeedier', 'een soort zand'], ''],
    ['Wat is een gletsjer?', 'een rivier van ijs', ['een meer van lava', 'een zandstorm', 'een soort wolk'], ''],
    ['Wat is een eiland?', 'land dat helemaal door water omringd is', ['een berg met sneeuw', 'een zeedier', 'een soort woestijn'], ''],
    ['Wat is een schiereiland?', 'land dat bijna helemaal door water omringd is', ['een eiland zonder zand', 'een meer', 'een berg'], ''],
    ['Wat is een baai?', 'een stuk zee dat in het land steekt', ['een berg', 'een soort rivier', 'een eiland'], ''],
    ['Wat is een dal?', 'laag land tussen bergen of heuvels', ['de top van een berg', 'een soort grot', 'een meer'], ''],
    ['Hoe heet het hoogste punt van een berg?', 'de top', ['de voet', 'de helling', 'het dal'], ''],
    ['Wat is zandsteen gemaakt van?', 'samengeperst zand', ['gesmolten glas', 'ijs', 'klei en water alleen'], ''],
    ['Welke zijn edelstenen?', 'diamant en robijn', ['zand en klei', 'krijt en kalk', 'steenkool en turf'], ''],
    ['Welke woestijn is de grootste ter wereld, ook al is het er ijskoud?', 'Antarctica', ['de Sahara', 'de Gobi', 'de Kalahari'], 'Antarctica is een koude woestijn: er valt heel weinig neerslag.'],
    ['Hoe lang duurt een dag op aarde?', '24 uur', ['12 uur', '48 uur', '7 dagen'], ''],
    ['Waardoor hebben we dag en nacht?', 'de aarde draait om haar as', ['de zon draait om de aarde', 'de maan verdwijnt', 'wolken'], ''],
  ]);
  K.facts([['aardolie', 'olie uit de grond'], ['aardgas', 'gas uit de grond'], ['steenkool', 'brandstof uit de grond'], ['zand', 'verweerd gesteente'], ['klei', 'fijne grond voor potten en bakstenen'], ['turf', 'gedroogd veen om te stoken'], ['krijt', 'zachte witte kalksteen'], ['graniet', 'harde steensoort'], ['kalksteen', 'steen van oude schelpen'], ['lava', 'gesmolten gesteente uit een vulkaan']].map((r) => [r[0], r[1], '', {}]), { f: (k) => `Wat is ${k}?`, r: (v) => `Welke stof of steen is dit: ${v}?`, t: (k, v) => `${cap(k)} is ${v}.`, typeMax: 0, d: 2, type: false });
  K.tfs([['Vulkanen zijn bergen waaruit lava kan komen.', true], ['De aarde heeft drie lagen: korst, mantel en kern.', true], ['De ozonlaag ligt onder de grond.', false], ['Een aardbeving ontstaat in de lucht.', false], ['De aarde is rond (bijna een bol).', true], ['Zoet water is makkelijker te drinken dan zout water.', true], ['Antarctica is het koudste werelddeel.', true], ['Een gletsjer is een rivier van ijs.', true], ['Alle planten leven in de woestijn.', false], ['Glas kan eindeloos gerecycled worden.', true]]);
  K.order('Zet de lagen van de aarde van buiten naar binnen', ['korst', 'mantel', 'buitenkern', 'binnenkern'], { d: 2 });
  K.num('Ongeveer hoeveel procent van de lucht is zuurstof?', 21, { d: 3, tol: 1 });
  K.fill('De buitenste laag van de aarde heet de ___.', 'korst', ['korst', 'mantel', 'kern', 'lava'], { d: 1 });
  K.type('Hoe heet het gesmolten gesteente dat uit een vulkaan stroomt?', 'lava', [], { d: 1 });
  K.fill('Een berg die lava kan spuwen, heet een ___.', 'vulkaan', ['vulkaan', 'gletsjer', 'oase', 'delta'], { d: 1 });
  return K.out();
}

function dino() {
  const K = kit({ id: 'dinosaurussen', name: 'Dinosaurussen', emoji: '🦖', group: 'Natuur', desc: 'T-rex, Triceratops en andere reuzen uit lang vervlogen tijden.' });
  K.facts([['Tyrannosaurus rex', 'een groot roofdier met kleine armen', '', { e: '🦖', d: 1 }], ['Triceratops', 'drie hoorns en een kraag', '', { d: 1 }], ['Stegosaurus', 'platen op de rug en stekels aan de staart', '', { d: 1 }], ['Brachiosaurus', 'een heel lange nek', '', { e: '🦕', d: 1 }], ['Velociraptor', 'klein, snel en vleesetend', '', { d: 2 }], ['Ankylosaurus', 'een pantser en een knots aan de staart', '', { d: 2 }], ['Spinosaurus', 'een groot zeil op de rug', '', { d: 3 }], ['Diplodocus', 'een lange nek en een lange zweepstaart', '', { d: 3 }], ['Iguanodon', 'een duimstekel en liep op twee of vier poten', '', { d: 3 }], ['Parasaurolophus', 'een lange holle kuif als een trompet', '', { d: 3 }], ['Allosaurus', 'een groot roofdier uit het Jura', '', { d: 3 }], ['Pachycephalosaurus', 'een dikke harde schedel', '', { d: 3 }]].map((r) => [r[0], r[1], '', r[3]]), { f: (k) => `Waaraan herken je de ${k}?`, r: (v) => `Welke dinosaurus had ${v}?`, t: (k, v) => `De ${k} had ${v}.`, typeMax: 0, d: 2, type: false });
  K.facts([['Tyrannosaurus rex', 'vleeseter'], ['Triceratops', 'planteneter'], ['Stegosaurus', 'planteneter'], ['Brachiosaurus', 'planteneter'], ['Velociraptor', 'vleeseter'], ['Ankylosaurus', 'planteneter'], ['Spinosaurus', 'vleeseter'], ['Diplodocus', 'planteneter'], ['Allosaurus', 'vleeseter'], ['Iguanodon', 'planteneter']].map((r) => [r[0], r[1], '', { e: '🦕' }]), { f: (k) => `Was de ${k} een planteneter of een vleeseter?`, t: (k, v) => `De ${k} was een ${v}.`, pool: ['planteneter', 'vleeseter', 'alleseter'], type: false, d: 2 });
  K.mcs([
    ['Wanneer stierven de meeste dinosaurussen uit?', 'ongeveer 66 miljoen jaar geleden', ['ongeveer 66 jaar geleden', 'ongeveer 6.000 jaar geleden', 'ongeveer 1 miljoen jaar geleden'], ''],
    ['Wat is de belangrijkste verklaring voor het uitsterven?', 'een grote meteoriet raakte de aarde', ['te veel sneeuw', 'mensen jaagden op ze', 'een grote overstroming alleen'], ''],
    ['Leefden mensen en dinosaurussen tegelijk?', 'nee', ['ja', 'alleen in Afrika', 'alleen in Azië'], 'Dinosaurussen stierven miljoenen jaren voor de mens uit.'],
    ['Hoe weten we dat dinosaurussen bestonden?', 'door fossielen', ['door filmpjes', 'door verhalen alleen', 'door tekeningen van mensen'], ''],
    ['Hoe heet iemand die fossielen onderzoekt?', 'paleontoloog', ['bioloog', 'astronoom', 'geoloog alleen'], ''],
    ['Van welke dieren stammen vogels af?', 'dinosaurussen', ['vissen', 'insecten', 'zoogdieren'], ''],
    ['Hoe heet het tijdperk van de dinosaurussen?', 'het Mesozoïcum', ['de Ijstijd', 'het Mammoettijdperk', 'de Steentijd'], 'Het Mesozoïcum bestond uit Trias, Jura en Krijt.'],
    ['Welke drie tijdvakken bevatte het tijdperk van de dinosaurussen?', 'Trias, Jura en Krijt', ['Steen, Brons en IJzer', 'Lente, Zomer en Herfst', 'Oud, Middel en Nieuw'], ''],
    ['Wat is een Pterosaurus (zoals Pteranodon)?', 'een vliegend reptiel, geen dinosaurus', ['een soort dinosaurus', 'een vogel', 'een zoogdier'], ''],
    ['Was de Mosasaurus een dinosaurus?', 'nee, een zeereptiel', ['ja', 'ja, een vliegende', 'ja, een kleine'], ''],
    ['Wat is een mammoet?', 'een harig zoogdier uit de ijstijd, familie van de olifant', ['een dinosaurus', 'een vis', 'een soort slak'], ''],
    ['Hoe kwamen jonge dinosaurussen op de wereld?', 'ze kwamen uit eieren', ['ze werden levend geboren', 'ze groeiden uit zaadjes', 'ze kwamen uit sneeuw'], ''],
    ['Wat is een fossiel dat vaak gevonden wordt?', 'een versteend bot of tand', ['een versteend ijsje', 'een versteend brood', 'een versteende wolk'], ''],
    ['Welke dinosaurus had drie hoorns?', 'Triceratops', ['Stegosaurus', 'Brachiosaurus', 'Velociraptor'], ''],
    ['Welke dinosaurus had platen op de rug?', 'Stegosaurus', ['Triceratops', 'Brachiosaurus', 'Spinosaurus'], ''],
    ['Welke dinosaurus had een heel lange nek en at planten?', 'Brachiosaurus', ['Tyrannosaurus', 'Velociraptor', 'Triceratops'], ''],
  ]);
  K.tfs([['Dinosaurussen leefden miljoenen jaren geleden.', true], ['Een Tyrannosaurus rex at planten.', false, 'De T-rex was een vleeseter.'], ['Vogels stammen af van dinosaurussen.', true], ['Alle dinosaurussen waren enorm groot.', false, 'Sommige waren zo klein als een kip.'], ['Mensen en dinosaurussen leefden samen.', false], ['Fossielen zijn versteende resten.', true], ['Brachiosaurus had een korte nek.', false], ['Dinosaurussen legden eieren.', true], ['Een Pteranodon was een dinosaurus.', false, 'Het was een vliegend reptiel.'], ['De Triceratops had drie hoorns.', true]]);
  K.order('Zet de tijdvakken van de dinosaurussen op volgorde (oud naar jong)', ['Trias', 'Jura', 'Krijt'], { d: 3 });
  K.num('Hoeveel miljoen jaar geleden stierven de meeste dinosaurussen uit?', 66, { d: 3, tol: 2 });
  K.type('Welke dinosaurus had drie hoorns op zijn kop?', 'Triceratops', [], { d: 2 });
  K.fill('De Tyrannosaurus rex was een ___.', 'vleeseter', ['vleeseter', 'planteneter', 'alleseter', 'insecteneter'], { d: 1 });
  K.fill('Versteende resten van oude dieren heten ___.', 'fossielen', ['fossielen', 'edelstenen', 'vulkanen', 'kristallen'], { d: 2 });
  return K.out();
}

function oceaan() {
  const K = kit({ id: 'oceaan', name: 'Oceaan en zeedieren', emoji: '🐠', group: 'Natuur', desc: 'Walvissen, haaien, koraalrif en alles wat in zee leeft.' });
  K.facts([['de blauwe vinvis', 'het grootste dier ter wereld'], ['de octopus', 'heeft acht armen en drie harten'], ['de zeepaardje', 'het mannetje draagt de eitjes'], ['de dolfijn', 'een slim zoogdier dat klikt en fluit'], ['de haai', 'een vis met een skelet van kraakbeen'], ['de zeester', 'heeft meestal vijf armen'], ['de kwal', 'heeft een lijf dat vooral uit water bestaat'], ['de zeeschildpad', 'legt haar eieren op het strand'], ['de inktvis', 'spuit inkt als hij bang is'], ['de clownvis', 'woont tussen de tentakels van een anemoon'], ['de orka', 'een tandwalvis die in groepen jaagt'], ['de zeekoe (lamantijn)', 'een rustige planteneter in warm water'], ['de narwal', 'heeft een lange slagtand als een hoorn'], ['de pijlstaartrog', 'heeft een lange giftige angel in de staart']].map((r) => [r[0].replace('de zeepaardje', 'het zeepaardje').replace('de pijlstaartrog', 'de pijlstaartrog'), r[1], '', {}]), { f: (k) => `Wat is bijzonder aan ${k}?`, r: (v) => `Welk zeedier is dit: ${v}?`, t: (k, v) => `${cap(k)}: ${v}.`, typeMax: 0, type: false, d: 2 });
  K.mcs([
    ['Wat is het grootste dier ter wereld?', 'de blauwe vinvis', ['de olifant', 'de haai', 'de orka'], ''],
    ['Wat is een koraalrif?', 'een rif gebouwd door kleine koraaldiertjes', ['een rots van ijs', 'een zandbank', 'een plant'], ''],
    ['Waar ademt een walvis mee?', 'met longen', ['met kieuwen', 'met zijn huid', 'met zijn vinnen'], ''],
    ['Hoe heet het gat boven op de kop van een walvis?', 'het blaasgat', ['het kieuwgat', 'de snuit', 'het oog'], ''],
    ['Wat is plankton?', 'piepkleine plantjes en diertjes in het water', ['grote vissen', 'een soort kwal', 'een zeewier'], ''],
    ['Welke vis is een dier met een uitstekende neus als een zaag?', 'de zaagvis', ['de zalm', 'de kabeljauw', 'de tonijn'], ''],
    ['Wat is de diepste plek in de oceaan?', 'de Marianentrog', ['het Grote Barrièrerif', 'de Noordzee', 'het Panamakanaal'], 'Die is ongeveer 11 kilometer diep.'],
    ['Hoeveel armen heeft een octopus?', '8', ['6', '10', '4'], ''],
    ['Hoeveel harten heeft een octopus?', '3', ['1', '2', '4'], ''],
    ['Welk zeedier heeft een harde schaal en scharen?', 'de krab', ['de kwal', 'de zeester', 'de dolfijn'], ''],
    ['Wat is zeewier?', 'een plant die in zee groeit', ['een zeedier', 'een soort zand', 'een steen'], ''],
    ['Wat eten zeehonden vooral?', 'vis', ['gras', 'zeewier alleen', 'insecten'], ''],
    ['Welk dier is geen vis: haai, walvis, zalm of tonijn?', 'walvis', ['haai', 'zalm', 'tonijn'], 'Een walvis is een zoogdier.'],
    ['Wat is een zeemeermin?', 'een verzonnen wezen uit verhalen', ['een echte vis', 'een zeehond', 'een schelpdier'], ''],
    ['Welk dier maakt parels?', 'de oester', ['de krab', 'de zeester', 'de kwal'], ''],
    ['Wat gebeurt er met het water bij eb?', 'het zakt', ['het stijgt', 'het bevriest', 'het wordt zoet'], ''],
    ['Wat gebeurt er met het water bij vloed?', 'het stijgt', ['het zakt', 'het bevriest', 'het verdampt'], ''],
    ['Waarom is zeewater zout?', 'er zijn zouten uit gesteenten in opgelost', ['er is zout in gegooid', 'door de vissen', 'door de zon'], ''],
    ['Wat is een zeekoe?', 'een zachtaardig zeezoogdier dat planten eet', ['een koe op het strand', 'een grote vis', 'een zeehond'], ''],
    ['Wat is een Waddenzee?', 'een ondiepe zee met wad dat droogvalt bij eb', ['een zee in Afrika', 'een zee zonder zout', 'een meer in Zwitserland'], ''],
  ]);
  K.tfs([['Een dolfijn is een vis.', false, 'Een dolfijn is een zoogdier.'], ['Een zeepaardje is een vis.', true], ['Een kwal heeft geen botten.', true], ['Een haai heeft een skelet van kraakbeen.', true], ['De Noordzee is zoet water.', false], ['Een zeester heeft meestal vijf armen.', true], ['Een walvis is een vis.', false], ['Een octopus heeft acht armen.', true], ['Een krab loopt zijwaarts.', true], ['Koraal is een plant.', false, 'Koraal bestaat uit kleine dieren.']]);
  K.num('Hoeveel armen heeft een octopus?', 8, { d: 1 });
  K.num('Hoeveel harten heeft een octopus?', 3, { d: 3 });
  K.type('Welk dier is het grootste dier ter wereld? (een walvis)', 'blauwe vinvis', ['vinvis', 'de blauwe vinvis'], { d: 2 });
  K.fill('Een dolfijn is geen vis maar een ___.', 'zoogdier', ['zoogdier', 'reptiel', 'insect', 'weekdier'], { d: 2 });
  K.fill('Bij ___ zakt het water in zee.', 'eb', ['eb', 'vloed', 'storm', 'ijs'], { d: 1 });
  K.order('Zet de zeedieren van klein naar groot (ongeveer)', ['garnaal', 'goudvis', 'dolfijn', 'blauwe vinvis'], { d: 2 });
  return K.out();
}

function insecten() {
  const K = kit({ id: 'insecten', name: 'Insecten en kriebelbeestjes', emoji: '🐝', group: 'Natuur', desc: 'Bijen, mieren, vlinders en andere kleine beestjes.' });
  K.facts([['de bij', 'maakt honing', '', { e: '🐝', d: 1 }], ['de mier', 'leeft in een kolonie met een koningin', '', { e: '🐜', d: 1 }], ['de vlinder', 'was eerst een rups', '', { e: '🦋', d: 1 }], ['het lieveheersbeestje', 'eet bladluizen', '', { e: '🐞', d: 2 }], ['de libelle', 'heeft grote vleugels en leeft bij water', '', { d: 2 }], ['de sprinkhaan', 'kan ver springen', '', { e: '🦗', d: 2 }], ['de mug', 'prikt mensen en dieren voor bloed', '', { e: '🦟', d: 1 }], ['de hommel', 'is een harige bij', '', { d: 2 }], ['de wesp', 'heeft een gele en zwarte streep', '', { d: 1 }], ['het vuurvliegje', 'maakt zijn eigen licht', '', { d: 3 }], ['de mestkever', 'rolt ballen van mest', '', { e: '🪲', d: 3 }], ['de termiet', 'bouwt grote burchten', '', { d: 3 }], ['de rups', 'eet veel bladeren', '', { e: '🐛', d: 1 }], ['de kakkerlak', 'leeft vaak in warme huizen', '', { e: '🪳', d: 3 }], ['de cicade', 'maakt een luid gezang', '', { d: 3 }]].map((r) => [r[0], r[1], '', r[3]]), { f: (k) => `Wat weet je van ${k}?`, r: (v) => `Welk beestje ${v}?`, t: (k, v) => `${cap(k)} ${v}.`, typeMax: 0, type: false, d: 2 });
  K.mcs([
    ['Hoeveel poten heeft een insect?', '6', ['4', '8', '10'], ''],
    ['Hoeveel lichaamsdelen heeft een insect?', '3', ['2', '4', '5'], 'Kop, borststuk en achterlijf.'],
    ['Waar zitten de voelsprieten van een insect?', 'op de kop', ['op de poten', 'op de vleugels', 'in de buik'], ''],
    ['Hoe heet het stadium na het ei bij een vlinder?', 'rups', ['pop', 'larve van een mier', 'vlinder'], ''],
    ['Hoe heet het stadium tussen rups en vlinder?', 'pop', ['ei', 'larve', 'kever'], ''],
    ['Wat doet een bij als ze een bloem bezoekt?', 'ze verzamelt nectar en stuifmeel', ['ze eet de bloem op', 'ze maakt een nest', 'ze slaapt'], ''],
    ['Hoe heet de baas in een bijenvolk?', 'de koningin', ['de koning', 'de keizer', 'de werkster'], ''],
    ['Hoe heet het huis van bijen?', 'korf of bijenkast', ['hol', 'burcht', 'stal'], ''],
    ['Wat zijn werksters?', 'bijen of mieren die het werk doen', ['grote kevers', 'vlinders', 'bloemen'], ''],
    ['Wat is een spin?', 'geen insect, maar een spinachtige', ['een insect', 'een vlinder', 'een kever'], ''],
    ['Hoeveel poten heeft een spin?', '8', ['6', '4', '10'], ''],
    ['Waarmee vangt een spin zijn prooi?', 'met een web', ['met een lasso', 'met vleugels', 'met een staart'], ''],
    ['Waarom is een lieveheersbeestje nuttig?', 'het eet bladluizen', ['het maakt honing', 'het eet bladeren', 'het steekt'], ''],
    ['Welk insect kan 20 keer zijn eigen gewicht tillen (en meer)?', 'de mier', ['de bij', 'de vlinder', 'de libelle'], ''],
    ['Hoe heet het geluid van een bij?', 'gezoem', ['gebrul', 'gekraai', 'geblaf'], ''],
    ['Welk insect laat een sprinkhaan springen?', 'zijn lange achterpoten', ['zijn vleugels', 'zijn voelsprieten', 'zijn kop'], ''],
    ['Welke insecten kunnen steken?', 'bijen en wespen', ['vlinders', 'lieveheersbeestjes', 'kevers die graven'], ''],
    ['Wat gebeurt er met een rups als hij vol is?', 'hij verandert in een pop', ['hij vliegt weg', 'hij wordt een kever', 'hij verdwijnt'], ''],
    ['Wat maakt een rups om zich in te verstoppen?', 'een cocon', ['een nest', 'een hol', 'een web'], 'Sommige rupsen spinnen een cocon, anderen worden een naakte pop.'],
    ['Waarmee proeven vlinders voedsel?', 'met hun voeten', ['met hun vleugels', 'met hun ogen', 'met hun staart'], ''],
    ['Wat is een larve?', 'het jonge stadium van een insect', ['een volwassen insect', 'een ei', 'een vleugel'], ''],
  ]);
  K.order('Zet de levenscyclus van een vlinder in volgorde', ['ei', 'rups', 'pop', 'vlinder'], { d: 1 });
  K.order('Zet in volgorde: de ontwikkeling van een bij', ['ei', 'larve', 'pop', 'volwassen bij'], { d: 2 });
  K.groups({ insect: ['bij', 'mier', 'vlinder', 'kever', 'libelle', 'sprinkhaan', 'mug', 'wesp'], 'geen insect': ['spin', 'slak', 'regenworm', 'schorpioen', 'duizendpoot', 'pad'] }, { which: (it) => `Is een ${it} een insect?`, names: ['insect', 'geen insect'], tfq: (it, c) => `Een ${it} is ${c === 'insect' ? '' : 'geen '}insect.`.replace('is insect', 'is een insect'), multi: (n) => (n === 'insect' ? 'Welke zijn insecten? (kies alle goede)' : 'Welke zijn GEEN insecten? (kies alle goede)'), reps: 5, d: 2 });
  K.tfs([['Een mier heeft zes poten.', true], ['Een spin is een insect.', false], ['Een vlinder is eerst een rups.', true], ['Bijen maken honing.', true], ['Alle insecten kunnen vliegen.', false], ['Een lieveheersbeestje is een kever.', true], ['Insecten hebben een skelet aan de buitenkant.', true], ['Een libelle heeft vier vleugels.', true]]);
  return K.out();
}

function energie() {
  const K = kit({ id: 'energie', name: 'Energie en stroom', emoji: '⚡', group: 'Natuur', desc: 'Zon, wind, water, stroom en energie besparen.' });
  K.facts([['zonne-energie', 'hernieuwbaar', '', { d: 1 }], ['windenergie', 'hernieuwbaar', '', { d: 1 }], ['waterkracht', 'hernieuwbaar', '', { d: 2 }], ['aardwarmte', 'hernieuwbaar', '', { d: 3 }], ['biomassa (hout, plantaardig afval)', 'hernieuwbaar', '', { d: 3 }], ['steenkool', 'fossiel', '', { d: 2 }], ['aardolie', 'fossiel', '', { d: 2 }], ['aardgas', 'fossiel', '', { d: 2 }], ['uranium (kerncentrale)', 'kernenergie', '', { d: 3 }]].map((r) => [r[0], r[1], r[0].startsWith('aardolie') ? 'Fossiele brandstoffen raken op en vervuilen de lucht.' : '', r[3]]), { f: (k) => `Is ${k} hernieuwbaar, fossiel of kernenergie?`, t: (k, v) => `${cap(k)} is ${v === 'kernenergie' ? 'een bron voor kernenergie' : v}.`, pool: ['hernieuwbaar', 'fossiel', 'kernenergie'], type: false, d: 2 });
  K.groups({ hernieuwbaar: ['zon', 'wind', 'water (stroming)', 'aardwarmte', 'hout (nieuw)'], fossiel: ['kolen', 'olie', 'aardgas'] }, { tfq: (it, c) => `Energie uit ${it} is ${c}.`, which: (it) => `Is energie uit ${it} hernieuwbaar of fossiel?`, names: ['hernieuwbaar', 'fossiel'], multi: (n) => `Welke zijn ${n}? (kies alle goede)`, reps: 3, d: 2 });
  K.mcs([
    ['Wat maakt een windmolen?', 'elektriciteit uit wind', ['wind uit stroom', 'warmte uit water', 'regen'], ''],
    ['Wat maakt een zonnepaneel?', 'elektriciteit uit zonlicht', ['wind', 'regen', 'kolen'], ''],
    ['Wat gebeurt er in een stroomdraad?', 'elektrische lading stroomt', ['water stroomt', 'lucht stroomt', 'licht reist als een rups'], ''],
    ['Wat zit er in de meeste batterijen?', 'opgeslagen energie', ['water', 'lucht', 'zand'], ''],
    ['Welke lamp gebruikt het minst stroom?', 'de ledlamp', ['de gloeilamp', 'de halogeenlamp', 'de kaars'], ''],
    ['Wat is een stopcontact?', 'een plek om een stekker in te steken voor stroom', ['een plek voor water', 'een soort lamp', 'een soort schakelaar'], ''],
    ['Waarom is een stopcontact gevaarlijk om aan te raken?', 'je kunt een schok krijgen', ['het is koud', 'het bijt', 'het is te zwaar'], 'Stop nooit iets in een stopcontact.'],
    ['Welk materiaal geleidt stroom goed?', 'metaal (zoals koper)', ['rubber', 'plastic', 'hout'], ''],
    ['Welk materiaal geleidt stroom NIET (isolator)?', 'rubber', ['koper', 'ijzer', 'zilver'], ''],
    ['Wat is een stroomkring?', 'een gesloten pad waar stroom doorheen kan', ['een soort lamp', 'een zwembad', 'een elektrische auto'], ''],
    ['Wat doet een schakelaar?', 'de stroomkring aan- en uitzetten', ['stroom maken', 'licht geven', 'warmte vasthouden'], ''],
    ['Wat is een dynamo op een fiets?', 'iets dat stroom maakt door te draaien', ['een soort rem', 'een soort lamp', 'een soort bel'], ''],
    ['Waarvoor gebruik je energie in huis?', 'verwarming, licht en apparaten', ['alleen voor snoep', 'alleen voor kleding', 'alleen voor planten'], ''],
    ['Wat kun je doen om energie te besparen?', 'lichten uitdoen als je weggaat', ['alle lampen laten branden', 'de kachel hoog laten staan', 'ramen openzetten bij kou'], ''],
    ['Welke energievorm geeft de zon?', 'licht en warmte', ['alleen geluid', 'alleen kou', 'alleen wind'], ''],
    ['Welke eenheid wordt gebruikt voor elektriciteitsverbruik?', 'kilowattuur (kWh)', ['kilometer', 'liter', 'gram'], ''],
    ['Wat is een brandstof?', 'iets dat je kunt verbranden voor warmte of kracht', ['een soort water', 'een soort metaal', 'een soort lamp'], ''],
    ['Welke auto rijdt op stroom?', 'een elektrische auto', ['een dieselauto', 'een benzineauto', 'een stoomtrein'], ''],
    ['Wat is een kerncentrale?', 'een centrale die stroom maakt met splijting van atomen', ['een centrale met wind', 'een centrale met water', 'een centrale met kolen'], ''],
    ['Waarom is hernieuwbare energie beter voor het klimaat?', 'het veroorzaakt weinig CO₂', ['het is altijd goedkoop', 'het maakt meer rook', 'het werkt alleen \'s nachts'], ''],
  ]);
  K.tfs([['Zonnepanelen werken alleen als het donker is.', false], ['Wind is een bron van hernieuwbare energie.', true], ['Een ledlamp gebruikt meer stroom dan een gloeilamp.', false], ['Aardgas is een fossiele brandstof.', true], ['Rubber is een isolator.', true], ['Een batterij bevat opgeslagen energie.', true], ['Metaal geleidt stroom.', true], ['Stop een vork nooit in een stopcontact.', true]]);
  K.mcs([
    ['Wat gebeurt er als je een lamp aanzet?', 'er loopt stroom door de lamp', ['de lamp gaat uit', 'er gebeurt niets', 'de stroom verdwijnt'], ''],
    ['Welke energie heb je nodig om te rennen?', 'energie uit je eten', ['energie van wind', 'energie van water', 'geen energie'], ''],
    ['Wat is een energiebron die nooit op raakt?', 'zonlicht', ['steenkool', 'aardolie', 'aardgas'], 'Zon en wind blijven komen, kolen en olie raken een keer op.'],
    ['Hoe heet het apparaat op een dak dat zonlicht in stroom omzet?', 'zonnepaneel', ['windmolen', 'dynamo', 'kachel'], ''],
    ['Waarom heten kolen, olie en gas "fossiele brandstoffen"?', 'ze zijn miljoenen jaren geleden uit planten en dieren ontstaan', ['ze zijn gemaakt van stenen', 'ze zijn nieuw', 'ze komen uit de zon'], ''],
    ['Waar kun je thuis energie besparen?', 'een kortere douche nemen', ['langer douchen', 'alle lichten aanlaten', 'ramen openzetten bij kou'], ''],
    ['Wat is een duurzame energiebron?', 'een bron die niet op raakt', ['een bron die snel op raakt', 'een heel dure bron', 'een bron die vervuilt'], ''],
    ['Waar komt waterkracht vandaan?', 'van stromend of vallend water', ['van wind', 'van de zon', 'van kolen'], ''],
  ]);
  return K.out();
}

function materialen() {
  const K = kit({ id: 'materialen', name: 'Materialen en eigenschappen', emoji: '🧱', group: 'Natuur', desc: 'Hout, glas, metaal, plastic: waar is het van gemaakt en wat kan het?' });
  K.facts([['een vensterruit', 'glas'], ['een stoel (traditioneel)', 'hout'], ['een fietsframe', 'metaal'], ['een regenjas', 'plastic of rubber'], ['een trui', 'wol'], ['een T-shirt', 'katoen'], ['een muur van een huis', 'steen'], ['een schoen (leer)', 'leer'], ['een boek', 'papier'], ['een band van een auto', 'rubber'], ['een pot voor planten', 'klei'], ['een fles water', 'plastic'], ['een zakmes', 'metaal'], ['een schaar', 'metaal'], ['een emmer', 'plastic'], ['een kaars', 'was'], ['een spiegel', 'glas'], ['een munt', 'metaal']].map((r) => [r[0], r[1], '', {}]), { f: (k) => `Waar is ${k} van gemaakt?`, t: (k, v) => `${cap(k)} is gemaakt van ${v}.`, pool: ['glas', 'hout', 'metaal', 'plastic of rubber', 'wol', 'katoen', 'steen', 'leer', 'papier', 'rubber', 'klei', 'plastic', 'was'], type: false, d: 1 });
  K.facts([['glas', 'doorzichtig'], ['hout', 'drijft op water'], ['metaal', 'geleidt stroom en warmte'], ['rubber', 'is rekbaar en isoleert stroom'], ['steen', 'is hard en zwaar'], ['papier', 'wordt gemaakt van hout'], ['katoen', 'komt van een plant'], ['wol', 'komt van schapen'], ['zijde', 'wordt gemaakt door zijderupsen'], ['plastic', 'wordt gemaakt van aardolie'], ['leer', 'komt van dierenhuiden'], ['ijzer', 'wordt door een magneet aangetrokken'], ['aluminium', 'is licht van gewicht'], ['spons', 'neemt water op'], ['koper', 'geleidt stroom heel goed']].map((r) => [r[0], r[1], '', {}]), { f: (k) => `Wat klopt er van ${k}?`, r: (v) => `Welk materiaal ${v}?`, t: (k, v) => `${cap(k)} ${v}.`, type: false, typeMax: 0, d: 2 });
  K.mcs([
    ['Wat gebeurt er met ijs bij warm weer?', 'het smelt', ['het kookt', 'het verdampt meteen', 'het wordt zwaarder'], ''],
    ['Bij welke temperatuur smelt ijs?', '0 graden', ['10 graden', '50 graden', '100 graden'], ''],
    ['Bij welke temperatuur kookt water?', '100 graden', ['0 graden', '50 graden', '200 graden'], ''],
    ['Hoe heet het als water in damp verandert?', 'verdampen', ['smelten', 'stollen', 'bevriezen'], ''],
    ['Hoe heet het als water vast wordt?', 'bevriezen', ['smelten', 'verdampen', 'koken'], ''],
    ['Hoe heet het als damp weer water wordt?', 'condenseren', ['verdampen', 'smelten', 'bevriezen'], ''],
    ['In welke drie toestanden komt een stof voor?', 'vast, vloeibaar en gas', ['warm, koud en lauw', 'zacht, hard en stevig', 'zwaar, licht en middel'], ''],
    ['Welke stof is een gas?', 'waterdamp', ['zout', 'hout', 'ijs'], ''],
    ['Wat gebeurt er met suiker in water?', 'het lost op', ['het drijft', 'het zinkt als steen en blijft', 'het kookt'], ''],
    ['Wat is een mengsel?', 'twee of meer stoffen door elkaar', ['een soort steen', 'een soort water', 'een soort gas'], ''],
    ['Wat trekt een magneet aan?', 'ijzer', ['hout', 'plastic', 'papier'], ''],
    ['Wat doet een magneet met hout?', 'niets', ['hij trekt het aan', 'hij duwt het weg', 'hij smelt het'], ''],
    ['Welk materiaal is doorzichtig?', 'glas', ['hout', 'steen', 'metaal'], ''],
    ['Welk materiaal zinkt in water?', 'een steen', ['een kurk', 'een houten plank', 'een lege plastic fles met dop'], ''],
    ['Welk materiaal drijft in water?', 'een kurk', ['een steen', 'een munt', 'een sleutel'], ''],
    ['Wat is recycling?', 'materiaal opnieuw gebruiken', ['materiaal weggooien', 'materiaal verbranden', 'materiaal begraven'], ''],
    ['Welk materiaal wordt gemaakt van gesmolten zand?', 'glas', ['plastic', 'staal', 'papier'], ''],
    ['Welk materiaal is van boomhout gemaakt?', 'papier', ['glas', 'plastic', 'metaal'], ''],
    ['Welk materiaal is zacht en warm om aan te trekken in de winter?', 'wol', ['glas', 'steen', 'metaal'], ''],
    ['Wat is staal?', 'een sterke legering van ijzer', ['een soort steen', 'een soort plastic', 'een soort hout'], ''],
  ]);
  K.tfs([['Glas is doorzichtig.', true], ['Een magneet trekt aluminium aan.', false, 'Alleen ijzer, nikkel en kobalt worden aangetrokken.'], ['Hout kan drijven.', true], ['Plastic wordt gemaakt van aardolie.', true], ['Een steen drijft op water.', false], ['Wol komt van schapen.', true], ['Metaal geleidt stroom.', true], ['IJs is water in vaste vorm.', true], ['Zout lost niet op in water.', false], ['Papier kan gerecycled worden.', true]]);
  K.num('Bij hoeveel graden Celsius kookt water?', 100, { d: 1 });
  K.num('Bij hoeveel graden Celsius smelt ijs?', 0, { d: 1 });
  K.order('Zet in volgorde als je ijs steeds meer verwarmt', ['ijs', 'water', 'waterdamp'], { d: 1 });
  K.fill('Als water bevriest, wordt het ___.', 'ijs', ['ijs', 'damp', 'zout', 'stoom'], { d: 1 });
  K.type('Welk metaal wordt door een magneet aangetrokken?', 'ijzer', [], { d: 2 });
  return K.out();
}

export const builders = [geluiden, klassen, jongen, eten, leefgebied, planten, weer, ruimte, aarde, dino, oceaan, insecten, energie, materialen];
