const GEESE = [5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54, 59];
const SPECIAL = { 6: ['🌉', 'Brug'], 19: ['🍺', 'Herberg'], 31: ['🕳️', 'Put'], 42: ['🌀', 'Doolhof'], 52: ['🔒', 'Gevangenis'], 58: ['💀', 'Dood'], 63: ['🏁', 'Einde'] };
const DICE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// Berekent de stappen van een worp. Geeft {steps:[{pos,msg}], skip, stuck}
function planTurn(pos, d1, d2, first) {
  const steps = [];
  let p = pos, skip = 0, stuck = false;
  const n = d1 + d2;
  if (first && n === 9 && (d1 === 4 || d1 === 5)) { p = 53; steps.push({ pos: 53, msg: '5 en 4 gegooid: meteen naar 53!' }); }
  else if (first && n === 9 && (d1 === 3 || d1 === 6)) { p = 26; steps.push({ pos: 26, msg: '6 en 3 gegooid: meteen naar 26!' }); }
  else {
    let dir = 1, amount = n, guard = 0;
    for (;;) {
      if (++guard > 20) break;
      let target = p + dir * amount;
      // lopen
      let cur = p;
      const way = [];
      while (cur !== target) {
        const nxt = cur + Math.sign(target - cur);
        cur = nxt; way.push(cur);
        if (cur === 63 && dir === 1 && target > 63) { target = 63 - (target - 63); dir = -1; }
        if (way.length > 40) break;
      }
      way.forEach((x, i) => steps.push({ pos: x, msg: '' }));
      p = target;
      if (GEESE.includes(p) && p !== 63) { steps[steps.length - 1].msg = '🪿 Gans! Nog eens ' + amount + ' verder'; continue; }
      break;
    }
  }
  const last = (m) => { if (steps.length) steps[steps.length - 1].msg = m; else steps.push({ pos: p, msg: m }); };
  if (p === 6) { steps.push({ pos: 12, msg: '🌉 Over de brug naar 12' }); p = 12; }
  else if (p === 19) { skip = 1; last('🍺 Herberg: één beurt overslaan'); }
  else if (p === 31) { stuck = true; last('🕳️ In de put! Wacht tot iemand je redt'); }
  else if (p === 42) { steps.push({ pos: 37, msg: '🌀 Doolhof: terug naar 37' }); p = 37; }
  else if (p === 52) { stuck = true; last('🔒 Gevangenis! Wacht tot iemand je bevrijdt'); }
  else if (p === 58) { steps.push({ pos: 1, msg: '💀 De dood: terug naar het begin!' }); p = 1; }
  else if (p === 63) last('🏁 Op het einde!');
  return { steps, skip, stuck, end: p };
}

export default {
  id: 'ganzenbord',
  name: 'Ganzenbord',
  emoji: '🪿',
  hint: 'Gooi met twee dobbelstenen en race naar vakje 63',
  save: 'day',
  create(host, api) {
    host.style.touchAction = 'manipulation';
    host.style.background = '#1f5e3a';
    let dead = false, ended = false, ready = false, busy = false, over = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
    const fresh = () => [{ pos: 0, skip: 0, stuck: false, wait: 0 }, { pos: 0, skip: 0, stuck: false, wait: 0 }];
    let pl = fresh(), streak = 0, msg = 'Gooi de dobbelstenen!', dice = [0, 0], rolled = false, turn = 0;
    const NAME = ['Jij', 'Computer'];
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;font-family:system-ui,sans-serif;color:#fff;padding:8px;box-sizing:border-box;user-select:none;-webkit-user-select:none';
    host.appendChild(root);
    const CS = Math.floor(Math.min((api.w - 16) / 9, 44));
    // bord: 7 rijen van 9, van onder naar boven, slingerend
    function cellXY(n) {
      if (n <= 0) return { x: -CS * 0.6, y: 6 * CS + CS * 0.3 };
      const i = n - 1, row = Math.floor(i / 9), k = i % 9;
      const col = row % 2 === 0 ? k : 8 - k;
      return { x: col * CS, y: (6 - row) * CS };
    }
    let h = '<div style="width:100%;display:flex;justify-content:space-between;font-weight:800;font-size:15px"><span>🪿 Ganzenbord</span><span data-r="st"></span></div>';
    h += '<div data-r="board" style="position:relative;width:' + CS * 9 + 'px;height:' + CS * 7 + 'px;margin:8px 0 0 0;border-radius:6px;background:#0f3d24"></div>';
    h += '<div data-r="msg" style="margin:10px 6px 4px;font-weight:700;font-size:15px;min-height:42px;text-align:center"></div>';
    h += '<div data-r="dice" style="font-size:56px;line-height:1;min-height:60px;letter-spacing:6px"></div>';
    h += '<div data-r="info" style="font-size:13px;opacity:.85;margin:4px 0 8px;text-align:center"></div>';
    h += '<button data-r="btn" style="font:inherit;font-weight:800;border:0;border-radius:14px;padding:13px 30px;font-size:19px;color:#fff;background:#d98a00;cursor:pointer">🎲 Gooi</button>';
    root.innerHTML = h;
    const q = (n) => root.querySelector('[data-r="' + n + '"]');
    const elBoard = q('board'), elMsg = q('msg'), elDice = q('dice'), elInfo = q('info'), elBtn = q('btn'), elSt = q('st');
    // vakjes
    for (let n = 1; n <= 63; n++) {
      const { x, y } = cellXY(n);
      const d = document.createElement('div');
      const sp = SPECIAL[n], goose = GEESE.includes(n);
      let bg = n % 2 ? '#e8dcb8' : '#d4c594';
      if (goose) bg = '#f4efe0'; if (sp) bg = '#e8b4a0'; if (n === 63) bg = '#ffd54a';
      d.style.cssText = 'position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + CS + 'px;height:' + CS + 'px;box-sizing:border-box;border:1px solid #0f3d24;background:' + bg + ';color:#333;font-size:' + Math.floor(CS * 0.28) + 'px;font-weight:700;line-height:1;padding:2px';
      d.innerHTML = n + '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:' + Math.floor(CS * 0.55) + 'px;opacity:.9;padding-top:6px">' + (goose ? '🪿' : sp ? sp[0] : '') + '</div>';
      elBoard.appendChild(d);
    }
    const tokens = ['#e03131', '#1971c2'].map((col, i) => {
      const t = document.createElement('div');
      t.style.cssText = 'position:absolute;width:' + Math.floor(CS * 0.42) + 'px;height:' + Math.floor(CS * 0.42) + 'px;border-radius:50%;background:' + col + ';border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.5);transition:left .16s,top .16s;z-index:3;display:flex;align-items:center;justify-content:center;font-size:' + Math.floor(CS * 0.28) + 'px';
      t.textContent = i === 0 ? '🙂' : '🤖';
      elBoard.appendChild(t);
      return t;
    });
    function placeTokens() {
      pl.forEach((p, i) => {
        const { x, y } = cellXY(p.pos);
        const same = pl[0].pos === pl[1].pos;
        const off = same ? (i === 0 ? 0.06 : 0.5) : 0.28;
        tokens[i].style.left = x + CS * off + 'px';
        tokens[i].style.top = y + CS * 0.5 + 'px';
      });
    }
    function ui() {
      elMsg.textContent = msg;
      elDice.textContent = rolled ? DICE[dice[0] - 1] + DICE[dice[1] - 1] : '🎲';
      elSt.textContent = '🔥 Reeks ' + streak;
      elInfo.textContent = 'Jij: vakje ' + pl[0].pos + (pl[0].stuck ? ' (vast)' : '') + ' · Computer: vakje ' + pl[1].pos + (pl[1].stuck ? ' (vast)' : '');
      elBtn.style.display = (turn === 0 && !busy) || over ? '' : 'none';
      elBtn.textContent = over ? '▶ Nog een spel' : (pl[0].stuck || pl[0].skip ? '⏭ Verder' : '🎲 Gooi');
      placeTokens();
    }
    function persist() {
      if (!ready || busy || over || turn !== 0) return;
      api.save({ pl, streak, turn: 0 });
    }
    function pass(who) { turn = 1 - who; }
    function takeTurn(who) {
      const p = pl[who], o = pl[1 - who];
      busy = true; rolled = false;
      // beurt overslaan / vast
      if (p.skip > 0) { p.skip--; msg = NAME[who] + ' slaat een beurt over (herberg)'; ui(); later(() => finishTurn(who), 1200); return; }
      if (p.stuck) {
        p.wait++;
        if (p.wait >= 3) { p.stuck = false; p.wait = 0; msg = NAME[who] + ' komt vrij na lang wachten!'; }
        else msg = NAME[who] + ' zit nog vast (' + p.wait + '/3)...';
        ui(); later(() => finishTurn(who), 1200); return;
      }
      const d1 = 1 + Math.floor(Math.random() * 6), d2 = 1 + Math.floor(Math.random() * 6);
      dice = [d1, d2]; rolled = true;
      const plan = planTurn(p.pos, d1, d2, p.pos === 0);
      msg = NAME[who] + ' gooit ' + (d1 + d2) + '...';
      ui();
      let i = 0;
      const step = () => {
        if (i >= plan.steps.length) {
          p.skip = plan.skip; p.stuck = plan.stuck; p.wait = 0;
          if (plan.stuck && (plan.end === 31 || plan.end === 52)) {
            if (o.pos === plan.end && o.stuck) { o.stuck = false; o.wait = 0; msg += ' ' + NAME[1 - who] + ' is bevrijd!'; }
          }
          p.pos = plan.end;
          if (p.pos === 63) { ui(); later(() => endGame(who), 700); return; }
          ui(); later(() => finishTurn(who), 1000); return;
        }
        const s = plan.steps[i++];
        p.pos = s.pos;
        if (s.msg) msg = NAME[who] + ': ' + s.msg;
        ui(); later(step, s.msg ? 750 : 170);
      };
      later(step, 700);
    }
    function finishTurn(who) {
      busy = false;
      pass(who);
      if (turn === 1) { msg = 'Computer is aan de beurt...'; ui(); busy = true; later(() => takeTurn(1), 700); }
      else { msg = 'Jouw beurt!'; rolled = rolled; ui(); persist(); }
    }
    function endGame(who) {
      busy = false; over = true;
      if (who === 0) { streak++; api.score(streak); msg = '🎉 Je staat op 63: je wint!'; api.save({ streak, pl: fresh(), turn: 0 }); ui(); }
      else {
        msg = '😞 De computer bereikt 63. Verloren!'; api.clear(); ui();
        elBtn.style.display = 'none';
        later(() => { if (!ended) { ended = true; api.end(streak); } }, 1600);
      }
    }
    function onBtn() {
      if (!ready || ended) return;
      if (over) { pl = fresh(); over = false; turn = 0; rolled = false; msg = 'Nieuw spel! Gooi de dobbelstenen.'; ui(); persist(); return; }
      if (busy || turn !== 0) return;
      takeTurn(0);
    }
    elBtn.addEventListener('click', onBtn);
    msg = 'Laden...'; ui();
    api.load().then((s) => {
      if (dead) return;
      if (s && typeof s.streak === 'number') streak = s.streak;
      if (s && Array.isArray(s.pl) && s.pl.length === 2 && s.pl.every((x) => typeof x.pos === 'number' && x.pos >= 0 && x.pos < 63)) {
        pl = s.pl.map((x) => ({ pos: x.pos, skip: x.skip | 0, stuck: !!x.stuck, wait: x.wait | 0 }));
        msg = 'Welkom terug! Jouw beurt.';
      } else msg = 'Gooi de dobbelstenen!';
      ready = true; api.score(streak); ui();
    }).catch(() => { if (dead) return; ready = true; msg = 'Gooi de dobbelstenen!'; ui(); });
    return {
      destroy() {
        dead = true; timers.forEach(clearTimeout); timers.clear();
        elBtn.removeEventListener('click', onBtn);
        persist();
        if (root.parentNode) root.parentNode.removeChild(root);
      },
    };
  },
};
