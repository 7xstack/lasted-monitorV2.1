import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vn = searchParams.get('vn') || '680901070841';
    
    console.log('🔍 ตรวจสอบ VN:', vn);
    
    const pool = await getConnection();
    
    // ดึงข้อมูลทั้งหมดของ VN นี้
    const result = await pool.request()
      .input('vn', vn)
      .query(`
        SELECT 
          mvi.*,
          sul.color as urgent_color,
          sul.Urgent_Level as urgent_level_name
        FROM monitor_visit_info mvi
        LEFT JOIN setting_urgent_level sul ON mvi.urgent_id = sul.ID
        WHERE mvi.vn = @vn
      `);
    
    if (result.recordset.length > 0) {
      const data = result.recordset[0];
      return NextResponse.json({
        success: true,
        message: `พบข้อมูล VN: ${vn}`,
        data: data,
        important_fields: {
          vn: data.vn,
          name: data.name,
          surname: data.surname,
          status: data.status,
          visit_date: data.visit_date,
          code_dept_id: data.code_dept_id,
          department: data.department,
          check_in: data.check_in,
          station: data.station,
          urgent_id: data.urgent_id,
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `ไม่พบข้อมูล VN: ${vn}`,
        hint: 'ตรวจสอบว่า VN ถูกต้องหรือไม่'
      }, { status: 404 });
    }
    
  } catch (error: unknown) {
    console.error('❌ Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorCode = (error as { code?: string })?.code || 'UNKNOWN_ERROR';
    return NextResponse.json({
      success: false,
      error: errorMessage,
      code: errorCode
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { vn, status, visit_date } = await request.json();
    
    if (!vn) {
      return NextResponse.json({
        success: false,
        error: 'กรุณาระบุ VN'
      }, { status: 400 });
    }
    
    const pool = await getConnection();
    
    // UPDATE ข้อมูล
    const updateQuery = `
      UPDATE monitor_visit_info 
      SET 
        status = @status,
        visit_date = @visit_date
      WHERE vn = @vn
    `;
    
    const result = await pool.request()
      .input('vn', vn)
      .input('status', status || 'กำลัง')
      .input('visit_date', visit_date || new Date().toISOString().split('T')[0])
      .query(updateQuery);
    
    if (result.rowsAffected[0] > 0) {
      // ดึงข้อมูลที่อัพเดทแล้ว
      const updated = await pool.request()
        .input('vn', vn)
        .query('SELECT * FROM monitor_visit_info WHERE vn = @vn');
      
      return NextResponse.json({
        success: true,
        message: 'อัพเดทสำเร็จ',
        rowsAffected: result.rowsAffected[0],
        updated_data: updated.recordset[0]
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `ไม่พบ VN: ${vn}`
      }, { status: 404 });
    }
    
  } catch (error: unknown) {
    console.error('❌ Update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
