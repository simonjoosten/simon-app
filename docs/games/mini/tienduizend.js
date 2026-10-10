const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const TARGET = 10000;
const MINBANK = 300;
// Score van een set dobbelstenen waarvan ALLE stenen moeten meetellen. -> {score, valid}
function scoreSet(vals) {
  const n = vals.length;
  if (!n) return { score: 0, valid: false };
  const cnt = [0, 0, 0, 0, 0, 0, 0];
  vals.forEach((v) => { cnt[v]++; });
  if (n === 6 && cnt.slice(1).every((x) => x === 1)) return { score: 1500, valid: true };
  if (n === 6 && cnt.slice(1).filter((x) => x === 2).length === 3) return { score: 1000, valid: true };
  let score = 0, valid = true;
  for (let f = 1; f <= 6; f++) {
    const c = cnt[f];
    if (!c) continue;
    if (c >= 3) score += (f === 1 ? 1000 : f * 100) * Math.pow(2, c - 3);
    else if (f === 1) score += c * 100;
    else if (f === 5) score += c * 50;
    else valid = false;
  }
  return { score, valid };
}
// Meeste punten uit een worp (alleen scorende stenen), geeft indices
function scoringIdx(vals) {
  const n = vals.length;
  const all = vals.map((_, i) => i);
  if (n === 6) { const s = scoreSet(vals); if (s.valid && (s.score === 1500 || s.score === 1000)) return all; }
  const cnt = [0, 0, 0, 0, 0, 0, 0];
  vals.forEach((v) => { cnt[v]++; });
  const idx = [];
  vals.forEach((v, i) => { if (cnt[v] >= 3 || v === 1 || v === 5) idx.push(i); });
  return idx;
}
const canScore = (vals) => scoringIdx(vals).length > 0;
export default {
  id: 'tienduizend',
  name: 'Tienduizend',
  emoji: '🎲',
  hint: 'Gooi 6 dobbelstenen, bewaar punten, durf te riskeren. Eerst op 10.000 wint',
  create(host, api) {
    host.style.touchAction = 'manipulation';
    host.style.background = '#5a2a12';
    let dead = false, ended = false, busy = false, over = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
    let total = [0, 0], pot = 0, dice = [], kept = [], sel = [], turn = 0, streak = 0, msg = '', rolling = false;
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;font-family:system-ui,sans-serif;color:#fff;padding:10px;box-sizing:border-box;user-select:none;-webkit-user-select:none';
    host.appendChild(root);
    const roll = (n) => Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6));

    function render() {
      const dsz = Math.min(64, Math.floor((api.w - 60) / 4));
      let h = '<div style="width:100%;display:flex;justify-content:space-between;font-weight:800;font-size:15px"><span>🎲 Tienduizend</span><span>🔥 Reeks ' + streak + '</span></div>';
      h += '<div style="display:flex;gap:12px;width:100%;margin:10px 0">';
      for (const p of [0, 1]) h += '<div style="flex:1;border-radius:12px;padding:8px;text-align:center;background:' + (turn === p && !over ? '#ffd54a;color:#2b1500' : '#ffffff1f') + '"><div style="font-size:13px;font-weight:700">' + (p ? '🤖 Computer' : '🙂 Jij') + '</div><div style="font-size:26px;font-weight:900">' + total[p] + '</div></div>';
      h += '</div>';
      h += '<div style="font-size:15px;font-weight:700">Punten deze beurt: <span style="color:#ffd54a;font-size:20px">' + pot + '</span></div>';
      h += '<div style="min-height:46px;margin:8px 0;font-size:16px;font-weight:800;text-align:center;display:flex;align-items:center">' + msg + '</div>';
      if (kept.length) {
        h += '<div style="font-size:12px;opacity:.8">Bewaard:</div><div style="font-size:' + Math.floor(dsz * 0.6) + 'px;line-height:1.1;letter-spacing:3px;min-height:' + Math.floor(dsz * 0.7) + 'px">' + kept.map((v) => FACES[v - 1]).join('') + '</div>';
      }
      h += '<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;max-width:' + (dsz * 3 + 50) + 'px;margin:10px 0;flex:1;align-content:center">';
      dice.forEach((v, i) => {
        const on = sel.includes(i);
        h += '<div data-d="' + i + '" style="width:' + dsz + 'px;height:' + dsz + 'px;border-radius:12px;background:' + (on ? '#ffd54a' : '#fff') + ';color:#222;display:flex;align-items:center;justify-content:center;font-size:' + Math.floor(dsz * 0.95) + 'px;line-height:1;cursor:pointer;box-shadow:0 4px 8px rgba(0,0,0,.45);' + (on ? 'transform:translateY(-6px);outline:3px solid #fff' : '') + (rolling ? ';animation:tdr .3s' : '') + '">' + FACES[v - 1] + '</div>';
      });
      h += '</div>';
      const ss = scoreSet(sel.map((i) => dice[i]));
      const mine = turn === 0 && !busy && !over;
      if (mine) {
        h += '<div style="font-size:14px;min-height:20px;margin-bottom:6px">' + (sel.length ? (ss.valid ? 'Selectie: +' + ss.score : 'Selectie telt niet helemaal mee') : (dice.length ? 'Tik de scorende stenen aan' : '')) + '</div>';
        const can = sel.length && ss.valid;
        const bankSum = pot + (can ? ss.score : 0);
        h += '<div style="display:flex;gap:10px;width:100%;max-width:340px"><button data-a="roll" style="flex:1;' + bs('#16a34a') + '"' + (can ? '' : ' disabled') + '>🎲 Verder gooien</button><button data-a="bank" style="flex:1;' + bs('#2563eb') + '"' + (can && bankSum >= MINBANK ? '' : ' disabled') + '>💰 Bank ' + (can ? bankSum : '') + '</button></div>';
        h += '<div style="font-size:11px;opacity:.7;margin-top:5px">Bankieren kan vanaf ' + MINBANK + ' punten</div>';
      } else if (over) {
        if (total[0] >= TARGET) h += '<button data-a="new" style="' + bs('#16a34a') + ';width:240px">Nog een spel ▶</button>';
      }
      root.innerHTML = '<style>@keyframes tdr{from{transform:rotate(200deg) scale(.5);opacity:.3}to{transform:none;opacity:1}}</style>' + h;
    }
    function bs(c) { return 'font:inherit;font-weight:900;border:0;border-radius:14px;color:#fff;cursor:pointer;padding:14px 8px;font-size:16px;background:' + c; }
    function startTurn(p) {
      turn = p; pot = 0; kept = []; sel = []; busy = false;
      doRoll(6, p);
    }
    function doRoll(n, p) {
      dice = roll(n); sel = []; rolling = true;
      if (!canScore(dice)) {
        msg = (p ? 'Computer' : 'Jij') + ' gooit niets: PECH! 💥 Beurtpunten weg';
        busy = true; render(); rolling = false;
        later(() => { pot = 0; nextTurn(p); }, 1700);
        return;
      }
      msg = p === 0 ? 'Kies scorende stenen (1, 5, drie gelijke, straat)' : 'Computer gooit...';
      render(); rolling = false;
      if (p === 1) { busy = true; later(botChoose, 1100); }
    }
    function nextTurn(p) {
      dice = []; kept = []; sel = []; pot = 0;
      startTurn(1 - p);
    }
    function bank(p, add) {
      total[p] += pot + add;
      const sum = pot + add;
      pot = 0;
      if (total[p] >= TARGET) { gameOver(p); return; }
      msg = (p ? 'Computer' : 'Jij') + ' bankiert ' + sum + ' punten 💰';
      dice = []; kept = []; sel = [];
      busy = true; render();
      later(() => nextTurn(p), 1300);
    }
    function gameOver(p) {
      over = true; busy = false; dice = []; kept = []; sel = [];
      if (p === 0) { streak++; api.score(streak); msg = '🏆 Je hebt ' + total[0] + ' punten: JIJ WINT!'; render(); }
      else { msg = '😞 De computer haalt ' + total[1] + '. Verloren!'; render(); later(() => { if (!ended) { ended = true; api.end(streak); } }, 1700); }
    }
    function keepAndRoll(p, idxs) {
      const vals = idxs.map((i) => dice[i]);
      const sc = scoreSet(vals).score;
      pot += sc;
      kept = kept.concat(vals);
      const remaining = dice.filter((_, i) => !idxs.includes(i));
      if (remaining.length === 0) { msg = '🔥 Alle stenen scoren: opnieuw met 6!'; kept = []; doRoll(6, p); }
      else doRoll(remaining.length, p);
    }
    function botChoose() {
      if (over) return;
      let idx = scoringIdx(dice);
      // bij losse enkele 5 en veel stenen over: alleen de beste steen bewaren
      const vals = idx.map((i) => dice[i]);
      if (!scoreSet(vals).valid) {
        // fallback: filter naar geldig
        idx = idx.filter((i) => dice[i] === 1 || dice[i] === 5 || dice.filter((x) => x === dice[i]).length >= 3);
      }
      const sc = scoreSet(idx.map((i) => dice[i])).score;
      const singles = idx.every((i) => (dice[i] === 1 || dice[i] === 5) && dice.filter((x) => x === dice[i]).length < 3);
      if (singles && idx.length > 1 && dice.length - idx.length < 2 && pot + sc < MINBANK) {
        // houd niet alles: behoud minimaal wat nodig is
      }
      if (singles && idx.length >= 2 && dice.length >= 5) {
        // houd alleen de beste: 1 of 5
        const best = idx.find((i) => dice[i] === 1) ?? idx[0];
        idx = [best];
      }
      sel = idx.slice(); msg = 'Computer bewaart ' + scoreSet(idx.map((i) => dice[i])).score + ' punten'; render();
      later(() => {
        if (over) return;
        const add = scoreSet(idx.map((i) => dice[i])).score;
        const remaining = dice.length - idx.length;
        const potAfter = pot + add;
        const wins = total[1] + potAfter >= TARGET;
        let bankIt = false;
        if (potAfter >= MINBANK) {
          if (wins || remaining === 0 && false) bankIt = true;
          else if (remaining <= 2 && potAfter >= 400) bankIt = true;
          else if (remaining === 3 && potAfter >= 500) bankIt = true;
          else if (remaining === 4 && potAfter >= 700) bankIt = true;
          else if (remaining === 5 && potAfter >= 1000) bankIt = true;
          else if (potAfter >= 1500) bankIt = true;
          if (total[0] >= 8500 && total[1] + potAfter < TARGET && potAfter < 1500) bankIt = false; // tegenstander dichtbij: risico nemen
          if (remaining === 0) bankIt = wins;
        }
        if (bankIt) bank(1, add);
        else keepAndRoll(1, idx);
      }, 1200);
    }
    root.addEventListener('click', (e) => {
      if (ended) return;
      const a = e.target.closest('[data-a]');
      if (a) {
        const k = a.dataset.a;
        if (k === 'new' && over) { total = [0, 0]; over = false; msg = ''; startTurn(0); return; }
        if (turn !== 0 || busy || over) return;
        const idxs = sel.slice();
        const ss = scoreSet(idxs.map((i) => dice[i]));
        if (!idxs.length || !ss.valid) return;
        if (k === 'roll') keepAndRoll(0, idxs);
        else if (k === 'bank' && pot + ss.score >= MINBANK) bank(0, ss.score);
        return;
      }
      const d = e.target.closest('[data-d]');
      if (!d || turn !== 0 || busy || over) return;
      const i = Number(d.dataset.d);
      const at = sel.indexOf(i);
      if (at >= 0) sel.splice(at, 1); else sel.push(i);
      render();
    });
    api.score(0);
    startTurn(0);
    return {
      destroy() {
        dead = true; timers.forEach(clearTimeout); timers.clear();
        if (root.parentNode) root.parentNode.removeChild(root);
      },
    };
  },
};
