// Emoji-mixer: twee emoji's op zes manieren combineren, met een grappige naam, opslaan als plaatje en een eigen verzameling.

// [emoji, Nederlandse naam] per categorie
const SETS = {
  '🙂 Gezichten': [['😀', 'grijns'], ['😂', 'lachbui'], ['😍', 'hartjesoog'], ['😎', 'coolbril'], ['🥳', 'feestbeest'], ['😴', 'slaapkop'], ['🤔', 'denker'], ['😱', 'gillen'], ['🤪', 'gekkie'], ['🥶', 'ijsblok'], ['🤢', 'misselijk'], ['😡', 'boosaard'], ['🤠', 'cowboy'], ['👻', 'spook'], ['🤖', 'robot'], ['👽', 'marsman'], ['💩', 'drolletje'], ['🤡', 'clown'], ['😈', 'duiveltje'], ['🥺', 'smekende']],
  '🐶 Dieren': [['🐶', 'hond'], ['🐱', 'poes'], ['🐭', 'muis'], ['🐹', 'hamster'], ['🐰', 'konijn'], ['🦊', 'vos'], ['🐻', 'beer'], ['🐼', 'panda'], ['🐨', 'koala'], ['🐯', 'tijger'], ['🦁', 'leeuw'], ['🐮', 'koe'], ['🐷', 'varken'], ['🐸', 'kikker'], ['🐵', 'aap'], ['🐔', 'kip'], ['🐧', 'pinguïn'], ['🦆', 'eend'], ['🦄', 'eenhoorn'], ['🐢', 'schildpad'], ['🐙', 'inktvis'], ['🦈', 'haai'], ['🐬', 'dolfijn'], ['🦖', 'dino'], ['🐝', 'bij'], ['🦋', 'vlinder'], ['🐌', 'slak'], ['🕷️', 'spin'], ['🦉', 'uil'], ['🐴', 'paard']],
  '🍕 Eten': [['🍕', 'pizza'], ['🍔', 'hamburger'], ['🍟', 'friet'], ['🌭', 'worstje'], ['🍿', 'popcorn'], ['🍩', 'donut'], ['🍪', 'koekje'], ['🍫', 'chocola'], ['🍦', 'ijsje'], ['🍎', 'appel'], ['🍌', 'banaan'], ['🍓', 'aardbei'], ['🍉', 'meloen'], ['🥕', 'wortel'], ['🥑', 'avocado'], ['🌮', 'taco'], ['🍣', 'sushi'], ['🧀', 'kaas'], ['🥞', 'pannenkoek'], ['☕', 'koffie'], ['🍺', 'biertje'], ['🧁', 'cupcake']],
  '🚗 Dingen': [['🚗', 'auto'], ['🚀', 'raket'], ['✈️', 'vliegtuig'], ['🚲', 'fiets'], ['⚽', 'voetbal'], ['🏀', 'basketbal'], ['🎮', 'spelcomputer'], ['🎸', 'gitaar'], ['📱', 'telefoon'], ['💡', 'lamp'], ['🔥', 'vuurtje'], ['⭐', 'sterretje'], ['🌈', 'regenboog'], ['☀️', 'zonnetje'], ['🌧️', 'regenwolk'], ['⚡', 'bliksem'], ['🎈', 'ballon'], ['🎁', 'cadeautje'], ['👑', 'kroontje'], ['💎', 'diamant'], ['🧲', 'magneet'], ['🔔', 'bel'], ['🌵', 'cactus'], ['🌻', 'zonnebloem'], ['🎃', 'pompoen'], ['⛄', 'sneeuwpop']],
};
const ALL = Object.values(SETS).flat();
const NAME = new Map(ALL);
const MODES = [['half', '◐ Half-half'], ['hoed', '🎩 Hoedje'], ['hoek', '📎 Sticker'], ['draai', '🌀 Draai'], ['totem', '🗼 Totem'], ['smoothie', '🥤 Smoothie']];

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const mixName = (a, b) => {
  const x = NAME.get(a) || 'iets', y = NAME.get(b) || 'iets';
  if (a === b) return cap(`dubbele ${x}`);
  return cap(x.slice(0, Math.ceil(x.length / 2)) + y.slice(Math.floor(y.length / 2)));
};

// Tekent de mix op een vierkant canvas van `s` pixels.
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
  } else if (mode === 'hoed') {
    put(a, c, c * 1.12, s * 0.72); put(b, c, c * 0.34, s * 0.42, -0.12);
  } else if (mode === 'hoek') {
    put(a, c, c, s * 0.8); put(b, s * 0.76, s * 0.76, s * 0.4, 0.2);
  } else if (mode === 'draai') {
    put(a, c, c, s * 0.8); put(b, c, c, s * 0.58, 0.55, 0.9);
  } else if (mode === 'totem') {
    put(a, c, c * 0.5, s * 0.5); put(b, c, c * 1.5, s * 0.5);
  } else { // smoothie: twee lagen door elkaar heen
    put(a, c * 0.92, c, s * 0.8, -0.08); put(b, c * 1.08, c, s * 0.8, 0.08, 0.55);
  }
}

// ctx: { view, esc, uid }
export function emojiView(ctx) {
  const { view, esc, uid } = ctx;
  const FAV = `emix:fav:${uid}`;
  const readFav = () => { try { return JSON.parse(localStorage.getItem(FAV) || '[]'); } catch { return []; } };
  const writeFav = (l) => { try { localStorage.setItem(FAV, JSON.stringify(l.slice(0, 40))); } catch {} };
  let a = '🐱', b = '🍕', mode = 'half', slot = 'a', cat = Object.keys(SETS)[0];

  const randomMix = () => { const p = () => ALL[Math.floor(Math.random() * ALL.length)][0]; a = p(); b = p(); mode = MODES[Math.floor(Math.random() * MODES.length)][0]; };

  function draw() {
    const favs = readFav();
    view.innerHTML = `
      <div class="box center" style="padding:1rem">
        <canvas id="em-cv" width="512" height="512" style="width:min(100%,300px);aspect-ratio:1;background:repeating-conic-gradient(#0001 0 25%,transparent 0 50%) 50%/24px 24px;border-radius:18px"></canvas>
        <div style="font-size:1.4rem;font-weight:800;margin-top:.5rem" id="em-name"></div>
        <small id="em-sub"></small>
        <div class="row wrap" style="justify-content:center;margin-top:.6rem"><button id="em-rnd">🎲 Willekeurig</button><button id="em-swap">🔁 Wissel</button><button class="pri" id="em-save">💾 Opslaan als plaatje</button><button id="em-fav">⭐ Bewaar</button></div>
      </div>
      <div class="box"><b>Manier van mixen</b><div class="row wrap">${MODES.map(([k, l]) => `<button data-mode="${k}" class="${k === mode ? 'pri' : ''}">${l}</button>`).join('')}</div></div>
      <div class="box"><b>Kies je emoji</b>
        <div class="row" style="margin:.3rem 0"><button id="sa" class="${slot === 'a' ? 'pri' : ''}" style="flex:1;font-size:1.6rem">${a}</button><span>＋</span><button id="sb" class="${slot === 'b' ? 'pri' : ''}" style="flex:1;font-size:1.6rem">${b}</button></div>
        <small>Tik op een van de twee vakken en kies hieronder een emoji.</small>
        <div class="row wrap" style="margin:.4rem 0">${Object.keys(SETS).map((k) => `<button data-cat="${k}" class="${k === cat ? 'pri' : ''}" style="padding:.25rem .55rem">${k}</button>`).join('')}</div>
        <div style="display:flex;flex-wrap:wrap;gap:.15rem">${SETS[cat].map(([e, n]) => `<button data-e="${e}" title="${esc(n)}" style="border:0;background:none;font-size:1.7rem;padding:.2rem">${e}</button>`).join('')}</div>
      </div>
      <div class="box"><b>Mijn verzameling</b>${favs.length ? `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin-top:.5rem">${favs.map((f, i) => `<div style="text-align:center"><canvas data-f="${i}" width="160" height="160" style="width:100%;border-radius:12px;background:#0001;cursor:pointer"></canvas></div>`).join('')}</div><small>Tik op een plaatje om hem te openen. Houd lang ingedrukt om te verwijderen.</small>` : '<br><small>Nog leeg. Tik op ⭐ Bewaar bij een mix die je mooi vindt.</small>'}</div>`;
    const cv = view.querySelector('#em-cv'); drawMix(cv.getContext('2d'), a, b, mode, 512);
    view.querySelector('#em-name').textContent = mixName(a, b);
    view.querySelector('#em-sub').textContent = `${a} ${NAME.get(a) || ''}  ＋  ${b} ${NAME.get(b) || ''}`;
    favs.forEach((f, i) => drawMix(view.querySelector(`[data-f="${i}"]`).getContext('2d'), f.a, f.b, f.mode, 160));
    view.querySelectorAll('[data-mode]').forEach((x) => x.onclick = () => { mode = x.dataset.mode; draw(); });
    view.querySelectorAll('[data-cat]').forEach((x) => x.onclick = () => { cat = x.dataset.cat; draw(); });
    view.querySelectorAll('[data-e]').forEach((x) => x.onclick = () => { if (slot === 'a') { a = x.dataset.e; slot = 'b'; } else { b = x.dataset.e; slot = 'a'; } draw(); });
    view.querySelector('#sa').onclick = () => { slot = 'a'; draw(); }; view.querySelector('#sb').onclick = () => { slot = 'b'; draw(); };
    view.querySelector('#em-rnd').onclick = () => { randomMix(); draw(); };
    view.querySelector('#em-swap').onclick = () => { [a, b] = [b, a]; draw(); };
    view.querySelector('#em-fav').onclick = () => { const l = readFav(); if (!l.some((f) => f.a === a && f.b === b && f.mode === mode)) l.unshift({ a, b, mode }); writeFav(l); draw(); };
    view.querySelector('#em-save').onclick = () => cv.toBlob((blob) => {
      if (!blob) return; const url = URL.createObjectURL(blob); const an = document.createElement('a'); an.href = url; an.download = `${mixName(a, b).toLowerCase()}.png`;
      document.body.appendChild(an); an.click(); an.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    }, 'image/png');
    view.querySelectorAll('[data-f]').forEach((x) => {
      let timer = null, long = false; const i = Number(x.dataset.f);
      x.onpointerdown = () => { long = false; timer = setTimeout(() => { long = true; const l = readFav(); l.splice(i, 1); writeFav(l); draw(); }, 700); };
      x.onpointerup = x.onpointerleave = x.onpointercancel = () => clearTimeout(timer);
      x.onclick = () => { if (long) return; const f = readFav()[i]; if (f) { a = f.a; b = f.b; mode = f.mode; draw(); window.scrollTo({ top: 0 }); } };
    });
  }
  draw();
}
