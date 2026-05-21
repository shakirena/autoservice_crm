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
 * Таблица топ-услуг: название, количество, выручка ₼.
 *
 * @param {{ services: import('../../services/analyticsService.js').ServiceStat[] }} props
 */
function TopServicesTable({ services }) {
  return (
    <div data-testid="top-services-table" style={wrapperStyle}>
      <p style={titleStyle}>Топ услуг</p>

      {services.length === 0 ? (
        <p style={emptyStyle}>Нет данных за выбранный период</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Услуга</th>
              <th style={thRightStyle}>Кол-во</th>
              <th style={thRightStyle}>Выручка</th>
            </tr>
          </thead>
          <tbody>
            {services.map((svc, idx) => (
              <tr key={svc.name} data-testid="top-services-row">
                <td style={tdStyle}>
                  <span style={{ color: '#94a3b8', marginRight: '8px', fontSize: '12px' }}>
                    {idx + 1}.
                  </span>
                  {svc.name}
                </td>
                <td style={tdRightStyle}>{svc.count}</td>
                <td style={tdRightStyle}>{svc.revenue.toLocaleString('ru-RU')} ₼</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default TopServicesTable
