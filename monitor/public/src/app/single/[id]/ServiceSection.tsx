import styles from './page.module.css';
import { Setting, VisitInfo } from './types';
import ServiceCard from './ServiceCard';

interface ServiceSectionProps {
  setting: Setting;
  sortedActiveData: VisitInfo[];
  tableNames: string[];
}

export default function ServiceSection({ setting, sortedActiveData, tableNames }: ServiceSectionProps) {
  // Helper function to normalize station name (ลบ "โต๊ะ" prefix และ trim)
  const normalizeStationName = (station: string): string => {
    return String(station || '')
      .trim()
      .replace(/^โต๊ะ\s*/i, '') // ลบ "โต๊ะ" prefix (case insensitive)
      .replace(/\s+/g, ' ') // แทนที่ multiple spaces ด้วย single space
      .trim();
  };

  // Helper function to match station names (เปรียบเทียบแบบ normalize)
  const matchStation = (station1: string, station2: string): boolean => {
    const normalized1 = normalizeStationName(station1);
    const normalized2 = normalizeStationName(station2);
    return normalized1 === normalized2;
  };

  // Find active patient for a station
  const findActivePatient = (stationName: string) => {
    return sortedActiveData.find(visit => 
      matchStation(String(visit.station || ''), stationName)
    );
  };

  // Render service cards based on settings
  const renderServiceCards = () => {
    // ใช้ tableNames ถ้ามี ถ้าไม่มีใช้ default stations
    let stationsToShow: string[] = [];
    if (tableNames.length > 0) {
      stationsToShow = tableNames.map(name => name.trim());
    } else {
      // Fallback to default tables
      stationsToShow = Array.from({ length: setting.amount_boxL || 3 }, (_, index) => {
        return `${setting.n_table || 'โต๊ะซักประวัติ'} ${index + 1}`;
      });
    }
    
    // แสดงรายชื่อ station ตามลำดับปกติ (ตาม tableNames หรือ amount_boxL)
    // ไม่ว่าจะเปิด table_arr หรือไม่ก็ตาม
    
    // ถ้าไม่เปิดการเรียง ให้แสดงตามลำดับปกติ (ตาม tableNames หรือ amount_boxL)
    return stationsToShow.map((stationName, index) => (
      <ServiceCard
        key={index}
        setting={setting}
        stationName={stationName}
        activePatient={findActivePatient(stationName)}
      />
    ));
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

