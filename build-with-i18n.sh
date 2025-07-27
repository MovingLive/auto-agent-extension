#!/bin/bash

echo "🚀 Build complet AutoAgent avec support multilingue"
echo "=================================================="

# 1. Synchroniser tous les fichiers
echo "📁 Synchronisation des fichiers..."
./sync.sh

# 2. Vérifier la structure
echo ""
echo "📋 Structure de l'extension :"
ls -la auto-agent-extension/

# 3. Vérifier que les traductions sont présentes
echo ""
echo "🌍 Vérification du système de traduction :"
if [ -f "auto-agent-extension/i18n.js" ]; then
    echo "✅ i18n.js présent"
    echo "📝 Langues supportées :"
    grep -o '"[a-z]*": {' auto-agent-extension/i18n.js | sed 's/[": {]//g' | sed 's/^/   - /'
else
    echo "❌ i18n.js manquant !"
    exit 1
fi

# 4. Vérifier que popup.html contient les boutons de langue
echo ""
echo "🎨 Vérification de l'interface :"
if grep -q "language-btn" auto-agent-extension/popup.html; then
    echo "✅ Boutons de langue présents dans popup.html"
else
    echo "❌ Boutons de langue manquants !"
    exit 1
fi

if grep -q "data-i18n" auto-agent-extension/popup.html; then
    echo "✅ Attributs de traduction présents"
else
    echo "❌ Attributs de traduction manquants !"
    exit 1
fi

# 5. Vérifier que popup.js utilise les traductions
echo ""
echo "⚙️  Vérification du JavaScript :"
if grep -q "window.i18n" auto-agent-extension/popup.js; then
    echo "✅ Système de traduction intégré dans popup.js"
else
    echo "❌ Système de traduction non intégré !"
    exit 1
fi

# 5.1. Vérifier la détection automatique
if grep -q "detectBrowserLanguage" auto-agent-extension/i18n.js; then
    echo "✅ Détection automatique de langue activée"
else
    echo "❌ Détection automatique manquante !"
    exit 1
fi

# 6. Vérifier les styles CSS pour les boutons de langue
echo ""
echo "🎨 Vérification des styles :"
if grep -q "language-btn" auto-agent-extension/popup.css; then
    echo "✅ Styles pour les boutons de langue présents"
else
    echo "❌ Styles pour les boutons de langue manquants !"
    exit 1
fi

# 7. Créer le package final
echo ""
echo "📦 Création du package final :"
if [ -f "auto-agent-extension-v1.0.0.zip" ]; then
    echo "✅ Package ZIP créé : auto-agent-extension-v1.0.0.zip"
    echo "📏 Taille : $(du -h auto-agent-extension-v1.0.0.zip | cut -f1)"
else
    echo "❌ Échec de la création du package !"
    exit 1
fi

echo ""
echo "🎉 Build terminé avec succès !"
echo ""
echo "📖 Instructions d'installation :"
echo "   1. Ouvrir Chrome"
echo "   2. Aller dans chrome://extensions/"
echo "   3. Activer le 'Mode développeur'"
echo "   4. Cliquer sur 'Charger l'extension non empaquetée'"
echo "   5. Sélectionner le dossier 'auto-agent-extension'"
echo ""
echo "🌍 Fonctionnalités multilingues :"
echo "   - Détection automatique de la langue du navigateur"
echo "   - Boutons 🇫🇷 🇬🇧 en haut à droite"
echo "   - Changement instantané de langue"
echo "   - Sauvegarde automatique de la préférence"
echo "   - Notification discrète lors de la première utilisation"
echo ""
echo "🧪 Tests recommandés :"
echo "   - Ouvrir test-auto-detection.html dans un navigateur"
echo "   - Tester la détection automatique et la persistance"
echo "   - Changer manuellement de langue et vérifier la sauvegarde"
