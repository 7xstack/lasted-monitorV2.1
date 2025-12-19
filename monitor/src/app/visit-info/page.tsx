'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, RefreshCw, FileText, Home, Save, Volume2, Search, ChevronLeft, ChevronRight, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';

interface VisitInfo {
  [key: string]: string | number | boolean | null | undefined;
  vn?: string;
  visit_q_no?: string;
  name?: string;
  surname?: string;
  visit_date?: string;
  code_dept_id?: string;
  status?: string;
  urgent_id?: number;
  station?: string;
  time_call?: string;
  time_skip?: string;
}

export default function VisitInfoPage() {
  const [visitDate, setVisitDate] = useState<string>(() => {
    // Set default to today's date in YYYY-MM-DD format
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  
  const [visitData, setVisitData] = useState<VisitInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCodeDeptId, setEditingCodeDeptId] = useState<{ [key: string]: string }>({});
  const [editingVisitQNo, setEditingVisitQNo] = useState<{ [key: string]: string }>({});
  const [updatingRows, setUpdatingRows] = useState<Set<string>>(new Set());
  
  // Search states
  const [searchVn, setSearchVn] = useState<string>('');
  const [searchCodeDeptId, setSearchCodeDeptId] = useState<string>('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);
  
  // Success popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Fetch visit info data
  const fetchVisitInfo = useCallback(async () => {
    if (!visitDate) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/visit-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visit_date: visitDate }),
      });

      const result = await response.json();

      if (result.success) {
        setVisitData(result.data || []);
      } else {
        setError(result.error || 'ไม่สามารถโหลดข้อมูลได้');
        setVisitData([]);
      }
    } catch (err) {
      console.error('Error fetching visit info:', err);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setVisitData([]);
    } finally {
      setIsLoading(false);
    }
  }, [visitDate]);

  // Fetch data on mount and when visitDate changes
  useEffect(() => {
    fetchVisitInfo();
  }, [fetchVisitInfo]);

  // Get table headers from the first row if available
  const getTableHeaders = (): string[] => {
    if (visitData.length === 0) return [];
    
    const allKeys = Object.keys(visitData[0]).filter(key => 
      key !== '__proto__' && 
      typeof visitData[0][key] !== 'function'
    );
    
    // จัดเรียงให้ visit_q_no อยู่ที่สอง
    const orderedHeaders: string[] = [];
    const otherHeaders: string[] = [];
    
    allKeys.forEach(key => {
      if (key === 'vn') {
        orderedHeaders[0] = key; // vn อยู่ที่แรก
      } else if (key === 'visit_q_no') {
        orderedHeaders[1] = key; // visit_q_no อยู่ที่สอง
      } else {
        otherHeaders.push(key);
      }
    });
    
    // รวม headers ที่เหลือตามลำดับเดิม
    otherHeaders.forEach(key => {
      if (!orderedHeaders.includes(key)) {
        orderedHeaders.push(key);
      }
    });
    
    return orderedHeaders.filter(Boolean); // ลบ undefined ออก
  };

  const headers = getTableHeaders();

  // Filter data based on search
  const filteredData = useMemo(() => {
    return visitData.filter((row) => {
      const vnMatch = !searchVn || 
        (row.vn && String(row.vn).toLowerCase().includes(searchVn.toLowerCase()));
      const codeDeptIdMatch = !searchCodeDeptId || 
        (row.code_dept_id && String(row.code_dept_id).toLowerCase().includes(searchCodeDeptId.toLowerCase()));
      
      return vnMatch && codeDeptIdMatch;
    });
  }, [visitData, searchVn, searchCodeDeptId]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchVn, searchCodeDeptId]);

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Handle code_dept_id change
  const handleCodeDeptIdChange = (vn: string, value: string) => {
    setEditingCodeDeptId(prev => ({
      ...prev,
      [vn]: value
    }));
  };

  // Handle visit_q_no change
  const handleVisitQNoChange = (vn: string, value: string) => {
    setEditingVisitQNo(prev => ({
      ...prev,
      [vn]: value
    }));
  };

  // Save code_dept_id update
  const handleSaveCodeDeptId = async (vn: string) => {
    const newCodeDeptId = editingCodeDeptId[vn];
    if (!newCodeDeptId || newCodeDeptId === visitData.find(row => row.vn === vn)?.code_dept_id) {
      // No change or empty value
      const newEditing = { ...editingCodeDeptId };
      delete newEditing[vn];
      setEditingCodeDeptId(newEditing);
      return;
    }

    setUpdatingRows(prev => new Set(prev).add(vn));

    try {
      const response = await fetch('/api/visit-info/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vn: vn,
          code_dept_id: newCodeDeptId
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setVisitData(prev => prev.map(row => 
          row.vn === vn 
            ? { ...row, code_dept_id: newCodeDeptId }
            : row
        ));
        
        // Remove from editing state
        const newEditing = { ...editingCodeDeptId };
        delete newEditing[vn];
        setEditingCodeDeptId(newEditing);
        
        // Show success popup
        setSuccessMessage('อัปเดต code_dept_id สำเร็จ');
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 3000);
      } else {
        setError(result.error || result.message || 'เกิดข้อผิดพลาดในการอัปเดต');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('Error updating code_dept_id:', err);
      setError('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdatingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(vn);
        return newSet;
      });
    }
  };

  // Save visit_q_no update
  const handleSaveVisitQNo = async (vn: string) => {
    const newVisitQNo = editingVisitQNo[vn];
    if (newVisitQNo === undefined || newVisitQNo === visitData.find(row => row.vn === vn)?.visit_q_no) {
      // No change
      const newEditing = { ...editingVisitQNo };
      delete newEditing[vn];
      setEditingVisitQNo(newEditing);
      return;
    }

    setUpdatingRows(prev => new Set(prev).add(vn));

    try {
      const response = await fetch('/api/visit-info/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vn: vn,
          visit_q_no: newVisitQNo
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setVisitData(prev => prev.map(row => 
          row.vn === vn 
            ? { ...row, visit_q_no: newVisitQNo }
            : row
        ));
        
        // Remove from editing state
        const newEditing = { ...editingVisitQNo };
        delete newEditing[vn];
        setEditingVisitQNo(newEditing);
        
        // Show success popup
        setSuccessMessage('อัปเดต visit_q_no สำเร็จ');
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 3000);
      } else {
        setError(result.error || result.message || 'เกิดข้อผิดพลาดในการอัปเดต');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('Error updating visit_q_no:', err);
      setError('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdatingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(vn);
        return newSet;
      });
    }
  };

  // Handle status_call update
  const handleSetStatusCall = async (vn: string) => {
    setUpdatingRows(prev => new Set(prev).add(vn));

    try {
      const response = await fetch('/api/visit-info/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vn: vn,
          status_call: 1
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setVisitData(prev => prev.map(row => 
          row.vn === vn 
            ? { ...row, status_call: 1 }
            : row
        ));
        
        // Show success popup
        setSuccessMessage('อัปเดต status_call สำเร็จ');
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 3000);
      } else {
        setError(result.error || result.message || 'เกิดข้อผิดพลาดในการอัปเดต');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('Error updating status_call:', err);
      setError('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdatingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(vn);
        return newSet;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b" style={{ borderColor: '#e2e8f0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl shadow-md" style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}>
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: '#043566' }}>ข้อมูลการเข้าใช้งาน</h1>
                <p className="text-sm text-slate-600 mt-1">ข้อมูลจาก monitor_visit_info</p>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center space-x-2 px-5 py-2.5 bg-white hover:bg-slate-50 rounded-xl transition-all duration-200 border shadow-sm hover:shadow font-medium"
              style={{ color: '#043566', borderColor: '#e2e8f0' }}
            >
              <Home className="w-5 h-5" />
              <span>หน้าแรก</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Picker Section */}
        <div className="bg-white rounded-2xl shadow overflow-hidden border mb-6" style={{ borderColor: '#e2e8f0' }}>
          <div className="px-6 py-5 border-b bg-gradient-to-r from-blue-50/60 to-transparent" style={{ borderColor: '#e2e8f0' }}>
            <h2 className="text-xl font-bold" style={{ color: '#043566' }}>เลือกวันที่</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-slate-600" />
                <label className="text-sm font-medium text-slate-700">วันที่:</label>
              </div>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm"
                style={{ borderColor: '#e2e8f0' }}
              />
              <button
                onClick={fetchVisitInfo}
                disabled={isLoading}
                className="flex items-center space-x-2 px-5 py-2.5 text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-md transition-all duration-200 font-medium"
                style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>รีเฟรช</span>
              </button>
              {visitData.length > 0 && (
                <div className="ml-auto text-sm text-slate-600">
                  พบทั้งหมด <span className="font-bold text-slate-800">{visitData.length}</span> รายการ
                  {filteredData.length !== visitData.length && (
                    <span className="ml-2">
                      (กรองแล้ว: <span className="font-bold text-blue-600">{filteredData.length}</span>)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Section */}
        {visitData.length > 0 && (
          <div className="bg-white rounded-2xl shadow overflow-hidden border mb-6" style={{ borderColor: '#e2e8f0' }}>
            <div className="px-6 py-5 border-b bg-gradient-to-r from-blue-50/60 to-transparent" style={{ borderColor: '#e2e8f0' }}>
              <h2 className="text-xl font-bold" style={{ color: '#043566' }}>ค้นหา</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">VN</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchVn}
                      onChange={(e) => setSearchVn(e.target.value)}
                      placeholder="ค้นหาด้วย VN"
                      className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm"
                      style={{ borderColor: '#e2e8f0' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Code Dept ID</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchCodeDeptId}
                      onChange={(e) => setSearchCodeDeptId(e.target.value)}
                      placeholder="ค้นหาด้วย Code Dept ID"
                      className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm"
                      style={{ borderColor: '#e2e8f0' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">แสดงต่อหน้า</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm bg-white"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    <option value={25}>25 รายการ</option>
                    <option value={50}>50 รายการ</option>
                    <option value={100}>100 รายการ</option>
                    <option value={200}>200 รายการ</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-2xl shadow overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#043566', borderTopColor: 'transparent' }}></div>
              <p className="text-slate-600 font-medium">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        )}

        {/* Table */}
        {!isLoading && filteredData.length > 0 && (
          <div className="bg-white rounded-2xl shadow overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
            <div className="px-6 py-5 border-b bg-gradient-to-r from-blue-50/60 to-transparent flex items-center justify-between" style={{ borderColor: '#e2e8f0' }}>
              <h2 className="text-xl font-bold" style={{ color: '#043566' }}>ข้อมูลการเข้าใช้งาน</h2>
              <div className="text-sm text-slate-600">
                แสดง {startIndex + 1} - {Math.min(endIndex, filteredData.length)} จาก {filteredData.length} รายการ
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b" style={{ borderColor: '#e2e8f0' }}>
                    {headers.map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: '#043566' }}
                      >
                        {header}
                      </th>
                    ))}
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider sticky right-0 bg-slate-50"
                      style={{ color: '#043566', borderColor: '#e2e8f0' }}
                    >
                      การจัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y" style={{ borderColor: '#e2e8f0' }}>
                  {paginatedData.map((row, index) => {
                    const vn = row.vn as string;
                    const isUpdating = updatingRows.has(vn || '');
                    const isEditingCodeDeptId = editingCodeDeptId[vn || ''] !== undefined;
                    const isEditingVisitQNo = editingVisitQNo[vn || ''] !== undefined;
                    const currentCodeDeptId = editingCodeDeptId[vn || ''] ?? row.code_dept_id;
                    const currentVisitQNo = editingVisitQNo[vn || ''] ?? row.visit_q_no;

                    return (
                      <tr
                        key={index}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        {headers.map((header) => (
                          <td
                            key={header}
                            className="px-4 py-3 whitespace-nowrap text-sm text-slate-700"
                          >
                            {header === 'code_dept_id' ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={currentCodeDeptId || ''}
                                  onChange={(e) => handleCodeDeptIdChange(vn || '', e.target.value)}
                                  onBlur={() => handleSaveCodeDeptId(vn || '')}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveCodeDeptId(vn || '');
                                    }
                                  }}
                                  disabled={isUpdating}
                                  className="px-2 py-1 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm w-32 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                  style={{ borderColor: '#e2e8f0' }}
                                />
                                {isEditingCodeDeptId && (
                                  <button
                                    onClick={() => handleSaveCodeDeptId(vn || '')}
                                    disabled={isUpdating}
                                    className="p-1 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                    title="บันทึก"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ) : header === 'visit_q_no' ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={currentVisitQNo || ''}
                                  onChange={(e) => handleVisitQNoChange(vn || '', e.target.value)}
                                  onBlur={() => handleSaveVisitQNo(vn || '')}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveVisitQNo(vn || '');
                                    }
                                  }}
                                  disabled={isUpdating}
                                  className="px-2 py-1 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm w-32 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                  style={{ borderColor: '#e2e8f0' }}
                                />
                                {isEditingVisitQNo && (
                                  <button
                                    onClick={() => handleSaveVisitQNo(vn || '')}
                                    disabled={isUpdating}
                                    className="p-1 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                    title="บันทึก"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              row[header] !== null && row[header] !== undefined
                                ? String(row[header])
                                : '-'
                            )}
                          </td>
                        ))}
                        <td
                          className="px-4 py-3 whitespace-nowrap sticky right-0 bg-white"
                          style={{ borderColor: '#e2e8f0' }}
                        >
                          <button
                            onClick={() => handleSetStatusCall(vn || '')}
                            disabled={isUpdating}
                            className="flex items-center space-x-1 px-3 py-1.5 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                            style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}
                            title="ตั้งค่า status_call = 1"
                          >
                            {isUpdating ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>กำลังอัปเดต...</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-4 h-4" />
                                <span>เรียก</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: '#e2e8f0' }}>
                <div className="text-sm text-slate-600">
                  หน้า {currentPage} จาก {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center space-x-1 px-3 py-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                    style={{ borderColor: '#e2e8f0', color: '#043566' }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>ก่อนหน้า</span>
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            currentPage === pageNum
                              ? 'text-white'
                              : 'border hover:bg-slate-50'
                          }`}
                          style={
                            currentPage === pageNum
                              ? { background: 'linear-gradient(135deg, #043566, #065a9e)' }
                              : { borderColor: '#e2e8f0', color: '#043566' }
                          }
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center space-x-1 px-3 py-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                    style={{ borderColor: '#e2e8f0', color: '#043566' }}
                  >
                    <span>ถัดไป</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State - No Data */}
        {!isLoading && !error && visitData.length === 0 && (
          <div className="bg-white rounded-2xl shadow overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 font-medium">ไม่พบข้อมูลสำหรับวันที่ที่เลือก</p>
              <p className="text-sm text-slate-500 mt-2">กรุณาเลือกวันที่อื่น</p>
            </div>
          </div>
        )}

        {/* Empty State - No Search Results */}
        {!isLoading && visitData.length > 0 && filteredData.length === 0 && (
          <div className="bg-white rounded-2xl shadow overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
            <div className="p-12 text-center">
              <Search className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 font-medium">ไม่พบข้อมูลที่ตรงกับการค้นหา</p>
              <p className="text-sm text-slate-500 mt-2">กรุณาลองค้นหาด้วยคำอื่น</p>
            </div>
          </div>
        )}
      </main>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div 
          className="fixed bottom-6 right-6 z-50"
          style={{
            animation: 'slideInUp 0.3s ease-out',
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-green-200 max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-green-100 flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-800">สำเร็จ!</h3>
                  <p className="text-sm text-green-700 mt-1">{successMessage}</p>
                </div>
                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0"
                  aria-label="ปิด"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

