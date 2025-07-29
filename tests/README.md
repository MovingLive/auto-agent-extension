# Tests Playwright pour AutoAgent Extension

Cette suite de tests valide l'interface utilisateur de l'extension AutoAgent Chrome avec Playwright.

## 🎯 Objectifs des tests

Les tests couvrent tous les aspects de l'interface que nous avons optimisée précédemment :

- ✅ **Interface de base** : Chargement, affichage, structure HTML
- ✅ **Système de planification** : Navigation entre modes heures/jours/semaines
- ✅ **Gestion des tâches** : Création, validation, gestion des formulaires
- ✅ **Responsive & Accessibilité** : Design adaptatif, navigation clavier
- ✅ **Performance & Stabilité** : Tests de charge, interactions rapides
- ✅ **Tests visuels** : Layout, alignement, positionnement dans les conteneurs
- ✅ **Intégration** : Workflows complets, tests de régression

## 🚀 Installation et configuration

```bash
# Installer les dépendances
npm install

# Installer les navigateurs Playwright
npx playwright install
```

## 🧪 Commandes de test

```bash
# Lancer tous les tests
npm test

# Interface de test interactive
npm run test:ui

# Tests avec navigateur visible
npm run test:headed

# Mode debug
npm run test:debug

# Afficher le rapport
npm run test:report
```

## 📁 Structure des tests

```
tests/
├── playwright.config.js          # Configuration Playwright
├── global-setup.js              # Configuration globale
├── global-teardown.js           # Nettoyage global
├── helpers/
│   └── test-utils.js            # Utilitaires helper
└── e2e/
    ├── 01-interface-base.spec.js        # Tests de base
    ├── 02-schedule-system.spec.js       # Système de planification
    ├── 03-task-management.spec.js       # Gestion des tâches
    ├── 04-responsive-accessibility.spec.js # Responsive & A11y
    ├── 05-performance-stability.spec.js # Performance
    ├── 06-visual-layout.spec.js         # Tests visuels
    └── 07-integration.spec.js           # Tests d'intégration
```

## 🎯 Tests spécifiques aux optimisations réalisées

### Tests de positionnement dans les conteneurs

Les tests vérifient que notre correction du problème de positionnement fonctionne :

```javascript
// Validation que les configurations restent dans le cadre bordé
test('should maintain configurations inside the bordered container', async ({ page }) => {
  // Teste chaque mode (heures/jours/semaines)
  // Vérifie que les configurations sont bien dans le conteneur .schedule-configurations
});
```

### Tests d'alignement vertical

Vérifie que l'alignement parfait que nous avons atteint est maintenu :

```javascript
// Validation de l'alignement vertical entre modes
test('should maintain consistent vertical alignment', async ({ page }) => {
  // Vérifie que toutes les configurations ont la même position Y
});
```

### Tests de compacité et optimisation d'espace

Valide les optimisations d'espace que nous avons implémentées :

```javascript
// Tests des boutons compacts et de l'intégration dans le conteneur
test('should have hours mode active by default', async ({ page }) => {
  // Vérifie l'affichage compact et l'organisation optimisée
});
```

## 📊 Résultats et captures d'écran

Les tests génèrent des captures d'écran dans `test-results/` :

- `interface-base.png` : Vue d'ensemble de l'interface
- `schedule-*-mode.png` : Chaque mode de planification
- `container-positioning-*.png` : Validation du positionnement
- `mobile-viewport.png` : Affichage mobile
- `baseline-*.png` : Références visuelles pour la régression

## 🔍 Tests de régression visuelle

Les tests incluent une validation visuelle complète :

```javascript
// Capture de référence pour tous les modes
test('should capture visual regression baseline', async ({ page }) => {
  await captureAllModes(page, 'baseline');
});
```

## 🏗️ Helpers et utilitaires

Le fichier `helpers/test-utils.js` fournit des fonctions réutilisables :

- `createTestTask()` : Création rapide de tâches de test
- `validateAllScheduleModes()` : Validation de tous les modes
- `captureAllModes()` : Captures d'écran systématiques
- `validateHTMLStructure()` : Validation de la structure HTML
- `cleanupTestData()` : Nettoyage entre tests

## 🎨 Tests de performance

Les tests incluent des métriques de performance :

```javascript
// Mesure du temps de chargement
test('should load within acceptable time', async ({ page }) => {
  // Vérifie que l'interface se charge en moins de 2 secondes
});

// Test de stress avec interactions rapides
test('should handle rapid mode switching', async ({ page }) => {
  // 10 changements de mode rapides
});
```

## 🌐 Tests multi-navigateurs

Configuration pour tester sur :

- ✅ Chromium (Chrome/Edge)
- ✅ Firefox
- ✅ Mobile Chrome
- ⚠️ Safari/WebKit (optionnel selon l'environnement)

## 📋 Checklist des tests

- [x] Chargement de l'interface
- [x] Navigation entre modes de planification
- [x] Positionnement dans les conteneurs
- [x] Alignement vertical parfait
- [x] Responsive design
- [x] Accessibilité clavier
- [x] Performance de chargement
- [x] Stabilité sous stress
- [x] Rendu des icônes et émojis
- [x] Gestion des débordements de texte
- [x] Workflows complets utilisateur

## 🐛 Debugging

En cas d'échec de test :

1. Utiliser `npm run test:debug` pour le mode debug
2. Consulter les captures d'écran dans `test-results/`
3. Utiliser `npm run test:ui` pour l'interface interactive
4. Vérifier les logs de console dans les résultats

## 🔄 Intégration continue

Les tests sont configurés pour :

- Retry automatique en cas d'échec (2 tentatives)
- Génération de rapports HTML
- Captures d'écran automatiques en cas d'échec
- Traces de débogage pour les échecs

## 📈 Métriques surveillées

- Temps de chargement < 2 secondes
- Transitions entre modes < 500ms
- Stabilité sur 50+ interactions rapides
- Compatibilité viewport mobile/tablette/desktop
- Score d'accessibilité clavier

Ces tests garantissent que toutes nos optimisations d'interface restent fonctionnelles et que l'expérience utilisateur demeure excellente !
