import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../../hooks/useClients.js', () => ({
  useClients: vi.fn(),
}))

vi.mock('../../../hooks/useAppointments.js', () => ({
  useLinkClient: vi.fn(),
}))

import { useClients } from '../../../hooks/useClients.js'
import { useLinkClient } from '../../../hooks/useAppointments.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setup() {
  useClients.mockReturnValue({ data: [], isLoading: false })
  useLinkClient.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
}

async function importKanban() {
  const mod = await import('../AppointmentKanban.jsx')
  return mod.default
}

const APPOINTMENTS = [
  {
    id: 'a1',
    date: '2026-05-25',
    time: '09:00',
    duration: 60,
    serviceType: 'Замена масла',
    status: 'waiting',
    clientId: 'c1',
    clientName: 'Иванов Иван',
    clientPhone: '+994501111111',
    mechanicId: null,
    notes: '',
  },
  {
    id: 'a2',
    date: '2026-05-25',
    time: '11:00',
    duration: 30,
    serviceType: 'Диагностика',
    status: 'confirmed',
    clientId: null,
    clientName: 'Анон.',
    clientPhone: '+994502222222',
    mechanicId: null,
    notes: '',
  },
  {
    id: 'a3',
    date: '2026-05-25',
    time: '14:00',
    duration: 90,
    serviceType: 'ТО',
    status: 'done',
    clientId: 'c2',
    clientName: 'Петров Пётр',
    clientPhone: '+994503333333',
    mechanicId: null,
    notes: 'Замена фильтра',
  },
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AppointmentKanban', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    setup()
  })

  it('рендерит все 5 колонок канбана', async () => {
    const AppointmentKanban = await importKanban()
    render(
      <AppointmentKanban
        appointments={[]}
        onStatusChange={vi.fn()}
        onCardClick={vi.fn()}
      />,
    )
    expect(screen.getByTestId('appointment-kanban')).toBeInTheDocument()
    expect(screen.getByTestId('kanban-column-waiting')).toBeInTheDocument()
    expect(screen.getByTestId('kanban-column-confirmed')).toBeInTheDocument()
    expect(screen.getByTestId('kanban-column-in_progress')).toBeInTheDocument()
    expect(screen.getByTestId('kanban-column-done')).toBeInTheDocument()
    expect(screen.getByTestId('kanban-column-cancelled')).toBeInTheDocument()
  })

  it('карточки записей отображаются в правильных колонках', async () => {
    const AppointmentKanban = await importKanban()
    render(
      <AppointmentKanban
        appointments={APPOINTMENTS}
        onStatusChange={vi.fn()}
        onCardClick={vi.fn()}
      />,
    )
    // a1 — waiting
    const waitingCol = screen.getByTestId('kanban-column-waiting')
    expect(waitingCol).toHaveTextContent('Иванов Иван')

    // a2 — confirmed
    const confirmedCol = screen.getByTestId('kanban-column-confirmed')
    expect(confirmedCol).toHaveTextContent('994502222222')

    // a3 — done
    const doneCol = screen.getByTestId('kanban-column-done')
    expect(doneCol).toHaveTextContent('Петров Пётр')
  })

  it('счётчик записей в колонке отображается корректно', async () => {
    const AppointmentKanban = await importKanban()
    render(
      <AppointmentKanban
        appointments={APPOINTMENTS}
        onStatusChange={vi.fn()}
        onCardClick={vi.fn()}
      />,
    )
    expect(screen.getByTestId('kanban-count-waiting')).toHaveTextContent('1')
    expect(screen.getByTestId('kanban-count-confirmed')).toHaveTextContent('1')
    expect(screen.getByTestId('kanban-count-done')).toHaveTextContent('1')
    expect(screen.getByTestId('kanban-count-cancelled')).toHaveTextContent('0')
  })

  it('кнопка + в колонке вызывает onAddClick с нужным статусом', async () => {
    const AppointmentKanban = await importKanban()
    const onAddClick = vi.fn()
    render(
      <AppointmentKanban
        appointments={[]}
        onStatusChange={vi.fn()}
        onCardClick={vi.fn()}
        onAddClick={onAddClick}
      />,
    )
    await userEvent.click(screen.getByTestId('kanban-add-waiting'))
    expect(onAddClick).toHaveBeenCalledWith('waiting')
  })

  it('кнопка «Привязать клиента» видна для анонимных записей', async () => {
    const AppointmentKanban = await importKanban()
    render(
      <AppointmentKanban
        appointments={APPOINTMENTS}
        onStatusChange={vi.fn()}
        onCardClick={vi.fn()}
      />,
    )
    // a2 — anonymous (clientId=null)
    expect(screen.getByTestId('appt-card-link-a2')).toBeInTheDocument()
    // a1 — identified client (clientId=c1) — нет кнопки привязки
    expect(screen.queryByTestId('appt-card-link-a1')).not.toBeInTheDocument()
  })

  it('открывает модал привязки при клике «Привязать клиента»', async () => {
    const AppointmentKanban = await importKanban()
    render(
      <AppointmentKanban
        appointments={APPOINTMENTS}
        onStatusChange={vi.fn()}
        onCardClick={vi.fn()}
      />,
    )
    expect(screen.queryByTestId('link-client-modal')).not.toBeInTheDocument()
    await userEvent.click(screen.getByTestId('appt-card-link-a2'))
    expect(screen.getByTestId('link-client-modal')).toBeInTheDocument()
  })

  it('кнопка «→ Следующий статус» вызывает onStatusChange', async () => {
    const AppointmentKanban = await importKanban()
    const onStatusChange = vi.fn()
    render(
      <AppointmentKanban
        appointments={APPOINTMENTS}
        onStatusChange={onStatusChange}
        onCardClick={vi.fn()}
      />,
    )
    // a1 status=waiting → next = confirmed
    await userEvent.click(screen.getByTestId('appt-card-next-a1'))
    expect(onStatusChange).toHaveBeenCalledWith('a1', 'confirmed')
  })
})
