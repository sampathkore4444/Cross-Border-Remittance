import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type NotificationTapCallback = (transactionRef: string) => void;

let _onNotificationTap: NotificationTapCallback | null = null;

export function setNotificationTapHandler(cb: NotificationTapCallback) {
  _onNotificationTap = cb;
}

export function getNotificationTapHandler(): NotificationTapCallback | null {
  return _onNotificationTap;
}

export async function registerForPushNotifications() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const expoToken = await Notifications.getExpoPushTokenAsync();
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
      await Notifications.setNotificationChannelAsync('transactions', {
        name: 'Transactions',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 100, 50, 100],
      });
      await Notifications.setNotificationChannelAsync('promotions', {
        name: 'Promotions',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    } catch { }
  }
}

export async function updateBadgeCount(count: number) {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch { }
}

export async function getBadgeCount(): Promise<number> {
  try {
    const count = await Notifications.getBadgeCountAsync();
    return count;
  } catch {
    return 0;
  }
}

export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

export function getLastNotificationResponse() {
  return Notifications.getLastNotificationResponseAsync();
}
