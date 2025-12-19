import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// สร้างโฟลเดอร์ data ถ้ายังไม่มี
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// อ่านข้อมูลทั้งหมด
export async function readSettings() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // ถ้าไม่มีไฟล์ ให้คืนค่าเริ่มต้น
    return {};
  }
}

// เขียนข้อมูลทั้งหมด
export async function writeSettings(data: Record<string, unknown>) {
  await ensureDataDir();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// อ่านการตั้งค่าของหน้าจอเฉพาะ
export async function getSettingByMonitor(typeMonitor: string) {
  const settings = await readSettings();
  return settings[typeMonitor] || null;
}

// บันทึกการตั้งค่าของหน้าจอ
export async function saveSettingByMonitor(typeMonitor: string, data: Record<string, unknown>) {
  const settings = await readSettings();
  settings[typeMonitor] = {
    ...data,
    typeMonitor,
    updated_at: new Date().toISOString(),
  };
  await writeSettings(settings);
  return settings[typeMonitor];
}

// ลบการตั้งค่าของหน้าจอ
export async function deleteSettingByMonitor(typeMonitor: string) {
  const settings = await readSettings();
  delete settings[typeMonitor];
  await writeSettings(settings);
}

// ข้อมูลเริ่มต้นสำหรับหน้าจอใหม่
export function getDefaultSetting(typeMonitor: string) {
  return {
    typeMonitor,
    ads: '',
    type: 'ประเภทหน้าจอ',
    n_hospital: 'โรงพยาบาล',
    n_department: 'ตรวจโรคทั่วไป',
    head_left: 'จุดซักประวัติ',
    head_right: 'ห้องตรวจ',
    urgent_setup: 'ฉุกเฉิน',
    time_wait: 300,
    amount_left: 2,
    amount_right: 2,
    arr_l: 'false',
    arr_r: 'false',
    set_descrip: 'false',
    set_notice: 'false',
    stem_surname: 'name',
    stem_surname_popup: 'false',
    stem_surname_table: 'name',
    urgent_color: 'true',
    status_patient: 'true',
    status_check: 'false',
    lock_position: 'false',
    lock_position_right: 'false',
    urgent_level: 'true',
    a_sound: 'true',
    b_sound: 'false',
    c_sound: 'false',
    time_col: 'true',
    station_left: 'โต๊ะซักประวัติ 1,โต๊ะซักประวัติ 2',
    station_right: 'โต๊ะซักประวัติ 1,โต๊ะซักประวัติ 2',
    query_left: '2',
    query_right: '2',
    listPage: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
