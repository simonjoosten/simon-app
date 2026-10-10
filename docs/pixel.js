// Pixel-art tekenaar: tekenen op een raster (8/16/32), emmer, pipet, spiegelen, ongedaan maken, opslaan als plaatje en een galerij.

const PALETTE = ['#000000', '#ffffff', '#9ca3af', '#4b5563', '#ef4444', '#f97316', '#facc15', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#7c2d12', '#b45309', '#fcd9b6', '#fde68a', '#bbf7d0', '#bae6fd', '#ddd6fe', '#fbcfe8'];
const TOOLS = [['pen', '✏️ Tekenen'], ['erase', '🧽 Gum'], ['fill', '🪣 Emmer'], ['pick', '💧 Pipet']];

// ctx: { view, esc, uid }
export function pixelView(ctx) {
  const { view, esc, uid } = ctx;
  const KEY = `pixel:gallery:${uid}`;
  const readG = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
  const writeG = (g) => { try { localStorage.setItem(KEY, JSON.stringify(g.slice(0, 40))); return true; } catch { return false; } };
  let n = 16, grid = Array(n * n).fill(null), color = PALETTE[4], tool = 'pen', mirror = false, grid_on = true;
  let undo = [], redo = [], editing = null, drawing = false;

  const snap = () => { undo.push(grid.slice()); if (undo.length > 60) undo.shift(); redo = []; };
  const newGrid = (size) => { n = size; grid = Array(n * n).fill(null); undo = []; redo = []; editing = null; };

  function paint(i) {
    if (i < 0 || i >= grid.length) return;
    const val = tool === 'erase' ? null : color;
    grid[i] = val;
    if (mirror) { const x = i % n, y = (i / n) | 0; grid[y * n + (n - 1 - x)] = val; }
  }
  function flood(i) {
    const target = grid[i]; const val = color; if (target === val) return;
    const stack = [i];
    while (stack.length) {
      const p = stack.pop(); if (grid[p] !== target) continue; grid[p] = val;
      const x = p % n, y = (p / n) | 0;
      if (x > 0) stack.push(p - 1); if (x < n - 1) stack.push(p + 1); if (y > 0) stack.push(p - n); if (y < n - 1) stack.push(p + n);
    }
  }

  function render(cv) {
    const s = cv.width / n; const c = cv.getContext('2d');
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = grid[y * n + x];
      c.fillStyle = v || ((x + y) % 2 ? '#e5e7eb' : '#f3f4f6'); c.fillRect(x * s, y * s, s, s);
    }
    if (grid_on && n <= 32) { c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i <= n; i++) { c.moveTo(i * s, 0); c.lineTo(i * s, cv.height); c.moveTo(0, i * s); c.lineTo(cv.width, i * s); } c.stroke(); }
  }
  const exportPng = (scale = 16) => { const cv = document.createElement('canvas'); cv.width = cv.height = n * scale; const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; grid.forEach((v, i) => { if (v) { c.fillStyle = v; c.fillRect((i % n) * scale, ((i / n) | 0) * scale, scale, scale); } }); return cv; };
  const thumb = (g, size, px = 80) => { const cv = document.createElement('canvas'); cv.width = cv.height = px; const c = cv.getContext('2d'); const s = px / size; c.fillStyle = '#f3f4f6'; c.fillRect(0, 0, px, px); g.forEach((v, i) => { if (v) { c.fillStyle = v; c.fillRect((i % size) * s, ((i / size) | 0) * s, Math.ceil(s), Math.ceil(s)); } }); return cv; };

  function draw() {
    const gal = readG();
    view.innerHTML = `
      <div class="box" style="padding:.7rem">
        <div class="row wrap" style="margin:0 0 .4rem">${[8, 16, 32].map((s) => `<button data-size="${s}" class="${s === n ? 'pri' : ''}">${s}×${s}</button>`).join('')}<button id="px-grid" class="${grid_on ? 'pri' : ''}">▦ Raster</button><button id="px-mir" class="${mirror ? 'pri' : ''}">⇋ Spiegel</button></div>
        <canvas id="px-cv" width="480" height="480" style="width:100%;aspect-ratio:1;border-radius:10px;touch-action:none;display:block;image-rendering:pixelated;cursor:crosshair"></canvas>
        <div class="row wrap" style="margin:.5rem 0 0">${TOOLS.map(([k, l]) => `<button data-tool="${k}" class="${k === tool ? 'pri' : ''}">${l}</button>`).join('')}</div>
        <div style="display:grid;grid-template-columns:repeat(12,1fr);gap:4px;margin:.5rem 0">${PALETTE.map((c) => `<button data-col="${c}" title="${c}" style="aspect-ratio:1;border-radius:7px;border:${c === color ? '3px solid var(--accent)' : '1px solid var(--line)'};background:${c};padding:0"></button>`).join('')}</div>
        <div class="row"><label style="display:flex;gap:.4rem;align-items:center"><small>Eigen kleur</small><input type="color" id="px-custom" value="${/^#[0-9a-f]{6}$/i.test(color) ? color : '#000000'}" style="width:2.6rem;height:2.2rem;padding:0;border:0;background:none"></label>
          <span style="flex:1"></span><button id="px-undo" ${undo.length ? '' : 'disabled'}>↶</button><button id="px-redo" ${redo.length ? '' : 'disabled'}>↷</button></div>
        <div class="row wrap"><button class="pri" id="px-save">💾 Bewaar in galerij</button><button id="px-png">⬇ Plaatje</button><button id="px-clear">🗑 Leeg</button></div><div id="px-msg"><small>${editing !== null ? 'Je past een bewaarde tekening aan.' : ''}</small></div>
      </div>
      <div class="box"><b>Mijn galerij</b>${gal.length ? '<div id="px-gal" style="display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin-top:.5rem"></div><small>Tik om te openen. Houd lang ingedrukt om te verwijderen.</small>' : '<br><small>Nog leeg.</small>'}</div>`;
    const cv = view.querySelector('#px-cv'); render(cv);
    const idxOf = (e) => { const r = cv.getBoundingClientRect(); const x = Math.floor((e.clientX - r.left) / r.width * n), y = Math.floor((e.clientY - r.top) / r.height * n); return x < 0 || y < 0 || x >= n || y >= n ? -1 : y * n + x; };
    const apply = (e) => {
      const i = idxOf(e); if (i < 0) return;
      if (tool === 'pick') { if (grid[i]) { color = grid[i]; tool = 'pen'; draw(); } return; }
      if (tool === 'fill') { flood(i); render(cv); return; }
      paint(i); render(cv);
    };
    cv.onpointerdown = (e) => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch {} if (tool !== 'pick') snap(); drawing = true; apply(e); if (tool === 'fill') { drawing = false; draw(); } };
    cv.onpointermove = (e) => { if (drawing && (tool === 'pen' || tool === 'erase')) apply(e); };
    const stop = () => { if (drawing) { drawing = false; draw(); } };
    cv.onpointerup = stop; cv.onpointercancel = stop;
    view.querySelectorAll('[data-size]').forEach((b) => b.onclick = () => { if (grid.some(Boolean) && !confirm('Een nieuw raster maken? Je huidige tekening gaat verloren (bewaar hem eerst).')) return; newGrid(+b.dataset.size); draw(); });
    view.querySelectorAll('[data-tool]').forEach((b) => b.onclick = () => { tool = b.dataset.tool; draw(); });
    view.querySelectorAll('[data-col]').forEach((b) => b.onclick = () => { color = b.dataset.col; if (tool === 'erase' || tool === 'pick') tool = 'pen'; draw(); });
    view.querySelector('#px-custom').oninput = (e) => { color = e.target.value; if (tool === 'erase' || tool === 'pick') tool = 'pen'; };
    view.querySelector('#px-custom').onchange = () => draw();
    view.querySelector('#px-grid').onclick = () => { grid_on = !grid_on; draw(); };
    view.querySelector('#px-mir').onclick = () => { mirror = !mirror; draw(); };
    view.querySelector('#px-undo').onclick = () => { if (undo.length) { redo.push(grid.slice()); grid = undo.pop(); draw(); } };
    view.querySelector('#px-redo').onclick = () => { if (redo.length) { undo.push(grid.slice()); grid = redo.pop(); draw(); } };
    view.querySelector('#px-clear').onclick = () => { if (!grid.some(Boolean) || confirm('Alles wissen?')) { snap(); grid = Array(n * n).fill(null); draw(); } };
    view.querySelector('#px-png').onclick = () => exportPng().toBlob((bl) => { if (!bl) return; const u = URL.createObjectURL(bl); const a = document.createElement('a'); a.href = u; a.download = 'pixel-art.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); });
    view.querySelector('#px-save').onclick = () => {
      if (!grid.some(Boolean)) { view.querySelector('#px-msg').innerHTML = '<small class="err">Teken eerst iets.</small>'; return; }
      const g = readG(); const item = { size: n, cells: grid.map((v) => (v ? PALETTE.indexOf(v) >= 0 ? PALETTE.indexOf(v) : v : null)), at: Date.now() };
      if (editing !== null && g[editing]) g[editing] = item; else { g.unshift(item); editing = 0; }
      view.querySelector('#px-msg').innerHTML = writeG(g) ? '<small>Bewaard in je galerij ✓</small>' : '<span class="err">Bewaren lukt niet (geheugen vol?).</span>'; draw();
    };
    const gv = view.querySelector('#px-gal');
    if (gv) gal.forEach((it, i) => {
      const cells = it.cells.map((v) => (typeof v === 'number' ? PALETTE[v] : v)); const t = thumb(cells, it.size); t.style.cssText = 'width:100%;border-radius:10px;cursor:pointer;image-rendering:pixelated'; gv.appendChild(t);
      let timer = null, long = false;
      t.onpointerdown = () => { long = false; timer = setTimeout(() => { long = true; const g = readG(); g.splice(i, 1); writeG(g); if (editing === i) editing = null; draw(); }, 700); };
      t.onpointerup = t.onpointerleave = t.onpointercancel = () => clearTimeout(timer);
      t.onclick = () => { if (long) return; n = it.size; grid = cells; undo = []; redo = []; editing = i; draw(); window.scrollTo({ top: 0 }); };
    });
  }
  draw();
}
