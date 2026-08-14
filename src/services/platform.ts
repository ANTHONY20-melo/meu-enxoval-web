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
  couple_wedding_date: string | null;
  is_owner: boolean;
  created_at: string;
  pix_key: string | null;
}

export interface CoupleMember {
  user_id: string;
  email: string;
  full_name: string | null;
  is_owner: boolean;
}

export interface GrantResult {
  ok: boolean;
  error?: string;
  user_id?: string;
  full_name?: string;
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

  /**
   * Libera o acesso da esposa/noivo ao casal pelo e-mail.
   * Super admin OU o dono do casal.
   */
  async grantAccess(
    coupleId: string,
    email: string
  ): Promise<GrantResult> {
    const { data, error } = await supabase.rpc('grant_couple_access', {
      p_couple_id: coupleId,
      p_email: email,
    });

    if (error) {
      console.error('Erro ao liberar acesso:', error);
      return { ok: false, error: error.message };
    }

    const result = (data ?? { ok: false }) as GrantResult;
    return result;
  },

  /**
   * Remove o acesso de um membro do casal (super admin OU dono).
   * O dono nunca pode ser removido por esta via.
   */
  async revokeAccess(userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('revoke_couple_access', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Erro ao remover acesso:', error);
      return false;
    }

    return data === true;
  },

  /**
   * Lista os membros com acesso ao casal (super admin OU dono).
   */
  async listMembers(coupleId: string): Promise<CoupleMember[]> {
    const { data, error } = await supabase.rpc('list_couple_members', {
      p_couple_id: coupleId,
    });

    if (error) {
      console.error('Erro ao listar membros:', error);
      return [];
    }

    return (data ?? []) as CoupleMember[];
  },

  /**
   * Edita dados do casal (nomes, data, PIX) — super admin OU dono.
   */
  async updateCouple(
    coupleId: string,
    names: { noiva: string; noivo: string },
    weddingDate: string,
    pixKey: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('update_couple', {
      p_couple_id: coupleId,
      p_couple_names: names,
      p_wedding_date: weddingDate,
      p_pix_key: pixKey,
    });

    if (error) {
      console.error('Erro ao atualizar casal:', error);
      return false;
    }

    return data === true;
  },
};
