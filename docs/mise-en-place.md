# Mise en place de l'environnement — Assistant ERP

Document de référence : tout ce qui a été fait pour créer le projet, étape par étape, avec les problèmes rencontrés et leurs corrections.

**Résultat final :** une application Next.js 14 qui démarre sans erreur, protégée par authentification, avec une base SQLite remplie de données ERP françaises réalistes. Le pipeline IA (Groq) n'est pas encore implémenté — seuls les emplacements sont prêts.

---

## Étape 1 — Création du projet (scaffold)

```bash
npx create-next-app@14 erp-assistant --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

| Option | Effet |
| --- | --- |
| `--typescript` | Projet en TypeScript |
| `--tailwind` | Tailwind CSS préconfiguré (`globals.css`, `tailwind.config.ts`) |
| `--eslint` | ESLint avec la config Next.js |
| `--app` | App Router (dossier `app/` et non `pages/`) |
| `--src-dir` | Tout le code applicatif sous `src/` |
| `--import-alias "@/*"` | `@/…` pointe vers `src/…` dans les imports |

`create-next-app` a aussi initialisé un dépôt Git avec un premier commit.

---

## Étape 2 — Installation des dépendances

```bash
npm install prisma @prisma/client next-auth@beta groq-sdk bcryptjs
npm install --save-dev @types/bcryptjs ts-node
```

| Paquet | Rôle |
| --- | --- |
| `prisma` | CLI Prisma (migrations, seed, studio) |
| `@prisma/client` | Client généré pour interroger la base |
| `next-auth@beta` | Auth.js v5 (authentification) |
| `groq-sdk` | Appels directs à l'API Groq |
| `bcryptjs` | Hachage / comparaison du mot de passe |
| `ts-node` | Exécution du seed TypeScript |

### ⚠️ Problème n°1 : Prisma 7 installé par défaut

`npm install prisma` a installé **Prisma 7**, qui change les conventions :

- la configuration passe par un fichier `prisma.config.ts` (nouveau) ;
- la clé `"prisma": { "seed": … }` dans `package.json` n'est plus lue ;
- le `.env` n'est plus chargé automatiquement par le CLI.

Le cahier des charges reposait sur les conventions classiques (seed dans `package.json`, `.env` auto-chargé). **Correction : épinglage de la version 6.**

```bash
npm install prisma@6 @prisma/client@6      # → v6.19
```

### ⚠️ Problème n°2 : `prisma init` génère quand même le nouveau format

```bash
npx prisma init --datasource-provider sqlite
```

Même en v6.19, cette commande a créé un `prisma.config.ts` et un générateur `prisma-client` avec sortie dans `src/generated/prisma`. **Correction :**

- suppression de `prisma.config.ts` (sans lui, le CLI v6 recharge le `.env` classiquement) ;
- retour au générateur standard dans le schéma :

```prisma
generator client {
  provider = "prisma-client-js"
}
```

---

## Étape 3 — Schéma Prisma (`prisma/schema.prisma`)

Six modèles et deux enums, reliés ainsi :

```
Client 1──n Commande 1──n LigneCommande n──1 Produit
                 │
                 1──1 Facture 1──n Paiement
```

| Modèle | Champs principaux | Relations |
| --- | --- | --- |
| `Client` | nom, email (unique), telephone | → commandes |
| `Produit` | nom, description, prix (Float), stock (Int) | → lignes de commande |
| `Commande` | date, statut (enum), clientId | → client, lignes, facture |
| `LigneCommande` | quantite, prixUnitaire | → commande, produit |
| `Facture` | montantTotal, montantPaye, date, commandeId (**unique** → relation 1-1) | → commande, paiements |
| `Paiement` | montant, date, mode (enum) | → facture |

Enums :

- `StatutCommande` : `EN_ATTENTE`, `CONFIRMEE`, `EXPEDIEE`, `LIVREE`, `ANNULEE`
- `ModePaiement` : `VIREMENT`, `CARTE`, `CHEQUE`, `ESPECES`

Détails notables : `prixUnitaire` est copié dans `LigneCommande` (le prix au moment de la commande, indépendant du prix actuel du produit) ; `montantPaye` a une valeur par défaut de `0`.

---

## Étape 4 — Fichier de seed (`prisma/seed.ts`)

Le seed vide d'abord les tables (dans l'ordre inverse des dépendances), puis crée :

- **12 clients** français (noms, emails chez orange.fr / gmail / free.fr…, téléphones en 06/07) ;
- **18 produits** répartis en 4 catégories (bureautique, informatique, mobilier, fournitures), la catégorie étant indiquée dans la description — dont **4 produits à stock 0** (rupture) ;
- **25 commandes** étalées sur les 3 derniers mois (de J-88 à J-1), **les 5 statuts représentés** ;
- **1 à 4 lignes par commande** (53 lignes au total), avec `prixUnitaire` copié depuis le produit ;
- **25 factures** (une par commande), `montantTotal` calculé depuis les lignes ;
- **21 paiements** utilisant **les 4 modes**.

La répartition des paiements suit un cycle sur l'index de la commande (`i % 3`) :

| Cas | Facture | Paiements créés |
| --- | --- | --- |
| `i % 3 === 0` | payée intégralement | 1 paiement (ou 2 si montant > 1000 € : acompte 40 % puis solde) |
| `i % 3 === 1` | partiellement payée | 1 acompte de 30 % |
| `i % 3 === 2` | impayée | aucun |

Configuration du seed ajoutée dans `package.json` (exactement comme demandé) :

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

### ⚠️ Problème n°3 : erreurs TypeScript à l'exécution du seed

Le `tsconfig.json` généré par create-next-app ne définit pas de `target` ; ts-node retombe alors sur **ES3**, ce qui a produit :

- `TS2802` : `commandesData.entries()` non itérable sans `--downlevelIteration` ;
- `TS7031` / `TS7006` : types implicites `any` sur les destructurations de tuples.

**Correction** (dans `seed.ts`, sans toucher à la commande du `package.json`) :

- boucle `for (let i = 0; …)` classique au lieu de `.entries()` ;
- annotations explicites `[produitIdx, quantite]: [number, number]` dans `map` et `reduce`.

---

## Étape 5 — Authentification (Auth.js v5)

### `auth.ts` (racine du projet)

- Provider **Credentials** uniquement.
- **Un seul utilisateur codé en dur** : `admin@erp.com` / `admin123`. Le mot de passe est stocké sous forme de **hash bcrypt** (pré-calculé, coût 10) et vérifié avec `bcrypt.compareSync`.
- Stratégie de session **JWT**.
- Callbacks `jwt` et `session` pour que la session contienne `id`, `email`, `name`.
- `pages: { signIn: "/login" }` pour utiliser notre propre page de connexion.

Exporte `handlers`, `auth`, `signIn`, `signOut`.

### `src/app/api/auth/[...nextauth]/route.ts`

Ré-exporte simplement `GET` et `POST` depuis les `handlers` d'`auth.ts`.

### `src/middleware.ts`

- Si l'utilisateur **n'est pas connecté** et visite autre chose que `/login` → redirection vers `/login`.
- Si l'utilisateur **est connecté** et visite `/login` → redirection vers `/`.
- Le `matcher` exclut `/api/auth/*`, les fichiers statiques (`_next/static`, `_next/image`) et le favicon.

> Avec `--src-dir`, le middleware doit vivre dans `src/middleware.ts` (et non à la racine).

### Deux ajustements TypeScript

1. **Alias `@auth`** ajouté dans `tsconfig.json` : `auth.ts` étant à la racine (hors `src/`), l'alias `@/*` ne l'atteint pas. `"@auth": ["./auth.ts"]` permet d'écrire `import { auth } from "@auth"` partout.
2. **`src/types/next-auth.d.ts`** : augmentation du module `next-auth` pour que `session.user.id` soit typé (le type `Session` par défaut ne contient pas `id`).

---

## Étape 6 — Arborescence du projet

```
erp-assistant/
├── auth.ts                        ← config Auth.js (utilisateur, JWT, callbacks)
├── prisma/
│   ├── schema.prisma              ← 6 modèles + 2 enums
│   ├── seed.ts                    ← données de démonstration
│   ├── dev.db                     ← base SQLite (ignorée par Git)
│   └── migrations/                ← migration « init »
└── src/
    ├── middleware.ts              ← protection des routes
    ├── app/
    │   ├── layout.tsx             ← layout racine (lang="fr", métadonnées, Tailwind)
    │   ├── globals.css
    │   ├── (auth)/login/page.tsx  ← page de connexion (fonctionnelle)
    │   ├── (dashboard)/
    │   │   ├── layout.tsx         ← layout protégé avec Navbar
    │   │   └── page.tsx           ← page principale du chat (placeholder)
    │   └── api/
    │       ├── auth/[...nextauth]/route.ts
    │       └── chat/route.ts      ← pipeline IA (placeholder, renvoie 501)
    ├── components/
    │   ├── Navbar.tsx             ← email de l'utilisateur + bouton Déconnexion
    │   ├── ChatPanel.tsx          ← vide (à implémenter)
    │   └── DataTable.tsx          ← vide (à implémenter)
    ├── lib/
    │   ├── prisma.ts              ← singleton PrismaClient
    │   └── groq.ts                ← singleton Groq
    └── types/
        ├── index.ts               ← types partagés (ChatMessage, ChatResponse…)
        └── next-auth.d.ts         ← typage de session.user.id
```

Remarques :

- `(auth)` et `(dashboard)` sont des **groupes de routes** : ils organisent les fichiers sans apparaître dans l'URL. `(dashboard)/page.tsx` correspond donc à `/`.
- **Problème n°4 :** le `src/app/page.tsx` généré par create-next-app entrait en **conflit de route** avec `(dashboard)/page.tsx` (tous deux → `/`). Il a été supprimé.
- La page de connexion et la Navbar sont **minimalement fonctionnelles** (pas vides) car la vérification finale exigeait un vrai parcours de connexion. `ChatPanel`, `DataTable` et `/api/chat` restent des coquilles vides, comme prévu.
- Les singletons (`prisma.ts`, `groq.ts`) stockent l'instance sur `globalThis` en développement pour éviter d'en recréer une à chaque rechargement à chaud.

---

## Étape 7 — Variables d'environnement

`.env` (ignoré par Git) :

```bash
DATABASE_URL="file:./dev.db"        # chemin relatif au dossier prisma/
AUTH_SECRET="…"                     # généré avec : openssl rand -base64 32
GROQ_API_KEY="your-groq-api-key-here"   # à remplacer par une vraie clé
NEXTAUTH_URL="http://localhost:3000"
```

`.env.example` : mêmes clés, valeurs vides (celui-ci est versionné).

> ⚠️ `GROQ_API_KEY` contient encore la valeur factice — à remplacer avant d'implémenter le pipeline IA.

---

## Étape 8 — `.gitignore`

Ajouté au fichier généré : `.env`, `*.db`, `*.db-journal`. (`node_modules/` et `.next/` y figuraient déjà.) Vérifié : ni `.env` ni `dev.db` n'apparaissent dans `git status`.

---

## Étape 9 — README

`README.md` rédigé en français : description, prérequis (Node 18+), installation (clone → `npm install` → `.env` → `prisma generate` → `prisma migrate dev` → `prisma db seed`), lancement, identifiants de connexion et tableau des variables d'environnement.

---

## Étape 10 — Exécution et vérifications

```bash
npx prisma migrate dev --name init   # crée dev.db + applique la migration
npx prisma db seed                   # remplit la base
npm run dev                          # démarre sur localhost:3000
```

Tout a été vérifié réellement :

| Vérification | Méthode | Résultat |
| --- | --- | --- |
| Compilation TypeScript | `npx tsc --noEmit` | ✅ 0 erreur |
| Contenu de la base | requêtes SQL directes | ✅ 12 clients, 18 produits (4 en rupture), 25 commandes (5 statuts), 53 lignes, 25 factures, 21 paiements (4 modes) |
| Redirection si non connecté | navigateur : visite de `/` | ✅ redirigé vers `/login` |
| Connexion | navigateur : `admin@erp.com` / `admin123` | ✅ dashboard affiché (Navbar + email + Déconnexion) |
| Erreurs serveur | logs de `npm run dev` | ✅ aucune |
| Prisma Studio | `npx prisma studio` puis requête HTTP sur le port 5555 | ✅ HTTP 200 |

---

## Récapitulatif des problèmes et corrections

| # | Problème | Correction |
| --- | --- | --- |
| 1 | `npm install prisma` installe Prisma 7 (conventions incompatibles avec le cahier des charges) | Épinglage `prisma@6` + `@prisma/client@6` |
| 2 | `prisma init` génère `prisma.config.ts` + générateur non standard | Suppression de `prisma.config.ts`, retour à `prisma-client-js` |
| 3 | Seed en échec : ts-node retombe sur ES3 (pas de `target` dans le tsconfig) → TS2802 / TS7031 | Boucle indexée + annotations de tuples explicites dans `seed.ts` |
| 4 | Conflit de route : `src/app/page.tsx` vs `(dashboard)/page.tsx` | Suppression de la page par défaut |

---

## Commandes Git

Le dépôt existe déjà (créé par create-next-app). Premier commit du travail :

```bash
cd erp-assistant
git add -A
git commit -m "Initialisation du projet : Next.js 14, Prisma, Auth.js et données de démonstration"
```

---

## Prochaines étapes (non faites)

- Implémenter le pipeline IA dans `src/app/api/chat/route.ts` (question en français → Groq → requête Prisma → réponse).
- Construire `ChatPanel` et `DataTable`, et brancher la page du dashboard sur les maquettes.
- Remplacer `GROQ_API_KEY` par une vraie clé.
