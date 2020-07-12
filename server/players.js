var fs = require('fs');

module.exports = function(app) {
    //Ritorna una lista dei player con l'informazione relativa all'ultimo messaggio inviato
    app.get('/players/', function (req, res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        fs.readdir('players', function (err, files) {
            let players = [];
            if (!err) {
                files.forEach(function (file) {
                    let data = JSON.parse(fs.readFileSync('players/' + file));
                    let player = {};
                    player.id = data.id;
                    player.urgent = false;
                    player.usrname = data.username;
                    data.chat.forEach(function (dataChatLog) {
                        if ((dataChatLog.auth ).localeCompare("player"+data.id)==0) {
                            player.urgent = !dataChatLog.seen;
                        }      
                    });

                    players.push(player);
                });
            }
            res.write(JSON.stringify(players));
            res.end();
        });
    });
    //Risponde alla richiesta dei file pending_answers e ritorna una lista degli id presenti
    app.get('/pending_answers', function (req, res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        fs.readdir('pending_answers', function (err, files) {
            let pending_list = [];
            if (!err) {
                files.forEach(function (file) {
                    let data = JSON.parse(fs.readFileSync('pending_answers/' + file));
                    let pending = {};
                    pending.id = data.id;
                    pending.username = data.username;
                    pending_list.push(pending);
                });
            }
            res.write(JSON.stringify(pending_list));
            res.end();
        });
    });
    //Risponde alla richiesta dei file pending_answers di uno specifico player
    app.get('/pending_answers/:id', function (req, res) {
        let id = req.params.id;
        let path = 'pending_answers/' + id + '.json';
        fs.readFile(path, (err, data) => {
            if (!err) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(data);
                return res.end();
            } else {
                res.status(400).send();
            }
        });
    });
    //Ritorna i chatlog di player:id
    app.get('/players/:id', function(req, res){
        let id = req.params.id;
        let path = "players/" + id + ".json";
        fs.readFile(path, (err, data) => {
            if (!err) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(data);
                return res.end();
            } else {
                res.status(400).send();
            }
        });
    });
    //Associa un username ad un player
    app.post('/rename_player/:id', function (req, res) {
        let id = req.params.id;
        let play_path = 'players/' + id + '.json';
        let pend_path = 'pending_answers/' + id + '.json';
        let body = req.body;

        //Modifica al file personale del player
        let data = fs.readFileSync(play_path, function (err) {
            if (err) {
                res.status(500).send();
                return res.end();
            }
        });
        let content = JSON.parse(data);
        content.username = body.surname;
        fs.writeFile(play_path, JSON.stringify(content, null, 2), function (err) {
            if (err) {
                res.status(500).send();
                return res.end();
            }
        });

        //Modifica al file delle valutazioni del player se esiste
        if (fs.existsSync(pend_path)) {
            data = fs.readFileSync(pend_path, function (err) {
                if (err) {
                    res.status(500).send();
                    return res.end();
                }
            });
            content = JSON.parse(data);
            content.username = body.surname;
            fs.writeFile(pend_path, JSON.stringify(content, null, 2), function (err) {
                res.status(err ? 500 : 200).send();
                return res.end();
            });
        } else {
            res.status(200).send();
            return res.end();
        }
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
                return res.end();
            }
        });
        let content = JSON.parse(data);
        content.chat.forEach(function (chatLog) {
            chatLog.seen = true;
        });
        fs.writeFile(path, JSON.stringify(content, null, 2), function (err) {
            res.status(err ? 500 : 200).send();
            return res.end();
        });
    });
};