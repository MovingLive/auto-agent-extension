// Variables globales
let currentTasks = [];
let editingTaskId = null; // Pour savoir si on est en mode édition

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    // Initialiser le système de traduction
    await window.i18n.initialize();
    
    setupEventListeners();
    setupVisualEffects();
    loadTasks();
    updateTaskCount();
    
    // Initialiser la planification sur "hours"
    selectScheduleUnit('hours');
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Boutons de langue
    document.querySelectorAll('.language-btn, .language-btn-compact').forEach(btn => {
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
    
    // Gestion des boutons d'unité de planification
    const unitButtons = document.querySelectorAll('.unit-btn-compact');
    unitButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const unit = btn.getAttribute('data-unit');
            selectScheduleUnit(unit);
        });
    });
    
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

// Sélectionner une unité de planification
function selectScheduleUnit(unit) {
    // Mettre à jour les boutons
    document.querySelectorAll('.unit-btn-compact').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-unit="${unit}"]`).classList.add('active');
    
    // Afficher la configuration correspondante
    document.querySelectorAll('.schedule-config').forEach(config => {
        config.classList.remove('active');
    });
    
    const configId = unit + 'Config';
    document.getElementById(configId).classList.add('active');
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
    
    // Validation
    if (!taskName) {
        showNotification(window.i18n.t('pleaseEnterName'), 'error');
        return;
    }
    
    if (!promptText) {
        showNotification(window.i18n.t('pleaseEnterPrompt'), 'error');
        return;
    }
    
    // Récupération des données de planification
    const activeUnit = document.querySelector('.unit-btn-compact.active').getAttribute('data-unit');
    let intervalInMinutes;
    let description;
    let schedulingData = { type: activeUnit };
    
    switch(activeUnit) {
        case 'hours':
            const hourMinutes = parseInt(document.getElementById('hourMinutes').value) || 0;
            intervalInMinutes = 60; // Toutes les heures
            schedulingData.minutes = hourMinutes;
            description = `Toutes les heures à ${hourMinutes} minutes`;
            break;
            
        case 'days':
            const dayHours = parseInt(document.getElementById('dayHours').value) || 9;
            const dayMinutes = parseInt(document.getElementById('dayMinutes').value) || 0;
            intervalInMinutes = 24 * 60; // Tous les jours
            schedulingData.hours = dayHours;
            schedulingData.minutes = dayMinutes;
            description = `Tous les jours à ${dayHours.toString().padStart(2, '0')}:${dayMinutes.toString().padStart(2, '0')}`;
            break;
            
        case 'weeks':
            const weekDay = parseInt(document.getElementById('weekDay').value);
            const weekHours = parseInt(document.getElementById('weekHours').value) || 9;
            const weekMinutes = parseInt(document.getElementById('weekMinutes').value) || 0;
            intervalInMinutes = 7 * 24 * 60; // Toutes les semaines
            schedulingData.day = weekDay;
            schedulingData.hours = weekHours;
            schedulingData.minutes = weekMinutes;
            
            const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
            const dayName = dayNames[weekDay];
            description = `Chaque ${dayName} à ${weekHours.toString().padStart(2, '0')}:${weekMinutes.toString().padStart(2, '0')}`;
            break;
    }
    
    // Création de la tâche
    const task = {
        id: Date.now().toString(),
        name: taskName,
        prompt: promptText,
        intervalInMinutes: intervalInMinutes,
        description: description,
        schedulingData: schedulingData,
        createdAt: new Date().toISOString(),
        lastRun: null,
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
    
    // Réinitialiser les valeurs de planification
    document.getElementById('hourMinutes').value = '0';
    document.getElementById('dayHours').value = '9';
    document.getElementById('dayMinutes').value = '0';
    document.getElementById('weekDay').value = '1';
    document.getElementById('weekHours').value = '9';
    document.getElementById('weekMinutes').value = '0';
    
    // Remettre l'unité par défaut sur "hours"
    selectScheduleUnit('hours');
    
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
    
    // Restaurer les données de planification
    if (task.schedulingData && task.schedulingData.type) {
        const unit = task.schedulingData.type;
        selectScheduleUnit(unit);
        
        switch(unit) {
            case 'hours':
                if (task.schedulingData.minutes !== undefined) {
                    document.getElementById('hourMinutes').value = task.schedulingData.minutes;
                }
                break;
            case 'days':
                if (task.schedulingData.hours !== undefined) {
                    document.getElementById('dayHours').value = task.schedulingData.hours;
                }
                if (task.schedulingData.minutes !== undefined) {
                    document.getElementById('dayMinutes').value = task.schedulingData.minutes;
                }
                break;
            case 'weeks':
                if (task.schedulingData.day !== undefined) {
                    document.getElementById('weekDay').value = task.schedulingData.day.toString();
                }
                if (task.schedulingData.hours !== undefined) {
                    document.getElementById('weekHours').value = task.schedulingData.hours;
                }
                if (task.schedulingData.minutes !== undefined) {
                    document.getElementById('weekMinutes').value = task.schedulingData.minutes;
                }
                break;
        }
    } else {
        // Par défaut, mode heures
        selectScheduleUnit('hours');
    }
    
    // Passer en mode édition
    editingTaskId = taskId;
    document.getElementById('sectionTitle').setAttribute('data-i18n', 'editTask');
    document.getElementById('sectionTitle').textContent = window.i18n.t('editTask');
    document.getElementById('createTaskBtn').setAttribute('data-i18n', 'updateTask');
    document.getElementById('createTaskBtn').textContent = window.i18n.t('updateTask');
    document.getElementById('cancelEditBtn').style.display = 'inline-block';
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
    
    // Validation
    if (!taskName) {
        showNotification(window.i18n.t('pleaseEnterName'), 'error');
        return;
    }
    
    if (!promptText) {
        showNotification(window.i18n.t('pleaseEnterPrompt'), 'error');
        return;
    }
    
    // Récupération des données de planification
    const activeUnit = document.querySelector('.unit-btn-compact.active').getAttribute('data-unit');
    let intervalInMinutes;
    let description;
    let schedulingData = { type: activeUnit };
    
    switch(activeUnit) {
        case 'hours':
            const hourMinutes = parseInt(document.getElementById('hourMinutes').value) || 0;
            intervalInMinutes = 60; // Toutes les heures
            schedulingData.minutes = hourMinutes;
            description = `Toutes les heures à ${hourMinutes} minutes`;
            break;
            
        case 'days':
            const dayHours = parseInt(document.getElementById('dayHours').value) || 9;
            const dayMinutes = parseInt(document.getElementById('dayMinutes').value) || 0;
            intervalInMinutes = 24 * 60; // Tous les jours
            schedulingData.hours = dayHours;
            schedulingData.minutes = dayMinutes;
            description = `Tous les jours à ${dayHours.toString().padStart(2, '0')}:${dayMinutes.toString().padStart(2, '0')}`;
            break;
            
        case 'weeks':
            const weekDay = parseInt(document.getElementById('weekDay').value);
            const weekHours = parseInt(document.getElementById('weekHours').value) || 9;
            const weekMinutes = parseInt(document.getElementById('weekMinutes').value) || 0;
            intervalInMinutes = 7 * 24 * 60; // Toutes les semaines
            schedulingData.day = weekDay;
            schedulingData.hours = weekHours;
            schedulingData.minutes = weekMinutes;
            
            const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
            const dayName = dayNames[weekDay];
            description = `Chaque ${dayName} à ${weekHours.toString().padStart(2, '0')}:${weekMinutes.toString().padStart(2, '0')}`;
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
            description: description,
            schedulingData: schedulingData
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
    
    tasksList.innerHTML = currentTasks.map(task => {
        // Affichage de l'heure de planification pour les tâches quotidiennes
        let planningTime = '';
        if (task.intervalInMinutes % (24 * 60) === 0) {
            // Heure de création ou 00:00 si non précisé
            const createdDate = new Date(task.createdAt);
            const hours = String(createdDate.getHours()).padStart(2, '0');
            const minutes = String(createdDate.getMinutes()).padStart(2, '0');
            planningTime = `à ${hours}:${minutes}`;
        }
        return `
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
                ${task.description}
                ${planningTime ? ' • ' + planningTime : ''}
            </div>
            <div class="task-prompt">${escapeHtml(task.prompt)}</div>
        </div>
        `;
    }).join('');
    
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
        const pausedTasks = tasks.filter(task => !task.isActive).length;
        
        // Mettre à jour les indicateurs dans le titre
        const activeCountElement = document.getElementById('activeCount');
        const pausedCountElement = document.getElementById('pausedCount');
        
        if (activeCountElement) {
            activeCountElement.textContent = activeTasks;
        }
        
        if (pausedCountElement) {
            pausedCountElement.textContent = pausedTasks;
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

// Effets visuels dynamiques
function setupVisualEffects() {
    // Effet de brillance sur les boutons
    const buttons = document.querySelectorAll('.btn-primary, .language-btn, .language-btn-compact');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.boxShadow = '0 0 20px rgba(0, 245, 255, 0.5)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.boxShadow = '';
        });
    });

    // Effet de typing sur les placeholders
    const inputs = document.querySelectorAll('input[type="text"], textarea');
    inputs.forEach(input => {
        const originalPlaceholder = input.placeholder;
        input.addEventListener('focus', () => {
            if (originalPlaceholder) {
                input.placeholder = '';
                let i = 0;
                const typingEffect = setInterval(() => {
                    input.placeholder += originalPlaceholder[i];
                    i++;
                    if (i >= originalPlaceholder.length) {
                        clearInterval(typingEffect);
                    }
                }, 50);
            }
        });
        input.addEventListener('blur', () => {
            input.placeholder = originalPlaceholder;
        });
    });
}