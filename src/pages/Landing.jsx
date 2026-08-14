import {
  Link,
} from "react-router";


/**
 * Landing page (rota "/").
 *
 * Apresenta o produto: site de casamento
 * com lista de presentes, para qualquer
 * casal criar o próprio site em segundos.
 */
export default function Landing() {
  return (
    <main className="landing-page">

      {/* HERO */}

      <section className="hero landing-hero">

        <div className="container">

          <div className="landing-hero-inner">

            <div>

              <span className="eyebrow">
                💍 Lista de casamento online
              </span>

              <h1>
                Seu site de casamento
                com lista de presentes
                pronta em minutos.
              </h1>

              <p>
                Crie o site do seu casal, convide
                seus amigos pelo link e deixe que
                eles reservem os presentes com o
                nome de cada um — sem cadastro.
              </p>

              <div className="landing-cta-row">

                <Link
                  className="admin-submit-button"
                  to="/admin"
                >
                  Criar meu site grátis
                </Link>

                <Link
                  className="landing-link-secondary"
                  to="/anthony-e-noiva"
                >
                  Ver exemplo →
                </Link>

              </div>

            </div>

            <div className="landing-hero-card">

              <span className="landing-hero-emoji">
                🎁
              </span>

              <p>
                Cada convidado escolhe o presente
                e escreve o próprio nome. O casal
                acompanha tudo no painel.
              </p>

              <div className="landing-hero-note">
                Sem cadastro para os convidados ·
                reserva em 1 toque
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* FEATURES */}

      <section className="landing-section">

        <div className="container">

          <h2 className="dashboard-title">
            Tudo o que o casal precisa
          </h2>

          <div className="dashboard-grid landing-grid">

            <div className="dashboard-card landing-card">

              <div className="dashboard-card-icon">
                🧺
              </div>

              <h3>
                Enxoval com reservas
              </h3>

              <p>
                Lista completa por categoria.
                Convidados reservam o presente
                com o nome — sem conta, sem
                senha, sem atrito.
              </p>

            </div>

            <div className="dashboard-card landing-card">

              <div className="dashboard-card-icon">
                💒
              </div>

              <h3>
                Planejamento do casamento
              </h3>

              <p>
                Checklist do grande dia e do
                orçamento, com progresso e
                controle de pagamentos.
              </p>

            </div>

            <div className="dashboard-card landing-card">

              <div className="dashboard-card-icon">
                🔗
              </div>

              <h3>
                Link público do casal
              </h3>

              <p>
                Cada casal ganha um endereço
                próprio para compartilhar no
                WhatsApp e nas redes.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* CTA FINAL */}

      <section className="landing-section landing-cta">

        <div className="container">

          <h2 className="dashboard-title">
            Pronto para começar?
          </h2>

          <p className="landing-cta-text">
            Crie a conta do casal, informe os
            nomes e a data — o site sai no
            mesmo minuto.
          </p>

          <Link
            className="admin-submit-button"
            to="/admin"
          >
            Criar meu site grátis
          </Link>

        </div>

      </section>

    </main>
  );
}
