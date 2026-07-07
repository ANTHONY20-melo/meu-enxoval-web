import {
  Routes,
  Route
} from "react-router-dom";

import Header
  from "./components/Header";

import Footer
  from "./components/Footer";

import Home
  from "./pages/Home";

import Checkout
  from "./pages/Checkout";

import Success
  from "./pages/Success";

import Cancel
  from "./pages/Cancel";

import "./App.css";

export default function App() {
  return (
    <div className="app">
      <Header />

      <Routes>
        <Route
          path="/"
          element={<Home />}
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

      <Footer />
    </div>
  );
}