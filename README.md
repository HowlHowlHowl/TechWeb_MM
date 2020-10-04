# Autori
- Anna Cirasole
- Dario Mylonopoulos
- Gabriele Fogu

# M&M - Mistero al Museo 
M&M è un applicazione con tre obiettivi fondamentali:
- Intrattenere ragazzi con sfide interessanti e appropriate all'età e alla competenza.
- Educare ai contenuti culturali e formativi specifici del luogo nel quale si trovano (es. museo)
- Contenere i ragazzi in modo tale non rechino disturbo alle persone presenti e non coinvolte nell'attività formativa

Tramite M&M è possibile scrivere storie per ragazzi tra i 7 e i 18 anni nelle quali inserire quesiti e spiegazioni con le quali ai ragazzi verrà chiesto di svolgere compiti che possono richiedere di identificare, comprendere e descrivere oggetti, concetti e informazioni specifiche dell'ambiente per il completamento delle missioni. 
Le storie possono essere svolte da gruppi di ragazzi o in maniera individuale.

# Storie
Tre storie già scritte sono disponibili nella cartella `stories`:
 - **La luna di smeraldo:** Storia individuale per ragazzi tra i 7-10 anni in cui il giocatore si immedesima in un avventuriero in egitto.
 - **Ladri al Van Gogh Museum:** Storia per grandi gruppi di ragazzi tra i 11-14 anni riguardante un furto al Van Gogh Museum. 
 - **Uomo come soggetto o oggetto di studio:** Storia per piccoli gruppi di ragazzi tra i 15-18 anni sull'antropologia.
 
 

# Architettura
M&M si basa su tre applicazioni client-side e una applicazione server side.
Le applicazioni client-side fanno utilizzo di jQuery e Bootstrap, le connessioni al server sono asincrone ed effettuate tramite chiamate ajax.
La base di markup per ogni applicazione client-side è contenuta nei file `.html`, i quali fanno uso di script e fogli di stile contenuti all'interno della cartella `public` insieme ad immagini, icone e font.


## Player
(Ad opera di Anna C.)
GUI ottimizzata per smartphone, gira anche su PC. 
Viene utilizzato dai ragazzi ma in generale dagli utenti che accedono alla storia inquadrando un QR-code. Entrati in partita all'utente viene assegnato un ID immutabile. Attraverso questo modulo i ragazzi rivcevono le istruzioni per le varie task e forniscono le risposte.
E' disponibile una chat in game con il valutatore e una sezione nella quale è possibile richiedere aiuto, è inoltre possibile visualizzare costantemente il proprio punteggio ed è chiaramente indicato se la storia selezionata è accessibile oppure no.

## Valutatore 
(Ad opera di Gabriele F.):
GUI ottimizzata per PC, gira anche su smartphone. 
Viene utilizzato dal responsabile dei ragazzi per:
- Controllare lo stato di avanzamento nella storia (tramite classifica, storico individuale e schede utente)
- Controllare e rispondere ad eventuali richieste di aiuto o risposte a domande con valutazione non algoritmica
- Parlare con i ragazzi tramite chat
- Eseguire il download dei dati individuali e della classifica

E' possibile tramite la scheda utente assegnare un nome ad ogni giocatore da visualizzare al posto dell'ID.

## Autore
(Ad opera di Dario M.)
GUI ottimizzata per PC. 
Viene utilizzato dall'autore della storia per scriverne i contenuti quali spiegazioni, domande, risposte e mappare il modello di progressione tramite una struttura a grafo. L'editor della struttura è basato su nodi, elementi che possono essere collegati tra loro e spostati liberamente per modificare e visualizzare intuitivamente le transizioni tra una attività e l'altra della storia. E' inoltre possibile modificare l'estetica della storia e scegliere fra diversi stili di widget di input predisposti. Tramite il modulo autore è possibile generare i QR-code da fornire ai ragazzi per l'accesso alle storie e archiviare e pubblicare le storie per gestirle al meglio.

## Server
(Ad opera di Gabriele F. e Dario M.)
A livello tecnico, la logica server-side è di ispirazione REST implementata attraverso l'utilizzo di Node.js, orientato agli eventi I/O. Il server node è implementato nel file `index.js` che imposta le route relative ai tre applicativi `/player` `/author` `/evaluator`. Le funzionalità necessarie, quali upload di file, gestione di storie e di giocatori attivi sono implementate nei file contenuti nella cartella `server`.