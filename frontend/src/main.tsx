import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ShopProvider } from "./context/ShopContext";
import { ToastProvider } from "./context/ToastContext";
import { SettingsProvider } from "./context/SettingsContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <SettingsProvider>
          <ToastProvider>
            <ShopProvider>
              <App />
            </ShopProvider>
          </ToastProvider>
        </SettingsProvider>
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>
);
