import {
  Routes,
  Route,
} from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Wedding from "./pages/Wedding";

import "./App.css";

export default function App() {
  return (
    <div className="app">
      <Header />

      <main className="app-content">
        <Routes>
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/casamento"
            element={<Wedding />}
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}