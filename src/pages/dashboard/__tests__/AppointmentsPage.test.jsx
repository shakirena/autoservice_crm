import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../../lib/authContext.jsx', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../../hooks/useAppointments.js', () => ({
  useAppointments: vi.fn(),
  useUpdateAppointment: vi.fn(),
}))

vi.mock('../../../store/appointmentsStore.js', () => ({
  default: vi.fn(),
}))

vi.mock('../../../features/appointments/AppointmentCalendar.jsx', () => ({
  default: ({ onSlotClick }) => (
    <div data-testid="mock-calendar">
      <button data-testid="mock-slot-click" onClick={() => onSlotClick?.('2026-05-25', '10:00')}>
        Слот
      </button>
    </div>
  ),
}))

vi.mock('../../../features/appointments/AppointmentKanban.jsx', () => ({
  default: () => <div data-testid="mock-kanban" />,
}))

vi.mock('../../../features/appointments/AppointmentForm.jsx', () => ({
  default: ({ onCancel }) => (
    <div data-testid="mock-appt-form">
      <button data-testid="mock-form-cancel" onClick={onCancel}>Отмена</button>
    </div>
  ),
}))

import { useAuth } from '../../../lib/authContext.jsx'
import { useAppointments, useUpdateAppointment } from '../../../hooks/useAppointments.js'
import useAppointmentsStore from '../../../store/appointmentsStore.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

let storeMockState = {
  view: 'calendar',
  calendarMode: 'week',
  setView: vi.fn(),
  setCalendarMode: vi.fn(),
}

function setup(overrides = {}) {
  useAuth.mockReturnValue({ user: { uid: 'uid-admin' }, role: 'admin' })
  useAppointments.mockReturnValue({ data: [], isLoading: false })
  useUpdateAppointment.mockReturnValue({ mutateAsync: vi.fn() })
  storeMockState = {
    view: 'calendar',
    calendarMode: 'week',
    setView: vi.fn(),
    setCalendarMode: vi.fn(),
    ...overrides,
  }
  useAppointmentsStore.mockReturnValue(storeMockState)
}

async function importPage() {
  const mod = await import('../AppointmentsPage.jsx')
  return mod.default
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AppointmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    setup()
  })

  it('рендерит страницу с заголовком «Записи клиентов»', async () => {
    const AppointmentsPage = await importPage()
    render(<AppointmentsPage />)
    expect(screen.getByTestId('appointments-page')).toBeInTheDocument()
    expect(screen.getByText('Записи клиентов')).toBeInTheDocument()
  })

  it('отображает кнопки переключения вида и «Новая запись»', async () => {
    const AppointmentsPage = await importPage()
    render(<AppointmentsPage />)
    expect(screen.getByTestId('view-toggle-calendar')).toBeInTheDocument()
    expect(screen.getByTestId('view-toggle-kanban')).toBeInTheDocument()
    expect(screen.getByTestId('appointments-new-btn')).toBeInTheDocument()
  })

  it('по умолчанию показывает календарное представление', async () => {
    const AppointmentsPage = await importPage()
    render(<AppointmentsPage />)
    expect(screen.getByTestId('mock-calendar')).toBeInTheDocument()
    expect(screen.queryByTestId('mock-kanban')).not.toBeInTheDocument()
  })

  it('переключение на канбан вызывает setView с "kanban"', async () => {
    const AppointmentsPage = await importPage()
    render(<AppointmentsPage />)
    await userEvent.click(screen.getByTestId('view-toggle-kanban'))
    expect(storeMockState.setView).toHaveBeenCalledWith('kanban')
  })

  it('кнопка «Новая запись» открывает форму', async () => {
    const AppointmentsPage = await importPage()
    render(<AppointmentsPage />)
    expect(screen.queryByTestId('mock-appt-form')).not.toBeInTheDocument()
    await userEvent.click(screen.getByTestId('appointments-new-btn'))
    expect(screen.getByTestId('mock-appt-form')).toBeInTheDocument()
  })

  it('кнопка «Отмена» в форме закрывает модал', async () => {
    const AppointmentsPage = await importPage()
    render(<AppointmentsPage />)
    await userEvent.click(screen.getByTestId('appointments-new-btn'))
    expect(screen.getByTestId('mock-appt-form')).toBeInTheDocument()
    await userEvent.click(screen.getByTestId('mock-form-cancel'))
    expect(screen.queryByTestId('mock-appt-form')).not.toBeInTheDocument()
  })

  it('клик на слот в календаре открывает форму', async () => {
    const AppointmentsPage = await importPage()
    render(<AppointmentsPage />)
    expect(screen.queryByTestId('mock-appt-form')).not.toBeInTheDocument()
    await userEvent.click(screen.getByTestId('mock-slot-click'))
    expect(screen.getByTestId('mock-appt-form')).toBeInTheDocument()
  })

  it('показывает канбан когда view === "kanban"', async () => {
    setup({ view: 'kanban' })
    const AppointmentsPage = await importPage()
    render(<AppointmentsPage />)
    expect(screen.getByTestId('mock-kanban')).toBeInTheDocument()
    expect(screen.queryByTestId('mock-calendar')).not.toBeInTheDocument()
  })
})
