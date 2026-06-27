import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Share, AppState } from 'react-native';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '@constants/colors';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<SendStackParamList, 'QR'>;

export default function QRScreen({ route, navigation }: Props) {
  const { sendResponse } = route.params;
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(900);
  const [paid, setPaid] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => { appState.current = next; });
    return () => sub.remove();
  }, []);

  const qrValue = sendResponse.payment.qr_code
    ? sendResponse.payment.qr_code
    : `promptpay://${sendResponse.transaction_ref}?amount=${sendResponse.payment.amount}`;

  const shareCode = async () => {
    await Share.share({ message: `NgoenSai Transfer\nRef: ${sendResponse.transaction_ref}\nAmount: ${sendResponse.payment.amount} THB\nQR: ${qrValue}` });
  };

  const handlePaid = () => {
    setPaid(true);
    navigation.replace('Success', {
      transactionRef: sendResponse.transaction_ref,
      targetAmount: sendResponse.payment.amount,
      pickupCode: undefined,
      recipientName: '',
    });
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('qr.title')}</Text>
        {!paid && <View style={styles.timer}><Text style={styles.timerText}>{t('qr.expiresIn', { time: `${minutes}:${seconds.toString().padStart(2, '0')}` })}</Text></View>}
        <Card style={styles.qrCard}>
          <QRCode
            value={qrValue}
            size={200}
            backgroundColor="#FFFFFF"
            color={Colors.text}
          />
          <Text style={styles.qrSubtext}>PromptPay</Text>
        </Card>
        <Card style={styles.amountCard}>
          <Text style={styles.amountLabel}>{t('qr.amount')}</Text>
          <Text style={styles.amountValue}>{sendResponse.payment.amount.toLocaleString()} THB</Text>
        </Card>
        <Text style={styles.instructions}>{t('qr.instructions')}</Text>
        <View style={styles.buttons}>
          <Button title={t('qr.paid')} onPress={handlePaid} variant="primary" fullWidth size="lg" />
          <Button title={t('transaction.shareReceipt')} onPress={shareCode} variant="outline" fullWidth />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  timer: { marginBottom: 16 },
  timerText: { fontSize: 14, color: Colors.accent, fontWeight: '600' },
  qrCard: { padding: 24, marginBottom: 16, alignItems: 'center', width: '100%' },
  qrSubtext: { fontSize: 14, color: Colors.textLight, marginTop: 8 },
  amountCard: { padding: 16, alignItems: 'center', width: '100%', marginBottom: 16 },
  amountLabel: { fontSize: 14, color: Colors.textSecondary },
  amountValue: { fontSize: 28, fontWeight: '800', color: Colors.text, marginTop: 4 },
  instructions: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  buttons: { width: '100%', gap: 12 },
});
