// Ronde 4 – Learn: '📷 Kit uit foto'. Foto -> tekst herkennen (Tesseract.js, in de browser) -> controleren -> kit.
// Geen server, geen sleutels. De foto blijft op het toestel en wordt niet bewaard; alleen de OCR-bibliotheek en taaldata komen van de CDN.
import { h, mount, clear, injectCss } from './study-ui.js?v=2';
import * as P from './r4-ocr-parse.js?v=1';

export const TESS_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
const CSS = `
.ocr-priv{display:flex;gap:10px;align-items:flex-start;border-left:6px solid #22c55e}
.ocr-priv b{display:block}
.ocr-ph{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--ls-line);border-radius:14px;margin:0 0 6px;background:var(--ls-card)}
.ocr-ph .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700}
.ocr-ph small{display:block;opacity:.65;font-weight:400}
.ocr-prog{margin:8px 0}
.ocr-prog .t{font-weight:800;margin-bottom:4px}
.ocr-err{color:#b91c1c;font-weight:700;margin:8px 0}
.ocr-row{border:1px solid var(--ls-line);border-radius:14px;padding:8px;margin:0 0 8px;background:var(--ls-card)}
.ocr-row.warn{border-color:#f59e0b;background:color-mix(in srgb,#f59e0b 10%,var(--ls-card))}
.ocr-cols{display:flex;gap:6px;flex-wrap:wrap}
.ocr-cols>*{flex:1 1 130px;min-width:0}
.ocr-acts{display:flex;gap:6px;margin-top:6px}
.ocr-acts .ls-btn{flex:1;min-width:44px;padding:6px 8px;font-size:15px}
.ocr-bot{position:sticky;bottom:0;z-index:3;display:flex;gap:8px;align-items:center;padding:10px;margin-bottom:0}
.ocr-hid{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
`;

/* ---------- OCR-bibliotheek en foto's ---------- */
let libP = null;
export function loadTesseract(timeoutMs = 25000) {
  if (typeof window !== 'undefined' && window.Tesseract) return Promise.resolve(window.Tesseract);
  if (libP) return libP;
  libP = new Promise((ok, no) => {
    let done = false; const fin = (f, v) => { if (done) return; done = true; clearTimeout(tm); f(v); };
    const tm = setTimeout(() => fin(no, new Error('timeout')), timeoutMs);
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { fin(no, new Error('offline')); return; }
    const s = document.createElement('script'); s.src = TESS_URL; s.async = true;
    s.onload = () => (window.Tesseract ? fin(ok, window.Tesseract) : fin(no, new Error('leeg')));
    s.onerror = () => { try { s.remove(); } catch (e) { /* ok */ } fin(no, new Error('laden mislukt')); };
    document.head.appendChild(s);
  }).catch((e) => { libP = null; throw e; });
  return libP;
}
const acceptAttr = () => { try { if (typeof window.__fotoAccept === 'function') return window.__fotoAccept(); } catch (e) { /* ok */ } const ua = navigator.userAgent || ''; const touch = /iPhone|iPad|iPod|Android/i.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1); return touch ? 'image/*' : 'image/*,.heic,.heif'; };
async function heicToBlob(f) {
  if (!/hei[cf]/i.test((f.type || '') + ' ' + (f.name || ''))) return f;
  try { if (typeof window.__fotoHeic === 'function') { const b = await window.__fotoHeic(f); if (b) return b; } } catch (e) { /* ok */ }
  try {
    if (!window.heic2any) await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
    const o = await window.heic2any({ blob: f, toType: 'image/jpeg', quality: 0.92 }); return Array.isArray(o) ? o[0] : o;
  } catch (e) { return f; }
}
function loadImage(blob) {
  return new Promise((ok, no) => { const url = URL.createObjectURL(blob); const im = new Image(); im.onload = () => { ok({ im, url }); }; im.onerror = () => { URL.revokeObjectURL(url); no(new Error('foto lezen mislukt')); }; im.src = url; });
}
// foto -> { color: canvas (verkleind), clean: canvas (grijs + contrast) }. De canvassen worden na het lezen weer vrijgegeven.
export async function prepareCanvases(file) {
  const blob = await heicToBlob(file); const { im, url } = await loadImage(blob);
  try {
    const sz = P.fitSize(im.naturalWidth || im.width, im.naturalHeight || im.height, P.MAX_SIDE);
    const color = document.createElement('canvas'); color.width = sz.w; color.height = sz.h; const cx = color.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, sz.w, sz.h); cx.drawImage(im, 0, 0, sz.w, sz.h);
    const clean = document.createElement('canvas'); clean.width = sz.w; clean.height = sz.h; const c2 = clean.getContext('2d');
    try { const id = cx.getImageData(0, 0, sz.w, sz.h); P.enhanceGray(id.data, sz.w, sz.h); c2.putImageData(id, 0, 0); } catch (e) { c2.drawImage(color, 0, 0); }
    return { color, clean };
  } finally { URL.revokeObjectURL(url); }
}
const free = (c) => { if (c) { c.width = 1; c.height = 1; } };
const nLetters = (t) => (String(t || '').match(/\p{L}/gu) || []).length;

/* ---------- het scherm ---------- */
// S: { C, screen(title), toast, snd, refresh }. o.recognize (voor tests/andere engine): async (canvas, langs, onProgress) => tekst
export function openPhotoKit(S, o = {}) {
  const C = S.C; const scr = S.screen('📷 Kit uit foto'); const rm = injectCss('r4ocr', CSS);
  const st = { langs: new Set(['nld', 'eng']), photos: [], manual: '', text: '', step: 'foto', busy: false, err: '', prog: null, kind: 'woordjes', mode: 'auto', rows: [], langA: 'nl', langB: 'en', both: false, name: '', parsed: null, suggest: null, done: null };
  let worker = null, workerKey = '', alive = true, nid = 0;
  const body = scr.body;
  const origClose = scr.close.bind(scr);
  scr.close = () => { alive = false; if (worker) { try { worker.terminate(); } catch (e) { /* ok */ } worker = null; } origClose(); rm(); };
  scr.guard = () => { if (st.step !== 'check' || !st.rows.length || st.done || scr._warned) return true; scr._warned = true; S.toast('Je kit is nog niet gemaakt. Tik nogmaals op ✕ om te sluiten.'); setTimeout(() => { scr._warned = false; }, 3000); return false; };

  const privacy = () => h('div', { class: 'ls-card ocr-priv' }, h('div', { style: { fontSize: '28px' } }, '🔒'), h('div', null, h('b', null, 'Je foto blijft van jou'), h('span', { class: 'ls-muted' }, 'Je foto wordt niet bewaard en niet opgestuurd. Alleen het leesprogramma en de taal worden eenmalig van internet gehaald; het lezen gebeurt op je eigen toestel.')));
  const chips = (items, isOn, toggle) => { const row = h('div', { class: 'ls-chips' }); const draw = () => mount(row, items.map(([v, l]) => h('button', { type: 'button', class: 'ls-chip' + (isOn(v) ? ' on' : ''), onclick: () => { toggle(v); draw(); } }, l))); draw(); return row; };

  async function getWorker(onLog) {
    const T = await loadTesseract(); const langs = [...st.langs].sort().join('+');
    if (worker && workerKey !== langs) { try { await worker.terminate(); } catch (e) { /* ok */ } worker = null; }
    if (!worker) {
      worker = await T.createWorker(langs, 1, { logger: onLog }); workerKey = langs;
      try { await worker.setParameters({ preserve_interword_spaces: '1' }); } catch (e) { /* ok */ }
    }
    return worker;
  }
  async function recognizeOne(canvas, onP) {
    if (o.recognize) return o.recognize(canvas, [...st.langs], onP);
    const w = await getWorker((m) => { if (!m) return; if (m.status === 'recognizing text') onP(m.progress || 0, 'Tekst lezen…'); else if (/load|init/i.test(m.status || '')) onP(null, 'Taaldata laden…'); });
    const r = await w.recognize(canvas); return (r && r.data && r.data.text) || '';
  }
  async function readPhoto(ph, idx, total) {
    ph.status = 'bezig'; draw();
    const base = idx / total, span = 1 / total;
    const onP = (p, label) => { st.prog = { pct: p == null ? (st.prog ? st.prog.pct : 0) : Math.round((base + p * span) * 100), label: label || 'Tekst lezen…' }; if (alive) drawProg(); };
    try {
      onP(null, 'Foto klaarmaken…');
      const cv = await prepareCanvases(ph.file);
      let text = await recognizeOne(cv.clean, onP);
      if (P.cleanLines(text).length < 2) { const t2 = await recognizeOne(cv.color, onP); if (nLetters(t2) > nLetters(text)) text = t2; }
      free(cv.color); free(cv.clean);
      ph.text = text; ph.lines = P.cleanLines(text).length; ph.status = 'klaar'; ph.file = null;
    } catch (e) {
      ph.status = 'fout'; ph.file = null; ph.err = e && e.message || 'fout';
      if (!st.err) st.err = (e && /offline|timeout|laden mislukt|leeg|Failed|network|fetch|import/i.test(e.message || '')) || !(e && e.message) ? 'Het leesprogramma laden is niet gelukt. Ben je offline? Probeer het later nog eens, of typ of plak de woorden zelf hieronder.' : 'Deze foto kon ik niet lezen. Probeer een scherpere foto, of typ de woorden zelf hieronder.';
      if (typeof console !== 'undefined') console.warn('kit-uit-foto:', e);
    }
  }
  let pumping = false;
  async function pump() {
    if (pumping) return; pumping = true; st.busy = true; st.err = ''; draw();
    try {
      for (;;) {
        const todo = st.photos.filter((p) => p.status === 'wacht'); if (!todo.length || !alive) break;
        const total = todo.length; let i = 0;
        for (const ph of todo) { if (!alive) break; await readPhoto(ph, i++, total); }
      }
    } finally { pumping = false; st.busy = false; st.prog = null; if (alive) draw(); }
  }
  const addFiles = (files) => {
    const list = [...files].filter((f) => /^image\//.test(f.type || '') || /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(f.name || ''));
    if (!list.length) { S.toast('Dat is geen foto'); return; }
    for (const f of list) st.photos.push({ id: ++nid, name: f.name || 'foto', file: f, status: 'wacht', text: '', lines: 0 });
    pump();
  };

  const fi = h('input', { type: 'file', accept: acceptAttr(), multiple: true, class: 'ocr-hid', 'aria-label': 'Kies foto’s', onchange: (e) => { const fs = e.target.files; if (fs && fs.length) addFiles(fs); try { e.target.value = ''; } catch (er) { /* ok */ } } });
  const progBox = h('div'); const mainBox = h('div');
  function drawProg() { mount(progBox, st.prog ? h('div', { class: 'ocr-prog', role: 'status' }, h('div', { class: 't' }, `${st.prog.label} ${st.prog.pct}%`), h('div', { class: 'ls-bar' }, h('i', { style: { width: st.prog.pct + '%' } }))) : null); }
  const allBlocks = () => st.photos.filter((p) => p.status === 'klaar').map((p) => p.text).concat(st.manual.trim() ? [st.manual] : []);

  function drawFoto() {
    const ready = st.photos.some((p) => p.status === 'klaar') || st.manual.trim().length > 1;
    const ta = h('textarea', { class: 'ls-ta', placeholder: 'Of typ of plak hier zelf je woorden.\n\nhuis - house\nkat - cat', style: { minHeight: '110px' }, oninput: (e) => { st.manual = e.target.value; goBtn.disabled = st.busy || !(st.photos.some((p) => p.status === 'klaar') || st.manual.trim().length > 1); } }); ta.value = st.manual;
    const goBtn = h('button', { class: 'ls-btn p big', style: { width: '100%' }, disabled: st.busy || !ready, onclick: () => toCheck() }, 'Verder: controleren ➜');
    mount(mainBox,
      privacy(),
      h('div', { class: 'ls-card' }, h('h3', null, '1. Maak een foto van de bladzijde'),
        h('div', { class: 'ls-muted' }, 'Een woordenlijst, rijtjes of begrippen uit je boek. Houd je telefoon recht boven de bladzijde, met goed licht. Je kunt meer foto’s achter elkaar doen; alles komt in één lijst.'),
        h('span', { class: 'ls-lab' }, 'Welke talen staan er op de bladzijde?'),
        chips(P.OCR_LANGS, (v) => st.langs.has(v), (v) => { if (st.langs.has(v)) { if (st.langs.size > 1) st.langs.delete(v); } else if (st.langs.size < 3) st.langs.add(v); else S.toast('Kies maximaal 3 talen'); }),
        h('button', { class: 'ls-btn p big', style: { width: '100%', marginTop: '6px' }, disabled: st.busy, onclick: () => fi.click() }, st.photos.length ? '＋ Nog een foto' : '📷 Foto maken of kiezen'), fi,
        progBox,
        st.err ? h('div', { class: 'ocr-err', role: 'alert' }, '⚠️ ' + st.err) : null,
        st.photos.map((p) => h('div', { class: 'ocr-ph' }, h('span', null, p.status === 'klaar' ? '✅' : p.status === 'fout' ? '⚠️' : p.status === 'bezig' ? '⏳' : '🕒'), h('div', { class: 'n' }, p.name, h('small', null, p.status === 'klaar' ? `${p.lines} regels gelezen` : p.status === 'fout' ? 'lezen mislukt' : p.status === 'bezig' ? 'bezig met lezen…' : 'wacht op de beurt')),
          h('button', { class: 'ls-btn sm', 'aria-label': 'Foto weghalen', disabled: p.status === 'bezig', onclick: () => { st.photos = st.photos.filter((x) => x !== p); draw(); } }, '✕')))),
      h('div', { class: 'ls-card' + (st.err ? ' ls-pop' : '') }, h('h3', null, 'Zelf typen of plakken'), h('div', { class: 'ls-muted' }, 'Lukt het lezen niet, of heb je de woorden al? Typ of plak ze hier. Dit wordt erbij gevoegd.'), ta),
      goBtn);
    drawProg();
  }

  /* --- controlescherm --- */
  function reparse(mode) {
    st.mode = mode || st.mode; const r = P.parseBlocks(allBlocks(), { mode: st.mode }); st.parsed = r; st.suggest = r.suggest;
    const d = P.dedupeRows(r.rows); st.rows = d.rows; st.removedDup = d.removed;
    if (!st.rows.some((x) => x.a) && st.kind !== 'rijtje' && st.mode === 'auto') st.kind = 'rijtje';
  }
  function toCheck() {
    reparse('auto');
    if (!st.rows.length) { st.err = 'Ik kon geen woorden vinden. Probeer een scherpere foto, of typ de woorden zelf.'; draw(); return; }
    const t = [...st.langs].find((l) => l !== 'nld'); st.langB = ({ eng: 'en', fra: 'fr', deu: 'de', spa: 'es' })[t] || 'en';
    if (!st.name) st.name = P.suggestName(st.rows, st.kind);
    if (st.removedDup) S.toast(`${st.removedDup} dubbele of lege regels weggehaald`);
    st.step = 'check'; draw();
  }
  function drawCheck() {
    const isPair = st.kind !== 'rijtje'; const count = h('span', { class: 'ls-grow ls-muted', style: { flex: '0 0 auto' } });
    const upCount = () => { let n = 0, d = 0; try { const r = P.buildQuestions(st.kind, st.rows, { langA: st.langA, langB: st.langB, both: st.both, seed: 1 }); n = r.qs.length; d = r.dropped; } catch (e) { /* ok */ } count.textContent = `${n} vragen`; count.title = d ? `${d} regel(s) zonder antwoord tellen niet mee` : ''; mk.disabled = !n; };
    const mk = h('button', { class: 'ls-btn p', style: { flex: 1 }, onclick: () => save() }, '✨ Maak kit');
    const list = h('div');
    const redrawList = () => {
      mount(list, st.rows.map((r, i) => {
        const inQ = h('input', { class: 'ls-in', value: isPair ? r.q : [r.q, r.a].filter(Boolean).join(' '), 'aria-label': isPair ? 'Links' : 'Regel', oninput: (e) => { if (isPair) { r.q = e.target.value; rowEl.classList.toggle('warn', !r.a.trim() || !r.q.trim()); } else { r.q = e.target.value; r.a = ''; } upCount(); } });
        const inA = isPair ? h('input', { class: 'ls-in', value: r.a, 'aria-label': 'Rechts', placeholder: '← ?', oninput: (e) => { r.a = e.target.value; rowEl.classList.toggle('warn', !r.a.trim() || !r.q.trim()); upCount(); } }) : null;
        const acts = h('div', { class: 'ocr-acts' },
          isPair ? h('button', { class: 'ls-btn sm', 'aria-label': 'Draai dit paar om', title: 'Omdraaien', onclick: () => { st.rows[i] = P.swapRow(r); drawCheck(); } }, '⇄') : null,
          i + 1 < st.rows.length ? h('button', { class: 'ls-btn sm', 'aria-label': 'Voeg samen met de regel eronder', title: 'Samenvoegen met de regel eronder', onclick: () => { st.rows = P.mergeRows(st.rows, i); drawCheck(); } }, '⤵ samen') : null,
          h('button', { class: 'ls-btn sm', 'aria-label': 'Regel weghalen', title: 'Weghalen', onclick: () => { st.rows = P.removeRow(st.rows, i); drawCheck(); } }, '🗑'));
        const rowEl = h('div', { class: 'ocr-row' + (isPair && (!r.a.trim() || !r.q.trim()) ? ' warn' : '') }, h('div', { class: 'ocr-cols' }, inQ, inA), acts);
        return rowEl;
      }));
    };
    const langSel = (key) => h('select', { class: 'ls-sel', 'aria-label': key === 'langA' ? 'Taal links' : 'Taal rechts', style: { flex: 1 }, onchange: (e) => { st[key] = e.target.value; drawCheck(); } }, P.KIT_LANGS.map(([v, n]) => h('option', { value: v, selected: st[key] === v }, n)));
    const warn = st.rows.filter((r) => !r.a.trim() || !r.q.trim()).length;
    mount(mainBox,
      h('div', { class: 'ls-card' }, h('h3', null, '2. Klopt dit? Verbeter wat fout gelezen is'),
        h('div', { class: 'ls-muted' }, `Ik las ${st.parsed ? st.parsed.lines.length : 0} regels${st.parsed && st.parsed.sep !== 'none' ? ` en splitste ze met: ${st.parsed.sepName}` : ''}. Foto’s lezen gaat niet altijd perfect, kijk dus goed na.`),
        h('span', { class: 'ls-lab' }, 'Wat voor kit wordt dit?'),
        chips(P.KINDS.map(([v, l]) => [v, l]), (v) => st.kind === v, (v) => { st.kind = v; drawCheck(); }),
        h('div', { class: 'ls-muted' }, P.KINDS.find((k) => k[0] === st.kind)[2] + (st.kind === 'rijtje' ? ': ik maak vragen als “wat komt hierna?” en “zet op volgorde”.' : st.kind === 'begrippen' ? ': ik maak meerkeuze, waar/onwaar en verbind-vragen.' : ': ik maak meerkeuze, typen en luisteren (met de taal).')),
        st.kind === 'woordjes' ? [h('span', { class: 'ls-lab' }, 'Links staat… en rechts staat…'),
          h('div', { class: 'ls-row', style: { alignItems: 'center', gap: '6px' } }, langSel('langA'), h('button', { class: 'ls-btn sm', 'aria-label': 'Wissel de talen links en rechts', title: 'Wissel de richting', onclick: () => { const a = st.langA; st.langA = st.langB; st.langB = a; st.rows = P.swapAll(st.rows); drawCheck(); } }, '⇄'), langSel('langB')),
          chips([['both', '↔ Ook andersom oefenen']], () => st.both, () => { st.both = !st.both; upCount(); })] : null,
        h('span', { class: 'ls-lab' }, 'Hoe zijn de regels verdeeld?'),
        chips(P.MODES, (v) => st.mode === v, (v) => { reparse(v); drawCheck(); }),
        st.suggest ? h('div', { class: 'ls-muted' }, 'Tip: staan de woorden en vertalingen om-en-om onder elkaar? Kies dan “Om-en-om regels”.') : null,
        h('div', { class: 'ls-row', style: { gap: '6px', flexWrap: 'wrap' } },
          isPair ? h('button', { class: 'ls-btn sm', onclick: () => { st.rows = P.swapAll(st.rows); drawCheck(); } }, '⇄ Alle paren omdraaien') : null,
          h('button', { class: 'ls-btn sm', onclick: () => { const d = P.dedupeRows(st.rows); S.toast(d.removed ? `${d.removed} dubbele regels weggehaald` : 'Geen dubbele regels'); st.rows = d.rows; drawCheck(); } }, '🧹 Dubbele weg'),
          h('button', { class: 'ls-btn sm', onclick: () => { st.rows.push({ q: '', a: '' }); drawCheck(); } }, '＋ Regel'))),
      isPair && warn ? h('div', { class: 'ls-muted', style: { margin: '0 4px 8px' } }, `⚠️ ${warn} regel${warn > 1 ? 's hebben' : ' heeft'} nog geen tweede deel (oranje). Vul aan, voeg samen met de regel eronder, of haal weg.`) : null,
      list,
      h('div', { class: 'ls-card' }, h('span', { class: 'ls-lab', style: { marginTop: 0 } }, 'Naam van je kit'), h('input', { class: 'ls-in', value: st.name, maxlength: 60, placeholder: 'Naam van je kit', oninput: (e) => { st.name = e.target.value; } })),
      h('div', { class: 'ls-card ocr-bot' }, h('button', { class: 'ls-btn', 'aria-label': 'Terug naar de foto’s', title: 'Terug naar de foto’s', style: { minWidth: '48px' }, onclick: () => { st.step = 'foto'; draw(); } }, '←'), count, mk));
    redrawList(); upCount();
  }
  function save() {
    const name = (st.name || '').trim() || P.suggestName(st.rows, st.kind);
    const emoji = st.kind === 'woordjes' ? '🔤' : st.kind === 'begrippen' ? '📖' : '🔢';
    const r = P.makeKit({ name, emoji, kind: st.kind, rows: st.rows, langA: st.langA, langB: st.langB, both: st.both, seed: Date.now() % 9999 });
    if (!r.kit.qs.length) { S.toast(st.kind === 'rijtje' ? 'Voeg minstens 2 regels toe' : 'Ik heb minstens 2 paren met twee delen nodig'); return; }
    r.kit.id = C.Kits.newId();
    try { C.Kits.save(r.kit); } catch (e) { S.toast('Opslaan lukt niet'); return; }
    try { S.snd && S.snd('level'); } catch (e) { /* ok */ } S.toast('Kit opgeslagen ✓'); try { S.refresh && S.refresh(); } catch (e) { /* ok */ }
    st.done = r.kit; st.step = 'klaar'; draw();
  }
  function drawKlaar() {
    const k = st.done;
    mount(mainBox, h('div', { class: 'ls-card ls-pop', style: { textAlign: 'center' } }, h('div', { style: { fontSize: '56px' } }, k.emoji), h('h3', null, 'Je kit is klaar!'), h('b', null, k.name), h('div', { class: 'ls-muted' }, `${k.qs.length} vragen${k.lang && k.lang !== 'nl' ? ' · taal: ' + (P.KIT_LANGS.find((x) => x[0] === k.lang) || [0, k.lang])[1] : ''}`), h('div', { class: 'ls-muted', style: { marginTop: '6px' } }, 'Je vindt hem nu bij je eigen kits, in Learn Study en in Learn Spel. De foto is niet bewaard.')),
      h('button', { class: 'ls-btn p big', style: { width: '100%', marginBottom: '8px' }, onclick: () => scr.close() }, '👍 Klaar'),
      h('div', { class: 'ls-row', style: { gap: '8px' } },
        h('button', { class: 'ls-btn', style: { flex: 1 }, onclick: async () => { try { const { openMaker } = await import('./study-maker.js?v=2'); const kit = k; scr.close(); openMaker(S, { kit }); } catch (e) { S.toast('De kit-maker laden lukt niet'); } } }, '✏️ Bewerken'),
        h('button', { class: 'ls-btn', style: { flex: 1 }, onclick: () => { scr.close(); openPhotoKit(S, o); } }, '📷 Nog een kit')));
  }
  function draw() { if (!alive) return; scr.title('📷 Kit uit foto'); if (st.step === 'check') drawCheck(); else if (st.step === 'klaar') drawKlaar(); else drawFoto(); }
  mount(body, mainBox); draw();
  scr._st = st; // voor tests
  return scr;
}
