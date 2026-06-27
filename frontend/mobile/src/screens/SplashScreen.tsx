import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Button } from '@components/Button';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();

  const selectLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoArea}>
          <Text style={styles.logoText}>{t('app.name')}</Text>
          <Text style={styles.tagline}>{t('splash.subtitle')}</Text>
        </View>
        <View style={styles.languageButtons}>
          <Button title={t('splash.lao')} onPress={() => selectLanguage('lo')} variant="primary" fullWidth size="lg" style={styles.langBtn} />
          <Button title={t('splash.thai')} onPress={() => selectLanguage('th')} variant="outline" fullWidth size="lg" style={styles.langBtn} />
          <Button title={t('splash.english')} onPress={() => selectLanguage('en')} variant="ghost" fullWidth size="lg" style={styles.langBtn} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  content: { flex: 1, justifyContent: 'space-between', padding: 32 },
  logoArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 42, fontWeight: '800', color: Colors.textOnPrimary, marginBottom: 12 },
  tagline: { fontSize: 16, color: Colors.textOnPrimary, textAlign: 'center', opacity: 0.9, lineHeight: 24 },
  languageButtons: { gap: 12, paddingBottom: 32 },
  langBtn: { marginBottom: 8 },
});
