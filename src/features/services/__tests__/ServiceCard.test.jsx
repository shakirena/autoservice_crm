import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('../../../hooks/useServiceCatalog.js', () => ({
  useArchiveService: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

import ServiceCard from '../ServiceCard.jsx'

// ── Fixtures ───────────────────────────────────────────────────────────────────

const baseService = {
  id: 'svc1',
  name: 'Замена масла',
  description: 'Полная замена масла',
  price: 500,
  vehicleComponent: 'engine',
  archived: false,
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('ServiceCard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('рендерит название услуги', () => {
    render(<ServiceCard service={baseService} isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByTestId('service-card-name-svc1')).toHaveTextContent('Замена масла')
  })

  it('отображает цену с форматированием когда price — число', () => {
    render(<ServiceCard service={baseService} isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByTestId('service-card-price-svc1')).toHaveTextContent('500')
    expect(screen.getByTestId('service-card-price-svc1')).toHaveTextContent('₼')
  })

  it('отображает «Цена не указана» когда price === null', () => {
    const svc = { ...baseService, price: null }
    render(<ServiceCard service={svc} isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByTestId('service-card-price-svc1')).toHaveTextContent('Цена не указана')
  })

  it('отображает «Цена не указана» когда price === undefined', () => {
    const svc = { ...baseService, price: undefined }
    render(<ServiceCard service={svc} isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByTestId('service-card-price-svc1')).toHaveTextContent('Цена не указана')
  })

  it('отображает «Цена не указана» когда price === 0 — нет, 0 это валидная цена', () => {
    const svc = { ...baseService, price: 0 }
    render(<ServiceCard service={svc} isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByTestId('service-card-price-svc1')).toHaveTextContent('₼')
    expect(screen.queryByText('Цена не указана')).not.toBeInTheDocument()
  })

  it('скрывает кнопки редактирования для не-admin', () => {
    render(<ServiceCard service={baseService} isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.queryByTestId('service-card-edit-svc1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('service-card-archive-svc1')).not.toBeInTheDocument()
  })

  it('показывает кнопки редактирования для admin', () => {
    render(<ServiceCard service={baseService} isAdmin={true} onEdit={vi.fn()} />)
    expect(screen.getByTestId('service-card-edit-svc1')).toBeInTheDocument()
    expect(screen.getByTestId('service-card-archive-svc1')).toBeInTheDocument()
  })

  it('вызывает onEdit при клике на кнопку «Редактировать»', async () => {
    const onEdit = vi.fn()
    render(<ServiceCard service={baseService} isAdmin={true} onEdit={onEdit} />)
    await userEvent.click(screen.getByTestId('service-card-edit-svc1'))
    expect(onEdit).toHaveBeenCalledWith(baseService)
  })

  it('показывает «Восстановить» для архивной услуги', () => {
    const svc = { ...baseService, archived: true }
    render(<ServiceCard service={svc} isAdmin={true} onEdit={vi.fn()} />)
    expect(screen.getByTestId('service-card-archive-svc1')).toHaveTextContent('Восстановить')
  })

  it('показывает «Архивировать» для активной услуги', () => {
    render(<ServiceCard service={baseService} isAdmin={true} onEdit={vi.fn()} />)
    expect(screen.getByTestId('service-card-archive-svc1')).toHaveTextContent('Архивировать')
  })

  it('рендерит описание когда оно есть', () => {
    render(<ServiceCard service={baseService} isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.getByTestId('service-card-description-svc1')).toHaveTextContent('Полная замена масла')
  })

  it('не рендерит описание когда его нет', () => {
    const svc = { ...baseService, description: '' }
    render(<ServiceCard service={svc} isAdmin={false} onEdit={vi.fn()} />)
    expect(screen.queryByTestId('service-card-description-svc1')).not.toBeInTheDocument()
  })
})
