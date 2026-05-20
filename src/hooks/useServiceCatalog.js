import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getServices,
  createService,
  updateService,
  archiveService,
} from '../services/serviceCatalogService.js'

/** Ключ кеша TanStack Query для коллекции serviceCategories */
export const CATEGORIES_QUERY_KEY = ['serviceCategories']

/** Базовый ключ кеша TanStack Query для коллекции services */
export const SERVICES_QUERY_KEY = ['services']

// ── Category hooks ────────────────────────────────────────────────────────────

/**
 * Возвращает список всех категорий услуг.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult<import('../services/serviceCatalogService.js').CategoryDoc[]>}
 */
export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: getCategories,
  })
}

/**
 * Мутация создания категории.
 * При успехе инвалидирует кеш serviceCategories.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
    },
  })
}

/**
 * Мутация обновления категории.
 * При успехе инвалидирует кеш serviceCategories.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
    },
  })
}

/**
 * Мутация удаления категории.
 * При успехе инвалидирует кеши serviceCategories и services
 * (удаление категории может влиять на отображение услуг).
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY })
    },
  })
}

// ── Service hooks ─────────────────────────────────────────────────────────────

/**
 * Возвращает список услуг с опциональной фильтрацией.
 * Фильтры включаются в queryKey — изменение фильтра вызывает новый запрос.
 *
 * @param {{ categoryId?: string, vehicleComponent?: string, archived?: boolean }} [filters]
 * @returns {import('@tanstack/react-query').UseQueryResult<import('../services/serviceCatalogService.js').ServiceDoc[]>}
 */
export function useServices(filters = {}) {
  return useQuery({
    queryKey: [...SERVICES_QUERY_KEY, filters],
    queryFn: () => getServices(filters),
  })
}

/**
 * Мутация создания услуги.
 * При успехе инвалидирует кеш services.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useCreateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY })
    },
  })
}

/**
 * Мутация обновления услуги.
 * При успехе инвалидирует кеш services.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY })
    },
  })
}

/**
 * Мутация архивирования / восстановления услуги (мягкое удаление).
 * При успехе инвалидирует кеш services.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useArchiveService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, archived }) => archiveService(id, archived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY })
    },
  })
}
