'use client';

import { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { isAudioContextUnlocked, forceUnlockAudioContext } from '../lib/audio-unlock';

interface AudioUnlockOverlayProps {
  onUnlocked?: () => void;
}

export default function AudioUnlockOverlay({ onUnlocked }: AudioUnlockOverlayProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // ตรวจสอบว่า audio context ถูก unlock แล้วหรือยัง
    const checkUnlockStatus = () => {
      const unlocked = isAudioContextUnlocked();
      setIsUnlocked(unlocked);
      setIsChecking(false);
      
      if (unlocked && onUnlocked) {
        onUnlocked();
      }
    };

    // ตรวจสอบทันที
    checkUnlockStatus();

    // ตรวจสอบทุก 500ms
    const interval = setInterval(checkUnlockStatus, 500);

    return () => clearInterval(interval);
  }, [onUnlocked]);

  const handleUnlock = () => {
    forceUnlockAudioContext();
    setTimeout(() => {
      const unlocked = isAudioContextUnlocked();
      setIsUnlocked(unlocked);
      if (unlocked && onUnlocked) {
        onUnlocked();
      }
    }, 100);
  };

  // ไม่แสดง overlay ถ้ายังไม่ได้ unlock หรือกำลังตรวจสอบ
  if (isUnlocked || isChecking) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={handleUnlock}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border-2 border-blue-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-blue-100">
              <Volume2 className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold mb-4" style={{ color: '#043566' }}>
            อนุญาตเสียงสำหรับระบบเรียกคิว
          </h3>
          
          <p className="text-slate-600 mb-2">
            เพื่อให้ระบบสามารถเล่นเสียงเรียกคิวอัตโนมัติ
          </p>
          
          <p className="text-sm text-slate-500 mb-6">
            กรุณาคลิกปุ่มด้านล่าง หรือคลิกที่หน้าจอเพื่ออนุญาตการเล่นเสียง
          </p>

          <button
            onClick={handleUnlock}
            className="w-full px-6 py-4 text-white rounded-xl hover:opacity-90 transition-all duration-200 font-medium text-lg shadow-lg hover:shadow-xl"
            style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}
          >
            <div className="flex items-center justify-center space-x-2">
              <Volume2 className="w-5 h-5" />
              <span>อนุญาตเสียง</span>
            </div>
          </button>

          <p className="text-xs text-slate-400 mt-4">
            คลิกที่หน้าจอข้างนอกเพื่ออนุญาตเสียง
          </p>
        </div>
      </div>
    </div>
  );
}

