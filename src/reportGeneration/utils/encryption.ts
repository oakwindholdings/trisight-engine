// src/reportGeneration/utils/encryption.ts
// Encryption utilities for sensitive report data
// Context: Provides client-side encryption for report storage

import { logDebug } from '../../utils/logger';

/**
 * Encryption utilities using Web Crypto API
 */
export class EncryptionUtils {
  private static algorithm = 'AES-GCM';
  private static keyLength = 256;
  private static ivLength = 12; // 96 bits for GCM

  /**
   * Generate a new encryption key
   */
  static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Derive key from password
   */
  static async deriveKeyFromPassword(password: string, salt?: Uint8Array): Promise<{
    key: CryptoKey;
    salt: Uint8Array;
  }> {
    // Generate salt if not provided
    if (!salt) {
      salt = crypto.getRandomValues(new Uint8Array(16));
    }

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive key using PBKDF2
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.algorithm, length: this.keyLength },
      true,
      ['encrypt', 'decrypt']
    );

    return { key, salt };
  }

  /**
   * Encrypt data
   */
  static async encrypt(data: string, key: CryptoKey): Promise<{
    ciphertext: string;
    iv: string;
  }> {
    try {
      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(data);
      
      // Generate initialization vector
      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
      
      // Encrypt
      const ciphertext = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv
        },
        key,
        dataBytes
      );
      
      // Convert to base64 for storage
      return {
        ciphertext: this.arrayBufferToBase64(ciphertext),
        iv: this.arrayBufferToBase64(iv)
      };
    } catch (error) {
      logDebug('EncryptionUtils', `Encryption failed: ${error}`);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data
   */
  static async decrypt(
    ciphertext: string, 
    iv: string, 
    key: CryptoKey
  ): Promise<string> {
    try {
      const ciphertextBytes = this.base64ToArrayBuffer(ciphertext);
      const ivBytes = this.base64ToArrayBuffer(iv);
      
      // Decrypt
      const plaintext = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: ivBytes
        },
        key,
        ciphertextBytes
      );
      
      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(plaintext);
    } catch (error) {
      logDebug('EncryptionUtils', `Decryption failed: ${error}`);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypt an object
   */
  static async encryptObject(obj: any, key: CryptoKey): Promise<{
    ciphertext: string;
    iv: string;
  }> {
    const json = JSON.stringify(obj);
    return this.encrypt(json, key);
  }

  /**
   * Decrypt an object
   */
  static async decryptObject<T>(
    ciphertext: string,
    iv: string,
    key: CryptoKey
  ): Promise<T> {
    const json = await this.decrypt(ciphertext, iv, key);
    return JSON.parse(json);
  }

  /**
   * Export key for storage
   */
  static async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('jwk', key);
    return JSON.stringify(exported);
  }

  /**
   * Import key from storage
   */
  static async importKey(keyData: string): Promise<CryptoKey> {
    const jwk = JSON.parse(keyData);
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: this.algorithm,
        length: this.keyLength
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate a secure random password
   */
  static generatePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const randomValues = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(randomValues)
      .map(x => charset[x % charset.length])
      .join('');
  }

  /**
   * Hash data using SHA-256
   */
  static async hash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Check if encryption is available
   */
  static isAvailable(): boolean {
    return typeof crypto !== 'undefined' && 
           typeof crypto.subtle !== 'undefined' &&
           typeof crypto.subtle.encrypt === 'function';
  }
}