import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { CameraCapture } from '../components/CameraCapture';
import { CategoryPicker } from '../components/CategoryPicker';
import { MockRewardedAd } from '../components/MockRewardedAd';
import { WalletPill } from '../components/WalletPill';
import { REPORT_CATEGORIES, type ReportCategory } from '../config/economy';
import { useWallet } from '../hooks/useWallet';
import {
  claimReportReward,
  fetchNearbyReports,
  submitReport,
  type CapturedFix,
  type CapturedPhoto,
  type PublicReport,
} from '../services/reports';

/** Doit rester aligné avec functions/src/config.ts (le serveur reste l'arbitre). */
const CLIENT_COOLDOWN_MS = 120_000;

/** Machine à états du parcours de signalement. */
type Flow =
  | { step: 'map' }
  | { step: 'camera' }
  | { step: 'category'; photo: CapturedPhoto; fix: CapturedFix; submitting: boolean }
  | { step: 'ad'; reportId: string; adBonusPoints: number };

const CATEGORY_EMOJI = Object.fromEntries(REPORT_CATEGORIES.map((c) => [c.id, c.emoji])) as Record<ReportCategory, string>;

export function MapScreen({ uid }: { uid: string }) {
  const mapRef = useRef<MapView>(null);
  const wallet = useWallet(uid);

  const [locPermission, setLocPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [position, setPosition] = useState<Location.LocationObjectCoords | null>(null);
  const [nearby, setNearby] = useState<PublicReport[]>([]);
  const [flow, setFlow] = useState<Flow>({ step: 'map' });
  const [toast, setToast] = useState<string | null>(null);
  const lastReportAt = useRef(0);
  const hasCentered = useRef(false);

  // ---------- Géolocalisation : permission + suivi continu (style Waze/Zenly) ----------
  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        setLocPermission('denied');
        return;
      }
      setLocPermission('granted');
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
        (loc) => setPosition(loc.coords),
      );
      if (cancelled) sub.remove();
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  const loadNearby = useCallback(async (lat: number, lng: number) => {
    try {
      setNearby(await fetchNearbyReports(lat, lng));
    } catch {
      // Non bloquant : la carte reste utilisable sans les marqueurs.
    }
  }, []);

  // Premier fix GPS : on centre la carte et on charge les signalements autour.
  useEffect(() => {
    if (!position || hasCentered.current) return;
    hasCentered.current = true;
    mapRef.current?.animateCamera({ center: position, zoom: 16 }, { duration: 600 });
    loadNearby(position.latitude, position.longitude);
  }, [position, loadNearby]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // ---------- Parcours de signalement ----------
  const startReport = () => {
    const waitMs = lastReportAt.current + CLIENT_COOLDOWN_MS - Date.now();
    if (waitMs > 0) {
      // Pré-contrôle UX uniquement (évite un upload inutile) ; le vrai contrôle est côté serveur.
      Alert.alert('Doucement 🙂', `Prochain signalement possible dans ${Math.ceil(waitMs / 1000)} s.`);
      return;
    }
    setFlow({ step: 'camera' });
  };

  const onCaptured = (photo: CapturedPhoto, fix: CapturedFix) =>
    setFlow({ step: 'category', photo, fix, submitting: false });

  const onSubmitCategory = async (category: ReportCategory) => {
    if (flow.step !== 'category') return;
    const { photo, fix } = flow;
    setFlow({ ...flow, submitting: true });
    try {
      const res = await submitReport(photo, fix, category);
      lastReportAt.current = Date.now();
      if (res.status === 'duplicate') {
        setFlow({ step: 'map' });
        Alert.alert('Déjà signalé 👍', res.message ?? 'Quelqu’un a déjà signalé ce problème ici. Merci quand même !');
        return;
      }
      setFlow({ step: 'ad', reportId: res.reportId, adBonusPoints: res.adBonusPoints });
    } catch (e) {
      // Les HttpsError du serveur portent un message lisible (cooldown, GPS imprécis, etc.)
      setFlow({ step: 'map' });
      Alert.alert('Signalement refusé', e instanceof Error ? e.message : 'Erreur inconnue');
    }
  };

  const finishWithReward = async (reportId: string, adWatched: boolean) => {
    setFlow({ step: 'map' });
    try {
      const { pointsCredited } = await claimReportReward(reportId, adWatched);
      showToast(`+${pointsCredited.toLocaleString('fr-FR')} pts 🎉`);
      if (position) loadNearby(position.latitude, position.longitude);
    } catch (e) {
      Alert.alert('Oups', e instanceof Error ? e.message : 'Impossible de créditer les points');
    }
  };

  // ---------- Rendu ----------
  if (locPermission === 'denied') {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>
          La localisation est nécessaire pour situer les signalements. Active-la dans les réglages.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        initialRegion={{ latitude: 48.8566, longitude: 2.3522, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
      >
        {nearby.map((r) => (
          <Marker key={r.id} coordinate={{ latitude: r.lat, longitude: r.lng }} tracksViewChanges={false}>
            <View style={styles.marker}>
              <Text style={{ fontSize: 18 }}>{CATEGORY_EMOJI[r.category] ?? '📍'}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Solde en haut */}
      <View style={styles.top} pointerEvents="box-none">
        <WalletPill points={wallet.points} />
      </View>

      {/* Recentrer */}
      {position && (
        <Pressable
          style={styles.recenter}
          onPress={() => mapRef.current?.animateCamera({ center: position, zoom: 16 }, { duration: 400 })}
        >
          <Text style={{ fontSize: 20 }}>🎯</Text>
        </Pressable>
      )}

      {/* Gros bouton Signaler */}
      <View style={styles.bottom} pointerEvents="box-none">
        <Pressable
          onPress={startReport}
          disabled={!position}
          style={({ pressed }) => [styles.reportBtn, !position && { opacity: 0.6 }, pressed && { transform: [{ scale: 0.95 }] }]}
        >
          {position ? <Text style={styles.reportText}>📸 SIGNALER</Text> : <ActivityIndicator color="#111" />}
        </Pressable>
        {!position && <Text style={styles.waiting}>Recherche du GPS…</Text>}
      </View>

      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Overlays du parcours */}
      {flow.step === 'camera' && <CameraCapture onCaptured={onCaptured} onCancel={() => setFlow({ step: 'map' })} />}

      {flow.step === 'category' && (
        <CategoryPicker
          photoUri={flow.photo.uri}
          submitting={flow.submitting}
          onRetake={() => setFlow({ step: 'camera' })}
          onSubmit={onSubmitCategory}
        />
      )}

      <MockRewardedAd
        visible={flow.step === 'ad'}
        bonusPoints={flow.step === 'ad' ? flow.adBonusPoints : 0}
        onEarned={() => flow.step === 'ad' && finishWithReward(flow.reportId, true)}
        onSkipped={() => flow.step === 'ad' && finishWithReward(flow.reportId, false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  centerText: { fontSize: 16, textAlign: 'center' },
  top: { position: 'absolute', top: 60, left: 16, right: 16, alignItems: 'center' },
  recenter: {
    position: 'absolute', right: 20, bottom: 150, width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  bottom: { position: 'absolute', bottom: 44, left: 0, right: 0, alignItems: 'center' },
  reportBtn: {
    backgroundColor: '#FFD400', paddingVertical: 22, paddingHorizontal: 48, borderRadius: 999, minWidth: 240,
    alignItems: 'center', borderWidth: 3, borderColor: '#111', elevation: 8,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  reportText: { fontSize: 22, fontWeight: '900', color: '#111', letterSpacing: 1 },
  waiting: { marginTop: 8, color: '#333', fontWeight: '600' },
  marker: { backgroundColor: '#fff', borderRadius: 16, padding: 4, borderWidth: 2, borderColor: '#111' },
  toast: {
    position: 'absolute', top: 150, alignSelf: 'center', backgroundColor: '#111',
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999,
  },
  toastText: { color: '#FFD400', fontWeight: '800', fontSize: 18 },
});
