import { useEffect } from "react";
import { Link } from "react-router";

/**
 * Landing page (rota "/").
 * Tema: casamento na praia — fundo com altar/corredor,
 * pétalas animadas, tipografia cursiva e reveals on scroll.
 * Apresenta a plataforma para QUALQUER casal criar o próprio
 * site de enxoval em minutos.
 */

function useReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("reveal-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function Petals() {
  return (
    <div className="landing-petals" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="landing-petal"
          style={{
            left: `${(i * 83) % 100}%`,
            animationDelay: `${(i * 0.9) % 7}s`,
            animationDuration: `${8 + (i % 5) * 2}s`,
            fontSize: `${14 + (i % 4) * 6}px`,
          }}
        >
          🌸
        </span>
      ))}
    </div>
  );
}

export default function Landing() {
  useReveal();

  return (
    <main className="landing-page">

      {/* HERO */}

      <section className="landing-hero">
        <div
          className="landing-hero-bg"
          role="img"
          aria-label="Cerimônia de casamento na praia ao pôr do sol"
        />
        <div className="landing-hero-overlay" />
        <Petals />

        <div className="container landing-hero-inner">
          <div className="landing-hero-content">

            <span className="landing-hero-badge">
              💍 Grátis para qualquer casal
            </span>

            <p className="landing-script">
              Eles disseram sim. Agora é a sua vez.
            </p>

            <h1>
              Crie o site do seu casamento
              <span> na praia dos seus sonhos</span>
            </h1>

            <p className="landing-hero-sub">
              Site de casamento com lista de presentes,
              checklist do grande dia e orçamento — tudo
              pronto em minutos. Seus convidados reservam
              os presentes pelo link, sem cadastro.
            </p>

            <div className="landing-cta-row">
              <Link className="landing-cta-primary" to="/admin">
                Criar meu site grátis
                <span aria-hidden="true"> →</span>
              </Link>

              <Link className="landing-cta-ghost" to="/anthony-e-noiva">
                Ver exemplo
              </Link>
            </div>

            <div className="landing-hero-trust">
              <span>💝 Reserva em 1 toque</span>
              <span>🌐 Link próprio do casal</span>
              <span>📱 Funciona no celular</span>
            </div>

          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}

      <section className="landing-section">
        <div className="container">

          <div className="landing-heading reveal">
            <p className="landing-script landing-script-dark">
              Simples como dizer sim
            </p>
            <h2 className="dashboard-title">Como funciona</h2>
            <p className="landing-heading-sub">
              Da conta até o site publicado leva menos de 2 minutos.
            </p>
          </div>

          <div className="landing-steps">

            <div className="landing-step reveal">
              <div className="landing-step-number">1</div>
              <div className="landing-step-icon">👩‍❤️‍👨</div>
              <h3>Crie a conta do casal</h3>
              <p>
                Um e-mail e uma senha. O primeiro
                acesso já é o administrador do
                site do casal.
              </p>
            </div>

            <div className="landing-step reveal">
              <div className="landing-step-number">2</div>
              <div className="landing-step-icon">💒</div>
              <h3>Informe nomes e a data</h3>
              <p>
                Sua lista de enxoval, checklist
                e orçamento saem prontos do
                modelo padrão.
              </p>
            </div>

            <div className="landing-step reveal">
              <div className="landing-step-number">3</div>
              <div className="landing-step-icon">💌</div>
              <h3>Compartilhe o link</h3>
              <p>
                Os convidados reservam os presentes
                com o próprio nome — sem cadastro,
                sem senha, sem atrito.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* FEATURES */}

      <section className="landing-section landing-section-soft">
        <div className="container">

          <div className="landing-heading reveal">
            <p className="landing-script landing-script-dark">
              Tudo em um só lugar
            </p>
            <h2 className="dashboard-title">
              Tudo o que o casal precisa
            </h2>
          </div>

          <div className="dashboard-grid landing-grid">

            <div className="dashboard-card landing-card reveal">
              <div className="dashboard-card-icon">🧺</div>
              <h3>Enxoval com reservas</h3>
              <p>
                Lista completa por categoria. Convidados
                reservam o presente com o nome — sem
                conta, sem senha.
              </p>
            </div>

            <div className="dashboard-card landing-card reveal">
              <div className="dashboard-card-icon">💒</div>
              <h3>Planejamento do casamento</h3>
              <p>
                Checklist do grande dia e orçamento,
                com progresso e controle de pagamentos.
              </p>
            </div>

            <div className="dashboard-card landing-card reveal">
              <div className="dashboard-card-icon">🔗</div>
              <h3>Link público do casal</h3>
              <p>
                Cada casal ganha um endereço próprio
                para compartilhar no WhatsApp e nas redes.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* CTA FINAL */}

      <section className="landing-cta">
        <div className="landing-cta-deco" aria-hidden="true">💍</div>

        <div className="container landing-cta-inner">
          <p className="landing-script">Para sempre começa aqui</p>

          <h2 className="dashboard-title">
            Pronto para começar?
          </h2>

          <p className="landing-cta-text">
            Crie a conta do casal, informe os nomes e a
            data — o site sai no mesmo minuto.
          </p>

          <Link className="landing-cta-primary" to="/admin">
            Criar meu site grátis
            <span aria-hidden="true"> →</span>
          </Link>
        </div>
      </section>

    </main>
  );
}
