"use strict";
// src/utils/logger.ts
// Logging utility for debug and error tracking
// Provides consistent logging across the application
exports.__esModule = true;
exports.setLogLevel = exports.logError = exports.logWarn = exports.logInfo = exports.logDebug = void 0;
var Logger = /** @class */ (function () {
    function Logger() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
        this.logLevel = 'info';
    }
    Logger.prototype.setLogLevel = function (level) {
        this.logLevel = level;
    };
    Logger.prototype.shouldLog = function (level) {
        var levels = ['debug', 'info', 'warn', 'error'];
        var currentLevelIndex = levels.indexOf(this.logLevel);
        var messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
    };
    Logger.prototype.formatMessage = function (level, module, message, data) {
        var timestamp = new Date().toISOString();
        var dataStr = data ? " | ".concat(JSON.stringify(data)) : '';
        return "[".concat(timestamp, "] [").concat(level.toUpperCase(), "] [").concat(module, "] ").concat(message).concat(dataStr);
    };
    Logger.prototype.debug = function (module, message, data) {
        if (this.shouldLog('debug') && this.isDevelopment) {
            console.log(this.formatMessage('debug', module, message, data));
        }
    };
    Logger.prototype.info = function (module, message, data) {
        if (this.shouldLog('info')) {
            console.info(this.formatMessage('info', module, message, data));
        }
    };
    Logger.prototype.warn = function (module, message, data) {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', module, message, data));
        }
    };
    Logger.prototype.error = function (module, message, error) {
        if (this.shouldLog('error')) {
            console.error(this.formatMessage('error', module, message, error));
        }
    };
    return Logger;
}());
// Create singleton instance
var logger = new Logger();
// Export convenience functions
var logDebug = function (module, message, data) {
    return logger.debug(module, message, data);
};
exports.logDebug = logDebug;
var logInfo = function (module, message, data) {
    return logger.info(module, message, data);
};
exports.logInfo = logInfo;
var logWarn = function (module, message, data) {
    return logger.warn(module, message, data);
};
exports.logWarn = logWarn;
var logError = function (module, message, error) {
    return logger.error(module, message, error);
};
exports.logError = logError;
var setLogLevel = function (level) { return logger.setLogLevel(level); };
exports.setLogLevel = setLogLevel;
exports["default"] = logger;
