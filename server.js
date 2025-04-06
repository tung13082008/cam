const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    let data = null;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.log('Invalid JSON:', message);
      return;
    }

    const { type, to, from, payload } = data;

    if (type === 'register') {
      clients.set(from, ws);
      console.log(`${from} registered`);
    }

    if (to && clients.has(to)) {
      clients.get(to).send(JSON.stringify({ type, from, payload }));
    }
  });

  ws.on('close', () => {
    for (const [user, socket] of clients.entries()) {
      if (socket === ws) clients.delete(user);
    }
  });
});

app.use(express.static(path.join(__dirname, 'public')));

server.listen(process.env.PORT || 3000, () => {
  console.log('Server is running on port', process.env.PORT || 3000);
});
