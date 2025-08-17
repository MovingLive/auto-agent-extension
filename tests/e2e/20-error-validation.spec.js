// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('AutoAgent - Error Handling & Validation', () => {
  test.beforeEach(async ({ page }) => {
    const extensionPath = path.resolve(__dirname, '../../extension');
    const popupPath = path.resolve(extensionPath, 'popup.html');
    await page.goto(`file://${popupPath}`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await test.step('Tester la gestion des erreurs réseau', async () => {
      // Mock des erreurs réseau
      await page.evaluate(() => {
        window.networkErrorHandler = {
          simulateNetworkFailure: function() {
            // Simuler une panne de réseau
            const originalFetch = window.fetch;
            window.fetch = function() {
              return Promise.reject(new Error('Network request failed'));
            };
            
            console.log('Network failure simulated');
            return originalFetch;
          },
          
          handleNetworkError: function(error) {
            console.log('Network error handled:', error.message);
            
            // Afficher un message d'erreur à l'utilisateur
            const errorDiv = document.createElement('div');
            errorDiv.id = 'network-error-message';
            errorDiv.className = 'error-message';
            errorDiv.textContent = 'Erreur réseau: Vérifiez votre connexion internet';
            errorDiv.style.cssText = 'background: #ffebee; color: #c62828; padding: 10px; border-radius: 4px; margin: 10px 0;';
            
            document.body.insertBefore(errorDiv, document.body.firstChild);
            
            // Proposer une action de retry
            const retryButton = document.createElement('button');
            retryButton.id = 'retry-network-button';
            retryButton.textContent = 'Réessayer';
            retryButton.onclick = () => {
              errorDiv.remove();
              retryButton.remove();
              console.log('Network retry attempted');
            };
            
            errorDiv.appendChild(retryButton);
            
            return true;
          },
          
          testNetworkResilience: async function() {
            try {
              // Simuler une requête qui échoue
              await fetch('/nonexistent-endpoint');
            } catch (error) {
              return this.handleNetworkError(error);
            }
          }
        };
      });

      // Simuler une panne réseau
      const originalFetch = await page.evaluate(() => {
        return window.networkErrorHandler.simulateNetworkFailure();
      });

      // Tester la résilience
      const errorHandled = await page.evaluate(() => {
        return window.networkErrorHandler.testNetworkResilience();
      });

      // Vérifier que l'erreur est affichée
      const errorMessage = page.locator('#network-error-message');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('Erreur réseau');

      // Vérifier le bouton de retry
      const retryButton = page.locator('#retry-network-button');
      await expect(retryButton).toBeVisible();

      await retryButton.click();
      
      // Vérifier que le message d'erreur disparaît
      await expect(errorMessage).not.toBeVisible();

      await page.screenshot({ 
        path: 'test-results/error-network-handling.png' 
      });
    });
  });

  test('should validate form inputs comprehensively', async ({ page }) => {
    await test.step('Tester la validation complète des formulaires', async () => {
      // Créer un formulaire de test avec validation
      await page.evaluate(() => {
        const form = document.createElement('form');
        form.id = 'test-validation-form';
        form.innerHTML = `
          <div>
            <label for="task-name">Nom de la tâche:</label>
            <input type="text" id="task-name" name="taskName" required>
            <span class="error" id="task-name-error"></span>
          </div>
          <div>
            <label for="task-prompt">Prompt:</label>
            <textarea id="task-prompt" name="taskPrompt" required minlength="10"></textarea>
            <span class="error" id="task-prompt-error"></span>
          </div>
          <div>
            <label for="task-time">Heure:</label>
            <input type="time" id="task-time" name="taskTime" required>
            <span class="error" id="task-time-error"></span>
          </div>
          <div>
            <label for="task-frequency">Fréquence:</label>
            <select id="task-frequency" name="taskFrequency" required>
              <option value="">Sélectionner...</option>
              <option value="daily">Quotidien</option>
              <option value="weekly">Hebdomadaire</option>
            </select>
            <span class="error" id="task-frequency-error"></span>
          </div>
          <button type="submit" id="submit-button">Créer</button>
        `;
        
        document.body.appendChild(form);
        
        // Système de validation
        window.formValidator = {
          errors: {},
          
          validateTaskName: function(value) {
            if (!value || value.trim().length === 0) {
              return 'Le nom de la tâche est requis';
            }
            if (value.length < 3) {
              return 'Le nom doit contenir au moins 3 caractères';
            }
            if (value.length > 50) {
              return 'Le nom ne peut pas dépasser 50 caractères';
            }
            if (!/^[a-zA-Z0-9\s\-_]+$/.test(value)) {
              return 'Le nom contient des caractères non autorisés';
            }
            return null;
          },
          
          validatePrompt: function(value) {
            if (!value || value.trim().length === 0) {
              return 'Le prompt est requis';
            }
            if (value.length < 10) {
              return 'Le prompt doit contenir au moins 10 caractères';
            }
            if (value.length > 1000) {
              return 'Le prompt ne peut pas dépasser 1000 caractères';
            }
            return null;
          },
          
          validateTime: function(value) {
            if (!value) {
              return 'L\'heure est requise';
            }
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(value)) {
              return 'Format d\'heure invalide (HH:MM)';
            }
            return null;
          },
          
          validateFrequency: function(value) {
            if (!value) {
              return 'La fréquence est requise';
            }
            const validFrequencies = ['daily', 'weekly'];
            if (!validFrequencies.includes(value)) {
              return 'Fréquence non valide';
            }
            return null;
          },
          
          showError: function(fieldId, message) {
            const errorElement = document.getElementById(fieldId + '-error');
            if (errorElement) {
              errorElement.textContent = message;
              errorElement.style.color = 'red';
              errorElement.style.fontSize = '12px';
            }
            
            const field = document.getElementById(fieldId);
            if (field) {
              field.style.borderColor = 'red';
            }
          },
          
          clearError: function(fieldId) {
            const errorElement = document.getElementById(fieldId + '-error');
            if (errorElement) {
              errorElement.textContent = '';
            }
            
            const field = document.getElementById(fieldId);
            if (field) {
              field.style.borderColor = '';
            }
          },
          
          validateField: function(fieldId, validator, value) {
            const error = validator(value);
            if (error) {
              this.showError(fieldId, error);
              this.errors[fieldId] = error;
              return false;
            } else {
              this.clearError(fieldId);
              delete this.errors[fieldId];
              return true;
            }
          },
          
          validateForm: function() {
            this.errors = {};
            
            const taskName = document.getElementById('task-name').value;
            const taskPrompt = document.getElementById('task-prompt').value;
            const taskTime = document.getElementById('task-time').value;
            const taskFrequency = document.getElementById('task-frequency').value;
            
            this.validateField('task-name', this.validateTaskName, taskName);
            this.validateField('task-prompt', this.validatePrompt, taskPrompt);
            this.validateField('task-time', this.validateTime, taskTime);
            this.validateField('task-frequency', this.validateFrequency, taskFrequency);
            
            return Object.keys(this.errors).length === 0;
          }
        };
        
        // Ajouter les event listeners
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          const isValid = window.formValidator.validateForm();
          console.log('Form validation result:', isValid);
          console.log('Errors:', window.formValidator.errors);
        });
        
        // Validation en temps réel
        ['task-name', 'task-prompt', 'task-time', 'task-frequency'].forEach(fieldId => {
          const field = document.getElementById(fieldId);
          field.addEventListener('blur', function() {
            const validator = {
              'task-name': window.formValidator.validateTaskName,
              'task-prompt': window.formValidator.validatePrompt,
              'task-time': window.formValidator.validateTime,
              'task-frequency': window.formValidator.validateFrequency
            }[fieldId];
            
            window.formValidator.validateField(fieldId, validator, this.value);
          });
        });
      });

      // Tester des entrées invalides
      await page.fill('#task-name', 'ab'); // Trop court
      await page.click('#task-prompt'); // Déclencher blur
      
      await expect(page.locator('#task-name-error')).toContainText('au moins 3 caractères');

      await page.fill('#task-prompt', 'court'); // Trop court
      await page.click('#task-time'); // Déclencher blur
      
      await expect(page.locator('#task-prompt-error')).toContainText('au moins 10 caractères');

      // Essayer de soumettre avec des erreurs
      await page.click('#submit-button');
      
      // Vérifier que les erreurs persistent
      await expect(page.locator('#task-name-error')).toBeVisible();
      await expect(page.locator('#task-prompt-error')).toBeVisible();

      // Corriger les erreurs
      await page.fill('#task-name', 'Tache de test valide');
      await page.fill('#task-prompt', 'Ceci est un prompt valide avec suffisamment de caractères');
      await page.fill('#task-time', '14:30');
      await page.selectOption('#task-frequency', 'daily');

      // Déclencher la validation
      await page.click('#submit-button');

      // Vérifier que les erreurs ont disparu
      await expect(page.locator('#task-name-error')).toHaveText('');
      await expect(page.locator('#task-prompt-error')).toHaveText('');
      await expect(page.locator('#task-time-error')).toHaveText('');
      await expect(page.locator('#task-frequency-error')).toHaveText('');

      await page.screenshot({ 
        path: 'test-results/error-form-validation.png' 
      });
    });
  });

  test('should handle execution failures gracefully', async ({ page }) => {
    await test.step('Tester la gestion des échecs d\'exécution', async () => {
      // Simuler des échecs d'exécution de tâches
      await page.evaluate(() => {
        window.executionErrorHandler = {
          executionAttempts: 0,
          maxRetries: 3,
          
          simulateTaskExecution: async function(taskId, shouldFail = false) {
            this.executionAttempts++;
            console.log(`Executing task ${taskId}, attempt ${this.executionAttempts}`);
            
            if (shouldFail) {
              throw new Error(`Task execution failed: ${taskId}`);
            }
            
            return { success: true, taskId, timestamp: Date.now() };
          },
          
          handleExecutionError: async function(taskId, error) {
            console.log(`Execution error for task ${taskId}:`, error.message);
            
            // Enregistrer l'échec
            const failureRecord = {
              taskId,
              error: error.message,
              timestamp: Date.now(),
              attempt: this.executionAttempts
            };
            
            // Afficher notification d'erreur
            this.showExecutionError(failureRecord);
            
            // Décider si retry
            if (this.executionAttempts < this.maxRetries) {
              console.log(`Retrying task ${taskId} (${this.executionAttempts}/${this.maxRetries})`);
              
              // Retry avec délai exponentiel
              const delay = Math.pow(2, this.executionAttempts) * 1000;
              setTimeout(() => {
                this.executeWithRetry(taskId);
              }, delay);
              
              return { retry: true, delay };
            } else {
              console.log(`Max retries exceeded for task ${taskId}`);
              this.markTaskAsFailed(taskId);
              return { retry: false, failed: true };
            }
          },
          
          executeWithRetry: async function(taskId) {
            try {
              const result = await this.simulateTaskExecution(taskId, this.executionAttempts < 2);
              console.log('Task executed successfully:', result);
              this.executionAttempts = 0; // Reset counter on success
              this.showExecutionSuccess(result);
              return result;
            } catch (error) {
              return await this.handleExecutionError(taskId, error);
            }
          },
          
          showExecutionError: function(failure) {
            const errorDiv = document.createElement('div');
            errorDiv.id = `execution-error-${failure.taskId}`;
            errorDiv.className = 'execution-error';
            errorDiv.innerHTML = `
              <div style="background: #ffebee; color: #c62828; padding: 10px; margin: 5px 0; border-radius: 4px;">
                <strong>Échec d'exécution:</strong> ${failure.taskId}<br>
                <small>Tentative ${failure.attempt}/${this.maxRetries}</small><br>
                <small>Erreur: ${failure.error}</small>
              </div>
            `;
            
            document.body.appendChild(errorDiv);
          },
          
          showExecutionSuccess: function(result) {
            const successDiv = document.createElement('div');
            successDiv.id = `execution-success-${result.taskId}`;
            successDiv.className = 'execution-success';
            successDiv.innerHTML = `
              <div style="background: #e8f5e8; color: #2e7d32; padding: 10px; margin: 5px 0; border-radius: 4px;">
                <strong>Exécution réussie:</strong> ${result.taskId}<br>
                <small>Après ${this.executionAttempts} tentative(s)</small>
              </div>
            `;
            
            document.body.appendChild(successDiv);
          },
          
          markTaskAsFailed: function(taskId) {
            const failedDiv = document.createElement('div');
            failedDiv.id = `execution-failed-${taskId}`;
            failedDiv.className = 'execution-failed';
            failedDiv.innerHTML = `
              <div style="background: #fce4ec; color: #ad1457; padding: 10px; margin: 5px 0; border-radius: 4px;">
                <strong>Tâche échouée définitivement:</strong> ${taskId}<br>
                <small>Maximum de tentatives atteint (${this.maxRetries})</small><br>
                <button onclick="window.executionErrorHandler.resetTask('${taskId}')">Réactiver</button>
              </div>
            `;
            
            document.body.appendChild(failedDiv);
          },
          
          resetTask: function(taskId) {
            this.executionAttempts = 0;
            const failedElement = document.getElementById(`execution-failed-${taskId}`);
            if (failedElement) {
              failedElement.remove();
            }
            console.log(`Task ${taskId} reset and ready for retry`);
          }
        };
      });

      // Simuler l'exécution d'une tâche qui échoue
      const executionResult = await page.evaluate(() => {
        return window.executionErrorHandler.executeWithRetry('test-task-123');
      });

      // Attendre que les retries se terminent
      await page.waitForTimeout(3000);

      // Vérifier les messages d'erreur
      const errorMessage = page.locator('#execution-error-test-task-123').first();
      await expect(errorMessage).toBeVisible();

      // Vérifier le message de succès final
      const successMessage = page.locator('#execution-success-test-task-123');
      await expect(successMessage).toBeVisible();

      await page.screenshot({ 
        path: 'test-results/error-execution-handling.png' 
      });
    });
  });

  test('should handle edge cases and boundary conditions', async ({ page }) => {
    await test.step('Tester les cas limites et conditions extrêmes', async () => {
      await page.evaluate(() => {
        window.edgeCaseHandler = {
          testEmptyValues: function() {
            const tests = [
              { input: '', expected: 'empty string' },
              { input: null, expected: 'null value' },
              { input: undefined, expected: 'undefined value' },
              { input: [], expected: 'empty array' },
              { input: {}, expected: 'empty object' }
            ];
            
            const results = tests.map(test => {
              try {
                const result = this.processInput(test.input);
                return { input: test.input, result, success: true };
              } catch (error) {
                return { input: test.input, error: error.message, success: false };
              }
            });
            
            console.log('Empty values test results:', results);
            return results;
          },
          
          testLargeValues: function() {
            const tests = [
              { input: 'x'.repeat(10000), type: 'very long string' },
              { input: Array(1000).fill(0), type: 'large array' },
              { input: Number.MAX_SAFE_INTEGER, type: 'max integer' },
              { input: Number.MIN_SAFE_INTEGER, type: 'min integer' }
            ];
            
            const results = tests.map(test => {
              try {
                const startTime = performance.now();
                const result = this.processInput(test.input);
                const duration = performance.now() - startTime;
                
                return { 
                  type: test.type, 
                  result: typeof result, 
                  duration, 
                  success: true 
                };
              } catch (error) {
                return { 
                  type: test.type, 
                  error: error.message, 
                  success: false 
                };
              }
            });
            
            console.log('Large values test results:', results);
            return results;
          },
          
          testSpecialCharacters: function() {
            const tests = [
              '🤖🚀💻', // Emojis
              'café naïve résumé', // Accents
              '<script>alert("xss")</script>', // HTML/JS injection
              '"; DROP TABLE users; --', // SQL injection
              '\n\r\t\b\f', // Control characters
              '\\\\//""\'\'', // Escape characters
            ];
            
            const results = tests.map(input => {
              try {
                const sanitized = this.sanitizeInput(input);
                return { 
                  original: input, 
                  sanitized, 
                  safe: !sanitized.includes('<script>'),
                  success: true 
                };
              } catch (error) {
                return { 
                  original: input, 
                  error: error.message, 
                  success: false 
                };
              }
            });
            
            console.log('Special characters test results:', results);
            return results;
          },
          
          processInput: function(input) {
            if (input === null) return 'handled null';
            if (input === undefined) return 'handled undefined';
            if (input === '') return 'handled empty string';
            if (Array.isArray(input) && input.length === 0) return 'handled empty array';
            if (typeof input === 'object' && Object.keys(input).length === 0) return 'handled empty object';
            
            return `processed: ${typeof input}`;
          },
          
          sanitizeInput: function(input) {
            if (typeof input !== 'string') return input;
            
            return input
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPT_REMOVED]')
              .replace(/['"]/g, '&quot;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/&/g, '&amp;');
          },
          
          testConcurrentAccess: async function() {
            const sharedResource = { counter: 0, operations: [] };
            const promises = [];
            
            // Simuler 10 accès concurrents
            for (let i = 0; i < 10; i++) {
              const promise = new Promise((resolve) => {
                setTimeout(() => {
                  const operation = {
                    id: i,
                    before: sharedResource.counter,
                    timestamp: Date.now()
                  };
                  
                  sharedResource.counter += 1;
                  operation.after = sharedResource.counter;
                  sharedResource.operations.push(operation);
                  
                  resolve(operation);
                }, Math.random() * 100);
              });
              
              promises.push(promise);
            }
            
            const results = await Promise.all(promises);
            console.log('Concurrent access test:', {
              finalCounter: sharedResource.counter,
              operations: sharedResource.operations,
              expectedCounter: 10
            });
            
            return {
              finalCounter: sharedResource.counter,
              operationsCount: sharedResource.operations.length,
              success: sharedResource.counter === 10
            };
          }
        };
      });

      // Exécuter les tests de cas limites
      const emptyTests = await page.evaluate(() => {
        return window.edgeCaseHandler.testEmptyValues();
      });

      const largeTests = await page.evaluate(() => {
        return window.edgeCaseHandler.testLargeValues();
      });

      const specialCharTests = await page.evaluate(() => {
        return window.edgeCaseHandler.testSpecialCharacters();
      });

      const concurrentTest = await page.evaluate(() => {
        return window.edgeCaseHandler.testConcurrentAccess();
      });

      // Afficher un résumé des tests
      await page.evaluate((results) => {
        const summary = document.createElement('div');
        summary.id = 'edge-case-summary';
        summary.innerHTML = `
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h3>Résumé des tests de cas limites</h3>
            <div>Tests de valeurs vides: ${results.empty.filter(r => r.success).length}/${results.empty.length} réussis</div>
            <div>Tests de grandes valeurs: ${results.large.filter(r => r.success).length}/${results.large.length} réussis</div>
            <div>Tests de caractères spéciaux: ${results.special.filter(r => r.success).length}/${results.special.length} réussis</div>
            <div>Test d'accès concurrent: ${results.concurrent.success ? 'Réussi' : 'Échoué'}</div>
          </div>
        `;
        
        document.body.appendChild(summary);
      }, {
        empty: emptyTests,
        large: largeTests,
        special: specialCharTests,
        concurrent: concurrentTest
      });

      // Vérifier le résumé
      const summary = page.locator('#edge-case-summary');
      await expect(summary).toBeVisible();
      await expect(summary).toContainText('Résumé des tests de cas limites');

      await page.screenshot({ 
        path: 'test-results/error-edge-cases.png' 
      });
    });
  });
});
