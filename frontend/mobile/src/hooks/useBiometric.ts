import { useState, useCallback } from 'react';

export function useBiometric() {
  const [isAvailable, setIsAvailable] = useState(false);

  const checkAvailability = useCallback(async () => {
    try {
      const LocalAuth = require('expo-local-authentication');
      const compatible = await LocalAuth.hasHardwareAsync();
      const enrolled = await LocalAuth.isEnrolledAsync();
      setIsAvailable(compatible && enrolled);
      return compatible && enrolled;
    } catch {
      setIsAvailable(false);
      return false;
    }
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      const LocalAuth = require('expo-local-authentication');
      const result = await LocalAuth.authenticateAsync({
        promptMessage: 'Unlock NgoenSai',
        fallbackLabel: 'Enter passcode',
        cancelLabel: 'Cancel',
      });
      return result.success;
    } catch {
      return false;
    }
  }, []);

  return { isAvailable, checkAvailability, authenticate };
}
