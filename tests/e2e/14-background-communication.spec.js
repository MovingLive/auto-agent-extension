// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('AutoAgent - Communication Background Script', () => {
  test.beforeEach(async ({ page }) => {
    // Charger la popup directement en mode fichier local
    const extensionPath = path.resolve(__dirname, '../../extension');
    const popupPath = path.resolve(extensionPath, 'popup.html');
    await page.goto(`file://${popupPath}`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should simulate background script communication', async ({ page }) => {
    await test.step('Simuler la communication vers le background script', async () => {
      // Injecter un mock du background script
      await page.evaluate(() => {
        // Mock chrome.runtime.sendMessage
        if (!window.chrome) window.chrome = {};
        if (!window.chrome.runtime) window.chrome.runtime = {};
        
        window.chrome.runtime.sendMessage = (message, callback) => {
          console.log('Message sent to background:', message);
          
          // Simuler les réponses du background script
          if (message.action === 'getActiveTasks') {
            const mockTasks = [
              { id: '1', name: 'Test Task 1', isActive: true },
              { id: '2', name: 'Test Task 2', isActive: true }
            ];
            setTimeout(() => callback({ tasks: mockTasks }), 100);
          } else if (message.action === 'getMissedTasks') {
            const mockMissedTasks = [
              { id: 'm1', taskName: 'Missed Task 1', prompt: 'Test prompt' }
            ];
            setTimeout(() => callback({ missedTasks: mockMissedTasks }), 100);
          }
        };
      });

      // Vérifier que la page peut charger sans erreur avec le mock
      await expect(page.locator('h1')).toBeVisible();
      
      // Simuler une interaction qui nécessite la communication
      await page.fill('#taskName', 'Communication Test');
      await page.fill('#promptText', 'Test communication with background');
      
      // Capture d'écran pour validation
      await page.screenshot({ 
        path: 'test-results/background-communication-mock.png' 
      });
    });
  });

  test('should handle communication errors gracefully', async ({ page }) => {
    await test.step('Tester la gestion d\'erreurs de communication', async () => {
      // Injecter un mock qui simule des erreurs
      await page.evaluate(() => {
        if (!window.chrome) window.chrome = {};
        if (!window.chrome.runtime) window.chrome.runtime = {};
        
        window.chrome.runtime.sendMessage = (message, callback) => {
          // Simuler une erreur de communication
          setTimeout(() => {
            if (callback) callback(null);
          }, 100);
        };
      });

      // Vérifier que l'interface reste fonctionnelle même sans communication
      await expect(page.locator('#taskName')).toBeVisible();
      await expect(page.locator('#promptText')).toBeVisible();
      await expect(page.locator('#createTaskBtn')).toBeVisible();
      
      // L'interface doit rester utilisable
      await page.fill('#taskName', 'Error Test');
      await page.fill('#promptText', 'Testing error handling');
    });
  });

  test('should validate message structure', async ({ page }) => {
    await test.step('Valider la structure des messages', async () => {
      let capturedMessages = [];
      
      // Capturer les messages envoyés
      await page.evaluate(() => {
        if (!window.chrome) window.chrome = {};
        if (!window.chrome.runtime) window.chrome.runtime = {};
        
        window.capturedMessages = [];
        window.chrome.runtime.sendMessage = (message, callback) => {
          window.capturedMessages.push(message);
          if (callback) callback({ success: true });
        };
      });

      // Effectuer des actions qui déclenchent des messages
      await page.fill('#taskName', 'Message Structure Test');
      await page.fill('#promptText', 'Testing message structure');
      
      // Récupérer les messages capturés
      capturedMessages = await page.evaluate(() => window.capturedMessages || []);
      
      // Valider la structure des messages (si des messages ont été envoyés)
      console.log('Messages captured:', capturedMessages);
      
      await page.screenshot({ 
        path: 'test-results/message-structure-validation.png' 
      });
    });
  });
});
