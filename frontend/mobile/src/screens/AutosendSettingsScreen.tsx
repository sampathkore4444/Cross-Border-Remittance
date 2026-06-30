import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, TextInput, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Header } from '@components/Header';
import { Loading } from '@components/Loading';
import { api } from '@services/api';
import { useToast } from '@components/Toast';
import type { AutosendConfig, Recipient } from '@types/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AutosendSettings'>;

const FREQUENCIES = [
  { key: 'weekly', labelKey: 'autosend.weekly' },
  { key: 'biweekly', labelKey: 'autosend.biweekly' },
  { key: 'monthly', labelKey: 'autosend.monthly' },
];

function formatNextSend(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AutosendSettingsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');
  const [recipientId, setRecipientId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [nextSendAt, setNextSendAt] = useState('');
  const [showRecipientPicker, setShowRecipientPicker] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getAutosendConfig().catch(() => null),
      api.getRecipients().catch(() => []),
    ]).then(([cfg, recips]) => {
      if (cfg) {
        setEnabled(cfg.enabled);
        setAmount(cfg.amount.toString());
        setFrequency(cfg.frequency);
        setRecipientId(cfg.recipient_id);
        setRecipientName(cfg.recipient_name);
        setNextSendAt(cfg.next_send_at);
      }
      setRecipients(recips);
    }).catch(() => {
      showToast(t('autosend.loadError'), 'error');
    }).finally(() => setLoading(false));
  }, [showToast, t]);

  const handleSave = async () => {
    const amt = parseInt(amount, 10);
    if (!amount || isNaN(amt) || amt < 100 || amt > 50000) {
      showToast(t('autosend.amountInvalid'), 'error');
      return;
    }
    if (enabled && !recipientId) {
      showToast(t('autosend.selectRecipient'), 'error');
      return;
    }
    setSaving(true);
    try {
      const result = await api.saveAutosendConfig({
        enabled,
        amount: amt,
        frequency,
        recipient_id: recipientId,
        recipient_name: recipientName,
      });
      setNextSendAt(result.next_send_at);
      showToast(t('autosend.saved'), 'success');
      navigation.goBack();
    } catch {
      showToast(t('common.networkError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const estimatedLAK = amount ? (parseInt(amount, 10) || 0) * 575 : 0;

  if (loading) return <Loading fullScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <Header title={t('autosend.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>{t('autosend.enable')}</Text>
              <Text style={styles.desc}>{t('autosend.enableDesc')}</Text>
            </View>
            <Switch value={enabled} onValueChange={setEnabled} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor={enabled ? Colors.primaryDark : Colors.textLight} />
          </View>
        </Card>
        {enabled && (
          <>
            <Card style={styles.card}>
              <Text style={styles.label}>{t('autosend.recipient')}</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setShowRecipientPicker(!showRecipientPicker)}>
                <Text style={recipientName ? styles.pickerText : styles.pickerPlaceholder}>
                  {recipientName || t('autosend.selectRecipient')}
                </Text>
                <Text style={styles.pickerArrow}>{showRecipientPicker ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showRecipientPicker && (
                <View style={styles.pickerList}>
                  {recipients.length === 0 ? (
                    <Text style={styles.emptyText}>{t('autosend.noRecipients')}</Text>
                  ) : recipients.map((r, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.pickerItem, recipientId === r.phone && styles.pickerItemActive]}
                      onPress={() => {
                        setRecipientId(r.phone);
                        setRecipientName(r.name);
                        setShowRecipientPicker(false);
                      }}
                    >
                      <Text style={[styles.pickerItemText, recipientId === r.phone && styles.pickerItemTextActive]}>{r.name}</Text>
                      <Text style={styles.pickerItemSub}>{r.phone}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card>
            <Card style={styles.card}>
              <Text style={styles.label}>{t('autosend.amount')}</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor={Colors.textLight}
                placeholder="1000"
              />
            </Card>
            <Card style={styles.card}>
              <Text style={styles.label}>{t('autosend.frequency')}</Text>
              <View style={styles.freqRow}>
                {FREQUENCIES.map(f => (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.freqBtn, frequency === f.key && styles.freqBtnActive]}
                    onPress={() => setFrequency(f.key as typeof frequency)}
                  >
                    <Text style={[styles.freqText, frequency === f.key && styles.freqTextActive]}>{t(f.labelKey)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
            <Card style={styles.summaryCard}>
              {nextSendAt ? (
                <Text style={styles.summaryText}>{t('autosend.nextSend', { date: formatNextSend(nextSendAt) })}</Text>
              ) : null}
              {amount ? (
                <Text style={styles.summaryAmount}>
                  {estimatedLAK.toLocaleString()} LAK
                </Text>
              ) : null}
              {amount ? (
                <Text style={styles.summarySub}>{t('autosend.estimated')}</Text>
              ) : null}
            </Card>
          </>
        )}
        <Button
          title={saving ? t('autosend.saving') : t('common.save')}
          onPress={handleSave}
          fullWidth
          size="lg"
          disabled={saving}
        />
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
  summarySub: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  pickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, marginTop: 8 },
  pickerText: { fontSize: 16, color: Colors.text },
  pickerPlaceholder: { fontSize: 16, color: Colors.textLight },
  pickerArrow: { fontSize: 12, color: Colors.textSecondary },
  pickerList: { marginTop: 4, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, overflow: 'hidden' },
  pickerItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  pickerItemActive: { backgroundColor: Colors.primary + '10' },
  pickerItemText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  pickerItemTextActive: { color: Colors.primary },
  pickerItemSub: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  emptyText: { fontSize: 14, color: Colors.textLight, padding: 16, textAlign: 'center' },
});
