# simon-app

Gedeelde webapp met telefoon-homescherm, inlogcodes en goedkeuring door de admin.

## Starten
```
cp .env.example .env   # zet ADMIN_CODE in .env
node server.js         # Node 22+; open http://localhost:3000
```

## Apps
- **App Installer** en **Notificaties**: zitten er altijd bij.
- **Lijst**: gedeelde lijst.
- **Join requests** (admin): verzoeken goedkeuren/weigeren, leden verwijderen.
- **Notificatie-maker** (admin): vergrendeld, vraagt de admin-code opnieuw.

## Online zetten (Render)
1. Maak een account op render.com en kies **New → Blueprint**, koppel deze GitHub-repo.
2. Vul bij `ADMIN_CODE` je eigen admin-code in (niet in GitHub zetten).
3. Render bouwt en start de app; de database staat op een schijf in `/var/data`.
