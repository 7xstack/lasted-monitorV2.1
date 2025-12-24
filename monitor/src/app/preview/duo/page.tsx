'use client';

import { useState } from 'react';
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
  n_hospital: "โรงพยาบาลชนบท",
  n_room: "",
  n_table: "จุดซักประวัติ (ซ้าย)",
  n_table_r: "จุดซักประวัติ (ขวา)",
  n_listtable: "",
  n_listroom: "",
  department_load: "1",
  department_room_load: "2",
  time_col: "true",
  table_arr: "false",
  table_arr2: "false",
  amount_boxL: 5,
  amount_boxR: 5,
  stem_surname: "name",
  stem_surname_table: "name",
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
  status_patient: "true",
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
  time_wait: "20",
  listPage: "",
  limitNum: null,
  speedLoop: null,
  activeLoop: null,
  font: "sarabun",
  color_static: null,
  color_dynamic: null,
};

const mockVisitDataLeft: VisitInfo[] = [
  {
    id: 1,
    code_dept_id: "1",
    patient_name: "สมชาย ใจดี",
    queue_number: "A001",
    visit_date: "2024-01-15",
    status: "wait",
    urgent_id: 1,
    urgent_color: "#FF0000",
    urgent_setup: "ฉุกเฉิน",
    urgent_level: "สูง",
    priority_rate: 1,
    check_in: "2024-01-15 08:00:00",
    time_call: undefined,
    status_call: undefined,
    arr_r: false,
    station_index: 1,
  },
  {
    id: 2,
    code_dept_id: "1",
    patient_name: "สมหญิง รักดี",
    queue_number: "A002",
    visit_date: "2024-01-15",
    status: "wait",
    urgent_id: 2,
    urgent_color: "#FFA500",
    urgent_setup: "ด่วน",
    urgent_level: "ปานกลาง",
    priority_rate: 2,
    check_in: "2024-01-15 08:05:00",
    time_call: undefined,
    status_call: undefined,
    arr_r: false,
    station_index: 2,
  },
];

const mockActiveDataLeft: VisitInfo[] = [
  {
    id: 3,
    code_dept_id: "1",
    patient_name: "มานะ ขยันดี",
    queue_number: "A003",
    visit_date: "2024-01-15",
    status: "active",
    urgent_id: 1,
    urgent_color: "#FF0000",
    urgent_setup: "ฉุกเฉิน",
    urgent_level: "สูง",
    priority_rate: 1,
    check_in: "2024-01-15 07:50:00",
    time_call: "2024-01-15 08:00:00",
    status_call: "called",
    arr_r: false,
    station_index: 1,
  },
];

const mockVisitDataRight: VisitInfo[] = [
  {
    id: 4,
    code_dept_id: "2",
    patient_name: "วิชัย สุขดี",
    queue_number: "B001",
    visit_date: "2024-01-15",
    status: "wait",
    urgent_id: 2,
    urgent_color: "#FFA500",
    urgent_setup: "ด่วน",
    urgent_level: "ปานกลาง",
    priority_rate: 2,
    check_in: "2024-01-15 08:10:00",
    time_call: undefined,
    status_call: undefined,
    arr_r: false,
    station_index: 4,
  },
  {
    id: 5,
    code_dept_id: "2",
    patient_name: "มาลี สวยดี",
    queue_number: "B002",
    visit_date: "2024-01-15",
    status: "wait",
    urgent_id: 3,
    urgent_color: "#00FF00",
    urgent_setup: "ปกติ",
    urgent_level: "ต่ำ",
    priority_rate: 3,
    check_in: "2024-01-15 08:15:00",
    time_call: undefined,
    status_call: undefined,
    arr_r: false,
    station_index: 5,
  },
];

const mockActiveDataRight: VisitInfo[] = [
  {
    id: 6,
    code_dept_id: "2",
    patient_name: "วินัย ดีมาก",
    queue_number: "B003",
    visit_date: "2024-01-15",
    status: "active",
    urgent_id: 2,
    urgent_color: "#FFA500",
    urgent_setup: "ด่วน",
    urgent_level: "ปานกลาง",
    priority_rate: 2,
    check_in: "2024-01-15 08:05:00",
    time_call: "2024-01-15 08:10:00",
    status_call: "called",
    arr_r: false,
    station_index: 4,
  },
];

const mockSkippedData: VisitInfo[] = [];

export default function PreviewDuoPage() {
  const [showSplitAd] = useState(false);

  const tableNamesLeft = mockSetting.station_l ? mockSetting.station_l.split(',') : [];
  const tableNamesRight = mockSetting.station_r ? mockSetting.station_r.split(',') : [];
  const fontFamily = mockSetting.font === 'sarabun' ? "'Sarabun', sans-serif" : "'LINESeed', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  return (
    <div className={styles.container} style={{ fontFamily }}>
      <Header setting={mockSetting} />
      <main className={styles.mainContent}>
        <div className={styles.column}>
          <InterviewTable setting={mockSetting} visitData={mockVisitDataLeft} />
          <ServiceSection setting={mockSetting} sortedActiveData={mockActiveDataLeft} tableNames={tableNamesLeft} />
        </div>
        <div className={styles.column}>
          <InterviewTableRight setting={mockSetting} visitData={mockVisitDataRight} />
          <ServiceSection setting={mockSetting} sortedActiveData={mockActiveDataRight} tableNames={tableNamesRight} isRight={true} />
        </div>
      </main>
      
      {/* Overlay โฆษณาแบบหน้าแยก (split) */}
      {(() => {
        const enableAds = mockSetting.enable_ads ?? (mockSetting.ads && mockSetting.ads !== '' && mockSetting.ads !== 'false');
        if (!enableAds || mockSetting.ads_type !== 'split' || !showSplitAd) return null;
        
        const splitAdsUrl = mockSetting.ads_path_left || mockSetting.ads;
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
      
      {mockSetting && <SkippedQueueBar skippedData={mockSkippedData} setting={mockSetting} />}

    </div>
  );
}
