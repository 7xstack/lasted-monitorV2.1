import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { getConnection } from '@/lib/db-config';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { vn, code_dept_id, status_call, visit_q_no } = body;

    // Validate vn parameter
    if (!vn || typeof vn !== 'string') {
      return NextResponse.json(
        { error: 'vn parameter is required and must be a string' },
        { status: 400 }
      );
    }

    // Get connection from pool
    const connection = await getConnection();

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const dbRequest = connection.request();
    
    dbRequest.input('vn', sql.VarChar, vn);

    if (code_dept_id !== undefined) {
      updates.push('code_dept_id = @code_dept_id');
      dbRequest.input('code_dept_id', sql.VarChar, code_dept_id);
    }

    if (status_call !== undefined) {
      updates.push('status_call = @status_call');
      dbRequest.input('status_call', sql.Int, status_call);
    }

    if (visit_q_no !== undefined) {
      updates.push('visit_q_no = @visit_q_no');
      dbRequest.input('visit_q_no', sql.VarChar, visit_q_no);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'At least one field (code_dept_id, status_call, or visit_q_no) must be provided' },
        { status: 400 }
      );
    }

    const query = `UPDATE monitor_visit_info SET ${updates.join(', ')} WHERE vn = @vn`;
    
    const result = await dbRequest.query(query);

    // Check if any rows were affected
    if (result.rowsAffected[0] > 0) {
      return NextResponse.json({
        success: true,
        message: 'Updated successfully',
        vn: vn,
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

