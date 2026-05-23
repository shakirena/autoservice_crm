/**
 * VehicleTable — таблица автомобилей с sticky header, striped rows, hover.
 *
 * Feature #57 — Story #59d
 *
 * @param {{
 *   vehicles: import('../../services/vehiclesService.js').VehicleDoc[],
 *   clients: import('../../services/clientsService.js').ClientDoc[],
 *   role: string,
 *   isLoading: boolean,
 *   search: string,
 *   onEdit: (vehicle: object) => void,
 *   onAddFirst: () => void,
 * }} props
 */

import { useState } from 'react'
import {
  tableWrapStyle,
  tableStyle,
  theadStyle,
  thStyle,
  tdStyle,
  rowStyle,
  SkeletonRow,
  EmptyRow,
} from '../../components/ui/DataTable.jsx'

// ─── Column count ─────────────────────────────────────────────────────────────

const COLS = 7

// ─── Vehicle row ──────────────────────────────────────────────────────────────

function VehicleTableRow({ vehicle, index, role, clients, onEdit }) {
  const [hovered, setHovered] = useState(false)
  const canWrite = role === 'admin' || role === 'manager'

  const clientName =
    clients.find((c) => c.id === vehicle.clientId)?.fullName ?? '—'

  const base = rowStyle(index)
  const rowBg = hovered ? '#eff6ff' : base.background

  return (
    <tr
      data-testid={`vehicle-table-row-${vehicle.id}`}
      style={{ ...base, background: rowBg }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Марка / Модель */}
      <td
        data-testid={`vehicle-table-make-model-${vehicle.id}`}
        style={tdStyle}
      >
        {vehicle.make || '—'} {vehicle.model || ''}
      </td>

      {/* Год */}
      <td data-testid={`vehicle-table-year-${vehicle.id}`} style={tdStyle}>
        {vehicle.year || '—'}
      </td>

      {/* Гос. номер */}
      <td data-testid={`vehicle-table-plate-${vehicle.id}`} style={tdStyle}>
        {vehicle.licensePlate || '—'}
      </td>

      {/* VIN */}
      <td
        data-testid={`vehicle-table-vin-${vehicle.id}`}
        style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '13px' }}
      >
        {vehicle.vin || '—'}
      </td>

      {/* Клиент */}
      <td
        data-testid={`vehicle-table-client-${vehicle.id}`}
        style={tdStyle}
      >
        {clientName}
      </td>

      {/* Действия */}
      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
        {canWrite && (
          <button
            data-testid={`btn-edit-vehicle-${vehicle.id}`}
            type="button"
            onClick={() => onEdit(vehicle)}
            style={{
              padding: '4px 10px',
              borderRadius: '5px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
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

// ─── Main component ───────────────────────────────────────────────────────────

function VehicleTable({ vehicles, clients, role, isLoading, search, onEdit, onAddFirst }) {
  const canWrite = role === 'admin' || role === 'manager'

  return (
    <div
      data-testid="vehicles-table"
      style={tableWrapStyle}
    >
      <table style={tableStyle}>
        <thead style={theadStyle}>
          <tr>
            <th style={thStyle}>Марка / Модель</th>
            <th style={thStyle}>Год</th>
            <th style={thStyle}>Гос. номер</th>
            <th style={thStyle}>VIN</th>
            <th style={thStyle}>Клиент</th>
            <th style={thStyle}>Действия</th>
          </tr>
        </thead>

        {/* Skeleton при загрузке */}
        {isLoading && (
          <tbody data-testid="vehicles-skeleton">
            <SkeletonRow cols={COLS} />
            <SkeletonRow cols={COLS} />
            <SkeletonRow cols={COLS} />
          </tbody>
        )}

        {/* Пустое состояние */}
        {!isLoading && vehicles.length === 0 && (
          <tbody>
            <EmptyRow
              cols={COLS}
              testId="vehicles-empty"
              message={
                search
                  ? 'Автомобили не найдены. Попробуйте изменить запрос.'
                  : canWrite
                    ? (
                      <span>
                        Автомобилей пока нет.{' '}
                        <button
                          type="button"
                          onClick={onAddFirst}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563eb',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontSize: '14px',
                            padding: 0,
                          }}
                        >
                          Добавить первый автомобиль
                        </button>
                      </span>
                    )
                    : 'Автомобилей пока нет.'
              }
            />
          </tbody>
        )}

        {/* Строки данных */}
        {!isLoading && vehicles.length > 0 && (
          <tbody>
            {vehicles.map((v, i) => (
              <VehicleTableRow
                key={v.id}
                vehicle={v}
                index={i}
                role={role}
                clients={clients}
                onEdit={onEdit}
              />
            ))}
          </tbody>
        )}
      </table>
    </div>
  )
}

export default VehicleTable
