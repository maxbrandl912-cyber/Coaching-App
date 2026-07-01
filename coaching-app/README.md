# Coaching App – erste echte Version

Diese Version ist mit deiner Supabase-Datenbank verbunden: Login, Registrierung
(Trainer + Klient per Einladungslink) und eine echte Übungsbibliothek, die
wirklich speichert.

## Voraussetzung
Du hast das `supabase-schema.sql`-Skript bereits im Supabase SQL Editor
ausgeführt (Tabellen + Sicherheitsregeln).

## Lokal starten
```bash
npm install
npm run dev
```
Dann im Browser die angezeigte Adresse öffnen (meist http://localhost:5173).

## Zum Testen
1. **Als Trainer registrieren** über "Als Trainer registrieren" auf der Login-Seite.
2. Je nach Projekt-Einstellung kommt eine Bestätigungs-E-Mail (siehe Hinweis unten).
3. Einloggen → du siehst die Übungsbibliothek und oben eine Karte mit deinem
   **Einladungslink für Klienten** – den kannst du kopieren.
4. Öffne den Link in einem **privaten/Inkognito-Fenster** (damit du nicht
   gleichzeitig als Trainer und Klient im selben Browser eingeloggt bist) und
   registriere dort einen Klienten-Account.
5. Als Trainer eine Übung anlegen → im Klienten-Fenster die Seite neu laden →
   die Übung erscheint dort (read-only).

## E-Mail-Bestätigung beim Testen abschalten (optional)
Standardmäßig verschickt Supabase eine Bestätigungs-E-Mail vor dem ersten
Login. Zum schnellen Testen kannst du das im Dashboard unter
**Authentication → Settings → Email** kurz deaktivieren ("Confirm email").
Für den echten Betrieb mit deinen Klienten würde ich es wieder aktivieren.

## Deployment (damit Klienten es im Browser nutzen können)
1. Code zu einem GitHub-Repository pushen
2. Auf [vercel.com](https://vercel.com) einloggen → "Add New Project" → Repository wählen
3. Unter "Environment Variables" `VITE_SUPABASE_URL` und `VITE_SUPABASE_KEY`
   eintragen (gleiche Werte wie in `.env.local`)
4. Deploy klicken – danach hast du eine echte, öffentlich erreichbare URL

## Aktueller Stand
Verbunden ist bisher nur die **Übungsbibliothek** – als Beweis, dass Login,
Rollen und Datenbank wirklich funktionieren. Als Nächstes kommen Trainingsplan,
Gewicht, Ernährung und Chat dazu, jeweils auf dem gleichen Prinzip.
