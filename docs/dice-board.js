// Tekenwerk voor het bord van Slangen en ladders (canvas, geen DOM-afhankelijkheid behalve ctx).
import { drawIcon } from './gfx/art.js?v=1';
import { SNAKES, LADDERS, cellRC } from './dice-games.js?v=1';

export const TOKENS = [{ icon: 'rocket', color: '#ef4444' }, { icon: 'dino', color: '#22c55e' }, { icon: 'unicorn', color: '#a855f7' }, { icon: 'robot', color: '#3b82f6' }];
export const cellCenter = (n, W) => { const c = W / 10, { row, col } = cellRC(Math.max(1, n)); return [col * c + c / 2, (9 - row) * c + c / 2]; };
const SNAKE_COLORS = ['#16a34a', '#65a30d', '#0d9488', '#ca8a04', '#be185d', '#7c3aed', '#ea580c', '#0891b2', '#4d7c0f', '#b91c1c'];

function snakePoints(a, b, c, k) { // a = kop (hoge vakje), b = staart
  const pts = [], N = 28, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, amp = c * 0.38, waves = Math.max(1.5, Math.round(L / (c * 2.2)) + 0.5);
  for (let i = 0; i <= N; i++) { const t = i / N, w = Math.sin(t * Math.PI * waves * 2 + k) * amp * Math.sin(Math.PI * t) ** 0.6; pts.push([a[0] + dx * t + nx * w, a[1] + dy * t + ny * w, t]); }
  return pts;
}

// players: [{pos, icon, color, x?, y?}] (x,y = tussenpositie tijdens animatie)
export function drawBoard(ctx, W, players, q = 1, hl = null) {
  const c = W / 10; ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const bg = ctx.createLinearGradient(0, 0, W, W); bg.addColorStop(0, '#fef3c7'); bg.addColorStop(1, '#bfdbfe'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, W);
  for (let n = 1; n <= 100; n++) {
    const { row, col } = cellRC(n), x = col * c, y = (9 - row) * c;
    ctx.fillStyle = (row + col) % 2 ? 'rgba(255,255,255,.55)' : 'rgba(99,102,241,.14)'; if (n === 100) ctx.fillStyle = 'rgba(250,204,21,.6)'; ctx.fillRect(x, y, c, c);
    ctx.fillStyle = 'rgba(30,41,59,.65)'; ctx.font = `700 ${Math.round(c * 0.2)}px system-ui,sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(String(n), x + c * 0.07, y + c * 0.05);
  }
  ctx.strokeStyle = 'rgba(99,102,241,.35)'; ctx.lineWidth = 1; for (let i = 0; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(i * c, 0); ctx.lineTo(i * c, W); ctx.moveTo(0, i * c); ctx.lineTo(W, i * c); ctx.stroke(); }
  // ladders
  Object.entries(LADDERS).forEach(([a, b]) => {
    const A = cellCenter(+a, W), B = cellCenter(+b, W), dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy), nx = -dy / L * c * 0.14, ny = dx / L * c * 0.14;
    ctx.strokeStyle = '#92400e'; ctx.lineWidth = c * 0.075; [1, -1].forEach((s) => { ctx.beginPath(); ctx.moveTo(A[0] + nx * s, A[1] + ny * s); ctx.lineTo(B[0] + nx * s, B[1] + ny * s); ctx.stroke(); });
    ctx.strokeStyle = '#b45309'; ctx.lineWidth = c * 0.06; const rungs = Math.max(2, Math.round(L / (c * 0.4)));
    for (let i = 1; i < rungs; i++) { const t = i / rungs; ctx.beginPath(); ctx.moveTo(A[0] + dx * t + nx, A[1] + dy * t + ny); ctx.lineTo(A[0] + dx * t - nx, A[1] + dy * t - ny); ctx.stroke(); }
  });
  // slangen
  Object.entries(SNAKES).forEach(([a, b], k) => {
    const pts = snakePoints(cellCenter(+a, W), cellCenter(+b, W), c, k * 1.7), col = SNAKE_COLORS[k % SNAKE_COLORS.length];
    for (let i = 0; i < pts.length - 1; i++) { const t = pts[i][2], w = c * (0.3 - 0.2 * t); ctx.strokeStyle = i % 4 < 2 ? col : 'rgba(255,255,255,.35)'; if (q === 0) ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke(); }
    const h = pts[0]; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(h[0], h[1], c * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(h[0] - c * 0.07, h[1] - c * 0.05, c * 0.06, 0, Math.PI * 2); ctx.arc(h[0] + c * 0.07, h[1] - c * 0.05, c * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(h[0] - c * 0.07, h[1] - c * 0.05, c * 0.03, 0, Math.PI * 2); ctx.arc(h[0] + c * 0.07, h[1] - c * 0.05, c * 0.03, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = c * 0.02; ctx.beginPath(); ctx.moveTo(h[0], h[1] + c * 0.12); ctx.lineTo(h[0], h[1] + c * 0.26); ctx.stroke();
  });
  // finish
  drawIcon(ctx, 'trophy', cellCenter(100, W)[0], cellCenter(100, W)[1] + c * 0.08, c * 0.62);
  // pionnen
  const groups = {};
  players.forEach((p, i) => { const k = p.x != null ? 'm' + i : 'p' + p.pos; (groups[k] = groups[k] || []).push(i); });
  players.forEach((p, i) => {
    let [x, y] = p.x != null ? [p.x, p.y] : cellCenter(p.pos || 1, W);
    const grp = groups[p.x != null ? 'm' + i : 'p' + p.pos], k = grp.indexOf(i);
    if (grp.length > 1) { x += (k % 2 ? 1 : -1) * c * 0.17; y += (k > 1 ? 1 : -1) * c * 0.12; }
    const r = c * 0.32; if (q >= 0) { ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.85, r * 0.9, r * 0.32, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = (hl === i) ? '#fbbf24' : '#fff'; ctx.lineWidth = (hl === i) ? c * 0.09 : c * 0.05; ctx.stroke();
    drawIcon(ctx, p.icon, x, y, r * 1.5);
  });
  ctx.restore();
}
