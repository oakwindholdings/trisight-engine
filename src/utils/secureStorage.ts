// src/utils/secureStorage.ts
// Secure storage utility for sensitive data
// Implements encryption and expiration handling

import { logDebug } from './debug';

// Simple XOR encryption for client-side obfuscation
// Note: This is NOT cryptographically secure - use server-side storage for truly sensitive data
class SecureStorage {
  private readonly prefix = 'trisight_secure_';
  private readonly salt = 'trisight_2024_pattern_feedback';
  
  /**
   * Simple obfuscation to prevent casual inspection
   */
  private obfuscate(data: string): string {
    const key = this.salt;
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result); // Base64 encode
  }
  
  /**
   * Deobfuscate data
   */
  private deobfuscate(data: string): string {
    try {
      const decoded = atob(data); // Base64 decode
      const key = this.salt;
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch {
      return '';
    }
  }
  
  /**
   * Store data securely with optional expiration
   */
  public setItem(key: string, value: any, expirationMinutes?: number): void {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        expiration: expirationMinutes ? Date.now() + (expirationMinutes * 60 * 1000) : null
      };
      
      const serialized = JSON.stringify(data);
      const obfuscated = this.obfuscate(serialized);
      
      localStorage.setItem(this.prefix + key, obfuscated);
      
      logDebug('secureStorage', 'Stored secure item', { key, hasExpiration: !!expirationMinutes });
    } catch (error) {
      logDebug('secureStorage', 'Error storing secure item', { key, error });
    }
  }
  
  /**
   * Retrieve data from secure storage
   */
  public getItem<T = any>(key: string): T | null {
    try {
      const obfuscated = localStorage.getItem(this.prefix + key);
      if (!obfuscated) return null;
      
      const serialized = this.deobfuscate(obfuscated);
      if (!serialized) return null;
      
      const data = JSON.parse(serialized);
      
      // Check expiration
      if (data.expiration && Date.now() > data.expiration) {
        this.removeItem(key);
        logDebug('secureStorage', 'Item expired and removed', { key });
        return null;
      }
      
      return data.value;
    } catch (error) {
      logDebug('secureStorage', 'Error retrieving secure item', { key, error });
      return null;
    }
  }
  
  /**
   * Remove item from secure storage
   */
  public removeItem(key: string): void {
    localStorage.removeItem(this.prefix + key);
    logDebug('secureStorage', 'Removed secure item', { key });
  }
  
  /**
   * Clear all secure storage items
   */
  public clear(): void {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
    keys.forEach(key => localStorage.removeItem(key));
    logDebug('secureStorage', 'Cleared all secure items', { count: keys.length });
  }
  
  /**
   * Check if an item exists and is not expired
   */
  public hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }
  
  /**
   * Get all keys in secure storage
   */
  public getAllKeys(): string[] {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(this.prefix))
      .map(k => k.substring(this.prefix.length));
  }
  
  /**
   * Clean up expired items
   */
  public cleanupExpired(): number {
    let cleanedCount = 0;
    const keys = this.getAllKeys();
    
    keys.forEach(key => {
      try {
        const obfuscated = localStorage.getItem(this.prefix + key);
        if (obfuscated) {
          const serialized = this.deobfuscate(obfuscated);
          const data = JSON.parse(serialized);
          
          if (data.expiration && Date.now() > data.expiration) {
            this.removeItem(key);
            cleanedCount++;
          }
        }
      } catch {
        // Invalid data, remove it
        this.removeItem(key);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      logDebug('secureStorage', 'Cleaned up expired items', { count: cleanedCount });
    }
    
    return cleanedCount;
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();

// Auto-cleanup expired items on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    secureStorage.cleanupExpired();
  });
} 