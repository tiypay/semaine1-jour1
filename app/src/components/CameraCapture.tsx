import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { CapturedFix, CapturedPhoto } from '../services/reports';

type Props = {
  onCaptured: (photo: CapturedPhoto, fix: CapturedFix) => void;
  onCancel: () => void;
};

/**
 * Caméra plein écran. Volontairement PAS d'accès à la galerie :
 * la photo doit être prise "ici et maintenant" (anti-fraude n°1).
 * La position GPS est relevée au moment exact du déclenchement.
 */
export function CameraCapture({ onCaptured, onCancel }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator color="#fff" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>On a besoin de l'appareil photo pour signaler une anomalie.</Text>
        <Pressable style={styles.primary} onPress={requestPermission}>
          <Text style={styles.primaryText}>Autoriser la caméra</Text>
        </Pressable>
        <Pressable onPress={onCancel}><Text style={styles.link}>Annuler</Text></Pressable>
      </View>
    );
  }

  const shoot = async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    setError(null);
    try {
      const capturedAt = Date.now();
      // Photo et position en parallèle : la position doit correspondre au moment de la prise de vue.
      const [pic, loc] = await Promise.all([
        cameraRef.current.takePictureAsync({ quality: 0.5, exif: false, shutterSound: false }),
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      ]);
      onCaptured(
        { uri: pic.uri, capturedAt },
        {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy,
          mocked: loc.mocked ?? false,
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de la prise de vue');
      setBusy(false);
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setReady(true)} />

      <View style={styles.topBar}>
        <Pressable onPress={onCancel} hitSlop={16}><Text style={styles.close}>✕</Text></Pressable>
        <Text style={styles.tip}>Cadre bien l'anomalie 📸</Text>
        <View style={{ width: 24 }} />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.bottomBar}>
        <Pressable
          accessibilityLabel="Prendre la photo"
          disabled={!ready || busy}
          onPress={shoot}
          style={({ pressed }) => [styles.shutter, (pressed || busy) && { transform: [{ scale: 0.92 }] }]}
        >
          {busy ? <ActivityIndicator color="#111" /> : <View style={styles.shutterInner} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  text: { color: '#fff', fontSize: 16, textAlign: 'center' },
  primary: { backgroundColor: '#FFD400', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999 },
  primaryText: { fontWeight: '800', color: '#111' },
  link: { color: '#bbb', marginTop: 8 },
  topBar: { position: 'absolute', top: 56, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { color: '#fff', fontSize: 24, fontWeight: '700' },
  tip: { color: '#fff', fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, overflow: 'hidden' },
  error: { position: 'absolute', bottom: 150, alignSelf: 'center', color: '#fff', backgroundColor: '#D7263D', padding: 10, borderRadius: 8, overflow: 'hidden' },
  bottomBar: { position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center' },
  shutter: { width: 84, height: 84, borderRadius: 42, borderWidth: 5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' },
});
