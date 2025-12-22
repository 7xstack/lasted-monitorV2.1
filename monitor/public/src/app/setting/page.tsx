'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Settings, Edit, Trash2, Plus, Monitor, Home, Eye } from 'lucide-react';
import { PayloadData, SettingData } from '@/components/setting/types';
import AddScreenModal from '@/components/setting/AddScreenModal';
import SwapModal from '@/components/setting/SwapModal';
import SuccessPopup from '@/components/setting/SuccessPopup';
import ErrorPopup from '@/components/setting/ErrorPopup';


export default function SettingPage() {
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

  // State สำหรับ Swap Modal
  const [swapCount, setSwapCount] = useState<number>(0);
  const [swapSelections, setSwapSelections] = useState<string[]>([]);
  const [availableSettings, setAvailableSettings] = useState<SettingData[]>([]);
  const [swapTimeWait, setSwapTimeWait] = useState<number>(2000); // default 20 วินาที (2000ms * 10 = 20000ms)


  // Fetch settings from database
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const response = await fetch('/api/setting/count');
      const data = await response.json();

      if (data.success && data.data) {
        const formattedSettings: SettingData[] = data.data.map((item: Record<string, unknown>) => ({
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
        }));
        setSettings(formattedSettings);
        setDepartmentCount(data.maxId || 0);
        if (formattedSettings.length > 0 && !selectedId) {
          setSelectedId(formattedSettings[0].id);
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

  useEffect(() => {
    fetchSettings();
    fetchAvailableSettings();
  }, [fetchSettings, fetchAvailableSettings]);

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
  const [payload, setPayload] = useState<PayloadData>({
    type: 'single',
      typeMonitor: '',
      n_hospital: 'โรงพยาบาล',
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

  // ดึงชื่อโรงพยาบาลจาก TOP 1
  const getLatestHospitalName = async (): Promise<string> => {
    try {
      const response = await fetch('/api/setting/count');
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        // ดึง TOP 1 (เรียงตาม id ล่าสุด)
        const sortedData = data.data.sort((a: SettingData, b: SettingData) => {
          const aId = parseInt(a.id) || 0;
          const bId = parseInt(b.id) || 0;
          return bId - aId; // เรียงจากมากไปน้อย
        });
        
        const latestSetting = sortedData[0];
        return latestSetting.n_hospital || 'โรงพยาบาล';
      }
      return 'โรงพยาบาล';
    } catch (error) {
      console.error('Error fetching latest hospital name:', error);
      return 'โรงพยาบาล';
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
    setSwapTimeWait(2000); // default 20 วินาที
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
                <p className="text-sm text-slate-600 mt-1">จัดการการตั้งค่าหน้าจอแสดงผล</p>
              </div>
            </div>
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

          <div className="bg-white rounded-2xl shadow p-6 border hover:shadow-md transition-all duration-300" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">หน้าจอที่เลือก</p>
                <p className="text-3xl font-bold mt-2" style={{ color: '#043566' }}>{selectedId || '-'}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(4, 53, 102, 0.1)' }}>
                <Monitor className="w-8 h-8" style={{ color: '#043566' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
          {/* Table Header */}
          <div className="px-6 py-5 flex items-center justify-between border-b" style={{ background: 'rgba(4, 53, 102, 0.02)', borderColor: '#e2e8f0' }}>
            <h2 className="text-xl font-bold" style={{ color: '#043566' }}>รายการหน้าจอแสดงผล</h2>
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
                {settings.map((setting) => (
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

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-slate-500">จำนวนห้อง</p>
                          {setting.type === 'swap' ? (
                            <span className="inline-flex px-2 py-1 rounded-lg border shadow-sm text-slate-400" style={{ borderColor: '#e2e8f0' }}>-</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded-lg font-medium border shadow-sm" style={{ background: 'rgba(4,53,102,0.04)', color: '#043566', borderColor: '#e2e8f0' }}>
                                L: {setting.amount_left}
                              </span>
                              {setting.type === 'duo' && (
                                <span className="px-2 py-1 rounded-lg font-medium border shadow-sm" style={{ background: 'rgba(4,53,102,0.06)', color: '#043566', borderColor: '#e2e8f0' }}>
                                  R: {setting.amount_right}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-slate-500">Department ID</p>
                          {setting.type === 'swap' ? (
                            <span className="inline-flex px-2 py-1 rounded-lg border shadow-sm text-slate-400" style={{ borderColor: '#e2e8f0' }}>-</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded-lg font-medium border shadow-sm" style={{ background: 'rgba(4,53,102,0.04)', color: '#043566', borderColor: '#e2e8f0' }}>
                                L: {setting.query_left}
                              </span>
                              {setting.type === 'duo' && (
                                <span className="px-2 py-1 rounded-lg font-medium border shadow-sm" style={{ background: 'rgba(4,53,102,0.06)', color: '#043566', borderColor: '#e2e8f0' }}>
                                  R: {setting.query_right}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-3 border-t" style={{ borderColor: '#e2e8f0' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/setting/${setting.id}`}
                            className="p-2.5 rounded-xl transition-all duration-200 border shadow-sm hover:shadow hover:bg-slate-50"
                            style={{ color: '#043566', borderColor: '#e2e8f0' }}
                            title="แก้ไข"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
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
                แสดง <span className="font-bold" style={{ color: '#043566' }}>{settings.length}</span> รายการ
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
