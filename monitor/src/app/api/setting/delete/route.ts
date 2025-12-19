import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db-config';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'กรุณาระบุ ID ที่ต้องการลบ',
        },
        { status: 400 }
      );
    }

    console.log('🗑️ กำลังลบข้อมูล setting ID:', id);

    const connection = await getConnection();
    
    // ตรวจสอบว่ามีข้อมูลอยู่หรือไม่
    const checkResult = await connection
      .request()
      .input('id', id)
      .query('SELECT id FROM setting WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'ไม่พบข้อมูลที่ต้องการลบ',
        },
        { status: 404 }
      );
    }

    // ลบข้อมูล
    await connection
      .request()
      .input('id', id)
      .query('DELETE FROM setting WHERE id = @id');

    console.log('✅ ลบข้อมูลสำเร็จ');

    return NextResponse.json({
      success: true,
      message: 'ลบข้อมูลสำเร็จ',
      id: id
    });

  } catch (error: unknown) {
    console.error('❌ Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error message:', errorMessage);
    
    return NextResponse.json(
      {
        success: false,
        message: 'เกิดข้อผิดพลาดในการลบข้อมูล: ' + errorMessage,
      },
      { status: 500 }
    );
  }
}

