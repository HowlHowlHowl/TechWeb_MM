var fs = require('fs');
var path = require('path');
var formidable = require('formidable');
var md5file = require('md5-file');
var process = require('process');

module.exports = function(app) {
    
    //Tabella di file gia' uploadati
    var uploaded_files = [];
    
    //Aggiorna la tabella dei file uploadati
    fs.readdirSync('public/uploads/').forEach((f) => {
        let p = path.join('public/uploads', f);
        let hash = md5file.sync(p);
        uploaded_files.push({path: p, hash: hash});
    });
    
    app.post('/upload', function(req, res) {
        let form = new formidable.IncomingForm({ 
          uploadDir: 'public/uploads/',
          keepExtensions: true
        });
        
        form.parse(req);
        
        form.on('file', (name, file) => {
            let dir = "public/uploads/";
            md5file(file.path).then( (hash) => {
                //Se il file e' gia' presente sul server
                for(let u of uploaded_files) {
                    if(u.hash == hash) {
                        try {
                            let oldfile = fs.readFileSync(u.path);
                            let newfile = fs.readFileSync(file.path);
                            
                            if(oldfile.equals(newfile)) 
                            {                       
                                fs.unlinkSync(file.path);
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify({url: "/" + u.path}));
                                res.end();
                                return;
                            }
                        } catch(err) {
                            //If we fail to compare we fall back to create a new file
                        }
                    }
                }
                
                //Altrimenti salva il file
                let save_path = dir + name;
                if(fs.existsSync(save_path)) {
                    let suffix = 1;
                    let ext = path.extname(file.name);
                    let basename = path.basename(file.name, ext);
                    do {
                        new_path = dir + basename + "_" + suffix + ext;
                        suffix++;
                    } while(fs.existsSync(new_path));
                    save_path = new_path;
                }
                
                fs.rename(file.path, save_path, function (err) {
                    if(err) {
                        res.status(500).send();
                    } else {
                        uploaded_files.push({path: save_path, hash: hash});
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.write(JSON.stringify({url: "/" + save_path}));
                        res.end();
                    }
                });
            });
            
        });
        
    });
};