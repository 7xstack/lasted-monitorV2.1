// HTTP Server สำหรับ serve หน้า log.html
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/log.html' : req.url;
  
  // ป้องกัน path traversal
  filePath = path.join(__dirname, filePath.replace(/^\/+/, ''));
  
  // ตรวจสอบว่าไฟล์อยู่ในโฟลเดอร์เดียวกัน
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // ตรวจสอบว่าไฟล์มีอยู่จริง
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('File not found');
    return;
  }

  // อ่านไฟล์
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Error reading file');
      return;
    }

    // กำหนด Content-Type
    const ext = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.log': 'text/plain'
    };

    res.writeHead(200, {
      'Content-Type': contentTypes[ext] || 'text/plain'
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n📋 Log Viewer Server กำลังทำงานที่:`);
  console.log(`   http://localhost:${PORT}/log.html\n`);
  console.log(`📁 ดูไฟล์ logs ได้ที่:`);
  console.log(`   http://localhost:${PORT}/log/combined-*.log`);
  console.log(`   http://localhost:${PORT}/log/error-*.log\n`);
});

