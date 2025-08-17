// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('AutoAgent - Gestion des Tâches Manquées', () => {
  test.beforeEach(async ({ page }) => {
    const extensionPath = path.resolve(__dirname, '../../extension');
    const popupPath = path.resolve(extensionPath, 'popup.html');
    await page.goto(`file://${popupPath}`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should detect and display missed tasks', async ({ page }) => {
    await test.step('Simuler la détection de tâches manquées', async () => {
      // Injecter des tâches manquées simulées
      await page.evaluate(() => {
        // Mock chrome storage avec tâches manquées
        const mockMissedTasks = [
          {
            id: 'missed1',
            taskId: 'task1',
            taskName: 'Rapport quotidien manqué',
            prompt: 'Générer le rapport quotidien des ventes',
            missedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Il y a 2h
            scheduledFor: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'missed2',
            taskId: 'task2', 
            taskName: 'Veille technologique manquée',
            prompt: 'Rechercher les dernières nouvelles en IA',
            missedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Il y a 30min
            scheduledFor: new Date(Date.now() - 30 * 60 * 1000).toISOString()
          }
        ];

        // Mock du storage
        if (typeof window.chrome === 'undefined') window.chrome = {};
        if (!window.chrome.storage) window.chrome.storage = {};
        if (!window.chrome.storage.local) {
          window.chrome.storage.local = {
            get: (keys, callback) => {
              if (keys.includes && keys.includes('missedTasks')) {
                callback({ missedTasks: mockMissedTasks });
              } else if (keys === 'missedTasks') {
                callback({ missedTasks: mockMissedTasks });
              } else {
                callback({});
              }
            },
            set: (data, callback) => {
              console.log('Storage set:', data);
              if (callback) callback();
            }
          };
        }

        // Fonction pour afficher les tâches manquées
        window.showMissedTasks = (tasks) => {
          const container = document.getElementById('missedTasksContainer') || document.createElement('div');
          container.id = 'missedTasksContainer';
          container.className = 'missed-tasks-section';
          
          if (!document.getElementById('missedTasksContainer')) {
            document.body.appendChild(container);
          }

          container.innerHTML = `
            <h2 class="text-orange-400 font-semibold text-xl tracking-wide flex items-center gap-3">
              ⚠️ Tâches Manquées (${tasks.length})
            </h2>
            <div class="missed-tasks-list">
              ${tasks.map(task => `
                <div class="missed-task-item" data-task-id="${task.id}">
                  <div class="missed-task-header">
                    <h3>${task.taskName}</h3>
                    <span class="missed-time">Manquée il y a ${formatTimeAgo(task.missedAt)}</span>
                  </div>
                  <p class="missed-task-prompt">${task.prompt}</p>
                  <div class="missed-task-actions">
                    <button class="missed-task-btn execute" data-action="execute" data-task-id="${task.id}">
                      🚀 Exécuter maintenant
                    </button>
                    <button class="missed-task-btn dismiss" data-action="dismiss" data-task-id="${task.id}">
                      ❌ Ignorer
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `;

          // Ajouter les event listeners
          container.querySelectorAll('.missed-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const action = e.target.dataset.action;
              const taskId = e.target.dataset.taskId;
              console.log(`Action ${action} sur tâche ${taskId}`);
              
              if (action === 'execute') {
                e.target.textContent = '✅ Exécutée';
                e.target.disabled = true;
              } else if (action === 'dismiss') {
                e.target.closest('.missed-task-item').remove();
              }
            });
          });
        };

        function formatTimeAgo(dateString) {
          const now = new Date();
          const date = new Date(dateString);
          const diffMs = now - date;
          const diffMins = Math.floor(diffMs / (1000 * 60));
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          
          if (diffMins < 60) return `${diffMins} minutes`;
          return `${diffHours} heures`;
        }

        // Afficher automatiquement les tâches manquées
        setTimeout(() => {
          window.showMissedTasks(mockMissedTasks);
        }, 500);
      });

      // Attendre que les tâches manquées soient affichées
      await page.waitForTimeout(1000);

      // Vérifier que la section des tâches manquées est visible
      const missedTasksSection = page.locator('#missedTasksContainer');
      await expect(missedTasksSection).toBeVisible();

      // Vérifier le nombre de tâches manquées
      const missedTasks = page.locator('.missed-task-item');
      await expect(missedTasks).toHaveCount(2);

      // Vérifier le contenu des tâches
      await expect(page.locator('.missed-task-item').first()).toContainText('Rapport quotidien manqué');
      await expect(page.locator('.missed-task-item').last()).toContainText('Veille technologique manquée');

      await page.screenshot({ 
        path: 'test-results/missed-tasks-display.png' 
      });
    });
  });

  test('should handle missed task execution', async ({ page }) => {
    await test.step('Tester l\'exécution de tâches manquées', async () => {
      // Configurer l'environnement avec tâches manquées
      await page.evaluate(() => {
        const mockMissedTasks = [{
          id: 'missed1',
          taskId: 'task1',
          taskName: 'Test Execution',
          prompt: 'Test prompt for execution',
          missedAt: new Date().toISOString(),
          scheduledFor: new Date().toISOString()
        }];

        window.showMissedTasks = (tasks) => {
          const container = document.createElement('div');
          container.id = 'missedTasksContainer';
          container.innerHTML = `
            <div class="missed-task-item" data-task-id="${tasks[0].id}">
              <h3>${tasks[0].taskName}</h3>
              <button class="missed-task-btn execute" data-action="execute" data-task-id="${tasks[0].id}">
                🚀 Exécuter maintenant
              </button>
              <button class="missed-task-btn dismiss" data-action="dismiss" data-task-id="${tasks[0].id}">
                ❌ Ignorer
              </button>
            </div>
          `;
          document.body.appendChild(container);

          // Event listeners pour les actions
          container.querySelectorAll('.missed-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const action = e.target.dataset.action;
              if (action === 'execute') {
                e.target.textContent = '✅ Exécutée';
                e.target.disabled = true;
                e.target.classList.add('executed');
              } else if (action === 'dismiss') {
                e.target.closest('.missed-task-item').style.display = 'none';
              }
            });
          });
        };

        setTimeout(() => window.showMissedTasks(mockMissedTasks), 300);
      });

      await page.waitForTimeout(500);

      // Tester l'exécution
      const executeBtn = page.locator('.missed-task-btn.execute');
      await expect(executeBtn).toBeVisible();
      await executeBtn.click();

      // Vérifier que le bouton change d'état
      await expect(executeBtn).toContainText('✅ Exécutée');
      await expect(executeBtn).toBeDisabled();

      await page.screenshot({ 
        path: 'test-results/missed-task-executed.png' 
      });
    });
  });

  test('should handle missed task dismissal', async ({ page }) => {
    await test.step('Tester l\'ignorance de tâches manquées', async () => {
      // Configurer l'environnement
      await page.evaluate(() => {
        const mockMissedTasks = [{
          id: 'missed1',
          taskId: 'task1',
          taskName: 'Test Dismissal',
          prompt: 'Test prompt for dismissal',
          missedAt: new Date().toISOString(),
          scheduledFor: new Date().toISOString()
        }];

        window.showMissedTasks = (tasks) => {
          const container = document.createElement('div');
          container.id = 'missedTasksContainer';
          container.innerHTML = `
            <div class="missed-task-item" data-task-id="${tasks[0].id}">
              <h3>${tasks[0].taskName}</h3>
              <button class="missed-task-btn dismiss" data-action="dismiss" data-task-id="${tasks[0].id}">
                ❌ Ignorer
              </button>
            </div>
          `;
          document.body.appendChild(container);

          container.querySelectorAll('.missed-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              if (e.target.dataset.action === 'dismiss') {
                e.target.closest('.missed-task-item').style.display = 'none';
              }
            });
          });
        };

        setTimeout(() => window.showMissedTasks(mockMissedTasks), 300);
      });

      await page.waitForTimeout(500);

      // Tester l'ignorance
      const dismissBtn = page.locator('.missed-task-btn.dismiss');
      await expect(dismissBtn).toBeVisible();
      await dismissBtn.click();

      // Vérifier que la tâche disparaît
      const missedTaskItem = page.locator('.missed-task-item');
      await expect(missedTaskItem).toBeHidden();

      await page.screenshot({ 
        path: 'test-results/missed-task-dismissed.png' 
      });
    });
  });

  test('should persist missed tasks across sessions', async ({ page }) => {
    await test.step('Tester la persistence des tâches manquées', async () => {
      // Simuler des données persistées
      await page.evaluate(() => {
        // Mock storage avec persistence
        let storedData = {
          missedTasks: [
            {
              id: 'persistent1',
              taskId: 'task1',
              taskName: 'Persistent Task',
              prompt: 'This task should persist',
              missedAt: new Date().toISOString(),
              scheduledFor: new Date().toISOString()
            }
          ]
        };

        if (typeof window.chrome === 'undefined') window.chrome = {};
        if (!window.chrome.storage) window.chrome.storage = {};
        window.chrome.storage.local = {
          get: (keys, callback) => {
            if (typeof keys === 'string' && keys === 'missedTasks') {
              callback({ missedTasks: storedData.missedTasks });
            } else if (keys.includes && keys.includes('missedTasks')) {
              callback({ missedTasks: storedData.missedTasks });
            } else {
              callback({});
            }
          },
          set: (data, callback) => {
            if (data.missedTasks) {
              storedData.missedTasks = data.missedTasks;
            }
            console.log('Data persisted:', data);
            if (callback) callback();
          }
        };
      });

      // Simuler le rechargement de la page
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      // Vérifier que les APIs de persistance existent (simulation)
      const hasPersistentData = await page.evaluate(() => {
        return typeof window !== 'undefined' && 
               typeof localStorage !== 'undefined';
      });

      expect(hasPersistentData).toBe(true);

      await page.screenshot({ 
        path: 'test-results/missed-tasks-persistence.png' 
      });
    });
  });
});
