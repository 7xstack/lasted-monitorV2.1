import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getConnection } from '@/lib/db-config';
import sql from 'mssql';

const ADS_DIR = path.join(process.cwd(), 'public', 'ads');

// สร้าง directory สำหรับ ads ถ้ายังไม่มี
async function ensureAdsDir() {
  try {
    await mkdir(ADS_DIR, { recursive: true });
  } catch {
    // Directory อาจมีอยู่แล้ว
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureAdsDir();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const side = formData.get('side') as string; // 'left', 'right', หรือ 'separate'
    const typeMonitor = formData.get('typeMonitor') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!typeMonitor) {
      return NextResponse.json(
        { success: false, error: 'typeMonitor is required' },
        { status: 400 }
      );
    }

    // ตรวจสอบประเภทไฟล์ (รองรับแค่รูปภาพ)
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // ตรวจสอบขนาดไฟล์ (สูงสุด 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // สร้างชื่อไฟล์ใหม่ด้วย Math.random() แบบไม่ซ้ำ
    const timestamp = Date.now();
    const randomName = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.name) || '.jpg';
    const fileName = `${timestamp}_${randomName}${extension}`;
    
    // เก็บไฟล์โดยไม่มี prefix (ตามที่ผู้ใช้ต้องการ)
    // แต่ยังใช้ side เพื่อแยกประเภทในการจัดการ
    const filePath = path.join(ADS_DIR, fileName);

    // อ่านไฟล์และบันทึก
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // สร้าง URL path สำหรับเก็บใน database
    // เก็บเป็น /ads/filename.png
    const relativePath = `/ads/${fileName}`;

    // บันทึกลง table ads ใน database
    try {
      const connection = await getConnection();
      const typeMonitorInt = parseInt(typeMonitor, 10);
      
      if (isNaN(typeMonitorInt)) {
        return NextResponse.json(
          { success: false, error: 'Invalid typeMonitor' },
          { status: 400 }
        );
      }

      // ตรวจสอบว่ามีข้อมูลใน table ads หรือยัง
      const checkResult = await connection
        .request()
        .input('typeMonitor', sql.Int, typeMonitorInt)
        .input('side', sql.NVarChar, side)
        .query('SELECT id FROM ads WHERE typeMonitor = @typeMonitor AND side = @side');

      if (checkResult.recordset.length > 0) {
        // UPDATE ข้อมูลที่มีอยู่
        await connection
          .request()
          .input('typeMonitor', sql.Int, typeMonitorInt)
          .input('side', sql.NVarChar, side)
          .input('path', sql.NVarChar, relativePath)
          .query('UPDATE ads SET path = @path WHERE typeMonitor = @typeMonitor AND side = @side');
      } else {
        // INSERT ข้อมูลใหม่
        await connection
          .request()
          .input('typeMonitor', sql.Int, typeMonitorInt)
          .input('side', sql.NVarChar, side)
          .input('path', sql.NVarChar, relativePath)
          .query('INSERT INTO ads (typeMonitor, side, path) VALUES (@typeMonitor, @side, @path)');
      }

      console.log('✅ บันทึกข้อมูล ads ลง database สำเร็จ:', { typeMonitor, side, path: relativePath });

      // อัพเดท column ads และ ads_type ใน table setting
      try {
        // แปลง side เป็น ads_type
        // side = 'left' → ads_type = 'left'
        // side = 'right' → ads_type = 'right'
        // side = 'separate' → ads_type = 'split'
        let ads_type = 'split';
        if (side === 'left') {
          ads_type = 'left';
        } else if (side === 'right') {
          ads_type = 'right';
        } else if (side === 'separate') {
          ads_type = 'split';
        }

        // อัพเดท table setting
        await connection
          .request()
          .input('id', sql.Int, typeMonitorInt)
          .input('ads', sql.NVarChar, relativePath)
          .input('ads_type', sql.NVarChar, ads_type)
          .query('UPDATE setting SET ads = @ads, ads_type = @ads_type WHERE id = @id');

        console.log('✅ อัพเดท column ads และ ads_type ใน table setting สำเร็จ');
      } catch (settingError) {
        console.error('❌ Error updating setting table:', settingError);
        // ไม่ throw error เพราะไฟล์อัพโหลดสำเร็จแล้ว
      }
    } catch (dbError) {
      console.error('❌ Error saving to database:', dbError);
      // ยังคง return success เพราะไฟล์อัพโหลดสำเร็จแล้ว
      // แต่แจ้งเตือนว่าการบันทึกลง database ล้มเหลว
    }

    return NextResponse.json({
      success: true,
      path: relativePath,
      fileName: path.basename(filePath),
    });
  } catch (error: unknown) {
    console.error('Error uploading file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

