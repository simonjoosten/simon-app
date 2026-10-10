# simon-app

Gedeelde app met telefoon-homescherm, inlogcodes en goedkeuring door de admin.
Draait als statische pagina op GitHub Pages (`docs/`) met Firebase (Auth + Firestore) als achterkant.

- `docs/` — de website (GitHub Pages)
- `docs/firebase-config.js` — Firebase web-config (openbaar, geen geheim)
- `firestore.rules` — de echte beveiliging; plak in Firebase → Firestore → Regels
- `legacy/` — eerdere versie met eigen Node-server (niet meer in gebruik)

Admin logt in met Google; leden loggen in met hun eigen inlogcode nadat de admin ze heeft goedgekeurd.
