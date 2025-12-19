'use client';

interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  action: string;
  id: string;
}

export default function SuccessPopup({ isOpen, onClose, action, id }: SuccessPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className={`bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-bounce-in pointer-events-auto border-l-4 ${action === 'ลบ' ? 'border-red-500' : 'border-green-500'}`}>
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${action === 'ลบ' ? 'bg-red-100' : 'bg-green-100'}`}>
              {action === 'ลบ' ? (
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">
              {action}ข้อมูลสำเร็จ!
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              หน้าจอ ID: <span className="font-semibold text-blue-600">{id}</span>
            </p>
            <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full animate-progress ${action === 'ลบ' ? 'bg-red-500' : 'bg-green-500'}`} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

