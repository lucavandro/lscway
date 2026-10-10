# Specifiche Tecniche del Progetto: WAY Cortese (LSC WAY)

> **Documento ad uso esclusivo di sviluppatori e agenti AI.**  
> Questo file descrive l'architettura, il dominio, la struttura del codice, le convenzioni e i requisiti di sistema dell'applicazione **WAY Cortese**.

---

## 1. Panoramica del Progetto

- **Nome dell'applicazione:** WAY Cortese (`lscway`)
- **Organizzazione:** Liceo Scientifico Statale "Nino Cortese" (Maddaloni, CE - Italia)
- **Scopo:** Progressive Web App (PWA) ad alte prestazioni, mobile-first e offline-ready per la consultazione dell'orario scolastico (classi, docenti, aule), gestione e notifica delle ore di sostituzione dei docenti, consultazione delle credenziali hotspot LIM e bacheca canali social scolastici.
- **Utenti di riferimento:**
  - **Studenti e Famiglie:** consultazione orario classe, aula e docenti, visualizzazione giornaliera e settimanale, canali social, QR code per condivisione.
  - **Docenti:** consultazione orario personale, gestione e notifica in tempo reale delle ore di sostituzione assegnate, credenziali hotspot LIM delle aule.
  - **Personale ATA e Collaboratori scolastici:** consultazione ubicazione classi e aule.
- **URL di produzione:** `https://www.liceoscientificocortese.edu.it/app/way/tmp/`
- **Ambiente di hosting:** Apache Web Server con supporto `.htaccess`, SPA statica servita sotto un path nidificato (`/app/way/tmp`).

---

## 2. Stack Tecnologico

| Componente | Tecnologia | Versione / Note |
|---|---|---|
| **Framework Frontend** | Svelte / SvelteKit | `svelte` 4.2.7, `@sveltejs/kit` 2.0.0 |
| **Adapter SvelteKit** | `@sveltejs/adapter-static` | 3.0.9 (configurato come SPA pura: `ssr: false`, `prerender: false`, fallback `index.html`) |
| **Bundler & Dev Server** | Vite | 5.0.3, porta locale `1987`, binding `--host` |
| **UI Framework & Stili** | Pure CSS Design System | `app.css` (custom dark/light tokens, `:where()` reset, font scaler, view transitions) |
| **State Management** | Svelte Stores (Writable / Readable) | Store reattivi con sincronizzazione `localStorage` |
| **PWA & Offline** | Workbox CDN 5.1.2 + Custom Service Worker | Manifest V3, strategie `CacheFirst` per bundle immutabili, `StaleWhileRevalidate` per asset statici e shell SPA |
| **Autenticazione** | Google Identity Services (GIS) | OAuth 2.0 client-side JWT decode ristretto al dominio `@lscortese.com` |
| **Notifiche** | Web Notifications API + Service Worker | Notifiche push locali per sostituzioni docenti |

---

## 3. Architettura dell'Applicazione

### 3.1. Single Page Application (SPA) Pura
L'applicazione viene compilata come una SPA statica (senza SSR a runtime Node.js):
- `src/routes/+layout.js` dichiara:
  ```javascript
  export const prerender = false;
  export const ssr = false;
  ```
- `svelte.config.js` configura l'adapter:
  ```javascript
  adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: true
  }),
  paths: {
      base: '/app/way/tmp'
  }
  ```
- **Invariante per Agenti AI:** qualsiasi route interna, link, o fetch ad asset interni **deve** utilizzare o tenere conto del prefisso `base` importato da `$app/paths` (es. `<a href="{base}/docente">`).

### 3.2. Caching, Indicizzazione O(1) e Avvio Istantaneo (Stale-While-Revalidate)
1. **Preload anticipato in `app.html`:** prima ancora che il bundle JS di Svelte si carichi, un piccolo script inline in `app.html` avvia la fetch dei dati orario salvando la Promise in `window.__lscwayInitialDataPromise`.
2. **Memoria locale (`localStorage`) e Indicizzazione `O(1)`:** i dati dell'orario vengono salvati sotto la chiave `lscway_orario_cache_v1` in modo asincrono con `requestIdleCallback` e arricchiti in memoria con una proprietà non-enumerabile `_index` (`byClass`, `byTeacher`, `byAula`) per lookup istantanei $O(1)$ al cambio selezione.
3. **Ripristino immediato e Revalidation intelligente:** all'apertura dell'app, se i dati sono in cache vengono immediatamente mostrati; la revalidation in background aggiorna lo store `timetableData` e `localStorage` **solo se il payload ricevuto differisce effettivamente da quello in cache**, evitando re-render ridondanti.
4. **Migrazione Chunk Immutabili nel Service Worker:** ad ogni cambio di `CACHE_VERSION`, l'evento `activate` di `static/service-worker.js` migra nella nuova cache i file `/_app/immutable/` già presenti nella cache precedente prima di rimuoverla, azzerando il riscaricamento dei bundle invariati.

### 3.3. Tema Dinamico e Accessibilità
- **Modalità Dark / Light:** implementata in `src/lib/theme.js` tramite attributo `data-theme` su `<html>` e proprietà CSS `color-scheme`. Supporta rilevamento delle preferenze di sistema (`prefers-color-scheme`) e memorizzazione in `localStorage`.
- **Scalatore Dimensioni Testo Tabelle (`tableFontScale`):** permette di scalare dinamicamente le tabelle orario da `0.7x` a `1.4x` (default `1.0x`) con step di `0.1`, pilotando la variabile CSS `--table-font-scale`.
- **View Transitions API:** transizioni di pagina fluide native supportate tramite hook `onNavigate` in `+layout.svelte`.

---

## 4. Struttura del Repository

```
lscway/
├── .env.development            # Configurazione variabili per sviluppo locale
├── .env.example                # Modello di variabili d'ambiente
├── .env.local                  # Override variabili d'ambiente locali
├── .env.production             # Configurazione variabili per build di produzione
├── package.json                # Dipendenze e script npm
├── svelte.config.js            # Configurazione SvelteKit (base path, adapter-static)
├── vite.config.js              # Configurazione Vite (server port 1987)
├── SPECS.md                    # Specifiche tecniche per agenti AI (questo file)
├── README.md                   # Breve introduzione per sviluppatori umani
│
├── static/                     # Risorse statiche servite direttamente
│   ├── .htaccess               # Direttive Apache per routing SPA e cache control
│   ├── app.css                 # Design System, reset moderno, variabili CSS e stili globali
│   ├── favicon.png             # Favicon applicazione
│   ├── icon-192.png            # Icona PWA 192x192
│   ├── icon-512.png            # Icona PWA 512x512
│   ├── logo-blue.webp          # Logo ufficiale WAY Cortese
│   ├── manifest.json           # Manifest PWA (display standalone, shortcuts, screenshots)
│   ├── qr.webp                 # Immagine QR code per condivisione (WebP)
│   ├── service-worker.js       # Service worker PWA (Workbox, caching e background check)
│   └── eastereggs/             # Immagini di stato ed Easter Eggs
│       ├── 500.webp            # Panda di errore 500
│       ├── saturday.webp       # Illustrazione sabato
│       ├── sunday.webp         # Illustrazione domenica
│       └── xmas1/2/3.webp      # Illustrazioni periodo natalizio
│
└── src/
    ├── app.html                # Template HTML base, early preload script, splash screen
    ├── error.html              # Fallback statico per errori fatali
    ├── hooks.js                # SvelteKit client hooks e log suppressor
    │
    ├── icons/                  # Componenti Svelte icone SVG scalabili
    │   ├── BellIcon.svelte / BellOffIcon.svelte
    │   ├── HomeIcon.svelte
    │   ├── LoginIcon.svelte / LogoutIcon.svelte
    │   ├── MoonIcon.svelte / SunIcon.svelte
    │   ├── ReloadIcon.svelte
    │   ├── ShareIcon.svelte
    │   ├── SocialIcon.svelte
    │   ├── SwapIcon.svelte
    │   └── WifiIcon.svelte
    │
    ├── lib/                    # Librerie e moduli logici condivisi
    │   ├── data.js             # Fetch orario, cache localStorage, JWT Google auth
    │   ├── dateutils.js        # Ore lezioni, calcolo ora corrente, giorni, store orologio
    │   ├── hotspot.js          # Tabella statica SSID / password hotspot LIM per aula
    │   ├── notifications.js    # Richiesta permessi, trigger notifiche, sync con SW
    │   ├── quotes.js           # Collezione citazioni/aforismi scolastici e selettore random
    │   ├── stores.js           # Svelte stores globali reattivi
    │   ├── theme.js            # Gestore tema chiaro/scuro e preferenze utente
    │   ├── utils.js            # Preferenze utente (localStorage), validazione email, ordinamento
    │   └── images/icons/       # Vettori SVG locali (es. offline-icon-dark/light)
    │
    └── routes/                 # Pagine e componenti visuali dell'app
        ├── +layout.js          # Disabilita SSR, abilita caricamento dati iniziale
        ├── +layout.svelte      # Layout radice: Header, Footer, Menu drawer, Splash
        ├── +page.svelte        # Vista principale: Orario per CLASSE
        ├── +error.svelte       # Pagina errore generica (404 o fallback 500)
        ├── Error500.svelte     # Componente errore 500 con easter egg Panda offline e citazione
        ├── EasterEggQuote.svelte # Box citazione/aforisma o curiosità casuale sotto gli easter egg
        ├── Header.svelte       # Header superiore: hamburger, brand, orologio, install PWA
        ├── HeaderMenuPanel.svelte # Drawer laterale con swipe-to-close, impostazioni, font scale
        ├── Footer.svelte       # Piè di pagina con collegamenti e crediti
        ├── Tabs.svelte         # Barra di navigazione a pillole (Classe / Docente / Aula / Sostituzioni)
        ├── ItemSelect.svelte   # Selettore ricercabile responsivo con gestione tastiera mobile
        ├── PWAButton.svelte    # Pulsante installazione PWA (evento beforeinstallprompt)
        ├── TimeTable.svelte    # Tabella giornaliera (orario odierno)
        ├── TimeTableRow.svelte # Singola riga orario con evidenziazione "Ora attuale" e pillole
        ├── FullTimeTable.svelte       # Matrice orario settimanale (LUN - VEN)
        ├── FullTimeTableRow.svelte   # Riga della matrice orario settimanale
        ├── FullTimeTableSwitch.svelte # Toggle switch Giornaliero / Settimanale
        │
        ├── aula/               # Pagina consultazione orario per AULA
        │   └── +page.svelte
        ├── docente/            # Pagina consultazione orario per DOCENTE
        │   └── +page.svelte
        ├── sostituzioni/       # Pagina bacheca ore di SOSTITUZIONE (riservata docenti)
        │   └── +page.svelte
        ├── hotspot/            # Pagina ricerca password hotspot Wi-Fi LIM per aula
        │   └── +page.svelte
        ├── qr/                 # Pagina codice QR e condivisione applicazione
        │   └── +page.svelte
        ├── social/             # Pagina collegamenti ai canali social ufficiali
        │   └── +page.svelte
        ├── signin/             # Pagina autenticazione Google per docenti
        │   └── +page.svelte
        ├── offline/            # Pagina di fallback per mancanza di connessione
        │   └── +page.svelte
        └── 500/                # Route dedicata per test o visualizzazione errore server
            └── +page.svelte
```

---

## 5. Modello Dati e Integrazioni API

### 5.1. API Orario Principale
- **Endpoint:** `GET https://www.liceoscientificocortese.edu.it/app/orario/api/v0` (configurabile tramite `VITE_API_URL`)
- **Risposta JSON attesa:**
  ```json
  {
    "user": "nome.cognome@lscortese.com", // Facoltativo
    "classi": ["1A", "1B", "2A", "3C", ...],
    "docenti": ["ROSSI MARIO", "BIANCHI GIUSEPPE", ...],
    "aule": ["A101", "A102", "B204", ...],
    "data": [
      {
        "day": "LUN",
        "ora": "08:00",
        "classe": "1A",
        "docente": "ROSSI MARIO",
        "materia": "MAT",
        "aula": "A101"
      }
    ]
  }
  ```

#### Regole di Normalizzazione (`src/lib/data.js` -> `normalizeTimetableData`):
1. **Filtro classi:** le classi contenenti caratteri speciali come `.` o `*` vengono ripulite o escluse.
2. **Sostegno / Inclusione:** le materie `INC` o `MADISO` vengono poste in coda tramite la funzione di comparazione `inclusioneInFondo` (`src/lib/utils.js`).
3. **Potenziamento & Ricevimento:**
   - Materie `sub_potenziamento` o `POT` -> materia standardizzata in `POT`, aula vuota, classe vuota.
   - Materie `sub_ricevimento` o `RIC` -> materia standardizzata in `RIC`, aula vuota.

### 5.2. API Sostituzioni Docenti
- **Endpoint Sostituzioni Dettagliate (UI):**  
  `GET https://www.liceoscientificocortese.edu.it/app/orario/api/v0/sostituzioni?email={userEmail}`
- **Filtro applicato nel frontend:**
  ```javascript
  s.data >= getTodayDate() &&
  s.stato === "pubblicata" &&
  s.presaVisione?.stato &&
  s.presaVisione.stato !== "non_inviata" &&
  s.presaVisione.stato !== "fallita"
  ```
- **Endpoint Polling Service Worker (Notifiche Background):**  
  `GET https://www.liceoscientificocortese.edu.it/app/way/docenti_sostituzioni_api.php?email={userEmail}`
  Restituisce `{ success: true, data: [ { id, data, ora, classe, accettato } ] }`. Se trova sostituzioni per la data odierna non ancora accettate e non ancora notificate, invia una `Notification` nativa.

### 5.3. Hotspot LIM Aule (`src/lib/hotspot.js`)
- Mappa statica `chiave_aula: password`.
- Gestisce aule singole (es. `"A101": "89287577"`) e aule con più punti d'accesso (es. `"B105_1"`, `"B105_2"`, `"B105_3"`).
- Include l'hotspot generale docenti: `"NINOCORTESE": "N1n0$d0cent1"`.

---

## 6. Svelte Stores e Gestione dello Stato Globale

Gli store globali sono definiti in `src/lib/stores.js`, `src/lib/dateutils.js` e `src/lib/theme.js`:

| Store | Tipo | Persistenza | Descrizione |
|---|---|---|---|
| `timetableData` | `writable(null)` | Cache memory + `localStorage` | Dati completi dell'orario scolastico normalizzato |
| `userEmail` | `writable(string\|null)` | `localStorage('userEmail')` | Email Google dell'utente loggato (`@lscortese.com`) |
| `isTeacher` | `writable(boolean)` | Derivato da `userEmail` | `true` se il prefisso dell'email non contiene `.` (es. `cognome@...`), `false` se studente (`nome.cognome@...`) |
| `isLoading` | `writable(boolean)` | In-memory | Mostra lo splash screen o spinner di ricaricamento |
| `isMenuOpen` | `writable(boolean)` | In-memory | Controlla l'apertura del drawer laterale (`HeaderMenuPanel.svelte`) |
| `notificationsEnabled`| `writable(boolean)` | `localStorage('notifications_enabled')` | Preferenza utente per le notifiche push |
| `notificationPermission` | `writable(boolean)` | In-memory (allineato con browser) | Stato permessi notifiche browser (`granted`) |
| `tableFontScale` | `writable(number)` | `localStorage('table_font_scale')` | Fattore di scala font tabelle (0.7 - 1.4). Aggiorna `--table-font-scale` nel DOM |
| `clockStore` | `readable(object)` | In-memory (timer ogni 15s) | Fornisce `{ day, hourNum, schoolHour, isChristmas }` |
| `theme` | `writable('light'\|'dark')` | DOM `data-theme` | Tema effettivo visualizzato |
| `themePreference` | `writable('system'\|'light'\|'dark')`| `localStorage('theme')` | Preferenza tema scelta dall'utente |

---

## 7. Logica di Business e Dominio Scolastico

### 7.1. Scansione Oraria delle Lezioni
Definita in `src/lib/dateutils.js`:
- **Giorni di lezione:** `["LUN", "MAR", "MER", "GIO", "VEN"]`
- **Fasce orarie di inizio (8 ore totali):**
  1. `08:00` (1ª ora)
  2. `08:55` (2ª ora)
  3. `09:50` (3ª ora)
  4. `10:45` (4ª ora)
  5. `11:40` (5ª ora)
  6. `12:35` (6ª ora)
  7. `13:30` (7ª ora)
  8. `14:25` (8ª ora / uscita)
- **Calcolo ora corrente (`getHourNum()`):** calcola i minuti trascorsi dalla mezzanotte e determina l'indice dell'ora attuale (1-based: `1..8`). Se fuori fascia oraria o nel weekend, restituisce `0` ("Fuori orario").

### 7.2. Condizioni Speciali ed Easter Eggs
- **Sabato e Domenica:** le tabelle orario giornaliere mostrano illustrazioni a tema weekend (`saturday.webp`, `sunday.webp`).
- **Periodo Natalizio (`isChristmasPeriod()`):** dal 23 Dicembre al 6 Gennaio vengono visualizzate animazioni natalizie (`xmas1.webp`, `xmas2.webp`, `xmas3.webp`).
- **Errore 500 / Crash Rete (`Error500.svelte`):** include una speciale illustrazione del panda (`500.webp`) precaricata con bassa priorità e recuperata anche direttamente da Cache Storage in modalità offline.
- **Citazioni, Aforismi e Curiosità Casuali (`EasterEggQuote.svelte` & `src/lib/quotes.js`):** tutte le viste con easter egg (Sabato, Domenica, periodo natalizio in `TimeTable.svelte` e pagina errore `Error500.svelte`) sono accompagnate in basso da una citazione, aforisma (con qualifica/mestiere dell'autore) o curiosità (con titolo `"Lo sapevi?"`) scelta casualmente dalla collezione predefinita (`quotes`), curata per il contesto scolastico liceale (scienza, filosofia, letteratura, riposo e otium creativo, oltre a curiosità su Nino Cortese, sulla storia di Maddaloni, sulla storia delle scienze, della matematica e dell'informatica). La funzione `getRandomQuote()` evita ripetizioni consecutive e un pulsante dedicato consente di pescare casualmente una nuova voce.

### 7.3. Riconoscimento Ruolo Utente
Il liceo adotta la convenzione di Google Workspace:
- Studenti: `nome.cognome@lscortese.com` (contiene il punto nel nome utente).
- Docenti: `cognome@lscortese.com` oppure identificativo senza punto.
- Lo store `isTeacher` calcola automaticamente:
  ```javascript
  const username = value ? value.split('@')[0] : null;
  isTeacher.set(username && !username.includes('.'));
  ```

---

## 8. Specifiche dei Componenti Chiave

### 8.1. `ItemSelect.svelte`
- Selettore con autocompletamento e ricerca elastica per Classi, Docenti e Aule.
- **Supporto Mobile Avanzato:**
  - Quando lo schermo è < 640px, il menu si apre come un foglio a tutto schermo o anchored sheet.
  - Si collega alla `window.visualViewport` per ricalcolare l'altezza disponibile e posizionarsi sopra la tastiera virtuale degli smartphone, garantendo che tutti i risultati siano visibili e scrollabili.
  - Touch targets ampi (almeno 48px) per le opzioni.

### 8.2. `TimeTable.svelte` e `TimeTableRow.svelte`
- Renderizza la vista giornaliera per la classe, docente o aula selezionata.
- Evidenzia automaticamente la riga corrispondente all'ora di lezione corrente con il badge "Ora".
- Gestisce righe speciali: se un docente ha contemporaneamente più voci contrassegnate come Ricevimento o Potenziamento, la cella viene estesa (`colspan`) con etichette chiare.
- Link cliccabili tra entità: cliccando sull'aula si naviga su `/aula?q=...`; cliccando sul docente si naviga su `/docente?q=...`.

### 8.3. `FullTimeTable.svelte` e `FullTimeTableRow.svelte`
- Tabella a matrice settimanale completa (colonna ore fissa a sinistra, 5 colonne per i giorni LUN-VEN).
- Header giorno corrente evidenziato con un indicatore ("today dot").
- Supporta scorrimento orizzontale fluido con ombreggiatura di scorrimento sui dispositivi mobili.

### 8.4. `HeaderMenuPanel.svelte`
- Pannello di navigazione laterale drawer con supporto per swipe touch per la chiusura.
- Include controlli per:
  - Navigazione a tutte le sezioni (Home, Docente, Aula, Sostituzioni, Hotspot, Social, QR).
  - Toggle Notifiche.
  - Toggle Tema chiaro / scuro.
  - Regolatore dimensione caratteri tabella (con pulsanti `-` / `+`, slider e tasto reset).
  - Pulsante "Aggiorna orario" (`reload()` che pulisce Cache Storage, Service Worker e ricarica i dati freschi).
  - Accesso / Logout utente.

---

## 9. Linee Guida per Agenti AI e Regole di Modifica del Codice

Qualsiasi agente AI che opera su questa codebase **DEVE** rispettare rigorosamente le seguenti direttive:

1. **Rispettare il Base Path:**
   - Il progetto è configurato con `paths.base = '/app/way/tmp'`.
   - **MAI** inserire percorsi assoluti hardcoded come `/docente` o `/logo-blue.webp`.
   - Usare sempre `${base}/percorso` per i link interni e gli asset, oppure importare percorsi relativi corretti.

2. **Nessun Server-Side Rendering (SSR):**
   - L'applicazione viene generata come build statica client-only.
   - Non introdurre codice Node.js (come `fs`, `path`, server hooks con database) dentro `src/routes/` o `src/lib/`.
   - L'accesso a `window`, `document`, o `localStorage` deve essere sempre protetto da controlli `if (typeof window !== 'undefined')` o collocato all'interno di `onMount()`.

3. **Integrità del Service Worker e Caching:**
   - La gestione della cache deve rimanere allineata a `CACHE_VERSION` in `static/service-worker.js` e `APP_VERSION` in `src/app.html`.
   - Non bloccare o rompere le strategie Workbox `CacheFirst` per i bundle immutabili (`/_app/immutable/`) e `StaleWhileRevalidate` per gli asset.

4. **Prestazioni e Bundle Size:**
   - Mantenere le dipendenze leggere. Il progetto non fa uso di framework CSS pesanti o librerie JS ridondanti.
   - Tutte le immagini devono preferire formati moderni come `.webp` o SVG vettoriali.
   - Il menu laterale `HeaderMenuPanel.svelte` è caricato in lazy loading per non impattare sul First Contentful Paint (FCP).

5. **Accessibilità e Responsive Design:**
   - Conservare gli attributi `aria-label`, `aria-selected`, `aria-expanded` e i ruoli semantici (`role="tablist"`, `role="tab"`).
   - Verificare sempre che il viewport mobile mantenga una leggibilità impeccabile sia a tema chiaro che scuro.
   - Preservare il supporto alla variabile CSS `--table-font-scale`.

6. **Preservare la Documentazione Esistente:**
   - Non eliminare commenti esistenti esplicativi a meno che non siano obsoleti a seguito di un refactoring richiesto.

---

## 10. Comandi Utili per lo Sviluppo

```bash
# Avviare il server di sviluppo locale (porta 1987 con host di rete esposto)
npm run dev

# Eseguire la build statica di produzione (output in build/)
npm run build

# Visualizzare in anteprima la build statica
npm run preview

# Esecuzione rapida unit test con Vitest
npm test
npm run test:unit

# Esecuzione unit test in modalità interattiva / watch
npm run test:unit:watch

# Esecuzione test End-to-End completi con Playwright
npm run test:e2e

# Esecuzione congiunta di tutta la suite (Unit + E2E)
npm run test:all
```

---

## 11. Suite di Test e Verifica di Qualità (Unit & E2E)

L'integrità del software e l'assenza di regressioni sono garantite da una doppia suite di test automatizzati:

### 11.1. Unit & Integration Testing (Vitest)
- **Configurazione:** `vitest.config.js` con ambiente `jsdom` e mock virtuali dei moduli runtime di SvelteKit (`$app/paths`, `$app/stores`, `$app/navigation`, `$app/environment` situati in `tests/mocks/app/`).
- **File di test (`tests/unit/`):**
  - `dateutils.test.js`: fasce orarie lezioni (8 ore), calcolo indice ora corrente, rilevamento giorni della settimana e periodo natalizio, store orologio.
  - `stores.test.js`: discriminazione docenti/studenti (`isTeacher`), persistenza email, clamping del fattore di scala font tabelle (`TABLE_FONT_SCALE_MIN/MAX`), stati menu e loading.
  - `data.test.js`: normalizzazione orario (pulizia caratteri `.` e `*`, normalizzazione materie speciali `POT`/`RIC`), decodifica Google JWT OAuth 2.0 e vincolo dominio scolastico `@lscortese.com`.
  - `utils.test.js`: persistenza preferenze in `localStorage` (docente, classe, aula), validatore booleano email scolastica, data odierna YYYY-MM-DD, ordinamento materie sostegno/inclusione in fondo.
  - `hotspot.test.js`: consistenza database credenziali Wi-Fi LIM per tutte le aule dei tre plessi A, B e C e hotspot docenti.
  - `notifications.test.js`: permessi Web Notifications, notifiche per sostituzioni del giorno con deduplicazione, messaggistica con il Service Worker.
  - `quotes.test.js`: validazione integrità collezione citazioni scolastiche, estrazione casuale e prevenzione ripetizioni consecutive.
  - `theme.test.js`: transizione temi light/dark e persistenza DOM/`localStorage`.

### 11.2. End-to-End Testing (Playwright)
- **Configurazione:** `playwright.config.js` con avvio automatico del web server di preview (`npm run preview -- --port 4173`), browser Chromium headless, risoluzione del base path `/app/way/tmp`.
- **Intercettazione e Mocking API (`tests/e2e/fixtures/helpers.js`):** le chiamate API remote verso `liceoscientificocortese.edu.it` vengono intercettate via RegExp e servite con dati deterministici (`mockData.js`), evitando dipendenze da reti esterne o downtime dei server della scuola.
- **Scenari E2E coperti (`tests/e2e/`):**
  - `home-timetable.spec.js`: caricamento home, brand, tab navigation, selettore classe con ricerca, tabella giornaliera, toggle e matrice orario settimanale completo.
  - `navigation-tabs.spec.js`: transizione fluida tra schede Classe, Docente e Aula con aggiornamento reattivo dei dati.
  - `header-menu.spec.js`: apertura/chiusura drawer menu, cambio tema chiaro/scuro in tempo reale, variazione dimensione font tabella con controlli dedicati.
  - `hotspot.spec.js`: consultazione password Wi-Fi LIM aula e verifica operazione di copia.
  - `qr-social.spec.js`: rendering codice QR con link di condivisione e bacheca canali social ufficiali (Facebook, Instagram, TikTok, YouTube).
  - `sostituzioni.spec.js`: controllo accessi (avviso per utenti non autenticati) e visualizzazione schede sostituzione con badge orario e classe per docenti loggati.
  - `error-pages.spec.js`: fallback per modalità offline (`/offline`) e pagina errore 500 (`/500`) con illustrazione del panda.

### 11.3. Regola Operativa di Auto-Risoluzione dei Fallimenti
In ottemperanza ad `AGENTS.md`, qualsiasi agente AI o harness che rileva un fallimento nei test deve:
1. Arrestare qualsiasi operazione di commit o push.
2. Analizzare i log di errore (stack trace, assertion diff, contesti Playwright).
3. Diagnosticare la causa radice ed applicare autonomamente la correzione al codice o ai test.
4. Rieseguire i test fino ad ottenere il 100% di esito positivo (`exit code 0`).

