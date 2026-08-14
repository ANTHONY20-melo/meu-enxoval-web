import { supabase } from './supabase';
import { Couple, CoupleSettings } from '../types/couple';

// Services para operações com o casal

export const couplesService = {
  /**
   * Busca o casal onde o user é o dono (owner_user_id).
   * Retorna null se não encontrado.
   */
  async getMyCouple(userId: string): Promise<Couple | null> {
    // maybeSingle: com RLS e 0 linhas retorna null SEM erro 406
    // (single() gerava "Failed to load resource: 406" no console para
    //  usuários que ainda não têm casal criado pelo super admin)
    const { data, error } = await supabase
      .from('couples')
      .select('*')
      .eq('owner_user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar casal:', error);
      throw error;
    }
    return data as Couple | null;
  },

  /**
   * Busca um casal pelo slug (público ou para redirecionamento).
   * Qualquer um pode chamar (anon), mas só o dono pode editar.
   */
  async getBySlug(slug: string): Promise<Couple | null> {
    const { data, error } = await supabase
      .rpc('get_couple_by_slug', { p_slug: slug });

    if (error) {
      console.error('Erro ao buscar casal por slug:', error);
      return null;
    }
    return data as Couple | null;
  },

  /**
   * Cria um novo casal a partir do template (sua lista).
   * Clona couple_checklist e couple_budget do casal principal
   * (o que tem mais itens) e vincula o profile do dono.
   */
  async createFromTemplate(params: {
    slug: string;
    coupleNames: { noiva: string; noivo: string };
    weddingDate: string;
    pixKey?: string;
    ownerUserId?: string;
  }): Promise<{ coupleId: string; message: string }> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Não autenticado');

    // ownerUserId é usado pelo dono da plataforma (super admin)
    // para criar o site DE OUTRO usuário. Sem ele, o dono é quem chama.
    const ownerUserId = params.ownerUserId ?? user.user.id;

    const { data, error } = await supabase.rpc('create_couple_from_template', {
      p_slug: params.slug,
      p_couple_names: params.coupleNames,
      p_wedding_date: params.weddingDate,
      p_pix_key: params.pixKey ?? null,
      p_owner_user_id: ownerUserId,
    });

    if (error) {
      console.error('Erro ao criar casal:', error);
      throw error;
    }

    return {
      coupleId: data as string,
      message: 'Casal criado com sucesso. Sua lista de enxoval foi clonada da lista principal.',
    };
  },

  /**
   * Atualiza as configurações do casal (tema, animações, fotos).
   */
  async updateSettings(coupleId: string, settings: Partial<CoupleSettings>): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('couples')
      .update({ settings: { ...settings } })
      .eq('id', coupleId);

    if (error) {
      console.error('Erro ao atualizar settings:', error);
      return { success: false, message: 'Erro ao atualizar configurações' };
    }
    return { success: true, message: 'Configurações salvas com sucesso' };
  },

};