// Huisdier 2.0: sociale/Firebase-module (huisdieren van anderen, cadeaus, munten van Simon, evenement).
//
// Firestore-structuur:
//   pets/{uid}            { data: <JSON-string met huisdier>, updated: <ms> }   (geschreven door huisdier.js)
//   profiles/{uid}        { name }                                              (bestaand; eigenaarsnaam)
//   petgifts/{auto-id}    { to, toName, from, fromName, kind: 'food'|'toy'|'hug'|'coins',
//                           item (max 20), label (max 40), created: <ms>, claimed: bool,
//                           amount?: integer 1-500 (alleen bij kind 'coins') }
//   petevent/current      { title (max 60), mult: 2|3, until: <ms>, by: <uid> }
//   petperms/{ownerUid}   { allow: [uid, ...] (max 10), updated: <ms> }   (alleen de eigenaar schrijft; wie in allow staat mag helpen)
//   pethelps/{auto-id}    { to, toName, from, fromName, action: 'feed'|'play'|'wash'|'sleep'|'pet',
//                           detail (max 30, mag leeg), created: <ms>, applied: bool }
//
// Alle functies zijn async en laten Firestore-fouten (met originele code) door naar de aanroeper.
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDocs, query, where }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const DAY = 86400000;
const GIFT_TTL_DAYS = 30;
const KINDS = ['food', 'toy', 'hug'];

// ---------- Pure hulpfuncties ----------
export function cleanGift(gift) {
  if (!gift || typeof gift !== 'object') throw new Error('Ongeldig cadeau');
  const { kind } = gift;
  if (!KINDS.includes(kind)) throw new Error('Ongeldig soort cadeau');
  const item = String(gift.item ?? '').trim().slice(0, 20);
  const label = String(gift.label ?? '').trim().slice(0, 40);
  if (!item) throw new Error('Cadeau mist een item');
  if (!label) throw new Error('Cadeau mist een label');
  return { kind, item, label };
}

export function isGiftExpired(gift, nowMs = Date.now()) {
  const c = Number(gift && gift.created);
  if (!Number.isFinite(c) || c <= 0) return false;
  return nowMs - c > GIFT_TTL_DAYS * DAY;
}

const requireAdmin = (me) => { if (!me || !me.admin) throw new Error('Alleen admin'); };

// ---------- Huisdieren ----------
export async function listPets(db) {
  const [pets, profs] = await Promise.all([getDocs(collection(db, 'pets')), getDocs(collection(db, 'profiles'))]);
  const names = new Map(profs.docs.map((d) => [d.id, (d.data() || {}).name]));
  return pets.docs.map((d) => {
    const v = d.data() || {};
    return { uid: d.id, name: names.get(d.id) || 'Onbekend', data: v.data, updated: v.updated };
  });
}

export const listAllPetsForAdmin = (db) => listPets(db);

// ---------- Cadeaus ----------
export async function sendGift(db, me, toUid, toName, gift) {
  if (toUid === me.uid) throw new Error('Je kunt jezelf geen cadeau sturen');
  const g = cleanGift(gift);
  return addDoc(collection(db, 'petgifts'), {
    to: toUid, toName, from: me.uid, fromName: me.name, kind: g.kind, item: g.item, label: g.label,
    created: Date.now(), claimed: false,
  });
}

export async function listInbox(db, me) {
  const s = await getDocs(query(collection(db, 'petgifts'), where('to', '==', me.uid)));
  return s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.created || 0) - (a.created || 0));
}

export async function claimGift(db, me, giftId) {
  const ref = doc(db, 'petgifts', giftId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Cadeau bestaat niet meer');
  const g = snap.data();
  if (g.to !== me.uid) throw new Error('Dit cadeau is niet voor jou');
  if (g.claimed) throw new Error('Cadeau is al opgehaald');
  await updateDoc(ref, { claimed: true });
  return { id: giftId, ...g, claimed: true };
}

export async function adminCoins(db, me, toUid, toName, amount) {
  requireAdmin(me);
  const n = Number(amount);
  if (!Number.isInteger(n) || n < 1 || n > 500) throw new Error('Aantal munten moet een geheel getal van 1 tot 500 zijn');
  return addDoc(collection(db, 'petgifts'), {
    to: toUid, toName, from: me.uid, fromName: me.name, kind: 'coins', item: '🪙',
    label: `${n} munten van Simon`, amount: n, created: Date.now(), claimed: false,
  });
}

// ---------- Evenement ----------
export async function getEvent(db) {
  const s = await getDoc(doc(db, 'petevent', 'current'));
  if (!s.exists()) return null;
  const ev = s.data();
  if (!ev) return null;
  if (Number(ev.until) < Date.now()) return null;
  return ev;
}

export async function setEvent(db, me, ev) {
  requireAdmin(me);
  const ref = doc(db, 'petevent', 'current');
  if (ev === null) return deleteDoc(ref);
  const title = String(ev.title ?? '').trim().slice(0, 60);
  const mult = Number(ev.mult);
  const until = Number(ev.until);
  if (!title) throw new Error('Evenement mist een titel');
  if (mult !== 2 && mult !== 3) throw new Error('Vermenigvuldiger moet 2 of 3 zijn');
  if (!Number.isFinite(until)) throw new Error('Ongeldige einddatum');
  return setDoc(ref, { title, mult, until, by: me.uid });
}

// ---------- Helpen (alleen met toestemming van de eigenaar) ----------
const ACTIONS = ['feed', 'play', 'wash', 'sleep', 'pet'];

export function cleanHelp(help) {
  if (!help || typeof help !== 'object') throw new Error('Ongeldige hulp');
  if (!ACTIONS.includes(help.action)) throw new Error('Ongeldige hulpactie');
  return { action: help.action, detail: String(help.detail ?? '').trim().slice(0, 30) };
}

export async function getPerms(db, ownerUid) {
  const s = await getDoc(doc(db, 'petperms', ownerUid));
  const a = s.exists() && s.data() && Array.isArray(s.data().allow) ? s.data().allow : [];
  return { allow: a };
}

export async function setPerms(db, me, allowUids) {
  if (!Array.isArray(allowUids)) throw new Error('Ongeldige lijst');
  const allow = [...new Set(allowUids.map((u) => String(u)).filter((u) => u && u !== me.uid))];
  if (allow.length > 10) throw new Error('Maximaal 10 vrienden');
  return setDoc(doc(db, 'petperms', me.uid), { allow, updated: Date.now() });
}

// action: string, of { action, detail }; detail mag ook als 6e argument.
export async function sendHelp(db, me, toUid, toName, action, detail) {
  if (toUid === me.uid) throw new Error('Je kunt jezelf niet helpen');
  const h = cleanHelp(action && typeof action === 'object' ? action : { action, detail });
  const { allow } = await getPerms(db, toUid);
  if (!allow.includes(me.uid)) throw new Error('Je hebt geen toestemming om te helpen');
  return addDoc(collection(db, 'pethelps'), {
    to: toUid, toName, from: me.uid, fromName: me.name, action: h.action, detail: h.detail,
    created: Date.now(), applied: false,
  });
}

export async function listHelps(db, me) {
  const s = await getDocs(query(collection(db, 'pethelps'), where('to', '==', me.uid)));
  return s.docs.map((d) => ({ id: d.id, ...d.data() })).filter((h) => h.applied === false)
    .sort((a, b) => (a.created || 0) - (b.created || 0));
}

export async function markHelpApplied(db, me, helpId) {
  const ref = doc(db, 'pethelps', helpId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Hulp bestaat niet meer');
  if (snap.data().to !== me.uid) throw new Error('Deze hulp is niet voor jou');
  await updateDoc(ref, { applied: true });
}
