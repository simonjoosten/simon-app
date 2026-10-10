// Dagelijkse mop: elke dag een nieuwe mop, nog een mop, favorieten en delen. De moppen staan in jokes.js.

const dayNumber = (d = new Date()) => Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);

// ctx: { view, esc, uid }
export async function mopView(ctx) {
  const { view, esc, uid } = ctx;
  let JOKES;
  try { JOKES = (await import('./jokes.js')).JOKES; } catch { view.innerHTML = '<div class="box err">De moppen laden lukt niet.</div>'; return; }
  const K = `mop:${uid}`;
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(`${K}:${k}`) || 'null') ?? d; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(`${K}:${k}`, JSON.stringify(v)); } catch {} };
  let favs = read('favs', []), seen = read('seen', []), streak = read('streak', { last: null, n: 0 });
  const today = dayNumber(); const todayIdx = ((today * 7919) % JOKES.length + JOKES.length) % JOKES.length;   // vaste mop per dag
  let idx = todayIdx, tab = 'dag', shown = false;
  // streak: opeenvolgende dagen dat je de app opent
  if (streak.last !== today) { streak = { last: today, n: streak.last === today - 1 ? streak.n + 1 : 1 }; write('streak', streak); }

  const next = () => { const left = JOKES.map((_, i) => i).filter((i) => !seen.includes(i) && i !== idx); const pool = left.length ? left : JOKES.map((_, i) => i).filter((i) => i !== idx); idx = pool[Math.floor(Math.random() * pool.length)]; shown = false; };
  const remember = () => { if (!seen.includes(idx)) { seen.push(idx); if (seen.length >= JOKES.length) seen = [idx]; write('seen', seen); } };

  function card(i, big) {
    const [q, a] = JOKES[i]; const isFav = favs.includes(i);
    return `<div class="box center" style="padding:1.4rem">
      <div style="font-size:3rem">${shown || !big ? '😄' : '🤔'}</div>
      <div style="font-size:1.25rem;font-weight:700;margin:.6rem 0">${esc(q)}</div>
      ${big && !shown ? '<button class="pri" id="mp-show" style="font-size:1.05rem;padding:.6rem 1.4rem">Toon het antwoord</button>'
        : `<div style="font-size:1.25rem;color:var(--accent);font-weight:800;margin:.4rem 0 .8rem">${esc(a)}</div>`}
      ${big ? `<div class="row wrap" style="justify-content:center"><button id="mp-fav" class="${isFav ? 'pri' : ''}">${isFav ? '⭐ Favoriet' : '☆ Bewaar'}</button><button id="mp-copy">📋 Kopieer</button><button id="mp-next">🎲 Nog een mop</button></div><small id="mp-msg"></small>` : ''}
    </div>`;
  }

  function draw() {
    let body = '';
    if (tab === 'dag') {
      body = `<div class="box center" style="padding:.6rem"><small>${idx === todayIdx ? '📅 Mop van vandaag' : '🎲 Willekeurige mop'} · 🔥 ${streak.n} ${streak.n === 1 ? 'dag' : 'dagen'} op rij</small></div>${card(idx, true)}
        ${idx !== todayIdx ? '<div class="row" style="justify-content:center"><button id="mp-today">Terug naar de mop van vandaag</button></div>' : ''}`;
    } else {
      body = favs.length ? favs.map((i) => `<div class="box"><b>${esc(JOKES[i][0])}</b><div style="color:var(--accent);font-weight:700;margin-top:.3rem">${esc(JOKES[i][1])}</div><div class="row"><button data-un="${i}">Verwijder</button></div></div>`).join('') : '<div class="box center"><small>Nog geen favorieten. Tik op ☆ Bewaar bij een mop die je goed vindt.</small></div>';
    }
    view.innerHTML = `<div class="row wrap"><button data-tab="dag" class="${tab === 'dag' ? 'pri' : ''}" style="flex:1">😄 Mop</button><button data-tab="fav" class="${tab === 'fav' ? 'pri' : ''}" style="flex:1">⭐ Favorieten (${favs.length})</button></div>${body}<small style="display:block;text-align:center;opacity:.6;margin:.4rem 0 1rem">${JOKES.length} moppen</small>`;
    view.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; draw(); });
    view.querySelectorAll('[data-un]').forEach((b) => b.onclick = () => { favs = favs.filter((x) => x !== +b.dataset.un); write('favs', favs); draw(); });
    const g = (s) => view.querySelector(s);
    if (g('#mp-show')) g('#mp-show').onclick = () => { shown = true; remember(); draw(); };
    if (g('#mp-next')) g('#mp-next').onclick = () => { remember(); next(); draw(); };
    if (g('#mp-today')) g('#mp-today').onclick = () => { idx = todayIdx; shown = false; draw(); };
    if (g('#mp-fav')) g('#mp-fav').onclick = () => { favs = favs.includes(idx) ? favs.filter((x) => x !== idx) : [idx, ...favs]; write('favs', favs); draw(); };
    if (g('#mp-copy')) g('#mp-copy').onclick = async () => { const t = `${JOKES[idx][0]}\n${JOKES[idx][1]}`; try { await navigator.clipboard.writeText(t); g('#mp-msg').textContent = 'Gekopieerd ✓'; } catch { g('#mp-msg').textContent = 'Kopiëren lukt niet in deze browser.'; } };
  }
  draw();
}
