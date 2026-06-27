import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendStackParamList } from '@navigation/types';
import type { PayoutMethod } from '@types/api';

type Props = NativeStackScreenProps<SendStackParamList, 'PayoutMethod'>;

const METHODS: { key: PayoutMethod; time: string }[] = [
  { key: 'bcel_cash', time: '15' },
  { key: 'seven_eleven_cash', time: '15' },
  { key: 'mobile_topup', time: '0' },
  { key: 'bcel_wallet', time: '0' },
];

export default function PayoutMethodScreen({ route, navigation }: Props) {
  const { quote, recipient } = route.params;
  const { t } = useTranslation();
  const [selected, setSelected] = useState<PayoutMethod>('bcel_cash');

  const selectedOption = quote.payout_options?.find(o => o.method === selected);
  const displayAmount = selectedOption?.target_amount || quote.target_amount;

  const handleConfirm = () => {
    navigation.navigate('Confirm', { quote, recipient, payoutMethod: selected, paymentMethod: 'promptpay_qr' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('payout.title')}</Text>
        {METHODS.map(({ key, time }) => {
          const opt = quote.payout_options?.find(o => o.method === key);
          const amount = opt?.target_amount;
          return (
            <TouchableOpacity key={key} onPress={() => setSelected(key)}>
              <Card style={[styles.methodCard, selected === key && styles.methodCardSelected]}>
                <View style={styles.methodHeader}>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>{t(`payout.method.${key}`)}</Text>
                    <Text style={styles.methodTime}>{t('payout.pickupTime', { time })}</Text>
                  </View>
                  {key === 'bcel_cash' && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>{t('payout.recommended')}</Text>
                    </View>
                  )}
                </View>
                {amount && <Text style={styles.methodAmount}>{amount.toLocaleString()} LAK</Text>}
              </Card>
            </TouchableOpacity>
          );
        })}
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>{recipient.name}</Text>
          <Text style={styles.summaryAmount}>{displayAmount.toLocaleString()} LAK</Text>
        </View>
        <Button title={t('payout.confirm')} onPress={handleConfirm} fullWidth size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  methodCard: { marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  methodCardSelected: { borderColor: Colors.primary },
  methodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  methodInfo: { flex: 1 },
  methodName: { fontSize: 17, fontWeight: '600', color: Colors.text },
  methodTime: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  recommendedBadge: { backgroundColor: Colors.secondary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  recommendedText: { fontSize: 10, color: Colors.textOnPrimary, fontWeight: '700' },
  methodAmount: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: 8 },
  summary: { alignItems: 'center', paddingVertical: 24 },
  summaryLabel: { fontSize: 14, color: Colors.textSecondary },
  summaryAmount: { fontSize: 28, fontWeight: '800', color: Colors.text, marginTop: 4 },
});
