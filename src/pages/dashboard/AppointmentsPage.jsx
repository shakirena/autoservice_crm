/**
 * AppointmentsPage — Страница управления записями клиентов.
 *
 * Маршрут: /dashboard/appointments
 *
 * @module AppointmentsPage
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/authContext.jsx'
import { useAppointments, useUpdateAppointment } from '../../hooks/useAppointments.js'
import useAppointmentsStore from '../../store/appointmentsStore.js'
import AppointmentCalendar from '../../features/appointments/AppointmentCalendar.jsx'
import AppointmentKanban from '../../features/appointments/AppointmentKanban.jsx'
import AppointmentForm from '../../features/appointments/AppointmentForm.jsx'
import QuickOrderForm from '../../features/appointments/QuickOrderForm.jsx'

// ─── Modal wrapper ────────────────────────────────────────────────────────────

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

const modalStyle = {
  background: '#fff',
  borderRadius: '10px',
  padding: '28px 32px',
  width: '520px',
  maxWidth: '95vw',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
}

// ─── AppointmentsPage ─────────────────────────────────────────────────────────

function AppointmentsPage() {
  const { user, role } = useAuth()
  const navigate = useNavigate()

  // Фильтры: механик видит только свои записи
  const filters = role === 'mechanic' ? { mechanicId: user?.uid } : {}

  const { data: appointments = [], isLoading } = useAppointments(filters)
  const { mutateAsync: updateAppointment } = useUpdateAppointment()

  const {
    view,
    setView,
    calendarMode,
    setCalendarMode,
  } = useAppointmentsStore()

  // Локальное состояние модала формы
  const [formOpen, setFormOpen]         = useState(false)
  const [editingAppt, setEditingAppt]   = useState(null)
  const [prefillDate, setPrefillDate]   = useState('')
  const [prefillTime, setPrefillTime]   = useState('')

  // Состояние QuickOrderForm модала (feature #70)
  const [quickOrderAppt, setQuickOrderAppt] = useState(null)

  // Текущая дата навигации в календаре
  const [currentDate, setCurrentDate] = useState(() => new Date())

  function openNewForm({ date = '', time = '' } = {}) {
    setEditingAppt(null)
    setPrefillDate(date)
    setPrefillTime(time)
    setFormOpen(true)
  }

  function openEditForm(id) {
    const appt = appointments.find((a) => a.id === id)
    if (appt) {
      setEditingAppt(appt)
      setPrefillDate('')
      setPrefillTime('')
      setFormOpen(true)
    }
  }

  function closeForm() {
    setFormOpen(false)
    setEditingAppt(null)
  }

  async function handleStatusChange(id, newStatus) {
    await updateAppointment({ id, data: { status: newStatus } })
  }

  // ── Обработчики заказов (feature #70) ────────────────────────────────────────

  function handleCreateOrder(appt) {
    setQuickOrderAppt(appt)
  }

  function handleOpenOrder(orderId) {
    navigate(`/dashboard/orders/${orderId}`)
  }

  function handleQuickOrderSuccess(orderId) {
    setQuickOrderAppt(null)
    navigate(`/dashboard/orders/${orderId}`)
  }

  return (
    <div data-testid="appointments-page">
      {/* ── Шапка страницы ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700 }}>
            Записи клиентов
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Всего: {appointments.length}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Переключатель представления */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              data-testid="view-toggle-calendar"
              onClick={() => setView('calendar')}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                background: view === 'calendar' ? '#2563eb' : '#f1f5f9',
                color: view === 'calendar' ? '#fff' : '#475569',
                fontWeight: view === 'calendar' ? 600 : 400,
              }}
            >
              Календарь
            </button>
            <button
              type="button"
              data-testid="view-toggle-kanban"
              onClick={() => setView('kanban')}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                background: view === 'kanban' ? '#2563eb' : '#f1f5f9',
                color: view === 'kanban' ? '#fff' : '#475569',
                fontWeight: view === 'kanban' ? 600 : 400,
              }}
            >
              Канбан
            </button>
          </div>

          {/* Кнопка «Новая запись» */}
          <button
            type="button"
            data-testid="appointments-new-btn"
            onClick={() => openNewForm()}
            style={{
              padding: '8px 18px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            + Новая запись
          </button>
        </div>
      </div>

      {/* ── Состояние загрузки ── */}
      {isLoading && (
        <div
          data-testid="appointments-loading"
          style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}
        >
          Загрузка...
        </div>
      )}

      {/* ── Представление: Календарь ── */}
      {!isLoading && view === 'calendar' && (
        <AppointmentCalendar
          appointments={appointments}
          period={calendarMode}
          currentDate={currentDate}
          onPeriodChange={setCalendarMode}
          onDateChange={setCurrentDate}
          onSlotClick={(date, time) => openNewForm({ date, time })}
          onCardClick={(id) => openEditForm(id)}
          onCreateOrder={handleCreateOrder}
          onOpenOrder={handleOpenOrder}
          role={role}
        />
      )}

      {/* ── Представление: Канбан ── */}
      {!isLoading && view === 'kanban' && (
        <AppointmentKanban
          appointments={appointments}
          onStatusChange={handleStatusChange}
          onCardClick={(id) => openEditForm(id)}
          onAddClick={(status) => openNewForm({ status })}
          onCreateOrder={handleCreateOrder}
          onOpenOrder={handleOpenOrder}
          role={role}
        />
      )}

      {/* ── Модал формы ── */}
      {formOpen && (
        <div
          data-testid="appointment-form-overlay"
          style={overlayStyle}
          onClick={closeForm}
        >
          <div
            data-testid="appointment-form-modal"
            style={modalStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <AppointmentForm
              appointment={editingAppt ?? undefined}
              prefillDate={prefillDate}
              prefillTime={prefillTime}
              onSuccess={closeForm}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}

      {/* ── QuickOrderForm модал (feature #70) ── */}
      {quickOrderAppt && (
        <div
          data-testid="quick-order-form-overlay"
          style={overlayStyle}
          onClick={() => setQuickOrderAppt(null)}
        >
          <div
            data-testid="quick-order-form-modal"
            style={modalStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <QuickOrderForm
              appointment={quickOrderAppt}
              onSuccess={handleQuickOrderSuccess}
              onCancel={() => setQuickOrderAppt(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default AppointmentsPage
