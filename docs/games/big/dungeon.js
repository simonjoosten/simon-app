// Dungeon Crawler: kamer voor kamer, keuzes, buit, vaardigheden en permanente zielen-bonussen.
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
const BTN = 'min-height:44px;padding:8px 12px;border:0;border-radius:12px;font:600 14px system-ui;color:#fff;background:linear-gradient(135deg,#7c3aed,#4338ca);cursor:pointer;';
const B = (txt, fn, p, css, dis) => {
  const b = H('button', BTN + (css || '') + (dis ? 'opacity:.4;' : ''), txt, p);
  b.onclick = () => { if (!dis) fn(); };
  return b;
};
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pickOf = (arr) => arr[Math.floor(Math.random() * arr.length)];

const SKILLS = [
  { id: 'vamp', e: '🧛', n: 'Bloeddorst', d: 'Herstel 20% van je schade als HP.' },
  { id: 'crit', e: '🎯', n: 'Scherp oog', d: '+20% kans op dubbele schade.' },
  { id: 'thick', e: '🛡️', n: 'Dikke huid', d: '+3 verdediging.' },
  { id: 'sharp', e: '🗡️', n: 'Scherpe kling', d: '+4 aanval.' },
  { id: 'lucky', e: '🍀', n: 'Geluksvogel', d: '+30% goud uit gevechten en schatten.' },
  { id: 'flee', e: '👟', n: 'Rappe voeten', d: '+30% kans om te vluchten.' },
  { id: 'regen', e: '💚', n: 'Regeneratie', d: 'Herstel 3 HP na elke kamer.' },
  { id: 'berserk', e: '😡', n: 'Razernij', d: '+50% schade onder 40% HP.' },
];
const MON = [
  [['Rat', '🐀'], ['Vleermuis', '🦇'], ['Slijm', '🟢']],
  [['Skelet', '💀'], ['Spin', '🕷️'], ['Kobold', '👺']],
  [['Zombie', '🧟'], ['Wraak', '👻'], ['Ork', '👹']],
  [['Golem', '🗿'], ['Duivelhond', '🐕‍🦺'], ['Demon', '😈']],
];
const BOSSES = [['Rattenkoning', '🐁'], ['Lichmeester', '☠️'], ['Drakenheer', '🐉'], ['Schaduwvorst', '🦹']];
const META = [
  { k: 'hp', e: '❤️', n: 'Levenskracht', d: '+8 max HP per niveau' },
  { k: 'atk', e: '⚔️', n: 'Wapentraining', d: '+2 aanval per niveau' },
  { k: 'gold', e: '🪙', n: 'Gierigheid', d: '+10% goud per niveau' },
  { k: 'pot', e: '🍷', n: 'Voorraadtas', d: '+1 startdrankje per niveau' },
];

export default {
  id: 'dungeon', name: 'Dungeon Crawler', emoji: '🕯️', desc: 'Kies je weg door de kerker; doodgaan geeft permanente zielen.',
  async create(host, api) {
    const def = { souls: 0, lv: { hp: 0, atk: 0, gold: 0, pot: 0 }, best: 0, runs: 0, run: null, over: null, totalGold: 0 };
    let S = Object.assign({}, def, (await api.load()) || {});
    S.lv = Object.assign({}, def.lv, S.lv || {});
    let alive = true, note = '';
    host.style.cssText += ';background:linear-gradient(#17102b,#0a0714);color:#efe9ff;font-family:system-ui,sans-serif;';
    const root = H('div', 'max-width:430px;margin:0 auto;padding:10px;box-sizing:border-box;', null, host);
    const save = () => api.save(S);

    const has = (id) => S.run.skills.includes(id);
    const maxHp = () => 30 + S.lv.hp * 8 + S.run.bonusHp;
    const atk = () => 5 + S.lv.atk * 2 + S.run.bonusAtk + (has('sharp') ? 4 : 0);
    const dfn = () => S.run.bonusDef + (has('thick') ? 3 : 0);
    const goldMul = () => (1 + S.lv.gold * 0.1) * (has('lucky') ? 1.3 : 1);
    const soulCost = (k) => Math.round(5 * Math.pow(S.lv[k] + 1, 1.4));

    function startRun() {
      S.runs++;
      S.run = { room: 0, hp: 30 + S.lv.hp * 8, gold: 0, skills: [], pot: 1 + S.lv.pot, bonusHp: 0, bonusAtk: 0, bonusDef: 0, scene: null, log: ['Je stapt de kerker binnen...'] };
      S.over = null;
      S.run.scene = skillScene();
      save(); render();
    }
    function skillScene() {
      const left = SKILLS.filter((s) => !S.run.skills.includes(s.id));
      const c = [];
      while (c.length < 3 && left.length) c.push(left.splice(rnd(0, left.length - 1), 1)[0].id);
      return { t: 'skill', opts: c };
    }
    function makeDoors() {
      const r = S.run.room + 1;
      const doors = [];
      for (let i = 0; i < 3; i++) {
        const x = Math.random();
        let t = x < 0.45 ? 'monster' : x < 0.62 ? 'treasure' : x < 0.74 ? 'shrine' : x < 0.84 ? 'merchant' : x < 0.94 ? 'rest' : 'mystery';
        if (i === 0 && !doors.length && r <= 2) t = 'monster';
        doors.push(t);
      }
      if (doors.every((d) => d === 'monster') && Math.random() < 0.7) doors[rnd(0, 2)] = 'rest';
      return { t: 'doors', doors };
    }
    function nextRoom() {
      const r = S.run;
      r.room++;
      if (has('regen')) r.hp = Math.min(maxHp(), r.hp + 3);
      if (r.room > S.best) S.best = r.room;
      if (r.room % 5 === 0 && r.room > 0 && r.skills.length < SKILLS.length && r.room % 10 !== 0) { r.scene = skillScene(); return; }
      r.scene = makeDoors();
      if ((r.room + 1) % 10 === 0) {
        const bi = Math.floor(r.room / 10) % BOSSES.length;
        r.scene = { t: 'monster', m: mkMonster(true, bi), boss: true, doors: null };
        r.log.unshift('Een enorme deur... de baas wacht! ' + BOSSES[bi][1]);
      }
    }
    function mkMonster(boss, bi) {
      const r = S.run.room + 1;
      const tier = Math.min(MON.length - 1, Math.floor(r / 6));
      const base = boss ? BOSSES[bi] : pickOf(MON[tier]);
      const k = boss ? 2.4 : 1;
      return { n: base[0], e: base[1], hp: Math.round((14 + r * 7) * k), atk: Math.round((3 + r * 1.5) * (boss ? 1.4 : 1)) };
    }
    function enter(t) {
      const r = S.run, rm = r.room + 1;
      if (t === 'mystery') t = pickOf(['monster', 'treasure', 'shrine', 'merchant', 'rest', 'monster']);
      if (t === 'monster') r.scene = { t: 'monster', m: mkMonster(false) };
      else if (t === 'treasure') r.scene = { t: 'treasure' };
      else if (t === 'rest') r.scene = { t: 'rest' };
      else if (t === 'merchant') r.scene = { t: 'merchant', p: 10 + rm * 2, w: 25 + rm * 4 };
      else if (t === 'shrine') {
        const o = [['pow', '🔥 Altaar van kracht: +3 aanval, maar je verliest 6 HP'], ['life', '💖 Bron van leven: +10 max HP en herstel 10 HP'], ['gold', '💰 Gouden beeld: pak ' + (10 + rm * 3) + ' goud (een vloek treft je: -4 HP)'], ['def', '🛡️ Stenen engel: +2 verdediging']];
        const a = o.splice(rnd(0, 3), 1)[0], b2 = o.splice(rnd(0, 2), 1)[0];
        r.scene = { t: 'shrine', opts: [a, b2] };
      }
      save(); render();
    }

    function fightResult() {
      const r = S.run, sc = r.scene, m = sc.m;
      let mhp = m.hp, rounds = 0, dealt = 0;
      const start = r.hp;
      while (mhp > 0 && r.hp > 0 && rounds < 60) {
        rounds++;
        let d = atk() * (0.8 + Math.random() * 0.4);
        if (has('crit') && Math.random() < 0.2) d *= 2;
        else if (Math.random() < 0.08) d *= 2;
        if (has('berserk') && r.hp < maxHp() * 0.4) d *= 1.5;
        d = Math.round(d); mhp -= d; dealt += d;
        if (has('vamp')) r.hp = Math.min(maxHp(), r.hp + Math.round(d * 0.2));
        if (mhp <= 0) break;
        r.hp -= Math.max(1, Math.round(m.atk * (0.8 + Math.random() * 0.4) - dfn()));
      }
      if (r.hp <= 0) return die(m);
      const g = Math.round((3 + (r.room + 1) * 2) * goldMul() * (sc.boss ? 3 : 1));
      r.gold += g;
      let t = '⚔️ Je versloeg ' + m.n + ' in ' + rounds + ' rondes. HP: ' + Math.max(0, start) + ' → ' + r.hp + '. +' + g + ' goud.';
      if (Math.random() < 0.18 || sc.boss) { r.pot++; t += ' Je vond een drankje!'; }
      r.log.unshift(t); note = t;
      nextRoom(); save(); render();
    }
    function flee() {
      const r = S.run, m = r.scene.m;
      if (Math.random() < 0.5 + (has('flee') ? 0.3 : 0)) {
        r.log.unshift('👟 Je ontsnapt voor ' + m.n + '!'); note = 'Je bent ontsnapt! Geen buit, maar ook geen schade.';
        nextRoom();
      } else {
        const d = Math.max(1, Math.round(m.atk - dfn()));
        r.hp -= d;
        note = 'Vluchten mislukt! ' + m.n + ' raakt je voor ' + d + '.';
        if (r.hp <= 0) return die(m);
        r.scene.noFlee = true;
      }
      save(); render();
    }
    function die(m) {
      const r = S.run;
      const souls = Math.round(r.room * 1.5 + r.gold / 12 + (r.room >= 10 ? 5 : 0));
      S.souls += souls; S.totalGold += r.gold;
      S.over = { room: r.room, gold: r.gold, souls, by: m ? m.e + ' ' + m.n : 'een val', skills: r.skills.slice() };
      S.run = null; note = '';
      save(); render();
    }

    function bar(p, frac, col, txt) {
      const b = H('div', 'position:relative;height:18px;background:#0007;border-radius:9px;overflow:hidden;margin-top:4px;', null, p);
      H('div', 'height:100%;background:' + col + ';width:' + Math.max(0, Math.min(1, frac)) * 100 + '%;', null, b);
      H('div', 'position:absolute;inset:0;text-align:center;font:600 12px/18px system-ui;', txt, b);
    }
    const card = (css) => H('div', 'background:#241a40;border-radius:14px;padding:12px;margin-bottom:8px;' + (css || ''), null, root);

    function render() {
      if (!alive) return;
      const st = host.scrollTop;
      root.innerHTML = '';
      H('div', 'font:800 20px system-ui;margin-bottom:8px;', '🕯️ Dungeon Crawler', root);
      if (!S.run) home(); else run();
      host.scrollTop = st;
    }

    function home() {
      if (S.over) {
        const o = card('background:#4c1d3a;');
        H('div', 'font:800 18px system-ui;', '💀 Je bent gevallen', o);
        H('div', 'margin-top:4px;font-size:14px;line-height:1.5;', 'Verslagen door ' + S.over.by + ' in kamer ' + S.over.room + '. Je nam ' + S.over.gold + ' goud mee en verdiende ' + S.over.souls + ' 👻 zielen. Vaardigheden: ' + (S.over.skills.map((id) => SKILLS.find((s) => s.id === id).e).join(' ') || 'geen'), o);
      } else {
        const o = card();
        H('div', 'font-size:14px;line-height:1.5;', 'Daal af in de kerker. Kies deuren, vecht of vlucht, vind buit en vaardigheden. Ga je dood? Dan verdien je zielen voor blijvende bonussen!', o);
      }
      const s = card();
      H('div', 'font-weight:700;margin-bottom:6px;', '👻 Zielen: ' + fmt(S.souls) + ' · Beste kamer: ' + S.best + ' · Pogingen: ' + S.runs, s);
      META.forEach((m) => {
        const c = soulCost(m.k);
        const row = H('div', 'display:flex;align-items:center;gap:8px;margin-top:6px;', null, s);
        H('div', 'flex:1;font-size:13px;', m.e + ' ' + m.n + ' (niv ' + S.lv[m.k] + ') · ' + m.d, row);
        B(c + ' 👻', () => { S.souls -= c; S.lv[m.k]++; save(); render(); }, row, 'min-width:70px;font-size:13px;', S.souls < c);
      });
      B('🚪 Betreed de kerker', startRun, root, 'width:100%;background:linear-gradient(135deg,#16a34a,#0d9488);font-size:16px;');
    }

    function run() {
      const r = S.run, sc = r.scene;
      const hd = card();
      H('div', 'display:flex;justify-content:space-between;font-weight:700;', null, hd).innerHTML = '<span>🚪 Kamer ' + (r.room + 1) + '</span><span>🪙 ' + fmt(r.gold) + '</span><span>🍷 ' + r.pot + '</span>';
      bar(hd, r.hp / maxHp(), '#ef4444', '❤️ ' + Math.max(0, r.hp) + '/' + maxHp());
      H('div', 'font-size:12px;opacity:.8;margin-top:4px;', '⚔️ ' + atk() + ' · 🛡️ ' + dfn() + (r.skills.length ? ' · ' + r.skills.map((id) => SKILLS.find((s) => s.id === id).e).join('') : ''), hd);
      if (r.pot > 0 && r.hp < maxHp()) B('🍷 Drankje (+50% HP)', () => { r.pot--; r.hp = Math.min(maxHp(), r.hp + Math.round(maxHp() * 0.5)); note = 'Je drinkt een drankje.'; save(); render(); }, hd, 'width:100%;margin-top:6px;background:#0f766e;');
      if (note) { H('div', 'background:#3b2a66;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:13px;', note, root); }
      const c = card();
      if (sc.t === 'skill') {
        H('div', 'font-weight:700;margin-bottom:6px;', '✨ Kies een nieuwe vaardigheid', c);
        sc.opts.forEach((id) => { const s = SKILLS.find((x) => x.id === id); B(s.e + ' ' + s.n + ' - ' + s.d, () => { r.skills.push(id); note = s.n + ' geleerd!'; r.scene = makeDoors(); if ((r.room + 1) % 10 === 0) { const bi = Math.floor(r.room / 10) % BOSSES.length; r.scene = { t: 'monster', m: mkMonster(true, bi), boss: true }; } save(); render(); }, c, 'width:100%;margin-top:6px;text-align:left;font-size:13px;'); });
      } else if (sc.t === 'doors') {
        H('div', 'font-weight:700;margin-bottom:6px;', 'Welke deur kies je?', c);
        const names = { monster: '⚔️ Gerommel en gegrom', treasure: '💰 Glinsterend licht', shrine: '⛩️ Mysterieuze gloed', merchant: '🧙 Vrolijk gefluit', rest: '🔥 Warm kampvuur', mystery: '❓ Onbekende deur' };
        sc.doors.forEach((d) => B(names[d], () => { note = ''; enter(d); }, c, 'width:100%;margin-top:6px;text-align:left;background:#3b2a66;'));
      } else if (sc.t === 'monster') {
        const m = sc.m;
        H('div', 'text-align:center;font-size:64px;', m.e, c);
        H('div', 'text-align:center;font:700 16px system-ui;', m.n + (sc.boss ? ' (BAAS)' : '') + ' · ❤️ ' + m.hp + ' · ⚔️ ' + m.atk, c);
        const row = H('div', 'display:flex;gap:6px;margin-top:10px;', null, c);
        B('⚔️ Vechten', () => { note = ''; fightResult(); }, row, 'flex:1;background:linear-gradient(135deg,#dc2626,#b45309);');
        B('👟 Vluchten', () => flee(), row, 'flex:1;background:#475569;', sc.boss || sc.noFlee);
      } else if (sc.t === 'treasure') {
        H('div', 'text-align:center;font-size:56px;', '🧰', c);
        H('div', 'text-align:center;margin:4px 0;', 'Een oude kist. Zit er een valstrik op?', c);
        const row = H('div', 'display:flex;gap:6px;', null, c);
        B('Openen', () => {
          if (Math.random() < 0.25) { const d = 3 + r.room; r.hp -= d; note = '💥 Valstrik! -' + d + ' HP.'; if (r.hp <= 0) return die(null); }
          else if (Math.random() < 0.3) { r.bonusAtk += 2; note = '⚔️ Een magisch wapenonderdeel! +2 aanval.'; }
          else { const g = Math.round((8 + r.room * 3) * goldMul()); r.gold += g; note = '💰 Je vindt ' + g + ' goud!'; }
          nextRoom(); save(); render();
        }, row, 'flex:1;');
        B('Laten liggen', () => { note = 'Je loopt voorzichtig verder.'; nextRoom(); save(); render(); }, row, 'flex:1;background:#475569;');
      } else if (sc.t === 'rest') {
        H('div', 'text-align:center;font-size:56px;', '🔥', c);
        const row = H('div', 'display:flex;gap:6px;margin-top:6px;', null, c);
        B('Rusten (+40% HP)', () => { r.hp = Math.min(maxHp(), r.hp + Math.round(maxHp() * 0.4)); note = 'Je voelt je beter.'; nextRoom(); save(); render(); }, row, 'flex:1;background:#0f766e;');
        B('Oefenen (+1 ⚔️)', () => { r.bonusAtk += 1; note = 'Je oefent met je wapen.'; nextRoom(); save(); render(); }, row, 'flex:1;');
      } else if (sc.t === 'merchant') {
        H('div', 'text-align:center;font-size:56px;', '🧙', c);
        H('div', 'text-align:center;margin:4px 0;', 'Handelaar: "Goud op tafel!" Je hebt 🪙' + r.gold, c);
        B('🍷 Drankje 🪙' + sc.p, () => { r.gold -= sc.p; r.pot++; save(); render(); }, c, 'width:100%;margin-top:4px;', r.gold < sc.p);
        B('🗡️ Slijpsteen +2 ⚔️ 🪙' + sc.w, () => { r.gold -= sc.w; r.bonusAtk += 2; sc.w = Math.round(sc.w * 1.5); save(); render(); }, c, 'width:100%;margin-top:4px;', r.gold < sc.w);
        B('🛡️ Schild +1 🛡️ 🪙' + sc.w, () => { r.gold -= sc.w; r.bonusDef += 1; sc.w = Math.round(sc.w * 1.5); save(); render(); }, c, 'width:100%;margin-top:4px;', r.gold < sc.w);
        B('Verder', () => { note = ''; nextRoom(); save(); render(); }, c, 'width:100%;margin-top:4px;background:#475569;');
      } else if (sc.t === 'shrine') {
        H('div', 'text-align:center;font-size:56px;', '⛩️', c);
        sc.opts.forEach(([k, t]) => B(t, () => {
          if (k === 'pow') { r.bonusAtk += 3; r.hp -= 6; }
          else if (k === 'life') { r.bonusHp += 10; r.hp += 10; }
          else if (k === 'gold') { r.gold += Math.round((10 + (r.room + 1) * 3) * goldMul()); r.hp -= 4; }
          else r.bonusDef += 2;
          if (r.hp <= 0) return die(null);
          note = 'De schrijn schenkt je zijn kracht.'; nextRoom(); save(); render();
        }, c, 'width:100%;margin-top:6px;text-align:left;font-size:13px;background:#3b2a66;'));
      }
      if (r.log.length > 1) { const l = H('div', 'font-size:12px;opacity:.6;', null, root); r.log.slice(0, 3).forEach((t) => H('div', 'padding:2px 0;', t, l)); }
      B('🏳️ Opgeven (zielen verdienen)', () => die(null), root, 'width:100%;margin-top:10px;background:#334155;font-size:12px;');
    }

    render();
    const iv = setInterval(() => { if (alive) save(); }, 10000);
    return { destroy() { alive = false; clearInterval(iv); save(); } };
  },
};
