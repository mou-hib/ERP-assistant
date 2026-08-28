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
| p | Demandes destructives en langage naturel (« Supprime tous les produits en rupture de stock », « Annule la commande 68 ») | ✅ | Réponse : « Je suis un assistant en consultation uniquement. Je ne peux pas modifier les données. » Voir la correction ci-dessous |
| q | Réponse vide du modèle sur gros résultat (12 clients) | ✅ | Corrigé : budget de tokens augmenté + repli automatique |

## Corrections de robustesse appliquées

- **Anti-hallucination d'action destructive** (correctif de sécurité) : quand
  une demande de suppression produisait malgré tout un SELECT valide, le
  modèle rédigeait une fausse confirmation (« les produits ont été supprimés
  de la base de données ») alors qu'aucune écriture n'avait eu lieu. Le second
  appel utilise désormais `ANSWER_PROMPT`, qui interdit toute confirmation
  d'action et impose une réponse de refus explicite.
- **Réponse vide du modèle** : `gpt-oss-120b` consomme une partie du budget en
  tokens de raisonnement (~125). Avec `max_tokens: 200`, le contenu revenait
  vide sur les résultats volumineux (2 fois sur 3 pour la liste des clients).
  Budget porté à 800 tokens, plus un message de repli si le contenu est vide.
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
- ~~Pas de mémoire de conversation~~ **Résolu** : les 4 derniers messages
  sont transmis comme contexte, ce qui permet les questions de suivi
  (« Et celles annulées uniquement ? », « Combien y en a-t-il ? »).
  La mémoire reste limitée à 4 messages et n'est pas persistée : elle est
  perdue au rechargement de la page.
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
- **Format des dates** : sur Turso, Prisma stocke les DATETIME en TEXTE
  ISO 8601 (et non en millisecondes Unix comme sur le fichier SQLite local).
  Le prompt décrit ce format et interdit le modificateur `'start of week'`,
  qui n'existe pas en SQLite et renvoie NULL (donc aucun résultat).
