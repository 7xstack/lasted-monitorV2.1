import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db-config';
import sql from 'mssql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentCode = searchParams.get('department_code');

    if (!departmentCode) {
      return NextResponse.json(
        {
          success: false,
          message: 'กรุณาระบุ department_code',
        },
        { status: 400 }
      );
    }

    const pool = await getConnection();
    const result = await pool
      .request()
      .input('department_code', sql.NVarChar, departmentCode)
      .query('SELECT station_name FROM station WHERE department_code = @department_code ORDER BY station_name');

    return NextResponse.json({
      success: true,
      data: result.recordset,
    });
  } catch (error: unknown) {
    console.error('Error fetching stations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      {
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูล station: ' + errorMessage,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

