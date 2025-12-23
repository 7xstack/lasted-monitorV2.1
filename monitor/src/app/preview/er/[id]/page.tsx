'use client';

import { useEffect, useState, use, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import styles from '../../../er/[id]/page.module.css';
import { Setting, VisitInfo, UrgentLevel } from '../../../er/[id]/types';
import LoadingSpinner from '../../../../components/LoadingSpinner';

const Header = dynamic(() => import('../../../er/[id]/Header'), { ssr: false });
const InterviewTable = dynamic(() => import('../../../er/[id]/InterviewTable'), { ssr: false });
const ServiceSection = dynamic(() => import('../../../er/[id]/ServiceSection'), { ssr: false });
const SkippedQueueBar = dynamic(() => import('../../../er/[id]/SkippedQueueBar'), { ssr: false });

export default function PreviewErPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [setting, setSetting] = useState<Setting | null>(null);
  const [visitData, setVisitData] = useState<VisitInfo[]>([]);
  const [countData, setCountData] = useState<{ [key: string]: number }>({});
  const [activeData, setActiveData] = useState<VisitInfo[]>([]);
  const [skippedData, setSkippedData] = useState<VisitInfo[]>([]);
  const [urgentLevels, setUrgentLevels] = useState<UrgentLevel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adsLeftUrl, setAdsLeftUrl] = useState<string | null>(null);
  const [adsRightUrl, setAdsRightUrl] = useState<string | null>(null);
  const [adsFullUrl, setAdsFullUrl] = useState<string | null>(null);
  const [showSplitAd, setShowSplitAd] = useState(false);

  const settingStable = useMemo(() => setting, [setting]);

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

    fetchSetting();
    fetchUrgentLevels();
    const settingInterval = setInterval(() => fetchSetting(), 3 * 60 * 1000);
    return () => clearInterval(settingInterval);
  }, [id]);

  // โหลดโฆษณา
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

    if (adsType === 'left') {
      let leftPath = setting.ads_path_left;
      if (!leftPath && setting.ads) {
        leftPath = String(setting.ads);
      }
      setAdsLeftUrl(leftPath || null);
      setAdsRightUrl(null);
      setAdsFullUrl(null);
      return;
    }

    if (adsType === 'right') {
      let rightPath = setting.ads_path_right;
      if (!rightPath && setting.ads) {
        rightPath = String(setting.ads);
      }
      setAdsRightUrl(rightPath || null);
      setAdsLeftUrl(null);
      setAdsFullUrl(null);
      return;
    }

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

  // Fetch initial data (static preview - no WebSocket)
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [erResponse, skippedResponse, countResponse] = await Promise.all([
          fetch(`/api/er/realtime?id=${id}`),
          fetch(`/api/data/skipped?id=${id}`),
          fetch(`/api/er/active-count?id=${id}`),
        ]);

        const erData = await erResponse.json();
        const skippedData = await skippedResponse.json();
        const countData = await countResponse.json();

        if (erData.success && erData.data) {
          setVisitData(erData.data.wait || []);
          setActiveData(erData.data.active || []);
        }
        if (skippedData.success && skippedData.data) {
          setSkippedData(skippedData.data || []);
        }
        if (countData.success && countData.data) {
          setCountData(countData.data || {});
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

  const fontFamily = setting.font === 'sarabun' ? "'Sarabun', sans-serif" : "'LINESeed', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  return (
    <div className={styles.container} style={{ fontFamily }}>
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

