
# 🤖 Copilot Instructions for AutoAgent

## Vue d'ensemble

AutoAgent est une extension Chrome qui automatise l’exécution de prompts récurrents dans Perplexity Comet.
L’architecture est centrée sur le dossier `extension/` :
- `background.js` : Service worker, planification (Chrome Alarms), persistance (chrome.storage), communication inter-scripts.
- `content.js` : Injecté dans Comet, automatise la saisie/envoi de prompts. Les sélecteurs CSS sont critiques et doivent être centralisés ici.
- `popup.html` + `popup.js` : UI de gestion des tâches, communique avec `background.js` via `chrome.runtime.sendMessage`.
- `i18n.js` : Gestion multilingue.
- `manifest.json` : Permissions, points d’entrée, configuration.

## Architecture & Patterns

- **Communication** : Toujours via `chrome.runtime.sendMessage` (pas de direct access entre scripts).
- **Stockage** : Toutes les tâches sont persistées dans `chrome.storage` (jamais localStorage).
- **Sélecteurs CSS** : Centralisés et commentés dans `content.js` pour faciliter la maintenance lors des évolutions de l’UI Comet.
- **Tests** : Toute modification visuelle ou UX doit être validée par la suite Playwright (`tests/e2e/`), qui couvre : interface, planification, gestion des tâches, responsive, accessibilité, performance, layout, intégration, optimisation.
- **Helpers de test** : Utiliser `tests/helpers/test-utils.js` pour la création de tâches, validation des modes, captures, etc.

## Workflows Développeur

- **Build** : Les fichiers d’extension sont dans `extension/`. Le packaging se fait via le workflow GitHub Actions `.github/workflows/cd.yml` (zip + release GitHub, upload Chrome Web Store optionnel).
- **Tests** :
  - `npm install && npx playwright install` pour l’installation.
  - `npm test` pour tous les tests, ou `./run-tests.sh` pour la suite complète avec reporting.
  - Les tests génèrent des captures dans `test-results/` pour la régression visuelle.
- **Debug** :
  - Utiliser la console Chrome (`F12`) sur Comet ou l’inspecteur d’extension.
  - Logs principalement dans la console.
  - Pour les tests : `npm run test:debug` ou `npm run test:ui`.

## Conventions spécifiques

- **Pas de code d’extension à la racine** : tout est dans `extension/`.
- **Pas de localStorage** : toujours `chrome.storage`.
- **Pas d’accès direct DOM entre scripts** : toujours via messaging.
- **Sélecteurs CSS** : documentés et factorisés dans `content.js`.
- **Versioning** : automatique via le workflow CI/CD.
- **Tests** : toute nouvelle fonctionnalité ou correction doit être couverte par un test Playwright.

- **Style** : Toute l’UI utilise Tailwind CSS (voir les classes utilitaires dans les fichiers HTML/JS). Privilégier les classes Tailwind pour toute nouvelle mise en forme ou adaptation responsive.

## Intégration & Dépendances

- **API Chrome** : alarms, storage, tabs, runtime, activeTab, host_permissions.
- **Perplexity Comet** : attention, l’UI peut changer, donc les sélecteurs doivent être maintenus à jour.
- **Playwright** : utilisé pour la validation visuelle, la régression, la performance et l’accessibilité.

- **Tailwind CSS** : utilisé pour tout le design et la responsivité de l’interface (voir `extension/popup.html`, `popup.js`).

## Exemples de fichiers clés

- `extension/background.js` : Planification, gestion des tâches, communication.
- `extension/content.js` : Injection, automatisation Comet, sélecteurs CSS.
- `extension/popup.js` : Logique UI, gestion des interactions utilisateur.
- `extension/manifest.json` : Permissions, configuration.
- `tests/e2e/` : Scénarios Playwright couvrant tous les aspects critiques.
- `tests/helpers/test-utils.js` : Fonctions utilitaires pour les tests.

## Limitations & précautions

- L’extension ne fonctionne que si Chrome/Comet est ouvert.
- Les sélecteurs CSS peuvent devenir obsolètes si l’UI Comet évolue.
- Respecter les limites d’usage de Perplexity.
- Toujours valider les changements visuels par la suite Playwright.

---

Pour toute modification majeure, mettez à jour ce fichier pour guider les futurs agents IA.
