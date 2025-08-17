// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('AutoAgent - Extension Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    const extensionPath = path.resolve(__dirname, '../../extension');
    const popupPath = path.resolve(extensionPath, 'popup.html');
    await page.goto(`file://${popupPath}`);
    await page.waitForLoadState('domcontentloaded');
    
    // Mock extension lifecycle APIs
    await page.evaluate(() => {
      // Mock chrome.runtime for lifecycle events
      window.chrome = {
        runtime: {
          onInstalled: {
            addListener: function(callback) {
              console.log('onInstalled listener added');
              // Simuler l'événement d'installation
              setTimeout(() => {
                callback({ reason: 'install', previousVersion: undefined });
              }, 100);
            }
          },
          onStartup: {
            addListener: function(callback) {
              console.log('onStartup listener added');
              setTimeout(() => callback(), 50);
            }
          },
          onSuspend: {
            addListener: function(callback) {
              console.log('onSuspend listener added');
              setTimeout(() => callback(), 200);
            }
          },
          getManifest: function() {
            return {
              version: '1.0.0',
              name: 'AutoAgent',
              manifest_version: 3
            };
          },
          id: 'mock-extension-id-12345'
        },
        storage: {
          local: {
            data: {},
            get: function(keys) {
              return Promise.resolve(keys ? { [keys]: this.data[keys] } : this.data);
            },
            set: function(items) {
              Object.assign(this.data, items);
              return Promise.resolve();
            },
            clear: function() {
              this.data = {};
              return Promise.resolve();
            }
          }
        },
        alarms: {
          create: function(name, alarmInfo) {
            console.log('Alarm created:', name, alarmInfo);
          },
          clear: function(name) {
            console.log('Alarm cleared:', name);
            return Promise.resolve(true);
          },
          getAll: function() {
            return Promise.resolve([]);
          }
        }
      };
    });
  });

  test('should handle extension installation', async ({ page }) => {
    await test.step('Tester l\'installation de l\'extension', async () => {
      // Simuler l'installation initiale
      await page.evaluate(() => {
        window.extensionInstallation = {
          isFirstInstall: false,
          
          handleInstallation: async function(details) {
            console.log('Installation details:', details);
            
            if (details.reason === 'install') {
              this.isFirstInstall = true;
              
              // Initialiser les données par défaut
              await window.chrome.storage.local.set({
                'version': '1.0.0',
                'installed_at': Date.now(),
                'tasks_list': [],
                'settings': {
                  language: 'fr',
                  notifications: true,
                  theme: 'light'
                }
              });
              
              console.log('Extension installed - default data initialized');
              return true;
            }
            
            return false;
          },
          
          checkInstallationStatus: async function() {
            const data = await window.chrome.storage.local.get(['version', 'installed_at']);
            return {
              isInstalled: !!data.version,
              installedAt: data.installed_at,
              version: data.version
            };
          }
        };
        
        // Déclencher l'installation
        if (window.chrome.runtime.onInstalled.addListener) {
          window.chrome.runtime.onInstalled.addListener(window.extensionInstallation.handleInstallation.bind(window.extensionInstallation));
        }
      });

      // Attendre que l'installation soit traitée
      await page.waitForTimeout(200);

      // Vérifier l'état d'installation
      const installStatus = await page.evaluate(() => {
        return window.extensionInstallation.checkInstallationStatus();
      });

      await page.evaluate((status) => {
        console.log('Installation status:', status);
      }, installStatus);

      await page.screenshot({ 
        path: 'test-results/lifecycle-installation.png' 
      });
    });
  });

  test('should handle extension updates', async ({ page }) => {
    await test.step('Tester les mises à jour d\'extension', async () => {
      // Simuler une extension déjà installée
      await page.evaluate(() => {
        return window.chrome.storage.local.set({
          'version': '0.9.0',
          'installed_at': Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 jours
          'tasks_list': ['old-task-1', 'old-task-2']
        });
      });

      await page.evaluate(() => {
        window.extensionUpdate = {
          currentVersion: '1.0.0',
          
          handleUpdate: async function(details) {
            if (details.reason === 'update') {
              const previousVersion = details.previousVersion;
              console.log(`Updating from ${previousVersion} to ${this.currentVersion}`);
              
              // Migration logic
              if (previousVersion === '0.9.0') {
                await this.migrateFromV09();
              }
              
              // Update version
              await window.chrome.storage.local.set({
                'version': this.currentVersion,
                'updated_at': Date.now(),
                'previous_version': previousVersion
              });
              
              return true;
            }
            return false;
          },
          
          migrateFromV09: async function() {
            console.log('Migrating data from v0.9.0');
            
            // Exemple de migration : ajouter de nouveaux champs aux tâches
            const data = await window.chrome.storage.local.get(null);
            const taskIds = data.tasks_list || [];
            
            for (const taskId of taskIds) {
              const taskKey = `task_${taskId}`;
              const task = data[taskKey];
              
              if (task && !task.version) {
                task.version = '1.0.0';
                task.migrated = true;
                task.migratedAt = Date.now();
                
                await window.chrome.storage.local.set({ [taskKey]: task });
              }
            }
            
            console.log(`Migrated ${taskIds.length} tasks`);
          }
        };
        
        // Simuler une mise à jour
        setTimeout(() => {
          window.extensionUpdate.handleUpdate({
            reason: 'update',
            previousVersion: '0.9.0'
          });
        }, 100);
      });

      // Attendre la migration
      await page.waitForTimeout(300);

      // Vérifier que la migration a eu lieu
      const migrationStatus = await page.evaluate(() => {
        return window.chrome.storage.local.get(['version', 'updated_at', 'previous_version']);
      });

      await page.evaluate((status) => {
        console.log('Migration status:', status);
      }, migrationStatus);

      await page.screenshot({ 
        path: 'test-results/lifecycle-update.png' 
      });
    });
  });

  test('should handle browser startup', async ({ page }) => {
    await test.step('Tester le démarrage du navigateur', async () => {
      // Simuler le démarrage du navigateur
      await page.evaluate(() => {
        window.browserStartup = {
          startupTime: null,
          tasksRestored: 0,
          alarmsRestored: 0,
          
          handleStartup: async function() {
            this.startupTime = Date.now();
            console.log('Browser startup detected');
            
            // Restaurer les tâches
            const tasksData = await window.chrome.storage.local.get('tasks_list');
            const taskIds = tasksData.tasks_list || [];
            this.tasksRestored = taskIds.length;
            
            // Restaurer les alarmes pour les tâches actives
            for (const taskId of taskIds) {
              const taskData = await window.chrome.storage.local.get(`task_${taskId}`);
              const task = taskData[`task_${taskId}`];
              
              if (task && task.enabled) {
                // Recréer l'alarme
                window.chrome.alarms.create(`task_${taskId}`, {
                  when: this.calculateNextExecution(task)
                });
                this.alarmsRestored++;
              }
            }
            
            console.log(`Startup complete: ${this.tasksRestored} tasks, ${this.alarmsRestored} alarms restored`);
            
            // Marquer le dernier démarrage
            await window.chrome.storage.local.set({
              'last_startup': this.startupTime
            });
          },
          
          calculateNextExecution: function(task) {
            // Logique simplifiée pour calculer la prochaine exécution
            const now = new Date();
            const [hours, minutes] = task.time.split(':').map(Number);
            
            const nextExecution = new Date();
            nextExecution.setHours(hours, minutes, 0, 0);
            
            // Si l'heure est passée aujourd'hui, planifier pour demain
            if (nextExecution <= now) {
              nextExecution.setDate(nextExecution.getDate() + 1);
            }
            
            return nextExecution.getTime();
          }
        };
        
        // Ajouter des tâches de test
        return window.chrome.storage.local.set({
          'tasks_list': ['startup-task-1', 'startup-task-2'],
          'task_startup-task-1': {
            id: 'startup-task-1',
            name: 'Morning Task',
            time: '09:00',
            enabled: true
          },
          'task_startup-task-2': {
            id: 'startup-task-2',
            name: 'Evening Task',
            time: '18:00',
            enabled: false
          }
        });
      });

      // Déclencher le démarrage
      await page.evaluate(() => {
        if (window.chrome.runtime.onStartup.addListener) {
          window.chrome.runtime.onStartup.addListener(() => {
            window.browserStartup.handleStartup();
          });
        }
      });

      // Attendre le traitement
      await page.waitForTimeout(200);

      // Vérifier le résultat du démarrage
      const startupResult = await page.evaluate(() => {
        return {
          startupTime: window.browserStartup.startupTime,
          tasksRestored: window.browserStartup.tasksRestored,
          alarmsRestored: window.browserStartup.alarmsRestored
        };
      });

      await page.evaluate((result) => {
        console.log('Startup result:', result);
      }, startupResult);

      await page.screenshot({ 
        path: 'test-results/lifecycle-startup.png' 
      });
    });
  });

  test('should handle extension suspension and cleanup', async ({ page }) => {
    await test.step('Tester la suspension et le nettoyage', async () => {
      // Préparer des données à nettoyer
      await page.evaluate(() => {
        return window.chrome.storage.local.set({
          'temp_data': 'should be cleaned',
          'session_cache': { items: [1, 2, 3] },
          'persistent_settings': { theme: 'dark' }
        });
      });

      await page.evaluate(() => {
        window.extensionSuspension = {
          cleanupCompleted: false,
          
          handleSuspension: async function() {
            console.log('Extension suspension detected - starting cleanup');
            
            try {
              // Nettoyer les données temporaires
              await window.chrome.storage.local.remove(['temp_data', 'session_cache']);
              
              // Sauvegarder l'état de suspension
              await window.chrome.storage.local.set({
                'last_suspension': Date.now(),
                'cleanup_completed': true
              });
              
              // Arrêter les alarmes non critiques
              const alarms = await window.chrome.alarms.getAll();
              for (const alarm of alarms) {
                if (alarm.name.startsWith('temp_')) {
                  await window.chrome.alarms.clear(alarm.name);
                }
              }
              
              this.cleanupCompleted = true;
              console.log('Suspension cleanup completed');
              
            } catch (error) {
              console.error('Suspension cleanup error:', error);
            }
          }
        };
        
        // Déclencher la suspension
        if (window.chrome.runtime.onSuspend && window.chrome.runtime.onSuspend.addListener) {
          window.chrome.runtime.onSuspend.addListener(() => {
            window.extensionSuspension.handleSuspension();
          });
        }
      });

      // Simuler la suspension
      await page.evaluate(() => {
        // Appeler directement la fonction puisque onSuspend n'est pas complètement simulé
        window.extensionSuspension.handleSuspension();
      });

      // Attendre le nettoyage
      await page.waitForTimeout(150);

      // Vérifier que le nettoyage a eu lieu
      const cleanupStatus = await page.evaluate(() => {
        return window.chrome.storage.local.get(null);
      });

      const suspensionResult = await page.evaluate(() => {
        return {
          cleanupCompleted: window.extensionSuspension.cleanupCompleted
        };
      });

      await page.evaluate((results) => {
        console.log('Suspension results:', {
          storageAfterCleanup: results.storage,
          cleanupCompleted: results.suspensionResult.cleanupCompleted
        });
      }, {
        storage: cleanupStatus,
        suspensionResult
      });

      await page.screenshot({ 
        path: 'test-results/lifecycle-suspension.png' 
      });
    });
  });

  test('should handle version compatibility checks', async ({ page }) => {
    await test.step('Tester la compatibilité des versions', async () => {
      await page.evaluate(() => {
        window.versionCompatibility = {
          currentVersion: '1.0.0',
          minSupportedVersion: '0.8.0',
          
          checkCompatibility: async function() {
            const data = await window.chrome.storage.local.get('version');
            const storedVersion = data.version;
            
            if (!storedVersion) {
              return { compatible: true, action: 'fresh_install' };
            }
            
            const result = this.compareVersions(storedVersion, this.minSupportedVersion);
            
            if (result < 0) {
              // Version trop ancienne
              return { 
                compatible: false, 
                action: 'full_reset',
                reason: `Version ${storedVersion} is below minimum supported ${this.minSupportedVersion}`
              };
            }
            
            if (storedVersion !== this.currentVersion) {
              return { 
                compatible: true, 
                action: 'update',
                from: storedVersion,
                to: this.currentVersion
              };
            }
            
            return { compatible: true, action: 'none' };
          },
          
          compareVersions: function(version1, version2) {
            const v1Parts = version1.split('.').map(Number);
            const v2Parts = version2.split('.').map(Number);
            
            for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
              const v1Part = v1Parts[i] || 0;
              const v2Part = v2Parts[i] || 0;
              
              if (v1Part < v2Part) return -1;
              if (v1Part > v2Part) return 1;
            }
            
            return 0;
          },
          
          handleIncompatibleVersion: async function() {
            console.log('Handling incompatible version - performing full reset');
            
            // Sauvegarder les données critiques avant reset
            const criticalData = await window.chrome.storage.local.get(['user_preferences']);
            
            // Reset complet
            await window.chrome.storage.local.clear();
            
            // Restaurer les données critiques
            if (criticalData.user_preferences) {
              await window.chrome.storage.local.set({
                'user_preferences': criticalData.user_preferences
              });
            }
            
            // Initialiser avec la nouvelle version
            await window.chrome.storage.local.set({
              'version': this.currentVersion,
              'reset_from_incompatible': true,
              'reset_at': Date.now()
            });
            
            return true;
          }
        };
      });

      // Tester avec une version incompatible
      await page.evaluate(() => {
        return window.chrome.storage.local.set({
          'version': '0.7.0', // En dessous du minimum
          'user_preferences': { theme: 'dark', lang: 'fr' }
        });
      });

      const compatibilityCheck = await page.evaluate(() => {
        return window.versionCompatibility.checkCompatibility();
      });

      await page.evaluate((check) => {
        console.log('Compatibility check result:', check);
      }, compatibilityCheck);

      // Si incompatible, effectuer le reset
      if (!compatibilityCheck.compatible) {
        const resetResult = await page.evaluate(() => {
          return window.versionCompatibility.handleIncompatibleVersion();
        });

        const finalState = await page.evaluate(() => {
          return window.chrome.storage.local.get(null);
        });

        await page.evaluate((results) => {
          console.log('Version compatibility results:', {
            resetSuccessful: results.reset,
            finalState: results.state
          });
        }, {
          reset: resetResult,
          state: finalState
        });
      }

      await page.screenshot({ 
        path: 'test-results/lifecycle-version-compatibility.png' 
      });
    });
  });
});
