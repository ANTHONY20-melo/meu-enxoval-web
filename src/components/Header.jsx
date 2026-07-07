import {
  Link
} from "react-router-dom";

import {
  useCart
} from "../hooks/useCart";

export default function Header() {
  const { quantity } = useCart();

  return (
    <header className="header">
      <div className="container header-content">
        <Link
          className="logo"
          to="/"
        >
          Meu Enxoval
        </Link>

        <nav className="nav">
          <Link to="/">
            Início
          </Link>

          <a href="/#produtos">
            Produtos
          </a>

          <Link
            className="cart-link"
            to="/checkout"
          >
            Carrinho ({quantity})
          </Link>
        </nav>
      </div>
    </header>
  );
}