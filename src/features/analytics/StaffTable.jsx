import { useMemo } from 'react'
import { useUsers } from '../../hooks/useUsers.js'

// ─── Styles ───────────────────────────────────────────────────────────────────

const wrapperStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  padding: '20px 24px',
}

const titleStyle = {
  margin: '0 0 16px',
  fontSize: '15px',
  fontWeight: 600,
  color: '#0f172a',
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px',
}

const thStyle = {
  padding: '8px 12px',
  textAlign: 'left',
  fontWeight: 600,
  color: '#64748b',
  borderBottom: '2px solid #e2e8f0',
  whiteSpace: 'nowrap',
}

const thRightStyle = { ...thStyle, textAlign: 'right' }

const tdStyle = {
  padding: '10px 12px',
  color: '#0f172a',
  borderBottom: '1px solid #f1f5f9',
}

const tdRightStyle = { ...tdStyle, textAlign: 'right' }

const emptyStyle = {
  fontSize: '13px',
  color: '#94a3b8',
  padding: '24px 0',
  textAlign: 'center',
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Таблица статистики сотрудников: имя, заказов, выручка ₼.
 * Resolve uid → displayName выполняется через useUsers() (join клиент-сайд).
 *
 * @param {{ staffStats: import('../../services/analyticsService.js').StaffStat[] }} props
 */
function StaffTable({ staffStats }) {
  const { data: users = [] } = useUsers()

  /** @type {Map<string, string>} uid → displayName */
  const nameMap = useMemo(() => {
    const m = new Map()
    for (const u of users) {
      m.set(u.uid, u.displayName || u.email || u.uid)
    }
    return m
  }, [users])

  return (
    <div data-testid="staff-table" style={wrapperStyle}>
      <p style={titleStyle}>Статистика сотрудников</p>

      {staffStats.length === 0 ? (
        <p style={emptyStyle}>Нет данных за выбранный период</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Сотрудник</th>
              <th style={thRightStyle}>Заказов</th>
              <th style={thRightStyle}>Выручка</th>
            </tr>
          </thead>
          <tbody>
            {staffStats.map((s) => (
              <tr key={s.uid} data-testid="staff-row">
                <td style={tdStyle}>
                  {nameMap.get(s.uid) ?? s.uid}
                </td>
                <td style={tdRightStyle}>{s.count}</td>
                <td style={tdRightStyle}>{s.revenue.toLocaleString('ru-RU')} ₼</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default StaffTable
