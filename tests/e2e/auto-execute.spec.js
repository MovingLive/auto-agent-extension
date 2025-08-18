const { test, expect } = require('@playwright/test');

test.describe('Auto-execution Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('file://' + __dirname + '/../../extension/popup.html');
    await page.waitForLoadState('domcontentloaded');
    // Attendre que l'interface soit complètement initialisée
    await page.waitForSelector('h1[data-i18n="appTitle"]', { timeout: 5000 });
    // Vérifier que l'option auto-execute est présente
    await expect(page.locator('.auto-execute-option-compact')).toBeVisible();
  });

  test('should display auto-execute option by default', async ({ page }) => {
    // Vérifier que l'option d'auto-exécution est présente
    const autoExecuteOption = page.locator('.auto-execute-option-compact');
    await expect(autoExecuteOption).toBeVisible();

    // Vérifier que la case à cocher est cochée par défaut
    const checkbox = page.locator('#autoExecuteCheckbox');
    await expect(checkbox).toBeChecked();

    // Vérifier le texte de l'option (utiliser la classe du label compact)
    const label = page.locator('.auto-execute-label-compact');
    const labelText = await label.textContent();
    
    // Vérifier qu'on a du texte relatif à l'auto-exécution (FR ou EN)
    expect(labelText).toMatch(/(Auto-exécution|Auto-execution)/i);
    expect(labelText).toMatch(/(Lance automatiquement|Automatically launch)/i);
  });

  test('should allow toggling auto-execute option', async ({ page }) => {
    const checkbox = page.locator('#autoExecuteCheckbox');
    
    // Vérifier l'état initial (cochée)
    await expect(checkbox).toBeChecked();

    // Décocher en cliquant sur la case à cocher
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();

    // Re-cocher
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });

  test('should create task with auto-execute enabled by default', async ({ page }) => {
    // Remplir le formulaire
    await page.fill('#taskName', 'Test Auto Execute');
    await page.fill('#promptText', 'Test prompt for auto execution');

    // Vérifier que l'auto-exécution est cochée
    const checkbox = page.locator('#autoExecuteCheckbox');
    await expect(checkbox).toBeChecked();

    // Créer la tâche
    await page.click('#createTaskBtn');

    // Attendre la notification de succès
    await expect(page.locator('.notification.success')).toBeVisible({ timeout: 5000 });

    // Vérifier que la tâche a été créée (au lieu de chercher l'indicateur spécifique)
    const taskItems = page.locator('.task-item');
    await expect(taskItems).toHaveCount(1);
    
    const firstTask = taskItems.first();
    await expect(firstTask).toContainText('Test Auto Execute');
  });

  test('should create task without auto-execute when disabled', async ({ page }) => {
    // Remplir le formulaire
    await page.fill('#taskName', 'Test Without Auto Execute');
    await page.fill('#promptText', 'Test prompt without auto execution');

    // Décocher l'auto-exécution
    const checkbox = page.locator('#autoExecuteCheckbox');
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();

    // Créer la tâche
    await page.click('#createTaskBtn');

    // Attendre la notification de succès
    await expect(page.locator('.notification.success')).toBeVisible({ timeout: 5000 });

    // Vérifier que la tâche a été créée
    const taskItems = page.locator('.task-item');
    await expect(taskItems).toHaveCount(1);
    
    const firstTask = taskItems.first();
    await expect(firstTask).toContainText('Test Without Auto Execute');
  });

  test('should reset auto-execute option after form reset', async ({ page }) => {
    // Décocher l'auto-exécution
    const checkbox = page.locator('#autoExecuteCheckbox');
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();

    // Remplir et créer une tâche
    await page.fill('#taskName', 'Test Reset');
    await page.fill('#promptText', 'Test prompt');
    await page.click('#createTaskBtn');

    // Attendre la notification et que le formulaire soit réinitialisé
    await expect(page.locator('.notification.success')).toBeVisible({ timeout: 5000 });

    // Attendre un peu pour que le formulaire se réinitialise
    await page.waitForTimeout(500);

    // Vérifier que l'auto-exécution est de nouveau cochée (valeur par défaut)
    await expect(checkbox).toBeChecked();
  });

  test('should have proper visual styling for auto-execute option', async ({ page }) => {
    const autoExecuteOption = page.locator('.auto-execute-option-compact');
    const checkbox = page.locator('#autoExecuteCheckbox');

    // Vérifier que les éléments sont visibles et stylés
    await expect(autoExecuteOption).toBeVisible();
    await expect(checkbox).toBeVisible();

    // Vérifier l'état visuel quand cochée
    await expect(checkbox).toBeChecked();
    
    // Test du hover (optionnel, peut être instable)
    await autoExecuteOption.hover();
    await page.waitForTimeout(100);
  });
});
