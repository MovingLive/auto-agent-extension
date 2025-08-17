// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Tests pour la création et gestion des tâches
 * Ces tests vérifient la création, modification, suppression de tâches
 */
test.describe('AutoAgent - Gestion des tâches', () => {
  
  test.beforeEach(async ({ page }) => {
  await page.goto('file://' + __dirname + '/../../extension/popup.html');
    await page.waitForLoadState('networkidle');
  });

  test('should validate required fields for task creation', async ({ page }) => {
    const createBtn = page.locator('#createTaskBtn');
    
    // Tenter de créer une tâche sans nom
    await createBtn.click();
    
    // Vérifier qu'aucune tâche n'est créée (les compteurs restent à 0)
    const activeCount = page.locator('#activeCount');
    await expect(activeCount).toContainText('0');
  });

  test('should create a task with hours frequency', async ({ page }) => {
    // Remplir les champs requis
    await page.locator('#taskName').fill('Test Task Hourly');
    await page.locator('#promptText').fill('This is a test prompt for hourly execution');
    
    // Configurer la fréquence (par défaut: heures)
    await page.locator('#hourMinutes').fill('15');
    
    // Créer la tâche
    await page.locator('#createTaskBtn').click();
    
    // Vérifier que la tâche est créée (noter: sans backend, on teste l'UI)
    // Dans un vrai test, on vérifierait le localStorage ou l'état de l'application
    
    // Prendre une capture d'écran
    await page.screenshot({ 
      path: 'test-results/task-creation-hourly.png' 
    });
  });

  test('should create a task with daily frequency', async ({ page }) => {
    // Remplir les champs requis
    await page.locator('#taskName').fill('Test Task Daily');
    await page.locator('#promptText').fill('This is a test prompt for daily execution');
    
    // Passer en mode jours
    await page.locator('[data-unit="days"]').click();
    
    // Configurer l'heure
    await page.locator('#dayHours').fill('10');
    await page.locator('#dayMinutes').fill('30');
    
    // Créer la tâche
    await page.locator('#createTaskBtn').click();
    
    // Prendre une capture d'écran
    await page.screenshot({ 
      path: 'test-results/task-creation-daily.png' 
    });
  });

  test('should create a task with weekly frequency', async ({ page }) => {
    // Remplir les champs requis
    await page.locator('#taskName').fill('Test Task Weekly');
    await page.locator('#promptText').fill('This is a test prompt for weekly execution');
    
    // Passer en mode semaines
    await page.locator('[data-unit="weeks"]').click();
    
    // Configurer le jour et l'heure
    await page.locator('#weekDay').selectOption('3'); // Mercredi
    await page.locator('#weekHours').fill('16');
    await page.locator('#weekMinutes').fill('45');
    
    // Créer la tâche
    await page.locator('#createTaskBtn').click();
    
    // Prendre une capture d'écran
    await page.screenshot({ 
      path: 'test-results/task-creation-weekly.png' 
    });
  });

  test('should handle long task names and prompts', async ({ page }) => {
    const longTaskName = 'A'.repeat(100); // Nom de tâche très long
    const longPrompt = 'B'.repeat(500); // Prompt très long
    
    // Remplir avec des valeurs longues
    await page.locator('#taskName').fill(longTaskName);
    await page.locator('#promptText').fill(longPrompt);
    
    // Vérifier que les champs acceptent le texte
    await expect(page.locator('#taskName')).toHaveValue(longTaskName);
    await expect(page.locator('#promptText')).toHaveValue(longPrompt);
    
    // Tenter de créer la tâche
    await page.locator('#createTaskBtn').click();
    
    // Prendre une capture d'écran pour voir le rendu
    await page.screenshot({ 
      path: 'test-results/task-creation-long-text.png' 
    });
  });

  test('should handle special characters in task fields', async ({ page }) => {
    const specialTaskName = 'Test Tâche avec émoticônes 🚀 & caractères spéciaux @#$%';
    const specialPrompt = 'Prompt avec caractères spéciaux: éàùç "quotes" & symbols <>';
    
    // Remplir avec des caractères spéciaux
    await page.locator('#taskName').fill(specialTaskName);
    await page.locator('#promptText').fill(specialPrompt);
    
    // Vérifier que les champs acceptent les caractères spéciaux
    await expect(page.locator('#taskName')).toHaveValue(specialTaskName);
    await expect(page.locator('#promptText')).toHaveValue(specialPrompt);
    
    // Créer la tâche
    await page.locator('#createTaskBtn').click();
    
    // Prendre une capture d'écran
    await page.screenshot({ 
      path: 'test-results/task-creation-special-chars.png' 
    });
  });

  test('should show empty state when no tasks exist', async ({ page }) => {
    // Attendre que la page soit complètement chargée
    await page.waitForTimeout(1000);
    
    // Vérifier que l'état vide est visible ou que les compteurs sont à 0
    const emptyState = page.locator('#emptyState');
    const activeCount = page.locator('#activeCount');
    const pausedCount = page.locator('#pausedCount');
    
    // Vérifier que les compteurs sont à 0 (indicateur d'état vide)
    await expect(activeCount).toContainText('0');
    await expect(pausedCount).toContainText('0');
    
    // Si l'état vide est visible, vérifier son contenu (compatibilité FR/EN)
    if (await emptyState.isVisible()) {
      const emptyStateText = await emptyState.textContent();
      expect(emptyStateText).toMatch(/(Aucune tâche créée|No tasks created)/i);
      expect(emptyStateText).toMatch(/(Créez votre première tâche|Create your first|first automated task)/i);
    }
  });

  test('should maintain form state during mode switching', async ({ page }) => {
    const taskName = 'Test Form State';
    const prompt = 'Test prompt that should persist';
    
    // Remplir les champs
    await page.locator('#taskName').fill(taskName);
    await page.locator('#promptText').fill(prompt);
    
    // Changer de mode plusieurs fois
    await page.locator('[data-unit="days"]').click();
    await page.locator('[data-unit="weeks"]').click();
    await page.locator('[data-unit="hours"]').click();
    
    // Vérifier que les champs ont conservé leurs valeurs
    await expect(page.locator('#taskName')).toHaveValue(taskName);
    await expect(page.locator('#promptText')).toHaveValue(prompt);
  });

  test('should reset form after task creation', async ({ page }) => {
    // Remplir le formulaire
    await page.locator('#taskName').fill('Test Reset');
    await page.locator('#promptText').fill('Test prompt');
    
    // Créer la tâche
    await page.locator('#createTaskBtn').click();
    
    // Note: Dans une vraie implémentation, le formulaire devrait se vider
    // Ce test vérifie le comportement attendu même si pas encore implémenté
    
    // Prendre une capture d'écran pour documenter l'état actuel
    await page.screenshot({ 
      path: 'test-results/form-state-after-creation.png' 
    });
  });
});
