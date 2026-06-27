import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import lo from './lo.json';
import th from './th.json';

const STORAGE_KEY = '@ngoensai/language';

async function initLanguage() {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored) return stored;

  const locale = Localization.getLocales()?.[0]?.languageCode || 'lo';
  const supported = ['lo', 'th', 'en'];
  return supported.includes(locale) ? locale : 'lo';
}

initLanguage().then(lng => {
  i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, lo: { translation: lo }, th: { translation: th } },
    lng,
    fallbackLng: 'lo',
    interpolation: { escapeValue: false },
  });
});

export async function changeLanguage(lng: string) {
  await AsyncStorage.setItem(STORAGE_KEY, lng);
  await i18n.changeLanguage(lng);
}

export default i18n;
