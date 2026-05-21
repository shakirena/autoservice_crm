// ─── Period options ────────────────────────────────────────────────────────────

const PERIODS = [
  { value: 'today', label: 'Сегодня' },
  { value: 'week',  label: 'Неделя'  },
  { value: 'month', label: 'Месяц'   },
  { value: 'all',   label: 'Всё время' },
]

// ─── Styles ───────────────────────────────────────────────────────────────────

const wrapperStyle = {
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
}

function btnStyle(active) {
  return {
    padding: '7px 16px',
    background: active ? '#2563eb' : '#f1f5f9',
    color: active ? '#fff' : '#475569',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    transition: 'background 0.15s',
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Группа кнопок выбора периода аналитики.
 *
 * @param {{
 *   value: 'today'|'week'|'month'|'all',
 *   onChange: (period: string) => void,
 * }} props
 */
function PeriodFilter({ value, onChange }) {
  return (
    <div data-testid="period-filter" style={wrapperStyle}>
      {PERIODS.map((p) => (
        <button
          key={p.value}
          type="button"
          data-testid={`period-filter-${p.value}`}
          onClick={() => onChange(p.value)}
          style={btnStyle(value === p.value)}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

export default PeriodFilter
