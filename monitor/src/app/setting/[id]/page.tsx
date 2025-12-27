'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Settings, CheckCircle, ArrowRight, Volume2, Venus, Mars, XCircle, Upload, X, Plus } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectSeparator } from '@/components/ui/select';
import { playGoogleTTS, THAI_VOICES } from '../../../lib/google-tts';
import DepartmentSelectPopup from '@/components/DepartmentSelectPopup';

interface PayloadData {
  type: string;
  typeMonitor: string;
  n_hospital: string;
  n_department: string;
  head_left: string;
  head_right: string;
  urgent_setup: string;
  time_wait: number;
  amount_left: number;
  amount_right: number;
  arr_l: boolean;
  arr_r: boolean;
  set_descrip: boolean;
  set_notice: boolean;
  stem_surname: string;
  stem_surname_table: string;
  stem_name: string;
  stem_name_table: string;
  stem_surname_popup: string;
  type_popup: string;
  urgent_color: boolean;
  status_patient: boolean;
  status_check: boolean;
  lock_position: boolean;
  lock_position_right: boolean;
  urgent_level: boolean;
  a_sound: boolean;
  b_sound: boolean;
  c_sound: boolean;
  time_col: boolean;
  station_left: string;
  station_right: string;
  query_left: string;
  query_right: string;
  listPage: string;
  style_voice: 'female' | 'male';
  voice: string;
  font: string;
  list_urgent: string;
  enable_ads: boolean;
  ads_path_left: string;
  ads_path_right: string;
  ads_type: 'split' | 'right' | 'left';
  color_static: string;
  color_dynamic: string;
}

export default function EditSettingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showUploadSuccessPopup, setShowUploadSuccessPopup] = useState(false);
  const [showUploadErrorPopup, setShowUploadErrorPopup] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string>('');
  
  // State สำหรับเก็บชื่อห้องแต่ละห้อง
  const [leftRooms, setLeftRooms] = useState<string[]>(['', '']);
  const [rightRooms, setRightRooms] = useState<string[]>(['', '']);
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false);
  
  
  // State สำหรับเก็บข้อมูล urgent levels
  const [urgentLevels, setUrgentLevels] = useState<Array<{ID: number; Urgent_level: string; Color: string}>>([]);
  
  // State สำหรับอัพโหลดไฟล์
  const [uploading, setUploading] = useState(false);
  const [adsSide, setAdsSide] = useState<'left' | 'right' | 'separate'>('separate');
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // State สำหรับ gradient editor
  const [gradientStartColor, setGradientStartColor] = useState('#28C7E7');
  const [gradientEndColor, setGradientEndColor] = useState('#001B7A');
  const [gradientAngle, setGradientAngle] = useState(153);
  
  // State สำหรับ Department Multi-select
  const [showDepartmentPopup, setShowDepartmentPopup] = useState(false);
  const [showLeftDepartmentPopup, setShowLeftDepartmentPopup] = useState(false);
  const [showRightDepartmentPopup, setShowRightDepartmentPopup] = useState(false);
  const [selectedDepartmentCodes, setSelectedDepartmentCodes] = useState<string[]>([]);
  const [selectedLeftDepartmentCodes, setSelectedLeftDepartmentCodes] = useState<string[]>([]);
  const [selectedRightDepartmentCodes, setSelectedRightDepartmentCodes] = useState<string[]>([]);
  const [leftDepartmentNames, setLeftDepartmentNames] = useState<Array<{ code: string; name: string }>>([]);
  const [rightDepartmentNames, setRightDepartmentNames] = useState<Array<{ code: string; name: string }>>([]);
  const [allDepartments, setAllDepartments] = useState<Array<{ code: string; name: string }>>([]);
  
  // State สำหรับ Stations
  const [leftStations, setLeftStations] = useState<Array<{ station_name: string; department_code: string }>>([]);
  const [rightStations, setRightStations] = useState<Array<{ station_name: string; department_code: string }>>([]);
  const [selectedLeftStations, setSelectedLeftStations] = useState<string[]>([]);
  const [selectedRightStations, setSelectedRightStations] = useState<string[]>([]);
  
  const defaultHospitalName = process.env.NEXT_PUBLIC_HOSPITAL_NAME || 'โรงพยาบาล';
  
  const [payload, setPayload] = useState<PayloadData>({
    type: 'single',
    typeMonitor: '',
    n_hospital: defaultHospitalName,
    n_department: 'ตรวจโรคทั่วไป',
    head_left: 'จุดซักประวัติ',
    head_right: 'ห้องตรวจ',
    urgent_setup: 'ฉุกเฉิน',
    time_wait: 300,
    amount_left: 2,
    amount_right: 2,
    arr_l: false,
    arr_r: false,
    set_descrip: false,
    set_notice: false,
    stem_surname: 'name',
    stem_surname_table: 'name',
    stem_name: 'name',
    stem_name_table: 'name',
    stem_surname_popup: 'false',
    type_popup: '1',
    urgent_color: false,
    status_patient: false,
    status_check: false,
    lock_position: false,
    lock_position_right: false,
    urgent_level: false,
    a_sound: true,
    b_sound: false,
    c_sound: false,
    time_col: false,
    station_left: '',
    station_right: '',
    query_left: '2',
    query_right: '2',
    listPage: '',
    style_voice: 'female',
    voice: '1',
    font: 'lineseed',
    list_urgent: '',
    enable_ads: false,
    ads_path_left: '',
    ads_path_right: '',
    ads_type: 'split',
    color_static: '',
    color_dynamic: '',
  });

  const normalizeStyleVoice = useCallback((value: string | null | undefined): 'male' | 'female' => {
    if (!value) return 'female';
    const trimmed = value.toString().trim();
    
    // รองรับค่า 1 (male) และ 2 (female) จากฐานข้อมูล
    if (trimmed === '1') return 'male';
    if (trimmed === '2') return 'female';
    
    const normalized = trimmed.toLowerCase();
    const compact = normalized.replace(/[\s_-]/g, '');

    if (trimmed.startsWith('th-')) {
      return compact.includes('standardb') || compact.includes('neural2b') || compact.includes('male')
        ? 'male'
        : 'female';
    }

    if (compact.includes('male') || compact.includes('standardb') || compact.includes('neural2b')) {
      return 'male';
    }

    return 'female';
  }, []);

  const getVoiceCandidates = useCallback(
    (value: string | null | undefined): string[] => {
      const maleCandidates = [
        THAI_VOICES.STANDARD_A,
        THAI_VOICES.STANDARD_C,
        THAI_VOICES.STANDARD_B,
      ].filter(Boolean);

      const femaleCandidates = [
        THAI_VOICES.NEURAL2_C,
        THAI_VOICES.STANDARD_B,
        THAI_VOICES.STANDARD_D,
        THAI_VOICES.STANDARD_A,
      ].filter(Boolean);

      const normalized = normalizeStyleVoice(value);
      const base = normalized === 'male' ? maleCandidates : femaleCandidates;

      const raw = value?.toString().trim() ?? '';
      if (raw.startsWith('th-')) {
        return [raw, ...base.filter((voice) => voice !== raw)];
      }
      return base;
    },
    [normalizeStyleVoice]
  );


  // Fetch urgent levels
  useEffect(() => {
    const fetchUrgentLevels = async () => {
      try {
        const response = await fetch('/api/urgent-level');
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setUrgentLevels(result.data);
        }
      } catch (error) {
        console.error('Error fetching urgent levels:', error);
      }
    };
    
    fetchUrgentLevels();
  }, []);

  // Fetch setting data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsFetching(true);
        const response = await fetch(`/api/setting/${resolvedParams.id}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          const data = result.data;
          
          // ตรวจสอบว่าเป็น swap type - ถ้าเป็นให้ redirect กลับไปหน้า setting
          if (data.type === 'swap') {
            router.push('/setting');
            return;
          }
          
          // แปลง station_left และ station_right จาก comma-separated string เป็น array
          const stationLeftString = data.station_l || '';
          const stationRightString = data.station_r || '';
          
          let leftRoomsArray = stationLeftString ? stationLeftString.split(',').map((s: string) => s.trim()) : [];
          let rightRoomsArray = stationRightString ? stationRightString.split(',').map((s: string) => s.trim()) : [];
          
          const amountLeft = data.amount_boxL || 2;
          const amountRight = data.amount_boxR || 2;
          
          // ตัด array ให้เหลือแค่ amountLeft และ amountRight elements
          if (leftRoomsArray.length > amountLeft) {
            leftRoomsArray = leftRoomsArray.slice(0, amountLeft);
          }
          if (rightRoomsArray.length > amountRight) {
            rightRoomsArray = rightRoomsArray.slice(0, amountRight);
          }
          
          // ถ้า array สั้นกว่า amount ให้เพิ่มช่องว่าง
          while (leftRoomsArray.length < amountLeft) {
            leftRoomsArray.push('');
          }
          while (rightRoomsArray.length < amountRight) {
            rightRoomsArray.push('');
          }
          
          setLeftRooms(leftRoomsArray);
          setRightRooms(rightRoomsArray);
          
          // Initialize department codes จาก query_left และ query_right
          const queryLeftCodes = (data.department_load || '2').toString().split(',').filter((c: string) => c.trim() !== '');
          const queryRightCodes = (data.department_room_load || '2').toString().split(',').filter((c: string) => c.trim() !== '');
          
          // Initialize selected stations
          if (stationLeftString) {
            const splitLeft = stationLeftString.split(',');
            const filteredLeft = splitLeft.filter((s: string) => s.trim() !== '');
            setSelectedLeftStations(filteredLeft);
          }
          if (stationRightString) {
            const splitRight = stationRightString.split(',');
            const filteredRight = splitRight.filter((s: string) => s.trim() !== '');
            setSelectedRightStations(filteredRight);
          }
          
          // Fetch all departments ก่อนเพื่อใช้ map codes เป็น names
          let departmentsData: Array<{ code: string; name: string }> = [];
          try {
            const deptResponse = await fetch('/api/department');
            const deptResult = await deptResponse.json();
            if (deptResult.success && deptResult.data) {
              departmentsData = deptResult.data;
              setAllDepartments(departmentsData);
            }
          } catch (error) {
            console.error('Error fetching departments in fetchData:', error);
          }
          
          if (data.type === 'duo') {
            setSelectedLeftDepartmentCodes(queryLeftCodes);
            setSelectedRightDepartmentCodes(queryRightCodes);
            
            // Set department names สำหรับ duo left
            if (queryLeftCodes.length > 0 && departmentsData.length > 0) {
              const selectedLeftDepts = departmentsData.filter(dept => 
                queryLeftCodes.includes(String(dept.code))
              );
              setLeftDepartmentNames(selectedLeftDepts);
            }
            
            // Set department names สำหรับ duo right
            if (queryRightCodes.length > 0 && departmentsData.length > 0) {
              const selectedRightDepts = departmentsData.filter(dept => 
                queryRightCodes.includes(String(dept.code))
              );
              setRightDepartmentNames(selectedRightDepts);
            }
            
            // Fetch stations for duo
            if (queryLeftCodes.length > 0) {
              const fetchLeftStations = async () => {
                await fetchStationsFromMultipleDepts(queryLeftCodes, 'left');
              };
              fetchLeftStations();
            }
            if (queryRightCodes.length > 0) {
              const fetchRightStations = async () => {
                await fetchStationsFromMultipleDepts(queryRightCodes, 'right');
              };
              fetchRightStations();
            }
          } else {
            setSelectedDepartmentCodes(queryLeftCodes);
            
            // Set department names สำหรับ single/swap/ER
            if (queryLeftCodes.length > 0 && departmentsData.length > 0) {
              const selectedDepts = departmentsData.filter(dept => 
                queryLeftCodes.includes(String(dept.code))
              );
              setLeftDepartmentNames(selectedDepts);
            }
            
            // Fetch stations for single/swap/ER
            if (queryLeftCodes.length > 0) {
              const fetchStations = async () => {
                await fetchStationsFromMultipleDepts(queryLeftCodes, 'left');
              };
              fetchStations();
            }
          }
          
          setPayload({
            type: data.type || 'single',
            typeMonitor: resolvedParams.id,
            n_hospital: data.n_hospital || '',
            n_department: data.department || '',
            head_left: data.n_table || '',
            head_right: data.n_room || '',
            urgent_setup: data.urgent_setup || 'ฉุกเฉิน',
            time_wait: data.time_wait ? (typeof data.time_wait === 'string' ? parseInt(data.time_wait) : data.time_wait) : (data.type === 'er' ? 20 : 300),
            amount_left: amountLeft,
            amount_right: amountRight,
            arr_l: data.table_arr === 'true',
            arr_r: data.table_arr2 === 'true',
            set_descrip: data.set_descrip === 'true',
            set_notice: data.set_notice === 'true',
            stem_surname: data.stem_surname || 'name',
            stem_surname_table: data.stem_surname_table || 'name',
            stem_name: data.stem_name || 'name',
            stem_name_table: data.stem_name_table || 'name',
            stem_surname_popup: data.stem_surname_popup || data.stem_popup || 'false',
            type_popup: (data.type_popup ?? '1').toString(),
            urgent_color: data.urgent_color === 'true',
            status_patient: data.status_patient === 'true',
            status_check: data.status_check === 'true',
            lock_position: data.lock_position === 'true',
            lock_position_right: data.lock_position_right === 'true',
            urgent_level: data.urgent_level === 'true',
            a_sound: data.a_sound === 'true',
            b_sound: data.b_sound === 'true',
            c_sound: data.c_sound === 'true',
            time_col: data.time_col === 'true',
            station_left: data.station_l || '',
            station_right: data.station_r || '',
            query_left: data.department_load || '2',
            query_right: data.department_room_load || '2',
            listPage: data.listPage || '',
            style_voice: normalizeStyleVoice(data.style_voice),
            voice: data.voice || '1',
            font: data.font || 'lineseed',
            list_urgent: data.list_urgent || '',
            enable_ads: data.ads ? data.ads !== '' && data.ads !== 'false' : false,
            ads_type: (() => {
              // ถ้ามี ads_type จาก database ให้ใช้เลย
              if (data.ads_type && (data.ads_type === 'split' || data.ads_type === 'right' || data.ads_type === 'left')) {
                return data.ads_type;
              }
              // ถ้าไม่มี ads_type ให้ตรวจสอบจาก path (backward compatibility)
              if (data.ads && data.ads !== '' && data.ads !== 'false') {
                const adsPath = typeof data.ads === 'string' ? data.ads : '';
                // ตรวจสอบจาก path ว่าเป็น left, right หรือ split
                // หมายเหตุ: path ที่มี /left_ คือ ads_type = 'right' (ฝั่งซ้าย)
                // path ที่มี /right_ คือ ads_type = 'left' (ฝั่งขวา)
                if (adsPath.includes('/left_')) return 'right';
                if (adsPath.includes('/right_')) return 'left';
                if (adsPath.includes('/separate_') || adsPath.includes('/split_')) return 'split';
                // ถ้าไม่มี prefix ให้เป็น split
                return 'split';
              }
              return 'split';
            })(),
            ads_path_left: data.ads_path_left || '',
            ads_path_right: data.ads_path_right || '',
            color_static: data.color_static || '',
            color_dynamic: data.color_dynamic || '',
          });
          
          // Parse color_dynamic gradient
          if (data.color_dynamic) {
            const gradientMatch = data.color_dynamic.match(/linear-gradient\((\d+)deg,\s*rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)\s*(\d+)%,\s*rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)\s*(\d+)%\)/);
            if (gradientMatch) {
              setGradientAngle(parseInt(gradientMatch[1]));
              // แปลง rgba เป็น hex
              const r1 = parseInt(gradientMatch[2]);
              const g1 = parseInt(gradientMatch[3]);
              const b1 = parseInt(gradientMatch[4]);
              const r2 = parseInt(gradientMatch[7]);
              const g2 = parseInt(gradientMatch[8]);
              const b2 = parseInt(gradientMatch[9]);
              setGradientStartColor(`#${[r1, g1, b1].map(x => x.toString(16).padStart(2, '0')).join('')}`);
              setGradientEndColor(`#${[r2, g2, b2].map(x => x.toString(16).padStart(2, '0')).join('')}`);
            } else {
              // ถ้าไม่มี gradient ให้สร้าง default gradient
              const defaultGradient = `linear-gradient(153deg, rgba(40, 199, 231, 1) 0%, rgba(0, 27, 122, 1) 100%)`;
              setPayload(prev => ({ ...prev, color_dynamic: defaultGradient }));
            }
          } else {
            // ถ้าไม่มี color_dynamic ให้สร้าง default gradient
            const defaultGradient = `linear-gradient(153deg, rgba(40, 199, 231, 1) 0%, rgba(0, 27, 122, 1) 100%)`;
            setPayload(prev => ({ ...prev, color_dynamic: defaultGradient }));
          }
          
          // Sync adsSide กับ ads_type ที่โหลดมา
          const loadedAdsType = (() => {
            if (data.ads_type && (data.ads_type === 'split' || data.ads_type === 'right' || data.ads_type === 'left')) {
              return data.ads_type;
            }
            if (data.ads && data.ads !== '' && data.ads !== 'false') {
              const adsPath = typeof data.ads === 'string' ? data.ads : '';
              if (adsPath.includes('/left_')) return 'right';
              if (adsPath.includes('/right_')) return 'left';
              if (adsPath.includes('/separate_') || adsPath.includes('/split_')) return 'split';
              return 'split';
            }
            return 'split';
          })();
          
          // แปลง ads_type เป็น adsSide
          let newAdsSide: 'left' | 'right' | 'separate' = 'separate';
          if (loadedAdsType === 'split') {
            newAdsSide = 'separate';
          } else if (loadedAdsType === 'left') {
            newAdsSide = 'left';
          } else if (loadedAdsType === 'right') {
            newAdsSide = 'right';
          }
          setAdsSide(newAdsSide);

          // Set previewImage จาก ads_path_left หรือ ads_path_right ตาม adsSide
          const adsPathLeft = data.ads_path_left || '';
          const adsPathRight = data.ads_path_right || '';
          
          if (newAdsSide === 'left' && adsPathLeft) {
            setPreviewImage(adsPathLeft);
          } else if (newAdsSide === 'right' && adsPathRight) {
            setPreviewImage(adsPathRight);
          } else if (newAdsSide === 'separate' && adsPathLeft) {
            setPreviewImage(adsPathLeft);
          } else {
            setPreviewImage(null);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        const errorMsg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
        setErrorMessage(errorMsg);
        setShowErrorPopup(true);
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [resolvedParams.id, normalizeStyleVoice]);

  // โหลดข้อมูลแผนกทั้งหมด
  useEffect(() => {
    const fetchAllDepartments = async () => {
      try {
        const response = await fetch('/api/department');
        const data = await response.json();
        if (data.success && data.data) {
          setAllDepartments(data.data);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };
    fetchAllDepartments();
  }, []);

  // อัพเดต department names เมื่อ allDepartments มีข้อมูลและมี selected codes
  useEffect(() => {
    if (allDepartments.length > 0) {
      // สำหรับ single, swap, ER
      if (payload.type !== 'duo' && selectedDepartmentCodes.length > 0) {
        const selectedDepts = allDepartments.filter(dept => 
          selectedDepartmentCodes.includes(String(dept.code))
        );
        // ตรวจสอบว่ามีการเปลี่ยนแปลงหรือไม่
        const currentCodes = leftDepartmentNames.map(d => String(d.code)).sort().join(',');
        const newCodes = selectedDepts.map(d => String(d.code)).sort().join(',');
        if (currentCodes !== newCodes) {
          setLeftDepartmentNames(selectedDepts);
        }
      }
      // สำหรับ duo left
      if (payload.type === 'duo' && selectedLeftDepartmentCodes.length > 0) {
        const selectedDepts = allDepartments.filter(dept => 
          selectedLeftDepartmentCodes.includes(String(dept.code))
        );
        // ตรวจสอบว่ามีการเปลี่ยนแปลงหรือไม่
        const currentCodes = leftDepartmentNames.map(d => String(d.code)).sort().join(',');
        const newCodes = selectedDepts.map(d => String(d.code)).sort().join(',');
        if (currentCodes !== newCodes) {
          setLeftDepartmentNames(selectedDepts);
        }
      }
      // สำหรับ duo right
      if (payload.type === 'duo' && selectedRightDepartmentCodes.length > 0) {
        const selectedDepts = allDepartments.filter(dept => 
          selectedRightDepartmentCodes.includes(String(dept.code))
        );
        // ตรวจสอบว่ามีการเปลี่ยนแปลงหรือไม่
        const currentCodes = rightDepartmentNames.map(d => String(d.code)).sort().join(',');
        const newCodes = selectedDepts.map(d => String(d.code)).sort().join(',');
        if (currentCodes !== newCodes) {
          setRightDepartmentNames(selectedDepts);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDepartments, selectedDepartmentCodes, selectedLeftDepartmentCodes, selectedRightDepartmentCodes, payload.type]);

  // Sync selectedDepartmentCodes กับ payload.query_left (สำหรับ single, swap, ER)
  // แต่ไม่ sync เมื่อ payload.query_left ตรงกับ selectedDepartmentCodes แล้ว (ป้องกัน overwrite ค่าที่โหลดมา)
  useEffect(() => {
    if (payload.type !== 'duo' && selectedDepartmentCodes.length > 0) {
      const currentQuery = payload.query_left || '';
      const newQuery = selectedDepartmentCodes.join(',');
      // sync เฉพาะเมื่อค่าไม่ตรงกัน (เพื่อป้องกัน overwrite ค่าที่โหลดมาจากฐานข้อมูล)
      if (currentQuery !== newQuery) {
        setPayload(prev => ({
          ...prev,
          query_left: newQuery
        }));
      }
    } else if (payload.type !== 'duo' && selectedDepartmentCodes.length === 0) {
      // sync เฉพาะเมื่อมีค่าใน payload แต่ไม่มีใน selectedDepartmentCodes
      if (payload.query_left) {
        setPayload(prev => ({
          ...prev,
          query_left: ''
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDepartmentCodes, payload.type]);

  // Sync selectedLeftDepartmentCodes กับ payload.query_left สำหรับ duo
  useEffect(() => {
    if (payload.type === 'duo' && selectedLeftDepartmentCodes.length > 0) {
      const currentQuery = payload.query_left || '';
      const newQuery = selectedLeftDepartmentCodes.join(',');
      // sync เฉพาะเมื่อค่าไม่ตรงกัน
      if (currentQuery !== newQuery) {
        setPayload(prev => ({
          ...prev,
          query_left: newQuery
        }));
      }
    } else if (payload.type === 'duo' && selectedLeftDepartmentCodes.length === 0) {
      // sync เฉพาะเมื่อมีค่าใน payload แต่ไม่มีใน selectedLeftDepartmentCodes
      if (payload.query_left) {
        setPayload(prev => ({
          ...prev,
          query_left: ''
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeftDepartmentCodes, payload.type]);

  // Sync selectedRightDepartmentCodes กับ payload.query_right สำหรับ duo
  useEffect(() => {
    if (payload.type === 'duo' && selectedRightDepartmentCodes.length > 0) {
      const currentQuery = payload.query_right || '';
      const newQuery = selectedRightDepartmentCodes.join(',');
      // sync เฉพาะเมื่อค่าไม่ตรงกัน
      if (currentQuery !== newQuery) {
        setPayload(prev => ({
          ...prev,
          query_right: newQuery
        }));
      }
    } else if (payload.type === 'duo' && selectedRightDepartmentCodes.length === 0) {
      // sync เฉพาะเมื่อมีค่าใน payload แต่ไม่มีใน selectedRightDepartmentCodes
      if (payload.query_right) {
        setPayload(prev => ({
          ...prev,
          query_right: ''
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRightDepartmentCodes, payload.type]);

  // เมื่อเลือกแผนกแล้ว ให้ดึง station และตั้งค่า Department ID (ทุก type ยกเว้น duo)
  useEffect(() => {
    if (payload.type !== 'duo' && selectedDepartmentCodes.length > 0) {
      fetchStationsFromMultipleDepts(selectedDepartmentCodes, 'left');
      // Reset selected stations เมื่อเปลี่ยนแผนก (useEffect ที่ watch selectedLeftStations จะอัพเดต station_left อัตโนมัติ)
      setSelectedLeftStations([]);
    } else if (payload.type !== 'duo' && selectedDepartmentCodes.length === 0) {
      setLeftStations([]);
      setSelectedLeftStations([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDepartmentCodes, payload.type]);

  // สำหรับ duo: เมื่อเลือกแผนกฝั่งซ้าย
  useEffect(() => {
    if (payload.type === 'duo' && selectedLeftDepartmentCodes.length > 0) {
      fetchStationsFromMultipleDepts(selectedLeftDepartmentCodes, 'left');
      setSelectedLeftStations([]);
    } else if (payload.type === 'duo' && selectedLeftDepartmentCodes.length === 0) {
      setLeftStations([]);
      setSelectedLeftStations([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeftDepartmentCodes, payload.type]);

  // สำหรับ duo: เมื่อเลือกแผนกฝั่งขวา
  useEffect(() => {
    if (payload.type === 'duo' && selectedRightDepartmentCodes.length > 0) {
      fetchStationsFromMultipleDepts(selectedRightDepartmentCodes, 'right');
      setSelectedRightStations([]);
    } else if (payload.type === 'duo' && selectedRightDepartmentCodes.length === 0) {
      setRightStations([]);
      setSelectedRightStations([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRightDepartmentCodes, payload.type]);

  // อัปเดต station_left เมื่อเลือก checkbox
  useEffect(() => {
    const filteredStations = selectedLeftStations.filter(s => s && s.trim() !== '');
    const stationValue = filteredStations.length > 0 ? filteredStations.join(',') : '';
    setPayload(prev => ({
      ...prev, 
      station_left: stationValue,
      amount_left: filteredStations.length
    }));
    // Sync leftRooms กับ selectedLeftStations
    setLeftRooms(filteredStations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeftStations]);

  // อัปเดต station_right เมื่อเลือก checkbox
  useEffect(() => {
    const filteredStations = selectedRightStations.filter(s => s && s.trim() !== '');
    const stationValue = filteredStations.length > 0 ? filteredStations.join(',') : '';
    setPayload(prev => ({
      ...prev, 
      station_right: stationValue,
      amount_right: filteredStations.length
    }));
    // Sync rightRooms กับ selectedRightStations
    setRightRooms(filteredStations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRightStations]);

  // ฟังก์ชันสำหรับดึง station จากหลายแผนกและเรียงต่อกัน
  const fetchStationsFromMultipleDepts = async (departmentCodes: string[], side: 'left' | 'right'): Promise<void> => {
    try {
      const allStations: Array<{ station_name: string; department_code: string }> = [];
      
      // ดึง station จากทุกแผนก
      const promises = departmentCodes.map(async (code) => {
        try {
          const response = await fetch(`/api/station?department_code=${encodeURIComponent(code)}`);
          const data = await response.json();
          if (data.success && data.data) {
            // เพิ่ม department_code เข้าไปในแต่ละ station
            return data.data.map((station: { station_name: string }) => ({
              ...station,
              department_code: code
            }));
          }
          return [];
        } catch (error) {
          console.error(`Error fetching stations for department ${code}:`, error);
          return [];
        }
      });

      const results = await Promise.all(promises);
      
      // รวม station ทั้งหมดและเรียงต่อกัน (จัดกลุ่มตามแผนก)
      results.forEach(stations => {
        allStations.push(...stations);
      });

      // ตั้งค่า stations
      if (side === 'left') {
        setLeftStations(allStations);
      } else {
        setRightStations(allStations);
      }
    } catch (error) {
      console.error('Error fetching stations from multiple departments:', error);
      if (side === 'left') {
        setLeftStations([]);
      } else {
        setRightStations([]);
      }
    }
  };

  // Handlers สำหรับ toggle stations
  const handleLeftStationToggle = (stationName: string) => {
    setSelectedLeftStations(prev => {
      if (prev.includes(stationName)) {
        return prev.filter(s => s !== stationName);
      } else {
        return [...prev, stationName];
      }
    });
  };

  const handleRightStationToggle = (stationName: string) => {
    setSelectedRightStations(prev => {
      if (prev.includes(stationName)) {
        return prev.filter(s => s !== stationName);
      } else {
        return [...prev, stationName];
      }
    });
  };

  // ฟังก์ชันสำหรับจัดการเมื่อ amount เปลี่ยน
  const handleAmountLeftChange = (newAmount: number) => {
    const amount = Math.max(0, newAmount); // ป้องกันค่าติดลบ
    setPayload(prev => ({ ...prev, amount_left: amount }));
    
    // ปรับขนาด array ของ leftRooms ตาม amount ใหม่
    setLeftRooms(prevRooms => {
      const newRooms = [...prevRooms];
      if (amount > prevRooms.length) {
        // เพิ่มช่องว่างถ้า amount มากกว่าเดิม
        for (let i = prevRooms.length; i < amount; i++) {
          newRooms.push('');
        }
      } else {
        // ตัดส่วนเกินถ้า amount น้อยกว่าเดิม
        return newRooms.slice(0, amount);
      }
      return newRooms;
    });
  };

  const handleAmountRightChange = (newAmount: number) => {
    const amount = Math.max(0, newAmount); // ป้องกันค่าติดลบ
    setPayload(prev => ({ ...prev, amount_right: amount }));
    
    // ปรับขนาด array ของ rightRooms ตาม amount ใหม่
    setRightRooms(prevRooms => {
      const newRooms = [...prevRooms];
      if (amount > prevRooms.length) {
        // เพิ่มช่องว่างถ้า amount มากกว่าเดิม
        for (let i = prevRooms.length; i < amount; i++) {
          newRooms.push('');
        }
      } else {
        // ตัดส่วนเกินถ้า amount น้อยกว่าเดิม
        return newRooms.slice(0, amount);
      }
      return newRooms;
    });
  };

  // ฟังก์ชันสำหรับอัปเดตชื่อห้องแต่ละห้อง
  const handleLeftRoomChange = (index: number, value: string) => {
    setLeftRooms(prevRooms => {
      const newRooms = [...prevRooms];
      newRooms[index] = value;
      return newRooms;
    });
  };

  const handleRightRoomChange = (index: number, value: string) => {
    setRightRooms(prevRooms => {
      const newRooms = [...prevRooms];
      newRooms[index] = value;
      return newRooms;
    });
  };

  // ฟังก์ชันสำหรับอัพโหลดไฟล์โฆษณา
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    try {
      setUploading(true);

      // สร้าง preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('side', adsSide);
      formData.append('typeMonitor', payload.typeMonitor);

      const response = await fetch('/api/ads/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // อัพเดท path ใน payload ตาม side ที่เลือก
        if (adsSide === 'left') {
          setPayload(prev => ({ ...prev, ads_path_left: result.path }));
        } else if (adsSide === 'right') {
          setPayload(prev => ({ ...prev, ads_path_right: result.path }));
        } else {
          // สำหรับ separate ใช้ path เดียวใน ads_path_left
          setPayload(prev => ({ 
            ...prev, 
            ads_path_left: result.path,
            ads_path_right: ''
          }));
        }
        setUploadMessage('อัพโหลดไฟล์สำเร็จ');
        setShowUploadSuccessPopup(true);
        setTimeout(() => {
          setShowUploadSuccessPopup(false);
        }, 3000);
      } else {
        setUploadMessage(`อัพโหลดไฟล์ไม่สำเร็จ: ${result.error || 'Unknown error'}`);
        setShowUploadErrorPopup(true);
        setPreviewImage(null);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadMessage('เกิดข้อผิดพลาดในการอัพโหลดไฟล์');
      setShowUploadErrorPopup(true);
      setPreviewImage(null);
    } finally {
      setUploading(false);
    }
  }, [adsSide, payload.typeMonitor]);

  // ฟังก์ชันสำหรับจัดการ drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleFileUpload(file);
      } else {
        setUploadMessage('กรุณาอัพโหลดไฟล์รูปภาพเท่านั้น');
        setShowUploadErrorPopup(true);
      }
    }
  }, [adsSide, payload.typeMonitor]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        handleFileUpload(file);
      } else {
        setUploadMessage('กรุณาอัพโหลดไฟล์รูปภาพเท่านั้น');
        setShowUploadErrorPopup(true);
      }
    }
  }, [adsSide, payload.typeMonitor]);

  const handlePreviewVoice = async () => {
    if (isPreviewingVoice) return;
    try {
      setIsPreviewingVoice(true);
      const candidates = getVoiceCandidates(payload.style_voice);
      const primaryVoice = candidates[0];

      if (!primaryVoice) {
        alert('ไม่พบเสียงตัวอย่าง');
        setIsPreviewingVoice(false);
        return;
      }

      const success = await playGoogleTTS({
        text: payload.style_voice === 'male' ? 'ตัวอย่างเสียงผู้ชายครับ' : 'ตัวอย่างเสียงผู้หญิงค่ะ',
        language: 'th-TH',
        voice: primaryVoice,
        voiceCandidates: candidates,
        gender: payload.style_voice === 'male' ? 'MALE' : 'FEMALE',
        speed: payload.style_voice === 'male' ? 0.7 : 0.8,
        pitch: 1.0,
        minDurationSec: 0.3,
      });

      if (!success) {
        alert('ไม่สามารถเล่นเสียงตัวอย่างได้');
      }
    } catch (error) {
      console.error('Error previewing voice:', error);
      alert('ไม่สามารถเล่นเสียงตัวอย่างได้');
    } finally {
      setIsPreviewingVoice(false);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const [activeSection, setActiveSection] = useState<'basic' | 'table' | 'display' | 'ads' | 'hide'>('basic');
  useEffect(() => {
    const sectionIds: Array<'basic' | 'table' | 'display' | 'ads' | 'hide'> = ['basic', 'table', 'display', 'ads', 'hide'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id as 'basic' | 'table' | 'display' | 'ads' | 'hide';
            setActiveSection(id);
          }
        });
      },
      { threshold: 0.5 }
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ป้องกันการ submit ซ้ำ
    if (isLoading) {
      return;
    }
    setShowConfirmPopup(true);
  };

  // Handle confirm submit
  const handleConfirmSubmit = async () => {
    // ป้องกันการ submit ซ้ำ
    if (isLoading) {
      return;
    }

    setShowConfirmPopup(false);
    setIsLoading(true);
    
    try {
      // ใช้ station_left และ station_right จาก payload โดยตรง (เก็บจาก Station ที่เลือก)
      // กรองค่า ',' และ empty string ออก
      const stationLeft = (payload.station_left && payload.station_left.trim() !== ',' && payload.station_left.trim() !== '')
        ? payload.station_left.trim()
        : '';
      const stationRight = (payload.station_right && payload.station_right.trim() !== ',' && payload.station_right.trim() !== '')
        ? payload.station_right.trim()
        : '';
      
      // แปลง style_voice จาก 'male'/'female' เป็น '1'/'2' สำหรับบันทึกลงฐานข้อมูล
      const styleVoiceValue = payload.style_voice === 'male' ? '1' : '2';
      
      const submitPayload = {
        ...payload,
        n_hospital: defaultHospitalName, // ใช้ค่าจาก .env แทนค่าจาก payload
        station_left: stationLeft,
        station_right: stationRight,
        style_voice: styleVoiceValue
      };

      const response = await fetch('/api/setting/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitPayload),
      });

      // ตรวจสอบ response status ก่อนอ่าน JSON
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: `HTTP error! status: ${response.status}` };
        }
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setShowSuccessPopup(true);
        // Auto redirect after 2 seconds
        setTimeout(() => {
          setShowSuccessPopup(false);
        }, 2000);
      } else {
        setErrorMessage(result.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        setShowErrorPopup(true);
      }
    } catch (error) {
      console.error('Error submitting:', error);
      const errorMsg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      setErrorMessage(errorMsg);
      setShowErrorPopup(true);
    } finally {
      setIsLoading(false);
    }
  };


  if (isFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{ borderColor: '#043566', borderTopColor: 'transparent' }}></div>
          <p className="text-slate-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b" style={{ borderColor: '#e2e8f0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl shadow-md" style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}>
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: '#043566' }}>แก้ไขการตั้งค่า</h1>
                <p className="text-sm text-slate-600 mt-1">แก้ไขการตั้งค่าหน้าจอ ID: {resolvedParams.id}</p>
              </div>
            </div>
            <Link
              href="/setting"
              className="flex items-center space-x-2 px-5 py-2.5 bg-white hover:bg-slate-50 rounded-xl transition-all duration-200 border shadow-sm hover:shadow font-medium"
              style={{ color: '#043566', borderColor: '#e2e8f0' }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>กลับ</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
            {/* Basic Info Section */}
            <div className="px-6 py-5 border-b bg-gradient-to-r from-blue-50/60 to-transparent" style={{ borderColor: '#e2e8f0' }}>
              <h2 className="text-xl font-bold" style={{ color: '#043566' }}>ข้อมูลพื้นฐาน</h2>
            </div>
            <div className="sticky top-0 z-10 bg-white border-b shadow-sm" style={{ borderColor: '#e2e8f0' }}>
              <div className="px-6 py-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => scrollToSection('basic')}
                  className={`px-3 py-1.5 text-sm rounded-full border shadow-sm transition-colors ${
                    activeSection === 'basic'
                      ? 'text-white'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                  style={{
                    borderColor: activeSection === 'basic' ? '#043566' : '#e2e8f0',
                    background: activeSection === 'basic' ? 'linear-gradient(135deg, #043566, #065a9e)' : undefined,
                    color: activeSection === 'basic' ? '#fff' : '#043566',
                  }}
                >
                  ข้อมูลพื้นฐาน
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('table')}
                  className={`px-3 py-1.5 text-sm rounded-full border shadow-sm transition-colors ${
                    activeSection === 'table'
                      ? 'text-white'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                  style={{
                    borderColor: activeSection === 'table' ? '#043566' : '#e2e8f0',
                    background: activeSection === 'table' ? 'linear-gradient(135deg, #043566, #065a9e)' : undefined,
                    color: activeSection === 'table' ? '#fff' : '#043566',
                  }}
                >
                  ตาราง
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('display')}
                  className={`px-3 py-1.5 text-sm rounded-full border shadow-sm transition-colors ${
                    activeSection === 'display'
                      ? 'text-white'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                  style={{
                    borderColor: activeSection === 'display' ? '#043566' : '#e2e8f0',
                    background: activeSection === 'display' ? 'linear-gradient(135deg, #043566, #065a9e)' : undefined,
                    color: activeSection === 'display' ? '#fff' : '#043566',
                  }}
                >
                  แสดงผล
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('ads')}
                  className={`px-3 py-1.5 text-sm rounded-full border shadow-sm transition-colors ${
                    activeSection === 'ads'
                      ? 'text-white'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                  style={{
                    borderColor: activeSection === 'ads' ? '#043566' : '#e2e8f0',
                    background: activeSection === 'ads' ? 'linear-gradient(135deg, #043566, #065a9e)' : undefined,
                    color: activeSection === 'ads' ? '#fff' : '#043566',
                  }}
                >
                  โฆษณา
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('hide')}
                  className={`px-3 py-1.5 text-sm rounded-full border shadow-sm transition-colors ${
                    activeSection === 'hide'
                      ? 'text-white'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                  style={{
                    borderColor: activeSection === 'hide' ? '#043566' : '#e2e8f0',
                    background: activeSection === 'hide' ? 'linear-gradient(135deg, #043566, #065a9e)' : undefined,
                    color: activeSection === 'hide' ? '#fff' : '#043566',
                  }}
                >
                  ซ่อนข้อมูล
                </button>
              </div>
            </div>
            <div id="basic" className="p-6 scroll-mt-20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ID หน้าจอ</label>
                  <input
                    type="text"
                    value={payload.typeMonitor}
                    disabled
                    className="w-full px-4 py-2.5 border rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ประเภทหน้าจอ</label>
                  <Select
                    value={payload.type}
                    onValueChange={(val) => setPayload(prev => ({ ...prev, type: val }))}
                  >
                    <SelectTrigger
                      className="h-11 w-full rounded-xl border bg-white px-4 text-sm shadow-sm focus:ring-2 focus:ring-blue-400"
                      style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
                      aria-label="ประเภทหน้าจอ"
                    >
                      <SelectValue placeholder="เลือกประเภทหน้าจอ" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="single">Single</SelectItem>
                      <SelectSeparator />
                      <SelectItem value="duo">Duo</SelectItem>
                      <SelectSeparator />
                      <SelectItem value="er">ER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {payload.type === 'er' && (
                  <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      เลือก Urgent Level (สูงสุด 5 ตัว)
                    </label>
                    <div className="bg-white rounded-xl border shadow-sm p-4" style={{ borderColor: '#e2e8f0' }}>
                      <div className="space-y-2">
                        {urgentLevels.map((urgent) => {
                          const selectedUrgentLevels = payload.list_urgent
                            ? payload.list_urgent.split(',').map(s => s.trim()).filter(s => s)
                            : [];
                          const isSelected = selectedUrgentLevels.includes(urgent.Urgent_level);
                          const isDisabled = !isSelected && selectedUrgentLevels.length >= 5;

                          return (
                            <label
                              key={urgent.ID}
                              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-blue-50 border-blue-300'
                                  : isDisabled
                                  ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-50'
                                  : 'bg-white border-slate-200 hover:bg-slate-50'
                              }`}
                              style={{
                                borderColor: isSelected ? '#3b82f6' : isDisabled ? '#e2e8f0' : '#e2e8f0'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isDisabled}
                                onChange={(e) => {
                                  const selectedUrgentLevels = payload.list_urgent
                                    ? payload.list_urgent.split(',').map(s => s.trim()).filter(s => s)
                                    : [];

                                  if (e.target.checked) {
                                    if (selectedUrgentLevels.length < 5) {
                                      selectedUrgentLevels.push(urgent.Urgent_level);
                                    }
                                  } else {
                                    const index = selectedUrgentLevels.indexOf(urgent.Urgent_level);
                                    if (index > -1) {
                                      selectedUrgentLevels.splice(index, 1);
                                    }
                                  }

                                  setPayload(prev => ({
                                    ...prev,
                                    list_urgent: selectedUrgentLevels.join(',')
                                  }));
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                              />
                              <div className="flex items-center space-x-2 flex-1">
                                {urgent.Color && (
                                  <div
                                    className="w-4 h-4 rounded-full border border-slate-300"
                                    style={{ backgroundColor: urgent.Color }}
                                  />
                                )}
                                <span className="text-sm font-medium text-slate-700">
                                  {urgent.Urgent_level}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        เลือกแล้ว: {payload.list_urgent ? payload.list_urgent.split(',').filter(s => s.trim()).length : 0} / 5
                      </p>
                    </div>
                  </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        หน่วงเวลาจอ (วินาที)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={payload.time_wait}
                        onChange={(e) => setPayload(prev => ({ ...prev, time_wait: parseInt(e.target.value) || 20 }))}
                        className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 transition-all shadow-sm"
                        style={{ borderColor: '#e2e8f0' }}
                        placeholder="20"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        เวลาที่ใช้ในการสลับระหว่าง er และ er_2 (วินาที)
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ชื่อโรงพยาบาล</label>
                  <input
                    type="text"
                    value={defaultHospitalName}
                    readOnly
                    disabled
                    className="w-full px-4 py-2.5 border rounded-xl transition-all shadow-sm bg-slate-50 cursor-not-allowed"
                    style={{ borderColor: '#e2e8f0', color: '#64748b' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">แผนก</label>
                  <input
                    type="text"
                    value={payload.n_department}
                    onChange={(e) => setPayload(prev => ({ ...prev, n_department: e.target.value }))}
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 transition-all shadow-sm"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>

                <div>
                  <label className="block text-md font-medium text-slate-700 mb-2">หัวกำลังรับบริการ (ซ้าย)</label>
                  <input
                    type="text"
                    value={payload.head_left}
                    onChange={(e) => setPayload(prev => ({ ...prev, head_left: e.target.value }))}
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 transition-all shadow-sm"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>

                {payload.type === 'duo' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">หัวกำลังรับบริการ (ขวา)</label>
                    <input
                      type="text"
                      value={payload.head_right}
                      onChange={(e) => setPayload(prev => ({ ...prev, head_right: e.target.value }))}
                      className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 transition-all shadow-sm"
                      style={{ borderColor: '#e2e8f0' }}
                    />
                  </div>
                )}

              </div>
            </div>

            {/* Table Settings Section */}
            <div className="px-6 py-5 border-t border-b bg-gradient-to-r from-blue-50/60 to-transparent" style={{ borderColor: '#e2e8f0' }}>
              <h2 className="text-xl font-bold" style={{ color: '#043566' }}>การตั้งค่าตาราง</h2>
            </div>
            <div id="table" className="p-6 scroll-mt-20">
              <div className={`grid grid-cols-1 ${payload.type === 'duo' ? 'md:grid-cols-2' : ''} gap-8`}>
                {/* ฝั่งซ้าย */}
                <div className="space-y-4">
                  <div className="p-4 border-2 rounded-xl" style={{ borderColor: '#e2e8f0', background: 'rgba(4, 53, 102, 0.02)' }}>
                    <h4 className="font-semibold mb-4 flex items-center space-x-2" style={{ color: '#043566' }}>
                      <ArrowLeft className="w-5 h-5" />
                      <span>ตาราง {payload.type === 'duo' ? '(ซ้าย)' : ''}</span>
                    </h4>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">จำนวนห้อง</label>
                      <input
                        type="number"
                        min="0"
                        value={payload.amount_left}
                        onChange={(e) => handleAmountLeftChange(parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                        placeholder="กรอกจำนวนห้อง"
                      />
                    </div>

                    {payload.amount_left > 0 && (
                      <div className="space-y-3 mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          ชื่อห้อง ({payload.amount_left} ห้อง)
                        </label>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {leftRooms.slice(0, payload.amount_left).map((room, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-slate-600 w-8">#{index + 1}</span>
                              <input
                                type="text"
                                value={room}
                                onChange={(e) => handleLeftRoomChange(index, e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm mt-1"
                                placeholder={`ห้อง ${index + 1}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">{payload.type === 'duo' ? 'แผนก (ซ้าย)' : 'แผนก'}</label>
                      {/* Selected Departments Tags */}
                      {leftDepartmentNames.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {leftDepartmentNames.map((dept) => (
                            <span
                              key={dept.code}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium"
                              style={{ background: 'rgba(4,53,102,0.1)', color: '#043566' }}
                            >
                              {dept.name}
                              <button
                                type="button"
                                onClick={() => {
                                  if (payload.type === 'duo') {
                                    const newCodes = selectedLeftDepartmentCodes.filter(c => c !== String(dept.code));
                                    setSelectedLeftDepartmentCodes(newCodes);
                                    // อัปเดต query_left ทันที
                                    setPayload(prev => ({ 
                                      ...prev, 
                                      query_left: newCodes.length > 0 ? newCodes.join(',') : ''
                                    }));
                                  } else {
                                    const newCodes = selectedDepartmentCodes.filter(c => c !== String(dept.code));
                                    setSelectedDepartmentCodes(newCodes);
                                    // อัปเดต query_left ทันที
                                    setPayload(prev => ({ 
                                      ...prev, 
                                      query_left: newCodes.length > 0 ? newCodes.join(',') : ''
                                    }));
                                  }
                                }}
                                className="hover:bg-slate-200 rounded-full p-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (payload.type === 'duo') {
                            setShowLeftDepartmentPopup(true);
                          } else {
                            setShowDepartmentPopup(true);
                          }
                        }}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-left bg-white hover:bg-slate-50"
                      >
                        {leftDepartmentNames.length > 0 
                          ? `เลือกแล้ว ${leftDepartmentNames.length} แผนก` 
                          : 'เลือกแผนก'}
                      </button>
                    </div>

                    {/* Station Selection */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        เลือก Station (ซ้าย)
                      </label>
                      {leftDepartmentNames.length === 0 && selectedDepartmentCodes.length === 0 && selectedLeftDepartmentCodes.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm border border-slate-200 rounded-lg bg-slate-50">
                          <div className="flex flex-col items-center space-y-2">
                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                              <Plus className="w-6 h-6 text-slate-400" />
                            </div>
                            <span>กรุณาเลือกแผนกก่อน</span>
                          </div>
                        </div>
                      ) : leftStations.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm border border-slate-200 rounded-lg bg-slate-50">
                          <div className="flex flex-col items-center space-y-2">
                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                              <Plus className="w-6 h-6 text-slate-400" />
                            </div>
                            <span>ไม่พบ Station สำหรับแผนกนี้</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-white">
                          {(() => {
                            // จัดกลุ่ม stations ตามแผนก
                            const stationsByDept = leftStations.reduce((acc, station) => {
                              const deptCode = String(station.department_code);
                              if (!acc[deptCode]) {
                                acc[deptCode] = [];
                              }
                              acc[deptCode].push(station);
                              return acc;
                            }, {} as Record<string, Array<{ station_name: string; department_code: string }>>);

                            // หาชื่อแผนกจาก department codes
                            const deptCodes = Object.keys(stationsByDept);
                            // ใช้ leftDepartmentNames ที่โหลดไว้แล้ว หรือ allDepartments เป็น fallback
                            const deptNamesSource = leftDepartmentNames.length > 0 ? leftDepartmentNames : allDepartments;
                            
                            return deptCodes.map((deptCode) => {
                              const stations = stationsByDept[deptCode];
                              // Normalize type เพื่อให้ match ถูกต้อง
                              const dept = deptNamesSource.find(d => String(d.code) === String(deptCode));
                              const deptName = dept ? dept.name : `แผนก ${deptCode}`;
                              
                              return (
                                <div key={deptCode} className="mb-4 last:mb-0">
                                  {/* Label แสดงชื่อแผนก */}
                                  {deptCodes.length > 1 && (
                                    <div className="mb-2 px-2 py-1 bg-slate-100 rounded-md">
                                      <span className="text-xs font-semibold text-slate-600">{deptName}</span>
                                    </div>
                                  )}
                                  {/* Stations ของแผนกนี้ */}
                                  <div className="space-y-1">
                                    {stations.map((station, index) => {
                                      const isSelected = selectedLeftStations.includes(station.station_name);
                                      return (
                                        <label
                                          key={`left-station-${deptCode}-${index}-${station.station_name}`}
                                          className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleLeftStationToggle(station.station_name)}
                                            className="w-5 h-5 text-blue-600 border-blue-300 rounded focus:ring-blue-500 cursor-pointer"
                                          />
                                          <span className="text-sm text-slate-700">{station.station_name}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ฝั่งขวา - แสดงเฉพาะเมื่อ type เป็น duo */}
                {payload.type === 'duo' && (
                  <div className="space-y-4">
                    <div className="p-4 border-2 rounded-xl" style={{ borderColor: '#e2e8f0', background: 'rgba(4, 53, 102, 0.02)' }}>
                      <h4 className="font-semibold mb-4 flex items-center space-x-2" style={{ color: '#043566' }}>
                        <ArrowRight className="w-5 h-5" />
                        <span>ตาราง (ขวา)</span>
                      </h4>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">จำนวนห้อง (ขวา)</label>
                        <input
                          type="number"
                          min="0"
                          value={payload.amount_right}
                          onChange={(e) => handleAmountRightChange(parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                          placeholder="กรอกจำนวนห้อง"
                        />
                      </div>

                      {payload.amount_right > 0 && (
                        <div className="space-y-3 mt-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            ชื่อห้อง ({payload.amount_right} ห้อง)
                          </label>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {rightRooms.slice(0, payload.amount_right).map((room, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-slate-600 w-8">#{index + 1}</span>
                                <input
                                  type="text"
                                  value={room}
                                  onChange={(e) => handleRightRoomChange(index, e.target.value)}
                                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm"
                                  placeholder={`ห้อง ${index + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">แผนก (ขวา)</label>
                        {/* Selected Departments Tags */}
                        {rightDepartmentNames.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {rightDepartmentNames.map((dept) => (
                              <span
                                key={dept.code}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium"
                                style={{ background: 'rgba(4,53,102,0.1)', color: '#043566' }}
                              >
                                {dept.name}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newCodes = selectedRightDepartmentCodes.filter(c => c !== String(dept.code));
                                    setSelectedRightDepartmentCodes(newCodes);
                                    // อัปเดต query_right ทันที
                                    setPayload(prev => ({ 
                                      ...prev, 
                                      query_right: newCodes.length > 0 ? newCodes.join(',') : ''
                                    }));
                                  }}
                                  className="hover:bg-slate-200 rounded-full p-0.5 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowRightDepartmentPopup(true)}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-left bg-white hover:bg-slate-50"
                        >
                          {rightDepartmentNames.length > 0 
                            ? `เลือกแล้ว ${rightDepartmentNames.length} แผนก` 
                            : 'เลือกแผนก'}
                        </button>
                      </div>

                      {/* Station Selection สำหรับ duo ฝั่งขวา */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          เลือก Station (ขวา)
                        </label>
                        {rightDepartmentNames.length === 0 && selectedRightDepartmentCodes.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 text-sm border border-slate-200 rounded-lg bg-slate-50">
                            <div className="flex flex-col items-center space-y-2">
                              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                                <Plus className="w-6 h-6 text-slate-400" />
                              </div>
                              <span>กรุณาเลือกแผนกก่อน</span>
                            </div>
                          </div>
                        ) : rightStations.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 text-sm border border-slate-200 rounded-lg bg-slate-50">
                            <div className="flex flex-col items-center space-y-2">
                              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                                <Plus className="w-6 h-6 text-slate-400" />
                              </div>
                              <span>ไม่พบ Station สำหรับแผนกนี้</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-white">
                            {(() => {
                              // จัดกลุ่ม stations ตามแผนก
                              const stationsByDept = rightStations.reduce((acc, station) => {
                                const deptCode = String(station.department_code);
                                if (!acc[deptCode]) {
                                  acc[deptCode] = [];
                                }
                                acc[deptCode].push(station);
                                return acc;
                              }, {} as Record<string, Array<{ station_name: string; department_code: string }>>);

                              // หาชื่อแผนกจาก department codes
                              const deptCodes = Object.keys(stationsByDept);
                              // ใช้ rightDepartmentNames ที่โหลดไว้แล้ว หรือ allDepartments เป็น fallback
                              const deptNamesSource = rightDepartmentNames.length > 0 ? rightDepartmentNames : allDepartments;
                              
                              return deptCodes.map((deptCode) => {
                                const stations = stationsByDept[deptCode];
                                // Normalize type เพื่อให้ match ถูกต้อง
                                const dept = deptNamesSource.find(d => String(d.code) === String(deptCode));
                                const deptName = dept ? dept.name : `แผนก ${deptCode}`;
                                
                                return (
                                  <div key={deptCode} className="mb-4 last:mb-0">
                                    {/* Label แสดงชื่อแผนก */}
                                    {deptCodes.length > 1 && (
                                      <div className="mb-2 px-2 py-1 bg-slate-100 rounded-md">
                                        <span className="text-xs font-semibold text-slate-600">{deptName}</span>
                                      </div>
                                    )}
                                    {/* Stations ของแผนกนี้ */}
                                    <div className="space-y-1">
                                      {stations.map((station, index) => {
                                        const isSelected = selectedRightStations.includes(station.station_name);
                                        return (
                                          <label
                                            key={`right-station-${deptCode}-${index}-${station.station_name}`}
                                            className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={() => handleRightStationToggle(station.station_name)}
                                              className="w-5 h-5 text-blue-600 border-blue-300 rounded focus:ring-blue-500 cursor-pointer"
                                            />
                                            <span className="text-sm text-slate-700">{station.station_name}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Display Settings Section */}
            <div className="px-6 py-5 border-t border-b bg-gradient-to-r from-blue-50/60 to-transparent" style={{ borderColor: '#e2e8f0' }}>
              <h2 className="text-xl font-bold" style={{ color: '#043566' }}>การตั้งค่าการแสดงผล</h2>
            </div>
            <div id="display" className="p-6 scroll-mt-20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* เลือกฟอนต์ */}
                <div className="bg-white rounded-xl border shadow-sm hover:shadow transition-all p-4" style={{ borderColor: '#e2e8f0' }}>
                  <h4 className="font-semibold mb-3" style={{ color: '#043566' }}>เลือกฟอนต์</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <label className="switchs">
                        <input
                          className="chk"
                          type="radio"
                          name="font"
                          checked={payload.font === 'lineseed'}
                          onChange={() => setPayload(prev => ({ ...prev, font: 'lineseed' }))}
                        />
                        <span className="sliders"></span>
                      </label>
                      <span className="text-sm text-slate-700">Line Seed</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <label className="switchs">
                        <input
                          className="chk"
                          type="radio"
                          name="font"
                          checked={payload.font === 'sarabun'}
                          onChange={() => setPayload(prev => ({ ...prev, font: 'sarabun' }))}
                        />
                        <span className="sliders"></span>
                      </label>
                      <span className="text-sm text-slate-700">Sarabun</span>
                    </div>
                  </div>
                </div>

                {/* การแสดงผล */}
                <div className="bg-white rounded-xl border shadow-sm hover:shadow transition-all p-4" style={{ borderColor: '#e2e8f0' }}>
                  <h4 className="font-semibold mb-3" style={{ color: '#043566' }}>การแสดงผล</h4>
                  <div className="space-y-3">
                    {[
                      { key: 'urgent_color', label: 'สีแสดงความเร่งด่วน' },
                      { key: 'status_patient', label: 'สถานะผู้ป่วย' },
                      { key: 'urgent_level', label: 'แสดงความเร่งด่วน' },
                      { key: 'time_col', label: 'เปิดแถว เวลาที่รอ' },
                      { key: 'arr_l', label: 'เรียงอันดับล่าสุด (ซ้าย)' },
                      { key: 'arr_r', label: 'เรียงอันดับล่าสุด (ขวา)' },
                      { key: 'lock_position', label: 'ล็อคตำแหน่งกำลังรับบริการ (ซ้าย)' },
                      { key: 'lock_position_right', label: 'ล็อคตำแหน่งกำลังรับบริการ (ขวา)' },
                    ].map((item) => {
                      // ตรวจสอบว่า checkbox ควร disabled หรือไม่
                      let isDisabled = false;
                      if (item.key === 'arr_l') {
                        // ถ้า "ล็อคตำแหน่งห้อง (ซ้าย)" เปิดอยู่ → ไม่สามารถเปิด "เรียงอันดับล่าสุด (ซ้าย)" ได้
                        isDisabled = payload.lock_position === true;
                      } else if (item.key === 'arr_r') {
                        // ถ้า "ล็อคตำแหน่งห้อง (ขวา)" เปิดอยู่ → ไม่สามารถเปิด "เรียงอันดับล่าสุด (ขวา)" ได้
                        isDisabled = payload.lock_position_right === true;
                      } else if (item.key === 'lock_position') {
                        // ถ้า "เรียงอันดับล่าสุด (ซ้าย)" เปิดอยู่ → ไม่สามารถเปิด "ล็อคตำแหน่งห้อง (ซ้าย)" ได้
                        isDisabled = payload.arr_l === true;
                      } else if (item.key === 'lock_position_right') {
                        // ถ้า "เรียงอันดับล่าสุด (ขวา)" เปิดอยู่ → ไม่สามารถเปิด "ล็อคตำแหน่งห้อง (ขวา)" ได้
                        isDisabled = payload.arr_r === true;
                      }

                      return (
                        <div key={item.key} className="flex items-center space-x-3">
                          <div className="switch">
                            <input
                              id={`toggle-${item.key}`}
                              type="checkbox"
                              checked={payload[item.key as keyof PayloadData] as boolean}
                              disabled={isDisabled}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                setPayload(prev => {
                                  const updates: Partial<PayloadData> = { [item.key]: isChecked };
                                  
                                  // ถ้าเปิด "เรียงอันดับล่าสุด (ซ้าย)" → ปิด "ล็อคตำแหน่งห้อง (ซ้าย)" อัตโนมัติ
                                  if (item.key === 'arr_l' && isChecked) {
                                    updates.lock_position = false;
                                  }
                                  
                                  // ถ้าเปิด "เรียงอันดับล่าสุด (ขวา)" → ปิด "ล็อคตำแหน่งห้อง (ขวา)" อัตโนมัติ
                                  if (item.key === 'arr_r' && isChecked) {
                                    updates.lock_position_right = false;
                                  }
                                  
                                  // ถ้าเปิด "ล็อคตำแหน่งห้อง (ซ้าย)" → ปิด "เรียงอันดับล่าสุด (ซ้าย)" อัตโนมัติ
                                  if (item.key === 'lock_position' && isChecked) {
                                    updates.arr_l = false;
                                  }
                                  
                                  // ถ้าเปิด "ล็อคตำแหน่งห้อง (ขวา)" → ปิด "เรียงอันดับล่าสุด (ขวา)" อัตโนมัติ
                                  if (item.key === 'lock_position_right' && isChecked) {
                                    updates.arr_r = false;
                                  }
                                  
                                  return { ...prev, ...updates };
                                });
                              }}
                            />
                            <label className="slider" htmlFor={`toggle-${item.key}`}></label>
                          </div>
                          <span className={`text-sm ${isDisabled ? 'text-slate-400' : 'text-slate-700'}`}>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* การตั้งค่าสี */}
                <div className="bg-white rounded-xl border shadow-sm hover:shadow transition-all p-4" style={{ borderColor: '#e2e8f0' }}>
                  <h4 className="font-semibold mb-3" style={{ color: '#043566' }}>การตั้งค่าสี</h4>
                  <div className="space-y-4">
                    {/* Static Color */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        สี Static (color_static)
                      </label>
                      <p className="text-xs text-slate-500 mb-2">
                          ใช้สำหรับ: พื้นหลังคิว และพื้นหลังรายชื่อที่ข้ามคิว
                        </p>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={payload.color_static}
                          onChange={(e) => setPayload(prev => ({ ...prev, color_static: e.target.value }))}
                          placeholder="เช่น #ffffff หรือ linear-gradient(153deg, rgba(40, 199, 231, 1) 0%, rgba(0, 27, 122, 1) 100%)"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {payload.color_static && (
                          <div
                            className="w-12 h-12 rounded-lg border-2 border-slate-300 cursor-pointer"
                            style={{ 
                              background: payload.color_static.includes('gradient') || payload.color_static.includes('linear-gradient') || payload.color_static.includes('radial-gradient')
                                ? payload.color_static
                                : payload.color_static
                            }}
                            title="ตัวอย่างสี"
                          />
                        )}
                        <input
                          type="color"
                          value={payload.color_static && payload.color_static.match(/^#[0-9A-Fa-f]{6}$/) ? payload.color_static : '#ffffff'}
                          onChange={(e) => setPayload(prev => ({ ...prev, color_static: e.target.value }))}
                          className="w-12 h-12 rounded-lg border-2 border-slate-300 cursor-pointer"
                          title="เลือกสี"
                        />
                      </div>
                    </div>

                    {/* Dynamic Color - Gradient Only */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        สี Dynamic (color_dynamic) - Gradient
                      </label>
                      <p className="text-xs text-slate-500 mb-2">
                          ใช้สำหรับ: พื้นหลังของส่วนกำลังรับบริการ (Service Section)
                        </p>
                      
                      {/* Gradient Editor */}
                      <div className="space-y-3">
                        {/* มุมของ gradient */}
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">มุม (Angle): {gradientAngle}°</label>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={gradientAngle}
                            onChange={(e) => {
                              const angle = parseInt(e.target.value);
                              setGradientAngle(angle);
                              const r1 = parseInt(gradientStartColor.slice(1, 3), 16);
                              const g1 = parseInt(gradientStartColor.slice(3, 5), 16);
                              const b1 = parseInt(gradientStartColor.slice(5, 7), 16);
                              const r2 = parseInt(gradientEndColor.slice(1, 3), 16);
                              const g2 = parseInt(gradientEndColor.slice(3, 5), 16);
                              const b2 = parseInt(gradientEndColor.slice(5, 7), 16);
                              const gradient = `linear-gradient(${angle}deg, rgba(${r1}, ${g1}, ${b1}, 1) 0%, rgba(${r2}, ${g2}, ${b2}, 1) 100%)`;
                              setPayload(prev => ({ ...prev, color_dynamic: gradient }));
                            }}
                            className="w-full"
                          />
                        </div>
                        
                        {/* สีเริ่มต้น */}
                        <div className="flex items-center gap-3">
                          <label className="text-xs text-slate-600 w-20">สีเริ่มต้น:</label>
                          <input
                            type="color"
                            value={gradientStartColor}
                            onChange={(e) => {
                              const color = e.target.value;
                              setGradientStartColor(color);
                              const r = parseInt(color.slice(1, 3), 16);
                              const g = parseInt(color.slice(3, 5), 16);
                              const b = parseInt(color.slice(5, 7), 16);
                              const r2 = parseInt(gradientEndColor.slice(1, 3), 16);
                              const g2 = parseInt(gradientEndColor.slice(3, 5), 16);
                              const b2 = parseInt(gradientEndColor.slice(5, 7), 16);
                              const gradient = `linear-gradient(${gradientAngle}deg, rgba(${r}, ${g}, ${b}, 1) 0%, rgba(${r2}, ${g2}, ${b2}, 1) 100%)`;
                              setPayload(prev => ({ ...prev, color_dynamic: gradient }));
                            }}
                            className="w-12 h-12 rounded-lg border-2 border-slate-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={gradientStartColor}
                            onChange={(e) => {
                              const color = e.target.value;
                              if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
                                setGradientStartColor(color);
                                const r = parseInt(color.slice(1, 3), 16);
                                const g = parseInt(color.slice(3, 5), 16);
                                const b = parseInt(color.slice(5, 7), 16);
                                const r2 = parseInt(gradientEndColor.slice(1, 3), 16);
                                const g2 = parseInt(gradientEndColor.slice(3, 5), 16);
                                const b2 = parseInt(gradientEndColor.slice(5, 7), 16);
                                const gradient = `linear-gradient(${gradientAngle}deg, rgba(${r}, ${g}, ${b}, 1) 0%, rgba(${r2}, ${g2}, ${b2}, 1) 100%)`;
                                setPayload(prev => ({ ...prev, color_dynamic: gradient }));
                              }
                            }}
                            placeholder="#28C7E7"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        {/* สีสิ้นสุด */}
                        <div className="flex items-center gap-3">
                          <label className="text-xs text-slate-600 w-20">สีสิ้นสุด:</label>
                          <input
                            type="color"
                            value={gradientEndColor}
                            onChange={(e) => {
                              const color = e.target.value;
                              setGradientEndColor(color);
                              const r1 = parseInt(gradientStartColor.slice(1, 3), 16);
                              const g1 = parseInt(gradientStartColor.slice(3, 5), 16);
                              const b1 = parseInt(gradientStartColor.slice(5, 7), 16);
                              const r = parseInt(color.slice(1, 3), 16);
                              const g = parseInt(color.slice(3, 5), 16);
                              const b = parseInt(color.slice(5, 7), 16);
                              const gradient = `linear-gradient(${gradientAngle}deg, rgba(${r1}, ${g1}, ${b1}, 1) 0%, rgba(${r}, ${g}, ${b}, 1) 100%)`;
                              setPayload(prev => ({ ...prev, color_dynamic: gradient }));
                            }}
                            className="w-12 h-12 rounded-lg border-2 border-slate-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={gradientEndColor}
                            onChange={(e) => {
                              const color = e.target.value;
                              if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
                                setGradientEndColor(color);
                                const r1 = parseInt(gradientStartColor.slice(1, 3), 16);
                                const g1 = parseInt(gradientStartColor.slice(3, 5), 16);
                                const b1 = parseInt(gradientStartColor.slice(5, 7), 16);
                                const r = parseInt(color.slice(1, 3), 16);
                                const g = parseInt(color.slice(3, 5), 16);
                                const b = parseInt(color.slice(5, 7), 16);
                                const gradient = `linear-gradient(${gradientAngle}deg, rgba(${r1}, ${g1}, ${b1}, 1) 0%, rgba(${r}, ${g}, ${b}, 1) 100%)`;
                                setPayload(prev => ({ ...prev, color_dynamic: gradient }));
                              }
                            }}
                            placeholder="#001B7A"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        {/* Preview */}
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">ตัวอย่าง:</label>
                          <div
                            className="w-full h-16 rounded-lg border-2 border-slate-300"
                            style={{ background: payload.color_dynamic || 'transparent' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* เสียง */}
                   {/* ประเภทเสียงประกาศ */}
                   <div className="bg-white rounded-xl border shadow-sm hover:shadow transition-all p-4" style={{ borderColor: '#e2e8f0' }}>
                  <h4 className="font-semibold mb-3" style={{ color: '#043566' }}>ประเภทเสียงประกาศ</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <label className="switchs">
                        <input
                          className="chk"
                          type="radio"
                          name="voice"
                          checked={payload.voice === '3'}
                          onChange={() => setPayload(prev => ({ ...prev, voice: '3' }))}
                        />
                        <span className="sliders"></span>
                      </label>
                      <span className="text-sm text-slate-700">คิว ชื่อ นามสกุล</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <label className="switchs">
                        <input
                          className="chk"
                          type="radio"
                          name="type_popup"
                          checked={payload.voice === '2'}
                          onChange={() => setPayload(prev => ({ ...prev, voice: '2' }))}
                        />
                        <span className="sliders"></span>
                      </label>
                      <span className="text-sm text-slate-700">คิว ชื่อ</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <label className="switchs">
                        <input
                          className="chk"
                          type="radio"
                          name="voice"
                          checked={payload.voice === '1'}
                          onChange={() => setPayload(prev => ({ ...prev, voice: '1' }))}
                        />
                        <span className="sliders"></span>
                      </label>
                      <span className="text-sm text-slate-700">คิว</span>
                    </div>
                  </div>
                </div>

                {/* การแสดงข้อมูลเพิ่มเติม */}
                <div className="bg-white rounded-xl border shadow-sm hover:shadow transition-all p-4" style={{ borderColor: '#e2e8f0' }}>
                  <h4 className="font-semibold mb-3" style={{ color: '#043566' }}>การแสดงข้อมูลเพิ่มเติม</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="switch">
                        <input
                          id="toggle-set_descrip"
                          type="checkbox"
                          checked={payload.set_descrip}
                          onChange={(e) => setPayload(prev => ({ 
                            ...prev, 
                            set_descrip: e.target.checked 
                          }))}
                        />
                        <label className="slider" htmlFor="toggle-set_descrip"></label>
                      </div>
                      <span className="text-sm text-slate-700">แสดง Description</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="switch">
                        <input
                          id="toggle-set_notice"
                          type="checkbox"
                          checked={payload.set_notice}
                          onChange={(e) => setPayload(prev => ({ 
                            ...prev, 
                            set_notice: e.target.checked 
                          }))}
                        />
                        <label className="slider" htmlFor="toggle-set_notice"></label>
                      </div>
                      <span className="text-sm text-slate-700">แสดง Notice</span>
                    </div>
                  </div>
                </div>

                {/* เลือกเสียงประกาศ */}
                <div className="bg-white rounded-xl border shadow-sm p-5 md:col-span-3 text-center" style={{ borderColor: '#e2e8f0' }}>
                  <h4 className="font-semibold mb-4" style={{ color: '#043566' }}>เลือกเสียงประกาศ</h4>
                  <div className="flex flex-wrap items-center justify-center gap-6">
                    {[
                      { value: 'female' as const, label: 'เสียงผู้หญิง', Icon: Venus },
                      { value: 'male' as const, label: 'เสียงผู้ชาย', Icon: Mars },
                    ].map(({ value, label, Icon }) => (
                      <div key={value} className="flex items-center gap-3">
                        <label className="switchs">
                          <input
                            className="chk"
                            type="checkbox"
                            checked={payload.style_voice === value}
                            onChange={() => setPayload(prev => ({ ...prev, style_voice: value }))}
                          />
                          <span className="sliders"></span>
                        </label>
                        <Icon className="w-4 h-4 text-slate-600" />
                        <span className="text-sm text-slate-700 font-medium">{label}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handlePreviewVoice}
                    disabled={isPreviewingVoice}
                    className="mt-4 mx-auto inline-flex items-center space-x-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{isPreviewingVoice ? 'กำลังเล่นเสียงตัวอย่าง...' : 'เล่นเสียงตัวอย่าง'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Ads Settings Section */}
            <div className="px-6 py-5 border-t border-b bg-gradient-to-r from-blue-50/60 to-transparent" style={{ borderColor: '#e2e8f0' }}>
              <h2 className="text-xl font-bold" style={{ color: '#043566' }}>การตั้งค่าโฆษณา</h2>
            </div>
            <div id="ads" className="p-6 scroll-mt-20">
              <div className="bg-white rounded-xl border shadow-sm p-6" style={{ borderColor: '#e2e8f0' }}>
                <div className="space-y-6">
                  {/* เปิด/ปิดโฆษณา */}
                  <div className="flex items-center space-x-3">
                    <div className="switch">
                      <input
                        id="toggle-enable_ads"
                        type="checkbox"
                        checked={payload.enable_ads}
                        onChange={(e) => setPayload(prev => ({ ...prev, enable_ads: e.target.checked }))}
                      />
                      <label className="slider" htmlFor="toggle-enable_ads"></label>
                    </div>
                    <span className="text-sm font-medium text-slate-700">เปิดโฆษณา</span>
                  </div>

                  {payload.enable_ads && (
                    <>
                      {/* เลือกฝั่งที่จะอัพโหลด */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          เลือกตำแหน่งโฆษณา
                        </label>
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <label className="switchs">
                              <input
                                className="chk"
                                type="radio"
                                name="ads_side"
                                checked={adsSide === 'separate'}
                                onChange={() => {
                                  setAdsSide('separate');
                                  setPayload(prev => ({ ...prev, ads_type: 'split' }));
                                }}
                              />
                              <span className="sliders"></span>
                            </label>
                            <span className="text-sm text-slate-700">อัพโหลดไฟล์โฆษณา (สไลด์)</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <label className="switchs">
                              <input
                                className="chk"
                                type="radio"
                                name="ads_side"
                                checked={adsSide === 'left'}
                                onChange={() => {
                                  setAdsSide('left');
                                  setPayload(prev => ({ ...prev, ads_type: 'left' }));
                                }}
                              />
                              <span className="sliders"></span>
                            </label>
                            <span className="text-sm text-slate-700">อัพโหลดไฟล์โฆษณา (ซ้าย)</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <label className="switchs">
                              <input
                                className="chk"
                                type="radio"
                                name="ads_side"
                                checked={adsSide === 'right'}
                                onChange={() => {
                                  setAdsSide('right');
                                  setPayload(prev => ({ ...prev, ads_type: 'right' }));
                                }}
                              />
                              <span className="sliders"></span>
                            </label>
                            <span className="text-sm text-slate-700">อัพโหลดไฟล์โฆษณา (ขวา)</span>
                          </div>
                        </div>
                        {/* กรอกหน่วงเวลาเมื่อเลือกหน้าแยก */}
                        {adsSide === 'separate' && (payload.type === 'single' || payload.type === 'duo') && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              หน่วงเวลา (วินาที)
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={Number.isFinite(Number(payload.time_wait)) ? Number(payload.time_wait) : 20}
                              onChange={(e) => {
                                const v = parseInt(e.target.value || '0', 10);
                                setPayload(prev => ({ ...prev, time_wait: isNaN(v) ? 0 : v }));
                              }}
                              className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 transition-all shadow-sm"
                              style={{ borderColor: '#e2e8f0' }}
                            />
                            <p className="mt-1 text-xs text-slate-500">
                              จะใช้ดีเลย์นี้สำหรับการแสดงโฆษณาแบบหน้าแยกในหน้าจอ single และ duo
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Dropzone with Button */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          อัพโหลดไฟล์โฆษณา
                        </label>
                        <div
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                          className={`
                            relative border-2 border-dashed rounded-xl p-6 transition-all
                            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white'}
                            ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400 hover:bg-slate-50'}
                          `}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileInput}
                            disabled={uploading}
                            className="hidden"
                            id="ads-file-input"
                          />
                          
                          {previewImage ? (
                            <div className="relative">
                              <img
                                src={previewImage}
                                alt="Preview"
                                className="w-full h-48 object-contain rounded-lg"
                              />
                              {!uploading && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewImage(null);
                                    if (adsSide === 'left') {
                                      setPayload(prev => ({ ...prev, ads_path_left: '' }));
                                    } else if (adsSide === 'right') {
                                      setPayload(prev => ({ ...prev, ads_path_right: '' }));
                                    } else {
                                      setPayload(prev => ({ ...prev, ads_path_left: '', ads_path_right: '' }));
                                    }
                                  }}
                                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center space-y-4">
                              <div className="p-4 rounded-full bg-slate-100">
                                <Upload className="w-8 h-8 text-slate-400" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-slate-700 mb-2">
                                  {uploading ? 'กำลังอัพโหลด...' : 'ลากไฟล์มาวางที่นี่ หรือ'}
                                </p>
                                <label
                                  htmlFor="ads-file-input"
                                  className={`
                                    inline-flex items-center space-x-2 px-4 py-2 bg-white border rounded-lg
                                    ${uploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-50'}
                                    transition-colors
                                  `}
                                  style={{ borderColor: '#e2e8f0' }}
                                >
                                  <Upload className="w-4 h-4 text-slate-600" />
                                  <span className="text-sm text-slate-700">เลือกไฟล์</span>
                                </label>
                                <p className="text-xs text-slate-500 mt-2">
                                  รองรับไฟล์รูปภาพ (JPG, PNG, GIF, WebP) ขนาดสูงสุด 50MB
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {uploading && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                              <div className="flex flex-col items-center space-y-2">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-sm text-slate-600">กำลังอัพโหลด...</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* แสดงไฟล์ปัจจุบัน */}
                        {((adsSide === 'left' && payload.ads_path_left) || 
                          (adsSide === 'right' && payload.ads_path_right) ||
                          (adsSide === 'separate' && (payload.ads_path_left || payload.ads_path_right))) && (
                          <div className="mt-2">
                            <p className="text-xs text-slate-500 mb-1">ไฟล์ปัจจุบัน:</p>
                            <a 
                              href={adsSide === 'left' ? payload.ads_path_left : 
                                    adsSide === 'right' ? payload.ads_path_right : 
                                    payload.ads_path_left || payload.ads_path_right} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {adsSide === 'left' ? payload.ads_path_left : 
                               adsSide === 'right' ? payload.ads_path_right : 
                               payload.ads_path_left || payload.ads_path_right}
                            </a>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Hide Settings Section */}
            <div className="px-6 py-5 border-t border-b bg-gradient-to-r from-blue-50/60 to-transparent" style={{ borderColor: '#e2e8f0' }}>
              <h2 className="text-xl font-bold" style={{ color: '#043566' }}>การตั้งค่าการซ่อนข้อมูล</h2>
            </div>
            <div id="hide" className="p-6 scroll-mt-20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* การซ่อนข้อมูลในห้อง */}
                <div className="bg-white rounded-xl border shadow-sm hover:shadow transition-all p-4" style={{ borderColor: '#e2e8f0' }}>
                  <h4 className="font-semibold mb-3" style={{ color: '#043566' }}>การซ่อนข้อมูลในกำลังรับบริการ</h4>
                  <div className="space-y-3">
                    {/* <div className="flex items-center space-x-3">
                      <div className="switch">
                        <input
                          id="toggle-stem_name"
                          type="checkbox"
                          checked={payload.stem_name === 'hide'}
                          onChange={(e) => setPayload(prev => ({ 
                            ...prev, 
                            stem_name: e.target.checked ? 'hide' : 'name' 
                          }))}
                        />
                        <label className="slider" htmlFor="toggle-stem_name"></label>
                      </div>
                      <span className="text-sm text-slate-700">ปิดชื่อห้อง</span>
                    </div> */}

                    <div className="space-y-3">
                      {/* <label className="block text-sm font-medium text-slate-700 mb-2">การแสดงชื่อ-นามสกุลในห้อง</label> */}
                      
                      <div className="flex items-center gap-4">
                        <label className="switchs">
                          <input
                            className="chk"
                            type="radio"
                            name="stem_surname"
                            checked={payload.stem_surname === 'false'}
                            onChange={() => setPayload(prev => ({ ...prev, stem_surname: 'false' }))}
                          />
                          <span className="sliders"></span>
                        </label>
                        <span className="text-sm text-slate-700">แสดงชื่อ-นามสกุล</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="switchs">
                          <input
                            className="chk"
                            type="radio"
                            name="stem_surname"
                            checked={payload.stem_surname === 'true'}
                            onChange={() => setPayload(prev => ({ ...prev, stem_surname: 'true' }))}
                          />
                          <span className="sliders"></span>
                        </label>
                        <span className="text-sm text-slate-700">แสดงชื่อ และนามสกุลแบบซ่อน</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="switchs">
                          <input
                            className="chk"
                            type="radio"
                            name="stem_surname"
                            checked={payload.stem_surname === 'name'}
                            onChange={() => setPayload(prev => ({ ...prev, stem_surname: 'name' }))}
                          />
                          <span className="sliders"></span>
                        </label>
                        <span className="text-sm text-slate-700">ไม่แสดงชื่อ-นามสกุล</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* การซ่อนข้อมูลในตาราง */}
                <div className="bg-white rounded-xl border shadow-sm hover:shadow transition-all p-4" style={{ borderColor: '#e2e8f0' }}>
                  <h4 className="font-semibold mb-3" style={{ color: '#043566' }}>การซ่อนข้อมูลในรอรับบริการ</h4>
                  <div className="space-y-3">
                    {/* <div className="flex items-center space-x-3">
                      <div className="switch">
                        <input
                          id="toggle-stem_name_table"
                          type="checkbox"
                          checked={payload.stem_name_table === 'hide'}
                          onChange={(e) => setPayload(prev => ({ 
                            ...prev, 
                            stem_name_table: e.target.checked ? 'hide' : 'name' 
                          }))}
                        />
                        <label className="slider" htmlFor="toggle-stem_name_table"></label>
                      </div>
                      <span className="text-sm text-slate-700">ปิดชื่อตาราง</span>
                    </div> */}

                    <div className="space-y-3">
                      {/* <label className="block text-sm font-medium text-slate-700 mb-2">การแสดงชื่อ-นามสกุลในตาราง</label> */}
                      
                      <div className="flex items-center gap-4">
                        <label className="switchs">
                          <input
                            className="chk"
                            type="radio"
                            name="stem_surname_table"
                            checked={payload.stem_surname_table === 'false'}
                            onChange={() => setPayload(prev => ({ ...prev, stem_surname_table: 'false' }))}
                          />
                          <span className="sliders"></span>
                        </label>
                        <span className="text-sm text-slate-700">แสดงชื่อ-นามสกุล</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="switchs">
                          <input
                            className="chk"
                            type="radio"
                            name="stem_surname_table"
                            checked={payload.stem_surname_table === 'true'}
                            onChange={() => setPayload(prev => ({ ...prev, stem_surname_table: 'true' }))}
                          />
                          <span className="sliders"></span>
                        </label>
                        <span className="text-sm text-slate-700">แสดงชื่อ และนามสกุลแบบซ่อน</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="switchs">
                          <input
                            className="chk"
                            type="radio"
                            name="stem_surname_table"
                            checked={payload.stem_surname_table === 'name'}
                            onChange={() => setPayload(prev => ({ ...prev, stem_surname_table: 'name' }))}
                          />
                          <span className="sliders"></span>
                        </label>
                        <span className="text-sm text-slate-700">ไม่แสดงชื่อ-นามสกุล</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* การซ่อนข้อมูลในป๊อปอัพ */}
                <div className="bg-white rounded-xl border shadow-sm hover:shadow transition-all p-4" style={{ borderColor: '#e2e8f0' }}>
                  <h4 className="font-semibold mb-3" style={{ color: '#043566' }}>การแสดงผลในป๊อปอัพ</h4>
                  <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <label className="switchs">
                          <input
                            className="chk"
                            type="radio"
                            name="stem_surname_popup"
                            checked={payload.stem_surname_popup === 'false'}
                            onChange={() => setPayload(prev => ({ ...prev, stem_surname_popup: 'false' }))}
                          />
                          <span className="sliders"></span>
                        </label>
                        <span className="text-sm text-slate-700">แสดงชื่อ-นามสกุล</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="switchs">
                          <input
                            className="chk"
                            type="radio"
                            name="stem_surname_popup"
                            checked={payload.stem_surname_popup === 'true'}
                            onChange={() => setPayload(prev => ({ ...prev, stem_surname_popup: 'true' }))}
                          />
                          <span className="sliders"></span>
                        </label>
                        <span className="text-sm text-slate-700">แสดงชื่อ และนามสกุลแบบซ่อน</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="switchs">
                          <input
                            className="chk"
                            type="radio"
                            name="stem_surname_popup"
                            checked={payload.stem_surname_popup === 'name'}
                            onChange={() => setPayload(prev => ({ ...prev, stem_surname_popup: 'name' }))}
                          />
                          <span className="sliders"></span>
                        </label>
                        <span className="text-sm text-slate-700">ไม่แสดงชื่อ-นามสกุล</span>
                      </div>
                  </div>
                </div>

       
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex items-center justify-between" style={{ background: 'rgba(4, 53, 102, 0.01)', borderColor: '#e2e8f0' }}>
              <Link
                href="/setting"
                className="px-5 py-2.5 text-slate-600 bg-white border rounded-xl hover:bg-slate-50 shadow-sm hover:shadow transition-all duration-200"
                style={{ borderColor: '#e2e8f0' }}
              >
                ยกเลิก
              </Link>
              
              {/* <button
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2 px-5 py-2.5 text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-md transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>บันทึกการเปลี่ยนแปลง</span>
                  </>
                )}
              </button> */}
            </div>
          </div>
        </form>
      </main>
      <button
        type="button"
        onClick={() => setShowConfirmPopup(true)}
        disabled={isLoading}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full px-5 py-3 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}
        aria-label="บันทึกการเปลี่ยนแปลง"
      >
         {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>บันทึก</span>
                  </>
                )}
      </button>

      {/* Confirmation Popup */}
      {showConfirmPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <Save className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">ยืนยันการบันทึก</h3>
                  <p className="text-sm text-slate-600">คุณต้องการบันทึกการเปลี่ยนแปลงหรือไม่?</p>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-slate-700">
                  การเปลี่ยนแปลงจะถูกบันทึกลงในระบบและจะมีผลทันที
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmPopup(false)}
                  className="flex-1 px-4 py-2.5 text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </div>
                  ) : (
                    'ยืนยัน'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-green-100">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-2">บันทึกข้อมูลสำเร็จ!</h3>
              <p className="text-slate-600 mb-6">
                การเปลี่ยนแปลงได้ถูกบันทึกลงในระบบเรียบร้อยแล้ว
              </p>

              <button
                onClick={() => {
                  setShowSuccessPopup(false);
                }}
                className="w-full px-4 py-2.5 text-white rounded-xl hover:opacity-90 transition-all duration-200 font-medium"
                style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Success Popup */}
      {showUploadSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-green-100">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-2">อัพโหลดสำเร็จ!</h3>
              <p className="text-slate-600 mb-6">
                {uploadMessage}
              </p>

              <button
                onClick={() => {
                  setShowUploadSuccessPopup(false);
                }}
                className="w-full px-4 py-2.5 text-white rounded-xl hover:opacity-90 transition-all duration-200 font-medium"
                style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Error Popup */}
      {showUploadErrorPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-red-100">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-2">เกิดข้อผิดพลาด!</h3>
              <p className="text-slate-600 mb-6 whitespace-pre-wrap break-words">
                {uploadMessage}
              </p>

              <button
                onClick={() => {
                  setShowUploadErrorPopup(false);
                  setUploadMessage('');
                }}
                className="w-full px-4 py-2.5 text-white rounded-xl hover:opacity-90 transition-all duration-200 font-medium"
                style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Selection Popup - แสดงทุก type ยกเว้น duo */}
      {payload.type !== 'duo' && (
        <DepartmentSelectPopup
          isOpen={showDepartmentPopup}
          onClose={() => setShowDepartmentPopup(false)}
          onSelect={() => {
            // Not used in multiSelect mode, but required by component
          }}
          onMultiSelect={(selectedCodes: string[], selectedNames: string[]) => {
            setSelectedDepartmentCodes(selectedCodes);
            // ใช้ selectedNames ที่ส่งมาจาก popup
            const selectedDepts = selectedCodes.map((code, index) => ({
              code,
              name: selectedNames[index] || code
            }));
            setLeftDepartmentNames(selectedDepts);
            setShowDepartmentPopup(false);
          }}
          selectedValues={selectedDepartmentCodes}
          multiSelect={true}
        />
      )}

      {/* Department Selection Popup สำหรับ duo ฝั่งซ้าย */}
      {payload.type === 'duo' && (
        <DepartmentSelectPopup
          isOpen={showLeftDepartmentPopup}
          onClose={() => setShowLeftDepartmentPopup(false)}
          onSelect={() => {
            // Not used in multiSelect mode, but required by component
          }}
          onMultiSelect={(selectedCodes: string[], selectedNames: string[]) => {
            setSelectedLeftDepartmentCodes(selectedCodes);
            // ใช้ selectedNames ที่ส่งมาจาก popup
            const selectedDepts = selectedCodes.map((code, index) => ({
              code,
              name: selectedNames[index] || code
            }));
            setLeftDepartmentNames(selectedDepts);
            setShowLeftDepartmentPopup(false);
          }}
          selectedValues={selectedLeftDepartmentCodes}
          multiSelect={true}
        />
      )}

      {/* Department Selection Popup สำหรับ duo ฝั่งขวา */}
      {payload.type === 'duo' && (
        <DepartmentSelectPopup
          isOpen={showRightDepartmentPopup}
          onClose={() => setShowRightDepartmentPopup(false)}
          onSelect={() => {
            // Not used in multiSelect mode, but required by component
          }}
          onMultiSelect={(selectedCodes: string[], selectedNames: string[]) => {
            setSelectedRightDepartmentCodes(selectedCodes);
            // ใช้ selectedNames ที่ส่งมาจาก popup
            const selectedDepts = selectedCodes.map((code, index) => ({
              code,
              name: selectedNames[index] || code
            }));
            setRightDepartmentNames(selectedDepts);
            setShowRightDepartmentPopup(false);
          }}
          selectedValues={selectedRightDepartmentCodes}
          multiSelect={true}
        />
      )}

      {/* Error Popup */}
      {showErrorPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-red-100">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-2">เกิดข้อผิดพลาด!</h3>
              <p className="text-slate-600 mb-6 whitespace-pre-wrap break-words">
                {errorMessage}
              </p>

              <button
                onClick={() => {
                  setShowErrorPopup(false);
                  setErrorMessage('');
                }}
                className="w-full px-4 py-2.5 text-white rounded-xl hover:opacity-90 transition-all duration-200 font-medium"
                style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

