import {
  createContext,
  useEffect,
  useMemo,
  useState
} from "react";

export const CartContext =
  createContext(null);

export function CartProvider({
  children
}) {
  const [items, setItems] = useState(
    () => {
      const saved =
        localStorage.getItem(
          "meu-enxoval-cart"
        );

      return saved
        ? JSON.parse(saved)
        : [];
    }
  );

  useEffect(() => {
    localStorage.setItem(
      "meu-enxoval-cart",
      JSON.stringify(items)
    );
  }, [items]);

  function addItem(product) {
    setItems((currentItems) => {
      const existing =
        currentItems.find(
          (item) =>
            item.id === product.id
        );

      if (existing) {
        return currentItems.map(
          (item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity:
                    item.quantity + 1
                }
              : item
        );
      }

      return [
        ...currentItems,
        {
          ...product,
          quantity: 1
        }
      ];
    });
  }

  function removeItem(productId) {
    setItems((currentItems) =>
      currentItems.filter(
        (item) =>
          item.id !== productId
      )
    );
  }

  function increaseQuantity(productId) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity:
                item.quantity + 1
            }
          : item
      )
    );
  }

  function decreaseQuantity(productId) {
    setItems((currentItems) =>
      currentItems
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity:
                  item.quantity - 1
              }
            : item
        )
        .filter(
          (item) =>
            item.quantity > 0
        )
    );
  }

  function clearCart() {
    setItems([]);
  }

  const total = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum +
        item.price *
          item.quantity,
      0
    );
  }, [items]);

  const quantity = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        quantity,
        addItem,
        removeItem,
        increaseQuantity,
        decreaseQuantity,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}