export default {
  id: 'hanoi',
  name: 'Toren van Hanoi',
  emoji: '🗼',
  hint: 'Verplaats de toren naar de laatste paal. Tik een paal en dan de bestemming, of sleep. Grote schijf nooit op kleine!',
  create(host, api) {
    host.style.touchAction = 'none';
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;background:linear-gradient(160deg,#7c2d12,#1e1b4b);color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;box-sizing:border-box;padding:12px;user-select:none';
    host.appendChild(root);
    let dead = false, ended = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); };

    const title = document.createElement('div');
    title.style.cssText = 'font-size:20px;font-weight:700;text-align:center';
    const stats = document.createElement('div');
    stats.style.cssText = 'font-size:16px;min-height:22px;text-align:center';
    const pegH = Math.min(api.h * 0.45, 320);
    const rowEl = document.createElement('div');
    rowEl.style.cssText = `display:flex;width:${api.w - 24}px;max-width:420px;height:${pegH}px`;
    const give = document.createElement('button');
    give.textContent = 'Stoppen';
    give.style.cssText = 'padding:10px 22px;min-height:44px;border:0;border-radius:10px;background:rgba(255,255,255,.2);color:#fff;font-size:16px;cursor:pointer';
    root.append(title, stats, rowEl, give);

    const pegEls = [];
    for (let p = 0; p < 3; p++) {
      const col = document.createElement('div');
      col.style.cssText = 'position:relative;flex:1;display:flex;flex-direction:column-reverse;align-items:center;padding-bottom:6px;box-sizing:border-box;border-radius:10px;cursor:pointer';
      const pole = document.createElement('div');
      pole.style.cssText = 'position:absolute;left:50%;bottom:6px;width:8px;height:92%;margin-left:-4px;background:#d6c7a1;border-radius:4px;pointer-events:none';
      col.appendChild(pole);
      rowEl.appendChild(col);
      pegEls.push(col);
    }
    const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#a855f7'];
    const LEVELS = [3, 4, 5, 6];
    let note = '', lvl = 0, pegs, moves = 0, selected = -1, dragFrom = -1, total = 0, locked = false, discs = 3;

    function render() {
      const colW = rowEl.clientWidth ? rowEl.clientWidth / 3 : (api.w - 24) / 3;
      const maxW = colW - 8;
      const dh = Math.min(30, (pegH - 20) / (discs + 1));
      for (let p = 0; p < 3; p++) {
        const col = pegEls[p];
        while (col.children.length > 1) col.removeChild(col.lastChild);
        col.style.background = selected === p ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.06)';
        pegs[p].forEach((s, k) => {
          const d = document.createElement('div');
          const w = Math.max(28, maxW * (0.35 + 0.65 * s / discs));
          const lifted = selected === p && k === pegs[p].length - 1;
          d.style.cssText = `position:relative;width:${w}px;height:${dh - 3}px;margin-bottom:3px;border-radius:8px;background:${COLORS[s - 1]};box-shadow:inset 0 -3px 0 rgba(0,0,0,.25);pointer-events:none;${lifted ? 'outline:3px solid #fff;' : ''}`;
          col.appendChild(d);
        });
      }
      title.textContent = `Level ${lvl + 1} van ${LEVELS.length} · ${discs} schijven`;
      stats.textContent = note || `Zetten: ${moves} (minimaal ${(1 << discs) - 1}) · Score: ${total}`;
    }
    function startLevel() {
      discs = LEVELS[lvl];
      note = '';
      pegs = [[], [], []];
      for (let s = discs; s >= 1; s--) pegs[0].push(s);
      moves = 0; selected = -1; locked = false;
      render();
    }
    function tryMove(from, to) {
      if (from === to || !pegs[from].length) return;
      const s = pegs[from][pegs[from].length - 1];
      const top = pegs[to][pegs[to].length - 1];
      if (top !== undefined && top < s) {
        note = 'Dat mag niet: grote schijf op kleine!';
        return;
      }
      pegs[to].push(pegs[from].pop());
      moves++;
      if (pegs[2].length === discs) win();
    }
    function win() {
      locked = true;
      const optimal = (1 << discs) - 1;
      const gain = discs * 20 + Math.max(10, Math.round(100 * optimal / moves));
      total += gain;
      api.score(total);
      render();
      note = `Gelukt in ${moves} zetten! +${gain} 🎉`;
      stats.textContent = note;
      lvl++;
      if (lvl >= LEVELS.length) later(() => { if (!ended) { ended = true; api.end(total); } }, 1800);
      else later(startLevel, 1800);
    }
    function pegFromEvent(e) {
      const r = rowEl.getBoundingClientRect();
      if (!r.width) return -1;
      const x = e.clientX - r.left;
      if (x < 0 || x > r.width) return -1;
      return Math.min(2, Math.floor(x / (r.width / 3)));
    }
    const onDown = e => {
      if (dead || locked) return;
      const p = pegFromEvent(e);
      if (p < 0) return;
      note = '';
      if (selected >= 0) {
        const from = selected;
        selected = -1;
        tryMove(from, p);
        dragFrom = -1;
      } else if (pegs[p].length) {
        selected = p;
        dragFrom = p;
      }
      render();
    };
    const onUp = e => {
      if (dead || locked) { dragFrom = -1; return; }
      if (dragFrom >= 0 && selected === dragFrom) {
        const p = pegFromEvent(e);
        if (p >= 0 && p !== dragFrom) {
          selected = -1;
          tryMove(dragFrom, p);
          render();
        }
      }
      dragFrom = -1;
    };
    host.addEventListener('pointerdown', onDown);
    host.addEventListener('pointerup', onUp);
    host.addEventListener('pointercancel', onUp);
    const onKey = e => {
      if (locked) return;
      note = '';
      const p = '123'.indexOf(e.key);
      if (p < 0) return;
      if (selected >= 0) { const f = selected; selected = -1; tryMove(f, p); }
      else if (pegs[p].length) selected = p;
      render();
    };
    window.addEventListener('keydown', onKey);
    const onGive = () => { if (dead || ended) return; ended = true; api.end(total); };
    give.addEventListener('click', onGive);
    // pointerdown op de stop-knop mag geen paal kiezen
    const stop = e => e.stopPropagation();
    give.addEventListener('pointerdown', stop);
    give.addEventListener('pointerup', stop);

    api.score(0);
    startLevel();
    later(render, 50);
    return {
      destroy() {
        dead = true;
        timers.forEach(clearTimeout);
        timers.clear();
        host.removeEventListener('pointerdown', onDown);
        host.removeEventListener('pointerup', onUp);
        host.removeEventListener('pointercancel', onUp);
        window.removeEventListener('keydown', onKey);
        give.removeEventListener('click', onGive);
        give.removeEventListener('pointerdown', stop);
        give.removeEventListener('pointerup', stop);
        root.remove();
      },
    };
  },
};
