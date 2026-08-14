/**
 * Tipos gerados a partir do schema multi-casal.
 * Após aplicar as migrations (001-005), rode:
 *   npx supabase gen types typescript --local > src/types/database.ts
 */

// --- Core types from Supabase public schema ---

export interface Couple {
  id: string;               // uuid
  slug: string;             // "ana-e-pedro", "joao-e-maria"
  couple_names: {
    noiva: string;
    noivo: string;
  };
  wedding_date: string | null;  // date ISO
  pix_key: string | null;       // chave PIX
  settings: CoupleSettings;
  owner_user_id: string | null; // auth.users id
  created_at: string;           // ISO timestamp
  updated_at: string;           // ISO timestamp
}

export interface CoupleSettings {
  theme: 'default' | 'romantic' | 'modern' | 'minimal';
  animations_enabled: boolean;
  photos: {
    hero: string | null;        // URL do Supabase Storage
    profile: string | null;     // URL do Supabase Storage
    gallery: string[];          // array de URLs
  };
  template_version: number;
}

// --- Derived types for hooks/components ---

export interface TemplateItem {
  category_id: string;       // FK para categories ou checklist_items.category_id
  name: string;
  quantity: number;
  priority: number;          // 1=baixa, 2=media, 3=alta
}

export interface UseCoupleValue {
  couple: Couple | null;
  coupleId: string | null;
  slug: string | null;
  settings: CoupleSettings | null;
  loading: boolean;
  error: string | null;
  refreshCouple: () => Promise<void>;
}

// --- Service return types ---

export interface CreateCoupleResponse {
  coupleId: string;
  message: string;
}

export interface UpdateSettingsResponse {
  success: boolean;
  message: string;
}

// --- RLS / Auth types ---

export interface RlsCheckResult {
  passes: boolean;
  reason: 'owner' | 'public' | 'none';
}

// Função utilitária: verificar se usuário pode acessar um couple_id
export function canAccessCouple(
  coupleId: string,
  ownerUserId: string,
  jwtCoupleId: string | undefined
): RlsCheckResult {
  const isOwner = ownerUserId === jwtCoupleId;
  const isPublic = jwtCoupleId !== undefined; // se tem claim, qualquer usuário com claim pode acessar
  return {
    passes: isOwner || isPublic,
    reason: isOwner ? 'owner' : isPublic ? 'public' : 'none',
  };
}

// Gerar slug a partir de nomes
export function generateSlug(nomes: { noiva: string; noivo: string }): string {
  const base = `${nomes.noiva.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}-${nomes.noivo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`;
  return base.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}