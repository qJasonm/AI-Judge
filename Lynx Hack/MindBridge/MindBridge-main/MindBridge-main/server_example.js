// MindBridge Server
//
// SETUP:
//   1. Paste your Anthropic API key below (starts with sk-ant-)
//   2. In VS Code terminal run:  node server.js
//   3. Open Chrome and go to:   http://localhost:3000
//      IMPORTANT: always use the localhost link, never open the HTML file directly

const API_KEY = 'RANDOM_API_KEY'; // paste your sk-ant-... key here

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Serve mindbridge.html when browser visits http://localhost:3000
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const htmlPath = path.join(__dirname, 'mindbridge.html');
    fs.readFile(htmlPath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('mindbridge.html not found - make sure both files are in the same folder');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // Forward AI agent requests to Anthropic with your hidden key
  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const preview = (payload.messages?.[0]?.content || '').slice(0, 60);
        console.log('[Agent call]', preview + '...');

        const postData = JSON.stringify(payload);

        const options = {
          hostname: 'api.anthropic.com',
          path: '/v1/messages',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const apiReq = https.request(options, (apiRes) => {
          let responseData = '';
          apiRes.on('data', chunk => { responseData += chunk; });
          apiRes.on('end', () => {
            try {
              const parsed = JSON.parse(responseData);
              if (parsed.error) {
                console.error('[Anthropic error]', parsed.error.message);
              } else {
                const text = parsed.content?.[0]?.text || '';
                console.log('[Agent done]', text.slice(0, 80) + '...');
              }
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(responseData);
            } catch (e) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: { message: 'Parse error' } }));
            }
          });
        });

        apiReq.on('error', (err) => {
          console.error('[Network error]', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: { message: err.message } }));
        });

        apiReq.write(postData);
        apiReq.end();

      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Bad request' } }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log('');
  console.log('  MindBridge is running!');
  console.log('');
  console.log('  Open this in Chrome --> http://localhost:3000');
  console.log('');
  if (API_KEY === 'YOUR_KEY_HERE') {
    console.log('  ACTION NEEDED: open server.js and paste your sk-ant-... key on line 9');
  } else {
    console.log('  Anthropic key loaded. You are good to go!');
  }
  console.log('');
});
