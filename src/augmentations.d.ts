// src/augmentations.d.ts
// TypeScript module augmentations
// Extends external libraries
/**
 * This file provides TypeScript module augmentations for external dependencies only
 */

// D3 Augmentations
declare module 'd3' {
  export * from 'd3-array';
  export * from 'd3-scale';
  export * from 'd3-selection';
  export * from 'd3-time';
  export * from 'd3-axis';
  export * from 'd3-format';
  // Shape/hierarchy members used by the report visualization engine; the sub-modules
  // aren't installed as typed deps, so declare the handful we call as untyped.
  export const pie: any;
  export const arc: any;
  export const hierarchy: any;
  export const treemap: any;
  export type PieArcDatum<T = any> = any;
}
