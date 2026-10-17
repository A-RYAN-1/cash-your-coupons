import { initializeApp } from "firebase/app";
// getReactNativePersistence exists only in the React Native build of firebase/auth, so the web-typed lint resolver cannot see it.
// eslint-disable-next-line import/named
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { firebaseConfig } from "./config";

const app = initializeApp(firebaseConfig);

// Keep the signed-in user between app launches.
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

const db = getFirestore(app);

export { auth, db };
