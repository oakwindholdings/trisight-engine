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

// Window flags — double-fire guard for toolbar PDF generation (App.tsx / TopNav.tsx)
interface Window {
  __trisightGeneratingPdf?: boolean;
}

// Compression Streams API — present in modern browsers but absent from TS 4.9's lib.dom.
// compression.ts guards every use with a typeof check.
declare const CompressionStream: any;
declare const DecompressionStream: any;
