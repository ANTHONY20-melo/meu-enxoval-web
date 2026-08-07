import {
  Component
} from "react";


export default class ErrorBoundary
  extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(
      "Erro na aplicação:",
      error,
      info
    );
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="result-page">
          <div className="result-card">
            <div className="result-icon cancel">
              ⚠️
            </div>

            <h1>
              Algo deu errado
            </h1>

            <p>
              Ocorreu um erro inesperado.
              Recarregue a página para
              continuar.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={this.handleReload}
            >
              Recarregar página
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
