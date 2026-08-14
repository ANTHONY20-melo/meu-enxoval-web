import {
  createContext,
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

Controla a sessão do Supabase Auth e
informa se o usuário logado é um dos
administradores (e-mail na tabela
admin_emails).
*/

const AuthContext = createContext({
  session: null,
  isAdmin: false,
  authLoading: true,
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

        await refreshAdmin(
          data.session?.user?.email
        );
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

          refreshAdmin(
            newSession?.user?.email
          );
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

    await refreshAdmin(
      data.session?.user?.email
    );

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
  }


  async function claimAdmin(
    email = session?.user?.email
  ) {
    const { data, error } =
      await supabase.rpc("claim_admin");

    if (error) {
      console.error(
        "Erro ao reivindicar admin:",
        error
      );

      return false;
    }

    if (data === true) {
      // Usa o e-mail passado por parâmetro (ou o
      // atual): evita ler a session do closure,
      // que pode estar desatualizada no fluxo de
      // cadastro (login automático em andamento).
      await refreshAdmin(email);

      return true;
    }

    return false;
  }


  const value = useMemo(
    () => ({
      session,
      isAdmin,
      authLoading,
      signIn,
      signUp,
      signOut,
      claimAdmin,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, isAdmin, authLoading]
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
