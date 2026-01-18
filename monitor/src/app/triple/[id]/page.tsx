"use client";

import { useState, use, useEffect, useRef } from "react";
import styles from "./page.module.css";
import { useNetworkError } from "../../../components/NetworkErrorProvider";
import { Setting, VisitInfo } from "./types";
import Header from "./Header";
import InterviewTable from "./InterviewTable";
import SkippedQueueBar from "./SkippedQueueBar";
import CallPopup from "./CallPopup";
import AudioUnlockOverlay from "../../../components/AudioUnlockOverlay";
import { Howl } from "howler";
import {
  unlockAudioContext,
  isAudioContextUnlocked,
} from "../../../lib/audio-unlock";
// import { logAudioEvent } from '../../../lib/audio-logger';
import LoadingSpinner from "../../../components/LoadingSpinner";
// เปิด/ปิด Mock Mode - ตั้งเป็น true เพื่อใช้ mock data
const USE_MOCK_DATA = true;

const VOICE_DOMAIN = "https://voice.aztecthstudio.com";

// Mock Setting Data
const getMockSetting = (id: string): Setting => ({
  id: parseInt(id) || 1,
  department: 'แผนกผู้ป่วยนอก',
  n_hospital: 'โรงพยาบาลตัวอย่าง',
  n_room: 'ห้องตรวจ 1',
  n_table: 'โต๊ะ 1',
  n_listtable: 'โต๊ะ 1,โต๊ะ 2,โต๊ะ 3',
  n_listroom: 'ห้องตรวจ 1,ห้องตรวจ 2',
  department_load: '2,3,4',
  department_room_load: '',
  time_col: 'true',
  table_arr: 'โต๊ะ 1',
  table_arr2: '',
  amount_boxL: 8,
  amount_boxR: 0,
  stem_surname: 'name',
  stem_surname_table: 'name',
  stem_surname_popup: 'false',
  stem_name_table: 'name',
  stem_name_popup: 'false',
  station_l: 'โต๊ะ 1,โต๊ะ 2,โต๊ะ 3,โต๊ะ 4',
  station_r: '',
  stem_popup: 'false',
  a_sound: 'true',
  b_sound: 'false',
  c_sound: 'false',
  stem_name: 'name',
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
  type: 'triple',
  alternate: null,
  voice: '1',
  style_voice: '2',
  set_descrip: 'false',
  set_notice: 'false',
  type_popup: '1',
  time_wait: '20',
  listPage: '',
  limitNum: null,
  speedLoop: null,
  activeLoop: null,
  font: 'Rubik',
  color_static: null,
  color_dynamic: null,
  display_three_columns: 'true',
  column_title_1: 'ผู้รับบริการทั่วไป',
  column_title_2: 'ผู้รับบริการสูงอายุ 70 ปี',
  column_title_3: 'ผู้รับบริการกลุ่มนัด',
  list_urgent: 'R,E,U',
});

// Mock Visit Data - แบ่งเป็น 3 ประเภทตาม urgent_level
const generateMockVisitData = (): VisitInfo[] => {
  const visits: VisitInfo[] = [];
  const names = [
    'สมชาย ใจดี', 'สมหญิง รักสุข', 'วิชัย เก่งมาก', // R
    'มาลี สวยงาม', 'ประเสริฐ ดีใจ', 'สุดา งามมาก', // E
    'วิเชียร เก่งมาก', 'สมพร รักสุข', // U
  ];
  const queueNumbers = ['A001', 'A002', 'A003', 'A004', 'A005', 'A006', 'A007', 'A008'];
  const urgentLevels = ['R', 'R', 'R', 'E', 'E', 'E', 'U', 'U'];
  const colors = ['#0066AA', '#FF6B6B', '#4ECDC4'];
  
  for (let i = 0; i < 8; i++) {
    const urgentLevel = urgentLevels[i];
    let color = '#0066AA';
    if (urgentLevel === 'E') color = '#FF6B6B';
    if (urgentLevel === 'U') color = '#4ECDC4';
    
    visits.push({
      id: i + 1,
      code_dept_id: '2',
      patient_name: names[i],
      visit_q_no: queueNumbers[i],
      queue_number: queueNumbers[i],
      visit_date: new Date().toISOString().split('T')[0],
      status: 'waiting',
      urgent_id: i % 3 + 1,
      urgent_color: color,
      urgent_setup: 'ฉุกเฉิน',
      urgent_level: urgentLevel,
      priority_rate: 1,
      check_in: new Date().toISOString(),
      time_call: '',
      status_call: '',
      arr_r: false,
      station_index: 0,
      Color: color,
    });
  }
  return visits;
};

// Mock Active Data
const generateMockActiveData = (): VisitInfo[] => {
  const active: VisitInfo[] = [];
  const names = ['นพ. ตัวอย่าง', 'พญ. ทดสอบ'];
  const stations = ['โต๊ะ 1', 'โต๊ะ 2'];
  
  for (let i = 0; i < 2; i++) {
    active.push({
      id: i + 100,
      code_dept_id: '2',
      patient_name: names[i],
      visit_q_no: `A00${i + 1}`,
      queue_number: `A00${i + 1}`,
      visit_date: new Date().toISOString().split('T')[0],
      status: 'active',
      urgent_id: 1,
      urgent_color: '#0066AA',
      urgent_setup: 'ฉุกเฉิน',
      urgent_level: 'R',
      priority_rate: 1,
      check_in: new Date().toISOString(),
      time_call: new Date().toISOString(),
      status_call: 'active',
      arr_r: false,
      station_index: i,
      station: stations[i],
      Color: '#0066AA',
    });
  }
  return active;
};

// Mock Skipped Data
const generateMockSkippedData = (): VisitInfo[] => {
  return [];
};

const playVoicePlaylist = (
  voicePaths: string[],
  currentSoundRef: React.MutableRefObject<Howl | null>
): Promise<void> => {
  return new Promise((resolve, reject) => {
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

    console.log(`[Audio] เริ่มโหลดไฟล์เสียงทั้งหมด ${voicePaths.length} ไฟล์`);

    // สร้าง Howl objects สำหรับทุกไฟล์และโหลดทั้งหมดให้เสร็จก่อน
    const sounds: Howl[] = [];
    const loadPromises: Promise<void>[] = [];

    voicePaths.forEach((path, index) => {
      const fullUrl = `${VOICE_DOMAIN}${path}`;
      console.log(`[Audio] กำลังโหลดไฟล์เสียง ${index + 1}/${voicePaths.length}: ${fullUrl}`);

      const sound = new Howl({
        src: [fullUrl],
        html5: true,
        preload: true, // โหลดไฟล์ทั้งหมดก่อน
        onload: () => {
          console.log(`[Audio] โหลดไฟล์เสียงสำเร็จ ${index + 1}/${voicePaths.length}: ${fullUrl}`);
        },
        onloaderror: (id, err) => {
          console.error(
            `[Audio] เกิดข้อผิดพลาดในการโหลดไฟล์เสียง ${index + 1}/${voicePaths.length}: ${fullUrl}`,
            err
          );
        },
        onplayerror: (id, err) => {
          console.error(
            `[Audio] เกิดข้อผิดพลาดในการเล่นไฟล์เสียง ${index + 1}/${voicePaths.length}: ${fullUrl}`,
            err
          );
        },
      });

      sounds.push(sound);

      // รอให้ไฟล์โหลดเสร็จ
      const loadPromise = new Promise<void>((loadResolve) => {
        if (sound.state() === "loaded") {
          loadResolve();
        } else {
          sound.once("load", () => {
            loadResolve();
          });
          sound.once("loaderror", () => {
            console.warn(`[Audio] ข้ามไฟล์เสียงที่โหลดไม่สำเร็จ: ${fullUrl}`);
            loadResolve(); // ยังคง resolve เพื่อไม่ให้บล็อกการเล่นไฟล์อื่น
          });
        }
      });

      loadPromises.push(loadPromise);
    });

    // รอให้ทุกไฟล์โหลดเสร็จก่อน
    Promise.all(loadPromises)
      .then(() => {
        console.log(`[Audio] โหลดไฟล์เสียงทั้งหมดเสร็จแล้ว เริ่มเล่นเสียง`);
        
        let currentIndex = 0;

        const playNext = () => {
          if (currentIndex >= sounds.length) {
            currentSoundRef.current = null;
            console.log(`[Audio] เล่นไฟล์เสียงทั้งหมดเสร็จแล้ว`);
            resolve();
            return;
          }

          const sound = sounds[currentIndex];
          const path = voicePaths[currentIndex];
          const fullUrl = `${VOICE_DOMAIN}${path}`;

          // ถ้าไฟล์โหลดไม่สำเร็จ ให้ข้ามไปไฟล์ถัดไป
          if (sound.state() !== "loaded") {
            console.warn(`[Audio] ข้ามไฟล์เสียงที่โหลดไม่สำเร็จ: ${fullUrl}`);
            currentIndex++;
            playNext();
            return;
          }

          currentSoundRef.current = sound;

          sound.once("end", () => {
            console.log(`[Audio] เล่นไฟล์เสียงเสร็จสิ้น ${currentIndex + 1}/${sounds.length}: ${fullUrl}`);
            currentIndex++;
            // เล่นไฟล์ถัดไปทันทีโดยไม่มี gap
            playNext();
          });

          try {
            console.log(`[Audio] เริ่มเล่นไฟล์เสียง ${currentIndex + 1}/${sounds.length}: ${fullUrl}`);
            const playId = sound.play();
            if (!playId) {
              console.warn(`[Audio] ไม่สามารถเล่นไฟล์เสียงได้: ${fullUrl}`);
              currentIndex++;
              playNext();
            }
          } catch (error) {
            console.error(
              `[Audio] เกิดข้อผิดพลาดในการเล่นไฟล์เสียง: ${fullUrl}`,
              error
            );
            currentIndex++;
            playNext();
          }
        };

        // เริ่มเล่นไฟล์แรก
        playNext();
      })
      .catch((error) => {
        console.error("[Audio] เกิดข้อผิดพลาดในการโหลดไฟล์เสียง:", error);
        reject(error);
      });
  });
};

const updateCallStatus = async (vn: string) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout

    const response = await fetch("/api/data/call/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vn }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        "Failed to update call status:",
        response.statusText,
        errorData
      );
    } else {
      const result = await response.json();
      console.log("[Call Update] Success:", result);
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error(
        "Error updating call status: Request timeout after 8 seconds"
      );
    } else {
      console.error("Error updating call status:", error);
    }
  }
};

export default function SinglePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id; // id จาก URL (คงที่)

  const [setting, setSetting] = useState<Setting | null>(null);
  const [visitData, setVisitData] = useState<VisitInfo[]>([]);
  const [activeData, setActiveData] = useState<VisitInfo[]>([]);
  const [skippedData, setSkippedData] = useState<VisitInfo[]>([]);
  const [callData, setCallData] = useState<VisitInfo | null>(null);
  const [showCallPopup, setShowCallPopup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const isPausedRef = useRef(false);
  const isUpdatingCallStatusRef = useRef(false); // ตรวจสอบว่ากำลัง update call status อยู่หรือไม่
  const currentSoundRef = useRef<Howl | null>(null);
  
  // เก็บ VN ที่เล่นแล้วเพื่อป้องกันการเล่นซ้ำ (ลบหลังจาก 5 วินาที)
  const playedVnSetRef = useRef<Set<string>>(new Set());
  const vnCleanupTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  // แสดงโฆษณาแบบหน้าแยก (overlay) หลังหน่วงเวลา และแสดงค้าง 20 วิ
  const [showSplitAd, setShowSplitAd] = useState(false);
  
  // Auto-switch state สำหรับ id 214/215
  const autoSwitchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSwitchInfoRef = useRef<{ nextId: string; delaySeconds: number } | null>(null);
  
  // currentDisplayId สำหรับสลับ id โดยไม่เปลี่ยน URL
  const [currentDisplayId, setCurrentDisplayId] = useState<string>(id);
  
  // Animation state สำหรับ transition
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionOpacity, setTransitionOpacity] = useState(0);
  const previousDisplayIdRef = useRef<string>(id);
  const transitionInProgressRef = useRef<boolean>(false);
  
  // Initialize currentDisplayId เมื่อ id จาก URL เปลี่ยน
  useEffect(() => {
    setCurrentDisplayId(id);
    previousDisplayIdRef.current = id;
    // Clear data เมื่อเปลี่ยน URL
    setVisitData([]);
    setActiveData([]);
    setSkippedData([]);
  }, [id]);

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

  // Fetch setting ตาม currentDisplayId
  useEffect(() => {
    if (!currentDisplayId) return;

    const fetchSetting = async () => {
      try {
        // ใช้ mock data ถ้าเปิด USE_MOCK_DATA
        if (USE_MOCK_DATA) {
          console.log('[Mock] ใช้ mock setting data สำหรับ id:', currentDisplayId);
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 300));
          const mockSetting = getMockSetting(currentDisplayId);
          setSetting(mockSetting);
          return;
        }
        
        const response = await fetch(`/api/setting/${currentDisplayId}`);
        const result = await response.json();
        if (result.success) {
          setSetting(result.data);
          
          // ตรวจสอบ autoSwitch metadata สำหรับ id 214/215
          if (result.autoSwitch && result.autoSwitch.enabled) {
            autoSwitchInfoRef.current = {
              nextId: result.autoSwitch.nextId,
              delaySeconds: result.autoSwitch.delaySeconds || 20,
            };
            console.log(`[AutoSwitch] ตั้งค่า auto-switch: ${currentDisplayId} → ${result.autoSwitch.nextId} ใน ${result.autoSwitch.delaySeconds} วินาที`);
            
            // เริ่ม timer ทันทีหลังจากได้ autoSwitch info (ถ้า URL id เป็น 214/215 และไม่มี popup)
            if ((id === '214' || id === '215') && !showCallPopup && autoSwitchInfoRef.current) {
              // Clear timer เก่าก่อน
              if (autoSwitchTimerRef.current) {
                clearTimeout(autoSwitchTimerRef.current);
                autoSwitchTimerRef.current = null;
              }
              
              const { nextId, delaySeconds } = autoSwitchInfoRef.current;
              console.log(`[AutoSwitch] เริ่มนับเวลา ${delaySeconds} วินาทีเพื่อสลับไป id ${nextId}`);
              
              autoSwitchTimerRef.current = setTimeout(() => {
                console.log(`[AutoSwitch] ครบเวลาแล้ว กำลังสลับไป id ${nextId}`);
                setCurrentDisplayId(nextId);
              }, delaySeconds * 1000);
            }
          } else {
            // ถ้าไม่มี autoSwitch ให้ clear info และ timer
            autoSwitchInfoRef.current = null;
            if (autoSwitchTimerRef.current) {
              clearTimeout(autoSwitchTimerRef.current);
              autoSwitchTimerRef.current = null;
            }
          }
        } else {
          setError("Failed to fetch settings.");
          console.error("Failed to fetch settings:", result.error);
        }
      } catch (e) {
        setError("An error occurred while fetching settings.");
        console.error("An error occurred while fetching settings:", e);
      }
    };

    // ตรวจสอบว่าเป็นการเปลี่ยน ID (transition) หรือ initialization
    const isTransition = transitionInProgressRef.current;
    
    if (isTransition) {
      // ถ้าเป็นการ transition ให้ delay 1s เพื่อให้ข้อมูลเปลี่ยนระหว่างที่สีฟ้าเต็มจอ
      console.log(`[Fetch] Delay 1s เพื่อให้ข้อมูลเปลี่ยนระหว่างที่ overlay สีฟ้าเต็มจอ`);
      const timeoutId = setTimeout(() => {
        fetchSetting();
      }, 1000); // delay 1s หลัง fade in เสร็จ (ระหว่างที่สีฟ้าเต็มจอ)
      
      return () => {
        clearTimeout(timeoutId);
      };
    } else {
      // Initial load - fetch ทันที
      fetchSetting();
    }
    
    // Refresh setting ทุก 3 นาที
    const interval = setInterval(() => fetchSetting(), 3 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [currentDisplayId, id, showCallPopup]);

  // Animation: fade in/out เมื่อ currentDisplayId เปลี่ยน
  useEffect(() => {
    // ตรวจสอบว่า currentDisplayId เปลี่ยนจริงๆ (ไม่ใช่ initialization)
    if (currentDisplayId === previousDisplayIdRef.current) return;
    
    const newDisplayId = currentDisplayId;
    const oldDisplayId = previousDisplayIdRef.current;
    
    console.log(`[Transition] เริ่ม animation: ${oldDisplayId} → ${newDisplayId}`);
    
    // เริ่ม transition
    setIsTransitioning(true);
    transitionInProgressRef.current = true;
    
    // Phase 1: Fade in (1 วินาที)
    setTransitionOpacity(0); // เริ่มจาก 0
    // ใช้ setTimeout เล็กน้อยเพื่อให้ browser render ก่อน
    setTimeout(() => {
      setTransitionOpacity(1); // fade in ถึง 1
    }, 10);
    
    // Phase 2: หลังจาก fade in เสร็จ (1s) → ข้อมูลจะเปลี่ยน
    // (ข้อมูลจะเปลี่ยนอัตโนมัติผ่าน useEffect fetchSetting ที่ delay 1s)
    
    // Phase 3: Fade out หลังจาก fade in เสร็จ (1s)
    setTimeout(() => {
      setTransitionOpacity(0); // fade out กลับไป 0
      
      // Phase 4: เสร็จสิ้น transition หลัง fade out เสร็จ (1s)
      setTimeout(() => {
        setIsTransitioning(false);
        transitionInProgressRef.current = false;
        previousDisplayIdRef.current = newDisplayId;
        console.log(`[Transition] เสร็จสิ้น animation`);
      }, 1000); // fade out duration
    }, 1000); // รอให้ fade in เสร็จ (1s)
    
  }, [currentDisplayId]);

  // Auto-switch logic: เริ่ม/รีเซ็ต timer และสลับ currentDisplayId (ทำงานเมื่อ URL id เป็น 214 หรือ 215)
  useEffect(() => {
    // ตรวจสอบว่า URL id เป็น 214 หรือ 215 และมี autoSwitch info
    if (!(id === '214' || id === '215') || !autoSwitchInfoRef.current) {
      // ถ้าไม่ใช่ 214/215 หรือไม่มี autoSwitch ให้ clear timer
      if (autoSwitchTimerRef.current) {
        clearTimeout(autoSwitchTimerRef.current);
        autoSwitchTimerRef.current = null;
      }
      return;
    }

    // Clear timer เก่าก่อน (จะเริ่มใหม่ด้านล่าง)
    if (autoSwitchTimerRef.current) {
      clearTimeout(autoSwitchTimerRef.current);
      autoSwitchTimerRef.current = null;
    }

    // ถ้า popup เปิดอยู่ ไม่เริ่ม timer (รอให้ popup ปิดก่อน)
    if (showCallPopup) {
      console.log(`[AutoSwitch] รอให้ popup ปิดก่อนเริ่ม timer`);
      return;
    }

    // เริ่ม timer เมื่อไม่มี popup
    const { nextId, delaySeconds } = autoSwitchInfoRef.current;
    console.log(`[AutoSwitch] เริ่มนับเวลา ${delaySeconds} วินาทีเพื่อสลับไป id ${nextId}`);
    
    autoSwitchTimerRef.current = setTimeout(() => {
      console.log(`[AutoSwitch] ครบเวลาแล้ว กำลังสลับไป id ${nextId}`);
      // สลับ currentDisplayId โดยไม่เปลี่ยน URL (จะ trigger animation อัตโนมัติ)
      setCurrentDisplayId(nextId);
    }, delaySeconds * 1000);

    // Cleanup เมื่อ component unmount หรือ dependencies เปลี่ยน
    return () => {
      if (autoSwitchTimerRef.current) {
        clearTimeout(autoSwitchTimerRef.current);
        autoSwitchTimerRef.current = null;
      }
    };
  }, [currentDisplayId, showCallPopup, id]);

  // WebSocket connection - ใช้ currentDisplayId และ re-register เมื่อเปลี่ยน
  useEffect(() => {
    if (!currentDisplayId || !audioUnlocked) return;

    // ใช้ mock data ถ้าเปิด USE_MOCK_DATA
    if (USE_MOCK_DATA) {
      console.log('[Mock] ใช้ mock WebSocket data สำหรับ id:', currentDisplayId);
      
      // ตั้งค่า mock data ทันที
      setVisitData(generateMockVisitData());
      setActiveData(generateMockActiveData());
      setSkippedData(generateMockSkippedData());
      
      // Simulate data update ทุก 5 วินาที
      const mockInterval = setInterval(() => {
        // สุ่มเปลี่ยนข้อมูลเล็กน้อยเพื่อให้ดูเหมือนมีการอัปเดต
        const newVisitData = generateMockVisitData();
        // สลับลำดับ queue numbers เพื่อให้ดูมีการเปลี่ยนแปลง
        newVisitData.forEach((visit, index) => {
          visit.visit_q_no = `A00${(index + Math.floor(Date.now() / 5000) % 8) + 1}`;
        });
        setVisitData(newVisitData);
        setActiveData(generateMockActiveData());
        setSkippedData(generateMockSkippedData());
        console.log('[Mock] อัปเดต mock data');
      }, 5000);
      
      return () => {
        clearInterval(mockInterval);
        setVisitData([]);
        setActiveData([]);
        setSkippedData([]);
      };
    }

    const wsUrl = `wss://monitor.aztecthstudio.com/ws/`;
    const ws = new WebSocket(wsUrl);
    
    // เก็บ WebSocket instance เพื่อตรวจสอบว่า message มาจาก connection นี้หรือไม่
    let isConnectionActive = true;

    ws.onopen = () => {
      console.log(`[WebSocket] Connected for id ${currentDisplayId}`);
      isConnectionActive = true;
      ws.send(
        JSON.stringify({
          type: "register",
          id: currentDisplayId, // ใช้ currentDisplayId แทน id จาก URL
          query_type: "triple",
        })
      );
    };

    ws.onmessage = async (event) => {
      // ตรวจสอบว่า connection ยัง active อยู่หรือไม่ (ป้องกัน message จาก connection เก่า)
      if (!isConnectionActive) {
        console.log(`[WebSocket] ข้าม message เนื่องจาก connection ไม่ active`);
        return;
      }

      // ไม่รับ call message ถ้ากำลัง paused หรือกำลัง update call status
      if (isPausedRef.current || isUpdatingCallStatusRef.current) {
        console.log(`[WebSocket] ข้าม call message เนื่องจาก isPaused: ${isPausedRef.current}, isUpdatingCallStatus: ${isUpdatingCallStatusRef.current}`);
        return;
      }
      try {
        const data = JSON.parse(event.data);
        if (data.wait && Array.isArray(data.wait)) {
          setVisitData(data.wait);
        }
        if (data.active && Array.isArray(data.active)) {
          setActiveData(data.active);
        }
        if (data.skip && Array.isArray(data.skip)) {
          setSkippedData(data.skip);
        }
        if (data.call) {
          // ตรวจสอบ VN ก่อนเป็นอันดับแรก (สำคัญที่สุด)
          const vn = data.call.vn;
          if (vn && playedVnSetRef.current.has(vn)) {
            console.log(`[Call] ข้าม call message เนื่องจาก VN ${vn} เล่นไปแล้ว (ตรวจสอบ VN ก่อน)`);
            return; // ข้าม call message นี้ทันที
          }

          // ตรวจสอบ paused และ updating status (ตรวจสอบหลังจาก VN)
          if (isPausedRef.current || isUpdatingCallStatusRef.current) {
            console.log(`[Call] ข้าม call message เนื่องจาก isPaused: ${isPausedRef.current}, isUpdatingCallStatus: ${isUpdatingCallStatusRef.current}`);
            return;
          }

          // เก็บ VN ไว้ใน set ทันที (ก่อนเล่นเสียง) เพื่อป้องกันการเล่นซ้ำ
          if (vn) {
            // ตรวจสอบอีกครั้งก่อนเก็บ (ป้องกัน race condition)
            if (playedVnSetRef.current.has(vn)) {
              console.log(`[Call] ข้าม call message เนื่องจาก VN ${vn} เล่นไปแล้ว (double check)`);
              return;
            }

            playedVnSetRef.current.add(vn);
            console.log(`[Call] เก็บ VN ${vn} ไว้ในรายการที่เล่นแล้ว (ก่อนเล่นเสียง)`);

            // Clear timer เก่าถ้ามี (กรณีที่ VN เดียวกันมาใหม่ก่อน 5 วินาที)
            const existingTimer = vnCleanupTimersRef.current.get(vn);
            if (existingTimer) {
              clearTimeout(existingTimer);
              console.log(`[Call] Clear timer เก่าสำหรับ VN ${vn}`);
            }

            // สร้าง timer เพื่อลบ VN หลังจาก 5 วินาที
            const cleanupTimer = setTimeout(() => {
              const deleted = playedVnSetRef.current.delete(vn);
              vnCleanupTimersRef.current.delete(vn);
              if (deleted) {
                console.log(`[Call] ลบ VN ${vn} ออกจากรายการที่เล่นแล้ว (ผ่านไป 5 วินาที)`);
              }
            }, 5000); // 5 วินาที

            vnCleanupTimersRef.current.set(vn, cleanupTimer);
          }

          // ตั้งค่า paused และ updating flag (หลังจากเก็บ VN แล้ว)
          isPausedRef.current = true;
          isUpdatingCallStatusRef.current = true;
          setCallData(data.call);
          setShowCallPopup(true);

          const hasVoice =
            data.call.voice &&
            Array.isArray(data.call.voice) &&
            data.call.voice.length > 0;

          try {
            // เล่นเสียง (ถ้ามี)
            if (hasVoice) {
              await playVoicePlaylist(
                data.call.voice,
                currentSoundRef
              );
            }

            // Update call status (รอให้เสร็จก่อน)
            if (vn) {
              console.log(`[Call] กำลัง update call status สำหรับ vn: ${vn}`);
              await updateCallStatus(vn);
              console.log(`[Call] update call status เสร็จแล้วสำหรับ vn: ${vn}`);
            }

            // หลังจากเสียงพูดจบและ update เสร็จแล้ว รอ 2 วินาทีแล้วปิด popup
            setTimeout(() => {
              setShowCallPopup(false);
              isPausedRef.current = false;
              isUpdatingCallStatusRef.current = false;
              console.log(`[Call] พร้อมรับ call message ถัดไป`);
            }, 2000);
          } catch (error) {
            console.error("[Call] เกิดข้อผิดพลาดในการประมวลผล call:", error);
            // ถ้าเกิด error ก็ให้ reset flags
            setTimeout(() => {
              setShowCallPopup(false);
              isPausedRef.current = false;
              isUpdatingCallStatusRef.current = false;
            }, 2000);
          }
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
        // Reset flags เมื่อเกิด error
        isPausedRef.current = false;
        isUpdatingCallStatusRef.current = false;
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log(`[WebSocket] Disconnected for id ${currentDisplayId}`);
      isConnectionActive = false;
    };

    // Cleanup: close connection และ clear data เมื่อ currentDisplayId เปลี่ยน
    return () => {
      isConnectionActive = false; // Mark connection as inactive ก่อน close
      ws.close();
      // Clear data เมื่อเปลี่ยน id
      setVisitData([]);
      setActiveData([]);
      setSkippedData([]);
      // ไม่ clear VN cleanup timers เพื่อให้ timer ทำงานต่อ
      // VN จะถูกลบหลังจาก 5 วินาที (นับจากตอนที่เก็บ VN)
      // เก็บ playedVnSet ไว้เพื่อป้องกันการเล่นซ้ำเมื่อ re-connect
    };
  }, [currentDisplayId, audioUnlocked]);

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

  if (error) {
    return (
      <div className={styles.container}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            fontSize: "1.2rem",
            color: "#dc2626",
          }}
        >
          เกิดข้อผิดพลาด: {error}
        </div>
      </div>
    );
  }

  if (!setting) {
    return <LoadingSpinner text="กำลังรอการตั้งค่า..." />;
  }

  const tableNames = setting.station_l ? setting.station_l.split(",") : [];
  const fontFamily =
    setting.font === "sarabun"
      ? "'Sarabun', sans-serif"
      : "'LINESeed', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  return (
    <div className={styles.container} style={{ fontFamily }}>
      <AudioUnlockOverlay onUnlocked={() => setAudioUnlocked(true)} />
      {showCallPopup && callData && (
        <CallPopup setting={setting} callData={callData} />
      )}
      
      {/* Transition Overlay - สีฟ้า fade in/out */}
      {isTransitioning && (
        <div
          className={styles.transitionOverlay}
          style={{
            opacity: transitionOpacity,
            transition: 'opacity 1s ease-in-out',
            background: 'linear-gradient(135deg, #043566, #065a9e)',
          }}
        />
      )}
      
      <Header setting={setting} />

      <main className={styles.mainContent}>
        {/* แสดงรูปโฆษณาฝั่งซ้าย (ads_type = 'left') */}
        {(() => {
          const enableAds = setting.enable_ads ?? (setting.ads && setting.ads !== '' && setting.ads !== 'false');
          if (!enableAds || setting.ads_type !== "left") return null;
          
          // ใช้ ads_path_left ถ้ามี ไม่เช่นนั้นใช้ ads (backward compatibility)
          const leftAdsUrl = setting.ads_path_left || setting.ads;
          return leftAdsUrl ? (
            <div className={styles.adsContainer}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={leftAdsUrl}
                alt="Advertisement"
                className={styles.adsImage}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ) : null;
        })()}
        <InterviewTable setting={setting} visitData={visitData} />
        {/* แสดงรูปโฆษณาฝั่งขวา (ads_type = 'right') */}
        {(() => {
          const enableAds = setting.enable_ads ?? (setting.ads && setting.ads !== '' && setting.ads !== 'false');
          if (!enableAds || setting.ads_type !== "right") return null;
          
          // ใช้ ads_path_right ถ้ามี ไม่เช่นนั้นใช้ ads (backward compatibility)
          const rightAdsUrl = setting.ads_path_right || setting.ads;
          return rightAdsUrl ? (
            <div className={styles.adsContainer}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rightAdsUrl}
                alt="Advertisement"
                className={styles.adsImage}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ) : null;
        })()}
      </main>

      {/* Overlay โฆษณาแบบหน้าแยก (split) */}
      {(() => {
        const enableAds = setting.enable_ads ?? (setting.ads && setting.ads !== '' && setting.ads !== 'false');
        if (!enableAds || setting.ads_type !== 'split' || !showSplitAd) return null;
        
        // ใช้ ads_path_left ถ้ามี ไม่เช่นนั้นใช้ ads (backward compatibility)
        const splitAdsUrl = setting.ads_path_left || setting.ads;
        return splitAdsUrl ? (
          <div className={styles.adsOverlay}>
            <div className={styles.adsOverlayContent}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={splitAdsUrl}
                alt="Advertisement"
                className={styles.adsOverlayImage}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          </div>
        ) : null;
      })()}

      {setting && <SkippedQueueBar skippedData={skippedData} setting={setting} />}
    </div>
  );
}
