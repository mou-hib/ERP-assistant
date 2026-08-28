# VMIND — Assistant IA pour ERP

## Description

Assistant conversationnel permettant d'interroger des données ERP fictives
en langage naturel français. L'utilisateur pose une question, l'IA génère
une requête SQL, l'exécute et retourne une réponse en français accompagnée
d'un tableau de données.

## Prérequis

- Node.js 18 ou supérieur
- npm 9 ou supérieur
- Un compte Groq (gratuit) : [console.groq.com](https://console.groq.com)
- Un compte Turso (gratuit) : [turso.tech](https://turso.tech) — base de
  données libSQL hébergée, avec le CLI `turso` installé

## Installation

```bash
git clone https://github.com/mou-hib/ERP-assistant
cd erp-assistant
npm install
```

## Configuration

```bash
cp .env.example .env
```

Remplir les variables dans `.env` :

- `TURSO_DATABASE_URL` : URL de la base (`turso db show <nom> --url`)
- `TURSO_AUTH_TOKEN` : token de base de données (`turso db tokens create <nom>`).
  **En production, générer un token en lecture seule** :
  `turso db tokens create <nom> --read-only`
- `AUTH_SECRET` : générer avec `openssl rand -base64 32`
- `GROQ_API_KEY` : obtenir sur [console.groq.com](https://console.groq.com)
- `NEXTAUTH_URL` : `http://localhost:3000` en local

## Base de données (Turso)

```bash
# 1. Créer la base
turso db create erp-assistant
turso db show erp-assistant --url        # → TURSO_DATABASE_URL
turso db tokens create erp-assistant     # → TURSO_AUTH_TOKEN
# En production, préférer un token en lecture seule :
turso db tokens create erp-assistant --read-only

# 2. Appliquer le schéma (les migrations Prisma, dans l'ordre)
cat prisma/migrations/*/migration.sql | turso db shell erp-assistant

# 3. Générer le client Prisma et remplir la base de démonstration
npx prisma generate
npx prisma db seed
```

> Note : `prisma migrate dev` ne sait pas se connecter directement à une URL
> `libsql://` ; les migrations s'appliquent via le CLI `turso` (étape 2).
> Le seed, lui, passe par l'adaptateur libSQL et fonctionne normalement.

> Sécurité : l'application n'exécute que des `SELECT` (validation applicative
> et plafond de lignes appliqués côté serveur). En production, utiliser un
> token Turso **en lecture seule** : aucune écriture n'est alors possible avec
> ce token, quelles que soient les requêtes envoyées. Les migrations et le seed
> (étapes 2 et 3) nécessitent en revanche un token en écriture.

## Lancement

```bash
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

## Identifiants de démonstration

Les identifiants de démonstration ne sont pas publiés dans ce dépôt.
Contacter le mainteneur du projet pour obtenir un accès de démonstration.

## Variables d'environnement

| Variable             | Description                                  | Obligatoire |
| -------------------- | -------------------------------------------- | ----------- |
| `TURSO_DATABASE_URL` | URL libSQL de la base Turso                  | Oui         |
| `TURSO_AUTH_TOKEN`   | Token d'accès Turso (lecture seule en prod)  | Oui         |
| `AUTH_SECRET`        | Secret JWT pour Auth.js                      | Oui         |
| `GROQ_API_KEY`       | Clé API Groq                                 | Oui         |
| `NEXTAUTH_URL`       | URL de base de l'application                 | Oui         |

## Stack technique

- Next.js 14 (App Router)
- TypeScript + Tailwind CSS
- Prisma + Turso (libSQL hébergé, via `@prisma/adapter-libsql`)
- Groq SDK (modèle `openai/gpt-oss-120b`)
- Auth.js v5 (Credentials, JWT)
- Vercel (déploiement)

## Architecture

Architecture monolithique à couches (N-tier) déployée en environnement
serverless sur Vercel, avec base de données Turso hébergée (compatible
serverless, persistante entre les déploiements).

Flux IA : **Question → Groq (SQL) → Prisma/Turso → Groq (réponse) → UI**

## Documentation

- [GUIDE_UTILISATEUR.md](GUIDE_UTILISATEUR.md) — guide de prise en main
- [TESTS.md](TESTS.md) — campagne de tests et limites connues
- [PRODUCTION.md](PRODUCTION.md) — checklist de mise en production
- [docs/mise-en-place.md](docs/mise-en-place.md) — journal de mise en place
