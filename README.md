# Aggiornare persone, news, topics e collaborazioni del sito

L'editor online è su **https://traffic-arclab.github.io/admin/people/**. In alto ci sono quattro schede:
**People** per le persone, **News** per le notizie, **Topics** per gli argomenti di ricerca e
**Collaborations** per le collaborazioni.

## 1. Crea il token (una volta sola)

Possono salvare solo le persone con permesso di scrittura su questo repository. Serve un token GitHub personale:

1. Apri [GitHub → Fine-grained tokens → Generate new token](https://github.com/settings/personal-access-tokens/new).
2. *Resource owner*: **traffic-arclab**. *Repository access*: **Only select repositories** → `traffic-arclab.github.io`.
3. *Repository permissions* → **Contents: Read and write**. Scegli una scadenza.
4. Genera il token e copialo.

Se l'organizzazione richiede l'approvazione dei token, un admin di `traffic-arclab` deve approvarlo prima che funzioni.

## 2. Accedi

Apri l'editor, incolla il token e premi **Sign in**. Spunta *Remember* se vuoi che il browser lo ricordi;
altrimenti viene dimenticato quando chiudi la scheda. Non condividere il token con nessuno.

## 3a. Aggiungi una persona (scheda People)

1. Premi **+ Add member** (o **+ Add former member** per un ex componente).
2. Scrivi il **nome** (obbligatorio, va inserito prima della foto).
3. Trascina la **foto** nel riquadro o cliccaci sopra: viene ritagliata e ridimensionata da sola.
4. Compila ruolo, affiliazione, telefono ed email (una per riga).
5. Inserisci la **homepage** e il profilo **Google Scholar**. Il bottone **Find ↗** cerca il profilo Scholar per nome:
   apri quello giusto e incollane l'indirizzo. Sul sito, cliccando la card si apre l'homepage; se manca, lo Scholar.

Con le frecce ↑ ↓ scegli la posizione nella lista; con **Move to former members** sposti una persona tra gli ex componenti.

## 3b. Aggiungi una news (scheda News)

1. Premi **+ Add news**: anno e mese sono già impostati a oggi, cambiali se serve.
2. Scrivi il **testo** della notizia.
3. Per inserire un link seleziona le parole da collegare e premi **Link selected text**, poi incolla l'indirizzo.
   In alternativa scrivi direttamente `[testo del link](https://indirizzo)`.
4. Controlla il risultato nell'anteprima sotto il testo.

Le news vengono ordinate da sole per data, dalla più recente. Le ultime cinque compaiono anche negli
**Highlights** della home, che le alternano ogni 8 secondi con il proprio link. Per correggere o eliminare
una news, cliccala nella lista.

## 3c. Modifica i topics (scheda Topics)

I topics sono divisi in **aree** (es. *Internet measurement*); ogni area contiene dei **topic**, e ogni topic
può avere dei **tool** o progetti (es. *D-ITG*), mostrati come etichette. Da qui si aggiornano insieme la sezione
*Research topics & tools* della home e il menu **Topics** in alto in tutte le pagine del sito.

- **+ Add area** crea una nuova area; cliccando il titolo di un'area la rinomini, la sposti (↑ ↓) o la elimini.
- **+ Add topic** (accanto al titolo dell'area) aggiunge un topic a quell'area. Cliccando un topic ne modifichi
  il nome, il **link** (la sua pagina, es. `ippolib.html`, oppure un indirizzo completo `https://…`), l'area
  di appartenenza e la posizione.
- In **Tools & projects** aggiungi i tool con **+ Add tool**: nome e link (facoltativo). Con ✕ li togli.
- In cima puoi cambiare la frase introduttiva della sezione.

## 3d. Modifica le collaborazioni (scheda Collaborations)

Le collaborazioni sono divise in **Current** e **Past**.

1. Premi **+ Add collaboration** (o **+ Add past collaboration**).
2. Compila la **persona di riferimento** (obbligatoria), il **link** alla sua pagina, l'**organizzazione**
   e il **topic** su cui collaborate.
3. Con le frecce ↑ ↓ cambi l'ordine; con **Move to past collaborations** sposti una collaborazione conclusa
   tra quelle passate (e con **Move back to current** la riporti tra le attuali). **Delete** la elimina.

## 4. Salva

Premi **Save**. Le modifiche vengono salvate sul repository e le pagine pubbliche si aggiornano
in circa 2 minuti. Puoi fare modifiche in più schede e salvarle tutte insieme.

Se qualcun altro ha salvato nel frattempo, compare un avviso: ricarica la pagina e rifai le modifiche.
