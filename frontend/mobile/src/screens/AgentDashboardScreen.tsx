import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Header } from '@components/Header';
import { Loading } from '@components/Loading';
import { api } from '@services/api';
import QRScannerScreen from './QRScannerScreen';

export default function AgentDashboardScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [showCashIn, setShowCashIn] = useState(false);
  const [showCashOut, setShowCashOut] = useState(false);
  const [amount, setAmount] = useState('');
  const [senderPhone, setSenderPhone] = useState('');

  useEffect(() => {
    loadAgent();
  }, []);

  const loadAgent = async () => {
    try {
      const res = await api.client.get('/agents/me');
      setAgent(res.data);
    } catch { }
    setLoading(false);
  };

  const handleScan = (data: string) => {
    setShowScanner(false);
    try {
      const parsed = JSON.parse(data);
      if (parsed.recipient_phone) {
        setSenderPhone(parsed.recipient_phone);
        setShowCashOut(true);
      }
    } catch {
      Alert.alert('Invalid QR', 'Could not parse the QR code data.');
    }
  };

  const handleCashIn = async () => {
    if (!amount || !senderPhone) return;
    try {
      await api.client.post('/agents/cash-in', {
        agent_id: agent?.id,
        amount_thb: parseFloat(amount),
        sender_phone: senderPhone,
        recipient_phone: agent?.user_id,
      });
      Alert.alert('Success', 'Cash-in completed');
      setShowCashIn(false);
      setAmount('');
      setSenderPhone('');
      loadAgent();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Cash-in failed');
    }
  };

  const handleCashOut = async () => {
    if (!amount) return;
    try {
      await api.client.post('/agents/cash-out', {
        agent_id: agent?.id,
        amount_lak: parseInt(amount, 10),
        recipient_phone: senderPhone,
      });
      Alert.alert('Success', 'Cash-out completed');
      setShowCashOut(false);
      setAmount('');
      setSenderPhone('');
      loadAgent();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Cash-out failed');
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Agent Dashboard" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.floatCard}>
          <Text style={styles.floatLabel}>Float Balance</Text>
          <Text style={styles.floatValue}>{agent?.float_balance_lak?.toLocaleString() || 0} LAK</Text>
          <Text style={styles.floatSub}>{agent?.float_balance_thb?.toLocaleString() || 0} THB</Text>
        </Card>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.secondary }]} onPress={() => setShowCashIn(true)}>
            <Text style={styles.actionIcon}>+</Text>
            <Text style={styles.actionText}>Cash In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.accent }]} onPress={() => setShowCashOut(true)}>
            <Text style={styles.actionIcon}>-</Text>
            <Text style={styles.actionText}>Cash Out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary }]} onPress={() => setShowScanner(true)}>
            <Text style={styles.actionIcon}>◻</Text>
            <Text style={styles.actionText}>Scan QR</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showScanner} animationType="slide">
        <QRScannerScreen
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      </Modal>

      <Modal visible={showCashIn} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Cash In</Text>
            <TextInput
              style={styles.input}
              placeholder="Amount (THB)"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor={Colors.textLight}
            />
            <TextInput
              style={styles.input}
              placeholder="Sender Phone"
              keyboardType="phone-pad"
              value={senderPhone}
              onChangeText={setSenderPhone}
              placeholderTextColor={Colors.textLight}
            />
            <View style={styles.modalButtons}>
              <Button title={t('common.cancel')} variant="ghost" onPress={() => setShowCashIn(false)} />
              <Button title={t('common.confirm')} onPress={handleCashIn} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showCashOut} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Cash Out</Text>
            <TextInput
              style={styles.input}
              placeholder="Amount (LAK)"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor={Colors.textLight}
            />
            <Text style={styles.recipientLabel}>Recipient: {senderPhone || 'N/A'}</Text>
            <View style={styles.modalButtons}>
              <Button title={t('common.cancel')} variant="ghost" onPress={() => setShowCashOut(false)} />
              <Button title={t('common.confirm')} onPress={handleCashOut} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  floatCard: { alignItems: 'center', padding: 24, marginBottom: 16 },
  floatLabel: { fontSize: 14, color: Colors.textSecondary },
  floatValue: { fontSize: 32, fontWeight: '800', color: Colors.text, marginTop: 4 },
  floatSub: { fontSize: 16, color: Colors.textLight, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtn: { flex: 1, padding: 20, borderRadius: 16, alignItems: 'center' },
  actionIcon: { fontSize: 28, fontWeight: '800', color: Colors.textOnPrimary },
  actionText: { fontSize: 13, fontWeight: '600', color: Colors.textOnPrimary, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 16, color: Colors.text, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  recipientLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: 12 },
});
