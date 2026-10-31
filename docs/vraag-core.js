// Dagelijkse vraag: zuivere logica (vraagsoorten, antwoorden coderen, uitslag, overeenkomst, streak). Geen DOM/Firebase.
import { SECTIONS } from './vraag-bank.js?v=1';

export const BANK = SECTIONS.flatMap((s) => s[1]);
export const SECTION_OF = BANK.map((_, i) => { let n = 0; for (const [name, qs] of SECTIONS) { n += qs.length; if (i < n) return name; } return ''; });
export const SECTION_ICON = { Kennismaken: 'heart', Voorkeuren: 'star', Dromen: 'rocket', 'Wat zou je doen als': 'wand', Herinneringen: 'hourglass', 'Extra luchtige vragen': 'balloon' };
export const MIX_FROM = '2026-11-02'; // vanaf deze dag wisselt de bank af met speciale vraagsoorten (eerdere dagen blijven zoals ze waren)

export const TYPES = { open: { n: 'Open vraag', ic: 'pencil' }, kies: { n: 'Kies er één', ic: 'puzzle' }, liever: { n: 'Wat liever', ic: 'dice' }, schaal: { n: 'Schaal 1 tot 10', ic: 'target' }, janee: { n: 'Ja of nee', ic: 'lightbulb' }, emoji: { n: 'Kies een plaatje', ic: 'balloon' } };
const JANEE = ['Ja', 'Nee']; const SCALE = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

// [vraag, opties] -> typed vragen
const LIEVER = [
  ['altijd zomer', 'altijd winter'], ['ijs', 'taart'], ['pizza', 'pannenkoeken'], ['vliegen', 'onzichtbaar zijn'], ['een dier kunnen verstaan', 'razendsnel kunnen rennen'],
  ['een week lang op het strand', 'een week lang in de bergen'], ['elke dag chocolade', 'elke dag friet'], ['in een kasteel wonen', 'in een boomhut wonen'], ['de hele dag gamen', 'de hele dag buiten spelen'],
  ['een eigen bioscoop', 'een eigen zwembad'], ['kunnen toveren', 'door de tijd reizen'], ['een draak als huisdier', 'een eenhoorn als huisdier'], ['altijd de waarheid zeggen', 'nooit meer huiswerk hebben'],
  ['een jaar zonder snoep', 'een jaar zonder tv en telefoon'], ['onder water kunnen ademen', 'door muren kunnen lopen'], ['super slim zijn', 'super sterk zijn'], ['een dag op de maan', 'een dag op de bodem van de zee'],
  ['elke ochtend uitslapen', 'elke middag vrij hebben'], ['een robot als vriend', 'een alien als vriend'], ['zingen als een ster', 'dansen als een ster'], ['koken voor een koning', 'een bouwwerk maken voor een koning'],
  ['een reis door de ruimte', 'een reis door de oceaan'], ['kamperen in een tent', 'logeren in een luxe hotel'], ['elke dag pasta', 'elke dag rijst'], ['een sprookje in leven', 'een avontuur op een schatkaart'],
  ['sneeuw met Kerst', 'zon met Kerst'], ['een eigen eiland', 'een eigen berg'], ['de baas van een pretpark', 'de baas van een dierentuin'], ['een film maken', 'een spel bedenken'], ['superheld met een cape', 'superheld met een masker'],
];
const KIES = [
  ['Welk dier past het best bij jou?', ['Leeuw', 'Dolfijn', 'Uil', 'Vos']], ['Wat zou je kiezen voor een fijne avond?', ['Film kijken', 'Spelletje spelen', 'Samen koken', 'Wandelen']],
  ['Welk seizoen is jouw favoriet?', ['Lente', 'Zomer', 'Herfst', 'Winter']], ['Welke superkracht zou je willen?', ['Vliegen', 'Onzichtbaar zijn', 'Gedachten lezen', 'Teleporteren']],
  ['Waar ga je het liefst naartoe?', ['Strand', 'Bos', 'Stad', 'Pretpark']], ['Wat eet je het liefst als ontbijt?', ['Boterham', 'Pannenkoeken', 'Cornflakes', 'Fruit']],
  ['Welke kleur past bij jouw dag?', ['Geel', 'Blauw', 'Groen', 'Roze']], ['Hoe laat is het gezellig om te eten?', ['17:00', '18:00', '19:00', 'Als het klaar is']],
  ['Welk hobby-uurtje kies je?', ['Muziek', 'Tekenen', 'Sporten', 'Bouwen']], ['Welk feest vind je het leukst?', ['Verjaardag', 'Sinterklaas', 'Kerst', 'Koningsdag']],
];
const SCHAAL = [
  'Hoe was je dag tot nu toe? (1 = pittig, 10 = geweldig)', 'Hoe veel zin heb je in het weekend?', 'Hoe moe ben je vandaag?', 'Hoe lekker heb je geslapen?', 'Hoe veel zin heb je in school of werk?',
  'Hoe goed ben jij in verstoppertje?', 'Hoe gezellig is het thuis nu?', 'Hoe trots ben je op jezelf deze week?', 'Hoe lekker vind je spruitjes?', 'Hoe veel zin heb je in het volgende uitje?',
  'Hoe graag zou je nu een ijsje eten?', 'Hoe goed ken je de anderen? (1 = nog niet zo, 10 = door en door)',
];
const JANEEV = [
  'Heb je vandaag al buiten gespeeld?', 'Heb je vandaag iemand aan het lachen gemaakt?', 'Ben je een ochtendmens?', 'Zou je morgen een nieuw hobby proberen?', 'Heb je ooit een pannenkoek in de lucht laten vliegen?',
  'Hou je van verrassingen?', 'Kun je een liedje fluiten?', 'Heb je vandaag al iets nieuws geleerd?', 'Ben je weleens in een boom geklommen?', 'Heb je vandaag gelachen tot je buik pijn deed?',
  'Zou je graag een dag onzichtbaar zijn?', 'Heb je een lievelingsknuffel?',
];
const EMOJIV = [
  ['Welk plaatje past het best bij jouw humeur vandaag?', ['😀', '😎', '😴', '🥳', '🤔']], ['Welk dier is jouw spiritdier vandaag?', ['🦁', '🐬', '🦉', '🦊', '🐢']],
  ['Welk eten zou je nu willen?', ['🍕', '🍔', '🍦', '🍎', '🍝']], ['Welk weer past bij jou vandaag?', ['☀️', '🌧️', '⛈️', '❄️', '🌈']], ['Welk vervoer neem je naar je droomvakantie?', ['✈️', '🚂', '🚢', '🚀', '🚲']],
];
export const TYPED = [
  ...LIEVER.map(([a, b]) => ({ q: `Wat liever: ${a} of ${b}?`, type: 'liever', opts: [cap(a), cap(b)] })),
  ...KIES.map(([q, opts]) => ({ q, type: 'kies', opts })),
  ...SCHAAL.map((q) => ({ q, type: 'schaal', opts: SCALE })),
  ...JANEEV.map((q) => ({ q, type: 'janee', opts: JANEE })),
  ...EMOJIV.map(([q, opts]) => ({ q, type: 'emoji', opts })),
];
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
// Doorlopend door de typed vragen, gemengd zodat soorten elkaar afwisselen
export const TYPED_ORDER = (() => { const by = {}; TYPED.forEach((t) => { (by[t.type] ||= []).push(t); }); const keys = Object.keys(by); const out = []; let more = true, i = 0; while (more) { more = false; for (const k of keys) if (by[k][i]) { out.push(by[k][i]); more = true; } i++; } return out; })();

/* ---------- datum en vraag van een dag ---------- */
const DAY = 86400000;
export const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const dayNrKey = (k) => { const [y, m, d] = k.split('-').map(Number); return Math.floor(Date.UTC(y, m - 1, d) / DAY); };
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const bankIndex = (key) => ((dayNrKey(key) % BANK.length) + BANK.length) % BANK.length;

export const optsFor = (type, opts) => {
  if (type === 'schaal') return SCALE; if (type === 'janee') return JANEE;
  return Array.isArray(opts) ? opts.map((o) => String(o).slice(0, 40)).filter(Boolean).slice(0, 6) : [];
};
export const isChoice = (q) => q && q.type && q.type !== 'open' && q.opts && q.opts.length >= 2;
// admin = het dailyq-document van de dag (of undefined)
export function questionFor(key, admin) {
  if (admin && admin.by === 'admin' && admin.q) {
    const type = TYPES[admin.type] ? admin.type : 'open'; const opts = optsFor(type, admin.opts);
    if (type !== 'open' && opts.length < 2) return { q: admin.q, type: 'open', opts: [], from: 'admin', cat: 'Van Simon' };
    return { q: admin.q, type, opts, from: 'admin', cat: 'Van Simon' };
  }
  const i = bankIndex(key);
  if (key >= MIX_FROM) {
    const n = dayNrKey(key);
    if (n % 3 === 1) { const t = TYPED_ORDER[Math.floor(n / 3) % TYPED_ORDER.length]; return { ...t, from: 'bank', cat: TYPES[t.type].n }; }
  }
  return { q: BANK[i], type: 'open', opts: [], from: 'bank', cat: SECTION_OF[i] };
}

/* ---------- antwoorden: de keuze staat in het tekstveld; een gok achter ⟦raad:..⟧ ---------- */
const GUESS_RE = /\s*⟦raad:(.*?)⟧\s*$/;
export function encodeAnswer(main, guess) { const m = String(main).trim(); return (guess ? `${m} ⟦raad:${String(guess).trim()}⟧` : m).slice(0, 400); }
export function parseAnswer(text) { const t = String(text || ''); const g = GUESS_RE.exec(t); return { main: t.replace(GUESS_RE, '').trim(), guess: g ? g[1].trim() : '' }; }
export const mainOf = (a) => parseAnswer(a && a.text).main;

// Aantal keuzes per optie
export function tally(answers, opts) {
  const out = opts.map((o) => ({ opt: o, n: 0, names: [] }));
  for (const a of answers) { const m = mainOf(a), row = out.find((r) => r.opt === m); if (row) { row.n++; row.names.push(a.name || '?'); } }
  return out;
}
// Overeenkomst met één ander: 'zelfde' | 'anders'
export const sameChoice = (a, b) => mainOf(a) !== '' && mainOf(a) === mainOf(b);
// Gok-uitslag: klopt wat jij dacht dat de ander zou kiezen?
export function guessResult(mine, others) {
  const g = parseAnswer(mine && mine.text).guess; if (!g) return null;
  const o = others.filter((x) => x.uid !== (mine && mine.uid) && mainOf(x)); if (!o.length) return null;
  return { guess: g, right: o.filter((x) => mainOf(x) === g).length, total: o.length };
}
// Over meerdere dagen: rows = [{key, q, mine, all}] -> overeenkomst en gokken
export function togetherStats(rows) {
  let days = 0, same = 0, comparable = 0, guesses = 0, guessRight = 0;
  for (const r of rows) {
    if (!r.mine) continue; days++;
    if (!isChoice(r.q)) continue;
    const others = r.all.filter((a) => a.uid !== r.mine.uid && mainOf(a));
    if (others.length) { comparable++; if (others.some((o) => sameChoice(o, r.mine))) same++; }
    const gr = guessResult(r.mine, r.all); if (gr) { guesses++; if (gr.right > 0) guessRight++; }
  }
  return { days, comparable, same, guesses, guessRight, pct: comparable ? Math.round(same / comparable * 100) : null };
}
export function verdict(pct) {
  if (pct == null) return 'Nog niet genoeg om te vergelijken.';
  if (pct >= 80) return 'Jullie denken bijna hetzelfde! 🤝'; if (pct >= 50) return 'Best veel overeenkomsten. ✨'; if (pct >= 25) return 'Jullie hebben elk een eigen smaak. 🌈'; return 'Totaal verschillend, en dat is juist leuk! 😄';
}

/* ---------- streak ---------- */
// answered = functie key -> bool. Telt vandaag (indien beantwoord) en terug; als vandaag nog niet is beantwoord, begint het bij gisteren.
export function streakFrom(today, answered, max = 60) {
  let n = 0, i = 0;
  if (!answered(dayKey(today))) i = 1;
  for (; i <= max; i++) { if (answered(dayKey(addDays(today, -i)))) n++; else break; }
  return n;
}
export const STREAK_BADGES = [[3, 'Gestart', 'flame'], [7, 'Week vol', 'medal'], [14, 'Twee weken', 'trophy'], [30, 'Een maand', 'crown']];
export const streakBadge = (n) => [...STREAK_BADGES].reverse().find((b) => n >= b[0]) || null;

// Beheerder: opties uit een tekstveld ("a, b, c" of regels)
export const parseOpts = (s) => String(s || '').split(/[\n,;]+/).map((x) => x.trim().slice(0, 40)).filter(Boolean).slice(0, 6);
