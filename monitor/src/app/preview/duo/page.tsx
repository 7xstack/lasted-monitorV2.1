'use client';

import { useState, useEffect } from 'react';
import styles from '../../duo/[id]/page.module.css';
import Header from '../../duo/[id]/Header';
import InterviewTable from '../../duo/[id]/InterviewTable';
import InterviewTableRight from '../../duo/[id]/InterviewTableRight';
import ServiceSection from '../../duo/[id]/ServiceSection';
import SkippedQueueBar from '../../duo/[id]/SkippedQueueBar';
import { Setting, VisitInfo } from '../../duo/[id]/types';

// Mock Data
const mockSetting: Setting = {
  id: 1,
  department: "ตรวจโรคทั่วไป",
  n_hospital: "โรงพยาบาลแอซเท็ก",
  n_room: "",
  n_table: "จุดซักประวัติ (ซ้าย)",
  n_table_r: "จุดซักประวัติ (ขวา)",
  n_listtable: "",
  n_listroom: "",
  department_load: "1",
  department_room_load: "2",
  time_col: "false",
  table_arr: "false",
  table_arr2: "false",
  amount_boxL: 5,
  amount_boxR: 5,
  stem_surname: "name",
  stem_surname_table: "surname",
  stem_surname_popup: "false",
  stem_name_table: null,
  stem_name_popup: null,
  station_l: "โต๊ะ 1,โต๊ะ 2,โต๊ะ 3",
  station_r: "โต๊ะ 4,โต๊ะ 5,โต๊ะ 6",
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
  ads_type: "split",
  enable_ads: false,
  ads_path_left: "",
  ads_path_right: "",
  timeout: null,
  pages: null,
  urgent_setup: "ฉุกเฉิน",
  type: "duo",
  alternate: null,
  voice: null,
  style_voice: null,
  set_descrip: "",
  set_notice: "",
  type_popup: "",
  time_wait: "10",
  listPage: "",
  limitNum: null,
  speedLoop: null,
  activeLoop: null,
  font: "sarabun",
  color_static: null,
  color_dynamic: null,
};

const mockVisitDataLeft1: VisitInfo[] = [
  { id: 1, patient_name: "สมชาย ใจดี", name: "สมชาย", surname: "ใจดี", queue_number: "A1", visit_q_no: "A1", status: "wait", urgent_id: 1, urgent_color: "#0066AA", Color: "#0066AA", status_patient: "รอ" },
];
const mockVisitDataLeft2: VisitInfo[] = [
  { id: 11, patient_name: "วิชัย สุขดี", name: "วิชัย", surname: "สุขดี", queue_number: "A11", visit_q_no: "A11", status: "wait", urgent_id: 1, urgent_color: "#0066AA", Color: "#0066AA", status_patient: "รอ" },
];

const mockActiveDataLeft1: VisitInfo[] = [
  { id: 3, patient_name: "มานะ ขยันดี", name: "มานะ", surname: "ขยันดี", queue_number: "A3", visit_q_no: "A3", status: "active", urgent_id: 1, urgent_color: "#0066AA", Color: "#0066AA", status_patient: "กำลังรับบริการ", station: "โต๊ะ 1" },
];
const mockActiveDataLeft2: VisitInfo[] = [
  { id: 13, patient_name: "ปิติ พรหมดี", name: "ปิติ", surname: "พรหมดี", queue_number: "A13", visit_q_no: "A13", status: "active", urgent_id: 1, urgent_color: "#0066AA", Color: "#0066AA", status_patient: "กำลังรับบริการ", station: "โต๊ะ 1" },
];

const mockVisitDataRight1: VisitInfo[] = [
  { id: 4, patient_name: "สมหญิง รักดี", name: "สมหญิง", surname: "รักดี", queue_number: "B1", visit_q_no: "B1", status: "wait", urgent_id: 2, urgent_color: "#0066AA", Color: "#0066AA", status_patient: "รอ" },
];
const mockVisitDataRight2: VisitInfo[] = [
  { id: 14, patient_name: "สมพร พรดี", name: "สมพร", surname: "พรดี", queue_number: "B11", visit_q_no: "B11", status: "wait", urgent_id: 2, urgent_color: "#0066AA", Color: "#0066AA", status_patient: "รอ" },
];

const mockActiveDataRight1: VisitInfo[] = [
  { id: 6, patient_name: "วินัย ดีมาก", name: "วินัย", surname: "ดีมาก", queue_number: "B3", visit_q_no: "B3", status: "active", urgent_id: 2, urgent_color: "#0066AA", Color: "#0066AA", status_patient: "กำลังรับบริการ", station: "โต๊ะ 4" },
];
const mockActiveDataRight2: VisitInfo[] = [
  { id: 16, patient_name: "สายใจ ใฝ่ดี", name: "สายใจ", surname: "ใฝ่ดี", queue_number: "B13", visit_q_no: "B13", status: "active", urgent_id: 2, urgent_color: "#0066AA", Color: "#0066AA", status_patient: "กำลังรับบริการ", station: "โต๊ะ 4" },
];

export default function PreviewDuoPage() {
  const [dataIndex, setDataIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setDataIndex((prev) => (prev === 0 ? 1 : 0));
        setIsTransitioning(false);
      }, 500);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const currentActiveLeft = dataIndex === 0 ? mockActiveDataLeft1 : mockActiveDataLeft2;
  const currentVisitLeft = dataIndex === 0 ? mockVisitDataLeft1 : mockVisitDataLeft2;
  const currentActiveRight = dataIndex === 0 ? mockActiveDataRight1 : mockActiveDataRight2;
  const currentVisitRight = dataIndex === 0 ? mockVisitDataRight1 : mockVisitDataRight2;

  const tableNamesLeft = mockSetting.station_l ? mockSetting.station_l.split(',') : [];
  const tableNamesRight = mockSetting.station_r ? mockSetting.station_r.split(',') : [];
  const fontFamily = mockSetting.font === 'sarabun' ? "'Sarabun', sans-serif" : "'LINESeed', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  return (
    <div className={styles.container} style={{ fontFamily }}>
      <div className={isTransitioning ? styles.fadeOut : styles.fadeIn}>
        <Header setting={mockSetting} />
        <main className={styles.mainContent}>
          <div className={styles.column}>
            <InterviewTable setting={mockSetting} visitData={currentVisitLeft} />
            <ServiceSection setting={mockSetting} sortedActiveData={currentActiveLeft} tableNames={tableNamesLeft} hideNumber={true} />
          </div>
          <div className={styles.column}>
            <InterviewTableRight setting={mockSetting} visitData={currentVisitRight} />
            <ServiceSection setting={mockSetting} sortedActiveData={currentActiveRight} tableNames={tableNamesRight} isRight={true} hideNumber={true} />
          </div>
        </main>
        <SkippedQueueBar skippedData={[]} setting={mockSetting} />
      </div>
    </div>
  );
}
