import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { getConnection } from '@/lib/db-config';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { vn } = body;

    // Validate vn parameter
    if (!vn || typeof vn !== 'string') {
      return NextResponse.json(
        { error: 'vn parameter is required and must be a string' },
        { status: 400 }
      );
    }

    // Get connection from pool
    const connection = await getConnection();

    // Update status_call to 2 for the specified vn
    const query = 'UPDATE monitor_visit_info SET status_call = @status_call WHERE vn = @vn';
    
    const dbRequest = connection.request();
    dbRequest.input('status_call', sql.Int, 2);
    dbRequest.input('vn', sql.VarChar, vn);

    const result = await dbRequest.query(query);

    // Check if any rows were affected
    if (result.rowsAffected[0] > 0) {
      return NextResponse.json({
        success: true,
        message: 'Status updated successfully',
        vn: vn,
        status_call: 2,
        rowsAffected: result.rowsAffected[0]
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No records found with the specified vn',
        vn: vn
      }, { status: 404 });
    }

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
    { error: 'GET method not supported. Use PUT with vn parameter.' },
    { status: 405 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'POST method not supported. Use PUT with vn parameter.' },
    { status: 405 }
  );
}
