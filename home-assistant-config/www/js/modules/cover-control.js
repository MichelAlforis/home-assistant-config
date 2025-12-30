/* ===========================================
   COVER-CONTROL.JS - MODULE DE CONTRÔLE VOLETS
   Dashboard Home Assistant
   Compatible iOS 9.3.5 - Syntaxe ES5 uniquement
   =========================================== */

(function(global) {
    'use strict';

    var CoverControl = {
        
        // État des modes slow par volet
        slowModes: {},

        // Créer le contrôle volet avancé
        createAdvancedControl: function(entity) {
            var entityId = entity.entity_id;
            var attributes = entity.attributes || {};
            var position = attributes.current_position || 0;
            var isSlowMode = this.getSlowMode(entityId);
            
            var html = '<div class="advanced-cover-control">';
            
            // Toggle Rapid/Slow
            html += this._createSpeedToggle(entityId, isSlowMode);
            
            // Contrôle de position avec slider
            html += this._createPositionControl(entityId, position);
            
            // Actions rapides
            html += this._createQuickActions(entityId);
            
            html += '</div>';
            return html;
        },

        // Créer le toggle de vitesse
        _createSpeedToggle: function(entityId, isSlowMode) {
            var html = '<div class="speed-toggle">';
            html += '<label class="speed-switch">';
            html += '<input type="checkbox" ' + (isSlowMode ? 'checked' : '') + ' ';
            html += 'onchange="HACover.toggleSpeed(\'' + entityId + '\')">';
            html += '<div class="speed-slider">';
            html += '<span class="speed-label-left">Rapid</span>';
            html += '<span class="speed-label-right">Slow</span>';
            html += '</div>';
            html += '</label>';
            html += '</div>';
            
            return html;
        },

        // Créer le contrôle de position
        _createPositionControl: function(entityId, position) {
            var safEntityId = HAUtils.sanitizeCssSelector(entityId);
            
            var html = '<div class="position-control">';
            html += '<input type="range" min="0" max="100" value="' + position + '" ';
            html += 'class="position-slider" data-entity="' + entityId + '" ';
            html += 'oninput="HACover.updatePositionDisplay(this)" ';
            html += 'onchange="HACover.setPosition(\'' + entityId + '\', this.value)">';
            
            html += '<div class="position-display" id="pos-display-' + safEntityId + '">' + position + '%</div>';
            
            // Représentation visuelle de la position
            html += '<div class="position-visual">';
            html += '<div class="position-fill" style="height: ' + position + '%"></div>';
            html += '</div>';
            html += '</div>';
            
            return html;
        },

        // Créer les actions rapides
        _createQuickActions: function(entityId) {
            var html = '<div class="quick-actions">';
            html += '<button class="quick-action-btn" onclick="HACover.setPosition(\'' + entityId + '\', 0)">Fermé</button>';
            html += '<button class="quick-action-btn" onclick="HACover.setPosition(\'' + entityId + '\', 50)">50%</button>';
            html += '<button class="quick-action-btn" onclick="HACover.setPosition(\'' + entityId + '\', 100)">Ouvert</button>';
            html += '</div>';
            
            return html;
        },

        // Obtenir le mode slow d'un volet
        getSlowMode: function(entityId) {
            return this.slowModes[entityId] || false;
        },

        // Basculer le mode Rapid/Slow
        toggleSpeed: function(entityId) {
            var isSlowMode = !this.getSlowMode(entityId);
            this.slowModes[entityId] = isSlowMode;
            
            var message = isSlowMode ? '🐌 Mode silencieux activé' : '⚡ Mode rapide activé';
            if (global.HAMessages) {
                global.HAMessages.showInfo(message);
            }
            
            // Sauvegarder les préférences
            this._savePreferences();
        },

        // Définir une position spécifique du volet
        setPosition: function(entityId, position) {
            var numPosition = parseInt(position, 10);
            if (isNaN(numPosition) || numPosition < 0 || numPosition > 100) {
                if (global.HAMessages) {
                    global.HAMessages.showError('Position invalide: ' + position);
                }
                return;
            }
            
            var targetEntityId = this._getTargetEntity(entityId);
            var isSlowMode = this.getSlowMode(entityId);
            
            if (global.HAService) {
                global.HAService.callService('cover', 'set_cover_position', {
                    entity_id: targetEntityId,
                    position: numPosition
                }, function(success) {
                    if (success && global.HAMessages) {
                        var speedText = isSlowMode ? ' (silencieux)' : '';
                        global.HAMessages.showSuccess('🪟 Position: ' + numPosition + '%' + speedText);
                    }
                });
            }
            
            // Mettre à jour l'affichage immédiatement
            this.updatePositionDisplay(entityId, numPosition);
        },

        // Contrôler un volet (ouverture/fermeture/arrêt)
        controlCover: function(entityId, action) {
            var targetEntityId = this._getTargetEntity(entityId);
            var isSlowMode = this.getSlowMode(entityId);
            var service = action + '_cover';
            
            if (global.HAService) {
                global.HAService.callService('cover', service, {
                    entity_id: targetEntityId
                }, function(success) {
                    if (success && global.HAMessages) {
                        var actionName = HAConfig.getCoverActionName(action);
                        var speedText = isSlowMode && action !== 'stop' ? ' (silencieux)' : '';
                        global.HAMessages.showInfo('🪟 ' + actionName + speedText);
                    }
                });
            }
        },

        // Obtenir l'entité cible selon le mode slow
        _getTargetEntity: function(entityId) {
            var isSlowMode = this.getSlowMode(entityId);
            
            if (isSlowMode) {
                // Construire le nom de l'entité slow
                var slowEntityId = entityId.replace('cover.fenetre_', 'cover.fenetre_') + '_low_speed';
                
                // Vérifier si l'entité slow existe (à implémenter selon votre système)
                if (this._entityExists(slowEntityId)) {
                    return slowEntityId;
                }
            }
            
            return entityId;
        },

        // Vérifier si une entité existe
        _entityExists: function(entityId) {
            // À implémenter selon votre système de données
            return true;
        },

        // Mettre à jour l'affichage de position
        updatePositionDisplay: function(sliderOrEntityId, position) {
            var entityId, value;
            
            if (typeof sliderOrEntityId === 'string') {
                // Appelé avec entityId et position
                entityId = sliderOrEntityId;
                value = position;
            } else {
                // Appelé depuis un slider
                entityId = sliderOrEntityId.getAttribute('data-entity');
                value = sliderOrEntityId.value;
            }
            
            var safEntityId = HAUtils.sanitizeCssSelector(entityId);
            var displayId = 'pos-display-' + safEntityId;
            var display = document.getElementById(displayId);
            
            if (display) {
                display.textContent = value + '%';
            }
            
            // Mettre à jour la représentation visuelle
            var slider = document.querySelector('[data-entity="' + entityId + '"]');
            if (slider) {
                var visualFill = slider.parentElement.querySelector('.position-fill');
                if (visualFill) {
                    visualFill.style.height = value + '%';
                }
            }
        },

        // Mise à jour de l'affichage
        updateDisplay: function() {
            var positionSliders = document.querySelectorAll('.position-slider');
            
            for (var i = 0; i < positionSliders.length; i++) {
                var slider = positionSliders[i];
                var entityId = slider.getAttribute('data-entity');
                
                // Récupérer la position actuelle (à implémenter selon votre système)
                var currentPosition = this._getCurrentPosition(entityId);
                if (currentPosition !== null) {
                    slider.value = currentPosition;
                    this.updatePositionDisplay(slider);
                }
            }
        },

        // Récupérer la position actuelle d'un volet
        _getCurrentPosition: function(entityId) {
            // À implémenter selon votre système de données
            return null;
        },

        // Sauvegarder les préférences
        _savePreferences: function() {
            if (HAUtils.hasLocalStorage()) {
                try {
                    localStorage.setItem(HAConfig.STORAGE_KEYS.COVER_SLOW_MODES, 
                                       JSON.stringify(this.slowModes));
                    HAUtils.debugLog('Préférences volets sauvegardées: ' + 
                                   Object.keys(this.slowModes).length + ' volets');
                } catch (e) {
                    HAUtils.debugLog('Erreur sauvegarde préférences volets: ' + e.message);
                }
            }
        },

        // Charger les préférences
        _loadPreferences: function() {
            if (HAUtils.hasLocalStorage()) {
                try {
                    var saved = localStorage.getItem(HAConfig.STORAGE_KEYS.COVER_SLOW_MODES);
                    if (saved && HAUtils.isValidJson(saved)) {
                        this.slowModes = JSON.parse(saved);
                        HAUtils.debugLog('Préférences volets chargées: ' + 
                                       Object.keys(this.slowModes).length + ' volets');
                    }
                } catch (e) {
                    HAUtils.debugLog('Erreur chargement préférences volets: ' + e.message);
                    this.slowModes = {};
                }
            }
        },

        // Initialisation du module
        init: function() {
            HAUtils.debugLog('Cover Control module initialized');
            
            // Charger les préférences
            this._loadPreferences();
            
            // Exposer les fonctions publiques globalement
            global.HACover = {
                toggleSpeed: this.toggleSpeed.bind(this),
                setPosition: this.setPosition.bind(this),
                controlCover: this.controlCover.bind(this),
                updatePositionDisplay: this.updatePositionDisplay.bind(this)
            };
        }
    };

    // Auto-initialisation
    CoverControl.init();

    // Export du module
    global.HACoverControl = CoverControl;

})(this);