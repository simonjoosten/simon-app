// Mini-DOM + klok + env-mock voor SPELLEN-A tests (geen browser nodig).
export function installMock() {
  const clock = { t: 0, id: 1, timers: new Map(), raf: new Map() };
  const ctxProxy = () => {
    const store = {};
    return new Proxy(store, {
      get(t, k) {
        if (k in t) return t[k];
        if (k === 'measureText') return () => ({ width: 10 });
        if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} });
        return () => {};
      },
      set(t, k, v) { t[k] = v; return true; },
    });
  };
  class El {
    constructor(tag) {
      this.tagName = String(tag).toUpperCase(); this.children = []; this.parentNode = null; this.style = {}; this.dataset = {};
      this.attrs = {}; this.listeners = {}; this._text = ''; this.className = ''; this.isConnected = true; this.width = 300; this.height = 150;
      const self = this;
      this.classList = {
        add: (...c) => { const s = new Set(self.className.split(/\s+/).filter(Boolean)); c.forEach((x) => s.add(x)); self.className = [...s].join(' '); },
        remove: (...c) => { const s = new Set(self.className.split(/\s+/).filter(Boolean)); c.forEach((x) => s.delete(x)); self.className = [...s].join(' '); },
        toggle: (c, f) => { const has = self.className.split(/\s+/).includes(c); const want = f === undefined ? !has : f; want ? self.classList.add(c) : self.classList.remove(c); return want; },
        contains: (c) => self.className.split(/\s+/).includes(c),
      };
    }
    get firstChild() { return this.children[0] || null; }
    get lastChild() { return this.children[this.children.length - 1] || null; }
    get textContent() { return this._text + this.children.map((c) => c.textContent).join(''); }
    set textContent(v) { this.children = []; this._text = v == null ? '' : String(v); }
    set innerHTML(v) { this.children = []; this._text = String(v); }
    get innerHTML() { return this._text; }
    appendChild(c) { if (c.parentNode) c.parentNode.removeChild(c); c.parentNode = this; this.children.push(c); return c; }
    append(...cs) { cs.forEach((c) => (typeof c === 'string' ? (this._text += c) : this.appendChild(c))); }
    prepend(c) { this.appendChild(c); this.children.unshift(this.children.pop()); }
    insertBefore(c, r) { this.appendChild(c); if (r) { this.children.pop(); const i = this.children.indexOf(r); this.children.splice(i < 0 ? this.children.length : i, 0, c); } return c; }
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); c.parentNode = null; return c; }
    remove() { if (this.parentNode) this.parentNode.removeChild(this); }
    replaceChildren() { this.children = []; }
    setAttribute(k, v) { this.attrs[k] = v; } getAttribute(k) { return this.attrs[k]; }
    addEventListener(t, f) { (this.listeners[t] ||= []).push(f); }
    removeEventListener(t, f) { this.listeners[t] = (this.listeners[t] || []).filter((x) => x !== f); }
    dispatch(t, ev = {}) { (this.listeners[t] || []).slice().forEach((f) => f({ preventDefault() {}, stopPropagation() {}, target: this, currentTarget: this, clientX: 50, clientY: 50, ...ev })); }
    click() { this.dispatch('click'); this.dispatch('pointerdown'); }
    getBoundingClientRect() { return { left: 0, top: 0, width: 360, height: 400, right: 360, bottom: 400 }; }
    getContext() { return (this._ctx ||= ctxProxy()); }
    querySelector() { return null; } querySelectorAll() { return []; }
    focus() {} blur() {} setPointerCapture() {} releasePointerCapture() {}
    contains(c) { while (c) { if (c === this) return true; c = c.parentNode; } return false; }
    all() { const r = [this]; this.children.forEach((c) => r.push(...c.all())); return r; }
  }
  const head = new El('head'), body = new El('body');
  const doc = { createElement: (t) => new El(t), createElementNS: (n, t) => new El(t), createTextNode: (t) => { const e = new El('#text'); e._text = t; return e; }, head, body, addEventListener() {}, removeEventListener() {}, hidden: false, getElementById: () => null };
  Object.assign(globalThis, { document: doc, window: globalThis, devicePixelRatio: 1 });
  globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
  Object.defineProperty(globalThis, 'performance', { value: { now: () => clock.t }, configurable: true, writable: true });
  globalThis.setTimeout = (f, ms = 0) => { const id = clock.id++; clock.timers.set(id, { f, at: clock.t + ms, every: 0 }); return id; };
  globalThis.setInterval = (f, ms = 0) => { const id = clock.id++; clock.timers.set(id, { f, at: clock.t + ms, every: Math.max(1, ms) }); return id; };
  globalThis.clearTimeout = globalThis.clearInterval = (id) => { clock.timers.delete(id); };
  globalThis.requestAnimationFrame = (f) => { const id = clock.id++; clock.raf.set(id, f); return id; };
  globalThis.cancelAnimationFrame = (id) => { clock.raf.delete(id); };
  // spoel de klok vooruit (ms) in stappen van 16 ms
  clock.advance = (ms) => {
    const end = clock.t + ms;
    while (clock.t < end) {
      clock.t = Math.min(end, clock.t + 16);
      for (const [id, tm] of [...clock.timers]) {
        if (!clock.timers.has(id)) continue;
        if (tm.at <= clock.t) { if (tm.every) tm.at += tm.every; else clock.timers.delete(id); tm.f(); }
      }
      const rs = [...clock.raf]; clock.raf.clear();
      rs.forEach(([, f]) => f(clock.t));
    }
  };
  return { clock, doc, El, head, body };
}

// env-mock: ask lost op na korte tijd met een kans acc op goed
export function makeEnv({ acc = 0.8, level = 2, seed = 7, thinkMs = 3000, clock, fx = {} } = {}) {
  let s = seed >>> 0;
  const rand = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const qs = []; for (let i = 0; i < 30; i++) qs.push({ t: 'mc', q: 'Vraag ' + i, a: 'A' + i, o: ['A' + i, 'B', 'C', 'D'], d: 2 });
  const log = { reports: [], ends: [], asks: 0 };
  const env = {
    kit: { id: 'k', name: 'Test', qs }, uid: 'u', name: 'Tester', seed, level, rand, w: 390, h: 700,
    fx: { startCash: 0, cashMult: 1, streakBonus: 0, extraLives: 0, timeBonus: 0, hints: 0, shield: 0, luck: 0, ...fx },
    snd: { play() {}, setOn() {}, on: true }, tts: { speak: () => Promise.resolve(), stop() {}, supported: () => false },
    pick(n) { const r = []; for (let i = 0; i < n; i++) r.push(qs[(log.asks + i) % qs.length]); return r; },
    ask(host, q) {
      log.asks++; let done = false, res;
      const p = new Promise((r) => { res = r; });
      const ok = rand() < acc;
      const tm = setTimeout(() => { done = true; res({ ok, ms: thinkMs, given: ok ? q.a : 'x' }); }, thinkMs);
      return { promise: p, cancel() { clearTimeout(tm); if (!done) res({ ok: false, ms: 0, cancelled: true }); } };
    },
    report(r) { log.reports.push(r); },
    end(r) { log.ends.push(r); },
  };
  return { env, log };
}
