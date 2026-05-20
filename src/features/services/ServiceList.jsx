import { useServices } from '../../hooks/useServiceCatalog.js'
import ServiceCard from './ServiceCard.jsx'

/**
 * Список услуг с поддержкой фильтрации.
 *
 * @param {{
 *   filters: { categoryId?: string, vehicleComponent?: string, archived?: boolean },
 *   isAdmin: boolean,
 *   onEdit: (service: object) => void,
 * }} props
 */
function ServiceList({ filters = {}, isAdmin, onEdit }) {
  const { data: services = [], isLoading, isError, error } = useServices(filters)

  if (isLoading) {
    return <div data-testid="service-list-loading">Загрузка услуг...</div>
  }

  if (isError) {
    return (
      <div data-testid="service-list-error">
        Ошибка загрузки услуг: {error?.message}
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div data-testid="service-list-empty">
        Услуги не найдены.
      </div>
    )
  }

  return (
    <div data-testid="service-list">
      {services.map((svc) => (
        <ServiceCard
          key={svc.id}
          service={svc}
          isAdmin={isAdmin}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}

export default ServiceList
