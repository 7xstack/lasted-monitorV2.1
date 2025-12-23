'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Lock, User } from 'lucide-react';

// Mock Data
const MOCK_USERNAME = 'Aztec';
const MOCK_PASSWORD = 'aztecservice';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ล้างค่า authentication เก่าเมื่อเข้าหน้า login
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('isAuthenticated');
      sessionStorage.removeItem('username');
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // ตรวจสอบ credentials
    if (username === MOCK_USERNAME && password === MOCK_PASSWORD) {
      // เก็บ login state ใน sessionStorage (จะล้างเมื่อปิด browser tab)
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('username', username);
      
      // Redirect ไปหน้า setting
      router.push('/setting');
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-slate-50" style={{ backgroundImage: 'linear-gradient(to bottom right, #ffffff, #f8fafc, #f1f5f9)' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border p-8" style={{ borderColor: '#e2e8f0' }}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-md mb-4" style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}>
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#043566' }}>
              เข้าสู่ระบบ
            </h1>
            <p className="text-sm text-slate-600">
              กรุณาเข้าสู่ระบบเพื่อใช้งาน
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl border" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                ชื่อผู้ใช้
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                  placeholder="กรุณากรอกชื่อผู้ใช้"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                รหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                  placeholder="กรุณากรอกรหัสผ่าน"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #043566, #065a9e)' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>
          </form>

          {/* Mock Data Info (for development) */}
          <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(4, 53, 102, 0.05)' }}>
            <p className="text-xs text-slate-600 text-center">
              <strong>Mock Data:</strong> Username: <code className="text-xs bg-white px-2 py-1 rounded">{MOCK_USERNAME}</code> | Password: <code className="text-xs bg-white px-2 py-1 rounded">{MOCK_PASSWORD}</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

