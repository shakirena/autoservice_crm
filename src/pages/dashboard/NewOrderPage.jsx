import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/authContext.jsx'
import { useCreateOrder } from '../../hooks/useOrders.js'
import { useClients } from '../../hooks/useClients.js'
import { useVehicles } from '../../hooks/useVehicles.js'
import WizardStep1Client from '../../features/orders/wizard/WizardStep1Client.jsx'
import WizardStep2Vehicle from '../../features/orders/wizard/WizardStep2Vehicle.jsx'
import WizardStep3Component from '../../features/orders/wizard/WizardStep3Component.jsx'
import WizardStep4Params from '../../features/orders/wizard/WizardStep4Params.jsx'
import WizardStep5Services from '../../features/orders/wizard/WizardStep5Services.jsx'
import WizardStep6Summary from '../../features/orders/wizard/WizardStep6Summary.jsx'
import WizardStep7Preview from '../../features/orders/wizard/WizardStep7Preview.jsx'

const TOTAL_STEPS = 7

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageStyle = {
  maxWidth: '680px',
}

const progressBarStyle = {
  height: '4px',
  background: '#e2e8f0',
  borderRadius: '2px',
  marginBottom: '28px',
  overflow: 'hidden',
}

const footerStyle = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'space-between',
  marginTop: '32px',
  paddingTop: '20px',
  borderTop: '1px solid #e2e8f0',
}

const btnSecondaryStyle = {
  padding: '9px 20px',
  background: '#f1f5f9',
  color: '#475569',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
}

const btnPrimaryStyle = {
  padding: '9px 20px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
}

// ─── Main wizard page ─────────────────────────────────────────────────────────

/**
 * NewOrderPage — контейнер 7-шагового мастера создания заказа.
 * Управляет step (useState), единым useForm() и финальным submit.
 * ADR-21-01: wizard state через RHF + useState шагов (не URL-шаги).
 */
function NewOrderPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { mutateAsync: createOrder } = useCreateOrder()
  const { data: clients = [] } = useClients()
  const { data: vehicles = [] } = useVehicles()

  const [step, setStep] = useState(1)
  const [submitError, setSubmitError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Единый экземпляр useForm — живёт в NewOrderPage, пробрасывается в шаги
  const {
    register,
    watch,
    setValue,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      clientId: '',
      vehicleId: '',
      vehicleComponent: '',
      componentParams: {},
      services: [],
      totalAmount: 0,
      date: new Date().toISOString().slice(0, 10),
      status: 'draft',
    },
  })

  const clientId = watch('clientId')
  const vehicleComponent = watch('vehicleComponent')
  const totalAmount = watch('totalAmount')
  const formData = watch()

  // Поля, валидируемые на каждом шаге (для trigger() перед переходом)
  const STEP_FIELDS = {
    1: ['clientId'],
    2: ['vehicleId'],
    3: ['vehicleComponent'],
    4: [],
    5: [],
    6: ['date', 'totalAmount'],
    7: [],
  }

  async function handleNext() {
    const fields = STEP_FIELDS[step]
    if (fields.length > 0) {
      const valid = await trigger(fields)
      if (!valid) return
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1))
  }

  async function onSubmit(values) {
    if (!user?.uid) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const { id } = await createOrder({
        ...values,
        createdBy: user.uid,
      })
      navigate(`/dashboard/orders/${id}`)
    } catch (err) {
      console.error('NewOrderPage submit error:', err)
      setSubmitError(err?.message ?? 'Неизвестная ошибка')
      setIsSubmitting(false)
    }
  }

  const progressPercent = ((step - 1) / (TOTAL_STEPS - 1)) * 100

  return (
    <div data-testid="new-order-page" style={pageStyle}>
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700 }}>
          Новый заказ
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
          Шаг {step} из {TOTAL_STEPS}
        </p>
      </div>

      {/* Progress bar */}
      <div style={progressBarStyle}>
        <div
          data-testid="wizard-progress"
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: '#2563eb',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Step content */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {step === 1 && (
          <WizardStep1Client register={register} errors={errors} setValue={setValue} uid={user?.uid} />
        )}
        {step === 2 && (
          <WizardStep2Vehicle clientId={clientId} register={register} errors={errors} setValue={setValue} />
        )}
        {step === 3 && (
          <WizardStep3Component
            register={register}
            errors={errors}
            currentValue={vehicleComponent}
          />
        )}
        {step === 4 && (
          <WizardStep4Params vehicleComponent={vehicleComponent} register={register} />
        )}
        {step === 5 && (
          <WizardStep5Services
            vehicleComponent={vehicleComponent}
            setValue={setValue}
            currentServices={formData.services}
          />
        )}
        {step === 6 && (
          <WizardStep6Summary register={register} errors={errors} totalAmount={totalAmount} />
        )}
        {step === 7 && (
          <WizardStep7Preview
            formData={formData}
            clients={clients}
            vehicles={vehicles}
            isSubmitting={isSubmitting}
            submitError={submitError}
          />
        )}

        {/* Navigation footer */}
        <div style={footerStyle}>
          {/* Левая кнопка */}
          <div>
            {step > 1 && (
              <button
                data-testid="wizard-back-btn"
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                style={btnSecondaryStyle}
              >
                ← Назад
              </button>
            )}
          </div>

          {/* Правая кнопка */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              data-testid="wizard-cancel-btn"
              type="button"
              onClick={() => navigate('/dashboard/orders')}
              disabled={isSubmitting}
              style={btnSecondaryStyle}
            >
              Отмена
            </button>

            {step < TOTAL_STEPS ? (
              <button
                data-testid="wizard-next-btn"
                type="button"
                onClick={handleNext}
                style={btnPrimaryStyle}
              >
                Далее →
              </button>
            ) : (
              <button
                data-testid="wizard-submit-btn"
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...btnPrimaryStyle,
                  opacity: isSubmitting ? 0.7 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'Сохранение...' : 'Создать заказ'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

export default NewOrderPage
