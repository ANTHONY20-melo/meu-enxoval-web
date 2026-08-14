import { useState } from 'react';
import { platformService } from '../services/platform';
import CoupleAccessPanel from './CoupleAccessPanel';

/**
 * Modal de edição de usuário (super admin):
 * - Sem casal: avisa para usar "➕ Criar site".
 * - Com casal: edita dados do site (nomes, data, PIX) e
 *   libera/remove o acesso da esposa/noivo (CoupleAccessPanel).
 */
export default function EditUserModal({ user, onClose, onChanged }) {
  const names = user.couple_names || {
    noiva: '',
    noivo: '',
  };

  const [noiva, setNoiva] = useState(names.noiva || '');
  const [noivo, setNoivo] = useState(names.noivo || '');
  const [date, setDate] = useState(
    user.couple_wedding_date || ''
  );
  const [pix, setPix] = useState(user.pix_key || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  const handleSave = async (event) => {
    event.preventDefault();

    if (!user.couple_id) return;

    if (!noiva.trim() || !noivo.trim()) {
      setError('Preencha os nomes da noiva e do noivo.');
      return;
    }

    setSaving(true);
    setSaved('');
    setError('');

    const ok = await platformService.updateCouple(
      user.couple_id,
      { noiva: noiva.trim(), noivo: noivo.trim() },
      date,
      pix.trim()
    );

    setSaving(false);

    if (!ok) {
      setError('Não foi possível salvar as alterações.');
      return;
    }

    setSaved('Site atualizado com sucesso!');
    onChanged();
  };

  return (
    <div
      className="eu-modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="eu-modal-card" role="dialog" aria-modal="true">
        <div className="eu-modal-header">
          <h3>✏️ Editar usuário</h3>
          <button
            type="button"
            className="eu-modal-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="eu-modal-body">
          <div className="eu-user-summary">
            <strong>{user.full_name || user.email}</strong>
            <span>{user.email}</span>
            {user.couple_slug && (
              <span className="admin-user-couple">
                💍 {user.couple_names
                  ? `${user.couple_names.noiva} & ${user.couple_names.noivo}`
                  : ''}{' '}
                (/{user.couple_slug})
              </span>
            )}
          </div>

          {!user.couple_id ? (
            <p className="admin-hint">
              Este usuário ainda não tem site. Use o botão
              “➕ Criar site” na lista para criar o site dele.
            </p>
          ) : (
            <>
              <form className="admin-form" onSubmit={handleSave}>
                <h4>Dados do site</h4>

                <div className="admin-form-row">
                  <label className="admin-field">
                    <span>Nome da noiva</span>
                    <input
                      type="text"
                      value={noiva}
                      onChange={(event) => {
                        setNoiva(event.target.value);
                        setError('');
                      }}
                    />
                  </label>

                  <label className="admin-field">
                    <span>Nome do noivo</span>
                    <input
                      type="text"
                      value={noivo}
                      onChange={(event) => {
                        setNoivo(event.target.value);
                        setError('');
                      }}
                    />
                  </label>
                </div>

                <label className="admin-field">
                  <span>Data do casamento</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => {
                      setDate(event.target.value);
                      setError('');
                    }}
                  />
                </label>

                <label className="admin-field">
                  <span>Chave PIX (opcional)</span>
                  <input
                    type="text"
                    value={pix}
                    placeholder="Chave para contribuições"
                    onChange={(event) => {
                      setPix(event.target.value);
                      setError('');
                    }}
                  />
                </label>

                {saved && <p className="admin-success">{saved}</p>}
                {error && <p className="admin-error">{error}</p>}

                <button
                  type="submit"
                  className="admin-submit-button"
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : '💾 Salvar alterações'}
                </button>
              </form>

              <div className="eu-access-section">
                <h4>💞 Liberar acesso para a esposa/noivo</h4>
                <CoupleAccessPanel coupleId={user.couple_id} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
