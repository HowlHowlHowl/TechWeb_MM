var url = require('url');
var fs = require('fs');
var path = require('path');
var express = require('express');
var app = express();
var port = 8000;

app.get('/stories', function(req, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    fs.readdir('stories', function(err, files) {
        let stories = [];
        if(!err) {            
            files.forEach(function(f) {
                name = path.parse(f).name;
                stories.push(name);
            });
        }
        res.write(JSON.stringify(stories));
        res.end();
    });
});

app.get('/player', function(req, res) {
    fs.readFile("player.html", function(err, data) {
        if(err) {
            res.writeHead(404, {'Content-Type': 'text/html'});
            return res.end("<h1>404 Not Found</h1>");
        }
        
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        return res.end();
    });
});

app.get('/author', function(req, res) {
    fs.readFile("author.html", function(err, data) {
        if(err) {
            res.writeHead(404, {'Content-Type': 'text/html'});
            return res.end("<h1>404 Not Found</h1>");
        }
        
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        return res.end();
    });
});

app.get('/evaluator', function(req, res) {
    fs.readFile("evaluator.html", function(err, data) {
        if(err) {
            res.writeHead(404, {'Content-Type': 'text/html'});
            return res.end("<h1>404 Not Found</h1>");
        }
        
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        return res.end();
    });
});

app.use(express.static('public'));

app.use(function(req, res){
    res.writeHead(404, {'Content-Type': 'text/html'});
    return res.end("<h1>404 Not Found</h1>");
});

app.listen(port, function() {});

