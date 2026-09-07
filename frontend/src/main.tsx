import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ClientProviders from "@shared/wrapper/ClientProviders";
import App from "./App";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "missing-client-id"}>
      <BrowserRouter>
        <ClientProviders><App /></ClientProviders>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
