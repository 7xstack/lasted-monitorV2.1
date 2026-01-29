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

    // 2. รวม department_load และ department_room_load
    const departmentTableAr = setting.department_load
      ? setting.department_load.split(',').map((d: string) => d.trim())
      : [];
    const departmentRoomAr = setting.department_room_load
      ? setting.department_room_load.split(',').map((d: string) => d.trim())
      : [];
    const mergeDepartment = [...departmentTableAr, ...departmentRoomAr];

    if (mergeDepartment.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    // 3. สร้าง query สำหรับ skipped data (status = 'ข้าม')
    const skippedRequest = connection.request();
    skippedRequest.input('date', sql.Date, visit_date);

    let skippedQuery = '';
    if (mergeDepartment.length === 1) {
      skippedQuery = `
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
  SELECT TOP 1 s.Urgent_Level, s.Description, s.notice_text, s.Color
  FROM setting_urgent_level s
  WHERE s.Hos_code = mvi.urgent_id
  ORDER BY s.priority_rate ASC, s.id ASC
) sul
WHERE mvi.visit_date = @date 
  AND mvi.status = N'ข้าม' 
  AND mvi.code_dept_id = @department
ORDER BY mvi.check_in DESC`;
      skippedRequest.input('department', sql.VarChar, mergeDepartment[0]);
    } else {
      const placeholders = mergeDepartment.map((_: string, i: number) => `@dept${i}`).join(',');
      skippedQuery = `
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
  SELECT TOP 1 s.Urgent_Level, s.Description, s.notice_text, s.Color
  FROM setting_urgent_level s
  WHERE s.Hos_code = mvi.urgent_id
  ORDER BY s.priority_rate ASC, s.id ASC
) sul
WHERE mvi.visit_date = @date 
  AND mvi.status = N'ข้าม' 
  AND mvi.code_dept_id IN (${placeholders})
ORDER BY mvi.check_in DESC`;
      mergeDepartment.forEach((dept: string, i: number) => {
        skippedRequest.input(`dept${i}`, sql.VarChar, dept);
      });
    }

    const skippedResult = await skippedRequest.query(skippedQuery);

    return NextResponse.json({
      success: true,
      data: skippedResult.recordset,
      count: skippedResult.recordset.length,
    });
  } catch (error) {
    console.error('Database error in /api/triple/skipped:', error);
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

