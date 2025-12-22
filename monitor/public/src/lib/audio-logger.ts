/**
 * Audio Logger - บันทึก log การเล่นไฟล์เสียง
 */

interface AudioLogData {
  screenId: string;
  vn?: string;
  action: 'load_start' | 'load_success' | 'load_error' | 'play_start' | 'play_end' | 'play_error';
  audioUrl: string;
  message?: string;
  error?: string;
}

export async function logAudioEvent(data: AudioLogData): Promise<void> {
  try {
    const logData = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    // ส่ง log ไปที่ API (ไม่ต้องรอ response)
    fetch('/api/audio-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData),
    }).catch((error) => {
      // Silent fail - ไม่ต้องแสดง error ถ้า log ไม่สำเร็จ
      console.warn('[AudioLogger] Failed to save log:', error);
    });
  } catch (error) {
    // Silent fail
    console.warn('[AudioLogger] Error logging audio event:', error);
  }
}

