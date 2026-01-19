import { Hash, User } from 'lucide-react';
import styles from './page.module.css';
import { Setting, VisitInfo } from './types';
import { formatPatientName, splitQueueNumber } from './utils';

interface InterviewTableProps {
  setting: Setting;
  visitData: VisitInfo[];
}

export default function InterviewTable({ setting, visitData }: InterviewTableProps) {
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
                            {queue.visit_q_no || ''} 
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
  
  // Normal Mode: แสดงตารางแบบปกติ
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
          {visitData.length > 0 ? (
            visitData.map((visit, index) => (
              <tr key={visit.id || index} className={styles.tableRow}>
                <td className={styles.tableCell}>
                  <div className={styles.queueNumberContainer}>
                    {setting.urgent_color === 'true' && visit.Color && (
                      <div 
                        className={styles.urgentColorBlock}
                        style={{ backgroundColor: typeof visit.Color === 'string' ? visit.Color : String(visit.Color) }}
                      />
                    )}
                    <span 
                      className={styles.queueNumberLeft}
                      style={{ 
                        color: setting.urgent_color === 'true' && visit.Color
                          ? (typeof visit.Color === 'string' ? visit.Color : String(visit.Color))
                          : '#0c266d' 
                      }}
                    >
                      {/* {splitQueueNumber(String(visit.visit_q_no || '')).number} */}
                      {String(visit.visit_q_no || '')}
                    </span>
                  </div>
                </td>
                {setting.stem_surname_table !== 'name' && (
                  <td className={styles.tableCell}>
                    <span 
                      className={styles.patientName}
                      style={{ 
                        color: setting.urgent_color === 'true' && visit.Color
                          ? (typeof visit.Color === 'string' ? visit.Color : String(visit.Color))
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
                        color: setting.urgent_color === 'true' && visit.Color
                          ? (typeof visit.Color === 'string' ? visit.Color : String(visit.Color))
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
                      {visit.urgent_level ? (
                        <div 
                          className={styles.urgentCircle}
                          style={{ 
                            backgroundColor: visit.Color ? (typeof visit.Color === 'string' ? visit.Color : String(visit.Color)) : '#0066AA'
                          }}
                        />
                      ) : (
                        <div 
                          className={styles.urgentCircle}
                          style={{ 
                            backgroundColor: visit.Color ? (typeof visit.Color === 'string' ? visit.Color : String(visit.Color)) : '#0066AA'
                          }}
                        />
                      )}
                    </div>
                  </td>
                )}
                {setting.status_patient === 'true' && (
                  <td className={styles.tableCell}>
                    <span 
                      className={styles.patientName}
                      style={{ 
                        color: setting.urgent_color === 'true' && visit.status_patient as string
                          ? visit.status_patient as string
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


