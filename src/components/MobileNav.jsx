import {
  NavLink,
} from "react-router";

import { useAuth }
  from "../context/AuthContext";

import { useCouple }
  from "../context/CoupleContext";


export default function MobileNav() {
  const {
    session,
    isAdmin,
  } = useAuth();

  const {
    couple,
  } = useCouple();

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


      {/* ENXOVAL (somente casal) */}

      {isAdmin && (
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
      )}


      {/* MEU SITE (somente casal) */}

      {isAdmin && couple?.slug && (
        <NavLink
          to={`/${couple.slug}`}
          className={getLinkClass}
        >
          <span className="mobile-bottom-icon">
            🌐
          </span>

          <span>
            Site
          </span>
        </NavLink>
      )}


      {/* CASAMENTO (somente casal) */}

      {isAdmin && (
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
      )}


      {/* ORÇAMENTO (somente casal) */}

      {isAdmin && (
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
      )}


      {/* ÁREA DO CASAL */}

      <NavLink
        to="/admin"
        className={getLinkClass}
      >
        <span className="mobile-bottom-icon">
          {session ? "👥" : "🔒"}
        </span>

        <span>
          {session ? "Casal" : "Área"}
        </span>
      </NavLink>

    </nav>
  );
}
