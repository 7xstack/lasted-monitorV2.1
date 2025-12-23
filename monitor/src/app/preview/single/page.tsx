"use client";

import { useState } from "react";
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
  n_hospital: "โรงพยาบาลชนบท",
  n_room: "",
  n_table: "จุดซักประวัติ",
  n_listtable: "",
  n_listroom: "",
  department_load: "1",
  department_room_load: "",
  time_col: "true",
  table_arr: "false",
  table_arr2: "false",
  amount_boxL: 5,
  amount_boxR: 0,
  stem_surname: "name",
  stem_surname_table: "name",
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
  type: "single",
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

const mockVisitData: VisitInfo[] = [
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
  {
    id: 3,
    code_dept_id: "1",
    patient_name: "วิชัย สุขดี",
    queue_number: "A003",
    visit_date: "2024-01-15",
    status: "wait",
    urgent_id: 3,
    urgent_color: "#00FF00",
    urgent_setup: "ปกติ",
    urgent_level: "ต่ำ",
    priority_rate: 3,
    check_in: "2024-01-15 08:10:00",
    time_call: undefined,
    status_call: undefined,
    arr_r: false,
    station_index: 3,
  },
];

const mockActiveData: VisitInfo[] = [
  {
    id: 4,
    code_dept_id: "1",
    patient_name: "มานะ ขยันดี",
    queue_number: "A004",
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
  {
    id: 5,
    code_dept_id: "1",
    patient_name: "มาลี สวยดี",
    queue_number: "A005",
    visit_date: "2024-01-15",
    status: "active",
    urgent_id: 2,
    urgent_color: "#FFA500",
    urgent_setup: "ด่วน",
    urgent_level: "ปานกลาง",
    priority_rate: 2,
    check_in: "2024-01-15 07:55:00",
    time_call: "2024-01-15 08:05:00",
    status_call: "called",
    arr_r: false,
    station_index: 2,
  },
];

const mockSkippedData: VisitInfo[] = [];

export default function PreviewSinglePage() {
  const [showSplitAd] = useState(false);

  const tableNames = mockSetting.station_l ? mockSetting.station_l.split(",") : [];
  const fontFamily =
    mockSetting.font === "sarabun"
      ? "'Sarabun', sans-serif"
      : "'LINESeed', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  return (
    <div className={styles.container} style={{ fontFamily }}>
      <Header setting={mockSetting} />

      <main className={styles.mainContent}>
        {/* แสดงรูปโฆษณาฝั่งซ้าย (ads_type = 'left') */}
        {(() => {
          const enableAds = mockSetting.enable_ads ?? (mockSetting.ads && mockSetting.ads !== '' && mockSetting.ads !== 'false');
          if (!enableAds || mockSetting.ads_type !== "left") return null;
          
          const leftAdsUrl = mockSetting.ads_path_left || mockSetting.ads;
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
        <InterviewTable setting={mockSetting} visitData={mockVisitData} />

        <ServiceSection
          setting={mockSetting}
          sortedActiveData={mockActiveData}
          tableNames={tableNames}
        />
        {/* แสดงรูปโฆษณาฝั่งขวา (ads_type = 'right') */}
        {(() => {
          const enableAds = mockSetting.enable_ads ?? (mockSetting.ads && mockSetting.ads !== '' && mockSetting.ads !== 'false');
          if (!enableAds || mockSetting.ads_type !== "right") return null;
          
          const rightAdsUrl = mockSetting.ads_path_right || mockSetting.ads;
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
