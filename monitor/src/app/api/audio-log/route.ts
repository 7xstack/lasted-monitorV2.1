import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'audio.log');

// สร้าง directory สำหรับ log ถ้ายังไม่มี
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

interface AudioLogData {
  screenId: string;
  vn?: string;
  action: 'load_start' | 'load_success' | 'load_error' | 'play_start' | 'play_end' | 'play_error';
  audioUrl: string;
  message?: string;
  error?: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: AudioLogData = await request.json();
    
    const logEntry = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    
    // บันทึกลงไฟล์แบบ append
    fs.appendFileSync(LOG_FILE, logLine, 'utf8');
    
    return NextResponse.json({
      success: true,
      message: 'Log saved successfully'
    });
  } catch (error: unknown) {
    console.error('Error saving audio log:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to save log',
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const screenId = searchParams.get('screenId');
    const vn = searchParams.get('vn');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    if (!fs.existsSync(LOG_FILE)) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No log file found'
      });
    }

    const logContent = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = logContent.split('\n').filter(line => line.trim());
    
    let logs: AudioLogData[] = lines
      .map(line => {
        try {
          return JSON.parse(line) as AudioLogData;
        } catch {
          return null;
        }
      })
      .filter((log): log is AudioLogData => log !== null);

    // Filter by screenId and vn if provided
    if (screenId) {
      logs = logs.filter(log => log.screenId === screenId);
    }
    if (vn) {
      logs = logs.filter(log => log.vn === vn);
    }

    // Sort by timestamp descending (newest first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit results
    const limitedLogs = logs.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: limitedLogs,
      total: logs.length,
      returned: limitedLogs.length
    });
  } catch (error: unknown) {
    console.error('Error reading audio log:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to read log',
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

