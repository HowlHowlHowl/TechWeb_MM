var http = require('http');
var url = require('url');
var fs = require('fs');

http.createServer(
function (req, res) {
    var q = url.parse(req.url, true);
    switch (q.pathname) {
        case "/player.html":
            fs.readFile("player.html", function(err, data) {
                if(err) {
                    res.writeHead(404, {'Content-Type': 'text/html'});
                    return res.end("<h1>404 Not Found</h1>");
                }
                
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                return res.end();
            });
            break;
        
        default:
            fs.readFile("." + q.pathname, function(err, data) {
                if(err) {
                    res.writeHead(404, {'Content-Type': 'text/html'});
                    return res.end("<h1>404 Not Found</h1>");
                }
                
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                return res.end();
            });
            break;
    }
}).listen(8000);
