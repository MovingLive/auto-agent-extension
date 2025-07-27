// Variables globales
let currentTasks = [];

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadTasks();
    updateTaskCount();
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Bouton de création de tâche
    const createBtn = document.getElementById('createTaskBtn');
    createBtn.addEventListener('click', createTask);
    
    // Bouton de rafraîchissement
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.addEventListener('click', loadTasks);
    
    // Raccourci clavier pour créer une tâche
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            createTask();
        }
    });
}

// Créer une nouvelle tâche
function createTask() {
    const taskName = document.getElementById('taskName').value.trim();
    const promptText = document.getElementById('promptText').value.trim();
    const intervalValue = parseInt(document.getElementById('intervalValue').value);
    const timeUnit = document.getElementById('timeUnit').value;
    
    // Validation
    if (!taskName) {
        showNotification('Veuillez saisir un nom pour la tâche', 'error');
        return;
    }
    
    if (!promptText) {
        showNotification('Veuillez saisir un prompt', 'error');
        return;
    }
    
    if (!intervalValue || intervalValue < 1) {
        showNotification('Veuillez saisir un intervalle valide', 'error');
        return;
    }
    
    // Calcul de l'intervalle en minutes
    let intervalInMinutes;
    let description;
    
    switch(timeUnit) {
        case 'minutes':
            intervalInMinutes = intervalValue;
            description = `Toutes les ${intervalValue} minute${intervalValue > 1 ? 's' : ''}`;
            break;
        case 'hours':
            intervalInMinutes = intervalValue * 60;
            description = `Toutes les ${intervalValue} heure${intervalValue > 1 ? 's' : ''}`;
            break;
        case 'days':
            intervalInMinutes = intervalValue * 24 * 60;
            description = `Tous les ${intervalValue} jour${intervalValue > 1 ? 's' : ''}`;
            break;
        case 'weeks':
            intervalInMinutes = intervalValue * 7 * 24 * 60;
            description = `Toutes les ${intervalValue} semaine${intervalValue > 1 ? 's' : ''}`;
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
            
            showNotification('Tâche créée avec succès!', 'success');
            
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
                    <button class="toggle-btn" data-task-id="${task.id}" title="${task.isActive ? 'Mettre en pause' : 'Activer'}">
                        ${task.isActive ? '⏸️' : '▶️'}
                    </button>
                    <button class="delete-btn" data-task-id="${task.id}" title="Supprimer">🗑️</button>
                </div>
            </div>
            <div class="task-meta">
                <span class="task-status ${task.isActive ? 'active' : 'paused'}">
                    ${task.isActive ? 'Actif' : 'Pause'}
                </span> • 
                ${task.description} • 
                Créé le ${new Date(task.createdAt).toLocaleDateString()}
            </div>
            <div class="task-prompt">${escapeHtml(task.prompt)}</div>
        </div>
    `).join('');
    
    // Ajouter les gestionnaires d'événements aux boutons
    attachTaskEventListeners();
}

// Attacher les gestionnaires d'événements aux boutons des tâches
function attachTaskEventListeners() {
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
                showNotification('Tâche activée', 'success');
            } else {
                // Désactiver l'alarme
                chrome.alarms.clear(taskId);
                showNotification('Tâche mise en pause', 'success');
            }
            
            loadTasks();
            updateTaskCount();
        });
    });
}

// Supprimer une tâche
function deleteTask(taskId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
        return;
    }
    
    chrome.storage.local.get(['cronTasks'], (result) => {
        const tasks = result.cronTasks || [];
        const updatedTasks = tasks.filter(task => task.id !== taskId);
        
        chrome.storage.local.set({ cronTasks: updatedTasks }, () => {
            // Supprimer l'alarme
            chrome.alarms.clear(taskId);
            
            showNotification('Tâche supprimée', 'success');
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
            countElement.textContent = 'Aucune tâche active';
        } else {
            countElement.textContent = `${activeTasks} tâche${activeTasks > 1 ? 's' : ''} active${activeTasks > 1 ? 's' : ''}`;
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