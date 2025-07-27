---
mode: 'agent'
description: 'Augmente la couverture de tests unitaires du projet'
---
# Amélioration de la couverture de tests

## Objectif
Augmenter la couverture des tests automatiques en ajoutant des tests unitaires pour les fonctions non couvertes ou en complétant les cas de tests manquants.

## Instructions
1. Analyse la couverture de tests actuelle:
```sh
cd /Users/stevemagne/workspace/moving-live/frontend && npx vitest run --coverage
```

2. Identifie les zones prioritaires:
   - Fonctions sans tests
   - Composants critiques avec faible couverture
   - Chemins conditionnels non testés (branches)

3. Ajoute de nouveaux tests pour:
   - Cas normaux (happy path)
   - Cas limites et valeurs extremes
   - Gestion des erreurs

4. Assure-toi que les nouveaux tests:
   - Suivent la structure AAA (Arrange, Act, Assert)
   - Utilisent correctement les mocks et les stubs
   - Sont maintenables et compréhensibles

5. Vérifie l'amélioration de la couverture:
```sh
npx vitest run --coverage
```

## Référence aux standards
Applique les standards de test définis dans [les instructions Vitest](.github/instructions/vitest.instructions.md) et les [instructions de projet](.github/copilot-instructions.md).
