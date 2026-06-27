import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { Colors } from '@constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  prefix?: string;
}

export function Input({ label, error, prefix, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput style={[styles.input, prefix && styles.inputWithPrefix, style]} placeholderTextColor={Colors.textLight} {...props} />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14 },
  inputError: { borderColor: Colors.error },
  prefix: { fontSize: 16, fontWeight: '600', color: Colors.text, marginRight: 8 },
  input: { flex: 1, fontSize: 16, color: Colors.text, paddingVertical: 14 },
  inputWithPrefix: { paddingLeft: 0 },
  error: { fontSize: 12, color: Colors.error, marginTop: 4 },
});
