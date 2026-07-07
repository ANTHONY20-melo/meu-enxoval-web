import {
  Link,
  NavLink,
} from "react-router-dom";

export default function Header() {
  return (
    <header className="header">
      <div className="container header-content">

        <Link
          className="logo"
          to="/"
        >
          <span className="logo-icon">
            💍
          </span>

          <span>
            Nosso Enxoval
          </span>
        </Link>


        <nav className="nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? "nav-link active"
                : "nav-link"
            }
          >
            🏠 Enxoval
          </NavLink>


          <NavLink
            to="/casamento"
            className={({ isActive }) =>
              isActive
                ? "nav-link active"
                : "nav-link"
            }
          >
            💒 Casamento
          </NavLink>


          <span className="couple-badge">
            ❤️ Nosso Lar
          </span>
        </nav>

      </div>
    </header>
  );
}