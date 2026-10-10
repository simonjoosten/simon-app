// Beatblokken – ritmespel met zelf gegenereerde muziek (WebAudio). Blokjes volgen exact de stap-sequencer.
const SONGS = [
  { name: 'Zonnige Start', emoji: '🌞', bpm: 100, root: 60, scale: [0, 2, 4, 7, 9], prog: [0, -3, -5, -7], lead: 'triangle', bassWave: 'sine', hue: 45,
    kick: 'x.......x.x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', bass: 'x.....x.x.....x.', seed: 11 },
  { name: 'Disco Dans', emoji: '🪩', bpm: 120, root: 57, scale: [0, 3, 5, 7, 10], prog: [0, -2, -4, -5], lead: 'square', bassWave: 'sawtooth', hue: 310,
    kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.', bass: 'x.xx.x.xx.xx.x.x', seed: 22 },
  { name: 'Turbo Techno', emoji: '🤖', bpm: 140, root: 52, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 0, -4, -2], lead: 'sawtooth', bassWave: 'square', hue: 190,
    kick: 'x...x...x...x...', snare: '....x.......x..x', hat: 'x.x.x.x.x.x.x.xx', bass: '.x.x.x.x.x.x.x.x', seed: 33 },
  { name: 'Raket Rave', emoji: '🚀', bpm: 160, root: 50, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 3, -2, 5], lead: 'super', bassWave: 'sawtooth', hue: 0,
    kick: 'x..x..x...x.x...', snare: '....x..x....x...', hat: 'xxxxxxxxxxxxxxxx', bass: 'x..xx.x.x..xx.x.', seed: 44 },
];
const DIFFS = [
  { name: 'Makkelijk', approachMul: 1.15, perfect: 0.085, good: 0.17 },
  { name: 'Normaal', approachMul: 1.0, perfect: 0.07, good: 0.15 },
  { name: 'Moeilijk', approachMul: 0.9, perfect: 0.06, good: 0.13 },
];
const BARS = 20, SPB = 16;
const LANE_COLS = ['#ff4d6d', '#ffd166', '#4cc9f0', '#80ed99'];
const KEYS = { d: 0, f: 1, j: 2, k: 3 };

function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Bouwt de stap-sequencer: een rij events, gedeeld door geluid en blokjes.
function buildSong(song) {
  const rnd = mulberry(song.seed);
  const sc = song.scale, nS = sc.length;
  const degMidi = (d) => { const oct = Math.floor(d / nS); return song.root + 12 + sc[((d % nS) + nS) % nS] + 12 * oct; };
  // 3 motieven van 1 maat, volgorde A B A C
  const motifs = [];
  for (let m = 0; m < 3; m++) {
    const bar = new Array(SPB).fill(null);
    let deg = 2 + Math.floor(rnd() * 3);
    for (let s = 0; s < SPB; s++) {
      const strong = s % 4 === 0, off8 = s % 2 === 0;
      const p = strong ? 0.75 : off8 ? 0.45 : 0.18;
      const r = rnd();
      bar[s] = r < p ? { deg: (deg += Math.floor(rnd() * 5) - 2), rich: (strong ? 0 : off8 ? 0.3 : 0.6) + rnd() * 0.4 } : null;
      if (deg < 0) deg = 1; if (deg > nS + 3) deg = nS;
    }
    bar[0] = bar[0] || { deg, rich: 0 };
    motifs.push(bar);
  }
  const order = [0, 1, 0, 2];
  const ev = [];
  for (let b = 0; b < BARS; b++) {
    const last = b === BARS - 1;
    const chord = song.prog[Math.floor(b / 2) % song.prog.length];
    for (let s = 0; s < SPB; s++) {
      const e = { k: false, s: false, h: false, hOpen: false, bass: 0, mel: 0, melDeg: -1, arp: 0, crash: false };
      const hasDrums = true;
      if (hasDrums) {
        e.k = song.kick[s] === 'x';
        e.h = song.hat[s] === 'x' && (b >= 1 || s % 2 === 0);
        if (b >= 2) e.s = song.snare[s] === 'x';
        if (b >= 12 && b < 14 && b % 2 === 1 && s >= 12) e.s = true; // vulletje
        if (b >= 8 && s % 8 === 6) e.hOpen = true;
      }
      if (b >= 2 && song.bass[s] === 'x') e.bass = mf(song.root - 12 + chord + (s === 14 && b >= 8 ? 12 : 0));
      if (b >= 4) {
        const n = motifs[order[b % 4]][s];
        const richness = b >= 16 ? 1 : b >= 10 ? 0.75 : b >= 6 ? 0.55 : 0.35;
        if (n && (n.rich <= richness + 0.2)) { e.mel = mf(degMidi(n.deg + (b >= 12 && b % 4 === 3 ? 2 : 0)) + chord); e.melDeg = n.deg; }
      }
      if (b >= 8 && s % 2 === 1 && !e.mel) e.arp = mf(degMidi(((s >> 1) + b) % nS + nS) + chord) * (b >= 16 ? 2 : 1) * 0.5;
      if (b === 0 && s === 0) e.crash = true;
      if (last && s >= 8) { e.k = s === 8 || s === 12; e.mel = 0; e.bass = 0; e.arp = 0; }
      ev.push(e);
    }
  }
  return ev;
}

// Kies uit de events welke een blokje worden.
function buildBlocks(ev, song, diff, lanes, stepDur) {
  const blocks = [];
  const lastT = [-9, -9, -9, -9];
  const mx = diff === 2 ? 2 : 1;
  const minGap = [0.3, 0.2, 0.15][diff];
  for (let i = 0; i < ev.length; i++) {
    const e = ev[i], s = i % SPB, t = i * stepDur;
    if (i >= ev.length - 6) break;
    const cand = [];
    const quarter = s % 4 === 0, eighth = s % 2 === 0;
    const okStep = diff === 0 ? quarter : diff === 1 ? eighth || !!e.mel : true;
    if (!okStep) continue;
    if (e.mel) {
      const hi = e.melDeg >= Math.ceil(song.scale.length / 2) + 1;
      cand.push(lanes === 4 ? (hi ? 3 : 2) : 2);
    }
    if (e.s) cand.push(1);
    if (e.k) cand.push(0);
    if (diff === 2 && e.bass && !e.k) cand.push(lanes === 4 ? 2 : 0);
    if (diff === 2 && e.mel && e.k && lanes === 4) cand.push(0);
    let n = 0;
    const used = {};
    for (const ln0 of cand) {
      if (n >= mx) break;
      const ln = Math.min(ln0, lanes - 1);
      if (used[ln] || t - lastT[ln] < minGap) continue;
      used[ln] = 1; n++; lastT[ln] = t;
      blocks.push({ t, lane: ln, done: false, res: 0, step: i });
    }
  }
  return blocks;
}

export default {
  id: 'beatblokken',
  name: 'Beatblokken',
  emoji: '🎵',
  hint: 'Kies een nummer en tik de blokjes op de maat (of toets D F J K)',
  create(host, api) {
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    host.style.touchAction = 'none';
    host.style.userSelect = 'none';
    const cv = document.createElement('canvas');
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.cssText = 'width:100%;height:100%;display:block;touch-action:none';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);

    const LANES = W < 340 ? 3 : 4;
    const LW = W / LANES;
    const HY = H * 0.8;
    const TOPY = -30;

    let alive = true, raf = 0, ended = false, endTimer = 0, schedTimer = 0;
    let state = 'menu';
    let selSong = 0, selDiff = 1;

    // ---------- audio ----------
    let ac = null, master = null, noiseBuf = null;
    function ensureAudio() {
      try {
        if (!ac) {
          const C = window.AudioContext || window.webkitAudioContext;
          if (!C) return;
          ac = new C();
          master = ac.createGain(); master.gain.value = 0.75;
          let out = master;
          if (ac.createDynamicsCompressor) { const comp = ac.createDynamicsCompressor(); master.connect(comp); comp.connect(ac.destination); out = comp; } else master.connect(ac.destination);
          noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
          const d = noiseBuf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        }
        if (ac.state === 'suspended') { const p = ac.resume(); if (p && p.catch) p.catch(() => {}); }
      } catch (e) { ac = null; }
    }
    const audioOn = () => !!ac && ac.state === 'running';
    function env(g, t, a, peak, dur) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, a + 0.02));
    }
    function vKick(t) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
      env(g, t, 0.003, 1, 0.32);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.36);
    }
    function vNoise(t, hp, vol, dur) {
      const s = ac.createBufferSource(); s.buffer = noiseBuf;
      const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
      const g = ac.createGain(); env(g, t, 0.002, vol, dur);
      s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
    }
    function vSnare(t) {
      vNoise(t, 1600, 0.5, 0.18);
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(130, t + 0.08);
      env(g, t, 0.002, 0.35, 0.12); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.15);
    }
    function vTone(t, f, dur, type, vol, cutoff) {
      const g = ac.createGain(); const lp = ac.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = cutoff;
      env(g, t, 0.008, vol, dur);
      lp.connect(g); g.connect(master);
      const types = type === 'super' ? ['sawtooth', 'sawtooth'] : [type];
      types.forEach((ty, i) => {
        const o = ac.createOscillator(); o.type = ty; o.frequency.value = f;
        if (type === 'super') o.detune.value = i ? 9 : -9;
        o.connect(lp); o.start(t); o.stop(t + dur + 0.05);
      });
    }
    function playStep(i, t) {
      const e = ev[i], sg = SONGS[selSong], sd = stepDur;
      if (e.crash) vNoise(t, 5000, 0.25, 0.6);
      if (e.k) vKick(t);
      if (e.s) vSnare(t);
      if (e.h) vNoise(t, 7500, e.hOpen ? 0.14 : 0.1, e.hOpen ? 0.16 : 0.04);
      else if (e.hOpen) vNoise(t, 7000, 0.14, 0.16);
      if (e.bass) vTone(t, e.bass, sd * 1.8, sg.bassWave, sg.bassWave === 'sine' ? 0.55 : 0.28, sg.bassWave === 'sine' ? 600 : 420);
      if (e.mel) vTone(t, e.mel, sd * 2.2, sg.lead, 0.15, 2800);
      if (e.arp) vTone(t, e.arp, sd * 0.9, 'sine', 0.1, 3000);
    }
    function sfxMiss() {
      if (!audioOn()) return;
      try { const t = ac.currentTime; const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.18); env(g, t, 0.005, 0.18, 0.2); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.22); } catch (e) { /* stil */ }
    }
    function sfxHit(perfect, lane) {
      if (!audioOn()) return;
      try { const t = ac.currentTime; vTone(t, mf(84 + lane * 3 + (perfect ? 7 : 0)), 0.12, 'sine', 0.12, 5000); } catch (e) { /* stil */ }
    }

    // ---------- spelstaat ----------
    let ev = [], blocks = [], stepDur = 0.15, approach = 1.5, totalT = 0;
    let t0 = 0, songT = -2, nextStep = 0, visStep = -1, firstActive = 0;
    let score = 0, combo = 0, maxCombo = 0, life = 100, perfects = 0, goods = 0, misses = 0;
    let pulse = 0, beatPulse = 0, shake = 0, flash = 0, flashCol = '#fff';
    let parts = [], floats = [], laneFlash = new Array(LANES).fill(0);
    let diffCfg = DIFFS[1];
    const LEAD = 2.0;

    function startSong() {
      ensureAudio();
      const sg = SONGS[selSong];
      diffCfg = DIFFS[selDiff];
      ev = buildSong(sg);
      stepDur = 60 / sg.bpm / 4;
      approach = 3 * (60 / sg.bpm) * diffCfg.approachMul;
      approach = Math.max(1.0, Math.min(2.0, approach));
      blocks = buildBlocks(ev, sg, selDiff, LANES, stepDur);
      totalT = ev.length * stepDur;
      score = 0; combo = 0; maxCombo = 0; life = 100; perfects = goods = misses = 0;
      pulse = beatPulse = shake = flash = 0;
      parts = []; floats = []; laneFlash.fill(0);
      nextStep = 0; visStep = -1; firstActive = 0;
      t0 = performance.now();
      songT = -Math.max(LEAD, approach + 0.3);
      songOffset = songT;
      state = 'play';
      api.score(0);
      if (schedTimer) clearInterval(schedTimer);
      schedTimer = setInterval(schedule, 30);
    }
    let songOffset = -2;

    function schedule() {
      if (!alive || state !== 'play' || !audioOn()) return;
      try {
        const now = ac.currentTime;
        while (nextStep < ev.length) {
          const dt = nextStep * stepDur - songT;
          if (dt > 0.2) break;
          const at = now + dt;
          if (at >= now - 0.005) playStep(nextStep, Math.max(at, now));
          nextStep++;
        }
      } catch (e) { /* geluid mislukt, spel loopt door */ }
    }

    function burst(x, y, col, n, spd) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = (0.3 + Math.random()) * spd;
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - spd * 0.3, life: 0.5 + Math.random() * 0.4, max: 0.9, col, r: 2 + Math.random() * 3 });
      }
    }
    function addFloat(x, y, text, col) { floats.push({ x, y, text, col, life: 0.7 }); }

    function mult() { return 1 + Math.min(3, Math.floor(combo / 10)); }

    function hitLane(lane) {
      if (state !== 'play' || ended) return;
      laneFlash[lane] = 1;
      let best = null, bd = 9;
      for (let i = firstActive; i < blocks.length; i++) {
        const b = blocks[i];
        if (b.t - songT > diffCfg.good + 0.02) break;
        if (b.done || b.lane !== lane) continue;
        const d = Math.abs(b.t - songT);
        if (d <= diffCfg.good && d < bd) { bd = d; best = b; }
      }
      if (!best) return;
      best.done = true;
      const cx = lane * LW + LW / 2;
      if (bd <= diffCfg.perfect) {
        perfects++; combo++;
        score += 100 * mult();
        life = Math.min(100, life + 2);
        addFloat(cx, HY - 40, 'PERFECT!', '#fff176');
        burst(cx, HY, LANE_COLS[lane], 16, 220);
        flash = 0.35; flashCol = LANE_COLS[lane]; shake = Math.max(shake, 5);
        best.res = 2;
      } else {
        goods++; combo++;
        score += 50 * mult();
        life = Math.min(100, life + 1);
        addFloat(cx, HY - 40, 'Goed', '#9be7ff');
        burst(cx, HY, LANE_COLS[lane], 8, 150);
        shake = Math.max(shake, 2.5);
        best.res = 1;
      }
      if (combo > maxCombo) maxCombo = combo;
      if (combo > 0 && combo % 10 === 0) { addFloat(W / 2, H * 0.4, 'x' + mult() + ' multiplier!', '#ffb703'); flash = 0.5; flashCol = '#ffb703'; }
      sfxHit(bd <= diffCfg.perfect, lane);
      api.score(Math.round(score));
    }

    function missBlock(b) {
      b.done = true; b.res = -1;
      misses++; combo = 0;
      life -= 12;
      const cx = b.lane * LW + LW / 2;
      addFloat(cx, HY - 40, 'Mis', '#ff6b6b');
      burst(cx, HY + 10, '#777', 6, 90);
      shake = Math.max(shake, 6);
      flash = 0.3; flashCol = '#ff3b3b';
      sfxMiss();
      if (life <= 0) { life = 0; finish(false); }
    }

    function finish(completed) {
      if (ended) return;
      ended = true; state = 'done';
      if (schedTimer) { clearInterval(schedTimer); schedTimer = 0; }
      if (completed) { score += Math.round(life * 5); addFloat(W / 2, H * 0.4, 'Nummer uit!', '#80ed99'); }
      else addFloat(W / 2, H * 0.4, 'Energie op!', '#ff6b6b');
      api.score(Math.round(score));
      const fin = Math.round(score);
      endTimer = setTimeout(() => { if (alive) api.end(fin); }, 1500);
    }

    // ---------- invoer ----------
    function toLocal(e) {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (W / (r.width || W)), y: (e.clientY - r.top) * (H / (r.height || H)) };
    }
    // menu-indeling
    const M = {};
    (function layout() {
      M.top = H * 0.14; M.cardH = H * 0.115; M.gap = H * 0.013;
      M.dy = M.top + 4 * (M.cardH + M.gap) + H * 0.01; M.dh = H * 0.07;
      M.sy = M.dy + M.dh + H * 0.03; M.sh = H * 0.09;
    })();
    function inR(p, x, y, w, h) { return p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h; }
    function onDown(e) {
      e.preventDefault();
      ensureAudio();
      const p = toLocal(e);
      if (state === 'menu') {
        for (let i = 0; i < 4; i++) if (inR(p, 14, M.top + i * (M.cardH + M.gap), W - 28, M.cardH)) { selSong = i; return; }
        const dw = (W - 28 - 16) / 3;
        for (let i = 0; i < 3; i++) if (inR(p, 14 + i * (dw + 8), M.dy, dw, M.dh)) { selDiff = i; return; }
        if (inR(p, 14, M.sy, W - 28, M.sh)) startSong();
      } else if (state === 'play') {
        hitLane(Math.max(0, Math.min(LANES - 1, Math.floor(p.x / LW))));
      }
    }
    function onKey(e) {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = (e.key || '').toLowerCase();
      if (state === 'menu') {
        if (k === 'arrowup') { selSong = (selSong + 3) % 4; e.preventDefault(); }
        else if (k === 'arrowdown') { selSong = (selSong + 1) % 4; e.preventDefault(); }
        else if (k === 'arrowleft') { selDiff = (selDiff + 2) % 3; e.preventDefault(); }
        else if (k === 'arrowright') { selDiff = (selDiff + 1) % 3; e.preventDefault(); }
        else if (k === 'enter' || k === ' ') { e.preventDefault(); ensureAudio(); startSong(); }
      } else if (state === 'play' && k in KEYS) {
        e.preventDefault();
        ensureAudio();
        hitLane(Math.min(KEYS[k], LANES - 1));
      }
    }
    cv.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);

    // ---------- update ----------
    let last = performance.now();
    function update(dt) {
      if (state === 'play' || state === 'done') {
        if (state === 'play') {
          songT = songOffset + (performance.now() - t0) / 1000;
          const si = Math.floor(songT / stepDur);
          while (visStep < si && visStep < ev.length - 1) {
            visStep++;
            if (visStep >= 0) {
              const e = ev[visStep];
              if (e.k) pulse = 1;
              if (visStep % 4 === 0) beatPulse = 1;
            }
          }
          // missers
          for (let i = firstActive; i < blocks.length; i++) {
            const b = blocks[i];
            if (b.t > songT) break;
            if (!b.done && songT > b.t + diffCfg.good && state === 'play') missBlock(b);
          }
          while (firstActive < blocks.length && blocks[firstActive].done) firstActive++;
          if (state === 'play' && songT > totalT + 0.3) {
            for (let i = firstActive; i < blocks.length; i++) if (!blocks[i].done) { blocks[i].done = true; }
            finish(true);
          }
        }
        pulse = Math.max(0, pulse - dt * 4.5);
        beatPulse = Math.max(0, beatPulse - dt * 5);
        shake = Math.max(0, shake - dt * 25);
        flash = Math.max(0, flash - dt * 3);
        for (let i = 0; i < LANES; i++) laneFlash[i] = Math.max(0, laneFlash[i] - dt * 6);
      }
      for (const p of parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; }
      parts = parts.filter((p) => p.life > 0);
      for (const f of floats) { f.life -= dt; f.y -= 40 * dt; }
      floats = floats.filter((f) => f.life > 0);
    }

    // ---------- tekenen ----------
    function rr(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    function drawMenu(time) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1b1034'); g.addColorStop(1, '#0b0f24');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff'; ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillText('🎵 Beatblokken', W / 2, M.top * 0.5);
      ctx.fillStyle = '#9aa4d6'; ctx.font = '13px system-ui, sans-serif';
      ctx.fillText('Kies een nummer', W / 2, M.top * 0.82);
      for (let i = 0; i < 4; i++) {
        const s = SONGS[i], y = M.top + i * (M.cardH + M.gap), sel = i === selSong;
        rr(14, y, W - 28, M.cardH, 14);
        ctx.fillStyle = sel ? `hsla(${s.hue},70%,45%,0.9)` : 'rgba(255,255,255,0.07)'; ctx.fill();
        ctx.lineWidth = sel ? 3 : 1; ctx.strokeStyle = sel ? '#fff' : 'rgba(255,255,255,0.15)'; ctx.stroke();
        ctx.font = (M.cardH * 0.5) + 'px serif'; ctx.textAlign = 'center';
        ctx.fillText(s.emoji, 44, y + M.cardH / 2);
        ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = 'bold 17px system-ui, sans-serif';
        ctx.fillText(s.name, 76, y + M.cardH * 0.36);
        ctx.fillStyle = sel ? '#fff' : '#9aa4d6'; ctx.font = '13px system-ui, sans-serif';
        ctx.fillText(s.bpm + ' bpm', 76, y + M.cardH * 0.7);
        // mini equalizer
        for (let b = 0; b < 5; b++) {
          const hh = (0.3 + 0.7 * Math.abs(Math.sin(time * (s.bpm / 60) * 1.5 + b * 1.3))) * M.cardH * 0.5;
          ctx.fillStyle = sel ? '#fff' : 'rgba(255,255,255,0.3)';
          ctx.fillRect(W - 28 - 40 + b * 8, y + M.cardH / 2 + M.cardH * 0.25 - hh, 5, hh);
        }
      }
      const dw = (W - 28 - 16) / 3;
      for (let i = 0; i < 3; i++) {
        const x = 14 + i * (dw + 8), sel = i === selDiff;
        rr(x, M.dy, dw, M.dh, 12);
        ctx.fillStyle = sel ? '#ffb703' : 'rgba(255,255,255,0.08)'; ctx.fill();
        ctx.textAlign = 'center'; ctx.fillStyle = sel ? '#1b1034' : '#d6dcff'; ctx.font = 'bold 14px system-ui, sans-serif';
        ctx.fillText(DIFFS[i].name, x + dw / 2, M.dy + M.dh / 2);
      }
      const pu = 1 + Math.sin(time * 5) * 0.02;
      ctx.save(); ctx.translate(W / 2, M.sy + M.sh / 2); ctx.scale(pu, pu);
      rr(-(W - 28) / 2, -M.sh / 2, W - 28, M.sh, 18);
      ctx.fillStyle = '#80ed99'; ctx.fill();
      ctx.fillStyle = '#10321c'; ctx.font = 'bold 22px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('▶ Start', 0, 1);
      ctx.restore();
      ctx.fillStyle = '#7f89bd'; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(LANES === 4 ? 'Tik in de baan of toets D F J K' : 'Tik in de baan of toets D F J', W / 2, H - 14);
    }
    function drawPlay() {
      const sg = SONGS[selSong];
      ctx.save();
      if (shake > 0.1) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      const bounce = beatPulse * 3;
      ctx.translate(0, bounce);
      // achtergrond
      ctx.fillStyle = `hsl(${sg.hue},45%,${7 + pulse * 7}%)`;
      ctx.fillRect(-10, -10, W + 20, H + 20);
      const rg = ctx.createRadialGradient(W / 2, HY, 10, W / 2, HY, H * 0.7);
      rg.addColorStop(0, `hsla(${sg.hue},80%,55%,${0.12 + pulse * 0.35})`); rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg; ctx.fillRect(-10, -10, W + 20, H + 20);
      // banen
      for (let i = 0; i < LANES; i++) {
        const x = i * LW;
        ctx.fillStyle = `rgba(255,255,255,${0.03 + laneFlash[i] * 0.12})`; ctx.fillRect(x, 0, LW, H);
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x, 0, 1, H);
      }
      // raaklijn / pads
      for (let i = 0; i < LANES; i++) {
        const cx = i * LW + LW / 2, r = LW / 2 - 7;
        rr(cx - r, HY - 16, r * 2, 32, 12);
        ctx.fillStyle = LANE_COLS[i]; ctx.globalAlpha = 0.25 + laneFlash[i] * 0.6 + pulse * 0.1; ctx.fill(); ctx.globalAlpha = 1;
        ctx.lineWidth = 2; ctx.strokeStyle = LANE_COLS[i]; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = 'bold 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(['D', 'F', 'J', 'K'][i], cx, HY + 34);
      }
      // blokjes
      const bw = LW - 14, bh = 30;
      for (let i = firstActive; i < blocks.length; i++) {
        const b = blocks[i];
        if (b.t - songT > approach + 0.1) break;
        if (b.done) continue;
        const y = HY - ((b.t - songT) / approach) * (HY - TOPY);
        const cx = b.lane * LW + LW / 2;
        const sc = 1 + pulse * 0.06;
        ctx.save(); ctx.translate(cx, y); ctx.scale(sc, sc);
        ctx.shadowColor = LANE_COLS[b.lane]; ctx.shadowBlur = 10;
        rr(-bw / 2, -bh / 2, bw, bh, 9);
        ctx.fillStyle = LANE_COLS[b.lane]; ctx.fill();
        ctx.shadowBlur = 0;
        rr(-bw / 2 + 4, -bh / 2 + 3, bw - 8, bh * 0.35, 5);
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
        ctx.restore();
      }
      // partikels
      for (const p of parts) {
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.col; ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
      }
      ctx.globalAlpha = 1;
      // feedbacktekst
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const f of floats) {
        ctx.globalAlpha = Math.min(1, f.life * 2.5);
        ctx.font = 'bold 20px system-ui, sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.strokeText(f.text, f.x, f.y); ctx.fillStyle = f.col; ctx.fillText(f.text, f.x, f.y);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      // flits
      if (flash > 0) { ctx.globalAlpha = flash * 0.35; ctx.fillStyle = flashCol; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
      // HUD
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText(String(Math.round(score)), 14, 34);
      ctx.textAlign = 'right'; ctx.fillStyle = '#ffb703'; ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText('x' + mult(), W - 14, 34);
      if (combo >= 2) {
        ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,' + (0.55 + beatPulse * 0.4) + ')';
        ctx.font = 'bold ' + (20 + beatPulse * 6) + 'px system-ui, sans-serif';
        ctx.fillText(combo + ' combo', W / 2, 34);
      }
      // levensbalk
      const bx = 14, by = 52, bwid = W - 28;
      rr(bx, by, bwid, 10, 5); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill();
      if (life > 0) { rr(bx, by, Math.max(10, bwid * life / 100), 10, 5); ctx.fillStyle = life > 50 ? '#80ed99' : life > 25 ? '#ffb703' : '#ff4d6d'; ctx.fill(); }
      // voortgang
      const pr = Math.max(0, Math.min(1, songT / totalT));
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, 0, W * pr, 3);
      ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '11px system-ui, sans-serif';
      ctx.fillText(sg.emoji + ' ' + sg.name + ' · ' + DIFFS[selDiff].name + (ac && ac.state !== 'running' ? ' · geluid uit' : ''), 14, 74);
      // aftelling
      if (songT < -0.3 && state === 'play') {
        ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = 'bold 28px system-ui, sans-serif';
        const n = Math.ceil(-songT - (approach > 1 ? 0 : 0));
        if (n <= 3) ctx.fillText(String(n), W / 2, H * 0.4);
        else ctx.fillText('Klaar?', W / 2, H * 0.4);
      }
    }

    function frame(now) {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      try {
        update(dt);
        ctx.clearRect(0, 0, W, H);
        if (state === 'menu') drawMenu(now / 1000); else drawPlay();
      } catch (err) { /* nooit het spel laten crashen */ }
    }
    raf = requestAnimationFrame(frame);

    return {
      destroy() {
        alive = false;
        cancelAnimationFrame(raf);
        if (schedTimer) clearInterval(schedTimer);
        if (endTimer) clearTimeout(endTimer);
        cv.removeEventListener('pointerdown', onDown);
        window.removeEventListener('keydown', onKey);
        try { if (ac) { const p = ac.close(); if (p && p.catch) p.catch(() => {}); } } catch (e) { /* al dicht */ }
        ac = null;
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      },
    };
  },
};
