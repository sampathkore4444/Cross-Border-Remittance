import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Camera, CameraType } from 'expo-camera';
import { api } from '@services/api';
import { useToast } from '@components/Toast';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';

type NavigationProps = NativeStackScreenProps<RootStackParamList, 'PhotoCapture'>;

type Props = Partial<NavigationProps> & {
  onCapture?: (photoUri: string) => void;
  onClose?: () => void;
};

export default function RecipientPhotoCapture({ route, navigation, onCapture, onClose }: Props) {
  const transactionRef = route?.params?.transactionRef;
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    const unsub = api.onUploadProgress((pct: number) => {
      setUploadProgress(pct);
    });
    return unsub;
  }, []);

  const close = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      navigation?.goBack();
    }
  }, [onClose, navigation]);

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const result = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (result?.uri) {
        setPhoto(result.uri);
      }
    } catch { }
  };

  const confirmPhoto = async () => {
    if (!photo) return;

    if (onCapture) {
      onCapture(photo);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    const ref = transactionRef || '';
    try {
      await api.uploadPhoto(photo, ref);
      showToast(t('photoUpload.uploadSuccess'), 'success');
      navigation?.goBack();
    } catch {
      showToast(t('photoUpload.uploadError'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    setUploadProgress(0);
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.permissionText}>{t('common.loading')}</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>{t('photoUpload.grantCamera')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={close}>
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
          <Text style={styles.hint}>{t('photoUpload.captured')}</Text>
          {uploading ? (
            <View style={styles.uploadingRow}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.uploadingText}>{t('photoUpload.uploading')} {uploadProgress}%</Text>
            </View>
          ) : (
            <View style={styles.previewButtons}>
              <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto} disabled={uploading}>
                <Text style={styles.retakeText}>{t('photoUpload.retake')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmPhoto} disabled={uploading}>
                <Text style={styles.confirmText}>{t('photoUpload.confirm')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Camera ref={cameraRef} style={StyleSheet.absoluteFillObject} type={CameraType.front} ratio="16:9" />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>{t('photoUpload.takePhoto')}</Text>
        <TouchableOpacity style={styles.shutterButton} onPress={takePhoto}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={close}>
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
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  uploadingText: { fontSize: 14, color: Colors.textOnPrimary, fontWeight: '600' },
});
