// Every Firebase value comes from an EXPO_PUBLIC_* environment variable (see .env.example).
// Expo inlines these at build time, and only when each one is read as a literal
// `process.env.EXPO_PUBLIC_NAME`, so they are listed one by one instead of in a loop.
const values = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const missing = Object.keys(values).filter((key) => !values[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing Firebase settings: ${missing.join(", ")}. Copy .env.example to .env and fill it in.`
  );
}

export const firebaseConfig = values;
