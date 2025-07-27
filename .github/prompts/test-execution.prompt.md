---
mode: 'agent'
description: 'Agent autonome pour exécuter et corriger les tests unitaires avec l outil intégré VSCode'
---

# Agent d'exécution et correction des tests unitaires

## Mission
Utiliser l'outil de test intégré de VSCode (`run_tests`) pour exécuter tous les tests unitaires du projet, analyser les échecs, et corriger automatiquement les tests défaillants en maintenant la couverture de code et la qualité.

## Workflow d'exécution

### 1. Exécution initiale avec l'outil VSCode
```
Utiliser le tool run_tests de VSCode pour lancer tous les tests
```

### 2. Analyse des résultats
- **Identifier** les tests qui échouent avec leurs messages d'erreur
- **Classer** les échecs par catégorie :
  - Erreurs de syntaxe ou d'import
  - Assertions incorrectes
  - Mocks/stubs défaillants
  - Problèmes d'environnement de test
  - Tests obsolètes suite à des changements de code

### 4. Stratégie de correction par priorité

#### 🔴 Priorité 1 : Erreurs critiques
- **Imports manquants** ou chemins incorrects
- **Syntaxe invalide** dans les tests
- **Dépendances manquantes** pour les tests

#### 🟡 Priorité 2 : Assertions défaillantes
- **Valeurs attendues** obsolètes
- **Types de retour** modifiés
- **Structure d'objets** changée

#### 🟢 Priorité 3 : Optimisations
- **Mocks** à mettre à jour
- **Tests lents** à optimiser
- **Couverture** à améliorer

## Corrections automatiques par type d'erreur

### Tests TypeScript/JavaScript (Jest, Vitest)

#### Erreurs d'import
```typescript
// Avant (erreur)
import { oldFunction } from './deprecated'

// Après (corrigé)
import { newFunction } from './updated-module'
```

#### Assertions échouées
```typescript
// Analyser le code source pour comprendre le comportement attendu
// Mettre à jour les assertions en conséquence
expect(result).toBe(expectedValue) // Corriger expectedValue
```

#### Mocks obsolètes
```typescript
// Vérifier les signatures des fonctions mockées
// Mettre à jour les mocks selon les nouvelles interfaces
```

### Tests Python (Pytest, Unittest)

#### Imports et modules
```python
# Corriger les imports selon la structure actuelle du projet
from app.services import updated_service
```

#### Fixtures et setup
```python
# Mettre à jour les fixtures selon les nouveaux modèles de données
@pytest.fixture
def updated_fixture():
    return new_data_structure()
```

## Vérifications post-correction

### 1. Re-exécution complète
```
Relancer run_tests pour vérifier que toutes les corrections sont effectives
```

### 2. Analyse de la couverture
- **Vérifier** que la couverture de code n'a pas régressé
- **Identifier** les nouvelles lignes non couvertes
- **Ajouter** des tests si nécessaire pour maintenir le niveau de couverture

### 3. Performance des tests
- **Mesurer** le temps d'exécution total
- **Identifier** les tests lents (> 5 secondes)
- **Optimiser** si possible sans compromettre la qualité

### 4. Cohérence et maintenabilité
- **Standardiser** les patterns de test dans le projet
- **Éliminer** la duplication de code de test
- **Documenter** les tests complexes avec des commentaires

## Standards de qualité des tests

### Tests front-end (TypeScript/React)
- **Arrangement** : Setup clair des composants et props
- **Action** : Simulation d'interactions utilisateur réalistes
- **Assertion** : Vérification du comportement attendu
- **Cleanup** : Nettoyage approprié après chaque test

### Tests back-end (Python)
- **Isolation** : Tests indépendants sans effets de bord
- **Données** : Fixtures réutilisables et maintenues
- **Exceptions** : Tests des cas d'erreur et edge cases
- **Intégration** : Tests des interactions entre modules

## Gestion des cas complexes

### Tests flaky (instables)
1. **Identifier** les tests qui échouent de manière intermittente
2. **Analyser** les causes (timing, conditions de course, dépendances externes)
3. **Stabiliser** avec des attentes appropriées et des mocks

### Tests legacy (anciens)
1. **Évaluer** la pertinence des tests par rapport au code actuel
2. **Moderniser** la syntaxe et les patterns de test
3. **Supprimer** les tests redondants ou obsolètes

### Tests d'intégration
1. **Vérifier** la disponibilité des services externes
2. **Utiliser** des environnements de test appropriés
3. **Mocker** les dépendances externes si nécessaire

## Critères de validation finale

### ✅ Mission accomplie si :
- **100% des tests** passent avec succès
- **Couverture de code** maintenue ou améliorée
- **Temps d'exécution** des tests acceptable (< 5 min pour la suite complète)
- **Aucun test flaky** détecté
- **Documentation** des tests complexes mise à jour

## Rapport de synthèse

À la fin de l'exécution, fournir :
- **Statistiques** : Nombre de tests corrigés par catégorie
- **Performance** : Temps d'exécution avant/après optimisations
- **Couverture** : Pourcentage de couverture global et par module
- **Recommandations** : Actions préventives pour éviter les régressions futures

## Actions préventives recommandées

1. **Hooks de pré-commit** pour lancer les tests avant chaque commit
2. **CI/CD** avec exécution automatique des tests
3. **Revue de code** incluant systématiquement les tests
4. **Maintenance régulière** des tests avec le code de production
