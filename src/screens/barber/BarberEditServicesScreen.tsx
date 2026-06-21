import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { Colors } from '../../constants';
import { friendlyError } from '../../utils/errorMessage';
import { getBarber, updateBarberServices, Service, StaffMember } from '../../services/barberService';

type Props = NativeStackScreenProps<RootStackParamList, 'BarberEditServices'>;

export default function BarberEditServicesScreen({ navigation, route }: Props) {
  const { uid } = route.params;

  const [services, setServices] = useState<Service[]>([]);
  const [staff,    setStaff]    = useState<StaffMember[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    getBarber(uid)
      .then(s => {
        setServices(s?.services?.length ? s.services : [{ id: 's1', name: '', price: 0, durationMin: 30 }]);
        setStaff(s?.staff?.length ? s.staff : [{ id: 'st1', name: '', title: 'Berber' }]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uid]);

  /* ── Hizmetler ── */
  function addService() {
    setServices(prev => [...prev, { id: `s${Date.now()}`, name: '', price: 0, durationMin: 30 }]);
  }
  function removeService(id: string) {
    if (services.length === 1) { Alert.alert('En az 1 hizmet gerekli'); return; }
    setServices(prev => prev.filter(s => s.id !== id));
  }
  function updateService(id: string, field: keyof Service, val: string) {
    setServices(prev => prev.map(s => s.id !== id ? s : {
      ...s,
      [field]: field === 'price' || field === 'durationMin' ? (parseInt(val) || 0) : val,
    }));
  }

  /* ── Çalışanlar ── */
  function addStaff() {
    setStaff(prev => [...prev, { id: `st${Date.now()}`, name: '', title: 'Berber' }]);
  }
  function removeStaff(id: string) {
    if (staff.length === 1) { Alert.alert('En az 1 çalışan gerekli'); return; }
    setStaff(prev => prev.filter(s => s.id !== id));
  }
  function updateStaff(id: string, field: keyof StaffMember, val: string) {
    setStaff(prev => prev.map(s => s.id !== id ? s : { ...s, [field]: val }));
  }

  async function handleSave() {
    if (services.find(s => !s.name.trim() || s.price <= 0)) { Alert.alert('Hata', 'Her hizmetin adı ve fiyatı olmalıdır.'); return; }
    if (staff.find(s => !s.name.trim())) { Alert.alert('Hata', 'Her çalışanın adı olmalıdır.'); return; }

    setSaving(true);
    try {
      await updateBarberServices(uid, services, staff);
      Alert.alert('Kaydedildi', 'Hizmet ve çalışanlar güncellendi.', [
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
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ fontSize: 22 }}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Hizmetler & Çalışanlar</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

          {/* Hizmetler */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Hizmetler</Text>
              <TouchableOpacity onPress={addService} style={styles.addBtn}><Text style={styles.addBtnText}>+ Ekle</Text></TouchableOpacity>
            </View>
            {services.map((svc, i) => (
              <View key={svc.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIndex}>Hizmet {i + 1}</Text>
                  <TouchableOpacity onPress={() => removeService(svc.id)}><Text style={styles.removeBtn}>✕ Kaldır</Text></TouchableOpacity>
                </View>
                <Text style={styles.label}>Hizmet Adı</Text>
                <TextInput style={styles.input} placeholder="Saç Kesimi" placeholderTextColor={Colors.textMuted}
                  value={svc.name} onChangeText={v => updateService(svc.id, 'name', v)} />
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Fiyat (₺)</Text>
                    <TextInput style={styles.input} placeholder="150" placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric" value={svc.price ? String(svc.price) : ''}
                      onChangeText={v => updateService(svc.id, 'price', v)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Süre (dk)</Text>
                    <TextInput style={styles.input} placeholder="30" placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric" value={svc.durationMin ? String(svc.durationMin) : ''}
                      onChangeText={v => updateService(svc.id, 'durationMin', v)} />
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Çalışanlar */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Çalışanlar</Text>
              <TouchableOpacity onPress={addStaff} style={styles.addBtn}><Text style={styles.addBtnText}>+ Ekle</Text></TouchableOpacity>
            </View>
            {staff.map((st, i) => (
              <View key={st.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIndex}>Çalışan {i + 1}</Text>
                  <TouchableOpacity onPress={() => removeStaff(st.id)}><Text style={styles.removeBtn}>✕ Kaldır</Text></TouchableOpacity>
                </View>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Ad Soyad</Text>
                    <TextInput style={styles.input} placeholder="Mehmet K." placeholderTextColor={Colors.textMuted}
                      value={st.name} onChangeText={v => updateStaff(st.id, 'name', v)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Unvan</Text>
                    <TextInput style={styles.input} placeholder="Berber" placeholderTextColor={Colors.textMuted}
                      value={st.title} onChangeText={v => updateStaff(st.id, 'title', v)} />
                  </View>
                </View>
              </View>
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
  inner: { padding: 20, gap: 12 },

  section:       { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: Colors.primary },
  addBtn:        { backgroundColor: Colors.secondary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText:    { color: '#020000', fontSize: 13, fontWeight: '600' },

  card:       { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.borderLight, gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardIndex:  { fontSize: 12, fontWeight: '700', color: Colors.secondary },
  removeBtn:  { fontSize: 12, color: '#ef4444', fontWeight: '600' },

  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  row:   { flexDirection: 'row', gap: 10 },
  input: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text, backgroundColor: '#fafafa' },
  btn:     { backgroundColor: Colors.secondary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#020000', fontSize: 16, fontWeight: '800' },
});
