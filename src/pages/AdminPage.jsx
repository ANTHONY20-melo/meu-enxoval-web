import {
  useEffect,
  useState,
} from "react";

import { Link }
  from "react-router";

import { useAuth }
  from "../context/AuthContext";

import { useCouple }
  from "../context/CoupleContext";

import { couplesService }
  from "../services/couples";

import { platformService }
  from "../services/platform";

import { generateSlug }
  from "../types/couple";


/**
 * Área do casal (login/cadastro/logout) + painel do
 * dono da plataforma.
 *
 * Rota /admin.
 *
 * - Sem sessão: login/cadastro. Qualquer conta criada
 *   pode criar o PRÓPRIO site de casamento (self-service).
 * - Logado sem casal: formulário "Criar meu site" — o
 *   primeiro que criar o site vira o dono (admin) do casal.
 * - Admin (dono de um casal): mostra o link público do site.
 * - Super admin (Anthony): painel de gestão — lista quem
 *   acessa a plataforma, cria o site DE OUTRO usuário e
 *   concede/revoga a permissão de admin (dono) por casal.
 */
export default function AdminPage() {
  const {
    session,
    isAdmin,
    isSuperAdmin,
    authLoading,
    signIn,
    signUp,
    signOut,
  } = useAuth();

  const {
    couple,
    refreshCouple,
  } = useCouple();

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

  // Painel de gestão (super admin)
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] =
    useState(false);
  const [usersError, setUsersError] =
    useState("");
  const [panelMessage, setPanelMessage] =
    useState("");
  const [panelError, setPanelError] =
    useState("");

  // Formulário de criação do site (super admin cria para um usuário)
  const [selectedUserId, setSelectedUserId] =
    useState("");
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


  // Carrega a lista de usuários quando o super admin abre o painel
  useEffect(() => {
    if (!session || !isSuperAdmin) {
      return;
    }

    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isSuperAdmin]);


  async function loadUsers() {
    setLoadingUsers(true);
    setUsersError("");

    try {
      const list = await platformService.listUsers();
      setUsers(list);

      // Seleciona o primeiro usuário sem casal por padrão
      const firstFree =
        list.find((u) => !u.couple_id);

      if (firstFree) {
        setSelectedUserId(firstFree.user_id);
      }
    } catch (err) {
      console.error(
        "Erro ao carregar usuários:",
        err
      );

      setUsersError(
        "Não foi possível carregar os usuários. Verifique se o SQL atualizado foi aplicado."
      );
    } finally {
      setLoadingUsers(false);
    }
  }


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

      if (result.session) {
        setSuccessMessage(
          "Conta criada! Agora crie o site do casal com nomes e data."
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


  async function handleCreateSite(event) {
    event.preventDefault();

    if (creating) {
      return;
    }

    if (!selectedUserId) {
      setCreateError(
        "Selecione o usuário que será o dono do site."
      );

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
      setPanelMessage("");
      setPanelError("");

      const slug = generateSlug({
        noiva,
        noivo,
      });

      await couplesService.createFromTemplate({
        slug,
        coupleNames: { noiva, noivo },
        weddingDate: coupleDate,
        pixKey: pix.trim() || undefined,
        ownerUserId: selectedUserId,
      });

      const selected =
        users.find(
          (u) => u.user_id === selectedUserId
        );

      setPanelMessage(
        `Site criado para ${selected?.email ?? "o usuário"}! Ele agora pode entrar na área do casal.`
      );

      setCoupleNoiva("");
      setCoupleNoivo("");
      setCoupleDate("");
      setPix("");

      await loadUsers();

      // Se o admin atual (super) ainda não tinha casal próprio,
      // recarrega o casal do contexto
      await refreshCouple();
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

    if (
      message.includes("sem permissão")
    ) {
      return "Você não tem permissão para criar sites.";
    }

    return "Não foi possível criar o site. Tente novamente.";
  }


  // SELF-SERVICE: o próprio usuário logado cria o site dele.
  // (ownerUserId fica SEM valor → o RPC usa auth.uid()).
  async function handleCreateOwnSite(event) {
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
      setPanelMessage("");

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

      // O site nasce com o dono = usuário logado:
      // o contexto carrega o casal na hora.
      await refreshCouple();

      setSuccessMessage(
        "Site criado! Agora é só compartilhar o link com os convidados."
      );
    } catch (err) {
      console.error(
        "Erro ao criar seu site:",
        err
      );

      setCreateError(
        friendlyCreateError(err)
      );
    } finally {
      setCreating(false);
    }
  }


  async function handleSetOwner(userId, coupleId) {
    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setPanelError("");
      setPanelMessage("");

      const ok = await platformService.setCoupleOwner(
        userId,
        coupleId
      );

      if (ok) {
        setPanelMessage(
          "Permissão de admin concedida para o casal!"
        );

        await loadUsers();
      } else {
        setPanelError(
          "Não foi possível conceder a permissão."
        );
      }
    } catch (err) {
      console.error(
        "Erro ao definir dono:",
        err
      );

      setPanelError(
        "Erro inesperado ao definir o dono."
      );
    } finally {
      setSubmitting(false);
    }
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
                : "Crie a conta com o e-mail do casal e depois crie o site na hora — sem esperar aprovação."}
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
                : "Depois do cadastro, você mesmo cria o site do casal em segundos — sem esperar ninguém."}
            </p>

          </div>
        </section>
      </main>
    );
  }


  // Painel do super admin: gestão de usuários e casais
  if (isSuperAdmin) {
    return (
      <main className="admin-page">
        <section className="admin-hero">
          <div className="container">
            <span className="checklist-label">
              🔒 Administração da plataforma
            </span>

            <h1>
              Olá, {getDisplayName(session.user)}!
            </h1>

            <p>
              Você é o administrador da plataforma.
              Aqui você controla quem acessa o site
              e concede a permissão de admin por casal.
            </p>
          </div>
        </section>

        <section className="admin-section">
          <div className="container">

            {panelMessage && (
              <p className="admin-success">
                {panelMessage}
              </p>
            )}

            {panelError && (
              <p className="admin-error">
                {panelError}
              </p>
            )}

            {usersError && (
              <p className="admin-error">
                {usersError}
              </p>
            )}

            <div className="admin-panel">

              <h3>
                👥 Usuários que acessam o site
              </h3>

              {loadingUsers ? (
                <p className="admin-hint">
                  Carregando usuários...
                </p>
              ) : users.length === 0 ? (
                <p className="admin-hint">
                  Nenhum usuário cadastrado ainda.
                </p>
              ) : (
                <div className="admin-user-list">

                  {users.map((u) => {
                    const coupleLabel =
                      u.couple_names
                        ? `${u.couple_names.noiva} & ${u.couple_names.noivo}`
                        : null;

                    return (
                      <div
                        key={u.user_id}
                        className="admin-user-row"
                      >

                        <div className="admin-user-info">
                          <strong>
                            {u.full_name ||
                              u.email}
                          </strong>

                          <span>
                            {u.email}
                          </span>

                          {coupleLabel ? (
                            <span className="admin-user-couple">
                              💍 {coupleLabel}
                              {u.couple_slug
                                ? ` (/${u.couple_slug})`
                                : ""}
                            </span>
                          ) : (
                            <span className="admin-user-couple muted">
                              Sem casal ainda
                            </span>
                          )}
                        </div>

                        <div className="admin-user-actions">
                          {!u.couple_id ? (
                            <button
                              type="button"
                              className="admin-btn-small"
                              onClick={() => {
                                setSelectedUserId(
                                  u.user_id
                                );
                                setCreateError("");
                                setPanelError("");
                              }}
                            >
                              ➕ Criar site
                            </button>
                          ) : u.is_owner ? (
                            <span className="admin-badge">
                              👑 Dono
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="admin-btn-small"
                              disabled={submitting}
                              onClick={() =>
                                handleSetOwner(
                                  u.user_id,
                                  u.couple_id
                                )
                              }
                            >
                              👑 Tornar dono
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}

                </div>
              )}

              {/* Formulário: criar site para um usuário */}
              {users.filter((u) => !u.couple_id)
                .length > 0 && (
                <div className="admin-create-site">
                  <h3>
                    🌐 Criar site para um usuário
                  </h3>

                  <form
                    className="admin-form"
                    onSubmit={handleCreateSite}
                  >

                    <label className="admin-field">
                      <span>Usuário dono do site</span>

                      <select
                        value={selectedUserId}
                        onChange={(event) => {
                          setSelectedUserId(
                            event.target.value
                          );
                          setCreateError("");
                        }}
                      >
                        {users
                          .filter((u) => !u.couple_id)
                          .map((u) => (
                            <option
                              key={u.user_id}
                              value={u.user_id}
                            >
                              {u.full_name || u.email} — {u.email}
                            </option>
                          ))}
                      </select>
                    </label>

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
                        : "Criar site do casal"}
                    </button>

                  </form>
                </div>
              )}

            </div>

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
        </section>
      </main>
    );
  }


  // Usuário logado sem casal: cria o PRÓPRIO site (self-service).
  // O primeiro que criar o site vira o dono (admin) do casal.
  if (!isAdmin || !couple) {
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
              Crie o site do casal agora mesmo:
              informe os nomes e a data — a lista de
              enxoval, o checklist e o orçamento saem
              prontos. Você é o administrador do site.
            </p>
          </div>
        </section>

        <section className="admin-section">
          <div className="container">

            {successMessage && (
              <p className="admin-success">
                {successMessage}
              </p>
            )}

            <div className="admin-create-site">
              <h3>
                🌐 Criar meu site de casamento
              </h3>

              <form
                className="admin-form"
                onSubmit={handleCreateOwnSite}
              >

                <div className="admin-form-row">
                  <label className="admin-field">
                    <span>Nome da noiva</span>

                    <input
                      type="text"
                      value={coupleNoiva}
                      autoComplete="off"
                      placeholder="Ex: Ana"
                      onChange={(event) => {
                        setCoupleNoiva(
                          event.target.value
                        );
                        setCreateError("");
                      }}
                    />
                  </label>

                  <label className="admin-field">
                    <span>Nome do noivo</span>

                    <input
                      type="text"
                      value={coupleNoivo}
                      autoComplete="off"
                      placeholder="Ex: Pedro"
                      onChange={(event) => {
                        setCoupleNoivo(
                          event.target.value
                        );
                        setCreateError("");
                      }}
                    />
                  </label>
                </div>

                <label className="admin-field">
                  <span>Data do casamento</span>

                  <input
                    type="date"
                    value={coupleDate}
                    onChange={(event) => {
                      setCoupleDate(
                        event.target.value
                      );
                      setCreateError("");
                    }}
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
                    ? "Criando site..."
                    : "Criar meu site grátis"}
                </button>

                <p className="admin-hint">
                  Você poderá editar a lista de presentes,
                  o checklist e o orçamento no painel.
                </p>
              </form>
            </div>

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
        </section>
      </main>
    );
  }


  // Admin (dono do casal) com site pronto
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
              ? "Você é o administrador do site do casal."
              : "Você ainda não é administrador."}
          </p>
        </div>
      </section>

      <section className="admin-section">
        <div className="container">

          <div className="admin-actions">

            {couple && (
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
