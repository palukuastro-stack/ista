# ISTA PORTAL — Plateforme de Gestion Universitaire

## Présentation
ISTA PORTAL est une solution complète de gestion académique pour l'ISTA-GOMA. Elle permet de centraliser les informations et les processus pour tous les acteurs de l'université : étudiants, enseignants, apparitorat, secrétariat de faculté, secrétariat général et rectorat.

## Architecture Technique
L'application est construite sur une stack moderne :
- **Frontend** : React 19 avec Vite
- **Stylisation** : Tailwind CSS
- **Composants UI** : Radix UI & Lucide React
- **Gestion d'état** : Custom in-memory store avec `useSyncExternalStore`
- **Routage** : React Router DOM v6 (avec guards basés sur les rôles)
- **PWA** : Support complet du mode hors ligne et installation multi-plateforme

## Installation & Développement

### Prérequis
- Node.js 18+
- pnpm (recommandé) ou npm

### Lancer en local
```bash
# Installation des dépendances
pnpm install

# Lancer le serveur de développement
pnpm dev
```

### Build de production
```bash
pnpm build
pnpm preview
```

## Documentation Complémentaire
- [Architecture & Gestion d'État](./docs/ARCHITECTURE.md)
- [Stratégies PWA](./docs/PWA.md)
- [Conventions de Développement](./docs/CONVENTIONS.md)

## Rôles & Accès
L'application utilise un système de RBAC (Role-Based Access Control) strict :
- `student` : Accès aux cours, notes et horaires.
- `teacher` : Gestion des cours, encodage des notes.
- `apparitorat` : Inscriptions et gestion administrative des étudiants.
- `secretariat_faculte` : Gestion académique au niveau de la faculté.
- `secretariat_general` : Supervision globale et validation des résultats.
- `rectorat` : Pilotage stratégique et statistiques institutionnelles.
