'use client';

import { Save } from 'lucide-react';
import { SettingData } from './types';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  swapCount: number;
  swapSelections: string[];
  swapTimeWait: number;
  availableSettings: SettingData[];
  isLoading: boolean;
  onSwapCountChange: (value: string) => void;
  onSwapSelectionChange: (index: number, value: string) => void;
  onSwapTimeWaitChange: (value: number) => void;
  onSubmit: () => void;
}

export default function SwapModal({
  isOpen,
  onClose,
  swapCount,
  swapSelections,
  swapTimeWait,
  availableSettings,
  isLoading,
  onSwapCountChange,
  onSwapSelectionChange,
  onSwapTimeWaitChange,
  onSubmit,
}: SwapModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
        {/* Modal Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b" style={{ background: 'rgba(4, 53, 102, 0.02)', borderColor: '#e2e8f0' }}>
          <h2 className="text-xl font-bold" style={{ color: '#043566' }}>ตั้งค่า Swap</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-6">
            {/* จำนวน Dropdown */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                จำนวนหน้าจอที่ต้องการ Swap
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={swapCount || ''}
                onChange={(e) => onSwapCountChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                placeholder="กรอกจำนวน (1-10)"
              />
            </div>

            {/* เวลารอ (Time Wait) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                เวลาแสดงแต่ละหน้าจอ (หน่วย: ms)
              </label>
              <input
                type="number"
                min="300"
                step="100"
                value={swapTimeWait}
                onChange={(e) => onSwapTimeWaitChange(parseInt(e.target.value) || 2000)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                placeholder="2000"
              />
              <p className="text-xs text-slate-500 mt-1">
                2000 = 20 วินาที (แนะนำ)
              </p>
            </div>

            {/* Dropdowns */}
            {swapCount > 0 && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  เลือกหน้าจอ ({swapCount} หน้าจอ)
                </label>
                <div className="space-y-3">
                  {swapSelections.map((selection, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-slate-600 w-8">#{index + 1}</span>
                      <select
                        value={selection}
                        onChange={(e) => onSwapSelectionChange(index, e.target.value)}
                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-white"
                      >
                        <option value="">-- เลือกหน้าจอ --</option>
                        {availableSettings
                          .filter(setting => setting.type !== 'swap')
                          .map((setting) => (
                            <option key={setting.id} value={setting.id}>
                              ID: {setting.id} - {setting.n_hospital} ({setting.n_department})
                            </option>
                          ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ background: 'rgba(4, 53, 102, 0.01)', borderColor: '#e2e8f0' }}>
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 bg-white border rounded-xl hover:bg-slate-50 shadow-sm hover:shadow transition-all duration-200"
            style={{ borderColor: '#e2e8f0' }}
          >
            ยกเลิก
          </button>
          
          <button
            onClick={onSubmit}
            disabled={isLoading || swapCount === 0}
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
                <span>บันทึก</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

