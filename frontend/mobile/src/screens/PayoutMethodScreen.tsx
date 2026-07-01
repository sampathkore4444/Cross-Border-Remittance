import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SendStackParamList } from '@navigation/types';
import type { PayoutMethod } from '@app-types/api';

type Props = NativeStackScreenProps<SendStackParamList, 'PayoutMethod'>;

const METHODS: { key: PayoutMethod; time: string }[] = [
  { key: 'bcel_cash', time: '15' },
  { key: 'seven_eleven_cash', time: '15' },
  { key: 'mobile_topup', time: '0' },
  { key: 'bcel_wallet', time: '0' },
];

const NEARBY_LOCATIONS = [
  { name: 'BCEL Vientiane Main', address: '143 Rue Setthathirath, Vientiane', distance: '0.3 km', method: 'bcel_cash' },
  { name: '7-Eleven Talat Sao', address: 'Talat Sao Mall, Vientiane', distance: '0.8 km', method: 'seven_eleven_cash' },
  { name: 'BCEL Dongpalan', address: 'Dongpalan Road, Vientiane', distance: '1.2 km', method: 'bcel_cash' },
  { name: '7-Eleven Dongpalan', address: 'Dongpalan Road, Vientiane', distance: '1.5 km', method: 'seven_eleven_cash' },
];

export default function PayoutMethodScreen({ route, navigation }: Props) {
  const { quote, recipient } = route.params;
  const { t } = useTranslation();
  const [selected, setSelected] = useState<PayoutMethod>('bcel_cash');

  const selectedOption = quote.payout_options?.find((o: { method: string }) => o.method === selected);
  const displayAmount = selectedOption?.target_amount || quote.target_amount;

  const handleConfirm = () => {
    navigation.navigate('Confirm', { quote, recipient, payoutMethod: selected, paymentMethod: 'promptpay_qr' });
  };

  const filteredLocations = NEARBY_LOCATIONS.filter(l => l.method === selected);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('payout.title')}</Text>
        {METHODS.map(({ key, time }) => {
          const opt = quote.payout_options?.find((o: { method: string }) => o.method === key);
          const amount = opt?.target_amount;
          return (
            <TouchableOpacity key={key} onPress={() => setSelected(key)}>
              <Card style={selected === key ? [styles.methodCard, styles.methodCardSelected] : [styles.methodCard]}>
                <View style={styles.methodHeader}>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>{t(`payout.method.${key}`)}</Text>
                    <Text style={styles.methodTime}>{t('payout.pickupTime', { time })}</Text>
                  </View>
                  {key === 'bcel_cash' && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>{t('payout.recommended')}</Text>
                    </View>
                  )}
                </View>
                {amount && <Text style={styles.methodAmount}>{amount.toLocaleString()} LAK</Text>}
              </Card>
            </TouchableOpacity>
          );
        })}
        {filteredLocations.length > 0 && (
          <View style={styles.mapSection}>
            <Text style={styles.mapTitle}>{t('payout.nearbyLocations')}</Text>
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapIcon}>📍</Text>
              {filteredLocations.map((loc, i) => (
                <View key={i} style={styles.locationRow}>
                  <View style={styles.locationDot} />
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>{loc.name}</Text>
                    <Text style={styles.locationAddress}>{loc.address}</Text>
                  </View>
                  <Text style={styles.locationDistance}>{loc.distance}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>{recipient.name}</Text>
          <Text style={styles.summaryAmount}>{displayAmount.toLocaleString()} LAK</Text>
        </View>
        <Button title={t('payout.confirm')} onPress={handleConfirm} fullWidth size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  methodCard: { marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  methodCardSelected: { borderColor: Colors.primary },
  methodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  methodInfo: { flex: 1 },
  methodName: { fontSize: 17, fontWeight: '600', color: Colors.text },
  methodTime: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  recommendedBadge: { backgroundColor: Colors.secondary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  recommendedText: { fontSize: 10, color: Colors.textOnPrimary, fontWeight: '700' },
  methodAmount: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: 8 },
  summary: { alignItems: 'center', paddingVertical: 24 },
  summaryLabel: { fontSize: 14, color: Colors.textSecondary },
  summaryAmount: { fontSize: 28, fontWeight: '800', color: Colors.text, marginTop: 4 },
  mapSection: { marginTop: 16, marginBottom: 8 },
  mapTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  mapPlaceholder: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border },
  mapIcon: { fontSize: 28, textAlign: 'center', marginBottom: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  locationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginRight: 10 },
  locationInfo: { flex: 1 },
  locationName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  locationAddress: { fontSize: 12, color: Colors.textLight, marginTop: 1 },
  locationDistance: { fontSize: 12, fontWeight: '600', color: Colors.primary },
});
