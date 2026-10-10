export default {
  id: 'gelukswiel',
  name: 'Gelukswiel',
  emoji: '🎡',
  hint: 'Draai 10 keer aan het rad. Zet punten veilig in de bank, of waag het erop: Bankroet wist je pot!',
  create(host, api) {
    host.style.touchAction = 'none';
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;background:linear-gradient(160deg,#4a044e,#1e3a8a);color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;box-sizing:border-box;padding:12px;user-select:none';
    host.appendChild(root);
    let dead = false, ended = false, raf = 0;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); };

    const info = document.createElement('div');
    info.style.cssText = 'font-size:16px;font-weight:700;text-align:center;line-height:1.5';
    const msg = document.createElement('div');
    msg.style.cssText = 'font-size:18px;font-weight:700;min-height:48px;text-align:center;color:#fde68a;display:flex;align-items:center;justify-content:center';
    const D = Math.floor(Math.min(api.w - 24, api.h * 0.46, 320));
    const dpr = window.devicePixelRatio || 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(D * dpr);
    canvas.height = Math.round(D * dpr);
    canvas.style.cssText = `width:${D}px;height:${D}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:10px;width:100%;max-width:340px';
    const mk = (txt, bg) => {
      const b = document.createElement('button');
      b.textContent = txt;
      b.style.cssText = `flex:1;min-height:50px;border:0;border-radius:12px;background:${bg};color:#fff;font-size:17px;font-weight:700;cursor:pointer;touch-action:manipulation`;
      return b;
    };
    const bankBtn = mk('🏦 Bank', '#15803d');
    const spinBtn = mk('🎡 Draai!', '#d97706');
    btns.append(bankBtn, spinBtn);
    root.append(info, canvas, msg, btns);

    const SEGS = [
      { t: '+50', type: 'add', v: 50, c: '#2563eb' },
      { t: '+100', type: 'add', v: 100, c: '#16a34a' },
      { t: 'BANKROET', type: 'bust', c: '#111827' },
      { t: '+200', type: 'add', v: 200, c: '#7c3aed' },
      { t: '-100', type: 'minus', v: 100, c: '#b91c1c' },
      { t: '+300', type: 'add', v: 300, c: '#0891b2' },
      { t: 'PECH', type: 'zero', c: '#6b7280' },
      { t: '+500', type: 'add', v: 500, c: '#ea580c' },
      { t: 'BANKROET', type: 'bust', c: '#111827' },
      { t: '+150', type: 'add', v: 150, c: '#db2777' },
      { t: '+1000', type: 'add', v: 1000, c: '#ca8a04' },
      { t: '-50', type: 'minus', v: 50, c: '#b91c1c' },
    ];
    const SA = Math.PI * 2 / SEGS.length;
    let rot = 0, spinning = false, spinsLeft = 10, bank = 0, pot = 0, over = false;
    let spin = null;

    function drawWheel() {
      const r = D / 2 - 14, cx = D / 2, cy = D / 2 + 6;
      ctx.clearRect(0, 0, D, D);
      for (let i = 0; i < SEGS.length; i++) {
        const a0 = rot + i * SA;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, a0, a0 + SA);
        ctx.closePath();
        ctx.fillStyle = SEGS[i].c;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(a0 + SA / 2);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${SEGS[i].t.length > 6 ? 11 : 15}px system-ui,sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(SEGS[i].t, r - 8, 0);
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, 7);
      ctx.fillStyle = '#fff';
      ctx.fill();
      // wijzer bovenaan
      ctx.beginPath();
      ctx.moveTo(cx - 12, 2);
      ctx.lineTo(cx + 12, 2);
      ctx.lineTo(cx, 30);
      ctx.closePath();
      ctx.fillStyle = '#facc15';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    function updateUI() {
      info.innerHTML = `Draaien over: ${spinsLeft} · 🏦 Bank: ${bank}<br>💰 Pot (onzeker): ${pot}`;
      bankBtn.disabled = spinning || over || pot <= 0;
      spinBtn.disabled = spinning || over || spinsLeft <= 0;
      bankBtn.style.opacity = bankBtn.disabled ? '.4' : '1';
      spinBtn.style.opacity = spinBtn.disabled ? '.4' : '1';
      bankBtn.textContent = pot > 0 ? `🏦 Bank +${pot}` : '🏦 Bank';
    }
    function finish() {
      over = true;
      bank += pot; pot = 0;
      api.score(bank);
      updateUI();
      msg.textContent = `Klaar! Totaal: ${bank} punten 🎉`;
      later(() => { if (!ended) { ended = true; api.end(bank); } }, 2000);
    }
    function startSpin() {
      if (spinning || over || spinsLeft <= 0) return;
      spinning = true;
      spinsLeft--;
      msg.textContent = 'Daar gaat ie...';
      const extra = Math.PI * 2 * (4 + Math.floor(Math.random() * 3)) + Math.random() * Math.PI * 2;
      spin = { t0: performance.now(), dur: 3200, from: rot, extra };
      updateUI();
    }
    function result() {
      const a = (((-Math.PI / 2 - rot) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const seg = SEGS[Math.floor(a / SA) % SEGS.length];
      spinning = false;
      if (seg.type === 'add') { pot += seg.v; msg.textContent = `+${seg.v} in de pot!`; }
      else if (seg.type === 'minus') { const l = Math.min(pot, seg.v); pot -= l; msg.textContent = `Oei, -${seg.v}${l < seg.v ? ' (pot leeg)' : ''}`; }
      else if (seg.type === 'bust') { pot = 0; msg.textContent = '💥 BANKROET! Pot weg!'; }
      else msg.textContent = 'Pech, niets gewonnen';
      if (spinsLeft <= 0) { finish(); return; }
      msg.textContent += ' · Bank of doorgaan?';
      updateUI();
    }
    bankBtn.addEventListener('click', () => {
      if (dead || spinning || over || pot <= 0) return;
      bank += pot;
      msg.textContent = `+${pot} veilig in de bank! 🏦`;
      pot = 0;
      api.score(bank);
      updateUI();
    });
    spinBtn.addEventListener('click', () => { if (!dead) startSpin(); });
    const onKey = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); startSpin(); } };
    window.addEventListener('keydown', onKey);

    let last = 0;
    function loop(now) {
      if (dead) return;
      if (spin) {
        const k = Math.min(1, (now - spin.t0) / spin.dur);
        const e = 1 - Math.pow(1 - k, 3);
        rot = spin.from + spin.extra * e;
        if (k >= 1) { spin = null; result(); }
      }
      drawWheel();
      raf = requestAnimationFrame(loop);
    }
    api.score(0);
    msg.textContent = 'Tik op Draai!';
    updateUI();
    raf = requestAnimationFrame(loop);
    return {
      destroy() {
        dead = true;
        cancelAnimationFrame(raf);
        timers.forEach(clearTimeout);
        timers.clear();
        window.removeEventListener('keydown', onKey);
        root.remove();
      },
    };
  },
};
