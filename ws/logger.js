import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// กำหนดรูปแบบ log
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase().padEnd(5)}] ${message}`;
    
    // เพิ่ม stack trace ถ้ามี
    if (stack) {
      log += `\n${stack}`;
    }
    
    // เพิ่ม metadata ถ้ามี
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

// สร้าง transport สำหรับ error log (แยกไฟล์)
const errorFileTransport = new DailyRotateFile({
  filename: path.join(__dirname, 'log', 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  format: logFormat,
  maxSize: '20m',
  maxFiles: '14d', // เก็บไฟล์ไว้ 14 วัน
  zippedArchive: true, // บีบอัดไฟล์เก่า
});

// สร้าง transport สำหรับ combined log (ทุก level)
const combinedFileTransport = new DailyRotateFile({
  filename: path.join(__dirname, 'log', 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  format: logFormat,
  maxSize: '20m',
  maxFiles: '30d', // เก็บไฟล์ไว้ 30 วัน
  zippedArchive: true,
});

// สร้าง logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // ตั้งค่า level จาก env หรือ default เป็น 'info'
  format: logFormat,
  defaultMeta: { service: 'websocket-server' },
  transports: [
    errorFileTransport,
    combinedFileTransport,
  ],
  // ไม่ exit process เมื่อเกิด error
  exitOnError: false,
});

// ถ้าไม่ใช่ production ให้แสดง log บน console ด้วย
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} ${level} ${message}`;
        if (stack) {
          log += `\n${stack}`;
        }
        if (Object.keys(meta).length > 0) {
          log += ` ${JSON.stringify(meta)}`;
        }
        return log;
      })
    )
  }));
}

// Export logger และฟังก์ชันสำหรับ WebSocket broadcast
export default logger;

// เก็บ reference ของ log viewers สำหรับ WebSocket
let logViewers = new Set();

export function setLogViewers(viewers) {
  logViewers = viewers;
}

// สร้าง custom transport สำหรับ WebSocket broadcasting
class WebSocketTransport extends winston.Transport {
  constructor(options) {
    super(options);
    this.name = 'websocket';
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // แปลง info object เป็น message string
    let messageStr = info.message;
    
    // ถ้ามี stack trace ให้เพิ่มเข้าไป
    if (info.stack) {
      messageStr += `\n${info.stack}`;
    }

    // ส่งไปยัง WebSocket viewers
    if (logViewers && logViewers.size > 0) {
      const logMessage = JSON.stringify({
        type: 'log',
        level: info.level,
        message: messageStr,
        timestamp: info.timestamp || new Date().toISOString()
      });

      logViewers.forEach(viewer => {
        if (viewer.readyState === 1) { // WebSocket.OPEN
          try {
            viewer.send(logMessage);
          } catch (e) {
            // ลบ connection ที่เสีย
            logViewers.delete(viewer);
          }
        }
      });
    }

    // เรียก callback เพื่อบอก winston ว่า log เสร็จแล้ว
    callback();
  }
}

// เพิ่ม WebSocket transport เข้าไปใน logger
logger.add(new WebSocketTransport());

// Export convenience methods
export const log = logger.info.bind(logger);
export const error = logger.error.bind(logger);
export const warn = logger.warn.bind(logger);
export const info = logger.info.bind(logger);
export const debug = logger.debug.bind(logger);
