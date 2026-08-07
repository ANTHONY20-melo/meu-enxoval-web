import { Link } from "react-router";

import { useAuth }
  from "../context/AuthContext";


/**
 * Guarda de rotas privadas (Casamento e
 * Orçamento). Renderiza o conteúdo apenas
 * para o casal autenticado.
 */
export default function AdminGuard({
  children,
}) {
  const {
    session,
    isAdmin,
    authLoading,
  } = useAuth();

  if (authLoading) {
    return (
      <main className="dashboard-page">
        <div className="container">
          <div className="dashboard-loading">
            Carregando... ❤️
          </div>
        </div>
      </main>
    );
  }

  if (!session || !isAdmin) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-welcome">
          <div className="container">
            <span className="checklist-label">
              🔒 Área restrita
            </span>

            <h1>
              Acesso apenas para o casal
            </h1>

            <p>
              Esta página é privada. Entre na
              área do casal para continuar.
            </p>

            <div className="admin-cta">
              <Link
                className="admin-cta-button"
                to="/admin"
              >
                Ir para a área do casal →
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return children;
}
