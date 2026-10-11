// Tijd: wekker, kookwekker, stopwatch en focus (pomodoro). Alles draait in de browser; geluid via WebAudio.

const DAGEN = [['Ma', 1], ['Di', 2], ['Wo', 3], ['Do', 4], ['Vr', 5], ['Za', 6], ['Zo', 0]]; // [label, Date.getDay()]
const dagNaam = (d) => (DAGEN.find((x) => x[1] === d) || ['?'])[0];
const pad = (n) => String(n).padStart(2, '0');

// ---------- pure hulpfuncties (ook voor tests) ----------

/** Formatteer milliseconden als mm:ss, of hh:mm:ss vanaf een uur. Rondt naar beneden af. */
export function fmt(ms) {
  const s = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`;
}

/** Stopwatch-formaat mm:ss.cc (honderdsten). */
export function fmtCs(ms) {
  const t = Math.max(0, Math.floor((Number(ms) || 0) / 10));
  const cs = t % 100, s = Math.floor(t / 100);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return `${h > 0 ? pad(h) + ':' : ''}${pad(m)}:${pad(r)}.${pad(cs)}`;
}

/**
 * Eerstvolgende afgaan van een wekker, strikt na nowDate. alarm = { time:'HH:MM', days:[0..6] } met 0 = zondag
 * (Date.getDay). Lege days = elke dag/eenmalig het eerstvolgende moment. Geeft Date of null bij ongeldige tijd.
 */
export function nextAlarmTime(alarm, nowDate) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String((alarm && alarm.time) || ''));
  if (!m) return null;
  const h = +m[1], mi = +m[2];
  if (h > 23 || mi > 59) return null;
  const days = Array.isArray(alarm.days) ? alarm.days.filter((d) => d >= 0 && d <= 6) : [];
  const now = nowDate instanceof Date ? nowDate : new Date(nowDate);
  for (let i = 0; i <= 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, h, mi, 0, 0);
    if (d.getTime() > now.getTime() && (!days.length || days.includes(d.getDay()))) return d;
  }
  return null;
}

// ---------- module ----------

export function tijdView(ctx) {
  const { view, esc, uid, addCleanup } = ctx;
  const K = (n) => `tijd:${uid}:${n}`;
  const load = (n, def) => { try { const v = JSON.parse(localStorage.getItem(K(n))); return v == null ? def : v; } catch { return def; } };
  const save = (n, v) => { try { localStorage.setItem(K(n), JSON.stringify(v)); } catch {} };
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const newId = () => Math.random().toString(36).slice(2, 9);

  let alive = true, tab = 'wekker';
  const timeouts = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timeouts.delete(t); if (alive) fn(); }, ms); timeouts.add(t); return t; };

  // ----- audio -----
  let ac = null, master = null;
  const ensure = () => {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = 0.8; master.connect(ac.destination); } catch { return false; } }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return true;
  };
  const unlock = () => { ensure(); };
  view.addEventListener('pointerdown', unlock, true);
  view.addEventListener('keydown', unlock, true);
  // Zachte klokkende noot
  function note(freq, at, dur, vol) {
    if (!ac) return;
    const t = ac.currentTime + at, g = ac.createGain(), o = ac.createOscillator(), o2 = ac.createOscillator(), g2 = ac.createGain();
    o.type = 'sine'; o.frequency.value = freq; o2.type = 'sine'; o2.frequency.value = freq * 2; g2.gain.value = 0.25;
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(master);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  const chime = (vol = 0.3) => { if (!ac || ac.state !== 'running') ensure(); if (!ac) return; [523.25, 659.25, 783.99].forEach((f, i) => note(f, i * 0.22, 1.1, vol)); };
  const soft = (vol = 0.2) => { ensure(); if (!ac) return; note(659.25, 0, 0.9, vol); note(880, 0.25, 1.1, vol * 0.9); };
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

  // ----- hoofdlus: elke 50 ms, gebaseerd op echte klok -----
  let lastTick = Date.now();
  const tickFns = [];
  const iv = setInterval(() => {
    if (!alive) return;
    const now = Date.now();
    try { checkAlarms(now); checkTimers(now); checkFocus(now); } catch {}
    lastTick = now;
    tickFns.forEach((f) => { try { f(now); } catch {} });
  }, 50);

  // =====================================================================
  // WEKKER
  // =====================================================================
  let wekkers = load('wekkers', []);
  if (!Array.isArray(wekkers)) wekkers = [];
  const saveWekkers = () => save('wekkers', wekkers);
  let ringing = null;   // { label, started, el, loop }
  let snooze = null;    // { label, at }
  let draft = { time: '07:00', label: '', days: [1, 2, 3, 4, 5] };

  function checkAlarms(now) {
    if (snooze && now >= snooze.at && !ringing) { const l = snooze.label; snooze = null; ring(l); }
    if (ringing) return;
    for (const a of wekkers) {
      if (!a.on) continue;
      const n = nextAlarmTime(a, new Date(lastTick));
      // Alleen afgaan binnen 10 minuten na het moment (anders is de wekker te laat om nog nuttig te zijn)
      if (n && n.getTime() <= now && now - n.getTime() < 10 * 60 * 1000) {
        if (!a.days || !a.days.length) { a.on = false; saveWekkers(); if (tab === 'wekker') renderTab(); }
        ring(a.label || 'Wekker');
        return;
      }
    }
  }
  function ring(label) {
    const el = document.createElement('div');
    el.setAttribute('role', 'alertdialog');
    el.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:rgba(30,41,59,.92)';
    const d = new Date();
    el.innerHTML = `<div style="background:var(--card,#fff);color:var(--ink,#222);border-radius:24px;padding:2rem 1.5rem;max-width:380px;width:100%;text-align:center;box-shadow:0 10px 40px #0006">
      <div style="font-size:3rem">⏰</div><h1 style="margin:.2rem 0">Wekker!</h1>
      <div style="font-size:3.4rem;font-weight:700;font-variant-numeric:tabular-nums">${pad(d.getHours())}:${pad(d.getMinutes())}</div>
      <p style="font-size:1.2rem;margin:.4rem 0 1.4rem">${esc(label)}</p>
      <div class="row wrap" style="justify-content:center"><button data-a="snooze" style="font-size:1.1rem;padding:.9rem 1.2rem">Sluimer 5 min</button><button data-a="stop" class="pri" style="font-size:1.1rem;padding:.9rem 1.6rem">Stop</button></div></div>`;
    document.body.appendChild(el);
    ringing = { label, started: Date.now(), el, loop: null };
    const play = () => { const secs = (Date.now() - ringing.started) / 1000; chime(Math.min(0.7, 0.12 + secs * 0.02)); };
    play(); ringing.loop = setInterval(() => { if (alive && ringing) { play(); buzz(200); } }, 2600);
    buzz([300, 150, 300]);
    el.querySelector('[data-a="stop"]').onclick = () => { stopRinging(); };
    el.querySelector('[data-a="snooze"]').onclick = () => { const l = ringing.label; stopRinging(); snooze = { label: l, at: Date.now() + 5 * 60 * 1000 }; if (tab === 'wekker') renderTab(); };
    try { el.querySelector('[data-a="stop"]').focus(); } catch {}
  }
  function stopRinging() {
    if (!ringing) return;
    clearInterval(ringing.loop); try { ringing.el.remove(); } catch {} ringing = null;
    try { navigator.vibrate && navigator.vibrate(0); } catch {}
    if (tab === 'wekker') renderTab();
  }

  function daysText(a) {
    if (!a.days || !a.days.length) return 'Eenmalig';
    if (a.days.length === 7) return 'Elke dag';
    return DAGEN.filter((d) => a.days.includes(d[1])).map((d) => d[0]).join(' ');
  }
  function nextText(a) {
    if (!a.on) return 'Uit';
    const n = nextAlarmTime(a, new Date());
    if (!n) return 'Ongeldige tijd';
    const diff = n.getTime() - Date.now(), mins = Math.round(diff / 60000);
    const h = Math.floor(mins / 60), m = mins % 60;
    return `Over ${h > 0 ? h + ' u ' : ''}${m} min (${dagNaam(n.getDay())})`;
  }
  const dayChips = (sel, attr) => `<div class="row wrap" style="gap:.3rem;margin:.3rem 0">${DAGEN.map(([l, d]) => `<button ${attr}="${d}" class="${sel.includes(d) ? 'pri' : ''}" style="padding:.35rem .6rem;min-width:2.6rem">${l}</button>`).join('')}</div>`;

  function renderWekker(body) {
    body.innerHTML = `
      <div class="box"><b>Nieuwe wekker</b>
        <div class="row wrap" style="margin-top:.4rem"><input type="time" id="w-time" value="${draft.time}" style="font-size:2rem;padding:.3rem .5rem;border-radius:12px"><input id="w-label" placeholder="Naam (bijv. Opstaan)" maxlength="40" value="${esc(draft.label)}" style="flex:1;min-width:8rem"></div>
        ${dayChips(draft.days, 'data-nd')}
        <div class="row wrap"><button id="w-add" class="pri">Wekker toevoegen</button><small>Geen dag gekozen = eenmalig</small></div></div>
      ${snooze ? `<div class="box"><span class="chip">😴 Gesluimerd</span> <span id="w-snz"></span> <button id="w-snz-x">Annuleer</button></div>` : ''}
      <div class="box"><b>Jouw wekkers</b>${wekkers.length ? '' : '<p><small>Nog geen wekkers.</small></p>'}
        ${wekkers.map((a) => `<div data-w="${a.id}" style="border-top:1px solid var(--line,#ddd);padding:.6rem 0;${a.on ? '' : 'opacity:.6'}">
          <div class="row" style="justify-content:space-between;align-items:center">
            <div><div style="font-size:2.4rem;font-weight:700;font-variant-numeric:tabular-nums;line-height:1">${esc(a.time)}</div><div>${esc(a.label || 'Wekker')}</div></div>
            <div class="row"><button data-tg="${a.id}" class="${a.on ? 'pri' : ''}" style="min-width:4rem">${a.on ? 'Aan' : 'Uit'}</button><button data-rm="${a.id}" aria-label="Verwijder">🗑</button></div></div>
          ${dayChips(a.days || [], `data-d="${a.id}"`)}
          <small>${daysText(a)} · <span data-nx="${a.id}">${esc(nextText(a))}</span></small></div>`).join('')}
      </div>
      <p class="center"><small>De wekker werkt alleen als deze app open staat.</small></p>`;
    const q = (s) => body.querySelector(s);
    q('#w-time').onchange = (e) => { draft.time = e.target.value || draft.time; };
    q('#w-label').oninput = (e) => { draft.label = e.target.value; };
    body.querySelectorAll('[data-nd]').forEach((b) => b.onclick = () => { const d = +b.dataset.nd; draft.days = draft.days.includes(d) ? draft.days.filter((x) => x !== d) : [...draft.days, d]; b.classList.toggle('pri'); });
    q('#w-add').onclick = () => {
      const time = q('#w-time').value; if (!time) return;
      draft.time = time; draft.label = q('#w-label').value.trim();
      wekkers.push({ id: newId(), time, label: draft.label, days: [...draft.days], on: true }); saveWekkers(); draft.label = ''; unlock(); renderTab();
    };
    body.querySelectorAll('[data-tg]').forEach((b) => b.onclick = () => { const a = wekkers.find((x) => x.id === b.dataset.tg); if (a) { a.on = !a.on; saveWekkers(); unlock(); renderTab(); } });
    body.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { wekkers = wekkers.filter((x) => x.id !== b.dataset.rm); saveWekkers(); renderTab(); });
    // dagknoppen per wekker: attribuut data-d bevat het id; de dag zit in de volgorde van de knoppen
    body.querySelectorAll('[data-w]').forEach((row) => {
      const a = wekkers.find((x) => x.id === row.dataset.w); if (!a) return;
      row.querySelectorAll('button[data-d]').forEach((b, i) => b.onclick = () => {
        const d = DAGEN[i][1]; a.days = (a.days || []).includes(d) ? a.days.filter((x) => x !== d) : [...(a.days || []), d]; saveWekkers(); renderTab();
      });
    });
    const x = q('#w-snz-x'); if (x) x.onclick = () => { snooze = null; renderTab(); };
    let lastNx = 0;
    tickFns.push((now) => {
      if (now - lastNx < 1000) return; lastNx = now;
      body.querySelectorAll('[data-nx]').forEach((el) => { const a = wekkers.find((w) => w.id === el.dataset.nx); if (a) el.textContent = nextText(a); });
      const s = q('#w-snz'); if (s && snooze) s.textContent = `weer over ${fmt(snooze.at - now + 999)}`;
    });
  }

  // =====================================================================
  // KOOKWEKKER
  // =====================================================================
  // timer: { id, name, total, end (ms tijdstempel of null), left (ms bij pauze), done }
  let timers = load('timers', []);
  if (!Array.isArray(timers)) timers = [];
  const saveTimers = () => save('timers', timers);
  let tName = '';
  const tLeft = (t, now) => t.done ? 0 : t.end ? Math.max(0, t.end - now) : t.left;
  // timers die al afgelopen waren terwijl de app dicht was: markeer stil als klaar
  { const now = Date.now(); timers.forEach((t) => { if (t.end && t.end <= now) { t.done = true; t.end = null; t.left = 0; t.quiet = true; } }); saveTimers(); }

  function checkTimers(now) {
    let changed = false;
    timers.forEach((t) => {
      if (t.end && !t.done && t.end <= now) {
        t.done = true; t.end = null; t.left = 0; changed = true;
        chime(0.45); later(() => chime(0.45), 2600); buzz([400, 200, 400, 200, 400]);
      }
    });
    if (changed) { saveTimers(); if (tab === 'kook') renderTab(); }
  }
  function addTimer(min, name) {
    const total = Math.round(min * 60000); if (!(total > 0)) return;
    timers.push({ id: newId(), name: name || '', total, end: Date.now() + total, left: total, done: false });
    saveTimers(); unlock(); renderTab();
  }
  function renderKook(body) {
    body.innerHTML = `
      <div class="box"><b>Nieuwe kookwekker</b>
        <input id="k-name" placeholder="Naam (bijv. Eieren)" maxlength="40" value="${esc(tName)}" style="width:100%;box-sizing:border-box;margin:.4rem 0">
        <div class="row wrap">${[1, 3, 5, 10, 15, 30].map((m) => `<button data-q="${m}">${m} min</button>`).join('')}</div>
        <div class="row wrap" style="margin-top:.4rem"><input id="k-min" type="number" inputmode="decimal" min="0.1" step="any" placeholder="Eigen minuten" style="width:9rem"><button id="k-go" class="pri">Start</button></div></div>
      ${timers.length ? '' : '<p class="center"><small>Geen lopende timers. Kies hierboven een tijd.</small></p>'}
      ${timers.map((t) => `<div class="box" data-t="${t.id}" style="${t.done ? 'border-color:var(--accent,#6366f1)' : ''}">
        <div class="row" style="justify-content:space-between"><b>${esc(t.name || 'Timer')}</b><small>${fmt(t.total)}</small></div>
        <div class="center" data-tl="${t.id}" style="font-size:3rem;font-weight:700;font-variant-numeric:tabular-nums;margin:.2rem 0">${fmt(tLeft(t, Date.now()) + (t.end ? 999 : 0))}</div>
        <div style="height:8px;background:var(--line,#ddd);border-radius:6px;overflow:hidden"><div data-tb="${t.id}" style="height:100%;background:var(--accent,#6366f1);width:0"></div></div>
        <div class="row wrap center" style="justify-content:center;margin-top:.6rem">
          ${t.done ? '<span class="chip">✅ Klaar!</span>' : t.end ? `<button data-pa="${t.id}">⏸ Pauze</button>` : `<button data-re="${t.id}" class="pri">▶ Hervat</button>`}
          <button data-rs="${t.id}">↺ Reset</button><button data-rm="${t.id}">✕ Weg</button></div></div>`).join('')}`;
    const q = (s) => body.querySelector(s);
    const name = () => q('#k-name').value.trim();
    q('#k-name').oninput = (e) => { tName = e.target.value; };
    body.querySelectorAll('[data-q]').forEach((b) => b.onclick = () => { addTimer(+b.dataset.q, name()); tName = ''; renderTab(); });
    q('#k-go').onclick = () => { const v = parseFloat(String(q('#k-min').value).replace(',', '.')); if (v > 0 && v <= 1440) { addTimer(v, name()); tName = ''; renderTab(); } else q('#k-min').focus(); };
    const find = (id) => timers.find((t) => t.id === id);
    body.querySelectorAll('[data-pa]').forEach((b) => b.onclick = () => { const t = find(b.dataset.pa); if (t && t.end) { t.left = Math.max(0, t.end - Date.now()); t.end = null; saveTimers(); renderTab(); } });
    body.querySelectorAll('[data-re]').forEach((b) => b.onclick = () => { const t = find(b.dataset.re); if (t && !t.end) { t.end = Date.now() + t.left; saveTimers(); unlock(); renderTab(); } });
    body.querySelectorAll('[data-rs]').forEach((b) => b.onclick = () => { const t = find(b.dataset.rs); if (t) { t.done = false; t.quiet = false; t.left = t.total; t.end = null; saveTimers(); renderTab(); } });
    body.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { timers = timers.filter((t) => t.id !== b.dataset.rm); saveTimers(); renderTab(); });
    tickFns.push((now) => {
      timers.forEach((t) => {
        const l = tLeft(t, now), el = body.querySelector(`[data-tl="${t.id}"]`), bar = body.querySelector(`[data-tb="${t.id}"]`);
        if (el) el.textContent = fmt(t.done ? 0 : t.end ? l + 999 : l);
        if (bar) bar.style.width = `${Math.min(100, Math.max(0, 100 * (1 - l / t.total)))}%`;
      });
    });
  }

  // =====================================================================
  // STOPWATCH
  // =====================================================================
  let sw = { running: false, start: 0, acc: 0, laps: [] };   // laps: cumulatieve tijden in ms
  const swElapsed = () => sw.acc + (sw.running ? performance.now() - sw.start : 0);
  function renderStop(body) {
    const lapHtml = () => {
      if (!sw.laps.length) return '<p><small>Nog geen rondes.</small></p>';
      const parts = sw.laps.map((c, i) => c - (i ? sw.laps[i - 1] : 0));
      const min = Math.min(...parts), max = Math.max(...parts);
      return parts.map((p, i) => ({ p, i })).reverse().map(({ p, i }) => {
        const tag = parts.length > 1 && p === min ? '<span class="chip" style="background:#bbf7d0">Snelste</span>' : parts.length > 1 && p === max ? '<span class="chip" style="background:#fecaca">Langzaamste</span>' : '';
        return `<div class="row" style="justify-content:space-between;border-top:1px solid var(--line,#ddd);padding:.4rem 0;font-variant-numeric:tabular-nums"><span>Ronde ${i + 1}</span><span>${tag}</span><b>${fmtCs(p)}</b><small>${fmtCs(sw.laps[i])}</small></div>`;
      }).join('');
    };
    body.innerHTML = `<div class="box center">
      <div id="s-t" style="font-size:3.6rem;font-weight:700;font-variant-numeric:tabular-nums;margin:.4rem 0">${fmtCs(swElapsed())}</div>
      <div class="row wrap" style="justify-content:center"><button id="s-go" class="pri" style="min-width:6rem">${sw.running ? '⏸ Stop' : sw.acc ? '▶ Verder' : '▶ Start'}</button><button id="s-lap" ${sw.running ? '' : 'disabled'}>⚑ Ronde</button><button id="s-rs" ${sw.acc || sw.running ? '' : 'disabled'}>↺ Reset</button></div></div>
      <div class="box"><b>Rondetijden</b><div id="s-laps">${lapHtml()}</div></div>`;
    const q = (s) => body.querySelector(s);
    q('#s-go').onclick = () => { if (sw.running) { sw.acc += performance.now() - sw.start; sw.running = false; } else { sw.start = performance.now(); sw.running = true; } renderTab(); };
    q('#s-lap').onclick = () => { if (!sw.running) return; sw.laps.push(swElapsed()); q('#s-laps').innerHTML = lapHtml(); };
    q('#s-rs').onclick = () => { sw = { running: false, start: 0, acc: 0, laps: [] }; renderTab(); };
    tickFns.push(() => { const el = q('#s-t'); if (el) el.textContent = fmtCs(swElapsed()); });
  }

  // =====================================================================
  // FOCUS (pomodoro)
  // =====================================================================
  let cfg = Object.assign({ f: 25, s: 5, l: 15 }, load('focus-duur', {}));
  const saveCfg = () => save('focus-duur', cfg);
  let fo = { mode: 'f', end: null, left: cfg.f * 60000, cycle: 0 };   // cycle: afgeronde focusrondes in deze reeks
  const modeLabel = { f: 'Focus', s: 'Korte pauze', l: 'Lange pauze' };
  const modeMs = (m) => Math.max(1, cfg[m]) * 60000;
  const foLeft = (now) => fo.end ? Math.max(0, fo.end - now) : fo.left;
  function teller() { const t = load('focus-teller', {}); return t && t.dag === todayKey() ? t.n || 0 : 0; }
  const bumpTeller = () => save('focus-teller', { dag: todayKey(), n: teller() + 1 });
  function checkFocus(now) {
    if (!fo.end || fo.end > now) return;
    if (fo.mode === 'f') { bumpTeller(); fo.cycle++; fo.mode = fo.cycle % 4 === 0 ? 'l' : 's'; } else fo.mode = 'f';
    fo.end = null; fo.left = modeMs(fo.mode);
    soft(0.25); buzz([200, 100, 200]);
    if (tab === 'focus') renderTab();
  }
  const R = 90, C = 2 * Math.PI * R;
  function renderFocus(body) {
    const now = Date.now(), colour = fo.mode === 'f' ? 'var(--accent,#6366f1)' : '#34d399';
    body.innerHTML = `<div class="box center">
      <span class="chip">${modeLabel[fo.mode]}</span>
      <div style="position:relative;width:240px;max-width:80%;margin:.6rem auto">
        <svg viewBox="0 0 200 200" width="100%" aria-hidden="true"><circle cx="100" cy="100" r="${R}" fill="none" stroke="var(--line,#ddd)" stroke-width="12"/>
          <circle id="f-ring" cx="100" cy="100" r="${R}" fill="none" stroke="${colour}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="0" transform="rotate(-90 100 100)"/></svg>
        <div id="f-t" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:2.8rem;font-weight:700;font-variant-numeric:tabular-nums">${fmt(foLeft(now))}</div></div>
      <div class="row wrap" style="justify-content:center"><button id="f-go" class="pri" style="min-width:7rem">${fo.end ? '⏸ Pauze' : '▶ Start'}</button><button id="f-skip">⏭ Sla over</button><button id="f-rs">↺ Reset</button></div>
      <p>Vandaag afgerond: <b id="f-n">${teller()}</b> ${teller() === 1 ? 'ronde' : 'rondes'}</p>
      <small>Ronde ${(fo.cycle % 4) + (fo.mode === 'f' ? 1 : 0)} van 4 · na 4 rondes volgt een lange pauze</small></div>
      <div class="box"><b>Duur (minuten)</b>
        ${[['f', 'Focus'], ['s', 'Korte pauze'], ['l', 'Lange pauze']].map(([k, l]) => `<div class="row" style="justify-content:space-between;align-items:center;margin:.3rem 0"><span>${l}</span>
          <span class="row" style="align-items:center"><button data-st="${k}" data-dl="-1" aria-label="Minder">−</button><b style="min-width:2.2rem;text-align:center">${cfg[k]}</b><button data-st="${k}" data-dl="1" aria-label="Meer">+</button></span></div>`).join('')}</div>`;
    const q = (s) => body.querySelector(s);
    q('#f-go').onclick = () => { if (fo.end) { fo.left = foLeft(Date.now()); fo.end = null; } else { fo.end = Date.now() + fo.left; unlock(); } renderTab(); };
    q('#f-skip').onclick = () => { fo.end = null; if (fo.mode === 'f') { fo.mode = (fo.cycle + 1) % 4 === 0 ? 'l' : 's'; fo.cycle++; } else fo.mode = 'f'; fo.left = modeMs(fo.mode); renderTab(); };
    q('#f-rs').onclick = () => { fo = { mode: 'f', end: null, left: modeMs('f'), cycle: 0 }; renderTab(); };
    body.querySelectorAll('[data-st]').forEach((b) => b.onclick = () => {
      const k = b.dataset.st; cfg[k] = Math.min(120, Math.max(1, cfg[k] + +b.dataset.dl)); saveCfg();
      if (k === fo.mode && !fo.end) fo.left = modeMs(k); renderTab();
    });
    tickFns.push((n) => {
      const l = foLeft(n), tot = modeMs(fo.mode), ring = q('#f-ring'), t = q('#f-t');
      if (t) t.textContent = fmt(fo.end ? l + 999 : l);
      if (ring) ring.setAttribute('stroke-dashoffset', String(C * Math.min(1, Math.max(0, 1 - l / tot))));
      const c = q('#f-n'); if (c) c.textContent = String(teller());
    });
  }

  // =====================================================================
  // schil
  // =====================================================================
  const TABS = [['wekker', '⏰ Wekker'], ['kook', '🍳 Kookwekker'], ['stop', '⏱ Stopwatch'], ['focus', '🎯 Focus']];
  view.innerHTML = `<div class="row wrap" id="tj-tabs" style="margin-bottom:.4rem"></div><div id="tj-body"></div>`;
  function renderTab() {
    tickFns.length = 0;
    view.querySelector('#tj-tabs').innerHTML = TABS.map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'pri' : ''}" style="flex:1;white-space:nowrap">${l}</button>`).join('');
    view.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; unlock(); renderTab(); });
    const body = view.querySelector('#tj-body');
    ({ wekker: renderWekker, kook: renderKook, stop: renderStop, focus: renderFocus })[tab](body);
    const now = Date.now(); tickFns.forEach((f) => { try { f(now); } catch {} });
  }
  renderTab();

  addCleanup(() => {
    alive = false; clearInterval(iv);
    timeouts.forEach(clearTimeout); timeouts.clear();
    if (ringing) { clearInterval(ringing.loop); try { ringing.el.remove(); } catch {} ringing = null; }
    view.removeEventListener('pointerdown', unlock, true); view.removeEventListener('keydown', unlock, true);
    try { navigator.vibrate && navigator.vibrate(0); } catch {}
    try { ac && ac.close(); } catch {} ac = null;
  });
}
