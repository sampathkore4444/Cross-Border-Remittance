import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { api } from '@services/api';
import { useToast } from '@components/Toast';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'QRScanner'>;

export default function QRScannerScreen({ route, navigation }: Props) {
  const { transactionRef } = route.params;
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || verifying || verified) return;
    setScanned(true);
    setVerifying(true);
    try {
      await api.client.post(`/transactions/${transactionRef}/verify-pickup`, { code: data });
      setVerified(true);
      showToast(t('qrscan.success'), 'success');
      setTimeout(() => navigation.goBack(), 1500);
    } catch {
      showToast(t('qrscan.error'), 'error');
      setScanned(false);
    } finally {
      setVerifying(false);
    }
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.permissionText}>{t('common.loading')}</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>{t('photoUpload.grantCamera')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned && !verifying ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
      </View>
      <View style={styles.footer}>
        {verifying ? (
          <View style={styles.verifyingRow}>
            <ActivityIndicator color={Colors.textOnPrimary} />
            <Text style={styles.verifyingText}>{t('qrscan.verifying')}</Text>
          </View>
        ) : verified ? (
          <Text style={styles.verifiedText}>{t('qrscan.pickupVerified')}</Text>
        ) : (
          <Text style={styles.hint}>{t('qrscan.instructions')}</Text>
        )}
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
      {scanned && !verifying && !verified && (
        <TouchableOpacity style={styles.rescanButton} onPress={() => setScanned(false)}>
          <Text style={styles.rescanText}>{t('qrscan.scanAgain')}</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.text },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  permissionText: { fontSize: 16, color: Colors.textOnPrimary, textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  buttonText: { color: Colors.textOnPrimary, fontWeight: '700', fontSize: 16 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanArea: { width: 250, height: 250, borderWidth: 2, borderColor: Colors.primary, borderRadius: 16, backgroundColor: 'transparent' },
  footer: { padding: 24, alignItems: 'center' },
  hint: { fontSize: 14, color: Colors.textOnPrimary, textAlign: 'center', marginBottom: 20, opacity: 0.8 },
  verifyingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  verifyingText: { fontSize: 14, color: Colors.textOnPrimary, fontWeight: '600' },
  verifiedText: { fontSize: 16, color: Colors.success, fontWeight: '700', marginBottom: 20 },
  cancelButton: { padding: 12 },
  cancelText: { fontSize: 16, color: Colors.textOnPrimary, fontWeight: '600' },
  rescanButton: { position: 'absolute', bottom: 120, alignSelf: 'center', backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  rescanText: { color: Colors.textOnPrimary, fontWeight: '700' },
});
