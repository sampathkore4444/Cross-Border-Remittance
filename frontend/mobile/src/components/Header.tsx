import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@constants/colors';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function Header({ title, onBack, rightAction }: HeaderProps) {
  return (
    <View style={styles.container}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : <View style={styles.placeholder} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: Colors.text },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text, flex: 1, textAlign: 'center' },
  placeholder: { width: 40 },
  rightAction: { width: 40, alignItems: 'flex-end' },
});
