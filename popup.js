// Variables globales
let currentTasks = [];
let editingTaskId = null; // Pour savoir si on est en mode édition

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    // Initialiser le système de traduction
    await window.i18n.initialize();
    
    setupEventListeners();
    loadTasks();
    updateTaskCount();
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Boutons de langue
    document.querySelectorAll('.language-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            window.i18n.setLanguage(lang);
        });
    });
    
    // Bouton de création de tâche
    const createBtn = document.getElementById('createTaskBtn');
    createBtn.addEventListener('click', handleCreateOrUpdate);
    
    // Bouton d'annulation
    const cancelBtn = document.getElementById('cancelEditBtn');
    cancelBtn.addEventListener('click', cancelEdit);
    
    // Bouton de rafraîchissement
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.addEventListener('click', loadTasks);
    
    // Raccourci clavier pour créer une tâche
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleCreateOrUpdate();
        }
    });
    
    // Écouter les changements de langue
    document.addEventListener('languageChanged', () => {
        updateTaskCount();
        loadTasks(); // Recharger les tâches pour mettre à jour les textes
    });
}

// Gérer la création ou mise à jour d'une tâche
function handleCreateOrUpdate() {
    if (editingTaskId) {
        updateTask();
    } else {
        createTask();
    }
}

// Créer une nouvelle tâche
function createTask() {
    const taskName = document.getElementById('taskName').value.trim();
    const promptText = document.getElementById('promptText').value.trim();
    const intervalValue = parseInt(document.getElementById('intervalValue').value);
    const timeUnit = document.getElementById('timeUnit').value;
    
    // Validation
    if (!taskName) {
        showNotification(window.i18n.t('pleaseEnterName'), 'error');
        return;
    }
    
    if (!promptText) {
        showNotification(window.i18n.t('pleaseEnterPrompt'), 'error');
        return;
    }
    
    if (!intervalValue || intervalValue < 1) {
        showNotification(window.i18n.t('pleaseEnterInterval'), 'error');
        return;
    }
    
    // Calcul de l'intervalle en minutes
    let intervalInMinutes;
    let description;
    
    switch(timeUnit) {
        case 'minutes':
            intervalInMinutes = intervalValue;
            description = window.i18n.getFrequencyDescription(intervalValue, 'minutes');
            break;
        case 'hours':
            intervalInMinutes = intervalValue * 60;
            description = window.i18n.getFrequencyDescription(intervalValue, 'hours');
            break;
        case 'days':
            intervalInMinutes = intervalValue * 24 * 60;
            description = window.i18n.getFrequencyDescription(intervalValue, 'days');
            break;
        case 'weeks':
            intervalInMinutes = intervalValue * 7 * 24 * 60;
            description = window.i18n.getFrequencyDescription(intervalValue, 'weeks');
            break;
    }
    
    // Création de la tâche
    const task = {
        id: Date.now().toString(),
        name: taskName,
        prompt: promptText,
        intervalInMinutes: intervalInMinutes,
        description: description,
        createdAt: new Date().toISOString(),
        lastRun: null,
        isActive: true
    };
    
    // Sauvegarde dans le storage
    chrome.storage.local.get(['cronTasks'], (result) => {
        const tasks = result.cronTasks || [];
        tasks.push(task);
        
        chrome.storage.local.set({ cronTasks: tasks }, () => {
            // Créer l'alarme Chrome
            chrome.alarms.create(task.id, {
                delayInMinutes: intervalInMinutes,
                periodInMinutes: intervalInMinutes
            });
            
            showNotification(window.i18n.t('taskCreated'), 'success');
            
            // Réinitialiser le formulaire
            resetForm();
            
            // Recharger la liste
            loadTasks();
            updateTaskCount();
        });
    });
}

// Réinitialiser le formulaire
function resetForm() {
    document.getElementById('taskName').value = '';
    document.getElementById('promptText').value = '';
    document.getElementById('intervalValue').value = '30';
    document.getElementById('timeUnit').value = 'minutes';
    
    // Remettre en mode création
    editingTaskId = null;
    document.getElementById('sectionTitle').setAttribute('data-i18n', 'newTask');
    document.getElementById('sectionTitle').textContent = window.i18n.t('newTask');
    document.getElementById('createTaskBtn').setAttribute('data-i18n', 'createTask');
    document.getElementById('createTaskBtn').textContent = window.i18n.t('createTask');
    document.getElementById('cancelEditBtn').style.display = 'none';
}

// Passer en mode édition
function editTask(taskId) {
    const task = currentTasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Populer le formulaire
    document.getElementById('taskName').value = task.name;
    document.getElementById('promptText').value = task.prompt;
    
    // Calculer les valeurs d'intervalle à partir des minutes
    let intervalValue, timeUnit;
    const minutes = task.intervalInMinutes;
    
    if (minutes % (7 * 24 * 60) === 0) {
        intervalValue = minutes / (7 * 24 * 60);
        timeUnit = 'weeks';
    } else if (minutes % (24 * 60) === 0) {
        intervalValue = minutes / (24 * 60);
        timeUnit = 'days';
    } else if (minutes % 60 === 0) {
        intervalValue = minutes / 60;
        timeUnit = 'hours';
    } else {
        intervalValue = minutes;
        timeUnit = 'minutes';
    }
    
    document.getElementById('intervalValue').value = intervalValue;
    document.getElementById('timeUnit').value = timeUnit;
    
    // Passer en mode édition
    editingTaskId = taskId;
    document.getElementById('sectionTitle').setAttribute('data-i18n', 'editTask');
    document.getElementById('sectionTitle').textContent = window.i18n.t('editTask');
    document.getElementById('createTaskBtn').setAttribute('data-i18n', 'updateTask');
    document.getElementById('createTaskBtn').textContent = window.i18n.t('updateTask');
    document.getElementById('cancelEditBtn').style.display = 'inline-block';
    
    // Faire défiler vers le haut
    document.querySelector('.create-section').scrollIntoView({ behavior: 'smooth' });
}

// Mettre à jour une tâche existante
function updateTask() {
    const taskName = document.getElementById('taskName').value.trim();
    const promptText = document.getElementById('promptText').value.trim();
    const intervalValue = parseInt(document.getElementById('intervalValue').value);
    const timeUnit = document.getElementById('timeUnit').value;
    
    // Validation
    if (!taskName) {
        showNotification(window.i18n.t('pleaseEnterName'), 'error');
        return;
    }
    
    if (!promptText) {
        showNotification(window.i18n.t('pleaseEnterPrompt'), 'error');
        return;
    }
    
    if (!intervalValue || intervalValue < 1) {
        showNotification(window.i18n.t('pleaseEnterInterval'), 'error');
        return;
    }
    
    // Calcul de l'intervalle en minutes
    let intervalInMinutes;
    let description;
    
    switch(timeUnit) {
        case 'minutes':
            intervalInMinutes = intervalValue;
            description = window.i18n.getFrequencyDescription(intervalValue, 'minutes');
            break;
        case 'hours':
            intervalInMinutes = intervalValue * 60;
            description = window.i18n.getFrequencyDescription(intervalValue, 'hours');
            break;
        case 'days':
            intervalInMinutes = intervalValue * 24 * 60;
            description = window.i18n.getFrequencyDescription(intervalValue, 'days');
            break;
        case 'weeks':
            intervalInMinutes = intervalValue * 7 * 24 * 60;
            description = window.i18n.getFrequencyDescription(intervalValue, 'weeks');
            break;
    }
    
    chrome.storage.local.get(['cronTasks'], (result) => {
        const tasks = result.cronTasks || [];
        const taskIndex = tasks.findIndex(task => task.id === editingTaskId);
        
        if (taskIndex === -1) return;
        
        // Mettre à jour la tâche
        tasks[taskIndex] = {
            ...tasks[taskIndex],
            name: taskName,
            prompt: promptText,
            intervalInMinutes: intervalInMinutes,
            description: description
        };
        
        chrome.storage.local.set({ cronTasks: tasks }, () => {
            // Mettre à jour l'alarme si la tâche est active
            if (tasks[taskIndex].isActive) {
                chrome.alarms.clear(editingTaskId);
                chrome.alarms.create(editingTaskId, {
                    delayInMinutes: intervalInMinutes,
                    periodInMinutes: intervalInMinutes
                });
            }
            
            showNotification(window.i18n.t('taskUpdated'), 'success');
            
            // Réinitialiser le formulaire
            resetForm();
            
            // Recharger la liste
            loadTasks();
            updateTaskCount();
        });
    });
}

// Annuler l'édition
function cancelEdit() {
    resetForm();
}

// Charger et afficher les tâches
function loadTasks() {
    chrome.storage.local.get(['cronTasks'], (result) => {
        currentTasks = result.cronTasks || [];
        displayTasks();
    });
}

// Afficher les tâches dans l'interface
function displayTasks() {
    const tasksList = document.getElementById('tasksList');
    const emptyState = document.getElementById('emptyState');
    
    if (currentTasks.length === 0) {
        tasksList.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    tasksList.innerHTML = currentTasks.map(task => `
        <div class="task-item" data-task-id="${task.id}">
            <div class="task-header">
                <h3 class="task-name">${escapeHtml(task.name)}</h3>
                <div class="task-actions">
                    <button type="button" class="edit-btn" data-task-id="${task.id}" title="${window.i18n.t('editTooltip')}">✏️</button>
                    <button type="button" class="toggle-btn" data-task-id="${task.id}" title="${task.isActive ? window.i18n.t('pauseTooltip') : window.i18n.t('activateTooltip')}">
                        ${task.isActive ? '⏸️' : '▶️'}
                    </button>
                    <button type="button" class="delete-btn" data-task-id="${task.id}" title="${window.i18n.t('deleteTooltip')}">🗑️</button>
                </div>
            </div>
            <div class="task-meta">
                <span class="task-status ${task.isActive ? 'active' : 'paused'}">
                    ${task.isActive ? window.i18n.t('active') : window.i18n.t('paused')}
                </span> • 
                ${task.description} • 
                ${window.i18n.t('createdOn')} ${new Date(task.createdAt).toLocaleDateString()}
            </div>
            <div class="task-prompt">${escapeHtml(task.prompt)}</div>
        </div>
    `).join('');
    
    // Ajouter les gestionnaires d'événements aux boutons
    attachTaskEventListeners();
}

// Attacher les gestionnaires d'événements aux boutons des tâches
function attachTaskEventListeners() {
    // Boutons edit
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = e.target.getAttribute('data-task-id');
            editTask(taskId);
        });
    });
    
    // Boutons toggle (pause/play)
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = e.target.getAttribute('data-task-id');
            toggleTask(taskId);
        });
    });
    
    // Boutons delete
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = e.target.getAttribute('data-task-id');
            deleteTask(taskId);
        });
    });
}

// Basculer l'état actif/pause d'une tâche
function toggleTask(taskId) {
    chrome.storage.local.get(['cronTasks'], (result) => {
        const tasks = result.cronTasks || [];
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex === -1) return;
        
        tasks[taskIndex].isActive = !tasks[taskIndex].isActive;
        
        chrome.storage.local.set({ cronTasks: tasks }, () => {
            if (tasks[taskIndex].isActive) {
                // Réactiver l'alarme
                chrome.alarms.create(taskId, {
                    delayInMinutes: tasks[taskIndex].intervalInMinutes,
                    periodInMinutes: tasks[taskIndex].intervalInMinutes
                });
                showNotification(window.i18n.t('taskActivated'), 'success');
            } else {
                // Désactiver l'alarme
                chrome.alarms.clear(taskId);
                showNotification(window.i18n.t('taskPaused'), 'success');
            }
            
            loadTasks();
            updateTaskCount();
        });
    });
}

// Supprimer une tâche
function deleteTask(taskId) {
    if (!confirm(window.i18n.t('confirmDelete'))) {
        return;
    }
    
    chrome.storage.local.get(['cronTasks'], (result) => {
        const tasks = result.cronTasks || [];
        const updatedTasks = tasks.filter(task => task.id !== taskId);
        
        chrome.storage.local.set({ cronTasks: updatedTasks }, () => {
            // Supprimer l'alarme
            chrome.alarms.clear(taskId);
            
            showNotification(window.i18n.t('taskDeleted'), 'success');
            loadTasks();
            updateTaskCount();
        });
    });
}

// Mettre à jour le compteur de tâches
function updateTaskCount() {
    chrome.storage.local.get(['cronTasks'], (result) => {
        const tasks = result.cronTasks || [];
        const activeTasks = tasks.filter(task => task.isActive).length;
        const countElement = document.getElementById('activeTasksCount');
        
        if (activeTasks === 0) {
            countElement.textContent = window.i18n.t('noActiveTasks');
        } else {
            countElement.textContent = window.i18n.t('activeTasksCount', { count: activeTasks });
        }
    });
}

// Afficher une notification
function showNotification(message, type = 'info') {
    const notifications = document.getElementById('notifications');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notifications.appendChild(notification);
    
    // Supprimer automatiquement après 3 secondes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Utilitaire pour échapper le HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}