import styles from './page.module.css';
import { Setting, VisitInfo } from './types';
import { formatPatientName } from './utils';

interface SkippedQueueBarProps {
  skippedData: VisitInfo[];
  setting: Setting;
}

export default function SkippedQueueBar({ skippedData, setting }: SkippedQueueBarProps) {
  // ใช้ color_static สำหรับพื้นหลัง skippedBar
  const backgroundColorStyle = setting.color_static
    ? (setting.color_static.includes('gradient') || setting.color_static.includes('linear-gradient') || setting.color_static.includes('radial-gradient')
        ? { background: setting.color_static }
        : { backgroundColor: setting.color_static })
    : {};

  return (
    <div className={styles.skippedBar} style={backgroundColorStyle}>
      <div className={styles.skippedBarContent}>
        <div className={styles.skippedHeader}>
          <span>รายชื่อที่ข้ามคิว</span>
        </div>
        <div className={styles.skippedQueueContainer}>
          <div className={styles.skippedQueueList}>
            {skippedData.length > 0 ? (
              skippedData.map((item, index) => (
                <div key={item.id || index} className={styles.skippedQueueItem}>
                  <span className={styles.skippedQueueNumber}>
                    {item.visit_q_no}
                  </span>
                  <span className={styles.skippedQueueName}>
                    {setting.stem_surname_table !== 'name' 
                      ? formatPatientName(setting, item)
                      : item.name}
                  </span>
                </div>
              ))
            ) : (
              <div className={styles.skippedQueueItem}>
                <span style={{ color: '#fff', fontStyle: 'italic' }}>
                  ไม่มีรายชื่อที่ข้าม
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

