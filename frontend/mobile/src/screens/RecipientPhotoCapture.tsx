import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface Props {
  onCapture: (photoUri: string) => void;
  onClose: () => void;
}

export default function RecipientPhotoCapture({ onCapture, onClose }: Props) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const result = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (result?.uri) {
        setPhoto(result.uri);
      }
    } catch {}
  };

  const confirmPhoto = () => {
    if (photo) onCapture(photo);
  };

  const retakePhoto = () => {
    setPhoto(null);
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

  if (photo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo }} style={styles.preview} />
          <Text style={styles.hint}>Recipient photo captured</Text>
          <View style={styles.previewButtons}>
            <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={confirmPhoto}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="front" />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Take recipient photo</Text>
        <TouchableOpacity style={styles.shutterButton} onPress={takePhoto}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.text },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  permissionText: { fontSize: 16, color: Colors.textOnPrimary, textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  buttonText: { color: Colors.textOnPrimary, fontWeight: '700', fontSize: 16 },
  previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  preview: { width: '100%', height: '70%', borderRadius: 16, marginBottom: 16 },
  hint: { fontSize: 14, color: Colors.textOnPrimary, marginBottom: 20, opacity: 0.8 },
  previewButtons: { flexDirection: 'row', gap: 16 },
  retakeButton: { backgroundColor: Colors.textLight, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  retakeText: { color: Colors.textOnPrimary, fontWeight: '700', fontSize: 16 },
  confirmButton: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  confirmText: { color: Colors.textOnPrimary, fontWeight: '700', fontSize: 16 },
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  overlayText: { fontSize: 16, color: Colors.textOnPrimary, fontWeight: '600', marginBottom: 24 },
  shutterButton: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: Colors.textOnPrimary, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.textOnPrimary },
  footer: { padding: 24, alignItems: 'center' },
  cancelButton: { padding: 12 },
  cancelText: { fontSize: 16, color: Colors.textOnPrimary, fontWeight: '600' },
});
