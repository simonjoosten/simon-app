// Alleen voor lokaal testen: een nep-Firestore in het geheugen.
const store = new Map();
const mk = (path) => ({ path, id: path.split('/').pop() });
export const collection = (db, ...seg) => ({ path: seg.join('/'), isCol: true, id: seg[seg.length - 1] });
export const doc = (a, ...seg) => { if (a && a.isCol) return mk(a.path + '/' + (seg[0] || Math.random().toString(36).slice(2))); return mk(seg.join('/')); };
export const where = (f, op, v) => ({ t: 'where', f, op, v });
export const orderBy = (f, d) => ({ t: 'order', f, d });
export const limit = (n) => ({ t: 'limit', n });
export const query = (col, ...c) => ({ col, c });
const snap = (path, data) => ({ id: path.split('/').pop(), ref: mk(path), data: () => data, exists: () => data !== undefined });
export const getDoc = async (ref) => snap(ref.path, store.get(ref.path));
export const setDoc = async (ref, data) => { store.set(ref.path, JSON.parse(JSON.stringify(data))); };
export const deleteDoc = async (ref) => { store.delete(ref.path); };
export const getDocs = async (q) => {
  const col = q.isCol ? q : q.col; const cons = q.isCol ? [] : q.c; const depth = col.path.split('/').length + 1;
  let rows = [...store].filter(([p]) => p.startsWith(col.path + '/') && p.split('/').length === depth).map(([p, d]) => [p, d]);
  for (const c of cons) if (c.t === 'where') rows = rows.filter(([, d]) => (c.op === '==' ? d[c.f] === c.v : true));
  const docs = rows.map(([p, d]) => snap(p, d)); return { docs, size: docs.length, forEach: (f) => docs.forEach(f) };
};
export const __store = store;
