import { NextResponse } from 'next/server';
import { appendFile, mkdir } from 'fs/promises';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE_PATH = path.join(LOG_DIR, 'tts-debug.log');

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = typeof body.message === 'string' ? body.message : '';
    const context = typeof body.context === 'string' ? body.context : 'unknown';
    const timestamp = typeof body.timestamp === 'string' ? body.timestamp : new Date().toISOString();

    if (!message) {
      return NextResponse.json({ success: false, error: 'Missing message' }, { status: 400 });
    }

    await mkdir(LOG_DIR, { recursive: true });
    const logEntry = `${timestamp} [${context}] ${message}\n`;
    await appendFile(LOG_FILE_PATH, logEntry, 'utf8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to write log file:', error);
    return NextResponse.json({ success: false, error: 'internal_error' }, { status: 500 });
  }
}
