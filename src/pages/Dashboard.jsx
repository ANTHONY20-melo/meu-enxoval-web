import {
  useEffect,
  useState,
} from "react";

import {
  loadChecklist,
} from "../services/checklistService";

import { Link } from "react-router-dom";

import "../App.css";


export default function Dashboard() {
  const [loading, setLoading] =
    useState(true);

  const [enxovalStats, setEnxovalStats] =
    useState({
      completed: 0,
      total: 0,
      percentage: 0,
    });

  const [
    casamentoStats,
    setCasamentoStats,
  ] = useState({
    completed: 0,
    total: 0,
    percentage: 0,
  });


  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);


        const [
          enxovalItems,
          casamentoItems,
        ] = await Promise.all([
          loadChecklist("enxoval"),
          loadChecklist("casamento"),
        ]);


        setEnxovalStats(
          calculateStats(
            enxovalItems
          )
        );


        setCasamentoStats(
          calculateStats(
            casamentoItems
          )
        );

      } catch (error) {
        console.error(
          "Erro ao carregar dashboard:",
          error
        );

      } finally {
        setLoading(false);
      }
    }


    loadDashboard();

  }, []);


  function calculateStats(items) {
    const activeItems =
      items.filter(
        (item) =>
          item.deleted !== true
      );


    const total =
      activeItems.length;


    const completed =
      activeItems.filter(
        (item) =>
          item.checked
      ).length;


    const percentage =
      total === 0
        ? 0
        : Math.round(
            (completed / total) * 100
          );


    return {
      completed,
      total,
      percentage,
    };
  }


  if (loading) {
    return (
      <main className="dashboard-page">

        <div className="container">

          <div className="dashboard-loading">
            Carregando nosso painel... ❤️
          </div>

        </div>

      </main>
    );
  }


  return (
    <main className="dashboard-page">


      {/* APRESENTAÇÃO */}

      <section className="dashboard-welcome">

        <div className="container">

          <span className="checklist-label">
            💍 Nosso planejamento
          </span>


          <h1>
            Nosso Casamento
          </h1>


          <p>
            Um cantinho para organizarmos
            juntos cada detalhe da nossa
            nova vida. ❤️
          </p>

        </div>

      </section>


      {/* RESUMO */}

      <section className="dashboard-content">

        <div className="container">


          <h2 className="dashboard-title">
            Nosso progresso
          </h2>


          <div className="dashboard-grid">


            {/* ENXOVAL */}

            <Link
              to="/enxoval"
              className="dashboard-card"
            >

              <div className="dashboard-card-top">

                <div className="dashboard-card-icon">
                  🧺
                </div>


                <span>
                  {enxovalStats.percentage}%
                </span>

              </div>


              <h3>
                Nosso Enxoval
              </h3>


              <p>
                {enxovalStats.completed}
                {" "}de{" "}
                {enxovalStats.total}
                {" "}itens concluídos
              </p>


              <div className="dashboard-progress">

                <div
                  style={{
                    width:
                      `${enxovalStats.percentage}%`,
                  }}
                />

              </div>


              <strong className="dashboard-card-link">
                Ver enxoval →
              </strong>

            </Link>


            {/* CASAMENTO */}

            <Link
              to="/casamento"
              className="dashboard-card"
            >

              <div className="dashboard-card-top">

                <div className="dashboard-card-icon">
                  💒
                </div>


                <span>
                  {casamentoStats.percentage}%
                </span>

              </div>


              <h3>
                Nosso Casamento
              </h3>


              <p>
                {casamentoStats.completed}
                {" "}de{" "}
                {casamentoStats.total}
                {" "}itens concluídos
              </p>


              <div className="dashboard-progress">

                <div
                  style={{
                    width:
                      `${casamentoStats.percentage}%`,
                  }}
                />

              </div>


              <strong className="dashboard-card-link">
                Ver planejamento →
              </strong>

            </Link>


            {/* ORÇAMENTO */}

            <Link
              to="/orcamento"
              className="dashboard-card dashboard-card-coming"
            >

              <div className="dashboard-card-top">

                <div className="dashboard-card-icon">
                  💰
                </div>

              </div>


              <h3>
                Orçamento
              </h3>


              <p>
                Controle de gastos,
                pagamentos e valores
                pendentes.
              </p>


              <strong className="dashboard-card-link">
                Abrir orçamento →
              </strong>

            </Link>


            {/* CONVIDADOS */}

            <Link
              to="/convidados"
              className="dashboard-card dashboard-card-coming"
            >

              <div className="dashboard-card-top">

                <div className="dashboard-card-icon">
                  👥
                </div>

              </div>


              <h3>
                Convidados
              </h3>


              <p>
                Lista de convidados e
                controle de confirmações.
              </p>


              <strong className="dashboard-card-link">
                Ver convidados →
              </strong>

            </Link>


          </div>

        </div>

      </section>

    </main>
  );
}