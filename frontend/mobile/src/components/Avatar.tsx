import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@constants/colors';

interface AvatarProps {
  name: string;
  size?: number;
}

export function Avatar({ name, size = 48 }: AvatarProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const bgColors = [Colors.primary, Colors.secondary, Colors.accent, '#7C3AED', '#EC4899', '#14B8A6'];
  const colorIndex = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % bgColors.length;
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColors[colorIndex] }]} accessibilityRole="image" accessibilityLabel={`Avatar for ${name}`}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#FFF', fontWeight: '700' },
});
