// Rekenmachine, eenheden, valuta, procent, fooi en datum (de oorspronkelijke Rekenen-app), nu als gereedschapskist-tab.
import { evaluate, convert, daysBetween, addDays, ageBetween, CATS, toUTC, DAY } from './rekenen-calc.js?v=1';
/* ---------- Opmaak ---------- */
const fmt = (n, max = 6) => (Number.isFinite(n) ? n.toLocaleString('nl-NL', { maximumFractionDigits: max }) : '–');
const eur = (n) => n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' });
const raw = (n) => n.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 10 }).replace('.', ',');
const num = (s) => { s = String(s ?? '').trim().replace(/\s/g, ''); if (!s) return NaN; if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.'); return Number(s); };
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const longDate = (iso) => new Date(toUTC(iso)).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const plural = (n, e, m) => `${n} ${Math.abs(n) === 1 ? e : m}`;

/* ---------- Valuta ---------- */
const FX_URL = 'https://api.frankfurter.dev/v1/latest?base=EUR';
const FX_KEY = 'rekenen_fx_v1';
const CUR = { EUR: 'Euro', USD: 'Amerikaanse dollar', GBP: 'Brits pond', CHF: 'Zwitserse frank', JPY: 'Japanse yen', CAD: 'Canadese dollar', AUD: 'Australische dollar', SEK: 'Zweedse kroon', NOK: 'Noorse kroon', DKK: 'Deense kroon', PLN: 'Poolse zloty', TRY: 'Turkse lira', CZK: 'Tsjechische kroon', HUF: 'Hongaarse forint', CNY: 'Chinese yuan', INR: 'Indiase roepie' };

/* ---------- View ---------- */
const INP = 'width:100%;box-sizing:border-box;padding:.6rem .7rem;border:1px solid var(--line);border-radius:10px;font:inherit;font-size:1.05rem;background:var(--card);color:inherit';
const lbl = (t, inner) => `<label style="display:block;flex:1;min-width:7rem"><small>${t}</small>${inner}</label>`;
const input = (k, ph = '', val = '') => `<input data-k="${k}" inputmode="decimal" autocomplete="off" placeholder="${ph}" value="${val}" style="${INP}">`;
const dateIn = (k, val) => `<input data-k="${k}" type="date" value="${val}" style="${INP}">`;
const big = (id) => `<div data-out="${id}" style="font-size:1.4rem;font-weight:800;margin-top:.5rem;line-height:1.35"></div>`;

export function toolsView(ctx) {
  const { view, esc, addCleanup } = ctx;
  let tab = 'calc', dead = false;
  addCleanup(() => { dead = true; });

  // rekenmachine
  let expr = '', fresh = false, memory = 0, calcErr = '', history = [];
  // eenheden
  let ucat = 'lengte', uval = '1', ufrom = CATS.lengte.def[0], uto = CATS.lengte.def[1];
  // valuta
  let fx = null, fxState = 'laden', camount = '100', cfrom = 'EUR', cto = 'USD';
  // fooi
  let bill = '', tipPct = 10, tipOwn = '', people = 2, roundUp = false, tipCustom = false;
  // procent / datum
  const keep = {};

  try { const c = JSON.parse(localStorage.getItem(FX_KEY) || 'null'); if (c && c.rates) fx = c; } catch {}
  loadFx();

  async function loadFx() {
    try {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch(FX_URL, { signal: ctl.signal }); clearTimeout(to);
      if (!r.ok) throw new Error('http');
      const j = await r.json();
      if (!j || !j.rates) throw new Error('data');
      fx = { date: j.date, rates: { EUR: 1, ...j.rates }, saved: Date.now() };
      try { localStorage.setItem(FX_KEY, JSON.stringify(fx)); } catch {}
      fxState = 'live';
    } catch { fxState = fx ? 'cache' : 'geen'; }
    if (!dead && tab === 'fx') draw();
  }

  /* ----- tabs ----- */
  const TABS = [['calc', '🧮 Rekenmachine'], ['unit', '📏 Eenheden'], ['fx', '💱 Valuta'], ['pct', '％ Procent'], ['tip', '🍽️ Fooi & delen'], ['date', '📅 Datum']];

  function draw() {
    view.innerHTML = `<div class="row wrap">${TABS.map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'pri' : ''}" style="flex:1 1 30%">${l}</button>`).join('')}</div><div data-body></div>`;
    view.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; draw(); });
    const body = view.querySelector('[data-body]');
    ({ calc: drawCalc, unit: drawUnit, fx: drawFx, pct: drawPct, tip: drawTip, date: drawDate })[tab](body);
  }
  const out = (root, id, html) => { const e = root.querySelector(`[data-out="${id}"]`); if (e) e.innerHTML = html; };
  const onChange = (root, fn) => { root.querySelectorAll('input,select').forEach((e) => { e.oninput = fn; e.onchange = fn; }); };

  /* ----- 1. rekenmachine ----- */
  const shown = (s) => s.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−');
  function autoClose(s) { const o = (s.match(/\(/g) || []).length - (s.match(/\)/g) || []).length; return o > 0 ? s + ')'.repeat(o) : s; }
  function tryEval() { try { return { v: evaluate(autoClose(expr)) }; } catch (e) { return { e: e.message }; } }
  const trailingOp = () => /[+\-−×÷*/(]$/.test(expr);

  function press(k) {
    calcErr = '';
    const isDigit = /^[0-9,]$/.test(k);
    if (fresh) { if (isDigit || k === '(') expr = ''; fresh = false; }
    if (isDigit) {
      if (k === ',') { const last = expr.match(/[0-9,]*$/)[0]; if (last.includes(',')) return refresh(); if (!last) expr += '0'; }
      if (/\)$|%$/.test(expr)) expr += '×';
      expr += k;
    } else if ('+−×÷'.includes(k)) {
      if (!expr) { if (k === '−') expr = '−'; }
      else if (/[+−×÷]$/.test(expr)) { if (!(expr.length === 1 && expr === '−')) expr = expr.slice(0, -1) + k; }
      else if (expr.endsWith('(')) { if (k === '−') expr += k; }
      else expr += k;
    } else if (k === '%') { if (expr && !trailingOp()) expr += '%'; }
    else if (k === '(') { if (/[0-9,)%]$/.test(expr)) expr += '×'; expr += '('; }
    else if (k === ')') { if (/[0-9,)%]$/.test(expr) && (expr.match(/\(/g) || []).length > (expr.match(/\)/g) || []).length) expr += ')'; }
    else if (k === 'C') expr = '';
    else if (k === '⌫') expr = expr.slice(0, -1);
    else if (k === '±') {
      const m = expr.match(/\(−([0-9,]+)$/);
      if (m) expr = expr.slice(0, -m[0].length) + m[1];
      else { const n = expr.match(/[0-9,]+$/); if (n) expr = expr.slice(0, -n[0].length) + '(−' + n[0]; else if (!expr || trailingOp()) expr += '(−'; }
    } else if (k === '=') {
      if (!expr) return refresh();
      const r = tryEval();
      if (r.e) calcErr = r.e;
      else { history.unshift({ expr: autoClose(expr), res: r.v }); history = history.slice(0, 10); expr = raw(r.v); fresh = true; }
    } else if (k === 'MC') memory = 0;
    else if (k === 'MR') { if (fresh) { expr = ''; fresh = false; } if (/[0-9,)%]$/.test(expr)) expr += '×'; expr += memory < 0 ? `(−${raw(-memory)})` : raw(memory); }
    else if (k === 'M+' || k === 'M−') {
      const r = tryEval();
      if (r.e) calcErr = r.e; else memory = Number((memory + (k === 'M+' ? r.v : -r.v)).toPrecision(12));
    }
    refresh();
  }

  function refresh() {
    const root = view.querySelector('[data-calc]'); if (!root) return;
    const r = expr ? tryEval() : null;
    root.querySelector('[data-expr]').textContent = expr ? shown(expr) : '0';
    const prev = root.querySelector('[data-prev]');
    prev.className = calcErr ? 'err' : '';
    prev.textContent = calcErr || (r && r.v !== undefined && !fresh && /[+\-−×÷%()]/.test(expr.replace(/^−/, '')) ? '= ' + fmt(r.v, 10) : ' ');
    const mc = root.querySelector('[data-mem]'); mc.style.visibility = memory !== 0 ? 'visible' : 'hidden'; mc.textContent = 'M = ' + fmt(memory, 8);
    const h = view.querySelector('[data-hist]'); if (!h) return;
    h.innerHTML = history.length ? history.map((x, i) => `<button data-h="${i}" style="display:flex;width:100%;justify-content:space-between;gap:.6rem;text-align:left;margin:.15rem 0"><span style="overflow:hidden;text-overflow:ellipsis">${esc(shown(x.expr))}</span><b>= ${esc(fmt(x.res, 10))}</b></button>`).join('') : '<small>Nog geen berekeningen.</small>';
    h.querySelectorAll('[data-h]').forEach((b) => b.onclick = () => { expr = history[+b.dataset.h].expr; fresh = false; calcErr = ''; refresh(); });
  }

  function drawCalc(root) {
    const keys = [['MC', 'MR', 'M+', 'M−'], ['C', '(', ')', '⌫'], ['7', '8', '9', '÷'], ['4', '5', '6', '×'], ['1', '2', '3', '−'], ['±', '0', ',', '+']];
    const style = (k) => `min-height:3.3rem;font-size:${/^M/.test(k) ? '.95rem' : '1.35rem'};padding:0;${'+−×÷'.includes(k) ? 'font-weight:800;' : ''}`;
    root.innerHTML = `<div class="box" data-calc>
      <div style="text-align:right"><div data-mem style="font-size:.8rem;opacity:.7;visibility:hidden">M</div>
      <div data-expr style="font-size:2rem;font-weight:800;word-break:break-all;min-height:2.4rem"></div><div data-prev style="min-height:1.4rem"></div></div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.4rem;margin-top:.5rem">
        ${keys.flat().map((k) => `<button data-k="${k}" style="${style(k)}">${k}</button>`).join('')}
        <button data-k="%" style="${style('%')}">%</button><button data-k="=" class="pri" style="${style('=')};grid-column:span 3">=</button>
      </div></div>
      <div class="box"><b>Geschiedenis</b><div data-hist style="margin-top:.4rem"></div></div>
      <small>Tip: het toetsenbord werkt ook (Enter is =, Esc is C).</small>`;
    root.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => press(b.dataset.k));
    refresh();
  }

  function onKey(e) {
    if (dead) return;
    if (!view.isConnected) return;
    if (tab !== 'calc' || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target && e.target.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    const k = e.key; let m = null;
    if (/^[0-9]$/.test(k)) m = k;
    else if (k === ',' || k === '.') m = ',';
    else if (k === '+') m = '+';
    else if (k === '-') m = '−';
    else if (k === '*' || k === 'x' || k === 'X') m = '×';
    else if (k === '/' || k === ':') m = '÷';
    else if (k === '(' || k === ')' || k === '%') m = k;
    else if (k === 'Enter' || k === '=') m = '=';
    else if (k === 'Backspace') m = '⌫';
    else if (k === 'Escape' || k === 'Delete') m = 'C';
    if (m) { e.preventDefault(); press(m); }
  }
  document.addEventListener('keydown', onKey);
  addCleanup(() => document.removeEventListener('keydown', onKey));

  /* ----- 2. eenheden ----- */
  function drawUnit(root) {
    const cat = CATS[ucat];
    const opts = (sel) => Object.keys(cat.u).map((u) => `<option value="${esc(u)}" ${u === sel ? 'selected' : ''}>${esc(u)}</option>`).join('');
    root.innerHTML = `<div class="row wrap">${Object.entries(CATS).map(([k, c]) => `<button data-cat="${k}" class="${k === ucat ? 'pri' : ''}">${c.label}</button>`).join('')}</div>
      <div class="box">${lbl('Waarde', input('v', '0', esc(uval)))}
        <div class="row" style="align-items:flex-end;margin-top:.5rem">${lbl('Van', `<select data-k="f" style="${INP}">${opts(ufrom)}</select>`)}
          <button data-swap style="min-height:2.8rem" aria-label="Wissel">⇄</button>
          ${lbl('Naar', `<select data-k="t" style="${INP}">${opts(uto)}</select>`)}</div>
        ${big('r')}</div>`;
    root.querySelectorAll('[data-cat]').forEach((b) => b.onclick = () => { ucat = b.dataset.cat; [ufrom, uto] = CATS[ucat].def; draw(); });
    const q = (k) => root.querySelector(`[data-k="${k}"]`);
    const upd = () => {
      uval = q('v').value; ufrom = q('f').value; uto = q('t').value;
      const v = num(uval);
      if (!Number.isFinite(v)) return out(root, 'r', '<small>Vul een getal in.</small>');
      out(root, 'r', `${esc(fmt(v, 8))} ${esc(ufrom)} = <span style="color:var(--accent)">${esc(fmt(convert(v, ufrom, uto, ucat), 8))} ${esc(uto)}</span>`);
    };
    onChange(root, upd);
    root.querySelector('[data-swap]').onclick = () => { const a = q('f').value; q('f').value = q('t').value; q('t').value = a; upd(); };
    upd();
  }

  /* ----- 3. valuta ----- */
  function drawFx(root) {
    if (!fx) {
      root.innerHTML = `<div class="box">${fxState === 'laden' ? '<small>Koersen laden…</small>' : '<span class="err">Geen koersen beschikbaar</span><br><small>Je bent offline en er zijn nog geen koersen bewaard.</small><div class="row"><button data-retry>Opnieuw proberen</button></div>'}</div>`;
      const r = root.querySelector('[data-retry]'); if (r) r.onclick = () => { fxState = 'laden'; loadFx(); draw(); };
      return;
    }
    const codes = Object.keys(CUR).filter((c) => c in fx.rates);
    if (!codes.includes(cfrom)) cfrom = 'EUR'; if (!codes.includes(cto)) cto = codes.find((c) => c !== cfrom);
    const opts = (sel) => codes.map((c) => `<option value="${c}" ${c === sel ? 'selected' : ''}>${c} · ${esc(CUR[c])}</option>`).join('');
    root.innerHTML = `<div class="box">${lbl('Bedrag', input('v', '0', esc(camount)))}
      <div class="row" style="align-items:flex-end;margin-top:.5rem">${lbl('Van', `<select data-k="f" style="${INP}">${opts(cfrom)}</select>`)}
        <button data-swap style="min-height:2.8rem" aria-label="Wissel">⇄</button>
        ${lbl('Naar', `<select data-k="t" style="${INP}">${opts(cto)}</select>`)}</div>
      ${big('r')}<div data-out="rate" style="margin-top:.3rem"></div></div>
      <div class="box"><span class="chip">${fxState === 'live' ? 'Actueel' : 'Offline'}</span> <small>koers van ${esc(longDate(fx.date))}${fxState === 'cache' ? ' (bewaard, geen internet)' : ''}. Bron: Frankfurter (ECB).</small></div>`;
    const q = (k) => root.querySelector(`[data-k="${k}"]`);
    const upd = () => {
      camount = q('v').value; cfrom = q('f').value; cto = q('t').value;
      const rate = fx.rates[cto] / fx.rates[cfrom];
      out(root, 'rate', `<small>1 ${cfrom} = ${esc(fmt(rate, 4))} ${cto}</small>`);
      const v = num(camount);
      if (!Number.isFinite(v)) return out(root, 'r', '<small>Vul een bedrag in.</small>');
      out(root, 'r', `${esc(fmt(v, 2))} ${cfrom} = <span style="color:var(--accent)">${esc(fmt(v * rate, 2))} ${cto}</span>`);
    };
    onChange(root, upd);
    root.querySelector('[data-swap]').onclick = () => { const a = q('f').value; q('f').value = q('t').value; q('t').value = a; upd(); };
    upd();
  }

  /* ----- 4. procent ----- */
  function drawPct(root) {
    const K = keep;
    root.innerHTML = `
      <div class="box"><b>x% van y</b><div class="row">${lbl('Procent (%)', input('a1', '15', esc(K.a1 || '')))}${lbl('van', input('b1', '200', esc(K.b1 || '')))}</div>${big('o1')}</div>
      <div class="box"><b>x is hoeveel % van y</b><div class="row">${lbl('x', input('a2', '30', esc(K.a2 || '')))}${lbl('y', input('b2', '200', esc(K.b2 || '')))}</div>${big('o2')}</div>
      <div class="box"><b>Verhogen of verlagen met x%</b><div class="row">${lbl('Bedrag', input('a3', '80', esc(K.a3 || '')))}${lbl('Procent (%)', input('b3', '20', esc(K.b3 || '')))}</div>${big('o3')}</div>
      <div class="box"><b>BTW</b><div class="row">${lbl('Bedrag', input('a4', '100', esc(K.a4 || '')))}${lbl('Tarief', `<select data-k="r4" style="${INP}"><option value="21" ${K.r4 !== '9' ? 'selected' : ''}>21% (hoog)</option><option value="9" ${K.r4 === '9' ? 'selected' : ''}>9% (laag)</option></select>`)}</div>${big('o4')}</div>`;
    const g = (k) => root.querySelector(`[data-k="${k}"]`).value;
    const bad = '<small>Vul de getallen in.</small>';
    const upd = () => {
      ['a1', 'b1', 'a2', 'b2', 'a3', 'b3', 'a4', 'r4'].forEach((k) => { K[k] = g(k); });
      let x = num(g('a1')), y = num(g('b1'));
      out(root, 'o1', Number.isFinite(x + y) ? `${esc(fmt(x))}% van ${esc(fmt(y))} = <span style="color:var(--accent)">${esc(fmt(x * y / 100))}</span>` : bad);
      x = num(g('a2')); y = num(g('b2'));
      out(root, 'o2', Number.isFinite(x + y) ? (y === 0 ? '<span class="err">Kan niet delen door nul</span>' : `${esc(fmt(x))} is <span style="color:var(--accent)">${esc(fmt(x / y * 100))}%</span> van ${esc(fmt(y))}`) : bad);
      x = num(g('a3')); y = num(g('b3'));
      out(root, 'o3', Number.isFinite(x + y) ? `Verhoogd met ${esc(fmt(y))}%: <span style="color:var(--accent)">${esc(fmt(x * (1 + y / 100)))}</span><br>Verlaagd met ${esc(fmt(y))}%: <span style="color:var(--accent)">${esc(fmt(x * (1 - y / 100)))}</span>` : bad);
      x = num(g('a4')); y = +g('r4');
      out(root, 'o4', Number.isFinite(x) ? `<small>Bedrag is excl. btw</small><br>BTW ${esc(eur(x * y / 100))} · incl. <span style="color:var(--accent)">${esc(eur(x * (1 + y / 100)))}</span><br><small>Bedrag is incl. btw</small><br>BTW ${esc(eur(x - x / (1 + y / 100)))} · excl. <span style="color:var(--accent)">${esc(eur(x / (1 + y / 100)))}</span>` : bad);
    };
    onChange(root, upd); upd();
  }

  /* ----- 5. fooi & delen ----- */
  function drawTip(root) {
    root.innerHTML = `<div class="box">${lbl('Rekening (€)', input('bill', '0,00', esc(bill)))}
      <div style="margin-top:.6rem"><small>Fooi</small></div>
      <div class="row wrap">${[0, 5, 10, 15].map((p) => `<button data-p="${p}" class="${!tipCustom && tipPct === p ? 'pri' : ''}">${p}%</button>`).join('')}
        <button data-own class="${tipCustom ? 'pri' : ''}">Eigen</button>
        ${tipCustom ? `<input data-k="own" inputmode="decimal" placeholder="%" value="${esc(tipOwn)}" style="${INP};width:5.5rem">` : ''}</div>
      <div style="margin-top:.6rem"><small>Aantal personen</small></div>
      <div class="row" style="align-items:center"><button data-n="-1" style="min-width:3rem;min-height:2.8rem">−</button><b style="font-size:1.4rem;min-width:2rem;text-align:center">${people}</b><button data-n="1" style="min-width:3rem;min-height:2.8rem">+</button></div>
      <label class="row" style="margin-top:.6rem"><input type="checkbox" data-k="round" ${roundUp ? 'checked' : ''}> <span>Rond per persoon af naar hele euro's (omhoog)</span></label></div>
      <div class="box">${big('r')}</div>`;
    const bi = root.querySelector('[data-k="bill"]');
    root.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => { tipPct = +b.dataset.p; tipCustom = false; keepFocus(); });
    root.querySelector('[data-own]').onclick = () => { tipCustom = true; keepFocus(); };
    root.querySelectorAll('[data-n]').forEach((b) => b.onclick = () => { people = Math.max(1, Math.min(99, people + +b.dataset.n)); keepFocus(); });
    function keepFocus() { bill = bi.value; draw(); }
    const upd = () => {
      bill = bi.value; roundUp = root.querySelector('[data-k="round"]').checked;
      const own = root.querySelector('[data-k="own"]'); if (own) tipOwn = own.value;
      const b = num(bill); const p = tipCustom ? num(tipOwn) : tipPct;
      if (!Number.isFinite(b) || !Number.isFinite(p)) return out(root, 'r', '<small>Vul een rekening in.</small>');
      let total = b * (1 + p / 100), per = total / people;
      if (roundUp) { per = Math.ceil(Math.round(per * 100) / 100); total = per * people; }
      const tip = total - b;
      out(root, 'r', `Per persoon: <span style="color:var(--accent)">${esc(eur(per))}</span><div style="font-size:1rem;font-weight:400;margin-top:.3rem">Fooi: ${esc(eur(tip))} (${esc(fmt(b ? tip / b * 100 : 0, 1))}%)<br>Totaal: <b>${esc(eur(total))}</b> voor ${plural(people, 'persoon', 'personen')}</div>`);
    };
    onChange(root, upd); upd();
  }

  /* ----- 6. datum ----- */
  function drawDate(root) {
    const K = keep; const t = todayISO();
    K.d1a = K.d1a || t; K.d1b = K.d1b || addDays(t, 30); K.d2 = K.d2 || t; K.d2n = K.d2n ?? '30'; K.d2s = K.d2s || '+';
    K.d3 = K.d3 || ''; K.d4 = K.d4 || ''; K.d4n = K.d4n || '';
    root.innerHTML = `
      <div class="box"><b>Dagen tussen twee datums</b><div class="row">${lbl('Van', dateIn('d1a', K.d1a))}${lbl('Tot', dateIn('d1b', K.d1b))}</div>${big('o1')}</div>
      <div class="box"><b>Datum plus of min dagen</b><div class="row" style="align-items:flex-end">${lbl('Startdatum', dateIn('d2', K.d2))}
        ${lbl('Plus/min', `<select data-k="d2s" style="${INP}"><option value="+" ${K.d2s === '+' ? 'selected' : ''}>plus</option><option value="-" ${K.d2s === '-' ? 'selected' : ''}>min</option></select>`)}
        ${lbl('Dagen', input('d2n', '30', esc(K.d2n)))}</div>${big('o2')}</div>
      <div class="box"><b>Leeftijd</b><div class="row">${lbl('Geboortedatum', dateIn('d3', K.d3))}</div>${big('o3')}</div>
      <div class="box"><b>Aftellen naar een datum</b><div class="row">${lbl('Datum', dateIn('d4', K.d4))}${lbl('Naam (optioneel)', `<input data-k="d4n" value="${esc(K.d4n)}" placeholder="Vakantie" style="${INP}">`)}</div>${big('o4')}</div>`;
    const g = (k) => root.querySelector(`[data-k="${k}"]`).value;
    const upd = () => {
      ['d1a', 'd1b', 'd2', 'd2n', 'd2s', 'd3', 'd4', 'd4n'].forEach((k) => { K[k] = g(k); });
      const now = todayISO(); const hint = '<small>Kies een datum.</small>';
      if (K.d1a && K.d1b) { const n = daysBetween(K.d1a, K.d1b); out(root, 'o1', `<span style="color:var(--accent)">${esc(plural(Math.abs(n), 'dag', 'dagen'))}</span>${n < 0 ? ' <small>(tweede datum ligt eerder)</small>' : ''}<div style="font-size:.95rem;font-weight:400">≈ ${esc(fmt(Math.abs(n) / 7, 1))} weken</div>`); } else out(root, 'o1', hint);
      const n2 = num(K.d2n);
      if (K.d2 && Number.isFinite(n2)) { const r = addDays(K.d2, (K.d2s === '-' ? -1 : 1) * Math.round(n2)); out(root, 'o2', `<span style="color:var(--accent)">${esc(longDate(r))}</span>`); } else out(root, 'o2', hint);
      if (K.d3) {
        if (daysBetween(K.d3, now) < 0) out(root, 'o3', '<span class="err">Die datum ligt in de toekomst.</span>');
        else {
          const a = ageBetween(K.d3, now); const b = new Date(toUTC(K.d3));
          let nb = Date.UTC(+now.slice(0, 4), b.getUTCMonth(), b.getUTCDate()); if (nb < toUTC(now)) nb = Date.UTC(+now.slice(0, 4) + 1, b.getUTCMonth(), b.getUTCDate());
          const left = Math.round((nb - toUTC(now)) / DAY);
          out(root, 'o3', `<span style="color:var(--accent)">${a.jaren} jaar, ${plural(a.maanden, 'maand', 'maanden')}, ${plural(a.dagen, 'dag', 'dagen')}</span><div style="font-size:.95rem;font-weight:400">${esc(fmt(daysBetween(K.d3, now), 0))} dagen oud · ${left === 0 ? 'vandaag jarig! 🎉' : `nog ${esc(plural(left, 'dag', 'dagen'))} tot de volgende verjaardag`}</div>`);
        }
      } else out(root, 'o3', hint);
      if (K.d4) {
        const n = daysBetween(now, K.d4); const nm = K.d4n.trim() ? esc(K.d4n.trim()) : 'de datum';
        const wk = Math.floor(Math.abs(n) / 7), rest = Math.abs(n) % 7;
        out(root, 'o4', n === 0 ? `Vandaag is het ${nm}! 🎉` : n > 0 ? `Nog <span style="color:var(--accent)">${esc(plural(n, 'dag', 'dagen'))}</span> tot ${nm}<div style="font-size:.95rem;font-weight:400">${wk} wkn en ${rest} d · ${esc(longDate(K.d4))}</div>` : `${nm} was <span style="color:var(--accent)">${esc(plural(-n, 'dag', 'dagen'))}</span> geleden`);
      } else out(root, 'o4', hint);
    };
    onChange(root, upd); upd();
  }

  draw();
}
