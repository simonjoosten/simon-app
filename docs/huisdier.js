// Huisdier: een rustig Tamagotchi-achtig maatje. Nooit dood, hooguit droevig of slaperig.
// Firestore: pets/{uid} = { data: <JSON-string>, updated: ms }
import { doc, getDoc, setDoc, collection, getDocs }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const H = 3600000;
const MAX_OFFLINE = 24 * H;   // maximaal 24 uur aftrek
const FLOOR = 15;             // daarna (door tijd) nooit lager dan 15
const RATES = { hunger: 4, happy: 3, energy: 2, clean: 3 }; // punten per uur

const TYPES = { kat: '🐱', hond: '🐶', konijn: '🐰', panda: '🐼', eend: '🦆', kikker: '🐸', eenhoorn: '🦄', draakje: '🐲' };
const TYPE_NL = { kat: 'Kat', hond: 'Hond', konijn: 'Konijn', panda: 'Panda', eend: 'Eend', kikker: 'Kikker', eenhoorn: 'Eenhoorn', draakje: 'Draakje' };

// slot: head / face / neck / side / bg
const SHOP = [
  { id: 'hoed', e: '🎩', n: 'Hoge hoed', p: 25, slot: 'head' },
  { id: 'kroon', e: '👑', n: 'Kroon', p: 60, slot: 'head' },
  { id: 'pet', e: '🎓', n: 'Studentenhoed', p: 35, slot: 'head' },
  { id: 'feest', e: '🥳', n: 'Feestgezicht', p: 30, slot: 'head' },
  { id: 'bril', e: '🕶️', n: 'Zonnebril', p: 25, slot: 'face' },
  { id: 'sjaal', e: '🧣', n: 'Sjaal', p: 20, slot: 'neck' },
  { id: 'strik', e: '🎀', n: 'Strik', p: 15, slot: 'side' },
  { id: 'bloem', e: '🌸', n: 'Bloemetje', p: 10, slot: 'side' },
  { id: 'bg-regenboog', e: '🌈', n: 'Regenboog', p: 40, slot: 'bg', css: 'linear-gradient(160deg,#ffd6e0,#fff3c4,#d4f5dd,#d3e6ff)' },
  { id: 'bg-nacht', e: '🌙', n: 'Sterrennacht', p: 40, slot: 'bg', css: 'linear-gradient(180deg,#27304f,#4b3f72)' },
  { id: 'bg-strand', e: '🏖️', n: 'Strand', p: 50, slot: 'bg', css: 'linear-gradient(180deg,#bfe6ff 0%,#bfe6ff 60%,#f6e3b0 60%)' },
  { id: 'bg-bos', e: '🌳', n: 'Bos', p: 50, slot: 'bg', css: 'linear-gradient(180deg,#d9f2d0,#9fd49a)' },
];
const ITEM = Object.fromEntries(SHOP.map((i) => [i.id, i]));

const SAY = {
  blijblij: ['Ik ben super blij! 🥰', 'Wat een heerlijke dag!', 'Jij bent de allerbeste!'],
  blij: ['Hoi! Fijn dat je er bent.', 'Alles is lekker rustig.', 'Zullen we iets doen?'],
  hongerig: ['Mijn buikje rommelt…', 'Heb je iets lekkers voor me?', 'Ik heb wel zin in een hapje.'],
  moe: ['Ik ben een beetje slaperig…', 'Een dutje zou fijn zijn.', '*geeuw*'],
  vies: ['Ik voel me wat plakkerig…', 'Een badje zou lekker zijn!', 'Hmm, ik ruik een beetje.'],
  verdrietig: ['Ik voel me een beetje alleen…', 'Zin om te spelen?', 'Een knuffel of spelletje helpt!'],
  slaap: ['Zzz… zzz…', 'Zzz… dromen over koekjes…'],
};
const MOOD_EMO = { blijblij: '✨', blij: '😊', hongerig: '🍽️', moe: '💤', vies: '💦', verdrietig: '😢', slaap: '😴' };
const MOOD_NL = { blijblij: 'dolgelukkig', blij: 'blij', hongerig: 'hongerig', moe: 'moe', vies: 'vies', verdrietig: 'verdrietig', slaap: 'slaapt' };

const clamp = (v) => Math.max(0, Math.min(100, v));
const num = (v, d) => (Number.isFinite(v) ? v : d);

// Pure functie: waarden dalen langzaam met echte tijd. Maximaal 24 uur aftrek, en door tijd
// zakt een waarde niet onder 15 (was hij al lager, dan blijft hij gelijk).
export function decay(state, nowMs) {
  const last = Number.isFinite(state.last) ? state.last : nowMs;
  const h = Math.min(Math.max(0, nowMs - last), MAX_OFFLINE) / H;
  const out = { ...state };
  for (const k of Object.keys(RATES)) {
    const old = clamp(num(state[k], 70));
    out[k] = clamp(Math.max(old - RATES[k] * h, Math.min(old, FLOOR)));
  }
  out.last = nowMs;
  return out;
}

export function moodOf(s) {
  const low = [['hongerig', s.hunger], ['moe', s.energy], ['vies', s.clean], ['verdrietig', s.happy]].sort((a, b) => a[1] - b[1])[0];
  if (low[1] < 35) return low[0];
  if (s.hunger >= 70 && s.happy >= 70 && s.energy >= 70 && s.clean >= 70) return 'blijblij';
  return 'blij';
}

const newPet = (type, name) => ({ type, name, hunger: 80, happy: 80, energy: 80, clean: 80, coins: 10, owned: [], worn: [], bg: '', born: Date.now(), last: Date.now() });

function parsePet(raw) {
  try {
    const s = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!s || !TYPES[s.type]) return null;
    return {
      type: s.type, name: String(s.name || 'Maatje').slice(0, 16),
      hunger: clamp(num(s.hunger, 70)), happy: clamp(num(s.happy, 70)), energy: clamp(num(s.energy, 70)), clean: clamp(num(s.clean, 70)),
      coins: Math.max(0, Math.floor(num(s.coins, 0))),
      owned: Array.isArray(s.owned) ? s.owned.filter((i) => ITEM[i]) : [],
      worn: Array.isArray(s.worn) ? s.worn.filter((i) => ITEM[i] && ITEM[i].slot !== 'bg') : [],
      bg: ITEM[s.bg] && ITEM[s.bg].slot === 'bg' ? s.bg : '',
      born: num(s.born, Date.now()), last: num(s.last, Date.now()),
    };
  } catch { return null; }
}

const CSS = `
.hd-tabs{display:flex;gap:8px;margin-bottom:10px}.hd-tabs button{flex:1}
.hd-stage{position:relative;height:230px;border-radius:18px;border:1px solid var(--line);background:var(--card);overflow:hidden;display:flex;align-items:center;justify-content:center;margin-bottom:10px}
.hd-pet{position:relative;width:130px;height:130px;margin-top:20px;display:flex;align-items:center;justify-content:center;animation:hd-wiggle 3.2s ease-in-out infinite;transform-origin:50% 90%}
.hd-pet .hd-body{font-size:92px;line-height:1}
.hd-pet.hd-blijblij{animation:hd-bounce 1s ease-in-out infinite}
.hd-pet.hd-slaap{animation:hd-sleep 3.5s ease-in-out infinite}
.hd-pet.hd-verdrietig .hd-body,.hd-pet.hd-moe .hd-body{filter:saturate(.55)}
.hd-pet.hd-hug{animation:hd-bounce .5s ease-in-out 4}
.hd-it{position:absolute;line-height:1;pointer-events:none}
.hd-head{top:-26px;left:50%;transform:translateX(-50%);font-size:52px}
.hd-face{top:38%;left:50%;transform:translateX(-50%);font-size:46px}
.hd-neck{bottom:-6px;left:50%;transform:translateX(-50%);font-size:44px}
.hd-side{top:0;right:6px;font-size:34px}
.hd-mood{position:absolute;top:2px;left:-6px;font-size:30px;animation:hd-float 2s ease-in-out infinite}
.hd-bubble{position:absolute;top:10px;left:50%;transform:translateX(-50%);background:#fff;color:#333;border-radius:14px;padding:6px 12px;font-size:14px;max-width:86%;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.15)}
.hd-bubble:after{content:"";position:absolute;bottom:-6px;left:50%;margin-left:-6px;border:6px solid transparent;border-bottom:0;border-top-color:#fff}
.hd-bar{display:flex;align-items:center;gap:8px;margin:6px 0}.hd-bar span:first-child{width:92px;font-size:14px}
.hd-bar i{flex:1;height:10px;border-radius:6px;background:var(--line);overflow:hidden;display:block}.hd-bar b{display:block;height:100%;background:var(--accent);border-radius:6px;transition:width .6s}
.hd-types{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}
.hd-types button{font-size:30px;padding:8px 0}.hd-types button.pri{outline:2px solid var(--accent)}
.hd-acts{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:10px 0}
.hd-acts button{padding:12px 6px}
.hd-arena{position:relative;height:300px;border-radius:18px;border:1px solid var(--line);background:var(--card);overflow:hidden;touch-action:manipulation;user-select:none}
.hd-ball{position:absolute;font-size:40px;line-height:1;cursor:pointer;padding:6px;animation:hd-pop .25s ease-out}
.hd-shop{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.hd-shop .box{text-align:center;margin:0}.hd-shop .em{font-size:34px}
.hd-friend{display:flex;align-items:center;gap:12px}.hd-friend .hd-pet{margin:0;transform:scale(.6);margin:-20px -16px}
@keyframes hd-wiggle{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
@keyframes hd-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@keyframes hd-sleep{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@keyframes hd-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes hd-pop{from{transform:scale(.3);opacity:0}to{transform:scale(1);opacity:1}}
`;

// Het huisdier met accessoires (alleen emoji, geen extra bestanden)
function petHTML(s, mood, extra = '') {
  const items = s.worn.map((i) => `<span class="hd-it hd-${ITEM[i].slot}">${ITEM[i].e}</span>`).join('');
  return `<div class="hd-pet hd-${mood} ${extra}"><span class="hd-body">${mood === 'slaap' ? '😴' : TYPES[s.type]}</span>${mood === 'slaap' ? `<span class="hd-it hd-side" style="font-size:0"></span>` : items}<span class="hd-mood">${MOOD_EMO[mood]}</span></div>`;
}
const bgCss = (s) => (s.bg && ITEM[s.bg] ? ITEM[s.bg].css : 'var(--card)');

export async function huisdierView(ctx) {
  const { db, me, esc, view, addCleanup } = ctx;
  const ref = doc(db, 'pets', me.uid);
  const lsKey = `huisdier:${me.uid}`;
  const timers = new Set();
  let alive = true, tab = 'jij', screen = 'main', state = null, saveT = null, dirty = false;
  let sleepUntil = 0, say = '', sayUntil = 0, lastMood = '', phrase = '', loadErr = '';
  let game = null, pickType = 'kat', visitInfo = null;
  const cd = {}; // cooldowns (ms timestamp)

  if (!document.getElementById('hd-css')) { const st = document.createElement('style'); st.id = 'hd-css'; st.textContent = CSS; document.head.appendChild(st); }

  /* ---------- opslaan / laden ---------- */
  const pack = () => ({ data: JSON.stringify(state), updated: Date.now() });
  function saveLocal() { try { localStorage.setItem(lsKey, JSON.stringify(pack())); } catch {} }
  async function flush() {
    if (saveT) { clearTimeout(saveT); saveT = null; }
    if (!dirty || !state) return;
    dirty = false;
    const p = pack();
    try { localStorage.setItem(lsKey, JSON.stringify(p)); } catch {}
    try { await setDoc(ref, p); } catch (e) { console.error(e); dirty = true; }
  }
  function changed() { dirty = true; saveLocal(); if (saveT) clearTimeout(saveT); saveT = setTimeout(flush, 2000); }

  async function load() {
    let loc = null, rem = null;
    try { const l = JSON.parse(localStorage.getItem(lsKey) || 'null'); if (l && l.data) loc = { updated: num(l.updated, 0), s: parsePet(l.data) }; } catch {}
    try { const sn = await getDoc(ref); if (sn.exists()) { const d = sn.data(); rem = { updated: num(d.updated, 0), s: parsePet(d.data) }; } } catch (e) { console.error(e); loadErr = 'Kon de online opslag niet bereiken, ik gebruik wat op dit apparaat staat.'; }
    const best = [loc, rem].filter((x) => x && x.s).sort((a, b) => b.updated - a.updated)[0];
    if (best) { state = decay(best.s, Date.now()); if (best === loc && (!rem || !rem.s || loc.updated > rem.updated)) changed(); }
  }

  const timer = (fn, ms) => { const t = setInterval(fn, ms); timers.add(t); return t; };
  const stopTimer = (t) => { clearInterval(t); timers.delete(t); };
  const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', flush);
  addCleanup(() => {
    alive = false; timers.forEach(clearInterval); timers.clear(); game = null;
    document.removeEventListener('visibilitychange', onHide); window.removeEventListener('pagehide', flush);
    flush();
  });

  /* ---------- helpers ---------- */
  const $ = (sel) => view.querySelector(sel);
  const sleeping = () => Date.now() < sleepUntil;
  const curMood = () => (sleeping() ? 'slaap' : moodOf(state));
  function bubbleText() {
    if (Date.now() < sayUntil) return say;
    const m = curMood();
    if (m !== lastMood || !phrase) { lastMood = m; const l = SAY[m]; phrase = l[Math.floor(Math.random() * l.length)]; }
    return phrase;
  }
  const speak = (t, ms = 4000) => { say = t; sayUntil = Date.now() + ms; paint(); };
  const cdLeft = (k) => Math.max(0, Math.ceil(((cd[k] || 0) - Date.now()) / 1000));

  /* ---------- schermen ---------- */
  function shell(inner) {
    view.innerHTML = `<div class="hd-tabs"><button data-t="jij" class="${tab === 'jij' ? 'pri' : ''}">🐾 Jij</button><button data-t="vrienden" class="${tab === 'vrienden' ? 'pri' : ''}">👥 Vrienden</button></div>${inner}`;
    view.querySelectorAll('[data-t]').forEach((b) => { b.onclick = () => { if (game) endGame(false); tab = b.dataset.t; screen = 'main'; render(); }; });
  }

  function render() {
    if (!alive) return;
    if (tab === 'vrienden') return renderFriends();
    if (!state) return renderPick();
    if (screen === 'shop') return renderShop();
    if (screen === 'game') return renderGame();
    renderMain();
  }

  function renderPick() {
    shell(`<div class="box"><h3>Kies je huisdier</h3><div class="hd-types">${Object.keys(TYPES).map((k) => `<button data-k="${k}" class="${k === pickType ? 'pri' : ''}" title="${TYPE_NL[k]}">${TYPES[k]}</button>`).join('')}</div>
      <p class="center"><small>${TYPE_NL[pickType]}</small></p>
      <div class="row"><input id="hd-name" maxlength="16" placeholder="Hoe heet hij of zij?" style="flex:1"><button class="pri" id="hd-go">Adopteren 💛</button></div>
      ${loadErr ? `<p class="err">${esc(loadErr)}</p>` : ''}</div>`);
    view.querySelectorAll('[data-k]').forEach((b) => { b.onclick = () => { const n = $('#hd-name').value; pickType = b.dataset.k; renderPick(); $('#hd-name').value = n; }; });
    $('#hd-go').onclick = () => {
      const name = $('#hd-name').value.trim().slice(0, 16);
      if (!name) { $('#hd-name').focus(); return; }
      state = newPet(pickType, name); changed(); flush(); render();
    };
  }

  const stageHTML = () => `<div class="hd-stage" id="hd-stage" style="background:${bgCss(state)}"><div class="hd-bubble" id="hd-bub"></div><div id="hd-petbox"></div></div>`;

  function renderMain() {
    shell(`${stageHTML()}
      <div class="center"><b>${esc(state.name)}</b> <small>· ${TYPE_NL[state.type]} · <span id="hd-mn"></span></small></div>
      <div id="hd-bars">${[['hunger', '🍎 Honger'], ['happy', '💛 Geluk'], ['energy', '⚡ Energie'], ['clean', '🫧 Schoon']].map(([k, l]) => `<div class="hd-bar"><span>${l}</span><i><b data-bar="${k}"></b></i></div>`).join('')}</div>
      <div class="hd-acts">
        <button data-a="eat">🍎 Eten</button><button data-a="play">🎾 Spelen</button>
        <button data-a="sleep">😴 Dutje</button><button data-a="wash">🛁 Wassen</button>
      </div>
      <div class="row wrap"><span class="chip" id="hd-coins"></span><button class="pri" id="hd-game" style="flex:1">⚽ Vang de bal</button><button id="hd-shopb" style="flex:1">🛍️ Winkeltje</button></div>
      ${loadErr ? `<p class="err">${esc(loadErr)}</p>` : ''}`);
    view.querySelectorAll('[data-a]').forEach((b) => { b.onclick = () => act(b.dataset.a); });
    $('#hd-game').onclick = () => { if (sleeping()) return speak('Sst… ik slaap nog even.'); screen = 'game'; render(); };
    $('#hd-shopb').onclick = () => { screen = 'shop'; render(); };
    paint(true);
  }

  let itemKey = '';
  // Werkt alleen bestaande elementen bij (geen herbouw, zodat animaties soepel blijven).
  function paint(force) {
    if (!alive || !state) return;
    const mood = curMood();
    const pb = $('#hd-petbox');
    if (pb) {
      const key = `${state.type}|${state.worn.join()}|${mood}`;
      if (force || key !== itemKey) { itemKey = key; pb.innerHTML = petHTML(state, mood); }
      const st = $('#hd-stage'); if (st) st.style.background = bgCss(state);
    }
    const bub = $('#hd-bub'); if (bub) bub.textContent = bubbleText();
    const mn = $('#hd-mn'); if (mn) mn.textContent = MOOD_NL[mood];
    view.querySelectorAll('[data-bar]').forEach((b) => { b.style.width = `${Math.round(state[b.dataset.bar])}%`; });
    const co = $('#hd-coins'); if (co) co.textContent = `🪙 ${state.coins}`;
    const names = { eat: '🍎 Eten', play: '🎾 Spelen', sleep: '😴 Dutje', wash: '🛁 Wassen' };
    view.querySelectorAll('[data-a]').forEach((b) => {
      const k = b.dataset.a, left = cdLeft(k);
      const busy = sleeping() && k !== 'sleep';
      b.disabled = left > 0 || busy || (k === 'sleep' && sleeping());
      b.textContent = k === 'sleep' && sleeping() ? `😴 Slaapt… ${Math.max(0, Math.ceil((sleepUntil - Date.now()) / 1000))}s` : left > 0 ? `${names[k].slice(0, 2)} ${left}s` : names[k];
    });
  }

  function act(k) {
    if (sleeping() || cdLeft(k) > 0) return;
    const add = (f, v) => { state[f] = clamp(state[f] + v); };
    if (k === 'eat') {
      if (state.hunger >= 95) return speak('Ik zit helemaal vol, dankjewel!');
      add('hunger', 30); add('happy', 3); cd.eat = Date.now() + 8000; speak('Mmm, lekker! 😋');
    } else if (k === 'play') {
      if (state.energy < 12) return speak('Ik ben te moe om te spelen… eerst een dutje?');
      add('happy', 25); add('energy', -12); add('clean', -4); cd.play = Date.now() + 8000; speak('Wheee! Wat leuk! 🎾');
    } else if (k === 'sleep') {
      add('energy', 45); sleepUntil = Date.now() + 60000; cd.sleep = sleepUntil + 20000; lastMood = ''; speak('Welterusten… 🌙', 1500);
    } else if (k === 'wash') {
      add('clean', 35); add('happy', 2); cd.wash = Date.now() + 12000; speak('Schoon en fris! 🫧');
    }
    changed(); paint(true);
  }

  /* ---------- spelletje: Vang de bal ---------- */
  function renderGame() {
    shell(`<div class="box center"><div class="row" style="justify-content:space-between"><span class="chip" id="hd-gt">⏱️ 30</span><span class="chip" id="hd-gs">⚽ 0</span></div></div>
      <div class="hd-arena" id="hd-arena"><p class="center" style="margin-top:130px"><small>Tik op de ballen!</small></p></div>
      <div class="row" style="margin-top:10px"><button id="hd-gstart" class="pri" style="flex:1">▶ Start (30 sec)</button><button id="hd-gback" style="flex:1">Terug</button></div>`);
    $('#hd-gback').onclick = () => { endGame(false); screen = 'main'; render(); };
    $('#hd-gstart').onclick = startGame;
  }
  function startGame() {
    if (game) return;
    const arena = $('#hd-arena'); arena.innerHTML = '';
    $('#hd-gstart').disabled = true;
    game = { score: 0, end: Date.now() + 30000, balls: new Map(), next: 0, id: 0, t: null };
    const upd = () => { const s = $('#hd-gs'); if (s) s.textContent = `⚽ ${game ? game.score : 0}`; };
    game.t = timer(() => {
      if (!game) return;
      const now = Date.now(), left = Math.ceil((game.end - now) / 1000);
      const gt = $('#hd-gt'); if (gt) gt.textContent = `⏱️ ${Math.max(0, left)}`;
      for (const [id, b] of game.balls) if (now > b.until) { b.el.remove(); game.balls.delete(id); }
      if (now >= game.end) return endGame(true);
      if (now >= game.next) {
        game.next = now + 450 + Math.random() * 450;
        const el = document.createElement('span'); el.className = 'hd-ball'; el.textContent = ['⚽', '🎾', '🏀'][Math.floor(Math.random() * 3)];
        const w = arena.clientWidth || 300, h = arena.clientHeight || 300;
        el.style.left = `${Math.random() * (w - 56)}px`; el.style.top = `${Math.random() * (h - 56)}px`;
        const id = ++game.id; const g = game;
        el.onpointerdown = (e) => { e.preventDefault(); if (game !== g || !g.balls.has(id)) return; g.score++; el.remove(); g.balls.delete(id); upd(); };
        arena.appendChild(el); game.balls.set(id, { el, until: now + 1300 + Math.random() * 500 });
      }
    }, 100);
  }
  function endGame(finished) {
    if (!game) return;
    const g = game; game = null; stopTimer(g.t);
    if (finished) {
      state.coins += g.score; state.happy = clamp(state.happy + Math.min(20, g.score)); changed();
      const arena = $('#hd-arena');
      if (arena) { arena.innerHTML = `<p class="center" style="margin-top:100px;font-size:22px">Klaar! 🎉<br>Je vangt <b>${g.score}</b> ballen<br>+${g.score} 🪙</p>`; }
      const b = $('#hd-gstart'); if (b) { b.disabled = false; b.textContent = '▶ Nog een keer'; }
      const gt = $('#hd-gt'); if (gt) gt.textContent = '⏱️ 0';
    }
  }

  /* ---------- winkeltje ---------- */
  function renderShop() {
    const card = (i) => {
      const own = state.owned.includes(i.id), on = i.slot === 'bg' ? state.bg === i.id : state.worn.includes(i.id);
      const btn = own ? `<button data-w="${i.id}" class="${on ? 'pri' : ''}">${on ? 'Aan ✓' : 'Uit'}</button>` : `<button data-b="${i.id}" ${state.coins < i.p ? 'disabled' : ''}>Koop 🪙 ${i.p}</button>`;
      return `<div class="box"><div class="em">${i.e}</div><div><small>${i.n}</small></div>${btn}</div>`;
    };
    shell(`${stageHTML()}<div class="row" style="justify-content:space-between"><b>Winkeltje</b><span class="chip" id="hd-coins"></span></div>
      <p><small>Accessoires</small></p><div class="hd-shop">${SHOP.filter((i) => i.slot !== 'bg').map(card).join('')}</div>
      <p><small>Achtergronden</small></p><div class="hd-shop">${SHOP.filter((i) => i.slot === 'bg').map(card).join('')}</div>
      <p><button id="hd-sback" style="width:100%">Terug naar ${esc(state.name)}</button></p>`);
    $('#hd-sback').onclick = () => { screen = 'main'; render(); };
    view.querySelectorAll('[data-b]').forEach((b) => { b.onclick = () => {
      const i = ITEM[b.dataset.b]; if (!i || state.owned.includes(i.id) || state.coins < i.p) return;
      state.coins -= i.p; state.owned.push(i.id); changed(); wear(i); renderShop(); speak('Oooh, dankjewel! 🎁');
    }; });
    view.querySelectorAll('[data-w]').forEach((b) => { b.onclick = () => { wear(ITEM[b.dataset.w]); renderShop(); }; });
    paint(true);
  }
  function wear(i) {
    if (i.slot === 'bg') state.bg = state.bg === i.id ? '' : i.id;
    else if (state.worn.includes(i.id)) state.worn = state.worn.filter((x) => x !== i.id);
    else state.worn = [...state.worn.filter((x) => ITEM[x].slot !== i.slot), i.id];
    changed();
  }

  /* ---------- vrienden ---------- */
  async function renderFriends() {
    shell(`<div class="box center"><p><small>Bezoek de huisdieren van de anderen. Kijken mag, kietelen niet. 😄</small></p><button class="pri" id="hd-visit">Bezoek andermans huisdier 🏡</button></div><div id="hd-fl"></div>`);
    $('#hd-visit').onclick = loadFriends;
    if (visitInfo) fillFriends(visitInfo);
  }
  async function loadFriends() {
    const fl = $('#hd-fl'); fl.innerHTML = '<p class="center"><small>Even kijken wie er thuis is…</small></p>';
    try {
      const snap = await getDocs(collection(db, 'pets'));
      if (!alive || tab !== 'vrienden') return;
      const now = Date.now();
      visitInfo = snap.docs.filter((d) => d.id !== me.uid).map((d) => { const p = parsePet((d.data() || {}).data); return p ? decay(p, now) : null; }).filter(Boolean);
      fillFriends(visitInfo);
    } catch (e) { console.error(e); const f = $('#hd-fl'); if (f) f.innerHTML = '<p class="err">Het lukte niet om de huisdieren te laden.</p>'; }
  }
  function fillFriends(list) {
    const fl = $('#hd-fl'); if (!fl) return;
    if (!list.length) { fl.innerHTML = '<p class="center"><small>Er zijn nog geen andere huisdieren. 🐾</small></p>'; return; }
    fl.innerHTML = list.map((p, n) => {
      const m = moodOf(p);
      return `<div class="box hd-friend" style="background:${bgCss(p)}"><div data-p="${n}">${petHTML(p, m)}</div><div style="flex:1"><b>${esc(p.name)}</b><br><small>${TYPE_NL[p.type]} · ${MOOD_NL[m]}</small><br><small>${p.worn.map((i) => ITEM[i].e).join(' ') || 'geen accessoires'}</small><br><i><small>${SAY[m][0]}</small></i><div><button data-hug="${n}" style="margin-top:6px">Geef een knuffel 🤗</button></div></div></div>`;
    }).join('');
    fl.querySelectorAll('[data-hug]').forEach((b) => { b.onclick = () => {
      const pet = fl.querySelector(`[data-p="${b.dataset.hug}"] .hd-pet`); if (!pet) return;
      pet.classList.remove('hd-hug'); void pet.offsetWidth; pet.classList.add('hd-hug');
      const h = document.createElement('span'); h.className = 'hd-mood'; h.textContent = '🤗💛'; pet.appendChild(h);
      const t = setTimeout(() => { timers.delete(t); h.remove(); pet.classList.remove('hd-hug'); }, 2200); timers.add(t);
    }; });
  }

  /* ---------- start ---------- */
  view.innerHTML = '<p class="center"><small>Laden…</small></p>';
  await load();
  if (!alive) return;
  render();
  // zachte waardeverandering + cooldown-labels
  let lastTick = Date.now();
  timer(() => {
    if (!state) return;
    const now = Date.now();
    if (now - lastTick >= 20000) { state = decay(state, now); lastTick = now; changed(); }
    if (sleepUntil && now >= sleepUntil) { sleepUntil = 0; lastMood = ''; speak('Lekker geslapen! ☀️'); }
    if (tab === 'jij' && screen !== 'game') paint();
  }, 1000);
}
