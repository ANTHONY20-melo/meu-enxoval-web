import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileNav from "./components/MobileNav";

import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Wedding from "./pages/Wedding";
import Budget from "./pages/Budget";

import Checkout from "./pages/Checkout";
import Success from "./pages/Success";
import Cancel from "./pages/Cancel";

import "./App.css";


export default function App() {
  return (
    <div className="app">

      {/* CABEÇALHO */}

      <Header />


      {/* CONTEÚDO PRINCIPAL */}

      <div className="app-content">

        <Routes>

          {/* DASHBOARD */}

          <Route
            path="/"
            element={<Dashboard />}
          />


          {/* ENXOVAL */}

          <Route
            path="/enxoval"
            element={<Home />}
          />


          {/* CASAMENTO */}

          <Route
            path="/casamento"
            element={<Wedding />}
          />


          {/* ORÇAMENTO */}

          <Route
            path="/orcamento"
            element={<Budget />}
          />


          {/* PAGAMENTO */}

          <Route
            path="/checkout"
            element={<Checkout />}
          />


          {/* PAGAMENTO APROVADO */}

          <Route
            path="/success"
            element={<Success />}
          />


          {/* PAGAMENTO CANCELADO */}

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

      </div>


      {/* RODAPÉ */}

      <Footer />


      {/* MENU MOBILE */}

      <MobileNav />

    </div>
  );
}