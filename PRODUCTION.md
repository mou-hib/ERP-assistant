# Checklist mise en production

## Avant de déployer

- [ ] Remplacer SQLite par Turso (SQLite distribué) ou PostgreSQL —
      le système de fichiers Vercel est éphémère, la base locale est
      réinitialisée à chaque déploiement
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
