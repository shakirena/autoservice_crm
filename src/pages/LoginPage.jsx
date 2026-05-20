import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { loginWithEmail } from '../services/authService.js'

/**
 * Map Firebase Auth error codes to human-readable Russian messages.
 *
 * @param {string} code
 * @returns {string}
 */
function mapFirebaseError(code) {
  const messages = {
    'auth/user-not-found': 'Пользователь с таким email не найден',
    'auth/wrong-password': 'Неверный пароль',
    'auth/invalid-credential': 'Неверный email или пароль',
    'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже',
    'auth/user-disabled': 'Аккаунт заблокирован. Обратитесь к администратору',
    'auth/network-request-failed': 'Ошибка сети. Проверьте подключение к интернету',
  }
  return messages[code] ?? 'Ошибка входа. Попробуйте ещё раз'
}

function LoginPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit({ email, password }) {
    setServerError('')
    try {
      await loginWithEmail(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setServerError(mapFirebaseError(err.code))
    }
  }

  return (
    <main data-testid="login-page">
      <h1 data-testid="login-title">AutoService CRM</h1>
      <p data-testid="login-subtitle">Войдите в систему</p>

      <form
        data-testid="login-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        {/* Email field */}
        <div data-testid="login-email-field">
          <label htmlFor="email" data-testid="login-email-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            data-testid="login-email-input"
            autoComplete="email"
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email', {
              required: 'Email обязателен',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Введите корректный email',
              },
            })}
          />
          {errors.email && (
            <span
              id="email-error"
              role="alert"
              data-testid="login-email-error"
            >
              {errors.email.message}
            </span>
          )}
        </div>

        {/* Password field */}
        <div data-testid="login-password-field">
          <label htmlFor="password" data-testid="login-password-label">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            data-testid="login-password-input"
            autoComplete="current-password"
            disabled={isSubmitting}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password', {
              required: 'Пароль обязателен',
              minLength: {
                value: 6,
                message: 'Пароль должен содержать не менее 6 символов',
              },
            })}
          />
          {errors.password && (
            <span
              id="password-error"
              role="alert"
              data-testid="login-password-error"
            >
              {errors.password.message}
            </span>
          )}
        </div>

        {/* Server / Firebase error */}
        {serverError && (
          <div
            role="alert"
            data-testid="login-server-error"
          >
            {serverError}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          data-testid="login-submit-button"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span
                data-testid="login-spinner"
                aria-hidden="true"
              >
                ⏳
              </span>
              {' Вход...'}
            </>
          ) : (
            'Войти'
          )}
        </button>
      </form>
    </main>
  )
}

export default LoginPage
