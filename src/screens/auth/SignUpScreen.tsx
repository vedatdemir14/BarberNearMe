import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { registerCustomer } from '../../services/authService';
import { Colors } from '../../constants';
import PasswordInput from '../../components/PasswordInput';
import { friendlyError } from '../../utils/errorMessage';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  async function handleRegister() {
    if (!form.firstName || !form.email || !form.password) {
      Alert.alert('Hata', 'Zorunlu alanları doldurun.');
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
      await registerCustomer({ ...form });
      // Auto-navigates via useAuth
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Hesap Oluştur</Text>

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

          <View>
            <Text style={styles.label}>E-posta *</Text>
            <TextInput style={styles.input} placeholder="ornek@email.com" placeholderTextColor={Colors.textMuted}
              autoCapitalize="none" keyboardType="email-address"
              value={form.email} onChangeText={set('email')} />
          </View>

          <View>
            <Text style={styles.label}>Telefon</Text>
            <TextInput style={styles.input} placeholder="+90 5XX XXX XX XX" placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad" value={form.phone} onChangeText={set('phone')} />
          </View>

          <View>
            <Text style={styles.label}>Şifre *</Text>
            <PasswordInput style={styles.input} placeholder="••••••••" placeholderTextColor={Colors.textMuted}
              value={form.password} onChangeText={set('password')} />
          </View>

          <View>
            <Text style={styles.label}>Şifre Tekrar *</Text>
            <PasswordInput style={styles.input} placeholder="••••••••" placeholderTextColor={Colors.textMuted}
              value={form.confirmPassword} onChangeText={set('confirmPassword')} />
          </View>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnPrimaryText}>Hesap Oluştur</Text>
            }
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
  inner: { padding: 24, gap: 14 },
  backBtn: { marginBottom: 4 },
  backText: { fontSize: 15, color: Colors.primary },
  title: { fontSize: 24, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    padding: 12, fontSize: 15, color: Colors.text, backgroundColor: '#fafafa',
  },
  btnPrimary: {
    backgroundColor: Colors.secondary, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 4,
  },
  btnPrimaryText: { color: '#020000', fontSize: 16, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { fontSize: 13, color: Colors.textSecondary },
  link: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
});
