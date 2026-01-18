import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { getConnection } from '@/lib/db-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { department_load, visit_date } = body;

    // Validate department_load parameter
    if (!department_load || typeof department_load !== 'string') {
      return NextResponse.json(
        { error: 'department_load parameter is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate visit_date parameter
    if (!visit_date || typeof visit_date !== 'string') {
      return NextResponse.json(
        { error: 'visit_date parameter is required and must be a string (yyyy-mm-dd format)' },
        { status: 400 }
      );
    }

    // Validate date format (yyyy-mm-dd)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(visit_date)) {
      return NextResponse.json(
        { error: 'visit_date must be in yyyy-mm-dd format' },
        { status: 400 }
      );
    }

    // Split department_load by comma and trim whitespace
    const departmentIds = department_load
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (departmentIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid department IDs found in department_load' },
        { status: 400 }
      );
    }

    // Get connection from pool
    const connection = await getConnection();

    // Build the query with proper parameterization and JOIN with setting_urgent_level table
    let query = `
      SELECT 
        mvi.*,
        sul.color as urgent_color
      FROM monitor_visit_info mvi
      LEFT JOIN setting_urgent_level sul ON mvi.urgent_id = sul.ID
      WHERE mvi.code_dept_id IN (`;
    
    departmentIds.forEach((id, index) => {
      if (index > 0) query += ',';
      query += `@dept${index}`;
    });
    query += ') AND mvi.visit_date = @visit_date ORDER BY mvi.check_in';

    // Execute query
    const dbRequest = connection.request();
    
    // Add parameters to the request
    departmentIds.forEach((id, index) => {
      dbRequest.input(`dept${index}`, sql.VarChar, id);
    });
    
    // Add visit_date parameter
    dbRequest.input('visit_date', sql.Date, visit_date);

    const result = await dbRequest.query(query);

    // Return the data
    return NextResponse.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length,
      departmentIds: departmentIds,
      visit_date: visit_date
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
    { error: 'GET method not supported. Use POST with department_load parameter.' },
    { status: 405 }
  );
}
