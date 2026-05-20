// Feature #12: DashboardPage is now a redirect shim.
// Dashboard UI is tested via DashboardLayout, Header, Sidebar, and page components.
// This file is kept as a placeholder — add integration tests for DashboardLayout here.
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../lib/authContext.jsx', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../../lib/authContext.jsx'
import Header from '../../components/layout/Header.jsx'
import Sidebar from '../../components/layout/Sidebar.jsx'

describe('Header', () => {
  it('отображает email пользователя, роль и кнопку выхода', () => {
    useAuth.mockReturnValue({
      user: { email: 'admin@crm.ru', displayName: null },
      role: 'admin',
      loading: false,
      signOut: vi.fn(),
    })
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    expect(screen.getByTestId('header-user-email')).toHaveTextContent('admin@crm.ru')
    expect(screen.getByTestId('header-user-role')).toHaveTextContent('admin')
    expect(screen.getByTestId('header-sign-out')).toBeInTheDocument()
  })

  it('предпочитает displayName перед email', () => {
    useAuth.mockReturnValue({
      user: { email: 'admin@crm.ru', displayName: 'Иван' },
      role: 'admin',
      loading: false,
      signOut: vi.fn(),
    })
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    expect(screen.getByTestId('header-user-email')).toHaveTextContent('Иван')
  })
})

describe('Sidebar', () => {
  it('рендерит пункты меню для роли admin', () => {
    useAuth.mockReturnValue({ user: null, role: 'admin', loading: false, signOut: vi.fn() })
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar />
      </MemoryRouter>
    )
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('nav-item-users')).toBeInTheDocument()
    expect(screen.getByTestId('nav-item-orders')).toBeInTheDocument()
    expect(screen.getByTestId('nav-item-clients')).toBeInTheDocument()
    expect(screen.getByTestId('nav-item-settings')).toBeInTheDocument()
  })

  it('рендерит пустой sidebar для неизвестной роли', () => {
    useAuth.mockReturnValue({ user: null, role: 'unknown', loading: false, signOut: vi.fn() })
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )
    expect(screen.getByTestId('sidebar-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument()
  })

  it('рендерит только "Мои заказы" для роли mechanic', () => {
    useAuth.mockReturnValue({ user: null, role: 'mechanic', loading: false, signOut: vi.fn() })
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar />
      </MemoryRouter>
    )
    expect(screen.getByTestId('nav-item-my-orders')).toBeInTheDocument()
    expect(screen.queryByTestId('nav-item-orders')).not.toBeInTheDocument()
  })
})
