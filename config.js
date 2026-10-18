// The backend address comes from an EXPO_PUBLIC_* environment variable (see .env.example).
// Expo inlines it at build time, and only when it is read as a literal
// `process.env.EXPO_PUBLIC_NAME`.
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("Missing EXPO_PUBLIC_API_URL. Copy .env.example to .env and fill it in.");
}

export const API_URL = apiUrl.replace(/\/+$/, "");
