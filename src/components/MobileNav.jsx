import { NavLink } from "react-router-dom";

export default function MobileNav() {
  return (
    <nav className="mobile-nav">

      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          isActive
            ? "mobile-nav-link active"
            : "mobile-nav-link"
        }
      >
        <span className="mobile-nav-icon">
          🏠
        </span>

        <span>
          Enxoval
        </span>
      </NavLink>


      <NavLink
        to="/casamento"
        className={({ isActive }) =>
          isActive
            ? "mobile-nav-link active"
            : "mobile-nav-link"
        }
      >
        <span className="mobile-nav-icon">
          💒
        </span>

        <span>
          Casamento
        </span>
      </NavLink>

    </nav>
  );
}