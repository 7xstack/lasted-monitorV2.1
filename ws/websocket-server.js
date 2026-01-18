// /websocket-server.js

import WebSocket, { WebSocketServer } from 'ws';
import { connectDb } from './db.js';
import logger, { setLogViewers, info, error, warn, log } from './logger.js';

import fetchErData from './handlers/er.js';
import fetchSingleData from './handlers/single.js';
import fetchDuoData from './handlers/duo.js';
import fetchEr2Data from './handlers/er_2.js';
import fetchQueueData from './handlers/queue.js';
import fetchDrugData from './handlers/drug.js';
import fetchTripleData from './handlers/triple.js';

const wss = new WebSocketServer({ port: 1100 });

// Store log viewer clients separately
const logViewers = new Set();

// ตั้งค่า log viewers สำหรับ logger
setLogViewers(logViewers);

// Connect to the database when the server starts
connectDb().catch(err => {
    error("Failed to connect to the database on startup. The application will continue to run, but database queries will fail until a connection is established.", err);
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
  info('Client connected');

  ws.on('message', message => {
    try {
      const data = JSON.parse(message);
      
      // Check if this is a log viewer
      if (data.type === 'log_viewer') {
        logViewers.add(ws);
        ws.isLogViewer = true;
        info('Log viewer connected');
        return;
      }
      
      // Store setting_id and query_type on the WebSocket connection object
      if (data.type === 'register') {
        if (data.id) {
            ws.setting_id = data.id;
            info(`Client registered for setting_id: ${ws.setting_id}`);
        }
        if (data.query_type && ['er', 'er_2', 'single', 'duo', 'queue', 'drug'].includes(data.query_type)) {
        if (data.query_type && ['er', 'er_2', 'single', 'duo', 'triple'].includes(data.query_type)) {
            ws.query_type = data.query_type;
            info(`Client registered for query_type: ${ws.query_type}`);
        }
      }
    } catch (e) {
      error('Failed to parse message:', e);
    }
  });

  ws.on('close', () => {
    if (ws.isLogViewer) {
      logViewers.delete(ws);
      info('Log viewer disconnected');
    } else {
      info('Client disconnected');
    }
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
        case 'queue':
          await fetchQueueData(client, today);
          break;
        case 'drug':
          await fetchDrugData(client, today);
        case 'triple':
          await fetchTripleData(client, today);
          break;
        default:
          // This case should ideally not be reached due to the check in 'on message'
          warn(`Unknown query_type: ${client.query_type}`);
      }
    }
  }
}, 2000);

info('WebSocket server is running on ws://localhost:1100');