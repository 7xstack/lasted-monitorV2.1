'use client';

import { useState, use, useEffect } from 'react';
import styles from '../../../duo/[id]/page.module.css';
import Header from '../../../duo/[id]/Header';
import InterviewTable from '../../../duo/[id]/InterviewTable';
import InterviewTableRight from '../../../duo/[id]/InterviewTableRight';
import ServiceSection from '../../../duo/[id]/ServiceSection';
import SkippedQueueBar from '../../../duo/[id]/SkippedQueueBar';
import { Setting, VisitInfo } from '../../../duo/[id]/types';
import LoadingSpinner from '../../../../components/LoadingSpinner';

export default function PreviewDuoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [setting, setSetting] = useState<Setting | null>(null);
  const [visitDataLeft, setVisitDataLeft] = useState<VisitInfo[]>([]);
  const [activeDataLeft, setActiveDataLeft] = useState<VisitInfo[]>([]);
  const [visitDataRight, setVisitDataRight] = useState<VisitInfo[]>([]);
  const [activeDataRight, setActiveDataRight] = useState<VisitInfo[]>([]);
  const [skippedData, setSkippedData] = useState<VisitInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSplitAd, setShowSplitAd] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchSetting = async () => {
      try {
        const response = await fetch(`/api/setting/${id}`);
        const result = await response.json();
        if (result.success) {
          setSetting(result.data);
        } else {
          setError('Failed to fetch settings.');
          console.error('Failed to fetch settings:', result.error);
        }
      } catch (e) {
        setError('An error occurred while fetching settings.');
        console.error('An error occurred while fetching settings:', e);
      }
    };

    fetchSetting();
    const interval = setInterval(() => fetchSetting(), 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [id]);

  // Fetch initial data (static preview - no WebSocket)
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [duoResponse, skippedResponse] = await Promise.all([
          fetch(`/api/duo/realtime?id=${id}`),
          fetch(`/api/data/skipped?id=${id}`),
        ]);

        const duoData = await duoResponse.json();
        const skippedData = await skippedResponse.json();

        if (duoData.success && duoData.data) {
          setVisitDataLeft(duoData.data.waitLeft || []);
          setVisitDataRight(duoData.data.waitRight || []);
          setActiveDataLeft(duoData.data.activeLeft || []);
          setActiveDataRight(duoData.data.activeRight || []);
        }
        if (skippedData.success && skippedData.data) {
          setSkippedData(skippedData.data || []);
        }
      } catch (e) {
        console.error('Error fetching data:', e);
      }
    };

    fetchData();
    
    // Refresh data every 5 seconds for preview
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  // โฆษณาแบบหน้าแยก: หน่วงเวลาแล้วแสดง 20 วิ
  useEffect(() => {
    if (!setting) return;
    if (setting.ads && setting.ads_type === 'split') {
      const delaySec = setting.time_wait ? parseInt(String(setting.time_wait)) : 20;
      const delayMs = isNaN(delaySec) ? 20000 : delaySec * 1000;
      const showDurationMs = 20 * 1000; // ค้างไว้ 20 วิ

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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#dc2626' }}>
          เกิดข้อผิดพลาด: {error}
        </div>
      </div>
    );
  }

  if (!setting) {
    return <LoadingSpinner text="กำลังโหลดข้อมูล..." />;
  }

  const tableNamesLeft = setting.station_l ? setting.station_l.split(',') : [];
  const tableNamesRight = setting.station_r ? setting.station_r.split(',') : [];
  const fontFamily = setting.font === 'sarabun' ? "'Sarabun', sans-serif" : "'LINESeed', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  return (
    <div className={styles.container} style={{ fontFamily }}>
      <Header setting={setting} />
      <main className={styles.mainContent}>
        <div className={styles.column}>
          <InterviewTable setting={setting} visitData={visitDataLeft} />
          <ServiceSection setting={setting} sortedActiveData={activeDataLeft} tableNames={tableNamesLeft} />
        </div>
        <div className={styles.column}>
          <InterviewTableRight setting={setting} visitData={visitDataRight} />
          <ServiceSection setting={setting} sortedActiveData={activeDataRight} tableNames={tableNamesRight} isRight={true} />
        </div>
      </main>
      
      {/* Overlay โฆษณาแบบหน้าแยก (split) */}
      {(() => {
        const enableAds = setting.enable_ads ?? (setting.ads && setting.ads !== '' && setting.ads !== 'false');
        if (!enableAds || setting.ads_type !== 'split' || !showSplitAd) return null;
        
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

