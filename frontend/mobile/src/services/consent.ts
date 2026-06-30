import AsyncStorage from '@react-native-async-storage/async-storage';
import { analytics } from './analytics';

const TERMS_ACCEPTED_KEY = '@terms_accepted';
const PRIVACY_ACCEPTED_KEY = '@privacy_accepted';
const CONSENT_TRACKING_KEY = '@consent_tracking';
const CONSENT_VERSION_KEY = '@consent_version';

interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

export async function isTermsAccepted(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(TERMS_ACCEPTED_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function isPrivacyAccepted(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PRIVACY_ACCEPTED_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function getConsentPreferences(): Promise<ConsentPreferences | null> {
  try {
    const raw = await AsyncStorage.getItem(CONSENT_TRACKING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function hasAcceptedCurrentConsent(): Promise<boolean> {
  try {
    const version = await AsyncStorage.getItem(CONSENT_VERSION_KEY);
    const currentVersion = '1.0';
    return version === currentVersion;
  } catch {
    return false;
  }
}

export async function markConsentAccepted() {
  await AsyncStorage.setItem(CONSENT_VERSION_KEY, '1.0');
}

export async function checkAndPromptConsent(navigation: any) {
  const termsAccepted = await isTermsAccepted();
  const privacyAccepted = await isPrivacyAccepted();
  const consentCurrent = await hasAcceptedCurrentConsent();

  if (!termsAccepted) {
    navigation.navigate('Terms');
    return false;
  }
  if (!privacyAccepted || !consentCurrent) {
    navigation.navigate('Privacy');
    return false;
  }
  return true;
}

export function updateAnalyticsConsent(prefs: ConsentPreferences) {
  if (!prefs.analytics) {
    analytics.setOptOut(true);
  }
}
