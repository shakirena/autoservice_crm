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
 * Шаг 6 мастера — дата заказа и сумма к оплате.
 *
 * @param {{
 *   register: Function,
 *   errors: Object,
 *   totalAmount: number,
 * }} props
 *   totalAmount — авторасчёт из услуг, показывается как подсказка.
 *   Фактическое значение редактируется пользователем и хранится в RHF.
 */
function WizardStep6Summary({ register, errors, totalAmount }) {
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div data-testid="wizard-step-6">
      <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>
        Шаг 6 из 7 — Дата и сумма
      </h2>

      {/* Дата */}
      <div style={{ marginBottom: '24px' }}>
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

      {/* Сумма к оплате — редактируемое поле */}
      <div style={{ marginBottom: '8px' }}>
        <label htmlFor="order-total-amount" style={labelStyle}>
          Сумма к оплате (₼)
        </label>
        <input
          id="order-total-amount"
          data-testid="order-input-total-amount"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          style={errors.totalAmount ? inputErrorStyle : inputStyle}
          {...register('totalAmount', {
            valueAsNumber: true,
            min: { value: 0, message: 'Сумма не может быть отрицательной' },
            validate: (v) =>
              v == null || isNaN(v) || v >= 0 || 'Сумма не может быть отрицательной',
          })}
        />
        {errors.totalAmount && (
          <p style={errorMsgStyle}>{errors.totalAmount.message}</p>
        )}
      </div>

      {/* Авторасчёт из услуг — подсказка */}
      {totalAmount > 0 && (
        <p
          data-testid="order-summary-auto-total"
          style={{ margin: '0 0 20px', fontSize: '12px', color: '#94a3b8' }}
        >
          Авторасчёт из выбранных услуг:{' '}
          <strong style={{ color: '#64748b' }}>
            {Number(totalAmount).toLocaleString('ru-RU')} ₼
          </strong>
          {' '}— можно изменить вручную.
        </p>
      )}
    </div>
  )
}

export default WizardStep6Summary
