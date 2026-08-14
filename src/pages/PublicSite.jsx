import {
  useState,
} from "react";

import {
  Link,
} from "react-router";

import { useCouple }
  from "../context/CoupleContext";

import { useAuth }
  from "../context/AuthContext";

import ChecklistPage
  from "../components/ChecklistPage";

import { enxovalConfig }
  from "../data/checklistConfigs";


/**
 * Página pública de um casal (rota "/:slug").
 *
 * - Carrega o casal pelo slug (get_couple_by_slug).
 * - Mostra o hero com nomes, data e PIX.
 * - Renderiza o enxoval em modo convidado
 *   (reserva de presentes pelo nome).
 */
export default function PublicSite() {
  const {
    couple,
    loading,
  } = useCouple();

  const { isAdmin } = useAuth();

  const [copied, setCopied] =
    useState(false);


  function formatDate(iso) {
    if (!iso) {
      return "";
    }

    try {
      const date = new Date(
        `${iso}T12:00:00`
      );

      return date.toLocaleDateString(
        "pt-BR",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      );
    } catch {
      return "";
    }
  }


  async function copyPix() {
    const pixKey =
      couple?.pix_key?.trim();

    if (!pixKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        pixKey
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // clipboard bloqueado: mostra a chave
      // selecionável (já está no DOM)
    }
  }


  if (loading) {
    return (
      <main className="public-site">
        <div className="container">
          <div className="dashboard-loading">
            Carregando... 💍
          </div>
        </div>
      </main>
    );
  }


  if (!couple) {
    return (
      <main className="public-site">
        <section className="public-hero">
          <div className="container">
            <span className="checklist-label">
              🔍 Site não encontrado
            </span>

            <h1>
              Este link não existe.
            </h1>

            <p>
              O endereço pode ter mudado ou o
              site do casal ainda não foi criado.
            </p>

            <Link
              className="admin-submit-button"
              to="/"
            >
              Voltar ao início
            </Link>
          </div>
        </section>
      </main>
    );
  }


  const names =
    couple.couple_names || {};

  const noiva =
    names.noiva || "Noiva";

  const noivo =
    names.noivo || "Noivo";

  const weddingDate =
    formatDate(couple.wedding_date);

  const pixKey =
    couple.pix_key?.trim() || "";


  return (
    <div className="public-site">

      {/* HERO DO CASAL */}

      <section className="public-hero">

        <div className="container">

          <div className="public-hero-top">

            <span className="eyebrow">
              💍 Nosso casamento
            </span>

            <span className="public-hero-names">
              {noiva}
              <span className="public-hero-amp">
                &amp;
              </span>
              {noivo}
            </span>

            {weddingDate && (
              <p className="public-hero-date">
                📅 {weddingDate}
              </p>
            )}

            <p className="public-hero-invite">
              Ficamos muito felizes com a sua
              presença! Escolha um presente
              abaixo e escreva seu nome para
              reservá-lo. 💝
            </p>

          </div>


          {/* PIX */}

          {pixKey && (
            <div className="public-pix-card">

              <div className="public-pix-info">

                <span className="public-pix-label">
                  💠 Contribuição via PIX
                </span>

                <code className="public-pix-key">
                  {pixKey}
                </code>

              </div>

              <button
                type="button"
                className="public-pix-copy"
                onClick={copyPix}
              >
                {copied ? "✓ Copiado!" : "Copiar chave"}
              </button>

            </div>
          )}


          {/* ADMIN: link para o painel */}

          {isAdmin && (
            <div className="public-admin-link">
              <Link to="/dashboard">
                ← Voltar ao painel
              </Link>
            </div>
          )}

        </div>

      </section>


      {/* ENXOVAL DO CASAL (modo convidado) */}

      <ChecklistPage
        config={enxovalConfig}
      />

    </div>
  );
}
