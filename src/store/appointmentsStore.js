/**
 * appointmentsStore — Zustand-стор UI-состояния для модуля записей.
 *
 * Хранит только UI-состояние (вид, навигация, открытые модалы, режим клиента).
 * Серверные данные (список записей) хранятся в TanStack Query (useAppointments).
 *
 * Паттерн: не импортировать Firestore/сервисы из стора — только React Query хуки
 * (аналогично остальным сторам проекта).
 *
 * @module appointmentsStore
 */

import { create } from 'zustand'

/**
 * @typedef {'calendar'|'kanban'} AppointmentView
 * @typedef {'day'|'week'|'month'} CalendarMode
 */

/**
 * Форматирует Date в строку "YYYY-MM-DD" (локально, без UTC-сдвига).
 *
 * @param {Date} date
 * @returns {string}
 */
function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * @typedef {Object} AppointmentsStoreState
 * @property {'calendar'|'kanban'} view
 * @property {string} selectedDate           — "YYYY-MM-DD", по умолчанию сегодня
 * @property {'day'|'week'|'month'} calendarMode
 * @property {{ dateFrom?: string, dateTo?: string, status?: string, mechanicId?: string }} filters
 * @property {(view: AppointmentView) => void} setView
 * @property {(date: string) => void} setSelectedDate
 * @property {(mode: CalendarMode) => void} setCalendarMode
 * @property {(filters: object) => void} setFilters
 */

/** @type {import('zustand').StoreApi<AppointmentsStoreState>} */
const useAppointmentsStore = create((set) => ({
  view: 'calendar',
  selectedDate: toISODate(new Date()),
  calendarMode: 'week',
  filters: {},

  setView: (view) => set({ view }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setCalendarMode: (calendarMode) => set({ calendarMode }),
  setFilters: (filters) => set({ filters }),
}))

export default useAppointmentsStore
