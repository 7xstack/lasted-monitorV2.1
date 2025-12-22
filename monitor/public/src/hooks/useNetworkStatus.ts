'use client';

import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isConnected: boolean;
  showError: boolean;
  errorType: 'network' | 'server' | 'timeout' | null;
  errorMessage: string | null;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true,
    isConnected: true,
    showError: false,
    errorType: null,
    errorMessage: null
  });

  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
  const checkInternetConnection = useCallback(async () => {
    // We will rely on navigator.onLine and WebSocket status for connectivity checks
    // to avoid unnecessary API calls.
    if (!navigator.onLine) {
      setNetworkStatus(prev => ({
        ...prev,
        isConnected: false,
        showError: true,
        errorType: 'network',
        errorMessage: 'การเชื่อมต่ออินเทอร์เน็ตถูกตัด'
      }));
      return false;
    }
    
    // Assuming if browser is online, the connection is potentially good.
    // WebSocket connection will provide the real status.
    setNetworkStatus(prev => ({
      ...prev,
      isConnected: true,
      showError: false,
      errorType: null,
      errorMessage: null
    }));
    setRetryCount(0);
    return true;

    /*
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          department_load: '1',
          visit_date: new Date().toISOString().split('T')[0]
        }),
        signal: AbortSignal.timeout(5000) // timeout 5 วินาที
      });

      if (response.ok) {
        setNetworkStatus(prev => ({
          ...prev,
          isConnected: true,
          showError: false,
          errorType: null,
          errorMessage: null
        }));
        setRetryCount(0);
        return true;
      } else {
        // มี response แต่เป็น error - แสดงข้อความจาก response
        const errorText = await response.text();
        let errorMessage = 'Server Error';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        setNetworkStatus(prev => ({
          ...prev,
          isConnected: false,
          showError: true,
          errorType: 'server',
          errorMessage: errorMessage
        }));
        return false;
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      
      // ตรวจสอบว่าเป็น timeout error หรือไม่
      const isTimeoutError = error instanceof Error && 
        (error.name === 'TimeoutError' || 
         error.message.includes('timeout') ||
         error.message.includes('AbortError'));
      
      // ตรวจสอบว่าเป็น network error หรือไม่
      const isNetworkError = error instanceof TypeError && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('NetworkError') ||
         error.message.includes('fetch'));
      
      let errorType: 'network' | 'server' | 'timeout' = 'server';
      let errorMessage = 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ';
      
      if (isTimeoutError) {
        errorType = 'timeout';
        errorMessage = 'การเชื่อมต่อหมดเวลา (Timeout)';
      } else if (isNetworkError) {
        errorType = 'network';
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setNetworkStatus(prev => ({
        ...prev,
        isConnected: false,
        showError: true,
        errorType: errorType,
        errorMessage: errorMessage
      }));
      return false;
    }
    */
  }, []);

  // ตรวจสอบสถานะออนไลน์/ออฟไลน์
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true
      }));
      // ลองเชื่อมต่อใหม่เมื่อกลับมาออนไลน์
      checkInternetConnection();
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        showError: true,
        errorType: 'network',
        errorMessage: 'การเชื่อมต่ออินเทอร์เน็ตถูกตัด'
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // ตรวจสอบการเชื่อมต่อเป็นระยะ
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkInternetConnection();
      }
    }, 30000); // ตรวจสอบทุก 30 วินาที

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkInternetConnection]);

  const retryConnection = useCallback(async () => {
    setRetryCount(prev => prev + 1);
    
    if (retryCount >= maxRetries) {
      setNetworkStatus(prev => ({
        ...prev,
        showError: false
      }));
      return;
    }

    const success = await checkInternetConnection();
    if (!success && retryCount < maxRetries - 1) {
      // รอ 2 วินาทีก่อนลองใหม่
      setTimeout(() => {
        retryConnection();
      }, 2000);
    }
  }, [checkInternetConnection, retryCount, maxRetries]);

  const closeError = useCallback(() => {
    setNetworkStatus(prev => ({
      ...prev,
      showError: false,
      errorType: null,
      errorMessage: null
    }));
    setRetryCount(0);
  }, []);

  return {
    ...networkStatus,
    retryConnection,
    closeError,
    retryCount,
    maxRetries
  };
}
