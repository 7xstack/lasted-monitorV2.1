'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import styles from '../../er/[id]/page.module.css';
import { Setting, VisitInfo, UrgentLevel } from '../../er/[id]/types';

const Header = dynamic(() => import('../../er/[id]/Header'), { ssr: false });
const InterviewTable = dynamic(() => import('../../er/[id]/InterviewTable'), { ssr: false });
const ServiceSection = dynamic(() => import('../../er/[id]/ServiceSection'), { ssr: false });
const SkippedQueueBar = dynamic(() => import('../../er/[id]/SkippedQueueBar'), { ssr: false });

// Mock Data
const mockSetting: Setting = {
  id: 1,
  type: "er",
  department: "แผนกฉุกเฉิน",
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
  station_l: "ER-A,ER-B,ER-C,ER-D,ER-E",
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
  timeout: null,
  pages: null,
  urgent_setup: "ฉุกเฉิน",
  alternate: null,
  voice: null,
  style_voice: null,
  set_descrip: "",
  set_notice: "",
  time_wait: "20",
  listPage: "",
  limitNum: null,
  speedLoop: null,
  activeLoop: null,
  font: "sarabun",
  list_urgent: "",
  ads_type: "split",
  enable_ads: false,
  ads_path_left: "",
  ads_path_right: "",
  color_static: null,
  color_dynamic: null,
};

const mockVisitData: VisitInfo[] = [
  {
    id: 1,
    code_dept_id: "1",
    patient_name: "สมชาย ใจดี",
    queue_number: "ER001",
    visit_date: "2024-01-15",
    status: "wait",
    urgent_id: 1,
    urgent_color: "#FF0000",
    urgent_setup: "ฉุกเฉิน",
    urgent_level: "สูง",
    station_index: 1,
  },
  {
    id: 2,
    code_dept_id: "1",
    patient_name: "สมหญิง รักดี",
    queue_number: "ER002",
    visit_date: "2024-01-15",
    status: "wait",
    urgent_id: 2,
    urgent_color: "#FFA500",
    urgent_setup: "ด่วน",
    urgent_level: "ปานกลาง",
    station_index: 2,
  },
  {
    id: 3,
    code_dept_id: "1",
    patient_name: "วิชัย สุขดี",
    queue_number: "ER003",
    visit_date: "2024-01-15",
    status: "wait",
    urgent_id: 3,
    urgent_color: "#00FF00",
    urgent_setup: "ปกติ",
    urgent_level: "ต่ำ",
    station_index: 3,
  },
];

const mockActiveData: VisitInfo[] = [
  {
    id: 4,
    code_dept_id: "1",
    patient_name: "มานะ ขยันดี",
    queue_number: "ER004",
    visit_date: "2024-01-15",
    status: "active",
    urgent_id: 1,
    urgent_color: "#FF0000",
    urgent_setup: "ฉุกเฉิน",
    urgent_level: "สูง",
    station_index: 1,
  },
  {
    id: 5,
    code_dept_id: "1",
    patient_name: "มาลี สวยดี",
    queue_number: "ER005",
    visit_date: "2024-01-15",
    status: "active",
    urgent_id: 2,
    urgent_color: "#FFA500",
    urgent_setup: "ด่วน",
    urgent_level: "ปานกลาง",
    station_index: 2,
  },
];

const mockSkippedData: VisitInfo[] = [];

const mockUrgentLevels: UrgentLevel[] = [
  { ID: 1, Color: "#FF0000", Urgent_level: "สูง" },
  { ID: 2, Color: "#FFA500", Urgent_level: "ปานกลาง" },
  { ID: 3, Color: "#00FF00", Urgent_level: "ต่ำ" },
];

const mockCountData: { [key: string]: number } = {
  "ER-A": 2,
  "ER-B": 1,
  "ER-C": 1,
  "ER-D": 0,
  "ER-E": 1,
};

export default function PreviewErPage() {
  const [showSplitAd] = useState(false);
  const [adsLeftUrl] = useState<string | null>(null);
  const [adsRightUrl] = useState<string | null>(null);

  const fontFamily = mockSetting.font === 'sarabun' ? "'Sarabun', sans-serif" : "'LINESeed', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  return (
    <div className={styles.container} style={{ fontFamily }}>
      <Header setting={mockSetting} />
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

        <InterviewTable setting={mockSetting} visitData={mockVisitData} />

        <ServiceSection 
          setting={mockSetting} 
          activeData={mockActiveData} 
          urgentLevels={mockUrgentLevels}
          countData={mockCountData}
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
