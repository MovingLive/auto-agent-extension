// @ts-check

/**
 * Utilitaires helper pour les tests Playwright AutoAgent
 */

/**
 * Attend qu'un élément soit visible et stable
 * @param {import('@playwright/test').Page} page 
 * @param {string} selector 
 * @param {number} timeout 
 */
async function waitForElementStable(page, selector, timeout = 5000) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  
  // Attendre que l'élément soit stable (pas d'animation)
  await page.waitForTimeout(300);
  
  return element;
}

/**
 * Crée une tâche de test avec des valeurs par défaut
 * @param {import('@playwright/test').Page} page 
 * @param {Object} options 
 */
async function createTestTask(page, options = {}) {
  const {
    name = 'Test Task',
    prompt = 'Test prompt for automation',
    mode = 'hours',
    ...modeConfig
  } = options;

  // Remplir le nom
  await page.locator('#taskName').fill(name);
  
  // Remplir le prompt
  await page.locator('#promptText').fill(prompt);
  
  // Sélectionner le mode
  await page.locator(`[data-unit="${mode}"]`).click();
  
  // Configurer selon le mode
  if (mode === 'hours' && modeConfig.minutes !== undefined) {
    await page.locator('#hourMinutes').fill(String(modeConfig.minutes));
  } else if (mode === 'days') {
    if (modeConfig.hours !== undefined) {
      await page.locator('#dayHours').fill(String(modeConfig.hours));
    }
    if (modeConfig.minutes !== undefined) {
      await page.locator('#dayMinutes').fill(String(modeConfig.minutes));
    }
  } else if (mode === 'weeks') {
    if (modeConfig.day !== undefined) {
      await page.locator('#weekDay').selectOption(String(modeConfig.day));
    }
    if (modeConfig.hours !== undefined) {
      await page.locator('#weekHours').fill(String(modeConfig.hours));
    }
    if (modeConfig.minutes !== undefined) {
      await page.locator('#weekMinutes').fill(String(modeConfig.minutes));
    }
  }
  
  // Créer la tâche
  await page.locator('#createTaskBtn').click();
}

/**
 * Vérifie que tous les modes de planification sont accessibles
 * @param {import('@playwright/test').Page} page 
 */
async function validateAllScheduleModes(page) {
  const modes = [
    { unit: 'hours', config: '#hoursConfig' },
    { unit: 'days', config: '#daysConfig' },
    { unit: 'weeks', config: '#weeksConfig' }
  ];
  
  const results = {};
  
  for (const mode of modes) {
    await page.locator(`[data-unit="${mode.unit}"]`).click();
    await page.waitForTimeout(300);
    
    const isVisible = await page.locator(mode.config).isVisible();
    results[mode.unit] = {
      accessible: true,
      configVisible: isVisible
    };
  }
  
  return results;
}

/**
 * Prend des captures d'écran pour tous les modes
 * @param {import('@playwright/test').Page} page 
 * @param {string} testName 
 */
async function captureAllModes(page, testName) {
  const modes = ['hours', 'days', 'weeks'];
  
  for (const mode of modes) {
    await page.locator(`[data-unit="${mode}"]`).click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: `test-results/${testName}-${mode}-mode.png` 
    });
  }
}

/**
 * Vérifie l'intégrité de la structure HTML
 * @param {import('@playwright/test').Page} page 
 */
async function validateHTMLStructure(page) {
  const requiredElements = [
    'h1', // Header principal
    '#taskName', // Champ nom de tâche
    '#promptText', // Champ prompt
    '#createTaskBtn', // Bouton création
    '.schedule-configurations', // Container planification
    '[data-unit="hours"]', // Bouton heures
    '[data-unit="days"]', // Bouton jours
    '[data-unit="weeks"]', // Bouton semaines
    '#hoursConfig', // Config heures
    '#daysConfig', // Config jours
    '#weeksConfig', // Config semaines
    '#activeCount', // Compteur actif
    '#pausedCount' // Compteur pause
  ];
  
  const results = {};
  
  for (const selector of requiredElements) {
    try {
      const element = page.locator(selector);
      const isVisible = await element.isVisible();
      results[selector] = { exists: true, visible: isVisible };
    } catch (error) {
      results[selector] = { exists: false, visible: false, error: error.message };
    }
  }
  
  return results;
}

/**
 * Nettoie les données de test
 * @param {import('@playwright/test').Page} page 
 */
async function cleanupTestData(page) {
  // Vider les champs
  await page.locator('#taskName').fill('');
  await page.locator('#promptText').fill('');
  
  // Retourner au mode par défaut
  await page.locator('[data-unit="hours"]').click();
  
  // Reset les valeurs par défaut
  await page.locator('#hourMinutes').fill('0');
}

/**
 * Simule différentes tailles d'écran
 * @param {import('@playwright/test').Page} page 
 * @param {string} device 
 */
async function setViewportForDevice(page, device) {
  const viewports = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1366, height: 768 },
    large: { width: 1920, height: 1080 }
  };
  
  if (viewports[device]) {
    await page.setViewportSize(viewports[device]);
  }
}

module.exports = {
  waitForElementStable,
  createTestTask,
  validateAllScheduleModes,
  captureAllModes,
  validateHTMLStructure,
  cleanupTestData,
  setViewportForDevice
};
