import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db-config';

export async function GET() {
  try {
    // Get connection from pool
    const connection = await getConnection();

    // Query to select ID, Color, and Urgent_level from setting_urgent_level table
    const query = `
      SELECT 
        ID,
        Color,
        Urgent_level
      FROM setting_urgent_level
      ORDER BY ID
    `;

    // Execute query
    const result = await connection.request().query(query);

    // Return the data
    return NextResponse.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length
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
