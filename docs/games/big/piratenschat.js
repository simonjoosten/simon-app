// Piratenschat: zeil over een mistige zee, ontdek eilanden, werf bemanning en win zeeslagen.
const fmt = (n) => {
  n = Math.floor(n);
  if (n < 1000) return String(n);
  const u = ['K', 'M', 'B', 'T'];
  let i = -1, v = n;
  while (v >= 1000 && i < 3) { v /= 1000; i++; }
  return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : v.toFixed(0)).replace('.', ',') + u[i];
};
const H = (tag, css, txt, p) => {
  const e = document.createElement(tag);
  if (css) e.style.cssText = css;
  if (txt != null) e.textContent = txt;
  if (p) p.appendChild(e);
  return e;
};
const BTN = 'min-height:44px;padding:8px 12px;border:0;border-radius:12px;font:600 14px system-ui;color:#fff;background:linear-gradient(135deg,#0369a1,#0d9488);cursor:pointer;';
const B = (txt, fn, p, css, dis) => {
  const b = H('button', BTN + (css || '') + (dis ? 'opacity:.4;' : ''), txt, p);
  b.onclick = () => { if (!dis) fn(); };
  return b;
};
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pickOf = (a) => a[Math.floor(Math.random() * a.length)];

const N = 8;
const ISL = {
  goud: { e: '💰', n: 'Verlaten kamp' },
  jungle: { e: '🌴', n: 'Jungle-eiland' },
  nest: { e: '🏴‍☠️', n: 'Piratennest' },
  kaart: { e: '🗺️', n: 'Kaartenmaker' },
  schat: { e: '❌', n: 'Schateiland' },
};
const FOES = [['Smokkelaar', '⛵'], ['Zeerover', '🏴‍☠️'], ['Marineschip', '🚢'], ['Spookschip', '👻'], ['Kraken', '🦑']];

function makeSea() {
  const m = [];
  for (let i = 0; i < N * N; i++) m.push({ t: 0, ty: '', seen: false, done: false, mark: false });
  m[0].t = 1; m[0].seen = true;
  const types = ['goud', 'goud', 'goud', 'jungle', 'jungle', 'nest', 'nest', 'kaart', 'schat', 'schat'];
  const free = [];
  for (let i = 2; i < N * N; i++) free.push(i);
  types.forEach((ty) => {
    const k = rnd(0, free.length - 1);
    const idx = free.splice(k, 1)[0];
    m[idx].t = 2; m[idx].ty = ty;
  });
  return m;
}

export default {
  id: 'piratenschat', name: 'Piratenschat', emoji: '🏴‍☠️', desc: 'Zeil, ontdek eilanden, werf bemanning en vind de schat.',
  async create(host, api) {
    const def = { gold: 80, food: 20, hull: 60, crew: 5, can: 0, hullLv: 0, scope: 0, sea: 1, m: makeSea(), pos: 0, maps: 0, bt: null, scene: null, found: 0, sunk: 0, last: Date.now(), msgs: [] };
    let S = Object.assign({}, def, (await api.load()) || {});
    let alive = true, note = '';
    host.style.cssText += ';background:linear-gradient(#06304d,#031724);color:#e6f6ff;font-family:system-ui,sans-serif;';
    const root = H('div', 'max-width:430px;margin:0 auto;padding:10px;box-sizing:border-box;', null, host);
    const save = () => { S.last = Date.now(); api.save(S); };

    const maxHull = () => 60 + S.hullLv * 25;
    const maxCrew = () => 6 + S.hullLv * 3;
    const maxFood = () => 20 + S.hullLv * 8;
    const cannons = () => 2 + S.can;
    const vision = () => 1 + (S.scope >= 2 ? 1 : 0);
    const atPort = () => S.pos === 0;

    // offline: bemanning handelt in de haven als je weg bent
    const away = Math.min((Date.now() - (S.last || Date.now())) / 60000, 480);
    if (away > 2) {
      const g = Math.floor(away * (1 + S.sea * 0.5 + S.crew * 0.2));
      S.gold += g; note = 'Terwijl je weg was, handelde je bemanning voor 💰' + fmt(g) + '.';
      api.toast('Offline: +' + fmt(g) + ' goud');
    }

    function reveal() {
      const r = Math.floor(S.pos / N), c = S.pos % N, v = vision();
      for (let dr = -v; dr <= v; dr++) for (let dc = -v; dc <= v; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && cc >= 0 && rr < N && cc < N) S.m[rr * N + cc].seen = true;
      }
    }
    reveal();

    function enemy(boss) {
      const L = S.sea;
      const f = boss ? FOES[Math.min(4, 1 + Math.floor(L / 2))] : pickOf(FOES.slice(0, Math.min(5, 1 + Math.ceil(L / 1.5))));
      const k = boss ? 1.8 : 1;
      return { n: f[0], e: f[1], hp: Math.round((24 + L * 14) * k), max: Math.round((24 + L * 14) * k), can: Math.round((1.5 + L * 0.7) * (boss ? 1.3 : 1)), crew: Math.round((3 + L * 1.5) * k), boss, log: ['Een ' + f[0] + ' ' + f[1] + ' vuurt op je!'] };
    }
    function lootBattle(en) {
      const g = Math.round((14 + S.sea * 12 + rnd(0, 10)) * (en.boss ? 3 : 1));
      S.gold += g;
      let t = '⚓ Zeeslag gewonnen! +💰' + g;
      if (Math.random() < 0.3) { S.maps++; t += ' en een schatkaart 🗺️'; }
      if (Math.random() < 0.35) { S.food = Math.min(maxFood(), S.food + 5); t += ' en proviand 🍖'; }
      return t;
    }
    function sink() {
      S.sunk++;
      const l = Math.floor(S.gold / 2);
      S.gold -= l; S.hull = Math.floor(maxHull() / 2); S.pos = 0; S.food = Math.max(S.food, 10); S.crew = Math.max(2, Math.ceil(S.crew / 2));
      S.bt = null; S.scene = null;
      note = '🌊 Je schip is gezonken! Je werd gered en wakker in de haven. Je verloor 💰' + l + ' en de helft van je bemanning.';
      reveal(); save(); render();
    }

    function enemyShoot() {
      const en = S.bt;
      let dmg = 0;
      for (let i = 0; i < en.can; i++) if (Math.random() < 0.7) dmg += rnd(2, 4);
      S.hull -= dmg;
      en.log.unshift(en.n + ' schiet: ' + (dmg ? dmg + ' schade aan je romp!' : 'mis!'));
      if (S.hull <= 0) { S.hull = 0; sink(); return true; }
      return false;
    }
    function battle(kind) {
      const en = S.bt;
      if (kind === 'salvo' || kind === 'aim') {
        const salvo = kind === 'salvo';
        let dmg = 0;
        for (let i = 0; i < cannons(); i++) if (Math.random() < (salvo ? 0.6 : 0.9)) dmg += rnd(3, salvo ? 9 : 5);
        en.hp -= dmg;
        en.log.unshift('Jij schiet: ' + (dmg ? dmg + ' schade!' : 'mis!'));
      } else if (kind === 'fix') {
        const h = Math.min(maxHull() - S.hull, S.crew * 2);
        S.hull += h; en.log.unshift('Bemanning repareert +' + h + ' romp.');
      } else if (kind === 'board') {
        const p = Math.min(0.85, S.crew / (S.crew + en.crew + 1) + 0.15);
        if (Math.random() < p) { en.hp = 0; en.log.unshift('Enteren gelukt!'); }
        else { const l = Math.min(S.crew - 1, rnd(1, 2)); S.crew -= l; en.log.unshift('Enteren mislukt! ' + l + ' matroos verloren.'); }
      } else if (kind === 'run') {
        if (!en.boss && Math.random() < 0.6) { S.bt = null; note = 'Je ontsnapt de mist in.'; save(); render(); return; }
        en.log.unshift(en.boss ? 'Je kunt niet ontsnappen aan dit schip!' : 'Ontsnappen mislukt!');
      }
      if (en.hp <= 0) {
        note = lootBattle(en);
        if (S.scene && S.scene.nest) { S.m[S.pos].done = true; S.scene = null; }
        S.bt = null; save(); render(); return;
      }
      if (enemyShoot()) return;
      save(); render();
    }

    function move(idx) {
      if (S.bt || S.scene) return;
      const r1 = Math.floor(S.pos / N), c1 = S.pos % N, r2 = Math.floor(idx / N), c2 = idx % N;
      if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return;
      if (S.food < 1) { note = '🍖 Geen proviand meer! Vraag om hulp via het noodsignaal.'; render(); return; }
      S.food--; S.pos = idx; reveal(); note = '';
      const cell = S.m[idx];
      if (cell.t === 1) { note = '⚓ Welkom terug in de haven!'; }
      else if (cell.t === 2 && !cell.done) { S.scene = { t: 'isl' }; note = ''; }
      else {
        const x = Math.random();
        if (x < 0.16) S.bt = enemy(false);
        else if (x < 0.25) { const d = rnd(3, 6 + S.sea * 2); S.hull -= d; note = '⛈️ Storm! Je romp krijgt ' + d + ' schade.'; if (S.hull <= 0) { sink(); return; } }
        else if (x < 0.33) { const g = rnd(6, 12 + S.sea * 6); S.gold += g; note = '📦 Een drijvende kist met 💰' + g + '!'; }
        else note = pickOf(['De zee is rustig. 🌊', 'Meeuwen cirkelen boven je mast. 🕊️', 'Een dolfijn zwemt mee. 🐬', 'Je ziet niets bijzonders.']);
      }
      save(); render();
    }

    function islandAction(k) {
      const cell = S.m[S.pos], L = S.sea;
      if (k === 'leave') { S.scene = null; note = 'Je zeilt weer weg.'; }
      else if (cell.ty === 'goud') { const g = 30 * L + rnd(0, 20); S.gold += g; cell.done = true; S.scene = null; note = '💰 Je vindt een verborgen buit van ' + g + ' goud!'; }
      else if (cell.ty === 'jungle') {
        if (k === 'food') { S.food = Math.min(maxFood(), S.food + 10); note = '🍌 Je vult je proviand aan.'; }
        else { S.crew = Math.min(maxCrew(), S.crew + 2); note = '🙋 Twee schipbreukelingen sluiten zich aan!'; }
        cell.done = true; S.scene = null;
      } else if (cell.ty === 'kaart') { S.maps++; S.gold += 10 * L; cell.done = true; S.scene = null; note = '🗺️ De kaartenmaker geeft je een schatkaart (en 💰' + 10 * L + ')!'; }
      else if (cell.ty === 'nest') { S.scene = { nest: true }; S.bt = enemy(true); note = '🏴‍☠️ Piraten! De baas valt aan!'; }
      else if (cell.ty === 'schat') {
        const g = 120 * L + rnd(0, 60);
        S.gold += g; cell.done = true; cell.mark = false; S.scene = null; S.found++;
        note = '🏆 SCHAT GEVONDEN! +💰' + g + '!';
        if (!S.m.some((c) => c.ty === 'schat' && !c.done)) { S.sea++; S.m = makeSea(); S.pos = 0; S.hull = maxHull(); S.maps = 0; reveal(); note += ' Alle schatten van deze zee zijn gevonden! Je zeilt naar zee ' + S.sea + '.'; }
      }
      save(); render();
    }

    function bar(p, frac, col, txt) {
      const b = H('div', 'position:relative;height:18px;background:#0007;border-radius:9px;overflow:hidden;margin-top:4px;', null, p);
      H('div', 'height:100%;background:' + col + ';width:' + Math.max(0, Math.min(1, frac)) * 100 + '%;', null, b);
      H('div', 'position:absolute;inset:0;text-align:center;font:600 12px/18px system-ui;', txt, b);
    }
    const card = (css) => H('div', 'background:#0b3a5b;border-radius:14px;padding:10px;margin-bottom:8px;' + (css || ''), null, root);

    function render() {
      if (!alive) return;
      const st = host.scrollTop;
      root.innerHTML = '';
      const top = H('div', 'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;', null, root);
      H('div', 'font:800 19px system-ui;', '🏴‍☠️ Piratenschat', top);
      H('div', 'font:700 13px system-ui;background:#0006;padding:6px 10px;border-radius:16px;', '💰 ' + fmt(S.gold) + ' · zee ' + S.sea, top);
      const hd = card();
      bar(hd, S.hull / maxHull(), '#ef4444', '🚢 romp ' + Math.max(0, Math.ceil(S.hull)) + '/' + maxHull());
      bar(hd, S.food / maxFood(), '#f59e0b', '🍖 proviand ' + S.food + '/' + maxFood());
      H('div', 'font-size:12px;margin-top:4px;opacity:.9;', '👥 bemanning ' + S.crew + '/' + maxCrew() + ' · 💣 kanonnen ' + cannons() + ' · 🗺️ kaarten ' + S.maps + ' · 🏆 schatten ' + S.found, hd);
      if (note) H('div', 'background:#134e75;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:13px;', note, root);
      if (S.bt) battleUI(); else { mapUI(); if (S.scene) islandUI(); else if (atPort()) portUI(); else extraUI(); }
      host.scrollTop = st;
    }

    function mapUI() {
      const g = H('div', 'display:grid;grid-template-columns:repeat(' + N + ',1fr);gap:2px;margin-bottom:8px;', null, root);
      const r1 = Math.floor(S.pos / N), c1 = S.pos % N;
      S.m.forEach((cell, i) => {
        const adj = Math.abs(Math.floor(i / N) - r1) + Math.abs((i % N) - c1) === 1;
        let t = '🌫️', bg = '#1e3a4f';
        if (i === S.pos) { t = '🚢'; bg = '#0e7490'; }
        else if (cell.seen || cell.mark) {
          bg = '#0c5a86';
          if (cell.t === 1) t = '⚓';
          else if (cell.t === 2) t = cell.mark && !cell.done ? '❌' : cell.done ? '🏝️' : cell.seen && (cell.visited || cell.done) ? ISL[cell.ty].e : '🏝️';
          else t = '🌊';
        }
        const b = H('button', 'aspect-ratio:1;min-height:36px;border:0;border-radius:6px;background:' + bg + ';font-size:18px;padding:0;' + (adj && !S.scene ? 'outline:2px solid #fde047;cursor:pointer;' : ''), t, g);
        b.onclick = () => move(i);
      });
      H('div', 'font-size:11px;opacity:.7;margin:-4px 0 8px;', 'Tik op een vak naast je schip (geel) om te zeilen. Elk vak kost 1 proviand.', root);
    }

    function battleUI() {
      const en = S.bt;
      const c = card();
      H('div', 'text-align:center;font-size:56px;', en.e, c);
      H('div', 'text-align:center;font-weight:700;', en.n + (en.boss ? ' (BAAS)' : '') + ' · 💣' + en.can + ' · 👥' + en.crew, c);
      bar(c, en.hp / en.max, '#f97316', Math.max(0, en.hp) + '/' + en.max);
      const l = H('div', 'margin:8px 0;min-height:66px;font-size:13px;', null, c);
      en.log.slice(0, 4).forEach((t, i) => H('div', 'opacity:' + (1 - i * 0.2) + ';padding:1px 0;', t, l));
      const g = H('div', 'display:grid;grid-template-columns:1fr 1fr;gap:6px;', null, c);
      B('💥 Salvo (60%)', () => battle('salvo'), g, 'background:linear-gradient(135deg,#dc2626,#b45309);');
      B('🎯 Gericht schot', () => battle('aim'), g);
      B('🔧 Repareren', () => battle('fix'), g, 'background:#0f766e;', S.hull >= maxHull());
      B('⚔️ Enteren', () => battle('board'), g, 'background:#7c3aed;');
      B('🏃 Ontsnappen', () => battle('run'), g, 'grid-column:span 2;background:#475569;');
    }

    function islandUI() {
      const cell = S.m[S.pos];
      cell.visited = true;
      const c = card();
      const I = ISL[cell.ty];
      H('div', 'text-align:center;font-size:48px;', I.e, c);
      H('div', 'text-align:center;font-weight:700;margin-bottom:6px;', I.n, c);
      const txt = { goud: 'Een oud kamp met een kist. Zou er goud in zitten?', jungle: 'Dicht oerwoud met fruit en misschien schipbreukelingen.', nest: 'Een piratennest! Dit wordt gevaarlijk (maar levert veel op).', kaart: 'Een oude man tekent kaarten. Hij heeft er misschien een voor je.', schat: 'Een grote X in het zand. Hier ligt de schat!' }[cell.ty];
      H('div', 'text-align:center;font-size:13px;margin-bottom:8px;', txt, c);
      if (cell.ty === 'jungle') { B('🍌 Fruit plukken', () => islandAction('food'), c, 'width:100%;margin-bottom:6px;'); B('🙋 Mensen werven (+2 bemanning)', () => islandAction('crew'), c, 'width:100%;margin-bottom:6px;', S.crew >= maxCrew()); }
      else B(cell.ty === 'nest' ? '⚔️ Aanvallen!' : cell.ty === 'schat' ? '⛏️ Graven' : '👀 Onderzoeken', () => islandAction('go'), c, 'width:100%;margin-bottom:6px;');
      B('Weer wegzeilen', () => islandAction('leave'), c, 'width:100%;background:#475569;');
    }

    function extraUI() {
      const c = card();
      if (S.maps > 0) {
        B('🗺️ Schatkaart lezen (' + S.maps + ')', () => {
          const t = S.m.filter((x) => x.ty === 'schat' && !x.done && !x.mark);
          if (!t.length) { note = 'Alle schatten zijn al gemarkeerd.'; render(); return; }
          pickOf(t).mark = true; S.maps--; note = '🗺️ Een ❌ verschijnt op je kaart!'; save(); render();
        }, c, 'width:100%;margin-bottom:6px;background:#a16207;');
      }
      const cost = Math.floor(S.gold * 0.25);
      B('🆘 Noodsignaal: terug naar de haven (-25% goud)', () => {
        S.gold -= cost; S.pos = 0; S.food = Math.max(S.food, 8); note = 'Een vissersboot sleept je naar de haven.'; reveal(); save(); render();
      }, c, 'width:100%;background:#7f1d1d;font-size:13px;');
    }

    function portUI() {
      const c = card();
      H('div', 'font-weight:700;margin-bottom:6px;', '⚓ Haven', c);
      const hc = Math.ceil((maxHull() - S.hull) * 2);
      B('🔧 Romp repareren (💰' + hc + ')', () => { S.gold -= hc; S.hull = maxHull(); save(); render(); }, c, 'width:100%;margin-bottom:5px;', S.hull >= maxHull() || S.gold < hc);
      const fc = (maxFood() - S.food) * 3;
      B('🍖 Proviand vullen (💰' + fc + ')', () => { S.gold -= fc; S.food = maxFood(); save(); render(); }, c, 'width:100%;margin-bottom:5px;', S.food >= maxFood() || S.gold < fc);
      const wc = 30 + S.crew * 5;
      B('👥 Matroos inhuren (💰' + wc + ')', () => { S.gold -= wc; S.crew++; save(); render(); }, c, 'width:100%;margin-bottom:5px;', S.crew >= maxCrew() || S.gold < wc);
      const u1 = Math.round(60 * Math.pow(S.hullLv + 1, 1.7)), u2 = Math.round(80 * Math.pow(S.can + 1, 1.7)), u3 = 250 * (S.scope + 1) * (S.scope + 1);
      B('🛠️ Romp-upgrade niv ' + (S.hullLv + 1) + ' (💰' + fmt(u1) + ')', () => { S.gold -= u1; S.hullLv++; S.hull = maxHull(); save(); render(); }, c, 'width:100%;margin-bottom:5px;background:#7c3aed;', S.gold < u1);
      B('💣 Extra kanon (💰' + fmt(u2) + ')', () => { S.gold -= u2; S.can++; save(); render(); }, c, 'width:100%;margin-bottom:5px;background:#7c3aed;', S.gold < u2);
      B(S.scope >= 2 ? '🔭 Verrekijker: max' : '🔭 Verrekijker (zicht +1) (💰' + fmt(u3) + ')', () => { S.gold -= u3; S.scope = 2; reveal(); save(); render(); }, c, 'width:100%;background:#7c3aed;', S.scope >= 2 || S.gold < u3);
    }

    render();
    const iv = setInterval(() => { if (alive) save(); }, 10000);
    return { destroy() { alive = false; clearInterval(iv); save(); } };
  },
};
