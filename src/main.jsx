import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./globals.css";
import "./styles/breakpoints.css";
import { probeCodecs } from "./utils/codecCapabilities.js";

async function bootstrap() {
  await probeCodecs();
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode>
  );
}

void bootstrap();
