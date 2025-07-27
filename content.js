// Content script pour interagir avec la page Comet

console.log('Content script Comet Cron Tasks chargé');

// Écouter les messages du service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'executePrompt') {
        executePromptInComet(message.prompt, message.taskId);
        sendResponse({ success: true });
    }
});

// Fonction principale pour exécuter un prompt dans Comet
async function executePromptInComet(prompt, taskId) {
    try {
        console.log('Exécution du prompt dans Comet:', prompt);
        
        // Attendre que la page soit complètement chargée
        await waitForPageReady();
        
        // Chercher le champ de saisie principal de Comet
        const inputField = await findInputField();
        
        if (!inputField) {
            throw new Error('Champ de saisie non trouvé dans Comet');
        }
        
        // Saisir le prompt
        await typeInField(inputField, prompt);
        
        // Attendre un peu pour que la saisie soit prise en compte
        await sleep(1000);
        
        // Chercher et cliquer sur le bouton d'envoi
        const submitButton = await findSubmitButton();
        
        if (submitButton) {
            submitButton.click();
            console.log('Prompt envoyé avec succès');
            
            // Notifier le service worker du succès
            chrome.runtime.sendMessage({
                action: 'taskExecuted',
                taskId: taskId,
                timestamp: new Date().toISOString()
            });
        } else {
            // Essayer d'envoyer avec Enter si pas de bouton trouvé
            inputField.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            }));
            console.log('Prompt envoyé avec Enter');
        }
        
    } catch (error) {
        console.error('Erreur lors de l\'exécution du prompt:', error);
        
        // Notifier le service worker de l'erreur
        chrome.runtime.sendMessage({
            action: 'taskError',
            taskId: taskId,
            error: error.message
        });
    }
}

// Attendre que la page soit prête
function waitForPageReady() {
    return new Promise((resolve) => {
        if (document.readyState === 'complete') {
            setTimeout(resolve, 2000); // Attendre 2 secondes supplémentaires pour les éléments dynamiques
        } else {
            window.addEventListener('load', () => {
                setTimeout(resolve, 2000);
            });
        }
    });
}

// Trouver le champ de saisie principal
function findInputField() {
    return new Promise((resolve) => {
        const maxAttempts = 20;
        let attempts = 0;
        
        const search = () => {
            attempts++;
            
            // Sélecteurs possibles pour le champ de saisie de Comet
            const selectors = [
                'textarea[placeholder*="Ask"]',
                'textarea[placeholder*="question"]',
                'textarea[placeholder*="search"]',
                'input[type="text"][placeholder*="Ask"]',
                'input[type="text"][placeholder*="question"]',
                'input[type="text"][placeholder*="search"]',
                '[contenteditable="true"]',
                'textarea:not([style*="display: none"])',
                'input[type="text"]:not([style*="display: none"])',
                '.search-input',
                '.query-input',
                '.prompt-input',
                '[data-testid*="search"]',
                '[data-testid*="input"]',
                '[aria-label*="search"]',
                '[aria-label*="Ask"]'
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element && isElementVisible(element)) {
                    console.log('Champ de saisie trouvé avec le sélecteur:', selector);
                    resolve(element);
                    return;
                }
            }
            
            if (attempts < maxAttempts) {
                setTimeout(search, 500);
            } else {
                console.warn('Champ de saisie non trouvé après', maxAttempts, 'tentatives');
                resolve(null);
            }
        };
        
        search();
    });
}

// Trouver le bouton d'envoi
function findSubmitButton() {
    return new Promise((resolve) => {
        const selectors = [
            'button[type="submit"]',
            'button:contains("Send")',
            'button:contains("Ask")',
            'button:contains("Search")',
            '[data-testid*="submit"]',
            '[data-testid*="send"]',
            '.submit-button',
            '.send-button',
            '[aria-label*="send"]',
            '[aria-label*="submit"]'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && isElementVisible(element)) {
                console.log('Bouton d\'envoi trouvé avec le sélecteur:', selector);
                resolve(element);
                return;
            }
        }
        
        // Chercher un bouton avec une icône d'envoi (SVG)
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
            const svg = button.querySelector('svg');
            if (svg && isElementVisible(button)) {
                console.log('Bouton avec SVG trouvé');
                resolve(button);
                return;
            }
        }
        
        resolve(null);
    });
}

// Vérifier si un élément est visible
function isElementVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 &&
           element.offsetHeight > 0;
}

// Saisir du texte dans un champ
async function typeInField(field, text) {
    // Focus sur le champ
    field.focus();
    
    // Effacer le contenu existant
    if (field.tagName.toLowerCase() === 'textarea' || field.type === 'text') {
        field.value = '';
    } else if (field.contentEditable === 'true') {
        field.textContent = '';
    }
    
    // Déclencher les événements de focus
    field.dispatchEvent(new Event('focus', { bubbles: true }));
    
    // Saisir le texte caractère par caractère pour simuler une saisie naturelle
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        // Mettre à jour la valeur
        if (field.tagName.toLowerCase() === 'textarea' || field.type === 'text') {
            field.value += char;
        } else if (field.contentEditable === 'true') {
            field.textContent += char;
        }
        
        // Déclencher les événements de saisie
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Petite pause pour simuler la saisie humaine
        await sleep(50);
    }
    
    // Déclencher les événements finaux
    field.dispatchEvent(new Event('blur', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
}

// Fonction utilitaire pour attendre
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Observer les changements de page pour réinitialiser si nécessaire
const observer = new MutationObserver((mutations) => {
    // Réagir aux changements majeurs de DOM si nécessaire
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // La page a changé, on pourrait vouloir réinitialiser certaines choses
        }
    });
});

// Commencer à observer
observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('Content script Comet Cron Tasks prêt');
