import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import App from "./App";
import { applyTheme, resolveInitialTheme } from "./config/theme-mode";
import "./index.css";

(function bootstrapTheme() {
  applyTheme(resolveInitialTheme());
})();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
