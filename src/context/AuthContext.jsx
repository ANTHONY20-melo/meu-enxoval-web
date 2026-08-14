import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "../services/supabase";


/*
Contexto de autenticação do casal.

Controla a sessão do Supabase Auth e informa:
- session, user, authLoading
- isAdmin (super admin OU dono de um casal)
- isSuperAdmin (e-mail cadastrado em admin_emails = dono da plataforma)
- coupleId (do JWT claim `couple_id` ou fallback)

Auto-promoção controlada: o self-service (primeiro acesso) cria o
próprio site e vira dono; o super admin concede/revoga para terceiros.

O coupleId vem PRIMEIRO do app_metadata do JWT (configurado pelo
webhook da migration 006). Se o webhook não estiver ativo, cai para
uma subquery no banco (current_user_couple_id).
*/

const AuthContext = createContext({
  session: null,
  user: null,
  isAdmin: false,
  isSuperAdmin: false,
  authLoading: true,
  coupleId: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});


export function AuthProvider({ children }) {
  const [session, setSession] =
    useState(null);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [isSuperAdmin, setIsSuperAdmin] =
    useState(false);

  const [authLoading, setAuthLoading] =
    useState(true);

  // Evita consultar as RPCs de permissão repetidamente
  // para o mesmo e-mail (bootstrap + evento INITIAL_SESSION
  // disparam em sequência).
  const lastCheckedEmail =
    useRef(null);

  const [coupleId, setCoupleId] =
    useState(null);


  function extractCoupleId(user) {
    // 1) Tenta o JWT claim (via webhook da migration 006)
    const fromJwt =
      user?.app_metadata?.couple_id;

    if (fromJwt) {
      return fromJwt;
    }

    // 2) Fallback: null (resolving no CoupleProvider
    //    via current_user_couple_id() no banco)
    return null;
  }


  async function refreshPermissions(email, force = false) {
    if (!email) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      return;
    }

    // Dedupe: evita re-consultar as RPCs para o mesmo e-mail.
    // force=true ignora (necessário APÓS criar o casal: o usuário
    // passou de "sem casal" para "dono" e o is_admin mudou).
    if (!force && lastCheckedEmail.current === email) {
      return;
    }

    try {
      const [adminResult, superResult] =
        await Promise.all([
          supabase.rpc("is_admin"),
          supabase.rpc("is_super_admin"),
        ]);

      // Marca apenas APÓS o sucesso: se as RPCs
      // falharem (rede), o próximo chamador pode
      // tentar de novo (o guard não foi armado).
      lastCheckedEmail.current = email;

      setIsAdmin(
        !adminResult.error &&
          adminResult.data === true
      );

      setIsSuperAdmin(
        !superResult.error &&
          superResult.data === true
      );
    } catch (err) {
      console.error(
        "Erro ao verificar permissões:",
        err
      );

      setIsAdmin(false);
      setIsSuperAdmin(false);
    }
  }


  async function resolveCoupleId(user) {
    const fromJwt = extractCoupleId(user);

    if (fromJwt) {
      setCoupleId(fromJwt);
      return;
    }

    try {
      const { data, error } =
        await supabase.rpc(
          "current_user_couple_id"
        );

      if (!error && data) {
        setCoupleId(data);
      }
    } catch {
      // silencioso: CoupleProvider trata o null
    }
  }


  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const { data } =
          await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        setSession(data.session);

        const user = data.session?.user ?? null;

        await refreshPermissions(
          user?.email
        );

        await resolveCoupleId(user);
      } catch (err) {
        console.error(
          "Erro ao restaurar sessão:",
          err
        );
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    bootstrap();

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          if (!mounted) {
            return;
          }

          setSession(newSession);

          const user = newSession?.user ?? null;

          refreshPermissions(
            user?.email
          );

          resolveCoupleId(user);
        }
      );

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);


  async function signIn(email, password) {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      throw error;
    }

    const user = data.session?.user ?? null;

    await refreshPermissions(
      user?.email
    );

    await resolveCoupleId(user);

    return data.session;
  }


  /**
   * Cadastro do casal direto no site.
   *
   * A conta NÃO nasce como administrador: o dono da
   * plataforma concede a permissão por casal depois
   * (set_couple_owner no painel de administração).
   *
   * Retorna { session, created, admin: false }.
   */
  async function signUp(
    email,
    password,
    fullName
  ) {
    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

    if (error) {
      throw error;
    }

    const newSession = data.session || null;

    if (newSession) {
      await refreshPermissions(
        newSession.user?.email
      );

      await resolveCoupleId(newSession.user);
    }

    return {
      session: newSession,
      created: true,
      admin: false
    };
  }


  async function signOut() {
    await supabase.auth.signOut();

    // Limpa o dedupe para permitir nova verificação
    // no próximo login com o mesmo e-mail.
    lastCheckedEmail.current = null;

    setIsAdmin(false);
    setIsSuperAdmin(false);
    setSession(null);
    setCoupleId(null);
  }


  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isAdmin,
      isSuperAdmin,
      authLoading,
      coupleId,
      signIn,
      signUp,
      signOut,
      // Re-consulta is_admin/is_super_admin forçando o dedupe
      // (necessário depois de criar o próprio site: o usuário
      // passa a ser dono e isAdmin muda de false para true).
      refreshPermissions,
    }),
    // signIn/signUp/signOut são recriadas a cada render
    // e o provider só precisa reagir às mudanças de
    // estado abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, isAdmin, isSuperAdmin, authLoading, coupleId]
  );


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  return useContext(AuthContext);
}
