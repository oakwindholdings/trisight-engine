// src/types/global.d.ts
// global.d
// TriSight source file


// D3 type declarations
declare module 'd3-scale' {
  export interface ScaleTime<Range, Output> {
    (value: Date): Output;
    domain(): Date[];
    domain(domain: Date[]): this;
    range(): Range[];
    range(range: Range[]): this;
    nice(): this;
    copy(): this;
    ticks(count?: number): Date[];
    tickFormat(count?: number, specifier?: string): (date: Date) => string;
  }
  
  export function scaleTime<Range, Output>(): ScaleTime<Range, Output>;
}

// Feedback component declarations
// These declarations are now handled in feedback-components.d.ts
// Removing declarations here to avoid duplicate identifier conflicts
