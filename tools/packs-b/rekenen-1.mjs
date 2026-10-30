// Rekenpacks deel 1: tafels, delen, optellen/aftrekken, geld, klok.
// Alle sommen krijgen een rekencontrole (c = JS-expressie) die tools/test-learn-packsb.mjs onafhankelijk herrekent.
import { kit, nl, eur, eurShort } from './lib.mjs';

const NAMES = ['Sem', 'Emma', 'Liam', 'Noor', 'Finn', 'Mila', 'Daan', 'Lotte', 'Tim', 'Fleur', 'Jens', 'Sara', 'Bram', 'Eva', 'Lars', 'Tess', 'Luuk', 'Anna', 'Milan', 'Julia'];
const THINGS = ['knikkers', 'stickers', 'appels', 'boeken', 'koekjes', 'potloden', 'kaartjes', 'ballonnen', 'speelgoedautootjes', 'sinaasappels', 'schelpen', 'munten'];

function num(K, q, a, c, o = {}) { return K.num(q, a, { c, ...o }); }
function mcn(K, q, a, c, o = {}) {
  const wr = K.near(a, 5, { step: o.step || 1, min: o.min }).map(nl);
  const { step, min, ...rest } = o;
  return K.mc(q, nl(a), wr, { c, ...rest });
}
function tfn(K, q, truth, c, o = {}) { return K.tf(q, truth, { c, ...o }); }

const EM = { 2: '2️⃣', 3: '3️⃣', 4: '4️⃣', 5: '5️⃣', 6: '6️⃣', 7: '7️⃣', 8: '8️⃣', 9: '9️⃣', 10: '🔟' };

function storyMul(K, a, n, idx, d) {
  const p = a * n;
  const nm = NAMES[(a * 3 + n) % NAMES.length];
  const T = [
    [`Er zijn ${a} zakjes met elk ${n} snoepjes. Hoeveel snoepjes zijn dat samen?`, p, `${a}*${n}`],
    [`Een doos heeft ${n} koekjes. ${nm} koopt ${a} dozen. Hoeveel koekjes zijn dat?`, p, `${a}*${n}`],
    [`${p} knikkers worden eerlijk verdeeld over ${n} kinderen. Hoeveel krijgt ieder kind?`, a, `${p}/${n}`],
    [`Een bus heeft ${n} stoelen. Hoeveel stoelen hebben ${a} bussen samen?`, p, `${a}*${n}`],
    [`${nm} legt ${p} stickers in ${a} gelijke stapels. Hoeveel stickers komen er in één stapel?`, n, `${p}/${a}`],
    [`Elke week spaart ${nm} ${n} euro. Hoeveel euro heeft ${nm} na ${a} weken?`, p, `${a}*${n}`],
    [`Een pak bevat ${n} potloden. Er zijn ${p} potloden. Hoeveel pakken zijn dat?`, a, `${p}/${n}`],
    [`Er staan ${a} rijen met ${n} stoelen. Hoeveel stoelen zijn dat?`, p, `${a}*${n}`],
    [`${nm} leest elke dag ${n} bladzijden. Hoeveel bladzijden leest ${nm} in ${a} dagen?`, p, `${a}*${n}`],
    [`${p} appels gaan in kratten van ${n}. Hoeveel kratten heb je nodig?`, a, `${p}/${n}`],
  ];
  const t = T[idx % T.length];
  num(K, t[0], t[1], t[2], { d, x: `${a} × ${n} = ${p}` });
}

function tafelKit(n) {
  const K = kit({ id: `tafel-${n}`, name: `Tafel van ${n}`, emoji: EM[n], group: 'Rekenen', desc: `Alles over de tafel van ${n}: keer, delen, ontbrekend getal en verhaaltjes.` });
  for (let a = 1; a <= 10; a++) {
    const p = n * a;
    const d = [2, 5, 10].includes(n) || a === 1 || a === 10 ? 1 : (n >= 7 && a >= 6 ? 3 : 2);
    const x = `${n} × ${a} = ${p}`;
    num(K, `${n} × ${a} = ?`, p, `${n}*${a}`, { d, x });
    // mc: de verkeerde opties zijn buren in de tafel
    const wr = [n * (a + 1), n * (a - 1), n * (a + 2), n * (a - 2), p + 1, p - 1, p + 2, p - 2].filter((v) => v > 0 && v !== p).map(String);
    K.mc(`Reken uit: ${a} × ${n}`, String(p), wr, { c: `${a}*${n}`, cf: 'str', d, x });
    num(K, `${n} × ? = ${p}`, a, `${p}/${n}`, { d: Math.min(3, d + (a > 1 ? 1 : 0)), x });
    num(K, `${p} ÷ ${n} = ?`, a, `${p}/${n}`, { d: Math.min(3, d + 1), x: `${p} ÷ ${n} = ${a}, want ${n} × ${a} = ${p}` });
    num(K, `? × ${a} = ${p}`, n, `${p}/${a}`, { d: Math.min(3, d + 1), x });
    tfn(K, `${n} × ${a} = ${p}`, true, 'true', { d: 1, x });
    const bad = [p + n, p - n, p + 1, p - 1, p + 2].filter((v) => v > 0 && v !== p)[(a + n) % 4];
    tfn(K, `${a} × ${n} = ${bad}`, false, 'false', { d, x });
    storyMul(K, a, n, a + n, d);
    storyMul(K, a, n, a + n + 3, Math.min(3, d + 1));
    const bad2 = n * a + (a % 2 ? n : -n);
    if (bad2 > 0 && bad2 !== p) tfn(K, `Het antwoord van ${n} × ${a} is ${p}.`, true, 'true', { d: 1, x });
  }
  // tellen met sprongen
  for (let j = 1; j <= 5; j++) {
    const seq = [0, 1, 2, 3].map((i) => n * (j + i));
    K.order(`Zet de tafel van ${n} in de goede volgorde (stijgend)`, seq, { d: 1, x: `Je telt steeds ${n} erbij.`, c: `[${seq.join(',')}]`, cf: 'arr' });
    num(K, `${seq.slice(0, 3).join(', ')}, ... Wat is het volgende getal?`, seq[3], `${seq[2]}+${n}`, { d: 1, x: `Telkens +${n}.` });
    num(K, `${seq[3]}, ${seq[2]}, ${seq[1]}, ... Wat komt hierna (terugtellen)?`, seq[0], `${seq[1]}-${n}`, { d: 2, x: `Telkens −${n}.` });
  }
  // welke getallen horen erbij
  for (let m = 0; m < 5; m++) {
    const good = K.shuf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 2 + (m % 2)).map((v) => n * v);
    const bad = K.shuf(good.map((g) => g + (n > 2 ? 1 : 1)).concat(good.map((g) => g - 1)).filter((v) => v > 0 && v % n !== 0)).slice(0, 2);
    if (bad.length === 2) K.multi(`Welke getallen staan in de tafel van ${n}?`, K.shuf([...good, ...bad]), good, { d: 2, x: `Een getal staat in de tafel van ${n} als je het kunt delen door ${n}.` });
  }
  // verdubbelen / dubbele tafel
  if (n % 2 === 0) for (let a = 2; a <= 9; a += 1) { const h = n / 2; if (h >= 1) num(K, `De helft van ${n} is ${h}. Dus ${n} × ${a} is het dubbele van ${h} × ${a}. Hoeveel is ${n} × ${a}?`, n * a, `${n}*${a}`, { d: 3, x: `${h} × ${a} = ${h * a}, en dubbel is ${n * a}.` }); }
  // grote sprongen met tafel 10 en 5 en 2 uitleg
  return K.out();
}

function tafelsGemengd() {
  const K = kit({ id: 'tafels-gemengd', name: 'Alle tafels door elkaar', emoji: '✖️', group: 'Rekenen', desc: 'De tafels van 2 tot en met 10 door elkaar: keer, delen en verhaaltjes.' });
  for (let a = 2; a <= 10; a++) for (let b = 2; b <= 10; b++) {
    const p = a * b;
    const d = [2, 5, 10].includes(a) || [2, 5, 10].includes(b) ? 1 : (a >= 7 && b >= 7 ? 3 : 2);
    const x = `${a} × ${b} = ${p}`;
    num(K, `${a} × ${b} = ?`, p, `${a}*${b}`, { d, x });
    if ((a + b) % 2 === 0) {
      const wr = [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, p + 1, p - 1, p + 2].filter((v) => v > 0 && v !== p).map(String);
      K.mc(`Reken uit: ${a} × ${b}`, String(p), wr, { c: `${a}*${b}`, cf: 'str', d, x });
    } else {
      const bad = [p + a, p - b, p + 1, p - 1][(a * b) % 4];
      if (bad > 0 && bad !== p) tfn(K, `${a} × ${b} = ${bad}`, false, 'false', { d, x });
      tfn(K, `${a} × ${b} = ${p}`, true, 'true', { d: Math.max(1, d - 1), x });
    }
  }
  for (let a = 2; a <= 10; a++) for (let b = a; b <= 10; b++) {
    const p = a * b; const d = [2, 5, 10].includes(a) ? 1 : 2;
    num(K, `${p} ÷ ${a} = ?`, b, `${p}/${a}`, { d: Math.min(3, d + 1), x: `${a} × ${b} = ${p}` });
  }
  for (let i = 0; i < 40; i++) { const a = 2 + (i % 9), b = 2 + ((i * 7 + 3) % 9); storyMul(K, a, b, i, 2); }
  for (let j = 2; j <= 10; j++) {
    const seq = [1, 2, 3, 4].map((i) => j * i);
    K.order(`Zet de tafel van ${j} in de goede volgorde (stijgend)`, seq, { d: 1, c: `[${seq.join(',')}]`, cf: 'arr' });
  }
  return K.out();
}

function delenTafels() {
  const K = kit({ id: 'delen-tafels', name: 'Delen met de tafels', emoji: '➗', group: 'Rekenen', desc: 'Delen, delen met rest en eerlijk verdelen: je tafels andersom.' });
  for (let n = 2; n <= 10; n++) for (let a = 1; a <= 10; a++) {
    const p = n * a;
    const d = [2, 5, 10].includes(n) ? 1 : (n >= 7 ? 3 : 2);
    if ((n + a) % 3 !== 0) num(K, `${p} ÷ ${n} = ?`, a, `${p}/${n}`, { d, x: `${n} × ${a} = ${p}` });
    else mcn(K, `Hoeveel is ${p} gedeeld door ${n}?`, a, `${p}/${n}`, { d, x: `${n} × ${a} = ${p}` });
    if (a % 2 === 0) tfn(K, `${p} ÷ ${n} = ${a}`, true, 'true', { d: 1, x: `${n} × ${a} = ${p}` });
    else { const bad = a + ((n + a) % 2 ? 1 : -1); if (bad > 0) tfn(K, `${p} ÷ ${n} = ${bad}`, false, 'false', { d, x: `${n} × ${a} = ${p}` }); }
  }
  // delen met rest
  for (let n = 3; n <= 9; n++) for (let a = 2; a <= 8; a++) {
    const r = 1 + ((n * a) % (n - 1));
    const p = n * a + r;
    if ((n + a) % 2 === 0) {
      num(K, `Deel ${p} door ${n}. Hoeveel blijft er over (de rest)?`, r, `${p}%${n}`, { d: 3, x: `${n} × ${a} = ${n * a}, en ${p} − ${n * a} = ${r}.` });
    } else {
      num(K, `Je deelt ${p} snoepjes eerlijk over ${n} kinderen. Hoeveel snoepjes blijven er over?`, r, `${p}%${n}`, { d: 3, x: `Ieder kind krijgt ${a} snoepjes (${n * a}). Er blijven ${r} over.` });
    }
  }
  // eerlijk verdelen verhaaltjes
  const stories = ['knikkers', 'stickers', 'snoepjes', 'kaartjes', 'ballonnen', 'koekjes', 'appels', 'euro'];
  for (let i = 0; i < 45; i++) {
    const n = 2 + (i % 9), a = 2 + ((i * 5 + 1) % 9), p = n * a; const th = stories[i % stories.length]; const nm = NAMES[i % NAMES.length];
    num(K, `${nm} heeft ${p} ${th} en verdeelt ze eerlijk over ${n} vriendjes. Hoeveel krijgt ieder vriendje?`, a, `${p}/${n}`, { d: 2, x: `${p} ÷ ${n} = ${a}` });
  }
  for (let i = 0; i < 22; i++) {
    const n = 2 + (i % 9), a = 2 + ((i * 3 + 2) % 9), p = n * a;
    K.fill(`${p} ÷ ${n} = ___`, String(a), [a + 1, a - 1, a + 2, a * 2].filter((v) => v > 0 && v !== a).map(String), { d: 2, c: `${p}/${n}`, cf: 'str', x: `${n} × ${a} = ${p}` });
  }
  for (let n = 2; n <= 10; n++) K.tf(`Als ${n} × 6 = ${n * 6}, dan is ${n * 6} ÷ 6 = ${n}.`, true, { d: 2, c: 'true' });
  return K.out();
}

/* ---------------- optellen en aftrekken ---------------- */
function optellen20() {
  const K = kit({ id: 'optellen-20', name: 'Optellen tot 20', emoji: '➕', group: 'Rekenen', desc: 'Plussommen tot 20: dubbelen, tot 10 aanvullen en over de tien heen.' });
  const all = [];
  for (let a = 1; a <= 19; a++) for (let b = 1; a + b <= 20; b++) all.push([a, b]);
  const sel = K.shuf(all).slice(0, 90);
  sel.forEach(([a, b], i) => {
    const s = a + b; const d = s <= 10 ? 1 : (a <= 9 && b <= 9 ? 2 : 3);
    if (i % 3 === 0) mcn(K, `${a} + ${b} = ?`, s, `${a}+${b}`, { d });
    else num(K, `${a} + ${b} = ?`, s, `${a}+${b}`, { d });
    if (i % 4 === 0) tfn(K, `${a} + ${b} = ${s}`, true, 'true', { d: 1 });
    if (i % 4 === 2) { const bad = s + (i % 3 === 0 ? 1 : -1); tfn(K, `${a} + ${b} = ${bad}`, false, 'false', { d }); }
  });
  for (let a = 0; a <= 9; a++) num(K, `${a} + ? = 10`, 10 - a, `10-${a}`, { d: 1, x: `${a} + ${10 - a} = 10` });
  for (let a = 11; a <= 19; a++) num(K, `${a} + ? = 20`, 20 - a, `20-${a}`, { d: 2, x: `${a} + ${20 - a} = 20` });
  for (let a = 1; a <= 10; a++) num(K, `Het dubbele van ${a} is ...`, 2 * a, `2*${a}`, { d: 1, x: `${a} + ${a} = ${2 * a}` });
  for (let a = 2; a <= 9; a++) num(K, `${a} + ${a + 1} = ? (bijna dubbel)`, 2 * a + 1, `${a}+${a + 1}`, { d: 2, x: `Dubbel ${a} is ${2 * a}, plus 1 is ${2 * a + 1}.` });
  for (let i = 0; i < 24; i++) {
    const a = 3 + (i % 7), b = 2 + ((i * 3) % 9); const nm = NAMES[i % NAMES.length]; const th = THINGS[i % THINGS.length];
    if (a + b <= 20) num(K, `${nm} heeft ${a} ${th} en krijgt er ${b} bij. Hoeveel ${th} heeft ${nm} nu?`, a + b, `${a}+${b}`, { d: 2 });
  }
  // brug over de tien
  for (let a = 6; a <= 9; a++) for (let b = 4; b <= 9; b++) if (a + b > 10 && a + b <= 20 && (a * b) % 3 === 0) num(K, `${a} + ${b} = ? (tip: eerst naar de 10)`, a + b, `${a}+${b}`, { d: 2, x: `${a} + ${10 - a} = 10, en dan nog ${b - (10 - a)} erbij.` });
  return K.out();
}

function aftrekken20() {
  const K = kit({ id: 'aftrekken-20', name: 'Aftrekken tot 20', emoji: '➖', group: 'Rekenen', desc: 'Minsommen tot 20: terugtellen, naar de tien en verschil.' });
  const all = [];
  for (let a = 2; a <= 20; a++) for (let b = 1; b < a; b++) all.push([a, b]);
  const sel = K.shuf(all).slice(0, 95);
  sel.forEach(([a, b], i) => {
    const s = a - b; const d = a <= 10 ? 1 : (a - (a % 10) >= b || b < 10 ? 2 : 3);
    if (i % 3 === 0) mcn(K, `${a} − ${b} = ?`, s, `${a}-${b}`, { d });
    else num(K, `${a} − ${b} = ?`, s, `${a}-${b}`, { d });
    if (i % 4 === 1) tfn(K, `${a} − ${b} = ${s}`, true, 'true', { d: 1 });
    if (i % 4 === 3) tfn(K, `${a} − ${b} = ${s + (i % 2 ? 1 : -1) || s + 2}`, false, 'false', { d });
  });
  for (let a = 10; a <= 20; a++) num(K, `${a} − 10 = ?`, a - 10, `${a}-10`, { d: 1 });
  for (let a = 1; a <= 9; a++) num(K, `10 − ${a} = ?`, 10 - a, `10-${a}`, { d: 1 });
  for (let a = 12; a <= 19; a++) num(K, `${a} − ? = 10`, a - 10, `${a}-10`, { d: 2 });
  for (let i = 0; i < 28; i++) {
    const a = 8 + (i % 13), b = 1 + ((i * 3) % (a - 2)); const nm = NAMES[(i * 2) % NAMES.length]; const th = THINGS[(i + 3) % THINGS.length];
    num(K, `${nm} heeft ${a} ${th}. ${nm} geeft er ${b} weg. Hoeveel ${th} heeft ${nm} nu nog?`, a - b, `${a}-${b}`, { d: 2 });
  }
  for (let i = 0; i < 16; i++) {
    const a = 12 + (i % 8), b = 3 + (i % 8);
    if (a > b) num(K, `Wat is het verschil tussen ${a} en ${b}?`, a - b, `${a}-${b}`, { d: 2, x: `Het verschil bereken je met ${a} − ${b}.` });
  }
  return K.out();
}

function optAftr100() {
  const K = kit({ id: 'optellen-aftrekken-100', name: 'Optellen en aftrekken tot 100', emoji: '💯', group: 'Rekenen', desc: 'Tientallen, rekenen met een brug en splitsen: plus en min tot 100.' });
  for (let i = 0; i < 20; i++) {
    const a = 10 * (1 + (i % 9)), b = 10 * (1 + ((i * 7 + 2) % (9)));
    if (a + b <= 100) num(K, `${a} + ${b} = ?`, a + b, `${a}+${b}`, { d: 1 });
    if (a > b) num(K, `${a} − ${b} = ?`, a - b, `${a}-${b}`, { d: 1 });
  }
  for (let i = 0; i < 70; i++) { // zonder brug
    const t1 = 1 + (i * 3) % 7, e1 = (i * 5) % 6, t2 = (i * 2) % 3 + 1, e2 = (i * 7) % 4;
    const a = t1 * 10 + e1, b = t2 * 10 + e2;
    if (a + b <= 100) { if (i % 2) mcn(K, `${a} + ${b} = ?`, a + b, `${a}+${b}`, { d: 2, step: 10 }); else num(K, `${a} + ${b} = ?`, a + b, `${a}+${b}`, { d: 2 }); }
    if (a > b) { if (i % 3 === 0) mcn(K, `${a} − ${b} = ?`, a - b, `${a}-${b}`, { d: 2, step: 10 }); else num(K, `${a} − ${b} = ?`, a - b, `${a}-${b}`, { d: 2 }); }
  }
  for (let i = 0; i < 70; i++) { // met brug
    const a = 15 + (i * 7) % 60, b = 6 + (i * 11) % 29;
    if (a % 10 + b % 10 >= 10 && a + b <= 100) num(K, `${a} + ${b} = ?`, a + b, `${a}+${b}`, { d: 3, x: `Eerst naar het volgende tiental: ${a} + ${10 - (a % 10)} = ${a + 10 - (a % 10)}.` });
    const c = 31 + (i * 13) % 65, e = 4 + (i * 17) % 40;
    if (c % 10 < e % 10 && c > e) num(K, `${c} − ${e} = ?`, c - e, `${c}-${e}`, { d: 3 });
  }
  for (let i = 0; i < 12; i++) { const a = 5 * (i + 2); K.tf(`${a} + ${100 - a} = 100`, true, { d: 1, c: 'true' }); }
  for (let a = 10; a <= 90; a += 10) num(K, `${a} + ? = 100`, 100 - a, `100-${a}`, { d: 1 });
  for (let a = 5; a <= 95; a += 15) num(K, `${a} + ? = 100`, 100 - a, `100-${a}`, { d: 2 });
  for (let i = 0; i < 20; i++) {
    const a = 24 + (i * 7) % 40, b = 10 + (i * 5) % 30; const nm = NAMES[i % NAMES.length]; const th = THINGS[(i * 3) % THINGS.length];
    if (a + b <= 100) num(K, `${nm} heeft ${a} ${th} en vindt er ${b} bij. Hoeveel ${th} heeft ${nm} nu?`, a + b, `${a}+${b}`, { d: 2 });
    num(K, `In een doos zitten ${a + b} ${th}. ${b} ${th} zijn kapot. Hoeveel zijn er nog heel?`, a, `${a + b}-${b}`, { d: 2 });
  }
  for (let i = 0; i < 20; i++) { const a = 20 + (i * 9) % 70; K.fill(`${a} = ${Math.floor(a / 10) * 10} + ___`, String(a % 10), [(a % 10) + 1, (a % 10) + 10, (a % 10) + 2, Math.abs((a % 10) - 1)].map(String), { d: 1, c: `${a}%10`, cf: 'str', x: 'Splits in tientallen en eenheden.' }); }
  for (let i = 0; i < 14; i++) { const a = 30 + i * 4; K.tf(`${a} + ${a} = ${2 * a + (i % 2 ? 0 : 10)}`, i % 2 === 1, { d: 2, c: `${a}+${a}==${2 * a + (i % 2 ? 0 : 10)}` }); }
  return K.out();
}

function rekenen1000() {
  const K = kit({ id: 'rekenen-1000', name: 'Rekenen tot 1000', emoji: '🔢', group: 'Rekenen', desc: 'Honderdtallen, optellen en aftrekken tot 1000, plaatswaarde en afronden.' });
  for (let i = 0; i < 24; i++) {
    const a = 100 * (1 + (i % 8)), b = 100 * (1 + ((i * 3 + 1) % 5));
    if (a + b <= 1000) num(K, `${a} + ${b} = ?`, a + b, `${a}+${b}`, { d: 1 });
    if (a > b) num(K, `${a} − ${b} = ?`, a - b, `${a}-${b}`, { d: 1 });
  }
  for (let i = 0; i < 70; i++) {
    const a = 120 + (i * 37) % 700, b = 25 + (i * 53) % 250;
    if (a + b < 1000) { if (i % 3 === 0) mcn(K, `${a} + ${b} = ?`, a + b, `${a}+${b}`, { d: 3, step: 10 }); else num(K, `${a} + ${b} = ?`, a + b, `${a}+${b}`, { d: a % 10 + b % 10 >= 10 ? 3 : 2 }); }
    if (a > b) { if (i % 3 === 1) mcn(K, `${a} − ${b} = ?`, a - b, `${a}-${b}`, { d: 3, step: 10 }); else num(K, `${a} − ${b} = ?`, a - b, `${a}-${b}`, { d: 3 }); }
  }
  for (let i = 0; i < 24; i++) {
    const n = 100 + ((i * 197) % 900); const dig = [Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10];
    const place = i % 3; const names = ['honderdtallen', 'tientallen', 'eenheden'];
    const val = [dig[0], dig[1], dig[2]][place];
    num(K, `Hoeveel ${names[place]} zitten er in het getal ${n}? (alleen dat cijfer)`, val, `Math.floor(${n}/${[100, 10, 1][place]})%10`, { d: 2, x: `${n} = ${dig[0]} honderdtallen, ${dig[1]} tientallen, ${dig[2]} eenheden.` });
  }
  for (let i = 0; i < 20; i++) {
    const n = 110 + (i * 83) % 880; const r10 = Math.round(n / 10) * 10; const r100 = Math.round(n / 100) * 100;
    if (n % 10 !== 5) num(K, `Rond ${n} af op tientallen.`, r10, `Math.round(${n}/10)*10`, { d: 2, x: 'Kijk naar de eenheden: 5 of meer rond je omhoog af.' });
    if (n % 100 !== 50) num(K, `Rond ${n} af op honderdtallen.`, r100, `Math.round(${n}/100)*100`, { d: 2 });
  }
  for (let i = 0; i < 22; i++) {
    const a = 100 + (i * 71) % 880, b = 100 + (i * 113) % 880;
    if (a !== b) K.mc(`Vergelijk ${a} en ${b}. Het eerste getal is ...`, a < b ? 'kleiner' : 'groter', ['kleiner', 'groter', 'even groot'].filter((z) => z !== (a < b ? 'kleiner' : 'groter')).concat(['niet te vergelijken']), { d: 1, c: `${a}<${b}?'kleiner':'groter'`, cf: 'str', x: `${Math.max(a, b)} is het grootste getal.` });
  }
  for (let i = 0; i < 12; i++) { const a = 1 + (i % 9); num(K, `${a} × 100 = ?`, a * 100, `${a}*100`, { d: 1 }); num(K, `${a * 100} ÷ 10 = ?`, a * 10, `${a * 100}/10`, { d: 1 }); num(K, `${a} × 10 = ?`, a * 10, `${a}*10`, { d: 1 }); }
  for (let i = 0; i < 22; i++) { const a = 250 + (i * 31) % 500, b = 100 + (i * 29) % 200; const nm = NAMES[i % NAMES.length]; num(K, `${nm} fietst ${a} meter heen en ${b} meter terug langs een andere route. Hoeveel meter is dat samen?`, a + b, `${a}+${b}`, { d: 2 }); }
  for (let i = 0; i < 4; i++) {
    const base = 100 + i * 150;
    const seq = [base, base + 100, base + 200, base + 300];
    K.order('Zet in volgorde van klein naar groot', K.shuf([seq[2] + 15, seq[0] - 20, seq[3] + 5, seq[1] + 40]).slice().sort((x, y) => x - y), { d: 1 });
  }
  return K.out();
}

/* ---------------- geld ---------------- */
function geldRekenen() {
  const K = kit({ id: 'geld-rekenen', name: 'Rekenen met geld', emoji: '💶', group: 'Rekenen', desc: 'Euro en cent: munten, prijzen, optellen en wisselgeld.' });
  const eurM = (cents) => eur(cents);
  const coins = [[1, '1 cent'], [2, '2 cent'], [5, '5 cent'], [10, '10 cent'], [20, '20 cent'], [50, '50 cent'], [100, '1 euro'], [200, '2 euro']];
  for (const [c, nm] of coins) {
    K.mc(`Hoeveel cent is een munt van ${nm} waard?`, String(c), [1, 2, 5, 10, 20, 50, 100, 200].filter((z) => z !== c).map(String), { d: 1, c: String(c), cf: 'str', x: `1 euro is 100 cent.` });
    K.tf(`Er bestaat een munt van ${nm}.`, true, { d: 1, c: 'true' });
  }
  K.tfs([['Er bestaat een munt van 3 euro.', false, 'De euromunten zijn 1, 2, 5, 10, 20, 50 cent en 1 en 2 euro.'], ['Er bestaat een munt van 25 cent.', false, 'Wel 20 en 50 cent.'], ['Er bestaat een biljet van 20 euro.', true], ['Er bestaat een biljet van 15 euro.', false], ['Er bestaat een biljet van 5 euro.', true], ['Er bestaat een biljet van 100 euro.', true], ['Er bestaat een biljet van 30 euro.', false], ['100 cent is 1 euro.', true], ['10 cent is 1 euro.', false], ['2 munten van 50 cent zijn samen 1 euro.', true], ['4 munten van 25 cent zijn samen 1 euro.', false, 'Er bestaan geen munten van 25 cent.']]);
  K.mcs([
    ['Welk biljet is het kleinst?', '5 euro', ['10 euro', '20 euro', '50 euro'], 'Het kleinste biljet is 5 euro.'],
    ['Welke munt is het meest waard?', '2 euro', ['1 euro', '50 cent', '20 cent'], ''],
    ['Hoeveel cent is 1 euro en 50 cent samen?', '150', ['15', '105', '1050'], '1 euro is 100 cent, dus 100 + 50 = 150.'],
    ['Hoeveel cent is 2 euro?', '200', ['20', '2000', '102'], ''],
  ]);
  for (let i = 0; i < 12; i++) { const e = 1 + (i % 9); num(K, `${e} euro is hoeveel cent?`, e * 100, `${e}*100`, { d: 1 }); num(K, `${e * 100} cent is hoeveel euro?`, e, `${e * 100}/100`, { d: 1 }); }
  const items = [['een ijsje', 150], ['een appel', 60], ['een pen', 125], ['een schrift', 275], ['een broodje', 235], ['een pakje drinken', 80], ['een stuk fruit', 90], ['een voetbal', 1250], ['een boek', 895], ['een puzzel', 1495], ['een kauwgom', 45], ['een stickervel', 199], ['een tijdschrift', 450], ['een speelgoedauto', 399], ['een cadeaubonnetje', 1000], ['een kaartje voor de bioscoop', 850], ['een zakje chips', 185], ['een lolly', 50], ['een koekje', 70], ['een tekenblok', 320]];
  for (let i = 0; i < items.length; i++) {
    const [it, pr] = items[i]; const n = 2 + (i % 4); const tot = pr * n;
    K.mc(`${it[0].toUpperCase() + it.slice(1)} kost ${eur(pr)}. Wat kosten ${n} van deze samen?`, eurM(tot), [pr * (n + 1), pr * (n - 1), tot + 10, tot - 10, tot + 100].filter((v) => v > 0 && v !== tot).map(eurM), { d: 3, c: `${pr}*${n}`, cf: 'eur', x: `${n} × ${eur(pr)} = ${eur(tot)}` });
    const pay = [500, 1000, 2000, 1000, 500][i % 5]; const price = Math.min(pr, pay - 5);
    const ch = pay - price;
    K.mc(`Je koopt ${it} van ${eur(price)} en betaalt met ${eurShort(pay)}. Hoeveel wisselgeld krijg je?`, eurM(ch), [ch + 10, ch - 10, ch + 100, ch - 5, ch + 50].filter((v) => v > 0 && v !== ch).map(eurM), { d: 3, c: `${pay}-${price}`, cf: 'eur', x: `${eurShort(pay)} − ${eur(price)} = ${eur(ch)}` });
  }
  for (let i = 0; i < 20; i++) {
    const a = 25 + ((i * 45) % 400), b = 10 + ((i * 35) % 300); const nm = NAMES[i % NAMES.length];
    K.mc(`${nm} koopt iets van ${eur(a)} en iets van ${eur(b)}. Hoeveel moet ${nm} samen betalen?`, eurM(a + b), [a + b + 10, a + b - 10, a + b + 100, a + b - 100, a + b + 5].filter((v) => v > 0).map(eurM), { d: 3, c: `${a}+${b}`, cf: 'eur', x: `${eur(a)} + ${eur(b)} = ${eur(a + b)}` });
    const money = a + b + 200;
    K.mc(`${nm} heeft ${eur(money)} en geeft ${eur(b)} uit. Hoeveel houdt ${nm} over?`, eurM(money - b), [money - b + 10, money - b - 10, money - b + 100, money - b - 100, money - b + 5].filter((v) => v > 0).map(eurM), { d: 3, c: `${money}-${b}`, cf: 'eur', x: `${eur(money)} − ${eur(b)} = ${eur(money - b)}` });
  }
  for (let i = 0; i < 20; i++) { const e = 1 + (i % 7), c = 10 * (1 + (i % 9)); const tot = e * 100 + c; num(K, `${e} euro en ${c} cent is samen hoeveel cent?`, tot, `${e}*100+${c}`, { d: 2 }); }
  for (let i = 0; i < 14; i++) { const w = 5 * (2 + i); const n = [2, 3, 4, 5][i % 4]; num(K, `Je spaart elke week ${w} cent... Hoeveel cent heb je na ${n} weken?`, w * n, `${w}*${n}`, { d: 2 }); }
  for (let i = 0; i < 12; i++) { const w = 1 + (i % 5); const n = 2 + (i % 4); num(K, `Je spaart elke maand ${w} euro. Hoeveel euro heb je na ${n} maanden?`, w * n, `${w}*${n}`, { d: 1 }); }
  // welke munten
  const sets = [[[50, 20, 20, 10], 100], [[100, 50, 20, 5], 175], [[200, 100, 50, 20], 370], [[10, 10, 5, 5], 30], [[50, 50, 1, 1], 102], [[20, 20, 20, 20], 80], [[200, 200, 100], 500], [[100, 100, 50, 50], 300], [[5, 5, 2, 1], 13], [[20, 10, 10, 5, 5], 50]];
  sets.forEach(([cs, tot], i) => {
    const names = cs.map((c) => (c >= 100 ? c / 100 + ' euro' : c + ' cent'));
    K.mc(`Je hebt munten van ${names.join(', ')}. Hoeveel is dat samen?`, eurM(tot), [tot + 10, tot - 10, tot + 100, tot - 5, tot + 5].filter((v) => v > 0).map(eurM), { d: 3, c: cs.join('+'), cf: 'eur' });
  });
  return K.out();
}

/* ---------------- klok ---------------- */
const HW = ['twaalf', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf'];
export function clockNL(h, m) { // Nederlandse uitspraak
  const hw = (x) => HW[x % 12 === 0 ? 12 : x % 12];
  if (m === 0) return `${hw(h)} uur`;
  if (m === 15) return `kwart over ${hw(h)}`;
  if (m === 30) return `half ${hw(h + 1)}`;
  if (m === 45) return `kwart voor ${hw(h + 1)}`;
  if (m < 15) return `${m === 5 ? 'vijf' : 'tien'} over ${hw(h)}`;
  if (m < 30) return `${m === 25 ? 'vijf' : 'tien'} voor half ${hw(h + 1)}`;
  if (m < 45) return `${m === 35 ? 'vijf' : 'tien'} over half ${hw(h + 1)}`;
  return `${m === 50 ? 'tien' : 'vijf'} voor ${hw(h + 1)}`;
}
const pad = (n) => String(n).padStart(2, '0');
const dig = (h, m) => `${h}:${pad(m)}`;
const EMO_H = ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚'];
const EMO_HALF = ['🕧', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦'];

function klokkijken() {
  const K = kit({ id: 'klokkijken', name: 'Klokkijken', emoji: '🕒', group: 'Rekenen', desc: 'Hele uren, halve uren, kwartieren, digitaal, 24-uurs en tijdsduur.' });
  const mins = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  // emoji-klokken: hele en halve uren
  for (let h = 1; h <= 12; h++) {
    K.mc('Hoe laat is het op deze klok?', dig(h, 0), [dig(h % 12 + 1, 0), dig((h + 10) % 12 + 1, 0), dig(h, 30), dig((h + 5) % 12 + 1, 0)], { e: EMO_H[h % 12], d: 1, c: `"${h}:00"`, cf: 'str', x: `De grote wijzer staat op de 12: het is ${h} uur.` });
    K.type('Hoe laat is het? (bijvoorbeeld 4:00)', dig(h, 0), [`${h} uur`, `${pad(h)}:00`, `${h}.00`], { e: EMO_H[h % 12], d: 2, c: `"${h}:00"`, cf: 'str' });
    K.mc('Hoe laat is het op deze klok?', dig(h, 30), [dig(h, 0), dig(h + 1 > 12 ? 1 : h + 1, 30), dig(h + 1 > 12 ? 1 : h + 1, 0), dig(h === 1 ? 12 : h - 1, 30)], { e: EMO_HALF[h % 12], d: 2, c: `"${h}:30"`, cf: 'str', x: `De grote wijzer staat op de 6: het is half uur, dus ${h}:30.` });
    K.mc(`Hoe zeg je ${dig(h, 30)} in het Nederlands?`, clockNL(h, 30), [clockNL(h, 0), `half ${HW[h % 12 === 0 ? 12 : h % 12]}`, `kwart over ${HW[h]}`, `kwart voor ${HW[h]}`], { d: 2, c: `clockNL(${h},30)`, cf: 'str', x: `Bij ${dig(h, 30)} zeg je "half" en dan het volgende uur.` });
  }
  // digitaal naar woorden
  let n = 0;
  for (let h = 1; h <= 12; h++) for (const m of mins) {
    if ((h * 7 + m) % 5 !== 0 && m % 15 !== 0) continue;
    const phrase = clockNL(h, m);
    const wr = [];
    for (const m2 of mins) if (m2 !== m) { const p2 = clockNL(h, m2); if (p2 !== phrase) wr.push(p2); }
    wr.push(clockNL(h % 12 + 1, m));
    if (n++ % 3 !== 2) K.mc(`Hoe zeg je ${dig(h, m)}?`, phrase, K.shuf(wr).slice(0, 5), { d: m % 15 === 0 ? 2 : 3, c: `clockNL(${h},${m})`, cf: 'str' });
    else K.mc(`Welke tijd is "${phrase}"?`, dig(h, m), mins.filter((z) => z !== m).map((z) => dig(h, z)).concat([dig(h % 12 + 1, m)]), { d: m % 15 === 0 ? 2 : 3, c: `"${h}:${pad(m)}"`, cf: 'str', x: `${phrase} = ${dig(h, m)}.` });
  }
  // wijzer-beschrijvingen
  const bigNum = (m) => m / 5 || 12;
  for (let h = 1; h <= 12; h += 1) for (const m of [0, 15, 30, 45, 5, 10, 20, 25, 35, 40, 50, 55]) {
    if ((h + m / 5) % 3 !== 0) continue;
    const small = m === 0 ? `De kleine wijzer staat op de ${h}` : `De kleine wijzer staat tussen de ${h} en de ${h % 12 + 1}`;
    K.mc(`${small} en de grote wijzer op de ${bigNum(m)}. Hoe laat is het?`, dig(h, m), mins.filter((z) => z !== m).map((z) => dig(h, z)).concat([dig(h % 12 + 1, m)]), { d: 3, c: `"${h}:${pad(m)}"`, cf: 'str', x: `Grote wijzer op de ${bigNum(m)} = ${m} minuten.` });
  }
  // minuten bij de grote wijzer
  for (let g = 1; g <= 12; g++) num(K, `De grote wijzer staat op de ${g}. Hoeveel minuten over het hele uur is dat?`, g === 12 ? 0 : g * 5, `${g}===12?0:${g}*5`, { d: 2, x: 'Elk getal op de klok is 5 minuten verder.' });
  // 24-uurs
  for (let h = 13; h <= 23; h++) {
    K.type(`Het is ${h}:00. Hoe laat is dat op een gewone klok (12-uurs, alleen het uur)?`, String(h - 12), [`${h - 12} uur`, `${h - 12}:00`], { d: 3, c: `${h}-12`, cf: 'str', x: `${h} − 12 = ${h - 12}` });
    K.mc(`Hoe laat is ${h - 12}:30 's middags/avonds in 24-uurs tijd?`, `${h}:30`, [`${h - 12}:30`, `${h + 1}:30`, `${h - 1}:30`, `${h}:00`].filter((z) => !z.startsWith('24')), { d: 3, c: `"${h - 12 + 12}:30"`, cf: 'str', x: 'Tel er 12 uur bij.' });
  }
  // duur
  for (let i = 0; i < 40; i++) {
    const h = 1 + (i % 11), m = [0, 15, 30, 45][i % 4]; const dur = [15, 30, 45, 60, 20, 10, 25][i % 7];
    const t = h * 60 + m + dur; const hh = Math.floor(t / 60) % 12 || 12; const mm = t % 60;
    const nm = NAMES[i % NAMES.length];
    const what = ['de film', 'de les', 'het voetbaltraining', 'het kookwedstrijdje', 'de pauze', 'het spel'][i % 6];
    K.mc(`Het is ${dig(h, m)}. ${what[0].toUpperCase() + what.slice(1)} duurt ${dur} minuten. Hoe laat is het dan?`.replace('het voetbaltraining', 'de training'), dig(hh, mm), [dig(hh, (mm + 15) % 60), dig(hh % 12 + 1, mm), dig(h, m), dig(hh, (mm + 30) % 60), dig(hh === 1 ? 12 : hh - 1, mm)], { d: 3, c: `"${hh}:${pad(mm)}"`, cf: 'str', x: `${dig(h, m)} + ${dur} minuten = ${dig(hh, mm)}` });
  }
  for (let i = 0; i < 14; i++) { const m = [5, 10, 15, 20, 25, 30][i % 6]; const h = 2 + (i % 6); K.mc(`Hoeveel minuten zitten er in ${m === 30 ? 'een half uur' : m === 15 ? 'een kwartier' : m + ' minuten'}?`.replace('zitten er in', 'is'), String(m), [m + 5, m - 5 > 0 ? m - 5 : m + 10, m * 2, m + 10], { d: 1, c: String(m), cf: 'str' }); }
  K.mcs([
    ['Hoeveel minuten heeft een uur?', '60', ['100', '30', '24', '12']],
    ['Hoeveel seconden heeft een minuut?', '60', ['100', '30', '24', '90']],
    ['Hoeveel uur heeft een dag?', '24', ['12', '60', '48', '20']],
    ['Hoeveel minuten is een kwartier?', '15', ['10', '20', '25', '30']],
    ['Hoeveel minuten is een half uur?', '30', ['15', '45', '20', '60']],
    ['Hoeveel minuten zijn 2 uur?', '120', ['60', '100', '200', '90']],
    ['Hoeveel minuten is anderhalf uur?', '90', ['80', '100', '120', '75']],
    ['Hoeveel minuten is driekwartier?', '45', ['35', '40', '50', '75']],
    ['Welke wijzer is het langst?', 'De grote wijzer (minuten)', ['De kleine wijzer (uren)', 'Ze zijn even lang', 'De wekker'], 'De grote wijzer wijst de minuten aan.'],
    ['Welke wijzer beweegt het langzaamst?', 'De kleine wijzer', ['De grote wijzer', 'De secondewijzer', 'Alle even snel']],
  ]);
  return K.out();
}

export const builders = [
  ...[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => () => tafelKit(n)),
  tafelsGemengd, delenTafels, optellen20, aftrekken20, optAftr100, rekenen1000, geldRekenen, klokkijken,
];
