import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db-config';

export async function GET() {
  try {
    const connection = await getConnection();
    const result = await connection
      .request()
      .query('SELECT code, name FROM department ORDER BY code');

    return NextResponse.json({
      success: true,
      data: result.recordset,
    });
  } catch (error: unknown) {
    console.error('Error fetching departments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแผนก: ' + errorMessage,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

