import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import AppointmentCalendar from '../AppointmentCalendar.jsx'

const APPOINTMENTS = [
  {
    id: 'a1',
    date: '2026-05-25',
    time: '10:00',
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
    time: '14:30',
    duration: 30,
    serviceType: 'Диагностика',
    status: 'confirmed',
    clientId: null,
    clientName: 'Анон.',
    clientPhone: '+994502222222',
    mechanicId: null,
    notes: '',
  },
]

const BASE_DATE = new Date('2026-05-25T00:00:00')

describe('AppointmentCalendar', () => {
  it('рендерит компонент и тулбар', () => {
    render(
      <AppointmentCalendar
        appointments={[]}
        period="week"
        currentDate={BASE_DATE}
        onPeriodChange={vi.fn()}
        onDateChange={vi.fn()}
        onSlotClick={vi.fn()}
        onCardClick={vi.fn()}
      />,
    )
    expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument()
    expect(screen.getByTestId('calendar-toolbar')).toBeInTheDocument()
  })

  it('переключатель режимов: день / неделя / месяц присутствуют', () => {
    render(
      <AppointmentCalendar
        appointments={[]}
        period="week"
        currentDate={BASE_DATE}
        onPeriodChange={vi.fn()}
        onDateChange={vi.fn()}
        onSlotClick={vi.fn()}
        onCardClick={vi.fn()}
      />,
    )
    expect(screen.getByTestId('calendar-mode-day')).toBeInTheDocument()
    expect(screen.getByTestId('calendar-mode-week')).toBeInTheDocument()
    expect(screen.getByTestId('calendar-mode-month')).toBeInTheDocument()
  })

  it('вызывает onPeriodChange при клике на «День»', async () => {
    const onPeriodChange = vi.fn()
    render(
      <AppointmentCalendar
        appointments={[]}
        period="week"
        currentDate={BASE_DATE}
        onPeriodChange={onPeriodChange}
        onDateChange={vi.fn()}
        onSlotClick={vi.fn()}
        onCardClick={vi.fn()}
      />,
    )
    await userEvent.click(screen.getByTestId('calendar-mode-day'))
    expect(onPeriodChange).toHaveBeenCalledWith('day')
  })

  it('режим «день» рендерит слоты времени', () => {
    render(
      <AppointmentCalendar
        appointments={[]}
        period="day"
        currentDate={BASE_DATE}
        onPeriodChange={vi.fn()}
        onDateChange={vi.fn()}
        onSlotClick={vi.fn()}
        onCardClick={vi.fn()}
      />,
    )
    expect(screen.getByTestId('calendar-day-view')).toBeInTheDocument()
    // Слот 10:00 должен присутствовать
    expect(screen.getByTestId('day-slot-2026-05-25-10:00')).toBeInTheDocument()
  })

  it('режим «неделя» рендерит сетку недели', () => {
    render(
      <AppointmentCalendar
        appointments={[]}
        period="week"
        currentDate={BASE_DATE}
        onPeriodChange={vi.fn()}
        onDateChange={vi.fn()}
        onSlotClick={vi.fn()}
        onCardClick={vi.fn()}
      />,
    )
    expect(screen.getByTestId('calendar-week-view')).toBeInTheDocument()
  })

  it('режим «месяц» рендерит ячейки месяца', () => {
    render(
      <AppointmentCalendar
        appointments={[]}
        period="month"
        currentDate={BASE_DATE}
        onPeriodChange={vi.fn()}
        onDateChange={vi.fn()}
        onSlotClick={vi.fn()}
        onCardClick={vi.fn()}
      />,
    )
    expect(screen.getByTestId('calendar-month-view')).toBeInTheDocument()
    expect(screen.getByTestId('month-cell-2026-05-25')).toBeInTheDocument()
  })

  it('карточки записей отображаются в дневном виде', () => {
    render(
      <AppointmentCalendar
        appointments={APPOINTMENTS}
        period="day"
        currentDate={BASE_DATE}
        onPeriodChange={vi.fn()}
        onDateChange={vi.fn()}
        onSlotClick={vi.fn()}
        onCardClick={vi.fn()}
      />,
    )
    expect(screen.getByTestId('appointment-card-a1')).toBeInTheDocument()
  })

  it('клик на пустой слот вызывает onSlotClick', async () => {
    const onSlotClick = vi.fn()
    render(
      <AppointmentCalendar
        appointments={[]}
        period="day"
        currentDate={BASE_DATE}
        onPeriodChange={vi.fn()}
        onDateChange={vi.fn()}
        onSlotClick={onSlotClick}
        onCardClick={vi.fn()}
      />,
    )
    await userEvent.click(screen.getByTestId('day-slot-2026-05-25-09:00'))
    expect(onSlotClick).toHaveBeenCalledWith('2026-05-25', '09:00')
  })

  it('кнопки навигации «пред» и «след» присутствуют', () => {
    render(
      <AppointmentCalendar
        appointments={[]}
        period="week"
        currentDate={BASE_DATE}
        onPeriodChange={vi.fn()}
        onDateChange={vi.fn()}
        onSlotClick={vi.fn()}
        onCardClick={vi.fn()}
      />,
    )
    expect(screen.getByTestId('calendar-prev')).toBeInTheDocument()
    expect(screen.getByTestId('calendar-next')).toBeInTheDocument()
    expect(screen.getByTestId('calendar-today')).toBeInTheDocument()
  })

  it('месяц отображает бейдж с количеством записей', () => {
    render(
      <AppointmentCalendar
        appointments={APPOINTMENTS}
        period="month"
        currentDate={BASE_DATE}
        onPeriodChange={vi.fn()}
        onDateChange={vi.fn()}
        onSlotClick={vi.fn()}
        onCardClick={vi.fn()}
      />,
    )
    // 2 записи на 2026-05-25 — должен быть бейдж «2»
    const cell = screen.getByTestId('month-cell-2026-05-25')
    expect(cell).toHaveTextContent('2')
  })
})
