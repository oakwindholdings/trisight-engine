// src/styled.d.ts
// styled-components DefaultTheme augmentation
// Components across the app read differing theme shapes (theme.colors.*, nested palettes)
// that were never formally declared; the permissive index mirrors the untyped runtime object.

import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    [key: string]: any;
  }
}
