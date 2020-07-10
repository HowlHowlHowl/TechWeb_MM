var fs = require('fs');
var path = require('path');
var formidable = require('formidable');

module.exports = function(app) {
    var nextStoryId = 0;
       
    //Aggiorna la nuova nextStoryId
    fs.readdirSync('stories').forEach((f) => {
        matches = f.match(/(\d+)/);
        if (matches) {
            nextStoryId = Math.max(nextStoryId, Number(matches[0]) + 1);
        }
    });

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
            fs.writeFile("stories/story" + new_id + ".json", JSON.stringify(story, null, 2), function(err) {
                res.status(err ? 500 : 200).send();
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
                fs.writeFile(path, JSON.stringify(story, null, 2), function(err) {
                    res.status(err ? 500 : 200).send();
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
                            let story = JSON.parse(data);
                            story.id = new_id;
                            let path = "stories/story" + new_id + ".json";
                            fs.writeFile(path, JSON.stringify(story, null, 2), function(err) {
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
                            fs.writeFile(path, JSON.stringify(story, null, 2), function(err) {
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
    app.get('/stories/:id', function(req, res) {
        let id = req.params.id;
        let path = "stories/story" + id + ".json";
        fs.readFile(path, (err, data) => {
            if(!err) {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.write(data);
                return res.end();
            } else {
                res.status(400).send();
            }
        });
    });
};