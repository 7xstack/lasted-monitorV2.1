import {
  connectDb,
  sql,
  getDepartmentLoad,
  getStylePopup,
  getSetting,
} from "../db.js";
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

async function fetchEr2Data(client, today) {
  try {
    info(`[ER_2] เริ่มดึงข้อมูลสำหรับ setting_id: ${client.setting_id}, date: ${today}`);
    
    const [departmentLoadString, genderStyle, settings] =
      await Promise.all([
        getDepartmentLoad(client.setting_id),
        getStylePopup(client.setting_id),
        getSetting(client.setting_id),
      ]);

    info(`[ER_2] ดึง settings สำเร็จ - department_load: ${departmentLoadString}, style_voice: ${genderStyle}, voice: ${settings?.voice}`);

    const visitDate = new Date(today);

    const departments = departmentLoadString
      ? departmentLoadString.split(",").map((d) => d.trim())
      : [];

    if (departments.length === 0) {
      warn(`[ER_2] ไม่มี departments สำหรับ setting_id ${client.setting_id}`);
      client.send(
        JSON.stringify({
          wait: [],
          active: [],
          call: null,
          skip: [],
        })
      );
      return;
    }

    const pool = await connectDb();

    const deptPlaceholders = departments
      .map((_, i) => `@dept${i}`)
      .join(",");

    const createRequest = () => {
      const request = pool.request();
      request.input("visit_date", sql.Date, visitDate);
      departments.forEach((dept, i) =>
        request.input(`dept${i}`, sql.VarChar, dept)
      );
      return request;
    };

    const baseQuery = `
      SELECT
          T1.*, T2.priority_rate, T2.Urgent_Level as urgent_level, T2.Color,
          T2.Description as urgent_description, T2.notice_text as urgent_notice_text
      FROM monitor_visit_info AS T1
      INNER JOIN setting_urgent_level AS T2 ON T1.urgent_id = T2.ID`;

    const waitQuery = departments.length > 0
      ? `${baseQuery} WHERE T1.code_dept_id NOT IN (${deptPlaceholders}) AND T1.dept_app IN (${deptPlaceholders}) AND T1.department NOT LIKE '%กลับบ้าน%' AND T1.visit_date = @visit_date AND T1.status = N'รอ' ORDER BY T2.priority_rate DESC`
      : null;
    const activeQuery = departments.length > 0
      ? `${baseQuery} WHERE T1.code_dept_id NOT IN (${deptPlaceholders}) AND T1.dept_app IN (${deptPlaceholders}) AND T1.department NOT LIKE '%กลับบ้าน%' AND T1.visit_date = @visit_date AND T1.status = N'กำลัง' ORDER BY T2.priority_rate DESC, T1.time_call ASC`
      : null;

    const callQuery =
      departments.length > 0
        ? `SELECT TOP(1) T1.*, T2.Urgent_Level as urgent_level, T2.Description as urgent_description, T2.notice_text as urgent_notice_text, T3.pname as pname FROM monitor_visit_info AS T1 INNER JOIN setting_urgent_level AS T2 ON T1.urgent_id = T2.ID LEFT JOIN visit_info AS T3 ON T1.vn = T3.vn WHERE T1.visit_date = @visit_date AND T1.status_call = '1' AND T1.code_dept_id NOT IN (${deptPlaceholders}) AND T1.dept_app IN (${deptPlaceholders}) AND T1.department NOT LIKE '%กลับบ้าน%' ORDER BY T2.priority_rate DESC, T1.time_call ASC`
        : null;
    const skipQuery =
      departments.length > 0
        ? `SELECT * FROM monitor_visit_info AS T1 WHERE T1.visit_date = @visit_date AND T1.status = N'ข้าม' AND T1.code_dept_id NOT IN (${deptPlaceholders}) AND T1.dept_app IN (${deptPlaceholders}) AND T1.department NOT LIKE '%กลับบ้าน%'`
        : null;

    // Get list_urgent from settings and create count queries
    const listUrgent = settings?.list_urgent
      ? settings.list_urgent.split(",").map((s) => s.trim()).filter((s) => s)
      : [];

    // Create count query function for each urgent level
    const createCountRequest = (letter) => {
      if (departments.length === 0) return Promise.resolve({ recordset: [] });
      const request = pool.request();
      request.input("visit_date", sql.Date, visitDate);
      request.input("urgent_level", sql.VarChar, letter);
      departments.forEach((dept, i) =>
        request.input(`dept${i}`, sql.VarChar, dept)
      );
      const countQuery = `SELECT COUNT(*) as count FROM monitor_visit_info AS T1 INNER JOIN setting_urgent_level AS T2 ON T1.urgent_id = T2.ID WHERE T1.code_dept_id IN (${deptPlaceholders}) AND T1.visit_date = @visit_date AND T2.Urgent_Level = @urgent_level`;
      return request.query(countQuery);
    };

    const promises = [
      waitQuery
        ? createRequest().query(waitQuery)
        : Promise.resolve({ recordset: [] }),
      activeQuery
        ? createRequest().query(activeQuery)
        : Promise.resolve({ recordset: [] }),
      callQuery
        ? createRequest().query(callQuery)
        : Promise.resolve({ recordset: [] }),
      skipQuery
        ? createRequest().query(skipQuery)
        : Promise.resolve({ recordset: [] }),
      ...listUrgent.map((letter) => createCountRequest(letter)),
    ];

    const [
      waitResult,
      activeResult,
      callResult,
      skipResult,
      ...countResults
    ] = await Promise.all(promises);

    // Build count object from results
    const count = {};
    countResults.forEach((result, index) => {
      if (result.recordset && result.recordset.length > 0) {
        const letter = listUrgent[index];
        const countValue = result.recordset[0]?.count || 0;
        count[letter] = countValue;
      } else if (listUrgent[index]) {
        count[listUrgent[index]] = 0;
      }
    });

    const callData = callResult.recordset[0] || null;

    info(`[ER_2] ผลลัพธ์จาก DB - wait: ${waitResult.recordset.length}, active: ${activeResult.recordset.length}, call: ${callData ? 'มี' : 'ไม่มี'}, skip: ${skipResult.recordset.length}, count: ${Object.keys(count).length} levels`);

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

    if (callData && settings) {
      try {
        const apiEndpoint = "https://voice.aztecthstudio.com/visit-queue-files";
        
        info(`[ER_2] 🎤 กำลังส่งข้อมูลไปยัง voice.aztecthstudio.com สำหรับ visit_q_no: ${callData.visit_q_no}`);
        
        let nameToSend = callData.name;
        let surnameToSend = callData.surname;

        if (settings.voice === '1') { // 1: คิว
          nameToSend = '';
          surnameToSend = '';
          info(`[ER_2] Voice mode: 1 (คิวเท่านั้น)`);
        } else if (settings.voice === '2') { // 2: คิว ชื่อ
          surnameToSend = '';
          info(`[ER_2] Voice mode: 2 (คิว + ชื่อ)`);
        } else {
          info(`[ER_2] Voice mode: 3 (คิว + ชื่อ + นามสกุล)`);
        }
        // if a_sound (3: คิว ชื่อ นามสกุล), send both name and surname as is

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
          type: "er",
          pname: pnameValue,
        };

        info(`[ER_2] 📤 Payload ที่ส่งไป voice API:`, payload);

        const apiResponse = await fetch(apiEndpoint, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });

        info(`[ER_2] 📥 Response status จาก voice API: ${apiResponse.status} ${apiResponse.statusText}`);

        if (apiResponse.ok) {
          const apiResponseData = await apiResponse.json();
          info(`[ER_2] ✅ Response จาก voice API:`, apiResponseData);
          // Extract the 'merged_file' and add it as 'voice' array
          callData.voice = apiResponseData.merged_file ? [apiResponseData.merged_file] : [];
          info(`[ER_2] 🎵 Voice file ที่ได้: ${callData.voice.length > 0 ? callData.voice[0] : 'ไม่มี'}`);
        } else {
          const errorText = await apiResponse.text();
          error(`[ER_2] ❌ API call failed - status: ${apiResponse.status}, response: ${errorText}`);
          callData.voice = [];
        }
      } catch (apiError) {
        error(`[ER_2] ❌ Error calling voice API:`, apiError);
        callData.voice = [];
      }
    } else {
      if (!callData) {
        debug(`[ER_2] ไม่มี callData สำหรับส่งไป voice API`);
      }
      if (!settings) {
        warn(`[ER_2] ไม่มี settings สำหรับส่งไป voice API`);
      }
    }

    const responseData = {
      wait: waitResult.recordset,
      active: activeResult.recordset,
      call: callData,
      skip: skipResult.recordset,
      count: count,
    };

    // เปรียบเทียบกับ response ก่อนหน้า
    const responseString = JSON.stringify(responseData);
    const previousResponse = client.previousResponseData;
    
    if (previousResponse === responseString) {
      // ข้อมูลเหมือนเดิม ไม่ต้อง log
      debug(`[ER_2] ข้อมูลเหมือนเดิม ไม่ log`);
    } else {
      // ข้อมูลเปลี่ยน log และอัปเดต previous response
      info(`[ER_2] ✅ ส่งข้อมูลกลับไปยัง client สำเร็จ - wait: ${responseData.wait.length}, active: ${responseData.active.length}, call: ${responseData.call ? 'มี' : 'ไม่มี'}`);
      client.previousResponseData = responseString;
    }
    
    client.send(JSON.stringify(responseData));
  } catch (err) {
    error(`[ER_2] ❌ Failed to fetch Er data for setting_id ${client.setting_id}:`, err);
    client.send(JSON.stringify({ error: "Failed to fetch Er data" }));
  }
}

export default fetchEr2Data;
