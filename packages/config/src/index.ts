// Shared configuration and constants

export const CONFIG = {
  APP_NAME: "Bidra",
  APP_DESCRIPTION: "Norwegian community contribution platform",
  DEFAULT_LOCALE: "no",
  SUPPORTED_LOCALES: ["no", "en"],
} as const;

export const API_CONFIG = {
  VERSION: "v1",
  PREFIX: "/api",
  TIMEOUT: 30000,
} as const;

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;