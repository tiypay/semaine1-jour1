import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { REPORT_CATEGORIES, type ReportCategory } from '../config/economy';

type Props = {
  photoUri: string;
  submitting: boolean;
  onRetake: () => void;
  onSubmit: (category: ReportCategory) => void;
};

/** Aperçu de la photo + choix de la catégorie + validation. */
export function CategoryPicker({ photoUri, submitting, onRetake, onSubmit }: Props) {
  const [selected, setSelected] = useState<ReportCategory | null>(null);

  return (
    <View style={styles.container}>
      <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />

      <View style={styles.sheet}>
        <Text style={styles.title}>C'est quoi le problème ?</Text>

        {REPORT_CATEGORIES.map((c) => {
          const active = selected === c.id;
          return (
            <Pressable
              key={c.id}
              onPress={() => setSelected(c.id)}
              disabled={submitting}
              style={[styles.option, active && styles.optionActive]}
            >
              <Text style={styles.emoji}>{c.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionLabel}>{c.label}</Text>
                <Text style={styles.optionHint}>{c.hint}</Text>
              </View>
              <View style={[styles.radio, active && styles.radioActive]} />
            </Pressable>
          );
        })}

        <Pressable
          disabled={!selected || submitting}
          onPress={() => selected && onSubmit(selected)}
          style={[styles.submit, (!selected || submitting) && { opacity: 0.5 }]}
        >
          {submitting ? <ActivityIndicator color="#111" /> : <Text style={styles.submitText}>Valider le signalement</Text>}
        </Pressable>

        <Pressable onPress={onRetake} disabled={submitting}>
          <Text style={styles.retake}>Reprendre la photo</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFill, backgroundColor: '#111' },
  preview: { flex: 1 },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, gap: 10 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 2, borderColor: '#eee' },
  optionActive: { borderColor: '#111', backgroundColor: '#FFF8CC' },
  emoji: { fontSize: 26 },
  optionLabel: { fontSize: 16, fontWeight: '700' },
  optionHint: { color: '#666', fontSize: 13 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#bbb' },
  radioActive: { borderColor: '#111', backgroundColor: '#111' },
  submit: { marginTop: 8, backgroundColor: '#FFD400', borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  submitText: { fontWeight: '800', fontSize: 16, color: '#111' },
  retake: { textAlign: 'center', color: '#666', marginTop: 4 },
});
