var fs = require('fs');
var formidable = require('formidable');

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
                    //Help requests
                    player.to_help = false;
                    data.help.forEach(function (dataHelpLog) {
                        if(dataHelpLog.to_help==true){
                            player.to_help=true;
                        }
                    });
                    //Time alert
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
    //Genera il file classifica per il download
    app.get('/players/downloads/classification', function (req, res) {
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
                res.write(JSON.stringify(players));
                res.status(200).send();
            } else {
                res.status(500).send();
                res.end();
            }
        });
    });
    //Genera il file o i file  player per il download
    app.get('/players/downloads/:id', function (req, res) {
        let id = req.params.id;
        if (id.localeCompare('all')==0) {
            var players = [];
            var files = fs.readdirSync('players');
            files.forEach((filename) => {
                let player = JSON.parse(fs.readFileSync('players/' + filename));
                players.push(player);
            });
            res.write(JSON.stringify(players));
            res.status(200).send();
        } else {
            let player = JSON.parse(fs.readFileSync('players/' + id + '.json'));
            res.write(JSON.stringify(player));
            res.status(200).send();
        }
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

    //Aggiunge un messaggio in chat inviato dal valutatore
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
    //Upload photo to the server and return full path
    app.post('/players/upload_photo/:id', function (req, res) {
        let form = new formidable.IncomingForm();
        let name = req.params.id;
        form.parse(req);
        form.on('file', (name, file) => {
            let save_path = "public/images/uploads/" + name;
            fs.rename(file.path, save_path, function (err) {
                if (err) {
                    res.status(500).send();
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.write(JSON.stringify({ url: "/" + save_path }));
                    res.end();
                }
            });
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
            current_mission: 'Inizio',
            current_activity: '',
            help: [],
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
    //serve al valutatore per capire da quanto tempo stai giocando ad un'attività (per es. se sei bloccato)
    app.put("/players/set_current_quest/:id", function (req, res) {
        let id = req.params.id;
        let body = req.body;
        let path = "players/" + id + ".json";
        let data = JSON.parse(fs.readFileSync(path));

        data.current_quest_start_timestamp[0] = body.hour;
        data.current_quest_start_timestamp[1] = body.minutes;
        data.current_mission = body.mission;
        data.current_activity = body.activity;

        fs.writeFile(path, JSON.stringify(data, null, 2), function (err) {
            if (err) {
                res.status(500).send();
            }
            else {
                res.status(200).send();
            }
        });
    });
    //TO DEBUG FORTE TANTO ESCE L'ERRORE
    // serve al player per inviare le risposte da valutare
    app.put("/players/add_answer/:id", function (req, res) {
        let id = req.params.id;
        let body = req.body;
        let path = "players/" + id + ".json";
        let data = JSON.parse(fs.readFileSync(path));
        data.quest_list.push(body);
        if (body.corrected == false) {
            data.pending_count++;
        }
        fs.writeFile(path, JSON.stringify(data, null, 2), function (err) {
            if (err) {
                res.status(500).send();
            }
            else {
                res.status(200).send();
            }
        });
    });

};
