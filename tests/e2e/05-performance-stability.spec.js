// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Tests de performance et stabilité
 * Ces tests vérifient les performances et la robustesse de l'interface
 */
test.describe('AutoAgent - Performance & Stabilité', () => {
  
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('file://' + __dirname + '/../../popup.html');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // L'interface doit se charger en moins de 2 secondes
    expect(loadTime).toBeLessThan(2000);
    
    console.log(`Interface chargée en ${loadTime}ms`);
  });

  test('should handle rapid mode switching', async ({ page }) => {
    await page.goto('file://' + __dirname + '/../../popup.html');
    await page.waitForLoadState('networkidle');
    
    // Changer de mode rapidement plusieurs fois
    for (let i = 0; i < 10; i++) {
      await page.locator('[data-unit="days"]').click();
      await page.locator('[data-unit="weeks"]').click();
      await page.locator('[data-unit="hours"]').click();
    }
    
    // Vérifier que l'interface reste stable
    const hoursConfig = page.locator('#hoursConfig');
    await expect(hoursConfig).toBeVisible();
    
    // Prendre une capture d'écran pour vérifier l'état final
    await page.screenshot({ 
      path: 'test-results/rapid-switching-final.png' 
    });
  });

  test('should handle multiple rapid clicks on create button', async ({ page }) => {
    await page.goto('file://' + __dirname + '/../../popup.html');
    await page.waitForLoadState('networkidle');
    
    // Remplir le formulaire
    await page.locator('#taskName').fill('Test Rapid Clicks');
    await page.locator('#promptText').fill('Test prompt');
    
    // Cliquer rapidement plusieurs fois sur le bouton créer avec un délai suffisant
    const createBtn = page.locator('#createTaskBtn');
    for (let i = 0; i < 5; i++) {
      await createBtn.click({ timeout: 1000 }); // Augmenter le timeout
      await page.waitForTimeout(200); // Petit délai entre les clics
    }
    
    // Vérifier que l'interface reste stable
    await expect(createBtn).toBeVisible();
    
    // Prendre une capture d'écran
    await page.screenshot({ 
      path: 'test-results/rapid-create-clicks.png' 
    });
  });

  test('should handle page reload gracefully', async ({ page }) => {
    await page.goto('file://' + __dirname + '/../../popup.html');
    await page.waitForLoadState('networkidle');
    
    // Remplir quelques champs
    await page.locator('#taskName').fill('Test Before Reload');
    await page.locator('[data-unit="days"]').click();
    
    // Recharger la page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Vérifier que l'interface se recharge correctement
    const header = page.locator('h1');
    await expect(header).toBeVisible();
    
    // Vérifier que l'état par défaut est restauré
    const hoursBtn = page.locator('[data-unit="hours"]');
    await expect(hoursBtn).toHaveClass(/active/);
    
    // Prendre une capture d'écran après rechargement
    await page.screenshot({ 
      path: 'test-results/after-reload.png' 
    });
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('file://' + __dirname + '/../../popup.html');
    await page.waitForLoadState('networkidle');
    
    // Naviguer vers une autre page puis revenir
    await page.goto('about:blank');
    await page.goBack();
    
    // Vérifier que l'interface fonctionne toujours
    const header = page.locator('h1');
    await expect(header).toBeVisible();
    
    const createBtn = page.locator('#createTaskBtn');
    await expect(createBtn).toBeVisible();
  });

  test('should maintain performance with many interactions', async ({ page }) => {
    await page.goto('file://' + __dirname + '/../../popup.html');
    await page.waitForLoadState('networkidle');
    
    const startTime = Date.now();
    
    // Effectuer de nombreuses interactions
    for (let i = 0; i < 20; i++) {
      // Remplir les champs
      await page.locator('#taskName').fill(`Task ${i}`);
      await page.locator('#promptText').fill(`Prompt ${i}`);
      
      // Changer de mode
      const modes = ['hours', 'days', 'weeks'];
      const mode = modes[i % 3];
      await page.locator(`[data-unit="${mode}"]`).click();
      
      // Modifier les valeurs selon le mode avec vérifications
      if (mode === 'hours') {
        await page.locator('#hourMinutes').fill(String(i % 60));
      } else if (mode === 'days') {
        await page.locator('#dayHours').fill(String(i % 24));
        await page.locator('#dayMinutes').fill(String(i % 60));
      } else if (mode === 'weeks') {
        const validDays = ['1', '2', '3', '4', '5', '6', '0']; // Lundi à Dimanche
        await page.locator('#weekDay').selectOption(validDays[i % 7]);
        await page.locator('#weekHours').fill(String(i % 24));
      }
    }
    
    const interactionTime = Date.now() - startTime;
    
    // Les interactions ne doivent pas prendre plus de 10 secondes
    expect(interactionTime).toBeLessThan(10000);
    
    console.log(`20 interactions effectuées en ${interactionTime}ms`);
    
    // Vérifier que l'interface reste réactive
    const finalBtn = page.locator('#createTaskBtn');
    await expect(finalBtn).toBeVisible();
    
    // Prendre une capture d'écran finale
    await page.screenshot({ 
      path: 'test-results/many-interactions-final.png' 
    });
  });

  test('should handle invalid input gracefully', async ({ page }) => {
    await page.goto('file://' + __dirname + '/../../popup.html');
    await page.waitForLoadState('networkidle');
    
    // Tester avec des entrées invalides
    const taskNameInput = page.locator('#taskName');
    const promptInput = page.locator('#promptText');
    
    // Entrer des caractères de contrôle
    await taskNameInput.fill('\x00\x01\x02');
    await promptInput.fill('\x7F\x80\x81');
    
    // Tester avec des entiers hors limites
    await page.locator('[data-unit="hours"]').click();
    const minutesInput = page.locator('#hourMinutes');
    
    await minutesInput.fill('999');
    await minutesInput.blur();
    
    // Vérifier que l'interface reste stable
    await expect(taskNameInput).toBeVisible();
    await expect(promptInput).toBeVisible();
    
    // Prendre une capture d'écran
    await page.screenshot({ 
      path: 'test-results/invalid-input-handling.png' 
    });
  });

  test('should measure and validate CSS performance', async ({ page }) => {
    await page.goto('file://' + __dirname + '/../../popup.html');
    await page.waitForLoadState('networkidle');
    
    // Mesurer les métriques de performance CSS
    const metrics = await page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint');
      const navigationEntries = performance.getEntriesByType('navigation');
      
      return {
        firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        domContentLoaded: navigationEntries[0]?.domContentLoadedEventEnd || 0,
        loadComplete: navigationEntries[0]?.loadEventEnd || 0
      };
    });
    
    console.log('Métriques de performance:', metrics);
    
    // Vérifier que les métriques sont dans des limites acceptables
    expect(metrics.firstPaint).toBeLessThan(1000); // < 1s
    expect(metrics.firstContentfulPaint).toBeLessThan(1500); // < 1.5s
    expect(metrics.domContentLoaded).toBeLessThan(2000); // < 2s
  });
});
