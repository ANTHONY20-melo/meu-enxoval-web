/**
 * URL do CONVITE de casamento.
 *
 * O convidado que sai do convite para reservar um presente
 * na lista de enxoval precisa de um caminho de volta: este
 * é o botão "← Voltar para o convite".
 *
 * Para trocar o destino, defina VITE_CONVITE_URL no .env
 * (ou ajuste o valor padrão abaixo).
 */
export const CONVITE_URL =
  import.meta.env.VITE_CONVITE_URL ||
  "https://convite-casamento-one-iota.vercel.app/";
