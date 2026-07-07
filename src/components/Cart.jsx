import {
  useCart
} from "../hooks/useCart";

export default function Cart() {
  const {
    items,
    total,
    removeItem,
    increaseQuantity,
    decreaseQuantity
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="empty-cart">
        <span>🛒</span>

        <h2>
          Seu carrinho está vazio
        </h2>

        <p>
          Adicione produtos para continuar.
        </p>
      </div>
    );
  }

  return (
    <div className="cart">
      {items.map((item) => (
        <article
          className="cart-item"
          key={item.id}
        >
          <div className="cart-item-icon">
            {item.emoji}
          </div>

          <div className="cart-item-info">
            <h3>
              {item.title}
            </h3>

            <p>
              {item.price.toLocaleString(
                "pt-BR",
                {
                  style: "currency",
                  currency: "BRL"
                }
              )}
            </p>
          </div>

          <div className="quantity-control">
            <button
              type="button"
              onClick={() =>
                decreaseQuantity(
                  item.id
                )
              }
            >
              −
            </button>

            <span>
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={() =>
                increaseQuantity(
                  item.id
                )
              }
            >
              +
            </button>
          </div>

          <button
            type="button"
            className="remove-button"
            onClick={() =>
              removeItem(item.id)
            }
          >
            Remover
          </button>
        </article>
      ))}

      <div className="cart-total">
        <span>Total</span>

        <strong>
          {total.toLocaleString(
            "pt-BR",
            {
              style: "currency",
              currency: "BRL"
            }
          )}
        </strong>
      </div>
    </div>
  );
}