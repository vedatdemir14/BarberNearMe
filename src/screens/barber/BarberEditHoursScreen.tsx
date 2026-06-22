import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { Colors } from '../../constants';
import BackButton from '../../components/BackButton';
import { friendlyError } from '../../utils/errorMessage';
import { getBarber, updateBarberWorkingHours } from '../../services/barberService';

type Props = NativeStackScreenProps<RootStackParamList, 'BarberEditHours'>;

const DAYS  = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const SLOTS = ['15', '20', '30', '45', '60'];

function timeValid(t: string) { return /^\d{2}:\d{2}$/.test(t); }

export default function BarberEditHoursScreen({ navigation, route }: Props) {
  const { uid } = route.params;

  const [openDays,  setOpenDays]  = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [openTime,  setOpenTime]  = useState('09:00');
  const [closeTime, setCloseTime] = useState('21:00');
  const [slotMin,   setSlotMin]   = useState('30');
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    getBarber(uid)
      .then(s => {
        const wh = s?.workingHours;
        if (wh) {
          setOpenDays(wh.days ?? [0, 1, 2, 3, 4, 5]);
          setOpenTime(wh.openTime ?? '09:00');
          setCloseTime(wh.closeTime ?? '21:00');
          setSlotMin(String(wh.slotDurationMin ?? 30));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uid]);

  function toggleDay(i: number) {
    setOpenDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i].sort());
  }

  async function handleSave() {
    if (openDays.length === 0) { Alert.alert('Hata', 'En az 1 çalışma günü seçin.'); return; }
    if (!timeValid(openTime) || !timeValid(closeTime)) {
      Alert.alert('Hata', 'Saatleri SS:DD formatında girin. Örn: 09:00'); return;
    }
    setSaving(true);
    try {
      await updateBarberWorkingHours(uid, {
        days: openDays,
        openTime,
        closeTime,
        slotDurationMin: parseInt(slotMin) || 30,
      });
      Alert.alert('Kaydedildi', 'Çalışma saatleri güncellendi.', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Hata', friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Çalışma Saatleri</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

          <Text style={styles.sectionTitle}>Çalışma Günleri</Text>
          <View style={styles.chipRow}>
            {DAYS.map((d, i) => (
              <TouchableOpacity key={d} style={[styles.chip, openDays.includes(i) && styles.chipActive]} onPress={() => toggleDay(i)}>
                <Text style={[styles.chipText, openDays.includes(i) && styles.chipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Çalışma Saatleri</Text>
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

          <Text style={styles.sectionTitle}>Randevu Aralığı</Text>
          <View style={styles.chipRow}>
            {SLOTS.map(s => (
              <TouchableOpacity key={s} style={[styles.chip, slotMin === s && styles.chipActive]} onPress={() => setSlotMin(s)}>
                <Text style={[styles.chipText, slotMin === s && styles.chipTextActive]}>{s} dk</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.btn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#020000" /> : <Text style={styles.btnText}>Kaydet</Text>}
          </TouchableOpacity>
          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  inner: { padding: 20, gap: 10 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary, marginTop: 8 },
  label:        { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  row:      { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  chipRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  chipActive:   { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  chipText:     { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive:{ color: '#020000' },
  input: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text, backgroundColor: Colors.surface },
  btn:     { backgroundColor: Colors.secondary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 12 },
  btnText: { color: '#020000', fontSize: 16, fontWeight: '800' },
});
