import {
  useCart
} from "../hooks/useCart";

export default function ProductCard({
  product
}) {
  const { addItem } = useCart();

  const formattedPrice =
    product.price.toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL"
      }
    );

  return (
    <article className="product-card">
      <div className="product-image">
        <span>
          {product.emoji}
        </span>
      </div>

      <div className="product-info">
        <h3>
          {product.title}
        </h3>

        <p>
          {product.description}
        </p>

        <strong>
          {formattedPrice}
        </strong>

        <button
          type="button"
          onClick={() =>
            addItem(product)
          }
        >
          Adicionar ao carrinho
        </button>
      </div>
    </article>
  );
}