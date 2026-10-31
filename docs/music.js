// Muziekmaker (studio): meerdere sporen (drums, melodie, akkoorden), 17 instrumenten, 12 drumgeluiden, 4 patronen + liedvolgorde,
// toonsoort en toonladders, effecten (galm, echo, filter), 11 voorbeelden, 12 opslagplekken, delen via code, WAV-export en een ritmespel.
// Alle geluid wordt in de browser gesynthetiseerd (WebAudio). Logica staat in music-model.js, klanken in music-synth.js.

import { INSTRUMENTS, DRUMKIT, NOTE_NAMES, newAudio, makeBus, makeNoise, applyFx, playDrum, playNote, midiFreq, startNote, click, encodeWav, instInfo, drumInfo } from './music-synth.js?v=1';
import * as M from './music-model.js?v=1';
import { styleTag, gearHtml, wireGear, worldSelectHtml, hero, icon, GFX, Themes, playScene, copyText, starsStr } from './apps3-ui.js?v=1';

const SLOT_COUNT = 12;
const BODY_CSS = `<style>
.mu-grid{display:grid;gap:3px;margin-bottom:3px;touch-action:none;user-select:none;-webkit-user-select:none}
.mu-lab{display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:800;border-radius:8px;color:#fff;min-height:calc(42px*var(--s));padding:0 2px;overflow:hidden;cursor:pointer;text-shadow:0 1px 2px #0005}
.mu-c{min-height:calc(42px*var(--s));border-radius:7px;background:rgba(128,128,128,.16);cursor:pointer;transition:background .08s}
.mu-c.g{margin-left:3px}
.mu-c.on{background:var(--c);box-shadow:inset 0 -4px 0 #0003,0 0 8px color-mix(in srgb,var(--c) 55%,transparent)}
html[data-gfx-q="normaal"] .mu-c.on{box-shadow:inset 0 -4px 0 #0003}
.mu-c.ph{background:rgba(128,128,128,.42)}
.mu-c.on.ph{filter:brightness(1.5) saturate(1.1)}
.mu-h{font-size:.6rem;text-align:center;opacity:.6;height:18px;line-height:18px;border-radius:5px}
.mu-h.g{margin-left:3px}
.mu-h.ph{background:var(--accent);color:#fff;opacity:1}
.mu-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.mu-ctl{display:flex;align-items:center;gap:.5rem;margin:.3rem 0}
.mu-ctl>span{min-width:5.2rem}
.mu-ctl input[type=range]{flex:1;min-height:calc(44px*var(--s))}
.mu-ctl output{min-width:2.8rem;text-align:right;font-variant-numeric:tabular-nums}
.mu-tr{display:flex;align-items:center;gap:.4rem;padding:.3rem;border-radius:14px;border:2px solid transparent}
.mu-tr.sel{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,transparent)}
.mu-tr .nm{flex:1;justify-content:flex-start;text-align:left;min-width:0;overflow:hidden}
.mu-tr input[type=range]{width:22%;min-width:70px}
.mu-ins{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(92px*var(--s)),1fr));gap:.4rem}
.mu-ins button{flex-direction:column;padding:.3rem;font-size:.8rem;line-height:1.1}
.mu-tpl{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(120px*var(--s)),1fr));gap:.5rem}
.mu-tpl button{flex-direction:column;padding:.5rem;font-weight:700}
.mu-slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(130px*var(--s)),1fr));gap:.4rem}
.mu-slots button{flex-direction:column;align-items:flex-start;text-align:left;padding:.4rem .6rem}
.mu-chain{display:flex;flex-wrap:wrap;gap:.35rem;align-items:center}
.mu-chain button{min-width:calc(46px*var(--s));font-weight:800}
.mu-chain button.cur{outline:3px solid #f59e0b}
.mu-pad{width:100%;min-height:calc(150px*var(--s));font-size:1.6rem;font-weight:900;border-radius:24px;touch-action:manipulation;user-select:none;-webkit-user-select:none}
.mu-rs{display:grid;grid-template-columns:repeat(16,1fr);gap:3px;margin:.5rem 0}
.mu-rs i{display:block;height:calc(34px*var(--s));border-radius:6px;background:rgba(128,128,128,.2)}
.mu-rs i.t{background:#6366f1}.mu-rs i.p{outline:3px solid #f59e0b}.mu-rs i.ok{background:#22c55e}.mu-rs i.no{background:#ef4444}
.mu-lv{display:grid;grid-template-columns:repeat(4,1fr);gap:.4rem}
.mu-lv button{flex-direction:column;font-weight:800}
</style>`;

export function muziekView(ctx) {
  const { view, esc, uid, addCleanup } = ctx;
  const KEY = `music:${uid}:slots`, RKEY = `music:${uid}:rhythm`;
  let song = M.newSong(), prev = null, tab = 'studio', pat = 0, sel = 0, mode = 'pattern', msg = '';
  let ac = null, bus = null, nb = null, session = null, playing = false, timer = 0, raf = 0, nextT = 0, step = 0, seqPos = 0, queue = [], curStep = -1, curSeq = 0;
  let alive = true, selSlot = 0, exporting = false, taps = [], heroCtl = null, lastBeat = -1, game = null, level = 1, shareText = '';
  const timeouts = [], urls = [];
  const $ = (s) => view.querySelector(s);
  let cells = [], heads = [];
  let slots = loadSlots(), rprog = loadRhythm();

  addCleanup(() => { alive = false; stop(true); if (game && game.tick) clearInterval(game.tick); try { heroCtl && heroCtl.dispose(); } catch { /* stil */ } try { ac && ac.close && ac.close().catch(() => {}); } catch { /* stil */ } ac = null; timeouts.forEach(clearTimeout); urls.forEach((u) => { try { URL.revokeObjectURL(u); } catch { /* stil */ } }); });

  // ----- opslag -----
  function loadSlots() { let arr = []; try { arr = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { arr = []; } if (!Array.isArray(arr)) arr = []; return Array.from({ length: SLOT_COUNT }, (_, i) => (arr[i] && typeof arr[i] === 'object' && arr[i].data ? arr[i] : null)); }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(slots)); return true; } catch { return false; } }
  function loadRhythm() { try { const o = JSON.parse(localStorage.getItem(RKEY) || '{}'); return { stars: (o && typeof o.stars === 'object' && o.stars) || {} }; } catch { return { stars: {} }; } }
  function saveRhythm() { try { localStorage.setItem(RKEY, JSON.stringify(rprog)); } catch { /* stil */ } }
  const unlocked = () => { let n = 1; while (n < M.RHYTHM_LEVELS && (rprog.stars[n] || 0) >= 2) n++; return n; };
  const say = (t) => { msg = t; const e = $('#mu-msg'); if (e) e.textContent = t; };
  const replaceSong = (s, text) => { prev = M.cloneSong(song); song = s; pat = 0; sel = Math.min(sel, song.tracks.length - 1); applyAll(); renderBody(); if (text) say(text); };

  // ----- audio -----
  function ensure() {
    if (!ac) { try { ac = newAudio(); if (!ac) return false; bus = makeBus(ac, song.vol); nb = makeNoise(ac); applyFx(bus, song.fx, song.bpm); } catch { ac = null; return false; } }
    if (ac.state === 'suspended') { try { ac.resume().catch(() => {}); } catch { /* stil */ } }
    return true;
  }
  function applyAll() { if (bus) { bus.setVolume(song.vol); applyFx(bus, song.fx, song.bpm); } }
  const sd = () => M.stepDur(song.bpm);
  const order = () => M.playOrder(song, mode, pat);
  function schedule() {
    if (!ac || !playing) return;
    const ahead = document.hidden ? 1.0 : 0.15;
    if (nextT < ac.currentTime - 0.05) nextT = ac.currentTime + 0.05;
    while (nextT < ac.currentTime + ahead) {
      const ord = order(); if (seqPos >= ord.length) seqPos = 0;
      const p = ord[seqPos], t = nextT + M.swingOffset(step, song.swing, sd());
      M.stepEvents(song, p, step).forEach((e) => M.fireEvent(ac, session, nb, e, t, sd()));
      queue.push({ s: step, t, p, q: seqPos });
      step++; if (step >= song.len) { step = 0; seqPos = (seqPos + 1) % ord.length; }
      nextT += sd();
    }
  }
  function frame() {
    if (!alive || !playing) return;
    const now = ac.currentTime; let cur = null;
    while (queue.length && queue[0].t <= now) cur = queue.shift();
    if (cur) { showStep(cur); const beat = cur.s % 4 === 0 ? cur.s : -1; if (beat >= 0 && heroCtl && GFX.q > 0 && !GFX.reduce) heroCtl.burst(30 + Math.random() * ((heroCtl.width || 320) - 60), 80, { kind: 'sparkle', n: 3, power: 0.5 }); }
    raf = requestAnimationFrame(frame);
  }
  function play() {
    if (playing || !ensure()) return;
    if (game) abortGame();
    session = ac.createGain(); session.connect(bus.input);
    playing = true; step = 0; seqPos = 0; queue = []; nextT = ac.currentTime + 0.06;
    schedule(); timer = setInterval(schedule, 25); raf = requestAnimationFrame(frame);
    if (heroCtl) heroCtl.run(true); updatePlayBtn();
  }
  function stop(silent) {
    if (timer) { clearInterval(timer); timer = 0; }
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (session) { const s = session; session = null; try { s.gain.setValueAtTime(s.gain.value, ac.currentTime); s.gain.linearRampToValueAtTime(0, ac.currentTime + 0.03); timeouts.push(setTimeout(() => { try { s.disconnect(); } catch { /* stil */ } }, 80)); } catch { /* stil */ } }
    playing = false; queue = []; showStep(null);
    if (!silent) { updatePlayBtn(); if (heroCtl) heroCtl.run(false); }
  }
  function previewEvent(ti, r) {
    if (!ensure()) return;
    const tr = song.tracks[ti], t = ac.currentTime + 0.005;
    let e;
    if (tr.kind === 'drums') e = { type: 'drum', id: tr.kit[r], vol: tr.vol };
    else if (tr.kind === 'mel') e = { type: 'note', inst: tr.inst, midi: M.rowMidi(r, song.key, song.scale, tr.oct), vol: tr.vol, steps: 2 };
    else e = { type: 'chord', inst: tr.inst, midis: M.chordMidis(r, song.key, song.scale, tr.oct), vol: tr.vol * 0.7, steps: 3 };
    M.fireEvent(ac, bus.input, nb, e, t, sd());
  }

  // ----- export -----
  async function exportWav() {
    if (exporting) return;
    const OAC = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
    if (!OAC) { say('Exporteren wordt niet ondersteund door deze browser.'); return; }
    if (!M.songHasNotes(song)) { say('Maak eerst iets om te exporteren.'); return; }
    exporting = true; updateExportBtn(); say('Bezig met renderen…');
    try {
      let ord = order(); const maxP = Math.max(1, Math.floor(120 / (song.len * sd()))); ord = ord.slice(0, maxP);
      if (mode === 'pattern') ord = [pat, pat];
      const sr = 44100, secs = ord.length * song.len * sd() + 2.5;
      const oc = new OAC(2, Math.ceil(secs * sr), sr), b = makeBus(oc, song.vol), n2 = makeNoise(oc); applyFx(b, song.fx, song.bpm);
      M.scheduleSong(oc, b.input, n2, song, ord, 0.03);
      const buf = await oc.startRendering();
      if (!alive) return;
      let peak = 0; for (let k = 0; k < buf.numberOfChannels; k++) { const d = buf.getChannelData(k); for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; } }
      if (peak > 0.98) { const g = 0.98 / peak; for (let k = 0; k < buf.numberOfChannels; k++) { const d = buf.getChannelData(k); for (let i = 0; i < d.length; i++) d[i] *= g; } }
      const blob = new Blob([encodeWav(buf)], { type: 'audio/wav' }), url = URL.createObjectURL(blob); urls.push(url);
      const a = document.createElement('a'); a.href = url; a.download = `lied-${song.bpm}bpm.wav`; document.body.appendChild(a); a.click(); a.remove();
      timeouts.push(setTimeout(() => { try { URL.revokeObjectURL(url); } catch { /* stil */ } }, 60000));
      say(`✔ Klaar: ${(blob.size / 1024 / 1024).toFixed(1)} MB (${Math.round(secs - 2.5)} seconden).`);
    } catch (e) { if (alive) say('Exporteren is mislukt.'); }
    exporting = false; if (alive) updateExportBtn();
  }

  // ----- kleine UI-updates -----
  function showStep(cur) {
    const on = cur && cur.p === pat && tab === 'studio';
    if (curStep !== -1 && cells.length) { for (let i = 0; i < M.MAXSTEPS; i++) if (i === curStep) { cells.forEach((row) => row[i] && row[i].classList.remove('ph')); if (heads[i]) heads[i].classList.remove('ph'); } }
    curStep = on ? cur.s : -1;
    if (on) { cells.forEach((row) => row[cur.s] && row[cur.s].classList.add('ph')); if (heads[cur.s]) heads[cur.s].classList.add('ph'); }
    if (cur) { curSeq = cur.q; if (tab === 'song') view.querySelectorAll('.mu-chain [data-q]').forEach((b) => b.classList.toggle('cur', +b.dataset.q === cur.q && playing)); }
    else if (tab === 'song') view.querySelectorAll('.mu-chain [data-q]').forEach((b) => b.classList.remove('cur'));
  }
  function updatePlayBtn() { const b = $('#mu-play'); if (b) { b.innerHTML = playing ? '⏹ Stop' : '▶ Speel'; b.classList.toggle('on', !playing); } }
  function updateExportBtn() { const b = $('#mu-exp'); if (b) { b.disabled = exporting; b.textContent = exporting ? '⏳ Bezig…' : '💾 Exporteer .wav'; } }

  // ----- opbouw -----
  function drawHero(ctx2, w, h, t) {
    const world = heroCtl ? heroCtl.world : Themes.forGame('muziek');
    const n = 18, bw = w / n; let data = null;
    if (playing && bus && bus.analyser) { try { data = new Uint8Array(bus.analyser.frequencyBinCount); bus.analyser.getByteFrequencyData(data); } catch { data = null; } }
    ctx2.save(); ctx2.globalAlpha = 0.85;
    for (let i = 0; i < n; i++) {
      const v = data ? data[Math.min(data.length - 1, Math.floor(i * data.length / n))] / 255 : 0.06 + 0.03 * Math.sin(t * 2 + i);
      const bh = Math.max(4, v * h * 0.62);
      ctx2.fillStyle = `hsl(${(i * 14 + t * 30) % 360} 85% 62%)`; ctx2.fillRect(i * bw + 3, h - bh - 6, bw - 6, bh);
    }
    ctx2.restore();
    void world;
  }
  function build() {
    view.innerHTML = `${styleTag()}${BODY_CSS}<div class="ap" id="mu-ap"><div id="mu-hero"></div>
      <div class="tabs2" id="mu-tabs">${[['studio', '🎛 Studio'], ['song', '🎼 Lied'], ['game', '🥁 Ritmespel']].map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div id="mu-body"></div></div>`;
    if (heroCtl) heroCtl.dispose();
    heroCtl = hero($('#mu-hero'), { gameId: 'muziek', height: Math.round(120 * (GFX.q ? 1 : 0.9)), draw: drawHero, title: `${icon('headphones', { size: 30 })} Muziekmaker`, rightHtml: `${worldSelectHtml('muziek')}${gearHtml()}` });
    Object.defineProperty(heroCtl, 'width', { get: () => ($('#mu-hero canvas') || {}).clientWidth || 320, configurable: true });
    $('#ap-world').onchange = (e) => heroCtl.setWorld(e.target.value);
    wireGear(view, say);
    $('#mu-tabs').onclick = (e) => { const b = e.target.closest('[data-tab]'); if (!b) return; tab = b.dataset.tab; $('#mu-tabs').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); renderBody(); };
    wireBody(); renderBody();
  }
  function renderBody() {
    const el = $('#mu-body'); if (!el) return;
    el.innerHTML = tab === 'studio' ? studioHtml() : tab === 'song' ? songHtml() : gameHtml();
    cells = []; heads = []; curStep = -1;
    if (tab === 'studio') { collectCells(); }
    if (tab === 'game') gameWire();
    updatePlayBtn(); updateExportBtn();
    const m = $('#mu-msg'); if (m) m.textContent = msg;
  }
  function collectCells() {
    const t = song.tracks[sel]; cells = Array.from({ length: M.rowsFor(t) }, () => []);
    view.querySelectorAll('#mu-body .mu-c').forEach((el) => { cells[+el.dataset.r][+el.dataset.s] = el; });
    view.querySelectorAll('#mu-body .mu-h').forEach((el) => { heads[+el.dataset.s] = el; });
  }

  // ----- Studio -----
  const trackColor = (ti) => `hsl(${(ti * 47 + 200) % 360} 70% 52%)`;
  function rowInfo(t, r, ti) {
    if (t.kind === 'drums') { const d = drumInfo(t.kit[r]); return { label: d.lab, color: d.color, title: d.name }; }
    if (t.kind === 'mel') { const m = M.rowMidi(r, song.key, song.scale, t.oct); return { label: NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1), color: `hsl(${200 + r * 20} 75% ${55 - r}%)`, title: 'Noot' }; }
    return { label: M.chordName(r, song.key, song.scale) + '<br><small style="font-weight:400">' + M.chordRoman(r, song.key, song.scale) + '</small>', color: `hsl(${(r * 40 + 10) % 360} 70% 50%)`, title: 'Akkoord' };
  }
  function gridHtml() {
    const t = song.tracks[sel], len = song.len, n = M.rowsFor(t), cols = `62px repeat(${len},minmax(${len > 16 ? 30 : 0}px,1fr))`;
    const minw = len > 16 ? 62 + len * 33 : 0;
    const head = `<div class="mu-grid" style="grid-template-columns:${cols}"><div></div>${Array.from({ length: len }, (_, s) => `<div class="mu-h${s % 4 === 0 && s ? ' g' : ''}" data-s="${s}">${s % 4 === 0 ? s / 4 + 1 : '·'}</div>`).join('')}</div>`;
    let rows = '';
    for (let r = 0; r < n; r++) {
      const ri = rowInfo(t, r, sel);
      rows += `<div class="mu-grid" style="grid-template-columns:${cols}"><div class="mu-lab" data-lab="${r}" style="background:${ri.color}" title="${esc(ri.title)}">${ri.label}</div>${Array.from({ length: len }, (_, s) => `<div class="mu-c${s % 4 === 0 && s ? ' g' : ''}${song.pats[pat][sel][r][s] ? ' on' : ''}" data-r="${r}" data-s="${s}" style="--c:${ri.color}"></div>`).join('')}</div>`;
    }
    return `<div class="mu-wrap"><div style="min-width:${minw}px">${head}${rows}</div></div>`;
  }
  function studioHtml() {
    const t = song.tracks[sel], keyOpts = NOTE_NAMES.map((n, i) => `<option value="${i}"${i === song.key ? ' selected' : ''}>${n}</option>`).join('');
    const trackRows = song.tracks.map((tr, ti) => {
      const nm = tr.kind === 'drums' ? 'Drums' : instInfo(tr.inst).name, ic = tr.kind === 'drums' ? 'drum' : instInfo(tr.inst).icon;
      return `<div class="mu-tr${ti === sel ? ' sel' : ''}"><button class="nm" data-act="sel" data-ti="${ti}" style="border-left:6px solid ${trackColor(ti)}">${icon(ic, { size: 28 })}<span>${esc(M.trackLabel(tr))}<br><small class="mute">${esc(nm)}</small></span></button>
        <button data-act="mute" data-ti="${ti}" class="${tr.mute ? 'on' : ''}" aria-label="Dempen" title="Dempen">${tr.mute ? '🔇' : '🔊'}</button>
        <button data-act="solo" data-ti="${ti}" class="${tr.solo ? 'on' : ''}" aria-label="Solo" title="Alleen dit spoor">S</button>
        <input type="range" min="0" max="100" value="${Math.round(tr.vol * 100)}" data-vol="${ti}" aria-label="Volume spoor"></div>`;
    }).join('');
    const picker = t.kind === 'drums'
      ? `<details><summary><b>Drumgeluiden kiezen</b> (per rij)</summary><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr));margin-top:.4rem">${t.kit.map((id, r) => `<select data-kit="${r}" aria-label="Rij ${r + 1}">${DRUMKIT.map((d) => `<option value="${d.id}"${d.id === id ? ' selected' : ''}>${esc(d.name)}</option>`).join('')}</select>`).join('')}</div></details>`
      : `<div class="mu-ins">${INSTRUMENTS.map((i) => `<button data-inst="${i.id}" class="${i.id === t.inst ? 'on' : ''}">${icon(i.icon, { size: 30 })}<span>${esc(i.name)}</span></button>`).join('')}</div>
         <div class="row" style="display:flex;gap:.5rem;align-items:center;margin-top:.4rem"><span>Hoogte</span><button data-act="oct" data-d="-1">−</button><b>${t.oct > 0 ? '+' : ''}${t.oct}</b><button data-act="oct" data-d="1">+</button><small class="mute">octaven</small></div>`;
    const hint = M.songHasNotes(song) ? '' : `<div class="card" style="text-align:center">${icon('note', { size: 44 })}<br><b>Tik op de vakjes en druk op ▶</b><br><small class="mute">Sleep over de vakjes om er meer tegelijk te zetten. Of begin met een voorbeeld op het tabblad “Lied”.</small></div>`;
    return `${hint}
    <div class="card">
      <div style="display:flex;gap:.5rem;flex-wrap:wrap"><button id="mu-play" class="on" data-act="play" style="flex:2;font-size:1.2rem;min-width:130px">▶ Speel</button>
        <button data-act="mode" title="Speel één patroon of het hele lied">${mode === 'pattern' ? '🔁 Patroon' : '🎼 Hele lied'}</button>
        <button data-act="rnd">🎲 Verrassing</button>${prev ? '<button data-act="undo">↶ Terug</button>' : ''}</div>
      <div class="mu-ctl"><span>Tempo</span><input type="range" id="mu-bpm" min="50" max="200" value="${song.bpm}"><output id="mu-bpmv">${song.bpm}</output><button data-act="tap" title="Tik het tempo">Tik</button></div>
      <details open><summary><b>Toonsoort, effecten en meer</b></summary>
        <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin:.4rem 0"><label>Toonsoort <select id="mu-key">${keyOpts}</select></label>
          <select id="mu-scale" aria-label="Toonladder">${M.SCALE_KEYS.map((k) => `<option value="${k}"${k === song.scale ? ' selected' : ''}>${esc(M.SCALES[k].label)}</option>`).join('')}</select>
          <select id="mu-len" aria-label="Lengte">${M.LENGTHS.map((n) => `<option value="${n}"${n === song.len ? ' selected' : ''}>${n} stappen</option>`).join('')}</select></div>
        <div class="mu-ctl"><span>Swing</span><input type="range" id="mu-swing" min="0" max="100" value="${song.swing}"><output id="mu-swingv">${song.swing}%</output></div>
        <div class="mu-ctl"><span>🌊 Galm</span><input type="range" data-fx="rev" min="0" max="100" value="${Math.round(song.fx.rev * 100)}"><output></output></div>
        <div class="mu-ctl"><span>🔁 Echo</span><input type="range" data-fx="echo" min="0" max="100" value="${Math.round(song.fx.echo * 100)}"><output></output></div>
        <div class="mu-ctl"><span>🎚 Filter</span><input type="range" data-fx="filter" min="0" max="100" value="${Math.round(song.fx.filter * 100)}"><output></output></div>
        <div class="mu-ctl"><span>🔈 Volume</span><input type="range" id="mu-vol" min="0" max="100" value="${Math.round(song.vol * 100)}"><output></output></div></details>
    </div>
    <div class="card"><div class="mu-chain" id="mu-pats"><b>Patroon</b>${M.PAT_NAMES.map((n, p) => `<button data-act="pat" data-p="${p}" class="${p === pat ? 'on' : ''}">${n}${M.patternHasNotes(song, p) ? '' : '<small>·</small>'}</button>`).join('')}
      <span style="flex:1"></span><button data-act="copypat" title="Kopieer dit patroon naar het volgende">📋 Kopieer →</button><button data-act="clrpat" title="Wis dit patroon">🗑</button></div></div>
    <div class="card"><b>Sporen</b> <small class="mute">(tik op een spoor om het te bewerken)</small>${trackRows}
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.4rem"><button data-act="add" data-k="drums" ${song.tracks.length >= M.MAX_TRACKS ? 'disabled' : ''}>＋ Drums</button><button data-act="add" data-k="mel" ${song.tracks.length >= M.MAX_TRACKS ? 'disabled' : ''}>＋ Melodie</button><button data-act="add" data-k="chord" ${song.tracks.length >= M.MAX_TRACKS ? 'disabled' : ''}>＋ Akkoorden</button></div></div>
    <div class="card"><div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem"><b style="flex:1">${icon(t.kind === 'drums' ? 'drum' : instInfo(t.inst).icon, { size: 28 })} ${esc(M.trackLabel(t))} — patroon ${M.PAT_NAMES[pat]}</b><button data-act="clrtrack">🗑 Wis spoor</button><button data-act="deltrack" ${song.tracks.length <= 1 ? 'disabled' : ''}>✖ Verwijder</button></div>
      ${gridHtml()}<div style="margin-top:.6rem">${picker}</div></div>
    <div class="msg" id="mu-msg"></div>`;
  }

  // ----- Lied -----
  function songHtml() {
    const chain = song.chain.map((p, q) => `<button data-act="chain" data-q="${q}" class="${q === curSeq && playing ? 'cur' : ''}">${M.PAT_NAMES[p]}</button>`).join('');
    return `<div class="card"><b>Liedvolgorde</b><br><small class="mute">Zet je patronen achter elkaar. Tik op een letter om te veranderen. Kies bij Studio “Hele lied” om te horen.</small>
        <div class="mu-chain" style="margin-top:.4rem">${chain}<button data-act="chainadd" ${song.chain.length >= M.MAX_CHAIN ? 'disabled' : ''}>＋</button><button data-act="chaindel" ${song.chain.length <= 1 ? 'disabled' : ''}>−</button></div>
        <div style="margin-top:.5rem;display:flex;gap:.4rem;flex-wrap:wrap"><button id="mu-play" class="on" data-act="play">▶ Speel</button><button data-act="mode">${mode === 'pattern' ? '🔁 Patroon' : '🎼 Hele lied'}</button></div></div>
      <div class="card"><b>${icon('star', { size: 24 })} Voorbeelden</b><br><small class="mute">Tik op een voorbeeld om het te laden. Je eigen werk kun je terughalen met “↶ Terug”.</small>
        <div class="mu-tpl" style="margin-top:.5rem">${M.PRESET_KEYS.map((k) => `<button data-act="preset" data-k="${k}">${icon(M.PRESETS[k].icon, { size: 36 })}<span>${esc(M.PRESETS[k].label)}</span><small class="mute">${M.PRESETS[k].bpm} bpm</small></button>`).join('')}</div>
        ${prev ? '<div style="margin-top:.5rem"><button data-act="undo">↶ Terug naar mijn vorige lied</button></div>' : ''}</div>
      <div class="card"><b>${icon('chest', { size: 24 })} Opslaan en laden</b>
        <div class="mu-slots" style="margin:.5rem 0">${slots.map((s, i) => `<button data-act="slot" data-i="${i}" class="${i === selSlot ? 'on' : ''}"><b>${i + 1}</b><small>${s ? esc(s.name) : '(leeg)'}</small></button>`).join('')}</div>
        <input type="text" id="mu-name" maxlength="30" placeholder="Naam van je lied" style="width:100%" value="${esc(slots[selSlot] ? slots[selSlot].name : '')}">
        <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.4rem"><button data-act="save">💾 Opslaan</button><button data-act="load">📂 Laden</button><button data-act="delslot">✖ Leegmaken</button></div></div>
      <div class="card"><b>Delen met een vriend</b><br><small class="mute">Maak een code van je lied en stuur die door. Je vriend plakt hem hieronder.</small>
        <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin:.4rem 0"><button data-act="mkcode">🔗 Maak code</button><button data-act="copycode">📋 Kopieer</button></div>
        <textarea id="mu-code" rows="3" placeholder="Hier staat je code, of plak hier de code van een vriend" spellcheck="false">${esc(shareText)}</textarea>
        <button data-act="usecode" style="margin-top:.4rem">📥 Laad deze code</button></div>
      <div class="card"><div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap"><button id="mu-exp" data-act="export">💾 Exporteer .wav</button><small class="mute">Download je lied als geluidsbestand (maximaal 2 minuten).</small></div></div>
      <div class="msg" id="mu-msg"></div>`;
  }

  // ----- Ritmespel -----
  function gameHtml() {
    const un = unlocked();
    const st = game && game.res ? game.res : null;
    return `<div class="card"><b>${icon('target', { size: 28 })} Ritme-uitdaging</b><br><small class="mute">Eerst telt de computer 4 tikken in. Dan hoor je een ritme. Daarna is het jouw beurt: tik het ritme na op de grote knop, precies op de maat!</small>
      <div class="mu-lv" style="margin-top:.5rem">${Array.from({ length: M.RHYTHM_LEVELS }, (_, i) => { const L = i + 1, s = rprog.stars[L] || 0; return `<button data-act="lvl" data-l="${L}" class="${L === level ? 'on' : ''}" ${L > un ? 'disabled' : ''}>${L > un ? icon('lock', { size: 22 }) : 'Niveau ' + L}<small class="stars">${starsStr(s)}</small></button>`; }).join('')}</div></div>
    <div class="card"><div id="mu-gtxt" style="font-weight:800;font-size:1.2rem;text-align:center;min-height:2rem">${st ? `${starsStr(st.stars)} — ${st.score} punten` : 'Klaar? Druk op Start.'}</div>
      <div class="mu-rs" id="mu-rs">${(game && game.pat ? game.pat : new Array(16).fill(false)).map((v, i) => `<i data-i="${i}" class="${st ? (v ? (st.mark[i] ? 'ok' : 'no') : '') : (v && game && game.show ? 't' : '')}"></i>`).join('')}</div>
      <div style="display:flex;gap:.5rem;margin:.5rem 0"><button class="on" data-act="gstart" style="flex:1;font-size:1.15rem">▶ Start</button><button data-act="glisten">👂 Nog eens luisteren</button></div>
      <button class="mu-pad on" id="mu-gpad" aria-label="Tik hier">${icon('drum', { size: 56 })} TIK!</button>
      <div class="msg" id="mu-msg" style="text-align:center"></div></div>`;
  }
  function gameWire() {
    const pad = $('#mu-gpad'); if (!pad) return;
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault(); if (!ensure()) return; playDrum(ac, bus.input, nb, 'conga', ac.currentTime + 0.002, 1);
      if (heroCtl && GFX.q > 0) heroCtl.burst(60 + Math.random() * 200, 70, { kind: 'stars', n: 3, power: 0.5 });
      if (game && game.phase === 'play') game.taps.push((e.timeStamp || performance.now()) - game.playPerf);
    });
  }
  const barSec = (bpm) => 4 * 60 / bpm;
  function abortGame() { if (game) { if (game.tick) clearInterval(game.tick); (game.timers || []).forEach(clearTimeout); game = null; } }
  function startRound(replay) {
    if (!ensure()) { say('Geluid werkt niet in deze browser.'); return; }
    stop();
    const keepPat = game && game.pat && (replay || !game.res) ? game.pat : null; abortGame();
    const bpm = 76 + level * 7, beat = 60 / bpm, sdur = beat / 4, pt = keepPat || M.rhythmPattern(level, Math.floor(Math.random() * 99999));
    const t0 = ac.currentTime + 0.3, perf0 = performance.now(), ac0 = ac.currentTime;
    game = { level, bpm, pat: pt, taps: [], phase: 'count1', show: false, timers: [], playPerf: perf0 + (t0 + 12 * beat - ac0) * 1000, targets: M.patternTimes(pt, bpm) };
    for (let i = 0; i < 4; i++) click(ac, bus.input, t0 + i * beat, i === 0);
    pt.forEach((v, i) => { if (v) playDrum(ac, bus.input, nb, 'tom', t0 + 4 * beat + i * sdur, 1); });
    if (!replay) for (let i = 0; i < 8; i++) click(ac, bus.input, t0 + (8 + i) * beat, i % 4 === 0);
    const at = (T) => Math.max(0, (T - ac.currentTime) * 1000);
    const g = game;
    const setT = (txt) => { const e = $('#mu-gtxt'); if (e) e.textContent = txt; };
    g.timers.push(setTimeout(() => { if (game !== g) return; setT('Luister…'); g.phase = 'listen'; g.show = true; if (tab === 'game') { $('#mu-rs').querySelectorAll('i').forEach((el, i) => { el.className = pt[i] ? 't' : ''; }); } }, at(t0 + 4 * beat)));
    g.timers.push(setTimeout(() => { if (game !== g) return; setT('Jouw beurt… tel mee!'); g.phase = 'count2'; }, at(t0 + 8 * beat)));
    g.timers.push(setTimeout(() => { if (game !== g) return; g.phase = 'play'; setT('TIK!'); }, at(t0 + 12 * beat - 0.35)));
    if (replay) { g.timers.push(setTimeout(() => { if (game !== g) return; g.phase = 'idle'; setT('Nu jij! Druk op Start.'); }, at(t0 + 8 * beat))); return; }
    g.timers.push(setTimeout(() => { if (game !== g) return; finishRound(); }, at(t0 + 12 * beat + barSec(bpm) + 0.45)));
    g.tick = setInterval(() => { // lopend vakje tijdens het luisteren/spelen
      if (!ac || game !== g || tab !== 'game') return; const rs = $('#mu-rs'); if (!rs) return;
      const nowT = ac.currentTime, rel = nowT - (g.phase === 'play' ? t0 + 12 * beat : t0 + 4 * beat), idx = Math.floor(rel / sdur);
      rs.querySelectorAll('i').forEach((el, i) => el.classList.toggle('p', (g.phase === 'listen' || g.phase === 'play') && i === idx));
    }, 60);
  }
  function finishRound() {
    const g = game; if (!g) return; clearInterval(g.tick); g.phase = 'done';
    const tol = Math.max(110, 190 - g.level * 10), res = M.scoreTaps(g.targets, g.taps, tol);
    const idxs = []; g.pat.forEach((v, i) => { if (v) idxs.push(i); });
    const mark = {}; res.per.forEach((p, k) => { mark[idxs[k]] = p.ok; });
    g.res = { ...res, mark };
    const old = rprog.stars[g.level] || 0, before = unlocked();
    if (res.stars > old) { rprog.stars[g.level] = res.stars; saveRhythm(); }
    renderBody();
    const e = $('#mu-gtxt'); if (e) e.textContent = `${starsStr(res.stars)} — ${res.score} punten (${res.hits}/${res.total} goed${res.extra ? `, ${res.extra} te veel` : ''})`;
    if (res.stars === 3 && old < 3) playScene(view, 'victory', { title: 'Perfect ritme!', sub: `Niveau ${g.level} met 3 sterren` });
    else if (unlocked() > before) playScene(view, 'levelup', { title: `Niveau ${unlocked()} open!` });
  }

  // ----- bedrading (één keer, event delegation) -----
  function wireBody() {
    const body = $('#mu-body');
    let drag = null;
    const cellAt = (x, y) => { const e = document.elementFromPoint(x, y); return e && e.closest ? e.closest('.mu-c') : null; };
    const hit = (el) => {
      if (!el || !body.contains(el)) return; const r = +el.dataset.r, s = +el.dataset.s, row = song.pats[pat][sel][r];
      if (drag.val === null) drag.val = !row[s];
      if (row[s] === drag.val) return; row[s] = drag.val; el.classList.toggle('on', drag.val);
      if (drag.val) previewEvent(sel, r);
      const hintEl = $('#mu-body > .card:first-child'); if (hintEl && hintEl.textContent.includes('Tik op de vakjes') && M.songHasNotes(song)) hintEl.remove();
    };
    body.addEventListener('pointerdown', (e) => {
      const el = e.target.closest && e.target.closest('.mu-c');
      if (el) { e.preventDefault(); ensure(); drag = { val: null, id: e.pointerId }; try { el.setPointerCapture(e.pointerId); } catch { /* stil */ } hit(el); return; }
      const lab = e.target.closest && e.target.closest('.mu-lab'); if (lab) { ensure(); previewEvent(sel, +lab.dataset.lab); }
    });
    body.addEventListener('pointermove', (e) => { if (drag && e.pointerId === drag.id) hit(cellAt(e.clientX, e.clientY)); });
    const end = (e) => { if (drag && e.pointerId === drag.id) drag = null; };
    body.addEventListener('pointerup', end); body.addEventListener('pointercancel', end);
    body.addEventListener('contextmenu', (e) => { if (e.target.closest && e.target.closest('.mu-grid')) e.preventDefault(); });

    body.addEventListener('input', (e) => {
      const t = e.target;
      if (t.id === 'mu-bpm') { song.bpm = +t.value; $('#mu-bpmv').textContent = song.bpm; applyAll(); }
      else if (t.id === 'mu-swing') { song.swing = +t.value; $('#mu-swingv').textContent = song.swing + '%'; }
      else if (t.id === 'mu-vol') { song.vol = +t.value / 100; applyAll(); }
      else if (t.dataset.fx) { song.fx[t.dataset.fx] = +t.value / 100; applyAll(); }
      else if (t.dataset.vol != null) { song.tracks[+t.dataset.vol].vol = +t.value / 100; }
      else if (t.id === 'mu-code') shareText = t.value;
    });
    body.addEventListener('change', (e) => {
      const t = e.target;
      if (t.id === 'mu-key') { song.key = +t.value; renderBody(); }
      else if (t.id === 'mu-scale') { song.scale = t.value; renderBody(); }
      else if (t.id === 'mu-len') { song.len = +t.value; step = 0; renderBody(); }
      else if (t.dataset.kit != null) { song.tracks[sel].kit[+t.dataset.kit] = t.value; ensure() && previewEvent(sel, +t.dataset.kit); renderBody(); }
    });
    body.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('button'); if (!b || b.disabled) return;
      const inst = b.dataset.inst; if (inst) { song.tracks[sel].inst = inst; renderBody(); if (ensure()) previewEvent(sel, 4); return; }
      const a = b.dataset.act; if (!a) return; act(a, b);
    });
  }
  function act(a, b) {
    const t = song.tracks[sel];
    switch (a) {
      case 'play': if (playing) stop(); else play(); break;
      case 'mode': mode = mode === 'pattern' ? 'song' : 'pattern'; renderBody(); break;
      case 'rnd': randomize(); break;
      case 'undo': if (prev) { const p2 = prev; prev = M.cloneSong(song); song = p2; pat = 0; sel = 0; applyAll(); renderBody(); say('Terug naar je vorige lied.'); } break;
      case 'tap': taps.push(performance.now()); if (taps.length > 8) taps.shift(); { const bpm = M.tapTempo(taps); if (bpm) { song.bpm = bpm; $('#mu-bpm').value = bpm; $('#mu-bpmv').textContent = bpm; applyAll(); } } timeouts.push(setTimeout(() => { if (taps.length && performance.now() - taps[taps.length - 1] > 2000) taps = []; }, 2100)); break;
      case 'pat': pat = +b.dataset.p; renderBody(); break;
      case 'copypat': { const to = (pat + 1) % M.PAT_COUNT; M.copyPattern(song, pat, to); pat = to; renderBody(); say(`Patroon gekopieerd naar ${M.PAT_NAMES[to]}.`); break; }
      case 'clrpat': M.clearPattern(song, pat); renderBody(); break;
      case 'sel': sel = +b.dataset.ti; renderBody(); break;
      case 'mute': { const x = song.tracks[+b.dataset.ti]; x.mute = !x.mute; renderBody(); break; }
      case 'solo': { const x = song.tracks[+b.dataset.ti]; x.solo = !x.solo; renderBody(); break; }
      case 'add': { const x = M.addTrack(song, b.dataset.k); if (x) { sel = song.tracks.length - 1; renderBody(); } break; }
      case 'clrtrack': M.clearTrack(song, pat, sel); renderBody(); break;
      case 'deltrack': if (M.removeTrack(song, sel)) { sel = Math.max(0, sel - 1); renderBody(); } break;
      case 'oct': t.oct = Math.max(-3, Math.min(3, t.oct + +b.dataset.d)); renderBody(); break;
      case 'chain': { song.chain[+b.dataset.q] = (song.chain[+b.dataset.q] + 1) % M.PAT_COUNT; renderBody(); break; }
      case 'chainadd': if (song.chain.length < M.MAX_CHAIN) { song.chain.push(song.chain[song.chain.length - 1] || 0); renderBody(); } break;
      case 'chaindel': if (song.chain.length > 1) { song.chain.pop(); renderBody(); } break;
      case 'preset': { const s = M.buildPreset(b.dataset.k); if (s) { mode = 'song'; replaceSong(s, `✔ “${M.PRESETS[b.dataset.k].label}” geladen. Druk op ▶!`); } break; }
      case 'slot': selSlot = +b.dataset.i; renderBody(); break;
      case 'save': { const name = ($('#mu-name').value || '').trim().slice(0, 30) || `Lied ${selSlot + 1}`; slots[selSlot] = { name, data: M.compactSong(song), saved: Date.now() }; say(persist() ? `✔ Opgeslagen in plek ${selSlot + 1}.` : 'Opslaan is niet gelukt (opslag is vol of uitgeschakeld).'); renderBody(); break; }
      case 'load': { const s = slots[selSlot]; if (!s) { say('Deze plek is leeg.'); break; } const n = M.sanitizeSong(s.data); if (!n) { say('Dit lied kon niet geladen worden.'); break; } replaceSong(n, `✔ “${s.name}” geladen.`); break; }
      case 'delslot': if (!slots[selSlot]) say('Deze plek is al leeg.'); else { slots[selSlot] = null; persist(); renderBody(); say(`Plek ${selSlot + 1} is leeg gemaakt.`); } break;
      case 'mkcode': { shareText = M.songToCode(song, ($('#mu-name') && $('#mu-name').value) || ''); const ta = $('#mu-code'); if (ta) ta.value = shareText; say('Code gemaakt! Kopieer hem en stuur hem door.'); break; }
      case 'copycode': { const ta = $('#mu-code'); const txt = (ta && ta.value) || shareText; if (!txt) { say('Maak eerst een code.'); break; } copyText(txt).then((ok) => say(ok ? '✔ Gekopieerd!' : 'Kopiëren lukt niet: selecteer de tekst zelf.')); break; }
      case 'usecode': { const r = M.codeToSong(($('#mu-code') || {}).value); if (!r) { say('Deze code klopt niet. Plak de hele code.'); break; } replaceSong(r.song, `✔ Lied${r.name ? ' “' + r.name + '”' : ''} geladen van de code.`); break; }
      case 'export': exportWav(); break;
      case 'lvl': level = +b.dataset.l; abortGame(); renderBody(); break;
      case 'gstart': startRound(false); break;
      case 'glisten': startRound(true); break;
      default: break;
    }
  }
  function randomize() {
    const rnd = (p) => Math.random() < p, len = song.len; prev = M.cloneSong(song);
    song.tracks.forEach((t, ti) => {
      const rows = M.blankRows(M.rowsFor(t));
      if (t.kind === 'drums') {
        t.kit.forEach((id, r) => { for (let s = 0; s < len; s++) {
          rows[r][s] = id === 'kick' || id === 'boem' ? (s % 4 === 0 ? rnd(0.85) : rnd(0.1)) : id === 'snare' || id === 'clap' || id === 'rim' ? (s % 8 === 4 ? rnd(0.85) : rnd(0.05)) : id === 'hat' || id === 'shaker' ? (s % 2 === 0 ? rnd(0.8) : rnd(0.25)) : rnd(id === 'open' && s % 4 === 2 ? 0.3 : 0.05); } });
      } else if (t.kind === 'mel') {
        let last = 3 + Math.floor(Math.random() * 3);
        for (let s = 0; s < len; s++) { if (!rnd(s % 2 === 0 ? 0.55 : 0.2)) continue; last = Math.max(0, Math.min(M.MEL_ROWS - 1, last + Math.floor(Math.random() * 5) - 2)); rows[last][s] = true; }
      } else {
        const prog = [0, 4, 5, 3, 0, 3, 4, 4, 1, 4, 0, 5], start = Math.floor(Math.random() * 4) * 0;
        const seg = len / 4; for (let k = 0; k < 4; k++) { const d = prog[(start + k + Math.floor(Math.random() * 3) * 4) % prog.length]; for (let s = Math.round(k * seg); s < Math.round((k + 1) * seg); s++) rows[d % 7][s] = true; }
      }
      song.pats[pat][ti] = rows;
    });
    renderBody(); say('🎲 Een nieuw patroon! Vind je hem mooi? Sla hem op bij “Lied”.');
  }

  build();
}
