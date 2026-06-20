import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import MapView, { Marker, MapPressEvent, Region } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { Colors } from '../../constants';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';

type Props = NativeStackScreenProps<RootStackParamList, 'BarberRegStep3'>;

const DAYS  = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const SLOTS = ['15', '20', '30', '45', '60'];

const URLA: Region = {
  latitude: 38.3217, longitude: 26.7635,
  latitudeDelta: 0.06, longitudeDelta: 0.06,
};

function timeValid(t: string) { return /^\d{2}:\d{2}$/.test(t); }

export default function BarberRegStep3Screen({ navigation, route }: Props) {
  const { uid } = route.params;

  // Çalışma saatleri
  const [openDays,  setOpenDays]  = useState<number[]>([0,1,2,3,4,5]);
  const [openTime,  setOpenTime]  = useState('09:00');
  const [closeTime, setCloseTime] = useState('21:00');
  const [slotMin,   setSlotMin]   = useState('30');

  // Konum — haritada seçilen pin
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(null);

  // Adres (opsiyonel açıklama)
  const [address, setAddress] = useState('');
  const [city,    setCity]    = useState('İzmir');

  const [loading, setLoading] = useState(false);

  function toggleDay(i: number) {
    setOpenDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i].sort());
  }

  async function handleNext() {
    if (openDays.length === 0) { Alert.alert('Hata', 'En az 1 çalışma günü seçin.'); return; }
    if (!timeValid(openTime) || !timeValid(closeTime)) {
      Alert.alert('Hata', 'Saatleri SS:DD formatında girin. Örn: 09:00'); return;
    }
    if (!pin) { Alert.alert('Hata', 'Haritadan dükkan konumunu seçin.'); return; }
    if (!city.trim()) { Alert.alert('Hata', 'Şehir zorunludur.'); return; }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'barbers', uid), {
        address,
        city,
        neighborhood: '',
        country: 'Türkiye',
        location: { latitude: pin.latitude, longitude: pin.longitude },
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

        {/* Progress */}
        <View style={styles.progress}>
          {[1,2,3,4].map(n => (
            <View key={n} style={[styles.dot, n <= 3 && styles.dotActive]}>
              <Text style={[styles.dotText, n <= 3 && styles.dotTextActive]}>{n}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.title}>Konum & Çalışma Saatleri</Text>
        <Text style={styles.sub}>Müşteriler randevu alırken bu bilgileri görecek.</Text>

        {/* ── Harita Konum Seçici ── */}
        <Text style={styles.sectionTitle}>📍 Dükkan Konumu</Text>
        <Text style={styles.hint}>Haritaya dokunarak dükkanın konumunu işaretle</Text>

        <View style={styles.mapWrap}>
          <MapView
            style={styles.map}
            initialRegion={URLA}
            onPress={(e: MapPressEvent) => setPin(e.nativeEvent.coordinate)}
          >
            {pin && (
              <Marker coordinate={pin} title="Dükkanım" pinColor={Colors.secondary} />
            )}
          </MapView>
          {!pin && (
            <View style={styles.mapOverlay} pointerEvents="none">
              <Text style={styles.mapOverlayText}>📍 Konuma dokun</Text>
            </View>
          )}
        </View>

        {pin ? (
          <Text style={styles.coordText}>
            ✓ Konum seçildi: {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
          </Text>
        ) : (
          <Text style={[styles.coordText, { color: Colors.danger }]}>
            Henüz konum seçilmedi
          </Text>
        )}

        {/* Adres (opsiyonel) */}
        <Text style={styles.label}>Açık Adres (opsiyonel)</Text>
        <TextInput
          style={[styles.input, { minHeight: 64 }]}
          placeholder="Sokak, bina no, daire…"
          placeholderTextColor={Colors.textMuted}
          multiline value={address} onChangeText={setAddress}
        />

        <Text style={styles.label}>Şehir</Text>
        <TextInput
          style={styles.input}
          placeholder="İzmir"
          placeholderTextColor={Colors.textMuted}
          value={city} onChangeText={setCity}
        />

        {/* ── Çalışma Günleri ── */}
        <Text style={styles.sectionTitle}>📅 Çalışma Günleri</Text>
        <View style={styles.chipRow}>
          {DAYS.map((d, i) => (
            <TouchableOpacity
              key={d}
              style={[styles.chip, openDays.includes(i) && styles.chipActive]}
              onPress={() => toggleDay(i)}
            >
              <Text style={[styles.chipText, openDays.includes(i) && styles.chipTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Saatler ── */}
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

        {/* ── Slot Süresi ── */}
        <Text style={styles.label}>Randevu Aralığı</Text>
        <View style={styles.chipRow}>
          {SLOTS.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, slotMin === s && styles.chipActive]}
              onPress={() => setSlotMin(s)}
            >
              <Text style={[styles.chipText, slotMin === s && styles.chipTextActive]}>{s} dk</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleNext} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Devam Et →</Text>}
        </TouchableOpacity>
        <View style={{ height: 24 }} />

      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner:     { padding: 20, gap: 10 },

  progress:     { flexDirection: 'row', gap: 8, marginBottom: 4 },
  dot:          { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  dotActive:    { backgroundColor: Colors.primary },
  dotText:      { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  dotTextActive:{ color: '#fff' },

  title:        { fontSize: 22, fontWeight: '800', color: Colors.primary },
  sub:          { fontSize: 13, color: Colors.textSecondary },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginTop: 8 },
  hint:         { fontSize: 12, color: Colors.textMuted },
  label:        { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },

  mapWrap: {
    height: 220, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1.5, borderColor: Colors.border, marginTop: 4,
  },
  map: { flex: 1 },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  mapOverlayText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  coordText:      { fontSize: 12, color: Colors.secondary, textAlign: 'center' },

  row:      { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  chipRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  chipActive:   { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  chipText:     { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive:{ color: '#fff' },

  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text, backgroundColor: Colors.surface,
  },
  btn:     { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
