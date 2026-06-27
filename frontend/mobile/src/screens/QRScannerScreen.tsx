import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface Props {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScannerScreen({ onScan, onClose }: Props) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScan(data);
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.permissionText}>{t('common.loading')}</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Camera Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
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
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.hint}>{t('qr.instructions')}</Text>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
      {scanned && (
        <TouchableOpacity style={styles.rescanButton} onPress={() => setScanned(false)}>
          <Text style={styles.rescanText}>Tap to Scan Again</Text>
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
  cancelButton: { padding: 12 },
  cancelText: { fontSize: 16, color: Colors.textOnPrimary, fontWeight: '600' },
  rescanButton: { position: 'absolute', bottom: 120, alignSelf: 'center', backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  rescanText: { color: Colors.textOnPrimary, fontWeight: '700' },
});
