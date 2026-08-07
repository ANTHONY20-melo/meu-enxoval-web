import {
  lazy,
  Suspense,
} from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router";

import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileNav from "./components/MobileNav";

import "./App.css";


/*
Páginas carregadas sob demanda
(code splitting por rota).
*/

const Dashboard =
  lazy(() =>
    import("./pages/Dashboard")
  );

const Home =
  lazy(() =>
    import("./pages/Home")
  );

const Wedding =
  lazy(() =>
    import("./pages/Wedding")
  );

const Budget =
  lazy(() =>
    import("./pages/Budget")
  );

const Checkout =
  lazy(() =>
    import("./pages/Checkout")
  );

const Success =
  lazy(() =>
    import("./pages/Success")
  );

const Cancel =
  lazy(() =>
    import("./pages/Cancel")
  );


export default function App() {
  return (
    <div className="app">

      {/* CABEÇALHO */}

      <Header />

      {/* CONTEÚDO PRINCIPAL */}

      <div className="app-content">

        <Suspense
          fallback={
            <div className="route-loading">
              Carregando...
            </div>
          }
        >

          <Routes>

            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/enxoval"
              element={<Home />}
            />

            <Route
              path="/casamento"
              element={<Wedding />}
            />

            <Route
              path="/orcamento"
              element={<Budget />}
            />

            <Route
              path="/checkout"
              element={<Checkout />}
            />

            <Route
              path="/success"
              element={<Success />}
            />

            <Route
              path="/cancel"
              element={<Cancel />}
            />

            {/* ROTA NÃO ENCONTRADA */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/"
                  replace
                />
              }
            />

          </Routes>

        </Suspense>

      </div>

      {/* RODAPÉ */}

      <Footer />

      {/* MENU MOBILE */}

      <MobileNav />

    </div>
  );
}
