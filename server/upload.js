module.exports = function(app) {
    app.post('/upload', function(req, res) {
        let form = new formidable.IncomingForm();
        form.parse(req);
        
        form.on('fileBegin', (name, file) => {
            let dir = "public/uploads/";
            let save_path = dir + file.name;
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
            file.path = save_path;
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({url: "/" + save_path}));
            res.end();
        });
        
    });
};