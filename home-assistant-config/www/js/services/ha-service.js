/* ===========================================
   HA-SERVICE.JS - SERVICE HOME ASSISTANT
   Dashboard Home Assistant
   Compatible iOS 9.3.5 - Syntaxe ES5 uniquement
   =========================================== */

(function(global) {
    'use strict';

    var HAService = {
        
        // Configuration de connexion
        config: {
            baseUrl: '',
            accessToken: '',
            timeout: 10000
        },

        // Cache des entités
        entitiesCache: {},
        
        // État de connexion
        isConnected: false,
        lastUpdateTime: 0,

        // Configurer la connexion
        configure: function(baseUrl, accessToken) {
            this.config.baseUrl = baseUrl.replace(/\/$/, ''); // Supprimer le slash final
            this.config.accessToken = accessToken;
            
            HAUtils.debugLog('HA Service configuré: ' + this.config.baseUrl);
        },

        // Appeler un service Home Assistant
        callService: function(domain, service, serviceData, callback) {
            if (!this._isConfigured()) {
                this._handleError('Service non configuré', callback);
                return;
            }

            var url = this.config.baseUrl + '/api/services/' + domain + '/' + service;
            var data = serviceData || {};
            
            HAUtils.debugLog('Appel service: ' + domain + '.' + service);
            
            this._makeRequest('POST', url, data, function(success, response) {
                if (callback) {
                    callback(success, response);
                }
            });
        },

        // Récupérer l'état d'une entité
        getEntityState: function(entityId, callback) {
            if (!this._isConfigured()) {
                this._handleError('Service non configuré', callback);
                return;
            }

            // Vérifier le cache d'abord
            var cachedEntity = this.entitiesCache[entityId];
            if (cachedEntity && this._isCacheValid()) {
                if (callback) {
                    callback(true, cachedEntity);
                }
                return;
            }

            var url = this.config.baseUrl + '/api/states/' + entityId;
            
            this._makeRequest('GET', url, null, function(success, response) {
                if (success && response) {
                    this.entitiesCache[entityId] = response;
                }
                
                if (callback) {
                    callback(success, response);
                }
            }.bind(this));
        },

        // Récupérer tous les états
        getAllStates: function(callback) {
            if (!this._isConfigured()) {
                this._handleError('Service non configuré', callback);
                return;
            }

            var url = this.config.baseUrl + '/api/states';
            
            this._makeRequest('GET', url, null, function(success, response) {
                if (success && response && response.length) {
                    // Mettre à jour le cache
                    for (var i = 0; i < response.length; i++) {
                        var entity = response[i];
                        this.entitiesCache[entity.entity_id] = entity;
                    }
                    
                    this.lastUpdateTime = Date.now();
                    this.isConnected = true;
                }
                
                if (callback) {
                    callback(success, response);
                }
            }.bind(this));
        },

        // Basculer l'état d'une entité
        toggleEntity: function(entityId, callback) {
            var domain = HAUtils.getDomain(entityId);
            var service;
            
            // Déterminer le service selon le domaine
            switch (domain) {
                case 'light':
                case 'switch':
                    service = 'toggle';
                    break;
                case 'cover':
                    service = 'toggle';
                    break;
                default:
                    this._handleError('Domaine non supporté pour toggle: ' + domain, callback);
                    return;
            }
            
            this.callService(domain, service, { entity_id: entityId }, callback);
        },

        // Allumer une entité
        turnOn: function(entityId, callback) {
            var domain = HAUtils.getDomain(entityId);
            this.callService(domain, 'turn_on', { entity_id: entityId }, callback);
        },

        // Éteindre une entité
        turnOff: function(entityId, callback) {
            var domain = HAUtils.getDomain(entityId);
            this.callService(domain, 'turn_off', { entity_id: entityId }, callback);
        },

        // Récupérer une entité du cache
        getCachedEntity: function(entityId) {
            return this.entitiesCache[entityId] || null;
        },

        // Vider le cache
        clearCache: function() {
            this.entitiesCache = {};
            this.lastUpdateTime = 0;
            HAUtils.debugLog('Cache des entités vidé');
        },

        // Vérifier l'état de la connexion
        checkConnection: function(callback) {
            if (!this._isConfigured()) {
                if (callback) callback(false);
                return;
            }

            var url = this.config.baseUrl + '/api/';
            
            this._makeRequest('GET', url, null, function(success, response) {
                this.isConnected = success;
                if (callback) {
                    callback(success, response);
                }
            }.bind(this));
        },

        // Faire une requête HTTP
        _makeRequest: function(method, url, data, callback) {
            var xhr = new XMLHttpRequest();
            var self = this;
            
            xhr.timeout = this.config.timeout;
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    var success = xhr.status >= 200 && xhr.status < 300;
                    var response = null;
                    
                    if (success && xhr.responseText) {
                        try {
                            response = JSON.parse(xhr.responseText);
                        } catch (e) {
                            HAUtils.debugLog('Erreur parsing JSON: ' + e.message);
                            success = false;
                        }
                    }
                    
                    if (!success) {
                        HAUtils.debugLog('Erreur requête: ' + xhr.status + ' ' + xhr.statusText);
                    }
                    
                    if (callback) {
                        callback(success, response);
                    }
                }
            };
            
            xhr.onerror = function() {
                HAUtils.debugLog('Erreur réseau');
                if (callback) {
                    callback(false, null);
                }
            };
            
            xhr.ontimeout = function() {
                HAUtils.debugLog('Timeout requête');
                if (callback) {
                    callback(false, null);
                }
            };
            
            try {
                xhr.open(method, url, true);
                
                // Headers d'authentification
                if (this.config.accessToken) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + this.config.accessToken);
                }
                
                if (data) {
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    xhr.send(JSON.stringify(data));
                } else {
                    xhr.send();
                }
                
            } catch (e) {
                HAUtils.debugLog('Erreur envoi requête: ' + e.message);
                if (callback) {
                    callback(false, null);
                }
            }
        },

        // Vérifier si le service est configuré
        _isConfigured: function() {
            return !!(this.config.baseUrl && this.config.accessToken);
        },

        // Vérifier si le cache est valide
        _isCacheValid: function() {
            var maxAge = 30000; // 30 secondes
            return (Date.now() - this.lastUpdateTime) < maxAge;
        },

        // Gérer les erreurs
        _handleError: function(message, callback) {
            HAUtils.debugLog('Erreur HA Service: ' + message);
            
            if (global.HAMessages) {
                global.HAMessages.showError(message);
            }
            
            if (callback) {
                callback(false, null);
            }
        },

        // Initialiser le service
        init: function() {
            HAUtils.debugLog('HA Service initialized');
            
            // Vérifier la configuration périodiquement
            setInterval(function() {
                if (this._isConfigured()) {
                    this.checkConnection();
                }
            }.bind(this), 60000); // Toutes les minutes
        }
    };

    // Auto-initialisation
    HAService.init();

    // Export du service
    global.HAService = HAService;

})(this);