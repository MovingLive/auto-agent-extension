// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Tests complets de workflow des tâches
 * Ces tests vérifient le cycle de vie complet d'une tâche: création, pause/reprise, suppression
 */
test.describe('AutoAgent - Workflow complet des tâches', () => {
  
  test.beforeEach(async ({ page }) => {
    // Naviguer vers l'extension popup avec le chemin absolu
    await page.goto('file://' + __dirname + '/../../extension/popup.html');
    
    // Attendre que la page soit complètement chargée
    await page.waitForLoadState('networkidle');
  });

  test('should create, pause, resume and delete a task successfully', async ({ page }) => {
    // Créer une tâche
    await test.step('Créer une nouvelle tâche', async () => {
      await page.fill('#taskName', 'Task Workflow Test');
      await page.fill('#promptText', 'Test prompt for complete workflow');
      
      // Vérifier les compteurs initiaux (doivent être à 0)
      await expect(page.locator('#activeCount')).toContainText('0');
      await expect(page.locator('#pausedCount')).toContainText('0');
      
      await page.click('#createTaskBtn');
      
      // Vérifier que la tâche a été créée
      await expect(page.locator('h3').filter({ hasText: 'Task Workflow Test' })).toBeVisible();
      
      // Vérifier la notification de succès si elle existe
      const notification = page.locator('.notification').filter({ hasText: /créée|created/i });
      if (await notification.isVisible()) {
        await expect(notification).toBeVisible();
      }
    });

    await test.step('Mettre la tâche en pause', async () => {
      // Cliquer sur le bouton pause (⏸️)
      await page.locator('button[title*="pause"], button').filter({ hasText: '⏸️' }).first().click();
      
      // Vérifier que la tâche est maintenant en pause
      await expect(page.locator('.task-item').filter({ hasText: /En pause|Paused/ })).toBeVisible();
      
      // Vérifier que l'icône du bouton a changé en play (▶️)
      await expect(page.locator('button').filter({ hasText: '▶️' })).toBeVisible();
    });

    await test.step('Reprendre la tâche', async () => {
      // Cliquer sur le bouton play (▶️)
      await page.locator('button').filter({ hasText: '▶️' }).first().click();
      
      // Vérifier que la tâche est maintenant active
      await expect(page.locator('.task-item').filter({ hasText: /Actif|Active/ })).toBeVisible();
      
      // Vérifier que l'icône du bouton a changé en pause (⏸️)
      await expect(page.locator('button').filter({ hasText: '⏸️' })).toBeVisible();
    });

    await test.step('Supprimer la tâche', async () => {
      // Cliquer sur le bouton supprimer (🗑️)
      await page.locator('button').filter({ hasText: '🗑️' }).first().click();
      
      // Attendre que la suppression soit effective
      await page.waitForTimeout(1000);
      
      // Vérifier que la tâche spécifique n'apparaît plus dans la liste
      const specificTask = page.locator('.task-item').filter({ hasText: 'Task Workflow Test' });
      const isVisible = await specificTask.isVisible().catch(() => true);
      
      if (isVisible) {
        // Si la tâche est encore visible, forcer le rechargement pour valider la persistance
        await page.reload();
        await page.waitForTimeout(500);
        await expect(specificTask).not.toBeVisible();
      } else {
        await expect(specificTask).not.toBeVisible();
      }
      
      // Vérifier les compteurs reviennent à 0 (seulement si c'est la seule tâche)
      const taskCount = await page.locator('.task-item').count();
      if (taskCount === 0) {
        await expect(page.locator('#activeCount')).toContainText('0');
        await expect(page.locator('#pausedCount')).toContainText('0');
      }
    });
  });

  test('should handle task creation validation correctly', async ({ page }) => {
    await test.step('Tenter de créer une tâche sans nom', async () => {
      // Remplir seulement le prompt
      await page.fill('#promptText', 'Test prompt without name');
      
      // Tenter de créer la tâche
      await page.click('#createTaskBtn');
      
      // Vérifier que la validation empêche la création (notification ou pas de nouvelle tâche créée)
      const taskCountBefore = await page.locator('.task-item').count();
      await page.waitForTimeout(500);
      const taskCountAfter = await page.locator('.task-item').count();
      
      // Soit il y a une notification d'erreur, soit aucune tâche n'a été créée
      const hasErrorNotification = await page.locator('.notification').filter({ hasText: /nom|name|task/i }).first().isVisible().catch(() => false);
      
      if (!hasErrorNotification) {
        // Si pas de notification, vérifier qu'aucune tâche n'a été créée
        expect(taskCountAfter).toBe(taskCountBefore);
      }
      
      // Vérifier qu'aucune tâche n'a été créée
      await expect(page.locator('#emptyState')).toBeVisible();
    });

    await test.step('Tenter de créer une tâche sans prompt', async () => {
      // Nettoyer les champs
      await page.fill('#taskName', '');
      await page.fill('#promptText', '');
      
      // Remplir seulement le nom
      await page.fill('#taskName', 'Task without prompt');
      
      // Tenter de créer la tâche
      await page.click('#createTaskBtn');
      
      // Vérifier que la validation empêche la création
      await expect(page.locator('.notification').filter({ hasText: /prompt/i })).toBeVisible();
      
      // Vérifier qu'aucune tâche n'a été créée
      await expect(page.locator('#emptyState')).toBeVisible();
    });
  });

  test('should switch between different frequency modes correctly', async ({ page }) => {
    await test.step('Tester le mode heures', async () => {
      // Cliquer sur le mode heures
      await page.locator('button[data-unit="hours"]').click();
      
      // Vérifier que la configuration heures est visible
      await expect(page.locator('#hoursConfig')).toBeVisible();
      await expect(page.locator('#daysConfig')).not.toBeVisible();
      await expect(page.locator('#weeksConfig')).not.toBeVisible();
      
      // Vérifier le champ minutes
      await expect(page.locator('#hourMinutes')).toBeVisible();
    });

    await test.step('Tester le mode jours', async () => {
      // Cliquer sur le mode jours
      await page.locator('button[data-unit="days"]').click();
      
      // Vérifier que la configuration jours est visible
      await expect(page.locator('#daysConfig')).toBeVisible();
      await expect(page.locator('#hoursConfig')).not.toBeVisible();
      await expect(page.locator('#weeksConfig')).not.toBeVisible();
      
      // Vérifier les champs heures et minutes
      await expect(page.locator('#dayHours')).toBeVisible();
      await expect(page.locator('#dayMinutes')).toBeVisible();
    });

    await test.step('Tester le mode semaines', async () => {
      // Cliquer sur le mode semaines
      await page.locator('button[data-unit="weeks"]').click();
      
      // Vérifier que la configuration semaines est visible
      await expect(page.locator('#weeksConfig')).toBeVisible();
      await expect(page.locator('#hoursConfig')).not.toBeVisible();
      await expect(page.locator('#daysConfig')).not.toBeVisible();
      
      // Vérifier les champs jour, heures et minutes
      await expect(page.locator('#weekDay')).toBeVisible();
      await expect(page.locator('#weekHours')).toBeVisible();
      await expect(page.locator('#weekMinutes')).toBeVisible();
    });
  });

  test('should handle language switching correctly', async ({ page }) => {
    await test.step('Changer en anglais', async () => {
      // Cliquer sur le bouton anglais
      await page.locator('button[data-lang="en"]').click();
      
      // Vérifier que l'interface change en anglais
      await expect(page.locator('[data-i18n="newTask"]')).toContainText(/new task/i);
      await expect(page.locator('#createTaskBtn')).toContainText(/create task/i);
      
      // Vérifier l'état vide en anglais
      await expect(page.locator('[data-i18n="noTasks"]')).toContainText(/no tasks/i);
    });

    await test.step('Revenir en français', async () => {
      // Cliquer sur le bouton français
      await page.locator('button[data-lang="fr"]').click();
      
      // Vérifier que l'interface revient en français
      await expect(page.locator('[data-i18n="newTask"]')).toContainText(/nouvelle tâche/i);
      await expect(page.locator('#createTaskBtn')).toContainText(/créer la tâche/i);
      
      // Vérifier l'état vide en français
      await expect(page.locator('[data-i18n="noTasks"]')).toContainText(/aucune tâche/i);
    });
  });

  test('should create tasks with different frequency configurations', async ({ page }) => {
    await test.step('Créer une tâche horaire', async () => {
      await page.locator('button[data-unit="hours"]').click();
      await page.fill('#hourMinutes', '30');
      
      await page.fill('#taskName', 'Tâche Horaire');
      await page.fill('#promptText', 'Tâche exécutée toutes les heures');
      
      await page.click('#createTaskBtn');
      
      // Vérifier la description de fréquence
      await expect(page.locator('.task-item').filter({ hasText: /minutes.*each hour|minutes.*chaque heure|Every hour/ })).toBeVisible();
    });

    await test.step('Créer une tâche quotidienne', async () => {
      await page.locator('button[data-unit="days"]').click();
      await page.fill('#dayHours', '14');
      await page.fill('#dayMinutes', '30');
      
      await page.fill('#taskName', 'Tâche Quotidienne');
      await page.fill('#promptText', 'Tâche exécutée tous les jours');
      
      await page.click('#createTaskBtn');
      
      // Vérifier la description de fréquence
      await expect(page.locator('.task-item').filter({ hasText: '14:30' })).toBeVisible();
    });

    await test.step('Créer une tâche hebdomadaire', async () => {
      await page.locator('button[data-unit="weeks"]').click();
      await page.selectOption('#weekDay', '5'); // Vendredi
      await page.fill('#weekHours', '10');
      await page.fill('#weekMinutes', '0');
      
      await page.fill('#taskName', 'Tâche Hebdomadaire');
      await page.fill('#promptText', 'Tâche exécutée chaque vendredi');
      
      await page.click('#createTaskBtn');
      
      // Vérifier la description de fréquence
      await expect(page.locator('.task-item').filter({ hasText: /vendredi/i })).toBeVisible();
    });

    // Vérifier qu'on a maintenant 3 tâches
    await expect(page.locator('.task-item')).toHaveCount(3);
  });

  test('should reset form after successful task creation', async ({ page }) => {
    // Remplir le formulaire
    await page.fill('#taskName', 'Test Reset Form');
    await page.fill('#promptText', 'Test prompt for form reset');
    await page.fill('#hourMinutes', '45');
    
    // Créer la tâche
    await page.click('#createTaskBtn');
    
    // Vérifier que le formulaire est réinitialisé
    await expect(page.locator('#taskName')).toHaveValue('');
    await expect(page.locator('#promptText')).toHaveValue('');
    await expect(page.locator('#hourMinutes')).toHaveValue('0'); // Valeur par défaut
    
    // Vérifier que la tâche a bien été créée
    await expect(page.locator('h3').filter({ hasText: 'Test Reset Form' })).toBeVisible();
  });
});
