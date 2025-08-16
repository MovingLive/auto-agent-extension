// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Test rapide de validation des corrections multilingues
 */
test.describe('Validation rapide', () => {
  
  test('should handle multilingual text patterns correctly', async ({ page }) => {
  await page.goto('file://' + __dirname + '/../../extension/popup.html');
    await page.waitForLoadState('networkidle');
    
    // Test 1: Vérifier le texte "minutes de chaque heure" ou "minutes of each hour"
    const hoursBtn = page.locator('[data-unit="hours"]');
    await hoursBtn.click();
    
    const hoursConfig = page.locator('#hoursConfig');
    await expect(hoursConfig).toBeVisible();
    
    const configText = await hoursConfig.textContent();
    console.log('Hours config text:', configText);
    expect(configText).toMatch(/(minutes de chaque heure|minutes of each hour)/i);
    
    // Test 2: Vérifier le texte "Chaque" ou "Every" 
    const weeksBtn = page.locator('[data-unit="weeks"]');
    await weeksBtn.click();
    
    const weeksConfig = page.locator('#weeksConfig');
    await expect(weeksConfig).toBeVisible();
    
    const weeksConfigText = await weeksConfig.textContent();
    console.log('Weeks config text:', weeksConfigText);
    expect(weeksConfigText).toMatch(/(Chaque|Every)/i);
    
    // Test 3: Vérifier le bouton de création
    const createBtn = page.locator('#createTaskBtn');
    const createBtnText = await createBtn.textContent();
    console.log('Create button text:', createBtnText);
    expect(createBtnText).toMatch(/(Créer la tâche|Create task)/i);
    
    console.log('✅ Tous les tests multilingues sont passés!');
  });
});
