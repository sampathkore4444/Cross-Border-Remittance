import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '@constants/colors';
import { Button } from '@components/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analytics } from '@services/analytics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';

type Props = Partial<NativeStackScreenProps<RootStackParamList, 'Privacy'>>;

const PRIVACY_ACCEPTED_KEY = '@privacy_accepted';
const CONSENT_TRACKING_KEY = '@consent_tracking';

interface PrivacyScreenProps {
  onAccept?: () => void;
}

export default function PrivacyScreen({ onAccept, navigation }: Props & PrivacyScreenProps) {
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const handleAccept = async () => {
    await AsyncStorage.setItem(PRIVACY_ACCEPTED_KEY, 'true');
    await AsyncStorage.setItem(CONSENT_TRACKING_KEY, JSON.stringify({
      analytics: analyticsConsent,
      marketing: marketingConsent,
      timestamp: new Date().toISOString(),
    }));
    analytics.trackEvent('privacy_consent_given', { analytics: analyticsConsent, marketing: marketingConsent });
    if (onAccept) onAccept();
    else navigation?.goBack();
  };

  const handleBack = () => {
    if (onAccept) return;
    navigation?.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {!onAccept && (
          <TouchableOpacity onPress={handleBack} accessible accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Privacy Policy</Text>
        {!onAccept && <View style={styles.backSpacer} />}
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Data We Collect</Text>
        <Text style={styles.bodyText}>
          We collect your name, phone number, transaction history, and device information to provide and improve our service.
          Camera access is used only for QR scanning and photo capture with your explicit action.
        </Text>

        <Text style={styles.sectionTitle}>How We Use Data</Text>
        <Text style={styles.bodyText}>
          Transaction data is used to process transfers, comply with AML regulations, and provide customer support.
          We do not sell your personal data to third parties.
        </Text>

        <Text style={styles.sectionTitle}>Data Retention</Text>
        <Text style={styles.bodyText}>
          Transaction records are retained for 5 years as required by financial regulations.
          You may request deletion of your account data by contacting support.
        </Text>

        <Text style={styles.sectionTitle}>Your Rights</Text>
        <Text style={styles.bodyText}>
          You have the right to access, correct, or delete your personal data.
          You may withdraw consent at any time through your profile settings.
        </Text>

        <Text style={styles.sectionTitle}>Consent Preferences</Text>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAnalyticsConsent(!analyticsConsent)}
          accessible
          accessibilityRole="switch"
          accessibilityState={{ checked: analyticsConsent }}
          accessibilityLabel="Allow analytics cookies to help us improve the app"
        >
          <View style={[styles.checkbox, analyticsConsent && styles.checkboxActive]}>
            {analyticsConsent && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Allow analytics to help us improve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setMarketingConsent(!marketingConsent)}
          accessible
          accessibilityRole="switch"
          accessibilityState={{ checked: marketingConsent }}
          accessibilityLabel="Allow marketing communications about promotions and offers"
        >
          <View style={[styles.checkbox, marketingConsent && styles.checkboxActive]}>
            {marketingConsent && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Receive marketing communications</Text>
        </TouchableOpacity>
      </ScrollView>
      <View style={styles.footer}>
        <Button title="Save Preferences" onPress={handleAccept} fullWidth size="lg" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  backSpacer: { width: 40 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginTop: 20, marginBottom: 8 },
  bodyText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 8 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: Colors.textOnPrimary, fontSize: 14, fontWeight: '700' },
  checkboxLabel: { fontSize: 15, color: Colors.text, flex: 1 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.divider },
});
