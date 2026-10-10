// Heldenreis: beurtgebaseerde RPG met gebieden, bazen, wapens en inventaris.
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
const BTN = 'min-height:44px;padding:8px 12px;border:0;border-radius:12px;font:600 14px system-ui;color:#fff;background:linear-gradient(135deg,#b45309,#dc2626);cursor:pointer;';
const B = (txt, fn, p, css, dis) => {
  const b = H('button', BTN + (css || '') + (dis ? 'opacity:.4;' : ''), txt, p);
  b.onclick = () => { if (!dis) fn(); };
  return b;
};
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

const AREAS = [
  { n: 'Groene Heuvels', e: '🌿', foes: [['Slijmbal', '🟢', 18, 4, 6], ['Wilde Haas', '🐇', 14, 5, 5], ['Rover', '🥷', 24, 6, 9]], boss: ['Koning Slijm', '👑', 90, 9, 60] },
  { n: 'Donkere Woud', e: '🌲', foes: [['Wolf', '🐺', 40, 9, 12], ['Reuzenspin', '🕷️', 36, 11, 14], ['Boomgeest', '🌳', 55, 8, 16]], boss: ['Heks Mirna', '🧙‍♀️', 180, 15, 120] },
  { n: 'Zandwoestijn', e: '🏜️', foes: [['Schorpioen', '🦂', 70, 15, 24], ['Mummie', '🧟', 90, 14, 28], ['Zandworm', '🪱', 80, 18, 30]], boss: ['Farao Ra', '🏺', 330, 24, 220] },
  { n: 'IJspieken', e: '🏔️', foes: [['IJswolf', '🐺', 140, 22, 50], ['Sneeuwgeest', '❄️', 120, 26, 55], ['Yeti', '🦍', 190, 24, 65]], boss: ['IJsdraak', '🐲', 600, 34, 420] },
  { n: 'Vulkaanland', e: '🌋', foes: [['Lavakrab', '🦀', 260, 34, 110], ['Vuurgeest', '🔥', 230, 40, 120], ['Magmagolem', '🗿', 340, 36, 140]], boss: ['Draak Ignis', '🐉', 1200, 52, 900] },
];
const WEAPONS = [
  { n: 'Houten zwaard', e: '🗡️', a: 0, c: 0 }, { n: 'IJzeren zwaard', e: '⚔️', a: 5, c: 60 }, { n: 'Stalen bijl', e: '🪓', a: 12, c: 220 },
  { n: 'Toverstaf', e: '🪄', a: 24, c: 800 }, { n: 'Drakenzwaard', e: '🔱', a: 45, c: 3000 }, { n: 'Sterrenzwaard', e: '🌟', a: 80, c: 12000 },
];
const ARMORS = [
  { n: 'Lompen', e: '👕', d: 0, c: 0 }, { n: 'Leren vest', e: '🦺', d: 2, c: 50 }, { n: 'Maliënkolder', e: '🛡️', d: 6, c: 250 },
  { n: 'Plaatharnas', e: '🥋', d: 12, c: 1000 }, { n: 'Drakenschubben', e: '🐲', d: 22, c: 4000 }, { n: 'Sterrenpantser', e: '✨', d: 38, c: 15000 },
];

export default {
  id: 'heldenreis', name: 'Heldenreis', emoji: '🗡️', desc: 'Beurtgebaseerde RPG: versla vijanden en bazen in elk gebied.',
  async create(host, api) {
    const def = { lv: 1, xp: 0, hp: 40, gold: 20, wpn: 0, arm: 0, pot: 3, elix: 0, area: 0, kills: [0, 0, 0, 0, 0], boss: [false, false, false, false, false], best: 0, dead: 0, last: Date.now() };
    let S = Object.assign({}, def, (await api.load()) || {});
    let alive = true, tab = 'map', fight = null, log = [], msg = '';
    host.style.cssText += ';background:linear-gradient(#2a1810,#140c08);color:#fff2e0;font-family:system-ui,sans-serif;';
    const root = H('div', 'max-width:430px;margin:0 auto;padding:10px;box-sizing:border-box;', null, host);
    const save = () => { S.last = Date.now(); api.save(S); };
    const maxHp = () => 40 + (S.lv - 1) * 12;
    const atk = () => 6 + (S.lv - 1) * 3 + WEAPONS[S.wpn].a;
    const def_ = () => Math.floor((S.lv - 1) * 1.2) + ARMORS[S.arm].d;
    const need = () => Math.round(20 * Math.pow(S.lv, 1.55));
    if (S.hp > maxHp()) S.hp = maxHp();

    // Rust herstelt langzaam HP als je weg bent (offline)
    const away = Math.min((Date.now() - (S.last || Date.now())) / 60000, 480);
    if (away > 1 && S.hp < maxHp()) {
      const heal = Math.floor(away * 2);
      S.hp = Math.min(maxHp(), S.hp + heal);
      msg = 'Je hebt uitgerust: +' + heal + ' HP.';
    }

    function gainXp(x) {
      S.xp += x;
      while (S.xp >= need()) {
        S.xp -= need(); S.lv++; S.hp = maxHp();
        msg += ' ⭐ Level ' + S.lv + '! HP volledig hersteld.';
        api.toast('Level ' + S.lv + '!');
      }
    }

    function startFight(boss) {
      const a = AREAS[S.area];
      let f;
      if (boss) f = { n: a.boss[0], e: a.boss[1], hp: a.boss[2], max: a.boss[2], atk: a.boss[3], gold: a.boss[4], boss: true };
      else {
        const t = a.foes[rnd(0, a.foes.length - 1)];
        f = { n: t[0], e: t[1], hp: t[2], max: t[2], atk: t[3], gold: t[4], boss: false };
      }
      fight = f; log = [f.e + ' ' + f.n + ' valt aan!']; tab = 'fight'; render();
    }

    function foeTurn() {
      const raw = fight.atk * (0.8 + Math.random() * 0.4);
      if (fight.boss && Math.random() < 0.2) {
        const d = Math.max(1, Math.round(raw * 1.8 - def_()));
        S.hp -= d; log.unshift('💥 ' + fight.n + ' doet een krachtaanval: ' + d + ' schade!');
      } else {
        const d = Math.max(1, Math.round(raw - def_()));
        S.hp -= d; log.unshift(fight.n + ' raakt je voor ' + d + '.');
      }
      if (S.hp <= 0) lose();
    }
    function win() {
      const a = AREAS[S.area];
      const xp = Math.round(fight.max / 3 + fight.atk * 1.5);
      const g = Math.round(fight.gold * (0.8 + Math.random() * 0.5));
      S.gold += g; msg = '🏆 ' + fight.n + ' verslagen! +' + g + ' goud, +' + xp + ' xp.';
      if (fight.boss) {
        if (!S.boss[S.area]) { S.boss[S.area] = true; msg += ' Baas verslagen, het volgende gebied is open!'; }
        S.best = Math.max(S.best, S.area + 1);
        S.elix++; msg += ' Je vindt een elixer! 🧪';
      } else {
        S.kills[S.area]++;
        if (Math.random() < 0.25) { S.pot++; msg += ' Je vindt een drankje! 🍷'; }
      }
      gainXp(xp);
      fight = null; tab = 'map'; save(); render();
    }
    function lose() {
      const lost = Math.floor(S.gold / 2);
      S.gold -= lost; S.hp = Math.max(1, Math.floor(maxHp() / 2)); S.dead++;
      msg = '💀 Je bent verslagen en werd naar het dorp gedragen. Je verloor ' + lost + ' goud.';
      fight = null; tab = 'town'; save(); render();
    }

    function act(kind) {
      if (!fight) return;
      if (kind === 'hit' || kind === 'heavy') {
        const heavy = kind === 'heavy';
        if (heavy && Math.random() > 0.6) log.unshift('Je zwaaide mis!');
        else {
          const d = Math.max(1, Math.round(atk() * (heavy ? 2 : 1) * (0.85 + Math.random() * 0.3)));
          const crit = Math.random() < 0.1;
          const dd = crit ? d * 2 : d;
          fight.hp -= dd; log.unshift((crit ? '✨ Kritieke treffer! ' : 'Je raakt voor ') + dd + (crit ? '!' : '.'));
        }
        if (fight.hp <= 0) return win();
      } else if (kind === 'pot') {
        if (S.pot <= 0) return;
        S.pot--; const h = 30 + S.lv * 4; S.hp = Math.min(maxHp(), S.hp + h); log.unshift('Je drinkt een drankje: +' + h + ' HP.');
      } else if (kind === 'elix') {
        if (S.elix <= 0) return;
        S.elix--; S.hp = maxHp(); log.unshift('Elixer! HP helemaal vol.');
      } else if (kind === 'run') {
        if (!fight.boss && Math.random() < 0.6) { msg = 'Je bent veilig gevlucht.'; fight = null; tab = 'map'; save(); render(); return; }
        log.unshift(fight.boss ? 'Je kunt niet vluchten voor een baas!' : 'Vluchten mislukt!');
      }
      foeTurn();
      if (fight) render();
      save();
    }

    function render() {
      const st = host.scrollTop;
      root.innerHTML = '';
      H('div', 'font:800 20px system-ui;margin-bottom:6px;', '🗡️ Heldenreis', root);
      const hdr = H('div', 'background:#0005;border-radius:14px;padding:8px 10px;margin-bottom:8px;', null, root);
      H('div', 'display:flex;justify-content:space-between;font-weight:700;', null, hdr).innerHTML = '<span>🦸 Level ' + S.lv + '</span><span>🪙 ' + fmt(S.gold) + '</span>';
      bar(hdr, S.hp / maxHp(), '#ef4444', '❤️ ' + Math.max(0, Math.ceil(S.hp)) + '/' + maxHp());
      bar(hdr, S.xp / need(), '#3b82f6', '✨ xp ' + fmt(S.xp) + '/' + fmt(need()));
      H('div', 'font-size:12px;opacity:.8;margin-top:4px;', '⚔️ aanval ' + atk() + ' · 🛡️ verdediging ' + def_(), hdr);
      if (!fight) {
        const tabs = H('div', 'display:flex;gap:6px;margin-bottom:8px;', null, root);
        [['map', '🗺️ Kaart'], ['town', '🏘️ Dorp'], ['inv', '🎒 Tas']].forEach(([k, l]) => B(l, () => { tab = k; render(); }, tabs, 'flex:1;' + (tab === k ? '' : 'background:#4a3225;')));
      }
      if (msg) { H('div', 'background:#5a2d0c;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:14px;', msg, root); msg = ''; }
      if (fight) fightUI(); else if (tab === 'map') mapUI(); else if (tab === 'town') townUI(); else invUI();
      host.scrollTop = st;
    }
    function bar(p, frac, col, txt) {
      const b = H('div', 'position:relative;height:18px;background:#0007;border-radius:9px;overflow:hidden;margin-top:5px;', null, p);
      H('div', 'height:100%;background:' + col + ';width:' + Math.max(0, Math.min(1, frac)) * 100 + '%;', null, b);
      H('div', 'position:absolute;inset:0;text-align:center;font:600 12px/18px system-ui;', txt, b);
    }

    function mapUI() {
      AREAS.forEach((a, i) => {
        const open = i === 0 || S.boss[i - 1];
        const c = H('div', 'background:#3b2517;border-radius:14px;padding:10px;margin-bottom:8px;' + (open ? '' : 'opacity:.5;') + (S.area === i ? 'outline:2px solid #f59e0b;' : ''), null, root);
        H('div', 'font:700 16px system-ui;', a.e + ' ' + a.n + (S.boss[i] ? ' ✅' : ''), c);
        if (!open) { H('div', 'font-size:12px;', '🔒 Versla de baas van het vorige gebied.', c); return; }
        H('div', 'font-size:12px;opacity:.8;margin:3px 0;', 'Vijanden: ' + a.foes.map((f) => f[1] + f[0]).join(', ') + ' · verslagen: ' + S.kills[i], c);
        const row = H('div', 'display:flex;gap:6px;', null, c);
        B('Jagen', () => { S.area = i; startFight(false); }, row, 'flex:1;', S.hp < 1);
        B('Baas ' + a.boss[1], () => { S.area = i; startFight(true); }, row, 'flex:1;background:linear-gradient(135deg,#7c3aed,#be123c);', S.kills[i] < 5 && !S.boss[i]);
        if (S.kills[i] < 5 && !S.boss[i]) H('div', 'font-size:12px;margin-top:4px;', 'Versla nog ' + (5 - S.kills[i]) + ' vijanden om de baas uit te dagen.', c);
      });
    }
    function fightUI() {
      const c = H('div', 'background:#3b2517;border-radius:14px;padding:12px;text-align:center;', null, root);
      H('div', 'font-size:64px;', fight.e, c);
      H('div', 'font:700 16px system-ui;', fight.n + (fight.boss ? ' (BAAS)' : ''), c);
      bar(c, fight.hp / fight.max, '#f97316', Math.max(0, Math.ceil(fight.hp)) + '/' + fight.max);
      const l = H('div', 'text-align:left;margin:10px 0;min-height:80px;font-size:13px;', null, c);
      log.slice(0, 5).forEach((t, i) => H('div', 'padding:1px 0;opacity:' + (1 - i * 0.18) + ';', t, l));
      const g = H('div', 'display:grid;grid-template-columns:1fr 1fr;gap:6px;', null, c);
      B('⚔️ Aanval', () => act('hit'), g);
      B('💥 Zware slag (60%)', () => act('heavy'), g, 'background:linear-gradient(135deg,#7c3aed,#be123c);');
      B('🍷 Drankje (' + S.pot + ')', () => act('pot'), g, 'background:#0f766e;', S.pot <= 0);
      B('🧪 Elixer (' + S.elix + ')', () => act('elix'), g, 'background:#0f766e;', S.elix <= 0);
      B('🏃 Vluchten', () => act('run'), g, 'grid-column:span 2;background:#475569;');
    }
    function townUI() {
      const inn = Math.max(5, S.lv * 4);
      const c = H('div', 'background:#3b2517;border-radius:14px;padding:10px;margin-bottom:8px;', null, root);
      H('div', 'font-weight:700;', '🛏️ Herberg', c);
      B('Uitrusten voor 🪙' + inn, () => { S.gold -= inn; S.hp = maxHp(); msg = 'Heerlijk geslapen!'; save(); render(); }, c, 'width:100%;margin-top:6px;', S.gold < inn || S.hp >= maxHp());
      const sh = H('div', 'background:#3b2517;border-radius:14px;padding:10px;margin-bottom:8px;', null, root);
      H('div', 'font-weight:700;', '🧪 Winkel', sh);
      B('Drankje kopen 🪙' + (10 + S.lv * 3), () => { S.gold -= 10 + S.lv * 3; S.pot++; save(); render(); }, sh, 'width:100%;margin-top:6px;', S.gold < 10 + S.lv * 3);
      [['wpn', WEAPONS, 'a', 'Smid: wapens'], ['arm', ARMORS, 'd', 'Smid: pantsers']].forEach(([key, list, st, title]) => {
        const sm = H('div', 'background:#3b2517;border-radius:14px;padding:10px;margin-bottom:8px;', null, root);
        H('div', 'font-weight:700;margin-bottom:4px;', '🔨 ' + title, sm);
        list.forEach((it, i) => {
          if (i === 0) return;
          const own = S[key] >= i;
          B(it.e + ' ' + it.n + ' (+' + it[st] + ') ' + (own ? '✓' : '🪙' + fmt(it.c)), () => { S.gold -= it.c; S[key] = i; msg = it.n + ' gekocht en aangedaan!'; save(); render(); }, sm, 'width:100%;margin-top:4px;font-size:13px;', own || S.gold < it.c || S[key] < i - 1);
        });
      });
    }
    function invUI() {
      const c = H('div', 'background:#3b2517;border-radius:14px;padding:12px;line-height:1.7;', null, root);
      H('div', 'font-weight:700;', '🎒 Inventaris', c);
      H('div', '', WEAPONS[S.wpn].e + ' Wapen: ' + WEAPONS[S.wpn].n + ' (+' + WEAPONS[S.wpn].a + ')', c);
      H('div', '', ARMORS[S.arm].e + ' Pantser: ' + ARMORS[S.arm].n + ' (+' + ARMORS[S.arm].d + ')', c);
      H('div', '', '🍷 Drankjes: ' + S.pot + ' · 🧪 Elixers: ' + S.elix, c);
      H('div', '', '🪙 Goud: ' + fmt(S.gold), c);
      H('div', 'margin-top:6px;opacity:.8;font-size:13px;', 'Bazen verslagen: ' + S.boss.filter(Boolean).length + '/' + AREAS.length + ' · keer verslagen: ' + S.dead, c);
      B('🍷 Drankje drinken', () => { S.pot--; S.hp = Math.min(maxHp(), S.hp + 30 + S.lv * 4); save(); render(); }, c, 'width:100%;margin-top:8px;background:#0f766e;', S.pot <= 0 || S.hp >= maxHp());
      if (S.boss.every(Boolean)) H('div', 'margin-top:10px;font:700 16px system-ui;text-align:center;', '🎉 Je hebt alle bazen verslagen! Echte held!', c);
    }

    render();
    const iv = setInterval(() => { if (alive) save(); }, 10000);
    return { destroy() { alive = false; clearInterval(iv); save(); } };
  },
};
