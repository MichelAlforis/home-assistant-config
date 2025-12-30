/* ===========================================
   DASHBOARD.JS - POINT D'ENTRÉE PRINCIPAL
   Dashboard Home Assistant - Contrôles Avancés
   Compatible iOS 9.3.5 - Syntaxe ES5 uniquement
   =========================================== */

(function(global) {
    'use strict';

    var Dashboard = {
        
        // État de l'application
        state: {
            initialized: false,
            currentView: 'home',
            lastUpdateTime: 0,
            entities: {},
            rooms: [],
            materials: []
        },

        // Configuration
        config: {
            refreshInterval: 30000, // 30 secondes
            maxRetries: 3,
            retryDelay: 5000
        },

        // Initialiser l'application
        init: function() {
            HAUtils.debugLog('Initialisation du Dashboard Home Assistant');

            // Vérifier la compatibilité
            if (!this._checkCompatibility()) {
                return false;
            }

            // Initialiser les modules dans le bon ordre
            this._initializeModules();

            // Configurer les événements
            this._setupEventListeners();

            // Charger les données initiales
            this._loadInitialData();

            // Démarrer les mises à jour périodiques
            this._startPeriodicUpdates();

            this.state.initialized = true;
            HAUtils.debugLog('Dashboard initialisé avec succès');

            return true;
        },

        // Vérifier la compatibilité
        _checkCompatibility: function() {
            // Vérifier la compatibilité iOS
            if (!HAUtils.isIOSCompatible()) {
                alert('Cette version d\'iOS n\'est pas compatible. iOS 9.3.5 ou supérieur requis.');
                return false;
            }

            // Vérifier les fonctionnalités requises
            if (!document.querySelector || !document.addEventListener) {
                alert('Navigateur non compatible');
                return false;
            }

            return true;
        },

        // Initialiser les modules
        _initializeModules: function() {
            // Les modules s'initialisent automatiquement, mais on peut configurer ici
            
            // Configurer les messages
            if (global.HAMessages) {
                global.HAMessages.configure({
                    position: 'top-right',
                    maxMessages: 3
                });
            }

            // Appliquer le thème
            this._applyTheme();
        },

        // Configurer les événements
        _setupEventListeners: function() {
            // Gestion des interactions tactiles
            if (HAUtils.hasTouchSupport()) {
                this._setupTouchEvents();
            }

            // Gestion des erreurs réseau
            window.addEventListener('online', this._handleOnline.bind(this));
            window.addEventListener('offline', this._handleOffline.bind(this));

            // Gestion de la visibilité de la page
            document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this));

            // Nettoyage avant fermeture
            window.addEventListener('beforeunload', this._cleanup.bind(this));
        },

        // Configurer les événements tactiles
        _setupTouchEvents: function() {
            var touchStartTime = 0;
            var touchStartPos = { x: 0, y: 0 };

            document.addEventListener('touchstart', function(e) {
                touchStartTime = Date.now();
                if (e.touches[0]) {
                    touchStartPos.x = e.touches[0].clientX;
                    touchStartPos.y = e.touches[0].clientY;
                }
            });

            document.addEventListener('touchend', function(e) {
                var touchEndTime = Date.now();
                var touchDuration = touchEndTime - touchStartTime;

                // Détecter les gestes rapides (swipe)
                if (touchDuration < 300 && e.changedTouches[0]) {
                    var deltaX = e.changedTouches[0].clientX - touchStartPos.x;
                    var deltaY = e.changedTouches[0].clientY - touchStartPos.y;

                    if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
                        this._handleSwipeGesture(deltaX, deltaY);
                    }
                }
            }.bind(this));
        },

        // Gérer les gestes de swipe
        _handleSwipeGesture: function(deltaX, deltaY) {
            // Implémenter la navigation par gestes si nécessaire
            HAUtils.debugLog('Geste détecté: ' + deltaX + ', ' + deltaY);
        },

        // Charger les données initiales
        _loadInitialData: function() {
            HAUtils.debugLog('Chargement des données initiales...');

            // Simuler le chargement des entités (à remplacer par votre logique)
            this._loadEntities();
            
            // Charger la configuration des pièces
            this._loadRoomsConfiguration();
            
            // Mettre à jour l'affichage
            this.updateCurrentView();
        },

        // Charger les entités (version simulée)
        _loadEntities: function() {
            // Données simulées pour les tests
            var simulatedEntities = {
                'climate.adele': {
                    entity_id: 'climate.adele',
                    state: 'cool',
                    attributes: {
                        friendly_name: 'PAC Adele',
                        current_temperature: 22.5,
                        temperature: 21,
                        hvac_mode: 'cool'
                    }
                },
                'switch.adele': {
                    entity_id: 'switch.adele',
                    state: 'on',
                    attributes: {
                        friendly_name: 'Interrupteur Adele'
                    }
                },
                'cover.fenetre_salon': {
                    entity_id: 'cover.fenetre_salon',
                    state: 'open',
                    attributes: {
                        friendly_name: 'Fenêtre Salon',
                        current_position: 75
                    }
                }
            };

            this.state.entities = simulatedEntities;
            this.state.lastUpdateTime = Date.now();

            // Si HAService est disponible, utiliser les vraies données
            if (global.HAService && global.HAService._isConfigured && global.HAService._isConfigured()) {
                global.HAService.getAllStates(function(success, entities) {
                    if (success && entities) {
                        var entitiesMap = {};
                        for (var i = 0; i < entities.length; i++) {
                            var entity = entities[i];
                            entitiesMap[entity.entity_id] = entity;
                        }
                        this.state.entities = entitiesMap;
                        this.state.lastUpdateTime = Date.now();
                        this.updateCurrentView();
                    }
                }.bind(this));
            }
        },

        // Charger la configuration des pièces
        _loadRoomsConfiguration: function() {
            this.state.rooms = [
                { 
                    id: 'salon', 
                    name: 'Salon',
                    entities: ['climate.adele', 'cover.fenetre_salon']
                },
                { 
                    id: 'chambre_parents', 
                    name: 'Chambre Parents',
                    entities: ['climate.parents']
                }
            ];
        },

        // Mettre à jour la vue courante
        updateCurrentView: function() {
            HAUtils.debugLog('Mise à jour de la vue: ' + this.state.currentView);

            // Mettre à jour les contrôles avancés
            this._updateAdvancedControls();

            // Mettre à jour l'affichage des détails
            this._updateDetailsDisplay();

            // Notifier les modules de la mise à jour
            if (global.HAClimateControl) {
                global.HAClimateControl.updateDisplay();
            }

            if (global.HACoverControl) {
                global.HACoverControl.updateDisplay();
            }
        },

        // Mettre à jour les contrôles avancés
        _updateAdvancedControls: function() {
            var climateElements = document.querySelectorAll('[data-entity-domain="climate"]');
            for (var i = 0; i < climateElements.length; i++) {
                var element = climateElements[i];
                var entityId = element.getAttribute('data-entity-id');
                var entity = this.getEntity(entityId);
                
                if (entity && global.HAClimateControl) {
                    var newContent = global.HAClimateControl.createAdvancedControl(entity);
                    element.innerHTML = newContent;
                }
            }

            var coverElements = document.querySelectorAll('[data-entity-domain="cover"]');
            for (var i = 0; i < coverElements.length; i++) {
                var element = coverElements[i];
                var entityId = element.getAttribute('data-entity-id');
                var entity = this.getEntity(entityId);
                
                if (entity && global.HACoverControl) {
                    var newContent = global.HACoverControl.createAdvancedControl(entity);
                    element.innerHTML = newContent;
                }
            }
        },

        // Mettre à jour l'affichage des détails
        _updateDetailsDisplay: function() {
            // Mettre à jour les grilles de détails des pièces
            for (var i = 0; i < this.state.rooms.length; i++) {
                var room = this.state.rooms[i];
                var roomContainer = document.getElementById('room-details-' + room.id);
                
                if (roomContainer) {
                    var roomEntities = this._getRoomEntities(room);
                    var detailsHtml = this._generateRoomDetailsHtml(room, roomEntities);
                    roomContainer.innerHTML = detailsHtml;
                }
            }
        },

        // Obtenir les entités d'une pièce
        _getRoomEntities: function(room) {
            var entities = [];
            
            for (var i = 0; i < room.entities.length; i++) {
                var entityId = room.entities[i];
                var entity = this.getEntity(entityId);
                if (entity) {
                    entities.push(entity);
                }
            }
            
            return HAUtils.sortEntitiesByDomain(entities);
        },

        // Générer le HTML des détails de pièce
        _generateRoomDetailsHtml: function(room, roomEntities) {
            var html = '<div class="room-details-grid">';
            html += '<div class="section">';
            html += '<h3>' + room.name + ' <span class="section-count">' + roomEntities.length + '</span></h3>';
            
            if (roomEntities.length === 0) {
                html += '<div class="entity">Aucun équipement disponible</div>';
            } else {
                html += '<div class="entities-mini-grid">';
                
                for (var i = 0; i < roomEntities.length; i++) {
                    var entity = roomEntities[i];
                    html += this._createMiniEntityCard(entity);
                }
                
                html += '</div>';
            }
            
            html += '</div>';
            html += '</div>';
            return html;
        },

        // Créer une mini-carte d'entité
        _createMiniEntityCard: function(entity) {
            var entityId = entity.entity_id;
            var domain = HAUtils.getDomain(entityId);
            var state = entity.state || 'unknown';
            var attributes = entity.attributes || {};
            var friendlyName = HAUtils.formatFriendlyName(entityId, attributes.friendly_name);
            
            var html = '<div class="mini-entity-card' + (state === 'unavailable' ? ' unavailable' : '') + '" ';
            html += 'data-entity-id="' + entityId + '" data-entity-domain="' + domain + '">';
            
            // En-tête avec icône et nom
            html += '<div class="mini-entity-header">';
            html += HAUtils.getStatusIndicator(state, domain);
            html += '<div class="mini-entity-name">' + friendlyName + '</div>';
            html += '</div>';
            
            // État de l'entité
            html += '<div class="mini-entity-state">' + HAUtils.formatEntityState(entity, domain) + '</div>';
            
            // Contrôles selon le type d'entité
            html += '<div class="mini-entity-controls">';
            
            if (domain === 'climate' && global.HAClimateControl) {
                html += global.HAClimateControl.createAdvancedControl(entity);
            } else if (domain === 'cover' && global.HACoverControl) {
                html += global.HACoverControl.createAdvancedControl(entity);
            } else if (HAUtils.isEntityControllable(entityId) && state !== 'unavailable') {
                html += this._createMiniEntityControls(entity, domain);
            }
            
            html += '</div>';
            html += '</div>';
            
            return html;
        },

        // Créer les contrôles mini pour entités standard
        _createMiniEntityControls: function(entity, domain) {
            var entityId = entity.entity_id;
            var state = entity.state;
            
            switch (domain) {
                case 'light':
                case 'switch':
                    var isOn = (state === 'on');
                    var buttonClass = isOn ? 'control-btn off' : 'control-btn';
                    var buttonText = isOn ? 'OFF' : 'ON';
                    var action = isOn ? 'turn_off' : 'turn_on';
                    
                    return '<button class="' + buttonClass + '" style="width: 100%; font-size: 0.9em; padding: 10px;" ' +
                           'onclick="Dashboard.controlEntity(\'' + entityId + '\', \'' + action + '\')">' + 
                           buttonText + '</button>';
                
                default:
                    return '';
            }
        },

        // Contrôler une entité
        controlEntity: function(entityId, action) {
            HAUtils.debugLog('Contrôle entité: ' + entityId + ' action: ' + action);

            if (global.HAService) {
                var domain = HAUtils.getDomain(entityId);
                
                global.HAService.callService(domain, action, { entity_id: entityId }, function(success) {
                    if (success) {
                        if (global.HAMessages) {
                            global.HAMessages.showSuccess('✓ ' + action + ' exécuté');
                        }
                        
                        // Programmer une mise à jour après un court délai
                        setTimeout(function() {
                            this._refreshEntity(entityId);
                        }.bind(this), 1000);
                    }
                }.bind(this));
            } else {
                // Mode simulation
                if (global.HAMessages) {
                    global.HAMessages.showInfo('Simulation: ' + action + ' sur ' + entityId);
                }
            }
        },

        // Rafraîchir une entité spécifique
        _refreshEntity: function(entityId) {
            if (global.HAService) {
                global.HAService.getEntityState(entityId, function(success, entity) {
                    if (success && entity) {
                        this.state.entities[entityId] = entity;
                        this.updateCurrentView();
                    }
                }.bind(this));
            }
        },

        // Obtenir une entité
        getEntity: function(entityId) {
            return this.state.entities[entityId] || null;
        },

        // Démarrer les mises à jour périodiques
        _startPeriodicUpdates: function() {
            setInterval(function() {
                if (!document.hidden) {
                    this._loadEntities();
                }
            }.bind(this), this.config.refreshInterval);
        },

        // Appliquer le thème
        _applyTheme: function() {
            if (HAConfig && HAConfig.COLORS) {
                var root = document.documentElement;
                
                for (var colorName in HAConfig.COLORS) {
                    if (HAConfig.COLORS.hasOwnProperty(colorName)) {
                        root.style.setProperty('--color-' + colorName, HAConfig.COLORS[colorName]);
                    }
                }
            }
        },

        // Gérer la connexion
        _handleOnline: function() {
            if (global.HAMessages) {
                global.HAMessages.showSuccess('🌐 Connexion rétablie');
            }
            this._loadEntities();
        },

        _handleOffline: function() {
            if (global.HAMessages) {
                global.HAMessages.showWarning('📵 Mode hors ligne');
            }
        },

        // Gérer la visibilité de la page
        _handleVisibilityChange: function() {
            if (!document.hidden && this.state.initialized) {
                // Page redevenue visible, mettre à jour
                this._loadEntities();
            }
        },

        // Nettoyage avant fermeture
        _cleanup: function() {
            HAUtils.debugLog('Nettoyage du Dashboard...');
            
            // Sauvegarder les préférences
            if (global.HACoverControl && global.HACoverControl._savePreferences) {
                global.HACoverControl._savePreferences();
            }
        }
    };

    // Auto-initialisation quand le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            Dashboard.init();
        });
    } else {
        // DOM déjà prêt
        setTimeout(function() {
            Dashboard.init();
        }, 100);
    }

    // Export global
    global.Dashboard = Dashboard;

})(this);