import { NextRequest } from 'next/server';
import sql from 'mssql';
import { getConnection } from '@/lib/db-config';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const department_load = searchParams.get('department_load');
  const department_room_load = searchParams.get('department_room_load');
  const visit_date = searchParams.get('visit_date');

  if (!department_load || !department_room_load || !visit_date) {
    return new Response('Missing parameters', { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      interface SSEData {
        type: string;
        visitData?: Record<string, unknown>[];
        visitDataRight?: Record<string, unknown>[];
        activeData?: Record<string, unknown>[];
        message?: string;
        timestamp: string;
      }

      const sendData = (data: SSEData) => {
        const chunk = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      const fetchData = async () => {
        try {
          const connection = await getConnection();
          
          // Split department_load by comma
          const departmentIds = department_load
            .split(',')
            .map(id => id.trim())
            .filter(id => id.length > 0);

          // Split department_room_load by comma
          const departmentRoomIds = department_room_load
            .split(',')
            .map(id => id.trim())
            .filter(id => id.length > 0);

          // Build query for visit data with JOIN to setting_urgent_level
          let visitQuery = `
            SELECT TOP 50 
              mvi.*,
              sul.color as urgent_color
            FROM monitor_visit_info mvi
            LEFT JOIN setting_urgent_level sul ON mvi.urgent_id = sul.ID
            WHERE mvi.code_dept_id IN (`;
          departmentIds.forEach((id, index) => {
            if (index > 0) visitQuery += ',';
            visitQuery += `@dept${index}`;
          });
          visitQuery += ') AND mvi.visit_date = @visit_date ORDER BY mvi.check_in';

          // Build query for active data with JOIN to setting_urgent_level
          let activeQuery = `
            SELECT TOP(50)
              mvi.*,
              sul.color as urgent_color
            FROM monitor_visit_info mvi
            LEFT JOIN setting_urgent_level sul ON mvi.urgent_id = sul.ID
            WHERE mvi.code_dept_id IN (`;
          departmentIds.forEach((id, index) => {
            if (index > 0) activeQuery += ',';
            activeQuery += `@dept${index}`;
          });
          activeQuery += ') AND mvi.visit_date = @visit_date AND mvi.status IN (@status1, @status2)';

          // Build query for visit data right (department_room_load)
          let visitRightQuery = `
            SELECT TOP 50 
              mvi.*,
              sul.color as urgent_color
            FROM monitor_visit_info mvi
            LEFT JOIN setting_urgent_level sul ON mvi.urgent_id = sul.ID
            WHERE mvi.code_dept_id IN (`;
          departmentRoomIds.forEach((id, index) => {
            if (index > 0) visitRightQuery += ',';
            visitRightQuery += `@roomDept${index}`;
          });
          visitRightQuery += ') AND mvi.visit_date = @visit_date ORDER BY mvi.check_in';

          // Prepare separate requests to avoid concurrent usage of the same Request instance
          const visitRequest = connection.request();
          departmentIds.forEach((id, index) => {
            visitRequest.input(`dept${index}`, sql.VarChar, id);
          });
          visitRequest.input('visit_date', sql.Date, visit_date);

          const visitRightRequest = connection.request();
          departmentRoomIds.forEach((id, index) => {
            visitRightRequest.input(`roomDept${index}`, sql.VarChar, id);
          });
          visitRightRequest.input('visit_date', sql.Date, visit_date);

          const activeRequest = connection.request();
          departmentIds.forEach((id, index) => {
            activeRequest.input(`dept${index}`, sql.VarChar, id);
          });
          activeRequest.input('visit_date', sql.Date, visit_date);
          activeRequest.input('status1', sql.NVarChar, 'กำลัง');
          activeRequest.input('status2', sql.NVarChar, 'กำลังรับบริการ');

          // Execute queries in parallel using separate requests
          const [visitResult, visitRightResult, activeResult] = await Promise.all([
            visitRequest.query(visitQuery),
            visitRightRequest.query(visitRightQuery),
            activeRequest.query(activeQuery)
          ]);

          // Send data
          sendData({
            type: 'update',
            visitData: visitResult.recordset,
            visitDataRight: visitRightResult.recordset,
            activeData: activeResult.recordset,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          console.error('Database error:', error);
          sendData({
            type: 'error',
            message: 'Database error occurred',
            timestamp: new Date().toISOString()
          });
        }
      };

      // Send initial data
      await fetchData();

      // Set up periodic updates (every 10 seconds)
      const interval = setInterval(fetchData, 10000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}
