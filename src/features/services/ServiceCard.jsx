import { useArchiveService } from '../../hooks/useServiceCatalog.js'
import VehicleComponentBadge from './VehicleComponentBadge.jsx'

/**
 * Карточка одной услуги — отображает имя, цену, узел и действия (для admin).
 *
 * @param {{
 *   service: import('../../services/serviceCatalogService.js').ServiceDoc,
 *   isAdmin: boolean,
 *   onEdit: (service: object) => void,
 * }} props
 */
function ServiceCard({ service, isAdmin, onEdit }) {
  const { mutateAsync: archiveService, isPending: isArchiving } = useArchiveService()

  return (
    <div
      data-testid={`service-card-${service.id}`}
      style={{ opacity: service.archived ? 0.6 : 1 }}
    >
      <div>
        <span data-testid={`service-card-name-${service.id}`}>{service.name}</span>
        <VehicleComponentBadge component={service.vehicleComponent} />
      </div>

      {service.description && (
        <p data-testid={`service-card-description-${service.id}`}>
          {service.description}
        </p>
      )}

      <span data-testid={`service-card-price-${service.id}`}>
        {service.price.toLocaleString('uk-UA')} грн
      </span>

      {isAdmin && (
        <div>
          <button
            type="button"
            data-testid={`service-card-edit-${service.id}`}
            onClick={() => onEdit(service)}
          >
            Редактировать
          </button>
          <button
            type="button"
            data-testid={`service-card-archive-${service.id}`}
            disabled={isArchiving}
            onClick={() => archiveService({ id: service.id, archived: !service.archived })}
          >
            {service.archived ? 'Восстановить' : 'Архивировать'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ServiceCard
