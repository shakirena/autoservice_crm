/**
 * DataTable — общие стили и утилиты для таблиц данных.
 *
 * Не является самостоятельным компонентом-оберткой — экспортирует
 * style-константы и вспомогательные компоненты для переиспользования
 * в ServiceTable, VehicleTable, OrderTable.
 *
 * Feature #57 — Story #58
 */

// Этот файл намеренно экспортирует как компоненты, так и style-константы.
// Fast refresh не затрагивает данный utility-модуль.
/* eslint-disable react-refresh/only-export-components */

// ─── Wrapper ──────────────────────────────────────────────────────────────────

/** Стиль контейнера таблицы */
export const tableWrapStyle = {
  width: '100%',
  overflowX: 'auto',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
}

// ─── Table ────────────────────────────────────────────────────────────────────

export const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '14px',
}

// ─── Header ───────────────────────────────────────────────────────────────────

export const theadStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 1,
  background: '#f9fafb',
}

export const thStyle = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '2px solid #e5e7eb',
  whiteSpace: 'nowrap',
}

export const thRightStyle = { ...thStyle, textAlign: 'right' }
export const thCenterStyle = { ...thStyle, textAlign: 'center' }

// ─── Cells ────────────────────────────────────────────────────────────────────

export const tdStyle = {
  padding: '10px 14px',
  borderBottom: '1px solid #f3f4f6',
  color: '#374151',
  verticalAlign: 'middle',
}

export const tdRightStyle = { ...tdStyle, textAlign: 'right' }
export const tdCenterStyle = { ...tdStyle, textAlign: 'center' }

// ─── Row background ───────────────────────────────────────────────────────────

/**
 * Возвращает стиль строки с чередованием цвета и hover.
 *
 * @param {number} index — индекс строки (0-based)
 * @returns {object} inline style объект
 */
export function rowStyle(index) {
  return {
    background: index % 2 === 0 ? '#ffffff' : '#f9fafb',
    transition: 'background 0.15s',
    cursor: 'default',
  }
}

/**
 * Вычисляет background-цвет строки с учётом hover и striped.
 *
 * @param {number}  index   — индекс строки (0-based)
 * @param {boolean} hovered — true если мышь над строкой
 * @returns {string} CSS color
 */
export function rowBackground(index, hovered) {
  if (hovered) return '#eff6ff'
  return index % 2 === 1 ? '#f9fafb' : '#ffffff'
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

/**
 * Одна ячейка-скелетон для строки загрузки.
 *
 * @param {{ width?: number|string }} props
 */
export function SkeletonCell({ width = 80 }) {
  return (
    <td style={tdStyle}>
      <div
        style={{
          height: '14px',
          background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
          backgroundSize: '200% 100%',
          borderRadius: '4px',
          width,
        }}
      />
    </td>
  )
}

/**
 * Строка-скелетон с заданным числом ячеек.
 *
 * @param {{ cols: number, widths?: (number|string)[] }} props
 */
export function SkeletonRow({ cols, widths = [] }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonCell key={i} width={widths[i] ?? (i === 0 ? '60%' : '80%')} />
      ))}
    </tr>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

/**
 * Строка пустого состояния таблицы.
 *
 * @param {{ cols: number, message?: string, testId?: string }} props
 */
export function EmptyRow({ cols, message = 'Нет данных', testId }) {
  return (
    <tr>
      <td
        data-testid={testId}
        colSpan={cols}
        style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af', padding: '32px 14px' }}
      >
        {message}
      </td>
    </tr>
  )
}

// ─── Error state ──────────────────────────────────────────────────────────────

/**
 * Строка ошибки таблицы.
 *
 * @param {{ cols: number, message: string, testId?: string }} props
 */
export function ErrorRow({ cols, message, testId }) {
  return (
    <tr>
      <td
        data-testid={testId}
        colSpan={cols}
        style={{ ...tdStyle, textAlign: 'center', color: '#ef4444', padding: '32px 14px' }}
      >
        {message}
      </td>
    </tr>
  )
}
