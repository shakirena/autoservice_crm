import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockDeleteCategory = vi.fn()

vi.mock('../../../hooks/useServiceCatalog.js', () => ({
  useCategories: vi.fn(),
  useDeleteCategory: vi.fn(),
}))

import { useCategories, useDeleteCategory } from '../../../hooks/useServiceCatalog.js'
import CategoryTable from '../CategoryTable.jsx'

// ── Fixtures ───────────────────────────────────────────────────────────────────

const mockCategories = [
  { id: 'cat1', name: 'Двигатель ТО', description: 'Обслуживание двигателя', vehicleComponent: 'engine' },
  { id: 'cat2', name: 'Тормоза', description: '', vehicleComponent: 'brakes' },
]

function setupHooks({ categories = mockCategories, isLoading = false, isError = false, error = null } = {}) {
  useCategories.mockReturnValue({ data: categories, isLoading, isError, error })
  useDeleteCategory.mockReturnValue({ mutateAsync: mockDeleteCategory, isPending: false })
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('CategoryTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDeleteCategory.mockResolvedValue(undefined)
  })

  // ── Состояния ──────────────────────────────────────────────────────────────

  it('показывает skeleton-строки при загрузке', () => {
    setupHooks({ isLoading: true, categories: [] })
    render(<CategoryTable isAdmin={false} onEdit={vi.fn()} />)
    // skeleton ячейки рендерятся как <td> с div внутри — таблица присутствует
    expect(screen.getByTestId('category-table-wrap')).toBeInTheDocument()
  })

  it('показывает ошибку при isError=true', () => {
    setupHooks({ isError: true, error: { message: 'Firestore error' }, categories: [] })
    render(<CategoryTable isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByTestId('category-table-error')).toBeInTheDocument()
    expect(screen.getByTestId('category-table-error')).toHaveTextContent('Firestore error')
  })

  it('показывает пустое состояние когда нет категорий', () => {
    setupHooks({ categories: [] })
    render(<CategoryTable isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByTestId('category-table-empty')).toBeInTheDocument()
    expect(screen.getByTestId('category-table-empty')).toHaveTextContent('Категории не добавлены')
  })

  // ── Рендер данных ──────────────────────────────────────────────────────────

  it('рендерит строку для каждой категории', () => {
    setupHooks()
    render(<CategoryTable isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByTestId('category-table-row-cat1')).toBeInTheDocument()
    expect(screen.getByTestId('category-table-row-cat2')).toBeInTheDocument()
  })

  it('показывает название категории', () => {
    setupHooks()
    render(<CategoryTable isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByTestId('category-table-name-cat1')).toHaveTextContent('Двигатель ТО')
  })

  it('показывает описание категории', () => {
    setupHooks()
    render(<CategoryTable isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByTestId('category-table-description-cat1')).toHaveTextContent('Обслуживание двигателя')
  })

  it('показывает «—» если описание пустое', () => {
    setupHooks()
    render(<CategoryTable isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByTestId('category-table-description-cat2')).toHaveTextContent('—')
  })

  it('показывает локализованное название узла', () => {
    setupHooks()
    render(<CategoryTable isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByTestId('category-table-component-cat1')).toHaveTextContent('Двигатель')
    expect(screen.getByTestId('category-table-component-cat2')).toHaveTextContent('Тормоза')
  })

  // ── Admin / не-admin ───────────────────────────────────────────────────────

  it('скрывает кнопки действий для не-admin', () => {
    setupHooks()
    render(<CategoryTable isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.queryByTestId('category-table-edit-cat1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('category-table-delete-cat1')).not.toBeInTheDocument()
  })

  it('показывает кнопки действий для admin', () => {
    setupHooks()
    render(<CategoryTable isAdmin={true} onEdit={vi.fn()} />)
    expect(screen.getByTestId('category-table-edit-cat1')).toBeInTheDocument()
    expect(screen.getByTestId('category-table-delete-cat1')).toBeInTheDocument()
  })

  // ── Действия ───────────────────────────────────────────────────────────────

  it('вызывает onEdit с объектом категории при клике Редактировать', async () => {
    setupHooks()
    const onEdit = vi.fn()
    render(<CategoryTable isAdmin={true} onEdit={onEdit} />)
    await userEvent.click(screen.getByTestId('category-table-edit-cat1'))
    expect(onEdit).toHaveBeenCalledWith(mockCategories[0])
  })

  it('вызывает deleteCategory при клике Удалить', async () => {
    setupHooks()
    render(<CategoryTable isAdmin={true} onEdit={vi.fn()} />)
    await userEvent.click(screen.getByTestId('category-table-delete-cat1'))
    expect(mockDeleteCategory).toHaveBeenCalledWith('cat1')
  })

  it('показывает ошибку удаления если deleteCategory бросает исключение', async () => {
    setupHooks()
    mockDeleteCategory.mockRejectedValue(new Error('Нельзя удалить категорию: есть активные услуги'))
    render(<CategoryTable isAdmin={true} onEdit={vi.fn()} />)
    await userEvent.click(screen.getByTestId('category-table-delete-cat1'))
    await waitFor(() => {
      expect(screen.getByTestId('category-table-delete-error')).toHaveTextContent('Нельзя удалить категорию')
    })
  })

  // ── Hover ─────────────────────────────────────────────────────────────────

  it('меняет цвет строки при hover', () => {
    setupHooks()
    render(<CategoryTable isAdmin={false} onEdit={vi.fn()} />)
    const row = screen.getByTestId('category-table-row-cat1')
    fireEvent.mouseEnter(row)
    expect(row.style.background).toBe('rgb(239, 246, 255)') // #eff6ff
    fireEvent.mouseLeave(row)
    expect(row.style.background).toBe('rgb(255, 255, 255)') // #ffffff (index 0)
  })
})
