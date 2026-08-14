import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "../services/supabase";

import {
  registerAdminAccount
} from "../services/api";


/*
Contexto de autenticação do casal.

Controla a sessão do Supabase Auth e informa:
- session, user, authLoading
- isAdmin (e-mail na tabela admin_emails)
- coupleId (do JWT claim `couple_id` ou fallback)

O coupleId vem PRIMEIRO do app_metadata do JWT (configurado pelo
webhook da migration 006). Se o webhook não estiver ativo, cai para
uma subquery no banco (current_user_couple_id).
*/

const AuthContext = createContext({
  session: null,
  user: null,
  isAdmin: false,
  authLoading: true,
  coupleId: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  claimAdmin: async () => false,
});


export function AuthProvider({ children }) {
  const [session, setSession] =
    useState(null);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [authLoading, setAuthLoading] =
    useState(true);

  // Evita consultar is_admin() repetidamente
  // para o mesmo e-mail (bootstrap + evento
  // INITIAL_SESSION disparam em sequência).
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


  async function refreshAdmin(email) {
    if (!email) {
      setIsAdmin(false);
      return;
    }

    if (lastCheckedEmail.current === email) {
      return;
    }

    try {
      const { data, error } =
        await supabase.rpc("is_admin");

      if (error) {
        console.error(
          "Erro ao verificar admin:",
          error
        );

        setIsAdmin(false);
        return;
      }

      // Marca apenas APÓS o sucesso: se a RPC
      // falhar (rede), o próximo chamador pode
      // tentar de novo (o guard não foi armado).
      lastCheckedEmail.current = email;

      setIsAdmin(data === true);
    } catch (err) {
      console.error(
        "Erro ao verificar admin:",
        err
      );

      setIsAdmin(false);
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

        await refreshAdmin(
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

          refreshAdmin(
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

    await refreshAdmin(
      user?.email
    );

    await resolveCoupleId(user);

    return data.session;
  }


  /**
   * Cadastro do casal direto no site.
   *
   * 1ª tentativa: via API (conta já nasce com
   * e-mail confirmado e como administrador).
   * Fallback (API indisponível): cadastro nativo
   * do Supabase + claim_admin quando autoconfirmar.
   *
   * Retorna { session, created, admin }.
   */
  async function signUp(
    email,
    password,
    fullName
  ) {
    try {
      await registerAdminAccount(
        email,
        password,
        fullName
      );

      // Conta criada pela API: já é admin.
      // Faz o login automático.
      const newSession = await signIn(
        email,
        password
      );

      return {
        session: newSession,
        created: true,
        admin: true
      };
    } catch (err) {
      const viaApi =
        err?.message?.toLowerCase()?.includes(
          "api"
        ) ||
        err?.message?.toLowerCase()?.includes(
          "network"
        ) ||
        err?.message?.toLowerCase()?.includes(
          "fetch"
        ) ||
        err?.message?.toLowerCase()?.includes(
          "failed"
        );

      if (!viaApi) {
        throw err;
      }

      // Fallback: cria direto no Supabase e tenta
      // tornar-se administrador em seguida.
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

      const session = data.session || null;

      let admin = false;

      if (session) {
        admin = await claimAdmin(
          session.user?.email
        );
      }

      return {
        session,
        created: true,
        admin
      };
    }
  }


  async function signOut() {
    await supabase.auth.signOut();

    // Limpa o dedupe para permitir nova verificação
    // no próximo login com o mesmo e-mail.
    lastCheckedEmail.current = null;

    setIsAdmin(false);
    setSession(null);
    setCoupleId(null);
  }


  const claimAdmin = useCallback(
    async (email = session?.user?.email) => {
      const { data, error } =
        await supabase.rpc(
          "claim_admin"
        );

      if (error) {
        console.error(
          "Erro ao reivindicar admin:",
          error
        );

        return false;
      }

      if (data === true) {
        // refreshAdmin inline (evita dep instável)
        if (email) {
          const {
            data: adminData,
            error: adminError,
          } = await supabase.rpc(
            "is_admin"
          );

          setIsAdmin(
            !adminError &&
              adminData === true
          );
        } else {
          setIsAdmin(false);
        }

        return true;
      }

      return false;
    },
    [session]
  );


  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isAdmin,
      authLoading,
      coupleId,
      signIn,
      signUp,
      signOut,
      claimAdmin,
    }),
    // claimAdmin é memoizado; signIn/signUp/signOut
    // são recriadas a cada render e o provider só
    // precisa reagir às mudanças de estado abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, isAdmin, authLoading, coupleId, claimAdmin]
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
