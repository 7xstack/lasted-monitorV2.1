import styles from './page.module.css';
import { Setting, VisitInfo } from './types';
import { formatPatientNamePopup } from './utils';

interface CallPopupProps {
  setting: Setting;
  callData: VisitInfo;
}

export default function CallPopup({ setting, callData }: CallPopupProps) {
  return (
    <div className={`${styles.callPopup} ${callData.side === 'left' ? styles.popupLeft : callData.side === 'right' ? styles.popupRight : ''}`}>
      <div className={styles.callPopupContent}>
        <div className={styles.callInfo}>
          <div className={styles.callDataLeft}>
            <div className={styles.callTableName}>
              {callData.station || 'โต๊ะซักประวัติ'}
            </div>
            {setting.stem_surname_popup !== 'name' && (
              <div className={styles.callPatientName}>
                {formatPatientNamePopup(setting, callData)}
              </div>
            )}
          </div>
          <div 
            className={styles.callQueueBox}
            style={
              setting.color_static
                ? setting.color_static.includes('gradient') || setting.color_static.includes('linear-gradient') || setting.color_static.includes('radial-gradient')
                  ? { background: setting.color_static }
                  : { backgroundColor: setting.color_static }
                : {}
            }
          >
            <div className={styles.callQueueNumber}>
              {callData.visit_q_no}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






