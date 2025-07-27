# 🌍 Système de traduction AutoAgent

## Vue d'ensemble

L'extension AutoAgent prend maintenant en charge deux langues :
- 🇫🇷 **Français** (langue par défaut)
- 🇬🇧 **Anglais**

## Fonctionnalités

### Interface utilisateur
- **Boutons de langue** : Deux petits boutons en haut à droite permettent de basculer facilement entre français et anglais
- **Traduction automatique** : Tous les textes de l'interface sont traduits instantanément
- **Persistance** : La langue choisie est sauvegardée et restaurée au redémarrage

### Éléments traduits
- Tous les textes de l'interface utilisateur
- Les messages de notification
- Les tooltips des boutons
- Les descriptions de fréquence des tâches
- Les statuts des tâches (Actif/En pause)

## Architecture technique

### Fichiers ajoutés
- `i18n.js` : Système de traduction complet

### Fichiers modifiés
- `popup.html` : Ajout des boutons de langue et attributs de traduction
- `popup.css` : Styles pour les boutons de langue
- `popup.js` : Intégration du système de traduction

### Système de traduction

#### Structure des traductions
```javascript
translations = {
    fr: {
        appTitle: '🤖 AutoAgent',
        newTask: '➕ Nouvelle tâche',
        // ... autres traductions
    },
    en: {
        appTitle: '🤖 AutoAgent',
        newTask: '➕ New task',
        // ... autres traductions
    }
}
```

#### Utilisation
```javascript
// Traduction simple
window.i18n.t('newTask')

// Traduction avec paramètres
window.i18n.t('activeTasksCount', { count: 5 })

// Description de fréquence
window.i18n.getFrequencyDescription(2, 'hours')
```

#### Attributs HTML
```html
<!-- Traduction du contenu -->
<h1 data-i18n="appTitle">🤖 AutoAgent</h1>

<!-- Traduction du placeholder -->
<input data-i18n="taskNamePlaceholder" placeholder="Ex: Daily news check">

<!-- Traduction du tooltip -->
<button data-i18n-title="editTooltip" title="Edit">✏️</button>
```

### Gestion des événements
- **Changement de langue** : Événement `languageChanged` diffusé lors du changement
- **Mise à jour automatique** : L'interface se met à jour automatiquement
- **Persistance** : Sauvegarde dans `chrome.storage.local`

### Comportements spéciaux
- **Tâches existantes** : Les descriptions de fréquence sont automatiquement mises à jour
- **Fallback** : Si une traduction manque en anglais, retour au français
- **Pluralisation** : Gestion intelligente du singulier/pluriel pour les fréquences

## Usage

### Pour l'utilisateur
1. Cliquer sur 🇫🇷 ou 🇬🇧 en haut à droite
2. L'interface change instantanément de langue
3. La préférence est sauvegardée automatiquement

### Pour le développeur
1. Ajouter les nouvelles clés dans `i18n.js`
2. Utiliser `data-i18n` ou `window.i18n.t()` pour les traductions
3. Tester dans les deux langues

## Extensions futures possibles
- Ajout d'autres langues (espagnol, allemand, etc.)
- ~~Détection automatique de la langue du navigateur~~ ✅ **IMPLÉMENTÉ**
- Traduction des prompts utilisateur
- Export/import des traductions

## 🌍 Détection Automatique de Langue (NOUVEAU)

### Fonctionnement
- **Première utilisation** : L'extension détecte automatiquement la langue du navigateur
- **Langues supportées** : Français et anglais
- **Fallback intelligent** : Si la langue du navigateur n'est pas supportée, utilise le français par défaut
- **Notification discrète** : Informe l'utilisateur de la détection avec une notification élégante

### Logique de détection
1. **Langue principale** : `navigator.language` (ex: 'fr-FR' → 'fr')
2. **Langues acceptées** : `navigator.languages` si la principale n'est pas supportée
3. **Fallback** : Français par défaut

### Persistance intelligente
- **Auto-détection** : Uniquement à la première utilisation
- **Choix manuel** : Priorité absolue - jamais remplacé par l'auto-détection
- **Réinitialisation** : Fonction `resetLanguageDetection()` pour les tests

### API pour développeurs
```javascript
// Obtenir des informations détaillées
const info = await window.i18n.getLanguageInfo();
// Retourne : { currentLanguage, browserLanguage, isAutoDetected, isManuallySet, ... }

// Réinitialiser pour tests
await window.i18n.resetLanguageDetection();

// Détecter manuellement
const detected = window.i18n.detectBrowserLanguage();
```
