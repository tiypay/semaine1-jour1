import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { distanceBetween, geohashForLocation, geohashQueryBounds } from 'geofire-common';
import { AD_BONUS_POINTS, ANTIFRAUD, BASE_REPORT_POINTS, CATEGORIES, type Category } from './config.js';

initializeApp();
const db = getFirestore();

setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });

/**
 * Passer à true dès que App Check (Play Integrity / App Attest) est configuré :
 * bloque les appels qui ne viennent pas de la vraie app (scripts, émulateurs modifiés).
 */
const ENFORCE_APP_CHECK = false;

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

/** Date du jour à Paris (AAAA-MM-JJ) pour le quota journalier. */
function parisDay(d = new Date()): string {
  return new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(d);
}

function reject(message: string, code: 'failed-precondition' | 'resource-exhausted' | 'invalid-argument' | 'permission-denied' = 'failed-precondition'): never {
  throw new HttpsError(code, message);
}

type SubmitReportInput = {
  reportId: string;
  category: Category;
  lat: number;
  lng: number;
  accuracy: number | null;
  mocked: boolean;
  capturedAt: number;
};

function parseSubmitInput(data: unknown): SubmitReportInput {
  const d = (data ?? {}) as Record<string, unknown>;
  const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
  if (typeof d.reportId !== 'string' || !/^[A-Za-z0-9]{15,40}$/.test(d.reportId)) reject('reportId invalide', 'invalid-argument');
  if (!CATEGORIES.includes(d.category as Category)) reject('Catégorie invalide', 'invalid-argument');
  if (!isNum(d.lat) || !isNum(d.lng) || Math.abs(d.lat) > 90 || Math.abs(d.lng) > 180) reject('Coordonnées invalides', 'invalid-argument');
  if (!isNum(d.capturedAt)) reject('capturedAt invalide', 'invalid-argument');
  return {
    reportId: d.reportId as string,
    category: d.category as Category,
    lat: d.lat as number,
    lng: d.lng as number,
    accuracy: isNum(d.accuracy) ? d.accuracy : null,
    mocked: d.mocked === true,
    capturedAt: d.capturedAt as number,
  };
}

// ---------------------------------------------------------------------------
// submitReport : anti-fraude + création du signalement (points versés après la pub)
// ---------------------------------------------------------------------------

export const submitReport = onCall({ enforceAppCheck: ENFORCE_APP_CHECK }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) reject('Connexion requise', 'permission-denied');
  const input = parseSubmitInput(req.data);
  const now = Date.now();

  // --- 1. Contrôles "sans état" (coût nul) -------------------------------------------------
  if (input.mocked) reject('Position simulée détectée. Désactive les apps de faux GPS.');
  if (input.accuracy === null || input.accuracy > ANTIFRAUD.maxGpsAccuracyM) {
    reject(`GPS trop imprécis (${Math.round(input.accuracy ?? 999)} m). Mets-toi à découvert et réessaie.`);
  }
  const age = (now - input.capturedAt) / 1000;
  if (age > ANTIFRAUD.maxCaptureAgeSeconds || age < -ANTIFRAUD.clockSkewSeconds) {
    reject('Photo trop ancienne : prends-la sur place, au moment du signalement.');
  }
  const a = ANTIFRAUD.serviceArea;
  if (input.lat < a.minLat || input.lat > a.maxLat || input.lng < a.minLng || input.lng > a.maxLng) {
    reject("Cette zone n'est pas encore couverte par l'application.");
  }

  // --- 2. La photo existe bien, au bon endroit, avec une taille plausible -------------------
  const file = getStorage().bucket().file(`reports/${uid}/${input.reportId}.jpg`);
  const [exists] = await file.exists();
  if (!exists) reject('Photo introuvable, réessaie.');
  const [meta] = await file.getMetadata();
  const size = Number(meta.size ?? 0);
  if (size < ANTIFRAUD.minPhotoBytes || size > ANTIFRAUD.maxPhotoBytes) reject('Photo invalide.');
  const photoMd5 = String(meta.md5Hash ?? '');

  // --- 3. Même fichier déjà envoyé (renvoi en boucle de la même image) ----------------------
  if (photoMd5) {
    const sameFile = await db.collection('reports').where('photoMd5', '==', photoMd5).limit(1).get();
    if (!sameFile.empty) reject('Cette photo a déjà été envoyée.');
  }

  // --- 4. Doublon géographique : même catégorie, < 25 m, < 7 jours --------------------------
  const since = now - ANTIFRAUD.duplicateWindowDays * 86_400_000;
  const bounds = geohashQueryBounds([input.lat, input.lng], ANTIFRAUD.duplicateRadiusM);
  const nearSnaps = await Promise.all(
    bounds.map(([start, end]) => db.collection('reportsPublic').orderBy('geohash').startAt(start).endAt(end).limit(50).get()),
  );
  const isDuplicate = nearSnaps.some((s) =>
    s.docs.some((d) => {
      const r = d.data();
      return (
        r.category === input.category &&
        (r.createdAt as Timestamp).toMillis() >= since &&
        distanceBetween([r.lat, r.lng], [input.lat, input.lng]) * 1000 <= ANTIFRAUD.duplicateRadiusM
      );
    }),
  );

  // --- 5. Contrôles "avec état", atomiques (transaction sur le profil utilisateur) ----------
  const userRef = db.collection('users').doc(uid);
  const reportRef = db.collection('reports').doc(input.reportId);
  const publicRef = db.collection('reportsPublic').doc(input.reportId);
  const today = parisDay();
  const geohash = geohashForLocation([input.lat, input.lng]);

  let teleportDetected = false;
  await db.runTransaction(async (tx) => {
    const [userSnap, existingReport] = await Promise.all([tx.get(userRef), tx.get(reportRef)]);
    if (existingReport.exists) reject('Signalement déjà envoyé.');

    const u = userSnap.data() ?? {};
    if (u.status === 'banned') reject('Compte suspendu.', 'permission-denied');

    // Cooldown
    const lastAt: number | undefined = u.lastReportAt?.toMillis?.();
    if (lastAt && now - lastAt < ANTIFRAUD.cooldownSeconds * 1000) {
      const wait = Math.ceil((ANTIFRAUD.cooldownSeconds * 1000 - (now - lastAt)) / 1000);
      reject(`Prochain signalement possible dans ${wait} s.`, 'resource-exhausted');
    }

    // Quota journalier
    const dailyCount = u.dailyDate === today ? (u.dailyCount ?? 0) : 0;
    if (!isDuplicate && dailyCount >= ANTIFRAUD.dailyCap) {
      reject(`Limite de ${ANTIFRAUD.dailyCap} signalements par jour atteinte. À demain !`, 'resource-exhausted');
    }

    // Téléportation : vitesse implicite entre les deux derniers signalements
    if (lastAt && u.lastReportGeo) {
      const km = distanceBetween([u.lastReportGeo.lat, u.lastReportGeo.lng], [input.lat, input.lng]);
      const hours = Math.max((now - lastAt) / 3_600_000, 1 / 3600);
      if (km / hours > ANTIFRAUD.maxSpeedKmh) {
        teleportDetected = true;
        reject('Déplacement incohérent détecté entre deux signalements.');
      }
    }

    const status = isDuplicate ? 'duplicate' : 'awaiting_ad';
    const createdAt = FieldValue.serverTimestamp();

    tx.set(reportRef, {
      userId: uid,
      category: input.category,
      photoPath: file.name,
      photoMd5,
      lat: input.lat,
      lng: input.lng,
      geohash,
      gpsAccuracyM: input.accuracy,
      capturedAt: Timestamp.fromMillis(input.capturedAt),
      createdAt,
      status, // awaiting_ad → rewarded → (modération) validated | rejected ; ou duplicate
      moderationStatus: 'pending',
      rewardPoints: 0,
    });

    // Les doublons ne créent pas de nouveau marqueur : ils "confirment" celui qui existe (phase 2).
    if (!isDuplicate) {
      tx.set(publicRef, { category: input.category, lat: input.lat, lng: input.lng, geohash, status: 'open', createdAt });
    }

    tx.set(
      userRef,
      {
        createdAt: u.createdAt ?? createdAt,
        points: u.points ?? 0,
        lifetimePoints: u.lifetimePoints ?? 0,
        status: u.status ?? 'active',
        lastReportAt: Timestamp.fromMillis(now),
        lastReportGeo: { lat: input.lat, lng: input.lng },
        dailyDate: today,
        dailyCount: isDuplicate ? dailyCount : dailyCount + 1,
        reportsCount: FieldValue.increment(1),
      },
      { merge: true },
    );
  }).catch(async (err) => {
    // Une transaction qui échoue n'écrit rien : on trace l'événement suspect séparément.
    if (teleportDetected) {
      await userRef.set({ suspiciousEvents: FieldValue.increment(1), lastSuspiciousAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    throw err;
  });

  if (isDuplicate) {
    return {
      reportId: input.reportId,
      status: 'duplicate',
      basePoints: 0,
      adBonusPoints: 0,
      message: 'Ce problème a déjà été signalé ici récemment. Merci pour la confirmation !',
    };
  }
  return { reportId: input.reportId, status: 'awaiting_ad', basePoints: BASE_REPORT_POINTS, adBonusPoints: AD_BONUS_POINTS };
});

// ---------------------------------------------------------------------------
// claimReportReward : crédit des points (une seule fois par signalement)
// ---------------------------------------------------------------------------

export const claimReportReward = onCall({ enforceAppCheck: ENFORCE_APP_CHECK }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) reject('Connexion requise', 'permission-denied');
  const { reportId, adWatched } = (req.data ?? {}) as { reportId?: unknown; adWatched?: unknown };
  if (typeof reportId !== 'string') reject('reportId invalide', 'invalid-argument');

  const reportRef = db.collection('reports').doc(reportId);
  const userRef = db.collection('users').doc(uid);
  const txRef = db.collection('transactions').doc();

  return db.runTransaction(async (tx) => {
    const [reportSnap, userSnap] = await Promise.all([tx.get(reportRef), tx.get(userRef)]);
    const r = reportSnap.data();
    if (!r || r.userId !== uid) reject('Signalement introuvable', 'permission-denied');
    if (r.status !== 'awaiting_ad') reject('Récompense déjà versée pour ce signalement.');

    // TODO(AdMob) : MVP = on fait confiance au client pour `adWatched`.
    // En production : activer la Server-Side Verification (SSV) AdMob → un endpoint HTTP reçoit le
    // callback signé de Google (avec custom_data = reportId) et c'est LUI qui pose adVerified = true.
    const points = BASE_REPORT_POINTS + (adWatched === true ? AD_BONUS_POINTS : 0);
    const newBalance = (userSnap.data()?.points ?? 0) + points;

    tx.update(reportRef, { status: 'rewarded', rewardPoints: points, adWatched: adWatched === true, rewardedAt: FieldValue.serverTimestamp() });
    tx.update(userRef, { points: newBalance, lifetimePoints: FieldValue.increment(points) });
    // Grand livre immuable : on peut toujours recalculer un solde et auditer un fraudeur.
    tx.set(txRef, {
      userId: uid,
      type: adWatched === true ? 'report_reward_ad' : 'report_reward',
      amount: points,
      balanceAfter: newBalance,
      refType: 'report',
      refId: reportId,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { pointsCredited: points, newBalance };
  });
});
