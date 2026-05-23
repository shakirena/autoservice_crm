import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../../../hooks/useVehicles.js', () => ({
  useVehiclesByClient: vi.fn(),
  useCreateVehicle: vi.fn(),
}))

vi.mock('../CreateVehicleModal.jsx', () => ({
  default: vi.fn(),
}))

import { useVehiclesByClient, useCreateVehicle } from '../../../../hooks/useVehicles.js'
import CreateVehicleModal from '../CreateVehicleModal.jsx'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeVehicles(list = []) {
  return { data: list, isLoading: false }
}

async function importStep() {
  const mod = await import('../WizardStep2Vehicle.jsx')
  return mod.default
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('WizardStep2Vehicle', () => {
  let registerMock, setValueMock, errorsMock

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    registerMock = vi.fn(() => ({}))
    setValueMock = vi.fn()
    errorsMock = {}

    useVehiclesByClient.mockReturnValue(makeVehicles([]))
    useCreateVehicle.mockReturnValue({ mutateAsync: vi.fn() })

    CreateVehicleModal.mockImplementation(({ onCreated, onClose }) => (
      <div data-testid="mock-vehicle-modal">
        <button
          data-testid="mock-vehicle-modal-submit"
          onClick={() => onCreated('new-vehicle-id-99')}
        >
          Создать авто
        </button>
        <button data-testid="mock-vehicle-modal-close" onClick={onClose}>
          Закрыть
        </button>
      </div>
    ))
  })

  it('показывает сообщение если clientId не выбран', async () => {
    const WizardStep2Vehicle = await importStep()
    render(
      <WizardStep2Vehicle
        clientId=""
        register={registerMock}
        errors={errorsMock}
        setValue={setValueMock}
      />
    )
    expect(screen.getByText(/Сначала выберите клиента/i)).toBeInTheDocument()
    expect(screen.queryByTestId('order-select-vehicle')).not.toBeInTheDocument()
  })

  it('рендерит select и кнопку когда clientId задан', async () => {
    const WizardStep2Vehicle = await importStep()
    render(
      <WizardStep2Vehicle
        clientId="cl-1"
        register={registerMock}
        errors={errorsMock}
        setValue={setValueMock}
      />
    )
    expect(screen.getByTestId('order-select-vehicle')).toBeInTheDocument()
    expect(screen.getByTestId('wizard-create-vehicle-toggle')).toBeInTheDocument()
  })

  it('открывает CreateVehicleModal по клику на кнопку', async () => {
    const WizardStep2Vehicle = await importStep()
    render(
      <WizardStep2Vehicle
        clientId="cl-1"
        register={registerMock}
        errors={errorsMock}
        setValue={setValueMock}
      />
    )
    expect(screen.queryByTestId('mock-vehicle-modal')).not.toBeInTheDocument()
    await userEvent.click(screen.getByTestId('wizard-create-vehicle-toggle'))
    expect(screen.getByTestId('mock-vehicle-modal')).toBeInTheDocument()
  })

  it('закрывает модалку при onClose', async () => {
    const WizardStep2Vehicle = await importStep()
    render(
      <WizardStep2Vehicle
        clientId="cl-1"
        register={registerMock}
        errors={errorsMock}
        setValue={setValueMock}
      />
    )
    await userEvent.click(screen.getByTestId('wizard-create-vehicle-toggle'))
    await userEvent.click(screen.getByTestId('mock-vehicle-modal-close'))
    expect(screen.queryByTestId('mock-vehicle-modal')).not.toBeInTheDocument()
  })

  it('setValue НЕ вызывается пока новый id не появился в списке авто', async () => {
    useVehiclesByClient.mockReturnValue(makeVehicles([]))

    const WizardStep2Vehicle = await importStep()
    render(
      <WizardStep2Vehicle
        clientId="cl-1"
        register={registerMock}
        errors={errorsMock}
        setValue={setValueMock}
      />
    )

    await userEvent.click(screen.getByTestId('wizard-create-vehicle-toggle'))
    await userEvent.click(screen.getByTestId('mock-vehicle-modal-submit'))

    await waitFor(() => {
      expect(setValueMock).not.toHaveBeenCalled()
    })
  })

  it('setValue вызывается с newId когда авто появляется в списке', async () => {
    useVehiclesByClient.mockReturnValue(makeVehicles([]))

    const WizardStep2Vehicle = await importStep()
    const { rerender } = render(
      <WizardStep2Vehicle
        clientId="cl-1"
        register={registerMock}
        errors={errorsMock}
        setValue={setValueMock}
      />
    )

    await userEvent.click(screen.getByTestId('wizard-create-vehicle-toggle'))
    await userEvent.click(screen.getByTestId('mock-vehicle-modal-submit'))

    // Симулируем рефетч — авто появился в списке
    useVehiclesByClient.mockReturnValue(
      makeVehicles([{
        id: 'new-vehicle-id-99',
        make: 'Toyota', model: 'Camry', year: 2020, licensePlate: '10-AA-001',
      }])
    )
    act(() => {
      rerender(
        <WizardStep2Vehicle
          clientId="cl-1"
          register={registerMock}
          errors={errorsMock}
          setValue={setValueMock}
        />
      )
    })

    await waitFor(() => {
      expect(setValueMock).toHaveBeenCalledWith('vehicleId', 'new-vehicle-id-99', { shouldValidate: true })
    })
  })

  it('отображает автомобили клиента в select', async () => {
    useVehiclesByClient.mockReturnValue(
      makeVehicles([
        { id: 'v1', make: 'Toyota', model: 'Camry', year: 2020, licensePlate: '10-AA-001' },
        { id: 'v2', make: 'BMW', model: 'X5', year: 2022, licensePlate: '99-BB-007' },
      ])
    )

    const WizardStep2Vehicle = await importStep()
    render(
      <WizardStep2Vehicle
        clientId="cl-1"
        register={registerMock}
        errors={errorsMock}
        setValue={setValueMock}
      />
    )

    expect(screen.getByText(/Toyota Camry 2020/)).toBeInTheDocument()
    expect(screen.getByText(/BMW X5 2022/)).toBeInTheDocument()
  })
})
