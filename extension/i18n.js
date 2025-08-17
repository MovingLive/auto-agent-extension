// Système de traductions pour AutoAgent
class I18n {
  constructor() {
    this.currentLanguage = "fr";
    this.loadLanguageFromStorage();
  }

  // Dictionnaire de traductions
  translations = {
    fr: {
      // Descriptions dynamiques de planification
      everyHourAtMinutes: "Toutes les heures à {minutes} minutes",
      everyDayAtTime: "Tous les jours à {hours}:{minutes}",
      everyWeekdayAtTime: "Chaque {day} à {hours}:{minutes}",
      sunday: "dimanche",
      monday: "lundi",
      tuesday: "mardi",
      wednesday: "mercredi",
      thursday: "jeudi",
      friday: "vendredi",
      saturday: "samedi",
      // Header
      appTitle: "🤖 AutoAgent",
      activeTasksCount: "{count} tâches actives",
      noActiveTasks: "Aucune tâche active",

      // Création de tâche
      newTask: "Nouvelle tâche",
      editTask: "✏️ Modifier la tâche",
      taskName: "Nom de la tâche",
      taskNamePlaceholder: "Ex: Vérification quotidienne des actualités",
      frequency: "Fréquence",
      frequencyEvery: "Toutes les",
      prompt: "Prompt",
      promptPlaceholder: "Écrivez votre prompt ici...",

      // Unités de temps
      minutes: "minutes",
      hours: "heures",
      days: "jours",
      weeks: "semaines",
      minute: "minute",
      hour: "heure",
      day: "jour",
      week: "semaine",

      // Jours de la semaine
      monday: "Lundi",
      tuesday: "Mardi",
      wednesday: "Mercredi",
      thursday: "Jeudi",
      friday: "Vendredi",
      saturday: "Samedi",
      sunday: "Dimanche",

      // Planification avancée
      dailyExecutionTime: "Heure d'exécution",
      weeklyExecutionDay: "Jour et heure d'exécution",
      timezoneBrowser: "Heure locale",
      at: "à",

      // Nouvelle planification
      hourlyExecution: "Exécution toutes les heures",
      dailyExecution: "Exécution quotidienne",
      weeklyExecution: "Exécution hebdomadaire",
      minutesOfHour: "minutes de chaque heure",
      minutesShort: "min",
      every: "Chaque",
      hourlyHint:
        "Exemple: à 15 minutes de chaque heure (13:15, 14:15, 15:15...)",
      dailyHint: "Exemple: tous les jours à 09:00",
      weeklyHint: "Exemple: chaque lundi à 09:00",

      // Boutons
      createTask: "✅ Créer la tâche",
      updateTask: "✅ Modifier la tâche",
      cancel: "❌ Annuler",
      edit: "✏️",
      pause: "⏸️",
      play: "▶️",
      delete: "🗑️",
      refresh: "🔄",

      // Liste des tâches
      myTasks: "📋 Mes tâches",
      noTasks: "🤖 Aucune tâche créée",
      noTasksSubtitle: "Créez votre première tâche automatisée ci-dessus !",

      // Statuts
      active: "Actif",
      paused: "En pause",
      createdOn: "Créé le",

      // Notifications
      taskCreated: "Tâche créée avec succès!",
      taskUpdated: "Tâche modifiée avec succès!",
      taskDeleted: "Tâche supprimée avec succès!",
      taskActivated: "Tâche activée!",
      taskPaused: "Tâche mise en pause!",
      pleaseEnterName: "Veuillez saisir un nom pour la tâche",
      pleaseEnterPrompt: "Veuillez saisir un prompt",
      pleaseEnterInterval: "Veuillez saisir un intervalle valide",
      confirmDelete: "Êtes-vous sûr de vouloir supprimer cette tâche ?",

      // Tâches manquées
      missedTasks: "Tâches manquées",
      executeAll: "Tout exécuter",
      dismissAll: "Tout ignorer",
      execute: "Exécuter",
      dismiss: "Ignorer",
      missedTasksFound: "{count} tâche(s) manquée(s) trouvée(s)",
      executeMissedTask: "Exécuter cette tâche manquée",
      dismissMissedTask: "Ignorer cette tâche manquée",
      executeAllConfirm: "Voulez-vous exécuter {count} tâche(s) manquée(s) ?",
      dismissAllConfirm: "Voulez-vous ignorer {count} tâche(s) manquée(s) ?",
      taskExecutedSuccess: "Tâche exécutée avec succès !",
      taskDismissed: "Tâche ignorée",
      allTasksDismissed: "Toutes les tâches manquées ont été ignorées",

      // Indicateurs de tâches
      activeShort: "Actives",
      pausedShort: "En pause",
      activeTasksTooltip: "Tâches actives en cours d'exécution automatique",
      pausedTasksTooltip: "Tâches en pause (non exécutées)",

      // Feedback
      feedbackTooltip: "Donner votre avis ou signaler un problème",

      // Auto-exécution
      autoExecute: "Auto-exécution",
      autoExecuteDescription: "Lance automatiquement les tâches manquées dès l'ouverture du navigateur",
      autoShort: "Auto",

      // Tooltips
      editTooltip: "Modifier",
      pauseTooltip: "Mettre en pause",
      activateTooltip: "Activer",
      deleteTooltip: "Supprimer",
      refreshTooltip: "Actualiser",

      // Descriptions de fréquence
      frequencyDescription: {
        single: {
          minute: "Toutes les {value} minute",
          minutes: "Toutes les {value} minutes",
          hour: "Toutes les {value} heure",
          hours: "Toutes les {value} heures",
          day: "Tous les {value} jour",
          days: "Tous les {value} jours",
          week: "Toutes les {value} semaine",
          weeks: "Toutes les {value} semaines",
        },
        plural: {
          minutes: "Toutes les {value} minutes",
          hours: "Toutes les {value} heures",
          days: "Tous les {value} jours",
          weeks: "Toutes les {value} semaines",
        },
      },

      // Messages de détection automatique
      languageDetection: {
        detected:
          "Langue détectée: français. Vous pouvez la changer avec les drapeaux en haut à droite.",
        icon: "🌍",
      },
    },

    en: {
      // Dynamic schedule descriptions
      everyHourAtMinutes: "Every hour at {minutes} minutes",
      everyDayAtTime: "Every day at {hours}:{minutes}",
      everyWeekdayAtTime: "Every {day} at {hours}:{minutes}",
      sunday: "Sunday",
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      // Header
      appTitle: "🤖 AutoAgent",
      activeTasksCount: "{count} active tasks",
      noActiveTasks: "No active tasks",

      // Création de tâche
      newTask: "New task",
      editTask: "✏️ Edit task",
      taskName: "Task name",
      taskNamePlaceholder: "Ex: Daily news check",
      frequency: "Frequency",
      frequencyEvery: "Every",
      prompt: "Prompt",
      promptPlaceholder: "Write your prompt here...",

      // Unités de temps
      minutes: "minutes",
      hours: "hours",
      days: "days",
      weeks: "weeks",
      minute: "minute",
      hour: "hour",
      day: "day",
      week: "week",

      // Jours de la semaine
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",

      // Planification avancée
      dailyExecutionTime: "Execution time",
      weeklyExecutionDay: "Day and time of execution",
      timezoneBrowser: "Local time",
      at: "at",

      // Nouvelle planification
      hourlyExecution: "Hourly execution",
      dailyExecution: "Daily execution",
      weeklyExecution: "Weekly execution",
      minutesOfHour: "minutes of each hour",
      minutesShort: "min",
      every: "Every",
      hourlyHint:
        "Example: at 15 minutes of each hour (13:15, 14:15, 15:15...)",
      dailyHint: "Example: every day at 09:00",
      weeklyHint: "Example: every Monday at 09:00",

      // Boutons
      createTask: "✅ Create task",
      updateTask: "✅ Update task",
      cancel: "❌ Cancel",
      edit: "✏️",
      pause: "⏸️",
      play: "▶️",
      delete: "🗑️",
      refresh: "🔄",

      // Liste des tâches
      myTasks: "📋 My tasks",
      noTasks: "🤖 No tasks created",
      noTasksSubtitle: "Create your first automated task above!",

      // Statuts
      active: "Active",
      paused: "Paused",
      createdOn: "Created on",

      // Notifications
      taskCreated: "Task created successfully!",
      taskUpdated: "Task updated successfully!",
      taskDeleted: "Task deleted successfully!",
      taskActivated: "Task activated!",
      taskPaused: "Task paused!",
      pleaseEnterName: "Please enter a task name",
      pleaseEnterPrompt: "Please enter a prompt",
      pleaseEnterInterval: "Please enter a valid interval",
      confirmDelete: "Are you sure you want to delete this task?",

      // Missed tasks
      missedTasks: "Missed Tasks",
      executeAll: "Execute All",
      dismissAll: "Dismiss All",
      execute: "Execute",
      dismiss: "Dismiss",
      missedTasksFound: "{count} missed task(s) found",
      executeMissedTask: "Execute this missed task",
      dismissMissedTask: "Dismiss this missed task",
      executeAllConfirm: "Do you want to execute {count} missed task(s)?",
      dismissAllConfirm: "Do you want to dismiss {count} missed task(s)?",
      taskExecutedSuccess: "Task executed successfully!",
      taskDismissed: "Task dismissed",
      allTasksDismissed: "All missed tasks have been dismissed",

      // Task indicators
      activeShort: "Active",
      pausedShort: "Paused",
      activeTasksTooltip: "Active tasks running automatically",
      pausedTasksTooltip: "Paused tasks (not executed)",

      // Feedback
      feedbackTooltip: "Give feedback or report an issue",

      // Auto-execution
      autoExecute: "Auto-execution",
      autoExecuteDescription: "Automatically launch missed tasks when the browser opens",
      autoShort: "Auto",

      // Tooltips
      editTooltip: "Edit",
      pauseTooltip: "Pause",
      activateTooltip: "Activate",
      deleteTooltip: "Delete",
      refreshTooltip: "Refresh",

      // Descriptions de fréquence
      frequencyDescription: {
        single: {
          minute: "Every {value} minute",
          minutes: "Every {value} minutes",
          hour: "Every {value} hour",
          hours: "Every {value} hours",
          day: "Every {value} day",
          days: "Every {value} days",
          week: "Every {value} week",
          weeks: "Every {value} weeks",
        },
        plural: {
          minutes: "Every {value} minutes",
          hours: "Every {value} hours",
          days: "Every {value} days",
          weeks: "Every {value} weeks",
        },
      },

      // Messages de détection automatique
      languageDetection: {
        detected:
          "Language detected: English. You can change it using the flags in the top right.",
        icon: "🌍",
      },
    },
  };

  // Détecter la langue du navigateur
  detectBrowserLanguage() {
    // Obtenir la langue du navigateur
    const browserLang = navigator.language || navigator.userLanguage;

    // Extraire le code de langue (ex: 'fr-FR' -> 'fr', 'en-US' -> 'en')
    const langCode = browserLang.toLowerCase().split("-")[0];

    // Vérifier si nous supportons cette langue
    if (this.translations[langCode]) {
      console.log(
        `Langue du navigateur détectée: ${browserLang} -> ${langCode}`
      );
      return langCode;
    }

    // Fallback: chercher dans les langues acceptées du navigateur
    if (navigator.languages) {
      for (const lang of navigator.languages) {
        const code = lang.toLowerCase().split("-")[0];
        if (this.translations[code]) {
          console.log(`Langue détectée depuis languages: ${lang} -> ${code}`);
          return code;
        }
      }
    }

    // Fallback final: français par défaut
    console.log(
      "Aucune langue supportée détectée, utilisation du français par défaut"
    );
    return "fr";
  }

  // Charger la langue depuis le storage ou détecter automatiquement
  async loadLanguageFromStorage() {
    try {
      // Vérifier si chrome.storage est disponible (contexte d'extension)
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        // Contexte hors extension (tests) - utiliser la détection automatique
        this.currentLanguage = this.detectBrowserLanguage();
        console.log(`Langue du navigateur détectée: ${navigator.language} -> ${this.currentLanguage}`);
        return;
      }

      const result = await chrome.storage.local.get([
        "language",
        "languageAutoDetected",
        "languageManuallySet",
      ]);

      if (result.language && result.languageManuallySet) {
        // L'utilisateur a déjà fait un choix manuel - respecter ce choix
        this.currentLanguage = result.language;
        console.log(`Langue chargée (choix manuel): ${this.currentLanguage}`);
      } else if (result.language && result.languageAutoDetected) {
        // Langue déjà auto-détectée précédemment
        this.currentLanguage = result.language;
        console.log(
          `Langue chargée (auto-détectée précédemment): ${this.currentLanguage}`
        );
      } else {
        // Première utilisation: détecter automatiquement
        const detectedLang = this.detectBrowserLanguage();
        this.currentLanguage = detectedLang;

        // Sauvegarder la langue détectée et marquer comme auto-détectée
        await chrome.storage.local.set({
          language: detectedLang,
          languageAutoDetected: true,
          languageManuallySet: false,
        });

        console.log(
          `Première utilisation: langue auto-détectée et sauvegardée: ${detectedLang}`
        );

        // Afficher une notification discrète pour informer l'utilisateur
        this.showLanguageDetectionNotification(detectedLang);
      }
    } catch (error) {
      console.warn("Erreur lors du chargement de la langue:", error);
      // En cas d'erreur, détecter automatiquement
      this.currentLanguage = this.detectBrowserLanguage();
    }
  }

  // Afficher une notification discrète pour informer de la détection automatique
  showLanguageDetectionNotification(detectedLang) {
    // Cette fonction sera appelée après l'initialisation de l'interface
    // pour informer l'utilisateur de la détection automatique
    setTimeout(() => {
      const message = this.t("languageDetection.detected");
      const icon = this.t("languageDetection.icon");

      // Créer une notification personnalisée
      if (typeof document !== "undefined") {
        this.createDetectionNotification(message, icon);
      }
    }, 2000); // Attendre 2 secondes après l'initialisation
  }

  // Créer une notification pour la détection automatique
  createDetectionNotification(message, icon = "🌍") {
    // Vérifier si une notification similaire existe déjà
    if (document.querySelector(".language-detection-notification")) {
      return;
    }

    const notification = document.createElement("div");
    notification.className = "language-detection-notification";
    notification.style.cssText = `
            position: fixed;
            top: 50px;
            right: 16px;
            background: linear-gradient(135deg, #3b82f6, #1e40af);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-size: 13px;
            max-width: 280px;
            z-index: 1001;
            animation: slideInFromRight 0.3s ease;
            cursor: pointer;
        `;

    notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 8px;">
                <span style="flex-shrink: 0;">${icon}</span>
                <div style="flex: 1; line-height: 1.4;">${message}</div>
                <span style="opacity: 0.7; font-size: 11px; flex-shrink: 0;">✕</span>
            </div>
        `;

    // Ajouter l'animation CSS
    if (!document.querySelector("#language-detection-styles")) {
      const styles = document.createElement("style");
      styles.id = "language-detection-styles";
      styles.textContent = `
                @keyframes slideInFromRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .language-detection-notification:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
                }
            `;
      document.head.appendChild(styles);
    }

    // Ajouter au DOM
    document.body.appendChild(notification);

    // Supprimer au clic ou automatiquement après 8 secondes
    const removeNotification = () => {
      if (notification.parentNode) {
        notification.style.animation = "slideInFromRight 0.3s ease reverse";
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    };

    notification.addEventListener("click", removeNotification);
    setTimeout(removeNotification, 8000);
  }

  // Sauvegarder la langue dans le storage
  async saveLanguageToStorage(isManualChoice = false) {
    try {
      const dataToSave = { language: this.currentLanguage };

      // Si c'est un choix manuel, marquer comme tel
      if (isManualChoice) {
        dataToSave.languageManuallySet = true;
      }

      await chrome.storage.local.set(dataToSave);
    } catch (error) {
      console.warn("Erreur lors de la sauvegarde de la langue:", error);
    }
  }

  // Changer de langue (choix manuel de l'utilisateur)
  async setLanguage(lang) {
    if (this.translations[lang]) {
      const previousLang = this.currentLanguage;
      this.currentLanguage = lang;

      // Marquer comme choix manuel et sauvegarder
      await this.saveLanguageToStorage(true);
      this.updateInterface();

      console.log(`Langue changée manuellement: ${previousLang} -> ${lang}`);

      // Supprimer toute notification de détection en cours
      const notification = document.querySelector(
        ".language-detection-notification"
      );
      if (notification && notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }
  }

  // Obtenir la langue actuelle
  getLanguage() {
    return this.currentLanguage;
  }

  // Obtenir une traduction
  t(key, params = {}) {
    const keys = key.split(".");
    let value = this.translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === "object") {
        value = value[k];
      } else {
        break;
      }
    }

    if (typeof value !== "string") {
      // Fallback vers le français si la clé n'existe pas
      value = this.translations.fr;
      for (const k of keys) {
        if (value && typeof value === "object") {
          value = value[k];
        } else {
          break;
        }
      }
    }

    if (typeof value !== "string") {
      console.warn(`Traduction manquante pour la clé: ${key}`);
      return key;
    }

    // Remplacer les paramètres
    return value.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match;
    });
  }

  // Mettre à jour l'interface avec les nouvelles traductions
  updateInterface() {
    // Éléments avec attribut data-i18n
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");
      const params = element.getAttribute("data-i18n-params");
      const parsedParams = params ? JSON.parse(params) : {};

      if (
        element.tagName === "INPUT" &&
        (element.type === "text" || element.type === "number")
      ) {
        element.placeholder = this.t(key, parsedParams);
      } else if (element.tagName === "TEXTAREA") {
        element.placeholder = this.t(key, parsedParams);
      } else if (element.tagName === "OPTION") {
        element.textContent = this.t(key, parsedParams);
      } else {
        element.textContent = this.t(key, parsedParams);
      }
    });

    // Éléments avec attribut data-i18n-title (tooltips)
    document.querySelectorAll("[data-i18n-title]").forEach((element) => {
      const key = element.getAttribute("data-i18n-title");
      element.title = this.t(key);
    });

    // Mettre à jour les boutons de langue
    this.updateLanguageButtons();

    // Mettre à jour les descriptions des tâches existantes
    this.updateTaskDescriptions();

    // Déclencher un événement personnalisé pour permettre aux autres parties du code de réagir
    document.dispatchEvent(
      new CustomEvent("languageChanged", {
        detail: { language: this.currentLanguage },
      })
    );
  }

  // Mettre à jour l'état des boutons de langue
  updateLanguageButtons() {
    document
      .querySelectorAll(".language-btn, .language-btn-compact")
      .forEach((btn) => {
        const lang = btn.getAttribute("data-lang");
        if (lang === this.currentLanguage) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
  }

  // Mettre à jour les descriptions des tâches existantes
  async updateTaskDescriptions() {
    if (typeof chrome !== "undefined" && chrome.storage) {
      try {
        const result = await chrome.storage.local.get(["cronTasks"]);
        const tasks = result.cronTasks || [];

        if (tasks.length > 0) {
          const updatedTasks = tasks.map((task) => {
            // Recalculer la description avec la nouvelle langue
            const minutes = task.intervalInMinutes;
            let intervalValue, timeUnit;

            if (minutes % (7 * 24 * 60) === 0) {
              intervalValue = minutes / (7 * 24 * 60);
              timeUnit = "weeks";
            } else if (minutes % (24 * 60) === 0) {
              intervalValue = minutes / (24 * 60);
              timeUnit = "days";
            } else if (minutes % 60 === 0) {
              intervalValue = minutes / 60;
              timeUnit = "hours";
            } else {
              intervalValue = minutes;
              timeUnit = "minutes";
            }

            return {
              ...task,
              description: this.getFrequencyDescription(
                intervalValue,
                timeUnit
              ),
            };
          });

          await chrome.storage.local.set({ cronTasks: updatedTasks });
        }
      } catch (error) {
        console.warn("Erreur lors de la mise à jour des descriptions:", error);
      }
    }
  }

  // Générer la description de fréquence
  getFrequencyDescription(value, unit) {
    const isPlural = value > 1;
    const key = isPlural
      ? `frequencyDescription.plural.${unit}`
      : `frequencyDescription.single.${unit}`;
    return this.t(key, { value });
  }

  // Initialiser l'interface avec les traductions
  async initialize() {
    await this.loadLanguageFromStorage();

    // Attendre que le DOM soit prêt
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.updateInterface();
      });
    } else {
      this.updateInterface();
    }
  }

  // Réinitialiser la détection automatique (utile pour les tests)
  async resetLanguageDetection() {
    try {
      await chrome.storage.local.remove([
        "language",
        "languageAutoDetected",
        "languageManuallySet",
      ]);
      console.log("Détection automatique réinitialisée");

      // Recharger avec détection automatique
      await this.loadLanguageFromStorage();
      this.updateInterface();
    } catch (error) {
      console.warn("Erreur lors de la réinitialisation:", error);
    }
  }

  // Obtenir des informations sur l'état de la langue
  async getLanguageInfo() {
    try {
      const result = await chrome.storage.local.get([
        "language",
        "languageAutoDetected",
        "languageManuallySet",
      ]);
      const browserLang = navigator.language || navigator.userLanguage;

      return {
        currentLanguage: this.currentLanguage,
        browserLanguage: browserLang,
        detectedLanguage: this.detectBrowserLanguage(),
        isAutoDetected: result.languageAutoDetected === true,
        isManuallySet: result.languageManuallySet === true,
        supportedLanguages: Object.keys(this.translations),
      };
    } catch (error) {
      console.warn("Erreur lors de la récupération des infos langue:", error);
      return null;
    }
  }
}

// Instance globale
window.i18n = new I18n();
