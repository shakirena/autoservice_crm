import { render, screen, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../authContext.jsx'

// Мок firebase/auth
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
}))

// Мок ../firebase.js
vi.mock('../firebase.js', () => ({
  auth: {},
}))

import { onAuthStateChanged, signOut } from 'firebase/auth'

function TestConsumer() {
  const { user, role, loading } = useAuth()
  if (loading) return <div data-testid="loading">loading</div>
  return (
    <div>
      <span data-testid="user">{user ? user.email : 'null'}</span>
      <span data-testid="role">{role ?? 'null'}</span>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('показывает loading при инициализации', () => {
    onAuthStateChanged.mockImplementation(() => () => {})
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  it('предоставляет user и role после аутентификации', async () => {
    const mockUser = {
      email: 'admin@test.com',
      getIdTokenResult: vi.fn().mockResolvedValue({
        claims: { role: 'admin' },
      }),
    }
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser)
      return () => {}
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('admin@test.com')
      expect(screen.getByTestId('role')).toHaveTextContent('admin')
    })
  })

  it('устанавливает role=client если claim отсутствует', async () => {
    const mockUser = {
      email: 'user@test.com',
      getIdTokenResult: vi.fn().mockResolvedValue({ claims: {} }),
    }
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser)
      return () => {}
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('role')).toHaveTextContent('client')
    })
  })

  it('очищает user и role после выхода', async () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null)
      return () => {}
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null')
      expect(screen.getByTestId('role')).toHaveTextContent('null')
    })
  })

  it('useAuth бросает ошибку вне AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow(
      'useAuth must be used inside <AuthProvider>'
    )
    spy.mockRestore()
  })
})
