import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DashboardPage from '../DashboardPage.jsx'

vi.mock('../../lib/authContext.jsx', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../../lib/authContext.jsx'

describe('DashboardPage', () => {
  it('показывает спиннер пока loading=true', () => {
    useAuth.mockReturnValue({ user: null, role: null, loading: true, signOut: vi.fn() })
    render(<DashboardPage />)
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument()
  })

  it('отображает email и роль пользователя после загрузки', () => {
    useAuth.mockReturnValue({
      user: { email: 'admin@crm.ru' },
      role: 'admin',
      loading: false,
      signOut: vi.fn(),
    })
    render(<DashboardPage />)
    expect(screen.getByTestId('dashboard-user-email')).toHaveTextContent('admin@crm.ru')
    expect(screen.getByTestId('dashboard-user-role')).toHaveTextContent('admin')
    expect(screen.getByTestId('dashboard-sign-out')).toBeInTheDocument()
  })

  it('показывает placeholder для всех ролей', () => {
    useAuth.mockReturnValue({
      user: { email: 'mech@crm.ru' },
      role: 'mechanic',
      loading: false,
      signOut: vi.fn(),
    })
    render(<DashboardPage />)
    expect(screen.getByTestId('dashboard-placeholder')).toHaveTextContent('mechanic')
  })
})
