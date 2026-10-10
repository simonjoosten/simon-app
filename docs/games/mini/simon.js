export default {
  id: 'simon', name: 'Simon zegt', emoji: '🔴', hint: 'Onthoud de kleurenreeks en herhaal hem',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#14161f';
    host.style.display = 'flex'; host.style.flexDirection = 'column'; host.style.fontFamily = 'system-ui,sans-serif';
    const info = document.createElement('div');
    info.style.cssText = 'height:56px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:700;text-align:center;padding:0 10px';
    const board = document.createElement('div');
    board.style.cssText = 'flex:1;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:10px;padding:10px';
    host.appendChild(info); host.appendChild(board);
    const COL = [['#e53935', '#ff8a80'], ['#43a047', '#b9f6ca'], ['#fdd835', '#fff9c4'], ['#1e88e5', '#82b1ff']];
    const KEYS = ['q', 'w', 'a', 's'];
    const pads = COL.map((c, i) => {
      const d = document.createElement('div');
      d.style.cssText = 'border-radius:22px;background:' + c[0] + ';opacity:.55;transition:opacity .08s,transform .08s,background .08s;cursor:pointer;-webkit-tap-highlight-color:transparent';
      d.dataset.i = i; board.appendChild(d); return d;
    });
    let dead = false, ended = false, seq = [], pos = 0, accepting = false;
    const timers = [];
    function later(fn, ms) { const id = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(id); }
    function light(i, ms) {
      const p = pads[i]; p.style.opacity = '1'; p.style.background = COL[i][1]; p.style.transform = 'scale(.96)';
      beep(i);
      later(() => { p.style.opacity = '.55'; p.style.background = COL[i][0]; p.style.transform = ''; }, ms);
    }
    let ac = null;
    function beep(i) {
      try {
        ac = ac || new (window.AudioContext || window.webkitAudioContext)();
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = [262, 330, 392, 523][i]; g.gain.value = 0.05;
        o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.18);
      } catch (_) {}
    }
    function round() {
      accepting = false; pos = 0;
      seq.push(Math.floor(Math.random() * 4));
      api.score(seq.length - 1);
      info.textContent = 'Kijk goed... (' + seq.length + ')';
      const gap = Math.max(260, 600 - seq.length * 25), on = Math.max(160, gap - 120);
      seq.forEach((s, k) => later(() => light(s, on), 700 + k * gap));
      later(() => { accepting = true; info.textContent = 'Jouw beurt!'; }, 700 + seq.length * gap);
    }
    function press(i) {
      if (!accepting || ended) return;
      light(i, 160);
      if (seq[pos] !== i) {
        accepting = false; ended = true; info.textContent = 'Mis! Lengte: ' + (seq.length - 1);
        pads.forEach(p => { p.style.background = '#555'; });
        later(() => api.end(seq.length - 1), 900);
        return;
      }
      pos++;
      if (pos >= seq.length) {
        accepting = false; api.score(seq.length); info.textContent = 'Goed!';
        later(round, 800);
      }
    }
    const pd = e => { const t = e.target; if (t && t.dataset && t.dataset.i !== undefined) { e.preventDefault(); press(+t.dataset.i); } };
    board.addEventListener('pointerdown', pd);
    const kd = e => { const i = KEYS.indexOf(e.key.toLowerCase()); if (i >= 0) press(i); };
    window.addEventListener('keydown', kd);
    api.score(0);
    info.textContent = 'Maak je klaar...';
    later(round, 600);
    return { destroy() {
      dead = true; timers.forEach(clearTimeout);
      board.removeEventListener('pointerdown', pd); window.removeEventListener('keydown', kd);
      try { if (ac) ac.close(); } catch (_) {}
      info.remove(); board.remove();
    } };
  },
};
