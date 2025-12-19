// /websocket-server.js

import WebSocket, { WebSocketServer } from 'ws';
import { connectDb } from './db.js';

import fetchErData from './handlers/er.js';
import fetchSingleData from './handlers/single.js';
import fetchDuoData from './handlers/duo.js';
import fetchEr2Data from './handlers/er_2.js';

const wss = new WebSocketServer({ port: 1100 });

// Connect to the database when the server starts
connectDb().catch(err => {
    console.error("Failed to connect to the database on startup. The application will continue to run, but database queries will fail until a connection is established.", err);
});


const getBangkokDate = () => {
  return new Date()
    .toLocaleString("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .split(",")[0];
};

wss.on('connection', ws => {
  console.log('Client connected');

  ws.on('message', message => {
    try {
      const data = JSON.parse(message);
      // Store setting_id and query_type on the WebSocket connection object
      if (data.type === 'register') {
        if (data.id) {
            ws.setting_id = data.id;
            console.log(`Client registered for setting_id: ${ws.setting_id}`);
        }
        if (data.query_type && ['er', 'er_2', 'single', 'duo'].includes(data.query_type)) {
            ws.query_type = data.query_type;
            console.log(`Client registered for query_type: ${ws.query_type}`);
        }
      }
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

setInterval(async () => {
  const today = getBangkokDate();

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN && client.setting_id && client.query_type) {
      switch (client.query_type) {
        case 'er':
          await fetchErData(client, today);
          break;
        case 'single':
          await fetchSingleData(client, today);
          break;
        case 'duo':
          await fetchDuoData(client, today);
          break;
        case 'er_2':
          await fetchEr2Data(client, today);
          break;
        default:
          // This case should ideally not be reached due to the check in 'on message'
          console.log(`Unknown query_type: ${client.query_type}`);
      }
    }
  }
}, 2000);

console.log('WebSocket server is running on ws://localhost:1010');