import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { api } from '@services/api';
import { useAuth } from '@hooks/useAuth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { demoLogin } = useAuth();
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('856');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    if (!phone.trim()) { setError('Please enter a phone number'); return; }
    setLoading(true);
    setError('');
    try {
      await api.register({ phone: `${countryCode}${phone.replace(/^0/, '')}`, country_code: countryCode, language: 'lo' });
      navigation.navigate('OTP', { phone, countryCode });
    } catch (e: any) {
      setError(e?.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('app.name')}</Text>
          <Text style={styles.subtitle}>{t('login.title')}</Text>
        </View>
        <View style={styles.form}>
          <Input label={t('login.countryCode')} value={countryCode} onChangeText={setCountryCode} keyboardType="phone-pad" prefix="+" maxLength={5} />
          <Input label={t('login.phonePlaceholder')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="20 5555 1234" />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title={t('login.sendOTP')} onPress={handleSendOTP} loading={loading} fullWidth size="lg" style={styles.sendBtn} />
          <Button title="Demo Mode (Skip Login)" onPress={demoLogin} variant="ghost" fullWidth size="md" style={styles.demoBtn} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 48 },
  title: { fontSize: 36, fontWeight: '800', color: Colors.primary, marginBottom: 8 },
  subtitle: { fontSize: 18, color: Colors.textSecondary },
  form: { width: '100%' },
  error: { color: Colors.error, fontSize: 14, marginBottom: 12, textAlign: 'center' },
  sendBtn: { marginTop: 8 },
  demoBtn: { marginTop: 16, borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 16 },
});
