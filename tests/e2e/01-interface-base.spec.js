// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Tests de base pour l'interface AutoAgent
 * Ces tests vérifient le chargement et l'affichage correct de l'interface
 */
test.describe('AutoAgent - Interface de base', () => {
  
  test.beforeEach(async ({ page }) => {
    // Naviguer vers l'extension popup avec le chemin absolu
  await page.goto('file://' + __dirname + '/../../extension/popup.html');
    
    // Attendre que la page soit complètement chargée
    await page.waitForLoadState('networkidle');
  });

  test('should load the popup interface successfully', async ({ page }) => {
    // Vérifier le titre de la page
    await expect(page).toHaveTitle('AutoAgent - AI Task Automation');
    
    // Vérifier la présence du header principal
    const header = page.locator('h1');
    await expect(header).toBeVisible();
    await expect(header).toContainText('AutoAgent');
    
    // Vérifier que le header contient le robot emoji et AI (multilingual)
    const headerText = await header.textContent();
    expect(headerText).toMatch(/🤖.*AutoAgent/);
    // Le badge AI est inclus dans la traduction, pas besoin de test séparé
  });

  test('should display language selector buttons', async ({ page }) => {
    // Vérifier la présence des boutons de langue
    const frenchBtn = page.locator('[data-lang="fr"]');
    const englishBtn = page.locator('[data-lang="en"]');
    
    await expect(frenchBtn).toBeVisible();
    await expect(englishBtn).toBeVisible();
    
    // Vérifier les emojis des drapeaux
    await expect(frenchBtn).toContainText('🇫🇷');
    await expect(englishBtn).toContainText('🇬🇧');
  });

  test('should display main form sections', async ({ page }) => {
    // Vérifier la section "Nouvelle tâche"
    const newTaskSection = page.locator('[data-i18n="newTask"]');
    await expect(newTaskSection).toBeVisible();
    
    // Vérifier la présence des champs principaux
    await expect(page.locator('#taskName')).toBeVisible();
    await expect(page.locator('#promptText')).toBeVisible();
    
    // Vérifier le bouton de création (accepter français ou anglais)
    const createBtn = page.locator('#createTaskBtn');
    await expect(createBtn).toBeVisible();
    const createBtnText = await createBtn.textContent();
    expect(createBtnText).toMatch(/(Créer la tâche|Create task)/i);
  });

  test('should display task list section', async ({ page }) => {
    // Vérifier la section "Mes tâches" (accepter français ou anglais)
    const tasksHeader = page.locator('[data-i18n="myTasks"]');
    await expect(tasksHeader).toBeVisible();
    const tasksHeaderText = await tasksHeader.textContent();
    expect(tasksHeaderText).toMatch(/(Mes tâches|My tasks)/i);
    
    // Vérifier les indicateurs de statut
    const activeIndicator = page.locator('#activeCount');
    const pausedIndicator = page.locator('#pausedCount');
    
    await expect(activeIndicator).toBeVisible();
    await expect(pausedIndicator).toBeVisible();
    
    // Par défaut, les compteurs doivent être à 0
    await expect(activeIndicator).toContainText('0');
    await expect(pausedIndicator).toContainText('0');
  });

  test('should have proper styling and layout', async ({ page }) => {
    // Vérifier que l'interface a un design futuriste
    const container = page.locator('.container');
    await expect(container).toBeVisible();
    
    // Vérifier la présence des effets visuels (les particules peuvent ne pas être visibles)
    const particleEffects = page.locator('.absolute.inset-0.overflow-hidden');
    await expect(particleEffects).toBeAttached(); // Vérifie la présence dans le DOM, pas la visibilité
    
    // Prendre une capture d'écran pour vérification visuelle
    await page.screenshot({ 
      path: 'test-results/interface-base.png',
      fullPage: true 
    });
  });
});
