// Learn Study: kleine DOM-hulpjes + gedeelde CSS (prefix ls-). Geen innerHTML met gebruikersinvoer.

export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) {
    for (const k of Object.keys(props)) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'style') el.setAttribute('style', v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'selected') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  add(el, kids);
  return el;
}
function add(el, kids) {
  for (const c of kids) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) add(el, c);
    else if (typeof c === 'object') el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
}
export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
export function mount(el, ...kids) { clear(el); add(el, kids); return el; }

export function injectCss(id, css) {
  const st = document.createElement('style'); st.setAttribute('data-ls', id); st.textContent = css;
  (document.head || document.documentElement).appendChild(st);
  return () => { if (st.parentNode) st.parentNode.removeChild(st); };
}

export function makeStore(uid) {
  const key = (k) => `learn:${uid || 'anon'}:study-${k}`;
  return {
    get(k, def) { try { const v = localStorage.getItem(key(k)); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem(key(k), JSON.stringify(v)); } catch (e) { /* vol of geblokkeerd */ } },
  };
}

// voortgangsring als SVG
export function ring(pct, size = 44, text = '') {
  const NS = 'http://www.w3.org/2000/svg'; const r = size / 2 - 4; const c = 2 * Math.PI * r; const p = Math.max(0, Math.min(100, pct || 0));
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', `0 0 ${size} ${size}`); svg.setAttribute('width', size); svg.setAttribute('height', size); svg.setAttribute('class', 'ls-ring');
  const mk = (cls, extra) => { const e = document.createElementNS(NS, 'circle'); e.setAttribute('cx', size / 2); e.setAttribute('cy', size / 2); e.setAttribute('r', r); e.setAttribute('fill', 'none'); e.setAttribute('stroke-width', 4); e.setAttribute('class', cls); for (const k in extra) e.setAttribute(k, extra[k]); return e; };
  svg.appendChild(mk('ls-ring-bg', {}));
  svg.appendChild(mk('ls-ring-fg', { 'stroke-dasharray': `${(c * p) / 100} ${c}`, 'stroke-linecap': 'round', transform: `rotate(-90 ${size / 2} ${size / 2})` }));
  const t = document.createElementNS(NS, 'text'); t.setAttribute('x', size / 2); t.setAttribute('y', size / 2 + 3.5); t.setAttribute('text-anchor', 'middle'); t.setAttribute('class', 'ls-ring-t'); t.textContent = text || (p ? Math.round(p) + '' : ''); svg.appendChild(t);
  return svg;
}
export function bar(pct, cls = '') { const f = h('i', { style: { width: Math.max(0, Math.min(100, pct)) + '%' } }); return h('div', { class: 'ls-bar ' + cls }, f); }

// twee-tik-bevestiging zonder confirm()
export function twoTap(btn, label, action, timers) {
  const orig = btn.textContent; let armed = false; let t = null;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (armed) { clearTimeout(t); armed = false; btn.textContent = orig; btn.classList.remove('ls-danger'); action(); return; }
    armed = true; btn.textContent = label; btn.classList.add('ls-danger');
    t = setTimeout(() => { armed = false; btn.textContent = orig; btn.classList.remove('ls-danger'); }, 3000);
    if (timers) timers.push(() => clearTimeout(t));
  });
}

export const CSS = `
.ls-root{position:relative;max-width:640px;margin:0 auto;padding:10px 12px 76px;color:var(--ink,#1b1b1f);font-size:16px;line-height:1.35;-webkit-tap-highlight-color:transparent}
.ls-root *{box-sizing:border-box}
.ls-root button{font:inherit;color:inherit;cursor:pointer}
.ls-top{display:flex;align-items:center;gap:8px;margin:2px 0 10px}
.ls-top h2{margin:0;font-size:20px;flex:1}
.ls-btn{border:1px solid var(--line,#d6d6dc);background:var(--card,#fff);border-radius:12px;padding:10px 14px;min-height:44px;font-weight:600;touch-action:manipulation}
.ls-btn:active{transform:scale(.97)}
.ls-btn.p{background:var(--accent,#6366f1);color:#fff;border-color:transparent}
.ls-btn.big{font-size:18px;padding:14px 20px;width:100%;border-radius:16px}
.ls-btn.sm{min-height:34px;padding:6px 10px;font-size:14px;border-radius:10px}
.ls-btn.ls-danger{background:#ef4444;color:#fff;border-color:transparent}
.ls-btn[disabled]{opacity:.5;pointer-events:none}
.ls-card{background:var(--card,#fff);border:1px solid var(--line,#d6d6dc);border-radius:16px;padding:12px;margin:0 0 10px}
.ls-card h3{margin:0 0 6px;font-size:16px}
.ls-muted{color:var(--ink,#1b1b1f);opacity:.62;font-size:14px}
.ls-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.ls-row.sp{justify-content:space-between}
.ls-grow{flex:1;min-width:0}
.ls-chips{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 8px}
.ls-chip{border:1px solid var(--line,#d6d6dc);background:var(--card,#fff);border-radius:999px;padding:7px 12px;min-height:38px;font-size:14px;font-weight:600}
.ls-chip.on{background:var(--accent,#6366f1);color:#fff;border-color:transparent}
.ls-in,.ls-ta,.ls-sel{width:100%;font:inherit;color:inherit;background:var(--card,#fff);border:1px solid var(--line,#d6d6dc);border-radius:12px;padding:10px 12px;min-height:44px}
.ls-ta{min-height:110px;resize:vertical}
.ls-lab{display:block;font-size:13px;font-weight:700;margin:8px 0 3px;opacity:.75}
.ls-tabs{position:sticky;bottom:0;z-index:5;display:flex;gap:2px;background:var(--card,#fff);border:1px solid var(--line,#d6d6dc);border-radius:18px;padding:4px;margin-top:12px;box-shadow:0 -2px 14px rgba(0,0,0,.08);padding-bottom:calc(4px + env(safe-area-inset-bottom,0px))}
.ls-tab{flex:1;border:0;background:transparent;border-radius:14px;padding:6px 2px;font-size:11px;font-weight:700;min-height:48px;display:flex;flex-direction:column;align-items:center;gap:1px}
.ls-tab b{font-size:20px;line-height:1.1;font-weight:400}
.ls-tab.on{background:var(--accent,#6366f1);color:#fff}
.ls-kit{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:var(--card,#fff);border:1px solid var(--line,#d6d6dc);border-radius:14px;padding:10px;margin:0 0 8px;min-height:60px}
.ls-kit .em{font-size:30px;width:42px;text-align:center}
.ls-kit .nm{font-weight:700}
.ls-ring-bg{stroke:var(--line,#d6d6dc)}.ls-ring-fg{stroke:var(--accent,#6366f1)}.ls-ring-t{font-size:11px;font-weight:700;fill:var(--ink,#1b1b1f)}
.ls-bar{height:10px;border-radius:99px;background:var(--line,#d6d6dc);overflow:hidden}
.ls-bar i{display:block;height:100%;background:linear-gradient(90deg,#6366f1,#22c55e);border-radius:99px;transition:width .35s}
.ls-hero{background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;border-radius:22px;padding:16px;margin-bottom:12px;box-shadow:0 8px 24px rgba(99,102,241,.3)}
.ls-hero .em{font-size:52px;line-height:1}
.ls-hero h2{margin:6px 0 2px;font-size:22px}
.ls-hero .ls-btn{background:#fff;color:#4338ca;border:0}
.ls-hero .ls-btn.ghost{background:rgba(255,255,255,.2);color:#fff}
.ls-modes{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
.ls-mode{border:1px solid var(--line,#d6d6dc);background:var(--card,#fff);border-radius:16px;padding:12px;text-align:left;min-height:84px}
.ls-mode b{display:block;font-size:26px}.ls-mode span{font-weight:700}.ls-mode small{display:block;opacity:.65;font-size:12px;margin-top:2px}
.ls-sess{position:fixed;left:0;top:0;right:0;bottom:0;z-index:60;background:var(--bg,var(--card,#fff));color:var(--ink,#1b1b1f);display:flex;flex-direction:column;height:100vh;height:100dvh;overflow:hidden}
.ls-sess-top{display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid var(--line,#d6d6dc);padding-top:calc(8px + env(safe-area-inset-top,0px))}
.ls-sess-top .t{flex:1;font-weight:800;font-size:15px;text-align:center}
.ls-sess-body{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;padding:12px;max-width:640px;width:100%;margin:0 auto;padding-bottom:calc(16px + env(safe-area-inset-bottom,0px))}
.ls-sess-prog{height:6px;background:var(--line,#d6d6dc)}.ls-sess-prog i{display:block;height:100%;width:0;background:var(--accent,#6366f1);transition:width .3s}
.ls-fb{border-radius:16px;padding:12px;margin:12px 0;border:2px solid}
.ls-fb.ok{background:rgba(34,197,94,.12);border-color:#22c55e}.ls-fb.no{background:rgba(239,68,68,.1);border-color:#ef4444}.ls-fb.half{background:rgba(245,158,11,.12);border-color:#f59e0b}
.ls-fb h3{margin:0 0 4px}
.ls-big{font-size:26px;font-weight:800;text-align:center;margin:10px 0}
.ls-learncard{text-align:center;padding:22px 14px;border-radius:22px;background:var(--card,#fff);border:1px solid var(--line,#d6d6dc);box-shadow:0 6px 20px rgba(0,0,0,.06);margin:10px 0}
.ls-learncard .e{font-size:64px}.ls-learncard .f{font-size:22px;font-weight:800;margin:8px 0;white-space:pre-wrap}.ls-learncard .b{font-size:22px;color:#16a34a;font-weight:800;margin:8px 0;white-space:pre-wrap}
.ls-flip{perspective:900px;margin:12px 0;height:260px;touch-action:pan-y;user-select:none;-webkit-user-select:none}
.ls-flip-in{position:relative;width:100%;height:100%;transition:transform .45s;transform-style:preserve-3d;-webkit-transform-style:preserve-3d;touch-action:pan-y}
.ls-flip.f .ls-flip-in{transform:rotateY(180deg)}
.ls-face{position:absolute;left:0;top:0;width:100%;height:100%;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:22px;border:1px solid var(--line,#d6d6dc);background:var(--card,#fff);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;text-align:center;font-size:22px;font-weight:800;box-shadow:0 8px 22px rgba(0,0,0,.08);white-space:pre-wrap;overflow:auto}
.ls-face.bk{transform:rotateY(180deg);background:linear-gradient(135deg,#ecfdf5,#d1fae5);color:#064e3b}
.ls-face .e{font-size:54px}.ls-face small{font-size:14px;font-weight:500;opacity:.7;margin-top:8px}
.ls-stat{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px}
.ls-stat div{background:var(--card,#fff);border:1px solid var(--line,#d6d6dc);border-radius:14px;padding:8px;text-align:center}
.ls-stat b{display:block;font-size:22px}.ls-stat span{font-size:12px;opacity:.65}
.ls-grade{font-size:56px;font-weight:900;text-align:center;line-height:1}
.ls-li{display:flex;gap:8px;padding:8px 0;border-bottom:1px solid var(--line,#d6d6dc);align-items:flex-start}
.ls-li:last-child{border-bottom:0}
.ls-hearts{font-size:22px;letter-spacing:2px}
.ls-pop{animation:ls-pop .4s}
@keyframes ls-pop{0%{transform:scale(.7);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
.ls-toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#111;color:#fff;border-radius:99px;padding:10px 16px;z-index:90;font-size:14px;max-width:90vw}
.ls-seg{display:flex;gap:4px;margin:0 0 10px;overflow-x:auto;-webkit-overflow-scrolling:touch}
.ls-seg button{flex:0 0 auto;border:1px solid var(--line,#d6d6dc);background:var(--card,#fff);border-radius:12px;padding:8px 12px;font-weight:700;font-size:14px;min-height:40px}
.ls-seg button.on{background:var(--accent,#6366f1);color:#fff;border-color:transparent}
.ls-prev{max-height:260px;overflow:auto;border:1px dashed var(--line,#d6d6dc);border-radius:12px;padding:6px 10px;margin:8px 0}
.ls-prev div{padding:5px 0;border-bottom:1px solid var(--line,#d6d6dc);font-size:14px}
.ls-prev div:last-child{border:0}
.ls-tag{display:inline-block;font-size:11px;font-weight:800;border-radius:6px;padding:1px 6px;background:var(--line,#d6d6dc);margin-right:6px}
.ls-ck{display:flex;gap:8px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--line,#d6d6dc)}
.ls-ck input{width:22px;height:22px;flex:0 0 auto;margin-top:2px}
.ls-sheet{position:fixed;left:0;right:0;top:0;bottom:0;z-index:70;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}
.ls-sheet>div{background:var(--bg,var(--card,#fff));color:var(--ink,#1b1b1f);width:100%;max-width:640px;max-height:88vh;overflow:auto;border-radius:22px 22px 0 0;padding:16px;padding-bottom:calc(16px + env(safe-area-inset-bottom,0px))}
@media (prefers-color-scheme:dark){.ls-face.bk{background:linear-gradient(135deg,#064e3b,#065f46);color:#d1fae5}}
`;
