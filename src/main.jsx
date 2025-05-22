import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App.jsx";
import "./index.scss";
import { AuthProvider } from "./hooks/useAuth.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>,
);
