'use client';

import { useState, useEffect } from 'react';
import { X, Search, Check } from 'lucide-react';

interface Station {
  station_name: string;
}

interface StationSelectPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedStations: string[]) => void;
  availableStations: Station[];
  selectedStations: string[];
  departmentName?: string;
}

export default function StationSelectPopup({
  isOpen,
  onClose,
  onSelect,
  availableStations,
  selectedStations,
  departmentName,
}: StationSelectPopupProps) {
  const [stationSearch, setStationSearch] = useState('');
  const [tempSelectedStations, setTempSelectedStations] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTempSelectedStations([...selectedStations]);
      setStationSearch('');
    }
  }, [isOpen, selectedStations]);

  const filteredStations = availableStations.filter((station) => {
    const searchLower = stationSearch.toLowerCase();
    const stationName = station.station_name.toLowerCase();
    return stationName.includes(searchLower);
  });

  const handleToggleStation = (stationName: string) => {
    setTempSelectedStations((prev) => {
      if (prev.includes(stationName)) {
        return prev.filter((s) => s !== stationName);
      } else {
        return [...prev, stationName];
      }
    });
  };

  const handleConfirm = () => {
    onSelect(tempSelectedStations);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
        {/* Popup Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b" style={{ background: 'rgba(4, 53, 102, 0.02)', borderColor: '#e2e8f0' }}>
          <h2 className="text-xl font-bold" style={{ color: '#043566' }}>
            เลือก Station {departmentName && `(${departmentName})`}
          </h2>
          <button
            onClick={() => {
              onClose();
              setStationSearch('');
            }}
            className="text-slate-400 hover:text-slate-700 text-2xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b" style={{ borderColor: '#e2e8f0' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={stationSearch}
              onChange={(e) => setStationSearch(e.target.value)}
              placeholder="ค้นหา Station..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            />
          </div>
        </div>

        {/* Station List */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {availableStations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              ไม่พบ Station สำหรับแผนกนี้
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStations.map((station) => {
                const isSelected = tempSelectedStations.includes(station.station_name);
                return (
                  <label
                    key={station.station_name}
                    className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 p-3 rounded-lg transition-colors border border-slate-200"
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleStation(station.station_name)}
                        className="w-5 h-5 text-blue-600 border-blue-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      {isSelected && (
                        <Check className="absolute top-0 left-0 w-5 h-5 text-blue-600 pointer-events-none" />
                      )}
                    </div>
                    <span className="text-sm text-slate-700 flex-1">{station.station_name}</span>
                  </label>
                );
              })}
              {filteredStations.length === 0 && stationSearch && (
                <div className="text-center py-8 text-slate-500">
                  ไม่พบ Station ที่ค้นหา
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ background: 'rgba(4, 53, 102, 0.01)', borderColor: '#e2e8f0' }}>
          <div className="text-sm text-slate-600">
            เลือกแล้ว {tempSelectedStations.length} Station
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 bg-white border rounded-xl hover:bg-slate-50 shadow-sm hover:shadow transition-all duration-200"
              style={{ borderColor: '#e2e8f0' }}
            >
              ยกเลิก
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2.5 text-white rounded-xl hover:opacity-90 shadow hover:shadow-md transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}
            >
              ยืนยัน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

