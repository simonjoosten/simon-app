export default {
  id: 'touwtrekken', name: 'Touwtrekken', emoji: '🪢', hint: 'Tik zo snel mogelijk om het touw naar jou te trekken',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#87ceeb';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const OPP = [['🐭', 'Muis'], ['🐱', 'Kat'], ['🐶', 'Hond'], ['🐷', 'Varken'], ['🐻', 'Beer'], ['🦍', 'Gorilla'], ['🐘', 'Olifant'], ['🦖', 'T-rex'], ['🐉', 'Draak'], ['🤖', 'Robot']];
    const cx = W / 2, S = W * 0.26, RY = H * 0.5, MAXT = 25;

    let dead = false, ended = false, raf = 0, last = 0, time = 0;
    let level = 1, wins = 0, score = 0, u = 0, phase = 'intro', pt = 0, mt = 0, combo = 1, lastTap = -9, ph = 0, shake = 0;
    let msg = '', msgT = 0, tapFlash = 0, taps = 0, tapRate = 0, rateT = 0;
    const puffs = [];

    function oppPower() { return Math.min(0.62, 0.095 + 0.03 * level); }
    function oppInfo() { return OPP[(level - 1) % OPP.length]; }
    function startIntro() { phase = 'intro'; pt = 0; u = 0; mt = 0; ph = Math.random() * 6; combo = 1; taps = 0; puffs.length = 0; }
    startIntro();

    function tap() {
      if (phase !== 'fight') return;
      const dt = time - lastTap; lastTap = time;
      combo = dt < 0.24 ? Math.min(1.5, combo + 0.07) : Math.max(1, combo - 0.3);
      u += 0.042 * combo; tapFlash = 0.08; taps++; rateT += 1;
      shake = 3;
      puffs.push({ x: cx - S * 0.9 + (Math.random() - 0.5) * 40 - u * S, y: RY + 58, vx: -30 - Math.random() * 40, vy: -20 - Math.random() * 20, l: 0.5 });
    }
    const pd = e => { void e; tap(); };
    host.addEventListener('pointerdown', pd);
    const kd = e => { if ((e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown') && !e.repeat) { e.preventDefault(); tap(); } };
    window.addEventListener('keydown', kd);

    function endMatch(win) {
      if (win) {
        wins++; const bonus = Math.round(Math.max(0, MAXT - mt) * 2);
        score += 100 + bonus; api.score(score);
        phase = 'won'; pt = 0; msg = 'Gewonnen! +' + (100 + bonus); msgT = 1.3;
      } else {
        phase = 'lost'; pt = 0; msg = 'Verloren van ' + oppInfo()[1] + '!'; msgT = 99;
        if (!ended) { ended = true; api.score(score); setTimeout(() => { if (!dead) api.end(score); }, 1700); }
      }
    }

    function update(dt) {
      time += dt; pt += dt; if (msgT > 0 && msgT < 90) msgT -= dt;
      if (tapFlash > 0) tapFlash -= dt;
      if (shake > 0) shake = Math.max(0, shake - dt * 20);
      rateT -= rateT * Math.min(1, dt * 2.5);
      tapRate = rateT * 2.5;
      for (let i = puffs.length - 1; i >= 0; i--) { const p = puffs[i]; p.l -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.l <= 0) puffs.splice(i, 1); }
      if (phase === 'intro') { if (pt > 1.4) { phase = 'fight'; pt = 0; mt = 0; } }
      else if (phase === 'fight') {
        mt += dt;
        const surge = 1 + 0.55 * Math.sin(mt * 1.9 + ph) + 0.25 * Math.sin(mt * 4.3 + ph * 2);
        u -= oppPower() * Math.max(0.2, surge) * dt;
        if (u >= 1) { u = 1; endMatch(true); }
        else if (u <= -1) { u = -1; endMatch(false); }
        else if (mt >= MAXT) endMatch(u > 0.02);
      } else if (phase === 'won') { if (pt > 1.5) { level++; startIntro(); } }
    }

    function T(s, x, y, size, col, al) { ctx.font = '700 ' + size + 'px system-ui,sans-serif'; ctx.textAlign = al || 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(s, x, y); }
    function who(emoji, x, y, size, flip, lean) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(lean); if (flip) ctx.scale(-1, 1);
      ctx.font = size + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
      ctx.fillText(emoji, 0, 0); ctx.restore();
    }

    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, RY); g.addColorStop(0, '#5aaee8'); g.addColorStop(1, '#d6efff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#7cb342'; ctx.fillRect(0, RY - 30, W, H);
      ctx.fillStyle = '#689f38'; ctx.fillRect(0, RY + 90, W, H);
      // modderpoel
      ctx.fillStyle = '#5d4037'; ctx.beginPath(); ctx.ellipse(cx, RY + 64, S * 0.55, 20, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#4e342e'; ctx.beginPath(); ctx.ellipse(cx, RY + 64, S * 0.45, 14, 0, 0, 7); ctx.fill();
      // winlijnen
      ctx.setLineDash([6, 6]); ctx.lineWidth = 3;
      ctx.strokeStyle = '#43a047'; ctx.beginPath(); ctx.moveTo(cx - S, RY - 60); ctx.lineTo(cx - S, RY + 90); ctx.stroke();
      ctx.strokeStyle = '#e53935'; ctx.beginPath(); ctx.moveTo(cx + S, RY - 60); ctx.lineTo(cx + S, RY + 90); ctx.stroke();
      ctx.setLineDash([]);
      const off = -u * S, sh = (Math.random() - 0.5) * shake;
      const bob = Math.sin(time * 14) * (phase === 'fight' ? 2 : 0);
      const px = cx - S * 0.95 + off + sh, ox = cx + S * 0.95 + off - sh;
      const leanP = phase === 'fight' ? -0.25 - Math.max(0, u) * 0.2 : 0, leanO = phase === 'fight' ? 0.25 + Math.max(0, -u) * 0.2 : 0;
      // touw
      ctx.strokeStyle = '#a1887f'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(px + 10, RY + 4 + bob); ctx.lineTo(ox - 10, RY + 4 - bob); ctx.stroke();
      ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(px + 10, RY + 4 + bob); ctx.lineTo(ox - 10, RY + 4 - bob); ctx.stroke(); ctx.setLineDash([]);
      // vlag
      const fx = cx + off;
      ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.moveTo(fx, RY - 6); ctx.lineTo(fx + 20, RY + 4); ctx.lineTo(fx, RY + 14); ctx.fill();
      ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx, RY - 26); ctx.lineTo(fx, RY + 20); ctx.stroke();
      // figuren
      who('🧒', px, RY - 6 + bob, 58 + (tapFlash > 0 ? 4 : 0), false, leanP);
      who(oppInfo()[0], ox, RY - 6 - bob, 58 + level * 1.5, true, leanO);
      for (const p of puffs) { ctx.fillStyle = 'rgba(255,255,255,' + Math.max(0, p.l * 1.4) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, 4 + (0.5 - p.l) * 8, 0, 7); ctx.fill(); }
      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, 34);
      T('Ronde ' + level, 50, 17, 15, '#fff');
      T('Score ' + score, W - 54, 17, 15, '#ffeb3b');
      T('vs ' + oppInfo()[1] + ' ' + oppInfo()[0], cx, 17, 15, '#fff');
      // voortgangsbalk
      const bw = W - 60, bx = 30, by = 56;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(bx, by, bw, 14);
      ctx.fillStyle = '#e53935'; ctx.fillRect(bx + bw / 2, by, bw / 2, 14);
      ctx.fillStyle = '#43a047'; ctx.fillRect(bx, by, bw / 2, 14);
      ctx.fillStyle = '#fff'; ctx.fillRect(bx + bw / 2 - u * bw / 2 - 3, by - 4, 6, 22);
      T('jij', bx + 12, by + 28, 11, '#1b5e20'); T(oppInfo()[1].toLowerCase(), bx + bw - 22, by + 28, 11, '#b71c1c');
      if (phase === 'fight') T(Math.max(0, MAXT - mt).toFixed(0) + ' s', cx, by + 28, 12, '#fff');
      // tik-knop
      const pulse = 1 + (tapFlash > 0 ? 0.12 : Math.sin(time * 6) * 0.03);
      ctx.save(); ctx.translate(cx, H * 0.8); ctx.scale(pulse, pulse);
      ctx.fillStyle = tapFlash > 0 ? '#ffeb3b' : '#ff7043'; ctx.beginPath(); ctx.arc(0, 0, 62, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.stroke();
      ctx.restore();
      T('TIK!', cx, H * 0.8, 32, '#fff');
      if (combo > 1.05 && phase === 'fight') T('combo x' + combo.toFixed(1), cx, H * 0.8 + 84, 14, '#fff');
      if (phase === 'intro') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, H * 0.3, W, 70);
        T('Ronde ' + level + ': ' + oppInfo()[1] + ' ' + oppInfo()[0], cx, H * 0.3 + 24, 22, '#fff');
        T(pt > 0.7 ? 'Trek!' : 'Klaar...', cx, H * 0.3 + 52, 18, '#ffeb3b');
      }
      if (msgT > 0 && (phase === 'won' || phase === 'lost')) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, H * 0.3, W, 60); T(msg, cx, H * 0.3 + 30, msg.length > 18 ? 22 : 28, '#ffeb3b'); }
    }

    function frame(t) {
      if (dead) return;
      const dt = Math.min(0.033, (t - last) / 1000 || 0.016); last = t;
      update(dt); draw();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        host.removeEventListener('pointerdown', pd);
        window.removeEventListener('keydown', kd);
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      },
    };
  },
};
