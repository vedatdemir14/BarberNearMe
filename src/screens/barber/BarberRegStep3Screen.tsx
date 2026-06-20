import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { Colors } from '../../constants';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';

type Props = NativeStackScreenProps<RootStackParamList, 'BarberRegStep3'>;

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function BarberRegStep3Screen({ navigation, route }: Props) {
  const { uid } = route.params;

  const [openDays,  setOpenDays]  = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [openTime,  setOpenTime]  = useState('09:00');
  const [closeTime, setCloseTime] = useState('21:00');
  const [slotMin,   setSlotMin]   = useState('30');
  const [address,   setAddress]   = useState('');
  const [city,      setCity]      = useState('');
  const [loading,   setLoading]   = useState(false);

  function toggleDay(d: number) {
    setOpenDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()
    );
  }

  function validateTime(t: string) {
    return /^\d{2}:\d{2}$/.test(t);
  }

  async function handleNext() {
    if (openDays.length === 0) { Alert.alert('Hata', 'En az 1 çalışma günü seçin.'); return; }
    if (!validateTime(openTime) || !validateTime(closeTime)) {
      Alert.alert('Hata', 'Saatleri SS:DD formatında girin. Örn: 09:00');
      return;
    }
    if (!address.trim() || !city.trim()) {
      Alert.alert('Hata', 'Adres ve şehir zorunludur.');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'barbers', uid), {
        address,
        city,
        neighborhood: '',
        country: 'Türkiye',
        workingHours: {
          days: openDays,
          openTime,
          closeTime,
          slotDurationMin: parseInt(slotMin) || 30,
        },
      });
      navigation.navigate('BarberRegStep4', { uid });
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

        {/* Progress */}
        <View style={styles.progress}>
          {[1, 2, 3, 4].map(n => (
            <View key={n} style={[styles.dot, n <= 3 && styles.dotActive]}>
              <Text style={[styles.dotText, n <= 3 && styles.dotTextActive]}>{n}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.title}>Çalışma Saatleri & Adres</Text>
        <Text style={styles.sub}>Müşteriler randevu alırken bu bilgileri görecek.</Text>

        {/* Çalışma günleri */}
        <Text style={styles.sectionTitle}>📅 Çalışma Günleri</Text>
        <View style={styles.daysRow}>
          {DAYS.map((d, i) => (
            <TouchableOpacity
              key={d}
              style={[styles.dayChip, openDays.includes(i) && styles.dayChipActive]}
              onPress={() => toggleDay(i)}
            >
              <Text style={[styles.dayText, openDays.includes(i) && styles.dayTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Saatler */}
        <Text style={styles.sectionTitle}>🕐 Çalışma Saatleri</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Açılış</Text>
            <TextInput style={styles.input} placeholder="09:00" placeholderTextColor={Colors.textMuted}
              value={openTime} onChangeText={setOpenTime} keyboardType="numeric" maxLength={5} />
          </View>
          <View style={{ alignSelf: 'flex-end', paddingBottom: 12 }}>
            <Text style={{ fontSize: 18, color: Colors.textMuted }}>→</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Kapanış</Text>
            <TextInput style={styles.input} placeholder="21:00" placeholderTextColor={Colors.textMuted}
              value={closeTime} onChangeText={setCloseTime} keyboardType="numeric" maxLength={5} />
          </View>
        </View>

        <Text style={styles.label}>Randevu Aralığı</Text>
        <View style={styles.slotRow}>
          {['15', '20', '30', '45', '60'].map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.slotChip, slotMin === m && styles.slotChipActive]}
              onPress={() => setSlotMin(m)}
            >
              <Text style={[styles.slotText, slotMin === m && styles.slotTextActive]}>{m} dk</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Adres */}
        <Text style={styles.sectionTitle}>📍 Konum</Text>

        <Text style={styles.label}>Adres</Text>
        <TextInput style={[styles.input, { minHeight: 70 }]}
          placeholder="Atatürk Cad. No:12, Kadıköy"
          placeholderTextColor={Colors.textMuted}
          multiline value={address} onChangeText={setAddress} />

        <Text style={styles.label}>Şehir</Text>
        <TextInput style={styles.input} placeholder="İstanbul" placeholderTextColor={Colors.textMuted}
          value={city} onChangeText={setCity} />

        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleNext} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Devam Et →</Text>}
        </TouchableOpacity>
        <View style={{ height: 24 }} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner:     { padding: 20, gap: 12 },

  progress:     { flexDirection: 'row', gap: 8, marginBottom: 4 },
  dot:          { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  dotActive:    { backgroundColor: Colors.primary },
  dotText:      { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  dotTextActive:{ color: '#fff' },

  title:        { fontSize: 22, fontWeight: '800', color: Colors.primary },
  sub:          { fontSize: 13, color: Colors.textSecondary },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginTop: 4 },

  daysRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip:      { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  dayChipActive:{ backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayText:      { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  dayTextActive:{ color: '#fff' },

  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },

  slotRow:       { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  slotChip:      { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  slotChipActive:{ backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  slotText:      { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  slotTextActive:{ color: '#fff' },

  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text, backgroundColor: Colors.surface,
  },
  btn:     { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
