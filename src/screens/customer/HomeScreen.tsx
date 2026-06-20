import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, FlatList, ActivityIndicator, Dimensions,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { getBarbers, BarberShop } from '../../services/barberService';
import { Colors } from '../../constants';

const { width: SCREEN_W } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerTabs'>;

const FILTERS = ['Tümü', 'Yakın', 'En İyi', 'Açık', 'Uygun Fiyat'];

const ISTANBUL_REGION: Region = {
  latitude: 41.0082, longitude: 28.9784,
  latitudeDelta: 0.12, longitudeDelta: 0.12,
};

// Extract lat/lng from a Firestore GeoPoint or plain object
function getLatLng(b: BarberShop): { lat: number; lng: number } | null {
  const loc = b.location as any;
  if (!loc) return null;
  const lat = loc.latitude ?? loc._lat;
  const lng = loc.longitude ?? loc._long;
  return lat != null && lng != null ? { lat, lng } : null;
}

// Squared distance to the map center — good enough for sorting "nearest"
function distToCenter(b: BarberShop): number {
  const c = getLatLng(b);
  if (!c) return Number.POSITIVE_INFINITY;
  const dLat = c.lat - ISTANBUL_REGION.latitude;
  const dLng = c.lng - ISTANBUL_REGION.longitude;
  return dLat * dLat + dLng * dLng;
}

function minPrice(b: BarberShop): number {
  return b.services?.length ? Math.min(...b.services.map(s => s.price)) : Number.POSITIVE_INFINITY;
}

// Is the shop open right now, based on working hours (days: 0=Mon … 6=Sun)
function isOpenNow(b: BarberShop): boolean {
  const wh = b.workingHours;
  if (!wh) return false;
  const now = new Date();
  const dayIdx = (now.getDay() + 6) % 7; // JS Sun=0 → Mon=0 based
  if (!wh.days?.includes(dayIdx)) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = wh.openTime.split(':').map(Number);
  const [ch, cm] = wh.closeTime.split(':').map(Number);
  return cur >= oh * 60 + om && cur < ch * 60 + cm;
}

// Fallback mock data for UI testing before Firebase is configured
const MOCK_BARBERS: BarberShop[] = [
  {
    id: 'barber_001', ownerId: 'a', shopName: "Sirat's Barber Shop", email: '', phone: '',
    address: 'Bağdat Cad. No:12', neighborhood: 'Kadıköy', city: 'İstanbul', country: 'TR',
    location: { latitude: 40.9905, longitude: 29.0467 } as any,
    photoURLs: [], services: [
      { id: 's1', name: 'Saç Kesimi', price: 500, durationMin: 30 },
      { id: 's2', name: 'Sakal Düzeltme', price: 350, durationMin: 20 },
    ],
    staff: [{ id: 'st1', name: 'Engyal T.', title: 'Kıdemli Berber' }],
    workingHours: { days: [0,1,2,3,4,5], openTime: '09:00', closeTime: '21:00', slotDurationMin: 30 },
    rating: 4.9, reviewCount: 128, isActive: true, createdAt: null,
  },
  {
    id: 'barber_003', ownerId: 'b', shopName: "Brian's Barber", email: '', phone: '',
    address: 'İstiklal Cad. No:45', neighborhood: 'Beyoğlu', city: 'İstanbul', country: 'TR',
    location: { latitude: 41.0328, longitude: 28.9772 } as any,
    photoURLs: [], services: [
      { id: 's3', name: 'Saç Kesimi', price: 350, durationMin: 30 },
    ],
    staff: [{ id: 'st2', name: 'Volkan B.', title: 'Berber' }],
    workingHours: { days: [0,1,2,3,4,5], openTime: '10:00', closeTime: '20:00', slotDurationMin: 30 },
    rating: 4.2, reviewCount: 84, isActive: true, createdAt: null,
  },
  {
    id: 'barber_002', ownerId: 'c', shopName: 'Classic Cut Studio', email: '', phone: '',
    address: 'Nişantaşı Mah. No:7', neighborhood: 'Şişli', city: 'İstanbul', country: 'TR',
    location: { latitude: 41.0490, longitude: 28.9948 } as any,
    photoURLs: [], services: [
      { id: 's4', name: 'Saç Kesimi', price: 300, durationMin: 30 },
      { id: 's5', name: 'Full Tıraş', price: 400, durationMin: 45 },
    ],
    staff: [{ id: 'st3', name: 'Mehmet K.', title: 'Usta Berber' }],
    workingHours: { days: [0,1,2,3,4,5,6], openTime: '08:00', closeTime: '19:00', slotDurationMin: 30 },
    rating: 4.7, reviewCount: 210, isActive: true, createdAt: null,
  },
  {
    id: 'barber_004', ownerId: 'd', shopName: 'Royal Erkek Kuaförü', email: '', phone: '',
    address: 'Bağlarbaşı Cad. No:22', neighborhood: 'Üsküdar', city: 'İstanbul', country: 'TR',
    location: { latitude: 41.0250, longitude: 29.0150 } as any,
    photoURLs: [], services: [
      { id: 's6', name: 'Saç Kesimi', price: 250, durationMin: 30 },
    ],
    staff: [{ id: 'st4', name: 'Hasan Y.', title: 'Usta Berber' }],
    workingHours: { days: [0,1,2,3,4,5,6], openTime: '07:30', closeTime: '21:00', slotDurationMin: 30 },
    rating: 4.5, reviewCount: 312, isActive: true, createdAt: null,
  },
  {
    id: 'barber_005', ownerId: 'e', shopName: 'Prestige Hair & Beard', email: '', phone: '',
    address: 'Bagdat Cad. No:89', neighborhood: 'Beşiktaş', city: 'İstanbul', country: 'TR',
    location: { latitude: 41.0422, longitude: 29.0093 } as any,
    photoURLs: [], services: [
      { id: 's7', name: 'Saç & Sakal Kombo', price: 1000, durationMin: 60 },
    ],
    staff: [{ id: 'st5', name: 'Alper M.', title: 'Baş Stilist' }],
    workingHours: { days: [0,1,2,3,4,5], openTime: '10:00', closeTime: '22:00', slotDurationMin: 30 },
    rating: 4.8, reviewCount: 176, isActive: true, createdAt: null,
  },
];

export default function HomeScreen({ navigation }: Props) {
  const [barbers, setBarbers]         = useState<BarberShop[]>(MOCK_BARBERS);
  const [search, setSearch]           = useState('');
  const [activeFilter, setFilter]     = useState('Tümü');
  const [loading, setLoading]         = useState(false);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [showMap, setShowMap]         = useState(true);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    setLoading(true);
    getBarbers()
      .then(data => { if (data.length) setBarbers(data); })
      .catch(() => { /* use mock */ })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = barbers.filter(b =>
      b.shopName.toLowerCase().includes(q) ||
      (b.neighborhood ?? '').toLowerCase().includes(q)
    );

    switch (activeFilter) {
      case 'Yakın':
        list = [...list].sort((a, b) => distToCenter(a) - distToCenter(b));
        break;
      case 'En İyi':
        list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'Açık':
        list = list.filter(isOpenNow);
        break;
      case 'Uygun Fiyat':
        list = [...list].sort((a, b) => minPrice(a) - minPrice(b));
        break;
      // 'Tümü' → no extra filtering/sorting
    }
    return list;
  }, [barbers, search, activeFilter]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Merhaba 👋</Text>
          <Text style={styles.title}>Berber Bul</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Messaging', { barberId: '', barberName: '' })}>
          <Text style={styles.msgIcon}>💬</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Berber veya konum ara..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, activeFilter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Map / List toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, showMap && styles.toggleActive]}
          onPress={() => setShowMap(true)}
        >
          <Text style={[styles.toggleText, showMap && styles.toggleTextActive]}>🗺 Harita</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, !showMap && styles.toggleActive]}
          onPress={() => setShowMap(false)}
        >
          <Text style={[styles.toggleText, !showMap && styles.toggleTextActive]}>☰ Liste</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      {showMap && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={ISTANBUL_REGION}
          >
            {filtered.map(b => {
              const loc = b.location as any;
              if (!loc) return null;
              const lat = loc.latitude  ?? loc._lat;
              const lng = loc.longitude ?? loc._long;
              if (!lat || !lng) return null;
              return (
                <Marker
                  key={b.id}
                  coordinate={{ latitude: lat, longitude: lng }}
                  title={b.shopName}
                  description={`⭐ ${b.rating} · ${b.neighborhood}`}
                  pinColor={selectedId === b.id ? '#1a3c5e' : Colors.primary}
                  onPress={() => setSelectedId(b.id)}
                  onCalloutPress={() => navigation.navigate('BarberDetail', { barberId: b.id })}
                />
              );
            })}
          </MapView>
          <View style={styles.mapBadge}>
            <Text style={styles.mapBadgeText}>{filtered.length} berber</Text>
          </View>
        </View>
      )}

      {/* List title */}
      <Text style={styles.listTitle}>Yakınındaki Berberler</Text>

      {/* Barber list */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, selectedId === item.id && styles.cardSelected]}
              onPress={() => {
                setSelectedId(item.id);
                const loc = item.location as any;
                if (loc && showMap && mapRef.current) {
                  const lat = loc.latitude ?? loc._lat;
                  const lng = loc.longitude ?? loc._long;
                  if (lat && lng) {
                    mapRef.current.animateToRegion(
                      { latitude: lat, longitude: lng, latitudeDelta: 0.02, longitudeDelta: 0.02 },
                      500
                    );
                  }
                }
                navigation.navigate('BarberDetail', { barberId: item.id });
              }}
            >
              <View style={styles.avatar}><Text style={{ fontSize: 24 }}>💈</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shopName}>{item.shopName}</Text>
                <Text style={styles.shopMeta}>📍 {item.neighborhood} · {item.workingHours.openTime}–{item.workingHours.closeTime}</Text>
                <Text style={styles.rating}>⭐ {item.rating.toFixed(1)} <Text style={{ color: Colors.textMuted }}>({item.reviewCount} yorum)</Text></Text>
                <Text style={styles.price}>₺{Math.min(...item.services.map(s => s.price))}'den başlıyor</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: Colors.textMuted, marginTop: 20 }}>
              Sonuç bulunamadı.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  greeting: { fontSize: 13, color: Colors.textSecondary },
  title: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  msgIcon: { fontSize: 24 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 16, marginTop: 4, backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 14,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: Colors.text },
  filterScroll: { paddingLeft: 16, marginBottom: 12, flexGrow: 0 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
    marginRight: 8,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  toggleRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 10,
    backgroundColor: Colors.surface, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  toggleActive: { backgroundColor: Colors.primary },
  toggleText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  toggleTextActive: { color: '#fff' },
  mapContainer: {
    marginHorizontal: 16, height: 200, borderRadius: 14,
    overflow: 'hidden', marginBottom: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  map: { flex: 1 },
  mapBadge: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  mapBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardSelected: { borderColor: Colors.primary, borderWidth: 1.5 },
  listTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary, paddingHorizontal: 16, paddingVertical: 10 },
  card: {
    flexDirection: 'row', gap: 12, padding: 14,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 12, backgroundColor: '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  shopName: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  shopMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  rating: { fontSize: 12, color: Colors.warning, marginTop: 4 },
  price: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginTop: 2 },
});
