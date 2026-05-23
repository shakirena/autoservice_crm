/**
 * ServiceTable — таблица каталога услуг.
 *
 * Колонки: Название | Категория | Узел | Цена | Статус | Действия
 * Поддерживает: striped rows, hover, sticky header, loading skeleton, empty state, error state.
 *
 * Feature #57 — Story #59
 *
 * @param {{
 *   filters: { categoryId?: string, vehicleComponent?: string, archived?: boolean },
 *   isAdmin: boolean,
 *   onEdit: (service: object) => void,
 * }} props
 */

import { useState } from 'react'
import { useServices, useCategories, useArchiveService } from '../../hooks/useServiceCatalog.js'
import VehicleComponentBadge from './VehicleComponentBadge.jsx'
import {
  tableWrapStyle,
  tableStyle,
  theadStyle,
  thStyle,
  tdStyle,
  rowStyle,
  SkeletonRow,
  EmptyRow,
  ErrorRow,
} from '../../components/ui/DataTable.jsx'

// ─── Column count ─────────────────────────────────────────────────────────────

const COLS = 6

// ─── Action button styles ─────────────────────────────────────────────────────

const btnBase = {
  padding: '4px 10px',
  borderRadius: '5px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
  marginRight: '6px',
}

const btnEdit = {
  ...btnBase,
  background: '#dbeafe',
  color: '#1e40af',
}

const btnArchive = {
  ...btnBase,
  background: '#f3f4f6',
  color: '#374151',
}

const btnRestore = {
  ...btnBase,
  background: '#d1fae5',
  color: '#065f46',
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ archived }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        background: archived ? '#f3f4f6' : '#d1fae5',
        color: archived ? '#6b7280' : '#065f46',
      }}
    >
      {archived ? 'Архив' : 'Активна'}
    </span>
  )
}

// ─── Service row ──────────────────────────────────────────────────────────────

function ServiceRow({ service, index, isAdmin, onEdit, categories }) {
  const [hovered, setHovered] = useState(false)
  const { mutateAsync: archiveService, isPending: isArchiving } = useArchiveService()

  const categoryName =
    categories.find((c) => c.id === service.categoryId)?.name ?? '—'

  const price =
    service.price != null
      ? `${service.price.toLocaleString('ru-RU')} ₼`
      : 'Не указана'

  const base = rowStyle(index)
  const rowBg = hovered ? '#eff6ff' : base.background

  return (
    <tr
      data-testid={`service-table-row-${service.id}`}
      style={{ ...base, background: rowBg }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Название */}
      <td data-testid={`service-table-name-${service.id}`} style={tdStyle}>
        {service.name}
      </td>

      {/* Категория */}
      <td style={tdStyle}>{categoryName}</td>

      {/* Узел */}
      <td style={tdStyle}>
        {service.vehicleComponent ? (
          <VehicleComponentBadge component={service.vehicleComponent} />
        ) : (
          '—'
        )}
      </td>

      {/* Цена */}
      <td
        data-testid={`service-table-price-${service.id}`}
        style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
      >
        {price}
      </td>

      {/* Статус */}
      <td data-testid={`service-table-status-${service.id}`} style={tdStyle}>
        <StatusBadge archived={service.archived} />
      </td>

      {/* Действия */}
      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
        {isAdmin && (
          <>
            <button
              type="button"
              data-testid={`service-table-edit-${service.id}`}
              style={btnEdit}
              onClick={() => onEdit(service)}
            >
              Редактировать
            </button>
            <button
              type="button"
              data-testid={`service-table-archive-${service.id}`}
              style={service.archived ? btnRestore : btnArchive}
              disabled={isArchiving}
              onClick={() =>
                archiveService({ id: service.id, archived: !service.archived })
              }
            >
              {service.archived ? 'Восстановить' : 'Архивировать'}
            </button>
          </>
        )}
      </td>
    </tr>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

function ServiceTable({ filters = {}, isAdmin, onEdit }) {
  const { data: services = [], isLoading, isError, error } = useServices(filters)
  const { data: categories = [] } = useCategories()

  return (
    <div style={tableWrapStyle}>
      <table data-testid="service-table" style={tableStyle}>
        <thead style={theadStyle}>
          <tr>
            <th style={thStyle}>Название</th>
            <th style={thStyle}>Категория</th>
            <th style={thStyle}>Узел</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Цена</th>
            <th style={thStyle}>Статус</th>
            <th style={thStyle}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <>
              <SkeletonRow cols={COLS} />
              <SkeletonRow cols={COLS} />
              <SkeletonRow cols={COLS} />
            </>
          )}

          {!isLoading && isError && (
            <ErrorRow
              cols={COLS}
              message={`Ошибка загрузки услуг: ${error?.message ?? 'Неизвестная ошибка'}`}
            />
          )}

          {!isLoading && !isError && services.length === 0 && (
            <EmptyRow cols={COLS} message="Услуги не найдены" />
          )}

          {!isLoading &&
            !isError &&
            services.map((svc, i) => (
              <ServiceRow
                key={svc.id}
                service={svc}
                index={i}
                isAdmin={isAdmin}
                onEdit={onEdit}
                categories={categories}
              />
            ))}
        </tbody>
      </table>
    </div>
  )
}

export default ServiceTable
