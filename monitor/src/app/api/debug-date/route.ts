import { NextResponse } from 'next/server';

export async function GET() {
  const serverDate = new Date();
  const serverDateString = serverDate.toISOString().split('T')[0];
  
  // ตรวจสอบ timezone
  const timezoneOffset = serverDate.getTimezoneOffset();
  const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return NextResponse.json({
    serverDate: serverDate.toISOString(),
    serverDateOnly: serverDateString,
    timezoneOffset: timezoneOffset,
    timezoneName: timezoneName,
    localTime: serverDate.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
    utcTime: serverDate.toUTCString(),
    message: `วันที่ที่ server ใช้คือ: ${serverDateString}`
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  return NextResponse.json({
    received: body,
    serverProcessedDate: new Date().toISOString().split('T')[0],
    message: 'Server ได้รับข้อมูลนี้'
  });
}
