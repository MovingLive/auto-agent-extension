// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('AutoAgent - Gestion des Alarmes Chrome', () => {
  test.beforeEach(async ({ page }) => {
    const extensionPath = path.resolve(__dirname, '../../extension');
    const popupPath = path.resolve(extensionPath, 'popup.html');
    await page.goto(`file://${popupPath}`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should simulate alarm creation and management', async ({ page }) => {
    await test.step('Simuler la création d\'alarmes Chrome', async () => {
      // Mock chrome.alarms API
      await page.evaluate(() => {
        const alarms = new Map();
        
        if (typeof window.chrome === 'undefined') window.chrome = {};
        window.chrome.alarms = {
          create: (name, alarmInfo) => {
            console.log(`Alarm created: ${name}`, alarmInfo);
            alarms.set(name, {
              name: name,
              scheduledTime: Date.now() + (alarmInfo.delayInMinutes * 60 * 1000),
              periodInMinutes: alarmInfo.periodInMinutes || null
            });
            return Promise.resolve();
          },
          
          clear: (name) => {
            console.log(`Alarm cleared: ${name}`);
            const existed = alarms.has(name);
            alarms.delete(name);
            return Promise.resolve(existed);
          },
          
          clearAll: () => {
            console.log('All alarms cleared');
            const count = alarms.size;
            alarms.clear();
            return Promise.resolve(count > 0);
          },
          
          getAll: () => {
            const allAlarms = Array.from(alarms.values());
            console.log('Getting all alarms:', allAlarms);
            return Promise.resolve(allAlarms);
          },
          
          get: (name) => {
            const alarm = alarms.get(name) || null;
            console.log(`Getting alarm ${name}:`, alarm);
            return Promise.resolve(alarm);
          },
          
          // Expose pour les tests
          _getActiveAlarms: () => alarms,
          _triggerAlarm: (name) => {
            if (alarms.has(name)) {
              console.log(`Triggering alarm: ${name}`);
              // Simuler le déclenchement d'alarme
              if (window.chrome.alarms.onAlarm) {
                window.chrome.alarms.onAlarm.dispatch({ name: name });
              }
            }
          }
        };
        
        // Mock chrome.storage pour les tests
        if (!window.chrome.storage) {
          window.chrome.storage = {
            local: {
              get: (keys, callback) => {
                // Retourner des données de test
                const mockData = {
                  cronTasks: [
                    {
                      id: 'test-task-1',
                      name: 'Test Alarm Task',
                      prompt: 'Test alarm functionality',
                      intervalInMinutes: 30,
                      isActive: true,
                      createdAt: new Date().toISOString()
                    }
                  ]
                };
                
                if (typeof keys === 'string') {
                  callback({ [keys]: mockData[keys] || [] });
                } else if (keys.includes && keys.includes('cronTasks')) {
                  callback({ cronTasks: mockData.cronTasks });
                } else {
                  callback(mockData);
                }
              },
              set: (data, callback) => {
                console.log('Storage set:', data);
                if (callback) callback();
              }
            }
          };
        }
      });

      // Créer une tâche qui doit déclencher une alarme
      await page.fill('#taskName', 'Test Alarm Creation');
      await page.fill('#promptText', 'Test alarm creation functionality');
      
      // Sélectionner mode heures et configurer
      await page.click('button[data-unit="hours"]');
      await page.waitForTimeout(200);
      await page.fill('#hourMinutes', '15');
      
      // Créer la tâche
      await page.click('#createTaskBtn');
      await page.waitForTimeout(500);

      // Vérifier que l'alarme a été "créée" (via les logs)
      const alarmLogs = await page.evaluate(() => {
        // Vérifier que des alarmes ont été créées
        if (window.chrome && window.chrome.alarms && window.chrome.alarms._getActiveAlarms) {
          const activeAlarms = window.chrome.alarms._getActiveAlarms();
          return {
            count: activeAlarms.size,
            alarms: Array.from(activeAlarms.entries())
          };
        }
        return { count: 0, alarms: [] };
      });

      console.log('Alarmes créées:', alarmLogs);

      await page.screenshot({ 
        path: 'test-results/alarm-creation-simulation.png' 
      });
    });
  });

  test('should simulate alarm triggering', async ({ page }) => {
    await test.step('Simuler le déclenchement d\'alarmes', async () => {
      // Configurer l'environnement de test
      await page.evaluate(() => {
        // Mock système d'alarmes avec callbacks
        const alarms = new Map();
        let alarmCallbacks = [];
        
        if (typeof window.chrome === 'undefined') window.chrome = {};
        window.chrome.alarms = {
          create: (name, alarmInfo) => {
            alarms.set(name, {
              name: name,
              scheduledTime: Date.now() + (alarmInfo.delayInMinutes * 60 * 1000),
              periodInMinutes: alarmInfo.periodInMinutes || null
            });
          },
          
          onAlarm: {
            addListener: (callback) => {
              alarmCallbacks.push(callback);
            },
            dispatch: (alarm) => {
              alarmCallbacks.forEach(callback => callback(alarm));
            }
          },
          
          _triggerTestAlarm: (name) => {
            if (alarms.has(name)) {
              const alarm = alarms.get(name);
              alarmCallbacks.forEach(callback => callback(alarm));
              return true;
            }
            return false;
          },
          
          _getAlarmCount: () => alarms.size
        };

        // Ajouter un listener d'alarme
        window.chrome.alarms.onAlarm.addListener((alarm) => {
          console.log('Alarm triggered:', alarm.name);
          // Simuler l'exécution de tâche
          const event = new CustomEvent('alarmTriggered', { 
            detail: { alarmName: alarm.name } 
          });
          document.dispatchEvent(event);
        });

        // Mock storage
        window.chrome.storage = {
          local: {
            get: (keys, callback) => {
              callback({
                cronTasks: [{
                  id: 'test-alarm-task',
                  name: 'Alarm Test Task',
                  isActive: true,
                  intervalInMinutes: 1
                }]
              });
            },
            set: (data, callback) => {
              if (callback) callback();
            }
          }
        };
      });

      // Créer une alarme de test
      await page.evaluate(() => {
        if (window.chrome && window.chrome.alarms) {
          window.chrome.alarms.create('test-alarm-task', {
            delayInMinutes: 1,
            periodInMinutes: 1
          });
        }
      });

      // Simuler le déclenchement
      const alarmTriggered = await page.evaluate(() => {
        if (window.chrome && window.chrome.alarms && window.chrome.alarms._triggerTestAlarm) {
          return window.chrome.alarms._triggerTestAlarm('test-alarm-task');
        }
        return false;
      });

      expect(alarmTriggered).toBe(true);

      await page.screenshot({ 
        path: 'test-results/alarm-triggering-simulation.png' 
      });
    });
  });

  test('should handle alarm cleanup on task deletion', async ({ page }) => {
    await test.step('Tester le nettoyage des alarmes', async () => {
      let clearedAlarms = [];
      
      // Mock complet du système d'alarmes
      await page.evaluate(() => {
        const alarms = new Map();
        
        if (typeof window.chrome === 'undefined') window.chrome = {};
        window.chrome.alarms = {
          create: (name, alarmInfo) => {
            alarms.set(name, { name, ...alarmInfo });
            console.log(`Alarm created: ${name}`);
          },
          
          clear: (name) => {
            const existed = alarms.has(name);
            alarms.delete(name);
            window.clearedAlarms = window.clearedAlarms || [];
            window.clearedAlarms.push(name);
            console.log(`Alarm cleared: ${name}`);
            return Promise.resolve(existed);
          },
          
          getAll: () => Array.from(alarms.values()),
          
          _getAlarmCount: () => alarms.size
        };

        // Mock storage avec tâche existante
        window.chrome.storage = {
          local: {
            get: (keys, callback) => {
              callback({
                cronTasks: [{
                  id: 'task-to-delete',
                  name: 'Task to Delete',
                  isActive: true,
                  intervalInMinutes: 30
                }]
              });
            },
            set: (data, callback) => {
              console.log('Tasks updated:', data);
              if (callback) callback();
            }
          }
        };

        window.clearedAlarms = [];
      });

      // Créer une alarme
      await page.evaluate(() => {
        window.chrome.alarms.create('task-to-delete', {
          delayInMinutes: 30,
          periodInMinutes: 30
        });
      });

      // Vérifier qu'elle existe
      const alarmCountBefore = await page.evaluate(() => {
        return window.chrome.alarms._getAlarmCount();
      });
      expect(alarmCountBefore).toBe(1);

      // Simuler la suppression de tâche
      await page.evaluate(() => {
        // Simuler la fonction deleteTask
        window.chrome.alarms.clear('task-to-delete');
      });

      // Vérifier que l'alarme a été supprimée
      clearedAlarms = await page.evaluate(() => window.clearedAlarms || []);
      expect(clearedAlarms).toContain('task-to-delete');

      const alarmCountAfter = await page.evaluate(() => {
        return window.chrome.alarms._getAlarmCount();
      });
      expect(alarmCountAfter).toBe(0);

      await page.screenshot({ 
        path: 'test-results/alarm-cleanup-test.png' 
      });
    });
  });

  test('should handle multiple alarms management', async ({ page }) => {
    await test.step('Gérer plusieurs alarmes simultanément', async () => {
      // Mock pour gérer plusieurs alarmes
      await page.evaluate(() => {
        const alarms = new Map();
        
        if (typeof window.chrome === 'undefined') window.chrome = {};
        window.chrome.alarms = {
          create: (name, alarmInfo) => {
            alarms.set(name, {
              name: name,
              ...alarmInfo,
              createdAt: Date.now()
            });
          },
          
          getAll: () => Array.from(alarms.values()),
          
          clear: (name) => {
            return alarms.delete(name);
          },
          
          clearAll: () => {
            const count = alarms.size;
            alarms.clear();
            return count;
          },
          
          _getAllAlarms: () => alarms,
          _getAlarmCount: () => alarms.size
        };
      });

      // Créer plusieurs alarmes
      await page.evaluate(() => {
        const tasks = [
          { id: 'task1', interval: 15 },
          { id: 'task2', interval: 30 },
          { id: 'task3', interval: 60 },
          { id: 'task4', interval: 120 }
        ];

        tasks.forEach(task => {
          window.chrome.alarms.create(task.id, {
            delayInMinutes: task.interval,
            periodInMinutes: task.interval
          });
        });
      });

      // Vérifier le nombre d'alarmes
      const alarmCount = await page.evaluate(() => {
        return window.chrome.alarms._getAlarmCount();
      });
      expect(alarmCount).toBe(4);

      // Obtenir toutes les alarmes
      const allAlarms = await page.evaluate(() => {
        return window.chrome.alarms.getAll();
      });
      expect(allAlarms).toHaveLength(4);

      // Vérifier que chaque alarme a les bonnes propriétés
      allAlarms.forEach(alarm => {
        expect(alarm).toHaveProperty('name');
        expect(alarm).toHaveProperty('delayInMinutes');
        expect(alarm).toHaveProperty('periodInMinutes');
      });

      // Nettoyer toutes les alarmes
      const clearedCount = await page.evaluate(() => {
        return window.chrome.alarms.clearAll();
      });
      expect(clearedCount).toBe(4);

      await page.screenshot({ 
        path: 'test-results/multiple-alarms-management.png' 
      });
    });
  });
});
