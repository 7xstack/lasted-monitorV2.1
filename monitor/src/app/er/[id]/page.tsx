'use client';

import { useEffect, useState, use, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import styles from './page.module.css';
import { useNetworkError } from '../../../components/NetworkErrorProvider';
import { Setting, VisitInfo, UrgentLevel } from './types';
import AudioUnlockOverlay from '../../../components/AudioUnlockOverlay';
import { Howl } from 'howler';
import { unlockAudioContext, isAudioContextUnlocked } from '../../../lib/audio-unlock';
// import { logAudioEvent } from '../../../lib/audio-logger';
import LoadingSpinner from '../../../components/LoadingSpinner';

const Header = dynamic(() => import('./Header'), { ssr: false });
const InterviewTable = dynamic(() => import('./InterviewTable'), { ssr: false });
const ServiceSection = dynamic(() => import('./ServiceSection'), { ssr: false });
const SkippedQueueBar = dynamic(() => import('./SkippedQueueBar'), { ssr: false });
const CallPopup = dynamic(() => import('./CallPopup'), { ssr: false });

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

export default function ErPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [setting, setSetting] = useState<Setting | null>(null);
  const [visitData, setVisitData] = useState<VisitInfo[]>([]);
  const [countData, setCountData] = useState<{ [key: string]: number }>({});
  const [activeData, setActiveData] = useState<VisitInfo[]>([]);
  const [callData, setCallData] = useState<VisitInfo | null>(null);
  const [showCallPopup, setShowCallPopup] = useState(false);
  const [skippedData, setSkippedData] = useState<VisitInfo[]>([]);
  const [urgentLevels, setUrgentLevels] = useState<UrgentLevel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [adsLeftUrl, setAdsLeftUrl] = useState<string | null>(null);
  const [adsRightUrl, setAdsRightUrl] = useState<string | null>(null);
  const [adsFullUrl, setAdsFullUrl] = useState<string | null>(null);
  // แสดงโฆษณาแบบหน้าแยก (overlay) หลังหน่วงเวลา และแสดงค้าง 20 วิ
  const [showSplitAd, setShowSplitAd] = useState(false);
  
  // State สำหรับ Phase Management
  const [isFading, setIsFading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [isAdsMode, setIsAdsMode] = useState(false);
  
  const isPausedRef = useRef(false);
  const currentSoundRef = useRef<Howl | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const er2TimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);


  useNetworkError();
  
  // useMemo สำหรับ settingStable เพื่อป้องกัน unnecessary re-run
  const settingStable = useMemo(() => setting, [
    setting,
  ]);
  
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
        if (isInitial) setError('An error occurred while fetching initial data.');
        console.error('An error occurred while fetching initial data:', e);
      }
    };

    const fetchUrgentLevels = async () => {
      try {
        const response = await fetch('/api/urgent-level');
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setUrgentLevels(result.data);
        }
      } catch (e) {
        console.error('An error occurred while fetching urgent levels:', e);
      }
    };

    fetchSetting(true);
    fetchUrgentLevels();
    const settingInterval = setInterval(() => fetchSetting(false), 3 * 60 * 1000);

    return () => {
      clearInterval(settingInterval);
    };
  }, [id]);

  // โหลดโฆษณาฝั่งซ้าย/ขวาเมื่อ enable_ads = true และ ads_type = 'left' หรือ 'right'
  useEffect(() => {
    if (!setting) {
      setAdsLeftUrl(null);
      setAdsRightUrl(null);
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
      setAdsLeftUrl(null);
      setAdsRightUrl(null);
      setAdsFullUrl(null);
      return;
    }

    // โหมดจอเต็ม (er_ads) ใช้เมื่อ ads_type = 'split'
    if (adsType === 'split') {
      let fullPath = setting.ads_path_left;
      if (!fullPath && setting.ads) {
        fullPath = String(setting.ads);
      }
      setAdsFullUrl(fullPath || null);
      setAdsLeftUrl(null);
      setAdsRightUrl(null);
      return;
    }

    // โฆษณาฝั่งซ้าย
    if (adsType === 'left') {
      let leftPath = setting.ads_path_left;
      // ถ้า API ยังไม่ได้ส่ง ads_path_left มา ให้ใช้ค่าใน ads แทน (กรณี ads_type = 'left')
      if (!leftPath && setting.ads) {
        leftPath = String(setting.ads);
      }
      setAdsLeftUrl(leftPath || null);
      setAdsRightUrl(null);
      setAdsFullUrl(null);
      return;
    }

    // โฆษณาฝั่งขวา
    if (adsType === 'right') {
      let rightPath = setting.ads_path_right;
      // ถ้า API ยังไม่ได้ส่ง ads_path_right มา ให้ใช้ค่าใน ads แทน (กรณี ads_type = 'right')
      if (!rightPath && setting.ads) {
        rightPath = String(setting.ads);
      }
      setAdsRightUrl(rightPath || null);
      setAdsLeftUrl(null);
      setAdsFullUrl(null);
      return;
    }

    // รูปแบบอื่นไม่รองรับ
    setAdsLeftUrl(null);
    setAdsRightUrl(null);
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

  // WebSocket connection - รอ audio unlock และ setting ก่อน
  useEffect(() => {
    if (!id || !audioUnlocked || !settingStable) return;

    // Local variable สำหรับ Phase Tracking
    let currentPhase: 'er' | 'er_2' | 'ads' = 'er';

    // Function สำหรับเริ่ม Transition
    const startTransition = (direction: 'left' | 'right') => {
      setSlideDirection(direction);
      setIsTransitioning(true);
      setIsFading(true);
      setTimeout(() => {
        setIsTransitioning(false);
        setIsFading(false);
      }, 1200); // ต้องตรงกับ duration ใน CSS
    };

    // Function สำหรับส่ง Registration Message
    const sendRegistration = (queryType: 'er' | 'er_2') => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // กำหนดทิศทาง animation
        if (queryType === 'er_2') {
          startTransition('left');
        } else {
          startTransition('right');
        }

        wsRef.current.send(JSON.stringify({
          type: 'register',
          id: id,
          query_type: queryType
        }));
        console.log(`[ER Switch] Registered with query_type: ${queryType}`);
      }
    };

    // Function สำหรับ Schedule การสลับ Phase
    const scheduleNextRegistration = () => {
      // 1. อ่าน time_wait จาก setting (default 20 วินาที, range 5-120)
      const parsedTimeWait = settingStable?.time_wait ? parseInt(String(settingStable.time_wait)) : null;
      const timeWait = (parsedTimeWait && parsedTimeWait >= 5 && parsedTimeWait <= 120) ? parsedTimeWait : 20;
      
      // 2. Clear timeout/interval เก่าก่อน
      if (er2TimeoutRef.current) {
        clearTimeout(er2TimeoutRef.current);
        er2TimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      // 3. ตั้ง timeout สำหรับสลับ phase
      er2TimeoutRef.current = setTimeout(() => {
        // Logic การสลับ phase
        if (adsFullUrl) {
          // มีโฆษณาเต็มจอ: er -> er_2 -> er_ads -> er
          if (currentPhase === 'er') {
            currentPhase = 'er_2';
            setIsAdsMode(false);
            sendRegistration('er_2');
          } else if (currentPhase === 'er_2') {
            currentPhase = 'ads';
            setIsAdsMode(true);
            startTransition('left');
            // ไม่ต้องส่ง register ใหม่
          } else {
            currentPhase = 'er';
            setIsAdsMode(false);
            startTransition('right');
            sendRegistration('er');
          }
        } else {
          // ไม่มีโฆษณา: er <-> er_2
          currentPhase = currentPhase === 'er' ? 'er_2' : 'er';
          setIsAdsMode(false);
          sendRegistration(currentPhase);
        }
        
        scheduleNextRegistration(); // วนลูปต่อไป
      }, timeWait * 1000);
      
      console.log(`[ER Switch] Scheduled next registration in ${timeWait} seconds`);
    };

    const wsUrl = `wss://monitor.aztecthstudio.com/ws/`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      currentPhase = 'er';
      setIsAdsMode(false);
      sendRegistration('er');
      scheduleNextRegistration(); // เริ่มวงจรสลับ
    };

    ws.onmessage = async (event) => {
      if (isPausedRef.current) {
        return;
      }
      try {
        const data = JSON.parse(event.data);
        
        // Update data อื่นๆ (wait, active, skip, count)
        if (data.wait && Array.isArray(data.wait)) {
          setVisitData(data.wait);
        }
        if (data.active && Array.isArray(data.active)) {
          setActiveData(data.active);
        }
        if (data.skip && Array.isArray(data.skip)) {
          setSkippedData(data.skip);
        }
        if (data.count && typeof data.count === 'object') {
          setCountData(data.count);
        }
        
        if (data.call) {
          // 1. หยุดการ swap ทันที
          if (er2TimeoutRef.current) {
            clearTimeout(er2TimeoutRef.current);
            er2TimeoutRef.current = null;
          }
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          
          // 2. เปลี่ยนไป er_2 ทันที (ถ้ายังไม่ใช่)
          if (currentPhase !== 'er_2') {
            currentPhase = 'er_2';
            setIsAdsMode(false);
            sendRegistration('er_2');
          }
          
          // 3. Pause และแสดง popup
          isPausedRef.current = true;
          setCallData(data.call);
          setShowCallPopup(true);
          
          // 4. เล่นเสียง (ถ้ามี)
          const hasVoice = data.call.voice && Array.isArray(data.call.voice) && data.call.voice.length > 0;
          if (hasVoice) {
            await playVoicePlaylist(data.call.voice, currentSoundRef);
          }
          
          // 5. หลังจากเสียงจบ + 2 วินาที ปิด popup
          setTimeout(() => {
            setShowCallPopup(false);
            isPausedRef.current = false;
            
            // 6. หน่วง 5 วินาที แล้วเริ่ม swap ใหม่
            setTimeout(() => {
              scheduleNextRegistration();
            }, 5000);
          }, 2000);
          
          // 7. Update call status
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
      if (er2TimeoutRef.current) {
        clearTimeout(er2TimeoutRef.current);
        er2TimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [id, audioUnlocked, settingStable, adsFullUrl]);

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

  const fontFamily = setting.font === 'sarabun' ? "'Sarabun', sans-serif" : "'LINESeed', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  // Render Content Function
  const renderContent = () => (
    <>
      <Header setting={setting} />
      <main
        className={
          adsLeftUrl
            ? `${styles.mainContent} ${styles.mainContentWithAds}`
            : adsRightUrl
            ? `${styles.mainContent} ${styles.mainContentWithAdsRight}`
            : styles.mainContent
        }
      >
        {adsLeftUrl && (
          <div className={styles.adsLeft} style={{ position: 'relative' }}>
            <Image 
              src={adsLeftUrl} 
              alt="โฆษณา" 
              fill
              className={styles.adsLeftImage}
              unoptimized
            />
          </div>
        )}

        <InterviewTable setting={setting} visitData={visitData} />

        <ServiceSection 
          setting={setting} 
          activeData={activeData} 
          urgentLevels={urgentLevels}
          countData={countData}
        />

        {adsRightUrl && (
          <div className={styles.adsRight} style={{ position: 'relative' }}>
            <Image 
              src={adsRightUrl} 
              alt="โฆษณา" 
              fill
              className={styles.adsRightImage}
              unoptimized
            />
          </div>
        )}
      </main>
      {setting && <SkippedQueueBar skippedData={skippedData} setting={setting} />}
    </>
  );

  return (
    <div className={styles.container} style={{ fontFamily }}>
      <AudioUnlockOverlay onUnlocked={() => setAudioUnlocked(true)} />
      {showCallPopup && callData && setting && <CallPopup setting={setting} callData={callData} />}
      
      {/* จอหลัก (กำลังแสดง) */}
      <div className={`${styles.contentWrapper} ${isTransitioning ? (slideDirection === 'left' ? styles.slideOutLeft : styles.slideOutRight) : ''}`}>
        {renderContent()}
      </div>
      
      {/* จอใหม่ (กำลังเข้ามา - แสดงเมื่อ isFading = true) */}
      {isFading && (
        <div className={`${styles.contentWrapper} ${slideDirection === 'left' ? styles.slideInFromRight : styles.slideInFromLeft}`}>
          {renderContent()}
        </div>
      )}

      {/* Overlay โฆษณาแบบหน้าแยก (split) - แสดงเมื่อ isAdsMode = true */}
      {(() => {
        const enableAds = setting.enable_ads ?? (setting.ads && setting.ads !== '' && setting.ads !== 'false');
        // แสดงโฆษณาเมื่อ isAdsMode = true หรือ showSplitAd = true (backward compatibility)
        if (!enableAds || setting.ads_type !== 'split' || (!isAdsMode && !showSplitAd)) return null;
        
        // ใช้ ads_path_left ถ้ามี ไม่เช่นนั้นใช้ ads (backward compatibility)
        const splitAdsUrl = setting.ads_path_left || setting.ads;
        return splitAdsUrl ? (
          <div className={styles.adsOverlay}>
            <div className={styles.adsOverlayContent} style={{ position: 'relative', width: '100%', height: '100%' }}>
              <Image
                src={splitAdsUrl}
                alt="Advertisement"
                fill
                className={styles.adsOverlayImage}
                unoptimized
              />
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
}
