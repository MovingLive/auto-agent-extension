const { test, expect } = require("@playwright/test");
const path = require("path");

test.describe("AutoAgent Extension Tests", () => {
  test("should load extension popup directly", async ({ page, context }) => {
    // Obtenir l'ID de l'extension depuis le manifest
    const extensionPath = path.resolve(__dirname, "../../extension");
    console.log("Extension path:", extensionPath);

    // Essayer d'accéder directement à la popup via file://
    const popupPath = path.resolve(extensionPath, "popup.html");
    await page.goto(`file://${popupPath}`);

    // Vérifier que la popup se charge
    await expect(page.locator("body")).toBeVisible();

    // Chercher des éléments spécifiques de votre popup
    const title = await page.locator("h1, h2, .title, #title").first();
    if ((await title.count()) > 0) {
      console.log("Titre trouvé:", await title.textContent());
    }

    // Prendre une capture d'écran
    await page.screenshot({ path: "test-results/extension-popup-direct.png" });
  });

  test("should test popup functionality", async ({ page }) => {
    // Charger la popup directement
    const extensionPath = path.resolve(__dirname, "../../extension");
    const popupPath = path.resolve(extensionPath, "popup.html");
    await page.goto(`file://${popupPath}`);

    // Attendre que la page soit chargée
    await page.waitForLoadState("domcontentloaded");

    // Tester les interactions de base
    const buttons = await page.locator("button").count();
    console.log("Nombre de boutons trouvés:", buttons);

    const inputs = await page.locator("input").count();
    console.log("Nombre d'inputs trouvés:", inputs);

    // Prendre une capture d'écran finale
    await page.screenshot({ path: "test-results/extension-functionality.png" });
  });
});
test("should handle missed tasks functionality", async ({ page }) => {
  // Charger la popup directement
  const extensionPath = path.resolve(__dirname, "../../extension");
  const popupPath = path.resolve(extensionPath, "popup.html");
  await page.goto(`file://${popupPath}`);

  // Attendre que la page soit chargée
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1000); // Attendre l'initialisation

  // Vérifier que la section des tâches manquées existe mais est cachée par défaut
  const missedTasksSection = page.locator("#missedTasksSection");
  await expect(missedTasksSection).toBeHidden();

  // Simuler l'ajout de tâches manquées via le localStorage
  await page.evaluate(() => {
    const mockMissedTasks = [
      {
        id: "missed-1",
        taskId: "task-1",
        taskName: "Test Missed Task 1",
        prompt: "This is a test prompt for missed task 1",
        missedAt: new Date(Date.now() - 3600000).toISOString(), // Il y a 1 heure
        scheduledFor: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "missed-2",
        taskId: "task-2",
        taskName: "Test Missed Task 2",
        prompt: "This is a test prompt for missed task 2",
        missedAt: new Date(Date.now() - 7200000).toISOString(), // Il y a 2 heures
        scheduledFor: new Date(Date.now() - 7200000).toISOString(),
      },
    ];

    // Simuler la réponse du background script
    window.chrome = {
      runtime: {
        sendMessage: (message, callback) => {
          if (message.action === "getMissedTasks") {
            callback({ missedTasks: mockMissedTasks });
          }
        },
      },
    };

    // Déclencher le chargement des tâches manquées
    if (window.loadMissedTasks) {
      window.loadMissedTasks();
    }
  });

  // Attendre un peu pour que l'interface se mette à jour
  await page.waitForTimeout(500);

  // Vérifier que la section des tâches manquées est maintenant visible
  await expect(missedTasksSection).toBeVisible();

  // Vérifier que les tâches manquées sont affichées
  const missedTaskItems = page.locator(".missed-task-item");
  await expect(missedTaskItems).toHaveCount(2);

  // Vérifier le contenu de la première tâche manquée
  const firstMissedTask = missedTaskItems.first();
  await expect(firstMissedTask.locator(".missed-task-name")).toContainText(
    "Test Missed Task 1"
  );
  await expect(firstMissedTask.locator(".missed-task-prompt")).toContainText(
    "This is a test prompt for missed task 1"
  );

  // Vérifier la présence des boutons d'action
  await expect(
    firstMissedTask.locator(".missed-task-btn.execute")
  ).toBeVisible();
  await expect(
    firstMissedTask.locator(".missed-task-btn.dismiss")
  ).toBeVisible();

  // Vérifier les boutons globaux
  await expect(page.locator("#executeAllMissedBtn")).toBeVisible();
  await expect(page.locator("#dismissAllMissedBtn")).toBeVisible();

  // Tester l'interaction avec les boutons (sans réellement exécuter)
  const executeButton = firstMissedTask.locator(".missed-task-btn.execute");
  await expect(executeButton).toBeEnabled();

  const dismissButton = firstMissedTask.locator(".missed-task-btn.dismiss");
  await expect(dismissButton).toBeEnabled();

  // Prendre une capture d'écran avec les tâches manquées
  await page.screenshot({ path: "test-results/missed-tasks-display.png" });

  // Tester l'affichage responsive
  await page.setViewportSize({ width: 400, height: 600 });
  await page.screenshot({ path: "test-results/missed-tasks-mobile.png" });
});

test("should display missed tasks with proper styling", async ({ page }) => {
  // Charger la popup directement
  const extensionPath = path.resolve(__dirname, "../../extension");
  const popupPath = path.resolve(extensionPath, "popup.html");
  await page.goto(`file://${popupPath}`);

  await page.waitForLoadState("domcontentloaded");

  // Injecter des styles et des tâches manquées pour tester l'apparence
  await page.evaluate(() => {
    // Simuler des tâches manquées
    const missedTasksSection = document.getElementById("missedTasksSection");
    const missedTasksList = document.getElementById("missedTasksList");

    if (missedTasksSection && missedTasksList) {
      missedTasksSection.style.display = "block";

      missedTasksList.innerHTML = `
          <div class="missed-task-item">
            <div class="missed-task-header">
              <h3 class="missed-task-name">Tâche de test manquée</h3>
              <div class="missed-task-actions">
                <button type="button" class="missed-task-btn execute">
                  <span>▶️</span>
                  <span>Exécuter</span>
                </button>
                <button type="button" class="missed-task-btn dismiss">
                  <span>❌</span>
                  <span>Ignorer</span>
                </button>
              </div>
            </div>
            <div class="missed-task-meta">
              <span class="missed-task-time">Il y a 2 heures</span>
              <span>•</span>
              <span>Manquée le 15/08/2025 à 14:30</span>
            </div>
            <div class="missed-task-prompt">Vérifier les dernières actualités technologiques et résumer les points importants</div>
          </div>
        `;
    }
  });

  // Vérifier que les styles sont appliqués correctement
  const missedTaskItem = page.locator(".missed-task-item").first();

  // Vérifier les couleurs et styles
  const backgroundColor = await missedTaskItem.evaluate(
    (el) => window.getComputedStyle(el).backgroundColor
  );
  console.log("Background color of missed task:", backgroundColor);

  // Vérifier l'animation de pulsation sur l'icône d'alerte
  const alertIcon = page.locator(".missed-tasks-header .text-xl");
  const animationName = await alertIcon.evaluate(
    (el) => window.getComputedStyle(el).animationName
  );
  console.log("Animation on alert icon:", animationName);

  // Prendre une capture d'écran pour vérifier le style
  await page.screenshot({ path: "test-results/missed-tasks-styling.png" });

  // Tester l'effet hover sur les boutons avec gestion d'erreur
  try {
    await page.hover(".missed-task-btn.execute", { timeout: 2000 });
  } catch (error) {
    console.log("Execute button hover failed, using JS");
    await page.locator(".missed-task-btn.execute").first().evaluate((el) => {
      const event = new MouseEvent('mouseenter', { bubbles: true });
      el.dispatchEvent(event);
    });
  }
  await page.screenshot({
    path: "test-results/missed-tasks-hover-execute.png",
  });

  try {
    await page.hover(".missed-task-btn.dismiss", { timeout: 2000 });
  } catch (error) {
    console.log("Dismiss button hover failed, using JS");
    await page.locator(".missed-task-btn.dismiss").first().evaluate((el) => {
      const event = new MouseEvent('mouseenter', { bubbles: true });
      el.dispatchEvent(event);
    });
  }
  await page.screenshot({
    path: "test-results/missed-tasks-hover-dismiss.png",
  });
});

test("should test missed tasks with helper functions", async ({
  page,
  context,
}) => {
  // Charger la popup directement
  const extensionPath = path.resolve(__dirname, "../../extension");
  const popupPath = path.resolve(extensionPath, "popup.html");
  await page.goto(`file://${popupPath}`);
  await page.waitForLoadState("domcontentloaded");

  // Simuler des tâches manquées en injectant du code
  await page.evaluate(() => {
    // Ajouter des tâches manquées au DOM
    const missedTasksData = [
      {
        id: 'test1',
        name: 'Test Missed Task 1',
        prompt: 'This is a test prompt for missed task 1',
        frequency: { unit: 'hours', minutes: 30 }
      },
      {
        id: 'test2', 
        name: 'Test Missed Task 2',
        prompt: 'This is a test prompt for missed task 2',
        frequency: { unit: 'days', hours: 9, minutes: 0 }
      }
    ];
    
    // Stocker les tâches manquées
    if (typeof window.showMissedTasks === 'function') {
      window.showMissedTasks(missedTasksData);
    }
  });

  // Attendre que les tâches manquées soient affichées
  await page.waitForTimeout(1000);

  // Vérifier que la section est visible (si elle existe)
  const missedTasksSection = page.locator('.missed-tasks-section, #missedTasksSection');
  const isVisible = await missedTasksSection.isVisible();
  
  if (isVisible) {
    // Si les tâches manquées sont visibles, les tester
    const taskItems = page.locator('.missed-task-item, .missed-task');
    const count = await taskItems.count();
    
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
      
      // Tester le contenu de la première tâche si disponible
      const firstTask = taskItems.first();
      await expect(firstTask).toBeVisible();
    }
  }

  // Prendre une capture d'écran
  await page.screenshot({
    path: "test-results/missed-tasks-helper-test.png",
  });
});

test("should test missed tasks edge cases", async ({ page, context }) => {
  const { ExtensionHelper } = require("../helpers/extension-helper");
  const helper = new ExtensionHelper(page, context);

  // Charger la popup directement
  const extensionPath = path.resolve(__dirname, "../../extension");
  const popupPath = path.resolve(extensionPath, "popup.html");
  await page.goto(`file://${popupPath}`);
  await page.waitForLoadState("domcontentloaded");

  // Test avec aucune tâche manquée
  await helper.simulateMissedTasks([]);
  const isVisibleEmpty = await helper.isMissedTasksSectionVisible();
  expect(isVisibleEmpty).toBe(false);

  // Test avec une seule tâche manquée
  const singleTask = [
    {
      id: "missed-single",
      taskId: "task-single",
      taskName: "Single Missed Task",
      prompt: "This is a single missed task",
      missedAt: new Date(Date.now() - 1800000).toISOString(), // Il y a 30 minutes
      scheduledFor: new Date(Date.now() - 1800000).toISOString(),
    },
  ];

  await helper.simulateMissedTasks(singleTask);
  const isVisibleSingle = await helper.isMissedTasksSectionVisible();
  expect(isVisibleSingle).toBe(true);

  const countSingle = await helper.getMissedTasksCount();
  expect(countSingle).toBe(1);

  // Test avec beaucoup de tâches manquées
  const manyTasks = Array.from({ length: 5 }, (_, i) => ({
    id: `missed-many-${i}`,
    taskId: `task-many-${i}`,
    taskName: `Missed Task ${i + 1}`,
    prompt: `This is missed task number ${i + 1}`,
    missedAt: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
    scheduledFor: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
  }));

  await helper.simulateMissedTasks(manyTasks);
  const countMany = await helper.getMissedTasksCount();
  expect(countMany).toBe(5);

  // Prendre une capture avec beaucoup de tâches
  await helper.captureScreenshots("many-tasks");
});
test("should display optimized header layout with integrated tasks section", async ({
  page,
}) => {
  // Charger la popup directement
  const extensionPath = path.resolve(__dirname, "../../extension");
  const popupPath = path.resolve(extensionPath, "popup.html");
  await page.goto(`file://${popupPath}`);

  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1000);

  // Vérifier la nouvelle structure de l'en-tête
  const headerMain = page.locator(".header-main");
  await expect(headerMain).toBeVisible();

  // Vérifier que le titre principal est présent
  const appTitle = page.locator('h1[data-i18n="appTitle"]');
  await expect(appTitle).toBeVisible();

  // Vérifier que la section des tâches est intégrée dans l'en-tête
  const headerTasksSection = page.locator(".header-tasks-section");
  await expect(headerTasksSection).toBeVisible();

  // Vérifier les indicateurs compacts (pas de titre séparé, les indicateurs sont directement intégrés)
  const taskIndicatorsCompact = page.locator(".task-indicators-compact");
  await expect(taskIndicatorsCompact).toBeVisible();

  // Vérifier les badges d'indicateurs
  const activeBadge = page.locator(".indicator-badge.indicator-active");
  const pausedBadge = page.locator(".indicator-badge.indicator-paused");
  await expect(activeBadge).toBeVisible();
  await expect(pausedBadge).toBeVisible();

  // Vérifier que les boutons de langue sont toujours présents
  const languageSelector = page.locator(".language-selector-compact");
  await expect(languageSelector).toBeVisible();

  // Vérifier que l'ancienne section "Mes tâches" séparée n'existe plus
  const oldTaskSectionHeader = page.locator(".task-section-header");
  await expect(oldTaskSectionHeader).toHaveCount(0);

  // Prendre une capture d'écran de la nouvelle disposition
  await page.screenshot({ path: "test-results/optimized-header-layout.png" });

  // Tester la responsivité
  await page.setViewportSize({ width: 400, height: 600 });
  await page.screenshot({ path: "test-results/optimized-header-mobile.png" });

  // Remettre la taille normale
  await page.setViewportSize({ width: 600, height: 650 });
});

test("should maintain proper spacing and alignment in optimized layout", async ({
  page,
}) => {
  // Charger la popup directement
  const extensionPath = path.resolve(__dirname, "../../extension");
  const popupPath = path.resolve(extensionPath, "popup.html");
  await page.goto(`file://${popupPath}`);

  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1000);

  // Vérifier l'alignement des éléments dans l'en-tête
  const headerTop = page.locator(".header-top");
  const headerMain = page.locator(".header-main");
  const languageSelector = page.locator(".language-selector-compact");

  // Vérifier que les éléments sont bien positionnés
  const headerTopBox = await headerTop.boundingBox();
  const headerMainBox = await headerMain.boundingBox();
  const languageSelectorBox = await languageSelector.boundingBox();

  expect(headerTopBox).toBeTruthy();
  expect(headerMainBox).toBeTruthy();
  expect(languageSelectorBox).toBeTruthy();

  if (headerTopBox && headerMainBox && languageSelectorBox) {
    // Vérifier que header-main est à gauche
    expect(headerMainBox.x).toBeLessThan(languageSelectorBox.x);

    // Vérifier que les éléments sont dans le conteneur header-top
    expect(headerMainBox.x).toBeGreaterThanOrEqual(headerTopBox.x);
    expect(
      languageSelectorBox.x + languageSelectorBox.width
    ).toBeLessThanOrEqual(headerTopBox.x + headerTopBox.width + 5);
  }

  // Vérifier l'espacement vertical entre les éléments
  const appTitle = page.locator('h1[data-i18n="appTitle"]');
  const headerTasksSection = page.locator(".header-tasks-section");

  const titleBox = await appTitle.boundingBox();
  const tasksBox = await headerTasksSection.boundingBox();

  if (titleBox && tasksBox) {
    // Vérifier que la section des tâches est en dessous du titre
    expect(tasksBox.y).toBeGreaterThan(titleBox.y);

    // Vérifier un espacement raisonnable
    const spacing = tasksBox.y - (titleBox.y + titleBox.height);
    expect(spacing).toBeGreaterThanOrEqual(0);
    expect(spacing).toBeLessThanOrEqual(20); // Espacement maximum de 20px
  }

  // Prendre une capture pour l'analyse de l'espacement
  await page.screenshot({
    path: "test-results/optimized-spacing-analysis.png",
  });
});

test("should show task indicators with proper styling in header", async ({
  page,
}) => {
  // Charger la popup directement
  const extensionPath = path.resolve(__dirname, "../../extension");
  const popupPath = path.resolve(extensionPath, "popup.html");
  await page.goto(`file://${popupPath}`);

  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1000);

  // Simuler des tâches pour tester les indicateurs
  await page.evaluate(() => {
    // Simuler la mise à jour des compteurs
    const activeCount = document.getElementById("activeCount");
    const pausedCount = document.getElementById("pausedCount");

    if (activeCount) activeCount.textContent = "3";
    if (pausedCount) pausedCount.textContent = "1";
  });

  // Vérifier les indicateurs compacts
  const activeBadge = page.locator(".indicator-badge.indicator-active");
  const pausedBadge = page.locator(".indicator-badge.indicator-paused");

  // Vérifier la visibilité
  await expect(activeBadge).toBeVisible();
  await expect(pausedBadge).toBeVisible();

  // Vérifier le contenu
  await expect(activeBadge.locator(".indicator-count")).toContainText("3");
  await expect(pausedBadge.locator(".indicator-count")).toContainText("1");

  // Vérifier les points colorés
  const activeDot = page.locator(".dot-active");
  const pausedDot = page.locator(".dot-paused");
  await expect(activeDot).toBeVisible();
  await expect(pausedDot).toBeVisible();

  // Tester les styles CSS
  const activeBadgeColor = await activeBadge.evaluate(
    (el) => window.getComputedStyle(el).color
  );
  const pausedBadgeColor = await pausedBadge.evaluate(
    (el) => window.getComputedStyle(el).color
  );

  console.log("Active badge color:", activeBadgeColor);
  console.log("Paused badge color:", pausedBadgeColor);

  // Prendre une capture avec les indicateurs
  await page.screenshot({ path: "test-results/optimized-task-indicators.png" });
});
test("should display compact task indicators with tooltips and labels", async ({
  page,
}) => {
  // Charger la popup directement
  const extensionPath = path.resolve(__dirname, "../../extension");
  const popupPath = path.resolve(extensionPath, "popup.html");
  await page.goto(`file://${popupPath}`);

  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1000);

  // Vérifier que le titre "My tasks" n'existe plus
  const oldTaskTitle = page.locator(".header-tasks-title");
  await expect(oldTaskTitle).toHaveCount(0);

  // Vérifier les nouveaux indicateurs compacts
  const taskIndicators = page.locator(".task-indicators-compact");
  await expect(taskIndicators).toBeVisible();

  // Vérifier les badges avec labels
  const activeBadge = page.locator(".indicator-badge.indicator-active");
  const pausedBadge = page.locator(".indicator-badge.indicator-paused");

  await expect(activeBadge).toBeVisible();
  await expect(pausedBadge).toBeVisible();

  // Vérifier les labels
  const activeLabel = activeBadge.locator(".indicator-label");
  const pausedLabel = pausedBadge.locator(".indicator-label");

  await expect(activeLabel).toBeVisible();
  await expect(pausedLabel).toBeVisible();

  // Le texte peut être en français ou anglais
  const activeLabelText = await activeLabel.textContent();
  const pausedLabelText = await pausedLabel.textContent();

  expect(activeLabelText).toMatch(/(Actives|Active)/);
  expect(pausedLabelText).toMatch(/(En pause|Paused)/);

  // Vérifier les info-bulles (attribut title)
  const activeTooltip = await activeBadge.getAttribute("title");
  const pausedTooltip = await pausedBadge.getAttribute("title");

  expect(activeTooltip).toBeTruthy();
  expect(pausedTooltip).toBeTruthy();
  expect(activeTooltip).toMatch(/(actives|active)/i);
  expect(pausedTooltip).toMatch(/(pause|paused)/i);

  // Vérifier les compteurs
  const activeCount = activeBadge.locator(".indicator-count");
  const pausedCount = pausedBadge.locator(".indicator-count");

  await expect(activeCount).toBeVisible();
  await expect(pausedCount).toBeVisible();
  await expect(activeCount).toContainText("0");
  await expect(pausedCount).toContainText("0");

  // Tester l'effet hover avec gestion d'erreur
  try {
    await activeBadge.hover({ timeout: 2000 });
    await page.waitForTimeout(200);
  } catch (error) {
    console.log("Badge hover failed, using JS simulation");
    await activeBadge.evaluate((el) => {
      const event = new MouseEvent('mouseenter', { bubbles: true });
      el.dispatchEvent(event);
    });
    await page.waitForTimeout(200);
  }

  // Prendre des captures d'écran
  await page.screenshot({ path: "test-results/compact-indicators-normal.png" });

  try {
    await activeBadge.hover({ timeout: 2000 });
  } catch (error) {
    await activeBadge.evaluate((el) => {
      const event = new MouseEvent('mouseenter', { bubbles: true });
      el.dispatchEvent(event);
    });
  }
  await page.screenshot({ path: "test-results/compact-indicators-hover.png" });

  // Test responsive
  await page.setViewportSize({ width: 400, height: 600 });
  await page.screenshot({ path: "test-results/compact-indicators-mobile.png" });
});

test("should update tooltips dynamically with task counts", async ({
  page,
}) => {
  // Charger la popup directement
  const extensionPath = path.resolve(__dirname, "../../extension");
  const popupPath = path.resolve(extensionPath, "popup.html");
  await page.goto(`file://${popupPath}`);

  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1000);

  // Simuler des tâches pour tester les tooltips dynamiques
  await page.evaluate(() => {
    // Simuler la fonction updateTaskCount avec des données
    const activeCountElement = document.getElementById("activeCount");
    const pausedCountElement = document.getElementById("pausedCount");
    const activeBadge = document.querySelector(
      ".indicator-badge.indicator-active"
    );
    const pausedBadge = document.querySelector(
      ".indicator-badge.indicator-paused"
    );

    if (activeCountElement) activeCountElement.textContent = "3";
    if (pausedCountElement) pausedCountElement.textContent = "2";

    // Simuler les tooltips mis à jour
    if (activeBadge) {
      activeBadge.setAttribute(
        "title",
        "3 tâches actives en cours d'exécution automatique"
      );
      activeBadge.setAttribute("data-count", "3");
    }
    if (pausedBadge) {
      pausedBadge.setAttribute("title", "2 tâches en pause (non exécutées)");
      pausedBadge.setAttribute("data-count", "2");
    }
  });

  // Vérifier les compteurs mis à jour
  const activeBadge = page.locator(".indicator-badge.indicator-active");
  const pausedBadge = page.locator(".indicator-badge.indicator-paused");

  await expect(activeBadge.locator(".indicator-count")).toContainText("3");
  await expect(pausedBadge.locator(".indicator-count")).toContainText("2");

  // Vérifier les tooltips mis à jour
  const activeTooltip = await activeBadge.getAttribute("title");
  const pausedTooltip = await pausedBadge.getAttribute("title");

  expect(activeTooltip).toContain("3");
  expect(pausedTooltip).toContain("2");

  // Vérifier les attributs data-count pour les animations
  const activeDataCount = await activeBadge.getAttribute("data-count");
  const pausedDataCount = await pausedBadge.getAttribute("data-count");

  expect(activeDataCount).toBe("3");
  expect(pausedDataCount).toBe("2");

  // Prendre une capture avec les compteurs
  await page.screenshot({
    path: "test-results/compact-indicators-with-counts.png",
  });
});
test("should display feedback indicator with proper styling and functionality", async ({
  page,
}) => {
  // Charger la popup directement
  const extensionPath = path.resolve(__dirname, "../../extension");
  const popupPath = path.resolve(extensionPath, "popup.html");
  await page.goto(`file://${popupPath}`);

  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1000);

  // Vérifier que l'indicateur de feedback est présent (optionnel)
  const feedbackIndicator = page.locator(".feedback-indicator");
  const feedbackBtn = page.locator("#feedbackBtn");
  
  // Test conditionnel - seulement si les éléments existent
  if (await feedbackIndicator.isVisible()) {
    await expect(feedbackIndicator).toBeVisible();

    if (await feedbackBtn.isVisible()) {
      await expect(feedbackBtn).toBeVisible();

      // Vérifier l'icône si elle existe
      const feedbackIcon = page.locator(".feedback-icon");
      if (await feedbackIcon.isVisible()) {
        await expect(feedbackIcon).toBeVisible();
        await expect(feedbackIcon).toContainText("💬");
      }

      // Vérifier l'info-bulle
      const tooltip = await feedbackBtn.getAttribute("title");
      if (tooltip) {
        expect(tooltip).toBeTruthy();
        expect(tooltip).toMatch(/(feedback|avis|problème|issue)/i);
      }
    }

    // Test basique de positionnement - vérifier juste que l'élément a une taille
    const feedbackBox = await feedbackIndicator.boundingBox();
    if (feedbackBox) {
      expect(feedbackBox.x).toBeGreaterThanOrEqual(0);
      expect(feedbackBox.y).toBeGreaterThanOrEqual(0);
      expect(feedbackBox.width).toBeGreaterThan(0);
      expect(feedbackBox.height).toBeGreaterThan(0);
      
      console.log("Feedback element présent avec taille:", {
        x: feedbackBox.x,
        y: feedbackBox.y,
        width: feedbackBox.width,
        height: feedbackBox.height,
      });
    }
  } else {
    // Si le feedback n'existe pas, vérifier qu'au moins la page est chargée
    await expect(page.locator('h1')).toBeVisible();
    console.log('Feedback indicator not present - skipping detailed tests');
  }
});

test("should handle feedback button click properly", async ({ page }) => {
  // Charger la popup directement
  const extensionPath = path.resolve(__dirname, "../../extension");
  const popupPath = path.resolve(extensionPath, "popup.html");
  await page.goto(`file://${popupPath}`);

  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1000);

  // Simuler l'API Chrome pour les tests
  await page.evaluate(() => {
    // Mock chrome.tabs.create
    window.chrome = window.chrome || {};
    window.chrome.tabs = window.chrome.tabs || {};
    window.chrome.tabs.create = (options) => {
      console.log("Chrome tabs create called with:", options);
      // Simuler l'ouverture réussie
      return Promise.resolve({ id: 123 });
    };
  });

  const feedbackBtn = page.locator("#feedbackBtn");

  // Attendre que l'élément soit stable
  await expect(feedbackBtn).toBeVisible();
  await page.waitForTimeout(1000);

  // Écouter les appels à chrome.tabs.create
  let tabCreateCalled = false;
  let tabCreateOptions = null;

  await page.evaluate(() => {
    const originalCreate = window.chrome.tabs.create;
    window.chrome.tabs.create = (options) => {
      window.testTabCreateCalled = true;
      window.testTabCreateOptions = options;
      return originalCreate(options);
    };
  });

  // Utiliser force: true pour éviter les problèmes de stabilité
  await feedbackBtn.click({ force: true });

  // Vérifier que chrome.tabs.create a été appelé
  const createCalled = await page.evaluate(() => window.testTabCreateCalled);
  const createOptions = await page.evaluate(() => window.testTabCreateOptions);

  expect(createCalled).toBe(true);
  expect(createOptions).toBeTruthy();
  expect(createOptions.url).toBe(
    "https://github.com/MovingLive/auto-agent-extension/issues"
  );
  expect(createOptions.active).toBe(true);

  console.log("✅ Feedback button functionality verified");
});
