# 3 projets "à taille humaine" pour remplacer un job étudiant du week-end (~500 €/mois)

**Profil visé** : étudiant, bon en dev, ~0 temps en semaine, 1 à 2 week-ends de build, pas de budget pub,
pas d'envie de faire du marketing de masse.

---

## Le principe qui change tout

Tu as toujours visé des projets qui ont besoin de **beaucoup de clients**. Or :

> 500 € / mois = 5 clients à 99 €, ou 13 clients à 39 €. **Pas 5 000 utilisateurs.**

Conséquence directe sur le choix du projet : **B2B, douleur chiffrable, acheteur identifiable nominativement.**
Un produit B2C à 5 €/mois demanderait 100 clients et donc une vraie machine de distribution. C'est exactement
le piège dont tu veux sortir.

Les 3 règles de filtrage appliquées ci-dessous :

1. **Liste de prospects énumérable** : je dois pouvoir écrire les noms de 200 acheteurs potentiels dans un
   tableur en une soirée. Si je ne peux pas, c'est un projet "marketing de masse" déguisé.
2. **Douleur qui coûte déjà de l'argent ou des heures**, pas un "ce serait cool".
3. **Le prototype est un script + un email**, pas une plateforme.

---

## Idée 1 — Alerte marchés publics ultra-ciblée (recommandée pour démarrer un vrai SaaS)

### Concept en une phrase
Un service par email qui surveille chaque nuit les appels d'offres publics et n'envoie à une PME **que** les
3 à 5 annonces qui correspondent exactement à son métier et à son secteur géographique — là où les
concurrents historiques vendent un portail complet à 200–500 €/mois.

### Client cible précis
Pas "les PME". Une **seule** verticale, par exemple : entreprises de **nettoyage professionnel de 5 à 40
salariés** dans 3 départements autour de chez toi. (Alternatives aussi bonnes : espaces verts, électricité,
menuiserie/agencement, bureaux d'études thermiques, prestataires informatiques de proximité.)

Le profil qui achète : le gérant qui répond **déjà** à des marchés publics, qui en a gagné 1 ou 2, et qui sait
qu'il en rate par manque de temps de veille. Celui qui n'a jamais répondu à un marché n'achètera pas — tu lui
vendrais un métier, pas un outil.

### Où le trouver (c'est le point fort de l'idée)
Les avis d'attribution des marchés publics sont **publics et ouverts** (BOAMP / données ouvertes de la
commande publique). Tu peux donc extraire la liste nominative des entreprises qui ont **déjà gagné** un
marché dans ton code métier (CPV) et ta région. Tu obtiens une liste de prospects qualifiés à 100 % : ce sont
littéralement des gens qui ont prouvé qu'ils jouent à ce jeu. Ensuite : SIRET → site web → téléphone/email.
Complément : fédérations professionnelles de la branche, CCI, groupes LinkedIn métier.

### Modèle de prix
- **39 €/mois**, sans engagement, 1 métier + 3 départements.
- **13 clients = 507 €/mois.**
- Variante : 59 €/mois avec "résumé + estimation du montant + date limite" → **9 clients suffisent**.

### Première étape de validation (aucune ligne de code)
Ce week-end : tu extrais à la main, depuis le BOAMP, les 5 annonces de la semaine correspondant à un métier
donné, tu les mets dans un email propre et tu l'envoies **gratuitement** à 15 gérants trouvés par la méthode
ci-dessus, avec une seule phrase : *"Je teste un service de veille pour votre métier, voici les 5 annonces de
la semaine. Utile ? Je continue ?"*

Tu répètes 3 semaines. **Critère de décision** : si à la 3ᵉ semaine tu n'as pas au moins 2 personnes qui
demandent à continuer et 1 qui accepte de payer 39 €, tu changes de verticale (pas d'idée). Tu ne codes
l'automatisation (récupération quotidienne, filtre CPV, envoi) qu'après le premier paiement — c'est un
week-end de travail à ce stade.

### Pourquoi ça marche pour toi
Données publiques et gratuites, zéro RGPD sensible, zéro dépendance à une plateforme, coût d'infra ~5 €/mois,
et le produit tourne tout seul une fois écrit. C'est l'idée la plus "dormante" des trois.

---

## Idée 2 — Le compte-rendu de réunion CSE, rédigé automatiquement

### Concept en une phrase
Le secrétaire d'un CSE dépose l'enregistrement audio de la réunion et reçoit en 20 minutes un **procès-verbal
déjà mis au format attendu** (ordre du jour, points abordés, avis rendus, votes, questions diverses), qu'il
n'a plus qu'à relire.

### Client cible précis
Le **secrétaire élu du CSE** d'une entreprise de 50 à 300 salariés. C'est une personne qui a une obligation
légale de produire le PV, qui n'est pas payée pour ça, qui y passe 3 à 6 heures par réunion mensuelle, et —
point décisif — **qui dispose d'un budget propre** (le budget de fonctionnement du CSE) qu'elle décide
d'utiliser sans demander l'autorisation de la direction. Douleur réelle + budget autonome + décideur unique :
c'est la configuration d'achat la plus simple qui existe.

### Où le trouver
LinkedIn en recherche directe ("secrétaire CSE", "élu CSE", filtré par région et taille d'entreprise) : c'est
un titre que les gens affichent. Puis : groupes LinkedIn/Facebook d'élus CSE, organismes de formation des
élus CSE (ils peuvent te recommander à leurs promotions — un partenariat vaut 100 emails), sites de CSE
publics. Tu peux constituer 200 noms en une soirée.

### Modèle de prix
- **99 €/mois** par CSE (jusqu'à 2 réunions/mois, PV illimités en relecture).
- **5 clients = 495 €/mois.**
- Variante sans abonnement pour démarrer : **79 € par PV** livré, la plupart des CSE ayant 1 réunion/mois.

### Première étape de validation (aucune ligne de code)
Tu proposes à 10 secrétaires de CSE de leur faire **le PV de leur prochaine réunion gratuitement**. Tu récupères
l'audio, et tu fais le travail *à la main avec tes propres outils* (transcription + rédaction + mise au format),
sans rien construire. Objectif : 3 PV livrés. Tu apprends alors la seule chose qui compte — **le format exact
attendu** et les 5 pièges (noms des élus, retranscription des votes, formulations juridiques). Puis tu
demandes : *"Je le fais tous les mois pour 99 €, on y va ?"*

Le prototype (dépôt de fichier → transcription → génération du PV → envoi en .docx) est un week-end.

### Le point de vigilance à traiter d'entrée
C'est de l'audio de réunion contenant des données personnelles : héberge en Europe, annonce une suppression
automatique des fichiers sous 30 jours, et prépare une page "traitement des données" d'une demi-page. Ce n'est
pas un blocage, c'est un argument de vente face aux outils génériques.

---

## Idée 3 — Maintenance de sites web en marque blanche (la trésorerie rapide)

### Concept en une phrase
Un abonnement mensuel qui prend en charge les mises à jour, les sauvegardes, la surveillance de disponibilité
et un rapport mensuel d'une page pour les sites WordPress de petites entreprises locales — vendu soit en
direct, soit **en marque blanche à des freelances/graphistes** qui livrent des sites mais refusent d'en assurer
le suivi.

### Client cible précis
Deux portes, la seconde est la meilleure :
1. **Direct** : commerces et artisans locaux avec un site vitrine WordPress qui rapporte des clients
   (restaurant, cabinet d'ostéopathie, agence immobilière, plombier avec formulaire de devis).
2. **Via revendeur** : le **freelance web ou petit studio de ta ville** qui a 15 clients passés et qui reçoit
   des appels paniqués "mon site est en panne" sans être payé pour. Tu lui proposes ton offre sous **sa**
   marque avec 20 % de commission. Un seul partenariat peut apporter 4 à 6 clients d'un coup — c'est ta
   distribution, et elle ne ressemble en rien à du marketing de masse.

### Où le trouver
Les freelances web : Malt, LinkedIn local, Meetups/communautés dev de ta ville, groupes Facebook
"entrepreneurs [ta ville]". Les clients directs : marche dans ta rue commerçante, regarde les sites, note ceux
qui affichent publiquement une version obsolète ou un site lent.

### Modèle de prix
- **89 €/mois** par site (mises à jour, sauvegarde quotidienne, surveillance, 30 min d'interventions incluses).
- **6 clients = 534 €/mois.**
- Palier supérieur à 149 €/mois pour les sites qui vendent (e-commerce) → **4 clients suffisent**.

### Première étape de validation (aucune ligne de code)
Cette semaine, tu choisis 10 sites locaux et tu produis pour chacun un **"bilan de santé" d'une page** (temps
de chargement, version obsolète visible, absence de sauvegarde, certificat, mobile) — 20 minutes chacun avec
des outils gratuits. Tu l'envoies sans rien vendre : *"J'ai regardé votre site, voici 3 points. Si vous voulez
que je m'en occupe, c'est 89 €/mois."* Le document fait la vente à ta place.

En parallèle, tu écris à 5 freelances web : *"Tu as des clients qui te rappellent pour de la maintenance ?
Je la prends en marque blanche, tu gardes 20 %."*

### Le compromis honnête
C'est la seule des trois idées qui crée une **astreinte** : quand un site casse, quelqu'un doit répondre.
C'est aussi la plus rapide à encaisser (premier client possible en 2 semaines) et la moins "scalable".
Rôle recommandé : **elle finance l'idée 1 ou 2**, elle n'est pas la destination.

---

## Comment choisir entre les trois

Un seul critère : **où as-tu déjà un accès humain ?** Si ton oncle dirige une boîte de nettoyage → idée 1.
Si un parent ou une connaissance est élu CSE → idée 2. Si tu connais un freelance web → idée 3.
Un contact existant vaut plus que la qualité de l'idée : c'est lui qui remplace le marketing.

À défaut de contact : **idée 2** (douleur la plus forte, budget autonome, le moins de clients nécessaires),
avec **idée 3** en parallèle pour la trésorerie.

---

## Le plan sur 4 week-ends

| Week-end | Action | Résultat attendu |
|---|---|---|
| 1 | Construire la liste de 100 prospects nominatifs + livrer 3 prestations **à la main** | Tu sais si la douleur est réelle |
| 2 | 30 contacts directs (email/LinkedIn/téléphone), demander explicitement le paiement | 1 client qui paie, ou changement de verticale |
| 3 | Coder la version la plus bête qui tienne : script + base + email. Pas de compte utilisateur, pas de tableau de bord | Le service tourne seul |
| 4 | Encaisser (Stripe), livrer, demander 2 recommandations à ton premier client | Clients 2 et 3 |

**Règle d'arrêt** : pas de premier euro après 30 conversations réelles → tu changes de verticale, pas d'idée.
**Règle anti-rechute** : tant que tu n'as pas 3 clients payants, tu n'as le droit de coder ni page de connexion,
ni tableau de bord, ni application mobile. Le produit, c'est l'email que tu envoies.

---

## Côté administratif (France)

- Statut **micro-entrepreneur** : inscription gratuite en ligne, obtention du SIRET en quelques jours. C'est ce
  qu'il faut pour facturer légalement et pour ouvrir un compte Stripe professionnel.
- Prévois environ **un quart du chiffre d'affaires** en cotisations sociales (le taux dépend de la catégorie
  d'activité et évolue — à vérifier sur le site de l'URSSAF au moment de l'inscription). 500 € facturés ≈ 375 €
  nets, ce qui reste supérieur au job du week-end à temps équivalent une fois automatisé.
- Le seuil de TVA ne te concernera pas avant un chiffre d'affaires très supérieur à ton objectif.
- Statut étudiant : tu restes étudiant, mais vérifie l'impact éventuel sur une bourse si tu en perçois une.
