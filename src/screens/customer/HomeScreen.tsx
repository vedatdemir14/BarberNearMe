import RangeSlider from '../../components/RangeSlider';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, FlatList, ActivityIndicator, Dimensions, Modal, Switch,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { getBarbers, BarberShop } from '../../services/barberService';
import { Colors } from '../../constants';

const { width: SCREEN_W } = Dimensions.get('window');

// Tab ekranı; root stack'e de yönlendirdiği için esnek navigation tipi
type Props = { navigation: any };

const SORT_OPTIONS = ['Puana Göre', 'Yakın', 'Uygun Fiyat'];
const SERVICE_KEYWORDS = ['Saç', 'Sakal', 'Çocuk', 'Cilt'];
const MAX_RADIUS = 50; // km — "Tümü" (mesafe filtresi yok)

// İki coğrafi nokta arası mesafe (km) — Haversine
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Urla / Gülbahçe (İYTE çevresi) — berberlerin bulunduğu bölge
const DEFAULT_REGION: Region = {
  latitude: 38.330, longitude: 26.705,
  latitudeDelta: 0.10, longitudeDelta: 0.16,
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
  const dLat = c.lat - DEFAULT_REGION.latitude;
  const dLng = c.lng - DEFAULT_REGION.longitude;
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
  const [barbers, setBarbers]         = useState<BarberShop[]>([]);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [showMap, setShowMap]         = useState(true);
  const [userLoc, setUserLoc]         = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<MapView>(null);

  // ── Filtre/tercih durumları (Tercihler panelinde) ──
  const [showFilters, setShowFilters]     = useState(false);
  const [sortBy, setSortBy]               = useState('Puana Göre');
  const [serviceFilters, setServiceFilters] = useState<string[]>([]);
  const [openOnly, setOpenOnly]           = useState(false);
  const [radiusKm, setRadiusKm]           = useState<number>(MAX_RADIUS); // MAX = Tümü (uygulanan değer)
  const [dragKm, setDragKm]               = useState<number>(MAX_RADIUS); // slider sürüklenirken canlı etiket

  const activeFilterCount =
    (sortBy !== 'Puana Göre' ? 1 : 0) +
    serviceFilters.length +
    (openOnly ? 1 : 0) +
    (radiusKm < MAX_RADIUS ? 1 : 0);

  function toggleService(kw: string) {
    setServiceFilters(prev => prev.includes(kw) ? prev.filter(x => x !== kw) : [...prev, kw]);
  }
  function resetFilters() {
    setSortBy('Puana Göre'); setServiceFilters([]); setOpenOnly(false); setRadiusKm(MAX_RADIUS); setDragKm(MAX_RADIUS);
  }

  useEffect(() => {
    getBarbers()
      .then(data => setBarbers(data.length ? data : MOCK_BARBERS))
      .catch(() => setBarbers(MOCK_BARBERS)) // sadece Firestore'a ulaşılamazsa
      .finally(() => setLoading(false));
  }, []);

  // Kullanıcının gerçek konumunu al (izin verirse) → harita + mesafe için
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        // Önce son bilinen konum (anında); yoksa/taze gerekirse güncel konumu dene.
        let pos = await Location.getLastKnownPositionAsync();
        if (!pos) {
          pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null);
        }
        if (!pos) return;
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        mapRef.current?.animateToRegion(
          { latitude: loc.lat, longitude: loc.lng, latitudeDelta: 0.08, longitudeDelta: 0.08 }, 600
        );
      } catch { /* konum alınamadı → varsayılan bölge kalır */ }
    })();
  }, []);

  // Bir berberin kullanıcıya uzaklığı (km) — konum yoksa null
  const distanceKm = (b: BarberShop): number | null => {
    if (!userLoc) return null;
    const c = getLatLng(b);
    return c ? haversineKm(userLoc.lat, userLoc.lng, c.lat, c.lng) : null;
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    // "Yakın" ve yarıçap için uzaklık: konum varsa gerçek km, yoksa merkez yaklaşığı
    const distOf = (b: BarberShop) => {
      const c = getLatLng(b);
      if (!c) return Number.POSITIVE_INFINITY;
      return userLoc ? haversineKm(userLoc.lat, userLoc.lng, c.lat, c.lng) : distToCenter(b);
    };

    let list = barbers.filter(b =>
      b.shopName.toLowerCase().includes(q) ||
      (b.neighborhood ?? '').toLowerCase().includes(q)
    );

    // Hizmet türü filtresi (seçilen tüm türleri sunan berberler)
    if (serviceFilters.length) {
      list = list.filter(b =>
        serviceFilters.every(kw =>
          (b.services ?? []).some(s => s.name.toLowerCase().includes(kw.toLowerCase()))
        )
      );
    }

    // Sadece şu an açık olanlar
    if (openOnly) list = list.filter(isOpenNow);

    // Mesafe yarıçapı filtresi (konum varsa ve slider sonda değilse)
    if (userLoc && radiusKm < MAX_RADIUS) {
      list = list.filter(b => {
        const c = getLatLng(b);
        return c != null && haversineKm(userLoc.lat, userLoc.lng, c.lat, c.lng) <= radiusKm;
      });
    }

    switch (sortBy) {
      case 'Yakın':
        list = [...list].sort((a, b) => distOf(a) - distOf(b));
        break;
      case 'Uygun Fiyat':
        list = [...list].sort((a, b) => minPrice(a) - minPrice(b));
        break;
      default:
        // Önerilen = en yüksek puanlılar önce
        list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return list;
  }, [barbers, search, sortBy, serviceFilters, openOnly, radiusKm, userLoc]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Merhaba</Text>
          <Text style={styles.title}>Berber Bul</Text>
        </View>
        <TouchableOpacity style={styles.prefBtn} onPress={() => setShowFilters(true)}>
          <Ionicons name="options-outline" size={20} color={Colors.primary} />
          <Text style={styles.prefBtnText}>Filtrele</Text>
          {activeFilterCount > 0 && (
            <View style={styles.prefBadge}><Text style={styles.prefBadgeText}>{activeFilterCount}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Berber veya konum ara..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Aktif filtre özeti (varsa) */}
      {activeFilterCount > 0 && (
        <View style={styles.activeRow}>
          <Text style={styles.activeText} numberOfLines={1}>
            {[
              sortBy !== 'Puana Göre' ? sortBy : null,
              ...serviceFilters,
              openOnly ? 'Açık' : null,
              radiusKm < MAX_RADIUS ? `${radiusKm} km` : null,
            ].filter(Boolean).join(' · ')}
          </Text>
          <TouchableOpacity onPress={resetFilters}><Text style={styles.activeClear}>Temizle</Text></TouchableOpacity>
        </View>
      )}

      {/* Map / List toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, showMap && styles.toggleActive]}
          onPress={() => setShowMap(true)}
        >
          <Text style={[styles.toggleText, showMap && styles.toggleTextActive]}>Harita</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, !showMap && styles.toggleActive]}
          onPress={() => setShowMap(false)}
        >
          <Text style={[styles.toggleText, !showMap && styles.toggleTextActive]}>Liste</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      {showMap && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={DEFAULT_REGION}
            showsUserLocation={!!userLoc}
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
                  description={`${b.rating} · ${b.neighborhood}`}
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
              <View style={styles.avatar}><Text style={{ fontSize: 20, color: Colors.primary }}>✂</Text></View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.shopName}>{item.shopName}</Text>
                  {(() => {
                    const open = isOpenNow(item);
                    return (
                      <View style={[styles.statusPill, { backgroundColor: open ? 'rgba(34,197,94,0.15)' : 'rgba(248,113,113,0.15)' }]}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: open ? '#16a34a' : '#dc2626' }}>
                          {open ? '● Açık' : '● Kapalı'}
                        </Text>
                      </View>
                    );
                  })()}
                </View>
                <Text style={styles.shopMeta}>{item.neighborhood} · {item.workingHours.openTime}–{item.workingHours.closeTime}</Text>
                {(() => {
                  const km = distanceKm(item);
                  return km != null ? <Text style={styles.distance}>{km.toFixed(1)} km uzakta</Text> : null;
                })()}
                <Text style={styles.rating}>★ {item.rating.toFixed(1)} <Text style={{ color: Colors.textMuted }}>({item.reviewCount} yorum)</Text></Text>
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

      {/* ── Tercihler / Filtreler paneli ── */}
      <Modal visible={showFilters} animationType="slide" transparent onRequestClose={() => setShowFilters(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowFilters(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Filtreler</Text>

            <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
              {/* Sıralama */}
              <Text style={styles.modalSection}>Sıralama</Text>
              <View style={styles.chipWrap}>
                {SORT_OPTIONS.map(o => (
                  <TouchableOpacity key={o} style={[styles.chip, sortBy === o && styles.chipActive]} onPress={() => setSortBy(o)}>
                    <Text style={[styles.chipText, sortBy === o && styles.chipTextActive]}>{o}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Hizmet türü */}
              <Text style={styles.modalSection}>Hizmet türü</Text>
              <View style={styles.chipWrap}>
                {SERVICE_KEYWORDS.map(kw => {
                  const on = serviceFilters.includes(kw);
                  return (
                    <TouchableOpacity key={kw} style={[styles.chip, on && styles.chipActive]} onPress={() => toggleService(kw)}>
                      <Text style={[styles.chipText, on && styles.chipTextActive]}>{kw}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Açık */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Sadece şu an açık olanlar</Text>
                <Switch value={openOnly} onValueChange={setOpenOnly}
                  trackColor={{ false: '#D1D5DB', true: Colors.secondary }}
                  thumbColor="#ffffff" ios_backgroundColor="#D1D5DB" />
              </View>

            </ScrollView>

            {/* Mesafe — slider (parmakla kaydır, bıraktığın yer uygulanır) */}
            <View style={{ marginTop: 8 }}>
              <Text style={styles.modalSection}>
                Mesafe: {dragKm >= MAX_RADIUS ? 'Tümü' : `${dragKm} km içinde`}
              </Text>
              <RangeSlider
                min={1}
                max={MAX_RADIUS}
                step={1}
                value={radiusKm}
                onChange={setDragKm}
                onComplete={setRadiusKm}
              />
              <View style={styles.radiusScale}>
                <Text style={styles.radiusScaleText}>1 km</Text>
                <Text style={styles.radiusScaleText}>50 km</Text>
              </View>
              {radiusKm < MAX_RADIUS && !userLoc && (
                <Text style={styles.radiusHint}>Konum alınamadı — mesafe filtresi için konum iznine izin ver.</Text>
              )}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalReset} onPress={resetFilters}>
                <Text style={styles.modalResetText}>Temizle</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalApply} onPress={() => setShowFilters(false)}>
                <Text style={styles.modalApplyText}>{filtered.length} berber göster</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  greeting: { fontSize: 13, color: Colors.textSecondary },
  title: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  msgIcon: { fontSize: 24 },
  prefBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 42, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  prefBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  prefBadge: { position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  prefBadgeText: { color: '#020000', fontSize: 11, fontWeight: '800' },
  activeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  activeText: { flex: 1, fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  activeClear: { fontSize: 12, color: Colors.danger, fontWeight: '700' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingTop: 10, maxHeight: '80%' },
  modalHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginBottom: 8 },
  modalSection: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginTop: 14, marginBottom: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  switchLabel: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 14 },
  modalReset: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalResetText: { fontSize: 15, color: Colors.primary, fontWeight: '700' },
  modalApply: { flex: 2, backgroundColor: Colors.secondary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalApplyText: { fontSize: 15, color: '#020000', fontWeight: '700' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 16, marginTop: 4, backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 14,
  },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: Colors.text },
  filterScroll: { paddingLeft: 16, marginBottom: 12, flexGrow: 0 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
    marginRight: 8,
  },
  chipActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  chipText: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  chipTextActive: { color: '#020000', fontWeight: '700' },
  radiusBox: { paddingHorizontal: 16, marginBottom: 4 },
  radiusLabel: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  radiusHint: { fontSize: 11, color: Colors.danger, paddingHorizontal: 16, marginBottom: 8 },
  radiusScale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -10, paddingHorizontal: 2 },
  radiusScaleText: { fontSize: 11, color: Colors.textMuted },
  distance: { fontSize: 12, color: Colors.accent, fontWeight: '700', marginTop: 3 },
  toggleRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 10,
    backgroundColor: Colors.surface, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  toggleActive: { backgroundColor: Colors.secondary },
  toggleText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  toggleTextActive: { color: '#020000' },
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
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  statusPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  shopName: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  shopMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  rating: { fontSize: 12, color: Colors.warning, marginTop: 4 },
  price: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginTop: 2 },
});
