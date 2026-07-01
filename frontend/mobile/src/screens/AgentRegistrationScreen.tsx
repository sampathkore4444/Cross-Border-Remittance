import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Header } from '@components/Header';
import { api } from '@services/api';

export default function AgentRegistrationScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    shop_name: '',
    shop_address: '',
    shop_province: '',
    country: 'LA',
    agent_type: 'cash_out_agent',
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (field: string) => (val: string) => setForm((f) => ({ ...f, [field]: val }));

  const handleRegister = async () => {
    if (!form.shop_name.trim() || !form.shop_province.trim()) {
      Alert.alert('Validation', 'Shop name and province are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.registerAgent(form);
      Alert.alert('Success', 'Agent registration submitted', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Register as Agent" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Agent Details</Text>

          <Text style={styles.label}>Shop Name *</Text>
          <TextInput style={styles.input} value={form.shop_name} onChangeText={set('shop_name')} placeholder="e.g. Bounmy Shop" placeholderTextColor={Colors.textLight} />

          <Text style={styles.label}>Shop Address</Text>
          <TextInput style={styles.input} value={form.shop_address} onChangeText={set('shop_address')} placeholder="Street, village, etc." placeholderTextColor={Colors.textLight} />

          <Text style={styles.label}>Province *</Text>
          <TextInput style={styles.input} value={form.shop_province} onChangeText={set('shop_province')} placeholder="e.g. Vientiane" placeholderTextColor={Colors.textLight} />

          <Text style={styles.label}>Country</Text>
          <View style={styles.segmentRow}>
            {['LA', 'TH'].map((c) => (
              <TouchableSegment key={c} label={c === 'LA' ? 'Laos' : 'Thailand'} selected={form.country === c} onPress={() => set('country')(c)} />
            ))}
          </View>

          <Text style={styles.label}>Agent Type</Text>
          <View style={styles.segmentRow}>
            {['cash_out_agent', 'cash_in_agent'].map((t) => (
              <TouchableSegment key={t} label={t === 'cash_out_agent' ? 'Cash-Out' : 'Cash-In'} selected={form.agent_type === t} onPress={() => set('agent_type')(t)} />
            ))}
          </View>
        </Card>

        <Text style={styles.disclaimer}>
          By registering, you agree to the NgoenSai Agent Terms & Conditions. Your identity will be verified before activation.
        </Text>

        <Button title="Submit Registration" onPress={handleRegister} loading={submitting} disabled={submitting} fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}

function TouchableSegment({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <View style={[styles.segment, selected && styles.segmentSelected]}>
      <Button title={label} variant={selected ? 'primary' : 'outline'} size="sm" onPress={onPress} style={styles.segmentBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  card: { marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 16, color: Colors.text, marginBottom: 4 },
  segmentRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  segment: { flex: 1 },
  segmentSelected: {},
  segmentBtn: { width: '100%' },
  disclaimer: { fontSize: 12, color: Colors.textLight, textAlign: 'center', marginBottom: 24, lineHeight: 18 },
});
