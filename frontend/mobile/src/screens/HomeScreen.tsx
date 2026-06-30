import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Card } from '@components/Card';
import { Avatar } from '@components/Avatar';
import { Button } from '@components/Button';
import { Loading } from '@components/Loading';
import { api } from '@services/api';
import { useToast } from '@components/Toast';
import type { Transaction, AutosendConfig } from '@types/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList } from '@navigation/types';

type Props = NativeStackScreenProps<MainTabParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [rate, setRate] = useState('575');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [autosendCfg, setAutosendCfg] = useState<AutosendConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [quote, history, autosend] = await Promise.all([
        api.getQuote({ source_amount: 1000, source_currency: 'THB', target_currency: 'LAK', payout_method: 'bcel_cash', recipient_phone: '' }).catch(() => {
          showToast(t('common.networkError'), 'info');
          return null;
        }),
        api.getHistory(1, 5).catch(() => {
          showToast(t('common.networkError'), 'info');
          return { transactions: [] };
        }),
        api.getAutosendConfig().catch(() => null),
      ]);
      if (quote) setRate(quote.exchange_rate.toString());
      setTransactions(history.transactions);
      setAutosendCfg(autosend);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  }, [showToast, t]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <Loading fullScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}>
        <View style={styles.rateCard}>
          <Text style={styles.rateLabel}>{t('home.rate', { rate })}</Text>
          <Text style={styles.rateSubtext}>{t('common.loading')}</Text>
        </View>
        {autosendCfg?.enabled && autosendCfg.next_send_at ? (
          <TouchableOpacity style={styles.autosendBanner} activeOpacity={0.8} onPress={() => (navigation as any).navigate('AutosendSettings')}>
            <Text style={styles.autosendText}>
              {t('home.autosend', {
                date: new Date(autosendCfg.next_send_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                amount: autosendCfg.amount.toLocaleString(),
              })}
            </Text>
            <Text style={styles.autosendArrow}>→</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.autosendBanner} activeOpacity={0.8} onPress={() => (navigation as any).navigate('AutosendSettings')}>
            <Text style={styles.autosendText}>{t('home.autosend', { date: '—', amount: '0' })}</Text>
            <Text style={styles.autosendArrow}>→</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.sendCard} activeOpacity={0.9} onPress={() => (navigation as any).navigate('Send', { screen: 'Amount' })}>
          <Text style={styles.sendTitle}>{t('home.sendToLaos')}</Text>
          <Text style={styles.sendArrow}>→</Text>
        </TouchableOpacity>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
            {['Mae', 'Bounmy', 'Touy'].map((name, i) => (
              <TouchableOpacity key={i} style={styles.quickItem} onPress={() => (navigation as any).navigate('Send', { screen: 'Amount' })}>
                <Avatar name={name} size={56} />
                <Text style={styles.quickName}>{name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.recentTransactions')}</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('History')}>
              <Text style={styles.viewAll}>{t('home.viewAll')}</Text>
            </TouchableOpacity>
          </View>
          {transactions.length === 0 ? (
            <Card style={styles.emptyCard}><Text style={styles.emptyText}>{t('home.noTransactions')}</Text></Card>
          ) : transactions.map((tx, i) => (
            <TouchableOpacity key={i} onPress={() => (navigation as any).navigate('TransactionDetail', { ref: tx.transaction_ref })}>
              <Card style={styles.txCard}>
                <View style={styles.txRow}>
                  <Avatar name={tx.recipient_name} size={40} />
                  <View style={styles.txInfo}>
                    <Text style={styles.txName}>{tx.recipient_name}</Text>
                    <Text style={styles.txStatus}>{tx.status}</Text>
                  </View>
                  <View style={styles.txAmount}>
                    <Text style={styles.txAmountText}>{tx.source_amount.toLocaleString()} {tx.source_currency}</Text>
                    <Text style={styles.txAmountLak}>{tx.target_amount.toLocaleString()} {tx.target_currency}</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  rateCard: { backgroundColor: Colors.rateBadge, borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 16 },
  rateLabel: { fontSize: 16, fontWeight: '700', color: Colors.rateText },
  rateSubtext: { fontSize: 12, color: Colors.rateText, opacity: 0.7, marginTop: 2 },
  autosendBanner: { backgroundColor: Colors.sosBackground, borderRadius: 12, padding: 14, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: Colors.sos },
  autosendText: { fontSize: 14, color: Colors.sos, fontWeight: '600', flex: 1 },
  autosendArrow: { fontSize: 18, color: Colors.sos, fontWeight: '600' },
  sendCard: { backgroundColor: Colors.primary, borderRadius: 20, padding: 28, marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  sendTitle: { fontSize: 22, fontWeight: '800', color: Colors.textOnPrimary },
  sendArrow: { fontSize: 28, color: Colors.textOnPrimary, fontWeight: '300' },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  viewAll: { fontSize: 14, color: Colors.primary, fontWeight: '600', marginBottom: 12 },
  quickScroll: { marginBottom: 4 },
  quickItem: { alignItems: 'center', marginRight: 20 },
  quickName: { fontSize: 12, color: Colors.textSecondary, marginTop: 6 },
  emptyCard: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textLight },
  txCard: { marginBottom: 8 },
  txRow: { flexDirection: 'row', alignItems: 'center' },
  txInfo: { flex: 1, marginLeft: 12 },
  txName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  txStatus: { fontSize: 12, color: Colors.textLight, marginTop: 2, textTransform: 'capitalize' },
  txAmount: { alignItems: 'flex-end' },
  txAmountText: { fontSize: 15, fontWeight: '700', color: Colors.text },
  txAmountLak: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
