import { connectDb, sql, getDepartmentLoad, getStylePopup, getSetting } from "../db.js";
import fetch from "node-fetch";
import { info, error, warn, debug } from "../logger.js";

// Helper function to find station_index by comparing patient station with setting station array
function findStationIndex(patientStation, stationArray) {
  if (!patientStation || !stationArray || stationArray.length === 0) {
    return null;
  }

  const patientStationTrimmed = String(patientStation).trim();
  
  for (let i = 0; i < stationArray.length; i++) {
    const settingStation = String(stationArray[i]).trim();
    
    // เทียบแบบตรง
    if (patientStationTrimmed === settingStation) {
      return i + 1; // +1 เพื่อให้ index เริ่มจาก 1 แทน 0
    }
    
    // เทียบแบบที่มี "โต๊ะ" prefix
    if (patientStationTrimmed === `โต๊ะ${settingStation}` || 
        `โต๊ะ${patientStationTrimmed}` === settingStation) {
      return i + 1; // +1 เพื่อให้ index เริ่มจาก 1 แทน 0
    }
    
    // เทียบแบบไม่มี prefix ทั้งสองฝั่ง (normalize)
    const patientNormalized = patientStationTrimmed.replace(/^โต๊ะ\s*/, '');
    const settingNormalized = settingStation.replace(/^โต๊ะ\s*/, '');
    if (patientNormalized === settingNormalized) {
      return i + 1; // +1 เพื่อให้ index เริ่มจาก 1 แทน 0
    }
  }
  
  return null;
}

async function fetchQueueData(client, today) {
  try {
    info(`[QUEUE] เริ่มดึงข้อมูลสำหรับ setting_id: ${client.setting_id}, date: ${today}`);
    
    // 1. Get the department_load string (e.g., "2,1,3") from the settings table
    const departmentLoadString = await getDepartmentLoad(client.setting_id);
    const genderStyle = await getStylePopup(client.setting_id);
    const settings = await getSetting(client.setting_id);

    info(`[QUEUE] ดึง settings สำเร็จ - department_load: ${departmentLoadString}, style_voice: ${genderStyle}, voice: ${settings?.voice}`);

    // If no departments are assigned to this setting ID, stop here.
    if (!departmentLoadString) {
      warn(`[QUEUE] ไม่มี departments สำหรับ setting_id ${client.setting_id}, ข้ามการ query`);
      client.send(
        JSON.stringify({ wait: [], active: [], call: null, skip: [] })
      );
      return;
    }

    const pool = await connectDb();

    // 2. Prepare the IN clause from the string
    const departments = departmentLoadString.split(",").map((d) => d.trim());
    const deptPlaceholders = departments.map((_, i) => `@dept${i}`).join(",");

    // A helper function to create and configure a request
    const createRequest = () => {
      const request = pool.request();
      request.input("visit_date", sql.Date, today);
      // Add all department codes as parameters
      departments.forEach((dept, i) => {
        request.input(`dept${i}`, sql.VarChar, dept);
      });
      return request;
    };

    // 3. Use the placeholders in the queries
    const waitQuery = `
SELECT
    T1.*,
    T2.priority_rate,
    T2.Urgent_Level as urgent_level,
    T2.Description as urgent_description,
    T2.notice_text as urgent_notice_text,
    T2.Color as Color
FROM
    monitor_visit_info AS T1
INNER JOIN
    setting_urgent_level AS T2 ON T1.urgent_id = T2.ID
WHERE 
    T1.code_dept_id IN (${deptPlaceholders})
    AND T1.visit_date = @visit_date 
    AND T1.status = N'รอ'
ORDER BY
    T2.priority_rate DESC`;

    const activeQuery = `
SELECT
    T1.*,
    T2.priority_rate,
    T2.Urgent_Level as urgent_level,
    T2.Description as urgent_description,
    T2.notice_text as urgent_notice_text,
    T2.Color as Color
FROM
    monitor_visit_info AS T1
INNER JOIN
    setting_urgent_level AS T2 ON T1.urgent_id = T2.ID
WHERE 
    T1.code_dept_id IN (${deptPlaceholders})
    AND T1.visit_date = @visit_date 
    AND T1.status = N'กำลัง'
ORDER BY
    T2.priority_rate DESC, T1.time_call ASC`;

    const callQuery = `
      SELECT TOP(1) T1.*, 
        T2.Urgent_Level as urgent_level, 
        T2.Description as urgent_description, 
        T2.notice_text as urgent_notice_text,
        T2.Color as Color,
        T3.pname as pname
    FROM monitor_visit_info AS T1
    INNER JOIN setting_urgent_level AS T2
        ON T1.urgent_id = T2.ID
    LEFT JOIN visit_info AS T3
        ON T1.vn = T3.vn
    WHERE T1.visit_date = @visit_date
      AND T1.status_call = '1'
      AND T1.code_dept_id IN (${deptPlaceholders})
    ORDER BY T2.priority_rate DESC, T1.time_call ASC`;
    
    const skipQuery = `SELECT * FROM monitor_visit_info WHERE visit_date = @visit_date AND status = N'ข้าม' AND code_dept_id IN (${deptPlaceholders})`;

    // Execute the remaining query.
    // The others are commented out as requested.
    const [waitResult, activeResult, callResult, skipResult] =
      await Promise.all([
        createRequest().query(waitQuery),
        createRequest().query(activeQuery),
        createRequest().query(callQuery),
        createRequest().query(skipQuery),
      ]);

    const callData = callResult.recordset[0] || null;

    info(`[QUEUE] ผลลัพธ์จาก DB - wait: ${waitResult.recordset.length}, active: ${activeResult.recordset.length}, call: ${callData ? 'มี' : 'ไม่มี'}, skip: ${skipResult.recordset.length}`);

    // Parse station_l from settings and add station_index to wait patients only
    const stationArray = settings && settings.station_l 
      ? settings.station_l.split(',').map(s => s.trim()).filter(s => s)
      : [];

    // Add station_index to wait patients only
    if (waitResult.recordset) {
      waitResult.recordset.forEach(patient => {
        patient.station_index = findStationIndex(patient.station, stationArray);
      });
    }

    // เก็บ response data จาก voice API ไว้สำหรับแสดงใน log
    let voiceApiResponseData = null;
    
    if (callData && settings) {
      try {
        // เรียกไปที่ API
        const apiEndpoint = "https://voice.aztecthstudio.com/visit-queue-files";
        
        let nameToSend = callData.name;
        let surnameToSend = callData.surname;

        if (settings.voice === '1') { // 1: คิว
          nameToSend = '';
          surnameToSend = '';
        } else if (settings.voice === '2') { // 2: คิว ชื่อ
          surnameToSend = '';
        }
        // if voice === '3' (คิว ชื่อ นามสกุล), send both name and surname as is

        // แปลง pname เป็นตัวเลข
        let pnameValue = null;
        if (callData.pname) {
          const pnameStr = String(callData.pname).trim();
          if (pnameStr === 'นาย') {
            pnameValue = "1";
          } else if (pnameStr === 'นาง') {
            pnameValue = "2";
          } else if (pnameStr === 'น.ส.' || pnameStr === 'นส' || pnameStr === 'น.ส') {
            pnameValue = "3";
          } else if (pnameStr === 'ด.ช.' || pnameStr === 'ดช' || pnameStr === 'ด.ช') {
            pnameValue = "4";
          } else if (pnameStr === 'ด.ญ.' || pnameStr === 'ดญ' || pnameStr === 'ด.ญ') {
            pnameValue = "5";
          } else {
            pnameValue = "6";
          }
        }

        const payload = {
          visit_queue_no: callData.visit_q_no,
          style_voice: genderStyle,
          description: settings.set_descrip ? callData.urgent_description : '',
          name: nameToSend,
          surname: surnameToSend,
          station: callData.station,
          notice_text: settings.set_notice ? callData.urgent_notice_text : '',
          pname: pnameValue,
        };

        const apiResponse = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (apiResponse.ok) {
          voiceApiResponseData = await apiResponse.json();
          // Extract the 'merged_file' and add it as 'voice' array
          callData.voice = voiceApiResponseData.merged_file ? [voiceApiResponseData.merged_file] : [];
        } else {
          const errorText = await apiResponse.text();
          voiceApiResponseData = { error: true, status: apiResponse.status, message: errorText };
          // Set voice to empty array on failure
          callData.voice = [];
        }
      } catch (apiError) {
        voiceApiResponseData = { error: true, message: apiError.message };
        // Set voice to empty array on error
        callData.voice = [];
      }
    } else {
      if (!callData) {
        debug(`[QUEUE] ไม่มี callData สำหรับส่งไป voice API`);
      }
      if (!settings) {
        warn(`[QUEUE] ไม่มี settings สำหรับส่งไป voice API`);
      }
    }

    const responseData = {
      wait: waitResult.recordset,
      active: activeResult.recordset,
      call: callData,
      skip: skipResult.recordset,
      style_voice: genderStyle
    };

    // เปรียบเทียบกับ response ก่อนหน้า
    const responseString = JSON.stringify(responseData);
    const previousResponse = client.previousResponseData;
    
    if (previousResponse === responseString) {
      // ข้อมูลเหมือนเดิม ไม่ต้อง log
      debug(`[QUEUE] ข้อมูลเหมือนเดิม ไม่ log`);
    } else {
      // ข้อมูลเปลี่ยน log และอัปเดต previous response
      info(`[QUEUE] ✅ ส่งข้อมูลกลับไปยัง client สำเร็จ - wait: ${responseData.wait.length}, active: ${responseData.active.length}, call: ${responseData.call ? 'มี' : 'ไม่มี'}`);
      
      // แสดง response data จาก voice API ถ้ามี
      if (voiceApiResponseData) {
        info(`[QUEUE] 📥 Response data จาก voice.aztecthstudio.com:`, voiceApiResponseData);
      }
      
      client.previousResponseData = responseString;
    }
    
    client.send(JSON.stringify(responseData));
  } catch (err) {
    error(`[QUEUE] ❌ Failed to fetch Queue data for setting_id ${client.setting_id}:`, err);
    // Optionally send an error message to the client
    client.send(JSON.stringify({ error: "Failed to fetch Queue data" }));
  }
}

export default fetchQueueData;
