// Ruimtebasis: bouw een kolonie op de maan, delf erts, onderzoek, handel en stuur raketten naar 11 werelden.
// Opslag: local-first (localStorage `big:ruimtebasis:${uid}`) en max. 1x per 60 s naar Firestore gamesaves/big-ruimtebasis__${uid}.
// Pure logica (economie, opslag, offline-voortgang) staat bovenaan en wordt geexporteerd voor de node-tests.
// Firestore wordt dynamisch geladen (zodat dit bestand ook in node te importeren is).

const GAME = 'ruimtebasis';
const VERSION = 1;
const MAX_DATA = 18000;
const OFFLINE_MAX = 8 * 3600;
const CLOUD_EVERY = 60000;
const FS_URL = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

/* =====================================================================
   1. DATA
   ===================================================================== */
// Wereld: dur = reistijd (s), cost = erts per missie, p = marktprijs van het zeldzame spul
export const WORLDS = [
  { id: 'mars', e: '🔴', n: 'Mars', rare: 'ijzer', rn: 'Marsijzer', re: '🟥', dur: 40, cost: 30, p: 3, req: 'r_hangaar', hz: 'Een zandstorm raast over de kraters' },
  { id: 'venus', e: '🟡', n: 'Venus', rare: 'zwavel', rn: 'Zwavelgoud', re: '🟨', dur: 80, cost: 120, p: 7, req: 'r_hangaar', hz: 'Zure regen druipt van de wolken' },
  { id: 'mercurius', e: '⚫', n: 'Mercurius', rare: 'zonnemetaal', rn: 'Zonnemetaal', re: '🔶', dur: 140, cost: 400, p: 16, req: 'r_hangaar', hz: 'Een zonnevlam steekt op' },
  { id: 'ceres', e: '🪨', n: 'Ceres', rare: 'kosmisch', rn: 'Kosmisch erts', re: '🔩', dur: 240, cost: 1300, p: 38, req: 'r_motor', hz: 'Een meteorenregen ketst op de raket' },
  { id: 'europa', e: '🧊', n: 'Europa', rare: 'ijskristal', rn: 'Ijskristal', re: '💠', dur: 400, cost: 4000, p: 90, req: 'r_motor', hz: 'Een ijsbeving schudt de korst' },
  { id: 'titan', e: '🟠', n: 'Titan', rare: 'methaan', rn: 'Methaanzout', re: '🧂', dur: 650, cost: 12000, p: 210, req: 'r_motor', hz: 'Een oranje methaanstorm waait op' },
  { id: 'ringen', e: '💍', n: 'Saturnusringen', rare: 'ringijs', rn: 'Ringijs', re: '❄️', dur: 1000, cost: 40000, p: 500, req: 'r_ver', hz: 'Ringstenen razen langs de raket' },
  { id: 'neptunus', e: '🔵', n: 'Neptunus', rare: 'diamant', rn: 'Diamantregen', re: '💎', dur: 1500, cost: 120000, p: 1200, req: 'r_ver', hz: 'Superwind blaast de raket rond' },
  { id: 'kepler', e: '🌍', n: 'Kepler-22b', rare: 'biogel', rn: 'Biogel', re: '🧪', dur: 2400, cost: 400000, p: 2800, req: 'r_ver', hz: 'Gloeiende planten groeien door de raket heen' },
  { id: 'pluto', e: '⚪', n: 'Pluto', rare: 'rijp', rn: 'Koudkristal', re: '🔹', dur: 3600, cost: 1200000, p: 6500, req: 'r_warp', hz: 'Een diepvrieswind blaast over het ijs' },
  { id: 'aurora', e: '🌟', n: 'Aurora-ster', rare: 'aurora', rn: 'Aurorastof', re: '🌈', dur: 5400, cost: 4000000, p: 15000, req: 'r_warp', hz: 'Een lichtstorm kriebelt overal' },
  { id: 'proxima', e: '👽', n: 'Proxima b', rare: 'alienmetaal', rn: 'Alienmetaal', re: '🛡️', dur: 7200, cost: 14000000, p: 38000, req: 'r_prox', hz: 'Vriendelijke aliens zwaaien met tentakels' },
  { id: 'trappist', e: '🌍', n: 'Trappist-1e', rare: 'oerzaad', rn: 'Oerzaad', re: '🍀', dur: 10800, cost: 50000000, p: 90000, req: 'r_prox', hz: 'Een warme stoomwolk hangt in de lucht' },
  { id: 'kometen', e: '☄️', n: 'Kometengordel', rare: 'komeetijs', rn: 'Komeetijs', re: '☄️', dur: 14400, cost: 200000000, p: 220000, req: 'r_deep', hz: 'Een komeet scheert langs de neus' },
  { id: 'zwart', e: '🕳️', n: 'Zwart gat Sagitta', rare: 'donker', rn: 'Donkere materie', re: '👻', dur: 21600, cost: 800000000, p: 520000, req: 'r_deep', hz: 'De zwaartekracht trekt aan de raket' },
];
const RARES = WORLDS.map((w) => w.rare);
export const E = { erts: '🪨', kennis: '🔬', cred: '🪙' };
WORLDS.forEach((w) => { E[w.rare] = w.re; });
export const RNAME = { erts: 'Erts', kennis: 'Kennis', cred: 'Credits' };
WORLDS.forEach((w) => { RNAME[w.rare] = w.rn; });

// Modules: c = bouwkosten (eerste exemplaar), g = groei per exemplaar, req = onderzoek dat nodig is
export const MODS = [
  { id: 'solar', e: '☀️', n: 'Zonnepaneel', c: { erts: 12 }, g: 1.11, fx: '+4 ⚡ energie' },
  { id: 'mijn', e: '⛏️', n: 'Mijn', c: { erts: 15 }, g: 1.1, fx: '+1 🪨/s, gebruikt 2 ⚡' },
  { id: 'oxy', e: '💨', n: 'Zuurstofkamer', c: { erts: 30 }, g: 1.18, fx: '+6 💨 zuurstof, gebruikt 1 ⚡' },
  { id: 'kas', e: '🍅', n: 'Kas', c: { erts: 35 }, g: 1.18, fx: '+5 🍅 voedsel, gebruikt 1 ⚡' },
  { id: 'wonen', e: '🏠', n: 'Woonmodule', c: { erts: 40 }, g: 1.2, fx: '+4 slaapplekken, gebruikt 1 ⚡' },
  { id: 'lab', e: '🔬', n: 'Lab', c: { erts: 60 }, g: 1.15, fx: '+0,5 🔬/s, gebruikt 3 ⚡' },
  { id: 'hangaar', e: '🛖', n: 'Hangaar', c: { erts: 150, cred: 25 }, g: 1.5, req: 'r_hangaar', fx: '+1 raketplek, gebruikt 2 ⚡' },
  { id: 'handel', e: '🏪', n: 'Handelspost', c: { erts: 100, cred: 10 }, g: 1.25, req: 'r_handel', fx: '+0,3 🪙/s en betere prijzen' },
  { id: 'werk', e: '🏭', n: 'Robotfabriek', c: { erts: 250, cred: 40 }, g: 1.3, req: 'r_robot', fx: '+4 robotplekken, gebruikt 3 ⚡' },
  { id: 'reactor', e: '⚛️', n: 'Fusiereactor', c: { erts: 400, cred: 60, ijzer: 8 }, g: 1.28, req: 'r_reactor', fx: '+28 ⚡ energie' },
  { id: 'schild', e: '🛡️', n: 'Schildgenerator', c: { erts: 800, cred: 100, ijskristal: 6 }, g: 1.4, req: 'r_schild', fx: 'Minder rampjes, gebruikt 6 ⚡' },
  // nieuw: x = extra productie (erts/kennis/cred per s), sup/dem = energie, o2/food/house = leefruimte
  { id: 'hotel', e: '🏢', n: 'Maanhotel', c: { erts: 900, cred: 30 }, g: 1.22, req: 'r_hotel', x: { house: 12, dem: 2 }, fx: '+12 slaapplekken, gebruikt 2 ⚡' },
  { id: 'kas2', e: '🥕', n: 'Superkas', c: { erts: 1200, cred: 20 }, g: 1.2, req: 'r_kas2', x: { food: 18, dem: 3 }, fx: '+18 🍅 voedsel, gebruikt 3 ⚡' },
  { id: 'oxy2', e: '⛲', n: 'Zuurstoffabriek', c: { erts: 1200, cred: 20 }, g: 1.2, req: 'r_o2b', x: { o2: 22, dem: 3 }, fx: '+22 💨 zuurstof, gebruikt 3 ⚡' },
  { id: 'steen', e: '🪨', n: 'Steengroeve', c: { erts: 1500, cred: 20 }, g: 1.12, req: 'r_steen', x: { erts: 12, dem: 4 }, fx: '+12 🪨/s, gebruikt 4 ⚡' },
  { id: 'sat', e: '🛰️', n: 'Satelliet', c: { erts: 3000, cred: 60 }, g: 1.2, req: 'r_sat', x: { kennis: 4, dem: 2 }, fx: '+4 🔬/s, gebruikt 2 ⚡' },
  { id: 'zontoren', e: '🗼', n: 'Zonnetoren', c: { erts: 5000, cred: 80 }, g: 1.25, req: 'r_zon2', x: { sup: 60 }, fx: '+60 ⚡ energie' },
  { id: 'bank', e: '💰', n: 'Ruimtebank', c: { erts: 6000, cred: 150 }, g: 1.22, req: 'r_bank', x: { cred: 3, dem: 3 }, fx: '+3 🪙/s, gebruikt 3 ⚡' },
  { id: 'drone', e: '🚁', n: 'Droneloods', c: { erts: 12000, cred: 200 }, g: 1.3, req: 'r_drone', x: { erts: 60, dem: 8 }, fx: '+60 🪨/s, gebruikt 8 ⚡' },
  { id: 'toer', e: '🎡', n: 'Maanpretpark', c: { erts: 20000, cred: 400 }, g: 1.3, req: 'r_toer', x: { cred: 6, dem: 5 }, fx: '+6 🪙/s, gebruikt 5 ⚡' },
  { id: 'obs', e: '🌐', n: 'Sterrenwacht', c: { erts: 25000, cred: 300, ijskristal: 4 }, g: 1.3, req: 'r_obs', x: { kennis: 20, dem: 6 }, fx: '+20 🔬/s, gebruikt 6 ⚡' },
  { id: 'smelt', e: '🏭', n: 'Smelterij', c: { erts: 40000, cred: 600, zwavel: 10 }, g: 1.35, req: 'r_smelt', x: { erts: 300, dem: 12 }, fx: '+300 🪨/s, gebruikt 12 ⚡' },
  { id: 'kristal', e: '🔮', n: 'Kristalmijn', c: { erts: 150000, cred: 2500, diamant: 6 }, g: 1.35, req: 'r_kristal', x: { erts: 1500, kennis: 5, dem: 20 }, fx: '+1,5k 🪨/s en +5 🔬/s, gebruikt 20 ⚡' },
  { id: 'alien', e: '🛸', n: 'Alien-handelsstation', c: { erts: 2000000, cred: 30000, biogel: 10 }, g: 1.4, req: 'r_alien', x: { cred: 120, kennis: 60, dem: 30 }, fx: '+120 🪙/s en +60 🔬/s, gebruikt 30 ⚡' },
  // ---- ronde 4: 10 nieuwe modules (onderzoek in het Lab)
  { id: 'batt', e: '⚡', n: 'Batterijbank', c: { erts: 9000, cred: 100 }, g: 1.25, req: 'r_batt', x: { sup: 140 }, fx: '+140 ⚡ energie' },
  { id: 'kweek', e: '🍄', n: 'Paddenstoelenkelder', c: { erts: 14000, cred: 60 }, g: 1.22, req: 'r_kweek', x: { food: 40, dem: 4 }, fx: '+40 🍅 voedsel, gebruikt 4 ⚡' },
  { id: 'zuiver', e: '🌊', n: 'Waterzuivering', c: { erts: 16000, cred: 80 }, g: 1.22, req: 'r_zuiver', x: { o2: 50, dem: 5 }, fx: '+50 💨 zuurstof, gebruikt 5 ⚡' },
  { id: 'graaf', e: '🚜', n: 'Graafmachinepark', c: { erts: 30000, cred: 300 }, g: 1.32, req: 'r_graaf', x: { erts: 150, dem: 6 }, fx: '+150 🪨/s, gebruikt 6 ⚡' },
  { id: 'museum', e: '🏛️', n: 'Maanmuseum', c: { erts: 45000, cred: 500 }, g: 1.3, req: 'r_museum', x: { cred: 15, kennis: 10, dem: 8 }, fx: '+15 🪙/s en +10 🔬/s, gebruikt 8 ⚡' },
  { id: 'uni', e: '🎓', n: 'Maanuniversiteit', c: { erts: 70000, cred: 800, ijskristal: 6 }, g: 1.3, req: 'r_uni', x: { kennis: 60, dem: 10 }, fx: '+60 🔬/s, gebruikt 10 ⚡' },
  { id: 'bos', e: '🌳', n: 'Maanbos', c: { erts: 90000, cred: 600 }, g: 1.28, req: 'r_bos', x: { house: 40, o2: 30, dem: 2 }, fx: '+40 slaapplekken en +30 💨, gebruikt 2 ⚡' },
  { id: 'casino', e: '🎲', n: 'Maancasino', c: { erts: 220000, cred: 2000 }, g: 1.3, req: 'r_casino', x: { cred: 25, dem: 6 }, fx: '+25 🪙/s, gebruikt 6 ⚡' },
  { id: 'thorium', e: '☢️', n: 'Thoriumreactor', c: { erts: 200000, cred: 6000, zonnemetaal: 8 }, g: 1.32, req: 'r_thor', x: { sup: 500 }, fx: '+500 ⚡ energie' },
  { id: 'warpbaken', e: '🌀', n: 'Warpbaken', c: { erts: 4000000, cred: 40000, rijp: 8 }, g: 1.38, req: 'r_hyper', x: { cred: 400, kennis: 150, dem: 30 }, fx: '+400 🪙/s en +150 🔬/s, gebruikt 30 ⚡' },
];
export const MOD = Object.fromEntries(MODS.map((m) => [m.id, m]));

export const RESEARCH = [
  { id: 'r_hand', e: '🧤', n: 'Sterke handschoenen', c: { kennis: 5 }, d: 'Tikken levert 3x zoveel erts.' },
  { id: 'r_zon', e: '🔆', n: 'Betere zonnecellen', c: { kennis: 15 }, d: 'Zonnepanelen geven 50% meer energie.' },
  { id: 'r_boor', e: '🔩', n: 'Diamantboor', c: { kennis: 30 }, req: 'r_hand', d: 'Mijnen leveren 50% meer.' },
  { id: 'r_kas', e: '🌱', n: 'Hydrocultuur', c: { kennis: 30 }, d: 'Kassen geven 50% meer voedsel.' },
  { id: 'r_o2', e: '🌿', n: 'Algenfilters', c: { kennis: 30 }, d: 'Zuurstofkamers geven 50% meer.' },
  { id: 'r_wonen', e: '🛏️', n: 'Slimme hutten', c: { kennis: 45 }, d: 'Woonmodules bieden 2 plekken extra.' },
  { id: 'r_hangaar', e: '🚀', n: 'Raketbouw', c: { kennis: 60 }, d: 'Bouw hangaars en reis naar Mars, Venus en Mercurius.' },
  { id: 'r_handel', e: '🤝', n: 'Handelsroutes', c: { kennis: 80 }, d: 'Bouw handelposten; betere marktprijzen (+10%).' },
  { id: 'r_robot', e: '🤖', n: 'Robotica', c: { kennis: 150 }, d: 'Bouw robotfabrieken en robots.' },
  { id: 'r_motor', e: '🛰️', n: 'Ionmotor', c: { kennis: 300 }, req: 'r_hangaar', d: 'Raketten 30% sneller; reis naar Ceres, Europa en Titan.' },
  { id: 'r_cargo', e: '📦', n: 'Grote laadruimte', c: { kennis: 400 }, req: 'r_hangaar', d: 'Raketten brengen 50% meer mee.' },
  { id: 'r_reactor', e: '⚛️', n: 'Kernfusie', c: { kennis: 600, ijzer: 10 }, req: 'r_zon', d: 'Bouw fusiereactoren (veel energie).' },
  { id: 'r_schild', e: '🛡️', n: 'Stralingsschild', c: { kennis: 800, zwavel: 10 }, req: 'r_reactor', d: 'Bouw schildgeneratoren; rampjes gebeuren half zo vaak.' },
  { id: 'r_ai', e: '🧠', n: 'Kolonie-AI', c: { kennis: 1500 }, req: 'r_robot', d: 'Alles 25% productiever.' },
  { id: 'r_ver', e: '📡', n: 'Verre sensoren', c: { kennis: 2500, methaan: 8 }, req: 'r_motor', d: 'Reis naar de Ringen, Neptunus en Kepler-22b.' },
  { id: 'r_boor2', e: '💥', n: 'Plasmaboor', c: { kennis: 4000 }, req: 'r_boor', d: 'Mijnen leveren dubbel zoveel.' },
  { id: 'r_warp', e: '🌀', n: 'Warpmotor', c: { kennis: 12000, diamant: 12 }, req: 'r_ver', d: 'Raketten 30% sneller; reis naar Pluto en de Aurora-ster.' },
  { id: 'r_terra', e: '🌍', n: 'Terraforming', c: { kennis: 30000, biogel: 12 }, req: 'r_ai', d: 'Alles 50% productiever en meer Sterrenlicht bij verhuizen.' },
  { id: 'r_hotel', e: '🏢', n: 'Maanhotels', c: { kennis: 350 }, req: 'r_wonen', d: 'Bouw hotels met 12 slaapplekken.' },
  { id: 'r_steen', e: '🪨', n: 'Steenzaag', c: { kennis: 500 }, req: 'r_boor', d: 'Bouw steengroeves (veel erts).' },
  { id: 'r_sat', e: '🛰️', n: 'Satellietbouw', c: { kennis: 700 }, req: 'r_hangaar', d: 'Bouw satellieten die kennis verzamelen.' },
  { id: 'r_kas2', e: '🥕', n: 'Superkassen', c: { kennis: 900 }, req: 'r_kas', d: 'Bouw superkassen met veel voedsel.' },
  { id: 'r_o2b', e: '⛲', n: 'Zuurstoffabriek', c: { kennis: 900 }, req: 'r_o2', d: 'Bouw zuurstoffabrieken.' },
  { id: 'r_bank', e: '💰', n: 'Maanbank', c: { kennis: 1200 }, req: 'r_handel', d: 'Bouw een ruimtebank die credits verdient.' },
  { id: 'r_drone', e: '🚁', n: 'Dronetechniek', c: { kennis: 1600 }, req: 'r_robot', d: 'Bouw droneloodsen die erts halen.' },
  { id: 'r_zon2', e: '🗼', n: 'Zonnetorens', c: { kennis: 1800 }, req: 'r_zon', d: 'Bouw zonnetorens met veel energie.' },
  { id: 'r_smelt', e: '🏭', n: 'Smelttechniek', c: { kennis: 3500, zwavel: 8 }, req: 'r_boor', d: 'Bouw smelterijen.' },
  { id: 'r_toer', e: '🎡', n: 'Maantoerisme', c: { kennis: 5000 }, req: 'r_bank', d: 'Bouw een maanpretpark voor toeristen.' },
  { id: 'r_obs', e: '🌐', n: 'Sterrenwachten', c: { kennis: 6000 }, req: 'r_sat', d: 'Bouw sterrenwachten (veel kennis).' },
  { id: 'r_kristal', e: '🔮', n: 'Kristalboring', c: { kennis: 20000, diamant: 8 }, req: 'r_boor2', d: 'Bouw kristalmijnen.' },
  { id: 'r_alien', e: '🛸', n: 'Buitenaards contact', c: { kennis: 40000, biogel: 8 }, req: 'r_ver', d: 'Bouw een handelsstation voor aliens.' },
  { id: 'r_prox', e: '🌀', n: 'Hyperdrive', c: { kennis: 60000, rijp: 10 }, req: 'r_warp', d: 'Reis naar Proxima b en Trappist-1e.' },
  { id: 'r_deep', e: '🔭', n: 'Diepe ruimte', c: { kennis: 150000, aurora: 10 }, req: 'r_prox', d: 'Reis naar de Kometengordel en het zwarte gat.' },
  // ronde 4
  { id: 'r_batt', e: '⚡', n: 'Energieopslag', c: { kennis: 2200 }, req: 'r_zon2', d: 'Bouw batterijbanken (veel energie).' },
  { id: 'r_kweek', e: '🍄', n: 'Maankelders', c: { kennis: 2600 }, req: 'r_kas2', d: 'Bouw paddenstoelenkelders (veel voedsel).' },
  { id: 'r_zuiver', e: '🌊', n: 'Waterkringloop', c: { kennis: 2800 }, req: 'r_o2b', d: 'Bouw waterzuiveringen (veel zuurstof).' },
  { id: 'r_graaf', e: '🚜', n: 'Zware machines', c: { kennis: 4500 }, req: 'r_drone', d: 'Bouw graafmachineparken.' },
  { id: 'r_museum', e: '🏛️', n: 'Maangeschiedenis', c: { kennis: 7000 }, req: 'r_toer', d: 'Bouw een maanmuseum.' },
  { id: 'r_uni', e: '🎓', n: 'Studeren op de maan', c: { kennis: 9000, ijskristal: 6 }, req: 'r_obs', d: 'Bouw een maanuniversiteit.' },
  { id: 'r_bos', e: '🌳', n: 'Maanbossen', c: { kennis: 11000 }, req: 'r_wonen', d: 'Bouw een maanbos: wonen en frisse lucht.' },
  { id: 'r_casino', e: '🎲', n: 'Gokken op de maan', c: { kennis: 14000 }, req: 'r_bank', d: 'Bouw een maancasino (voor het spel, hoor).' },
  { id: 'r_thor', e: '☢️', n: 'Thoriumkernen', c: { kennis: 25000, zonnemetaal: 8 }, req: 'r_reactor', d: 'Bouw thoriumreactoren (heel veel energie).' },
  { id: 'r_hyper', e: '🌀', n: 'Warpbakens', c: { kennis: 80000, rijp: 8 }, req: 'r_prox', d: 'Bouw warpbakens die kennis en credits maken.' },
];
export const RES = Object.fromEntries(RESEARCH.map((r) => [r.id, r]));

export const TASKS = [
  { id: 'del', e: '⛏️', n: 'Delven', d: '+0,4 🪨/s per werker' },
  { id: 'ond', e: '🔬', n: 'Onderzoeken', d: '+0,12 🔬/s per werker' },
  { id: 'kwe', e: '🌱', n: 'Kweken', d: '+1,5 🍅 per werker' },
  { id: 'han', e: '🪙', n: 'Handelen', d: '+0,1 🪙/s per werker' },
];

export const PU = [
  { id: 'start', e: '🎒', n: 'Startpakket', d: 'Begin elke verhuizing met meer erts', max: 5, cost: (l) => 1 + l },
  { id: 'tap', e: '👆', n: 'Sterke vingers', d: '+50% tikkracht per niveau', max: 10, cost: (l) => 1 + l },
  { id: 'ert', e: '⛏️', n: 'Rijke aderen', d: '+20% erts per niveau', max: 10, cost: (l) => 2 + 2 * l },
  { id: 'ken', e: '🔬', n: 'Nieuwsgierig brein', d: '+25% kennis per niveau', max: 10, cost: (l) => 2 + 2 * l },
  { id: 'fast', e: '🚀', n: 'Turbo-raketten', d: '8% snellere reizen per niveau', max: 5, cost: (l) => 2 + 2 * l },
  { id: 'off', e: '🌙', n: 'Nachtwacht', d: '+5% opbrengst terwijl je weg bent', max: 5, cost: (l) => 2 + l },
  { id: 'solw', e: '☀️', n: 'Zonnekracht', d: '+10% energie per niveau', max: 5, cost: (l) => 2 + 2 * l },
  { id: 'cre', e: '💰', n: 'Handelsgeest', d: '+20% credits per niveau', max: 10, cost: (l) => 2 + 2 * l },
  { id: 'hui', e: '🏠', n: 'Gastvrijheid', d: '+2 woonplekken per niveau', max: 5, cost: (l) => 2 + l },
  { id: 'dag', e: '🎁', n: 'Dagelijkse bonus', d: '+20% dagelijkse beloning per niveau', max: 5, cost: (l) => 2 + l },
];

const PREST_K = 2e7;

/* ---------- doelen (eerste vijf = tutorial) ---------- */
const nb = (s, id) => s.b[id] || 0;
const sumW = (s) => s.w.del + s.w.ond + s.w.kwe + s.w.han;
export const QUESTS = [
  { t: 'Tik 10 keer op de maan om erts te delven', tab: null, ok: (s) => s.st.tap >= 10, rew: { e: 10 }, p: (s) => [s.st.tap, 10] },
  { t: 'Bouw je eerste ⛏️ mijn (tab Bouw)', tab: 'bouw', ok: (s) => nb(s, 'mijn') >= 1, rew: { e: 15 } },
  { t: 'Bouw een ☀️ zonnepaneel voor extra energie', tab: 'bouw', ok: (s) => nb(s, 'solar') >= 1, rew: { e: 20 } },
  { t: 'Zet een bewoner aan het werk (tab Team)', tab: 'team', ok: (s) => sumW(s) >= 1, rew: { e: 30 } },
  { t: 'Onderzoek 🧤 Sterke handschoenen (tab Lab)', tab: 'lab', ok: (s) => s.res.includes('r_hand'), rew: { k: 4 } },
  { t: 'Bouw een 🔬 lab voor sneller onderzoek', tab: 'bouw', ok: (s) => nb(s, 'lab') >= 1, rew: { e: 60 } },
  { t: 'Bouw een 🏠 woonmodule, dan komen er meer bewoners', tab: 'bouw', ok: (s) => nb(s, 'wonen') >= 1, rew: { e: 80 } },
  { t: 'Onderzoek 🚀 Raketbouw', tab: 'lab', ok: (s) => s.res.includes('r_hangaar'), rew: { c: 25, k: 10 } },
  { t: 'Bouw een 🛖 hangaar', tab: 'bouw', ok: (s) => nb(s, 'hangaar') >= 1, rew: { e: 150, c: 10 } },
  { t: 'Lanceer je eerste raket naar Mars 🔴 (tab Missies)', tab: 'mis', ok: (s) => s.st.ln >= 1, rew: { e: 100, c: 10 } },
  { t: 'Haal de lading van je raket op', tab: 'mis', ok: (s) => s.st.mis >= 1, rew: { c: 30, k: 15 } },
  { t: 'Verkoop wat erts of Marsijzer (tab Handel)', tab: 'han', ok: (s) => s.st.sold >= 1, rew: { m: 3 } },
  { t: 'Krijg 6 bewoners in je kolonie', tab: 'bouw', ok: (s) => Math.floor(s.pop) >= 6, rew: { m: 4 } },
  { t: 'Ontdek 3 werelden', tab: 'mis', ok: (s) => s.wd.length >= 3, rew: { m: 6, k: 40 }, p: (s) => [s.wd.length, 3] },
  { t: 'Bouw in totaal 25 modules', tab: 'bouw', ok: (s) => s.st.bld >= 25, rew: { m: 6 }, p: (s) => [s.st.bld, 25] },
  { t: 'Voltooi 8 onderzoeken', tab: 'lab', ok: (s) => s.res.length >= 8, rew: { m: 8, k: 100 }, p: (s) => [s.res.length, 8] },
  { t: 'Bouw 5 robots 🤖', tab: 'team', ok: (s) => s.bots >= 5, rew: { m: 10 }, p: (s) => [s.bots, 5] },
  { t: 'Ontdek 6 werelden', tab: 'mis', ok: (s) => s.wd.length >= 6, rew: { m: 15, k: 300 }, p: (s) => [s.wd.length, 6] },
  { t: 'Verdien samen 100.000 🪨 erts', tab: null, ok: (s) => s.st.all >= 1e5, rew: { m: 15 }, p: (s) => [s.st.all, 1e5] },
  { t: 'Ontdek 11 werelden', tab: 'mis', ok: (s) => s.wd.length >= 11, rew: { m: 30, k: 1500 }, p: (s) => [s.wd.length, 11] },
  { t: 'Verhuis naar een nieuwe maan en verdien Sterrenlicht ✨ (tab Meer)', tab: 'meer', ok: (s) => s.np >= 1, rew: { m: 20 } },
  { t: 'Verdien samen 1 miljoen 🪨 erts', tab: null, ok: (s) => s.st.all >= 1e6, rew: { m: 30 }, p: (s) => [s.st.all, 1e6] },
  { t: 'Verhuis 5 keer', tab: 'meer', ok: (s) => s.np >= 5, rew: { m: 60 }, p: (s) => [s.np, 5] },
  { t: 'Bouw een 🏢 Maanhotel (onderzoek Maanhotels)', tab: 'bouw', ok: (s) => nb(s, 'hotel') >= 1, rew: { m: 10 } },
  { t: 'Bouw een 🛰️ Satelliet', tab: 'bouw', ok: (s) => nb(s, 'sat') >= 1, rew: { m: 15, k: 200 } },
  { t: 'Voltooi 15 onderzoeken', tab: 'lab', ok: (s) => s.res.length >= 15, rew: { m: 20 }, p: (s) => [s.res.length, 15] },
  { t: 'Bouw een 💰 Ruimtebank', tab: 'bouw', ok: (s) => nb(s, 'bank') >= 1, rew: { m: 20, c: 200 } },
  { t: 'Bouw in totaal 100 modules', tab: 'bouw', ok: (s) => s.st.bld >= 100, rew: { m: 40 }, p: (s) => [s.st.bld, 100] },
  { t: 'Ontdek 12 werelden', tab: 'mis', ok: (s) => s.wd.length >= 12, rew: { m: 40, k: 3000 }, p: (s) => [s.wd.length, 12] },
  { t: 'Bouw een 🛸 Alien-handelsstation', tab: 'bouw', ok: (s) => nb(s, 'alien') >= 1, rew: { m: 80 } },
  { t: 'Verdien samen 1 miljard 🪨 erts', tab: null, ok: (s) => s.st.all >= 1e9, rew: { m: 60 }, p: (s) => [s.st.all, 1e9] },
  { t: 'Verhuis 10 keer', tab: 'meer', ok: (s) => s.np >= 10, rew: { m: 120 }, p: (s) => [s.np, 10] },
  { t: 'Ontdek alle 15 werelden', tab: 'mis', ok: (s) => s.wd.length >= WORLDS.length, rew: { m: 150, k: 20000 }, p: (s) => [s.wd.length, WORLDS.length] },
  // ronde 4
  { t: 'Bouw een ⚡ Batterijbank', tab: 'bouw', ok: (s) => nb(s, 'batt') >= 1, rew: { m: 12 } },
  { t: 'Bouw een 🌳 Maanbos', tab: 'bouw', ok: (s) => nb(s, 'bos') >= 1, rew: { m: 15, k: 800 } },
  { t: 'Bouw een 🚜 Graafmachinepark', tab: 'bouw', ok: (s) => nb(s, 'graaf') >= 1, rew: { m: 20 } },
  { t: 'Bouw een 🎓 Maanuniversiteit', tab: 'bouw', ok: (s) => nb(s, 'uni') >= 1, rew: { m: 30, k: 3000 } },
  { t: 'Bouw in totaal 400 modules', tab: 'bouw', ok: (s) => s.st.bld >= 400, rew: { m: 60 }, p: (s) => [s.st.bld, 400] },
  { t: 'Bouw een ☢️ Thoriumreactor', tab: 'bouw', ok: (s) => nb(s, 'thorium') >= 1, rew: { m: 80 } },
  { t: 'Voltooi 45 onderzoeken', tab: 'lab', ok: (s) => s.res.length >= 45, rew: { m: 100, k: 30000 }, p: (s) => [s.res.length, 45] },
  { t: 'Bouw een 🌀 Warpbaken', tab: 'bouw', ok: (s) => nb(s, 'warpbaken') >= 1, rew: { m: 150 } },
];

export const ACHS = [
  { id: 'tap50', e: '👆', n: 'Tikker', d: '50x op de maan tikken', ok: (s) => s.st.tap >= 50 },
  { id: 'tap1k', e: '🖐️', n: 'Tikmeester', d: '1.000x tikken', ok: (s) => s.st.tap >= 1000 },
  { id: 'mijn10', e: '⛏️', n: 'Mijnwerker', d: '10 mijnen', ok: (s) => nb(s, 'mijn') >= 10 },
  { id: 'mijn40', e: '🏔️', n: 'Mijnenkoning', d: '40 mijnen', ok: (s) => nb(s, 'mijn') >= 40 },
  { id: 'solar15', e: '☀️', n: 'Zonnetuin', d: '15 zonnepanelen', ok: (s) => nb(s, 'solar') >= 15 },
  { id: 'pop12', e: '👩‍🚀', n: 'Dorpje', d: '12 bewoners', ok: (s) => Math.floor(s.pop) >= 12 },
  { id: 'pop40', e: '🏙️', n: 'Stad op de maan', d: '40 bewoners', ok: (s) => Math.floor(s.pop) >= 40 },
  { id: 'res6', e: '📘', n: 'Slimmerik', d: '6 onderzoeken', ok: (s) => s.res.length >= 6 },
  { id: 'res14', e: '🎓', n: 'Professor', d: '14 onderzoeken', ok: (s) => s.res.length >= 14 },
  { id: 'resall', e: '🧠', n: 'Alles weten', d: 'Alle onderzoeken klaar', ok: (s) => s.res.length >= RESEARCH.length },
  { id: 'mis1', e: '🚀', n: 'Eerste vlucht', d: '1 missie voltooid', ok: (s) => s.st.mis >= 1 },
  { id: 'mis25', e: '🛸', n: 'Pendelaar', d: '25 missies voltooid', ok: (s) => s.st.mis >= 25 },
  { id: 'w4', e: '🔭', n: 'Ontdekker', d: '4 werelden ontdekt', ok: (s) => s.wd.length >= 4 },
  { id: 'w8', e: '🧭', n: 'Reiziger', d: '8 werelden ontdekt', ok: (s) => s.wd.length >= 8 },
  { id: 'wall', e: '🌌', n: 'Sterrenkaart', d: 'Alle werelden ontdekt', ok: (s) => s.wd.length >= WORLDS.length },
  { id: 'e1k', e: '🪨', n: 'Steenrijk', d: '1.000 erts verdiend', ok: (s) => s.st.all >= 1e3 },
  { id: 'e100k', e: '⛰️', n: 'Berg van erts', d: '100.000 erts verdiend', ok: (s) => s.st.all >= 1e5 },
  { id: 'e10m', e: '🌋', n: 'Erts-oceaan', d: '10 miljoen erts verdiend', ok: (s) => s.st.all >= 1e7 },
  { id: 'c1k', e: '🪙', n: 'Handelaar', d: '1.000 credits verdiend', ok: (s) => s.st.cred >= 1e3 },
  { id: 'c1m', e: '💰', n: 'Maanmiljonair', d: '1 miljoen credits verdiend', ok: (s) => s.st.cred >= 1e6 },
  { id: 'bot10', e: '🤖', n: 'Robotleger', d: '10 robots', ok: (s) => s.bots >= 10 },
  { id: 'bld50', e: '🏗️', n: 'Bouwvakker', d: '50 modules gebouwd', ok: (s) => s.st.bld >= 50 },
  { id: 'star5', e: '🌠', n: 'Sterrenvanger', d: '5 vallende sterren gevangen', ok: (s) => s.st.star >= 5 },
  { id: 'pr1', e: '✨', n: 'Nieuwe maan', d: '1x verhuisd', ok: (s) => s.np >= 1 },
  { id: 'pr5', e: '🪐', n: 'Sterrenreiziger', d: '5x verhuisd', ok: (s) => s.np >= 5 },
  { id: 'dl3', e: '📅', n: 'Trouwe bezoeker', d: '3 dagen op rij', ok: (s) => s.dl.k >= 3 },
  { id: 'dl7', e: '🗓️', n: 'Elke dag!', d: '7 dagen op rij', ok: (s) => s.dl.k >= 7 },
  { id: 'tap10k', e: '✋', n: 'Duizendpoot', d: '10.000x tikken', ok: (s) => s.st.tap >= 1e4 },
  { id: 'steen10', e: '🪨', n: 'Steengroever', d: '10 steengroeves', ok: (s) => nb(s, 'steen') >= 10 },
  { id: 'sat5', e: '🛰️', n: 'Satellietenpark', d: '5 satellieten', ok: (s) => nb(s, 'sat') >= 5 },
  { id: 'hotel8', e: '🏢', n: 'Hotelketen', d: '8 maanhotels', ok: (s) => nb(s, 'hotel') >= 8 },
  { id: 'bank5', e: '💰', n: 'Bankier', d: '5 ruimtebanken', ok: (s) => nb(s, 'bank') >= 5 },
  { id: 'c1b', e: '🤑', n: 'Maanmiljardair', d: '1 miljard credits verdiend', ok: (s) => s.st.cred >= 1e9 },
  { id: 'bot25', e: '🦾', n: 'Robotlegioen', d: '25 robots', ok: (s) => s.bots >= 25 },
  { id: 'bld200', e: '🏙️', n: 'Stadsbouwer', d: '200 modules gebouwd', ok: (s) => s.st.bld >= 200 },
  { id: 'w12', e: '👽', n: 'Contact!', d: '12 werelden ontdekt', ok: (s) => s.wd.length >= 12 },
  { id: 'mis100', e: '🚀', n: 'Vliegveld', d: '100 missies voltooid', ok: (s) => s.st.mis >= 100 },
  { id: 'pr10', e: '🌌', n: 'Melkwegreiziger', d: '10x verhuisd', ok: (s) => s.np >= 10 },
  { id: 'res30', e: '🧪', n: 'Wetenschapper', d: '30 onderzoeken', ok: (s) => s.res.length >= 30 },
  { id: 'batt5', e: '⚡', n: 'Stroomopslag', d: '5 batterijbanken', ok: (s) => nb(s, 'batt') >= 5 },
  { id: 'bos10', e: '🌳', n: 'Groene maan', d: '10 maanbossen', ok: (s) => nb(s, 'bos') >= 10 },
  { id: 'uni5', e: '🎓', n: 'Studentenmaan', d: '5 maanuniversiteiten', ok: (s) => nb(s, 'uni') >= 5 },
  { id: 'graaf5', e: '🚜', n: 'Grondverzetter', d: '5 graafmachineparken', ok: (s) => nb(s, 'graaf') >= 5 },
  { id: 'museum1', e: '🏛️', n: 'Cultuurmaan', d: 'Een maanmuseum', ok: (s) => nb(s, 'museum') >= 1 },
  { id: 'thor1', e: '☢️', n: 'Kernkracht', d: 'Een thoriumreactor', ok: (s) => nb(s, 'thorium') >= 1 },
];

/* =====================================================================
   2. PURE LOGICA
   ===================================================================== */
export function newState(now = Date.now()) {
  const r = { erts: 0, kennis: 0, cred: 0 };
  RARES.forEach((k) => { r[k] = 0; });
  return {
    v: VERSION, t: now, upd: now, r, b: {}, w: { del: 0, ond: 0, kwe: 0, han: 0 }, pop: 2, bots: 0,
    res: [], up: {}, mis: [], wd: [], sd: 0, sdt: 0, np: 0, pu: {}, ach: [], q: 0, dl: { d: '', k: 0 },
    st: { tap: 0, mis: 0, ln: 0, run: 0, all: 0, cred: 0, bld: 0, sold: 0, star: 0 }, set: { snd: 1, mus: 0, skin: 'maan', seen: [] },
    ev: null, born: now,
  };
}
const has = (s, id) => (s.res.includes(id) ? 1 : 0);
const lv = (s, id) => s.pu[id] || 0;
export function gMult(s) {
  return (1 + 0.1 * Math.pow(s.sdt, 0.9)) * (1 + 0.01 * s.ach.length) * (1 + 0.25 * has(s, 'r_ai')) * (1 + 0.5 * has(s, 'r_terra'));
}
export function tradeBonus(s) { return Math.min(0.4, 0.04 * nb(s, 'handel')) + 0.1 * has(s, 'r_handel'); }

// Mijlpalen: elke keer dat je 10/25/50/75/100/150/200/300/400 van een productiemodule hebt, levert die dubbel zoveel
export const TIERS = [10, 25, 50, 75, 100, 150, 200, 300, 400];
export const tierMul = (n) => Math.pow(2, TIERS.filter((t) => n >= t).length);
export const nextTier = (n) => TIERS.find((t) => n < t) || 0;

// Verbeteringen: per niveau x1,8 voor zonnepaneel, mijn, lab en handelspost. Kost erts, credits en zeldzaam spul van een wereld.
export const UPS = ['mijn', 'solar', 'lab', 'handel', 'steen', 'sat', 'bank', 'zontoren'];
export const UP_MAX = 10;
export const upLevel = (s, id) => (s.up && s.up[id]) || 0;
export const upMul = (s, id) => Math.pow(1.8, upLevel(s, id));
export function upCost(s, id) {
  const L = upLevel(s, id), w = WORLDS[Math.min(L, WORLDS.length - 1)];
  return { erts: Math.round(30000 * Math.pow(7, L)), cred: Math.round(100 * Math.pow(5, L)), [w.rare]: 8 + 3 * L };
}
export function upgrade(s, id) {
  if (!UPS.includes(id) || upLevel(s, id) >= UP_MAX) return false;
  const c = upCost(s, id);
  if (!canPay(s, c)) return false;
  pay(s, c); s.up[id] = upLevel(s, id) + 1; return true;
}

const XMODS = MODS.filter((m) => m.x);
export function rates(s, now = Date.now()) {
  const n = (id) => s.b[id] || 0, hr = (id) => has(s, id);
  const X = (k) => { let a = 0; for (const m of XMODS) if (m.x[k] && s.b[m.id]) a += s.b[m.id] * m.x[k] * (k === 'erts' || k === 'kennis' || k === 'cred' ? upMul(s, m.id) : 1); return a; };
  const gm = gMult(s);
  const flare = s.ev && s.ev.k === 'vlam' && s.ev.until > now && !n('schild') ? 0.6 : 1;
  const pSup = (4 + n('solar') * 4 * upMul(s, 'solar') * (1 + 0.5 * hr('r_zon')) + n('reactor') * 28 + X('sup') * upMul(s, 'zontoren')) * flare * (1 + 0.1 * lv(s, 'solw'));
  const pDem = 2 * n('mijn') + n('oxy') + n('kas') + n('wonen') + 3 * n('lab') + 2 * n('hangaar') + 2 * n('handel') + 3 * n('werk') + 6 * n('schild') + 0.5 * s.bots + X('dem');
  const pe = pDem <= pSup ? 1 : Math.max(0.2, pSup / pDem);
  const pop = Math.floor(s.pop);
  const house = 3 + n('wonen') * (4 + 2 * hr('r_wonen')) + X('house') + 2 * lv(s, 'hui');
  const o2S = 3 + (n('oxy') * 6 * (1 + 0.5 * hr('r_o2')) + X('o2')) * pe;
  const foS = 3 + (n('kas') * 5 * (1 + 0.5 * hr('r_kas')) + X('food')) * pe + s.w.kwe * 1.5;
  const o2E = pop <= 0 ? 1 : Math.min(1, o2S / pop);
  const foE = pop <= 0 ? 1 : Math.min(1, foS / pop);
  const wel = Math.max(0.3, Math.min(o2E, foE));
  const crew = pop + s.bots;
  const q = crew <= 0 ? 1 : (pop * wel + s.bots * pe) / crew;
  const free = Math.max(0, crew - sumW(s));
  const mineMul = 1 + 0.5 * hr('r_boor') + 1 * hr('r_boor2');
  const baseE = 0.5 + n('mijn') * mineMul * upMul(s, 'mijn') * tierMul(n('mijn')) * pe + X('erts') * pe + s.w.del * 0.4 * q;
  const erts = baseE * gm * (1 + 0.2 * lv(s, 'ert'));
  const kennis = (0.08 + n('lab') * 0.5 * upMul(s, 'lab') * tierMul(n('lab')) * pe + X('kennis') * pe + s.w.ond * 0.12 * q) * gm * (1 + 0.25 * lv(s, 'ken'));
  const cred = (0.02 + n('handel') * 0.3 * upMul(s, 'handel') * tierMul(n('handel')) * pe + X('cred') * pe + s.w.han * 0.1 * q) * gm * (1 + tradeBonus(s)) * (1 + 0.2 * lv(s, 'cre'));
  const tap = (1 + 0.1 * baseE) * (1 + 2 * hr('r_hand')) * (1 + 0.5 * lv(s, 'tap')) * (1 + 0.5 * (gm - 1));
  return {
    erts, kennis, cred, tap, gm, pSup, pDem, pe, house, o2S, o2E, foS, foE, wel, q, pop, crew, free,
    botCap: 4 * n('werk'), slots: n('hangaar'), growth: pop < house ? (1 / 30) * (0.5 + wel / 2) * (wel >= 0.6 ? 1 : 0) : 0,
  };
}

// Een stap van dt seconden. eff = opbrengstfactor (voor offline).
export function step(s, dt, eff = 1, now = Date.now()) {
  const R = rates(s, now);
  const gE = R.erts * dt * eff;
  s.r.erts += gE; s.st.run += gE; s.st.all += gE;
  s.r.kennis += R.kennis * dt * eff;
  const gC = R.cred * dt * eff;
  s.r.cred += gC; s.st.cred += gC;
  if (R.growth > 0) s.pop = Math.min(R.house, s.pop + R.growth * dt);
  clampWorkers(s);
  return R;
}
export function advance(s, secs, eff = 1, now = Date.now()) {
  secs = Math.max(0, Math.min(secs, OFFLINE_MAX));
  const chunks = Math.min(80, Math.max(1, Math.ceil(secs / 20)));
  const dt = secs / chunks;
  for (let i = 0; i < chunks; i++) step(s, dt, eff, now);
}
export const offlineEff = (s) => Math.min(1, 0.75 + 0.05 * lv(s, 'off'));

function clampWorkers(s) {
  let crew = Math.floor(s.pop) + s.bots, tot = sumW(s);
  if (tot <= crew) return;
  for (const k of ['han', 'kwe', 'ond', 'del']) {
    while (tot > crew && s.w[k] > 0) { s.w[k]--; tot--; }
  }
}
export function assign(s, task, d) {
  const R = rates(s);
  if (!(task in s.w)) return false;
  if (d > 0) { if (R.free < 1) return false; s.w[task]++; return true; }
  if (s.w[task] < 1) return false;
  s.w[task]--; return true;
}
export function autoAssign(s) {
  const tot = Math.floor(s.pop) + s.bots;
  const ratio = { ond: 0.25, kwe: 0.15, han: 0.1 };
  let left = tot;
  for (const k of ['ond', 'kwe', 'han']) { s.w[k] = Math.floor(tot * ratio[k]); left -= s.w[k]; }
  s.w.del = left;
}

export function modCost(m, owned, k = 1) {
  const out = {};
  for (const [r, v] of Object.entries(m.c)) out[r] = Math.ceil(v * Math.pow(m.g, owned) * (Math.pow(m.g, k) - 1) / (m.g - 1));
  return out;
}
export const canPay = (s, c) => Object.entries(c).every(([r, v]) => s.r[r] >= v);
export function pay(s, c) { for (const [r, v] of Object.entries(c)) s.r[r] -= v; }
export const unlocked = (s, m) => !m.req || s.res.includes(m.req);
export function maxBuy(s, m) {
  const o = nb(s, m.id); let k = 0;
  while (k < 500 && canPay(s, modCost(m, o, k + 1))) k++;
  return k;
}
export function buy(s, id, k = 1) {
  const m = MOD[id];
  if (!m || !unlocked(s, m) || k < 1) return false;
  const c = modCost(m, nb(s, id), k);
  if (!canPay(s, c)) return false;
  pay(s, c); s.b[id] = nb(s, id) + k; s.st.bld += k; return true;
}
export function robotCost(s) { return { erts: Math.ceil(40 * Math.pow(1.07, s.bots)), cred: Math.ceil(8 * Math.pow(1.07, s.bots)) }; }
export function buyRobot(s) {
  if (s.bots >= 4 * nb(s, 'werk')) return false;
  const c = robotCost(s);
  if (!canPay(s, c)) return false;
  pay(s, c); s.bots++; return true;
}

export const resAvail = (s, r) => !r.req || s.res.includes(r.req);
export function doResearch(s, id) {
  const r = RES[id];
  if (!r || s.res.includes(id) || !resAvail(s, r) || !canPay(s, r.c)) return false;
  pay(s, r.c); s.res.push(id); return true;
}

export function missionTime(s, w) {
  let t = w.dur;
  if (has(s, 'r_motor')) t *= 0.7;
  if (has(s, 'r_warp')) t *= 0.7;
  t *= 1 - 0.08 * lv(s, 'fast');
  return Math.max(8, Math.round(t));
}
export const worldOpen = (s, w) => !w.req || s.res.includes(w.req);
export function hazChance(s) { return 0.3 * (has(s, 'r_schild') ? 0.5 : 1) * Math.pow(0.85, nb(s, 'schild')); }
export function launch(s, wi, now = Date.now(), rnd = Math.random) {
  const w = WORLDS[wi];
  if (!w || !worldOpen(s, w) || s.mis.length >= nb(s, 'hangaar')) return false;
  const c = { erts: w.cost };
  if (!canPay(s, c)) return false;
  pay(s, c);
  s.mis.push({ w: wi, s: now, e: now + missionTime(s, w) * 1000, hz: rnd() < hazChance(s) ? 1 : 0 });
  s.st.ln++;
  return true;
}
export function collect(s, idx, now = Date.now(), rnd = Math.random) {
  const m = s.mis[idx];
  if (!m || now < m.e) return null;
  const w = WORLDS[m.w];
  const first = !s.wd.includes(w.id);
  const mul = (1 + 0.5 * has(s, 'r_cargo')) * (m.hz ? 0.5 : 1);
  const qty = Math.max(1, Math.round((6 + 2 * m.w) * mul * (0.8 + 0.4 * rnd())));
  const erts = Math.round(w.cost * 1.5 * mul);
  s.r[w.rare] += qty; s.r.erts += erts; s.st.all += erts; s.st.run += erts;
  let kennis = 0;
  if (first) { s.wd.push(w.id); kennis = 8 * (m.w + 1) * (m.w + 1); s.r.kennis += kennis; }
  s.mis.splice(idx, 1); s.st.mis++;
  return { w, qty, erts, first, hz: m.hz, kennis };
}

/* markt: prijs golft rustig op en neer */
const PER = {}; RARES.concat(['erts']).forEach((r, i) => { PER[r] = [150 + i * 37, i * 1.7]; });
export const basePrice = (id) => (id === 'erts' ? 0.25 : WORLDS[RARES.indexOf(id)].p);
export function price(s, id, now = Date.now()) {
  const [per, ph] = PER[id];
  return basePrice(id) * (1 + tradeBonus(s)) * (1 + 0.25 * Math.sin(now / 1000 / per * 6.2832 + ph));
}
export function buyOre(s, credits, now = Date.now()) {
  credits = Math.min(credits, Math.floor(s.r.cred));
  if (credits < 1) return 0;
  const wave = price(s, 'erts', now) / (basePrice('erts') * (1 + tradeBonus(s)));
  const got = credits / (0.6 * wave);
  s.r.cred -= credits; s.r.erts += got; s.st.all += got; s.st.run += got;
  return got;
}
export function sell(s, id, k, now = Date.now()) {
  if (!(id in s.r) || id === 'kennis' || id === 'cred') return 0;
  const amt = Math.min(Math.floor(s.r[id]), k === 'all' ? Infinity : k);
  if (amt < 1) return 0;
  const g = amt * price(s, id, now);
  s.r[id] -= amt; s.r.cred += g; s.st.cred += g; s.st.sold++;
  return g;
}

/* prestige */
export function prestigeGain(s) {
  const g = Math.floor(Math.sqrt(s.st.run / PREST_K) * (1 + 0.25 * has(s, 'r_terra')));
  return Math.max(0, g);
}
export function prestige(s, now = Date.now()) {
  const g = prestigeGain(s);
  if (g < 1) return 0;
  const f = newState(now);
  const keep = { wd: s.wd, sd: s.sd + g, sdt: s.sdt + g, np: s.np + 1, pu: s.pu, ach: s.ach, q: s.q, dl: s.dl, set: s.set, born: s.born };
  const st = { ...f.st, all: s.st.all, cred: s.st.cred, star: s.st.star, mis: s.st.mis, ln: s.st.ln, tap: s.st.tap, sold: s.st.sold, bld: s.st.bld };
  Object.assign(s, f, keep, { st });
  s.r.erts = 250 * lv(s, 'start') * lv(s, 'start');
  return g;
}
export function buyPU(s, id) {
  const p = PU.find((x) => x.id === id);
  if (!p) return false;
  const l = lv(s, id), c = p.cost(l);
  if (l >= p.max || s.sd < c) return false;
  s.sd -= c; s.pu[id] = l + 1; return true;
}

/* dagelijkse beloning */
const pad2 = (n) => String(n).padStart(2, '0');
export const dayKey = (now) => { const d = new Date(now); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
export function dailyInfo(s, now = Date.now()) {
  const key = dayKey(now), y = new Date(now); y.setDate(y.getDate() - 1);
  const can = s.dl.d !== key;
  const streak = !can ? s.dl.k : (s.dl.d === dayKey(y.getTime()) ? s.dl.k + 1 : 1);
  return { can, streak };
}
export function claimDaily(s, now = Date.now(), R = rates(s, now)) {
  const { can, streak } = dailyInfo(s, now);
  if (!can) return null;
  const mul = (1 + 0.1 * Math.min(streak - 1, 9)) * (1 + 0.2 * lv(s, 'dag'));
  const erts = Math.round(Math.max(100, R.erts * 900) * mul);
  const kennis = Math.round(Math.max(5, R.kennis * 600) * mul);
  const cred = Math.round(Math.max(20, R.cred * 600 + 20 * Math.min(streak, 10)) * mul);
  const star = streak % 7 === 0 ? 1 : 0;
  s.r.erts += erts; s.r.kennis += kennis; s.r.cred += cred; s.st.all += erts; s.st.run += erts;
  if (star) { s.sd += 1; s.sdt += 1; }
  s.dl = { d: dayKey(now), k: streak };
  return { erts, kennis, cred, star, streak };
}

/* doelen en prestaties */
export function applyReward(s, rew, R) {
  const out = {};
  if (rew.e || rew.m) { out.erts = Math.round(Math.max(rew.e || 0, (rew.m || 0) * 60 * R.erts)); s.r.erts += out.erts; s.st.all += out.erts; s.st.run += out.erts; }
  if (rew.k) { out.kennis = rew.k; s.r.kennis += rew.k; }
  if (rew.c) { out.cred = rew.c; s.r.cred += rew.c; }
  return out;
}
export function checkProgress(s, now = Date.now()) {
  const done = [], R = rates(s, now);
  while (s.q < QUESTS.length && QUESTS[s.q].ok(s)) {
    const q = QUESTS[s.q]; s.q++;
    done.push({ kind: 'q', t: q.t, got: applyReward(s, q.rew, R) });
  }
  for (const a of ACHS) if (!s.ach.includes(a.id) && a.ok(s)) { s.ach.push(a.id); done.push({ kind: 'a', a }); }
  return done;
}

/* ---------- opslag ---------- */
export function pack(s) {
  return JSON.stringify(s, (k, v) => (typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 1000) / 1000 : v));
}
export function migrate(o, now = Date.now()) {
  if (!o || typeof o !== 'object') return null;
  const f = newState(now);
  const s = { ...f, ...o };
  for (const k of ['r', 'w', 'st', 'set', 'dl']) s[k] = { ...f[k], ...(o[k] && typeof o[k] === 'object' ? o[k] : {}) };
  s.b = o.b && typeof o.b === 'object' ? { ...o.b } : {};
  s.pu = o.pu && typeof o.pu === 'object' ? { ...o.pu } : {};
  s.up = o.up && typeof o.up === 'object' ? { ...o.up } : {};
  for (const k of Object.keys(s.up)) { if (!UPS.includes(k)) delete s.up[k]; else s.up[k] = Math.min(UP_MAX, Math.floor(Number.isFinite(s.up[k]) && s.up[k] > 0 ? s.up[k] : 0)); }
  for (const k of ['res', 'mis', 'wd', 'ach']) s[k] = Array.isArray(o[k]) ? o[k].slice() : [];
  s.res = s.res.filter((id) => RES[id]);
  s.mis = s.mis.filter((m) => m && WORLDS[m.w] && Number.isFinite(m.e));
  const fix = (x, d = 0) => (Number.isFinite(x) && x >= 0 ? x : d);
  for (const k of Object.keys(s.r)) s.r[k] = fix(s.r[k]);
  for (const k of Object.keys(s.w)) s.w[k] = Math.floor(fix(s.w[k]));
  for (const k of Object.keys(s.st)) s.st[k] = fix(s.st[k]);
  for (const k of Object.keys(s.b)) { s.b[k] = Math.floor(fix(s.b[k])); if (!MOD[k]) delete s.b[k]; }
  s.pop = fix(s.pop, 2); s.bots = Math.floor(fix(s.bots)); s.q = Math.floor(fix(s.q)); s.np = Math.floor(fix(s.np));
  s.sd = fix(s.sd); s.sdt = fix(s.sdt); s.t = fix(s.t, now); s.upd = fix(s.upd, now);
  s.v = VERSION;
  clampWorkers(s);
  return s;
}
export function unpack(str, now = Date.now()) {
  try { return migrate(JSON.parse(str), now); } catch (e) { return null; }
}

// Opslaglaag, los testbaar: storage = localStorage-achtig, fs = { doc, getDoc, setDoc } of null
export function makeStore({ uid, db, fs, storage, now = () => Date.now() }) {
  const key = `big:${GAME}:${uid}`, docId = `big-${GAME}__${uid}`;
  let lastCloud = 0, cloudBusy = false;
  const readLocal = () => {
    try { const o = JSON.parse(storage.getItem(key) || 'null'); return o && typeof o.data === 'string' ? o : null; } catch (e) { return null; }
  };
  return {
    key, docId,
    saveLocal(s) {
      s.upd = now();
      try { storage.setItem(key, JSON.stringify({ updated: s.upd, data: pack(s) })); return true; } catch (e) { return false; }
    },
    async saveCloud(s, force = false) {
      if (!fs || !db || cloudBusy) return false;
      const t = now();
      if (!force && t - lastCloud < CLOUD_EVERY) return false;
      let data = pack(s);
      if (data.length > MAX_DATA) return false;
      cloudBusy = true;
      try {
        await fs.setDoc(fs.doc(db, 'gamesaves', docId), { game: 'big-' + GAME, uid, data, updated: s.upd || t });
        lastCloud = t; return true;
      } catch (e) { return false; } finally { cloudBusy = false; }
    },
    async load() {
      const loc = readLocal();
      let rem = null;
      if (fs && db) {
        try {
          const snap = await fs.getDoc(fs.doc(db, 'gamesaves', docId));
          if (snap.exists()) { const d = snap.data(); if (d && typeof d.data === 'string') rem = d; }
        } catch (e) { /* stil */ }
      }
      const pick = loc && rem ? ((rem.updated || 0) > (loc.updated || 0) ? rem : loc) : (loc || rem);
      const s = pick ? unpack(pick.data, now()) : null;
      if (s) lastCloud = now();
      return s;
    },
  };
}

/* =====================================================================
   3. HULPFUNCTIES (weergave)
   ===================================================================== */
export function fmt(n) {
  if (!isFinite(n)) return '∞';
  const a = Math.abs(n);
  if (a < 10) return (Math.round(n * 10) / 10).toString().replace('.', ',');
  if (a < 1000) return String(Math.floor(n));
  const u = ['k', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx'];
  let i = -1, v = a;
  while (v >= 1000 && i < u.length - 1) { v /= 1000; i++; }
  return (n < 0 ? '-' : '') + (v < 10 ? (Math.floor(v * 100) / 100) : v < 100 ? (Math.floor(v * 10) / 10) : Math.floor(v)).toString().replace('.', ',') + u[i];
}
export function fmtT(sec) {
  sec = Math.max(0, Math.ceil(sec));
  if (sec < 60) return sec + 's';
  if (sec < 3600) return Math.floor(sec / 60) + 'm ' + pad2(sec % 60) + 's';
  return Math.floor(sec / 3600) + 'u ' + pad2(Math.floor((sec % 3600) / 60)) + 'm';
}

/* =====================================================================
   4. GELUID
   ===================================================================== */
function makeAudio(flags) {
  let ac = null, master = null, mus = null, musT = null;
  const ensure = () => {
    if (ac) { if (ac.state === 'suspended') ac.resume().catch(() => {}); return ac; }
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ac = new C(); master = ac.createGain(); master.gain.value = 0.6; master.connect(ac.destination);
    } catch (e) { ac = null; }
    return ac;
  };
  const tone = (f, d = 0.15, type = 'sine', v = 0.1, at = 0, slide = 0) => {
    if (!flags().snd) return;
    const a = ensure(); if (!a) return;
    const t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.05);
  };
  const arp = (notes, step = 0.08, type = 'triangle', v = 0.09) => notes.forEach((f, i) => tone(f, 0.22, type, v, i * step));
  const whoosh = (d = 0.9) => {
    if (!flags().snd) return;
    const a = ensure(); if (!a) return;
    const n = Math.floor(a.sampleRate * d), buf = a.createBuffer(1, n, a.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    f.type = 'bandpass'; f.frequency.setValueAtTime(300, a.currentTime); f.frequency.exponentialRampToValueAtTime(2500, a.currentTime + d);
    g.gain.value = 0.12; src.buffer = buf; src.connect(f); f.connect(g); g.connect(master); src.start();
  };
  const CH = [[110, 164.8, 220, 277.2], [98, 146.8, 196, 246.9], [87.3, 130.8, 174.6, 220], [98, 146.8, 196, 293.7]];
  const music = (on) => {
    if (!on) {
      if (musT) { clearInterval(musT); musT = null; }
      if (mus && ac) { const m = mus; mus = null; m.g.gain.setTargetAtTime(0, ac.currentTime, 0.4); setTimeout(() => { try { m.os.forEach((o) => o.stop()); } catch (e) { /* */ } }, 2000); }
      return;
    }
    if (mus) return;
    const a = ensure(); if (!a) return;
    const g = a.createGain(), f = a.createBiquadFilter(), lfo = a.createOscillator(), lg = a.createGain();
    g.gain.value = 0; g.gain.setTargetAtTime(0.05, a.currentTime, 1.5);
    f.type = 'lowpass'; f.frequency.value = 700; lfo.frequency.value = 0.07; lg.gain.value = 300;
    lfo.connect(lg); lg.connect(f.frequency);
    const os = CH[0].map((fr, i) => { const o = a.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = fr; o.detune.value = (i - 1.5) * 6; o.connect(f); o.start(); return o; });
    f.connect(g); g.connect(master); lfo.start(); os.push(lfo);
    mus = { g, os }; let ci = 0;
    musT = setInterval(() => { ci = (ci + 1) % CH.length; os.slice(0, 4).forEach((o, i) => o.frequency.setTargetAtTime(CH[ci][i], a.currentTime, 1.2)); }, 9000);
  };
  return {
    unlock: ensure, music,
    tap: (p = 0) => tone(520 + p * 40, 0.09, 'triangle', 0.08, 0, 1.4),
    build: () => arp([392, 523, 659], 0.07),
    deny: () => tone(180, 0.14, 'sine', 0.08, 0, 0.7),
    coin: () => arp([988, 1319], 0.06, 'square', 0.04),
    research: () => arp([523, 659, 784, 1047], 0.09),
    launch: () => { whoosh(1.1); tone(110, 0.9, 'sawtooth', 0.04, 0, 3); },
    land: () => arp([784, 659, 523], 0.1),
    quest: () => arp([523, 659, 784, 1047, 1319], 0.07),
    star: () => arp([1047, 1568, 2093], 0.05, 'sine', 0.07),
    bad: () => tone(220, 0.35, 'sawtooth', 0.04, 0, 0.5),
    close: () => { music(false); try { if (ac) ac.close(); } catch (e) { /* */ } ac = null; },
  };
}

/* =====================================================================
   4b. GRAFISCHE KERN (dynamisch geladen, zodat de pure logica ook in node werkt)
   ===================================================================== */
const G = { art: null, icons: null, fx: null, set: null, panel: null, scenes: null, themes: null };
async function loadGfx() {
  const ld = async (k, p) => { try { G[k] = await import(p); } catch (e) { G[k] = null; } };
  await Promise.all([ld('art', './gfx/art.js?v=1'), ld('icons', './gfx/icons.js?v=1'), ld('fx', './gfx/fx.js?v=1'), ld('set', './gfx/settings.js?v=1'), ld('panel', './gfx/panel.js?v=1'), ld('scenes', './gfx/scenes.js?v=1')]);
}
const gq = () => (G.set && G.set.GFX ? G.set.GFX.q : 1);
const gred = () => !!(G.set && G.set.GFX && G.set.GFX.reduce);
const uiS = () => { try { return (G.set && G.set.Settings.get().uiScale) || 1; } catch (e) { return 1; } };

// 3D-icoonnamen per id (alles wat niet in de lijst staat valt terug op de emoji van het item)
export const IC = {
  batt: 'bolt', kweek: 'mushroom', zuiver: 'wave', graaf: 'tractor', museum: 'castle', uni: 'book', bos: 'tree', casino: 'dice', thorium: 'flame', warpbaken: 'comet',
  r_batt: 'bolt', r_kweek: 'mushroom', r_zuiver: 'wave', r_graaf: 'tractor', r_museum: 'castle', r_uni: 'book', r_bos: 'tree', r_casino: 'dice', r_thor: 'flame', r_hyper: 'comet',
  solar: 'sun', mijn: 'pickaxe', oxy: 'cloud', kas: 'tomato', wonen: 'house', lab: 'microscope', hangaar: 'rocket', handel: 'shop', werk: 'robot', reactor: 'bolt', schild: 'shield',
  hotel: 'skyscraper', kas2: 'carrot', oxy2: 'fountain', steen: 'rock', sat: 'satellite', zontoren: 'tower', bank: 'bag', drone: 'helicopter', toer: 'ferriswheel', obs: 'globe', smelt: 'factory', kristal: 'crystal', alien: 'ufo',
  del: 'pickaxe', ond: 'microscope', kwe: 'tomato', han: 'coin',
  erts: 'rock', kennis: 'microscope', cred: 'coin',
  mars: 'planet', venus: 'sun', mercurius: 'flame', ceres: 'rock', europa: 'snowflake', titan: 'earth', ringen: 'ring', neptunus: 'wave', kepler: 'earth', pluto: 'snowflake', aurora: 'star', proxima: 'alien', trappist: 'earth', kometen: 'comet', zwart: 'ghost',
  ijzer: 'magnet', zwavel: 'flask', zonnemetaal: 'bolt', kosmisch: 'gear', ijskristal: 'gem', methaan: 'cloud', ringijs: 'snowflake', diamant: 'gem', biogel: 'potion', rijp: 'crystal', alienmetaal: 'shield', oerzaad: 'clover', komeetijs: 'comet', donker: 'ghost',
  r_hand: 'hammer', r_zon: 'sun', r_boor: 'pickaxe', r_kas: 'carrot', r_o2: 'leaf', r_wonen: 'house', r_hangaar: 'rocket', r_handel: 'shop', r_robot: 'robot', r_motor: 'satellite', r_cargo: 'chest', r_reactor: 'bolt', r_schild: 'shield', r_ai: 'lightbulb', r_ver: 'compass', r_boor2: 'bomb', r_warp: 'comet', r_terra: 'earth',
  r_hotel: 'skyscraper', r_steen: 'rock', r_sat: 'satellite', r_kas2: 'carrot', r_o2b: 'fountain', r_bank: 'bag', r_drone: 'helicopter', r_zon2: 'tower', r_smelt: 'factory', r_toer: 'ferriswheel', r_obs: 'globe', r_kristal: 'crystal', r_alien: 'ufo', r_prox: 'planet', r_deep: 'map',
  start: 'bag', tap: 'hammer', ert: 'pickaxe', ken: 'book', fast: 'rocket', off: 'moon', solw: 'sun', cre: 'bag', hui: 'house', dag: 'gift',
};
export const SKINS = {
  maan: { n: 'Maan', ic: 'moon', sky: ['#05081c', '#171a4a', '#33306e'], neb: ['120,90,220', '60,200,180'], planet: ['#ffd9a8', '#c46f8a'], pg: '#ffb08a', ring: '255,230,200', g1: '#8d8cc9', g2: '#4a4983', gb: '#4b4a86', cr: '40,38,90', edge: '190,190,240', ridge: '#2c2b63', accent: '#8be3c4', d: 'Grijs stof en paarse nevels' },
  mars: { n: 'Mars', ic: 'flame', sky: ['#1a0806', '#4d1c10', '#b0562c'], neb: ['255,120,60', '255,200,120'], planet: ['#dff1ff', '#4b78c4'], pg: '#8fc0ff', ring: '', g1: '#d98353', g2: '#7e3822', gb: '#8d3f26', cr: '70,25,15', edge: '255,190,150', ridge: '#6d2a1a', accent: '#ffc58a', d: 'Rode rotsen en een blauwe aarde' },
  ijs: { n: 'IJsmaan', ic: 'snowflake', sky: ['#031326', '#0b3050', '#2a78ab'], neb: ['100,200,255', '190,245,255'], planet: ['#ffffff', '#8fc8f2'], pg: '#bfe8ff', ring: '200,240,255', g1: '#ecf7ff', g2: '#a8cae4', gb: '#b4d3ea', cr: '90,130,170', edge: '255,255,255', ridge: '#5d8fb5', accent: '#a8e6ff', d: 'Sneeuw, ijs en een koude gloed' },
  neon: { n: 'Neon-station', ic: 'robot', sky: ['#070015', '#2b0b4d', '#80206f'], neb: ['255,60,200', '60,255,230'], planet: ['#fff0a8', '#ff4fa0'], pg: '#ff7ad0', ring: '255,120,255', g1: '#4b3394', g2: '#1c1040', gb: '#271657', cr: '10,5,30', edge: '255,110,255', ridge: '#3a1766', accent: '#ff9bf0', d: 'Gloeiende lichten in de nacht' },
};
// emoji -> icoon (uit icons.js) voor teksten
let REV = null, EMO_RE = null;
function buildRev() {
  const sv = (x) => x.replace(/\uFE0F/g, '');
  REV = { '👩‍🚀': 'astronaut', '⚙': 'gear', '💨': 'cloud', '✨': 'star', '🕳': 'ghost', '⭐': 'star' };
  const I = G.icons && G.icons.ICONS;
  if (I) for (const [n, e] of Object.entries(I)) if (!REV[sv(e)]) REV[sv(e)] = n;
  const keys = Object.keys(REV).filter((k) => G.art && G.art.has(REV[k])).sort((a, b) => b.length - a.length);
  EMO_RE = keys.length ? new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\uFE0F?').join('|'), 'g') : null;
}
const FB = { hammer: '🔨', astronaut: '🧑‍🚀', microscope: '🔬', rocket: '🚀', coin: '🪙', trophy: '🏆', star: '⭐', lock: '🔒', gift: '🎁', target: '🎯', moon: '🌙', bag: '💰', bolt: '⚡', cloud: '☁️', tomato: '🍅', robot: '🤖', snowflake: '❄️', flame: '🔥' };
function I(name, size = 40, extra = '') {
  if (G.art) return G.art.icon(name, { size: Math.round(size * (size > 24 ? uiS() : 1)), cls: extra, alt: '' });
  return `<span class="rb-em" style="font-size:${Math.round(size * 0.8)}px">${FB[name] || ''}</span>`;
}
// icoon voor een item (met id en e) - groot
const ico = (it, size = 44) => {
  const name = IC[it.id] || (REV && REV[(it.e || '').replace(/\uFE0F/g, '')]);
  if (G.art && name && G.art.has(name)) return I(name, size);
  return `<span class="rb-em" style="font-size:${Math.round(size * 0.78 * uiS())}px">${it.e || ''}</span>`;
};
const rico = (r, size = 20) => {
  const name = IC[r] || 'rock';
  return G.art && G.art.has(name) ? I(name, size) : `<span class="rb-em">${E[r] || ''}</span>`;
};
// tekst met emoji's -> tekst met kleine icoontjes
function T(str) {
  if (!str) return '';
  if (!REV) buildRev();
  if (!EMO_RE) return str;
  EMO_RE.lastIndex = 0;
  return str.replace(EMO_RE, (m) => I(REV[m.replace(/\uFE0F/g, '')], 20));
}

/* =====================================================================
   5. STIJL
   ===================================================================== */
const CSS = `
.rb-root{--rb-acc:#8be3c4;position:relative;display:flex;flex-direction:column;height:calc(100dvh - 4.4rem);min-height:600px;max-height:1100px;background:#0a0f26;color:#e8ecff;border-radius:18px;overflow:hidden;font-size:calc(16px * var(--gfx-font,1));line-height:1.3;-webkit-user-select:none;user-select:none;touch-action:manipulation;box-sizing:border-box;margin:.4rem 0;border:1px solid #27305e;box-shadow:0 10px 30px rgba(0,0,10,.35)}
.rb-root *{box-sizing:border-box}
.rb-root button{font:inherit;color:inherit;cursor:pointer;border:1px solid #2f3a73;background:linear-gradient(#1d2658,#161d44);border-radius:12px;padding:.5em .8em;min-height:calc(44px * var(--gfx-scale,1));box-shadow:0 2px 0 rgba(0,0,0,.25)}
.rb-root button:active{transform:scale(.96)}
.rb-em{display:inline-block;text-align:center;line-height:1}
.rb-root .gfx-icon{vertical-align:middle;filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))}
.rb-top{display:flex;flex-direction:column;gap:4px;padding:8px 10px;background:linear-gradient(#11183a,#0d1330);border-bottom:1px solid #222c5a;flex:0 0 auto}
.rb-row{display:flex;gap:6px;flex-wrap:nowrap;justify-content:space-between;align-items:stretch}
.rb-pill{flex:1 1 0;min-width:0;background:linear-gradient(#1b2358,#151c4a);border:1px solid #2a3570;border-radius:12px;padding:3px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700;font-size:1.05em}
.rb-pill small{display:block;font-weight:400;color:#9aa6d6;font-size:.72em;margin-top:-1px}
.rb-root button.rb-gear{flex:0 0 auto;width:calc(48px * var(--gfx-scale,1));padding:0;font-size:1.5em;line-height:1}
.rb-chip{flex:1 1 0;display:flex;align-items:center;justify-content:center;gap:4px;font-size:.85em;color:#bcc6f0;background:#121a40;border-radius:10px;padding:2px 4px;white-space:nowrap}
.rb-chip.bad{color:#ffb4a8;background:#3b1c2c}
.rb-scene{position:relative;flex:0 0 38%;min-height:190px;max-height:380px;background:#070b1e;overflow:hidden}
.rb-scene canvas{display:block;width:100%;height:100%;touch-action:none}
.rb-toasts{position:absolute;left:6px;right:6px;top:6px;display:flex;flex-direction:column;gap:4px;pointer-events:none}
.rb-toast{align-self:center;background:rgba(18,26,64,.94);border:1px solid #3a4890;border-radius:14px;padding:5px 12px;font-size:.92em;animation:rb-in .25s ease-out;max-width:96%;box-shadow:0 4px 14px rgba(0,0,0,.4)}
@keyframes rb-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.rb-quest{flex:0 0 auto;display:flex;align-items:center;gap:8px;padding:8px 12px;background:#141c46;border-bottom:1px solid #222c5a;cursor:pointer;min-height:calc(44px * var(--gfx-scale,1))}
.rb-quest b{color:var(--rb-acc)}
.rb-quest span{flex:1;min-width:0}
.rb-body{flex:1 1 auto;overflow-y:auto;padding:10px;-webkit-overflow-scrolling:touch}
.rb-nav{flex:0 0 auto;display:flex;background:#0d1330;border-top:1px solid #222c5a}
.rb-nav button{flex:1;border:0;border-radius:0;background:transparent;box-shadow:none;padding:6px 0 5px;font-size:.72em;color:#9aa6d6;position:relative;min-width:0;min-height:calc(58px * var(--gfx-scale,1))}
.rb-nav button span{display:block;line-height:1.1;margin-bottom:1px}
.rb-nav button.on{color:var(--rb-acc);background:#151e4b}
.rb-nav button.hl{animation:rb-pulse 1.2s infinite}
@keyframes rb-pulse{50%{background:#2a3a7c;color:#fff}}
.rb-badge{position:absolute;top:3px;right:16%;background:#ff8a9a;color:#fff;border-radius:99px;font-size:11px;padding:0 6px;min-width:17px}
.rb-card{display:flex;gap:11px;align-items:center;background:linear-gradient(#151e4c,#121a42);border:1px solid #26306a;border-radius:16px;padding:10px;margin-bottom:9px;box-shadow:0 3px 10px rgba(0,0,12,.28)}
.rb-card.lock{opacity:.5}
.rb-card.done{opacity:.8;border-color:#2f6f5a}
.rb-ic{width:calc(56px * var(--gfx-scale,1));text-align:center;flex:0 0 auto}
.rb-mid{flex:1;min-width:0}
.rb-mid b{font-size:1.05em}
.rb-mid small{display:block;color:#a6b1de;font-size:.8em;margin-top:1px}
.rb-act{flex:0 0 auto;display:flex;flex-direction:column;align-items:flex-end;gap:4px;max-width:46%}
.rb-act button{background:linear-gradient(#34877a,#2a6f63);border-color:#3b9c8a;font-weight:700;white-space:nowrap}
.rb-act button.no{background:#232b5a;border-color:#2f3a73;color:#8f9ac7}
.rb-c{font-size:.8em;background:#0d1330;border-radius:9px;padding:1px 6px;margin-left:2px;white-space:nowrap;display:inline-flex;align-items:center;gap:3px}
.rb-c.no{color:#ff9aa8}
.rb-h{font-weight:800;margin:14px 2px 8px;color:#b8a4ff;font-size:1em}
.rb-seg{display:flex;gap:6px;margin-bottom:9px;flex-wrap:wrap}
.rb-seg button{flex:1;padding:.35em}
.rb-seg button.on{background:linear-gradient(#34877a,#2a6f63);border-color:#3b9c8a}
.rb-bar{height:9px;background:#0d1330;border-radius:9px;overflow:hidden;margin-top:5px}
.rb-bar i{display:block;height:100%;background:linear-gradient(90deg,#8be3c4,#b8a4ff)}
.rb-ctl{display:flex;align-items:center;gap:8px}
.rb-ctl button{width:calc(46px * var(--gfx-scale,1));padding:0;font-size:1.3em}
.rb-ctl b{min-width:26px;text-align:center;font-size:1.1em}
.rb-modal{position:absolute;inset:0;background:rgba(5,8,22,.8);display:flex;align-items:center;justify-content:center;padding:14px;z-index:5}
.rb-modal[hidden]{display:none}
.rb-mbox{background:#141c46;border:1px solid #3a4890;border-radius:20px;padding:18px;max-width:460px;width:100%;max-height:92%;overflow:auto;box-shadow:0 10px 40px #000a}
.rb-mbox h3{margin:0 0 8px;font-size:1.25em}
.rb-mbox .rb-btns{display:flex;gap:8px;margin-top:14px}
.rb-mbox .rb-btns button{flex:1;padding:.7em}
.rb-mbox .rb-btns button.pri{background:linear-gradient(#34877a,#2a6f63);border-color:#3b9c8a;font-weight:700}
.rb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(112px * var(--gfx-scale,1)),1fr));gap:8px}
.rb-ach{background:#131b44;border:1px solid #26306a;border-radius:14px;padding:8px;text-align:center;font-size:.8em}
.rb-ach .rb-em,.rb-ach .gfx-icon{display:block;margin:0 auto 2px}
.rb-ach.off{opacity:.35;filter:grayscale(1)}
.rb-skins{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:10px}
.rb-skin{display:flex;flex-direction:column;align-items:center;gap:3px;text-align:center;padding:10px 6px !important}
.rb-skin.on{border-color:var(--rb-acc) !important;box-shadow:0 0 0 2px var(--rb-acc) !important}
.rb-skin i{display:block;width:100%;height:34px;border-radius:9px;border:1px solid rgba(255,255,255,.2)}
.rb-skin small{font-size:.75em;color:#a6b1de}
.rb-note{color:#a6b1de;font-size:.85em;margin:5px 2px}
.rb-up{color:#8be3c4}.rb-dn{color:#ff9aa8}
html[data-reduce="1"] .rb-toast,html[data-reduce="1"] .rb-nav button.hl{animation:none}
`;

/* =====================================================================
   6. TEKENEN
   ===================================================================== */
const TAU = Math.PI * 2;
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function circ(c, x, y, r, fill) { c.fillStyle = fill; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
function dome(c, r, fill, stroke = 'rgba(255,255,255,.7)') {
  c.fillStyle = fill; c.beginPath(); c.arc(0, 0, r, Math.PI, 0); c.closePath(); c.fill();
  c.strokeStyle = stroke; c.lineWidth = 1.4; c.beginPath(); c.arc(0, 0, r, Math.PI, 0); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(-r * 0.3, -r * 0.45, r * 0.4, Math.PI * 1.1, Math.PI * 1.5); c.stroke();
}
const SPR = {
  landing(c, t) {
    c.fillStyle = '#9aa7d8'; c.beginPath(); c.moveTo(-24, 0); c.lineTo(-14, -12); c.lineTo(14, -12); c.lineTo(24, 0); c.closePath(); c.fill();
    c.fillStyle = '#e9edff'; rr(c, -15, -36, 30, 26, 9); c.fill();
    circ(c, 0, -25, 6, '#3c4f98'); circ(c, 0, -25, 4.2, 'rgba(255,233,168,' + (0.75 + 0.2 * Math.sin(t * 2)) + ')');
    c.strokeStyle = '#cfd6f5'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(15, -36); c.lineTo(15, -50); c.stroke();
    c.fillStyle = '#ff8a9a'; c.beginPath(); c.moveTo(15, -50); c.lineTo(27 + Math.sin(t * 3) * 1.5, -46); c.lineTo(15, -42); c.fill();
  },
  solar(c, t) {
    c.strokeStyle = '#aab4e0'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -12); c.stroke();
    c.save(); c.translate(0, -16); c.rotate(-0.35); c.fillStyle = '#2f4fa8'; c.fillRect(-17, -5, 34, 10);
    c.strokeStyle = '#8fb0ff'; c.lineWidth = 0.8; for (let i = -12; i <= 12; i += 8) { c.beginPath(); c.moveTo(i, -5); c.lineTo(i, 5); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,' + (0.1 + 0.1 * Math.sin(t * 2)) + ')'; c.fillRect(-17, -5, 34, 4); c.restore();
  },
  reactor(c, t) {
    c.fillStyle = '#7f8fb8'; c.fillRect(-10, -26, 20, 26); c.fillStyle = '#a9b6dc'; c.fillRect(-12, -30, 24, 6);
    circ(c, 0, -14, 6 + Math.sin(t * 4), 'rgba(124,243,255,.9)'); circ(c, 0, -14, 3, '#fff');
  },
  oxy(c, t) {
    c.fillStyle = '#9fd8ff'; c.beginPath(); c.ellipse(0, -14, 11, 14, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-4, -18, 3, 6, 0, 0, TAU); c.fill();
    for (let i = 0; i < 3; i++) { const p = (t * 0.6 + i / 3) % 1; circ(c, Math.sin(i * 2 + t) * 4, -2 - p * 22, 1.6, 'rgba(255,255,255,' + (1 - p) + ')'); }
  },
  kas(c, t) {
    c.save(); dome(c, 18, 'rgba(140,230,170,.45)'); c.restore();
    for (let i = -1; i <= 1; i++) { circ(c, i * 8, -5, 4, '#4cc27f'); circ(c, i * 8 + 2, -9 + Math.sin(t + i), 2.5, '#7be3a0'); }
    circ(c, 0, -2, 2.2, '#ff7d70');
  },
  mijn(c, t) {
    c.strokeStyle = '#c9a77a'; c.lineWidth = 2; c.beginPath(); c.moveTo(-10, 0); c.lineTo(0, -28); c.lineTo(10, 0); c.moveTo(-5, -14); c.lineTo(5, -14); c.stroke();
    c.save(); c.translate(0, -28); c.rotate(t * 2); c.strokeStyle = '#e8d9bd'; for (let i = 0; i < 4; i++) { c.rotate(TAU / 4); c.beginPath(); c.moveTo(0, 0); c.lineTo(7, 0); c.stroke(); } c.restore();
    circ(c, 15, -3, 4, '#8b7355'); circ(c, 19, -2, 3, '#ffd27a'); circ(c, 13, -6, 2.5, '#a68a63');
  },
  wonen(c, t) {
    c.fillStyle = '#c8cfee'; rr(c, -15, -18, 30, 18, 3); c.fill();
    c.save(); c.translate(0, -18); dome(c, 10, 'rgba(180,200,255,.5)'); c.restore();
    c.fillStyle = '#ffd98a'; c.fillRect(-10, -12, 6, 6); c.fillStyle = 'rgba(255,217,138,' + (0.6 + 0.3 * Math.sin(t)) + ')'; c.fillRect(4, -12, 6, 6);
  },
  lab(c, t) {
    c.save(); dome(c, 17, 'rgba(184,164,255,.45)'); c.restore();
    c.fillStyle = '#e9edff'; c.beginPath(); c.moveTo(-3, -16); c.lineTo(3, -16); c.lineTo(7, -2); c.lineTo(-7, -2); c.closePath(); c.fill();
    circ(c, 0, -5, 3, 'rgba(184,164,255,.9)'); circ(c, Math.sin(t * 2) * 2, -9 - ((t * 5) % 4), 1.2, '#fff');
    circ(c, 14, -4, 1.8, Math.sin(t * 5) > 0 ? '#ff8a9a' : '#5a3a58');
  },
  hangaar(c, t) {
    c.fillStyle = '#8c98cc'; c.beginPath(); c.moveTo(-22, 0); c.lineTo(-22, -12); c.arc(0, -12, 22, Math.PI, 0); c.lineTo(22, 0); c.closePath(); c.fill();
    c.fillStyle = '#1e2552'; c.beginPath(); c.moveTo(-10, 0); c.lineTo(-10, -12); c.arc(0, -12, 10, Math.PI, 0); c.lineTo(10, 0); c.closePath(); c.fill();
    c.fillStyle = '#fff'; rr(c, -3, -26, 6, 18, 3); c.fill(); c.fillStyle = '#ff8a9a'; c.beginPath(); c.moveTo(-3, -24); c.lineTo(0, -31); c.lineTo(3, -24); c.fill();
  },
  handel(c, t) {
    c.fillStyle = '#7a5a3a'; c.fillRect(-12, -10, 24, 10);
    for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? '#fff' : '#ff8a9a'; c.beginPath(); c.moveTo(-14 + i * 7, -12); c.lineTo(-7 + i * 7, -12); c.lineTo(-6 + i * 7 - 1, -22); c.lineTo(-15 + i * 7 + 1, -22); c.fill(); }
    circ(c, -5, -13, 2.2, '#ffd27a'); circ(c, 4, -13, 2.2, '#8be3c4');
  },
  werk(c, t) {
    c.fillStyle = '#9a8fc0'; c.fillRect(-16, -16, 28, 16); c.fillStyle = '#7a70a0'; c.fillRect(6, -30, 7, 16);
    for (let i = 0; i < 3; i++) { const p = (t * 0.4 + i / 3) % 1; circ(c, 10 + p * 6, -32 - p * 14, 3 + p * 3, 'rgba(220,220,255,' + 0.5 * (1 - p) + ')'); }
    c.save(); c.translate(-6, -8); c.rotate(-t); c.fillStyle = '#ffd27a'; for (let i = 0; i < 6; i++) { c.rotate(TAU / 6); c.fillRect(-1, -6, 2, 3); } circ(c, 0, 0, 4, '#ffd27a'); circ(c, 0, 0, 1.5, '#7a70a0'); c.restore();
  },
  schild(c, t) {
    c.strokeStyle = '#aab4e0'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -16); c.stroke();
    c.fillStyle = '#d6dcf7'; c.beginPath(); c.ellipse(0, -18, 11, 5, -0.4, 0, Math.PI); c.fill();
    const p = (t * 0.5) % 1; c.strokeStyle = 'rgba(139,227,196,' + (1 - p) + ')'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, -16, 6 + p * 20, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
  },
};
const ORDER = ['solar', 'mijn', 'oxy', 'kas', 'wonen', 'lab', 'hangaar', 'handel', 'werk', 'reactor', 'schild', 'hotel', 'kas2', 'oxy2', 'steen', 'sat', 'zontoren', 'bank', 'drone', 'toer', 'obs', 'smelt', 'kristal', 'alien'];

/* =====================================================================
   7. DE VIEW
   ===================================================================== */
const TABS = [['bouw', 'hammer', 'Bouw'], ['team', 'astronaut', 'Team'], ['lab', 'microscope', 'Lab'], ['mis', 'rocket', 'Missies'], ['han', 'coin', 'Handel'], ['doel', 'trophy', 'Doelen'], ['meer', 'star', 'Meer']];

export async function ruimtebasisView(ctx) {
  const { db, me, view, addCleanup } = ctx;
  const uid = (me && me.uid) || 'anon';
  let alive = true;
  const timers = new Set(), tos = new Set();
  const setI = (f, ms) => { const id = setInterval(f, ms); timers.add(id); return id; };
  const setT = (f, ms) => { const id = setTimeout(() => { tos.delete(id); f(); }, ms); tos.add(id); return id; };
  let S = null, store = null, raf = 0, audio = null, offSet = null;
  let dirty = false, saveTO = 0, cloudDirty = false;

  view.innerHTML = '<div class="rb-load" style="padding:2rem;text-align:center">🪐 Ruimtebasis laden…</div>';
  const st = document.createElement('style'); st.textContent = CSS;

  const cleanup = () => {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(raf);
    timers.forEach(clearInterval); tos.forEach(clearTimeout); timers.clear(); tos.clear();
    window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
    window.removeEventListener('pagehide', onHide); document.removeEventListener('visibilitychange', onVis);
    if (S && store) { S.t = Date.now(); store.saveLocal(S); store.saveCloud(S, true); }
    if (audio) audio.close();
    if (sceneRun) { try { sceneRun.stop(); } catch (e) { /* stil */ } }
    if (offSet) offSet();
    if (st.parentNode) st.parentNode.removeChild(st);
  };
  addCleanup(cleanup);

  let fs = null;
  try { fs = await import(FS_URL); } catch (e) { fs = null; }
  await loadGfx();
  if (!alive) return;
  store = makeStore({ uid, db, fs, storage: (() => { try { return window.localStorage; } catch (e) { return { getItem() { return null; }, setItem() {} }; } })() });
  S = await store.load();
  if (!alive) return;
  const isNew = !S;
  if (!S) S = newState();
  r4Attach(ctx, view, () => S);
  audio = makeAudio(() => S.set);

  /* ---------- offline-voortgang ---------- */
  const NOW0 = Date.now();
  let away = null;
  if (!isNew) {
    const secs = (NOW0 - S.t) / 1000;
    if (secs > 60) {
      const b = { e: S.r.erts, k: S.r.kennis, c: S.r.cred, p: Math.floor(S.pop) };
      advance(S, Math.min(secs, OFFLINE_MAX), offlineEff(S), NOW0);
      const ready = S.mis.filter((m) => m.e <= NOW0).length;
      away = { secs: Math.min(secs, OFFLINE_MAX), e: S.r.erts - b.e, k: S.r.kennis - b.k, c: S.r.cred - b.c, p: Math.floor(S.pop) - b.p, ready };
    }
  }
  S.t = NOW0;

  /* ---------- UI opbouw ---------- */
  view.innerHTML = '';
  view.appendChild(st);
  const root = document.createElement('div');
  root.className = 'rb-root';
  root.innerHTML = `
    <div class="rb-top">
      <div class="rb-row">
        <div class="rb-pill" data-k="erts"></div><div class="rb-pill" data-k="kennis"></div><div class="rb-pill" data-k="cred"></div><button class="rb-gear" data-a="gear" aria-label="Instellingen">⚙</button>
      </div>
      <div class="rb-row">
        <div class="rb-chip" data-k="pw"></div><div class="rb-chip" data-k="o2"></div><div class="rb-chip" data-k="fo"></div><div class="rb-chip" data-k="pp"></div>
      </div>
    </div>
    <div class="rb-scene"><canvas></canvas><div class="rb-toasts"></div></div>
    <div class="rb-quest" data-a="tab:doel"></div>
    <div class="rb-body"></div>
    <nav class="rb-nav">${TABS.map((t) => `<button data-a="tab:${t[0]}" data-t="${t[0]}"><span>${I(t[1], 30)}</span>${t[2]}</button>`).join('')}</nav>
    <div class="rb-modal" hidden></div>`;
  view.appendChild(root);
  const $ = (sel) => root.querySelector(sel);
  const cv = $('canvas'), body = $('.rb-body'), toasts = $('.rb-toasts'), modalEl = $('.rb-modal'), questEl = $('.rb-quest');
  const topEls = {}; root.querySelectorAll('[data-k]').forEach((el) => { topEls[el.dataset.k] = el; });

  let tab = 'bouw', bulk = '1', R = rates(S, Date.now()), lastHtml = '', pDown = false, coinBurst = () => {};
  const skinId = () => (SKINS[S.set.skin] ? S.set.skin : 'maan');
  const skin = () => SKINS[skinId()];
  let sceneRun = null;
  let rocketAnim = 0;

  const toast = (txt) => {
    const d = document.createElement('div'); d.className = 'rb-toast'; d.innerHTML = T(txt); toasts.appendChild(d);
    while (toasts.children.length > 3) toasts.removeChild(toasts.firstChild);
    setT(() => { if (d.parentNode) d.parentNode.removeChild(d); }, 3400);
  };
  const markDirty = () => {
    dirty = true; cloudDirty = true;
    if (!saveTO) saveTO = setT(() => { saveTO = 0; saveNow(); }, 2500);
  };
  const saveNow = () => { if (!dirty) return; dirty = false; S.t = Date.now(); store.saveLocal(S); };
  const saveCloudMaybe = () => { if (cloudDirty) { cloudDirty = false; store.saveCloud(S).then((ok) => { if (!ok) cloudDirty = true; }); } };
  setI(() => { if (!alive) return; S.t = Date.now(); dirty = true; saveNow(); }, 10000);
  setI(() => { if (alive) saveCloudMaybe(); }, CLOUD_EVERY);
  function onHide() { S.t = Date.now(); dirty = true; saveNow(); store.saveCloud(S, true); }
  function onVis() { if (document.hidden) onHide(); }
  window.addEventListener('pagehide', onHide); document.addEventListener('visibilitychange', onVis);

  /* ---------- weergave van tabs ---------- */
  const costHtml = (c) => Object.entries(c).map(([r, v]) => `<span class="rb-c${S.r[r] >= v ? '' : ' no'}">${rico(r, 18)} ${fmt(v)}</span>`).join('');
  const btn = (act, label, ok, extra = '') => `<button class="${ok ? '' : 'no'}" data-a="${act}" ${extra}>${label}</button>`;
  const card = (cls, ic, mid, act = '') => `<div class="rb-card ${cls}"><div class="rb-ic">${ic}</div><div class="rb-mid">${mid}</div>${act ? `<div class="rb-act">${act}</div>` : ''}</div>`;
  const lockIc = () => (G.art ? I('lock', 40) : '<span class="rb-em" style="font-size:30px">🔒</span>');

  function vBouw() {
    let h = `<div class="rb-seg">${['1', '10', 'max'].map((b) => `<button class="${bulk === b ? 'on' : ''}" data-a="bulk:${b}">${b === 'max' ? 'Max' : 'x' + b}</button>`).join('')}</div>`;
    for (const m of MODS) {
      const o = nb(S, m.id);
      if (!unlocked(S, m)) { h += card('lock', lockIc(), `<b>${m.n}</b><small>Onderzoek eerst ${T(RES[m.req].e)} ${RES[m.req].n} in het Lab</small>`); continue; }
      const k = bulk === 'max' ? Math.max(1, maxBuy(S, m)) : +bulk;
      const c = modCost(m, o, k), ok = canPay(S, c);
      h += card('', ico(m), `<b>${m.n}</b> <span class="rb-c">x${o}</span><small>${T(m.fx)}</small>${TIERS_ON[m.id] && nextTier(o) ? `<small>Mijlpaal: dubbel bij ${nextTier(o)} (nu x${tierMul(o)})</small>` : ''}`, `${btn('buy:' + m.id + ':' + k, 'Bouw' + (k > 1 ? ' x' + k : ''), ok)}<div>${costHtml(c)}</div>`);
    }
    h += '<div class="rb-h">Verbeteringen (x1,8 per niveau)</div>';
    for (const id of UPS) {
      const m = MOD[id], L = upLevel(S, id), c = upCost(S, id);
      if (!unlocked(S, m) && !L) continue;
      h += card('', ico(m), `<b>${m.n}-upgrade</b> <span class="rb-c">niveau ${L}/${UP_MAX}</span><small>Nu x${fmt(upMul(S, id))} opbrengst. Zeldzaam spul van missies is nodig!</small>`, L >= UP_MAX ? '<span class="rb-c">max</span>' : btn('up:' + id, 'Verbeter', canPay(S, c)) + '<div>' + costHtml(c) + '</div>');
    }
    return h;
  }
  function vTeam() {
    const pop = Math.floor(S.pop);
    let h = card('', I('astronaut', 44), `<b>${pop} bewoners</b> van ${R.house} plekken<small>${R.growth > 0 ? 'Er komt zo weer iemand bij!' : pop >= R.house ? T('Vol! Bouw een 🏠 woonmodule.') : 'Zorg voor genoeg zuurstof en voedsel.'}</small><small>Werkgeluk: ${Math.round(R.wel * 100)}%${R.wel < 0.7 ? T(' (bouw 💨 / 🍅 bij)') : ''}</small>`);
    h += `<div class="rb-h">Taken (${R.free} vrij)</div>`;
    for (const t of TASKS) {
      h += card('', ico(t), `<b>${t.n}</b><small>${T(t.d)}</small>`, `<div class="rb-ctl">${btn('asg:' + t.id + ':-1', '−', true)}<b>${S.w[t.id]}</b>${btn('asg:' + t.id + ':1', '+', R.free >= 1)}</div>`);
    }
    h += `<div class="rb-seg">${btn('auto', '⚖️ Slim verdelen', true)}</div>`;
    h += `<div class="rb-h">Robots</div>`;
    const c = robotCost(S), cap = R.botCap;
    if (!unlocked(S, MOD.werk)) h += card('lock', lockIc(), `<b>Robots</b><small>${T('Onderzoek 🤖 Robotica en bouw een 🏭 Robotfabriek')}</small>`);
    else h += card('', I('robot', 44), `<b>${S.bots} van ${cap} robots</b><small>${T('Werken altijd, eten niks. Gebruiken 0,5 ⚡')}</small>`, `${btn('robot', 'Bouw robot', S.bots < cap && canPay(S, c))}<div>${costHtml(c)}</div>`);
    return h;
  }
  function vLab() {
    const av = [], lk = [], dn = [];
    for (const r of RESEARCH) (S.res.includes(r.id) ? dn : resAvail(S, r) ? av : lk).push(r);
    let h = '<div class="rb-h">Beschikbaar</div>';
    if (!av.length) h += '<div class="rb-note">Alles onderzocht wat nu kan!</div>';
    for (const r of av) h += card('', ico(r), `<b>${r.n}</b><small>${T(r.d)}</small>`, `${btn('res:' + r.id, 'Onderzoek', canPay(S, r.c))}<div>${costHtml(r.c)}</div>`);
    if (lk.length) { h += '<div class="rb-h">Later</div>'; for (const r of lk) h += card('lock', lockIc(), `<b>${r.n}</b><small>Eerst: ${T(RES[r.req].e)} ${RES[r.req].n}</small>`); }
    if (dn.length) { h += '<div class="rb-h">Klaar</div>'; for (const r of dn) h += card('done', ico(r), `<b>${r.n}</b><small>${T(r.d)}</small>`); }
    return h;
  }
  function vMis() {
    const now = Date.now(), slots = nb(S, 'hangaar');
    let h = card('', ico(MOD.hangaar), `<b>${S.mis.length} van ${slots} raketplekken in gebruik</b><small>${slots ? 'Rampjes gebeuren soms (' + Math.round(hazChance(S) * 100) + '%): dan is de lading half. Nooit gevaarlijk!' : T('Onderzoek 🚀 Raketbouw en bouw een hangaar.')}</small>`);
    S.mis.forEach((m, i) => {
      const w = WORLDS[m.w], left = (m.e - now) / 1000, total = (m.e - m.s) / 1000, pr = Math.min(1, 1 - left / total);
      h += left <= 0
        ? card('done', ico(w), `<b>Raket terug van ${w.n}!</b><small>${m.hz ? w.hz + '. De lading is half.' : 'Alles goed gegaan.'}</small>`, btn('col:' + i, T('🎁') + ' Ophalen', true))
        : card('', I('rocket', 44), `<b>Onderweg naar ${w.n}</b><small>nog ${fmtT(left)}</small><div class="rb-bar"><i style="width:${Math.round(pr * 100)}%"></i></div>`);
    });
    h += '<div class="rb-h">Werelden</div>';
    WORLDS.forEach((w, i) => {
      const disc = S.wd.includes(w.id), open = worldOpen(S, w);
      if (!open) { h += card('lock', '<span class="rb-em" style="font-size:30px">❓</span>', `<b>Onbekende wereld</b><small>Onderzoek ${T(RES[w.req].e)} ${RES[w.req].n}</small>`); return; }
      const can = slots > S.mis.length && S.r.erts >= w.cost;
      h += card('', ico(w), `<b>${w.n}</b> ${disc ? '' : '<span class="rb-c">nieuw!</span>'}<small>${rico(w.rare, 16)} ${w.rn} (${fmt(price(S, w.rare))} ${rico('cred', 14)}/st) · ${fmtT(missionTime(S, w))}</small><small>Rampje: ${w.hz}</small>`, `${btn('go:' + i, 'Lanceer', can)}<div>${costHtml({ erts: w.cost })}</div>`);
    });
    return h;
  }
  function vHan() {
    const now = Date.now();
    let h = `<div class="rb-note">Prijzen gaan rustig op en neer. Verkoop als de pijl omhoog wijst. Handelsposten en onderzoek geven +${Math.round(tradeBonus(S) * 100)}% bonus.</div>`;
    const ids = ['erts'].concat(WORLDS.filter((w) => S.wd.includes(w.id)).map((w) => w.rare));
    for (const id of ids) {
      const p = price(S, id, now), p2 = price(S, id, now + 20000), amt = Math.floor(S.r[id]);
      h += card('', rico(id, 44), `<b>${RNAME[id]}</b> <span class="rb-c">${fmt(amt)}</span><small>${fmt(p)} ${rico('cred', 14)} per stuk <span class="${p2 >= p ? 'rb-up' : 'rb-dn'}">${p2 >= p ? '▲' : '▼'}</span></small>`, `<div style="display:flex;gap:5px">${btn('sell:' + id + ':1', 'x1', amt >= 1)}${btn('sell:' + id + ':10', 'x10', amt >= 10)}${btn('sell:' + id + ':all', 'Alles', amt >= 1)}</div>`);
    }
    const cr = Math.floor(S.r.cred);
    h += `<div class="rb-h">Erts inkopen</div>` + card('', I('bag', 44), `<b>Credits omzetten in erts</b><small>Kost ca. ${fmt(0.6 * price(S, 'erts', now) / (basePrice('erts') * (1 + tradeBonus(S))))} ${rico('cred', 14)} per ${rico('erts', 14)}</small>`, `<div style="display:flex;gap:5px">${btn('ore:0.25', '25%', cr >= 4)}${btn('ore:1', 'Alles', cr >= 4)}</div>`);
    h += `<div class="rb-note">Zeldzaam spul van nieuwe werelden verschijnt hier na je eerste bezoek.</div>`;
    return h;
  }
  function vDoel() {
    const q = QUESTS[S.q], d = dailyInfo(S);
    let h = `<div class="rb-h">Dagelijkse beloning</div>` + card('', I('gift', 44), `<b>Dag ${d.streak}${d.can ? '' : ' (al opgehaald)'}</b><small>${T('Elke dag meer, op dag 7 een ✨. ')}${d.can ? '' : 'Kom morgen terug!'}</small>`, btn('daily', 'Ophalen', d.can));
    h += '<div class="rb-h">Huidig doel</div>';
    if (q) {
      const p = q.p ? q.p(S) : null;
      h += card('', I('target', 44), `<b>${T(q.t)}</b>${p ? `<small>${fmt(Math.min(p[0], p[1]))} / ${fmt(p[1])}</small><div class="rb-bar"><i style="width:${Math.min(100, Math.round(p[0] / p[1] * 100))}%"></i></div>` : ''}<small>Beloning: ${rewText(q.rew)}</small>`);
    } else h += card('done', I('trophy', 44), '<b>Alle doelen gehaald!</b><small>Jij bent een echte sterrenkapitein.</small>');
    h += `<div class="rb-h">Prestaties (${S.ach.length}/${ACHS.length}) · elk +1% productie</div><div class="rb-grid">`;
    for (const a of ACHS) h += `<div class="rb-ach ${S.ach.includes(a.id) ? '' : 'off'}">${ico(a, 36)}<b>${a.n}</b><br>${a.d}</div>`;
    return h + '</div>';
  }
  const rewText = (r) => [r.e || r.m ? rico('erts', 16) + ' ' + fmt(Math.max(r.e || 0, (r.m || 0) * 60 * R.erts)) : '', r.k ? rico('kennis', 16) + ' ' + r.k : '', r.c ? rico('cred', 16) + ' ' + r.c : ''].filter(Boolean).join('  ');
  function vMeer() {
    const g = prestigeGain(S);
    let h = `<div class="rb-h">Uiterlijk van je maan</div><div class="rb-skins">${Object.entries(SKINS).map(([id, k]) => `<button class="rb-skin ${skinId() === id ? 'on' : ''}" data-a="skin:${id}"><i style="background:linear-gradient(${k.sky.join(',')})"></i>${I(k.ic, 28)}<b>${k.n}</b><small>${k.d}</small></button>`).join('')}</div>`;
    h += `<div class="rb-h">Verhuizen naar een nieuwe maan</div>` + card('', I('moon', 44), `<b>Sterrenlicht: ${S.sd} ${T('✨')} <span class="rb-c">totaal ${S.sdt}</span></b><small>${T('Begin opnieuw met een frisse maan. Je houdt ontdekte werelden, prestaties en Sterrenlicht (ongeveer +10% op alles per ✨). Onderzoek en gebouwen gaan weg.')}</small>
      <small>${g >= 1 ? `Nu verhuizen geeft <b>${g} ${T('✨')}</b>.` : `Nog ${fmt(Math.max(0, PREST_K - S.st.run))} ${rico('erts', 14)} verdienen voor je eerste ${T('✨')} (deze ronde: ${fmt(S.st.run)}).`}</small>`, btn('prest', 'Verhuis', g >= 1));
    h += '<div class="rb-h">Sterrenlicht-winkel</div>';
    for (const p of PU) {
      const l = lv(S, p.id), c = p.cost(l), mx = l >= p.max;
      h += card('', ico(p), `<b>${p.n}</b> <span class="rb-c">${l}/${p.max}</span><small>${p.d}</small>`, mx ? '<span class="rb-c">max</span>' : btn('pu:' + p.id, c + ' ' + T('✨'), S.sd >= c));
    }
    h += `<div class="rb-h">Instellingen</div><div class="rb-seg">${btn('snd', S.set.snd ? '🔊 Geluid aan' : '🔇 Geluid uit', true)}${btn('mus', S.set.mus ? '🎵 Muziek aan' : '🎵 Muziek uit', true)}${btn('gear', '⚙ Meer instellingen', true)}</div>`;
    h += `<div class="rb-note">${T(`Offline verdien je tot 8 uur lang ${Math.round(offlineEff(S) * 100)}% van je opbrengst. Je voortgang wordt automatisch lokaal en in de cloud bewaard. Tips: tik op vallende sterren ⭐ in de lucht voor bonus!`)}</div>`;
    h += `<div class="rb-seg">${btn('tut', '❓ Uitleg opnieuw', true)}${btn('intro', '🎬 Intro bekijken', true)}</div>`;
    return h;
  }
  const TIERS_ON = { mijn: 1, lab: 1, handel: 1 };
  const VIEWS = { bouw: vBouw, team: vTeam, lab: vLab, mis: vMis, han: vHan, doel: vDoel, meer: vMeer };

  function renderBody(force) {
    if (!force && pDown) return;
    const h = VIEWS[tab]();
    if (h === lastHtml) return;
    const sc = body.scrollTop;
    body.innerHTML = h; lastHtml = h; body.scrollTop = sc;
  }

  function updTop() {
    const set = (k, a, b) => { const el = topEls[k]; const t = `${a}<small>${b}</small>`; if (el.dataset.v !== t) { el.dataset.v = t; el.innerHTML = t; } };
    set('erts', `${rico('erts', 24)} ${fmt(S.r.erts)}`, `+${fmt(R.erts)}/s`);
    set('kennis', `${rico('kennis', 24)} ${fmt(S.r.kennis)}`, `+${fmt(R.kennis)}/s`);
    set('cred', `${rico('cred', 24)} ${fmt(S.r.cred)}`, `+${fmt(R.cred)}/s`);
    const chip = (k, html, bad) => { const el = topEls[k]; if (el.dataset.v !== html) { el.dataset.v = html; el.innerHTML = html; } el.classList.toggle('bad', bad); };
    chip('pw', `${I('bolt', 18)} ${fmt(R.pSup)}/${fmt(R.pDem)}`, R.pe < 1);
    chip('o2', `${I('cloud', 18)} ${Math.round(R.o2E * 100)}%`, R.o2E < 1);
    chip('fo', `${I('tomato', 18)} ${Math.round(R.foE * 100)}%`, R.foE < 1);
    chip('pp', `${I('astronaut', 18)} ${R.pop}/${R.house}${S.bots ? ' ' + I('robot', 18) + S.bots : ''}`, false);
    const q = QUESTS[S.q];
    const qt = q ? `${I('target', 26)} <span><b>Doel:</b> ${T(q.t)}${q.p ? ` (${fmt(Math.min(q.p(S)[0], q.p(S)[1]))}/${fmt(q.p(S)[1])})` : ''}</span>` : `${I('trophy', 26)} <span>Alle doelen gehaald!</span>`;
    if (questEl.dataset.v !== qt) { questEl.dataset.v = qt; questEl.innerHTML = qt; }
    const ready = S.mis.filter((m) => m.e <= Date.now()).length;
    root.querySelectorAll('.rb-nav button').forEach((b) => {
      const t = b.dataset.t;
      b.classList.toggle('on', t === tab);
      b.classList.toggle('hl', !!q && S.q < 12 && q.tab === t && t !== tab);
      let bd = b.querySelector('.rb-badge');
      const n = t === 'mis' ? ready : t === 'doel' && dailyInfo(S).can ? '!' : 0;
      if (n) { if (!bd) { bd = document.createElement('i'); bd.className = 'rb-badge'; b.appendChild(bd); } bd.textContent = n; bd.style.fontStyle = 'normal'; } else if (bd) bd.remove();
    });
  }

  /* ---------- modals ---------- */
  const modal = (html) => { modalEl.innerHTML = `<div class="rb-mbox">${T(html)}</div>`; modalEl.hidden = false; };
  const closeModal = () => { modalEl.hidden = true; modalEl.innerHTML = ''; };
  function tutorialModal() {
    modal(`<h3>🌙 Welkom op je maan!</h3><p>Je landingsmodule staat er. Nu bouw je een kolonie:</p>
      <p>👆 <b>Tik op de maan</b> om erts te delven.<br>⛏️ Bouw <b>mijnen</b> en ☀️ <b>zonnepanelen</b> (energie!).<br>👩‍🚀 Zet bewoners aan het <b>werk</b>.<br>🔬 <b>Onderzoek</b> nieuwe dingen.<br>🚀 Stuur <b>raketten</b> naar 11 werelden.</p>
      <p class="rb-note">Volg de doelen met 🎯 onder het plaatje. Rustig aan, er kan niets misgaan.</p>
      <div class="rb-btns"><button class="pri" data-a="close">Aan de slag!</button></div>`);
  }
  function awayModal() {
    const a = away; away = null;
    modal(`<h3>🌙 Welkom terug!</h3><p>Je was ${fmtT(a.secs)} weg. Intussen verdiende je kolonie:</p>
      <p>🪨 <b>${fmt(a.e)}</b> erts<br>🔬 <b>${fmt(a.k)}</b> kennis<br>🪙 <b>${fmt(a.c)}</b> credits${a.p > 0 ? `<br>👩‍🚀 <b>${a.p}</b> nieuwe bewoners` : ''}${a.ready ? `<br>🚀 <b>${a.ready}</b> raket${a.ready > 1 ? 'ten zijn' : ' is'} terug` : ''}</p><div class="rb-btns"><button class="pri" data-a="close">Mooi!</button></div>`);
  }

  /* ---------- acties ---------- */
  const after = (sound) => {
    R = rates(S, Date.now());
    if (sound) audio[sound]();
    progress(); updTop(); renderBody(true); markDirty();
  };
  const MILES = [
    ['q5', () => S.q >= 5, 'chest-open', 'Training klaar!', 'Je kolonie draait'],
    ['q12', () => S.q >= 12, 'victory', 'Eerste raket geland!', 'Jouw kolonie groeit'],
    ['w4', () => S.wd.length >= 4, 'coins-rain', '4 werelden ontdekt', 'Wat een ontdekker!'],
    ['w8', () => S.wd.length >= 8, 'new-record', '8 werelden ontdekt', 'De sterrenkaart groeit'],
    ['w15', () => S.wd.length >= WORLDS.length, 'victory', 'Alle werelden ontdekt', 'Sterrenkapitein!'],
    ['qall', () => S.q >= QUESTS.length, 'victory', 'Alle doelen gehaald', 'Sterrenkapitein!'],
  ];
  function playScene(id, title, sub, key, then) {
    if (key) { if (S.set.seen.includes(key)) return false; S.set.seen.push(key); markDirty(); }
    const sn = G.scenes && G.scenes.Scenes;
    if (!sn || sceneRun) { if (then) then(); return false; }
    try {
      const run = sn.play(root, id, { title, sub });
      sceneRun = run;
      run.done.then(() => { if (sceneRun === run) sceneRun = null; if (alive && then) then(); }, () => { sceneRun = null; if (alive && then) then(); });
      return true;
    } catch (e) { sceneRun = null; if (then) then(); return false; }
  }
  function milestones() {
    if (sceneRun || !modalEl.hidden) return;
    for (const m of MILES) if (!S.set.seen.includes(m[0]) && m[1]()) { playScene(m[2], m[3], m[4], m[0]); break; }
  }
  function progress() {
    const done = checkProgress(S, Date.now());
    for (const d of done) {
      if (d.kind === 'q') { toast(`🎯 Doel gehaald! ${[d.got.erts ? '+' + fmt(d.got.erts) + ' 🪨' : '', d.got.kennis ? '+' + d.got.kennis + ' 🔬' : '', d.got.cred ? '+' + d.got.cred + ' 🪙' : ''].filter(Boolean).join(' ')}`); audio.quest(); }
      else { toast(`🏆 Prestatie: ${d.a.e} ${d.a.n}`); audio.quest(); }
    }
    if (done.length) R = rates(S, Date.now());
    milestones();
  }
  const deny = (msg) => { audio.deny(); toast(msg); };
  const A = {
    tab(x) { tab = x; lastHtml = ''; body.scrollTop = 0; updTop(); renderBody(true); },
    bulk(x) { bulk = x; renderBody(true); },
    buy(id, k) { if (buy(S, id, +k)) { after('build'); } else deny('Nog niet genoeg grondstoffen'); },
    up(id) { if (upgrade(S, id)) after('research'); else deny('Nog niet genoeg (ook zeldzaam spul nodig)'); },
    asg(t, d) { if (assign(S, t, +d)) after('tap'); else if (+d > 0) deny('Geen vrije bewoners. Bouw een 🏠 woonmodule!'); },
    auto() { autoAssign(S); after('build'); },
    robot() { if (buyRobot(S)) after('build'); else deny('Geen plek of te weinig grondstoffen'); },
    res(id) { if (doResearch(S, id)) { after('research'); toast(`${RES[id].e} ${RES[id].n} klaar!`); } else deny('Nog niet genoeg kennis'); },
    go(i) {
      if (launch(S, +i)) { rocketAnim = 1; after('launch'); toast(`🚀 Raket vertrokken naar ${WORLDS[+i].n}`); }
      else deny(nb(S, 'hangaar') <= S.mis.length ? 'Geen vrije raketplek' : 'Te weinig erts voor de brandstof');
    },
    col(i) {
      const r = collect(S, +i);
      if (!r) return;
      after('land');
      toast(`${r.w.e} ${r.w.n}: +${r.qty} ${r.w.re} +${fmt(r.erts)} 🪨${r.first ? ` · nieuwe wereld! +${r.kennis} 🔬` : ''}`);
      if (r.hz) { audio.bad(); toast('😅 ' + r.w.hz + ', lading half.'); }
    },
    sell(id, k) { const g = sell(S, id, k === 'all' ? 'all' : +k); if (g > 0) { toast(`+${fmt(g)} 🪙`); coinBurst(Math.min(14, 6 + Math.round(Math.log10(g + 1) * 2))); after('coin'); } },
    ore(f) { const got = buyOre(S, Math.floor(S.r.cred * +f)); if (got > 0) { toast(`+${fmt(got)} 🪨`); after('coin'); } },
    daily() {
      const r = claimDaily(S, Date.now(), R);
      if (!r) return;
      after('quest');
      modal(`<h3>🎁 Dagelijkse beloning, dag ${r.streak}</h3><p>🪨 <b>${fmt(r.erts)}</b><br>🔬 <b>${fmt(r.kennis)}</b><br>🪙 <b>${fmt(r.cred)}</b>${r.star ? '<br>✨ <b>1</b> Sterrenlicht!' : ''}</p><div class="rb-btns"><button class="pri" data-a="close">Dankjewel!</button></div>`);
    },
    prest() {
      const g = prestigeGain(S);
      modal(`<h3>🌙 Verhuizen naar een nieuwe maan?</h3><p>Je krijgt <b>${g} ✨ Sterrenlicht</b> (ongeveer +${g * 10}% op alles voor altijd).</p><p class="rb-note">Je begint met een nieuwe kale maan: gebouwen, onderzoek, bewoners en grondstoffen gaan weg. Je houdt Sterrenlicht, ontdekte werelden, prestaties en doelen.</p><div class="rb-btns"><button data-a="close">Nog niet</button><button class="pri" data-a="prest2">Ja, verhuis!</button></div>`);
    },
    prest2() {
      const g = prestige(S);
      closeModal(); tab = 'bouw'; lastHtml = '';
      if (g) { toast(`✨ Nieuwe maan! +${g} Sterrenlicht`); after('quest'); playScene('levelup', 'Nieuwe maan!', `+${g} Sterrenlicht`, null); }
    },
    pu(id) { if (buyPU(S, id)) after('research'); else deny('Te weinig Sterrenlicht'); },
    snd() { S.set.snd = S.set.snd ? 0 : 1; if (S.set.snd) { audio.unlock(); audio.coin(); } after(); },
    mus() { S.set.mus = S.set.mus ? 0 : 1; if (S.set.mus) { audio.unlock(); } audio.music(!!S.set.mus); after(); },
    tut() { tutorialModal(); },
    intro() { closeModal(); playScene('intro-ruimte', 'Ruimtebasis', 'Bouw je kolonie op de maan', null); },
    gear() { try { if (G.panel && G.panel.openSettingsPanel) G.panel.openSettingsPanel({ title: 'Instellingen Ruimtebasis', toast }); else toast('Instellingen zijn niet beschikbaar'); } catch (e) { toast('Instellingen zijn niet beschikbaar'); } },
    skin(id) { if (!SKINS[id]) return; S.set.skin = id; try { root.style.setProperty('--rb-acc', SKINS[id].accent); } catch (e) { /* stil */ } after(); toast('Uiterlijk: ' + SKINS[id].n); },
    close() { closeModal(); },
  };
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    const [a, x, y] = b.dataset.a.split(':');
    if (A[a]) A[a](x, y);
  });
  root.addEventListener('pointerdown', () => { pDown = true; });
  function onUp() { pDown = false; }
  window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);

  /* ---------- spelklok ---------- */
  let nextEv = Date.now() + 240000 + Math.random() * 240000, nextStar = Date.now() + 25000 + Math.random() * 20000;
  let lastRender = 0;
  function tick() {
    const now = Date.now();
    let dt = (now - S.t) / 1000;
    if (dt < 0) { S.t = now; return; }
    if (dt < 0.05) return;
    if (dt > 20) {
      const b = { e: S.r.erts, k: S.r.kennis, c: S.r.cred, p: Math.floor(S.pop) };
      advance(S, dt, dt > 60 ? offlineEff(S) : 1, now);
      if (dt > 60) away = { secs: Math.min(dt, OFFLINE_MAX), e: S.r.erts - b.e, k: S.r.kennis - b.k, c: S.r.cred - b.c, p: Math.floor(S.pop) - b.p, ready: S.mis.filter((m) => m.e <= now).length };
    } else step(S, dt, 1, now);
    S.t = now;
    if (S.ev && S.ev.until <= now) S.ev = null;
    if (!S.ev && now > nextEv) {
      nextEv = now + 240000 + Math.random() * 300000;
      if (S.st.run > 300 && !nb(S, 'schild')) { S.ev = { k: 'vlam', until: now + 25000 }; toast('☀️ Zonnevlam! Even minder energie (25 s)'); audio.bad(); }
    }
    if (now > nextStar) { nextStar = now + 50000 + Math.random() * 70000; spawnStar(); }
    S.mis.forEach((m) => { if (m.e <= now && !m.n) { m.n = 1; toast(`🚀 Raket terug van ${WORLDS[m.w].n}!`); audio.land(); } });
    R = rates(S, now);
    progress();
    updTop();
    if (now - lastRender > 900) { lastRender = now; renderBody(false); }
    if (away && modalEl.hidden) awayModal();
    markDirty();
  }
  setI(() => { if (alive && view.isConnected) tick(); }, 500);

  /* ---------- scene (canvas) ---------- */
  const c2 = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const rnd = (() => { let s = 12345; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  const stars = Array.from({ length: 170 }, (_, i) => ({ x: rnd(), y: rnd() * 0.8, r: 0.5 + rnd() * 1.3, ph: rnd() * 6, sp: 0.5 + rnd() * 2, l: i % 3 }));
  const craters = Array.from({ length: 7 }, () => ({ x: rnd(), y: rnd(), w: 8 + rnd() * 16 }));
  const DRIFT = [3, 7, 14];
  let parts = [], floats = [], ripples = [], shoot = null, fx = null, incT = 0;
  try { if (G.fx) fx = new G.fx.Particles(); } catch (e) { fx = null; }
  const walkers = Array.from({ length: 8 }, (_, i) => ({ x: 0.1 + rnd() * 0.8, v: (rnd() < 0.5 ? -1 : 1) * (0.015 + rnd() * 0.02), ph: rnd() * 6, bot: i >= 4 }));
  function spawnStar() { shoot = { t: 0, dur: 7, x0: 1.05, y0: 0.05, x1: -0.1, y1: 0.55 }; }
  function resize() {
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    dpr = (G.set && G.set.GFX && G.set.GFX.dpr) || Math.min(2, window.devicePixelRatio || 1);
    if (w === W && h === H && cv.width === Math.round(w * dpr)) return;
    W = w; H = h; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  }
  const starPos = () => shoot ? { x: (shoot.x0 + (shoot.x1 - shoot.x0) * shoot.t / shoot.dur) * W, y: (shoot.y0 + (shoot.y1 - shoot.y0) * shoot.t / shoot.dur) * H } : null;
  function addFloat(x, y, txt, col = '#8be3c4', ic = null) { if (floats.length < 24) floats.push({ x, y, txt, col, t: 0, ic }); }
  function burst(x, y, n, cols, kind) {
    if (fx && kind) { fx.burst(x, y, { kind, n, color: cols && cols[0], power: 0.8 }); return; }
    n = Math.max(2, G.set ? G.set.GFX.particles(n) : n);
    for (let i = 0; i < n && parts.length < 120; i++) { const a = rnd() * TAU, v = 20 + rnd() * 50; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: 0.7 + rnd() * 0.5, t: 0, col: cols[i % cols.length] }); }
  }
  const rockUp = (x, y, name) => { if (floats.length < 24) floats.push({ x, y, txt: '', t: 0, ic: name, small: 1 }); };
  coinBurst = (n = 8) => { if (W && fx) fx.burst(W * 0.5, H - 40, { kind: 'coins', n, power: 0.9, angle: -Math.PI / 2, spread: 1.6 }); };
  let tapCombo = 0, lastTap = 0;
  cv.addEventListener('pointerdown', (e) => {
    audio.unlock();
    const rc = cv.getBoundingClientRect(), x = e.clientX - rc.left, y = e.clientY - rc.top;
    const sp = starPos();
    if (sp && Math.hypot(sp.x - x, sp.y - y) < 40) {
      shoot = null; S.st.star++;
      const g = Math.max(25, R.erts * 25); S.r.erts += g; S.st.all += g; S.st.run += g;
      addFloat(x, y, `+${fmt(g)}`, '#ffe08a', 'star'); burst(x, y, 24, ['#ffe08a', '#fff', '#ffb4e0'], 'stars'); audio.star(); toast('⭐ Vallende ster gevangen!');
      progress(); markDirty(); return;
    }
    const now = performance.now();
    tapCombo = now - lastTap < 600 ? Math.min(6, tapCombo + 1) : 0; lastTap = now;
    const g = R.tap;
    S.r.erts += g; S.st.all += g; S.st.run += g; S.st.tap++;
    addFloat(x, y, '+' + fmt(g), skin().accent, 'rock'); ripples.push({ x, y, t: 0 }); burst(x, y, 6, ['#d8dcff', skin().accent], 'sparkle');
    audio.tap(tapCombo); markDirty();
    if (S.st.tap <= 12 || S.st.tap % 10 === 0) { progress(); updTop(); }
  });

  function frame(ts) {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    if (!view.isConnected || document.hidden) return;
    resize();
    if (!W) return;
    const t = ts / 1000, dt = Math.min(0.1, (ts - (frame.last || ts)) / 1000); frame.last = ts;
    draw(t, dt);
  }
  const mod = (v, m) => ((v % m) + m) % m;
  const useIc = (name) => !!(G.art && G.art.has(name));
  function draw(t, dt) {
    const c = c2, K = skin(), q = gq(), red = gred();
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gy = H - 36, fxm = G.fx;
    // lucht
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, K.sky[0]); g.addColorStop(0.6, K.sky[1]); g.addColorStop(1, K.sky[2]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // nevels (ultra: bewegen mee)
    let ng = c.createRadialGradient(W * 0.25, H * 0.3, 0, W * 0.25, H * 0.3, W * 0.5); ng.addColorStop(0, `rgba(${K.neb[0]},.28)`); ng.addColorStop(1, `rgba(${K.neb[0]},0)`);
    c.fillStyle = ng; c.fillRect(0, 0, W, H);
    if (q > 0) {
      const sx = q > 1 && !red ? Math.sin(t * 0.05) * W * 0.05 : 0;
      ng = c.createRadialGradient(W * 0.8 + sx, H * 0.55, 0, W * 0.8 + sx, H * 0.55, W * 0.4); ng.addColorStop(0, `rgba(${K.neb[1]},.2)`); ng.addColorStop(1, `rgba(${K.neb[1]},0)`);
      c.fillStyle = ng; c.fillRect(0, 0, W, H);
    }
    // sterren in 3 lagen met parallax
    const ns = [70, 120, 170][q];
    c.fillStyle = '#fff';
    for (let i = 0; i < ns; i++) {
      const s = stars[i], x = red ? s.x * W : mod(s.x * W - t * DRIFT[s.l], W);
      c.globalAlpha = (0.3 + 0.7 * Math.abs(Math.sin(t * s.sp + s.ph))) * (0.5 + s.l * 0.25);
      const sz = s.r * (0.8 + s.l * 0.3); c.fillRect(x, s.y * H, sz, sz);
    }
    c.globalAlpha = 1;
    // planeet met ring en gloed
    const px = W * 0.82 + Math.sin(t * 0.05) * 6, py = H * 0.28, pr = Math.min(W, H) * 0.17;
    if (q > 0 && fxm) fxm.glow(c, px, py, pr * 2.3, K.pg, 0.35);
    const pg = c.createRadialGradient(px - pr * 0.4, py - pr * 0.4, pr * 0.1, px, py, pr); pg.addColorStop(0, K.planet[0]); pg.addColorStop(1, K.planet[1]);
    c.save(); c.translate(px, py); c.rotate(-0.35);
    if (K.ring) { c.strokeStyle = `rgba(${K.ring},.55)`; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, pr * 1.7, pr * 0.42, 0, Math.PI, TAU); c.stroke(); }
    circ(c, 0, 0, pr, pg);
    c.fillStyle = 'rgba(0,0,20,.18)'; c.beginPath(); c.arc(0, 0, pr, -1.2, 1.9); c.arc(-pr * 0.35, -pr * 0.05, pr * 0.95, 1.9, -1.2, true); c.fill();
    if (K.ring) { c.strokeStyle = `rgba(${K.ring},.55)`; c.beginPath(); c.ellipse(0, 0, pr * 1.7, pr * 0.42, 0, 0, Math.PI); c.stroke(); }
    c.restore();
    // satelliet / ufo die voorbij drijft (hoog en ultra)
    if (q > 0 && !red && useIc('satellite')) G.art.drawIcon(c, K === SKINS.neon && useIc('ufo') ? 'ufo' : 'satellite', mod(t * 9 + W * 0.3, W + 80) - 40, H * 0.16 + Math.sin(t * 0.4) * 6, 28 * Math.min(1.4, uiS()), { alpha: 0.85, rot: Math.sin(t * 0.5) * 0.2 });
    // vallende ster
    if (shoot) {
      shoot.t += dt; if (shoot.t > shoot.dur) shoot = null;
      else {
        const p = starPos(), a = 0.8 + 0.2 * Math.sin(t * 8);
        const tg = c.createLinearGradient(p.x, p.y, p.x + 70, p.y - 35); tg.addColorStop(0, 'rgba(255,224,138,' + a + ')'); tg.addColorStop(1, 'rgba(255,224,138,0)');
        c.strokeStyle = tg; c.lineWidth = 3.5; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + 70, p.y - 35); c.stroke();
        if (q > 0 && fxm) fxm.glow(c, p.x, p.y, 26, '#ffe08a', 0.6);
        if (useIc('star')) G.art.drawIcon(c, 'star', p.x, p.y, 30 + Math.sin(t * 10) * 2, { rot: t * 2 });
        else circ(c, p.x, p.y, 6 + Math.sin(t * 10), '#fff6c8');
      }
    }
    // verre bergrug (parallax)
    if (q > 0) {
      c.fillStyle = K.ridge; c.globalAlpha = 0.7; c.beginPath(); c.moveTo(0, gy);
      for (let x = 0; x <= W; x += 12) c.lineTo(x, gy - 16 - (Math.sin(x * 0.011 + 2) * 0.5 + 0.5) * 22 - Math.sin(x * 0.04) * 3);
      c.lineTo(W, gy); c.closePath(); c.fill(); c.globalAlpha = 1;
    }
    // raketten onderweg
    const now0 = Date.now();
    S.mis.forEach((m, i) => {
      const p = Math.min(1, (now0 - m.s) / (m.e - m.s));
      const w = WORLDS[m.w];
      if (useIc(IC[w.id])) G.art.drawIcon(c, IC[w.id], W - 22 - i * 30, 22, 26, { alpha: 0.95 });
      else { c.font = '16px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(w.e, W - 18 - i * 24, 14); }
      if (p >= 1) { if (useIc('chest')) G.art.drawIcon(c, 'chest', W * 0.5 + Math.sin(t * 2 + i) * 4, H * 0.3 + i * 26, 30); return; }
      const pos = (pp) => ({ x: W * (0.12 + 0.76 * pp), y: H * 0.62 - Math.sin(pp * Math.PI) * H * 0.45 - pp * H * 0.1 });
      const P = pos(p), P2 = pos(Math.min(1, p + 0.01));
      for (let k = 1; k < 7; k++) { const pk = pos(Math.max(0, p - k * 0.012)); c.fillStyle = 'rgba(255,200,120,' + (0.5 - k * 0.07) + ')'; c.beginPath(); c.arc(pk.x, pk.y, 3.5 - k * 0.35, 0, TAU); c.fill(); }
      if (q > 0 && fx && !red && rnd() < dt * 20) fx.burst(P.x, P.y, { kind: 'smoke', n: 1, color: '#c8c0ff', power: 0.2, size: 0.4 });
      const ang = Math.atan2(P2.y - P.y, P2.x - P.x) + Math.PI / 2;
      if (q > 0 && fxm) fxm.glow(c, P.x, P.y, 30, '#ffb060', 0.35);
      if (useIc('rocket')) G.art.drawIcon(c, 'rocket', P.x, P.y, 40 * Math.min(1.4, uiS()), { rot: ang });
      else { c.save(); c.translate(P.x, P.y); c.rotate(ang - Math.PI / 4); c.font = '22px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🚀', 0, 0); c.restore(); }
    });
    // grond
    c.fillStyle = K.gb; c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W; x += 10) c.lineTo(x, gy - 6 - Math.sin(x * 0.02 + 1) * 5 - Math.sin(x * 0.05) * 2);
    c.lineTo(W, H); c.closePath(); c.fill();
    const gg = c.createLinearGradient(0, gy - 10, 0, H); gg.addColorStop(0, K.g1); gg.addColorStop(1, K.g2);
    c.fillStyle = gg; c.fillRect(0, gy, W, H - gy);
    c.fillStyle = `rgba(${K.cr},.4)`; for (const k of craters) { c.beginPath(); c.ellipse(k.x * W, gy + 4 + k.y * (H - gy - 6), k.w, k.w * 0.28, 0, 0, TAU); c.fill(); }
    c.strokeStyle = `rgba(${K.edge},.6)`; c.lineWidth = 1.5; c.beginPath(); for (let x = 0; x <= W; x += 10) { const y = gy - 6 - Math.sin(x * 0.02 + 1) * 5 - Math.sin(x * 0.05) * 2 + 6; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    // gebouwen: maximaal ~14 sprites, nu als 3D-icoon
    const types = ORDER.filter((id) => nb(S, id) > 0);
    let cap = 3; const total = (cp) => types.reduce((a, id) => a + Math.min(nb(S, id), cp), 1);
    while (cap > 1 && total(cap) > 12) cap--;
    const items = [];
    for (let k = 0; k < cap; k++) for (const id of types) if (nb(S, id) > k) items.push(id);
    const n = items.length + 1, sp = (W - 24) / n, sc = Math.max(0.6, Math.min(1.3, sp / 40)) * Math.min(1.25, uiS());
    const place = [W / 2];
    for (let i = 0; i < items.length; i++) { const side = i % 2 ? 1 : -1, step = Math.floor(i / 2) + 1; place.push(W / 2 + side * step * sp * (1 + (items.length < 4 ? 0.4 : 0))); }
    const sprites = [{ id: 'landing', x: place[0], s: sc * 1.15 }].concat(items.map((id, i) => ({ id, x: place[i + 1], s: sc })));
    for (const sp2 of sprites) {
      const x = sp2.x, y = gy + 2 - Math.sin(x * 0.02 + 1) * 3, nm = sp2.id === 'landing' ? 'rocket' : IC[sp2.id];
      if (G.fx) G.fx.softShadow(c, x, y + 2, 22 * sp2.s, 6 * sp2.s, 0.35);
      if (useIc(nm)) {
        const sz = 52 * sp2.s, bob = red ? 0 : Math.sin(t * 1.5 + x) * 1.2;
        if (q > 0 && fxm && sp2.id !== 'landing') fxm.glow(c, x, y - sz * 0.5, sz * 0.8, K.accent, 0.1 + 0.05 * Math.sin(t * 2 + x));
        G.art.drawIcon(c, nm, x, y - sz * 0.46 + bob, sz);
      } else {
        c.save(); c.translate(x, y); c.scale(sp2.s, sp2.s); SPR[sp2.id] && SPR[sp2.id](c, t); c.restore();
      }
      if (!red && sp2.id === 'mijn' && rnd() < dt * 1.2 && parts.length < 100) parts.push({ x: x + 15 * sp2.s, y: y - 8, vx: (rnd() - 0.5) * 14, vy: -20 - rnd() * 14, life: 1, t: 0, col: '#ffd27a' });
    }
    // inkomsten: opstijgende icoontjes en muntjes boven de gebouwen
    incT += dt;
    if (!red && incT > (q === 0 ? 1.6 : q === 1 ? 0.9 : 0.55) && sprites.length > 1) {
      incT = 0;
      const sp3 = sprites[1 + Math.floor(rnd() * (sprites.length - 1))], k = sp3.id;
      const nm = k === 'lab' || k === 'sat' || k === 'obs' ? 'kennis' : k === 'handel' || k === 'bank' || k === 'toer' || k === 'alien' ? 'cred' : (k === 'mijn' || k === 'steen' || k === 'drone' || k === 'smelt' || k === 'kristal') ? 'erts' : '';
      if (nm) rockUp(sp3.x, gy - 40 * sp3.s, IC[nm]);
    }
    // bewoners en robots
    const nPop = Math.min(4, R.pop), nBot = Math.min(4, S.bots);
    walkers.forEach((wk, i) => {
      if (wk.bot ? i - 4 >= nBot : i >= nPop) return;
      wk.x += wk.v * dt; if (wk.x < 0.04 || wk.x > 0.96) { wk.v = -wk.v; wk.x = Math.max(0.04, Math.min(0.96, wk.x)); }
      const x = wk.x * W, y = gy + 14 + (i % 3) * 3 + Math.abs(Math.sin(t * 6 + wk.ph)) * -2;
      const nm = wk.bot ? 'robot' : 'astronaut';
      if (useIc(nm)) { G.art.drawIcon(c, nm, x, y - 12, 26 * Math.min(1.3, uiS()), { rot: Math.sin(t * 6 + wk.ph) * 0.08 }); return; }
      c.save(); c.translate(x, y); c.scale(wk.v < 0 ? -1 : 1, 1);
      if (wk.bot) { c.fillStyle = '#b6c1e8'; rr(c, -4, -9, 8, 7, 2); c.fill(); circ(c, 1.5, -6, 1.3, Math.sin(t * 4 + wk.ph) > 0 ? '#8be3c4' : '#355'); c.fillStyle = '#4a4a80'; c.fillRect(-4, -2, 8, 2); }
      else { c.fillStyle = '#fff'; rr(c, -3, -9, 6, 8, 2); c.fill(); circ(c, 0, -11, 3.4, '#f3f5ff'); c.fillStyle = '#4a6bd0'; rr(c, -1, -12.3, 3.4, 2.4, 1); c.fill(); c.fillStyle = '#c8d0f0'; c.fillRect(-5, -8, 2, 5); }
      c.restore();
    });
    // deeltjes en ripples
    if (fx && !red) { fx.update(dt); fx.draw(c); }
    parts = parts.filter((p) => { p.t += dt; if (p.t > p.life) return false; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt; c.globalAlpha = 1 - p.t / p.life; c.fillStyle = p.col; c.fillRect(p.x, p.y, 2.5, 2.5); c.globalAlpha = 1; return true; });
    ripples = ripples.filter((r) => { r.t += dt; if (r.t > 0.5) return false; c.strokeStyle = skin().accent; c.globalAlpha = 1 - r.t * 2; c.lineWidth = 2; c.beginPath(); c.arc(r.x, r.y, 6 + r.t * 50, 0, TAU); c.stroke(); c.globalAlpha = 1; return true; });
    c.font = '800 ' + Math.round(15 * Math.min(1.4, uiS())) + 'px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    floats = floats.filter((f) => {
      f.t += dt; const life = f.small ? 1.6 : 1.1; if (f.t > life) return false;
      c.globalAlpha = 1 - f.t / life; const y = f.y - 10 - f.t * (f.small ? 26 : 36);
      if (f.small) { if (useIc(f.ic)) G.art.drawIcon(c, f.ic, f.x, y, 16); }
      else {
        const tw = f.txt.length * 8.5, ix = useIc(f.ic) ? 11 : 0;
        c.fillStyle = f.col; c.strokeStyle = 'rgba(0,0,30,.7)'; c.lineWidth = 3; c.strokeText(f.txt, f.x - ix, y); c.fillText(f.txt, f.x - ix, y);
        if (ix) G.art.drawIcon(c, f.ic, f.x + tw / 2 - 2, y - 5, 18);
      }
      c.globalAlpha = 1; return true;
    });
    // zonnevlam
    if (S.ev && S.ev.k === 'vlam' && S.ev.until > Date.now()) { c.fillStyle = 'rgba(255,170,90,' + (0.12 + 0.06 * Math.sin(t * 6)) + ')'; c.fillRect(0, 0, W, H); }
    if (q > 0 && fxm) fxm.vignette(c, W, H, 0.3);
    // tutorial: pijl naar de maan
    if (S.q === 0 && S.st.tap < 10) { c.font = '26px serif'; c.textBaseline = 'middle'; c.fillText('👆', W / 2 + 40, gy + 6 + Math.sin(t * 5) * 5); c.font = '700 14px system-ui'; c.fillStyle = skin().accent; c.fillText('Tik op de maan!', W / 2 - 30, gy + 30); }
  }

  /* ---------- start ---------- */
  if (!Array.isArray(S.set.seen)) S.set.seen = [];
  if (!isNew) { for (const m of MILES) if (m[1]()) { if (!S.set.seen.includes(m[0])) S.set.seen.push(m[0]); } if (!S.set.seen.includes('intro')) S.set.seen.push('intro'); }
  progress();
  R = rates(S, Date.now());
  updTop(); renderBody(true);
  if (S.set.mus) { /* muziek start pas na de eerste tik (browser-regel) */ const startMus = () => { audio.unlock(); audio.music(true); root.removeEventListener('pointerdown', startMus); }; root.addEventListener('pointerdown', startMus); }
  try { root.style.setProperty('--rb-acc', skin().accent); } catch (e) { /* stil */ }
  if (G.set) { try { offSet = G.set.Settings.onChange(() => { lastHtml = ''; Object.values(topEls).forEach((el) => { el.dataset.v = ''; }); questEl.dataset.v = ''; updTop(); renderBody(true); }); } catch (e) { offSet = null; } }
  if (isNew) { S.set.seen.push('intro'); playScene('intro-ruimte', 'Ruimtebasis', 'Bouw je kolonie op de maan', null, tutorialModal); } else if (away) awayModal();
  raf = requestAnimationFrame(frame);
  markDirty();
  saveNow();
}

/* =====================================================================
   RONDE 4: tellers voor de extra laag (seizoenen, opdrachten, prestaties; zie big-r4-ruimtebasis.js)
   ===================================================================== */
const R4_MODS = ['batt', 'kweek', 'zuiver', 'graaf', 'museum', 'uni', 'bos', 'casino', 'thorium', 'warpbaken'];
export function r4Metrics(s) {
  const nbs = (id) => s.b[id] || 0;
  return {
    ore: s.st.all, cred: s.st.cred, taps: s.st.tap, missions: s.st.mis, launches: s.st.ln, built: s.st.bld, sold: s.st.sold, pop: Math.floor(s.pop), bots: s.bots,
    research: s.res.length, worlds: s.wd.length, moves: s.np, achs: s.ach.length, quest: s.q, streak: (s.dl && s.dl.k) || 0, stars: s.st.star,
    modules: Object.values(s.b).reduce((a, b) => a + b, 0), r4Mods: R4_MODS.filter((id) => nbs(id) > 0).length, mines: nbs('mijn'), labs: nbs('lab'), power: nbs('solar') + nbs('reactor') + nbs('batt') + nbs('thorium'),
  };
}
function r4Attach(ctx, host, getS) {
  import('./big-r4-ruimtebasis.js?v=1').then((m) => m.attach(ctx, {
    host, metrics: () => r4Metrics(getS()), rate: () => { const s = getS(); if (!s) return 0; const R = rates(s); return Math.max(0, R.erts + R.cred * 10 + R.kennis * 3) / 3; },
    add: (v) => { const x = getS(); if (x && v > 0) { x.r.erts += v; x.st.all += v; x.st.run += v; } },
    ng: { label: 'Verhuizen naar een nieuwe maan', desc: 'Begin op een nieuwe maan en verdien Sterrenlicht (blijvende voordelen).', count: () => getS().np, can: () => prestigeGain(getS()) >= 1, need: 'Verdien meer erts om te kunnen verhuizen (tab Meer).' },
  })).catch(() => { /* extra laag is optioneel */ });
}
