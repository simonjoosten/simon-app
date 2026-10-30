import { inflect } from '../packs-a-lib.js?v=1';
export default inflect({
  "id": "nl-meervouden",
  "name": "Spelling: meervouden",
  "emoji": "👥",
  "group": "Spelling",
  "lang": "nl",
  "desc": "Honden, huizen, auto's, kinderen... kies het goede meervoud.",
  "kind": "meervoud",
  "items": `
hond|honden
kat|katten|kats;kat's;kattens
huis|huizen|huisen;huissen;huisn
boek|boeken
tafel|tafels|tafelen;tafel's;tafeln
auto|auto's|autos;autoos;autoen|Na een klinker die lang klinkt zet je een apostrof: auto's.
foto|foto's|fotos;fotoos;fotoen|Na een o zet je 's.
baby|baby's|babys;babies;babyen|Na een y zet je 's.
paraplu|paraplu's|paraplus;parapluen;paraplu'en|Na een u die lang klinkt zet je 's.
kind|kinderen|kinders;kinden;kindeen|Kind heeft een onregelmatig meervoud: kinderen.
ei|eieren|eien;eis;ei's|Ei heeft een onregelmatig meervoud: eieren.
stad|steden|stads;stadden;stadens|Stad heeft een onregelmatig meervoud: steden.
dag|dagen
weg|wegen
vrouw|vrouwen
jongen|jongens|jongenen;jongen's;jongennen|Woorden op -en maken het meervoud op -s.
meisje|meisjes|meisjen;meisje's;meisjeen|Verkleinwoorden maken het meervoud op -s.
appel|appels|appelen;appel's;appeln|Woorden op -el maken het meervoud op -s.
vogel|vogels|vogelen;vogel's;vogeln|Woorden op -el maken het meervoud op -s.
school|scholen|schoolen;schools;school's|Open lettergreep: één o.
tand|tanden
schip|schepen|schipen;schippen;schips|Schip heeft een eigen meervoud: schepen.
stoel|stoelen
fiets|fietsen
kaart|kaarten
tekening|tekeningen|tekeningn;tekeninge;tekening's|Woorden op -ing maken het meervoud op -en.
koe|koeien|koeen;koes;koe's|Koe krijgt -ien: koeien.
ui|uien|ui's;uis;uin|Ui wordt uien.
pizza|pizza's|pizzas;pizzaen;pizza'en|Na een a zet je 's.
radio|radio's|radios;radioos;radioen|Na een o zet je 's.
computer|computers|computeren;computer's;computern|Woorden op -er maken het meervoud op -s.
glas|glazen|glassen;glaas;glasen|Glas heeft een eigen meervoud: glazen.
`
});
