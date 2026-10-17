// Creates two public demo accounts and a few demo coupons in the Firebase project named by the
// EXPO_PUBLIC_FIREBASE_* variables. Safe to run again: existing accounts are reused and only demo
// coupons that are missing (for example after the buyer bought one) are listed again. The security rules
// do not let a seller delete a listing, so the script never deletes. Run: set -a; . ./.env; set +a; node scripts/seed-demo.mjs
import { initializeApp } from "firebase/app";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore, collection, addDoc, getDocs, doc, setDoc, query, where,
} from "firebase/firestore";

const env = process.env;
const app = initializeApp({
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);

const PASSWORD = "demo-pass-123";
const SELLER = "seller-demo@cashyourcoupons.app";
const BUYER = "buyer-demo@cashyourcoupons.app";

async function signIn(email, name) {
  let cred;
  try {
    cred = await createUserWithEmailAndPassword(auth, email, PASSWORD);
  } catch (e) {
    if (e.code !== "auth/email-already-in-use") throw e;
    cred = await signInWithEmailAndPassword(auth, email, PASSWORD);
  }
  await setDoc(doc(db, "users", cred.user.uid), { name }, { merge: true });
  return cred.user;
}

const days = (n) => new Date(Date.now() + n * 86400000).toISOString();
const coupons = [
  { name: "Pizza Corner 30% off", value: 300, details: "Valid on orders above 600, dine-in and delivery", expiryDate: days(5), category: "Food" },
  { name: "Style Street 500 voucher", value: 500, details: "One use, not valid on sale items", expiryDate: days(20), category: "Clothes" },
  { name: "Weekend getaway 1000 off", value: 1000, details: "Domestic hotel bookings, two nights minimum", expiryDate: days(60), category: "Travel" },
  { name: "Gadget Hub 250 off", value: 250, details: "On accessories above 1000", expiryDate: days(12), category: "Electronics" },
  { name: "Glow Beauty 20% off", value: 200, details: "Skincare range only", expiryDate: days(3), category: "Beauty" },
];

const seller = await signIn(SELLER, "Demo Seller");
const mine = await getDocs(query(collection(db, "coupons"), where("userId", "==", seller.uid)));
const listed = new Set(mine.docs.map((d) => d.data().name));
let added = 0;
for (const c of coupons.filter((c) => !listed.has(c.name))) {
  await addDoc(collection(db, "coupons"), {
    ...c, type: "sell", userId: seller.uid, userEmail: SELLER, createdAt: new Date(),
  });
  added += 1;
}
console.log(`seller ${SELLER}: ${added} coupons added, ${coupons.length - added} already listed`);

await signIn(BUYER, "Demo Buyer");
console.log(`buyer ${BUYER} ready`);
process.exit(0);
