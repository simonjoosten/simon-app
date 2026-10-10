const fmt = n => { n = Math.floor(n || 0); if (n < 1000) return String(n); const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi']; let i = -1, v = n; while (v >= 1000 && i < u.length - 1) { v /= 1000; i++; } return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : v.toFixed(0)).replace('.', ',') + u[i]; };
const $ = (t, css, txt, p) => { const e = document.createElement(t); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; if (p) p.appendChild(e); return e; };
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmtT = s => { s = Math.max(0, Math.ceil(s)); return s >= 3600 ? Math.floor(s / 3600) + 'u ' + Math.floor(s % 3600 / 60) + 'm' : s >= 60 ? Math.floor(s / 60) + 'm ' + (s % 60) + 's' : s + 's'; };
function btn(p, label, fn, dis, css) { const b = $('button', 'min-height:44px;border:0;border-radius:12px;padding:8px 12px;font-weight:700;font-size:14px;color:#fff;background:linear-gradient(#4f8cff,#2f5fd0);cursor:pointer;margin:3px 0;' + (dis ? 'opacity:.4;' : '') + (css || ''), label, p); b.addEventListener('click', () => { if (!dis) fn(); }); return b; }
function card(p, css) { return $('div', 'background:rgba(255,255,255,.1);border-radius:14px;padding:10px;margin:8px 0;' + (css || ''), null, p); }
function bar(p, pct, color) { const o = $('div', 'height:10px;background:rgba(0,0,0,.35);border-radius:6px;overflow:hidden;margin:4px 0', null, p); $('div', 'height:100%;width:' + (clamp(pct, 0, 1) * 100) + '%;background:' + (color || '#4ade80'), null, o); return o; }
function row(p, css) { return $('div', 'display:flex;align-items:center;gap:8px;' + (css || ''), null, p); }
function app(host, api, o) {
  host.style.background = o.bg; host.style.color = '#fff'; host.style.fontFamily = 'system-ui,-apple-system,sans-serif'; host.style.overflowY = 'auto';
  const root = $('div', 'max-width:430px;margin:0 auto;padding:10px 10px 30px;box-sizing:border-box', null, host);
  const head = $('div', '', null, root);
  const tb = $('div', 'display:flex;gap:4px;margin:8px 0;position:sticky;top:0;z-index:5;padding:4px 0;background:' + o.bg, null, root);
  const body = $('div', '', null, root);
  let tab = o.tabs[0][0], down = false, dead = false, last = Date.now();
  const dn = () => { down = true; }, up = () => { down = false; };
  host.addEventListener('pointerdown', dn); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  const A = {
    tab: () => tab,
    go(t) { tab = t; A.render(); },
    render() {
      if (dead) return;
      head.replaceChildren(); o.head(head);
      tb.replaceChildren();
      for (const [id, l] of o.tabs) { const b = $('button', 'flex:1;min-height:44px;border:0;border-radius:10px;font-weight:700;font-size:12px;padding:2px;cursor:pointer;color:#fff;background:' + (id === tab ? o.acc : 'rgba(255,255,255,.12)'), l, tb); b.addEventListener('click', () => A.go(id)); }
      body.replaceChildren(); o.render(tab, body);
    },
    commit() { A.render(); api.save(o.state()); },
  };
  A.render();
  const iv = setInterval(() => { const n = Date.now(), dt = Math.min((n - last) / 1000, 60); last = n; if (o.tick) o.tick(dt); if (!down) A.render(); }, 1000);
  const sv = setInterval(() => api.save(o.state()), 10000);
  A.destroy = () => { dead = true; clearInterval(iv); clearInterval(sv); host.removeEventListener('pointerdown', dn); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); try { api.save(o.state()); } catch (e) {} };
  return A;
}
// [categorie, moeilijkheid(1-3), vraag, juist antwoord, fout, fout, fout]
const Q = [
  ['Aardrijkskunde', 1, 'Wat is de hoofdstad van Frankrijk?', 'Parijs', 'Lyon', 'Marseille', 'Nice'],
  ['Aardrijkskunde', 1, 'Wat is de hoofdstad van Spanje?', 'Madrid', 'Barcelona', 'Sevilla', 'Valencia'],
  ['Aardrijkskunde', 3, 'Welke rivier is de langste van Europa?', 'Wolga', 'Donau', 'Rijn', 'Seine'],
  ['Aardrijkskunde', 1, 'Wat is de hoogste berg ter wereld?', 'Mount Everest', 'K2', 'Mont Blanc', 'Kilimanjaro'],
  ['Aardrijkskunde', 1, 'Welke zee grenst aan Nederland?', 'De Noordzee', 'De Rode Zee', 'De Zwarte Zee', 'De Dode Zee'],
  ['Aardrijkskunde', 1, 'Wat is de grootste oceaan?', 'De Grote Oceaan', 'De Atlantische Oceaan', 'De Indische Oceaan', 'De Noordelijke IJszee'],
  ['Aardrijkskunde', 1, 'Wat is de hoofdstad van Duitsland?', 'Berlijn', 'München', 'Hamburg', 'Keulen'],
  ['Aardrijkskunde', 1, 'Welk land heeft de vorm van een laars?', 'Italië', 'Spanje', 'Griekenland', 'Portugal'],
  ['Aardrijkskunde', 2, 'Wat is de hoofdstad van Australië?', 'Canberra', 'Sydney', 'Melbourne', 'Perth'],
  ['Aardrijkskunde', 1, 'Welk land is het grootst qua oppervlakte?', 'Rusland', 'Canada', 'China', 'Verenigde Staten'],
  ['Aardrijkskunde', 2, 'Wat is het hoogste punt van Nederland (vasteland)?', 'Vaalserberg', 'Amersfoortse Berg', 'Sint-Pietersberg', 'Posbank'],
  ['Aardrijkskunde', 2, 'Welke stad is de hoofdstad van de provincie Overijssel?', 'Zwolle', 'Enschede', 'Deventer', 'Almelo'],
  ['Aardrijkskunde', 1, 'Wat is de hoofdstad van Noorwegen?', 'Oslo', 'Bergen', 'Stockholm', 'Helsinki'],
  ['Aardrijkskunde', 1, 'Welke beroemde rivier stroomt door Caïro?', 'De Nijl', 'De Amazone', 'De Tigris', 'De Rijn'],
  ['Aardrijkskunde', 1, 'Wat is de hoofdstad van Japan?', 'Tokio', 'Kyoto', 'Osaka', 'Seoel'],
  ['Aardrijkskunde', 2, 'Wat is het kleinste land ter wereld?', 'Vaticaanstad', 'Monaco', 'San Marino', 'Liechtenstein'],
  ['Aardrijkskunde', 1, 'Op welk continent ligt Brazilië?', 'Zuid-Amerika', 'Afrika', 'Azië', 'Noord-Amerika'],
  ['Aardrijkskunde', 1, 'Wat is de hoofdstad van Griekenland?', 'Athene', 'Thessaloniki', 'Rome', 'Sparta'],
  ['Aardrijkskunde', 1, 'Van welke provincie is Maastricht de hoofdstad?', 'Limburg', 'Noord-Brabant', 'Zeeland', 'Gelderland'],
  ['Aardrijkskunde', 2, 'Wat is de hoofdstad van Canada?', 'Ottawa', 'Toronto', 'Vancouver', 'Montréal'],
  ['Aardrijkskunde', 1, 'Hoeveel provincies heeft Nederland?', '12', '10', '14', '11'],
  ['Aardrijkskunde', 1, 'Welke woestijn ligt in Noord-Afrika?', 'De Sahara', 'De Gobi', 'De Kalahari', 'De Atacama'],
  ['Geschiedenis', 2, 'In welk jaar begon de Tweede Wereldoorlog?', '1939', '1914', '1945', '1933'],
  ['Geschiedenis', 1, 'Wie schilderde De Nachtwacht?', 'Rembrandt', 'Vermeer', 'Van Gogh', 'Mondriaan'],
  ['Geschiedenis', 1, 'Wie was de eerste mens op de maan?', 'Neil Armstrong', 'Buzz Aldrin', 'Joeri Gagarin', 'John Glenn'],
  ['Geschiedenis', 1, 'Welke Italiaanse stad werd begraven onder as van de Vesuvius?', 'Pompeji', 'Rome', 'Napels', 'Florence'],
  ['Geschiedenis', 1, 'Wie ontdekte in 1492 Amerika voor de Europeanen?', 'Christoffel Columbus', 'Marco Polo', 'Vasco da Gama', 'James Cook'],
  ['Geschiedenis', 2, 'In welk jaar viel de Berlijnse Muur?', '1989', '1961', '1975', '1991'],
  ['Geschiedenis', 2, 'Wie was de eerste koning van het Koninkrijk der Nederlanden?', 'Willem I', 'Willem III', 'Willem van Oranje', 'Lodewijk II'],
  ['Geschiedenis', 1, 'Welk oud volk bouwde de piramiden van Gizeh?', 'De Egyptenaren', 'De Romeinen', 'De Grieken', 'De Azteken'],
  ['Geschiedenis', 1, 'In welke stad schreef Anne Frank haar dagboek?', 'Amsterdam', 'Rotterdam', 'Den Haag', 'Utrecht'],
  ['Geschiedenis', 2, 'Wie was de eerste vrouwelijke premier van het Verenigd Koninkrijk?', 'Margaret Thatcher', 'Theresa May', 'Koningin Victoria', 'Liz Truss'],
  ['Geschiedenis', 1, 'Tegen welk land voerden de Nederlanders de Tachtigjarige Oorlog?', 'Spanje', 'Frankrijk', 'Engeland', 'Duitsland'],
  ['Geschiedenis', 3, 'Welke Romeinse keizer liet volgens de legende Rome in brand steken?', 'Nero', 'Augustus', 'Trajanus', 'Caligula'],
  ['Geschiedenis', 1, 'In welk jaar werd Nederland bevrijd van de Duitse bezetting?', '1945', '1944', '1940', '1950'],
  ['Geschiedenis', 2, 'In welk jaar zonk de Titanic?', '1912', '1905', '1920', '1898'],
  ['Geschiedenis', 2, 'Wie was Napoleon Bonaparte?', 'Een Franse keizer', 'Een Engelse koning', 'Een Russische tsaar', 'Een Duitse kanselier'],
  ['Geschiedenis', 3, 'Wiens expeditie voer als eerste rond de wereld?', 'Magellaan', 'Columbus', 'Cook', 'Tasman'],
  ['Geschiedenis', 2, 'Wie wordt gezien als uitvinder van de gloeilamp?', 'Thomas Edison', 'Nikola Tesla', 'Alexander Graham Bell', 'Guglielmo Marconi'],
  ['Natuur', 1, 'Wat is het grootste landdier?', 'De Afrikaanse olifant', 'De giraf', 'De neushoorn', 'Het nijlpaard'],
  ['Natuur', 1, 'Hoeveel poten heeft een spin?', '8', '6', '10', '4'],
  ['Natuur', 1, 'Welk dier is het snelst op land?', 'De jachtluipaard', 'De leeuw', 'Het paard', 'De struisvogel'],
  ['Natuur', 1, 'Welk dier hangt tijdens het slapen ondersteboven?', 'De vleermuis', 'De uil', 'De eekhoorn', 'De haas'],
  ['Natuur', 1, 'Hoe heet een jonge kikker met een staart?', 'Kikkervisje', 'Larve', 'Rups', 'Veulen'],
  ['Natuur', 1, 'Welk dier maakt honing?', 'De bij', 'De wesp', 'De mier', 'De vlieg'],
  ['Natuur', 1, 'Welke vogel kan niet vliegen?', 'De struisvogel', 'De ooievaar', 'De zwaluw', 'De duif'],
  ['Natuur', 3, 'Welk zoogdier legt eieren?', 'Het vogelbekdier', 'De egel', 'De vleermuis', 'De dolfijn'],
  ['Natuur', 2, 'Hoe heet een groep wolven?', 'Roedel', 'Zwerm', 'Kudde', 'School'],
  ['Natuur', 2, 'Wat is het grootste dier ter wereld?', 'De blauwe vinvis', 'De olifant', 'De potvis', 'De walvishaai'],
  ['Natuur', 2, 'Welk dier leeft niet op de Noordpool?', 'De pinguïn', 'De ijsbeer', 'De walrus', 'De poolvos'],
  ['Natuur', 1, 'Hoeveel poten heeft een insect?', '6', '8', '4', '10'],
  ['Natuur', 2, 'Hoe heet het proces waarmee planten zuurstof maken?', 'Fotosynthese', 'Verbranding', 'Spijsvertering', 'Verdamping'],
  ['Natuur', 1, 'Welk dier kan van kleur veranderen om zich te verbergen?', 'De kameleon', 'De krokodil', 'De slang', 'De schildpad'],
  ['Natuur', 2, 'Hoe heet een vrouwelijk schaap?', 'Ooi', 'Merrie', 'Zeug', 'Geit'],
  ['Natuur', 1, 'Aan welke boom groeien eikels?', 'De eik', 'De beuk', 'De den', 'De berk'],
  ['Natuur', 2, 'Hoeveel magen heeft een koe?', 'Vier', 'Een', 'Twee', 'Drie'],
  ['Natuur', 1, 'Welk dier staat bekend om zijn heel lange nek?', 'De giraf', 'De lama', 'De olifant', 'De zebra'],
  ['Wetenschap', 1, 'Hoeveel planeten heeft ons zonnestelsel?', '8', '9', '7', '10'],
  ['Wetenschap', 1, 'Hoe heet de natuurlijke satelliet van de aarde?', 'De Maan', 'Mars', 'Venus', 'Titan'],
  ['Wetenschap', 1, 'Welke planeet heet de rode planeet?', 'Mars', 'Venus', 'Jupiter', 'Mercurius'],
  ['Wetenschap', 1, 'Welk gas hebben mensen nodig om te ademen?', 'Zuurstof', 'Stikstof', 'Koolstofdioxide', 'Waterstof'],
  ['Wetenschap', 1, 'Wat is de chemische formule van water?', 'H2O', 'CO2', 'O2', 'NaCl'],
  ['Wetenschap', 3, 'Hoeveel botten heeft een volwassen mens ongeveer?', '206', '106', '300', '150'],
  ['Wetenschap', 1, 'Welk orgaan pompt het bloed rond?', 'Het hart', 'De long', 'De lever', 'De nier'],
  ['Wetenschap', 1, 'Bij hoeveel graden Celsius kookt water (op zeeniveau)?', '100', '90', '120', '80'],
  ['Wetenschap', 1, 'Wie bedacht de relativiteitstheorie?', 'Albert Einstein', 'Isaac Newton', 'Galileo Galilei', 'Marie Curie'],
  ['Wetenschap', 1, 'Welke planeet staat bekend om zijn ringen?', 'Saturnus', 'Jupiter', 'Mars', 'Mercurius'],
  ['Wetenschap', 1, 'Wat meet je met een thermometer?', 'Temperatuur', 'Druk', 'Gewicht', 'Snelheid'],
  ['Wetenschap', 2, 'Welk metaal is vloeibaar bij kamertemperatuur?', 'Kwik', 'IJzer', 'Koper', 'Zink'],
  ['Wetenschap', 1, 'Welke ster staat het dichtst bij de aarde?', 'De zon', 'Sirius', 'De Poolster', 'Betelgeuze'],
  ['Wetenschap', 3, 'Hoeveel tanden heeft een volwassene (met verstandskiezen)?', '32', '28', '30', '36'],
  ['Wetenschap', 2, 'Wat is de hardste natuurlijke stof?', 'Diamant', 'Goud', 'IJzer', 'Kwarts'],
  ['Wetenschap', 2, 'Wat doen rode bloedcellen?', 'Zuurstof vervoeren', 'Ziektes bestrijden', 'Voedsel verteren', 'Botten opbouwen'],
  ['Wetenschap', 1, 'Welke kleur krijg je door blauw en geel te mengen?', 'Groen', 'Oranje', 'Paars', 'Bruin'],
  ['Wetenschap', 2, 'Hoeveel seconden zitten er in een uur?', '3600', '360', '6000', '1440'],
  ['Sport', 1, 'Hoeveel spelers heeft een voetbalteam tegelijk op het veld?', '11', '9', '10', '12'],
  ['Sport', 2, 'Welk land won het WK voetbal in 2010?', 'Spanje', 'Nederland', 'Duitsland', 'Brazilië'],
  ['Sport', 1, 'Welke sport wordt gespeeld op Wimbledon?', 'Tennis', 'Golf', 'Cricket', 'Badminton'],
  ['Sport', 1, 'Hoeveel ringen heeft het Olympische logo?', '5', '4', '6', '7'],
  ['Sport', 1, 'Hoeveel steden loop je langs bij de Friese Elfstedentocht?', '11', '12', '10', '9'],
  ['Sport', 2, 'Welke voetballer droeg nummer 14 en was een icoon van Ajax en Oranje?', 'Johan Cruijff', 'Marco van Basten', 'Ruud Gullit', 'Dennis Bergkamp'],
  ['Sport', 2, 'Hoe lang is een marathon ongeveer?', '42 kilometer', '21 kilometer', '50 kilometer', '36 kilometer'],
  ['Sport', 1, 'In welke sport is Max Verstappen wereldkampioen?', 'Formule 1', 'Tennis', 'Schaatsen', 'Wielrennen'],
  ['Sport', 2, 'Hoeveel spelers van één team staan tegelijk op het veld bij basketbal?', '5', '6', '7', '11'],
  ['Sport', 2, 'In welke sport gebruik je een shuttle?', 'Badminton', 'Tennis', 'Squash', 'Tafeltennis'],
  ['Sport', 2, 'Welk land organiseerde de Olympische Spelen van 2008?', 'China', 'Griekenland', 'Brazilië', 'Australië'],
  ['Sport', 1, 'Welke kleur heeft de trui van de leider in de Tour de France?', 'Geel', 'Roze', 'Groen', 'Rood'],
  ['Sport', 1, 'Waarmee wordt ijshockey gespeeld?', 'Een puck', 'Een bal', 'Een shuttle', 'Een frisbee'],
  ['Sport', 3, 'Welk land won de eerste wereldbeker voetbal in 1930?', 'Uruguay', 'Brazilië', 'Italië', 'Argentinië'],
  ['Cultuur', 1, 'Wie schilderde de Zonnebloemen?', 'Vincent van Gogh', 'Claude Monet', 'Rembrandt', 'Pablo Picasso'],
  ['Cultuur', 1, 'Hoeveel snaren heeft een standaard gitaar?', '6', '4', '5', '8'],
  ['Cultuur', 1, 'Wie schreef de Harry Potter-boeken?', 'J.K. Rowling', 'Roald Dahl', 'J.R.R. Tolkien', 'Suzanne Collins'],
  ['Cultuur', 3, 'Wie schreef het boek Max Havelaar?', 'Multatuli', 'Harry Mulisch', 'Gerard Reve', 'Ferdinand Bordewijk'],
  ['Cultuur', 1, 'Welk instrument heeft zwarte en witte toetsen?', 'De piano', 'De viool', 'De trompet', 'De fluit'],
  ['Cultuur', 1, 'Wie bedacht Mickey Mouse?', 'Walt Disney', 'Steven Spielberg', 'George Lucas', 'Tim Burton'],
  ['Cultuur', 1, 'In welke stad staat de Eiffeltoren?', 'Parijs', 'Londen', 'Rome', 'Brussel'],
  ['Cultuur', 1, 'Welk beroemd schilderij laat een mysterieuze glimlach zien?', 'Mona Lisa', 'De Schreeuw', 'De Nachtwacht', 'Meisje met de parel'],
  ['Cultuur', 2, 'Welke Nederlandse band zong het nummer Radar Love?', 'Golden Earring', 'Normaal', 'Doe Maar', 'Kane'],
  ['Cultuur', 1, 'Hoe heet het Nederlandse volkslied?', 'Het Wilhelmus', 'De Brabançonne', 'Wien Neêrlands Bloed', 'Hand in Hand'],
  ['Cultuur', 3, 'Wie schreef De Kleine Prins?', 'Antoine de Saint-Exupéry', 'Astrid Lindgren', 'Hans Christian Andersen', 'Jules Verne'],
  ['Cultuur', 2, 'Wie bedacht Suske en Wiske?', 'Willy Vandersteen', 'Hergé', 'Marten Toonder', 'Dick Bruna'],
  ['Cultuur', 1, 'In welke Pixar-film zoekt een clownvis zijn zoon?', 'Finding Nemo', 'Toy Story', 'Cars', 'Ratatouille'],
  ['Cultuur', 1, 'Welk konijntje is gemaakt door Dick Bruna?', 'Nijntje', 'Pluisje', 'Bugs Bunny', 'Roodkapje'],
  ['Cultuur', 3, 'Wie componeerde De Vier Jaargetijden?', 'Antonio Vivaldi', 'Mozart', 'Johann Sebastian Bach', 'Beethoven'],
  ['Cultuur', 2, 'Wie is de beste vriend van Ernie in Sesamstraat?', 'Bert', 'Pino', 'Elmo', 'Kermit'],
  ['Eten & Drinken', 1, 'Uit welk land komt pizza oorspronkelijk?', 'Italië', 'Spanje', 'Frankrijk', 'Griekenland'],
  ['Eten & Drinken', 1, 'Wat is het hoofdingrediënt van guacamole?', 'Avocado', 'Tomaat', 'Komkommer', 'Paprika'],
  ['Eten & Drinken', 1, 'Welk fruit is geel en kromgebogen?', 'Banaan', 'Citroen', 'Ananas', 'Peer'],
  ['Eten & Drinken', 1, 'Uit welk land komt sushi?', 'Japan', 'China', 'Korea', 'Thailand'],
  ['Eten & Drinken', 2, 'Hoe heet de Franse kaas met een witte schimmelkorst?', 'Brie', 'Gouda', 'Edammer', 'Emmentaler'],
  ['Eten & Drinken', 1, 'Van welke vrucht wordt wijn gemaakt?', 'Druiven', 'Appels', 'Aardbeien', 'Bananen'],
  ['Eten & Drinken', 1, 'Van het snijden van welke groente moet je huilen?', 'Ui', 'Wortel', 'Spinazie', 'Komkommer'],
  ['Eten & Drinken', 3, 'In welke stad werd de stroopwafel volgens de overlevering bedacht?', 'Gouda', 'Rotterdam', 'Zwolle', 'Groningen'],
  ['Eten & Drinken', 2, 'Welke kaas heeft grote gaten?', 'Emmentaler', 'Gouda', 'Cheddar', 'Brie'],
  ['Eten & Drinken', 1, 'Waar is chocolade van gemaakt?', 'Cacaobonen', 'Koffiebonen', 'Sojabonen', 'Pinda\'s'],
  ['Algemeen', 1, 'Hoeveel dagen heeft een schrikkeljaar?', '366', '365', '364', '367'],
  ['Algemeen', 1, 'Wat is 12 x 12?', '144', '124', '148', '122'],
  ['Algemeen', 1, 'Wat is de wortel van 81?', '9', '8', '7', '11'],
  ['Algemeen', 1, 'Wat is het meervoud van "het kind"?', 'Kinderen', 'Kindere', 'Kinden', 'Kindens'],
  ['Algemeen', 2, 'Welke taal spreekt men in Brazilië?', 'Portugees', 'Spaans', 'Braziliaans', 'Engels'],
  ['Algemeen', 1, 'Hoeveel letters heeft het Nederlandse alfabet?', '26', '24', '28', '25'],
  ['Algemeen', 1, 'Welke stad staat bekend om zijn scheve toren?', 'Pisa', 'Florence', 'Venetië', 'Napels'],
  ['Algemeen', 1, 'Hoeveel zijden heeft een zeshoek?', '6', '5', '8', '7'],
  ['Algemeen', 1, 'Op welke datum vieren we Koningsdag?', '27 april', '30 april', '5 mei', '1 mei'],
  ['Algemeen', 1, 'Welk feest vieren we in Nederland op 5 december?', 'Sinterklaas', 'Kerst', 'Pasen', 'Pinksteren'],
  ['Algemeen', 1, 'Welke Nederlandse stad heeft de grootste haven van Europa?', 'Rotterdam', 'Utrecht', 'Arnhem', 'Zwolle'],
  ['Algemeen', 1, 'Wat zijn de kleuren van de Nederlandse vlag van boven naar beneden?', 'Rood, wit, blauw', 'Blauw, wit, rood', 'Wit, blauw, rood', 'Rood, blauw, wit'],
  ['Algemeen', 1, 'Waar staat WWW voor?', 'World Wide Web', 'World Wide Wait', 'Web With Wires', 'Wide World Web'],
  ['Algemeen', 1, 'Welk bedrijf maakt de iPhone?', 'Apple', 'Samsung', 'Nokia', 'Sony'],
  ['Algemeen', 2, 'Welk bedrijf begon als online boekwinkel?', 'Amazon', 'Google', 'eBay', 'Netflix'],
  ['Algemeen', 2, 'Hoeveel dagen heeft een gewoon jaar?', '365', '360', '364', '366'],
  ['Algemeen', 2, 'Wat is 15% van 200?', '30', '15', '20', '25'],
  ['Algemeen', 3, 'Wat is de som van de hoeken in een driehoek?', '180 graden', '90 graden', '360 graden', '270 graden'],
  ['Algemeen', 2, 'Hoeveel gram is een kilo?', '1000', '100', '10000', '500'],
  ['Algemeen', 2, 'Wat is de naam van het Nederlandse parlementsgebouw-gebied in Den Haag?', 'Het Binnenhof', 'Het Plein', 'De Dam', 'Het Malieveld'],
];
const CATS = ['Aardrijkskunde', 'Geschiedenis', 'Natuur', 'Wetenschap', 'Sport', 'Cultuur', 'Eten & Drinken', 'Algemeen'];
const CE = { Aardrijkskunde: '🌍', Geschiedenis: '🏺', Natuur: '🦁', Wetenschap: '🔬', Sport: '⚽', Cultuur: '🎭', 'Eten & Drinken': '🍕', Algemeen: '💡' };
const RANKS = [[0, 'Beginneling', '🐣'], [100, 'Puzzelaar', '🧩'], [300, 'Kenner', '📚'], [700, 'Slimmerik', '🧠'], [1500, 'Expert', '🎓'], [3000, 'Professor', '👨‍🏫'], [6000, 'Quizmaster', '🏅'], [12000, 'Quizkampioen', '🏆']];
const RIVALS = [['Sanne', 320], ['Daan', 900], ['Emma', 1800], ['Lucas', 2600], ['Mila', 4200], ['Finn', 7000], ['Professor Plons', 11000], ['Quiz-Koning Kees', 18000]];
const JOK = { fifty: ['✂️', '50/50', 15], time: ['⏱️', '+10 sec', 10], skip: ['⏭️', 'Overslaan', 20], crowd: ['👥', 'Publiek', 15] };
const dayKey = (t) => { const d = new Date(t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
export default {
  id: 'quizkampioen', name: 'Quizkampioen', emoji: '🧠', desc: 'Nederlandse algemene-kennisvragen, levels, jokers en een ranglijst.',
  async create(host, api) {
    const d = await api.load();
    const S = Object.assign({ coins: 40, pts: 0, level: 1, jok: { fifty: 2, time: 1, skip: 1, crowd: 1 }, stat: { a: 0, c: 0 }, cat: {}, daily: { last: '', streak: 0 }, seen: {}, cur: null, res: null, bestStreak: 0, last: Date.now() }, d || {});
    const rankOf = p => { let r = 0; RANKS.forEach((x, i) => { if (p >= x[0]) r = i; }); return r; };
    const pickQs = (n, pred, dmix) => {
      const idx = Q.map((q, i) => i).filter(i => pred(Q[i]));
      const sorted = shuffle(idx).sort((a, b) => (S.seen[a] || 0) - (S.seen[b] || 0));
      const out = []; for (const i of sorted) { if (out.length >= n) break; out.push(i); }
      return shuffle(out);
    };
    const buildQ = qi => { const r = Q[qi]; const opts = shuffle([0, 1, 2, 3]); return { qi, o: opts, ci: opts.indexOf(0) }; };
    const start = (mode, cat) => {
      let qs;
      if (mode === 'level') {
        const L = S.level, ds = L <= 3 ? [1] : L <= 8 ? [1, 2] : L <= 14 ? [2, 3] : [2, 3];
        qs = pickQs(8, q => ds.includes(q[1]) || (L > 3 && q[1] === 2), 0);
        if (qs.length < 8) qs = qs.concat(pickQs(8 - qs.length, q => true, 0).filter(x => !qs.includes(x)));
      } else qs = pickQs(6, q => q[0] === cat, 0);
      S.cur = { mode, cat: cat || '', n: qs.length, i: 0, ok: 0, ans: null, dl: Date.now() + 20000, qs: qs.map(buildQ), elim: [], hint: null, gained: 0 };
      S.res = null;
    };
    const timeUp = () => { const c = S.cur; if (c && c.ans === null && Date.now() > c.dl) { score(-1); } };
    const score = k => {
      const c = S.cur; if (!c || c.ans !== null) return; const q = c.qs[c.i], Qd = Q[q.qi];
      c.ans = k; S.seen[q.qi] = (S.seen[q.qi] || 0) + 1; S.stat.a++;
      const cs = S.cat[Qd[0]] || (S.cat[Qd[0]] = { a: 0, c: 0 }); cs.a++;
      if (k === q.ci) { const left = Math.max(0, (c.dl - Date.now()) / 1000), p = Math.round(10 * Qd[1] + left / 2); S.pts += p; c.gained += p; c.ok++; S.stat.c++; cs.c++; c.lastP = p; S.coins += 2 * Qd[1]; }
      else c.lastP = 0;
    };
    const next = () => {
      const c = S.cur; if (!c) return; c.i++;
      if (c.i >= c.n) {
        let text;
        if (c.mode === 'level') {
          if (c.ok >= 5) { const reward = 20 + S.level * 5; S.coins += reward; text = '🎉 Level ' + S.level + ' gehaald met ' + c.ok + '/' + c.n + '! +' + reward + ' munten.'; S.level++; }
          else text = '😅 ' + c.ok + '/' + c.n + ' goed. Je hebt er minstens 5 nodig. Probeer level ' + S.level + ' opnieuw!';
        } else { const bonus = c.ok * 3; S.coins += bonus; text = CE[c.cat] + ' ' + c.cat + ': ' + c.ok + '/' + c.n + ' goed. +' + bonus + ' munten bonus.'; }
        S.res = { text, pts: c.gained }; S.cur = null; return;
      }
      c.ans = null; c.dl = Date.now() + 20000; c.elim = []; c.hint = null;
    };
    const A = app(host, api, {
      bg: 'linear-gradient(#0b1f5c,#4a1d8f)', acc: '#f59e0b', tabs: [['play', '🎯 Spelen'], ['rank', '🏆 Ranglijst'], ['jok', '🃏 Jokers'], ['stat', '📊 Stats']],
      state: () => { S.last = Date.now(); return S; },
      tick: () => { timeUp(); S.last = Date.now(); },
      head: el => { const r = rankOf(S.pts); $('div', 'font-size:20px;font-weight:800', '🧠 Quizkampioen', el); const rr = row(el, 'justify-content:space-between;margin-top:4px'); $('span', 'font-weight:700', RANKS[r][2] + ' ' + RANKS[r][1], rr); $('span', 'color:#ffe08a;font-weight:700', '🪙 ' + fmt(S.coins), rr); $('span', 'font-size:12px', '⭐ ' + fmt(S.pts) + ' punten', rr); },
      render: (tab, b) => {
        if (tab === 'play') {
          const c = S.cur;
          if (c) {
            timeUp();
            const q = c.qs[c.i], Qd = Q[q.qi], left = Math.max(0, (c.dl - Date.now()) / 1000);
            const h = card(b);
            $('div', 'font-size:12px;opacity:.85', (c.mode === 'level' ? 'Level ' + S.level : CE[c.cat] + ' ' + c.cat) + ' · vraag ' + (c.i + 1) + '/' + c.n + ' · goed: ' + c.ok + ' · ' + CE[Qd[0]] + ' ' + Qd[0] + ' · ' + '★'.repeat(Qd[1]), h);
            if (c.ans === null) bar(h, left / 30, left < 6 ? '#ef4444' : '#22c55e');
            $('div', 'font-size:17px;font-weight:700;margin:8px 0', Qd[2], h);
            q.o.forEach((oi, k) => {
              const txt = Qd[3 + oi]; const answered = c.ans !== null; let bg = '#3b4a8f';
              if (answered) { if (k === q.ci) bg = '#16a34a'; else if (k === c.ans) bg = '#dc2626'; else bg = '#2a3158'; }
              const el = btn(h, txt + (c.hint && c.hint[k] ? '  (' + c.hint[k] + '%)' : ''), () => { score(k); A.commit(); }, answered || c.elim.includes(k), 'display:block;width:100%;text-align:left;background:' + bg + ';' + (c.elim.includes(k) ? 'text-decoration:line-through;' : ''));
            });
            if (c.ans !== null) {
              $('div', 'margin:6px 0;font-weight:700;color:' + (c.ans === q.ci ? '#4ade80' : '#f87171'), c.ans === q.ci ? '✅ Goed! +' + c.lastP + ' punten' : c.ans === -1 ? '⏰ Tijd om! Het antwoord was: ' + Qd[3] : '❌ Fout! Het antwoord was: ' + Qd[3], h);
              btn(h, c.i + 1 >= c.n ? 'Afronden' : 'Volgende vraag ➜', () => { next(); A.commit(); }, false, 'width:100%;background:linear-gradient(#f59e0b,#d97706)');
            } else {
              const jr = row(h, 'flex-wrap:wrap;margin-top:4px');
              Object.keys(JOK).forEach(j => btn(jr, JOK[j][0] + ' ' + S.jok[j], () => {
                S.jok[j]--;
                if (j === 'fifty') { const wrong = [0, 1, 2, 3].filter(k => k !== q.ci && !c.elim.includes(k)); shuffle(wrong).slice(0, 2).forEach(k => c.elim.push(k)); }
                if (j === 'time') c.dl += 10000;
                if (j === 'skip') { c.ok++; c.ans = q.ci; c.lastP = 0; S.seen[q.qi] = (S.seen[q.qi] || 0) + 1; }
                if (j === 'crowd') { const good = Math.random() < .85; const base = [0, 1, 2, 3].map(() => ri(5, 20)); const top = good ? q.ci : pick([0, 1, 2, 3].filter(k => k !== q.ci)); let rest = 100; const h2 = [0, 0, 0, 0]; h2[top] = ri(45, 75); rest -= h2[top]; const o = [0, 1, 2, 3].filter(k => k !== top); o.forEach((k, ix) => { h2[k] = ix === 2 ? rest : Math.min(rest, ri(0, Math.floor(rest / 2))); rest -= h2[k]; }); c.hint = h2; }
                A.commit();
              }, S.jok[j] <= 0, 'flex:1;min-width:70px;font-size:13px;background:#6d28d9'));
            }
          } else {
            if (S.res) { const r = card(b, 'background:rgba(34,197,94,.25)'); $('div', 'font-weight:800', S.res.text, r); $('div', 'font-size:13px', '+' + S.res.pts + ' punten', r); }
            const today = dayKey(Date.now()), canClaim = S.daily.last !== today;
            const dc = card(b, 'background:rgba(245,158,11,.25)'); $('div', 'font-weight:800', '🎁 Dagelijkse beloning', dc); $('div', 'font-size:12px;opacity:.9', 'Serie: ' + S.daily.streak + ' dag(en). Elke dag een grotere beloning!', dc);
            btn(dc, canClaim ? 'Pak je beloning' : 'Kom morgen terug ✅', () => {
              const yest = dayKey(Date.now() - 86400000); S.daily.streak = S.daily.last === yest ? S.daily.streak + 1 : 1; S.daily.last = today;
              const coins = 30 + Math.min(S.daily.streak, 7) * 10; S.coins += coins; let txt = '+' + coins + ' munten'; if (S.daily.streak % 3 === 0) { const j = pick(Object.keys(JOK)); S.jok[j]++; txt += ' en een joker ' + JOK[j][0]; }
              api.toast('🎁 Dagbeloning: ' + txt); A.commit();
            }, !canClaim);
            const lv = card(b); $('div', 'font-weight:800', '🎯 Levels – nu level ' + S.level, lv); $('div', 'font-size:12px;opacity:.85', '8 vragen, 20 seconden per vraag. Minstens 5 goed om door te gaan.', lv);
            btn(lv, '▶️ Start level ' + S.level, () => { start('level'); A.commit(); }, false, 'width:100%;background:linear-gradient(#f59e0b,#d97706)');
            const ct = card(b); $('div', 'font-weight:800', '📂 Oefenen per categorie (6 vragen)', ct);
            const rr = row(ct, 'flex-wrap:wrap'); CATS.forEach(k => btn(rr, CE[k] + ' ' + k, () => { start('cat', k); A.commit(); }, false, 'flex:1;min-width:44%;font-size:12px;background:#475569'));
          }
        } else if (tab === 'rank') {
          const list = RIVALS.map(x => ({ n: x[0], p: x[1] })).concat([{ n: 'Jij', p: S.pts, me: true }]).sort((a, b2) => b2.p - a.p);
          const c = card(b); $('div', 'font-weight:800', '🏆 Ranglijst', c);
          list.forEach((x, i) => $('div', 'padding:5px 0;display:flex;justify-content:space-between;' + (x.me ? 'color:#ffe08a;font-weight:800' : ''), null, c).append($('span', '', (i + 1) + '. ' + x.n), $('span', '', fmt(x.p))));
          const r = rankOf(S.pts), nx = RANKS[r + 1]; const c2 = card(b); $('div', 'font-weight:800', RANKS[r][2] + ' Rang: ' + RANKS[r][1], c2);
          if (nx) { $('div', 'font-size:13px', 'Nog ' + fmt(nx[0] - S.pts) + ' punten tot ' + nx[2] + ' ' + nx[1], c2); bar(c2, (S.pts - RANKS[r][0]) / (nx[0] - RANKS[r][0]), '#f59e0b'); } else $('div', '', 'Hoogste rang bereikt! 🎉', c2);
          RANKS.forEach((x, i) => $('div', 'font-size:12px;' + (i <= r ? '' : 'opacity:.55'), x[2] + ' ' + x[1] + ' – ' + fmt(x[0]) + ' punten', c2));
        } else if (tab === 'jok') {
          $('div', 'font-size:13px;opacity:.9', 'Gebruik jokers tijdens een vraag. Verdien munten met goede antwoorden!', b);
          Object.keys(JOK).forEach(j => { const c = card(b), r = row(c, 'justify-content:space-between'); $('div', 'font-weight:700', JOK[j][0] + ' ' + JOK[j][1] + ' · bezit ' + S.jok[j], r); btn(r, '🪙 ' + JOK[j][2], () => { S.coins -= JOK[j][2]; S.jok[j]++; A.commit(); }, S.coins < JOK[j][2], 'min-width:90px'); });
        } else {
          const c = card(b); $('div', 'font-weight:800', '📊 Statistieken', c);
          $('div', '', 'Vragen beantwoord: ' + S.stat.a, c); $('div', '', 'Goed: ' + S.stat.c + (S.stat.a ? ' (' + Math.round(S.stat.c / S.stat.a * 100) + '%)' : ''), c); $('div', '', 'Hoogste level bereikt: ' + (S.level - 1), c); $('div', '', 'Vragenbank: ' + Q.length + ' vragen', c);
          const c2 = card(b); $('div', 'font-weight:800', 'Per categorie', c2);
          CATS.forEach(k => { const s = S.cat[k] || { a: 0, c: 0 }; $('div', 'font-size:13px;padding-top:4px', CE[k] + ' ' + k + ': ' + s.c + '/' + s.a, c2); bar(c2, s.a ? s.c / s.a : 0, '#22c55e'); });
        }
      },
    });
    return { destroy() { A.destroy(); } };
  },
};
