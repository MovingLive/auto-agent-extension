# 🤖 Copilot Instructions for comet-cron-extension

## Vue d'ensemble

Cette extension Chrome automatise l'exécution de prompts récurrents dans Perplexity Comet. Elle s'appuie sur quatre scripts principaux : `background.js` (gestion des alarmes et tâches), `content.js` (injection et interaction avec Comet), `popup.js`/`popup.html` (UI de gestion des tâches), et `manifest.json` (configuration de l'extension).

## Consigne

ne modifie rien dans le repertoire `./comet-cron-extension` c'est un dossier généré pour créer l'extension Chrome.

## Architecture & Flux
- **background.js** : Service worker qui gère la planification (API Chrome Alarms), la persistance des tâches (API Storage), et la communication avec les autres scripts.
- **content.js** : Injecté dans les pages Comet, il automatise la saisie et l'envoi des prompts. Les sélecteurs CSS sont adaptés à l'UI Comet : modifiez-les ici si l'interface change.
- **popup.js / popup.html** : Interface utilisateur pour créer, visualiser, supprimer et actualiser les tâches. Communique avec `background.js` via `chrome.runtime`.
- **manifest.json** : Définit les permissions (storage, tabs, alarms, activeTab, host_permissions) et les points d'entrée.

## Workflows Développeur
- **Build/Packaging** : Utilisez `build.sh` pour zipper l'extension (`comet-cron-extension-v1.0.0.zip`).
- **Installation locale** : Chargez le dossier via `chrome://extensions/` en mode développeur.
- **Debug** : Utilisez la console Chrome (`F12`) sur les pages Comet et dans l'inspecteur d'extension pour diagnostiquer les problèmes. Les logs sont principalement dans la console.
- **Mise à jour** : Remplacez les fichiers, puis rechargez l'extension dans Chrome. Les tâches existantes sont préservées.

## Conventions & Patterns
- **Pas de framework** : Vanilla JS/HTML/CSS, pas de build complexe.
- **Communication** : Utilisez `chrome.runtime.sendMessage` pour les échanges entre scripts.
- **Stockage** : Toutes les tâches sont persistées via `chrome.storage`.
- **Sélecteurs CSS** : Centralisez et commentez les sélecteurs dans `content.js` pour faciliter la maintenance.
- **Pas de tests automatisés** : Les tests sont manuels via l'UI et la console.

## Points d'intégration & dépendances
- **API Chrome** : alarms, storage, tabs, runtime, activeTab, host_permissions.
- **Perplexity Comet** : L'extension dépend de l'UI Comet, sujette à changement.

## Exemples de fichiers clés
- `background.js` : Planification et gestion des tâches
- `content.js` : Injection et automatisation sur Comet
- `popup.js` : Logique UI
- `manifest.json` : Permissions et configuration

## Limitations & précautions
- L'extension ne fonctionne que si Chrome/Comet est ouvert.
- Les sélecteurs CSS peuvent devenir obsolètes si l'UI Comet change.
- Respectez les limites d'usage de Perplexity.

---

Pour toute modification majeure, mettez à jour ce fichier pour guider les futurs agents IA.
