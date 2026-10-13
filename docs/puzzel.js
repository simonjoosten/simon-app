// Losse puzzel-app: start één minigame uit games/mini/ als eigen app. De voortgang wordt op dezelfde plek bewaard als in de Gamescroller
// (gamesaves/{spel}__{uid}), dus je gaat overal verder waar je was.
import { doc, getDoc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const CLOUD_EVERY = 20000;

// ctx: { db, me, view, uid, addCleanup }
export async function puzzelView(ctx, id) {
  const { db, view, addCleanup } = ctx;
  const uid = ctx.uid || (ctx.me && ctx.me.uid) || 'anon';
  let alive = true, inst = null, timer = null, pending = null;
  const key = `gs:g:${uid}:${id}`;
  const ref = doc(db, 'gamesaves', `${id}__${uid}`);

  let g;
  try { g = (await import(`./games/mini/${id}.js?v=2`)).default; }
  catch (e) { console.error(e); view.innerHTML = '<div class="box err">Dit spel kon niet laden. Ververs de pagina en probeer het opnieuw.</div>'; return; }
  if (!alive) return;

  const local = () => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
  const flush = async () => {
    if (!pending) return; const p = pending; pending = null; clearTimeout(timer); timer = null;
    try { await setDoc(ref, { game: id, uid, data: p.data, updated: p.updated }); } catch { pending = p; }
  };
  const api = {
    w: 360, h: 640,
    score() {}, end() {},
    async load() {
      let remote = null;
      try { const s = await getDoc(ref); if (s.exists()) remote = s.data(); } catch { /* lokaal gebruiken */ }
      const loc = local(); const pick = loc && (!remote || loc.updated > remote.updated) ? loc : remote;
      if (!pick || !pick.data) return null;
      try { return JSON.parse(pick.data); } catch { return null; }
    },
    save(o) {
      let d; try { d = JSON.stringify(o); } catch { return; }
      if (d.length > 18000) return;
      const p = { data: d, updated: Date.now() };
      try { localStorage.setItem(key, JSON.stringify(p)); } catch { /* ok */ }
      pending = p; if (!timer) timer = setTimeout(flush, CLOUD_EVERY);
    },
    clear() { pending = null; clearTimeout(timer); timer = null; try { localStorage.removeItem(key); } catch { /* ok */ } deleteDoc(ref).catch(() => {}); },
  };

  const style = document.createElement('style');
  style.textContent = '.pz-wrap{display:flex;justify-content:center}.pz-host{position:relative;overflow:hidden;border-radius:16px;background:#0b1026;touch-action:none}';
  document.head.appendChild(style);
  view.innerHTML = '<div class="pz-wrap"><div class="pz-host" id="pz-host"></div></div>';
  const host = view.querySelector('#pz-host');
  const w = Math.min(440, (view.clientWidth || window.innerWidth || 360) - 8);
  const h = Math.max(520, Math.min(760, (window.innerHeight || 700) - 150));
  host.style.width = w + 'px'; host.style.height = h + 'px';
  api.w = w; api.h = h;

  addCleanup(() => {
    alive = false;
    try { inst && inst.destroy && inst.destroy(); } catch (e) { console.error(e); }
    flush().catch(() => {}); style.remove();
  });
  try { inst = g.create(host, api); } catch (e) { console.error(e); host.innerHTML = '<div style="padding:1rem;color:#fff">Dit spel wil nu niet starten.</div>'; }
}
