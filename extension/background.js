// Service Worker pour gérer les alarmes et l'exécution des tâches

// Écouter les alarmes
chrome.alarms.onAlarm.addListener((alarm) => {
    console.log('Alarme déclenchée:', alarm.name);
    executeTask(alarm.name);
});

// Fonction pour exécuter une tâche
async function executeTask(taskId) {
    try {
        // Récupérer la tâche depuis le storage
        const result = await chrome.storage.local.get(['cronTasks']);
        const tasks = result.cronTasks || [];
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
            console.error('Tâche non trouvée:', taskId);
            return;
        }
        
        console.log('Exécution de la tâche:', task.name);
        
        // Créer un nouvel onglet avec l'URL Perplexity
        // Laisser Perplexity gérer le formatage et l'ID automatiquement
        const encodedPrompt = encodeURIComponent(task.prompt);
        const perplexityUrl = `https://www.perplexity.ai/search?q=${encodedPrompt}`;
        
        const tab = await chrome.tabs.create({
            url: perplexityUrl,
            active: false // L'onglet sera créé en arrière-plan
        });
        
        console.log('Onglet créé avec ID:', tab.id, 'URL:', perplexityUrl);
        
        // Attendre que l'onglet soit chargé
        await waitForTabLoad(tab.id);
        
        // Mettre à jour la date de dernière exécution
        task.lastRun = new Date().toISOString();
        const updatedTasks = tasks.map(t => t.id === taskId ? task : t);
        await chrome.storage.local.set({ cronTasks: updatedTasks });
                
    } catch (error) {
        console.error('Erreur lors de l\'exécution de la tâche:', error);
    }
}

// Fonction pour attendre le chargement d'un onglet
function waitForTabLoad(tabId) {
    return new Promise((resolve) => {
        const checkStatus = () => {
            chrome.tabs.get(tabId, (tab) => {
                if (tab.status === 'complete') {
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
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Extension AutoAgent installée');
        
        // Initialiser le storage si nécessaire
        chrome.storage.local.get(['cronTasks'], (result) => {
            if (!result.cronTasks) {
                chrome.storage.local.set({ cronTasks: [] });
            }
        });
    } else if (details.reason === 'update') {
        console.log('Extension AutoAgent mise à jour');
        
        // Recharger les alarmes existantes
        reloadExistingAlarms();
    }
});

// Fonction pour recharger les alarmes existantes après une mise à jour
async function reloadExistingAlarms() {
    try {
        // Effacer toutes les alarmes existantes
        await chrome.alarms.clearAll();
        
        // Récupérer les tâches existantes
        const result = await chrome.storage.local.get(['cronTasks']);
        const tasks = result.cronTasks || [];
        
        // Recréer les alarmes pour chaque tâche active
        for (const task of tasks) {
            if (task.isActive) {
                await chrome.alarms.create(task.id, {
                    delayInMinutes: task.intervalInMinutes,
                    periodInMinutes: task.intervalInMinutes
                });
                console.log(`Alarme recréée pour la tâche: ${task.name}`);
            }
        }
    } catch (error) {
        console.error('Erreur lors du rechargement des alarmes:', error);
    }
}

// Gérer les messages depuis le popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getActiveTasks') {
        chrome.storage.local.get(['cronTasks'], (result) => {
            const tasks = result.cronTasks || [];
            const activeTasks = tasks.filter(task => task.isActive);
            sendResponse({ tasks: activeTasks });
        });
        return true; // Indique que la réponse sera envoyée de manière asynchrone
    }
    
    if (message.action === 'taskExecuted') {
        console.log('Tâche exécutée avec succès:', message.taskId);
        // Optionnel: faire quelque chose après l'exécution réussie
    }
    
    if (message.action === 'taskError') {
        console.error('Erreur lors de l\'exécution de la tâche:', message.error);
        // Optionnel: gérer les erreurs d'exécution
    }
});

// Fonction utilitaire pour déboguer les alarmes
async function debugAlarms() {
    const alarms = await chrome.alarms.getAll();
    console.log('Alarmes actives:', alarms);
}

// Exposer la fonction de débogage globalement pour les tests
globalThis.debugAlarms = debugAlarms;

console.log('Service Worker AutoAgent initialisé');