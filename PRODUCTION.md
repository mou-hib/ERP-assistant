# Checklist mise en production

## Avant de déployer

- [x] Remplacer SQLite par Turso (SQLite distribué) ou PostgreSQL —
      fait : la base tourne sur Turso (`@prisma/adapter-libsql`),
      persistante et compatible serverless
- [ ] Changer les identifiants admin par défaut
- [ ] Générer un AUTH_SECRET fort (32+ caractères)
- [ ] Configurer NEXTAUTH_URL avec le vrai domaine
- [ ] Activer HTTPS uniquement
- [ ] Ajouter rate limiting sur /api/chat
- [ ] Ajouter logging des requêtes (Vercel Analytics)

## Ce qui fonctionne en production sans changement

- Next.js → Vercel natif
- Groq SDK → variables d'environnement Vercel
- Auth.js → JWT stateless, compatible serverless
- Turso → variables d'environnement Vercel
  (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`)
