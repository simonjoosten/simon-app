// Kleine opslag voor app-extra's: eerst lokaal (localStorage), daarna geknepen naar de cloud.
// Cloud-vorm is de bestaande `gamesaves`-vorm: id `${game}__${uid}`, velden exact {game, uid, data(string<=20000), updated}.
// Zuiver (geen DOM/Firebase-import): de aanroeper geeft de cloud-functies mee, zodat dit met node te testen is.
export const MAX_DATA = 19000;

export function makeStore({ game, uid, defaults = {}, ls, cloudGet, cloudSet, now = () => Date.now(), delay = 1500, timer = setTimeout, untimer = clearTimeout }) {
  const key = `app:${game}:${uid}`;
  let state = { ...defaults }, updated = 0, dirty = false, t = null, saving = false;
  const readLocal = () => { try { const o = JSON.parse(ls.getItem(key) || 'null'); return o && typeof o.data === 'string' ? o : null; } catch (e) { return null; } };
  const parse = (s) => { try { const o = JSON.parse(s); return o && typeof o === 'object' && !Array.isArray(o) ? o : null; } catch (e) { return null; } };
  const ser = () => {
    let s = JSON.stringify(state);
    if (s.length > MAX_DATA) { // te groot: oudste lijst-items weghalen (velden die een array zijn met 'log' in de naam)
      const c = { ...state };
      for (const k of Object.keys(c)) if (Array.isArray(c[k]) && /log|hist/i.test(k)) c[k] = c[k].slice(-Math.floor(c[k].length / 2));
      s = JSON.stringify(c); if (s.length <= MAX_DATA) state = c;
    }
    return s.length > MAX_DATA ? '{}' : s;
  };
  const flush = async () => {
    if (t) { untimer(t); t = null; }
    if (!dirty || saving || !cloudSet) return;
    dirty = false; saving = true;
    try { await cloudSet(ser(), updated); } catch (e) { dirty = true; }
    saving = false;
  };
  const touch = () => {
    updated = now(); dirty = true;
    try { ls.setItem(key, JSON.stringify({ data: ser(), updated })); } catch (e) { /* vol/uit */ }
    if (t) untimer(t); t = timer(flush, delay);
  };
  return {
    key,
    get: () => state,
    // Alleen aanroepen met velden; vult state aan en bewaart.
    set(partial) { state = { ...state, ...partial }; touch(); return state; },
    update(fn) { const r = fn(state); touch(); return r; },
    async load() {
      const loc = readLocal(); let rem = null;
      if (cloudGet) { try { rem = await cloudGet(); } catch (e) { rem = null; } }
      const best = loc && (!rem || (loc.updated || 0) >= (rem.updated || 0)) ? loc : rem;
      const o = best ? parse(best.data) : null;
      if (o) { state = { ...defaults, ...o }; updated = best.updated || 0; if (best === loc && rem && (loc.updated || 0) > (rem.updated || 0)) { dirty = true; t = timer(flush, delay); } if (best === loc && !rem && cloudSet) { dirty = true; t = timer(flush, delay); } }
      return state;
    },
    flush,
    isDirty: () => dirty,
  };
}
