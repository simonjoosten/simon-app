// Ronde 4 (groep TOOLS): gedeelde kleine hulpjes voor de nieuwe onderdelen (prefix r4-). Pure functies + veilige opslag.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const pad2 = (n) => String(n).padStart(2, '0');
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export function hash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rng(seed) { let a = (typeof seed === 'number' ? seed : hash(seed)) >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const pick = (r, a) => a[Math.floor(r() * a.length)];
export function shuffle(r, arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** Veilige lokale opslag (geen fouten in privé-modus). */
export function lsGet(key, def) { try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? def : v; } catch { return def; } }
export function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* stil */ } }

/** Kleine CSS (prefix .r4-) eenmalig in de pagina. */
const CSS = `
.r4-card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:1rem;margin:.7rem 0}
.r4-btn{min-height:48px;padding:.5rem 1rem;border-radius:16px;font-weight:700;font-size:1.05rem}
.r4-row{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}
.r4-big{font-size:2.6rem;font-weight:800;text-align:center;font-variant-numeric:tabular-nums;line-height:1.15}
.r4-pad{width:100%;min-height:150px;border-radius:24px;font-size:1.5rem;font-weight:800;color:#fff;border:0}
.r4-chip{display:inline-flex;align-items:center;padding:.25rem .7rem;border-radius:99px;background:var(--line);font-weight:600;font-size:.85rem}
.r4-sec{display:flex;gap:.4rem;overflow-x:auto;padding:.1rem 0 .4rem}
.r4-sec button{flex:none;min-height:46px;border-radius:14px;font-weight:700;padding:.3rem .9rem}
.r4-sec button.on{background:var(--accent);border-color:var(--accent);color:#fff}
.r4-in{width:100%;padding:.7rem .8rem;border:1px solid var(--line);border-radius:14px;font:inherit;background:var(--card);color:inherit;min-height:48px;box-sizing:border-box}
.r4-ok{color:#16a34a;font-weight:700}.r4-bad{color:#dc2626;font-weight:700}
`;
export function injectR4Css() {
  const d = globalThis.document; if (!d) return;
  try { if (d.getElementById && d.getElementById('r4-css')) return; const s = d.createElement('style'); s.id = 'r4-css'; s.textContent = CSS; (d.head || d.documentElement).appendChild(s); } catch { /* stil */ }
}

/** Sectiebalk binnen een tab: sections=[[id,label]]; geeft html. Binden met bindSections. */
export const sectionsHtml = (secs, cur) => `<div class="r4-sec">${secs.map(([k, l]) => `<button data-sec="${k}" class="${k === cur ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>`;
export function bindSections(root, fn) { root.querySelectorAll('[data-sec]').forEach((b) => { b.onclick = () => fn(b.dataset.sec); }); }

/** Korte WebAudio-piep (stil als audio ontbreekt). */
let _ac = null;
export function blip(freq = 660, dur = 0.12, vol = 0.15, type = 'sine') {
  try {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext; if (!AC) return;
    _ac = _ac || new AC(); if (_ac.state === 'suspended') _ac.resume().catch(() => {});
    const t = _ac.currentTime, g = _ac.createGain(), o = _ac.createOscillator(); o.type = type; o.frequency.value = freq; o.connect(g); g.connect(_ac.destination);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.start(t); o.stop(t + dur + 0.05);
  } catch { /* stil */ }
}
