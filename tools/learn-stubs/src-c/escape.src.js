// Learn Spel 17: Escape-kamer. 5 kamers: zoek de plekken, los de sloten op met vragen, vind de 3 cijfers en de sleutel en ontsnap.
// Gebouwd uit tools/learn-stubs/src-c/escape.src.js (hulpjes ingebouwd).
//@HELPERS
const P = 'les';

export const ROOMS = [
  { name: 'De Bibliotheek', sky: ['#fde68a', '#b45309'], floor: '#78350f', things: ['📚', '🕰', '🪴', '🖼', '🧸', '🕯', '🪑', '🔭'], door: '🚪' },
  { name: 'Het Laboratorium', sky: ['#bbf7d0', '#047857'], floor: '#064e3b', things: ['🧪', '🔬', '🧫', '💻', '🧬', '🗄', '⚗️', '🔋'], door: '🚪' },
  { name: 'De Piramide', sky: ['#fef3c7', '#d97706'], floor: '#92400e', things: ['🏺', '🐍', '🦂', '🗿', '⚱️', '🪔', '📜', '🐫'], door: '🚪' },
  { name: 'Het Piratenschip', sky: ['#7dd3fc', '#1e3a8a'], floor: '#451a03', things: ['⚓', '🦜', '🏴‍☠️', '🛢', '🗺', '🧭', '🪝', '🐙'], door: '🚪' },
  { name: 'Het Ruimtestation', sky: ['#4338ca', '#0f172a'], floor: '#1e293b', things: ['🛰', '🚀', '👨‍🚀', '🪐', '🔋', '📡', '🌌', '🤖'], door: '🚪' }
];
export const POS = [[13, 18], [50, 12], [87, 20], [18, 46], [82, 46], [36, 32], [64, 32], [50, 54]];
export const DECOY = ['Alleen stof en een spinnenweb.', 'Hier zit niets bijzonders. Hmm.', 'Een oude sok! Gelukkig geen vraag.', 'Leeg. Iemand was je voor.', 'Het kraakt, maar er zit niets in.', 'Alleen een briefje: "Succes!"'];
export const PERKS = [
  { id: 'hints', emoji: '💡', name: 'Hint-pakket', desc: '+2 hints voor elke kamer.' },
  { id: 'time', emoji: '⏱', name: 'Extra tijd', desc: '+45 s tijd voor het bonuspunten-record.' },
  { id: 'lock', emoji: '🔧', name: 'Smeerolie', desc: 'De eerste fout in elke kamer telt niet.' },
  { id: 'lens', emoji: '🔍', name: 'Vergrootglas', desc: 'Lege plekken zijn herkenbaar (gedimd).' },
  { id: 'digit', emoji: '🔢', name: 'Codekraker', desc: 'Elke kamer begint met 1 cijfer van de code gratis.' }
];
const DIFF_PAR = { 1: 200, 2: 160, 3: 125 };

export class EscapeRun {
  constructor(o = {}) {
    this.rand = o.rand || Math.random; this.fx = o.fx || {}; this.diff = o.level || 2; this.perks = {}; this.score = 0; this.rooms = 0; this.wrongAll = 0; this.hintsAll = 0; this.stars = 0; this.good = 0; this.best = 0; this.streak = 0; this.state = 'play';
    this.startRoom(0);
  }
  startRoom(i) {
    const r = this.rand; this.room = i; this.theme = ROOMS[i]; this.state = 'play'; this.code = [0, 0, 0].map(() => Math.floor(r() * 10)); this.shown = [false, false, false];
    this.hasKey = false; this.codeOk = false; this.open = false; this.wrong = 0; this.hintsUsed = 0; this.t = 0; this.free = this.perks.lock ? 1 : 0; this.hints = 2 + Math.round(this.fx.hints || 0) + 2 * (this.perks.hints || 0); this.tries = 0;
    const order = POS.map((_, k) => k).sort(() => r() - 0.5); this.spots = POS.map((p, k) => ({ x: p[0], y: p[1], e: this.theme.things[k], role: 'decoy', done: false, prog: 0, need: 1, text: DECOY[Math.floor(r() * DECOY.length)] }));
    [0, 1, 2].forEach(d => { const s = this.spots[order[d]]; s.role = 'digit'; s.d = d; s.need = 1 + (i >= 3 && d === 2 ? 1 : 0); });
    const ks = this.spots[order[3]]; ks.role = 'key'; ks.need = 1 + (i >= 2 ? 1 : 0) + (i >= 4 ? 1 : 0);
    this.spots[order[4]].role = 'hint';
    if (this.perks.digit) { const d = Math.floor(r() * 3); this.shown[d] = true; this.spots.find(s => s.role === 'digit' && s.d === d).done = true; }
    this.par = (DIFF_PAR[this.diff] || 160) + 45 * (this.perks.time || 0) + 20 * i;
  }
  lens(s) { return this.perks.lens && s.role === 'decoy'; }
  examine(idx) {
    const s = this.spots[idx]; if (!s) return { r: 'none' };
    if (s.done) return { r: 'done' };
    if (s.role === 'decoy') { s.done = true; return { r: 'empty', text: s.text }; }
    if (s.role === 'hint') { s.done = true; this.hints++; return { r: 'hint', text: 'Een hint-token gevonden! 💡 +1' }; }
    return { r: 'locked', role: s.role, prog: s.prog, need: s.need };
  }
  solve(idx, ok) {
    const s = this.spots[idx]; if (!s || s.done || (s.role !== 'digit' && s.role !== 'key')) return { r: 'none' };
    if (!ok) { this.streak = 0; if (this.free > 0) { this.free--; return { r: 'free' }; } this.wrong++; this.wrongAll++; return { r: 'wrong' }; }
    this.good++; this.streak++; if (this.streak > this.best) this.best = this.streak; s.prog++;
    if (s.prog < s.need) return { r: 'progress', prog: s.prog, need: s.need };
    s.done = true; if (s.role === 'digit') { this.shown[s.d] = true; return { r: 'digit', d: s.d, v: this.code[s.d] }; }
    this.hasKey = true; return { r: 'key' };
  }
  enterCode(str) {
    this.tries++; const ok = String(str) === this.code.join(''); if (ok) this.codeOk = true; else { this.wrong++; this.wrongAll++; }
    return { ok, door: ok && this.hasKey };
  }
  tryDoor() { if (this.codeOk && this.hasKey) { this.open = true; return this.finishRoom(); } return null; }
  hint() {
    if (this.hints <= 0) return null; this.hints--; this.hintsUsed++; this.hintsAll++;
    const nxt = this.spots.findIndex(s => !s.done && (s.role === 'digit' || (s.role === 'key')));
    const dg = this.spots.findIndex(s => !s.done && s.role === 'digit');
    if (dg >= 0) return { spot: dg }; if (nxt >= 0) return { spot: nxt };
    return { door: true };
  }
  finishRoom() {
    const tb = Math.max(0, Math.round((this.par - this.t) / this.par * 80)); const sc = Math.max(40, 100 + tb - 15 * this.wrong - 20 * this.hintsUsed + 20 * this.room);
    const stars = this.wrong === 0 && this.hintsUsed === 0 && this.t <= this.par ? 3 : this.wrong <= 2 && this.t <= this.par * 1.5 ? 2 : 1;
    this.score += sc; this.stars += stars; this.rooms++; this.state = this.room + 1 >= ROOMS.length ? 'won' : 'perk';
    return { score: sc, stars, time: this.t, wrong: this.wrong };
  }
  offers() { const pool = PERKS.filter(p => (p.id === 'hints' || p.id === 'time') || !this.perks[p.id]); const out = []; while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(this.rand() * pool.length), 1)[0]); return out; }
  pickPerk(id) { this.perks[id] = (this.perks[id] || 0) + 1; this.startRoom(this.room + 1); }
}

const CSS = `
.${P}-scene{position:relative;flex:1;margin:0 6px;border-radius:14px;overflow:hidden;min-height:200px}
.${P}-floor{position:absolute;left:0;right:0;bottom:0;height:34%;}
.${P}-sp{position:absolute;transform:translate(-50%,-50%);border:0;background:rgba(255,255,255,.14);border-radius:18px;width:62px;height:62px;font-size:38px;cursor:pointer;padding:0;transition:transform .2s,opacity .3s;box-shadow:0 3px 0 rgba(0,0,0,.3)}
.${P}-sp:active{transform:translate(-50%,-50%) scale(.9)}
.${P}-sp.done{opacity:.4;box-shadow:none}.${P}-sp.glow{animation:${P}gl .8s infinite;background:rgba(253,224,71,.5)}
.${P}-sp.lock::after{content:'🔒';position:absolute;right:-4px;top:-8px;font-size:18px}
.${P}-sp.dim{opacity:.7}
.${P}-door{position:absolute;left:50%;bottom:6px;transform:translateX(-50%);width:84px;height:100px;border:0;border-radius:12px 12px 4px 4px;background:linear-gradient(#92400e,#451a03);font-size:44px;cursor:pointer;box-shadow:0 0 0 4px #1c0f06;color:#fde047}
.${P}-door.open{background:linear-gradient(#bbf7d0,#22c55e);animation:${P}gl .8s 3}
@keyframes ${P}gl{50%{transform:translate(-50%,-50%) scale(1.14)}}
.${P}-inv{display:flex;gap:6px;justify-content:center;align-items:center;padding:6px;flex-wrap:wrap}
.${P}-dg{width:46px;height:50px;border-radius:10px;background:rgba(127,127,127,.2);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900}
.${P}-dg.on{background:#fde047;color:#422006}
.${P}-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}.${P}-pad button{margin:0;font-size:22px;min-height:52px}
.${P}-disp{font-size:34px;letter-spacing:10px;font-weight:900;background:#052e16;color:#4ade80;border-radius:10px;padding:6px;min-height:52px;font-family:monospace}
.${P}-say{position:absolute;left:8px;right:8px;top:6px;background:rgba(0,0,0,.65);color:#fff;border-radius:12px;padding:6px 10px;font-weight:700;font-size:14px;text-align:center;pointer-events:none;z-index:5}`;

export default {
  id: 'escape', name: 'Escape-kamer', emoji: '🔐', color: '#7c3aed',
  desc: 'Zoek in de kamer, kraak de sloten met je kennis en vind de code en de sleutel om te ontsnappen.',
  tags: ['denken', 'rustig', 'solo'], minutes: 7, duo: false,
  create(host, env) {
    const L = lifecycle(); const style = css(baseCss(P) + CSS); host.textContent = '';
    const { H } = dims(host, env); const root = $('div', P + '-root'); root.style.height = H + 'px'; host.appendChild(root);
    const g = new EscapeRun({ rand: env.rand || Math.random, fx: env.fx, level: env.level });
    const S = mkStats(); const ov = mkOv(root, P); const asker = makeAsker(env, ov, P, L); const nextQ = qsupply(env);
    let started = false, ended = false, busy = false, lastT = 0, glowSpot = -1, glowDoor = false, spotEls = [], doorEl = null;
    const hud = $('div', P + '-hud'); const chip = {}; ['room', 'time', 'score', 'hint'].forEach(k => { chip[k] = $('span', P + '-chip'); hud.appendChild(chip[k]); });
    const scene = $('div', P + '-scene'); const inv = $('div', P + '-inv'); const sayEl = $('div', P + '-say'); sayEl.style.display = 'none';
    root.append(hud, scene, inv);
    const say = (t) => { sayEl.textContent = t; sayEl.style.display = 'block'; scene.appendChild(sayEl); L.after(() => { sayEl.style.display = 'none'; }, 2600); };
    const build = () => {
      scene.textContent = ''; spotEls = []; const T = g.theme; scene.style.background = 'linear-gradient(' + T.sky[0] + ',' + T.sky[1] + ')';
      const fl = $('div', P + '-floor'); fl.style.background = 'linear-gradient(rgba(0,0,0,.15),' + T.floor + ')'; scene.appendChild(fl);
      g.spots.forEach((s, i) => { const b = $('button', P + '-sp', s.e); b.style.left = s.x + '%'; b.style.top = s.y * 1.1 + 4 + '%'; b.onclick = () => tapSpot(i); scene.appendChild(b); spotEls.push(b); });
      doorEl = $('button', P + '-door', '🚪'); doorEl.onclick = () => tapDoor(); scene.appendChild(doorEl);
    };
    const paint = () => {
      g.spots.forEach((s, i) => { const b = spotEls[i]; if (!b) return; b.className = P + '-sp' + (s.done ? ' done' : '') + (!s.done && (s.role === 'digit' || s.role === 'key') && s.prog > 0 ? ' lock' : '') + (glowSpot === i ? ' glow' : '') + (!s.done && g.lens(s) ? ' dim' : ''); });
      if (doorEl) doorEl.className = P + '-door' + (g.open ? ' open' : '') + (glowDoor ? ' glow' : ''); if (doorEl) doorEl.textContent = g.open ? '🌟' : (g.codeOk && g.hasKey ? '🔓' : '🔒');
      chip.room.textContent = '🚪 ' + (g.room + 1) + '/' + ROOMS.length + ' ' + g.theme.name; chip.time.textContent = '⏱ ' + Math.round(g.t) + '/' + g.par; chip.score.textContent = '🏆 ' + fmtN(g.score); chip.hint.textContent = '💡 ' + g.hints;
      inv.textContent = ''; for (let d = 0; d < 3; d++) { inv.appendChild($('div', P + '-dg' + (g.shown[d] ? ' on' : ''), g.shown[d] ? String(g.code[d]) : '?')); }
      inv.appendChild($('div', P + '-dg' + (g.hasKey ? ' on' : ''), g.hasKey ? '🗝' : '·')); const bh = $('button', P + '-btn alt', '💡 Hint'); bh.disabled = g.hints <= 0; bh.onclick = useHint; inv.appendChild(bh);
    };
    const useHint = () => { if (!started || busy || ov.shown) return; const h = g.hint(); if (!h) return; snd(env, 'power'); glowSpot = h.spot != null ? h.spot : -1; glowDoor = !!h.door; say(h.door ? '🤖 Robbie: Tik op de deur en toets de code in!' : '🤖 Robbie: kijk daar eens goed!'); paint(); L.after(() => { glowSpot = -1; glowDoor = false; paint(); }, 5000); };
    const tapSpot = async (i) => {
      if (!started || busy || ov.shown || g.state !== 'play') return; const res = g.examine(i); snd(env, 'klik');
      if (res.r === 'done') { say('Hier ben je al geweest.'); return; }
      if (res.r === 'empty' || res.r === 'hint') { say(res.text); if (res.r === 'hint') snd(env, 'munt'); paint(); return; }
      if (res.r === 'locked') {
        busy = true; say(res.role === 'key' ? '🗝 Een slot! Los de vraag op' + (res.need > 1 ? ' (' + (res.prog + 1) + '/' + res.need + ')' : '') + '.' : '🔒 Een cijferslot: beantwoord de vraag.');
        const r = await asker.ask(nextQ(g.room > 2 ? 3 : g.room > 0 ? 2 : 1), { time: 0 }); busy = false; if (L.dead) return; S.mark(r.ok);
        const o = g.solve(i, !!r.ok); snd(env, r.ok ? 'goed' : 'fout');
        if (o.r === 'wrong') say('Het slot klemt. Probeer het nog eens!'); else if (o.r === 'free') say('🔧 Smeerolie! Deze fout telt niet.'); else if (o.r === 'progress') say('Eén slot open, nog ' + (o.need - o.prog) + ' te gaan.');
        else if (o.r === 'digit') { say('🔢 Cijfer ' + (o.d + 1) + ' is ' + o.v + '!'); snd(env, 'level'); } else if (o.r === 'key') { say('🗝 Je vond de sleutel!'); snd(env, 'level'); }
        paint();
      }
    };
    const keypad = () => {
      let cur = ''; const w = $('div'); const disp = $('div', P + '-disp', '___'); const pad = $('div', P + '-pad'); const info = $('p', '', 'Toets de 3 cijfers van de code in.');
      const upd = () => { disp.textContent = (cur + '___').slice(0, 3).split('').join(' '); };
      for (const n of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK']) { const b = $('button', P + '-btn' + (n === 'OK' ? '' : ' alt'), n); b.onclick = () => { snd(env, 'klik');
        if (n === '⌫') cur = cur.slice(0, -1); else if (n === 'OK') { if (cur.length < 3) { info.textContent = 'Nog niet genoeg cijfers.'; return; } const r = g.enterCode(cur); if (!r.ok) { snd(env, 'fout'); info.textContent = '❌ Piep! Fout. Zoek de cijfers (de gele vakjes).'; cur = ''; upd(); paint(); return; } snd(env, 'goed'); ov.hide(); if (r.door) openDoor(); else { say('✅ Code klopt! Nu nog de sleutel 🗝'); paint(); } return; } else if (cur.length < 3) cur += n; upd(); }; pad.appendChild(b); }
      const shown = $('p', '', 'Bekende cijfers: ' + g.code.map((c, i) => g.shown[i] ? c : '?').join(' ')); w.append(shown, disp, info, pad);
      ov.show(card(P, { emoji: '🔢', title: 'Codeslot', extra: w, btn: 'Terug', onBtn: () => ov.hide() }));
    };
    const openDoor = () => {
      const r = g.tryDoor(); if (!r) return; snd(env, 'win'); paint();
      L.after(() => {
        if (g.state === 'won') { ov.show(card(P, { emoji: '🏆', title: 'Ontsnapt uit alle kamers!', text: 'Je behaalde ' + g.stars + ' ⭐ en ' + fmtN(g.score) + ' punten.', btn: 'Klaar', onBtn: () => { ov.hide(); finish(true, 'Alle ' + ROOMS.length + ' kamers ontsnapt met ' + g.stars + ' sterren.'); } })); return; }
        const w = $('div'); const row = $('div', P + '-row'); g.offers().forEach(p => { const c = $('div', P + '-shopi'); c.append($('div', P + '-big', p.emoji), $('b', '', p.name), $('small', '', p.desc)); const b = $('button', P + '-btn', 'Kies'); b.onclick = () => { ov.hide(); g.pickPerk(p.id); build(); paint(); say(ROOMS[g.room].name + '! Zoek de cijfers en de sleutel.'); }; c.appendChild(b); row.appendChild(c); }); w.appendChild(row);
        ov.show(card(P, { emoji: '🎉', title: 'Kamer ' + (g.room + 1) + ' ontsnapt!', text: '⭐'.repeat(r.stars) + '  +' + r.score + ' punten (' + Math.round(r.time) + ' s). Kies een voordeel:', extra: w }));
      }, 700);
    };
    const tapDoor = () => { if (!started || busy || ov.shown || g.state !== 'play') return; snd(env, 'klik'); if (g.codeOk && g.hasKey) { openDoor(); return; } if (g.codeOk) { say('De code klopt al. Je mist nog de sleutel 🗝'); return; } keypad(); };
    const finish = (win, why) => { if (ended) return; ended = true; env.end({ score: Math.round(g.score), win: !!win, stats: { correct: S.correct, wrong: S.wrong, best: S.best, kamers: g.rooms, sterren: g.stars, hints: g.hintsAll }, summary: why }); };
    build(); paint();
    L.every(() => { if (!started) return; const now = performance.now(); const dt = Math.min(1, (now - lastT) / 1000); lastT = now; if (ov.shown || busy || g.state !== 'play') return; g.t += dt; chip.time.textContent = '⏱ ' + Math.round(g.t) + '/' + g.par; }, 500);
    ov.show(card(P, { emoji: '🔐', title: 'Escape-kamer', text: 'Tik op dingen in de kamer. Sloten openen met een goed antwoord. Vind 3 cijfers + de sleutel, toets de code in op de deur. 💡 helpt als je vastzit!', btn: 'Tik om te beginnen', onBtn: () => { ov.hide(); started = true; lastT = performance.now(); snd(env, 'klik'); say('Zoek de 3 cijfers en de sleutel.'); } }));
    return { destroy() { asker.cancel(); L.kill(); try { style.remove(); } catch (e) {} host.textContent = ''; } };
  }
};
