import {
  useEffect
} from "react";

import {
  Link,
  useSearchParams
} from "react-router";

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
    // Limpa o carrinho apenas quando o pagamento
    // foi concluído/processado. Em falha, mantém
    // os itens para o usuário tentar de novo.
    const failedStatuses = [
      "failure",
      "rejected",
      "aborted"
    ];

    if (!failedStatuses.includes(status)) {
      clearCart();
    }
  }, [clearCart, status]);

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