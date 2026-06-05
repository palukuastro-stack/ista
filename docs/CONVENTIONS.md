# Conventions de Développement

## Clean Code & SOLID
- **Single Responsibility** : Chaque composant doit avoir un rôle unique.
- **DRY (Don't Repeat Yourself)** : Utilisation de composants partagés (`src/components/ui`, `DashboardLayout.tsx`).

## Internationalisation (i18n)
Toutes les chaînes de caractères visibles par l'utilisateur doivent être externalisées dans `src/lib/locales.json`.
**Interdiction** d'écrire du texte en dur dans les composants.

## Naming
- **Composants** : PascalCase (`MyComponent.tsx`).
- **Hooks** : camelCase avec préfixe `use` (`useMyHook.ts`).
- **Services/Lib** : camelCase (`store.ts`, `utils.ts`).
- **Variables CSS** : kebab-case (standards Tailwind).

## UI/UX
L'interface doit rester cohérente. Utilisez les composants du design system (`src/components/ui`) pour tous les éléments de base (boutons, inputs, cards).
