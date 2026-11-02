import { collection, doc, getDocs, query, orderBy, startAt, endAt, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes } from 'firebase/storage';
import { distanceBetween, geohashQueryBounds } from 'geofire-common';
import type { ReportCategory } from '../config/economy';
import { auth, db, functions, storage } from '../lib/firebase';

export type CapturedPhoto = {
  uri: string;
  /** Horodatage (ms) de la prise de vue, pris au moment du déclenchement. */
  capturedAt: number;
};

export type CapturedFix = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  /** Android : true si la position vient d'une app de "fake GPS". */
  mocked: boolean;
};

export type SubmitReportResult = {
  reportId: string;
  status: 'awaiting_ad' | 'duplicate';
  basePoints: number;
  adBonusPoints: number;
  message?: string;
};

export type ClaimRewardResult = { pointsCredited: number; newBalance: number };

const submitReportFn = httpsCallable<object, SubmitReportResult>(functions, 'submitReport');
const claimReportRewardFn = httpsCallable<object, ClaimRewardResult>(functions, 'claimReportReward');

/**
 * 1) Upload de la photo dans Storage (chemin imposé par les Storage Rules)
 * 2) Appel de la Cloud Function qui applique l'anti-fraude et crée le signalement.
 * Le client n'écrit JAMAIS directement dans Firestore.
 */
export async function submitReport(
  photo: CapturedPhoto,
  fix: CapturedFix,
  category: ReportCategory,
): Promise<SubmitReportResult> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Non connecté');

  // ID généré côté client pour pouvoir nommer la photo avant la création du doc.
  const reportId = doc(collection(db, 'reports')).id;

  const blob = await (await fetch(photo.uri)).blob();
  await uploadBytes(ref(storage, `reports/${uid}/${reportId}.jpg`), blob, { contentType: 'image/jpeg' });

  const res = await submitReportFn({
    reportId,
    category,
    lat: fix.latitude,
    lng: fix.longitude,
    accuracy: fix.accuracy,
    mocked: fix.mocked,
    capturedAt: photo.capturedAt,
  });
  return res.data;
}

/** À appeler après la pub récompensée (ou sans pub si aucune n'a pu être chargée). */
export async function claimReportReward(reportId: string, adWatched: boolean): Promise<ClaimRewardResult> {
  const res = await claimReportRewardFn({ reportId, adWatched });
  return res.data;
}

export type PublicReport = {
  id: string;
  category: ReportCategory;
  lat: number;
  lng: number;
  status: string;
};

/**
 * Signalements publics autour d'un point (collection reportsPublic, sans donnée perso).
 * Requête par geohash : 1 requête par "case" couvrant le cercle, puis filtrage exact par distance.
 */
export async function fetchNearbyReports(lat: number, lng: number, radiusM = 2000): Promise<PublicReport[]> {
  const bounds = geohashQueryBounds([lat, lng], radiusM);
  const snaps = await Promise.all(
    bounds.map(([start, end]) =>
      getDocs(query(collection(db, 'reportsPublic'), orderBy('geohash'), startAt(start), endAt(end), limit(100))),
    ),
  );
  const out: PublicReport[] = [];
  for (const snap of snaps) {
    for (const d of snap.docs) {
      const r = d.data();
      if (distanceBetween([r.lat, r.lng], [lat, lng]) * 1000 <= radiusM) {
        out.push({ id: d.id, category: r.category, lat: r.lat, lng: r.lng, status: r.status });
      }
    }
  }
  return out;
}
