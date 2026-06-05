# Progressive Web App (PWA)

ISTA PORTAL est conçu pour être résilient et performant, même avec une connexion internet instable.

## Service Worker (`public/sw.js`)
Nous utilisons plusieurs stratégies de mise en cache pour optimiser l'expérience :

### Network-First
Utilisé pour le fichier `manifest.json` et l'entrée HTML (`index.html`).
- **Pourquoi ?** Pour s'assurer que l'utilisateur reçoit toujours la version la plus récente de la configuration et de la structure de l'application s'il est en ligne.

### Stale-While-Revalidate
Utilisé pour les assets statiques (JS, CSS, Images).
- **Pourquoi ?** Permet un chargement instantané depuis le cache tout en mettant à jour les ressources en arrière-plan pour la prochaine visite.

## Manifeste (`public/manifest.json`)
Définit l'identité visuelle de l'application une fois installée.
- **Display** : `standalone` pour une expérience proche d'une application native.
- **Shortcuts** : Permettent d'accéder directement aux différents portails depuis l'icône de l'application sur mobile ou desktop.

## Installation
L'application est installable sur :
- **Android/iOS** : "Ajouter à l'écran d'accueil".
- **Windows/macOS/Linux** : Via le bouton d'installation dans la barre d'adresse de Chrome/Edge ou via le bouton dédié sur la page de connexion.
