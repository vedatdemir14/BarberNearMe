import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants';
export default function BarberRegStep4Screen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.primary }}>Berber Kayıt — Adım 4</Text>
      <Text style={{ color: Colors.textSecondary, marginTop: 8 }}>TODO: implement</Text>
    </SafeAreaView>
  );
}
