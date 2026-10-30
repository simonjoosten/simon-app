// Technologie- en Creatief-packs.
import { kit } from './lib.mjs';

const cap = (s) => s[0].toUpperCase() + s.slice(1);

/* ---------------- TECHNOLOGIE ---------------- */
function computers() {
  const K = kit({ id: 'computers-basis', name: 'Computers: de basis', emoji: '💻', group: 'Technologie', desc: 'Onderdelen, geheugen, bestanden, sneltoetsen en binaire getallen.' });
  K.facts([['de processor (CPU)', 'het brein van de computer dat rekent'], ['het werkgeheugen (RAM)', 'tijdelijk geheugen voor programma\'s die draaien'], ['de harde schijf of SSD', 'bewaart je bestanden blijvend'], ['het toetsenbord', 'invoerapparaat om te typen'], ['de muis', 'invoerapparaat om te wijzen en te klikken'], ['het beeldscherm', 'toont wat de computer doet'], ['de printer', 'drukt documenten af op papier'], ['de scanner', 'maakt een digitale kopie van papier'], ['de luidspreker', 'speelt geluid af'], ['de microfoon', 'neemt geluid op'], ['de webcam', 'maakt beeld voor videobellen'], ['de USB-stick', 'draagbaar opslagmedium'], ['de router', 'verbindt je apparaten met internet'], ['het besturingssysteem', 'programma dat de computer beheert, zoals Windows of macOS'], ['de app', 'een programma voor een telefoon of tablet'], ['de cloud', 'opslag op computers van een bedrijf, via internet'], ['wifi', 'draadloos internet'], ['bluetooth', 'draadloze verbinding over korte afstand'], ['de browser', 'programma om websites te bekijken'], ['het wachtwoord', 'geheim om een account te beschermen']].map((r) => [r[0], r[1], '', { d: 2 }]), { f: (k) => `Wat is ${k}?`, r: (v) => `Welk onderdeel of begrip is dit: ${v}?`, t: (k, v) => `${cap(k)}: ${v}.`, typeMax: 0, type: false, d: 2, matchQ: 'Verbind het onderdeel met de uitleg', matches: 5 });
  K.groups({ invoer: ['toetsenbord', 'muis', 'microfoon', 'scanner', 'webcam', 'touchscreen'], uitvoer: ['beeldscherm', 'printer', 'luidspreker', 'koptelefoon', 'projector'] }, { which: (it) => `Is een ${it} een invoer- of uitvoerapparaat?`, names: ['invoer', 'uitvoer'], tfq: (it, c) => `Een ${it} is een ${c}apparaat.`, multi: (n) => `Welke zijn ${n}apparaten? (kies alle goede)`, reps: 4, d: 2 });
  const ext = [['.jpg', 'een foto'], ['.png', 'een afbeelding'], ['.mp3', 'muziek of geluid'], ['.mp4', 'een video'], ['.pdf', 'een document dat je goed kunt lezen en printen'], ['.txt', 'gewone tekst'], ['.docx', 'een Word-document'], ['.zip', 'een gecomprimeerd bestand'], ['.html', 'een webpagina'], ['.xlsx', 'een rekenblad (spreadsheet)']];
  K.facts(ext.map((r) => [r[0], r[1], '', {}]), { f: (k) => `Wat voor bestand is een ${k}-bestand?`, r: (v) => `Welke extensie hoort bij ${v}?`, t: (k, v) => `Een ${k}-bestand is ${v}.`, typeMax: 0, type: false, d: 2 });
  for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16, 20, 25, 31, 32, 42, 63, 64, 100, 128, 255]) {
    const b = n.toString(2);
    K.num(`Wat is ${b} (binair) in ons gewone getallenstelsel?`, n, { d: n < 10 ? 2 : 3, c: `parseInt("${b}",2)`, x: `${b} binair = ${n}.` });
    if (n <= 40) K.type(`Hoe schrijf je ${n} binair?`, b, [], { d: 3, c: `(${n}).toString(2)`, cf: 'str', x: `${n} = ${b} in binair.` });
  }
  K.mcs([
    ['Uit hoeveel bits bestaat een byte?', '8', ['2', '4', '16'], ''],
    ['Wat kan een bit zijn?', '0 of 1', ['A of B', 'ja, nee of misschien', 'groot of klein'], ''],
    ['Wat is groter: een megabyte of een gigabyte?', 'een gigabyte', ['een megabyte', 'een kilobyte', 'ze zijn even groot'], ''],
    ['Zet in volgorde van klein naar groot: KB, GB, MB.', 'KB, MB, GB', ['GB, MB, KB', 'MB, KB, GB', 'KB, GB, MB'], ''],
    ['Wat doet Ctrl + C (of Cmd + C)?', 'kopiëren', ['plakken', 'opslaan', 'afsluiten'], ''],
    ['Wat doet Ctrl + V (of Cmd + V)?', 'plakken', ['kopiëren', 'knippen', 'opslaan'], ''],
    ['Wat doet Ctrl + Z (of Cmd + Z)?', 'ongedaan maken', ['opslaan', 'plakken', 'afdrukken'], ''],
    ['Wat doet Ctrl + S (of Cmd + S)?', 'opslaan', ['printen', 'sluiten', 'kopiëren'], ''],
    ['Wat doet Ctrl + X (of Cmd + X)?', 'knippen', ['kopiëren', 'sluiten', 'plakken'], ''],
    ['Waarvoor dient een map (folder)?', 'om bestanden te ordenen', ['om te printen', 'om internet te zoeken', 'om te rekenen'], ''],
    ['Wat is een bestand?', 'een stuk informatie met een naam, opgeslagen op de computer', ['een stuk gereedschap', 'een stekker', 'een kabel'], ''],
    ['Wat gebeurt er als je je computer afsluit zonder op te slaan?', 'niet-opgeslagen werk kan verloren gaan', ['alles wordt automatisch beter', 'het werkt sneller', 'er gebeurt nooit iets'], ''],
    ['Wat is een virus op een computer?', 'schadelijk programma dat zich kan verspreiden', ['een echte ziekte', 'een nieuwe app', 'een soort muis'], ''],
    ['Wat is een firewall?', 'een beveiliging die ongewenst verkeer blokkeert', ['een kabel', 'een soort scherm', 'een foto'], ''],
    ['Wat betekent "downloaden"?', 'iets van internet naar je apparaat halen', ['iets van je apparaat naar internet sturen', 'iets verwijderen', 'iets printen'], ''],
    ['Wat betekent "uploaden"?', 'iets van je apparaat naar internet sturen', ['iets van internet halen', 'iets verwijderen', 'iets printen'], ''],
    ['Wat is een pixel?', 'een klein puntje van een beeld', ['een soort muis', 'een soort kabel', 'een soort toets'], ''],
    ['Wat is een icoon?', 'een klein plaatje dat een programma of bestand voorstelt', ['een soort muis', 'een soort wachtwoord', 'een kabel'], ''],
    ['Wat is een dubbelklik?', 'twee keer snel klikken', ['lang klikken', 'rechts klikken', 'vegen'], ''],
    ['Welke besturingssystemen bestaan er?', 'Windows, macOS, Linux, Android, iOS', ['Word, Excel, Chrome', 'Google, Bing, Yahoo', 'Roblox, Minecraft, Fortnite'], ''],
    ['Wat is een emoji?', 'een klein plaatje in tekst', ['een soort toets', 'een soort kabel', 'een soort schijf'], ''],
  ]);
  K.tfs([['Een computer rekent met 0 en 1.', true], ['Een USB-stick is een soort printer.', false], ['Een byte is 8 bits.', true], ['Een muis is een invoerapparaat.', true], ['Een bestand kan een foto zijn.', true], ['Wifi heeft kabels nodig.', false], ['Een computerprogramma bestaat uit instructies.', true]]);
  return K.out();
}

function veilig() {
  const K = kit({ id: 'internet-veilig', name: 'Veilig op internet', emoji: '🛡️', group: 'Technologie', desc: 'Wachtwoorden, phishing, privacy, pesten en verstandig online gedrag.' });
  K.mcs([
    ['Wat maakt een wachtwoord sterk?', 'lang, met letters, cijfers en tekens', ['je naam en geboortedatum', '1234', 'het woord wachtwoord'], ''],
    ['Met wie deel je je wachtwoord?', 'met niemand behalve je ouders of verzorgers', ['met je beste vriend', 'met iedereen in de klas', 'met onbekenden online'], ''],
    ['Wat is phishing?', 'nepberichten die je gegevens proberen te stelen', ['een visclub', 'een spelletje', 'een soort virus voor vissen'], ''],
    ['Wat doe je met een mail van een onbekende die vraagt om je wachtwoord?', 'niet reageren en melden aan een volwassene', ['antwoorden', 'het wachtwoord sturen', 'doorsturen aan vrienden'], ''],
    ['Wat is persoonlijke informatie?', 'bijvoorbeeld je naam, adres, school en telefoonnummer', ['je lievelingskleur', 'het weer', 'het merk van je pen'], ''],
    ['Wat doe je als iemand online pest?', 'vertel het aan een volwassene en blokkeer die persoon', ['pest terug', 'doe niets en blijf eenzaam', 'zet het op sociale media'], ''],
    ['Wat doe je als een vreemde in een spel vraagt waar je woont?', 'dat niet vertellen', ['je adres geven', 'je school noemen', 'een foto sturen'], ''],
    ['Wat doe je als je iets engs online ziet?', 'sluit het en vertel het aan een volwassene', ['kijk door', 'deel het met je klas', 'doe alsof er niets is'], ''],
    ['Wat is een goed idee voordat je een foto online zet?', 'denk eerst: zou ik dit later nog willen delen?', ['plaats het snel', 'deel ook je adres', 'laat het anderen kiezen zonder jou'], ''],
    ['Mag je zomaar foto\'s van anderen delen?', 'nee, vraag eerst toestemming', ['ja altijd', 'alleen als ze lelijk zijn', 'alleen s nachts'], ''],
    ['Waaraan herken je vaak een nep-website?', 'slechte spelling en vreemde webadressen', ['mooie plaatjes', 'veel kleuren', 'een lange pagina'], ''],
    ['Wat laat het slotje in de adresbalk meestal zien?', 'de verbinding is versleuteld (https)', ['de site is altijd veilig', 'de site is gratis', 'de site is nieuw'], ''],
    ['Wat is tweestapsverificatie?', 'een tweede bewijs (bijv. een code) naast je wachtwoord', ['twee wachtwoorden zonder code', 'een tweede computer', 'een vriend die inlogt'], ''],
    ['Waarom moet je updates installeren?', 'ze herstellen fouten en beveiligingsgaten', ['om meer reclame te zien', 'om de computer trager te maken', 'het is niet nodig'], ''],
    ['Wat is een goed idee bij een gratis download van een onbekende site?', 'niet doen', ['direct installeren', 'doorsturen', 'twee keer downloaden'], ''],
    ['Wat is cyberpesten?', 'pesten via internet of telefoon', ['pesten in de gymzaal', 'alleen online spelen', 'een spel'], ''],
    ['Wat is nepnieuws?', 'verzonnen of misleidend nieuws', ['nieuws op de radio', 'het weerbericht', 'een krantenkop'], ''],
    ['Hoe controleer je of nieuws klopt?', 'kijk of meerdere betrouwbare bronnen het melden', ['vraag het aan een onbekende', 'geloof wat je het eerst ziet', 'tel de likes'], ''],
    ['Wat is een gebruikersnaam?', 'een naam waarmee je inlogt (liefst zonder je echte naam)', ['je wachtwoord', 'je adres', 'je schoolnaam'], ''],
    ['Wat is een cookie op een website?', 'een klein bestand dat een site over jou onthoudt', ['een koekje om op te eten', 'een virus', 'een soort muis'], ''],
    ['Wat deel je liever niet met onbekenden online?', 'je echte naam, adres of school', ['deel alles met iedereen', 'praat met vreemden over thuis', 'geef je wachtwoord aan teamgenoten'], ''],
    ['Hoeveel tijd mag je aan een scherm besteden?', 'in overleg met je ouders, met pauzes', ['de hele nacht', 'zo lang als je wilt', 'nooit'], ''],
    ['Wat is een goed wachtwoord-trucje?', 'een zin van meerdere woorden gebruiken', ['dezelfde overal gebruiken', 'je naam', 'het woord "wachtwoord"'], ''],
    ['Waarom gebruik je niet overal hetzelfde wachtwoord?', 'als er één lekt, zijn al je accounts in gevaar', ['dat is makkelijker te onthouden', 'dat is verboden', 'het kost geld'], ''],
    ['Wat doe je als je per ongeluk iets geks hebt aangeklikt?', 'vertel het meteen aan een volwassene', ['verberg het', 'klik snel door', 'zeg niets'], ''],
  ]);
  K.groups({ 'wel doen': ['een sterk wachtwoord gebruiken', 'updates installeren', 'het aan een volwassene vertellen bij iets engs', 'eerst vragen voordat je een foto deelt', 'je scherm vergrendelen'], 'niet doen': ['je wachtwoord delen met vreemden', 'op elke link klikken', 'je adres in een chat zetten', 'onbekende bijlagen openen', 'pestberichten doorsturen'] }, { which: (it) => `Moet je dit wel of niet doen: ${it}?`, names: ['wel doen', 'niet doen'], tfq: (it, c) => `${cap(it)}: ${c === 'wel doen' ? 'goed idee' : 'geen goed idee'}.`, multi: (n) => `Welke dingen moet je ${n}? (kies alle goede)`, reps: 5, d: 1 });
  K.tfs([['Een lang wachtwoord is sterker dan een kort wachtwoord.', true], ['Je mag je wachtwoord met je beste vriend delen.', false], ['Phishing probeert je gegevens te stelen.', true], ['Je moet nooit vertellen over pestgedrag online.', false], ['Een website met https is altijd 100% veilig.', false, 'Het slotje betekent dat de verbinding versleuteld is, niet dat de site betrouwbaar is.'], ['Vertel nooit je adres aan vreemden online.', true], ['Alles wat op internet staat is waar.', false], ['Je mag zomaar foto\'s van anderen delen.', false]]);
  K.mcs([
    ['Mag je afspreken met iemand die je alleen online kent?', 'nee, niet zonder je ouders', ['ja, meteen', 'ja, in het donker', 'ja, als hij aardig lijkt'], ''],
    ['Wat is een goede reactie op een rare vriendschapsaanvraag van een onbekende?', 'negeren en niet accepteren', ['direct accepteren', 'je adres geven', 'een foto sturen'], ''],
    ['Wat betekent "online blijft online"?', 'wat je plaatst kun je moeilijk helemaal weghalen', ['alles verdwijnt na een dag', 'het kan nooit gevonden worden', 'alleen jij ziet het'], ''],
    ['Wat is een goede reden om je profiel op "privé" te zetten?', 'zodat alleen vrienden je berichten zien', ['zodat meer vreemden je volgen', 'zodat je adres bekend wordt', 'zodat je sneller inlogt'], ''],
    ['Wat moet je doen als iemand om geld vraagt in een spel?', 'het vertellen aan je ouders', ['het geld sturen', 'je bankpas geven', 'je wachtwoord geven'], ''],
    ['Wat is een scam?', 'oplichting via internet', ['een soort spel', 'een soort muis', 'een soort app'], ''],
    ['Wat is spam?', 'ongevraagde berichten, vaak reclame', ['je lievelingsmail', 'een beveiligingsprogramma', 'een soort wachtwoord'], ''],
    ['Wat doe je met een bericht dat zegt "Je hebt een prijs gewonnen, klik hier!"?', 'niet klikken', ['meteen klikken', 'doorsturen naar vrienden', 'je gegevens invullen'], ''],
    ['Waarom moet je uitloggen op een gedeelde computer?', 'zodat niemand anders in je account kan', ['om stroom te besparen', 'omdat het moet van de stekker', 'het hoeft niet'], ''],
    ['Wat is een pop-up?', 'een venster dat plotseling op je scherm verschijnt', ['een soort ijsje', 'een soort kabel', 'een soort wachtwoord'], ''],
    ['Wat doe je bij een pop-up die je schrik aanjaagt?', 'sluiten en een volwassene vertellen', ['klikken en betalen', 'je naam invullen', 'doorsturen'], ''],
    ['Wat is een goed idee bij het gebruiken van openbare wifi?', 'niet inloggen op belangrijke accounts', ['je bankgegevens invoeren', 'je wachtwoord delen', 'alles downloaden'], ''],
    ['Wat is een avatar?', 'een plaatje of figuurtje dat jou online voorstelt', ['een soort virus', 'een wachtwoord', 'een kabel'], ''],
    ['Welke foto kun je liever niet openbaar delen?', 'een foto met je huisnummer en schoolnaam erop', ['een foto van je knuffel', 'een foto van een boom', 'een foto van je tekening'], ''],
    ['Wat is een geheim wachtwoordvraag-antwoord?', 'iets dat alleen jij weet', ['je voornaam', 'de naam van je huisdier voor iedereen zichtbaar', 'je telefoonnummer'], ''],
    ['Wat is een goede manier om een wachtwoord te bewaren?', 'in een wachtwoordmanager of op een veilige plek', ['op een briefje op je scherm', 'in de chat', 'op een openbare site'], ''],
    ['Wat is het gevaar van "gratis" spelletjes met aankopen?', 'je kunt per ongeluk geld uitgeven', ['ze zijn altijd gratis', 'ze maken je computer sneller', 'er is geen gevaar'], ''],
    ['Wat moet je doen voor je een app installeert?', 'vragen aan je ouders en kijken wat de app wil weten', ['alles toestaan', 'de eerste de beste kiezen', 'niets lezen'], ''],
  ]);
  K.tfs([['Je moet altijd antwoorden op een bericht van een onbekende.', false], ['Een wachtwoord met je geboortedatum is veilig.', false], ['Je mag online alles zeggen, het blijft anoniem.', false, 'Wat je zegt kan anderen pijn doen, ook online.'], ['Een wachtwoordmanager kan helpen sterke wachtwoorden te bewaren.', true], ['Bijlagen van onbekenden kun je beter niet openen.', true], ['Als iemand pest online, kun je die persoon blokkeren.', true]]);
  return K.out();
}

function programmeren() {
  const K = kit({ id: 'programmeren', name: 'Programmeren: begrippen', emoji: '👩‍💻', group: 'Technologie', desc: 'Algoritmes, lussen, variabelen, voorwaarden en bugs.' });
  K.facts([['een algoritme', 'een stappenplan om iets op te lossen'], ['een variabele', 'een plek die een waarde onthoudt'], ['een lus (loop)', 'iets meerdere keren herhalen'], ['een voorwaarde (if)', 'iets doen als iets waar is'], ['een functie', 'een stukje code met een naam dat je kunt hergebruiken'], ['een bug', 'een fout in een programma'], ['debuggen', 'fouten in code zoeken en herstellen'], ['een programma', 'een rij instructies voor een computer'], ['code', 'de tekst waarmee je een computer opdrachten geeft'], ['een string', 'een stuk tekst in code'], ['een boolean', 'een waarde die waar of onwaar is'], ['een lijst (array)', 'een rij waarden onder één naam'], ['de input', 'wat je in een programma stopt'], ['de output', 'wat een programma teruggeeft'], ['een commentaar', 'een opmerking in code die de computer negeert'], ['een compiler', 'maakt van code een programma dat de computer kan draaien'], ['een event', 'iets dat gebeurt, zoals een klik'], ['sequentie', 'dingen in vaste volgorde uitvoeren']].map((r) => [r[0], r[1], '', { d: 2 }]), { f: (k) => `Wat is ${k}?`.replace('Wat is debuggen?', 'Wat is debuggen?').replace('Wat is code?', 'Wat is code?'), r: (v) => `Welk begrip hoort bij: ${v}?`, t: (k, v) => `${cap(k)}: ${v}.`, typeMax: 0, type: false, d: 2, matchQ: 'Verbind het begrip met de uitleg', matches: 5 });
  for (let a = 1; a <= 9; a++) for (const b of [2, 3, 5]) { if ((a + b) % 2) K.num(`x = ${a}. Daarna x = x + ${b}. Wat is nu x?`, a + b, { d: 2, c: `${a}+${b}`, x: `${a} + ${b} = ${a + b}` }); }
  for (let a = 2; a <= 9; a++) K.num(`x = ${a}. Daarna x = x × 2. Wat is nu x?`, a * 2, { d: 2, c: `${a}*2` });
  for (let n = 2; n <= 8; n++) for (const s of [2, 3, 5]) { if ((n * s) % 3 !== 1) K.num(`Een lus herhaalt "stap ${s} naar voren" ${n} keer. Hoeveel stappen zet je in totaal?`, n * s, { d: 2, c: `${n}*${s}`, x: `${n} × ${s} = ${n * s}` }); }
  for (let t = 1; t <= 6; t++) K.num(`Een lus telt van 1 tot ${t + 3}. Hoe vaak herhaalt de lus?`, t + 3, { d: 2, c: `${t}+3` });
  K.order('Zet de stappen van een algoritme voor thee zetten in volgorde', ['water koken', 'theezakje in kopje doen', 'water in kopje gieten', 'even wachten', 'theezakje eruit halen'], { d: 1 });
  K.order('Zet de stappen van een algoritme voor tandenpoetsen in volgorde', ['tandenborstel pakken', 'tandpasta erop doen', 'tanden poetsen', 'mond spoelen'], { d: 1 });
  K.order('Zet de stappen in volgorde: een boterham met kaas maken', ['brood pakken', 'boter smeren', 'kaas erop leggen', 'brood dichtklappen'], { d: 1 });
  K.order('Zet de stappen in volgorde: een programma schrijven', ['probleem bedenken', 'stappen plannen', 'code schrijven', 'testen en bugs oplossen'], { d: 2 });
  K.mcs([
    ['Wat is Scratch?', 'een programmeertaal met blokken', ['een spel met krassen', 'een tekstverwerker', 'een rekenmachine'], ''],
    ['Welke zijn programmeertalen?', 'Python en JavaScript', ['Word en Excel', 'Chrome en Safari', 'Google en Bing'], ''],
    ['Wat is HTML?', 'de taal waarmee webpagina\'s worden opgebouwd', ['een soort muis', 'een computerspel', 'een bestandssysteem'], ''],
    ['Wat is een robot?', 'een machine die opdrachten uitvoert', ['een soort dier', 'een app', 'een kabel'], ''],
    ['Wat gebeurt er als je code een fout bevat?', 'het programma werkt niet zoals bedoeld', ['de computer wordt blauw', 'er gebeurt niks speciaals', 'het programma wordt sneller'], ''],
    ['Wat is een "if" in code?', 'een voorwaarde: als dit waar is, dan...', ['een herhaling', 'een getal', 'een kleur'], ''],
    ['Wat is een "for" of "while" in code?', 'een lus', ['een voorwaarde', 'een variabele', 'een commentaar'], ''],
    ['Als score = 5 en je doet score = score + 1, wat is score dan?', '6', ['5', '1', '0'], ''],
    ['Wat is de output van: print("Hallo")?', 'Hallo', ['"Hallo" met aanhalingstekens, altijd', 'niets', 'een foto'], ''],
    ['Hoe heet het proces van fouten zoeken in code?', 'debuggen', ['printen', 'compileren', 'kopiëren'], ''],
    ['Waarom test je een programma?', 'om fouten te vinden', ['om het mooier te maken alleen', 'omdat het moet van de stekker', 'om het langzamer te maken'], ''],
    ['Wat is een sprite in Scratch?', 'een figuurtje dat je kunt programmeren', ['een frisdrank', 'een soort scherm', 'een bug'], ''],
    ['Wat doet een lus als je "herhaal 10 keer" gebruikt?', 'het blok 10 keer uitvoeren', ['het blok 10 seconden pauzeren', 'het blok verwijderen', 'het blok verdubbelen zonder uitvoeren'], ''],
    ['Welke is een variabele?', 'score', ['10', '"hallo"', 'true'], ''],
    ['Wat is true of false?', 'een boolean', ['een string', 'een lus', 'een commentaar'], ''],
    ['Wat is een stappenplan?', 'een lijst met stappen in de goede volgorde', ['een tekening', 'een spel', 'een grafiek'], ''],
    ['Waarom is volgorde belangrijk in code?', 'de computer voert stappen na elkaar uit', ['de computer kiest zelf', 'het maakt niet uit', 'alleen kleuren tellen'], ''],
  ]);
  K.tfs([['Een computer voert code precies uit, ook als er een fout in zit.', true], ['Een algoritme is een stappenplan.', true], ['Een variabele kan een waarde onthouden.', true], ['Een bug is een nuttige functie.', false], ['Python is een programmeertaal.', true], ['Programmeren kan alleen met een muis.', false]]);
  return K.out();
}

function logica() {
  const K = kit({ id: 'logica-puzzels', name: 'Logica en puzzels', emoji: '🧩', group: 'Technologie', desc: 'Patronen, vreemde eend, redeneren en slimme raadsels.' });
  const sh = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'];
  const pats = [[0, 1], [0, 0, 1], [0, 1, 2], [0, 1, 1], [0, 1, 2, 1]];
  for (let r = 0; r < 28; r++) {
    const pat = pats[r % pats.length]; const cols = K.shuf(sh).slice(0, 3); const len = pat.length;
    const seq = []; for (let i = 0; i < len * 3; i++) seq.push(cols[pat[i % len]]);
    const shown = seq.slice(0, len * 2 + 1); const ans = seq[len * 2 + 1];
    K.mc(`${shown.join(' ')} ... Welke komt hierna?`, ans, sh.filter((z) => z !== ans), { d: len > 2 ? 2 : 1 });
  }
  K.groups({ dier: ['hond', 'kat', 'paard', 'koe', 'vis', 'vogel'], voertuig: ['auto', 'fiets', 'trein', 'bus', 'vliegtuig', 'boot'], fruit: ['appel', 'peer', 'banaan', 'druif', 'kers', 'mango'], kleding: ['jas', 'broek', 'sok', 'muts', 'trui', 'jurk'], meubel: ['stoel', 'tafel', 'kast', 'bed', 'bank', 'bureau'] }, { multi: (n) => `Welke zijn een ${n}? (kies alle goede)`, reps: 3, d: 1 });
  const odd = [['appel, peer, banaan, fiets', 'fiets'], ['hond, kat, paard, auto', 'auto'], ['rood, blauw, groen, tafel', 'tafel'], ['trein, bus, auto, banaan', 'banaan'], ['2, 4, 6, 7', '7'], ['3, 6, 9, 10', '10'], ['maandag, dinsdag, juli, vrijdag', 'juli'], ['vierkant, cirkel, driehoek, kat', 'kat'], ['piano, gitaar, viool, schoen', 'schoen'], ['koe, schaap, geit, tijger', 'tijger'], ['5, 10, 15, 22', '22'], ['januari, februari, zondag, maart', 'zondag']];
  for (const [list, a] of odd) K.mc(`Welke hoort er niet bij: ${list}?`, a, list.split(', ').filter((z) => z !== a), { d: 1 });
  K.mcs([
    ['Alle katten zijn dieren. Mimi is een kat. Is Mimi een dier?', 'ja', ['nee', 'misschien', 'dat kun je niet weten'], ''],
    ['Alle vogels hebben veren. Een mus is een vogel. Heeft een mus veren?', 'ja', ['nee', 'soms', 'dat kun je niet weten'], ''],
    ['Alle vissen zwemmen. Een zalm is een vis. Zwemt een zalm?', 'ja', ['nee', 'soms', 'dat kun je niet weten'], ''],
    ['Alle kinderen gaan naar school. Sam is een kind. Gaat Sam naar school?', 'ja', ['nee', 'soms', 'dat staat er niet'], ''],
    ['Sommige dieren kunnen vliegen. Een hond is een dier. Kan een hond vliegen?', 'dat kun je hieruit niet weten', ['ja', 'nee', 'altijd'], ''],
    ['Hond is voor puppy zoals kat is voor ...', 'kitten', ['muis', 'vis', 'ei'], ''],
    ['Vogel is voor lucht zoals vis is voor ...', 'water', ['land', 'ijs', 'zand'], ''],
    ['Warm is voor zomer zoals koud is voor ...', 'winter', ['lente', 'herfst', 'zon'], ''],
    ['Dag is voor licht zoals nacht is voor ...', 'donker', ['school', 'zon', 'warm'], ''],
    ['Koe is voor melk zoals kip is voor ...', 'ei', ['veer', 'vlees', 'graan'], ''],
    ['Oog is voor zien zoals oor is voor ...', 'horen', ['ruiken', 'proeven', 'voelen'], ''],
    ['Pen is voor schrijven zoals schaar is voor ...', 'knippen', ['plakken', 'tekenen', 'lezen'], ''],
    ['Ik ben eerst, na mij komt tweede. Welke plek heb ik?', 'de eerste plek', ['de tweede plek', 'de laatste plek', 'geen plek'], ''],
    ['Een vader heeft vier dochters. Elke dochter heeft één broer. Hoeveel kinderen heeft de vader?', '5', ['4', '8', '9'], 'Vier dochters en één zoon (hun broer is dezelfde jongen).'],
    ['Wat is zwaarder: een kilo veren of een kilo stenen?', 'ze zijn even zwaar', ['de stenen', 'de veren', 'dat hangt van de dag af'], ''],
    ['Hoeveel maanden hebben 28 dagen?', 'alle 12', ['1', '2', '6'], 'Elke maand heeft minstens 28 dagen.'],
    ['Wat gaat omhoog maar komt nooit meer omlaag?', 'je leeftijd', ['een bal', 'een vogel', 'regen'], ''],
    ['Wat heeft een rug maar geen benen?', 'een boek', ['een kat', 'een tafel', 'een kind'], ''],
    ['Wat heeft vier poten maar kan niet lopen?', 'een tafel', ['een paard', 'een hond', 'een kat'], ''],
    ['Wat wordt natter naarmate het meer droogt?', 'een handdoek', ['een spons zonder water', 'een steen', 'een boek'], ''],
    ['Als gisteren morgen was, was vandaag ...', 'vrijdag als morgen zaterdag is... (gewoon een vreemde zin, gokspelletje)', ['altijd dinsdag', 'nooit', 'maandag'], ''],
  ].filter((r) => !r[0].startsWith('Als gisteren')));
  for (let t = 0; t < 14; t++) {
    const a = 2 + (t % 5), b = 3 + (t % 4), k = 2 + (t % 3);
    K.num(`Als ${k} appels ${k * a} euro kosten, hoeveel kosten ${k + 2} appels?`, (k + 2) * a, { d: 3, c: `${k + 2}*${a}`, x: `Eén appel kost ${a} euro.` });
    K.num(`Een getal is ${b} groter dan ${a * 2}. Welk getal is het?`, a * 2 + b, { d: 2, c: `${a}*2+${b}` });
  }
  for (const [d1, d2, a] of [['maandag', 3, 'donderdag'], ['dinsdag', 4, 'zaterdag'], ['woensdag', 2, 'vrijdag'], ['vrijdag', 3, 'maandag'], ['zaterdag', 2, 'maandag'], ['zondag', 5, 'vrijdag'], ['donderdag', 4, 'maandag']]) K.mc(`Het is ${d1}. Welke dag is het over ${d2} dagen?`, a, ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'].filter((z) => z !== a), { d: 2 });
  K.tfs([['Als A groter is dan B en B groter is dan C, dan is A groter dan C.', true], ['Een kilo veren is lichter dan een kilo stenen.', false], ['Elke rij 2, 4, 6, 8 is een rij even getallen.', true], ['Als het regent worden de straten nat, dus als de straat nat is heeft het altijd geregend.', false, 'Er kan ook iets anders zijn: een sproeier of een schoonmaakwagen.'], ['De vierde maand is mei.', false, 'April is de vierde maand.']]);
  K.order('Zet van klein naar groot', ['1/4', '1/2', '3/4', '1'], { d: 2 });
  K.order('Zet in volgorde van klein naar groot: kikkervisje, volwassen kikker, kikkerdril', ['kikkerdril', 'kikkervisje', 'volwassen kikker'], { d: 2, x: 'Eerst eitjes (kikkerdril), dan kikkervisje, dan kikker.' });
  return K.out();
}

/* ---------------- CREATIEF ---------------- */
function instrumenten() {
  const K = kit({ id: 'muziekinstrumenten', name: 'Muziek en instrumenten', emoji: '🎻', group: 'Creatief', desc: 'Instrumenten, orkest, noten, tel-lengtes en beroemde componisten.' });
  const G = { strijkinstrument: ['viool', 'altviool', 'cello', 'contrabas'], houtblaasinstrument: ['dwarsfluit', 'hobo', 'klarinet', 'fagot', 'blokfluit'], koperblaasinstrument: ['trompet', 'trombone', 'hoorn', 'tuba'], slaginstrument: ['trom', 'pauken', 'xylofoon', 'triangel', 'bekkens', 'tamboerijn'], toetsinstrument: ['piano', 'orgel', 'klavecimbel', 'keyboard'], 'tokkel- of snaarinstrument': ['gitaar', 'harp', 'banjo', 'ukelele'] };
  const E = { viool: '🎻', gitaar: '🎸', trompet: '🎺', piano: '🎹', trom: '🥁', xylofoon: '🎶', saxofoon: '🎷', dwarsfluit: '🎶' };
  K.groups(G, { which: (it) => `Tot welke groep instrumenten hoort de ${it}?`, tfq: (it, c) => `De ${it} is een ${c}.`, e: E, multi: (n) => `Welke zijn een ${n}? (kies alle goede)`, reps: 4, d: 2, names: Object.keys(G) });
  K.facts([['piano', '88', 'Een piano heeft 88 toetsen.'], ['gitaar', '6', 'Een gewone gitaar heeft 6 snaren.'], ['viool', '4', ''], ['cello', '4', ''], ['contrabas', '4', ''], ['harp', '47', 'Een concertharp heeft 47 snaren.'], ['ukelele', '4', '']].map((r) => [r[0], r[1], r[2], { d: 2 }]), { f: (k) => `Hoeveel ${k === 'piano' ? 'toetsen' : 'snaren'} heeft een ${k} (meestal)?`, pool: ['4', '6', '12', '47', '88', '10'], type: false, t: (k, v) => `Een ${k} heeft ${v} ${k === 'piano' ? 'toetsen' : 'snaren'}.`, d: 2 });
  K.mcs([
    ['Hoe heet de persoon die een orkest leidt?', 'de dirigent', ['de zanger', 'de componist', 'de presentator'], ''],
    ['Hoe heet iemand die muziek schrijft?', 'een componist', ['een dirigent', 'een zanger', 'een presentator'], ''],
    ['Hoe heet een groep mensen die samen op instrumenten speelt?', 'een orkest', ['een koor', 'een toneel', 'een kudde'], ''],
    ['Hoe heet een groep mensen die samen zingt?', 'een koor', ['een orkest', 'een band', 'een kudde'], ''],
    ['Hoeveel tellen duurt een hele noot?', '4', ['1', '2', '8'], ''],
    ['Hoeveel tellen duurt een halve noot?', '2', ['1', '4', '8'], ''],
    ['Hoeveel tellen duurt een kwartnoot?', '1', ['2', '4', '1/2'], ''],
    ['Welke notennamen horen bij een toonladder?', 'do, re, mi, fa, sol, la, si', ['rood, geel, groen', 'a, b, c, x, y', 'een, twee, drie'], ''],
    ['Op welke lijnen schrijf je noten?', 'op een notenbalk met 5 lijnen', ['op een lijn', 'op 3 lijnen', 'op 10 lijnen'], ''],
    ['Hoe heet het teken aan het begin van een notenbalk?', 'de sleutel', ['de kop', 'de bladzijde', 'de pauze'], ''],
    ['Wat is een melodie?', 'een rij tonen die een lied vormt', ['een snelle trom', 'een soort instrument', 'een dans'], ''],
    ['Wat is ritme?', 'de patronen van lange en korte tonen', ['de kleur van een lied', 'de tekst van een lied', 'de zanger'], ''],
    ['Wat is tempo?', 'hoe snel of langzaam muziek gaat', ['hoe hard muziek is', 'hoe hoog muziek is', 'de kleur'], ''],
    ['Wat is volume?', 'hoe hard of zacht muziek klinkt', ['hoe snel muziek gaat', 'hoe lang het stuk duurt', 'de tekst'], ''],
    ['Welke componist schreef de Vier Jaargetijden?', 'Vivaldi', ['Mozart', 'Beethoven', 'Bach'], ''],
    ['Welke componist is als wonderkind bekend, kwam uit Oostenrijk?', 'Mozart', ['Vivaldi', 'Bach', 'Beethoven'], ''],
    ['Welke beroemde componist werd later doof?', 'Beethoven', ['Mozart', 'Vivaldi', 'Bach'], ''],
    ['Welke Duitse componist schreef veel orgelmuziek en de Matthäus-Passion?', 'Bach', ['Mozart', 'Vivaldi', 'Beethoven'], ''],
    ['Welk instrument heeft een toetsenbord en pedalen en staat vaak in een kerk?', 'het orgel', ['de gitaar', 'de trom', 'de fluit'], ''],
    ['Hoe noem je het harde en zachte in muziek?', 'dynamiek', ['tempo', 'ritme', 'melodie'], ''],
    ['Hoe heet een lied dat een stem met begeleiding zingt, zonder instrument?', 'a capella', ['solo', 'orkest', 'opera'], ''],
    ['Wat is een opera?', 'een toneelstuk waarin gezongen wordt', ['een soort sportwedstrijd', 'een dansje', 'een boek'], ''],
    ['Wat is een solo?', 'een stuk dat één persoon speelt of zingt', ['een stuk voor een groot orkest', 'een stuk voor twee personen', 'een dans'], ''],
    ['Wat is een duet?', 'een stuk voor twee personen', ['een stuk voor één persoon', 'een stuk voor drie personen', 'een trio'], ''],
  ]);
  K.order('Zet de notenwaarden van lang naar kort', ['hele noot', 'halve noot', 'kwartnoot', 'achtste noot'], { d: 2 });
  K.order('Zet de instrumenten van laag naar hoog klinkend (ongeveer)', ['contrabas', 'cello', 'altviool', 'viool'], { d: 3 });
  K.tfs([['Een gitaar heeft meestal zes snaren.', true], ['Een trompet is een strijkinstrument.', false], ['Een piano heeft 88 toetsen.', true], ['Een dirigent leidt een orkest.', true], ['Een viool wordt met een strijkstok bespeeld.', true], ['Een triangel is een slaginstrument.', true], ['Een hobo is een koperblaasinstrument.', false, 'De hobo is een houtblaasinstrument.']]);
  return K.out();
}

function kleuren() {
  const K = kit({ id: 'kleuren-mengen', name: 'Kleuren mengen', emoji: '🎨', group: 'Creatief', desc: 'Primaire en secundaire kleuren, mengen met wit en zwart en warme en koude kleuren.' });
  const mix = [['rood', 'geel', 'oranje', '🟥', '🟨'], ['geel', 'blauw', 'groen', '🟨', '🟦'], ['blauw', 'rood', 'paars', '🟦', '🟥'], ['rood', 'wit', 'roze', '🟥', '⬜'], ['blauw', 'wit', 'lichtblauw', '🟦', '⬜'], ['zwart', 'wit', 'grijs', '⬛', '⬜'], ['geel', 'wit', 'lichtgeel', '🟨', '⬜'], ['rood', 'groen', 'bruin', '🟥', '🟩'], ['rood', 'zwart', 'donkerrood', '🟥', '⬛'], ['blauw', 'zwart', 'donkerblauw', '🟦', '⬛'], ['groen', 'wit', 'lichtgroen', '🟩', '⬜'], ['oranje', 'blauw', 'bruin', '🟧', '🟦'], ['paars', 'wit', 'lila', '🟪', '⬜']];
  const PIX = ['oranje', 'groen', 'paars', 'roze', 'lichtblauw', 'grijs', 'bruin', 'lila', 'geel', 'rood', 'blauw', 'wit', 'zwart'];
  for (const [a, b, c] of mix) {
    for (const [x, y] of [[a, b], [b, a]]) {
      K.mc(`Wat krijg je als je ${x} en ${y} verf mengt?`, c, PIX.filter((p) => p !== c && p !== x && p !== y), { d: ['oranje', 'groen', 'paars'].includes(c) ? 1 : 2, x: `${cap(a)} + ${b} = ${c}.` });
      K.fill(`${cap(x)} + ${y} = ___`, c, PIX.filter((p) => p !== c), { d: 2 });
    }
    K.tf(`${cap(a)} en ${b} mengen geeft ${c}.`, true, { d: 1 });
    const w = PIX.filter((p) => p !== c)[(a.length + b.length) % 11];
    K.tf(`${cap(a)} en ${b} mengen geeft ${w}.`, false, { d: 2, x: `Het wordt ${c}.` });
  }
  K.mcs([
    ['Welke zijn de drie primaire kleuren (verf)?', 'rood, geel en blauw', ['groen, oranje en paars', 'zwart, wit en grijs', 'roze, bruin en blauw'], 'Je kunt ze niet mengen uit andere kleuren.'],
    ['Welke zijn de drie secundaire kleuren?', 'oranje, groen en paars', ['rood, geel en blauw', 'zwart, wit en grijs', 'roze, bruin en lila'], ''],
    ['Welke kleur maak je door alle verfkleuren te mengen?', 'een donkerbruine of grijze kleur', ['wit', 'goud', 'helder geel'], ''],
    ['Wat gebeurt er als je wit bij een kleur doet?', 'de kleur wordt lichter', ['de kleur wordt donkerder', 'de kleur verdwijnt niet', 'de kleur wordt rood'], ''],
    ['Wat gebeurt er als je zwart bij een kleur doet?', 'de kleur wordt donkerder', ['de kleur wordt lichter', 'de kleur wordt geel', 'niets'], ''],
    ['Welke kleuren noem je warm?', 'rood, oranje en geel', ['blauw, groen en paars', 'zwart, wit en grijs', 'alleen roze'], ''],
    ['Welke kleuren noem je koud?', 'blauw, groen en paars', ['rood, oranje en geel', 'alleen zwart', 'roze en rood'], ''],
    ['Welke kleur is de complementaire kleur van rood?', 'groen', ['geel', 'blauw', 'oranje'], 'Complementaire kleuren liggen tegenover elkaar op de kleurencirkel.'],
    ['Welke kleur is de complementaire kleur van blauw?', 'oranje', ['groen', 'paars', 'geel'], ''],
    ['Welke kleur is de complementaire kleur van geel?', 'paars', ['oranje', 'groen', 'rood'], ''],
    ['Wat is een kleurencirkel?', 'een cirkel waarop je kleuren op een rij ziet', ['een soort kleurpotlood', 'een soort schilderij', 'een soort gum'], ''],
    ['Welke kleuren heeft de Nederlandse vlag?', 'rood, wit en blauw', ['oranje, wit en blauw', 'rood, wit en groen', 'blauw, geel en rood'], 'De volgorde is rood, wit, blauw van boven naar beneden.'],
    ['Met welke drie kleuren licht mengt een beeldscherm (RGB)?', 'rood, groen en blauw', ['rood, geel en blauw', 'cyaan, magenta en geel alleen', 'zwart, wit en rood'], ''],
    ['Wat krijg je als je rood en groen licht mengt?', 'geel', ['bruin', 'wit', 'blauw'], 'Bij licht werkt mengen anders dan bij verf.'],
    ['Welke kleur zie je als je alle kleuren licht mengt?', 'wit', ['zwart', 'bruin', 'grijs'], ''],
    ['Welke kleur is de afwezigheid van licht?', 'zwart', ['wit', 'grijs', 'bruin'], ''],
    ['Welke twee kleuren maken roze?', 'rood en wit', ['blauw en geel', 'groen en rood', 'zwart en wit'], ''],
    ['Welke twee kleuren maken groen?', 'geel en blauw', ['rood en blauw', 'rood en geel', 'wit en zwart'], ''],
    ['Welke twee kleuren maken paars?', 'rood en blauw', ['geel en blauw', 'rood en geel', 'wit en zwart'], ''],
    ['Welke twee kleuren maken oranje?', 'rood en geel', ['geel en blauw', 'rood en blauw', 'wit en zwart'], ''],
  ]);
  K.order('Zet de kleuren van de regenboog in volgorde', ['rood', 'oranje', 'geel', 'groen', 'blauw', 'paars'], { d: 1 });
  K.groups({ warm: ['rood', 'oranje', 'geel', 'roze', 'bruin'], koud: ['blauw', 'groen', 'paars', 'turkoois', 'lila'] }, { which: (it) => `Is ${it} een warme of een koude kleur?`, names: ['warm', 'koud'], tfq: (it, c) => `${cap(it)} is een ${c === 'warm' ? 'warme' : 'koude'} kleur.`, multi: (n) => `Welke zijn ${n === 'warm' ? 'warme' : 'koude'} kleuren? (kies alle goede)`, reps: 5, d: 2 });
  return K.out();
}

function kunst() {
  const K = kit({ id: 'kunst', name: 'Kunst en kunstenaars', emoji: '🖼️', group: 'Creatief', desc: 'Beroemde schilders, schilderijen, technieken en musea.' });
  K.facts([['De Nachtwacht', 'Rembrandt'], ['Meisje met de parel', 'Johannes Vermeer'], ['Zonnebloemen', 'Vincent van Gogh'], ['De sterrennacht', 'Vincent van Gogh'], ['Mona Lisa', 'Leonardo da Vinci'], ['De Schreeuw', 'Edvard Munch'], ['Waterlelies', 'Claude Monet'], ['Guernica', 'Pablo Picasso'], ['De volharding van het geheugen (smeltende klokken)', 'Salvador Dalí'], ['Compositie met rood, blauw en geel', 'Piet Mondriaan'], ['Relativiteit (trappen die kloppen niet)', 'M.C. Escher'], ['Het plafond van de Sixtijnse Kapel', 'Michelangelo'], ['De aardappeleters', 'Vincent van Gogh'], ['Het melkmeisje', 'Johannes Vermeer']].map((r) => [r[0], r[1], '', { d: 2 }]), { f: (k) => `Wie maakte "${k}"?`, t: (k, v) => `"${k}" is van ${v}.`, type: false, typeMax: 0, d: 2, matchQ: 'Verbind het kunstwerk met de kunstenaar', matches: 3 });
  K.facts([['Vincent van Gogh', 'Nederland'], ['Rembrandt', 'Nederland'], ['Johannes Vermeer', 'Nederland'], ['Piet Mondriaan', 'Nederland'], ['M.C. Escher', 'Nederland'], ['Dick Bruna (Nijntje)', 'Nederland'], ['Pablo Picasso', 'Spanje'], ['Salvador Dalí', 'Spanje'], ['Leonardo da Vinci', 'Italië'], ['Michelangelo', 'Italië'], ['Claude Monet', 'Frankrijk'], ['Edvard Munch', 'Noorwegen'], ['Frida Kahlo', 'Mexico']].map((r) => [r[0], r[1], '', { d: 3 }]), { f: (k) => `Uit welk land komt ${k}?`, t: (k, v) => `${k} komt uit ${v}.`, pool: ['Nederland', 'Spanje', 'Italië', 'Frankrijk', 'Noorwegen', 'Mexico', 'Duitsland', 'België'], type: false, d: 3 });
  K.facts([['aquarel', 'verf met veel water, doorzichtig'], ['olieverf', 'dikke verf op doek'], ['houtskool', 'zwart potlood van verbrand hout'], ['collage', 'een kunstwerk van geplakte stukjes papier of materiaal'], ['mozaïek', 'een afbeelding van kleine steentjes'], ['keramiek', 'kunst van gebakken klei'], ['beeldhouwen', 'een beeld maken uit steen of hout'], ['een portret', 'een afbeelding van een persoon'], ['een landschap', 'een afbeelding van de natuur'], ['een stilleven', 'een afbeelding van voorwerpen zoals fruit'], ['een zelfportret', 'een portret dat de kunstenaar van zichzelf maakt'], ['een graffiti', 'een tekening of tekst op een muur'], ['een karikatuur', 'een overdreven tekening van een persoon'], ['een silhouet', 'alleen de donkere omtrek van een vorm']].map((r) => [r[0], r[1], '', { d: 2 }]), { f: (k) => `Wat is ${k}?`, r: (v) => `Welk kunstwoord hoort hierbij: ${v}?`, t: (k, v) => `${cap(k)}: ${v}.`, typeMax: 0, type: false, d: 2, matchQ: 'Verbind het kunstwoord met de uitleg', matches: 3 });
  K.mcs([
    ['In welk museum hangt De Nachtwacht?', 'het Rijksmuseum', ['het Van Gogh Museum', 'het Louvre', 'het Mauritshuis'], ''],
    ['In welk museum in Amsterdam hangen veel werken van Van Gogh?', 'het Van Gogh Museum', ['het Rijksmuseum', 'het Scheepvaartmuseum', 'het Anne Frank Huis'], ''],
    ['In welk Parijs museum hangt de Mona Lisa?', 'het Louvre', ['het Rijksmuseum', 'het Prado', 'de Tate'], ''],
    ['In welke stad staat het Mauritshuis (Meisje met de parel)?', 'Den Haag', ['Amsterdam', 'Utrecht', 'Rotterdam'], ''],
    ['Welke kunststroming probeert een indruk van licht te geven, zoals Monet?', 'het impressionisme', ['het kubisme', 'het surrealisme', 'de popart'], ''],
    ['Welke kunststroming laat dingen vooral als kubusvormen zien?', 'het kubisme', ['het impressionisme', 'het surrealisme', 'de gotiek'], ''],
    ['Wat is het surrealisme?', 'kunst die lijkt op dromen', ['kunst van heel kleine plaatjes', 'kunst van gras', 'kunst in zwart-wit'], ''],
    ['Wat is een schetsboek?', 'een boek waar je in tekent', ['een boek over sport', 'een kookboek', 'een telefoonboek'], ''],
    ['Wat is een schilderij op een doek bevestigd aan?', 'een schildersezel', ['een ladder', 'een stoel', 'een bord'], 'De schildersezel houdt het doek omhoog.'],
    ['Wat is een palet?', 'het bord waarop een schilder verf mengt', ['een kleur', 'een soort kwast', 'een soort doek'], ''],
    ['Welke gereedschappen gebruik je om te schilderen?', 'kwast en verf', ['schaar en lijm alleen', 'hamer en spijkers', 'liniaal en passer alleen'], ''],
    ['Wat is een beeldhouwer?', 'iemand die beelden maakt van steen of hout', ['iemand die schildert', 'iemand die zingt', 'iemand die koekjes bakt'], ''],
    ['Wat is een fotograaf?', 'iemand die foto\'s maakt', ['iemand die schildert', 'iemand die fluit', 'iemand die schrijft'], ''],
    ['Wat is een tentoonstelling?', 'een plek waar kunst wordt getoond', ['een soort school', 'een soort winkel voor eten', 'een sport'], ''],
    ['Wat is een atelier?', 'de werkplek van een kunstenaar', ['een restaurant', 'een bioscoop', 'een bibliotheek'], ''],
    ['Wat is een tekening gemaakt met een potlood vaak?', 'een schets', ['een beeld', 'een mozaïek', 'een film'], ''],
    ['Welke kleuren gebruikte Mondriaan vooral?', 'rood, geel, blauw, zwart en wit', ['groen, paars en roze', 'alleen zwart', 'goud en zilver'], ''],
    ['Welk dier is de hoofdrolspeler in boeken van Dick Bruna?', 'een konijn (Nijntje)', ['een hond', 'een kat', 'een beer'], ''],
  ]);
  K.tfs([['De Nachtwacht is van Rembrandt.', true], ['Van Gogh was een Nederlandse schilder.', true], ['Een aquarel gebruikt veel olie.', false, 'Een aquarel gebruikt water.'], ['Een portret toont een persoon.', true], ['Mondriaan schilderde vooral dieren.', false], ['Picasso was een Spaanse kunstenaar.', true], ['Een mozaïek bestaat uit kleine steentjes of stukjes.', true]]);
  return K.out();
}

function filmsBoeken() {
  const K = kit({ id: 'films-boeken', name: 'Boeken en films voor kids', emoji: '📚', group: 'Creatief', desc: 'Sprookjes, bekende kinderboeken, schrijvers en films.' });
  K.facts([['Matilda', 'Roald Dahl'], ['De GVR (de Grote Vriendelijke Reus)', 'Roald Dahl', 'Ook BFG genoemd.'], ['Charlie en de chocoladefabriek', 'Roald Dahl'], ['Pippi Langkous', 'Astrid Lindgren'], ['Harry Potter', 'J.K. Rowling'], ['De Hobbit', 'J.R.R. Tolkien'], ['De Leeuw, de Heks en de Kleerkast (Narnia)', 'C.S. Lewis'], ['Jip en Janneke', 'Annie M.G. Schmidt'], ['De Griezelbus', 'Paul van Loon'], ['Dolfje Weerwolfje', 'Paul van Loon'], ['Nijntje', 'Dick Bruna'], ['Kikker', 'Max Velthuijs'], ['In 80 dagen om de wereld', 'Jules Verne'], ['Alice in Wonderland', 'Lewis Carroll'], ['Peter Pan', 'J.M. Barrie'], ['Het Achterhuis', 'Anne Frank'], ['De kleine zeemeermin', 'Hans Christian Andersen'], ['Het lelijke jonge eendje', 'Hans Christian Andersen'], ['Hans en Grietje', 'de gebroeders Grimm'], ['Sneeuwwitje', 'de gebroeders Grimm'], ['Winnie de Poeh', 'A.A. Milne'], ['Pinokkio', 'Carlo Collodi'], ['Gruffalo', 'Julia Donaldson'], ['Dikkie Dik', 'Jet Boeke']].map((r) => [r[0], r[1], r[2] || '', { d: 2 }]), { f: (k) => `Wie schreef "${k}"?`, r: (v) => `Welk boek is van ${v}? (kies er één)`, t: (k, v) => `"${k}" is geschreven door ${v}.`, type: false, typeMax: 0, d: 2 });
  K.facts([['Frozen', 'Elsa en Anna'], ['De Leeuwenkoning', 'Simba'], ['Finding Nemo', 'een clownvis die zoekt naar zijn zoon'], ['Toy Story', 'Woody en Buzz Lightyear'], ['Shrek', 'een groene ogre'], ['Aladdin', 'een jongen met een wonderlamp'], ['Bambi', 'een jong hert'], ['Assepoester', 'een meisje met een glazen muiltje'], ['Pinokkio', 'een houten pop wiens neus groeit'], ['Peter Pan', 'een jongen die nooit groot wil worden'], ['Sneeuwwitje', 'zeven dwergen en een giftige appel'], ['Mulan', 'een meisje dat zich voordoet als soldaat'], ['Coco', 'een jongen in het land van de doden, over muziek'], ['Rapunzel', 'een meisje met heel lang haar in een toren']].map((r) => [r[0], r[1], '', { d: 2 }]), { f: (k) => `Waar gaat "${k}" over?`, r: (v) => `Bij welk verhaal hoort: ${v}?`, t: (k, v) => `"${k}" gaat over ${v}.`, type: false, typeMax: 0, d: 2 });
  K.mcs([
    ['Hoe heet de school voor tovenaars in Harry Potter?', 'Zweinstein', ['Narnia', 'Nooitgedachtland', 'Wonderland'], ''],
    ['Welke sport speelt Harry Potter op bezems?', 'Zwerkbal', ['voetbal', 'tennis', 'hockey'], ''],
    ['Hoe heet de jongen die niet groot wil worden en op Nooitgedachtland woont?', 'Peter Pan', ['Pinokkio', 'Harry Potter', 'Aladdin'], ''],
    ['Welk dier is Nijntje?', 'een konijn', ['een hond', 'een beer', 'een kat'], ''],
    ['Welk dier is Winnie de Poeh?', 'een beer', ['een konijn', 'een varken', 'een uil'], ''],
    ['Welk dier is Dikkie Dik?', 'een kat', ['een hond', 'een muis', 'een vogel'], ''],
    ['Wat valt er uit het sprookje "Hans en Grietje" op?', 'een huisje van peperkoek', ['een vliegende auto', 'een toren van ijs', 'een reus'], ''],
    ['Wat laat Assepoester bij het weglopen achter?', 'een glazen muiltje', ['een hoed', 'een sleutel', 'een ring'], ''],
    ['Wat neemt Roodkapje mee naar haar oma?', 'een mand met eten', ['een zwaard', 'een boek', 'een bal'], ''],
    ['Wat groeit er bij Pinokkio als hij liegt?', 'zijn neus', ['zijn oren', 'zijn haar', 'zijn handen'], ''],
    ['Wat is een sprookje?', 'een verzonnen verhaal met bijvoorbeeld heksen en prinsen', ['een nieuwsbericht', 'een wiskundesom', 'een recept'], ''],
    ['Wat is een stripboek?', 'een boek met plaatjes en tekstballonnen', ['een boek zonder woorden', 'een kookboek', 'een atlas'], ''],
    ['Wat is een bibliotheek?', 'een plek waar je boeken kunt lenen', ['een winkel voor eten', 'een bioscoop', 'een school voor muziek'], ''],
    ['Wat is een schrijver?', 'iemand die boeken schrijft', ['iemand die films kijkt', 'iemand die bakt', 'iemand die zingt'], ''],
    ['Wat is een regisseur?', 'iemand die een film leidt', ['iemand die popcorn verkoopt', 'iemand die zingt', 'iemand die tekent'], ''],
    ['Wat is een animatiefilm?', 'een film met getekende of computer-gemaakte beelden', ['een film met alleen dieren', 'een film zonder geluid', 'een film over sport'], ''],
    ['Welk bedrijf maakte Toy Story?', 'Pixar', ['Lego', 'Nintendo', 'Sony Music'], ''],
    ['Wat is een trilogie?', 'een serie van drie delen', ['een serie van twee delen', 'een serie van tien delen', 'een los verhaal'], ''],
    ['Wat is de hoofdpersoon van een verhaal?', 'het personage waar het verhaal vooral over gaat', ['de schrijver', 'de uitgever', 'de lezer'], ''],
    ['Wat is een uitgeverij?', 'een bedrijf dat boeken drukt en verkoopt', ['een school', 'een muziekwinkel', 'een restaurant'], ''],
  ]);
  K.order('Zet in volgorde: de opbouw van een verhaal', ['begin', 'probleem', 'hoogtepunt', 'einde'], { d: 2 });
  K.tfs([['Roald Dahl schreef Matilda.', true], ['Harry Potter is geschreven door Astrid Lindgren.', false, 'J.K. Rowling schreef Harry Potter.'], ['Sneeuwwitje eet een giftige appel.', true], ['Pippi Langkous is sterk.', true], ['Jip en Janneke zijn van Annie M.G. Schmidt.', true], ['Een bibliotheek is een winkel waar je alles meeneemt zonder te lenen.', false]]);
  return K.out();
}

function sportRegels() {
  const K = kit({ id: 'sport-regels', name: 'Sport en spelregels', emoji: '⚽', group: 'Creatief', desc: 'Voetbal, hockey, zwemmen en meer: aantallen, regels en feiten.' });
  K.facts([['voetbal', '11'], ['hockey', '11'], ['basketbal', '5'], ['volleybal', '6'], ['handbal', '7'], ['korfbal', '8'], ['rugby (15-man)', '15'], ['cricket', '11'], ['honkbal', '9'], ['ijshockey', '6']].map((r) => [r[0], r[1], r[0] === 'korfbal' ? 'Een korfbalteam heeft 8 spelers: 4 in elk vak.' : '', { d: 2 }]), { f: (k) => `Hoeveel spelers van één team staan tegelijk in het veld bij ${k}?`.replace('staan tegelijk in het veld', 'staan tegelijk in het veld'), pool: ['4', '5', '6', '7', '8', '9', '11', '15'], type: false, t: (k, v) => `Bij ${k} spelen ${v} spelers tegelijk per team.`, d: 2 });
  K.mcs([
    ['Hoe lang duurt een voetbalwedstrijd gewoon?', '2 keer 45 minuten', ['2 keer 15 minuten', '1 uur 30 achter elkaar zonder rust', '4 keer 10 minuten'], ''],
    ['Wie mag in het voetbal met zijn handen spelen?', 'de keeper (in zijn strafschopgebied)', ['alle spelers', 'niemand', 'alleen de aanvallers'], ''],
    ['Hoeveel punten is een goal waard in het voetbal?', '1 doelpunt', ['2', '3', '5'], ''],
    ['Welke kaart krijg je als waarschuwing?', 'een gele kaart', ['een rode kaart', 'een groene kaart', 'een blauwe kaart'], ''],
    ['Wat betekent een rode kaart?', 'je moet het veld verlaten', ['je krijgt een strafschop', 'je krijgt een pauze', 'je scoort'], ''],
    ['Hoe heet een schop vanaf de elf-meterstip?', 'een strafschop', ['een corner', 'een inworp', 'een vrije trap'], ''],
    ['Hoe heet het als de bal uit het veld over de zijlijn gaat en je hem inwerpt?', 'inworp', ['corner', 'aftrap', 'penalty'], ''],
    ['Hoeveel ringen heeft de Olympische vlag?', '5', ['4', '6', '7'], ''],
    ['Om de hoeveel jaar zijn de Olympische Zomerspelen?', 'elke 4 jaar', ['elk jaar', 'elke 2 jaar', 'elke 10 jaar'], ''],
    ['Welke zwemslag hoort bij schoolslag, rugslag, vlinderslag en ...?', 'borstcrawl (vrije slag)', ['wijdslag', 'hondjeslag', 'duikslag'], ''],
    ['Hoeveel meter is een baan in een gewoon wedstrijdzwembad?', '50 meter (de lange baan)', ['10 meter', '25 centimeter', '5 meter'], 'In een klein bad is een baan vaak 25 meter.'],
    ['Hoe lang is een marathon?', '42,195 km', ['10 km', '21 km', '100 km'], ''],
    ['Hoeveel velden heeft een schaakbord?', '64', ['32', '81', '100'], ''],
    ['Hoeveel stukken heeft elke schaker bij het begin?', '16', ['8', '12', '32'], ''],
    ['Hoe heet de lange schaatstocht in Friesland?', 'de Elfstedentocht', ['de Dwars door Drenthe', 'de Marathon', 'het Nederlands Kampioenschap'], 'Ze is ongeveer 200 km lang.'],
    ['Welk land won het WK voetbal in 2022?', 'Argentinië', ['Frankrijk', 'Brazilië', 'Duitsland'], ''],
    ['Welk land won het WK voetbal in 2018?', 'Frankrijk', ['Duitsland', 'Brazilië', 'Argentinië'], ''],
    ['Welk land won het WK voetbal in 2014?', 'Duitsland', ['Frankrijk', 'Brazilië', 'Spanje'], ''],
    ['Welk land won het WK voetbal in 2010?', 'Spanje', ['Nederland', 'Duitsland', 'Brazilië'], 'Nederland verloor de finale.'],
    ['Wat is een scheidsrechter?', 'iemand die de regels bewaakt', ['een speler', 'een trainer', 'een supporter'], ''],
    ['Wat betekent "fair play"?', 'eerlijk sporten', ['hard spelen', 'valsspelen', 'winnen is alles'], ''],
    ['Hoe heet het speelveld bij tennis?', 'de baan', ['het kussen', 'de ring', 'het bad'], ''],
    ['Welke puntentelling hoort bij tennis?', '15, 30, 40', ['1, 2, 3', '10, 20, 30', '5, 10, 15'], ''],
    ['Wat is een trainer?', 'iemand die sporters helpt beter te worden', ['iemand die fluit', 'iemand die kaartjes verkoopt', 'iemand die water brengt'], ''],
    ['Welke sport speel je met een shuttle?', 'badminton', ['tennis', 'golf', 'squash'], ''],
    ['Welke sport speel je op ijs met een puck?', 'ijshockey', ['hockey', 'voetbal', 'cricket'], ''],
    ['Wat is de sport waarbij je op een bord over golven glijdt?', 'surfen', ['zwemmen', 'schaatsen', 'skiën'], ''],
  ]);
  K.groups({ 'balsport': ['voetbal', 'hockey', 'basketbal', 'volleybal', 'tennis', 'korfbal'], 'watersport': ['zwemmen', 'waterpolo', 'surfen', 'kanoën', 'zeilen', 'roeien'], 'wintersport': ['skiën', 'schaatsen', 'snowboarden', 'ijshockey', 'curling'] }, { which: (it) => `Bij welk soort sport hoort ${it}?`, tfq: (it, c) => `${cap(it)} is een ${c}.`, multi: (n) => `Welke zijn een ${n}? (kies alle goede)`, reps: 3, d: 1 });
  K.tfs([['Bij voetbal mag de keeper de bal met de handen pakken.', true], ['Een marathon is 10 kilometer.', false], ['Bij volleybal spelen zes spelers per team.', true], ['Schaken wordt gespeeld op 64 velden.', true], ['De Olympische Spelen zijn elke 4 jaar.', true], ['Bij korfbal mag je de bal vasthouden en rennen.', false, 'Bij korfbal mag je niet lopen met de bal.']]);
  return K.out();
}

function verkeer() {
  const K = kit({ id: 'verkeersregels', name: 'Verkeersregels en borden', emoji: '🚦', group: 'Creatief', desc: 'Stoplichten, voorrang, bordenkennis en veilig fietsen en lopen.' });
  K.facts([['een rode achthoek met "STOP"', 'stoppen en voorrang verlenen'], ['een witte driehoek met een rode rand, punt omlaag', 'voorrang verlenen'], ['een gele ruit (op een witte ruit)', 'je hebt voorrang'], ['een rode cirkel met een witte balk', 'verboden in te rijden'], ['een blauwe cirkel met een fiets', 'verplicht fietspad'], ['een rode cirkel met een cijfer (bijvoorbeeld 30)', 'maximumsnelheid'], ['een rode driehoek met een uitroepteken', 'let op: gevaar'], ['een blauw vierkant met een grote P', 'parkeren toegestaan'], ['een blauwe cirkel met een pijl naar rechts', 'verplichte rijrichting rechts'], ['een blauw vierkant met een lopend figuur in een witte driehoek', 'hier is een zebrapad (oversteekplaats)'], ['een rode cirkel met twee auto\'s naast elkaar', 'inhaalverbod']].map((r) => [r[0], r[1], '', { d: 2 }]), { f: (k) => `Wat betekent dit bord: ${k}?`, r: (v) => `Welk bord betekent: ${v}?`, t: (k, v) => `Dit bord (${k}) betekent: ${v}.`, typeMax: 0, type: false, d: 2, matchQ: 'Verbind het bord met zijn betekenis', matches: 3 });
  K.mcs([
    ['Wat betekent een rood stoplicht?', 'stoppen', ['rijden', 'opletten maar doorrijden', 'versnellen'], ''],
    ['Wat betekent een groen stoplicht?', 'je mag rijden of oversteken', ['stoppen', 'wachten', 'omkeren'], ''],
    ['Wat betekent oranje (geel) bij een stoplicht?', 'stoppen als dat nog veilig kan', ['gas geven', 'versnellen', 'omkeren'], ''],
    ['Wie heeft voorrang op een gelijkwaardig kruispunt zonder borden?', 'verkeer van rechts', ['verkeer van links', 'de snelste', 'de grootste auto'], ''],
    ['Wat moet je doen bij haaientanden (witte driehoekjes op de weg)?', 'voorrang verlenen', ['voorrang nemen', 'versnellen', 'omkeren'], ''],
    ['Waar moet je oversteken als er een zebrapad is?', 'op het zebrapad', ['ergens anders', 'tussen de auto\'s', 'zonder te kijken'], ''],
    ['Hoe kijk je voor je oversteekt?', 'links, rechts, links', ['alleen omlaag', 'alleen omhoog', 'niet'], ''],
    ['Wat moet je op je fiets hebben in het donker?', 'licht voor (wit) en achter (rood)', ['een toeter', 'een vlag', 'een bel alleen'], ''],
    ['Wat doe je als je op je fiets linksaf wilt gaan?', 'je arm uitsteken', ['hard remmen', 'bellen', 'omkeren'], ''],
    ['Wat is de maximumsnelheid in de bebouwde kom meestal?', '50 km/u', ['30 km/u', '100 km/u', '130 km/u'], 'Vaak is het in woonwijken 30 km/u.'],
    ['Wat moet je altijd doen in een auto?', 'je gordel omdoen', ['je schoenen uitdoen', 'je hand uit het raam steken', 'staan'], ''],
    ['Wat is een fietshelm?', 'een helm die je hoofd beschermt', ['een hoed voor de mode', 'een bel', 'een slot'], ''],
    ['Wat is een rotonde?', 'een kruispunt in de vorm van een cirkel', ['een brug', 'een tunnel', 'een parkeerplaats'], ''],
    ['Wat is de dode hoek van een vrachtwagen?', 'een plek waar de chauffeur je niet kan zien', ['een gevaarlijke kruising', 'een snelweg', 'een zijspiegel'], ''],
    ['Wat kun je beter niet doen op je fiets?', 'bellen of appen met je telefoon', ['rustig rijden', 'je hand uitsteken', 'op het fietspad blijven'], ''],
    ['Waar loop je als er geen stoep is?', 'links langs de weg, tegen het verkeer in', ['rechts', 'midden op de weg', 'op de fietsstrook'], ''],
    ['Waarom draag je fluorescerende kleding in het donker?', 'zodat je beter gezien wordt', ['omdat het mooi is', 'om warm te blijven', 'omdat het moet voor school'], ''],
    ['Wat doe je op een kruispunt met verkeerslichten bij groen als er een voetganger overgaat?', 'wachten tot hij veilig is overgestoken', ['toeteren', 'doorrijden', 'achterom'], ''],
    ['Wat doe je met je fiets als je ergens aankomt?', 'afsluiten', ['laten staan zonder slot', 'neerkeilen', 'in het water gooien'], ''],
    ['Wat is de rijrichting in Nederland?', 'rechts', ['links', 'in het midden', 'wisselend'], ''],
  ]);
  K.groups({ 'rood licht': ['stoppen', 'wachten'], 'groen licht': ['oversteken als het veilig is', 'rijden'] }, { which: (it) => `Wat hoort bij een stoplicht: ${it}?`, names: ['rood licht', 'groen licht'], tfq: (it, c) => `Bij ${c} hoort: ${it}.`, d: 1 });
  K.tfs([['Bij rood licht mag je doorfietsen.', false], ['Een fietshelm kan je hoofd beschermen.', true], ['Je steekt je arm uit als je afslaat.', true], ['Je mag zonder licht fietsen in het donker.', false], ['Voor het oversteken kijk je links en rechts.', true], ['Op een zebrapad heeft de voetganger voorrang als hij oversteekt.', true], ['Bij een rotonde is er geen voorrangsregel.', false], ['Een gordel in de auto is niet nodig.', false]]);
  return K.out();
}

export const builders = [computers, veilig, programmeren, logica, instrumenten, kleuren, kunst, filmsBoeken, sportRegels, verkeer];
