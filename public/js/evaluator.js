/*TODO:
PLAYER
- Richiesta e risposta d'Aiuto diverso da chat
*/

var playersLength = 0;
var new_msgLength = 0;
var currentChatPlayerId = null;
var currentCorrectionPlayerId = null;
var currentHelpPlayerId = null;
var currentUserTabId = null;
var classificationOpen = false;
var downloadsOpen = false;
/*The displayed elements can be:
- Correction pane
- History pane
- Help Pane
- Classification
- Downloads Window
*/

//APPLICATION UPDATES FUNCTIONS
//Chat update every second 
setInterval(function () {
    if (currentChatPlayerId) {
        openChat(currentChatPlayerId);
    }
}, 1000);
//User tab or Classification update every minute
setInterval(function () {
    if (currentUserTabId) {
        openUserTab(currentUserTabId);
    }
    if (classificationOpen) {
        openClassification();
    }
    updateAllData();
}, 60000);
//Correction pane and Help pane updated every 5 minutes if no input is given
setInterval(function () {
    if (currentCorrectionPlayerId) {
        let i = 0;
        let update = true;
        let label1;
        let label2;
        //Per ogni input presente
        do {
            label1 = $('#score-label-' + i);
            label2 = $('#comment-label-' + i);

            let input1 = $('#' + label1.attr('for'));
            let input2 = $('#' + label2.attr('for'));
            //Hanno un valore scritto?
            let in1 = input1.val();
            let in2 = input2.val();
            if (in1 && in1.length > 0 ||
                in2 && in2.length > 0) {
                update = false;
                break;
            }
            i++
        } while (label1.length > 0 && label2.length > 0);
        if (update) {
            openCorrectionPane(currentCorrectionPlayerId);
        }
    }
    if (currentHelpPlayerId) {
        
    }
}, /*5 * 60000*/ 5000);

//GENERIC FUNCTIONS
//Scroll to the last received message in the current chat
function scrollToBottom() {
    let chatVBox = document.getElementById('chat-msgs');
    chatVBox.scrollTop = chatVBox.scrollHeight;
}
//Apre la tab con le info utente
function setUserTab(data) {
    let name = (data.username ? data.username : 'Player ' + data.id);
    let date = new Date();
    let elapsed_mins = (((date.getHours() * 60) + date.getMinutes()) -( (data.current_quest_start_timestamp[0] * 60) + data.current_quest_start_timestamp[1]))/60;
    let hours = Math.floor(elapsed_mins);
    //TODO: Fix negative minutes for days distance
    let minutes = (((elapsed_mins % 1) * 60).toFixed() < 0 ? 0 : ((elapsed_mins % 1) * 60).toFixed());
    minutes = (minutes < 10 ? '0' + minutes : minutes);
    let unread = 0;
    data.chat.forEach((log => { if (!log.seen) unread++; }));
    let nextID = ((data.id+1) > playersLength ? '' : 'player'+Number(data.id+1));
    let prevID = ((data.id - 1) < 1 ? '' : 'player' + Number(data.id - 1));
    
    
    $('#user-space').empty();
    $('#user-space').append(  '<a onclick="closeUserTab()"><span class="glyphicon glyphicon-remove icon-close"></span></a>'
        + '<a id="prevUser" class="arrows_tab" data-toggle="tooltip" data-placement="top" title="Scheda utente precedente"><span class="glyphicon glyphicon-arrow-left" id="prev_tab"></span></a>'
        + '<a id="nextUser" class="arrows_tab" data-toggle="tooltip" data-placement="top" title="Scheda utente successivo"><span class="glyphicon glyphicon-arrow-right" id="next_tab"></span></a>'
        + '<div id = "user-space-input" class="input-group input-group-lg inline-info">'
        + '<div class="input-group-prepend" id="playername-container">'
        + '<div class="input-group-text" id="playername-label">Nome del Player</div>'
        + '</div>'
        + '<input value="' + name + '" name="player' + data.id + '" id="rename-field" type="text" class="form-control" aria-label="Sizing example input" aria-describedby="inputGroup-sizing-lg">'
        + '<button type="button" id="rename-button" class="btn btn-primary btn-lg">Rinomina</button>'
        + '</div>'
        + '<div class="block-info">'
        + '<p>Punteggio: ' + data.score + '</p>'
        + '</div>'
        + '<div class="block-info">'
        + '<p id="time-count">Missione: "' + (data.current_mission || 'nessuna') + '",  Attività: "' + (data.current_activity || 'nessuna')+ '",  da ' + (hours > 0 ? (hours + ' : '  + minutes + ' ore ') : (minutes + ' minuti')) + '</span></p>'
        + '</div>'
        + '<div class="block-info">'
        + '<p>ID: player' + data.id + '</p>'
        + '</div>'
        + '</div>'
        + '<div class="block-info">'
        + '<button type="button" id="history-button" name="player' + data.id + '" class="btn btn-primary btn-lg">Storico</button>'
        + '</div>'
        + '<div id ="user-chat-div">'
        + '<button type="button" id="chat-button" class="btn btn-primary btn-lg">Chat</button>'
        + '</div>');
    if (hours > 0 || minutes > 15) {
        $('#time-count').append('<span class="glyphicon glyphicon-time" id="timeNotification">');
        blinkNotify('#timeNotification');
    }
    if (unread > 0) {
        $('#user-chat-div').append('<label for="chat-button"><span class="badge badge-secondary" id="chatNotification">' + unread + ' Nuovi Messaggi</span></label>');
        blinkNotify('#chatNotification');
    }
    document.getElementById('user-pane').style.display = 'block';
    if (nextID) { $('#nextUser').click(() => { openUserTab(nextID) }); }
    if (prevID) { $('#prevUser').click(() => { openUserTab(prevID) }); }
}
//Chiude la tab con le info utente
function closeUserTab() {
    document.getElementById('user-pane').style.display = 'none';
    currentUserTabId = null;
}

//Sets layout of history panel
function setHistory(data) {
    classificationOpen = false;
    currentCorrectionPlayerId = null;
    $('#main-placeholder').empty();
    let header = '<div class="panel-heading" id="history-header">'
        + (data.username ? data.username : 'Player ' + data.id) + ' - Storico'
        + '<a id="user-info-tab-player' + data.id + '" class="user-info-tab btn btn-info btn-sm"><span class="glyphicon glyphicon-info-sign"></span></a>'
        + '</div><div class="panel-body" id="history-pane">'
        + '<table class="history-table table table-sm"><thead><tr><th id="table-head" colspan="5">'+data.story_name+' - '+data.score+ ' punti</th></tr><tr>'
        + '<th scope="col">Domanda</th>'
        + '<th scope="col">Risposta</th>'
        + '<th scope="col">Commento</th>'
        + '<th scope="col">Voto</th>'
        + '</tr>'
        + '</thead><tbody>';
    let body='';
    data.quest_list.forEach((quest) => {
        let question_content = '';
        quest.question.forEach((elem) => {
            switch (elem.type) {
                case 'image':
                    question_content += 'Immagine con url: "' + elem.content.url + '".\n';
                    break;
                case 'text':
                    question_content += elem.content + '\n';
                    break;
                case 'video':
                    question_content += 'Video con url: "' + elem.content.url + '".\n';
                    break;
            }
        });
        let answer_content = '';
        if (quest.input_type == 'photo') { answer_content = '<img class="preview-img" src="' + quest.answer + '">'; } else { answer_content=quest.answer }
        let row = '<tr><td>' + question_content + '</td>'
        + '<td>' + (answer_content || 'Nessuna') + '</td>'
        + '<td>' + quest.comment + '</td>'
        + '<td>' + (quest.quest_score ||(quest.corrected ? '0' : 'Non valutata')) + '</td></tr>';
        body += row;
    });
    body+='</tbody></table></div>';
    $('#main-placeholder').append(header + body);
}

//Sets layout of correction panel
function setCorrectionPane(data) {
    classificationOpen = false;
    currentHelpPlayerId = null; 
    $('#main-placeholder').empty();
    let header = '<div class="panel-heading" id="correction-header">'
        + (data.username ? data.username : 'Player ' + data.id) + ' - ' + data.story_name
        + '<a id="user-info-tab-player' +data.id+ '" class="user-info-tab btn btn-info btn-sm"><span class="glyphicon glyphicon-info-sign"></span></a>'
        + '</div><div class="panel-body" id="correction-pane">';

    $('#variable-answer').css({ 'height': '10vh' });
    let body = "";
    let imgs = [];
    let has_img = [];
    if (data.pending_count > 0) {
        data.quest_list.forEach((quest) => {
            let quest_index = data.quest_list.indexOf(quest);
            let ordinary_index = 0;
            if (!quest.corrected) {
                let pane;
                //Attach header:
                let quest_header = '<p class="quest_header">Missione: ' + quest.mission_name + '<br>Attività: ' + quest.activity_name + '</p>';
                //Attach question:
                let question_content = '';
                quest.question.forEach((elem) => {
                    switch (elem.type) {
                        case 'image':
                            question_content += 'Immagine con url: "' + elem.content.url + '".\n';
                            break;
                        case 'text':
                            question_content += elem.content + '\n';
                            break;
                        case 'video':
                            question_content += 'Video con url: "' + elem.content.url + '".\n';
                            break;
                    }
                });
                let quest_widget = '<div class="description-div">'
                    + '<div class="inline-divs"> Domanda :'
                    + '<a id="plus_min_question' + quest_index + '" class="plus_min btn btn-info btn-sm"><span class="glyphicon glyphicon-minus"></span></a>'
                    + '</div>'
                    + '<div class="inline-divs" id="question' + quest_index + '">'
                    + '<p>' + question_content + '</p>'
                    + '</div>'
                    + '<div class="inline-divs">'
                    + '</div>'
                    + '</div>';
                //TODOOOO il main panel si abbassa agli update
                //TODOOOOOOOO verificare che le notifiche score funzionino
                //Define answer html
                let answer_content;
                if (quest.input_type == 'photo') {
                    has_img[quest_index] = true;
                    let img = document.createElement('img');
                    img.setAttribute('id', 'img' + quest_index);
                    img.setAttribute('name', 'answer' + quest_index);
                    img.setAttribute('class', 'preview-img-correction');
                    img.src = quest.answer;
                    img.onload = function () {
                        //Event to resize container of imgs in correction pane 
                        var h = $(this).height();
                        var w = $(this).width();
                        let name = $(this).attr('name');
                        $(this).css('width', $('#' + name).width());
                        $(this).css('height', 'auto');
                        $('#' + name).css('height', $(this).height());
                    };
                    imgs[quest_index] = img;
                } else {
                    answer_content = quest.answer;
                }
                //Attach answer
                let answer_widget = '<div class="description-div">'
                    + '<div class="inline-divs">'
                    + ' Risposta :'
                    + '<a id="plus_min_answer' + quest_index + '" class="plus_min btn btn-info btn-sm"><span class="glyphicon glyphicon-minus"></span></a>'
                    + '</div>'
                    + '<div class="inline-divs" id="answer' + quest_index + '">'
                    + '<p>'+ (answer_content || '') + '</p>'
                    + '</div>'
                    + '<div class="inline-divs">'
                    + '</div>'
                    + '</div>';
                //Attach corretion input
                let valu_widget = '<div class="valutation-input">'
                    + '<form class="form-correction">'
                    + '<div class="form-group row">'
                    + '<div class="col-12">'
                    + '<div class="col-sm-6 input1" id="input1-' + quest_index + '"><label id = "score-label-' + ordinary_index + '" for="score-input-' + quest_index + '">Attribuisci un punteggio</label><br>'
                    + '<input class="form-control number-input" type="number" id="score-input-' + quest_index + '"></div>'
                    + '<div class="col-sm-6 input2" id="input2-' + quest_index + '"><label id = "comment-label-' + ordinary_index + '" for="comment-input-' + quest_index + '">Aggiungi un commento</label><br>'
                    + '<textarea class="comment-input" id="comment-input-' + quest_index + '" placeholder="Questo commento sarà visibile soltanto a te"></textarea></div>'
                    + '</div>'
                    + '</div>'
                    + '<button type="button" name="' + quest_index + '"class="send-correction btn btn-outline-primary">Invio <span class="glyphicon glyphicon-ok"></span></button>'
                    + '</form>'
                    + '</div>'
                    + '<hr>';
                pane = '<div class="correction-divider">' + quest_header + quest_widget + answer_widget + valu_widget + '</div>';
                body += pane;
                ordinary_index++;
            }
        });
    } else {
        body+='<p class="quest_header">Non ci sono risposte in attesa di valutazione per questo giocatore</p>';
    }
    $('#main-placeholder').append(header + body);
    has_img.forEach((img_el) => {
        let index = has_img.indexOf(img_el);
        if (img_el) {
            document.getElementById('answer' + index).appendChild(imgs[index]);
        }
    });
    $('#' + $('#score-label-0').attr('for')).focus();
}
//Set help pane 
function setHelpPane(data) {
    let body = '';
    $('#main-placeholder').empty();
    let header = '<div class="panel-heading" id="correction-header">'
        + data.name + ' - ' + data.story_name
        + '<a id="user-info-tab-player' + data.id + '" class="user-info-tab btn btn-info btn-sm"><span class="glyphicon glyphicon-info-sign"></span></a>'
        + '</div><div class="panel-body" id="help-pane">';
    data.help.forEach((help_req) => {
        if (help_req.to_help) {
            let i = data.help.indexOf(help_req);
            let quest_header = '<p class="quest_header">Missione: ' + help_req.mission_name + '<br>Attività: ' + help_req.activity_name + '</p>';
            let quest_widget = '<div class="description-div">'
                + "<div class='inline-divs'> Richiesta d'aiuto :"
                + '</div>'
                + '<div class="inline-divs" id="help-question' + i + '">'
                + '<p>' + help_req.question + '</p>'
                + '</div>'
                + '<div class="inline-divs">'
                + '</div>'
                + '</div>';
            let valu_widget = '<div class="valutation-input">'
                + '<form class="form-correction">'
                + '<div class="form-group row">'
                + '<div class="col-12 input2" id="input1-' + i + '">'
                + '<label for="comment-input-' + i + '">Rispondi</label><br>'
                + '<textarea class="comment-input help-comment" id="help-comment-input-' + i + '" placeholder="Scrivi qui la tua risposta"></textarea></div>'
                + '</div>'
                + '<button type="button" name="' + i + '"class="send-help btn btn-outline-primary">Invio <span class="glyphicon glyphicon-ok"></span></button>'
                + '</form>'
                + '</div>'
                + '<hr>';
            pane = '<div class="correction-divider">' + quest_header + quest_widget + valu_widget + '</div>';
            body += pane;
        }
    });
    if (!body) {
        body += '<p class="quest_header">Non ci sono risposte in attesa di valutazione per questo giocatore</p>';
    }
    $('#main-placeholder').append(header + body);
}
//Event to submit the answer to the help required
$(document).on('click', '.send-help', function (event) {
    let helpIndex = event.currentTarget.getAttribute('name');
    let helpAnswer = $('#help-comment-input-' + helpIndex).val();
    if (helpAnswer) {
        let helpData= { answer: helpAnswer, index: helpIndex };
        submitHelpAnswer(helpData);
    } else {
        $('#no-score').remove();
        $('#input1-' + helpIndex).append('<p id="no-score"class="unexpected-str">*Questo campo è obbligatorio</p>');
        $('#help-comment-input-' + helpIndex).focus();
    }
});

//Close the pop-up chat
function closeChat() {
    document.getElementById("chat").style.display = "none";
    currentChatPlayerId = null;
}
//Sets the layout of the chat messages
function setChatView(data) {
    $('#chat-user').empty();
    $('#chat-msgs').empty();
    currentChatPlayerId = 'player' + data.id;
    document.getElementById("chat").style.display = "block";
    scrollToBottom();

    $('#chat-user').append('<div class="glyphicon glyphicon-comment"></div><p id="chat-title">' +(data.username ? data.username : ('Player '+ data.id))+'</p>');
    data.chat.forEach((chatlog) => {
        if((chatlog.auth.localeCompare("Valutatore"))==0)
        {
            $('#chat-msgs').append('<div class="row msg_container base_sent"><div class="col-md-10 col-xs-10"><div class="messages sent-msgs msg_sent"><p>' +
             chatlog.text + '</p><time>Tu - ' + chatlog.hour + ':' + chatlog.mins + '</time></div></div></div>');
        } else {
            $('#chat-msgs').append('<div class="row msg_container base_receive <div class="col-md-10 col-xs-10"><div class="messages msg_receive"><p>' +
             chatlog.text + '</p> <time>' + (data.username ? data.username : ('Player ' + data.id)) + ' - ' + chatlog.hour + ':' + chatlog.mins + '</time></div></div></div>');
        }
    });
}


//Connection to get the players data and update for the navbar dropdown lists and notifications
function updateAllData() {
    $.ajax({
        accepts: 'application/json',
        url: '/players',
        success: function (data) {
            //Rimuove gli elementi dai dropdown
            $('#playersDropdown').empty();
            $('#new_msgDropdown').empty();
            $('#helpDropdown').empty();

            new_msgLength = 0;
            playersLength = 0;

            $('#new_msgNotification').remove();
            $('#navHelpNotification').remove();
            $('#navTimeNotification').remove();

            data.forEach(setPlayerList);
            setDownloadsWindow();

            if (playersLength == 0) {
                $('#playersDropdown').append('<a class="dropdown-item">Non ci sono chat disponibili</a>');
            }
            if (new_msgLength == 0) {
                $('#new_msgDropdown').append('<a class="dropdown-item">Non ci sono nuovi messaggi</a>');
            }
            setDownloadsWindow(); 
        },
        error: function (xhr, ajaxOptions, thrownError) {            
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}
//Fill the lists of player avaiable for conversation and in need for help
function setPlayerList(data) {
    let name = (data.username ? data.username : "Player " + data.id);
    let to_notify = false;
    $('#dot-space').empty();
    $('#playersDropdown').append('<a class="dropdown-item player-list-el close-on-click" id="player' + data.id + '">' + name + '</a>');
    playersLength++;
    if (data.too_long) {
        //Un dot per ogni player e uno per il bottone collapse
        $('#navTimeNotification').remove();
        $('#playerDropdownButton').append('<div class="glyphicon glyphicon-time color" id="navTimeNotification"></div>');
        $('#player' + data.id).append('<div class="negative-dot dot"></div>');
        blinkNotify('#navTimeNotification');
        to_notify = true;
    }

    if (data.urgent) {
        new_msgLength++;
        $('#new_msgNotification').remove();
        $('#new_msgDropdownButton').append('<div class="badge badge-secondary" id="new_msgNotification">' + new_msgLength + ' new</div>');
        $('#new_msgDropdown').append('<a class="dropdown-item new_msg-list-el close-on-click" id="new_msg-player' + data.id + '">' + name + '</a>');
        blinkNotify('#new_msgNotification');
        to_notify = true;
    }

    if (data.to_help) {
        $('#navHelpNotification').remove();
        $('#helpDropdown').append('<a class="dropdown-item help-list-el close-on-click" id="help-player' + data.id + '">' + name + '</a>');
        $('#helpDropdownButton').append('<div class="glyphicon glyphicon-flag" id="navHelpNotification"></div>');
        blinkNotify('#navHelpNotification');
        to_notify = true;
    }

    if (to_notify) { $('#dot-space').append('<div id="dot" class="dot"></div>'); blinkNotify('#dot');}
   
}
//Make the notification mark blink
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
//Add waiting player on the sidebar
function addPendingPlayer(data) {
    let name = (data.username ? data.username : 'Player '+data.id);
    $('#correction-list').append('<a class="waiting-player list-group-item list-group-item-action" data-toggle="list" role="tab" id="sidebar-player-'+data.id+'">' + name + '</a>');
}
//Sets the layout of the classification
function setClassification(data) {
    $('#main-placeholder').empty();
    classificationOpen = true;
    currentHelpPlayerId = null;
    currentCorrectionPlayerId = null;
    let header = '<div class="panel-heading" id="history-header">'
        + 'Classifica'
        + '</div><div class="panel-body" id="classification-pane">'
        + '<table id="classification-table" class="table table-sm"><thead><tr>'
        + '<th scope="col">ID</th>'
        + '<th scope="col">Nome</th>'
        + '<th scope="col">Punteggio</th>'
        + '</tr>'
        + '</thead><tbody>';
    let body = '';
    data.forEach((player) => {
        let row = '<tr><td>player' + player.id + '</td>'
        + '<td>' + player.username + '</td>'
        + '<td>' + player.score + '</td></tr>';
        body += row;
    });
    body += '</tbody></table></div>';
    $('#main-placeholder').append(header + body);
    sort();
}
//Function to sort the classification
function sort() {
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("classification-table");
    switching = true;
      while (switching) {
        switching = false;
        rows = table.rows;
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            x = rows[i].getElementsByTagName("td")[2];
            y = rows[i + 1].getElementsByTagName("td")[2];
            if (Number(x.innerHTML) < Number(y.innerHTML)) {
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
}

//Prepare the download window
function setDownloadsWindow() {
    let children = Array.from($('#playersDropdown').children());
    children.forEach((player) => {
        let id = player.id;
        if (!$('#checkbox-' + id).length) {
            let input = document.createElement('input');
            input.setAttribute('value', id);
            input.setAttribute('class', 'player-download');
            input.setAttribute('type', 'checkbox');
            input.setAttribute('id', 'checkbox-' + id);

            let label = document.createElement('label');
            label.setAttribute('for', id + '-checkbox');
            label.textContent = player.text;

            let li = document.createElement('li');
            li.setAttribute('name', id);
            li.append(input, label);
            li.setAttribute('type', 'none');
            $('#player-checkbox-list').append(li);
        }
    });
    /*TODO: recuperare i checkbox singolarmente*/
    //If select all was selected then all the checkboxes became selected  
    if ($('#selectAllPlayersCheckbox').prop('checked')) {
        $('.player-download').each(function () {
            this.checked = true;
        });
    }
}
//Open download window
function openDownloads() {
    downloadsOpen = true;
    if (currentUserTabId) { closeUserTab(); }

    $('#downloads-window').css({ 'display': 'block' });
}
//Close download window
function closeDownloads() {
    downloadsOpen = false;
    $('#downloads-window').css({ 'display': 'none' });
}

//AJAX CONNECTIONS

//POST 
//Rename player on server
function renamePlayer(id, str) {
    $.ajax({
        url: '/rename_player/' + id,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({username : str}),
        success:function(){
            updateAllData();
            setPendingCorrectionList();
            setDownloadsWindow();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
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
            auth: "Valutatore",
            seen: false
        };
        let id = currentChatPlayerId;
        $.ajax({
            url: '/players/' + id,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(msg),

            success: function (data) {
                openChat(id);
                $('#new_msg_text').focus();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert(xhr.status + ' - ' + thrownError);
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
        data: JSON.stringify({author:'evaluator'}),
        success: function () {
            updateAllData();
            $('#chatNotification').remove();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}
//Connection to submit the correction to the server
function submitCorrection(data) {
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: "/submit_correction/" + currentCorrectionPlayerId,
        data: JSON.stringify(data),
        success: function (data) {
            //In caso di successo riceve i dati del player aggiornati
            setCorrectionPane(data);
            setPendingCorrectionList();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}
//Send answer for help to the server
function submitHelpAnswer(helpData) {
    $.ajax({
        url: '/players/answer_help_request/' + currentHelpPlayerId,
        contentType: "application/json",
        type: 'POST',
        data: JSON.stringify(helpData),
        success: function (data) {
            setHelpPane(data);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}
//GET
//Get story by ID
/*INUTILE
function getStory(id) {
    $.ajax({
        url: "/stories/story" + id,
        contentType: 'application/json',
        success: function (data) {

        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}*/
//Download Classification
function downloadClassification() {
    $.ajax({
        url: '/players/downloads/classification',
        success: function (data) {
            let html = '<body><h1>Classifica</h1><table><thead><tr><th scope="col">ID</th>'
            + '<th scope="col">Nome</th>'
            + '<th scope="col">Punteggio</th></tr></thead><tbody>';
            JSON.parse(data).forEach((player) => {
                html = html + '<tr><td>player' + player.id + '</td><td>' + (player.username || '---') + '</td><td>' + player.score + '</td></tr>';
            });
            html = html + '</tbody></table></body>';
            let nodes = new DOMParser().parseFromString(html, "text/xml");
            let doc = new jsPDF();
            doc.fromHTML(html, 30, 15);
            doc.save('classification.pdf');
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}
//Function to download all players stats
function downloadAllPlayers() {
    $.ajax({
        url: '/players/downloads/all',
        success: function (data) {
            let players = JSON.parse(data);
            players.forEach((player) => {
                download(player);
            });
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}
//Download Player history 
function downloadPlayer(id) {
    $.ajax({
        url: '/players/downloads/' + id,
        success: function (data) {
            let player = JSON.parse(data);
            download(player);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}
//Download del player tramite JSON
function download(player) {
    let images = [];
    let i = 1;
    let pdf = new jsPDF();
    pdf.setFontSize(26);
    pdf.text(pdf.internal.pageSize.width / 2, 20, player.story_name, 'center' );
    pdf.setFontSize(16);
    pdf.text(pdf.internal.pageSize.width / 2, 40, 'ID player: ' + player.id + ' - Nome Player: ' + (player.username || 'Nessuno') + ' - Punteggio Finale: ' + player.score, 'center');
  
    let table_body = [];
    player.quest_list.forEach((quest) => {
        let question_content = '';
        quest.question.forEach((elem) => {
            switch (elem.type) {
                case 'image':
                    question_content += '\nImmagine con url ' + elem.content.url +'".' + (elem.content.descr ? '.\nDescrizione: "' + elem.content.descr + '"\n' : '\n');
                    break;
                case 'text':
                    question_content += elem.content + '\n';
                    break;
                case 'video':
                    question_content += '\nVideo con url "' + elem.content.url + '".' + (elem.content.descr ? '.\nDescrizione: "' + elem.content.descr + '"\n' : '\n');
                    break;
            }
        });
        let answer;
        if (quest.input_type=='photo') {
            images.push({
                url: quest.answer,
                index: i,
                loaded: false,
                y:0
            });
            answer = "*Immagine n° " + i;
            i++;
        } else {
            answer = quest.answer;
        }
        table_body.push([quest.mission_name, quest.activity_name, question_content, answer, quest.comment, quest.quest_score]);
    });
    //Autotable dei dati del player      
    pdf.autoTable({
        head: [['Missione', 'Attività', 'Domanda', 'Risposta', 'Commento', 'Punteggio']],
        body: table_body,
        startY: pdf.pageCount > 1? pdf.autoTableEndPosY() + 20 : 50,
        margin: { left:10, right:10 }
    });
    
    //Aggiunta immagini
    let finalY = 10;
    var pageHeight = pdf.internal.pageSize.height;
    pdf.addPage();
    pdf.setFontSize(26);
    pdf.text(pdf.internal.pageSize.width / 2, finalY, 'Legenda delle immagini', 'center');
    pdf.setFontSize(16)
    finalY += 10;
    images.forEach((img_el) => {
        img_el.y = finalY;
        var img = new Image();
        img.onload = function () {
            img_el.loaded = true;
            let base64url = getDataUrl(img);
            if (img_el.y + 70 > pageHeight) { pdf.addPage(); img_el.y = 10; finalY = 10; }
            pdf.text(30, img_el.y + 35, 'Immagine n°' + img_el.index);
            if (base64url) {
                pdf.addImage(base64url, 90, img_el.y, 70, 70);
            } else {
                pdf.text(10, finalY, 'Non è stato possibile caricare il file.');
            }
            let save = true;
            images.forEach((img_el_check) =>{
                console.log(img_el_check.loaded);
                if (img_el_check.loaded == false) {
                    save = false;
                }
            });
            if (save) { pdf.save((player.username || 'player' + player.id) + '.pdf'); }
        }
        img.src = img_el.url;
        console.log('-->' + img.src + '<--');
        finalY += 80;
    });
    
}
//Get base 64 url of images for the download
function getDataUrl(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    var path = img.src;
    var index = path.lastIndexOf("/") + 1;
    var filename = path.substr(index);
    let ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
        case 'jpg':
        case 'jpeg':
            return canvas.toDataURL('image/jpeg');
        case 'png':
            return canvas.toDataURL('image/png');
        default:
            return null;
    }
}
//Richiesta al server dei file con richieste di correzione in attesa
function setPendingCorrectionList() {
    $.ajax({
        accepts: 'application/json',
        url: '/pending_answers',
        success: function (data) {
            $('#correction-list').empty();
            $('#correction-list').append(' <a class="waiting-player list-group-item list-group-item-action disabled" data-toggle="list"  role="tab"><p>Risposte da correggere</p></a>');
            data.forEach(addPendingPlayer);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}
//Request data for correction pane of selected player
function openCorrectionPane(id) {
    let real_id = id.replace('sidebar-player-', 'player');
    $.ajax({
        accepts: 'application/json',
        url: '/pending_answers/' + real_id,
        success: function (data) {
            setCorrectionPane(data);
            currentCorrectionPlayerId = real_id;
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}
//Request the array of help for the specified player
function openHelpPane(player) {
    $.ajax({
        accepts: 'application/json',
        url: '/players/get_help_request/' + player,
        success: function (data) {
            setHelpPane(JSON.parse(data));
            currentHelpPlayerId = player;
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}
//Open the History pane for selected player
function openHistory(id) {
    $.ajax({
        url: '/players/' + id,
        accepts: 'application/json',
        success: function (data) {
            setHistory(data);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}
//Open the pop-up chat with the selected player
function openChat(id) {
    $.ajax({
        url: '/players/' + id,
        success: function (data) {
            setChatView(data);
            markAsSeen(id);
            scrollToBottom();
            $('#new_msg_text').focus();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}
//Request data for user tab
function openUserTab(id) {
    $.ajax({
        accepts: 'application/json',
        url: '/players/' + id,
        success: function (data) {
            if (downloadsOpen) { closeDownloads();}
            setUserTab(data);
            currentUserTabId = id;
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}
//Open classification
function openClassification() {
    $.ajax({
        accepts: 'application/json',
        url: '/players',
        success: function (data) {
            setClassification(data);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}

//EVENTS
//Function to run when the document is ready
$(document).ready(function () {
  updateAllData();
  setPendingCorrectionList();
});
//Event to open history of selected player
$(document).on('click', '#history-button', function (event) {
    let id = $('#history-button').attr('name');
    openHistory(id);
});
//Event to submit the correction just made
$(document).on('click', '.send-correction', function (event) {
    let questIndex = event.currentTarget.getAttribute('name');
    let questComment = $('#comment-input-' + questIndex).val();
    let questScore = $('#score-input-' + questIndex).val();
    if (questScore) {
        let questValutation = { comment: questComment, score: questScore, index: questIndex };
        submitCorrection(questValutation);
    } else {
        $('#no-score').remove();
        $('#input1-' + questIndex).append('<p id="no-score"class="unexpected-str">*Questo campo è obbligatorio</p>');
        $('#score-input-' + questIndex).focus();
    }
});
//Event to open chat with in-need player
$(document).on('click', '.new_msg-list-el', function (event) {
    let id = (event.target.id).replace('new_msg-', '');
    openChat(id);
});
//Event to open chat with selected player
$(document).on('click', '#chat-button', function (event) {
    let id = $('#rename-field').attr('name');
    openChat(id);
});
//Event to open user tab of selected player
$(document).on('click', '.player-list-el', function (event) {
    openUserTab(event.currentTarget.id);
});
//Event to rename a player from user panel
$(document).on('click', '#rename-button', function () {
    let str = $('#rename-field').val();
    let id = $('#rename-field').attr('name');
    $('.unexpected-str').remove();
    if (!(/\S/.test(str))) {
        $('#user-space-input').after('<div class="unexpected-str"><p>*Il nome non può essere vuoto</p></div>');
    }
    else if(str.length > 20) {
        $('#user-space-input').after('<div class="unexpected-str"><p>*Il nome non può essere lungo più di 20 caratteri compresi gli spazi, ci sono '+str.length+' caratteri</p></div>');
    }
    else {
        renamePlayer(id, str);
    }
});
//Event to open correction pane of selected player
$(document).on('click', '.waiting-player', function (event) {
    openCorrectionPane(event.currentTarget.id);
});
//Event to open the help window
$(document).on('click', '.help-list-el', function (event) {
    openHelpPane(event.currentTarget.id.replace('help-', ''));
});
//Event to expand or reduce the answer and question sub-panes
$(document).on('click', '.plus_min', function (event) {
    let id = event.currentTarget.id;
    id = id.replace('plus_min_', '');
    let elem = $("#" + id);
    elem.animate({
        height: "toggle"
    }, {
        step: function (now, fx) {
            $('#plus_min_' + id).empty();
            if (fx.end == 0) {
                $('#plus_min_' + id).append('<span class="glyphicon glyphicon-plus"></span>');
            } else {
                $('#plus_min_' + id).append('<span class="glyphicon glyphicon-minus"></span>');
            }
        }
    }, 250);
});
//Open classification from navbar
$(document).on('click', '#classification-button', function () {
    openClassification();
});
//Prevent default sumbit in correction pane
$(document).on('submit', '.form-correction', function (event) {
    event.preventDefault();
});
//Event to open user pane from correction pane
$(document).on('click', '.user-info-tab', function (event) {
    let id = event.currentTarget.id;
    id = id.replace('user-info-tab-', '');
    openUserTab(id);
});
//Event binded to the download button
$(document).on('click', '#download-files', function () {
    if (document.getElementById('classification-checkbox').checked) {
        downloadClassification();
    }
    if (document.getElementById('selectAllPlayersCheckbox').checked) {
        downloadAllPlayers();
    } else {
        $('.player-download').each(function () {
            if (this.checked) {
                downloadPlayer(this.value);
            }
        });
    }
});
//Event bindend to 'select all' checkbox
$(document).on('click', '#selectAllPlayersCheckbox', function () {
    if (this.checked) {
        $('.player-download').each(function () {
            this.checked = true;
        });
    } else {
        $('.player-download').each(function () {
            this.checked = false;
        });
    }
});
//Event to close the navbar dropdown on menu option clicked
$(document).on('click', '.close-on-click', function () {
    if ($('#navbarSupportedContent').hasClass('show')) {
        $('#collapse-button').click();
        updateAllData();
    }
});
//Event to handle the selection of the checkboxes
$(document).on('click', '.player-download', function (event) {
    let box = event.currentTarget;
    if (!box.checked) {
        document.getElementById('selectAllPlayersCheckbox').checked = false;
    } else {
        let check = true;
        $('.player-download').each(function () {
            if (!this.checked) {
                check = false;
            }
        });
        document.getElementById('selectAllPlayersCheckbox').checked = check;
    }
});
//Prevent submission of text form and send message in chat
$(document).on('keydown', '#new_msg_text', function (event) {
    if (event.which == 13) {
        event.preventDefault();
        $('#send-msg').click();
    }
});
//Enable tooltips
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
});