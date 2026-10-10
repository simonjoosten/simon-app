export default {
  id: 'curling', name: 'Curling', emoji: '🥌', hint: 'Richt met je vinger, houd vast voor kracht, laat los. Tik om te vegen',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#0d2238';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = W / 2, HALF = Math.min(130, (W - 16) / 2), SR = 13, BY = 150, HOG = 335, startY = H - 76, topY = 44;
    const RAD = [84, 56, 28, 8], A = 36, MAXN = 16;
    let dead = false, ended = false, raf = 0, last = 0, time = 0;
    let stones = [], thrown = 0, phase = 'aim', cur = null, wait = 0, msg = '', msgT = 0;
    let aimX = cx, charge = null, sweepT = 0, keyHold = false;

    function bgDist(s) { return Math.hypot(s.x - cx, s.y - BY); }
    function standing() {
      const ins = stones.filter(s => !s.gone && bgDist(s) < RAD[0] + SR - 2).sort((a, b) => bgDist(a) - bgDist(b));
      let pts = 0, team = null;
      if (ins.length) {
        team = ins[0].team;
        for (const s of ins) { if (s.team === team) pts++; else break; }
      }
      const mine = ins.filter(s => s.team === 'p').length;
      return { pts, team, mine, ins };
    }
    function liveScore() { const st = standing(); return (st.team === 'p' ? st.pts * 25 : 0) + st.mine * 5; }

    function throwStone(team, vx, vy) {
      cur = { x: cx, y: startY, vx, vy, team, gone: false, thrown: true, crossed: false };
      stones.push(cur); thrown++; phase = 'slide'; sweepT = 0;
    }

    function cpuThrow() {
      let tx = cx + (Math.random() - 0.5) * 24, ty = BY, takeout = false;
      const st = standing();
      const targets = st.ins.filter(s => s.team === 'p');
      if (targets.length && Math.random() < 0.6) { const t = targets[0]; tx = t.x; ty = t.y; takeout = true; }
      else if (st.team === 'c' && Math.random() < 0.3) { tx = cx + (Math.random() - 0.5) * 30; ty = 290; }
      const dx = tx - cx, dy = ty - startY, d = Math.hypot(dx, dy);
      let ang = Math.atan2(dx, -dy) + (Math.random() - 0.5) * 0.03;
      let v = Math.sqrt(2 * A * d) * (1 + (Math.random() - 0.5) * 0.07);
      if (takeout) v = Math.sqrt(2 * A * d) + 85;
      throwStone('c', Math.sin(ang) * v, -Math.cos(ang) * v);
    }

    function finishGame() {
      const st = standing();
      const ps = st.team === 'p' ? st.pts : 0, cs = st.team === 'c' ? st.pts : 0;
      const sc = ps * 25 + st.mine * 5;
      msg = ps ? 'Jij scoort ' + ps + '!' : cs ? 'Computer scoort ' + cs : 'Geen punten'; msgT = 99;
      phase = 'done'; api.score(sc);
      if (!ended) { ended = true; setTimeout(() => { if (!dead) api.end(sc); }, 1800); }
    }

    const pos = e => { const b = host.getBoundingClientRect(); return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height }; };
    const pd = e => {
      const p = pos(e);
      if (phase === 'slide' && cur && cur.team === 'p') { sweepT = 0.5; return; }
      if (phase !== 'aim') return;
      aimX = Math.max(cx - HALF, Math.min(cx + HALF, p.x)); charge = { t: 0 };
      try { host.setPointerCapture(e.pointerId); } catch (_) {}
    };
    const pm = e => {
      if (phase === 'aim' && (charge || e.pointerType === 'mouse')) { aimX = Math.max(cx - HALF, Math.min(cx + HALF, pos(e).x)); }
    };
    function power() { if (!charge) return 0; const k = (charge.t * 0.85) % 2; return k < 1 ? k : 2 - k; }
    function release() {
      if (!charge) return;
      const p = power(); charge = null;
      if (phase !== 'aim') return;
      const dx = aimX - cx, dy = BY - startY, ang = Math.atan2(dx, -dy);
      const v = (90 + p * 190) * (1 + (Math.random() - 0.5) * 0.02);
      throwStone('p', Math.sin(ang) * v, -Math.cos(ang) * v);
    }
    const pu = () => release();
    const pc = () => { charge = null; };
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm);
    host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pc);
    const kd = e => {
      if (e.key === 'ArrowLeft') aimX = Math.max(cx - HALF, aimX - 8);
      else if (e.key === 'ArrowRight') aimX = Math.min(cx + HALF, aimX + 8);
      else if (e.key === ' ') {
        e.preventDefault();
        if (phase === 'slide' && cur && cur.team === 'p') sweepT = 0.5;
        else if (phase === 'aim' && !keyHold) { keyHold = true; charge = { t: 0 }; }
      }
    };
    const ku = e => { if (e.key === ' ' && keyHold) { keyHold = false; release(); } };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

    function physics(dt) {
      const sub = 4, h = dt / sub;
      for (let s = 0; s < sub; s++) {
        for (const a of stones) {
          if (a.gone) continue;
          const sp = Math.hypot(a.vx, a.vy);
          if (sp > 0) {
            let dec = A * ((a === cur && a.team === 'p' && sweepT > 0) ? 0.55 : 1);
            const ns = sp - dec * h;
            if (ns <= 2) { a.vx = a.vy = 0; } else { a.vx *= ns / sp; a.vy *= ns / sp; }
          }
          a.x += a.vx * h; a.y += a.vy * h;
          if (a.y < HOG) a.crossed = true;
          if (a.y < topY + 6 || Math.abs(a.x - cx) > HALF + 6) a.gone = true;
        }
        for (let i = 0; i < stones.length; i++) for (let j = i + 1; j < stones.length; j++) {
          const a = stones[i], b = stones[j]; if (a.gone || b.gone) continue;
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
          if (d < SR * 2 && d > 0.001) {
            const nx = dx / d, ny = dy / d, ov = (SR * 2 - d) / 2;
            a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov;
            const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
            if (rel > 0) { const k = rel * 0.96; a.vx -= nx * k; a.vy -= ny * k; b.vx += nx * k; b.vy += ny * k; }
            a.crossed = a.crossed || false;
          }
        }
      }
    }

    function update(dt) {
      time += dt; if (msgT > 0 && msgT < 90) msgT -= dt;
      if (sweepT > 0) sweepT -= dt;
      if (charge) charge.t += dt;
      if (phase === 'slide') {
        physics(dt);
        let moving = false;
        for (const s of stones) if (!s.gone && (s.vx || s.vy)) moving = true;
        if (!moving) {
          if (cur && !cur.gone && !cur.crossed) { cur.gone = true; msg = 'Te kort!'; msgT = 1.0; }
          else if (cur && cur.gone && cur.team === 'p') { msg = 'Eruit!'; msgT = 1.0; }
          cur = null;
          api.score(liveScore());
          if (thrown >= MAXN) { phase = 'wait2'; wait = 0.8; } else { phase = 'wait'; wait = 0.7; }
        }
      } else if (phase === 'wait') {
        wait -= dt;
        if (wait <= 0) {
          if (thrown % 2 === 0) { phase = 'aim'; charge = null; } else { phase = 'cpu'; wait = 0.9; msg = 'Computer gooit...'; msgT = 0.9; }
        }
      } else if (phase === 'cpu') {
        wait -= dt; if (wait <= 0) cpuThrow();
      } else if (phase === 'wait2') { wait -= dt; if (wait <= 0) finishGame(); }
    }

    function T(s, x, y, size, col, al) { ctx.font = '700 ' + size + 'px system-ui,sans-serif'; ctx.textAlign = al || 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(s, x, y); }
    function stone(x, y, team, scale) {
      const r = SR * (scale || 1);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(x + 2, y + 3, r, 0, 7); ctx.fill();
      ctx.fillStyle = '#9e9e9e'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.fillStyle = '#cfcfcf'; ctx.beginPath(); ctx.arc(x, y, r * 0.88, 0, 7); ctx.fill();
      ctx.fillStyle = team === 'p' ? '#e53935' : '#fdd835'; ctx.beginPath(); ctx.arc(x, y, r * 0.58, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.22, 0, 7); ctx.fill();
    }

    function draw() {
      ctx.fillStyle = '#0d2238'; ctx.fillRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, topY, 0, H); g.addColorStop(0, '#e3f4ff'); g.addColorStop(1, '#c4e4f7');
      ctx.fillStyle = g; ctx.fillRect(cx - HALF, topY, HALF * 2, H - topY);
      ctx.fillStyle = '#6d4c41'; ctx.fillRect(cx - HALF - 6, topY, 6, H - topY); ctx.fillRect(cx + HALF, topY, 6, H - topY);
      ctx.fillStyle = '#6d4c41'; ctx.fillRect(cx - HALF - 6, topY - 6, HALF * 2 + 12, 6);
      // huis
      const cols = ['#1976d2', '#f5fbff', '#e53935', '#f5fbff'];
      for (let i = 0; i < 4; i++) { ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.arc(cx, BY, RAD[i], 0, 7); ctx.fill(); }
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx - HALF, BY); ctx.lineTo(cx + HALF, BY); ctx.moveTo(cx, topY); ctx.lineTo(cx, H); ctx.stroke();
      ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - HALF, HOG); ctx.lineTo(cx + HALF, HOG); ctx.stroke();
      T('hog', cx - HALF + 18, HOG - 8, 10, 'rgba(211,47,47,0.8)');
      // stenen
      for (const s of stones) if (!s.gone) stone(s.x, s.y, s.team);
      if (phase === 'aim') {
        stone(cx, startY, 'p');
        ctx.strokeStyle = 'rgba(229,57,53,0.8)'; ctx.lineWidth = 2; ctx.setLineDash([8, 7]);
        const dx = aimX - cx, dy = BY - startY, k = (startY - topY) / -dy;
        ctx.beginPath(); ctx.moveTo(cx, startY); ctx.lineTo(cx + dx * k, topY); ctx.stroke(); ctx.setLineDash([]);
      } else if (phase === 'cpu') stone(cx, startY, 'c');
      // krachtmeter
      const mx = cx - 100, my = H - 24, mw = 200;
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(mx - 3, my - 3, mw + 6, 16);
      const ideal = (Math.sqrt(2 * A * (startY - BY)) - 90) / 190;
      ctx.fillStyle = '#c62828'; ctx.fillRect(mx, my, mw, 10);
      ctx.fillStyle = '#fbc02d'; ctx.fillRect(mx + mw * (ideal - 0.2), my, mw * 0.4, 10);
      ctx.fillStyle = '#43a047'; ctx.fillRect(mx + mw * (ideal - 0.07), my, mw * 0.14, 10);
      if (phase === 'aim' || charge) { const p = power(); ctx.fillStyle = '#fff'; ctx.fillRect(mx + mw * p - 2, my - 5, 4, 20); }
      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, 34);
      T('Jij 🔴 ' + (MAXN / 2 - Math.ceil(thrown / 2)) + ' over', 58, 17, 13, '#fff');
      T('🟡 ' + (MAXN / 2 - Math.floor(thrown / 2)) + ' over', W - 48, 17, 13, '#fff');
      const st = standing();
      T(st.team ? (st.team === 'p' ? 'Jij voor: ' : 'Computer voor: ') + st.pts : 'Huis leeg', cx, 17, 13, '#ffeb3b');
      if (phase === 'aim' && !charge && thrown === 0) T('Richt met je vinger. Houd vast voor kracht.', cx, H * 0.5, 14, '#0d47a1');
      if (phase === 'slide' && cur && cur.team === 'p') T('Tik om te vegen!', cx, H * 0.58, 16, '#0d47a1');
      if (msgT > 0) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, H * 0.45 - 26, W, 52); T(msg, cx, H * 0.45, msg.length > 14 ? 24 : 30, '#ffeb3b'); }
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
        host.removeEventListener('pointerdown', pd); host.removeEventListener('pointermove', pm);
        host.removeEventListener('pointerup', pu); host.removeEventListener('pointercancel', pc);
        window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      },
    };
  },
};
