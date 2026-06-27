import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
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

  const showLanguagePicker = () => {
    Alert.alert(
      t('profile.language'),
      '',
      LANG_OPTIONS.map(lang => ({
        text: lang.label,
        onPress: () => changeLanguage(lang.key),
        style: i18n.language === lang.key ? ('cancel' as const) : ('default' as const),
      })).concat([{ text: t('common.cancel'), onPress: () => {}, style: 'cancel' as const }]),
    );
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
          <TouchableOpacity style={styles.menuItem}>
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
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>{t('profile.rateAlerts')}</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AgentDashboard')}>
            <Text style={styles.menuText}>Agent Dashboard</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>{t('profile.support')}</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </Card>
        <Button title={t('profile.logout')} onPress={logout} variant="outline" fullWidth style={styles.logoutBtn} />
      </ScrollView>
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
  divider: { height: 1, backgroundColor: Colors.divider },
  logoutBtn: { marginTop: 8 },
});
