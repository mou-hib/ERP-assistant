# Tests — Phase 6

Campagne de tests exécutée le 27 août 2026 sur l'application complète
(pipeline IA branché, modèle `openai/gpt-oss-120b` via Groq).
Chaque scénario a été exécuté réellement contre l'API `/api/chat`
avec la base SQLite de démonstration.

## Scénarios

| # | Question | Résultat attendu | Statut | Observations |
|---|----------|------------------|--------|--------------|
| a | Quels produits sont en rupture de stock ? | Liste des produits stock = 0 | ✅ | 4 produits retournés, réponse française correcte |
| b | Quelles commandes a passées le client Dupont ? | Commandes jointes avec clients | ✅ | 2 commandes (n°29 annulée, n°43 expédiée), `LIKE '%Dupont%'` |
| c | Quel est le chiffre d'affaires du mois dernier ? | Somme des montantTotal des factures | ✅ | Fonctionne grâce à la date injectée. Le montant varie selon l'interprétation du SQL généré (mois calendaire strict vs autres filtres) — voir Limites |
| d | Quels sont les 5 produits les plus vendus ? | Jointure lignes_commande + produits, GROUP BY, ORDER BY | ✅ | Top 5 correct (stylos BIC en tête, 62 unités) |
| e | Combien reste-t-il à payer sur les factures non soldées ? | montantTotal − montantPaye où différence > 0 | ✅ | 8 797,59 € — vérifié à l'identique par requête SQL directe |
| f | Donne moi la liste de tous les clients | 12 clients | ✅ | 12 lignes, LIMIT 100 appliqué |
| g | Quelles commandes sont en attente ? | Commandes statut EN_ATTENTE | ✅ | 4 commandes (n°47–50) |
| h | Quel est le total des paiements reçus ce mois-ci ? | Somme des paiements du mois courant | ✅ | 6 110,44 €, date injectée utilisée correctement |
| i | DELETE FROM clients | Bloqué | ✅ | 400 « Je ne peux répondre qu'à des questions de consultation. » — table intacte (12 clients) |
| j | DROP TABLE commandes | Bloqué | ✅ | 400, même message, table intacte |
| k | Entrée vide | Bloqué avant l'appel Groq | ✅ | Côté API : 400 immédiat. Côté interface : message inline « Veuillez saisir une question. » (min. 3 caractères), rien n'est envoyé |
| l | azertyuiop qsdfghjklm | Tentative SQL, résultat vide géré proprement | ✅ | Le modèle génère un SELECT inoffensif et la réponse indique poliment qu'il ne comprend pas la demande |
| m | Qui est le président de la France ? | Vide ou message français propre | ✅ | Le modèle ne produit pas de SELECT → la validation renvoie le message de consultation. Hors-sujet correctement contenu, même si le libellé du message n'est pas spécifique au hors-sujet |

Scénarios complémentaires testés :

| # | Scénario | Statut | Observations |
|---|----------|--------|--------------|
| n | « cette semaine » / « aujourd'hui » (dates relatives) | ✅ | 2 commandes cette semaine ; « aujourd'hui » → 0 résultat, message « Aucun résultat trouvé pour votre question. » |
| o | Résultat vide (client inexistant) | ✅ | Bulle assistante « Aucun résultat trouvé pour votre question. », tableau « Aucun résultat trouvé. », compteur « 0 sur 0 » — sans second appel au modèle |

## Corrections de robustesse appliquées

- **Validation frontale** : question limitée à 3 caractères minimum après trim,
  message inline « Veuillez saisir une question. » sous le champ de saisie.
- **Sécurité SQL** : liste noire étendue (INSERT, UPDATE, DELETE, DROP, ALTER,
  CREATE, TRUNCATE, EXEC, EXECUTE, insensible à la casse) + obligation de
  commencer par SELECT. En cas d'échec, Prisma n'est jamais appelé.
- **Résultats vides** : réponse directe « Aucun résultat trouvé pour votre
  question. » sans second appel au modèle (plus rapide, moins coûteux).
- **Timeout Groq** : chaque appel au modèle est abandonné après 15 secondes
  → 504 « La réponse prend trop de temps. Veuillez réessayer. »
- **Dates relatives** : la date du jour (`new Date().toISOString()`) est
  injectée dans le prompt système à chaque requête.

## Limites connues

- ~~SQLite non persistant sur Vercel~~ **Résolu** : la base a été migrée
  vers Turso (libSQL hébergé), persistante et compatible serverless.
- **Utilisateur unique codé en dur** : pas de gestion réelle des comptes,
  des rôles ni des mots de passe (admin@erp.com uniquement).
- **Pas de mémoire de conversation** : chaque question est indépendante ;
  « et pour le mois précédent ? » ne fonctionnera pas.
- **Questions complexes** : les questions multi-étapes ou ambiguës peuvent
  générer un SQL incorrect ou une interprétation inattendue. Exemple
  observé : le « chiffre d'affaires du mois dernier » peut varier d'une
  exécution à l'autre selon les filtres que le modèle choisit (factures
  annulées incluses ou non, bornes de dates).
- **Hallucination de colonnes** : le modèle peut inventer des colonnes
  absentes du schéma ; l'erreur SQL est alors interceptée et l'utilisateur
  reçoit « Je n'ai pas pu récupérer les données. Reformulez votre question. »
- **Modèle remplacé** : `llama-3.3-70b-versatile` (spécifié initialement)
  a été retiré par Groq ; l'application utilise `openai/gpt-oss-120b`.
- **Format des dates** : Prisma stocke les DATETIME SQLite en millisecondes
  Unix ; le prompt impose la conversion `datetime(col/1000,'unixepoch')`.
  Une requête écrite sans cette conversion renverrait des résultats vides.
