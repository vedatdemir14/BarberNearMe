import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Switch, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants';
import { friendlyError } from '../../utils/errorMessage';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../services/authService';
import { getBarber, BarberShop } from '../../services/barberService';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function BarberProfileScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const [shop, setShop]         = useState<BarberShop | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const s = await getBarber(user.uid);
      setShop(s);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function handleToggleOpen(val: boolean) {
    if (!user || toggling) return;
    setToggling(true);
    try {
      await updateDoc(doc(db, 'barbers', user.uid), { isActive: val });
      setShop(prev => prev ? { ...prev, isActive: val } : prev);
    } catch (e: any) {
      Alert.alert('Hata', friendlyError(e));
    } finally { setToggling(false); }
  }

  async function handleLogout() {
    Alert.alert('Çıkış', 'Çıkış yapmak istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => logout() },
    ]);
  }

  const fullName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : '';
  const wh = shop?.workingHours;
  const openDaysStr = wh?.days.map(d => DAYS_TR[d]).join(', ') ?? '—';

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Ionicons name="storefront" size={34} color="#020000" />
          </View>
          <Text style={styles.shopName}>{shop?.shopName ?? 'Dükkanım'}</Text>
          <Text style={styles.ownerName}>{fullName}</Text>
          <Text style={styles.location}>
            {[shop?.city, shop?.address].filter(Boolean).join(' · ') || '—'}
          </Text>
          {/* Rating */}
          <View style={styles.ratingRow}>
            <Text style={styles.ratingVal}>★ {shop?.rating?.toFixed(1) ?? '—'}</Text>
            <Text style={styles.ratingCount}>({shop?.reviewCount ?? 0} değerlendirme)</Text>
          </View>
        </View>

        {/* Açık / Kapalı toggle — prototype'taki toggle-row */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleLeft}>
            <View style={[styles.toggleDot, { backgroundColor: shop?.isActive ? '#22c55e' : Colors.border }]} />
            <View>
              <Text style={styles.toggleTitle}>
                {shop?.isActive ? 'Dükkan Açık' : 'Dükkan Kapalı'}
              </Text>
              <Text style={styles.toggleSub}>
                {shop?.isActive ? 'Müşteriler randevu alabilir' : 'Yeni randevular duraklatıldı'}
              </Text>
            </View>
          </View>
          <Switch
            value={shop?.isActive ?? false}
            onValueChange={handleToggleOpen}
            disabled={toggling}
            trackColor={{ false: Colors.border, true: '#22c55e' }}
            thumbColor="#fff"
          />
        </View>

        {/* İstatistik kartları */}
        <View style={styles.statsRow}>
          {[
            { label: 'Hizmet', value: shop?.services?.length ?? 0 },
            { label: 'Çalışan', value: shop?.staff?.length ?? 0 },
            { label: 'Puan', value: shop?.rating?.toFixed(1) ?? '—' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Çalışma bilgisi */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Çalışma Saatleri</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Günler</Text>
            <Text style={styles.infoVal}>{openDaysStr}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Saatler</Text>
            <Text style={styles.infoVal}>
              {wh ? `${wh.openTime} – ${wh.closeTime}` : '—'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Randevu aralığı</Text>
            <Text style={styles.infoVal}>{wh ? `${wh.slotDurationMin} dk` : '—'}</Text>
          </View>
        </View>

        {/* Yönetim menüsü */}
        <Text style={styles.menuSectionTitle}>Yönetim</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={[styles.menuItem, styles.menuBorder]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('BarberWallet')}
          >
            <View style={styles.iconChip}><Ionicons name="wallet-outline" size={19} color={Colors.primary} /></View>
            <Text style={styles.menuLabel}>Hesap Hareketleri</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuBorder]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('BarberEditServices', { uid: user!.uid })}
          >
            <View style={styles.iconChip}><Ionicons name="cut-outline" size={19} color={Colors.primary} /></View>
            <Text style={styles.menuLabel}>Hizmetleri & Çalışanları Düzenle</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuBorder]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('BarberEditHours', { uid: user!.uid })}
          >
            <View style={styles.iconChip}><Ionicons name="time-outline" size={19} color={Colors.primary} /></View>
            <Text style={styles.menuLabel}>Çalışma Saatlerini Düzenle</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuBorder]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('BarberReviews')}
          >
            <View style={styles.iconChip}><Ionicons name="star-outline" size={19} color={Colors.primary} /></View>
            <Text style={styles.menuLabel}>Müşteri Değerlendirmeleri</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuBorder]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Notifications')}
          >
            <View style={styles.iconChip}><Ionicons name="notifications-outline" size={19} color={Colors.primary} /></View>
            <Text style={styles.menuLabel}>Bildirimler</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={styles.iconChip}><Ionicons name="settings-outline" size={19} color={Colors.primary} /></View>
            <Text style={styles.menuLabel}>Ayarlar</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Çıkış */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={19} color={Colors.danger} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center', padding: 24,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 4,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.secondary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  shopName:   { fontSize: 20, fontWeight: '800', color: Colors.primary },
  ownerName:  { fontSize: 13, color: Colors.textSecondary },
  location:   { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  ratingRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  ratingVal:  { fontSize: 14, fontWeight: '700', color: Colors.primary },
  ratingCount:{ fontSize: 12, color: Colors.textMuted },

  toggleCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, margin: 16, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: Colors.borderLight,
  },
  toggleLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleDot:   { width: 10, height: 10, borderRadius: 5 },
  toggleTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  toggleSub:   { fontSize: 11, color: Colors.textMuted, marginTop: 1 },

  statsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight, gap: 3,
  },
  statVal:   { fontSize: 20, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textSecondary },

  infoCard: {
    backgroundColor: Colors.surface, marginHorizontal: 16, marginBottom: 12,
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.borderLight, gap: 2,
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 8 },
  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  infoLabel: { fontSize: 13, color: Colors.textSecondary },
  infoVal:   { fontSize: 13, fontWeight: '600', color: Colors.primary, flex: 1, textAlign: 'right' },

  menuSectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginHorizontal: 20, marginTop: 6, marginBottom: 8 },
  menuCard: { backgroundColor: Colors.surface, marginHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.borderLight, overflow: 'hidden' },
  menuItem:  { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 15 },
  menuBorder:{ borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  iconChip:  { width: 38, height: 38, borderRadius: 11, backgroundColor: '#FFF7DE', alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.primary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 16, paddingVertical: 15, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.danger },
  logoutText:{ fontSize: 15, fontWeight: '700', color: Colors.danger },
});
