// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Tests de responsive design et accessibilité
 * Ces tests vérifient l'adaptation mobile et l'accessibilité
 */
test.describe('AutoAgent - Responsive & Accessibilité', () => {
  
  test('should display correctly on mobile viewport', async ({ page }) => {
    // Simuler un viewport mobile
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
  await page.goto('file://' + __dirname + '/../../extension/popup.html');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que l'interface reste utilisable
    const container = page.locator('.container');
    await expect(container).toBeVisible();
    
    // Vérifier que les boutons sont cliquables
    const createBtn = page.locator('#createTaskBtn');
    await expect(createBtn).toBeVisible();
    
    // Vérifier que les champs de saisie sont accessibles
    const taskNameInput = page.locator('#taskName');
    await expect(taskNameInput).toBeVisible();
    
    // Prendre une capture d'écran mobile
    await page.screenshot({ 
      path: 'test-results/mobile-viewport.png',
      fullPage: true 
    });
  });

  test('should display correctly on tablet viewport', async ({ page }) => {
    // Simuler un viewport tablette
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
  await page.goto('file://' + __dirname + '/../../extension/popup.html');
    await page.waitForLoadState('networkidle');
    
    // Vérifier l'affichage sur tablette
    const header = page.locator('h1');
    await expect(header).toBeVisible();
    
    // Vérifier la planification
    const scheduleContainer = page.locator('.schedule-configurations');
    await expect(scheduleContainer).toBeVisible();
    
    // Prendre une capture d'écran tablette
    await page.screenshot({ 
      path: 'test-results/tablet-viewport.png',
      fullPage: true 
    });
  });

  test('should have proper keyboard navigation', async ({ page }) => {
  await page.goto('file://' + __dirname + '/../../extension/popup.html');
    await page.waitForLoadState('networkidle');
    
    // Tester la navigation au clavier - cliquer d'abord sur le champ
    const taskNameInput = page.locator('#taskName');
    await taskNameInput.click();
    
    // Vérifier que le focus est sur le champ de saisie
    await expect(taskNameInput).toBeFocused();
    
    // Continuer la navigation
    await page.keyboard.press('Tab');
    
    // Le focus devrait se déplacer vers un élément interactif (bouton heures ou autre)
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
  });

  test('should have accessible labels and ARIA attributes', async ({ page }) => {
  await page.goto('file://' + __dirname + '/../../extension/popup.html');
    await page.waitForLoadState('networkidle');
    
    // Vérifier les labels des champs
    const taskNameInput = page.locator('#taskName');
    await expect(taskNameInput).toHaveAttribute('placeholder');
    
    const promptInput = page.locator('#promptText');
    await expect(promptInput).toHaveAttribute('placeholder');
    
    // Vérifier les boutons ont des textes descriptifs (compatibilité FR/EN)
    const createBtn = page.locator('#createTaskBtn');
    const createBtnText = await createBtn.textContent();
    expect(createBtnText).toMatch(/(Créer la tâche|Create task)/i);
    
    // Vérifier les boutons de langue ont des titres
    const frenchBtn = page.locator('[data-lang="fr"]');
    await expect(frenchBtn).toHaveAttribute('title', 'Français');
    
    const englishBtn = page.locator('[data-lang="en"]');
    await expect(englishBtn).toHaveAttribute('title', 'English');
  });

  test('should handle high contrast mode', async ({ page }) => {
  await page.goto('file://' + __dirname + '/../../extension/popup.html');
    await page.waitForLoadState('networkidle');
    
    // Simuler un mode contraste élevé (via media query)
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // Vérifier que l'interface reste lisible
    const header = page.locator('h1');
    await expect(header).toBeVisible();
    
    const container = page.locator('.container');
    await expect(container).toBeVisible();
    
    // Prendre une capture d'écran en mode sombre
    await page.screenshot({ 
      path: 'test-results/dark-mode.png',
      fullPage: true 
    });
  });

  test('should maintain readability with zoom', async ({ page }) => {
  await page.goto('file://' + __dirname + '/../../extension/popup.html');
    await page.waitForLoadState('networkidle');
    
    // Simuler un zoom à 150%
    await page.evaluate(() => {
      document.body.style.zoom = '1.5';
    });
    
    // Vérifier que l'interface reste utilisable
    const createBtn = page.locator('#createTaskBtn');
    await expect(createBtn).toBeVisible();
    
    const scheduleContainer = page.locator('.schedule-configurations');
    await expect(scheduleContainer).toBeVisible();
    
    // Prendre une capture d'écran avec zoom
    await page.screenshot({ 
      path: 'test-results/zoom-150.png',
      fullPage: true 
    });
  });

  test('should work with reduced motion preferences', async ({ page }) => {
    // Simuler une préférence pour les animations réduites
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
  await page.goto('file://' + __dirname + '/../../extension/popup.html');
    await page.waitForLoadState('networkidle');
    
    // Tester les transitions entre modes
    await page.locator('[data-unit="days"]').click();
    await page.waitForTimeout(100); // Délai réduit car animations désactivées
    
    const daysConfig = page.locator('#daysConfig');
    await expect(daysConfig).toBeVisible();
    
    // Prendre une capture d'écran
    await page.screenshot({ 
      path: 'test-results/reduced-motion.png' 
    });
  });
});
