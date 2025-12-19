import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db-config';
import sql from 'mssql';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // ตรวจสอบ required fields
    if (!data.typeMonitor) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required field: typeMonitor',
          error: 'typeMonitor is required',
        },
        { status: 400 }
      );
    }

    console.log('📝 กำลังบันทึกข้อมูล monitor:', data.typeMonitor);

    const connection = await getConnection();
    
    // ตรวจสอบว่ามี typeMonitor นี้ในฐานข้อมูลหรือยัง
    const idInt = parseInt(data.typeMonitor, 10);
    if (isNaN(idInt)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid typeMonitor: must be a number',
          error: 'typeMonitor must be a valid integer',
        },
        { status: 400 }
      );
    }
    
    const checkResult = await connection
      .request()
      .input('id', sql.Int, idInt)
      .query('SELECT id FROM setting WHERE id = @id');

    const exists = checkResult.recordset.length > 0;

    if (exists) {
      // UPDATE ข้อมูลที่มีอยู่
      const request = connection.request();
      
      request.input('id', sql.Int, idInt)
        .input('type', data.type || 'single')
        .input('n_hospital', data.n_hospital || '')
        .input('department', data.n_department || '')
        .input('n_table', data.head_left || '')
        .input('n_room', data.head_right || '')
        .input('urgent_setup', data.urgent_setup || 'ฉุกเฉิน')
        .input('time_wait', sql.Int, parseInt(String(data.time_wait || 300), 10))
        .input('amount_boxL', sql.Int, parseInt(String(data.amount_left || 2), 10))
        .input('amount_boxR', sql.Int, parseInt(String(data.amount_right || 2), 10))
        .input('voice', String(data.voice || '1'))
        .input('table_arr', data.arr_l ? 'true' : 'false')
        .input('table_arr2', data.arr_r ? 'true' : 'false')
        .input('set_descrip', data.set_descrip ? 'true' : 'false')
        .input('set_notice', data.set_notice ? 'true' : 'false')
        .input('stem_surname', data.stem_surname || 'name')
        .input('stem_surname_table', data.stem_surname_table || 'name')
        .input('stem_surname_popup', data.stem_surname_popup || data.stem_popup || 'false')
        .input('urgent_color', data.urgent_color ? 'true' : 'false')
        .input('status_patient', data.status_patient ? 'true' : 'false')
        .input('status_check', data.status_check ? 'true' : 'false')
        .input('lock_position', typeof data.lock_position === 'boolean' 
          ? (data.lock_position ? 'true' : 'false') 
          : data.lock_position)
        .input('lock_position_right', data.lock_position_right ? 'true' : 'false')
        .input('urgent_level', data.urgent_level ? 'true' : 'false')
        .input('a_sound', data.a_sound ? 'true' : 'false')
        .input('b_sound', data.b_sound ? 'true' : 'false')
        .input('c_sound', data.c_sound ? 'true' : 'false')
        .input('time_col', data.time_col ? 'true' : 'false')
        .input('station_l', (() => {
          const stationLeft = data.station_left || '';
          return (stationLeft.trim() === ',' || stationLeft.trim() === '') ? '' : stationLeft.trim();
        })())
        .input('station_r', (() => {
          const stationRight = data.station_right || '';
          return (stationRight.trim() === ',' || stationRight.trim() === '') ? '' : stationRight.trim();
        })())
        .input('department_load', String(data.query_left || '2'))
        .input('department_room_load', String(data.query_right || '2'))
        .input('listPage', data.listPage || '')
        .input('style_voice', String(data.style_voice || '2'))
        .input('font', data.font || 'lineseed')
        .input('list_urgent', data.list_urgent || '')
        .input('ads', data.enable_ads ? (() => {
          // บันทึก path ตาม ads_type
          // ads_type = 'right' → เก็บ ads_path_right
          // ads_type = 'left' → เก็บ ads_path_left
          // ads_type = 'split' → เก็บ ads_path_left
          if (data.ads_type === 'split') {
            return data.ads_path_left || '';
          } else if (data.ads_type === 'right') {
            return data.ads_path_right || '';
          } else if (data.ads_type === 'left') {
            return data.ads_path_left || '';
          }
          return data.ads_path_left || data.ads_path_right || '';
        })() : '')
        .input('ads_type', data.enable_ads ? (data.ads_type || 'split') : '')
        .input('color_static', data.color_static || null)
        .input('color_dynamic', data.color_dynamic || null);
      
      const updateResult = await request.query(`UPDATE setting SET 
          type = @type,
          n_hospital = @n_hospital,
          department = @department,
          n_table = @n_table,
          n_room = @n_room,
          urgent_setup = @urgent_setup,
          time_wait = @time_wait,
          amount_boxL = @amount_boxL,
          amount_boxR = @amount_boxR,
          table_arr = @table_arr,
          table_arr2 = @table_arr2,
          set_descrip = @set_descrip,
          set_notice = @set_notice,
          stem_surname = @stem_surname,
          stem_surname_table = @stem_surname_table,
          stem_surname_popup = @stem_surname_popup,
          urgent_color = @urgent_color,
          status_patient = @status_patient,
          status_check = @status_check,
          lock_position = @lock_position,
          lock_position_right = @lock_position_right,
          urgent_level = @urgent_level,
          a_sound = @a_sound,
          b_sound = @b_sound,
          c_sound = @c_sound,
          time_col = @time_col,
          station_l = @station_l,
          station_r = @station_r,
          department_load = @department_load,
          department_room_load = @department_room_load,
          listPage = @listPage,
          style_voice = @style_voice,
          voice = @voice,
          font = @font,
          list_urgent = @list_urgent,
          ads = @ads,
          ads_type = @ads_type,
          color_static = @color_static,
          color_dynamic = @color_dynamic
          WHERE id = @id`);
      
      // ตรวจสอบว่ามีแถวที่ถูก update หรือไม่ (rowsAffected)
      if (updateResult.rowsAffected && updateResult.rowsAffected[0] === 0) {
        console.warn('⚠️ ไม่มีแถวที่ถูกอัปเดต - อาจจะไม่มีข้อมูลที่ตรงกับเงื่อนไข');
      }
      
      console.log('✅ อัปเดตข้อมูลสำเร็จ - rowsAffected:', updateResult.rowsAffected);
      
      return NextResponse.json({
        success: true,
        message: 'อัปเดตข้อมูลสำเร็จ',
        action: 'update',
        id: data.typeMonitor
      });
    } else {
      // INSERT ข้อมูลใหม่
      await connection
        .request()
        .input('id', sql.Int, idInt)
        .input('type', data.type || 'single')
        .input('n_hospital', data.n_hospital || '')
        .input('department', data.n_department || '')
        .input('n_table', data.head_left || '')
        .input('n_room', data.head_right || '')
        .input('urgent_setup', data.urgent_setup || 'ฉุกเฉิน')
        .input('time_wait', sql.Int, parseInt(String(data.time_wait || 300), 10))
        .input('amount_boxL', sql.Int, parseInt(String(data.amount_left || 2), 10))
        .input('amount_boxR', sql.Int, parseInt(String(data.amount_right || 2), 10))
        .input('table_arr', data.arr_l ? 'true' : 'false')
        .input('table_arr2', data.arr_r ? 'true' : 'false')
        .input('set_descrip', data.set_descrip ? 'true' : 'false')
        .input('set_notice', data.set_notice ? 'true' : 'false')
        .input('stem_surname', data.stem_surname || 'name') 
        .input('stem_surname_table', data.stem_surname_table || 'name')
        .input('stem_surname_popup', data.stem_surname_popup || data.stem_popup || 'false')
        .input('urgent_color', data.urgent_color ? 'true' : 'false')
        .input('status_patient', data.status_patient ? 'true' : 'false')
        .input('status_check', data.status_check ? 'true' : 'false')
        .input('lock_position', typeof data.lock_position === 'boolean' 
          ? (data.lock_position ? 'true' : 'false') 
          : data.lock_position)
        .input('lock_position_right', data.lock_position_right ? 'true' : 'false')
        .input('urgent_level', data.urgent_level ? 'true' : 'false')
        .input('a_sound', data.a_sound ? 'true' : 'false')
        .input('b_sound', data.b_sound ? 'true' : 'false')
        .input('c_sound', data.c_sound ? 'true' : 'false')
        .input('time_col', data.time_col ? 'true' : 'false')
        .input('station_l', (() => {
          const stationLeft = data.station_left || '';
          return (stationLeft.trim() === ',' || stationLeft.trim() === '') ? '' : stationLeft.trim();
        })())
        .input('station_r', (() => {
          const stationRight = data.station_right || '';
          return (stationRight.trim() === ',' || stationRight.trim() === '') ? '' : stationRight.trim();
        })())
        .input('department_load', String(data.query_left || '2'))
        .input('department_room_load', String(data.query_right || '2'))
        .input('listPage', data.listPage || '')
        .input('style_voice', String(data.style_voice || '2'))
        .input('voice', String(data.voice || '1'))
        .input('font', data.font || 'lineseed')
        .input('list_urgent', data.list_urgent || '')
        .input('ads', data.enable_ads ? (() => {
          // เก็บ path ตาม ads_type
          // ads_type = 'right' → เก็บ ads_path_right
          // ads_type = 'left' → เก็บ ads_path_left
          // ads_type = 'split' → เก็บ ads_path_left
          if (data.ads_type === 'split') {
            return data.ads_path_left || '';
          } else if (data.ads_type === 'right') {
            return data.ads_path_right || '';
          } else if (data.ads_type === 'left') {
            return data.ads_path_left || '';
          }
          return data.ads_path_left || data.ads_path_right || '';
        })() : '')
        .input('ads_type', data.enable_ads ? (data.ads_type || 'split') : '')
        .input('color_static', data.color_static || null)
        .input('color_dynamic', data.color_dynamic || null)
        .input('n_listtable', '')
        .input('n_listroom', '2')
        .query(`INSERT INTO setting (
          id, type, n_hospital, department, n_table, n_room, urgent_setup,
          time_wait, amount_boxL, amount_boxR, table_arr, table_arr2, set_descrip,
          set_notice, stem_surname, stem_surname_table,
          stem_surname_popup,
          urgent_color, status_patient, status_check, lock_position,
          lock_position_right, urgent_level, a_sound, b_sound, c_sound,
          time_col, station_l, station_r, department_load, department_room_load, listPage,
          style_voice, n_listtable, n_listroom, voice, font, list_urgent, ads, ads_type, color_static, color_dynamic
        ) VALUES (
          @id, @type, @n_hospital, @department, @n_table, @n_room, @urgent_setup,
          @time_wait, @amount_boxL, @amount_boxR, @table_arr, @table_arr2, @set_descrip,
          @set_notice, @stem_surname, @stem_surname_table,
          @stem_surname_popup,
          @urgent_color, @status_patient, @status_check, @lock_position,
          @lock_position_right, @urgent_level, @a_sound, @b_sound, @c_sound,
          @time_col, @station_l, @station_r, @department_load, @department_room_load, @listPage,
          @style_voice, @n_listtable, @n_listroom, @voice, @font, @list_urgent, @ads, @ads_type, @color_static, @color_dynamic
        )`);
      
      console.log('✅ เพิ่มข้อมูลสำเร็จ');
      
      return NextResponse.json({
        success: true,
        message: 'เพิ่มข้อมูลสำเร็จ',
        action: 'insert',
        id: data.typeMonitor
      });
    }
  } catch (error: unknown) {
    console.error('❌ Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error message:', errorMessage);
    
    // ตรวจสอบว่าเป็น error เกี่ยวกับ column font หรือไม่
    let userMessage = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
    if (errorMessage.includes('font') || errorMessage.includes('Invalid column name')) {
      userMessage = 'เกิดข้อผิดพลาด: ไม่พบ column "font" ในฐานข้อมูล กรุณาตรวจสอบและเพิ่ม column นี้ก่อน';
    } else {
      userMessage = `เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${errorMessage}`;
    }
    
    return NextResponse.json(
      {
        success: false,
        message: userMessage,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}