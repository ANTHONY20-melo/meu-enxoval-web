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
    signUp,
    signOut,
    claimAdmin,
  } = useAuth();

  const [mode, setMode] = useState(
    "login"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
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


  function switchMode(nextMode) {
    setMode(nextMode);
    setFormError("");
    setSuccessMessage("");
    setPassword("");
    setConfirmPassword("");
  }


  async function handleSignup(event) {
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

    if (password.length < 6) {
      setFormError(
        "A senha deve ter pelo menos 6 caracteres."
      );

      return;
    }

    if (password !== confirmPassword) {
      setFormError(
        "As senhas não conferem."
      );

      return;
    }

    try {
      setSubmitting(true);
      setFormError("");
      setSuccessMessage("");

      const session = await signUp(
        normalizedEmail,
        password
      );

      setPassword("");
      setConfirmPassword("");

      if (session) {
        // Autoconfirm ativo: já entrou.
        setSuccessMessage(
          "Conta criada! Agora clique em \"Tornar-me administrador\" para liberar a área do casal."
        );
      } else {
        // Confirmação de e-mail ativa.
        setSuccessMessage(
          "Cadastro criado! Confirme seu e-mail pelo link que enviamos e depois entre."
        );
      }
    } catch (err) {
      console.error(
        "Erro ao criar conta:",
        err
      );

      setFormError(
        friendlySignupError(err)
      );
    } finally {
      setSubmitting(false);
    }
  }


  function friendlySignupError(err) {
    const message =
      (err?.message || "")
        .toLowerCase();

    if (
      message.includes("already registered")
    ) {
      return "Este e-mail já está cadastrado. Entre na aba \"Entrar\".";
    }

    if (
      message.includes("password should be at least")
    ) {
      return "A senha deve ter pelo menos 6 caracteres.";
    }

    if (
      message.includes("rate limit")
    ) {
      return "Muitas tentativas. Aguarde um pouco e tente de novo.";
    }

    if (
      message.includes("valid email")
    ) {
      return "Digite um e-mail válido.";
    }

    return "Não foi possível criar a conta. Tente novamente.";
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

            <div
              className="admin-tabs"
              role="tablist"
            >
              <button
                type="button"
                className={
                  mode === "login"
                    ? "admin-tab active"
                    : "admin-tab"
                }
                onClick={() =>
                  switchMode("login")
                }
              >
                Entrar
              </button>

              <button
                type="button"
                className={
                  mode === "signup"
                    ? "admin-tab active"
                    : "admin-tab"
                }
                onClick={() =>
                  switchMode("signup")
                }
              >
                Criar conta
              </button>
            </div>

            <form
              className="admin-form"
              onSubmit={
                mode === "login"
                  ? handleLogin
                  : handleSignup
              }
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
                  autoComplete={
                    mode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                  placeholder="Sua senha"
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                />
              </label>

              {mode === "signup" && (
                <label className="admin-field">
                  <span>
                    Confirmar senha
                  </span>

                  <input
                    type="password"
                    value={confirmPassword}
                    autoComplete="new-password"
                    placeholder="Repita a senha"
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                  />
                </label>
              )}

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

              <button
                type="submit"
                className="admin-submit-button"
                disabled={submitting}
              >
                {submitting
                  ? "Processando..."
                  : mode === "login"
                    ? "Entrar"
                    : "Criar conta"}
              </button>

            </form>

            <p className="admin-hint">
              {mode === "login"
                ? "Ainda não tem conta? Use a aba \"Criar conta\" para cadastrar o e-mail do casal."
                : "Crie a conta com o e-mail do casal. Depois de entrar, clique em \"Tornar-me administrador\"."}
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
