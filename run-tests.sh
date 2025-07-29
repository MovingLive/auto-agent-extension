#!/bin/bash

echo "🤖 Lancement de la suite de tests AutoAgent Playwright"
echo "======================================================"

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
show_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2 - SUCCÈS${NC}"
    else
        echo -e "${RED}❌ $2 - ÉCHEC${NC}"
    fi
}

# Tests de base
echo -e "${YELLOW}📋 Exécution des tests de base...${NC}"
npm test -- tests/e2e/01-interface-base.spec.js --reporter=line
show_result $? "Tests de base"

# Tests du système de planification (notre focus principal)
echo -e "${YELLOW}⏰ Exécution des tests de planification...${NC}"
npm test -- tests/e2e/02-schedule-system.spec.js --reporter=line
show_result $? "Tests de planification"

# Tests de gestion des tâches
echo -e "${YELLOW}📝 Exécution des tests de gestion des tâches...${NC}"
npm test -- tests/e2e/03-task-management.spec.js --reporter=line
show_result $? "Tests de gestion des tâches"

# Tests visuels et de layout (validation de nos optimisations)
echo -e "${YELLOW}🎨 Exécution des tests visuels...${NC}"
npm test -- tests/e2e/06-visual-layout.spec.js --reporter=line
show_result $? "Tests visuels et layout"

# Tests d'intégration
echo -e "${YELLOW}🔗 Exécution des tests d'intégration...${NC}"
npm test -- tests/e2e/07-integration.spec.js --reporter=line
show_result $? "Tests d'intégration"

echo ""
echo "🎯 Suite de tests terminée !"
echo "📊 Consultez le rapport complet avec: npm run test:report"
echo "🔍 Pour des tests interactifs, utilisez: npm run test:ui"
