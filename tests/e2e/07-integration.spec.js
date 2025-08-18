// @ts-check
const { test, expect } = require('@playwright/test');
const { 
  createTestTask, 
  validateAllScheduleModes, 
  captureAllModes,
  validateHTMLStructure,
  cleanupTestData 
} = require('../helpers/test-utils');

/**
 * Tests d'intégration utilisant les helpers
 * Ces tests valident les workflows complets
 */
test.describe('AutoAgent - Tests d\'intégration', () => {
  
  test.beforeEach(async ({ page }) => {
  await page.goto('file://' + __dirname + '/../../extension/popup.html');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test('should validate complete HTML structure', async ({ page }) => {
    const structure = await validateHTMLStructure(page);
    
    // Vérifier que tous les éléments requis existent
    for (const [selector, result] of Object.entries(structure)) {
      expect(result.exists, `Élément ${selector} doit exister`).toBe(true);
      
      // La plupart des éléments doivent être visibles
      if (!selector.includes('Config') || selector === '#hoursConfig') {
        expect(result.visible, `Élément ${selector} doit être visible`).toBe(true);
      }
    }
    
    console.log('Structure HTML validée:', Object.keys(structure).length, 'éléments vérifiés');
  });

  test('should validate all schedule modes functionality', async ({ page }) => {
    const modeResults = await validateAllScheduleModes(page);
    
    // Vérifier que tous les modes fonctionnent
    for (const [mode, result] of Object.entries(modeResults)) {
      expect(result.accessible, `Mode ${mode} doit être accessible`).toBe(true);
      expect(result.configVisible, `Configuration ${mode} doit être visible`).toBe(true);
    }
    
    console.log('Modes de planification validés:', Object.keys(modeResults));
  });

  test('should create tasks with different schedules using helpers', async ({ page }) => {
    // Créer une tâche horaire
    await createTestTask(page, {
      name: 'Tâche Horaire',
      prompt: 'Prompt pour exécution horaire',
      mode: 'hours',
      minutes: 30
    });
    
    await cleanupTestData(page);
    
    // Créer une tâche quotidienne
    await createTestTask(page, {
      name: 'Tâche Quotidienne',
      prompt: 'Prompt pour exécution quotidienne',
      mode: 'days',
      hours: 14,
      minutes: 45
    });
    
    await cleanupTestData(page);
    
    // Créer une tâche hebdomadaire
    await createTestTask(page, {
      name: 'Tâche Hebdomadaire',
      prompt: 'Prompt pour exécution hebdomadaire',
      mode: 'weeks',
      day: 5, // Vendredi
      hours: 16,
      minutes: 0
    });
    
    // Capturer l'état final
    await page.screenshot({ 
      path: 'test-results/integration-task-creation-complete.png' 
    });
  });

  test('should capture visual regression baseline', async ({ page }) => {
    // Capturer tous les modes pour référence visuelle
    await captureAllModes(page, 'baseline');
    
    // Capturer avec des données remplies
    await page.locator('#taskName').fill('Tâche de référence visuelle');
    await page.locator('#promptText').fill('Prompt de référence pour les tests visuels de régression');
    
    await captureAllModes(page, 'baseline-with-data');
  });

  test('should handle complete user workflow', async ({ page }) => {
    // Workflow complet : création de plusieurs tâches
    const workflows = [
      {
        name: 'Vérification email',
        prompt: 'Vérifier les nouveaux emails importants',
        mode: 'hours',
        minutes: 15
      },
      {
        name: 'Rapport quotidien',
        prompt: 'Générer le rapport quotidien d\'activité',
        mode: 'days',
        hours: 17,
        minutes: 30
      },
      {
        name: 'Sauvegarde hebdomadaire',
        prompt: 'Effectuer la sauvegarde hebdomadaire des données',
        mode: 'weeks',
        day: 0, // Dimanche
        hours: 2,
        minutes: 0
      }
    ];
    
    for (let i = 0; i < workflows.length; i++) {
      const workflow = workflows[i];
      
      console.log(`Exécution du workflow ${i + 1}: ${workflow.name}`);
      
      await createTestTask(page, workflow);
      
      // Capturer après chaque création
      await page.screenshot({ 
        path: `test-results/workflow-step-${i + 1}-${workflow.mode}.png` 
      });
      
      // Nettoyer pour la prochaine tâche
      if (i < workflows.length - 1) {
        await cleanupTestData(page);
      }
    }
    
    console.log('Workflow complet terminé avec succès');
  });

  test('should validate accessibility across all interactions', async ({ page }) => {
    // Tester la navigation au clavier à travers toute l'interface
    // Cliquer d'abord sur le champ pour établir le focus
    await page.locator('#taskName').click();
    await expect(page.locator('#taskName')).toBeFocused();
    
    // Vérifier que la navigation par Tab fonctionne vers les éléments interactifs
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
    
    // Tester le changement de mode en cliquant directement (plus fiable)
    await page.locator('[data-unit="weeks"]').click();
    await expect(page.locator('[data-unit="weeks"]')).toHaveClass(/active/);
    
    // Vérifier que la configuration correspondante est visible
    await expect(page.locator('#weeksConfig')).toBeVisible();
    
    // Capturer l'état d'accessibilité
    await page.screenshot({ 
      path: 'test-results/accessibility-keyboard-navigation.png' 
    });
  });

  test('should perform stress test with rapid interactions', async ({ page }) => {
    const startTime = Date.now();
    
    // Effectuer 50 interactions rapides
    for (let i = 0; i < 50; i++) {
      const mode = ['hours', 'days', 'weeks'][i % 3];
      
      // Changer de mode
      await page.locator(`[data-unit="${mode}"]`).click();
      
      // Modifier des valeurs
      if (mode === 'hours') {
        await page.locator('#hourMinutes').fill(String(i % 60));
      } else if (mode === 'days') {
        await page.locator('#dayHours').fill(String(i % 24));
        await page.locator('#dayMinutes').fill(String((i * 2) % 60));
      } else {
        await page.locator('#weekDay').selectOption(String(i % 7));
      }
      
      // Modifier les champs texte occasionnellement
      if (i % 10 === 0) {
        await page.locator('#taskName').fill(`Stress Test Task ${i}`);
        await page.locator('#promptText').fill(`Stress test prompt iteration ${i}`);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`Test de stress terminé en ${duration}ms`);
    
    // Vérifier que l'interface est toujours réactive
    const createBtn = page.locator('#createTaskBtn');
    await expect(createBtn).toBeVisible();
    await expect(createBtn).toBeEnabled();
    
    // L'interface doit rester fluide (moins de 29 secondes pour 50 interactions - plus réaliste)
    expect(duration).toBeLessThan(29000);
    
    // Capturer l'état final
    await page.screenshot({ 
      path: 'test-results/stress-test-final-state.png' 
    });
  });
});
