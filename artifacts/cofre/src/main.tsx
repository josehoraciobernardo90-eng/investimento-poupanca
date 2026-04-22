import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initFirebaseSync } from "./data/firebase-data";

initFirebaseSync();

createRoot(document.getElementById("root")!).render(<App />);

// 📡 REGISTRO DE SERVICE WORKER (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('Elite PWA Registered:', reg.scope);
    }).catch(err => {
      console.log('PWA Failed:', err);
    });
  });
}
