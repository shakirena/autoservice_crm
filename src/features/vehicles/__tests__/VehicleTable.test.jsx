/**
 * Unit-тесты для VehicleTable.
 * Feature #57 — Story #59
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// VehicleTable принимает данные как props (не вызывает хуки сам),
// поэтому моки хуков не нужны — просто передаём данные напрямую.

import VehicleTable from '../VehicleTable.jsx'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockClients = [
  { id: 'client1', fullName: 'Иван Иванов' },
  { id: 'client2', fullName: 'Мария Петрова' },
]

const mockVehicles = [
  {
    id: 'v1',
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    licensePlate: '10-AA-001',
    vin: 'JT2BF22K1Y0301234',
    clientId: 'client1',
  },
  {
    id: 'v2',
    make: 'BMW',
    model: 'X5',
    year: 2019,
    licensePlate: '77-BB-777',
    vin: 'WBAKS8105NLG12345',
    clientId: 'client2',
  },
]

const defaultProps = {
  vehicles: mockVehicles,
  clients: mockClients,
  role: 'mechanic',
  isLoading: false,
  search: '',
  onEdit: vi.fn(),
  onAddFirst: vi.fn(),
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VehicleTable', () => {
  beforeEach(() => vi.clearAllMocks())

  // 1. Загрузка — скелетон
  it('показывает скелетон при isLoading=true', () => {
    render(<VehicleTable {...defaultProps} isLoading={true} vehicles={[]} />)
    expect(screen.getByTestId('vehicles-skeleton')).toBeInTheDocument()
  })

  // 2. Ошибка (VehiclesPage обрабатывает ошибку сама, VehicleTable получает пустой массив)
  it('показывает пустое состояние когда vehicles=[] и не загружается', () => {
    render(<VehicleTable {...defaultProps} vehicles={[]} />)
    expect(screen.getByTestId('vehicles-empty')).toBeInTheDocument()
  })

  // 3. Пустой список
  it('показывает сообщение об отсутствии при пустом списке', () => {
    render(<VehicleTable {...defaultProps} vehicles={[]} role="admin" />)
    // canWrite=true → показывает кнопку "Добавить первый автомобиль"
    expect(screen.getByText(/Автомобилей пока нет/)).toBeInTheDocument()
  })

  // 4. Строки с data-testid
  it('рендерит строки с data-testid vehicle-table-row-{id}', () => {
    render(<VehicleTable {...defaultProps} />)
    expect(screen.getByTestId('vehicle-table-row-v1')).toBeInTheDocument()
    expect(screen.getByTestId('vehicle-table-row-v2')).toBeInTheDocument()
  })

  // 5. Марка и модель в одной колонке
  it('показывает марку и модель в одной колонке', () => {
    render(<VehicleTable {...defaultProps} />)
    expect(screen.getByTestId('vehicle-table-make-model-v1')).toHaveTextContent('Toyota')
    expect(screen.getByTestId('vehicle-table-make-model-v1')).toHaveTextContent('Camry')
  })

  // 6. Год
  it('показывает год (data-testid vehicle-table-year-{id})', () => {
    render(<VehicleTable {...defaultProps} />)
    expect(screen.getByTestId('vehicle-table-year-v1')).toHaveTextContent('2020')
    expect(screen.getByTestId('vehicle-table-year-v2')).toHaveTextContent('2019')
  })

  // 7. Гос. номер
  it('показывает гос. номер (data-testid vehicle-table-plate-{id})', () => {
    render(<VehicleTable {...defaultProps} />)
    expect(screen.getByTestId('vehicle-table-plate-v1')).toHaveTextContent('10-AA-001')
    expect(screen.getByTestId('vehicle-table-plate-v2')).toHaveTextContent('77-BB-777')
  })

  // 8. Кнопки видны для admin
  it('показывает кнопки действий для admin', () => {
    render(<VehicleTable {...defaultProps} role="admin" />)
    expect(screen.getByTestId('btn-edit-vehicle-v1')).toBeInTheDocument()
    expect(screen.getByTestId('btn-edit-vehicle-v2')).toBeInTheDocument()
  })

  // 9. Кнопки видны для manager тоже
  it('показывает кнопки действий для manager', () => {
    render(<VehicleTable {...defaultProps} role="manager" />)
    expect(screen.getByTestId('btn-edit-vehicle-v1')).toBeInTheDocument()
  })

  // 10. Кнопки скрыты для не-admin/manager
  it('скрывает кнопки действий для mechanic', () => {
    render(<VehicleTable {...defaultProps} role="mechanic" />)
    expect(screen.queryByTestId('btn-edit-vehicle-v1')).not.toBeInTheDocument()
  })

  // 11. Клиент по имени
  it('показывает имя клиента по clientId', () => {
    render(<VehicleTable {...defaultProps} />)
    expect(screen.getByTestId('vehicle-table-client-v1')).toHaveTextContent('Иван Иванов')
    expect(screen.getByTestId('vehicle-table-client-v2')).toHaveTextContent('Мария Петрова')
  })

  // 12. VIN
  it('показывает VIN (data-testid vehicle-table-vin-{id})', () => {
    render(<VehicleTable {...defaultProps} />)
    expect(screen.getByTestId('vehicle-table-vin-v1')).toHaveTextContent('JT2BF22K1Y0301234')
  })
})
