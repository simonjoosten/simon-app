// Wereld-packs: hoofdsteden, vlaggen, landen, Nederland, rivieren/bergen, plekken, talen, valuta, tijdzones.
import { kit } from './lib.mjs';

export const flag = (iso) => String.fromCodePoint(...[...iso].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

// [naam, iso, werelddeel]
export const COUNTRIES = [
  ['Nederland', 'NL', 'Europa'], ['België', 'BE', 'Europa'], ['Duitsland', 'DE', 'Europa'], ['Frankrijk', 'FR', 'Europa'], ['Spanje', 'ES', 'Europa'], ['Portugal', 'PT', 'Europa'], ['Italië', 'IT', 'Europa'], ['Oostenrijk', 'AT', 'Europa'], ['Zwitserland', 'CH', 'Europa'], ['Luxemburg', 'LU', 'Europa'], ['Denemarken', 'DK', 'Europa'], ['Noorwegen', 'NO', 'Europa'], ['Zweden', 'SE', 'Europa'], ['Finland', 'FI', 'Europa'], ['IJsland', 'IS', 'Europa'], ['Ierland', 'IE', 'Europa'], ['Verenigd Koninkrijk', 'GB', 'Europa'], ['Polen', 'PL', 'Europa'], ['Tsjechië', 'CZ', 'Europa'], ['Slowakije', 'SK', 'Europa'], ['Hongarije', 'HU', 'Europa'], ['Roemenië', 'RO', 'Europa'], ['Bulgarije', 'BG', 'Europa'], ['Griekenland', 'GR', 'Europa'], ['Kroatië', 'HR', 'Europa'], ['Slovenië', 'SI', 'Europa'], ['Servië', 'RS', 'Europa'], ['Estland', 'EE', 'Europa'], ['Letland', 'LV', 'Europa'], ['Litouwen', 'LT', 'Europa'], ['Oekraïne', 'UA', 'Europa'], ['Malta', 'MT', 'Europa'], ['Albanië', 'AL', 'Europa'],
  ['Japan', 'JP', 'Azië'], ['China', 'CN', 'Azië'], ['Zuid-Korea', 'KR', 'Azië'], ['India', 'IN', 'Azië'], ['Thailand', 'TH', 'Azië'], ['Vietnam', 'VN', 'Azië'], ['Indonesië', 'ID', 'Azië'], ['Filipijnen', 'PH', 'Azië'], ['Maleisië', 'MY', 'Azië'], ['Singapore', 'SG', 'Azië'], ['Pakistan', 'PK', 'Azië'], ['Iran', 'IR', 'Azië'], ['Irak', 'IQ', 'Azië'], ['Saoedi-Arabië', 'SA', 'Azië'], ['Verenigde Arabische Emiraten', 'AE', 'Azië'], ['Israël', 'IL', 'Azië'], ['Nepal', 'NP', 'Azië'], ['Mongolië', 'MN', 'Azië'], ['Kazachstan', 'KZ', 'Azië'], ['Afghanistan', 'AF', 'Azië'], ['Bangladesh', 'BD', 'Azië'], ['Jordanië', 'JO', 'Azië'],
  ['Egypte', 'EG', 'Afrika'], ['Marokko', 'MA', 'Afrika'], ['Algerije', 'DZ', 'Afrika'], ['Tunesië', 'TN', 'Afrika'], ['Kenia', 'KE', 'Afrika'], ['Ethiopië', 'ET', 'Afrika'], ['Nigeria', 'NG', 'Afrika'], ['Ghana', 'GH', 'Afrika'], ['Senegal', 'SN', 'Afrika'], ['Zuid-Afrika', 'ZA', 'Afrika'], ['Tanzania', 'TZ', 'Afrika'], ['Oeganda', 'UG', 'Afrika'], ['Angola', 'AO', 'Afrika'], ['Namibië', 'NA', 'Afrika'], ['Madagaskar', 'MG', 'Afrika'], ['Mali', 'ML', 'Afrika'], ['Zimbabwe', 'ZW', 'Afrika'], ['Zambia', 'ZM', 'Afrika'], ['Kameroen', 'CM', 'Afrika'], ['Ivoorkust', 'CI', 'Afrika'],
  ['Verenigde Staten', 'US', 'Noord-Amerika'], ['Canada', 'CA', 'Noord-Amerika'], ['Mexico', 'MX', 'Noord-Amerika'], ['Cuba', 'CU', 'Noord-Amerika'], ['Jamaica', 'JM', 'Noord-Amerika'], ['Costa Rica', 'CR', 'Noord-Amerika'], ['Panama', 'PA', 'Noord-Amerika'], ['Guatemala', 'GT', 'Noord-Amerika'],
  ['Brazilië', 'BR', 'Zuid-Amerika'], ['Argentinië', 'AR', 'Zuid-Amerika'], ['Chili', 'CL', 'Zuid-Amerika'], ['Colombia', 'CO', 'Zuid-Amerika'], ['Peru', 'PE', 'Zuid-Amerika'], ['Venezuela', 'VE', 'Zuid-Amerika'], ['Ecuador', 'EC', 'Zuid-Amerika'], ['Uruguay', 'UY', 'Zuid-Amerika'], ['Bolivia', 'BO', 'Zuid-Amerika'], ['Paraguay', 'PY', 'Zuid-Amerika'], ['Suriname', 'SR', 'Zuid-Amerika'],
  ['Australië', 'AU', 'Oceanië'], ['Nieuw-Zeeland', 'NZ', 'Oceanië'], ['Fiji', 'FJ', 'Oceanië'], ['Papoea-Nieuw-Guinea', 'PG', 'Oceanië'],
];
const EXTRA_FLAG = [['Turkije', 'TR'], ['Rusland', 'RU'], ['Wit-Rusland', 'BY']];
const CONT = ['Europa', 'Azië', 'Afrika', 'Noord-Amerika', 'Zuid-Amerika', 'Oceanië'];

const capT = (K, rows, opts = {}) => K.facts(rows, {
  f: (k) => `Wat is de hoofdstad van ${k}?`, r: (v) => `${v} is de hoofdstad van welk land?`,
  t: (k, v) => `De hoofdstad van ${k} is ${v}.`, fill: (k, v) => `De hoofdstad van ${k} is ___.`,
  matchQ: 'Verbind elk land met zijn hoofdstad', typeMax: 11, d: 2, ...opts,
});

function capEuropa() {
  const K = kit({ id: 'hoofdsteden-europa', name: 'Hoofdsteden van Europa', emoji: '🏰', group: 'Wereld', desc: 'Van Reykjavik tot Athene: de hoofdsteden van Europese landen.' });
  const W = { g: 'w' }, N = { g: 'n' }, Z = { g: 'z' }, O = { g: 'o' };
  capT(K, [
    ['Nederland', 'Amsterdam', 'De regering zit in Den Haag, maar de hoofdstad is Amsterdam.', { ...W, d: 1 }], ['België', 'Brussel', '', { ...W, d: 1 }], ['Duitsland', 'Berlijn', '', { ...W, d: 1 }], ['Frankrijk', 'Parijs', '', { ...W, d: 1 }], ['Verenigd Koninkrijk', 'Londen', '', { ...W, d: 1 }], ['Ierland', 'Dublin', '', W], ['Luxemburg', 'Luxemburg', 'De stad heet net als het land.', { ...W, d: 3 }], ['Zwitserland', 'Bern', '', { ...W, d: 3 }], ['Oostenrijk', 'Wenen', '', { ...W, d: 2 }],
    ['Spanje', 'Madrid', '', { ...Z, d: 1 }], ['Portugal', 'Lissabon', '', Z], ['Italië', 'Rome', '', { ...Z, d: 1 }], ['Griekenland', 'Athene', '', { ...Z, d: 1 }], ['Malta', 'Valletta', '', { ...Z, d: 3 }], ['Kroatië', 'Zagreb', '', Z], ['Slovenië', 'Ljubljana', '', { ...Z, d: 3 }], ['Albanië', 'Tirana', '', { ...Z, d: 3 }], ['Servië', 'Belgrado', '', Z], ['Bosnië en Herzegovina', 'Sarajevo', '', { ...Z, d: 3 }], ['Montenegro', 'Podgorica', '', { ...Z, d: 3 }], ['Noord-Macedonië', 'Skopje', '', { ...Z, d: 3 }],
    ['Denemarken', 'Kopenhagen', '', N], ['Noorwegen', 'Oslo', '', N], ['Zweden', 'Stockholm', '', N], ['Finland', 'Helsinki', '', N], ['IJsland', 'Reykjavik', '', { ...N, d: 3 }], ['Estland', 'Tallinn', '', { ...N, d: 3 }], ['Letland', 'Riga', '', { ...N, d: 3 }], ['Litouwen', 'Vilnius', '', { ...N, d: 3 }],
    ['Polen', 'Warschau', '', O], ['Tsjechië', 'Praag', '', O], ['Slowakije', 'Bratislava', '', { ...O, d: 3 }], ['Hongarije', 'Boedapest', '', O], ['Roemenië', 'Boekarest', '', O], ['Bulgarije', 'Sofia', '', O], ['Oekraïne', 'Kiev', 'Ook geschreven als Kyiv.', { ...O, alt: ['Kyiv'] }], ['Rusland', 'Moskou', '', O], ['Wit-Rusland', 'Minsk', '', { ...O, d: 3 }],
    ['Monaco', 'Monaco', 'Een stadstaatje: land en stad hebben dezelfde naam.', { ...W, d: 3 }], ['Liechtenstein', 'Vaduz', '', { ...W, d: 3 }], ['Andorra', 'Andorra la Vella', '', { ...Z, d: 3, noType: true }],
  ]);
  K.mcs([['Welke hoofdstad ligt aan de rivier de Seine?', 'Parijs', ['Londen', 'Berlijn', 'Rome'], ''], ['Welke hoofdstad ligt aan de rivier de Theems?', 'Londen', ['Parijs', 'Dublin', 'Brussel'], ''], ['Welke hoofdstad ligt aan de rivier de Tiber?', 'Rome', ['Madrid', 'Athene', 'Wenen'], ''], ['Welke hoofdstad ligt aan de Donau?', 'Wenen', ['Berlijn', 'Brussel', 'Madrid'], 'Ook Boedapest, Belgrado en Bratislava liggen aan de Donau.'], ['Welke hoofdstad is de noordelijkste van deze vier?', 'Helsinki', ['Madrid', 'Rome', 'Athene'], '']]);
  K.tfs([['Parijs ligt in Frankrijk.', true], ['Wenen is de hoofdstad van Zwitserland.', false, 'Wenen ligt in Oostenrijk, Bern in Zwitserland.'], ['Rome is de hoofdstad van Italië.', true], ['Praag is de hoofdstad van Polen.', false, 'Praag ligt in Tsjechië.']]);
  return K.out();
}

function capAzie() {
  const K = kit({ id: 'hoofdsteden-azie', name: 'Hoofdsteden van Azië', emoji: '🏯', group: 'Wereld', desc: 'Tokio, Peking, New Delhi en meer: de hoofdsteden van Aziatische landen.' });
  capT(K, [
    ['Japan', 'Tokio', '', { d: 1, g: 'o' }], ['China', 'Peking', '', { d: 1, g: 'o' }], ['Zuid-Korea', 'Seoul', '', { g: 'o' }], ['Noord-Korea', 'Pyongyang', '', { g: 'o', d: 3 }], ['Mongolië', 'Ulaanbaatar', '', { g: 'o', d: 3, noType: true }],
    ['India', 'New Delhi', '', { d: 1, g: 'z' }], ['Pakistan', 'Islamabad', '', { g: 'z' }], ['Bangladesh', 'Dhaka', '', { g: 'z', d: 3 }], ['Nepal', 'Kathmandu', '', { g: 'z', d: 3 }], ['Bhutan', 'Thimphu', '', { g: 'z', d: 3 }], ['Afghanistan', 'Kaboel', '', { g: 'z', d: 3 }], ['Malediven', 'Malé', '', { g: 'z', d: 3 }],
    ['Thailand', 'Bangkok', '', { g: 'zo', d: 1 }], ['Vietnam', 'Hanoi', '', { g: 'zo' }], ['Laos', 'Vientiane', '', { g: 'zo', d: 3 }], ['Cambodja', 'Phnom Penh', '', { g: 'zo', d: 3, noType: true }], ['Myanmar', 'Naypyidaw', '', { g: 'zo', d: 3, noType: true }], ['Maleisië', 'Kuala Lumpur', '', { g: 'zo', noType: true }], ['Singapore', 'Singapore', 'Stad en land hebben dezelfde naam.', { g: 'zo' }], ['Indonesië', 'Jakarta', '', { g: 'zo' }], ['Filipijnen', 'Manilla', '', { g: 'zo' }], ['Brunei', 'Bandar Seri Begawan', '', { g: 'zo', d: 3, noType: true }],
    ['Kazachstan', 'Astana', '', { g: 'm', d: 3 }], ['Oezbekistan', 'Tasjkent', '', { g: 'm', d: 3 }],
    ['Iran', 'Teheran', '', { g: 'w' }], ['Irak', 'Bagdad', '', { g: 'w' }], ['Syrië', 'Damascus', '', { g: 'w', d: 3 }], ['Libanon', 'Beiroet', '', { g: 'w', d: 3 }], ['Jordanië', 'Amman', '', { g: 'w', d: 3 }], ['Saoedi-Arabië', 'Riyad', '', { g: 'w' }], ['Qatar', 'Doha', '', { g: 'w', d: 3 }], ['Verenigde Arabische Emiraten', 'Abu Dhabi', '', { g: 'w', noType: true }], ['Oman', 'Muskat', '', { g: 'w', d: 3 }], ['Turkije', 'Ankara', 'Niet Istanbul, dat is wel de grootste stad.', { g: 'w' }], ['Georgië', 'Tbilisi', '', { g: 'm', d: 3 }], ['Armenië', 'Jerevan', '', { g: 'm', d: 3 }], ['Azerbeidzjan', 'Bakoe', '', { g: 'm', d: 3 }],
  ], { f: (k) => `Wat is de hoofdstad van ${k}?` });
  K.mcs([['Welke hoofdstad is de hoofdstad van het land met de Chinese Muur?', 'Peking', ['Tokio', 'Seoul', 'Hanoi'], '']]);
  return K.out();
}

function capAfrika() {
  const K = kit({ id: 'hoofdsteden-afrika', name: 'Hoofdsteden van Afrika', emoji: '🦁', group: 'Wereld', desc: 'Caïro, Nairobi, Rabat en meer: hoofdsteden van Afrikaanse landen.' });
  capT(K, [
    ['Egypte', 'Caïro', '', { g: 'n', d: 1 }], ['Marokko', 'Rabat', '', { g: 'n' }], ['Algerije', 'Algiers', '', { g: 'n', d: 3 }], ['Tunesië', 'Tunis', '', { g: 'n', d: 3 }], ['Libië', 'Tripoli', '', { g: 'n', d: 3 }], ['Soedan', 'Khartoem', '', { g: 'n', d: 3 }],
    ['Senegal', 'Dakar', '', { g: 'w' }], ['Mali', 'Bamako', '', { g: 'w', d: 3 }], ['Ghana', 'Accra', '', { g: 'w' }], ['Nigeria', 'Abuja', 'Lagos is de grootste stad, maar Abuja is de hoofdstad.', { g: 'w' }], ['Ivoorkust', 'Yamoussoukro', '', { g: 'w', d: 3, noType: true }], ['Liberia', 'Monrovia', '', { g: 'w', d: 3 }], ['Sierra Leone', 'Freetown', '', { g: 'w', d: 3 }], ['Niger', 'Niamey', '', { g: 'w', d: 3 }], ['Mauritanië', 'Nouakchott', '', { g: 'w', d: 3, noType: true }], ['Guinee', 'Conakry', '', { g: 'w', d: 3 }],
    ['Ethiopië', 'Addis Abeba', '', { g: 'o', noType: true }], ['Kenia', 'Nairobi', '', { g: 'o', d: 1 }], ['Tanzania', 'Dodoma', 'Dar es Salaam is groter, maar Dodoma is de hoofdstad.', { g: 'o', d: 3 }], ['Oeganda', 'Kampala', '', { g: 'o', d: 3 }], ['Rwanda', 'Kigali', '', { g: 'o', d: 3 }], ['Somalië', 'Mogadishu', '', { g: 'o', d: 3 }], ['Eritrea', 'Asmara', '', { g: 'o', d: 3 }],
    ['Kameroen', 'Yaoundé', '', { g: 'c', d: 3 }], ['Gabon', 'Libreville', '', { g: 'c', d: 3, noType: true }], ['Tsjaad', "N'Djamena", '', { g: 'c', d: 3 }], ['Angola', 'Luanda', '', { g: 'z' }], ['Zambia', 'Lusaka', '', { g: 'z', d: 3 }], ['Zimbabwe', 'Harare', '', { g: 'z', d: 3 }], ['Mozambique', 'Maputo', '', { g: 'z', d: 3 }], ['Namibië', 'Windhoek', '', { g: 'z', d: 3 }], ['Botswana', 'Gaborone', '', { g: 'z', d: 3 }], ['Madagaskar', 'Antananarivo', '', { g: 'z', d: 3, noType: true }], ['Malawi', 'Lilongwe', '', { g: 'z', d: 3 }],
    ['Congo-Kinshasa (Democratische Republiek Congo)', 'Kinshasa', '', { g: 'c', d: 3 }], ['Burkina Faso', 'Ouagadougou', '', { g: 'w', d: 3, noType: true }], ['Togo', 'Lomé', '', { g: 'w', d: 3 }],
  ]);
  K.mcs([['Welke Afrikaanse hoofdstad ligt aan de rivier de Nijl?', 'Caïro', ['Rabat', 'Nairobi', 'Accra'], ''], ['In welk land staan de piramides van Gizeh, vlak bij de hoofdstad?', 'Egypte', ['Marokko', 'Kenia', 'Ghana'], 'Gizeh ligt vlak bij Caïro.'], ['Zuid-Afrika heeft ... hoofdsteden.', 'drie', ['één', 'twee', 'vier'], 'Pretoria (bestuur), Kaapstad (wetgeving) en Bloemfontein (rechtspraak).']]);
  return K.out();
}

function capAmerika() {
  const K = kit({ id: 'hoofdsteden-amerika', name: 'Hoofdsteden van Amerika', emoji: '🗽', group: 'Wereld', desc: 'Noord-, Midden- en Zuid-Amerika: waar ligt welke hoofdstad?' });
  capT(K, [
    ['Canada', 'Ottawa', '', { g: 'n', d: 2 }], ['Verenigde Staten', 'Washington D.C.', 'Washington D.C. staat niet in de staat Washington.', { g: 'n', d: 1, alt: ['Washington', 'Washington DC'] }], ['Mexico', 'Mexico-Stad', '', { g: 'n', alt: ['Mexico Stad', 'Mexico-stad'] }],
    ['Cuba', 'Havana', '', { g: 'c' }], ['Jamaica', 'Kingston', '', { g: 'c', d: 3 }], ['Haïti', 'Port-au-Prince', '', { g: 'c', d: 3, noType: true }], ['Dominicaanse Republiek', 'Santo Domingo', '', { g: 'c', d: 3, noType: true }], ['Bahama\'s', 'Nassau', '', { g: 'c', d: 3 }], ['Trinidad en Tobago', 'Port of Spain', '', { g: 'c', d: 3, noType: true }],
    ['Guatemala', 'Guatemala-Stad', '', { g: 'm', d: 3, alt: ['Guatemala Stad', 'Guatemala'] }], ['Honduras', 'Tegucigalpa', '', { g: 'm', d: 3, noType: true }], ['Nicaragua', 'Managua', '', { g: 'm', d: 3 }], ['Costa Rica', 'San José', '', { g: 'm', d: 3 }], ['Panama', 'Panama-Stad', '', { g: 'm', d: 3, alt: ['Panama Stad', 'Panama'] }], ['El Salvador', 'San Salvador', '', { g: 'm', d: 3 }], ['Belize', 'Belmopan', '', { g: 'm', d: 3 }],
    ['Brazilië', 'Brasília', '', { g: 'z', d: 1, alt: ['Brasilia'] }], ['Argentinië', 'Buenos Aires', '', { g: 'z' }], ['Chili', 'Santiago', '', { g: 'z' }], ['Peru', 'Lima', '', { g: 'z' }], ['Colombia', 'Bogotá', '', { g: 'z', d: 3 }], ['Venezuela', 'Caracas', '', { g: 'z' }], ['Ecuador', 'Quito', '', { g: 'z', d: 3 }], ['Uruguay', 'Montevideo', '', { g: 'z', d: 3 }], ['Paraguay', 'Asunción', '', { g: 'z', d: 3 }], ['Suriname', 'Paramaribo', '', { g: 'z', d: 1 }], ['Guyana', 'Georgetown', '', { g: 'z', d: 3 }],
  ]);
  K.mcs([['Welke hoofdstad is vernoemd naar de eerste president van de Verenigde Staten?', 'Washington D.C.', ['New York', 'Ottawa', 'Havana'], 'George Washington.'], ['Welke Zuid-Amerikaanse hoofdstad was vroeger een Nederlandse kolonie-hoofdstad (Suriname)?', 'Paramaribo', ['Lima', 'Quito', 'Bogotá'], ''], ['Welke Zuid-Amerikaanse hoofdstad is speciaal gebouwd in het binnenland en in 1960 ingewijd?', 'Brasília', ['Rio de Janeiro', 'Lima', 'Santiago'], '']]);
  return K.out();
}

function vlaggen() {
  const K = kit({ id: 'vlaggen', name: 'Vlaggen van de wereld', emoji: '🏁', group: 'Wereld', desc: 'Herken vlaggen van landen over de hele wereld.' });
  const all = [...COUNTRIES.map((c) => [c[0], c[1], c[2]]), ...EXTRA_FLAG.map((c) => [c[0], c[1], 'Rusland/Turkije']), ['Noord-Korea', 'KP', 'Azië']];
  const names = all.map((c) => c[0]);
  for (const [name, iso, cont] of all) {
    const f = flag(iso); const same = all.filter((c) => c[2] === cont && c[0] !== name).map((c) => c[0]);
    const d = ['NL', 'BE', 'DE', 'FR', 'ES', 'IT', 'GB', 'US', 'JP', 'CN', 'BR', 'CA', 'SE', 'AU', 'IN'].includes(iso) ? 1 : (['AT', 'CH', 'DK', 'NO', 'FI', 'PL', 'GR', 'TR', 'MX', 'AR', 'ZA', 'EG', 'KR', 'PT', 'IE', 'NZ', 'RU'].includes(iso) ? 2 : 3);
    const pool = same.length >= 6 ? same : names;
    K.mc('Van welk land is deze vlag?', name, K.shuf(pool.filter((n) => n !== name)).slice(0, 3), { e: f, d });
    if (name.length <= 14) K.type('Van welk land is deze vlag?', name, [], { e: f, d: Math.min(3, d + 1) });
    const others = K.shuf(all.filter((c) => c[0] !== name && c[2] === cont)).slice(0, 3).map((c) => flag(c[1]));
    if (others.length < 3) others.push(...K.shuf(all.filter((c) => c[0] !== name)).slice(0, 3 - others.length).map((c) => flag(c[1])));
    K.mc(`Welke vlag hoort bij ${name}?`, f, others, { d });
    K.tf(`Dit is de vlag van ${name}.`, true, { e: f, d: 1 });
    const w = K.rpick(all.filter((c) => c[0] !== name));
    K.tf(`Dit is de vlag van ${w[0]}.`, false, { e: f, d, x: `Dit is de vlag van ${name}.` });
  }
  for (let m = 0; m < 14; m++) {
    const pick = K.shuf(all).slice(0, 4);
    K.match('Verbind elke vlag met zijn land', pick.map((c) => [flag(c[1]), c[0]]), { d: 2 });
  }
  return K.out();
}

function landenWerelddeel() {
  const K = kit({ id: 'landen-werelddeel', name: 'Landen en werelddelen', emoji: '🌍', group: 'Wereld', desc: 'In welk werelddeel ligt welk land?' });
  const rows = COUNTRIES.map(([n, iso, c]) => [n, c, c === 'Noord-Amerika' && ['Mexico', 'Cuba', 'Jamaica', 'Costa Rica', 'Panama', 'Guatemala'].includes(n) ? 'Midden-Amerika en het Caribisch gebied horen bij Noord-Amerika.' : '', { e: flag(iso), d: ['Nederland', 'Duitsland', 'China', 'Brazilië', 'Egypte', 'Australië', 'Verenigde Staten', 'Japan', 'India', 'Frankrijk'].includes(n) ? 1 : 2 }]);
  K.facts(rows, { f: (k) => `In welk werelddeel ligt ${k}?`, t: (k, v) => `${k} ligt in ${v}.`, pool: CONT, type: false, d: 2 });
  K.groups(Object.fromEntries(CONT.map((c) => [c, COUNTRIES.filter((x) => x[2] === c).map((x) => x[0])])), { multi: (n) => `Welke landen liggen in ${n}? (kies alle goede)`, reps: 6 });
  K.mcs([['Welk werelddeel heeft geen landen, alleen onderzoeksstations?', 'Antarctica', ['Oceanië', 'Europa', 'Azië'], ''], ['Welk werelddeel is het grootst?', 'Azië', ['Afrika', 'Europa', 'Noord-Amerika'], ''], ['Op welk werelddeel ligt Australië?', 'Oceanië', ['Azië', 'Antarctica', 'Afrika'], 'Australië, Nieuw-Zeeland en de eilanden eromheen heten samen Oceanië.'], ['Op welk werelddeel liggen de Verenigde Staten?', 'Noord-Amerika', ['Zuid-Amerika', 'Europa', 'Oceanië'], '']]);
  for (let m = 0; m < 12; m++) { const cs = K.shuf(CONT).slice(0, 4); K.match('Verbind elk land met het werelddeel', cs.map((c) => { const x = K.rpick(COUNTRIES.filter((z) => z[2] === c)); return [x[0], c]; }), { d: 3 }); }
  return K.out();
}

/* ---------------- Nederland ---------------- */
function provincies() {
  const K = kit({ id: 'nl-provincies', name: 'Nederlandse provincies', emoji: '🇳🇱', group: 'Wereld', desc: 'De twaalf provincies en hun hoofdsteden, ligging en weetjes.' });
  K.facts([['Groningen', 'Groningen', 'De provincie en de stad hebben dezelfde naam.', { d: 2 }], ['Friesland', 'Leeuwarden'], ['Drenthe', 'Assen'], ['Overijssel', 'Zwolle'], ['Flevoland', 'Lelystad'], ['Gelderland', 'Arnhem'], ['Utrecht', 'Utrecht', 'De provincie en de stad hebben dezelfde naam.'], ['Noord-Holland', 'Haarlem', 'Amsterdam is de hoofdstad van Nederland, maar Haarlem is de provinciehoofdstad.'], ['Zuid-Holland', 'Den Haag'], ['Zeeland', 'Middelburg'], ['Noord-Brabant', "'s-Hertogenbosch", 'Ook wel Den Bosch genoemd.', { alt: ['Den Bosch', 's-Hertogenbosch', 'Den Bosch'], noType: true }], ['Limburg', 'Maastricht']], {
    f: (k) => `Wat is de hoofdstad van de provincie ${k}?`, r: (v) => `${v} is de hoofdstad van welke provincie?`, t: (k, v) => `De hoofdstad van ${k} is ${v}.`, fill: (k) => `De hoofdstad van de provincie ${k} is ___.`, matchQ: 'Verbind de provincie met haar hoofdstad', matches: 3, d: 2, typeMax: 12,
  });
  K.mcs([
    ['Hoeveel provincies heeft Nederland?', '12', ['10', '11', '14'], ''],
    ['Welke provincie is de nieuwste (sinds 1986)?', 'Flevoland', ['Zeeland', 'Drenthe', 'Utrecht'], 'Flevoland is gewonnen op de zee.'],
    ['Welke provincie ligt het verst in het zuiden?', 'Limburg', ['Zeeland', 'Noord-Brabant', 'Utrecht'], ''],
    ['Welke provincie ligt het verst in het noorden?', 'Groningen', ['Friesland', 'Drenthe', 'Noord-Holland'], 'Het noordelijkste punt is het eilandje Rottumeroog (Groningen).'],
    ['Welke provincie heeft de meeste inwoners?', 'Zuid-Holland', ['Utrecht', 'Groningen', 'Zeeland'], ''],
    ['Welke provincie is het kleinst?', 'Utrecht', ['Zeeland', 'Flevoland', 'Noord-Holland'], ''],
    ['In welke provincie ligt Amsterdam?', 'Noord-Holland', ['Zuid-Holland', 'Utrecht', 'Flevoland'], ''],
    ['In welke provincie ligt Rotterdam?', 'Zuid-Holland', ['Noord-Holland', 'Zeeland', 'Utrecht'], ''],
    ['Welke twee provincies heten samen Holland?', 'Noord-Holland en Zuid-Holland', ['Flevoland en Utrecht', 'Zeeland en Zuid-Holland', 'Friesland en Groningen'], ''],
    ['Bij welke provincie hoort het Waddeneiland Texel?', 'Noord-Holland', ['Friesland', 'Groningen', 'Zeeland'], 'Texel is van Noord-Holland; Vlieland, Terschelling, Ameland en Schiermonnikoog horen bij Friesland.'],
    ['Waar ligt het hoogste punt van Nederland (de Vaalserberg)?', 'Limburg', ['Gelderland', 'Utrecht', 'Overijssel'], 'De Vaalserberg is ongeveer 322 meter hoog.'],
    ['Welke provincie grenst aan België en Duitsland?', 'Limburg', ['Zeeland', 'Drenthe', 'Utrecht'], ''],
    ['Welke provincie ligt voor een groot deel onder de zeespiegel en is een polder?', 'Flevoland', ['Limburg', 'Drenthe', 'Gelderland'], ''],
    ['Welke provincie heeft Zwolle als hoofdstad?', 'Overijssel', ['Drenthe', 'Gelderland', 'Flevoland'], ''],
    ['In welke provincie ligt het Binnenhof (regering)?', 'Zuid-Holland', ['Noord-Holland', 'Utrecht', 'Gelderland'], 'Het Binnenhof staat in Den Haag.'],
    ['Welke van deze plaatsen is GEEN Waddeneiland?', 'Urk', ['Texel', 'Vlieland', 'Terschelling'], 'Urk was vroeger een eiland, maar ligt in de Noordoostpolder.'],
    ['Welke twee landen grenzen aan Nederland?', 'Duitsland en België', ['Frankrijk en Duitsland', 'België en Frankrijk', 'Denemarken en Duitsland'], ''],
    ['Welke zee ligt ten westen van Nederland?', 'de Noordzee', ['de Oostzee', 'de Middellandse Zee', 'de Zwarte Zee'], ''],
    ['Wat is de Afsluitdijk?', 'een dijk tussen Noord-Holland en Friesland', ['een brug in Zeeland', 'een tunnel in Limburg', 'een kanaal in Drenthe'], 'De dijk scheidt de Waddenzee van het IJsselmeer.'],
  ]);
  K.tfs([['Utrecht ligt in het midden van Nederland.', true], ['Zeeland ligt in het noorden.', false, 'Zeeland ligt in het zuidwesten.'], ['Friesland heeft een eigen taal, het Fries.', true], ['Limburg ligt in het noorden van Nederland.', false], ['Drenthe heeft hunebedden.', true, 'Hunebedden zijn grote stenen graven van duizenden jaren oud.'], ['Groningen grenst aan Duitsland.', true], ['Gelderland ligt aan zee.', false], ['De Veluwe ligt in Gelderland.', true]]);
  return K.out();
}

function steden() {
  const K = kit({ id: 'nl-steden', name: 'Nederlandse steden en plekken', emoji: '🏙️', group: 'Wereld', desc: 'In welke provincie ligt welke stad? En waar vind je bekende plekken?' });
  const P = ['Groningen', 'Friesland', 'Drenthe', 'Overijssel', 'Flevoland', 'Gelderland', 'Utrecht', 'Noord-Holland', 'Zuid-Holland', 'Zeeland', 'Noord-Brabant', 'Limburg'];
  const rows = [['Amsterdam', 'Noord-Holland', '', { d: 1 }], ['Rotterdam', 'Zuid-Holland', '', { d: 1 }], ['Den Haag', 'Zuid-Holland', '', { d: 1 }], ['Utrecht', 'Utrecht', '', { d: 1 }], ['Eindhoven', 'Noord-Brabant'], ['Tilburg', 'Noord-Brabant'], ['Breda', 'Noord-Brabant'], ["'s-Hertogenbosch", 'Noord-Brabant'], ['Groningen', 'Groningen', '', { d: 1 }], ['Almere', 'Flevoland'], ['Lelystad', 'Flevoland'], ['Nijmegen', 'Gelderland'], ['Arnhem', 'Gelderland'], ['Apeldoorn', 'Gelderland'], ['Zutphen', 'Gelderland', '', { d: 3 }], ['Enschede', 'Overijssel'], ['Zwolle', 'Overijssel'], ['Deventer', 'Overijssel'], ['Kampen', 'Overijssel', '', { d: 3 }], ['Haarlem', 'Noord-Holland'], ['Zaanstad', 'Noord-Holland', '', { d: 3 }], ['Alkmaar', 'Noord-Holland'], ['Hilversum', 'Noord-Holland'], ['Den Helder', 'Noord-Holland', '', { d: 3 }], ['Amersfoort', 'Utrecht'], ['Leiden', 'Zuid-Holland'], ['Dordrecht', 'Zuid-Holland'], ['Delft', 'Zuid-Holland'], ['Gouda', 'Zuid-Holland'], ['Leeuwarden', 'Friesland'], ['Harlingen', 'Friesland', '', { d: 3 }], ['Sneek', 'Friesland', '', { d: 3 }], ['Assen', 'Drenthe'], ['Emmen', 'Drenthe'], ['Middelburg', 'Zeeland'], ['Vlissingen', 'Zeeland'], ['Maastricht', 'Limburg', '', { d: 1 }], ['Venlo', 'Limburg'], ['Heerlen', 'Limburg'], ['Roermond', 'Limburg']];
  K.facts(rows, { f: (k) => `In welke provincie ligt ${k}?`, t: (k, v) => `${k} ligt in de provincie ${v}.`, pool: P, typeMax: 14, d: 2, fill: (k) => `${k} ligt in de provincie ___.` });
  const place = [['het Rijksmuseum', 'Amsterdam', '', { d: 1 }], ['het Anne Frank Huis', 'Amsterdam', '', { d: 1 }], ['het Van Gogh Museum', 'Amsterdam'], ['Artis (de dierentuin)', 'Amsterdam'], ['de Erasmusbrug', 'Rotterdam', '', { d: 1 }], ['de Euromast', 'Rotterdam'], ['het Binnenhof', 'Den Haag', '', { d: 1 }], ['Madurodam', 'Den Haag', '', { d: 1 }], ['het Vredespaleis', 'Den Haag'], ['het Mauritshuis', 'Den Haag', '', { d: 3 }], ['de Domtoren', 'Utrecht', '', { d: 1 }], ['Burgers\' Zoo', 'Arnhem'], ['de Efteling', 'Kaatsheuvel', 'De Efteling ligt in Noord-Brabant.'], ['de kaasmarkt', 'Alkmaar', '', { d: 1 }], ['Dierenpark Emmen', 'Emmen'], ['Walibi Holland', 'Biddinghuizen', 'In Flevoland.'], ['de Keukenhof', 'Lisse', 'In Zuid-Holland, bij de bollenvelden.'], ['de Zaanse Schans', 'Zaandam', 'Een museumdorp met windmolens bij Zaandam.'], ['Giethoorn (het dorp zonder straten)', 'Giethoorn', 'In Overijssel.'], ['het Delfts blauwe aardewerk', 'Delft', '', { d: 1 }], ['de Gouda-kaas', 'Gouda', '', { d: 1 }], ['de start en finish van de Elfstedentocht', 'Leeuwarden', '', { d: 3 }], ['de Hoge Veluwe', 'Otterlo', 'Het park ligt in Gelderland.', { d: 3 }], ['het bedrijf Philips (begonnen met gloeilampen)', 'Eindhoven', '', { d: 3 }], ['de oude Sint-Servaas Basiliek', 'Maastricht', '', { d: 3 }], ['de Martinitoren', 'Groningen', '', { d: 3 }]];
  K.facts(place.map((r) => [r[0], r[1], r[2], r[3]]), { f: (k) => `In welke plaats vind je ${k}?`, t: (k, v) => `${k[0].toUpperCase() + k.slice(1)} vind je in ${v}.`, typeMax: 14, d: 2, matchQ: 'Verbind de plek met de plaats', matches: 3 });
  K.mcs([['Welke stad is de hoofdstad van Nederland?', 'Amsterdam', ['Den Haag', 'Rotterdam', 'Utrecht'], 'De regering zit in Den Haag.'], ['Waar zit de regering van Nederland?', 'Den Haag', ['Amsterdam', 'Rotterdam', 'Utrecht'], ''], ['Welke stad heeft de grootste haven van Europa?', 'Rotterdam', ['Amsterdam', 'Den Haag', 'Groningen'], ''], ['Op welk vliegveld landen veel vliegtuigen bij Amsterdam?', 'Schiphol', ['Eindhoven', 'Lelystad', 'Maastricht'], '']]);
  return K.out();
}

function rivierenBergen() {
  const K = kit({ id: 'rivieren-bergen-zeeen', name: 'Rivieren, bergen en zeeën', emoji: '🏔️', group: 'Wereld', desc: 'Bekende rivieren, bergen, oceanen en zeeën van de wereld.' });
  const cont = ['Europa', 'Azië', 'Afrika', 'Noord-Amerika', 'Zuid-Amerika', 'Oceanië'];
  K.facts([['de Nijl', 'Afrika'], ['de Kongo (Congo)', 'Afrika', '', { alt: ['de Congo'] }], ['de Amazone', 'Zuid-Amerika', 'De Amazone is een van de grootste rivieren van de wereld.'], ['de Mississippi', 'Noord-Amerika'], ['de Jangtsekiang', 'Azië'], ['de Ganges', 'Azië'], ['de Donau', 'Europa'], ['de Rijn', 'Europa'], ['de Wolga', 'Europa'], ['de Seine', 'Europa'], ['de Theems', 'Europa'], ['de Murray', 'Oceanië'], ['de Orinoco', 'Zuid-Amerika'], ['de Yukon', 'Noord-Amerika'], ['de Eufraat', 'Azië']].map((r) => [r[0], r[1], r[2] || '', r[3] || {}]), { f: (k) => `Op welk werelddeel stroomt ${k}?`, t: (k, v) => `${k[0].toUpperCase() + k.slice(1)} stroomt in ${v}.`, pool: cont, type: false, d: 2 });
  K.facts([['de Seine', 'Parijs'], ['de Theems', 'Londen'], ['de Tiber', 'Rome'], ['de Spree', 'Berlijn'], ['de Moldau (Vltava)', 'Praag'], ['de Hudson', 'New York'], ['de Nijl', 'Caïro'], ['de Amstel', 'Amsterdam'], ['de Maas', 'Maastricht'], ['de Weichsel (Wisła)', 'Warschau'], ['de Dnjepr', 'Kiev'], ['de Rijn', 'Keulen'], ['de Elbe', 'Hamburg'], ['de Main', 'Frankfurt']].map((r) => [r[0], r[1], r[0].includes('Nijl') ? 'Caïro ligt aan de Nijl.' : '', {}]), { f: (k) => `Door welke stad stroomt ${k}?`, t: (k, v) => `${k[0].toUpperCase() + k.slice(1)} stroomt door ${v}.`, typeMax: 12, d: 3 });
  K.facts([['de Mount Everest', 'Azië', 'Het hoogste punt van de aarde (ongeveer 8849 m).'], ['de K2', 'Azië'], ['de Mont Blanc', 'Europa', 'Het hoogste punt van de Alpen (ongeveer 4806 m).'], ['de Kilimanjaro', 'Afrika', 'Het hoogste punt van Afrika (in Tanzania).'], ['de Aconcagua', 'Zuid-Amerika'], ['Denali (Mount McKinley)', 'Noord-Amerika', 'Het hoogste punt van Noord-Amerika (in Alaska).'], ['de Matterhorn', 'Europa'], ['de Vesuvius', 'Europa'], ['de Etna', 'Europa', 'De Etna is een actieve vulkaan op Sicilië.'], ['de Fuji', 'Azië', 'De Fuji is de hoogste berg van Japan.'], ['de Kosciuszko (Mount Kosciuszko)', 'Oceanië'], ['de Ben Nevis', 'Europa']].map((r) => [r[0], r[1], r[2] || '', {}]), { f: (k) => `Op welk werelddeel ligt ${k}?`, t: (k, v) => `${k[0].toUpperCase() + k.slice(1)} ligt in ${v}.`, pool: cont, type: false, d: 2 });
  K.mcs([
    ['Welke berg is de hoogste van de aarde?', 'de Mount Everest', ['de K2', 'de Mont Blanc', 'de Kilimanjaro'], ''],
    ['In welk gebergte ligt de Mount Everest?', 'de Himalaya', ['de Alpen', 'de Andes', 'de Rocky Mountains'], ''],
    ['Welk gebergte ligt in Zuid-Amerika?', 'de Andes', ['de Alpen', 'de Himalaya', 'de Pyreneeën'], ''],
    ['Welk gebergte ligt in Zwitserland en Oostenrijk?', 'de Alpen', ['de Andes', 'de Himalaya', 'de Rocky Mountains'], ''],
    ['Welk gebergte scheidt Frankrijk en Spanje?', 'de Pyreneeën', ['de Alpen', 'de Karpaten', 'de Andes'], ''],
    ['Welke woestijn is de grootste hete woestijn?', 'de Sahara', ['de Gobi', 'de Kalahari', 'de Negev'], ''],
    ['Waar ligt de Sahara?', 'in Afrika', ['in Azië', 'in Zuid-Amerika', 'in Australië'], ''],
    ['Welke oceaan is de grootste?', 'de Grote Oceaan (Stille Oceaan)', ['de Atlantische Oceaan', 'de Indische Oceaan', 'de Noordelijke IJszee'], ''],
    ['Hoeveel oceanen zijn er (volgens veel atlassen)?', '5', ['3', '4', '7'], 'Grote, Atlantische, Indische, Zuidelijke Oceaan en Noordelijke IJszee.'],
    ['Welke oceaan ligt tussen Europa en Amerika?', 'de Atlantische Oceaan', ['de Grote Oceaan', 'de Indische Oceaan', 'de Zuidelijke Oceaan'], ''],
    ['Welke oceaan ligt rond de Noordpool?', 'de Noordelijke IJszee', ['de Zuidelijke Oceaan', 'de Indische Oceaan', 'de Atlantische Oceaan'], ''],
    ['Welke zee ligt tussen Nederland en Engeland?', 'de Noordzee', ['de Oostzee', 'de Rode Zee', 'de Zwarte Zee'], ''],
    ['Welke zee is erg zout en heet de Dode Zee?', 'de Dode Zee', ['de Rode Zee', 'de Noordzee', 'de Zwarte Zee'], 'Er kun je makkelijk drijven door het vele zout.'],
    ['Welke zee ligt tussen Europa en Afrika?', 'de Middellandse Zee', ['de Noordzee', 'de Oostzee', 'de Zwarte Zee'], ''],
    ['Welk kanaal verbindt de Atlantische en de Grote Oceaan?', 'het Panamakanaal', ['het Suezkanaal', 'het Noordzeekanaal', 'het Kanaal'], ''],
    ['Welk kanaal verbindt de Middellandse Zee met de Rode Zee?', 'het Suezkanaal', ['het Panamakanaal', 'het Noordzeekanaal', 'de Afsluitdijk'], 'Het ligt in Egypte.'],
    ['Waar ligt het Grote Barrièrerif?', 'bij Australië', ['bij Brazilië', 'bij Spanje', 'bij Japan'], ''],
    ['Welke waterval ligt op de grens van Canada en de Verenigde Staten?', 'de Niagarawatervallen', ['de Victoriawatervallen', 'Angel Falls', 'de Rijnval'], ''],
    ['In welk land ligt de Grand Canyon?', 'Verenigde Staten', ['Mexico', 'Canada', 'Australië'], ''],
    ['Welk eiland is het grootste van de wereld (geen werelddeel)?', 'Groenland', ['Madagaskar', 'IJsland', 'Nieuw-Zeeland'], ''],
    ['Wat is het kleinste land ter wereld?', 'Vaticaanstad', ['Monaco', 'Malta', 'Liechtenstein'], ''],
    ['Wat is het grootste land ter wereld?', 'Rusland', ['Canada', 'China', 'Verenigde Staten'], ''],
    ['Welke oceaan ligt ten oosten van Afrika, bij India?', 'de Indische Oceaan', ['de Atlantische Oceaan', 'de Grote Oceaan', 'de Noordelijke IJszee'], ''],
    ['Welke rivier stroomt door Nederland en Duitsland en Zwitserland?', 'de Rijn', ['de Seine', 'de Donau', 'de Theems'], ''],
  ]);
  K.tfs([['De Nijl stroomt in Afrika.', true], ['De Amazone stroomt in Azië.', false, 'De Amazone stroomt in Zuid-Amerika.'], ['De Mont Blanc ligt in de Alpen.', true], ['De Sahara is een ijswoestijn.', false], ['De Noordzee grenst aan Nederland.', true], ['Antarctica is het koudste werelddeel.', true], ['De Atlantische Oceaan is de grootste oceaan.', false, 'De Grote Oceaan is groter.'], ['Het Panamakanaal ligt in Zuid-Amerika.', false, 'Panama ligt in Midden-Amerika (Noord-Amerika).']]);
  K.order('Zet de oceanen van groot naar klein', ['de Grote Oceaan', 'de Atlantische Oceaan', 'de Indische Oceaan', 'de Zuidelijke Oceaan'], { d: 3 });
  K.num('Hoeveel oceanen zijn er (volgens veel atlassen)?', 5, { d: 2, x: 'Grote, Atlantische, Indische, Zuidelijke Oceaan en de Noordelijke IJszee.' });
  K.type('Wat is de hoogste berg van de aarde?', 'Mount Everest', ['Everest', 'de Mount Everest'], { d: 2 });
  K.type('Hoe heet de lange rivier van Afrika die door Egypte stroomt?', 'Nijl', ['de Nijl'], { d: 2 });
  K.fill('De hoogste berg van de Alpen heet de ___.', 'Mont Blanc', ['Mont Blanc', 'Matterhorn', 'Kilimanjaro', 'Fuji'], { d: 3 });
  K.fill('De Sahara ligt in ___.', 'Afrika', ['Afrika', 'Azië', 'Europa', 'Zuid-Amerika'], { d: 1 });
  return K.out();
}

function plekken() {
  const K = kit({ id: 'bekende-plekken', name: 'Beroemde plekken in de wereld', emoji: '🗼', group: 'Wereld', desc: 'Eiffeltoren, Colosseum, Taj Mahal: in welk land staan ze?' });
  K.facts([['de Eiffeltoren', 'Frankrijk', '', { e: '🗼', d: 1 }], ['de Big Ben', 'Verenigd Koninkrijk', 'De Big Ben staat in Londen.', { d: 1, alt: ['Engeland'] }], ['het Colosseum', 'Italië', '', { d: 1 }], ['de Scheve Toren van Pisa', 'Italië', '', { d: 1 }], ['de piramides van Gizeh', 'Egypte', '', { e: '🔺', d: 1 }], ['de Taj Mahal', 'India', '', { d: 2 }], ['het Vrijheidsbeeld', 'Verenigde Staten', '', { e: '🗽', d: 1 }], ['de Chinese Muur', 'China', '', { d: 1 }], ['Machu Picchu', 'Peru', '', { d: 2 }], ['Christus de Verlosser (het grote beeld op een berg)', 'Brazilië', '', { d: 2 }], ['de Sagrada Família', 'Spanje', '', { d: 2 }], ['de Brandenburger Tor', 'Duitsland', '', { d: 2 }], ['de Akropolis', 'Griekenland', '', { d: 2 }], ['Stonehenge', 'Verenigd Koninkrijk', '', { d: 2, alt: ['Engeland'] }], ['Kasteel Neuschwanstein', 'Duitsland', '', { d: 3 }], ['het Sydney Opera House', 'Australië', '', { d: 2 }], ['de Burj Khalifa', 'Verenigde Arabische Emiraten', 'Het hoogste gebouw ter wereld, in Dubai.', { d: 2, noType: true }], ['de berg Fuji', 'Japan', '', { d: 2 }], ['het Kremlin', 'Rusland', '', { d: 3 }], ['het Atomium', 'België', '', { d: 2 }], ['Manneken Pis', 'België', '', { d: 2 }], ['de Kleine Zeemeermin (beeld)', 'Denemarken', '', { d: 2 }], ['Petra (de rode stad in de rotsen)', 'Jordanië', '', { d: 3 }], ['Angkor Wat', 'Cambodja', '', { d: 3 }], ['de Niagarawatervallen', 'Canada en de Verenigde Staten', '', { d: 3, noType: true }], ['de Grand Canyon', 'Verenigde Staten', '', { d: 2 }], ['het Louvre', 'Frankrijk', 'Daar hangt de Mona Lisa.', { d: 2 }], ['de Mona Lisa', 'Frankrijk', '', { d: 2 }], ['het Rode Plein', 'Rusland', '', { d: 3 }], ['de Gouden Tempel (Amritsar)', 'India', '', { d: 3 }], ['het Matterhorn', 'Zwitserland', '', { d: 2 }], ['de Berlijnse Muur', 'Duitsland', '', { d: 2 }]], {
    f: (k) => `In welk land vind je ${k}?`, t: (k, v) => `${k[0].toUpperCase() + k.slice(1)} vind je in ${v}.`, typeMax: 20, d: 2, matchQ: 'Verbind elke beroemde plek met het land', matches: 5,
  });
  K.mcs([['In welke stad staat de Eiffeltoren?', 'Parijs', ['Londen', 'Rome', 'Brussel'], ''], ['In welke stad staat het Colosseum?', 'Rome', ['Athene', 'Madrid', 'Parijs'], ''], ['In welke stad staat het Vrijheidsbeeld?', 'New York', ['Washington D.C.', 'Los Angeles', 'Chicago'], ''], ['In welke stad staat de Sagrada Família?', 'Barcelona', ['Madrid', 'Lissabon', 'Sevilla'], ''], ['In welke stad staat de Akropolis?', 'Athene', ['Rome', 'Istanbul', 'Caïro'], ''], ['In welke stad staan de Big Ben en het London Eye?', 'Londen', ['Dublin', 'Parijs', 'Manchester'], ''], ['In welke stad staat de Brandenburger Tor?', 'Berlijn', ['München', 'Hamburg', 'Wenen'], '']]);
  return K.out();
}

function werelddelen() {
  const K = kit({ id: 'werelddelen', name: 'Werelddelen en dieren', emoji: '🗺️', group: 'Wereld', desc: 'Werelddelen, kompas, polen en welk dier waar leeft.' });
  const cont = ['Europa', 'Azië', 'Afrika', 'Noord-Amerika', 'Zuid-Amerika', 'Oceanië', 'Antarctica'];
  K.facts([['de kangoeroe', 'Oceanië', 'Kangoeroes leven in Australië.', { e: '🦘' }], ['de koala', 'Oceanië', '', { e: '🐨' }], ['de wombat', 'Oceanië', '', { d: 3 }], ['de kiwi (vogel)', 'Oceanië', 'De kiwi leeft in Nieuw-Zeeland.', { d: 3 }], ['de giraffe', 'Afrika', '', { e: '🦒', d: 1 }], ['de zebra', 'Afrika', '', { e: '🦓', d: 1 }], ['de gorilla', 'Afrika', '', { e: '🦍' }], ['het nijlpaard', 'Afrika', '', { e: '🦛' }], ['de lemuur (ringstaartmaki)', 'Afrika', 'Lemuren leven op Madagaskar.', { d: 3 }], ['de reuzenpanda', 'Azië', 'Panda\'s leven in China.', { e: '🐼', d: 1 }], ['de orang-oetan', 'Azië', '', { e: '🦧', d: 2 }], ['de komodovaraan', 'Azië', 'Hij leeft op Indonesische eilanden.', { d: 3 }], ['de keizerpinguïn', 'Antarctica', '', { e: '🐧', d: 1 }], ['de lama', 'Zuid-Amerika', '', { e: '🦙', d: 2 }], ['de jaguar', 'Zuid-Amerika', '', { e: '🐆', d: 2 }], ['de condor', 'Zuid-Amerika', '', { d: 3 }], ['de anaconda', 'Zuid-Amerika', '', { d: 2 }], ['de luiaard', 'Zuid-Amerika', '', { e: '🦥', d: 2 }], ['de Amerikaanse bizon', 'Noord-Amerika', '', { e: '🦬', d: 2 }], ['de beer grizzly', 'Noord-Amerika', '', { d: 3 }]].map((r) => [r[0], r[1], r[2] || '', r[3] || {}]), { f: (k) => `Op welk werelddeel leeft ${k} in het wild?`, t: (k, v) => `${k[0].toUpperCase() + k.slice(1)} leeft in het wild in ${v}.`, pool: cont, type: false });
  K.mcs([
    ['Hoeveel werelddelen zijn er?', '7', ['5', '6', '8'], 'Europa, Azië, Afrika, Noord-Amerika, Zuid-Amerika, Oceanië en Antarctica.'],
    ['Welk werelddeel is het koudst?', 'Antarctica', ['Europa', 'Noord-Amerika', 'Azië'], ''],
    ['Welk werelddeel is het kleinst?', 'Oceanië', ['Europa', 'Antarctica', 'Zuid-Amerika'], 'Oceanië (met Australië) is het kleinste werelddeel.'],
    ['Waar ligt Nederland?', 'Europa', ['Azië', 'Afrika', 'Noord-Amerika'], ''],
    ['Welke lijn ligt precies halverwege de Noordpool en Zuidpool?', 'de evenaar', ['de poolcirkel', 'de keerkring', 'de nulmeridiaan'], ''],
    ['Waar is het het warmst: bij de evenaar of bij de polen?', 'bij de evenaar', ['bij de polen', 'overal even warm', 'bij Nederland'], ''],
    ['Waar leven ijsberen?', 'bij de Noordpool', ['bij de Zuidpool', 'bij de evenaar', 'in de Sahara'], 'Pinguïns leven juist op het zuidelijk halfrond.'],
    ['Waar leven pinguïns (de keizerpinguïn)?', 'bij de Zuidpool', ['bij de Noordpool', 'bij de evenaar', 'in Nederland'], ''],
    ['Welke windrichting is tegenover het noorden?', 'zuiden', ['oosten', 'westen', 'noordoosten'], ''],
    ['Waar komt de zon op?', 'in het oosten', ['in het westen', 'in het noorden', 'in het zuiden'], ''],
    ['Waar gaat de zon onder?', 'in het westen', ['in het oosten', 'in het noorden', 'in het zuiden'], ''],
    ['Welke kant wijst de rode naald van een kompas?', 'naar het noorden', ['naar het zuiden', 'naar het oosten', 'naar het westen'], 'De kompasnaald wijst naar het magnetische noorden.'],
    ['Wat staat er altijd boven op een gewone kaart?', 'het noorden', ['het zuiden', 'het oosten', 'het westen'], ''],
    ['Wat is een atlas?', 'een boek met kaarten', ['een soort ladder', 'een woordenboek', 'een reisgids over eten'], ''],
    ['Hoe heet een kaart van de hele aarde in de vorm van een bol?', 'een wereldbol (globe)', ['een atlas', 'een kompas', 'een plattegrond'], ''],
    ['Wat is de Noordpool?', 'het noordelijkste punt van de aarde', ['een berg in Noorwegen', 'een zee', 'een eiland bij IJsland'], ''],
    ['Welke twee windrichtingen liggen naast elkaar tussen noord en oost?', 'noordoost', ['zuidwest', 'noordwest', 'zuidoost'], ''],
    ['Hoe heet het werelddeel waar Egypte en Kenia liggen?', 'Afrika', ['Azië', 'Europa', 'Oceanië'], ''],
    ['Op welk werelddeel liggen Brazilië en Peru?', 'Zuid-Amerika', ['Noord-Amerika', 'Afrika', 'Oceanië'], ''],
  ]);
  K.order('Zet de werelddelen van groot naar klein', ['Azië', 'Afrika', 'Noord-Amerika', 'Zuid-Amerika'], { d: 3, x: 'Azië is het grootst, dan Afrika, Noord-Amerika en Zuid-Amerika.' });
  K.order('Zet de windrichtingen met de klok mee, vanaf noord', ['noord', 'oost', 'zuid', 'west'], { d: 1 });
  K.tfs([['Antarctica is een werelddeel.', true], ['Er wonen heel veel mensen op Antarctica.', false], ['Afrika ligt op de evenaar.', true], ['Nederland ligt in Zuid-Amerika.', false], ['Op de Noordpool leven pinguïns.', false], ['De Noordpool ligt in het noorden.', true], ['De Zuidpool ligt in het zuiden.', true], ['De evenaar loopt door Nederland.', false]]);
  return K.out();
}

function talen() {
  const K = kit({ id: 'talen-wereld', name: 'Talen van de wereld', emoji: '🗣️', group: 'Wereld', desc: 'Welke taal spreek je waar? Van Frans tot Japans.' });
  const L = ['Nederlands', 'Duits', 'Frans', 'Spaans', 'Portugees', 'Italiaans', 'Grieks', 'Pools', 'Russisch', 'Turks', 'Japans', 'Chinees', 'Arabisch', 'Zweeds', 'Noors', 'Deens', 'Fins', 'Hongaars', 'Engels', 'Hebreeuws', 'Koreaans', 'Thais', 'Vietnamees', 'Roemeens'];
  K.facts([['Nederland', 'Nederlands', '', { d: 1 }], ['Suriname', 'Nederlands', 'In Suriname is Nederlands de officiële taal.', { d: 2 }], ['Duitsland', 'Duits', '', { d: 1 }], ['Oostenrijk', 'Duits', '', { d: 2 }], ['Frankrijk', 'Frans', '', { d: 1 }], ['Spanje', 'Spaans', '', { d: 1 }], ['Mexico', 'Spaans', '', { d: 2 }], ['Argentinië', 'Spaans', '', { d: 2 }], ['Brazilië', 'Portugees', 'Niet Spaans!', { d: 2 }], ['Portugal', 'Portugees', '', { d: 2 }], ['Italië', 'Italiaans', '', { d: 1 }], ['Griekenland', 'Grieks', '', { d: 1 }], ['Polen', 'Pools', '', { d: 1 }], ['Rusland', 'Russisch', '', { d: 1 }], ['Turkije', 'Turks', '', { d: 1 }], ['Japan', 'Japans', '', { d: 1 }], ['China', 'Chinees', 'Mandarijn is de meest gesproken variant.', { d: 1 }], ['Egypte', 'Arabisch', '', { d: 2 }], ['Zweden', 'Zweeds', '', { d: 1 }], ['Noorwegen', 'Noors', '', { d: 1 }], ['Denemarken', 'Deens', '', { d: 1 }], ['Finland', 'Fins', '', { d: 2 }], ['Hongarije', 'Hongaars', '', { d: 2 }], ['Verenigd Koninkrijk', 'Engels', '', { d: 1 }], ['Verenigde Staten', 'Engels', '', { d: 1 }], ['Australië', 'Engels', '', { d: 1 }], ['Israël', 'Hebreeuws', '', { d: 3 }], ['Zuid-Korea', 'Koreaans', '', { d: 2 }], ['Thailand', 'Thais', '', { d: 2 }], ['Vietnam', 'Vietnamees', '', { d: 2 }], ['Roemenië', 'Roemeens', '', { d: 2 }], ['Marokko', 'Arabisch', 'Naast Arabisch spreekt men ook Berbertalen en Frans.', { d: 2 }]], {
    f: (k) => `Welke taal wordt in ${k} vooral gesproken?`, t: (k, v) => `In ${k} spreekt men vooral ${v}.`, pool: L, fill: (k) => `In ${k} spreekt men vooral ___.`, d: 2,
  });
  K.mcs([['Welke taal spreken ze in Brazilië?', 'Portugees', ['Spaans', 'Engels', 'Frans'], ''], ['Welke talen worden in België gesproken? Kies de beste.', 'Nederlands, Frans en Duits', ['alleen Frans', 'Engels en Frans', 'alleen Nederlands'], ''], ['Hoeveel officiële landstalen heeft Zwitserland?', '4', ['2', '3', '5'], 'Duits, Frans, Italiaans en Rumantsch.'], ['In welk Zuid-Amerikaans land spreekt men Nederlands?', 'Suriname', ['Chili', 'Peru', 'Bolivia'], ''], ['Hoe zeg je "hallo" in het Spaans?', 'Hola', ['Bonjour', 'Ciao', 'Hallo'], ''], ['Hoe zeg je "dank je" in het Frans?', 'Merci', ['Gracias', 'Danke', 'Grazie'], ''], ['Hoe zeg je "dank je" in het Duits?', 'Danke', ['Merci', 'Gracias', 'Thanks'], ''], ['Hoe zeg je "dank je" in het Spaans?', 'Gracias', ['Merci', 'Danke', 'Grazie'], ''], ['Hoe zeg je "dank je" in het Italiaans?', 'Grazie', ['Gracias', 'Merci', 'Danke'], ''], ['Hoe zeg je "hallo" in het Italiaans?', 'Ciao', ['Hola', 'Bonjour', 'Hallo'], ''], ['Hoe zeg je "goedendag" in het Frans?', 'Bonjour', ['Hola', 'Ciao', 'Hello'], '']]);
  return K.out();
}

function valuta() {
  const K = kit({ id: 'valuta-wereld', name: 'Geld van de wereld', emoji: '💱', group: 'Wereld', desc: 'Welke munt hoort bij welk land? Euro, dollar, yen en meer.' });
  const V = ['euro', 'pond', 'dollar', 'yen', 'frank', 'kroon', 'zloty', 'roepie', 'yuan', 'roebel', 'lira', 'real', 'peso', 'forint', 'won', 'baht', 'rand', 'sjekel'];
  K.facts([['Nederland', 'euro', '', { d: 1 }], ['Duitsland', 'euro', '', { d: 1 }], ['Frankrijk', 'euro', '', { d: 1 }], ['Italië', 'euro', '', { d: 1 }], ['Spanje', 'euro', '', { d: 1 }], ['België', 'euro', '', { d: 1 }], ['Finland', 'euro', '', { d: 2 }], ['Ierland', 'euro', '', { d: 2 }], ['Verenigd Koninkrijk', 'pond', 'Het Britse pond, ook wel pond sterling.', { d: 1 }], ['Verenigde Staten', 'dollar', '', { d: 1 }], ['Canada', 'dollar', '', { d: 2 }], ['Australië', 'dollar', '', { d: 2 }], ['Japan', 'yen', '', { d: 1 }], ['Zwitserland', 'frank', '', { d: 2 }], ['Zweden', 'kroon', '', { d: 2 }], ['Noorwegen', 'kroon', '', { d: 2 }], ['Denemarken', 'kroon', '', { d: 2 }], ['Polen', 'zloty', '', { d: 3 }], ['India', 'roepie', '', { d: 2 }], ['China', 'yuan', '', { d: 2 }], ['Rusland', 'roebel', '', { d: 2 }], ['Turkije', 'lira', '', { d: 3 }], ['Brazilië', 'real', '', { d: 3 }], ['Mexico', 'peso', '', { d: 3 }], ['Hongarije', 'forint', '', { d: 3 }], ['Zuid-Korea', 'won', '', { d: 3 }], ['Thailand', 'baht', '', { d: 3 }], ['Zuid-Afrika', 'rand', '', { d: 3 }], ['Israël', 'sjekel', '', { d: 3 }]], {
    f: (k) => `Welke munt wordt in ${k} gebruikt?`, t: (k, v) => `In ${k} gebruik je de ${v}.`, pool: V, fill: (k) => `In ${k} betaal je met de ___.`, d: 2,
  });
  K.groups({ 'met euro': ['Nederland', 'Duitsland', 'Frankrijk', 'Italië', 'Spanje', 'België', 'Portugal', 'Griekenland'], 'niet met euro': ['Verenigd Koninkrijk', 'Zwitserland', 'Zweden', 'Noorwegen', 'Denemarken', 'Polen', 'Japan', 'Verenigde Staten'] }, { multi: (n) => (n === 'met euro' ? 'In welke landen betaal je met euro? (kies alle goede)' : 'In welke landen betaal je NIET met euro? (kies alle goede)'), reps: 8 });
  K.mcs([['Hoeveel cent is een euro?', '100', ['10', '50', '1000'], ''], ['Wat is een wisselkoers?', 'hoeveel een munt waard is in een andere munt', ['een soort bank', 'een prijs van brood', 'een gokspel'], ''], ['Wat doe je bij een geldautomaat?', 'geld opnemen', ['geld wassen', 'geld drukken', 'geld eten'], ''], ['Waar betaal je met dollars?', 'in de Verenigde Staten', ['in Frankrijk', 'in Duitsland', 'in Japan'], '']]);
  return K.out();
}

function tijdzones() {
  const K = kit({ id: 'tijdzones', name: 'Tijdzones en tijd in de wereld', emoji: '🕰️', group: 'Wereld', desc: 'Waarom is het ergens anders later of vroeger? Reken tijdverschillen uit.' });
  const cities = [['Londen', -1], ['Dublin', -1], ['Lissabon', -1], ['Athene', 1], ['Helsinki', 1], ['Boekarest', 1], ['Kiev', 1]];
  for (const [c, d] of cities) for (let h = 1; h <= 23; h += 2) {
    const t = (h + d + 24) % 24;
    const dig = (x) => `${x}:00`;
    if ((h + c.length) % 3 === 0 || h % 6 === 1) K.mc(`Het is ${dig(h)} in Nederland. Hoe laat is het dan in ${c}?`, dig(t), [dig((t + 1) % 24), dig((t + 23) % 24), dig((t + 2) % 24), dig((t + 22) % 24), dig(h)].filter((x) => x !== dig(t)), { d: 3, c: `((${h}+(${d})+24)%24)+":00"`, cf: 'str', x: `${c} loopt ${Math.abs(d)} uur ${d < 0 ? 'achter' : 'voor'} op Nederland.` });
  }
  for (const [c, d] of cities) {
    K.tf(`In ${c} is het ${d < 0 ? 'een uur vroeger' : 'een uur later'} dan in Nederland.`, true, { d: 2, c: 'true' });
    K.tf(`In ${c} is het ${d < 0 ? 'een uur later' : 'een uur vroeger'} dan in Nederland.`, false, { d: 2, c: 'false', x: `${c} loopt ${Math.abs(d)} uur ${d < 0 ? 'achter' : 'voor'} op Nederland.` });
    K.mc(`Loopt ${c} voor of achter op Nederland (tijd)?`, d < 0 ? 'een uur achter' : 'een uur voor', [d < 0 ? 'een uur voor' : 'een uur achter', 'precies gelijk', 'zes uur voor', 'zes uur achter'], { d: 2 });
  }
  for (let h = 1; h <= 12; h++) K.mc(`Het is ${h}:00 uur 's ochtends bij ons. Wat is het in Londen?`, `${h - 1 || 12}:00 uur`, [`${h % 12 + 1}:00 uur`, `${h}:00 uur`, `${(h + 4) % 12 + 1}:00 uur`], { d: 3, x: 'Londen loopt een uur achter.' });
  K.mcs([
    ['Waarom zijn er tijdzones?', 'De aarde draait, dus de zon staat niet overal tegelijk hoog', ['De zon staat stil', 'Klokken lopen verschillend', 'Door de maan'], ''],
    ['Hoeveel uur duurt één draai van de aarde om haar as?', '24 uur', ['12 uur', '365 uur', '60 uur'], ''],
    ['Hoeveel tijdzones zijn er ongeveer op de wereld?', '24', ['12', '7', '60'], 'Per tijdzone is het ongeveer een uur verschil.'],
    ['In welke richting draait de aarde?', 'naar het oosten', ['naar het westen', 'naar het noorden', 'naar het zuiden'], 'Daarom komt de zon in het oosten op.'],
    ['Waar is het eerder dag: in Japan of in Nederland?', 'in Japan', ['in Nederland', 'overal tegelijk', 'in Spanje'], 'Japan ligt verder naar het oosten.'],
    ['Als het in Nederland ochtend is, is het in Amerika (oostkust) meestal ...', 'nog nacht of vroege ochtend', ['al avond', 'precies even laat', 'altijd middag'], 'De oostkust loopt ongeveer 6 uur achter.'],
    ['Waarom is het in Londen een uur vroeger dan in Amsterdam?', 'Londen ligt westelijker', ['Londen ligt oostelijker', 'Londen ligt op het zuiden', 'Londen heeft geen klok'], ''],
    ['Wat is zomertijd?', 'in de zomer zet je de klok een uur vooruit', ['in de zomer zet je de klok een uur terug', 'een warme tijd', 'een tijdzone in Afrika'], ''],
    ['Op welk moment is het ongeveer 12 uur \'s middags voor de zon?', 'als de zon het hoogst staat', ['als het donker is', 'bij zonsopgang', 'bij zonsondergang'], ''],
    ['Wat is de nulmeridiaan?', 'de lijn bij Greenwich (Londen), waar de tijdzones beginnen', ['de evenaar', 'de Noordpool', 'de datumgrens'], ''],
  ]);
  K.tfs([['In Londen is het meestal een uur vroeger dan in Nederland.', true], ['In Athene is het een uur later dan in Nederland.', true], ['Overal op aarde is het tegelijk dezelfde tijd.', false], ['Als het bij ons dag is, is het aan de andere kant van de aarde nacht.', true], ['De zon komt op in het westen.', false], ['Een etmaal is 24 uur.', true]]);
  K.num('Hoeveel uur duurt één draai van de aarde om haar as?', 24, { d: 1 });
  K.num('Hoeveel tijdzones zijn er ongeveer op aarde?', 24, { d: 2 });
  K.num('Als het in Nederland 12 uur is, hoe laat is het dan in Londen? (alleen het uur)', 11, { d: 2, c: '12-1' });
  K.type('In welke richting draait de aarde? (noord, oost, zuid of west)', 'oost', ['het oosten', 'naar het oosten'], { d: 3 });
  K.fill('In ___ is het een uur vroeger dan in Nederland.', 'Londen', ['Londen', 'Athene', 'Helsinki', 'Boekarest'], { d: 2 });
  K.order('Zet de steden van west naar oost (ongeveer)', ['Londen', 'Amsterdam', 'Athene', 'Helsinki'], { d: 3 });
  return K.out();
}

export const builders = [capEuropa, capAzie, capAfrika, capAmerika, vlaggen, landenWerelddeel, provincies, steden, rivierenBergen, plekken, werelddelen, talen, valuta, tijdzones];
