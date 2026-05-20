/**
 * Диалог подтверждения блокировки/разблокировки пользователя.
 *
 * @param {{
 *   user: import('../../services/usersService.js').UserDoc,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 *   isPending: boolean,
 * }} props
 */

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

const dialogStyle = {
  background: '#fff',
  borderRadius: '8px',
  padding: '24px',
  maxWidth: '420px',
  width: '100%',
  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
}

const footerStyle = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
  marginTop: '20px',
}

const btnBaseStyle = {
  padding: '8px 16px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
}

function ConfirmBlockModal({ user, onConfirm, onCancel, isPending }) {
  const isBlocking = !user.disabled

  return (
    <div data-testid="modal-confirm-block" style={overlayStyle}>
      <div style={dialogStyle} role="dialog" aria-modal="true">
        <h3 style={{ marginTop: 0 }}>
          {isBlocking ? 'Заблокировать пользователя' : 'Разблокировать пользователя'}
        </h3>
        <p style={{ color: '#374151', lineHeight: 1.6 }}>
          {isBlocking
            ? `Вы уверены, что хотите заблокировать ${user.displayName}? Пользователь потеряет доступ при следующем обновлении сессии.`
            : `Разблокировать ${user.displayName}? Пользователь снова получит доступ к системе.`}
        </p>

        <div style={footerStyle}>
          <button
            data-testid="confirm-block-cancel"
            type="button"
            onClick={onCancel}
            disabled={isPending}
            style={{ ...btnBaseStyle, background: '#f3f4f6', color: '#374151' }}
          >
            Отмена
          </button>
          <button
            data-testid="confirm-block-ok"
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            style={{
              ...btnBaseStyle,
              background: isBlocking ? '#dc2626' : '#059669',
              color: '#fff',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending
              ? 'Сохранение...'
              : isBlocking
              ? 'Заблокировать'
              : 'Разблокировать'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmBlockModal
