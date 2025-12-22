import TTSTest from '../../components/TTSTest';

/**
 * หน้าทดสอบ Google TTS
 * เข้าถึงได้ที่ /tts-test
 */
export default function TTSTestPage() {
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px'
      }}>
        <h1 style={{ 
          textAlign: 'center',
          color: '#333',
          marginBottom: '30px'
        }}>
          ทดสอบ Google Text-to-Speech
        </h1>
        
        <TTSTest />
        
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h4>คำแนะนำการใช้งาน:</h4>
          <ol style={{ paddingLeft: '20px' }}>
            <li>ตั้งค่า Google TTS API Key ในไฟล์ .env.local</li>
            <li>เปิดใช้งาน Text-to-Speech API ใน Google Cloud Console</li>
            <li>ทดสอบเสียงต่างๆ เพื่อเลือกเสียงที่เหมาะสม</li>
            <li>Neural voices จะให้เสียงที่ชัดเจนและเป็นธรรมชาติกว่า</li>
          </ol>
          
          <h4>การแก้ไขปัญหา:</h4>
          <ul style={{ paddingLeft: '20px' }}>
            <li>หากไม่ได้ยินเสียง: ตรวจสอบ API Key และการเปิดใช้งาน API</li>
            <li>หากเสียงไม่ชัด: ลองใช้ Neural voices แทน Standard voices</li>
            <li>หากเกิดข้อผิดพลาด: ระบบจะ fallback ไปใช้ browser TTS อัตโนมัติ</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
