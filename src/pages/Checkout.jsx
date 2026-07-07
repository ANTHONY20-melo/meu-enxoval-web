import {
  useState
} from "react";

import {
  Link
} from "react-router-dom";

import Cart
  from "../components/Cart";

import {
  useCart
} from "../hooks/useCart";

import {
  createCheckout
} from "../services/api";

export default function Checkout() {
  const {
    items,
    total
  } = useCart();

  const [customer, setCustomer] =
    useState({
      name: "",
      email: ""
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  function handleChange(event) {
    const {
      name,
      value
    } = event.target;

    setCustomer((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (items.length === 0) {
      setError(
        "Adicione produtos ao carrinho."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const result =
        await createCheckout({
          customer,

          items: items.map((item) => ({
            id: item.id,
            title: item.title,
            price: item.price,
            quantity: item.quantity
          }))
        });

      window.location.href =
        result.checkoutUrl;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="checkout-page">
      <div className="container">
        <div className="page-heading">
          <span>
            Finalizar pedido
          </span>

          <h1>
            Seu carrinho
          </h1>
        </div>

        <div className="checkout-grid">
          <div>
            <Cart />

            <Link
              className="back-link"
              to="/"
            >
              ← Continuar comprando
            </Link>
          </div>

          <form
            className="checkout-form"
            onSubmit={handleSubmit}
          >
            <h2>
              Seus dados
            </h2>

            <label>
              Nome completo

              <input
                type="text"
                name="name"
                value={customer.name}
                onChange={handleChange}
                placeholder="Seu nome"
                minLength="3"
                required
              />
            </label>

            <label>
              E-mail

              <input
                type="email"
                name="email"
                value={customer.email}
                onChange={handleChange}
                placeholder="voce@email.com"
                required
              />
            </label>

            <div className="checkout-total">
              <span>
                Total do pedido
              </span>

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

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              className="payment-button"
              type="submit"
              disabled={
                loading ||
                items.length === 0
              }
            >
              {loading
                ? "Preparando pagamento..."
                : "Ir para pagamento"}
            </button>

            <p className="secure-text">
              🔒 Pagamento processado
              em ambiente seguro.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}