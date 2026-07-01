import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { Avatar } from '@components/Avatar';
import { Card } from '@components/Card';
import { Loading } from '@components/Loading';
import { useToast } from '@components/Toast';
import { api } from '@services/api';
import { validateName, validatePhone, normalizePhone } from '@utils/validation';
import type { Recipient } from '@app-types/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<SendStackParamList, 'Recipient'>;

export default function RecipientScreen({ route, navigation }: Props) {
  const quote = route.params?.quote;
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [saved, setSaved] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [relationship, setRelationship] = useState('');

  useEffect(() => {
    api.getRecipients().then(setSaved).catch(() => showToast(t('common.networkError'), 'info'))
      .finally(() => setLoading(false));
  }, [showToast, t]);

  const selectRecipient = (r: Recipient) => {
    navigation.navigate('PayoutMethod', { quote: quote!, recipient: r });
  };

  const handleNew = async () => {
    const nameErr = validateName(name);
    if (nameErr) { showToast(t(nameErr), 'error'); return; }
    const phoneErr = validatePhone(phone, '856');
    if (phoneErr) { showToast(t(phoneErr), 'error'); return; }
    const fullPhone = normalizePhone(phone, '856');
    const newRecipient = { phone: fullPhone, name: name.trim(), province, relationship };
    try {
      await api.saveRecipient(newRecipient);
      setSaved(prev => [...prev, newRecipient]);
      setShowNew(false);
      setName(''); setPhone(''); setProvince(''); setRelationship('');
      showToast(t('common.success'), 'success');
    } catch {
      showToast(t('common.networkError'), 'error');
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('recipient.title')}</Text>
          <Text style={styles.sectionTitle}>{t('recipient.saved')}</Text>
          {saved.length === 0 ? (
            <Card style={styles.emptyCard}><Text style={styles.emptyText}>{t('recipient.savedEmpty')}</Text></Card>
          ) : saved.map((r, i) => (
            <TouchableOpacity key={i} onPress={() => selectRecipient(r)}>
              <Card style={styles.recipientCard}>
                <View style={styles.recipientRow}>
                  <Avatar name={r.name} size={48} />
                  <View style={styles.recipientInfo}>
                    <Text style={styles.recipientName}>{r.name}</Text>
                    <Text style={styles.recipientDetail}>{r.relationship ? `${r.relationship} · ` : ''}{r.province || ''}</Text>
                  </View>
                  <Text style={styles.selectText}>{t('recipient.select')}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.newToggle}>
            <Text style={styles.newToggleText}>{showNew ? '−' : '+'} {t('recipient.newRecipient')}</Text>
          </TouchableOpacity>
          {showNew && (
            <Card style={styles.newForm}>
              <Input label={t('recipient.name')} value={name} onChangeText={setName} placeholder="Mae Khammany" />
              <Input label={t('recipient.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="8562055551234" prefix="+856" />
              <Input label={t('recipient.province')} value={province} onChangeText={setProvince} placeholder="Savannakhet" />
              <Input label={t('recipient.relationship')} value={relationship} onChangeText={setRelationship} placeholder="Mother" />
              <Button title={t('recipient.saveRecipient')} onPress={handleNew} fullWidth />
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary, marginBottom: 12 },
  recipientCard: { marginBottom: 10 },
  recipientRow: { flexDirection: 'row', alignItems: 'center' },
  recipientInfo: { flex: 1, marginLeft: 12 },
  recipientName: { fontSize: 17, fontWeight: '600', color: Colors.text },
  recipientDetail: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  selectText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  emptyCard: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textLight },
  newToggle: { paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.divider, marginTop: 8 },
  newToggleText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  newForm: { marginBottom: 16 },
});
