"use strict";
// src/reportGeneration/utils/storageAdapter.ts
// Storage adapter that works in both browser and Node.js environments
// Context: Provides localStorage-like API for Node.js environments
exports.__esModule = true;
exports.storageAdapter = exports.StorageAdapter = void 0;
/**
 * Simple in-memory storage for Node.js environments
 */
var MemoryStorage = /** @class */ (function () {
    function MemoryStorage() {
        this.storage = new Map();
    }
    MemoryStorage.prototype.getItem = function (key) {
        return this.storage.get(key) || null;
    };
    MemoryStorage.prototype.setItem = function (key, value) {
        this.storage.set(key, value);
    };
    MemoryStorage.prototype.removeItem = function (key) {
        this.storage["delete"](key);
    };
    MemoryStorage.prototype.clear = function () {
        this.storage.clear();
    };
    Object.defineProperty(MemoryStorage.prototype, "length", {
        get: function () {
            return this.storage.size;
        },
        enumerable: false,
        configurable: true
    });
    MemoryStorage.prototype.key = function (index) {
        var keys = Array.from(this.storage.keys());
        return keys[index] || null;
    };
    MemoryStorage.prototype.keys = function () {
        return Array.from(this.storage.keys());
    };
    return MemoryStorage;
}());
/**
 * Storage adapter that provides a unified interface for both browser and Node.js
 */
var StorageAdapter = /** @class */ (function () {
    function StorageAdapter() {
        // Check if we're in a browser environment with localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
            this.storage = window.localStorage;
        }
        else {
            // Use in-memory storage for Node.js
            this.storage = new MemoryStorage();
        }
    }
    StorageAdapter.prototype.getItem = function (key) {
        try {
            return this.storage.getItem(key);
        }
        catch (error) {
            console.warn('[StorageAdapter] Failed to get item:', error);
            return null;
        }
    };
    StorageAdapter.prototype.setItem = function (key, value) {
        try {
            this.storage.setItem(key, value);
        }
        catch (error) {
            console.warn('[StorageAdapter] Failed to set item:', error);
            // If storage is full, try to clear old entries
            this.clearExpiredEntries();
            try {
                this.storage.setItem(key, value);
            }
            catch (retryError) {
                console.error('[StorageAdapter] Failed to set item after cleanup:', retryError);
            }
        }
    };
    StorageAdapter.prototype.removeItem = function (key) {
        try {
            this.storage.removeItem(key);
        }
        catch (error) {
            console.warn('[StorageAdapter] Failed to remove item:', error);
        }
    };
    StorageAdapter.prototype.clear = function () {
        try {
            this.storage.clear();
        }
        catch (error) {
            console.warn('[StorageAdapter] Failed to clear storage:', error);
        }
    };
    StorageAdapter.prototype.keys = function () {
        try {
            if (this.storage instanceof MemoryStorage) {
                return this.storage.keys();
            }
            else {
                // For localStorage, we need to iterate
                var keys = [];
                for (var i = 0; i < this.storage.length; i++) {
                    var key = this.storage.key(i);
                    if (key)
                        keys.push(key);
                }
                return keys;
            }
        }
        catch (error) {
            console.warn('[StorageAdapter] Failed to get keys:', error);
            return [];
        }
    };
    /**
     * Clear expired entries from storage
     */
    StorageAdapter.prototype.clearExpiredEntries = function () {
        var _this = this;
        var now = Date.now();
        var keysToRemove = [];
        this.keys().forEach(function (key) {
            try {
                var value = _this.getItem(key);
                if (value) {
                    var item = JSON.parse(value);
                    if (item.expires && item.expires < now) {
                        keysToRemove.push(key);
                    }
                }
            }
            catch (error) {
                // Remove corrupted entries
                keysToRemove.push(key);
            }
        });
        keysToRemove.forEach(function (key) { return _this.removeItem(key); });
    };
    return StorageAdapter;
}());
exports.StorageAdapter = StorageAdapter;
// Export a singleton instance
exports.storageAdapter = new StorageAdapter();
