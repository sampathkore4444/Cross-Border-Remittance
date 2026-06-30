import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Modal, Switch, TextInput, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Card } from '@components/Card';
import { Avatar } from '@components/Avatar';
import { Button } from '@components/Button';
import { useAuth } from '@hooks/useAuth';
import { changeLanguage } from '@i18n/index';

const LANG_OPTIONS = [
  { key: 'lo', label: 'ລາວ' },
  { key: 'th', label: 'ไทย' },
  { key: 'en', label: 'English' },
];

export default function ProfileScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [rateAlertsVisible, setRateAlertsVisible] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [rateThreshold, setRateThreshold] = useState('8500');
  const [supportVisible, setSupportVisible] = useState(false);

  const showLanguagePicker = () => {
    Alert.alert(
      t('profile.language'),
      '',
      LANG_OPTIONS.map(lang => ({
        text: lang.label,
        onPress: () => changeLanguage(lang.key),
        style: i18n.language === lang.key ? ('cancel' as const) : ('default' as const),
      })).concat([{ text: t('common.cancel'), onPress: async () => {}, style: 'cancel' as const }]),
    );
  };

  const openSupportChat = () => {
    Linking.openURL('https://line.me/R/ti/p/@ngoensai').catch(() => {
      setSupportVisible(true);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <Avatar name={user?.name || 'User'} size={72} />
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
          <View style={styles.kycBadge}>
            <Text style={styles.kycText}>{t('profile.kycLevel')}: {user?.kyc_level || t('profile.unverified')}</Text>
          </View>
        </View>
        <Card style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Send', { screen: 'Recipient' })}>
            <Text style={styles.menuText}>{t('profile.savedRecipients')}</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AutosendSettings')}>
            <Text style={styles.menuText}>{t('profile.autosend')}</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem} onPress={showLanguagePicker}>
            <Text style={styles.menuText}>{t('profile.language')}</Text>
            <Text style={styles.menuValue}>{LANG_OPTIONS.find(l => l.key === i18n.language)?.label || 'English'}</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => setRateAlertsVisible(true)}>
            <Text style={styles.menuText}>{t('profile.rateAlerts')}</Text>
            <View style={styles.menuValueRow}>
              {alertsEnabled && <Text style={styles.badgeActive}>{t('profile.active')}</Text>}
              <Text style={styles.menuArrow}>→</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AgentDashboard')}>
            <Text style={styles.menuText}>Agent Dashboard</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem} onPress={openSupportChat}>
            <Text style={styles.menuText}>{t('profile.support')}</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </Card>
        <Button title={t('profile.logout')} onPress={logout} variant="outline" fullWidth style={styles.logoutBtn} />
      </ScrollView>

      <Modal visible={rateAlertsVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.rateAlerts')}</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t('profile.enableAlerts')}</Text>
              <Switch value={alertsEnabled} onValueChange={setAlertsEnabled} trackColor={{ true: Colors.primary }} />
            </View>
            {alertsEnabled && (
              <>
                <Text style={styles.fieldLabel}>{t('profile.thresholdLabel')}</Text>
                <TextInput
                  style={styles.input}
                  value={rateThreshold}
                  onChangeText={setRateThreshold}
                  keyboardType="numeric"
                  placeholder="8500"
                />
                <Text style={styles.fieldHint}>{t('profile.thresholdHint')}</Text>
              </>
            )}
            <Button title={t('common.done')} onPress={() => setRateAlertsVisible(false)} fullWidth />
          </View>
        </View>
      </Modal>

      <Modal visible={supportVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.support')}</Text>
            <Text style={styles.supportText}>{t('profile.supportMessage')}</Text>
            <Button title={t('profile.contactLINE')} onPress={() => Linking.openURL('https://line.me/R/ti/p/@ngoensai')} fullWidth style={{ marginBottom: 8 }} />
            <Button title={t('common.close')} onPress={() => setSupportVisible(false)} variant="outline" fullWidth />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  profileHeader: { alignItems: 'center', paddingVertical: 24 },
  name: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: 12 },
  phone: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  kycBadge: { backgroundColor: Colors.rateBadge, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginTop: 12 },
  kycText: { fontSize: 12, color: Colors.rateText, fontWeight: '600' },
  menuCard: { marginBottom: 24 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  menuText: { fontSize: 16, color: Colors.text, fontWeight: '500' },
  menuArrow: { fontSize: 18, color: Colors.textLight },
  menuValue: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  menuValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeActive: { fontSize: 11, color: Colors.textOnPrimary, backgroundColor: Colors.secondary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden', fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.divider },
  logoutBtn: { marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 20, textAlign: 'center' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  switchLabel: { fontSize: 16, color: Colors.text },
  fieldLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, fontSize: 16, color: Colors.text, marginBottom: 6 },
  fieldHint: { fontSize: 12, color: Colors.textLight, marginBottom: 20 },
  supportText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
});
