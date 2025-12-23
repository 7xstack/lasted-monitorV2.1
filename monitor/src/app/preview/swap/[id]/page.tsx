'use client';

import { useState, use, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import styles from '../../../swap/[id]/page.module.css';
import { Setting } from '../../../swap/[id]/types';

// Dynamic imports for preview components
const PreviewSingle = dynamic(() => import('../../single/page'), { 
  ssr: false,
  loading: () => <LoadingSpinner text="กำลังโหลด Single Preview..." />
});
const PreviewDuo = dynamic(() => import('../../duo/page'), { 
  ssr: false,
  loading: () => <LoadingSpinner text="กำลังโหลด Duo Preview..." />
});
const PreviewEr = dynamic(() => import('../../er/page'), { 
  ssr: false,
  loading: () => <LoadingSpinner text="กำลังโหลด ER Preview..." />
});

// Mock Swap Setting
const mockSwapSetting: Setting = {
  id: 1,
  type: 'swap',
  listPage: '1,2,3', // single, duo, er
  time_wait: '5', // 5 วินาที
  department: '',
  n_hospital: '',
  n_room: '',
  n_table: '',
  n_listtable: '',
  n_listroom: '',
  department_load: '',
  department_room_load: '',
  time_col: 'true',
  table_arr: 'false',
  table_arr2: 'false',
  amount_boxL: 5,
  amount_boxR: 0,
  stem_surname: 'name',
  stem_surname_table: 'name',
  stem_surname_popup: 'false',
  stem_name_table: null,
  stem_name_popup: null,
  station_l: '',
  station_r: '',
  stem_popup: '',
  a_sound: 'true',
  b_sound: 'false',
  c_sound: 'false',
  stem_name: null,
  urgent_color: 'true',
  lock_position: 'false',
  lock_position_right: 'false',
  urgent_level: 'true',
  status_patient: 'true',
  status_check: 'false',
  ads: '',
  ads_type: 'split',
  enable_ads: false,
  ads_path_left: '',
  ads_path_right: '',
  timeout: null,
  pages: null,
  urgent_setup: 'ฉุกเฉิน',
  alternate: null,
  voice: null,
  style_voice: null,
  set_descrip: '',
  set_notice: '',
  type_popup: '',
  limitNum: null,
  speedLoop: null,
  activeLoop: null,
  font: 'sarabun',
  color_static: null,
  color_dynamic: null,
};

// Map pageId → type
const pageTypeMap: { [key: string]: 'single' | 'duo' | 'er' } = {
  '1': 'single',
  '2': 'single',
  '3': 'er',
};

interface SwapSetting extends Omit<Setting, 'time_wait' | 'listPage'> {
  listPage?: string;
  time_wait?: number | string;
  [key: string]: unknown;
}

export default function PreviewSwapPage({ params }: { params: Promise<{ id: string }> }) {
  use(params);

  const [swapSetting] = useState<SwapSetting>(mockSwapSetting as SwapSetting);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pageIds, setPageIds] = useState<string[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionOpacity, setTransitionOpacity] = useState(0);
  const [transitionDuration, setTransitionDuration] = useState('1.5s'); // สำหรับ fade in/out
  const swapTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // currentDisplayId สำหรับสลับ id โดยไม่เปลี่ยน URL
  const [currentDisplayId, setCurrentDisplayId] = useState<string>('');
  // displayId ที่จะแสดงจริง (จะเปลี่ยนหลังจาก fade in เสร็จ)
  const [displayId, setDisplayId] = useState<string>('');
  const previousDisplayIdRef = useRef<string>('');
  const transitionInProgressRef = useRef<boolean>(false);

  // Initialize: แยก listPage และตั้งค่า currentDisplayId
  useEffect(() => {
    if (!swapSetting.listPage) return;

    // แยก listPage ด้วย comma เป็น array
    const ids = swapSetting.listPage.split(',').map((s: string) => s.trim()).filter((s: string) => s);
    setPageIds(ids);
    
    // ตั้งค่า currentDisplayId และ displayId เป็น ID แรกใน listPage
    if (ids.length > 0) {
      const firstId = ids[0];
      setCurrentDisplayId(firstId);
      setDisplayId(firstId);
      previousDisplayIdRef.current = firstId;
      setCurrentPageIndex(0);
      console.log(`[Preview Swap] ตั้งค่า listPage: ${ids.join(', ')}, เริ่มที่ ID: ${firstId}`);
    }
  }, [swapSetting]);

  // Animation: fade in/out เมื่อ currentDisplayId เปลี่ยน
  useEffect(() => {
    // ตรวจสอบว่า currentDisplayId เปลี่ยนจริงๆ (ไม่ใช่ initialization)
    if (!currentDisplayId || currentDisplayId === previousDisplayIdRef.current) return;
    
    const newDisplayId = currentDisplayId;
    const oldDisplayId = previousDisplayIdRef.current;
    
    console.log(`[Preview Swap] เริ่ม animation: ${oldDisplayId} → ${newDisplayId}`);
    
    // เริ่ม transition
    setIsTransitioning(true);
    transitionInProgressRef.current = true;
    
    // เก็บ timer refs เพื่อ cleanup
    const timers: NodeJS.Timeout[] = [];
    
    // Phase 1: Fade in 1.5 วินาทีก่อนสลับจอ
    // เริ่มจาก opacity 0 แล้ว fade in ถึง 1 ใน 1.5 วินาที
    setTransitionOpacity(0);
    setTransitionDuration('1.5s'); // ตั้งค่า duration สำหรับ fade in
    const fadeInTimer = setTimeout(() => {
      setTransitionOpacity(1); // fade in ถึง 1 (ใช้เวลา 1.5s ตาม transition)
      console.log(`[Preview Swap] Fade in เริ่มแล้ว (1.5 วินาที)`);
    }, 10); // รอให้ browser render ก่อน
    timers.push(fadeInTimer);
    
    // Phase 2: หลังจาก fade in เสร็จ (1.5s) → สลับจอ (เปลี่ยน displayId)
    const swapTimer = setTimeout(() => {
      console.log(`[Preview Swap] สลับจอ: ${oldDisplayId} → ${newDisplayId}`);
      setDisplayId(newDisplayId); // สลับจอ
      
      // Phase 3: หลังจากสลับจอเสร็จแล้ว → Fade out 2.5 วินาที
      // รอให้ React render หน้าใหม่เสร็จ (ใช้ requestAnimationFrame เพื่อให้แน่ใจว่า render เสร็จ)
      const fadeOutTimer = setTimeout(() => {
        console.log(`[Preview Swap] Fade out เริ่มแล้ว (2.5 วินาที)`);
        setTransitionDuration('2.5s'); // เปลี่ยน duration เป็น 2.5s สำหรับ fade out
        setTransitionOpacity(0); // fade out กลับไป 0 (ใช้เวลา 2.5s ตาม transition)
        
        // Phase 4: เสร็จสิ้น transition หลัง fade out เสร็จ (2.5s)
        const finishTimer = setTimeout(() => {
          console.log(`[Preview Swap] เสร็จสิ้น animation`);
          setIsTransitioning(false);
          transitionInProgressRef.current = false;
          previousDisplayIdRef.current = newDisplayId;
          setTransitionOpacity(0); // ตรวจสอบให้แน่ใจว่า opacity เป็น 0
        }, 2500); // fade out duration (2.5s)
        timers.push(finishTimer);
      }, 50); // รอให้ React render หน้าใหม่เสร็จ (50ms buffer)
      timers.push(fadeOutTimer);
    }, 1510); // รอให้ fade in เสร็จ (1.5s + 10ms)
    timers.push(swapTimer);
    
    // Cleanup: clear timers เมื่อ component unmount หรือ currentDisplayId เปลี่ยนใหม่
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      // Reset state ถ้า component unmount ก่อน animation เสร็จ
      if (transitionInProgressRef.current) {
        setIsTransitioning(false);
        transitionInProgressRef.current = false;
      }
    };
    
  }, [currentDisplayId]);

  // Swap logic: เริ่ม/รีเซ็ต timer และสลับ currentDisplayId ตาม listPage
  useEffect(() => {
    // ตรวจสอบว่ามี swapSetting และ pageIds
    if (!swapSetting || pageIds.length === 0) {
      // ถ้าไม่มี swapSetting หรือไม่มี pageIds ให้ clear timer
      if (swapTimerRef.current) {
        clearTimeout(swapTimerRef.current);
        swapTimerRef.current = null;
      }
      return;
    }

    // ถ้ากำลัง transition อยู่ ไม่เริ่ม timer (รอให้ transition เสร็จก่อน)
    if (isTransitioning) {
      console.log(`[Preview Swap] กำลัง transition อยู่ รอให้เสร็จก่อน`);
      // Clear timer เก่าถ้ามี
      if (swapTimerRef.current) {
        clearTimeout(swapTimerRef.current);
        swapTimerRef.current = null;
      }
      return;
    }

    // Clear timer เก่าก่อน (จะเริ่มใหม่ด้านล่าง)
    if (swapTimerRef.current) {
      clearTimeout(swapTimerRef.current);
      swapTimerRef.current = null;
    }

    // เริ่ม timer
    function startSwapTimer() {
      // ตรวจสอบ swapSetting อีกครั้ง
      if (!swapSetting) return;
      
      // อ่าน time_wait จาก swapSetting (หน่วย: วินาที) แล้วแปลงเป็น ms
      const timeWaitSeconds = swapSetting.time_wait ? parseInt(String(swapSetting.time_wait)) : 5;
      const timeWaitSecondsValue = isNaN(timeWaitSeconds) ? 5 : timeWaitSeconds;
      const delayMs = timeWaitSecondsValue * 1000; // แปลงจากวินาทีเป็น ms

      console.log(`[Preview Swap] เริ่มนับเวลา ${delayMs}ms เพื่อสลับไปหน้าจอถัดไป`);
      
      swapTimerRef.current = setTimeout(() => {
        // คำนวณ index ถัดไป (วนรอบ)
        const nextIndex = (currentPageIndex + 1) % pageIds.length;
        const nextId = pageIds[nextIndex];
        
        console.log(`[Preview Swap] ครบเวลาแล้ว กำลังสลับไป id ${nextId} (${nextIndex + 1}/${pageIds.length})`);
        
        setCurrentPageIndex(nextIndex);
        // สลับ currentDisplayId โดยไม่เปลี่ยน URL (จะ trigger animation อัตโนมัติ)
        setCurrentDisplayId(nextId);
      }, delayMs);
    }

    // เริ่ม timer
    startSwapTimer();

    // Cleanup เมื่อ component unmount หรือ dependencies เปลี่ยน
    return () => {
      if (swapTimerRef.current) {
        clearTimeout(swapTimerRef.current);
        swapTimerRef.current = null;
      }
    };
  }, [swapSetting, pageIds, currentPageIndex, isTransitioning]);

  if (!swapSetting || pageIds.length === 0 || !displayId) {
    return <LoadingSpinner text="กำลังโหลดข้อมูล..." />;
  }

  const currentPageType = pageTypeMap[displayId] || 'single';

  // Debug logging
  console.log('[Preview Swap] Current state:', {
    currentPageIndex,
    currentDisplayId,
    displayId,
    currentPageType,
    pageIds,
    isTransitioning,
  });

  // Render preview component based on type
  const renderPreview = () => {
    console.log('[Preview Swap] Rendering preview for type:', currentPageType, 'pageId:', displayId);
    try {
      // ใช้ key เพื่อให้ React re-render เมื่อเปลี่ยนหน้า
      switch (currentPageType) {
        case 'single':
          return <PreviewSingle key={`single-${displayId}-${currentPageIndex}`} />;
        case 'duo':
          return <PreviewDuo key={`duo-${displayId}-${currentPageIndex}`} />;
        case 'er':
          return <PreviewEr key={`er-${displayId}-${currentPageIndex}`} />;
        default:
          console.warn('[Preview Swap] Unknown type, defaulting to single:', currentPageType);
          return <PreviewSingle key={`single-default-${currentPageIndex}`} />;
      }
    } catch (err) {
      console.error('[Preview Swap] Error rendering preview:', err);
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#dc2626' }}>
          เกิดข้อผิดพลาดในการแสดง preview
        </div>
      );
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Transition Overlay - สีฟ้า fade in/out */}
      {isTransitioning && (
        <div
          className={styles.transitionOverlay}
          style={{
            opacity: transitionOpacity,
            transition: `opacity ${transitionDuration} ease-in-out`,
            background: 'linear-gradient(135deg, #043566, #065a9e)',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10, // สูงกว่า content เพื่อแสดงทับ
          }}
        />
      )}
      
      {/* Preview Content */}
      <div 
        key={`preview-container-${displayId}-${currentPageIndex}`}
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1
        }}
      >
        {renderPreview()}
      </div>
    </div>
  );
}

