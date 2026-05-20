import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useCreateCategory, useUpdateCategory } from '../../hooks/useServiceCatalog.js'

/**
 * Форма создания / редактирования категории услуг.
 *
 * @param {{ category?: object, onClose: () => void }} props
 */
function CategoryForm({ category, onClose }) {
  const isEdit = Boolean(category)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: category?.name ?? '',
      description: category?.description ?? '',
    },
  })

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description ?? '',
      })
    }
  }, [category, reset])

  const { mutateAsync: createCategory } = useCreateCategory()
  const { mutateAsync: updateCategory } = useUpdateCategory()

  async function onSubmit(values) {
    if (isEdit) {
      await updateCategory({ id: category.id, data: values })
    } else {
      await createCategory(values)
    }
    onClose()
  }

  return (
    <form data-testid="category-form" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="cat-name">Название</label>
        <input
          id="cat-name"
          data-testid="category-form-name"
          {...register('name', { required: 'Название обязательно' })}
        />
        {errors.name && (
          <span data-testid="category-form-name-error">{errors.name.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="cat-description">Описание</label>
        <textarea
          id="cat-description"
          data-testid="category-form-description"
          {...register('description')}
        />
      </div>

      <div>
        <button type="button" onClick={onClose} disabled={isSubmitting}>
          Отмена
        </button>
        <button
          type="submit"
          data-testid="category-form-submit"
          disabled={isSubmitting}
        >
          {isEdit ? 'Сохранить' : 'Создать'}
        </button>
      </div>
    </form>
  )
}

export default CategoryForm
