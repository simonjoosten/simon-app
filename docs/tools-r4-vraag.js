// Vraag, ronde 4: vier nieuwe spelletjes bij "Spelletjes": Bliksemquiz (60 s), Waar of niet waar, Wie of wat ben ik? en de Dagquiz (5 vragen per dag, met reeks).
// Pure logica bovenaan (testbaar), mountR4(host, id, env) tekent een spel in host. Scores in store.r4 (klein).
import * as GM from './vraag-games.js?v=1';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hash = (s) => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export const rng = (seed) => { let a = hash(seed); return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

export const GAMES = [
  { id: 'dagquiz', n: 'Dagquiz', ic: 'bell', d: 'Elke dag 5 nieuwe vragen. Houd je reeks vast!' },
  { id: 'bliksem', n: 'Bliksemquiz', ic: 'bolt', d: '60 seconden, zo veel mogelijk goed' },
  { id: 'waar', n: 'Waar of niet waar?', ic: 'target', d: 'Is dit echt waar? Je zult versteld staan' },
  { id: 'wiewat', n: 'Wie of wat ben ik?', ic: 'wizard', d: 'Raad met zo min mogelijk hints' },
];
// [bewering, waar?, uitleg]
export const WAAR = [
  ['Een octopus heeft drie harten.', true, 'Twee voor de kieuwen en een voor de rest van het lijf.'], ['Bliksem slaat nooit twee keer op dezelfde plek in.', false, 'Het Empire State Building wordt tientallen keren per jaar geraakt.'],
  ['Honing kan duizenden jaren goed blijven.', true, 'Er is eetbare honing gevonden in graven van duizenden jaren oud.'], ['Een dag op Venus is korter dan een jaar op Venus.', false, 'Venus draait zo langzaam dat een dag langer duurt dan een jaar.'],
  ['Bananen groeien aan bomen.', false, 'Een bananenplant is een grote kruidachtige plant, geen boom.'], ['Je hebt in je lichaam meer bacteriecellen dan menselijke cellen of ongeveer evenveel.', true, 'Ongeveer evenveel, schatten onderzoekers.'],
  ['De Chinese Muur is met het blote oog vanaf de maan te zien.', false, 'Dat is een hardnekkige mythe.'], ['Haaien hebben botten.', false, 'Hun skelet is van kraakbeen, net als je neus en oren.'],
  ['Geluid reist sneller door water dan door lucht.', true, 'Ongeveer vier keer zo snel.'], ['Vlinders proeven met hun voeten.', true, 'Ze hebben smaakzintuigen op hun pootjes.'],
  ['De zon is een planeet.', false, 'De zon is een ster.'], ['Een kameel slaat water op in zijn bulten.', false, 'In de bult zit vet, geen water.'],
  ['Nederland ligt voor een groot deel onder de zeespiegel.', true, 'Ongeveer een kwart van het land ligt lager dan de zee.'], ['Een goudvis heeft maar drie seconden geheugen.', false, 'Goudvissen onthouden dingen maandenlang.'],
  ['Koeien hebben vier magen.', false, 'Ze hebben één maag met vier delen.'], ['Het hart van een garnaal zit in zijn kop.', true, 'Het zit bij de borst, achter de kop.'],
  ['Een flamingo is roze door wat hij eet.', true, 'Garnalen en algen geven de kleur.'], ['Er zijn meer sterren in het heelal dan zandkorrels op alle stranden.', true, 'Dat schatten sterrenkundigen.'],
  ['Mensen gebruiken maar tien procent van hun hersenen.', false, 'We gebruiken bijna alle delen van onze hersenen.'], ['Wolken wegen niets.', false, 'Een gewone wolk weegt honderden tonnen water.'],
  ['IJs is zwaarder dan water.', false, 'IJs drijft, dus het is lichter.'], ['Een spin is een insect.', false, 'Een spin heeft acht poten en is een spinachtige.'],
  ['De Eiffeltoren wordt in de zomer iets hoger.', true, 'Het ijzer zet uit in de warmte, soms wel 15 centimeter.'], ['Pinguïns leven op de Noordpool.', false, 'Alleen op het zuidelijk halfrond.'],
  ['Een regenboog is een hele cirkel.', true, 'Vanuit een vliegtuig kun je hem soms helemaal rond zien.'], ['Struisvogels steken hun kop in het zand.', false, 'Dat doen ze niet; ze leggen soms hun kop plat op de grond.'],
  ['Aardbeien zijn eigenlijk geen echte bessen.', true, 'Botanisch is een banaan wel een bes, een aardbei niet.'], ['Water kookt op een hoge berg bij een lagere temperatuur.', true, 'Door de lagere luchtdruk kookt het eerder.'],
  ['Het Nederlandse woord "kip" komt van het Engelse "chicken".', false, 'Het is gewoon een oud Nederlands woord.'], ['De Nijl is de langste rivier van Afrika.', true, 'Ruim 6600 kilometer.'],
];
// [naam, [hints van moeilijk naar makkelijk], [3 foute antwoorden]]
export const WIEWAT = [
  ['Een dolfijn', ['Ik zwem, maar ben geen vis.', 'Ik adem lucht door een gat op mijn kop.', 'Ik maak klikgeluiden om te zien met geluid.', 'Mijn familie heet tuimelaar of bruinvis.'], ['Een haai', 'Een zeemeermin', 'Een inktvis']],
  ['Een vulkaan', ['Ik slaap soms honderden jaren.', 'Binnenin ben ik gloeiend heet.', 'Ik spuw as en rook.', 'Uit mij stroomt lava.'], ['Een geiser', 'Een berg zonder top', 'Een gletsjer']],
  ['De maan', ['Ik heb geen eigen licht.', 'Ik draai om de aarde heen.', 'Ik heb kraters.', 'Ik heb fases, van sikkel tot vol.'], ['Een komeet', 'De zon', 'Mars']],
  ['Een bij', ['Ik werk hard met heel veel zussen.', 'Ik maak iets zoets.', 'Ik dans om te laten zien waar bloemen zijn.', 'Ik zoem en heb een angel.'], ['Een wesp', 'Een vlieg', 'Een hommel in het zwart']],
  ['Een regenboog', ['Ik heb zeven kleuren.', 'Ik ontstaat door licht en water.', 'Ik zie je als zon en regen samen zijn.', 'Ik ben een boog aan de hemel.'], ['Een wolk', 'Een bliksem', 'Een nevel']],
  ['Een paddenstoel', ['Ik ben geen plant en geen dier.', 'Ik groei graag in het bos op vochtige plekken.', 'Sommigen van mij zijn giftig.', 'Ik heb een steel en een hoed.'], ['Een boom', 'Een bloem', 'Een mos']],
  ['Een schildpad', ['Ik kan honderd jaar oud worden.', 'Ik leg eieren in zand.', 'Ik ben heel langzaam.', 'Ik draag mijn huis op mijn rug.'], ['Een slak', 'Een krab', 'Een gordeldier']],
  ['De aarde', ['Ik ben de enige plek waar we leven kennen.', 'Ik bestaat voor het grootste deel uit water.', 'Ik draai in een jaar om de zon.', 'Jij woont op mij.'], ['Mars', 'Jupiter', 'De maan']],
  ['Een brandweerauto', ['Ik ben meestal rood.', 'Ik heb een lange ladder en een slang.', 'Ik rij met sirene.', 'Ik help bij vuur.'], ['Een ambulance', 'Een bus', 'Een vrachtwagen']],
  ['Een kameleon', ['Ik wacht rustig op mijn eten.', 'Mijn ogen kunnen los van elkaar kijken.', 'Mijn tong schiet ver uit mijn bek.', 'Ik verander van kleur.'], ['Een gekko', 'Een leguaan', 'Een salamander']],
  ['Een windmolen', ['Ik sta vaak in een polder.', 'Ik werd gebruikt om water weg te pompen.', 'Ik heb wieken.', 'Ik draai door de wind.'], ['Een watermolen', 'Een kasteel', 'Een vuurtoren']],
  ['Een ijsbeer', ['Mijn vacht is eigenlijk doorzichtig.', 'Mijn huid is zwart.', 'Ik leef in het hoge noorden.', 'Ik ben wit en gevaarlijk.'], ['Een pinguïn', 'Een poolvos', 'Een walrus']],
  ['Een piano', ['Ik heb honderden onderdelen binnenin.', 'Ik heb hamertjes en snaren.', 'Ik heb zwarte en witte toetsen.', 'Je bespeelt mij met je vingers.'], ['Een gitaar', 'Een trommel', 'Een viool']],
  ['Een ei', ['Ik ben rond of eivormig.', 'Ik heb een schaal en binnenin geel en wit.', 'Je kunt mij bakken of koken.', 'Een kip legt mij.'], ['Een steen', 'Een knikker', 'Een appel']],
  ['Een zeepaardje', ['Bij mij zorgt de papa voor de babys in zijn buidel.', 'Ik zwem rechtop.', 'Ik heb een staart waarmee ik mij vasthoud.', 'Ik lijk op een paard maar leef in zee.'], ['Een zeehond', 'Een zeester', 'Een kwal']],
  ['Een globe', ['Ik draai om mijn as.', 'Ik ben rond maar niet echt.', 'Ik laat landen en oceanen zien.', 'Ik ben een bol met de wereld erop.'], ['Een bal', 'Een kaart', 'Een lamp']],
];

/** Dagquiz: 5 vragen, vandaag altijd dezelfde. */
export function dagRound(dayKey, n = 5) {
  const r = rng(dayKey), pool = GM.QUIZ.map((q, i) => i), pick = [];
  while (pick.length < Math.min(n, pool.length)) { const k = Math.floor(r() * pool.length), idx = pool.splice(k, 1)[0]; pick.push(idx); }
  return pick.map((i) => { const [cat, q, opts, ok] = GM.QUIZ[i], r2 = rng(dayKey + q), order = opts.map((_, j) => j); for (let a = order.length - 1; a > 0; a--) { const b = Math.floor(r2() * (a + 1)); [order[a], order[b]] = [order[b], order[a]]; } return { cat, q, opts: order.map((j) => opts[j]), correct: order.indexOf(ok) }; });
}
export const prevKey = (k) => { const [y, m, d] = k.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d - 1)); return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`; };
/** Reeks na het spelen van `dayKey`: dag ervoor gespeeld = +1, anders 1. Zelfde dag twee keer verandert niets. */
export function nextStreak(dag, dayKey) {
  const d = dag || { last: '', streak: 0, best: 0 };
  if (d.last === dayKey) return { ...d };
  const streak = d.last === prevKey(dayKey) ? (d.streak || 0) + 1 : 1;
  return { last: dayKey, streak, best: Math.max(d.best || 0, streak) };
}
/** Wie ben ik: punten bij het kiezen na n getoonde hints (1 hint = 5 punten, 4 = 2). */
export const wiePunten = (hints) => Math.max(1, 6 - hints);
export function wieRound(r = Math.random, n = 6) {
  const idx = WIEWAT.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx.slice(0, n).map((i) => { const [name, hints, wrong] = WIEWAT[i], opts = [name, ...wrong].sort(() => r() - 0.5); return { name, hints, opts }; });
}
export function waarRound(r = Math.random, n = 10) { const a = WAAR.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); }

/** Teken een spel in host. env: { store, ic, back(), dayKey, celebrate?(text) } */
export function mountR4(host, id, env) {
  const { store, ic } = env;
  const R = () => ({ best: {}, dag: null, ...(store.get().r4 || {}) });
  const put = (fn) => { const r = R(); fn(r); store.set({ r4: r }); };
  const head = (t) => `<div class="row" style="margin:0"><button class="ak-big" data-r4back>‹ Terug</button><b style="flex:1;text-align:center">${esc(t)}</b></div>`;
  const wireBack = () => host.querySelectorAll('[data-r4back]').forEach((b) => { b.onclick = () => { if (host._iv) clearInterval(host._iv); mountR4(host, 'menu', env); }; });
  const done = (title, score, max, extra = '', again = null) => {
    host.innerHTML = `<div class="ak-card" style="text-align:center">${head(title)}${ic(score >= max * 0.8 ? 'trophy' : 'medal', { size: 90 })}<div style="font-size:2.2rem;font-weight:800">${score}${max ? ` / ${max}` : ''}</div>${extra}<div class="row" style="justify-content:center">${again ? '<button class="pri ak-big" data-again>Nog een keer</button>' : ''}</div></div>`;
    wireBack(); const a = host.querySelector('[data-again]'); if (a) a.onclick = again;
  };
  const choose = (opts, cls = 'vq-opt') => opts.map((o, i) => `<button class="${cls}" data-o="${i}">${esc(o)}</button>`).join('');

  if (id === 'menu') {
    const r = R();
    host.innerHTML = GAMES.map((g) => `<button class="ak-card" data-r4="${g.id}" style="width:100%;text-align:left;display:flex;gap:.8rem;align-items:center;margin:.5rem 0">${ic(g.ic, { size: 64 })}<span><b style="font-size:1.1em">${esc(g.n)}</b><br><small class="mute">${esc(g.d)}${g.id === 'dagquiz' && r.dag ? ` · reeks ${r.dag.streak}` : ''}${r.best[g.id] ? ` · record ${r.best[g.id]}` : ''}</small></span></button>`).join('');
    host.querySelectorAll('[data-r4]').forEach((b) => { b.onclick = () => mountR4(host, b.dataset.r4, env); });
    return;
  }
  const record = (gid, score) => { let nb = false; put((r) => { r.best = { ...r.best }; if (score > (r.best[gid] || 0)) { r.best[gid] = score; nb = true; } }); return nb; };

  if (id === 'bliksem' || id === 'dagquiz') {
    const daily = id === 'dagquiz', dk = env.dayKey || new Date().toISOString().slice(0, 10);
    const items = daily ? dagRound(dk) : GM.makeRound('alles', 40); let i = 0, score = 0, tl = 60, over = false;
    const fin = () => {
      over = true; if (host._iv) clearInterval(host._iv);
      if (daily) { let st; put((r) => { r.dag = nextStreak(r.dag, dk); st = r.dag; }); const nb = record('dagquiz', score); done('Dagquiz', score, items.length, `<div>${GM.roundVerdict(score, items.length)}</div><div class="ak-chip on" style="display:inline-block;margin:.4rem">Reeks: ${st.streak} ${st.streak === 1 ? 'dag' : 'dagen'} · beste ${st.best}</div>${nb ? '<div><b>Nieuw record!</b></div>' : ''}<small class="mute">Morgen komen er 5 nieuwe vragen.</small>`); }
      else { const nb = record('bliksem', score); done('Bliksemquiz', score, 0, `<div>${score} goed in 60 seconden${nb ? ' · <b>nieuw record!</b>' : ''}</div>`, () => mountR4(host, 'bliksem', env)); }
    };
    const ask = () => {
      if (i >= items.length) return fin(); const it = items[i];
      host.innerHTML = `<div class="ak-card">${head(daily ? 'Dagquiz' : 'Bliksemquiz')}<div class="row"><span class="ak-chip">${daily ? `${i + 1} / ${items.length}` : `<span data-tl>${tl}</span> s`}</span><span class="ak-chip on">${score} goed</span></div><div style="font-size:1.2em;margin:.6rem 0"><b>${esc(it.q)}</b></div>${choose(it.opts)}<div data-fb style="min-height:1.6rem"></div></div>`;
      wireBack(); let locked = false;
      host.querySelectorAll('[data-o]').forEach((b) => { b.onclick = () => {
        if (locked || over) return; locked = true; const ok = +b.dataset.o === it.correct; if (ok) score++; b.classList.add(ok ? 'ok' : 'bad');
        const c = host.querySelector(`[data-o="${it.correct}"]`); if (c) c.classList.add('ok'); i++;
        if (daily) { host.querySelector('[data-fb]').innerHTML = ok ? 'Goed zo!' : `Helaas, het was ${esc(it.opts[it.correct])}.`; setTimeout(ask, ok ? 800 : 1800); } else setTimeout(() => { if (!over) ask(); }, 350);
      }; });
    };
    if (!daily) host._iv = setInterval(() => { if (over) return; tl--; const e = host.querySelector('[data-tl]'); if (e) e.textContent = tl; if (tl <= 0) fin(); }, 1000);
    if (daily && R().dag && R().dag.last === dk) { host.innerHTML = `<div class="ak-card" style="text-align:center">${head('Dagquiz')}${ic('bell', { size: 80 })}<p>Je hebt de dagquiz van vandaag al gespeeld.</p><div class="ak-chip on" style="display:inline-block">Reeks: ${R().dag.streak} dagen</div><p><small class="mute">Kom morgen terug voor 5 nieuwe vragen.</small></p></div>`; wireBack(); return; }
    ask(); return;
  }

  if (id === 'waar') {
    const items = waarRound(), N = items.length; let i = 0, score = 0;
    const ask = () => {
      if (i >= N) { const nb = record('waar', score); return done('Waar of niet waar?', score, N, `<div>${GM.roundVerdict(score, N)}${nb ? ' <b>Nieuw record!</b>' : ''}</div>`, () => mountR4(host, 'waar', env)); }
      const it = items[i];
      host.innerHTML = `<div class="ak-card">${head('Waar of niet waar?')}<div class="row"><span class="ak-chip">${i + 1} / ${N}</span><span class="ak-chip on">${score} goed</span></div><div style="font-size:1.25em;margin:.8rem 0"><b>${esc(it[0])}</b></div>
        <div class="row"><button class="ak-big pri" data-a="1" style="flex:1;min-height:60px">Waar</button><button class="ak-big" data-a="0" style="flex:1;min-height:60px">Niet waar</button></div><div data-fb></div></div>`;
      wireBack();
      host.querySelectorAll('[data-a]').forEach((b) => { b.onclick = () => {
        const ok = (b.dataset.a === '1') === it[1]; if (ok) score++; i++;
        host.querySelector('[data-fb]').innerHTML = `<p><b>${ok ? 'Goed!' : 'Helaas.'}</b> ${esc(it[2])}</p><button class="pri ak-big" data-nx>Verder</button>`; host.querySelectorAll('[data-a]').forEach((x) => { x.disabled = true; }); host.querySelector('[data-nx]').onclick = ask;
      }; });
    };
    ask(); return;
  }

  if (id === 'wiewat') {
    const items = wieRound(), N = items.length; let i = 0, score = 0;
    const ask = () => {
      if (i >= N) { const nb = record('wiewat', score); return done('Wie of wat ben ik?', score, N * 5, `<div>${nb ? '<b>Nieuw record!</b>' : 'Met minder hints krijg je meer punten.'}</div>`, () => mountR4(host, 'wiewat', env)); }
      const it = items[i]; let shown = 1;
      const draw = () => {
        host.innerHTML = `<div class="ak-card">${head('Wie of wat ben ik?')}<div class="row"><span class="ak-chip">${i + 1} / ${N}</span><span class="ak-chip on">${score} punten</span><span class="ak-chip">Nu te winnen: ${wiePunten(shown)}</span></div>
          <div style="margin:.6rem 0">${it.hints.slice(0, shown).map((h) => `<p style="margin:.3rem 0"><b>${esc(h)}</b></p>`).join('')}</div>
          ${shown < it.hints.length ? '<button class="ak-big" data-hint>Nog een hint</button>' : ''}<div style="margin-top:.5rem">${choose(it.opts)}</div><div data-fb></div></div>`;
        wireBack();
        const hb = host.querySelector('[data-hint]'); if (hb) hb.onclick = () => { shown++; draw(); };
        host.querySelectorAll('[data-o]').forEach((b) => { b.onclick = () => {
          const ok = it.opts[+b.dataset.o] === it.name; if (ok) score += wiePunten(shown); i++; b.classList.add(ok ? 'ok' : 'bad'); const c = host.querySelector(`[data-o="${it.opts.indexOf(it.name)}"]`); if (c) c.classList.add('ok');
          host.querySelectorAll('[data-o]').forEach((x) => { x.disabled = true; }); host.querySelector('[data-fb]').innerHTML = `<p><b>${ok ? `Goed! +${wiePunten(shown)}` : `Het was ${esc(it.name)}.`}</b></p><button class="pri ak-big" data-nx>Verder</button>`; host.querySelector('[data-nx]').onclick = ask;
        }; });
      };
      draw();
    };
    ask(); return;
  }
}
