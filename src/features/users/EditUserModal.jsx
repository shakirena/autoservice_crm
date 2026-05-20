import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useUpdateUserRole } from '../../hooks/useUsers.js'

/**
 * Модальное окно редактирования роли сотрудника.
 *
 * @param {{
 *   user: import('../../services/usersService.js').UserDoc,
 *   currentUid: string,
 *   onClose: () => void,
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

const modalStyle = {
  background: '#fff',
  borderRadius: '8px',
  padding: '28px',
  maxWidth: '440px',
  width: '100%',
  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
}

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginBottom: '16px',
}

const labelStyle = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#374151',
}

const inputStyle = {
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  background: '#f9fafb',
  color: '#6b7280',
}

const selectStyle = {
  ...inputStyle,
  background: '#fff',
  color: '#111827',
  cursor: 'pointer',
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

function EditUserModal({ user, currentUid, onClose }) {
  const isSelf = user.uid === currentUid
  const { mutateAsync, isPending } = useUpdateUserRole()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
  } = useForm({ defaultValues: { role: user.role } })

  // Сброс формы при смене пользователя
  useEffect(() => {
    reset({ role: user.role })
  }, [user.uid, user.role, reset])

  async function onSubmit(values) {
    if (values.role === user.role) {
      onClose()
      return
    }
    try {
      await mutateAsync({ uid: user.uid, role: values.role })
      onClose()
    } catch (err) {
      setError('root', { message: err.message ?? 'Ошибка сохранения. Попробуйте снова' })
    }
  }

  return (
    <div data-testid="modal-edit-user" style={overlayStyle}>
      <div style={modalStyle} role="dialog" aria-modal="true">
        <h3 style={{ marginTop: 0 }}>Редактировать сотрудника</h3>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Email — только для чтения */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Email</label>
            <input
              data-testid="edit-user-email"
              type="email"
              value={user.email}
              readOnly
              style={inputStyle}
            />
          </div>

          {/* DisplayName — только для чтения */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Имя</label>
            <input
              type="text"
              value={user.displayName}
              readOnly
              style={inputStyle}
            />
          </div>

          {/* Роль */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="edit-role">
              Роль
            </label>
            <select
              id="edit-role"
              data-testid="edit-user-role"
              disabled={isSelf}
              style={{ ...selectStyle, opacity: isSelf ? 0.5 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}
              {...register('role', { required: true })}
            >
              <option value="manager">Менеджер</option>
              <option value="mechanic">Механик</option>
              <option value="admin">Администратор</option>
            </select>
            {isSelf && (
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                Нельзя изменить собственную учётную запись
              </span>
            )}
          </div>

          {/* Серверная ошибка */}
          {errors.root && (
            <p style={{ color: '#dc2626', fontSize: '13px', margin: '0 0 12px' }}>
              {errors.root.message}
            </p>
          )}

          <div style={footerStyle}>
            <button
              data-testid="edit-user-cancel"
              type="button"
              onClick={onClose}
              disabled={isPending}
              style={{ ...btnBaseStyle, background: '#f3f4f6', color: '#374151' }}
            >
              Отмена
            </button>
            <button
              data-testid="edit-user-submit"
              type="submit"
              disabled={isPending || isSelf}
              style={{
                ...btnBaseStyle,
                background: '#2563eb',
                color: '#fff',
                opacity: isPending || isSelf ? 0.6 : 1,
              }}
            >
              {isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditUserModal
