# Iceland Ring Road

Sito statico per consultare l'itinerario del road trip in Islanda (giugno 2026).
Vanilla HTML/CSS/JS, zero framework, installabile come PWA e **funziona offline**.

## Struttura

```
.
├── index.html         Markup principale
├── styles.css         Stile Nordic minimal, mobile-first
├── app.js             Render giorni, day-jump, fetch JSON, icone SVG inline
├── itinerary.json     Dati dell'itinerario (modificalo per aggiornare il sito)
├── manifest.json      PWA manifest
├── service-worker.js  Cache per uso offline
└── icon.svg           Icona app
```

## Modificare l'itinerario

Tutti i dati stanno in `itinerary.json`. Ogni giorno ha:

```json
{
  "id": 1,
  "date": "Sab 13 Giu",
  "title": "Arrivo · Reykjavík",
  "summary": { "walk": "~3 km", "drive": "50 km · 50 min" },
  "stops": [ { "type": "drive", "time": "...", "title": "...", "mapsQuery": "..." } ]
}
```

Tipi tappa supportati: `walk`, `drive`, `camp`, `midnight`.
Flag opzionali per tappa: `warning: true` (avviso ambra), `highlight: true` (stella verde).
Aggiungi `mapsQuery` per generare il link "Apri in Maps".

## Sviluppo locale

Serve un web server (`file://` non funziona con i service worker). Da terminale, nella cartella del progetto:

```bash
python3 -m http.server 8000
# poi apri http://localhost:8000
```

## Deploy su GitHub Pages

1. Crea un repo su GitHub (es. `iceland-ring-road`).
2. Da questa cartella:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TUO-USER/iceland-ring-road.git
   git push -u origin main
   ```

3. Su GitHub → **Settings → Pages**:
   - Source: **Deploy from a branch**
   - Branch: **main** / **/ (root)**
   - Salva

4. Dopo ~1 minuto il sito è online all'indirizzo
   `https://TUO-USER.github.io/iceland-ring-road/`

### Aggiornare la cache offline

Quando modifichi `index.html`, `styles.css` o `app.js`, incrementa la `VERSION` in `service-worker.js` (es. da `iceland-v1` a `iceland-v2`). Il vecchio service worker viene sostituito alla prossima visita.

## Installare sul telefono (PWA)

- **iOS Safari**: tocca Condividi → "Aggiungi a Home"
- **Android Chrome**: menu ⋮ → "Installa app"

L'app funziona anche senza connessione una volta installata — perfetta per le zone dell'Islanda senza segnale.
