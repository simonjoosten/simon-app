export default {
  id: 'raketlanding',
  name: 'Raketlanding',
  emoji: '🚀',
  hint: 'Houd vast voor stuwkracht (je vinger bepaalt de kant). Land zacht op het platform!',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#050816';
    const dpr = window.devicePixelRatio || 1;
    const W = api.w, H = api.h;
    const k = H / 640;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px`;
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const stars = [];
    for (let i = 0; i < 50; i++) stars.push([Math.random() * W, Math.random() * H * 0.9, Math.random() * 1.5 + 0.5]);
    const groundY = H - 44 * k;
    const RH = 26 * k, RW = 14 * k; // raket hoogte/breedte
    const MAXV_V = 55 * k, MAXV_H = 30 * k;

    let level = 0, landings = 0, score = 0, fuel = 100;
    let x, y, vx, vy, plat, state = 'fly', stateT = 0, thrusting = false, pointerX = null, keys = { thrust: false, l: false, r: false };
    let dead = false, ended = false, raf = 0, last = 0, msg = '';

    function newLanding() {
      const pw = Math.max(48, 120 - level * 10) * k;
      plat = { w: pw, x: pw / 2 + 10 + Math.random() * (W - pw - 20) };
      x = W * (0.15 + Math.random() * 0.7);
      y = 60 * k;
      vx = (Math.random() - 0.5) * 80 * k;
      vy = 0;
      state = 'fly'; stateT = 0;
      msg = '';
    }
    function gravity() { return (55 + Math.min(level, 8) * 7) * k; }

    function setPointer(e) {
      const r = host.getBoundingClientRect();
      pointerX = (e.clientX - r.left) * (W / (r.width || W));
    }
    const onDown = e => { setPointer(e); thrusting = true; };
    const onMove = e => { if (thrusting) setPointer(e); };
    const onUp = () => { thrusting = false; };
    host.addEventListener('pointerdown', onDown);
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerup', onUp);
    host.addEventListener('pointercancel', onUp);
    host.addEventListener('pointerleave', onUp);
    const kd = e => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') { keys.thrust = true; e.preventDefault(); }
      else if (e.key === 'ArrowLeft' || e.key === 'a') keys.l = true;
      else if (e.key === 'ArrowRight' || e.key === 'd') keys.r = true;
    };
    const ku = e => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') keys.thrust = false;
      else if (e.key === 'ArrowLeft' || e.key === 'a') keys.l = false;
      else if (e.key === 'ArrowRight' || e.key === 'd') keys.r = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    let burning = false;
    function update(dt) {
      stateT += dt;
      if (state === 'landed') {
        if (stateT > 1.4) { level++; newLanding(); }
        return;
      }
      if (state === 'crashed') {
        if (stateT > 1.6 && !ended) { ended = true; api.end(score); }
        return;
      }
      const wantThrust = thrusting || keys.thrust;
      burning = wantThrust && fuel > 0;
      let steer = 0;
      if (keys.l) steer -= 1;
      if (keys.r) steer += 1;
      if (thrusting && pointerX !== null && !keys.l && !keys.r) steer = Math.max(-1, Math.min(1, (pointerX - x) / (50 * k)));
      vy += gravity() * dt;
      if (burning) {
        vy -= 150 * k * dt;
        vx += steer * 70 * k * dt;
        fuel = Math.max(0, fuel - 18 * dt);
      }
      x += vx * dt;
      y += vy * dt;
      if (x < RW) { x = RW; vx = Math.abs(vx) * 0.3; }
      if (x > W - RW) { x = W - RW; vx = -Math.abs(vx) * 0.3; }
      if (y < RH) { y = RH; vy = Math.max(vy, 0); }
      if (y + RH / 2 >= groundY) {
        y = groundY - RH / 2;
        const onPlat = Math.abs(x - plat.x) <= plat.w / 2;
        if (onPlat && vy <= MAXV_V && Math.abs(vx) <= MAXV_H) {
          landings++;
          const gain = 100 + Math.round(fuel) * 2;
          score += gain;
          api.score(score);
          msg = `Perfecte landing! +${gain}`;
          fuel = Math.min(100, fuel + 40);
          state = 'landed'; stateT = 0; vx = 0; vy = 0; burning = false;
        } else {
          state = 'crashed'; stateT = 0; burning = false;
          msg = onPlat ? 'Te hard geland!' : 'Naast het platform!';
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#050816';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      for (const s of stars) { ctx.globalAlpha = 0.4 + s[2] / 3; ctx.fillRect(s[0], s[1], s[2], s[2]); }
      ctx.globalAlpha = 1;
      // maanoppervlak
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(0, groundY, W, H - groundY);
      ctx.fillStyle = '#6b7280';
      for (let i = 0; i < W; i += 40 * k) ctx.fillRect(i, groundY, 20 * k, 4 * k);
      // platform
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(plat.x - plat.w / 2, groundY - 6 * k, plat.w, 8 * k);
      ctx.fillStyle = '#bbf7d0';
      ctx.fillRect(plat.x - plat.w / 2, groundY - 6 * k, 6 * k, 8 * k);
      ctx.fillRect(plat.x + plat.w / 2 - 6 * k, groundY - 6 * k, 6 * k, 8 * k);
      // raket
      if (state === 'crashed') {
        ctx.font = `${60 * k}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💥', x, y);
      } else {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.max(-0.5, Math.min(0.5, vx / (120 * k))) * 0.8);
        if (burning) {
          ctx.fillStyle = Math.random() < 0.5 ? '#f97316' : '#facc15';
          ctx.beginPath();
          ctx.moveTo(-RW / 3, RH / 2);
          ctx.lineTo(RW / 3, RH / 2);
          ctx.lineTo(0, RH / 2 + (14 + Math.random() * 12) * k);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(-RW / 2, -RH / 2 + 6 * k, RW, RH - 6 * k);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(-RW / 2, -RH / 2 + 6 * k);
        ctx.lineTo(0, -RH / 2 - 4 * k);
        ctx.lineTo(RW / 2, -RH / 2 + 6 * k);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, -RH / 2 + 12 * k, 3.5 * k, 0, 7);
        ctx.fill();
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 2 * k;
        ctx.beginPath();
        ctx.moveTo(-RW / 2, RH / 2 - 2 * k); ctx.lineTo(-RW / 2 - 5 * k, RH / 2 + 2 * k);
        ctx.moveTo(RW / 2, RH / 2 - 2 * k); ctx.lineTo(RW / 2 + 5 * k, RH / 2 + 2 * k);
        ctx.stroke();
        ctx.restore();
      }
      // HUD
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px system-ui,sans-serif';
      ctx.fillText(`Landingen: ${landings}  Score: ${score}`, 10, 10);
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(10, 34, 110, 10);
      ctx.fillStyle = fuel > 25 ? '#22c55e' : '#ef4444';
      ctx.fillRect(10, 34, 110 * fuel / 100, 10);
      ctx.fillStyle = '#fff';
      ctx.font = '12px system-ui,sans-serif';
      ctx.fillText('⛽ brandstof', 126, 33);
      const vOk = vy <= MAXV_V, hOk = Math.abs(vx) <= MAXV_H;
      ctx.textAlign = 'right';
      ctx.font = 'bold 14px system-ui,sans-serif';
      ctx.fillStyle = vOk ? '#4ade80' : '#f87171';
      ctx.fillText(`↓ ${Math.round(Math.max(0, vy) / k)}`, W - 10, 10);
      ctx.fillStyle = hOk ? '#4ade80' : '#f87171';
      ctx.fillText(`↔ ${Math.round(Math.abs(vx) / k)}`, W - 10, 28);
      if (msg) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = state === 'crashed' ? '#f87171' : '#4ade80';
        ctx.font = 'bold 22px system-ui,sans-serif';
        ctx.fillText(msg, W / 2, H * 0.4);
      }
    }
    function loop(now) {
      if (dead) return;
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      update(dt);
      draw();
      raf = requestAnimationFrame(loop);
    }
    api.score(0);
    newLanding();
    raf = requestAnimationFrame(loop);
    return {
      destroy() {
        dead = true;
        cancelAnimationFrame(raf);
        host.removeEventListener('pointerdown', onDown);
        host.removeEventListener('pointermove', onMove);
        host.removeEventListener('pointerup', onUp);
        host.removeEventListener('pointercancel', onUp);
        host.removeEventListener('pointerleave', onUp);
        window.removeEventListener('keydown', kd);
        window.removeEventListener('keyup', ku);
        canvas.remove();
      },
    };
  },
};
