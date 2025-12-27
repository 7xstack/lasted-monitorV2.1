import styles from './page.module.css';
import { Setting, VisitInfo } from './types';
import { formatPatientNameRoom, splitQueueNumber } from './utils';

interface ServiceCardProps {
  setting: Setting;
  stationName: string;
  activePatient: VisitInfo | undefined;
  color?: string;
  count: number;
  hideNumber?: boolean;
}

export default function ServiceCard({ setting, stationName, activePatient, color, count, hideNumber }: ServiceCardProps) {

  return (
    <div className={styles.serviceCard}
    style={{
      backgroundColor: color
        ? (typeof color === 'string' ? color : String(color))
        : undefined
    }}
    >
      <span className={styles.serviceText}>
        {stationName}
      </span>
      <div className={styles.serviceInfo}>
        {activePatient && setting.stem_surname !== 'name' && (
          <div className={styles.patientInfo}>
            <span 
              className={styles.patientName}
              style={{ 
                color: setting.urgent_color === 'true' && activePatient.urgent_color
                  ? activePatient.urgent_color
                  : undefined
              }}
            >
              {formatPatientNameRoom(setting, activePatient)}
            </span>
          </div>
        )}
      </div>
      <div 
        className={styles.actionBox}
        style={
          activePatient?.Color
            ? { backgroundColor: typeof activePatient.Color === 'string' ? activePatient.Color : String(activePatient.Color) }
            : color
            ? { backgroundColor: typeof color === 'string' ? color : String(color) }
            : setting.color_static
            ? setting.color_static.includes('gradient') || setting.color_static.includes('linear-gradient') || setting.color_static.includes('radial-gradient')
              ? { background: setting.color_static }
              : { backgroundColor: setting.color_static }
            : {}
        }
      >
        {!hideNumber && (
          activePatient ? (
            <div 
              className={styles.queueNumberSplit}
            >
              <span className={styles.queueNumber}>
                {splitQueueNumber(String(activePatient.visit_q_no || '')).number}
              </span>
            </div>
          ) : (
            <span className={styles.serviceText}>{count}</span>
          )
        )}
      </div>
    </div>
  );
}


