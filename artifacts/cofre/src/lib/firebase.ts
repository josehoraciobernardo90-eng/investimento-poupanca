import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyAUXSY7an0z_mbidx8y3DDDVVHaAGtS0Ak",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "investimento-poupanca.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "investimento-poupanca",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "investimento-poupanca.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "673527529570",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:673527529570:web:6eb8027566e66b1592d13b",
  databaseURL: "https://investimento-poupanca-default-rtdb.firebaseio.com",
};

// Validar configurações vitais
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Faltam variáveis de ambiente principais do Firebase (.env)!");
}

// Inicializar apenas uma vez (útil num ambiente que suporte SSR, embora seja Vite SPA)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Analytics configurado de forma segura e com tipo exportado correto
let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch((err) => {
      console.warn("Analytics não suportado ou falhou ao inicializar", err);
    });
}

const db = getFirestore(app);
const rtdb = getDatabase(app); // Ligado ao Realtime Database
const auth = getAuth(app);

export { app, analytics, db, rtdb, auth };
