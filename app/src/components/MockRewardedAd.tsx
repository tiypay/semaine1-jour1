import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  bonusPoints: number;
  /** Appelé si la pub a été regardée jusqu'au bout. */
  onEarned: () => void;
  /** Appelé si l'utilisateur ferme la pub avant la fin. */
  onSkipped: () => void;
};

const AD_DURATION_S = 5;

/**
 * ⚠️ PLACEHOLDER — à remplacer par AdMob (react-native-google-mobile-ads, RewardedAd) en DERNIÈRE étape.
 * Même contrat que la vraie pub : onEarned ⇔ événement EARNED_REWARD, onSkipped ⇔ CLOSED sans récompense.
 * Garder ce mock permet de développer tout le flux dans Expo Go, sans build natif ni compte AdMob.
 */
export function MockRewardedAd({ visible, bonusPoints, onEarned, onSkipped }: Props) {
  const [remaining, setRemaining] = useState(AD_DURATION_S);

  useEffect(() => {
    if (!visible) return;
    setRemaining(AD_DURATION_S);
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [visible]);

  const done = remaining === 0;

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onSkipped}>
      <View style={styles.container}>
        <Text style={styles.badge}>PUBLICITÉ (simulée)</Text>
        <Text style={styles.title}>🍕 Pizzeria du Coin</Text>
        <Text style={styles.sub}>-10 % sur ta prochaine pizza avec l'app</Text>

        {done ? (
          <Pressable style={styles.cta} onPress={onEarned}>
            <Text style={styles.ctaText}>Récupérer +{bonusPoints} pts</Text>
          </Pressable>
        ) : (
          <Text style={styles.timer}>Récompense dans {remaining} s…</Text>
        )}

        {!done && (
          <Pressable onPress={onSkipped} style={styles.skip}>
            <Text style={styles.skipText}>Passer (sans bonus)</Text>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B1B3A', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  badge: { color: '#aaa', fontSize: 12, letterSpacing: 1.5, position: 'absolute', top: 64 },
  title: { color: '#fff', fontSize: 30, fontWeight: '800' },
  sub: { color: '#ddd', fontSize: 16, textAlign: 'center' },
  timer: { color: '#FFD400', fontSize: 18, fontWeight: '700', marginTop: 24 },
  cta: { marginTop: 24, backgroundColor: '#FFD400', paddingVertical: 16, paddingHorizontal: 28, borderRadius: 999 },
  ctaText: { fontWeight: '800', fontSize: 16, color: '#111' },
  skip: { position: 'absolute', bottom: 56 },
  skipText: { color: '#888' },
});
