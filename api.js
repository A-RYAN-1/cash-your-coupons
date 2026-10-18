// The one place the app talks to the backend. Every screen calls these functions and nothing
// else, so the session (a login token kept in AsyncStorage, on the web too) lives here.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "./config";

const TOKEN_KEY = "cyc-token";

let token = null;
const listeners = new Set();

const announce = () => listeners.forEach((listener) => listener(token !== null));

async function setToken(value) {
  token = value;
  if (value) await AsyncStorage.setItem(TOKEN_KEY, value);
  else await AsyncStorage.removeItem(TOKEN_KEY);
  announce();
}

// Call once at startup: restores a saved login and tells the listeners.
export async function restoreSession() {
  token = await AsyncStorage.getItem(TOKEN_KEY);
  announce();
  return token !== null;
}

export function onSessionChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function request(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Check your connection and try again.");
  }
  if (response.status === 401 && token) {
    // The saved login expired or was revoked: drop it so the app returns to the login screen.
    await setToken(null);
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

export async function login(email, password) {
  const data = await request("/auth/login", { method: "POST", body: { email, password } });
  await setToken(data.token);
  return data.user;
}

// Creates the account and signs in, so there is no separate "now log in" step.
export async function register(email, password) {
  const data = await request("/auth/register", { method: "POST", body: { email, password } });
  await setToken(data.token);
  return data.user;
}

export const logout = () => setToken(null);

export const getProfile = () => request("/me");
export const saveProfile = (profile) => request("/me", { method: "PUT", body: profile });

// Other people's listings, soonest expiry first. With a category and/or a value, a listing
// matches when it has either one.
export function listCoupons({ category, value } = {}) {
  const params = [];
  if (category) params.push(`category=${encodeURIComponent(category)}`);
  if (value) params.push(`value=${encodeURIComponent(value)}`);
  return request(`/coupons${params.length > 0 ? `?${params.join("&")}` : ""}`);
}

export const listMyCoupons = () => request("/coupons/mine");
export const createCoupon = (coupon) => request("/coupons", { method: "POST", body: coupon });
export const withdrawCoupon = (id) => request(`/coupons/${id}`, { method: "DELETE" });
export const buyCoupon = (id) => request(`/coupons/${id}/buy`, { method: "POST" });
export const listPurchases = () => request("/purchases");
