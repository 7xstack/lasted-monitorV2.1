'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search, CheckCircle } from 'lucide-react';

interface Department {
  code: string | number;
  name: string;
}

// Module-level cache for departments to persist across component unmounts
let cachedDepartments: Department[] = [];
let departmentsCacheFetched = false;

interface DepartmentSelectPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (departmentCode: string, departmentName: string) => void;
  onMultiSelect?: (selectedCodes: string[], selectedNames: string[]) => void;
  currentValue?: string;
  selectedValues?: string[];
  multiSelect?: boolean;
}

export default function DepartmentSelectPopup({
  isOpen,
  onClose,
  onSelect,
  onMultiSelect,
  selectedValues = [],
  multiSelect = false,
}: DepartmentSelectPopupProps) {
  // Initialize from cache if available
  const [departments, setDepartments] = useState<Department[]>(cachedDepartments);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDeptCodes, setSelectedDeptCodes] = useState<string[]>([]);
  const prevIsOpenRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    // Only initialize when popup opens (isOpen changes from false to true)
    const isOpening = isOpen && !prevIsOpenRef.current;
    
    if (isOpen) {
      // Only fetch departments and reset search when opening
      if (isOpening) {
        // Always check cache first - if cache exists, use it immediately
        if (departmentsCacheFetched && cachedDepartments.length > 0) {
          // Use cached data - don't fetch
          setDepartments(cachedDepartments);
        } else {
          // Only fetch if cache doesn't exist
          fetchDepartments();
        }
        setDepartmentSearch('');
        isInitializedRef.current = false;
      } else if (isOpen) {
        // When popup is already open, sync with cache if state is empty
        if (departments.length === 0 && departmentsCacheFetched && cachedDepartments.length > 0) {
          setDepartments(cachedDepartments);
        }
      }
      
      // Initialize selected values from props ONLY when opening popup for the first time
      if (isOpening && !isInitializedRef.current) {
        if (multiSelect && selectedValues && selectedValues.length > 0) {
          // Filter out empty strings and trim values, convert to string first
          const filteredValues = selectedValues
            .map(v => String(v || ''))
            .filter(v => v.trim() !== '');
          setSelectedDeptCodes(filteredValues);
        } else {
          setSelectedDeptCodes([]);
        }
        isInitializedRef.current = true;
      }
      
      prevIsOpenRef.current = true;
    } else {
      // Reset when popup closes (but keep departments and departmentsFetchedRef)
      prevIsOpenRef.current = false;
      isInitializedRef.current = false;
      // Don't reset departments state or departmentsFetchedRef to keep cached data
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, multiSelect]);

  // Sync selectedValues when popup is already open (in case selectedValues changes after popup opens)
  useEffect(() => {
    if (isOpen && multiSelect && !isInitializedRef.current) {
      // Only sync if not yet initialized (selectedValues arrived after popup opened)
      if (selectedValues && selectedValues.length > 0) {
        // Filter out empty strings and trim values, convert to string first
        const filteredValues = selectedValues
          .map(v => String(v || ''))
          .filter(v => v.trim() !== '');
        setSelectedDeptCodes(filteredValues);
        isInitializedRef.current = true;
      } else if (selectedValues && selectedValues.length === 0) {
        setSelectedDeptCodes([]);
        isInitializedRef.current = true;
      }
    }
  }, [selectedValues, isOpen, multiSelect]);

  const fetchDepartments = async () => {
    // Don't fetch if already cached
    if (departmentsCacheFetched && cachedDepartments.length > 0) {
      setDepartments(cachedDepartments);
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/department');
      const data = await response.json();
      if (data.success && data.data) {
        // Update both state and cache
        cachedDepartments = data.data;
        departmentsCacheFetched = true;
        setDepartments(cachedDepartments);
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

  const handleToggle = (dept: Department) => {
    if (!multiSelect) {
      // Single select mode - close immediately
      // Normalize code to string for consistency
      onSelect(String(dept.code), dept.name);
      onClose();
      setDepartmentSearch('');
      return;
    }

    // Multi select mode - toggle selection
    // Normalize code to string for consistent comparison
    const normalizedCode = String(dept.code);
    setSelectedDeptCodes(prev => {
      if (prev.includes(normalizedCode)) {
        return prev.filter(code => code !== normalizedCode);
      } else {
        return [...prev, normalizedCode];
      }
    });
  };

  const handleConfirm = () => {
    if (multiSelect && onMultiSelect) {
      const selectedDepartments = departments.filter(dept => 
        selectedDeptCodes.includes(String(dept.code))
      );
      const codes = selectedDepartments.map(d => String(d.code));
      const names = selectedDepartments.map(d => d.name);
      onMultiSelect(codes, names);
    }
    onClose();
    setDepartmentSearch('');
  };

  // Don't unmount component - use CSS to hide instead to preserve state
  return (
    <div 
      className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      style={{ display: isOpen ? 'flex' : 'none' }}
    >
      <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
        {/* Popup Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b" style={{ background: 'rgba(4, 53, 102, 0.02)', borderColor: '#e2e8f0' }}>
          <h2 className="text-xl font-bold" style={{ color: '#043566' }}>
            เลือกแผนก
            {multiSelect && selectedDeptCodes.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                (เลือกแล้ว {selectedDeptCodes.length} แผนก)
              </span>
            )}
          </h2>
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
              {filteredDepartments.map((dept) => {
                // Normalize code to string for consistent comparison
                const normalizedDeptCode = String(dept.code);
                const isSelected = selectedDeptCodes.includes(normalizedDeptCode);
                return (
                  <button
                    key={normalizedDeptCode}
                    type="button"
                    onClick={() => handleToggle(dept)}
                    className={`w-full px-4 py-3 text-left border rounded-xl transition-all flex items-center gap-3 ${
                      isSelected && multiSelect
                        ? 'bg-blue-50 border-blue-300'
                        : 'border-slate-200 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    {multiSelect && (
                      <div className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-slate-300'
                      }`}>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">
                        {dept.name}
                      </div>
                      {multiSelect && (
                        <div className="text-xs text-slate-500">Code: {dept.code}</div>
                      )}
                    </div>
                  </button>
                );
              })}
              {filteredDepartments.length === 0 && !isLoading && (
                <div className="text-center py-8 text-slate-500">
                  ไม่พบแผนกที่ค้นหา
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirm Button for Multi-Select */}
        {multiSelect && (
          <div className="px-6 py-4 border-t" style={{ borderColor: '#e2e8f0' }}>
            <button
              onClick={handleConfirm}
              disabled={selectedDeptCodes.length === 0}
              className="w-full px-4 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: selectedDeptCodes.length > 0 ? '#043566' : '#e2e8f0',
                color: selectedDeptCodes.length > 0 ? 'white' : '#94a3b8',
              }}
            >
              ยืนยัน ({selectedDeptCodes.length} แผนก)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
