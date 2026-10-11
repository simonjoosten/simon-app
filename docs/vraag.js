// Dagelijkse vraag: elke dag één vraag voor iedereen. Antwoorden van anderen zie je pas nadat je zelf hebt geantwoord.
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const BANK = [
  // Kennismaken
  'Wat is je favoriete plek om even tot rust te komen?', 'Welk klein dingetje maakt jouw dag meteen beter?', 'Wat is een gewoonte van jou waar je stiekem blij mee bent?',
  'Welk lied zet je altijd harder als het op de radio komt?', 'Wat was het laatste dat je hardop deed lachen?', 'Hoe ziet voor jou een perfecte zondagochtend eruit?',
  'Welke bijnaam heb je ooit gehad, en hoe kwam je eraan?', 'Wat is je favoriete geur?', 'Welk woord vind jij gewoon heel mooi klinken?',
  'Ben je meer een ochtendmens of een avondmens?', 'Wat is het eerste dat je doet als je thuiskomt?', 'Welke kleur past het best bij jouw humeur van vandaag?',
  'Wat is iets waar je altijd om moet lachen?', 'Welk sprookje of verhaal vond je als kind het mooist?', 'Wat is je favoriete manier om iemand blij te maken?',
  'Welke talen zou je graag willen spreken?', 'Wat is een klein cadeautje waar je ooit heel blij mee was?', 'Welk seizoen past het best bij jou, en waarom?',
  'Wat is je favoriete plek in de buurt?', 'Waar ben je écht goed in, ook al is het iets geks?', 'Welke goede eigenschap van jezelf vind je het leukst?',
  'Wat voor weer maakt jou het gelukkigst?', 'Welke taak in huis vind je eigenlijk best fijn om te doen?', 'Welk dier zou jouw spiritdier zijn?',
  'Wat is het liefste dat iemand ooit voor je deed?', 'Wat doe je graag als je even niets hoeft?',
  // Voorkeuren
  'Wat is je favoriete maaltijd van de hele wereld?', 'Zoet of hartig: wat kies jij?', 'Wat is het lekkerste ontbijt dat je kent?',
  'Welk ijsje bestel je altijd?', 'Wat is je favoriete film om nog een keer te kijken?', 'Welk boek zou je iedereen aanraden?',
  'Strand, bos of bergen: waar voel jij je het fijnst?', 'Wat is je favoriete spelletje om samen te spelen?', 'Welke soep vind je het lekkerst?',
  'Wat is je favoriete dag van de week en waarom?', 'Welk kledingstuk draag je het liefst?', 'Wat eet je het liefst na een lange dag?',
  'Thee, koffie of iets anders: wat drink je het liefst?', 'Welke feestdag vind je het leukst?', 'Wat is jouw favoriete geluid?',
  'Welk tekenfilmpersonage lijkt het meest op jou?', 'Wat is je favoriete snack voor bij een film?', 'Welke bloem of plant vind je het mooist?',
  'Liever een lange wandeling of een rondje fietsen?', 'Wat is je favoriete pizzatopping?', 'Welke vakantiebestemming staat bovenaan jouw lijstje?',
  'Wat is je favoriete plek om te zitten in huis?', 'Welke muziek zet je op als je vrolijk wilt worden?', 'Wat is jouw favoriete fruit?',
  'Wat is de leukste app of game die je kent?', 'Welke kleur kamer zou je het liefst hebben?', 'Pannenkoeken of poffertjes?',
  'Wat vind je het leukste om te knutselen of te maken?', 'Welke boom vind je het mooist?', 'Wat is je favoriete jaargetijdenlekkernij?',
  // Dromen
  'Waar droom je van voor over een jaar?', 'Welke plek op aarde wil je ooit nog zien?', 'Wat zou je graag nog leren?',
  'Hoe zou jouw droomhuis eruitzien?', 'Welk beroep had je als kind in je hoofd?', 'Wat zou je doen met een extra vrije dag per week?',
  'Welk instrument zou je graag kunnen bespelen?', 'Wat zou je als eerste doen als je een boomhut mocht bouwen?', 'Welke reis wil je ooit samen maken?',
  'Wat is een klein doel dat je deze maand wilt halen?', 'Welk dier zou je graag als huisdier willen?', 'Als je een eigen winkeltje had, wat zou je verkopen?',
  'Welk avontuur wil je ooit beleven?', 'Waar zou je een tweede huisje willen hebben?', 'Wat zou je graag eens uitproberen?',
  'Welk talent zou je willen hebben als je het zo kon krijgen?', 'Hoe ziet jouw ideale tuin of balkon eruit?', 'Welk festival of evenement wil je ooit bezoeken?',
  'Wat is iets moois dat je wilt maken of bouwen?', 'Waar kijk je het meest naar uit deze zomer?', 'Wat zou je doen op een eiland helemaal voor jezelf?',
  'Welke sport zou je graag eens willen proberen?', 'Wat wil je later nog eens zeker gedaan hebben?', 'Welk land zou je willen kunnen bezoeken zonder reistijd?',
  // Wat zou je doen als
  'Wat zou je doen als je een dag onzichtbaar was?', 'Wat zou je doen als je 24 uur lang alles mocht bepalen?', 'Wat zou je doen als je een dier kon verstaan? Welk dier kies je?',
  'Wat zou je doen als je plotseling kon vliegen?', 'Wat zou je doen als je een miljoen knikkers won?', 'Wat zou je doen als het morgen een hele dag sneeuwde?',
  'Wat zou je doen als je een dag in een sprookje mocht wonen?', 'Wat zou je doen als je een pratende papegaai had?', 'Wat zou je doen als je een dag kon ruilen met iemand? Met wie?',
  'Wat zou je doen als je een kasteel kreeg?', 'Wat zou je doen als je elke dag een extra uur had?', 'Wat zou je doen als je de tijd even kon stilzetten?',
  'Wat zou je doen als je een nieuw snoepje mocht uitvinden? Hoe smaakt het?', 'Wat zou je doen als je een dag lang een superkracht had? Welke?', 'Wat zou je doen als je een ruimtereis mocht maken?',
  'Wat zou je doen als je een dag koning of koningin was?', 'Wat zou je doen als je een geheime kamer in huis vond?', 'Wat zou je doen als je een jaar lang gratis ijs kreeg?',
  'Wat zou je doen als je kon kiezen waar je morgen wakker werd?', 'Wat zou je doen als je een nieuwe feestdag mocht verzinnen? Hoe heet die?', 'Wat zou je doen als je op een regenachtige dag niets hoefde?',
  'Wat zou je doen als je een grote bak LEGO kreeg?', 'Wat zou je doen als je een dag onder water kon ademen?', 'Wat zou je doen als je een nieuw huisdier kon verzinnen?',
  'Welke drie dingen neem je mee naar een onbewoond eiland?',
  // Herinneringen
  'Wat is je vroegste fijne herinnering?', 'Welke vakantie zul je nooit vergeten?', 'Wat was je favoriete speelgoed vroeger?',
  'Wat was je leukste verjaardag ooit?', 'Welk gerecht deed je vroeger altijd denken aan thuis?', 'Wat was je favoriete plek om te spelen als kind?',
  'Welk liedje brengt je meteen terug naar vroeger?', 'Wat was een leuke dag op school die je nog weet?', 'Wie maakte je vroeger altijd aan het lachen?',
  'Welke gekke streek heb je ooit uitgehaald?', 'Wat is een mooie herinnering aan een zomer?', 'Welke tv-programma\'s keek je vroeger graag?',
  'Wat was het leukste uitje dat je ooit had?', 'Welk cadeau vergeet je nooit meer?', 'Wat is een geur die je aan vroeger doet denken?',
  'Wat was je eerste baantje of klusje?', 'Welke herinnering maakt je altijd blij?', 'Wat is het mooiste dat je ooit hebt gezien?',
  'Welke dag in je leven zou je zo opnieuw willen beleven?', 'Wat deed je vroeger als het regende?', 'Welke eerste keer onthoud je nog goed?',
  // Extra luchtige vragen
  'Als je een eigen ijssmaak had, hoe zou die heten?', 'Welke drie woorden beschrijven jouw dag tot nu toe?', 'Wat is het gekste dat je ooit hebt gegeten?',
  'Wat is iets kleins waar je vandaag dankbaar voor bent?', 'Welke film zou je zelf willen spelen? Welke rol?', 'Wat zou de titel van jouw levensverhaal zijn?',
  'Welk emoji past het best bij jou vandaag?', 'Welke uitvinding zou je graag bedenken?', 'Wat is jouw ideale pyjama-dag?',
  'Welk kleinigheidje maakt een huis meteen gezellig?', 'Welke superheld zou jij willen zijn?', 'Wat is de leukste verrassing die je ooit kreeg?',
  'Welk spelletje zullen we binnenkort samen doen?', 'Wat is een leuk plan voor dit weekend?', 'Wat zou je graag eens samen koken?',
  'Welke vraag zou jij aan de anderen willen stellen?', 'Waar word je rustig van?', 'Wat is je favoriete manier om een regenachtige dag door te komen?',
  'Welke kleine luxe gun jij jezelf?', 'Waar ben je deze week trots op?', 'Wat is je favoriete herfstactiviteit?', 'Welk knuffeldier of voorwerp had je vroeger altijd bij je?', 'Wat is een plekje waar je altijd blij van wordt?', 'Welke kleine traditie vind je fijn?',
];

const DAY = 86400000;
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return x; };
const dayNr = (d) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
const bankQ = (d) => BANK[((dayNr(d) % BANK.length) + BANK.length) % BANK.length];
const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const longDate = (d) => d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
const clock = (t) => (t ? new Date(t).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
const denied = (e) => e && (e.code === 'permission-denied' || /permission/i.test(e.message || ''));
const MAXLEN = 400;
const sty = { soft: 'background:var(--card);border-radius:14px;padding:1rem 1.1rem;margin:.8rem 0', q: 'font-size:1.2rem;line-height:1.45;margin:.4rem 0' };

export async function vraagView(ctx) {
  const { db, me, esc, nice, view, addCleanup } = ctx;
  let alive = true; addCleanup(() => { alive = false; });
  const today = new Date(); const todayKey = dayKey(today);
  let tab = 'vandaag';
  let adminQs = new Map(); // datum -> {q, by}
  let adminListOk = true;
  let mine = null, others = [], othersState = 'locked'; // locked | ok | error
  let past = [], streak = 0, pastLoaded = false, pastErr = false;
  let plan = [], planErr = false, planDate = dayKey(addDays(today, 1)), planText = '', planMsg = '';

  const questionFor = (key) => (adminQs.get(key) && adminQs.get(key).q) || bankQ(parseKey(key));
  const answersCol = (key) => collection(db, 'dailyq', key, 'answers');

  view.innerHTML = '<div class="box center"><small>Even de vraag van vandaag ophalen…</small></div>';

  async function loadQuestions() {
    try {
      const s = await getDocs(collection(db, 'dailyq'));
      adminQs = new Map(); s.docs.forEach((d) => { const x = d.data(); if (x && x.by === 'admin' && x.q) adminQs.set(d.id, { q: x.q, by: x.by, created: x.created }); });
      adminListOk = true;
    } catch (e) { console.error(e); adminListOk = false; }
  }

  async function loadToday() {
    try { const s = await getDoc(doc(db, 'dailyq', todayKey, 'answers', me.uid)); mine = s.exists() ? s.data() : null; } catch (e) { console.error(e); mine = null; }
    others = []; othersState = 'locked';
    if (!mine) return;
    try {
      const s = await getDocs(answersCol(todayKey));
      others = s.docs.map((d) => d.data()).sort((a, b) => (a.created || 0) - (b.created || 0)); othersState = 'ok';
    } catch (e) { if (!denied(e)) { console.error(e); othersState = 'error'; } else othersState = 'locked'; }
  }

  async function loadPast() {
    pastErr = false; past = [];
    const days = []; for (let i = 1; i <= 7; i++) days.push(addDays(today, -i));
    const res = await Promise.all(days.map(async (d) => {
      const key = dayKey(d); const row = { key, d, q: questionFor(key), mine: null, all: [], locked: false };
      try {
        const s = await getDocs(answersCol(key)); row.all = s.docs.map((x) => x.data()).sort((a, b) => (a.created || 0) - (b.created || 0));
        row.mine = row.all.find((x) => x.uid === me.uid) || null;
        if (!row.mine) { row.all = []; row.locked = true; }
      } catch (e) { if (denied(e)) row.locked = true; else { console.error(e); pastErr = true; } }
      return row;
    }));
    past = res;
    // Streak: vandaag (indien beantwoord) + opeenvolgende dagen terug; maximaal 30 dagen.
    let n = 0; const byKey = new Map(res.map((r) => [r.key, !!r.mine]));
    if (mine) n++;
    for (let i = 1; i <= 30; i++) {
      const key = dayKey(addDays(today, -i)); let ok = byKey.get(key);
      if (ok === undefined) { try { ok = (await getDoc(doc(db, 'dailyq', key, 'answers', me.uid))).exists(); } catch (e) { ok = false; } }
      if (ok) n++; else if (i === 1 && !mine) { continue; } else break;
    }
    streak = n; pastLoaded = true;
  }

  async function loadPlan() {
    planErr = false;
    try {
      const s = await getDocs(collection(db, 'dailyq'));
      plan = s.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => x.by === 'admin' && x.id >= todayKey).sort((a, b) => (a.id < b.id ? -1 : 1));
    } catch (e) { console.error(e); planErr = true; }
  }

  const answerBlock = (a, own) => `<div style="${sty.soft};margin:.5rem 0${own ? ';border:1px solid var(--accent)' : ''}"><b>${esc(a.name || 'Iemand')}${own ? ' <small>(jij)</small>' : ''}</b>
    <div style="margin:.3rem 0;white-space:pre-wrap">${esc(a.text || '')}</div><small>${clock(a.created)}</small></div>`;

  function drawToday() {
    const streakTxt = !pastLoaded ? '' : streak > 1 ? `<span class="chip">🔥 ${streak} dagen op rij</span>` : streak === 1 ? '<span class="chip">🌱 Je bent begonnen</span>' : '';
    let h = `<div class="box center" style="padding:1.4rem 1rem"><small>${esc(longDate(today))}</small>
      <div style="${sty.q}"><b>${esc(questionFor(todayKey))}</b></div>${adminQs.has(todayKey) ? '<small>Een eigen vraag van Simon 💛</small>' : ''}<div style="margin-top:.5rem">${streakTxt}</div></div>`;
    h += `<div class="box"><b>${mine ? 'Jouw antwoord' : 'Jouw antwoord op vandaag'}</b>
      <textarea id="vq-text" maxlength="${MAXLEN}" rows="4" placeholder="Typ hier rustig je antwoord…" style="width:100%;box-sizing:border-box;margin:.5rem 0;padding:.7rem;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:inherit;resize:vertical">${esc(mine ? mine.text : '')}</textarea>
      <div class="row" style="justify-content:space-between;align-items:center"><small id="vq-count">0 / ${MAXLEN}</small><button class="pri" id="vq-save">${mine ? 'Aanpassen' : 'Antwoord delen'}</button></div>
      <div id="vq-msg"></div></div>`;
    if (!mine) h += '<div class="box center"><small>Beantwoord eerst zelf de vraag om de antwoorden van de anderen te zien. ✨</small></div>';
    else if (othersState === 'error') h += '<div class="box"><div class="err">De antwoorden konden niet geladen worden.</div><div class="row"><button id="vq-retry">Opnieuw proberen</button></div></div>';
    else if (othersState === 'locked') h += '<div class="box center"><small>Beantwoord eerst zelf de vraag om de antwoorden van de anderen te zien.</small></div>';
    else {
      const list = others.length ? others : [mine];
      h += `<div style="margin-top:1rem"><b>Antwoorden van vandaag</b></div>${list.map((a) => answerBlock(a, a.uid === me.uid)).join('')}`;
      if (others.filter((a) => a.uid !== me.uid).length === 0) h += '<div class="center"><small>De anderen hebben nog niet geantwoord. Rustig aan, er is tijd genoeg.</small></div>';
    }
    h += '<div style="margin-top:1.4rem"><b>Eerdere dagen</b></div>';
    if (!pastLoaded) h += '<div class="box center"><small>Eerdere dagen worden opgehaald…</small></div>';
    else {
      if (pastErr) h += '<div class="box"><div class="err"><small>Een deel van de eerdere dagen kon niet geladen worden.</small></div></div>';
      h += past.map((r) => `<div class="box"><small>${esc(longDate(r.d))}</small><div style="margin:.25rem 0 .5rem"><b>${esc(r.q)}</b></div>
        ${r.mine ? r.all.map((a) => answerBlock(a, a.uid === me.uid)).join('') : '<small>Je hebt deze dag niet geantwoord, dus de antwoorden blijven verborgen.</small>'}</div>`).join('');
    }
    return h;
  }

  function drawAdmin() {
    const minD = todayKey;
    let h = `<div class="box"><b>Vraag inplannen</b><div style="margin:.5rem 0"><small>Datum</small><br><input type="date" id="vq-date" min="${minD}" value="${esc(planDate)}" style="padding:.5rem;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:inherit"></div>
      <textarea id="vq-q" maxlength="200" rows="3" placeholder="Jouw eigen vraag voor die dag…" style="width:100%;box-sizing:border-box;padding:.7rem;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:inherit">${esc(planText)}</textarea>
      <div class="row" style="margin-top:.5rem"><button class="pri" id="vq-plan">Inplannen</button></div>
      <div id="vq-pmsg">${planMsg}</div>
      <small>Staat er voor een dag niets gepland, dan komt er een vraag uit de ingebouwde bank.</small></div>
      <div style="margin-top:1rem"><b>Geplande vragen</b></div>`;
    if (planErr) h += '<div class="box"><div class="err">De geplande vragen konden niet geladen worden.</div><div class="row"><button id="vq-preload">Opnieuw proberen</button></div></div>';
    else if (!plan.length) h += '<div class="box center"><small>Nog niets gepland. Alle komende dagen komen uit de ingebouwde bank.</small></div>';
    else h += plan.map((p) => `<div class="box"><small>${esc(longDate(parseKey(p.id)))}</small><div style="margin:.25rem 0">${esc(p.q)}</div><div class="row"><button data-del="${esc(p.id)}">Verwijderen</button></div></div>`).join('');
    return h;
  }

  function draw() {
    if (!alive) return;
    const tabs = me.admin ? `<div class="row wrap"><button data-tab="vandaag" class="${tab === 'vandaag' ? 'pri' : ''}" style="flex:1">Vandaag</button><button data-tab="admin" class="${tab === 'admin' ? 'pri' : ''}" style="flex:1">Beheer</button></div>` : '';
    view.innerHTML = tabs + (tab === 'admin' && me.admin ? drawAdmin() : drawToday());
    view.querySelectorAll('[data-tab]').forEach((b) => b.onclick = async () => { tab = b.dataset.tab; if (tab === 'admin' && !plan.length) { await loadPlan(); } draw(); });
    wireToday(); wireAdmin();
  }

  function wireToday() {
    const ta = view.querySelector('#vq-text'); if (!ta) return;
    const cnt = view.querySelector('#vq-count'); const upd = () => { cnt.textContent = `${ta.value.length} / ${MAXLEN}`; }; ta.oninput = upd; upd();
    const rt = view.querySelector('#vq-retry'); if (rt) rt.onclick = async () => { await loadToday(); draw(); };
    view.querySelector('#vq-save').onclick = async (ev) => {
      const text = ta.value.trim().slice(0, MAXLEN); const msg = view.querySelector('#vq-msg');
      if (!text) { msg.innerHTML = '<small class="err">Schrijf eerst iets, hoe kort ook.</small>'; return; }
      ev.target.disabled = true; msg.innerHTML = '<small>Opslaan…</small>';
      try {
        await setDoc(doc(db, 'dailyq', todayKey, 'answers', me.uid), { uid: me.uid, name: me.name, text, created: mine && mine.created ? mine.created : Date.now() });
        if (!alive) return;
        await loadToday(); await loadPast(); draw();
        const m2 = view.querySelector('#vq-msg'); if (m2) m2.innerHTML = '<small>Opgeslagen, dankjewel! 💛</small>';
      } catch (e) { if (!alive) return; msg.innerHTML = `<small class="err">${esc(nice(e))}</small>`; ev.target.disabled = false; }
    };
  }

  function wireAdmin() {
    const btn = view.querySelector('#vq-plan'); if (!btn) return;
    view.querySelector('#vq-date').onchange = (e) => { planDate = e.target.value; };
    view.querySelector('#vq-q').oninput = (e) => { planText = e.target.value; };
    const pr = view.querySelector('#vq-preload'); if (pr) pr.onclick = async () => { await loadPlan(); draw(); };
    btn.onclick = async () => {
      const q = view.querySelector('#vq-q').value.trim(); const date = view.querySelector('#vq-date').value;
      const pm = view.querySelector('#vq-pmsg');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < todayKey) { pm.innerHTML = '<small class="err">Kies een datum vanaf vandaag.</small>'; return; }
      if (!q) { pm.innerHTML = '<small class="err">Typ eerst een vraag.</small>'; return; }
      btn.disabled = true;
      try {
        await setDoc(doc(db, 'dailyq', date), { q: q.slice(0, 200), by: 'admin', created: Date.now() });
        if (!alive) return;
        planText = ''; planMsg = `<small>Ingepland voor ${esc(longDate(parseKey(date)))} ✅</small>`;
        await loadQuestions(); await loadPlan(); draw();
      } catch (e) { if (!alive) return; pm.innerHTML = `<small class="err">${esc(nice(e))}</small>`; btn.disabled = false; }
    };
    view.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => {
      if (!confirm('Deze geplande vraag verwijderen?')) return; b.disabled = true;
      try { await deleteDoc(doc(db, 'dailyq', b.dataset.del)); if (!alive) return; planMsg = ''; await loadQuestions(); await loadPlan(); draw(); }
      catch (e) { if (alive) { alert(nice(e)); b.disabled = false; } }
    });
  }

  try {
    await loadQuestions(); await loadToday();
    if (!alive) return;
    draw();
    await loadPast(); if (!alive) return;
    draw();
  } catch (e) {
    console.error(e); if (!alive) return;
    view.innerHTML = `<div class="box"><div class="err">Er ging iets mis bij het laden: ${esc(nice(e))}</div><div class="row"><button id="vq-again">Opnieuw proberen</button></div></div>`;
    view.querySelector('#vq-again').onclick = () => vraagView(ctx);
  }
}
