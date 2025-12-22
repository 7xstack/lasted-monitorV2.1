'use client';

interface ErrorPopupProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export default function ErrorPopup({ isOpen, onClose, message }: ErrorPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-bounce-in pointer-events-auto border-l-4 border-red-500">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-100">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">
              ข้อมูลไม่ครบถ้วน
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {message}
            </p>
            <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full animate-progress bg-red-500" />
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

