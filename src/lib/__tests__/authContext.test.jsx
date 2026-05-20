import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../authContext.jsx'

// Mock firebase/auth
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
}))

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
}))

// Mock ../firebase.js
vi.mock('../firebase.js', () => ({
  auth: {},
  db: {},
}))

// Mock authService (logout used in signOut)
vi.mock('../../services/authService.js', () => ({
  logout: vi.fn(),
}))

import { onAuthStateChanged } from 'firebase/auth'
import { getDoc } from 'firebase/firestore'

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

  it('предоставляет user и role из Firestore после аутентификации', async () => {
    const mockUser = { uid: 'uid-1', email: 'admin@test.com' }

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: 'admin' }),
    })

    onAuthStateChanged.mockImplementation((_auth, callback) => {
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

  it('устанавливает role=client если поле role отсутствует в Firestore', async () => {
    const mockUser = { uid: 'uid-2', email: 'user@test.com' }

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({}),
    })

    onAuthStateChanged.mockImplementation((_auth, callback) => {
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

  it('устанавливает role=client если документ пользователя не существует', async () => {
    const mockUser = { uid: 'uid-3', email: 'new@test.com' }

    getDoc.mockResolvedValue({
      exists: () => false,
      data: () => null,
    })

    onAuthStateChanged.mockImplementation((_auth, callback) => {
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

  it('fallback role=client при ошибке Firestore', async () => {
    const mockUser = { uid: 'uid-4', email: 'error@test.com' }

    getDoc.mockRejectedValue(new Error('Firestore unavailable'))

    onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(mockUser)
      return () => {}
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('error@test.com')
      expect(screen.getByTestId('role')).toHaveTextContent('client')
    })
  })

  it('очищает user и role после выхода', async () => {
    onAuthStateChanged.mockImplementation((_auth, callback) => {
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
