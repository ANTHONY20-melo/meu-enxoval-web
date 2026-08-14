import { supabase } from './supabase';

// Serviços de administração da plataforma.
// Apenas o super admin (dono da plataforma) tem permissão
// no banco para usar estas RPCs (SECURITY DEFINER + checagem).

export interface PlatformUser {
  user_id: string;
  email: string;
  full_name: string | null;
  couple_id: string | null;
  couple_slug: string | null;
  couple_names: { noiva: string; noivo: string } | null;
  is_owner: boolean;
  created_at: string;
}

export const platformService = {
  /**
   * Lista todos os usuários que acessam o site (super admin).
   */
  async listUsers(): Promise<PlatformUser[]> {
    const { data, error } = await supabase.rpc('list_platform_users');

    if (error) {
      console.error('Erro ao listar usuários:', error);
      throw error;
    }

    return (data ?? []) as PlatformUser[];
  },

  /**
   * Concede (ou revoga, com coupleId null) a permissão de
   * admin de um casal para um usuário (super admin).
   */
  async setCoupleOwner(
    userId: string,
    coupleId: string | null
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('set_couple_owner', {
      p_user_id: userId,
      p_couple_id: coupleId,
    });

    if (error) {
      console.error('Erro ao definir dono do casal:', error);
      return false;
    }

    return data === true;
  },
};
