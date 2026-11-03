// Ronde 4 (Creatief) voor de Emoji-mixer: 8 extra eigen mix-stijlen, een verhaaltje bij elke mix, "Mix van de dag",
// een raad-spel (zonder internet) en een poster van je verzameling. Alles zonder server.
// De tekenfuncties werken op een gewoon 2D-canvas (Safari-vriendelijk: geen filter, geen roundRect).

export const EXTRA_MODES = [
  ['regen', '🌧 Regen'], ['kroon', '👑 Kroon'], ['spiegel', '🪞 Spiegel'], ['duo', '👯 Duo'],
  ['cirkel', '⭕ Cirkel'], ['vonk', '✨ Vonk'], ['stapel', '🧱 Stapel'], ['zoom', '🔍 Zoom'],
];
export const EXTRA_MODE_IDS = EXTRA_MODES.map((m) => m[0]);

const FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
function put(ctx, e, x, y, size, rot = 0, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.font = `${Math.round(size)}px ${FONT}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, 0, size * 0.04); ctx.restore();
}

// Tekent een extra mix-stijl. Geeft true als de stijl bekend was.
export function drawExtraMix(ctx, a, b, mode, s) {
  const c = s / 2;
  switch (mode) {
    case 'regen': put(ctx, a, c, c * 1.1, s * 0.62); for (let i = 0; i < 9; i++) put(ctx, b, s * (0.12 + (i % 5) * 0.19), s * (0.12 + Math.floor(i / 5) * 0.2 + (i % 2) * 0.12), s * 0.2, (i - 4) * 0.1, 0.9); return true;
    case 'kroon': put(ctx, a, c, c * 1.08, s * 0.7); put(ctx, b, c, s * 0.14, s * 0.3, 0); put(ctx, b, s * 0.34, s * 0.19, s * 0.2, -0.3); put(ctx, b, s * 0.66, s * 0.19, s * 0.2, 0.3); return true;
    case 'spiegel': put(ctx, a, c * 0.98, c * 0.66, s * 0.6); ctx.save(); ctx.translate(0, s); ctx.scale(1, -1); put(ctx, b, c, c * 0.66, s * 0.6, 0, 0.55); ctx.restore(); return true;
    case 'duo': put(ctx, a, s * 0.32, c, s * 0.52, -0.12); put(ctx, b, s * 0.68, c, s * 0.52, 0.12); put(ctx, '💞', c, s * 0.2, s * 0.18); return true;
    case 'cirkel': for (let i = 0; i < 8; i++) { const ang = i / 8 * Math.PI * 2; put(ctx, i % 2 ? b : a, c + Math.cos(ang) * s * 0.33, c + Math.sin(ang) * s * 0.33, s * 0.26, ang); } put(ctx, a, c, c, s * 0.3); return true;
    case 'vonk': put(ctx, a, c, c, s * 0.72); put(ctx, b, s * 0.76, s * 0.26, s * 0.32, 0.25); put(ctx, '✨', s * 0.2, s * 0.22, s * 0.2); put(ctx, '✨', s * 0.82, s * 0.8, s * 0.16); put(ctx, '✨', s * 0.16, s * 0.78, s * 0.12); return true;
    case 'stapel': put(ctx, a, c, s * 0.68, s * 0.56); put(ctx, b, c, s * 0.26, s * 0.4, -0.06); return true;
    case 'zoom': put(ctx, a, c, c, s * 0.95, 0, 0.35); put(ctx, b, c, c, s * 0.5); return true;
    default: return false;
  }
}

// ---------- verhaaltje ----------
const lc = (s) => String(s || 'iets').toLowerCase();
const WHO = ['Op een zonnige dag', 'Op een regenachtige woensdag', 'Midden in de nacht', 'Tijdens de pauze', 'Bij het ontbijt', 'Vlak voor het slapen', 'Op een stoere vrijdag', 'In de speeltuin'];
const DO = ['maakten ze samen een heel hoog kasteel', 'speelden ze verstoppertje in de keuken', 'bakten ze de grootste pannenkoek van de wereld', 'gingen ze op reis naar de maan', 'vonden ze een schat in de tuin', 'gaven ze een feestje voor de hele straat', 'leerden ze samen fietsen zonder zijwieltjes', 'bouwden ze een raket van kartonnen dozen'];
const END = ['En ze leefden nog lang en gelukkig.', 'Het was de leukste dag ooit!', 'Daarna aten ze een groot ijsje.', 'Iedereen klapte en riep: nog een keer!', 'Toen kwam de zon weer door.', 'En ze werden beste vrienden.'];
export function mixStory(nameA, nameB, mixName, seed = 0) {
  const h = (k) => Math.abs(Math.imul(seed + 1, 2654435761) ^ Math.imul(k + 7, 40503)) >>> 0;
  const a = lc(nameA), b = lc(nameB);
  return `${WHO[h(1) % WHO.length]} ontmoette een ${a} een ${b}. Samen heetten ze ${mixName || 'Mixi'}. ${DO[h(2) % DO.length][0].toUpperCase() + DO[h(2) % DO.length].slice(1)}. ${END[h(3) % END.length]}`.replace(/\.\s+([a-z])/g, (m, ch) => `. ${ch.toUpperCase()}`);
}

// ---------- mix van de dag ----------
export const dayNumber = (t = Date.now()) => Math.floor(t / 86400000);
// pairs: lijst [a,b] (bijv. alle officiële mixen); kiest voor iedereen op dezelfde dag hetzelfde paar.
export function mixOfTheDay(pairs, day = dayNumber()) { if (!pairs.length) return null; const i = ((day * 2654435761) >>> 0) % pairs.length; return pairs[i]; }

// ---------- raad-spel ----------
// Toont een eigen mix van twee emoji; kies de twee emoji die erin zitten uit 6 opties. Geeft een ronde terug.
export function quizRound(all, rng = Math.random, modes = ['half', 'hoed', 'hoek', 'draai', 'totem', 'smoothie', ...EXTRA_MODE_IDS]) {
  const pool = all.slice(), pick = () => pool.splice(Math.floor(rng() * pool.length), 1)[0];
  const a = pick(), b = pick(), opts = [a, b];
  while (opts.length < 6 && pool.length) opts.push(pick());
  for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
  return { a, b, mode: modes[Math.floor(rng() * modes.length)], opts, picked: [] };
}
export function quizPick(r, e) {
  if (r.picked.includes(e) || r.picked.length >= 2 || !r.opts.includes(e)) return r;
  r.picked.push(e); if (r.picked.length === 2) { const ok = r.picked.filter((x) => x === r.a || x === r.b).length; r.score = ok === 2 ? 3 : ok === 1 ? 1 : 0; r.done = true; }
  return r;
}

// ---------- poster ----------
export const POSTER_MAX = 6;
// Layout voor n mixen op een poster (vierkant): geeft [{x,y,s}] in pixels voor een canvas van size px.
export function posterLayout(n, size = 1024) {
  n = Math.max(0, Math.min(POSTER_MAX, n)); if (!n) return [];
  const cols = n === 1 ? 1 : n <= 4 ? 2 : 3, rows = Math.ceil(n / cols), pad = size * 0.06, cell = (size - pad * (cols + 1)) / cols, rh = (size - pad * 2 - size * 0.12 - pad * (rows - 1)) / rows, s = Math.min(cell, rh);
  return Array.from({ length: n }, (_, i) => ({ x: pad + (i % cols) * (cell + pad) + (cell - s) / 2, y: size * 0.12 + pad + Math.floor(i / cols) * (rh + pad) + (rh - s) / 2, s }));
}
