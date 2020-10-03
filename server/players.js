var fs = require('fs');
var formidable = require('formidable');

// Limiti del tempo impiegato da un player su un'attività
var TOO_LONG_HOURS = 0;
var TOO_LONG_MINUTES = 15;

module.exports = function (app) {
    var next_id = 0;
    //Ritorna una lista dei player con informazioni aggiuntive
    app.get('/players/', function (req, res) {
        fs.readdir('players', function (err, files) {
            let players = [];
            if (err) {
                res.status(400).send();
                res.end();
            } else {
                files.forEach(function (filename) {
                    let player = JSON.parse(fs.readFileSync('players/' + filename));

                    //Calcolo del tempo passato dall'inizio dell'attività attuale
                    let date = new Date();
                    let elapsed_mins = (((date.getHours() * 60) + date.getMinutes()) - ((player.current_quest_start_timestamp[0] * 60) + player.current_quest_start_timestamp[1])) / 60;
                    let hours = Math.floor(elapsed_mins);
                    let minutes = (((elapsed_mins % 1) * 60).toFixed() < 0 ? 0 : ((elapsed_mins % 1) * 60).toFixed());
                    minutes = (minutes < 10 ? '0' + minutes : minutes);

                    //Info richieste d'aiuto
                    player.to_help = false;
                    player.help.forEach(function (helpLog) {
                        if (helpLog.to_help == true) {
                            player.to_help = true;
                        }
                    });
                    //Info sul tempo
                    player.too_long = (hours > TOO_LONG_HOURS || minutes > TOO_LONG_MINUTES);

                    player.urgent = false;
                    player.chat.forEach(function (chatLog) {
                        if ((chatLog.auth).localeCompare("player" + player.id) == 0) {
                            player.urgent = !chatLog.seen;
                        }
                    });
                    players.push(player);
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify(players));
                res.end();
            }
        });
    });
    //Elimina il player dal server
    app.delete('/players/delete/:id', function (req, res) {
        let id = req.params.id;
        let path = 'players/' + id + '.json';
        if (fs.existsSync(path)) {
            fs.unlinkSync(path);
            res.status(200).send();
            res.end();
        }
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
        let data = fs.readFileSync(path)     
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(data);
        res.end();
            
    });
    //Ritorna l'oggetto player:id
    app.get('/players/:id', function (req, res) {
        let id = req.params.id;
        let path = 'players/' + id + '.json';
        let data = fs.readFileSync(path);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(data);
        res.end();
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
    // Richiesta dei messaggi della chat per verificarne la presenza di nuovi 
    app.get('/players/get_chat/:id', function (req, res) {
        let id = req.params.id;
        let player = JSON.parse(fs.readFileSync('players/' + id + '.json'));
        let chat = player.chat;
        res.write(JSON.stringify(chat));
        res.status(200).send();
    });
    // verifica delle risposte alle richiste d'aiuto 
    app.get('/players/get_help/:id', function (req, res) {
        let id = req.params.id;
        let player = JSON.parse(fs.readFileSync('players/' + id + '.json'));
        let help = player.help;
        res.write(JSON.stringify(help));
        res.status(200).send();
    });
    //Richiede update sullo score del player
    app.get('/players/update_score/:id', function (req, res) {
        let id = req.params.id;
        let path = 'players/' + id + '.json';
        let player = JSON.parse(fs.readFileSync(path));
        let quests = player.quest_list;
        let to_send = null
        for (let i = 0; i < quests.length; i++) {
            if (!(quests[i].up_to_date) && quests[i].corrected) {
                player.quest_list[i].up_to_date = true;
                to_send = quests[i];
                break;
            }
        }
        if (to_send) {
            fs.writeFileSync(path, JSON.stringify(player, null, 2));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({
                score: player.score,
                mission: to_send.mission_name,
                activity: to_send.activity_name,
                added: to_send.quest_score
            }));
            res.end();
        } else {
            res.status(200).send();
        }
    });
    //Restituisce il vettore di richieste d'aiuto del player con nome e nome storia
    app.get('/players/get_help_request/:id', function (req, res) {
        let id = req.params.id;
        let player = JSON.parse(fs.readFileSync('players/' + id + '.json'));
        let data = {
            help: player.help,
            name: (player.username || 'Player ' + player.id),
            story_name: player.story_name,
            id: player.id
        }
        res.write(JSON.stringify(data));
        res.status(200).send();
    });
    //Aggiunge una richiesta di aiuto al vettore help del player
    app.post('/players/send_help_req/:id', function (req, res) {
        let id = req.params.id;
        let data = req.body;
        let path = 'players/' + id + '.json';
        let player = JSON.parse(fs.readFileSync(path));
        player.help.unshift(data);
        fs.writeFileSync(path, JSON.stringify(player, null, 2));
        res.status(200).send();
        res.end();
    });
    //Associa un username ad un player
    app.post('/rename_player/:id', function (req, res) {
        let id = req.params.id;
        let path = 'players/' + id + '.json';
        let body = req.body;
        let data = JSON.parse(fs.readFileSync(path));
        data.username = body.username;
        fs.writeFileSync(path, JSON.stringify(data, null, 2));
        res.status(200).send();
        res.end();
    });

    //Aggiunge un messaggio in chat inviato dal valutatore
    app.post('/players/send_msg/:id', function (req, res) {
        let id = req.params.id;
        let msg = req.body;
        let path = 'players/' + id + '.json';
        let content = JSON.parse(fs.readFileSync(path));
        content.chat.push(msg);
        fs.writeFileSync(path, JSON.stringify(content, null, 2));
        res.status(200).send();
        res.end();
    });
    
    //Segna come letti gli helplog del player specificato
    app.post('/players/mark_help_as_seen/:id' , function (req, res) {
        let id = req.params.id;
        let path = 'players/' + id + '.json';
        let data = fs.readFileSync(path);
        let content = JSON.parse(data);
        content.help.forEach(function (helpLog) {
            if (!helpLog.to_help) { helpLog.seen = true; }
        });
        fs.writeFileSync(path, JSON.stringify(content, null, 2));
        res.status(200).send();
        res.end();
    });
    //Segna come letti i chatlog del player specificato
    app.post('/players/mark_as_seen/:id', function (req, res) {
        let id = req.params.id;
        let path = 'players/' + id + '.json';
        let author = req.body.author;
        let data = fs.readFileSync(path);
        let content = JSON.parse(data);
        content.chat.forEach(function (chatLog) {
            if (chatLog.auth != author) { chatLog.seen = true; }
        });
        fs.writeFileSync(path, JSON.stringify(content, null, 2));
        res.status(200).send();
        res.end();
    });
    //Aggiorna la correzione di una quest per player=id
    app.post('/submit_correction/:id', function (req, res) {
        let id = req.params.id;
        let data = req.body;
        let path = 'players/' + id + '.json';
        let content = JSON.parse(fs.readFileSync(path));
        content.quest_list[data.index].corrected = true;
        content.quest_list[data.index].quest_score = Number(data.score);
        content.quest_list[data.index].comment = data.comment;
        content.pending_count -= 1;
        content.score += Number(data.score);
        fs.writeFileSync(path, JSON.stringify(content, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify(content, null, 2));
        res.end();        
    });
    //Aggiorna le richieste d'aiuto con la risposta fornita dal valutatore
    app.post('/players/answer_help_request/:id', function (req, res) {
        let id = req.params.id;
        let data = req.body;
        let path = 'players/' + id + '.json';
        let player = JSON.parse(fs.readFileSync(path));
        player.help[data.index].to_help = false;
        player.help[data.index].answer = data.answer;
        let content = {
            help: player.help,
            name: (player.username || 'Player ' + player.id),
            story_name: player.story_name,
            id: player.id
        };
        fs.writeFileSync(path, JSON.stringify(player, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify(content, null, 2));
        res.end();

    });
    //Upload photo to the server and return full path
    app.post('/players/upload_photo/:id', function (req, res) {
        let form = new formidable.IncomingForm({ 
          uploadDir: 'public/images/uploads',
          keepExtensions: true
        });
        let name = req.params.id;
        form.parse(req);
        form.on('file', (name, file) => {
            let save_path = "public/images/uploads/" + name;
            fs.renameSync(file.path, save_path);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ url: "/" + save_path }));
            res.end();    
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
                if (Number(id) >= next_id) {
                    next_id = Number(id) + 1;
                }
            });
        } else {
            next_id = next_id + 1;
        }
        let file_id = (next_id < 10 ? '000' : (next_id < 100 ? '00' : next_id < 1000 ? '0' : '')) + next_id;
        console.log('ID assigned to new player: ' + next_id + ', ID assigned to file: ' + file_id);

        var date = new Date();
        var player = {
            id: file_id,
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
        fs.writeFileSync('players/player' + file_id + '.json', JSON.stringify(player, null, 2));
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write(file_id);
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

        fs.writeFileSync(path, JSON.stringify(data, null, 2));
        res.status(200).send();
    });
    // serve al player per inviare le risposte da valutare
    app.put("/players/add_answer/:id", function (req, res) {
        let id = req.params.id;
        let body = req.body;
        let path = "players/" + id + ".json";
        let data = JSON.parse(fs.readFileSync(path));
        data.quest_list.push(body);
        if (body.corrected == false) {
            data.pending_count++;
        } else {
            data.score += body.quest_score;
        }
        fs.writeFileSync(path, JSON.stringify(data, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify(data, null, 2));
        res.end();            
    });
};
