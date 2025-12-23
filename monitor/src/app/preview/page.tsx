'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, Rows, AlertTriangle, ArrowRight, Eye, Play, Square } from 'lucide-react';

export default function PreviewPage() {
  const router = useRouter();
  const [playingNotice, setPlayingNotice] = useState(false);
  const [playingDescription, setPlayingDescription] = useState(false);
  const [playingNoticeFemale, setPlayingNoticeFemale] = useState(false);
  const [playingDescriptionFemale, setPlayingDescriptionFemale] = useState(false);
  const noticeAudioRef = useRef<HTMLAudioElement>(null);
  const descriptionAudioRef = useRef<HTMLAudioElement>(null);
  const noticeFemaleAudioRef = useRef<HTMLAudioElement>(null);
  const descriptionFemaleAudioRef = useRef<HTMLAudioElement>(null);

  const monitorTypes = [
    {
      key: 'single',
      title: 'Single Monitor',
      description: 'จอคอลัมน์เดียว เหมาะสำหรับการติดตั้งจุดบริการแบบ Standalone',
      icon: <Monitor className="h-8 w-8 text-sky-400" />,
    },
    {
      key: 'duo',
      title: 'Duo Monitor',
      description: 'แยกข้อมูลเป็นสองฝั่ง เหมาะกับพื้นที่กลางห้องรอ',
      icon: <Rows className="h-8 w-8 text-sky-400" />,
    },
    {
      key: 'er',
      title: 'ER Monitor',
      description: 'รองรับสถานี ER-A ถึง ER-E พร้อมแจ้งเตือนพิเศษ',
      icon: <AlertTriangle className="h-8 w-8 text-sky-400" />,
    },
    {
      key: 'swap',
      title: 'Swap Monitor',
      description: 'สลับหน้าจออัตโนมัติระหว่างหลายหน้าจอ',
      icon: <ArrowRight className="h-8 w-8 text-sky-400" />,
    },
  ];

  const handleTypeSelect = (type: string) => {
    router.push(`/preview/${type}`);
  };

  const handlePlayNotice = () => {
    if (noticeAudioRef.current) {
      if (playingNotice) {
        noticeAudioRef.current.pause();
        noticeAudioRef.current.currentTime = 0;
        setPlayingNotice(false);
      } else {
        noticeAudioRef.current.play();
        setPlayingNotice(true);
      }
    }
  };

  const handlePlayDescription = () => {
    if (descriptionAudioRef.current) {
      if (playingDescription) {
        descriptionAudioRef.current.pause();
        descriptionAudioRef.current.currentTime = 0;
        setPlayingDescription(false);
      } else {
        descriptionAudioRef.current.play();
        setPlayingDescription(true);
      }
    }
  };

  const handlePlayNoticeFemale = () => {
    if (noticeFemaleAudioRef.current) {
      if (playingNoticeFemale) {
        noticeFemaleAudioRef.current.pause();
        noticeFemaleAudioRef.current.currentTime = 0;
        setPlayingNoticeFemale(false);
      } else {
        noticeFemaleAudioRef.current.play();
        setPlayingNoticeFemale(true);
      }
    }
  };

  const handlePlayDescriptionFemale = () => {
    if (descriptionFemaleAudioRef.current) {
      if (playingDescriptionFemale) {
        descriptionFemaleAudioRef.current.pause();
        descriptionFemaleAudioRef.current.currentTime = 0;
        setPlayingDescriptionFemale(false);
      } else {
        descriptionFemaleAudioRef.current.play();
        setPlayingDescriptionFemale(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-slate-50" style={{ backgroundImage: 'linear-gradient(to bottom right, #ffffff, #f8fafc, #f1f5f9)' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b" style={{ borderColor: '#e2e8f0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl shadow-md" style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}>
                <Eye className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: '#043566' }}>Preview หน้าจอแสดงผล</h1>
                <p className="text-sm text-slate-600 mt-1">เลือกประเภทหน้าจอเพื่อดูตัวอย่าง</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border p-8" style={{ borderColor: '#e2e8f0' }}>
          {/* Type Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-4">เลือกประเภทหน้าจอ</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {monitorTypes.map((type) => (
                <button
                  key={type.key}
                  onClick={() => handleTypeSelect(type.key)}
                  className="p-6 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left bg-white"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {type.icon}
                    <h3 className="text-lg font-semibold" style={{ color: '#043566' }}>
                      {type.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Audio Preview Section */}
          <div className="border-t pt-6 mt-8" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#043566' }}>
              ตัวอย่างไฟล์เสียง
            </h3>
            
            <div className="space-y-4">
              {/* Preview notice_text */}
              <div className="bg-slate-50 p-4 rounded-xl border" style={{ borderColor: '#e2e8f0' }}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-semibold" style={{ color: '#043566' }}>
                    Preview notice_text
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePlayNotice}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                      style={{ 
                        background: playingNotice ? 'linear-gradient(135deg, #dc2626, #ef4444)' : 'linear-gradient(135deg, #043566, #065a9e)',
                        color: 'white'
                      }}
                    >
                      {playingNotice ? (
                        <>
                          <Square className="w-4 h-4" />
                          <span>หยุด (ผู้ชาย)</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>ผู้ชาย</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handlePlayNoticeFemale}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                      style={{ 
                        background: playingNoticeFemale ? 'linear-gradient(135deg, #dc2626, #ef4444)' : 'linear-gradient(135deg, #ec4899, #f472b6)',
                        color: 'white'
                      }}
                    >
                      {playingNoticeFemale ? (
                        <>
                          <Square className="w-4 h-4" />
                          <span>หยุด (ผู้หญิง)</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>ผู้หญิง</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-600">ตัวอย่าง: &ldquo;ขออณุญาติแทรกคิว&rdquo;</p>
                <audio
                  ref={noticeAudioRef}
                  src="https://voice.aztecthstudio.com/audio/cache/male/ขออณุญาติแทรกคิว.mp3"
                  onEnded={() => setPlayingNotice(false)}
                  style={{ display: 'none' }}
                />
                <audio
                  ref={noticeFemaleAudioRef}
                  src="https://voice.aztecthstudio.com/audio/cache/female/ขออณุญาติแทรกคิว.mp3"
                  onEnded={() => setPlayingNoticeFemale(false)}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Preview Description */}
              <div className="bg-slate-50 p-4 rounded-xl border" style={{ borderColor: '#e2e8f0' }}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-semibold" style={{ color: '#043566' }}>
                    Preview Description
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePlayDescription}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                      style={{ 
                        background: playingDescription ? 'linear-gradient(135deg, #dc2626, #ef4444)' : 'linear-gradient(135deg, #043566, #065a9e)',
                        color: 'white'
                      }}
                    >
                      {playingDescription ? (
                        <>
                          <Square className="w-4 h-4" />
                          <span>หยุด (ผู้ชาย)</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>ผู้ชาย</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handlePlayDescriptionFemale}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                      style={{ 
                        background: playingDescriptionFemale ? 'linear-gradient(135deg, #dc2626, #ef4444)' : 'linear-gradient(135deg, #ec4899, #f472b6)',
                        color: 'white'
                      }}
                    >
                      {playingDescriptionFemale ? (
                        <>
                          <Square className="w-4 h-4" />
                          <span>หยุด (ผู้หญิง)</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>ผู้หญิง</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-600">ตัวอย่าง: &ldquo;ผู้ป่วยฉุกเฉินหนัก&rdquo;</p>
                <audio
                  ref={descriptionAudioRef}
                  src="https://voice.aztecthstudio.com/audio/cache/male/ผู้ป่วยฉุกเฉินหนัก.mp3"
                  onEnded={() => setPlayingDescription(false)}
                  style={{ display: 'none' }}
                />
                <audio
                  ref={descriptionFemaleAudioRef}
                  src="https://voice.aztecthstudio.com/audio/cache/female/ผู้ป่วยฉุกเฉินหนัก.mp3"
                  onEnded={() => setPlayingDescriptionFemale(false)}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

