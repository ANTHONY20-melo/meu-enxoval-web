import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../services/supabase";


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


  async function refreshAdmin(email) {
    if (!email) {
      setIsAdmin(false);
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
   * Com a confirmação de e-mail ativa no
   * Supabase, retorna session = null e o
   * usuário precisa confirmar o link antes
   * do primeiro login. Se autoconfirm estiver
   * ativo, retorna a sessão logada.
   */
  async function signUp(email, password) {
    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
      });

    if (error) {
      throw error;
    }

    const session = data.session || null;

    if (session) {
      await refreshAdmin(
        session.user?.email
      );
    }

    return session;
  }


  async function signOut() {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setSession(null);
  }


  async function claimAdmin() {
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
      await refreshAdmin(
        session?.user?.email
      );

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
