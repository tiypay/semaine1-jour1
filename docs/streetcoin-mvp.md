# StreetCoin — MVP crowdsourcing urbain & Drive-to-Store

> Nom de code provisoire. Les utilisateurs photographient les anomalies de la ville, gagnent des points
> financés par la pub récompensée et les commerçants locaux, et les dépensent tout de suite en bons plans
> ou les accumulent jusqu'au retrait de 5 €.

Code de ce dépôt :

| Dossier | Contenu |
|---|---|
| `app/` | App Expo (SDK 58, TypeScript) : auth anonyme, carte, bouton Signaler, caméra, catégorie, pub simulée |
| `backend/functions/` | Cloud Functions `submitReport` (anti-fraude) et `claimReportReward` (crédit des points) |
| `backend/firestore.rules`, `backend/storage.rules` | Sécurité : le client lit, seul le serveur écrit les points |

---

## 0. Regard PM avant de coder : calibrer l'économie

Les chiffres du brief (1000 pts = 1 centime ; café = 500 pts) créent un écart énorme entre les deux
récompenses. C'est voulu (c'est le *breakage*), mais il faut le chiffrer :

| Hypothèse | Valeur |
|---|---|
| Revenu d'une pub récompensée en France (eCPM ~10–15 €) | ~1 à 1,5 centime par vue |
| Part reversée à l'utilisateur (≈ 40 %) | ~0,5 centime = **500 pts** (`AD_BONUS_POINTS`) |
| Signalement sans pub | **50 pts** (`BASE_REPORT_POINTS`) |
| Signalements pour atteindre 5 € (500 000 pts) | **~900** |
| Signalements pour un café à 500 pts | **1** |

À retenir :

1. **Le cash à 5 € est un horizon lointain** (~900 signalements, plafonnés à 10/jour ⇒ 3 mois minimum).
   C'est le moteur du breakage, mais trop loin ça ressemble à une arnaque et ça se paie en avis sur les
   stores. Affichez la progression (barre « 0,42 € / 5,00 € ») et prévoyez des multiplicateurs ponctuels
   (défis de quartier, ×2 le week-end).
2. **Le bon de réduction coûte ~0 € à l'app** : c'est le commerçant qui le finance, en échange de trafic
   en boutique. Un café pour *un seul* signalement est probablement trop généreux pour lui : je
   conseille **1 500 à 3 000 pts** (3 à 5 signalements) et un **stock journalier** par commerçant.
3. **Chaque point dépensé en bon ne compte plus pour le cash.** C'est la boucle : gratification immédiate
   ⇒ on revient ⇒ on revoit des pubs ⇒ le palier de 5 € recule.
4. **Risques à vérifier avant le lancement, pas après** :
   - le règlement AdMob encadre strictement les récompenses des pubs récompensées (notamment les
     récompenses convertibles en argent réel). Lisez les règles « Rewarded ads » à jour et, au besoin,
     versez le bonus en points *uniquement échangeables en bons*, et le cash depuis une autre source
     (partenariats, vente de données aux collectivités) ;
   - le retrait d'argent implique d'identifier l'utilisateur (vérification du téléphone au minimum,
     contraintes fiscales ou KYC selon le prestataire de paiement) ;
   - les signalements doivent aller quelque part (mairie, gestionnaire de voirie) : c'est aussi un
     argument de vente B2G.

---

## 1. Architecture de la base de données (Firestore)

Firestore est un modèle *documents* : pas de jointures, on duplique un peu (dénormalisation) pour lire
vite. Règle d'or : **tout ce qui crédite ou débite des points est écrit par une Cloud Function**, jamais
par le client.

```
users/{uid}                 profil + solde + compteurs anti-fraude
reports/{reportId}          signalement complet (privé)
reportsPublic/{reportId}    projection publique pour la carte (sans donnée perso)
transactions/{txId}         grand livre immuable des mouvements de points
merchants/{merchantId}      commerçants partenaires
rewards/{rewardId}          catalogue de bons (boutique, onglet « Bons plans »)
redemptions/{id}            bons débloqués par un utilisateur
cashouts/{id}               demandes de retrait (onglet « Retirer mes 5 € »)
```

### `users/{uid}`
| Champ | Type | Rôle |
|---|---|---|
| `points` | number | Solde dépensable (bons **et** cash) |
| `lifetimePoints` | number | Total gagné (stats, niveaux, détection d'anomalies) |
| `reportsCount` | number | Nombre de signalements |
| `status` | `active` \| `shadowbanned` \| `banned` | Modération |
| `lastReportAt` | timestamp | Cooldown |
| `lastReportGeo` | `{lat,lng}` | Détection de téléportation |
| `dailyDate`, `dailyCount` | string, number | Quota journalier (date de Paris) |
| `suspiciousEvents` | number | Compteur de comportements suspects |
| `phoneVerified` | bool | Exigé pour le retrait (phase 2) |
| `createdAt` | timestamp | |

### `reports/{reportId}`
| Champ | Type | Rôle |
|---|---|---|
| `userId` | string | Auteur |
| `category` | `voirie` \| `proprete` \| `signalisation` | |
| `photoPath` | string | `reports/{uid}/{reportId}.jpg` dans Storage |
| `photoMd5` | string | Empreinte du fichier (anti-renvoi de la même image) |
| `lat`, `lng`, `geohash` | number, string | Position + index géographique |
| `gpsAccuracyM` | number | Précision GPS au moment de la photo |
| `capturedAt`, `createdAt` | timestamp | |
| `status` | `awaiting_ad` → `rewarded` ; ou `duplicate` | Cycle de récompense |
| `moderationStatus` | `pending` \| `validated` \| `rejected` | Modération (back-office, phase 2) |
| `rewardPoints`, `adWatched` | number, bool | Ce qui a été versé |

### `reportsPublic/{reportId}`
`category`, `lat`, `lng`, `geohash`, `status` (`open` \| `resolved`), `createdAt`, plus tard
`confirmations`. Lisible par tous les connectés : c'est ce qui affiche les marqueurs sur la carte.

### `transactions/{txId}` — le grand livre
| Champ | Type | Rôle |
|---|---|---|
| `userId` | string | |
| `type` | `report_reward` \| `report_reward_ad` \| `voucher_redeem` \| `cashout` \| `adjustment` | |
| `amount` | number | Positif = gain, négatif = dépense |
| `balanceAfter` | number | Solde après l'opération (audit) |
| `refType`, `refId` | string | Objet lié (report, reward, cashout) |
| `createdAt` | timestamp | |

On ne modifie ni ne supprime jamais une transaction : on écrit une ligne `adjustment` pour corriger.

### `merchants/{merchantId}` et `rewards/{rewardId}`
- `merchants` : `name`, `address`, `lat`, `lng`, `geohash`, `logoUrl`, `active`.
- `rewards` : `merchantId`, `merchantName` (dénormalisé), `title` (« Café offert »), `description`,
  `costPoints`, `dailyStock`, `stockLeftToday`, `validityDays`, `active`, `lat`, `lng`.

### `redemptions/{id}` et `cashouts/{id}`
- `redemptions` : `userId`, `rewardId`, `merchantId`, `code` (court, affiché au comptoir ou en QR),
  `costPoints`, `status` (`issued` \| `used` \| `expired`), `issuedAt`, `expiresAt`, `usedAt`.
- `cashouts` : `userId`, `points`, `amountCents`, `method` (`paypal` \| `iban`), `destination`
  (chiffré), `status` (`requested` \| `paid` \| `rejected`), `createdAt`, `processedAt`.

### Pourquoi `reports` **et** `reportsPublic` ?
Firestore ne sait pas masquer des champs à la lecture : soit on lit tout le document, soit rien. Pour
afficher les signalements des autres sans exposer `userId` (et donc les trajets de quelqu'un), on écrit
une copie réduite.

---

## 2. Anti-fraude basique (MVP)

Principe : **le client propose, le serveur décide.** Tous les contrôles ci-dessous sont dans
`backend/functions/src/index.ts`, réglables dans `backend/functions/src/config.ts`.

| # | Règle | Valeur MVP | Contre quoi |
|---|---|---|---|
| 1 | **Caméra uniquement**, pas de galerie | — | Photos récupérées sur Internet |
| 2 | Photo prise il y a moins de 5 min (horodatage au déclenchement) | 300 s | Photos « stockées » envoyées plus tard |
| 3 | **Cooldown** entre deux signalements | 120 s | Spam en rafale |
| 4 | **Quota** de signalements récompensés par jour | 10 | Farming industriel |
| 5 | Précision GPS exigée | ≤ 50 m | Positions approximatives ou falsifiées |
| 6 | Position simulée refusée (`location.mocked`, Android) | — | Apps de faux GPS |
| 7 | **Téléportation** : vitesse implicite entre deux signalements | ≤ 130 km/h | Faux GPS plus malin |
| 8 | Zone de service (rectangle de la ville pilote) | Paris + petite couronne | Fraude à distance, zones sans partenaires |
| 9 | **Doublon** : même catégorie à < 25 m sur 7 jours ⇒ 0 point | 25 m / 7 j | Photographier 20 fois le même trou |
| 10 | Même fichier photo (empreinte MD5) déjà envoyé ⇒ refus | — | Renvoi de la même image |
| 11 | Photo : JPEG, 20 Ko à 5 Mo, dans le dossier de l'utilisateur, sans écrasement | Storage Rules | Upload arbitraire |
| 12 | Points crédités **une seule fois** par signalement (transaction Firestore) | — | Rejouer l'appel de récompense |
| 13 | Le client ne peut **rien écrire** dans Firestore | Security Rules | Client modifié qui se crédite |

Les contrôles d'état (cooldown, quota, téléportation) tournent dans une **transaction** sur
`users/{uid}`, ce qui empêche de les contourner en envoyant 10 requêtes en parallèle.

### À ajouter juste après le MVP (par ordre de rentabilité)
1. **Firebase App Check** (Play Integrity / App Attest) : passer `ENFORCE_APP_CHECK = true`. Bloque
   les scripts qui appellent l'API sans la vraie app. C'est le meilleur rapport effort/efficacité.
2. **Vérification serveur des pubs AdMob (SSV)** : aujourd'hui `adWatched` est déclaré par le client
   (voir le `TODO(AdMob)`). Avec la SSV, Google appelle votre serveur avec une signature, et c'est ce
   callback qui débloque le bonus.
3. **Points « en attente » pour le cash** : les points sont dépensables tout de suite en bons, mais ne
   comptent pour le retrait qu'après modération (48 h). Le fraudeur se fait repérer avant d'encaisser.
4. **Numéro de téléphone obligatoire pour retirer** (on rattache le compte anonyme avec
   `linkWithCredential`) + 1 compte par appareil. Rend le multi-compte coûteux.
5. **Modération** : un back-office qui affiche les photos ; puis un modèle de vision (étiquettes
   « nid-de-poule / poubelle / panneau », détection de photo d'écran) pour pré-trier.
6. **Score de confiance** par utilisateur : les nouveaux comptes ont un quota plus bas ; les
   signalements confirmés par la mairie augmentent le score et les plafonds.

---

## 3. Code de départ (dans ce dépôt)

### Parcours implémenté
```
Ouverture ─► connexion anonyme ─► carte centrée sur l'utilisateur + signalements autour (2 km)
   └─► [📸 SIGNALER] ─► caméra (photo + GPS au même instant)
         └─► aperçu + choix de catégorie ─► Valider
               ├─► upload Storage ─► submitReport (anti-fraude)
               │      ├─ refus ⇒ message clair (cooldown, GPS imprécis…)
               │      ├─ doublon ⇒ « Déjà signalé, merci ! » (0 pt)
               │      └─ OK ⇒ pub récompensée (SIMULÉE pour l'instant)
               └─► claimReportReward ⇒ +550 pts (pub vue) ou +50 pts (pub passée) ⇒ toast + solde mis à jour
```

### Fichiers clés
- `app/src/screens/MapScreen.tsx` — **le composant principal** : carte, suivi GPS, bouton Signaler,
  machine à états du parcours (`map → camera → category → ad`).
- `app/src/components/CameraCapture.tsx` — caméra plein écran (`expo-camera`), photo + GPS simultanés.
- `app/src/components/CategoryPicker.tsx` — aperçu + 3 catégories + validation.
- `app/src/components/MockRewardedAd.tsx` — **faux** écran de pub (même contrat qu'AdMob).
- `app/src/components/WalletPill.tsx` — solde + barre de progression vers 5 €.
- `app/src/services/reports.ts` — upload, appels des Cloud Functions, requête géographique.
- `backend/functions/src/index.ts` — anti-fraude + crédit des points.

### Lancer le projet
1. Créer un projet Firebase ; activer **Authentication → Anonyme**, **Firestore**, **Storage**,
   **Functions** (forfait Blaze requis pour les Functions). Région conseillée : `europe-west1`.
2. Ajouter une app Web dans la console Firebase, copier `app/.env.example` en `app/.env` et remplir.
3. Créer des clés Google Maps (SDK Android + SDK iOS) et les mettre dans `app/app.json`
   (plugin `react-native-maps`).
4. Backend :
   ```bash
   cd backend/functions && npm install && cd ..
   npx firebase-tools login
   npx firebase-tools use --add          # choisir votre projet Firebase
   npx firebase-tools deploy --only firestore:rules,storage,functions
   ```
5. App : `react-native-maps` avec Google Maps et `expo-camera` demandent un **development build**
   (Expo Go ne suffit pas avec une clé Maps personnalisée) :
   ```bash
   cd app && npm install
   npx expo run:android        # ou : npx eas-cli@latest build --profile development
   ```
6. Vérifications : `cd app && npx tsc --noEmit` et `cd backend/functions && npm run build`.

> Pour tester hors de Paris, élargissez `ANTIFRAUD.serviceArea` dans `backend/functions/src/config.ts`.

---

## 4. Prochaines étapes (une à la fois)

1. ✅ **Étape 1 (ce commit)** : auth anonyme, carte, signalement photo, anti-fraude, points, pub simulée.
2. **Étape 2 — Boutique** : écran à deux onglets
   - « Retirer mes 5 € » : barre de progression, bouton grisé tant que `points < 500 000` ;
   - « Bons plans locaux » : liste `rewards` triée par distance, Cloud Function `redeemReward`
     (débit + `redemptions` + code à montrer au comptoir) dans une transaction.
3. **Étape 3 — Compte vérifié** : rattachement téléphone/Google/Apple, `requestCashout`.
4. **Étape 4 — Back-office minimal** : modération des photos, export pour la mairie.
5. **Étape 5 — AdMob en dernier** : `react-native-google-mobile-ads` (development build obligatoire),
   ID de test d'abord, puis SSV côté serveur. On remplace `MockRewardedAd` sans toucher au reste du flux.
