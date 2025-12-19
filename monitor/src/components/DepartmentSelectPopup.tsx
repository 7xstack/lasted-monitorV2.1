'use client';

import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';

interface Department {
  code: string;
  name: string;
}

interface DepartmentSelectPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (departmentCode: string, departmentName: string) => void;
  currentValue?: string;
}

export default function DepartmentSelectPopup({
  isOpen,
  onClose,
  onSelect,
}: DepartmentSelectPopupProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      setDepartmentSearch('');
    }
  }, [isOpen]);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/department');
      const data = await response.json();
      if (data.success && data.data) {
        setDepartments(data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDepartments = departments.filter((dept) => {
    const searchLower = departmentSearch.toLowerCase();
    const codeStr = String(dept.code || '').toLowerCase();
    const nameStr = String(dept.name || '').toLowerCase();
    return (
      codeStr.includes(searchLower) ||
      nameStr.includes(searchLower)
    );
  });

  const handleSelect = (dept: Department) => {
    onSelect(dept.code, dept.name);
    onClose();
    setDepartmentSearch('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
        {/* Popup Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b" style={{ background: 'rgba(4, 53, 102, 0.02)', borderColor: '#e2e8f0' }}>
          <h2 className="text-xl font-bold" style={{ color: '#043566' }}>เลือกแผนก</h2>
          <button
            onClick={() => {
              onClose();
              setDepartmentSearch('');
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
              value={departmentSearch}
              onChange={(e) => setDepartmentSearch(e.target.value)}
              placeholder="ค้นหาแผนก..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            />
          </div>
        </div>

        {/* Department List */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">
              กำลังโหลดข้อมูล...
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDepartments.map((dept) => (
                <button
                  key={dept.code}
                  type="button"
                  onClick={() => handleSelect(dept)}
                  className="w-full px-4 py-3 text-left border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  <div className="font-medium text-slate-800">
                    {dept.name}
                  </div>
                </button>
              ))}
              {filteredDepartments.length === 0 && !isLoading && (
                <div className="text-center py-8 text-slate-500">
                  ไม่พบแผนกที่ค้นหา
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

