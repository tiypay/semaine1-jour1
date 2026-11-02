import { StyleSheet, Text, View } from 'react-native';
import { CASHOUT_THRESHOLD_POINTS, pointsToEuros } from '../config/economy';

/**
 * Le solde + la progression vers 5 €. On affiche les POINTS en gros (chiffre qui grossit vite =
 * dopamine) et l'équivalent en euros en petit : c'est le ressort psychologique du modèle.
 */
export function WalletPill({ points }: { points: number }) {
  const progress = Math.min(1, points / CASHOUT_THRESHOLD_POINTS);
  return (
    <View style={styles.pill}>
      <Text style={styles.points}>🪙 {points.toLocaleString('fr-FR')} pts</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(2, progress * 100)}%` }]} />
      </View>
      <Text style={styles.euros}>{pointsToEuros(points)} / 5,00 € pour retirer</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 200,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  points: { fontSize: 18, fontWeight: '800', color: '#111' },
  track: { height: 6, backgroundColor: '#eee', borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: '#FFD400' },
  euros: { fontSize: 11, color: '#666', marginTop: 4 },
});
