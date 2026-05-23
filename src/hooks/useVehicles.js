import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getVehicles,
  getVehiclesByClient,
  createVehicle,
  updateVehicle,
} from '../services/vehiclesService.js'

/** Ключ кеша TanStack Query для коллекции vehicles */
export const VEHICLES_QUERY_KEY = ['vehicles']

/**
 * Возвращает список всех автомобилей (отсортированных по createdAt desc).
 *
 * @returns {import('@tanstack/react-query').UseQueryResult<import('../services/vehiclesService.js').VehicleDoc[]>}
 */
export function useVehicles() {
  return useQuery({
    queryKey: VEHICLES_QUERY_KEY,
    queryFn: getVehicles,
  })
}

/**
 * Возвращает список автомобилей конкретного клиента (отсортированных по createdAt desc).
 *
 * @param {string} clientId
 * @returns {import('@tanstack/react-query').UseQueryResult<import('../services/vehiclesService.js').VehicleDoc[]>}
 */
export function useVehiclesByClient(clientId) {
  return useQuery({
    queryKey: [...VEHICLES_QUERY_KEY, 'byClient', clientId],
    queryFn: () => getVehiclesByClient(clientId),
    enabled: Boolean(clientId),
  })
}

/**
 * Мутация создания автомобиля.
 * При успехе инвалидирует кеш vehicles.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useCreateVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      // return промис — mutateAsync ждёт завершения рефетча перед резолвом
      return queryClient.invalidateQueries({ queryKey: VEHICLES_QUERY_KEY })
    },
  })
}

/**
 * Мутация обновления автомобиля.
 * При успехе инвалидирует кеш vehicles.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateVehicle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICLES_QUERY_KEY })
    },
  })
}
