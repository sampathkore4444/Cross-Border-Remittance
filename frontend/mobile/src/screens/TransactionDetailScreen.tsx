import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Share } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Loading } from '@components/Loading';
import { api } from '@services/api';
import type { Transaction } from '@types/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TransactionDetail'>;

const STEPS = ['sent', 'paid', 'ready', 'pickedUp'];

export default function TransactionDetailScreen({ route }: Props) {
  const { ref } = route.params;
  const { t } = useTranslation();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTransaction(ref).then(setTx).catch(() => { }).finally(() => setLoading(false));
  }, [ref]);

  if (loading) return <Loading fullScreen />;
  if (!tx) return <View style={styles.container}><Text>{t('common.error')}</Text></View>;

  const shareReceipt = () => Share.share({ message: `NgoenSai Transaction ${tx.transaction_ref}\nSent ${tx.source_amount} ${tx.source_currency}\nReceived ${tx.target_amount} ${tx.target_currency}\nStatus: ${tx.status}` });

  const currentStep = { pending: 0, paid: 1, payout_initiated: 2, completed: 3, redeemed: 4 }[tx.status] ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.amountCard}>
          <Text style={styles.sendAmount}>-{tx.source_amount.toLocaleString()} {tx.source_currency}</Text>
          <Text style={styles.receiveAmount}>+{tx.target_amount.toLocaleString()} {tx.target_currency}</Text>
          <Text style={styles.rate}>Rate: 1 {tx.source_currency} = {tx.exchange_rate} {tx.target_currency}</Text>
        </Card>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>{t('transaction.ref')}</Text><Text style={styles.infoValue}>{tx.transaction_ref}</Text></View>
          <View style={styles.divider} />
          <View style={styles.infoRow}><Text style={styles.infoLabel}>{t('confirm.recipient')}</Text><Text style={styles.infoValue}>{tx.recipient_name}</Text></View>
          <View style={styles.divider} />
          <View style={styles.infoRow}><Text style={styles.infoLabel}>{t('recipient.phone')}</Text><Text style={styles.infoValue}>{tx.recipient_phone}</Text></View>
          <View style={styles.divider} />
          <View style={styles.infoRow}><Text style={styles.infoLabel}>{t('transaction.timeline')}</Text><Text style={[styles.statusBadge, tx.status === 'completed' && styles.statusCompleted]}>{tx.status}</Text></View>
        </Card>
        <Card style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>{t('transaction.timeline')}</Text>
          {STEPS.map((step, i) => (
            <View key={step} style={styles.timelineItem}>
              <View style={[styles.timelineDot, i <= currentStep && styles.timelineDotActive]} />
              {i < STEPS.length - 1 && <View style={[styles.timelineLine, i < currentStep && styles.timelineLineActive]} />}
              <Text style={[styles.timelineText, i <= currentStep && styles.timelineTextActive]}>{t(`transaction.${step}`)}</Text>
            </View>
          ))}
        </Card>
        <View style={styles.buttons}>
          <Button title={t('transaction.shareReceipt')} onPress={shareReceipt} variant="outline" fullWidth />
          <Button title={t('transaction.sendAgain')} onPress={() => { }} fullWidth />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  amountCard: { alignItems: 'center', padding: 24, marginBottom: 16 },
  sendAmount: { fontSize: 20, fontWeight: '700', color: Colors.error },
  receiveAmount: { fontSize: 28, fontWeight: '800', color: Colors.success, marginTop: 4 },
  rate: { fontSize: 13, color: Colors.textLight, marginTop: 8 },
  infoCard: { marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  infoLabel: { fontSize: 14, color: Colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.divider },
  statusBadge: { fontSize: 12, fontWeight: '600', color: Colors.accent, backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
  statusCompleted: { color: Colors.success, backgroundColor: Colors.rateBadge },
  timelineCard: { padding: 16, marginBottom: 16 },
  timelineTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4, minHeight: 40 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.border, marginTop: 4, marginRight: 12 },
  timelineDotActive: { backgroundColor: Colors.primary },
  timelineLine: { position: 'absolute', left: 6, top: 18, width: 2, height: 30, backgroundColor: Colors.border },
  timelineLineActive: { backgroundColor: Colors.primary },
  timelineText: { fontSize: 14, color: Colors.textLight, paddingTop: 2 },
  timelineTextActive: { color: Colors.text, fontWeight: '500' },
  buttons: { gap: 12, marginTop: 8 },
});
