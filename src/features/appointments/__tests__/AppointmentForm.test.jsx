import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../../hooks/useClients.js', () => ({
  useClients: vi.fn(),
  useCreateClient: vi.fn(),
}))

vi.mock('../../../hooks/useUsers.js', () => ({
  useUsers: vi.fn(),
}))

vi.mock('../../../hooks/useAppointments.js', () => ({
  useCreateAppointment: vi.fn(),
  useUpdateAppointment: vi.fn(),
}))

import { useClients, useCreateClient } from '../../../hooks/useClients.js'
import { useUsers } from '../../../hooks/useUsers.js'
import { useCreateAppointment, useUpdateAppointment } from '../../../hooks/useAppointments.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setup() {
  useClients.mockReturnValue({ data: [], isLoading: false })
  useUsers.mockReturnValue({ data: [], isLoading: false })
  useCreateClient.mockReturnValue({ mutateAsync: vi.fn() })
  useCreateAppointment.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
  useUpdateAppointment.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
}

async function importForm() {
  const mod = await import('../AppointmentForm.jsx')
  return mod.default
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AppointmentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    setup()
  })

  it('рендерит форму с заголовком «Новая запись»', async () => {
    const AppointmentForm = await importForm()
    render(<AppointmentForm onSuccess={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByTestId('appointment-form')).toBeInTheDocument()
    expect(screen.getByText('Новая запись')).toBeInTheDocument()
  })

  it('рендерит кнопки переключения режима клиента', async () => {
    const AppointmentForm = await importForm()
    render(<AppointmentForm onSuccess={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByTestId('client-mode-directory')).toBeInTheDocument()
    expect(screen.getByTestId('client-mode-new')).toBeInTheDocument()
    expect(screen.getByTestId('client-mode-anonymous')).toBeInTheDocument()
  })

  it('переключение на режим «Новый клиент» показывает поля ФИО/Телефон', async () => {
    const AppointmentForm = await importForm()
    render(<AppointmentForm onSuccess={vi.fn()} onCancel={vi.fn()} />)

    // По умолчанию directory — поля clientName/clientPhone не видны
    expect(screen.queryByTestId('appt-input-clientName')).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId('client-mode-new'))
    expect(screen.getByTestId('appt-input-clientName')).toBeInTheDocument()
    expect(screen.getByTestId('appt-input-clientPhone')).toBeInTheDocument()
    expect(screen.getByTestId('appt-input-clientEmail')).toBeInTheDocument()
  })

  it('переключение на режим «Анонимная запись» показывает поля без email', async () => {
    const AppointmentForm = await importForm()
    render(<AppointmentForm onSuccess={vi.fn()} onCancel={vi.fn()} />)

    await userEvent.click(screen.getByTestId('client-mode-anonymous'))
    expect(screen.getByTestId('appt-input-clientName')).toBeInTheDocument()
    expect(screen.getByTestId('appt-input-clientPhone')).toBeInTheDocument()
    expect(screen.queryByTestId('appt-input-clientEmail')).not.toBeInTheDocument()
  })

  it('отображает общие поля формы (дата, время, услуга)', async () => {
    const AppointmentForm = await importForm()
    render(<AppointmentForm onSuccess={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByTestId('appt-input-date')).toBeInTheDocument()
    expect(screen.getByTestId('appt-input-time')).toBeInTheDocument()
    expect(screen.getByTestId('appt-select-serviceType')).toBeInTheDocument()
    expect(screen.getByTestId('appt-select-duration')).toBeInTheDocument()
  })

  it('показывает заголовок «Редактировать запись» в режиме редактирования', async () => {
    const AppointmentForm = await importForm()
    const appt = {
      id: 'a1',
      date: '2026-05-25',
      time: '10:00',
      duration: 60,
      serviceType: 'Замена масла',
      status: 'waiting',
      clientId: 'c1',
      clientName: 'Иванов',
      clientPhone: '+994501111111',
      mechanicId: null,
      notes: '',
    }
    render(<AppointmentForm appointment={appt} onSuccess={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('Редактировать запись')).toBeInTheDocument()
  })

  it('кнопка отмены вызывает onCancel', async () => {
    const AppointmentForm = await importForm()
    const onCancel = vi.fn()
    render(<AppointmentForm onSuccess={vi.fn()} onCancel={onCancel} />)
    await userEvent.click(screen.getByTestId('appt-form-cancel'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('форма показывает ошибку если дата не заполнена при сабмите', async () => {
    const AppointmentForm = await importForm()
    render(<AppointmentForm onSuccess={vi.fn()} onCancel={vi.fn()} />)

    // Переключаемся на анонимный режим чтобы не мешала валидация clientId
    await userEvent.click(screen.getByTestId('client-mode-anonymous'))
    await userEvent.type(screen.getByTestId('appt-input-clientName'), 'Тест')
    await userEvent.type(screen.getByTestId('appt-input-clientPhone'), '+994501234567')
    // Не заполняем дату
    await userEvent.click(screen.getByTestId('appt-form-submit'))

    await waitFor(() => {
      expect(screen.getByText('Укажите дату')).toBeInTheDocument()
    })
  })
})
