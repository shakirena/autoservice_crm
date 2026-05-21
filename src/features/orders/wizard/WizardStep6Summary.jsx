// ─── Styles ───────────────────────────────────────────────────────────────────

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#374151',
}

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
}

const inputErrorStyle = {
  ...inputStyle,
  borderColor: '#ef4444',
}

const errorMsgStyle = {
  color: '#ef4444',
  fontSize: '12px',
  marginTop: '4px',
}

/**
 * Шаг 6 мастера — дата заказа и итоговая сумма.
 *
 * @param {{
 *   register: Function,
 *   errors: Object,
 *   totalAmount: number,
 * }} props
 */
function WizardStep6Summary({ register, errors, totalAmount }) {
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div data-testid="wizard-step-6">
      <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>
        Шаг 6 из 7 — Дата и сумма
      </h2>

      {/* Дата */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="order-date" style={labelStyle}>
          Дата заказа <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          id="order-date"
          data-testid="order-input-date"
          type="date"
          max={today}
          style={errors.date ? inputErrorStyle : inputStyle}
          {...register('date', { required: 'Укажите дату заказа' })}
        />
        {errors.date && (
          <p style={errorMsgStyle}>{errors.date.message}</p>
        )}
      </div>

      {/* Итоговая сумма (read-only display) */}
      <div
        data-testid="order-summary-total"
        style={{
          padding: '16px 20px',
          background: '#f8fafc',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid #e2e8f0',
        }}
      >
        <span style={{ fontSize: '15px', color: '#374151', fontWeight: 500 }}>
          Итоговая сумма
        </span>
        <span
          data-testid="order-summary-total-amount"
          style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}
        >
          {Number(totalAmount ?? 0).toLocaleString('ru-RU')} ₼
        </span>
      </div>

      <p style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
        Сумма рассчитана автоматически на основе выбранных услуг.
        Для изменения вернитесь к шагу 5.
      </p>
    </div>
  )
}

export default WizardStep6Summary
