import { useEffect } from 'react';

export function logClientEvent(context: string, message: string) {
  if (typeof window === 'undefined') return;

  const timestamp = new Date().toISOString();
  const entry = `${timestamp} [${context}] ${message}`;
  const key = `qfit:ttsLogs:${context}`;

  try {
    const existing = window.sessionStorage.getItem(key);
    window.sessionStorage.setItem(key, existing ? `${existing}\n${entry}` : entry);
  } catch (error) {
    // Swallow storage errors silently
    console.error('Failed to write log to sessionStorage:', error);
  }
}

/**
 * React hook helper to automatically log a mount event.
 */
export function useMountLog(context: string, message: string) {
  useEffect(() => {
    logClientEvent(context, message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
