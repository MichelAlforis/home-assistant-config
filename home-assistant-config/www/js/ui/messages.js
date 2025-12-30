/* ===========================================
   MESSAGES.JS - SYSTÈME DE MESSAGES
   Dashboard Home Assistant
   Compatible iOS 9.3.5 - Syntaxe ES5 uniquement
   =========================================== */

(function(global) {
    'use strict';

    var HAMessages = {
        
        // Container des messages
        container: null,
        
        // File des messages actifs
        activeMessages: [],
        
        // Configuration
        config: {
            defaultDuration: HAConfig ? HAConfig.UI.MESSAGE_DURATION : 3000,
            maxMessages: 5,
            position: 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center
            animations: true
        },

        // Types de messages avec leurs styles
        messageTypes: {
            success: {
                className: 'message-success',
                icon: '✓',
                defaultDuration: 3000
            },
            error: {
                className: 'message-error',
                icon: '✗',
                defaultDuration: 5000
            },
            warning: {
                className: 'message-warning',
                icon: '⚠',
                defaultDuration: 4000
            },
            info: {
                className: 'message-info',
                icon: 'ℹ',
                defaultDuration: 3000
            }
        },

        // Créer le container des messages
        _createContainer: function() {
            if (this.container) {
                return this.container;
            }
            
            var container = document.createElement('div');
            container.id = 'ha-messages-container';
            container.className = 'messages-container messages-' + this.config.position;
            
            document.body.appendChild(container);
            this.container = container;
            
            return container;
        },

        // Afficher un message générique
        show: function(message, type, duration, options) {
            type = type || 'info';
            options = options || {};
            
            var messageConfig = this.messageTypes[type] || this.messageTypes.info;
            var finalDuration = duration || options.duration || messageConfig.defaultDuration;
            
            // Créer l'élément message
            var messageElement = this._createMessageElement(message, type, messageConfig, options);
            
            // Ajouter au container
            var container = this._createContainer();
            container.appendChild(messageElement);
            
            // Gérer la limite de messages
            this._manageMessageLimit();
            
            // Ajouter à la file des messages actifs
            var messageData = {
                element: messageElement,
                type: type,
                timestamp: Date.now(),
                duration: finalDuration
            };
            
            this.activeMessages.push(messageData);
            
            // Programmer la suppression automatique
            if (finalDuration > 0) {
                setTimeout(function() {
                    this.remove(messageElement);
                }.bind(this), finalDuration);
            }
            
            // Animation d'entrée
            if (this.config.animations) {
                setTimeout(function() {
                    messageElement.classList.add('message-show');
                }, 10);
            } else {
                messageElement.classList.add('message-show');
            }
            
            // Événement de clic pour fermer
            if (!options.noClose) {
                messageElement.addEventListener('click', function() {
                    this.remove(messageElement);
                }.bind(this));
            }
            
            return messageElement;
        },

        // Créer l'élément message
        _createMessageElement: function(message, type, messageConfig, options) {
            var element = document.createElement('div');
            element.className = 'ha-message ' + messageConfig.className;
            
            var content = '';
            
            // Icône
            if (!options.noIcon && messageConfig.icon) {
                content += '<span class="message-icon">' + messageConfig.icon + '</span>';
            }
            
            // Contenu du message
            content += '<span class="message-text">' + HAUtils.escapeHtml(message) + '</span>';
            
            // Bouton de fermeture
            if (!options.noClose) {
                content += '<span class="message-close">&times;</span>';
            }
            
            element.innerHTML = content;
            
            // Ajouter les classes personnalisées
            if (options.className) {
                element.className += ' ' + options.className;
            }
            
            return element;
        },

        // Gérer la limite de messages affichés
        _manageMessageLimit: function() {
            while (this.activeMessages.length >= this.config.maxMessages) {
                var oldestMessage = this.activeMessages.shift();
                if (oldestMessage && oldestMessage.element) {
                    this.remove(oldestMessage.element, true);
                }
            }
        },

        // Supprimer un message
        remove: function(messageElement, immediate) {
            if (!messageElement || !messageElement.parentNode) {
                return;
            }
            
            // Supprimer de la file des messages actifs
            for (var i = 0; i < this.activeMessages.length; i++) {
                if (this.activeMessages[i].element === messageElement) {
                    this.activeMessages.splice(i, 1);
                    break;
                }
            }
            
            // Animation de sortie
            if (this.config.animations && !immediate) {
                messageElement.classList.add('message-hide');
                
                setTimeout(function() {
                    if (messageElement.parentNode) {
                        messageElement.parentNode.removeChild(messageElement);
                    }
                }, 300);
            } else {
                messageElement.parentNode.removeChild(messageElement);
            }
        },

        // Messages de succès
        showSuccess: function(message, duration, options) {
            return this.show(message, 'success', duration, options);
        },

        // Messages d'erreur
        showError: function(message, duration, options) {
            return this.show(message, 'error', duration, options);
        },

        // Messages d'avertissement
        showWarning: function(message, duration, options) {
            return this.show(message, 'warning', duration, options);
        },

        // Messages d'information
        showInfo: function(message, duration, options) {
            return this.show(message, 'info', duration, options);
        },

        // Supprimer tous les messages
        clearAll: function() {
            while (this.activeMessages.length > 0) {
                var messageData = this.activeMessages.pop();
                if (messageData.element) {
                    this.remove(messageData.element, true);
                }
            }
        },

        // Configurer le système de messages
        configure: function(options) {
            if (!options) return;
            
            if (options.defaultDuration) {
                this.config.defaultDuration = options.defaultDuration;
            }
            
            if (options.maxMessages) {
                this.config.maxMessages = options.maxMessages;
            }
            
            if (options.position) {
                this.config.position = options.position;
                
                // Mettre à jour la classe du container s'il existe
                if (this.container) {
                    this.container.className = 'messages-container messages-' + this.config.position;
                }
            }
            
            if (options.animations !== undefined) {
                this.config.animations = options.animations;
            }
        },

        // Obtenir les statistiques des messages
        getStats: function() {
            var stats = {
                active: this.activeMessages.length,
                byType: {}
            };
            
            for (var i = 0; i < this.activeMessages.length; i++) {
                var msg = this.activeMessages[i];
                if (stats.byType[msg.type]) {
                    stats.byType[msg.type]++;
                } else {
                    stats.byType[msg.type] = 1;
                }
            }
            
            return stats;
        },

        // Initialiser le système de messages
        init: function() {
            HAUtils.debugLog('Messages system initialized');
            
            // Créer les styles CSS si nécessaire
            this._injectCSS();
            
            // Gérer les erreurs JavaScript globales
            var originalOnError = window.onerror;
            window.onerror = function(message, source, lineno, colno, error) {
                this.showError('Erreur JavaScript: ' + message);
                
                if (originalOnError) {
                    return originalOnError.apply(window, arguments);
                }
            }.bind(this);
            
            // Nettoyer périodiquement les messages expirés
            setInterval(function() {
                this._cleanupExpiredMessages();
            }.bind(this), 1000);
        },

        // Nettoyer les messages expirés
        _cleanupExpiredMessages: function() {
            var now = Date.now();
            var toRemove = [];
            
            for (var i = 0; i < this.activeMessages.length; i++) {
                var msg = this.activeMessages[i];
                if (msg.duration > 0 && (now - msg.timestamp) > msg.duration) {
                    toRemove.push(msg.element);
                }
            }
            
            for (var j = 0; j < toRemove.length; j++) {
                this.remove(toRemove[j]);
            }
        },

        // Injecter les styles CSS de base
        _injectCSS: function() {
            var cssId = 'ha-messages-styles';
            if (document.getElementById(cssId)) {
                return; // Déjà injecté
            }
            
            var css = `
                .messages-container {
                    position: fixed;
                    z-index: 10000;
                    pointer-events: none;
                }
                
                .messages-top-right {
                    top: 20px;
                    right: 20px;
                }
                
                .messages-top-left {
                    top: 20px;
                    left: 20px;
                }
                
                .messages-bottom-right {
                    bottom: 20px;
                    right: 20px;
                }
                
                .messages-bottom-left {
                    bottom: 20px;
                    left: 20px;
                }
                
                .messages-top-center {
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                }
                
                .ha-message {
                    display: flex;
                    align-items: center;
                    margin-bottom: 10px;
                    padding: 12px 16px;
                    border-radius: 6px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    max-width: 400px;
                    word-wrap: break-word;
                    font-size: 14px;
                    pointer-events: auto;
                    cursor: pointer;
                    opacity: 0;
                    transform: translateX(100%);
                    transition: all 0.3s ease;
                }
                
                .ha-message.message-show {
                    opacity: 1;
                    transform: translateX(0);
                }
                
                .ha-message.message-hide {
                    opacity: 0;
                    transform: translateX(100%);
                }
                
                .message-success {
                    background-color: #d4edda;
                    color: #155724;
                    border-left: 4px solid #28a745;
                }
                
                .message-error {
                    background-color: #f8d7da;
                    color: #721c24;
                    border-left: 4px solid #dc3545;
                }
                
                .message-warning {
                    background-color: #fff3cd;
                    color: #856404;
                    border-left: 4px solid #ffc107;
                }
                
                .message-info {
                    background-color: #d1ecf1;
                    color: #0c5460;
                    border-left: 4px solid #17a2b8;
                }
                
                .message-icon {
                    margin-right: 8px;
                    font-weight: bold;
                    flex-shrink: 0;
                }
                
                .message-text {
                    flex: 1;
                }
                
                .message-close {
                    margin-left: 8px;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    opacity: 0.6;
                    flex-shrink: 0;
                }
                
                .message-close:hover {
                    opacity: 1;
                }
            `;
            
            var head = document.head || document.getElementsByTagName('head')[0];
            var style = document.createElement('style');
            style.id = cssId;
            style.type = 'text/css';
            
            if (style.styleSheet) {
                // IE8 et moins
                style.styleSheet.cssText = css;
            } else {
                style.appendChild(document.createTextNode(css));
            }
            
            head.appendChild(style);
        }
    };

    // Auto-initialisation
    HAMessages.init();

    // Export du module
    global.HAMessages = HAMessages;

})(this);