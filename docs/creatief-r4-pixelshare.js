// Ronde 4 (Creatief): een pixel-tekening (ook animaties) delen als tekstcode, zonder server. Code = "PXA1:" + base64url(JSON).
import * as P from './pixel-core.js?v=1';

const b64e = (s) => { const bytes = new TextEncoder().encode(s); let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b); }); return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const b64d = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s), b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return new TextDecoder().decode(b); };
const isHex = (v) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
export const MAX_CODE = 60000;

export function docToCode(doc, name = '') {
  const item = P.encodeDoc(doc, String(name).slice(0, 30)); delete item.cells; delete item.at;
  return 'PXA1:' + b64e(JSON.stringify(item));
}

// Geeft { doc, name } of null als de code niet klopt of onveilig groot is.
export function codeToDoc(code) {
  try {
    const m = /^\s*PXA1:([A-Za-z0-9_-]+)\s*$/.exec(String(code || '')); if (!m || m[1].length > MAX_CODE) return null;
    const o = JSON.parse(b64d(m[1]));
    if (!o || o.v !== 2 || !P.SIZES.includes(o.size) || !Array.isArray(o.frames) || !o.frames.length || o.frames.length > P.MAX_FRAMES || !Array.isArray(o.layers) || !o.layers.length || o.layers.length > P.MAX_LAYERS) return null;
    if (!Array.isArray(o.pal) || o.pal.length > 256 || !o.pal.every(isHex)) return null;
    if (!o.frames.every((f) => Array.isArray(f) && f.length === o.layers.length && f.every((s) => typeof s === 'string' && s.length < 20000))) return null;
    const item = { v: 2, size: o.size, name: String(o.name || '').slice(0, 30), fps: Math.max(1, Math.min(24, +o.fps || 6)), pal: o.pal, layers: o.layers.map((l, i) => ({ name: String((l && l.name) || 'Laag ' + (i + 1)).slice(0, 20), vis: !l || l.vis !== false })), frames: o.frames };
    const doc = P.decodeDoc(item), n2 = item.size * item.size;
    if (!doc.frames.every((f) => f.every((c) => c.length === n2 && c.every((v) => v === null || isHex(v))))) return null;
    return { doc, name: item.name };
  } catch { return null; }
}
