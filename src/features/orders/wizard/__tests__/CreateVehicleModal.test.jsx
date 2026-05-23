import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../../../hooks/useVehicles.js', () => ({
  useCreateVehicle: vi.fn(),
}))

import { useCreateVehicle } from '../../../../hooks/useVehicles.js'

const CURRENT_YEAR = new Date().getFullYear()

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CreateVehicleModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    useCreateVehicle.mockReturnValue({ mutateAsync: vi.fn() })
  })

  it('рендерит overlay и модалку', async () => {
    const { default: CreateVehicleModal } = await import('../CreateVehicleModal.jsx')
    render(
      <CreateVehicleModal clientId="cl-1" onCreated={vi.fn()} onClose={vi.fn()} />
    )
    expect(screen.getByTestId('wizard-vehicle-modal-overlay')).toBeInTheDocument()
    expect(screen.getByTestId('wizard-vehicle-modal')).toBeInTheDocument()
  })

  it('рендерит заголовок «Новый автомобиль»', async () => {
    const { default: CreateVehicleModal } = await import('../CreateVehicleModal.jsx')
    render(
      <CreateVehicleModal clientId="cl-1" onCreated={vi.fn()} onClose={vi.fn()} />
    )
    expect(screen.getByRole('heading', { name: /Новый автомобиль/i })).toBeInTheDocument()
  })

  it('рендерит поля Марка, Модель, Год, Гос.номер, VIN', async () => {
    const { default: CreateVehicleModal } = await import('../CreateVehicleModal.jsx')
    render(
      <CreateVehicleModal clientId="cl-1" onCreated={vi.fn()} onClose={vi.fn()} />
    )
    expect(screen.getByTestId('wizard-vehicle-modal-make')).toBeInTheDocument()
    expect(screen.getByTestId('wizard-vehicle-modal-model')).toBeInTheDocument()
    expect(screen.getByTestId('wizard-vehicle-modal-year')).toBeInTheDocument()
    expect(screen.getByTestId('wizard-vehicle-modal-licensePlate')).toBeInTheDocument()
    expect(screen.getByTestId('wizard-vehicle-modal-vin')).toBeInTheDocument()
  })

  it('рендерит кнопки «Добавить автомобиль» и «Отмена»', async () => {
    const { default: CreateVehicleModal } = await import('../CreateVehicleModal.jsx')
    render(
      <CreateVehicleModal clientId="cl-1" onCreated={vi.fn()} onClose={vi.fn()} />
    )
    expect(screen.getByTestId('wizard-vehicle-modal-submit')).toHaveTextContent('Добавить автомобиль')
    expect(screen.getByTestId('wizard-vehicle-modal-cancel')).toBeInTheDocument()
  })

  it('вызывает onClose при клике на кнопку «Отмена»', async () => {
    const { default: CreateVehicleModal } = await import('../CreateVehicleModal.jsx')
    const onClose = vi.fn()
    render(
      <CreateVehicleModal clientId="cl-1" onCreated={vi.fn()} onClose={onClose} />
    )
    await userEvent.click(screen.getByTestId('wizard-vehicle-modal-cancel'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('вызывает onClose при клике на оверлей', async () => {
    const { default: CreateVehicleModal } = await import('../CreateVehicleModal.jsx')
    const onClose = vi.fn()
    render(
      <CreateVehicleModal clientId="cl-1" onCreated={vi.fn()} onClose={onClose} />
    )
    await userEvent.click(screen.getByTestId('wizard-vehicle-modal-overlay'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('НЕ вызывает onClose при клике внутри модалки', async () => {
    const { default: CreateVehicleModal } = await import('../CreateVehicleModal.jsx')
    const onClose = vi.fn()
    render(
      <CreateVehicleModal clientId="cl-1" onCreated={vi.fn()} onClose={onClose} />
    )
    await userEvent.click(screen.getByTestId('wizard-vehicle-modal'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('вызывает onClose при нажатии Escape', async () => {
    const { default: CreateVehicleModal } = await import('../CreateVehicleModal.jsx')
    const onClose = vi.fn()
    render(
      <CreateVehicleModal clientId="cl-1" onCreated={vi.fn()} onClose={onClose} />
    )
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('показывает ошибки валидации при пустом сабмите', async () => {
    const { default: CreateVehicleModal } = await import('../CreateVehicleModal.jsx')
    render(
      <CreateVehicleModal clientId="cl-1" onCreated={vi.fn()} onClose={vi.fn()} />
    )
    // Очищаем поле year (по умолчанию CURRENT_YEAR) чтобы все поля были пустыми
    await userEvent.clear(screen.getByTestId('wizard-vehicle-modal-year'))
    await userEvent.click(screen.getByTestId('wizard-vehicle-modal-submit'))
    await waitFor(() => {
      expect(screen.getByText(/Марка обязательна/i)).toBeInTheDocument()
      expect(screen.getByText(/Модель обязательна/i)).toBeInTheDocument()
      expect(screen.getByText(/Год обязателен/i)).toBeInTheDocument()
      expect(screen.getByText(/Гос\. номер обязателен/i)).toBeInTheDocument()
    })
  })

  it('вызывает createVehicle с clientId из props и onCreated с новым id', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'new-vehicle-id' })
    useCreateVehicle.mockReturnValue({ mutateAsync })

    const { default: CreateVehicleModal } = await import('../CreateVehicleModal.jsx')
    const onCreated = vi.fn()
    render(
      <CreateVehicleModal clientId="cl-42" onCreated={onCreated} onClose={vi.fn()} />
    )

    await userEvent.type(screen.getByTestId('wizard-vehicle-modal-make'), 'Toyota')
    await userEvent.type(screen.getByTestId('wizard-vehicle-modal-model'), 'Camry')
    await userEvent.clear(screen.getByTestId('wizard-vehicle-modal-year'))
    await userEvent.type(screen.getByTestId('wizard-vehicle-modal-year'), '2020')
    await userEvent.type(screen.getByTestId('wizard-vehicle-modal-licensePlate'), '10-AA-001')
    await userEvent.click(screen.getByTestId('wizard-vehicle-modal-submit'))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          licensePlate: '10-AA-001',
          clientId: 'cl-42',
        })
      )
      expect(onCreated).toHaveBeenCalledWith('new-vehicle-id')
    })
  })

  it('передаёт VIN если заполнен', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'vid' })
    useCreateVehicle.mockReturnValue({ mutateAsync })

    const { default: CreateVehicleModal } = await import('../CreateVehicleModal.jsx')
    render(
      <CreateVehicleModal clientId="cl-1" onCreated={vi.fn()} onClose={vi.fn()} />
    )

    await userEvent.type(screen.getByTestId('wizard-vehicle-modal-make'), 'BMW')
    await userEvent.type(screen.getByTestId('wizard-vehicle-modal-model'), 'X5')
    await userEvent.clear(screen.getByTestId('wizard-vehicle-modal-year'))
    await userEvent.type(screen.getByTestId('wizard-vehicle-modal-year'), '2022')
    await userEvent.type(screen.getByTestId('wizard-vehicle-modal-licensePlate'), '77-BB-007')
    await userEvent.type(screen.getByTestId('wizard-vehicle-modal-vin'), 'WBA5A7C57GG123456')
    await userEvent.click(screen.getByTestId('wizard-vehicle-modal-submit'))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ vin: 'WBA5A7C57GG123456' })
      )
    })
  })

  it('предзаполняет поле year текущим годом', async () => {
    const { default: CreateVehicleModal } = await import('../CreateVehicleModal.jsx')
    render(
      <CreateVehicleModal clientId="cl-1" onCreated={vi.fn()} onClose={vi.fn()} />
    )
    expect(screen.getByTestId('wizard-vehicle-modal-year')).toHaveValue(CURRENT_YEAR)
  })

  it('кнопка «Добавить автомобиль» disabled и показывает «Создание...» во время отправки', async () => {
    const mutateAsync = vi.fn(() => new Promise(() => {}))
    useCreateVehicle.mockReturnValue({ mutateAsync })

    const { default: CreateVehicleModal } = await import('../CreateVehicleModal.jsx')
    render(
      <CreateVehicleModal clientId="cl-1" onCreated={vi.fn()} onClose={vi.fn()} />
    )

    await userEvent.type(screen.getByTestId('wizard-vehicle-modal-make'), 'Audi')
    await userEvent.type(screen.getByTestId('wizard-vehicle-modal-model'), 'A4')
    await userEvent.type(screen.getByTestId('wizard-vehicle-modal-licensePlate'), '99-CC-999')
    await userEvent.click(screen.getByTestId('wizard-vehicle-modal-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('wizard-vehicle-modal-submit')).toBeDisabled()
      expect(screen.getByTestId('wizard-vehicle-modal-submit')).toHaveTextContent('Создание...')
    })
  })
})
