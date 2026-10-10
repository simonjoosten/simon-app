export default {
  id: 'treinbestuurder', name: 'Treinbestuurder', emoji: '🚆', hint: 'Links = rem, rechts = gas. Stop precies bij het perron en rij op tijd',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#9fd0ff';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    let dead = false, raf = 0, last = 0, ended = false, endT = 0;
    const TX = 170, GY = 400, MAXS = 31, BRAKE = 1.5, ACC = 0.95, ZONE_LEN = 160;
    const NAMES = ['Duinoord', 'Veldzicht', 'Molenbeek', 'Havenkwartier', 'Bloemendaal', 'Zonnehof', 'Beukenrode', 'Kastelen', 'Meerzicht', 'Eindhaven'];
    const rnd = (a, b) => a + Math.random() * (b - a);
    let pos = 0, v = 0, thr = 0, brk = 0, total = 0, score = 0, strikes = 0, stationIdx = 0, tLeg = 0, dwell = 0, state = 'run', leg = null, msg = '', msgT = 0, msgC = '#fff', overT = 0, shake = 0, wheel = 0, clock = 8 * 3600 + 20 * 60, stopsDone = 0, bonusMsg = '', hornT = 0;
    function newLeg() {
      const len = Math.round(rnd(750, 1150) + stationIdx * 25);
      const sigs = [];
      const ns = 1 + (stationIdx > 1 && Math.random() < 0.6 ? 1 : 0);
      for (let i = 0; i < ns; i++) sigs.push({ p: Math.round(len * (0.28 + i * 0.25 + rnd(0, 0.08))), red: Math.random() < 0.65, timer: rnd(7, 11), trig: false, passedRed: false, done: false });
      const zp = Math.round(len * rnd(0.12, 0.2));
      const zones = [{ a: zp, b: zp + ZONE_LEN, lim: 22 - Math.min(5, stationIdx), over: 0, hit: false }, { a: len - 200, b: len + 30, lim: 15, over: 0, hit: false }];
      const sched = len / 17 + 14 + stationIdx * 0.5;
      leg = { S: len, sigs, zones, sched, name: NAMES[stationIdx % NAMES.length] };
      pos = 0; tLeg = 0; state = 'run';
    }
    newLeg();
    api.score(0);
    const keys = {}, ptrs = new Map();
    const toX = e => { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) * W / r.width; };
    const pd = e => { ptrs.set(e.pointerId, toX(e) < W / 2 ? 'b' : 'g'); try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const pm = e => { if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, toX(e) < W / 2 ? 'b' : 'g'); };
    const pu = e => ptrs.delete(e.pointerId);
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm);
    host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pu);
    const kd = e => { keys[e.key] = true; if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault(); }, ku = e => { keys[e.key] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    const say = (s, c) => { msg = s; msgT = 2.2; msgC = c || '#fff'; };
    function strike(why) {
      strikes++; shake = 1; say('Waarschuwing! ' + why, '#ff6b6b');
      if (strikes >= 3) { ended = true; endT = 0; }
    }
    const map = d => d >= 0 ? TX + (W - TX - 14) * (1 - Math.exp(-d / 110)) : TX + d * 3;
    const scl = d => d >= 0 ? 0.45 + 0.55 * Math.exp(-d / 220) : 1;
    function update(dt) {
      total += dt; clock += dt; if (msgT > 0) msgT -= dt; shake = Math.max(0, shake - dt * 3);
      const vals = [...ptrs.values()];
      const G = vals.includes('g') || keys.ArrowRight || keys.ArrowUp || keys.d, B = vals.includes('b') || keys.ArrowLeft || keys.ArrowDown || keys.a;
      thr += ((G && !B ? 1 : 0) - thr) * Math.min(1, dt * 1.8);
      brk += ((B ? 1 : 0) - brk) * Math.min(1, dt * 3.5);
      if (state === 'dwell') {
        v = 0; dwell -= dt; if (dwell <= 0) { stationIdx++; newLeg(); }
        return;
      }
      tLeg += dt;
      let a = ACC * thr * (1 - v / (MAXS + 2)) - BRAKE * brk - 0.015 - 0.0004 * v * v;
      if (v <= 0 && a < 0) a = 0;
      v = Math.max(0, v + a * dt);
      pos += v * dt; wheel += v * dt;
      // signals
      for (const s of leg.sigs) {
        const d = s.p - pos;
        if (!s.trig && d < 380 && s.red) s.trig = true;
        if (s.trig && s.red) { s.timer -= dt; if (s.timer <= 0) { s.red = false; } }
        if (!s.done && d < 0) {
          s.done = true;
          if (s.red) { strike('Door rood sein!'); s.red = false; s.passedRed = true; }
        }
      }
      for (const z of leg.zones) {
        if (pos > z.a && pos < z.b) {
          if (v > z.lim + 1.5) { z.over += dt; if (z.over > 3 && !z.hit) { z.hit = true; strike('Te hard!'); } } else z.over = Math.max(0, z.over - dt);
        } else z.over = 0;
      }
      const e = pos - leg.S;
      if (v < 0.25 && thr < 0.05 && e > -45 && e < 25) {
        // stopped at station
        v = 0; const ae = Math.abs(e);
        let pts, label;
        if (ae <= 2) { pts = 500; label = 'Perfect gestopt!'; } else if (ae <= 5) { pts = 350; label = 'Heel goed'; } else if (ae <= 10) { pts = 200; label = 'Goed'; } else if (ae <= 20) { pts = 100; label = e < 0 ? 'Een beetje kort' : 'Een beetje lang'; } else { pts = 40; label = e < 0 ? 'Te kort' : 'Te ver'; }
        const late = tLeg - leg.sched;
        const tb = Math.max(0, Math.round(300 - Math.max(0, late) * 12));
        score += pts + tb; stopsDone++;
        say(label + '  +' + pts + (tb ? '  Op tijd +' + tb : '  Te laat'), tb ? '#7dff9a' : '#ffd23f');
        state = 'dwell'; dwell = 4;
        api.score(score);
      } else if (e > 25) {
        strike('Station gemist!'); score = Math.max(0, score - 0);
        state = 'dwell'; dwell = 1.5; v = Math.min(v, 5);
      }
      api.score(score);
    }
    const sec = s => { const h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60, ss = Math.floor(s % 60); return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss; };
    function draw() {
      ctx.save();
      if (shake) ctx.translate((Math.random() - 0.5) * 6 * shake, (Math.random() - 0.5) * 6 * shake);
      const sk = ctx.createLinearGradient(0, 0, 0, GY); sk.addColorStop(0, '#6db4f2'); sk.addColorStop(1, '#e6f4ff');
      ctx.fillStyle = sk; ctx.fillRect(-10, 0, W + 20, GY);
      const gp = total0();
      function total0() { return pos + stationIdx * 2000; }
      // far hills
      ctx.fillStyle = '#9ec9a4'; ctx.beginPath(); ctx.moveTo(-10, GY);
      for (let x = -10; x <= W + 10; x += 12) ctx.lineTo(x, GY - 60 - 26 * Math.sin((x + gp * 0.4) * 0.011) - 12 * Math.sin((x + gp * 0.4) * 0.03));
      ctx.lineTo(W + 10, GY); ctx.fill();
      ctx.fillStyle = '#6fb06f'; ctx.beginPath(); ctx.moveTo(-10, GY);
      for (let x = -10; x <= W + 10; x += 12) ctx.lineTo(x, GY - 26 - 14 * Math.sin((x + gp * 1.2) * 0.02 + 1));
      ctx.lineTo(W + 10, GY); ctx.fill();
      // ground / ballast
      ctx.fillStyle = '#5b9c4f'; ctx.fillRect(-10, GY - 8, W + 20, 200);
      ctx.fillStyle = '#8a8478'; ctx.fillRect(-10, GY + 4, W + 20, 22);
      // trees & poles
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      const k0 = Math.floor((pos - 60) / 40);
      for (let k = k0; k < k0 + 14; k++) {
        const d = k * 40 - pos; if (d < -60 || d > 700) continue;
        const x = map(d), s = scl(d), hsh = ((k + stationIdx * 7) * 2654435761 >>> 0) % 7;
        if (hsh < 3) { ctx.font = Math.round(34 * s) + 'px serif'; ctx.fillText(hsh === 0 ? '🌳' : hsh === 1 ? '🌲' : '🏡', x, GY - 6); }
        ctx.fillStyle = '#4a3a2a'; ctx.fillRect(x - 1, GY - 52 * s, 2, 50 * s);
      }
      // platform
      { const x1 = map(leg.S - 45 - pos), x2 = map(leg.S + 10 - pos), s = scl(leg.S - pos);
        if (x2 > -20 && x1 < W + 20) {
          ctx.fillStyle = '#b9b9c4'; ctx.fillRect(x1, GY - 18 * s, x2 - x1, 20 * s);
          ctx.fillStyle = '#8a8a96'; ctx.fillRect(x1, GY - 18 * s, x2 - x1, 3);
          // canopy
          ctx.fillStyle = '#c0392b'; ctx.fillRect(x1 + 6, GY - 66 * s, x2 - x1 - 12, 7 * s);
          ctx.fillStyle = '#555'; for (let i = 0; i < 4; i++) ctx.fillRect(x1 + 10 + i * (x2 - x1 - 24) / 3, GY - 62 * s, 3, 44 * s);
          // stop marker
          const xs = map(leg.S - pos);
          ctx.fillStyle = '#ffd23f'; ctx.fillRect(xs - 2, GY - 52 * s, 4, 34 * s); ctx.fillStyle = '#111'; ctx.fillRect(xs - 9 * s, GY - 52 * s, 18 * s, 12 * s);
          ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.max(8, Math.round(9 * s)) + 'px sans-serif'; ctx.textBaseline = 'middle'; ctx.fillText('STOP', xs, GY - 46 * s); ctx.textBaseline = 'bottom';
          ctx.fillStyle = '#1e56a0'; ctx.fillRect((x1 + x2) / 2 - 38 * s, GY - 48 * s, 76 * s, 14 * s);
          ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.max(8, Math.round(10 * s)) + 'px sans-serif'; ctx.textBaseline = 'middle'; ctx.fillText(leg.name, (x1 + x2) / 2, GY - 41 * s); ctx.textBaseline = 'bottom';
        } }
      // track: sleepers
      ctx.fillStyle = '#5a4630';
      const s0 = Math.floor((pos - 60) / 2) * 2;
      for (let m = s0; m < pos + 520; m += 2) { const d = m - pos, x = map(d); const w = Math.max(1.2, 3 * scl(d)); ctx.fillRect(x - w / 2, GY + 6, w, 9); }
      ctx.fillStyle = '#c8ccd2'; ctx.fillRect(-10, GY + 4, W + 20, 3); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(-10, GY + 14, W + 20, 2);
      // zones signs
      for (const z of leg.zones) {
        for (const [p, show] of [[z.a, true], [z.b, false]]) {
          const d = p - pos; if (d < -40 || d > 700) continue;
          const x = map(d), s = scl(d);
          ctx.fillStyle = '#ccc'; ctx.fillRect(x - 1, GY - 40 * s, 2, 40 * s);
          ctx.fillStyle = show ? '#fff' : '#ddd'; ctx.beginPath(); ctx.arc(x, GY - 48 * s, 12 * s, 0, 7); ctx.fill();
          ctx.lineWidth = Math.max(2, 3 * s); ctx.strokeStyle = show ? '#d62020' : '#888'; ctx.stroke();
          ctx.fillStyle = '#111'; ctx.font = 'bold ' + Math.max(8, Math.round(12 * s)) + 'px sans-serif'; ctx.textBaseline = 'middle';
          ctx.fillText(show ? String(z.lim) : '✓', x, GY - 48 * s); ctx.textBaseline = 'bottom';
        }
      }
      // signals
      for (const sg of leg.sigs) {
        const d = sg.p - pos; if (d < -40 || d > 700) continue;
        const x = map(d), s = scl(d);
        ctx.fillStyle = '#333'; ctx.fillRect(x - 2 * s, GY - 70 * s, 4 * s, 70 * s);
        ctx.fillStyle = '#111'; ctx.fillRect(x - 8 * s, GY - 92 * s, 16 * s, 30 * s);
        const yellow = sg.red && sg.trig && sg.timer < 2.5;
        ctx.fillStyle = sg.red ? (yellow ? '#5a1a1a' : '#ff2b2b') : '#4a1010'; ctx.beginPath(); ctx.arc(x, GY - 85 * s, 5 * s, 0, 7); ctx.fill();
        ctx.fillStyle = yellow ? '#ffd23f' : '#4a4210'; ctx.beginPath(); ctx.arc(x, GY - 77 * s, 0.0001 + 0 * s, 0, 7); ctx.fill();
        ctx.fillStyle = sg.red ? '#2a4a2a' : '#35ff6a'; ctx.beginPath(); ctx.arc(x, GY - 69 * s, 5 * s, 0, 7); ctx.fill();
        if (sg.red) { ctx.fillStyle = 'rgba(255,40,40,.25)'; ctx.beginPath(); ctx.arc(x, GY - 85 * s, 12 * s, 0, 7); ctx.fill(); }
      }
      // train (cars behind, loco at front)
      const wob = Math.sin(wheel * 2) * Math.min(1, v / 10) * 0.8;
      ctx.save(); ctx.translate(0, wob);
      const carCol = ['#1e56a0', '#f2c230'];
      for (let c = 2; c >= 0; c--) {
        const x2 = TX - 6 - c * 100 - (c ? 0 : 0) - 0;
        if (c === 0) continue;
        const x1 = x2 - 96;
        ctx.fillStyle = '#e9e9ef'; ctx.fillRect(x1, GY - 46, 96, 42);
        ctx.fillStyle = carCol[0]; ctx.fillRect(x1, GY - 18, 96, 14);
        ctx.fillStyle = '#7fb7ea'; for (let w = 0; w < 5; w++) ctx.fillRect(x1 + 6 + w * 18, GY - 40, 12, 14);
        ctx.fillStyle = '#222'; ctx.fillRect(x1 + 10, GY - 4, 20, 6); ctx.fillRect(x1 + 66, GY - 4, 20, 6);
      }
      // loco
      ctx.fillStyle = '#e9e9ef'; ctx.beginPath(); ctx.moveTo(TX - 100, GY - 48); ctx.lineTo(TX - 14, GY - 48); ctx.lineTo(TX + 6, GY - 28); ctx.lineTo(TX + 6, GY - 4); ctx.lineTo(TX - 100, GY - 4); ctx.fill();
      ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.moveTo(TX - 100, GY - 20); ctx.lineTo(TX + 6, GY - 20); ctx.lineTo(TX + 6, GY - 4); ctx.lineTo(TX - 100, GY - 4); ctx.fill();
      ctx.fillStyle = '#7fb7ea'; ctx.beginPath(); ctx.moveTo(TX - 40, GY - 42); ctx.lineTo(TX - 18, GY - 42); ctx.lineTo(TX - 2, GY - 28); ctx.lineTo(TX - 40, GY - 28); ctx.fill();
      ctx.fillStyle = '#7fb7ea'; ctx.fillRect(TX - 92, GY - 42, 18, 14); ctx.fillRect(TX - 68, GY - 42, 18, 14);
      ctx.fillStyle = '#fff3a0'; ctx.fillRect(TX + 2, GY - 14, 4, 5);
      ctx.fillStyle = '#222'; for (const wx of [-86, -60, -24, -4]) { ctx.beginPath(); ctx.arc(TX + wx, GY - 2, 5, 0, 7); ctx.fill(); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(TX + wx, GY - 2); ctx.lineTo(TX + wx + Math.cos(wheel) * 5, GY - 2 + Math.sin(wheel) * 5); ctx.stroke(); }
      ctx.restore();
      ctx.restore();
      // HUD top
      ctx.fillStyle = '#16213a'; ctx.fillRect(0, 0, W, 112);
      ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#9ab'; ctx.fillText('Volgend station', 12, 14); ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.fillText(leg.name, 12, 36);
      ctx.font = '12px sans-serif'; ctx.fillStyle = '#9ab'; ctx.fillText('Afstand', 12, 62); ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#ffd23f';
      ctx.fillText(Math.max(0, Math.round(leg.S - pos)) + ' m', 12, 84);
      ctx.textAlign = 'center'; ctx.font = '12px sans-serif'; ctx.fillStyle = '#9ab'; ctx.fillText('Klok', W / 2, 14); ctx.fillStyle = '#fff'; ctx.font = 'bold 18px monospace'; ctx.fillText(sec(clock), W / 2, 36);
      const over = tLeg - leg.sched;
      ctx.font = '12px sans-serif'; ctx.fillStyle = '#9ab'; ctx.fillText('Schema', W / 2, 62);
      ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = over > 0 ? '#ff7d7d' : '#7dff9a';
      ctx.fillText(over > 0 ? '+' + Math.round(over) + 's te laat' : Math.round(-over) + 's over', W / 2, 84);
      ctx.textAlign = 'right'; ctx.font = '12px sans-serif'; ctx.fillStyle = '#9ab'; ctx.fillText('Waarschuwingen', W - 12, 14);
      ctx.font = '20px serif'; ctx.fillStyle = '#fff'; ctx.fillText('❌'.repeat(strikes) + '▫️'.repeat(Math.max(0, 3 - strikes)), W - 12, 38);
      ctx.font = '12px sans-serif'; ctx.fillStyle = '#9ab'; ctx.fillText('Punten', W - 12, 62); ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#ffd23f'; ctx.fillText(String(score), W - 12, 84);
      // route bar
      const bx = 14, bw = W - 28, by = 104;
      ctx.fillStyle = '#2b3b5c'; ctx.fillRect(bx, by, bw, 6);
      const mp = x => bx + bw * Math.max(0, Math.min(1, x / (leg.S + 30)));
      ctx.fillStyle = '#5be07a'; ctx.fillRect(bx, by, mp(pos) - bx, 6);
      for (const sg of leg.sigs) { ctx.fillStyle = sg.red ? '#ff3b3b' : '#35ff6a'; ctx.fillRect(mp(sg.p) - 2, by - 4, 4, 14); }
      for (const z of leg.zones) { ctx.fillStyle = 'rgba(255,200,60,.55)'; ctx.fillRect(mp(z.a), by + 7, mp(z.b) - mp(z.a), 3); }
      ctx.fillStyle = '#fff'; ctx.fillRect(mp(leg.S) - 2, by - 6, 4, 18);
      const bd = v * v / (2 * BRAKE); ctx.fillStyle = '#ff9d3b'; ctx.fillRect(Math.max(bx, mp(pos + bd) - 1.5), by - 6, 3, 18);
      // lower panel
      const py0 = 470;
      ctx.fillStyle = '#16213a'; ctx.fillRect(0, py0 - 4, W, H - py0 + 4);
      // speed
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 44px sans-serif'; ctx.fillText(String(Math.round(v * 3.6)), W / 2, py0 + 34);
      ctx.font = '12px sans-serif'; ctx.fillStyle = '#9ab'; ctx.fillText('km/u', W / 2, py0 + 62);
      let lim = 0; for (const z of leg.zones) if (pos > z.a && pos < z.b) lim = z.lim;
      if (lim) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(W - 46, py0 + 36, 24, 0, 7); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = v > lim + 1.5 ? '#ff2020' : '#d62020'; ctx.stroke(); ctx.fillStyle = '#111'; ctx.font = 'bold 18px sans-serif'; ctx.fillText(String(Math.round(lim * 3.6)), W - 46, py0 + 36); }
      ctx.font = '11px sans-serif'; ctx.fillStyle = '#ff9d3b'; ctx.textAlign = 'left'; ctx.fillText('oranje streepje = remweg', 14, py0 + 20);
      // buttons
      const bt = py0 + 76, bh = H - bt - 12;
      ctx.fillStyle = brk > 0.5 ? '#ff5a4a' : '#b83a30'; ctx.fillRect(12, bt, W / 2 - 18, bh);
      ctx.fillStyle = thr > 0.5 ? '#3fd16b' : '#25903f'; ctx.fillRect(W / 2 + 6, bt, W / 2 - 18, bh);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 26px sans-serif'; ctx.fillText('REM', W / 4, bt + bh / 2 - 6); ctx.fillText('GAS', W * 3 / 4, bt + bh / 2 - 6);
      ctx.font = '11px sans-serif'; ctx.fillText('houd ingedrukt', W / 4, bt + bh / 2 + 16); ctx.fillText('houd ingedrukt', W * 3 / 4, bt + bh / 2 + 16);
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(W / 2 - 3, bt, 6, bh); ctx.fillStyle = '#ffd23f'; ctx.fillRect(W / 2 - 3, bt + bh * (1 - thr), 6, bh * thr);
      if (state === 'dwell') { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 150, W, 56); ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.fillText('🚪 Deuren open – vertrek over ' + Math.ceil(dwell) + 's', W / 2, 178); }
      if (msgT > 0) { ctx.globalAlpha = Math.min(1, msgT); ctx.font = 'bold 17px sans-serif'; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(10, 214, W - 20, 34); ctx.fillStyle = msgC; ctx.fillText(msg, W / 2, 232); ctx.globalAlpha = 1; }
      if (ended) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('Dienst beëindigd', W / 2, H / 2 - 14); ctx.font = '16px sans-serif'; ctx.fillText(stopsDone + ' stations gehaald, ' + score + ' punten', W / 2, H / 2 + 20); }
    }
    function frame(ts) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.max(0.001, Math.min((ts - (last || ts)) / 1000, 0.05)); last = ts;
      if (!ended) update(dt);
      else { endT += dt; if (endT > 2 && endT < 50) { endT = 99; api.end(score); } }
      draw();
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
