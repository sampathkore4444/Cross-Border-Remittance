import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Button } from '@components/Button';
import { Loading } from '@components/Loading';
import { api } from '@services/api';
import { Config } from '@constants/config';
import { useToast } from '@components/Toast';
import { validateAmount } from '@utils/validation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<SendStackParamList, 'Amount'>;

const SUGGESTED = [3000, 5000, 10000];

export default function AmountScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState(575);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getQuote({ source_amount: 5000, source_currency: 'THB', target_currency: 'LAK', payout_method: 'bcel_cash', recipient_phone: '' })
      .then(q => setRate(q.exchange_rate)).catch(() => {
        showToast(t('common.networkError'), 'info');
      }).finally(() => setLoading(false));
  }, [showToast, t]);

  const numAmount = parseFloat(amount) || 0;
  const targetAmount = Math.round(numAmount * rate);
  const formattedTarget = targetAmount.toLocaleString();

  const handleNext = async () => {
    const amountError = validateAmount(numAmount);
    if (amountError) { showToast(t(amountError), 'error'); return; }
    try {
      const quote = await api.getQuote({ source_amount: numAmount, source_currency: 'THB', target_currency: 'LAK', payout_method: 'bcel_cash', recipient_phone: '' });
      navigation.navigate('Recipient', { quote });
    } catch {
      showToast(t('common.networkError'), 'error');
    }
  };

  if (loading) return <Loading fullScreen />;

  const handleDigit = (d: string) => {
    if (d === 'back') { setAmount(prev => prev.slice(0, -1)); return; }
    setAmount(prev => prev + d);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('amount.title')}</Text>
        <View style={styles.amountDisplay}>
          <Text style={styles.currencyLabel}>{t('amount.thb')}</Text>
          <Text style={styles.amountValue}>{numAmount > 0 ? numAmount.toLocaleString() : '0'}</Text>
        </View>
        {numAmount > 0 && (
          <View style={styles.targetDisplay}>
            <Text style={styles.targetLabel}>{t('amount.lak')}</Text>
            <Text style={styles.targetValue}>{formattedTarget}</Text>
          </View>
        )}
        <View style={styles.rateBadge}>
          <Text style={styles.rateText}>{t('amount.rateLocked')}</Text>
        </View>
        <View style={styles.suggestedRow}>
          {SUGGESTED.map(s => (
            <TouchableOpacity key={s} style={[styles.suggestedChip, numAmount === s && styles.suggestedChipActive]} onPress={() => setAmount(s.toString())}>
              <Text style={[styles.suggestedText, numAmount === s && styles.suggestedTextActive]}>{s.toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.keypad}>
          {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['00', '0', 'back']].map((row, ri) => (
            <View key={ri} style={styles.keypadRow}>
              {row.map(key => (
                <TouchableOpacity key={key} style={styles.key} onPress={() => handleDigit(key)}>
                  <Text style={styles.keyText}>{key === 'back' ? '⌫' : key}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
        <Button title={t('amount.next')} onPress={handleNext} disabled={numAmount <= 0} fullWidth size="lg" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 24 },
  amountDisplay: { alignItems: 'center', marginBottom: 4 },
  currencyLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: 4 },
  amountValue: { fontSize: 48, fontWeight: '800', color: Colors.text },
  targetDisplay: { alignItems: 'center', marginBottom: 8 },
  targetLabel: { fontSize: 13, color: Colors.textSecondary },
  targetValue: { fontSize: 20, fontWeight: '600', color: Colors.text },
  rateBadge: { alignItems: 'center', marginBottom: 24 },
  rateText: { fontSize: 12, color: Colors.textLight },
  suggestedRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24 },
  suggestedChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  suggestedChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  suggestedText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  suggestedTextActive: { color: Colors.textOnPrimary },
  keypad: { marginBottom: 16 },
  keypadRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  key: { width: 80, height: 60, borderRadius: 12, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.divider },
  keyText: { fontSize: 24, fontWeight: '500', color: Colors.text },
});
