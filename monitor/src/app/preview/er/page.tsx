'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import styles from '../../er/[id]/page.module.css';
import { Setting, VisitInfo, UrgentLevel } from '../../er/[id]/types';

const Header = dynamic(() => import('../../er/[id]/Header'), { ssr: false });
const InterviewTable = dynamic(() => import('../../er/[id]/InterviewTable'), { ssr: false });
const ServiceSection = dynamic(() => import('../../er/[id]/ServiceSection'), { ssr: false });
const SkippedQueueBar = dynamic(() => import('../../er/[id]/SkippedQueueBar'), { ssr: false });

// Mock Data Base Setting
const mockSetting: Setting = {
  id: 1,
  type: "er",
  department: "แผนกฉุกเฉิน",
  n_hospital: "โรงพยาบาลแอซเท็ก",
  n_room: "",
  n_table: "จุดซักประวัติ",
  n_listtable: "",
  n_listroom: "",
  department_load: "1",
  department_room_load: "",
  time_col: "false",
  table_arr: "false",
  table_arr2: "false",
  amount_boxL: 5,
  amount_boxR: 0,
  stem_surname: "name",
  stem_surname_table: "surname",
  stem_surname_popup: "false",
  stem_name_table: null,
  station_l: "โต๊ะ 1,โต๊ะ 2,โต๊ะ 3,โต๊ะ 4,โต๊ะ 5",
  station_r: "",
  stem_popup: "",
  a_sound: "true",
  b_sound: "false",
  c_sound: "false",
  stem_name: null,
  urgent_color: "true",
  lock_position: "false",
  lock_position_right: "false",
  urgent_level: "true",
  status_patient: "false",
  status_check: "false",
  ads: "",
  timeout: null,
  pages: null,
  urgent_setup: "ฉุกเฉิน",
  alternate: null,
  voice: null,
  style_voice: null,
  set_descrip: "",
  set_notice: "",
  time_wait: "10",
  listPage: "",
  limitNum: null,
  speedLoop: null,
  activeLoop: null,
  font: "sarabun",
  list_urgent: "R,E,U,S,N",
  ads_type: "split",
  enable_ads: false,
  ads_path_left: "",
  ads_path_right: "",
  color_static: null,
  color_dynamic: null,
};

const mockActiveData1: VisitInfo[] = [
  { id: 1, patient_name: "มานะ ขยันดี", name: "มานะ", surname: "ขยันดี", queue_number: "ER1", visit_q_no: "ER1", status: "active", urgent_id: 1, station: "R", Color: "#D32F2F" },
  { id: 2, patient_name: "มาลี สวยดี", name: "มาลี", surname: "สวยดี", queue_number: "ER2", visit_q_no: "ER2", status: "active", urgent_id: 2, station: "E", Color: "#E91E63" },
  { id: 3, patient_name: "ปิติ พรหมดี", name: "ปิติ", surname: "พรหมดี", queue_number: "ER3", visit_q_no: "ER3", status: "active", urgent_id: 3, station: "U", Color: "#FFCA28" },
  { id: 4, patient_name: "ชูใจ ใจดี", name: "ชูใจ", surname: "ใจดี", queue_number: "ER4", visit_q_no: "ER4", status: "active", urgent_id: 4, station: "S", Color: "#66BB6A" },
  { id: 5, patient_name: "วีระ สุขใจ", name: "วีระ", surname: "สุขใจ", queue_number: "ER5", visit_q_no: "ER5", status: "active", urgent_id: 5, station: "N", Color: "#0D1B3E" },
];

const mockActiveData2: VisitInfo[] = [
  { id: 6, patient_name: "ประเสริฐ เก่งมาก", name: "ประเสริฐ", surname: "เก่งมาก", queue_number: "ER101", visit_q_no: "ER101", status: "active", urgent_id: 1, station: "R", Color: "#D32F2F" },
  { id: 7, patient_name: "สุภาพ ดีใจ", name: "สุภาพ", surname: "ดีใจ", queue_number: "ER102", visit_q_no: "ER102", status: "active", urgent_id: 2, station: "E", Color: "#E91E63" },
  { id: 8, patient_name: "วราภรณ์ ใจกว้าง", name: "วราภรณ์", surname: "ใจกว้าง", queue_number: "ER103", visit_q_no: "ER103", status: "active", urgent_id: 3, station: "U", Color: "#FFCA28" },
  { id: 9, patient_name: "สมศักดิ์ รักชาติ", name: "สมศักดิ์", surname: "รักชาติ", queue_number: "ER104", visit_q_no: "ER104", status: "active", urgent_id: 4, station: "S", Color: "#66BB6A" },
  { id: 10, patient_name: "กนกพร ใจงาม", name: "กนกพร", surname: "ใจงาม", queue_number: "ER105", visit_q_no: "ER105", status: "active", urgent_id: 5, station: "N", Color: "#0D1B3E" },
];

const mockVisitData1: VisitInfo[] = [
  { id: 11, patient_name: "วิชัย สุขดี", name: "วิชัย", surname: "สุขดี", queue_number: "ER11", visit_q_no: "ER11", status: "wait", urgent_id: 1, Color: "#D32F2F" },
  { id: 12, patient_name: "สมหญิง รักดี", name: "สมหญิง", surname: "รักดี", queue_number: "ER12", visit_q_no: "ER12", status: "wait", urgent_id: 2, Color: "#E91E63" },
];

const mockVisitData2: VisitInfo[] = [
  { id: 13, patient_name: "ทองดี มีชัย", name: "ทองดี", surname: "มีชัย", queue_number: "ER111", visit_q_no: "ER111", status: "wait", urgent_id: 1, Color: "#D32F2F" },
  { id: 14, patient_name: "สายใจ ใฝ่ดี", name: "สายใจ", surname: "ใฝ่ดี", queue_number: "ER112", visit_q_no: "ER112", status: "wait", urgent_id: 2, Color: "#E91E63" },
];

const mockUrgentLevels: UrgentLevel[] = [
  { ID: 1, Color: "#D32F2F", Urgent_level: "R" }, 
  { ID: 2, Color: "#E91E63", Urgent_level: "E" },
  { ID: 3, Color: "#FFCA28", Urgent_level: "U" }, 
  { ID: 4, Color: "#66BB6A", Urgent_level: "S" },
  { ID: 5, Color: "#0D1B3E", Urgent_level: "N" },
];

const mockCountData = { "R": 5, "E": 4, "U": 3, "S": 2, "N": 1 };

export default function PreviewErPage() {
  const [dataIndex, setDataIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataIndexRef = useRef(0);

  // Function สำหรับเริ่ม Transition (เหมือน ER หลัก)
  const startTransition = (direction: 'left' | 'right') => {
    setSlideDirection(direction);
    setIsTransitioning(true); // เริ่มจอเก่าเลื่อนออก
    setIsFading(false); // ยังไม่แสดงจอใหม่
    
    // หลังจาก 0.6s (จอเก่าเลื่อนออกเสร็จ) สลับข้อมูลและแสดงจอใหม่
    setTimeout(() => {
      dataIndexRef.current = dataIndexRef.current === 0 ? 1 : 0;
      setDataIndex(dataIndexRef.current);
      setIsFading(true); // แสดงจอใหม่และเริ่มเลื่อนเข้ามา
      
      // หลังจาก 1.5s (จอใหม่เลื่อนเข้ามาเสร็จ) ปิด state
      setTimeout(() => {
        setIsTransitioning(false);
        setIsFading(false);
      }, 1500); // 1.5s สำหรับจอใหม่เลื่อนเข้ามา
    }, 600); // 0.6s สำหรับจอเก่าเลื่อนออก
  };

  useEffect(() => {
    const timeWait = parseInt(mockSetting.time_wait || "10");
    
    const scheduleNext = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        // สลับข้อมูลและเริ่ม transition
        const direction = dataIndexRef.current === 0 ? 'left' : 'right';
        startTransition(direction);
        scheduleNext(); // วนลูปต่อไป
      }, timeWait * 1000);
    };

    scheduleNext();
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const currentActiveData = dataIndex === 0 ? mockActiveData1 : mockActiveData2;
  const currentVisitData = dataIndex === 0 ? mockVisitData1 : mockVisitData2;

  const fontFamily = mockSetting.font === 'sarabun' ? "'Sarabun', sans-serif" : "'LINESeed', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  const renderContent = () => (
    <>
      <Header setting={mockSetting} />
      <main className={styles.mainContent}>
        <InterviewTable setting={mockSetting} visitData={currentVisitData} />
        <ServiceSection 
          setting={mockSetting} 
          activeData={currentActiveData} 
          urgentLevels={mockUrgentLevels}
          countData={mockCountData}
          hideNumber={true}
        />
      </main>
      <SkippedQueueBar skippedData={[]} setting={mockSetting} />
    </>
  );

  return (
    <div className={styles.container} style={{ fontFamily }}>
      <div className={`${styles.contentWrapper} ${isTransitioning ? (slideDirection === 'left' ? styles.slideOutLeft : styles.slideOutRight) : ''}`}>
        {renderContent()}
          </div>
      
      {isFading && (
        <div className={`${styles.contentWrapper} ${slideDirection === 'left' ? styles.slideInFromRight : styles.slideInFromLeft}`}>
          {renderContent()}
        </div>
      )}
    </div>
  );
}
