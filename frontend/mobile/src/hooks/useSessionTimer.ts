import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

const SESSION_TIMEOUT_MS = 5 * 60 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000;

export function useSessionTimer(onTimeout: () => void, enabled: boolean) {
  const lastActivity = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const appStateRef = useRef(AppState.currentState);

  const touch = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivity.current;
      if (elapsed > SESSION_TIMEOUT_MS) {
        onTimeout();
      }
    }, CHECK_INTERVAL_MS);

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appStateRef.current === 'background' && next === 'active') {
        const elapsed = Date.now() - lastActivity.current;
        if (elapsed > SESSION_TIMEOUT_MS) {
          onTimeout();
        }
      }
      appStateRef.current = next;
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, [onTimeout, enabled]);

  return { touch };
}
