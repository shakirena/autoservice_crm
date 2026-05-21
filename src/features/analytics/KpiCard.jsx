// ─── Styles ───────────────────────────────────────────────────────────────────

const cardStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  padding: '20px 24px',
  minWidth: '160px',
  flex: '1 1 160px',
}

const titleStyle = {
  margin: '0 0 8px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const valueStyle = {
  margin: '0 0 4px',
  fontSize: '28px',
  fontWeight: 700,
  color: '#0f172a',
  lineHeight: 1.2,
}

const subtitleStyle = {
  margin: 0,
  fontSize: '12px',
  color: '#94a3b8',
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Карточка одной KPI-метрики.
 *
 * @param {{ title: string, value: string, subtitle?: string, testId?: string }} props
 */
function KpiCard({ title, value, subtitle, testId }) {
  return (
    <div data-testid={testId ?? 'kpi-card'} style={cardStyle}>
      <p style={titleStyle}>{title}</p>
      <p style={valueStyle}>{value}</p>
      {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
    </div>
  )
}

export default KpiCard
