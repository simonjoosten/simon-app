// Puzzel: n = rastergrootte, w = woorden [rij, kolom, richting H/V, antwoord, omschrijving]
const PUZZELS = [
  { n: 5, w: [
    [0, 0, 'H', 'PLANT', "Groeit in een pot"],
    [0, 2, 'V', 'ARM', "Zit aan je schouder"],
    [2, 0, 'H', 'KAMER', "Ruimte in een huis"],
    [2, 0, 'V', 'KOP', "Ander woord voor hoofd"],
    [4, 0, 'H', 'PLANK', "Dun stuk hout"],
    [2, 3, 'V', 'EEN', "Het cijfer 1"],
  ] },
  { n: 5, w: [
    [0, 0, 'H', 'SLAK', "Heeft een huisje op zijn rug"],
    [0, 0, 'V', 'SOK', "Draag je in je schoen"],
    [0, 2, 'V', 'AAP', "Klimt in bomen en eet graag bananen"],
    [2, 0, 'H', 'KOP', "Ander woord voor hoofd"],
    [2, 1, 'V', 'OOM', "Broer van je vader of moeder"],
    [4, 1, 'H', 'MOND', "Hiermee eet en praat je"],
  ] },
  { n: 5, w: [
    [0, 0, 'H', 'NEUS', "Hiermee ruik je"],
    [0, 0, 'V', 'NOOT', "Heeft een harde schil"],
    [0, 2, 'V', 'UIL', "Nachtvogel met grote ogen"],
    [2, 2, 'H', 'LAM', "Jong schaap"],
    [2, 4, 'V', 'MES', "Hiermee snijd je je eten"],
    [4, 1, 'H', 'KLAS', "Alle kinderen uit een groep"],
  ] },
  { n: 5, w: [
    [0, 0, 'H', 'REUS', "Heel grote man in een sprookje"],
    [0, 2, 'V', 'UIL', "Nachtvogel met grote ogen"],
    [2, 0, 'H', 'MELK', "Witte drank van de koe"],
    [2, 3, 'V', 'KAT', "Spint en vangt muizen"],
    [4, 1, 'H', 'PET', "Hoofddeksel met een klep"],
    [0, 0, 'V', 'RAM', "Mannetjesschaap"],
  ] },
  { n: 5, w: [
    [0, 0, 'V', 'TREIN', "Rijdt over rails"],
    [4, 0, 'H', 'NEUS', "Hiermee ruik je"],
    [2, 0, 'H', 'EIK', "Boom waar eikels aan groeien"],
    [0, 2, 'V', 'ROK', "Kledingstuk voor meisjes, hangt aan je middel"],
    [1, 2, 'H', 'OOM', "Broer van je vader of moeder"],
    [1, 4, 'V', 'MES', "Hiermee snijd je je eten"],
  ] },
  { n: 6, w: [
    [3, 0, 'H', 'PIRAAT', "Heeft een schatkaart en een papegaai"],
    [0, 5, 'V', 'LIFT', "Hiermee ga je omhoog in een gebouw"],
    [3, 0, 'V', 'PAD', "Smal wandelweggetje"],
    [2, 3, 'V', 'KAT', "Spint en vangt muizen"],
    [5, 0, 'H', 'DAK', "Bovenop het huis"],
    [0, 3, 'H', 'UIL', "Nachtvogel met grote ogen"],
    [0, 1, 'V', 'TRUI', "Warm kledingstuk van wol"],
    [1, 0, 'H', 'ARM', "Zit aan je schouder"],
  ] },
  { n: 6, w: [
    [0, 0, 'V', 'ORGEL', "Groot instrument in de kerk"],
    [2, 0, 'H', 'GUM', "Hiermee wis je potlood weg"],
    [0, 2, 'V', 'RAM', "Mannetjesschaap"],
    [1, 2, 'H', 'AAP', "Klimt in bomen en eet graag bananen"],
    [0, 4, 'V', 'APPEL', "Fruit van de appelboom"],
    [4, 0, 'H', 'LAM', "Jong schaap"],
    [3, 3, 'H', 'BED', "Hier slaap je in"],
    [0, 0, 'H', 'OOR', "Hiermee hoor je"],
  ] },
  { n: 6, w: [
    [5, 0, 'H', 'STOEL', "Hier zit je op"],
    [2, 0, 'V', 'REUS', "Heel grote man in een sprookje"],
    [3, 3, 'V', 'ZEE', "Groot zout water met golven"],
    [2, 0, 'H', 'ROK', "Kledingstuk voor meisjes, hangt aan je middel"],
    [3, 3, 'H', 'ZES', "Het cijfer na de vijf"],
    [0, 2, 'V', 'DAK', "Bovenop het huis"],
    [0, 5, 'V', 'KERS', "Klein rood fruit met een pit"],
    [0, 0, 'H', 'PAD', "Smal wandelweggetje"],
  ] },
  { n: 6, w: [
    [0, 0, 'V', 'KLEIN', "Tegenovergestelde van groot"],
    [2, 0, 'H', 'EEN', "Het cijfer 1"],
    [0, 0, 'H', 'KAM', "Hiermee haal je door je haar"],
    [0, 2, 'V', 'MUNT', "Metalen geldstuk"],
    [1, 2, 'H', 'UIL', "Nachtvogel met grote ogen"],
    [3, 2, 'H', 'TIEN', "Het getal 10"],
    [3, 4, 'V', 'EIK', "Boom waar eikels aan groeien"],
    [5, 2, 'H', 'SOK', "Draag je in je schoen"],
  ] },
  { n: 6, w: [
    [0, 0, 'V', 'SNEEUW', "Witte vlokken in de winter"],
    [0, 0, 'H', 'SOK', "Draag je in je schoen"],
    [0, 2, 'V', 'KOP', "Ander woord voor hoofd"],
    [2, 2, 'H', 'PET', "Hoofddeksel met een klep"],
    [2, 3, 'V', 'EIK', "Boom waar eikels aan groeien"],
    [0, 4, 'V', 'KAT', "Spint en vangt muizen"],
    [5, 0, 'H', 'WEG', "Hierover rijdt een auto"],
    [4, 3, 'H', 'KAM', "Hiermee haal je door je haar"],
  ] },
  { n: 7, w: [
    [0, 6, 'V', 'KUSSEN', "Leg je onder je hoofd in bed"],
    [3, 4, 'H', 'ZES', "Het cijfer na de vijf"],
    [0, 4, 'H', 'HEK', "Staat om de tuin"],
    [3, 4, 'V', 'ZIJ', "Voornaamwoord voor een meisje"],
    [4, 1, 'H', 'TRUI', "Warm kledingstuk van wol"],
    [0, 2, 'V', 'BOTER', "Smeer je op je brood"],
    [1, 0, 'H', 'BOOM', "Heeft een stam, takken en bladeren"],
    [4, 1, 'V', 'TAS', "Hierin draag je je boeken naar school"],
    [1, 0, 'V', 'BAD', "Hierin was je je in het water"],
    [6, 1, 'H', 'SOK', "Draag je in je schoen"],
  ] },
  { n: 7, w: [
    [0, 0, 'H', 'SLEUTEL', "Hiermee open je het slot"],
    [0, 0, 'V', 'SOEP', "Warm gerecht dat je met een lepel eet"],
    [0, 4, 'V', 'TIJD', "Dit geeft de klok aan"],
    [2, 0, 'H', 'EIK', "Boom waar eikels aan groeien"],
    [2, 2, 'V', 'KAARS', "Brandt met een vlammetje"],
    [2, 4, 'H', 'JAS', "Draag je als het koud is"],
    [2, 6, 'V', 'SPOOK', "Wit wezen dat je laat schrikken"],
    [6, 0, 'H', 'TAS', "Hierin draag je je boeken naar school"],
    [4, 1, 'H', 'DAK', "Bovenop het huis"],
    [6, 4, 'H', 'HEK', "Staat om de tuin"],
  ] },
  { n: 7, w: [
    [2, 0, 'H', 'KASTEEL', "Groot gebouw met torens van ridders"],
    [2, 2, 'V', 'SOEP', "Warm gerecht dat je met een lepel eet"],
    [2, 0, 'V', 'KAART', "Hierop zie je waar je moet lopen"],
    [4, 2, 'H', 'EMMER', "Hierin haal je water"],
    [4, 4, 'V', 'MES', "Hiermee snijd je je eten"],
    [6, 4, 'H', 'SOK', "Draag je in je schoen"],
    [0, 3, 'V', 'PET', "Hoofddeksel met een klep"],
    [0, 6, 'V', 'UIL', "Nachtvogel met grote ogen"],
    [0, 0, 'H', 'DIEP', "Tegenovergestelde van ondiep"],
    [4, 6, 'V', 'ROK', "Kledingstuk voor meisjes, hangt aan je middel"],
  ] },
  { n: 7, w: [
    [0, 2, 'V', 'SOKKEN', "Draag je in je schoenen"],
    [0, 2, 'H', 'SLOT', "Zit op de deur"],
    [0, 4, 'V', 'OOG', "Hiermee kijk je"],
    [2, 4, 'H', 'GUM', "Hiermee wis je potlood weg"],
    [2, 6, 'V', 'MUS', "Kleine bruine vogel in de stad"],
    [3, 0, 'H', 'ROK', "Kledingstuk voor meisjes, hangt aan je middel"],
    [4, 4, 'H', 'VIS', "Zwemt in het water en heeft kieuwen"],
    [2, 0, 'V', 'KROON', "Draagt een koning op zijn hoofd"],
    [4, 5, 'V', 'IJS', "Bevroren water"],
    [6, 3, 'H', 'POST', "Brieven en pakjes"],
  ] },
  { n: 7, w: [
    [0, 0, 'V', 'EKSTER', "Zwart-witte vogel die van glimmende dingen houdt"],
    [3, 0, 'H', 'TAFEL', "Hier eet je aan"],
    [2, 4, 'V', 'PLEIN', "Open plek in de stad"],
    [2, 4, 'H', 'PET', "Hoofddeksel met een klep"],
    [5, 0, 'H', 'RAM', "Mannetjesschaap"],
    [0, 2, 'V', 'WOLF', "Roofdier dat naar de maan huilt"],
    [1, 0, 'H', 'KOOR', "Groep mensen die samen zingt"],
    [5, 4, 'H', 'IJS', "Bevroren water"],
    [0, 6, 'V', 'KAT', "Spint en vangt muizen"],
    [0, 4, 'H', 'ROK', "Kledingstuk voor meisjes, hangt aan je middel"],
  ] },
];
const KB = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
const RONDES = 3;

function shuffle(a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = b[i]; b[i] = b[j]; b[j] = t;
  }
  return b;
}
function pickSeries() {
  const out = [];
  [5, 6, 7].forEach((n) => {
    const ids = [];
    PUZZELS.forEach((p, i) => { if (p.n === n) ids.push(i); });
    out.push(ids[Math.floor(Math.random() * ids.length)]);
  });
  return out.filter((v) => v !== undefined);
}

export default {
  id: 'kruiswoord',
  name: 'Kruiswoord',
  emoji: '📰',
  hint: 'Los de mini-kruiswoordpuzzels op met de omschrijvingen',
  save: 'day',
  create(host, api) {
    host.style.touchAction = 'manipulation';
    host.style.background = '#2c3e50';
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;font-family:system-ui,sans-serif;color:#fff;padding:8px 8px 8px;box-sizing:border-box;user-select:none;-webkit-user-select:none;overflow:hidden';
    root.innerHTML =
      '<div style="width:100%;display:flex;justify-content:space-between;font-weight:700;font-size:15px"><span data-r="pz"></span><span data-r="msg" style="font-size:13px;opacity:.9"></span><span data-r="score"></span></div>' +
      '<div data-r="grid" style="display:grid;gap:2px;margin-top:8px;background:#1a252f;padding:2px;border-radius:6px"></div>' +
      '<div style="display:flex;align-items:center;gap:6px;width:100%;max-width:420px;margin-top:8px">' +
      '<button data-r="prev" style="width:40px;height:44px;border:0;border-radius:10px;background:#4a6a9e;color:#fff;font-size:18px;cursor:pointer">◀</button>' +
      '<div data-r="clue" style="flex:1;min-height:44px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:14px;font-weight:600;background:rgba(255,255,255,.1);border-radius:10px;padding:2px 6px"></div>' +
      '<button data-r="next" style="width:40px;height:44px;border:0;border-radius:10px;background:#4a6a9e;color:#fff;font-size:18px;cursor:pointer">▶</button></div>' +
      '<div data-r="kb" style="display:flex;flex-direction:column;gap:5px;align-items:center;margin-top:8px;width:100%"></div>' +
      '<div style="display:flex;gap:8px;width:100%;max-width:420px;margin-top:auto">' +
      '<button data-r="chk" style="flex:1;height:38px;border:0;border-radius:10px;background:#2e9e57;color:#fff;font-size:14px;font-weight:700;cursor:pointer">✔ Controleer</button>' +
      '<button data-r="hnt" style="flex:1;height:38px;border:0;border-radius:10px;background:#9e7a2e;color:#fff;font-size:14px;font-weight:700;cursor:pointer">💡 Letter (-15)</button>' +
      '<button data-r="skp" style="flex:1;height:38px;border:0;border-radius:10px;background:#8a4a4a;color:#fff;font-size:14px;font-weight:700;cursor:pointer">⏭ Overslaan</button></div>';
    host.appendChild(root);
    const q = (n) => root.querySelector('[data-r="' + n + '"]');
    const elPz = q('pz'), elMsg = q('msg'), elScore = q('score'), elGrid = q('grid'), elClue = q('clue'), elKb = q('kb');

    let dead = false, done = false, started = false, timer = 0, mtimer = 0;
    let series = [], idx = 0, score = 0, hints = 0, checks = 0;
    let pz = null, n = 5, cells = [], words = [], entries = [], given = [], wrongSet = {};
    let sel = { r: 0, c: 0, d: 'H' };
    let locked = false;

    function setT(fn, ms) { clearTimeout(timer); timer = setTimeout(() => { if (!dead) fn(); }, ms); }
    function flash(t) {
      elMsg.textContent = t;
      clearTimeout(mtimer);
      mtimer = setTimeout(() => { if (!dead) elMsg.textContent = ''; }, 2200);
    }
    function save() {
      if (!started || done || !pz || locked) return;
      api.save({ s: series, i: idx, e: entries.map((x) => x || '.').join(''), g: given.map((x) => (x ? 1 : 0)).join(''), sc: score, h: hints, k: checks });
    }
    function loadPuzzle(restore) {
      pz = PUZZELS[series[idx]];
      n = pz.n;
      words = pz.w.map((x) => ({ r: x[0], c: x[1], d: x[2], w: x[3], clue: x[4], num: 0, cells: [] }));
      cells = [];
      for (let r = 0; r < n; r++) { cells.push([]); for (let c = 0; c < n; c++) cells[r].push({ sol: '', wh: -1, wv: -1, num: 0 }); }
      words.forEach((wd, wi) => {
        for (let k = 0; k < wd.w.length; k++) {
          const r = wd.r + (wd.d === 'V' ? k : 0), c = wd.c + (wd.d === 'H' ? k : 0);
          cells[r][c].sol = wd.w[k];
          if (wd.d === 'H') cells[r][c].wh = wi; else cells[r][c].wv = wi;
          wd.cells.push([r, c]);
        }
      });
      let num = 0;
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const cl = cells[r][c];
        if (!cl.sol) continue;
        let start = false;
        if (cl.wh >= 0 && words[cl.wh].r === r && words[cl.wh].c === c) start = true;
        if (cl.wv >= 0 && words[cl.wv].r === r && words[cl.wv].c === c) start = true;
        if (start) {
          cl.num = ++num;
          if (cl.wh >= 0 && words[cl.wh].r === r && words[cl.wh].c === c) words[cl.wh].num = num;
          if (cl.wv >= 0 && words[cl.wv].r === r && words[cl.wv].c === c) words[cl.wv].num = num;
        }
      }
      entries = []; given = [];
      for (let i = 0; i < n * n; i++) { entries.push(''); given.push(false); }
      if (restore && typeof restore.e === 'string' && restore.e.length === n * n) {
        for (let i = 0; i < n * n; i++) {
          const ch = restore.e[i];
          if (ch !== '.' && cells[Math.floor(i / n)][i % n].sol) entries[i] = ch;
          if (restore.g && restore.g[i] === '1') given[i] = true;
        }
      }
      wrongSet = {};
      locked = false;
      const w0 = words.findIndex((x) => x.d === 'H');
      const first = words[w0 >= 0 ? w0 : 0];
      sel = { r: first.r, c: first.c, d: first.d };
      buildGrid();
      render();
    }
    function buildGrid() {
      const size = Math.max(30, Math.min(48, Math.floor((api.w - 24) / n) - 2, Math.floor((api.h - 340) / n) - 2));
      elGrid.style.gridTemplateColumns = 'repeat(' + n + ',' + size + 'px)';
      elGrid.innerHTML = '';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const cl = cells[r][c];
        const d = document.createElement('div');
        d.style.cssText = 'width:' + size + 'px;height:' + size + 'px;position:relative;display:flex;align-items:center;justify-content:center;border-radius:4px;font-weight:800;font-size:' + Math.round(size * 0.55) + 'px;box-sizing:border-box';
        if (cl.sol) {
          d.style.cursor = 'pointer';
          d.addEventListener('click', () => tapCell(r, c));
          if (cl.num) {
            const nm = document.createElement('span');
            nm.textContent = String(cl.num);
            nm.style.cssText = 'position:absolute;left:3px;top:1px;font-size:' + Math.max(9, Math.round(size * 0.26)) + 'px;font-weight:700;color:#556';
            d.appendChild(nm);
          }
          const lt = document.createElement('span');
          d.appendChild(lt);
          cl.el = d; cl.lt = lt;
        } else d.style.background = '#1a252f';
        elGrid.appendChild(d);
      }
    }
    function activeWord() {
      const cl = cells[sel.r][sel.c];
      let wi = sel.d === 'H' ? cl.wh : cl.wv;
      if (wi < 0) { sel.d = sel.d === 'H' ? 'V' : 'H'; wi = sel.d === 'H' ? cl.wh : cl.wv; }
      return wi;
    }
    function render() {
      const wi = activeWord();
      const aw = words[wi];
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const cl = cells[r][c];
        if (!cl.sol) continue;
        const i = r * n + c;
        const inWord = aw && aw.cells.some((x) => x[0] === r && x[1] === c);
        const isSel = r === sel.r && c === sel.c;
        cl.lt.textContent = entries[i];
        cl.el.style.background = isSel ? '#ffd24a' : inWord ? '#fff3b0' : '#f4f4f4';
        cl.lt.style.color = wrongSet[i] ? '#d62828' : given[i] ? '#2a7f3f' : '#1c2733';
      }
      elClue.textContent = aw ? aw.num + ' ' + (aw.d === 'H' ? 'horizontaal' : 'verticaal') + ' (' + aw.w.length + '): ' + aw.clue : '';
      elPz.textContent = '📰 ' + (idx + 1) + '/' + series.length;
      elScore.textContent = '⭐ ' + score;
      api.score(score);
    }
    function tapCell(r, c) {
      if (locked || done) return;
      const cl = cells[r][c];
      if (r === sel.r && c === sel.c) {
        if (cl.wh >= 0 && cl.wv >= 0) sel.d = sel.d === 'H' ? 'V' : 'H';
      } else {
        sel.r = r; sel.c = c;
        if ((sel.d === 'H' && cl.wh < 0) || (sel.d === 'V' && cl.wv < 0)) sel.d = sel.d === 'H' ? 'V' : 'H';
      }
      render();
    }
    function step(dir) {
      const wi = activeWord();
      const aw = words[wi];
      const k = aw.cells.findIndex((x) => x[0] === sel.r && x[1] === sel.c);
      const nk = k + dir;
      if (nk >= 0 && nk < aw.cells.length) { sel.r = aw.cells[nk][0]; sel.c = aw.cells[nk][1]; }
    }
    function typeLetter(ch) {
      if (locked || done || !pz) return;
      const i = sel.r * n + sel.c;
      if (given[i]) { step(1); render(); return; }
      entries[i] = ch;
      delete wrongSet[i];
      step(1);
      render();
      save();
      checkSolved();
    }
    function backspace() {
      if (locked || done || !pz) return;
      let i = sel.r * n + sel.c;
      if (!entries[i] || given[i]) {
        step(-1);
        i = sel.r * n + sel.c;
      }
      if (!given[i]) { entries[i] = ''; delete wrongSet[i]; }
      render();
      save();
    }
    function gotoWord(delta) {
      if (locked || done) return;
      const wi = activeWord();
      const nw = (wi + delta + words.length) % words.length;
      const w = words[nw];
      sel = { r: w.cells[0][0], c: w.cells[0][1], d: w.d };
      render();
    }
    function checkSolved() {
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const cl = cells[r][c];
        if (cl.sol && entries[r * n + c] !== cl.sol) return;
      }
      locked = true;
      const base = 60 + (n - 5) * 20;
      const gain = Math.max(10, base - checks * 5 - hints * 15);
      score += gain;
      flash('🎉 Opgelost! +' + gain);
      idx++;
      hints = 0; checks = 0;
      render();
      if (idx >= series.length) setT(finish, 1500);
      else setT(() => { loadPuzzle(null); save(); }, 1500);
    }
    function check() {
      if (locked || done) return;
      wrongSet = {};
      let bad = 0;
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const i = r * n + c, cl = cells[r][c];
        if (cl.sol && entries[i] && entries[i] !== cl.sol) { wrongSet[i] = true; bad++; }
      }
      checks++;
      flash(bad ? '❌ ' + bad + ' letter(s) fout (rood)' : '👍 Tot nu toe goed!');
      render();
      save();
    }
    function hintLetter() {
      if (locked || done) return;
      const i = sel.r * n + sel.c;
      const sol = cells[sel.r][sel.c].sol;
      if (entries[i] === sol && given[i]) return;
      entries[i] = sol;
      given[i] = true;
      delete wrongSet[i];
      hints++;
      flash('💡 Letter onthuld');
      render();
      save();
      checkSolved();
    }
    function skip() {
      if (locked || done) return;
      locked = true;
      flash('Overgeslagen');
      idx++;
      hints = 0; checks = 0;
      if (idx >= series.length) setT(finish, 600);
      else setT(() => { loadPuzzle(null); save(); }, 600);
    }
    function finish() {
      if (done) return;
      done = true;
      clearTimeout(timer);
      api.clear();
      api.score(score);
      api.end(score);
    }

    KB.forEach((row, ri) => {
      const d = document.createElement('div');
      d.style.cssText = 'display:flex;gap:4px;justify-content:center;width:100%';
      const kw = Math.min(36, Math.floor((api.w - 24) / 10) - 4);
      row.split('').forEach((ch) => {
        const b = document.createElement('button');
        b.textContent = ch;
        b.style.cssText = 'width:' + kw + 'px;height:40px;border:0;border-radius:7px;background:#5b7fd0;color:#fff;font-size:17px;font-weight:700;cursor:pointer;touch-action:manipulation;padding:0';
        b.addEventListener('click', () => typeLetter(ch));
        d.appendChild(b);
      });
      if (ri === 2) {
        const b = document.createElement('button');
        b.textContent = '⌫';
        b.style.cssText = 'width:' + (kw * 1.6) + 'px;height:40px;border:0;border-radius:7px;background:#a33a4a;color:#fff;font-size:17px;font-weight:700;cursor:pointer;padding:0';
        b.addEventListener('click', backspace);
        d.appendChild(b);
      }
      elKb.appendChild(d);
    });
    q('prev').addEventListener('click', () => gotoWord(-1));
    q('next').addEventListener('click', () => gotoWord(1));
    q('chk').addEventListener('click', check);
    q('hnt').addEventListener('click', hintLetter);
    q('skp').addEventListener('click', skip);
    function onKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (!pz || !cells || !cells.length || !words || !words.length || !sel) return; // nog niet gestart
      if (e.key === 'Backspace') { backspace(); e.preventDefault(); return; }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const cl = cells[sel.r][sel.c];
        sel.d = e.key === 'ArrowRight' ? (cl.wh >= 0 ? 'H' : sel.d) : (cl.wv >= 0 ? 'V' : sel.d);
        step(1); render(); e.preventDefault(); return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { step(-1); render(); e.preventDefault(); return; }
      if (e.key === ' ' || e.key === 'Tab') { tapCell(sel.r, sel.c); e.preventDefault(); return; }
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) typeLetter(e.key.toUpperCase());
    }
    window.addEventListener('keydown', onKey);

    function begin(s) {
      started = true;
      let ok = false;
      if (s && Array.isArray(s.s) && s.s.length > 0 && s.s.every((v) => Number.isInteger(v) && v >= 0 && v < PUZZELS.length) &&
          Number.isInteger(s.i) && s.i >= 0 && s.i < s.s.length) {
        series = s.s; idx = s.i; score = Number(s.sc) || 0; hints = Number(s.h) || 0; checks = Number(s.k) || 0;
        ok = true;
      }
      if (!ok) { series = pickSeries(); idx = 0; score = 0; hints = 0; checks = 0; }
      loadPuzzle(ok ? s : null);
      if (ok) flash('Verder waar je was gebleven');
      save();
    }
    let p;
    try { p = api.load(); } catch (e) { p = Promise.resolve(null); }
    Promise.resolve(p).then((s) => { if (!dead) begin(s); }, () => { if (!dead) begin(null); });

    return {
      destroy() {
        save();
        dead = true;
        clearTimeout(timer); clearTimeout(mtimer);
        window.removeEventListener('keydown', onKey);
        if (root.parentNode) root.parentNode.removeChild(root);
      },
    };
  },
};
