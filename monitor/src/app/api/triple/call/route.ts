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

    // 2. แปลง department_load เป็น array
    const departmentTableAr = setting.department_load
      ? setting.department_load.split(',').map((d: string) => d.trim())
      : [];

    if (departmentTableAr.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        hasCall: false,
      });
    }

    // 3. สร้าง query สำหรับ call data (status_call = '1')
    const callRequest = connection.request();
    callRequest.input('date', sql.Date, visit_date);

    let callQuery = '';
    if (departmentTableAr.length === 1) {
      callQuery = `
SELECT TOP(1) mvi.*, sul.Urgent_level,
    sul.Urgent_level, 
    sul.Description, 
    sul.notice_text,
    COALESCE(sul.Color,'#233A63') AS urgent_color
FROM monitor_visit_info AS mvi
LEFT JOIN setting_urgent_level AS sul
    ON mvi.urgent_id = sul.HOS_code
WHERE mvi.visit_date = @date
  AND mvi.status_call = '1'
  AND mvi.code_dept_id = @department
ORDER BY mvi.time_call ASC`;
      callRequest.input('department', sql.VarChar, departmentTableAr[0]);
    } else {
      const placeholders = departmentTableAr.map((_: string, i: number) => `@dept${i}`).join(',');
      callQuery = `
SELECT TOP(1) mvi.*, sul.Urgent_level,
    sul.Urgent_level, 
    sul.Description, 
    sul.notice_text,
    COALESCE(sul.Color,'#233A63') AS urgent_color
FROM monitor_visit_info AS mvi
LEFT JOIN setting_urgent_level AS sul
    ON mvi.urgent_id = sul.HOS_code
WHERE mvi.visit_date = @date
  AND mvi.status_call = '1'
  AND mvi.code_dept_id IN (${placeholders})
ORDER BY mvi.time_call ASC`;
      departmentTableAr.forEach((dept: string, i: number) => {
        callRequest.input(`dept${i}`, sql.VarChar, dept);
      });
    }

    const callResult = await callRequest.query(callQuery);
    const callData = callResult.recordset[0] || null;

    return NextResponse.json({
      success: true,
      data: callData,
      hasCall: callData !== null,
    });
  } catch (error) {
    console.error('Database error in /api/triple/call:', error);
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

