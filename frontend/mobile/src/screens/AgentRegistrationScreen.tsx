import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Header } from '@components/Header';
import ErrorBoundary from '@components/ErrorBoundary';
import { api } from '@services/api';

function AgentRegistrationForm({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    shop_name: '',
    shop_address: '',
    shop_province: '',
    country: 'LA',
    agent_type: 'cash_out_agent',
  });
  const [submitting, setSubmitting] = useState(false);
  const [networkError, setNetworkError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (field: string) => (val: string) => {
    setForm((f) => ({ ...f, [field]: val }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.shop_name.trim()) errors.shop_name = 'Shop name is required';
    if (!form.shop_province.trim()) errors.shop_province = 'Province is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    setNetworkError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.registerAgent(form);
      Alert.alert('Success', 'Agent registration submitted. You will be notified once verified.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      if (e.response) {
        setNetworkError(e.response?.data?.error || 'Registration failed');
      } else if (e.request) {
        setNetworkError('Network error. Please check your connection and try again.');
      } else {
        setNetworkError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Register as Agent" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {networkError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{networkError}</Text>
          </View>
        ) : null}

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Agent Details</Text>

          <Text style={styles.label}>Shop Name *</Text>
          <TextInput
            style={[styles.input, fieldErrors.shop_name ? styles.inputError : null]}
            value={form.shop_name}
            onChangeText={set('shop_name')}
            placeholder="e.g. Bounmy Shop"
            placeholderTextColor={Colors.textLight}
            editable={!submitting}
          />
          {fieldErrors.shop_name ? <Text style={styles.fieldError}>{fieldErrors.shop_name}</Text> : null}

          <Text style={styles.label}>Shop Address</Text>
          <TextInput
            style={styles.input}
            value={form.shop_address}
            onChangeText={set('shop_address')}
            placeholder="Street, village, etc."
            placeholderTextColor={Colors.textLight}
            editable={!submitting}
          />

          <Text style={styles.label}>Province *</Text>
          <TextInput
            style={[styles.input, fieldErrors.shop_province ? styles.inputError : null]}
            value={form.shop_province}
            onChangeText={set('shop_province')}
            placeholder="e.g. Vientiane"
            placeholderTextColor={Colors.textLight}
            editable={!submitting}
          />
          {fieldErrors.shop_province ? <Text style={styles.fieldError}>{fieldErrors.shop_province}</Text> : null}

          <Text style={styles.label}>Country</Text>
          <View style={styles.segmentRow}>
            {['LA', 'TH'].map((c) => (
              <TouchableSegment key={c} label={c === 'LA' ? 'Laos' : 'Thailand'} selected={form.country === c} onPress={() => set('country')(c)} disabled={submitting} />
            ))}
          </View>

          <Text style={styles.label}>Agent Type</Text>
          <View style={styles.segmentRow}>
            {['cash_out_agent', 'cash_in_agent'].map((t) => (
              <TouchableSegment key={t} label={t === 'cash_out_agent' ? 'Cash-Out' : 'Cash-In'} selected={form.agent_type === t} onPress={() => set('agent_type')(t)} disabled={submitting} />
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

export default function AgentRegistrationScreen({ navigation }: any) {
  return (
    <ErrorBoundary>
      <AgentRegistrationForm navigation={navigation} />
    </ErrorBoundary>
  );
}

function TouchableSegment({ label, selected, onPress, disabled }: { label: string; selected: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <View style={[styles.segment, selected && styles.segmentSelected]}>
      <Button title={label} variant={selected ? 'primary' : 'outline'} size="sm" onPress={onPress} disabled={disabled} style={styles.segmentBtn} />
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
  inputError: { borderColor: '#FF3D00' },
  fieldError: { fontSize: 12, color: '#FF3D00', marginBottom: 4, marginTop: 2 },
  segmentRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  segment: { flex: 1 },
  segmentSelected: {},
  segmentBtn: { width: '100%' },
  disclaimer: { fontSize: 12, color: Colors.textLight, textAlign: 'center', marginBottom: 24, lineHeight: 18 },
  errorBanner: { backgroundColor: '#FFF0F0', padding: 12, borderRadius: 8, marginBottom: 12 },
  errorText: { color: '#FF3D00', fontSize: 13, textAlign: 'center' },
});
