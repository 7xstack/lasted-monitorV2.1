"use client";

import { useState, useEffect } from "react";
import styles from "../../single/[id]/page.module.css";
import { Setting, VisitInfo } from "../../single/[id]/types";
import Header from "../../single/[id]/Header";
import InterviewTable from "../../single/[id]/InterviewTable";
import ServiceSection from "../../single/[id]/ServiceSection";
import SkippedQueueBar from "../../single/[id]/SkippedQueueBar";

// Mock Data
const mockSetting: Setting = {
  id: 1,
  department: "ตรวจโรคทั่วไป",
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
  stem_name_popup: null,
  station_l: "โต๊ะ 1,โต๊ะ 2,โต๊ะ 3",
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
  ads_type: "split",
  enable_ads: false,
  ads_path_left: "",
  ads_path_right: "",
  timeout: null,
  pages: null,
  urgent_setup: "ฉุกเฉิน",
  type: "single",
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

const mockVisitData1: VisitInfo[] = [
  { id: 1, patient_name: "สมชาย ใจดี", name: "สมชาย", surname: "ใจดี", queue_number: "A1", visit_q_no: "A1", status: "wait", urgent_id: 1, urgent_color: "#0066AA", Color: "#0066AA", status_patient: "รอ" },
  { id: 2, patient_name: "สมหญิง รักดี", name: "สมหญิง", surname: "รักดี", queue_number: "A2", visit_q_no: "A2", status: "wait", urgent_id: 2, urgent_color: "#0066AA", Color: "#0066AA", status_patient: "รอ" },
];

const mockVisitData2: VisitInfo[] = [
  { id: 11, patient_name: "วิชัย สุขดี", name: "วิชัย", surname: "สุขดี", queue_number: "A11", visit_q_no: "A11", status: "wait", urgent_id: 1, urgent_color: "#0066AA", Color: "#0066AA", status_patient: "รอ" },
  { id: 12, patient_name: "สมพร พรดี", name: "สมพร", surname: "พรดี", queue_number: "A12", visit_q_no: "A12", status: "wait", urgent_id: 2, urgent_color: "#0066AA", Color: "#0066AA", status_patient: "รอ" },
];

const mockActiveData1: VisitInfo[] = [
  { id: 4, patient_name: "มานะ ขยันดี", name: "มานะ", surname: "ขยันดี", queue_number: "A4", visit_q_no: "A4", status: "active", urgent_id: 1, urgent_color: "#0066AA", Color: "#0066AA", status_patient: "กำลังรับบริการ", station: "โต๊ะ 1" },
];

const mockActiveData2: VisitInfo[] = [
  { id: 14, patient_name: "ปิติ พรหมดี", name: "ปิติ", surname: "พรหมดี", queue_number: "A14", visit_q_no: "A14", status: "active", urgent_id: 1, urgent_color: "#0066AA", Color: "#0066AA", status_patient: "กำลังรับบริการ", station: "โต๊ะ 1" },
];

// Mock Data สำหรับหน้า 2 (Page ID = '2')
const mockSetting2: Setting = {
  ...mockSetting,
  station_l: "โต๊ะ 4,โต๊ะ 5,โต๊ะ 6", // เปลี่ยน station
};

const mockVisitDataPage2_1: VisitInfo[] = [
  { id: 21, patient_name: "กมล คนดี", name: "กมล", surname: "คนดี", queue_number: "B1", visit_q_no: "B1", status: "wait", urgent_id: 1, urgent_color: "#0066AA", Color: "#0066AA", status_patient: "รอ" },
  { id: 22, patient_name: "นารี มีสุข", name: "นารี", surname: "มีสุข", queue_number: "B2", visit_q_no: "B2", status: "wait", urgent_id: 2, urgent_color: "#0066AA", Color: "#0066AA", status_patient: "รอ" },
];

const mockVisitDataPage2_2: VisitInfo[] = [
  { id: 31, patient_name: "ประเสริฐ เก่งมาก", name: "ประเสริฐ", surname: "เก่งมาก", queue_number: "B11", visit_q_no: "B11", status: "wait", urgent_id: 1, urgent_color: "#0066AA", Color: "#0066AA", status_patient: "รอ" },
  { id: 32, patient_name: "สุภาพ ดีใจ", name: "สุภาพ", surname: "ดีใจ", queue_number: "B12", visit_q_no: "B12", status: "wait", urgent_id: 2, urgent_color: "#0066AA", Color: "#0066AA", status_patient: "รอ" },
];

const mockActiveDataPage2_1: VisitInfo[] = [
  { id: 24, patient_name: "ชูใจ ใจดี", name: "ชูใจ", surname: "ใจดี", queue_number: "B4", visit_q_no: "B4", status: "active", urgent_id: 1, urgent_color: "#0066AA", Color: "#0066AA", status_patient: "กำลังรับบริการ", station: "โต๊ะ 4" },
];

const mockActiveDataPage2_2: VisitInfo[] = [
  { id: 34, patient_name: "วราภรณ์ ใจกว้าง", name: "วราภรณ์", surname: "ใจกว้าง", queue_number: "B14", visit_q_no: "B14", status: "active", urgent_id: 1, urgent_color: "#0066AA", Color: "#0066AA", status_patient: "กำลังรับบริการ", station: "โต๊ะ 4" },
];

interface PreviewSinglePageProps {
  pageId?: string;
}

export default function PreviewSinglePage({ pageId }: PreviewSinglePageProps = { pageId: undefined }) {
  const [dataIndex, setDataIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ตรวจสอบว่าเป็นหน้า 2 หรือไม่
  const isPage2 = pageId === '2';

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

  // เลือก mock data ตาม pageId
  const currentSetting = isPage2 ? mockSetting2 : mockSetting;
  const currentActiveData = isPage2 
    ? (dataIndex === 0 ? mockActiveDataPage2_1 : mockActiveDataPage2_2)
    : (dataIndex === 0 ? mockActiveData1 : mockActiveData2);
  const currentVisitData = isPage2
    ? (dataIndex === 0 ? mockVisitDataPage2_1 : mockVisitDataPage2_2)
    : (dataIndex === 0 ? mockVisitData1 : mockVisitData2);

  const tableNames = currentSetting.station_l ? currentSetting.station_l.split(",") : [];
  const fontFamily = currentSetting.font === "sarabun" ? "'Sarabun', sans-serif" : "'LINESeed', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  return (
    <div className={styles.container} style={{ fontFamily }}>
      <div className={isTransitioning ? styles.fadeOut : styles.fadeIn}>
        <Header setting={currentSetting} />
      <main className={styles.mainContent}>
          <InterviewTable setting={currentSetting} visitData={currentVisitData} />
        <ServiceSection
            setting={currentSetting}
            sortedActiveData={currentActiveData}
          tableNames={tableNames}
            hideNumber={true}
          />
      </main>
        <SkippedQueueBar skippedData={[]} setting={currentSetting} />
          </div>
    </div>
  );
}
