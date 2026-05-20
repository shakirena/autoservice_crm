/**
 * Одна строка таблицы автомобилей.
 *
 * @param {{
 *   vehicle: import('../../services/vehiclesService.js').VehicleDoc,
 *   role: string,
 *   clients: import('../../services/clientsService.js').ClientDoc[],
 *   onEdit: (vehicle: object) => void,
 * }} props
 */

const tdStyle = {
  padding: '12px 16px',
  borderBottom: '1px solid #e5e7eb',
  fontSize: '14px',
  verticalAlign: 'middle',
}

const btnStyle = {
  padding: '5px 10px',
  borderRadius: '5px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
}

function VehicleRow({ vehicle, role, clients, onEdit }) {
  const canWrite = role === 'admin' || role === 'manager'

  const clientName =
    clients.find((c) => c.id === vehicle.clientId)?.fullName ?? '—'

  return (
    <tr data-testid={`vehicle-row-${vehicle.id}`}>
      <td data-testid={`vehicle-cell-make-${vehicle.id}`} style={tdStyle}>
        {vehicle.make || '—'}
      </td>
      <td data-testid={`vehicle-cell-model-${vehicle.id}`} style={tdStyle}>
        {vehicle.model || '—'}
      </td>
      <td data-testid={`vehicle-cell-year-${vehicle.id}`} style={tdStyle}>
        {vehicle.year || '—'}
      </td>
      <td data-testid={`vehicle-cell-plate-${vehicle.id}`} style={tdStyle}>
        {vehicle.licensePlate || '—'}
      </td>
      <td
        data-testid={`vehicle-cell-vin-${vehicle.id}`}
        style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '13px' }}
      >
        {vehicle.vin || '—'}
      </td>
      <td data-testid={`vehicle-cell-client-${vehicle.id}`} style={tdStyle}>
        {clientName}
      </td>
      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
        {canWrite && (
          <button
            data-testid={`btn-edit-vehicle-${vehicle.id}`}
            type="button"
            onClick={() => onEdit(vehicle)}
            style={{
              ...btnStyle,
              background: '#dbeafe',
              color: '#1e40af',
            }}
          >
            Редактировать
          </button>
        )}
      </td>
    </tr>
  )
}

export default VehicleRow
