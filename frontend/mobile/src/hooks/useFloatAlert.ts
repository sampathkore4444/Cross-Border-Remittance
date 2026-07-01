import { useEffect, useRef } from 'react';
import { scheduleFloatAlert, cancelAllFloatAlerts } from '@services/notifications';

export function useFloatAlert(floatBalanceLAK: number, floatMinimum: number) {
  const prevBalance = useRef(floatBalanceLAK);

  useEffect(() => {
    if (floatBalanceLAK < floatMinimum && floatBalanceLAK < prevBalance.current) {
      scheduleFloatAlert(floatMinimum, floatBalanceLAK);
    }
    prevBalance.current = floatBalanceLAK;
    return () => { cancelAllFloatAlerts(); };
  }, [floatBalanceLAK, floatMinimum]);
}
