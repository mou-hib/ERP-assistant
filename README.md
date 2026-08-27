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

## Installation

```bash
git clone [url-du-repo]
cd erp-assistant
npm install
```

## Configuration

```bash
cp .env.example .env
```

Remplir les variables dans `.env` :

- `AUTH_SECRET` : générer avec `openssl rand -base64 32`
- `GROQ_API_KEY` : obtenir sur [console.groq.com](https://console.groq.com)
- `NEXTAUTH_URL` : `http://localhost:3000` en local

## Base de données

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

## Lancement

```bash
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

## Identifiants de démonstration

```
Email        : admin@erp.com
Mot de passe : admin123
```

## Variables d'environnement

| Variable       | Description                    | Obligatoire |
| -------------- | ------------------------------ | ----------- |
| `DATABASE_URL` | Chemin vers le fichier SQLite  | Oui         |
| `AUTH_SECRET`  | Secret JWT pour Auth.js        | Oui         |
| `GROQ_API_KEY` | Clé API Groq                   | Oui         |
| `NEXTAUTH_URL` | URL de base de l'application   | Oui         |

## Stack technique

- Next.js 14 (App Router)
- TypeScript + Tailwind CSS
- Prisma + SQLite
- Groq SDK (modèle `openai/gpt-oss-120b`)
- Auth.js v5 (Credentials, JWT)
- Vercel (déploiement)

## Architecture

Architecture monolithique à couches (N-tier) déployée en environnement
serverless sur Vercel.

Flux IA : **Question → Groq (SQL) → Prisma → Groq (réponse) → UI**

## Documentation

- [GUIDE_UTILISATEUR.md](GUIDE_UTILISATEUR.md) — guide de prise en main
- [TESTS.md](TESTS.md) — campagne de tests et limites connues
- [PRODUCTION.md](PRODUCTION.md) — checklist de mise en production
- [docs/mise-en-place.md](docs/mise-en-place.md) — journal de mise en place
