import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { getConnection } from '@/lib/db-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, color } = body;

    // Validate required parameters
    if (!id || typeof id !== 'number') {
      return NextResponse.json(
        { error: 'id parameter is required and must be a number' },
        { status: 400 }
      );
    }

    // Get connection from pool
    const connection = await getConnection();

    // Check if record exists
    const checkQuery = 'SELECT * FROM setting_urgent_level WHERE ID = @id';
    const checkRequest = connection.request();
    checkRequest.input('id', sql.Int, id);
    const checkResult = await checkRequest.query(checkQuery);

    let query;

    if (checkResult.recordset.length > 0) {
      // Update existing record
      const updates = [];
      
      if (color !== undefined) {
        updates.push('color = @color');
      }

      if (updates.length === 0) {
        return NextResponse.json(
          { error: 'At least one parameter must be provided for update' },
          { status: 400 }
        );
      }

      query = 'UPDATE setting_urgent_level SET ' + updates.join(', ') + ' WHERE ID = @id';
    } else {
      // Insert new record
      query = `
        INSERT INTO setting_urgent_level (ID, color)
        VALUES (@id, @color)
      `;
    }

    // Execute query
    const dbRequest = connection.request();
    
    // Add parameters to the request
    dbRequest.input('id', sql.Int, id);
    
    if (color !== undefined) {
      dbRequest.input('color', sql.VarChar, color);
    }

    const result = await dbRequest.query(query);

    // Get updated data to return
    const selectQuery = `
      SELECT 
        ID,
        color
      FROM setting_urgent_level 
      WHERE ID = @id
    `;

    const selectRequest = connection.request();
    selectRequest.input('id', sql.Int, id);
    const selectResult = await selectRequest.query(selectQuery);

    // Return the updated data
    return NextResponse.json({
      success: true,
      message: `Updated urgent level settings for ID ${id}`,
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
    { error: 'GET method not supported. Use POST with id and urgent level parameters.' },
    { status: 405 }
  );
}
