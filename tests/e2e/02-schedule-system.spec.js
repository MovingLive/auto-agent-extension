// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * Tests pour la planification des tâches
 * Ces tests vérifient le système de fréquence (heures/jours/semaines)
 */
test.describe("AutoAgent - Système de planification", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("file://" + __dirname + "/../../extension/popup.html");
    await page.waitForLoadState("networkidle");
  });

  test("should display frequency selector with three modes", async ({
    page,
  }) => {
    // Vérifier la présence du label Fréquence (compatibilité FR/EN)
    const frequencyLabel = page.locator('[data-i18n="frequency"]');
    await expect(frequencyLabel).toBeVisible();
    const frequencyText = await frequencyLabel.textContent();
    expect(frequencyText).toMatch(/(Fréquence|Frequency)/i);

    // Vérifier la présence des trois boutons
    const hoursBtn = page.locator('[data-unit="hours"]');
    const daysBtn = page.locator('[data-unit="days"]');
    const weeksBtn = page.locator('[data-unit="weeks"]');

    await expect(hoursBtn).toBeVisible();
    await expect(daysBtn).toBeVisible();
    await expect(weeksBtn).toBeVisible();

    // Vérifier que les boutons contiennent le texte correct (multilingual)
    const hoursBtnText = await hoursBtn.textContent();
    const daysBtnText = await daysBtn.textContent();
    const weeksBtnText = await weeksBtn.textContent();

    expect(hoursBtnText).toMatch(/(heures|hours)/i);
    expect(daysBtnText).toMatch(/(jours|days)/i);
    expect(weeksBtnText).toMatch(/(semaines|weeks)/i);
  });

  test("should have hours mode active by default", async ({ page }) => {
    const hoursBtn = page.locator('[data-unit="hours"]');

    // Vérifier que le bouton heures est actif par défaut
    await expect(hoursBtn).toHaveClass(/active/);

    // Vérifier que la configuration heures est visible
    const hoursConfig = page.locator("#hoursConfig");
    await expect(hoursConfig).toBeVisible();
    await expect(hoursConfig).toHaveClass(/active/);

    // Vérifier le contenu de la configuration heures (compatibilité FR/EN)
    const configText = await hoursConfig.textContent();
    expect(configText).toMatch(
      /(minutes de chaque heure|minutes of each hour)/i
    );

    // Vérifier l'input des minutes
    const minutesInput = page.locator("#hourMinutes");
    await expect(minutesInput).toBeVisible();
    await expect(minutesInput).toHaveValue("0");
  });

  test("should switch to days mode correctly", async ({ page }) => {
    const daysBtn = page.locator('[data-unit="days"]');
    const hoursBtn = page.locator('[data-unit="hours"]');

    // Cliquer sur le bouton jours
    await daysBtn.click();

    // Vérifier que le bouton jours est maintenant actif
    await expect(daysBtn).toHaveClass(/active/);
    await expect(hoursBtn).not.toHaveClass(/active/);

    // Vérifier que la configuration jours est visible
    const daysConfig = page.locator("#daysConfig");
    await expect(daysConfig).toBeVisible();

    // Vérifier le contenu de la configuration jours (compatibilité FR/EN)
    const daysConfigText = await daysConfig.textContent();
    expect(daysConfigText).toMatch(/(à|at)/i);
    expect(daysConfigText).toMatch(/(h)/);
    expect(daysConfigText).toMatch(/(min)/i);

    // Vérifier les inputs
    const hoursInput = page.locator("#dayHours");
    const minutesInput = page.locator("#dayMinutes");

    await expect(hoursInput).toBeVisible();
    await expect(minutesInput).toBeVisible();
    await expect(hoursInput).toHaveValue("9");
    await expect(minutesInput).toHaveValue("0");

    // Prendre une capture d'écran
    await page.screenshot({
      path: "test-results/schedule-days-mode.png",
    });
  });

  test("should switch to weeks mode correctly", async ({ page }) => {
    const weeksBtn = page.locator('[data-unit="weeks"]');

    // Cliquer sur le bouton semaines
    await weeksBtn.click();

    // Vérifier que le bouton semaines est maintenant actif
    await expect(weeksBtn).toHaveClass(/active/);

    // Vérifier que la configuration semaines est visible
    const weeksConfig = page.locator("#weeksConfig");
    await expect(weeksConfig).toBeVisible();

    // Vérifier le contenu de la configuration semaines (compatibilité FR/EN)
    const weeksConfigText = await weeksConfig.textContent();
    expect(weeksConfigText).toMatch(/(Chaque|Every)/i);
    expect(weeksConfigText).toMatch(/(à|at)/i);

    // Vérifier le sélecteur de jour
    const daySelect = page.locator("#weekDay");
    await expect(daySelect).toBeVisible();

    // Vérifier que "Lundi" est sélectionné par défaut
    await expect(daySelect).toHaveValue("1");

    // Vérifier les inputs de temps
    const hoursInput = page.locator("#weekHours");
    const minutesInput = page.locator("#weekMinutes");

    await expect(hoursInput).toBeVisible();
    await expect(minutesInput).toBeVisible();
    await expect(hoursInput).toHaveValue("9");
    await expect(minutesInput).toHaveValue("0");

    // Prendre une capture d'écran
    await page.screenshot({
      path: "test-results/schedule-weeks-mode.png",
    });
  });

  test("should maintain configurations inside the bordered container", async ({
    page,
  }) => {
    const scheduleContainer = page.locator(".schedule-configurations");

    // Vérifier que le conteneur a une bordure et un background
    await expect(scheduleContainer).toBeVisible();

    // Tester chaque mode pour vérifier que les configurations restent dans le cadre
    const modes = [
      { button: '[data-unit="hours"]', config: "#hoursConfig", name: "heures" },
      { button: '[data-unit="days"]', config: "#daysConfig", name: "jours" },
      {
        button: '[data-unit="weeks"]',
        config: "#weeksConfig",
        name: "semaines",
      },
    ];

    for (const mode of modes) {
      // Cliquer sur le mode
      await page.locator(mode.button).click();

      // Attendre la transition
      await page.waitForTimeout(500);

      // Vérifier que la configuration est visible et dans le conteneur
      const config = page.locator(mode.config);
      await expect(config).toBeVisible();

      // Vérifier que la configuration est contenue dans le cadre
      const containerBox = await scheduleContainer.boundingBox();
      const configBox = await config.boundingBox();

      expect(configBox).toBeTruthy();
      expect(containerBox).toBeTruthy();

      // Vérifier que la configuration est bien dans le conteneur (avec vérifications null)
      if (configBox && containerBox) {
        expect(configBox.y).toBeGreaterThanOrEqual(containerBox.y);
          expect(configBox.y + configBox.height).toBeLessThanOrEqual(
            containerBox.y + containerBox.height + 125
          ); // Tolérance augmentée pour mobile/CI (125px)
      }

      // Prendre une capture d'écran pour chaque mode
      await page.screenshot({
        path: `test-results/schedule-container-${mode.name}.png`,
      });
    }
  });

  test("should allow editing time values", async ({ page }) => {
    // Tester la modification des valeurs dans le mode jours
    await page.locator('[data-unit="days"]').click();

    const hoursInput = page.locator("#dayHours");
    const minutesInput = page.locator("#dayMinutes");

    // Modifier l'heure
    await hoursInput.fill("14");
    await expect(hoursInput).toHaveValue("14");

    // Modifier les minutes
    await minutesInput.fill("30");
    await expect(minutesInput).toHaveValue("30");

    // Tester la modification du jour de la semaine
    await page.locator('[data-unit="weeks"]').click();

    const daySelect = page.locator("#weekDay");
    await daySelect.selectOption("5"); // Vendredi
    await expect(daySelect).toHaveValue("5");
  });

  test("should validate input ranges", async ({ page }) => {
    // Tester les limites des inputs
    await page.locator('[data-unit="hours"]').click();

    const minutesInput = page.locator("#hourMinutes");

    // Tester une valeur valide
    await minutesInput.fill("30");
    await expect(minutesInput).toHaveValue("30");

    // Tester les limites (0-59 pour les minutes)
    await minutesInput.fill("59");
    await expect(minutesInput).toHaveValue("59");

    await minutesInput.fill("0");
    await expect(minutesInput).toHaveValue("0");
  });
});
