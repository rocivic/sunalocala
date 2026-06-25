/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_THEME?: 'new' | 'legacy';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
