import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from './api';

export async function registerForPushNotifications() {
  try {
    const { getExpoPushTokenAsync } = await import('expo-notifications');
    const expoToken = await getExpoPushTokenAsync();
    const token = expoToken.data;
    if (token) {
      await SecureStore.setItemAsync('push_token', token);
      try {
        await api.client.post('/auth/device', { push_token: token, platform: Platform.OS });
      } catch { }
    }
  } catch { }
}

export async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    try {
      const { setNotificationChannelAsync, AndroidImportance } = await import('expo-notifications');
      await setNotificationChannelAsync('transactions', {
        name: 'Transactions',
        importance: AndroidImportance.HIGH,
        vibrationPattern: [0, 100, 50, 100],
      });
      await setNotificationChannelAsync('promotions', {
        name: 'Promotions',
        importance: AndroidImportance.DEFAULT,
      });
    } catch { }
  }
}
