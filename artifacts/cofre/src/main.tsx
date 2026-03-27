import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initFirebaseSync } from "./data/firebase-data";

initFirebaseSync();

createRoot(document.getElementById("root")!).render(<App />);
