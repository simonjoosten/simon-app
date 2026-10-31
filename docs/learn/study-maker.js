// Learn Study: kit-maker (snel invullen, plak-import, tekst -> vragen, generator-wizard, delen via code).
import { h, mount, clear, twoTap } from './study-ui.js?v=2';
import * as L from './study-logic.js?v=2';
import * as A from './study-art.js?v=2';

const LANG_OPTS = [['nl', 'Nederlands'], ['en', 'Engels'], ['de', 'Duits'], ['fr', 'Frans'], ['es', 'Spaans']];
const EXAMPLE_WORDS = 'huis - house\nkat - cat\nhond - dog\nboom - tree\nvriend - friend\nschool - school\nboek - book\nappel - apple';
const EXAMPLE_QA = 'Wat is de hoofdstad van Frankrijk? Parijs\nHoeveel poten heeft een spin? 8\nWelke kleur krijg je van blauw en geel? groen\nWie schreef Max Havelaar? Multatuli';
const EXAMPLE_TEXT = 'De Eiffeltoren staat in Parijs en is 330 meter hoog. Hij werd gebouwd in 1889 door Gustave Eiffel. Elk jaar komen er miljoenen toeristen kijken. Mont Blanc is de hoogste berg van de Alpen met 4808 meter.';

function copyText(text, el) {
  return new Promise((res) => {
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(() => res(true), () => res(fallback())); return; } } catch (e) { /* fallback */ }
    res(fallback());
    function fallback() { try { if (el) { el.focus(); el.select(); } return !!document.execCommand('copy'); } catch (e) { return false; } }
  });
}
function chipsRow(items, isOn, toggle) {
  const row = h('div', { class: 'ls-chips' });
  const draw = () => mount(row, items.map((c) => h('button', { class: 'ls-chip' + (isOn(c.v) ? ' on' : ''), onclick: () => { toggle(c.v); draw(); } }, c.l)));
  draw(); return row;
}

/* ---------- formulier voor één vraag ---------- */
export function questionForm(S, init, { onSave, onCancel }) {
  const f = init ? L.qToFields(init) : { t: 'type', q: '', a: '', opts: '', alt: '', e: '', x: '', g: '', d: 2, say: '', lang: '', tol: '' };
  const box = h('div', { class: 'ls-card' }); const err = h('div', { style: { color: '#ef4444', fontWeight: '700', margin: '6px 0' } });
  const draw = () => {
    const t = f.t; const inp = (key, ph, rows) => { const el = rows ? h('textarea', { class: 'ls-ta', rows, placeholder: ph || '', style: { minHeight: '80px' } }) : h('input', { class: 'ls-in', placeholder: ph || '' }); el.value = f[key] == null ? '' : f[key]; el.addEventListener('input', () => { f[key] = el.value; }); return el; };
    const lab = (s) => h('span', { class: 'ls-lab' }, s);
    const parts = [chipsRow(Object.keys(L.TYPES).map((k) => ({ v: k, l: `${L.TYPE_EMOJI[k]} ${L.TYPES[k]}` })), (v) => f.t === v, (v) => { f.t = v; draw(); })];
    const qLab = t === 'fill' ? 'Zin met ___ op de plek van het gat' : t === 'tf' ? 'Bewering' : t === 'order' ? 'Opdracht (bijv. Zet op volgorde)' : t === 'match' ? 'Opdracht (bijv. Verbind de paren)' : 'Vraag';
    parts.push(lab(qLab), inp('q', '', 2));
    if (t === 'mc') parts.push(lab('Goede antwoord'), inp('a'), lab('Foute antwoorden (één per regel)'), inp('opts', '', 3));
    else if (t === 'type') parts.push(lab('Antwoord'), inp('a'), lab('Ook goed (met komma\'s)'), inp('alt'));
    else if (t === 'fill') parts.push(lab('Het ontbrekende woord'), inp('a'), lab('Keuzes erbij (optioneel, foute opties één per regel)'), inp('opts', '', 2));
    else if (t === 'tf') parts.push(lab('Is het waar?'), chipsRow([{ v: 'waar', l: '✔️ Waar' }, { v: 'onwaar', l: '✖️ Onwaar' }], (v) => (f.a || 'waar') === v, (v) => { f.a = v; }));
    else if (t === 'num') parts.push(lab('Het getal'), inp('a'), lab('Ook goed (met ; ertussen)'), inp('alt'), lab('Marge (optioneel, bijv. 0,5)'), inp('tol'));
    else if (t === 'order') parts.push(lab('Items in de GOEDE volgorde (één per regel)'), inp('opts', '', 5));
    else if (t === 'match') parts.push(lab('Paren (links = rechts, één per regel)'), inp('opts', '', 5));
    else if (t === 'multi') parts.push(lab('Opties (zet * voor de goede, één per regel)'), inp('opts', '', 5));
    const more = h('details', null, h('summary', { class: 'ls-muted' }, 'Meer: plaatje, uitleg, moeilijkheid'), lab('Emoji'), inp('e', '🐶'), lab('Uitleg na het antwoord'), inp('x'), lab('Groep/tag'), inp('g'), lab('Moeilijkheid'), chipsRow([{ v: 1, l: 'Makkelijk' }, { v: 2, l: 'Gemiddeld' }, { v: 3, l: 'Moeilijk' }], (v) => +f.d === v, (v) => { f.d = v; }));
    parts.push(more, err, h('div', { class: 'ls-row', style: { marginTop: '8px' } },
      h('button', { class: 'ls-btn p', style: { flex: 1 }, onclick: () => { const r = L.fieldsToQ(f, S.rand); if (r.error) { err.textContent = r.error; return; } err.textContent = ''; onSave(r.q); } }, init ? 'Opslaan' : 'Toevoegen'),
      h('button', { class: 'ls-btn', onclick: onCancel }, 'Annuleer')));
    mount(box, parts);
  };
  draw(); return box;
}

/* ---------- de maker ---------- */
export function openMaker(S, { kit = null, tab = 'vragen', copy = false } = {}) {
  const C = S.C; const scr = S.screen(kit && !copy ? '✏️ Kit bewerken' : '➕ Nieuwe kit');
  const base = kit ? JSON.parse(JSON.stringify(kit)) : { name: '', emoji: '📘', desc: '', lang: undefined, qs: [] };
  const draft = { id: copy ? undefined : base.id, name: copy ? (base.name + ' (kopie)') : base.name, emoji: base.emoji || '📘', desc: base.desc || '', lang: base.lang, group: base.group, qs: base.qs || [] };
  let dirty = !!copy; let cur = tab; let editing = -1; let adding = false; let saved = false;
  scr.guard = () => { if (!dirty || saved) return true; if (scr._warned) return true; scr._warned = true; S.toast('Niet opgeslagen. Tik nogmaals op ✕ om te sluiten.'); setTimeout(() => { scr._warned = false; }, 3000); return false; };
  const body = scr.body; const main = h('div'); const bottom = h('div', { class: 'ls-card', style: { position: 'sticky', bottom: '0', zIndex: 3, display: 'flex', gap: '8px', alignItems: 'center' } });
  const metaName = h('input', { class: 'ls-in', placeholder: 'Naam van je kit', value: draft.name, maxlength: 60, oninput: (e) => { draft.name = e.target.value; dirty = true; } });
  const metaEmoji = h('input', { class: 'ls-in', value: draft.emoji, maxlength: 4, style: { width: '64px', textAlign: 'center', fontSize: '22px' }, oninput: (e) => { draft.emoji = e.target.value; dirty = true; } });
  const metaLang = h('select', { class: 'ls-sel', onchange: (e) => { draft.lang = e.target.value === 'nl' ? undefined : e.target.value; dirty = true; } }, LANG_OPTS.map(([v, n]) => h('option', { value: v, selected: (draft.lang || 'nl') === v }, n)));
  const preview = h('div', { class: 'ls-ico-big' }); const grid = h('div', { class: 'ls-icogrid' }); let gridOpen = false;
  const drawPrev = () => mount(preview, A.kitIconEl(draft.emoji || '📘', 44));
  const drawGrid = () => { mount(grid, gridOpen ? A.PICKER.map((em) => h('button', { type: 'button', class: draft.emoji === em ? 'on' : '', 'aria-label': 'Kies icoon', onclick: () => { draft.emoji = em; metaEmoji.value = em; dirty = true; drawPrev(); drawGrid(); } }, A.kitIconEl(em, 36))) : null); grid.style.display = gridOpen ? '' : 'none'; };
  metaEmoji.addEventListener('input', drawPrev); drawPrev(); drawGrid();
  const pickBtn = h('button', { type: 'button', class: 'ls-btn sm', onclick: () => { gridOpen = !gridOpen; drawGrid(); } }, '🎨 Kies een icoon');
  const meta = h('div', { class: 'ls-card' }, h('div', { class: 'ls-row' }, preview, metaEmoji, h('div', { class: 'ls-grow' }, metaName)), h('div', { class: 'ls-row', style: { marginTop: '6px' } }, pickBtn), grid, h('span', { class: 'ls-lab' }, 'Taal van de antwoorden (voor voorlezen en woordjes)'), metaLang);
  const segs = [['vragen', '✏️ Vragen'], ['plak', '📋 Plakken'], ['tekst', '📝 Tekst'], ['gen', '⚙️ Generator'], ['delen', '📤 Delen']];
  const seg = h('div', { class: 'ls-seg' });
  const count = h('div', { class: 'ls-grow ls-muted' });
  const saveBtn = h('button', { class: 'ls-btn p', onclick: () => save() }, '💾 Opslaan');
  mount(bottom, count, saveBtn);
  const addQs = (qs) => {
    const room = L.MAX_Q - draft.qs.length; const take = qs.slice(0, Math.max(0, room));
    draft.qs = draft.qs.concat(take); dirty = true;
    S.toast(take.length < qs.length ? `Toegevoegd: ${take.length} (max ${L.MAX_Q} vragen per kit)` : `${take.length} vragen toegevoegd`);
    cur = 'vragen'; render();
  };
  function save() {
    const name = (draft.name || '').trim();
    if (!name) { S.toast('Geef je kit eerst een naam'); metaName.focus(); return; }
    if (!draft.qs.length) { S.toast('Voeg minstens 1 vraag toe'); return; }
    const { kit: k } = L.cleanKit({ ...draft, name, src: 'user' });
    k.id = draft.id || C.Kits.newId(); draft.id = k.id;
    if (draft.group) k.group = draft.group;
    try { C.Kits.save(k); } catch (e) { S.toast('Opslaan lukt niet'); return; }
    saved = true; dirty = false; S.toast('Kit opgeslagen ✓'); S.snd('level'); S.refresh && S.refresh(); render();
  }
  function render() {
    saved = false;
    mount(seg, segs.map(([id, l]) => h('button', { class: cur === id ? 'on' : '', onclick: () => { cur = id; editing = -1; adding = false; render(); } }, l)));
    count.textContent = `${draft.qs.length} vragen`;
    clear(main);
    if (cur === 'vragen') main.appendChild(tabVragen()); else if (cur === 'plak') main.appendChild(tabPlak()); else if (cur === 'tekst') main.appendChild(tabTekst()); else if (cur === 'gen') main.appendChild(tabGen()); else main.appendChild(tabDelen());
  }
  /* --- vragen --- */
  function tabVragen() {
    const wrap = h('div');
    const qi = h('input', { class: 'ls-in', placeholder: 'Vraag of woord', enterkeyhint: 'next' }), ai = h('input', { class: 'ls-in', placeholder: 'Antwoord', enterkeyhint: 'done' }), wi = h('input', { class: 'ls-in', placeholder: 'Foute opties met komma (voor meerkeuze, optioneel)' });
    const quick = () => {
      const q = qi.value.trim(), a = ai.value.trim(); if (!q || !a) { S.toast('Vul vraag én antwoord in'); return; }
      const wrong = wi.value.split(',').map((s) => s.trim()).filter(Boolean);
      let nq; if (wrong.length) nq = { t: 'mc', q, a, o: L.shuf([a, ...wrong], S.rand) }; else if (/^-?\d+([.,]\d+)?$/.test(a)) nq = { t: 'num', q, a: parseFloat(a.replace(',', '.')) }; else nq = { t: 'type', q, a };
      if (draft.lang && draft.lang !== 'nl') nq.lang = draft.lang;
      const c = L.cleanQ(nq); if (!c) { S.toast('Dat past niet'); return; }
      if (draft.qs.length >= L.MAX_Q) { S.toast('Maximaal ' + L.MAX_Q + ' vragen'); return; }
      draft.qs.push(c); dirty = true; qi.value = ''; ai.value = ''; wi.value = ''; S.snd('klik'); renderList(); count.textContent = `${draft.qs.length} vragen`; qi.focus();
    };
    qi.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); ai.focus(); } }); ai.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); quick(); } });
    wrap.appendChild(h('div', { class: 'ls-card' }, h('h3', null, '⚡ Snel toevoegen'), h('div', { class: 'ls-muted' }, 'Typ vraag, Enter, antwoord, Enter. Klaar is de volgende al.'), qi, h('div', { style: { height: '6px' } }), ai, h('div', { style: { height: '6px' } }), wi, h('div', { class: 'ls-row', style: { marginTop: '8px' } }, h('button', { class: 'ls-btn p', style: { flex: 1 }, onclick: quick }, '＋ Toevoegen'), h('button', { class: 'ls-btn', onclick: () => { adding = true; editing = -1; renderList(); } }, 'Alle vraagsoorten…'))));
    const list = h('div'); wrap.appendChild(list);
    function renderList() {
      clear(list);
      if (adding) list.appendChild(questionForm(S, null, { onSave: (q) => { draft.qs.push(q); dirty = true; adding = false; render(); }, onCancel: () => { adding = false; renderList(); } }));
      if (!draft.qs.length) { list.appendChild(h('div', { class: 'ls-card ls-muted' }, 'Nog geen vragen. Gebruik hierboven snel toevoegen, of plak een hele lijst via 📋 Plakken, of laat de computer vragen maken uit een tekst of met de generator.')); return; }
      draft.qs.forEach((q, i) => {
        if (i === editing) { list.appendChild(questionForm(S, q, { onSave: (nq) => { draft.qs[i] = nq; dirty = true; editing = -1; render(); }, onCancel: () => { editing = -1; renderList(); } })); return; }
        const s = L.qSummary(q); const del = h('button', { class: 'ls-btn sm' }, '🗑');
        twoTap(del, 'Zeker?', () => { draft.qs.splice(i, 1); dirty = true; render(); });
        list.appendChild(h('div', { class: 'ls-card', style: { padding: '8px 10px' } }, h('div', { class: 'ls-row' }, h('span', { class: 'ls-tag' }, L.TYPE_EMOJI[q.t]), h('div', { class: 'ls-grow' }, h('div', { style: { fontWeight: '700', overflowWrap: 'anywhere' } }, s.q), h('div', { class: 'ls-muted', style: { overflowWrap: 'anywhere' } }, s.a)), h('button', { class: 'ls-btn sm', onclick: () => { editing = i; adding = false; renderList(); } }, '✏️'), del)));
      });
    }
    renderList(); return wrap;
  }
  /* --- plakken --- */
  function tabPlak() {
    const st = { fmt: 'auto', types: new Set(['mc', 'type']), dir: 'fwd' };
    const ta = h('textarea', { class: 'ls-ta', placeholder: 'Plak hier je lijst.\n\nhuis - house\nkat; cat\nWat is 2+2? 4\n1. appel  apple', style: { minHeight: '140px' } });
    const prev = h('div'); const fmtSel = h('select', { class: 'ls-sel', onchange: (e) => { st.fmt = e.target.value; upd(); } }, h('option', { value: 'auto' }, 'Automatisch herkennen'), Object.entries(L.FORMAT_NAMES).filter(([k]) => k !== 'none').map(([k, v]) => h('option', { value: k }, v)));
    const isLang = () => !!draft.lang && draft.lang !== 'nl';
    const chips = h('div'); const dirs = h('div');
    const drawChips = () => { mount(chips, h('span', { class: 'ls-lab' }, 'Vraagsoorten die gemaakt worden'), chipsRow([{ v: 'mc', l: '🔘 Meerkeuze' }, { v: 'type', l: '⌨️ Typen' }, { v: 'tf', l: '✔️ Waar/onwaar' }, { v: 'match', l: '🔗 Paren' }, { v: 'fill', l: '🕳️ Invullen' }].concat(isLang() ? [{ v: 'listen', l: '🎧 Luisteren' }] : []), (v) => st.types.has(v), (v) => { if (st.types.has(v)) { if (st.types.size > 1) st.types.delete(v); } else st.types.add(v); upd(); })); mount(dirs, h('span', { class: 'ls-lab' }, 'Richting'), chipsRow([{ v: 'fwd', l: 'Links → rechts' }, { v: 'rev', l: 'Rechts → links' }, { v: 'both', l: '↔ Allebei' }], (v) => st.dir === v, (v) => { st.dir = v; upd(); })); };
    let result = [];
    function upd() {
      const r = L.parsePaste(ta.value, { format: st.fmt });
      result = L.pairsToQuestions(r.pairs, { types: [...st.types], dir: st.dir, lang: draft.lang, seed: 7 });
      mount(prev, ta.value.trim() ? [h('div', { class: 'ls-muted' }, `Herkend als: ${r.formatName}${r.header ? ' (kopregel overgeslagen)' : ''} · ${r.pairs.length} paren → ${result.length} vragen${r.skipped.length ? ` · ${r.skipped.length} regels overgeslagen` : ''}`),
        h('div', { class: 'ls-prev' }, result.slice(0, 8).map((q) => { const s = L.qSummary(q); return h('div', null, h('span', { class: 'ls-tag' }, L.TYPE_EMOJI[q.t]), s.q, ' → ', h('b', null, s.a)); }), result.length > 8 ? h('div', { class: 'ls-muted' }, `… en ${result.length - 8} meer`) : null),
        r.skipped.length ? h('div', { class: 'ls-muted' }, 'Overgeslagen: ' + r.skipped.slice(0, 3).join(' | ')) : null,
        h('button', { class: 'ls-btn p big', disabled: !result.length, onclick: () => addQs(result) }, `＋ ${result.length} vragen toevoegen`)] : null);
    }
    ta.addEventListener('input', upd); drawChips(); upd();
    return h('div', { class: 'ls-card' }, h('h3', null, '📋 Lijst plakken'), h('div', { class: 'ls-muted' }, 'Woordenlijst of vragenlijst uit een boek, mail of spreadsheet. Ik herken: woord - vertaling, woord;vertaling, tab, vraag? antwoord, genummerd en CSV.'), ta,
      h('div', { class: 'ls-row', style: { marginTop: '6px' } }, h('button', { class: 'ls-btn sm', onclick: () => { ta.value = EXAMPLE_WORDS; upd(); } }, 'Voorbeeld woordjes'), h('button', { class: 'ls-btn sm', onclick: () => { ta.value = EXAMPLE_QA; upd(); } }, 'Voorbeeld vragen')),
      h('span', { class: 'ls-lab' }, 'Formaat'), fmtSel, chips, dirs, prev);
  }
  /* --- tekst -> vragen --- */
  function tabTekst() {
    const st = { kinds: new Set(['fill', 'mc', 'tf']) }; const ta = h('textarea', { class: 'ls-ta', placeholder: 'Plak hier een stukje tekst uit je boek of samenvatting…', style: { minHeight: '150px' } });
    const out = h('div'); let cands = []; let nSent = 0; const label = { fill: 'invullen', mc: 'meerkeuze', tf: 'waar/onwaar' };
    const addBtn = h('button', { class: 'ls-btn p big', onclick: () => addQs(cands.filter((c) => c.keep).map((c) => c.q)) });
    const upBtn = () => { const n = cands.filter((c) => c.keep).length; addBtn.textContent = `＋ ${n} vragen toevoegen`; addBtn.disabled = !n; };
    const draw = () => {
      mount(out, h('div', { class: 'ls-muted' }, `${nSent} zinnen → ${cands.length} voorstellen. Vink af wat je houdt.`),
        h('div', { class: 'ls-row' }, h('button', { class: 'ls-btn sm', onclick: () => { cands.forEach((c) => { c.keep = true; }); draw(); } }, 'Alles'), h('button', { class: 'ls-btn sm', onclick: () => { cands.forEach((c) => { c.keep = false; }); draw(); } }, 'Niets')),
        h('div', { class: 'ls-prev', style: { maxHeight: '340px' } }, cands.map((c) => h('label', { class: 'ls-ck' }, h('input', { type: 'checkbox', checked: c.keep, onchange: (e) => { c.keep = e.target.checked; upBtn(); } }), h('div', null, h('span', { class: 'ls-tag' }, label[c.kind]), c.q.q, h('div', { class: 'ls-muted' }, '→ ' + L.qSummary(c.q).a))))), addBtn);
      upBtn();
    };
    const make = () => {
      const r = L.textToQuestions(ta.value, { kinds: [...st.kinds], seed: Date.now() % 9999, max: 90 }); cands = r.cands; nSent = r.sentences;
      if (!cands.length) { mount(out, h('div', { class: 'ls-card ls-muted' }, ta.value.trim() ? 'Ik kon hier geen vragen van maken. Plak een stuk met volledige zinnen (liefst met jaartallen, getallen of namen).' : 'Plak eerst een tekst.')); return; }
      draw();
    };
    return h('div', { class: 'ls-card' }, h('h3', null, '📝 Tekst → vragen'), h('div', { class: 'ls-muted' }, 'Ik haal getallen, jaartallen en namen uit de zinnen en maak er invul-, meerkeuze- en waar/onwaar-vragen van. Jij kiest wat je houdt.'), ta,
      h('div', { class: 'ls-row', style: { marginTop: '6px' } }, h('button', { class: 'ls-btn sm', onclick: () => { ta.value = EXAMPLE_TEXT; } }, 'Voorbeeldtekst')),
      chipsRow([{ v: 'fill', l: '🕳️ Invullen' }, { v: 'mc', l: '🔘 Meerkeuze' }, { v: 'tf', l: '✔️ Waar/onwaar' }], (v) => st.kinds.has(v), (v) => { if (st.kinds.has(v)) { if (st.kinds.size > 1) st.kinds.delete(v); } else st.kinds.add(v); }),
      h('button', { class: 'ls-btn p big', onclick: make }, '✨ Maak vragen'), out);
  }
  /* --- generator-wizard --- */
  function tabGen() {
    const wrap = h('div'); let pick = null; let params = {}; let n = 20;
    const home = () => {
      mount(wrap, h('div', { class: 'ls-card' }, h('h3', null, '⚙️ Generator'), h('div', { class: 'ls-muted' }, 'Kies een soort. De computer maakt zoveel vragen als je wilt, op jouw niveau.')),
        h('div', { class: 'ls-modes' }, L.GENERATORS.map((g) => h('button', { class: 'ls-mode', onclick: () => { pick = g; params = L.defaultParams(g.kind); step2(); } }, h('b', null, g.emoji), h('span', null, g.name), h('small', null, g.desc)))));
    };
    const step2 = () => {
      const g = pick; const prev = h('div'); const form = h('div');
      for (const p of g.params) {
        if (p.type === 'select') form.appendChild(h('div', null, h('span', { class: 'ls-lab' }, p.label), chipsRow(p.options, (v) => String(params[p.key]) === String(v), (v) => { params[p.key] = typeof p.def === 'number' ? Number(v) : v; show(); })));
        else if (p.type === 'multi') { const set = new Set(params[p.key]); form.appendChild(h('div', null, h('span', { class: 'ls-lab' }, p.label), chipsRow(p.options, (v) => set.has(v), (v) => { if (set.has(v)) { if (set.size > 1) set.delete(v); } else set.add(v); params[p.key] = [...set].sort((a, b) => a - b); show(); }))); }
        else if (p.type === 'text') { const t = h('textarea', { class: 'ls-ta', placeholder: 'huis - house\nkat - cat', value: params[p.key] || '' }); t.addEventListener('input', () => { params[p.key] = t.value; show(); }); form.appendChild(h('div', null, h('span', { class: 'ls-lab' }, p.label), t)); }
      }
      let qs = [];
      function show() {
        qs = L.generate(g.kind, params, g.kind === 'wordpairs' ? 500 : n, Date.now() % 100000);
        mount(prev, h('div', { class: 'ls-muted' }, `Voorbeeld (${qs.length} vragen klaar):`), h('div', { class: 'ls-prev' }, qs.slice(0, 5).map((q) => { const s = L.qSummary(q); return h('div', null, h('span', { class: 'ls-tag' }, L.TYPE_EMOJI[q.t]), s.q, ' → ', h('b', null, s.a)); })),
          h('button', { class: 'ls-btn p big', disabled: !qs.length, onclick: () => { if (g.kind === 'wordpairs' && params.lang && params.lang !== 'nl' && !draft.lang) { draft.lang = params.lang; } addQs(qs); } }, `＋ ${qs.length} vragen toevoegen`), h('button', { class: 'ls-btn', style: { width: '100%', marginTop: '6px' }, onclick: show }, '🎲 Andere voorbeelden'));
      }
      mount(wrap, h('div', { class: 'ls-card' }, h('div', { class: 'ls-row' }, h('button', { class: 'ls-btn sm', onclick: home }, '← Terug'), h('h3', { style: { margin: 0 } }, `${g.emoji} ${g.name}`)), form,
        g.kind === 'wordpairs' ? null : h('div', null, h('span', { class: 'ls-lab' }, 'Hoeveel vragen?'), chipsRow([10, 20, 40, 80].map((v) => ({ v, l: String(v) })), (v) => n === v, (v) => { n = v; show(); })), prev));
      show();
    };
    home(); return wrap;
  }
  /* --- delen --- */
  function tabDelen() {
    const { kit: k } = L.cleanKit({ ...draft, name: draft.name || 'Mijn kit' });
    const code = k.qs.length ? L.encodeKit(k) : ''; const txt = L.kitToText(k);
    const ta = h('textarea', { class: 'ls-ta', readonly: true, onclick: (e) => { try { e.target.select(); } catch (er) { /* ok */ } } }); ta.value = code;
    const ta2 = h('textarea', { class: 'ls-ta', placeholder: 'Plak hier een kit-code (begint met LK2.)' }); const info = h('div');
    const doCheck = () => {
      const r = L.decodeKit(ta2.value);
      if (r.error) { mount(info, h('div', { style: { color: '#ef4444', fontWeight: '700' } }, ta2.value.trim() ? r.error : '')); return; }
      mount(info, h('div', { class: 'ls-card ls-pop' }, h('b', null, `${r.kit.emoji} ${r.kit.name}`), h('div', { class: 'ls-muted' }, `${r.kit.qs.length} vragen${r.dropped ? ` (${r.dropped} overgeslagen)` : ''}`),
        h('div', { class: 'ls-row', style: { marginTop: '8px' } }, h('button', { class: 'ls-btn p', style: { flex: 1 }, onclick: () => { addQs(r.kit.qs); } }, 'Voeg toe aan deze kit'),
          h('button', { class: 'ls-btn', style: { flex: 1 }, onclick: () => { const nk = { ...r.kit, id: C.Kits.newId(), src: 'user' }; try { C.Kits.save(nk); S.toast('Als nieuwe kit opgeslagen ✓'); S.refresh && S.refresh(); } catch (e) { S.toast('Opslaan lukt niet'); } } }, 'Nieuwe kit'))));
    };
    ta2.addEventListener('input', doCheck);
    return h('div', null, h('div', { class: 'ls-card' }, h('h3', null, '📤 Deel deze kit'), h('div', { class: 'ls-muted' }, k.qs.length ? `Stuur deze code naar je broer of vriend. Zij plakken hem bij “Kit-code plakken” en hebben jouw kit. (${code.length} tekens)` : 'Maak eerst een paar vragen.'), ta,
      h('div', { class: 'ls-row', style: { marginTop: '8px' } }, h('button', { class: 'ls-btn p', style: { flex: 1 }, disabled: !code, onclick: async () => { S.toast((await copyText(code, ta)) ? 'Code gekopieerd ✓' : 'Selecteer de code en kopieer hem zelf'); } }, '📋 Kopieer code'),
        h('button', { class: 'ls-btn', style: { flex: 1 }, disabled: !txt, onclick: async () => { const t2 = h('textarea'); t2.value = txt; document.body.appendChild(t2); const ok = await copyText(txt, t2); if (t2.parentNode) t2.parentNode.removeChild(t2); S.toast(ok ? 'Als tekst gekopieerd ✓' : 'Kopiëren lukt niet'); } }, '📄 Kopieer als tekst'))),
      h('div', { class: 'ls-card' }, h('h3', null, '📥 Code plakken'), ta2, info));
  }
  mount(body, meta, seg, main, bottom); render();
  return scr;
}

/* ---------- kit-code plakken (vanuit de bibliotheek) ---------- */
export function openImportCode(S) {
  const C = S.C; const scr = S.screen('📥 Kit-code plakken'); const ta = h('textarea', { class: 'ls-ta', placeholder: 'Plak hier de kit-code (begint met LK2.)' }); const info = h('div');
  ta.addEventListener('input', () => {
    const r = L.decodeKit(ta.value);
    if (r.error) { mount(info, h('div', { style: { color: '#ef4444', fontWeight: '700' } }, ta.value.trim() ? r.error : '')); return; }
    mount(info, h('div', { class: 'ls-card ls-pop' }, h('div', { style: { fontSize: '40px' } }, r.kit.emoji), h('b', null, r.kit.name), h('div', { class: 'ls-muted' }, `${r.kit.qs.length} vragen${r.dropped ? ` (${r.dropped} overgeslagen)` : ''}`),
      h('button', { class: 'ls-btn p big', style: { marginTop: '8px' }, onclick: () => { const nk = { ...r.kit, id: C.Kits.newId(), src: 'user' }; try { C.Kits.save(nk); } catch (e) { S.toast('Opslaan lukt niet'); return; } S.toast('Kit toegevoegd ✓'); S.refresh && S.refresh(); scr.close(); } }, '＋ Toevoegen aan mijn kits')));
  });
  mount(scr.body, h('div', { class: 'ls-card' }, h('h3', null, 'Kit van iemand anders'), h('div', { class: 'ls-muted' }, 'Je broer of vriend heeft een kit-code gestuurd? Plak hem hier.'), ta, info));
  return scr;
}
