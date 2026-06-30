import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { linking } from '@navigation/types';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@hooks/useAuth';
import { RootNavigator } from '@navigation/RootNavigator';
import { wsService } from '@services/websocket';
import {
  registerForPushNotifications,
  setupNotificationChannels,
  addNotificationResponseListener,
  setNotificationTapHandler,
} from '@services/notifications';
import { ToastProvider } from '@components/Toast';
import ErrorBoundary from '@components/ErrorBoundary';
import { analytics } from '@services/analytics';
import { api } from '@services/api';
import type { RootStackParamList } from '@navigation/types';
import './src/i18n';

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    analytics.init();
    wsService.connect();
    setupNotificationChannels();
    registerForPushNotifications();

    setNotificationTapHandler((transactionRef: string) => {
      navigationRef.current?.navigate('TransactionDetail', { ref: transactionRef });
    });

    const sub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      const ref = (data as any)?.transactionRef as string | undefined;
      if (ref) {
        navigationRef.current?.navigate('TransactionDetail', { ref });
      }
    });

    const retryQueue = setInterval(() => api.processOfflineQueue(), 60000);
    return () => { wsService.disconnect(); clearInterval(retryQueue); sub.remove(); };
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <SafeAreaProvider>
          <AuthProvider>
            <NavigationContainer ref={navigationRef} linking={linking}>
              <RootNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </AuthProvider>
        </SafeAreaProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
