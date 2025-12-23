"use client";

import { useState, use, useEffect } from "react";
import styles from "../../../single/[id]/page.module.css";
import { Setting, VisitInfo } from "../../../single/[id]/types";
import Header from "../../../single/[id]/Header";
import InterviewTable from "../../../single/[id]/InterviewTable";
import ServiceSection from "../../../single/[id]/ServiceSection";
import SkippedQueueBar from "../../../single/[id]/SkippedQueueBar";
import LoadingSpinner from "../../../../components/LoadingSpinner";

export default function PreviewSinglePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [setting, setSetting] = useState<Setting | null>(null);
  const [visitData, setVisitData] = useState<VisitInfo[]>([]);
  const [activeData, setActiveData] = useState<VisitInfo[]>([]);
  const [skippedData, setSkippedData] = useState<VisitInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSplitAd, setShowSplitAd] = useState(false);

  // Fetch setting
  useEffect(() => {
    if (!id) return;

    const fetchSetting = async () => {
      try {
        const response = await fetch(`/api/setting/${id}`);
        const result = await response.json();
        if (result.success) {
          setSetting(result.data);
        } else {
          setError("Failed to fetch settings.");
          console.error("Failed to fetch settings:", result.error);
        }
      } catch (e) {
        setError("An error occurred while fetching settings.");
        console.error("An error occurred while fetching settings:", e);
      }
    };

    fetchSetting();
  }, [id]);

  // Fetch initial data (static preview - no WebSocket)
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [waitResponse, activeResponse, skippedResponse] = await Promise.all([
          fetch(`/api/data/all?id=${id}`),
          fetch(`/api/single/active?id=${id}`),
          fetch(`/api/data/skipped?id=${id}`),
        ]);

        const waitData = await waitResponse.json();
        const activeData = await activeResponse.json();
        const skippedData = await skippedResponse.json();

        if (waitData.success && waitData.data) {
          setVisitData(waitData.data.wait || []);
        }
        if (activeData.success && activeData.data) {
          setActiveData(activeData.data || []);
        }
        if (skippedData.success && skippedData.data) {
          setSkippedData(skippedData.data || []);
        }
      } catch (e) {
        console.error("Error fetching data:", e);
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
    return <LoadingSpinner text="กำลังโหลดข้อมูล..." />;
  }

  const tableNames = setting.station_l ? setting.station_l.split(",") : [];
  const fontFamily =
    setting.font === "sarabun"
      ? "'Sarabun', sans-serif"
      : "'LINESeed', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  return (
    <div className={styles.container} style={{ fontFamily }}>
      <Header setting={setting} />

      <main className={styles.mainContent}>
        {/* แสดงรูปโฆษณาฝั่งซ้าย (ads_type = 'left') */}
        {(() => {
          const enableAds = setting.enable_ads ?? (setting.ads && setting.ads !== '' && setting.ads !== 'false');
          if (!enableAds || setting.ads_type !== "left") return null;
          
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

        <ServiceSection
          setting={setting}
          sortedActiveData={activeData}
          tableNames={tableNames}
        />
        {/* แสดงรูปโฆษณาฝั่งขวา (ads_type = 'right') */}
        {(() => {
          const enableAds = setting.enable_ads ?? (setting.ads && setting.ads !== '' && setting.ads !== 'false');
          if (!enableAds || setting.ads_type !== "right") return null;
          
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

