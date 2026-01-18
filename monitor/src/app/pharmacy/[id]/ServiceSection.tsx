import styles from './page.module.css';
import { Setting, VisitInfo } from './types';
import ServiceCard from './ServiceCard';

interface ServiceSectionProps {
  setting: Setting;
  sortedActiveData: VisitInfo[];
  tableNames: string[];
  hideNumber?: boolean;
}

export default function ServiceSection({ setting, sortedActiveData, tableNames, hideNumber }: ServiceSectionProps) {
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

  // Find active patients for a station (สามารถมีหลายคิวต่อ station)
  const findActivePatients = (stationName: string) => {
    return sortedActiveData.filter(visit => 
      matchStation(String(visit.station || ''), stationName)
    );
  };

  // Render service cards based on settings
  const renderServiceCards = () => {
    if (setting.table_arr === 'true') {
      // ถ้าเปิดการเรียงห้อง (arr_l) ให้เรียง station ตามเวลาที่ checkin ล่าสุด
      // ใช้ check_in เป็นหลัก ถ้าไม่มีใช้ time_call
      // แต่ยังแสดงทุก station ตาม tableNames หรือ amount_boxL
      
      // สร้าง map ของเวลาที่ checkin ล่าสุดในแต่ละ station (ใช้ normalized name เป็น key)
      const stationCheckInMap = new Map<string, number>();
      
      // เก็บข้อมูลทุก station ที่พบใน sortedActiveData (รวมทั้ง normalized และ original)
      sortedActiveData.forEach((patient) => {
        const station = String(patient.station || '').trim();
        if (!station) return;
        
        // Normalize station name เพื่อใช้เป็น key
        const normalizedStation = normalizeStationName(station);
        
        // ใช้ check_in เป็นหลัก ถ้าไม่มีใช้ time_call สำหรับเรียงลำดับ
        let checkInTime = 0;
        
        // ลองใช้ check_in ก่อน
        if (patient.check_in) {
          const checkIn = Array.isArray(patient.check_in) 
            ? patient.check_in[0] 
            : typeof patient.check_in === 'string' 
            ? patient.check_in 
            : null;
          
          if (checkIn) {
            const parsedDate = new Date(checkIn);
            if (!isNaN(parsedDate.getTime())) {
              checkInTime = parsedDate.getTime();
            }
          }
        }
        
        // ถ้าไม่มี check_in ให้ใช้ time_call
        if (checkInTime === 0 && patient.time_call) {
          const timeCall = Array.isArray(patient.time_call) 
            ? patient.time_call[0] 
            : typeof patient.time_call === 'string' 
            ? patient.time_call 
            : null;
          
          if (timeCall) {
            const parsedDate = new Date(timeCall);
            if (!isNaN(parsedDate.getTime())) {
              checkInTime = parsedDate.getTime();
            }
          }
        }
        
        // Debug: แสดงข้อมูลที่พบ
        console.log(`[ServiceSection] Found patient: station="${station}", normalized="${normalizedStation}", check_in="${patient.check_in}", time_call="${patient.time_call}", checkInTime=${checkInTime}`);
        
        // เก็บทั้ง normalized และ original station name เพื่อให้ match ได้ทุกกรณี
        const existingNormalized = stationCheckInMap.get(normalizedStation);
        if (!existingNormalized || checkInTime > existingNormalized) {
          stationCheckInMap.set(normalizedStation, checkInTime);
        }
        
        // เก็บ original station name ด้วย (กรณีที่ tableNames ใช้ original format)
        const existingOriginal = stationCheckInMap.get(station);
        if (!existingOriginal || checkInTime > existingOriginal) {
          stationCheckInMap.set(station, checkInTime);
        }
      });
      
      // Debug: แสดง tableNames
      console.log(`[ServiceSection] tableNames:`, tableNames);
      console.log(`[ServiceSection] stationCheckInMap:`, Array.from(stationCheckInMap.entries()));
      
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
      
      // เรียง station ตามลำดับตัวเลขในชื่อก่อน แล้วค่อยเรียงตามเวลาที่ checkin ล่าสุด DESC (ใหม่สุดก่อน)
      // Station ที่ไม่มีข้อมูลจะอยู่ท้ายสุด (checkInTime = 0)
      const sortedStations = stationsToShow.sort((a, b) => {
        const normalizedA = normalizeStationName(a);
        const normalizedB = normalizeStationName(b);
        
        // ดึงตัวเลขจากชื่อ station (เช่น "เตียง 2" -> 2, "เตียง 1" -> 1)
        const extractNumber = (name: string): number => {
          const match = name.match(/(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        };
        
        const numA = extractNumber(a);
        const numB = extractNumber(b);
        
        // ถ้ามีตัวเลขในชื่อ ให้เรียงตามตัวเลขก่อน (1, 2, 3...)
        if (numA > 0 && numB > 0) {
          if (numA !== numB) {
            return numA - numB; // เรียงตามตัวเลข (น้อยไปมาก)
          }
        }
        
        // ถ้าตัวเลขเท่ากัน หรือไม่มีตัวเลข ให้เรียงตามเวลาที่ checkin ล่าสุด DESC (ใหม่สุดก่อน)
        const checkInTimeA = stationCheckInMap.get(a) || stationCheckInMap.get(normalizedA) || 0;
        const checkInTimeB = stationCheckInMap.get(b) || stationCheckInMap.get(normalizedB) || 0;
        
        // Debug log (สามารถลบออกได้หลังจากแก้ไขเสร็จ)
        if (checkInTimeA > 0 || checkInTimeB > 0) {
          console.log(`[ServiceSection] Sorting: "${a}" (normalized: "${normalizedA}", num: ${numA}) = ${checkInTimeA}, "${b}" (normalized: "${normalizedB}", num: ${numB}) = ${checkInTimeB}`);
        }
        
        return checkInTimeB - checkInTimeA; // DESC: ใหม่สุดก่อน
      });
      
      return sortedStations.map((stationName, index) => {
        const activePatients = findActivePatients(stationName);
        return (
        <ServiceCard
          key={index}
          setting={setting}
          stationName={stationName}
            activePatients={activePatients}
          hideNumber={hideNumber}
        />
        );
      });
    }
    
    if (tableNames.length > 0) {
      // ถ้าไม่เปิดการเรียง ให้ใช้วิธีเดิม (map จาก tableNames)
      return tableNames.map((tableName, index) => {
        const activePatients = findActivePatients(tableName);
        return (
        <ServiceCard
          key={index}
          setting={setting}
          stationName={tableName.trim()}
            activePatients={activePatients}
          hideNumber={hideNumber}
        />
        );
      });
    }
    
    // Fallback to default tables if station_l is empty
    return Array.from({ length: setting.amount_boxL || 3 }, (_, index) => {
      const stationName = `${setting.n_table || 'โต๊ะซักประวัติ'} ${index + 1}`;
      const activePatients = findActivePatients(stationName);
      return (
        <ServiceCard
          key={index}
          setting={setting}
          stationName={stationName}
          activePatients={activePatients}
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

  // นับจำนวน station cards ที่จะแสดง
  const getStationCount = () => {
    if (setting.table_arr === 'true') {
      if (tableNames.length > 0) {
        return tableNames.length;
      }
      return setting.amount_boxL || 3;
    }
    if (tableNames.length > 0) {
      return tableNames.length;
    }
    return setting.amount_boxL || 3;
  };

  const stationCount = getStationCount();

  return (
    <section className={styles.serviceSection} style={backgroundColorStyle}>
      <h2 className={styles.serviceTitle}>
        กำลังรับบริการ
      </h2>
      
      <div 
        className={styles.serviceCards}
        style={{ gridTemplateColumns: `repeat(${stationCount}, 1fr)` }}
      >
        {renderServiceCards()}
      </div>
    </section>
  );
}

