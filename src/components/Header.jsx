import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="header">
      <div className="container header-content">
        <Link
          className="logo"
          to="/"
        >
          💍 Nosso Enxoval
        </Link>

        <nav className="nav">
          <a href="#checklist">
            Checklist
          </a>

          <span className="couple-badge">
            ❤️ Nosso Lar
          </span>
        </nav>
      </div>
    </header>
  );
}