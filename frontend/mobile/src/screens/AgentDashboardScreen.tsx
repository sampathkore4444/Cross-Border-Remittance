import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Header } from '@components/Header';
import { Loading } from '@components/Loading';
import { useToast } from '@components/Toast';
import { useBiometric } from '@hooks/useBiometric';
import { useFloatAlert } from '@hooks/useFloatAlert';
import { api } from '@services/api';
import QRScannerScreen from './QRScannerScreen';
import RecipientPhotoCapture from './RecipientPhotoCapture';

type OpType = 'cash_in' | 'cash_out' | 'float_deposit' | null;

export default function AgentDashboardScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { isAvailable, authenticate } = useBiometric();

  const [agent, setAgent] = useState<any>(null);
  const [recentTxns, setRecentTxns] = useState<any[]>([]);
  const [commission, setCommission] = useState<{ commission_rate: number; commission_total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notRegistered, setNotRegistered] = useState(false);

  const [showScanner, setShowScanner] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [recipientPhoto, setRecipientPhoto] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [amount, setAmount] = useState('');
  const [senderPhone, setSenderPhone] = useState('');

  // Confirmation modal state
  const [confirmOp, setConfirmOp] = useState<OpType>(null);
  const [confirmData, setConfirmData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [txSearch, setTxSearch] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  useFloatAlert(agent?.float_balance_lak || 0, agent?.float_minimum || 1000000);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadAgent(), loadRecentTxns(), loadCommission()]);
    setLoading(false);
  };

  const loadAgent = async () => {
    try {
      const res = await api.client.get('/agents/me');
      setAgent(res.data);
      setNotRegistered(false);
    } catch (e: any) {
      if (e.response?.status === 404) {
        setNotRegistered(true);
      }
    }
  };

  const loadRecentTxns = async () => {
    try {
      const res = await api.client.get('/agents/transactions', { params: { limit: 50 } });
      setRecentTxns(res.data?.transactions || []);
    } catch {}
  };

  const loadCommission = async () => {
    try {
      const res = await api.client.get('/agents/commission');
      setCommission(res.data);
    } catch {}
  };

  const requireAuth = async (): Promise<boolean> => {
    if (isAvailable) {
      return await authenticate();
    }
    return true;
  };

  const handleScan = (data: string) => {
    setShowScanner(false);
    try {
      const parsed = JSON.parse(data);
      if (parsed.recipient_phone) {
        setSenderPhone(parsed.recipient_phone);
        initiateOp('cash_out');
      }
    } catch {
      Alert.alert('Invalid QR', 'Could not parse the QR code data.');
    }
  };

  const handlePhotoCapture = (photoUri: string) => {
    setRecipientPhoto(photoUri);
    setShowCamera(false);
  };

  const initiateOp = (op: OpType) => {
    if (op === 'cash_out' && !senderPhone) {
      Alert.alert('Recipient Required', 'Enter recipient phone or scan QR code first.');
      return;
    }
    setConfirmOp(op);
    setConfirmData(null);
    setAmount('');
    if (op !== 'cash_out') setSenderPhone('');
  };

  const buildConfirmData = () => {
    const amt = confirmOp === 'cash_in' ? parseFloat(amount) : parseInt(amount, 10);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return null;
    }
    const rate = agent?.exchange_rate || 575;
    const fee = Math.round(amt * 0.005);
    const total = confirmOp === 'cash_in' ? amt - fee : amt + fee;
    return { amt, rate, fee, total };
  };

  const handleConfirm = async () => {
    const data = buildConfirmData();
    if (!data) return;

    const authed = await requireAuth();
    if (!authed) {
      Alert.alert('Authentication Failed', 'Biometric verification required');
      return;
    }

    setSubmitting(true);
    try {
      if (confirmOp === 'cash_in') {
        const res = await api.client.post('/agents/cash-in', {
          agent_id: agent?.id,
          amount_thb: data.amt,
          sender_phone: senderPhone,
          recipient_phone: agent?.user_id,
        });
        showToast(`Cash-in completed. Ref: ${res.data.reference}`, 'success');
      } else if (confirmOp === 'cash_out') {
        const res = await api.client.post('/agents/cash-out', {
          agent_id: agent?.id,
          amount_lak: data.amt,
          recipient_phone: senderPhone,
          recipient_photo: recipientPhoto,
        });
        showToast(`Cash-out completed. Ref: ${res.data.reference}`, 'success');
      } else if (confirmOp === 'float_deposit') {
        await api.depositFloat(agent?.id, data.amt, 'bank_transfer');
        showToast(`Float deposit of ${data.amt.toLocaleString()} LAK submitted`, 'success');
      }
      setConfirmOp(null);
      setAmount('');
      setSenderPhone('');
      setRecipientPhoto(null);
      loadAll();
    } catch (e: any) {
      showToast(e.response?.data?.error || 'Transaction failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTxns = recentTxns.filter((tx: any) => {
    if (!txSearch) return true;
    const q = txSearch.toLowerCase();
    return (tx.recipient_phone || '').toLowerCase().includes(q)
      || (tx.sender_phone || '').toLowerCase().includes(q)
      || (tx.reference || '').toLowerCase().includes(q)
      || (tx.type || '').toLowerCase().includes(q);
  });

  if (loading) return <Loading fullScreen message="Loading dashboard..." />;

  if (notRegistered) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Agent Dashboard" onBack={() => navigation.goBack()} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏪</Text>
          <Text style={styles.emptyTitle}>Not an Agent Yet</Text>
          <Text style={styles.emptyText}>Register as a NgoenSai agent to start serving customers.</Text>
          <Button title="Register Now" onPress={() => navigation.navigate('AgentRegistration')} fullWidth />
          <Button title="Go Back" variant="outline" onPress={() => navigation.goBack()} fullWidth style={{ marginTop: 12 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Agent Dashboard" onBack={() => navigation.goBack()} rightAction={
        <TouchableOpacity onPress={loadAll} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      } />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Float Balance + KYC/Status */}
        <Card style={styles.floatCard}>
          <View style={styles.floatHeader}>
            <Text style={styles.floatLabel}>Float Balance</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: agent?.is_active ? Colors.success : Colors.error }]} />
              <Text style={styles.statusLabel}>{agent?.is_active ? 'Active' : 'Suspended'}</Text>
              <View style={[styles.kycBadge, { backgroundColor: agent?.kyc_status === 'verified' ? '#E8F5E9' : '#FFF3E0' }]}>
                <Text style={[styles.kycText, { color: agent?.kyc_status === 'verified' ? '#2E7D32' : '#E65100' }]}>
                  KYC: {agent?.kyc_status || 'pending'}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.floatValue}>{agent?.float_balance_lak?.toLocaleString() || 0} LAK</Text>
          <Text style={styles.floatSub}>{agent?.float_balance_thb?.toLocaleString() || 0} THB</Text>
          <View style={styles.floatActions}>
            <TouchableOpacity style={styles.floatActionBtn} onPress={() => initiateOp('float_deposit')}>
              <Text style={styles.floatActionText}>Deposit Float</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Commission */}
        {commission && (
          <Card style={styles.commissionCard}>
            <Text style={styles.commissionTitle}>Commission</Text>
            <View style={styles.commissionRow}>
              <Text style={styles.commissionLabel}>Rate</Text>
              <Text style={styles.commissionValue}>{commission.commission_rate}%</Text>
            </View>
            <View style={styles.commissionRow}>
              <Text style={styles.commissionLabel}>Total Earned</Text>
              <Text style={[styles.commissionValue, { color: Colors.success }]}>
                {commission.commission_total?.toLocaleString() || 0} LAK
              </Text>
            </View>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.secondary }]} onPress={() => { setSenderPhone(''); setAmount(''); setConfirmOp('cash_in'); }}>
            <Text style={styles.actionIcon}>+</Text>
            <Text style={styles.actionText}>Cash In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.accent }]} onPress={() => { setAmount(''); initiateOp('cash_out'); }}>
            <Text style={styles.actionIcon}>-</Text>
            <Text style={styles.actionText}>Cash Out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary }]} onPress={() => setShowScanner(true)}>
            <Text style={styles.actionIcon}>◻</Text>
            <Text style={styles.actionText}>Scan QR</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions with Search */}
        <Card style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Transactions</Text>
            <Text style={styles.historyCount}>{recentTxns.length}</Text>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by phone, ref, type..."
            placeholderTextColor={Colors.textLight}
            value={txSearch}
            onChangeText={setTxSearch}
          />
          {filteredTxns.length === 0 ? (
            <Text style={styles.emptyList}>No transactions found</Text>
          ) : (
            filteredTxns.map((txn: any, i: number) => (
              <TouchableOpacity
                key={txn.id || i}
                style={styles.historyRow}
                onPress={() => navigation.navigate('TransactionDetail', { ref: txn.reference || txn.id })}
              >
                <View style={styles.historyInfo}>
                  <Text style={styles.historyPhone}>
                    {txn.type === 'cash_in' ? txn.sender_phone || 'Cash-in' : txn.recipient_phone || 'Cash-out'}
                  </Text>
                  <Text style={styles.historyDate}>
                    {txn.reference ? `${txn.reference.slice(0, 12)} · ` : ''}
                    {txn.created_at ? new Date(txn.created_at).toLocaleDateString() : ''}
                  </Text>
                </View>
                <Text style={[styles.historyAmount, txn.type === 'cash_in' ? styles.amountIn : txn.type === 'deposit' ? styles.amountIn : styles.amountOut]}>
                  {txn.type === 'cash_in' ? '+' : txn.type === 'deposit' ? '+' : '-'}
                  {txn.amount?.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </Card>
      </ScrollView>

      {/* QR Scanner */}
      <Modal visible={showScanner} animationType="slide">
        <QRScannerScreen onScan={handleScan} onClose={() => setShowScanner(false)} />
      </Modal>

      {/* Camera */}
      <Modal visible={showCamera} animationType="slide">
        <RecipientPhotoCapture onCapture={handlePhotoCapture} onClose={() => setShowCamera(false)} />
      </Modal>

      {/* Confirmation Modal */}
      <Modal visible={!!confirmOp} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {confirmOp === 'cash_in' && (
              <>
                <Text style={styles.modalTitle}>Cash In</Text>
                <TextInput style={styles.input} placeholder="Amount (THB)" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholderTextColor={Colors.textLight} />
                <TextInput style={styles.input} placeholder="Sender Phone" keyboardType="phone-pad" value={senderPhone} onChangeText={setSenderPhone} placeholderTextColor={Colors.textLight} />
              </>
            )}
            {confirmOp === 'cash_out' && (
              <>
                <Text style={styles.modalTitle}>Cash Out</Text>
                <TextInput style={styles.input} placeholder="Amount (LAK)" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholderTextColor={Colors.textLight} />
                <TextInput style={styles.input} placeholder="Recipient Phone" keyboardType="phone-pad" value={senderPhone} onChangeText={setSenderPhone} placeholderTextColor={Colors.textLight} />
                <TouchableOpacity style={styles.photoBtn} onPress={() => setShowCamera(true)}>
                  <Text style={styles.photoBtnText}>{recipientPhoto ? 'Photo captured' : 'Take recipient photo (audit)'}</Text>
                </TouchableOpacity>
              </>
            )}
            {confirmOp === 'float_deposit' && (
              <>
                <Text style={styles.modalTitle}>Deposit Float</Text>
                <Text style={styles.floatHint}>Enter the amount to add to your float balance</Text>
                <TextInput style={styles.input} placeholder="Amount (LAK)" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholderTextColor={Colors.textLight} />
              </>
            )}

            {amount && parseFloat(amount) > 0 && (
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Summary</Text>
                <SummaryRow label="Amount" value={`${parseFloat(amount).toLocaleString()} ${confirmOp === 'cash_in' ? 'THB' : 'LAK'}`} />
                <SummaryRow label="Rate" value={`1 THB = ${agent?.exchange_rate || 575} LAK`} />
                <SummaryRow label="Fee (0.5%)" value={Math.round(parseFloat(amount) * 0.005).toLocaleString()} />
                <SummaryRow label={confirmOp === 'cash_in' ? 'You Receive (LAK)' : 'Total Debit'} value={`${(confirmOp === 'cash_in' ? Math.round(parseFloat(amount) * 575 - parseFloat(amount) * 0.005) : parseInt(amount, 10) + Math.round(parseFloat(amount) * 0.005)).toLocaleString()} ${confirmOp === 'cash_in' ? 'LAK' : 'LAK'}`} bold />
              </Card>
            )}

            {isAvailable && (
              <Text style={styles.authHint}>Biometric verification required to confirm</Text>
            )}

            <View style={styles.modalButtons}>
              <Button title="Cancel" variant="ghost" onPress={() => { setConfirmOp(null); setAmount(''); setSenderPhone(''); setRecipientPhoto(null); }} />
              <Button title="Confirm" onPress={handleConfirm} loading={submitting} disabled={submitting || !amount || parseFloat(amount) <= 0} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={summaryStyles.row}>
      <Text style={summaryStyles.label}>{label}</Text>
      <Text style={[summaryStyles.value, bold && summaryStyles.bold]}>{value}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { fontSize: 14, color: Colors.textSecondary },
  value: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  bold: { fontWeight: '800', color: Colors.primary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  refreshBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  refreshText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 22 },

  // Float Card
  floatCard: { alignItems: 'center', padding: 24, marginBottom: 16 },
  floatHeader: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  floatLabel: { fontSize: 14, color: Colors.textSecondary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  kycBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  kycText: { fontSize: 10, fontWeight: '700' },
  floatValue: { fontSize: 32, fontWeight: '800', color: Colors.text, marginTop: 4 },
  floatSub: { fontSize: 16, color: Colors.textLight, marginTop: 4 },
  floatActions: { marginTop: 16, width: '100%' },
  floatActionBtn: { backgroundColor: Colors.primary, borderRadius: 10, padding: 12, alignItems: 'center' },
  floatActionText: { color: Colors.textOnPrimary, fontWeight: '700', fontSize: 14 },

  // Commission
  commissionCard: { marginBottom: 16 },
  commissionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  commissionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  commissionLabel: { fontSize: 14, color: Colors.textSecondary },
  commissionValue: { fontSize: 14, fontWeight: '700', color: Colors.text },

  // Actions
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtn: { flex: 1, padding: 20, borderRadius: 16, alignItems: 'center' },
  actionIcon: { fontSize: 28, fontWeight: '800', color: Colors.textOnPrimary },
  actionText: { fontSize: 13, fontWeight: '600', color: Colors.textOnPrimary, marginTop: 4 },

  // History
  historyCard: { marginBottom: 16 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  historyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  historyCount: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  searchInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, fontSize: 14, color: Colors.text, marginBottom: 12 },
  emptyList: { fontSize: 14, color: Colors.textLight, textAlign: 'center', paddingVertical: 24 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  historyInfo: { flex: 1 },
  historyPhone: { fontSize: 14, fontWeight: '600', color: Colors.text },
  historyDate: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  historyAmount: { fontSize: 16, fontWeight: '700' },
  amountIn: { color: Colors.success },
  amountOut: { color: Colors.error },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 16, color: Colors.text, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  photoBtn: { backgroundColor: Colors.rateBadge, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 12 },
  photoBtnText: { fontSize: 14, color: Colors.rateText, fontWeight: '600' },
  recipientLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: 12 },
  floatHint: { fontSize: 14, color: Colors.textLight, marginBottom: 16 },
  summaryCard: { marginBottom: 12 },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  authHint: { fontSize: 12, color: Colors.textLight, fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
});
