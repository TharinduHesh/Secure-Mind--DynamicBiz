// web/src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth, setPersistence,
  browserLocalPersistence, browserSessionPersistence,
  sendEmailVerification, applyActionCode, checkActionCode
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getStorage } from "firebase/storage";

const required = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const missing = required.filter(k => !import.meta.env[k]);
if (missing.length) {
  throw new Error(`Missing Firebase env vars: ${missing.join(", ")}.
Create a .env file in /web with these keys (see .env.example).`);
}

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(cfg);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export function setAuthPersistence(remember) {
  return setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
}

const useEmu = (import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true");
if (useEmu) {
  const { connectAuthEmulator } = await import("firebase/auth");
  const { connectFirestoreEmulator } = await import("firebase/firestore");
  const { connectStorageEmulator } = await import("firebase/storage");
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "localhost", 8080);
  connectStorageEmulator(storage, "localhost", 9199);
  connectFunctionsEmulator(functions, "localhost", 5001);
}

import { httpsCallable } from "firebase/functions";
export const callCompleteRegistration = httpsCallable(functions, "completeRegistration");

let apiBase = (import.meta.env.VITE_FUNCTIONS_URL || "");
const projectIdForUrl = cfg.projectId;
const useEmuFlag = (import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true");
if (!apiBase) {
  if (useEmuFlag) {
    apiBase = `http://localhost:5001/${projectIdForUrl}/us-central1`;
  } else {
    apiBase = `https://us-central1-${projectIdForUrl}.cloudfunctions.net`;
  }
}

async function postJson(path, body) {
  const url = `${apiBase}/${path}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data?.error || "Request failed");
  return data;
}

export async function requestEmailOtp(email) {
  return postJson("requestEmailOtp", { email });
}

export async function verifyEmailOtp(email, code, remember) {
  return postJson("verifyEmailOtp", { email, code, remember: !!remember });
}

export async function checkRememberOtp(email, token) {
  return postJson("checkRememberOtp", { email, token });
}

const REMEMBER_KEY = "sm_mfa_remember";

export function getRememberRecord() {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    if (!raw) return null;
    const rec = JSON.parse(raw);
    if (!rec || !rec.email || !rec.token || !rec.expiresAt) return null;
    if (Date.now() > rec.expiresAt) {
      localStorage.removeItem(REMEMBER_KEY);
      return null;
    }
    return rec;
  } catch {
    return null;
  }
}

export function setRememberRecord(email, token, expiresAtMs) {
  const rec = { email, token, expiresAt: expiresAtMs };
  localStorage.setItem(REMEMBER_KEY, JSON.stringify(rec));
}

export function clearRememberRecord() {
  localStorage.removeItem(REMEMBER_KEY);
}

export async function getRoleClaim() {
  const u = auth.currentUser;
  if (!u) return null;
  const tok = await u.getIdTokenResult(true);
  return tok.claims?.role || null;
}

export const resetAction = {
  url: `${window.location.origin}/forgot`,
  handleCodeInApp: true,
};

export const verifyEmailAction = {
  url: `${window.location.origin}/verify-email`,
  handleCodeInApp: true,
};

export function isEmailVerified(user) {
  return user && user.emailVerified;
}

export async function sendVerificationEmail(user) {
  if (!user) throw new Error('No user provided');
  return sendEmailVerification(user, verifyEmailAction);
}

export async function verifyEmailWithCode(actionCode) {
  return applyActionCode(auth, actionCode);
}

export async function checkEmailVerificationCode(actionCode) {
  return checkActionCode(auth, actionCode);
}