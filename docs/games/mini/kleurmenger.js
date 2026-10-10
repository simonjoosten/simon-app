const el = (p, css, txt) => { const d = document.createElement('div'); d.style.cssText = css || ''; if (txt != null) d.textContent = txt; if (p) p.appendChild(d); return d; };
const hsl = (h, s, l) => {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
};
const NAMES = ['Rood', 'Groen', 'Blauw'], CL = ['#e53935', '#43a047', '#1e88e5'];

export default {
  id: 'kleurmenger', name: 'Kleurmenger', emoji: '🎨', hint: 'Schuif tot je mengsel de doelkleur raakt, 8 rondes',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#fafafa';
    host.style.fontFamily = 'system-ui,sans-serif';
    host.style.display = 'flex'; host.style.flexDirection = 'column';
    const top = el(host, 'height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;font-size:19px;font-weight:800;color:#37474f;flex:none');
    const rTxt = el(top, '', ''), sTxt = el(top, '', '');
    const swatches = el(host, 'display:flex;gap:10px;padding:0 14px;height:' + Math.floor(Math.min(190, api.h * 0.27)) + 'px;flex:none');
    const mkSw = lab => { const b = el(swatches, 'flex:1;border-radius:18px;position:relative;box-shadow:0 2px 0 #0003 inset'); el(b, 'position:absolute;left:0;right:0;bottom:6px;text-align:center;font-size:13px;font-weight:800;color:#fff;text-shadow:0 1px 2px #000a', lab); return b; };
    const swT = mkSw('DOEL'), swM = mkSw('JOUW MENGSEL');
    const sliders = el(host, 'flex:1;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:6px 18px;min-height:0');
    const msg = el(host, 'height:34px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;color:#37474f;flex:none');
    const btn = el(host, 'height:56px;margin:6px 14px 14px;border-radius:16px;background:#3949ab;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;cursor:pointer;flex:none;-webkit-tap-highlight-color:transparent;user-select:none', 'Klaar');
    const val = [128, 128, 128], target = [0, 0, 0], thumbs = [], vtxt = [], tracks = [];
    let dead = false, ended = false, round = 0, total = 0, phase = 'play', drag = -1;
    const rgb = c => 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
    for (let i = 0; i < 3; i++) {
      const row = el(sliders, 'display:flex;align-items:center;gap:10px;height:54px');
      el(row, 'width:52px;font-weight:800;font-size:15px;color:' + CL[i], NAMES[i]);
      const tr = el(row, 'flex:1;height:14px;border-radius:7px;position:relative;touch-action:none;cursor:pointer;background:linear-gradient(90deg,#222,' + CL[i] + ')');
      tr.dataset.i = i; tracks.push(tr);
      const th = el(tr, 'position:absolute;top:-11px;width:36px;height:36px;margin-left:-18px;border-radius:50%;background:#fff;border:4px solid ' + CL[i] + ';box-sizing:border-box;box-shadow:0 2px 4px #0005;pointer-events:none');
      thumbs.push(th);
      vtxt.push(el(row, 'width:34px;text-align:right;font-size:14px;font-weight:700;color:#546e7a', ''));
    }
    function paint() {
      swM.style.background = rgb(val); swT.style.background = rgb(target);
      for (let i = 0; i < 3; i++) { thumbs[i].style.left = (val[i] / 255 * 100) + '%'; vtxt[i].textContent = round >= 5 ? '?' : val[i]; }
    }
    function setFrom(i, e) {
      const r = tracks[i].getBoundingClientRect();
      val[i] = Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 255);
      paint();
    }
    const down = e => { if (phase !== 'play') return; const t = e.target; if (t && t.dataset && t.dataset.i !== undefined) { drag = +t.dataset.i; try { t.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); setFrom(drag, e); } };
    const move = e => { if (drag >= 0 && phase === 'play') { e.preventDefault(); setFrom(drag, e); } };
    const up = () => { drag = -1; };
    sliders.addEventListener('pointerdown', down); sliders.addEventListener('pointermove', move);
    sliders.addEventListener('pointerup', up); sliders.addEventListener('pointercancel', up);
    function next() {
      round++;
      if (round > 8) { ended = true; msg.textContent = 'Klaar! Totaal ' + total + ' punten'; btn.textContent = '...'; setTimeout(() => { if (!dead) api.end(total); }, 1200); return; }
      const t = hsl(Math.random() * 360, 45 + Math.random() * 55, 30 + Math.random() * 40);
      target[0] = t[0]; target[1] = t[1]; target[2] = t[2];
      val[0] = val[1] = val[2] = 128;
      phase = 'play'; rTxt.textContent = 'Ronde ' + round + '/8'; msg.textContent = 'Mix de doelkleur!'; btn.textContent = 'Klaar'; paint();
    }
    function press() {
      if (ended) return;
      if (phase === 'play') {
        const dist = Math.hypot(val[0] - target[0], val[1] - target[1], val[2] - target[2]);
        const pts = Math.max(0, Math.round(100 * Math.pow(Math.max(0, 1 - dist / 200), 1.5)));
        total += pts; api.score(total); sTxt.textContent = total + ' pt';
        phase = 'result';
        msg.textContent = (pts >= 90 ? 'Fantastisch! ' : pts >= 65 ? 'Goed! ' : pts >= 35 ? 'Niet slecht. ' : 'Ver ernaast. ') + '+' + pts;
        btn.textContent = round >= 8 ? 'Eindscore' : 'Volgende ronde';
        for (let i = 0; i < 3; i++) vtxt[i].textContent = val[i] + '/' + target[i];
      } else if (phase === 'result') next();
    }
    const bd = e => { e.preventDefault(); press(); };
    btn.addEventListener('pointerdown', bd);
    const kd = e => { if (e.key === 'Enter') press(); };
    window.addEventListener('keydown', kd);
    api.score(0); sTxt.textContent = '0 pt'; next();
    return { destroy() {
      dead = true;
      sliders.removeEventListener('pointerdown', down); sliders.removeEventListener('pointermove', move);
      sliders.removeEventListener('pointerup', up); sliders.removeEventListener('pointercancel', up);
      btn.removeEventListener('pointerdown', bd); window.removeEventListener('keydown', kd);
      top.remove(); swatches.remove(); sliders.remove(); msg.remove(); btn.remove();
    } };
  },
};
