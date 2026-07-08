import { NavLink } from "react-router-dom";

export default function MobileNav() {
  return (
    <nav className="mobile-bottom-nav">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          isActive
            ? "mobile-bottom-link active"
            : "mobile-bottom-link"
        }
      >
        <span className="mobile-bottom-icon">
          🏠
        </span>

        <span>Enxoval</span>
      </NavLink>

      <NavLink
        to="/casamento"
        className={({ isActive }) =>
          isActive
            ? "mobile-bottom-link active"
            : "mobile-bottom-link"
        }
      >
        <span className="mobile-bottom-icon">
          💒
        </span>

        <span>Casamento</span>
      </NavLink>
    </nav>
  );
}