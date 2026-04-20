'use strict';

try { require('dotenv').config(); } catch (_) {}

const http    = require('node:http');
const handler = require('./api/index.js');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  handler(req, res).catch((err) => {
    console.error('Unhandled error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Example: http://localhost:${PORT}/api?username=vercel&repo=next.js&theme=dark`);
});
