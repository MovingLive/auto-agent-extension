#!/bin/bash

# Script de construction pour l'extension AutoAgent
# Ce script automatise la création du package d'extension

echo "🚀 Construction de l'extension AutoAgent..."

# Créer le dossier de build
BUILD_DIR="auto-agent-extension"
if [ -d "$BUILD_DIR" ]; then
    echo "📁 Suppression du dossier existant..."
    rm -rf "$BUILD_DIR"
fi

echo "📁 Création du dossier de build..."
mkdir "$BUILD_DIR"
mkdir "$BUILD_DIR/icons"

# Copier les fichiers principaux
echo "📄 Copie des fichiers..."
cp manifest.json "$BUILD_DIR/"
cp popup.html "$BUILD_DIR/"
cp popup.js "$BUILD_DIR/"
cp popup.css "$BUILD_DIR/"
cp background.js "$BUILD_DIR/"
cp content.js "$BUILD_DIR/"
cp README.md "$BUILD_DIR/"

# Créer des icônes temporaires si elles n'existent pas
if [ ! -f "icons/icon16.png" ]; then
    echo "🎨 Création d'icônes temporaires..."
    
    # Créer des icônes SVG temporaires et les convertir (nécessite ImageMagick)
    if command -v convert >/dev/null 2>&1; then
        # Créer un SVG temporaire
        cat > temp_icon.svg << 'EOF'
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="20" fill="url(#grad)"/>
  <text x="64" y="70" font-family="Arial, sans-serif" font-size="60" fill="white" text-anchor="middle">⏰</text>
</svg>
EOF
        
        # Convertir en PNG aux différentes tailles
        convert temp_icon.svg -resize 16x16 "$BUILD_DIR/icons/icon16.png"
        convert temp_icon.svg -resize 48x48 "$BUILD_DIR/icons/icon48.png"
        convert temp_icon.svg -resize 128x128 "$BUILD_DIR/icons/icon128.png"
        
        rm temp_icon.svg
        echo "✅ Icônes créées avec succès"
    else
        echo "⚠️  ImageMagick non trouvé. Création d'icônes placeholder..."
        # Créer des fichiers placeholder
        touch "$BUILD_DIR/icons/icon16.png"
        touch "$BUILD_DIR/icons/icon48.png"
        touch "$BUILD_DIR/icons/icon128.png"
    fi
else
    echo "📄 Copie des icônes existantes..."
    cp icons/* "$BUILD_DIR/icons/"
fi

# Créer un fichier de version
echo "📝 Création du fichier de version..."
cat > "$BUILD_DIR/VERSION" << EOF
Version: 1.0.0
Date de build: $(date)
Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "N/A")
EOF

# Créer un script d'installation
echo "📜 Création du script d'installation..."
cat > "$BUILD_DIR/install.sh" << 'EOF'
#!/bin/bash
echo "🚀 Installation de l'extension AutoAgent"
echo ""
echo "📋 Instructions d'installation :"
echo "1. Ouvrez Chrome ou Comet"
echo "2. Allez dans chrome://extensions/ ou comet://extensions/"
echo "3. Activez le 'Mode développeur'"
echo "4. Cliquez sur 'Charger l'extension non empaquetée'"
echo "5. Sélectionnez ce dossier"
echo ""
echo "✅ Prêt pour l'installation !"
EOF

chmod +x "$BUILD_DIR/install.sh"

# Créer un package ZIP si possible
if command -v zip >/dev/null 2>&1; then
    echo "📦 Création du package ZIP..."
    cd "$BUILD_DIR"
    zip -r "../auto-agent-extension-v1.0.0.zip" .
    cd ..
    echo "✅ Package créé: auto-agent-extension-v1.0.0.zip"
fi

# Vérifier l'intégrité des fichiers
echo "🔍 Vérification de l'intégrité..."
REQUIRED_FILES=("manifest.json" "popup.html" "popup.js" "background.js" "content.js" "popup.css")
MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$BUILD_DIR/$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
    echo "✅ Tous les fichiers requis sont présents"
else
    echo "❌ Fichiers manquants: ${MISSING_FILES[*]}"
    exit 1
fi

# Validation du manifest.json
echo "🔍 Validation du manifest..."
if command -v node >/dev/null 2>&1; then
    node -e "
    try {
        const manifest = require('./$BUILD_DIR/manifest.json');
        console.log('✅ Manifest JSON valide');
        console.log('   Nom: ' + manifest.name);
        console.log('   Version: ' + manifest.version);
        console.log('   Permissions: ' + manifest.permissions.length);
    } catch(e) {
        console.log('❌ Erreur dans manifest.json: ' + e.message);
        process.exit(1);
    }
    "
fi

echo ""
echo "🎉 Construction terminée avec succès !"
echo "📁 Dossier de build: $BUILD_DIR"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Allez dans le dossier $BUILD_DIR"
echo "2. Suivez les instructions dans install.sh"
echo "3. Ou utilisez le fichier ZIP créé pour une installation facile"
echo ""
echo "🚀 Bonne utilisation de votre extension AutoAgent !"