import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db-config';

export async function GET() {
  try {
    const connection = await getConnection();
    const result = await connection.request().query('SELECT id, type, n_hospital, department FROM setting ORDER BY id');
    const settings = result.recordset || [];
    return NextResponse.json({ 
      success: true,
      data: settings 
    });
  } catch (error) {
    console.error('Error getting id:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to get id' 
    }, { status: 500 });
  }
}