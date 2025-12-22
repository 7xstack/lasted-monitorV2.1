import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { getConnection } from '@/lib/db-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, urgent_setup, urgent_color, urgent_level } = body;

    // Validate required parameters
    if (!id || typeof id !== 'number') {
      return NextResponse.json(
        { error: 'id parameter is required and must be a number' },
        { status: 400 }
      );
    }

    // Get connection from pool
    const connection = await getConnection();

    // Build the update query
    let query = 'UPDATE setting SET ';
    const updates = [];
    
    if (urgent_setup !== undefined) {
      updates.push('urgent_setup = @urgent_setup');
    }
    if (urgent_color !== undefined) {
      updates.push('urgent_color = @urgent_color');
    }
    if (urgent_level !== undefined) {
      updates.push('urgent_level = @urgent_level');
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'At least one urgent parameter must be provided' },
        { status: 400 }
      );
    }

    query += updates.join(', ') + ' WHERE id = @id';

    // Execute query
    const dbRequest = connection.request();
    
    // Add parameters to the request
    dbRequest.input('id', sql.Int, id);
    
    if (urgent_setup !== undefined) {
      dbRequest.input('urgent_setup', sql.VarChar, urgent_setup);
    }
    if (urgent_color !== undefined) {
      dbRequest.input('urgent_color', sql.VarChar, urgent_color);
    }
    if (urgent_level !== undefined) {
      dbRequest.input('urgent_level', sql.VarChar, urgent_level);
    }

    const result = await dbRequest.query(query);

    // Get updated setting data to return
    const selectQuery = `
      SELECT 
        id,
        department,
        urgent_setup,
        urgent_color,
        urgent_level
      FROM setting 
      WHERE id = @id
    `;

    const selectRequest = connection.request();
    selectRequest.input('id', sql.Int, id);
    const selectResult = await selectRequest.query(selectQuery);

    // Return the updated data
    return NextResponse.json({
      success: true,
      message: `Updated urgent settings for setting ID ${id}`,
      updated_count: result.rowsAffected[0],
      data: selectResult.recordset[0],
      id: id
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
    { error: 'GET method not supported. Use POST with id and urgent parameters.' },
    { status: 405 }
  );
}
