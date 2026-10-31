// Vraag-spelletjes: kennisquiz, wat-liever en dobbelvraag. Zuivere logica + data (geen DOM).
export const QUIZ_CATS = [
  { id: 'natuur', n: 'Natuur', ic: 'leaf' }, { id: 'ruimte', n: 'Ruimte', ic: 'rocket' }, { id: 'wereld', n: 'Wereld', ic: 'globe' }, { id: 'lichaam', n: 'Lichaam', ic: 'heart' },
  { id: 'dieren', n: 'Dieren', ic: 'panda' }, { id: 'taal', n: 'Taal', ic: 'book' }, { id: 'geschiedenis', n: 'Geschiedenis', ic: 'pyramid' }, { id: 'sport', n: 'Sport en muziek', ic: 'guitar' },
];
// [categorie, vraag, [4 antwoorden], index goede antwoord]
export const QUIZ = [
  ['natuur', 'Welk gas nemen planten op om te groeien?', ['Zuurstof', 'Koolstofdioxide', 'Stikstof', 'Helium'], 1],
  ['natuur', 'Hoeveel poten heeft een insect?', ['4', '6', '8', '10'], 1],
  ['natuur', 'Wat is de grootste oceaan?', ['Atlantische Oceaan', 'Indische Oceaan', 'Grote Oceaan', 'Noordelijke IJszee'], 2],
  ['natuur', 'Welk dier is een zoogdier?', ['Haai', 'Dolfijn', 'Pinguïn', 'Krokodil'], 1],
  ['natuur', 'Hoe heet het als water een gas wordt?', ['Condenseren', 'Verdampen', 'Bevriezen', 'Smelten'], 1],
  ['natuur', 'Welke kleur heeft bladgroen?', ['Rood', 'Geel', 'Groen', 'Blauw'], 2],
  ['natuur', 'Waar groeit een cactus het best?', ['In een poolgebied', 'In de woestijn', 'In het regenwoud', 'In een meer'], 1],
  ['natuur', 'Wat wordt een rups uiteindelijk (bijvoorbeeld)?', ['Een vlinder', 'Een spin', 'Een kever', 'Een worm'], 0],
  ['ruimte', 'Welke planeet staat het dichtst bij de zon?', ['Venus', 'Mercurius', 'Mars', 'Aarde'], 1],
  ['ruimte', 'Wat is de zon?', ['Een planeet', 'Een ster', 'Een maan', 'Een komeet'], 1],
  ['ruimte', 'Welke planeet heeft opvallende ringen?', ['Mars', 'Saturnus', 'Aarde', 'Mercurius'], 1],
  ['ruimte', 'Hoeveel planeten heeft ons zonnestelsel?', ['7', '8', '9', '10'], 1],
  ['ruimte', 'Wie zette als eerste een voet op de maan?', ['Buzz Aldrin', 'Neil Armstrong', 'Yuri Gagarin', 'Michael Collins'], 1],
  ['ruimte', 'Wat draait om de aarde?', ['De zon', 'De maan', 'Mars', 'Venus'], 1],
  ['ruimte', 'Welke planeet noemen we de rode planeet?', ['Mars', 'Jupiter', 'Venus', 'Saturnus'], 0],
  ['ruimte', 'Hoe lang duurt een jaar op aarde ongeveer?', ['365 dagen', '100 dagen', '500 dagen', '30 dagen'], 0],
  ['wereld', 'Wat is de hoofdstad van Nederland?', ['Rotterdam', 'Amsterdam', 'Den Haag', 'Utrecht'], 1],
  ['wereld', 'Wat is de hoofdstad van Frankrijk?', ['Parijs', 'Lyon', 'Nice', 'Marseille'], 0],
  ['wereld', 'Op welk werelddeel ligt Egypte?', ['Azië', 'Afrika', 'Europa', 'Zuid-Amerika'], 1],
  ['wereld', 'Hoeveel werelddelen worden vaak geteld?', ['5', '6', '7', '9'], 2],
  ['wereld', 'Welke rivier stroomt door Parijs?', ['Rijn', 'Seine', 'Donau', 'Theems'], 1],
  ['wereld', 'Welk land heeft de vorm van een laars?', ['Spanje', 'Italië', 'Griekenland', 'Portugal'], 1],
  ['wereld', 'In welke stad staat de Eiffeltoren?', ['Londen', 'Rome', 'Parijs', 'Berlijn'], 2],
  ['wereld', 'Welk land is het grootst qua oppervlakte?', ['Canada', 'Rusland', 'China', 'Brazilië'], 1],
  ['lichaam', 'Hoeveel tanden heeft een volwassene meestal?', ['20', '28', '32', '40'], 2],
  ['lichaam', 'Welk orgaan pompt het bloed rond?', ['Longen', 'Hart', 'Lever', 'Maag'], 1],
  ['lichaam', 'Hoeveel zintuigen noemen we meestal?', ['3', '5', '7', '9'], 1],
  ['lichaam', 'Waarmee adem je?', ['Nieren', 'Longen', 'Hersenen', 'Milt'], 1],
  ['lichaam', 'Welke stof maakt je botten sterk?', ['Calcium', 'Vet', 'Suiker', 'Zout'], 0],
  ['lichaam', 'Met welk orgaan denk je?', ['Hart', 'Maag', 'Hersenen', 'Lever'], 2],
  ['lichaam', 'Hoeveel botten heeft een volwassene ongeveer?', ['106', '206', '306', '406'], 1],
  ['lichaam', 'Wat doen rode bloedcellen?', ['Zuurstof vervoeren', 'Geluid horen', 'Eten verteren', 'Spieren bewegen'], 0],
  ['dieren', 'Welk landdier is het snelst?', ['Leeuw', 'Cheeta', 'Paard', 'Wolf'], 1],
  ['dieren', 'Welk dier is het grootste landdier?', ['Giraffe', 'Neushoorn', 'Afrikaanse olifant', 'Nijlpaard'], 2],
  ['dieren', 'Welk dier legt eieren?', ['Koe', 'Kip', 'Paard', 'Hond'], 1],
  ['dieren', 'Hoe heet een jong schaap?', ['Kalf', 'Lam', 'Veulen', 'Big'], 1],
  ['dieren', 'Welk dier houdt een winterslaap?', ['Egel', 'Hond', 'Kat', 'Koe'], 0],
  ['dieren', 'Hoeveel harten heeft een octopus?', ['1', '2', '3', '4'], 2],
  ['dieren', 'Welke vogel kan niet vliegen?', ['Merel', 'Struisvogel', 'Zwaluw', 'Uil'], 1],
  ['dieren', 'Welk gestreept dier leeft in Afrika?', ['Zebra', 'Giraf', 'Neushoorn', 'Olifant'], 0],
  ['taal', 'Wat is het meervoud van "kind"?', ['Kinds', 'Kinderen', 'Kinders', 'Kindjes'], 1],
  ['taal', 'Welk woord is een werkwoord?', ['Fiets', 'Rennen', 'Groot', 'Blauw'], 1],
  ['taal', 'Wat is het tegenovergestelde van "groot"?', ['Klein', 'Dik', 'Hoog', 'Lang'], 0],
  ['taal', 'Hoeveel letters heeft ons alfabet?', ['24', '26', '28', '30'], 1],
  ['taal', 'Welk woord is een bijvoeglijk naamwoord?', ['Lopen', 'Mooi', 'Boek', 'Wij'], 1],
  ['taal', 'Wat betekent "enorm"?', ['Heel klein', 'Heel groot', 'Heel snel', 'Heel stil'], 1],
  ['taal', 'Welk woord rijmt op "huis"?', ['Muis', 'Boom', 'Stoel', 'Tafel'], 0],
  ['taal', 'Welk leesteken staat achter een vraag?', ['Punt', 'Vraagteken', 'Komma', 'Uitroepteken'], 1],
  ['geschiedenis', 'Wat bouwden de oude Egyptenaren voor hun farao\'s?', ['Piramides', 'Kastelen', 'Torens', 'Vuurtorens'], 0],
  ['geschiedenis', 'Wie voer in 1492 naar Amerika?', ['Columbus', 'Magellaan', 'Cook', 'Tasman'], 0],
  ['geschiedenis', 'In welk land staat de Chinese Muur?', ['Japan', 'China', 'India', 'Korea'], 1],
  ['geschiedenis', 'Wat bouwden de Romeinen om water te vervoeren?', ['Aquaducten', 'Molens', 'Torens', 'Kerken'], 0],
  ['geschiedenis', 'In welke eeuw leven we nu?', ['De 20e', 'De 21e', 'De 22e', 'De 19e'], 1],
  ['geschiedenis', 'Wat veranderde door de uitvinding van de drukpers?', ['Boeken werden goedkoper', 'Er kwam elektriciteit', 'Mensen gingen vliegen', 'Er kwamen auto\'s'], 0],
  ['geschiedenis', 'Wie waren de Vikingen?', ['Zeevaarders uit het noorden', 'Romeinse soldaten', 'Egyptische farao\'s', 'Chinese keizers'], 0],
  ['geschiedenis', 'Wat zijn fossielen?', ['Versteende resten van oude dieren of planten', 'Soort edelsteen', 'Oude munten', 'Nieuwe planten'], 0],
  ['sport', 'Hoeveel spelers van één team staan er bij voetbal op het veld?', ['9', '10', '11', '12'], 2],
  ['sport', 'Hoe vaak zijn de Olympische Zomerspelen?', ['Elk jaar', 'Elke 2 jaar', 'Elke 4 jaar', 'Elke 10 jaar'], 2],
  ['sport', 'Welk instrument heeft zwarte en witte toetsen?', ['Gitaar', 'Piano', 'Trompet', 'Viool'], 1],
  ['sport', 'Hoeveel snaren heeft een gewone gitaar?', ['4', '5', '6', '8'], 2],
  ['sport', 'In welke sport sla je een shuttle over het net?', ['Badminton', 'Tennis', 'Hockey', 'Golf'], 0],
  ['sport', 'Welke sport speel je op ijs met een puck?', ['Ijshockey', 'Voetbal', 'Handbal', 'Tennis'], 0],
  ['sport', 'Welk instrument is een blaasinstrument?', ['Fluit', 'Drum', 'Piano', 'Harp'], 0],
  ['sport', 'In welke sport kun je een slam dunk maken?', ['Basketbal', 'Volleybal', 'Tennis', 'Hockey'], 0],
];

export function shuffle(arr, rnd = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// Een ronde met n vragen (optioneel één categorie), antwoorden door elkaar.
export function makeRound(cat, n = 10, rnd = Math.random) {
  const pool = QUIZ.filter((q) => !cat || cat === 'alles' || q[0] === cat);
  return shuffle(pool, rnd).slice(0, Math.min(n, pool.length)).map(([c, q, opts, ok]) => {
    const order = shuffle(opts.map((_, i) => i), rnd);
    return { cat: c, q, opts: order.map((i) => opts[i]), correct: order.indexOf(ok) };
  });
}
export const isRight = (item, pick) => item.correct === pick;
export function roundVerdict(score, n) {
  const p = n ? score / n : 0;
  if (p === 1) return 'Foutloos! Wat een kenner! 🏆'; if (p >= 0.8) return 'Heel knap gedaan! 🌟'; if (p >= 0.5) return 'Goed bezig, de volgende keer nog beter! 💪'; return 'Oefening baart kunst. Nog een ronde? 🌱';
}
export const quizDefaults = () => ({ best: 0, plays: 0, right: 0, asked: 0, byCat: {} });
export function recordRound(stats, cat, score, n) {
  const s = { ...quizDefaults(), ...stats, byCat: { ...(stats && stats.byCat) } };
  s.plays++; s.right += score; s.asked += n; if (n >= 10 && score > s.best) s.best = score; else if (n < 10 && score > (s.bestShort || 0)) s.bestShort = score;
  const c = cat || 'alles'; const bc = s.byCat[c] || { r: 0, a: 0 }; s.byCat[c] = { r: bc.r + score, a: bc.a + n };
  return s;
}

/* ---------- dobbelvraag ---------- */
export function rollDie(rnd = Math.random) { return 1 + Math.floor(rnd() * 6); }
// sections = SECTIONS uit vraag-bank.js; face 1..6 kiest een categorie
export function dicePick(sections, face, rnd = Math.random) {
  const sec = sections[(face - 1) % sections.length]; const q = sec[1][Math.floor(rnd() * sec[1].length)];
  return { section: sec[0], q };
}
