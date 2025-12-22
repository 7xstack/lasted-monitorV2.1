import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { getConnection } from '@/lib/db-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visit_date, department } = body;

    if (!visit_date || typeof visit_date !== 'string') {
      return NextResponse.json(
        { error: 'visit_date parameter is required and must be a string (yyyy-mm-dd format)' },
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

    // เตรียมส่วนกรองแผนก (ถ้าส่งมา) - ใช้เฉพาะ department
    const deptIds: string[] = typeof department === 'string'
      ? department.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    let query = `
      SELECT 
        COALESCE(NULLIF(LTRIM(RTRIM(sul.Urgent_Level)), ''), '(Unknown)') AS Urgent_Level,
        COUNT(*) AS total
      FROM dbo.monitor_visit_info AS mvi
      LEFT JOIN dbo.setting_urgent_level AS sul
             ON sul.ID = TRY_CONVERT(INT, mvi.urgent_id)
      WHERE mvi.visit_date = @visit_date
    `;

    if (deptIds.length > 0) {
      query += ` AND mvi.code_dept_id IN (`;
      deptIds.forEach((_, idx) => {
        if (idx > 0) query += ',';
        query += `@dept${idx}`;
      });
      query += `)`;
    }

    query += `
      GROUP BY COALESCE(NULLIF(LTRIM(RTRIM(sul.Urgent_Level)), ''), '(Unknown)')
      ORDER BY total DESC, Urgent_Level
    `;

    const dbRequest = connection.request();
    dbRequest.input('visit_date', sql.Date, visit_date);
    deptIds.forEach((id, idx) => {
      dbRequest.input(`dept${idx}`, sql.VarChar, id);
    });

    const result = await dbRequest.query(query);
    const rows = result.recordset || [];

    // แมพ Urgent_Level -> ER station
    const counts: Record<string, number> = {
      'ER-R': 0,
      'ER-E': 0,
      'ER-U': 0,
      'ER-S': 0,
      'ER-N': 0,
    };

    const letterToEr: Record<string, keyof typeof counts> = {
      'R': 'ER-R',
      'E': 'ER-E',
      'U': 'ER-U',
      'S': 'ER-S',
      'N': 'ER-N',
    };

    rows.forEach((r: { Urgent_Level?: string; total?: number }) => {
      const key = String(r.Urgent_Level || '').trim().toUpperCase();
      const erKey = letterToEr[key];
      if (erKey) {
        counts[erKey] = (counts[erKey] || 0) + Number(r.total || 0);
      }
    });

    return NextResponse.json({
      success: true,
      counts,
      breakdown: rows,
      visit_date,
      department: deptIds,
    });
  } catch (error) {
    console.error('Database error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST with visit_date parameter.' },
    { status: 405 }
  );
}


