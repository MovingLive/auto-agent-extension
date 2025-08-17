/**
 * Helper functions pour les tests d'extension Chrome
 */

class ExtensionHelper {
  constructor(page, context) {
    this.page = page;
    this.context = context;
    this.extensionId = null;
  }

  /**
   * Obtient l'ID de l'extension AutoAgent
   */
  async getExtensionId() {
    if (this.extensionId) return this.extensionId;

    const extensionPage = await this.context.newPage();
    try {
      await extensionPage.goto("chrome://extensions/");
      await extensionPage.waitForSelector("extensions-manager", {
        timeout: 5000,
      });

      // Chercher l'extension par son nom
      const extensions = await extensionPage.$$eval(
        "extensions-item",
        (items) =>
          items.map((item) => ({
            id: item.id,
            name: item.querySelector("#name")?.textContent?.trim(),
          }))
      );

      const autoAgentExtension = extensions.find(
        (ext) => ext.name && ext.name.includes("AutoAgent")
      );

      this.extensionId = autoAgentExtension?.id || null;
      return this.extensionId;
    } catch (error) {
      console.log("Erreur lors de la récupération de l'ID d'extension:", error);
      return null;
    } finally {
      await extensionPage.close();
    }
  }

  /**
   * Ouvre la popup de l'extension
   */
  async openPopup() {
    const extensionId = await this.getExtensionId();
    if (!extensionId) {
      throw new Error("Extension ID non trouvé");
    }

    await this.page.goto(`chrome-extension://${extensionId}/popup.html`);
    await this.page.waitForLoadState("domcontentloaded");
    return this.page;
  }

  /**
   * Vérifie si l'extension est active sur la page courante
   */
  async isExtensionActive() {
    return await this.page.evaluate(() => {
      return typeof window.autoAgentExtensionLoaded !== "undefined";
    });
  }

  /**
   * Simule un clic sur l'icône de l'extension (via popup)
   */
  async clickExtensionIcon() {
    return await this.openPopup();
  }

  /**
   * Simule l'ajout de tâches manquées pour les tests
   */
  async simulateMissedTasks(missedTasks = []) {
    const defaultMissedTasks = [
      {
        id: 'missed-test-1',
        taskId: 'task-test-1',
        taskName: 'Test Missed Task 1',
        prompt: 'This is a test prompt for missed task 1',
        missedAt: new Date(Date.now() - 3600000).toISOString(), // Il y a 1 heure
        scheduledFor: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'missed-test-2',
        taskId: 'task-test-2',
        taskName: 'Test Missed Task 2',
        prompt: 'This is a test prompt for missed task 2',
        missedAt: new Date(Date.now() - 7200000).toISOString(), // Il y a 2 heures
        scheduledFor: new Date(Date.now() - 7200000).toISOString()
      }
    ];

    const tasksToUse = missedTasks;

    await this.page.evaluate((tasks) => {
      // Simuler la réponse du background script
      window.chrome = window.chrome || {};
      window.chrome.runtime = window.chrome.runtime || {};
      window.chrome.runtime.sendMessage = (message, callback) => {
        if (message.action === 'getMissedTasks') {
          callback({ missedTasks: tasks });
        } else if (message.action === 'executeMissedTask') {
          callback({ success: true });
        } else if (message.action === 'dismissMissedTask') {
          callback({ success: true });
        } else if (message.action === 'dismissAllMissedTasks') {
          callback({ success: true });
        }
      };

      // Déclencher le chargement des tâches manquées si la fonction existe
      if (window.loadMissedTasks) {
        window.loadMissedTasks();
      }
    }, tasksToUse);

    // Attendre que l'interface se mette à jour
    await this.page.waitForTimeout(500);
  }

  /**
   * Vérifie si la section des tâches manquées est visible
   */
  async isMissedTasksSectionVisible() {
    const section = this.page.locator('#missedTasksSection');
    return await section.isVisible();
  }

  /**
   * Obtient le nombre de tâches manquées affichées
   */
  async getMissedTasksCount() {
    const items = this.page.locator('.missed-task-item');
    return await items.count();
  }

  /**
   * Clique sur le bouton d'exécution d'une tâche manquée
   */
  async executeMissedTask(index = 0) {
    const executeButton = this.page.locator('.missed-task-btn.execute').nth(index);
    await executeButton.click();
  }

  /**
   * Clique sur le bouton d'ignorance d'une tâche manquée
   */
  async dismissMissedTask(index = 0) {
    const dismissButton = this.page.locator('.missed-task-btn.dismiss').nth(index);
    await dismissButton.click();
  }

  /**
   * Clique sur le bouton "Tout exécuter"
   */
  async executeAllMissedTasks() {
    const executeAllButton = this.page.locator('#executeAllMissedBtn');
    await executeAllButton.click();
  }

  /**
   * Clique sur le bouton "Tout ignorer"
   */
  async dismissAllMissedTasks() {
    const dismissAllButton = this.page.locator('#dismissAllMissedBtn');
    await dismissAllButton.click();
  }

  /**
   * Vérifie le contenu d'une tâche manquée
   */
  async getMissedTaskContent(index = 0) {
    const taskItem = this.page.locator('.missed-task-item').nth(index);
    
    const name = await taskItem.locator('.missed-task-name').textContent();
    const prompt = await taskItem.locator('.missed-task-prompt').textContent();
    const time = await taskItem.locator('.missed-task-time').textContent();
    
    return { name, prompt, time };
  }

  /**
   * Prend des captures d'écran pour les tâches manquées
   */
  async captureScreenshots(testName) {
    await this.page.screenshot({ 
      path: `test-results/missed-tasks-${testName}.png`,
      fullPage: true 
    });
    
    // Capture mobile
    await this.page.setViewportSize({ width: 400, height: 600 });
    await this.page.screenshot({ 
      path: `test-results/missed-tasks-${testName}-mobile.png`,
      fullPage: true 
    });
    
    // Remettre la taille normale
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  /**
   * Teste les animations et effets visuels des tâches manquées
   */
  async testMissedTasksAnimations() {
    // Vérifier l'animation de pulsation sur l'icône d'alerte
    const alertIcon = this.page.locator('.missed-tasks-header .text-xl');
    if (await alertIcon.count() > 0) {
      const animationName = await alertIcon.evaluate(el => 
        window.getComputedStyle(el).animationName
      );
      console.log('Animation on alert icon:', animationName);
    }

    // Tester l'effet hover sur les boutons
    const executeButton = this.page.locator('.missed-task-btn.execute').first();
    if (await executeButton.count() > 0) {
      await executeButton.hover();
      await this.page.waitForTimeout(200);
      
      const transform = await executeButton.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      console.log('Transform on hover:', transform);
    }
  }
}

module.exports = { ExtensionHelper };