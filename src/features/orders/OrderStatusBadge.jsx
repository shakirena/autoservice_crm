// ─── Status badge styles ───────────────────────────────────────────────────────

const STATUS_MAP = {
  draft: {
    label: 'Черновик',
    style: {
      background: '#f3f4f6',
      color: '#374151',
      border: '1px solid #d1d5db',
    },
  },
  in_progress: {
    label: 'В работе',
    style: {
      background: '#eff6ff',
      color: '#1d4ed8',
      border: '1px solid #bfdbfe',
    },
  },
  completed: {
    label: 'Выполнен',
    style: {
      background: '#f0fdf4',
      color: '#15803d',
      border: '1px solid #bbf7d0',
    },
  },
}

const baseBadgeStyle = {
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 500,
  whiteSpace: 'nowrap',
}

/**
 * Цветной бейдж статуса заказа.
 *
 * @param {{ status: 'draft'|'in_progress'|'completed' }} props
 */
function OrderStatusBadge({ status }) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.draft
  return (
    <span
      data-testid={`order-status-badge-${status}`}
      style={{ ...baseBadgeStyle, ...cfg.style }}
    >
      {cfg.label}
    </span>
  )
}

export default OrderStatusBadge
