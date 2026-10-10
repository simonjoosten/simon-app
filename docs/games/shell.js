// Gamescroller: scrollende feed met minigames, grote spellen met opslaan, en korte filmpjes (clips + uploads).
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where, orderBy, limit }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const CHUNK = 450000;            // deelbaar door 3 (base64-stukjes plakken netjes aan elkaar)
const MAX_VIDEO = 8 * 1024 * 1024;
const MAX_UPLOADS = 10;
const SAVE_EVERY_MS = 30000;     // hooguit zo vaak naar Firebase schrijven
const readB64 = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
const b64ToBytes = (b64) => { const bin = atob(b64); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; };
const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmt = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'K' : String(n));

const CSS = `
.gs{position:fixed;inset:0;z-index:60;background:#0b0b12;color:#fff;display:flex;flex-direction:column;font-family:system-ui,sans-serif;max-width:480px;margin:0 auto}
.gs *{box-sizing:border-box}
.gs-bar{display:flex;align-items:center;gap:.4rem;padding:.5rem .6rem;background:#12121c;border-bottom:1px solid #26263a;flex:none}
.gs-bar button{background:#1f1f31;color:#fff;border:1px solid #30304a;border-radius:99px;padding:.4rem .7rem;font:inherit;font-size:.9rem;cursor:pointer;white-space:nowrap}
.gs-bar button.on{background:linear-gradient(135deg,#8b5cf6,#ec4899);border-color:transparent}
.gs-body{flex:1;min-height:0;position:relative}
.gs-feed{height:100%;overflow-y:auto;scroll-snap-type:y mandatory;overscroll-behavior:contain}
.gs-card{height:100%;scroll-snap-align:start;scroll-snap-stop:always;position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:1rem}
.gs-emoji{font-size:5.5rem;filter:drop-shadow(0 6px 12px rgba(0,0,0,.4))}
.gs-name{font-size:1.8rem;font-weight:800;margin:.3rem 0 0}
.gs-hint{opacity:.85;margin:.2rem 0 1rem}
.gs-play{background:#fff;color:#111;border:0;border-radius:99px;padding:.8rem 2.2rem;font:700 1.1rem system-ui;cursor:pointer}
.gs-lb{margin-top:1.1rem;background:rgba(0,0,0,.28);border-radius:14px;padding:.6rem .9rem;min-width:11rem;font-size:.9rem;text-align:left}
.gs-swipe{position:absolute;bottom:.7rem;left:0;right:0;opacity:.6;font-size:.8rem}
.gs-host{position:absolute;inset:0;background:#000}
.gs-hud{position:absolute;top:.5rem;left:.5rem;right:.5rem;display:flex;justify-content:space-between;align-items:center;z-index:3;pointer-events:none}
.gs-hud button{pointer-events:auto;background:rgba(0,0,0,.55);color:#fff;border:0;border-radius:99px;padding:.35rem .8rem;font:inherit;cursor:pointer}
.gs-score{background:rgba(0,0,0,.55);border-radius:99px;padding:.35rem .9rem;font-weight:700}
.gs-over{position:absolute;inset:0;z-index:4;background:rgba(5,5,12,.82);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;text-align:center}
.gs-over button{background:#fff;color:#111;border:0;border-radius:99px;padding:.65rem 1.6rem;font:700 1rem system-ui;cursor:pointer}
.gs-over button.sec{background:#2a2a40;color:#fff}
.gs-grid{height:100%;overflow-y:auto;padding:.8rem;display:grid;grid-template-columns:1fr 1fr;gap:.6rem;align-content:start}
.gs-tile{border-radius:16px;padding:.9rem .6rem;text-align:center;cursor:pointer;border:0;color:#fff;font:inherit}
.gs-tile b{display:block;margin-top:.2rem}.gs-tile small{display:block;opacity:.85;font-size:.75rem}
.gs-big{position:absolute;inset:0;background:#0b0b12;display:flex;flex-direction:column;z-index:5}
.gs-big .gs-bar{justify-content:space-between}
.gs-bigbody{flex:1;min-height:0;overflow-y:auto;background:#14141f}
.gs-banner{background:#7c2d12;color:#fff;padding:.4rem .7rem;font-size:.8rem;flex:none}
.gs-short{height:100%;scroll-snap-align:start;scroll-snap-stop:always;position:relative;display:flex;align-items:center;justify-content:center;background:#000}
.gs-short canvas,.gs-short video{max-width:100%;max-height:100%;aspect-ratio:9/16;background:#111}
.gs-cap{position:absolute;left:0;right:0;bottom:0;padding:2.5rem 1rem 1.4rem;background:linear-gradient(transparent,rgba(0,0,0,.75));text-align:left}
.gs-cap b{font-size:1.1rem}.gs-cap div{opacity:.9;margin-top:.15rem}
.gs-up{position:absolute;right:.7rem;bottom:8rem;z-index:3;display:flex;flex-direction:column;gap:.5rem;align-items:center}
.gs-up button{background:rgba(0,0,0,.55);color:#fff;border:0;border-radius:99px;padding:.55rem .8rem;font:inherit;cursor:pointer}
.gs input[type=text]{background:#1f1f31;color:#fff;border:1px solid #30304a;border-radius:10px;padding:.55rem .7rem;font:inherit;width:100%}
`;

export async function gamescroller(c) {
  const { db, me, esc, nice, close } = c;
  if (!document.getElementById('gs-style')) { const s = document.createElement('style'); s.id = 'gs-style'; s.textContent = CSS; document.head.appendChild(s); }
  const root = document.createElement('div'); root.className = 'gs';
  root.innerHTML = `<div class="gs-bar"><button id="gs-x">✕</button><button data-t="games" class="on">🎮 Games</button><button data-t="big">🏆 Big games</button><button data-t="shorts">🎬 Shorts</button></div><div class="gs-banner" id="gs-banner" style="display:none"></div><div class="gs-body" id="gs-body"></div>`;
  document.body.appendChild(root);
  const body = root.querySelector('#gs-body');
  let cleanup = () => {}; let alive = true;

  const banner = (t) => { const b = root.querySelector('#gs-banner'); b.textContent = t; b.style.display = t ? '' : 'none'; };
  const quota = (e) => e && (e.code === 'resource-exhausted' || /quota/i.test(e.message || ''));
  const shut = () => { alive = false; cleanup(); root.remove(); close(); };
  root.querySelector('#gs-x').onclick = shut;
  root.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => show(b.dataset.t));

  // ---- Registry laden ----
  let REG = { MINIS: [], BIGS: [], CLIP_FILES: [] };
  try { REG = await import('./registry.js'); } catch (e) { console.error(e); }
  const loadAll = async (fns) => (await Promise.all(fns.map((f) => f().then((m) => m.default || m).catch((e) => { console.error(e); return null; })))).filter(Boolean);

  // ---- Scores ----
  const bests = new Map();       // game -> mijn beste
  try { const s = await getDocs(query(collection(db, 'scores'), where('uid', '==', me.uid))); s.docs.forEach((d) => bests.set(d.data().game, d.data().best)); } catch (e) { if (quota(e)) banner('Scores laden staat even uit (daglimiet van Firebase bereikt).'); }
  const lbCache = new Map();
  const leaderboard = async (id) => {
    if (lbCache.has(id)) return lbCache.get(id);
    const s = await getDocs(query(collection(db, 'scores'), where('game', '==', id)));
    const top = s.docs.map((d) => d.data()).sort((a, b) => b.best - a.best).slice(0, 3);
    lbCache.set(id, top); return top;
  };
  const saveBest = async (id, score) => {
    const prev = bests.get(id) || 0;
    if (score <= prev) return false;
    bests.set(id, score); lbCache.delete(id);
    try { await setDoc(doc(db, 'scores', `${id}__${me.uid}`), { game: id, uid: me.uid, name: me.name, best: score, updated: Date.now() }); }
    catch (e) { if (quota(e)) banner('Score kon niet gedeeld worden (daglimiet). Je record staat wel op dit apparaat.'); }
    try { localStorage.setItem(`gs:best:${me.uid}:${id}`, String(score)); } catch {}
    return true;
  };

  // ---- Tabs ----
  function show(tab) {
    cleanup(); cleanup = () => {};
    root.querySelectorAll('[data-t]').forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
    body.innerHTML = '<div style="padding:2rem;text-align:center;opacity:.7">Laden…</div>';
    ({ games: gamesTab, big: bigTab, shorts: shortsTab })[tab]().catch((e) => { console.error(e); body.innerHTML = `<div style="padding:2rem;text-align:center;color:#fca5a5">${esc(nice(e))}</div>`; });
  }

  /* ================= Games (minigames feed) ================= */
  async function gamesTab() {
    const games = shuffle(await loadAll(REG.MINIS));
    if (!alive) return;
    if (!games.length) { body.innerHTML = '<div style="padding:2rem;text-align:center;opacity:.7">Nog geen spellen gevonden.</div>'; return; }
    body.innerHTML = '<div class="gs-feed" id="feed"></div>';
    const feed = body.querySelector('#feed');
    let playing = null;   // { inst, card, game }
    const stopPlay = () => { if (!playing) return; try { playing.inst.destroy && playing.inst.destroy(); } catch (e) { console.error(e); } playing.dead = true; playing.card.querySelectorAll('.gs-host,.gs-over').forEach((n) => n.remove()); playing = null; feed.style.overflowY = 'auto'; };
    cleanup = stopPlay;

    const cards = games.map((g, i) => {
      const h = hash(g.id) % 360;
      const card = document.createElement('div'); card.className = 'gs-card';
      card.style.background = `linear-gradient(160deg,hsl(${h} 70% 38%),hsl(${(h + 50) % 360} 65% 18%))`;
      card.innerHTML = `<div class="gs-emoji">${esc(g.emoji || '🎮')}</div><div class="gs-name">${esc(g.name)}</div><div class="gs-hint">${esc(g.hint || '')}</div>
        <button class="gs-play">▶ Speel</button><div class="gs-lb" data-lb><small>Beste scores laden…</small></div><div class="gs-swipe">veeg omhoog voor het volgende spel ↑ (${i + 1}/${games.length})</div>`;
      card.querySelector('.gs-play').onclick = () => start(card, g);
      feed.appendChild(card);
      return { card, g };
    });

    const renderLb = async (card, g) => {
      const el = card.querySelector('[data-lb]');
      try {
        const top = await leaderboard(g.id); const mine = bests.get(g.id);
        el.innerHTML = `${mine ? `<b>Jouw record: ${fmt(mine)}</b>` : '<b>Nog geen score van jou</b>'}${top.length ? '<br>' + top.map((t, i) => `${['🥇', '🥈', '🥉'][i]} ${esc(t.name)} · ${fmt(t.best)}`).join('<br>') : ''}`;
      } catch (e) { el.innerHTML = `<small>${mine0(g)}</small>`; }
    };
    const mine0 = (g) => (bests.get(g.id) ? `Jouw record: ${fmt(bests.get(g.id))}` : 'Nog geen score');
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && !e.target._lb) { e.target._lb = true; const x = cards.find((k) => k.card === e.target); if (x) renderLb(x.card, x.g); } }), { root: feed, threshold: 0.6 });
    cards.forEach((k) => io.observe(k.card));
    const prevCleanup = cleanup; cleanup = () => { prevCleanup(); io.disconnect(); };

    function start(card, g) {
      stopPlay();
      feed.style.overflowY = 'hidden';
      const host = document.createElement('div'); host.className = 'gs-host';
      const hud = document.createElement('div'); hud.className = 'gs-hud';
      hud.innerHTML = '<button data-stop>✕ Stop</button><span class="gs-score">0</span>';
      card.appendChild(host); card.appendChild(hud);
      const state = { inst: null, card, game: g, dead: false };
      playing = state;
      let cur = 0, ended = false;
      const scoreEl = hud.querySelector('.gs-score');
      const removeHud = () => hud.remove();
      hud.querySelector('[data-stop]').onclick = () => { removeHud(); stopPlay(); };
      const api = {
        w: host.clientWidth || 360, h: host.clientHeight || 640,
        score: (n) => { cur = Math.max(0, Math.floor(Number(n) || 0)); scoreEl.textContent = fmt(cur); },
        end: (n) => {
          if (ended || state.dead) return; ended = true;
          const final = Math.max(0, Math.floor(Number(n ?? cur) || 0));
          saveBest(g.id, final).then((rec) => {
            if (state.dead) return;
            const over = document.createElement('div'); over.className = 'gs-over';
            over.innerHTML = `<div style="font-size:1.3rem;opacity:.8">Game over</div><div style="font-size:3rem;font-weight:800">${fmt(final)}</div>
              <div>${rec ? '🎉 Nieuw record!' : `Record: ${fmt(bests.get(g.id) || 0)}`}</div>
              <button data-again>↻ Opnieuw</button><button class="sec" data-next>Volgende spel ↓</button><button class="sec" data-quit>Stoppen</button>`;
            card.appendChild(over);
            over.querySelector('[data-again]').onclick = () => { removeHud(); stopPlay(); start(card, g); };
            over.querySelector('[data-next]').onclick = () => { removeHud(); stopPlay(); renderLb(card, g); const i = cards.findIndex((k) => k.card === card); const nx = cards[Math.min(i + 1, cards.length - 1)].card; feed.scrollTo({ top: nx.offsetTop, behavior: 'smooth' }); };
            over.querySelector('[data-quit]').onclick = () => { removeHud(); stopPlay(); renderLb(card, g); };
          });
        },
      };
      try { state.inst = g.create(host, api) || {}; }
      catch (e) { console.error(e); removeHud(); stopPlay(); alert(`Dit spel werkt niet: ${e.message}`); }
    }
  }

  /* ================= Big games (met opslaan) ================= */
  async function bigTab() {
    const games = await loadAll(REG.BIGS);
    if (!alive) return;
    const saved = new Map();
    try { const s = await getDocs(query(collection(db, 'saves'), where('uid', '==', me.uid))); s.docs.forEach((d) => saved.set(d.data().game, d.data().updated)); } catch (e) { if (quota(e)) banner('Opgeslagen spellen laden staat even uit (daglimiet).'); }
    games.forEach((g) => { try { if (localStorage.getItem(`gs:save:${me.uid}:${g.id}`)) saved.set(g.id, saved.get(g.id) || 1); } catch {} });
    body.innerHTML = `<div class="gs-grid">${games.map((g) => { const h = hash(g.id) % 360; return `<button class="gs-tile" data-g="${esc(g.id)}" style="background:linear-gradient(150deg,hsl(${h} 65% 40%),hsl(${(h + 45) % 360} 60% 24%))"><div style="font-size:2.6rem">${esc(g.emoji || '🏆')}</div><b>${esc(g.name)}</b><small>${esc(g.desc || '')}</small>${saved.has(g.id) ? '<small>💾 Voortgang bewaard</small>' : '<small>Nieuw</small>'}</button>`; }).join('') || '<div style="grid-column:1/-1;text-align:center;opacity:.7;padding:2rem">Nog geen grote spellen gevonden.</div>'}</div>`;
    body.querySelectorAll('[data-g]').forEach((b) => b.onclick = () => openBig(games.find((g) => g.id === b.dataset.g)));
  }

  function openBig(g) {
    const wrap = document.createElement('div'); wrap.className = 'gs-big';
    wrap.innerHTML = `<div class="gs-bar"><button data-back>‹ Terug</button><b>${esc(g.emoji || '')} ${esc(g.name)}</b><span id="gs-sv" style="font-size:.75rem;opacity:.7">💾</span></div><div class="gs-bigbody"></div>`;
    body.appendChild(wrap);
    const host = wrap.querySelector('.gs-bigbody');
    const key = `gs:save:${me.uid}:${g.id}`; const ref = doc(db, 'saves', `${g.id}__${me.uid}`);
    let pending = null, lastWrite = 0, timer = null, blocked = 0, instance = null, closed = false;
    const sv = wrap.querySelector('#gs-sv');
    const local = () => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
    const flush = async (force) => {
      if (!pending) return;
      if (blocked > Date.now() && !force) return;
      const payload = pending; pending = null; lastWrite = Date.now();
      try {
        await setDoc(ref, { game: g.id, uid: me.uid, data: payload.data, updated: payload.updated });
        sv.textContent = '💾 opgeslagen'; if (blocked) { blocked = 0; banner(''); }
      } catch (e) {
        pending = payload;   // nog niet weg: later opnieuw proberen
        if (quota(e)) { blocked = Date.now() + 5 * 60e3; banner('Firebase-daglimiet bereikt: je voortgang staat veilig op dit apparaat en wordt later opgeslagen.'); }
        sv.textContent = '⚠️ lokaal bewaard';
      }
    };
    const api = {
      async load() {
        let remote = null;
        try { const s = await getDoc(ref); if (s.exists()) remote = s.data(); } catch (e) { if (quota(e)) banner('Opslag in de cloud staat even uit; lokale voortgang wordt gebruikt.'); }
        const loc = local();
        const pick = loc && (!remote || loc.updated > remote.updated) ? loc : remote;
        if (!pick) return null;
        try { return JSON.parse(pick.data); } catch { return null; }
      },
      save(o) {
        let s; try { s = JSON.stringify(o); } catch { return; }
        if (s.length > 250000) { api.toast('Voortgang is te groot om op te slaan'); return; }
        const payload = { data: s, updated: Date.now() };
        try { localStorage.setItem(key, JSON.stringify(payload)); } catch {}
        pending = payload;
        if (!timer) timer = setTimeout(async () => { timer = null; await flush(false); }, Math.max(1000, SAVE_EVERY_MS - (Date.now() - lastWrite)));
      },
      toast(t) { const el = document.createElement('div'); el.textContent = t; el.style.cssText = 'position:absolute;left:50%;bottom:1rem;transform:translateX(-50%);background:#000c;color:#fff;padding:.5rem 1rem;border-radius:99px;z-index:9;font-size:.9rem'; wrap.appendChild(el); setTimeout(() => el.remove(), 2200); },
    };
    const retry = setInterval(() => { if (pending && blocked < Date.now()) flush(false); }, 60000);
    const hide = () => { if (document.visibilityState === 'hidden') flush(true); };
    document.addEventListener('visibilitychange', hide);
    const leave = async () => {
      if (closed) return; closed = true;
      clearInterval(retry); clearTimeout(timer); document.removeEventListener('visibilitychange', hide);
      try { instance && instance.destroy && instance.destroy(); } catch (e) { console.error(e); }
      await flush(true); wrap.remove(); show('big');
    };
    wrap.querySelector('[data-back]').onclick = leave;
    const prev = cleanup; cleanup = () => { prev(); if (!closed) { closed = true; clearInterval(retry); clearTimeout(timer); document.removeEventListener('visibilitychange', hide); try { instance && instance.destroy && instance.destroy(); } catch {} flush(true); } };
    Promise.resolve().then(() => g.create(host, api)).then((inst) => { instance = inst; }).catch((e) => { console.error(e); host.innerHTML = `<div style="padding:1.5rem;color:#fca5a5">Dit spel werkt niet: ${esc(e.message)}</div>`; });
  }

  /* ================= Shorts (clips + uploads) ================= */
  async function shortsTab() {
    let clips = [];
    for (const m of await loadAll(REG.CLIP_FILES)) clips = clips.concat(m.CLIPS || []);
    clips = shuffle(clips);
    let vids = [];
    try { const s = await getDocs(query(collection(db, 'shorts'), orderBy('created', 'desc'), limit(40))); vids = s.docs.map((d) => ({ id: d.id, ...d.data() })); }
    catch (e) { if (quota(e)) banner('Video\'s laden staat even uit (daglimiet).'); }
    if (!alive) return;
    // Eigen video's om en om met clips
    const items = []; let vi = 0, ci = 0;
    while (vi < vids.length || ci < clips.length) {
      if (vi < vids.length) items.push({ k: 'vid', v: vids[vi++] });
      for (let n = 0; n < 3 && ci < clips.length; n++) items.push({ k: 'clip', c: clips[ci++] });
    }
    body.innerHTML = '<div class="gs-feed" id="feed"></div>';
    const feed = body.querySelector('#feed');
    const raf = new Map(); const urls = [];
    items.forEach((it, i) => {
      const sec = document.createElement('div'); sec.className = 'gs-short';
      if (it.k === 'clip') {
        sec.innerHTML = `<canvas width="360" height="640" style="height:100%"></canvas><div class="gs-cap"><b>${esc(it.c.title)}</b><div>${esc(it.c.caption || '')}</div></div>`;
        sec._clip = it.c;
      } else {
        const v = it.v;
        sec.innerHTML = `<button class="gs-play" style="position:relative;z-index:2">▶ Kijk video</button><div class="gs-cap"><b>${esc(v.title || 'Video')}</b><div>van ${esc(v.name)}${v.uid === me.uid || me.admin ? ' · <a href="#" data-del style="color:#fca5a5">verwijderen</a>' : ''}</div></div>`;
        sec.querySelector('.gs-play').onclick = async (e) => {
          const b = e.currentTarget; b.disabled = true; b.textContent = 'Laden…';
          try {
            const s = await getDocs(collection(db, 'shorts', v.id, 'chunks'));
            const parts = s.docs.sort((x, y) => x.id.localeCompare(y.id)).map((d) => b64ToBytes(d.data().d));
            if (parts.length < v.parts) throw new Error('Video is niet compleet');
            const url = URL.createObjectURL(new Blob(parts, { type: v.mime || 'video/mp4' })); urls.push(url);
            b.remove(); const el = document.createElement('video'); el.src = url; el.controls = true; el.playsInline = true; el.loop = true; el.autoplay = true; el.style.height = '100%'; sec.prepend(el);
          } catch (er) { b.disabled = false; b.textContent = '▶ Opnieuw'; alert(nice(er)); }
        };
        const del = sec.querySelector('[data-del]');
        if (del) del.onclick = async (e) => { e.preventDefault(); if (!confirm('Deze video verwijderen?')) return; try { const s = await getDocs(collection(db, 'shorts', v.id, 'chunks')); await Promise.all(s.docs.map((d) => deleteDoc(d.ref))); await deleteDoc(doc(db, 'shorts', v.id)); show('shorts'); } catch (er) { alert(nice(er)); } };
      }
      feed.appendChild(sec);
    });
    if (!items.length) feed.innerHTML = '<div class="gs-short"><div style="opacity:.7">Nog geen filmpjes.</div></div>';

    // clips alleen tekenen terwijl ze in beeld zijn
    const draw = (sec) => {
      const cv = sec.querySelector('canvas'); const ctx = cv.getContext('2d'); const c = sec._clip; const dur = c.dur || 6; const t0 = performance.now();
      const loop = (now) => { if (!raf.has(sec)) return; try { ctx.save(); ctx.clearRect(0, 0, 360, 640); c.draw(ctx, (((now - t0) / 1000) % dur), 360, 640); ctx.restore(); } catch (e) { console.error(e); raf.delete(sec); return; } raf.set(sec, requestAnimationFrame(loop)); };
      raf.set(sec, requestAnimationFrame(loop));
    };
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      const sec = e.target; if (!sec._clip) return;
      if (e.isIntersecting) { if (!raf.has(sec)) draw(sec); } else if (raf.has(sec)) { cancelAnimationFrame(raf.get(sec)); raf.delete(sec); }
    }), { root: feed, threshold: 0.6 });
    feed.querySelectorAll('.gs-short').forEach((s) => io.observe(s));

    // upload-knop
    const up = document.createElement('div'); up.className = 'gs-up';
    up.innerHTML = '<button id="gs-up">＋ Upload</button>'; body.appendChild(up);
    up.querySelector('#gs-up').onclick = () => uploadForm();
    cleanup = () => { io.disconnect(); raf.forEach((r) => cancelAnimationFrame(r)); raf.clear(); urls.forEach((u) => URL.revokeObjectURL(u)); up.remove(); };

    function uploadForm() {
      const mine = vids.filter((v) => v.uid === me.uid).length;
      const o = document.createElement('div'); o.className = 'gs-over';
      o.innerHTML = `<div style="padding:0 1.2rem;width:100%"><h3 style="margin:.2rem 0">Video uploaden</h3>
        <small style="opacity:.8">Maximaal 8 MB (ongeveer 10 tot 15 seconden). Je hebt ${mine} van de ${MAX_UPLOADS} video's.</small>
        <div style="margin:.7rem 0"><input type="text" id="gs-title" maxlength="80" placeholder="Titel (bijv. mijn hond)"></div>
        <input type="file" id="gs-file" accept="video/*" style="display:none"><div id="gs-st" style="min-height:1.4rem;margin:.3rem 0"></div>
        <button id="gs-pick">Kies een video</button> <button class="sec" id="gs-cancel">Annuleer</button></div>`;
      body.appendChild(o);
      const st = (t) => { o.querySelector('#gs-st').textContent = t; };
      o.querySelector('#gs-cancel').onclick = () => o.remove();
      o.querySelector('#gs-pick').onclick = () => o.querySelector('#gs-file').click();
      o.querySelector('#gs-file').onchange = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        try {
          if (!file.type.startsWith('video/')) throw new Error('Kies een videobestand.');
          if (file.size > MAX_VIDEO) throw new Error('Video is te groot (maximaal 8 MB).');
          if (mine >= MAX_UPLOADS) throw new Error(`Je hebt al ${MAX_UPLOADS} video's. Verwijder er eerst een.`);
          const title = o.querySelector('#gs-title').value.trim().slice(0, 80) || 'Video';
          const ref = doc(collection(db, 'shorts')); const parts = Math.ceil(file.size / CHUNK);
          for (let i = 0; i < parts; i++) {
            st(`Uploaden… ${i + 1}/${parts}`);
            await setDoc(doc(db, 'shorts', ref.id, 'chunks', String(i).padStart(3, '0')), { d: await readB64(file.slice(i * CHUNK, (i + 1) * CHUNK)), by: me.uid });
          }
          await setDoc(ref, { uid: me.uid, name: me.name, title, parts, mime: file.type || 'video/mp4', created: Date.now() });
          o.remove(); show('shorts');
        } catch (er) { st(quota(er) ? 'Firebase-daglimiet bereikt, probeer het morgen opnieuw.' : nice(er)); }
      };
    }
  }

  show('games');
}
