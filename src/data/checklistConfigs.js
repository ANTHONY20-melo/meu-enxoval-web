import { checklist } from "./checklist";
import { weddingChecklist } from "./weddingChecklist";


/**
 * Configurações das páginas de checklist.
 *
 * Cada página (Enxoval e Casamento) passou
 * a ser renderizada pelo componente genérico
 * ChecklistPage, evitando a duplicação de
 * ~1.800 linhas que existia entre Home.jsx
 * e Wedding.jsx.
 */

export const enxovalConfig = {
  listType: "enxoval",

  label: "💍 Nosso casamento",
  title: "Nosso Enxoval",
  subtitle:
    "Cada item marcado representa mais um passo para construirmos nosso lar juntos. ❤️",

  progressLabel: "Progresso geral",
  searchPlaceholder:
    "Buscar item do enxoval...",
  itemPlaceholder: "Ex: Lamparina",

  sectionId: "checklist",

  guestReservations: true,

  initialData: checklist,
};

export const casamentoConfig = {
  listType: "casamento",

  label: "💒 Nosso grande dia",
  title: "Nosso Casamento",
  subtitle:
    "Todos os detalhes do nosso casamento organizados em um só lugar. ❤️",

  progressLabel: "Progresso do casamento",
  searchPlaceholder:
    "Buscar item do casamento...",
  itemPlaceholder: "Digite o novo item...",

  sectionId: "checklist-casamento",

  initialData: weddingChecklist,
};
