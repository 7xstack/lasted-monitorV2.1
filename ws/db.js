import sql from 'mssql';
import dotenv from 'dotenv';
import { info, error, warn } from './logger.js';

dotenv.config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10),
  options: {
    encrypt: true, // Use this if you're on Azure
    trustServerCertificate: true // Change to true for local dev / self-signed certs
  }
};

let pool;

export const connectDb = async () => {
  try {
    if (pool) {
      return pool;
    }
    pool = await sql.connect(config);
    info('Connected to SQL Server');
    return pool;
  } catch (err) {
    error('Database connection failed:', err);
    // Don't exit the process, just log the error. The app might try to reconnect.
    pool = null; // Reset pool on connection error
    throw err; // Rethrow error to be caught by the caller
  }
};

export const getDepartmentLoad = async (settingId) => {
    try {
        const pool = await connectDb();
        const request = pool.request();
        // IMPORTANT: Assuming the ID is an integer. Change sql.Int if it's another type.
        request.input('setting_id', sql.Int, settingId);
        
        // IMPORTANT: Replace 'setting' with your actual settings table name
        const result = await request.query(
            'SELECT department_load FROM setting WHERE id = @setting_id'
        );

        if (result.recordset.length > 0 && result.recordset[0].department_load) {
            // Returns a string like "2,1,3" or "2"
            return result.recordset[0].department_load;
        }
        
        warn(`No 'department_load' found for setting ID ${settingId}.`);
        return null; // No setting found or department_load is empty/null
    } catch (err) {
        error(`Failed to get department load for setting ID ${settingId}:`, err);
        throw err; // Re-throw to be handled by the caller
    }
};
export const getSetting = async (settingId) => {
    try {
        const pool = await connectDb();
        const request = pool.request();
        request.input('setting_id', sql.Int, settingId);
        
        const result = await request.query(
            'SELECT set_descrip, set_notice, voice, list_urgent, station_l, station_r FROM setting WHERE id = @setting_id'
        );

        if (result.recordset.length > 0) {
            const settings = result.recordset[0];
            return {
                set_descrip: settings.set_descrip === 'true',
                set_notice: settings.set_notice === 'true',
                a_sound: settings.a_sound === 'true',
                b_sound: settings.b_sound === 'true',
                c_sound: settings.c_sound === 'true',
                voice: settings.voice || '3', // Default to '3' (คิว ชื่อ นามสกุล) if not set
                list_urgent: settings.list_urgent || '',
                station_l: settings.station_l || '',
                station_r: settings.station_r || '',
            };
        }
        
        warn(`No settings found for setting ID ${settingId}.`);
        return null; 
    } catch (err) {
        error(`Failed to get settings for setting ID ${settingId}:`, err);
        throw err;
    }
};
export const getStylePopup = async (settingId) => {
    try {
        const pool = await connectDb();
        const request = pool.request();
        // IMPORTANT: Assuming the ID is an integer. Change sql.Int if it's another type.
        request.input('setting_id', sql.Int, settingId);
        
        // IMPORTANT: Replace 'setting' with your actual settings table name
        const result = await request.query(
            'SELECT style_voice FROM setting WHERE id = @setting_id'
        );

        if (result.recordset.length > 0 && result.recordset[0].style_voice) {
            // Returns a string like "2,1,3" or "2"
            return result.recordset[0].style_voice;
        }
        
        warn(`No 'style_voice' found for setting ID ${settingId}.`);
        return null; // No setting found or style_voice is empty/null
    } catch (err) {
        error(`Failed to get style popup for setting ID ${settingId}:`, err);
        throw err; // Re-throw to be handled by the caller
    }
};
export const getDepartmentRoomLoad = async (settingId) => {
  try {
    const pool = await connectDb();
    const request = pool.request();
    request.input('setting_id', sql.Int, settingId);
    const result = await request.query(
      'SELECT department_room_load FROM setting WHERE id = @setting_id'
    );
    if (result.recordset.length > 0 && result.recordset[0].department_room_load) {
      return result.recordset[0].department_room_load;
    }
    warn(`No 'department_room_load' found for setting ID ${settingId}.`);
    return null;
  } catch (err) {
    error(`Failed to get department room load for setting ID ${settingId}:`, err);
    throw err;
  }
};


export { sql };
