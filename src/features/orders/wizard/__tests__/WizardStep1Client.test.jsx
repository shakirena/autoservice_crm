import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../../../hooks/useClients.js', () => ({
  useClients: vi.fn(),
  useCreateClient: vi.fn(),
}))

vi.mock('../CreateClientModal.jsx', () => ({
  default: vi.fn(),
}))

import { useClients, useCreateClient } from '../../../../hooks/useClients.js'
import CreateClientModal from '../CreateClientModal.jsx'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeClients(list = []) {
  return { data: list, isLoading: false }
}

async function importStep() {
  const mod = await import('../WizardStep1Client.jsx')
  return mod.default
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('WizardStep1Client', () => {
  let registerMock, setValueMock, errorsMock

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    registerMock = vi.fn(() => ({}))
    setValueMock = vi.fn()
    errorsMock = {}

    useClients.mockReturnValue(makeClients([]))
    useCreateClient.mockReturnValue({ mutateAsync: vi.fn() })

    // Мок CreateClientModal — просто рендерит кнопку «Создать»
    CreateClientModal.mockImplementation(({ onCreated, onClose }) => (
      <div data-testid="mock-client-modal">
        <button
          data-testid="mock-client-modal-submit"
          onClick={() => onCreated('new-id-42')}
        >
          Создать
        </button>
        <button data-testid="mock-client-modal-close" onClick={onClose}>
          Закрыть
        </button>
      </div>
    ))
  })

  it('рендерит заголовок шага 1 и select клиента', async () => {
    const WizardStep1Client = await importStep()
    render(
      <WizardStep1Client
        register={registerMock}
        errors={errorsMock}
        setValue={setValueMock}
        uid="uid-1"
      />
    )
    expect(screen.getByTestId('wizard-step-1')).toBeInTheDocument()
    expect(screen.getByTestId('order-select-client')).toBeInTheDocument()
  })

  it('рендерит кнопку «+ Создать нового клиента»', async () => {
    const WizardStep1Client = await importStep()
    render(
      <WizardStep1Client
        register={registerMock}
        errors={errorsMock}
        setValue={setValueMock}
        uid="uid-1"
      />
    )
    expect(screen.getByTestId('wizard-create-client-toggle')).toBeInTheDocument()
  })

  it('открывает CreateClientModal по клику на кнопку', async () => {
    const WizardStep1Client = await importStep()
    render(
      <WizardStep1Client
        register={registerMock}
        errors={errorsMock}
        setValue={setValueMock}
        uid="uid-1"
      />
    )
    expect(screen.queryByTestId('mock-client-modal')).not.toBeInTheDocument()
    await userEvent.click(screen.getByTestId('wizard-create-client-toggle'))
    expect(screen.getByTestId('mock-client-modal')).toBeInTheDocument()
  })

  it('закрывает модалку при onClose', async () => {
    const WizardStep1Client = await importStep()
    render(
      <WizardStep1Client
        register={registerMock}
        errors={errorsMock}
        setValue={setValueMock}
        uid="uid-1"
      />
    )
    await userEvent.click(screen.getByTestId('wizard-create-client-toggle'))
    expect(screen.getByTestId('mock-client-modal')).toBeInTheDocument()
    await userEvent.click(screen.getByTestId('mock-client-modal-close'))
    expect(screen.queryByTestId('mock-client-modal')).not.toBeInTheDocument()
  })

  it('setValue НЕ вызывается пока новый id не появился в списке клиентов', async () => {
    useClients.mockReturnValue(makeClients([]))

    const WizardStep1Client = await importStep()
    render(
      <WizardStep1Client
        register={registerMock}
        errors={errorsMock}
        setValue={setValueMock}
        uid="uid-1"
      />
    )

    await userEvent.click(screen.getByTestId('wizard-create-client-toggle'))
    await userEvent.click(screen.getByTestId('mock-client-modal-submit')) // onCreated('new-id-42')

    // Список ещё пустой → setValue не должен быть вызван
    await waitFor(() => {
      expect(setValueMock).not.toHaveBeenCalled()
    })
  })

  it('setValue вызывается с newId когда клиент появляется в списке', async () => {
    // Сначала список пустой
    const { rerender } = render(<div />) // placeholder
    useClients.mockReturnValue(makeClients([]))

    const WizardStep1Client = await importStep()
    const { rerender: rerenderStep } = render(
      <WizardStep1Client
        register={registerMock}
        errors={errorsMock}
        setValue={setValueMock}
        uid="uid-1"
      />
    )

    await userEvent.click(screen.getByTestId('wizard-create-client-toggle'))
    await userEvent.click(screen.getByTestId('mock-client-modal-submit')) // onCreated('new-id-42')

    // Симулируем появление нового клиента в списке (как после рефетча)
    useClients.mockReturnValue(
      makeClients([{ id: 'new-id-42', fullName: 'Мамедов Эльшан', phone: '+994501234567' }])
    )
    act(() => {
      rerenderStep(
        <WizardStep1Client
          register={registerMock}
          errors={errorsMock}
          setValue={setValueMock}
          uid="uid-1"
        />
      )
    })

    await waitFor(() => {
      expect(setValueMock).toHaveBeenCalledWith('clientId', 'new-id-42', { shouldValidate: true })
    })
  })

  it('отображает клиентов из useClients в select', async () => {
    useClients.mockReturnValue(
      makeClients([
        { id: 'c1', fullName: 'Иванов Иван', phone: '+994501111111' },
        { id: 'c2', fullName: 'Петров Пётр', phone: '+994502222222' },
      ])
    )

    const WizardStep1Client = await importStep()
    render(
      <WizardStep1Client
        register={registerMock}
        errors={errorsMock}
        setValue={setValueMock}
        uid="uid-1"
      />
    )

    expect(screen.getByText(/Иванов Иван/)).toBeInTheDocument()
    expect(screen.getByText(/Петров Пётр/)).toBeInTheDocument()
  })
})
