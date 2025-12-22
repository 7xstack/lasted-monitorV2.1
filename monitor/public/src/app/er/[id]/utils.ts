import { Setting, VisitInfo } from './types';

// ฟังก์ชันสำหรับซ่อนนามสกุล (แสดง 3 ตัวแรก + XXX)
export const maskSurname = (surname: string | number | boolean | null | undefined): string => {
  if (!surname || surname === '-' || typeof surname !== 'string') return '-';
  const firstThree = surname.substring(0, 3); // เอา 3 ตัวแรก
  return `${firstThree}XXX`;
};

// Function to split queue number into letter and number
export const splitQueueNumber = (queueNo: string | number | null | undefined) => {
  if (!queueNo) return { letter: '-', number: '-' };
  
  const queueStr = String(queueNo);
  const letter = queueStr.replace(/\d+$/, '');
  const number = queueStr.match(/\d+$/)?.[0] || '-';
  
  return { letter, number };
};

export const formatPatientNameRoom = (setting: Setting, visit: VisitInfo): string => {
    const name = visit.name || '-';
    const surname = visit.surname || '-';

    if (setting.stem_surname === 'name') {
        return '';
    }

    if (setting.stem_surname === 'true') {
        return `${name} ${maskSurname(surname)}`;
    }

    return `${name} ${surname}`;
};

export const formatPatientName = (setting: Setting, visit: VisitInfo): string => {
    const name = visit.name || '-';
    const surname = visit.surname || '-';

    if (setting.stem_surname_table === 'name') {
        return '';
    }
    
    if (setting.stem_surname_table === 'true') {
        return `${name} ${maskSurname(surname)}`;
    }

    return `${name} ${surname}`;
};

export const formatPatientNamePopup = (setting: Setting, visit: VisitInfo): string => {
    const name = visit.name || '-';
    const surname = visit.surname || '-';

    // stem_surname_popup = 'name' = ปิดทั้งชื่อและนามสกุล
    if (setting.stem_surname_popup === 'name') {
        return '';
    }

    // stem_surname_popup = 'true' = ปิดนามสกุล เป็น xxx ตัวที่สี่ขึ้นไป
    if (setting.stem_surname_popup === 'true') {
        return `${name} ${maskSurname(surname)}`;
    }

    // stem_surname_popup = 'false' = แสดงชื่อและนามสกุลปกติ
    return `${name} ${surname}`;
};

