export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <h2>
          Meu Enxoval
        </h2>

        <p>
          Carinho em cada detalhe
          para você e seu amor.
        </p>

        <small>
          © {new Date().getFullYear()}
          {" "}
          Meu Enxoval. Todos os direitos
          reservados.
        </small>
      </div>
    </footer>
  );
}