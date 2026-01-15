import styles from './page.module.css';
import { Setting, VisitInfo } from './types';
import { formatPatientName } from './utils';

interface InterviewTableProps {
  setting: Setting;
  visitData: VisitInfo[];
}

// Helper function to render queue cards (แสดงแค่เลขคิวและชื่อนามสกุล)
const renderQueueCards = (
  setting: Setting,
  filteredData: VisitInfo[],
  title: string,
  key: string
) => {
  return (
    <div key={key} className={styles.queueTypeSection}>
      <div className={styles.queueTypeHeader}>
        <h3 className={styles.queueTypeTitle}>{title}</h3>
      </div>
      {filteredData.length > 0 && (
        <div className={styles.queueCardsContainer}>
          {filteredData.map((visit, index) => {
            const queueColor = visit.Color 
              ? (typeof visit.Color === 'string' ? visit.Color : String(visit.Color))
              : '#0066AA';
            
            return (
              <div key={visit.id || index} className={styles.queueCard}>
                <div 
                  className={styles.queueBadge}
                  style={{ backgroundColor: queueColor }}
                >
                  <span className={styles.queueBadgeNumber}>
                    {visit.visit_q_no || ' - '}
                  </span>
                </div>
                {setting.stem_surname_table !== 'name' && (
                  <span className={styles.queueCardName}>
                    {formatPatientName(setting, visit)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

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
                          <span className={styles.queueLetter}>
                            {queue.visit_q_no}
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
  
  // 3 Types Mode: แสดง 3 ประเภทคิวแยกกัน
  // ดึง urgent levels จาก list_urgent หรือใช้ค่า default
  const listUrgent = setting.list_urgent 
    ? setting.list_urgent.split(',').map(s => s.trim()).filter(s => s)
    : [];
  
  // ใช้ 3 ตัวแรกจาก list_urgent หรือใช้ค่า default
  const threeTypes = listUrgent.length >= 3 
    ? listUrgent.slice(0, 3)
    : listUrgent.length === 2
    ? [...listUrgent, '']
    : listUrgent.length === 1
    ? [...listUrgent, '', '']
    : ['R', 'E', 'U']; // Default values
  
  // กรองข้อมูลตาม urgent_level สำหรับแต่ละประเภท
  const type1Data = visitData.filter(visit => visit.urgent_level === threeTypes[0]);
  const type2Data = visitData.filter(visit => visit.urgent_level === threeTypes[1]);
  const type3Data = visitData.filter(visit => visit.urgent_level === threeTypes[2]);
  
  // สร้างชื่อสำหรับแต่ละประเภทตามรูปที่ 2
  const type1Title = 'ผู้รับบริการทั่วไป';
  const type2Title = 'ผู้รับบริการสูงอายุ 70 ปี';
  const type3Title = 'ผู้รับบริการกลุ่มนัด';
  
  // สร้างชื่อ header จาก setting (ใช้ department หรือ n_table)
  const screenName = setting.department || setting.n_table || 'รอรับบริการ';
  const screenTitle = `คิวเข้ารับบริการ${screenName}`;
  
  return (
    <section className={styles.interviewSection}>
      <div className={styles.mainContainerHeader}>
        <h2 className={styles.mainContainerTitle}>{screenTitle}</h2>
      </div>
      <div className={styles.threeTypesContainer}>
        {renderQueueCards(setting, type1Data, type1Title, 'type1')}
        {renderQueueCards(setting, type3Data, type3Title, 'type3')}
        {renderQueueCards(setting, type2Data, type2Title, 'type2')}
      </div>
    </section>
  );
}

