/**
 * Source de vérité de l'économie et de l'anti-fraude.
 * Tous les montants sont en POINTS (1000 points = 1 centime d'euro).
 */

export const POINTS_PER_CENT = 1000;
export const CASHOUT_THRESHOLD_POINTS = 500 * POINTS_PER_CENT; // 5 €

/** Points versés pour un signalement valide, même sans pub (financés par les partenariats / la data). */
export const BASE_REPORT_POINTS = 50;
/** Bonus si la pub récompensée est regardée en entier (~40 % d'un revenu de ~1,2 ct par vue). */
export const AD_BONUS_POINTS = 500;

export const CATEGORIES = ['voirie', 'proprete', 'signalisation'] as const;
export type Category = (typeof CATEGORIES)[number];

export const ANTIFRAUD = {
  /** Délai minimum entre deux signalements d'un même utilisateur. */
  cooldownSeconds: 120,
  /** Nombre max de signalements récompensés par jour (heure de Paris). */
  dailyCap: 10,
  /** Précision GPS minimale exigée (rayon d'incertitude en mètres). */
  maxGpsAccuracyM: 50,
  /** La photo doit avoir été prise il y a moins de X secondes (pas de photos "stockées"). */
  maxCaptureAgeSeconds: 300,
  /** Tolérance d'horloge du téléphone dans le futur. */
  clockSkewSeconds: 60,
  /** Vitesse max plausible entre deux signalements (téléportation = fake GPS). */
  maxSpeedKmh: 130,
  /** Un signalement de même catégorie à moins de X m et de moins de Y jours = doublon. */
  duplicateRadiusM: 25,
  duplicateWindowDays: 7,
  /** Taille de la photo acceptée (octets). */
  minPhotoBytes: 20 * 1024,
  maxPhotoBytes: 5 * 1024 * 1024,
  /**
   * Zone de service du MVP (rectangle autour de la ville pilote — ici Paris + petite couronne).
   * Hors zone = refus : on ne paie que là où on a des partenaires et une collectivité intéressée.
   */
  serviceArea: { minLat: 48.75, maxLat: 48.95, minLng: 2.2, maxLng: 2.5 },
} as const;
