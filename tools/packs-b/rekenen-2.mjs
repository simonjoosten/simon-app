// Rekenpacks deel 2: breuken, procenten, meten, meetkunde, getallenrijen, verhaaltjes, schatten, negatief, machten.
import { kit, nl } from './lib.mjs';

const NAMES = ['Sem', 'Emma', 'Liam', 'Noor', 'Finn', 'Mila', 'Daan', 'Lotte', 'Tim', 'Fleur', 'Jens', 'Sara', 'Bram', 'Eva', 'Lars', 'Tess'];
const THINGS = ['knikkers', 'stickers', 'appels', 'boeken', 'koekjes', 'potloden', 'kaartjes', 'ballonnen'];
const num = (K, q, a, c, o = {}) => K.num(q, a, { c, ...o });
const mcn = (K, q, a, c, o = {}) => { const { step, min, ...r } = o; return K.mc(q, nl(a), K.near(a, 5, { step: step || 1, min }).map(nl), { c, ...r }); };
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

function breuken() {
  const K = kit({ id: 'breuken', name: 'Breuken', emoji: '🍕', group: 'Rekenen', desc: 'Helft, kwart, driekwart, gelijkwaardige breuken, optellen en delen van hoeveelheden.' });
  // gekleurde blokjes
  for (let den = 2; den <= 8; den++) for (let k = 1; k < den; k++) {
    const g = gcd(k, den); const s = `${k / g}/${den / g}`;
    const blocks = '🟩'.repeat(k) + '⬜'.repeat(den - k);
    const wr = []; for (let z = 1; z < den; z++) if (z !== k) wr.push(`${z}/${den}`); wr.push(`${k}/${den + 1}`, `${k + 1}/${den + 1}`);
    K.mc(`${blocks}  Welk deel is groen?`, s, wr.filter((w) => w !== s), { d: den <= 4 ? 1 : 2, c: `"${k / g}/${den / g}"`, cf: 'str', x: `${k} van de ${den} blokjes zijn groen: ${k}/${den}${g > 1 ? ' = ' + s : ''}.` });
  }
  const hv = [[2, 1, 'de helft'], [4, 1, 'een kwart'], [4, 3, 'driekwart'], [3, 1, 'een derde'], [5, 1, 'een vijfde'], [10, 1, 'een tiende']];
  for (const [den, k, w] of hv) for (let m = 1; m <= 12; m++) {
    const tot = den * m * (den === 4 || den === 2 ? 1 : 1); const ans = (tot / den) * k; if (tot > 100) continue;
    if ((m + den) % 2 === 0 || den <= 4) num(K, `Wat is ${w} van ${tot}?`, ans, `${tot}/${den}*${k}`, { d: den <= 4 ? 2 : 3, x: `${tot} ÷ ${den} = ${tot / den}${k > 1 ? `, dan × ${k} = ${ans}` : ''}.` });
  }
  const pairs = [[1, 2, 2, 4], [1, 2, 3, 6], [1, 2, 4, 8], [1, 3, 2, 6], [1, 4, 2, 8], [2, 3, 4, 6], [3, 4, 6, 8], [1, 5, 2, 10], [2, 5, 4, 10], [3, 5, 6, 10], [1, 2, 5, 10], [2, 4, 1, 2], [3, 6, 1, 2], [4, 8, 1, 2], [2, 6, 1, 3], [5, 10, 1, 2]];
  for (const [a, b, c, d] of pairs) {
    num(K, `${a}/${b} = ?/${d}`, c, `${a}*${d}/${b}`, { d: 3, x: `${a}/${b} = ${c}/${d}: boven en onder keer ${d / b}.`.replace('keer 0.5', 'delen door 2') });
    K.tf(`${a}/${b} is hetzelfde als ${c}/${d}.`, true, { d: 2, c: `${a}/${b}===${c}/${d}` });
    K.tf(`${a}/${b} is hetzelfde als ${c + 1}/${d}.`, false, { d: 2, c: `${a}/${b}===${c + 1}/${d}` });
  }
  const cmp = [[1, 2, 1, 4], [1, 2, 1, 3], [3, 4, 2, 3], [1, 3, 1, 5], [2, 3, 1, 2], [3, 4, 4, 5], [1, 4, 1, 8], [3, 8, 1, 2], [5, 6, 3, 4], [2, 5, 1, 3], [1, 10, 1, 5], [7, 8, 3, 4]];
  for (const [a, b, c, d] of cmp) {
    const A = a / b, B = c / d; const big = A > B ? `${a}/${b}` : `${c}/${d}`;
    K.mc(`Welke breuk is groter: ${a}/${b} of ${c}/${d}?`, big, [A > B ? `${c}/${d}` : `${a}/${b}`, 'ze zijn even groot', 'dat kun je niet weten'], { d: 3, c: `${a}/${b}>${c}/${d}?"${a}/${b}":"${c}/${d}"`, cf: 'str', x: 'Maak de noemers gelijk om te vergelijken.' });
  }
  for (let den = 3; den <= 10; den++) for (let k = 1; k + 1 < den; k += 2) {
    const k2 = Math.min(den - k - 1, 1 + (den % 3)); if (k2 < 1) continue; const s = k + k2; if (s >= den) continue;
    const g = gcd(s, den);
    K.mc(`${k}/${den} + ${k2}/${den} = ?`, `${s / g}/${den / g}`, [`${s + 1}/${den}`, `${s}/${den * 2}`, `${s - 1 || 1}/${den}`, `${k + k2}/${den + den}`].filter((z) => z !== `${s / g}/${den / g}`), { d: 2, c: `(${k}+${k2})/${den}`, cf: 'frac', x: 'Bij gelijke noemers tel je alleen de tellers op.' });
    if (k > k2) K.mc(`${k}/${den} − ${k2}/${den} = ?`, `${(k - k2) / gcd(k - k2, den)}/${den / gcd(k - k2, den)}`, [`${k - k2 + 1}/${den}`, `${k + k2}/${den}`, `${k - k2}/${den * 2}`], { d: 2, c: `(${k}-${k2})/${den}`, cf: 'frac' });
  }
  for (const [a, b, s] of [[2, 4, '1/2'], [3, 6, '1/2'], [4, 8, '1/2'], [2, 6, '1/3'], [3, 9, '1/3'], [5, 10, '1/2'], [2, 8, '1/4'], [6, 8, '3/4'], [4, 10, '2/5'], [3, 12, '1/4'], [6, 9, '2/3'], [10, 20, '1/2']]) {
    K.mc(`Schrijf ${a}/${b} zo eenvoudig mogelijk.`, s, ['1/2', '1/3', '1/4', '2/3', '3/4', '2/5'].filter((z) => z !== s), { d: 3, c: `"${a / gcd(a, b)}/${b / gcd(a, b)}"`, cf: 'str', x: `Deel boven en onder door ${gcd(a, b)}.` });
  }
  K.mcs([
    ['Hoeveel kwarten zijn er in een hele pizza?', '4', ['2', '3', '8'], ''],
    ['Hoeveel helften zijn er in een geheel?', '2', ['1', '3', '4'], ''],
    ['Hoeveel is 1/2 + 1/2?', '1 (een geheel)', ['1/4', '2/4', '2'], 'Twee helften maken samen een geheel.'],
    ['Hoeveel is 1/4 + 1/4?', '1/2', ['1/8', '2/8', '1/4'], '2/4 = 1/2.'],
    ['Hoeveel is 3/4 + 1/4?', '1 (een geheel)', ['4/8', '3/16', '1/2'], ''],
    ['Welke breuk is gelijk aan 0,5?', '1/2', ['1/5', '2/5', '5/1'], ''],
    ['Welke breuk is gelijk aan 0,25?', '1/4', ['1/25', '2/5', '1/2'], ''],
    ['Welke breuk is gelijk aan 0,75?', '3/4', ['7/5', '1/4', '2/3'], ''],
    ['Wat is de teller in 3/5?', '3', ['5', '8', '2'], 'De teller staat boven de streep.'],
    ['Wat is de noemer in 3/5?', '5', ['3', '8', '2'], 'De noemer staat onder de streep.'],
    ['Welke breuk is het kleinst?', '1/8', ['1/2', '1/4', '1/3'], 'Hoe groter de noemer, hoe kleiner het stukje (bij teller 1).'],
    ['Welk stuk pizza is groter?', '1/3', ['1/4', '1/5', '1/6'], ''],
  ]);
  K.tfs([['Een kwart is kleiner dan een half.', true], ['Een derde is groter dan een half.', false, 'Een half is groter.'], ['2/4 is hetzelfde als 1/2.', true], ['3/4 is meer dan 1/2.', true], ['1/5 is groter dan 1/4.', false, 'Bij gelijke teller is de kleinste noemer de grootste breuk.'], ['De helft van 10 is 5.', true], ['Een kwart van 8 is 4.', false, 'Een kwart van 8 is 2.'], ['Driekwart van 20 is 15.', true]]);
  return K.out();
}

function procenten() {
  const K = kit({ id: 'procenten', name: 'Procenten', emoji: '％', group: 'Rekenen', desc: 'Procent van een hoeveelheid, korting, breuken en procenten.' });
  for (const [p, f] of [[50, 'de helft'], [25, 'een kwart'], [10, 'een tiende'], [75, 'driekwart'], [100, 'alles'], [20, 'een vijfde']]) K.tf(`${p}% is ${f}.`, true, { d: 1 });
  K.mcs([
    ['Hoeveel procent is de helft?', '50%', ['5%', '25%', '100%'], ''],
    ['Hoeveel procent is een kwart?', '25%', ['40%', '14%', '50%'], ''],
    ['Hoeveel procent is driekwart?', '75%', ['34%', '70%', '25%'], ''],
    ['Hoeveel procent is alles?', '100%', ['10%', '1000%', '50%'], ''],
    ['Hoeveel procent is een tiende?', '10%', ['1%', '100%', '25%'], ''],
    ['Hoeveel procent is een vijfde?', '20%', ['15%', '25%', '5%'], ''],
    ['Welke breuk hoort bij 50%?', '1/2', ['1/5', '1/4', '5/1'], ''],
    ['Welke breuk hoort bij 25%?', '1/4', ['1/2', '2/5', '1/25'], ''],
    ['Welke breuk hoort bij 10%?', '1/10', ['1/2', '1/100', '10/1'], ''],
    ['Wat betekent "procent"?', 'van de honderd', ['van de tien', 'van de duizend', 'per uur'], 'Per cent betekent per honderd.'],
  ]);
  for (const p of [50, 10, 25, 20, 75, 100, 5, 1, 30, 40, 60, 90]) for (const t of [20, 40, 50, 60, 80, 100, 120, 200, 300, 400, 500]) {
    const ans = (p * t) / 100; if (!Number.isInteger(ans)) continue;
    const easy = [50, 10, 25, 100].includes(p);
    if ((p + t) % 3 === 0 || p === 50 && t % 40 === 0) num(K, `Hoeveel is ${p}% van ${t}?`, ans, `${p}*${t}/100`, { d: easy ? 1 : 3, x: `${p}% van ${t} = ${p}/100 × ${t} = ${ans}.` });
    if ((p * t) % 7 === 1 || p === 10) mcn(K, `${p}% van ${t} is ...`, ans, `${p}*${t}/100`, { d: easy ? 1 : 3, step: Math.max(1, ans / 10 | 0) });
  }
  for (const [pr, k] of [[40, 25], [20, 50], [60, 10], [80, 25], [50, 20], [100, 30], [30, 10], [200, 15], [90, 20], [120, 25], [160, 50], [24, 25], [70, 10], [150, 10], [48, 50], [36, 25]]) {
    const ans = pr - (pr * k) / 100;
    const nm = NAMES[(pr + k) % NAMES.length];
    if (Number.isInteger(ans) && Number.isInteger(pr * k / 100)) {
      num(K, `Een broek kost €${pr} en heeft ${k}% korting. Hoeveel euro korting is dat?`, (pr * k) / 100, `${pr}*${k}/100`, { d: 3 });
      num(K, `${nm} koopt een spel van €${pr} met ${k}% korting. Wat betaalt ${nm} (in euro)?`, ans, `${pr}-${pr}*${k}/100`, { d: 3, x: `Korting: ${pr * k / 100}. Dus ${pr} − ${pr * k / 100} = ${ans}.` });
    }
  }
  for (const [a, t] of [[5, 10], [5, 20], [10, 20], [10, 40], [1, 4], [3, 4], [1, 5], [2, 5], [4, 5], [3, 10], [9, 10], [15, 20], [18, 20], [30, 50], [12, 50], [25, 50], [20, 80], [60, 80], [40, 200], [50, 200]]) {
    const ans = (a * 100) / t; if (!Number.isInteger(ans)) continue;
    num(K, `${a} van de ${t} is hoeveel procent?`, ans, `${a}*100/${t}`, { d: 3, x: `${a}/${t} = ${ans}/100 = ${ans}%.` });
  }
  for (const [p, d] of [[0.5, '50%'], [0.25, '25%'], [0.75, '75%'], [0.1, '10%'], [0.2, '20%'], [1, '100%'], [0.01, '1%'], [0.3, '30%'], [0.6, '60%'], [0.9, '90%']]) K.mc(`Hoeveel procent is ${nl(p)}?`, d, ['5%', '15%', '45%', '1%', '10%', '50%', '90%', '100%'].filter((z) => z !== d), { d: 2, c: `${p}*100+"%"`, cf: 'str' });
  for (const [s, t] of [[8, 10], [16, 20], [4, 5], [9, 10], [17, 20], [19, 20], [3, 5], [7, 10], [45, 50], [18, 25], [15, 25], [24, 30]]) {
    const pct = (s * 100) / t; if (!Number.isInteger(pct)) continue;
    num(K, `Je hebt ${s} van de ${t} vragen goed. Hoeveel procent is dat?`, pct, `${s}*100/${t}`, { d: 3 });
  }
  for (const [pc, nm] of [[50, 'de batterij'], [100, 'de batterij'], [25, 'het glas']]) K.tf(`Als ${nm} voor ${pc}% vol is, is hij ${pc === 100 ? 'helemaal' : pc === 50 ? 'half' : 'voor een kwart'} vol.`, true, { d: 1 });
  K.tfs([['10% van 100 is 10.', true], ['10% van 50 is 10.', false, '10% van 50 is 5.'], ['50% van 30 is 15.', true], ['25% van 40 is 20.', false, 'Een kwart van 40 is 10.'], ['100% van 7 is 7.', true], ['200% is dubbel zoveel.', true], ['0% betekent alles.', false, '0% is niets.'], ['75% is meer dan de helft.', true]]);
  return K.out();
}

function meten() {
  const K = kit({ id: 'meten', name: 'Meten en eenheden', emoji: '📏', group: 'Rekenen', desc: 'Lengte, gewicht, inhoud en tijd: eenheden omrekenen en kiezen.' });
  const conv = [['meter', 'centimeter', 100], ['kilometer', 'meter', 1000], ['centimeter', 'millimeter', 10], ['kilogram', 'gram', 1000], ['liter', 'milliliter', 1000], ['liter', 'deciliter', 10], ['uur', 'minuten', 60], ['minuut', 'seconden', 60], ['dag', 'uur', 24], ['week', 'dagen', 7], ['jaar', 'maanden', 12], ['ton', 'kilogram', 1000], ['halve liter', 'milliliter', 500]];
  for (const [big, small, f] of conv) {
    const one = big.startsWith('halve') ? 1 : 1;
    K.mc(`Hoeveel ${small} is 1 ${big}?`.replace('1 halve liter', 'een halve liter'), String(f), [f * 10, f / 10 >= 1 ? f / 10 : f * 2, f + 10, f * 2, f - 10].filter((z) => z > 0 && z !== f).map(String), { d: 1, c: String(f), cf: 'str' });
    for (const m of [2, 3, 5, 10]) { if (big.startsWith('halve')) continue; num(K, `${m} ${big} is hoeveel ${small}?`.replace(' jaar ', ' jaar '), m * f, `${m}*${f}`, { d: m > 5 ? 2 : 1, x: `1 ${big} = ${f} ${small}.` }); }
    for (const m of [2, 3, 4]) { if (big.startsWith('halve')) continue; num(K, `${m * f} ${small} is hoeveel ${big}?`, m, `${m * f}/${f}`, { d: 2, x: `${f} ${small} = 1 ${big}.` }); }
  }
  const half = [[0.5, 'meter', 50, 'centimeter'], [0.5, 'kilometer', 500, 'meter'], [0.5, 'kilogram', 500, 'gram'], [0.5, 'liter', 500, 'milliliter'], [0.5, 'uur', 30, 'minuten'], [0.25, 'liter', 250, 'milliliter'], [1.5, 'meter', 150, 'centimeter'], [2.5, 'kilogram', 2500, 'gram'], [1.5, 'liter', 1500, 'milliliter'], [0.25, 'uur', 15, 'minuten'], [1.5, 'uur', 90, 'minuten'], [0.75, 'uur', 45, 'minuten']];
  for (const [a, u, b, v] of half) num(K, `${nl(a)} ${u} is hoeveel ${v}?`, b, `${a}*${b / a}`, { d: 3 });
  const fit = [['de lengte van een potlood', 'centimeter', ['kilometer', 'liter', 'gram']], ['de afstand Amsterdam–Utrecht', 'kilometer', ['centimeter', 'gram', 'liter']], ['het gewicht van een appel', 'gram', ['kilogram', 'meter', 'liter']], ['het gewicht van een auto', 'kilogram', ['gram', 'centimeter', 'milliliter']], ['de inhoud van een fles water', 'liter', ['kilometer', 'gram', 'minuut']], ['de inhoud van een theelepel', 'milliliter', ['liter', 'kilogram', 'meter']], ['de lengte van een voetbalveld', 'meter', ['kilometer', 'millimeter', 'liter']], ['de dikte van een munt', 'millimeter', ['kilometer', 'liter', 'kilogram']], ['een schooldag', 'uur', ['seconde', 'liter', 'meter']], ['de tijd die je nodig hebt om te knipperen', 'seconde', ['uur', 'dag', 'week']], ['het gewicht van een brief', 'gram', ['ton', 'liter', 'kilometer']], ['de inhoud van een zwembad', 'liter (heel veel)', ['milliliter', 'gram', 'millimeter']], ['de lengte van je voet', 'centimeter', ['kilometer', 'liter', 'kilogram']], ['het gewicht van een olifant', 'ton', ['gram', 'milliliter', 'centimeter']], ['de hoogte van een deur', 'meter', ['kilometer', 'millimeter', 'liter']], ['de inhoud van een emmer', 'liter', ['milliliter', 'meter', 'gram']]];
  for (const [w, a, wr] of fit) K.mc(`Welke eenheid past bij ${w}?`, a, wr, { d: 2 });
  const sets = [['1 m', 100, '1 meter'], ['50 cm', 50, ''], ['1 km', 1000000, ''], ['2 dm', 20, ''], ['300 cm', 300, '']];
  K.order('Zet van klein naar groot', ['1 cm', '1 dm', '1 m', '1 km'], { d: 1 });
  K.order('Zet van klein naar groot', ['1 mm', '1 cm', '1 meter', '1 km'], { d: 1 });
  K.order('Zet van licht naar zwaar', ['1 gram', '1 kilogram', '1 ton'], { d: 1 });
  K.order('Zet van weinig naar veel', ['1 ml', '1 dl', '1 liter', '1 emmer van 10 liter'], { d: 2 });
  K.order('Zet van kort naar lang', ['1 seconde', '1 minuut', '1 uur', '1 dag'], { d: 1 });
  K.order('Zet van kort naar lang', ['1 dag', '1 week', '1 maand', '1 jaar'], { d: 1 });
  K.order('Zet van klein naar groot', ['50 cm', '1 m', '150 cm', '2 m'], { d: 2 });
  K.order('Zet van licht naar zwaar', ['500 g', '1 kg', '1500 g', '2 kg'], { d: 2 });
  K.mcs([['Wat is groter: 1 meter of 90 centimeter?', '1 meter', ['90 centimeter', 'ze zijn even groot', 'geen van beide'], '1 meter is 100 cm.'], ['Wat is zwaarder: 1 kilogram of 900 gram?', '1 kilogram', ['900 gram', 'ze zijn even zwaar', 'geen van beide'], '1 kg = 1000 g.'], ['Wat is meer: 1 liter of 900 milliliter?', '1 liter', ['900 milliliter', 'even veel', 'geen van beide'], '1 liter = 1000 ml.'], ['Hoeveel meter is 1 kilometer?', '1000', ['100', '10', '10000'], ''], ['Hoeveel gram is een halve kilo?', '500', ['50', '250', '5000'], ''], ['Hoeveel dagen heeft een week?', '7', ['5', '6', '10'], ''], ['Hoeveel maanden heeft een jaar?', '12', ['10', '11', '13'], ''], ['Hoeveel dagen heeft een gewoon jaar?', '365', ['360', '366', '364'], 'Een schrikkeljaar heeft 366 dagen.'], ['Hoeveel dagen heeft een schrikkeljaar?', '366', ['365', '367', '360'], ''], ['Hoeveel dagen heeft februari in een gewoon jaar?', '28', ['29', '30', '31'], ''], ['Hoeveel weken heeft een jaar ongeveer?', '52', ['48', '50', '60'], ''], ['Welke maand heeft 30 dagen?', 'april', ['januari', 'maart', 'mei'], 'April, juni, september en november hebben 30 dagen.'], ['Welke maand heeft 31 dagen?', 'juli', ['april', 'juni', 'november'], '']]);
  for (let i = 0; i < 24; i++) {
    const a = 150 + 50 * (i % 9), b = 35 + 5 * i; const nm = NAMES[i % NAMES.length];
    num(K, `${nm} loopt ${a} meter en daarna nog ${b} meter. Hoeveel meter is dat samen?`, a + b, `${a}+${b}`, { d: 2 });
    num(K, `${nm} heeft ${a + b} gram meel nodig en heeft al ${a} gram. Hoeveel gram moet er nog bij?`, b, `${a + b}-${a}`, { d: 2 });
  }
  return K.out();
}

function meetkunde() {
  const K = kit({ id: 'meetkunde', name: 'Meetkunde: vormen', emoji: '🔷', group: 'Rekenen', desc: 'Vormen, hoeken, omtrek en oppervlakte, ruimtelijke figuren.' });
  K.facts([['driehoek', '3'], ['vierkant', '4'], ['rechthoek', '4'], ['vijfhoek', '5'], ['zeshoek', '6'], ['zevenhoek', '7'], ['achthoek', '8'], ['negenhoek', '9'], ['tienhoek', '10'], ['ruit', '4'], ['parallellogram', '4'], ['trapezium', '4']], {
    f: (k) => `Hoeveel hoeken heeft een ${k}?`, t: (k, v) => `Een ${k} heeft ${v} hoeken.`, typeMax: 3, d: 1, pool: ['3', '4', '5', '6', '7', '8', '9', '10'],
  });
  K.facts([['driehoek', '3'], ['vierkant', '4'], ['rechthoek', '4'], ['vijfhoek', '5'], ['zeshoek', '6'], ['achthoek', '8']], { f: (k) => `Hoeveel zijden heeft een ${k}?`, t: (k, v) => `Een ${k} heeft ${v} zijden.`, typeMax: 3, d: 1, pool: ['3', '4', '5', '6', '8'] });
  K.facts([['kubus', '6'], ['balk', '6'], ['piramide met een vierkant grondvlak', '5'], ['cilinder', '3'], ['bol', '1']], { f: (k) => `Hoeveel vlakken (of oppervlakken) heeft een ${k}?`, d: 3, pool: ['1', '2', '3', '4', '5', '6', '8'], x: (k) => '' , type: false });
  K.mcs([
    ['Hoeveel ribben heeft een kubus?', '12', ['6', '8', '10'], 'Een kubus heeft 12 ribben, 8 hoekpunten en 6 vlakken.'],
    ['Hoeveel hoekpunten heeft een kubus?', '8', ['6', '12', '4'], ''],
    ['Hoeveel vlakken heeft een kubus?', '6', ['8', '12', '4'], ''],
    ['Hoe heet een vorm die rond en bol is zoals een voetbal?', 'bol', ['kubus', 'cilinder', 'piramide'], ''],
    ['Een blikje soep heeft de vorm van een ...', 'cilinder', ['bol', 'kubus', 'kegel'], ''],
    ['Een ijshoorntje heeft de vorm van een ...', 'kegel', ['bol', 'cilinder', 'kubus'], ''],
    ['Een dobbelsteen heeft de vorm van een ...', 'kubus', ['balk', 'bol', 'piramide'], ''],
    ['Een schoenendoos heeft de vorm van een ...', 'balk', ['kubus', 'cilinder', 'bol'], ''],
    ['Welke vorm heeft 4 gelijke zijden en 4 rechte hoeken?', 'vierkant', ['rechthoek', 'ruit', 'driehoek'], 'Een ruit heeft geen rechte hoeken, een rechthoek heeft niet vier gelijke zijden.'],
    ['Welke vorm heeft 4 rechte hoeken en twee paar gelijke zijden?', 'rechthoek', ['ruit', 'driehoek', 'cirkel'], ''],
    ['Hoeveel graden is een rechte hoek?', '90', ['45', '180', '60'], ''],
    ['Hoeveel graden is een gestrekte hoek?', '180', ['90', '360', '270'], ''],
    ['Hoeveel graden is een hele draai?', '360', ['180', '90', '270'], ''],
    ['Hoeveel graden zijn de hoeken van een driehoek samen?', '180', ['90', '360', '270'], 'Altijd 180 graden.'],
    ['Hoeveel graden zijn de hoeken van een vierkant samen?', '360', ['180', '90', '270'], ''],
    ['De lijn dwars door het midden van een cirkel heet de ...', 'diameter', ['straal', 'omtrek', 'hoek'], ''],
    ['De afstand van het midden naar de rand van een cirkel heet de ...', 'straal', ['diameter', 'omtrek', 'hoek'], ''],
    ['De diameter is ... zo lang als de straal.', 'twee keer', ['de helft', 'drie keer', 'even'], ''],
    ['Welke hoek is kleiner dan 90 graden?', 'scherpe hoek', ['stompe hoek', 'rechte hoek', 'gestrekte hoek'], ''],
    ['Welke hoek is groter dan 90 en kleiner dan 180 graden?', 'stompe hoek', ['scherpe hoek', 'rechte hoek', 'hele draai'], ''],
    ['Een rechthoekige driehoek heeft een ...', 'rechte hoek', ['stompe hoek', 'gestrekte hoek', 'geen hoeken'], ''],
    ['Hoeveel symmetrie-assen heeft een vierkant?', '4', ['1', '2', '8'], ''],
    ['Hoeveel symmetrie-assen heeft een cirkel?', 'oneindig veel', ['1', '2', '4'], 'Elke lijn door het midden is een symmetrie-as.'],
    ['Evenwijdige lijnen ...', 'kruisen elkaar nooit', ['staan haaks op elkaar', 'raken elkaar altijd', 'zijn gebogen'], ''],
    ['Wat is de omtrek van een vorm?', 'de lengte van de rand', ['de ruimte binnenin', 'het aantal hoeken', 'de hoogte'], ''],
    ['Wat is de oppervlakte van een vorm?', 'hoeveel ruimte binnenin', ['de lengte van de rand', 'het aantal zijden', 'de dikte'], ''],
  ]);
  for (let i = 0; i < 20; i++) {
    const z = 2 + i % 12; num(K, `Een vierkant heeft zijden van ${z} cm. Wat is de omtrek (in cm)?`, 4 * z, `4*${z}`, { d: 2, x: `4 × ${z} = ${4 * z}` });
    num(K, `Een vierkant heeft zijden van ${z} cm. Wat is de oppervlakte (in cm²)?`, z * z, `${z}*${z}`, { d: 3, x: `${z} × ${z} = ${z * z}` });
  }
  for (let i = 0; i < 24; i++) {
    const l = 3 + (i % 9), b = 2 + ((i * 5) % 6); if (l === b) continue;
    num(K, `Een rechthoek is ${l} cm lang en ${b} cm breed. Wat is de omtrek (in cm)?`, 2 * (l + b), `2*(${l}+${b})`, { d: 3, x: `2 × (${l} + ${b}) = ${2 * (l + b)}` });
    num(K, `Een rechthoek is ${l} cm lang en ${b} cm breed. Wat is de oppervlakte (in cm²)?`, l * b, `${l}*${b}`, { d: 3, x: `${l} × ${b} = ${l * b}` });
  }
  for (let i = 0; i < 10; i++) { const a = 30 + i * 10; if (a >= 90) continue; num(K, `Een driehoek heeft hoeken van ${a} en 90 graden. Hoe groot is de derde hoek?`, 180 - 90 - a, `180-90-${a}`, { d: 3, x: 'De som is 180 graden.' }); }
  for (let i = 0; i < 12; i++) { const a = 40 + 5 * i, b = 50 + 4 * i; if (a + b < 170) num(K, `Twee hoeken van een driehoek zijn ${a} en ${b} graden. Hoe groot is de derde?`, 180 - a - b, `180-${a}-${b}`, { d: 3 }); }
  for (let i = 0; i < 8; i++) { const r = 2 + i; num(K, `De straal van een cirkel is ${r} cm. Hoe groot is de diameter (in cm)?`, 2 * r, `2*${r}`, { d: 1 }); num(K, `De diameter van een cirkel is ${2 * r} cm. Hoe groot is de straal (in cm)?`, r, `${2 * r}/2`, { d: 1 }); }
  for (const [n, v] of [['driehoek', 3], ['vijfhoek', 5], ['zeshoek', 6], ['achthoek', 8]]) K.tf(`Een ${n} heeft ${v} hoeken.`, true, { d: 1 });
  K.tfs([['Een vierkant is ook een rechthoek.', true, 'Een vierkant heeft vier rechte hoeken, dus het is een bijzondere rechthoek.'], ['Een cirkel heeft hoeken.', false], ['Een kubus heeft 6 gelijke vlakken.', true], ['Een bol heeft ribben.', false], ['Een driehoek heeft 4 zijden.', false], ['Alle zijden van een ruit zijn even lang.', true], ['Een balk heeft 8 hoekpunten.', true], ['Een cilinder heeft twee ronde vlakken.', true]]);
  const sh = [['🔴', 'cirkel'], ['🟦', 'vierkant'], ['🔺', 'driehoek'], ['⭐', 'ster'], ['🔶', 'ruit']];
  for (const [e, n] of sh) K.mc('Welke vorm zie je?', n, ['cirkel', 'vierkant', 'driehoek', 'ster', 'ruit', 'zeshoek'].filter((z) => z !== n), { e, d: 1 });
  return K.out();
}

function getallenrijen() {
  const K = kit({ id: 'getallenrijen', name: 'Getallenrijen', emoji: '🔗', group: 'Rekenen', desc: 'Wat komt er daarna? Ontdek het patroon in rijen getallen.' });
  for (let s = 1; s <= 20; s += 1) for (const st of [2, 3, 5, 10, 4, 6, 7, 9]) {
    if ((s * st) % 5 !== 1 && !(st === 10 && s <= 4) && !(st === 2 && s % 4 === 1)) continue;
    const seq = [0, 1, 2, 3, 4].map((i) => s + st * i);
    num(K, `${seq.slice(0, 4).join(', ')}, ... Wat komt hierna?`, seq[4], `${s}+${st}*4`, { d: st <= 5 ? 1 : 2, x: `Elke keer +${st}.` });
    if (s + st * 6 < 150 && s % 2 === 0) { const r = [0, 1, 2, 3, 4].map((i) => s + st * (i + 3)); num(K, `${r[4]}, ${r[3]}, ${r[2]}, ${r[1]}, ... Wat komt hierna?`, r[0], `${r[0]}`, { d: 2, x: `Elke keer −${st}.` }); }
  }
  for (let s = 40; s <= 100; s += 7) for (const st of [3, 4, 5, 6, 8, 10]) {
    if ((s + st) % 3 !== 0) continue;
    const seq = [0, 1, 2, 3, 4].map((i) => s - st * i); if (seq[4] < 0) continue;
    num(K, `${seq.slice(0, 4).join(', ')}, ... Wat komt hierna?`, seq[4], `${s}-${st}*4`, { d: 2, x: `Elke keer −${st}.` });
    const mid = 2;
    num(K, `${seq[0]}, ${seq[1]}, ..., ${seq[3]}, ${seq[4]}. Welk getal ontbreekt?`, seq[mid], `${s}-${st}*2`, { d: 3 });
  }
  for (const [a, f] of [[1, 2], [2, 2], [3, 2], [1, 3], [2, 3], [5, 2], [1, 4], [1, 5], [3, 3], [4, 2]]) {
    const seq = [0, 1, 2, 3, 4].map((i) => a * f ** i);
    num(K, `${seq.slice(0, 4).join(', ')}, ... Wat komt hierna?`, seq[4], `${a}*${f}**4`, { d: 3, x: `Elke keer × ${f}.` });
    num(K, `${seq[0]}, ${seq[1]}, ..., ${seq[3]}. Welk getal ontbreekt?`, seq[2], `${a}*${f}**2`, { d: 3, x: `Elke keer × ${f}.` });
  }
  const sq = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100];
  for (let i = 4; i < 10; i++) num(K, `${sq.slice(0, i).join(', ')}, ... Wat komt hierna? (kwadraten)`, sq[i], `${i + 1}*${i + 1}`, { d: 3, x: 'Dit zijn de kwadraten: 1×1, 2×2, 3×3, ...' });
  const tri = [1, 3, 6, 10, 15, 21, 28, 36];
  for (let i = 4; i < 8; i++) num(K, `${tri.slice(0, i).join(', ')}, ... Wat komt hierna?`, tri[i], `${(i + 1) * (i + 2) / 2}`, { d: 3, x: `Je telt steeds één meer erbij: +${i + 1}.` });
  const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55];
  for (let i = 5; i < 10; i++) num(K, `${fib.slice(0, i).join(', ')}, ... Wat komt hierna?`, fib[i], `${fib[i - 1]}+${fib[i - 2]}`, { d: 3, x: 'Tel de laatste twee getallen bij elkaar op (Fibonacci).' });
  for (let i = 0; i < 14; i++) { const a = 2 + i, b = 1 + (i % 4); const seq = [a, a + b, a + 2 * b + 1, a + 3 * b + 1, a + 4 * b + 2]; /* steeds b, dan b+1 */
    const ex = [a, a + b, a + 2 * b, a + 3 * b]; const alt = [];
    let cur = a; for (let k = 0; k < 6; k++) { alt.push(cur); cur += k % 2 === 0 ? b : 1; }
    num(K, `${alt.slice(0, 5).join(', ')}, ... Wat komt hierna?`, alt[5], `${alt[4]}+${b}`, { d: 3, x: `Om en om +${b} en +1.` });
  }
  for (let i = 0; i < 10; i++) { const a = 10 + 10 * i; K.mc(`Welke rij loopt steeds +${i + 2}?`, `${a}, ${a + i + 2}, ${a + 2 * (i + 2)}, ${a + 3 * (i + 2)}`, [`${a}, ${a + i + 3}, ${a + 2 * (i + 2)}, ${a + 3 * (i + 2)}`, `${a}, ${a + i + 2}, ${a + 2 * (i + 2) + 1}, ${a + 3 * (i + 2)}`, `${a}, ${a - i - 2}, ${a - 2 * (i + 2)}, ${a - 3 * (i + 2)}`], { d: 2, c: 'true', cf: 'skip' }); }
  for (let s = 1; s <= 10; s++) { const e = s * 2; K.order('Zet de rij in de goede volgorde', [e, e + 2, e + 4, e + 6].map(String), { d: 1 }); }
  K.mcs([
    ['Hoe heet de rij 2, 4, 6, 8, ...?', 'even getallen', ['oneven getallen', 'kwadraten', 'tientallen'], ''],
    ['Hoe heet de rij 1, 3, 5, 7, ...?', 'oneven getallen', ['even getallen', 'kwadraten', 'vijftallen'], ''],
    ['Wat is het volgende getal: 5, 10, 15, 20, ...?', '25', ['24', '30', '22'], ''],
    ['Wat is het volgende getal: 100, 90, 80, 70, ...?', '60', ['50', '65', '69'], ''],
    ['Wat is het volgende getal: 3, 6, 12, 24, ...?', '48', ['36', '30', '27'], 'Elke keer verdubbelen.'],
    ['Wat is het volgende getal: 1, 10, 100, 1000, ...?', '10000', ['2000', '1100', '5000'], 'Elke keer × 10.'],
    ['Wat is het volgende getal: 81, 27, 9, 3, ...?', '1', ['0', '2', '6'], 'Elke keer delen door 3.'],
  ]);
  return K.out();
}

/* ---------------- verhaaltjessommen ---------------- */
function verhaal() {
  const K = kit({ id: 'verhaaltjessommen', name: 'Verhaaltjessommen', emoji: '📖', group: 'Rekenen', desc: 'Korte rekenverhaaltjes: erbij, eraf, keer, delen en twee stappen.' });
  for (let i = 0; i < 260; i++) {
    const nm = NAMES[i % NAMES.length], nm2 = NAMES[(i * 5 + 3) % NAMES.length], th = THINGS[(i * 3) % THINGS.length];
    const a = 6 + ((i * 13) % 40), b = 3 + ((i * 7) % 25), n = 2 + (i % 8), m = 2 + ((i * 3) % 9), c = 2 + ((i * 11) % 15);
    const kind = i % 10;
    const d = kind < 3 ? 1 : kind < 7 ? 2 : 3;
    if (kind === 0) {
      const q0 = `${nm} heeft ${a} ${th}. ${nm2} geeft nog ${b} ${th}. Hoeveel heeft ${nm} nu?`;
      if (i % 20 === 0) mcn(K, q0, a + b, `${a}+${b}`, { d, step: 2 });
      else if (i % 20 === 10) K.tf(`${nm} heeft ${a} ${th} en krijgt er ${b} bij. Nu heeft ${nm} ${a + b + (i % 2 ? 1 : 0)} ${th}.`, !(i % 2), { d, c: `${a}+${b}===${a + b + (i % 2 ? 1 : 0)}` });
      else num(K, q0, a + b, `${a}+${b}`, { d });
    }
    else if (kind === 1 && a > b) num(K, `${nm} heeft ${a} ${th} en geeft er ${b} aan ${nm2}. Hoeveel houdt ${nm} over?`, a - b, `${a}-${b}`, { d });
    else if (kind === 2) num(K, `${nm} heeft ${a} ${th}. ${nm2} heeft er ${b} meer dan ${nm}. Hoeveel heeft ${nm2}?`, a + b, `${a}+${b}`, { d });
    else if (kind === 3) { const q3 = `Er zijn ${n} dozen met elk ${m} ${th}. Hoeveel ${th} zijn dat samen?`; if (i % 3 === 0) mcn(K, q3, n * m, `${n}*${m}`, { d, step: m }); else num(K, q3, n * m, `${n}*${m}`, { d }); }
    else if (kind === 4) num(K, `${nm} verdeelt ${n * m} ${th} eerlijk over ${n} kinderen. Hoeveel krijgt ieder kind?`, m, `${n * m}/${n}`, { d });
    else if (kind === 5 && a > b) num(K, `${nm} heeft ${a} ${th}. ${nm2} heeft er ${b}. Hoeveel meer heeft ${nm}?`, a - b, `${a}-${b}`, { d });
    else if (kind === 6) num(K, `${nm} koopt ${n} pakken met ${m} ${th} en nog ${c} losse. Hoeveel ${th} heeft ${nm} in totaal?`, n * m + c, `${n}*${m}+${c}`, { d: 3 });
    else if (kind === 7) num(K, `${nm} heeft ${a + b} ${th}. ${nm} geeft ${b} weg en koopt er ${c} bij. Hoeveel heeft ${nm} dan?`, a + c, `${a + b}-${b}+${c}`, { d: 3 });
    else if (kind === 8) num(K, `${nm} en ${nm2} hebben samen ${a + b} ${th}. ${nm} heeft er ${a}. Hoeveel heeft ${nm2}?`, b, `${a + b}-${a}`, { d: 2 });
    else if (kind === 9) num(K, `In een klas zitten ${n} groepjes van ${m} kinderen. Er zijn ${c} kinderen ziek thuis. Hoeveel kinderen zijn er op school?`, n * m - c > 0 ? n * m - c : n * m + c, n * m - c > 0 ? `${n}*${m}-${c}` : `${n}*${m}+${c}`, { d: 3 });
  }
  return K.out();
}

function schatten() {
  const K = kit({ id: 'schatten', name: 'Schatten en afronden', emoji: '🎯', group: 'Rekenen', desc: 'Afronden en slim schatten: ongeveer hoeveel is het?' });
  for (let i = 0; i < 40; i++) {
    const n = 11 + ((i * 17) % 189); if (n % 10 === 5) continue; const r = Math.round(n / 10) * 10;
    num(K, `Rond ${n} af op tientallen.`, r, `Math.round(${n}/10)*10`, { d: 1, x: '5 of meer: omhoog. Minder dan 5: omlaag.' });
  }
  for (let i = 0; i < 28; i++) {
    const n = 120 + ((i * 193) % 1800); if (n % 100 === 50) continue; const r = Math.round(n / 100) * 100;
    num(K, `Rond ${n} af op honderdtallen.`, r, `Math.round(${n}/100)*100`, { d: 2 });
  }
  for (let i = 0; i < 12; i++) { const n = 1200 + ((i * 1733) % 8000); if (n % 1000 === 500) continue; num(K, `Rond ${n} af op duizendtallen.`, Math.round(n / 1000) * 1000, `Math.round(${n}/1000)*1000`, { d: 3 }); }
  for (let i = 0; i < 30; i++) {
    const a = 21 + ((i * 17) % 78), b = 12 + ((i * 29) % 60);
    const est = Math.round(a / 10) * 10 + Math.round(b / 10) * 10; const real = a + b;
    K.mc(`Schat ${a} + ${b}. Het antwoord is ongeveer ...`, String(est), [est + 20, est - 20, est + 50, est + 10, est - 10].filter((z) => z > 0 && z !== est).map(String), { d: 2, c: `Math.round(${a}/10)*10+Math.round(${b}/10)*10`, cf: 'str', x: `Rond af: ${Math.round(a / 10) * 10} + ${Math.round(b / 10) * 10} = ${est}. (Echt: ${real}.)` });
  }
  for (let i = 0; i < 26; i++) {
    const a = 31 + ((i * 19) % 68), b = 3 + (i % 7); const est = Math.round(a / 10) * 10 * b;
    K.mc(`Schat ${a} × ${b}. Het antwoord is ongeveer ...`, String(est), [est + 30, est - 30, est * 2, est + b * 10, est - b * 10].filter((z) => z > 0 && z !== est).map(String), { d: 3, c: `Math.round(${a}/10)*10*${b}`, cf: 'str', x: `${Math.round(a / 10) * 10} × ${b} = ${est}; het echte antwoord is ${a * b}.` });
  }
  const guess = [['Hoeveel meter is een voetbalveld lang ongeveer?', '100 meter', ['10 meter', '1000 meter', '5 meter']], ['Hoe lang is een volwassen persoon ongeveer?', '1,80 meter', ['18 meter', '0,5 meter', '5 meter']], ['Hoeveel weegt een brood ongeveer?', '800 gram', ['8 kilo', '80 gram', '8 ton']], ['Hoeveel liter zit er in een emmer ongeveer?', '10 liter', ['1 liter', '100 liter', '1000 liter']], ['Hoe lang duurt een film ongeveer?', '2 uur', ['2 minuten', '20 uur', '2 dagen']], ['Hoe lang is een potlood ongeveer?', '18 centimeter', ['18 meter', '2 centimeter', '180 centimeter']], ['Hoe snel loopt een wandelaar ongeveer?', '5 km per uur', ['50 km per uur', '0,5 km per uur', '500 km per uur']], ['Hoeveel weegt een appel ongeveer?', '150 gram', ['15 kilo', '15 gram', '1,5 kilo']], ['Hoeveel mensen passen ongeveer in een schoolklas?', '25', ['5', '250', '2500']], ['Hoe hoog is een deur ongeveer?', '2 meter', ['20 meter', '20 centimeter', '200 meter']], ['Hoeveel weegt een auto ongeveer?', '1000 kilo', ['10 kilo', '100 gram', '10 ton']], ['Hoeveel tikken je hart per minuut ongeveer (rust)?', '70', ['7', '700', '7000']]];
  for (const [q, a, w] of guess) K.mc(q, a, w, { d: 2 });
  for (let i = 0; i < 20; i++) { const a = 195 + i * 31, b = 3 + (i % 5); const est = Math.round(a / 100) * 100 * b; K.mc(`${a} × ${b} is ongeveer ...`, String(est), [est + 100, est - 100, est * 2, est / 2 > 0 ? est / 2 : est + 300].filter((z) => z !== est).map(String), { d: 3, c: `Math.round(${a}/100)*100*${b}`, cf: 'str' }); }
  K.tfs([['Als je 48 afrondt op tientallen krijg je 50.', true], ['Als je 43 afrondt op tientallen krijg je 50.', false, '43 wordt 40.'], ['Als je 150 afrondt op honderdtallen krijg je 200.', true, 'Bij precies de helft rond je omhoog af.'], ['Als je 249 afrondt op honderdtallen krijg je 300.', false, '249 wordt 200.'], ['Schatten is precies uitrekenen.', false], ['Door af te ronden kun je snel een antwoord schatten.', true]]);
  return K.out();
}

function negatief() {
  const K = kit({ id: 'negatieve-getallen', name: 'Negatieve getallen', emoji: '🌡️', group: 'Rekenen', desc: 'Onder nul: temperatuur, getallenlijn, optellen en aftrekken met min.' });
  for (let i = 0; i < 24; i++) { const t = -(1 + (i * 3) % 15), r = 2 + (i % 12); num(K, `Het is ${t} graden. De temperatuur stijgt met ${r} graden. Hoeveel graden is het nu?`, t + r, `${t}+${r}`, { d: 2, x: 'Op de thermometer ga je omhoog.' }); }
  for (let i = 0; i < 24; i++) { const t = 3 + (i * 5) % 12, r = t + 1 + (i % 9); num(K, `Het is ${t} graden. De temperatuur daalt met ${r} graden. Hoeveel graden is het nu?`, t - r, `${t}-${r}`, { d: 3, x: 'Je gaat onder nul.' }); }
  for (let i = 0; i < 20; i++) { const a = -(2 + i % 9), b = 1 + (i * 7) % 12; num(K, `${a} + ${b} = ?`, a + b, `(${a})+${b}`, { d: 2 }); }
  for (let i = 0; i < 20; i++) { const a = (i * 3) % 10, b = a + 1 + (i % 8); num(K, `${a} − ${b} = ?`, a - b, `${a}-${b}`, { d: 3 }); }
  for (let i = 0; i < 18; i++) { const a = -(1 + (i % 9)), b = 1 + (i * 5) % 8; num(K, `${a} − ${b} = ?`, a - b, `(${a})-${b}`, { d: 3, x: 'Verder onder nul.' }); }
  for (let i = 0; i < 18; i++) { const a = -(1 + i % 9), b = 1 + (i * 3) % 10; const hi = Math.max(a, b), lo = Math.min(a, b); num(K, `Wat is het verschil tussen ${a} en ${b}? (hoe ver liggen ze uit elkaar)`, hi - lo, `Math.abs(${a}-${b})`, { d: 3, x: 'Tel de afstand op de getallenlijn.' }); }
  for (let i = 0; i < 22; i++) { const a = -(1 + (i * 3) % 12), b = -(1 + (i * 7 + 4) % 12); if (a === b) continue; K.mc(`Welk getal is groter: ${a} of ${b}?`, String(Math.max(a, b)), [String(Math.min(a, b)), 'ze zijn even groot', 'dat kun je niet zien'], { d: 2, c: `Math.max(${a},${b})`, cf: 'str', x: 'Hoe dichter bij nul, hoe groter bij negatieve getallen.' }); }
  for (let i = 0; i < 6; i++) { const base = -(8 - i); K.order('Zet van klein naar groot', [...new Set([base, base + 4, 3 + i, 0, base + 2])].sort((x, y) => x - y).map(String), { d: 2 }); }
  K.order('Zet van koud naar warm', ['-10 graden', '-2 graden', '0 graden', '15 graden'], { d: 1 });
  K.order('Zet van laag naar hoog', ['-20', '-5', '0', '5', '20'], { d: 1 });
  K.mcs([
    ['Bij hoeveel graden bevriest water?', '0 graden', ['10 graden', '−10 graden', '100 graden'], ''],
    ['Welke temperatuur is het koudst?', '-12 graden', ['-2 graden', '0 graden', '5 graden'], ''],
    ['Welk getal staat links van 0 op de getallenlijn?', 'negatieve getallen', ['positieve getallen', 'breuken', 'even getallen'], ''],
    ['Wat is het tegengestelde van 7?', '-7', ['7', '0', '1/7'], ''],
    ['Wat is het tegengestelde van -4?', '4', ['-4', '0', '-1/4'], ''],
    ['Een duiker zit 12 meter onder water. Welk getal hoort daar bij?', '-12', ['12', '0', '-1'], ''],
    ['Op de begane grond staat de lift op 0. Twee verdiepingen lager (parkeergarage) is ...', '-2', ['2', '0', '-1'], ''],
    ['Hoeveel is 5 − 5?', '0', ['10', '-5', '5'], ''],
    ['Hoeveel is -3 + 3?', '0', ['-6', '6', '3'], ''],
  ]);
  K.tfs([['-5 is kleiner dan -2.', true], ['-1 is groter dan 0.', false], ['0 is geen negatief getal.', true], ['-10 is groter dan -9.', false], ['Een temperatuur van -3 graden is kouder dan -1 graad.', true], ['3 − 7 = −4', true], ['2 − 9 = −6', false, '2 − 9 = −7.'], ['-4 + 4 = 0', true]]);
  return K.out();
}

function machten() {
  const K = kit({ id: 'machten-wortels', name: 'Machten en wortels', emoji: '√', group: 'Rekenen', desc: 'Kwadraten, derde machten, machten van 2 en 10, en wortels.' });
  for (let n = 1; n <= 15; n++) {
    num(K, `${n}² = ?`, n * n, `${n}*${n}`, { d: n <= 6 ? 1 : 2, x: `${n}² = ${n} × ${n} = ${n * n}` });
    if (n > 1) K.mc(`Wat is ${n} in het kwadraat?`, String(n * n), [n * n + n, n * n - n, n * (n + 1) - 1, 2 * n, n * n + 1].filter((z) => z > 0 && z !== n * n).map(String), { d: 2, c: `${n}*${n}`, cf: 'str' });
    num(K, `√${n * n} = ?`, n, `Math.sqrt(${n * n})`, { d: n <= 6 ? 2 : 3, x: `${n} × ${n} = ${n * n}, dus de wortel van ${n * n} is ${n}.` });
    K.tf(`De wortel van ${n * n} is ${n}.`, true, { d: 1, c: 'true' });
    K.tf(`De wortel van ${n * n} is ${n + 1}.`, false, { d: 2, c: 'false', x: `${n} × ${n} = ${n * n}.` });
  }
  for (let n = 1; n <= 8; n++) { num(K, `${n}³ = ?`, n ** 3, `${n}**3`, { d: 3, x: `${n} × ${n} × ${n} = ${n ** 3}` }); K.mc(`${n} tot de macht 3 is ...`, String(n ** 3), [n * 3, n * n, n ** 3 + n, n ** 3 - 1].filter((z) => z > 0 && z !== n ** 3).map(String), { d: 3, c: `${n}**3`, cf: 'str' }); }
  for (let k = 0; k <= 10; k++) { num(K, `2^${k} = ?`, 2 ** k, `2**${k}`, { d: k > 6 ? 3 : 2, x: `2 vermenigvuldigd met zichzelf, ${k} keer.` }); }
  for (let k = 1; k <= 6; k++) { num(K, `10^${k} = ?`, 10 ** k, `10**${k}`, { d: 2, x: `Een 1 met ${k} nullen.` }); K.mc(`Hoeveel nullen heeft 10^${k}?`, String(k), [k + 1, k - 1 > 0 ? k - 1 : k + 2, k * 2].map(String), { d: 1, c: String(k), cf: 'str' }); }
  for (let a = 2; a <= 5; a++) for (let k = 2; k <= 4; k++) { if (a ** k > 700) continue; num(K, `${a}^${k} = ?`, a ** k, `${a}**${k}`, { d: 3, x: `${a} ${'× ' + a + ' '}`.repeat(1).trim() + ` ...` }); }
  for (const n of [0, 1]) for (const k of [2, 3, 5]) num(K, `${n}^${k} = ?`, n ** k, `${n}**${k}`, { d: 2 });
  for (const n of [2, 3, 5, 10, 12]) K.tf(`${n}² is hetzelfde als ${n} × ${n}.`, true, { d: 1 });
  for (const [n, c] of [[50, 7], [30, 5], [10, 3], [70, 8], [90, 9], [20, 4]]) K.mc(`Tussen welke twee hele getallen ligt de wortel van ${n}?`, `${Math.floor(Math.sqrt(n))} en ${Math.floor(Math.sqrt(n)) + 1}`, [`${Math.floor(Math.sqrt(n)) + 1} en ${Math.floor(Math.sqrt(n)) + 2}`, `${Math.floor(Math.sqrt(n)) - 1} en ${Math.floor(Math.sqrt(n))}`, `${Math.floor(Math.sqrt(n)) + 2} en ${Math.floor(Math.sqrt(n)) + 3}`], { d: 3, c: `Math.floor(Math.sqrt(${n}))`, cf: 'skip' });
  K.mcs([
    ['Welk getal is een kwadraat?', '49', ['48', '50', '45'], '7 × 7 = 49.'],
    ['Welk getal is een kwadraat?', '81', ['80', '82', '72'], '9 × 9 = 81.'],
    ['Welk getal is GEEN kwadraat?', '30', ['25', '36', '49'], ''],
    ['Wat is de wortel van 1?', '1', ['0', '2', '10'], ''],
    ['Wat is de wortel van 0?', '0', ['1', '10', 'bestaat niet'], ''],
  ]);
  return K.out();
}

export const builders = [breuken, procenten, meten, meetkunde, getallenrijen, verhaal, schatten, negatief, machten];
