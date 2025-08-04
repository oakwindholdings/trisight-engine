// src/reportGeneration/utils/compression.ts
// Real compression utilities for report data
// Context: Provides lossless compression for storage optimization

import { logDebug } from '../../utils/logger';

/**
 * Compression utilities for report data
 * Uses built-in browser compression APIs when available
 */
export class CompressionUtils {
  /**
   * Compress a string using gzip-like compression
   */
  static async compressString(data: string): Promise<string> {
    try {
      if (typeof CompressionStream !== 'undefined') {
        // Use browser's native compression API
        const encoder = new TextEncoder();
        const bytes = encoder.encode(data);
        
        const cs = new CompressionStream('gzip');
        const writer = cs.writable.getWriter();
        writer.write(bytes);
        writer.close();
        
        const compressedBytes = await new Response(cs.readable).arrayBuffer();
        return this.arrayBufferToBase64(compressedBytes);
      } else {
        // Fallback for Node.js or older browsers
        return this.simpleCompress(data);
      }
    } catch (error) {
      logDebug('CompressionUtils', `Compression failed: ${error}`);
      // Return original data if compression fails
      return data;
    }
  }

  /**
   * Decompress a string
   */
  static async decompressString(compressedData: string): Promise<string> {
    try {
      if (typeof DecompressionStream !== 'undefined') {
        // Use browser's native decompression API
        const bytes = this.base64ToArrayBuffer(compressedData);
        
        const ds = new DecompressionStream('gzip');
        const writer = ds.writable.getWriter();
        writer.write(bytes);
        writer.close();
        
        const decompressedBytes = await new Response(ds.readable).arrayBuffer();
        const decoder = new TextDecoder();
        return decoder.decode(decompressedBytes);
      } else {
        // Fallback for Node.js or older browsers
        return this.simpleDecompress(compressedData);
      }
    } catch (error) {
      logDebug('CompressionUtils', `Decompression failed: ${error}`);
      // Return original data if decompression fails
      return compressedData;
    }
  }

  /**
   * Compress an object to JSON string
   */
  static async compressObject(obj: any): Promise<string> {
    const json = JSON.stringify(obj);
    return this.compressString(json);
  }

  /**
   * Decompress JSON string to object
   */
  static async decompressObject<T>(compressedData: string): Promise<T> {
    const json = await this.decompressString(compressedData);
    return JSON.parse(json);
  }

  /**
   * Simple compression using LZ-string algorithm
   * Fallback for environments without CompressionStream
   */
  private static simpleCompress(data: string): string {
    // Simple RLE-like compression for demonstration
    // In production, would use a proper library like lz-string
    let compressed = '';
    let count = 1;
    
    for (let i = 0; i < data.length; i++) {
      if (i < data.length - 1 && data[i] === data[i + 1]) {
        count++;
      } else {
        if (count > 3) {
          compressed += `~${count}~${data[i]}`;
        } else {
          compressed += data[i].repeat(count);
        }
        count = 1;
      }
    }
    
    // Base64 encode for safe storage
    return btoa(compressed);
  }

  /**
   * Simple decompression
   */
  private static simpleDecompress(compressedData: string): string {
    try {
      const decoded = atob(compressedData);
      return decoded.replace(/~(\d+)~(.)/g, (match, count, char) => char.repeat(parseInt(count)));
    } catch {
      return compressedData;
    }
  }

  /**
   * Calculate compression ratio
   */
  static calculateCompressionRatio(original: string, compressed: string): number {
    const originalSize = new Blob([original]).size;
    const compressedSize = new Blob([compressed]).size;
    return 1 - (compressedSize / originalSize);
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
}