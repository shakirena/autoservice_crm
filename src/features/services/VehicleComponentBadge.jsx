/** @type {Record<string, { label: string, color: string, background: string }>} */
const COMPONENT_META = {
  engine:      { label: 'Двигатель',    color: '#7c3aed', background: '#ede9fe' },
  gearbox:     { label: 'КПП',          color: '#1d4ed8', background: '#dbeafe' },
  suspension:  { label: 'Подвеска',     color: '#065f46', background: '#d1fae5' },
  brakes:      { label: 'Тормоза',      color: '#b91c1c', background: '#fee2e2' },
  electrics:   { label: 'Электрика',    color: '#92400e', background: '#fef3c7' },
  tires:       { label: 'Шины',         color: '#1e3a5f', background: '#e0f2fe' },
  body:        { label: 'Кузов',        color: '#374151', background: '#f3f4f6' },
  other:       { label: 'Прочее',       color: '#6b7280', background: '#f9fafb' },
}

/**
 * Бейдж, отображающий название узла автомобиля (vehicleComponent enum).
 * Stateless компонент — только отображение.
 *
 * @param {{ component: string }} props
 */
function VehicleComponentBadge({ component }) {
  const meta = COMPONENT_META[component] ?? COMPONENT_META.other

  return (
    <span
      data-testid={`vehicle-component-badge-${component}`}
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
        color: meta.color,
        background: meta.background,
        whiteSpace: 'nowrap',
      }}
    >
      {meta.label}
    </span>
  )
}

export default VehicleComponentBadge
