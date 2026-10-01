# Sito del gruppo TRAFFIC

Sito statico del gruppo TRAFFIC (DIETI, Università di Napoli Federico II), pubblicato con GitHub Pages su
**https://traffic-arclab.github.io** direttamente dal branch `main`: ogni push su `main` va online in 1–2 minuti.

## Vedere il sito in locale

```bash
cd ~/traffic-arclab.github.io
python3 -m http.server 8000
```

Apri http://localhost:8000. Si ferma con `Ctrl+C`. Se non vedi le ultime modifiche ricarica con `Cmd+Shift+R`.

## Pagina People: l'editor

La pagina **People** non si modifica a mano: i dati stanno in [`data/people.json`](data/people.json) e
[`scripts/build_people.py`](scripts/build_people.py) genera da lì la parte centrale di `people.html`.
Per aggiungere, modificare, spostare o togliere persone si usa l'editor, che funziona sia online sia in locale.

Con l'editor si può:

- aggiungere un componente o un ex componente e compilare nome, ruolo, affiliazione, telefono, email, homepage e profilo Google Scholar;
- caricare la foto trascinandola: viene ritagliata in verticale (tenendo la parte alta) e ridimensionata da sola;
- riordinare le persone con ↑ ↓, spostarle tra *Members* e *Former members*, eliminarle;
- vedere a colpo d'occhio a chi mancano homepage o Scholar.

Sul sito, cliccando una card si apre l'homepage della persona; se non c'è, il suo Google Scholar.

### Online (da qualsiasi computer)

Apri **https://traffic-arclab.github.io/admin/people/**.

Possono salvare solo le persone con permesso di scrittura su questo repository. Serve un *token* GitHub personale,
da creare una volta sola:

1. GitHub → Settings → Developer settings → [Fine-grained tokens → Generate new token](https://github.com/settings/personal-access-tokens/new).
2. *Resource owner*: **traffic-arclab**. *Repository access*: **Only select repositories** → `traffic-arclab.github.io`.
3. *Repository permissions* → **Contents: Read and write**. Scegli una scadenza.
4. Genera il token, copialo e incollalo nella pagina dell'editor.

Se l'organizzazione richiede l'approvazione dei token, un admin di `traffic-arclab` deve approvarlo da
*Settings → Personal access tokens* dell'organizzazione.

Premendo **Save** l'editor fa un unico commit su `main` con `data/people.json` e le foto nuove. Il workflow
**Build People page** ([`.github/workflows/build-people.yml`](.github/workflows/build-people.yml)) rigenera
`people.html` e la pagina pubblica si aggiorna in circa 2 minuti (avanzamento nella scheda *Actions*).

Da sapere:

- Il token resta solo nella scheda aperta; con *Remember* resta nel browser finché non premi *Sign out*.
  Usa un token limitato a questo repository e con scadenza, e non condividerlo.
- Se due persone salvano nello stesso momento, la seconda riceve un avviso e deve ricaricare la pagina
  invece di sovrascrivere le modifiche dell'altra.
- Dopo aver salvato online, prima di lavorare in locale fai `git pull`.

### In locale

```bash
cd ~/traffic-arclab.github.io
python3 scripts/people_admin.py
```

Apri http://localhost:8765 (anteprima della pagina: http://localhost:8765/people.html). È la stessa interfaccia,
ma **Save** scrive i file sul computer e rigenera `people.html` subito, senza commit né push. Per pubblicare:

```bash
git add -A
git commit -m "Update People page"
git push
```

### Modificare i dati a mano

In alternativa si può modificare direttamente `data/people.json` (anche dal sito di GitHub): al push il workflow
rigenera la pagina. In locale si rigenera con `python3 scripts/build_people.py`.

Ogni persona ha questi campi:

| Campo | Contenuto |
| --- | --- |
| `name` | Nome e cognome (obbligatorio) |
| `role` | Ruolo, es. `Associate Professor`, `PhD Student` |
| `photo` | Percorso della foto, es. `images/pictures/mario_rossi.jpg` (vuoto = sagoma generica) |
| `affiliation` | Es. `DIETI` |
| `phone` | Telefono |
| `emails` | Lista di indirizzi; sul sito appaiono come `nome[at]dominio` |
| `homepage` | Sito personale: è il link aperto cliccando la card |
| `scholar` | Profilo Google Scholar: usato dalla card se manca l'homepage |

## Pubblicazioni

La lista delle pubblicazioni si aggiorna da sola ogni lunedì con il workflow **Update publications**
([`scripts/update_publications.py`](scripts/update_publications.py)), che la ricostruisce da OpenAlex e Crossref.
Per lanciarlo subito: scheda *Actions* → *Update publications* → *Run workflow*.

## Struttura

| Percorso | Contenuto |
| --- | --- |
| `index.html`, `people.html`, `publications.html`, … | Pagine principali |
| `css/site.css`, `js/site.js` | Stile e comportamento comuni |
| `images/traffic-mark.svg`, `images/traffic-logo.svg` | Logo (simbolo e completo), con le varianti `-dark` per sfondi scuri |
| `data/` | Dati di persone e pubblicazioni |
| `admin/people/` | Editor della pagina People |
| `scripts/` | Script di generazione |
| `mirage/`, `software/`, `tpa/`, … | Sotto-siti dei progetti, con la barra TRAFFIC in alto |
