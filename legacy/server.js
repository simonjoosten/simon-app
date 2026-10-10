import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

// Laad .env (staat in .gitignore, nooit committen)
if (fs.existsSync('.env')) {
  for (const l of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(l);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

const PORT = process.env.PORT || 3000;
const db = new DatabaseSync(process.env.DB_PATH || 'data.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, code_hash TEXT UNIQUE, role TEXT DEFAULT 'user', status TEXT DEFAULT 'approved', created INTEGER);
  CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER, created INTEGER);
  CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, user_id INTEGER, text TEXT, done INTEGER DEFAULT 0, created INTEGER);
  CREATE TABLE IF NOT EXISTS installed (user_id INTEGER, app TEXT, PRIMARY KEY (user_id, app));
  CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY, user_id INTEGER, text TEXT, created INTEGER);
  CREATE TABLE IF NOT EXISTS notification_reads (user_id INTEGER, notification_id INTEGER, PRIMARY KEY (user_id, notification_id));
`);
try { db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'approved'"); } catch {}

const hash = (s) => crypto.createHash('sha256').update(s).digest('hex');
const norm = (c) => String(c || '').trim().toUpperCase();
const newCode = () => crypto.randomBytes(5).toString('hex').toUpperCase().replace(/(.{5})(.{5})/, '$1-$2');

// App-catalogus. core = altijd aanwezig, admin = alleen voor admin.
const APPS = {
  installer: { name: 'App Installer', core: true },
  notifications: { name: 'Notificaties', core: true },
  lijst: { name: 'Lijst' },
  join: { name: 'Join requests', admin: true },
  notify: { name: 'Notificatie-maker', admin: true, locked: true },
};

const notify = (userId, text) => db.prepare('INSERT INTO notifications (user_id,text,created) VALUES (?,?,?)').run(userId, text, Date.now());
const adminIds = () => db.prepare("SELECT id FROM users WHERE role='admin'").all().map((r) => r.id);

// Admin-account: code uit ADMIN_CODE, anders wordt er één keer een willekeurige geprint.
let adminCode = process.env.ADMIN_CODE;
if (adminCode || !db.prepare("SELECT 1 FROM users WHERE role='admin'").get()) {
  if (!adminCode) { adminCode = newCode(); console.log(`\n=== ADMIN INLOGCODE (eenmalig): ${adminCode} ===\n`); }
  db.prepare("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE role='admin')").run();
  db.prepare("DELETE FROM users WHERE role='admin'").run();
  db.prepare("INSERT INTO users (name, code_hash, role, status, created) VALUES (?,?,?,?,?)").run('Simon', hash(norm(adminCode)), 'admin', 'approved', Date.now());
}
for (const id of adminIds()) for (const a of ['lijst', 'join', 'notify']) db.prepare('INSERT OR IGNORE INTO installed VALUES (?,?)').run(id, a);

const attempts = new Map(); // "soort:ip" -> {n, reset}
function limited(key, max, windowMs) {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || a.reset < now) { attempts.set(key, { n: 1, reset: now + windowMs }); return false; }
  return ++a.n > max;
}
const unlocked = new Map(); // session token -> expiry (Notificatie-maker)

const body = (req) => new Promise((res) => {
  let d = ''; req.on('data', (c) => { d += c; if (d.length > 1e5) req.destroy(); });
  req.on('end', () => { try { res(JSON.parse(d || '{}')); } catch { res({}); } });
});
const send = (res, status, data, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(data));
};
const tokenOf = (req) => (/(?:^|; )session=([a-f0-9]+)/.exec(req.headers.cookie || '') || [])[1];
const userOf = (req) => {
  const t = tokenOf(req);
  if (!t) return null;
  return db.prepare('SELECT u.id,u.name,u.role,u.status FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?').get(t) || null;
};
const clearCookie = 'session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0';

const types = { '.svg': 'image/svg+xml', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  const xff = (req.headers['x-forwarded-for'] || '').split(',').pop().trim();
  const ip = process.env.TRUST_PROXY && xff ? xff : req.socket.remoteAddress;
  const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';

  if (!p.startsWith('/api/')) {
    const file = path.join('public', p === '/' ? 'index.html' : path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
    if (!file.startsWith('public') || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('Niet gevonden'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    return fs.createReadStream(file).pipe(res);
  }

  const user = userOf(req);
  const b = req.method === 'GET' ? {} : await body(req);

  // --- Openbaar ---
  if (p === '/api/signup' && req.method === 'POST') {
    if (limited('signup:' + ip, 5, 3600e3)) return send(res, 429, { error: 'Te veel aanmeldingen, probeer later opnieuw' });
    const name = String(b.name || '').trim().slice(0, 60);
    if (!name) return send(res, 400, { error: 'Naam is verplicht' });
    const code = newCode();
    const r = db.prepare("INSERT INTO users (name, code_hash, status, created) VALUES (?,?,'pending',?)").run(name, hash(norm(code)), Date.now());
    for (const id of adminIds()) notify(id, `Nieuwe join request van ${name}`);
    // Direct inloggen zodat de nieuwe gebruiker op goedkeuring kan wachten.
    const token = crypto.randomBytes(24).toString('hex');
    db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(token, r.lastInsertRowid, Date.now());
    return send(res, 200, { name, code }, { 'Set-Cookie': `session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000${secure}` });
  }
  if (p === '/api/login' && req.method === 'POST') {
    if (limited('login:' + ip, 10, 15 * 60e3)) return send(res, 429, { error: 'Te veel pogingen, probeer later opnieuw' });
    const u = db.prepare('SELECT id FROM users WHERE code_hash=?').get(hash(norm(b.code)));
    if (!u) return send(res, 401, { error: 'Ongeldige code' });
    const token = crypto.randomBytes(24).toString('hex');
    db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(token, u.id, Date.now());
    return send(res, 200, { ok: true }, { 'Set-Cookie': `session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000${secure}` });
  }
  if (p === '/api/logout' && req.method === 'POST') {
    const t = tokenOf(req);
    if (t) { db.prepare('DELETE FROM sessions WHERE token=?').run(t); unlocked.delete(t); }
    return send(res, 200, { ok: true }, { 'Set-Cookie': clearCookie });
  }

  if (!user) return send(res, 401, { error: 'Niet ingelogd' }, { 'Set-Cookie': clearCookie });
  if (p === '/api/me') return send(res, 200, user);
  if (user.status !== 'approved') return send(res, 403, { error: 'Je account is nog niet goedgekeurd' });

  const isAdmin = user.role === 'admin';
  const token = tokenOf(req);
  let m;

  // --- Apps / installer ---
  if (p === '/api/apps' && req.method === 'GET') {
    const mine = new Set(db.prepare('SELECT app FROM installed WHERE user_id=?').all(user.id).map((r) => r.app));
    const unread = db.prepare('SELECT COUNT(*) c FROM notifications n WHERE (n.user_id IS NULL OR n.user_id=?) AND NOT EXISTS (SELECT 1 FROM notification_reads r WHERE r.user_id=? AND r.notification_id=n.id)').get(user.id, user.id).c;
    const pending = isAdmin ? db.prepare("SELECT COUNT(*) c FROM users WHERE status='pending'").get().c : 0;
    return send(res, 200, Object.entries(APPS)
      .filter(([, a]) => !a.admin || isAdmin)
      .map(([id, a]) => ({ id, name: a.name, core: !!a.core, locked: !!a.locked, installed: !!a.core || mine.has(id), badge: id === 'notifications' ? unread : id === 'join' ? pending : 0 })));
  }
  if ((m = /^\/api\/apps\/(\w+)\/install$/.exec(p)) && ['POST', 'DELETE'].includes(req.method)) {
    const a = APPS[m[1]];
    if (!a || a.core || (a.admin && !isAdmin)) return send(res, 404, { error: 'App niet gevonden' });
    if (req.method === 'POST') db.prepare('INSERT OR IGNORE INTO installed VALUES (?,?)').run(user.id, m[1]);
    else db.prepare('DELETE FROM installed WHERE user_id=? AND app=?').run(user.id, m[1]);
    return send(res, 200, { ok: true });
  }

  // --- Notificaties ---
  if (p === '/api/notifications' && req.method === 'GET') {
    return send(res, 200, db.prepare(`SELECT n.id, n.text, n.created, EXISTS (SELECT 1 FROM notification_reads r WHERE r.user_id=? AND r.notification_id=n.id) AS read
      FROM notifications n WHERE n.user_id IS NULL OR n.user_id=? ORDER BY n.id DESC LIMIT 100`).all(user.id, user.id));
  }
  if (p === '/api/notifications/read' && req.method === 'POST') {
    db.prepare('INSERT OR IGNORE INTO notification_reads SELECT ?, id FROM notifications WHERE user_id IS NULL OR user_id=?').run(user.id, user.id);
    return send(res, 200, { ok: true });
  }

  // --- Lijst ---
  if (p === '/api/items') {
    if (req.method === 'GET') return send(res, 200, db.prepare('SELECT i.id,i.text,i.done,u.name AS by FROM items i JOIN users u ON u.id=i.user_id ORDER BY i.id DESC').all());
    if (req.method === 'POST') {
      const text = String(b.text || '').trim().slice(0, 500);
      if (!text) return send(res, 400, { error: 'Tekst is verplicht' });
      db.prepare('INSERT INTO items (user_id,text,created) VALUES (?,?,?)').run(user.id, text, Date.now());
      return send(res, 200, { ok: true });
    }
  }
  if ((m = /^\/api\/items\/(\d+)$/.exec(p))) {
    if (req.method === 'PATCH') db.prepare('UPDATE items SET done = 1 - done WHERE id=?').run(m[1]);
    else if (req.method === 'DELETE') db.prepare('DELETE FROM items WHERE id=?').run(m[1]);
    return send(res, 200, { ok: true });
  }

  // --- Admin ---
  if (!isAdmin) return send(res, 404, { error: 'Niet gevonden' });

  if (p === '/api/users' && req.method === 'GET') {
    return send(res, 200, db.prepare("SELECT id,name,status,created FROM users WHERE role!='admin' AND status IN ('pending','approved') ORDER BY status DESC, id").all());
  }
  if ((m = /^\/api\/users\/(\d+)\/(approve|deny|remove)$/.exec(p)) && req.method === 'POST') {
    const u = db.prepare("SELECT * FROM users WHERE id=? AND role!='admin'").get(m[1]);
    if (!u) return send(res, 404, { error: 'Gebruiker niet gevonden' });
    if (m[2] === 'approve') {
      db.prepare("UPDATE users SET status='approved' WHERE id=?").run(u.id);
      db.prepare('INSERT OR IGNORE INTO installed VALUES (?,?)').run(u.id, 'lijst');
      notify(u.id, 'Welkom! Je join request is goedgekeurd.');
    } else {
      db.prepare('DELETE FROM sessions WHERE user_id=?').run(u.id);
      db.prepare('DELETE FROM installed WHERE user_id=?').run(u.id);
      db.prepare(m[2] === 'deny' ? "UPDATE users SET status='denied' WHERE id=?" : 'DELETE FROM users WHERE id=?').run(u.id);
    }
    return send(res, 200, { ok: true });
  }

  // Notificatie-maker: extra beveiligd met de admincode
  if (p === '/api/notify/unlock' && req.method === 'POST') {
    if (limited('unlock:' + ip, 10, 15 * 60e3)) return send(res, 429, { error: 'Te veel pogingen, probeer later opnieuw' });
    const me = db.prepare('SELECT code_hash FROM users WHERE id=?').get(user.id);
    if (hash(norm(b.code)) !== me.code_hash) return send(res, 401, { error: 'Ongeldige code' });
    unlocked.set(token, Date.now() + 15 * 60e3);
    return send(res, 200, { ok: true });
  }
  if (p.startsWith('/api/notify')) {
    if ((unlocked.get(token) || 0) < Date.now()) return send(res, 403, { error: 'Vergrendeld', locked: true });
    if (p === '/api/notify' && req.method === 'POST') {
      const text = String(b.text || '').trim().slice(0, 500);
      if (!text) return send(res, 400, { error: 'Tekst is verplicht' });
      if (b.to === 'all') db.prepare('INSERT INTO notifications (user_id,text,created) VALUES (NULL,?,?)').run(text, Date.now());
      else if (db.prepare("SELECT 1 FROM users WHERE id=? AND status='approved'").get(b.to)) notify(b.to, text);
      else return send(res, 400, { error: 'Ontvanger niet gevonden' });
      return send(res, 200, { ok: true });
    }
    if (p === '/api/notify/status') return send(res, 200, { ok: true });
  }
  send(res, 404, { error: 'Niet gevonden' });
}).listen(PORT, () => console.log(`simon-app draait op http://localhost:${PORT}`));
