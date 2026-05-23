/**
 * Unit-тесты для OrderTable.
 * Feature #57 — Story #60
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

import OrderTable from '../OrderTable.jsx'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockClients = [
  { id: 'c1', fullName: 'Иван Иванов' },
  { id: 'c2', fullName: 'Мария Петрова' },
]

const mockVehicles = [
  { id: 'v1', make: 'Toyota', model: 'Camry' },
  { id: 'v2', make: 'BMW', model: 'X5' },
]

const mockOrders = [
  {
    id: 'o1',
    clientId: 'c1',
    vehicleId: 'v1',
    status: 'completed',
    totalAmount: 1500,
    createdAt: null,
    date: '15.05.2025',
  },
  {
    id: 'o2',
    clientId: 'c2',
    vehicleId: 'v2',
    status: 'draft',
    totalAmount: 800,
    createdAt: null,
    date: '16.05.2025',
  },
  {
    id: 'o3',
    clientId: 'c1',
    vehicleId: 'v1',
    status: 'in_progress',
    totalAmount: null,
    createdAt: null,
    date: '17.05.2025',
  },
]

const defaultProps = {
  orders: mockOrders,
  clients: mockClients,
  vehicles: mockVehicles,
  isLoading: false,
  isError: false,
  error: null,
  statusFilter: '',
  onAddFirst: undefined,
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('OrderTable', () => {
  beforeEach(() => vi.clearAllMocks())

  // 1. Скелетон при загрузке
  it('показывает скелетон при isLoading=true', () => {
    render(<OrderTable {...defaultProps} isLoading={true} orders={[]} />)
    // строки данных не появляются
    expect(screen.queryByTestId('order-table-row-o1')).not.toBeInTheDocument()
    // таблица в DOM
    expect(screen.getByTestId('order-table')).toBeInTheDocument()
  })

  // 2. Ошибка
  it('показывает ошибку при isError=true', () => {
    render(
      <OrderTable
        {...defaultProps}
        orders={[]}
        isError={true}
        error={new Error('Firestore error')}
      />,
    )
    expect(screen.getByText(/Ошибка загрузки заказов/i)).toBeInTheDocument()
  })

  // 3. Пустое состояние
  it('показывает пустое состояние при orders=[]', () => {
    render(<OrderTable {...defaultProps} orders={[]} />)
    expect(screen.getByText('Заказов пока нет.')).toBeInTheDocument()
  })

  // 4. Строки таблицы
  it('рендерит строки с data-testid order-table-row-{id}', () => {
    render(<OrderTable {...defaultProps} />)
    expect(screen.getByTestId('order-table-row-o1')).toBeInTheDocument()
    expect(screen.getByTestId('order-table-row-o2')).toBeInTheDocument()
    expect(screen.getByTestId('order-table-row-o3')).toBeInTheDocument()
  })

  // 5. Порядковый номер
  it('показывает порядковый номер (1, 2, 3...)', () => {
    render(<OrderTable {...defaultProps} />)
    const rows = document.querySelectorAll('[data-testid^="order-table-row-"]')
    // первая td в каждой строке — порядковый номер
    expect(rows[0].querySelector('td')).toHaveTextContent('1')
    expect(rows[1].querySelector('td')).toHaveTextContent('2')
    expect(rows[2].querySelector('td')).toHaveTextContent('3')
  })

  // 6. Статус badge
  it('показывает статус badge (data-testid order-table-status-{id})', () => {
    render(<OrderTable {...defaultProps} />)
    expect(screen.getByTestId('order-table-status-o1')).toBeInTheDocument()
    expect(screen.getByTestId('order-table-status-o2')).toBeInTheDocument()
  })

  // 7. Сумма с ₼
  it('показывает сумму с ₼ (data-testid order-table-total-{id})', () => {
    render(<OrderTable {...defaultProps} />)
    expect(screen.getByTestId('order-table-total-o1')).toHaveTextContent('₼')
    expect(screen.getByTestId('order-table-total-o1')).toHaveTextContent('1')
  })

  // 8. Кнопка "Открыть" присутствует
  it('кнопка "Открыть" присутствует для каждого заказа', () => {
    render(<OrderTable {...defaultProps} />)
    expect(screen.getByTestId('order-table-open-o1')).toBeInTheDocument()
    expect(screen.getByTestId('order-table-open-o2')).toBeInTheDocument()
    expect(screen.getByTestId('order-table-open-o3')).toBeInTheDocument()
  })

  // 9. Статус "completed" — зелёный badge
  it('статус "completed" отображается зелёным badge', () => {
    render(<OrderTable {...defaultProps} />)
    const badge = screen.getByTestId('order-table-status-o1').querySelector('span')
    expect(badge).toHaveTextContent('Выполнен')
    expect(badge).toHaveStyle({ background: '#d1fae5' })
  })

  // 10. Статус "draft" — серый badge
  it('статус "draft" отображается серым badge', () => {
    render(<OrderTable {...defaultProps} />)
    const badge = screen.getByTestId('order-table-status-o2').querySelector('span')
    expect(badge).toHaveTextContent('Черновик')
    expect(badge).toHaveStyle({ background: '#f3f4f6' })
  })

  // 11. Кнопка "Открыть" вызывает navigate
  it('клик на "Открыть" вызывает navigate с id заказа', async () => {
    render(<OrderTable {...defaultProps} />)
    await userEvent.click(screen.getByTestId('order-table-open-o1'))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/orders/o1')
  })

  // 12. Фильтрация по statusFilter
  it('фильтрует заказы по statusFilter', () => {
    render(<OrderTable {...defaultProps} statusFilter="draft" />)
    expect(screen.getByTestId('order-table-row-o2')).toBeInTheDocument()
    expect(screen.queryByTestId('order-table-row-o1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('order-table-row-o3')).not.toBeInTheDocument()
  })

  // 13. totalAmount=null показывает "—"
  it('показывает "—" когда totalAmount=null', () => {
    render(<OrderTable {...defaultProps} />)
    expect(screen.getByTestId('order-table-total-o3')).toHaveTextContent('—')
  })
})
