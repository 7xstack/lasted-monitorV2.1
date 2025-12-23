'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Settings, Edit, Trash2, Plus, Monitor, Home, Eye, FileText } from 'lucide-react';
import { PayloadData, SettingData } from '@/components/setting/types';
import AddScreenModal from '@/components/setting/AddScreenModal';
import SwapModal from '@/components/setting/SwapModal';
import SuccessPopup from '@/components/setting/SuccessPopup';
import ErrorPopup from '@/components/setting/ErrorPopup';


export default function SettingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [settings, setSettings] = useState<SettingData[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [showModalSwap, setShowModalSwap] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ action: '', id: '' });
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [departmentCount, setDepartmentCount] = useState<number>(0);
  const [departmentNames, setDepartmentNames] = useState<Record<string, string>>({});
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('all');

  // State สำหรับ Swap Modal
  const [swapCount, setSwapCount] = useState<number>(0);
  const [swapSelections, setSwapSelections] = useState<string[]>([]);
  const [availableSettings, setAvailableSettings] = useState<SettingData[]>([]);
  const [swapTimeWait, setSwapTimeWait] = useState<number>(20); // default 20 วินาที

  // Check authentication - ตรวจสอบทุกครั้งที่เข้าหน้า setting
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === 'undefined') {
        setIsCheckingAuth(false);
        return;
      }
      
      const authStatus = sessionStorage.getItem('isAuthenticated');
      const isValid = authStatus === 'true';
      
      if (!isValid) {
        // ล้างค่าเก่าที่อาจจะเหลืออยู่
        sessionStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('username');
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        // ใช้ window.location.href เพื่อบังคับ redirect ทันที
        window.location.href = '/login';
        return;
      }
      
      setIsAuthenticated(true);
      setIsCheckingAuth(false);
    };

    // ตรวจสอบทันที
    checkAuth();
    
    // ตรวจสอบเป็นระยะๆ เพื่อป้องกันการแก้ไข sessionStorage
    const intervalId = setInterval(() => {
      if (typeof window === 'undefined') return;
      
      const currentAuthStatus = sessionStorage.getItem('isAuthenticated');
      if (currentAuthStatus !== 'true') {
        sessionStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('username');
        setIsAuthenticated(false);
        window.location.href = '/login';
      }
    }, 500);
    
    return () => clearInterval(intervalId);
  }, [router, pathname]);

  // Fetch settings from database
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const response = await fetch('/api/setting/count');
      const data = await response.json();

      if (data.success && data.data) {
        // ดึงข้อมูล station_l และ station_r จาก /api/setting/{id} สำหรับแต่ละ setting
        const settingsWithStations = await Promise.all(
          data.data.map(async (item: Record<string, unknown>) => {
            try {
              const detailResponse = await fetch(`/api/setting/${item.id}`);
              const detailData = await detailResponse.json();
              
              // ดึง station_l และ station_r จาก API 
              // API ส่ง ...data ซึ่งมี station_l และ station_r อยู่แล้ว
              let stationLeft = '';
              let stationRight = '';
              
              if (detailData.success && detailData.data) {
                // ดึง station_l และ station_r โดยตรงจาก data (เป็น string)
                stationLeft = detailData.data.station_l ? String(detailData.data.station_l) : '';
                stationRight = detailData.data.station_r ? String(detailData.data.station_r) : '';
              }
              
              return {
                id: item.id?.toString() || '',
                type: item.type || 'single',
                n_hospital: item.n_hospital || '',
                n_department: item.department || '',
                head_left: item.head_left || '',
                head_right: item.head_right || '',
                amount_left: item.amount_left || 0,
                amount_right: item.amount_right || 0,
                query_left: item.query_left || '',
                query_right: item.query_right || '',
                station_left: stationLeft,
                station_right: stationRight,
              };
            } catch (error) {
              console.error(`Error fetching detail for setting ${item.id}:`, error);
              // ถ้าเกิด error ให้ใช้ค่า default
              return {
                id: item.id?.toString() || '',
                type: item.type || 'single',
                n_hospital: item.n_hospital || '',
                n_department: item.department || '',
                head_left: item.head_left || '',
                head_right: item.head_right || '',
                amount_left: item.amount_left || 0,
                amount_right: item.amount_right || 0,
                query_left: item.query_left || '',
                query_right: item.query_right || '',
                station_left: '',
                station_right: '',
              };
            }
          })
        );
        
        setSettings(settingsWithStations);
        setDepartmentCount(data.maxId || 0);
        if (settingsWithStations.length > 0 && !selectedId) {
          setSelectedId(settingsWithStations[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [selectedId]);

  // Fetch available settings for Swap Modal
  const fetchAvailableSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/id-setting');
      const data = await response.json();
      if (data.success) {
        setAvailableSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching available settings:', error);
    }
  }, []);

  // Fetch department names
  const fetchDepartmentNames = useCallback(async () => {
    try {
      const response = await fetch('/api/department');
      const data = await response.json();
      if (data.success && data.data) {
        const nameMap: Record<string, string> = {};
        data.data.forEach((dept: { code: string; name: string }) => {
          nameMap[dept.code] = dept.name;
        });
        setDepartmentNames(nameMap);
      }
    } catch (error) {
      console.error('Error fetching department names:', error);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchAvailableSettings();
    fetchDepartmentNames();
  }, [fetchSettings, fetchAvailableSettings, fetchDepartmentNames]);

  // Filter settings by department และเรียงตาม ID
  const filteredSettings = (selectedDepartmentFilter === 'all' 
    ? settings 
    : settings.filter(setting => setting.n_department === selectedDepartmentFilter)
  ).sort((a, b) => {
    const aId = parseInt(a.id) || 0;
    const bId = parseInt(b.id) || 0;
    return aId - bId; // เรียงจากน้อยไปมาก (ตาม ID)
  });

  // Get unique departments from settings
  const uniqueDepartments = Array.from(new Set(settings.map(s => s.n_department).filter(Boolean))).sort();

  // Handle swap count change
  const handleSwapCountChange = (value: string) => {
    const count = parseInt(value) || 0;
    const validCount = Math.max(0, Math.min(10, count)); // อนุญาตให้เป็น 0 ได้ชั่วคราว
    setSwapCount(validCount);
    
    // ปรับขนาด array ของ swapSelections เฉพาะเมื่อ count > 0
    if (validCount > 0) {
      setSwapSelections(prevSelections => {
        const newSelections = [...prevSelections];
        if (validCount > prevSelections.length) {
          // เพิ่มช่องว่างถ้า count มากกว่าเดิม
          for (let i = prevSelections.length; i < validCount; i++) {
            newSelections.push('');
          }
        } else {
          // ตัดส่วนเกินถ้า count น้อยกว่าเดิม
          return newSelections.slice(0, validCount);
        }
        return newSelections;
      });
    } else {
      // ถ้า count เป็น 0 ให้เคลียร์ selections
      setSwapSelections([]);
    }
  };

  // Handle swap selection change
  const handleSwapSelectionChange = (index: number, value: string) => {
    setSwapSelections(prevSelections => {
      const newSelections = [...prevSelections];
      newSelections[index] = value;
      return newSelections;
    });
  };

  // Payload state
  const defaultHospitalName = process.env.NEXT_PUBLIC_HOSPITAL_NAME || 'โรงพยาบาล';
  
  const [payload, setPayload] = useState<PayloadData>({
    type: 'single',
      typeMonitor: '',
      n_hospital: defaultHospitalName,
      n_department: 'ตรวจโรคทั่วไป',
    department: 'ตรวจโรคทั่วไป',
    head_left: 'รอรับบริการ',
    head_right: 'รอรับบริการ',
    urgent_setup: 'ฉุกเฉิน',
    time_wait: 300,
    amount_left: 0,
    amount_right: 0,
    arr_l: false,
    arr_r: false,
    set_descrip: false,
    set_notice: false,
    stem_surname: 'name',
    type_popup: '1',
    stem_popup: 'false',
    stem_surname_popup: 'false',
    stem_surname_table: 'name',
    stem_name: 'name',
    stem_name_table: 'name',
    urgent_color: true,
    status_patient: true,
    status_check: false,
    lock_position: false,
    lock_position_right: false,
    urgent_level: true,
    a_sound: true,
    b_sound: false,
    c_sound: false,
    time_col: true,
    station_left: '',
    station_right: '',
    query_left: '2',
    query_right: '2',
    listPage: '',
    style_voice: 'female',
    voice: '1',
  });

  // Auto-generate ID
  const generateNextId = async () => {
    try {
      const response = await fetch('/api/setting/count');
      const data = await response.json();
      // ใช้ maxId แทน count เพื่อป้องกันการ generate ID ซ้ำ
      const nextId = (data.maxId || 0) + 1;
      setPayload(prev => ({ ...prev, typeMonitor: nextId.toString() }));
    } catch (error) {
      console.error('Error generating ID:', error);
      // Fallback: use timestamp
      setPayload(prev => ({ ...prev, typeMonitor: Date.now().toString() }));
    }
  };

  // ดึงชื่อโรงพยาบาลจาก TOP 1 หรือใช้จาก .env
  const getLatestHospitalName = async (): Promise<string> => {
    const defaultHospitalName = process.env.NEXT_PUBLIC_HOSPITAL_NAME || 'โรงพยาบาล';
    
    try {
      const response = await fetch('/api/setting/count');
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        // ดึง TOP 1 (เรียงตาม id ล่าสุด)
        const sortedData = data.data.sort((a: SettingData, b: SettingData) => {
          const aId = parseInt(a.id) || 0;
          const bId = parseInt(b.id) || 0;
          return aId - bId; // เรียงจากน้อยไปมาก (ตาม ID)
        });
        
        const latestSetting = sortedData[0];
        return latestSetting.n_hospital || defaultHospitalName;
      }
      return defaultHospitalName;
    } catch (error) {
      console.error('Error fetching latest hospital name:', error);
      return defaultHospitalName;
    }
  };

  // Reset form
  const resetForm = () => {
    setPayload({
      type: 'single',
      typeMonitor: '',
      n_hospital: '',
      n_department: '',
      department: '',
      head_left: 'รอรับบริการ',
      head_right: 'รอรับบริการ',
      urgent_setup: 'ฉุกเฉิน',
      time_wait: 0,
      amount_left: 0,
      amount_right: 0,
      arr_l: false,
      arr_r: false,
      set_descrip: false,
      set_notice: false,
      stem_surname: 'name',
      stem_surname_table: 'name',
      stem_name: 'name',
      stem_name_table: 'name',
      type_popup: '1',
      stem_popup: 'false',
      stem_surname_popup: 'false',
      urgent_color: true,
      status_patient: true,
      status_check: false,
      lock_position: false,
      lock_position_right: false,
      urgent_level: true,
      a_sound: true,
      b_sound: false,
      c_sound: false,
      time_col: true,
      station_left: '',
      station_right: '',
      query_left: '2',
      query_right: '2',
      listPage: '',
      style_voice: 'female',
      voice: '1',
    });
    setCurrentStep(1);
  };

  // Handle modal open
  const handleOpenModal = async () => {
    resetForm();
    await generateNextId();
    // ดึงชื่อโรงพยาบาลจาก TOP 1 มาใช้เป็น default
    const latestHospitalName = await getLatestHospitalName();
    setPayload(prev => ({ ...prev, n_hospital: latestHospitalName }));
    setShowModal(true); // เปิด popup
  };
  const handleOpenModalSwap = async () => {
    // Reset swap modal state
    setSwapCount(0);
    setSwapSelections([]);
    setSwapTimeWait(20); // default 20 วินาที
    setShowModalSwap(true);
  };

  // Handle swap submit
  const handleSwapSubmit = async () => {
    setIsLoading(true);
    try {
      // ตรวจสอบว่าเลือก ID ครบทุกตัวแล้วหรือยัง
      if (swapSelections.some(sel => !sel)) {
        setErrorMessage('กรุณาเลือกหน้าจอให้ครบทุกช่อง');
        setShowErrorPopup(true);
        setIsLoading(false);
        setTimeout(() => {
          setShowErrorPopup(false);
        }, 3000);
        return;
      }

      // ดึง ID ล่าสุด + 1
      const countResponse = await fetch('/api/setting/count');
      const countData = await countResponse.json();
      const nextId = (countData.maxId || 0) + 1;

      // สร้าง listPage เป็น comma-separated string
      const listPage = swapSelections.join(',');

      // สร้าง payload สำหรับ Swap
      const swapPayload = {
        type: 'swap',
        typeMonitor: nextId.toString(),
        n_hospital: 'Swap Monitor',
        n_department: 'Swap',
        head_left: '',
        head_right: '',
        urgent_setup: 'ฉุกเฉิน',
        time_wait: swapTimeWait,
        amount_left: 0,
        amount_right: 0,
        arr_l: false,
        arr_r: false,
        set_descrip: false,
        set_notice: false,
        stem_surname: 'name',
        stem_surname_popup: 'false',
        stem_surname_table: 'name',
        stem_name: 'name',
        stem_name_table: 'name',
        stem_name_popup: 'false',
        urgent_color: true,
        status_patient: true,
        status_check: false,
        lock_position: false,
        lock_position_right: false,
        urgent_level: true,
        a_sound: true,
        b_sound: false,
        c_sound: false,
        time_col: true,
        station_left: '',
        station_right: '',
        query_left: '2',
        query_right: '2',
        listPage: listPage,
      };

      // บันทึกลง database
      const response = await fetch('/api/setting/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(swapPayload),
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh data
        await fetchSettings();
        setShowModalSwap(false);
        
        // แสดง success popup
        setSuccessMessage({
          action: 'เพิ่ม',
          id: result.id
        });
        setShowSuccessPopup(true);
        
        // ซ่อน popup อัตโนมัติหลัง 3 วินาที
        setTimeout(() => {
          setShowSuccessPopup(false);
        }, 3000);
      } else {
        setErrorMessage('เกิดข้อผิดพลาด: ' + result.message);
        setShowErrorPopup(true);
        setTimeout(() => {
          setShowErrorPopup(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting swap:', error);
      setErrorMessage('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      setShowErrorPopup(true);
      setTimeout(() => {
        setShowErrorPopup(false);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };


  // Handle submit
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // ใช้ station_left และ station_right จาก payload โดยตรง (เก็บจาก Station ที่เลือกใน AddScreenModal)
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
        station_left: stationLeft,
        station_right: stationRight,
        style_voice: styleVoiceValue
      };

      const response = await fetch('/api/setting/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitPayload),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh data
        await fetchSettings();
        setShowModal(false);

        // แสดง success popup
        setSuccessMessage({
          action: result.action === 'update' ? 'อัปเดต' : 'เพิ่ม',
          id: result.id
        });
        setShowSuccessPopup(true);

        // ซ่อน popup อัตโนมัติหลัง 3 วินาที
        setTimeout(() => {
          setShowSuccessPopup(false);
        }, 3000);
      } else {
        alert('เกิดข้อผิดพลาด: ' + result.message);
      }
    } catch (error) {
      console.error('Error submitting:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm(`คุณต้องการลบหน้าจอ ID: ${id} ใช่หรือไม่?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/setting/delete?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Refresh data
        await fetchSettings();

        // แสดง success popup
        setSuccessMessage({
          action: 'ลบ',
          id: result.id
        });
        setShowSuccessPopup(true);

        // ซ่อน popup อัตโนมัติหลัง 3 วินาที
        setTimeout(() => {
          setShowSuccessPopup(false);
        }, 3000);
      } else {
        alert('เกิดข้อผิดพลาด: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  // Next step
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Previous step
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // ไม่แสดงเนื้อหาจนกว่าจะตรวจสอบ authentication เสร็จ
  if (isCheckingAuth || isAuthenticated === null || isAuthenticated === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#043566', borderTopColor: 'transparent' }}></div>
          <p className="text-slate-600 font-medium">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-slate-50" style={{ backgroundImage: 'linear-gradient(to bottom right, #ffffff, #f8fafc, #f1f5f9)' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b" style={{ borderColor: '#e2e8f0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl shadow-md" style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}>
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: '#043566' }}>การตั้งค่าระบบ</h1>
                <p className="text-sm text-slate-600 mt-1">จัดการการตั้งค่าหน้าจอแสดงผล V3.0.0-beta.20251223</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="https://monitor.aztecthstudio.com/log"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-5 py-2.5 bg-white hover:bg-slate-50 rounded-xl transition-all duration-200 border shadow-sm hover:shadow font-medium"
                style={{ color: '#043566', borderColor: '#e2e8f0' }}
              >
                <FileText className="w-5 h-5" />
                <span>System Logs</span>
              </Link>
              <Link
                href="/"
                className="flex items-center space-x-2 px-5 py-2.5 bg-white hover:bg-slate-50 rounded-xl transition-all duration-200 border shadow-sm hover:shadow font-medium"
                style={{ color: '#043566', borderColor: '#e2e8f0' }}
              >
                <Home className="w-5 h-5" />
                <span>กลับหน้าหลัก</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow p-6 border hover:shadow-md transition-all duration-300" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">จำนวนหน้าจอ</p>
                <p className="text-3xl font-bold mt-2" style={{ color: '#043566' }}>{settings.length}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(4, 53, 102, 0.1)' }}>
                <Monitor className="w-8 h-8" style={{ color: '#043566' }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6 border hover:shadow-md transition-all duration-300" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">แผนกที่ใช้งาน</p>
                <p className="text-3xl font-bold mt-2" style={{ color: '#043566' }}>
                  {departmentCount}
                </p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(4, 53, 102, 0.1)' }}>
                <Settings className="w-8 h-8" style={{ color: '#043566' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
          {/* Table Header */}
          <div className="px-6 py-5 flex items-center justify-between border-b" style={{ background: 'rgba(4, 53, 102, 0.02)', borderColor: '#e2e8f0' }}>
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold" style={{ color: '#043566' }}>รายการหน้าจอแสดงผล</h2>
              {/* Filter by Department */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600">กรองตามแผนก:</label>
                <select
                  value={selectedDepartmentFilter}
                  onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm"
                  style={{ color: '#043566' }}
                >
                  <option value="all">ทั้งหมด</option>
                  {uniqueDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className='flex gap-4'>
              <button
                onClick={handleOpenModalSwap}
                className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:opacity-90 transition-all duration-200 font-medium shadow hover:shadow-md"
                // style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}
              >
                <Plus className="w-5 h-5" />
                <span>เพิ่มหน้าจอสลับ</span>
              </button>
              <button
                onClick={handleOpenModal}
                className="flex items-center space-x-2 px-5 py-2.5 text-white rounded-xl hover:opacity-90 transition-all duration-200 font-medium shadow hover:shadow-md"
                style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}
              >
                <Plus className="w-5 h-5" />
                <span>เพิ่มหน้าจอ</span>
              </button>
            </div>

          </div>

          {/* Cards */}
          <div className="p-6">
            {isLoadingData ? (
              <div className="py-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#043566', borderTopColor: 'transparent' }}></div>
                  <p className="text-slate-600 font-medium">กำลังโหลดข้อมูล...</p>
                </div>
              </div>
            ) : filteredSettings.length === 0 ? (
              <div className="py-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(4, 53, 102, 0.1)' }}>
                    <Monitor className="w-10 h-10" style={{ color: '#043566' }} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-700 mb-2">ไม่พบข้อมูลที่ตรงกับตัวกรอง</p>
                    <p className="text-sm text-slate-500 mb-4">ลองเปลี่ยนตัวกรองหรือเพิ่มหน้าจอใหม่</p>
                    <button
                      onClick={() => setSelectedDepartmentFilter('all')}
                      className="px-6 py-3 text-white rounded-xl hover:opacity-90 transition-all duration-200 font-medium shadow-md"
                      style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}
                    >
                      แสดงทั้งหมด
                    </button>
                  </div>
                </div>
              </div>
            ) : settings.length === 0 ? (
              <div className="py-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(4, 53, 102, 0.1)' }}>
                    <Monitor className="w-10 h-10" style={{ color: '#043566' }} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-700 mb-2">ยังไม่มีข้อมูลหน้าจอ</p>
                    <p className="text-sm text-slate-500 mb-4">เริ่มต้นสร้างหน้าจอแสดงผลแรกของคุณ</p>
                    <button
                      onClick={handleOpenModal}
                      className="px-6 py-3 text-white rounded-xl hover:opacity-90 transition-all duration-200 font-medium shadow-md"
                      style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}
                    >
                      + เพิ่มหน้าจอแรก
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="group relative bg-white rounded-2xl shadow border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    <div className="p-4 border-b" style={{ background: 'linear-gradient(90deg, rgba(4,53,102,0.06), rgba(4,53,102,0.02))', borderColor: '#e2e8f0' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}>
                            <Monitor className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 leading-none">ID</p>
                            <p className="text-base font-bold" style={{ color: '#043566' }}>{setting.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full border shadow-sm"
                            style={{ background: 'rgba(4, 53, 102, 0.05)', color: '#043566', borderColor: '#e2e8f0' }}>
                            {setting.type.toUpperCase()}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border shadow-sm" style={{ background: 'rgba(4, 53, 102, 0.05)', color: '#043566', borderColor: '#e2e8f0' }}>
                            {setting.n_department}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="relative">
                        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
                          <div className="aspect-[16/10] relative flex items-center justify-center bg-gradient-to-br from-white via-blue-50/40 to-slate-50">
                            <div className="text-center px-3">
                              <p className="text-md text-slate-500">{setting.n_hospital}</p>
                              <p className="text-lg font-semibold mt-1" style={{ color: '#043566' }}>
                                {setting.type === 'swap'
                                  ? 'Swap Monitor'
                                  : `${setting.n_department || '-'}`}
                              </p>
                            </div>
                            <div className="pointer-events-none absolute inset-0"
                              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.6) 100%)', opacity: 0.4 }} />
                          </div>
                        </div>
                        <div className="w-12 h-1.5 bg-slate-200 rounded mx-auto mt-3 group-hover:bg-slate-300 transition-colors"></div>
                        <div className="w-24 h-2 bg-slate-300 rounded mx-auto mt-1 group-hover:bg-slate-400 transition-colors"></div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm relative group">
                        {(() => {
                          // คำนวณข้อมูลสำหรับ tooltip (ใช้ร่วมกันทั้งสองส่วน)
                          const leftStations = setting.station_left ? setting.station_left.split(',').map(s => s.trim()).filter(s => s) : [];
                          const rightStations = setting.type === 'duo' && setting.station_right ? setting.station_right.split(',').map(s => s.trim()).filter(s => s) : [];
                          const allStations = [...new Set([...leftStations, ...rightStations])];
                          const tooltipStations = allStations.length > 0 ? allStations.join(', ') : '-';
                          
                          // Split query_left ด้วย comma และแปลงเป็นชื่อแผนก
                          const leftDeptCodes = setting.query_left ? setting.query_left.split(',').map((code: string) => code.trim()).filter((code: string) => code) : [];
                          const leftDeptNames = leftDeptCodes.map((code: string) => departmentNames[code] || code);
                          
                          // สำหรับ duo: Split query_right ด้วย comma และแปลงเป็นชื่อแผนก
                          const rightDeptCodes = setting.type === 'duo' && setting.query_right ? setting.query_right.split(',').map((code: string) => code.trim()).filter((code: string) => code) : [];
                          const rightDeptNames = rightDeptCodes.map((code: string) => departmentNames[code] || code);
                          
                          // รวมชื่อแผนกทั้งหมด (ซ้าย + ขวา) และลบตัวซ้ำ
                          const allDeptNames = [...new Set([...leftDeptNames, ...rightDeptNames])].filter(name => name);
                          const tooltipDeptNames = allDeptNames.length > 0 ? allDeptNames.join(', ') : '-';
                          
                          // ตรวจสอบว่ามีข้อมูลเกิน 2 หรือไม่
                          const hasMoreStations = leftStations.length > 2 || rightStations.length > 2;
                          const hasMoreDepts = allDeptNames.length > 2;
                          const showTooltip = hasMoreStations || hasMoreDepts;
                          
                          return (
                            <>
                              <div>
                                <p className="text-slate-500">จำนวนห้อง</p>
                                {setting.type === 'swap' ? (
                                  <span className="inline-flex px-2 py-1 rounded-lg border shadow-sm text-slate-400" style={{ borderColor: '#e2e8f0' }}>-</span>
                                ) : (
                                  (() => {
                                    // ถ้าซ้ำกันให้แสดงแค่อันเดียว
                                    if (setting.type === 'duo' && leftStations.length > 0 && rightStations.length > 0) {
                                      const leftDisplay = leftStations.length > 2 
                                        ? leftStations.slice(0, 2).join(', ') + '...'
                                        : leftStations.join(', ');
                                      const rightDisplay = rightStations.length > 2 
                                        ? rightStations.slice(0, 2).join(', ') + '...'
                                        : rightStations.join(', ');
                                      
                                      // ตรวจสอบว่าซ้ำกันหรือไม่ (เปรียบเทียบ string)
                                      if (leftDisplay === rightDisplay) {
                                        return (
                                          <span className={`px-2 py-1 rounded-lg font-medium border shadow-sm text-xs ${showTooltip ? 'cursor-help' : ''}`} style={{ background: 'rgba(4,53,102,0.04)', color: '#043566', borderColor: '#e2e8f0' }}>
                                            {leftDisplay || '-'}
                                          </span>
                                        );
                                      }
                                      
                                      // ไม่ซ้ำกัน แสดงทั้งสอง
                                      return (
                                        <div className="flex items-center gap-2 flex-wrap">
                                          {leftDisplay && (
                                            <span className="px-2 py-1 rounded-lg font-medium border shadow-sm text-xs" style={{ background: 'rgba(4,53,102,0.04)', color: '#043566', borderColor: '#e2e8f0' }}>
                                              {leftDisplay}
                                            </span>
                                          )}
                                          {rightDisplay && leftDisplay !== rightDisplay && (
                                            <span className="px-2 py-1 rounded-lg font-medium border shadow-sm text-xs" style={{ background: 'rgba(4,53,102,0.06)', color: '#043566', borderColor: '#e2e8f0' }}>
                                              {rightDisplay}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    }
                                    
                                    // แสดงปกติ (single หรือไม่มีข้อมูล)
                                    const leftDisplay = leftStations.length > 2 
                                      ? leftStations.slice(0, 2).join(', ') + '...'
                                      : leftStations.join(', ') || '-';
                                    
                                    return (
                                      <span className={`px-2 py-1 rounded-lg font-medium border shadow-sm text-xs ${showTooltip ? 'cursor-help' : ''}`} style={{ background: 'rgba(4,53,102,0.04)', color: '#043566', borderColor: '#e2e8f0' }}>
                                        {leftDisplay}
                                      </span>
                                    );
                                  })()
                                )}
                              </div>
                              <div>
                                <p className="text-slate-500">Department ID</p>
                                {setting.type === 'swap' ? (
                                  <span className="inline-flex px-2 py-1 rounded-lg border shadow-sm text-slate-400" style={{ borderColor: '#e2e8f0' }}>-</span>
                                ) : (
                                  (() => {
                                    if (allDeptNames.length === 0) {
                                      return (
                                        <span className="inline-flex px-2 py-1 rounded-lg border shadow-sm text-slate-400" style={{ borderColor: '#e2e8f0' }}>-</span>
                                      );
                                    }
                                    
                                    // แสดงแค่ 2 อันแรก แล้วแสดง "..." ถ้าเกิน 2
                                    const displayDeptNames = allDeptNames.slice(0, 2);
                                    
                                    return (
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {displayDeptNames.map((deptName, index) => (
                                          <span 
                                            key={index}
                                            className="px-2 py-1 rounded-lg font-medium border shadow-sm text-xs" 
                                            style={{ background: 'rgba(4,53,102,0.04)', color: '#043566', borderColor: '#e2e8f0' }}
                                          >
                                            {deptName}
                                          </span>
                                        ))}
                                        {hasMoreDepts && (
                                          <span className="px-2 py-1 rounded-lg font-medium border shadow-sm text-xs cursor-help" style={{ background: 'rgba(4,53,102,0.04)', color: '#043566', borderColor: '#e2e8f0' }}>
                                            ...
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()
                                )}
                              </div>
                              {/* Tooltip ที่แสดงทั้งจำนวนห้องและ Department ID */}
                              {showTooltip && (
                                <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 w-80 p-4 bg-slate-800 text-white text-xs rounded-lg shadow-xl">
                                  {hasMoreStations && (
                                    <div className="mb-3">
                                      <div className="font-semibold mb-1.5 text-sm">จำนวนห้องทั้งหมด:</div>
                                      <div className="text-slate-200 break-words">{tooltipStations}</div>
                                    </div>
                                  )}
                                  {hasMoreDepts && (
                                    <div>
                                      <div className="font-semibold mb-1.5 text-sm">Department ID ทั้งหมด:</div>
                                      <div className="text-slate-200 break-words">{tooltipDeptNames}</div>
                                    </div>
                                  )}
                                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-4 border-transparent border-t-slate-800"></div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="px-4 py-3 border-t" style={{ borderColor: '#e2e8f0' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {setting.type === 'swap' ? (
                            <div
                              className="p-2.5 rounded-xl border shadow-sm opacity-50 cursor-not-allowed"
                              style={{ color: '#94a3b8', borderColor: '#e2e8f0' }}
                              title="ไม่สามารถแก้ไข Swap Monitor ได้"
                            >
                              <Edit className="w-4 h-4" />
                            </div>
                          ) : (
                            <Link
                              href={`/setting/${setting.id}`}
                              className="p-2.5 rounded-xl transition-all duration-200 border shadow-sm hover:shadow hover:bg-slate-50"
                              style={{ color: '#043566', borderColor: '#e2e8f0' }}
                              title="แก้ไข"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                          )}
                          <Link
                            href={`/${setting.type}/${setting.id}`}
                            className="p-2.5 rounded-xl transition-all duration-200 border shadow-sm hover:shadow hover:bg-slate-50"
                            style={{ color: '#043566', borderColor: '#e2e8f0' }}
                            title="ดูจอ"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                        <button
                          onClick={() => handleDelete(setting.id)}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 border shadow-sm hover:shadow"
                          style={{ borderColor: '#e2e8f0' }}
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Table Footer */}
          <div className="px-6 py-4 border-t" style={{ background: 'rgba(4, 53, 102, 0.01)', borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                แสดง <span className="font-bold" style={{ color: '#043566' }}>{filteredSettings.length}</span> จาก <span className="font-bold" style={{ color: '#043566' }}>{settings.length}</span> รายการ
              </p>
              <div className="flex items-center space-x-2">
                <button className="px-4 py-2 text-sm font-medium bg-white border rounded-lg shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200" style={{ color: '#043566', borderColor: '#e2e8f0' }}>
                  ก่อนหน้า
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 shadow hover:shadow-md transition-all duration-200" style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}>
                  ถัดไป
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Swap Modal */}
      <SwapModal
        isOpen={showModalSwap}
        onClose={() => setShowModalSwap(false)}
        swapCount={swapCount}
        swapSelections={swapSelections}
        swapTimeWait={swapTimeWait}
        availableSettings={availableSettings}
        isLoading={isLoading}
        onSwapCountChange={handleSwapCountChange}
        onSwapSelectionChange={handleSwapSelectionChange}
        onSwapTimeWaitChange={setSwapTimeWait}
        onSubmit={handleSwapSubmit}
      />
      {/* Add Screen Modal */}
      <AddScreenModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentStep={currentStep}
        payload={payload}
        setPayload={setPayload}
        isLoading={isLoading}
        onPrevStep={prevStep}
        onNextStep={nextStep}
        onSubmit={handleSubmit}
      />

      {/* Error Popup */}
      <ErrorPopup
        isOpen={showErrorPopup}
        onClose={() => setShowErrorPopup(false)}
        message={errorMessage}
      />

      {/* Success Popup */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        action={successMessage.action}
        id={successMessage.id}
      />
    </div>
  );
}
