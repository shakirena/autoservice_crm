import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../LoginPage.jsx'

// Mock authService so we don't hit Firebase
vi.mock('../../services/authService.js', () => ({
  loginWithEmail: vi.fn(),
}))

import { loginWithEmail } from '../../services/authService.js'

function renderPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('отображает заголовок и подзаголовок', () => {
    renderPage()
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(screen.getByTestId('login-title')).toHaveTextContent('AutoService CRM')
    expect(screen.getByTestId('login-subtitle')).toBeInTheDocument()
  })

  it('отображает поля email и пароль и кнопку', () => {
    renderPage()
    expect(screen.getByTestId('login-email-input')).toBeInTheDocument()
    expect(screen.getByTestId('login-password-input')).toBeInTheDocument()
    expect(screen.getByTestId('login-submit-button')).toBeInTheDocument()
  })

  it('показывает ошибку валидации если форма отправлена пустой', async () => {
    renderPage()
    await userEvent.click(screen.getByTestId('login-submit-button'))
    await waitFor(() => {
      expect(screen.getByTestId('login-email-error')).toBeInTheDocument()
      expect(screen.getByTestId('login-password-error')).toBeInTheDocument()
    })
  })

  it('показывает ошибку валидации при некорректном email', async () => {
    renderPage()
    await userEvent.type(screen.getByTestId('login-email-input'), 'notanemail')
    await userEvent.type(screen.getByTestId('login-password-input'), 'password123')
    await userEvent.click(screen.getByTestId('login-submit-button'))
    await waitFor(() => {
      expect(screen.getByTestId('login-email-error')).toBeInTheDocument()
    })
  })

  it('показывает ошибку если пароль короче 6 символов', async () => {
    renderPage()
    await userEvent.type(screen.getByTestId('login-email-input'), 'user@test.com')
    await userEvent.type(screen.getByTestId('login-password-input'), '123')
    await userEvent.click(screen.getByTestId('login-submit-button'))
    await waitFor(() => {
      expect(screen.getByTestId('login-password-error')).toBeInTheDocument()
    })
  })

  it('вызывает loginWithEmail с корректными данными', async () => {
    loginWithEmail.mockResolvedValue({})
    renderPage()
    await userEvent.type(screen.getByTestId('login-email-input'), 'admin@test.com')
    await userEvent.type(screen.getByTestId('login-password-input'), 'secret123')
    await userEvent.click(screen.getByTestId('login-submit-button'))
    await waitFor(() => {
      expect(loginWithEmail).toHaveBeenCalledWith('admin@test.com', 'secret123')
    })
  })

  it('отображает Firebase ошибку на русском при неверных данных', async () => {
    const error = new Error('Firebase: auth/invalid-credential')
    error.code = 'auth/invalid-credential'
    loginWithEmail.mockRejectedValue(error)

    renderPage()
    await userEvent.type(screen.getByTestId('login-email-input'), 'user@test.com')
    await userEvent.type(screen.getByTestId('login-password-input'), 'wrongpass')
    await userEvent.click(screen.getByTestId('login-submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('login-server-error')).toHaveTextContent(
        'Неверный email или пароль'
      )
    })
  })

  it('отображает сообщение при too-many-requests', async () => {
    const error = new Error()
    error.code = 'auth/too-many-requests'
    loginWithEmail.mockRejectedValue(error)

    renderPage()
    await userEvent.type(screen.getByTestId('login-email-input'), 'user@test.com')
    await userEvent.type(screen.getByTestId('login-password-input'), 'somepassword')
    await userEvent.click(screen.getByTestId('login-submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('login-server-error')).toHaveTextContent(
        'Слишком много попыток'
      )
    })
  })

  it('кнопка disabled и spinner видны во время загрузки', async () => {
    // loginWithEmail hangs — never resolves during test
    loginWithEmail.mockImplementation(() => new Promise(() => {}))

    renderPage()
    await userEvent.type(screen.getByTestId('login-email-input'), 'user@test.com')
    await userEvent.type(screen.getByTestId('login-password-input'), 'password123')
    await userEvent.click(screen.getByTestId('login-submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('login-submit-button')).toBeDisabled()
      expect(screen.getByTestId('login-spinner')).toBeInTheDocument()
    })
  })
})
