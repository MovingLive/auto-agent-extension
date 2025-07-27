# 🤖 AutoAgent

Extension Chrome pour automatiser l'exécution de prompts récurrents dans Perplexity Comet.

## ✨ Nouvelle Interface Simplifiée

L'interface a été **complètement refonduite** pour une expérience utilisateur optimale :

### 🎯 Interface Ultra-Simple

- **Une seule page** : fini les onglets complexes
- **3 champs seulement** :
  1. Nom de la tâche
  2. Fréquence (nombre + unité)
  3. Prompt
- **Gestion intuitive** : liste des tâches avec actions directes

### 📅 Planification Simplifiée

- Saisissez juste **un nombre** et sélectionnez l'unité :
  - Minutes
  - Heures  
  - Jours
  - Semaines
- Exemples : "30 minutes", "2 heures", "1 jour", "1 semaine"

## 🚀 Installation

1. Téléchargez l'extension ou clonez ce repo
2. Ouvrez Chrome et allez dans `chrome://extensions/`
3. Activez le "Mode développeur"
4. Cliquez sur "Charger l'extension non empaquetée"
5. Sélectionnez le dossier de l'extension

## 💡 Utilisation

### Créer une tâche

1. Cliquez sur l'icône de l'extension
2. Saisissez un nom pour votre tâche
3. Définissez la fréquence (ex: "30 minutes")
4. Écrivez votre prompt
5. Cliquez sur "Créer la tâche"

### Gérer vos tâches

- **Pause/Reprise** : Cliquez sur ⏸️ ou ▶️
- **Suppression** : Cliquez sur 🗑️
- **Actualisation** : Cliquez sur 🔄

## 🔧 Architecture Technique

### Scripts principaux

- `popup.html/js/css` : Interface utilisateur simplifiée
- `background.js` : Gestion des alarmes et planification
- `content.js` : Injection dans les pages Comet
- `manifest.json` : Configuration de l'extension

### Fonctionnalités

- ✅ Interface ultra-simplifiée
- ✅ Planification flexible (minutes à semaines)
- ✅ Gestion pause/reprise des tâches
- ✅ Stockage persistant des tâches
- ✅ Notifications de statut
- ✅ Responsive design

## 🎨 Nouvelle Expérience Utilisateur

### Avant (complexe)

- Multiple onglets
- Options avancées
- Modes de planification confus
- Interface surchargée

### Après (simple)

- Une seule vue
- 3 champs essentiels
- Sélection directe d'unité
- Design épuré et moderne

## 🛠️ Développement

```bash
# Construire l'extension
./build.sh

# Structure des fichiers
├── popup.html          # Interface principale
├── popup.js            # Logique de l'interface  
├── popup.css           # Styles modernes
├── background.js       # Service worker
├── content.js          # Injection Comet
└── manifest.json       # Configuration
```

## 📱 Responsive Design

L'interface s'adapte automatiquement à différentes tailles d'écran et respecte les préférences d'accessibilité.

## 🎯 Philosophie

**Simplicité avant tout** : L'utilisateur doit pouvoir créer une tâche en moins de 30 secondes sans réfléchir à la complexité technique.

---

*Extension optimisée pour Perplexity Comet • Interface redesignée en 2025*
