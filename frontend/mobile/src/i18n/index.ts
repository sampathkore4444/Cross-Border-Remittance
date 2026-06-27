import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import lo from './lo.json';
import th from './th.json';

const STORAGE_KEY = '@ngoensai/language';

const lng = 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, lo: { translation: lo }, th: { translation: th } },
  lng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export async function changeLanguage(lng: string) {
  await AsyncStorage.setItem(STORAGE_KEY, lng);
  await i18n.changeLanguage(lng);
}

export default i18n;
