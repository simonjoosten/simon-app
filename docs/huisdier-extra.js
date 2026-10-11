// Huisdier 2.0 - extra onderdelen: Steun, Uitlaten, Camera. Zelfstandige ES-module, geen imports.
// Contract: EXTRAS[i].create(host, api) -> { destroy() }. Alles lokaal; geen netwerk.

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function shuffle(arr, rng) {
  const a = arr.slice(), r = rng || Math.random;
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
const p2 = (n) => (n < 10 ? '0' : '') + n;
const dateStr = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
const today = () => dateStr(new Date());
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return dateStr(d); };
function hashStr(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtTime = (s) => { s = Math.max(0, Math.round(s)); return p2(Math.floor(s / 60)) + ':' + p2(s % 60); };

// ------------------------------------------------------------------ gedeelde bouwstenen
const CSS = `
@keyframes hx-heart{0%{opacity:0;transform:translate(0,0) scale(.6)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx,0px),-70px) scale(1.2)}}
@keyframes hx-pop{0%{transform:scale(1)}40%{transform:scale(1.14) rotate(-4deg)}70%{transform:scale(.97) rotate(3deg)}100%{transform:scale(1)}}
@keyframes hx-hop{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-9px) rotate(3deg)}}
@keyframes hx-strip{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes hx-wob{0%,100%{transform:rotate(0)}25%{transform:rotate(-7deg)}75%{transform:rotate(7deg)}}
@keyframes hx-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@keyframes hx-conf{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--dx,0px),-120px) rotate(40deg)}}
.hx-btn{font:inherit;border-radius:12px;padding:8px 12px;margin:3px}
.hx-fade{animation:hx-fade .4s ease}
`;

function kit(host, api) {
  const rm = [], timers = new Set(), ints = new Set(), frames = new Set();
  let dead = false;
  try { if (host.style && !host.style.position) host.style.position = 'relative'; } catch (e) {}
  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;overflow-x:hidden;overflow-y:auto;box-sizing:border-box;padding:8px;color:var(--ink,#4a3b52);-webkit-tap-highlight-color:transparent;font-family:inherit';
  const st = document.createElement('style');
  st.textContent = CSS;
  root.appendChild(st);
  host.appendChild(root);
  const k = {
    root,
    get dead() { return dead; },
    W: Math.round(api.w || host.clientWidth || 360),
    H: Math.round(api.h || host.clientHeight || 520),
    h(parent, tag, css, text) {
      const e = document.createElement(tag);
      if (css) e.style.cssText = css;
      if (text != null) e.textContent = text;
      if (parent) parent.appendChild(e);
      return e;
    },
    btn(parent, label, fn, pri, css) {
      const b = k.h(parent, 'button', css || '', label);
      b.className = 'hx-btn' + (pri ? ' pri' : '');
      b.addEventListener('click', (e) => { if (!dead) fn(e); });
      return b;
    },
    on(target, type, fn, opts) {
      if (!target || !target.addEventListener) return;
      target.addEventListener(type, fn, opts);
      rm.push(() => { try { target.removeEventListener(type, fn, opts); } catch (e) {} });
    },
    timeout(fn, ms) {
      const id = setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms);
      timers.add(id); return id;
    },
    clearT(id) { clearTimeout(id); timers.delete(id); },
    every(fn, ms) {
      const id = setInterval(() => { if (!dead) fn(); }, ms);
      ints.add(id);
      return () => { clearInterval(id); ints.delete(id); };
    },
    frame(fn) {
      let id = 0, stopped = false;
      const tick = (ts) => { if (stopped || dead) return; id = requestAnimationFrame(tick); fn(ts); };
      id = requestAnimationFrame(tick);
      const stop = () => { stopped = true; try { cancelAnimationFrame(id); } catch (e) {} frames.delete(stop); };
      frames.add(stop);
      return stop;
    },
    sound(n, o) { try { if (api.sound) api.sound(n, o); } catch (e) {} },
    toast(m) { try { if (api.toast) api.toast(m); } catch (e) {} },
    award(o) { try { if (api.award) api.award(o); } catch (e) {} },
    petHtml(size, mood) {
      try { if (api.pet && api.pet.html) { const s = api.pet.html(size, mood); if (s) return s; } } catch (e) {}
      return '<div style="font-size:' + Math.round(size * 0.8) + 'px;line-height:' + size + 'px;text-align:center;width:' + size + 'px;height:' + size + 'px">\u{1F43E}</div>';
    },
    petName() { return (api.pet && api.pet.name) || 'Je huisdier'; },
    state() { try { return (api.getState && api.getState()) || {}; } catch (e) { return {}; } },
    destroy() {
      if (dead) return;
      dead = true;
      Array.from(frames).forEach((f) => f());
      timers.forEach((id) => clearTimeout(id)); timers.clear();
      ints.forEach((id) => clearInterval(id)); ints.clear();
      rm.forEach((f) => f()); rm.length = 0;
      try { if (root.parentNode) root.parentNode.removeChild(root); } catch (e) {}
    },
  };
  return k;
}

function lsGet(key) { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function lsSet(key, obj) { try { localStorage.setItem(key, JSON.stringify(obj)); return true; } catch (e) { return false; } }

function popPet(el) {
  if (!el) return;
  try { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = 'hx-pop .9s ease'; } catch (e) {}
}

// ================================================================== 1. STEUN
const MOODS = [
  { v: 5, e: '\u{1F604}', t: 'Super', pet: 'blijblij' },
  { v: 4, e: '\u{1F642}', t: 'Goed', pet: 'blij' },
  { v: 3, e: '\u{1F610}', t: 'Gewoon', pet: 'neutraal' },
  { v: 2, e: '\u{1F615}', t: 'Niet fijn', pet: 'neutraal' },
  { v: 1, e: '\u{1F622}', t: 'Verdrietig', pet: 'verdrietig' },
];
const MOOD_COL = { 5: '#ffb703', 4: '#8ecf8e', 3: '#b8c4d6', 2: '#f4a261', 1: '#9db4e8' };

const REACT = {
  5: ['Wat fijn om te horen! Ik word er helemaal blij van. \u{1F49B}', 'Heerlijk, zo’n goede dag! Ik dans een beetje met je mee.', 'Je lacht, dus ik lach ook. Fijn dat je je zo voelt.', 'Mooi zeg! Geniet er maar lekker van, ik ben erbij.', 'Dat voelt als zonnetje op mijn vacht. Bedankt dat je het vertelt.', 'Wat een mooie stemming. Zullen we daar samen even van genieten?'],
  4: ['Lekker, een fijne dag. Dat mag er zijn.', 'Fijn dat het goed gaat. Ik ben blij dat je er bent.', 'Een gewone goede dag is ook mooi. Dat telt echt mee.', 'Goed zo. Stapje voor stapje komen we de dag door.', 'Fijn! Vertel me later maar hoe de dag verder ging, als je wilt.', 'Je ziet er rustig uit. Ik vind het gezellig met jou.'],
  3: ['Een beetje “tja”? Dat mag. Niet elke dag hoeft bijzonder te zijn.', 'Soms is het gewoon een middelmatige dag. Ik blijf lekker bij je.', 'Dank je dat je het zegt. Je hoeft niets te forceren.', 'Misschien helpt een slokje water of even uit het raam kijken? Of niets doen, ook goed.', 'Neutraal is ook een gevoel. Het mag er zijn.', 'Zullen we samen even rustig zitten? Zonder plannen.'],
  2: ['Het is even niet zo fijn, hè? Dat snap ik. Ik ben er.', 'Dank je dat je het eerlijk zegt. Dat is best moedig.', 'Zware dagen gaan voorbij, ook als het nu nog niet zo voelt.', 'Je hoeft niet te doen alsof. Hier mag je gewoon zijn zoals je bent.', 'Zou een paar rustige ademhalingen helpen? Die staan klaar bij “Adem samen”, als je wilt.', 'Je bent niet de enige die dit soms voelt. Ik zit lekker bij je.'],
  1: ['Ach, dat is zwaar. Dank je dat je het me vertelt. Ik ben bij je.', 'Je mag verdrietig zijn. Dat hoort er soms bij, en het is niet gek.', 'Ik zit hier naast je, zo lang als je wilt.', 'Het hoeft nu niet over te gaan. Even stilletjes samen zijn is al goed.', 'Je bent belangrijk, ook als het niet zo voelt.', 'Wil je rustig ademhalen met mij? Dat kan bij “Adem samen”.'],
};
const REACT_TONE = {
  speels: { 5: ['Ik ga een rondje rennen van blijdschap! Kom je mee?', 'Hoera! Dit moeten we vieren met een springetje.'], 4: ['Mooi! Straks nog een spelletje samen?', 'Prima dag, vind ik. Ik kwispel er alvast op los.'], 3: ['Straks verzin ik iets geks, of niet. Ook best.', 'Grijze dag? Ik doe een klein dansje, voor het geval dat.'], 2: ['Ik doe even niet gek, ik ga gewoon naast je zitten.', 'Als je wilt kijk ik met je mee naar iets leuks. Zonder druk.'], 1: ['Ik laat de spelletjes even liggen. Jij en ik, gewoon samen.', 'Geen grapjes nu. Ik ben er voor je.'] },
  rustig: { 5: ['Fijn. Even rustig stilstaan bij hoe goed dit voelt.', 'Dit is een mooi moment. Neem er gerust de tijd voor.'], 4: ['Lekker kalm dus. Zo mag het van mij de hele dag blijven.', 'Rustig en goed. Meer hoeft niet.'], 3: ['Even afwachten hoe de dag zich ontwikkelt. Geen haast.', 'Soms is stil zijn precies genoeg.'], 2: ['Geen oplossingen nu. Alleen even rust en een warme plek.', 'Adem maar rustig. Je hoeft nu niets.'], 1: ['Neem de tijd. Alles mag nu langzaam.', 'Een diepe zucht mag. Ik wacht rustig met je.'] },
  lief: { 5: ['Ik ben zo blij dat het goed met je gaat. Knuffeltje?', 'Jouw vrolijkheid maakt mijn hartje warm.'], 4: ['Fijn dat je even bij me langskomt. Ik ben blij met je.', 'Ik zit hier lekker naast je, ook op een gewone dag.'], 3: ['Ik blijf dicht bij je, dan is het in elk geval gezellig.', 'Een zacht knuffeltje voor een gewone dag.'], 2: ['Kom maar dicht bij me. Ik hou je even vast.', 'Ik vind je lief, ook op dagen als deze.'], 1: ['Hier is een heel zachte knuffel. \u{1F49B}', 'Ik blijf bij je. Echt waar.'] },
};
function toneOf(p) {
  p = String(p || '').toLowerCase();
  if (/speel|ondeug|vrolijk|energiek|druk|grap|avontuur|nieuwsgierig/.test(p)) return 'speels';
  if (/rustig|lui|slim|wijs|stil|dromer|nuchter|kalm/.test(p)) return 'rustig';
  if (/lief|knuffel|zacht|trouw|gevoel|schuch|aanhank/.test(p)) return 'lief';
  return ['speels', 'rustig', 'lief'][hashStr(p) % 3];
}

const COMPLIMENTS = {
  algemeen: [
    'Fijn dat jij er bent.', 'Je hebt een mooie, eigen manier van naar dingen kijken.', 'Je bent leuker gezelschap dan je misschien denkt.', 'Jij maakt een dag een beetje zachter voor anderen.',
    'Het is fijn om bij jou in de buurt te zijn.', 'Je mag trots zijn op wie je aan het worden bent.', 'Jouw glimlach doet echt iets met mensen.', 'Je bent goed zoals je bent.',
    'Je hoeft niet perfect te zijn om de moeite waard te zijn.', 'Er is maar één jij, en dat is een goed ding.', 'Je laat zien dat je om anderen geeft, en dat valt op.', 'Je bent slimmer dan je soms van jezelf denkt.',
    'Jouw ideeën mogen er zijn.', 'Je maakt de wereld een stukje fijner.', 'Het is knap dat je blijft leren.', 'Je hebt veel om op te bouwen.',
    'Mensen kunnen op jou rekenen, en dat is bijzonder.', 'Je hebt een goed hart.', 'Je bent op jouw manier heel creatief.', 'Dank je dat je er bent, ook vandaag.',
    'Je hoort erbij, precies zoals je bent.', 'Jouw lach is aanstekelijk.', 'Je bent niet te veel en niet te weinig. Je bent precies genoeg.', 'Je kunt meer dan je denkt.',
    'Wat een fijn mens ben jij.',
  ],
  doorzetten: [
    'Je hebt al zoveel dingen gedaan die eerst moeilijk leken.', 'Elke kleine stap telt, ook als niemand het ziet.', 'Het is oké om langzaam te gaan, zolang je maar doorgaat op jouw tempo.', 'Je bent vaker opgestaan dan je gevallen bent.',
    'Dat je het nog een keer probeert, zegt veel over jou.', 'Oefenen is ook gewoon goed bezig zijn.', 'Fouten maken hoort bij leren. Je doet het goed.', 'Je hoeft het niet in één keer te kunnen.',
    'Je hebt al zo ver gekregen. Kijk maar eens terug.', 'Moeilijk betekent niet dat het niet lukt, alleen dat het even tijd kost.', 'Jouw geduld is een kracht.', 'Je mag trots zijn op elke poging.',
    'Dat je doorzet als het lastig wordt, is echt knap.', 'Het hoeft vandaag niet af. Een beetje vooruit is genoeg.', 'Je bent sterker dan je dag nu laat zien.', 'Stap voor stap kom je er wel.',
    'Je hebt dit eerder gered, dus dit ook.', 'Een nieuwe poging is nooit een mislukking.', 'Wat je nu leert, neem je mee voor altijd.', 'Je hoeft niet de beste te zijn. Doe maar gewoon je best.',
    'Dat je het probeert, is al het halve werk.',
  ],
  rust: [
    'Je mag best even pauze nemen.', 'Rusten is ook iets doen. Het is belangrijk.', 'Je hoeft niet altijd door te rennen.', 'Even niets hoeven is ook fijn.',
    'Zelfs de zon gaat elke dag even onder. Jij mag ook uitrusten.', 'Een rustig moment is een cadeautje voor jezelf.', 'Je hoeft niet alles vandaag te regelen.', 'Neem maar even de tijd. Er is geen haast.',
    'Een goede nachtrust is ook een soort doorzetten.', 'Je lichaam en hoofd mogen even bijkomen.', 'Het is oké om vandaag een rustige dag te hebben.', 'Pauze nemen betekent niet dat je opgeeft.',
    'Adem maar eens diep in en weer uit. Dat helpt vaak al.', 'Je mag nee zeggen als het je te veel wordt.', 'Soms is een warme douche of een kopje thee precies wat nodig is.', 'Je hoeft niet altijd sterk te zijn. Even zacht zijn mag ook.',
    'Even naar buiten kijken kan al helpen.', 'Rustig aan is ook een manier om vooruit te gaan.', 'Je verdient net zoveel rust als iedereen.', 'Laat de rest even liggen. Dat komt straks wel.',
  ],
  gevoel: [
    'Je mag voelen wat je voelt.', 'Gevoelens zijn niet fout. Ze vertellen je iets.', 'Het is oké om boos of verdrietig te zijn. Het gaat ook weer over.', 'Je hoeft je gevoel niet weg te stoppen.',
    'Als je blij bent, mag je blij zijn. Als je het zwaar hebt, ook dat mag.', 'Je gevoelens zijn belangrijk, ook de kleine.', 'Het is dapper om te zeggen hoe je je voelt.', 'Niet elke dag voelt hetzelfde, en dat is normaal.',
    'Je mag ook om hulp vragen. Dat maakt je niet zwak.', 'Een gevoel is als weer: het wisselt en gaat voorbij.', 'Je hoeft het niet uit te leggen om het te mogen voelen.', 'Het is goed om iemand te hebben om mee te praten.',
    'Je bent niet lastig als je iets nodig hebt.', 'Het is oké om niet oké te zijn.', 'Jij telt mee, ook op dagen dat je je klein voelt.', 'Dat je ergens gevoelig voor bent, laat zien dat je veel om dingen geeft.',
    'Je mag je zorgen delen. Zo wordt de last lichter.', 'Je mag vandaag ook gewoon wat zacht zijn voor jezelf.', 'Voelen is een deel van mens zijn, en jij doet dat goed.', 'Wat je ook voelt, ik ben blij dat je er bent.',
  ],
};
const COMPL_ALL = [].concat(COMPLIMENTS.algemeen, COMPLIMENTS.doorzetten, COMPLIMENTS.rust, COMPLIMENTS.gevoel);

const BREATH = {
  rustig: { name: 'Rustig (4 in, 6 uit)', ph: [['adem in…', 4, 0.55, 1], ['adem uit…', 6, 1, 0.55]] },
  vierkant: { name: 'Vierkant (4-4-4-4)', ph: [['adem in…', 4, 0.55, 1], ['even vasthouden…', 4, 1, 1], ['adem uit…', 4, 1, 0.55], ['even vasthouden…', 4, 0.55, 0.55]] },
};

function createSteun(host, api) {
  const k = kit(host, api);
  const KEY = 'huisdier:steun:' + (api.uid || 'x');
  const raw = lsGet(KEY) || {};
  const data = { c: Array.isArray(raw.c) ? raw.c.filter((x) => x && x.d && x.m >= 1 && x.m <= 5).slice(-14) : [], w: Array.isArray(raw.w) ? raw.w.filter((x) => x && x.d && Array.isArray(x.i)) : [], b: raw.b && raw.b.d ? raw.b : { d: '', n: 0 } };
  const cut = daysAgo(29);
  data.w = data.w.filter((x) => x.d >= cut).slice(-30);
  const save = () => { data.c = data.c.slice(-14); lsSet(KEY, data); };
  const tone = toneOf(k.state().personality);
  const name = k.petName();

  const top = k.h(k.root, 'div', 'text-align:center');
  const petBox = k.h(top, 'div', 'display:inline-block;width:84px;height:84px;margin-top:2px');
  const bubble = k.h(top, 'div', 'min-height:44px;font-size:14px;padding:4px 8px;line-height:1.35');
  let petMood = 'neutraal';
  const setPet = (mood) => { petMood = mood; petBox.innerHTML = k.petHtml(84, mood); popPet(petBox); };
  const say = (txt, mood) => { bubble.textContent = txt; if (mood) setPet(mood); else popPet(petBox); };
  setPet('neutraal');
  say('Hoi! Fijn dat je er bent. Wat wil je doen?');

  const tabsRow = k.h(k.root, 'div', 'display:flex;flex-wrap:wrap;justify-content:center;margin:4px 0');
  const content = k.h(k.root, 'div', 'padding:2px 2px 12px');
  let cleanup = null, curTab = '';
  const TABS = [['hoe', '\u{1F642} Hoe gaat het?'], ['compl', '\u{1F49B} Complimentje'], ['adem', '\u{1F32C}️ Adem samen'], ['succes', '\u{1F31F} Kleine successen']];
  const tabBtns = {};
  const privacy = k.h(k.root, 'small', 'display:block;text-align:center;opacity:.7;padding:4px');
  privacy.textContent = 'Wat je hier opschrijft blijft alleen op dit apparaat.';

  function show(tab) {
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    curTab = tab;
    content.innerHTML = '';
    Object.keys(tabBtns).forEach((t) => { tabBtns[t].className = 'hx-btn' + (t === tab ? ' pri' : ''); });
    ({ hoe: tabHoe, compl: tabCompl, adem: tabAdem, succes: tabSucces })[tab]();
  }
  TABS.forEach(([id, label]) => { tabBtns[id] = k.btn(tabsRow, label, () => show(id), false, 'font-size:13px;padding:6px 9px'); });

  const todayEntry = () => data.c.find((x) => x.d === today());
  function needsCare() {
    const l = data.c.slice(-4);
    const last = data.c[data.c.length - 1];
    if (last && last.d === today() && last.m === 1) return true;
    return l.length >= 4 && l.every((x) => x.m <= 2);
  }
  function graph() {
    const W = 280, Hh = 74, bw = 14, gap = 6.4;
    let s = '<svg viewBox="0 0 ' + W + ' ' + Hh + '" width="100%" style="max-width:320px" role="img" aria-label="Laatste 14 dagen">';
    for (let i = 0; i < 14; i++) {
      const d = daysAgo(13 - i), e = data.c.find((x) => x.d === d);
      const x = 4 + i * (bw + gap);
      if (e) { const hh = 8 + e.m * 10; s += '<rect x="' + x + '" y="' + (62 - hh) + '" width="' + bw + '" height="' + hh + '" rx="5" fill="' + MOOD_COL[e.m] + '"/>'; }
      else s += '<circle cx="' + (x + bw / 2) + '" cy="58" r="2.5" fill="currentColor" opacity=".25"/>';
      if (i === 13) s += '<text x="' + (x + bw / 2) + '" y="73" font-size="8" text-anchor="middle" fill="currentColor" opacity=".6">nu</text>';
    }
    return s + '</svg>';
  }

  function tabHoe() {
    k.h(content, 'div', 'text-align:center;font-weight:700;margin:4px 0', 'Hoe voel je je nu?');
    const row = k.h(content, 'div', 'display:flex;justify-content:center;gap:4px;flex-wrap:wrap');
    const resp = k.h(content, 'div', 'margin-top:8px');
    const te = todayEntry();
    MOODS.forEach((m) => {
      const b = k.h(row, 'button', 'font-size:30px;width:58px;height:62px;border-radius:16px;line-height:1.1;padding:2px;' + (te && te.m === m.v ? 'outline:3px solid var(--accent,#c58be0)' : ''));
      b.setAttribute('aria-label', m.t);
      b.innerHTML = '';
      k.h(b, 'div', '', m.e);
      k.h(b, 'div', 'font-size:9px', m.t);
      b.addEventListener('click', () => choose(m));
    });
    const care = k.h(content, 'div', 'margin-top:10px');
    const chart = k.h(content, 'div', 'text-align:center;margin-top:10px');
    const renderCare = () => {
      care.innerHTML = '';
      if (needsCare()) {
        const c = k.h(care, 'div', 'padding:10px 12px;border-radius:14px;background:rgba(255,214,102,.25);border:1px solid rgba(255,190,60,.5);text-align:center;font-size:14px;line-height:1.4');
        c.className = 'box hx-fade';
        c.textContent = 'Praat er eens over met iemand die je vertrouwt. Jij bent belangrijk. \u{1F49B}';
      }
    };
    const renderChart = () => {
      chart.innerHTML = '';
      const t = k.h(chart, 'small', 'display:block;opacity:.7', 'Laatste 14 dagen');
      const g = k.h(chart, 'div'); g.innerHTML = graph();
      void t;
    };
    function choose(m) {
      const prev = todayEntry();
      const firstToday = !prev || !prev.a;
      if (prev) { prev.m = m.v; } else data.c.push({ d: today(), m: m.v });
      const e = todayEntry();
      let lines = REACT[m.v].concat(REACT_TONE[tone][m.v]);
      lines = lines.map((x) => x.replace('{n}', name));
      resp.innerHTML = '';
      say(pick(lines), m.v === 5 ? 'liefde' : m.pet);
      if (firstToday) { e.a = 1; k.award({ happy: 3, bond: 2 }); k.sound('knuffel'); } else k.sound('tik');
      save();
      renderCare(); renderChart();
      if (firstToday) k.h(resp, 'small', 'display:block;text-align:center;opacity:.7', 'Bedankt dat je het deelt. \u{1F49B}');
      Array.from(row.children).forEach((b, i) => { b.style.outline = MOODS[i].v === m.v ? '3px solid var(--accent,#c58be0)' : 'none'; });
    }
    renderCare(); renderChart();
    if (te) say('Je hebt vandaag al laten weten hoe het gaat. Je mag het altijd aanpassen.');
  }

  function tabCompl() {
    let cat = 'alles', lastTxt = '';
    const chips = k.h(content, 'div', 'display:flex;flex-wrap:wrap;justify-content:center;margin-bottom:6px');
    const card = k.h(content, 'div', 'min-height:92px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:18px;line-height:1.4;padding:14px;border-radius:16px;background:rgba(255,214,230,.35);border:1px solid rgba(220,150,190,.4)');
    card.className = 'box';
    card.textContent = 'Tik op de knop voor iets liefs.';
    const cb = {};
    const setCat = (c) => { cat = c; Object.keys(cb).forEach((x) => { cb[x].className = 'hx-btn' + (x === c ? ' pri' : ''); }); };
    [['alles', 'Alles'], ['algemeen', 'Algemeen'], ['doorzetten', 'Doorzetten'], ['rust', 'Rust'], ['gevoel', 'Gevoel']].forEach(([id, l]) => { cb[id] = k.btn(chips, l, () => setCat(id), false, 'font-size:12px;padding:4px 9px'); });
    setCat('alles');
    const row = k.h(content, 'div', 'text-align:center;margin-top:8px');
    k.btn(row, '\u{1F49B} Geef me een complimentje', () => {
      const list = cat === 'alles' ? COMPL_ALL : COMPLIMENTS[cat];
      let t = pick(list), n = 0;
      while (t === lastTxt && n++ < 8) t = pick(list);
      lastTxt = t;
      card.textContent = t; card.className = 'box hx-fade'; popPet(card);
      say(pick(['Dat meen ik echt.', 'Voor jou. \u{1F49B}', 'Ik wilde dat even tegen je zeggen.', 'Je mag het ophalen wanneer je maar wilt.', 'Echt waar.']), 'liefde');
      k.sound('knuffel');
      k.timeout(() => { if (curTab === 'compl') setPet('blij'); }, 2600);
    }, true);
  }

  function tabAdem() {
    let variant = 'rustig', mins = 1, running = false, stopF = null;
    const setup = k.h(content, 'div', 'text-align:center');
    const stage = k.h(content, 'div', 'display:none;text-align:center');
    const vrow = k.h(setup, 'div', 'display:flex;flex-wrap:wrap;justify-content:center');
    const mrow = k.h(setup, 'div', 'display:flex;flex-wrap:wrap;justify-content:center');
    const vb = {}, mb = {};
    const upd = () => { Object.keys(vb).forEach((x) => { vb[x].className = 'hx-btn' + (x === variant ? ' pri' : ''); }); Object.keys(mb).forEach((x) => { mb[x].className = 'hx-btn' + (+x === mins ? ' pri' : ''); }); };
    Object.keys(BREATH).forEach((id) => { vb[id] = k.btn(vrow, BREATH[id].name, () => { variant = id; upd(); }); });
    [1, 2, 3].forEach((m) => { mb[m] = k.btn(mrow, m + (m === 1 ? ' minuut' : ' minuten'), () => { mins = m; upd(); }); });
    upd();
    k.h(setup, 'small', 'display:block;opacity:.75;margin:4px', 'Zit lekker, laat je schouders zakken en volg de cirkel.');
    k.btn(setup, '▶ Start', start, true);

    const D = Math.min(200, Math.max(120, Math.round(k.W * 0.5)));
    const holder = k.h(stage, 'div', 'height:' + (D + 24) + 'px;display:flex;align-items:center;justify-content:center');
    const circle = k.h(holder, 'div', 'width:' + D + 'px;height:' + D + 'px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,rgba(190,170,255,.55),rgba(150,210,255,.35));box-shadow:0 0 30px rgba(170,150,255,.45);transform:scale(.55)');
    const bp = k.h(circle, 'div', 'width:' + Math.round(D * 0.6) + 'px;height:' + Math.round(D * 0.6) + 'px');
    bp.innerHTML = k.petHtml(Math.round(D * 0.6), 'neutraal');
    const label = k.h(stage, 'div', 'font-size:20px;min-height:30px;font-weight:600');
    const timer = k.h(stage, 'small', 'display:block;opacity:.7;margin:2px');
    k.btn(stage, 'Stoppen', () => finish(false));

    function start() {
      setup.style.display = 'none'; stage.style.display = 'block';
      running = true;
      const total = mins * 60 * 1000, t0 = Date.now(), ph = BREATH[variant].ph;
      const cycle = ph.reduce((a, p) => a + p[1], 0) * 1000;
      say('Ik adem met je mee.', 'neutraal');
      k.sound('tik');
      let lastLabel = '';
      stopF = k.frame(() => {
        const el = Date.now() - t0;
        if (el >= total) { finish(true); return; }
        let t = el % cycle, i = 0;
        while (i < ph.length - 1 && t >= ph[i][1] * 1000) { t -= ph[i][1] * 1000; i++; }
        const p = ph[i], f = clamp(t / (p[1] * 1000), 0, 1), e = f * f * (3 - 2 * f);
        const s = p[2] + (p[3] - p[2]) * e;
        circle.style.transform = 'scale(' + s.toFixed(3) + ')';
        if (p[0] !== lastLabel) { lastLabel = p[0]; label.textContent = p[0]; }
        timer.textContent = 'nog ' + fmtTime((total - el) / 1000);
      });
    }
    function finish(done) {
      if (!running) return;
      running = false;
      if (stopF) { stopF(); stopF = null; }
      circle.style.transform = 'scale(.8)';
      if (done) {
        label.textContent = 'Goed gedaan. Voel je schouders zakken. \u{1F49B}';
        timer.textContent = 'Blijf nog even rustig zitten als je wilt.';
        say('Dat was fijn. Bedankt dat je met me meeademde.', 'liefde');
        k.sound('klaar');
        const t = today();
        if (data.b.d !== t) data.b = { d: t, n: 0 };
        if (data.b.n < 3) { data.b.n++; k.award({ happy: 3, bond: 2 }); }
        save();
      } else {
        label.textContent = 'Helemaal goed. Je mag altijd opnieuw beginnen.';
        say('Geen probleem. Even stoppen mag altijd.', 'blij');
      }
      Array.from(stage.children).forEach((c) => { if (c.tagName === 'BUTTON') c.style.display = 'none'; });
      k.btn(stage, 'Nog een keer', () => show('adem'), true);
    }
    cleanup = () => { running = false; if (stopF) { stopF(); stopF = null; } };
  }

  function tabSucces() {
    k.h(content, 'div', 'text-align:center;font-weight:700;margin:4px 0', 'Wat ging er vandaag goed?');
    k.h(content, 'small', 'display:block;text-align:center;opacity:.75;margin-bottom:6px', 'Ook iets kleins telt. Vul wat je wilt (1 tot 3 dingen).');
    const t = today();
    const cur = data.w.find((x) => x.d === t);
    const ins = [];
    for (let i = 0; i < 3; i++) {
      const inp = k.h(content, 'input', 'width:100%;box-sizing:border-box;margin:3px 0;padding:8px 10px;border-radius:10px;border:1px solid var(--line,#ccc);font:inherit');
      inp.type = 'text'; inp.maxLength = 120; inp.placeholder = ['Bijvoorbeeld: ik heb mijn bed opgemaakt', 'Nog iets kleins of groots', 'En nog iets, als je wilt'][i];
      inp.value = cur && cur.i[i] ? cur.i[i] : '';
      ins.push(inp);
    }
    const msg = k.h(content, 'small', 'display:block;text-align:center;min-height:18px;opacity:.8');
    const hist = k.h(content, 'div', 'margin-top:8px');
    const row = k.h(content, 'div', 'text-align:center');
    k.btn(row, '\u{1F4BE} Bewaar', () => {
      const items = ins.map((i) => String(i.value || '').trim().slice(0, 120)).filter(Boolean).slice(0, 3);
      data.w = data.w.filter((x) => x.d !== t);
      if (items.length) data.w.push({ d: t, i: items });
      data.w = data.w.filter((x) => x.d >= cut).slice(-30);
      save();
      msg.textContent = items.length ? 'Bewaard. Goed bezig! \u{1F31F}' : 'Leeg bewaard. Dat is ook prima.';
      if (items.length) { say(pick(['Wat knap dat je dat opschrijft.', 'Dat is echt iets om trots op te zijn.', 'Mooi! Kleine dingen tellen.']), 'blijblij'); k.sound('klaar'); }
      renderHist();
    }, true);
    k.btn(row, '\u{1F4D6} Kijk eens terug', () => {
      const old = data.w.filter((x) => x.d !== t && x.i.length);
      if (!old.length) { msg.textContent = 'Nog niets om op terug te kijken. Dat komt vanzelf.'; return; }
      const e = pick(old), it = pick(e.i);
      msg.textContent = '';
      say('Op ' + e.d.split('-').reverse().join('-') + ' schreef je: “' + it + '” Dat was goed.', 'liefde');
    });
    function renderHist() {
      hist.innerHTML = '';
      const list = data.w.slice().reverse().slice(0, 7);
      if (!list.length) return;
      k.h(hist, 'small', 'display:block;opacity:.7;margin-bottom:2px', 'Terugblik');
      list.forEach((e) => {
        const b = k.h(hist, 'div', 'font-size:13px;padding:5px 8px;margin:3px 0;border-radius:10px;background:rgba(255,230,160,.25)');
        k.h(b, 'b', '', e.d.split('-').reverse().join('-') + '  ');
        k.h(b, 'span', '', e.i.join(' • '));
      });
    }
    renderHist();
  }

  show('hoe');
  return { destroy() { if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; } k.destroy(); } };
}

// ================================================================== 2. UITLATEN
export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
// fix = { lat, lon, acc (m), t (ms) }. Geeft { accept, dist (m), reason }.
export function filterFix(prev, fix) {
  if (!fix || !isFinite(fix.lat) || !isFinite(fix.lon)) return { accept: false, dist: 0, reason: 'invalid' };
  if (!(fix.acc <= 35)) return { accept: false, dist: 0, reason: 'accuracy' };
  if (!prev) return { accept: true, dist: 0, reason: 'first' };
  const d = haversine(prev.lat, prev.lon, fix.lat, fix.lon);
  const dt = ((fix.t || 0) - (prev.t || 0)) / 1000;
  if (dt > 0 && d / dt > 40) return { accept: false, dist: d, reason: 'jump' };
  if (d < 3) return { accept: false, dist: d, reason: 'small' };
  return { accept: true, dist: d, reason: 'ok' };
}
// Eenvoudige stappenteller: piekdetectie op de (afgevlakte) versnellingsgrootte.
export function stepDetector(opts) {
  const o = Object.assign({ threshold: 1.3, minGap: 280, maxGap: 2000 }, opts || {});
  let avg = 0, init = false, s0 = 0, s1 = 0, s2 = 0, lastStep = -1e9, n = 0;
  return {
    get steps() { return n; },
    reset() { avg = 0; init = false; s0 = s1 = s2 = 0; lastStep = -1e9; n = 0; },
    push(ax, ay, az, tMs) {
      ax = +ax || 0; ay = +ay || 0; az = +az || 0;
      const mag = Math.sqrt(ax * ax + ay * ay + az * az);
      if (!init) { avg = mag; init = true; }
      avg += (mag - avg) * 0.05;
      const hp = mag - avg;
      s2 = s1; s1 = s0; s0 = s0 * 0.5 + hp * 0.5;
      // s1 is een piek als hoger dan buren en boven de drempel
      if (s1 > o.threshold && s1 >= s2 && s1 > s0 && tMs - lastStep > o.minGap) { lastStep = tMs; n++; return n; }
      return n;
    },
  };
}

export const CHALLENGES = [
  { id: 't5', label: 'Loop 5 minuten', kind: 'time', target: 300, run: false, coins: 3, xp: 10 },
  { id: 't15', label: 'Loop 15 minuten', kind: 'time', target: 900, run: false, coins: 8, xp: 26 },
  { id: 'd500', label: 'Wandel 500 meter', kind: 'dist', target: 500, run: false, coins: 3, xp: 10 },
  { id: 'd1k', label: 'Wandel 1 km', kind: 'dist', target: 1000, run: false, coins: 5, xp: 18 },
  { id: 'd3k', label: 'Wandel 3 km', kind: 'dist', target: 3000, run: false, coins: 11, xp: 38 },
  { id: 'r3', label: 'Ren 3 minuten', kind: 'time', target: 180, run: true, coins: 6, xp: 20 },
  { id: 'rk', label: 'Ren 1 km', kind: 'dist', target: 1000, run: true, coins: 9, xp: 30 },
  { id: 's1k', label: 'Doe 1000 stappen', kind: 'steps', target: 1000, run: false, coins: 4, xp: 14 },
  { id: 's3k', label: 'Doe 3000 stappen', kind: 'steps', target: 3000, run: false, coins: 12, xp: 40 },
];
function dailyThree(uid, date) {
  const r = mulberry(hashStr(date + '|' + uid));
  return shuffle(CHALLENGES, r).slice(0, 3);
}
function progOf(c, m) {
  const v = c.kind === 'time' ? (c.run ? m.rsec : m.sec) : c.kind === 'dist' ? (c.run ? m.rdist : m.dist) : m.steps;
  return clamp(v / c.target, 0, 1);
}
const CHEER_WALK = ['Lekker bezig, ik loop gezellig mee!', 'Wat een fijn ommetje.', 'Kijk eens om je heen, zoveel te zien.', 'Stap voor stap, jij doet het goed.', 'Ik ruik frisse lucht. Heerlijk!', 'Fijn dat we samen buiten zijn.', 'Zo rustig lopen is ook gezond voor mij.'];
const CHEER_RUN = ['Wat ga jij hard! Ik hou bij!', 'Hup hup, lekker tempo!', 'Ik ren zo graag met jou mee.', 'Even een rustig tempo houden, dan lukt het langer.', 'Je doet het super!', 'Mijn pootjes vliegen!'];

function createWandelen(host, api) {
  const k = kit(host, api);
  const uid = api.uid || 'x';
  const raw = (() => { try { return api.loadExtra && api.loadExtra('walk'); } catch (e) { return null; } })() || {};
  const num = (v) => (isFinite(+v) ? +v : 0);
  const data = { km: num(raw.km), min: num(raw.min), n: num(raw.n), st: num(raw.st), last: String(raw.last || ''), bd: num(raw.bd), bt: num(raw.bt), m: num(raw.m), s: num(raw.s), days: raw.days && typeof raw.days === 'object' ? raw.days : {} };
  function persist() {
    const keys = Object.keys(data.days).sort().slice(-7);
    const days = {};
    keys.forEach((d) => { days[d] = (data.days[d] || []).slice(0, 3); });
    data.days = days;
    data.km = Math.round(data.m / 100) / 10; data.min = Math.round(data.s / 60);
    try { if (api.saveExtra) api.saveExtra('walk', { km: data.km, min: data.min, n: data.n, st: data.st, last: data.last, bd: Math.round(data.bd), bt: Math.round(data.bt), m: Math.round(data.m), s: Math.round(data.s), days }); } catch (e) {}
  }
  const T = today();
  const daily = dailyThree(uid, T);
  const doneToday = new Set(Array.isArray(data.days[T]) ? data.days[T] : []);
  let mode = 'walk';
  const view = k.h(k.root, 'div');
  let running = false;
  let R = null; // run-state

  const stats = () => 'Totaal ' + data.km.toFixed(1).replace('.', ',') + ' km · ' + data.min + ' min · ' + data.n + ' wandelingen · reeks ' + data.st + (data.st === 1 ? ' dag' : ' dagen');
  const bar = (parent, f, col) => {
    const o = k.h(parent, 'div', 'height:9px;border-radius:6px;background:rgba(0,0,0,.08);overflow:hidden;margin-top:3px');
    const i = k.h(o, 'div', 'height:100%;border-radius:6px;width:' + Math.round(f * 100) + '%;background:' + (col || 'var(--accent,#9bd29b)') + ';transition:width .5s');
    return i;
  };

  function showStart() {
    view.innerHTML = '';
    R = null;
    const head = k.h(view, 'div', 'text-align:center');
    const pb = k.h(head, 'div', 'display:inline-block;width:80px;height:80px'); pb.innerHTML = k.petHtml(80, 'blij');
    k.h(head, 'div', 'font-weight:700;font-size:16px', 'Zullen we een stukje lopen?');
    k.h(head, 'small', 'display:block;opacity:.75;margin:2px 0 6px', 'Kijk goed om je heen, let op het verkeer.');
    k.h(view, 'div', 'font-weight:700;font-size:13px;margin:6px 0 2px', 'Dagopdrachten (altijd ook vrije modus)');
    daily.forEach((c) => {
      const done = doneToday.has(c.id);
      const card = k.h(view, 'div', 'padding:7px 10px;margin:4px 0;border-radius:12px;background:rgba(160,210,160,.18);border:1px solid rgba(120,180,120,.35)');
      card.addEventListener('click', () => { mode = c.run ? 'run' : 'walk'; syncMode(); });
      k.h(card, 'div', 'font-size:14px', (done ? '✅ ' : (c.run ? '\u{1F3C3} ' : '\u{1F6B6} ')) + c.label + (done ? ' (klaar)' : ''));
      bar(card, done ? 1 : 0);
    });
    const mrow = k.h(view, 'div', 'text-align:center;margin-top:6px');
    const bw = k.btn(mrow, '\u{1F6B6} Wandelen', () => { mode = 'walk'; syncMode(); });
    const br = k.btn(mrow, '\u{1F3C3} Rennen', () => { mode = 'run'; syncMode(); });
    function syncMode() { bw.className = 'hx-btn' + (mode === 'walk' ? ' pri' : ''); br.className = 'hx-btn' + (mode === 'run' ? ' pri' : ''); }
    syncMode();
    const go = k.h(view, 'div', 'text-align:center;margin-top:4px');
    k.btn(go, '▶ Start', start, true, 'font-size:16px;padding:10px 26px');
    k.h(view, 'small', 'display:block;text-align:center;opacity:.8;margin-top:8px', stats());
    if (data.bd || data.bt) k.h(view, 'small', 'display:block;text-align:center;opacity:.8', 'Beste: ' + (data.bd / 1000).toFixed(2).replace('.', ',') + ' km · ' + Math.round(data.bt / 60) + ' min');
    k.h(view, 'small', 'display:block;text-align:center;opacity:.65;margin-top:6px;line-height:1.35', 'Locaties worden niet bewaard, alleen totalen. Het telt door terwijl het scherm uit is, zoveel je telefoon toelaat.');
  }

  function start() {
    if (running) return;
    running = true;
    const nowT = Date.now();
    R = { t0: nowT, lastU: nowT, sec: 0, rsec: 0, dist: 0, rdist: 0, steps: 0, lastEff: 0, gpsDist: 0, fixes: 0, prev: null, bad: 0, gps: 'wacht', motion: 'wacht', det: stepDetector(), lastMotion: 0, watchId: null, wl: null, nextCheer: 40, completed: 0, stopTick: null, motionFn: null, visFn: null, refs: {} };
    // iOS-toestemming moet synchroon in de tik worden aangevraagd
    let permP = null;
    try {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') permP = DeviceMotionEvent.requestPermission();
    } catch (e) { R.motion = 'geweigerd'; }
    // GPS
    try {
      if (typeof navigator !== 'undefined' && navigator.geolocation && navigator.geolocation.watchPosition) {
        R.watchId = navigator.geolocation.watchPosition(onPos, onGpsErr, { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
      } else R.gps = 'geen';
    } catch (e) { R.gps = 'geen'; }
    // beweging
    const attachMotion = () => {
      if (!R || typeof window === 'undefined' || !window.addEventListener) { if (R) R.motion = 'geen'; return; }
      R.motionFn = (e) => {
        const a = e.accelerationIncludingGravity || e.acceleration;
        if (!a || a.x == null) return;
        R.motion = 'ok'; R.lastMotion = Date.now();
        R.det.push(a.x, a.y, a.z, Date.now());
      };
      window.addEventListener('devicemotion', R.motionFn);
    };
    if (permP && permP.then) {
      permP.then((r) => { if (R && !k.dead) { if (r === 'granted') attachMotion(); else R.motion = 'geweigerd'; } }, () => { if (R) R.motion = 'geweigerd'; });
    } else if (R.motion !== 'geweigerd') attachMotion();
    // scherm wakker
    lockScreen();
    R.visFn = () => { if (typeof document !== 'undefined' && document.visibilityState === 'visible' && running) lockScreen(); };
    if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('visibilitychange', R.visFn);
    buildRun();
    R.stopTick = k.every(update, 1000);
    k.sound('tik');
    update();
  }
  function onPos(p) {
    if (!R || k.dead) return;
    const c = p.coords || {};
    const fix = { lat: c.latitude, lon: c.longitude, acc: c.accuracy, t: p.timestamp || Date.now() };
    R.gps = 'ok';
    const r = filterFix(R.prev, fix);
    if (r.accept) { R.gpsDist += r.dist; R.fixes++; R.prev = { lat: fix.lat, lon: fix.lon, acc: fix.acc, t: fix.t }; R.bad = 0; }
    else if (r.reason === 'jump') { if (++R.bad >= 5) { R.prev = { lat: fix.lat, lon: fix.lon, acc: fix.acc, t: fix.t }; R.bad = 0; } }
    update();
  }
  function onGpsErr(err) {
    if (!R) return;
    R.gps = err && err.code === 1 ? 'geweigerd' : (R.fixes ? 'ok' : 'zwak');
  }
  async function lockScreen() {
    try {
      if (R && !R.wl && navigator.wakeLock && navigator.wakeLock.request) {
        const wl = await navigator.wakeLock.request('screen');
        if (!R || k.dead || !running) { try { wl.release(); } catch (e) {} return; }
        R.wl = wl;
        if (wl.addEventListener) wl.addEventListener('release', () => { if (R && R.wl === wl) R.wl = null; });
      }
    } catch (e) {}
  }

  function buildRun() {
    view.innerHTML = '';
    const rf = R.refs;
    const scene = k.h(view, 'div', 'position:relative;height:150px;border-radius:16px;overflow:hidden;background:linear-gradient(#cfeaff,#eaf8e6)');
    const strip = k.h(scene, 'div', 'position:absolute;left:0;top:12px;width:200%;white-space:nowrap;font-size:30px;opacity:.9;animation:hx-strip 14s linear infinite');
    const unit = '\u{1F333} \u{1F337} \u{1F33F} \u{1F3E1} \u{1F338} \u{1F332} \u{1F33C} \u{1F333} \u{1F33F} \u{1F337} ';
    strip.textContent = unit.repeat(3) + unit.repeat(3);
    k.h(scene, 'div', 'position:absolute;left:0;right:0;bottom:0;height:34px;background:linear-gradient(#9ad39a,#7fc07f)');
    const pw = k.h(scene, 'div', 'position:absolute;left:50%;bottom:14px;margin-left:-44px;width:88px;height:88px;animation:hx-hop .8s ease-in-out infinite');
    pw.innerHTML = k.petHtml(88, 'blij');
    rf.strip = strip; rf.pw = pw; rf.scene = scene;
    rf.bubble = k.h(scene, 'div', 'position:absolute;left:8px;right:8px;top:8px;text-align:center;font-size:13px;background:rgba(255,255,255,.8);border-radius:10px;padding:3px 6px;display:none');
    const g = k.h(view, 'div', 'display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:8px 0;text-align:center');
    const cell = (l) => { const c = k.h(g, 'div', 'padding:5px 2px;border-radius:10px;background:rgba(0,0,0,.05)'); const v = k.h(c, 'div', 'font-weight:700;font-size:15px', '-'); k.h(c, 'small', 'opacity:.7', l); return v; };
    rf.time = cell('tijd'); rf.dist = cell('afstand'); rf.pace = cell('min/km'); rf.steps = cell('stappen');
    rf.bars = daily.map((c) => {
      const row = k.h(view, 'div', 'margin:5px 0');
      const t = k.h(row, 'div', 'font-size:13px', (c.run ? '\u{1F3C3} ' : '\u{1F6B6} ') + c.label);
      const b = bar(row, doneToday.has(c.id) ? 1 : 0);
      return { c, t, b, row };
    });
    rf.status = k.h(view, 'small', 'display:block;opacity:.75;margin:4px 0;line-height:1.35');
    const mrow = k.h(view, 'div', 'text-align:center');
    const bw = k.btn(mrow, '\u{1F6B6} Wandelen', () => { mode = 'walk'; sync(); });
    const br = k.btn(mrow, '\u{1F3C3} Rennen', () => { mode = 'run'; sync(); });
    function sync() { bw.className = 'hx-btn' + (mode === 'walk' ? ' pri' : ''); br.className = 'hx-btn' + (mode === 'run' ? ' pri' : ''); const run = mode === 'run'; strip.style.animationDuration = run ? '7s' : '14s'; pw.style.animationDuration = run ? '.45s' : '.8s'; }
    sync(); rf.sync = sync;
    k.btn(mrow, '⏹ Stop', () => finish(false), true);
    k.h(view, 'small', 'display:block;text-align:center;opacity:.8;margin-top:4px', 'Kijk goed om je heen, let op het verkeer.');
  }

  function update() {
    if (!R || !running || k.dead) return;
    const now = Date.now();
    const dt = clamp((now - R.lastU) / 1000, 0, 900);
    R.lastU = now;
    R.sec = (now - R.t0) / 1000;
    if (mode === 'run') R.rsec += dt;
    const motionSteps = R.det.steps;
    const gpsGood = R.gps === 'ok' && R.fixes >= 2;
    if (R.motion === 'wacht' && now - R.t0 > 4000) R.motion = 'geen';
    let eff = gpsGood ? R.gpsDist : motionSteps * 0.75;
    if (eff < R.lastEff) eff = R.lastEff;
    const delta = eff - R.lastEff;
    R.lastEff = eff; R.dist = eff;
    if (mode === 'run') R.rdist += delta;
    R.steps = motionSteps > 0 ? motionSteps : Math.round(eff / 0.75);

    const rf = R.refs;
    rf.time.textContent = fmtTime(R.sec);
    rf.dist.textContent = R.dist >= 1000 ? (R.dist / 1000).toFixed(2).replace('.', ',') + ' km' : Math.round(R.dist) + ' m';
    rf.steps.textContent = String(R.steps);
    if (R.dist > 50 && R.sec > 10) { const pace = R.sec / 60 / (R.dist / 1000); rf.pace.textContent = pace < 60 ? Math.floor(pace) + ':' + p2(Math.round((pace % 1) * 60) % 60) : '-'; } else rf.pace.textContent = '-';
    rf.bars.forEach((x) => {
      const done = doneToday.has(x.c.id);
      const f = done ? 1 : progOf(x.c, R);
      x.b.style.width = Math.round(f * 100) + '%';
      x.t.textContent = (done ? '✅ ' : (x.c.run ? '\u{1F3C3} ' : '\u{1F6B6} ')) + x.c.label + (done ? ' (klaar)' : ' – ' + Math.round(f * 100) + '%');
      if (!done && f >= 1) complete(x.c);
    });
    let msg = [];
    if (R.gps === 'geweigerd') msg.push('Locatie staat uit, geen probleem: ik tel je stappen of de tijd.');
    else if (R.gps === 'geen') msg.push('Geen GPS beschikbaar: ik gebruik stappen of de tijd.');
    else if (R.gps === 'zwak') msg.push('GPS zoekt nog een beetje…');
    else if (R.gps === 'ok') msg.push(gpsGood ? 'GPS werkt.' : 'GPS zoekt een goede plek…');
    if (R.motion === 'geweigerd') msg.push('Stappenteller niet toegestaan: stappen worden geschat.');
    else if (R.motion === 'geen') msg.push('Geen stappenteller: stappen worden geschat.');
    rf.status.textContent = msg.join(' ') + (R.gps !== 'ok' && R.motion !== 'ok' ? ' Alleen de tijd telt nu.' : '');
    if (R.sec >= R.nextCheer) {
      R.nextCheer = R.sec + (mode === 'run' ? rnd(30, 45) : rnd(45, 75));
      bubbleSay(pick(mode === 'run' ? CHEER_RUN : CHEER_WALK));
    }
  }
  function bubbleSay(t, ms) {
    if (!R) return;
    const b = R.refs.bubble; b.textContent = t; b.style.display = 'block';
    if (R.bt) k.clearT(R.bt);
    R.bt = k.timeout(() => { if (R && R.refs.bubble) R.refs.bubble.style.display = 'none'; }, ms || 4500);
  }
  function complete(c) {
    doneToday.add(c.id); R.completed++;
    data.days[T] = Array.from(doneToday);
    persist();
    k.award({ xp: c.xp, coins: c.coins, happy: 3, bond: 2, energy: c.run ? -6 : -4 });
    k.toast('\u{1F389} Klaar: ' + c.label + '! +' + c.coins + ' munten');
    k.sound('prestatie');
    bubbleSay('\u{1F389} ' + c.label + ' is gelukt! Wat zijn we goed bezig!', 6000);
    const sc = R.refs.scene;
    for (let i = 0; i < 10; i++) {
      const e = k.h(sc, 'div', 'position:absolute;bottom:40px;left:' + Math.round(rnd(10, 90)) + '%;font-size:20px;--dx:' + Math.round(rnd(-40, 40)) + 'px;animation:hx-conf 1.6s ease-out forwards;pointer-events:none', pick(['\u{1F389}', '⭐', '\u{1F49B}', '✨']));
      k.timeout(() => { try { if (e.parentNode) e.parentNode.removeChild(e); } catch (x) {} }, 1800);
    }
  }

  function releaseAll() {
    if (!R) return;
    try { if (R.watchId != null && navigator.geolocation && navigator.geolocation.clearWatch) navigator.geolocation.clearWatch(R.watchId); } catch (e) {}
    R.watchId = null;
    try { if (R.motionFn && typeof window !== 'undefined') window.removeEventListener('devicemotion', R.motionFn); } catch (e) {}
    R.motionFn = null;
    try { if (R.visFn && typeof document !== 'undefined') document.removeEventListener('visibilitychange', R.visFn); } catch (e) {}
    R.visFn = null;
    if (R.stopTick) { R.stopTick(); R.stopTick = null; }
    try { if (R.wl && R.wl.release) R.wl.release(); } catch (e) {}
    R.wl = null;
  }

  function finish(quiet) {
    if (!running || !R) return;
    update();
    running = false;
    releaseAll();
    const r = R;
    const sec = r.sec, dist = r.dist;
    let saved = false;
    if (sec >= 30) {
      data.s += sec; data.m += dist; data.n++;
      if (data.last !== T) { data.st = data.last === daysAgo(1) ? data.st + 1 : 1; data.last = T; }
      if (dist > data.bd) data.bd = dist;
      if (sec > data.bt) data.bt = sec;
      persist(); saved = true;
      if (!r.completed && sec >= 120) k.award({ xp: Math.min(20, Math.round(sec / 60) * 2), happy: 2, bond: 1, energy: -3 });
    } else if (r.completed) persist();
    if (quiet) return;
    view.innerHTML = '';
    R = null;
    const head = k.h(view, 'div', 'text-align:center');
    const pb = k.h(head, 'div', 'display:inline-block;width:90px;height:90px'); pb.innerHTML = k.petHtml(90, 'liefde');
    k.h(head, 'div', 'font-weight:700;font-size:17px', saved ? 'Goed gedaan, wat een fijne wandeling!' : 'Even een stukje, dat is ook prima.');
    k.h(head, 'div', 'margin:6px 0;font-size:14px', fmtTime(sec) + ' · ' + (dist >= 1000 ? (dist / 1000).toFixed(2).replace('.', ',') + ' km' : Math.round(dist) + ' m') + ' · ' + r.steps + ' stappen');
    k.h(head, 'small', 'display:block;opacity:.8', stats());
    if (saved) k.sound('klaar');
    k.btn(head, 'Terug', showStart, true);
  }

  showStart();
  return { destroy() { try { if (running) finish(true); } catch (e) {} releaseAll(); k.destroy(); } };
}

// ================================================================== 3. CAMERA
function drawGarden(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#bfe4ff'); sky.addColorStop(0.65, '#fff1f7'); sky.addColorStop(1, '#f6f9e6');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(w * 0.82, h * 0.14, Math.min(w, h) * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c4e6c6';
  ctx.beginPath(); ctx.moveTo(0, h * 0.62); ctx.quadraticCurveTo(w * 0.25, h * 0.38, w * 0.5, h * 0.6); ctx.quadraticCurveTo(w * 0.75, h * 0.42, w, h * 0.58); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
  ctx.fillStyle = '#a8da9f';
  ctx.beginPath(); ctx.moveTo(0, h * 0.72); ctx.quadraticCurveTo(w * 0.35, h * 0.56, w * 0.7, h * 0.72); ctx.quadraticCurveTo(w * 0.88, h * 0.64, w, h * 0.7); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
  ctx.fillStyle = '#8fcf8a'; ctx.fillRect(0, h * 0.82, w, h * 0.18);
  ctx.strokeStyle = '#6fb86c'; ctx.lineWidth = Math.max(1, w / 220);
  for (let i = 0; i < 46; i++) {
    const x = (i * 97.3 % 100) / 100 * w, y = h * (0.83 + ((i * 53.7) % 100) / 100 * 0.16), l = h * 0.02;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - l * 0.4, y - l); ctx.moveTo(x, y); ctx.lineTo(x + l * 0.4, y - l * 0.9); ctx.stroke();
  }
  const cols = ['#ffffff', '#ffc2d9', '#ffe08a'];
  for (let i = 0; i < 9; i++) {
    const x = ((i * 61.7 + 13) % 100) / 100 * w, y = h * (0.85 + ((i * 37.1) % 100) / 100 * 0.12);
    ctx.fillStyle = cols[i % 3]; ctx.beginPath(); ctx.arc(x, y, Math.max(2, w / 90), 0, Math.PI * 2); ctx.fill();
  }
}

const SPOTS = [
  { n: 'struik', svg: '<circle cx="26" cy="52" r="20" fill="#5cb85c"/><circle cx="50" cy="48" r="23" fill="#6cc76c"/><circle cx="38" cy="36" r="18" fill="#4fa84f"/><circle cx="30" cy="44" r="3" fill="#ff8fb1"/><circle cx="52" cy="40" r="3" fill="#ff8fb1"/>' },
  { n: 'doos', svg: '<rect x="10" y="26" width="60" height="46" rx="4" fill="#d9a066"/><rect x="10" y="26" width="60" height="12" fill="#c58a50"/><rect x="34" y="26" width="12" height="46" fill="#f0d9a8" opacity=".8"/>' },
  { n: 'kussen', svg: '<rect x="6" y="32" width="68" height="40" rx="16" fill="#ff9fc2"/><circle cx="40" cy="52" r="4" fill="#d96a96"/><path d="M14 40 Q40 52 66 40" stroke="#e57aa4" stroke-width="2" fill="none"/>' },
  { n: 'vaas', svg: '<path d="M28 20 H52 L50 30 Q66 44 60 62 Q56 74 40 74 Q24 74 20 62 Q14 44 30 30 Z" fill="#7fb7e6"/><path d="M40 20 Q36 4 28 6 M40 20 Q44 2 54 8" stroke="#4fa84f" stroke-width="3" fill="none"/><circle cx="28" cy="6" r="4" fill="#ffb3c8"/><circle cx="54" cy="8" r="4" fill="#ffe08a"/>' },
  { n: 'boom', svg: '<rect x="34" y="40" width="12" height="36" rx="3" fill="#a0723f"/><circle cx="40" cy="28" r="24" fill="#5cb85c"/><circle cx="26" cy="38" r="14" fill="#6cc76c"/><circle cx="54" cy="36" r="14" fill="#4fa84f"/>' },
  { n: 'tent', svg: '<path d="M40 8 L74 74 H6 Z" fill="#ffb86b"/><path d="M40 8 L40 74" stroke="#e59a4a" stroke-width="2"/><path d="M40 40 L56 74 H24 Z" fill="#8a6a4a"/>' },
];
const spotSvg = (s, size) => '<svg viewBox="0 0 80 80" width="' + size + '" height="' + size + '" aria-hidden="true">' + s.svg + '</svg>';

function createCamera(host, api) {
  const k = kit(host, api);
  const SW = Math.max(200, Math.min(k.W - 16, 520));
  const SH = Math.max(210, Math.min(k.H - 190, Math.round(SW * 1.3)));
  const PS = Math.round(Math.min(120, SW * 0.34));
  let mode = 'samen', facing = 'environment', stream = null, camOn = false, camBusy = false;
  let px = SW / 2, py = SH - 16, tx = px, floorY = SH - 14, wander = 2, t = 0, flip = 1, moving = false;
  let dragging = false, following = false, grab = { x: 0, y: 0 }, down = null, rub = { dir: 0, n: 0, t: 0, x: 0 }, petMood = '', moodUntil = 0;
  const vs = { round: 0, hide: -1, found: false, tries: 0, total: 0, spots: [], over: false, rounds: 5 };

  const tabs = k.h(k.root, 'div', 'display:flex;justify-content:center;flex-wrap:wrap');
  const stage = k.h(k.root, 'div', 'position:relative;margin:4px auto;width:' + SW + 'px;height:' + SH + 'px;border-radius:16px;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;background:#cfeaff');
  const bg = document.createElement('canvas');
  bg.width = SW; bg.height = SH;
  bg.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%';
  stage.appendChild(bg);
  try { const c = bg.getContext('2d'); if (c) drawGarden(c, SW, SH); } catch (e) {}
  const video = document.createElement('video');
  video.setAttribute('playsinline', ''); video.setAttribute('muted', ''); video.setAttribute('autoplay', '');
  video.muted = true; video.playsInline = true; video.autoplay = true;
  video.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;display:none';
  stage.appendChild(video);
  const spotLayer = k.h(stage, 'div', 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none');
  const petEl = k.h(stage, 'div', 'position:absolute;left:0;top:0;width:' + PS + 'px;height:' + PS + 'px;will-change:transform;pointer-events:none');
  const petIn = k.h(petEl, 'div', 'width:100%;height:100%;transform-origin:50% 100%');
  const fx = k.h(stage, 'div', 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:hidden');
  const hint = k.h(stage, 'div', 'position:absolute;left:6px;right:6px;top:6px;text-align:center;font-size:13px;font-weight:700;color:#4a3b52;text-shadow:0 0 4px #fff,0 0 6px #fff;pointer-events:none');

  const setMood = (m, ms) => {
    if (m === petMood) { if (ms) moodUntil = Date.now() + ms; return; }
    petMood = m; petIn.innerHTML = k.petHtml(PS, m); moodUntil = ms ? Date.now() + ms : 0;
  };
  const baseMood = () => 'blij';
  setMood(baseMood());

  const controls = k.h(k.root, 'div', 'text-align:center');
  const camRow = k.h(k.root, 'div', 'text-align:center');
  const msg = k.h(k.root, 'small', 'display:block;text-align:center;min-height:16px;opacity:.85;line-height:1.35');
  const photoBox = k.h(k.root, 'div', 'text-align:center');
  k.h(k.root, 'small', 'display:block;text-align:center;opacity:.65;padding:4px', 'Het camerabeeld verlaat je telefoon niet.');

  // ---- camera
  const camBtn = k.btn(camRow, '\u{1F4F7} Camera aan', () => { if (camOn) stopCamera(); else startCamera(); }, false, 'font-size:13px');
  const flipBtn = k.btn(camRow, '\u{1F504} Wissel camera', () => { facing = facing === 'environment' ? 'user' : 'environment'; if (camOn) { stopCamera(true); startCamera(); } }, false, 'font-size:13px;display:none');
  function stopCamera(keepMsg) {
    if (stream) { try { stream.getTracks().forEach((tr) => tr.stop()); } catch (e) {} }
    stream = null; camOn = false;
    try { video.srcObject = null; } catch (e) {}
    video.style.display = 'none';
    camBtn.textContent = '\u{1F4F7} Camera aan'; flipBtn.style.display = 'none';
    if (!keepMsg) msg.textContent = 'Camera uit. De tuin is er nog.';
  }
  async function startCamera() {
    if (camBusy || k.dead) return;
    const md = typeof navigator !== 'undefined' && navigator.mediaDevices;
    if (!md || !md.getUserMedia) { msg.textContent = 'Geen camera beschikbaar (of de pagina is niet via https geopend). Geen zorgen, de tuin werkt ook!'; return; }
    camBusy = true; msg.textContent = 'Even wachten op toestemming…';
    try {
      const s = await md.getUserMedia({ video: { facingMode: facing }, audio: false });
      if (k.dead) { try { s.getTracks().forEach((tr) => tr.stop()); } catch (e) {} return; }
      stream = s; camOn = true;
      video.srcObject = s;
      video.style.transform = facing === 'user' ? 'scaleX(-1)' : 'none';
      video.style.display = 'block';
      try { const pr = video.play(); if (pr && pr.catch) pr.catch(() => {}); } catch (e) {}
      camBtn.textContent = '\u{1F4F7} Camera uit'; flipBtn.style.display = 'inline-block';
      msg.textContent = 'Camera aan. Het beeld blijft op je toestel.';
    } catch (e) {
      const nm = e && e.name;
      msg.textContent = nm === 'NotAllowedError' || nm === 'SecurityError' ? 'Geen toestemming voor de camera. Dat is helemaal oké, we gebruiken de tuin.' : nm === 'NotFoundError' ? 'Geen camera gevonden. We gebruiken de tuin.' : 'De camera werkt nu niet. We gebruiken de tuin.';
    } finally { camBusy = false; }
  }

  // ---- hartjes
  let hearts = 0;
  function spawnHearts(x, y, n) {
    for (let i = 0; i < n && hearts < 14; i++) {
      hearts++;
      const e = k.h(fx, 'div', 'position:absolute;left:' + Math.round(x + rnd(-20, 20)) + 'px;top:' + Math.round(y + rnd(-10, 10)) + 'px;font-size:' + Math.round(rnd(16, 26)) + 'px;--dx:' + Math.round(rnd(-30, 30)) + 'px;animation:hx-heart 1.2s ease-out forwards', pick(['\u{1F49B}', '❤️', '\u{1F495}']));
      k.timeout(() => { hearts--; try { if (e.parentNode) e.parentNode.removeChild(e); } catch (x2) {} }, 1300);
    }
  }
  function pet() {
    spawnHearts(px, py - PS * 0.7, 4);
    setMood('liefde', 1600);
    k.sound('knuffel');
  }

  // ---- aanwijzer
  const lp = (e) => {
    let r = null;
    try { r = stage.getBoundingClientRect(); } catch (x) {}
    if (!r || !r.width) r = { left: 0, top: 0, width: SW, height: SH };
    return { x: ((e.clientX || 0) - r.left) * (SW / r.width), y: ((e.clientY || 0) - r.top) * (SH / r.height) };
  };
  const onPet = (p) => Math.abs(p.x - px) < PS * 0.6 && p.y > py - PS * 1.1 && p.y < py + 12;
  stage.addEventListener('pointerdown', (e) => {
    if (mode === 'verstop' && vs.hide >= 0 && !vs.found) return;
    const p = lp(e);
    try { if (stage.setPointerCapture && e.pointerId != null) stage.setPointerCapture(e.pointerId); } catch (x) {}
    down = { x: p.x, y: p.y, t: Date.now(), moved: 0, onPet: onPet(p) };
    rub = { dir: 0, n: 0, t: Date.now(), x: p.x };
    if (down.onPet) { dragging = true; grab = { x: px - p.x, y: py - p.y }; } else { following = true; tx = clamp(p.x, PS / 2, SW - PS / 2); }
  });
  stage.addEventListener('pointermove', (e) => {
    if (!down) return;
    const p = lp(e);
    down.moved = Math.max(down.moved, Math.hypot(p.x - down.x, p.y - down.y));
    if (dragging) {
      px = clamp(p.x + grab.x, PS / 2, SW - PS / 2); py = clamp(p.y + grab.y, PS, SH - 4); tx = px;
      const dx = p.x - rub.x;
      if (Math.abs(dx) > 6) {
        const d = dx > 0 ? 1 : -1;
        if (rub.dir && d !== rub.dir) { if (Date.now() - rub.t > 1300) { rub.n = 0; rub.t = Date.now(); } rub.n++; if (rub.n >= 3) { rub.n = 0; rub.t = Date.now(); pet(); } }
        rub.dir = d; rub.x = p.x;
      }
    } else if (following) tx = clamp(p.x, PS / 2, SW - PS / 2);
  });
  const up = () => {
    if (down && down.onPet && down.moved < 12 && Date.now() - down.t < 350) pet();
    down = null; dragging = false; following = false;
  };
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);

  // ---- hoofdlus
  let lastTs = 0;
  k.frame((ts) => {
    const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
    lastTs = ts; t += dt;
    if (petMood === 'liefde' && moodUntil && Date.now() > moodUntil) setMood(baseMood());
    if (mode === 'verstop' && vs.hide >= 0 && !vs.found) { petEl.style.display = 'none'; return; }
    petEl.style.display = 'block';
    if (!dragging) {
      py += (floorY - py) * Math.min(1, dt * 6);
      if (!following) { wander -= dt; if (wander <= 0 && !(mode === 'verstop')) { tx = rnd(PS / 2, SW - PS / 2); wander = rnd(2.5, 6); } }
      const dx = tx - px;
      moving = Math.abs(dx) > 3;
      if (moving) { const sp = following ? 150 : 55; px += Math.sign(dx) * Math.min(Math.abs(dx), sp * dt); flip = dx < 0 ? -1 : 1; }
    } else moving = false;
    const bob = dragging ? 0 : moving ? Math.abs(Math.sin(t * 9)) * 10 : Math.sin(t * 2) * 2;
    petEl.style.transform = 'translate3d(' + Math.round(px - PS / 2) + 'px,' + Math.round(py - PS) + 'px,0)';
    petIn.style.transform = 'translateY(' + (-bob).toFixed(1) + 'px) scaleX(' + flip + ')' + (dragging ? ' rotate(-6deg)' : '');
  });

  // ---- modi
  const modeBtns = {};
  [['samen', '\u{1F43E} Samen kijken'], ['verstop', '\u{1F648} Verstoppertje'], ['foto', '\u{1F4F8} Foto']].forEach(([id, l]) => { modeBtns[id] = k.btn(tabs, l, () => setMode(id), false, 'font-size:13px;padding:6px 9px'); });
  function setMode(m) {
    mode = m;
    Object.keys(modeBtns).forEach((x) => { modeBtns[x].className = 'hx-btn' + (x === m ? ' pri' : ''); });
    spotLayer.innerHTML = ''; controls.innerHTML = ''; photoBox.innerHTML = ''; hint.textContent = '';
    vs.hide = -1; vs.found = false; vs.over = false; vs.round = 0; vs.total = 0;
    petEl.style.display = 'block'; setMood(baseMood());
    if (peekStop) { peekStop(); peekStop = null; }
    if (m === 'samen') { msg.textContent = 'Sleep het huisdier, tik om hem te roepen, of aai hem met je vinger.'; hint.textContent = 'Tik en sleep. Aaien mag ook! \u{1F49B}'; }
    else if (m === 'foto') {
      msg.textContent = 'Zet je huisdier waar je wilt en maak een foto.';
      k.btn(controls, '\u{1F4F8} Maak foto', capture, true, 'font-size:16px;padding:10px 22px');
    } else { newGame(); }
  }

  // ---- verstoppertje
  let peekStop = null;
  function newGame() {
    vs.round = 0; vs.total = 0; vs.over = false;
    nextRound();
  }
  function nextRound() {
    controls.innerHTML = '';
    spotLayer.innerHTML = '';
    vs.round++; vs.tries = 0; vs.found = false;
    const cells = shuffle([0, 1, 2, 3, 4, 5]).slice(0, 5);
    const types = shuffle(SPOTS);
    const SZ = Math.round(Math.min(84, SW / 3.9)), cw = SW / 3, ch = (SH * 0.78) / 2;
    vs.spots = cells.map((c, i) => {
      const cx = (c % 3) * cw + cw / 2 + rnd(-cw * 0.08, cw * 0.08);
      const cy = SH * 0.12 + Math.floor(c / 3) * ch + ch * 0.55 + rnd(-6, 6);
      const el = k.h(spotLayer, 'div', 'position:absolute;left:' + Math.round(cx - SZ / 2) + 'px;top:' + Math.round(cy - SZ / 2) + 'px;width:' + SZ + 'px;height:' + SZ + 'px;pointer-events:auto;cursor:pointer;opacity:1');
      el.innerHTML = spotSvg(types[i], SZ);
      const s = { el, cx, cy, tried: false, name: types[i].n };
      el.addEventListener('pointerdown', (e) => { try { e.stopPropagation(); } catch (x) {} });
      el.addEventListener('click', () => tapSpot(s));
      return s;
    });
    vs.hide = Math.floor(Math.random() * vs.spots.length);
    hint.textContent = 'Ronde ' + vs.round + ' van ' + vs.rounds + ': waar zit ' + k.petName() + '?';
    msg.textContent = 'Tik op een plekje om te kijken. Ik geef hints: warm of koud!';
    petEl.style.display = 'none';
    k.sound('tik');
    if (peekStop) peekStop();
    peekStop = k.every(() => {
      if (vs.found || vs.hide < 0 || vs.over) return;
      const s = vs.spots[vs.hide];
      if (!s) return;
      const eyes = k.h(spotLayer, 'div', 'position:absolute;left:' + Math.round(s.cx - 14) + 'px;top:' + Math.round(s.cy - 36) + 'px;font-size:20px;pointer-events:none;animation:hx-fade .3s ease', '\u{1F440}');
      k.sound('tik');
      k.timeout(() => { try { if (eyes.parentNode) eyes.parentNode.removeChild(eyes); } catch (x) {} }, 800);
    }, 7000);
  }
  function tapSpot(s) {
    if (vs.found || vs.over || mode !== 'verstop') return;
    vs.tries++; vs.total++;
    const target = vs.spots[vs.hide];
    if (s === target) {
      vs.found = true;
      s.el.style.animation = 'hx-wob .6s ease';
      px = s.cx; tx = px; py = clamp(s.cy + PS * 0.4, PS, SH - 4); floorY = SH - 14;
      petEl.style.display = 'block'; setMood('blijblij', 2500);
      spawnHearts(s.cx, s.cy - 10, 6);
      k.sound('klaar');
      hint.textContent = '\u{1F389} Gevonden! ' + (vs.tries === 1 ? 'Meteen goed!' : 'In ' + vs.tries + ' pogingen.');
      msg.textContent = '';
      if (peekStop) { peekStop(); peekStop = null; }
      k.timeout(() => {
        if (vs.round >= vs.rounds) endGame(); else nextRound();
      }, 2200);
    } else {
      s.tried = true; s.el.style.opacity = '.45'; s.el.style.animation = 'hx-wob .5s ease';
      const d = Math.hypot(s.cx - target.cx, s.cy - target.cy) / Math.hypot(SW, SH);
      const w = d < 0.17 ? 'Heel warm! \u{1F525}' : d < 0.3 ? 'Warm ☀️' : d < 0.45 ? 'Lauw…' : 'Koud ❄️';
      hint.textContent = 'Daar niet. ' + w;
      k.sound('tik');
    }
  }
  function endGame() {
    vs.over = true;
    hint.textContent = '\u{1F31F} Alle ' + vs.rounds + ' keer gevonden!';
    spotLayer.innerHTML = '';
    px = SW / 2; tx = px; setMood('liefde', 3000); spawnHearts(px, py - PS, 8);
    k.award({ happy: 6, bond: 3, xp: 20 });
    k.toast('Verstoppertje gespeeld! Wat gezellig. \u{1F49B}');
    k.sound('prestatie');
    msg.textContent = 'Gevonden in ' + vs.total + ' pogingen. Goed gespeeld!';
    controls.innerHTML = '';
    k.btn(controls, '\u{1F504} Nog een keer', () => { petEl.style.display = 'none'; newGame(); }, true);
  }

  // ---- foto
  function petSvgUrl() {
    const s = k.petHtml(PS * 2, petMood || 'blij');
    if (!/^\s*<svg/i.test(s)) return null;
    const x = /xmlns=/.test(s) ? s : s.replace(/^\s*<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(x);
  }
  async function capture() {
    try {
      const S = 2, CW = SW * S, CH = SH * S;
      const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
      const ctx = cv.getContext('2d');
      if (camOn && video.videoWidth) {
        const vw = video.videoWidth, vh = video.videoHeight, sc = Math.max(CW / vw, CH / vh);
        const dw = vw * sc, dh = vh * sc;
        ctx.save();
        if (facing === 'user') { ctx.translate(CW, 0); ctx.scale(-1, 1); }
        ctx.drawImage(video, (CW - dw) / 2, (CH - dh) / 2, dw, dh);
        ctx.restore();
      } else drawGarden(ctx, CW, CH);
      const url = petSvgUrl();
      let drawn = false;
      if (url) {
        const img = new Image();
        const ok = await new Promise((res) => { img.onload = () => res(true); img.onerror = () => res(false); const tm = k.timeout(() => res(false), 2500); img.src = url; void tm; });
        if (ok) {
          ctx.save();
          const dx = (px - PS / 2) * S, dy = (py - PS) * S, w = PS * S;
          if (flip < 0) { ctx.translate(dx + w, dy); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, w, w); } else ctx.drawImage(img, dx, dy, w, w);
          ctx.restore(); drawn = true;
        }
      }
      if (!drawn) { ctx.font = Math.round(PS * S * 0.8) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('\u{1F43E}', px * S, py * S); }
      if (k.dead) return;
      const data = cv.toDataURL('image/png');
      photoBox.innerHTML = '';
      const im = k.h(photoBox, 'img', 'max-width:100%;border-radius:12px;margin-top:6px;-webkit-touch-callout:default');
      im.src = data; im.alt = 'Je foto';
      const a = k.h(photoBox, 'a', 'display:inline-block;margin:6px;padding:8px 14px;border-radius:12px;border:1px solid var(--line,#ccc);text-decoration:none;color:inherit', '⬇️ Download foto');
      a.href = data; a.download = 'huisdier-foto.png';
      k.h(photoBox, 'small', 'display:block;opacity:.75', 'Op iPhone: houd de foto ingedrukt om hem te bewaren.');
      k.sound('klaar'); setMood('blijblij', 1500);
      msg.textContent = 'Mooie foto!';
    } catch (e) {
      msg.textContent = 'De foto lukte niet. Probeer het nog eens, eventueel zonder camera.';
    }
  }

  setMode('samen');
  return {
    destroy() {
      stopCamera(true);
      peekStop = null;
      k.destroy();
    },
  };
}

export const EXTRAS = [
  { id: 'steun', name: 'Steun', emoji: '\u{1F49B}', desc: 'Een lief steuntje: check-in, complimentjes, samen ademen en kleine successen.', create: createSteun },
  { id: 'wandelen', name: 'Uitlaten', emoji: '\u{1F6B6}', desc: 'Wandel of ren samen met je huisdier en haal dagopdrachten.', create: createWandelen },
  { id: 'camera', name: 'Camera', emoji: '\u{1F4F7}', desc: 'Je huisdier op het camerabeeld: samen kijken, verstoppertje en foto’s.', create: createCamera },
];
