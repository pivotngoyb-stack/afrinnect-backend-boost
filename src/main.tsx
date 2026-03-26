import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply dark mode on initial load from saved settings
try {
  const saved = localStorage.getItem('app_settings');
  if (saved) {
    const settings = JSON.parse(saved);
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    }
  }
} catch {}

createRoot(document.getElementById("root")!).render(<App />);
