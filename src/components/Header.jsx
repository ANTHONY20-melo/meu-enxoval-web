import {
  Link,
  NavLink,
} from "react-router-dom";


export default function Header() {
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


          <NavLink
            to="/enxoval"
            className={getNavLinkClass}
          >
            🧺 Enxoval
          </NavLink>


          <NavLink
            to="/casamento"
            className={getNavLinkClass}
          >
            💒 Casamento
          </NavLink>


          <NavLink
            to="/orcamento"
            className={getNavLinkClass}
          >
            💰 Orçamento
          </NavLink>


          <span className="couple-badge">
            ❤️ Nosso Lar
          </span>

        </nav>

      </div>

    </header>
  );
}