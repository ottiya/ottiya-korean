import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

setBaseUrl(import.meta.env.VITE_API_BASE_URL ?? "https://workspaceapi-server-production-23bb.up.railway.app");

createRoot(document.getElementById("root")!).render(<App />);
