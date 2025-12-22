'use client';

import { useState } from 'react';
import { playGoogleTTS, THAI_VOICES } from '../lib/google-tts';

/**
 * Component สำหรับทดสอบ Google TTS
 * สามารถใช้ในการทดสอบเสียงต่างๆ ก่อนใช้งานจริง
 */
export default function TTSTest() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<keyof typeof THAI_VOICES>('STANDARD_A');
  const [testText, setTestText] = useState('ขอเชิญหมายเลข 1 2 3 ที่โต๊ะซักประวัติ 1 ค่ะ');

  const handlePlay = async () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    try {
      const success = await playGoogleTTS({
        text: testText,
        language: 'th-TH',
        voice: THAI_VOICES[selectedVoice],
        speed: 0.6,
        pitch: 1.0,
        minDurationSec: 1,
      });
      if (!success) {
        alert('ไม่สามารถเล่นเสียงได้ โปรดลองอีกครั้ง');
      }
    } catch (error) {
      console.error('Error playing TTS:', error);
      alert('ไม่สามารถเล่นเสียงได้ โปรดลองอีกครั้ง');
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      margin: '20px',
      maxWidth: '600px'
    }}>
      <h3>ทดสอบ Google Text-to-Speech</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="testText" style={{ display: 'block', marginBottom: '5px' }}>
          ข้อความทดสอบ:
        </label>
        <textarea
          id="testText"
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          style={{
            width: '100%',
            height: '80px',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="voiceSelect" style={{ display: 'block', marginBottom: '5px' }}>
          เลือกเสียง:
        </label>
        <select
          id="voiceSelect"
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value as keyof typeof THAI_VOICES)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value={THAI_VOICES.STANDARD_A}>Standard A (ผู้ชาย)</option>
          <option value={THAI_VOICES.STANDARD_B}>Standard B (ผู้หญิง)</option>
          <option value={THAI_VOICES.STANDARD_C}>Standard C (ผู้ชาย สำเนียงต่าง)</option>
          <option value={THAI_VOICES.STANDARD_D}>Standard D (ผู้หญิง สำเนียงต่าง)</option>
          <option value={THAI_VOICES.NEURAL_A}>Neural A (ผู้ชาย)</option>
          <option value={THAI_VOICES.NEURAL_B}>Neural B (ผู้หญิง)</option>
          <option value={THAI_VOICES.NEURAL_C}>Neural C (ผู้ชาย สำเนียงต่าง)</option>
          <option value={THAI_VOICES.NEURAL_D}>Neural D (ผู้หญิง สำเนียงต่าง)</option>
        </select>
      </div>

      <button
        onClick={handlePlay}
        disabled={isPlaying}
        style={{
          padding: '10px 20px',
          backgroundColor: isPlaying ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isPlaying ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {isPlaying ? 'กำลังเล่น...' : 'เล่นเสียง'}
      </button>

      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        <p><strong>หมายเหตุ:</strong></p>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>ต้องตั้งค่า Google TTS API Key ในไฟล์ .env.local</li>
          <li>Neural voices จะให้เสียงที่ชัดเจนกว่ามาตรฐาน</li>
        </ul>
      </div>
    </div>
  );
}
