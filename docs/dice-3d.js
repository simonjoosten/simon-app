// Echte 3D-dobbelstenen op een canvas: d4, d6, d8, d10, d12, d20 (en d100 als twee d10).
// Geometrie wordt berekend (convexe huid), de worp kiest eerst het resultaat en draait dan de steen zó dat dat vlak naar boven kijkt.
// De wiskunde (geometrie, quaternions) is DOM-vrij en getest in tools/test-dice.mjs.

const PHI = (1 + Math.sqrt(5)) / 2, TAU = Math.PI * 2;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export const DIE_TYPES = [4, 6, 8, 10, 12, 20];

function baseVerts(sides) {
  const v = [], P = [1, -1];
  if (sides === 4) return [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
  if (sides === 6) { for (const x of P) for (const y of P) for (const z of P) v.push([x, y, z]); return v; }
  if (sides === 8) { for (const s of P) v.push([s, 0, 0], [0, s, 0], [0, 0, s]); return v; }
  if (sides === 12) {
    for (const x of P) for (const y of P) for (const z of P) v.push([x, y, z]);
    for (const a of P) for (const b of P) v.push([0, a / PHI, b * PHI], [a / PHI, b * PHI, 0], [b * PHI, 0, a / PHI]);
    return v;
  }
  if (sides === 20) { for (const a of P) for (const b of P) v.push([0, a, b * PHI], [a, b * PHI, 0], [b * PHI, 0, a]); return v; }
  if (sides === 10) { // vijfhoekige trapezohedron: ring met wisselende hoogte + twee toppen, toppen zó dat de vlakken vlak zijn
    const a = 0.18, ring = []; for (let k = 0; k < 10; k++) { const ang = k * TAU / 10; ring.push([Math.cos(ang), Math.sin(ang), k % 2 ? -a : a]); }
    const n = norm(cross(sub(ring[2], ring[0]), sub(ring[1], ring[0]))), c = dot(n, ring[0]) / n[2];   // vlak door ring[0..2] snijdt de as op z = c
    return [...ring, [0, 0, c], [0, 0, -c]];
  }
  return [];
}

// convexe huid: elk vlak = alle punten op een steunvlak; geeft vlakken met hoekpunten tegen de klok in (van buiten gezien)
function hull(V) {
  const faces = [], eps = 1e-6, centroid = V.reduce((s, p) => add(s, p), [0, 0, 0]).map((x) => x / V.length);
  for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) for (let k = j + 1; k < V.length; k++) {
    let n = cross(sub(V[j], V[i]), sub(V[k], V[i])); if (len(n) < 1e-9) continue; n = norm(n);
    let d = dot(n, V[i]), pos = 0, neg = 0;
    V.forEach((p) => { const e = dot(n, p) - d; if (e > eps) pos++; else if (e < -eps) neg++; });
    if (pos && neg) continue;
    if (neg === 0) { n = scale(n, -1); d = -d; }   // normaal naar buiten
    if (dot(n, sub(V[i], centroid)) < 0) { n = scale(n, -1); d = -d; }
    const idx = V.map((p, q) => (Math.abs(dot(n, p) - d) < eps ? q : -1)).filter((q) => q >= 0);
    const key = idx.join(','); if (faces.some((f) => f.key === key)) continue;
    const c = idx.reduce((s, q) => add(s, V[q]), [0, 0, 0]).map((x) => x / idx.length);
    const e1 = norm(sub(V[idx[0]], c)), e2 = cross(n, e1);
    idx.sort((p, q) => Math.atan2(dot(sub(V[p], c), e2), dot(sub(V[p], c), e1)) - Math.atan2(dot(sub(V[q], c), e2), dot(sub(V[q], c), e1)));
    faces.push({ key, idx, normal: n, center: c });
  }
  return faces;
}

const cache = new Map();
// { verts, faces:[{idx, normal, center, value, up, right, r}] } met de omgeschreven bol = 1
export function geometry(sides) {
  if (cache.has(sides)) return cache.get(sides);
  let V = baseVerts(sides); const R = Math.max(...V.map(len)); V = V.map((p) => scale(p, 1 / R));
  const faces = hull(V);
  // waarden: tegenover elkaar liggende vlakken tellen op tot sides+1 (tetra: gewoon 1..4)
  const order = faces.map((f, i) => i).sort((a, b) => (faces[b].center[2] - faces[a].center[2]) || (Math.atan2(faces[a].center[1], faces[a].center[0]) - Math.atan2(faces[b].center[1], faces[b].center[0])));
  let next = 1; const done = new Set();
  order.forEach((i) => {
    if (done.has(i)) return; faces[i].value = next; done.add(i);
    if (sides !== 4) { const o = faces.findIndex((f, q) => q !== i && !done.has(q) && dot(f.normal, faces[i].normal) < -0.999); if (o >= 0) { faces[o].value = sides + 1 - next; done.add(o); } }
    next++;
  });
  if (sides === 4) faces.forEach((f, q) => { f.value = q + 1; });
  faces.forEach((f) => {
    const mid = f.center; let up = sub(V[f.idx[0]], mid); up = norm(sub(up, scale(f.normal, dot(up, f.normal))));
    if (sides === 6) { const ax = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((a) => [a, Math.abs(dot(a, f.normal))]).sort((a, b) => a[1] - b[1])[0][0]; up = norm(sub(ax, scale(f.normal, dot(ax, f.normal)))); }
    f.up = up; f.right = cross(up, f.normal);
    f.r = Math.min(...f.idx.map((q, k) => { const a = V[q], b = V[f.idx[(k + 1) % f.idx.length]]; return len(sub(scale(add(a, b), 0.5), mid)); }));   // inkomstraal van het vlak
  });
  const g = { sides, verts: V, faces }; cache.set(sides, g); return g;
}
export const faceOf = (g, value) => g.faces.find((f) => f.value === value);

// ---- quaternions [x,y,z,w] en matrices (rijen) ----
export const qMul = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
export const qAxis = (ax, ang) => { const n = norm(ax), s = Math.sin(ang / 2); return [n[0] * s, n[1] * s, n[2] * s, Math.cos(ang / 2)]; };
export function qNorm(q) { const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return q.map((x) => x / l); }
export function qMat(q) {
  const [x, y, z, w] = qNorm(q);
  return [[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]];
}
export const mulMat = (m, p) => [dot(m[0], p), dot(m[1], p), dot(m[2], p)];
export function matQ(m) { // rotatiematrix -> quaternion
  const t = m[0][0] + m[1][1] + m[2][2]; let q;
  if (t > 0) { const s = Math.sqrt(t + 1) * 2; q = [(m[2][1] - m[1][2]) / s, (m[0][2] - m[2][0]) / s, (m[1][0] - m[0][1]) / s, s / 4]; }
  else if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) { const s = Math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]) * 2; q = [s / 4, (m[0][1] + m[1][0]) / s, (m[0][2] + m[2][0]) / s, (m[2][1] - m[1][2]) / s]; }
  else if (m[1][1] > m[2][2]) { const s = Math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]) * 2; q = [(m[0][1] + m[1][0]) / s, s / 4, (m[1][2] + m[2][1]) / s, (m[0][2] - m[2][0]) / s]; }
  else { const s = Math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]) * 2; q = [(m[0][2] + m[2][0]) / s, (m[1][2] + m[2][1]) / s, s / 4, (m[1][0] - m[0][1]) / s]; }
  return qNorm(q);
}
// oriëntatie waarbij vlak `face` naar de kijker wijst (+z) met `up` omhoog (+y), extra gedraaid om z met `spin` radialen
export function orientationFor(face, spin = 0) {
  const m = [face.right, face.up, face.normal];   // rijen = nieuwe assen: p -> (p·right, p·up, p·normal)
  return qMul(qAxis([0, 0, 1], spin), matQ(m));
}
// welk vlak kijkt het meest naar de kijker onder oriëntatie q?
export function topFace(g, q) {
  const m = qMat(q); let best = null, bz = -2;
  g.faces.forEach((f) => { const z = mulMat(m, f.normal)[2]; if (z > bz) { bz = z; best = f; } });
  return best;
}
export const slerp = (a, b, t) => {
  let c = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]; if (c < 0) { b = b.map((x) => -x); c = -c; }
  if (c > 0.9995) return qNorm(a.map((x, i) => x + (b[i] - x) * t));
  const th = Math.acos(c), s = Math.sin(th), w1 = Math.sin((1 - t) * th) / s, w2 = Math.sin(t * th) / s;
  return a.map((x, i) => x * w1 + b[i] * w2);
};

// ---- kleuren ----
export const DIE_COLORS = [
  { id: 'rood', name: 'Rood', c: '#dc2626' }, { id: 'blauw', name: 'Blauw', c: '#2563eb' }, { id: 'groen', name: 'Groen', c: '#16a34a' }, { id: 'paars', name: 'Paars', c: '#7c3aed' },
  { id: 'oranje', name: 'Oranje', c: '#ea580c' }, { id: 'roze', name: 'Roze', c: '#db2777' }, { id: 'zwart', name: 'Zwart', c: '#1f2937' }, { id: 'wit', name: 'Wit', c: '#f3f4f6' }, { id: 'goud', name: 'Goud', c: '#d4a017' },
];
const hex = (c) => { const m = /^#?([0-9a-f]{6})$/i.exec(c); const n = m ? parseInt(m[1], 16) : 0x888888; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mixc = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
export const lum = (c) => { const [r, g, b] = hex(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const LIGHT = norm([-0.45, 0.65, 0.62]);
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

// Tekent één steen. opts: { sides, color, label(value)->tekst, pips, q (0-2), highlight }
export function drawDie(ctx, W, H, q, state, opts) {
  const g = geometry(opts.sides), m = qMat(q), S = Math.min(W, H) * (opts.sides === 6 ? 0.34 : 0.4), cx = W / 2, cy = H / 2 + (state.lift || 0) * -1, base = hex(opts.color);
  const dark = lum(opts.color) < 0.55, ink = dark ? '#ffffff' : '#111827', Q = opts.q == null ? 1 : opts.q;
  const pv = (p) => { const r = mulMat(m, p), k = 1 / (1 - r[2] * 0.12); return [cx + r[0] * S * k, cy - r[1] * S * k, r[2]]; };
  const P = g.verts.map(pv);
  const items = g.faces.map((f) => { const n = mulMat(m, f.normal), c = mulMat(m, f.center); return { f, n, z: c[2] }; }).filter((it) => it.n[2] > 0.02).sort((a, b) => a.z - b.z);
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // schaduw op de tafel
  if (Q >= 0) { const sy = H * 0.9, k = 1 - Math.min(0.5, (state.lift || 0) / (H * 0.5)); ctx.fillStyle = `rgba(0,0,0,${0.28 * k})`; ctx.beginPath(); ctx.ellipse(cx, sy, S * 0.9 * k, S * 0.22 * k, 0, 0, TAU); ctx.fill(); }
  items.forEach(({ f, n }) => {
    const diff = Math.max(0, dot(n, LIGHT)), shade = 0.62 + 0.55 * diff;
    const col = shade < 1 ? mixc(base, [0, 0, 0], 1 - shade) : mixc(base, [255, 255, 255], (shade - 1) * 0.9);
    ctx.beginPath(); f.idx.forEach((q2, k) => { const p = P[q2]; if (k) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath();
    if (Q >= 1) { const c0 = P[f.idx[0]], c1 = P[f.idx[Math.floor(f.idx.length / 2)]], gr = ctx.createLinearGradient(c0[0], c0[1], c1[0], c1[1]); gr.addColorStop(0, rgb(mixc(col, [255, 255, 255], 0.16))); gr.addColorStop(1, rgb(mixc(col, [0, 0, 0], 0.14))); ctx.fillStyle = gr; } else ctx.fillStyle = rgb(col);
    ctx.fill(); ctx.lineWidth = Math.max(1.5, S * 0.035); ctx.strokeStyle = rgb(mixc(base, [0, 0, 0], 0.55)); ctx.stroke();
    if (Q >= 1) { ctx.lineWidth = Math.max(1, S * 0.015); ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.stroke(); }
    // het getal / de stippen in de ruimte van het vlak
    const C = pv(f.center), R = pv(add(f.center, scale(f.right, 0.1))), U = pv(add(f.center, scale(f.up, 0.1)));
    const rx = (R[0] - C[0]) * 10, ry = (R[1] - C[1]) * 10, ux = (U[0] - C[0]) * 10, uy = (U[1] - C[1]) * 10;   // schermvectoren voor lengte 1 in vlak
    ctx.save(); ctx.transform(rx, ry, -ux, -uy, C[0], C[1]);
    ctx.globalAlpha = Math.min(1, 0.35 + n[2] * 0.9); ctx.fillStyle = ink;
    if (opts.sides === 6 && opts.pips !== false) {
      const sp = f.r * 0.55, rad = f.r * 0.17;
      PIPS[f.value].forEach((i) => { ctx.beginPath(); ctx.arc(((i % 3) - 1) * sp, (1 - Math.floor(i / 3)) * -sp, rad, 0, TAU); ctx.fill(); });
    } else {
      const text = opts.label ? opts.label(f.value) : String(f.value), fs = f.r * (text.length > 2 ? 0.8 : text.length > 1 ? 1.0 : 1.25);
      ctx.font = `800 ${fs}px system-ui,-apple-system,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const yoff = opts.sides === 4 || opts.sides === 8 || opts.sides === 20 ? f.r * 0.12 : 0;
      ctx.fillText(text, 0, -yoff); if (/^[69]$/.test(text)) ctx.fillRect(-fs * 0.22, fs * 0.42 - yoff, fs * 0.44, fs * 0.07);
    }
    ctx.restore();
  });
  if (opts.highlight) { ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, S * 1.08, 0, TAU); ctx.stroke(); }
  ctx.restore();
}

// ---- losse animatie-state (zonder DOM; de UI roept step(dt) aan) ----
const ease = (t) => 1 - Math.pow(1 - t, 3);
export function newRoll(sides, value, dur = 1100, rnd = Math.random) {
  const g = geometry(sides), f = faceOf(g, value) || g.faces[0];
  const axis = norm([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5 + 0.1]), turns = (2 + rnd() * 2) * TAU * (rnd() < 0.5 ? -1 : 1);
  return { sides, value, face: f, axis, turns, spin0: (rnd() - 0.5) * 0.8, t: 0, dur };
}
export function rollQuat(r) { // oriëntatie op tijdstip r.t (ms)
  const k = Math.min(1, r.t / r.dur), e = ease(k), fin = orientationFor(r.face, 0);
  const tumble = qAxis(r.axis, r.turns * (1 - e)), tilt = qAxis([0, 0, 1], r.spin0 * (1 - e));
  return qMul(tilt, qMul(tumble, fin));
}
export const rollLift = (r, H) => { const k = Math.min(1, r.t / r.dur); return Math.abs(Math.sin(k * Math.PI * 2.4)) * (1 - k) * H * 0.28; };

// ---- sturing voor een canvas (browser) ----
const live = new Set(); let loopId = 0;
function loop(ts) {
  loopId = 0; let any = false;
  live.forEach((d) => { if (d.tick(ts)) any = true; });
  if (any) loopId = requestAnimationFrame(loop);
}
const kick = () => { if (!loopId) loopId = requestAnimationFrame(loop); };

export function createDie(canvas, opts) {
  const o = { sides: 6, color: '#dc2626', q: 1, ...opts };
  let value = o.value || o.sides, q = orientationFor(faceOf(geometry(o.sides), value), 0), roll = null, last = 0, lift = 0, dirty = true, resolveRoll = null, size = 0;
  const d = {
    get value() { return value; },
    setOpts(n) { Object.assign(o, n); dirty = true; kick(); },
    show(v) { value = v; q = orientationFor(faceOf(geometry(o.sides), v), 0); roll = null; lift = 0; dirty = true; kick(); },
    roll(v, dur = 1100) { value = v; roll = newRoll(o.sides, v, dur); last = 0; if (resolveRoll) resolveRoll(); return new Promise((res) => { resolveRoll = res; kick(); }); },
    draw() {
      const ctx = canvas.getContext('2d'); if (!ctx) return; const dpr = o.dpr || 1, w = canvas.clientWidth || 100, h = canvas.clientHeight || 100;
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      drawDie(ctx, w, h, q, { lift }, { sides: o.sides, color: o.color, q: o.q, label: o.label, pips: o.pips, highlight: o.highlight });
    },
    tick(ts) {
      if (roll) {
        const dt = last ? Math.min(50, ts - last) : 16; last = ts; roll.t += dt; q = rollQuat(roll); lift = rollLift(roll, canvas.clientHeight || 100);
        d.draw();
        if (roll.t >= roll.dur) { roll = null; lift = 0; q = orientationFor(faceOf(geometry(o.sides), value), 0); d.draw(); if (resolveRoll) { const r = resolveRoll; resolveRoll = null; r(); } return false; }
        return true;
      }
      if (dirty) { dirty = false; d.draw(); }
      return false;
    },
    dispose() { live.delete(d); if (resolveRoll) { resolveRoll(); resolveRoll = null; } },
  };
  void size; live.add(d); kick();
  return d;
}
