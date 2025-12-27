import styles from './page.module.css';
import { Setting, VisitInfo, UrgentLevel } from './types';
import ServiceCard from './ServiceCard';

interface ServiceSectionProps {
  setting: Setting;
  activeData: VisitInfo[];
  urgentLevels: UrgentLevel[];
  countData: { [key: string]: number };
  hideNumber?: boolean;
}

export default function ServiceSection({ setting, activeData, urgentLevels, countData, hideNumber }: ServiceSectionProps) {
  // Find active patient for a station
  const findActivePatient = (stationName: string, letter?: string) => {
    return activeData.find(visit => {
      const station = visit.station;
      return station === stationName || 
        station === letter || 
        station === `โต๊ะ${stationName}` ||
        station === `โต๊ะ${letter}` ||
        station === `${stationName}` ||
        station === `${letter}`;
    });
  };

  // Get color for a letter from urgentLevels
  const getColorForLetter = (letter: string): string | undefined => {
    const urgentLevel = urgentLevels.find(level => level.Urgent_level === letter);
    return urgentLevel?.Color && urgentLevel.Color !== '-' ? urgentLevel.Color : undefined;
  };

  // Render service cards based on setting.list_urgent
  const renderServiceCards = () => {
    // Get letters from setting.list_urgent (comma-separated string)
    const letters = setting.list_urgent 
      ? setting.list_urgent.split(',').map(s => s.trim()).filter(s => s)
      : [];

    if (letters.length > 0) {
      // Dynamic ER stations based on list_urgent
      return letters.map((letter, index) => {
        const stationName = `ER-${letter}`;
        const activePatient = findActivePatient(stationName, letter);
        const color = getColorForLetter(letter);
        
        return (
          <ServiceCard
            key={`${letter}-${index}`}
            setting={setting}
            stationName={stationName}
            activePatient={activePatient}
            color={color}
            count={countData[letter]}
            hideNumber={hideNumber}
          />
        );
      });
    }
    
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

