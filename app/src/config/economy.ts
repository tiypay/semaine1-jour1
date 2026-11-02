/**
 * Paramètres économiques côté client (AFFICHAGE uniquement).
 * Les montants réellement crédités sont décidés par les Cloud Functions
 * (functions/src/config.ts) : le client ne doit jamais être source de vérité.
 */

/** 1000 points = 1 centime d'euro. */
export const POINTS_PER_CENT = 1000;

/** Palier de retrait : 5 € = 500 centimes. */
export const CASHOUT_THRESHOLD_CENTS = 500;
export const CASHOUT_THRESHOLD_POINTS = POINTS_PER_CENT * CASHOUT_THRESHOLD_CENTS; // 500 000

export function pointsToEuros(points: number): string {
  const cents = Math.floor(points / POINTS_PER_CENT);
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

export type ReportCategory = 'voirie' | 'proprete' | 'signalisation';

export const REPORT_CATEGORIES: { id: ReportCategory; label: string; emoji: string; hint: string }[] = [
  { id: 'voirie', label: 'Voirie', emoji: '🕳️', hint: 'Nid-de-poule, trottoir abîmé…' },
  { id: 'proprete', label: 'Propreté', emoji: '🗑️', hint: 'Poubelle pleine, dépôt sauvage…' },
  { id: 'signalisation', label: 'Signalisation', emoji: '🚧', hint: 'Panneau cassé, feu en panne…' },
];
