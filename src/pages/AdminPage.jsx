import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router";

import { useAuth }
  from "../context/AuthContext";

import { useCouple }
  from "../context/CoupleContext";

import { couplesService }
  from "../services/couples";

import { generateSlug }
  from "../types/couple";


/**
 * Área do casal (login/cadastro/logout).
 *
 * Rota /admin. Permite que cada membro do
 * casal crie a própria conta ou entre com
 * e-mail/senha. Os dois primeiros cadastros
 * viram administradores automaticamente.
 *
 * Também concentra a criação do site:
 * se o admin ainda não tem casal, mostra o
 * formulário "Criar meu site"; se já tem,
 * mostra o link público para compartilhar.
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

  const {
    couple,
    refreshCouple,
  } = useCouple();

  const navigate = useNavigate();

  const [mode, setMode] = useState(
    "login"
  );
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
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

  // Formulário de criação do site
  const [coupleNoiva, setCoupleNoiva] =
    useState("");

  const [coupleNoivo, setCoupleNoivo] =
    useState("");

  const [coupleDate, setCoupleDate] =
    useState("");

  const [pix, setPix] =
    useState("");

  const [creating, setCreating] =
    useState(false);

  const [createError, setCreateError] =
    useState("");


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
    setName("");
  }


  async function handleSignup(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const normalizedName =
      name.trim();

    if (!normalizedName) {
      setFormError(
        "Preencha seu nome."
      );

      return;
    }

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

      const result = await signUp(
        normalizedEmail,
        password,
        normalizedName
      );

      setPassword("");
      setConfirmPassword("");

      if (result.admin) {
        setSuccessMessage(
          "Conta criada! Você agora é um dos administradores."
        );
      } else if (result.session) {
        // Autoconfirm ativo, mas sem admin (limite).
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

    if (
      message.includes("já possui conta") ||
      message.includes("limite de 2 administradores")
    ) {
      return message;
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


  async function handleCreateSite(event) {
    event.preventDefault();

    if (creating) {
      return;
    }

    const noiva = coupleNoiva.trim();
    const noivo = coupleNoivo.trim();

    if (!noiva || !noivo) {
      setCreateError(
        "Preencha o nome da noiva e do noivo."
      );

      return;
    }

    if (!coupleDate) {
      setCreateError(
        "Informe a data do casamento."
      );

      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      const slug = generateSlug({
        noiva,
        noivo,
      });

      await couplesService.createFromTemplate({
        slug,
        coupleNames: { noiva, noivo },
        weddingDate: coupleDate,
        pixKey: pix.trim() || undefined,
      });

      await refreshCouple();

      navigate("/dashboard");
    } catch (err) {
      console.error(
        "Erro ao criar site:",
        err
      );

      setCreateError(
        friendlyCreateError(err)
      );
    } finally {
      setCreating(false);
    }
  }


  function friendlyCreateError(err) {
    const message =
      (err?.message || "")
        .toLowerCase();

    if (
      message.includes("duplicate") ||
      message.includes("slug")
    ) {
      return "Este endereço já está em uso. Tente nomes diferentes.";
    }

    return "Não foi possível criar o site. Tente novamente.";
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
              {mode === "login"
                ? "Entre para gerenciar"
                : "Crie a conta do casal"}
            </h1>

            <p>
              {mode === "login"
                ? "Esta área é privada. Use o e-mail e a senha combinados."
                : "Os dois primeiros cadastros viram administradores automaticamente."}
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

              {mode === "signup" && (
                <label className="admin-field">
                  <span>Nome</span>

                  <input
                    type="text"
                    value={name}
                    autoComplete="name"
                    placeholder="Seu nome"
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                  />
                </label>
              )}

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


  function getDisplayName(user) {
    const fullName =
      user?.user_metadata?.full_name
        ?.trim();

    if (fullName) {
      return fullName;
    }

    // Fallback para contas antigas:
    // usa a parte antes do @ do e-mail.
    const userEmail =
      user?.email || "";

    return (
      userEmail.split("@")[0] ||
      userEmail
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
            Olá, {getDisplayName(session.user)}!
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

            {isAdmin && !couple && (
              <div className="admin-create-site">

                <h3>
                  🌐 Crie seu site de casamento
                </h3>

                <p>
                  Seu site sai na hora: lista de
                  presentes pronta, link público
                  para os convidados e painel de
                  reservas.
                </p>

                <form
                  className="admin-form"
                  onSubmit={handleCreateSite}
                >

                  <label className="admin-field">
                    <span>Nome da noiva</span>

                    <input
                      type="text"
                      value={coupleNoiva}
                      placeholder="Ex: Ana"
                      onChange={(event) =>
                        setCoupleNoiva(
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label className="admin-field">
                    <span>Nome do noivo</span>

                    <input
                      type="text"
                      value={coupleNoivo}
                      placeholder="Ex: Pedro"
                      onChange={(event) =>
                        setCoupleNoivo(
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label className="admin-field">
                    <span>Data do casamento</span>

                    <input
                      type="date"
                      value={coupleDate}
                      onChange={(event) =>
                        setCoupleDate(
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label className="admin-field">
                    <span>
                      Chave PIX (opcional)
                    </span>

                    <input
                      type="text"
                      value={pix}
                      placeholder="Chave para contribuições"
                      onChange={(event) =>
                        setPix(
                          event.target.value
                        )
                      }
                    />
                  </label>

                  {createError && (
                    <p className="admin-error">
                      {createError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="admin-submit-button"
                    disabled={creating}
                  >
                    {creating
                      ? "Criando..."
                      : "Criar meu site"}
                  </button>

                </form>

              </div>
            )}

            {isAdmin && couple && (
              <div className="admin-site-ready">

                <h3>
                  🌐 Seu site está no ar!
                </h3>

                <p>
                  Compartilhe este link com os
                  convidados:
                </p>

                <a
                  className="admin-site-link"
                  href={`/${couple.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {window.location.origin}
                  /{couple.slug}
                </a>

                <div className="admin-site-actions">

                  <Link
                    className="admin-cta-button"
                    to="/dashboard"
                  >
                    Abrir painel →
                  </Link>

                  <Link
                    className="admin-cta-button"
                    to="/enxoval"
                  >
                    Editar enxoval →
                  </Link>

                </div>

              </div>
            )}

            <button
              type="button"
              className="admin-logout-button"
              disabled={submitting}
              onClick={async () => {
                await signOut();
                setEmail("");
                setMode("login");
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
