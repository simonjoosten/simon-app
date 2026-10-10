export default {
  id: 'spsc', name: 'Steen Papier Schaar', emoji: '✂️', hint: 'Win reeksen (eerst 2 punten). Verlies een reeks = game over',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = 'linear-gradient(#0f2027,#2c5364)';
    host.style.display = 'flex'; host.style.flexDirection = 'column'; host.style.fontFamily = 'system-ui,sans-serif'; host.style.color = '#fff';
    const top = document.createElement('div');
    top.style.cssText = 'height:56px;display:flex;align-items:center;justify-content:space-around;font-size:17px;font-weight:700';
    const arena = document.createElement('div');
    arena.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px';
    const cpuE = document.createElement('div'); cpuE.style.cssText = 'font-size:96px;line-height:1.1';
    const msg = document.createElement('div'); msg.style.cssText = 'font-size:22px;font-weight:800;min-height:56px;text-align:center;padding:0 12px';
    const meE = document.createElement('div'); meE.style.cssText = 'font-size:96px;line-height:1.1';
    arena.appendChild(cpuE); arena.appendChild(msg); arena.appendChild(meE);
    const btns = document.createElement('div');
    btns.style.cssText = 'height:120px;display:flex;gap:10px;padding:10px 12px 16px';
    host.appendChild(top); host.appendChild(arena); host.appendChild(btns);
    const E = ['✊', '✋', '✌️'], N = ['Steen', 'Papier', 'Schaar'];
    // 0 steen, 1 papier, 2 schaar; a wint van b als (a - b + 3) % 3 === 1 (papier slaat steen, schaar slaat papier, steen slaat schaar -> 0 slaat 2)
    function beats(a, b) { return (a === 1 && b === 0) || (a === 2 && b === 1) || (a === 0 && b === 2); }
    let dead = false, ended = false, busy = false, streak = 0, me = 0, cpu = 0, series = 1;
    let hist = [], trans = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], freq = [0, 0, 0];
    const timers = [];
    function later(fn, ms) { const id = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(id); }
    function hud() { top.innerHTML = '<span>Reeks ' + series + '</span><span>Jij ' + me + ' - ' + cpu + ' CPU</span><span>🔥 ' + streak + '</span>'; }
    function cpuPick() {
      const skill = Math.min(0.15 + streak * 0.1, 0.55);
      if (hist.length >= 3 && Math.random() < skill) {
        const lastM = hist[hist.length - 1], row = trans[lastM];
        let pred = row.indexOf(Math.max(...row));
        if (Math.max(...row) === 0) pred = freq.indexOf(Math.max(...freq));
        return (pred + 1) % 3; // counter: papier(1) slaat steen(0), etc.
      }
      return Math.floor(Math.random() * 3);
    }
    function play(m) {
      if (busy || ended) return;
      busy = true;
      const c = cpuPick();
      if (hist.length) trans[hist[hist.length - 1]][m]++;
      freq[m]++; hist.push(m);
      cpuE.textContent = '✊'; meE.textContent = E[m];
      cpuE.style.transform = 'translateY(-10px)';
      msg.textContent = 'Steen... papier... schaar!';
      later(() => {
        cpuE.style.transform = ''; cpuE.textContent = E[c];
        let res = '';
        if (m === c) res = 'Gelijk! ' + N[m] + ' vs ' + N[c];
        else if (beats(m, c)) { me++; res = 'Punt voor jou! ' + N[m] + ' slaat ' + N[c]; }
        else { cpu++; res = 'Punt voor de computer. ' + N[c] + ' slaat ' + N[m]; }
        msg.textContent = res; hud();
        if (me >= 2) {
          streak++; api.score(streak); msg.textContent = 'Reeks gewonnen! 🎉'; later(() => { series++; me = 0; cpu = 0; cpuE.textContent = '🤖'; meE.textContent = '🙂'; msg.textContent = 'Nieuwe reeks. Kies!'; hud(); busy = false; }, 1400);
        } else if (cpu >= 2) {
          ended = true; msg.textContent = 'Reeks verloren 😢'; later(() => api.end(streak), 1300);
        } else later(() => { busy = false; msg.textContent = 'Kies!'; }, 900);
      }, 600);
    }
    const bs = E.map((e, i) => {
      const b = document.createElement('div');
      b.style.cssText = 'flex:1;border-radius:18px;background:rgba(255,255,255,.16);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:44px;user-select:none;cursor:pointer';
      b.innerHTML = e + '<span style="font-size:13px;font-weight:700">' + N[i] + '</span>';
      b.addEventListener('pointerdown', ev => { ev.preventDefault(); play(i); });
      btns.appendChild(b); return b;
    });
    const kd = e => { const k = { '1': 0, '2': 1, '3': 2, s: 0, p: 1, x: 2 }[e.key.toLowerCase()]; if (k !== undefined) play(k); };
    window.addEventListener('keydown', kd);
    api.score(0); hud();
    cpuE.textContent = '🤖'; meE.textContent = '🙂'; msg.textContent = 'Kies!';
    return { destroy() {
      dead = true; timers.forEach(clearTimeout); window.removeEventListener('keydown', kd);
      top.remove(); arena.remove(); btns.remove();
    } };
  },
};
