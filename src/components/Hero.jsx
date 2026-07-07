import {
  Link
} from "react-router-dom";

import heroImage
  from "../assets/hero.png";

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-text">
          <span className="eyebrow">
            Feito com carinho
          </span>

          <h1>
            Tudo para receber seu bebê
            com amor
          </h1>

          <p>
            Produtos especiais para
            transformar cada momento
            em uma lembrança inesquecível.
          </p>

          <a
            className="primary-button"
            href="#produtos"
          >
            Ver produtos
          </a>
        </div>

        <div className="hero-image">
          <img
            src={heroImage}
            alt="Enxoval para bebê"
          />
        </div>
      </div>
    </section>
  );
}