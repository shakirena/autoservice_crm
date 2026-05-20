import { useState, useEffect } from 'react'
import { useServices } from '../../../hooks/useServiceCatalog.js'

// ─── Styles ───────────────────────────────────────────────────────────────────

const serviceRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 12px',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  marginBottom: '8px',
  background: '#fff',
  cursor: 'pointer',
}

const serviceRowSelectedStyle = {
  ...serviceRowStyle,
  border: '1px solid #bfdbfe',
  background: '#eff6ff',
}

/**
 * Шаг 5 мастера — выбор услуг и расчёт суммы.
 * Сохраняет услуги как снапшот { serviceId, name, price } (ADR-21-02).
 *
 * @param {{
 *   vehicleComponent: string,
 *   setValue: Function,
 *   currentServices: Array,
 * }} props
 */
function WizardStep5Services({ vehicleComponent, setValue, currentServices }) {
  const { data: allServices = [], isLoading } = useServices({
    archived: false,
  })

  // Фильтруем услуги по vehicleComponent (если есть совпадение), иначе показываем все
  const relevant = allServices.filter(
    (s) => !vehicleComponent || !s.vehicleComponent || s.vehicleComponent === vehicleComponent,
  )

  // selectedIds — Set для быстрой проверки
  const [selectedIds, setSelectedIds] = useState(() => {
    return new Set((currentServices ?? []).map((s) => s.serviceId))
  })

  function toggleService(service) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(service.id)) {
        next.delete(service.id)
      } else {
        next.add(service.id)
      }
      return next
    })
  }

  // Синхронизируем setValue при изменении выборки
  useEffect(() => {
    const selected = relevant.filter((s) => selectedIds.has(s.id))
    const snapshot = selected.map((s) => ({
      serviceId: s.id,
      name: s.name,
      price: Number(s.price ?? 0),
    }))
    const total = snapshot.reduce((acc, s) => acc + s.price, 0)
    setValue('services', snapshot, { shouldValidate: false })
    setValue('totalAmount', total, { shouldValidate: false })
  }, [selectedIds, relevant, setValue])

  const currentTotal = relevant
    .filter((s) => selectedIds.has(s.id))
    .reduce((acc, s) => acc + Number(s.price ?? 0), 0)

  return (
    <div data-testid="wizard-step-5">
      <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>
        Шаг 5 из 7 — Услуги
      </h2>

      {isLoading && (
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Загрузка услуг...</p>
      )}

      {!isLoading && relevant.length === 0 && (
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          Нет доступных услуг. Добавьте услуги в каталоге.
        </p>
      )}

      {!isLoading && relevant.length > 0 && (
        <>
          <div data-testid="order-services-list">
            {relevant.map((service) => {
              const isSelected = selectedIds.has(service.id)
              return (
                <div
                  key={service.id}
                  data-testid={`order-service-option-${service.id}`}
                  style={isSelected ? serviceRowSelectedStyle : serviceRowStyle}
                  onClick={() => toggleService(service)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleService(service)}
                    style={{ accentColor: '#2563eb', width: '16px', height: '16px' }}
                  />
                  <span style={{ flex: 1, fontSize: '14px', color: '#1e293b' }}>
                    {service.name}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1d4ed8' }}>
                    {Number(service.price ?? 0).toLocaleString('ru-RU')} ₼
                  </span>
                </div>
              )
            })}
          </div>

          <div
            data-testid="order-services-total"
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '14px', color: '#64748b' }}>
              Выбрано услуг: {selectedIds.size}
            </span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
              Итого: {currentTotal.toLocaleString('ru-RU')} ₼
            </span>
          </div>
        </>
      )}
    </div>
  )
}

export default WizardStep5Services
