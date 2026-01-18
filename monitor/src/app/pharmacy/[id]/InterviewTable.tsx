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
  
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
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

  // Auto scroll เมื่อคิวเกิน 6 คิว (เฉพาะ pharmacy type และไม่ใช่ lock_position mode)
  useEffect(() => {
    // ตรวจสอบเงื่อนไขก่อน
    if (setting.type !== 'pharmacy' && setting.type !== 'Pharmacy') {
      return;
    }
    
    // ไม่ทำงานใน lock_position mode
    if (setting.lock_position === "true" && setting.station_l) {
      return;
    }

    const queueCount = sortedVisitData.length;
    console.log('[AutoScroll] Pharmacy InterviewTable - queueCount:', queueCount, 'setting.type:', setting.type);

    // รอให้ table body render ก่อน
    const timer = setTimeout(() => {
      if (!tableBodyRef.current) {
        console.log('[AutoScroll] Pharmacy InterviewTable - Table body not found');
        return;
      }

      // หา table container (interviewTableContainer)
      const tableContainer = tableBodyRef.current.closest(`.${styles.interviewTableContainer}`);
      if (!tableContainer) {
        console.log('[AutoScroll] Pharmacy InterviewTable - Table container not found');
        return;
      }

      // ถ้าคิวเกิน 6 คิว ให้เริ่ม auto scroll
      if (queueCount > 6) {
        let scrollPosition = 0;
        const scrollSpeed = 0.4; // pixels per frame (ช้าลง)
        const scrollDelay = 50; // milliseconds (ช้าลง)
        let isPaused = false; // flag สำหรับหยุดชั่วคราว

        const scroll = () => {
          if (!tableContainer || isPaused) return;
          
          const maxScroll = tableContainer.scrollHeight - tableContainer.clientHeight;
          
          // ถ้าไม่มี content ที่ scroll ได้ ให้ไม่ทำอะไร
          if (maxScroll <= 0) return;
          
          // ถ้า scroll ถึงล่างสุด ให้หยุดและหน่วงเวลา 5 วินาที
          if (scrollPosition >= maxScroll) {
            isPaused = true;
            scrollPosition = 0;
            tableContainer.scrollTop = 0;
            
            // หน่วงเวลา 5 วินาที แล้วเริ่ม scroll ใหม่
            setTimeout(() => {
              isPaused = false;
            }, 5000); // 5 วินาที
          } else {
            scrollPosition += scrollSpeed;
            tableContainer.scrollTop = scrollPosition;
          }
        };

        console.log('[AutoScroll] Pharmacy InterviewTable - Starting auto scroll for', queueCount, 'rows');
        // เริ่ม auto scroll
        scrollIntervalRef.current = setInterval(scroll, scrollDelay);
      } else {
        // ถ้าคิวไม่เกิน 6 คิว ให้หยุด scroll และ reset position
        if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current);
          scrollIntervalRef.current = null;
        }
        const tableContainer = tableBodyRef.current.closest(`.${styles.interviewTableContainer}`);
        if (tableContainer) {
          tableContainer.scrollTop = 0;
        }
      }
    }, 100); // รอ 100ms เพื่อให้ DOM render เสร็จ

    // Cleanup
    return () => {
      clearTimeout(timer);
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
  
  // สำหรับ pharmacy type ใช้ container wrapper
  const tableContent = (
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
        <tbody ref={tableBodyRef}>
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
  );

  return (
    <section className={styles.interviewSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          {setting.n_table || 'จุดซักประวัติ'}
        </h2>
      </div>
      
      {(setting.type === 'pharmacy' || setting.type === 'Pharmacy') ? (
        <div className={styles.interviewTableContainer}>
          {tableContent}
        </div>
      ) : (
        tableContent
      )}
    </section>
  );
}

