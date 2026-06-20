import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { Colors } from '../../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Intro'>;

export default function IntroScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Logo */}
      <View style={styles.logoSection}>
        <Text style={styles.logoIcon}>✂</Text>
        <Text style={styles.logoText}>BarberNearMe</Text>
        <Text style={styles.tagline}>Find · Book · Groom</Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsSection}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.btnPrimaryText}>Giriş Yap</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnGhost}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.btnGhostText}>Hesap Oluştur</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('BarberRegStep1')}>
          <Text style={styles.barberLink}>
            Berber misin? <Text style={styles.barberLinkBold}>İşletme kaydı →</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.headerStart,
    justifyContent: 'space-between',
  },
  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 72,
    color: Colors.secondary,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#888888',
    marginTop: 8,
  },
  buttonsSection: {
    padding: 24,
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#020000',
  },
  btnGhost: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnGhostText: {
    fontSize: 16,
    color: '#fff',
  },
  barberLink: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 14,
    paddingBottom: 8,
  },
  barberLinkBold: {
    color: Colors.secondary,
    fontWeight: '600',
  },
});
