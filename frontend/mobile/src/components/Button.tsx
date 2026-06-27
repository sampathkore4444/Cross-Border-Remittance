import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors } from '@constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({ title, onPress, variant = 'primary', size = 'md', loading, disabled, style, fullWidth }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.textOnPrimary} />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], size === 'sm' && styles.textSm, size === 'lg' && styles.textLg]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.secondary },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  ghost: { backgroundColor: 'transparent' },
  size_sm: { paddingVertical: 8, paddingHorizontal: 16 },
  size_md: { paddingVertical: 14, paddingHorizontal: 24 },
  size_lg: { paddingVertical: 18, paddingHorizontal: 32 },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  text: { fontWeight: '700', fontSize: 16 },
  text_primary: { color: Colors.textOnPrimary },
  text_secondary: { color: Colors.textOnPrimary },
  text_outline: { color: Colors.primary },
  text_ghost: { color: Colors.primary },
  textSm: { fontSize: 14 },
  textLg: { fontSize: 18 },
});
