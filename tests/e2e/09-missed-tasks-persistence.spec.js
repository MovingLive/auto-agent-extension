// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Tests pour la persistance des tâches manquées
 * Vérifie que les tâches manquées exécutées ne réapparaissent pas
 * TEMPORAIREMENT DÉSACTIVÉS - nécessitent refactorisation API Chrome
 */
test.describe.skip('AutoAgent - Persistance des tâches manquées', () => {
  
  test.beforeEach(async ({ page }) => {
    // Naviguer vers l'extension popup
    await page.goto('file://' + __dirname + '/../../extension/popup.html');
    await page.waitForLoadState('networkidle');
    
    // Nettoyer le storage via localStorage (fallback)
    await page.evaluate(async () => {
      // Simulation chrome.storage pour les tests
      if (typeof chrome === 'undefined') {
        window.chrome = {
          storage: {
            local: {
              get: async (keys) => {
                const result = {};
                if (Array.isArray(keys)) {
                  keys.forEach(key => {
                    result[key] = JSON.parse(localStorage.getItem(key) || 'null');
                  });
                } else if (keys) {
                  result[keys] = JSON.parse(localStorage.getItem(keys) || 'null');
                }
                return result;
              },
              set: async (items) => {
                Object.keys(items).forEach(key => {
                  localStorage.setItem(key, JSON.stringify(items[key]));
                });
              },
              clear: async () => {
                localStorage.clear();
              }
            }
          }
        };
      }
      
      if (chrome.storage) {
        await chrome.storage.local.clear();
      } else {
        localStorage.clear();
      }
    });
  });

  test('Les tâches manquées exécutées ne réapparaissent pas après redémarrage', async ({ page }) => {
    await test.step('Créer une tâche de test', async () => {
      await page.locator('#taskName').fill('Test Persistance');
      await page.locator('#promptText').fill('Test pour vérifier la persistance des tâches manquées');
      await page.locator('#createTaskBtn').click();
      
      // Vérifier que la tâche a été créée
      await expect(page.locator('.task-item')).toHaveCount(1);
    });

    await test.step('Simuler une tâche manquée', async () => {
      // Injecter directement une tâche manquée dans le storage
      await page.evaluate(async () => {
        const result = await chrome.storage.local.get(['cronTasks']);
        const tasks = result.cronTasks || [];
        const task = tasks[0];
        
        if (task) {
          // Créer une tâche manquée
          const missedTask = {
            id: Date.now().toString(),
            taskId: task.id,
            taskName: task.name,
            prompt: task.prompt,
            missedAt: new Date().toISOString(),
            scheduledFor: new Date().toISOString(),
          };
          
          const missedResult = await chrome.storage.local.get(['missedTasks']);
          const missedTasks = missedResult.missedTasks || [];
          missedTasks.push(missedTask);
          await chrome.storage.local.set({ missedTasks: missedTasks });
        }
      });
      
      // Recharger la page pour voir la tâche manquée
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Vérifier que la section des tâches manquées est visible
      await expect(page.locator('#missedTasksSection')).toBeVisible();
      await expect(page.locator('.missed-task-item')).toHaveCount(1);
    });

    await test.step('Exécuter la tâche manquée', async () => {
      // Cliquer sur "Execute All"
      await page.locator('#executeAllMissedBtn').click();
      
      // Attendre que la section des tâches manquées disparaisse
      await expect(page.locator('#missedTasksSection')).toBeHidden();
    });

    await test.step('Vérifier que lastRun a été mis à jour', async () => {
      const taskInfo = await page.evaluate(async () => {
        const result = await chrome.storage.local.get(['cronTasks']);
        const tasks = result.cronTasks || [];
        return tasks[0];
      });
      
      expect(taskInfo.lastRun).toBeTruthy();
      
      // Vérifier que lastRun est récent (moins de 10 secondes)
      const lastRunTime = new Date(taskInfo.lastRun);
      const now = new Date();
      const diffInSeconds = (now - lastRunTime) / 1000;
      expect(diffInSeconds).toBeLessThan(10);
    });

    await test.step('Simuler redémarrage et vérifier qu\'aucune tâche manquée n\'apparaît', async () => {
      // Sauvegarder l'état du storage
      const storageState = await page.evaluate(async () => {
        const result = await chrome.storage.local.get(['cronTasks', 'missedTasks']);
        return result;
      });
      
      // Nettoyer et recréer l'état comme au démarrage
      await page.evaluate(async () => {
        await chrome.storage.local.clear();
      });
      
      await page.evaluate(async (state) => {
        await chrome.storage.local.set(state);
      }, storageState);
      
      // Simuler checkMissedTasksOnStartup
      await page.evaluate(async () => {
        const result = await chrome.storage.local.get(['cronTasks']);
        const tasks = result.cronTasks || [];
        const now = new Date();

        for (const task of tasks) {
          if (!task.isActive) continue;

          const lastRun = task.lastRun ? new Date(task.lastRun) : new Date(task.createdAt);
          const intervalMs = task.intervalInMinutes * 60 * 1000;
          const nextRun = new Date(lastRun.getTime() + intervalMs);

          // Si la prochaine exécution était prévue dans le passé
          if (nextRun < now) {
            // Ajouter à la liste des tâches manquées
            const missedTasksResult = await chrome.storage.local.get(['missedTasks']);
            const missedTasks = missedTasksResult.missedTasks || [];
            
            const existingTask = missedTasks.find(
              (mt) => mt.taskId === task.id &&
              new Date(mt.missedAt).toDateString() === new Date().toDateString()
            );

            if (!existingTask) {
              const missedTask = {
                id: Date.now().toString(),
                taskId: task.id,
                taskName: task.name,
                prompt: task.prompt,
                missedAt: new Date().toISOString(),
                scheduledFor: new Date().toISOString(),
              };

              missedTasks.push(missedTask);
              await chrome.storage.local.set({ missedTasks: missedTasks });
            }
          }
        }
      });
      
      // Recharger la page pour voir l'état après redémarrage
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // La section des tâches manquées ne devrait pas être visible
      await expect(page.locator('#missedTasksSection')).toBeHidden();
      
      // Vérifier également dans le storage
      const missedTasks = await page.evaluate(async () => {
        const result = await chrome.storage.local.get(['missedTasks']);
        return result.missedTasks || [];
      });
      
      expect(missedTasks).toHaveLength(0);
    });
  });

  test('Exécution individuelle de tâche manquée met à jour lastRun', async ({ page }) => {
    await test.step('Préparer une tâche avec tâche manquée', async () => {
      // Créer une tâche
      await page.locator('#taskName').fill('Test Individuel');
      await page.locator('#promptText').fill('Test exécution individuelle');
      await page.locator('#createTaskBtn').click();
      
      // Simuler une tâche manquée
      await page.evaluate(async () => {
        const result = await chrome.storage.local.get(['cronTasks']);
        const tasks = result.cronTasks || [];
        const task = tasks[0];
        
        if (task) {
          const missedTask = {
            id: Date.now().toString(),
            taskId: task.id,
            taskName: task.name,
            prompt: task.prompt,
            missedAt: new Date().toISOString(),
            scheduledFor: new Date().toISOString(),
          };
          
          const missedResult = await chrome.storage.local.get(['missedTasks']);
          const missedTasks = missedResult.missedTasks || [];
          missedTasks.push(missedTask);
          await chrome.storage.local.set({ missedTasks: missedTasks });
        }
      });
      
      await page.reload();
      await page.waitForLoadState('networkidle');
    });

    await test.step('Exécuter individuellement la tâche manquée', async () => {
      // Cliquer sur le bouton "Exécuter" de la tâche individuelle
      await page.locator('.missed-task-btn.execute').first().click();
      
      // Attendre que la section des tâches manquées disparaisse
      await expect(page.locator('#missedTasksSection')).toBeHidden();
    });

    await test.step('Vérifier que lastRun a été mis à jour', async () => {
      const taskInfo = await page.evaluate(async () => {
        const result = await chrome.storage.local.get(['cronTasks']);
        const tasks = result.cronTasks || [];
        return tasks[0];
      });
      
      expect(taskInfo.lastRun).toBeTruthy();
      
      // Vérifier que lastRun est récent
      const lastRunTime = new Date(taskInfo.lastRun);
      const now = new Date();
      const diffInSeconds = (now - lastRunTime) / 1000;
      expect(diffInSeconds).toBeLessThan(10);
    });
  });
});
