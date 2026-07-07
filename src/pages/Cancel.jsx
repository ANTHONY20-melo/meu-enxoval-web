import {
  Link
} from "react-router-dom";

export default function Cancel() {
  return (
    <main className="result-page">
      <div className="result-card">
        <div className="result-icon cancel">
          ×
        </div>

        <h1>
          Pagamento não concluído
        </h1>

        <p>
          O pagamento não foi finalizado.
          Seus produtos continuam no carrinho.
        </p>

        <Link
          className="primary-button"
          to="/checkout"
        >
          Tentar novamente
        </Link>
      </div>
    </main>
  );
}