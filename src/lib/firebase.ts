// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration Firebase - utilise les variables d'environnement ou les valeurs par défaut
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAGeww9XXQb407egqrrq_uskKTjRoRzM80",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "monapmeteo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "monapmeteo",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "monapmeteo.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "387515434355",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:387515434355:web:37ca5417aab1264834b106",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-YQGTJWFLXJ"
};

// Initialiser Firebase
// Vérifie si une app existe déjà pour éviter les erreurs en HMR (Hot Module Replacement)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialiser les services Firebase
const auth = getAuth(app);
const db = getFirestore(app);

// Types pour une meilleure sécurité
export type FirebaseApp = typeof app;
export type FirebaseAuth = typeof auth;
export type FirebaseDB = typeof db;

export { app, auth, db };

// Interface pour les erreurs Firebase
interface FirebaseError {
  code: string;
  message: string;
}

// Utilitaires Firebase pour la gestion d'erreurs
export const isFirebaseError = (error: unknown): error is FirebaseError => {
  return error !== null && 
         typeof error === 'object' && 
         'code' in error && 
         'message' in error &&
         typeof (error as FirebaseError).code === 'string' && 
         typeof (error as FirebaseError).message === 'string';
};

export const getFirebaseErrorMessage = (error: unknown): string => {
  if (isFirebaseError(error)) {
    switch (error.code) {
      case 'auth/network-request-failed':
        return 'Problème de connexion réseau. Vérifiez votre connexion internet.';
      case 'firestore/unavailable':
        return 'Service temporairement indisponible. Réessayez dans quelques instants.';
      case 'firestore/permission-denied':
        return 'Permissions insuffisantes pour cette opération.';
      case 'auth/invalid-api-key':
        return 'Clé API Firebase invalide.';
      case 'auth/app-deleted':
        return 'Application Firebase supprimée.';
      default:
        return error.message;
    }
  }
  return 'Erreur Firebase inconnue.';
};