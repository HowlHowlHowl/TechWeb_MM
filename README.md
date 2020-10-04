AUTORI:
Anna Cirasole
Dario Mylonopoulos
Gabriele Fogu

Mistero al Museo - M&M è un applicazione con tre obiettivi fondamentali:
- Intrattenere con sfide interessanti e appropriate all'età e alla competenza.
- Educare ai contenuti culturali e formativi specifici del luogo nel quale si trovano (es. museo)
- Contenere in modo tale che a sua naturale esuberanza e irrequietezza non rechi disturbo alle persone presenti e non coinvolte nell'attività formativa

Tramite M&M è possibile scrivere storie per ragazzi tra i 7 e i 18 anni nelle quali inserire quesiti e spiegazioni con le quali ai ragazzi verrà chiesto di svolgere compiti che possono richiedere di identificare, comprendere e descrivere oggetti, concetti e informazioni specifiche dell'ambiente per il completamento delle missioni. 
Le storie possono essere svolte da gruppi di ragazzi o in maniera individuale.

I giochi riassumendo sono di tre tipi:
– individuale,
– piccolo gruppo (2-5 ragazzi)
– classe (15-25 ragazzi organizzati in piccoli gruppi paralleli, indipendenti ed in competizione)

A livello tecnico, la logica server-side è di ispirazione REST implementato attraverso l'utilizzo di Node.js runtime, orientato agli eventi I/O.

Il PLAYER [Ad opera di Anna C.]:
GUI ottimizzata per smartphone, gira anche su PC. 
Viene utilizzato dai ragazzi ma in generale dagli utenti che accedono alla storia inquadrando un QR-code. Entrati in partita all'utente viene assegnato un ID immutabile. Attraverso questo modulo i ragazzi rivcevono le istruzioni per le varie task e forniscono le risposte.
E' disponibile una chat in game con il valutatore e una sezione nella quale è possibile richiedere aiuto, è inoltre possibile visualizzare costantemente il proprio punteggio ed è chiaramente indicato se la storia selezionata è accessibile oppure no.

Il VALUTATORE [Ad opera di Gabriele F.]:
GUI ottimizzata per PC, gira anche su smartphone. 
Viene utilizzato dal responsabile dei ragazzi per:
- Controllare lo stato di avanzamento nella storia (tramite classifica, storico individuale e schede utente)
- Controllare e rispondere ad eventuali richieste di aiuto o risposte a domande con valutazione non algoritmica
- Parlare con i ragazzi tramite chat
- Eseguire il download dei dati individuali e della classifica
E' possibile tramite la scheda utente assegnare un nome ad ogni giocatore da visualizzare al posto dell'ID.

L'AUTORE [Ad opera di Dario M.]:
GUI ottimizzata per PC. 
Viene utilizzato dall'autore della storia per scriverne il contenuto (quindi definire domande, spiegazioni e risposte), mappare il modello di progressione tramite una architettura a nodi di grafo. E' possibile modificare l'estetica della storia e scegliere fra 3 diversi widget di input:
- Pergamena (Input per testi anche di grandi dimensioni con l'aspetto di una pergamena antica)
- Scanner (Input per immagini)
- Tastierino Numerico (Input per numeri a quattro cifre) 
Tramite il modulo autore è possibile generare i QR-code da fornire ai ragazzi per l'accesso alle storie ed è possibile archiviare e pubblicare le storie per gestirle al meglio.

Client-Side l'applicazione è fortemente dipendente da jQuery e Bootstrap
Le connessioni al server sono asincrone ed effettuate tramite chiamate ajax, lato server invece tutte le interazioni con i file sono sincrone e mutualmente esclusive. 
Il codice è organizzato in file distinti .js/.html/.css, uno per ogni modulo.