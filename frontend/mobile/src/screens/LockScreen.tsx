import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@constants/colors';
import { useBiometric } from '@hooks/useBiometric';

interface Props {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: Props) {
  const { isAvailable, checkAvailability, authenticate } = useBiometric();
  const [error, setError] = useState('');

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const handleUnlock = async () => {
    if (isAvailable) {
      const ok = await authenticate();
      if (ok) {
        onUnlock();
      } else {
        setError('Authentication failed');
      }
    } else {
      onUnlock();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>NgoenSai</Text>
      <Text style={styles.subtitle}>Session expired. Verify to continue.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleUnlock}>
        <Text style={styles.buttonText}>
          {isAvailable ? 'Unlock with Biometrics' : 'Tap to Unlock'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 24 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.primary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 32 },
  error: { color: Colors.error, fontSize: 14, marginBottom: 16 },
  button: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  buttonText: { color: Colors.textOnPrimary, fontSize: 16, fontWeight: '600' },
});
