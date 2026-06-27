import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors } from '@constants/colors';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export function Loading({ message, fullScreen }: LoadingProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={Colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  fullScreen: { flex: 1, backgroundColor: Colors.background },
  message: { marginTop: 12, fontSize: 14, color: Colors.textSecondary },
});
