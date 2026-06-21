import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { login, sendPasswordReset } from '../../services/authService';
import { Colors } from '../../constants';
import PasswordInput from '../../components/PasswordInput';
import { friendlyError } from '../../utils/errorMessage';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert('E-posta Girin', 'Lütfen önce e-posta adresinizi yukarıya girin.');
      return;
    }
    try {
      await sendPasswordReset(email.trim());
      Alert.alert('Gönderildi ✓', 'Şifre sıfırlama linki e-posta adresinize gönderildi.');
    } catch (e: any) {
      Alert.alert('Hata', friendlyError(e));
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Hata', 'E-posta ve şifre gereklidir.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      // Navigation will auto-redirect via useAuth in Navigation component
    } catch (e: any) {
      Alert.alert('Giriş Hatası', friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoRow}>
            <Text style={styles.logoIcon}>✂</Text>
            <Text style={styles.logoText}>BarberNearMe</Text>
          </View>

          <Text style={styles.title}>Giriş Yap</Text>

          {/* Fields */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={styles.input}
              placeholder="ornek@email.com"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Şifre</Text>
            <PasswordInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 6 }} onPress={handleForgotPassword}>
              <Text style={styles.link}>Şifremi unuttum</Text>
            </TouchableOpacity>
          </View>

          {/* Login button */}
          <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnPrimaryText}>Giriş Yap</Text>
            }
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.btnOutline}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.btnOutlineText}>Hesap Oluştur</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('BarberRegStep1')}>
            <Text style={[styles.link, { textAlign: 'center', marginTop: 12 }]}>
              Berber misin? İşletme kaydı →
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  inner: { padding: 24, gap: 16 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 },
  logoIcon: { fontSize: 28 },
  logoText: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  title: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  fieldGroup: { gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    padding: 13, fontSize: 15, color: Colors.text, backgroundColor: '#fafafa',
  },
  btnPrimary: {
    backgroundColor: Colors.secondary, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center',
  },
  btnPrimaryText: { color: '#020000', fontSize: 16, fontWeight: '700' },
  orText: { textAlign: 'center', color: Colors.textMuted, fontSize: 13 },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingVertical: 11, alignItems: 'center',
  },
  socialBtnText: { fontSize: 14, color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border },
  btnOutline: {
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  btnOutlineText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  link: { color: Colors.primary, fontSize: 13 },
});
