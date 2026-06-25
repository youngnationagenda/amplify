import { createRoot } from "react-dom/client";
import { configureAmplify } from "./integrations/amplify/config";
import App from "./App.tsx";
import "./index.css";

// Initialize Amplify before rendering
configureAmplify();

createRoot(document.getElementById("root")!).render(<App />);
