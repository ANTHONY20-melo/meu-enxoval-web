import {
  NavLink,
} from "react-router-dom";


export default function MobileNav() {
  function getLinkClass({
    isActive,
  }) {
    return isActive
      ? "mobile-bottom-link active"
      : "mobile-bottom-link";
  }


  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Navegação principal"
    >

      {/* INÍCIO */}

      <NavLink
        to="/"
        end
        className={getLinkClass}
      >
        <span className="mobile-bottom-icon">
          🏠
        </span>

        <span>
          Início
        </span>
      </NavLink>


      {/* ENXOVAL */}

      <NavLink
        to="/enxoval"
        className={getLinkClass}
      >
        <span className="mobile-bottom-icon">
          🧺
        </span>

        <span>
          Enxoval
        </span>
      </NavLink>


      {/* CASAMENTO */}

      <NavLink
        to="/casamento"
        className={getLinkClass}
      >
        <span className="mobile-bottom-icon">
          💒
        </span>

        <span>
          Casamento
        </span>
      </NavLink>


      {/* ORÇAMENTO */}

      <NavLink
        to="/orcamento"
        className={getLinkClass}
      >
        <span className="mobile-bottom-icon">
          💰
        </span>

        <span>
          Orçamento
        </span>
      </NavLink>

    </nav>
  );
}