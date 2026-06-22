import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { Colors } from '../../constants';
import BackButton from '../../components/BackButton';
import { registerBarber } from '../../services/authService';
import PasswordInput from '../../components/PasswordInput';
import { friendlyError } from '../../utils/errorMessage';

type Props = NativeStackScreenProps<RootStackParamList, 'BarberRegStep1'>;

export default function BarberRegStep1Screen({ navigation }: Props) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', shopName: '',
    email: '', phone: '', password: '', confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  async function handleRegister() {
    if (!form.firstName || !form.shopName || !form.email || !form.password) {
      Alert.alert('Eksik Alan', 'Zorunlu alanları (*) doldurun.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }
    setLoading(true);
    try {
      await registerBarber({
        firstName: form.firstName,
        lastName:  form.lastName,
        shopName:  form.shopName,
        email:     form.email,
        phone:     form.phone,
        password:  form.password,
      });
      // Auth listener tetiklenince otomatik BarberTabs'e geçer,
      // dashboard orada isActive=false görüp kurulumu yönlendirir.
    } catch (e: any) {
      Alert.alert('Kayıt Hatası', friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

          <BackButton onPress={() => navigation.goBack()} label="Geri" color={Colors.secondary} size={18} style={styles.backBtn} />

          {/* Progress */}
          <View style={styles.progress}>
            {[1, 2, 3, 4].map(n => (
              <View key={n} style={[styles.dot, n === 1 && styles.dotActive]}>
                <Text style={[styles.dotText, n === 1 && styles.dotTextActive]}>{n}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.title}>Dükkan Hesabı Oluştur</Text>
          <Text style={styles.sub}>Temel bilgilerini gir, kurulumun geri kalanını içerde tamamlarsın.</Text>

          <Text style={styles.label}>Dükkan Adı *</Text>
          <TextInput style={styles.input} placeholder="Ahmet Berber" placeholderTextColor={Colors.textMuted}
            value={form.shopName} onChangeText={set('shopName')} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Ad *</Text>
              <TextInput style={styles.input} placeholder="Ahmet" placeholderTextColor={Colors.textMuted}
                value={form.firstName} onChangeText={set('firstName')} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Soyad</Text>
              <TextInput style={styles.input} placeholder="Yılmaz" placeholderTextColor={Colors.textMuted}
                value={form.lastName} onChangeText={set('lastName')} />
            </View>
          </View>

          <Text style={styles.label}>E-posta *</Text>
          <TextInput style={styles.input} placeholder="berber@email.com" placeholderTextColor={Colors.textMuted}
            autoCapitalize="none" keyboardType="email-address"
            value={form.email} onChangeText={set('email')} />

          <Text style={styles.label}>Telefon</Text>
          <TextInput style={styles.input} placeholder="+90 5XX XXX XX XX" placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad" value={form.phone} onChangeText={set('phone')} />

          <Text style={styles.label}>Şifre *</Text>
          <PasswordInput style={styles.input} placeholder="••••••••" placeholderTextColor={Colors.textMuted}
            value={form.password} onChangeText={set('password')} />

          <Text style={styles.label}>Şifre Tekrar *</Text>
          <PasswordInput style={styles.input} placeholder="••••••••" placeholderTextColor={Colors.textMuted}
            value={form.confirmPassword} onChangeText={set('confirmPassword')} />

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#020000" /> : <Text style={styles.btnText}>Hesap Oluştur →</Text>}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Zaten hesabın var mı?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}> Giriş Yap</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  inner:     { padding: 24, gap: 10 },
  backBtn:   { marginBottom: 4 },
  backText:  { fontSize: 15, color: Colors.secondary },

  progress:     { flexDirection: 'row', gap: 8, marginBottom: 8 },
  dot:          { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  dotActive:    { backgroundColor: Colors.secondary },
  dotText:      { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  dotTextActive:{ color: '#020000' },

  title: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  sub:   { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginTop: 4 },
  row:   { flexDirection: 'row', gap: 12 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, backgroundColor: '#fafafa',
  },
  btn:     { backgroundColor: Colors.secondary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#020000', fontSize: 16, fontWeight: '700' },
  loginRow:{ flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  loginText:{ fontSize: 13, color: Colors.textSecondary },
  link:    { fontSize: 13, color: Colors.secondary, fontWeight: '600' },
});
