import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '@constants/colors';

type ToastType = 'error' | 'success' | 'info';

interface ToastMessage {
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    timerRef.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setToast(null);
      });
    }, 3500);
  }, [opacity]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View style={[styles.container, styles[toast.type], { opacity }]}>
          <Text style={styles.icon}>{toast.type === 'error' ? '✕' : toast.type === 'success' ? '✓' : 'ℹ'}</Text>
          <Text style={styles.text}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 100, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, zIndex: 9999, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8 },
  error: { backgroundColor: '#FF3D00' },
  success: { backgroundColor: '#00C853' },
  info: { backgroundColor: '#1A8CFF' },
  icon: { fontSize: 16, fontWeight: '700', color: '#FFF', marginRight: 10, width: 20, textAlign: 'center' },
  text: { flex: 1, fontSize: 14, color: '#FFF', fontWeight: '500' },
});
