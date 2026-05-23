/**
 * Unit-тесты для DataTable примитивов.
 * Feature #57 — Story #58
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  rowStyle,
  SkeletonRow,
  EmptyRow,
  ErrorRow,
} from '../DataTable.jsx'

// ─── rowStyle ─────────────────────────────────────────────────────────────────

describe('rowStyle', () => {
  it('возвращает background #ffffff для чётного индекса (0)', () => {
    expect(rowStyle(0).background).toBe('#ffffff')
  })

  it('возвращает background #f9fafb для нечётного индекса (1)', () => {
    expect(rowStyle(1).background).toBe('#f9fafb')
  })

  it('возвращает background #ffffff для чётного индекса (2)', () => {
    expect(rowStyle(2).background).toBe('#ffffff')
  })

  it('возвращает background #f9fafb для нечётного индекса (3)', () => {
    expect(rowStyle(3).background).toBe('#f9fafb')
  })

  it('возвращает объект с полем transition', () => {
    const style = rowStyle(0)
    expect(style).toHaveProperty('transition')
  })
})

// ─── SkeletonRow ──────────────────────────────────────────────────────────────

describe('SkeletonRow', () => {
  it('рендерит N ячеек при cols=3', () => {
    render(
      <table>
        <tbody>
          <SkeletonRow cols={3} />
        </tbody>
      </table>,
    )
    // каждая ячейка — td с div внутри
    const cells = document.querySelectorAll('tbody tr td')
    expect(cells).toHaveLength(3)
  })

  it('рендерит N ячеек при cols=6', () => {
    render(
      <table>
        <tbody>
          <SkeletonRow cols={6} />
        </tbody>
      </table>,
    )
    const cells = document.querySelectorAll('tbody tr td')
    expect(cells).toHaveLength(6)
  })

  it('рендерит одну строку', () => {
    render(
      <table>
        <tbody>
          <SkeletonRow cols={4} />
        </tbody>
      </table>,
    )
    const rows = document.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(1)
  })
})

// ─── EmptyRow ─────────────────────────────────────────────────────────────────

describe('EmptyRow', () => {
  it('рендерит сообщение по умолчанию "Нет данных"', () => {
    render(
      <table>
        <tbody>
          <EmptyRow cols={3} />
        </tbody>
      </table>,
    )
    expect(screen.getByText('Нет данных')).toBeInTheDocument()
  })

  it('рендерит кастомный message', () => {
    render(
      <table>
        <tbody>
          <EmptyRow cols={3} message="Услуги не найдены" />
        </tbody>
      </table>,
    )
    expect(screen.getByText('Услуги не найдены')).toBeInTheDocument()
  })

  it('рендерит ячейку с colSpan равным cols', () => {
    render(
      <table>
        <tbody>
          <EmptyRow cols={5} />
        </tbody>
      </table>,
    )
    const td = document.querySelector('tbody tr td')
    expect(td).toHaveAttribute('colspan', '5')
  })

  it('рендерит с data-testid если передан', () => {
    render(
      <table>
        <tbody>
          <EmptyRow cols={3} testId="empty-row" />
        </tbody>
      </table>,
    )
    expect(screen.getByTestId('empty-row')).toBeInTheDocument()
  })
})

// ─── ErrorRow ─────────────────────────────────────────────────────────────────

describe('ErrorRow', () => {
  it('рендерит переданный message', () => {
    render(
      <table>
        <tbody>
          <ErrorRow cols={3} message="Ошибка загрузки услуг" />
        </tbody>
      </table>,
    )
    expect(screen.getByText('Ошибка загрузки услуг')).toBeInTheDocument()
  })

  it('показывает текст красным цветом (#ef4444)', () => {
    render(
      <table>
        <tbody>
          <ErrorRow cols={3} message="Ошибка" />
        </tbody>
      </table>,
    )
    const td = document.querySelector('tbody tr td')
    expect(td).toHaveStyle({ color: '#ef4444' })
  })

  it('рендерит с data-testid если передан', () => {
    render(
      <table>
        <tbody>
          <ErrorRow cols={3} message="Ошибка" testId="error-row" />
        </tbody>
      </table>,
    )
    expect(screen.getByTestId('error-row')).toBeInTheDocument()
  })

  it('рендерит ячейку с colSpan равным cols', () => {
    render(
      <table>
        <tbody>
          <ErrorRow cols={4} message="Ошибка" />
        </tbody>
      </table>,
    )
    const td = document.querySelector('tbody tr td')
    expect(td).toHaveAttribute('colspan', '4')
  })
})
