// global-setup.js
const { chromium } = require('@playwright/test');

async function globalSetup() {
  console.log('🚀 Configuration globale des tests AutoAgent...');
  
  // Vérifier que le fichier popup.html existe
  const fs = require('fs');
  const path = require('path');
  
  const popupPath = path.resolve(__dirname, '../extension/popup.html');
  if (!fs.existsSync(popupPath)) {
    throw new Error('popup.html non trouvé. Vérifiez que l\'extension est correctement configurée.');
  }
  
  console.log('✅ Fichiers de l\'extension vérifiés');
  console.log('✅ Configuration globale terminée');
}

module.exports = globalSetup;
