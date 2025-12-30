/* ===========================================
   CONFIG.JS - CONFIGURATION CENTRALISÉE
   Dashboard Home Assistant
   Compatible iOS 9.3.5 - Syntaxe ES5 uniquement
   =========================================== */

(function(global) {
    'use strict';

    // Configuration principale
    var Config = {
        // Mapping des PAC vers leurs interrupteurs
        PAC_SWITCH_MAPPING: {
            'climate.adele': 'switch.adele',
            'climate.alex': 'switch.alex', 
            'climate.bureau': 'switch.bureau',
            'climate.cuisine': 'switch.cuisine',
            'climate.entree_tv': 'switch.entree_tv',
            'climate.parents': 'switch.parents'
        },

        // Limites de température
        TEMPERATURE: {
            MIN: 5,
            MAX: 35,
            DEFAULT: 20
        },

        // Modes climatiques
        HVAC_MODES: {
            'heat': { label: '🔥 Chauffage', icon: '🔥' },
            'cool': { label: '❄️ Clim', icon: '❄️' },
            'auto': { label: '🔄 Auto', icon: '🔄' },
            'dry': { label: '💨 Déshumid', icon: '💨' },
            'fan_only': { label: '🌪️ Ventil', icon: '🌪️' },
            'off': { label: '⭕ Arrêt', icon: '⭕' }
        },

        // Actions des volets
        COVER_ACTIONS: {
            'open': 'Ouverture',
            'close': 'Fermeture',
            'stop': 'Arrêt'
        },

        // Couleurs du thème
        COLORS: {
            primary: '#3498db',
            secondary: '#2ecc71',
            danger: '#e74c3c',
            warning: '#f39c12',
            info: '#8e44ad',
            light: '#ecf0f1',
            dark: '#2c3e50'
        },

        // Paramètres UI
        UI: {
            MESSAGE_DURATION: 3000,
            REFRESH_INTERVAL: 10000,
            INTERACTION_TIMEOUT: 500
        },

        // Clés de stockage local
        STORAGE_KEYS: {
            COVER_SLOW_MODES: 'ha-cover-slow-modes',
            USER_PREFERENCES: 'ha-user-preferences',
            THEME_SETTINGS: 'ha-theme-settings'
        }
    };

    // Méthodes de configuration
    Config.getPacSwitchEntity = function(climateEntityId) {
        return this.PAC_SWITCH_MAPPING[climateEntityId] || null;
    };

    Config.getHvacModeInfo = function(mode) {
        return this.HVAC_MODES[mode] || { label: mode, icon: '❓' };
    };

    Config.getCoverActionName = function(action) {
        return this.COVER_ACTIONS[action] || action;
    };

    Config.isTemperatureValid = function(temp) {
        var temperature = parseFloat(temp);
        return !isNaN(temperature) && 
               temperature >= this.TEMPERATURE.MIN && 
               temperature <= this.TEMPERATURE.MAX;
    };

    Config.clampTemperature = function(temp) {
        var temperature = parseFloat(temp);
        if (isNaN(temperature)) return this.TEMPERATURE.DEFAULT;
        return Math.max(
            this.TEMPERATURE.MIN,
            Math.min(this.TEMPERATURE.MAX, temperature)
        );
    };

    // Export global
    global.HAConfig = Config;

})(this);
