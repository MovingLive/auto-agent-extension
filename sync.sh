#!/bin/bash

# Script pour synchroniser les fichiers modifiés vers auto-agent-extension

echo "🔄 Synchronisation des fichiers vers auto-agent-extension..."

# Copier les fichiers principaux
cp popup.html auto-agent-extension/
cp popup.css auto-agent-extension/
cp popup.js auto-agent-extension/
cp i18n.js auto-agent-extension/
cp background.js auto-agent-extension/
cp content.js auto-agent-extension/
cp manifest.json auto-agent-extension/

echo "✅ Synchronisation terminée!"
echo "🌍 Détection automatique de langue activée!"

# Générer le ZIP
echo "📦 Génération du package ZIP..."
cd auto-agent-extension
zip -r ../auto-agent-extension-v1.0.0.zip . -x "*.DS_Store"
cd ..

echo "🎉 Package auto-agent-extension-v1.0.0.zip généré avec succès!"
echo ""
echo "🧪 Tests disponibles:"
echo "   - test-translation.html (test manuel de traduction)"
echo "   - test-auto-detection.html (test de détection automatique)"
