'use client';

import React from 'react';
import styles from './NetworkErrorPopup.module.css';

interface NetworkErrorPopupProps {
  isVisible: boolean;
  onRetry: () => void;
  onClose: () => void;
  errorType?: 'network' | 'server' | 'timeout' | null;
  errorMessage?: string | null;
}

export default function NetworkErrorPopup({ 
  isVisible, 
  onRetry, 
  onClose, 
  errorType = 'network', 
  errorMessage = null 
}: NetworkErrorPopupProps) {
  if (!isVisible) return null;

  // กำหนดข้อความและไอคอนตามประเภทของ error
  const getErrorInfo = () => {
    if (errorType === 'network') {
      return {
        icon: '🌐',
        title: 'การเชื่อมต่อมีปัญหา',
        message: errorMessage || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้\nกรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
      };
    } else if (errorType === 'timeout') {
      return {
        icon: '⏰',
        title: 'การเชื่อมต่อหมดเวลา',
        message: errorMessage || 'การเชื่อมต่อหมดเวลา (Timeout)\nกรุณาลองใหม่อีกครั้ง'
      };
    } else if (errorType === 'server') {
      return {
        icon: '⚠️',
        title: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์',
        message: errorMessage || 'เซิร์ฟเวอร์ส่งข้อผิดพลาดกลับมา\nกรุณาลองใหม่อีกครั้ง'
      };
    } else {
      return {
        icon: '❌',
        title: 'เกิดข้อผิดพลาด',
        message: errorMessage || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ'
      };
    }
  };

  const errorInfo = getErrorInfo();

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.header}>
          <div className={styles.icon}>{errorInfo.icon}</div>
          <h3 className={styles.title}>{errorInfo.title}</h3>
        </div>
        
        <div className={styles.content}>
          <p className={styles.message}>
            {errorInfo.message.split('\n').map((line, index) => (
              <span key={index}>
                {line}
                {index < errorInfo.message.split('\n').length - 1 && <br />}
              </span>
            ))}
          </p>
        </div>
        
        <div className={styles.actions}>
          <button 
            className={styles.retryButton}
            onClick={onRetry}
          >
            ลองใหม่
          </button>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
