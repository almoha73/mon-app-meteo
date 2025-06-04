// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAGeww9XXQb407egqrrq_uskKTjRoRzM80",
  authDomain: "monapmeteo.firebaseapp.com",
  projectId: "monapmeteo",
  storageBucket: "monapmeteo.firebasestorage.app",
  messagingSenderId: "387515434355",
  appId: "1:387515434355:web:37ca5417aab1264834b106",
  measurementId: "G-YQGTJWFLXJ"
};

// Initialiser Firebase
// Vérifie si une app existe déjà pour éviter les erreurs en HMR (Hot Module Replacement)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
