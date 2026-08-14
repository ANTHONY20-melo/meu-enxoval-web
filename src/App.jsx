import {
  lazy,
  Suspense,
} from "react";
import {
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router";

import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileNav from "./components/MobileNav";
import AdminGuard from "./components/AdminGuard";

import "./App.css";


/*
Páginas carregadas sob demanda
(code splitting por rota).
*/

const Landing =
  lazy(() =>
    import("./pages/Landing")
  );

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

const Admin =
  lazy(() =>
    import("./pages/AdminPage")
  );

const PublicSite =
  lazy(() =>
    import("./pages/PublicSite")
  );


// Redireciona /:slug/enxoval → /:slug (o enxoval
// público do casal vive na própria raiz do slug)
function SlugEnxovalRedirect() {
  const { slug } = useParams();

  return (
    <Navigate
      to={`/${slug}`}
      replace
    />
  );
}


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

            {/*
              Rotas fixas devem vir ANTES de /:slug
              para não serem capturadas pelo parâmetro.
              (React Router v6: matching é por ordem + specificity)
            */}

            {/* Landing pública do produto */}

            <Route
              path="/"
              element={<Landing />}
            />

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/admin"
              element={<Admin />}
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

            {/* Área do casal (autenticado) */}

            <Route
              path="/enxoval"
              element={
                <AdminGuard>
                  <Home />
                </AdminGuard>
              }
            />

            <Route
              path="/casamento"
              element={
                <AdminGuard>
                  <Wedding />
                </AdminGuard>
              }
            />

            <Route
              path="/orcamento"
              element={
                <AdminGuard>
                  <Budget />
                </AdminGuard>
              }
            />

            {/* Rotas multi-casal: página pública por slug */}

            <Route
              path="/:slug"
              element={<PublicSite />}
            />

            <Route
              path="/:slug/enxoval"
              element={<SlugEnxovalRedirect />}
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
