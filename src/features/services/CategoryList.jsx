import { useCategories, useDeleteCategory } from '../../hooks/useServiceCatalog.js'

/**
 * @param {{ isAdmin: boolean, onEdit: (category: object) => void }} props
 */
function CategoryList({ isAdmin, onEdit }) {
  const { data: categories = [], isLoading, isError, error } = useCategories()
  const { mutateAsync: deleteCategory, isPending: isDeleting } = useDeleteCategory()

  if (isLoading) {
    return <div data-testid="category-list-loading">Загрузка категорий...</div>
  }

  if (isError) {
    return (
      <div data-testid="category-list-error">
        Ошибка загрузки категорий: {error?.message}
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div data-testid="category-list-empty">
        Категории не добавлены.
      </div>
    )
  }

  return (
    <ul data-testid="category-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {categories.map((cat) => (
        <li key={cat.id} data-testid={`category-item-${cat.id}`}>
          <span>{cat.name}</span>
          {isAdmin && (
            <>
              <button
                type="button"
                data-testid={`category-edit-${cat.id}`}
                onClick={() => onEdit(cat)}
              >
                Редактировать
              </button>
              <button
                type="button"
                data-testid={`category-delete-${cat.id}`}
                disabled={isDeleting}
                onClick={() => deleteCategory(cat.id)}
              >
                Удалить
              </button>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}

export default CategoryList
