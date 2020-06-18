var url = require('url');
var fs = require('fs');
var path = require('path');
var express = require('express');
var app = express();
var port = 8000;

var nextStoryId = 0;

//Fa parsing di body json nelle richieste che specificano application/json come content type
app.use(express.json());

//Story REST API
app.get('/stories', function(req, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    fs.readdir('stories', function(err, files) {
        let stories = [];
        if(!err) {            
            files.forEach(function(f) {
                let data = JSON.parse(fs.readFileSync('stories/' + f));
                let story = {};
                story.name = data.name;
                story.id = data.id;
                story.accessible = data.accessible;
                story.published = data.published;
                stories.push(story);
            });
        }
        res.write(JSON.stringify(stories));
        res.end();
    });
});

function checkStory(s)
{
    return true;
}

//Create new story
app.post('/stories', function(req, res) {
    let story = req.body;
    if(checkStory(story))
    {
        new_id = nextStoryId++;
        story.id = new_id;
        fs.writeFile("stories/story" + new_id + ".json", JSON.stringify(story), function(err) {
            if(!err) {
                res.status(200).send();
            } else {
                res.status(500).send();
            }
        });
    } else {
        res.status(400).send();
    }
});

//Update existing story
app.put('/stories/:id', function(req, res) {
    let story = req.body;
    let id = req.params.id;
    if(checkStory(story)) {
        let path = "stories/story" + id + ".json";
        if(fs.existsSync(path)) {
            fs.writeFile(path, JSON.stringify(story), function(err) {
                if(!err) {
                    res.status(200).send();
                } else {
                    res.status(500).send();
                }
            });
        } else {
            res.status(400).send();
        }
    } else {
        res.status(400).send();
    }
});

//Duplicate, archive, publish, delete
app.post('/stories/:id', function(req, res) {
    let id = req.params.id;
    let path = "stories/story" + id + ".json";
    
    if(fs.existsSync(path)) {
        let action = req.body.action;
        switch(action) {
            case "duplicate":
                fs.readFile(path, (err, data) => {
                    if(err) {
                        res.status(500).send();
                    } else {
                        let new_id = nextStoryId++;
                        let path = "stories/story" + new_id + ".json";
                        fs.writeFile(path, data, function(err) {
                            res.status(err ? 500 : 200).send();
                        });
                    }
                });
                break;
                
            case "archive":
            case "publish":
                fs.readFile(path, (err, data) => {
                    if(err) {
                        res.status(500).send();
                    } else {
                        let story = JSON.parse(data);
                        let path = "stories/story" + id + ".json";
                        
                        story.published = (action == "publish") ? true : false;
                        fs.writeFile(path, JSON.stringify(story), function(err) {
                            res.status(err ? 500 : 200).send();
                        });
                    }
                });
                break;
                
            case "delete":
                fs.unlink(path, (err) => {
                    res.status(err ? 500 : 200).send();
                });
                break;
            
            default:
                res.status(400).send();
                break;
        }
    } else { 
        res.status(400).send();
    }
});

//Get story by id
app.post('/stories/:id', function(req, res) {
    let id = req.params.id;
    let path = "stories/story" + id + ".json";
    readFile(path, (err, data) => {
        if(!err) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(data);
            return res.end();
        } else {
            res.status(400).send();
        }
    });
}

//Ambiente player
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

//Ambiente author
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

//Ambiente evaluator
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

//Rende disponibili tutti i file nella directory public e nelle sue subdirectory
app.use(express.static('public'));

//Handler in caso di richieste inesistenti
app.use(function(req, res){
    res.writeHead(404, {'Content-Type': 'text/html'});
    return res.end("<h1>404 Not Found</h1>");
});

//Aggiorna la nuova nextStoryId
fs.readdirSync('stories').forEach((f) => {
    matches = f.match(/(\d+)/);
    if(matches)
    {
        nextStoryId = Math.max(nextStoryId, Number(matches[0]) + 1);
    }
});

app.listen(port, function() {});

