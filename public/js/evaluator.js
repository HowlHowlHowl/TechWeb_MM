/*TODO:
NEI JSON STORIA
- Messaggi diversi a seconda del contenuto
PLAYER
- Messaggio conclusivo a seconda del punteggio finale
- Richiesta e risposta d'Aiuto diverso da chat
APP
- Esportare dati riassuntivi dei giocatori
*/
var chatLength = 0;
var helpLength = 0;
var currentChatPlayerId = null;
var currentCorrectionPlayerId = null;
var currentUserTabId = null;
var classificationOpen = false;
/*The displayed elements can be:
- Correction pane
- History
- Classification
*/

//APPLICATION UPDATE FUNCTIONS
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
}, 60000);

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
    let nextID = ((data.id+1) > chatLength ? '' : 'player'+Number(data.id+1));
    let prevID = ((data.id - 1) < 1 ? '' : 'player' + Number(data.id - 1));
    let actual_quest = data.quest_list[data.quest_list.length - 1];
    
    $('#user-space').empty();
    $('#user-space').append(  '<a onclick="closeUserTab()" class="close_user_tab"><span class="glyphicon glyphicon-remove icon_close" id="close_tab"></span></a>'
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
                            + '<p id="time-count">Missione "' + actual_quest.mission_name + '" attività: "' + actual_quest.activity_name + '" da ' + (hours > 0 ? (hours + ':' + minutes + ' ore ') : (minutes + ' minuti ')) + '</span></p>'
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
        $('#time-count').append('<span class="glyphicon glyphicon-warning-sign" id="timeNotification">');
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
    openClassification = false;
    $('#main-placeholder').empty();
    let header = '<div class="panel-heading" id="history-header">'
        + (data.username ? data.username : 'Player ' + data.id) + ' - Storico'
        + '<a id="user-info-tab-player' + data.id + '" class="user-info-tab btn btn-info btn-sm"><span class="glyphicon glyphicon-info-sign"></span></a>'
        + '</div><div class="panel-body" id="history-pane">'
        + '<table class="table table-sm"><thead><tr><th id="table-head" colspan="5">'+data.story_name+' - '+data.score+ ' punti</th></tr><tr>'
        + '<th scope="col">#</th>'
        + '<th scope="col">Domanda</th>'
        + '<th scope="col">Risposta</th>'
        + '<th scope="col">Commento</th>'
        + '<th scope="col">Voto</th>'
        + '</tr>'
        + '</thead><tbody>';
    let body='';
    let i = 1;
    data.quest_list.forEach((quest) => {
        let row = '<tr><th scope="row">' + i + '</th>'
        + '<td>' + quest.question + '</td>'
        + '<td>' + quest.answer + '</td>'
        + '<td>' + quest.comment + '</td>'
        + '<td>' + quest.quest_score + '</td></tr>';
        i++;
        body += row;
    });
    body+='</tbody></table></div>';
    $('#main-placeholder').append(header + body);
}
//Sets layout of correction panel
//TODO:immagini e video(?)
function setCorrectionPane(data) {
    openClassification = false;
    $('#main-placeholder').empty();
    let header = '<div class="panel-heading" id="correction-header">'
        + (data.username ? data.username : 'Player ' + data.id) + ' - ' + data.story_name
        + '<a id="user-info-tab-player' +data.id+ '" class="user-info-tab btn btn-info btn-sm"><span class="glyphicon glyphicon-info-sign"></span></a>'
        + '</div><div class="panel-body" id="correction-pane">';

    $('#variable-answer').css({ 'height': '10vh' });
    let i = 1;
    let body = "";
    data.quest_list.forEach((quest) => {
        if (!quest.corrected) {
            let pane;
            //Attach header:
            let quest_header = '<p class="quest_header">Missione: ' + quest.mission_name + '<br>Attività: ' + quest.activity_name+ '</p>';
            //Attach question:
            let quest_widget =  '<div class="description-div">'
                                + '<div class="inline-divs">Domanda :'
                                + '<a id="plus_min_question' + i + '" class="plus_min btn btn-info btn-sm"><span class="glyphicon glyphicon-minus"></span></a>'
                                + '</div>'
                                + '<div class="inline-divs" id="question' + i + '">'
                                + '<p>' + quest.question + '</p>'
                                + '</div>'
                                + '<div class="inline-divs">'
                                + '</div>'
                                + '</div>';

            //Define answer html
            let var_answr;
            switch (quest.input_type) {
                case 'text':
                    var_answr = '<p>' + quest.answer + '</p>';
                    break;
                case 'img':
                    var_answr = '<img src="public/pending_answer/' + quest.answer + '" class="img-fluid img-thumbnail" alt="Responsive image">';
                    $('#variable-answer').css({ 'height': '50vh' });
                    break;
            }
            //Attach answer
            let answer_widget = '<div class="description-div">'
                                + '<div class="inline-divs">'
                                + 'Risposta :'
                                + '<a id="plus_min_answer' + i + '" class="plus_min btn btn-info btn-sm"><span class="glyphicon glyphicon-minus"></span></a>'
                                + '</div>'
                                + '<div class="inline-divs" id="answer' + i + '">'
                                + var_answr
                                + '</div>'
                                + '<div class="inline-divs">'
                                + '</div>'
                                + '</div>';
            //Attach corretion input
            let valu_widget = '<div class="valutation-input">'
                                + '<form>'
                                + '<div class="form-group row">'
                                + '<div class="col-12">'
                                + '<div class="input1" id="input1-' + i + '"><label for="score-input-' + i + '">Attribuisci un punteggio</label><br>'
                                + '<input class="form-control number-input" type="number" id="score-input-' + i + '"></div>'
                                + '<div class="input2" id="input2-' + i + '"><label for="comment-input-' + i + '">Aggiungi un commento</label><br>'
                                + '<textarea class="comment-input" id="comment-input-' + i + '"></textarea></div>'
                                + '</div>'
                                + '</div>'
                                + '<button type="button" name="'+i+'"class="send-correction btn btn-outline-primary">Invio <span class="glyphicon glyphicon-ok"></span></button>'
                                + '</form>'
                                + '</div>'
                                + '<hr>';
            pane = '<div class="correction-divider">' + quest_header + quest_widget + answer_widget + valu_widget + '</div>';
            body += pane;
            i++;
        }
    });
    $('#main-placeholder').append(header + body + '</div>');
    $('#score-input-1').focus();
}
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
             chatlog.text + '</p><time>You - ' + chatlog.hour + ':' + chatlog.mins + '</time></div></div></div>');
        } else {
            $('#chat-msgs').append('<div class="row msg_container base_receive <div class="col-md-10 col-xs-10"><div class="messages msg_receive"><p>' +
             chatlog.text + '</p> <time>' + (data.username ? data.username : ('Player ' + data.id)) + ' - ' + chatlog.hour + ':' + chatlog.mins + '</time></div></div></div>');
        }
    });
}
//Fill the lists of player avaiable for conversation and in need for help
function setPlayerList(data) {
    let name = (data.username ? data.username : "Player " + data.id);
    if (data.urgent) {
        helpLength++;
        $('#helpDropdown').append('<a class="dropdown-item help-list-el" id="help-player' + data.id + '">' + name + '</a>');
        $('.help-dot').remove();
        $('#dot-space').append('<span class="help-dot"></span>');
    }
    $('#playersDropdown').append('<a class="dropdown-item player-list-el" id="player' + data.id + '">' + name + '</a>');
    if (data.too_long) {
        $('.time-dot-collapse').remove();
        $('#navTimeNotification').remove();
        $('#playerDropdownButton').append('<span class="glyphicon glyphicon-warning-sign" id="navTimeNotification">');
        blinkNotify('#navTimeNotification');

        $('#player' + data.id).append('<span class="time-dot"></span>');
        $('#dot-space').append('<span class="time-dot time-dot-collapse"></span>');
        
    }
    chatLength++;
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
//AJAX CONNECTIONS

//POST 
//Rename player on server
function renamePlayer(id, str) {
    $.ajax({
        url: '/rename_player/' + id,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({surname : str}),
        success:function(){
            updateAllData();
            setPendingCorrectionList();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}
//Send message to the server
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
        url: '/players/' + id + '/mark_as_seen',
        type: 'POST',
        contentType: 'application/json',
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
        url: "/submit_answer/" + currentCorrectionPlayerId,
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

//GET
//Get story by ID
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
}
//Richiesta al server dei file con richieste di correzione in attesa
function setPendingCorrectionList() {
    $.ajax({
        accepts: 'application/json',
        url: '/pending_answers',
        success: function (data) {
            $('#correction-list').empty();
            $('#correction-list').append(' <a class="waiting-player list-group-item list-group-item-action disabled" data-toggle="list"  role="tab">Pending Answers</a>');
            data.forEach(addPendingPlayer);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}
//Connection to get the players data and update for the navbar dropdown lists and notifications
function updateAllData() {
    $.ajax({
        accepts: 'application/json',
        url: '/players',
        success: function (data) {
            $('#playersDropdown').empty();
            $('#helpDropdown').empty();
            helpLength = 0;
            chatLength = 0;
            data.forEach(setPlayerList);
            $('#helpDropdownButton').find('#helpNotification').remove();
            if (chatLength == 0) {
                $('#playersDropdown').append('<a class="dropdown-item">Non ci sono chat disponibili</a>');
            }
            if (helpLength == 0) {
                $('#helpDropdown').append('<a class="dropdown-item">Non ci sono richieste di aiuto</a>');
                $('.help-dot').remove();
            } else {
                $('#helpDropdownButton').append('<span class="badge badge-secondary" id="helpNotification">' + helpLength + ' New</span>');
                blinkNotify('#helpNotification');
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}
//Request data for correction pane of selected player
function requestWaitingUserData(id) {
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
//TODO: Rimuovere le notifiche del tempo e dell'aiuto quando necessario (Mi pare sia fatto)

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
        let questValutation = { comment: questComment, score: questScore, index: questIndex - 1 };
        submitCorrection(questValutation);
    } else {
        $('#no-score').remove();
        $('#input1-' + questIndex).append('<p id="no-score"class="unexpected-str">*Questo campo è obbligatorio</p>');
        $('#score-input-' + questIndex).focus();
    }
});
//Event to open chat with in-need player
$(document).on('click', '.help-list-el', function (event) {
    let id = (event.target.id).replace('help-', '');
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
    requestWaitingUserData(event.currentTarget.id);
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
$(document).on('click', '#classification-button', function () {
    openClassification();
});
//Event to open user pane from correction pane
$(document).on('click', '.user-info-tab', function (event) {
    let id = event.currentTarget.id;
    id = id.replace('user-info-tab-', '');
    openUserTab(id);
});
//Enable tooltips
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
});