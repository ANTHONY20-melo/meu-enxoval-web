import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router";

import { useAuth }
  from "../context/AuthContext";


/**
 * Área do casal (login/logout).
 *
 * Rota /admin. Permite que cada membro do
 * casal entre com e-mail/senha e, no
 * primeiro acesso, torne-se administrador
 * (máximo 2 e-mails).
 */
export default function AdminPage() {
  const {
    session,
    isAdmin,
    authLoading,
    signIn,
    signOut,
    claimAdmin,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [formError, setFormError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);


  useEffect(() => {
    if (session) {
      setFormError("");
    }
  }, [session]);


  async function handleLogin(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setFormError(
        "Preencha e-mail e senha."
      );

      return;
    }

    try {
      setSubmitting(true);
      setFormError("");
      setSuccessMessage("");

      await signIn(
        normalizedEmail,
        password
      );

      setPassword("");
    } catch (err) {
      console.error(
        "Erro ao entrar:",
        err
      );

      setFormError(
        "E-mail ou senha incorretos."
      );
    } finally {
      setSubmitting(false);
    }
  }


  async function handleClaimAdmin() {
    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");
      setSuccessMessage("");

      const ok = await claimAdmin();

      if (ok) {
        setSuccessMessage(
          "Você agora é um dos administradores!"
        );
      } else {
        setFormError(
          "Não foi possível. Verifique se já existem 2 administradores."
        );
      }
    } catch (err) {
      console.error(
        "Erro ao reivindicar admin:",
        err
      );

      setFormError(
        "Erro inesperado. Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  }


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


  if (!session) {
    return (
      <main className="admin-page">
        <section className="admin-hero">
          <div className="container">
            <span className="checklist-label">
              🔒 Área do casal
            </span>

            <h1>
              Entre para gerenciar
            </h1>

            <p>
              Esta área é privada. Use o e-mail
              e a senha combinados.
            </p>
          </div>
        </section>

        <section className="admin-section">
          <div className="container">

            <form
              className="admin-form"
              onSubmit={handleLogin}
            >

              <label className="admin-field">
                <span>E-mail</span>

                <input
                  type="email"
                  value={email}
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="admin-field">
                <span>Senha</span>

                <input
                  type="password"
                  value={password}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                />
              </label>

              {formError && (
                <p className="admin-error">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className="admin-submit-button"
                disabled={submitting}
              >
                {submitting
                  ? "Entrando..."
                  : "Entrar"}
              </button>

            </form>

            <p className="admin-hint">
              Ainda não tem conta? No Supabase,
              vá em{" "}
              <strong>
                Authentication → Users
              </strong>{" "}
              e crie o usuário com o e-mail do
              casal (ou use a opção de criar
              conta na tela de login).
            </p>

          </div>
        </section>
      </main>
    );
  }


  return (
    <main className="admin-page">
      <section className="admin-hero">
        <div className="container">
          <span className="checklist-label">
            🔒 Área do casal
          </span>

          <h1>
            Olá, {session.user.email}!
          </h1>

          <p>
            {isAdmin
              ? "Você é um dos administradores."
              : "Você ainda não é administrador."}
          </p>
        </div>
      </section>

      <section className="admin-section">
        <div className="container">

          {formError && (
            <p className="admin-error">
              {formError}
            </p>
          )}

          {successMessage && (
            <p className="admin-success">
              {successMessage}
            </p>
          )}

          <div className="admin-actions">

            {!isAdmin && (
              <button
                type="button"
                className="admin-submit-button"
                disabled={submitting}
                onClick={handleClaimAdmin}
              >
                {submitting
                  ? "Processando..."
                  : "Tornar-me administrador"}
              </button>
            )}

            {isAdmin && (
              <Link
                className="admin-cta-button"
                to="/orcamento"
              >
                Abrir orçamento →
              </Link>
            )}

            <button
              type="button"
              className="admin-logout-button"
              disabled={submitting}
              onClick={async () => {
                await signOut();
                setEmail("");
              }}
            >
              Sair
            </button>

          </div>

        </div>
      </section>
    </main>
  );
}
