import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db-config';

export async function GET() {
  try {
    const connection = await getConnection();
    const result = await connection
      .request()
      .query("SELECT * FROM setting");

    const count = result.recordset.length || 0;

    // หา ID สูงสุดในฐานข้อมูล (สำหรับ generate ID ใหม่)
    const maxIdResult = await connection
      .request()
      .query("SELECT MAX(CAST(id AS INT)) as maxId FROM setting WHERE ISNUMERIC(id) = 1");
    
    const maxSettingId = maxIdResult.recordset[0]?.maxId || 0;

    // ดึง department_load, department_room_load, type เพื่อเก็บ department IDs ที่ไม่ซ้ำ
    const deptResult = await connection
      .request()
      .query("SELECT department_load, department_room_load, type FROM setting WHERE n_listroom = '2'");
    
    // เก็บ department IDs ที่ไม่ซ้ำ (เฉพาะตัวเลข)
    const departmentIdsSet = new Set<string>();
    
    deptResult.recordset.forEach((item: Record<string, unknown>) => {
      const type = String(item.type || '').toLowerCase();
      const departmentLoad = String(item.department_load || '').trim();
      const departmentRoomLoad = String(item.department_room_load || '').trim();
      
      // Split และเก็บ department_load (ทุก type)
      if (departmentLoad) {
        departmentLoad.split(',').forEach((dept: string) => {
          const trimmed = dept.trim();
          // เก็บเฉพาะค่าที่เป็นตัวเลข
          if (trimmed && /^\d+$/.test(trimmed)) {
            departmentIdsSet.add(trimmed);
          }
        });
      }
      
      // ถ้า type เป็น duo ให้เก็บ department_room_load ด้วย
      if (type === 'duo' && departmentRoomLoad) {
        departmentRoomLoad.split(',').forEach((dept: string) => {
          const trimmed = dept.trim();
          // เก็บเฉพาะค่าที่เป็นตัวเลข
          if (trimmed && /^\d+$/.test(trimmed)) {
            departmentIdsSet.add(trimmed);
          }
        });
      }
    });
    
    // แปลง Set เป็น Array และเรียงลำดับ (สำหรับแผนกที่ใช้งาน)
    const departmentIds = Array.from(departmentIdsSet).sort((a, b) => parseInt(a) - parseInt(b));
    
    // maxId = จำนวนแผนกที่ใช้งาน (สำหรับแสดงผล)
    const maxId = departmentIds.length;

    // แมปชื่อ column จากฐานข้อมูลให้ตรงกับที่ front-end ใช้
    const mappedData = result.recordset.map((item: Record<string, unknown>) => ({
      ...item,
      type: item.type || 'single',
      n_department: item.department,
      head_left: item.n_table,
      head_right: item.n_room,
      amount_left: item.amount_boxL,
      amount_right: item.amount_boxR,
      query_left: item.department_load,
      query_right: item.department_room_load,
    }));

    return NextResponse.json({
      success: true,
      count: count,
      maxId: maxId, // number - จำนวนแผนกที่ใช้งาน (สำหรับแสดงผล)
      maxSettingId: maxSettingId, // number - ID สูงสุด (สำหรับ generate ID ใหม่)
      departmentIds: departmentIds, // array - list ของ department IDs
      data: mappedData
    });

  } catch (error: unknown) {
    console.error('Error getting settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูล: ' + errorMessage,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
