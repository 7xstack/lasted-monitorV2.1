import {
  connectDb,
  sql,
  getDepartmentLoad,
  getStylePopup,
  getDepartmentRoomLoad,
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

async function fetchDuoData(client, today) {
  try {
    info(`[DUO] เริ่มดึงข้อมูลสำหรับ setting_id: ${client.setting_id}, date: ${today}`);
    
    const [departmentLoadLeftString, departmentLoadRightString, genderStyle, settings] =
      await Promise.all([
        getDepartmentLoad(client.setting_id),
        getDepartmentRoomLoad(client.setting_id),
        getStylePopup(client.setting_id),
        getSetting(client.setting_id),
      ]);

    info(`[DUO] ดึง settings สำเร็จ - dept_left: ${departmentLoadLeftString}, dept_right: ${departmentLoadRightString}, style_voice: ${genderStyle}, voice: ${settings?.voice}`);

    const visitDate = new Date(today);

    const departmentsLeft = departmentLoadLeftString
      ? departmentLoadLeftString.split(",").map((d) => d.trim())
      : [];
    const departmentsRight = departmentLoadRightString
      ? departmentLoadRightString.split(",").map((d) => d.trim())
      : [];

    const allDepartments = [...departmentsLeft, ...departmentsRight];

    if (allDepartments.length === 0) {
      warn(`[DUO] ไม่มี departments สำหรับ setting_id ${client.setting_id}`);
      client.send(
        JSON.stringify({
          waitLeft: [],
          waitRight: [],
          activeLeft: [],
          activeRight: [],
          call: null,
          skip: [],
        })
      );
      return;
    }

    const pool = await connectDb();

    const deptPlaceholdersLeft = departmentsLeft
      .map((_, i) => `@deptL${i}`)
      .join(",");
    const deptPlaceholdersRight = departmentsRight
      .map((_, i) => `@deptR${i}`)
      .join(",");
    const allDeptPlaceholders = allDepartments
      .map((_, i) => `@deptAll${i}`)
      .join(",");

    const createRequest = (side) => {
      const request = pool.request();
      request.input("visit_date", sql.Date, visitDate);
      if (side === "left" && departmentsLeft.length > 0) {
        departmentsLeft.forEach((dept, i) =>
          request.input(`deptL${i}`, sql.VarChar, dept)
        );
      } else if (side === "right" && departmentsRight.length > 0) {
        departmentsRight.forEach((dept, i) =>
          request.input(`deptR${i}`, sql.VarChar, dept)
        );
      } else if (side === "all" && allDepartments.length > 0) {
        allDepartments.forEach((dept, i) =>
          request.input(`deptAll${i}`, sql.VarChar, dept)
        );
      }
      return request;
    };

    const baseQuery = `
      SELECT
          T1.*, T2.priority_rate, T2.Urgent_Level as urgent_level, T2.Color,
          T2.Description as urgent_description, T2.notice_text as urgent_notice_text
      FROM monitor_visit_info AS T1
      INNER JOIN setting_urgent_level AS T2 ON T1.urgent_id = T2.ID`;

    const waitQueryLeft =
      departmentsLeft.length > 0
        ? `${baseQuery} WHERE T1.code_dept_id IN (${deptPlaceholdersLeft}) AND T1.visit_date = @visit_date AND T1.status = N'รอ' ORDER BY T2.priority_rate DESC`
        : null;
    const waitQueryRight =
      departmentsRight.length > 0
        ? `${baseQuery} WHERE T1.code_dept_id IN (${deptPlaceholdersRight}) AND T1.visit_date = @visit_date AND T1.status = N'รอ' ORDER BY T2.priority_rate DESC`
        : null;
    const activeQueryLeft =
      departmentsLeft.length > 0
        ? `${baseQuery} WHERE T1.code_dept_id IN (${deptPlaceholdersLeft}) AND T1.visit_date = @visit_date AND T1.status = N'กำลัง' ORDER BY T2.priority_rate DESC, T1.time_call ASC`
        : null;
    const activeQueryRight =
      departmentsRight.length > 0
        ? `${baseQuery} WHERE T1.code_dept_id IN (${deptPlaceholdersRight}) AND T1.visit_date = @visit_date AND T1.status = N'กำลัง' ORDER BY T2.priority_rate DESC, T1.time_call ASC`
        : null;

    const callQuery =
      allDepartments.length > 0
        ? `SELECT TOP(1) T1.*, T2.Urgent_Level as urgent_level, T2.Description as urgent_description, T2.notice_text as urgent_notice_text, T3.pname as pname FROM monitor_visit_info AS T1 INNER JOIN setting_urgent_level AS T2 ON T1.urgent_id = T2.ID LEFT JOIN visit_info AS T3 ON T1.vn = T3.vn WHERE T1.visit_date = @visit_date AND T1.status_call = '1' AND T1.code_dept_id IN (${allDeptPlaceholders}) ORDER BY T2.priority_rate DESC, T1.time_call ASC`
        : null;
    const skipQuery =
      allDepartments.length > 0
        ? `SELECT * FROM monitor_visit_info WHERE visit_date = @visit_date AND status = N'ข้าม' AND code_dept_id IN (${allDeptPlaceholders})`
        : null;

    const promises = [
      waitQueryLeft
        ? createRequest("left").query(waitQueryLeft)
        : Promise.resolve({ recordset: [] }),
      waitQueryRight
        ? createRequest("right").query(waitQueryRight)
        : Promise.resolve({ recordset: [] }),
      activeQueryLeft
        ? createRequest("left").query(activeQueryLeft)
        : Promise.resolve({ recordset: [] }),
      activeQueryRight
        ? createRequest("right").query(activeQueryRight)
        : Promise.resolve({ recordset: [] }),
      callQuery
        ? createRequest("all").query(callQuery)
        : Promise.resolve({ recordset: [] }),
      skipQuery
        ? createRequest("all").query(skipQuery)
        : Promise.resolve({ recordset: [] }),
    ];

    const [
      waitResultLeft,
      waitResultRight,
      activeResultLeft,
      activeResultRight,
      callResult,
      skipResult,
    ] = await Promise.all(promises);

    const callData = callResult.recordset[0] || null;

    info(`[DUO] ผลลัพธ์จาก DB - waitLeft: ${waitResultLeft.recordset.length}, waitRight: ${waitResultRight.recordset.length}, activeLeft: ${activeResultLeft.recordset.length}, activeRight: ${activeResultRight.recordset.length}, call: ${callData ? 'มี' : 'ไม่มี'}, skip: ${skipResult.recordset.length}`);

    if (callData) {
      const deptId = String(callData.code_dept_id);
      if (departmentsLeft.includes(deptId)) {
        callData.side = "left";
        info(`[DUO] Call data อยู่ฝั่ง left (dept: ${deptId})`);
      } else if (departmentsRight.includes(deptId)) {
        callData.side = "right";
        info(`[DUO] Call data อยู่ฝั่ง right (dept: ${deptId})`);
      }
    }

    // Parse station_l and station_r from settings
    const stationArrayLeft = settings && settings.station_l 
      ? settings.station_l.split(',').map(s => s.trim()).filter(s => s)
      : [];
    const stationArrayRight = settings && settings.station_r 
      ? settings.station_r.split(',').map(s => s.trim()).filter(s => s)
      : [];

    // Add station_index to waitLeft patients only (use station_l)
    if (waitResultLeft.recordset) {
      waitResultLeft.recordset.forEach(patient => {
        patient.station_index = findStationIndex(patient.station, stationArrayLeft);
      });
    }

    // Add station_index to waitRight patients only (use station_r)
    if (waitResultRight.recordset) {
      waitResultRight.recordset.forEach(patient => {
        patient.station_index = findStationIndex(patient.station, stationArrayRight);
      });
    }

    if (callData && settings) {
      try {
        const apiEndpoint = "https://voice.aztecthstudio.com/visit-queue-files";
        
        info(`[DUO] 🎤 กำลังส่งข้อมูลไปยัง voice.aztecthstudio.com สำหรับ visit_q_no: ${callData.visit_q_no}, side: ${callData.side || 'unknown'}`);
        
        let nameToSend = callData.name;
        let surnameToSend = callData.surname;

        if (settings.voice === '1') { // 1: คิว
          nameToSend = '';
          surnameToSend = '';
          info(`[DUO] Voice mode: 1 (คิวเท่านั้น)`);
        } else if (settings.voice === '2') { // 2: คิว ชื่อ
          surnameToSend = '';
          info(`[DUO] Voice mode: 2 (คิว + ชื่อ)`);
        } else {
          info(`[DUO] Voice mode: 3 (คิว + ชื่อ + นามสกุล)`);
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
          pname: pnameValue,
        };

        info(`[DUO] 📤 Payload ที่ส่งไป voice API:`, payload);

        const apiResponse = await fetch(apiEndpoint, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });

        info(`[DUO] 📥 Response status จาก voice API: ${apiResponse.status} ${apiResponse.statusText}`);

        if (apiResponse.ok) {
          const apiResponseData = await apiResponse.json();
          info(`[DUO] ✅ Response จาก voice API:`, apiResponseData);
          // Extract the 'merged_file' and add it as 'voice' array
          callData.voice = apiResponseData.merged_file ? [apiResponseData.merged_file] : [];
          info(`[DUO] 🎵 Voice file ที่ได้: ${callData.voice.length > 0 ? callData.voice[0] : 'ไม่มี'}`);
        } else {
          const errorText = await apiResponse.text();
          error(`[DUO] ❌ API call failed - status: ${apiResponse.status}, response: ${errorText}`);
          callData.voice = [];
        }
      } catch (apiError) {
        error(`[DUO] ❌ Error calling voice API:`, apiError);
        callData.voice = [];
      }
    } else {
      if (!callData) {
        debug(`[DUO] ไม่มี callData สำหรับส่งไป voice API`);
      }
      if (!settings) {
        warn(`[DUO] ไม่มี settings สำหรับส่งไป voice API`);
      }
    }

    const responseData = {
      waitLeft: waitResultLeft.recordset,
      waitRight: waitResultRight.recordset,
      activeLeft: activeResultLeft.recordset,
      activeRight: activeResultRight.recordset,
      call: callData,
      skip: skipResult.recordset,
    };

    // เปรียบเทียบกับ response ก่อนหน้า
    const responseString = JSON.stringify(responseData);
    const previousResponse = client.previousResponseData;
    
    if (previousResponse === responseString) {
      // ข้อมูลเหมือนเดิม ไม่ต้อง log
      debug(`[DUO] ข้อมูลเหมือนเดิม ไม่ log`);
    } else {
      // ข้อมูลเปลี่ยน log และอัปเดต previous response
      info(`[DUO] ✅ ส่งข้อมูลกลับไปยัง client สำเร็จ - waitLeft: ${responseData.waitLeft.length}, waitRight: ${responseData.waitRight.length}, activeLeft: ${responseData.activeLeft.length}, activeRight: ${responseData.activeRight.length}, call: ${responseData.call ? 'มี' : 'ไม่มี'}`);
      client.previousResponseData = responseString;
    }
    
    client.send(JSON.stringify(responseData));
  } catch (err) {
    error(`[DUO] ❌ Failed to fetch Duo data for setting_id ${client.setting_id}:`, err);
    client.send(JSON.stringify({ error: "Failed to fetch Duo data" }));
  }
}

export default fetchDuoData;
