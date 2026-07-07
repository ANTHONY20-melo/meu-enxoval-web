import {
  useEffect
} from "react";

import {
  Link,
  useSearchParams
} from "react-router-dom";

import {
  useCart
} from "../hooks/useCart";

export default function Success() {
  const { clearCart } = useCart();

  const [searchParams] =
    useSearchParams();

  const order =
    searchParams.get("order");

  const status =
    searchParams.get("status");

  useEffect(() => {
    if (status !== "pending") {
      clearCart();
    }
  }, []);

  return (
    <main className="result-page">
      <div className="result-card">
        <div className="result-icon success">
          ✓
        </div>

        <h1>
          {status === "pending"
            ? "Pagamento em processamento"
            : "Pedido recebido!"}
        </h1>

        <p>
          {status === "pending"
            ? "Seu pagamento está sendo processado."
            : "Recebemos seu pedido e estamos aguardando a confirmação final do pagamento."}
        </p>

        {order && (
          <div className="order-code">
            Pedido: {order}
          </div>
        )}

        <Link
          className="primary-button"
          to="/"
        >
          Voltar para a loja
        </Link>
      </div>
    </main>
  );
}