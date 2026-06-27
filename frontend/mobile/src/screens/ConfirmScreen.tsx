import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { api } from '@services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<SendStackParamList, 'Confirm'>;

export default function ConfirmScreen({ route, navigation }: Props) {
  const { quote, recipient, payoutMethod, paymentMethod } = route.params;
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const res = await api.send({
        idempotency_key: idempotencyKey,
        quote_id: quote.quote_id,
        recipient: { phone: recipient.phone.replace(/^856/, '856'), name: recipient.name, relationship: recipient.relationship, province: recipient.province },
        payout_method: payoutMethod,
        payment_method: paymentMethod,
      });
      if (res.payment.qr_code) {
        navigation.replace('QR', { sendResponse: res });
      } else {
        navigation.replace('Success', { transactionRef: res.transaction_ref, targetAmount: quote.target_amount, pickupCode: undefined, recipientName: recipient.name });
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('confirm.title')}</Text>
        <Card style={styles.summaryCard}>
          <View style={styles.row}>
            <Text style={styles.label}>{t('confirm.sending')}</Text>
            <Text style={styles.value}>{quote.source_amount.toLocaleString()} THB</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>{t('confirm.receiving')}</Text>
            <Text style={styles.valueLarge}>{quote.target_amount.toLocaleString()} LAK</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>{t('confirm.rate')}</Text>
            <Text style={styles.value}>1 THB = {quote.exchange_rate} LAK</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('confirm.midMarket')}</Text>
            <Text style={styles.valueLight}>= {quote.fee_breakdown.mid_market_rate || quote.exchange_rate + 3} LAK</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>{t('confirm.fee')}</Text>
            <Text style={styles.valueGreen}>{quote.fee_breakdown.total_fee_percent}%</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>{t('confirm.recipient')}</Text>
            <Text style={styles.value}>{recipient.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('confirm.payoutMethod')}</Text>
            <Text style={styles.value}>{t(`payout.method.${payoutMethod}`)}</Text>
          </View>
        </Card>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title={t('confirm.payNow')} onPress={handlePay} loading={loading} fullWidth size="lg" style={styles.payBtn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  summaryCard: { marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  label: { fontSize: 15, color: Colors.textSecondary },
  value: { fontSize: 15, fontWeight: '600', color: Colors.text },
  valueLarge: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  valueLight: { fontSize: 14, color: Colors.textLight },
  valueGreen: { fontSize: 15, fontWeight: '600', color: Colors.success },
  divider: { height: 1, backgroundColor: Colors.divider },
  error: { color: Colors.error, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  payBtn: { marginTop: 8 },
});
