import { useState } from 'react'
import { useAuth } from '../../lib/authContext.jsx'
import CategoryList from '../../features/services/CategoryList.jsx'
import CategoryForm from '../../features/services/CategoryForm.jsx'
import ServiceList from '../../features/services/ServiceList.jsx'
import ServiceForm from '../../features/services/ServiceForm.jsx'
import { VEHICLE_COMPONENTS } from '../../services/serviceCatalogService.js'

const pageStyle = {
  maxWidth: '1100px',
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '20px',
  flexWrap: 'wrap',
  gap: '12px',
}

const addBtnStyle = {
  padding: '8px 18px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
}

const selectStyle = {
  padding: '6px 10px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  background: '#fff',
  cursor: 'pointer',
}

function ServicesPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editCategory, setEditCategory] = useState(null)

  const [showServiceForm, setShowServiceForm] = useState(false)
  const [editService, setEditService] = useState(null)

  const [filters, setFilters] = useState({
    categoryId: undefined,
    vehicleComponent: undefined,
    archived: false,
  })

  function handleEditCategory(cat) {
    setEditCategory(cat)
    setShowCategoryForm(true)
  }

  function handleCloseCategoryForm() {
    setShowCategoryForm(false)
    setEditCategory(null)
  }

  function handleEditService(svc) {
    setEditService(svc)
    setShowServiceForm(true)
  }

  function handleCloseServiceForm() {
    setShowServiceForm(false)
    setEditService(null)
  }

  function handleVehicleComponentFilter(e) {
    const value = e.target.value || undefined
    setFilters((prev) => ({ ...prev, vehicleComponent: value }))
  }

  function handleArchivedToggle(e) {
    setFilters((prev) => ({ ...prev, archived: e.target.checked }))
  }

  return (
    <div data-testid="services-page" style={pageStyle}>
      {/* ── Categories section ── */}
      <section>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            Категории услуг
          </h2>
          {isAdmin && (
            <button
              type="button"
              data-testid="add-category-button"
              style={addBtnStyle}
              onClick={() => setShowCategoryForm(true)}
            >
              + Добавить категорию
            </button>
          )}
        </div>

        <CategoryList isAdmin={isAdmin} onEdit={handleEditCategory} />
      </section>

      {/* ── Services section ── */}
      <section style={{ marginTop: '32px' }}>
        <div style={headerStyle}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>
            Услуги
          </h1>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              data-testid="filter-vehicle-component"
              style={selectStyle}
              value={filters.vehicleComponent ?? ''}
              onChange={handleVehicleComponentFilter}
            >
              <option value="">Все узлы</option>
              {VEHICLE_COMPONENTS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                data-testid="filter-archived"
                checked={filters.archived}
                onChange={handleArchivedToggle}
              />
              Показать архивные
            </label>

            {isAdmin && (
              <button
                type="button"
                data-testid="add-service-button"
                style={addBtnStyle}
                onClick={() => setShowServiceForm(true)}
              >
                + Добавить услугу
              </button>
            )}
          </div>
        </div>

        <ServiceList
          filters={filters}
          isAdmin={isAdmin}
          onEdit={handleEditService}
        />
      </section>

      {showCategoryForm && (
        <CategoryForm
          category={editCategory}
          onClose={handleCloseCategoryForm}
        />
      )}

      {showServiceForm && (
        <ServiceForm
          service={editService}
          onClose={handleCloseServiceForm}
        />
      )}
    </div>
  )
}

export default ServicesPage
