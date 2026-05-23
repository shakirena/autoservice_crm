/**
 * Unit-тесты для ServiceTable.
 * Feature #57 — Story #59
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../../hooks/useServiceCatalog.js', () => ({
  useServices: vi.fn(),
  useCategories: vi.fn(),
  useArchiveService: vi.fn(),
}))

vi.mock('../VehicleComponentBadge.jsx', () => ({
  default: ({ component }) => <span data-testid={`badge-${component}`}>{component}</span>,
}))

import { useServices, useCategories, useArchiveService } from '../../../hooks/useServiceCatalog.js'
import ServiceTable from '../ServiceTable.jsx'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockCategories = [
  { id: 'cat1', name: 'Двигатель' },
  { id: 'cat2', name: 'Подвеска' },
]

const mockServices = [
  {
    id: 'svc1',
    name: 'Замена масла',
    categoryId: 'cat1',
    vehicleComponent: 'engine',
    price: 250,
    archived: false,
  },
  {
    id: 'svc2',
    name: 'Замена колодок',
    categoryId: 'cat2',
    vehicleComponent: null,
    price: null,
    archived: true,
  },
]

function setupMocks({
  servicesLoading = false,
  servicesError = false,
  services = mockServices,
  categories = mockCategories,
} = {}) {
  useServices.mockReturnValue({
    data: servicesError ? undefined : services,
    isLoading: servicesLoading,
    isError: servicesError,
    error: servicesError ? new Error('Firestore error') : null,
  })

  useCategories.mockReturnValue({
    data: categories,
    isLoading: false,
    isError: false,
  })

  useArchiveService.mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ServiceTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. Скелетон при загрузке
  it('показывает скелетон при isLoading=true', () => {
    setupMocks({ servicesLoading: true })
    render(<ServiceTable filters={{}} isAdmin={false} onEdit={vi.fn()} />)
    // При загрузке строки данных не рендерятся
    expect(screen.queryByTestId('service-table-row-svc1')).not.toBeInTheDocument()
    // таблица в DOM есть
    expect(screen.getByTestId('service-table')).toBeInTheDocument()
  })

  // 2. Ошибка
  it('показывает ошибку при isError=true', () => {
    setupMocks({ servicesError: true })
    render(<ServiceTable filters={{}} isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByText(/Ошибка загрузки услуг/i)).toBeInTheDocument()
  })

  // 3. Пустое состояние
  it('показывает "пусто" когда services=[]', () => {
    setupMocks({ services: [] })
    render(<ServiceTable filters={{}} isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByText('Услуги не найдены')).toBeInTheDocument()
  })

  // 4. Строки для каждой услуги
  it('рендерит строку таблицы для каждой услуги', () => {
    setupMocks()
    render(<ServiceTable filters={{}} isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByTestId('service-table-row-svc1')).toBeInTheDocument()
    expect(screen.getByTestId('service-table-row-svc2')).toBeInTheDocument()
  })

  // 5. Название услуги
  it('показывает название услуги', () => {
    setupMocks()
    render(<ServiceTable filters={{}} isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByTestId('service-table-name-svc1')).toHaveTextContent('Замена масла')
    expect(screen.getByTestId('service-table-name-svc2')).toHaveTextContent('Замена колодок')
  })

  // 6. Форматированная цена с ₼
  it('показывает форматированную цену с ₼', () => {
    setupMocks()
    render(<ServiceTable filters={{}} isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByTestId('service-table-price-svc1')).toHaveTextContent('₼')
    expect(screen.getByTestId('service-table-price-svc1')).toHaveTextContent('250')
  })

  // 7. "Не указана" при price=null
  it('показывает "Не указана" когда price=null', () => {
    setupMocks()
    render(<ServiceTable filters={{}} isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByTestId('service-table-price-svc2')).toHaveTextContent('Не указана')
  })

  // 8. Статус "Активна" для archived=false
  it('показывает "Активна" для archived=false', () => {
    setupMocks()
    render(<ServiceTable filters={{}} isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByTestId('service-table-status-svc1')).toHaveTextContent('Активна')
  })

  // 9. Статус "Архив" для archived=true
  it('показывает "Архив" для archived=true', () => {
    setupMocks()
    render(<ServiceTable filters={{}} isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByTestId('service-table-status-svc2')).toHaveTextContent('Архив')
  })

  // 10. Скрыты кнопки для не-admin
  it('скрывает кнопки действий для не-admin (isAdmin=false)', () => {
    setupMocks()
    render(<ServiceTable filters={{}} isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.queryByTestId('service-table-edit-svc1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('service-table-archive-svc1')).not.toBeInTheDocument()
  })

  // 11. Кнопка редактировать для admin
  it('показывает кнопку редактировать для admin (isAdmin=true)', () => {
    setupMocks()
    render(<ServiceTable filters={{}} isAdmin={true} onEdit={vi.fn()} />)
    expect(screen.getByTestId('service-table-edit-svc1')).toBeInTheDocument()
  })

  // 12. Вызывает onEdit при клике
  it('вызывает onEdit при клике на кнопку редактирования', async () => {
    setupMocks()
    const onEdit = vi.fn()
    render(<ServiceTable filters={{}} isAdmin={true} onEdit={onEdit} />)
    await userEvent.click(screen.getByTestId('service-table-edit-svc1'))
    expect(onEdit).toHaveBeenCalledWith(mockServices[0])
  })

  // 13. Категория по имени
  it('показывает категорию по имени (не по id)', () => {
    setupMocks()
    render(<ServiceTable filters={{}} isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByTestId('service-table-row-svc1')).toHaveTextContent('Двигатель')
    expect(screen.getByTestId('service-table-row-svc2')).toHaveTextContent('Подвеска')
  })
})
