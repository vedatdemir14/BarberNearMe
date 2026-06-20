import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Colors } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { resendVerificationEmail, logout } from '../../services/authService';

export default function EmailVerificationScreen() {
  const { user, refreshUser } = useAuth();
  const [checking,  setChecking]  = useState(false);
  const [resending, setResending] = useState(false);

  async function handleCheck() {
    setChecking(true);
    try {
      await refreshUser();
      // refreshUser sonrası auth.currentUser'a bak (state henüz re-render olmadı)
      const { auth } = await import('../../services/firebase');
      if (!auth.currentUser?.emailVerified) {
        Alert.alert('Henüz Doğrulanmadı', 'E-postanızdaki linke tıkladıktan sonra tekrar deneyin.');
      }
      // emailVerified=true ise Context state güncellendi, Navigation otomatik geçer
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setChecking(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await resendVerificationEmail();
      Alert.alert('Gönderildi', 'Doğrulama e-postası tekrar gönderildi.');
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.icon}>✉️</Text>
        <Text style={styles.title}>E-postanı Doğrula</Text>
        <Text style={styles.sub}>
          <Text style={{ fontWeight: '700' }}>{user?.email}</Text>
          {' '}adresine doğrulama linki gönderdik.{'\n'}
          Linke tıkladıktan sonra aşağıdaki butona bas.
        </Text>

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleCheck}
          disabled={checking}
        >
          {checking
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnPrimaryText}>Doğruladım ✓</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnOutline}
          onPress={handleResend}
          disabled={resending}
        >
          {resending
            ? <ActivityIndicator color={Colors.primary} />
            : <Text style={styles.btnOutlineText}>Tekrar Gönder</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={logout} style={{ marginTop: 8 }}>
          <Text style={styles.logoutLink}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  inner: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 16,
  },
  icon:  { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.primary, textAlign: 'center' },
  sub:   { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  btnPrimary: {
    width: '100%', backgroundColor: Colors.primary,
    borderRadius: 12, paddingVertical: 15, alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnOutline: {
    width: '100%', borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  btnOutlineText: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  logoutLink: { fontSize: 13, color: Colors.textMuted },
});
