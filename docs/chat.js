// Chat-app: vrienden toevoegen, accepteren/blokkeren, berichten met emoji's, GIF's, foto's en filmpjes.
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDocs, query, where, orderBy, limit, onSnapshot }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { GIPHY_KEY } from './firebase-config.js';

export const pairId = (a, b) => [a, b].sort().join('_');
const CHUNK = 450000; // deelbaar door 3, zodat base64-stukjes aan elkaar passen
const MAX_VIDEO = 8 * 1024 * 1024;

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

export async function chatView(c) {
  const { db, me, live, $, esc, nice, isAdmin, stop } = c;
  let friends = [], profiles = new Map(), tab = 'chats', open = null; // open = { pid, other }
  const view = $('#view');

  const loadProfiles = async () => { const s = await getDocs(collection(db, 'profiles')); profiles = new Map(s.docs.map((d) => [d.id, d.data().name])); };
  const nameOf = (uid) => profiles.get(uid) || 'Onbekend';
  const otherOf = (f) => f.members.find((x) => x !== me.uid);
  const when = (t) => (t ? new Date(t).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

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
    const tabBtn = (k, l) => `<button data-tab="${k}" class="${tab === k ? 'pri' : ''}" style="flex:1">${l}</button>`;
    let body = '';
    if (tab === 'chats') {
      body = chats.length ? chats.map((f) => {
        const unread = f.lastFrom && f.lastFrom !== me.uid && (f.lastAt || 0) > ((f.reads || {})[me.uid] || 0);
        return `<div class="box row" data-open="${f.id}" style="cursor:pointer;margin:.5rem 0"><div style="flex:1;min-width:0"><b>${esc(nameOf(otherOf(f)))}</b><br><small style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.last || 'Zeg hoi 👋')}</small></div>${unread ? '<span class="badge" style="position:static">●</span>' : `<small>${when(f.lastAt)}</small>`}</div>`;
      }).join('') : '<div class="box"><small>Nog geen gesprekken. Voeg iemand toe via het tabblad Toevoegen.</small></div>';
      if (blocked.length) body += `<div class="box"><b>Geblokkeerd</b>${blocked.map((f) => `<div class="row"><span style="flex:1">${esc(nameOf(otherOf(f)))}</span><button data-unblock="${f.id}">Deblokkeer</button></div>`).join('')}</div>`;
      if (isAdmin && !GIPHY_KEY) body += '<div class="box"><b>GIF-sleutel (Simon)</b><div id="gkey"></div></div>';
    } else if (tab === 'req') {
      body = `<div class="box"><b>Verzoeken aan jou</b>${incoming.length ? incoming.map((f) => `<div class="row wrap"><span style="flex:1">${esc(nameOf(f.requester))}</span><button class="pri" data-acc="${f.id}">Accepteer</button><button data-blk="${f.id}">Blokkeer</button></div>`).join('') : '<br><small>Geen verzoeken.</small>'}</div>
        ${outgoing.length ? `<div class="box"><b>Verstuurd</b>${outgoing.map((f) => `<div class="row"><span style="flex:1">${esc(nameOf(otherOf(f)))} <small>wacht op antwoord</small></span><button data-cancel="${f.id}">Annuleer</button></div>`).join('')}</div>` : ''}`;
    } else {
      const taken = new Set(friends.map(otherOf));
      const people = [...profiles].filter(([uid]) => uid !== me.uid && !taken.has(uid)).sort((a, b) => a[1].localeCompare(b[1]));
      body = `<div class="box"><b>Mensen toevoegen</b><div class="row"><input id="find" placeholder="Zoek op naam"></div><div id="people">${people.map(([uid, n]) => `<div class="row" data-n="${esc(n.toLowerCase())}"><span style="flex:1">${esc(n)}</span><button class="pri" data-add="${uid}">Toevoegen</button></div>`).join('') || '<small>Er is niemand anders om toe te voegen.</small>'}</div></div>`;
    }
    view.innerHTML = `<div class="row">${tabBtn('chats', 'Chats')}${tabBtn('req', `Verzoeken${incoming.length ? ` (${incoming.length})` : ''}`)}${tabBtn('add', 'Toevoegen')}</div>${body}`;
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
    const other = nameOf(open.other);
    view.innerHTML = `<div class="row"><button id="back">‹ Terug</button><b style="flex:1;text-align:center">${esc(other)}</b><button id="menu">⋯</button></div>
      <div id="msgs" style="min-height:55vh;max-height:60vh;overflow-y:auto;display:flex;flex-direction:column;gap:.4rem;padding:.3rem 0"></div>
      <div id="panel"></div>
      <div id="status"><small></small></div>
      <div class="row">
        <button id="emo" title="Emoji">😊</button><button id="gif" title="GIF">GIF</button>
        <button id="att" title="Foto of filmpje">📎</button>
        <input id="txt" placeholder="Bericht" maxlength="2000" autocomplete="off"><button class="pri" id="send">➤</button>
      </div>
      <input type="file" id="file" accept="image/*,video/*" style="display:none">`;
    const back = async () => { stop(); open = null; live(query(collection(db, 'friendships'), where('members', 'array-contains', me.uid)), (sn) => { friends = sn.docs.map((d) => ({ id: d.id, ...d.data() })); if (!open) drawList(); }); drawList(); };
    $('#back').onclick = back;
    $('#menu').onclick = () => { if (confirm(`${other} blokkeren? Jullie kunnen dan niet meer chatten.`)) updateDoc(doc(db, 'friendships', open.pid), { status: 'blocked', blockedBy: me.uid }).then(back).catch((e) => alert(nice(e))); };

    const msgsRef = collection(db, 'chats', open.pid, 'messages');
    const markRead = () => updateDoc(doc(db, 'friendships', open.pid), { [`reads.${me.uid}`]: Date.now() }).catch(() => {});
    live(doc(db, 'friendships', open.pid), (d) => { const x = d.data(); if (!x || x.status !== 'accepted') { alert('Dit gesprek is niet meer beschikbaar.'); back(); } });
    live(query(msgsRef, orderBy('created', 'desc'), limit(80)), (sn) => {
      const list = sn.docs.map((d) => ({ id: d.id, ...d.data() })).reverse();
      const box = $('#msgs'); const atEnd = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
      box.innerHTML = list.map((m) => {
        const mine = m.from === me.uid;
        let inner = '';
        if (m.type === 'text') inner = esc(m.text).replace(/\n/g, '<br>');
        else if (m.type === 'image') inner = `<img src="${m.data}" style="max-width:100%;border-radius:10px;display:block" alt=""><a href="${m.data}" download="foto-${m.id}.jpg" style="color:inherit;font-size:.8rem">⬇ Opslaan</a>`;
        else if (m.type === 'gif') inner = `<img src="${esc(m.url)}" style="max-width:100%;border-radius:10px;display:block" alt="GIF"><a href="${esc(m.url)}" target="_blank" rel="noopener" style="color:inherit;font-size:.8rem">⬇ Openen</a>`;
        else if (m.type === 'video') inner = `<button data-vid="${m.id}" data-parts="${m.parts}" data-mime="${esc(m.mime || 'video/mp4')}">▶ Filmpje laden en bekijken</button><div data-vbox="${m.id}"></div>`;
        return `<div style="align-self:${mine ? 'flex-end' : 'flex-start'};max-width:82%;background:${mine ? 'var(--accent)' : 'var(--card)'};color:${mine ? '#fff' : 'inherit'};border:1px solid var(--line);border-radius:14px;padding:.45rem .65rem">${inner}<div style="font-size:.68rem;opacity:.65;margin-top:.15rem">${when(m.created)}${mine ? ` · <a href="#" data-del="${m.id}" style="color:inherit">verwijder</a>` : ''}</div></div>`;
      }).join('') || '<small style="margin:auto">Nog geen berichten.</small>';
      if (atEnd || sn.metadata.fromCache === false) box.scrollTop = box.scrollHeight;
      box.querySelectorAll('[data-del]').forEach((a) => a.onclick = (e) => { e.preventDefault(); deleteDoc(doc(db, 'chats', open.pid, 'messages', a.dataset.del)).catch((er) => alert(nice(er))); });
      box.querySelectorAll('[data-vid]').forEach((b) => b.onclick = () => loadVideo(b));
      const last = list[list.length - 1]; if (last && last.from !== me.uid) markRead();
    }, (e) => { $('#msgs').innerHTML = `<span class="err">${esc(nice(e))}</span>`; });
    markRead();

    const loadVideo = async (b) => {
      b.disabled = true; b.textContent = 'Laden…';
      try {
        const s = await getDocs(collection(db, 'chats', open.pid, 'messages', b.dataset.vid, 'chunks'));
        const parts = s.docs.sort((x, y) => x.id.localeCompare(y.id)).map((d) => b64ToBytes(d.data().d));
        if (parts.length < Number(b.dataset.parts)) throw new Error('Filmpje is nog niet compleet');
        const url = URL.createObjectURL(new Blob(parts, { type: b.dataset.mime }));
        const ext = (b.dataset.mime.split('/')[1] || 'mp4').replace('quicktime', 'mov');
        document.querySelector(`[data-vbox="${b.dataset.vid}"]`).innerHTML = `<video src="${url}" controls playsinline style="max-width:100%;border-radius:10px"></video><a href="${url}" download="filmpje-${b.dataset.vid}.${ext}" style="color:inherit;font-size:.8rem">⬇ Opslaan</a>`;
        b.remove();
      } catch (e) { b.disabled = false; b.textContent = '▶ Opnieuw proberen'; alert(nice(e)); }
    };

    const setStatus = (t) => { $('#status').firstChild.textContent = t; };
    const touch = (preview) => updateDoc(doc(db, 'friendships', open.pid), { last: preview, lastAt: Date.now(), lastFrom: me.uid }).catch(() => {});
    const post = async (data, preview) => { await addDoc(msgsRef, { from: me.uid, created: Date.now(), ...data }); touch(preview); };

    const sendText = async () => {
      const text = $('#txt').value.trim(); if (!text) return;
      $('#txt').value = '';
      try { await post({ type: 'text', text }, text.slice(0, 80)); } catch (e) { alert(nice(e)); $('#txt').value = text; }
    };
    $('#send').onclick = sendText;
    $('#txt').onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); sendText(); } };

    // Emoji's
    $('#emo').onclick = () => {
      const p = $('#panel'); if (p.dataset.k === 'emo') { p.innerHTML = ''; p.dataset.k = ''; return; }
      p.dataset.k = 'emo'; let cat = Object.keys(EMOJI)[0];
      const draw = () => {
        p.innerHTML = `<div class="box" style="padding:.5rem"><div class="row wrap" style="margin:0 0 .3rem">${Object.keys(EMOJI).map((k) => `<button data-c="${k}" class="${k === cat ? 'pri' : ''}" style="padding:.2rem .5rem">${k}</button>`).join('')}</div>
          <div style="display:flex;flex-wrap:wrap;gap:.1rem;max-height:9rem;overflow:auto">${seg(EMOJI[cat]).map((e) => `<button data-e="${e}" style="border:0;background:none;font-size:1.4rem;padding:.15rem">${e}</button>`).join('')}</div></div>`;
        p.querySelectorAll('[data-c]').forEach((b) => b.onclick = () => { cat = b.dataset.c; draw(); });
        p.querySelectorAll('[data-e]').forEach((b) => b.onclick = () => { const t = $('#txt'); t.value += b.dataset.e; t.focus(); });
      };
      draw();
    };

    // GIF's (GIPHY)
    $('#gif').onclick = async () => {
      const p = $('#panel'); if (p.dataset.k === 'gif') { p.innerHTML = ''; p.dataset.k = ''; return; }
      p.dataset.k = 'gif';
      const key = GIPHY_KEY || (await getDoc(doc(db, 'config', 'giphy'))).data()?.key;
      if (!key) { p.innerHTML = `<div class="box"><small>GIF's staan nog niet aan. Simon moet eerst een GIPHY-sleutel instellen (in Chat → Chats, onderaan).</small></div>`; return; }
      p.innerHTML = `<div class="box" style="padding:.5rem">
        <div id="gcats" style="display:flex;flex-wrap:wrap;gap:.3rem;max-height:8rem;overflow-y:auto;padding-bottom:.4rem">${GIF_CATS.map(([l, q], i) => `<button data-gc="${i}" style="white-space:nowrap;padding:.3rem .6rem">${l}</button>`).join('')}</div>
        <div class="row" style="margin:0 0 .4rem"><input id="gq" placeholder="Of zoek (liefst in het Engels)"></div>
        <div id="gres" style="display:grid;grid-template-columns:1fr 1fr;gap:.3rem;max-height:14rem;overflow:auto"></div><small>Powered by GIPHY</small></div>`;
      const search = async (q) => {
        $('#gres').innerHTML = '<small>Laden…</small>';
        const url = q ? `https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&limit=24&rating=pg-13` : `https://api.giphy.com/v1/gifs/trending?api_key=${encodeURIComponent(key)}&limit=24&rating=pg-13`;
        try {
          const r = await fetch(url);
          const j = await r.json();
          if (!r.ok || !j.data) throw new Error((j.meta && j.meta.msg) || j.message || `GIPHY-fout ${r.status}`);
          $('#gres').innerHTML = j.data.map((g) => `<img data-g="${esc(g.images.fixed_height.url)}" src="${esc(g.images.fixed_height_small.url)}" style="width:100%;border-radius:8px;cursor:pointer" alt="">`).join('') || '<small>Niets gevonden. Probeer een categorie.</small>';
          $('#gres').querySelectorAll('[data-g]').forEach((im) => im.onclick = async () => { try { await post({ type: 'gif', url: im.dataset.g }, 'GIF'); p.innerHTML = ''; p.dataset.k = ''; } catch (e) { alert(nice(e)); } });
        } catch (e) { $('#gres').innerHTML = `<span class="err">GIF's laden lukt niet: ${esc(e.message)}</span>`; }
      };
      p.querySelectorAll('[data-gc]').forEach((b) => b.onclick = () => { $('#gq').value = ''; search(GIF_CATS[b.dataset.gc][1]); });
      let t; $('#gq').oninput = (e) => { clearTimeout(t); t = setTimeout(() => search(e.target.value.trim()), 400); };
      search('');
    };

    // Foto's en filmpjes
    $('#att').onclick = () => $('#file').click();
    $('#file').onchange = async (e) => {
      const file = e.target.files[0]; e.target.value = ''; if (!file) return;
      try {
        if (file.type.startsWith('image/')) {
          setStatus('Foto verkleinen…');
          await post({ type: 'image', data: await resizeImage(file) }, '📷 Foto');
        } else if (file.type.startsWith('video/')) {
          if (file.size > MAX_VIDEO) throw new Error('Filmpje is te groot (maximaal 8 MB, ongeveer 10-15 seconden).');
          const mref = doc(msgsRef); const parts = Math.ceil(file.size / CHUNK);
          for (let i = 0; i < parts; i++) {
            setStatus(`Filmpje versturen… ${i + 1}/${parts}`);
            const d = await readB64(file.slice(i * CHUNK, (i + 1) * CHUNK));
            await setDoc(doc(db, 'chats', open.pid, 'messages', mref.id, 'chunks', String(i).padStart(3, '0')), { d, by: me.uid });
          }
          await setDoc(mref, { from: me.uid, type: 'video', parts, mime: file.type || 'video/mp4', created: Date.now() });
          touch('🎬 Filmpje');
        } else throw new Error('Alleen foto\'s en filmpjes kunnen verstuurd worden.');
        setStatus('');
      } catch (er) { setStatus(''); alert(nice(er)); }
    };
  }
}
