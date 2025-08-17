// Service Worker pour gérer les alarmes et l'exécution des tâches

// Écouter les alarmes
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log("Alarme déclenchée:", alarm.name);
  executeTask(alarm.name);
});

// Fonction pour exécuter une tâche
async function executeTask(taskId) {
  try {
    // Récupérer la tâche depuis le storage
    const result = await chrome.storage.local.get(["cronTasks"]);
    const tasks = result.cronTasks || [];
    const task = tasks.find((t) => t.id === taskId);

    if (!task) {
      console.error("Tâche non trouvée:", taskId);
      return;
    }

    console.log("Exécution de la tâche:", task.name);

    // Vérifier si un onglet Comet est ouvert
    const cometTabs = await chrome.tabs.query({
      url: ["*://www.perplexity.ai/*", "*://perplexity.ai/*"],
    });

    if (cometTabs.length === 0) {
      // Aucun onglet Comet ouvert, ajouter à la liste des tâches manquées
      await addMissedTask(task);
      console.log("Tâche ajoutée aux tâches manquées:", task.name);
      return;
    }

    // Créer un nouvel onglet avec l'URL Perplexity
    // Laisser Perplexity gérer le formatage et l'ID automatiquement
    const encodedPrompt = encodeURIComponent(task.prompt);
    const perplexityUrl = `https://www.perplexity.ai/search?q=${encodedPrompt}`;

    const tab = await chrome.tabs.create({
      url: perplexityUrl,
      active: false, // L'onglet sera créé en arrière-plan
    });

    console.log("Onglet créé avec ID:", tab.id, "URL:", perplexityUrl);

    // Attendre que l'onglet soit chargé
    await waitForTabLoad(tab.id);

    // Mettre à jour la date de dernière exécution
    task.lastRun = new Date().toISOString();
    const updatedTasks = tasks.map((t) => (t.id === taskId ? task : t));
    await chrome.storage.local.set({ cronTasks: updatedTasks });
  } catch (error) {
    console.error("Erreur lors de l'exécution de la tâche:", error);
    // En cas d'erreur, ajouter aussi à la liste des tâches manquées
    const result = await chrome.storage.local.get(["cronTasks"]);
    const tasks = result.cronTasks || [];
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      await addMissedTask(task);
    }
  }
}

// Fonction pour attendre le chargement d'un onglet
function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    const checkStatus = () => {
      chrome.tabs.get(tabId, (tab) => {
        if (tab.status === "complete") {
          resolve();
        } else {
          setTimeout(checkStatus, 500);
        }
      });
    };
    checkStatus();
  });
}

// Gérer l'installation de l'extension
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    console.log("Extension AutoAgent installée");

    // Initialiser le storage si nécessaire
    chrome.storage.local.get(["cronTasks", "missedTasks"], (result) => {
      if (!result.cronTasks) {
        chrome.storage.local.set({ cronTasks: [] });
      }
      if (!result.missedTasks) {
        chrome.storage.local.set({ missedTasks: [] });
      }
    });
  } else if (details.reason === "update") {
    console.log("Extension AutoAgent mise à jour");

    // Recharger les alarmes existantes
    reloadExistingAlarms();

    // Vérifier les tâches manquées après mise à jour
    await checkMissedTasksOnStartup();
  }
});

// Gérer le démarrage du navigateur
chrome.runtime.onStartup.addListener(async () => {
  console.log("Extension AutoAgent démarrée");

  // Vérifier les tâches qui auraient dû s'exécuter pendant que le navigateur était fermé
  await checkMissedTasksOnStartup();
});

// Vérifier les tâches manquées au démarrage
async function checkMissedTasksOnStartup() {
  try {
    console.log("🔍 Vérification des tâches manquées au démarrage...");

    const result = await chrome.storage.local.get(["cronTasks"]);
    const tasks = result.cronTasks || [];
    const now = new Date();
    let missedCount = 0;

    for (const task of tasks) {
      if (!task.isActive) continue;

      const lastRun = task.lastRun
        ? new Date(task.lastRun)
        : new Date(task.createdAt);
      const intervalMs = task.intervalInMinutes * 60 * 1000;
      const nextRun = new Date(lastRun.getTime() + intervalMs);

      // Si la prochaine exécution était prévue dans le passé
      if (nextRun < now) {
        console.log(
          `⚠️ Tâche manquée détectée: ${
            task.name
          } (devait s'exécuter à ${nextRun.toLocaleString()})`
        );
        await addMissedTask(task);
        missedCount++;
      }
    }

    if (missedCount > 0) {
      console.log(
        `📊 ${missedCount} tâche(s) manquée(s) détectée(s) au démarrage`
      );
    }

    // Mettre à jour le badge
    await updateBadge();
  } catch (error) {
    console.error(
      "❌ Erreur lors de la vérification des tâches manquées au démarrage:",
      error
    );
  }
}

// Fonction pour recharger les alarmes existantes après une mise à jour
async function reloadExistingAlarms() {
  try {
    // Effacer toutes les alarmes existantes
    await chrome.alarms.clearAll();

    // Récupérer les tâches existantes
    const result = await chrome.storage.local.get(["cronTasks"]);
    const tasks = result.cronTasks || [];

    // Recréer les alarmes pour chaque tâche active
    for (const task of tasks) {
      if (task.isActive) {
        await chrome.alarms.create(task.id, {
          delayInMinutes: task.intervalInMinutes,
          periodInMinutes: task.intervalInMinutes,
        });
        console.log(`Alarme recréée pour la tâche: ${task.name}`);
      }
    }
  } catch (error) {
    console.error("Erreur lors du rechargement des alarmes:", error);
  }
}

// Ajouter une tâche à la liste des tâches manquées
async function addMissedTask(task) {
  try {
    const result = await chrome.storage.local.get(["missedTasks"]);
    const missedTasks = result.missedTasks || [];

    // Vérifier si la tâche n'est pas déjà dans la liste
    const existingTask = missedTasks.find(
      (mt) =>
        mt.taskId === task.id &&
        new Date(mt.missedAt).toDateString() === new Date().toDateString()
    );

    if (!existingTask) {
      const missedTask = {
        id: Date.now().toString(),
        taskId: task.id,
        taskName: task.name,
        prompt: task.prompt,
        missedAt: new Date().toISOString(),
        scheduledFor: new Date().toISOString(),
      };

      missedTasks.push(missedTask);
      await chrome.storage.local.set({ missedTasks: missedTasks });

      // Créer une notification badge
      await updateBadge();
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout de la tâche manquée:", error);
  }
}

// Mettre à jour le badge de l'extension
async function updateBadge() {
  try {
    const result = await chrome.storage.local.get(["missedTasks"]);
    const missedTasks = result.missedTasks || [];
    const count = missedTasks.length;

    if (count > 0) {
      await chrome.action.setBadgeText({ text: count.toString() });
      await chrome.action.setBadgeBackgroundColor({ color: "#ff6b6b" });
    } else {
      await chrome.action.setBadgeText({ text: "" });
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du badge:", error);
  }
}

// Exécuter une tâche manquée
async function executeMissedTask(missedTaskId) {
  try {
    const result = await chrome.storage.local.get(["missedTasks", "cronTasks"]);
    const missedTasks = result.missedTasks || [];
    const cronTasks = result.cronTasks || [];
    const missedTask = missedTasks.find((mt) => mt.id === missedTaskId);

    if (!missedTask) {
      console.error("Tâche manquée non trouvée:", missedTaskId);
      return;
    }

    // Créer un nouvel onglet avec l'URL Perplexity
    const encodedPrompt = encodeURIComponent(missedTask.prompt);
    const perplexityUrl = `https://www.perplexity.ai/search?q=${encodedPrompt}`;

    const tab = await chrome.tabs.create({
      url: perplexityUrl,
      active: true, // Activer l'onglet pour l'exécution manuelle
    });

    console.log("Tâche manquée exécutée:", missedTask.taskName);

    // Mettre à jour la date de dernière exécution de la tâche originale
    const taskIndex = cronTasks.findIndex((t) => t.id === missedTask.taskId);
    if (taskIndex !== -1) {
      cronTasks[taskIndex].lastRun = new Date().toISOString();
      console.log("Mise à jour de lastRun pour la tâche:", cronTasks[taskIndex].name);
    }

    // Supprimer la tâche de la liste des tâches manquées
    const updatedMissedTasks = missedTasks.filter(
      (mt) => mt.id !== missedTaskId
    );

    // Sauvegarder les deux changements
    await chrome.storage.local.set({ 
      missedTasks: updatedMissedTasks,
      cronTasks: cronTasks
    });

    // Mettre à jour le badge
    await updateBadge();
  } catch (error) {
    console.error("Erreur lors de l'exécution de la tâche manquée:", error);
  }
}

// Gérer les messages depuis le popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getActiveTasks") {
    chrome.storage.local.get(["cronTasks"], (result) => {
      const tasks = result.cronTasks || [];
      const activeTasks = tasks.filter((task) => task.isActive);
      sendResponse({ tasks: activeTasks });
    });
    return true; // Indique que la réponse sera envoyée de manière asynchrone
  }

  if (message.action === "getMissedTasks") {
    chrome.storage.local.get(["missedTasks"], (result) => {
      const missedTasks = result.missedTasks || [];
      sendResponse({ missedTasks: missedTasks });
    });
    return true;
  }

  if (message.action === "executeMissedTask") {
    executeMissedTask(message.missedTaskId);
    sendResponse({ success: true });
    return true;
  }

  if (message.action === "dismissMissedTask") {
    chrome.storage.local.get(["missedTasks"], async (result) => {
      const missedTasks = result.missedTasks || [];
      const updatedMissedTasks = missedTasks.filter(
        (mt) => mt.id !== message.missedTaskId
      );
      await chrome.storage.local.set({ missedTasks: updatedMissedTasks });
      await updateBadge();
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === "dismissAllMissedTasks") {
    chrome.storage.local.set({ missedTasks: [] }, async () => {
      await updateBadge();
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === "taskExecuted") {
    console.log("Tâche exécutée avec succès:", message.taskId);
    // Optionnel: faire quelque chose après l'exécution réussie
  }

  if (message.action === "taskError") {
    console.error("Erreur lors de l'exécution de la tâche:", message.error);
    // Optionnel: gérer les erreurs d'exécution
  }
});

// Fonction utilitaire pour déboguer les alarmes
async function debugAlarms() {
  const alarms = await chrome.alarms.getAll();
  console.log("Alarmes actives:", alarms);
}

// Exposer la fonction de débogage globalement pour les tests
globalThis.debugAlarms = debugAlarms;

console.log("Service Worker AutoAgent initialisé");
// Vérification périodique des tâches manquées (toutes les 5 minutes)
setInterval(async () => {
  try {
    const result = await chrome.storage.local.get(["cronTasks"]);
    const tasks = result.cronTasks || [];
    const now = new Date();

    for (const task of tasks) {
      if (!task.isActive) continue;

      const lastRun = task.lastRun
        ? new Date(task.lastRun)
        : new Date(task.createdAt);
      const intervalMs = task.intervalInMinutes * 60 * 1000;
      const nextRun = new Date(lastRun.getTime() + intervalMs);

      // Si la tâche devrait s'exécuter maintenant (avec une marge de 5 minutes)
      if (nextRun <= now && now - nextRun < 5 * 60 * 1000) {
        console.log(
          `🔄 Vérification périodique: tâche ${task.name} devrait s'exécuter`
        );

        // Vérifier si un onglet Comet est ouvert
        const cometTabs = await chrome.tabs.query({
          url: ["*://www.perplexity.ai/*", "*://perplexity.ai/*"],
        });

        if (cometTabs.length === 0) {
          // Vérifier si elle n'est pas déjà dans les tâches manquées
          const missedResult = await chrome.storage.local.get(["missedTasks"]);
          const missedTasks = missedResult.missedTasks || [];
          const alreadyMissed = missedTasks.find(
            (mt) =>
              mt.taskId === task.id &&
              new Date(mt.missedAt).toDateString() === now.toDateString()
          );

          if (!alreadyMissed) {
            console.log(`⚠️ Ajout de la tâche manquée: ${task.name}`);
            await addMissedTask(task);
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors de la vérification périodique:", error);
  }
}, 5 * 60 * 1000); // Toutes les 5 minutes
