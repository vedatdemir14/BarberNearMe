import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { Colors } from '../../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'AppointmentConfirm'>;

export default function AppointmentConfirmScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.checkCircle}><Text style={{ fontSize: 40 }}>✓</Text></View>
        <Text style={styles.title}>Randevu Oluşturuldu!</Text>
        <Text style={styles.sub}>Berberiniz onayladıktan sonra bildirim alacaksınız.</Text>
        <View style={styles.card}>
          {[['Berber', "Sirat's Barber Shop"], ['Çalışan', 'Engyal Taskiran'], ['Hizmet', 'Saç Kesimi'], ['Tarih', '14 Mayıs 2025'], ['Saat', '10:30'], ['Ücret', '₺500']].map(([l, v]) => (
            <View key={l} style={styles.row}><Text style={styles.rowLabel}>{l}</Text><Text style={[styles.rowVal, l === 'Ücret' && { color: Colors.secondary }]}>{v}</Text></View>
          ))}
        </View>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => (navigation as any).navigate('Appointments')}>
          <Text style={styles.btnText}>Randevularıma Git</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('Messaging', { barberId: '1', barberName: "Sirat's" })}>
          <Text style={styles.btnSecText}>Berberle Mesajlaş</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => (navigation as any).navigate('Home')}>
          <Text style={styles.btnSecText}>Ana Sayfaya Dön</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: Colors.primary, textAlign: 'center' },
  sub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  card: { width: '100%', backgroundColor: '#f8f8ff', borderWidth: 1.5, borderColor: '#e0e0ff', borderRadius: 14, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  rowLabel: { fontSize: 12, color: Colors.textSecondary },
  rowVal: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  btnPrimary: { width: '100%', backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnSecondary: { width: '100%', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnSecText: { fontSize: 14, color: Colors.primary },
});
