// global-teardown.js

async function globalTeardown() {
  console.log('🧹 Nettoyage des tests AutoAgent...');
  
  // Ici on pourrait nettoyer les données de test si nécessaire
  // Par exemple, vider le localStorage, supprimer des fichiers temporaires, etc.
  
  console.log('✅ Nettoyage terminé');
}

module.exports = globalTeardown;
