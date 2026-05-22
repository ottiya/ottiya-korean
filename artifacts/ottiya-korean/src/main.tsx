// Architecture: frontend is hosted on Vercel, API server on Railway.
// setBaseUrl points all API calls at the Railway origin so they don't hit Vercel.
// All API calls MUST use customFetch or the generated API client hooks — never raw
// fetch with relative /api/ URLs, which would target the wrong host in production.
import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

setBaseUrl(import.meta.env.VITE_API_BASE_URL ?? "https://workspaceapi-server-production-23bb.up.railway.app");

createRoot(document.getElementById("root")!).render(<App />);
