var fs = require('fs');

module.exports = function (app) {
    var next_id = 0;
    //Ritorna una lista dei player con l'informazione relativa all'ultimo messaggio inviato
    app.get('/players/', function (req, res) {
        fs.readdir('players', function (err, files) {
            let players = [];
            if (!err) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                files.forEach(function (file) {
                    let data = JSON.parse(fs.readFileSync('players/' + file));
                    let player = {};
                    player.id = data.id;
                    player.urgent = false;
                    player.username = data.username;
                    player.score = data.score;

                    let date = new Date();
                    let elapsed_mins = (((date.getHours() * 60) + date.getMinutes()) - ((data.current_quest_start_timestamp[0] * 60) + data.current_quest_start_timestamp[1])) / 60;
                    let hours = Math.floor(elapsed_mins);
                    let minutes = (((elapsed_mins % 1) * 60).toFixed() < 0 ? 0 : ((elapsed_mins % 1) * 60).toFixed());
                    minutes = (minutes < 10 ? '0' + minutes : minutes);

                    player.too_long = (hours > 0 || minutes > 15);
                    data.chat.forEach(function (dataChatLog) {
                        if ((dataChatLog.auth).localeCompare("player" + data.id) == 0) {
                            player.urgent = !dataChatLog.seen;
                        }
                    });

                    players.push(player);
                });
                res.write(JSON.stringify(players));
                res.end();
            }
        });
    });
    //Risponde alla richiesta dei file pending_answers e ritorna una lista degli id presenti
    app.get('/pending_answers', function (req, res) {
        fs.readdir('players', function (err, files) {
            let pending_list = [];
            if (!err) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                files.forEach(function (file) {
                    let data = JSON.parse(fs.readFileSync('players/' + file));
                    if (data.pending_count > 0) {
                        let pending = {};
                        pending.id = data.id;
                        pending.username = data.username;
                        pending_list.push(pending);
                    }
                });
                res.write(JSON.stringify(pending_list));
                res.end();
            } else {
                res.status(400).send();
                res.end();
            }
        });
    });
    //Risponde alla richiesta dei file pending_answers di uno specifico player
    app.get('/pending_answers/:id', function (req, res) {
        let id = req.params.id;
        let path = 'players/' + id + '.json';
        fs.readFile(path, (err, data) => {
            if (!err) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(data);
                res.end();
            } else {
                res.status(400).send();
            }
        });
    });
    //Ritorna l'oggetto player:id
    app.get('/players/:id', function (req, res) {
        let id = req.params.id;
        let path = 'players/' + id + '.json';
        fs.readFile(path, function (err, data) {
            if (err) {
                res.status(400).send();
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(data);
                res.end();
            }
        });
    });
    //Genera il file player per il download
    app.get('/players/download/:id', function (req, res) {

    });
    //Genera il file classifica per il download
    app.get('/players/downloads/classification', function (req, res) {
        let html = '<head><style type="text/css">'
            + 'tbody > tr:nth-child(1) { background: linear-gradient(#f3b114, transparent, #f3b114); color:#6b0202; } '
            + 'tbody > tr:nth-child(2) { background: linear-gradient(#636363, transparent, #636363); color: #6b0202; } '
            + 'tbody > tr:nth-child(3) { background: linear-gradient(#ea9621, transparent, #ea9621); color: #6b0202; } '
            + 'table { font-size:6vh; margin:auto; width:100%; border-collapse:collapse;} '
            + 'th, td { text-align:center; border:1px black solid; } '
            + '</style></head>'
            + '<body><table><thead><tr><th scope="col">ID</th>'
            + '<th scope="col">Nome</th>'
            + '<th scope="col">Punteggio</th></tr></thead><tbody>';
        fs.readdir('players', function (err, files) {
            if (!err) {
                res.writeHead(200);
                let players = [];
                files.forEach(function (file) {
                    let data = JSON.parse(fs.readFileSync('players/' + file));
                    players.push({
                        id: data.id,
                        username: data.username,
                        score: data.score
                    });
                });
                players.sort((a, b) => {
                    return (b.score - a.score);
                });
                players.forEach((player) => {
                    html = html + '<tr><td>player' + player.id + '</td>'
                        + '<td>' + player.username + '</td>'
                        + '<td>' + player.score + '</td></tr>';
                });

                html = html + '</tbody></table></body>';
                fs.writeFile('public/downloads/classification.html', html, function (err) {
                    res.status((err ? 500 : 200)).send();
                });
            } else {
                res.status(400).send();
                res.end();
            }
        });


    });
    //Genera il file classifica per il download
    app.get('/players/downloads/:id', function (req, res) {
        let id = req.params.id;
        if (id.localeCompare('all')==0) {
            var files = fs.readdirSync('players');
            var names = [];
            files.forEach((filename) => {
                  names.push(writePlayerHTML(filename));
            });
            res.write(names.toString());
            res.status(200).send();
        } else {
            let name = writePlayerHTML(id + '.json');
            res.write(name);
            res.status(200).send();
        }
    });
    //TODO debug this, senza sync in writefile scrive con no, sembra essere un prob di sync
    function writePlayerHTML(id) {
        let data = JSON.parse(fs.readFileSync('players/' + id));
        let html = '<head><style type="text/css">'
            + 'th, td { border:1px solid black; }'
            + 'th { font-size:3vh; }'
            + 'table { width:100%; border:1px solid black; border-collapse:collapse }'
            + 'p { text-align:center; font-size:4vh; }'
            + '</style></head>'
            + '<body><p><b>ID player:</b> player' + data.id
            + ' - <b>Nome Player:</b> ' + (data.username || '<strong> Nessuno </strong>')
            + ' - <b>Punteggio Finale:</b>' + data.score + '</p><table>'
            + '<tr><th colspan="6">' + data.story_name + '</th></tr>'
		    + '<tr><th>Missione</th><th>Attivit&aacute;</th><th>Domanda</th><th>Risposta</th><th>Commento</th><th>Punteggio</th></tr>';
            + '<tr><th>Missione</th><th>Attività</th><th>Domanda</th><th>Risposta</th><th>Commento</th><th>Punteggio</th></tr>'
            + '</table></body>';
        data.quest_list.forEach((quest) => {
            html += '<tr><td>' + quest.mission_name + '</td><td>' + quest.activity_name
                 + '</td><td>' + quest.question + '</td><td>' + quest.answer
                 + '</td><td>' + quest.comment + '</td><td>' + quest.quest_score
                 + '</td></tr>';
        });
        html += '</table></body>';
        fs.writeFileSync('public/downloads/' + (data.username || 'player' + data.id) + '.html', html);
        return ((data.username || 'player' + data.id) + '.html');    
    }

    //Genera il file classifica per il download
    app.get('/players/downloads/classification', function (req, res) {
        let html = '<head><style type="text/css">'
            + 'tbody > tr:nth-child(1) { background: linear-gradient(#f3b114, transparent, #f3b114); color:#6b0202; } '
            + 'tbody > tr:nth-child(2) { background: linear-gradient(#636363, transparent, #636363); color: #6b0202; } '
            + 'tbody > tr:nth-child(3) { background: linear-gradient(#ea9621, transparent, #ea9621); color: #6b0202; } '
            + 'table { font-size:6vh; margin:auto; width:100%; border-collapse:collapse;} '
            + 'th, td { text-align:center; border:1px black solid; } '
            + '</style></head>'
            + '<body><table><thead><tr><th scope="col">ID</th>'
            + '<th scope="col">Nome</th>'
            + '<th scope="col">Punteggio</th></tr></thead><tbody>';
        fs.readdir('players', function (err, files) {
            if (!err) {
                res.writeHead(200);
                let players = [];
                files.forEach(function (file) {
                    let data = JSON.parse(fs.readFileSync('players/' + file));
                    players.push({
                        id: data.id,
                        username: data.username,
                        score: data.score
                    });
                });
                players.sort((a, b) => { return (b.score - a.score); });
                players.forEach((player) => {
                    html = html + '<tr><td>player' + player.id + '</td><td>' + player.username + '</td><td>' + player.score + '</td></tr>';
                });
                html = html + '</tbody></table></body>';
                fs.writeFile('public/downloads/classification.html', html, function (err) {
                    res.status((err ? 500 : 200)).send();
                });
            } else {
                res.status(400).send();
                res.end();
            }
        });
    });
    //Associa un username ad un player
    app.post('/rename_player/:id', function (req, res) {
        let id = req.params.id;
        let path = 'players/' + id + '.json';
        let body = req.body;
        let data = JSON.parse(fs.readFileSync(path));
        data.username = body.surname;
        fs.writeFile(path, JSON.stringify(data, null, 2), function (err) {
            res.status((err ? 500 : 200)).send();
        });
        res.end();
    });

    //Aggiunge un messaggio in chat inviato dal valutatore, funziona sull'assunto che 
    //venga creato un file per ogni giocatore appena entra in game.
    app.post('/players/:id', function (req, res) {
        let id = req.params.id;
        let msg = req.body;
        let path = 'players/' + id + '.json';
        let content = JSON.parse(fs.readFileSync(path));
        content.chat.push(msg);
        fs.writeFile(path, JSON.stringify(content, null, 2), function (err) {
            res.status(err ? 500 : 200).send();
        });
        res.end();
    });
    //Segna come letti i chatlog del player specificato
    app.post('/players/:id/mark_as_seen', function (req, res) {
        let id = req.params.id;
        let path = 'players/' + id + '.json';
        let data = fs.readFileSync(path, function (err) {
            if (err) {
                res.status(500).send();
            }
        });
        let content = JSON.parse(data);
        content.chat.forEach(function (chatLog) {
            chatLog.seen = true;
        });
        fs.writeFile(path, JSON.stringify(content, null, 2), function (err) {
            res.status(err ? 500 : 200).send();
        });
    });
    //Aggiorna la correzione di una quest per player=id
    app.post('/submit_answer/:id', function (req, res) {
        let id = req.params.id;
        let data = req.body;
        let path = 'players/' + id + '.json';
        let content = fs.readFileSync(path, function (err) {
            if (err) {
                res.status(500).send();
            }
        });
        content = JSON.parse(content);
        let quest = content.quest_list[data.index];
        quest.corrected = true;
        quest.quest_score = Number(data.score);
        quest.comment = data.comment;
        content.pending_count -= 1;
        content.score += Number(data.score);
        fs.writeFile(path, JSON.stringify(content, null, 2), function (err) {
            if (err) {
                res.status(500).send();
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify(content, null, 2));
                res.end();
            }
        });
    });

    //Crea il file del player quando accede all'applicazione
    app.put('/players/create_player', function (req, res) {
        var data = req.body;     
        if (next_id == 0) {
            var files = fs.readdirSync('players'); 
            files.forEach(function (file) {
                var id = file.replace('player', '');
                id = id.replace('.json', '');
                if (Number(id) > next_id) {
                    next_id = Number(id) + 1;
                }
            });
        } else {
            next_id = next_id + 1;
        }
        console.log('ID assigned to new player: ' + next_id);
        var date = new Date();
        var player = {
            id: next_id,
            score: 0,
            username: '',
            current_quest_start_timestamp: [
                date.getHours(),
                date.getMinutes()
            ],
            chat: [],
            pending_count: 0,
            story_name: data.name,
            quest_list: []
        };    
        fs.writeFileSync('players/player' + next_id + '.json', JSON.stringify(player, null, 2));
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write(next_id.toString());
        res.end();
    });  
};
