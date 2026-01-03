import { useEffect, useRef } from 'react';
import styles from './page.module.css';
import { VisitInfo, Setting } from './types';
import { formatPatientNameRoom, splitQueueNumber } from './utils';

interface ServiceCardProps {
  setting: Setting;
  stationName: string;
  activePatients: VisitInfo[];
  hideNumber?: boolean;
}

export default function ServiceCard({
  setting,
  stationName,
  activePatients,
  hideNumber,
}: ServiceCardProps) {
  // กรองเฉพาะ patients ที่มี visit_q_no
  const patientsWithQueue = activePatients.filter(patient => patient.visit_q_no);
  const queueCardsContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll เมื่อคิวเกิน 24 คิว (เฉพาะ pharmacy type)
  useEffect(() => {
    if (setting.type !== 'pharmacy' || !queueCardsContainerRef.current || hideNumber) return;

    const container = queueCardsContainerRef.current;
    const queueCount = patientsWithQueue.length;

    // ถ้าคิวเกิน 24 คิว ให้เริ่ม auto scroll
    if (queueCount > 24) {
      let scrollPosition = 0;
      const scrollSpeed = 0.4; // pixels per frame (ช้าลง)
      const scrollDelay = 50; // milliseconds (ช้าลง)
      let isPaused = false; // flag สำหรับหยุดชั่วคราว

      const scroll = () => {
        if (!container || isPaused) return;
        
        const maxScroll = container.scrollHeight - container.clientHeight;
        
        // ถ้า scroll ถึงล่างสุด ให้หยุดและหน่วงเวลา 5 วินาที
        if (scrollPosition >= maxScroll) {
          isPaused = true;
          scrollPosition = 0;
          container.scrollTop = 0;
          
          // หน่วงเวลา 5 วินาที แล้วเริ่ม scroll ใหม่
          setTimeout(() => {
            isPaused = false;
          }, 5000); // 5 วินาที
        } else {
          scrollPosition += scrollSpeed;
          container.scrollTop = scrollPosition;
        }
      };

      // เริ่ม auto scroll
      scrollIntervalRef.current = setInterval(scroll, scrollDelay);
    } else {
      // ถ้าคิวไม่เกิน 24 คิว ให้หยุด scroll และ reset position
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      if (container) {
        container.scrollTop = 0;
      }
    }

    // Cleanup
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [patientsWithQueue.length, setting.type, hideNumber]);

  return (
    <div className={styles.serviceCard}>
      <div className={styles.serviceInfoContainer}>
        <span className={styles.serviceText}>{stationName}</span>
      </div>
      
      {/* แสดงเลขคิวทั้งหมดถ้ามี */}
      {!hideNumber && patientsWithQueue.length > 0 && (
        <div className={styles.queueCardsContainer} ref={queueCardsContainerRef}>
          {patientsWithQueue.map((patient, index) => (
            <div
              key={patient.id || index}
              className={styles.queueCard}
              style={
                setting.urgent_color === "true" && patient?.urgent_color
                  ? { backgroundColor: patient.urgent_color }
                  : setting.color_static
                  ? setting.color_static.includes('gradient') || setting.color_static.includes('linear-gradient') || setting.color_static.includes('radial-gradient')
                    ? { background: setting.color_static }
                    : { backgroundColor: setting.color_static }
                  : { backgroundColor: "#0066AA" }
              }
            >
              <div className={styles.queueNumberSplit}>
                <span className={styles.queueNumber}>
                  {patient.visit_q_no || ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
