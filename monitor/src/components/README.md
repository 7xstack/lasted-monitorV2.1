# Network Error Popup System

ระบบ popup สำหรับแจ้งเตือนเมื่อเน็ตหลุดหรือต่อฐานข้อมูลไม่ติด

## ไฟล์ที่เกี่ยวข้อง

### 1. NetworkErrorPopup.tsx
Component หลักสำหรับแสดง popup แจ้งเตือน
- แสดงข้อความแจ้งเตือนเมื่อการเชื่อมต่อมีปัญหา
- มีปุ่ม "ลองใหม่" และ "ปิด"
- ใช้ CSS animation สำหรับการแสดงผล

### 2. NetworkErrorPopup.module.css
สไตล์สำหรับ popup
- Overlay สีดำโปร่งใส
- Popup สีขาวพร้อม shadow
- Animation fadeIn และ slideIn
- Responsive design

### 3. useNetworkStatus.ts
Custom hook สำหรับจัดการสถานะการเชื่อมต่อ
- ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
- ตรวจสอบสถานะออนไลน์/ออฟไลน์
- ระบบ retry อัตโนมัติ (สูงสุด 3 ครั้ง)
- ตรวจสอบการเชื่อมต่อทุก 30 วินาที

### 4. NetworkErrorProvider.tsx
Context provider สำหรับจัดการ network status
- ให้บริการ network status ผ่าน context
- รวม NetworkErrorPopup เข้ากับระบบ

## การใช้งาน

ระบบจะทำงานอัตโนมัติเมื่อ:
1. เน็ตหลุด (offline)
2. ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้
3. API response ไม่สำเร็จ

## Features

- ✅ ตรวจสอบการเชื่อมต่ออัตโนมัติ
- ✅ แสดง popup เมื่อมีปัญหา
- ✅ ระบบ retry อัตโนมัติ
- ✅ ปุ่มลองใหม่และปิด
- ✅ Animation ที่สวยงาม
- ✅ Responsive design
- ✅ ใช้ฟอนต์ Thonburi ตามที่กำหนด

