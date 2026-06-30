import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '@constants/colors';
import { Button } from '@components/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';

type Props = Partial<NativeStackScreenProps<RootStackParamList, 'Terms'>>;

const TERMS_ACCEPTED_KEY = '@terms_accepted';

const TERMS_CONTENT = `
NgoenSai Terms of Service

1. Acceptance of Terms
By using NgoenSai, you agree to these terms. If you do not agree, do not use the service.

2. Service Description
NgoenSai provides cross-border remittance services from Thailand to Laos. We facilitate money transfers through partner payout networks.

3. User Responsibilities
You must provide accurate information, maintain confidentiality of your account credentials, and comply with all applicable laws.

4. Transaction Limits
Transactions are subject to daily and monthly limits based on your KYC verification level.

5. Fees and Exchange Rates
Fees and exchange rates are displayed before transaction confirmation. Rates are locked for 15 minutes.

6. Anti-Money Laundering
We comply with AML/CFT regulations. We may request additional documentation for transactions above thresholds.

7. Limitation of Liability
NgoenSai is not liable for delays caused by partner networks, force majeure, or incorrect information provided by users.

8. Termination
We reserve the right to suspend or terminate accounts that violate these terms or applicable laws.
`;

interface TermsScreenProps {
  onAccept?: () => void;
}

export default function TermsScreen({ onAccept, navigation }: Props & TermsScreenProps) {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    await AsyncStorage.setItem(TERMS_ACCEPTED_KEY, 'true');
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
        <Text style={styles.title}>Terms of Service</Text>
        {!onAccept && <View style={styles.backSpacer} />}
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.bodyText}>{TERMS_CONTENT.trim()}</Text>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAccepted(!accepted)}
          accessible
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          accessibilityLabel="I accept the terms of service"
        >
          <View style={[styles.checkbox, accepted && styles.checkboxActive]}>
            {accepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>I accept the Terms of Service</Text>
        </TouchableOpacity>
        <Button title="Accept & Continue" onPress={handleAccept} disabled={!accepted} fullWidth size="lg" />
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
  bodyText: { fontSize: 14, color: Colors.text, lineHeight: 22 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.divider, gap: 12 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: Colors.textOnPrimary, fontSize: 14, fontWeight: '700' },
  checkboxLabel: { fontSize: 15, color: Colors.text, flex: 1 },
});
