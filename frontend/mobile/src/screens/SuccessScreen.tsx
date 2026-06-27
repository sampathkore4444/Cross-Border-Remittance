import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Share } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<SendStackParamList, 'Success'>;

export default function SuccessScreen({ route, navigation }: Props) {
  const { transactionRef, targetAmount, pickupCode, recipientName } = route.params;
  const { t } = useTranslation();

  const shareViaLINE = async () => {
    const msg = pickupCode
      ? `I sent ${targetAmount.toLocaleString()} LAK to ${recipientName}! Pickup code: ${pickupCode}`
      : `I sent ${targetAmount.toLocaleString()} LAK to ${recipientName}! Ref: ${transactionRef}`;
    await Share.share({ message: msg });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
        <Text style={styles.title}>{t('success.title')}</Text>
        <Text style={styles.subtitle}>{t('success.subtitle')}</Text>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryAmount}>{targetAmount.toLocaleString()} LAK</Text>
          <Text style={styles.summaryTo}>{recipientName}</Text>
          {pickupCode && (
            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>Code:</Text>
              <Text style={styles.codeValue}>{pickupCode}</Text>
            </View>
          )}
          <Text style={styles.refText}>Ref: {transactionRef}</Text>
        </Card>
        <View style={styles.buttons}>
          {pickupCode && <Button title={t('success.share')} onPress={shareViaLINE} variant="outline" fullWidth />}
          <Button title={t('success.track')} onPress={() => navigation.getParent()?.navigate('TransactionDetail', { ref: transactionRef })} variant="outline" fullWidth />
          <Button title={t('success.sendAgain')} onPress={() => navigation.getParent()?.navigate('Send', { screen: 'Amount' })} fullWidth />
          <Button title={t('success.done')} onPress={() => navigation.getParent()?.navigate('Main', { screen: 'Home' })} variant="ghost" fullWidth />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  checkmark: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  checkmarkText: { fontSize: 40, color: Colors.textOnPrimary, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 32 },
  summaryCard: { alignItems: 'center', padding: 24, width: '100%', marginBottom: 32 },
  summaryAmount: { fontSize: 32, fontWeight: '800', color: Colors.primary },
  summaryTo: { fontSize: 18, fontWeight: '600', color: Colors.text, marginTop: 8 },
  codeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  codeLabel: { fontSize: 14, color: Colors.textSecondary, marginRight: 8 },
  codeValue: { fontSize: 20, fontWeight: '800', color: Colors.text, letterSpacing: 2 },
  refText: { fontSize: 12, color: Colors.textLight, marginTop: 8 },
  buttons: { width: '100%', gap: 12 },
});
