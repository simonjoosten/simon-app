export default {
  id: 'appelvanger', name: 'Appelvanger', emoji: '🍎', hint: 'Sleep het mandje: vang appels, mijd rotte en bommen',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = 'linear-gradient(#8fd3ff,#d6f5c4)';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    let dead = false, raf = 0, last = 0, ended = false;
    let bx = W / 2, tx = W / 2, score = 0, lives = 3, t = 0, spawn = 0.6, flash = 0;
    const bw = 76, by = H - 70;
    const items = [], keys = {};
    function toX(e) { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) * W / r.width; }
    let down = false;
    const pd = e => { down = true; tx = toX(e); try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const pm = e => { if (down || e.pointerType === 'mouse') tx = toX(e); };
    const pu = () => { down = false; };
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm);
    host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pu);
    const kd = e => { keys[e.key] = true; }, ku = e => { keys[e.key] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    api.score(0);
    function loseLife() {
      lives--; flash = 0.4;
      if (lives <= 0 && !ended) { ended = true; api.end(score); }
    }
    function frame(ts) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min((ts - (last || ts)) / 1000, 0.05); last = ts;
      if (ended) { draw(); return; }
      t += dt;
      const sp = 180 + Math.min(t * 6, 260);
      if (keys.ArrowLeft || keys.a) tx -= 420 * dt;
      if (keys.ArrowRight || keys.d) tx += 420 * dt;
      tx = Math.max(bw / 2, Math.min(W - bw / 2, tx));
      bx += (tx - bx) * Math.min(1, dt * 18);
      spawn -= dt;
      if (spawn <= 0) {
        spawn = Math.max(0.3, 0.8 - t * 0.008) * (0.7 + Math.random() * 0.6);
        const r = Math.random(), bad = Math.min(0.15 + t * 0.004, 0.4);
        const type = r < bad * 0.55 ? 'bom' : r < bad ? 'rot' : (Math.random() < 0.1 ? 'goud' : 'appel');
        items.push({ x: 20 + Math.random() * (W - 40), y: -20, type, v: sp * (0.8 + Math.random() * 0.5), rot: 0 });
      }
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i]; it.y += it.v * dt; it.rot += dt * 2;
        if (it.y > by - 18 && it.y < by + 22 && Math.abs(it.x - bx) < bw / 2 + 6) {
          if (it.type === 'appel') score += 10; else if (it.type === 'goud') score += 30;
          else loseLife();
          api.score(score); items.splice(i, 1);
        } else if (it.y > H + 20) {
          if (it.type === 'appel' || it.type === 'goud') loseLife();
          items.splice(i, 1);
        }
      }
      if (flash > 0) flash -= dt;
      draw();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '34px serif';
      for (const it of items) {
        const e = it.type === 'appel' ? '🍎' : it.type === 'goud' ? '🍏' : it.type === 'rot' ? '🤢' : '💣';
        ctx.fillText(e, it.x, it.y);
      }
      ctx.font = '60px serif'; ctx.fillText('🧺', bx, by);
      ctx.font = '22px serif'; ctx.textAlign = 'left';
      ctx.fillText('❤️'.repeat(Math.max(0, lives)), 10, 24);
      ctx.textAlign = 'center'; ctx.font = '13px sans-serif'; ctx.fillStyle = '#234';
      ctx.fillText('🍎 +10   🍏 +30   🤢💣 mijden', W / 2, H - 14);
      if (flash > 0) { ctx.fillStyle = 'rgba(255,0,0,' + flash * 0.6 + ')'; ctx.fillRect(0, 0, W, H); }
    }
    raf = requestAnimationFrame(frame);
    return { destroy() {
      dead = true; cancelAnimationFrame(raf);
      host.removeEventListener('pointerdown', pd); host.removeEventListener('pointermove', pm);
      host.removeEventListener('pointerup', pu); host.removeEventListener('pointercancel', pu);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      cv.remove();
    } };
  },
};
