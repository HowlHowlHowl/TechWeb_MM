var fs = require('fs');
var path = require('path');
var express = require('express');
var formidable = require('formidable');
var process = require('process');
var app = express();
var port = 8000;

//Cambia la working directory alla directory che contiene questo file
process.chdir(__dirname);

//Parsing di body json nelle richieste che specificano application/json come content type
app.use(express.json());

//Rende disponibili tutti i file nella directory public e nelle sue subdirectory
app.use("/public", express.static(path.resolve(__dirname, 'public')));

//Stories API
require('./server/stories.js')(app);

//Players API
require('./server/players.js')(app);

//Upload di file
require('./server/upload.js')(app);

//Home page
app.get("/",function (req, res) {
    fs.readFile("home.html", function (err, data) {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            return res.end("<h1>404 Not Found</h1>");
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(data);
        return res.end();
    }); 
    
});

//Ambiente player
app.get('/player', function (req, res) {
    res.sendFile(path.join(__dirname + "/player.html"));
});

//Ambiente author
app.get('/author', function (req, res) {
    res.sendFile(path.join(__dirname + "/author.html"));
});

//Ambiente evaluator
app.get('/evaluator', function (req, res) {
    res.sendFile(path.join(__dirname + "/evaluator.html")); 
});

//Handler in caso di richieste inesistenti
app.use(function(req, res){
    res.writeHead(404, {'Content-Type': 'text/html'});
    return res.end("<h1>404 Not Found</h1>");
});

app.listen(port, function() {});
console.log("Server Started");