import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../../../hooks/useClients.js', () => ({
  useCreateClient: vi.fn(),
}))

import { useCreateClient } from '../../../../hooks/useClients.js'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CreateClientModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    useCreateClient.mockReturnValue({ mutateAsync: vi.fn() })
  })

  it('рендерит overlay и модалку', async () => {
    const { default: CreateClientModal } = await import('../CreateClientModal.jsx')
    render(
      <CreateClientModal uid="uid-1" onCreated={vi.fn()} onClose={vi.fn()} />
    )
    expect(screen.getByTestId('wizard-client-modal-overlay')).toBeInTheDocument()
    expect(screen.getByTestId('wizard-client-modal')).toBeInTheDocument()
  })

  it('рендерит заголовок «Новый клиент»', async () => {
    const { default: CreateClientModal } = await import('../CreateClientModal.jsx')
    render(
      <CreateClientModal uid="uid-1" onCreated={vi.fn()} onClose={vi.fn()} />
    )
    expect(screen.getByRole('heading', { name: /Новый клиент/i })).toBeInTheDocument()
  })

  it('рендерит поля ФИО, Телефон, Email', async () => {
    const { default: CreateClientModal } = await import('../CreateClientModal.jsx')
    render(
      <CreateClientModal uid="uid-1" onCreated={vi.fn()} onClose={vi.fn()} />
    )
    expect(screen.getByTestId('wizard-client-modal-fullName')).toBeInTheDocument()
    expect(screen.getByTestId('wizard-client-modal-phone')).toBeInTheDocument()
    expect(screen.getByTestId('wizard-client-modal-email')).toBeInTheDocument()
  })

  it('рендерит кнопки «Создать клиента» и «Отмена»', async () => {
    const { default: CreateClientModal } = await import('../CreateClientModal.jsx')
    render(
      <CreateClientModal uid="uid-1" onCreated={vi.fn()} onClose={vi.fn()} />
    )
    expect(screen.getByTestId('wizard-client-modal-submit')).toBeInTheDocument()
    expect(screen.getByTestId('wizard-client-modal-cancel')).toBeInTheDocument()
  })

  it('вызывает onClose при клике на кнопку «Отмена»', async () => {
    const { default: CreateClientModal } = await import('../CreateClientModal.jsx')
    const onClose = vi.fn()
    render(
      <CreateClientModal uid="uid-1" onCreated={vi.fn()} onClose={onClose} />
    )
    await userEvent.click(screen.getByTestId('wizard-client-modal-cancel'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('вызывает onClose при клике на оверлей (вне модалки)', async () => {
    const { default: CreateClientModal } = await import('../CreateClientModal.jsx')
    const onClose = vi.fn()
    render(
      <CreateClientModal uid="uid-1" onCreated={vi.fn()} onClose={onClose} />
    )
    await userEvent.click(screen.getByTestId('wizard-client-modal-overlay'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('НЕ вызывает onClose при клике внутри модалки', async () => {
    const { default: CreateClientModal } = await import('../CreateClientModal.jsx')
    const onClose = vi.fn()
    render(
      <CreateClientModal uid="uid-1" onCreated={vi.fn()} onClose={onClose} />
    )
    await userEvent.click(screen.getByTestId('wizard-client-modal'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('вызывает onClose при нажатии Escape', async () => {
    const { default: CreateClientModal } = await import('../CreateClientModal.jsx')
    const onClose = vi.fn()
    render(
      <CreateClientModal uid="uid-1" onCreated={vi.fn()} onClose={onClose} />
    )
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('показывает ошибки валидации при пустом сабмите', async () => {
    const { default: CreateClientModal } = await import('../CreateClientModal.jsx')
    render(
      <CreateClientModal uid="uid-1" onCreated={vi.fn()} onClose={vi.fn()} />
    )
    await userEvent.click(screen.getByTestId('wizard-client-modal-submit'))
    await waitFor(() => {
      expect(screen.getByText(/ФИО обязательно/i)).toBeInTheDocument()
      expect(screen.getByText(/Телефон обязателен/i)).toBeInTheDocument()
    })
  })

  it('показывает ошибку при некорректном email', async () => {
    const { default: CreateClientModal } = await import('../CreateClientModal.jsx')
    render(
      <CreateClientModal uid="uid-1" onCreated={vi.fn()} onClose={vi.fn()} />
    )
    await userEvent.type(screen.getByTestId('wizard-client-modal-fullName'), 'Иванов')
    await userEvent.type(screen.getByTestId('wizard-client-modal-phone'), '+994501234567')
    await userEvent.type(screen.getByTestId('wizard-client-modal-email'), 'notvalid')
    await userEvent.click(screen.getByTestId('wizard-client-modal-submit'))
    await waitFor(() => {
      expect(screen.getByText(/Некорректный формат email/i)).toBeInTheDocument()
    })
  })

  it('вызывает createClient и onCreated с новым id при успешном сабмите', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'new-client-id' })
    useCreateClient.mockReturnValue({ mutateAsync })

    const { default: CreateClientModal } = await import('../CreateClientModal.jsx')
    const onCreated = vi.fn()
    render(
      <CreateClientModal uid="uid-manager" onCreated={onCreated} onClose={vi.fn()} />
    )

    await userEvent.type(screen.getByTestId('wizard-client-modal-fullName'), 'Мамедов Эльшан')
    await userEvent.type(screen.getByTestId('wizard-client-modal-phone'), '+994501234567')
    await userEvent.click(screen.getByTestId('wizard-client-modal-submit'))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        fullName: 'Мамедов Эльшан',
        phone: '+994501234567',
        email: '',
        createdBy: 'uid-manager',
      })
      expect(onCreated).toHaveBeenCalledWith('new-client-id')
    })
  })

  it('передаёт email при заполнении', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'cid' })
    useCreateClient.mockReturnValue({ mutateAsync })

    const { default: CreateClientModal } = await import('../CreateClientModal.jsx')
    const onCreated = vi.fn()
    render(
      <CreateClientModal uid="uid-1" onCreated={onCreated} onClose={vi.fn()} />
    )

    await userEvent.type(screen.getByTestId('wizard-client-modal-fullName'), 'Тест')
    await userEvent.type(screen.getByTestId('wizard-client-modal-phone'), '000')
    await userEvent.type(screen.getByTestId('wizard-client-modal-email'), 'test@mail.com')
    await userEvent.click(screen.getByTestId('wizard-client-modal-submit'))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@mail.com' })
      )
    })
  })

  it('кнопка «Создать клиента» disabled и показывает «Создание...» во время отправки', async () => {
    const mutateAsync = vi.fn(() => new Promise(() => {})) // никогда не резолвится
    useCreateClient.mockReturnValue({ mutateAsync })

    const { default: CreateClientModal } = await import('../CreateClientModal.jsx')
    render(
      <CreateClientModal uid="uid-1" onCreated={vi.fn()} onClose={vi.fn()} />
    )

    await userEvent.type(screen.getByTestId('wizard-client-modal-fullName'), 'Тест')
    await userEvent.type(screen.getByTestId('wizard-client-modal-phone'), '000')
    await userEvent.click(screen.getByTestId('wizard-client-modal-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('wizard-client-modal-submit')).toBeDisabled()
      expect(screen.getByTestId('wizard-client-modal-submit')).toHaveTextContent('Создание...')
    })
  })
})
