import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@hooks/useAuth';
import { Loading } from '@components/Loading';
import LockScreen from '@screens/LockScreen';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { SendNavigator } from './SendNavigator';
import TransactionDetailScreen from '@screens/TransactionDetailScreen';
import AgentDashboardScreen from '@screens/AgentDashboardScreen';
import AutosendSettingsScreen from '@screens/AutosendSettingsScreen';
import QRScannerScreen from '@screens/QRScannerScreen';
import RecipientPhotoCapture from '@screens/RecipientPhotoCapture';
import TermsScreen from '@screens/TermsScreen';
import PrivacyScreen from '@screens/PrivacyScreen';
import { isTermsAccepted, isPrivacyAccepted, hasAcceptedCurrentConsent, markConsentAccepted, updateAnalyticsConsent, getConsentPreferences } from '@services/consent';
import { initFeatureFlags } from '@services/featureFlags';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isLoading, isLocked, unlock } = useAuth();
  const [consentState, setConsentState] = useState<'loading' | 'terms' | 'privacy' | 'done'>('loading');

  useEffect(() => {
    if (!isAuthenticated) {
      setConsentState('loading');
      return;
    }
    (async () => {
      await initFeatureFlags();
      const prefs = await getConsentPreferences();
      if (prefs) updateAnalyticsConsent(prefs);

      const termsOk = await isTermsAccepted();
      if (!termsOk) { setConsentState('terms'); return; }

      const privacyOk = await isPrivacyAccepted();
      const consentCurrent = await hasAcceptedCurrentConsent();
      if (!privacyOk || !consentCurrent) { setConsentState('privacy'); return; }

      setConsentState('done');
    })();
  }, [isAuthenticated]);

  const handleTermsDone = () => {
    setConsentState('privacy');
  };

  const handlePrivacyDone = async () => {
    await markConsentAccepted();
    setConsentState('done');
  };

  if (isLoading) return <Loading fullScreen message="Loading..." />;

  if (isAuthenticated && isLocked) {
    return <LockScreen onUnlock={unlock} />;
  }

  if (isAuthenticated && consentState === 'terms') {
    return <TermsScreen onAccept={handleTermsDone} />;
  }

  if (isAuthenticated && consentState === 'privacy') {
    return <PrivacyScreen onAccept={handlePrivacyDone} />;
  }

  if (isAuthenticated && consentState === 'loading') {
    return <Loading fullScreen message="Loading..." />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="Send" component={SendNavigator} />
          <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
          <Stack.Screen name="AgentDashboard" component={AgentDashboardScreen} />
          <Stack.Screen name="AutosendSettings" component={AutosendSettingsScreen} />
          <Stack.Screen name="QRScanner" component={QRScannerScreen} />
          <Stack.Screen name="PhotoCapture" component={RecipientPhotoCapture} />
          <Stack.Screen name="Terms" component={TermsScreen} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
