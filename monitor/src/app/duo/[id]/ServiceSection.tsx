import styles from './page.module.css';
import { Setting, VisitInfo } from './types';
import ServiceCard from '../../single/[id]/ServiceCard';

interface ServiceSectionProps {
  setting: Setting;
  sortedActiveData: VisitInfo[];
  tableNames: string[];
  isRight?: boolean;
  hideNumber?: boolean;
}

export default function ServiceSection({ setting, sortedActiveData, tableNames, isRight = false, hideNumber }: ServiceSectionProps) {
  // Find active patient for a station
  const findActivePatient = (stationName: string) => {
    return sortedActiveData.find(visit => 
      visit.station === stationName.trim() || 
      visit.station === `โต๊ะ${stationName.trim()}` ||
      visit.station === `${stationName.trim()}`
    );
  };

  // Render service cards based on settings
  const renderServiceCards = () => {
    // ทั้งสองฝั่งใช้ table_arr (arr_l) เหมือน Single
    const shouldSort = setting.table_arr === 'true';
    
    if (shouldSort) {
      // เรียง station ตาม time_call ล่าสุด แต่ยังแสดงทุก station (เหมือน Single)
      // สร้าง map ของ time_call ล่าสุดในแต่ละ station
      const stationCheckInMap = new Map<string, number>();
      
      sortedActiveData.forEach((patient) => {
        const station = String(patient.station || '').trim();
        if (!station) return;
        
        // ใช้ time_call สำหรับเรียงลำดับ
        const timeCall = typeof patient.time_call === 'string' ? patient.time_call : null;
        const timeCallTime = timeCall ? new Date(timeCall).getTime() : 0;
        
        const existing = stationCheckInMap.get(station);
        if (!existing || timeCallTime > existing) {
          stationCheckInMap.set(station, timeCallTime);
        }
      });
      
      // ใช้ tableNames ถ้ามี ถ้าไม่มีใช้ default stations
      let stationsToShow: string[] = [];
      if (tableNames.length > 0) {
        stationsToShow = tableNames.map(name => name.trim());
      } else {
        // Fallback to default stations
        const amount = isRight ? setting.amount_boxR : setting.amount_boxL;
        const defaultName = isRight ? (setting.n_room || 'ห้องตรวจ') : (setting.n_table || 'โต๊ะซักประวัติ');
        stationsToShow = Array.from({ length: amount || 3 }, (_, index) => {
          return `${defaultName} ${index + 1}`;
        });
      }
      
      // เรียง station ตาม time_call ล่าสุด DESC (ใหม่สุดก่อน)
      // Station ที่ไม่มีข้อมูลจะอยู่ท้ายสุด (timeCallTime = 0)
      const sortedStations = stationsToShow.sort((a, b) => {
        const timeA = stationCheckInMap.get(a) || 0;
        const timeB = stationCheckInMap.get(b) || 0;
        return timeB - timeA; // DESC: ใหม่สุดก่อน
      });
      
      return sortedStations.map((stationName, index) => (
        <ServiceCard
          key={index}
          setting={setting}
          stationName={stationName}
          activePatient={findActivePatient(stationName)}
          hideNumber={hideNumber}
        />
      ));
    }
    
    if (tableNames.length > 0) {
      // ถ้าไม่เปิดการเรียง ให้ใช้วิธีเดิม (map จาก tableNames)
      return tableNames.map((tableName, index) => (
        <ServiceCard
          key={index}
          setting={setting}
          stationName={tableName.trim()}
          activePatient={findActivePatient(tableName)}
          hideNumber={hideNumber}
        />
      ));
    }
    
    // Fallback to default tables if station_l is empty
    const amount = isRight ? setting.amount_boxR : setting.amount_boxL;
    const defaultName = isRight ? (setting.n_room || 'ห้องตรวจ') : (setting.n_table || 'โต๊ะซักประวัติ');

    return Array.from({ length: amount || 3 }, (_, index) => {
      const stationName = `${defaultName} ${index + 1}`;
      return (
        <ServiceCard
          key={index}
          setting={setting}
          stationName={stationName}
          activePatient={findActivePatient(stationName)}
          hideNumber={hideNumber}
        />
      );
    });
  };

  // ใช้ color_dynamic สำหรับพื้นหลัง serviceSection
  const backgroundColorStyle = setting.color_dynamic
    ? (setting.color_dynamic.includes('gradient') || setting.color_dynamic.includes('linear-gradient') || setting.color_dynamic.includes('radial-gradient')
        ? { background: setting.color_dynamic }
        : { backgroundColor: setting.color_dynamic })
    : {};

  return (
    <section className={styles.serviceSection} style={backgroundColorStyle}>
      <h2 className={styles.serviceTitle}>
        กำลังรับบริการ
      </h2>
      
      <div className={styles.serviceCards}>
        {renderServiceCards()}
      </div>
    </section>
  );
}






