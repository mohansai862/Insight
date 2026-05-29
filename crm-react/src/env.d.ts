interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // add other environment variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
