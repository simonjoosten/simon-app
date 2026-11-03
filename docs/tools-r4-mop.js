// Mop, ronde 4: tab "Show" met Geluidsbord (rimshot, trombone, applaus, trommelroffel), Mopmachine (verzint domme moppen),
// Invulmop (zelf woorden kiezen, de mop wordt gek) en Lachstatistiek (uit je sterren). Pure generatoren bovenaan.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pick = (a, r) => a[Math.floor(r() * a.length)];

export const WHO = ['een pinguïn', 'een kikker', 'de juf', 'een robot', 'een koe', 'een spook', 'een draak', 'de brandweerman', 'een kameel', 'een astronaut', 'een aardappel', 'een ijsbeer', 'de bakker', 'een olifant', 'een ninja'];
export const WHY = ['omdat hij zijn sokken kwijt was', 'omdat het sneeuwde in zijn zak', 'omdat de wifi het niet deed', 'omdat hij nog niet had ontbeten', 'omdat zijn schaduw weggelopen was', 'omdat de kat het zei', 'want anders kon het niet', 'omdat het maandag was', 'omdat hij zijn bril niet kon vinden', 'omdat de maan het had gevraagd'];
export const DOES = [['kietelt', 'de wolken'], ['zingt', 'onder de douche'], ['rijdt', 'achterstevoren op een fiets'], ['telt', 'alle sterren'], ['bakt', 'pannenkoeken op de maan'], ['speelt', 'verstoppertje met een kasteel'], ['leert', 'vliegen'], ['drinkt', 'thee met een dino']];
/** "Waarom ...?" met een onzinantwoord. */
export function machineJoke(r = Math.random) {
  const who = pick(WHO, r), [verb, rest] = pick(DOES, r), why = pick(WHY, r);
  return { q: `Waarom ${verb} ${who} ${rest}?`, a: `Nou, ${why}!` };
}
/** Invulmoppen: {t: tekst met {0},{1}.., vragen: [label, voorbeeld]} */
export const INVUL = [
  { t: 'Een {0} loopt een winkel binnen en zegt: "Mag ik een {1}, alsjeblieft?" De winkelier antwoordt: "Alleen als je eerst als een {2} kunt dansen!"', v: [['dier', 'koe'], ['voorwerp', 'trampoline'], ['ander dier', 'kikker']] },
  { t: 'Waarom nam {0} een {1} mee naar school? Omdat de juf had gezegd dat het een {2} dag zou worden!', v: [['naam', 'Sam'], ['voorwerp', 'paraplu'], ['bijvoeglijk naamwoord', 'gekke']] },
  { t: 'Wat zegt een {0} tegen een {1}? "Ik vind jou {2}!"', v: [['dier of ding', 'wolk'], ['ander dier of ding', 'banaan'], ['bijvoeglijk naamwoord', 'sprankelend']] },
  { t: 'Dokter, dokter, ik denk dat ik een {0} ben! Dokter: "Hoe lang heb je daar al last van?" "Sinds ik {1} heb gegeten, dokter!"', v: [['dier', 'giraffe'], ['eten', 'spaghetti']] },
  { t: 'Een {0} en een {1} gaan samen naar de maan. De {0} vergeet zijn {2}, en de {1} lacht zich een deuk!', v: [['persoon', 'bakker'], ['dier', 'kameel'], ['voorwerp', 'zonnebril']] },
];
export const fillTemplate = (t, words) => t.replace(/\{(\d)\}/g, (m, i) => (words[+i] != null && String(words[+i]).trim() ? String(words[+i]).trim().slice(0, 30) : '???'));
/** Lachstatistiek uit sterren per categorie: [{cat, avg, n}] aflopend gemiddelde. */
export function lachStats(ALL, ratings) {
  const m = new Map();
  for (const [id, st] of Object.entries(ratings || {})) { const j = ALL[+id]; if (!j || !(st > 0)) continue; const e = m.get(j.cat) || { cat: j.cat, sum: 0, n: 0 }; e.sum += st; e.n++; m.set(j.cat, e); }
  return [...m.values()].map((e) => ({ cat: e.cat, avg: Math.round(10 * e.sum / e.n) / 10, n: e.n })).sort((a, b) => b.avg - a.avg || b.n - a.n);
}

/* ---------- geluid (WebAudio, stil als het niet kan) ---------- */
let ac = null;
function ctx() { try { const AC = globalThis.AudioContext || globalThis.webkitAudioContext; if (!AC) return null; ac = ac || new AC(); if (ac.state === 'suspended') ac.resume().catch(() => {}); return ac; } catch { return null; } }
function tone(c, f0, f1, at, dur, type = 'sine', vol = 0.25) {
  const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
}
function noise(c, at, dur, vol = 0.2, hp = 1000) {
  const n = Math.max(1, Math.floor(c.sampleRate * dur)), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource(); s.buffer = buf; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; const g = c.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(c.destination); s.start(c.currentTime + at);
}
export const SOUNDS = [
  { id: 'rim', n: 'Badum-tss!', ic: 'drum', play(c) { tone(c, 180, 60, 0, 0.18, 'sine', 0.5); tone(c, 140, 50, 0.22, 0.18, 'sine', 0.5); noise(c, 0.5, 0.6, 0.35, 5000); } },
  { id: 'trom', n: 'Trombone-fail', ic: 'skull', play(c) { [[311, 0], [293, 0.4], [277, 0.8]].forEach(([f, t]) => tone(c, f, f * 0.99, t, 0.38, 'sawtooth', 0.15)); tone(c, 262, 196, 1.2, 0.9, 'sawtooth', 0.18); } },
  { id: 'applaus', n: 'Applaus', ic: 'star', play(c) { for (let i = 0; i < 24; i++) noise(c, Math.random() * 1.6, 0.06, 0.18, 1500 + Math.random() * 2500); } },
  { id: 'roffel', n: 'Trommelroffel', ic: 'balloon', play(c) { for (let i = 0; i < 18; i++) tone(c, 220, 120, i * 0.075, 0.07, 'triangle', 0.25 + i * 0.01); noise(c, 1.4, 0.5, 0.3, 3000); } },
  { id: 'lach', n: 'Ha ha ha!', ic: 'bear', play(c) { for (let i = 0; i < 6; i++) tone(c, 420 + (i % 2) * 90, 300, i * 0.17, 0.14, 'square', 0.12); } },
];
export function playSound(id) { const s = SOUNDS.find((x) => x.id === id), c = ctx(); if (!s || !c) return false; try { s.play(c); return true; } catch { return false; } }

/** Tekent de Show-tab. env: { ALL, ratings, M (mop-core), icon, toast } */
export function mountShow(host, env) {
  const { ALL, ratings, M, icon } = env; let sec = 'machine', mj = machineJoke(), shown = false, tpl = 0, words = [];
  const secs = [['machine', 'Mopmachine'], ['invul', 'Invulmop'], ['geluid', 'Geluidsbord'], ['lach', 'Lachstatistiek']];
  const draw = () => {
    let body = '';
    if (sec === 'machine') body = `<div class="box center" style="padding:1rem">${icon('wand', { size: 72 })}<div style="font-size:calc(1.25rem*var(--gfx-font,1));font-weight:800;margin:.5rem 0">${esc(mj.q)}</div>${shown ? `<div style="color:var(--accent);font-size:1.15rem;font-weight:700;margin:.4rem 0">${esc(mj.a)}</div>` : ''}
      <div class="row wrap" style="justify-content:center">${shown ? '' : '<button class="pri" data-x="show">Antwoord</button>'}<button data-x="new">Nieuwe mop</button><button data-x="snd">Badum-tss!</button></div><small>De Mopmachine verzint onzin-moppen. Er zijn ${WHO.length * DOES.length * WHY.length} mogelijkheden.</small></div>`;
    else if (sec === 'invul') {
      const T = INVUL[tpl];
      body = `<div class="box"><b>Vul woorden in, dan wordt de mop gek</b>${T.v.map(([l, ex], i) => `<input data-w="${i}" placeholder="${esc(l)} (bijv. ${esc(ex)})" value="${esc(words[i] || '')}" maxlength="30" style="width:100%;box-sizing:border-box;min-height:calc(48px*var(--gfx-scale,1));margin:.3rem 0;font-size:calc(1rem*var(--gfx-font,1))">`).join('')}
        <div class="row wrap"><button class="pri" data-x="make">Maak de mop</button><button data-x="tpl">Andere mop</button></div><div data-out style="margin-top:.6rem;font-weight:700;color:var(--accent)">${shown ? esc(fillTemplate(T.t, words)) : ''}</div></div>`;
    } else if (sec === 'geluid') body = `<div class="box center"><small>Tik na een mop op het juiste geluid!</small><div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem;margin-top:.6rem">${SOUNDS.map((s) => `<button data-snd="${s.id}" style="min-height:calc(88px*var(--gfx-scale,1));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.2rem;border-radius:18px">${icon(s.ic, { size: 44 })}<b>${esc(s.n)}</b></button>`).join('')}</div></div>`;
    else { const st = lachStats(ALL, ratings); body = `<div class="box"><b>Waar lach jij het hardst om?</b>${st.length ? st.map((e) => { const c = M.catById(e.cat); return `<div class="row" style="margin:.4rem 0">${icon(c.icon, { size: 36 })}<span style="width:6.5rem">${esc(c.name)}</span><span style="flex:1;height:12px;border-radius:99px;background:var(--line);overflow:hidden"><i style="display:block;height:100%;width:${Math.round(e.avg * 20)}%;background:var(--accent)"></i></span><b>${String(e.avg).replace('.', ',')}</b><small>(${e.n})</small></div>`; }).join('') : '<br><small>Geef sterren aan moppen, dan zie je hier welke soort jij het leukst vindt.</small>'}</div>`; }
    host.innerHTML = `<div class="row wrap" style="gap:.4rem;margin-bottom:.4rem">${secs.map(([k, l]) => `<button data-s="${k}" class="${sec === k ? 'pri' : ''}" style="flex:1;min-height:calc(44px*var(--gfx-scale,1))">${l}</button>`).join('')}</div>${body}`;
    host.querySelectorAll('[data-s]').forEach((b) => { b.onclick = () => { sec = b.dataset.s; shown = false; draw(); }; });
    host.querySelectorAll('[data-snd]').forEach((b) => { b.onclick = () => playSound(b.dataset.snd); });
    host.querySelectorAll('[data-w]').forEach((b) => { b.oninput = () => { words[+b.dataset.w] = b.value; }; });
    host.querySelectorAll('[data-x]').forEach((b) => { b.onclick = () => {
      const x = b.dataset.x;
      if (x === 'show') { shown = true; draw(); } else if (x === 'new') { mj = machineJoke(); shown = false; draw(); } else if (x === 'snd') playSound('rim');
      else if (x === 'make') { host.querySelectorAll('[data-w]').forEach((i) => { words[+i.dataset.w] = i.value; }); shown = true; draw(); playSound('rim'); } else if (x === 'tpl') { tpl = (tpl + 1) % INVUL.length; words = []; shown = false; draw(); }
    }; });
  };
  draw();
}
