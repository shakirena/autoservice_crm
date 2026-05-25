/**
 * Tests for QuickOrderForm component.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../../lib/authContext.jsx', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../../hooks/useOrders.js', () => ({
  useCreateOrder: vi.fn(),
}))

vi.mock('../../../hooks/useAppointments.js', () => ({
  useLinkOrder: vi.fn(),
}))

vi.mock('../../../hooks/useUsers.js', () => ({
  useUsers: vi.fn(),
}))

vi.mock('../../../components/ui/SearchableSelect.jsx', () => ({
  default: ({ testId, value, onChange, placeholder }) => (
    <input
      data-testid={testId}
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

import { useAuth } from '../../../lib/authContext.jsx'
import { useCreateOrder } from '../../../hooks/useOrders.js'
import { useLinkOrder } from '../../../hooks/useAppointments.js'
import { useUsers } from '../../../hooks/useUsers.js'
import QuickOrderForm from '../QuickOrderForm.jsx'

// ─── Test data ────────────────────────────────────────────────────────────────

const mockAppointment = {
  id: 'appt-1',
  clientId: 'client-1',
  clientName: 'Иван Иванов',
  clientPhone: '+994501234567',
  serviceType: 'Замена масла',
  mechanicId: 'mech-1',
  date: '2026-05-25',
  time: '10:00',
  duration: 60,
  status: 'confirmed',
  notes: 'Тестовые примечания',
}

// ─── Setup ────────────────────────────────────────────────────────────────────

function setup(appointmentOverrides = {}, propOverrides = {}) {
  const mockCreateOrder = vi.fn().mockResolvedValue({ id: 'order-new-1' })
  const mockLinkOrder = vi.fn()
  const onSuccess = vi.fn()
  const onCancel = vi.fn()

  useAuth.mockReturnValue({ user: { uid: 'uid-admin' }, role: 'admin' })
  useCreateOrder.mockReturnValue({ mutateAsync: mockCreateOrder, isPending: false })
  useLinkOrder.mockReturnValue({ mutate: mockLinkOrder })
  useUsers.mockReturnValue({ data: [
    { uid: 'mech-1', displayName: 'Механик Петров', role: 'mechanic' },
  ], isLoading: false })

  const appointment = { ...mockAppointment, ...appointmentOverrides }

  render(
    <QuickOrderForm
      appointment={appointment}
      onSuccess={onSuccess}
      onCancel={onCancel}
      {...propOverrides}
    />
  )

  return { mockCreateOrder, mockLinkOrder, onSuccess, onCancel, appointment }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('QuickOrderForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('рендерит форму с data-testid quick-order-form', () => {
    setup()
    expect(screen.getByTestId('quick-order-form')).toBeInTheDocument()
  })

  it('предзаполняет поля clientName и clientPhone из appointment', () => {
    setup()
    expect(screen.getByTestId('qof-clientName')).toHaveValue('Иван Иванов')
    expect(screen.getByTestId('qof-clientPhone')).toHaveValue('+994501234567')
  })

  it('предзаполняет serviceType из appointment', () => {
    setup()
    const select = screen.getByTestId('qof-serviceType')
    expect(select).toHaveValue('Замена масла')
  })

  it('предзаполняет дату из appointment', () => {
    setup()
    expect(screen.getByTestId('qof-scheduledDate')).toHaveValue('2026-05-25')
  })

  it('отображает кнопку «Создать заказ»', () => {
    setup()
    expect(screen.getByTestId('qof-submit-btn')).toBeInTheDocument()
    expect(screen.getByTestId('qof-submit-btn')).toHaveTextContent('Создать заказ')
  })

  it('отображает кнопку «Отмена»', () => {
    setup()
    expect(screen.getByTestId('qof-cancel-btn')).toBeInTheDocument()
  })

  it('кнопка «Отмена» вызывает onCancel', async () => {
    const { onCancel } = setup()
    await userEvent.click(screen.getByTestId('qof-cancel-btn'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('сабмит вызывает createOrder и onSuccess с orderId', async () => {
    const { mockCreateOrder, mockLinkOrder, onSuccess, appointment } = setup()

    await userEvent.click(screen.getByTestId('qof-submit-btn'))

    await waitFor(() => {
      expect(mockCreateOrder).toHaveBeenCalledOnce()
    })

    // Проверяем что appointmentId передан в createOrder
    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({ appointmentId: appointment.id })
    )

    // linkOrder должен быть вызван
    await waitFor(() => {
      expect(mockLinkOrder).toHaveBeenCalledWith({
        appointmentId: appointment.id,
        orderId: 'order-new-1',
      })
    })

    // onSuccess должен получить orderId
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('order-new-1')
    })
  })

  it('показывает ошибку валидации если clientName пустой', async () => {
    setup({ clientName: '' })

    await userEvent.click(screen.getByTestId('qof-submit-btn'))

    await waitFor(() => {
      expect(screen.getByText('Введите имя клиента')).toBeInTheDocument()
    })
  })
})
