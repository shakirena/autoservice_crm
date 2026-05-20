import OrderStatusBadge from '../OrderStatusBadge.jsx'
import { VEHICLE_COMPONENTS } from './WizardStep3Component.jsx'

// ─── Styles ───────────────────────────────────────────────────────────────────

const sectionStyle = {
  marginBottom: '20px',
  padding: '14px 16px',
  background: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
}

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '8px',
  fontSize: '14px',
}

const labelStyle = {
  color: '#64748b',
  fontWeight: 500,
  minWidth: '140px',
}

const valueStyle = {
  color: '#1e293b',
  textAlign: 'right',
  flex: 1,
}

function PreviewRow({ label, value }) {
  return (
    <div style={rowStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value ?? '—'}</span>
    </div>
  )
}

/**
 * Шаг 7 мастера — превью заказа перед сохранением.
 *
 * @param {{
 *   formData: Object,
 *   clients: import('../../../services/clientsService.js').ClientDoc[],
 *   vehicles: import('../../../services/vehiclesService.js').VehicleDoc[],
 *   isSubmitting: boolean,
 *   submitError: string|null,
 * }} props
 */
function WizardStep7Preview({ formData, clients, vehicles, isSubmitting, submitError }) {
  const client = clients.find((c) => c.id === formData.clientId)
  const vehicle = vehicles.find((v) => v.id === formData.vehicleId)
  const componentLabel =
    VEHICLE_COMPONENTS.find((c) => c.value === formData.vehicleComponent)?.label ??
    formData.vehicleComponent

  return (
    <div data-testid="wizard-step-7">
      <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>
        Шаг 7 из 7 — Проверка заказа
      </h2>

      {/* Основная информация */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
          Основная информация
        </h3>
        <PreviewRow label="Клиент" value={client?.fullName} />
        <PreviewRow
          label="Автомобиль"
          value={vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})` : undefined}
        />
        <PreviewRow label="Узел" value={componentLabel} />
        <PreviewRow label="Дата заказа" value={formData.date} />
        <div style={rowStyle}>
          <span style={labelStyle}>Статус</span>
          <OrderStatusBadge status={formData.status ?? 'draft'} />
        </div>
      </div>

      {/* Параметры узла */}
      {formData.componentParams && Object.keys(formData.componentParams).length > 0 && (
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
            Параметры узла
          </h3>
          {Object.entries(formData.componentParams)
            .filter(([, v]) => v !== '' && v != null)
            .map(([key, value]) => (
              <PreviewRow key={key} label={key} value={String(value)} />
            ))}
        </div>
      )}

      {/* Услуги */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
          Услуги
        </h3>
        {(formData.services ?? []).length === 0 ? (
          <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
            Услуги не выбраны.
          </p>
        ) : (
          <>
            {formData.services.map((s) => (
              <div key={s.serviceId} style={rowStyle}>
                <span style={{ ...labelStyle, minWidth: 'unset', flex: 1 }}>{s.name}</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {Number(s.price).toLocaleString('ru-RU')} ₼
                </span>
              </div>
            ))}
            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: '10px',
                marginTop: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: '16px',
              }}
            >
              <span>Итого</span>
              <span data-testid="wizard-preview-total">
                {Number(formData.totalAmount ?? 0).toLocaleString('ru-RU')} ₼
              </span>
            </div>
          </>
        )}
      </div>

      {/* Submit error */}
      {submitError && (
        <div
          data-testid="wizard-submit-error"
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#991b1b',
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          Ошибка при сохранении: {submitError}
        </div>
      )}

      {isSubmitting && (
        <p
          data-testid="wizard-submitting"
          style={{ color: '#64748b', fontSize: '14px', textAlign: 'center' }}
        >
          Сохранение заказа...
        </p>
      )}
    </div>
  )
}

export default WizardStep7Preview
