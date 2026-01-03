import { Setting, VisitInfo } from './types';

// ฟังก์ชันสำหรับซ่อนนามสกุล (แสดง 3 ตัวแรก + XXX)
export const maskSurname = (surname: string | number | boolean | null | undefined): string => {
  if (!surname || surname === '-' || typeof surname !== 'string') return '-';
  const firstThree = surname.substring(0, 3); // เอา 3 ตัวแรก
  return `${firstThree}XXX`;
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

// Function to split queue number into letter and number
export const splitQueueNumber = (queueNo: string | number | null | undefined) => {
  if (!queueNo) return { letter: '-', number: '-' };
  
  const queueStr = String(queueNo);
  const letter = queueStr.replace(/\d+$/, '');
  const numberRaw = queueStr.match(/\d+$/)?.[0] || '-';
  const number = numberRaw !== '-' ? String(parseInt(numberRaw, 10)) : '-';
  
  return { letter, number };
};

// ฟังก์ชันฟอร์แมตเวลาจาก time_call (แสดงเป็น HH:MM)
export const formatTimeCall = (timeCall: string | string[] | null | undefined) => {
  if (!timeCall) return null;
  try {
    const timeString = Array.isArray(timeCall) ? timeCall[0] : timeCall;
    if (!timeString) return null;
    
    const date = new Date(timeString);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date for time_call:', timeCall);
      return null;
    }
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting time_call:', timeCall, error);
    return null;
  }
};






