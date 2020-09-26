var playersLength = 0;
var newMsgsLength = 0;
var currentChatPlayerID = null;
var currentCorrectionPlayerId = null;
var currentHelpPlayerId = null;
var currentUserTabID = null;
var classificationOpen = false;
var downloadsOpen = false;
var players_array = [];

/*The displayed elements can be:
- Correction Pane
- History Pane
- Help Pane
- Classification Pane
- Downloads Window
- User Window
- Chat
*/

//Function to run when the document is ready
$(document).ready(function () {
    updatePlayersSetMenu();
    setPendingCorrectionList();
});



/*** APPLICATION UPDATES ***/

//Chat update every 1 second 
setInterval(function () {
    updateChat();
    setPendingCorrectionList();
}, 1000);
//Classification update every 10 seconds
setInterval(function () {
    if (classificationOpen) {
        openClassification();
    }
}, 10000);
//User Tab update every 1 minute 
setInterval(function () {
    if (currentUserTabID) {
        openUserTab(currentUserTabID);
    }
}, 60000);
//Correction pane and Help pane update (if no input is given), every 10 minutes 
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
    update = true;
     if (currentHelpPlayerId) {
        let i = 0;
        let label;
        do {
            label = $('#help-input-label' + i);
            let input = $('#' + label.attr('for'));
            let in_val = input.val();
            if (in_val && in_val.length > 0) {
                update = false;
                break;
            }
            i++;
        } while (label.length > 0); 
     }
     updatePlayersSetMenu();
}, 5 * 60000);



/*** MAIN FUNCTIONALITIES ***/

//Connection to get the players data and update for the navbar dropdown lists and notifications
function updatePlayersSetMenu(chatUpdate) {
    $.ajax({
        accepts: 'application/json',
        url: '/players/',
        success: function (data) {
            players_array = data;
            newMsgsLength = 0;

            //Rimuove gli elementi dai dropdown
            $('#playersDropdown').empty();
            $('#new_msgDropdown').empty();
            $('#helpDropdown').empty();
            $('#new_msgNotification').remove();
            $('#navHelpNotification').remove();
            $('#navTimeNotification').remove();

            players_array.forEach(setPlayerList);
            if (players_array.length < 1) {
                $('#playersDropdown').append('<a class="dropdown-item">Non ci sono chat disponibili</a>');
            }
            if (newMsgsLength == 0) {
                $('#new_msgDropdown').append('<a class="dropdown-item">Non ci sono nuovi messaggi</a>');
            }
            if (chatUpdate) {
                openChat(currentChatPlayerID);
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
           
        }
    });
}
//Add a player (data) in the navbar menu
function setPlayerList(data) {
    let name = (data.username ? data.username : "Player " + data.id);
    let to_notify = false;
    $('#playersDropdown').append('<a class="dropdown-item player-list-el close-on-click" id="player' + data.id + '">' + name + '</a>');
    if (data.too_long) {
        //Un dot per ogni player e uno per il bottone collapse
        $('#navTimeNotification').remove();
        $('#playerDropdownButton').append('<div class="glyphicon glyphicon-time color" id="navTimeNotification"></div>');
        $('#player' + data.id).append('<div class="negative-dot dot"></div>');
        blinkNotify('#navTimeNotification');
        to_notify = true;
    }
    if (data.urgent) {
        newMsgsLength++;
        $('#new_msgNotification').remove();
        $('#new_msgDropdownButton').append('<div class="badge badge-secondary" id="new_msgNotification">' + newMsgsLength + ' new</div>');
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
    //Is there something to notify?
    if (to_notify) {
        $('#dot-space').empty();
        $('#dot-space').append('<div id="dot" class="dot"></div>');
        blinkNotify('#dot');
    }

}
//Get player by ID
function getPlayerByID(id) {
    let toReturn = null;
    players_array.forEach((player) => {
        if (player.id == id) {
            toReturn = player;
        }
    });
    return toReturn;
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



/*** DOWNLOAD FILES ***/

//Event binded on the download button to download files
$(document).on('click', '#download-files', function () {
    if (document.getElementById('classification-checkbox').checked) {
        downloadClassification();
    }
    players_array.forEach((player) => {
        if ($('#checkbox-' + player.id).prop('checked')) {
            downloadPlayer(player);
        }
    });
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
//Download Classification
function downloadClassification() {
    let pdf = new jsPDF();
    pdf.setFontSize(26);
    pdf.text(pdf.internal.pageSize.width / 2, 20, 'Classifica dei Giocatori', 'center');
    let table_body = [];
    let i = 0;
    players_array.sort((a, b) => { return (b.score - a.score); }).forEach((player) => {
        table_body.push([
            i,
            'Player ' + player.id,
            (player.username || '---'),
            player.story_name,
            player.score

        ]);
        i++;
        console.log(players_array);
    });
    pdf.autoTable({
        head: [['#', 'ID', 'Nome Utente', 'Storia', 'Punteggio']],
        body: table_body,
        margin: { left: 15, right: 15 },
        startY: pdf.pageCount > 1 ? pdf.autoTableEndPosY() + 10 : 30,
        columnStyles: {
            0: {
                cellWidth: 10
            },
            1: {
                cellWidth: 30
            },
            2: {
                cellWidth: 50
            },
            3: {
                cellWidth: 60
            },
            4: {
                cellWidth: 30
            }
        },
        theme: 'grid',
    });
    pdf.save('Classifica giocatori.pdf');
}
//Download del player tramite JSON
function downloadPlayer(player) {
    let images = [];
    let i = 1;
    let pdf = new jsPDF();
    pdf.setFontSize(26);
    pdf.text(pdf.internal.pageSize.width / 2, 20, player.story_name, 'center');
    pdf.setFontSize(16);
    pdf.text(pdf.internal.pageSize.width / 2, 40, 'ID player: ' + player.id + ' - Nome Player: ' + (player.username || 'Nessuno') + ' - Punteggio Finale: ' + player.score, 'center');

    let table_body = [];
    player.quest_list.forEach((quest) => {
        let question_content = '';
        quest.question.forEach((elem) => {
            switch (elem.type) {
                case 'image':
                    question_content += '\nImmagine con url: "' + elem.content.url + '".' + (elem.content.descr ? '.\nDescrizione: "' + elem.content.descr + '"\n' : '\n');
                    break;
                case 'text':
                    question_content += elem.content + '\n';
                    break;
                case 'video':
                    question_content += '\nVideo con url: "' + elem.content.url + '".' + (elem.content.descr ? '.\nDescrizione: "' + elem.content.descr + '"\n' : '\n');
                    break;
            }
        });
        let answer;
        if (quest.input_type == 'photo') {
            images.push({
                url: quest.answer,
                index: i,
                loaded: false,
                y: 0,
                img: null
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
        startY: pdf.pageCount > 1 ? pdf.autoTableEndPosY() + 20 : 50,
        margin: { left: 10, right: 10 },
        columnStyles: {
            0: {
                cellWidth: 20
            },
            1: {
                cellWidth: 30
            },
            2: {
                cellWidth: 40
            },
            3: {
                cellWidth: 40
            },
            4: {
                cellWidth: 35
            }
        },
        theme: 'grid',
    });
    //Aggiunta immagini
    if (images.length > 0) {
        let finalY = 10;
        var pageHeight = pdf.internal.pageSize.height;
        pdf.addPage();
        pdf.setFontSize(30);
        pdf.text(pdf.internal.pageSize.width / 2, finalY, 'Legenda delle immagini', 'center');
        pdf.setFontSize(16)
        finalY += 10;
        //scorri le immagini
        images.forEach((img_el) => {
            //aggiorna la y
            img_el.y = finalY;
            //crea l'immagine
            var img = new Image();
            img.src = img_el.url;
            //quando vieene caricata
            img.onload = function () {
                img_el.loaded = true;
                img_el.img = this;
                let save = true;
                //Sono state caricate tutte?
                images.forEach((img_el_check) => {
                    if (img_el_check.loaded == false) {
                        save = false;
                    }
                });
                if (save) {
                    //Sono tutte state caricate
                    images.forEach((img_el_save) => {
                        let base64url = getDataUrl(img_el_save.img);
                        //non entrerebbe nella pagina?
                        if (img_el_save.y + 40 > pageHeight) {
                            pdf.addPage(); img_el_save.y = finalY = 10;
                        }
                        pdf.text(50, img_el_save.y + 15, 'Immagine n°' + img_el_save.index);
                        if (base64url) {
                            pdf.addImage(base64url, 120, img_el_save.y, 30, 30);
                        } else {
                            pdf.text(90, finalY + 15, 'Non è stato possibile caricare il file.');
                        }
                    });
                    pdf.save((player.username || 'player' + player.id) + '.pdf');
                }
            }
            finalY += 40;
        });
    } else {
        //Nessuna immagine da caricare
        pdf.save((player.username || 'player' + player.id) + '.pdf');

    }
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
//Open download window
function openDownloads() {
    downloadsOpen = true;
    if (currentUserTabID) { closeUserTab(); }
    setDownloadsWindow();
    $('#downloads-window').css({ 'display': 'block' });
}
//Close download window
function closeDownloads() {
    downloadsOpen = false;
    $('#downloads-window').css({ 'display': 'none' });
}
//Prepare the download window
function setDownloadsWindow() {
    players_array.forEach((player) => {
        let id = player.id;
        if (!$('#checkbox-' + id).length) {
            let input = document.createElement('input');
            input.setAttribute('value', id);
            input.setAttribute('class', 'player-download');
            input.setAttribute('type', 'checkbox');
            input.setAttribute('id', 'checkbox-' + id);

            let label = document.createElement('label');
            label.setAttribute('for', id + '-checkbox');
            label.textContent = (player.username || 'player' + player.id);

            let li = document.createElement('li');
            li.setAttribute('name', id);
            li.append(input, label);
            li.setAttribute('type', 'none');
            $('#player-checkbox-list').append(li);
        }
    });
    
    //If select all was selected then all the checkboxes become selected  
    if ($('#selectAllPlayersCheckbox').prop('checked')) {
        $('.player-download').each(function () {
            this.checked = true;
        });
    }
}



/*** USER TAB***/

//Event to open user tab of selected player
$(document).on('click', '.player-list-el', function (event) {
    let id = event.currentTarget.id.replace('player', '');
    openUserTab(id);
});
//Event to open user pane from correction pane
$(document).on('click', '.user-info-tab', function (event) {
    let id = event.currentTarget.id.replace('user-info-tab-player', '');
    openUserTab(id);
});
//Request data for user tab
function openUserTab(id) {
    currentUserTabID = id;
    if (downloadsOpen) {
        closeDownloads();
    }
    setUserTab(getPlayerByID(currentUserTabID));
}
//Chiude la tab con le info utente
function closeUserTab() {
    document.getElementById('user-pane').style.display = 'none';
    currentUserTabID = null;
}
//Apre la tab con le info utente
function setUserTab(data) {
    let name = (data.username ? data.username : 'Player ' + data.id);
    let player_index = players_array.indexOf(data);

    let date = new Date();
    let elapsed_mins = (((date.getHours() * 60) + date.getMinutes()) - ((data.current_quest_start_timestamp[0] * 60) + data.current_quest_start_timestamp[1])) / 60;
    let hours = Math.floor(elapsed_mins);
    let minutes = (((elapsed_mins % 1) * 60).toFixed() < 0 ? 0 : ((elapsed_mins % 1) * 60).toFixed());
    minutes = (minutes < 10 ? '0' + minutes : minutes);

    let unread = 0;
    data.chat.forEach((log => { if (!log.seen && log.auth != 'Valutatore') unread++; }));

    let prevID = players_array[((player_index + players_array.length - 1) % players_array.length)].id;
    let nextID = players_array[((player_index + 1) % players_array.length)].id;
    $(document).on('click', '#prevUser', function (event) {
        openUserTab(prevID);
        event.stopPropagation();
    });
    $(document).on('click', '#nextUser', function (event) {
        openUserTab(nextID);
        event.stopPropagation();
    });

    $('#user-space').empty();
    $('#user-space').append('<a onclick="closeUserTab()"><span class="glyphicon glyphicon-remove icon-close"></span></a>'
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
        + '<p id="time-count">Missione: "' + (data.current_mission || 'nessuna') + '",  Attività: "' + (data.current_activity || 'nessuna') + '",  da ' + (hours > 0 ? (hours + ' : ' + minutes + ' ore ') : (minutes + ' minuti')) + '</span></p>'
        + '</div>'
        + '<div class="block-info">'
        + '<p>ID: player' + data.id + '</p>'
        + '</div>'
        + '</div>'
        + '<div class="block-info">'
        + '<button type="button" id="history-button" name="player' + data.id + '" class="user-space-button btn btn-primary btn-lg">Storico</button>'
        + '<button type="button" id="chat-button" class="user-space-button btn btn-primary btn-lg">Chat</button>'
        + '<button type="button" id="delete-player" name="' + data.id + '" class="user-space-button btn btn-primary btn-lg">Elimina</button>'
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
}



/** EVENTI E FUNZIONI LEGATE ALL'USER TAB **/

//Event to delete player from server
$(document).on('click', '#delete-player', function () {
    $('body').append(
        '<div id="black-focus">'
        + '<div><p> Sei sicuro? I dati relativi al giocatore andranno persi per sempre.</p>'
        + '<div id="button-div"><button id="delete-button">Elimina</button>'
        + '<button id="back-button">Annulla</button></div>'
        + '</div></div>');
});

//Event close the change from button and by clicking elsewhere
$(document).on('click', '#black-focus', function (event) {
    if (event.target.id != "delete-button") {
        $('#black-focus').remove();
    }
});
    
//Event to confirm elimination
$(document).on('click', '#delete-button', function () {
    let id = $('#rename-field').attr('name').replace('player', '');
    deletePlayer(id);
});

//Function to remove player
function deletePlayer(id) {
    $.ajax({
        url: '/players/delete/player' + id,
        type: 'DELETE',
        success: function () {
            $('#black-focus > div').empty();
            $('#black-focus > div').append('<p>Fatto<span class="glyphicon glyphicon-ok-circle"></span></p>');
            setTimeout(function () {
                $('#black-focus').remove();
            }, 1000);
            closeUserTab();
        },
        error: function () {
            $('#black-focus > div').empty();
            $('#black-focus > div').append('<p>Errore<span class="glyphicon glyphicon-remove-circle"></span></p>');
            setTimeout(function () {
                $('#black-focus').remove();
            }, 1000);
        }
    });
}

//Event to rename a player from user panel
$(document).on('click', '#rename-button', function () {
    let new_name = $('#rename-field').val();
    let id = $('#rename-field').attr('name');
    $('.unexpected-str').remove();
    if (!new_name.trim()) {
        $('#user-space-input').after('<div class="unexpected-str"><p>*Il nome non può essere vuoto</p></div>');
    }
    else if (new_name.length > 20) {
        $('#user-space-input').after('<div class="unexpected-str"><p>*Il nome non può essere lungo più di 20 caratteri compresi gli spazi, ci sono ' + str.length + ' caratteri</p></div>');
    }
    else {
        renamePlayer(id, new_name);
    }
});
//Rename player on server
function renamePlayer(id, str) {
    $.ajax({
        url: '/rename_player/' + id,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ username: str }),
        success: function () {
            updatePlayersSetMenu();
            setPendingCorrectionList();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            
        }
    });
}
//Enable tooltips
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
});



/*** CHAT ***/

//Prevent submission of text form and send message in chat
$(document).on('keydown', '#new_msg_text', function (event) {
    if (event.which == 13) {
        event.preventDefault();
        $('#send-msg').click();
    }
});
//Event to open chat with player with unread messages
$(document).on('click', '.new_msg-list-el', function (event) {
    let id = (event.target.id).replace('new_msg-player', '');
    openChat(id);
});
//Event to open chat with selected player
$(document).on('click', '#chat-button', function (event) {
    let id = $('#rename-field').attr('name').replace('player', '');
    openChat(id);
});
//Open the pop-up chat with the selected player
function openChat(id) {
    currentChatPlayerID = id;
    updateChat();
    scrollToBottom();
    $('#new_msg_text').focus();
}
//Close the pop-up chat
function closeChat() {
    document.getElementById("chat").style.display = "none";
    currentChatPlayerID = null;
}
//Update della chat con il player se ci sono messaggi non letti
function updateChat() {
    if (currentChatPlayerID) {
        setChatView(getPlayerByID(currentChatPlayerID));
    }
}
//Sets the layout of the chat messages
function setChatView(data) {
    $('#chat-user').empty();
    $('#chat-msgs').empty();
    document.getElementById("chat").style.display = "block";
    let callMarkAsSeen = false;
    $('#chat-user').append('<div class="glyphicon glyphicon-comment"></div><p id="chat-title">' + (data.username || 'Player ' + data.id) + '</p>');
    data.chat.forEach((chatlog) => {
       if ((chatlog.auth.localeCompare("Valutatore")) == 0) {
            $('#chat-msgs').append('<div class="row msg_container base_sent"><div class="col-md-10 col-xs-10"><div class="messages sent-msgs msg_sent"><p>' +
            chatlog.text + '</p><time>Tu - ' + chatlog.hour + ':' + chatlog.mins + '</time></div></div></div>');
       } else {
            $('#chat-msgs').append('<div class="row msg_container base_receive <div class="col-md-10 col-xs-10"><div class="messages msg_receive"><p>' +
            chatlog.text + '</p> <time>' + (data.username ? data.username : ('Player ' + data.id)) + ' - ' + chatlog.hour + ':' + chatlog.mins + '</time></div></div></div>');
           //Se ci sono messaggi non letti lo segno
            if (!chatlog.seen) {
                scrollToBottom();
                callMarkAsSeen = true;
           }
       }
    });
    //Se ci sono messaggi non letti li segno come letti e li mostro
    if (callMarkAsSeen) {
        markAsSeen();
    }
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
        let id = currentChatPlayerID;
        $.ajax({
            url: '/players/send_msg/player' + id,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(msg),

            success: function (data) {
                //Update dei dati, con true forzo l'update della chat in riapertura
                updatePlayersSetMenu(true);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                
            }
        });
    }
}
//Change the state of the current chat last messages to 'seen'
function markAsSeen() {
    $.ajax({
        url: '/players/mark_as_seen/player' + currentChatPlayerID,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ author: 'Valutatore' }),
        success: function () {
            $('#chatNotification').remove();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            
        }
    });
}
//Scroll to the last received message in the current chat
function scrollToBottom() {
    let chatVBox = document.getElementById('chat-msgs');
    chatVBox.scrollTop = chatVBox.scrollHeight;
}



/*** HELP PANE ***/

//Event to open the help window
$(document).on('click', '.help-list-el', function (event) {
    openHelpPane(event.currentTarget.id.replace('help-', ''));
});
//Event to submit the answer to the help required
$(document).on('click', '.send-help', function (event) {
    let helpIndex = event.currentTarget.getAttribute('name');
    let helpAnswer = $('#help-answer-input-' + helpIndex).val();
    if (helpAnswer) {
        let helpData = { answer: helpAnswer, index: helpIndex };
        submitHelpAnswer(helpData);
    } else {
        $('#no-score').remove();
        $('#input1-' + helpIndex).append('<p id="no-score"class="unexpected-str">*Questo campo è obbligatorio</p>');
        $('#help-comment-input-' + helpIndex).focus();
    }
});
//Request the array of help for the specified player
function openHelpPane(id) {
    $.ajax({
        accepts: 'application/json',
        url: '/players/get_help_request/' + id,
        success: function (data) {
            setHelpPane(JSON.parse(data));
            currentHelpPlayerId = id;
        },
        error: function (xhr, ajaxOptions, thrownError) {
       
        }
    });
}
//Set help pane 
function setHelpPane(data) {
    let body = '';
    $('#main-placeholder').empty();
    let header = '<div class="panel-heading">'
        + data.name + ' - ' + data.story_name
        + '<a id="user-info-tab-player' + data.id + '" class="user-info-tab btn btn-info btn-sm"><span class="glyphicon glyphicon-info-sign"></span></a>'
        + '</div><div class="panel-body" id="help-pane">';
    let ordinary_index = 0;
    data.help.forEach((help_req) => {
        if (help_req.to_help) {
            let help_index = data.help.indexOf(help_req);
            let quest_header = '<p class="quest_header">Missione: ' + help_req.mission_name + '<br>Attività: ' + help_req.activity_name + '</p>';
            let quest_widget = '<div class="description-div">'
                + "<div class='inline-divs'> Richiesta d'aiuto :"
                + '</div>'
                + '<div class="inline-divs" id="help-question' + help_index + '">'
                + '<p>' + help_req.question + '</p>'
                + '</div>'
                + '<div class="inline-divs">'
                + '</div>'
                + '</div>';
            let valu_widget = '<div class="valutation-input">'
                + '<form class="form-correction">'
                + '<div class="form-group row">'
                + '<div class="col-12 input2" id="input1-' + help_index + '">'
                + '<label id="help-input-label' + ordinary_index + '" for="help-answer-input-' + help_index + '">Rispondi</label><br>'
                + '<textarea class="comment-input help-comment" id="help-answer-input-' + help_index + '" placeholder="Scrivi qui la tua risposta"></textarea></div>'
                + '</div>'
                + '<button type="button" name="' + help_index + '"class="send-help btn btn-outline-primary">Invio <span class="glyphicon glyphicon-ok"></span></button>'
                + '</form>'
                + '</div>'
                + '<hr>';
            pane = '<div class="correction-divider">' + quest_header + quest_widget + valu_widget + '</div>';
            body += pane;
            ordinary_index++;
        }
    });
    if (!body) {
        body += '<p class="quest_header">Non ci sono risposte in attesa di valutazione per questo giocatore</p>';
    }
    $('#main-placeholder').append(header + body);
    $('#' + $('#help-input-label-0').attr('for')).focus();
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
           
        }
    });
}



/*** CORRECTION PANE ***/

//Event to open correction pane of selected player
$(document).on('click', '.waiting-player', function (event) {
    openCorrectionPane(event.currentTarget.id);
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
//Prevent default sumbit in correction pane
$(document).on('submit', '.form-correction', function (event) {
    event.preventDefault();
});
//Richiesta al server dei players con richieste di correzione in attesa
function setPendingCorrectionList() {
    $.ajax({
        accepts: 'application/json',
        url: '/pending_answers',
        success: function (data) {
            $('#correction-list').empty();
            $('#correction-list').append(' <a class="waiting-player list-group-item list-group-item-action disabled" data-toggle="list"  role="tab">Risposte da correggere</a>');
            data.forEach(addPendingPlayer);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            
        }
    });
}
//Add waiting player on the sidebar
function addPendingPlayer(data) {
    let name = (data.username ? data.username : 'Player ' + data.id);
    $('#correction-list').append('<a class="waiting-player list-group-item list-group-item-action" data-toggle="list" role="tab" id="sidebar-player-' + data.id + '">' + name + '</a>');
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
            
        }
    });
}
//Sets layout of correction panel
function setCorrectionPane(data) {
    classificationOpen = false;
    currentHelpPlayerId = null;
    $('#main-placeholder').empty();
    let header = '<div class="panel-heading" id="correction-header">'
        + (data.username ? data.username : 'Player ' + data.id) + ' - ' + data.story_name
        + '<a id="user-info-tab-player' + data.id + '" class="user-info-tab btn btn-info btn-sm"><span class="glyphicon glyphicon-info-sign"></span></a>'
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
                        let name = $(this).attr('name');
                        $(this).css('width', $('#' + name).width());
                        $(this).css('height', 'auto');
                        while ($(this).height() > 1000) {
                            $(this).css('width', $('#' + name).width() / 2);
                            $(this).css('height', 'auto');
                        }
                        $('#' + name).css('height', $(this).height());
                        $('#' + name).css('overflow-y','hidden');
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
                    + '<p>' + (answer_content || '') + '</p>'
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
        body += '<p class="quest_header">Non ci sono risposte in attesa di valutazione per questo giocatore</p>';
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
            
        }
    });
}



/*** HISTORY PANE ***/

//Event to open history of selected player
$(document).on('click', '#history-button', function (event) {
    let id = $('#history-button').attr('name');
    openHistory(id);
});
//Open the History pane for selected player
function openHistory(id) {
    $.ajax({
        url: '/players/' + id,
        accepts: 'application/json',
        success: function (data) {
            setHistory(data);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            
        }
    });
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
        + '<table class="history-table table table-sm"><thead><tr><th id="table-head" colspan="5">' + data.story_name + ' - ' + data.score + ' punti</th></tr><tr>'
        + '<th scope="col">Domanda</th>'
        + '<th scope="col">Risposta</th>'
        + '<th scope="col">Commento</th>'
        + '<th scope="col">Voto</th>'
        + '</tr>'
        + '</thead><tbody>';
    let body = '';
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
        if (quest.input_type == 'photo') { answer_content = '<img class="preview-img" src="' + quest.answer + '">'; } else { answer_content = quest.answer }
        let row = '<tr><td>' + question_content + '</td>'
        + '<td>' + (answer_content || 'Nessuna') + '</td>'
        + '<td>' + quest.comment + '</td>'
        + '<td>' + (quest.quest_score || (quest.corrected ? '0' : 'Non valutata')) + '</td></tr>';
        body += row;
    });
    body += '</tbody></table></div>';
    $('#main-placeholder').append(header + body);
}



/*** CLASSIFICATION PANE ***/

//Event to close the navbar dropdown on menu option clicked
$(document).on('click', '.close-on-click', function () {
    if ($('#navbarSupportedContent').hasClass('show')) {
        $('#collapse-button').click();
        updatePlayersSetMenu();
    }
});
//Open classification from navbar
$(document).on('click', '#classification-button', function () {
    openClassification();
});
//Open classification
function openClassification() {
    $.ajax({
        accepts: 'application/json',
        url: '/players',
        success: function (data) {
            setClassification(data);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            
        }
    });
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
    sortTable();
}
//Function to sort the classification
function sortTable() {
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("classification-table");
    switching = true;
    while (switching) {
        switching = false;
        rows = table.rows;
        for (i = 1; i < (rows.length - 1) ; i++) {
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
