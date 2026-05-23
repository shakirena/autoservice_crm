import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  useCreateService,
  useUpdateService,
  useCategories,
} from '../../hooks/useServiceCatalog.js'
import { VEHICLE_COMPONENTS } from '../../services/serviceCatalogService.js'

/**
 * Форма создания / редактирования услуги.
 * Использует React Hook Form.
 *
 * @param {{ service?: object, onClose: () => void }} props
 *   service — если передан, форма работает в режиме редактирования
 */
function ServiceForm({ service, onClose }) {
  const isEdit = Boolean(service)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: service?.name ?? '',
      description: service?.description ?? '',
      price: service?.price ?? '',     // пустая строка = цена не задана
      categoryId: service?.categoryId ?? '',
      vehicleComponent: service?.vehicleComponent ?? 'other',
    },
  })

  useEffect(() => {
    if (service) {
      reset({
        name: service.name,
        description: service.description ?? '',
        price: service.price ?? '',    // null/undefined → пустая строка
        categoryId: service.categoryId,
        vehicleComponent: service.vehicleComponent ?? 'other',
      })
    }
  }, [service, reset])

  const { data: categories = [] } = useCategories()
  const { mutateAsync: createService } = useCreateService()
  const { mutateAsync: updateService } = useUpdateService()

  async function onSubmit(values) {
    // Пустая строка / пустое значение → null (цена не установлена)
    const priceRaw = values.price
    const price = priceRaw !== '' && priceRaw != null ? Number(priceRaw) : null
    const payload = { ...values, price }
    if (isEdit) {
      await updateService({ id: service.id, data: payload })
    } else {
      await createService(payload)
    }
    onClose()
  }

  return (
    <form data-testid="service-form" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="svc-name">Название</label>
        <input
          id="svc-name"
          data-testid="service-form-name"
          {...register('name', { required: 'Название обязательно' })}
        />
        {errors.name && (
          <span data-testid="service-form-name-error">{errors.name.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="svc-description">Описание</label>
        <textarea
          id="svc-description"
          data-testid="service-form-description"
          {...register('description')}
        />
      </div>

      <div>
        <label htmlFor="svc-price">Цена (₼)</label>
        <input
          id="svc-price"
          type="number"
          min="0"
          step="0.01"
          placeholder="не указана"
          data-testid="service-form-price"
          {...register('price', {
            min: { value: 0, message: 'Цена не может быть отрицательной' },
            validate: (v) =>
              v === '' || v == null || Number(v) >= 0 || 'Цена не может быть отрицательной',
          })}
        />
        {errors.price && (
          <span data-testid="service-form-price-error">{errors.price.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="svc-category">Категория</label>
        <select
          id="svc-category"
          data-testid="service-form-category"
          {...register('categoryId', { required: 'Выберите категорию' })}
        >
          <option value="">— выберите —</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {errors.categoryId && (
          <span data-testid="service-form-category-error">
            {errors.categoryId.message}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="svc-vehicle-component">Узел автомобиля</label>
        <select
          id="svc-vehicle-component"
          data-testid="service-form-vehicle-component"
          {...register('vehicleComponent', { required: 'Выберите узел' })}
        >
          {VEHICLE_COMPONENTS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errors.vehicleComponent && (
          <span data-testid="service-form-vehicle-error">
            {errors.vehicleComponent.message}
          </span>
        )}
      </div>

      <div>
        <button type="button" onClick={onClose} disabled={isSubmitting}>
          Отмена
        </button>
        <button
          type="submit"
          data-testid="service-form-submit"
          disabled={isSubmitting}
        >
          {isEdit ? 'Сохранить' : 'Создать'}
        </button>
      </div>
    </form>
  )
}

export default ServiceForm
