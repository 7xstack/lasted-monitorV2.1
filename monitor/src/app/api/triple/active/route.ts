import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { getConnection } from '@/lib/db-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, visit_date } = body;

    if (!id || !visit_date) {
      return NextResponse.json(
        { error: 'id and visit_date parameters are required' },
        { status: 400 }
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(visit_date)) {
      return NextResponse.json(
        { error: 'visit_date must be in yyyy-mm-dd format' },
        { status: 400 }
      );
    }

    const connection = await getConnection();

    // 1. ดึงข้อมูล setting
    const settingQuery = `SELECT * FROM setting WHERE id = @id`;
    const settingRequest = connection.request();
    settingRequest.input('id', sql.Int, parseInt(id));
    const settingResult = await settingRequest.query(settingQuery);
    const setting = settingResult.recordset[0];

    if (!setting) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    // 2. ดึงข้อมูล sequence order
    const sequenceQuery = `SELECT * FROM setting_sequence_queue`;
    const sequenceResult = await connection.request().query(sequenceQuery);
    const order = sequenceResult.recordset[0] || {};

    // 3. แปลง department_load เป็น array
    const departmentTableAr = setting.department_load
      ? setting.department_load.split(',').map((d: string) => d.trim())
      : [];

    if (departmentTableAr.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    // 4. สร้าง query สำหรับ active data (status = 'กำลัง')
    let activeQuery = '';
    const activeRequest = connection.request();
    activeRequest.input('date', sql.Date, visit_date);

    if (departmentTableAr.length === 1) {
      activeQuery = `
SELECT 
  mvi.visit_q_no, mvi.department, mvi.check_in, mvi.station,
  mvi.waitting_time, mvi.status_patient, mvi.name, mvi.surname,
  mvi.status, mvi.time_call, mvi.visit_id, mvi.urgent_id, 
  COALESCE(sul.Urgent_Level,'') AS urgent_level,
  COALESCE(sul.Description,'')  AS urgent_description,
  COALESCE(sul.notice_text,'')  AS urgent_notice_text,
  COALESCE(sul.Color,'#233A63') AS urgent_color
FROM monitor_visit_info AS mvi
OUTER APPLY (
  SELECT TOP 1 s.Urgent_Level, s.Description, s.notice_text, s.Color, s.priority_rate
  FROM setting_urgent_level s
  WHERE s.Hos_code = mvi.urgent_id
  ORDER BY s.priority_rate ASC, s.id ASC
) sul
WHERE mvi.visit_date = @date 
  AND mvi.status = N'กำลัง' 
  AND mvi.code_dept_id = @department 
ORDER BY COALESCE(sul.priority_rate, 0) DESC, mvi.check_in ASC`;
      activeRequest.input('department', sql.VarChar, departmentTableAr[0]);
    } else {
      const placeholders = departmentTableAr.map((_: string, i: number) => `@dept${i}`).join(',');
      activeQuery = `
SELECT 
  mvi.visit_q_no, mvi.department, mvi.check_in, mvi.station,
  mvi.waitting_time, mvi.status_patient, mvi.name, mvi.surname,
  mvi.status, mvi.time_call, mvi.visit_id, mvi.urgent_id, 
  COALESCE(sul.Urgent_Level,'') AS urgent_level,
  COALESCE(sul.Description,'')  AS urgent_description,
  COALESCE(sul.notice_text,'')  AS urgent_notice_text,
  COALESCE(sul.Color,'#233A63') AS urgent_color
FROM monitor_visit_info AS mvi
OUTER APPLY (
  SELECT TOP 1 s.Urgent_Level, s.Description, s.notice_text, s.Color, s.priority_rate
  FROM setting_urgent_level s
  WHERE s.Hos_code = mvi.urgent_id
  ORDER BY s.priority_rate ASC, s.id ASC
) sul
WHERE mvi.visit_date = @date 
  AND mvi.status = N'กำลัง' 
  AND mvi.code_dept_id IN (${placeholders}) 
ORDER BY COALESCE(sul.priority_rate, 0) DESC, mvi.check_in ASC`;
      departmentTableAr.forEach((dept: string, i: number) => {
        activeRequest.input(`dept${i}`, sql.VarChar, dept);
      });
    }

    const activeResult = await activeRequest.query(activeQuery);

    return NextResponse.json({
      success: true,
      data: activeResult.recordset,
      count: activeResult.recordset.length,
    });
  } catch (error) {
    console.error('Database error in /api/triple/active:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'GET method not supported. Use POST with id and visit_date parameters.' },
    { status: 405 }
  );
}

