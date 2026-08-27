# Assistant ERP

Assistant IA permettant d'interroger les données d'un ERP (clients, produits, commandes, factures, paiements) en langage naturel, en français. Construit avec Next.js 14, Prisma, SQLite et l'API Groq.

## Prérequis

- Node.js 18 ou supérieur
- npm

## Installation

```bash
# 1. Cloner le dépôt
git clone <url-du-depot>
cd erp-assistant

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# puis remplir les valeurs (voir tableau ci-dessous)

# 4. Générer le client Prisma
npx prisma generate

# 5. Créer la base de données et appliquer les migrations
npx prisma migrate dev

# 6. Remplir la base avec des données de démonstration
npx prisma db seed
```

## Lancement

```bash
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

Pour explorer la base de données :

```bash
npx prisma studio
```

## Identifiants de connexion

| Email           | Mot de passe |
| --------------- | ------------ |
| `admin@erp.com` | `admin123`   |

## Variables d'environnement

| Variable       | Description                                                  | Exemple                       |
| -------------- | ------------------------------------------------------------ | ----------------------------- |
| `DATABASE_URL` | Chemin de la base SQLite                                     | `file:./dev.db`               |
| `AUTH_SECRET`  | Clé secrète Auth.js (générer : `openssl rand -base64 32`)    | chaîne aléatoire de 32 octets |
| `GROQ_API_KEY` | Clé API Groq ([console.groq.com](https://console.groq.com))  | `gsk_...`                     |
| `NEXTAUTH_URL` | URL de base de l'application                                 | `http://localhost:3000`       |
