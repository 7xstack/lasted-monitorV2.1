import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { getConnection } from '@/lib/db-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { department_load, visit_date } = body;

    if (!department_load || typeof department_load !== 'string' || !visit_date || typeof visit_date !== 'string') {
      return NextResponse.json({ error: 'department_load and visit_date parameters are required' }, { status: 400 });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(visit_date)) {
      return NextResponse.json({ error: 'visit_date must be in yyyy-mm-dd format' }, { status: 400 });
    }

    const departmentIds = department_load.split(',').map(id => id.trim()).filter(id => id.length > 0);
    if (departmentIds.length === 0) {
      return NextResponse.json({ error: 'No valid department IDs found in department_load' }, { status: 400 });
    }

    const departmentInClause = `code_dept_id IN (${departmentIds.map((_, i) => `@dept${i}`).join(',')})`;
    
    const connection = await getConnection();

    // 1. Visit Data Query
    const visitQuery = `
      SELECT * 
      FROM monitor_visit_info 
      WHERE ${departmentInClause} AND visit_date = @visit_date AND status = 'W' 
      ORDER BY urgent_id DESC, visit_q_no ASC`;
    
    // 2. Active Data Query
    const activeQuery = `
      SELECT * 
      FROM monitor_visit_info 
      WHERE ${departmentInClause} AND visit_date = @visit_date AND status = 'C' 
      ORDER BY urgent_id DESC, time_call DESC`;

    // 3. Call Data Query
    const callQuery = `
      SELECT TOP 1 mvi.*, sul.Description as description, sul.notice_text as notice 
      FROM monitor_visit_info as mvi
      LEFT JOIN setting_urgent_level as sul ON mvi.urgent_id = sul.ID
      WHERE mvi.${departmentInClause} 
      AND mvi.visit_date = @visit_date 
      AND mvi.status_call = @status_call 
      ORDER BY mvi.time_call DESC`;

    // 4. Skipped Data Query
    const skippedQuery = `
      SELECT * 
      FROM monitor_visit_info 
      WHERE ${departmentInClause} AND visit_date = @visit_date AND status = 'S' 
      ORDER BY time_skip DESC`;

    // Execute all queries in parallel
    const visitRequest = connection.request();
    departmentIds.forEach((id, i) => visitRequest.input(`dept${i}`, sql.VarChar(50), id));
    visitRequest.input('visit_date', sql.Date, visit_date);

    const activeRequest = connection.request();
    departmentIds.forEach((id, i) => activeRequest.input(`dept${i}`, sql.VarChar(50), id));
    activeRequest.input('visit_date', sql.Date, visit_date);

    const callRequest = connection.request();
    departmentIds.forEach((id, i) => callRequest.input(`dept${i}`, sql.VarChar(50), id));
    callRequest.input('visit_date', sql.Date, visit_date);
    callRequest.input('status_call', sql.Int, 1);

    const skippedRequest = connection.request();
    departmentIds.forEach((id, i) => skippedRequest.input(`dept${i}`, sql.VarChar(50), id));
    skippedRequest.input('visit_date', sql.Date, visit_date);

    const [visitData, activeData, callDataResult, skippedData] = await Promise.all([
      visitRequest.query(visitQuery).then(r => r.recordset),
      activeRequest.query(activeQuery).then(r => r.recordset),
      callRequest.query(callQuery).then(r => r.recordset),
      skippedRequest.query(skippedQuery).then(r => r.recordset)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        visitData,
        activeData,
        callData: callDataResult[0] || null,
        skippedData
      }
    });

  } catch (error) {
    console.error('Database error in /api/data/all:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Internal server error', details: process.env.NODE_ENV === 'development' ? errorMessage : undefined },
      { status: 500 }
    );
  }
}

