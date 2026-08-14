import {
  Link,
  NavLink,
} from "react-router";

import { useAuth }
  from "../context/AuthContext";

import { useCouple }
  from "../context/CoupleContext";


export default function Header() {
  const {
    session,
    isAdmin,
  } = useAuth();

  const {
    couple,
  } = useCouple();

  function getNavLinkClass({
    isActive,
  }) {
    return isActive
      ? "nav-link active"
      : "nav-link";
  }


  return (
    <header className="header">

      <div className="container header-content">

        {/* LOGO */}

        <Link
          className="logo"
          to="/"
        >
          <span className="logo-icon">
            💍
          </span>

          <span>
            Nosso Casamento
          </span>
        </Link>


        {/* NAVEGAÇÃO DESKTOP */}

        <nav className="nav">

          <NavLink
            to="/"
            end
            className={getNavLinkClass}
          >
            🏠 Início
          </NavLink>


          {isAdmin && (
            <NavLink
              to="/enxoval"
              className={getNavLinkClass}
            >
              🧺 Enxoval
            </NavLink>
          )}


          {isAdmin && (
            <NavLink
              to="/casamento"
              className={getNavLinkClass}
            >
              💒 Casamento
            </NavLink>
          )}


          {isAdmin && (
            <NavLink
              to="/orcamento"
              className={getNavLinkClass}
            >
              💰 Orçamento
            </NavLink>
          )}


          {isAdmin && couple?.slug && (
            <NavLink
              to={`/${couple.slug}`}
              className={getNavLinkClass}
            >
              🌐 Meu site
            </NavLink>
          )}


          <Link
            to="/admin"
            className="nav-link"
          >
            {session
              ? "👥 Casal"
              : "🔒 Área do casal"}
          </Link>

        </nav>

      </div>

    </header>
  );
}
