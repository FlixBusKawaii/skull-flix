# SkullFlix

SkullFlix est une application web permettant de suivre facilement les scores de parties de **Skull King**. Elle a été conçue pour offrir une saisie rapide des scores, notamment sur mobile.

## Fonctionnalités

- Création d'une partie avec 2 à 8 joueurs.
- Tableau de scores sur 10 manches, avec saisie manuelle des points.
- Calcul automatique des totaux et classement des joueurs.
- Sauvegarde automatique des parties dans le navigateur.
- Historique des parties terminées et consultation des résultats.
- Export et import des sauvegardes au format JSON.

Les données sont stockées localement dans le navigateur. Aucun compte ni serveur n'est nécessaire.

## Technologies

- Angular
- TypeScript
- Tailwind CSS
- Vitest

## Installation et lancement

Prérequis : Node.js et npm.

Cloner le dépôt, puis installer les dépendances :

```bash
npm ci
```

Lancer le serveur de développement :

```bash
npm start
```

L'application est ensuite accessible à l'adresse `http://localhost:4200/`.

## Vérifications

Exécuter les tests :

```bash
npm test
```

Vérifier le code avec ESLint :

```bash
npm run lint
```

Construire l'application pour la production :

```bash
npm run build
```
