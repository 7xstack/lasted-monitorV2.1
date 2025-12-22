'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import NetworkErrorPopup from './NetworkErrorPopup';

interface NetworkErrorContextType {
  isOnline: boolean;
  isConnected: boolean;
  showError: boolean;
  errorType: 'network' | 'server' | 'timeout' | null;
  errorMessage: string | null;
  retryConnection: () => void;
  closeError: () => void;
  retryCount: number;
  maxRetries: number;
}

const NetworkErrorContext = createContext<NetworkErrorContextType | undefined>(undefined);

export function useNetworkError() {
  const context = useContext(NetworkErrorContext);
  if (context === undefined) {
    throw new Error('useNetworkError must be used within a NetworkErrorProvider');
  }
  return context;
}

interface NetworkErrorProviderProps {
  children: ReactNode;
}

export default function NetworkErrorProvider({ children }: NetworkErrorProviderProps) {
  const networkStatus = useNetworkStatus();

  return (
    <NetworkErrorContext.Provider value={networkStatus}>
      {children}
      <NetworkErrorPopup
        isVisible={networkStatus.showError}
        onRetry={networkStatus.retryConnection}
        onClose={networkStatus.closeError}
        errorType={networkStatus.errorType}
        errorMessage={networkStatus.errorMessage}
      />
    </NetworkErrorContext.Provider>
  );
}
