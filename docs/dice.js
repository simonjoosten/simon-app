// Dobbel & kies: echte 3D-dobbelstenen (d4 t/m d20 en d100), 3D-munten, draaiwiel, vier spellen
// (Yathzee, Slangen en ladders, Boter-kaas-en-eieren, Varkentje), geschiedenis met statistiek en handige hulpjes.
// Geometrie en rendering: dice-3d.js; spelregels: dice-games.js; bord: dice-board.js.

import { createDie, DIE_COLORS, DIE_TYPES } from './dice-3d.js?v=1';
import * as G from './dice-games.js?v=2';
import { R4_GAMES, isR4Game, mountR4 } from './creatief-r4-dice.js?v=1';
import { drawBoard, TOKENS, cellCenter } from './dice-board.js?v=1';
import { newAudio, makeNoise } from './music-synth.js?v=2';
import { Settings } from './gfx/settings.js?v=1';
import { styleTag, gearHtml, wireGear, worldSelectHtml, hero, icon, GFX, Themes, playScene, copyText } from './apps3-ui.js?v=1';

const buzz = (ms = 25) => { try { navigator.vibrate && navigator.vibrate(ms); } catch { /* stil */ } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CSS = `<style>
.dc-table{border-radius:18px;padding:calc(.8rem*var(--s));background:var(--world-grad,linear-gradient(#065f46,#064e3b));color:var(--world-text,#fff);position:relative;overflow:hidden;box-shadow:inset 0 0 40px #0005}
.dc-dice{display:flex;flex-wrap:wrap;gap:.3rem;justify-content:center;min-height:calc(130px*var(--s))}
.d3{width:calc(118px*var(--s));height:calc(118px*var(--s));touch-action:manipulation;cursor:pointer;border-radius:16px}
.d3.off{opacity:.4}.d3.lock{outline:3px dashed #fbbf24;outline-offset:-4px;background:#fbbf2422}
.dc-big{font-size:calc(2rem*var(--f));font-weight:900;text-align:center;text-shadow:0 2px 6px #0007}
.dc-sw{display:flex;gap:.35rem;flex-wrap:wrap}
.dc-sw button{width:calc(40px*var(--s));height:calc(40px*var(--s));min-height:0;border-radius:50%;padding:0;border:3px solid #fff8}
.dc-sw button.on{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent)}
.dc-row{display:flex;gap:.4rem;flex-wrap:wrap;align-items:center;margin:.4rem 0}
.dc-bar{display:flex;align-items:flex-end;gap:3px;height:80px}
.dc-bar i{flex:1;background:var(--accent);border-radius:4px 4px 0 0;min-height:2px}
.dc-coin{perspective:700px;width:calc(120px*var(--s));height:calc(120px*var(--s));margin:.4rem}
.dc-coin .c3{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform 1.5s cubic-bezier(.2,.7,.2,1)}
.dc-coin.hop{animation:dc-hop 1.5s ease-out}
@keyframes dc-hop{0%{translate:0 0;scale:1}40%{translate:0 -70px;scale:1.35}100%{translate:0 0;scale:1}}
.dc-coin .e,.dc-coin .f{position:absolute;inset:0;border-radius:50%}
.dc-coin .e{background:#a16207}
.dc-coin .f{backface-visibility:hidden;-webkit-backface-visibility:hidden;background:radial-gradient(circle at 30% 30%,#fef08a,#d4a017 70%);border:5px solid #b8860b;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;color:#5b4400;font-size:.9rem}
.dc-coin .f.fr{transform:translateZ(7px)}.dc-coin .f.bk{transform:rotateY(180deg) translateZ(7px)}
html[data-reduce="1"] .dc-coin .c3{transition:none}html[data-reduce="1"] .dc-coin.hop{animation:none}
.dc-games{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(150px*var(--s)),1fr));gap:.6rem}
.dc-games button{flex-direction:column;padding:.8rem;font-weight:800;line-height:1.2;text-align:center}
.dc-sheet{width:100%;border-collapse:collapse;font-size:calc(.9rem*var(--f))}
.dc-sheet td,.dc-sheet th{padding:.2rem .35rem;border-bottom:1px solid var(--line);text-align:center}
.dc-sheet td:first-child{text-align:left}
.dc-sheet button{min-height:calc(34px*var(--s));padding:0 .4rem;background:color-mix(in srgb,var(--accent) 15%,transparent)}
.dc-sheet .cur{background:color-mix(in srgb,var(--accent) 12%,transparent)}
.dc-ttt{display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem;max-width:calc(360px*var(--s));margin:.5rem auto}
.dc-ttt button{aspect-ratio:1;font-size:calc(3rem*var(--f));font-weight:900;min-height:calc(80px*var(--s))}
.dc-ttt button.w{background:#fde68a;color:#111}
.dc-cv{width:100%;max-width:520px;display:block;margin:.4rem auto;border-radius:14px;touch-action:manipulation}
.dc-wheel{max-width:460px}
.dc-ball{width:calc(150px*var(--s));height:calc(150px*var(--s));border-radius:50%;background:radial-gradient(circle at 35% 30%,#555,#000 70%);color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:800;margin:.5rem auto;padding:1rem;font-size:.9rem;box-shadow:0 8px 18px #0005}
</style>`;

export function diceView(ctx) {
  const { view, esc, addCleanup } = ctx;
  const KEY = 'dice:v2', BKEY = 'dice:best', CKEY = 'dice:coin', WKEY = 'dice:wheel';
  const rd = (k, d) => { try { const o = JSON.parse(localStorage.getItem(k) || 'null'); return o == null ? d : o; } catch { return d; } };
  const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* stil */ } };
  const saved = rd(KEY, {}) || {};
  const pool = { sides: G.SIDES.includes(saved.sides) ? saved.sides : 6, count: Math.max(1, Math.min(6, saved.count | 0 || 2)), color: saved.color || 'rood', mod: saved.mod | 0, adv: ['geen', 'voordeel', 'nadeel'].includes(saved.adv) ? saved.adv : 'geen' };
  let history = G.cleanHistory(saved.history), tab = 'dice', alive = true, ac = null, nbuf = null, rolling = false, shown = null, locked = new Set(), lastRes = null;
  let heroCtl = null, dice = [], gm = null, coinState = rd(CKEY, { kop: 0, munt: 0 }), coinDeg = [], coinRes = null, wheel = { items: null, angle: 0, spinning: false, res: null }, handig = { ball: '', ints: '', teams: '', order: '' };
  const timers = []; let token = 0;
  const $ = (s) => view.querySelector(s);
  const save = () => wr(KEY, { ...pool, history: history.slice(0, 100) });
  const colorOf = () => (DIE_COLORS.find((c) => c.id === pool.color) || DIE_COLORS[0]).c;
  const say = (t) => { const e = $('#dc-msg'); if (e) e.textContent = t || ''; };

  addCleanup(() => { alive = false; token++; disposeDice(); timers.forEach(clearTimeout); try { heroCtl && heroCtl.dispose(); } catch { /* stil */ } try { ac && ac.close && ac.close().catch(() => {}); } catch { /* stil */ } ac = null; window.removeEventListener('keydown', onKey); });

  // ----- geluid -----
  function audio() { if (!ac) { try { ac = newAudio(); if (ac) nbuf = makeNoise(ac); } catch { ac = null; } } if (ac && ac.state === 'suspended') { try { ac.resume().catch(() => {}); } catch { /* stil */ } } return ac; }
  function sfx(kind) {
    if (!Settings.get().sound) return; const c = audio(); if (!c) return; const t0 = c.currentTime + 0.01;
    const noise = (t, f, vol, dur) => { const s = c.createBufferSource(); s.buffer = nbuf; const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = 1.2; const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(b); b.connect(g); g.connect(c.destination); s.start(t); s.stop(t + dur + 0.02); };
    const tone = (t, f, vol, dur, type = 'sine') => { const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02); };
    try {
      if (kind === 'roll') { let t = t0; for (let i = 0; i < 9; i++) { noise(t, 1500 + Math.random() * 1800, 0.3 * (1 - i / 11), 0.04); t += 0.045 + i * 0.012; } noise(t, 900, 0.25, 0.08); }
      else if (kind === 'tick') tone(t0, 1300, 0.12, 0.03, 'square');
      else if (kind === 'win') [523, 659, 784, 1047].forEach((f, i) => tone(t0 + i * 0.1, f, 0.2, 0.3));
      else if (kind === 'coin') { tone(t0, 2400, 0.18, 0.5); tone(t0 + 0.05, 3100, 0.1, 0.4); }
      else if (kind === 'pop') tone(t0, 500, 0.15, 0.08, 'triangle');
      else if (kind === 'bad') tone(t0, 180, 0.25, 0.3, 'sawtooth');
    } catch { /* stil */ }
  }

  // ----- stenen op het scherm -----
  function disposeDice() { dice.forEach((d) => d.dispose()); dice = []; }
  function mkDice(sel, specs) { // specs: [{sides,color,value,label,pips,highlight}] voor canvassen met class d3 binnen sel
    disposeDice(); const cvs = [...view.querySelectorAll(sel)];
    cvs.forEach((cv, i) => { const s = specs[i]; if (!s) return; dice.push(createDie(cv, { dpr: GFX.dpr, q: GFX.q, ...s })); });
    return dice;
  }
  const rollAll = (list, values, dur = 1000) => { if (GFX.reduce) { list.forEach((d, i) => d && d.show(values[i])); return Promise.resolve(); } return Promise.all(list.map((d, i) => (d ? d.roll(values[i], dur + i * 110) : null))); };
  const d100Parts = (v) => { const r = v % 100; return [Math.floor(r / 10) + 1, (r % 10) || 10]; };   // tientallen- en eenhedensteen
  const tensLabel = (v) => String((v - 1) * 10).padStart(2, '0'), onesLabel = (v) => String(v % 10);
  function layout() { // wat staat er op tafel?
    const n = pool.sides === 100 ? pool.count * 2 : (pool.adv !== 'geen' && pool.count === 1 ? 2 : pool.count);
    return { n, normal: pool.sides !== 100 && !(pool.adv !== 'geen' && pool.count === 1) };
  }
  function faceValues(res) { // waarden voor de canvassen
    if (pool.sides === 100) return res.kept.flatMap((v) => d100Parts(v));
    return res.vals;
  }

  // ----- opbouw -----
  function build() {
    view.innerHTML = `${styleTag()}${CSS}<div class="ap" id="dc"><div id="dc-hero"></div>
      <div class="tabs2" id="dc-tabs">${[['dice', '🎲 Dobbel'], ['coin', '🪙 Munt'], ['wheel', '🎡 Wiel'], ['games', '🎮 Spellen'], ['tools', '🧰 Handig']].map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div id="dc-body"></div><div class="msg" id="dc-msg"></div></div>`;
    heroCtl = hero($('#dc-hero'), { gameId: 'dobbel', height: 96, title: `${icon('dice', { size: 30 })} Dobbel &amp; kies`, rightHtml: `${worldSelectHtml('dobbel')}${gearHtml()}` });
    $('#ap-world').onchange = (e) => { heroCtl.setWorld(e.target.value); applyWorld(); };
    wireGear(view, say);
    $('#dc-tabs').onclick = (e) => { const b = e.target.closest('[data-tab]'); if (!b) return; tab = b.dataset.tab; if (tab !== 'games') { gm = null; token++; } $('#dc-tabs').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); render(); };
    wire(); render();
  }
  function applyWorld() { const w = heroCtl.world, vars = Themes.cssVars(w); view.querySelectorAll('.dc-table').forEach((el) => Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v))); }
  function render() {
    disposeDice(); token++;
    const el = $('#dc-body'); say('');
    el.innerHTML = tab === 'dice' ? diceHtml() : tab === 'coin' ? coinHtml() : tab === 'wheel' ? wheelHtml() : tab === 'games' ? gamesHtml() : toolsHtml();
    if (tab === 'dice') afterDice(); else if (tab === 'wheel') afterWheel(); else if (tab === 'games') afterGames();
    applyWorld();
  }

  // ===== Dobbel =====
  function diceHtml() {
    const L = layout(), st = G.rollStats(history, pool.sides);
    return `<div class="card"><div class="dc-row">${G.SIDES.map((s) => `<button data-act="sides" data-v="${s}" class="${s === pool.sides ? 'on' : ''}">d${s}</button>`).join('')}</div>
      <div class="dc-row"><span>Aantal</span>${[1, 2, 3, 4, 5, 6].map((n) => `<button data-act="count" data-v="${n}" class="${n === pool.count ? 'on' : ''}" style="min-width:calc(46px*var(--s))">${n}</button>`).join('')}</div>
      <div class="dc-row"><span>Kleur</span><div class="dc-sw">${DIE_COLORS.map((c) => `<button data-act="color" data-v="${c.id}" aria-label="${c.name}" class="${c.id === pool.color ? 'on' : ''}" style="background:${c.c}"></button>`).join('')}</div></div>
      <div class="dc-row"><span>Erbij/eraf</span><button data-act="mod" data-v="-1">−</button><b style="min-width:2.5rem;text-align:center">${pool.mod > 0 ? '+' : ''}${pool.mod}</b><button data-act="mod" data-v="1">+</button>
        <select id="dc-adv" aria-label="Voordeel of nadeel" ${pool.count === 1 && pool.sides !== 100 ? '' : 'disabled'}><option value="geen"${pool.adv === 'geen' ? ' selected' : ''}>Gewone worp</option><option value="voordeel"${pool.adv === 'voordeel' ? ' selected' : ''}>Voordeel (2×, hoogste)</option><option value="nadeel"${pool.adv === 'nadeel' ? ' selected' : ''}>Nadeel (2×, laagste)</option></select>
        <button data-act="sound" class="${Settings.get().sound ? 'on' : ''}" aria-label="Geluid">${Settings.get().sound ? '🔊' : '🔇'}</button></div></div>
      <div class="dc-table"><div class="dc-dice" id="dc-dice">${Array.from({ length: L.n }, (_, i) => `<canvas class="d3" data-i="${i}"></canvas>`).join('')}</div>
        <div class="dc-big" id="dc-total">&nbsp;</div><div style="text-align:center;min-height:1.6rem;font-weight:700" id="dc-detail"></div>
        <div style="text-align:center;margin-top:.5rem"><button class="on" data-act="roll" id="dc-roll" style="font-size:1.3rem;padding:.6rem 2.4rem">${icon('dice', { size: 30 })} Gooi!</button></div>
        <div style="text-align:center;font-size:.8rem;opacity:.8;margin-top:.3rem">${L.normal && pool.count > 1 ? 'Tik op een steen om hem vast te houden. ' : ''}Spatiebalk = gooien</div></div>
      <div class="card"><b>Laatste worpen</b> ${history.length ? '<button data-act="clearhist" style="float:right;min-height:34px">Wis</button>' : ''}${history.length ? history.slice(0, 8).map((h) => `<div class="dc-row" style="margin:.15rem 0"><span style="flex:1">${h.k.length}×d${h.s}: ${h.k.join(' + ')}${h.m ? ` (${h.m > 0 ? '+' : ''}${h.m})` : ''}</span><b>${h.k.reduce((a, b) => a + b, 0) + h.m}</b></div>`).join('') : '<br><small class="mute">Nog niets gegooid.</small>'}</div>
      <div class="card"><b>Statistiek d${pool.sides}</b> <small class="mute">(${st.n} stenen, gemiddeld ${st.n ? st.avg.toFixed(1) : '–'})</small>
        <div class="dc-bar" style="margin-top:.5rem">${st.counts.map((c) => `<i title="${c}×" style="height:${Math.round(c / st.max * 100)}%"></i>`).join('')}</div>
        <div class="dc-bar" style="height:auto;font-size:.65rem;color:var(--mute)">${st.counts.map((_, i) => `<span style="flex:1;text-align:center">${pool.sides === 100 ? i * 10 + 1 : i + 1}</span>`).join('')}</div></div>`;
  }
  function afterDice() {
    const L = layout(), col = colorOf(), vals = shown && shown.length === L.n ? shown : null;
    const specs = Array.from({ length: L.n }, (_, i) => {
      if (pool.sides === 100) return { sides: 10, color: col, value: vals ? vals[i] : 1, label: i % 2 ? onesLabel : tensLabel };
      return { sides: pool.sides, color: col, value: vals ? vals[i] : pool.sides, pips: true };
    });
    mkDice('#dc-dice .d3', specs);
    if (lastRes && vals) showResult(lastRes, false);
    view.querySelectorAll('#dc-dice .d3').forEach((cv, i) => { if (locked.has(i)) cv.classList.add('lock'); });
  }
  function showResult(res, fresh) {
    const t = $('#dc-total'), d = $('#dc-detail'); if (!t) return;
    t.textContent = `Totaal: ${res.total}`;
    const parts = res.sides === 100 ? res.kept.join(' + ') : res.kept.join(' + ');
    d.textContent = (res.vals.length > res.kept.length ? `${pool.adv === 'voordeel' ? 'Voordeel' : 'Nadeel'}: ${res.vals.join(' en ')} → ${res.kept[0]}` : parts) + (res.mod ? ` ${res.mod > 0 ? '+' : '−'} ${Math.abs(res.mod)}` : '') + (res.crit === 'nat20' ? '  🎉 NATUURLIJKE 20!' : res.crit === 'nat1' ? '  😬 Oei, een 1!' : '');
    if (res.vals.length > res.kept.length) { const keepIdx = res.vals.indexOf(res.kept[0]); view.querySelectorAll('#dc-dice .d3').forEach((cv, i) => cv.classList.toggle('off', i !== keepIdx)); }
    if (fresh && res.crit === 'nat20') { sfx('win'); if (heroCtl) heroCtl.burst(160, 60, { kind: 'coins', n: 14 }); playScene(view, 'chest-open', { title: 'Natuurlijke 20!' }); }
    else if (fresh && res.crit === 'nat1') sfx('bad');
  }
  async function doRoll() {
    if (rolling || tab !== 'dice') return; rolling = true; const my = token, btn = $('#dc-roll'); if (btn) btn.disabled = true; buzz(40); sfx('roll');
    const L = layout(); let res;
    if (L.normal && locked.size && shown && shown.length === L.n) { const vals = shown.map((v, i) => (locked.has(i) ? v : G.rollOne(pool.sides))); res = { sides: pool.sides, vals, kept: vals, mod: pool.mod, total: vals.reduce((a, b) => a + b, 0) + pool.mod, crit: null }; }
    else { locked.clear(); res = G.rollPool(pool); }
    const vals = faceValues(res); view.querySelectorAll('#dc-dice .d3').forEach((cv) => cv.classList.remove('off'));
    const t = $('#dc-total'); if (t) t.innerHTML = '&nbsp;'; const dd = $('#dc-detail'); if (dd) dd.textContent = '';
    await rollAll(dice.map((d, i) => (L.normal && locked.has(i) ? null : d)), vals, 1000);
    if (!alive || my !== token) { rolling = false; return; }
    shown = vals; lastRes = res; history.unshift({ s: res.sides, k: res.kept, m: res.mod, t: Date.now() }); history = history.slice(0, 100); save(); buzz(20);
    rolling = false; showResult(res, true); const b2 = $('#dc-roll'); if (b2) b2.disabled = false;
    // geschiedenis en statistiek verversen zonder de stenen te onderbreken
    const keep = shown, keepRes = lastRes; render(); shown = keep; lastRes = keepRes; afterDiceRestore();
  }
  function afterDiceRestore() { /* render() heeft de stenen opnieuw getekend met shown/lastRes */ }

  // ===== Munt =====
  function coinHtml() {
    const n = coinState.n || 1;
    return `<div class="card"><div class="dc-row"><span>Aantal munten</span>${[1, 2, 3, 4, 5].map((k) => `<button data-act="coins" data-v="${k}" class="${k === n ? 'on' : ''}">${k}</button>`).join('')}</div></div>
      <div class="dc-table" style="text-align:center"><div style="display:flex;flex-wrap:wrap;justify-content:center;min-height:calc(140px*var(--s))" id="dc-coins">${Array.from({ length: n }, (_, i) => `<div class="dc-coin" data-i="${i}"><div class="c3" style="transform:rotateX(18deg) rotateY(${coinDeg[i] || 0}deg)">${[-6, -4, -2, 0, 2, 4, 6].map((z) => `<div class="e" style="transform:translateZ(${z}px)"></div>`).join('')}
        <div class="f fr">${icon('crown', { size: 46 })}KOP</div><div class="f bk">${icon('star', { size: 46 })}MUNT</div></div></div>`).join('')}</div>
        <div class="dc-big" id="dc-ct">&nbsp;</div>
        <button class="on" data-act="flip" id="dc-flip" style="font-size:1.3rem;padding:.6rem 2.4rem">${icon('coin', { size: 30 })} Gooi de munt</button></div>
      <div class="card"><b>Tot nu toe</b><div class="dc-row"><span style="flex:1">${icon('crown', { size: 22 })} Kop: <b>${coinState.kop}</b></span><span style="flex:1">${icon('star', { size: 22 })} Munt: <b>${coinState.munt}</b></span><button data-act="coinreset">Wis</button></div>
        <small class="mute">Elke worp is helemaal eerlijk.</small></div>`;
  }
  async function doFlip() {
    if (rolling) return; rolling = true; const n = coinState.n || 1, my = token; buzz(40); sfx('coin');
    const res = Array.from({ length: n }, () => (G.rand(2) ? 'kop' : 'munt'));
    const wraps = [...view.querySelectorAll('.dc-coin')]; wraps.forEach((w, i) => {
      const c3 = w.querySelector('.c3'), cur = coinDeg[i] || 0, want = res[i] === 'kop' ? 0 : 180; let nd = cur + 1080 + ((want - (cur % 360) + 360) % 360); nd += (i % 2 ? 360 : 0);
      coinDeg[i] = nd; w.classList.remove('hop'); void w.offsetWidth; w.classList.add('hop'); c3.style.transitionDuration = (1.3 + i * 0.12) + 's'; c3.style.transform = `rotateX(18deg) rotateY(${nd}deg)`;
    });
    await sleep(GFX.reduce ? 50 : 1600 + n * 120); if (!alive || my !== token) { rolling = false; return; }
    res.forEach((r) => { coinState[r === 'kop' ? 'kop' : 'munt']++; }); wr(CKEY, coinState); buzz(20); rolling = false;
    const k = res.filter((r) => r === 'kop').length, txt = n === 1 ? res[0].toUpperCase() + '!' : `${k}× kop, ${n - k}× munt`;
    render(); const t = $('#dc-ct'); if (t) t.textContent = txt;
  }

  // ===== Wiel =====
  function wheelItems() { if (!wheel.items) { const s = rd(WKEY, null); wheel.items = Array.isArray(s) && s.length ? s.slice(0, 40).map(String) : G.WHEEL_PRESETS['Wat eten we?'].slice(); } return wheel.items; }
  function wheelHtml() {
    return `<div class="card"><canvas id="dc-wc" class="dc-cv dc-wheel" style="aspect-ratio:1"></canvas>
      <div class="dc-big" id="dc-wres" style="color:inherit;text-shadow:none;min-height:2.4rem">&nbsp;</div>
      <div style="text-align:center"><button class="on" data-act="spin" id="dc-spin" style="font-size:1.3rem;padding:.6rem 2.4rem">${icon('target', { size: 30 })} Draai!</button> <button data-act="wremove" id="dc-wrem" style="display:none">Haal dit item weg</button></div></div>
      <div class="card"><b>Wat staat er op het wiel?</b> <small class="mute">(één per regel)</small>
        <div class="dc-row">${Object.keys(G.WHEEL_PRESETS).map((k) => `<button data-act="wpreset" data-k="${esc(k)}">${esc(k)}</button>`).join('')}</div>
        <textarea id="dc-witems" rows="6" spellcheck="false">${esc(wheelItems().join('\n'))}</textarea></div>`;
  }
  function drawWheel() {
    const cv = $('#dc-wc'); if (!cv) return; const items = wheelItems(), n = Math.max(1, items.length), W = cv.clientWidth || 320, d = GFX.dpr || 1;
    if (cv.width !== Math.round(W * d)) { cv.width = Math.round(W * d); cv.height = Math.round(W * d); }
    const c = cv.getContext('2d'); if (!c) return; c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, W, W);
    const cx = W / 2, cy = W / 2, R = W * 0.46, seg = Math.PI * 2 / n;
    if (GFX.q) { c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(cx, cy + R * 0.06, R * 1.03, R * 1.0, 0, 0, Math.PI * 2); c.fill(); }
    items.forEach((it, i) => {
      const a0 = wheel.angle + i * seg, a1 = a0 + seg, hl = wheel.res === i && !wheel.spinning;
      c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R, a0, a1); c.closePath(); c.fillStyle = `hsl(${(i * 360 / n + 10) % 360} ${hl ? 95 : 75}% ${hl ? 62 : 55}%)`; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
      c.save(); c.translate(cx, cy); c.rotate(a0 + seg / 2); c.fillStyle = '#fff'; c.textAlign = 'right'; c.textBaseline = 'middle'; c.font = `800 ${Math.max(11, Math.min(22, R * 0.9 * Math.min(seg, 0.8) / 2.2))}px system-ui,sans-serif`; c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = GFX.q ? 3 : 0;
      const txt = it.length > 16 ? it.slice(0, 15) + '…' : it; c.fillText(txt, R - 12, 0); c.restore();
    });
    c.beginPath(); c.arc(cx, cy, R * 0.12, 0, Math.PI * 2); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#6366f1'; c.lineWidth = 4; c.stroke();
    c.fillStyle = '#ef4444'; c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, cy - R - 6 + 22); c.lineTo(cx - 14, cy - R - 20); c.lineTo(cx + 14, cy - R - 20); c.closePath(); c.fill(); c.stroke();
  }
  function afterWheel() { drawWheel(); }
  async function doSpin() {
    const items = wheelItems(); if (items.length < 2 || wheel.spinning) { say('Zet minstens twee dingen op het wiel.'); return; }
    wheel.spinning = true; wheel.res = null; const my = token, i = G.rand(items.length), from = wheel.angle, target = G.wheelTarget(from, i, items.length, 0.15 + G.rand(70) / 100, 5), dur = GFX.reduce ? 200 : 4300, t0 = performance.now();
    const btn = $('#dc-spin'); if (btn) btn.disabled = true; const rem = $('#dc-wrem'); if (rem) rem.style.display = 'none'; const rs = $('#dc-wres'); if (rs) rs.innerHTML = '&nbsp;';
    let lastIdx = G.wheelIndex(from, items.length);
    await new Promise((res) => { const step = (ts) => { if (!alive || my !== token) return res(); const k = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - k, 4); wheel.angle = from + (target - from) * e; const idx = G.wheelIndex(wheel.angle, items.length); if (idx !== lastIdx) { lastIdx = idx; sfx('tick'); } drawWheel(); if (k < 1) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
    if (!alive || my !== token) { wheel.spinning = false; return; }
    wheel.spinning = false; wheel.res = i; drawWheel(); sfx('win'); buzz(30);
    const r2 = $('#dc-wres'); if (r2) r2.textContent = '🎉 ' + items[i]; const b2 = $('#dc-spin'); if (b2) b2.disabled = false; const rm = $('#dc-wrem'); if (rm && items.length > 2) rm.style.display = '';
    if (heroCtl) heroCtl.burst(150, 70, { kind: 'confetti', n: 22 });
  }

  // ===== Spellen =====
  function gamesHtml() {
    if (!gm) return `<div class="card"><b>Kies een spel</b><div class="dc-games" style="margin-top:.5rem">
      <button data-act="game" data-g="y">${icon('dice', { size: 54 })}Yathzee<small class="mute">5 dobbelstenen, 13 rondes</small></button>
      <button data-act="game" data-g="sl">${icon('rocket', { size: 54 })}Slangen &amp; ladders<small class="mute">Wie is het eerst op 100?</small></button>
      <button data-act="game" data-g="tt">${icon('target', { size: 54 })}Boter, kaas en eieren<small class="mute">Tegen de computer</small></button>
      <button data-act="game" data-g="pig">${icon('bomb', { size: 54 })}Varkentje<small class="mute">Durf jij door te gooien?</small></button>
      ${Object.entries(R4_GAMES).map(([k, v]) => `<button data-act="game" data-g="${k}">${icon(v.icon, { size: 54 })}${v.title}<small class="mute">${v.sub}</small></button>`).join('')}</div></div>`;
    return `<div class="card"><button data-act="gmenu">← Spellen</button> <b id="gm-title"></b></div><div id="gm-body"></div>`;
  }
  function afterGames() { if (gm) gameRender(); }
  const gameStart = (g) => { gm = { g, setup: true }; token++; render(); };

  function gameRender() {
    const t = $('#gm-title'), body = $('#gm-body'); if (!body) return; disposeDice(); const my = token;
    if (gm.g === 'y') { t.textContent = 'Yathzee'; yRender(body, my); }
    else if (gm.g === 'sl') { t.textContent = 'Slangen en ladders'; slRender(body, my); }
    else if (gm.g === 'tt') { t.textContent = 'Boter, kaas en eieren'; ttRender(body); }
    else if (gm.g === 'pig') { t.textContent = 'Varkentje'; pigRender(body, my); }
    else if (isR4Game(gm.g)) { t.textContent = R4_GAMES[gm.g].title; r4Mount(body); }
  }
  const R4KEY = 'dice:r4';
  function r4Mount(body) {
    const store = { get: (k) => (rd(R4KEY, {}) || {})[k], set: (k, v) => { const o = rd(R4KEY, {}) || {}; o[k] = v; wr(R4KEY, o); } };
    mountR4(gm.g, { body, esc, icon, rand: G.rand, mkDice, rollAll, dice: () => dice, colorOf, sfx, say, playScene: (n, o) => playScene(view, n, o), token: () => token, sleep, store, state: (k, init) => { gm.r4 = gm.r4 || {}; if (!gm.r4[k]) gm.r4[k] = init(); return gm.r4[k]; } });
  }
  const setupHtml = (opts) => `<div class="card"><b>Met hoeveel spelers?</b><div class="dc-games" style="margin-top:.5rem">${opts.map(([k, l]) => `<button data-act="gsetup" data-v="${k}">${l}</button>`).join('')}</div></div>`;

  // --- Yathzee ---
  function yRender(body, my) {
    if (gm.setup) { body.innerHTML = setupHtml([['solo', '1 speler<br><small>oefenen</small>'], ['cpu', 'Tegen de computer'], ['p2', '2 spelers'], ['p3', '3 spelers']]); return; }
    const g = gm.y, cur = g.players[g.turn], human = !cur.ai, over = g.done;
    const pot = human && g.rolls > 0 && !over ? G.potentials(cur.sheet, g.dice) : {};
    const rows = G.CATS.map((c) => `<tr><td>${c.name}${c.hint ? `<br><small class="mute">${c.hint}</small>` : ''}</td>${g.players.map((p, pi) => `<td class="${pi === g.turn && !over ? 'cur' : ''}">${p.sheet[c.id] != null ? p.sheet[c.id] : (pi === g.turn && human && c.id in pot ? `<button data-act="yscore" data-id="${c.id}">${pot[c.id]}</button>` : '')}</td>`).join('')}</tr>${c.id === '6' ? `<tr><td><small>Bonus (35 bij 63+)</small></td>${g.players.map((p) => `<td><small>${G.upperSum(p.sheet)}/63 ${G.bonusOf(p.sheet) ? '+35' : ''}</small></td>`).join('')}</tr>` : ''}`).join('');
    body.innerHTML = `<div class="dc-table"><div style="text-align:center;font-weight:800;min-height:1.5rem">${over ? 'Klaar!' : `${esc(cur.name)} is aan de beurt · worp ${Math.min(3, g.rolls + (g.rolls === 0 ? 1 : 0))}/3`}</div>
      <div class="dc-dice" id="dc-ydice">${[0, 1, 2, 3, 4].map((i) => `<canvas class="d3" data-i="${i}"></canvas>`).join('')}</div>
      <div style="text-align:center">${over ? '' : human ? `<button class="on" data-act="yroll" ${g.rolls >= 3 ? 'disabled' : ''} style="font-size:1.2rem">${icon('dice', { size: 26 })} ${g.rolls === 0 ? 'Gooi' : g.rolls >= 3 ? 'Kies een vak' : 'Gooi opnieuw'}</button><div style="font-size:.8rem;opacity:.85">${g.rolls > 0 && g.rolls < 3 ? 'Tik op stenen om ze vast te houden. ' : ''}${g.rolls > 0 ? 'Tik op een getal in de tabel om te scoren.' : ''}</div>` : '<b>De computer denkt na…</b>'}</div></div>
      <div class="card" style="overflow-x:auto"><table class="dc-sheet"><tr><th></th>${g.players.map((p, pi) => `<th class="${pi === g.turn && !over ? 'cur' : ''}">${esc(p.name)}</th>`).join('')}</tr>${rows}<tr><th>Totaal</th>${g.players.map((p) => `<th>${G.sheetTotal(p.sheet)}</th>`).join('')}</tr></table></div>
      ${over ? yEndHtml(g) : ''}`;
    const specs = g.dice.map((v, i) => ({ sides: 6, color: colorOf(), value: v, pips: true, highlight: g.held[i] && g.rolls > 0 && g.rolls < 3 }));
    mkDice('#dc-ydice .d3', specs);
    view.querySelectorAll('#dc-ydice .d3').forEach((cv, i) => { cv.classList.toggle('lock', !!g.held[i] && g.rolls > 0 && g.rolls < 3); });
    if (!over && cur.ai && !gm.busy) yAi(my);
  }
  function yEndHtml(g) {
    const w = G.yWinner(g), names = w.winners.map((i) => g.players[i].name).join(' en ');
    return `<div class="card" style="text-align:center"><div class="dc-big" style="color:inherit;text-shadow:none">${g.players.length === 1 ? `Je score: ${w.totals[0]}` : w.winners.length > 1 ? `Gelijkspel!` : `${esc(names)} wint!`}</div>
      ${gm.best ? `<div>🏆 Nieuw record: ${gm.best}!</div>` : ''}<button class="on" data-act="gagain" style="margin-top:.5rem">Nog een keer</button></div>`;
  }
  async function yRollAnim(my) {
    const g = gm.y; if (!G.yRoll(g)) return false; sfx('roll'); buzz(30);
    const held = g.held.slice(); await rollAll(dice.map((d, i) => (held[i] && g.rolls > 1 ? null : d)), g.dice, 900);
    return alive && my === token;
  }
  async function yAi(my) {
    gm.busy = true; const g = gm.y, gone = () => my !== token || !gm || gm.y !== g;
    try {
      await sleep(700); if (gone()) return; if (!await yRollAnim(my)) return; if (gone()) return;
      for (let k = 0; k < 2; k++) {
        await sleep(500); if (gone()) return; const h = G.aiHold(g.dice, g.players[g.turn].sheet); h.forEach((v, i) => { g.held[i] = v; }); if (h.every(Boolean)) break;
        yRender($('#gm-body'), my); gm.busy = true; await sleep(450); if (gone()) return; if (!await yRollAnim(my)) return; if (gone()) return;
      }
      await sleep(600); if (gone()) return; yDoScore(G.aiPick(g.dice, g.players[g.turn].sheet), my);
    } finally { if (gm && gm.y === g) gm.busy = false; }
  }
  function yDoScore(id, my) {
    const g = gm.y, who = g.turn, val = G.scoreCat(id, g.dice); if (!G.yScore(g, id)) return;
    sfx(val > 0 ? 'pop' : 'bad'); say(`${g.players[who].name}: ${G.CATS.find((c) => c.id === id).name} = ${val}`);
    if (id === 'yz' && val === 50) { sfx('win'); if (heroCtl) heroCtl.burst(160, 60, { kind: 'coins', n: 16 }); playScene(view, 'coins-rain', { title: 'YATHZEE!' }); }
    if (g.done) {
      const w = G.yWinner(g), humanIdx = g.players.map((p, i) => (p.ai ? -1 : i)).filter((i) => i >= 0), best = rd(BKEY, { y: 0 }), top = Math.max(...humanIdx.map((i) => w.totals[i]));
      if (top > (best.y || 0)) { wr(BKEY, { ...best, y: top }); gm.best = top; if (top > 0) playScene(view, 'new-record', { title: 'Nieuw record!', sub: `${top} punten` }); }
      else if (humanIdx.some((i) => w.winners.includes(i)) && g.players.length > 1) { sfx('win'); playScene(view, 'victory', { title: 'Gewonnen!' }); }
    }
    gameRender();
  }

  // --- Slangen en ladders ---
  function slRender(body, my) {
    if (gm.setup) { body.innerHTML = setupHtml([['cpu', 'Jij tegen de computer'], ['p2', '2 spelers'], ['p3', '3 spelers'], ['p4', '4 spelers']]); return; }
    const s = gm.sl, cur = s.players[s.turn];
    body.innerHTML = `<div class="card"><canvas id="dc-bd" class="dc-cv" style="aspect-ratio:1"></canvas>
      <div class="dc-row" style="justify-content:center"><div class="dc-table" style="padding:.3rem"><canvas class="d3" id="dc-sld" style="width:calc(90px*var(--s));height:calc(90px*var(--s))"></canvas></div>
        <div style="flex:1;min-width:150px"><b>${s.won != null ? `${esc(s.players[s.won].name)} wint! 🎉` : `${esc(cur.name)} is aan de beurt`}</b><br><small class="mute">Een 6 = nog een keer. Je moet precies op 100 landen.</small></div>
        ${s.won != null ? '<button class="on" data-act="gagain">Nog een keer</button>' : `<button class="on" data-act="slroll" ${cur.ai || s.busy ? 'disabled' : ''} style="font-size:1.2rem">${icon('dice', { size: 26 })} Gooi!</button>`}</div></div>`;
    mkDice('#dc-sld', [{ sides: 6, color: colorOf(), value: s.last || 6, pips: true }]);
    slDraw();
    if (s.won == null && cur.ai && !s.busy) slTurn(my);
  }
  function slDraw() { const cv = $('#dc-bd'); if (!cv || !gm || !gm.sl) return; const W = cv.clientWidth || 360, d = GFX.dpr || 1; if (cv.width !== Math.round(W * d)) { cv.width = cv.height = Math.round(W * d); } const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); drawBoard(c, W, gm.sl.players, GFX.q, gm.sl.turn); }
  async function slTurn(my) {
    const s = gm.sl; if (s.busy || s.won != null) return; s.busy = true; const btn = view.querySelector('[data-act=slroll]'); if (btn) btn.disabled = true;
    try {
      if (s.players[s.turn].ai) await sleep(700); if (my !== token) return;
      const r = 1 + G.rand(6); sfx('roll'); buzz(30); s.last = r; await rollAll(dice, [r], 800); if (my !== token) return;
      const p = s.players[s.turn], m = G.moveSL(p.pos, r);
      for (const pos of m.path) { p.pos = pos; sfx('tick'); slDraw(); await sleep(GFX.reduce ? 20 : 170); if (my !== token) return; }
      if (m.jump) { say(m.jump.kind === 'ladder' ? `🪜 ${p.name} klimt de ladder op naar ${m.jump.to}!` : `🐍 Oei! ${p.name} glijdt naar ${m.jump.to}.`); sfx(m.jump.kind === 'ladder' ? 'win' : 'bad'); await sleep(450); p.pos = m.jump.to; slDraw(); await sleep(300); } else say('');
      if (m.won) { s.won = s.turn; sfx('win'); if (heroCtl) heroCtl.burst(160, 60, { kind: 'confetti', n: 24 }); if (!p.ai || s.players.every((q) => q.ai)) playScene(view, 'victory', { title: `${p.name} wint!` }); }
      else if (r !== 6) s.turn = (s.turn + 1) % s.players.length;
    } finally { s.busy = false; if (my === token && gm && gm.sl === s) gameRender(); }
  }

  // --- Boter, kaas en eieren ---
  function ttRender(body) {
    if (gm.setup) { body.innerHTML = `<div class="card"><b>Tegen wie?</b><div class="dc-games" style="margin-top:.5rem"><button data-act="gsetup" data-v="0">Makkelijk<br><small>de computer let niet op</small></button><button data-act="gsetup" data-v="1">Slim<br><small>wint en blokkeert</small></button><button data-act="gsetup" data-v="2">Onverslaanbaar<br><small>lukt het jou?</small></button><button data-act="gsetup" data-v="h">Twee spelers<br><small>om de beurt</small></button></div></div>`; return; }
    const t = gm.tt, res = G.ttResult(t.b);
    body.innerHTML = `<div class="card"><div style="text-align:center;font-weight:800;min-height:1.6rem">${res ? (res.draw ? 'Gelijkspel!' : `${res.winner === 'X' ? 'Speler X' : t.level === 'h' ? 'Speler O' : 'De computer'} wint!`) : `${t.turn === 'X' ? 'Jij (X)' : t.level === 'h' ? 'Speler O' : 'De computer (O)'} is aan de beurt`}</div>
      <div class="dc-ttt">${t.b.map((v, i) => `<button data-act="ttmove" data-i="${i}" class="${res && res.line && res.line.includes(i) ? 'w' : ''}" style="color:${v === 'X' ? '#ef4444' : '#3b82f6'}" ${v || res ? 'disabled' : ''}>${v || '&nbsp;'}</button>`).join('')}</div>
      <div class="dc-row" style="justify-content:center"><span>Stand: jij ${t.score.X} · computer/O ${t.score.O} · gelijk ${t.score.d}</span><button class="on" data-act="ttagain">Nog een keer</button></div></div>`;
  }
  function ttPlay(i) {
    const t = gm.tt; if (t.b[i] || G.ttResult(t.b)) return; t.b[i] = t.turn; sfx('pop'); ttAfter();
    if (!G.ttResult(t.b) && t.level !== 'h' && t.turn === 'O') { setTimeout(() => { if (!alive || !gm || gm.tt !== t) return; t.b[G.ttMove(t.b, 'O', +t.level)] = 'O'; sfx('pop'); ttAfter(); ttRender($('#gm-body')); }, 500); }
    ttRender($('#gm-body'));
  }
  function ttAfter() {
    const t = gm.tt, r = G.ttResult(t.b); if (!r) { t.turn = t.turn === 'X' ? 'O' : 'X'; return; }
    if (r.draw) t.score.d++; else { t.score[r.winner]++; if (r.winner === 'X' || t.level === 'h') { sfx('win'); playScene(view, 'victory', { title: t.level === 'h' ? `${r.winner} wint!` : 'Je wint!' }); } else sfx('bad'); }
  }

  // --- Varkentje ---
  function pigRender(body, my) {
    if (gm.setup) { body.innerHTML = setupHtml([['cpu', 'Tegen de computer'], ['p2', '2 spelers']]); return; }
    const p = gm.pig, cur = p.turn;
    body.innerHTML = `<div class="dc-table"><div class="dc-row" style="justify-content:space-around"><div class="dc-big">${esc(p.names[0])}<br>${p.score[0]}</div><div class="dc-big">${esc(p.names[1])}<br>${p.score[1]}</div></div>
      <div style="text-align:center"><canvas class="d3" id="dc-pd"></canvas></div>
      <div class="dc-big">${p.won != null ? `🎉 ${esc(p.names[p.won])} wint!` : `Deze beurt: ${p.pts}`}</div>
      <div style="text-align:center;min-height:2.5rem">${p.won != null ? '<button class="on" data-act="gagain">Nog een keer</button>' : (p.ai[cur] ? '<b>De computer speelt…</b>' : `<button class="on" data-act="pigroll" ${p.busy ? 'disabled' : ''}>${icon('dice', { size: 26 })} Gooi</button> <button data-act="pighold" ${p.pts === 0 || p.busy ? 'disabled' : ''}>Houd vast (+${p.pts})</button>`)}</div>
      <div style="text-align:center;font-size:.85rem;opacity:.85">Gooi zo vaak je durft en tel alles op. Gooi je een 1, dan ben je alles van deze beurt kwijt! Eerst op 100 wint.</div></div>`;
    mkDice('#dc-pd', [{ sides: 6, color: colorOf(), value: p.last || 6, pips: true }]);
    if (p.won == null && p.ai[cur] && !p.busy) pigAi(my);
  }
  async function pigRoll(my) {
    const p = gm.pig; if (p.busy || p.won != null) return; p.busy = true; const r = 1 + G.rand(6); p.last = r; sfx('roll'); buzz(30);
    await rollAll(dice, [r], 800); if (my !== token) return;
    if (r === 1) { sfx('bad'); say(`${p.names[p.turn]} gooit een 1 en verliest ${p.pts} punten.`); p.pts = 0; p.turn = 1 - p.turn; }
    else { p.pts += r; sfx('pop'); if (p.score[p.turn] + p.pts >= G.PIG_TARGET && !p.ai[p.turn]) { /* de speler kiest zelf */ } }
    p.busy = false; pigRender($('#gm-body'), my);
  }
  function pigHold(my) {
    const p = gm.pig; p.score[p.turn] += p.pts; p.pts = 0; sfx('coin');
    if (p.score[p.turn] >= G.PIG_TARGET) { p.won = p.turn; sfx('win'); if (!p.ai[p.turn]) playScene(view, 'victory', { title: 'Gewonnen!' }); } else p.turn = 1 - p.turn;
    pigRender($('#gm-body'), my);
  }
  async function pigAi(my) {
    const p = gm.pig; if (p.busy) return; await sleep(800); if (my !== token || !gm || gm.pig !== p) return;
    if (p.pts > 0 && G.pigAiHold(p.pts, p.score[p.turn], p.score[1 - p.turn])) { pigHold(my); return; }
    await pigRoll(my);
  }

  // ===== Handig =====
  function toolsHtml() {
    return `<div class="card"><b>Willekeurig getal</b><div class="dc-row"><input type="number" id="dc-min" value="1" style="width:5.5rem" aria-label="Van"> <span>t/m</span> <input type="number" id="dc-max" value="100" style="width:5.5rem" aria-label="Tot"><span>aantal</span><input type="number" id="dc-cnt" value="1" min="1" max="100" style="width:4.5rem"></div>
      <div class="dc-row"><label><input type="checkbox" id="dc-uniq"> allemaal verschillend (lotto)</label><button class="on" data-act="ints">Trek</button></div><div class="dc-big" id="dc-ints" style="color:inherit;text-shadow:none;font-size:1.6rem;min-height:2rem">${esc(handig.ints)}</div></div>
      <div class="card"><b>Groepjes maken</b><textarea id="dc-names" rows="4" placeholder="Zet alle namen onder elkaar" spellcheck="false"></textarea>
        <div class="dc-row"><span>Aantal groepjes</span><input type="number" id="dc-ng" value="2" min="1" max="10" style="width:4.5rem"><button class="on" data-act="teams">Maak groepjes</button><button data-act="order">Willekeurige volgorde</button></div><div id="dc-teams">${handig.teams}</div></div>
      <div class="card" style="text-align:center"><b>Magische bal</b><br><small class="mute">Stel een ja/nee-vraag en tik op de bal.</small>
        <button data-act="ball" class="dc-ball" style="min-height:0;border:0">${handig.ball ? esc(handig.ball) : icon('crystal', { size: 70 })}</button></div>`;
  }

  // ===== events =====
  function onKey(e) { if (e.key === ' ' && tab === 'dice' && !['TEXTAREA', 'INPUT', 'SELECT', 'BUTTON'].includes((e.target || {}).tagName)) { e.preventDefault(); doRoll(); } }
  window.addEventListener('keydown', onKey);
  function wire() {
    view.addEventListener('click', (e) => {
      const cv = e.target.closest && e.target.closest('canvas.d3');
      if (cv && tab === 'dice' && !rolling && layout().normal && pool.count > 1) { const i = +cv.dataset.i; if (locked.has(i)) locked.delete(i); else locked.add(i); cv.classList.toggle('lock'); sfx('pop'); return; }
      if (cv && tab === 'games' && gm && gm.g === 'y' && gm.y && !gm.busy) { const g = gm.y; if (G.yToggle(g, +cv.dataset.i)) { sfx('pop'); gameRender(); } return; }
      const b = e.target.closest && e.target.closest('button'); if (!b || b.disabled) return; const a = b.dataset.act; if (!a) return; const v = b.dataset.v;
      switch (a) {
        case 'sides': pool.sides = +v; if (pool.sides === 100) pool.adv = 'geen'; shown = null; lastRes = null; locked.clear(); save(); render(); break;
        case 'count': pool.count = +v; if (pool.count > 1) pool.adv = 'geen'; shown = null; lastRes = null; locked.clear(); save(); render(); break;
        case 'color': pool.color = v; save(); render(); break;
        case 'mod': pool.mod = Math.max(-99, Math.min(99, pool.mod + +v)); save(); render(); break;
        case 'sound': Settings.set({ sound: !Settings.get().sound }); render(); break;
        case 'roll': doRoll(); break;
        case 'clearhist': history = []; save(); render(); break;
        case 'coins': coinState.n = +v; wr(CKEY, coinState); render(); break;
        case 'flip': b.disabled = true; doFlip(); break;
        case 'coinreset': coinState = { kop: 0, munt: 0, n: coinState.n || 1 }; wr(CKEY, coinState); render(); break;
        case 'spin': doSpin(); break;
        case 'wpreset': wheel.items = G.WHEEL_PRESETS[b.dataset.k].slice(); wr(WKEY, wheel.items); wheel.res = null; render(); break;
        case 'wremove': if (wheel.res != null) { wheel.items.splice(wheel.res, 1); wheel.res = null; wr(WKEY, wheel.items); render(); if (wheel.items.length === 1) { say('Er is er nog maar één over: ' + wheel.items[0] + '!'); playScene(view, 'victory', { title: wheel.items[0] }); } } break;
        case 'game': gameStart(b.dataset.g); break;
        case 'gmenu': gm = null; token++; render(); break;
        case 'gagain': gm = { g: gm.g, setup: true }; token++; gameRender(); break;
        case 'gsetup': gameSetup(v); break;
        case 'yroll': if (gm.y && !gm.busy && gm.y.rolls < 3) { gm.busy = true; const my = token; yRollAnim(my).then(() => { if (gm) gm.busy = false; if (my === token) gameRender(); }); } break;
        case 'yscore': if (gm.y && !gm.busy) yDoScore(b.dataset.id, token); break;
        case 'slroll': slTurn(token); break;
        case 'ttmove': ttPlay(+b.dataset.i); break;
        case 'ttagain': gm.tt = { b: Array(9).fill(null), turn: 'X', level: gm.tt.level, score: gm.tt.score }; gameRender(); break;
        case 'pigroll': pigRoll(token); break;
        case 'pighold': pigHold(token); break;
        case 'ints': { const r = G.randomInts($('#dc-min').value, $('#dc-max').value, +$('#dc-cnt').value, $('#dc-uniq').checked); handig.ints = r.join(' · '); $('#dc-ints').textContent = handig.ints; sfx('pop'); break; }
        case 'teams': case 'order': {
          const names = $('#dc-names').value.split('\n').map((x) => x.trim()).filter(Boolean); if (names.length < 2) { say('Vul minstens twee namen in.'); break; }
          const html = a === 'order' ? `<ol>${G.shuffle(names).map((n) => `<li>${esc(n)}</li>`).join('')}</ol>` : G.makeTeams(names, +$('#dc-ng').value || 2).map((t, i) => `<div class="chip" style="margin:.3rem 0"><b>Groep ${i + 1}</b>: ${t.map(esc).join(', ')}</div>`).join('');
          handig.teams = html; $('#dc-teams').innerHTML = html; sfx('win'); break; }
        case 'ball': { sfx('pop'); const bt = b; bt.textContent = '…'; setTimeout(() => { handig.ball = G.EIGHTBALL[G.rand(G.EIGHTBALL.length)]; bt.textContent = handig.ball; sfx('win'); }, 700); break; }
        default: break;
      }
    });
    view.addEventListener('change', (e) => { if (e.target.id === 'dc-adv') { pool.adv = e.target.value; shown = null; lastRes = null; save(); render(); } });
    view.addEventListener('input', (e) => { if (e.target.id === 'dc-witems') { wheel.items = e.target.value.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 40); wheel.res = null; wr(WKEY, wheel.items); drawWheel(); } });
  }
  function gameSetup(v) {
    const names = ['Speler 1', 'Speler 2', 'Speler 3', 'Speler 4'];
    if (gm.g === 'y') {
      const pl = v === 'solo' ? [{ name: 'Jij' }] : v === 'cpu' ? [{ name: 'Jij' }, { name: 'Computer', ai: true }] : Array.from({ length: v === 'p2' ? 2 : 3 }, (_, i) => ({ name: names[i] }));
      gm = { g: 'y', y: G.newY(pl) };
    } else if (gm.g === 'sl') {
      const n = v === 'cpu' || v === 'p2' ? 2 : v === 'p3' ? 3 : 4;
      gm = { g: 'sl', sl: { turn: 0, last: 0, busy: false, won: null, players: Array.from({ length: n }, (_, i) => ({ name: v === 'cpu' ? (i ? 'Computer' : 'Jij') : names[i], ai: v === 'cpu' && i === 1, pos: 0, icon: TOKENS[i].icon, color: TOKENS[i].color })) } };
    } else if (gm.g === 'tt') gm = { g: 'tt', tt: { b: Array(9).fill(null), turn: 'X', level: v, score: { X: 0, O: 0, d: 0 } } };
    else gm = { g: 'pig', pig: { names: v === 'cpu' ? ['Jij', 'Computer'] : ['Speler 1', 'Speler 2'], ai: [false, v === 'cpu'], score: [0, 0], pts: 0, turn: 0, last: 0, busy: false, won: null } };
    token++; gameRender();
  }

  build();
}
