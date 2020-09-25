var player_id = null;
var index = null;
var next_index = 0;
var storyJSON = null;
var answer = "";
var isChatOpen = false;
var isHelpPaneOpen = false;
var isTextWindowOpen = false;

$(document).ready(function () {
    $('#score').text('Score: 0');
    blinkNotify('#score');
// richiesta storia
// url_string prende l'url sotto forma di stringa della pagina html e con new URL la trasforma in un'url 
//in modo che si possa accedere ai parametri dell'url url.searchParams.get('id')
    var url_string = window.location.href;
    var url = new URL(url_string);
    var id = url.searchParams.get("id");
// $.ajax è una funzione che si usa per creare connessioni http
//get story by id 
    if (id) {
        $.ajax({
            type: 'GET',
            url: '/stories/' + id,
            success: function (data) {
                storyJSON = data;
                setPlayer(storyJSON);
            },
            error: function (xhr, ajaxOptions, thrownError) {
               
            }
        });
        //Update al secondo di nuovi messaggi oppure chat, risposte a richieste d'aiuto e punteggio
        setInterval(function () {
            if (player_id) {
                if (isChatOpen) {
                    openChat(false);
                } else {
                    check4newMex();
                }
                checkReqHelp();
            }
        }, 1000);

        //Help pane update every 10 seconds
        setInterval(function () {
            if (player_id) {
                if (isHelpPaneOpen)
                    if (!$('#helpPane textarea').val()) {
                        openHelpPane();
                    }
            }
            updateScore();
        }, 10000);
    } else {
        $('#div-grande').text('Non è selezionata nessuna storia');
        $('#div-grande').css({
            'font-size': '5vh',
            'text-align': 'center'
        })
        $('#chat-button').prop('disabled', true);
        $('#help-button').prop('disabled', true);
       
    }
});

//Funzione per inizializzare il file sul server e ricevere l'id associato
// è una funzione che serve a creare una connessione di tipo ajax
// prende i dati della storia setPlayer(data) li manda al server che crea (PUT)
// un file player nuovo e riceve l'id associato al nuovo player
/* si rifa ad una funzione di players.js
identificata dall'url '/players/create_player'*/
function setPlayer(data) {
    $.ajax({
        url: '/players/create_player',
        type: 'PUT',
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: function (id) {
// questo comando serve a memorizzare l'id che è stato inviato dal server
            player_id = id;
            setWindow();
            setCurrentQuest();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            
        }
    });
}
//Make the notification mark blink
 //funzione che fa lampeggiare un elemento tramite #id(selector)
function blinkNotify(selector) {
    var element = $(selector);
    setInterval(function () {
        element.fadeIn(500, function () {
            element.fadeOut(500, function () {
                element.fadeIn(1000);
            });
        });
    }, 2000);
}

// Questa funzione serve a controllare l'eventuale input dell'attività attuale
function checkInput() {
    let answer_data;
    let score = 0;
// is_corrected è una variabile che indica se la risposta è stata valutata oppure no
// se deve ancora essere valutata is_corrected = false
    let is_corrected = true;
    // lista (array) dei componenti delle domande
    let questionComponents = [];
    // indica che la risposta una volta corretta andrà notificata al player
    let up_to_date = true;
    // type indica l'input type dell'attività attuale (testo, foto, numeri)
    let type = storyJSON.activities[index].input_type;
    //next_index non è dichiarata qui come variabile perchè è globale(dichiarata sopra)
			//indice dell'attività successiva,i punti servono ad accedere a dei campi specifici.
			//storyJSONè il contenuto della storia
			//.per accedere ai campi della storia ---> .activities quindi per accedere alle attività 
			// [index] per selezionare l'elemento dell'array in quella posizione
			//.input_type indica il tipo di input dell'attività
    next_index = storyJSON.activities[index].input.next_index;
    //answer vuota nel caso in cui non ci fosse nessun tipo di input e viene riempita nel caso in cui l'input ci sia
    answer = '';
    $('#err-msg').remove();
    // storyJSON (è il file della storia trasformato in un'oggetto (JSON della storia)) . <--- serve per accedere ai campi delle storie
    // 'activities' è un'array [index] accedi all'attività attuale .input_type <--- è un campo dell'oggetto dell'array
    if (type == 'photo') {
        answer = '/public/images/uploads/' + $('#input-immagine')[0].files[0].name;
        if (storyJSON.activities[index].input.evaluation_type == 'evaluator') {
            is_corrected = false;
        }
    }
    else if (type == 'number') {
        answer = $('#input-num').val();
        if (storyJSON.activities[index].input.evaluation_type == 'correct') {
            //Controllo se la risposta data è corretta verificando che 
					//sia compresa in un intervallo di numeri dato come opzione corretta
            storyJSON.activities[index].input.correct_options.forEach(function (option) {
                if (answer >= option.from && answer <= option.to) {
                    score = option.points;
                }
            });
            //Se la risposta è sbagliata
            if (score == 0) {
                if (storyJSON.activities[index].input.wrong_stay) {
                    next_index = index;
                    $('#div-grande').append('<p id="err-msg">' + (storyJSON.activities[index].input.wrong_message || 'Riprova') + '</p>');
                    scrollToBottom('div-grande');
                } else {
                    next_index = (storyJSON.activities[index].input.wrong_next_index || next_index);
                }
            }
            //Evaluation_type == evaluator
        } else if (storyJSON.activities[index].input.evaluation_type == 'evaluator') {
            is_corrected = false;
        }
    }
    else if (type == 'text') {
        answer = $('#input-text').val();
        if (storyJSON.activities[index].input.evaluation_type == 'correct') {
            storyJSON.activities[index].input.correct_options.forEach((option) => {
                if (answer.trim().toLowerCase().replace(' ', '').localeCompare(option.text.trim().toLowerCase().replace(' ', '')) == 0) {
                    score = option.points;
                }
            });
            if (score == 0) {
                if (storyJSON.activities[index].input.wrong_stay) {
                    next_index = index;
                    $('#div-grande').append('<p id="err-msg">' + (storyJSON.activities[index].input.wrong_message || 'Riprova') + '</p>');
                    scrollToBottom('div-grande');
                } else {
                    next_index = (storyJSON.activities[index].input.wrong_next_index || next_index);
                }
            }
        } else if (storyJSON.activities[index].input.evaluation_type == 'evaluator') {
            is_corrected = false;
        }
    }

    //Se per caso la storia e' stata creata male dall'autore che non ha specificato tutti i percorsi saltiamo alla fine direttamente.
    if(next_index === undefined || next_index === null){
        next_index = 1;
    }

    let mission_index = storyJSON.activities[next_index].mission_index;
    let mission_name;
    if (mission_index) { mission_name = storyJSON.missions[mission_index].name; } else { mission_name = (next_index == 1 ? 'Fine' : (index==0 ? 'Inizio' : '')); }

    //Costruisce l'array della domanda posta al player
    storyJSON.activities[index].contents.forEach(function (elem) {
        if (elem.type == 'text') {
            questionComponents.push({
                type: 'text',
                content: elem.text
            });
        }
        if (elem.type == 'video') {
            questionComponents.push({
                type: 'video',
                content: {
                    url: elem.url,
                    descr: elem.description
                }
            });
        }
        if (elem.type == 'image') {
            questionComponents.push({
                type: 'image',
                content: {
                    url: elem.url,
                    descr: elem.description
                }
            });
        }
    });
    up_to_date = is_corrected;

    answer_data = {
        mission_name: mission_name,
        activity_name: storyJSON.activities[next_index].name,
        corrected: is_corrected,
        question: questionComponents,
        input_type: type,
        answer: answer,
        comment: '',
        quest_score: Number(score),
        up_to_date: up_to_date
    };
    sendAnswerToServer(answer_data);
}
//Funzione per mandare il descrittore dell'attività completata al server ed aggiungerlo al file del player
function sendAnswerToServer(answer_data) {
    $.ajax({
        url: '/players/add_answer/player' + player_id,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(answer_data),
        success: function (data) {
            setWindow();
            setCurrentQuest();
            $('#score').text('Score: ' + data.score);
            blinkNotify('#score');
        },
        error: function (xhr, ajaxOptions, thrownError) {
           
        }
    });
}
// Questa funzione serve a impostare la finestra per la prossima attività
function setWindow() {
    $('h1').text(storyJSON.name);
    let mission_index = storyJSON.activities[next_index].mission_index;
    $('#nome-attivita').text(storyJSON.activities[next_index].name);
    if (mission_index != null) {
       $('#nome-missione').text(storyJSON.missions[mission_index].name);
    }
    $('.testo-attivita').empty();
    $('.to_del').remove();
    storyJSON.activities[next_index].contents.forEach(function (elem) {
        if (elem.type == 'text') {
            $('.testo-attivita').append(elem.text + '<br>');
        }
        if (elem.type == 'video') {
            var video = document.createElement('video');
            var source = document.createElement('source');
            source.setAttribute('src', elem.url);
            video.setAttribute('width', '400');
            video.setAttribute('controls', '');
            video.appendChild(source);
            video.setAttribute('class', 'to_del');
            video.setAttribute('alt', elem.description);
            $('.testo-attivita').append(video);
        }
        if (elem.type == 'image') {
            var image = document.createElement('img');
            image.setAttribute('src', elem.url);
            image.setAttribute('alt', elem.description);
            image.setAttribute('width', '400');
            image.setAttribute('class', 'to_del');
            $('.testo-attivita').append(image);
        }
    });
    $('#footer').empty();

    let isSpecial = storyJSON.activities[next_index].special;
    if (!isSpecial) {
        let input_type = storyJSON.activities[next_index].input_type;
        let input = storyJSON.activities[next_index].input;
        if (input_type == 'photo') {
            if (input.style == 'scanner') {
                $('#footer').append($($("#template-scanner").html()));
            } else {
            $('#footer').append('<label for="input-immagine" class="input custom-file-upload">'
                + '<span class="glyphicon glyphicon-cloud-upload"></span> Carica Foto</label >'
                + '<input id="input-immagine" type="file" accept="image/*"/ class="standard-input-img">');
            }
        } else if (input_type == 'number') {
            if(input.style == "LCD") {
                $('#footer').append($($("#template-lcd").html()));
            } else {
                $('#footer').append('<input aria-label="numero di risposta" id="input-num" class="input default-input-num" type="number">');
            }
        } else if (input_type == 'text') {
            if(input.style == "scroll") {
                $('#footer').append($($("#template-scroll").html()));
            } else {
                $('#footer').append(
                    `<div class="inner-addon left-addon">
                        <a aria-hidden="true"id="icona-fullscreen" class="glyphicon glyphicon-fullscreen"></a>
                        <input aria-label="testo di risposta" type="text" autocomplete="off" id="input-text" class="form-control input default-input-text" placeholder="Risposta"/>
                    </div>`);
            }
        }
        $('#footer').append('<button id="bottone-avanti" type="button" class="btn btn-light bottone-next">Avanti</button>');
    } else if (isSpecial == "begin") {
        $('#footer').append('<button id="bottone-avanti" type="button" class="btn btn-light bottone-next">Inizio</button>');
    } else if (isSpecial == "end") {
        $('#footer').append('<button id="bottone-fine" type="button" class="btn btn-light bottone-next">Fine</button>');
    }
}
//Funzione per la notifica della chat
function check4newMex() {
    $.ajax({
        url: 'players/get_chat/player' + player_id,
        success: function (chat) {
            chat = JSON.parse(chat);
            let count=0;
            if (chat.length > 0) {
                chat.forEach((chatLog) => {
                    if (chatLog.seen == false && chatLog.auth == 'Valutatore') {
                        count++;
                    }
                });
                if (count > 0 && !($('#chatDot').length)) {
                    $('#chat-button').append('<div id= "chatDot" class= "dot"></div>');
                    blinkNotify('#chatDot');
                }
            }
        }
    });
}
// funzione per la notifica degli aiuti
function checkReqHelp() {
    $.ajax({
        url: 'players/get_help/player' + player_id,
        success: function (help) {
            help = JSON.parse(help);
            let count = 0;
            if (help.length > 0) {
                help.forEach((helpLog) => {
                    if (!helpLog.to_help && !helpLog.seen) {
                        count++;
                    }
                });
                if (count > 0 && !($('#helpDot').length)) {
                    $('#help-button').append('<div id= "helpDot" class= "dot"></div>');
                    blinkNotify('#helpDot');
                }
            }
        }
    });
}
//Evento per la fine della storia
$(document).on('click', '#bottone-fine', function () {
    $('.testo-attivita').empty();
    $('#nome-missione').empty();
    $('#nome-attivita').empty();
    $('.testo-attivita').append('<p id="final-text">Grazie per aver giocato!</p>');
    $('#bottone-fine').remove();

});
function setCurrentQuest() {
    let date = new Date();
    let h = date.getHours();
    let m = date.getMinutes();
    index = next_index;
    let mission_index = storyJSON.activities[index].mission_index;
    let mission_name = '';
    if (mission_index != null) {
        mission_name = storyJSON.missions[mission_index].name;
    }
    let data = {
        minutes: m,
        hour: h,
        activity: storyJSON.activities[index].name,
        mission: mission_name
    };
    $.ajax({
        url: '/players/set_current_quest/player' + player_id,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function () {},
        error: function (xhr, ajaxOptions, thrownError) {
            
        }
    });
}
//Evento per mettere in fullscreen l'input di testo
$(document).on('click', '#icona-fullscreen', function () {
    //Questo serve a ignorare la pressione del pulsante invio nel caso la finestra di testo sia aperta (isTextWindowOpen)
    isTextWindowOpen = true;
    $('#input-text').attr('disabled', true);
    $('#bottone-avanti').attr('disabled', true);
    $('#window-input-text').remove();
    $('body').append(`<div id="window-input-text"><textarea></textarea><button>Fatto</button></div>`);
    $('#window-input-text > textarea').val($('#input-text').val());
    $('#window-input-text > textarea').focus();
});
//Evento per confermare il testo tramite il pulsante Fatto
$(document).on('click', '#window-input-text > button', function () {
    //Questo serve a ignorare la pressione del pulsante invio nel caso la finestra di testo sia aperta (isTextWindowOpen)
    isTextWindowOpen = false;
    $('#input-text').attr('disabled', false);
    $('#bottone-avanti').attr('disabled', false);
    $('#input-text').val($('#window-input-text > textarea').val().replace('\n', ' '));
    $('#window-input-text').remove();
});
//Evento per cambiare attività
$(document).on('click', '#bottone-avanti', function () {
    if (isInputValid()) {
        if (storyJSON.activities[index].input_type == 'photo') {
            //In caso di success di uploadFile vengono invocate check input e setWindows
            uploadFile($('#input-immagine')[0].files[0]);
        } else {
            checkInput();
        }
    } else {
        //Non accade nulla
    }
});
function isInputValid() {
    let input_type = storyJSON.activities[index].input_type;
    switch (input_type) {
        case 'photo':
            if ($('#input-immagine')[0].files.length == 0)
                return false;
            else return true;
        case 'none':
            return true;
        default:
            if ($('#input-num').val() || ($('#input-text').val()))
                return true;
            else return false;
    }
}
//Evento per andare avanti fra le attività con invio
$(document).on('keypress', function (key) {
    if (key.which == 13) {
        if (!isChatOpen && !isTextWindowOpen && !isHelpPaneOpen) {
            $('#bottone-avanti').click();
        }
    }
});
//Evento per inviare il messaggio in chat con invio
$(document).on('keydown', '#new_msg_text', function (event) {
    if (event.which == 13) {
        event.preventDefault();
        $('#send-msg').click();
    }
});
//Evento per mostrare una preview del file selezionato
$(document).on('change', '.standard-input-img', function () {
    $('#preview').remove();
    let img = document.createElement('img');
    img.setAttribute('alt','Your selected image');
    img.setAttribute('src', (window.URL ? URL : webkitURL).createObjectURL($('#input-immagine')[0].files[0]));
    img.setAttribute('id', 'preview');
    document.getElementById('footer').insertBefore(img, document.getElementById('bottone-avanti'));
    $('.custom-file-upload').css({
        "border-top-right-radius": "0",
        "border-bottom-right-radius": "0",
        "margin-right": "0",
    });
});

function uploadFile(file) {
    let fd = new FormData();
    fd.append(file.name, file);
    let path = '/players/upload_photo/' + 'player' + player_id;
    $.ajax({
        accepts: 'application/json',
        url: path,
        data: fd,
        type: 'POST',
        contentType: false,
        processData: false,
        success: function (data) {
            answer = data.url;
            checkInput();
        },
        error: function (xhr, ajaxOptions, thrownError) {
           
        }
    });
}


/**** Funzioni per la chat ****/
//Sets the layout of the chat messages
function setChatView(data) {
    $('#chat-msgs').empty();
    document.getElementById("chat").style.display = "block";
    data.chat.forEach((chatlog) => {
        if ((chatlog.auth.localeCompare("Valutatore")) != 0) {
            $('#chat-msgs').append('<div class="row msg_container base_sent"><div class="col-md-10 col-xs-10"><div class="messages sent-msgs msg_sent"><p>' +
             chatlog.text + '</p><time>Tu - ' + chatlog.hour + ':' + chatlog.mins + '</time></div></div></div>');
        } else {
            $('#chat-msgs').append('<div class="row msg_container base_receive <div class="col-md-10 col-xs-10"><div class="messages msg_receive"><p>' +
             chatlog.text + '</p> <time>' + (data.username ? data.username : ('Player ' + data.id)) + ' - ' + chatlog.hour + ':' + chatlog.mins + '</time></div></div></div>');
        }
    });
}

//Open the pop-up chat with the selected player
function openChat(set_focus) {
    isChatOpen = true;
    if (isHelpPaneOpen) {
        closeHelpPane();
    }
    $.ajax({
        url: '/players/player' + player_id,
        success: function (data) {
            setChatView(data);
            markAsSeen('player' + player_id);
            if(set_focus) {                                
                scrollToBottom('chat-msgs');
                $('#new_msg_text').focus();
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
        }
    });
}
//Close the pop-up chat
function closeChat() {
    isChatOpen = false;
    document.getElementById("chat").style.display = "none";
}
//Send chat message to the server
function sendMsg() {
    var str = $("#new_msg_text").val();
    $('#new_msg_text').val('');
    if (str) {
        let date = new Date();
        var hrs = String(date.getHours());
        var min = date.getMinutes();
        min = (min < 10 ? ("0" + String(min)) : (String(min)));
        var msg = {
            hour: hrs,
            mins: min,
            text: str,
            auth: "player" + player_id,
            seen: false
        };
        let id = 'player' + player_id;
        $.ajax({
            url: '/players/send_msg/' + id,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(msg),

            success: function (data) {
                openChat(false);
                $('#new_msg_text').focus();
            },
            error: function (xhr, ajaxOptions, thrownError) {
               
            }
        });
    }
}
//Change the state of the current chat last messages to 'seen'
function markAsSeen(id) {
    $.ajax({
        url: '/players/mark_as_seen/' + id,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ author: 'player'+player_id}),
        success: function () {
        },
        error: function (xhr, ajaxOptions, thrownError) {
       
        }
    });
}
//Scroll to the last received message in the current chat
function scrollToBottom(id) {
    let chatVBox = document.getElementById(id);
    chatVBox.scrollTop = chatVBox.scrollHeight;
}
//Event to open chat with selected player
$(document).on('click', '#chat-button', function() {
    openChat(true);
});
/* Funzioni per HELP */
//Evento per il pulsante help
$(document).on('click', '#help-button', function () {
    openHelpPane();
});

//Connessione per aprire la finestra di aiuto
function openHelpPane() {
     if (isChatOpen) {
        closeChat();
    }
    $.ajax({
        url: '/players/get_help/player' + player_id,
        success: function (help) {
            isHelpPaneOpen = true;
            setHelpPane(JSON.parse(help));
            markHelpAsSeen();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            
        }
    });
}
//Connessione per segnare come lette le risposte d'aiuto
function markHelpAsSeen() {
    $.ajax({
        url: '/players/mark_help_as_seen/player' + player_id,
        type: 'POST',
        success: function () {
            $('#chatDot').remove();
        },
        error: function (xhr, ajaxOptions, thrownError) {
           
        }
    });
}
//Preparazione e visualizzazione della finestra degli aiuti
function setHelpPane(help) {
    $("#helpPane").css("display", "block");   
    $("#old-help-req").empty();
    if (help.length > 0) {
        help.forEach((req) => {
            $('#old-help-req').append('<hr><div><p><b>Missione</b>: ' + req.mission_name
                + '<br><b>Attività</b>: ' + req.activity_name
                + '<br><b>Domanda</b>: <p class="help-question">' + req.question
                + '</p><br><b>Risposta</b>: <p class="help-answer">'
                + (req.answer || '<i>Ancora nessuna risposta</i>') + '</p></div>');
        });
    } else {
        $('#old-help-req').append('<p id="no-help-msg">Non hai effettuato richieste</p>');
    }
}

function closeHelpPane() {
    isHelpPaneOpen = false;
    $('#helpPane').css("display", "none");
}

//Evento per inviare la richiesta d'aiuto collegato al bottone
$(document).on('click', '#send-new-req', function () {
    let question = ($('#helpPane textarea').val())
    if (question) {
        let mission_index = storyJSON.activities[next_index].mission_index;
        let mission_name;
        if (mission_index) {
            mission_name = storyJSON.missions[mission_index].name;
        } else {
            mission_name = (next_index == 1 ? 'Fine' : (index == 0 ? 'Inizio' : ''));
        }
        sendHelpReq({
            mission_name: $('#nome-missione').text().trim() || (index == 0 ? 'Inizio' : (index == 1 ? 'Fine' : ' --- ')),
            activity_name: $('#nome-attivita').text(),
            question: question,
            answer: "",
            to_help: true,
            seen: false
        });
    } else {
        $('#helpPane textarea').attr('placeholder', "Devi riempire questo campo per procedere con la richiesta d'aiuto");
    }
});
//Connessione per inviare una nuova richiesta d'aiuto
function sendHelpReq(data) {
    $.ajax({
        url: '/players/send_help_req/player' + player_id,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function () {
            $('#help-button').click();
        },
        error: function (xhr, ajaxOptions, thrownError) {
           
        }
    });
}
//Richiede informazioni sulle correzioni effettuati per verificare se ci sono punteggi da notificare
function updateScore() {
    $.ajax({
        url: '/players/update_score/player' + player_id,
        success: function (new_score) {
            if (new_score) {
                $('body').append('<div class="notification-bar"><h4>'
                    + new_score.mission + '</h4><p class="details-new-score">Nell'+"'"+'attività: "'
                    + new_score.activity + '" hai conseguito: <span class="'
                    + (new_score.added > 0 ? 'score-notif-text-pos' : 'score-notif-text-neg')
                    + '">' + new_score.added + '</span> punti</div>');
                $('#score').text('Score: ' + new_score.score);
                blinkNotify('#score');
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            
        }
    });
}
//mostra un messaggio di conferma se ricarichi la pagina
$(window).bind('beforeunload', function () {
        return 'perderai i tuoi progressi, vuoi confermare?';
})
