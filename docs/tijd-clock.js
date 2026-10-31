// Tijd: de analoge klok (3D-look op canvas), het Klok-scherm en het leren van klokkijken.
import * as T from './tijd-core.js?v=1';
import { icon, GFX, makeCanvas, playScene, escHtml as esc } from './tools-ui.js?v=1';
import { softShadow, glow } from './gfx/fx.js?v=1';

const TAU = Math.PI * 2;

/**
 * Teken een analoge klok. t = { h, m, s } (s mag een kommagetal zijn). o = { numerals, minuteNums, seconds, hint:'uur'|'minuut', accent }
 */
export function drawAnalog(ctx, cx, cy, R, t, o = {}) {
  const q = GFX.q, dark = !!o.dark;
  // schaduw onder de klok
  if (q > 0) softShadow(ctx, cx, cy + R * 0.98, R * 0.9, R * 0.16, 0.3);
  // rand (metaal)
  let g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, '#f8fafc'); g.addColorStop(0.45, '#94a3b8'); g.addColorStop(1, '#334155');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
  g = ctx.createLinearGradient(cx + R, cy + R, cx - R, cy - R); g.addColorStop(0, '#e2e8f0'); g.addColorStop(1, '#475569');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 0.93, 0, TAU); ctx.fill();
  // wijzerplaat
  const fr = R * 0.88;
  g = ctx.createRadialGradient(cx - fr * 0.25, cy - fr * 0.3, fr * 0.1, cx, cy, fr);
  g.addColorStop(0, dark ? '#1e293b' : '#ffffff'); g.addColorStop(1, dark ? '#0f172a' : '#e8edf5');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, fr, 0, TAU); ctx.fill();
  const ink = dark ? '#e2e8f0' : '#1e293b';
  // streepjes
  for (let i = 0; i < 60; i++) {
    const a = i * TAU / 60, five = i % 5 === 0, r1 = fr * (five ? 0.82 : 0.9), r2 = fr * 0.96;
    ctx.strokeStyle = five ? ink : (dark ? '#64748b' : '#94a3b8'); ctx.lineWidth = five ? Math.max(2, R * 0.025) : Math.max(1, R * 0.01);
    ctx.beginPath(); ctx.moveTo(cx + Math.sin(a) * r1, cy - Math.cos(a) * r1); ctx.lineTo(cx + Math.sin(a) * r2, cy - Math.cos(a) * r2); ctx.stroke();
  }
  // cijfers
  if (o.numerals !== false) {
    ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `800 ${Math.round(R * 0.2)}px system-ui,sans-serif`;
    for (let i = 1; i <= 12; i++) { const a = i * TAU / 12; ctx.fillText(String(i), cx + Math.sin(a) * fr * 0.67, cy - Math.cos(a) * fr * 0.67); }
  }
  if (o.minuteNums) { // kleine minuutgetallen buiten de cijfers (5, 10, 15 ...)
    ctx.fillStyle = '#ef4444'; ctx.font = `700 ${Math.round(R * 0.085)}px system-ui,sans-serif`;
    for (let i = 1; i <= 12; i++) { const a = i * TAU / 12; ctx.fillText(String(i * 5 % 60 || 60), cx + Math.sin(a) * fr * 0.51, cy - Math.cos(a) * fr * 0.51); }
  }
  const ang = T.handAngles(t.h, t.m, t.s || 0);
  const hand = (deg, len, wd, color, tail = 0.12, sh = true) => {
    const a = deg * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a);
    if (sh && q > 0) { ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = wd; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - dx * len * tail + R * 0.02, cy - dy * len * tail + R * 0.035); ctx.lineTo(cx + dx * len + R * 0.02, cy + dy * len + R * 0.035); ctx.stroke(); }
    ctx.strokeStyle = color; ctx.lineWidth = wd; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - dx * len * tail, cy - dy * len * tail); ctx.lineTo(cx + dx * len, cy + dy * len); ctx.stroke();
  };
  hand(ang.hour, fr * 0.5, Math.max(4, R * 0.075), o.hint === 'uur' ? '#2563eb' : ink);
  hand(ang.minute, fr * 0.78, Math.max(3, R * 0.05), o.hint === 'minuut' ? '#dc2626' : ink);
  if (o.seconds) hand(ang.second, fr * 0.84, Math.max(1.5, R * 0.018), '#ef4444', 0.2);
  // middenkap
  g = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, R * 0.07); g.addColorStop(0, '#fff'); g.addColorStop(1, o.seconds ? '#ef4444' : '#475569');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, Math.max(4, R * 0.055), 0, TAU); ctx.fill();
  // glas-reflectie (Hoog/Ultra)
  if (q > 0) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, fr, 0, TAU); ctx.clip();
    g = ctx.createLinearGradient(cx - fr, cy - fr, cx + fr * 0.2, cy + fr * 0.5); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx - fr * 0.25, cy - fr * 0.45, fr * 0.8, fr * 0.45, -0.5, 0, TAU); ctx.fill();
    ctx.restore();
  }
  if (q === 2) glow(ctx, cx - R * 0.45, cy - R * 0.55, R * 0.35, '#ffffff', 0.18);
}

const DAYPART = (h) => (h < 6 ? ['moon', 'Goedenacht', '#0f172a,#312e81'] : h < 12 ? ['sun', 'Goedemorgen', '#38bdf8,#fde68a'] : h < 18 ? ['sun', 'Goedemiddag', '#3b82f6,#93c5fd'] : h < 22 ? ['moon', 'Goedenavond', '#4338ca,#f97316'] : ['moon', 'Goedenacht', '#0f172a,#312e81']);
const WEEKDAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

/** Tabblad "Klok": grote analoge en digitale klok met datum. */
export function nowTab(api) {
  const { body, track } = api;
  const d0 = new Date(), [ic, hi, grad] = DAYPART(d0.getHours());
  body.innerHTML = `<div class="tu-hero" data-hero style="background:linear-gradient(160deg,${grad.split(',')[0]},${grad.split(',')[1]})"><div class="tu-in" style="text-align:center;text-shadow:0 1px 4px rgba(0,0,0,.4)">
      <div data-clockhost style="height:min(78vw,320px);position:relative;margin:0 auto"></div>
      <div data-dig style="font-size:calc(3rem * var(--gfx-font,1));font-weight:800;font-variant-numeric:tabular-nums;line-height:1.1"></div>
      <div data-date style="font-size:1.15rem;font-weight:600"></div></div></div>
    <div class="tu-grid" data-facts style="margin-top:.7rem"></div>`;
  const host = body.querySelector('[data-clockhost]');
  const c = makeCanvas(host, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h); const d = new Date(), s = d.getSeconds() + (GFX.reduce ? 0 : d.getMilliseconds() / 1000);
    drawAnalog(ctx, w / 2, h / 2, Math.min(w, h) * 0.46, { h: d.getHours(), m: d.getMinutes(), s }, { seconds: true });
  }, { fps: GFX.reduce ? 2 : GFX.q ? 30 : 20 });
  track(c.stop);
  const upd = () => {
    const d = new Date(), wk = T.isoWeek(d);
    body.querySelector('[data-dig]').textContent = `${T.pad2(d.getHours())}:${T.pad2(d.getMinutes())}:${T.pad2(d.getSeconds())}`;
    body.querySelector('[data-date]').textContent = `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${T.MAANDEN[d.getMonth()]} ${d.getFullYear()}`;
    const dow = d.getDay(), toWeekend = dow === 6 || dow === 0 ? 0 : 6 - dow;
    const leap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0, yl = leap(d.getFullYear()) ? 366 : 365;
    const f = body.querySelector('[data-facts]');
    f.innerHTML = [
      ['book', `Week ${wk.week}`, 'van het jaar'], ['hourglass', `Dag ${T.dayOfYear(d)}`, `van ${yl}`],
      [dow === 6 || dow === 0 ? 'balloon' : 'calendar', dow === 6 || dow === 0 ? 'Weekend!' : `${toWeekend} ${toWeekend === 1 ? 'dag' : 'dagen'}`, dow === 6 || dow === 0 ? 'Geniet ervan' : 'tot het weekend'],
      [DAYPART(d.getHours())[0], DAYPART(d.getHours())[1], dutchLine(d)],
    ].map(([i, a, b]) => `<div class="tu-tile">${icon(i === 'calendar' ? 'ticket' : i, { size: 48 })}<span>${esc(a)}</span><small>${esc(b)}</small></div>`).join('');
  };
  const dutchLine = (d) => `Het is ${T.dutchTime(d.getHours(), d.getMinutes() - (d.getMinutes() % 5))}`.replace('Het is ', 'Ongeveer ');
  api.tickFns.push((now) => { if (now - (nowTab._l || 0) > 900) { nowTab._l = now; upd(); } });
  upd();
}

/** Tabblad "Klok leren": oefenrondes met lees-, woord-, zet- en rekenvragen. */
export function learnTab(api) {
  const { body, track, load, save } = api;
  let level = load('klok-niveau', 1), stats = load('klok-leren', { stars: [0, 0, 0, 0, 0], best: 0, right: 0, total: 0 });
  if (!stats.stars) stats.stars = [0, 0, 0, 0, 0];
  const persist = () => { save('klok-leren', stats); save('klok-niveau', level); };

  function menu() {
    track(() => {}); // niets te ruimen
    body.innerHTML = `<div class="tu-card" style="text-align:center">${icon('hourglass', { size: 72 })}<h2 style="margin:.2rem 0">Klokkijken leren</h2><p>Oefen in rondes van 10 vragen. Lees de klok, kies de goede tijd of zet de wijzers zelf.</p></div>
      ${T.CLOCK_LEVELS.map((n, i) => `<button class="tu-card" data-lv="${i + 1}" style="display:flex;align-items:center;gap:.8rem;width:100%;text-align:left"><span style="font-size:1.8rem;font-weight:800;min-width:2rem">${i + 1}</span><span style="flex:1"><b>${esc(n)}</b></span><span>${[0, 1, 2].map((k) => `<span style="opacity:${k < stats.stars[i] ? 1 : 0.22}">${icon('star', { size: 24 })}</span>`).join('')}</span></button>`).join('')}
      <p class="center"><small>Goed: ${stats.right} van ${stats.total} vragen.</small></p>`;
    body.querySelectorAll('[data-lv]').forEach((b) => { b.onclick = () => round(+b.dataset.lv); });
  }

  function round(L) {
    level = L; persist(); let i = 0, right = 0, q, setT, cvh, locked;
    const N = 10;
    const next = () => {
      if (i >= N) return done();
      q = T.makeClockQuestion(L); locked = false;
      setT = { h: 12, m: 0 };
      body.innerHTML = `<div class="tu-top"><button class="tu-big" data-quit style="min-height:48px">✕</button><b style="flex:1">Niveau ${L}: ${esc(T.CLOCK_LEVELS[L - 1])}</b><span class="tu-chip">${i + 1}/${N}</span></div><div class="tu-bar"><i style="width:${i * 100 / N}%"></i></div>
        <div class="tu-card" style="text-align:center"><div style="font-size:1.25rem;font-weight:800;margin-bottom:.4rem">${esc(q.prompt)}</div>
        ${q.type === 'duur' || q.type === 'dag24' ? (q.type === 'duur' ? '' : '') : '<div data-ch style="height:min(76vw,300px);margin:0 auto;position:relative;touch-action:none"></div>'}
        <div data-fb class="rk-fb" style="min-height:2.4rem;font-weight:700"></div><div data-opts></div></div>`;
      body.querySelector('[data-quit]').onclick = () => menu();
      const ch = body.querySelector('[data-ch]');
      if (ch) {
        const interactive = q.type === 'zet', timeShown = interactive ? setT : { h: q.h % 12 || 12, m: q.m };
        cvh = makeCanvas(ch, (ctx, w, h) => { ctx.clearRect(0, 0, w, h); const t = interactive ? setT : { h: q.h, m: q.m }; drawAnalog(ctx, w / 2, h / 2, Math.min(w, h) * 0.46, t, { minuteNums: L <= 3, hint: interactive ? 'minuut' : '' }); }, { fps: 20 });
        track(cvh.stop);
        if (interactive) bindDrag(cvh.cv, ch);
      }
      const opts = body.querySelector('[data-opts]');
      if (q.type === 'zet') {
        opts.innerHTML = `<div class="tu-row" style="justify-content:center"><button class="tu-big" data-hm>Uur −</button><b data-hl style="min-width:5.5rem;font-size:1.4rem">12:00</b><button class="tu-big" data-hp>Uur +</button></div><button class="tu-big pri" data-chk style="margin-top:.6rem">Controleer</button>`;
        const lab = () => { opts.querySelector('[data-hl]').textContent = `${setT.h}:${T.pad2(setT.m)}`; };
        opts.querySelector('[data-hm]').onclick = () => { setT.h = setT.h === 1 ? 12 : setT.h - 1; lab(); };
        opts.querySelector('[data-hp]').onclick = () => { setT.h = setT.h === 12 ? 1 : setT.h + 1; lab(); };
        opts.querySelector('[data-chk]').onclick = () => answer(setT, T.checkClockAnswer(q, setT));
        lab();
      } else {
        opts.innerHTML = `<div class="rk-ch" style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">${q.choices.map((c) => `<button class="tu-big" data-c="${esc(c)}" style="min-height:64px;font-size:1.15rem">${esc(c)}</button>`).join('')}</div>`;
        opts.querySelectorAll('[data-c]').forEach((b) => { b.onclick = () => answer(b.dataset.c, b.dataset.c === q.answer); });
      }
    };
    function bindDrag(cv, host) {
      let drag = false;
      const move = (e) => { const r = host.getBoundingClientRect(), x = (e.clientX ?? 0) - r.left - r.width / 2, y = (e.clientY ?? 0) - r.top - r.height / 2; const a = Math.atan2(x, -y) * 180 / Math.PI; const m = T.angleToMinute(a, L === 1 ? 5 : L === 2 ? 5 : L === 3 ? 5 : 1); const old = setT.m; setT.m = m; if (old > 45 && m < 15) setT.h = setT.h === 12 ? 1 : setT.h + 1; else if (old < 15 && m > 45) setT.h = setT.h === 1 ? 12 : setT.h - 1; const hl = body.querySelector('[data-hl]'); if (hl) hl.textContent = `${setT.h}:${T.pad2(setT.m)}`; };
      cv.addEventListener('pointerdown', (e) => { drag = true; try { cv.setPointerCapture(e.pointerId); } catch { /* stil */ } move(e); });
      cv.addEventListener('pointermove', (e) => { if (drag) move(e); });
      cv.addEventListener('pointerup', () => { drag = false; }); cv.addEventListener('pointercancel', () => { drag = false; });
    }
    function answer(given, ok) {
      if (locked) return; locked = true; stats.total++; if (ok) { stats.right++; right++; }
      const fb = body.querySelector('[data-fb]');
      fb.innerHTML = ok ? '<span class="tu-ok">Goed zo!</span>' : `<span class="tu-bad">Niet goed.</span> Het is ${q.type === 'zet' ? esc(T.dutchTime(q.h, q.m)) : esc(String(q.answer))}.`;
      body.querySelectorAll('[data-c]').forEach((b) => { if (b.dataset.c === q.answer) b.style.outline = '3px solid #16a34a'; else if (b.dataset.c === given) b.style.outline = '3px solid #dc2626'; });
      i++; persist(); api.later(next, ok ? 900 : 1900);
    }
    function done() {
      const st = right >= 9 ? 3 : right >= 7 ? 2 : right >= 6 ? 1 : 0, better = st > stats.stars[L - 1]; if (better) stats.stars[L - 1] = st; persist();
      body.innerHTML = `<div class="tu-card" style="text-align:center"><h2>Ronde klaar</h2><div class="tu-pop">${[0, 1, 2].map((k) => `<span style="opacity:${k < st ? 1 : 0.22}">${icon('star', { size: 56 })}</span>`).join('')}</div><div style="font-size:1.5rem;font-weight:800">${right} van ${N} goed</div>${better && st ? `<p class="tu-chip">Nieuwe beste score!</p>` : ''}</div>
        <div class="tu-row" style="justify-content:center"><button class="tu-big pri" data-again>Nog een keer</button>${L < 5 && st >= 1 ? '<button class="tu-big" data-up>Volgend niveau</button>' : ''}<button class="tu-big" data-menu>Menu</button></div>`;
      body.querySelector('[data-again]').onclick = () => round(L); body.querySelector('[data-menu]').onclick = menu; const up = body.querySelector('[data-up]'); if (up) up.onclick = () => round(L + 1);
      if (st === 3) playScene(document.body, 'victory', { title: 'Klokmeester!', sub: `Niveau ${L} perfect` });
    }
    next();
  }
  menu();
}
