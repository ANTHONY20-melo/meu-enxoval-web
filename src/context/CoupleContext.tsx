import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router";

import { supabase } from "../services/supabase";
import { useAuth } from "./AuthContext";
import {
  Couple,
  UseCoupleValue,
} from "../types/couple";
import { couplesService } from "../services/couples";


/*
Contexto que fornece os dados do casal no contexto atual.

- Se o usuário está logado: carrega seu casal via
  current_user_couple_id() / JWT claim `couple_id`.
- Se há slug na URL (visitante/convidado): carrega via
  get_couple_by_slug (acesso público).
- O coupleId é a chave de filtragem para todos os services.
*/

const CoupleContext = createContext<UseCoupleValue | null>(null);

// Rotas fixas que NÃO são slug de casal
const FIXED_PATHS = new Set([
  "login",
  "admin",
  "dashboard",
  "enxoval",
  "casamento",
  "orcamento",
  "checkout",
  "success",
  "cancel",
]);


export function CoupleProvider({ children }: { children: React.ReactNode }) {
  const { user, coupleId: authCoupleId, authLoading } = useAuth() as any;
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    async function loadCouple() {
      setLoading(true);
      setError(null);

      try {
        // Prioridade 1: usuário logado → carrega seu casal
        if (user && !authLoading) {
          const fromDb = authCoupleId
            ? await supabase
                .from("couples")
                .select("*")
                .eq("id", authCoupleId)
                .single()
                .then(r => r.data)
            : await couplesService.getMyCouple(user.id);

          if (!cancelled) {
            setCouple(fromDb ?? null);
          }
          return;
        }

        // Prioridade 2: visita por slug (convidado público)
        const slug = location?.pathname?.split("/")[1];

        if (slug && !FIXED_PATHS.has(slug)) {
          const publicCouple = await couplesService.getBySlug(slug);
          if (!cancelled) {
            setCouple(publicCouple);
          }
          return;
        }

        // Ninguém logado + sem slug → estado vazio
        if (!cancelled) {
          setCouple(null);
        }
      } catch {
        if (!cancelled) {
          setError(null);
          setCouple(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCouple();
    return () => { cancelled = true; };
  }, [user, authLoading, authCoupleId, location]);

  const value = useMemo(() => ({
    couple,
    coupleId: couple?.id ?? authCoupleId ?? null,
    slug: couple?.slug ?? null,
    settings: couple?.settings ?? null,
    loading,
    error,
    refreshCouple: async () => {
      if (user) {
        const data = authCoupleId
          ? await supabase
              .from("couples")
              .select("*")
              .eq("id", authCoupleId)
              .maybeSingle()
              .then(r => r.data)
          : await couplesService.getMyCouple(user.id);
        setCouple(data ?? null);
      }
    },
  }), [couple, authCoupleId, loading, error, user]);

  return (
    <CoupleContext.Provider value={value}>
      {children}
    </CoupleContext.Provider>
  );
}


export function useCouple(): UseCoupleValue {
  const ctx = useContext(CoupleContext);
  if (!ctx) {
    throw new Error("useCouple deve ser usado dentro de CoupleProvider");
  }
  return ctx;
}


export default CoupleProvider;
