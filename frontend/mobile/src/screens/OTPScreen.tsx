import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Button } from '@components/Button';
import { useAuth } from '@hooks/useAuth';
import { Config } from '@constants/config';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'OTP'>;

export default function OTPScreen({ route, navigation }: Props) {
  const { phone, countryCode } = route.params;
  const { t } = useTranslation();
  const { login } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(Config.OTP_RESEND_INTERVAL);
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (countdown > 0) { const id = setInterval(() => setCountdown(c => c - 1), 1000); return () => clearInterval(id); }
  }, [countdown]);

  const handleChange = (val: string, idx: number) => {
    if (val.length > 1) return;
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (idx === 5 && val) handleVerify(newOtp.join(''));
  };

  const handleVerify = async (code?: string) => {
    const fullOtp = code || otp.join('');
    if (fullOtp.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      await login(`${countryCode}${phone.replace(/^0/, '')}`, fullOtp);
    } catch (e: any) {
      setError(e?.response?.data?.message || t('common.error'));
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <Text style={styles.title}>{t('otp.title')}</Text>
        <Text style={styles.subtitle}>{t('otp.subtitle', { phone: `${countryCode} ${phone}` })}</Text>
        <View style={styles.otpContainer}>
          {otp.map((digit, idx) => (
            <TextInput key={idx} ref={ref => { inputRefs.current[idx] = ref!; }} style={styles.otpInput} keyboardType="number-pad" maxLength={1} value={digit} onChangeText={v => handleChange(v, idx)} onKeyPress={({ nativeEvent }) => { if (nativeEvent.key === 'Backspace' && !digit && idx > 0) inputRefs.current[idx - 1]?.focus(); }} />
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title={t('otp.verify')} onPress={() => handleVerify()} loading={loading} fullWidth size="lg" style={styles.verifyBtn} />
        <Button title={countdown > 0 ? t('otp.resend', { seconds: countdown }) : t('otp.resendNow')} onPress={() => { setCountdown(Config.OTP_RESEND_INTERVAL); }} variant="ghost" disabled={countdown > 0} fullWidth />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', padding: 24, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  otpContainer: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  otpInput: { width: 48, height: 56, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, textAlign: 'center', fontSize: 24, fontWeight: '700', color: Colors.text, backgroundColor: Colors.surface },
  error: { color: Colors.error, fontSize: 14, marginBottom: 12, textAlign: 'center' },
  verifyBtn: { marginBottom: 12 },
});
