var fs = require('fs');

module.exports = function(app) {
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
                    data.chat.forEach(function (dataChatLog) {
                        if ((dataChatLog.auth ).localeCompare("player"+data.id)==0) {
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
    app.get('/players/:id', function(req, res){
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
};
