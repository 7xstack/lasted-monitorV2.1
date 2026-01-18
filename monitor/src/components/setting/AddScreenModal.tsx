'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Save, Venus, Mars, Plus, Volume2, Info, X } from 'lucide-react';
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
  const [leftStations, setLeftStations] = useState<Array<{ station_name: string; department_code: string }>>([]);
  const [rightStations, setRightStations] = useState<Array<{ station_name: string; department_code: string }>>([]);
  const [selectedLeftStations, setSelectedLeftStations] = useState<string[]>([]);
  const [selectedRightStations, setSelectedRightStations] = useState<string[]>([]);
  const [showDepartmentPopup, setShowDepartmentPopup] = useState(false);
  const [showLeftDepartmentPopup, setShowLeftDepartmentPopup] = useState(false);
  const [showRightDepartmentPopup, setShowRightDepartmentPopup] = useState(false);
  const [showLeftStationPopup, setShowLeftStationPopup] = useState(false);
  const [showRightStationPopup, setShowRightStationPopup] = useState(false);
  const [selectedDepartmentCodes, setSelectedDepartmentCodes] = useState<string[]>([]);
  const [selectedLeftDepartmentCodes, setSelectedLeftDepartmentCodes] = useState<string[]>([]);
  const [selectedRightDepartmentCodes, setSelectedRightDepartmentCodes] = useState<string[]>([]);
  const [leftDepartmentNames, setLeftDepartmentNames] = useState<Array<{ code: string; name: string }>>([]);
  const [rightDepartmentNames, setRightDepartmentNames] = useState<Array<{ code: string; name: string }>>([]);
  const [allDepartments, setAllDepartments] = useState<Array<{ code: string; name: string }>>([]);
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

  // โหลดข้อมูลแผนกทั้งหมดเมื่อเปิด modal
  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen]);

  // อัพเดต department names เมื่อ allDepartments มีข้อมูลและมี selected codes
  useEffect(() => {
    if (allDepartments.length > 0) {
      // สำหรับ single, swap, ER
      if (payload.type !== 'duo' && selectedDepartmentCodes.length > 0 && leftDepartmentNames.length === 0) {
        const selectedDepts = allDepartments.filter(dept => 
          selectedDepartmentCodes.includes(String(dept.code))
        );
        setLeftDepartmentNames(selectedDepts);
      }
      // สำหรับ duo left
      if (payload.type === 'duo' && selectedLeftDepartmentCodes.length > 0 && leftDepartmentNames.length === 0) {
        const selectedDepts = allDepartments.filter(dept => 
          selectedLeftDepartmentCodes.includes(String(dept.code))
        );
        setLeftDepartmentNames(selectedDepts);
      }
      // สำหรับ duo right
      if (payload.type === 'duo' && selectedRightDepartmentCodes.length > 0 && rightDepartmentNames.length === 0) {
        const selectedDepts = allDepartments.filter(dept => 
          selectedRightDepartmentCodes.includes(String(dept.code))
        );
        setRightDepartmentNames(selectedDepts);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDepartments, selectedDepartmentCodes, selectedLeftDepartmentCodes, selectedRightDepartmentCodes, payload.type]);

  // เมื่อเลือกแผนกแล้ว ให้ดึง station และตั้งค่า Department ID (ทุก type ยกเว้น duo)
  useEffect(() => {
    if (payload.type !== 'duo' && selectedDepartmentCodes.length > 0) {
      console.log('[Dept Change] Resetting selectedLeftStations because department changed:', selectedDepartmentCodes);
      fetchStationsFromMultipleDepts(selectedDepartmentCodes, 'left');
      // Reset selected stations เมื่อเปลี่ยนแผนก (useEffect ที่ watch selectedLeftStations จะอัพเดต station_left อัตโนมัติ)
      setSelectedLeftStations([]);
      // ตั้งค่า Department ID
      setPayload(prev => ({ 
        ...prev, 
        query_left: selectedDepartmentCodes.join(',')
      }));
      // ไม่ต้อง setLeftDepartmentNames ที่นี่ เพราะถูก set ใน onMultiSelect callback แล้ว
    } else if (payload.type !== 'duo' && selectedDepartmentCodes.length === 0) {
      setLeftStations([]);
      setSelectedLeftStations([]); // useEffect ที่ watch selectedLeftStations จะอัพเดต station_left อัตโนมัติ
      setLeftDepartmentNames([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDepartmentCodes, payload.type]); // ลบ allDepartments ออกเพื่อป้องกันการเรียก API ซ้ำ

  // สำหรับ duo: เมื่อเลือกแผนกฝั่งซ้าย
  useEffect(() => {
    if (payload.type === 'duo' && selectedLeftDepartmentCodes.length > 0) {
      fetchStationsFromMultipleDepts(selectedLeftDepartmentCodes, 'left');
      setSelectedLeftStations([]); // useEffect ที่ watch selectedLeftStations จะอัพเดต station_left อัตโนมัติ
      // ตั้งค่า Department ID
      setPayload(prev => ({ 
        ...prev, 
        query_left: selectedLeftDepartmentCodes.join(',')
      }));
      // ไม่ต้อง setLeftDepartmentNames ที่นี่ เพราะถูก set ใน onMultiSelect callback แล้ว
    } else if (payload.type === 'duo' && selectedLeftDepartmentCodes.length === 0) {
      setLeftStations([]);
      setSelectedLeftStations([]); // useEffect ที่ watch selectedLeftStations จะอัพเดต station_left อัตโนมัติ
      setLeftDepartmentNames([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeftDepartmentCodes, payload.type]); // ลบ allDepartments ออกเพื่อป้องกันการเรียก API ซ้ำ

  // สำหรับ duo: เมื่อเลือกแผนกฝั่งขวา
  useEffect(() => {
    if (payload.type === 'duo' && selectedRightDepartmentCodes.length > 0) {
      fetchStationsFromMultipleDepts(selectedRightDepartmentCodes, 'right');
      setSelectedRightStations([]); // useEffect ที่ watch selectedRightStations จะอัพเดต station_right อัตโนมัติ
      // ตั้งค่า Department ID
      setPayload(prev => ({ 
        ...prev, 
        query_right: selectedRightDepartmentCodes.join(',')
      }));
      // ไม่ต้อง setRightDepartmentNames ที่นี่ เพราะถูก set ใน onMultiSelect callback แล้ว
    } else if (payload.type === 'duo' && selectedRightDepartmentCodes.length === 0) {
      setRightStations([]);
      setSelectedRightStations([]); // useEffect ที่ watch selectedRightStations จะอัพเดต station_right อัตโนมัติ
      setRightDepartmentNames([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRightDepartmentCodes, payload.type]); // ลบ allDepartments ออกเพื่อป้องกันการเรียก API ซ้ำ

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
          
          // สำหรับ single, swap, ER: โหลด department codes และ fetch stations
          if (payload.type !== 'duo' && payload.query_left) {
            const codes = payload.query_left.split(',').filter(c => c.trim() !== '');
            setSelectedDepartmentCodes(codes);
            await fetchStationsFromMultipleDepts(codes, 'left');
            // ใช้ allDepartments ที่มีอยู่แล้ว (ถ้ายังไม่มีจะถูก fetch ใน useEffect อื่น)
            // ถ้า allDepartments ว่าง ให้รอให้ useEffect ที่ fetch allDepartments ทำงานก่อน
            // (จะมีการ re-render เมื่อ allDepartments เปลี่ยน)
          }
          
          // สำหรับ duo: โหลด department codes และ fetch stations
          if (payload.type === 'duo') {
            // ใช้ allDepartments ที่มีอยู่แล้ว (ถ้ายังไม่มีจะถูก fetch ใน useEffect อื่น)
            if (payload.query_left) {
              const codes = payload.query_left.split(',').filter(c => c.trim() !== '');
              setSelectedLeftDepartmentCodes(codes);
              await fetchStationsFromMultipleDepts(codes, 'left');
              // ถ้า allDepartments ว่าง ให้รอให้ useEffect ที่ fetch allDepartments ทำงานก่อน
            }
            if (payload.query_right) {
              const codes = payload.query_right.split(',').filter(c => c.trim() !== '');
              setSelectedRightDepartmentCodes(codes);
              await fetchStationsFromMultipleDepts(codes, 'right');
              // ถ้า allDepartments ว่าง ให้รอให้ useEffect ที่ fetch allDepartments ทำงานก่อน
            }
          }
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setIsLoadingStep1(false);
        }
      };

      loadAllData();
    } else if (isOpen && currentStep !== 1) {
      // สำหรับ step อื่นๆ โหลดข้อมูลตามปกติ (เฉพาะเมื่อเปิด modal หรือเปลี่ยน step เท่านั้น)
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
      
      // โหลด department codes เฉพาะเมื่อยังไม่มีค่าเท่านั้น (ป้องกันการรีเซ็ตเมื่อเปลี่ยนแผนก)
      if (payload.type !== 'duo' && payload.query_left && selectedDepartmentCodes.length === 0) {
        const codes = payload.query_left.split(',').filter(c => c.trim() !== '');
        setSelectedDepartmentCodes(codes);
        fetchStationsFromMultipleDepts(codes, 'left');
        // ใช้ allDepartments ที่มีอยู่แล้วแทนการเรียก API ใหม่
        if (allDepartments.length > 0) {
          const selectedDepts = allDepartments.filter((d) => codes.includes(String(d.code)));
          setLeftDepartmentNames(selectedDepts);
        }
      }
      
      if (payload.type === 'duo') {
        // โหลด department codes เฉพาะเมื่อยังไม่มีค่าเท่านั้น (ป้องกันการรีเซ็ตเมื่อเปลี่ยนแผนก)
        if (payload.query_left && selectedLeftDepartmentCodes.length === 0) {
          const codes = payload.query_left.split(',').filter(c => c.trim() !== '');
          setSelectedLeftDepartmentCodes(codes);
          fetchStationsFromMultipleDepts(codes, 'left');
          if (allDepartments.length > 0) {
            const selectedDepts = allDepartments.filter((d) => codes.includes(String(d.code)));
            setLeftDepartmentNames(selectedDepts);
          }
        }
        if (payload.query_right && selectedRightDepartmentCodes.length === 0) {
          const codes = payload.query_right.split(',').filter(c => c.trim() !== '');
          setSelectedRightDepartmentCodes(codes);
          fetchStationsFromMultipleDepts(codes, 'right');
          if (allDepartments.length > 0) {
            const selectedDepts = allDepartments.filter((d) => codes.includes(String(d.code)));
            setRightDepartmentNames(selectedDepts);
            }
          }
      }
    }
  }, [isOpen, currentStep, payload.type]); // ลบ payload.query_left และ payload.query_right ออกเพื่อป้องกันการทำงานซ้ำเมื่อเปลี่ยนแผนก (จะจัดการใน useEffect อื่นแล้ว)

  // Auto-select departments 38, 39 เมื่อ type เป็น drug
  useEffect(() => {
    if (payload.type === 'drug') {
      const drugDepartments = ['38', '39'];
      // ตรวจสอบว่ามีการเลือกแผนกแล้วหรือยัง และแผนกที่เลือกตรงกับ 38, 39 หรือไม่
      const isAlreadySet = selectedDepartmentCodes.length === 2 && 
        selectedDepartmentCodes.every(code => drugDepartments.includes(code)) &&
        drugDepartments.every(code => selectedDepartmentCodes.includes(code));
      
      if (!isAlreadySet) {
        setSelectedDepartmentCodes(drugDepartments);
        
        // Set department names
        if (allDepartments.length > 0) {
          const selectedDepts = allDepartments.filter(dept => 
            drugDepartments.includes(String(dept.code))
          );
          setLeftDepartmentNames(selectedDepts);
        }
        
        // Fetch stations
        fetchStationsFromMultipleDepts(drugDepartments, 'left');
      }
    }
  }, [payload.type, allDepartments, selectedDepartmentCodes]);

  const fetchStations = async (departmentCode: string, side: 'left' | 'right' | 'both' = 'both'): Promise<void> => {
    try {
      const response = await fetch(`/api/station?department_code=${encodeURIComponent(departmentCode)}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // เพิ่ม department_code เข้าไปในแต่ละ station
        const stationsWithDept = data.data.map((station: { station_name: string }) => ({
          ...station,
          department_code: departmentCode
        }));
        
        if (side === 'left' || side === 'both') {
          setLeftStations(stationsWithDept);
        }
        if (side === 'right' || side === 'both') {
          setRightStations(stationsWithDept);
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

  // อัปเดต station_left และ amount_left เมื่อเลือก checkbox
  useEffect(() => {
    const filteredStations = selectedLeftStations.filter(s => s && s.trim() !== '');
    const stationValue = filteredStations.length > 0 ? filteredStations.join(',') : '';
    console.log('[Station Update] selectedLeftStations:', selectedLeftStations);
    console.log('[Station Update] filteredStations:', filteredStations);
    console.log('[Station Update] stationValue:', stationValue);
    setPayload(prev => {
      const newPayload = {
      ...prev, 
      station_left: stationValue,
      amount_left: filteredStations.length // อัปเดตจำนวนห้องตามจำนวน station ที่เลือก
      };
      console.log('[Station Update] Updating payload.station_left:', newPayload.station_left);
      return newPayload;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeftStations]); // setPayload is stable from props, no need in deps

  // อัปเดต station_right และ amount_right เมื่อเลือก checkbox
  useEffect(() => {
    const filteredStations = selectedRightStations.filter(s => s && s.trim() !== '');
    const stationValue = filteredStations.length > 0 ? filteredStations.join(',') : '';
    console.log('[Station Update] selectedRightStations:', selectedRightStations);
    console.log('[Station Update] stationValue (right):', stationValue);
    setPayload(prev => {
      const newPayload = {
      ...prev, 
      station_right: stationValue,
      amount_right: filteredStations.length // อัปเดตจำนวนห้องตามจำนวน station ที่เลือก
      };
      console.log('[Station Update] Updating payload.station_right:', newPayload.station_right);
      return newPayload;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRightStations]); // setPayload is stable from props, no need in deps

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
                      <option value="er">ER</option>
                      <option value="pharmacy">Pharmacy</option>
                      <option value="queue">Queue</option>
                      <option value="queue_only">Queue Only</option>
                      <option value="drug">Drug</option>
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

                  {payload.type !== 'drug' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">หัวกำลังรับบริการ (ซ้าย)</label>
                    <input
                      type="text"
                      value={payload.head_left}
                      onChange={(e) => setPayload(prev => ({ ...prev, head_left: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                    />
                  </div>
                  )}

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
                                      const newCodes = selectedDepartmentCodes.filter(c => c !== String(dept.code));
                                      setSelectedDepartmentCodes(newCodes);
                                      // อัปเดต query_left ทันที
                                      setPayload(prev => ({ 
                                        ...prev, 
                                        query_left: newCodes.length > 0 ? newCodes.join(',') : ''
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
                            onClick={() => setShowDepartmentPopup(true)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-left bg-white hover:bg-slate-50"
                          >
                            {leftDepartmentNames.length > 0 
                              ? `เลือกแล้ว ${leftDepartmentNames.length} แผนก` 
                              : 'เลือกแผนก'}
                          </button>
                        </div>
                      )}

                      {/* Department Selection สำหรับ duo ฝั่งซ้าย */}
                      {payload.type === 'duo' && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">แผนก (ซ้าย)</label>
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
                                      const newCodes = selectedLeftDepartmentCodes.filter(c => c !== String(dept.code));
                                      setSelectedLeftDepartmentCodes(newCodes);
                                      // อัปเดต query_left ทันที
                                      setPayload(prev => ({ 
                                        ...prev, 
                                        query_left: newCodes.length > 0 ? newCodes.join(',') : ''
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
                            onClick={() => setShowLeftDepartmentPopup(true)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-left bg-white hover:bg-slate-50"
                          >
                            {leftDepartmentNames.length > 0 
                              ? `เลือกแล้ว ${leftDepartmentNames.length} แผนก` 
                              : 'เลือกแผนก'}
                          </button>
                        </div>
                      )}

                      {/* Station Selection */}
                      {payload.type !== 'queue_only' && (
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
                                const deptCode = station.department_code;
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
                      )}

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

                        {/* Station Selection */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            เลือก Station (ขวา)
                          </label>
                          {rightDepartmentNames.length === 0 ? (
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
                                  const deptCode = station.department_code;
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
          onSelect={() => {
            // Not used in multiSelect mode, but required by component
          }}
          onMultiSelect={(selectedCodes: string[], selectedNames: string[]) => {
            setSelectedDepartmentCodes(selectedCodes);
            // ใช้ selectedNames ที่ส่งมาจาก popup แทนการค้นหาจาก allDepartments
            const selectedDepts = selectedCodes.map((code, index) => ({
              code,
              name: selectedNames[index] || code
            }));
            setLeftDepartmentNames(selectedDepts);
            setShowDepartmentPopup(false);
          }}
          selectedValues={selectedDepartmentCodes}
          multiSelect={true}
          allowedDepartments={payload.type === 'drug' ? ['38', '39'] : undefined}
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
            // ใช้ selectedNames ที่ส่งมาจาก popup แทนการค้นหาจาก allDepartments
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
            // ใช้ selectedNames ที่ส่งมาจาก popup แทนการค้นหาจาก allDepartments
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

      {/* Station Selection Popup ฝั่งซ้าย */}
      <StationSelectPopup
        isOpen={showLeftStationPopup}
        onClose={() => setShowLeftStationPopup(false)}
        onSelect={(selectedStations: string[]) => {
          console.log('[Station Select] onSelect called with:', selectedStations);
          console.log('[Station Select] Setting selectedLeftStations to:', selectedStations);
          setSelectedLeftStations(selectedStations);
      console.log('[Station Select] selectedLeftStations state will be updated');
        }}
        availableStations={leftStations}
        selectedStations={selectedLeftStations}
        departmentName={leftDepartmentNames.length > 0 
          ? leftDepartmentNames.map(d => d.name).join(', ')
          : undefined}
      />

      {/* Station Selection Popup ฝั่งขวา */}
      {payload.type === 'duo' && (
        <StationSelectPopup
          isOpen={showRightStationPopup}
          onClose={() => setShowRightStationPopup(false)}
          onSelect={(selectedStations: string[]) => {
            console.log('[Station Select] onSelect (right) called with:', selectedStations);
            setSelectedRightStations(selectedStations);
          }}
          availableStations={rightStations}
          selectedStations={selectedRightStations}
          departmentName={rightDepartmentNames.length > 0 
            ? rightDepartmentNames.map(d => d.name).join(', ')
            : undefined}
        />
      )}
    </>
  );
}

