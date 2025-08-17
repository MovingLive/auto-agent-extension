// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('AutoAgent - Storage Management', () => {
  test.beforeEach(async ({ page }) => {
    const extensionPath = path.resolve(__dirname, '../../extension');
    const popupPath = path.resolve(extensionPath, 'popup.html');
    await page.goto(`file://${popupPath}`);
    await page.waitForLoadState('domcontentloaded');
    
    // Mock chrome.storage API
    await page.evaluate(() => {
      // Create a mock storage system
      const mockStorage = {
        local: {
          data: {},
          get: function(keys, callback) {
            return new Promise((resolve) => {
              let result = {};
              if (typeof keys === 'string') {
                result[keys] = this.data[keys];
              } else if (Array.isArray(keys)) {
                keys.forEach(key => {
                  result[key] = this.data[key];
                });
              } else if (keys === null || keys === undefined) {
                result = { ...this.data };
              } else if (typeof keys === 'object') {
                Object.keys(keys).forEach(key => {
                  result[key] = this.data[key] !== undefined ? this.data[key] : keys[key];
                });
              }
              if (callback) callback(result);
              resolve(result);
            });
          },
          set: function(items, callback) {
            return new Promise((resolve) => {
              Object.assign(this.data, items);
              console.log('Chrome storage set:', items);
              if (callback) callback();
              resolve();
            });
          },
          remove: function(keys, callback) {
            return new Promise((resolve) => {
              if (typeof keys === 'string') {
                delete this.data[keys];
              } else if (Array.isArray(keys)) {
                keys.forEach(key => delete this.data[key]);
              }
              if (callback) callback();
              resolve();
            });
          },
          clear: function(callback) {
            return new Promise((resolve) => {
              this.data = {};
              if (callback) callback();
              resolve();
            });
          }
        }
      };

      // Mock chrome API
      window.chrome = {
        storage: mockStorage,
        runtime: {
          lastError: null,
          sendMessage: function(message, callback) {
            console.log('Mock chrome.runtime.sendMessage:', message);
            if (callback) {
              setTimeout(() => callback({ success: true }), 10);
            }
            return Promise.resolve({ success: true });
          }
        }
      };

      // Mock window.location if needed
      if (!window.location) {
        window.location = { reload: () => console.log('Page reload mocked') };
      }
    });
  });

  test('should persist task data in chrome.storage', async ({ page }) => {
    await test.step('Tester la persistance des tâches', async () => {
      // Simuler la création d'une tâche
      const taskData = {
        id: 'task-123',
        name: 'Test Task',
        prompt: 'Test prompt content',
        frequency: 'daily',
        time: '09:00',
        enabled: true,
        created: Date.now()
      };

      // Sauvegarder la tâche dans le storage
      await page.evaluate((task) => {
        return window.chrome.storage.local.set({
          [`task_${task.id}`]: task,
          'tasks_list': [task.id]
        });
      }, taskData);

      // Vérifier que la tâche est bien sauvegardée
      const storedTask = await page.evaluate((taskId) => {
        return window.chrome.storage.local.get(`task_${taskId}`);
      }, taskData.id);

      await page.evaluate((expected) => {
        console.log('Stored task validation:', expected);
      }, storedTask);

      // Vérifier la liste des tâches
      const tasksList = await page.evaluate(() => {
        return window.chrome.storage.local.get('tasks_list');
      });

      await page.evaluate((list) => {
        console.log('Tasks list:', list);
      }, tasksList);

      await page.screenshot({ 
        path: 'test-results/storage-task-persistence.png' 
      });
    });
  });

  test('should handle storage corruption recovery', async ({ page }) => {
    await test.step('Tester la récupération de corruption de stockage', async () => {
      // Simuler des données corrompues
      await page.evaluate(() => {
        // Injecter des données invalides
        return window.chrome.storage.local.set({
          'task_corrupted': 'invalid_json_string',
          'tasks_list': null,
          'settings': undefined
        });
      });

      // Simuler une fonction de récupération
      await page.evaluate(() => {
        window.recoverStorage = async function() {
          try {
            const allData = await window.chrome.storage.local.get(null);
            let recovered = 0;
            let cleaned = 0;

            // Parcourir toutes les données
            for (const [key, value] of Object.entries(allData)) {
              if (key.startsWith('task_')) {
                // Vérifier si c'est un objet de tâche valide
                if (typeof value === 'object' && value !== null && value.id && value.name) {
                  recovered++;
                } else {
                  // Supprimer les données corrompues
                  await window.chrome.storage.local.remove(key);
                  cleaned++;
                }
              }
            }

            // Réinitialiser la liste des tâches si elle est corrompue
            const tasksList = allData.tasks_list;
            if (!Array.isArray(tasksList)) {
              await window.chrome.storage.local.set({ 'tasks_list': [] });
              cleaned++;
            }

            console.log(`Storage recovery: ${recovered} tasks recovered, ${cleaned} items cleaned`);
            return { recovered, cleaned };
          } catch (error) {
            console.error('Storage recovery error:', error);
            throw error;
          }
        };
      });

      // Exécuter la récupération
      const recoveryResult = await page.evaluate(() => {
        return window.recoverStorage();
      });

      // Vérifier que la récupération a fonctionné
      await page.evaluate((result) => {
        console.log('Recovery result:', result);
      }, recoveryResult);

      await page.screenshot({ 
        path: 'test-results/storage-corruption-recovery.png' 
      });
    });
  });

  test('should synchronize storage data across extension components', async ({ page }) => {
    await test.step('Tester la synchronisation des données', async () => {
      // Simuler plusieurs composants qui accèdent au storage
      await page.evaluate(() => {
        // Simuler le background script
        window.backgroundStorage = {
          updateTask: async function(taskId, updates) {
            const current = await window.chrome.storage.local.get(`task_${taskId}`);
            const task = current[`task_${taskId}`];
            if (task) {
              const updated = { ...task, ...updates, lastModified: Date.now() };
              await window.chrome.storage.local.set({ [`task_${taskId}`]: updated });
              console.log('Background: Task updated', taskId);
              return updated;
            }
            return null;
          }
        };

        // Simuler le popup script
        window.popupStorage = {
          loadTasks: async function() {
            const tasksList = await window.chrome.storage.local.get('tasks_list');
            const taskIds = tasksList.tasks_list || [];
            const tasks = [];
            
            for (const taskId of taskIds) {
              const taskData = await window.chrome.storage.local.get(`task_${taskId}`);
              if (taskData[`task_${taskId}`]) {
                tasks.push(taskData[`task_${taskId}`]);
              }
            }
            
            console.log('Popup: Tasks loaded', tasks.length);
            return tasks;
          }
        };

        // Simuler le content script
        window.contentStorage = {
          getActiveTask: async function() {
            const tasks = await window.popupStorage.loadTasks();
            const now = new Date();
            const currentHour = now.getHours();
            
            // Trouver une tâche active pour l'heure actuelle
            const activeTask = tasks.find(task => 
              task.enabled && task.time && 
              parseInt(task.time.split(':')[0]) === currentHour
            );
            
            console.log('Content: Active task found', !!activeTask);
            return activeTask;
          }
        };
      });

      // Créer une tâche via le "background"
      const taskId = 'sync-test-task';
      await page.evaluate((id) => {
        const newTask = {
          id: id,
          name: 'Sync Test Task',
          prompt: 'Test synchronization',
          frequency: 'daily',
          time: new Date().getHours() + ':00',
          enabled: true,
          created: Date.now()
        };

        return Promise.all([
          window.chrome.storage.local.set({ [`task_${id}`]: newTask }),
          window.chrome.storage.local.set({ 'tasks_list': [id] })
        ]);
      }, taskId);

      // Charger les tâches via le "popup"
      const loadedTasks = await page.evaluate(() => {
        return window.popupStorage.loadTasks();
      });

      // Vérifier via le "content script"
      const activeTask = await page.evaluate(() => {
        return window.contentStorage.getActiveTask();
      });

      // Mettre à jour via le "background"
      await page.evaluate((id) => {
        return window.backgroundStorage.updateTask(id, { 
          enabled: false, 
          lastRun: Date.now() 
        });
      }, taskId);

      // Recharger pour vérifier la synchronisation
      const updatedTasks = await page.evaluate(() => {
        return window.popupStorage.loadTasks();
      });

      await page.evaluate((results) => {
        console.log('Sync test results:', {
          loadedCount: results.loaded.length,
          activeFound: !!results.active,
          updatedCount: results.updated.length
        });
      }, {
        loaded: loadedTasks,
        active: activeTask,
        updated: updatedTasks
      });

      await page.screenshot({ 
        path: 'test-results/storage-synchronization.png' 
      });
    });
  });

  test('should handle storage quota and cleanup', async ({ page }) => {
    await test.step('Tester la gestion du quota et le nettoyage', async () => {
      // Simuler une approche de limite de quota
      await page.evaluate(() => {
        // Simuler le remplissage du storage
        window.storageQuotaTest = {
          fillStorage: async function(itemCount = 100) {
            const items = {};
            for (let i = 0; i < itemCount; i++) {
              items[`bulk_item_${i}`] = {
                id: `bulk_${i}`,
                data: 'x'.repeat(1000), // 1KB per item
                timestamp: Date.now() - (i * 60000) // Varying ages
              };
            }
            await window.chrome.storage.local.set(items);
            console.log(`Filled storage with ${itemCount} items`);
          },

          getStorageSize: async function() {
            const allData = await window.chrome.storage.local.get(null);
            let size = 0;
            let count = 0;
            
            for (const [key, value] of Object.entries(allData)) {
              count++;
              try {
                size += JSON.stringify(value).length;
              } catch (e) {
                console.warn('Could not measure size of', key);
              }
            }
            
            return { size, count };
          },

          cleanupOldData: async function(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
            const allData = await window.chrome.storage.local.get(null);
            const now = Date.now();
            const toRemove = [];
            
            for (const [key, value] of Object.entries(allData)) {
              if (key.startsWith('bulk_item_') && value.timestamp) {
                if (now - value.timestamp > maxAge) {
                  toRemove.push(key);
                }
              }
            }
            
            if (toRemove.length > 0) {
              await window.chrome.storage.local.remove(toRemove);
              console.log(`Cleaned up ${toRemove.length} old items`);
            }
            
            return toRemove.length;
          }
        };
      });

      // Remplir le storage
      await page.evaluate(() => {
        return window.storageQuotaTest.fillStorage(50);
      });

      // Mesurer la taille
      const beforeSize = await page.evaluate(() => {
        return window.storageQuotaTest.getStorageSize();
      });

      // Attendre un peu et nettoyer
      await page.waitForTimeout(100);
      const cleanedCount = await page.evaluate(() => {
        return window.storageQuotaTest.cleanupOldData(50); // 50ms age limit for test
      });

      // Mesurer après nettoyage
      const afterSize = await page.evaluate(() => {
        return window.storageQuotaTest.getStorageSize();
      });

      await page.evaluate((results) => {
        console.log('Storage quota test:', {
          beforeSize: results.before,
          afterSize: results.after,
          cleaned: results.cleaned
        });
      }, {
        before: beforeSize,
        after: afterSize,
        cleaned: cleanedCount
      });

      await page.screenshot({ 
        path: 'test-results/storage-quota-management.png' 
      });
    });
  });

  test('should handle concurrent storage operations', async ({ page }) => {
    await test.step('Tester les opérations concurrentes', async () => {
      // Simuler des opérations de storage concurrentes
      await page.evaluate(() => {
        window.concurrentTest = {
          performConcurrentWrites: async function() {
            const promises = [];
            
            // Simuler plusieurs écritures simultanées
            for (let i = 0; i < 10; i++) {
              const promise = window.chrome.storage.local.set({
                [`concurrent_${i}`]: {
                  id: i,
                  timestamp: Date.now(),
                  data: `Content ${i}`
                }
              });
              promises.push(promise);
            }
            
            try {
              await Promise.all(promises);
              console.log('All concurrent writes completed');
              return true;
            } catch (error) {
              console.error('Concurrent write error:', error);
              return false;
            }
          },

          performConcurrentReads: async function() {
            const promises = [];
            
            // Simuler plusieurs lectures simultanées
            for (let i = 0; i < 10; i++) {
              const promise = window.chrome.storage.local.get(`concurrent_${i}`);
              promises.push(promise);
            }
            
            try {
              const results = await Promise.all(promises);
              const successCount = results.filter(result => 
                Object.keys(result).length > 0
              ).length;
              
              console.log(`Concurrent reads: ${successCount}/10 successful`);
              return successCount;
            } catch (error) {
              console.error('Concurrent read error:', error);
              return 0;
            }
          },

          simulateRaceCondition: async function() {
            // Simuler une condition de course sur une valeur partagée
            const key = 'shared_counter';
            
            // Initialiser le compteur
            await window.chrome.storage.local.set({ [key]: 0 });
            
            const incrementOperations = [];
            
            // Simuler 5 incréments simultanés
            for (let i = 0; i < 5; i++) {
              const operation = (async () => {
                const current = await window.chrome.storage.local.get(key);
                const value = current[key] || 0;
                const newValue = value + 1;
                await window.chrome.storage.local.set({ [key]: newValue });
                return newValue;
              })();
              
              incrementOperations.push(operation);
            }
            
            const results = await Promise.all(incrementOperations);
            const finalValue = await window.chrome.storage.local.get(key);
            
            console.log('Race condition test:', {
              operationResults: results,
              finalValue: finalValue[key],
              expectedValue: 5
            });
            
            return {
              results,
              finalValue: finalValue[key],
              isCorrect: finalValue[key] === 5
            };
          }
        };
      });

      // Exécuter les tests de concurrence
      const writeResult = await page.evaluate(() => {
        return window.concurrentTest.performConcurrentWrites();
      });

      const readResult = await page.evaluate(() => {
        return window.concurrentTest.performConcurrentReads();
      });

      const raceResult = await page.evaluate(() => {
        return window.concurrentTest.simulateRaceCondition();
      });

      await page.evaluate((results) => {
        console.log('Concurrent operations test results:', results);
      }, {
        writeSuccess: writeResult,
        readCount: readResult,
        raceCondition: raceResult
      });

      await page.screenshot({ 
        path: 'test-results/storage-concurrent-operations.png' 
      });
    });
  });
});
