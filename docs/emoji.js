// Emoji-mixer: echte emoji-mixen (Google Emoji Kitchen) voor 154 emoji, met een eigen mix als er geen officiële bestaat.
// De plaatjes komen van Google's servers (gstatic.com); in docs/emoji-data.json staat alleen welke mixen er bestaan.

const FALLBACK_MODES = [['half', '◐ Half-half'], ['hoed', '🎩 Hoedje'], ['hoek', '📎 Sticker'], ['draai', '🌀 Draai'], ['totem', '🗼 Totem'], ['smoothie', '🥤 Smoothie']];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Tekent een zelfgemaakte mix op een vierkant canvas (alleen als er geen officiële mix bestaat).
function drawMix(ctx, a, b, mode, s) {
  ctx.clearRect(0, 0, s, s);
  const put = (e, x, y, size, rot = 0, alpha = 1) => {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, 0, size * 0.04); ctx.restore();
  };
  const c = s / 2;
  if (mode === 'half') {
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, c, s); ctx.clip(); put(a, c, c, s * 0.82); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(c, 0, c, s); ctx.clip(); put(b, c, c, s * 0.82); ctx.restore();
  } else if (mode === 'hoed') { put(a, c, c * 1.12, s * 0.72); put(b, c, c * 0.34, s * 0.42, -0.12); }
  else if (mode === 'hoek') { put(a, c, c, s * 0.8); put(b, s * 0.76, s * 0.76, s * 0.4, 0.2); }
  else if (mode === 'draai') { put(a, c, c, s * 0.8); put(b, c, c, s * 0.58, 0.55, 0.9); }
  else if (mode === 'totem') { put(a, c, c * 0.5, s * 0.5); put(b, c, c * 1.5, s * 0.5); }
  else { put(a, c * 0.92, c, s * 0.8, -0.08); put(b, c * 1.08, c, s * 0.8, 0.08, 0.55); }
}

const urlFor = (date, l, r) => { const u = (c) => 'u' + c.split('-').join('-u'); return `https://www.gstatic.com/android/keyboard/emojikitchen/${date}/${u(l)}/${u(l)}_${u(r)}.png`; };

// ctx: { view, esc, uid }
export async function emojiView(ctx) {
  const { view, esc, uid } = ctx;
  view.innerHTML = '<div class="box center"><small>Emoji laden…</small></div>';
  let data;
  try { data = await (await fetch('./emoji-data.json')).json(); }
  catch { view.innerHTML = '<div class="box err">De emoji-lijst laden lukt niet. Heb je internet?</div>'; return; }

  const info = new Map();                    // emoji -> { name, code }
  const byCode = new Map();
  for (const items of Object.values(data.sets)) for (const [e, n, c] of items) { info.set(e, { name: n, code: c }); byCode.set(c, e); }
  const mix = new Map();                     // "l|r" -> datum
  const partners = new Map();                // code -> Set(code)
  for (let i = 0; i < data.flat.length; i += 3) {
    const l = data.codes[data.flat[i]], r = data.codes[data.flat[i + 1]], d = data.dates[data.flat[i + 2]];
    mix.set(`${l}|${r}`, d);
    (partners.get(l) || partners.set(l, new Set()).get(l)).add(r); (partners.get(r) || partners.set(r, new Set()).get(r)).add(l);
  }
  const official = (x, y) => {
    const a = info.get(x)?.code, b = info.get(y)?.code; if (!a || !b) return null;
    if (mix.has(`${a}|${b}`)) return urlFor(mix.get(`${a}|${b}`), a, b);
    if (mix.has(`${b}|${a}`)) return urlFor(mix.get(`${b}|${a}`), b, a);
    return null;
  };
  const mixName = (x, y) => {
    const p = info.get(x)?.name || 'iets', q = info.get(y)?.name || 'iets';
    return x === y ? cap(`dubbele ${p}`) : cap(p.slice(0, Math.ceil(p.length / 2)) + q.slice(Math.floor(q.length / 2)));
  };

  const FAV = `emix:fav:${uid}`;
  const readFav = () => { try { return JSON.parse(localStorage.getItem(FAV) || '[]'); } catch { return []; } };
  const writeFav = (l) => { try { localStorage.setItem(FAV, JSON.stringify(l.slice(0, 60))); } catch {} };
  const cats = Object.keys(data.sets); const all = [...info.keys()];
  let a = '🐱', b = '🍕', fbMode = 'half', slot = 'a', cat = cats[0];
  if (!official(a, b)) b = '🍔';

  const randomMix = () => { for (let i = 0; i < 400; i++) { const x = all[Math.floor(Math.random() * all.length)], y = all[Math.floor(Math.random() * all.length)]; if (official(x, y)) { a = x; b = y; return; } } };

  function draw() {
    const favs = readFav(); const url = official(a, b); const other = slot === 'a' ? b : a; const okSet = partners.get(info.get(other)?.code);
    view.innerHTML = `
      <div class="box center" style="padding:1rem">
        <div id="em-stage" style="width:min(100%,300px);aspect-ratio:1;margin:0 auto;background:repeating-conic-gradient(#0001 0 25%,transparent 0 50%) 50%/24px 24px;border-radius:18px;display:grid;place-items:center">
          ${url ? `<img id="em-img" crossorigin="anonymous" src="${url}" alt="" style="width:100%;height:100%;object-fit:contain">` : '<canvas id="em-cv" width="512" height="512" style="width:100%;height:100%"></canvas>'}
        </div>
        <div style="font-size:1.4rem;font-weight:800;margin-top:.5rem">${esc(mixName(a, b))}</div>
        <small>${a} ${esc(info.get(a)?.name || '')}  ＋  ${b} ${esc(info.get(b)?.name || '')}</small>
        ${url ? '' : '<div><small class="err">Voor deze twee bestaat geen officiële mix. Dit is een eigen mix.</small></div>'}
        <div class="row wrap" style="justify-content:center;margin-top:.6rem"><button id="em-rnd">🎲 Willekeurig</button><button id="em-swap">🔁 Wissel</button><button class="pri" id="em-save">💾 Opslaan</button><button id="em-fav">⭐ Bewaar</button></div>
        ${url ? '' : `<div class="row wrap" style="justify-content:center">${FALLBACK_MODES.map(([k, l]) => `<button data-mode="${k}" class="${k === fbMode ? 'pri' : ''}">${l}</button>`).join('')}</div>`}
      </div>
      <div class="box"><b>Kies je emoji</b>
        <div class="row" style="margin:.3rem 0"><button id="sa" class="${slot === 'a' ? 'pri' : ''}" style="flex:1;font-size:1.6rem">${a}</button><span>＋</span><button id="sb" class="${slot === 'b' ? 'pri' : ''}" style="flex:1;font-size:1.6rem">${b}</button></div>
        <small>Tik op een vak en kies een emoji. Vage (doorzichtige) emoji's hebben geen officiële mix met ${other}.</small>
        <div class="row wrap" style="margin:.4rem 0">${cats.map((k) => `<button data-cat="${k}" class="${k === cat ? 'pri' : ''}" style="padding:.25rem .55rem">${k}</button>`).join('')}</div>
        <div style="display:flex;flex-wrap:wrap;gap:.15rem">${data.sets[cat].map(([e, n, c]) => `<button data-e="${e}" title="${esc(n)}" style="border:0;background:none;font-size:1.7rem;padding:.2rem;${okSet && !okSet.has(c) ? 'opacity:.25' : ''}">${e}</button>`).join('')}</div>
      </div>
      <div class="box"><b>Mijn verzameling</b>${favs.length ? `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin-top:.5rem">${favs.map((f, i) => { const u = official(f.a, f.b); return `<div style="text-align:center">${u ? `<img data-f="${i}" src="${u}" alt="" style="width:100%;border-radius:12px;background:#0001;cursor:pointer">` : `<canvas data-f="${i}" width="160" height="160" style="width:100%;border-radius:12px;background:#0001;cursor:pointer"></canvas>`}</div>`; }).join('')}</div><small>Tik om te openen. Houd lang ingedrukt om te verwijderen.</small>` : '<br><small>Nog leeg. Tik op ⭐ Bewaar bij een mix die je mooi vindt.</small>'}</div>
      <small style="display:block;text-align:center;opacity:.6;margin-bottom:1rem">Mixen: Google Emoji Kitchen</small>`;
    const cv = view.querySelector('#em-cv'); if (cv) drawMix(cv.getContext('2d'), a, b, fbMode, 512);
    view.querySelectorAll('canvas[data-f]').forEach((x) => { const f = favs[Number(x.dataset.f)]; drawMix(x.getContext('2d'), f.a, f.b, f.mode || 'half', 160); });
    const img = view.querySelector('#em-img'); if (img) img.onerror = () => { img.replaceWith(Object.assign(document.createElement('div'), { innerHTML: '<small class="err">Het plaatje kon niet geladen worden.</small>' })); };
    view.querySelectorAll('[data-mode]').forEach((x) => x.onclick = () => { fbMode = x.dataset.mode; draw(); });
    view.querySelectorAll('[data-cat]').forEach((x) => x.onclick = () => { cat = x.dataset.cat; draw(); });
    view.querySelectorAll('[data-e]').forEach((x) => x.onclick = () => { if (slot === 'a') { a = x.dataset.e; slot = 'b'; } else { b = x.dataset.e; slot = 'a'; } draw(); });
    view.querySelector('#sa').onclick = () => { slot = 'a'; draw(); }; view.querySelector('#sb').onclick = () => { slot = 'b'; draw(); };
    view.querySelector('#em-rnd').onclick = () => { randomMix(); draw(); };
    view.querySelector('#em-swap').onclick = () => { [a, b] = [b, a]; draw(); };
    view.querySelector('#em-fav').onclick = () => { const l = readFav(); if (!l.some((f) => f.a === a && f.b === b)) l.unshift({ a, b, mode: fbMode }); writeFav(l); draw(); };
    view.querySelector('#em-save').onclick = async () => {
      const name = `${mixName(a, b).toLowerCase()}.png`;
      const give = (blob) => { const u = URL.createObjectURL(blob); const an = document.createElement('a'); an.href = u; an.download = name; document.body.appendChild(an); an.click(); an.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); };
      try { if (url) give(await (await fetch(url)).blob()); else cv.toBlob((bl) => bl && give(bl), 'image/png'); }
      catch { window.open(url, '_blank'); }
    };
    view.querySelectorAll('[data-f]').forEach((x) => {
      let timer = null, long = false; const i = Number(x.dataset.f);
      x.onpointerdown = () => { long = false; timer = setTimeout(() => { long = true; const l = readFav(); l.splice(i, 1); writeFav(l); draw(); }, 700); };
      x.onpointerup = x.onpointerleave = x.onpointercancel = () => clearTimeout(timer);
      x.onclick = () => { if (long) return; const f = readFav()[i]; if (f) { a = f.a; b = f.b; fbMode = f.mode || 'half'; draw(); window.scrollTo({ top: 0 }); } };
    });
  }
  draw();
}
