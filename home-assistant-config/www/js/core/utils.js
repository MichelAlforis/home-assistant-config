/* ===========================================
   UTILS.JS - FONCTIONS UTILITAIRES
   Dashboard Home Assistant
   Compatible iOS 9.3.5 - Syntaxe ES5 uniquement
   =========================================== */

(function(global) {
    'use strict';

    var Utils = {
        
        // Debug et logging
        debugLog: function(message) {
            if (global.console && console.log) {
                console.log('[HA-DEBUG] ' + message);
            }
        },

        // Formatage des noms
        formatFriendlyName: function(entityId, friendlyName) {
            if (friendlyName) {
                return friendlyName;
            }
            
            // Extraire et formater depuis l'entity_id
            var parts = entityId.split('.');
            if (parts.length >= 2) {
                return parts[1].replace(/_/g, ' ')
                              .replace(/\b\w/g, function(l) { return l.toUpperCase(); });
            }
            
            return entityId;
        },

        // Formatage des états d'entités
        formatEntityState: function(entity, domain) {
            var state = entity.state;
            var attributes = entity.attributes || {};
            
            switch (domain) {
                case 'climate':
                    if (attributes.current_temperature !== undefined) {
                        return attributes.current_temperature.toFixed(1) + '°C';
                    }
                    return state;
                    
                case 'cover':
                    if (attributes.current_position !== undefined) {
                        return attributes.current_position + '%';
                    }
                    return state;
                    
                case 'light':
                case 'switch':
                    return state === 'on' ? 'Allumé' : 'Éteint';
                    
                case 'sensor':
                    var unit = attributes.unit_of_measurement;
                    return state + (unit ? ' ' + unit : '');
                    
                default:
                    return state;
            }
        },

        // Indicateur de statut
        getStatusIndicator: function(state, domain) {
            var isOnline = (state !== 'unavailable' && state !== 'unknown');
            var statusClass = isOnline ? 'online' : 'offline';
            
            return '<span class="status-indicator ' + statusClass + '"></span>';
        },

        // Vérifier si une entité est contrôlable
        isEntityControllable: function(entityId) {
            var domain = this.getDomain(entityId);
            var controllableDomains = ['light', 'switch', 'climate', 'cover', 'fan', 'media_player'];
            
            return controllableDomains.indexOf(domain) !== -1;
        },

        // Extraire le domaine d'un entity_id
        getDomain: function(entityId) {
            return entityId.split('.')[0];
        },

        // Trier les entités par domaine pour un meilleur affichage
        sortEntitiesByDomain: function(entities) {
            var domainPriority = {
                'climate': 1,
                'light': 2,
                'switch': 3,
                'cover': 4,
                'sensor': 5,
                'binary_sensor': 6,
                'device_tracker': 7
            };
            
            return entities.slice().sort(function(a, b) {
                var domainA = this.getDomain(a.entity_id);
                var domainB = this.getDomain(b.entity_id);
                
                var priorityA = domainPriority[domainA] || 99;
                var priorityB = domainPriority[domainB] || 99;
                
                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }
                
                // Tri par nom si même domaine
                var nameA = this.formatFriendlyName(a.entity_id, a.attributes.friendly_name);
                var nameB = this.formatFriendlyName(b.entity_id, b.attributes.friendly_name);
                
                return nameA.localeCompare(nameB);
            }.bind(this));
        },

        // Générer un ID unique
        generateId: function(prefix) {
            prefix = prefix || 'ha-id';
            return prefix + '-' + Math.random().toString(36).substr(2, 9);
        },

        // Échapper HTML
        escapeHtml: function(text) {
            var div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        // Nettoyer un sélecteur CSS
        sanitizeCssSelector: function(str) {
            return str.replace(/[^a-zA-Z0-9\-_]/g, '-');
        },

        // Throttle function pour limiter les appels
        throttle: function(func, delay) {
            var timeoutId;
            var lastExecTime = 0;
            
            return function() {
                var self = this;
                var args = arguments;
                var currentTime = Date.now();
                
                if (currentTime - lastExecTime > delay) {
                    func.apply(self, args);
                    lastExecTime = currentTime;
                } else {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(function() {
                        func.apply(self, args);
                        lastExecTime = Date.now();
                    }, delay - (currentTime - lastExecTime));
                }
            };
        },

        // Debounce function pour retarder les appels
        debounce: function(func, delay) {
            var timeoutId;
            
            return function() {
                var self = this;
                var args = arguments;
                
                clearTimeout(timeoutId);
                timeoutId = setTimeout(function() {
                    func.apply(self, args);
                }, delay);
            };
        },

        // Deep clone d'un objet (version simple)
        deepClone: function(obj) {
            if (obj === null || typeof obj !== 'object') {
                return obj;
            }
            
            if (obj instanceof Date) {
                return new Date(obj.getTime());
            }
            
            if (obj instanceof Array) {
                return obj.map(function(item) {
                    return this.deepClone(item);
                }.bind(this));
            }
            
            var clonedObj = {};
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            
            return clonedObj;
        },

        // Vérifier si un objet est vide
        isEmpty: function(obj) {
            if (!obj) return true;
            
            if (typeof obj === 'string' || obj instanceof Array) {
                return obj.length === 0;
            }
            
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    return false;
                }
            }
            
            return true;
        },

        // Formater une durée en millisecondes
        formatDuration: function(ms) {
            var seconds = Math.floor(ms / 1000);
            var minutes = Math.floor(seconds / 60);
            var hours = Math.floor(minutes / 60);
            
            if (hours > 0) {
                return hours + 'h ' + (minutes % 60) + 'min';
            } else if (minutes > 0) {
                return minutes + 'min ' + (seconds % 60) + 's';
            } else {
                return seconds + 's';
            }
        },

        // Calculer la différence entre deux timestamps
        timeDiff: function(timestamp1, timestamp2) {
            return Math.abs(new Date(timestamp1) - new Date(timestamp2));
        },

        // Vérifier si une chaîne est un JSON valide
        isValidJson: function(str) {
            try {
                JSON.parse(str);
                return true;
            } catch (e) {
                return false;
            }
        },

        // Convertir un objet en query string
        objectToQueryString: function(obj) {
            var params = [];
            for (var key in obj) {
                if (obj.hasOwnProperty(key) && obj[key] !== null && obj[key] !== undefined) {
                    params.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
                }
            }
            return params.join('&');
        },

        // Parser un query string en objet
        queryStringToObject: function(queryString) {
            var obj = {};
            var pairs = queryString.replace(/^\?/, '').split('&');
            
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i].split('=');
                if (pair.length === 2) {
                    obj[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
                }
            }
            
            return obj;
        },

        // Vérifier le support des fonctionnalités
        hasLocalStorage: function() {
            try {
                var test = '__ha_test__';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (e) {
                return false;
            }
        },

        hasTouchSupport: function() {
            return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        },

        // Détecter le type d'appareil
        getDeviceType: function() {
            var userAgent = navigator.userAgent || navigator.vendor || window.opera;
            
            if (/iPad/i.test(userAgent)) {
                return 'tablet';
            }
            
            if (/iPhone|iPod/i.test(userAgent)) {
                return 'phone';
            }
            
            if (/Android/i.test(userAgent)) {
                if (/Mobile/i.test(userAgent)) {
                    return 'phone';
                } else {
                    return 'tablet';
                }
            }
            
            return 'desktop';
        },

        // Vérifier la version iOS
        getIOSVersion: function() {
            var match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
            if (match) {
                return {
                    major: parseInt(match[1], 10),
                    minor: parseInt(match[2], 10),
                    patch: parseInt(match[3] || '0', 10)
                };
            }
            return null;
        },

        // Vérifier la compatibilité iOS
        isIOSCompatible: function() {
            var iosVersion = this.getIOSVersion();
            if (!iosVersion) return true; // Si pas iOS, on assume compatible
            
            // Compatible avec iOS 9.3.5 et plus
            if (iosVersion.major > 9) return true;
            if (iosVersion.major === 9 && iosVersion.minor > 3) return true;
            if (iosVersion.major === 9 && iosVersion.minor === 3 && iosVersion.patch >= 5) return true;
            
            return false;
        }
    };

    // Export global
    global.HAUtils = Utils;

})(this);