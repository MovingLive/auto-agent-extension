---
mode: 'agent'
description: 'Agent autonome pour corriger les problèmes de linting front-end et back-end avec vérifications complètes'
---

# Agent de correction automatique du linting

## Mission
Corriger de manière **autonome et exhaustive** tous les problèmes de linting détectés dans le projet, côté front-end (TypeScript/JavaScript) et back-end (Python), en appliquant les meilleures pratiques et en vérifiant l'intégrité du code après corrections.

## Contexte du projet
- **Front-end** : Application TypeScript/JavaScript dans `/Users/stevemagne/workspace/moving-live/frontend`
- **Back-end** : Application Python avec Poetry dans `/Users/stevemagne/workspace/moving-live/app`
- Référence des standards : [Instructions du projet](.github/copilot-instructions.md)

## Workflow Front-end (TypeScript/JavaScript)

### 1. Diagnostic initial
```bash
cd /Users/stevemagne/workspace/moving-live/frontend
npm run lint
```

### 2. Corrections automatiques (par ordre de priorité)
```bash
# Correction automatique des erreurs de linting
npm run lint -- --fix

# Formatage automatique du code
npm run format

# Vérification des types TypeScript
npm run typecheck
```

### 3. Vérifications d'intégrité post-correction
```bash
# Tests unitaires
npm run test

# Compilation sans erreurs
npm run build

# Vérification du démarrage de l'application
npm run start
```

### 4. Corrections manuelles si nécessaire
Si des erreurs persistent après les corrections automatiques :
- Analyser chaque erreur individuellement
- Appliquer les corrections conformément aux standards du projet
- Respecter les conventions TypeScript/JavaScript définies
- Maintenir la compatibilité avec l'existant

## Workflow Back-end (Python)

### 1. Diagnostic initial
```bash
cd /Users/stevemagne/workspace/moving-live/
poetry run ruff check --nofix
```

### 2. Corrections automatiques
```bash
# Correction automatique avec Ruff
poetry run ruff check --fix

# Formatage du code (si Black est configuré)
poetry run ruff format
```

### 3. Lister les erreurs à corriger au travers de l'agent GitHub Copilot
```bash
# Vérification des types Python
poetry run ruff check --no-fix
```

### 4. Corriger les erreurs reportée

## Standards de codage à appliquer

### Front-end
- **TypeScript** : Types stricts, pas de `any`, interfaces explicites
- **React** : Composants fonctionnels avec hooks, props typées
- **Conventions de nommage** : PascalCase pour composants, camelCase pour variables
- **Imports** : Organisation alphabétique, chemins relatifs cohérents
- **Gestion d'erreurs** : Try/catch pour opérations async, error boundaries React

### Back-end
- **Python** : PEP 8, type hints obligatoires, docstrings
- **Imports** : Ordre isort, pas d'imports inutilisés
- **Variables** : snake_case, constantes en UPPER_CASE
- **Gestion d'erreurs** : Exceptions explicites, logging approprié

## Critères de réussite

### ✅ Front-end validé si :
- `npm run lint` : 0 erreur, 0 warning
- `npm run typecheck` : 0 erreur de types
- `npm run test` : Tous les tests passent
- `npm run build` : Compilation réussie
- `npm run start` : Application démarrable

### ✅ Back-end validé si :
- `poetry run ruff check` : 0 erreur
- `poetry run mypy .` : 0 erreur de types
- `poetry run pytest` : Tous les tests passent
- `poetry check` : Dépendances valides

## Instructions d'exécution

1. **Toujours** commencer par un diagnostic complet des deux environnements
2. **Prioriser** les corrections automatiques avant les corrections manuelles
3. **Vérifier** systématiquement l'intégrité après chaque correction
4. **Respecter** les standards définis dans `.github/copilot-instructions.md`
5. **Documenter** les corrections complexes avec des commentaires explicites
6. **Tester** le fonctionnement de l'application après toutes les corrections

## Gestion des erreurs critiques

Si une correction automatique casse des fonctionnalités :
1. **Annuler** la correction problématique (git checkout)
2. **Analyser** l'erreur en détail
3. **Appliquer** une correction manuelle ciblée
4. **Re-tester** l'intégrité complète

## Rapport final attendu

À la fin de l'exécution, fournir :
- Nombre total d'erreurs corrigées (front-end + back-end)
- Liste des corrections non-automatisables effectuées
- Statut des vérifications d'intégrité
- Recommandations pour éviter la réapparition des erreurs
