import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { getConnection } from '@/lib/db-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, surname, urgent_id, visit_date } = body;

    // Validate required parameters
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'name parameter is required and must be a string' },
        { status: 400 }
      );
    }

    if (!urgent_id || typeof urgent_id !== 'number') {
      return NextResponse.json(
        { error: 'urgent_id parameter is required and must be a number' },
        { status: 400 }
      );
    }

    // Use current date if visit_date not provided
    const targetDate = visit_date || new Date().toISOString().split('T')[0];

    // Get connection from pool
    const connection = await getConnection();

    // Build the update query
    let query = `
      UPDATE monitor_visit_info 
      SET urgent_id = @urgent_id
      WHERE name = @name
      AND visit_date = @visit_date
    `;

    // Add surname condition if provided
    if (surname && typeof surname === 'string') {
      query += ' AND surname = @surname';
    }

    // Execute query
    const dbRequest = connection.request();
    
    // Add parameters to the request
    dbRequest.input('name', sql.VarChar, name);
    dbRequest.input('urgent_id', sql.Int, urgent_id);
    dbRequest.input('visit_date', sql.Date, targetDate);
    
    if (surname && typeof surname === 'string') {
      dbRequest.input('surname', sql.VarChar, surname);
    }

    const result = await dbRequest.query(query);

    // Get updated data to return
    let selectQuery = `
      SELECT 
        mvi.*,
        sul.color as urgent_color
      FROM monitor_visit_info mvi
      LEFT JOIN setting_urgent_level sul ON mvi.urgent_id = sul.ID
      WHERE mvi.name = @name
      AND mvi.visit_date = @visit_date
    `;

    if (surname && typeof surname === 'string') {
      selectQuery += ' AND mvi.surname = @surname';
    }

    selectQuery += ' ORDER BY mvi.check_in';

    const selectRequest = connection.request();
    selectRequest.input('name', sql.VarChar, name);
    selectRequest.input('visit_date', sql.Date, targetDate);
    
    if (surname && typeof surname === 'string') {
      selectRequest.input('surname', sql.VarChar, surname);
    }

    const selectResult = await selectRequest.query(selectQuery);

    // Return the updated data
    return NextResponse.json({
      success: true,
      message: `Updated urgent_id for patient(s) named "${name}"`,
      updated_count: result.rowsAffected[0],
      data: selectResult.recordset,
      urgent_id: urgent_id,
      visit_date: targetDate
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
    { error: 'GET method not supported. Use POST with name and urgent_id parameters.' },
    { status: 405 }
  );
}
