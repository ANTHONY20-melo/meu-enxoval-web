import { useCallback, useEffect, useState } from 'react';
import { platformService } from '../services/platform';

/**
 * Painel de acesso do casal: liberar a esposa/noivo pelo e-mail,
 * listar quem tem acesso e remover. Reutilizado pelo painel do
 * dono (AdminPage) e pelo modal de edição do super admin.
 */
export default function CoupleAccessPanel({ coupleId }) {
  const [email, setEmail] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadMembers = useCallback(async () => {
    if (!coupleId) return;

    const list = await platformService.listMembers(coupleId);
    setMembers(list);
    setLoading(false);
  }, [coupleId]);

  useEffect(() => {
    setLoading(true);
    loadMembers();
  }, [loadMembers]);

  const handleGrant = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setError('Informe o e-mail da esposa/noivo.');
      return;
    }

    setGranting(true);
    setMessage(null);
    setError(null);

    const result = await platformService.grantAccess(coupleId, email);

    if (!result.ok) {
      setError(
        result.error ||
          'Não foi possível liberar o acesso. Tente novamente.'
      );
      setGranting(false);
      return;
    }

    setEmail('');
    setMessage(
      `Acesso liberado para ${result.full_name || result.email || 'a conta informada'}.`
    );
    setGranting(false);
    await loadMembers();
  };

  const handleRevoke = async (member) => {
    if (member.is_owner) return;

    if (
      !window.confirm(
        `Remover o acesso de ${member.full_name || member.email}?`
      )
    ) {
      return;
    }

    setMessage(null);
    setError(null);

    const ok = await platformService.revokeAccess(member.user_id);

    if (!ok) {
      setError('Não foi possível remover o acesso.');
      return;
    }

    await loadMembers();
  };

  return (
    <div className="couple-access">
      <form className="admin-form couple-access-form" onSubmit={handleGrant}>
        <label className="admin-field">
          <span>E-mail da esposa/noivo para liberar</span>
          <input
            type="email"
            value={email}
            placeholder="exemplo@email.com"
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
            }}
          />
        </label>

        <button
          type="submit"
          className="admin-submit-button"
          disabled={granting || !email.trim()}
        >
          {granting ? 'Liberando...' : '🔓 Liberar acesso'}
        </button>
      </form>

      <p className="couple-access-hint">
        A pessoa precisa ter criado a conta no site primeiro. Depois de
        liberar, ela entra com o próprio e-mail e gerencia o site junto
        com você.
      </p>

      {message && <p className="admin-success">{message}</p>}
      {error && <p className="admin-error">{error}</p>}

      <div className="couple-access-members">
        <h4>Quem já tem acesso</h4>

        {loading ? (
          <p className="couple-access-empty">Carregando...</p>
        ) : members.length === 0 ? (
          <p className="couple-access-empty">
            Nenhum acesso liberado ainda.
          </p>
        ) : (
          <ul className="couple-access-list">
            {members.map((member) => (
              <li key={member.user_id} className="couple-access-item">
                <span className="couple-access-info">
                  <strong>
                    {member.full_name || member.email}
                  </strong>
                  <small>{member.email}</small>
                </span>

                {member.is_owner ? (
                  <span className="couple-access-badge">👑 Dono</span>
                ) : (
                  <button
                    type="button"
                    className="couple-access-remove"
                    onClick={() => handleRevoke(member)}
                  >
                    Remover
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
