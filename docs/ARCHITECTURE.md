# Architecture & Gestion d'État

## Store Custom (`src/lib/store.ts`)
L'application utilise un store "in-memory" réactif pour gérer les données. Ce choix a été fait pour garantir une rapidité maximale sans dépendance à une base de données externe pour la version actuelle.

### Fonctionnement
1. **Initialisation** : Les données sont chargées depuis `data.json`.
2. **Réactivité** : Le store utilise un pattern Pub/Sub. Les composants s'y abonnent via le hook `useSyncExternalStore`.
3. **Persistance** : Pour le moment, l'état est maintenu en mémoire. Les modifications ne survivent pas à un rechargement complet de la page (sauf via le cache PWA pour les assets).

## Authentification (`src/contexts/AuthContext.tsx`)
La gestion de la session repose sur le localStorage pour maintenir le rôle de l'utilisateur.
- `RequireAuth` : Protège les routes nécessitant une connexion.
- `RoleGuard` : Assure que seul l'utilisateur ayant le rôle approprié accède à une sous-section.

## Sélecteurs (`src/lib/selectors.ts`)
Tous les calculs complexes (moyennes, filtrages par faculté, statistiques) sont centralisés dans des fonctions de sélection pures. Cela permet de séparer la logique métier du rendu UI.
