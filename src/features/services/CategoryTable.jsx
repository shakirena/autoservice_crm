import { useState } from 'react'
import {
  tableWrapStyle,
  tableStyle,
  theadStyle,
  thStyle,
  tdStyle,
  rowBackground,
  SkeletonRow,
  EmptyRow,
  ErrorRow,
} from '../../components/ui/DataTable.jsx'
import { useCategories, useDeleteCategory } from '../../hooks/useServiceCatalog.js'

/** Русские подписи узлов автомобиля */
const COMPONENT_LABELS = {
  engine:     'Двигатель',
  gearbox:    'КПП',
  suspension: 'Подвеска',
  brakes:     'Тормоза',
  electrics:  'Электрика',
  tires:      'Шины',
  body:       'Кузов',
  other:      'Прочее',
}

const COLS = 4 // Название | Описание | Узел | Действия

const actionBtnStyle = {
  padding: '4px 10px',
  fontSize: '12px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 500,
}

/**
 * Таблица категорий услуг.
 *
 * @param {{
 *   isAdmin: boolean,
 *   onEdit: (category: object) => void,
 * }} props
 */
function CategoryTable({ isAdmin, onEdit }) {
  const { data: categories = [], isLoading, isError, error } = useCategories()
  const { mutateAsync: deleteCategory, isPending: isDeleting } = useDeleteCategory()

  const [hoveredId, setHoveredId] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  async function handleDelete(cat) {
    setDeleteError(null)
    try {
      await deleteCategory(cat.id)
    } catch (err) {
      setDeleteError(err?.message ?? 'Ошибка удаления категории')
    }
  }

  return (
    <>
      {deleteError && (
        <p
          data-testid="category-table-delete-error"
          style={{ color: '#ef4444', fontSize: '13px', marginBottom: '8px' }}
        >
          {deleteError}
        </p>
      )}

      <div data-testid="category-table-wrap" style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead style={theadStyle}>
            <tr>
              <th style={thStyle}>Название</th>
              <th style={thStyle}>Описание</th>
              <th style={thStyle}>Узел</th>
              {isAdmin && <th style={{ ...thStyle, textAlign: 'right' }}>Действия</th>}
            </tr>
          </thead>

          <tbody>
            {isLoading && (
              <>
                <SkeletonRow cols={isAdmin ? COLS : COLS - 1} />
                <SkeletonRow cols={isAdmin ? COLS : COLS - 1} />
                <SkeletonRow cols={isAdmin ? COLS : COLS - 1} />
              </>
            )}

            {isError && (
              <ErrorRow
                cols={isAdmin ? COLS : COLS - 1}
                message={`Ошибка загрузки категорий: ${error?.message}`}
                testId="category-table-error"
              />
            )}

            {!isLoading && !isError && categories.length === 0 && (
              <EmptyRow
                cols={isAdmin ? COLS : COLS - 1}
                message="Категории не добавлены."
                testId="category-table-empty"
              />
            )}

            {!isLoading && !isError && categories.map((cat, index) => (
              <tr
                key={cat.id}
                data-testid={`category-table-row-${cat.id}`}
                style={{
                  background: rowBackground(index, hoveredId === cat.id),
                  transition: 'background 0.15s',
                }}
                onMouseEnter={() => setHoveredId(cat.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <td style={{ ...tdStyle, fontWeight: 500 }}>
                  <span data-testid={`category-table-name-${cat.id}`}>
                    {cat.name}
                  </span>
                </td>

                <td style={{ ...tdStyle, color: '#6b7280' }}>
                  <span data-testid={`category-table-description-${cat.id}`}>
                    {cat.description || '—'}
                  </span>
                </td>

                <td style={tdStyle}>
                  <span
                    data-testid={`category-table-component-${cat.id}`}
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: '#eff6ff',
                      color: '#1d4ed8',
                    }}
                  >
                    {COMPONENT_LABELS[cat.vehicleComponent] ?? cat.vehicleComponent}
                  </span>
                </td>

                {isAdmin && (
                  <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      data-testid={`category-table-edit-${cat.id}`}
                      style={{ ...actionBtnStyle, background: '#e0e7ff', color: '#3730a3', marginRight: '6px' }}
                      onClick={() => onEdit(cat)}
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      data-testid={`category-table-delete-${cat.id}`}
                      disabled={isDeleting}
                      style={{ ...actionBtnStyle, background: '#fee2e2', color: '#b91c1c', opacity: isDeleting ? 0.6 : 1 }}
                      onClick={() => handleDelete(cat)}
                    >
                      Удалить
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default CategoryTable
