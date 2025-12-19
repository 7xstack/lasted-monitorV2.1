/**
 * Utility สำหรับ unlock audio context จาก user interaction
 * ต้องเรียกใช้ก่อนที่จะสามารถเล่นเสียงจาก WebSocket หรือ event handlers อื่นๆ ได้
 * รองรับทั้ง Audio() API และ Howler.js
 */

import { Howler } from 'howler';

let audioContextUnlocked = false;
let unlockListenersAttached = false;

/**
 * Unlock audio context โดยการเล่นเสียงเงียบๆ จากการมี user interaction
 * ควรเรียกใช้เมื่อ component mount หรือเมื่อผู้ใช้มี interaction แรก
 * รองรับทั้ง Audio() API และ Howler.js
 */
export function unlockAudioContext(): void {
  if (unlockListenersAttached) {
    return;
  }

  unlockListenersAttached = true;

  const performUnlock = () => {
    if (audioContextUnlocked) {
      return;
    }

    try {
      // วิธีที่ 1: ใช้ Howler.ctx เพื่อ unlock audio context โดยตรง
      if (typeof Howler !== 'undefined' && Howler.ctx) {
        try {
          // สร้าง buffer source ที่เงียบ
          const source = Howler.ctx.createBufferSource();
          const buffer = Howler.ctx.createBuffer(1, 1, 22050);
          source.buffer = buffer;
          source.connect(Howler.ctx.destination);
          source.start(0);
          source.stop(Howler.ctx.currentTime + 0.001);
          
          audioContextUnlocked = true;
          // ลบ event listeners
          document.removeEventListener('click', performUnlock, true);
          document.removeEventListener('touchstart', performUnlock, true);
          document.removeEventListener('keydown', performUnlock, true);
          document.removeEventListener('mousedown', performUnlock, true);
          document.removeEventListener('pointerdown', performUnlock, true);
          return;
        } catch {
          // ถ้า Howler.ctx ยังไม่ได้สร้าง ให้ใช้วิธีอื่น
          console.warn('Howler context not ready, using fallback');
        }
      }

      // วิธีที่ 2: ใช้ Audio() API สำหรับ unlock
      const audio = new Audio();
      audio.muted = true;
      audio.volume = 0;
      
      // สร้างเสียงว่างๆ (1 sample)
      const arrayBuffer = new ArrayBuffer(44);
      const view = new DataView(arrayBuffer);
      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      writeString(0, 'RIFF');
      view.setUint32(4, 36, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, 22050, true);
      view.setUint32(28, 22050, true);
      view.setUint16(32, 1, true);
      view.setUint16(34, 8, true);
      writeString(36, 'data');
      view.setUint32(40, 0, true);

      const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      audio.src = url;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            audioContextUnlocked = true;
            audio.pause();
            URL.revokeObjectURL(url);
            audio.remove();
            // ลบ event listeners
            document.removeEventListener('click', performUnlock, true);
            document.removeEventListener('touchstart', performUnlock, true);
            document.removeEventListener('keydown', performUnlock, true);
            document.removeEventListener('mousedown', performUnlock, true);
            document.removeEventListener('pointerdown', performUnlock, true);
          })
          .catch(() => {
            URL.revokeObjectURL(url);
            // Ignore errors during unlock attempt
          });
      }
    } catch {
      console.warn('Failed to unlock audio context');
    }
  };

  // เพิ่ม listeners สำหรับ user interactions
  document.addEventListener('click', performUnlock, { capture: true });
  document.addEventListener('touchstart', performUnlock, { capture: true });
  document.addEventListener('keydown', performUnlock, { capture: true });
  document.addEventListener('mousedown', performUnlock, { capture: true });
  document.addEventListener('pointerdown', performUnlock, { capture: true });
}

/**
 * ตรวจสอบว่า audio context ถูก unlock แล้วหรือยัง
 */
export function isAudioContextUnlocked(): boolean {
  return audioContextUnlocked;
}

/**
 * Force unlock audio context (ใช้เมื่อต้องการ unlock ทันที)
 * ควรเรียกใช้จาก user interaction handler เท่านั้น
 */
export function forceUnlockAudioContext(): void {
  try {
    // ใช้ Howler.ctx ถ้ามี
    if (typeof Howler !== 'undefined' && Howler.ctx) {
      if (Howler.ctx.state === 'suspended') {
        Howler.ctx.resume().then(() => {
          audioContextUnlocked = true;
        }).catch(() => {
          // Ignore errors
        });
      } else {
        // ถ้า context ไม่ได้ suspended ให้ unlock ด้วยวิธีอื่น
        try {
          const source = Howler.ctx.createBufferSource();
          const buffer = Howler.ctx.createBuffer(1, 1, 22050);
          source.buffer = buffer;
          source.connect(Howler.ctx.destination);
          source.start(0);
          source.stop(Howler.ctx.currentTime + 0.001);
          audioContextUnlocked = true;
          return;
        } catch {
          // Continue to Audio API fallback
        }
      }
    }
    
    // ใช้ Audio() API เป็น fallback
    const audio = new Audio();
    audio.muted = true;
    audio.volume = 0;
    
    // สร้างเสียงว่างๆ (1 sample)
    const arrayBuffer = new ArrayBuffer(44);
    const view = new DataView(arrayBuffer);
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 22050, true);
    view.setUint32(28, 22050, true);
    view.setUint16(32, 1, true);
    view.setUint16(34, 8, true);
    writeString(36, 'data');
    view.setUint32(40, 0, true);

    const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    audio.src = url;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          audioContextUnlocked = true;
          audio.pause();
          URL.revokeObjectURL(url);
          audio.remove();
        })
        .catch(() => {
          URL.revokeObjectURL(url);
          // Ignore errors
        });
    }
  } catch {
    console.warn('Failed to force unlock audio');
  }
}

