# Aggiungere persone alla pagina People

L'editor online è su **https://traffic-arclab.github.io/admin/people/**.

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

## 3. Aggiungi la persona

1. Premi **+ Add member** (o **+ Add former member** per un ex componente).
2. Scrivi il **nome** (obbligatorio, va inserito prima della foto).
3. Trascina la **foto** nel riquadro o cliccaci sopra: viene ritagliata e ridimensionata da sola.
4. Compila ruolo, affiliazione, telefono ed email (una per riga).
5. Inserisci la **homepage** e il profilo **Google Scholar**. Il bottone **Find ↗** cerca il profilo Scholar per nome:
   apri quello giusto e incollane l'indirizzo. Sul sito, cliccando la card si apre l'homepage; se manca, lo Scholar.

Con le frecce ↑ ↓ scegli la posizione nella lista; con **Move to former members** sposti una persona tra gli ex componenti.

## 4. Salva

Premi **Save**. Le modifiche vengono salvate sul repository e la pagina People pubblica si aggiorna
in circa 2 minuti.

Se qualcun altro ha salvato nel frattempo, compare un avviso: ricarica la pagina e rifai le modifiche.
