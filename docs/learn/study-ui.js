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

// voortgangsring als SVG met verloop; gloed via CSS (kwaliteit-bewust)
let ringN = 0;
export function ring(pct, size = 44, text = '') {
  const NS = 'http://www.w3.org/2000/svg'; const sw = Math.max(4, Math.round(size / 10)); const r = size / 2 - sw / 2 - 1; const c = 2 * Math.PI * r; const p = Math.max(0, Math.min(100, pct || 0));
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', `0 0 ${size} ${size}`); svg.setAttribute('width', size); svg.setAttribute('height', size); svg.setAttribute('class', 'ls-ring');
  const gid = 'lsg' + (++ringN);
  const defs = document.createElementNS(NS, 'defs'); const lg = document.createElementNS(NS, 'linearGradient'); lg.setAttribute('id', gid); lg.setAttribute('x1', '0'); lg.setAttribute('y1', '0'); lg.setAttribute('x2', '1'); lg.setAttribute('y2', '1');
  for (const [o, cl] of [['0', 'var(--ka,#6366f1)'], ['1', 'var(--kb,#22c55e)']]) { const st = document.createElementNS(NS, 'stop'); st.setAttribute('offset', o); st.setAttribute('style', 'stop-color:' + cl); lg.appendChild(st); }
  defs.appendChild(lg); svg.appendChild(defs);
  const mk = (cls, extra) => { const e = document.createElementNS(NS, 'circle'); e.setAttribute('cx', size / 2); e.setAttribute('cy', size / 2); e.setAttribute('r', r); e.setAttribute('fill', 'none'); e.setAttribute('stroke-width', sw); e.setAttribute('class', cls); for (const k in extra) e.setAttribute(k, extra[k]); return e; };
  svg.appendChild(mk('ls-ring-bg', {}));
  svg.appendChild(mk('ls-ring-fg', { 'stroke-dasharray': `${(c * p) / 100} ${c}`, 'stroke-linecap': 'round', stroke: `url(#${gid})`, transform: `rotate(-90 ${size / 2} ${size / 2})` }));
  const t = document.createElementNS(NS, 'text'); t.setAttribute('x', size / 2); t.setAttribute('y', size / 2 + size * 0.09); t.setAttribute('text-anchor', 'middle'); t.setAttribute('class', 'ls-ring-t'); t.setAttribute('style', `font-size:${Math.max(10, Math.round(size * 0.24))}px`); t.textContent = text || (p ? Math.round(p) + '' : ''); svg.appendChild(t);
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
.ls-root,.ls-sess,.ls-sheet{--ka:#6366f1;--kb:#a855f7;--ls-s:var(--gfx-scale,1);--ls-f:var(--gfx-font,1);--ls-card:var(--card,#fff);--ls-line:var(--line,#d6d6dc);--ls-ink:var(--ink,#1b1b1f)}
.ls-root{position:relative;max-width:680px;margin:0 auto;padding:10px 12px 92px;color:var(--ls-ink);font-size:calc(17px*var(--ls-f));line-height:1.35;-webkit-tap-highlight-color:transparent}
.ls-root *,.ls-sess *,.ls-sheet *{box-sizing:border-box}
.ls-root button,.ls-sess button,.ls-sheet button{font:inherit;color:inherit;cursor:pointer}
.ls-top{display:flex;align-items:center;gap:8px;margin:2px 0 12px}
.ls-top h2{margin:0;font-size:calc(23px*var(--ls-f));flex:1;display:flex;align-items:center;gap:8px}
.ls-btn{border:1px solid var(--ls-line);background:var(--ls-card);border-radius:14px;padding:calc(11px*var(--ls-s)) calc(15px*var(--ls-s));min-height:calc(48px*var(--ls-s));font-weight:700;touch-action:manipulation;transition:transform .12s,box-shadow .15s;box-shadow:0 1px 0 rgba(0,0,0,.04),0 2px 6px rgba(0,0,0,.05)}
.ls-btn:active{transform:scale(.96)}
.ls-btn.p{background:linear-gradient(135deg,var(--ka),var(--kb));color:#fff;border-color:transparent;box-shadow:0 6px 16px -4px color-mix(in srgb,var(--ka) 70%,transparent)}
.ls-btn.big{font-size:calc(19px*var(--ls-f));padding:calc(15px*var(--ls-s)) 20px;width:100%;border-radius:18px;min-height:calc(58px*var(--ls-s))}
.ls-btn.sm{min-height:calc(40px*var(--ls-s));padding:6px 12px;font-size:calc(15px*var(--ls-f));border-radius:12px}
.ls-btn.ls-danger{background:#ef4444;color:#fff;border-color:transparent}
.ls-btn[disabled]{opacity:.5;pointer-events:none}
.ls-ico{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;flex:none;text-align:center}
.ls-ico-i{object-fit:contain;display:block;filter:drop-shadow(0 3px 3px rgba(0,0,0,.22))}
html[data-gfx-q="0"] .ls-ico-i{filter:none}
.ls-card{background:var(--ls-card);background:linear-gradient(160deg,var(--ls-card),color-mix(in srgb,var(--ls-card) 90%,var(--ka)));border:1px solid var(--ls-line);border-radius:20px;padding:calc(16px*var(--ls-s));margin:0 0 12px;box-shadow:0 8px 24px -10px rgba(0,0,0,.18),0 1px 0 rgba(255,255,255,.5) inset}
html[data-gfx-q="0"] .ls-card{box-shadow:0 2px 6px rgba(0,0,0,.07);background:var(--ls-card)}
.ls-cs-vlak .ls-card,.ls-cs-vlak .ls-kit,.ls-cs-vlak .ls-mode{box-shadow:none;background:var(--ls-card);border-radius:12px}
.ls-cs-speels .ls-card,.ls-cs-speels .ls-kit,.ls-cs-speels .ls-mode{border-radius:26px;border-width:2px;border-left:7px solid var(--ka)}
.ls-card h3{margin:0 0 6px;font-size:calc(18px*var(--ls-f))}
.ls-muted{color:var(--ls-ink);opacity:.62;font-size:calc(14.5px*var(--ls-f))}
.ls-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.ls-row.sp{justify-content:space-between}
.ls-grow{flex:1;min-width:0}
.ls-chips{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 8px}
.ls-chip{border:1px solid var(--ls-line);background:var(--ls-card);border-radius:999px;padding:8px 14px;min-height:calc(42px*var(--ls-s));font-size:calc(15px*var(--ls-f));font-weight:700;transition:transform .1s}
.ls-chip:active{transform:scale(.95)}
.ls-chip.on{background:linear-gradient(135deg,var(--ka),var(--kb));color:#fff;border-color:transparent}
.ls-in,.ls-ta,.ls-sel{width:100%;font:inherit;color:inherit;background:var(--ls-card);border:1px solid var(--ls-line);border-radius:14px;padding:11px 13px;min-height:calc(48px*var(--ls-s))}
.ls-ta{min-height:110px;resize:vertical}
.ls-lab{display:block;font-size:calc(13.5px*var(--ls-f));font-weight:800;margin:10px 0 3px;opacity:.75}
.ls-tabs{background:var(--ls-card);position:sticky;bottom:0;z-index:5;display:flex;gap:2px;background:color-mix(in srgb,var(--ls-card) 92%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid var(--ls-line);border-radius:22px;padding:5px;margin-top:12px;box-shadow:0 -4px 20px rgba(0,0,0,.1);padding-bottom:calc(5px + env(safe-area-inset-bottom,0px))}
.ls-tab{flex:1;border:0;background:transparent;border-radius:17px;padding:6px 2px;font-size:calc(11.5px*var(--ls-f));font-weight:800;min-height:calc(56px*var(--ls-s));display:flex;flex-direction:column;align-items:center;gap:2px;transition:background .2s,transform .15s}
.ls-tab b{font-size:20px;line-height:1.1;font-weight:400;display:flex;transition:transform .2s}
.ls-tab.on{background:linear-gradient(135deg,var(--ka),var(--kb));color:#fff;box-shadow:0 4px 12px -3px color-mix(in srgb,var(--ka) 70%,transparent)}
.ls-tab.on b{transform:translateY(-2px) scale(1.12)}
.ls-kit{background:var(--ls-card);display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:linear-gradient(150deg,var(--ls-card),color-mix(in srgb,var(--ls-card) 92%,var(--kit-a,var(--ka))));border:1px solid var(--ls-line);border-radius:18px;padding:calc(12px*var(--ls-s));margin:0 0 10px;min-height:calc(74px*var(--ls-s));box-shadow:0 6px 16px -8px rgba(0,0,0,.2);position:relative;overflow:hidden;transition:transform .12s}
.ls-kit::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:linear-gradient(180deg,var(--kit-a,var(--ka)),var(--kit-b,var(--kb)))}
.ls-kit:active{transform:scale(.98)}
html[data-gfx-q="0"] .ls-kit{box-shadow:none;background:var(--ls-card)}
.ls-kit .em{background:var(--ls-card);width:calc(54px*var(--ls-s));height:calc(54px*var(--ls-s));display:flex;align-items:center;justify-content:center;border-radius:16px;background:radial-gradient(circle at 30% 25%,color-mix(in srgb,var(--kit-a,var(--ka)) 22%,transparent),color-mix(in srgb,var(--kit-b,var(--kb)) 10%,transparent));flex:none;margin-left:4px}
.ls-kit .nm{font-weight:800;font-size:calc(17px*var(--ls-f))}
.ls-ring-bg{stroke:var(--ls-line)}.ls-ring-fg{transition:stroke-dasharray .6s}.ls-ring-t{font-weight:800;fill:var(--ls-ink)}
html[data-gfx-q="1"] .ls-ring-fg{filter:drop-shadow(0 0 3px var(--ka))}
html[data-gfx-q="2"] .ls-ring-fg{filter:drop-shadow(0 0 7px var(--ka))}
.ls-bar{height:12px;border-radius:99px;background:var(--ls-line);overflow:hidden}
.ls-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--ka),var(--kb));border-radius:99px;transition:width .5s}
.ls-hero{position:relative;overflow:hidden;background:linear-gradient(135deg,var(--ka),var(--kb));color:#fff;border-radius:28px;padding:calc(20px*var(--ls-s));margin-bottom:14px;box-shadow:0 16px 36px -14px color-mix(in srgb,var(--ka) 80%,transparent)}
.ls-hero::after{content:"";position:absolute;right:-40px;top:-50px;width:190px;height:190px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.35),transparent 70%);pointer-events:none}
html[data-gfx-q="0"] .ls-hero::after{display:none}
.ls-hero .em{line-height:1;filter:drop-shadow(0 6px 8px rgba(0,0,0,.25))}
.ls-hero h2{margin:6px 0 2px;font-size:calc(25px*var(--ls-f))}
.ls-hero .ls-btn{background:#fff;color:color-mix(in srgb,var(--ka) 85%,#000);border:0;box-shadow:0 6px 14px -6px rgba(0,0,0,.35)}
.ls-hero .ls-btn.ghost{background:rgba(255,255,255,.22);color:#fff;box-shadow:none}
.ls-modes{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
.ls-mode{background:var(--ls-card);border:1px solid var(--ls-line);background:linear-gradient(150deg,var(--ls-card),color-mix(in srgb,var(--ls-card) 90%,var(--ka)));border-radius:20px;padding:14px;text-align:left;min-height:calc(104px*var(--ls-s));box-shadow:0 8px 18px -10px rgba(0,0,0,.25);transition:transform .12s}
.ls-mode:active{transform:scale(.97)}
html[data-gfx-q="0"] .ls-mode{box-shadow:none;background:var(--ls-card)}
.ls-mode b{display:block;margin-bottom:4px}.ls-mode span{font-weight:800;font-size:calc(17px*var(--ls-f))}.ls-mode small{display:block;opacity:.65;font-size:calc(12.5px*var(--ls-f));margin-top:2px}
.ls-mode.hot{background:var(--ls-card);grid-column:1/-1;background:linear-gradient(135deg,color-mix(in srgb,var(--ka) 14%,var(--ls-card)),color-mix(in srgb,var(--kb) 18%,var(--ls-card)));border-color:color-mix(in srgb,var(--ka) 40%,var(--ls-line));display:flex;align-items:center;gap:12px;min-height:calc(84px*var(--ls-s))}
.ls-mode.hot b{margin:0}
.ls-sess{background:var(--ls-card);position:fixed;left:0;top:0;right:0;bottom:0;z-index:60;background:radial-gradient(120% 60% at 50% -10%,color-mix(in srgb,var(--ka) 14%,transparent),transparent),var(--bg,var(--ls-card));color:var(--ls-ink);display:flex;flex-direction:column;height:100vh;height:100dvh;overflow:hidden;font-size:calc(17px*var(--ls-f))}
.ls-sess-top{display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid var(--ls-line);padding-top:calc(8px + env(safe-area-inset-top,0px))}
.ls-sess-top .t{flex:1;font-weight:800;font-size:calc(16px*var(--ls-f));text-align:center;display:flex;align-items:center;justify-content:center;gap:6px}
.ls-sess-body{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;padding:14px;max-width:680px;width:100%;margin:0 auto;padding-bottom:calc(20px + env(safe-area-inset-bottom,0px));position:relative}
.ls-sess-prog{height:8px;background:var(--ls-line)}.ls-sess-prog i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--ka),var(--kb));transition:width .35s;border-radius:0 99px 99px 0}
html[data-gfx-q="2"] .ls-sess-prog i{box-shadow:0 0 12px var(--ka)}
.ls-fb{border-radius:20px;padding:14px;margin:14px 0;border:2px solid;box-shadow:0 8px 20px -10px rgba(0,0,0,.25)}
.ls-fb.ok{background:rgba(34,197,94,.13);border-color:#22c55e}.ls-fb.no{background:rgba(239,68,68,.1);border-color:#ef4444}.ls-fb.half{background:rgba(245,158,11,.12);border-color:#f59e0b}
.ls-fb h3{margin:0 0 4px;font-size:calc(19px*var(--ls-f))}
.ls-big{font-size:calc(30px*var(--ls-f));font-weight:900;text-align:center;margin:10px 0}
.ls-learncard{background:var(--ls-card);text-align:center;padding:calc(30px*var(--ls-s)) 16px;border-radius:28px;background:linear-gradient(160deg,var(--ls-card),color-mix(in srgb,var(--ls-card) 86%,var(--ka)));border:1px solid var(--ls-line);box-shadow:0 18px 36px -16px color-mix(in srgb,var(--ka) 55%,rgba(0,0,0,.4));margin:12px 0}
.ls-learncard .e{display:flex;justify-content:center}.ls-learncard .f{font-size:calc(26px*var(--ls-f));font-weight:900;margin:10px 0;white-space:pre-wrap}.ls-learncard .b{font-size:calc(26px*var(--ls-f));color:#16a34a;font-weight:900;margin:10px 0;white-space:pre-wrap}
.ls-flip{perspective:1100px;margin:14px 0;height:calc(320px*var(--ls-s));touch-action:pan-y;user-select:none;-webkit-user-select:none;position:relative}
.ls-flip::after{content:"";position:absolute;left:10%;right:10%;bottom:-14px;height:20px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(0,0,0,.28),transparent 70%);pointer-events:none;transition:transform .5s,opacity .5s}
.ls-flip.f::after{transform:scaleX(.82);opacity:.7}
html[data-gfx-q="0"] .ls-flip::after{display:none}
.ls-flip-in{position:relative;width:100%;height:100%;transition:transform .6s cubic-bezier(.3,1.25,.5,1);transform-style:preserve-3d;-webkit-transform-style:preserve-3d;touch-action:pan-y}
.ls-flip.f .ls-flip-in{transform:rotateY(180deg)}
.ls-face{background:var(--ls-card);position:absolute;left:0;top:0;width:100%;height:100%;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:28px;border:1px solid var(--ls-line);background:linear-gradient(160deg,var(--ls-card),color-mix(in srgb,var(--ls-card) 84%,var(--ka)));display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;font-size:calc(26px*var(--ls-f));font-weight:900;box-shadow:0 20px 36px -16px color-mix(in srgb,var(--ka) 60%,rgba(0,0,0,.45)),0 1px 0 rgba(255,255,255,.6) inset;white-space:pre-wrap;overflow:auto}
.ls-face.bk{transform:rotateY(180deg);background:linear-gradient(135deg,#ecfdf5,#bbf7d0);color:#064e3b;border-color:#86efac}
.ls-face .e{display:flex;justify-content:center;margin-bottom:6px}.ls-face small{font-size:calc(14px*var(--ls-f));font-weight:600;opacity:.7;margin-top:10px}
.ls-stat{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px}
.ls-stat div{background:var(--ls-card);background:linear-gradient(160deg,var(--ls-card),color-mix(in srgb,var(--ls-card) 88%,var(--ka)));border:1px solid var(--ls-line);border-radius:18px;padding:12px 8px;text-align:center;box-shadow:0 6px 14px -8px rgba(0,0,0,.2)}
.ls-stat b{display:flex;align-items:center;justify-content:center;gap:4px;font-size:calc(25px*var(--ls-f))}.ls-stat span{font-size:calc(12.5px*var(--ls-f));opacity:.65}
.ls-grade{font-size:calc(72px*var(--ls-f));font-weight:900;text-align:center;line-height:1;background:linear-gradient(135deg,var(--ka),var(--kb));-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}
.ls-li{display:flex;gap:8px;padding:9px 0;border-bottom:1px solid var(--ls-line);align-items:flex-start}
.ls-li:last-child{border-bottom:0}
.ls-hearts{font-size:calc(24px*var(--ls-f));letter-spacing:2px}
.ls-pop{animation:ls-pop .45s}
html[data-reduce="1"] .ls-pop{animation:none}
html[data-reduce="1"] .ls-flip-in{transition:none}
@keyframes ls-pop{0%{transform:scale(.7);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
.ls-toast{position:fixed;left:50%;bottom:96px;transform:translateX(-50%);background:#111;color:#fff;border-radius:99px;padding:12px 18px;z-index:90;font-size:calc(15px*var(--ls-f));max-width:90vw;box-shadow:0 10px 24px rgba(0,0,0,.35)}
.ls-seg{display:flex;gap:4px;margin:0 0 10px;overflow-x:auto;-webkit-overflow-scrolling:touch}
.ls-seg button{flex:0 0 auto;border:1px solid var(--ls-line);background:var(--ls-card);border-radius:14px;padding:9px 13px;font-weight:700;font-size:calc(15px*var(--ls-f));min-height:calc(44px*var(--ls-s))}
.ls-seg button.on{background:linear-gradient(135deg,var(--ka),var(--kb));color:#fff;border-color:transparent}
.ls-prev{max-height:260px;overflow:auto;border:1px dashed var(--ls-line);border-radius:14px;padding:6px 10px;margin:8px 0}
.ls-prev div{padding:5px 0;border-bottom:1px solid var(--ls-line);font-size:14px}
.ls-prev div:last-child{border:0}
.ls-tag{display:inline-block;font-size:11px;font-weight:800;border-radius:6px;padding:1px 6px;background:var(--ls-line);margin-right:6px}
.ls-ck{display:flex;gap:8px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--ls-line)}
.ls-ck input{width:22px;height:22px;flex:0 0 auto;margin-top:2px}
.ls-sheet{position:fixed;left:0;right:0;top:0;bottom:0;z-index:70;background:rgba(10,10,30,.5);display:flex;align-items:flex-end;justify-content:center}
.ls-sheet>div{background:var(--bg,var(--ls-card));color:var(--ls-ink);width:100%;max-width:680px;max-height:90vh;overflow:auto;border-radius:28px 28px 0 0;padding:18px;padding-bottom:calc(18px + env(safe-area-inset-bottom,0px));box-shadow:0 -12px 40px rgba(0,0,0,.3);font-size:calc(17px*var(--ls-f))}
.ls-badge{background:var(--ls-card);display:flex;flex-direction:column;align-items:center;gap:4px;width:calc(92px*var(--ls-s));padding:10px 4px;border-radius:18px;border:1px solid var(--ls-line);background:linear-gradient(160deg,var(--ls-card),color-mix(in srgb,var(--ls-card) 86%,#f59e0b));text-align:center;font-size:calc(12px*var(--ls-f));font-weight:700;box-shadow:0 6px 14px -8px rgba(0,0,0,.25)}
.ls-badge.off{opacity:.45;filter:grayscale(.9)}
.ls-badges{display:flex;flex-wrap:wrap;gap:8px}
.ls-swatches{display:flex;gap:8px;flex-wrap:wrap;margin:4px 0}
.ls-sw{width:calc(46px*var(--ls-s));height:calc(46px*var(--ls-s));border-radius:50%;border:3px solid transparent;box-shadow:0 0 0 2px var(--ls-line);padding:0}
.ls-sw.on{border-color:var(--ls-card);box-shadow:0 0 0 4px var(--ls-ink)}
.ls-icogrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:6px;margin:8px 0;max-height:210px;overflow:auto}
.ls-icogrid button{border:2px solid transparent;background:var(--ls-card);border-radius:14px;padding:4px;min-height:52px;display:flex;align-items:center;justify-content:center}
.ls-icogrid button.on{background:var(--ls-card);border-color:var(--ka);background:color-mix(in srgb,var(--ka) 14%,var(--ls-card))}
.ls-timer{height:10px;border-radius:99px;background:var(--ls-line);overflow:hidden;margin:0 0 10px}.ls-timer i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#22c55e,#eab308,#ef4444);background-size:300% 100%;transition:width 1s linear}
/* grote vraagweergave binnen een sessie (q.js blijft ongewijzigd: we vergroten zijn klassen) */
.ls-sess .lq-root{max-width:680px;gap:calc(.9rem*var(--ls-s))}
.ls-sess .lq-card{background:var(--ls-card);padding:calc(1.6rem*var(--ls-s)) 1.1rem;border-radius:28px;background:linear-gradient(160deg,var(--ls-card),color-mix(in srgb,var(--ls-card) 88%,var(--ka)));box-shadow:0 18px 36px -18px color-mix(in srgb,var(--ka) 60%,rgba(0,0,0,.45));border-color:color-mix(in srgb,var(--ka) 25%,var(--ls-line))}
html[data-gfx-q="0"] .ls-sess .lq-card{box-shadow:0 2px 8px rgba(0,0,0,.1);background:var(--ls-card)}
.ls-sess .lq-q{font-size:calc(1.6rem*var(--ls-f));font-weight:800;line-height:1.3}
.ls-sess .lq-e{display:flex;justify-content:center;margin-bottom:.5rem;font-size:4.4rem}
.ls-sess .lq-opt,.ls-sess .lq-go,.ls-sess .lq-skip{min-height:calc(58px*var(--ls-s));font-size:calc(1.15rem*var(--ls-f));border-radius:18px}
.ls-sess .lq-opt{box-shadow:0 5px 12px -6px rgba(0,0,0,.25)}
.ls-ico-big{background:var(--ls-card);display:flex;align-items:center;justify-content:center;min-width:calc(64px*var(--ls-s));height:calc(64px*var(--ls-s));border-radius:18px;background:radial-gradient(circle at 30% 25%,color-mix(in srgb,var(--ka) 22%,transparent),transparent 75%)}
.ls-medal{background:var(--ls-card);width:calc(132px*var(--ls-s));height:calc(132px*var(--ls-s));margin:6px auto 4px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 28%,color-mix(in srgb,var(--ka) 30%,transparent),color-mix(in srgb,var(--kb) 14%,transparent) 70%);border:2px solid color-mix(in srgb,var(--ka) 35%,transparent)}
html[data-gfx-q="1"] .ls-medal.good{box-shadow:0 0 28px -4px var(--ka)}
html[data-gfx-q="2"] .ls-medal.good{box-shadow:0 0 52px 2px var(--ka),0 0 100px 8px color-mix(in srgb,var(--kb) 50%,transparent)}
.ls-reward{display:flex;gap:16px;justify-content:center;align-items:center;font-weight:900;font-size:calc(20px*var(--ls-f))}
.ls-reward-c{display:inline-flex;align-items:center;gap:4px}
@media (prefers-color-scheme:dark){.ls-face.bk{background:linear-gradient(135deg,#064e3b,#065f46);color:#d1fae5;border-color:#047857}}
`;
