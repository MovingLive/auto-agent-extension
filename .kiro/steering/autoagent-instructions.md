# 🤖 Instructions Kiro pour AutoAgent

## Vue d'ensemble

AutoAgent est une extension Chrome qui automatise l'exécution de prompts récurrents dans Perplexity Comet.
L'architecture est centrée sur le dossier `extension/` :

- `background.js` : Service worker, planification (Chrome Alarms), persistance (chrome.storage), communication inter-scripts.
- `content.js` : Injecté dans Comet, automatise la saisie/envoi de prompts. Les sélecteurs CSS sont critiques et doivent être centralisés ici.
- `popup.html` + `popup.js` : UI de gestion des tâches, communique avec `background.js` via `chrome.runtime.sendMessage`.
- `i18n.js` : Gestion multilingue.
- `manifest.json` : Permissions, points d'entrée, configuration.

## Architecture & Patterns

- **Communication** : Toujours via `chrome.runtime.sendMessage` (pas de direct access entre scripts).
- **Stockage** : Toutes les tâches sont persistées dans `chrome.storage` (jamais localStorage).
- **Sélecteurs CSS** : Centralisés et commentés dans `content.js` pour faciliter la maintenance lors des évolutions de l'UI Comet.
- **Tests** : Toute modification visuelle ou UX doit être validée par la suite Playwright (`tests/e2e/`), qui couvre : interface, planification, gestion des tâches, responsive, accessibilité, performance, layout, intégration, optimisation.
- **Helpers de test** : Utiliser `tests/helpers/extension-helper.js` pour la création de tâches, validation des modes, captures, etc.

## Workflows Développeur

- **Build** : Les fichiers d'extension sont dans `extension/`. Le packaging se fait via le workflow GitHub Actions `.github/workflows/cd.yml` (zip + release GitHub, upload Chrome Web Store optionnel).
- **Tests** :
  - `npm install && npx playwright install` pour l'installation.
  - `npm test` pour tous les tests, ou `./run-tests.sh` pour la suite complète avec reporting.
  - Les tests génèrent des captures dans `test-results/` pour la régression visuelle.
- **Debug** :
  - Utiliser la console Chrome (`F12`) sur Comet ou l'inspecteur d'extension.
  - Logs principalement dans la console.
  - Pour les tests : `npm run test:debug` ou `npm run test:ui`.

## Conventions spécifiques

- **Pas de code d'extension à la racine** : tout est dans `extension/`.
- **Pas de localStorage** : toujours `chrome.storage`.
- **Pas d'accès direct DOM entre scripts** : toujours via messaging.
- **Sélecteurs CSS** : documentés et factorisés dans `content.js`.
- **Versioning** : automatique via le workflow CI/CD.
- **Tests** : toute nouvelle fonctionnalité ou correction doit être couverte par un test Playwright.
- **Style** : Toute l'UI utilise Tailwind CSS (voir les classes utilitaires dans les fichiers HTML/JS). Privilégier les classes Tailwind pour toute nouvelle mise en forme ou adaptation responsive.

## Intégration & Dépendances

- **API Chrome** : alarms, storage, tabs, runtime, activeTab, host_permissions.
- **Perplexity Comet** : attention, l'UI peut changer, donc les sélecteurs doivent être maintenus à jour.
- **Playwright** : utilisé pour la validation visuelle, la régression, la performance et l'accessibilité.
- **Tailwind CSS** : utilisé pour tout le design et la responsivité de l'interface (voir `extension/popup.html`, `popup.js`).

## Fichiers clés de référence

# [[file:extension/background.js]] : Planification, gestion des tâches, communication.
# [[file:extension/content.js]] : Injection, automatisation Comet, sélecteurs CSS.
# [[file:extension/popup.js]] : Logique UI, gestion des interactions utilisateur.
# [[file:extension/manifest.json]] : Permissions, configuration.
# [[file:tests/e2e/extension.spec.js]] : Scénarios Playwright couvrant tous les aspects critiques.
# [[file:tests/helpers/extension-helper.js]] : Fonctions utilitaires pour les tests.

## Limitations & précautions

- L'extension ne fonctionne que si Chrome/Comet est ouvert.
- Les sélecteurs CSS peuvent devenir obsolètes si l'UI Comet évolue.
- Respecter les limites d'usage de Perplexity.
- Toujours valider les changements visuels par la suite Playwright.

## Contraintes importantes

- Après chaque modification visuelle, utiliser les outils MCP Playwright pour valider que les changements sont corrects.
- Documenter les changements dans les tests Playwright correspondants.
- Toujours tester l'extension dans un environnement Chrome réel avant de valider les modifications.
- Maintenir la compatibilité avec les différentes versions de l'UI Perplexity Comet.

## Instructions spécifiques pour Kiro

- Quand tu modifies du code dans `extension/`, assure-toi de respecter l'architecture de communication via messages.
- Pour les tests, utilise toujours les helpers existants dans `tests/helpers/extension-helper.js`.
- Avant de proposer des modifications visuelles, vérifie les classes Tailwind existantes dans les fichiers HTML/JS.
- Si tu dois modifier des sélecteurs CSS, centralise-les dans `content.js` avec des commentaires explicatifs.
- Toute nouvelle fonctionnalité doit être accompagnée de tests Playwright correspondants.

---

Ce fichier guide Kiro dans le développement et la maintenance d'AutoAgent. Mets-le à jour lors de modifications majeures de l'architecture.
