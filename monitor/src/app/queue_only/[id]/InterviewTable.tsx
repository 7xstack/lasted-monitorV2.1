import { Hash, User } from 'lucide-react';
import { useEffect, useRef } from 'react';
import styles from './page.module.css';
import { Setting, VisitInfo } from './types';
import { formatPatientName, splitQueueNumber } from './utils';

interface InterviewTableProps {
  setting: Setting;
  visitData: VisitInfo[];
}

export default function InterviewTable({ setting, visitData }: InterviewTableProps) {
  console.log(visitData);
  const queueListContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Normal Mode: เรียงลำดับ visitData ถ้าเปิด arr_r (table_arr2)
  const sortedVisitData = setting.table_arr2 === 'true' 
    ? [...visitData].sort((a, b) => {
        // ระดับที่ 1: เรียงตาม priority_rate DESC (สูงสุดก่อน)
        const priorityA = a.priority_rate ?? 0;
        const priorityB = b.priority_rate ?? 0;
        
        if (priorityA !== priorityB) {
          return priorityB - priorityA; // DESC: สูงสุดก่อน
        }
        
        // ระดับที่ 2: ถ้า priority_rate เท่ากัน ให้เรียงตาม check_in DESC (ใหม่สุดก่อน)
        // ใช้ check_in เป็นหลัก ถ้าไม่มีใช้ time_call
        let checkInTimeA = 0;
        let checkInTimeB = 0;
        
        // ลองใช้ check_in ก่อน
        if (a.check_in) {
          const checkInA = typeof a.check_in === 'string' ? a.check_in : null;
          if (checkInA) {
            const parsedDateA = new Date(checkInA);
            if (!isNaN(parsedDateA.getTime())) {
              checkInTimeA = parsedDateA.getTime();
            }
          }
        }
        
        if (b.check_in) {
          const checkInB = typeof b.check_in === 'string' ? b.check_in : null;
          if (checkInB) {
            const parsedDateB = new Date(checkInB);
            if (!isNaN(parsedDateB.getTime())) {
              checkInTimeB = parsedDateB.getTime();
            }
          }
        }
        
        // ถ้าไม่มี check_in ให้ใช้ time_call
        if (checkInTimeA === 0 && a.time_call) {
          const timeCallA = typeof a.time_call === 'string' ? a.time_call : null;
          if (timeCallA) {
            const parsedDateA = new Date(timeCallA);
            if (!isNaN(parsedDateA.getTime())) {
              checkInTimeA = parsedDateA.getTime();
            }
          }
        }
        
        if (checkInTimeB === 0 && b.time_call) {
          const timeCallB = typeof b.time_call === 'string' ? b.time_call : null;
          if (timeCallB) {
            const parsedDateB = new Date(timeCallB);
            if (!isNaN(parsedDateB.getTime())) {
              checkInTimeB = parsedDateB.getTime();
            }
          }
        }
        
        return checkInTimeB - checkInTimeA; // DESC: ใหม่สุดก่อน
      })
    : visitData;
  
  // Auto scroll เมื่อคิวเกิน 24 คิว (เฉพาะ queue และ queue_only type)
  useEffect(() => {
    // ไม่ทำงานใน lock_position mode
    if (setting.lock_position === "true" && setting.station_l) {
      return;
    }
    
    if ((setting.type !== 'queue' && setting.type !== 'queue_only') || !queueListContainerRef.current) return;

    const container = queueListContainerRef.current;
    const queueCount = sortedVisitData.length;

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
  }, [sortedVisitData.length, setting.type, setting.lock_position, setting.station_l]);
  
  // Lock Position Mode: แสดงผลแบบ Card แนวตั้ง
  if (setting.lock_position === "true" && setting.station_l) {
    // แยกสถานีจาก station_l
    const stationList = setting.station_l.split(",").map((s) => s.trim());
    
    return (
      <section className={styles.interviewSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {setting.n_table || 'จุดซักประวัติ'}
          </h2>
        </div>
        
        <div className={styles.lockPositionContainer}>
          {stationList.map((stationName, index) => {
            const stationIndex = index + 1; // 1-based index
            
            // กรองคิวตาม station_index
            const matchingQueues = visitData
              .filter((visit) => visit.station_index === stationIndex)
              .sort((a, b) => {
                // เรียงลำดับตาม check_in ASC (เก่าสุดก่อน)
                const checkInA = typeof a.check_in === "string" ? a.check_in : null;
                const checkInB = typeof b.check_in === "string" ? b.check_in : null;
                const timeA = checkInA ? new Date(checkInA).getTime() : 0;
                const timeB = checkInB ? new Date(checkInB).getTime() : 0;
                return timeA - timeB; // ASC: เก่าสุดก่อน
              });
            
            return (
              <div key={index} className={styles.lockPositionItem}>
                {matchingQueues.length > 0 ? (
                  <div className={styles.lockPositionQueuesContainer}>
                    {matchingQueues.map((queue, queueIndex) => (
                      <div
                        key={queue.id || queueIndex}
                        className={styles.lockPositionContent}
                        style={
                            setting.urgent_color === "true" && queue?.Color
                            ? {
                                backgroundColor: typeof queue.Color === "string" ? queue.Color : String(queue.Color),
                              }
                            : setting.color_static
                            ? setting.color_static.includes('gradient') || setting.color_static.includes('linear-gradient') || setting.color_static.includes('radial-gradient')
                              ? { background: setting.color_static }
                              : { backgroundColor: setting.color_static }
                            : { backgroundColor: "#0066AA" }
                        }
                      >
                        <div className={styles.queueNumberSplit}>
                          <span className={styles.queueNumber}>
                            {queue.visit_q_no || ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    );
  }
  
  // ถ้า type เป็น queue หรือ queue_only ให้แสดงเป็น div layout แทนตาราง
  if (setting.type === 'queue' || setting.type === 'queue_only') {
    return (
      <section className={styles.interviewSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {setting.n_table || 'จุดซักประวัติ'}
          </h2>
        </div>
        
        <div className={styles.queueListContainer} ref={queueListContainerRef}>
          {sortedVisitData.length > 0 ? (
            sortedVisitData.map((visit, index) => (
              <div
                key={visit.id || index}
                className={styles.queueItem}
                style={
                  setting.urgent_color === "true" && visit?.Color
                    ? {
                        backgroundColor: typeof visit.Color === "string" ? visit.Color : String(visit.Color),
                      }
                    : setting.color_static
                    ? setting.color_static.includes('gradient') || setting.color_static.includes('linear-gradient') || setting.color_static.includes('radial-gradient')
                      ? { background: setting.color_static }
                      : { backgroundColor: setting.color_static }
                    : { backgroundColor: "#0066AA" }
                }
              >
                <div className={styles.queueNumberSplit}>
                  <span className={styles.queueNumber}>
                    {visit.visit_q_no || ""}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noDataQueue}>
              {setting.n_listtable || 'ไม่มีข้อมูล'}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.interviewSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          {setting.n_table || 'จุดซักประวัติ'}
        </h2>
      </div>
      
      <table className={styles.interviewTable}>
        <thead>
          <tr>
            <th className={styles.tableHeader}>
              <div className={styles.headerItem}>
                <Hash className={styles.headerIcon} size={20} />
                <span>หมายเลข</span>
              </div>
            </th>
            {setting.stem_surname_table !== 'name' && (
              <th className={styles.tableHeader}>
                <div className={styles.headerItem}>
                  <User className={styles.headerIcon} size={20} />
                  <span>ชื่อ-นามสกุล</span>
                </div>
              </th>
            )}
            {setting.time_col === 'true' && (
              <th className={styles.tableHeader}>
                <div className={styles.headerItem}>
                  <span>เวลารอ</span>
                </div>
              </th>
            )}
            {setting.urgent_level === 'true' && (
              <th className={styles.tableHeader}>
                <div className={styles.headerItem}>
                  <span>ระดับความเร่งด่วน</span>
                </div>
              </th>
            )}
            {setting.status_patient === 'true' && (
              <th className={styles.tableHeader}>
                <div className={styles.headerItem}>
                  <span>สถานะ</span>
                </div>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedVisitData.length > 0 ? (
            sortedVisitData.map((visit, index) => (
              <tr key={visit.id || index} className={styles.tableRow}>
                <td className={styles.tableCell}>
                  <div className={styles.queueNumberContainer}>
                    {setting.urgent_color === 'true' && visit.Color && (
                      <div 
                        className={styles.urgentColorBlock}
                        style={{ backgroundColor: typeof visit.Color === 'string' ? visit.Color : undefined }}
                      />
                    )}
                    <span 
                      className={styles.queueNumberLeft}
                      style={{ 
                        color: setting.urgent_color === 'true' && typeof visit.Color === 'string'
                          ? visit.Color
                          : '#0c266d' 
                      }}
                    >
                      {visit.visit_q_no || ""}
                    </span>
                  </div>
                </td>
                {setting.stem_surname_table !== 'name' && (
                  <td className={styles.tableCell}>
                    <span 
                      className={styles.patientName}
                      style={{ 
                        color: setting.urgent_color === 'true' && typeof visit.Color === 'string'
                          ? visit.Color
                          : '#0c266d' 
                      }}
                    >
                      {formatPatientName(setting, visit)}
                    </span>
                  </td>
                )}
                {setting.time_col === 'true' && (
                  <td className={styles.tableCell}>
                    <span 
                      className={styles.patientName}
                      style={{ 
                        color: setting.urgent_color === 'true' && typeof visit.Color === 'string'
                          ? visit.Color
                          : '#0c266d' 
                      }}
                    >
                      {visit.waiting_time === null || visit.waiting_time === undefined || visit.waiting_time === 'None' || String(visit.waiting_time).toLowerCase() === 'null'
                        ? '-'
                        : String(visit.waiting_time)}
                    </span>
                  </td>
                )}
                {setting.urgent_level === 'true' && (
                  <td className={styles.tableCell}>
                    <div className={styles.urgentLevel}>
                      <div 
                        className={styles.urgentCircle}
                        style={{ 
                          backgroundColor: typeof visit.Color === 'string' ? visit.Color : '#0066AA'
                        }}
                      />
                    </div>
                  </td>
                )}
                {setting.status_patient === 'true' && (
                  <td className={styles.tableCell}>
                    <span 
                      className={styles.patientName}
                      style={{ 
                        color: setting.urgent_color === 'true' && typeof visit.Color === 'string'
                          ? visit.Color
                          : '#0c266d' 
                      }}
                    >
                      {visit.status_patient || '-'}
                    </span>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={
                1 + // หมายเลข
                (setting.stem_surname_table !== 'name' ? 1 : 0) + // ชื่อ-นามสกุล
                (setting.time_col === 'true' ? 1 : 0) + // เวลารอ
                (setting.urgent_level === 'true' ? 1 : 0) + // ระดับความเร่งด่วน
                (setting.status_patient === 'true' ? 1 : 0) // สถานะ
              } className={styles.noData}>
                {setting.n_listtable || 'ไม่มีข้อมูล'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

