/**
 * Memória local dos nomes usados neste
 * dispositivo para reservar presentes.
 *
 * Guarda um mapa itemKey -> nome do convidado.
 * Serve para o convidado saber quais itens
 * ELE reservou ("Você reservou") sem precisar
 * de login — e para permitir desfazer a
 * reserva com o mesmo nome.
 */

const STORAGE_KEY = "meu_enxoval_guest_names";


export function loadMyGuestNames() {
  try {
    const raw = localStorage.getItem(
      STORAGE_KEY
    );

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    const cleaned = {};

    for (const [key, value] of Object.entries(
      parsed
    )) {
      if (
        typeof key === "string" &&
        typeof value === "string" &&
        value.trim()
      ) {
        cleaned[key] = value;
      }
    }

    return cleaned;
  } catch {
    return {};
  }
}


function saveMyGuestNames(names) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(names)
    );
  } catch {
    // localStorage cheio/indisponível:
    // a reserva segue funcionando, só perde
    // a memória de "você reservou" neste
    // dispositivo.
  }
}


export function rememberGuestName(itemKey, name) {
  const names = loadMyGuestNames();

  names[itemKey] = name.trim();

  saveMyGuestNames(names);
}


export function forgetGuestName(itemKey) {
  const names = loadMyGuestNames();

  if (itemKey in names) {
    delete names[itemKey];

    saveMyGuestNames(names);
  }
}


/**
 * Remove nomes de itens que não têm mais
 * reserva ativa (ex.: cancelada por admin
 * em outro dispositivo).
 *
 * @param {Set<string>} activeItemKeys
 */
export function pruneMyGuestNames(activeItemKeys) {
  const names = loadMyGuestNames();

  let changed = false;

  for (const key of Object.keys(names)) {
    if (!activeItemKeys.has(key)) {
      delete names[key];

      changed = true;
    }
  }

  if (changed) {
    saveMyGuestNames(names);
  }
}
