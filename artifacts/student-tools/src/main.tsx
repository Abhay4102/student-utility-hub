import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// In production, force-redirect any non-canonical hostname (e.g. the raw
// Replit deployment URL or a stale dev-preview URL stuck in a browser's
// history) to the official treotools.in domain. Dev builds are exempt so
// previews on cnk.pike.replit.dev still work while developing.
if (import.meta.env.PROD) {
  const host = window.location.hostname;
  const isCanonical = host === "treotools.in" || host === "www.treotools.in";
  const isLocal = host === "localhost" || host === "127.0.0.1";
  if (!isCanonical && !isLocal) {
    window.location.replace(
      "https://treotools.in" +
        window.location.pathname +
        window.location.search +
        window.location.hash,
    );
  }
}

createRoot(document.getElementById("root")!).render(<App />);
