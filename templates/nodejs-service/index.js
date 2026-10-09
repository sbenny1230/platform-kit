const http = require('http');
const port = process.env.PORT || 3000;

http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Hello, World!\n');
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found\n');
    }
}).listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});