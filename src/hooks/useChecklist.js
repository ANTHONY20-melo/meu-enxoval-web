import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  loadChecklist,
  saveChecklistItem,
  addChecklistItem,
  removeChecklistItem,
} from "../services/checklistService";


/**
 * Hook compartilhado de checklist.
 *
 * Centraliza o carregamento, marcação,
 * adição, remoção, estatísticas e busca
 * usados nas páginas de Enxoval e
 * Casamento (antes duplicados).
 *
 * @param {string} listType  "enxoval" | "casamento"
 * @param {Array}  initialData Dados padrão das categorias
 */
export function useChecklist(
  listType,
  initialData
) {
  const [categories, setCategories] =
    useState(initialData);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [addingCategory, setAddingCategory] =
    useState(null);

  const [newItemName, setNewItemName] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [removingItem, setRemovingItem] =
    useState(null);

  const [confirmRemove, setConfirmRemove] =
    useState(null);


  /*
  ========================================
  CARREGAR CHECKLIST
  ========================================
  */

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const databaseItems =
          await loadChecklist(listType);

        const updatedCategories =
          initialData.map((category) => {
            const defaultItems =
              category.items
                .filter((item) => {
                  const itemKey =
                    `${listType}:${category.id}:${item.id}`;

                  const databaseItem =
                    databaseItems.find(
                      (dbItem) =>
                        dbItem.item_key ===
                        itemKey
                    );

                  return (
                    databaseItem?.deleted !==
                    true
                  );
                })
                .map((item) => {
                  const itemKey =
                    `${listType}:${category.id}:${item.id}`;

                  const savedItem =
                    databaseItems.find(
                      (databaseItem) =>
                        databaseItem.item_key ===
                        itemKey
                    );

                  return {
                    ...item,
                    checked:
                      savedItem
                        ? savedItem.checked
                        : item.checked,
                    isCustom: false,
                  };
                });

            const customItems =
              databaseItems
                .filter(
                  (databaseItem) =>
                    databaseItem.category_id ===
                      category.id &&
                    databaseItem.is_custom ===
                      true &&
                    databaseItem.deleted !==
                      true
                )
                .map((databaseItem) => ({
                  id:
                    databaseItem.item_id,
                  name:
                    databaseItem.item_name,
                  checked:
                    databaseItem.checked,
                  isCustom: true,
                }));

            return {
              ...category,
              items: [
                ...defaultItems,
                ...customItems,
              ],
            };
          });

        setCategories(updatedCategories);
      } catch (err) {
        console.error(
          "Erro ao carregar checklist:",
          err
        );

        setError(
          "Não foi possível carregar o checklist."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Dados iniciais são estáticos;
    // não precisam ser re-executados.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listType]);


  /*
  ========================================
  MARCAR OU DESMARCAR ITEM
  ========================================
  */

  async function toggleItem(
    categoryId,
    itemId
  ) {
    const category =
      categories.find(
        (currentCategory) =>
          currentCategory.id === categoryId
      );

    const currentItem =
      category?.items.find(
        (item) =>
          item.id === itemId
      );

    if (!currentItem) {
      return;
    }

    const updatedItem = {
      ...currentItem,
      checked: !currentItem.checked,
    };

    // Atualização visual imediata
    setCategories((currentCategories) =>
      currentCategories.map(
        (currentCategory) => {
          if (
            currentCategory.id !==
            categoryId
          ) {
            return currentCategory;
          }

          return {
            ...currentCategory,
            items:
              currentCategory.items.map(
                (item) =>
                  item.id === itemId
                    ? updatedItem
                    : item
              ),
          };
        }
      )
    );

    // Salvar no banco
    try {
      setError("");

      await saveChecklistItem({
        listType,
        categoryId,
        item: updatedItem,
      });
    } catch (err) {
      console.error(
        "Erro ao salvar item:",
        err
      );

      setError(
        "Não foi possível salvar a alteração."
      );

      // Reverter alteração visual
      setCategories((currentCategories) =>
        currentCategories.map(
          (currentCategory) => {
            if (
              currentCategory.id !==
              categoryId
            ) {
              return currentCategory;
            }

            return {
              ...currentCategory,
              items:
                currentCategory.items.map(
                  (item) =>
                    item.id === itemId
                      ? currentItem
                      : item
                ),
            };
          }
        )
      );
    }
  }


  /*
  ========================================
  ADICIONAR ITEM
  ========================================
  */

  function openAddItem(categoryId) {
    setAddingCategory(categoryId);
    setNewItemName("");
    setError("");
  }

  function cancelAddItem() {
    setAddingCategory(null);
    setNewItemName("");
  }

  async function handleAddItem(
    categoryId
  ) {
    const name =
      newItemName.trim();

    if (!name) {
      setError(
        "Digite o nome do novo item."
      );

      return;
    }

    if (saving) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const newItem =
        await addChecklistItem({
          listType,
          categoryId,
          itemName: name,
        });

      setCategories((currentCategories) =>
        currentCategories.map(
          (currentCategory) => {
            if (
              currentCategory.id !==
              categoryId
            ) {
              return currentCategory;
            }

            return {
              ...currentCategory,
              items: [
                ...currentCategory.items,
                newItem,
              ],
            };
          }
        )
      );

      setNewItemName("");
      setAddingCategory(null);
    } catch (err) {
      console.error(
        "Erro ao adicionar item:",
        err
      );

      setError(
        "Não foi possível adicionar o item."
      );
    } finally {
      setSaving(false);
    }
  }


  /*
  ========================================
  REMOVER ITEM (com confirmação)
  ========================================
  */

  function askRemoveItem(
    categoryId,
    item
  ) {
    setConfirmRemove({
      categoryId,
      item,
    });
  }

  async function handleRemoveItem() {
    if (!confirmRemove) {
      return;
    }

    const {
      categoryId,
      item,
    } = confirmRemove;

    const removeKey =
      `${categoryId}:${item.id}`;

    try {
      setRemovingItem(removeKey);
      setError("");
      setConfirmRemove(null);

      await removeChecklistItem({
        listType,
        categoryId,
        item,
      });

      setCategories((currentCategories) =>
        currentCategories.map(
          (currentCategory) => {
            if (
              currentCategory.id !==
              categoryId
            ) {
              return currentCategory;
            }

            return {
              ...currentCategory,
              items:
                currentCategory.items.filter(
                  (currentItem) =>
                    currentItem.id !==
                    item.id
                ),
            };
          }
        )
      );
    } catch (err) {
      console.error(
        "Erro ao remover item:",
        err
      );

      setError(
        "Não foi possível remover o item."
      );
    } finally {
      setRemovingItem(null);
    }
  }


  /*
  ========================================
  ESTATÍSTICAS
  ========================================
  */

  const statistics =
    useMemo(() => {
      const allItems =
        categories.flatMap(
          (category) =>
            category.items
        );

      const completed =
        allItems.filter(
          (item) =>
            item.checked
        ).length;

      const total =
        allItems.length;

      const percentage =
        total === 0
          ? 0
          : Math.round(
              (completed / total) *
                100
            );

      return {
        completed,
        total,
        percentage,
      };
    }, [categories]);


  /*
  ========================================
  PESQUISA
  ========================================
  */

  const filteredCategories =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      if (!normalizedSearch) {
        return categories;
      }

      return categories
        .map((category) => ({
          ...category,
          items:
            category.items.filter(
              (item) =>
                item.name
                  .toLowerCase()
                  .includes(
                    normalizedSearch
                  )
            ),
        }))
        .filter(
          (category) =>
            category.items.length > 0
        );
    }, [categories, search]);


  return {
    categories,
    statistics,
    filteredCategories,

    loading,
    error,
    setError,

    search,
    setSearch,

    addingCategory,
    newItemName,
    setNewItemName,
    saving,

    removingItem,
    confirmRemove,
    setConfirmRemove,

    toggleItem,
    openAddItem,
    cancelAddItem,
    handleAddItem,
    askRemoveItem,
    handleRemoveItem,
  };
}
