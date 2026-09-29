/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
  // Ajoute ici tes autres variables si besoin (ex: VITE_ALLOWED_USERS: string)
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}