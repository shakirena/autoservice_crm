import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'

import WizardStep6Summary from '../WizardStep6Summary.jsx'

// ── Wrapper — предоставляет RHF register и errors ────────────────────────────

function Wrapper({ defaultValues = {}, totalAmount = 0 }) {
  const { register, formState: { errors } } = useForm({
    defaultValues: {
      date: '',
      totalAmount: 0,
      ...defaultValues,
    },
  })

  return (
    <WizardStep6Summary
      register={register}
      errors={errors}
      totalAmount={totalAmount}
    />
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WizardStep6Summary', () => {
  it('рендерит заголовок шага 6', () => {
    render(<Wrapper />)
    expect(screen.getByTestId('wizard-step-6')).toBeInTheDocument()
    expect(screen.getByText(/Шаг 6 из 7/)).toBeInTheDocument()
  })

  it('рендерит поле даты заказа', () => {
    render(<Wrapper />)
    expect(screen.getByTestId('order-input-date')).toBeInTheDocument()
  })

  it('рендерит редактируемое поле суммы к оплате', () => {
    render(<Wrapper />)
    const input = screen.getByTestId('order-input-total-amount')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'number')
    expect(input).toHaveAttribute('min', '0')
  })

  it('поле суммы показывает значение из defaultValues', () => {
    render(<Wrapper defaultValues={{ totalAmount: 1500 }} totalAmount={1500} />)
    const input = screen.getByTestId('order-input-total-amount')
    expect(input.value).toBe('1500')
  })

  it('поле суммы по умолчанию равно 0', () => {
    render(<Wrapper defaultValues={{ totalAmount: 0 }} totalAmount={0} />)
    const input = screen.getByTestId('order-input-total-amount')
    expect(input.value).toBe('0')
  })

  it('пользователь может изменить сумму к оплате', async () => {
    render(<Wrapper defaultValues={{ totalAmount: 500 }} totalAmount={500} />)
    const input = screen.getByTestId('order-input-total-amount')
    await userEvent.clear(input)
    await userEvent.type(input, '750')
    expect(input.value).toBe('750')
  })

  it('показывает подсказку авторасчёта когда totalAmount > 0', () => {
    render(<Wrapper totalAmount={1200} defaultValues={{ totalAmount: 1200 }} />)
    expect(screen.getByTestId('order-summary-auto-total')).toBeInTheDocument()
    expect(screen.getByTestId('order-summary-auto-total')).toHaveTextContent('1')
    expect(screen.getByTestId('order-summary-auto-total')).toHaveTextContent('₼')
  })

  it('скрывает подсказку авторасчёта когда totalAmount === 0', () => {
    render(<Wrapper totalAmount={0} />)
    expect(screen.queryByTestId('order-summary-auto-total')).not.toBeInTheDocument()
  })

  it('скрывает подсказку авторасчёта когда totalAmount не передан', () => {
    render(<Wrapper />)
    expect(screen.queryByTestId('order-summary-auto-total')).not.toBeInTheDocument()
  })

  it('label поля суммы содержит ₼', () => {
    render(<Wrapper />)
    expect(screen.getByText(/Сумма к оплате/)).toBeInTheDocument()
    expect(screen.getByText(/₼/)).toBeInTheDocument()
  })
})
