import {
  StrictMode,
  Suspense,
} from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import App from "./App.jsx";

import ErrorBoundary
  from "./components/ErrorBoundary";

import { CartProvider }
  from "./context/CartContext";

import { AuthProvider }
  from "./context/AuthContext";

import { CoupleProvider }
  from "./context/CoupleContext.tsx";

import "./index.css";


/*
Suspense genérico para as rotas
carregadas de forma preguiçosa.
*/

const PageLoader = () => (
  <main className="checklist-page">
    <section className="checklist-hero">
      <div className="container">
        <span className="checklist-label">
          💍 Nosso casamento
        </span>

        <h1>
          Carregando...
        </h1>
      </div>
    </section>
  </main>
);


createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <CoupleProvider>
              <Suspense
                fallback={<PageLoader />}
              >
                <App />
              </Suspense>
            </CoupleProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
