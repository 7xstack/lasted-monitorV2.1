'use client';

import { useState, use, useEffect, useRef } from 'react';
import styles from './page.module.css';
import { useNetworkError } from '../../../components/NetworkErrorProvider';
import Header from './Header';
import InterviewTable from './InterviewTable';
import InterviewTableRight from './InterviewTableRight';
import SkippedQueueBar from './SkippedQueueBar';
import { Setting, VisitInfo } from './types';
import CallPopup from './CallPopup';
import AudioUnlockOverlay from '../../../components/AudioUnlockOverlay';
import { Howl } from 'howler';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { unlockAudioContext, isAudioContextUnlocked } from '../../../lib/audio-unlock';
// import { logAudioEvent } from '../../../lib/audio-logger';

const VOICE_DOMAIN = 'https://voice.aztecthstudio.com';

const playVoicePlaylist = (voicePaths: string[], currentSoundRef: React.MutableRefObject<Howl | null>): Promise<void> => {
  return new Promise((resolve) => {
    if (!voicePaths || voicePaths.length === 0) {
      resolve();
      return;
    }

    // หยุดเสียงเก่าก่อนเล่นเสียงใหม่
    if (currentSoundRef.current) {
      currentSoundRef.current.stop();
      currentSoundRef.current.unload();
      currentSoundRef.current = null;
    }

    let currentIndex = 0;
    
    const playNext = () => {
      if (currentIndex >= voicePaths.length) {
        currentSoundRef.current = null;
        resolve();
        return;
      }

      const path = voicePaths[currentIndex];
      const fullUrl = `${VOICE_DOMAIN}${path}`;
      console.log(`[Audio] กำลังโหลดไฟล์เสียง: ${fullUrl}`);
      
      // Log: load_start
      // logAudioEvent({
      //   screenId,
      //   vn,
      //   action: 'load_start',
      //   audioUrl: fullUrl,
      //   message: `กำลังโหลดไฟล์เสียง: ${path}`
      // });
      
      const sound = new Howl({
        src: [fullUrl],
        html5: true,
        preload: 'metadata',
        onload: () => {
          console.log(`[Audio] โหลดไฟล์เสียงสำเร็จ: ${fullUrl}`);
          // Log: load_success
          // logAudioEvent({
          //   screenId,
          //   vn,
          //   action: 'load_success',
          //   audioUrl: fullUrl,
          //   message: `โหลดไฟล์เสียงสำเร็จ: ${path}`
          // });
        },
        onend: () => {
          console.log(`[Audio] เล่นไฟล์เสียงเสร็จสิ้น: ${fullUrl}`);
          // Log: play_end
          // logAudioEvent({
          //   screenId,
          //   vn,
          //   action: 'play_end',
          //   audioUrl: fullUrl,
          //   message: `เล่นไฟล์เสียงเสร็จสิ้น: ${path}`
          // });
          currentIndex++;
          playNext();
        },
        onloaderror: (id, err) => {
          console.error(`[Audio] เกิดข้อผิดพลาดในการโหลดไฟล์เสียง: ${fullUrl}`, err);
          // Log: load_error
          // logAudioEvent({
          //   screenId,
          //   vn,
          //   action: 'load_error',
          //   audioUrl: fullUrl,
          //   message: `เกิดข้อผิดพลาดในการโหลดไฟล์เสียง: ${path}`,
          //   error: err?.toString() || 'Unknown error'
          // });
          currentIndex++;
          playNext();
        },
        
        onplayerror: (id, err) => {
          console.error(`[Audio] เกิดข้อผิดพลาดในการเล่นไฟล์เสียง: ${fullUrl}`, err);
          // Log: play_error
          // logAudioEvent({
          //   screenId,
          //   vn,
          //   action: 'play_error',
          //   audioUrl: fullUrl,
          //   message: `เกิดข้อผิดพลาดในการเล่นไฟล์เสียง: ${path}`,
          //   error: err?.toString() || 'Unknown error'
          // });
          currentIndex++;
          playNext();
        }
      });
      
      currentSoundRef.current = sound;
      
      // Wait for sound to load before playing
      sound.once('load', () => {
        try {
          console.log(`[Audio] เริ่มเล่นไฟล์เสียง: ${fullUrl}`);
          // Log: play_start
          // logAudioEvent({
          //   screenId,
          //   vn,
          //   action: 'play_start',
          //   audioUrl: fullUrl,
          //   message: `เริ่มเล่นไฟล์เสียง: ${path}`
          // });
          const playId = sound.play();
          if (!playId) {
            // ถ้าเล่นไม่ได้ ให้ข้ามไปเสียงถัดไป
            console.warn(`[Audio] ไม่สามารถเล่นไฟล์เสียงได้: ${fullUrl}`);
            // logAudioEvent({
            //   screenId,
            //   vn,
            //   action: 'play_error',
            //   audioUrl: fullUrl,
            //   message: `ไม่สามารถเล่นไฟล์เสียงได้: ${path}`,
            //   error: 'play() returned null'
            // });
            currentIndex++;
            playNext();
          }
        } catch (error) {
          console.error(`[Audio] เกิดข้อผิดพลาดในการเล่นไฟล์เสียง: ${fullUrl}`, error);
          // logAudioEvent({
          //   screenId,
          //   vn,
          //   action: 'play_error',
          //   audioUrl: fullUrl,
          //   message: `เกิดข้อผิดพลาดในการเล่นไฟล์เสียง: ${path}`,
          //   error: error instanceof Error ? error.message : 'Unknown error'
          // });
          currentIndex++;
          playNext();
        }
      });

      // Howler.js จะโหลดอัตโนมัติเมื่อสร้าง object (preload: 'metadata')
      // ไม่ต้องเรียก sound.load() เพราะจะทำให้โหลดซ้ำ
    };

    playNext();
  });
};

const updateCallStatus = async (vn: string) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout

    const response = await fetch('/api/data/call/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vn }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to update call status:', response.statusText, errorData);
    } else {
      const result = await response.json();
      console.log('[Call Update] Success:', result);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Error updating call status: Request timeout after 8 seconds');
    } else {
      console.error('Error updating call status:', error);
    }
  }
};


export default function DuoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [setting, setSetting] = useState<Setting | null>(null);
  const [visitDataLeft, setVisitDataLeft] = useState<VisitInfo[]>([]);
  const [activeDataLeft, setActiveDataLeft] = useState<VisitInfo[]>([]);
  const [visitDataRight, setVisitDataRight] = useState<VisitInfo[]>([]);
  const [activeDataRight, setActiveDataRight] = useState<VisitInfo[]>([]);
  const [skippedData, setSkippedData] = useState<VisitInfo[]>([]);
  const [callData, setCallData] = useState<VisitInfo | null>(null);
  const [showCallPopup, setShowCallPopup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  // const [adsLeftUrl, setAdsLeftUrl] = useState<string | null>(null);
  // const [adsRightUrl, setAdsRightUrl] = useState<string | null>(null);
  const [adsFullUrl, setAdsFullUrl] = useState<string | null>(null);
  // แสดงโฆษณาแบบหน้าแยก (overlay) หลังหน่วงเวลา และแสดงค้าง 20 วิ
  const [showSplitAd, setShowSplitAd] = useState(false);
  const isPausedRef = useRef(false);
  const currentSoundRef = useRef<Howl | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useNetworkError();

  // Setup audio unlock listeners
  useEffect(() => {
    unlockAudioContext();
    
    // ตรวจสอบสถานะการ unlock ทุก 500ms
    const checkInterval = setInterval(() => {
      if (isAudioContextUnlocked()) {
        setAudioUnlocked(true);
        clearInterval(checkInterval);
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchSetting = async (isInitial = false) => {
      try {
        const response = await fetch(`/api/setting/${id}`);
        const result = await response.json();
        if (result.success) {
          setSetting(result.data);
        } else {
          if (isInitial) setError('Failed to fetch initial settings.');
          console.error('Failed to fetch settings:', result.error);
        }
      } catch (e) {
        if (isInitial) setError('An error occurred while fetching settings.');
        console.error('An error occurred while fetching settings:', e);
      }
    };

    fetchSetting(true);
    const interval = setInterval(() => fetchSetting(false), 3 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [id]);

  // โหลดโฆษณาฝั่งซ้าย/ขวาเมื่อ enable_ads = true และ ads_type = 'left' หรือ 'right'
  useEffect(() => {
    if (!setting) {
      // setAdsLeftUrl(null);
      // setAdsRightUrl(null);
      setAdsFullUrl(null);
      return;
    }

    const adsType = setting.ads_type ?? 'split';
    const enableAds =
      setting.enable_ads ??
      (typeof setting.ads === 'string' &&
        setting.ads !== '' &&
        setting.ads !== 'false');

    if (!enableAds) {
      // setAdsLeftUrl(null);
      // setAdsRightUrl(null);
      setAdsFullUrl(null);
      return;
    }

    // โหมดจอเต็ม (duo_ads) ใช้เมื่อ ads_type = 'split'
    if (adsType === 'split') {
      let fullPath = setting.ads_path_left;
      if (!fullPath && setting.ads) {
        fullPath = String(setting.ads);
      }
      setAdsFullUrl(fullPath || null);
      // setAdsLeftUrl(null);
      // setAdsRightUrl(null);
      return;
    }

    // โฆษณาฝั่งซ้าย
    // if (adsType === 'left') {
    //   let leftPath = setting.ads_path_left;
    //   // ถ้า API ยังไม่ได้ส่ง ads_path_left มา ให้ใช้ค่าใน ads แทน (กรณี ads_type = 'left')
    //   if (!leftPath && setting.ads) {
    //     leftPath = String(setting.ads);
    //   }
    //   setAdsLeftUrl(leftPath || null);
    //   setAdsRightUrl(null);
    //   setAdsFullUrl(null);
    //   return;
    // }

    // โฆษณาฝั่งขวา
    // if (adsType === 'right') {
    //   let rightPath = setting.ads_path_right;
    //   // ถ้า API ยังไม่ได้ส่ง ads_path_right มา ให้ใช้ค่าใน ads แทน (กรณี ads_type = 'right')
    //   if (!rightPath && setting.ads) {
    //     rightPath = String(setting.ads);
    //   }
    //   setAdsRightUrl(rightPath || null);
    //   setAdsLeftUrl(null);
    //   setAdsFullUrl(null);
    //   return;
    // }

    // รูปแบบอื่นไม่รองรับ
    // setAdsLeftUrl(null);
    // setAdsRightUrl(null);
    setAdsFullUrl(null);
  }, [setting]);

  // โฆษณาแบบหน้าแยก: หน่วงเวลาแล้วแสดง 20 วิ
  useEffect(() => {
    if (!setting) return;
    if (setting.ads && setting.ads_type === 'split') {
      const delaySec = setting.time_wait ? parseInt(String(setting.time_wait)) : 20;
      const delayMs = isNaN(delaySec) ? 20000 : delaySec * 1000;
      const showDurationMs = 20 * 1000; // ค้างไว้ 20 วิ (fix)

      let showTimer: NodeJS.Timeout | null = null;
      let hideTimer: NodeJS.Timeout | null = null;

      showTimer = setTimeout(() => {
        setShowSplitAd(true);
        hideTimer = setTimeout(() => {
          setShowSplitAd(false);
        }, showDurationMs);
      }, delayMs);

      return () => {
        if (showTimer) clearTimeout(showTimer);
        if (hideTimer) clearTimeout(hideTimer);
      };
    } else {
      setShowSplitAd(false);
    }
  }, [setting]);

  // WebSocket connection - รอ audio unlock ก่อน
  useEffect(() => {
    if (!id || !audioUnlocked) return;

    const wsUrl = `wss://monitor.aztecthstudio.com/ws/`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({
        type: 'register',
        id: id,
        query_type: 'duo'
      }));
    };

    ws.onmessage = async (event) => {
      if (isPausedRef.current) {
        return;
      }
      try {
        const data = JSON.parse(event.data);
        if (data.waitLeft && Array.isArray(data.waitLeft)) {
          setVisitDataLeft(data.waitLeft);
        }
        if (data.waitRight && Array.isArray(data.waitRight)) {
          setVisitDataRight(data.waitRight);
        }
        if (data.activeLeft && Array.isArray(data.activeLeft)) {
          setActiveDataLeft(data.activeLeft);
        }
        if (data.activeRight && Array.isArray(data.activeRight)) {
          setActiveDataRight(data.activeRight);
        }
        if (data.skip && Array.isArray(data.skip)) {
          setSkippedData(data.skip);
        }
        if (data.call) {
          isPausedRef.current = true;
          setCallData(data.call);
          setShowCallPopup(true);
          
          const hasVoice = data.call.voice && Array.isArray(data.call.voice) && data.call.voice.length > 0;

          if (hasVoice) {
            await playVoicePlaylist(data.call.voice, currentSoundRef);
            // หลังจากเสียงพูดจบ รอ 2 วินาทีแล้วปิด popup
            setTimeout(() => {
              setShowCallPopup(false);
              isPausedRef.current = false;
            }, 2000);
          } else {
            // ถ้าไม่มีเสียง รอ 2 วินาทีแล้วปิด popup
            setTimeout(() => {
              setShowCallPopup(false);
              isPausedRef.current = false;
            }, 2000);
          }
          
          if (data.call.vn) {
            await updateCallStatus(data.call.vn);
          }
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [id, audioUnlocked]);

  if (error) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#dc2626' }}>
          เกิดข้อผิดพลาด: {error}
        </div>
      </div>
    );
  }

  if (!setting) {
    return <LoadingSpinner text="กำลังรอการตั้งค่า..." />;
  }

  const tableNamesLeft = setting.station_l ? setting.station_l.split(',') : [];
  const tableNamesRight = setting.station_r ? setting.station_r.split(',') : [];
  const fontFamily = setting.font === 'sarabun' ? "'Sarabun', sans-serif" : "'LINESeed', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  return (
    <div className={styles.container} style={{ fontFamily }}>
      <AudioUnlockOverlay onUnlocked={() => setAudioUnlocked(true)} />
      {showCallPopup && callData && setting && <CallPopup setting={setting} callData={callData} />}
      <Header setting={setting} />
      <main
        className={
          // adsLeftUrl
          //   ? `${styles.mainContent} ${styles.mainContentWithAds}`
          //   : adsRightUrl
          //   ? `${styles.mainContent} ${styles.mainContentWithAdsRight}`
          //   : 
          styles.mainContent
        }
      >
        {/* {adsLeftUrl && (
          <div className={styles.adsLeft}>
            <img src={adsLeftUrl} alt="โฆษณา" className={styles.adsLeftImage} />
          </div>
        )} */}
        
        <div className={styles.column}>
          <InterviewTable setting={setting} visitData={visitDataLeft} />
        </div>
        <div className={styles.column}>
          <InterviewTableRight setting={setting} visitData={visitDataRight} />
        </div>
        
        {/* {adsRightUrl && (
          <div className={styles.adsRight}>
            <img src={adsRightUrl} alt="โฆษณา" className={styles.adsRightImage} />
          </div>
        )} */}
      </main>
      {setting && <SkippedQueueBar skippedData={skippedData} setting={setting} />}

      {/* Overlay โฆษณาแบบหน้าแยก (split) */}
      {(() => {
        const enableAds = setting.enable_ads ?? (setting.ads && setting.ads !== '' && setting.ads !== 'false');
        if (!enableAds || setting.ads_type !== 'split' || !showSplitAd) return null;
        
        // ใช้ ads_path_left ถ้ามี ไม่เช่นนั้นใช้ ads (backward compatibility)
        const splitAdsUrl = setting.ads_path_left || setting.ads;
        return splitAdsUrl ? (
          <div className={styles.adsOverlay}>
            <div className={styles.adsOverlayContent}>
              <img
                src={splitAdsUrl}
                alt="Advertisement"
                className={styles.adsOverlayImage}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
}
