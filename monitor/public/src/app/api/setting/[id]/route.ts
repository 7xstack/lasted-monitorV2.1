import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db-config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    console.log('🔍 กำลังค้นหา setting id:', id);

    // Query จาก database
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', id)
      .query('SELECT * FROM setting WHERE id = @id');

    if (!result.recordset || result.recordset.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'ไม่พบข้อมูล setting',
        },
        { status: 404 }
      );
    }

    const data = result.recordset[0];
    console.log('✅ พบข้อมูล');

    // ดึงข้อมูล ads จาก column ads และแยกประเภทจาก ads_type
    const ads = data.ads || '';
    const ads_type = data.ads_type || 'split';
    let ads_path_left = '';
    let ads_path_right = '';
    
    // แยก path ตาม ads_type
    // ads_type = 'split' → เก็บใน ads_path_left
    // ads_type = 'left' → เก็บใน ads_path_left
    // ads_type = 'right' → เก็บใน ads_path_right
    if (ads && ads !== '' && ads !== 'false') {
      if (ads_type === 'split' || ads_type === 'left') {
        ads_path_left = ads;
        ads_path_right = '';
      } else if (ads_type === 'right') {
        ads_path_left = '';
        ads_path_right = ads;
      }
    }

    // แปลง station_left และ station_right จาก string เป็น array
    let station_left = data.station_left;
    let station_right = data.station_right;
    
    if (typeof station_left === 'string') {
      station_left = station_left ? station_left.split(',').map((s: string) => s.trim()).filter((s: string) => s) : [];
    } else if (!Array.isArray(station_left)) {
      station_left = [];
    }
    
    if (typeof station_right === 'string') {
      station_right = station_right ? station_right.split(',').map((s: string) => s.trim()).filter((s: string) => s) : [];
    } else if (!Array.isArray(station_right)) {
      station_right = [];
    }

    // ตรวจสอบว่าเป็น id 214 หรือ 215 เพื่อเพิ่ม autoSwitch metadata
    const autoSwitch = 
      id === '214' || id === '215'
        ? {
            enabled: true,
            currentId: id,
            nextId: id === '214' ? '215' : '214',
            delaySeconds: 20,
          }
        : undefined;

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        station_left,
        station_right,
        ads_path_left: ads_path_left,
        ads_path_right: ads_path_right,
      },
      autoSwitch,
      // รูปแบบเดิมสำหรับ setting page
      hospital: data.n_hospital,
      department: data.n_department,
      head_left: data.head_left,
      head_right: data.head_right,
      amount_left: data.amount_boxL,
      amount_right: data.amount_boxR,
      arr_l: data.arr_l,
      arr_r: data.arr_r,
      time_col: data.time_col,
      stem_surname: data.stem_surname,
      stem_popup: data.stem_popup || data.stem_surname_popup || 'false',
      stem_surname_popup: data.stem_popup || data.stem_surname_popup || 'false',
      stem_surname_table: data.stem_surname_table,
      urgent_color: data.urgent_color,
      status_patient: data.status_patient,
      status_check: data.status_check,
      lock_position: data.lock_position,
      lock_position_right: data.lock_position_right,
      urgent_level: data.urgent_level,
      a_sound: data.a_sound,
      b_sound: data.b_sound,
      c_sound: data.c_sound,
      query_left: data.query_left,
      query_right: data.query_right,
      ads: data.ads,
      ads_type: data.ads_type || 'split',
      enable_ads: data.ads ? data.ads !== '' && data.ads !== 'false' : false,
      ads_path_left: ads_path_left,
      ads_path_right: ads_path_right,
      font: data.font || 'lineseed',
      list_urgent: data.list_urgent || '',
      color_static: data.color_static || null,
      color_dynamic: data.color_dynamic || null,
    });
  } catch (error: unknown) {
    let message = 'Unknown error';
    let stack: string | undefined = undefined;
    if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
    } else if (typeof error === 'string') {
      message = error;
    }

    console.error('❌ Error:', error);
    console.error('Error message:', message);
    if (stack) {
      console.error('Error stack:', stack);
    }
    
    // ตรวจสอบว่าเป็น error เกี่ยวกับ column font หรือไม่
    let userMessage = 'เกิดข้อผิดพลาดในการดึงข้อมูล';
    if (message.includes('font') || message.includes('Invalid column name')) {
      userMessage = 'เกิดข้อผิดพลาด: ไม่พบ column "font" ในฐานข้อมูล กรุณาตรวจสอบและเพิ่ม column นี้ก่อน';
    } else {
      userMessage = `เกิดข้อผิดพลาดในการดึงข้อมูล: ${message}`;
    }
    
    return NextResponse.json(
      {
        success: false,
        message: userMessage,
        error: message,
      },
      { status: 500 }
    );
  }
}