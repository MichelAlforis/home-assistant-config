/* ===========================================
   CLIMATE-CONTROL.JS - VERSION AMÉLIORÉE
   Dashboard Home Assistant
   Compatible iOS 9.3.5 - Syntaxe ES5 uniquement
   =========================================== */

(function(global) {
    'use strict';

    var ClimateControl = {
        
        // Créer l'interface circulaire PAC
        createAdvancedControl: function(entity) {
            var entityId = entity.entity_id;
            var state = entity.state;
            var attributes = entity.attributes || {};
            var currentTemp = attributes.current_temperature || HAConfig.TEMPERATURE.DEFAULT;
            var targetTemp = attributes.temperature || HAConfig.TEMPERATURE.DEFAULT;
            var mode = attributes.hvac_mode || 'off';
            var switchEntityId = HAConfig.getPacSwitchEntity(entityId);
            var isPacOn = switchEntityId ? this._isEntityOn(switchEntityId) : (state !== 'off');
            
            var html = '<div class="climate-circular-control" data-entity-id="' + entityId + '"';
            if (switchEntityId) {
                html += ' data-switch-entity-id="' + switchEntityId + '"';
            }
            html += ' data-current-temp="' + currentTemp + '" data-target-temp="' + targetTemp + '" data-mode="' + mode + '">';
            
            html += this._createTemperatureWheel(entityId, currentTemp, targetTemp, mode);
            html += this._createTemperatureControls(entityId);
            html += this._createPowerSwitch(switchEntityId, isPacOn);
            html += this._createModeSelector(entityId, mode);
            html += '</div>';
            return html;
        },

        // Créer la molette de température - AMÉLIORÉE
        _createTemperatureWheel: function(entityId, currentTemp, targetTemp, mode) {
            var modeInfo = HAConfig.getHvacModeInfo(mode);
            var html = '<div class="temperature-wheel" data-entity-id="' + entityId + '" onclick="HAClimate.toggleTemperatureWheel(\'' + entityId + '\')">';
            html += '<div class="temperature-wheel-inner">';
            html += '<div class="current-temp" id="current-temp-' + HAUtils.sanitizeCssSelector(entityId) + '">' + currentTemp.toFixed(1) + '°</div>';
            html += '<div class="target-temp" id="target-temp-' + HAUtils.sanitizeCssSelector(entityId) + '">' + targetTemp + '°</div>';
            html += '<div class="mode-indicator ' + mode + '" id="mode-indicator-' + HAUtils.sanitizeCssSelector(entityId) + '">' + modeInfo.icon + '</div>';
            html += '</div>';
            html += '</div>';
            
            return html;
        },

        // Créer les contrôles +/- - AMÉLIORÉS
        _createTemperatureControls: function(entityId) {
            var html = '<div class="temp-controls">';
            html += '<button class="temp-btn temp-btn-minus" data-entity-id="' + entityId + '" onclick="HAClimate.adjustTemperature(\'' + entityId + '\', -1)" title="Diminuer température">−</button>';
            html += '<button class="temp-btn temp-btn-plus" data-entity-id="' + entityId + '" onclick="HAClimate.adjustTemperature(\'' + entityId + '\', 1)" title="Augmenter température">+</button>';
            html += '</div>';
            
            return html;
        },

        // Créer l'interrupteur principal - AMÉLIORÉ
        _createPowerSwitch: function(switchEntityId, isPacOn) {
            if (!switchEntityId) {
                return '<div class="pac-power-switch"><div class="power-switch-disabled">Pas d\'interrupteur configuré</div></div>';
            }
            
            var html = '<div class="pac-power-switch">';
            html += '<label class="pac-power-toggle" title="Alimentation PAC">';
            html += '<input type="checkbox" ' + (isPacOn ? 'checked' : '') + ' ';
            html += 'data-switch-entity-id="' + switchEntityId + '" ';
            html += 'onchange="HAClimate.togglePacPower(\'' + switchEntityId + '\')">';
            html += '<span class="pac-power-slider"></span>';
            html += '</label>';
            html += '<div class="power-switch-label">Alimentation</div>';
            html += '</div>';
            
            return html;
        },

        // Créer le sélecteur de modes - AMÉLIORÉ
        _createModeSelector: function(entityId, currentMode) {
            var html = '<div class="mode-selector" data-entity-id="' + entityId + '">';
            
            var modes = ['heat', 'cool', 'auto', 'dry', 'fan_only'];
            for (var i = 0; i < modes.length; i++) {
                var mode = modes[i];
                html += this._createModeButton(mode, entityId, currentMode);
            }
            
            html += '</div>';
            return html;
        },

        // Créer un bouton de mode - AMÉLIORÉ
        _createModeButton: function(modeValue, entityId, currentMode) {
            var modeInfo = HAConfig.getHvacModeInfo(modeValue);
            var isActive = currentMode === modeValue;
            var activeClass = isActive ? ' active' : '';
            
            return '<button class="mode-btn ' + modeValue + activeClass + '" ' +
                   'data-entity-id="' + entityId + '" data-mode="' + modeValue + '" ' +
                   'title="Mode ' + modeInfo.label + '" ' +
                   'onclick="HAClimate.setMode(\'' + entityId + '\', \'' + modeValue + '\')">' +
                   modeInfo.label + '</button>';
        },

        // NOUVELLE - Récupérer l'entité courante
        _getCurrentEntity: function(entityId) {
            if (global.Dashboard && global.Dashboard.getEntity) {
                return global.Dashboard.getEntity(entityId);
            }
            return null;
        },

        // Vérifier si une entité est allumée - AMÉLIORÉE
        _isEntityOn: function(entityId) {
            var entity = this._getCurrentEntity(entityId);
            return entity && entity.state === 'on';
        },

        // NOUVELLE - Récupérer la température cible actuelle
        _getCurrentTargetTemp: function(entityId) {
            var entity = this._getCurrentEntity(entityId);
            if (entity && entity.attributes && entity.attributes.temperature) {
                return entity.attributes.temperature;
            }
            return HAConfig.TEMPERATURE.DEFAULT;
        },

        // Actions publiques
        togglePacPower: function(switchEntityId) {
            HAUtils.debugLog('Toggle PAC power: ' + switchEntityId);
            
            if (global.HAService) {
                global.HAService.toggleEntity(switchEntityId, function(success) {
                    if (success && global.HAMessages) {
                        global.HAMessages.showSuccess('💡 Alimentation PAC basculée');
                        
                        // Programmer une mise à jour de l'affichage
                        setTimeout(function() {
                            this.updateDisplay();
                        }.bind(this), 1000);
                    }
                }.bind(this));
            }
        },

        // AMÉLIORÉE - Ajuster température
        adjustTemperature: function(entityId, delta) {
            HAUtils.debugLog('Adjust temperature: ' + entityId + ' delta: ' + delta);
            
            // Récupérer la température cible actuelle
            var currentTarget = this._getCurrentTargetTemp(entityId);
            var newTarget = HAConfig.clampTemperature(currentTarget + delta);
            
            // Mise à jour visuelle immédiate
            this._updateTemperatureDisplay(entityId, newTarget);
            
            this.setTemperature(entityId, newTarget);
        },

        // NOUVELLE - Mise à jour visuelle immédiate
        _updateTemperatureDisplay: function(entityId, temperature) {
            var targetTempElement = document.getElementById('target-temp-' + HAUtils.sanitizeCssSelector(entityId));
            if (targetTempElement) {
                targetTempElement.textContent = temperature + '°';
                
                // Animation de highlight
                targetTempElement.classList.add('temp-highlight');
                setTimeout(function() {
                    targetTempElement.classList.remove('temp-highlight');
                }, 300);
            }
        },

        setTemperature: function(entityId, temperature) {
            var temp = HAConfig.clampTemperature(temperature);
            HAUtils.debugLog('Set temperature: ' + entityId + ' to ' + temp + '°C');
            
            if (global.HAService) {
                global.HAService.callService('climate', 'set_temperature', {
                    entity_id: entityId,
                    temperature: temp
                }, function(success) {
                    if (success && global.HAMessages) {
                        global.HAMessages.showSuccess('🌡️ Température: ' + temp + '°C');
                    } else if (!success && global.HAMessages) {
                        global.HAMessages.showError('❌ Erreur réglage température');
                    }
                });
            }
        },

        // AMÉLIORÉE - Changer le mode
        setMode: function(entityId, mode) {
            HAUtils.debugLog('Set HVAC mode: ' + entityId + ' to ' + mode);
            
            // Mise à jour visuelle immédiate
            this._updateModeDisplay(entityId, mode);
            
            if (global.HAService) {
                global.HAService.callService('climate', 'set_hvac_mode', {
                    entity_id: entityId,
                    hvac_mode: mode
                }, function(success) {
                    if (success && global.HAMessages) {
                        var modeInfo = HAConfig.getHvacModeInfo(mode);
                        global.HAMessages.showSuccess('🎛️ Mode: ' + modeInfo.label);
                    } else if (!success && global.HAMessages) {
                        global.HAMessages.showError('❌ Erreur changement mode');
                        // Restaurer l'affichage précédent
                        setTimeout(function() {
                            this.updateDisplay();
                        }.bind(this), 1000);
                    }
                }.bind(this));
            }
        },

        // NOUVELLE - Mise à jour visuelle du mode
        _updateModeDisplay: function(entityId, mode) {
            var modeSelector = document.querySelector('.mode-selector[data-entity-id="' + entityId + '"]');
            if (modeSelector) {
                // Désactiver tous les boutons
                var modeButtons = modeSelector.querySelectorAll('.mode-btn');
                for (var i = 0; i < modeButtons.length; i++) {
                    modeButtons[i].classList.remove('active');
                }
                
                // Activer le nouveau mode
                var newModeButton = modeSelector.querySelector('.mode-btn[data-mode="' + mode + '"]');
                if (newModeButton) {
                    newModeButton.classList.add('active');
                }
                
                // Mettre à jour l'indicateur de mode
                var modeIndicator = document.getElementById('mode-indicator-' + HAUtils.sanitizeCssSelector(entityId));
                if (modeIndicator) {
                    var modeInfo = HAConfig.getHvacModeInfo(mode);
                    modeIndicator.textContent = modeInfo.icon;
                    modeIndicator.className = 'mode-indicator ' + mode;
                }
            }
        },

        toggleTemperatureWheel: function(entityId) {
            HAUtils.debugLog('Temperature wheel interaction: ' + entityId);
            // Ajouter une animation de clic
            var wheel = document.querySelector('.temperature-wheel[data-entity-id="' + entityId + '"]');
            if (wheel) {
                wheel.classList.add('wheel-clicked');
                setTimeout(function() {
                    wheel.classList.remove('wheel-clicked');
                }, 200);
            }
        },

        // AMÉLIORÉE - Mise à jour de l'affichage complète
        updateDisplay: function() {
            var climateControls = document.querySelectorAll('.climate-circular-control');
            
            for (var i = 0; i < climateControls.length; i++) {
                var control = climateControls[i];
                var entityId = control.getAttribute('data-entity-id');
                var switchEntityId = control.getAttribute('data-switch-entity-id');
                
                if (entityId) {
                    var entity = this._getCurrentEntity(entityId);
                    if (entity) {
                        // Mise à jour des températures
                        var currentTemp = entity.attributes.current_temperature || HAConfig.TEMPERATURE.DEFAULT;
                        var targetTemp = entity.attributes.temperature || HAConfig.TEMPERATURE.DEFAULT;
                        var mode = entity.attributes.hvac_mode || 'off';
                        
                        this._updateTemperatureDisplay(entityId, targetTemp);
                        this._updateModeDisplay(entityId, mode);
                        
                        // Mise à jour température courante
                        var currentTempElement = document.getElementById('current-temp-' + HAUtils.sanitizeCssSelector(entityId));
                        if (currentTempElement) {
                            currentTempElement.textContent = currentTemp.toFixed(1) + '°';
                        }
                    }
                }
                
                // Mise à jour interrupteur d'alimentation
                if (switchEntityId) {
                    var toggle = control.querySelector('input[data-switch-entity-id="' + switchEntityId + '"]');
                    if (toggle) {
                        var isPacOn = this._isEntityOn(switchEntityId);
                        toggle.checked = isPacOn;
                    }
                }
            }
        },

        // Initialisation du module
        init: function() {
            HAUtils.debugLog('Climate Control module initialized');
            
            // Ajouter les styles CSS pour les animations
            this._injectAnimationCSS();
            
            // Exposer les fonctions publiques globalement
            global.HAClimate = {
                togglePacPower: this.togglePacPower.bind(this),
                adjustTemperature: this.adjustTemperature.bind(this),
                setTemperature: this.setTemperature.bind(this),
                setMode: this.setMode.bind(this),
                toggleTemperatureWheel: this.toggleTemperatureWheel.bind(this),
                updateDisplay: this.updateDisplay.bind(this)
            };
        },

        // NOUVELLE - Injecter CSS pour les animations
        _injectAnimationCSS: function() {
            var cssId = 'ha-climate-animations';
            if (document.getElementById(cssId)) {
                return;
            }
            
            var css = `
                .temp-highlight {
                    animation: tempFlash 0.3s ease;
                }
                
                @keyframes tempFlash {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); color: #3498db; }
                    100% { transform: scale(1); }
                }
                
                .wheel-clicked {
                    animation: wheelPulse 0.2s ease;
                }
                
                @keyframes wheelPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(0.95); }
                    100% { transform: scale(1); }
                }
                
                .power-switch-disabled {
                    font-size: 0.8em;
                    color: #999;
                    text-align: center;
                    padding: 10px;
                }
                
                .power-switch-label {
                    margin-top: 8px; 
                    font-size: 0.9em; 
                    color: #666;
                    text-align: center;
                }
            `;
            
            var head = document.head || document.getElementsByTagName('head')[0];
            var style = document.createElement('style');
            style.id = cssId;
            style.type = 'text/css';
            
            if (style.styleSheet) {
                style.styleSheet.cssText = css;
            } else {
                style.appendChild(document.createTextNode(css));
            }
            
            head.appendChild(style);
        }
    };

    // Auto-initialisation
    ClimateControl.init();

    // Export du module
    global.HAClimateControl = ClimateControl;

})(this);