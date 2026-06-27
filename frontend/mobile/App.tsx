import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@hooks/useAuth';
import { RootNavigator } from '@navigation/RootNavigator';
import { wsService } from '@services/websocket';
import { registerForPushNotifications, setupNotificationChannels } from '@services/notifications';
import './src/i18n';

export default function App() {
  useEffect(() => {
    wsService.connect();
    setupNotificationChannels();
    registerForPushNotifications();
    return () => { wsService.disconnect(); };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
