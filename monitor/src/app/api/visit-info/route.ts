import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { getConnection } from '@/lib/db-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visit_date } = body;

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

    // Get connection from pool
    const connection = await getConnection();

    // Build the query to get specific columns from monitor_visit_info where visit_date matches
    // JOIN with setting_urgent_level to get urgent_level
    const query = `
      SELECT 
        mvi.code_dept_id,
        mvi.urgent_id,
        mvi.vn,
        sul.Urgent_Level as urgent_level,
        sul.priority_rate as urgent_priority_rate,
        mvi.status_call,
        mvi.status,
        mvi.station,
        mvi.time_call,
        mvi.check_in,
        mvi.visit_date,
        mvi.visit_q_no,
        mvi.name,
        mvi.surname
      FROM monitor_visit_info mvi
      LEFT JOIN setting_urgent_level sul ON mvi.urgent_id = sul.ID
      WHERE mvi.visit_date = @visit_date 
      ORDER BY mvi.visit_q_no ASC
    `;

    // Execute query
    const dbRequest = connection.request();
    
    // Add visit_date parameter
    dbRequest.input('visit_date', sql.Date, visit_date);

    const result = await dbRequest.query(query);

    // Return the data
    return NextResponse.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length,
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
    { error: 'Method not allowed. Please use POST with visit_date parameter.' },
    { status: 405 }
  );
}

