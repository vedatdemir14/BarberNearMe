import React from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants';

/**
 * Tutarlı geri butonu. Unicode "←" bazı Android cihazlarda görünmüyordu;
 * bu yüzden uygulamayla birlikte gelen Ionicons vektör ikonu kullanılıyor.
 */
export default function BackButton({
  onPress,
  color = Colors.primary,
  size = 24,
  label,
  style,
}: {
  onPress: () => void;
  color?: string;
  size?: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={[styles.btn, style]}
      activeOpacity={0.6}
    >
      <Ionicons name="arrow-back" size={size} color={color} />
      {label ? <Text style={[styles.label, { color }]}>{label}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { fontSize: 15, fontWeight: '600' },
});
