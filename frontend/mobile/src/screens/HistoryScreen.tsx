import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Card } from '@components/Card';
import { Avatar } from '@components/Avatar';
import { Loading } from '@components/Loading';
import { api } from '@services/api';
import type { Transaction } from '@types/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList } from '@navigation/types';

type Props = NativeStackScreenProps<MainTabParamList, 'History'>;

export default function HistoryScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.getHistory(page, 20);
      setTransactions(res.transactions);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  }, [page]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  if (loading) return <Loading fullScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{t('home.recentTransactions')}</Text>
      <FlatList data={transactions} keyExtractor={(item) => item.transaction_ref} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadHistory(); }} />} renderItem={({ item }) => (
        <TouchableOpacity onPress={() => (navigation as any).navigate('TransactionDetail', { ref: item.transaction_ref })}>
          <Card style={styles.card}>
            <View style={styles.row}>
              <Avatar name={item.recipient_name} size={44} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.recipient_name}</Text>
                <Text style={styles.ref}>{item.transaction_ref}</Text>
                <Text style={styles.status}>{item.status}</Text>
              </View>
              <View style={styles.amount}>
                <Text style={styles.amountText}>{item.source_amount.toLocaleString()} {item.source_currency}</Text>
                <Text style={styles.amountLak}>{item.target_amount.toLocaleString()} {item.target_currency}</Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      )} ListEmptyComponent={
        <Card style={styles.emptyCard}><Text style={styles.emptyText}>{t('home.noTransactions')}</Text></Card>
      } />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { fontSize: 22, fontWeight: '700', color: Colors.text, padding: 16, paddingBottom: 8 },
  list: { padding: 16, paddingTop: 4 },
  card: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '600', color: Colors.text },
  ref: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  status: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  amount: { alignItems: 'flex-end' },
  amountText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  amountLak: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  emptyCard: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textLight },
});
