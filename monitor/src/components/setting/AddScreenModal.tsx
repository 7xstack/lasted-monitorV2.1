'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Save, Venus, Mars, Plus, Volume2, Info } from 'lucide-react';
import Link from 'next/link';
import { PayloadData } from './types';
import DepartmentSelectPopup from '@/components/DepartmentSelectPopup';
import StationSelectPopup from '@/components/StationSelectPopup';
import { playGoogleTTS, THAI_VOICES } from '@/lib/google-tts';

interface AddScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
  payload: PayloadData;
  setPayload: React.Dispatch<React.SetStateAction<PayloadData>>;
  isLoading: boolean;
  onPrevStep: () => void;
  onNextStep: () => void;
  onSubmit: () => void;
}

export default function AddScreenModal({
  isOpen,
  onClose,
  currentStep,
  payload,
  setPayload,
  isLoading,
  onPrevStep,
  onNextStep,
  onSubmit,
}: AddScreenModalProps) {
  const [leftStations, setLeftStations] = useState<Array<{ station_name: string }>>([]);
  const [rightStations, setRightStations] = useState<Array<{ station_name: string }>>([]);
  const [selectedLeftStations, setSelectedLeftStations] = useState<string[]>([]);
  const [selectedRightStations, setSelectedRightStations] = useState<string[]>([]);
  const [showDepartmentPopup, setShowDepartmentPopup] = useState(false);
  const [showLeftDepartmentPopup, setShowLeftDepartmentPopup] = useState(false);
  const [showRightDepartmentPopup, setShowRightDepartmentPopup] = useState(false);
  const [showLeftStationPopup, setShowLeftStationPopup] = useState(false);
  const [showRightStationPopup, setShowRightStationPopup] = useState(false);
  const [selectedDepartmentCode, setSelectedDepartmentCode] = useState<string>('');
  const [selectedLeftDepartmentCode, setSelectedLeftDepartmentCode] = useState<string>('');
  const [selectedRightDepartmentCode, setSelectedRightDepartmentCode] = useState<string>('');
  const [leftDepartmentName, setLeftDepartmentName] = useState<string>('');
  const [rightDepartmentName, setRightDepartmentName] = useState<string>('');
  const [isLoadingStep1, setIsLoadingStep1] = useState(false);
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false);

  // ฟังก์ชันสำหรับหา voice candidates
  const getVoiceCandidates = (value: string | null | undefined): string[] => {
    const maleCandidates = [
      THAI_VOICES.STANDARD_A,
      THAI_VOICES.STANDARD_C,
      THAI_VOICES.STANDARD_B,
    ].filter(Boolean);

    const femaleCandidates = [
      THAI_VOICES.NEURAL2_C,
      THAI_VOICES.STANDARD_B,
      THAI_VOICES.STANDARD_A,
    ].filter(Boolean);

    if (value === 'male') {
      return maleCandidates;
    } else if (value === 'female') {
      return femaleCandidates;
    }
    return [];
  };

  // ฟังก์ชันสำหรับเล่นเสียงตัวอย่าง (ใช้ style_voice จาก payload)
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

  // เมื่อเลือกแผนกแล้ว ให้ดึง station และตั้งค่า Department ID (ทุก type ยกเว้น duo)
  useEffect(() => {
    if (payload.type !== 'duo' && selectedDepartmentCode) {
      fetchStations(selectedDepartmentCode, 'left');
      // ตั้งค่า Department ID เป็น code ของแผนก
      setPayload(prev => ({ 
        ...prev, 
        query_left: selectedDepartmentCode
      }));
      // Reset selected stations เมื่อเปลี่ยนแผนก
      setSelectedLeftStations([]);
      
      // ดึงชื่อแผนก
      const fetchDepartmentName = async () => {
        try {
          const response = await fetch('/api/department');
          const data = await response.json();
          if (data.success && data.data) {
            const dept = data.data.find((d: { code: string; name: string }) => d.code === selectedDepartmentCode);
            if (dept) {
              setLeftDepartmentName(dept.name);
            }
          }
        } catch (error) {
          console.error('Error fetching department name:', error);
        }
      };
      fetchDepartmentName();
    } else if (payload.type !== 'duo' && !selectedDepartmentCode) {
      setLeftStations([]);
      setSelectedLeftStations([]);
      setLeftDepartmentName('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDepartmentCode, payload.type]);

  // สำหรับ duo: เมื่อเลือกแผนกฝั่งซ้าย
  useEffect(() => {
    if (payload.type === 'duo' && selectedLeftDepartmentCode) {
      fetchStations(selectedLeftDepartmentCode, 'left');
      // ตั้งค่า Department ID ฝั่งซ้าย (department_load)
      setPayload(prev => ({ 
        ...prev, 
        query_left: selectedLeftDepartmentCode
      }));
      setSelectedLeftStations([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeftDepartmentCode, payload.type]);

  // สำหรับ duo: เมื่อเลือกแผนกฝั่งขวา
  useEffect(() => {
    if (payload.type === 'duo' && selectedRightDepartmentCode) {
      fetchStations(selectedRightDepartmentCode, 'right');
      // ตั้งค่า Department ID ฝั่งขวา (department_room_load)
      setPayload(prev => ({ 
        ...prev, 
        query_right: selectedRightDepartmentCode
      }));
      setSelectedRightStations([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRightDepartmentCode, payload.type]);

  // โหลด selected stations และ department จาก payload เมื่อเปิด modal
  useEffect(() => {
    if (isOpen && currentStep === 1) {
      setIsLoadingStep1(true);
      
      const loadAllData = async () => {
        try {
          // โหลด stations
          if (payload.station_left) {
            const splitLeft = payload.station_left.split(',');
            const filteredLeft = splitLeft.filter(s => s.trim() !== '');
            setSelectedLeftStations(filteredLeft);
          }
          if (payload.station_right) {
            const splitRight = payload.station_right.split(',');
            const filteredRight = splitRight.filter(s => s.trim() !== '');
            setSelectedRightStations(filteredRight);
          }
          
          // สำหรับ single, swap, ER: โหลด department code และ fetch stations
          if (payload.type !== 'duo' && payload.query_left) {
            setSelectedDepartmentCode(payload.query_left);
            await fetchStations(payload.query_left, 'left');
            // ดึงชื่อแผนก
            try {
              const response = await fetch('/api/department');
              const data = await response.json();
              if (data.success && data.data) {
                const dept = data.data.find((d: { code: string; name: string }) => d.code === payload.query_left);
                if (dept) {
                  setLeftDepartmentName(dept.name);
                }
              }
            } catch (error) {
              console.error('Error fetching department name:', error);
            }
          }
          
          // สำหรับ duo: โหลด department codes และ fetch stations
          if (payload.type === 'duo') {
            // ดึงข้อมูลแผนกทั้งหมดครั้งเดียว
            let departments: Array<{ code: string; name: string }> = [];
            try {
              const response = await fetch('/api/department');
              const data = await response.json();
              if (data.success && data.data) {
                departments = data.data;
              }
            } catch (error) {
              console.error('Error fetching departments:', error);
            }

            const promises: Promise<void>[] = [];

            if (payload.query_left) {
              setSelectedLeftDepartmentCode(payload.query_left);
              promises.push(fetchStations(payload.query_left, 'left'));
              // หาชื่อแผนกจาก code
              const dept = departments.find((d) => d.code === payload.query_left);
              if (dept) {
                setLeftDepartmentName(dept.name);
              }
            }
            if (payload.query_right) {
              setSelectedRightDepartmentCode(payload.query_right);
              promises.push(fetchStations(payload.query_right, 'right'));
              // หาชื่อแผนกจาก code
              const dept = departments.find((d) => d.code === payload.query_right);
              if (dept) {
                setRightDepartmentName(dept.name);
              }
            }

            await Promise.all(promises);
          }
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setIsLoadingStep1(false);
        }
      };

      loadAllData();
    } else if (isOpen && currentStep !== 1) {
      // สำหรับ step อื่นๆ โหลดข้อมูลตามปกติ
      if (payload.station_left) {
        const splitLeft = payload.station_left.split(',');
        const filteredLeft = splitLeft.filter(s => s.trim() !== '');
        setSelectedLeftStations(filteredLeft);
      }
      if (payload.station_right) {
        const splitRight = payload.station_right.split(',');
        const filteredRight = splitRight.filter(s => s.trim() !== '');
        setSelectedRightStations(filteredRight);
      }
      
      if (payload.type !== 'duo' && payload.query_left) {
        setSelectedDepartmentCode(payload.query_left);
        fetchStations(payload.query_left, 'left');
        const loadDepartmentName = async () => {
          try {
            const response = await fetch('/api/department');
            const data = await response.json();
            if (data.success && data.data) {
              const dept = data.data.find((d: { code: string; name: string }) => d.code === payload.query_left);
              if (dept) {
                setLeftDepartmentName(dept.name);
              }
            }
          } catch (error) {
            console.error('Error fetching department name:', error);
          }
        };
        loadDepartmentName();
      }
      
      if (payload.type === 'duo') {
        const loadDepartmentNames = async () => {
          let departments: Array<{ code: string; name: string }> = [];
          try {
            const response = await fetch('/api/department');
            const data = await response.json();
            if (data.success && data.data) {
              departments = data.data;
            }
          } catch (error) {
            console.error('Error fetching departments:', error);
          }

          if (payload.query_left) {
            setSelectedLeftDepartmentCode(payload.query_left);
            fetchStations(payload.query_left, 'left');
            const dept = departments.find((d) => d.code === payload.query_left);
            if (dept) {
              setLeftDepartmentName(dept.name);
            }
          }
          if (payload.query_right) {
            setSelectedRightDepartmentCode(payload.query_right);
            fetchStations(payload.query_right, 'right');
            const dept = departments.find((d) => d.code === payload.query_right);
            if (dept) {
              setRightDepartmentName(dept.name);
            }
          }
        };
        loadDepartmentNames();
      }
    }
  }, [isOpen, currentStep, payload.station_left, payload.station_right, payload.query_left, payload.query_right, payload.type]);

  const fetchStations = async (departmentCode: string, side: 'left' | 'right' | 'both' = 'both'): Promise<void> => {
    try {
      const response = await fetch(`/api/station?department_code=${encodeURIComponent(departmentCode)}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        if (side === 'left' || side === 'both') {
          setLeftStations(data.data);
        }
        if (side === 'right' || side === 'both') {
          setRightStations(data.data);
        }
      } else {
        if (side === 'left' || side === 'both') {
          setLeftStations([]);
        }
        if (side === 'right' || side === 'both') {
          setRightStations([]);
        }
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      if (side === 'left' || side === 'both') {
        setLeftStations([]);
      }
      if (side === 'right' || side === 'both') {
        setRightStations([]);
      }
    }
  };

  // อัปเดต station_left และ amount_left เมื่อเลือก checkbox
  useEffect(() => {
    const filteredStations = selectedLeftStations.filter(s => s && s.trim() !== '');
    const stationValue = filteredStations.length > 0 ? filteredStations.join(',') : '';
    setPayload(prev => ({ 
      ...prev, 
      station_left: stationValue,
      amount_left: filteredStations.length // อัปเดตจำนวนห้องตามจำนวน station ที่เลือก
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeftStations]);

  // อัปเดต station_right และ amount_right เมื่อเลือก checkbox
  useEffect(() => {
    const filteredStations = selectedRightStations.filter(s => s && s.trim() !== '');
    const stationValue = filteredStations.length > 0 ? filteredStations.join(',') : '';
    setPayload(prev => ({ 
      ...prev, 
      station_right: stationValue,
      amount_right: filteredStations.length // อัปเดตจำนวนห้องตามจำนวน station ที่เลือก
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRightStations]);

  const handleLeftStationToggle = (stationName: string) => {
    setSelectedLeftStations(prev => {
      return prev.includes(stationName)
        ? prev.filter(s => s !== stationName)
        : [...prev, stationName];
    });
  };

  const handleRightStationToggle = (stationName: string) => {
    setSelectedRightStations(prev => {
      return prev.includes(stationName)
        ? prev.filter(s => s !== stationName)
        : [...prev, stationName];
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
          {/* Modal Header */}
          <div className="px-6 py-5 flex items-center justify-between border-b" style={{ background: 'rgba(4, 53, 102, 0.02)', borderColor: '#e2e8f0' }}>
            <h2 className="text-xl font-bold" style={{ color: '#043566' }}>เพิ่มหน้าจอใหม่</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 text-2xl transition-colors"
            >
              ×
            </button>
          </div>

          {/* Progress Bar */}
          <div className="bg-white px-6 py-4 border-b" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: '#043566' }}>ขั้นตอนที่ {currentStep} จาก 3</span>
              <div className="flex space-x-2">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className="w-8 h-2 rounded-full transition-all duration-300 shadow-sm"
                    style={{
                      background: step <= currentStep ? '#043566' : '#e2e8f0'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <>
                {isLoadingStep1 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: '#043566', borderTopColor: 'transparent' }}></div>
                    <p className="text-slate-600 font-medium">กำลังโหลดข้อมูล...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#043566' }}>ข้อมูลพื้นฐาน</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">ID หน้าจอ</label>
                    <input
                      type="text"
                      value={payload.typeMonitor}
                      onChange={(e) => setPayload(prev => ({ ...prev, typeMonitor: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                      placeholder="เช่น 201"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-slate-700">ประเภทหน้าจอ</label>
                      <Link
                        href="/preview"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                        title="ดูตัวอย่างหน้าจอ"
                      >
                        <Info className="w-4 h-4" />
                      </Link>
                    </div>
                    <select
                      value={payload.type}
                      onChange={(e) => setPayload(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-white"
                    >
                      <option value="single">Single</option>
                      <option value="duo">Duo</option>
                      <option value="swap">Swap</option>
                      <option value="er">ER</option>
                      <option value="triple">Triple</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">ชื่อโรงพยาบาล</label>
                    <input
                      type="text"
                      value={payload.n_hospital}
                      onChange={(e) => setPayload(prev => ({ ...prev, n_hospital: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">แผนก</label>
                    <input
                      type="text"
                      value={payload.n_department}
                      onChange={(e) => setPayload(prev => ({ ...prev, n_department: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                      placeholder="พิมพ์ชื่อแผนก"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">หัวกำลังรับบริการ (ซ้าย)</label>
                    <input
                      type="text"
                      value={payload.head_left}
                      onChange={(e) => setPayload(prev => ({ ...prev, head_left: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                    />
                  </div>

                  {payload.type === 'duo' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">หัวกำลังรับบริการ (ขวา)</label>
                      <input
                        type="text"
                        value={payload.head_right}
                        onChange={(e) => setPayload(prev => ({ ...prev, head_right: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                      />
                    </div>
                  )}

                  {/* <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">เวลารอ (วินาที)</label>
                    <input
                      type="number"
                      value={payload.time_wait}
                      onChange={(e) => setPayload(prev => ({ ...prev, time_wait: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                    />
                  </div> */}
                </div>
                  </div>
                )}
              </>
            )}

            {/* Step 2: Table Settings */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#043566' }}>การตั้งค่าตาราง</h3>

                <div className={`grid grid-cols-1 ${payload.type === 'duo' ? 'md:grid-cols-2' : ''} gap-6`}>
                  {/* ฝั่งซ้าย */}
                  <div className="space-y-4">
                    <div className="p-4 border-2 rounded-xl" style={{ borderColor: '#e2e8f0', background: 'rgba(4, 53, 102, 0.02)' }}>
                      <h4 className="font-semibold mb-4 flex items-center space-x-2" style={{ color: '#043566' }}>
                        <ArrowLeft className="w-5 h-5" />
                        <span>ตาราง {payload.type === 'duo' ? '(ซ้าย)' : ''}</span>
                      </h4>

                      {/* Department Selection - แสดงทุก type ยกเว้น duo */}
                      {payload.type !== 'duo' && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">แผนก</label>
                          <button
                            type="button"
                            onClick={() => setShowDepartmentPopup(true)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-left bg-white hover:bg-slate-50"
                          >
                            {leftDepartmentName || 'เลือกแผนก'}
                          </button>
                        </div>
                      )}

                      {/* Department Selection สำหรับ duo ฝั่งซ้าย */}
                      {payload.type === 'duo' && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">แผนก (ซ้าย)</label>
                          <button
                            type="button"
                            onClick={() => setShowLeftDepartmentPopup(true)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-left bg-white hover:bg-slate-50"
                          >
                            {leftDepartmentName || 'เลือกแผนก'}
                          </button>
                        </div>
                      )}

                      {/* Station Selection */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          เลือก Station (ซ้าย)
                        </label>
                        {!leftDepartmentName && !selectedLeftDepartmentCode ? (
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
                            {leftStations.map((station) => {
                              const isSelected = selectedLeftStations.includes(station.station_name);
                              return (
                                <label
                                  key={station.station_name}
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
                        )}
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Department ID {payload.type === 'duo' ? '(ซ้าย) - department_load' : ''}
                        </label>
                        <input
                          type="text"
                          value={payload.query_left}
                          readOnly
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-600 cursor-not-allowed"
                          placeholder="จะถูกตั้งค่าอัตโนมัติจากแผนกที่เลือก"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Department ID จะถูกตั้งค่าอัตโนมัติจาก code ของแผนกที่เลือก
                          {payload.type === 'duo' && ' (department_load)'}
                        </p>
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

                        {/* Department Selection สำหรับ duo ฝั่งขวา */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">แผนก (ขวา)</label>
                          <button
                            type="button"
                            onClick={() => setShowRightDepartmentPopup(true)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-left bg-white hover:bg-slate-50"
                          >
                            {rightDepartmentName || 'เลือกแผนก'}
                          </button>
                        </div>

                        {/* Station Selection */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            เลือก Station (ขวา)
                          </label>
                          {!rightDepartmentName ? (
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
                              {rightStations.map((station) => {
                                const isSelected = selectedRightStations.includes(station.station_name);
                                return (
                                  <label
                                    key={station.station_name}
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
                          )}
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Department ID (ขวา) - department_room_load</label>
                          <input
                            type="text"
                            value={payload.query_right}
                            readOnly
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-600 cursor-not-allowed"
                            placeholder="จะถูกตั้งค่าอัตโนมัติจากแผนกที่เลือก"
                          />
                          <p className="text-xs text-slate-500 mt-1">Department ID จะถูกตั้งค่าอัตโนมัติจาก code ของแผนกที่เลือก (department_room_load)</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Display Settings */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#043566' }}>การตั้งค่าการแสดงผล</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                      ].map((item) => (
                        <div key={item.key} className="flex items-center space-x-3">
                          <div className="switch">
                            <input
                              id={`toggle-${item.key}`}
                              type="checkbox"
                              checked={payload[item.key as keyof PayloadData] as boolean}
                              onChange={(e) => setPayload(prev => ({ ...prev, [item.key]: e.target.checked }))}
                            />
                            <label className="slider" htmlFor={`toggle-${item.key}`}></label>
                          </div>
                          <span className="text-sm text-slate-700">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

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
                            onChange={() => setPayload(prev => ({
                              ...prev,
                              voice: '3',
                              type_popup: '3',
                              a_sound: true,
                              b_sound: false,
                              c_sound: false
                            }))}
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
                            name="voice"
                            checked={payload.voice === '2'}
                            onChange={() => setPayload(prev => ({
                              ...prev,
                              voice: '2',
                              type_popup: '2',
                              a_sound: false,
                              b_sound: true,
                              c_sound: false
                            }))}
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
                            onChange={() => setPayload(prev => ({
                              ...prev,
                              voice: '1',
                              type_popup: '1',
                              a_sound: false,
                              b_sound: false,
                              c_sound: true
                            }))}
                          />
                          <span className="sliders"></span>
                        </label>
                        <span className="text-sm text-slate-700">คิว</span>
                      </div>
                    </div>
                  </div>

                  {/* การแสดงข้อมูลเพิ่มเติม */}
                  <div className="bg-white rounded-xl border shadow-sm hover:shadow transition-all p-4" style={{ borderColor: '#e2e8f0' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-semibold" style={{ color: '#043566' }}>การแสดงข้อมูลเพิ่มเติม</h4>
                      <Link
                        href="/preview"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                        title="ดูตัวอย่างหน้าจอ"
                      >
                        <Info className="w-4 h-4" />
                      </Link>
                    </div>
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
                    <div className="flex flex-wrap items-center justify-center gap-6 mb-4">
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
                    {/* ปุ่มเล่นเสียงตัวอย่าง */}
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

                {/* Hide Settings */}
                <div className="mt-8">
                  <h4 className="font-medium text-blue-800 mb-4">การตั้งค่าการซ่อนข้อมูล</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* การซ่อนข้อมูลในห้อง */}
                    <div className="bg-white rounded-xl border shadow-sm hover:shadow transition-all p-4" style={{ borderColor: '#e2e8f0' }}>
                      <h4 className="font-semibold mb-3" style={{ color: '#043566' }}>การซ่อนข้อมูลในกำลังรับบริการ</h4>
                      <div className="space-y-3">
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

                    {/* การซ่อนข้อมูลในตาราง */}
                    <div className="bg-white rounded-xl border shadow-sm hover:shadow transition-all p-4" style={{ borderColor: '#e2e8f0' }}>
                      <h4 className="font-semibold mb-3" style={{ color: '#043566' }}>การซ่อนข้อมูลในรอรับบริการ</h4>
                      <div className="space-y-3">
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

                    {/* การแสดงผลในป๊อปอัพ */}
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
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t flex items-center justify-between" style={{ background: 'rgba(4, 53, 102, 0.01)', borderColor: '#e2e8f0' }}>
            <button
              onClick={onPrevStep}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-5 py-2.5 text-slate-600 bg-white border rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all duration-200"
              style={{ borderColor: '#e2e8f0' }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ก่อนหน้า</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-slate-600 bg-white border rounded-xl hover:bg-slate-50 shadow-sm hover:shadow transition-all duration-200"
                style={{ borderColor: '#e2e8f0' }}
              >
                ยกเลิก
              </button>

              {currentStep < 3 ? (
                <button
                  onClick={onNextStep}
                  className="flex items-center space-x-2 px-5 py-2.5 text-white rounded-xl hover:opacity-90 shadow hover:shadow-md transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}
                >
                  <span>ถัดไป</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onSubmit}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-5 py-2.5 text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-md transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Department Selection Popup - แสดงทุก type ยกเว้น duo */}
      {payload.type !== 'duo' && (
        <DepartmentSelectPopup
          isOpen={showDepartmentPopup}
          onClose={() => setShowDepartmentPopup(false)}
          onSelect={(departmentCode: string, departmentName: string) => {
            setSelectedDepartmentCode(departmentCode);
            setLeftDepartmentName(departmentName);
            setShowDepartmentPopup(false);
          }}
          currentValue={leftDepartmentName}
        />
      )}

      {/* Department Selection Popup สำหรับ duo ฝั่งซ้าย */}
      {payload.type === 'duo' && (
        <DepartmentSelectPopup
          isOpen={showLeftDepartmentPopup}
          onClose={() => setShowLeftDepartmentPopup(false)}
          onSelect={(departmentCode: string, departmentName: string) => {
            setSelectedLeftDepartmentCode(departmentCode);
            setLeftDepartmentName(departmentName);
            setShowLeftDepartmentPopup(false);
          }}
          currentValue={leftDepartmentName}
        />
      )}

      {/* Department Selection Popup สำหรับ duo ฝั่งขวา */}
      {payload.type === 'duo' && (
        <DepartmentSelectPopup
          isOpen={showRightDepartmentPopup}
          onClose={() => setShowRightDepartmentPopup(false)}
          onSelect={(departmentCode: string, departmentName: string) => {
            setSelectedRightDepartmentCode(departmentCode);
            setRightDepartmentName(departmentName);
            setShowRightDepartmentPopup(false);
          }}
          currentValue={rightDepartmentName}
        />
      )}

      {/* Station Selection Popup ฝั่งซ้าย */}
      <StationSelectPopup
        isOpen={showLeftStationPopup}
        onClose={() => setShowLeftStationPopup(false)}
        onSelect={(selectedStations: string[]) => {
          setSelectedLeftStations(selectedStations);
        }}
        availableStations={leftStations}
        selectedStations={selectedLeftStations}
        departmentName={payload.type === 'duo' ? leftDepartmentName : leftDepartmentName}
      />

      {/* Station Selection Popup ฝั่งขวา */}
      {payload.type === 'duo' && (
        <StationSelectPopup
          isOpen={showRightStationPopup}
          onClose={() => setShowRightStationPopup(false)}
          onSelect={(selectedStations: string[]) => {
            setSelectedRightStations(selectedStations);
          }}
          availableStations={rightStations}
          selectedStations={selectedRightStations}
          departmentName={rightDepartmentName}
        />
      )}
    </>
  );
}

