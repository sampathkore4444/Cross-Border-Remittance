import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, TextInput, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Header } from '@components/Header';

const FREQUENCIES = [
  { key: 'weekly', label: 'Every Week' },
  { key: 'biweekly', label: 'Every 2 Weeks' },
  { key: 'monthly', label: 'Every Month' },
];

export default function AutosendSettingsScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [amount, setAmount] = useState('2000');
  const [frequency, setFrequency] = useState('monthly');
  const [recipientName, setRecipientName] = useState('');

  const handleSave = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={t('profile.autosend')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Enable Auto-Send</Text>
              <Text style={styles.desc}>Automatically send money on a schedule</Text>
            </View>
            <Switch value={enabled} onValueChange={setEnabled} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor={enabled ? Colors.primaryDark : Colors.textLight} />
          </View>
        </Card>
        {enabled && (
          <>
            <Card style={styles.card}>
              <Text style={styles.label}>Recipient Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Mae"
                value={recipientName}
                onChangeText={setRecipientName}
                placeholderTextColor={Colors.textLight}
              />
            </Card>
            <Card style={styles.card}>
              <Text style={styles.label}>Amount (THB)</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor={Colors.textLight}
              />
            </Card>
            <Card style={styles.card}>
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.freqRow}>
                {FREQUENCIES.map(f => (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.freqBtn, frequency === f.key && styles.freqBtnActive]}
                    onPress={() => setFrequency(f.key)}
                  >
                    <Text style={[styles.freqText, frequency === f.key && styles.freqTextActive]}>{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryText}>
                Next send: {frequency === 'weekly' ? '7 days' : frequency === 'biweekly' ? '14 days' : '30 days'} from now
              </Text>
              <Text style={styles.summaryAmount}>{parseInt(amount, 10).toLocaleString()} THB → ~{(parseInt(amount, 10) * 575).toLocaleString()} LAK</Text>
            </Card>
          </>
        )}
        <Button title={t('common.save')} onPress={handleSave} fullWidth size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  card: { padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  desc: { fontSize: 13, color: Colors.textSecondary },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 16, color: Colors.text, marginTop: 8 },
  freqRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  freqBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  freqBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  freqText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  freqTextActive: { color: Colors.primary },
  summaryCard: { padding: 16, alignItems: 'center', marginBottom: 12 },
  summaryText: { fontSize: 14, color: Colors.textSecondary },
  summaryAmount: { fontSize: 20, fontWeight: '800', color: Colors.primary, marginTop: 8 },
});
