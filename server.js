import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const PORT = process.env.PORT || 3000;
const db = new DatabaseSync(process.env.DB_PATH || 'data.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, code_hash TEXT UNIQUE, role TEXT DEFAULT 'user', created INTEGER);
  CREATE TABLE IF NOT EXISTS requests (id INTEGER PRIMARY KEY, name TEXT, status TEXT DEFAULT 'pending', created INTEGER);
  CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER, created INTEGER);
  CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, user_id INTEGER, text TEXT, done INTEGER DEFAULT 0, created INTEGER);
`);

const hash = (s) => crypto.createHash('sha256').update(s).digest('hex');
const newCode = () => crypto.randomBytes(5).toString('hex').toUpperCase().replace(/(.{5})(.{5})/, '$1-$2');

// Eerste start: maak admin-account en print de code één keer.
if (!db.prepare("SELECT 1 FROM users WHERE role='admin'").get()) {
  const code = newCode();
  db.prepare("INSERT INTO users (name, code_hash, role, created) VALUES (?,?,?,?)").run('Simon', hash(code), 'admin', Date.now());
  console.log(`\n=== ADMIN INLOGCODE (wordt maar één keer getoond): ${code} ===\n`);
}

const attempts = new Map(); // ip -> {n, reset}
function limited(ip) {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || a.reset < now) { attempts.set(ip, { n: 1, reset: now + 15 * 60e3 }); return false; }
  return ++a.n > 10;
}

const body = (req) => new Promise((res) => {
  let d = ''; req.on('data', (c) => { d += c; if (d.length > 1e5) req.destroy(); });
  req.on('end', () => { try { res(JSON.parse(d || '{}')); } catch { res({}); } });
});
const send = (res, status, data, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(data));
};
const userOf = (req) => {
  const m = /(?:^|; )session=([a-f0-9]+)/.exec(req.headers.cookie || '');
  if (!m) return null;
  return db.prepare('SELECT u.id,u.name,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?').get(m[1]) || null;
};

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  const ip = req.socket.remoteAddress;

  if (!p.startsWith('/api/')) {
    const file = path.join('public', p === '/' ? 'index.html' : path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
    if (!file.startsWith('public') || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('Niet gevonden'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    return fs.createReadStream(file).pipe(res);
  }

  const user = userOf(req);
  const b = req.method === 'GET' ? {} : await body(req);

  // Openbaar
  if (p === '/api/request' && req.method === 'POST') {
    const name = String(b.name || '').trim().slice(0, 60);
    if (!name) return send(res, 400, { error: 'Naam is verplicht' });
    db.prepare('INSERT INTO requests (name, created) VALUES (?,?)').run(name, Date.now());
    return send(res, 200, { ok: true });
  }
  if (p === '/api/login' && req.method === 'POST') {
    if (limited(ip)) return send(res, 429, { error: 'Te veel pogingen, probeer later opnieuw' });
    const u = db.prepare('SELECT id FROM users WHERE code_hash=?').get(hash(String(b.code || '').trim().toUpperCase()));
    if (!u) return send(res, 401, { error: 'Ongeldige code' });
    const token = crypto.randomBytes(24).toString('hex');
    db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(token, u.id, Date.now());
    return send(res, 200, { ok: true }, { 'Set-Cookie': `session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000` });
  }
  if (p === '/api/logout' && req.method === 'POST') {
    const m = /session=([a-f0-9]+)/.exec(req.headers.cookie || '');
    if (m) db.prepare('DELETE FROM sessions WHERE token=?').run(m[1]);
    return send(res, 200, { ok: true }, { 'Set-Cookie': 'session=; Path=/; Max-Age=0' });
  }

  if (!user) return send(res, 401, { error: 'Niet ingelogd' });
  if (p === '/api/me') return send(res, 200, user);

  // Items (voorlopig een gedeelde lijst; later uit te breiden)
  if (p === '/api/items') {
    if (req.method === 'GET') return send(res, 200, db.prepare('SELECT i.id,i.text,i.done,u.name AS by FROM items i JOIN users u ON u.id=i.user_id ORDER BY i.id DESC').all());
    if (req.method === 'POST') {
      const text = String(b.text || '').trim().slice(0, 500);
      if (!text) return send(res, 400, { error: 'Tekst is verplicht' });
      db.prepare('INSERT INTO items (user_id,text,created) VALUES (?,?,?)').run(user.id, text, Date.now());
      return send(res, 200, { ok: true });
    }
  }
  let m = /^\/api\/items\/(\d+)$/.exec(p);
  if (m) {
    if (req.method === 'PATCH') db.prepare('UPDATE items SET done = 1 - done WHERE id=?').run(m[1]);
    else if (req.method === 'DELETE') db.prepare('DELETE FROM items WHERE id=?').run(m[1]);
    return send(res, 200, { ok: true });
  }

  // Admin: toegangsaanvragen
  if (user.role === 'admin') {
    if (p === '/api/requests' && req.method === 'GET') return send(res, 200, db.prepare("SELECT id,name,created FROM requests WHERE status='pending' ORDER BY id").all());
    m = /^\/api\/requests\/(\d+)\/(approve|deny)$/.exec(p);
    if (m && req.method === 'POST') {
      const r = db.prepare("SELECT * FROM requests WHERE id=? AND status='pending'").get(m[1]);
      if (!r) return send(res, 404, { error: 'Aanvraag niet gevonden' });
      if (m[2] === 'deny') { db.prepare("UPDATE requests SET status='denied' WHERE id=?").run(r.id); return send(res, 200, { ok: true }); }
      const code = newCode();
      db.prepare('INSERT INTO users (name, code_hash, created) VALUES (?,?,?)').run(r.name, hash(code), Date.now());
      db.prepare("UPDATE requests SET status='approved' WHERE id=?").run(r.id);
      return send(res, 200, { name: r.name, code });
    }
  }
  send(res, 404, { error: 'Niet gevonden' });
}).listen(PORT, () => console.log(`simon-app draait op http://localhost:${PORT}`));
