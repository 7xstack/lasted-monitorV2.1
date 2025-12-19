import styles from './page.module.css';
import { VisitInfo, Setting } from './types';
import { formatPatientNameRoom, splitQueueNumber } from './utils';

interface ServiceCardProps {
  setting: Setting;
  stationName: string;
  activePatient: VisitInfo | undefined;
}

export default function ServiceCard({
  setting,
  stationName,
  activePatient,
}: ServiceCardProps) {
  return (
    <div className={styles.serviceCard}>
      <div className={styles.serviceInfoContainer}>
        <span className={styles.serviceText}>{stationName}</span>
        <div className={styles.serviceInfo}>
          {activePatient && setting.stem_surname !== "name" && (
            <div className={styles.patientInfo}>
              <span
                className={styles.patientName}
                style={{
                  color:
                    setting.urgent_color === "true" &&
                    activePatient.urgent_color
                      ? activePatient.urgent_color
                      : undefined,
                }}
              >
                {formatPatientNameRoom(setting, activePatient)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        className={styles.actionBox}
        style={
          setting.urgent_color === "true" && activePatient?.urgent_color
            ? { backgroundColor: activePatient.urgent_color }
            : setting.color_static
            ? setting.color_static.includes('gradient') || setting.color_static.includes('linear-gradient') || setting.color_static.includes('radial-gradient')
              ? { background: setting.color_static }
              : { backgroundColor: setting.color_static }
            : { backgroundColor: "#0066AA" }
        }
      >
        {activePatient ? (
          <div className={styles.queueNumberSplit}>
            <span className={styles.queueLetter}>
              {splitQueueNumber(String(activePatient.visit_q_no || "")).letter}
            </span>
            <span className={styles.queueNumber}>
              {splitQueueNumber(String(activePatient.visit_q_no || "")).number}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
