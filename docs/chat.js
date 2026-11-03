// Chat-app: vrienden toevoegen, accepteren/blokkeren, berichten met emoji's, GIF's, foto's en filmpjes, plus stickers (3D-iconen),
// reacties, antwoorden, gelezen-status, zoeken, thema's en spraakberichten. Stickers/reacties/antwoorden reizen als tekstbericht met
// verborgen opmaak; spraakberichten zijn type 'video' met een audio-mime (de Firestore-regels blijven ongewijzigd).
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDocs, query, where, orderBy, limit, onSnapshot }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { GIPHY_KEY } from './firebase-config.js';
import { injectKit, head, wireHead, tabsHtml, ic, showToast } from './appkit.js?v=1';
import * as CC from './chat-core.js?v=1';

export const pairId = CC.pairId;
const CHUNK = CC.CHUNK; // deelbaar door 3, zodat base64-stukjes aan elkaar passen
const MAX_VIDEO = CC.MAX_VIDEO;

const EMOJI = {
  '😀': '😀😃😄😁😆😅😂🤣😊😇🙂😉😍🥰😘😋😛😜🤪😎🤩🥳😏😒😞😔😟😕🙁😣😖😫😩🥺😢😭😤😠😡🤬🤯😳🥵🥶😱😨😰😥😓🤗🤔🤭🤫🙄😬😴😪🤤😵🤢🤮🤧😷',
  '👍': '👍👎👊✊👏🙌🤝🙏✌️🤞🤟🤘👌👈👉👆👇☝️✋💪👀🧠',
  '❤️': '❤️🧡💛💚💙💜🖤🤍💔💕💞💓💗💖💘💝🔥✨⭐🌟💯💥💫🎉🎊🎈🎁🏆🥇',
  '🐶': '🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🐔🐧🦄🐢🐍🦈🐬',
  '🍕': '🍕🍔🍟🌭🍿🍩🍪🍫🍦🍺🥤☕🍎🍌🍓🍉',
  '🚗': '🚗🚕🚓🚑🚒🏎️🚀✈️🚲⚽🏀🎮🎧🎵🎬📸',
};
// Categorieën voor GIF's: Nederlandse naam -> Engelse zoekterm (GIPHY zoekt in het Engels)
const GIF_CATS = [
  // Groeten & praten
  ['🔥 Populair', ''], ['👋 Hoi', 'hello wave'], ['👋 Doei', 'bye goodbye'], ['☀️ Goedemorgen', 'good morning'], ['🌙 Welterusten', 'good night'],
  ['🙏 Bedankt', 'thank you'], ['🤝 Graag gedaan', 'you are welcome'], ['🙇 Sorry', 'sorry apology'], ['👍 Goed zo', 'thumbs up'], ['👎 Nee', 'thumbs down'],
  ['✅ Ja', 'yes nod'], ['🚫 Nee hoor', 'no way shake head'], ['🤷 Weet ik niet', 'shrug'], ['❓ Wat?', 'what confused'], ['🤔 Hmm', 'thinking'],
  ['🙄 Ja hoor', 'eye roll'], ['😏 Slim', 'smirk'], ['🤫 Sssst', 'shush quiet'], ['👀 Kijk', 'looking watching'], ['😳 Oeps', 'awkward embarrassed'],
  // Gevoelens
  ['😂 Lachen', 'laughing'], ['🤣 Dubbel liggen', 'dying laughing'], ['😊 Blij', 'happy'], ['🥳 Feest', 'party celebrate'], ['😍 Verliefd', 'in love heart eyes'],
  ['❤️ Liefde', 'love heart'], ['😘 Kusje', 'kiss'], ['🤗 Knuffel', 'hug'], ['😭 Huilen', 'crying'], ['🥺 Verdrietig', 'sad'],
  ['😡 Boos', 'angry'], ['🤬 Woedend', 'furious rage'], ['😤 Gefrustreerd', 'frustrated'], ['😱 Schrik', 'scared scream'], ['😨 Bang', 'afraid'],
  ['😮 Wow', 'wow shocked'], ['🤯 Mind blown', 'mind blown'], ['🥱 Moe', 'sleepy tired'], ['😴 Slapen', 'sleeping'], ['🤒 Ziek', 'sick'],
  ['🤢 Vies', 'disgusted'], ['😎 Cool', 'cool sunglasses'], ['💪 Sterk', 'strong flex'], ['😅 Zenuwachtig', 'nervous sweating'], ['😌 Opgelucht', 'relieved'],
  ['😬 Awkward', 'awkward cringe'], ['🤩 Geweldig', 'amazing excited'], ['🥹 Ontroerd', 'touched emotional'], ['😈 Stout', 'naughty mischief'], ['🤪 Gek', 'crazy silly'],
  // Reacties & acties
  ['👏 Applaus', 'applause clapping'], ['🎉 Gefeliciteerd', 'congratulations'], ['🎂 Verjaardag', 'happy birthday'], ['🏆 Winnaar', 'winner victory'], ['🙌 Yes!', 'celebration yes'],
  ['🤦 Facepalm', 'facepalm'], ['😤 Pfff', 'annoyed ugh'], ['🙈 Beschaamd', 'embarrassed hide'], ['🫡 Salute', 'salute'], ['🤞 Succes', 'good luck fingers crossed'],
  ['💃 Dansen', 'dance'], ['🕺 Feestdans', 'party dance'], ['🏃 Rennen', 'running'], ['🚶 Wandelen', 'walking'], ['🤸 Springen', 'jumping'],
  ['⏰ Te laat', 'late hurry'], ['⏳ Wachten', 'waiting'], ['🍿 Popcorn', 'popcorn watching'], ['🔥 Lekker bezig', 'fire nice job'], ['💥 Boem', 'explosion'],
  ['🤡 Gekkigheid', 'clown funny'], ['💤 Saai', 'bored'], ['🙃 Ironisch', 'sarcasm'], ['🎤 Mic drop', 'mic drop'], ['🧠 Slim', 'smart genius'],
  // Eten & drinken
  ['🍕 Pizza', 'pizza'], ['🍔 Hamburger', 'burger'], ['🍟 Friet', 'french fries'], ['🍪 Koekjes', 'cookies'], ['🍫 Chocolade', 'chocolate'],
  ['🍦 IJs', 'ice cream'], ['🍺 Bier', 'beer cheers'], ['☕ Koffie', 'coffee'], ['🥤 Drinken', 'drinking'], ['😋 Lekker', 'yummy delicious'],
  // Dieren
  ['🐶 Hond', 'dog'], ['🐱 Kat', 'cat'], ['🐹 Schattig', 'cute animals'], ['🦆 Eend', 'duck'], ['🐵 Aap', 'monkey'],
  // Sport & spelletjes
  ['⚽ Voetbal', 'soccer football'], ['🏀 Basketbal', 'basketball'], ['🎮 Gamen', 'gaming'], ['🏎️ Racen', 'racing'], ['🚗 Auto', 'car'],
  // Overig
  ['🤖 Robot', 'robot'], ['👽 Alien', 'alien'], ['👻 Spook', 'ghost'], ['🎬 Film', 'movie scene'], ['💰 Geld', 'money rich'],
  ['🌧️ Regen', 'rain'], ['☀️ Zon', 'sunshine summer'], ['❄️ Sneeuw', 'snow winter'], ['🎄 Kerst', 'christmas'], ['🎃 Halloween', 'halloween'],
];
const seg = (str) => [...new Intl.Segmenter().segment(str)].map((x) => x.segment);

export const resizeImage = (file, max = 1024) => new Promise((res, rej) => {
  const img = new Image(); const url = URL.createObjectURL(file);
  img.onload = () => {
    let { width: w, height: h } = img; const k = Math.min(1, max / Math.max(w, h)); w = Math.round(w * k); h = Math.round(h * k);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(img, 0, 0, w, h);
    let q = 0.78, out = cv.toDataURL('image/jpeg', q);
    while (out.length > 800000 && q > 0.3) { q -= 0.1; out = cv.toDataURL('image/jpeg', q); }
    URL.revokeObjectURL(url); out.length > 850000 ? rej(new Error('Foto is te groot')) : res(out);
  };
  img.onerror = () => rej(new Error('Foto kon niet gelezen worden')); img.src = url;
});
const readB64 = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
const b64ToBytes = (b64) => { const bin = atob(b64); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; };
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* vol */ } };

// Badge voor het homescherm: onbeantwoorde verzoeken + ongelezen gesprekken.
export function watchChatBadge({ db, me, live }, setBadge) {
  live(query(collection(db, 'friendships'), where('members', 'array-contains', me.uid)), (sn) => {
    let n = 0;
    sn.docs.forEach((d) => {
      const f = d.data();
      if (f.status === 'pending' && f.requester !== me.uid) n++;
      else if (f.status === 'accepted' && f.lastFrom && f.lastFrom !== me.uid && (f.lastAt || 0) > ((f.reads || {})[me.uid] || 0)) n++;
    });
    setBadge('chat', n);
  });
}

const CSS = `<style>
.cc-av{width:calc(48px*var(--gfx-scale,1));height:calc(48px*var(--gfx-scale,1));min-width:calc(48px*var(--gfx-scale,1));border-radius:50%;color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:1.2em}
.cc-wrap{--m1:#6366f1;--m2:#8b5cf6;--mt:#fff;--th:#fff;--tt:#1f2330;--b1:#f4f5fb;--b2:#e9ebf7}
.cc-msgs{min-height:52vh;max-height:60vh;overflow-y:auto;display:flex;flex-direction:column;gap:2px;padding:.7rem .5rem;border-radius:20px;background:linear-gradient(160deg,var(--b1),var(--b2));-webkit-overflow-scrolling:touch}
html[data-gfx-q="1"] .cc-msgs,html[data-gfx-q="2"] .cc-msgs{box-shadow:inset 0 0 60px rgba(255,255,255,.12)}
.cc-sep{align-self:center;font-size:.72rem;background:rgba(0,0,0,.25);color:#fff;padding:.15rem .7rem;border-radius:99px;margin:.5rem 0}
.cc-sep.fresh{background:var(--m1)}
.cc-row{display:flex;flex-direction:column;max-width:84%;align-self:flex-start;margin-top:1px}
.cc-row.me{align-self:flex-end;align-items:flex-end}
.cc-row.first{margin-top:6px}
.cc-b{background:var(--th);color:var(--tt);padding:.5rem .75rem;border-radius:18px;border-bottom-left-radius:6px;word-wrap:break-word;overflow-wrap:anywhere;font-size:calc(1rem*var(--gfx-font,1));cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.12)}
.cc-row.me .cc-b{background:linear-gradient(135deg,var(--m1),var(--m2));color:var(--mt);border-radius:18px;border-bottom-right-radius:6px}
.cc-row:not(.first) .cc-b{border-top-left-radius:6px}.cc-row.me:not(.first) .cc-b{border-top-left-radius:18px;border-top-right-radius:6px}
.cc-b img.m{max-width:100%;border-radius:12px;display:block;max-height:50vh}
.cc-b.big{font-size:2.6rem;background:none;box-shadow:none;padding:0 .2rem}
.cc-b mark{background:#fde047;color:#111;border-radius:4px}
.cc-st{padding:.1rem;cursor:pointer}
.cc-meta{font-size:.68rem;opacity:.7;margin:1px 6px 0;color:var(--tt)}
.cc-wrap.dark .cc-meta{color:#fff}
.cc-rx{display:flex;gap:3px;margin:-8px 8px 2px;flex-wrap:wrap}
.cc-rx span{background:var(--card);border:1px solid var(--line);border-radius:99px;padding:0 .4rem;font-size:.82rem;box-shadow:0 1px 2px rgba(0,0,0,.15)}
.cc-q{border-left:3px solid currentColor;opacity:.8;padding:.1rem .5rem;margin-bottom:.3rem;font-size:.82em;border-radius:4px;background:rgba(0,0,0,.08)}
.cc-bar{display:flex;gap:.4rem;align-items:center;margin:.5rem 0}
.cc-bar input[type=text],.cc-bar input:not([type]){flex:1;min-height:48px;border-radius:24px;padding:.5rem 1rem}
.cc-btn{min-width:48px;min-height:48px;border-radius:50%;padding:0;font-size:1.25rem;display:flex;align-items:center;justify-content:center}
.cc-sheet{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:.6rem;margin:.5rem 0}
.cc-sheet .rxs{display:flex;gap:.2rem;justify-content:space-around}
.cc-sheet .rxs button{font-size:1.6rem;min-width:48px;min-height:48px;border-radius:50%;padding:0}
.cc-sheet .rxs button.on{background:var(--accent)}
.cc-rec{display:flex;align-items:center;gap:.6rem;background:#fee2e2;color:#991b1b;border-radius:24px;padding:.4rem .8rem;margin:.5rem 0}
.cc-rec i{width:12px;height:12px;border-radius:50%;background:#dc2626;animation:cc-p 1s infinite}
@keyframes cc-p{50%{opacity:.25}}
html[data-reduce="1"] .cc-rec i{animation:none}
.cc-sw{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem}
.cc-sw button{min-height:64px;border-radius:16px;color:#fff;font-weight:600;border:3px solid transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:.85rem}
.cc-sw button.sel{border-color:var(--ink)}
.cc-stk{display:grid;grid-template-columns:repeat(4,1fr);gap:.3rem;max-height:15rem;overflow:auto}
.cc-stk button{background:none;border:0;padding:.2rem;min-height:64px}
.cc-unread{display:inline-block;min-width:22px;height:22px;border-radius:11px;background:var(--accent);color:#fff;font-size:.75rem;text-align:center;line-height:22px;padding:0 5px}
</style>`;

export async function chatView(c) {
  const { db, me, live, $, esc, nice, isAdmin, stop } = c;
  injectKit();
  let friends = [], profiles = new Map(), tab = 'chats', open = null; // open = { pid, other }
  const view = $('#view');

  const loadProfiles = async () => { const s = await getDocs(collection(db, 'profiles')); profiles = new Map(s.docs.map((d) => [d.id, d.data().name])); };
  const nameOf = (uid) => profiles.get(uid) || 'Onbekend';
  const otherOf = (f) => f.members.find((x) => x !== me.uid);
  const when = (t) => (t ? new Date(t).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
  const avatar = (name, size) => `<div class="cc-av" style="background:${CC.avatarColor(name)}${size ? `;width:${size}px;height:${size}px;min-width:${size}px;font-size:${Math.round(size * 0.45)}px` : ''}">${esc(CC.initial(name))}</div>`;

  await loadProfiles();
  live(query(collection(db, 'friendships'), where('members', 'array-contains', me.uid)), (sn) => {
    friends = sn.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (!open) drawList();
  }, (e) => { view.innerHTML = `<div class="box err">${esc(nice(e))}</div>`; });

  /* ----- lijst / verzoeken / toevoegen ----- */
  function drawList() {
    const incoming = friends.filter((f) => f.status === 'pending' && f.requester !== me.uid);
    const chats = friends.filter((f) => f.status === 'accepted').sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));
    const blocked = friends.filter((f) => f.status === 'blocked' && f.blockedBy === me.uid);
    const outgoing = friends.filter((f) => f.status === 'pending' && f.requester === me.uid);
    let body = '';
    if (tab === 'chats') {
      body = chats.length ? chats.map((f) => {
        const unread = f.lastFrom && f.lastFrom !== me.uid && (f.lastAt || 0) > ((f.reads || {})[me.uid] || 0);
        const nm = nameOf(otherOf(f)), mineLast = f.lastFrom === me.uid;
        return `<div class="ak-card" data-open="${f.id}" style="cursor:pointer;display:flex;gap:.8rem;align-items:center;margin:.5rem 0">${avatar(nm)}<div style="flex:1;min-width:0"><b>${esc(nm)}</b><br><small style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${unread ? 'font-weight:700' : 'opacity:.75'}">${mineLast ? (((f.reads || {})[otherOf(f)] || 0) >= (f.lastAt || 0) ? '✓✓ ' : '✓ ') : ''}${esc(CC.cleanLast(f.last) || 'Zeg hoi 👋')}</small></div>${unread ? '<span class="cc-unread">●</span>' : `<small>${when(f.lastAt)}</small>`}</div>`;
      }).join('') : '<div class="ak-card"><small>Nog geen gesprekken. Voeg iemand toe via het tabblad Toevoegen.</small></div>';
      if (blocked.length) body += `<div class="ak-card"><b>Geblokkeerd</b>${blocked.map((f) => `<div class="row"><span style="flex:1">${esc(nameOf(otherOf(f)))}</span><button data-unblock="${f.id}">Deblokkeer</button></div>`).join('')}</div>`;
      if (isAdmin && !GIPHY_KEY) body += '<div class="ak-card"><b>GIF-sleutel (Simon)</b><div id="gkey"></div></div>';
    } else if (tab === 'req') {
      body = `<div class="ak-card"><b>Verzoeken aan jou</b>${incoming.length ? incoming.map((f) => `<div class="row wrap">${avatar(nameOf(f.requester), 36)}<span style="flex:1">${esc(nameOf(f.requester))}</span><button class="pri ak-big" data-acc="${f.id}">Accepteer</button><button class="ak-big" data-blk="${f.id}">Blokkeer</button></div>`).join('') : '<br><small>Geen verzoeken.</small>'}</div>
        ${outgoing.length ? `<div class="ak-card"><b>Verstuurd</b>${outgoing.map((f) => `<div class="row"><span style="flex:1">${esc(nameOf(otherOf(f)))} <small>wacht op antwoord</small></span><button data-cancel="${f.id}">Annuleer</button></div>`).join('')}</div>` : ''}`;
    } else {
      const taken = new Set(friends.map(otherOf));
      const people = [...profiles].filter(([uid]) => uid !== me.uid && !taken.has(uid)).sort((a, b) => a[1].localeCompare(b[1]));
      body = `<div class="ak-card"><b>Mensen toevoegen</b><div class="row"><input id="find" placeholder="Zoek op naam" style="min-height:48px"></div><div id="people">${people.map(([uid, n]) => `<div class="row" data-n="${esc(n.toLowerCase())}">${avatar(n, 40)}<span style="flex:1">${esc(n)}</span><button class="pri ak-big" data-add="${uid}">Toevoegen</button></div>`).join('') || '<small>Er is niemand anders om toe te voegen.</small>'}</div></div>`;
    }
    view.innerHTML = `${CSS}<div class="ak">${head({ icon: 'bell', title: 'Chat', sub: `${chats.length} gesprekken${incoming.length ? ` · ${incoming.length} verzoek` : ''}`, c1: '#06b6d4', c2: '#0e7490' })}${tabsHtml(tab, [['chats', 'Chats', 'bell'], ['req', `Verzoeken${incoming.length ? ` (${incoming.length})` : ''}`, 'heart'], ['add', 'Toevoegen', 'star']])}${body}</div>`;
    wireHead(view);
    view.querySelectorAll('[data-tab]').forEach((b) => b.onclick = async () => { tab = b.dataset.tab; if (tab === 'add') await loadProfiles(); drawList(); });
    const run = (p) => p.catch((e) => alert(nice(e)));
    view.querySelectorAll('[data-open]').forEach((b) => b.onclick = () => openChat(friends.find((f) => f.id === b.dataset.open)));
    view.querySelectorAll('[data-acc]').forEach((b) => b.onclick = () => run(updateDoc(doc(db, 'friendships', b.dataset.acc), { status: 'accepted', blockedBy: null })));
    view.querySelectorAll('[data-blk]').forEach((b) => b.onclick = () => run(updateDoc(doc(db, 'friendships', b.dataset.blk), { status: 'blocked', blockedBy: me.uid })));
    view.querySelectorAll('[data-unblock]').forEach((b) => b.onclick = () => run(updateDoc(doc(db, 'friendships', b.dataset.unblock), { status: 'accepted', blockedBy: null })));
    view.querySelectorAll('[data-cancel]').forEach((b) => b.onclick = () => run(deleteDoc(doc(db, 'friendships', b.dataset.cancel))));
    view.querySelectorAll('[data-add]').forEach((b) => b.onclick = () => run((async () => {
      const other = b.dataset.add; b.disabled = true;
      await setDoc(doc(db, 'friendships', pairId(me.uid, other)), { members: [me.uid, other].sort(), requester: me.uid, status: 'pending', blockedBy: null, last: '', lastAt: 0, lastFrom: '', reads: {} });
      tab = 'req'; drawList();
    })()));
    if ($('#find')) $('#find').oninput = (e) => { const q = e.target.value.trim().toLowerCase(); document.querySelectorAll('#people [data-n]').forEach((r) => r.style.display = r.dataset.n.includes(q) ? '' : 'none'); };
    if ($('#gkey')) giphyAdmin();
  }

  async function giphyAdmin() {
    const cur = (await getDoc(doc(db, 'config', 'giphy'))).data()?.key || '';
    $('#gkey').innerHTML = `<small>Voor GIF's: maak een gratis sleutel op developers.giphy.com (Create an API Key) en plak hem hier. ${cur ? 'Er is al een sleutel ingesteld.' : 'Er is nog geen sleutel.'}</small>
      <div class="row"><input id="gk" placeholder="GIPHY-sleutel" value="${esc(cur)}"><button id="gks">Opslaan</button></div>`;
    $('#gks').onclick = async () => { await setDoc(doc(db, 'config', 'giphy'), { key: $('#gk').value.trim() }); $('#gks').textContent = 'Opgeslagen ✓'; };
  }

  /* ----- gesprek ----- */
  function openChat(f) {
    stop(); // alleen de luisteraars van dit gesprek
    open = { pid: f.id, other: otherOf(f) };
    const other = nameOf(open.other), pid = f.id;
    let fdoc = f, live80 = [], older = [], noMore = false, pending = [], replyTo = null, term = '', searchOn = false;
    let theme = CC.themeOf(lsGet(`chat:theme:${pid}`, 'standaard'));
    const unreadAfter = (f.reads || {})[me.uid] || 0;
    let recent = []; try { recent = JSON.parse(lsGet('chat:recent', '[]')) || []; } catch (e) { recent = []; }
    let packId = CC.STICKER_PACKS[0].id, rec = null, sheetFor = null;
    const canVoice = typeof MediaRecorder !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    const themeVars = () => `--m1:${theme.mine[0]};--m2:${theme.mine[1]};--mt:${theme.mineText};--th:${theme.theirs};--tt:${theme.theirsText};--b1:${theme.bg[0]};--b2:${theme.bg[1]}`;

    view.innerHTML = `${CSS}<div class="ak cc-wrap ${theme.dark ? 'dark' : ''}" id="ccw" style="${themeVars()}">
      <div class="ak-head" style="--ak1:${theme.mine[0]};--ak2:${theme.mine[1]};padding:.6rem .8rem"><button id="back" aria-label="Terug" style="font-size:1.4rem">‹</button>${avatar(other, 44)}<div class="t"><b style="font-size:1.1em">${esc(other)}</b><small id="cc-sub"></small></div><button id="srchb" aria-label="Zoeken">🔍</button><button id="themeb" aria-label="Thema">🎨</button><button data-ak-set aria-label="Instellingen">⚙️</button><button id="menu" aria-label="Meer">⋯</button></div>
      <div id="srchrow" style="display:none"><div class="row"><input id="srchin" placeholder="Zoek in dit gesprek" style="min-height:48px"><small id="srchn"></small></div></div>
      <div class="cc-msgs" id="msgs"></div>
      <div id="sheet"></div><div id="panel"></div><div id="recbar"></div>
      <div id="replybar"></div>
      <div id="status"><small></small></div>
      <div class="cc-bar"><button class="cc-btn" id="plus" aria-label="Meer opties">＋</button><button class="cc-btn" id="emo" aria-label="Emoji">😊</button><input id="txt" placeholder="Bericht" maxlength="2000" autocomplete="off"><button class="cc-btn pri" id="send" aria-label="Verstuur">➤</button>${canVoice ? '<button class="cc-btn" id="mic" aria-label="Spraakbericht" style="display:none">🎤</button>' : ''}</div>
      <input type="file" id="file" accept="image/*,video/*" style="display:none"><input type="file" id="filecam" accept="image/*" capture="environment" style="display:none"><input type="file" id="filevid" accept="video/*" capture style="display:none"></div>`;
    wireHead(view);
    const q = (s) => view.querySelector(s);
    const stopRecNow = () => { if (rec) { try { rec.mr.onstop = null; rec.mr.stop(); } catch (e) { /* */ } rec.stream.getTracks().forEach((t) => t.stop()); clearInterval(rec.timer); rec = null; } };
    const back = async () => { stopRecNow(); stop(); open = null; live(query(collection(db, 'friendships'), where('members', 'array-contains', me.uid)), (sn) => { friends = sn.docs.map((d) => ({ id: d.id, ...d.data() })); if (!open) drawList(); }); drawList(); };
    q('#back').onclick = back;
    q('#menu').onclick = () => { if (confirm(`${other} blokkeren? Jullie kunnen dan niet meer chatten.`)) updateDoc(doc(db, 'friendships', pid), { status: 'blocked', blockedBy: me.uid }).then(back).catch((e) => alert(nice(e))); };

    const msgsRef = collection(db, 'chats', pid, 'messages');
    const markRead = () => updateDoc(doc(db, 'friendships', pid), { [`reads.${me.uid}`]: Date.now() }).catch(() => {});
    const allMsgs = () => { const m = new Map(); [...older, ...live80].forEach((x) => m.set(x.id, x)); return [...m.values()].sort((a, b) => (a.created || 0) - (b.created || 0)); };
    const otherRead = () => ((fdoc.reads || {})[open.other] || 0);
    const byId = (id) => allMsgs().find((x) => x.id === id);

    /* ---- tekenen ---- */
    function bubbleHtml(row, rmap, all) {
      const m = row.m, p = CC.parseMsg(m), mine = row.mine; let inner = '', big = false;
      const rx = rmap.get(m.id) || [];
      if (p.kind === 'sticker') {
        inner = `<div class="cc-st pop" data-act="${m.id}">${ic(p.name, { size: 124 })}</div>`;
      } else {
        if (p.kind === 'text') {
          if (p.quote) { const t = byId(p.quote); inner += `<div class="cc-q"><b>${t ? (t.from === me.uid ? 'Jij' : esc(other)) : ''}</b> ${t ? esc(CC.previewOf(t)) : 'Bericht'}</div>`; }
          big = !p.quote && CC.emojiOnly(p.text);
          inner += CC.highlight(esc(p.text).replace(/\n/g, '<br>'), term);
        } else if (p.kind === 'image') inner = `<img class="m" src="${m.data}" alt=""><a href="${m.data}" download="foto-${m.id}.jpg" style="color:inherit;font-size:.8rem">⬇ Opslaan</a>`;
        else if (p.kind === 'gif') inner = `<img class="m" src="${esc(m.url)}" alt="GIF"><a href="${esc(m.url)}" target="_blank" rel="noopener" style="color:inherit;font-size:.8rem">⬇ Openen</a>`;
        else if (p.kind === 'voice') inner = `<button data-vid="${m.id}" data-parts="${m.parts}" data-mime="${esc(m.mime)}" data-voice="1" style="min-height:44px">▶ 🎤 Spraakbericht</button><div data-vbox="${m.id}"></div>`;
        else if (p.kind === 'video') inner = `<button data-vid="${m.id}" data-parts="${m.parts}" data-mime="${esc(m.mime || 'video/mp4')}" style="min-height:44px">▶ Filmpje laden en bekijken</button><div data-vbox="${m.id}"></div>`;
        inner = `<div class="cc-b ${big ? 'big' : ''}" data-act="${m.id}">${inner}</div>`;
      }
      const tick = mine ? ` ${CC.receipt(m, otherRead()) === 'gelezen' ? '<span title="Gelezen" style="color:#38bdf8">✓✓</span>' : '✓'}` : '';
      const meta = row.last ? `<div class="cc-meta">${CC.clockOf(m.created)}${tick}</div>` : '';
      const rxh = rx.length ? `<div class="cc-rx">${rx.map((r) => `<span>${r.emoji}${r.uids.length > 1 ? ` ${r.uids.length}` : ''}</span>`).join('')}</div>` : '';
      return `<div class="cc-row ${mine ? 'me' : ''} ${row.first ? 'first' : ''}" data-m="${m.id}">${inner}${rxh}${meta}</div>`;
    }
    function render(stick) {
      const box = q('#msgs'); if (!box) return;
      const atEnd = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
      const all = allMsgs(), rmap = CC.reactionsMap(all);
      let vis = CC.visibleMessages(all);
      if (term.trim()) vis = CC.searchMessages(vis, term);
      const rows = CC.layout(vis, { me: me.uid, unreadAfter: term.trim() ? null : unreadAfter });
      const loadMore = !noMore && live80.length >= 80 && !term.trim() ? '<button id="older" style="align-self:center;margin:.3rem">Eerdere berichten laden</button>' : '';
      box.innerHTML = loadMore + (rows.map((r) => (r.sep ? `<div class="cc-sep ${r.fresh ? 'fresh' : ''}">${esc(r.sep)}</div>` : bubbleHtml(r, rmap, all))).join('')
        + pending.map((p) => `<div class="cc-row me first"><div class="cc-b">🎤 Spraakbericht<br><audio src="${p.url}" controls style="max-width:100%"></audio><br><small>Niet verstuurd: staat alleen op jouw apparaat.</small><div class="row"><button data-retry="${p.id}">Opnieuw proberen</button><button data-drop="${p.id}">Weghalen</button></div></div></div>`).join('') || (loadMore ? '' : `<small style="margin:auto;color:#fff">${term.trim() ? 'Niets gevonden.' : 'Nog geen berichten. Zeg hoi! 👋'}</small>`));
      if (term.trim()) q('#srchn').textContent = `${vis.length} gevonden`;
      if (stick || atEnd) box.scrollTop = box.scrollHeight;
      const o = q('#older'); if (o) o.onclick = loadOlder;
      box.querySelectorAll('[data-act]').forEach((el) => el.onclick = () => openSheet(el.dataset.act));
      box.querySelectorAll('[data-vid]').forEach((b) => b.onclick = () => loadVideo(b));
      box.querySelectorAll('[data-retry]').forEach((b) => b.onclick = () => retryVoice(b.dataset.retry));
      box.querySelectorAll('[data-drop]').forEach((b) => b.onclick = () => { pending = pending.filter((p) => p.id !== b.dataset.drop); render(); });
      const sub = q('#cc-sub'); if (sub) { const last = all.filter((m) => m.from === open.other).pop(); sub.textContent = last ? `Laatst actief ${CC.dayLabel(last.created).toLowerCase()} ${CC.clockOf(last.created)}` : ''; }
    }
    async function loadOlder() {
      const all = allMsgs(); if (!all.length) return; const b = q('#older'); if (b) { b.disabled = true; b.textContent = 'Laden…'; }
      try {
        const s = await getDocs(query(msgsRef, where('created', '<', all[0].created), orderBy('created', 'desc'), limit(60)));
        older = [...older, ...s.docs.map((d) => ({ id: d.id, ...d.data() }))]; if (s.size < 60) noMore = true;
        const box = q('#msgs'), h0 = box.scrollHeight; render(); box.scrollTop = box.scrollHeight - h0;
      } catch (e) { alert(nice(e)); render(); }
    }

    live(doc(db, 'friendships', pid), (d) => { const x = d.data(); if (!x || x.status !== 'accepted') { alert('Dit gesprek is niet meer beschikbaar.'); back(); return; } fdoc = { id: d.id, ...x }; render(); });
    live(query(msgsRef, orderBy('created', 'desc'), limit(80)), (sn) => {
      live80 = sn.docs.map((d) => ({ id: d.id, ...d.data() }));
      render(sn.metadata.fromCache === false && !live80._seen); live80._seen = true;
      const last = live80[0]; if (last && last.from !== me.uid) markRead();
    }, (e) => { q('#msgs').innerHTML = `<span class="err">${esc(nice(e))}</span>`; });
    markRead();

    /* ---- laden van filmpjes en spraak ---- */
    async function fetchBlob(mid, parts, mime) {
      const s = await getDocs(collection(db, 'chats', pid, 'messages', mid, 'chunks'));
      const arr = s.docs.sort((x, y) => x.id.localeCompare(y.id)).map((d) => b64ToBytes(d.data().d));
      if (arr.length < Number(parts)) throw new Error('Het bestand is nog niet compleet');
      return new Blob(arr, { type: mime });
    }
    const loadVideo = async (b) => {
      b.disabled = true; b.textContent = 'Laden…'; const voice = !!b.dataset.voice;
      try {
        const url = URL.createObjectURL(await fetchBlob(b.dataset.vid, b.dataset.parts, b.dataset.mime));
        const ext = (b.dataset.mime.split('/')[1] || 'mp4').split(';')[0].replace('quicktime', 'mov');
        view.querySelector(`[data-vbox="${b.dataset.vid}"]`).innerHTML = voice
          ? `<audio src="${url}" controls autoplay style="max-width:100%"></audio>`
          : `<video src="${url}" controls playsinline style="max-width:100%;border-radius:10px"></video><a href="${url}" download="filmpje-${b.dataset.vid}.${ext}" style="color:inherit;font-size:.8rem">⬇ Opslaan</a>`;
        b.remove();
      } catch (e) { b.disabled = false; b.textContent = '▶ Opnieuw proberen'; alert(nice(e)); }
    };

    /* ---- versturen ---- */
    const setStatus = (t) => { const s = q('#status'); if (s && s.firstChild) s.firstChild.textContent = t; };
    const touch = (preview) => updateDoc(doc(db, 'friendships', pid), { last: preview, lastAt: Date.now(), lastFrom: me.uid }).catch(() => {});
    const post = async (data, preview) => { await addDoc(msgsRef, { from: me.uid, created: Date.now(), ...data }); touch(preview); };
    const clearReply = () => { replyTo = null; q('#replybar').innerHTML = ''; };
    const sendText = async () => {
      const raw = q('#txt').value.trim(); if (!raw) return;
      const text = replyTo ? CC.replyText(replyTo.id, raw) : raw; q('#txt').value = ''; toggleMic(); const rt = replyTo; clearReply();
      try { await post({ type: 'text', text }, raw.slice(0, 80)); } catch (e) { alert(nice(e)); q('#txt').value = raw; replyTo = rt; toggleMic(); }
    };
    q('#send').onclick = sendText;
    q('#txt').onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); sendText(); } };
    const sendSticker = async (name) => {
      recent = CC.pushRecent(recent, name); lsSet('chat:recent', JSON.stringify(recent));
      try { await post({ type: 'text', text: CC.stickerText(name) }, 'Sticker'); closePanel(); } catch (e) { alert(nice(e)); }
    };
    const sendReaction = async (mid, emoji) => { try { await post({ type: 'text', text: CC.reactionText(mid, emoji) }, emoji ? `${emoji} reactie` : 'Reactie weggehaald'); } catch (e) { alert(nice(e)); } };

    /* ---- acties op een bericht ---- */
    function closeSheet() { sheetFor = null; q('#sheet').innerHTML = ''; }
    function openSheet(mid) {
      if (sheetFor === mid) return closeSheet(); sheetFor = mid;
      const m = byId(mid); if (!m) return; const p = CC.parseMsg(m), mine = m.from === me.uid, cur = CC.myReaction(CC.reactionsMap(allMsgs()), mid, me.uid);
      q('#sheet').innerHTML = `<div class="cc-sheet pop"><div class="rxs">${CC.REACTIONS.map((e) => `<button data-rx="${e}" class="${cur === e ? 'on' : ''}">${e}</button>`).join('')}</div>
        <div class="row wrap" style="justify-content:center"><button class="ak-big" data-reply>↩ Antwoord</button>${p.kind === 'text' ? '<button class="ak-big" data-copy>⎘ Kopieer</button>' : ''}${mine ? '<button class="ak-big" data-del>🗑 Verwijder</button>' : ''}<button class="ak-big" data-x>Sluit</button></div></div>`;
      q('#sheet').querySelectorAll('[data-rx]').forEach((b) => b.onclick = () => { const e = b.dataset.rx; closeSheet(); sendReaction(mid, cur === e ? '' : e); });
      q('#sheet [data-reply]').onclick = () => { replyTo = m; closeSheet(); q('#replybar').innerHTML = `<div class="cc-q" style="display:flex;align-items:center;gap:.5rem"><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">↩ ${esc(m.from === me.uid ? 'Jij' : other)}: ${esc(CC.previewOf(m))}</span><button id="xrep" aria-label="Annuleer antwoord">✕</button></div>`; q('#xrep').onclick = clearReply; q('#txt').focus(); };
      const cp = q('#sheet [data-copy]'); if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(p.text); showToast('Gekopieerd'); } catch (e) { showToast('Kopiëren lukt hier niet'); } closeSheet(); };
      const dl = q('#sheet [data-del]'); if (dl) dl.onclick = () => { closeSheet(); deleteDoc(doc(db, 'chats', pid, 'messages', mid)).catch((er) => alert(nice(er))); };
      q('#sheet [data-x]').onclick = closeSheet;
    }

    /* ---- panelen ---- */
    const closePanel = () => { const p = q('#panel'); p.innerHTML = ''; p.dataset.k = ''; };
    const togglePanel = (k) => { const p = q('#panel'); if (p.dataset.k === k) { closePanel(); return false; } p.dataset.k = k; return true; };
    q('#plus').onclick = () => {
      if (!togglePanel('att')) return;
      q('#panel').innerHTML = `<div class="cc-sheet pop"><div class="ak-grid" style="grid-template-columns:1fr 1fr"><button class="ak-big" data-a="lib">🖼 Fotobibliotheek</button><button class="ak-big" data-a="cam">📷 Foto maken</button><button class="ak-big" data-a="vid">🎥 Filmpje maken</button><button class="ak-big" data-a="gif">GIF</button><button class="ak-big" data-a="stk">${ic('unicorn', { size: 24 })} Stickers</button><button class="ak-big" data-a="thm">🎨 Thema</button></div></div>`;
      q('#panel').querySelectorAll('[data-a]').forEach((b) => b.onclick = () => { const a = b.dataset.a; closePanel(); ({ lib: () => q('#file').click(), cam: () => q('#filecam').click(), vid: () => q('#filevid').click(), gif: gifPanel, stk: stickerPanel, thm: themePanel })[a](); });
    };
    q('#emo').onclick = () => {
      if (!togglePanel('emo')) return; let cat = Object.keys(EMOJI)[0];
      const draw = () => {
        const p = q('#panel');
        p.innerHTML = `<div class="cc-sheet"><div class="row wrap" style="margin:0 0 .3rem">${Object.keys(EMOJI).map((k) => `<button data-c="${k}" class="${k === cat ? 'pri' : ''}" style="padding:.2rem .5rem;min-height:44px">${k}</button>`).join('')}</div>
          <div style="display:flex;flex-wrap:wrap;gap:.1rem;max-height:10rem;overflow:auto">${seg(EMOJI[cat]).map((e) => `<button data-e="${e}" style="border:0;background:none;font-size:1.6rem;padding:.2rem;min-width:44px;min-height:44px">${e}</button>`).join('')}</div></div>`;
        p.querySelectorAll('[data-c]').forEach((b) => b.onclick = () => { cat = b.dataset.c; draw(); });
        p.querySelectorAll('[data-e]').forEach((b) => b.onclick = () => { const t = q('#txt'); t.value += b.dataset.e; t.focus(); toggleMic(); });
      };
      draw();
    };
    function stickerPanel() {
      togglePanel('stk');
      const draw = () => {
        const p = q('#panel'); const pack = CC.STICKER_PACKS.find((x) => x.id === packId);
        const list = packId === 'recent' ? recent : packId === 'zinnen' ? [] : pack.items;
        p.innerHTML = `<div class="cc-sheet"><div class="ak-tabs" style="padding-bottom:.3rem">${recent.length ? `<button class="ak-tab ${packId === 'recent' ? 'on' : ''}" data-pk="recent">🕘</button>` : ''}${CC.STICKER_PACKS.map((x) => `<button class="ak-tab ${x.id === packId ? 'on' : ''}" data-pk="${x.id}">${ic(x.ic, { size: 26 })}</button>`).join('')}<button class="ak-tab ${packId === 'zinnen' ? 'on' : ''}" data-pk="zinnen" aria-label="Snelle zinnen">💬</button></div>
          <div class="cc-stk">${list.map((n) => `<button data-st="${n}" aria-label="${n}">${ic(n, { size: 64 })}</button>`).join('')}</div></div>`;
        if (packId === 'zinnen') {
          const box = p.querySelector('.cc-stk'); box.style.display = 'block';
          box.innerHTML = CC.QUICK_PHRASES.map(([g, arr]) => `<div style="margin:.3rem 0"><b>${g}</b><div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.3rem">${arr.map((t) => `<button data-qp="${esc(CC.fillPhrase(t, other))}" style="padding:.4rem .8rem;border-radius:99px;min-height:44px;width:auto;height:auto;font-size:.95rem">${esc(CC.fillPhrase(t, other))}</button>`).join('')}</div></div>`).join('');
          box.querySelectorAll('[data-qp]').forEach((b) => b.onclick = async () => { try { await post({ type: 'text', text: b.dataset.qp }, b.dataset.qp.slice(0, 40)); closePanel(); } catch (e) { alert(nice(e)); } });
        }
        p.querySelectorAll('[data-pk]').forEach((b) => b.onclick = () => { packId = b.dataset.pk; draw(); });
        p.querySelectorAll('[data-st]').forEach((b) => b.onclick = () => sendSticker(b.dataset.st));
      };
      if (packId === 'recent' && !recent.length) packId = CC.STICKER_PACKS[0].id; draw();
    }
    function themePanel() {
      togglePanel('thm');
      q('#panel').innerHTML = `<div class="cc-sheet"><b>Kies een thema voor dit gesprek</b><div class="cc-sw" style="margin-top:.5rem">${CC.THEMES.map((t) => `<button data-th="${t.id}" class="${t.id === theme.id ? 'sel' : ''}" style="background:linear-gradient(135deg,${t.mine[0]},${t.mine[1]})">${ic(t.ic, { size: 30 })}${t.n}</button>`).join('')}</div></div>`;
      q('#panel').querySelectorAll('[data-th]').forEach((b) => b.onclick = () => { theme = CC.themeOf(b.dataset.th); lsSet(`chat:theme:${pid}`, theme.id); const w = q('#ccw'); w.setAttribute('style', themeVars()); w.classList.toggle('dark', !!theme.dark); q('.ak-head').style.cssText = `--ak1:${theme.mine[0]};--ak2:${theme.mine[1]};padding:.6rem .8rem`; closePanel(); });
    }
    q('#themeb').onclick = themePanel;
    q('#srchb').onclick = () => { searchOn = !searchOn; q('#srchrow').style.display = searchOn ? '' : 'none'; if (searchOn) q('#srchin').focus(); else { term = ''; q('#srchin').value = ''; render(true); } };
    q('#srchin').oninput = (e) => { term = e.target.value; render(true); };

    async function gifPanel() {
      togglePanel('gif'); const p = q('#panel');
      const key = GIPHY_KEY || (await getDoc(doc(db, 'config', 'giphy'))).data()?.key;
      if (!key) { p.innerHTML = `<div class="cc-sheet"><small>GIF's staan nog niet aan. Simon moet eerst een GIPHY-sleutel instellen (in Chat → Chats, onderaan).</small></div>`; return; }
      p.innerHTML = `<div class="cc-sheet">
        <div id="gcats" style="display:flex;flex-wrap:wrap;gap:.3rem;max-height:8rem;overflow-y:auto;padding-bottom:.4rem">${GIF_CATS.map(([l, qq], i) => `<button data-gc="${i}" style="white-space:nowrap;padding:.3rem .6rem;min-height:40px">${l}</button>`).join('')}</div>
        <div class="row" style="margin:0 0 .4rem"><input id="gq" placeholder="Of zoek (liefst in het Engels)" style="min-height:44px"></div>
        <div id="gres" style="display:grid;grid-template-columns:1fr 1fr;gap:.3rem;max-height:14rem;overflow:auto"></div><small>Powered by GIPHY</small></div>`;
      const search = async (qq) => {
        q('#gres').innerHTML = '<small>Laden…</small>';
        const url = qq ? `https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(key)}&q=${encodeURIComponent(qq)}&limit=24&rating=pg-13` : `https://api.giphy.com/v1/gifs/trending?api_key=${encodeURIComponent(key)}&limit=24&rating=pg-13`;
        try {
          const r = await fetch(url); const j = await r.json();
          if (!r.ok || !j.data) throw new Error((j.meta && j.meta.msg) || j.message || `GIPHY-fout ${r.status}`);
          q('#gres').innerHTML = j.data.map((g) => `<img data-g="${esc(g.images.fixed_height.url)}" src="${esc(g.images.fixed_height_small.url)}" style="width:100%;border-radius:8px;cursor:pointer" alt="">`).join('') || '<small>Niets gevonden. Probeer een categorie.</small>';
          q('#gres').querySelectorAll('[data-g]').forEach((im) => im.onclick = async () => { try { await post({ type: 'gif', url: im.dataset.g }, 'GIF'); closePanel(); } catch (e) { alert(nice(e)); } });
        } catch (e) { q('#gres').innerHTML = `<span class="err">GIF's laden lukt niet: ${esc(e.message)}</span>`; }
      };
      p.querySelectorAll('[data-gc]').forEach((b) => b.onclick = () => { q('#gq').value = ''; search(GIF_CATS[b.dataset.gc][1]); });
      let t; q('#gq').oninput = (e) => { clearTimeout(t); t = setTimeout(() => search(e.target.value.trim()), 400); };
      search('');
    }

    /* ---- foto's en filmpjes (bibliotheek of camera) ---- */
    const onFile = async (e) => {
      const file = e.target.files[0]; e.target.value = ''; if (!file) return;
      try {
        if (file.type.startsWith('image/')) {
          setStatus('Foto verkleinen…');
          await post({ type: 'image', data: await resizeImage(file) }, '📷 Foto');
        } else if (file.type.startsWith('video/')) {
          if (file.size > MAX_VIDEO) throw new Error('Filmpje is te groot (maximaal 8 MB, ongeveer 10-15 seconden).');
          await uploadChunks(file, file.type || 'video/mp4', '🎬 Filmpje');
        } else throw new Error('Alleen foto\'s en filmpjes kunnen verstuurd worden.');
        setStatus('');
      } catch (er) { setStatus(''); alert(nice(er)); }
    };
    q('#file').onchange = onFile; q('#filecam').onchange = onFile; q('#filevid').onchange = onFile;
    async function uploadChunks(blob, mime, preview) {
      const mref = doc(msgsRef); const parts = CC.partsFor(blob.size);
      for (let i = 0; i < parts; i++) {
        setStatus(`Versturen… ${i + 1}/${parts}`);
        const d = await readB64(blob.slice(i * CHUNK, (i + 1) * CHUNK));
        await setDoc(doc(db, 'chats', pid, 'messages', mref.id, 'chunks', String(i).padStart(3, '0')), { d, by: me.uid });
      }
      await setDoc(mref, { from: me.uid, type: 'video', parts, mime, created: Date.now() });
      touch(preview);
    }

    /* ---- spraakberichten ---- */
    const toggleMic = () => { const mic = q('#mic'); if (!mic) return; const has = q('#txt').value.trim().length > 0; mic.style.display = has ? 'none' : ''; q('#send').style.display = has ? '' : 'none'; };
    q('#txt').oninput = toggleMic; toggleMic();
    async function sendVoice(blob, mime, existingId) {
      if (!CC.fitsChat(blob.size)) { alert('Dit spraakbericht is te lang om te versturen.'); return; }
      try { setStatus('Spraakbericht versturen…'); await uploadChunks(blob, mime, '🎤 Spraakbericht'); setStatus(''); pending = pending.filter((p) => p.id !== existingId); render(true); }
      catch (e) { setStatus(''); if (!existingId) pending.push({ id: 'p' + Date.now(), blob, mime, url: URL.createObjectURL(blob) }); render(true); showToast('Versturen mislukt: het bericht blijft op jouw apparaat'); }
    }
    const retryVoice = (id) => { const p = pending.find((x) => x.id === id); if (p) sendVoice(p.blob, p.mime, id); };
    const mic = q('#mic');
    if (mic) mic.onclick = async () => {
      if (rec) return;
      try {
        const mime = CC.pickVoiceMime((t) => MediaRecorder.isTypeSupported(t));
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); const chunks = []; const t0 = Date.now();
        mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
        rec = { mr, stream, chunks, t0, timer: setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); const el = q('#rect'); if (el) el.textContent = CC.fmtDur(s); if (s >= CC.MAX_VOICE_SEC) finishRec(true); }, 500) };
        q('#recbar').innerHTML = '<div class="cc-rec"><i></i><b id="rect">0:00</b><span style="flex:1">Aan het opnemen…</span><button id="recx">Annuleer</button><button class="pri" id="recok">Verstuur</button></div>';
        q('#recx').onclick = () => finishRec(false); q('#recok').onclick = () => finishRec(true);
        mr.start();
      } catch (e) { rec = null; alert('De microfoon is niet beschikbaar of geen toestemming gegeven.'); }
    };
    function finishRec(send) {
      if (!rec) return; const r = rec; rec = null; clearInterval(r.timer); q('#recbar').innerHTML = '';
      r.mr.onstop = () => { r.stream.getTracks().forEach((t) => t.stop()); if (send && r.chunks.length) { const type = r.mr.mimeType || 'audio/webm'; sendVoice(new Blob(r.chunks, { type }), type); } };
      try { r.mr.stop(); } catch (e) { r.stream.getTracks().forEach((t) => t.stop()); }
    }
  }
}
