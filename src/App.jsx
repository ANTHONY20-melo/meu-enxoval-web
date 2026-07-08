import {
  Routes,
  Route,
} from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileNav from "./components/MobileNav";

import Home from "./pages/Home";
import Wedding from "./pages/Wedding";
import Checkout from "./pages/Checkout";
import Success from "./pages/Success";
import Cancel from "./pages/Cancel";

import "./App.css";

export default function App() {
  return (
    <div className="app">
      <Header />

      <div className="app-content">
        <Routes>
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/casamento"
            element={<Wedding />}
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
        </Routes>
      </div>

      <Footer />

      <MobileNav />
    </div>
  );
}