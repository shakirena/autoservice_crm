/**
 * AppointmentCalendar — Календарное представление записей клиентов.
 *
 * Три режима: день / неделя / месяц.
 * Навигация: ← / → и «Сегодня».
 * Клик на слот → onSlotClick(date, time).
 * Клик на карточку → onCardClick(appointmentId).
 *
 * @module AppointmentCalendar
 */

import AppointmentCard from './AppointmentCard.jsx'

// ─── Вспомогательные функции ─────────────────────────────────────────────────

/**
 * Форматирует Date в строку "YYYY-MM-DD" (локально).
 * @param {Date} d
 * @returns {string}
 */
function isoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Возвращает понедельник недели для переданной даты.
 * @param {Date} d
 * @returns {Date}
 */
function getWeekMonday(d) {
  const day = d.getDay() // 0=вс..6=сб
  const diff = (day === 0 ? -6 : 1 - day)
  const m = new Date(d)
  m.setDate(d.getDate() + diff)
  m.setHours(0, 0, 0, 0)
  return m
}

/** Часовые слоты 08:00–19:30 с шагом 30 мин */
function buildTimeSlots() {
  const slots = []
  for (let h = 8; h < 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}

const TIME_SLOTS = buildTimeSlots()

const RU_MONTHS = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь',
]

const RU_DOW_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

// ─── Styles ───────────────────────────────────────────────────────────────────

const cellBase = {
  borderRight: '1px solid #e5e7eb',
  borderBottom: '1px solid #e5e7eb',
  minHeight: '40px',
  padding: '2px',
  cursor: 'pointer',
  verticalAlign: 'top',
  position: 'relative',
}

const headerCellStyle = {
  padding: '6px 8px',
  fontSize: '13px',
  fontWeight: 600,
  textAlign: 'center',
  background: '#f8fafc',
  borderRight: '1px solid #e5e7eb',
  borderBottom: '1px solid #e5e7eb',
  color: '#374151',
}

const timeLabelStyle = {
  fontSize: '11px',
  color: '#9ca3af',
  padding: '2px 6px',
  textAlign: 'right',
  whiteSpace: 'nowrap',
  borderRight: '1px solid #e5e7eb',
  borderBottom: '1px solid #e5e7eb',
  background: '#f8fafc',
  userSelect: 'none',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Панель управления — навигация и переключатель режима.
 */
function CalendarToolbar({ period, currentDate, onPeriodChange, onDateChange }) {
  function navigate(direction) {
    const d = new Date(currentDate)
    if (period === 'day') {
      d.setDate(d.getDate() + direction)
    } else if (period === 'week') {
      d.setDate(d.getDate() + direction * 7)
    } else {
      d.setMonth(d.getMonth() + direction)
    }
    onDateChange(d)
  }

  function buildTitle() {
    if (period === 'day') {
      return currentDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    }
    if (period === 'week') {
      const mon = getWeekMonday(currentDate)
      const sun = new Date(mon)
      sun.setDate(mon.getDate() + 6)
      return `${mon.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — ${sun.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
    return `${RU_MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
  }

  return (
    <div
      data-testid="calendar-toolbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px',
        flexWrap: 'wrap',
      }}
    >
      {/* Режим */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {[
          { value: 'day',   label: 'День' },
          { value: 'week',  label: 'Неделя' },
          { value: 'month', label: 'Месяц' },
        ].map((m) => (
          <button
            key={m.value}
            type="button"
            data-testid={`calendar-mode-${m.value}`}
            onClick={() => onPeriodChange(m.value)}
            style={{
              padding: '5px 12px',
              borderRadius: '5px',
              border: 'none',
              fontSize: '13px',
              cursor: 'pointer',
              background: period === m.value ? '#2563eb' : '#f1f5f9',
              color: period === m.value ? '#fff' : '#475569',
              fontWeight: period === m.value ? 600 : 400,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Навигация */}
      <button
        type="button"
        data-testid="calendar-prev"
        onClick={() => navigate(-1)}
        style={{ padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: '5px', background: '#fff', cursor: 'pointer', fontSize: '13px' }}
      >
        ‹
      </button>

      <button
        type="button"
        data-testid="calendar-today"
        onClick={() => onDateChange(new Date())}
        style={{ padding: '5px 12px', border: '1px solid #d1d5db', borderRadius: '5px', background: '#fff', cursor: 'pointer', fontSize: '13px' }}
      >
        Сегодня
      </button>

      <button
        type="button"
        data-testid="calendar-next"
        onClick={() => navigate(1)}
        style={{ padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: '5px', background: '#fff', cursor: 'pointer', fontSize: '13px' }}
      >
        ›
      </button>

      <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>
        {buildTitle()}
      </span>
    </div>
  )
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({ date, appointments, onSlotClick, onCardClick }) {
  const dateStr = isoDate(date)
  const apptMap = {}
  appointments.filter((a) => a.date === dateStr).forEach((a) => {
    const key = a.time?.slice(0, 5) ?? '00:00'
    if (!apptMap[key]) apptMap[key] = []
    apptMap[key].push(a)
  })

  return (
    <div data-testid="calendar-day-view" style={{ overflowY: 'auto', maxHeight: '70vh' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <colgroup>
          <col style={{ width: '60px' }} />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th style={headerCellStyle}></th>
            <th style={headerCellStyle}>
              {date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </th>
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((slot) => (
            <tr key={slot}>
              <td style={timeLabelStyle}>{slot}</td>
              <td
                data-testid={`day-slot-${dateStr}-${slot}`}
                style={{ ...cellBase, padding: '2px 4px' }}
                onClick={() => {
                  if (!apptMap[slot]?.length) onSlotClick?.(dateStr, slot)
                }}
              >
                {(apptMap[slot] ?? []).map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    mode="calendar"
                    onClick={onCardClick}
                  />
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({ date, appointments, onSlotClick, onCardClick }) {
  const monday = getWeekMonday(date)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  // Построить карту date → time → []
  const apptMap = {}
  appointments.forEach((a) => {
    const key = `${a.date}__${a.time?.slice(0, 5) ?? '00:00'}`
    if (!apptMap[key]) apptMap[key] = []
    apptMap[key].push(a)
  })

  return (
    <div data-testid="calendar-week-view" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '70vh' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
        <colgroup>
          <col style={{ width: '52px' }} />
          {days.map((d) => <col key={isoDate(d)} />)}
        </colgroup>
        <thead>
          <tr>
            <th style={headerCellStyle}></th>
            {days.map((d, i) => (
              <th key={isoDate(d)} style={headerCellStyle}>
                {RU_DOW_SHORT[i]}<br />
                <span style={{ fontSize: '12px', fontWeight: 400 }}>
                  {d.getDate()}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((slot) => (
            <tr key={slot}>
              <td style={timeLabelStyle}>{slot}</td>
              {days.map((d) => {
                const ds = isoDate(d)
                const key = `${ds}__${slot}`
                const cells = apptMap[key] ?? []
                return (
                  <td
                    key={ds}
                    data-testid={`week-slot-${ds}-${slot}`}
                    style={{ ...cellBase, padding: '2px 4px' }}
                    onClick={() => {
                      if (!cells.length) onSlotClick?.(ds, slot)
                    }}
                  >
                    {cells.map((a) => (
                      <AppointmentCard
                        key={a.id}
                        appointment={a}
                        mode="calendar"
                        onClick={onCardClick}
                      />
                    ))}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({ date, appointments, onDayClick }) {
  const year = date.getFullYear()
  const month = date.getMonth()

  // Первый день месяца
  const firstDay = new Date(year, month, 1)
  // Смещение: понедельник = 0 … воскресенье = 6
  const startOffset = (firstDay.getDay() + 6) % 7

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7

  // Карта date → count
  const countMap = {}
  appointments.forEach((a) => {
    countMap[a.date] = (countMap[a.date] ?? 0) + 1
  })

  const today = isoDate(new Date())

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startOffset + 1
    if (dayNum < 1 || dayNum > daysInMonth) return null
    const d = new Date(year, month, dayNum)
    return d
  })

  return (
    <div data-testid="calendar-month-view">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {RU_DOW_SHORT.map((d) => (
              <th key={d} style={{ ...headerCellStyle, width: `${100/7}%` }}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: totalCells / 7 }, (_, row) => (
            <tr key={row}>
              {cells.slice(row * 7, row * 7 + 7).map((d, col) => {
                if (!d) {
                  return <td key={col} style={{ ...cellBase, background: '#f9fafb', cursor: 'default' }} />
                }
                const ds = isoDate(d)
                const count = countMap[ds] ?? 0
                const isToday = ds === today
                return (
                  <td
                    key={ds}
                    data-testid={`month-cell-${ds}`}
                    style={{
                      ...cellBase,
                      padding: '6px',
                      background: isToday ? '#eff6ff' : '#fff',
                      cursor: 'pointer',
                    }}
                    onClick={() => onDayClick?.(d)}
                  >
                    <div style={{ fontWeight: isToday ? 700 : 400, fontSize: '13px', color: isToday ? '#2563eb' : '#374151' }}>
                      {d.getDate()}
                    </div>
                    {count > 0 && (
                      <div style={{
                        display: 'inline-block',
                        marginTop: '2px',
                        padding: '1px 6px',
                        background: '#2563eb',
                        color: '#fff',
                        borderRadius: '10px',
                        fontSize: '11px',
                      }}>
                        {count}
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * @param {{
 *   appointments:   import('../../services/appointmentsService.js').AppointmentDoc[],
 *   period:         'day'|'week'|'month',
 *   currentDate:    Date,
 *   onPeriodChange: (period: string) => void,
 *   onDateChange:   (date: Date) => void,
 *   onSlotClick:    (date: string, time: string) => void,
 *   onCardClick:    (appointmentId: string) => void,
 * }} props
 */
function AppointmentCalendar({
  appointments = [],
  period = 'week',
  currentDate = new Date(),
  onPeriodChange,
  onDateChange,
  onSlotClick,
  onCardClick,
}) {
  function handleDayClick(d) {
    onDateChange?.(d)
    onPeriodChange?.('day')
  }

  return (
    <div data-testid="appointment-calendar">
      <CalendarToolbar
        period={period}
        currentDate={currentDate}
        onPeriodChange={onPeriodChange}
        onDateChange={onDateChange}
      />

      {period === 'day' && (
        <DayView
          date={currentDate}
          appointments={appointments}
          onSlotClick={onSlotClick}
          onCardClick={onCardClick}
        />
      )}

      {period === 'week' && (
        <WeekView
          date={currentDate}
          appointments={appointments}
          onSlotClick={onSlotClick}
          onCardClick={onCardClick}
        />
      )}

      {period === 'month' && (
        <MonthView
          date={currentDate}
          appointments={appointments}
          onDayClick={handleDayClick}
        />
      )}
    </div>
  )
}

export default AppointmentCalendar
