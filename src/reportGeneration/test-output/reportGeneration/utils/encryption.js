"use strict";
// src/reportGeneration/utils/encryption.ts
// Encryption utilities for sensitive report data
// Context: Provides client-side encryption for report storage
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.EncryptionUtils = void 0;
var logger_1 = require("../../utils/logger");
/**
 * Encryption utilities using Web Crypto API
 */
var EncryptionUtils = /** @class */ (function () {
    function EncryptionUtils() {
    }
    /**
     * Generate a new encryption key
     */
    EncryptionUtils.generateKey = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, crypto.subtle.generateKey({
                            name: this.algorithm,
                            length: this.keyLength
                        }, true, // extractable
                        ['encrypt', 'decrypt'])];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Derive key from password
     */
    EncryptionUtils.deriveKeyFromPassword = function (password, salt) {
        return __awaiter(this, void 0, void 0, function () {
            var keyMaterial, key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Generate salt if not provided
                        if (!salt) {
                            salt = crypto.getRandomValues(new Uint8Array(16));
                        }
                        return [4 /*yield*/, crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey'])];
                    case 1:
                        keyMaterial = _a.sent();
                        return [4 /*yield*/, crypto.subtle.deriveKey({
                                name: 'PBKDF2',
                                salt: salt,
                                iterations: 100000,
                                hash: 'SHA-256'
                            }, keyMaterial, { name: this.algorithm, length: this.keyLength }, true, ['encrypt', 'decrypt'])];
                    case 2:
                        key = _a.sent();
                        return [2 /*return*/, { key: key, salt: salt }];
                }
            });
        });
    };
    /**
     * Encrypt data
     */
    EncryptionUtils.encrypt = function (data, key) {
        return __awaiter(this, void 0, void 0, function () {
            var encoder, dataBytes, iv, ciphertext, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        encoder = new TextEncoder();
                        dataBytes = encoder.encode(data);
                        iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
                        return [4 /*yield*/, crypto.subtle.encrypt({
                                name: this.algorithm,
                                iv: iv
                            }, key, dataBytes)];
                    case 1:
                        ciphertext = _a.sent();
                        // Convert to base64 for storage
                        return [2 /*return*/, {
                                ciphertext: this.arrayBufferToBase64(ciphertext),
                                iv: this.arrayBufferToBase64(iv)
                            }];
                    case 2:
                        error_1 = _a.sent();
                        (0, logger_1.logDebug)('EncryptionUtils', "Encryption failed: ".concat(error_1));
                        throw new Error('Encryption failed');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Decrypt data
     */
    EncryptionUtils.decrypt = function (ciphertext, iv, key) {
        return __awaiter(this, void 0, void 0, function () {
            var ciphertextBytes, ivBytes, plaintext, decoder, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        ciphertextBytes = this.base64ToArrayBuffer(ciphertext);
                        ivBytes = this.base64ToArrayBuffer(iv);
                        return [4 /*yield*/, crypto.subtle.decrypt({
                                name: this.algorithm,
                                iv: ivBytes
                            }, key, ciphertextBytes)];
                    case 1:
                        plaintext = _a.sent();
                        decoder = new TextDecoder();
                        return [2 /*return*/, decoder.decode(plaintext)];
                    case 2:
                        error_2 = _a.sent();
                        (0, logger_1.logDebug)('EncryptionUtils', "Decryption failed: ".concat(error_2));
                        throw new Error('Decryption failed');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Encrypt an object
     */
    EncryptionUtils.encryptObject = function (obj, key) {
        return __awaiter(this, void 0, void 0, function () {
            var json;
            return __generator(this, function (_a) {
                json = JSON.stringify(obj);
                return [2 /*return*/, this.encrypt(json, key)];
            });
        });
    };
    /**
     * Decrypt an object
     */
    EncryptionUtils.decryptObject = function (ciphertext, iv, key) {
        return __awaiter(this, void 0, void 0, function () {
            var json;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.decrypt(ciphertext, iv, key)];
                    case 1:
                        json = _a.sent();
                        return [2 /*return*/, JSON.parse(json)];
                }
            });
        });
    };
    /**
     * Export key for storage
     */
    EncryptionUtils.exportKey = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var exported;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, crypto.subtle.exportKey('jwk', key)];
                    case 1:
                        exported = _a.sent();
                        return [2 /*return*/, JSON.stringify(exported)];
                }
            });
        });
    };
    /**
     * Import key from storage
     */
    EncryptionUtils.importKey = function (keyData) {
        return __awaiter(this, void 0, void 0, function () {
            var jwk;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        jwk = JSON.parse(keyData);
                        return [4 /*yield*/, crypto.subtle.importKey('jwk', jwk, {
                                name: this.algorithm,
                                length: this.keyLength
                            }, true, ['encrypt', 'decrypt'])];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Generate a secure random password
     */
    EncryptionUtils.generatePassword = function (length) {
        if (length === void 0) { length = 16; }
        var charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        var randomValues = crypto.getRandomValues(new Uint8Array(length));
        return Array.from(randomValues)
            .map(function (x) { return charset[x % charset.length]; })
            .join('');
    };
    /**
     * Hash data using SHA-256
     */
    EncryptionUtils.hash = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var encoder, dataBytes, hashBuffer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        encoder = new TextEncoder();
                        dataBytes = encoder.encode(data);
                        return [4 /*yield*/, crypto.subtle.digest('SHA-256', dataBytes)];
                    case 1:
                        hashBuffer = _a.sent();
                        return [2 /*return*/, this.arrayBufferToBase64(hashBuffer)];
                }
            });
        });
    };
    /**
     * Convert ArrayBuffer to base64
     */
    EncryptionUtils.arrayBufferToBase64 = function (buffer) {
        var bytes = new Uint8Array(buffer);
        var binary = '';
        for (var i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    };
    /**
     * Convert base64 to ArrayBuffer
     */
    EncryptionUtils.base64ToArrayBuffer = function (base64) {
        var binary = atob(base64);
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    };
    /**
     * Check if encryption is available
     */
    EncryptionUtils.isAvailable = function () {
        return typeof crypto !== 'undefined' &&
            typeof crypto.subtle !== 'undefined' &&
            typeof crypto.subtle.encrypt === 'function';
    };
    EncryptionUtils.algorithm = 'AES-GCM';
    EncryptionUtils.keyLength = 256;
    EncryptionUtils.ivLength = 12; // 96 bits for GCM
    return EncryptionUtils;
}());
exports.EncryptionUtils = EncryptionUtils;
